/**
 * HelpStateManager - Stateful Knowledge Hub Engine
 * 
 * Manages complex interaction flows for the /help menu with:
 * - RAG-driven personalized suggestions
 * - Global percentile calculations
 * - Multiplier transparency
 * - Atomic state verification
 */

import { User } from '../database/models/User.js';
import { curriculumIndexer } from '../core/curriculumIndexer.js';
import { AccuracySystem } from '../core/accuracySystem.js';
import { xpForLevel } from '../config/brandSystem.js';

class HelpStateManager {
  constructor() {
    // State cache for interaction flows (keyed by interaction.user.id)
    this.stateCache = new Map();
    this.stateTTL = 5 * 60 * 1000; // 5 minute TTL
  }

  /**
   * Get or create state for a user
   */
  getState(userId) {
    if (!this.stateCache.has(userId)) {
      this.stateCache.set(userId, {
        currentView: 'main',
        previousView: null,
        categoryId: null,
        commandName: null,
        lastUpdate: Date.now()
      });
    }
    
    const state = this.stateCache.get(userId);
    state.lastUpdate = Date.now();
    return state;
  }

  /**
   * Update state with navigation tracking
   */
  setState(userId, newState) {
    const current = this.getState(userId);
    const updated = {
      ...current,
      previousView: current.currentView,
      ...newState,
      lastUpdate: Date.now()
    };
    this.stateCache.set(userId, updated);
    return updated;
  }

  /**
   * Navigate back to previous state
   */
  goBack(userId) {
    const state = this.getState(userId);
    if (state.previousView) {
      return this.setState(userId, { currentView: state.previousView });
    }
    return this.setState(userId, { currentView: 'main' });
  }

  /**
   * Clean up expired states
   */
  cleanup() {
    const now = Date.now();
    for (const [userId, state] of this.stateCache) {
      if (now - state.lastUpdate > this.stateTTL) {
        this.stateCache.delete(userId);
      }
    }
  }

  /**
   * Get RAG-driven learning recommendations based on user's weak topics
   * @param {Object} user - User document from MongoDB
   * @returns {Object} Personalized learning recommendations
   */
  async getLearningRecommendations(user) {
    const recommendations = {
      weakTopics: [],
      suggestedLessons: [],
      personalizedCTA: '',
      curriculumCitations: []
    };

    try {
      // Get weak topics from accuracy system
      const weakTopics = AccuracySystem.getWeakTopics(user, 60, 3);
      recommendations.weakTopics = weakTopics.slice(0, 3);

      // Query RAG for relevant curriculum lessons
      if (weakTopics.length > 0) {
        const weakestTopic = weakTopics[0];
        const ragResults = curriculumIndexer.search(weakestTopic.topic, 3);
        
        recommendations.suggestedLessons = ragResults.map(r => ({
          lessonId: r.id,
          title: r.title,
          subject: r.subject,
          difficulty: r.difficulty
        }));

        recommendations.curriculumCitations = ragResults.map(r => r.id);
        
        // Build personalized CTA
        recommendations.personalizedCTA = `According to your **${weakestTopic.accuracy}%** accuracy in **${weakestTopic.topic}**, we recommend: **Lesson ${ragResults[0]?.id || 'JS-01'}** - ${ragResults[0]?.title || 'Fundamentals'}`;
      } else {
        // No weak topics - suggest advancement
        const strongTopics = AccuracySystem.getStrongTopics(user, 80, 5);
        if (strongTopics.length > 0) {
          const advancedResults = curriculumIndexer.search(`advanced ${strongTopics[0].topic}`, 2);
          recommendations.suggestedLessons = advancedResults.map(r => ({
            lessonId: r.id,
            title: r.title,
            subject: r.subject,
            difficulty: r.difficulty
          }));
          recommendations.personalizedCTA = `You're excelling at **${strongTopics[0].topic}** (${strongTopics[0].accuracy}%)! Ready for advanced lessons?`;
        } else {
          recommendations.personalizedCTA = 'Start your learning journey with `/learn` or test yourself with `/quiz`!';
        }
      }
    } catch (error) {
      console.error('Error getting learning recommendations:', error);
      recommendations.personalizedCTA = 'Explore our curriculum with `/learn` or `/quiz`!';
    }

    return recommendations;
  }

  /**
   * Calculate global percentile ranking based on lifetime XP
   * @param {number} lifetimeXP - User's total lifetime XP
   * @returns {Object} Percentile ranking info
   */
  async calculateGlobalPercentile(lifetimeXP) {
    try {
      const [totalUsers, usersBelow] = await Promise.all([
        User.countDocuments({}),
        User.countDocuments({ 'prestige.totalXpEarned': { $lt: lifetimeXP } })
      ]);

      if (totalUsers <= 1) {
        return { percentile: 100, topPercent: 0, rank: 1, totalUsers: 1 };
      }

      const percentile = ((usersBelow / totalUsers) * 100).toFixed(1);
      const topPercent = (100 - parseFloat(percentile)).toFixed(1);
      
      // Calculate actual rank
      const rank = totalUsers - usersBelow;

      return {
        percentile: parseFloat(percentile),
        topPercent: parseFloat(topPercent),
        rank,
        totalUsers,
        displayText: `Top **${topPercent}%** of Global Scholars (#${rank} of ${totalUsers})`
      };
    } catch (error) {
      console.error('Error calculating percentile:', error);
      return { percentile: 0, topPercent: 100, rank: 0, totalUsers: 0, displayText: '' };
    }
  }

  /**
   * Get multiplier breakdown with transparency
   * @param {Object} user - User document
   * @returns {Object} Detailed multiplier breakdown
   */
  getMultiplierBreakdown(user) {
    const streak = user?.streak || 0;
    const prestigeLevel = user?.prestige?.level || 0;
    const prestigeMultiplier = user?.prestige?.bonusMultiplier || 1.0;

    // Streak multiplier calculation (matches gamificationService.js)
    let streakMultiplier = 1.0;
    if (streak >= 30) streakMultiplier = 2.0;
    else if (streak >= 14) streakMultiplier = 1.5;
    else if (streak >= 7) streakMultiplier = 1.25;
    else if (streak >= 3) streakMultiplier = 1.1;

    const totalMultiplier = streakMultiplier * prestigeMultiplier;

    return {
      streak: {
        days: streak,
        multiplier: streakMultiplier,
        display: `${streakMultiplier.toFixed(1)}x`,
        nextTier: getNextStreakTier(streak)
      },
      prestige: {
        level: prestigeLevel,
        multiplier: prestigeMultiplier,
        display: `${prestigeMultiplier.toFixed(1)}x`
      },
      total: {
        multiplier: totalMultiplier,
        display: `${totalMultiplier.toFixed(2)}x`,
        bonusPercent: Math.round((totalMultiplier - 1) * 100)
      }
    };
  }

  /**
   * Atomic user state verification
   * Ensures UI perfectly mirrors database state
   */
  async verifyUserState(userId) {
    try {
      const user = await User.findOne({ discordId: userId }).lean();
      if (!user) return null;

      // Ensure prestige object is type-safe
      const safeUser = {
        ...user,
        prestige: {
          level: typeof user.prestige?.level === 'number' ? user.prestige.level : 0,
          totalXpEarned: typeof user.prestige?.totalXpEarned === 'number' ? user.prestige.totalXpEarned : (user.xp || 0),
          bonusMultiplier: typeof user.prestige?.bonusMultiplier === 'number' ? user.prestige.bonusMultiplier : 1.0
        }
      };

      return safeUser;
    } catch (error) {
      console.error('Error verifying user state:', error);
      return null;
    }
  }

  /**
   * Get XP progress with unified formula
   * Uses: xpNeeded = floor(100 * 1.5^(L-1))
   */
  getXPProgress(user) {
    const level = user?.level || 1;
    const xp = user?.xp || 0;
    const xpNeeded = xpForLevel(level);
    const percent = Math.min(Math.round((xp / Math.max(xpNeeded, 1)) * 100), 100);

    return {
      current: xp,
      needed: xpNeeded,
      percent,
      remaining: Math.max(0, xpNeeded - xp),
      level,
      formula: `⌊100 × 1.5^${level - 1}⌋ = ${xpNeeded}`
    };
  }

  /**
   * Build competition stats for Competition category
   */
  async getCompetitionStats(user) {
    const lifetimeXP = user?.prestige?.totalXpEarned || user?.xp || 0;
    const percentile = await this.calculateGlobalPercentile(lifetimeXP);
    const multipliers = this.getMultiplierBreakdown(user);

    return {
      lifetimeXP,
      percentile,
      multipliers,
      tournamentWins: user?.tournamentWins || 0,
      challengeWins: user?.challengeWins || 0,
      arenaRating: user?.arenaRating || 1000
    };
  }
}

/**
 * Get next streak tier info
 */
function getNextStreakTier(currentStreak) {
  const tiers = [
    { days: 3, multiplier: 1.1, name: 'Committed' },
    { days: 7, multiplier: 1.25, name: 'Dedicated' },
    { days: 14, multiplier: 1.5, name: 'Champion' },
    { days: 30, multiplier: 2.0, name: 'Legend' }
  ];

  for (const tier of tiers) {
    if (currentStreak < tier.days) {
      return {
        daysNeeded: tier.days - currentStreak,
        nextMultiplier: tier.multiplier,
        tierName: tier.name
      };
    }
  }

  return { daysNeeded: 0, nextMultiplier: 2.0, tierName: 'MAX' };
}

// Singleton instance
export const helpStateManager = new HelpStateManager();

// Cleanup expired states every 10 minutes
setInterval(() => helpStateManager.cleanup(), 10 * 60 * 1000);

export default helpStateManager;
