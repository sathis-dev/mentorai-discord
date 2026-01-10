/**
 * XP Service - Centralized XP Handling
 * 
 * Calculates XP for all actions with multipliers
 * from streaks, prestige, study parties, etc.
 */

import { XPSystem } from '../core/xpSystem.js';
import { StreakSystem } from '../core/streakSystem.js';
import { PrestigeSystem } from '../core/prestigeSystem.js';

export class XPService {
  constructor() {
    /**
     * XP Configuration
     */
    this.config = {
      // Quiz rewards
      quiz: {
        correct: 25,        // Per correct answer
        complete: 50,       // Completion bonus
        perfect: 100,       // All correct bonus
        difficultyMultiplier: {
          easy: 0.8,
          medium: 1.0,
          hard: 1.5
        }
      },
      
      // Lesson rewards
      lesson: {
        complete: 40,
        first: 75,          // First time completing a topic
        review: 15          // Reviewing completed lesson
      },
      
      // Daily rewards
      daily: {
        base: 75,
        streakBonus: 15,    // Per day (capped at 100)
        maxStreakBonus: 100,
        milestones: {
          7: 200,
          14: 400,
          30: 1000,
          100: 5000
        }
      },
      
      // Multiplayer rewards
      multiplayer: {
        challenge: {
          win: 150,
          loss: 25,
          draw: 50
        },
        arena: {
          participation: 50,
          position: {
            1: 200,
            2: 150,
            3: 100,
            top5: 50
          }
        },
        tournament: {
          participation: 100,
          win: 500,
          top3: 250
        }
      },
      
      // Achievement XP
      achievement: {
        common: 50,
        uncommon: 100,
        rare: 200,
        epic: 400,
        legendary: 1000
      },
      
      // Other actions
      other: {
        flashcard: 5,
        funFact: 10,
        codeReview: 30,
        debugSession: 40,
        interview: 50,
        referral: 200
      }
    };
  }

  /**
   * Calculate XP for any action with ALL multipliers
   * @param {Object} user - User document
   * @param {string} action - Action type
   * @param {Object} details - Action details
   * @returns {Object} XP calculation result
   */
  calculateXp(user, action, details = {}) {
    let baseXp = 0;
    let breakdown = [];

    switch (action) {
      case 'quiz':
        baseXp = this.calculateQuizXp(details, breakdown);
        break;
        
      case 'lesson':
        baseXp = this.calculateLessonXp(details, breakdown);
        break;
        
      case 'daily':
        baseXp = this.calculateDailyXp(user, breakdown);
        break;
        
      case 'challenge':
        baseXp = this.calculateChallengeXp(details, breakdown);
        break;
        
      case 'arena':
        baseXp = this.calculateArenaXp(details, breakdown);
        break;
        
      case 'achievement':
        baseXp = this.calculateAchievementXp(details, breakdown);
        break;
        
      default:
        // Check other actions
        if (this.config.other[action]) {
          baseXp = this.config.other[action];
          breakdown.push({ source: action, xp: baseXp });
        }
    }

    // Apply multipliers
    const { finalXp, multipliers } = this.applyMultipliers(user, baseXp);

    return {
      baseXp,
      finalXp,
      breakdown,
      multipliers,
      action
    };
  }

  /**
   * Calculate quiz XP
   */
  calculateQuizXp(details, breakdown) {
    let xp = 0;
    
    // Completion bonus
    xp += this.config.quiz.complete;
    breakdown.push({ source: 'Quiz Complete', xp: this.config.quiz.complete });
    
    // Per correct answer
    const correctXp = (details.correct || 0) * this.config.quiz.correct;
    if (correctXp > 0) {
      xp += correctXp;
      breakdown.push({ source: `${details.correct} Correct Answers`, xp: correctXp });
    }
    
    // Perfect bonus
    if (details.perfect || (details.correct === details.total && details.total > 0)) {
      xp += this.config.quiz.perfect;
      breakdown.push({ source: 'Perfect Score', xp: this.config.quiz.perfect });
    }
    
    // Apply difficulty multiplier
    const diffMultiplier = this.config.quiz.difficultyMultiplier[details.difficulty] || 1.0;
    if (diffMultiplier !== 1.0) {
      const bonus = Math.floor(xp * diffMultiplier) - xp;
      xp = Math.floor(xp * diffMultiplier);
      breakdown.push({ source: `${details.difficulty} Difficulty`, xp: bonus });
    }
    
    return xp;
  }

  /**
   * Calculate lesson XP
   */
  calculateLessonXp(details, breakdown) {
    let xp = 0;
    
    if (details.first) {
      xp = this.config.lesson.first;
      breakdown.push({ source: 'First Lesson', xp });
    } else if (details.review) {
      xp = this.config.lesson.review;
      breakdown.push({ source: 'Lesson Review', xp });
    } else {
      xp = this.config.lesson.complete;
      breakdown.push({ source: 'Lesson Complete', xp });
    }
    
    return xp;
  }

  /**
   * Calculate daily bonus XP
   */
  calculateDailyXp(user, breakdown) {
    let xp = this.config.daily.base;
    breakdown.push({ source: 'Daily Bonus', xp: this.config.daily.base });
    
    // Streak bonus (capped)
    const streak = user.streak || 0;
    const streakBonus = Math.min(
      streak * this.config.daily.streakBonus,
      this.config.daily.maxStreakBonus
    );
    
    if (streakBonus > 0) {
      xp += streakBonus;
      breakdown.push({ source: `${streak} Day Streak`, xp: streakBonus });
    }
    
    // Milestone bonus
    if (this.config.daily.milestones[streak]) {
      const milestoneXp = this.config.daily.milestones[streak];
      xp += milestoneXp;
      breakdown.push({ source: `${streak} Day Milestone`, xp: milestoneXp });
    }
    
    return xp;
  }

  /**
   * Calculate challenge XP
   */
  calculateChallengeXp(details, breakdown) {
    let xp = 0;
    
    if (details.win) {
      xp = this.config.multiplayer.challenge.win;
      breakdown.push({ source: 'Challenge Victory', xp });
    } else if (details.draw) {
      xp = this.config.multiplayer.challenge.draw;
      breakdown.push({ source: 'Challenge Draw', xp });
    } else {
      xp = this.config.multiplayer.challenge.loss;
      breakdown.push({ source: 'Challenge Participation', xp });
    }
    
    return xp;
  }

  /**
   * Calculate arena XP
   */
  calculateArenaXp(details, breakdown) {
    let xp = this.config.multiplayer.arena.participation;
    breakdown.push({ source: 'Arena Participation', xp });
    
    const position = details.position || 99;
    
    if (position <= 3) {
      const posXp = this.config.multiplayer.arena.position[position];
      xp += posXp;
      breakdown.push({ source: `${position}${this.getOrdinal(position)} Place`, xp: posXp });
    } else if (position <= 5) {
      xp += this.config.multiplayer.arena.position.top5;
      breakdown.push({ source: 'Top 5', xp: this.config.multiplayer.arena.position.top5 });
    }
    
    return xp;
  }

  /**
   * Calculate achievement XP
   */
  calculateAchievementXp(details, breakdown) {
    const rarity = details.rarity || 'common';
    const xp = this.config.achievement[rarity] || this.config.achievement.common;
    breakdown.push({ source: `${rarity.charAt(0).toUpperCase() + rarity.slice(1)} Achievement`, xp });
    
    return xp;
  }

  /**
   * Apply all multipliers to base XP
   * @param {Object} user - User document
   * @param {number} baseXp - Base XP before multipliers
   * @returns {Object} Final XP and multiplier breakdown
   */
  applyMultipliers(user, baseXp) {
    let totalMultiplier = 1.0;
    const multipliers = [];

    // Streak multiplier
    const streakMultiplier = StreakSystem.getStreakMultiplier(user.streak || 0);
    if (streakMultiplier > 1.0) {
      totalMultiplier *= streakMultiplier;
      multipliers.push({
        source: 'Streak Bonus',
        value: streakMultiplier,
        percent: Math.round((streakMultiplier - 1) * 100)
      });
    }

    // Prestige multiplier
    const prestigeMultiplier = user.prestige?.bonusMultiplier || 1.0;
    if (prestigeMultiplier > 1.0) {
      totalMultiplier *= prestigeMultiplier;
      multipliers.push({
        source: 'Prestige Bonus',
        value: prestigeMultiplier,
        percent: Math.round((prestigeMultiplier - 1) * 100)
      });
    }

    // Study party multiplier
    if (user.currentStudyParty) {
      const partyMultiplier = 1.5; // +50% XP in party
      totalMultiplier *= partyMultiplier;
      multipliers.push({
        source: 'Study Party Bonus',
        value: partyMultiplier,
        percent: 50
      });
    }

    // Event multiplier (if applicable)
    if (user.activeEvent?.xpMultiplier) {
      totalMultiplier *= user.activeEvent.xpMultiplier;
      multipliers.push({
        source: 'Event Bonus',
        value: user.activeEvent.xpMultiplier,
        percent: Math.round((user.activeEvent.xpMultiplier - 1) * 100)
      });
    }

    const finalXp = Math.floor(baseXp * totalMultiplier);

    return {
      finalXp,
      totalMultiplier,
      multipliers,
      bonus: finalXp - baseXp
    };
  }

  /**
   * Award XP to user and handle level ups
   * @param {Object} user - User document
   * @param {number} amount - XP to award
   * @param {string} source - Source of XP
   * @returns {Object} Result with level up info
   */
  async awardXp(user, amount, source = 'unknown') {
    // Track lifetime XP
    if (!user.prestige) {
      user.prestige = { level: 0, totalXpEarned: 0, bonusMultiplier: 1.0 };
    }
    user.prestige.totalXpEarned = (user.prestige.totalXpEarned || 0) + amount;

    // Add XP
    user.xp = (user.xp || 0) + amount;

    // Level up loop
    let leveledUp = false;
    let levelsGained = 0;
    const startLevel = user.level || 1;

    while (user.xp >= XPSystem.xpForLevel(user.level || 1)) {
      user.xp -= XPSystem.xpForLevel(user.level || 1);
      user.level = (user.level || 1) + 1;
      leveledUp = true;
      levelsGained++;
    }

    return {
      xpAwarded: amount,
      source,
      leveledUp,
      levelsGained,
      previousLevel: startLevel,
      newLevel: user.level,
      currentXp: user.xp,
      xpToNext: XPSystem.xpForLevel(user.level) - user.xp,
      totalXpEarned: user.prestige.totalXpEarned
    };
  }

  /**
   * Get ordinal suffix for numbers
   */
  getOrdinal(n) {
    const s = ['th', 'st', 'nd', 'rd'];
    const v = n % 100;
    return s[(v - 20) % 10] || s[v] || s[0];
  }

  /**
   * Format XP display
   */
  formatXp(xp) {
    if (xp >= 1000000) {
      return `${(xp / 1000000).toFixed(1)}M`;
    }
    if (xp >= 1000) {
      return `${(xp / 1000).toFixed(1)}K`;
    }
    return xp.toString();
  }

  /**
   * Get XP breakdown string
   */
  formatBreakdown(calculation) {
    const lines = [];
    
    // Base breakdown
    for (const item of calculation.breakdown) {
      lines.push(`• ${item.source}: +${item.xp} XP`);
    }
    
    // Multipliers
    if (calculation.multipliers.length > 0) {
      lines.push('');
      lines.push('**Multipliers:**');
      for (const mult of calculation.multipliers) {
        lines.push(`• ${mult.source}: +${mult.percent}%`);
      }
    }
    
    lines.push('');
    lines.push(`**Total: ${calculation.finalXp} XP**`);
    
    return lines.join('\n');
  }
}

export default XPService;
