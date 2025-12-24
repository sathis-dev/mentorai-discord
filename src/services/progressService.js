import { User } from '../database/models/User.js';
import { Progress } from '../database/models/Progress.js';
import { Achievement } from '../database/models/Achievement.js';

export async function getUserProgress(userId) {
  let user = await User.findOne({ discordId: userId });
  
  if (!user) {
    user = await User.create({
      discordId: userId
    });
  }

  const accuracy = user.totalQuestions > 0
    ? Math.round((user.correctAnswers / user.totalQuestions) * 100)
    : 0;

  const recentAchievements = [];
  if (user.achievements.length > 0) {
    const achievementIds = user.achievements
      .sort((a, b) => b.unlockedAt - a.unlockedAt)
      .slice(0, 3)
      .map(a => a.id);

    const achievements = await Achievement.find({
      id: { $in: achievementIds }
    });

    recentAchievements.push(...achievements);
  }

  return {
    level: user.level,
    totalXp: user.totalXp,
    xpProgress: user.currentXp,
    xpNeeded: user.xpForNextLevel(),
    streak: user.currentStreak,
    longestStreak: user.longestStreak,
    lessonsCompleted: user.lessonsCompleted,
    quizzesCompleted: user.quizzesCompleted,
    quizzesPassed: user.quizzesPassed,
    accuracy,
    recentAchievements
  };
}

export async function getServerLeaderboard(guildId, limit = 10) {
  const users = await User.find()
    .sort({ totalXp: -1 })
    .limit(limit)
    .lean();

  return users.map((user, index) => ({
    rank: index + 1,
    discordId: user.discordId,
    username: user.username,
    level: user.level,
    totalXp: user.totalXp
  }));
}

export async function getSubjectProgress(userId, subject) {
  const progress = await Progress.findOne({
    discordId: userId,
    subject
  });

  if (!progress) {
    return {
      started: false,
      lessonsCompleted: 0,
      totalLessons: 0,
      lastActivity: null
    };
  }

  return {
    started: true,
    lessonsCompleted: progress.lessonsCompleted.length,
    lessonsViewed: progress.lessonsViewed.length,
    quizzesTaken: progress.quizResults.length,
    averageScore: calculateAverageScore(progress.quizResults),
    lastActivity: progress.updatedAt
  };
}

function calculateAverageScore(quizResults) {
  if (quizResults.length === 0) return 0;
  const total = quizResults.reduce((sum, q) => sum + q.score, 0);
  return Math.round(total / quizResults.length);
}

export default {
  getUserProgress,
  getServerLeaderboard,
  getSubjectProgress
};
