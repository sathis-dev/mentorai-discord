/**
 * AI Orchestrator - Multi-Provider AI System
 * 
 * Features:
 * - Multiple AI provider support (Gemini, OpenAI, Claude)
 * - Priority-based routing
 * - Automatic fallback on failures
 * - Rate limiting
 * - Response caching
 */

import gemini from './gemini.js';
import openai from './openai.js';
import anthropic from './anthropic.js';

class AIOrchestrator {
  constructor() {
    /**
     * Provider configuration with priority
     * Lower number = higher priority
     */
    this.providers = {
      gemini: {
        name: 'Gemini',
        priority: 1,
        enabled: true,
        module: gemini,
        rateLimit: 60,  // requests per minute
        timeout: 30000, // 30 seconds
        models: {
          default: 'gemini-2.0-flash',
          fast: 'gemini-2.0-flash',
          smart: 'gemini-2.0-flash'
        }
      },
      openai: {
        name: 'OpenAI',
        priority: 2,
        enabled: true,
        module: openai,
        rateLimit: 60,
        timeout: 30000,
        models: {
          default: 'gpt-4o-mini',
          fast: 'gpt-4o-mini',
          smart: 'gpt-4o'
        }
      },
      anthropic: {
        name: 'Claude',
        priority: 3,
        enabled: true,
        module: anthropic,
        rateLimit: 40,
        timeout: 45000,
        models: {
          default: 'claude-3-haiku-20240307',
          fast: 'claude-3-haiku-20240307',
          smart: 'claude-3-sonnet-20240229'
        }
      }
    };

    /**
     * Rate limiting tracking
     */
    this.rateLimits = {};
    
    /**
     * Response cache (simple in-memory cache)
     */
    this.cache = new Map();
    this.cacheMaxSize = 100;
    this.cacheTTL = 5 * 60 * 1000; // 5 minutes

    /**
     * Provider health tracking
     */
    this.providerHealth = {};
    for (const providerId of Object.keys(this.providers)) {
      this.providerHealth[providerId] = {
        consecutiveFailures: 0,
        lastFailure: null,
        totalRequests: 0,
        totalFailures: 0
      };
    }
  }

  /**
   * Get providers sorted by priority (excluding disabled/unhealthy)
   * @returns {Array} Sorted provider IDs
   */
  getSortedProviders() {
    return Object.entries(this.providers)
      .filter(([id, provider]) => {
        // Check if enabled
        if (!provider.enabled) return false;
        
        // Check health (skip if too many consecutive failures)
        const health = this.providerHealth[id];
        if (health.consecutiveFailures >= 5) {
          // Allow retry after 5 minutes
          if (health.lastFailure && Date.now() - health.lastFailure < 5 * 60 * 1000) {
            return false;
          }
        }
        
        return true;
      })
      .sort((a, b) => a[1].priority - b[1].priority)
      .map(([id]) => id);
  }

  /**
   * Check rate limit for provider
   * @param {string} providerId - Provider ID
   * @returns {boolean} True if within limits
   */
  checkRateLimit(providerId) {
    const provider = this.providers[providerId];
    if (!provider) return false;

    const now = Date.now();
    const minute = Math.floor(now / 60000);
    const key = `${providerId}_${minute}`;

    if (!this.rateLimits[key]) {
      this.rateLimits[key] = 0;
      
      // Clean old entries
      for (const k of Object.keys(this.rateLimits)) {
        const [, entryMinute] = k.split('_');
        if (parseInt(entryMinute) < minute - 2) {
          delete this.rateLimits[k];
        }
      }
    }

    if (this.rateLimits[key] >= provider.rateLimit) {
      return false;
    }

    this.rateLimits[key]++;
    return true;
  }

  /**
   * Generate cache key
   * @param {string} type - Request type
   * @param {Object} params - Request parameters
   * @returns {string} Cache key
   */
  getCacheKey(type, params) {
    return `${type}_${JSON.stringify(params)}`;
  }

  /**
   * Get cached response
   * @param {string} key - Cache key
   * @returns {Object|null} Cached response or null
   */
  getCached(key) {
    const cached = this.cache.get(key);
    if (!cached) return null;

    if (Date.now() - cached.timestamp > this.cacheTTL) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  /**
   * Set cache entry
   * @param {string} key - Cache key
   * @param {Object} data - Data to cache
   */
  setCache(key, data) {
    // Limit cache size
    if (this.cache.size >= this.cacheMaxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  /**
   * Execute with a specific provider
   * @param {string} providerId - Provider ID
   * @param {Function} operation - Async operation to execute
   * @returns {Object} Result
   */
  async executeWithProvider(providerId, operation) {
    const provider = this.providers[providerId];
    if (!provider) {
      throw new Error(`Provider ${providerId} not found`);
    }

    const health = this.providerHealth[providerId];
    health.totalRequests++;

    try {
      const result = await Promise.race([
        operation(provider),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), provider.timeout)
        )
      ]);

      // Success - reset failure counter
      health.consecutiveFailures = 0;
      
      return { success: true, data: result, provider: providerId };
    } catch (error) {
      health.consecutiveFailures++;
      health.lastFailure = Date.now();
      health.totalFailures++;

      console.error(`[AIOrchestrator] ${provider.name} error:`, error.message);
      
      return { success: false, error: error.message, provider: providerId };
    }
  }

  /**
   * Execute with automatic fallback
   * @param {Function} operation - Operation that receives provider config
   * @param {Object} options - Options
   * @returns {Object} Result
   */
  async executeWithFallback(operation, options = {}) {
    const { preferredProvider, useCache = true, cacheKey = null } = options;

    // Check cache first
    if (useCache && cacheKey) {
      const cached = this.getCached(cacheKey);
      if (cached) {
        return { success: true, data: cached, fromCache: true };
      }
    }

    // Get sorted providers
    let providers = this.getSortedProviders();
    
    // Move preferred provider to front if specified
    if (preferredProvider && providers.includes(preferredProvider)) {
      providers = [preferredProvider, ...providers.filter(p => p !== preferredProvider)];
    }

    // Try each provider
    let lastError = null;
    for (const providerId of providers) {
      // Check rate limit
      if (!this.checkRateLimit(providerId)) {
        console.log(`[AIOrchestrator] ${providerId} rate limited, skipping`);
        continue;
      }

      const result = await this.executeWithProvider(providerId, operation);
      
      if (result.success) {
        // Cache successful result
        if (useCache && cacheKey) {
          this.setCache(cacheKey, result.data);
        }
        return result;
      }

      lastError = result.error;
    }

    // All providers failed
    return { 
      success: false, 
      error: lastError || 'All AI providers failed',
      allProvidersFailed: true 
    };
  }

  // ============== HIGH-LEVEL API METHODS ==============

  /**
   * Generate quiz questions
   * @param {string} topic - Quiz topic
   * @param {number} count - Number of questions
   * @param {string} difficulty - Difficulty level
   * @returns {Object} Quiz data
   */
  async generateQuiz(topic, count = 5, difficulty = 'medium') {
    const cacheKey = this.getCacheKey('quiz', { topic, count, difficulty });

    const result = await this.executeWithFallback(async (provider) => {
      // Try using the provider's generate function if it exists
      if (provider.module.generateQuiz) {
        return await provider.module.generateQuiz(topic, count, difficulty);
      }
      
      // Fallback to generic generation
      return await this.genericGenerateQuiz(provider, topic, count, difficulty);
    }, { useCache: true, cacheKey });

    return result;
  }

  /**
   * Generic quiz generation using any provider
   */
  async genericGenerateQuiz(provider, topic, count, difficulty) {
    const prompt = this.getQuizPrompt(topic, count, difficulty);
    
    if (provider.module.chat) {
      const response = await provider.module.chat(prompt);
      return this.parseQuizResponse(response);
    }
    
    throw new Error('Provider does not support chat');
  }

  /**
   * Generate lesson content
   * @param {string} topic - Lesson topic
   * @param {string} level - User level
   * @returns {Object} Lesson data
   */
  async generateLesson(topic, level = 'beginner') {
    const cacheKey = this.getCacheKey('lesson', { topic, level });

    const result = await this.executeWithFallback(async (provider) => {
      if (provider.module.generateLesson) {
        return await provider.module.generateLesson(topic, level);
      }
      
      return await this.genericGenerateLesson(provider, topic, level);
    }, { useCache: true, cacheKey });

    return result;
  }

  /**
   * Generic lesson generation
   */
  async genericGenerateLesson(provider, topic, level) {
    const prompt = this.getLessonPrompt(topic, level);
    
    if (provider.module.chat) {
      const response = await provider.module.chat(prompt);
      return this.parseLessonResponse(response);
    }
    
    throw new Error('Provider does not support chat');
  }

  /**
   * Explain a concept
   * @param {string} concept - Concept to explain
   * @param {string} style - Explanation style
   * @returns {Object} Explanation
   */
  async explain(concept, style = 'simple') {
    const result = await this.executeWithFallback(async (provider) => {
      if (provider.module.explainConcept) {
        return await provider.module.explainConcept(concept, style);
      }
      
      const prompt = this.getExplainPrompt(concept, style);
      if (provider.module.chat) {
        return await provider.module.chat(prompt);
      }
      
      throw new Error('Provider does not support explanations');
    }, { useCache: true, cacheKey: this.getCacheKey('explain', { concept, style }) });

    return result;
  }

  /**
   * Get a fun fact
   * @param {string} topic - Topic for fun fact
   * @returns {Object} Fun fact
   */
  async getFunFact(topic) {
    const result = await this.executeWithFallback(async (provider) => {
      if (provider.module.generateFunFact) {
        return await provider.module.generateFunFact(topic);
      }
      
      const prompt = `Give me one interesting and surprising fun fact about ${topic} in programming or technology. Keep it concise (2-3 sentences max). Make it engaging and educational.`;
      
      if (provider.module.chat) {
        return await provider.module.chat(prompt);
      }
      
      throw new Error('Provider does not support fun facts');
    }, { useCache: false }); // Don't cache fun facts for variety

    return result;
  }

  /**
   * Generate interview questions
   * @param {string} topic - Interview topic
   * @param {string} level - Difficulty level
   * @param {number} count - Number of questions
   * @returns {Object} Interview questions
   */
  async generateInterviewQuestions(topic, level = 'intermediate', count = 5) {
    const cacheKey = this.getCacheKey('interview', { topic, level, count });

    const result = await this.executeWithFallback(async (provider) => {
      if (provider.module.generateInterviewQuestions) {
        return await provider.module.generateInterviewQuestions(topic, level, count);
      }
      
      const prompt = `Generate ${count} ${level}-level technical interview questions about ${topic}. For each question, provide:
1. The question
2. Key points expected in a good answer
3. Follow-up question an interviewer might ask

Format as JSON array with objects containing: question, keyPoints (array), followUp`;
      
      if (provider.module.chat) {
        const response = await provider.module.chat(prompt);
        return this.parseJsonResponse(response);
      }
      
      throw new Error('Provider does not support interview questions');
    }, { useCache: true, cacheKey });

    return result;
  }

  /**
   * Generate coding challenge
   * @param {string} topic - Challenge topic
   * @param {string} difficulty - Difficulty level
   * @returns {Object} Challenge data
   */
  async generateCodingChallenge(topic, difficulty = 'medium') {
    const cacheKey = this.getCacheKey('challenge', { topic, difficulty });

    const result = await this.executeWithFallback(async (provider) => {
      if (provider.module.generateCodingChallenge) {
        return await provider.module.generateCodingChallenge(topic, difficulty);
      }
      
      const prompt = `Create a ${difficulty}-level coding challenge about ${topic}. Include:
1. Title
2. Problem description
3. Input/output examples
4. Constraints
5. Hints (2-3)
6. Solution approach (without full code)

Format as JSON with keys: title, description, examples (array), constraints (array), hints (array), approach`;
      
      if (provider.module.chat) {
        const response = await provider.module.chat(prompt);
        return this.parseJsonResponse(response);
      }
      
      throw new Error('Provider does not support challenges');
    }, { useCache: true, cacheKey });

    return result;
  }

  // ============== PROMPT TEMPLATES ==============

  getQuizPrompt(topic, count, difficulty) {
    return `Generate ${count} ${difficulty}-level multiple choice quiz questions about ${topic}.

For each question:
- Write a clear, educational question
- Provide 4 options (A, B, C, D)
- Mark the correct answer
- Include a brief explanation

Format as JSON array:
[{
  "question": "...",
  "options": ["A) ...", "B) ...", "C) ...", "D) ..."],
  "correct": 0, // index of correct answer
  "explanation": "..."
}]`;
  }

  getLessonPrompt(topic, level) {
    return `Create a ${level}-level lesson about ${topic}.

Structure:
1. Introduction (what and why)
2. Key concepts (3-5 main points)
3. Code examples (if applicable)
4. Common mistakes to avoid
5. Practice suggestions
6. Summary

Keep it concise but comprehensive. Use clear language appropriate for a ${level} learner.`;
  }

  getExplainPrompt(concept, style) {
    const styles = {
      simple: 'Explain like I\'m a beginner. Use simple terms and analogies.',
      technical: 'Give a detailed technical explanation with proper terminology.',
      eli5: 'Explain like I\'m 5 years old. Use fun analogies and simple words.',
      code: 'Explain with code examples and practical usage.'
    };

    return `${styles[style] || styles.simple}\n\nConcept: ${concept}`;
  }

  // ============== RESPONSE PARSERS ==============

  parseQuizResponse(response) {
    try {
      // Try to extract JSON from response
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      // If no JSON array found, try parsing entire response
      return JSON.parse(response);
    } catch (error) {
      console.error('[AIOrchestrator] Failed to parse quiz response:', error);
      return null;
    }
  }

  parseLessonResponse(response) {
    // For lessons, we can return the text directly
    // or attempt to structure it
    return {
      content: response,
      parsed: false
    };
  }

  parseJsonResponse(response) {
    try {
      // Try to extract JSON from response
      const jsonMatch = response.match(/[\[{][\s\S]*[\]}]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return JSON.parse(response);
    } catch (error) {
      console.error('[AIOrchestrator] Failed to parse JSON response:', error);
      return null;
    }
  }

  // ============== HEALTH & STATS ==============

  /**
   * Get provider health stats
   * @returns {Object} Health statistics
   */
  getHealthStats() {
    const stats = {};
    
    for (const [id, provider] of Object.entries(this.providers)) {
      const health = this.providerHealth[id];
      stats[id] = {
        name: provider.name,
        enabled: provider.enabled,
        priority: provider.priority,
        healthy: health.consecutiveFailures < 5,
        totalRequests: health.totalRequests,
        totalFailures: health.totalFailures,
        successRate: health.totalRequests > 0 
          ? ((health.totalRequests - health.totalFailures) / health.totalRequests * 100).toFixed(1) + '%'
          : 'N/A',
        consecutiveFailures: health.consecutiveFailures,
        lastFailure: health.lastFailure
      };
    }

    return stats;
  }

  /**
   * Reset provider health (e.g., after fixing an issue)
   * @param {string} providerId - Provider to reset
   */
  resetProviderHealth(providerId) {
    if (this.providerHealth[providerId]) {
      this.providerHealth[providerId] = {
        consecutiveFailures: 0,
        lastFailure: null,
        totalRequests: 0,
        totalFailures: 0
      };
    }
  }

  /**
   * Enable/disable a provider
   * @param {string} providerId - Provider ID
   * @param {boolean} enabled - Enable state
   */
  setProviderEnabled(providerId, enabled) {
    if (this.providers[providerId]) {
      this.providers[providerId].enabled = enabled;
    }
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
  }
}

// Export singleton instance
export const aiOrchestrator = new AIOrchestrator();
export default aiOrchestrator;
