/**
 * Prestige System - Reset for Permanent Bonuses
 * 
 * Players can "prestige" at level 50+ to reset their level
 * but gain permanent XP multiplier bonuses.
 * 
 * Max prestige level: 10 (Transcendent)
 * Max multiplier: 1.50 (50% more XP)
 */

export class PrestigeSystem {
  /**
   * Prestige level configurations
   */
  static PRESTIGE_LEVELS = {
    1: { name: 'Bronze Scholar', xpRequired: 10000, multiplier: 1.05, badge: '🥉' },
    2: { name: 'Silver Scholar', xpRequired: 25000, multiplier: 1.10, badge: '🥈' },
    3: { name: 'Gold Scholar', xpRequired: 50000, multiplier: 1.15, badge: '🥇' },
    4: { name: 'Platinum Scholar', xpRequired: 100000, multiplier: 1.20, badge: '💎' },
    5: { name: 'Diamond Scholar', xpRequired: 200000, multiplier: 1.25, badge: '💠' },
    6: { name: 'Master Scholar', xpRequired: 400000, multiplier: 1.30, badge: '🎓' },
    7: { name: 'Grandmaster', xpRequired: 750000, multiplier: 1.35, badge: '👨‍🎓' },
    8: { name: 'Legendary', xpRequired: 1500000, multiplier: 1.40, badge: '🌟' },
    9: { name: 'Mythic', xpRequired: 3000000, multiplier: 1.45, badge: '✨' },
    10: { name: 'Transcendent', xpRequired: 5000000, multiplier: 1.50, badge: '👑' }
  };

  /**
   * Minimum level required to prestige
   */
  static MIN_LEVEL_TO_PRESTIGE = 50;

  /**
   * Check if user can prestige
   * @param {Object} user - User document
   * @returns {Object} Prestige eligibility info
   */
  static canPrestige(user) {
    const currentPrestige = user.prestige?.level || 0;
    
    // Already at max prestige
    if (currentPrestige >= 10) {
      return { 
        canPrestige: false, 
        reason: 'Maximum prestige level reached (Transcendent)',
        maxedOut: true
      };
    }
    
    const nextLevel = currentPrestige + 1;
    const requirements = this.PRESTIGE_LEVELS[nextLevel];
    
    // Check level requirement
    if (user.level < this.MIN_LEVEL_TO_PRESTIGE) {
      return { 
        canPrestige: false, 
        reason: `Need level ${this.MIN_LEVEL_TO_PRESTIGE} (currently ${user.level})`,
        levelNeeded: this.MIN_LEVEL_TO_PRESTIGE,
        currentLevel: user.level
      };
    }
    
    // Calculate total XP earned
    const totalXpEarned = user.prestige?.totalXpEarned || this.calculateTotalXpEarned(user);
    
    // Check XP requirement
    if (totalXpEarned < requirements.xpRequired) {
      const needed = requirements.xpRequired - totalXpEarned;
      return { 
        canPrestige: false, 
        reason: `Need ${needed.toLocaleString()} more XP (${totalXpEarned.toLocaleString()}/${requirements.xpRequired.toLocaleString()})`,
        xpNeeded: needed,
        currentXp: totalXpEarned,
        requiredXp: requirements.xpRequired
      };
    }
    
    return {
      canPrestige: true,
      nextLevel,
      name: requirements.name,
      multiplier: requirements.multiplier,
      badge: requirements.badge,
      xpRequired: requirements.xpRequired,
      bonusPercent: Math.round((requirements.multiplier - 1) * 100)
    };
  }

  /**
   * Calculate total XP earned from level and current XP
   * @param {Object} user - User document
   * @returns {number} Total XP earned
   */
  static calculateTotalXpEarned(user) {
    // Sum XP from all completed levels
    let totalXp = 0;
    for (let i = 1; i < user.level; i++) {
      totalXp += Math.floor(100 * Math.pow(1.5, i - 1));
    }
    // Add current level progress
    totalXp += user.xp || 0;
    
    // Add prestige history if exists
    if (user.prestige?.history) {
      for (const entry of user.prestige.history) {
        totalXp += entry.xpAtPrestige || 0;
      }
    }
    
    return totalXp;
  }

  /**
   * Perform prestige on user
   * @param {Object} user - User document (will be modified)
   * @returns {Object} Prestige result
   */
  static prestige(user) {
    const check = this.canPrestige(user);
    if (!check.canPrestige) {
      return {
        success: false,
        error: check.reason,
        ...check
      };
    }
    
    const currentPrestige = user.prestige?.level || 0;
    const nextLevel = currentPrestige + 1;
    const requirements = this.PRESTIGE_LEVELS[nextLevel];
    
    // Calculate current total XP before reset
    const totalXpBeforePrestige = this.calculateTotalXpEarned(user);
    
    // Store old level for display
    const oldLevel = user.level;
    const oldXp = user.xp;
    
    // Initialize prestige object if needed
    if (!user.prestige) {
      user.prestige = {
        level: 0,
        totalXpEarned: 0,
        bonusMultiplier: 1.0,
        history: []
      };
    }
    
    // Record history
    user.prestige.history.push({
      date: new Date(),
      fromLevel: oldLevel,
      xpAtPrestige: totalXpBeforePrestige,
      toPrestigeLevel: nextLevel
    });
    
    // Reset level but track total XP
    user.level = 1;
    user.xp = 0;
    
    // Update prestige
    user.prestige.level = nextLevel;
    user.prestige.totalXpEarned = totalXpBeforePrestige;
    user.prestige.bonusMultiplier = requirements.multiplier;
    
    return {
      success: true,
      oldLevel,
      oldXp,
      newPrestigeLevel: nextLevel,
      prestigeName: requirements.name,
      badge: requirements.badge,
      multiplier: requirements.multiplier,
      bonusPercent: Math.round((requirements.multiplier - 1) * 100),
      totalXpEarned: totalXpBeforePrestige,
      message: `🎉 Prestiged to ${requirements.name}! You now earn ${Math.round((requirements.multiplier - 1) * 100)}% more XP.`
    };
  }

  /**
   * Get current prestige benefits
   * @param {number} prestigeLevel - Current prestige level
   * @returns {Object} Benefits info
   */
  static getPrestigeBenefits(prestigeLevel) {
    const level = Math.min(Math.max(prestigeLevel, 0), 10);
    
    if (level === 0) {
      return {
        current: {
          level: 0,
          name: 'None',
          multiplier: 1.0,
          bonusPercent: '0',
          badge: ''
        },
        next: {
          level: 1,
          ...this.PRESTIGE_LEVELS[1],
          bonusPercent: Math.round((this.PRESTIGE_LEVELS[1].multiplier - 1) * 100)
        }
      };
    }
    
    const current = this.PRESTIGE_LEVELS[level];
    const next = this.PRESTIGE_LEVELS[level + 1];
    
    return {
      current: {
        level,
        name: current.name,
        multiplier: current.multiplier,
        bonusPercent: Math.round((current.multiplier - 1) * 100),
        badge: current.badge
      },
      next: next ? {
        level: level + 1,
        name: next.name,
        xpRequired: next.xpRequired,
        multiplier: next.multiplier,
        bonusPercent: Math.round((next.multiplier - 1) * 100),
        badge: next.badge
      } : null,
      isMaxed: level >= 10
    };
  }

  /**
   * Get prestige progress towards next level
   * @param {Object} user - User document
   * @returns {Object} Progress info
   */
  static getPrestigeProgress(user) {
    const currentPrestige = user.prestige?.level || 0;
    const totalXp = user.prestige?.totalXpEarned || this.calculateTotalXpEarned(user);
    
    if (currentPrestige >= 10) {
      return {
        isMaxed: true,
        currentLevel: 10,
        name: this.PRESTIGE_LEVELS[10].name,
        badge: this.PRESTIGE_LEVELS[10].badge
      };
    }
    
    const nextLevel = currentPrestige + 1;
    const requirements = this.PRESTIGE_LEVELS[nextLevel];
    const previousRequired = currentPrestige > 0 
      ? this.PRESTIGE_LEVELS[currentPrestige].xpRequired 
      : 0;
    
    const xpProgress = totalXp - previousRequired;
    const xpNeeded = requirements.xpRequired - previousRequired;
    const percentage = Math.min(100, Math.max(0, Math.round((xpProgress / xpNeeded) * 100)));
    
    return {
      isMaxed: false,
      currentLevel: currentPrestige,
      nextLevel,
      nextName: requirements.name,
      nextBadge: requirements.badge,
      totalXp,
      xpRequired: requirements.xpRequired,
      xpRemaining: Math.max(0, requirements.xpRequired - totalXp),
      percentage,
      meetsLevelRequirement: user.level >= this.MIN_LEVEL_TO_PRESTIGE
    };
  }

  /**
   * Format prestige display
   * @param {Object} user - User document
   * @returns {string} Formatted string
   */
  static formatPrestigeDisplay(user) {
    const level = user.prestige?.level || 0;
    
    if (level === 0) {
      return 'No Prestige';
    }
    
    const info = this.PRESTIGE_LEVELS[level];
    return `${info.badge} ${info.name} (P${level})`;
  }

  /**
   * Get prestige badge for display
   * @param {number} prestigeLevel - Prestige level
   * @returns {string} Badge emoji
   */
  static getPrestigeBadge(prestigeLevel) {
    if (prestigeLevel <= 0) return '';
    const level = Math.min(prestigeLevel, 10);
    return this.PRESTIGE_LEVELS[level]?.badge || '';
  }
}

export default PrestigeSystem;
