/**
 * XP System - Mathematical Foundation
 * 
 * SINGLE FORMULA: XP needed from level N to N+1
 * Exponential growth: 100 * 1.5^(level-1)
 * Level 1→2: 100, 2→3: 150, 3→4: 225, etc.
 */

export class XPSystem {
  /**
   * Calculate XP needed to advance from level N to N+1
   * @param {number} level - Current level
   * @returns {number} XP needed for next level
   */
  static xpForLevel(level) {
    return Math.floor(100 * Math.pow(1.5, level - 1));
  }

  /**
   * Calculate TOTAL XP to reach level N (cumulative)
   * @param {number} level - Target level
   * @returns {number} Total XP required
   */
  static totalXpToLevel(level) {
    let total = 0;
    for (let i = 1; i < level; i++) {
      total += this.xpForLevel(i);
    }
    return total;
  }

  /**
   * Calculate level from total XP
   * @param {number} totalXp - Total XP earned
   * @returns {Object} Level info with current XP and XP to next level
   */
  static levelFromTotalXp(totalXp) {
    let level = 1;
    let remainingXp = totalXp;
    
    while (remainingXp >= this.xpForLevel(level)) {
      remainingXp -= this.xpForLevel(level);
      level++;
    }
    
    return {
      level,
      currentXp: remainingXp,
      xpToNext: this.xpForLevel(level) - remainingXp,
      xpForCurrentLevel: this.xpForLevel(level)
    };
  }

  /**
   * Calculate progress percentage (0-100)
   * @param {number} currentXp - Current XP in this level
   * @param {number} level - Current level
   * @returns {number} Progress percentage
   */
  static progressPercentage(currentXp, level) {
    const needed = this.xpForLevel(level);
    return Math.min(100, Math.max(0, Math.round((currentXp / needed) * 100)));
  }

  /**
   * Calculate XP required for level range
   * @param {number} startLevel - Starting level
   * @param {number} endLevel - Target level
   * @returns {number} Total XP needed
   */
  static xpBetweenLevels(startLevel, endLevel) {
    let total = 0;
    for (let i = startLevel; i < endLevel; i++) {
      total += this.xpForLevel(i);
    }
    return total;
  }

  /**
   * Generate level table for reference
   * @param {number} maxLevel - Max level to show
   * @returns {Array} Level data
   */
  static generateLevelTable(maxLevel = 100) {
    const table = [];
    let totalXp = 0;
    
    for (let level = 1; level <= maxLevel; level++) {
      const xpNeeded = this.xpForLevel(level);
      table.push({
        level,
        xpForThisLevel: xpNeeded,
        totalXpToReach: totalXp,
        totalXpAfter: totalXp + xpNeeded
      });
      totalXp += xpNeeded;
    }
    
    return table;
  }

  /**
   * Get progress bar string
   * @param {number} currentXp - Current XP in level
   * @param {number} level - Current level
   * @param {number} length - Bar length (default 10)
   * @returns {string} Progress bar string
   */
  static getProgressBar(currentXp, level, length = 10) {
    const percentage = this.progressPercentage(currentXp, level);
    const filled = Math.round((percentage / 100) * length);
    const empty = length - filled;
    
    return '█'.repeat(filled) + '░'.repeat(empty);
  }
}

export default XPSystem;
