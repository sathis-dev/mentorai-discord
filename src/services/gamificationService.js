import { User } from '../database/models/User.js';
import { generateMotivation } from '../ai/index.js';

// Event emitter for real-time sync
import { EventEmitter } from 'events';
export const syncEvents = new EventEmitter();

// Broadcast user update to admin panel
function broadcastUserUpdate(user, action = 'update') {
  syncEvents.emit('userUpdate', { user, action, timestamp: new Date() });
}

export const XP_REWARDS = {
  QUIZ_CORRECT: 25,
  QUIZ_COMPLETE: 50,
  QUIZ_PERFECT: 100,
  LESSON_COMPLETE: 40,
  DAILY_BONUS: 75,
  STREAK_BONUS: 15,
  FIRST_QUIZ: 100,
  FIRST_LESSON: 75,
  CHALLENGE_WIN: 150,
  LEVEL_UP: 50
};

export const ACHIEVEMENTS = {
  FIRST_LESSON: { name: '📖 First Steps', desc: 'Complete your first lesson', xpBonus: 50 },
  FIRST_QUIZ: { name: '🎯 Quiz Starter', desc: 'Complete your first quiz', xpBonus: 50 },
  PERFECT_QUIZ: { name: '💯 Perfectionist', desc: 'Get 100% on a quiz', xpBonus: 75 },
  STREAK_3: { name: '🔥 On Fire', desc: '3 day streak', xpBonus: 100 },
  STREAK_7: { name: '⚡ Week Warrior', desc: '7 day streak', xpBonus: 200 },
  STREAK_30: { name: '🏆 Monthly Master', desc: '30 day streak', xpBonus: 500 },
  LEVEL_5: { name: '⭐ Rising Star', desc: 'Reach level 5', xpBonus: 150 },
  LEVEL_10: { name: '🌟 Shining Bright', desc: 'Reach level 10', xpBonus: 300 },
  LEVEL_25: { name: '💫 Superstar', desc: 'Reach level 25', xpBonus: 750 },
  QUIZZES_10: { name: '📝 Quiz Fan', desc: 'Complete 10 quizzes', xpBonus: 200 },
  QUIZZES_50: { name: '🧠 Quiz Master', desc: 'Complete 50 quizzes', xpBonus: 500 },
  ACCURACY_90: { name: '🎯 Sharpshooter', desc: 'Maintain 90% accuracy over 20+ questions', xpBonus: 300 },
  TOPICS_5: { name: '📚 Explorer', desc: 'Study 5 different topics', xpBonus: 150 },
  TOPICS_10: { name: '🗺️ Adventurer', desc: 'Study 10 different topics', xpBonus: 300 }
};

/**
 * Get or create user from MongoDB - ALWAYS fresh from database
 */
export async function getOrCreateUser(discordId, username) {
  try {
    let user = await User.findOne({ discordId });

    if (!user) {
      // Create new user in MongoDB
      user = new User({
        discordId,
        username,
        xp: 0,
        level: 1,
        streak: 0,
        lastActive: new Date(),
        achievements: [],
        completedLessons: [],
        quizzesTaken: 0,
        correctAnswers: 0,
        totalQuestions: 0,
        topicsStudied: [],
        createdAt: new Date()
      });
      await user.save();
      console.log(`✨ Created new user: ${username} (${discordId})`);
      broadcastUserUpdate(user.toObject(), 'create');
    } else if (user.username !== username) {
      // Update username if changed
      user.username = username;
      await user.save();
    }

    return user;
  } catch (error) {
    console.error('Error in getOrCreateUser:', error);
    // Return a minimal user object to prevent crashes
    return {
      discordId,
      username,
      xp: 0,
      level: 1,
      streak: 0,
      achievements: [],
      quizzesTaken: 0,
      correctAnswers: 0,
      totalQuestions: 0,
      topicsStudied: [],
      xpForNextLevel: () => 100,
      addXp: async () => ({ leveledUp: false, newLevel: 1 }),
      updateStreak: async () => 0,
      save: async () => {}
    };
  }
}

/**
 * Get user by Discord ID - fresh from database
 */
export async function getUserById(discordId) {
  try {
    return await User.findOne({ discordId });
  } catch (error) {
    console.error('Error getting user:', error);
    return null;
  }
}

/**
 * Update user and broadcast changes
 */
export async function updateUser(discordId, updates) {
  try {
    const user = await User.findOneAndUpdate(
      { discordId },
      { $set: updates },
      { new: true }
    );
    if (user) {
      broadcastUserUpdate(user.toObject(), 'update');
    }
    return user;
  } catch (error) {
    console.error('Error updating user:', error);
    return null;
  }
}

/**
 * Add XP to user and handle level ups
 */
export async function addXpToUser(discordId, amount, reason = 'Unknown') {
  try {
    const user = await User.findOne({ discordId });
    if (!user) return null;

    const result = await user.addXp(amount);
    console.log(`💫 ${user.username} earned ${amount} XP (${reason}) - Now Level ${user.level} with ${user.xp} XP`);
    
    // Broadcast update to admin panel
    broadcastUserUpdate(user.toObject(), 'xp_update');
    
    return { user, ...result };
  } catch (error) {
    console.error('Error adding XP:', error);
    return null;
  }
}

/**
 * Check and award achievements
 */
export async function checkAchievements(user) {
  if (!user || !user.achievements) return [];

  const newAchievements = [];
  const earned = [...(user.achievements || [])];

  // Helper to add achievement
  const tryAdd = (key) => {
    const ach = ACHIEVEMENTS[key];
    if (ach && !earned.includes(ach.name)) {
      earned.push(ach.name);
      newAchievements.push(ach.name);
      user.xp = (user.xp || 0) + (ach.xpBonus || 0);
    }
  };

  // Streak achievements
  if (user.streak >= 3) tryAdd('STREAK_3');
  if (user.streak >= 7) tryAdd('STREAK_7');
  if (user.streak >= 30) tryAdd('STREAK_30');

  // Level achievements
  if (user.level >= 5) tryAdd('LEVEL_5');
  if (user.level >= 10) tryAdd('LEVEL_10');
  if (user.level >= 25) tryAdd('LEVEL_25');

  // Quiz achievements
  if (user.quizzesTaken >= 10) tryAdd('QUIZZES_10');
  if (user.quizzesTaken >= 50) tryAdd('QUIZZES_50');

  // Accuracy achievement
  if (user.totalQuestions >= 20) {
    const accuracy = user.correctAnswers / user.totalQuestions;
    if (accuracy >= 0.9) tryAdd('ACCURACY_90');
  }

  // Topics achievements
  const topicsCount = user.topicsStudied?.length || 0;
  if (topicsCount >= 5) tryAdd('TOPICS_5');
  if (topicsCount >= 10) tryAdd('TOPICS_10');

  if (newAchievements.length > 0) {
    user.achievements = earned;
    await user.save();
    broadcastUserUpdate(user.toObject(), 'achievement');
  }

  return newAchievements;
}

/**
 * Get leaderboard from MongoDB
 */
export async function getLeaderboard(limit = 10, sortBy = 'xp') {
  try {
    const sortField = sortBy === 'level' ? { level: -1, xp: -1 } : 
                      sortBy === 'streak' ? { streak: -1 } : 
                      { xp: -1 };
    
    return await User.find()
      .sort(sortField)
      .limit(limit)
      .lean();
  } catch (error) {
    console.error('Error getting leaderboard:', error);
    return [];
  }
}

/**
 * Claim daily bonus with AI motivation
 */
export async function claimDailyBonus(user) {
  if (!user) return { success: false, hoursRemaining: 24 };

  const now = new Date();
  const last = new Date(user.lastActive || 0);
  const hoursDiff = (now - last) / (1000 * 60 * 60);

  // Must wait at least 20 hours
  if (hoursDiff < 20) {
    return { success: false, hoursRemaining: Math.ceil(20 - hoursDiff) };
  }

  // Update streak
  await user.updateStreak();

  // Calculate rewards
  const streakBonus = (user.streak || 1) * XP_REWARDS.STREAK_BONUS;
  const totalXp = XP_REWARDS.DAILY_BONUS + streakBonus;

  // Add XP
  const levelResult = await user.addXp(totalXp);

  // Check achievements
  const achievements = await checkAchievements(user);

  // Get AI motivation
  const motivation = await generateMotivation({
    streak: user.streak,
    level: user.level,
    recentActivity: 'Claimed daily bonus'
  });

  await user.save();
  broadcastUserUpdate(user.toObject(), 'daily_bonus');

  return {
    success: true,
    xpEarned: totalXp,
    baseXp: XP_REWARDS.DAILY_BONUS,
    streakBonus,
    streak: user.streak,
    leveledUp: levelResult.leveledUp,
    newLevel: levelResult.newLevel,
    achievements,
    motivation
  };
}

/**
 * Get user stats with AI insights
 */
export async function getUserStats(user) {
  const stats = {
    level: user?.level || 1,
    xp: user?.xp || 0,
    xpToNextLevel: user?.xpForNextLevel?.() || 100,
    streak: user?.streak || 0,
    quizzesTaken: user?.quizzesTaken || 0,
    correctAnswers: user?.correctAnswers || 0,
    totalQuestions: user?.totalQuestions || 0,
    accuracy: user?.totalQuestions > 0 
      ? Math.round((user.correctAnswers / user.totalQuestions) * 100) 
      : 0,
    achievements: user?.achievements || [],
    topicsStudied: user?.topicsStudied || []
  };

  return stats;
}

/**
 * Record quiz completion
 */
export async function recordQuizCompletion(user, correct, total, topic) {
  if (!user) return null;

  user.quizzesTaken = (user.quizzesTaken || 0) + 1;
  user.correctAnswers = (user.correctAnswers || 0) + correct;
  user.totalQuestions = (user.totalQuestions || 0) + total;
  
  // Add topic if not studied before
  if (topic && !user.topicsStudied?.includes(topic)) {
    if (!user.topicsStudied) user.topicsStudied = [];
    user.topicsStudied.push(topic);
  }

  // Calculate XP
  let xpEarned = XP_REWARDS.QUIZ_COMPLETE + (correct * XP_REWARDS.QUIZ_CORRECT);
  if (correct === total) {
    xpEarned += XP_REWARDS.QUIZ_PERFECT;
  }

  // First quiz bonus
  if (user.quizzesTaken === 1) {
    xpEarned += XP_REWARDS.FIRST_QUIZ;
    if (!user.achievements?.includes(ACHIEVEMENTS.FIRST_QUIZ.name)) {
      user.achievements = user.achievements || [];
      user.achievements.push(ACHIEVEMENTS.FIRST_QUIZ.name);
    }
  }

  const levelResult = await user.addXp(xpEarned);
  const achievements = await checkAchievements(user);
  
  await user.save();
  broadcastUserUpdate(user.toObject(), 'quiz_complete');

  return {
    xpEarned,
    leveledUp: levelResult.leveledUp,
    newLevel: levelResult.newLevel,
    achievements
  };
}

/**
 * Record lesson completion
 */
export async function recordLessonCompletion(user, lessonId, topic) {
  if (!user) return null;

  // Check if already completed
  if (user.completedLessons?.includes(lessonId)) {
    return { alreadyCompleted: true, xpEarned: 0 };
  }

  // Add to completed lessons
  if (!user.completedLessons) user.completedLessons = [];
  user.completedLessons.push(lessonId);

  // Add topic if not studied
  if (topic && !user.topicsStudied?.includes(topic)) {
    if (!user.topicsStudied) user.topicsStudied = [];
    user.topicsStudied.push(topic);
  }

  // Calculate XP
  let xpEarned = XP_REWARDS.LESSON_COMPLETE;
  
  // First lesson bonus
  if (user.completedLessons.length === 1) {
    xpEarned += XP_REWARDS.FIRST_LESSON;
    if (!user.achievements?.includes(ACHIEVEMENTS.FIRST_LESSON.name)) {
      user.achievements = user.achievements || [];
      user.achievements.push(ACHIEVEMENTS.FIRST_LESSON.name);
    }
  }

  const levelResult = await user.addXp(xpEarned);
  const achievements = await checkAchievements(user);
  
  await user.save();
  broadcastUserUpdate(user.toObject(), 'lesson_complete');

  return {
    xpEarned,
    leveledUp: levelResult.leveledUp,
    newLevel: levelResult.newLevel,
    achievements
  };
}

/**
 * Get all stats for admin panel
 */
export async function getAllStats() {
  try {
    const [totalUsers, topUsers] = await Promise.all([
      User.countDocuments(),
      User.find().sort({ xp: -1 }).limit(5).lean()
    ]);

    const aggregated = await User.aggregate([
      {
        $group: {
          _id: null,
          totalXp: { $sum: '$xp' },
          avgLevel: { $avg: '$level' },
          avgStreak: { $avg: '$streak' },
          totalQuizzes: { $sum: '$quizzesTaken' }
        }
      }
    ]);

    const stats = aggregated[0] || {};

    return {
      totalUsers,
      totalXp: stats.totalXp || 0,
      avgLevel: Math.round((stats.avgLevel || 1) * 10) / 10,
      avgStreak: Math.round((stats.avgStreak || 0) * 10) / 10,
      totalQuizzes: stats.totalQuizzes || 0,
      topUsers
    };
  } catch (error) {
    console.error('Error getting all stats:', error);
    return {
      totalUsers: 0,
      totalXp: 0,
      avgLevel: 1,
      avgStreak: 0,
      totalQuizzes: 0,
      topUsers: []
    };
  }
}
