/**
 * Accuracy System - Topic-Based Accuracy Tracking
 * 
 * Tracks accuracy per topic to identify weak areas
 * and provide targeted recommendations.
 */

export class AccuracySystem {
  /**
   * Accuracy thresholds
   */
  static THRESHOLDS = {
    EXCELLENT: 90,
    GOOD: 75,
    AVERAGE: 60,
    NEEDS_WORK: 40,
    STRUGGLING: 0
  };

  /**
   * Calculate overall accuracy
   * @param {number} correct - Correct answers
   * @param {number} total - Total questions
   * @returns {number} Accuracy percentage
   */
  static calculateAccuracy(correct, total) {
    if (total === 0) return 0;
    return Math.round((correct / total) * 100);
  }

  /**
   * Get accuracy rating
   * @param {number} accuracy - Accuracy percentage
   * @returns {Object} Rating info
   */
  static getAccuracyRating(accuracy) {
    if (accuracy >= this.THRESHOLDS.EXCELLENT) {
      return { rating: 'Excellent', emoji: '🌟', color: '#00FF00' };
    }
    if (accuracy >= this.THRESHOLDS.GOOD) {
      return { rating: 'Good', emoji: '✅', color: '#90EE90' };
    }
    if (accuracy >= this.THRESHOLDS.AVERAGE) {
      return { rating: 'Average', emoji: '📊', color: '#FFD700' };
    }
    if (accuracy >= this.THRESHOLDS.NEEDS_WORK) {
      return { rating: 'Needs Work', emoji: '📝', color: '#FFA500' };
    }
    return { rating: 'Struggling', emoji: '💪', color: '#FF6347' };
  }

  /**
   * Update topic accuracy
   * @param {Object} user - User document
   * @param {string} topic - Topic name
   * @param {number} correct - Correct answers this session
   * @param {number} total - Total questions this session
   * @returns {Object} Updated topic stats
   */
  static updateTopicAccuracy(user, topic, correct, total) {
    if (!user.topicAccuracy) {
      user.topicAccuracy = new Map();
    }
    
    const normalizedTopic = topic.toLowerCase().trim();
    const existing = user.topicAccuracy.get(normalizedTopic) || { correct: 0, total: 0 };
    
    const updated = {
      correct: existing.correct + correct,
      total: existing.total + total,
      lastAttempt: new Date()
    };
    
    user.topicAccuracy.set(normalizedTopic, updated);
    
    return {
      topic: normalizedTopic,
      ...updated,
      accuracy: this.calculateAccuracy(updated.correct, updated.total),
      sessionAccuracy: this.calculateAccuracy(correct, total)
    };
  }

  /**
   * Get weak topics (below threshold)
   * @param {Object} user - User document
   * @param {number} threshold - Accuracy threshold (default: 60%)
   * @param {number} minQuestions - Minimum questions attempted (default: 5)
   * @returns {Array} Weak topics sorted by accuracy
   */
  static getWeakTopics(user, threshold = 60, minQuestions = 5) {
    if (!user.topicAccuracy) return [];
    
    const weakTopics = [];
    
    for (const [topic, stats] of user.topicAccuracy.entries()) {
      if (stats.total >= minQuestions) {
        const accuracy = this.calculateAccuracy(stats.correct, stats.total);
        if (accuracy < threshold) {
          weakTopics.push({
            topic,
            accuracy,
            correct: stats.correct,
            total: stats.total,
            rating: this.getAccuracyRating(accuracy)
          });
        }
      }
    }
    
    return weakTopics.sort((a, b) => a.accuracy - b.accuracy);
  }

  /**
   * Get strong topics (above threshold)
   * @param {Object} user - User document
   * @param {number} threshold - Accuracy threshold (default: 75%)
   * @param {number} minQuestions - Minimum questions attempted (default: 5)
   * @returns {Array} Strong topics sorted by accuracy
   */
  static getStrongTopics(user, threshold = 75, minQuestions = 5) {
    if (!user.topicAccuracy) return [];
    
    const strongTopics = [];
    
    for (const [topic, stats] of user.topicAccuracy.entries()) {
      if (stats.total >= minQuestions) {
        const accuracy = this.calculateAccuracy(stats.correct, stats.total);
        if (accuracy >= threshold) {
          strongTopics.push({
            topic,
            accuracy,
            correct: stats.correct,
            total: stats.total,
            rating: this.getAccuracyRating(accuracy)
          });
        }
      }
    }
    
    return strongTopics.sort((a, b) => b.accuracy - a.accuracy);
  }

  /**
   * Get all topic stats
   * @param {Object} user - User document
   * @returns {Array} All topics with stats
   */
  static getAllTopicStats(user) {
    if (!user.topicAccuracy) return [];
    
    const allTopics = [];
    
    for (const [topic, stats] of user.topicAccuracy.entries()) {
      const accuracy = this.calculateAccuracy(stats.correct, stats.total);
      allTopics.push({
        topic,
        accuracy,
        correct: stats.correct,
        total: stats.total,
        rating: this.getAccuracyRating(accuracy),
        lastAttempt: stats.lastAttempt
      });
    }
    
    return allTopics.sort((a, b) => b.total - a.total);
  }

  /**
   * Get topic recommendation based on accuracy
   * @param {Object} user - User document
   * @returns {Object} Recommendation
   */
  static getTopicRecommendation(user) {
    const weakTopics = this.getWeakTopics(user);
    const strongTopics = this.getStrongTopics(user);
    
    if (weakTopics.length > 0) {
      const weakest = weakTopics[0];
      return {
        type: 'improve',
        topic: weakest.topic,
        accuracy: weakest.accuracy,
        message: `📝 Focus on ${weakest.topic} - currently at ${weakest.accuracy}% accuracy`,
        priority: 'high'
      };
    }
    
    if (strongTopics.length > 0) {
      // Suggest advancing to harder content
      const strongest = strongTopics[0];
      return {
        type: 'advance',
        topic: strongest.topic,
        accuracy: strongest.accuracy,
        message: `🌟 You're great at ${strongest.topic}! Try harder challenges.`,
        priority: 'medium'
      };
    }
    
    return {
      type: 'explore',
      message: '🗺️ Try different topics to find your strengths!',
      priority: 'low'
    };
  }

  /**
   * Get difficulty recommendation based on accuracy
   * @param {Object} user - User document
   * @param {string} topic - Topic name
   * @returns {string} Recommended difficulty
   */
  static getRecommendedDifficulty(user, topic) {
    if (!user.topicAccuracy) return 'medium';
    
    const normalizedTopic = topic.toLowerCase().trim();
    const stats = user.topicAccuracy.get(normalizedTopic);
    
    if (!stats || stats.total < 3) return 'easy';
    
    const accuracy = this.calculateAccuracy(stats.correct, stats.total);
    
    if (accuracy >= 85) return 'hard';
    if (accuracy >= 65) return 'medium';
    return 'easy';
  }

  /**
   * Generate accuracy report
   * @param {Object} user - User document
   * @returns {Object} Report data
   */
  static generateAccuracyReport(user) {
    const allTopics = this.getAllTopicStats(user);
    const weakTopics = this.getWeakTopics(user);
    const strongTopics = this.getStrongTopics(user);
    
    // Calculate overall stats
    let totalCorrect = 0;
    let totalQuestions = 0;
    
    for (const topic of allTopics) {
      totalCorrect += topic.correct;
      totalQuestions += topic.total;
    }
    
    const overallAccuracy = this.calculateAccuracy(totalCorrect, totalQuestions);
    
    return {
      overallAccuracy,
      overallRating: this.getAccuracyRating(overallAccuracy),
      totalTopics: allTopics.length,
      totalQuestions,
      totalCorrect,
      topPerformers: strongTopics.slice(0, 3),
      needsImprovement: weakTopics.slice(0, 3),
      recommendation: this.getTopicRecommendation(user)
    };
  }
}

export default AccuracySystem;
