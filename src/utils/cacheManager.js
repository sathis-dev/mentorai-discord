/**
 * Cache Manager - Multi-Layer Caching System
 * 
 * Features:
 * - Memory cache (fastest, but lost on restart)
 * - Redis cache (persistent, shared across instances)
 * - Cache statistics
 * - Fallback functions
 * - Cache invalidation patterns
 */

import NodeCache from 'node-cache';
import Redis from 'ioredis';

class CacheManager {
  constructor() {
    // Memory cache (fastest, but lost on restart)
    this.memoryCache = new NodeCache({
      stdTTL: 300, // 5 minutes default
      checkperiod: 60, // Check for expired keys every 60 seconds
      useClones: false // Better performance
    });
    
    // Redis cache (persistent, shared across instances)
    this.redisClient = null;
    this.redisConnected = false;
    this.initializeRedis();
    
    // Cache statistics
    this.stats = {
      memoryHits: 0,
      memoryMisses: 0,
      redisHits: 0,
      redisMisses: 0,
      memorySets: 0,
      redisSets: 0
    };
    
    // Log stats periodically (every 5 minutes in production)
    if (process.env.NODE_ENV !== 'test') {
      setInterval(() => this.logStats(), 5 * 60 * 1000);
    }
  }

  async initializeRedis() {
    if (process.env.REDIS_URL) {
      try {
        this.redisClient = new Redis(process.env.REDIS_URL, {
          retryDelayOnFailover: 100,
          maxRetriesPerRequest: 3,
          lazyConnect: true
        });
        
        await this.redisClient.connect();
        await this.redisClient.ping();
        this.redisConnected = true;
        console.log('✅ Redis connected for caching');
      } catch (error) {
        console.log('⚠️ Redis unavailable, using memory cache only:', error.message);
        this.redisClient = null;
        this.redisConnected = false;
      }
    }
  }

  async get(key, options = {}) {
    const {
      skipMemory = false,
      skipRedis = false,
      ttl = 300, // 5 minutes default
      refreshOnAccess = false,
      fallbackFunction = null
    } = options;
    
    // Try memory cache first (fastest)
    if (!skipMemory) {
      const memoryValue = this.memoryCache.get(key);
      if (memoryValue !== undefined) {
        this.stats.memoryHits++;
        
        if (refreshOnAccess) {
          this.memoryCache.ttl(key, ttl);
        }
        
        return memoryValue;
      }
      this.stats.memoryMisses++;
    }
    
    // Try Redis cache
    if (!skipRedis && this.redisClient && this.redisConnected) {
      try {
        const redisValue = await this.redisClient.get(key);
        if (redisValue !== null) {
          this.stats.redisHits++;
          
          // Parse JSON if it's a string
          let parsedValue;
          try {
            parsedValue = JSON.parse(redisValue);
          } catch (e) {
            parsedValue = redisValue;
          }
          
          // Store in memory cache for faster access
          if (!skipMemory) {
            this.memoryCache.set(key, parsedValue, ttl);
            this.stats.memorySets++;
          }
          
          if (refreshOnAccess && this.redisClient) {
            await this.redisClient.expire(key, ttl);
          }
          
          return parsedValue;
        }
        this.stats.redisMisses++;
      } catch (error) {
        console.error('Redis get error:', error);
      }
    }
    
    // Try fallback function
    if (fallbackFunction) {
      try {
        const value = await fallbackFunction();
        if (value !== undefined && value !== null) {
          await this.set(key, value, { ttl });
          return value;
        }
      } catch (error) {
        console.error('Fallback function error:', error);
      }
    }
    
    return null;
  }

  async set(key, value, options = {}) {
    const {
      ttl = 300, // 5 minutes
      skipMemory = false,
      skipRedis = false
    } = options;
    
    // Store in memory cache
    if (!skipMemory) {
      this.memoryCache.set(key, value, ttl);
      this.stats.memorySets++;
    }
    
    // Store in Redis
    if (!skipRedis && this.redisClient && this.redisConnected) {
      try {
        const stringValue = typeof value === 'object' ? 
          JSON.stringify(value) : String(value);
        
        if (ttl === 0) {
          await this.redisClient.set(key, stringValue);
        } else {
          await this.redisClient.setex(key, ttl, stringValue);
        }
        this.stats.redisSets++;
      } catch (error) {
        console.error('Redis set error:', error);
      }
    }
    
    return true;
  }

  async delete(key) {
    // Delete from memory
    this.memoryCache.del(key);
    
    // Delete from Redis
    if (this.redisClient && this.redisConnected) {
      try {
        await this.redisClient.del(key);
      } catch (error) {
        console.error('Redis delete error:', error);
      }
    }
    
    return true;
  }

  async has(key) {
    // Check memory
    if (this.memoryCache.has(key)) {
      return true;
    }
    
    // Check Redis
    if (this.redisClient && this.redisConnected) {
      try {
        const exists = await this.redisClient.exists(key);
        return exists === 1;
      } catch (error) {
        console.error('Redis exists error:', error);
      }
    }
    
    return false;
  }

  // Cache patterns for common data
  async cacheUser(userId, userData, ttl = 600) {
    const key = `user:${userId}`;
    return await this.set(key, userData, { ttl });
  }

  async getUser(userId, fallbackFunction = null) {
    const key = `user:${userId}`;
    return await this.get(key, { fallbackFunction });
  }

  async cacheQuizQuestions(topic, difficulty, questions, ttl = 3600) {
    const key = `quiz:${topic}:${difficulty}`;
    return await this.set(key, questions, { ttl });
  }

  async getQuizQuestions(topic, difficulty) {
    const key = `quiz:${topic}:${difficulty}`;
    return await this.get(key);
  }

  async cacheLeaderboard(type, data, ttl = 60) {
    const key = `leaderboard:${type}`;
    return await this.set(key, data, { ttl });
  }

  async getLeaderboard(type) {
    const key = `leaderboard:${type}`;
    return await this.get(key);
  }

  async cacheAIResponse(prompt, response, ttl = 1800) {
    // Hash the prompt to create a shorter key
    const hash = this.hashString(prompt);
    const key = `ai:${hash}`;
    return await this.set(key, response, { ttl });
  }

  async getAIResponse(prompt) {
    const hash = this.hashString(prompt);
    const key = `ai:${hash}`;
    return await this.get(key);
  }

  // Simple hash function for cache keys
  hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }

  // Invalidate cache patterns
  async invalidateUser(userId) {
    await this.delete(`user:${userId}`);
    // Also invalidate user-related caches
    await this.delete(`user_stats:${userId}`);
    await this.delete(`user_achievements:${userId}`);
  }

  async invalidateQuizCache(topic = null) {
    if (topic) {
      const keys = await this.getKeys(`quiz:${topic}:*`);
      await this.deleteMultiple(keys);
    } else {
      const keys = await this.getKeys('quiz:*');
      await this.deleteMultiple(keys);
    }
  }

  async getKeys(pattern) {
    const keys = [];
    
    // For memory cache, we need to iterate
    const allKeys = this.memoryCache.keys();
    const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
    keys.push(...allKeys.filter(key => regex.test(key)));
    
    // For Redis
    if (this.redisClient && this.redisConnected) {
      try {
        const redisKeys = await this.redisClient.keys(pattern);
        // Add Redis keys that aren't already in the list
        for (const key of redisKeys) {
          if (!keys.includes(key)) {
            keys.push(key);
          }
        }
      } catch (error) {
        console.error('Redis keys error:', error);
      }
    }
    
    return keys;
  }

  async deleteMultiple(keys) {
    if (!keys || keys.length === 0) return;
    
    // Delete from memory
    keys.forEach(key => this.memoryCache.del(key));
    
    // Delete from Redis
    if (this.redisClient && this.redisConnected && keys.length > 0) {
      try {
        await this.redisClient.del(...keys);
      } catch (error) {
        console.error('Redis delete multiple error:', error);
      }
    }
  }

  async flushAll() {
    this.memoryCache.flushAll();
    
    if (this.redisClient && this.redisConnected) {
      try {
        await this.redisClient.flushall();
      } catch (error) {
        console.error('Redis flushall error:', error);
      }
    }
  }

  logStats() {
    const memoryStats = this.memoryCache.getStats();
    const memoryHitRate = this.stats.memoryHits / (this.stats.memoryHits + this.stats.memoryMisses) || 0;
    const redisHitRate = this.stats.redisHits / (this.stats.redisHits + this.stats.redisMisses) || 0;
    
    console.log('📊 Cache Statistics:');
    console.log(`  Memory Cache: ${memoryStats.keys} keys, Hit Rate: ${(memoryHitRate * 100).toFixed(1)}%`);
    console.log(`  Redis Connected: ${this.redisConnected ? 'Yes' : 'No'}`);
    if (this.redisConnected) {
      console.log(`  Redis Hit Rate: ${(redisHitRate * 100).toFixed(1)}%`);
    }
    
    // Reset counters for next period
    this.stats.memoryHits = 0;
    this.stats.memoryMisses = 0;
    this.stats.redisHits = 0;
    this.stats.redisMisses = 0;
  }

  // Get cache stats for monitoring
  getStats() {
    const memoryStats = this.memoryCache.getStats();
    return {
      memory: {
        keys: memoryStats.keys,
        hits: memoryStats.hits,
        misses: memoryStats.misses,
        hitRate: memoryStats.hits / (memoryStats.hits + memoryStats.misses) || 0
      },
      redis: {
        connected: this.redisConnected,
        hits: this.stats.redisHits,
        misses: this.stats.redisMisses,
        hitRate: this.stats.redisHits / (this.stats.redisHits + this.stats.redisMisses) || 0
      },
      operations: {
        memorySets: this.stats.memorySets,
        redisSets: this.stats.redisSets
      }
    };
  }

  // Middleware helper for caching API responses
  cacheMiddleware(keyPrefix, ttl = 300) {
    return async (req, res, next) => {
      const key = `${keyPrefix}:${req.originalUrl}`;
      
      const cached = await this.get(key);
      if (cached) {
        return res.json(cached);
      }
      
      // Override res.json to cache the response
      const originalJson = res.json.bind(res);
      res.json = async (data) => {
        await this.set(key, data, { ttl });
        return originalJson(data);
      };
      
      next();
    };
  }

  // Graceful shutdown
  async close() {
    if (this.redisClient) {
      try {
        await this.redisClient.quit();
        console.log('✅ Redis cache connection closed');
      } catch (error) {
        console.error('Error closing Redis connection:', error);
      }
    }
  }
}

// Singleton instance
export const cacheManager = new CacheManager();
export default cacheManager;
