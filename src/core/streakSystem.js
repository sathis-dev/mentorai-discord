/**
 * Streak System - Timezone-Aware Daily Streak Tracking
 * 
 * Features:
 * - Timezone-aware day calculation
 * - Streak multiplier calculation
 * - Daily bonus claim tracking
 * - Visual streak indicators
 */

import { DateTime } from 'luxon';

export class StreakSystem {
  /**
   * Streak visual configurations
   */
  static STREAK_VISUALS = {
    0: { emoji: '💫', name: 'Newbie Glow', multiplier: 1.0 },
    3: { emoji: '🌟', name: 'Spark', multiplier: 1.1 },
    7: { emoji: '✨', name: 'Shining', multiplier: 1.25 },
    14: { emoji: '⚡', name: 'Power Surge', multiplier: 1.5 },
    30: { emoji: '🔥', name: 'Inferno', multiplier: 2.0 },
    100: { emoji: '🔥', name: 'Legendary Flame', multiplier: 2.0 }
  };

  /**
   * Update streak when user is active
   * @param {Object} user - User document
   * @param {Date} activityTime - Time of activity (default: now)
   * @returns {Object} Streak update result
   */
  static updateStreak(user, activityTime = new Date()) {
    const userTimezone = user.timezone || 'UTC';
    const now = DateTime.fromJSDate(activityTime).setZone(userTimezone);
    
    // First-time user
    if (!user.lastActive) {
      return {
        streak: 0,
        isNewUser: true,
        longestStreak: 0,
        streakIncremented: false,
        updatedLastActive: activityTime
      };
    }
    
    const lastActive = DateTime.fromJSDate(new Date(user.lastActive)).setZone(userTimezone);
    
    // Already active today? (same calendar day in THEIR timezone)
    if (now.hasSame(lastActive, 'day')) {
      return {
        streak: user.streak || 0,
        alreadyActiveToday: true,
        longestStreak: user.longestStreak || 0,
        streakIncremented: false,
        updatedLastActive: activityTime
      };
    }
    
    let newStreak = user.streak || 0;
    let streakIncremented = false;
    
    // Check if last active was YESTERDAY (consecutive)
    const yesterday = now.minus({ days: 1 });
    if (lastActive.hasSame(yesterday, 'day')) {
      // Consecutive day!
      newStreak += 1;
      streakIncremented = true;
    } else {
      // Calculate days difference
      const daysDiff = now.diff(lastActive, 'days').days;
      
      if (daysDiff > 1.5) {
        // More than 1.5 days gap = streak broken
        newStreak = 1; // Today counts as day 1 of new streak
      } else {
        // Edge case - same day or weird timing
        newStreak = Math.max(1, newStreak);
      }
    }
    
    // Calculate longest streak
    const longestStreak = Math.max(user.longestStreak || 0, newStreak);
    
    return {
      streak: newStreak,
      previousStreak: user.streak || 0,
      streakIncremented,
      longestStreak,
      updatedLastActive: activityTime,
      streakBroken: (user.streak || 0) > 0 && newStreak === 1 && !streakIncremented
    };
  }

  /**
   * Check if user can claim daily bonus
   * @param {Object} user - User document
   * @param {Date} claimTime - Time of claim attempt (default: now)
   * @returns {Object} Claim status
   */
  static canClaimDaily(user, claimTime = new Date()) {
    const userTimezone = user.timezone || 'UTC';
    const now = DateTime.fromJSDate(claimTime).setZone(userTimezone);
    const lastClaim = user.lastDailyBonus 
      ? DateTime.fromJSDate(new Date(user.lastDailyBonus)).setZone(userTimezone)
      : null;
    
    // Never claimed
    if (!lastClaim) {
      return { 
        canClaim: true, 
        nextAvailable: null,
        isFirstClaim: true
      };
    }
    
    // Check if already claimed today
    if (now.hasSame(lastClaim, 'day')) {
      const tomorrow = now.plus({ days: 1 }).startOf('day');
      const hoursLeft = tomorrow.diff(now, 'hours').hours;
      const minutesLeft = tomorrow.diff(now, 'minutes').minutes % 60;
      
      return {
        canClaim: false,
        nextAvailable: tomorrow.toJSDate(),
        hoursLeft: Math.ceil(hoursLeft),
        minutesLeft: Math.ceil(minutesLeft),
        message: `Already claimed today! Next claim in ${Math.ceil(hoursLeft)}h ${Math.ceil(minutesLeft)}m`
      };
    }
    
    // Check if streak is maintained (claimed yesterday)
    const yesterday = now.minus({ days: 1 });
    const maintainedStreak = lastClaim.hasSame(yesterday, 'day');
    
    return { 
      canClaim: true, 
      nextAvailable: null,
      maintainedStreak,
      daysMissed: maintainedStreak ? 0 : Math.floor(now.diff(lastClaim, 'days').days) - 1
    };
  }

  /**
   * Get visual streak indicator
   * @param {number} streak - Current streak
   * @returns {Object} Visual data
   */
  static getStreakVisual(streak) {
    const thresholds = Object.keys(this.STREAK_VISUALS)
      .map(Number)
      .sort((a, b) => b - a);
    
    for (const threshold of thresholds) {
      if (streak >= threshold) {
        return {
          ...this.STREAK_VISUALS[threshold],
          streak,
          tier: threshold
        };
      }
    }
    
    return {
      ...this.STREAK_VISUALS[0],
      streak,
      tier: 0
    };
  }

  /**
   * Get streak multiplier for XP calculations
   * @param {number} streak - Current streak
   * @returns {number} Multiplier value
   */
  static getStreakMultiplier(streak) {
    if (streak >= 30) return 2.0;
    if (streak >= 14) return 1.5;
    if (streak >= 7) return 1.25;
    if (streak >= 3) return 1.1;
    return 1.0;
  }

  /**
   * Calculate bonus XP for streak milestones
   * @param {number} streak - Current streak
   * @returns {Object} Milestone bonus info
   */
  static getStreakMilestoneBonus(streak) {
    const milestones = {
      7: { bonus: 200, name: 'Week Warrior', emoji: '🗓️' },
      14: { bonus: 400, name: 'Fortnight Fighter', emoji: '⚔️' },
      30: { bonus: 1000, name: 'Monthly Master', emoji: '🏆' },
      100: { bonus: 5000, name: 'Century Legend', emoji: '👑' },
      365: { bonus: 25000, name: 'Year Champion', emoji: '🎖️' }
    };
    
    if (milestones[streak]) {
      return {
        isMilestone: true,
        ...milestones[streak]
      };
    }
    
    return { isMilestone: false };
  }

  /**
   * Get streak at risk warning
   * @param {Object} user - User document
   * @returns {Object} Warning info
   */
  static getStreakAtRiskWarning(user) {
    if (!user.lastActive || user.streak <= 0) {
      return { atRisk: false };
    }
    
    const userTimezone = user.timezone || 'UTC';
    const now = DateTime.now().setZone(userTimezone);
    const lastActive = DateTime.fromJSDate(new Date(user.lastActive)).setZone(userTimezone);
    
    // If last active was yesterday, check if it's getting close to streak break
    if (!now.hasSame(lastActive, 'day')) {
      const yesterday = now.minus({ days: 1 });
      
      if (lastActive.hasSame(yesterday, 'day')) {
        // Calculate hours until streak breaks (at start of day after tomorrow)
        const streakBreakTime = now.plus({ days: 1 }).startOf('day');
        const hoursRemaining = streakBreakTime.diff(now, 'hours').hours;
        
        if (hoursRemaining <= 6) {
          return {
            atRisk: true,
            hoursRemaining: Math.ceil(hoursRemaining),
            message: `⚠️ Your ${user.streak}-day streak expires in ${Math.ceil(hoursRemaining)} hours!`,
            urgency: hoursRemaining <= 2 ? 'critical' : 'warning'
          };
        }
      }
    }
    
    return { atRisk: false };
  }

  /**
   * Format streak display string
   * @param {number} streak - Current streak
   * @returns {string} Formatted string
   */
  static formatStreakDisplay(streak) {
    const visual = this.getStreakVisual(streak);
    return `${visual.emoji} ${streak}-day streak (${visual.name})`;
  }
}

export default StreakSystem;
