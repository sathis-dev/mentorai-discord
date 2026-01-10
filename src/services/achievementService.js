/**
 * Achievement Service - Event-Driven Achievement System
 * 
 * Features:
 * - Comprehensive achievement definitions
 * - Event-based checking
 * - XP rewards by rarity
 * - Progress tracking
 */

import { User } from '../database/models/User.js';

export class AchievementService {
  constructor() {
    /**
     * Achievement definitions
     */
    this.achievements = {
      // ============== STREAK ACHIEVEMENTS ==============
      STREAK_3: {
        id: 'streak_3',
        name: '🔥 On Fire',
        description: 'Maintain a 3-day streak',
        category: 'streak',
        rarity: 'common',
        xp: 75,
        condition: (user) => user.streak >= 3
      },
      STREAK_7: {
        id: 'streak_7',
        name: '⚡ Week Warrior',
        description: 'Maintain a 7-day streak',
        category: 'streak',
        rarity: 'uncommon',
        xp: 200,
        condition: (user) => user.streak >= 7
      },
      STREAK_14: {
        id: 'streak_14',
        name: '💪 Fortnight Fighter',
        description: 'Maintain a 14-day streak',
        category: 'streak',
        rarity: 'rare',
        xp: 400,
        condition: (user) => user.streak >= 14
      },
      STREAK_30: {
        id: 'streak_30',
        name: '🏆 Monthly Master',
        description: 'Maintain a 30-day streak',
        category: 'streak',
        rarity: 'epic',
        xp: 1000,
        condition: (user) => user.streak >= 30
      },
      STREAK_100: {
        id: 'streak_100',
        name: '👑 Century Legend',
        description: 'Maintain a 100-day streak',
        category: 'streak',
        rarity: 'legendary',
        xp: 5000,
        condition: (user) => user.streak >= 100
      },
      
      // ============== QUIZ ACHIEVEMENTS ==============
      QUIZ_FIRST: {
        id: 'quiz_first',
        name: '🎯 Quiz Starter',
        description: 'Complete your first quiz',
        category: 'quiz',
        rarity: 'common',
        xp: 50,
        condition: (user) => (user.quizzesTaken || 0) >= 1
      },
      QUIZ_10: {
        id: 'quiz_10',
        name: '📝 Quiz Fan',
        description: 'Complete 10 quizzes',
        category: 'quiz',
        rarity: 'uncommon',
        xp: 150,
        condition: (user) => (user.quizzesTaken || 0) >= 10
      },
      QUIZ_50: {
        id: 'quiz_50',
        name: '🧠 Quiz Master',
        description: 'Complete 50 quizzes',
        category: 'quiz',
        rarity: 'rare',
        xp: 400,
        condition: (user) => (user.quizzesTaken || 0) >= 50
      },
      QUIZ_100: {
        id: 'quiz_100',
        name: '🎓 Quiz Expert',
        description: 'Complete 100 quizzes',
        category: 'quiz',
        rarity: 'epic',
        xp: 1000,
        condition: (user) => (user.quizzesTaken || 0) >= 100
      },
      QUIZ_PERFECT: {
        id: 'quiz_perfect',
        name: '💯 Perfectionist',
        description: 'Get 100% on a quiz',
        category: 'quiz',
        rarity: 'uncommon',
        xp: 100,
        condition: (user, data) => data?.perfect === true
      },
      QUIZ_PERFECT_5: {
        id: 'quiz_perfect_5',
        name: '✨ Flawless',
        description: 'Get 5 perfect scores',
        category: 'quiz',
        rarity: 'rare',
        xp: 300,
        condition: (user) => (user.perfectQuizzes || 0) >= 5
      },
      
      // ============== ACCURACY ACHIEVEMENTS ==============
      ACCURACY_80: {
        id: 'accuracy_80',
        name: '🎯 Sharpshooter',
        description: 'Maintain 80% accuracy over 50+ questions',
        category: 'accuracy',
        rarity: 'uncommon',
        xp: 200,
        condition: (user) => {
          if ((user.totalQuestions || 0) < 50) return false;
          const accuracy = user.correctAnswers / user.totalQuestions;
          return accuracy >= 0.8;
        }
      },
      ACCURACY_90: {
        id: 'accuracy_90',
        name: '🏹 Precision Master',
        description: 'Maintain 90% accuracy over 100+ questions',
        category: 'accuracy',
        rarity: 'rare',
        xp: 500,
        condition: (user) => {
          if ((user.totalQuestions || 0) < 100) return false;
          const accuracy = user.correctAnswers / user.totalQuestions;
          return accuracy >= 0.9;
        }
      },
      
      // ============== LEVEL ACHIEVEMENTS ==============
      LEVEL_5: {
        id: 'level_5',
        name: '⭐ Rising Star',
        description: 'Reach level 5',
        category: 'level',
        rarity: 'common',
        xp: 100,
        condition: (user) => user.level >= 5
      },
      LEVEL_10: {
        id: 'level_10',
        name: '🌟 Shining Bright',
        description: 'Reach level 10',
        category: 'level',
        rarity: 'uncommon',
        xp: 200,
        condition: (user) => user.level >= 10
      },
      LEVEL_25: {
        id: 'level_25',
        name: '💫 Superstar',
        description: 'Reach level 25',
        category: 'level',
        rarity: 'rare',
        xp: 500,
        condition: (user) => user.level >= 25
      },
      LEVEL_50: {
        id: 'level_50',
        name: '🌠 Half Century',
        description: 'Reach level 50',
        category: 'level',
        rarity: 'epic',
        xp: 1000,
        condition: (user) => user.level >= 50
      },
      LEVEL_100: {
        id: 'level_100',
        name: '👑 Centurion',
        description: 'Reach level 100',
        category: 'level',
        rarity: 'legendary',
        xp: 5000,
        condition: (user) => user.level >= 100
      },
      
      // ============== TOPIC ACHIEVEMENTS ==============
      TOPICS_5: {
        id: 'topics_5',
        name: '📚 Explorer',
        description: 'Study 5 different topics',
        category: 'topics',
        rarity: 'common',
        xp: 100,
        condition: (user) => (user.topicsStudied?.length || 0) >= 5
      },
      TOPICS_10: {
        id: 'topics_10',
        name: '🗺️ Adventurer',
        description: 'Study 10 different topics',
        category: 'topics',
        rarity: 'uncommon',
        xp: 250,
        condition: (user) => (user.topicsStudied?.length || 0) >= 10
      },
      TOPICS_20: {
        id: 'topics_20',
        name: '🌍 World Learner',
        description: 'Study 20 different topics',
        category: 'topics',
        rarity: 'rare',
        xp: 500,
        condition: (user) => (user.topicsStudied?.length || 0) >= 20
      },
      
      // ============== MULTIPLAYER ACHIEVEMENTS ==============
      CHALLENGE_FIRST: {
        id: 'challenge_first',
        name: '⚔️ First Battle',
        description: 'Complete your first 1v1 challenge',
        category: 'multiplayer',
        rarity: 'common',
        xp: 75,
        condition: (user, data) => data?.challengeComplete === true
      },
      CHALLENGE_WIN: {
        id: 'challenge_win',
        name: '🏆 Champion',
        description: 'Win a 1v1 challenge',
        category: 'multiplayer',
        rarity: 'uncommon',
        xp: 150,
        condition: (user, data) => data?.challengeWin === true
      },
      CHALLENGE_WINS_10: {
        id: 'challenge_wins_10',
        name: '🥊 Fighter',
        description: 'Win 10 challenges',
        category: 'multiplayer',
        rarity: 'rare',
        xp: 400,
        condition: (user) => (user.multiplayerStats?.challenges?.wins || 0) >= 10
      },
      ARENA_FIRST: {
        id: 'arena_first',
        name: '🏟️ Arena Debut',
        description: 'Participate in your first arena',
        category: 'multiplayer',
        rarity: 'common',
        xp: 50,
        condition: (user) => (user.arenaStats?.played || 0) >= 1
      },
      ARENA_WIN: {
        id: 'arena_win',
        name: '👑 Arena Victor',
        description: 'Win an arena battle',
        category: 'multiplayer',
        rarity: 'rare',
        xp: 300,
        condition: (user, data) => data?.arenaWin === true
      },
      ARENA_PODIUM: {
        id: 'arena_podium',
        name: '🥇 Podium Finisher',
        description: 'Finish in top 3 in an arena',
        category: 'multiplayer',
        rarity: 'uncommon',
        xp: 150,
        condition: (user, data) => data?.arenaPodium === true
      },
      
      // ============== PRESTIGE ACHIEVEMENTS ==============
      PRESTIGE_1: {
        id: 'prestige_1',
        name: '🥉 Bronze Scholar',
        description: 'Reach Prestige 1',
        category: 'prestige',
        rarity: 'rare',
        xp: 500,
        condition: (user) => (user.prestige?.level || 0) >= 1
      },
      PRESTIGE_5: {
        id: 'prestige_5',
        name: '💠 Diamond Scholar',
        description: 'Reach Prestige 5',
        category: 'prestige',
        rarity: 'epic',
        xp: 2000,
        condition: (user) => (user.prestige?.level || 0) >= 5
      },
      PRESTIGE_10: {
        id: 'prestige_10',
        name: '👑 Transcendent',
        description: 'Reach Maximum Prestige',
        category: 'prestige',
        rarity: 'legendary',
        xp: 10000,
        condition: (user) => (user.prestige?.level || 0) >= 10
      },
      
      // ============== SPECIAL ACHIEVEMENTS ==============
      FIRST_LESSON: {
        id: 'first_lesson',
        name: '📖 First Steps',
        description: 'Complete your first lesson',
        category: 'learning',
        rarity: 'common',
        xp: 50,
        condition: (user) => (user.completedLessons?.length || 0) >= 1
      },
      NIGHT_OWL: {
        id: 'night_owl',
        name: '🦉 Night Owl',
        description: 'Complete a quiz after midnight',
        category: 'special',
        rarity: 'uncommon',
        xp: 100,
        condition: (user, data) => data?.lateNight === true
      },
      EARLY_BIRD: {
        id: 'early_bird',
        name: '🐦 Early Bird',
        description: 'Complete a quiz before 6 AM',
        category: 'special',
        rarity: 'uncommon',
        xp: 100,
        condition: (user, data) => data?.earlyMorning === true
      }
    };

    /**
     * Event handlers mapping
     */
    this.eventHandlers = {
      'quiz_completed': this.checkQuizAchievements.bind(this),
      'daily_claimed': this.checkStreakAchievements.bind(this),
      'level_up': this.checkLevelAchievements.bind(this),
      'challenge_completed': this.checkChallengeAchievements.bind(this),
      'arena_completed': this.checkArenaAchievements.bind(this),
      'lesson_completed': this.checkLessonAchievements.bind(this),
      'prestige': this.checkPrestigeAchievements.bind(this)
    };
  }

  /**
   * Handle achievement event
   * @param {string} event - Event name
   * @param {Object} user - User document
   * @param {Object} eventData - Event-specific data
   * @returns {Array} New achievements earned
   */
  async handleEvent(event, user, eventData = {}) {
    const handler = this.eventHandlers[event];
    if (!handler) return [];

    return await handler(user, eventData);
  }

  /**
   * Check all achievements for user
   * @param {Object} user - User document
   * @param {Object} eventData - Optional event data
   * @returns {Array} New achievements
   */
  async checkAllAchievements(user, eventData = {}) {
    const newAchievements = [];

    for (const [key, achievement] of Object.entries(this.achievements)) {
      if (!this.hasAchievement(user, achievement.id)) {
        try {
          if (achievement.condition(user, eventData)) {
            const awarded = await this.awardAchievement(user, achievement);
            if (awarded) newAchievements.push(achievement);
          }
        } catch (error) {
          console.error(`Error checking achievement ${key}:`, error);
        }
      }
    }

    return newAchievements;
  }

  /**
   * Check quiz-related achievements
   */
  async checkQuizAchievements(user, quizData) {
    const newAchievements = [];
    const quizAchievements = [
      'QUIZ_FIRST', 'QUIZ_10', 'QUIZ_50', 'QUIZ_100',
      'QUIZ_PERFECT', 'QUIZ_PERFECT_5',
      'ACCURACY_80', 'ACCURACY_90',
      'TOPICS_5', 'TOPICS_10', 'TOPICS_20'
    ];

    for (const achievementId of quizAchievements) {
      const achievement = this.achievements[achievementId];
      if (!achievement) continue;
      
      if (!this.hasAchievement(user, achievement.id)) {
        if (achievement.condition(user, quizData)) {
          await this.awardAchievement(user, achievement);
          newAchievements.push(achievement);
        }
      }
    }

    // Check time-based achievements
    if (quizData?.timestamp) {
      const hour = new Date(quizData.timestamp).getHours();
      
      if (hour >= 0 && hour < 5) {
        const nightOwl = this.achievements.NIGHT_OWL;
        if (!this.hasAchievement(user, nightOwl.id)) {
          await this.awardAchievement(user, nightOwl);
          newAchievements.push(nightOwl);
        }
      }
      
      if (hour >= 4 && hour < 6) {
        const earlyBird = this.achievements.EARLY_BIRD;
        if (!this.hasAchievement(user, earlyBird.id)) {
          await this.awardAchievement(user, earlyBird);
          newAchievements.push(earlyBird);
        }
      }
    }

    return newAchievements;
  }

  /**
   * Check streak achievements
   */
  async checkStreakAchievements(user, streakData) {
    const newAchievements = [];
    const streakAchievements = [
      'STREAK_3', 'STREAK_7', 'STREAK_14', 'STREAK_30', 'STREAK_100'
    ];

    for (const achievementId of streakAchievements) {
      const achievement = this.achievements[achievementId];
      if (!achievement) continue;
      
      if (!this.hasAchievement(user, achievement.id)) {
        if (achievement.condition(user, streakData)) {
          await this.awardAchievement(user, achievement);
          newAchievements.push(achievement);
        }
      }
    }

    return newAchievements;
  }

  /**
   * Check level achievements
   */
  async checkLevelAchievements(user, levelData) {
    const newAchievements = [];
    const levelAchievements = [
      'LEVEL_5', 'LEVEL_10', 'LEVEL_25', 'LEVEL_50', 'LEVEL_100'
    ];

    for (const achievementId of levelAchievements) {
      const achievement = this.achievements[achievementId];
      if (!achievement) continue;
      
      if (!this.hasAchievement(user, achievement.id)) {
        if (achievement.condition(user, levelData)) {
          await this.awardAchievement(user, achievement);
          newAchievements.push(achievement);
        }
      }
    }

    return newAchievements;
  }

  /**
   * Check challenge achievements
   */
  async checkChallengeAchievements(user, challengeData) {
    const newAchievements = [];
    const challengeAchievements = [
      'CHALLENGE_FIRST', 'CHALLENGE_WIN', 'CHALLENGE_WINS_10'
    ];

    for (const achievementId of challengeAchievements) {
      const achievement = this.achievements[achievementId];
      if (!achievement) continue;
      
      if (!this.hasAchievement(user, achievement.id)) {
        if (achievement.condition(user, challengeData)) {
          await this.awardAchievement(user, achievement);
          newAchievements.push(achievement);
        }
      }
    }

    return newAchievements;
  }

  /**
   * Check arena achievements
   */
  async checkArenaAchievements(user, arenaData) {
    const newAchievements = [];
    const arenaAchievements = [
      'ARENA_FIRST', 'ARENA_WIN', 'ARENA_PODIUM'
    ];

    for (const achievementId of arenaAchievements) {
      const achievement = this.achievements[achievementId];
      if (!achievement) continue;
      
      if (!this.hasAchievement(user, achievement.id)) {
        if (achievement.condition(user, arenaData)) {
          await this.awardAchievement(user, achievement);
          newAchievements.push(achievement);
        }
      }
    }

    return newAchievements;
  }

  /**
   * Check lesson achievements
   */
  async checkLessonAchievements(user, lessonData) {
    const achievement = this.achievements.FIRST_LESSON;
    
    if (!this.hasAchievement(user, achievement.id)) {
      if (achievement.condition(user, lessonData)) {
        await this.awardAchievement(user, achievement);
        return [achievement];
      }
    }

    return [];
  }

  /**
   * Check prestige achievements
   */
  async checkPrestigeAchievements(user, prestigeData) {
    const newAchievements = [];
    const prestigeAchievements = ['PRESTIGE_1', 'PRESTIGE_5', 'PRESTIGE_10'];

    for (const achievementId of prestigeAchievements) {
      const achievement = this.achievements[achievementId];
      if (!achievement) continue;
      
      if (!this.hasAchievement(user, achievement.id)) {
        if (achievement.condition(user, prestigeData)) {
          await this.awardAchievement(user, achievement);
          newAchievements.push(achievement);
        }
      }
    }

    return newAchievements;
  }

  /**
   * Award achievement to user
   * @param {Object} user - User document
   * @param {Object} achievement - Achievement data
   * @returns {boolean} Success
   */
  async awardAchievement(user, achievement) {
    if (!user.achievements) {
      user.achievements = [];
    }

    // Check if already has achievement (by ID or name for backwards compat)
    if (this.hasAchievement(user, achievement.id)) {
      return false;
    }

    // Add achievement
    user.achievements.push({
      id: achievement.id,
      name: achievement.name,
      description: achievement.description,
      category: achievement.category,
      rarity: achievement.rarity,
      earnedAt: new Date(),
      xp: achievement.xp
    });

    // Award XP
    if (achievement.xp) {
      user.xp = (user.xp || 0) + achievement.xp;
      
      // Check for level up
      const xpForNext = Math.floor(100 * Math.pow(1.5, (user.level || 1) - 1));
      while (user.xp >= xpForNext) {
        user.xp -= xpForNext;
        user.level = (user.level || 1) + 1;
      }
    }

    await user.save();
    return true;
  }

  /**
   * Check if user has achievement
   * @param {Object} user - User document
   * @param {string} achievementId - Achievement ID
   * @returns {boolean}
   */
  hasAchievement(user, achievementId) {
    if (!user.achievements) return false;
    
    return user.achievements.some(a => 
      a.id === achievementId || 
      a.name === this.achievements[achievementId]?.name ||
      a === this.achievements[achievementId]?.name // Legacy string format
    );
  }

  /**
   * Get user's achievement progress
   * @param {Object} user - User document
   * @returns {Object} Progress data
   */
  getAchievementProgress(user) {
    const categories = {};
    let total = 0;
    let earned = 0;

    for (const [key, achievement] of Object.entries(this.achievements)) {
      const category = achievement.category;
      
      if (!categories[category]) {
        categories[category] = { total: 0, earned: 0, achievements: [] };
      }

      categories[category].total++;
      total++;

      const hasIt = this.hasAchievement(user, achievement.id);
      if (hasIt) {
        categories[category].earned++;
        earned++;
      }

      categories[category].achievements.push({
        ...achievement,
        earned: hasIt
      });
    }

    return {
      total,
      earned,
      percentage: total > 0 ? Math.round((earned / total) * 100) : 0,
      categories
    };
  }

  /**
   * Get achievements by rarity
   * @param {string} rarity - Rarity level
   * @returns {Array} Achievements
   */
  getAchievementsByRarity(rarity) {
    return Object.values(this.achievements).filter(a => a.rarity === rarity);
  }

  /**
   * Get recent achievements
   * @param {Object} user - User document
   * @param {number} limit - Max achievements to return
   * @returns {Array} Recent achievements
   */
  getRecentAchievements(user, limit = 5) {
    if (!user.achievements) return [];

    return [...user.achievements]
      .filter(a => a.earnedAt)
      .sort((a, b) => new Date(b.earnedAt) - new Date(a.earnedAt))
      .slice(0, limit);
  }

  /**
   * Get rarity color
   * @param {string} rarity - Rarity level
   * @returns {string} Hex color
   */
  getRarityColor(rarity) {
    const colors = {
      common: '#9CA3AF',
      uncommon: '#10B981',
      rare: '#3B82F6',
      epic: '#8B5CF6',
      legendary: '#F59E0B'
    };
    return colors[rarity] || colors.common;
  }

  /**
   * Get rarity emoji
   * @param {string} rarity - Rarity level
   * @returns {string} Emoji
   */
  getRarityEmoji(rarity) {
    const emojis = {
      common: '⚪',
      uncommon: '🟢',
      rare: '🔵',
      epic: '🟣',
      legendary: '🟡'
    };
    return emojis[rarity] || emojis.common;
  }
}

export default AchievementService;
