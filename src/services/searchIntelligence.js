/**
 * SearchIntelligence Service - RAG-Powered Semantic Discovery
 * 
 * Transforms user queries into curriculum-grounded results using
 * vectorized semantic search against the MentorAI knowledge base.
 */

import { curriculumIndexer } from '../core/curriculumIndexer.js';
import { AccuracySystem } from '../core/accuracySystem.js';
import { TierSystem } from '../core/tierSystem.js';
import { xpForLevel } from '../config/brandSystem.js';
import { syncEvents } from './broadcastService.js';

class SearchIntelligenceService {
  constructor() {
    this.searchHistory = new Map(); // userId -> recent searches
    this.analyticsBuffer = []; // Buffer for NOC streaming
  }

  /**
   * Perform semantic search against curriculum
   * @param {string} query - User's search query
   * @param {Object} user - User document for personalization
   * @returns {Object} Search results with recommendations
   */
  async semanticSearch(query, user) {
    const startTime = Date.now();
    
    try {
      // Normalize query
      const normalizedQuery = this.normalizeQuery(query);
      
      // Get RAG results from curriculum indexer
      const ragResults = curriculumIndexer.search(normalizedQuery, 8);
      
      // Enhance results with user context
      const enhancedResults = await this.enhanceWithUserContext(ragResults, user);
      
      // Get AI mentor tip based on user's weak spots
      const mentorTip = this.generateMentorTip(user, enhancedResults);
      
      // Calculate search relevance score
      const relevanceScore = this.calculateRelevanceScore(ragResults, query);
      
      // Track analytics
      this.trackSearch(query, user, enhancedResults, relevanceScore, Date.now() - startTime);
      
      return {
        success: true,
        query: normalizedQuery,
        results: enhancedResults,
        mentorTip,
        relevanceScore,
        totalResults: enhancedResults.length,
        searchTime: Date.now() - startTime,
        userTier: TierSystem.getTierFromXP(user?.prestige?.totalXpEarned || user?.xp || 0)
      };
    } catch (error) {
      console.error('Semantic search error:', error);
      return {
        success: false,
        query,
        results: [],
        mentorTip: 'Try searching for specific topics like "loops", "functions", or "async"',
        relevanceScore: 0,
        totalResults: 0,
        error: error.message
      };
    }
  }

  /**
   * Normalize and expand search query
   */
  normalizeQuery(query) {
    // Common programming synonyms and expansions
    const expansions = {
      'error': 'error handling try catch exception',
      'loop': 'loop for while iteration foreach',
      'function': 'function method arrow callback',
      'array': 'array list collection map filter reduce',
      'object': 'object class property method',
      'async': 'async await promise asynchronous',
      'api': 'api rest fetch http request',
      'dom': 'dom document element html css',
      'react': 'react component state props hooks',
      'node': 'node nodejs express server backend'
    };

    let normalized = query.toLowerCase().trim();
    
    // Expand common terms
    for (const [term, expansion] of Object.entries(expansions)) {
      if (normalized.includes(term)) {
        normalized = `${normalized} ${expansion}`;
        break;
      }
    }

    return normalized;
  }

  /**
   * Enhance results with user context and personalization
   */
  async enhanceWithUserContext(results, user) {
    const weakTopics = AccuracySystem.getWeakTopics(user, 60, 3);
    const weakTopicNames = new Set(weakTopics.map(t => t.topic.toLowerCase()));

    return results.map((result, index) => {
      // Determine if this result addresses a weak topic
      const isWeakSpot = weakTopicNames.has(result.subject?.toLowerCase()) ||
                         result.keywords?.some(k => weakTopicNames.has(k));

      // Calculate XP reward using unified formula
      const baseXP = result.xpReward || Math.floor(50 + (index * 10));
      const level = user?.level || 1;
      
      // Determine action type
      const actionType = this.determineActionType(result);

      return {
        ...result,
        priority: index + 1,
        isWeakSpot,
        priorityReason: isWeakSpot ? '🎯 Addresses your weak spot!' : null,
        xpReward: baseXP,
        actionType,
        actionLabel: this.getActionLabel(actionType),
        actionEmoji: this.getActionEmoji(actionType),
        actionId: this.getActionId(actionType, result)
      };
    });
  }

  /**
   * Determine the best action type for a result
   */
  determineActionType(result) {
    const title = (result.title || '').toLowerCase();
    const subject = (result.subject || '').toLowerCase();
    
    if (result.isCore) return 'lesson';
    if (title.includes('quiz') || title.includes('test')) return 'quiz';
    if (title.includes('project') || title.includes('build')) return 'project';
    if (title.includes('practice') || title.includes('exercise')) return 'practice';
    return 'lesson';
  }

  /**
   * Get action label for button
   */
  getActionLabel(actionType) {
    const labels = {
      lesson: 'Start Lesson',
      quiz: 'Take Quiz',
      project: 'Build Project',
      practice: 'Practice Now'
    };
    return labels[actionType] || 'Learn More';
  }

  /**
   * Get action emoji for button
   */
  getActionEmoji(actionType) {
    const emojis = {
      lesson: '📚',
      quiz: '🎯',
      project: '🔨',
      practice: '⚡'
    };
    return emojis[actionType] || '📖';
  }

  /**
   * Get action ID for button customId
   */
  getActionId(actionType, result) {
    const subject = result.subject || 'javascript';
    return `search_action_${actionType}_${subject}`;
  }

  /**
   * Generate AI mentor tip based on user's weak spots
   */
  generateMentorTip(user, results) {
    const weakTopics = AccuracySystem.getWeakTopics(user, 60, 3);
    
    if (weakTopics.length > 0) {
      const weakestTopic = weakTopics[0];
      const relevantResult = results.find(r => 
        r.subject?.toLowerCase().includes(weakestTopic.topic.toLowerCase()) ||
        r.title?.toLowerCase().includes(weakestTopic.topic.toLowerCase())
      );
      
      if (relevantResult) {
        return `🎯 Based on your **${weakestTopic.accuracy}%** accuracy in **${weakestTopic.topic}**, I recommend starting with "${relevantResult.title}" to strengthen this area.`;
      }
      
      return `💡 Your weakest area is **${weakestTopic.topic}** (${weakestTopic.accuracy}%). These results can help improve your understanding!`;
    }

    const strongTopics = AccuracySystem.getStrongTopics(user, 80, 3);
    if (strongTopics.length > 0) {
      return `🌟 You're excelling at **${strongTopics[0].topic}**! Try exploring advanced topics to keep growing.`;
    }

    return `📚 Start with fundamentals to build a strong foundation. Every expert was once a beginner!`;
  }

  /**
   * Calculate relevance score for analytics
   */
  calculateRelevanceScore(results, query) {
    if (results.length === 0) return 0;
    
    const queryWords = query.toLowerCase().split(/\s+/).filter(w => w.length > 2);
    let totalScore = 0;
    
    for (const result of results) {
      const resultText = `${result.title} ${result.description} ${result.subject}`.toLowerCase();
      let matchCount = 0;
      
      for (const word of queryWords) {
        if (resultText.includes(word)) matchCount++;
      }
      
      totalScore += (matchCount / queryWords.length) * (result.relevanceScore || 1);
    }
    
    return Math.min(100, Math.round((totalScore / results.length) * 100));
  }

  /**
   * Track search for analytics and NOC dashboard
   */
  trackSearch(query, user, results, relevanceScore, searchTime) {
    const searchData = {
      query,
      userId: user?.discordId,
      username: user?.username,
      resultCount: results.length,
      relevanceScore,
      searchTime,
      timestamp: new Date(),
      weakSpotsTargeted: results.filter(r => r.isWeakSpot).length
    };

    // Add to buffer
    this.analyticsBuffer.push(searchData);
    
    // Emit to NOC dashboard via Socket.io
    syncEvents.emit('search_analytics', searchData);
    
    // Track user search history
    const userId = user?.discordId;
    if (userId) {
      if (!this.searchHistory.has(userId)) {
        this.searchHistory.set(userId, []);
      }
      const history = this.searchHistory.get(userId);
      history.unshift({ query, timestamp: Date.now() });
      if (history.length > 10) history.pop();
    }

    // Log for debugging
    console.log(`🔍 Search: "${query}" → ${results.length} results (${relevanceScore}% relevance, ${searchTime}ms)`);
  }

  /**
   * Get search analytics for NOC dashboard
   */
  getAnalytics() {
    const recentSearches = this.analyticsBuffer.slice(-100);
    
    // Calculate aggregate metrics
    const totalSearches = recentSearches.length;
    const avgRelevance = totalSearches > 0 
      ? Math.round(recentSearches.reduce((sum, s) => sum + s.relevanceScore, 0) / totalSearches)
      : 0;
    const avgSearchTime = totalSearches > 0
      ? Math.round(recentSearches.reduce((sum, s) => sum + s.searchTime, 0) / totalSearches)
      : 0;

    // Topic frequency (curiosity heatmap)
    const topicFrequency = {};
    for (const search of recentSearches) {
      const words = search.query.split(/\s+/);
      for (const word of words) {
        if (word.length > 3) {
          topicFrequency[word] = (topicFrequency[word] || 0) + 1;
        }
      }
    }

    return {
      totalSearches,
      avgRelevance,
      avgSearchTime,
      topicFrequency,
      recentSearches: recentSearches.slice(-10)
    };
  }

  /**
   * Get user's recent search history
   */
  getUserHistory(userId) {
    return this.searchHistory.get(userId) || [];
  }
}

// Singleton instance
export const searchIntelligence = new SearchIntelligenceService();

export default searchIntelligence;
