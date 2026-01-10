/**
 * Tier System - Rank Progression
 * 
 * Players progress through tiers based on level and achievements:
 * Bronze → Silver → Gold → Platinum → Diamond → Master
 */

export class TierSystem {
  /**
   * Tier configurations
   */
  static TIERS = {
    1: { 
      name: 'Bronze', 
      minLevel: 1, 
      badge: '🥉', 
      color: '#CD7F32',
      perks: ['Basic profile card', 'Access to quizzes']
    },
    2: { 
      name: 'Silver', 
      minLevel: 10, 
      badge: '🥈', 
      color: '#C0C0C0',
      perks: ['Silver profile frame', 'Hint lifeline in quizzes']
    },
    3: { 
      name: 'Gold', 
      minLevel: 25, 
      badge: '🥇', 
      color: '#FFD700',
      perks: ['Gold profile frame', '50/50 lifeline', 'Custom themes']
    },
    4: { 
      name: 'Platinum', 
      minLevel: 50, 
      badge: '💎', 
      color: '#E5E4E2',
      perks: ['Platinum badge', 'Priority support', 'All lifelines']
    },
    5: { 
      name: 'Diamond', 
      minLevel: 75, 
      badge: '💠', 
      color: '#B9F2FF',
      perks: ['Diamond effects', 'Exclusive challenges', 'Custom card styles']
    },
    6: { 
      name: 'Master', 
      minLevel: 100, 
      badge: '👑', 
      color: '#9932CC',
      perks: ['Master crown', 'All perks', 'Exclusive Master channel access']
    }
  };

  /**
   * Calculate tier from level
   * @param {number} level - User level
   * @returns {Object} Tier info
   */
  static getTierFromLevel(level) {
    const tiers = Object.entries(this.TIERS).reverse();
    
    for (const [tierNum, tier] of tiers) {
      if (level >= tier.minLevel) {
        return {
          tier: parseInt(tierNum),
          ...tier
        };
      }
    }
    
    return { tier: 1, ...this.TIERS[1] };
  }

  /**
   * Get tier progress
   * @param {number} level - User level
   * @returns {Object} Progress info
   */
  static getTierProgress(level) {
    const current = this.getTierFromLevel(level);
    const nextTierNum = current.tier + 1;
    
    if (nextTierNum > 6) {
      return {
        currentTier: current,
        nextTier: null,
        isMaxTier: true,
        progress: 100
      };
    }
    
    const nextTier = { tier: nextTierNum, ...this.TIERS[nextTierNum] };
    const levelsInTier = level - current.minLevel;
    const levelsNeeded = nextTier.minLevel - current.minLevel;
    const progress = Math.min(100, Math.round((levelsInTier / levelsNeeded) * 100));
    
    return {
      currentTier: current,
      nextTier,
      isMaxTier: false,
      progress,
      levelsToNext: nextTier.minLevel - level
    };
  }

  /**
   * Check if user just ranked up
   * @param {number} oldLevel - Previous level
   * @param {number} newLevel - New level
   * @returns {Object|null} Rank up info or null
   */
  static checkTierUp(oldLevel, newLevel) {
    const oldTier = this.getTierFromLevel(oldLevel);
    const newTier = this.getTierFromLevel(newLevel);
    
    if (newTier.tier > oldTier.tier) {
      return {
        rankedUp: true,
        oldTier,
        newTier,
        message: `🎊 Congratulations! You've reached ${newTier.badge} ${newTier.name} tier!`
      };
    }
    
    return null;
  }

  /**
   * Get tier badge for display
   * @param {number} level - User level
   * @returns {string} Badge emoji
   */
  static getTierBadge(level) {
    return this.getTierFromLevel(level).badge;
  }

  /**
   * Get tier color
   * @param {number} level - User level
   * @returns {string} Hex color
   */
  static getTierColor(level) {
    return this.getTierFromLevel(level).color;
  }

  /**
   * Format tier display
   * @param {number} level - User level
   * @returns {string} Formatted tier string
   */
  static formatTierDisplay(level) {
    const tier = this.getTierFromLevel(level);
    return `${tier.badge} ${tier.name}`;
  }
}

export default TierSystem;
