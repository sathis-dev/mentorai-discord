/**
 * Cache System - In-Memory Caching with TTL
 * 
 * Features:
 * - TTL (Time-To-Live) support
 * - Automatic cleanup
 * - Remember pattern (get or generate)
 * - Cache statistics
 */

class Cache {
  constructor(options = {}) {
    this.store = new Map();
    this.ttlStore = new Map(); // key -> { value, expiresAt }
    this.maxSize = options.maxSize || 10000;
    this.defaultTTL = options.defaultTTL || 5 * 60 * 1000; // 5 minutes
    this.hits = 0;
    this.misses = 0;
    
    // Cleanup expired entries every 5 minutes
    this.cleanupInterval = setInterval(() => this.cleanup(), 5 * 60 * 1000);
  }

  /**
   * Set a value with optional TTL
   * @param {string} key - Cache key
   * @param {*} value - Value to cache
   * @param {number} ttl - Time to live in milliseconds (0 = no expiry)
   * @returns {boolean} Success
   */
  set(key, value, ttl = 0) {
    // Evict if at capacity
    if (this.store.size >= this.maxSize && !this.store.has(key)) {
      this.evictOldest();
    }

    this.store.set(key, value);
    
    if (ttl > 0) {
      this.ttlStore.set(key, {
        value,
        expiresAt: Date.now() + ttl,
        createdAt: Date.now()
      });
    } else {
      // Remove from TTL store if previously had TTL
      this.ttlStore.delete(key);
    }
    
    return true;
  }

  /**
   * Get a cached value
   * @param {string} key - Cache key
   * @returns {*} Cached value or undefined
   */
  get(key) {
    // Check TTL first
    const ttlEntry = this.ttlStore.get(key);
    if (ttlEntry) {
      if (Date.now() >= ttlEntry.expiresAt) {
        this.delete(key);
        this.misses++;
        return undefined;
      }
      this.hits++;
      return ttlEntry.value;
    }
    
    if (this.store.has(key)) {
      this.hits++;
      return this.store.get(key);
    }

    this.misses++;
    return undefined;
  }

  /**
   * Delete a cached value
   * @param {string} key - Cache key
   * @returns {boolean} Was deleted
   */
  delete(key) {
    const existed = this.store.has(key);
    this.store.delete(key);
    this.ttlStore.delete(key);
    return existed;
  }

  /**
   * Check if key exists (and not expired)
   * @param {string} key - Cache key
   * @returns {boolean} Exists
   */
  has(key) {
    const ttlEntry = this.ttlStore.get(key);
    if (ttlEntry) {
      if (Date.now() >= ttlEntry.expiresAt) {
        this.delete(key);
        return false;
      }
      return true;
    }
    
    return this.store.has(key);
  }

  /**
   * Clear all cache
   */
  clear() {
    this.store.clear();
    this.ttlStore.clear();
    this.hits = 0;
    this.misses = 0;
  }

  /**
   * Get cache stats
   * @returns {Object} Statistics
   */
  stats() {
    const now = Date.now();
    let expiredCount = 0;
    let totalTTL = 0;

    for (const [, entry] of this.ttlStore) {
      if (now >= entry.expiresAt) {
        expiredCount++;
      }
      totalTTL++;
    }

    return {
      size: this.store.size,
      ttlSize: this.ttlStore.size,
      hits: this.hits,
      misses: this.misses,
      hitRate: this.hits + this.misses > 0 
        ? ((this.hits / (this.hits + this.misses)) * 100).toFixed(2) + '%'
        : 'N/A',
      expiredPending: expiredCount,
      maxSize: this.maxSize
    };
  }

  /**
   * Cleanup expired TTL entries
   * @returns {number} Number of entries cleaned
   */
  cleanup() {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, entry] of this.ttlStore.entries()) {
      if (now >= entry.expiresAt) {
        this.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      console.log(`[Cache] Cleaned up ${cleaned} expired entries`);
    }

    return cleaned;
  }

  /**
   * Evict oldest entries when at capacity
   * @param {number} count - Number to evict
   */
  evictOldest(count = 1) {
    // First, try to evict expired entries
    const cleaned = this.cleanup();
    if (cleaned >= count) return;

    // Then evict oldest by TTL creation time
    const ttlEntries = [...this.ttlStore.entries()]
      .sort((a, b) => a[1].createdAt - b[1].createdAt);

    for (let i = 0; i < count - cleaned && i < ttlEntries.length; i++) {
      this.delete(ttlEntries[i][0]);
    }
  }

  /**
   * Get or generate a cached value
   * @param {string} key - Cache key
   * @param {number} ttl - TTL in milliseconds
   * @param {Function} generator - Async function to generate value
   * @returns {Promise<*>} Cached or generated value
   */
  async remember(key, ttl, generator) {
    if (this.has(key)) {
      return this.get(key);
    }
    
    const value = await generator();
    this.set(key, value, ttl);
    return value;
  }

  /**
   * Get or generate with tags for group invalidation
   * @param {string} key - Cache key
   * @param {Array} tags - Tags for grouping
   * @param {number} ttl - TTL in milliseconds
   * @param {Function} generator - Async function to generate value
   * @returns {Promise<*>} Cached or generated value
   */
  async rememberTagged(key, tags, ttl, generator) {
    // Store tag associations
    for (const tag of tags) {
      const tagKey = `__tag__${tag}`;
      const taggedKeys = this.get(tagKey) || [];
      if (!taggedKeys.includes(key)) {
        taggedKeys.push(key);
        this.set(tagKey, taggedKeys);
      }
    }

    return this.remember(key, ttl, generator);
  }

  /**
   * Invalidate all entries with a specific tag
   * @param {string} tag - Tag to invalidate
   * @returns {number} Number of entries invalidated
   */
  invalidateTag(tag) {
    const tagKey = `__tag__${tag}`;
    const taggedKeys = this.get(tagKey) || [];
    
    let invalidated = 0;
    for (const key of taggedKeys) {
      if (this.delete(key)) {
        invalidated++;
      }
    }
    
    this.delete(tagKey);
    return invalidated;
  }

  /**
   * Get all keys matching a pattern
   * @param {string} pattern - Pattern to match (supports * wildcard)
   * @returns {Array} Matching keys
   */
  keys(pattern = '*') {
    const allKeys = Array.from(this.store.keys());
    
    if (pattern === '*') {
      return allKeys;
    }

    const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
    return allKeys.filter(key => regex.test(key));
  }

  /**
   * Get multiple values at once
   * @param {Array} keys - Array of keys
   * @returns {Object} Key-value pairs
   */
  getMultiple(keys) {
    const result = {};
    for (const key of keys) {
      result[key] = this.get(key);
    }
    return result;
  }

  /**
   * Set multiple values at once
   * @param {Object} entries - Key-value pairs
   * @param {number} ttl - TTL for all entries
   */
  setMultiple(entries, ttl = 0) {
    for (const [key, value] of Object.entries(entries)) {
      this.set(key, value, ttl);
    }
  }

  /**
   * Destroy the cache (cleanup interval)
   */
  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.clear();
  }
}

// Singleton instance
export const cache = new Cache();
export default cache;
