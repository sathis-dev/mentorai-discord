/**
 * Rate Limiter - Request Rate Limiting System
 * 
 * Features:
 * - Per-user rate limiting
 * - Global rate limiting
 * - Multiple action types
 * - Automatic cleanup
 */

class RateLimiter {
  constructor() {
    this.limits = new Map(); // key -> { count, resetTime }
    
    this.defaultLimits = {
      // Per user limits
      user: {
        quiz: { window: 60000, max: 5 },      // 5 quizzes per minute
        ai: { window: 60000, max: 10 },       // 10 AI calls per minute
        daily: { window: 86400000, max: 1 },  // 1 daily per day
        challenge: { window: 60000, max: 3 }, // 3 challenges per minute
        arena: { window: 300000, max: 5 },    // 5 arena joins per 5 minutes
        command: { window: 10000, max: 10 },  // 10 commands per 10 seconds
        message: { window: 60000, max: 30 }   // 30 messages per minute
      },
      // Global limits
      global: {
        ai: { window: 60000, max: 100 },      // 100 AI calls per minute globally
        quiz: { window: 60000, max: 200 },    // 200 quizzes per minute globally
        arena: { window: 60000, max: 50 }     // 50 arena operations per minute
      }
    };

    // Cleanup old entries every minute
    this.cleanupInterval = setInterval(() => this.cleanup(), 60000);
  }

  /**
   * Check if action is allowed
   * @param {string} key - User ID or unique key
   * @param {string} type - Action type (quiz, ai, daily, etc.)
   * @param {string} scope - 'user' or 'global'
   * @returns {Object} { allowed, remaining, retryAfter, resetTime }
   */
  check(key, type, scope = 'user') {
    const limitConfig = this.defaultLimits[scope]?.[type];
    if (!limitConfig) return { allowed: true, remaining: Infinity };

    const now = Date.now();
    const limitKey = `${scope}:${type}:${key}`;
    
    let limit = this.limits.get(limitKey);
    
    // Initialize or check if window expired
    if (!limit || now >= limit.resetTime) {
      limit = {
        count: 0,
        resetTime: now + limitConfig.window,
        firstRequest: now
      };
    }

    // Check limit
    if (limit.count >= limitConfig.max) {
      const retryAfter = Math.ceil((limit.resetTime - now) / 1000);
      return {
        allowed: false,
        remaining: 0,
        retryAfter,
        resetTime: limit.resetTime,
        message: `Rate limited. Try again in ${retryAfter} seconds.`
      };
    }

    // Increment count
    limit.count++;
    this.limits.set(limitKey, limit);

    return {
      allowed: true,
      remaining: limitConfig.max - limit.count,
      resetTime: limit.resetTime
    };
  }

  /**
   * Check multiple limits at once
   * @param {string} userId - User ID
   * @param {Array} types - Action types to check
   * @returns {Object} Combined result
   */
  checkMultiple(userId, types) {
    for (const type of types) {
      const result = this.check(userId, type, 'user');
      if (!result.allowed) {
        return result;
      }
    }

    // Check global limits for each type
    for (const type of types) {
      if (this.defaultLimits.global[type]) {
        const result = this.check('global', type, 'global');
        if (!result.allowed) {
          return { ...result, message: 'Global rate limit reached. Please wait.' };
        }
      }
    }

    return { allowed: true };
  }

  /**
   * Get rate limit info without incrementing
   * @param {string} key - User ID or unique key
   * @param {string} type - Action type
   * @param {string} scope - 'user' or 'global'
   * @returns {Object} Limit info
   */
  getInfo(key, type, scope = 'user') {
    const limitConfig = this.defaultLimits[scope]?.[type];
    if (!limitConfig) return { remaining: Infinity, max: Infinity };

    const limitKey = `${scope}:${type}:${key}`;
    const limit = this.limits.get(limitKey);
    
    if (!limit || Date.now() >= limit.resetTime) {
      return { 
        remaining: limitConfig.max, 
        max: limitConfig.max,
        window: limitConfig.window 
      };
    }

    return {
      remaining: limitConfig.max - limit.count,
      max: limitConfig.max,
      resetTime: limit.resetTime,
      window: limitConfig.window
    };
  }

  /**
   * Get all limits for a user
   * @param {string} userId - User ID
   * @returns {Object} All limit info
   */
  getAllInfo(userId) {
    const info = {};
    
    for (const type of Object.keys(this.defaultLimits.user)) {
      info[type] = this.getInfo(userId, type, 'user');
    }

    return info;
  }

  /**
   * Cleanup expired limits
   */
  cleanup() {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, limit] of this.limits.entries()) {
      if (now >= limit.resetTime) {
        this.limits.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      console.log(`[RateLimiter] Cleaned up ${cleaned} expired limits`);
    }
  }

  /**
   * Reset limit for a specific key (for testing or admin)
   * @param {string} key - User ID or unique key
   * @param {string} type - Action type
   * @param {string} scope - 'user' or 'global'
   */
  reset(key, type, scope = 'user') {
    const limitKey = `${scope}:${type}:${key}`;
    this.limits.delete(limitKey);
  }

  /**
   * Reset all limits for a user
   * @param {string} userId - User ID
   */
  resetUser(userId) {
    for (const [key] of this.limits.entries()) {
      if (key.includes(userId)) {
        this.limits.delete(key);
      }
    }
  }

  /**
   * Add custom limit configuration
   * @param {string} scope - 'user' or 'global'
   * @param {string} type - Action type
   * @param {Object} config - { window, max }
   */
  addLimit(scope, type, config) {
    if (!this.defaultLimits[scope]) {
      this.defaultLimits[scope] = {};
    }
    this.defaultLimits[scope][type] = config;
  }

  /**
   * Update existing limit configuration
   * @param {string} scope - 'user' or 'global'
   * @param {string} type - Action type
   * @param {Object} config - { window, max }
   */
  updateLimit(scope, type, config) {
    if (this.defaultLimits[scope]?.[type]) {
      this.defaultLimits[scope][type] = {
        ...this.defaultLimits[scope][type],
        ...config
      };
    }
  }

  /**
   * Get statistics
   * @returns {Object} Statistics
   */
  getStats() {
    const stats = {
      totalKeys: this.limits.size,
      byScope: { user: 0, global: 0 },
      byType: {}
    };

    for (const [key] of this.limits.entries()) {
      const [scope, type] = key.split(':');
      stats.byScope[scope] = (stats.byScope[scope] || 0) + 1;
      stats.byType[type] = (stats.byType[type] || 0) + 1;
    }

    return stats;
  }

  /**
   * Destroy the rate limiter (cleanup interval)
   */
  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.limits.clear();
  }
}

// Singleton instance
export const rateLimiter = new RateLimiter();
export default rateLimiter;
