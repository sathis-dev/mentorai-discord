/**
 * Tier System - Rank Progression & Visual Theming
 * 
 * Players progress through tiers based on LIFETIME XP (totalXpEarned):
 * Bronze → Silver → Gold → Platinum → Diamond → Master
 * 
 * This system powers the "Pro Max" Trading Card visuals.
 */

export class TierSystem {
  /**
   * XP-Based Tier configurations for Pro Max Cards
   * Uses totalXpEarned (lifetime XP) for tier determination
   */
  static XP_TIERS = {
    BRONZE: {
      name: 'Bronze',
      minXP: 0,
      badge: '🥉',
      color: 0xCD7F32,
      hexColor: '#CD7F32',
      gradient: null,
      glowEffect: 'none',
      borderStyle: 'solid',
      borderEmoji: '▫️',
      cardStyle: 'basic'
    },
    SILVER: {
      name: 'Silver',
      minXP: 1000,
      badge: '🥈',
      color: 0xC0C0C0,
      hexColor: '#C0C0C0',
      gradient: null,
      glowEffect: 'none',
      borderStyle: 'solid',
      borderEmoji: '▪️',
      cardStyle: 'basic'
    },
    GOLD: {
      name: 'Gold',
      minXP: 5000,
      badge: '🥇',
      color: 0xFFD700,
      hexColor: '#FFD700',
      gradient: ['#FFD700', '#FFA500'],
      glowEffect: 'subtle',
      borderStyle: 'gradient',
      borderEmoji: '✦',
      cardStyle: 'premium'
    },
    PLATINUM: {
      name: 'Platinum',
      minXP: 15000,
      badge: '💠',
      color: 0xE5E4E2,
      hexColor: '#E5E4E2',
      gradient: ['#E5E4E2', '#B8B8B8', '#FFFFFF'],
      glowEffect: 'medium',
      borderStyle: 'gradient',
      borderEmoji: '◆',
      cardStyle: 'premium'
    },
    DIAMOND: {
      name: 'Diamond',
      minXP: 50000,
      badge: '💎',
      color: 0xB9F2FF,
      hexColor: '#B9F2FF',
      gradient: ['#B9F2FF', '#00D4FF', '#0099CC'],
      glowEffect: 'strong',
      borderStyle: 'animated',
      borderEmoji: '💎',
      cardStyle: 'elite'
    },
    MASTER: {
      name: 'Master',
      minXP: 100000,
      badge: '👑',
      color: 0x9B59B6,
      hexColor: '#9B59B6',
      gradient: ['#9B59B6', '#E91E63', '#FF6B6B', '#FFD700'],
      glowEffect: 'rainbow',
      borderStyle: 'rainbow',
      borderEmoji: '👑',
      cardStyle: 'legendary'
    }
  };

  /**
   * Prestige Aura configurations
   */
  static PRESTIGE_AURAS = {
    0: { name: 'None', glow: null, emoji: '', intensity: 0 },
    1: { name: 'Gold Shimmer', glow: '#FFD700', emoji: '✨', intensity: 1 },
    2: { name: 'Purple Aura', glow: '#9B59B6', emoji: '💜', intensity: 2 },
    3: { name: 'Rainbow Pulse', glow: 'rainbow', emoji: '🌈', intensity: 3 },
    4: { name: 'Cosmic Flame', glow: 'cosmic', emoji: '🔮', intensity: 4 },
    5: { name: 'Divine Light', glow: 'divine', emoji: '👑', intensity: 5 }
  };

  /**
   * Level-based Tier configurations (legacy support)
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

  // ═══════════════════════════════════════════════════════════════════
  // 🎴 PRO MAX CARD METHODS (XP-Based)
  // ═══════════════════════════════════════════════════════════════════

  /**
   * Get tier from lifetime XP (totalXpEarned)
   * @param {number} lifetimeXP - Total XP earned across all prestiges
   * @returns {Object} Tier configuration
   */
  static getTierFromXP(lifetimeXP) {
    const xp = lifetimeXP || 0;
    const tiers = Object.values(this.XP_TIERS).reverse();
    
    for (const tier of tiers) {
      if (xp >= tier.minXP) {
        return { ...tier, lifetimeXP: xp };
      }
    }
    
    return { ...this.XP_TIERS.BRONZE, lifetimeXP: xp };
  }

  /**
   * Get prestige aura effect
   * @param {number} prestigeLevel - User's prestige level
   * @returns {Object} Aura configuration
   */
  static getPrestigeAura(prestigeLevel) {
    const level = Math.min(prestigeLevel || 0, 5);
    return this.PRESTIGE_AURAS[level] || this.PRESTIGE_AURAS[0];
  }

  /**
   * Build dynamic border based on tier and prestige
   * @param {Object} tier - Tier configuration
   * @param {number} prestigeLevel - Prestige level
   * @returns {string} Border decoration string
   */
  static buildCardBorder(tier, prestigeLevel = 0) {
    const aura = this.getPrestigeAura(prestigeLevel);
    
    if (tier.borderStyle === 'rainbow' || aura.intensity >= 3) {
      return '🌟💎✨💜🌟💎✨💜🌟';
    }
    if (tier.borderStyle === 'animated' || aura.intensity >= 2) {
      return `${tier.borderEmoji}═══════════════${tier.borderEmoji}`;
    }
    if (tier.borderStyle === 'gradient') {
      return `${tier.borderEmoji}━━━━━━━━━━━━━━━${tier.borderEmoji}`;
    }
    return '━━━━━━━━━━━━━━━━━━━';
  }

  /**
   * Create multiplier sparkline progress bar
   * @param {number} multiplier - Current multiplier value
   * @param {number} maxMultiplier - Maximum possible multiplier
   * @param {string} type - 'streak' or 'prestige'
   * @returns {string} Visual sparkline
   */
  static createMultiplierSparkline(multiplier, maxMultiplier = 2.0, type = 'streak') {
    const percent = Math.min(((multiplier - 1) / (maxMultiplier - 1)) * 100, 100);
    const filled = Math.round(percent / 10);
    const empty = 10 - filled;
    
    const fillChar = type === 'streak' ? '🔥' : '⭐';
    const emptyChar = '░';
    
    // Compact sparkline for card display
    if (multiplier <= 1) {
      return `\`${'░'.repeat(10)}\` 1.0x`;
    }
    
    const bar = '█'.repeat(filled) + '░'.repeat(empty);
    return `\`${bar}\` ${multiplier.toFixed(2)}x`;
  }

  /**
   * Generate collector series number from user ID or date
   * @param {string} odId - User's document ID or discord ID
   * @param {Date} createdAt - Account creation date
   * @returns {string} Formatted series number
   */
  static generateSeriesNumber(odId, createdAt) {
    // Use last 4 chars of ID + days since epoch for uniqueness
    const idSuffix = (odId || 'XXXX').slice(-4).toUpperCase();
    const daysSinceEpoch = createdAt 
      ? Math.floor((new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24))
      : 0;
    const seriesNum = (daysSinceEpoch % 10000).toString().padStart(4, '0');
    
    return `#${seriesNum}-${idSuffix}`;
  }

  /**
   * Get complete card theme for Pro Max display
   * @param {Object} user - User document
   * @returns {Object} Complete theme configuration
   */
  static getProMaxTheme(user) {
    const lifetimeXP = user?.prestige?.totalXpEarned || user?.xp || 0;
    const prestigeLevel = user?.prestige?.level || 0;
    
    const tier = this.getTierFromXP(lifetimeXP);
    const aura = this.getPrestigeAura(prestigeLevel);
    const border = this.buildCardBorder(tier, prestigeLevel);
    const seriesNumber = this.generateSeriesNumber(
      user?.discordId || user?._id?.toString(),
      user?.createdAt
    );
    
    return {
      tier,
      aura,
      border,
      seriesNumber,
      embedColor: tier.color,
      headerEmoji: aura.emoji || tier.badge,
      footerText: `${tier.badge} ${tier.name} Series ${seriesNumber}`,
      glowIntensity: Math.max(tier.glowEffect === 'none' ? 0 : 1, aura.intensity),
      isLegendary: tier.cardStyle === 'legendary' || prestigeLevel >= 3
    };
  }

  /**
   * Build the multiplier display box for Pro Max cards
   * @param {number} streak - User streak days
   * @param {number} prestigeLevel - User prestige level
   * @param {number} prestigeMultiplier - Prestige bonus multiplier
   * @returns {Object} Multiplier box content
   */
  static buildMultiplierBox(streak, prestigeLevel, prestigeMultiplier) {
    // Calculate streak multiplier
    let streakMultiplier = 1.0;
    if (streak >= 30) streakMultiplier = 2.0;
    else if (streak >= 14) streakMultiplier = 1.5;
    else if (streak >= 7) streakMultiplier = 1.25;
    else if (streak >= 3) streakMultiplier = 1.1;
    
    const prestige = prestigeMultiplier || 1.0;
    const total = streakMultiplier * prestige;
    
    const streakSparkline = this.createMultiplierSparkline(streakMultiplier, 2.0, 'streak');
    const prestigeSparkline = this.createMultiplierSparkline(prestige, 1.5, 'prestige');
    
    return {
      streakMultiplier,
      prestigeMultiplier: prestige,
      totalMultiplier: total,
      streakDisplay: streakSparkline,
      prestigeDisplay: prestigeSparkline,
      totalDisplay: `**${total.toFixed(2)}x**`,
      hasBonus: total > 1,
      formatted: total > 1 
        ? `🔥 ${streakSparkline}\n⭐ ${prestigeSparkline}\n━━━━━━━━━━━━━━\n💎 **TOTAL: ${total.toFixed(2)}x XP**`
        : '`No active bonuses`'
    };
  }

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
