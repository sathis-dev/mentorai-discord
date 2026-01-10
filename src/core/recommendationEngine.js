/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║   MentorAI Recommendation Engine                                              ║
 * ║   AI-Powered Personalized Learning Suggestions                                ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 * 
 * Analyzes user.topicAccuracy, streak, level, and quiz history to provide
 * dynamic, personalized "Suggested Next Step" recommendations.
 */

import { AccuracySystem } from './accuracySystem.js';

/**
 * Recommendation types
 */
const RECOMMENDATION_TYPES = {
  WEAK_SPOT: 'weak_spot',
  STREAK_RISK: 'streak_risk',
  LEVEL_UP: 'level_up',
  NEW_TOPIC: 'new_topic',
  ADVANCE: 'advance',
  DAILY_BONUS: 'daily_bonus',
  ACHIEVEMENT: 'achievement',
  EXPLORE: 'explore'
};

/**
 * Topic display names and emojis
 */
const TOPIC_DISPLAY = {
  'javascript': { name: 'JavaScript', emoji: '🟨' },
  'python': { name: 'Python', emoji: '🐍' },
  'react': { name: 'React', emoji: '⚛️' },
  'node.js': { name: 'Node.js', emoji: '🟢' },
  'nodejs': { name: 'Node.js', emoji: '🟢' },
  'typescript': { name: 'TypeScript', emoji: '🔷' },
  'html': { name: 'HTML', emoji: '🌐' },
  'css': { name: 'CSS', emoji: '🎨' },
  'html and css': { name: 'HTML & CSS', emoji: '🌐' },
  'sql': { name: 'SQL', emoji: '🗃️' },
  'git': { name: 'Git', emoji: '📚' },
  'algorithms': { name: 'Algorithms', emoji: '🧮' },
  'data structures': { name: 'Data Structures', emoji: '📊' },
  'api': { name: 'APIs', emoji: '🔌' },
  'testing': { name: 'Testing', emoji: '🧪' },
  'default': { name: 'Programming', emoji: '💻' }
};

/**
 * Get display info for a topic
 */
function getTopicDisplay(topic) {
  const key = topic.toLowerCase().trim();
  return TOPIC_DISPLAY[key] || { name: topic, emoji: '📖' };
}

/**
 * Format topic name for display
 */
function formatTopicName(topic) {
  const display = getTopicDisplay(topic);
  return `${display.emoji} ${display.name}`;
}

/**
 * RecommendationEngine - Generates personalized learning suggestions
 */
export class RecommendationEngine {
  
  /**
   * Generate a personalized suggestion based on user data
   * @param {Object} user - User document from MongoDB
   * @returns {Object} Suggestion with emoji, text, command, and priority
   */
  static getSuggestion(user) {
    const suggestions = this.generateAllSuggestions(user);
    
    // Sort by priority (higher = more important)
    suggestions.sort((a, b) => b.priority - a.priority);
    
    // Return the highest priority suggestion
    return suggestions[0] || this.getDefaultSuggestion();
  }

  /**
   * Generate all possible suggestions and rank them
   * @param {Object} user - User document
   * @returns {Array} Array of suggestions with priorities
   */
  static generateAllSuggestions(user) {
    const suggestions = [];
    const now = new Date();
    
    // 1. Check for weak spots (HIGHEST PRIORITY)
    const weakSpotSuggestion = this.getWeakSpotSuggestion(user);
    if (weakSpotSuggestion) {
      suggestions.push(weakSpotSuggestion);
    }
    
    // 2. Check streak status
    const streakSuggestion = this.getStreakSuggestion(user, now);
    if (streakSuggestion) {
      suggestions.push(streakSuggestion);
    }
    
    // 3. Check daily bonus
    const dailySuggestion = this.getDailyBonusSuggestion(user, now);
    if (dailySuggestion) {
      suggestions.push(dailySuggestion);
    }
    
    // 4. Check for level-up opportunity
    const levelSuggestion = this.getLevelUpSuggestion(user);
    if (levelSuggestion) {
      suggestions.push(levelSuggestion);
    }
    
    // 5. Check for advancement opportunity
    const advanceSuggestion = this.getAdvancementSuggestion(user);
    if (advanceSuggestion) {
      suggestions.push(advanceSuggestion);
    }
    
    // 6. Suggest new topics
    const newTopicSuggestion = this.getNewTopicSuggestion(user);
    if (newTopicSuggestion) {
      suggestions.push(newTopicSuggestion);
    }
    
    // 7. Achievement progress
    const achievementSuggestion = this.getAchievementSuggestion(user);
    if (achievementSuggestion) {
      suggestions.push(achievementSuggestion);
    }
    
    return suggestions;
  }

  /**
   * Get weak spot suggestion (highest priority)
   */
  static getWeakSpotSuggestion(user) {
    const weakTopics = AccuracySystem.getWeakTopics(user, 60, 3);
    
    if (weakTopics.length === 0) return null;
    
    const weakest = weakTopics[0];
    const display = getTopicDisplay(weakest.topic);
    
    // Determine if quiz or lesson is better
    const needsLesson = weakest.accuracy < 40;
    
    if (needsLesson) {
      return {
        type: RECOMMENDATION_TYPES.WEAK_SPOT,
        emoji: '📖',
        text: `Master your weak spot: Learn ${display.name} fundamentals`,
        command: `/learn ${display.name}`,
        topic: weakest.topic,
        accuracy: weakest.accuracy,
        priority: 100, // Highest priority
        reason: `You're at ${weakest.accuracy}% accuracy in ${display.name}`
      };
    }
    
    return {
      type: RECOMMENDATION_TYPES.WEAK_SPOT,
      emoji: '🎯',
      text: `Improve your ${display.name} skills (${weakest.accuracy}% accuracy)`,
      command: `/quiz ${display.name}`,
      topic: weakest.topic,
      accuracy: weakest.accuracy,
      priority: 95,
      reason: `Practice makes perfect! Re-take the ${display.name} quiz`
    };
  }

  /**
   * Get streak-related suggestion
   */
  static getStreakSuggestion(user, now) {
    const streak = user.streak || 0;
    const lastActive = user.lastActive ? new Date(user.lastActive) : null;
    
    if (!lastActive) return null;
    
    const hoursSinceActive = (now - lastActive) / (1000 * 60 * 60);
    
    // Streak at risk (approaching 48 hours)
    if (hoursSinceActive > 20 && hoursSinceActive < 48) {
      return {
        type: RECOMMENDATION_TYPES.STREAK_RISK,
        emoji: '🔥',
        text: `Protect your ${streak}-day streak! Complete a quick quiz`,
        command: '/quiz JavaScript',
        priority: 90,
        reason: `Your streak expires in ${Math.round(48 - hoursSinceActive)} hours!`
      };
    }
    
    // Streak milestone approaching
    const milestones = [7, 14, 30, 50, 100];
    for (const milestone of milestones) {
      if (streak === milestone - 1) {
        return {
          type: RECOMMENDATION_TYPES.STREAK_RISK,
          emoji: '🏆',
          text: `One more day to reach a ${milestone}-day streak!`,
          command: '/daily',
          priority: 85,
          reason: `Claim your daily bonus to hit the ${milestone}-day milestone!`
        };
      }
    }
    
    return null;
  }

  /**
   * Get daily bonus suggestion
   */
  static getDailyBonusSuggestion(user, now) {
    const lastDaily = user.lastDailyBonus ? new Date(user.lastDailyBonus) : null;
    
    // Get today's midnight UTC
    const todayMidnight = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    
    // Check if already claimed today
    if (lastDaily && lastDaily >= todayMidnight) {
      return null;
    }
    
    const streak = user.dailyBonusStreak || user.streak || 0;
    const baseXp = 75;
    const streakBonus = Math.min(streak * 10, 100);
    const totalXp = baseXp + streakBonus;
    
    return {
      type: RECOMMENDATION_TYPES.DAILY_BONUS,
      emoji: '🎁',
      text: `Claim your daily bonus (+${totalXp} XP!)`,
      command: '/daily',
      priority: 80,
      reason: streak > 0 ? `Day ${streak + 1} streak bonus awaits!` : 'Start your streak today!'
    };
  }

  /**
   * Get level-up opportunity suggestion
   */
  static getLevelUpSuggestion(user) {
    const xp = user.xp || 0;
    const level = user.level || 1;
    const xpNeeded = Math.floor(100 * Math.pow(1.5, level - 1));
    const xpRemaining = xpNeeded - xp;
    const percentComplete = Math.round((xp / xpNeeded) * 100);
    
    // Close to leveling up (>80% progress)
    if (percentComplete >= 80) {
      return {
        type: RECOMMENDATION_TYPES.LEVEL_UP,
        emoji: '⬆️',
        text: `Only ${xpRemaining} XP to Level ${level + 1}! Take a quiz`,
        command: '/quiz',
        priority: 75,
        reason: `You're ${percentComplete}% of the way there!`
      };
    }
    
    return null;
  }

  /**
   * Get advancement suggestion for strong topics
   */
  static getAdvancementSuggestion(user) {
    const strongTopics = AccuracySystem.getStrongTopics(user, 85, 5);
    
    if (strongTopics.length === 0) return null;
    
    const strongest = strongTopics[0];
    const display = getTopicDisplay(strongest.topic);
    
    return {
      type: RECOMMENDATION_TYPES.ADVANCE,
      emoji: '🌟',
      text: `You're a ${display.name} pro (${strongest.accuracy}%)! Try hard mode`,
      command: `/quiz ${display.name} hard`,
      topic: strongest.topic,
      accuracy: strongest.accuracy,
      priority: 60,
      reason: `Challenge yourself with advanced ${display.name} questions!`
    };
  }

  /**
   * Get new topic suggestion
   */
  static getNewTopicSuggestion(user) {
    const studiedTopics = user.topicsStudied || [];
    const allTopics = ['JavaScript', 'Python', 'React', 'Node.js', 'TypeScript', 'SQL', 'Git'];
    
    // Find topics not yet studied
    const newTopics = allTopics.filter(t => 
      !studiedTopics.some(s => s.toLowerCase() === t.toLowerCase())
    );
    
    if (newTopics.length === 0) return null;
    
    // Pick a recommended new topic
    const recommendedTopic = newTopics[0];
    const display = getTopicDisplay(recommendedTopic);
    
    return {
      type: RECOMMENDATION_TYPES.NEW_TOPIC,
      emoji: '🗺️',
      text: `Explore something new: Learn ${display.name}`,
      command: `/learn ${recommendedTopic}`,
      topic: recommendedTopic,
      priority: 50,
      reason: `Expand your skills with ${display.name}!`
    };
  }

  /**
   * Get achievement suggestion
   */
  static getAchievementSuggestion(user) {
    const quizzes = user.quizzesTaken || 0;
    const streak = user.streak || 0;
    const achievements = user.achievements?.length || 0;
    
    // Check for near achievements
    if (quizzes >= 8 && quizzes < 10) {
      return {
        type: RECOMMENDATION_TYPES.ACHIEVEMENT,
        emoji: '🏆',
        text: `${10 - quizzes} more quizzes to unlock an achievement!`,
        command: '/quiz',
        priority: 55,
        reason: 'Complete 10 quizzes to earn the Quiz Master badge!'
      };
    }
    
    if (streak >= 5 && streak < 7) {
      return {
        type: RECOMMENDATION_TYPES.ACHIEVEMENT,
        emoji: '🔥',
        text: `${7 - streak} more days for the Week Warrior achievement!`,
        command: '/daily',
        priority: 55,
        reason: 'Maintain your streak for 7 days!'
      };
    }
    
    return null;
  }

  /**
   * Default suggestion when no specific recommendation
   */
  static getDefaultSuggestion() {
    return {
      type: RECOMMENDATION_TYPES.EXPLORE,
      emoji: '🚀',
      text: 'Start your learning journey with a quiz!',
      command: '/quiz JavaScript',
      priority: 10,
      reason: 'Take a quiz to discover your strengths!'
    };
  }

  /**
   * Generate a full learning report for /insights
   * @param {Object} user - User document
   * @returns {Object} Comprehensive learning report
   */
  static generateLearningReport(user) {
    const accuracyReport = AccuracySystem.generateAccuracyReport(user);
    const suggestions = this.generateAllSuggestions(user);
    
    // Calculate multipliers
    const streak = user.streak || 0;
    const prestigeMultiplier = user.prestige?.bonusMultiplier || 1.0;
    let streakMultiplier = 1.0;
    if (streak >= 30) streakMultiplier = 2.0;
    else if (streak >= 14) streakMultiplier = 1.5;
    else if (streak >= 7) streakMultiplier = 1.25;
    else if (streak >= 3) streakMultiplier = 1.1;
    
    const totalMultiplier = prestigeMultiplier * streakMultiplier;
    
    // Generate skill path
    const skillPath = this.generateSkillPath(user, accuracyReport);
    
    return {
      user: {
        username: user.username,
        level: user.level || 1,
        xp: user.xp || 0,
        streak,
        prestige: user.prestige?.level || 0
      },
      accuracy: accuracyReport,
      multipliers: {
        streak: streakMultiplier,
        prestige: prestigeMultiplier,
        total: totalMultiplier
      },
      suggestions: suggestions.slice(0, 5),
      skillPath,
      topSuggestion: suggestions[0] || this.getDefaultSuggestion()
    };
  }

  /**
   * Generate a skill path based on performance
   */
  static generateSkillPath(user, accuracyReport) {
    const path = [];
    
    // Step 1: Address weak spots
    if (accuracyReport.needsImprovement.length > 0) {
      const weakest = accuracyReport.needsImprovement[0];
      const display = getTopicDisplay(weakest.topic);
      path.push({
        step: 1,
        type: 'improve',
        topic: display.name,
        emoji: display.emoji,
        action: `Master ${display.name} (${weakest.accuracy}% → 70%+)`,
        command: `/learn ${display.name}`
      });
    }
    
    // Step 2: Build on strengths
    if (accuracyReport.topPerformers.length > 0) {
      const strongest = accuracyReport.topPerformers[0];
      const display = getTopicDisplay(strongest.topic);
      path.push({
        step: path.length + 1,
        type: 'advance',
        topic: display.name,
        emoji: display.emoji,
        action: `Advanced ${display.name} challenges`,
        command: `/quiz ${display.name} hard`
      });
    }
    
    // Step 3: Explore new topics
    const studiedTopics = user.topicsStudied || [];
    const allTopics = ['JavaScript', 'Python', 'React', 'Node.js'];
    const newTopic = allTopics.find(t => 
      !studiedTopics.some(s => s.toLowerCase() === t.toLowerCase())
    );
    
    if (newTopic) {
      const display = getTopicDisplay(newTopic);
      path.push({
        step: path.length + 1,
        type: 'explore',
        topic: display.name,
        emoji: display.emoji,
        action: `Explore ${display.name}`,
        command: `/learn ${newTopic}`
      });
    }
    
    return path;
  }

  /**
   * Generate personalized greeting for the mentor
   */
  static generateMentorGreeting(user) {
    const username = user.username || 'learner';
    const streak = user.streak || 0;
    const level = user.level || 1;
    const prestige = user.prestige?.level || 0;
    
    const greetings = [];
    
    // Streak-based greeting
    if (streak >= 30) {
      greetings.push(`${username}, your ${streak}-day streak is legendary! 🔥`);
    } else if (streak >= 7) {
      greetings.push(`${username}, your ${streak}-day streak is impressive! 🎯`);
    } else if (streak >= 3) {
      greetings.push(`${username}, you're building momentum with a ${streak}-day streak!`);
    }
    
    // Level-based greeting
    if (level >= 20) {
      greetings.push(`${username}, Level ${level} coder - you're a true expert! 💻`);
    } else if (level >= 10) {
      greetings.push(`${username}, Level ${level} - your skills are growing fast!`);
    }
    
    // Prestige greeting
    if (prestige > 0) {
      greetings.push(`${username}, Prestige ${prestige} - your dedication shows! ⭐`);
    }
    
    // Default greeting
    if (greetings.length === 0) {
      greetings.push(`Welcome back, ${username}! Ready to level up today?`);
    }
    
    return greetings[Math.floor(Math.random() * greetings.length)];
  }
}

export default RecommendationEngine;
