/**
 * Quiz Engine - Complete State Machine
 * 
 * Manages quiz sessions with:
 * - State machine for game flow
 * - AI question generation with fallback
 * - Lifeline support
 * - Session persistence
 */

import { QuizSession } from '../../database/models/QuizSession.js';
import { User } from '../../database/models/User.js';
import { XPService } from '../xpService.js';
import { AccuracySystem } from '../../core/accuracySystem.js';

export class QuizEngine {
  constructor() {
    /**
     * Quiz States
     */
    this.states = {
      IDLE: 'idle',
      LOADING: 'loading',
      QUESTION: 'question',
      ANSWER_PENDING: 'answer_pending',
      SHOWING_RESULT: 'showing_result',
      COMPLETE: 'complete',
      ABANDONED: 'abandoned'
    };
    
    /**
     * In-memory session cache for quick access
     */
    this.sessionCache = new Map();
    
    /**
     * Rate limiting
     */
    this.rateLimits = new Map();
    this.RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
    this.MAX_QUIZZES_PER_MINUTE = 3;
    
    /**
     * XP Service
     */
    this.xpService = new XPService();
  }

  /**
   * Start a new quiz session
   * @param {string} userId - Discord user ID
   * @param {Object} options - Quiz options
   * @returns {Object} Session with first question
   */
  async startQuiz(userId, options = {}) {
    // Check rate limits
    if (!this.checkRateLimit(userId)) {
      throw new Error('Rate limit exceeded. Please wait 1 minute before starting another quiz.');
    }

    // Cancel any existing active session
    await this.abandonSession(userId);

    // Generate questions
    const questions = await this.generateQuestions(options);
    
    if (!questions || questions.length === 0) {
      throw new Error('Failed to generate questions. Please try again.');
    }

    // Create session ID
    const sessionId = `quiz_${Date.now()}_${userId}_${Math.random().toString(36).substr(2, 9)}`;

    // Create session in database
    const session = await QuizSession.create({
      sessionId,
      discordId: userId,
      topic: options.topic || 'General',
      difficulty: options.difficulty || 'medium',
      questions,
      currentQuestion: 0,
      score: 0,
      answers: [],
      lifelines: {
        hintUsed: false,
        fiftyFiftyUsed: false,
        skipUsed: false,
        eliminatedOptions: []
      },
      status: 'active',
      timeLimit: options.timeLimit || null,
      timePerQuestion: options.timePerQuestion || null,
      startedAt: new Date(),
      lastActivityAt: new Date()
    });

    // Cache session
    this.sessionCache.set(sessionId, session);

    // Update rate limit
    this.updateRateLimit(userId);

    return {
      sessionId,
      question: this.formatQuestion(session.questions[0], 0, session),
      totalQuestions: session.questions.length,
      topic: session.topic,
      difficulty: session.difficulty,
      lifelines: {
        hint: !session.lifelines.hintUsed,
        fiftyFifty: !session.lifelines.fiftyFiftyUsed
      }
    };
  }

  /**
   * Get current question for session
   * @param {string} sessionId - Session ID
   * @returns {Object} Current question data
   */
  async getCurrentQuestion(sessionId) {
    const session = await this.getSession(sessionId);
    
    if (!session || session.status !== 'active') {
      throw new Error('Session not found or inactive');
    }

    if (session.currentQuestion >= session.questions.length) {
      return this.completeQuiz(sessionId);
    }

    const question = session.questions[session.currentQuestion];
    
    return {
      sessionId,
      question: this.formatQuestion(question, session.currentQuestion, session),
      questionNumber: session.currentQuestion + 1,
      totalQuestions: session.questions.length,
      score: session.score,
      lifelines: {
        hint: !session.lifelines.hintUsed,
        fiftyFifty: !session.lifelines.fiftyFiftyUsed,
        eliminatedOptions: session.lifelines.eliminatedOptions
      }
    };
  }

  /**
   * Submit answer for current question
   * @param {string} sessionId - Session ID
   * @param {number} answerIndex - Selected answer (0-3)
   * @returns {Object} Answer result
   */
  async submitAnswer(sessionId, answerIndex) {
    const session = await this.getSession(sessionId);
    
    if (!session || session.status !== 'active') {
      throw new Error('Session not found or inactive');
    }

    const question = session.questions[session.currentQuestion];
    const isCorrect = answerIndex === question.correctIndex;
    const timeTaken = Date.now() - new Date(session.lastActivityAt).getTime();

    // Record answer
    session.answers.push({
      questionIndex: session.currentQuestion,
      selectedIndex: answerIndex,
      correct: isCorrect,
      timeTaken,
      timestamp: new Date()
    });

    // Update score
    if (isCorrect) {
      session.score++;
    }

    session.lastActivityAt = new Date();
    await session.save();

    // Update cache
    this.sessionCache.set(sessionId, session);

    return {
      correct: isCorrect,
      correctIndex: question.correctIndex,
      correctAnswer: question.options[question.correctIndex],
      selectedAnswer: question.options[answerIndex],
      explanation: question.explanation || 'No explanation available.',
      concept: question.concept,
      score: session.score,
      totalQuestions: session.questions.length,
      questionNumber: session.currentQuestion + 1,
      isLastQuestion: session.currentQuestion >= session.questions.length - 1
    };
  }

  /**
   * Move to next question
   * @param {string} sessionId - Session ID
   * @returns {Object} Next question or completion result
   */
  async nextQuestion(sessionId) {
    const session = await this.getSession(sessionId);
    
    if (!session || session.status !== 'active') {
      throw new Error('Session not found or inactive');
    }

    // Move to next question
    session.currentQuestion++;
    session.lifelines.eliminatedOptions = []; // Reset 50/50
    session.lastActivityAt = new Date();

    // Check if quiz is complete
    if (session.currentQuestion >= session.questions.length) {
      return this.completeQuiz(sessionId);
    }

    await session.save();
    this.sessionCache.set(sessionId, session);

    return this.getCurrentQuestion(sessionId);
  }

  /**
   * Complete quiz and calculate rewards
   * @param {string} sessionId - Session ID
   * @returns {Object} Completion result with XP
   */
  async completeQuiz(sessionId) {
    const session = await this.getSession(sessionId);
    
    if (!session) {
      throw new Error('Session not found');
    }

    // Update session status
    session.status = 'completed';
    session.completedAt = new Date();

    // Get user
    const user = await User.findOne({ discordId: session.discordId });
    if (!user) {
      throw new Error('User not found');
    }

    // Calculate XP
    const isPerfect = session.score === session.questions.length;
    const xpCalculation = this.xpService.calculateXp(user, 'quiz', {
      correct: session.score,
      total: session.questions.length,
      perfect: isPerfect,
      difficulty: session.difficulty
    });

    // Award XP
    const xpResult = await this.xpService.awardXp(user, xpCalculation.finalXp, 'quiz');

    // Update quiz stats
    user.quizzesTaken = (user.quizzesTaken || 0) + 1;
    user.correctAnswers = (user.correctAnswers || 0) + session.score;
    user.totalQuestions = (user.totalQuestions || 0) + session.questions.length;

    // Update topic accuracy
    AccuracySystem.updateTopicAccuracy(user, session.topic, session.score, session.questions.length);

    // Add to topics studied
    if (!user.topicsStudied) user.topicsStudied = [];
    if (!user.topicsStudied.includes(session.topic)) {
      user.topicsStudied.push(session.topic);
    }

    await user.save();

    // Update session with XP
    session.xpEarned = xpCalculation.finalXp;
    await session.save();

    // Clear from cache
    this.sessionCache.delete(sessionId);

    // Calculate accuracy
    const accuracy = Math.round((session.score / session.questions.length) * 100);

    return {
      completed: true,
      score: session.score,
      totalQuestions: session.questions.length,
      accuracy,
      isPerfect,
      xp: {
        earned: xpCalculation.finalXp,
        breakdown: xpCalculation.breakdown,
        multipliers: xpCalculation.multipliers
      },
      levelUp: xpResult.leveledUp ? {
        previousLevel: xpResult.previousLevel,
        newLevel: xpResult.newLevel,
        levelsGained: xpResult.levelsGained
      } : null,
      topic: session.topic,
      difficulty: session.difficulty,
      timeTaken: new Date(session.completedAt) - new Date(session.startedAt),
      answers: session.answers.map((a, i) => ({
        question: session.questions[i].question,
        correct: a.correct,
        selected: session.questions[i].options[a.selectedIndex],
        correctAnswer: session.questions[i].options[session.questions[i].correctIndex]
      }))
    };
  }

  /**
   * Use 50/50 lifeline
   * @param {string} sessionId - Session ID
   * @returns {Object} Eliminated options
   */
  async useFiftyFifty(sessionId) {
    const session = await this.getSession(sessionId);
    
    if (!session || session.status !== 'active') {
      throw new Error('Session not found or inactive');
    }

    if (session.lifelines.fiftyFiftyUsed) {
      throw new Error('50/50 lifeline already used!');
    }

    const question = session.questions[session.currentQuestion];
    const wrongOptions = [0, 1, 2, 3].filter(i => i !== question.correctIndex);

    // Randomly eliminate 2 wrong options
    const eliminated = [];
    while (eliminated.length < 2 && wrongOptions.length > 0) {
      const randomIndex = Math.floor(Math.random() * wrongOptions.length);
      eliminated.push(wrongOptions.splice(randomIndex, 1)[0]);
    }

    session.lifelines.fiftyFiftyUsed = true;
    session.lifelines.eliminatedOptions = eliminated;
    session.lastActivityAt = new Date();

    await session.save();
    this.sessionCache.set(sessionId, session);

    return {
      eliminated,
      remainingOptions: [0, 1, 2, 3].filter(i => !eliminated.includes(i)),
      question: this.formatQuestion(question, session.currentQuestion, session)
    };
  }

  /**
   * Use hint lifeline
   * @param {string} sessionId - Session ID
   * @returns {Object} Hint data
   */
  async useHint(sessionId) {
    const session = await this.getSession(sessionId);
    
    if (!session || session.status !== 'active') {
      throw new Error('Session not found or inactive');
    }

    if (session.lifelines.hintUsed) {
      throw new Error('Hint lifeline already used!');
    }

    const question = session.questions[session.currentQuestion];
    session.lifelines.hintUsed = true;
    session.lastActivityAt = new Date();

    await session.save();
    this.sessionCache.set(sessionId, session);

    return {
      hint: question.hint || this.generateFallbackHint(question),
      concept: question.concept || 'General concept'
    };
  }

  /**
   * Abandon current session
   * @param {string} userId - User's Discord ID
   */
  async abandonSession(userId) {
    const session = await QuizSession.findOne({
      discordId: userId,
      status: 'active'
    });

    if (session) {
      session.status = 'abandoned';
      session.completedAt = new Date();
      await session.save();
      this.sessionCache.delete(session.sessionId);
    }
  }

  /**
   * Get session from cache or database
   */
  async getSession(sessionId) {
    // Check cache first
    if (this.sessionCache.has(sessionId)) {
      return this.sessionCache.get(sessionId);
    }

    // Load from database
    const session = await QuizSession.findOne({ sessionId });
    
    if (session && session.status === 'active') {
      this.sessionCache.set(sessionId, session);
    }

    return session;
  }

  /**
   * Generate questions using AI or fallback
   */
  async generateQuestions(options) {
    const { topic = 'General', difficulty = 'medium', count = 5 } = options;

    try {
      // Try AI generation
      return await this.generateAIQuestions(topic, difficulty, count);
    } catch (error) {
      console.log('AI generation failed, using fallback:', error.message);
      return this.getFallbackQuestions(topic, difficulty, count);
    }
  }

  /**
   * Generate questions using AI
   */
  async generateAIQuestions(topic, difficulty, count) {
    // Import AI orchestrator dynamically
    const { generateQuiz } = await import('../../ai/index.js');
    
    const result = await generateQuiz(topic, count, difficulty);
    
    if (!result || !result.questions || result.questions.length === 0) {
      throw new Error('AI returned no questions');
    }

    return result.questions.map((q, i) => ({
      id: `q_${Date.now()}_${i}`,
      question: q.question,
      options: q.options,
      correctIndex: q.correctIndex,
      explanation: q.explanation,
      concept: q.conceptTested || topic,
      hint: q.hint || `Think about ${topic} fundamentals.`,
      difficulty: q.difficulty || difficulty
    }));
  }

  /**
   * Get fallback questions from curated database
   */
  getFallbackQuestions(topic, difficulty, count) {
    // Fallback question bank
    const fallbackBank = {
      'python': [
        {
          question: "What does the 'len()' function do in Python?",
          options: ["Returns the length of an object", "Converts to lowercase", "Rounds a number", "Creates a list"],
          correctIndex: 0,
          explanation: "The len() function returns the number of items in an object.",
          concept: "Built-in functions",
          hint: "Think about counting elements."
        },
        {
          question: "What is the output of print(type([]))?",
          options: ["<class 'list'>", "<class 'tuple'>", "<class 'dict'>", "<class 'set'>"],
          correctIndex: 0,
          explanation: "[] creates an empty list, so type() returns <class 'list'>.",
          concept: "Data types",
          hint: "[] is list syntax in Python."
        },
        {
          question: "Which keyword is used to define a function in Python?",
          options: ["def", "function", "func", "define"],
          correctIndex: 0,
          explanation: "In Python, functions are defined using the 'def' keyword.",
          concept: "Functions",
          hint: "It's a short, 3-letter keyword."
        },
        {
          question: "What does the 'append()' method do for lists?",
          options: ["Adds an element to the end", "Removes the last element", "Sorts the list", "Returns list length"],
          correctIndex: 0,
          explanation: "append() adds an element to the end of a list.",
          concept: "List methods",
          hint: "Think about adding to a list."
        },
        {
          question: "What is the correct way to create a dictionary?",
          options: ['{"key": "value"}', '["key": "value"]', '("key": "value")', '<"key": "value">'],
          correctIndex: 0,
          explanation: "Dictionaries use curly braces {} with key-value pairs separated by colons.",
          concept: "Dictionaries",
          hint: "It uses curly braces."
        }
      ],
      'javascript': [
        {
          question: "What does 'typeof null' return in JavaScript?",
          options: ["object", "null", "undefined", "boolean"],
          correctIndex: 0,
          explanation: "This is a known JavaScript quirk - typeof null returns 'object'.",
          concept: "Type coercion",
          hint: "It's a famous JavaScript bug."
        },
        {
          question: "Which method adds elements to the end of an array?",
          options: ["push()", "pop()", "shift()", "unshift()"],
          correctIndex: 0,
          explanation: "push() adds elements to the end of an array.",
          concept: "Array methods",
          hint: "Think about pushing something onto a stack."
        },
        {
          question: "What is the difference between '==' and '==='?",
          options: ["=== checks type and value, == only checks value", "They are the same", "== checks type and value", "=== is invalid"],
          correctIndex: 0,
          explanation: "=== is strict equality (checks both type and value), while == allows type coercion.",
          concept: "Comparison operators",
          hint: "One is more strict than the other."
        }
      ]
    };

    // Get questions for topic or use general
    const lowerTopic = topic.toLowerCase();
    let questions = fallbackBank[lowerTopic] || fallbackBank['python'];

    // Shuffle and select
    const shuffled = [...questions].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, Math.min(count, shuffled.length));

    return selected.map((q, i) => ({
      id: `fallback_${Date.now()}_${i}`,
      ...q,
      difficulty: difficulty
    }));
  }

  /**
   * Format question for display
   */
  formatQuestion(question, index, session) {
    const eliminated = session.lifelines?.eliminatedOptions || [];
    
    return {
      id: question.id,
      text: question.question,
      options: question.options.map((opt, i) => ({
        index: i,
        text: opt,
        eliminated: eliminated.includes(i),
        label: String.fromCharCode(65 + i) // A, B, C, D
      })),
      questionNumber: index + 1,
      difficulty: question.difficulty
    };
  }

  /**
   * Generate fallback hint
   */
  generateFallbackHint(question) {
    const correctAnswer = question.options[question.correctIndex];
    const firstWord = correctAnswer.split(' ')[0];
    return `The answer starts with "${firstWord}"...`;
  }

  /**
   * Check rate limit
   */
  checkRateLimit(userId) {
    const now = Date.now();
    const userLimit = this.rateLimits.get(userId) || { count: 0, resetAt: now + this.RATE_LIMIT_WINDOW };

    // Reset if window expired
    if (now > userLimit.resetAt) {
      userLimit.count = 0;
      userLimit.resetAt = now + this.RATE_LIMIT_WINDOW;
    }

    return userLimit.count < this.MAX_QUIZZES_PER_MINUTE;
  }

  /**
   * Update rate limit counter
   */
  updateRateLimit(userId) {
    const now = Date.now();
    const userLimit = this.rateLimits.get(userId) || { count: 0, resetAt: now + this.RATE_LIMIT_WINDOW };

    if (now > userLimit.resetAt) {
      userLimit.count = 1;
      userLimit.resetAt = now + this.RATE_LIMIT_WINDOW;
    } else {
      userLimit.count++;
    }

    this.rateLimits.set(userId, userLimit);
  }

  /**
   * Get user's quiz statistics
   */
  async getUserStats(userId) {
    const user = await User.findOne({ discordId: userId });
    if (!user) return null;

    const accuracy = user.totalQuestions > 0
      ? Math.round((user.correctAnswers / user.totalQuestions) * 100)
      : 0;

    return {
      quizzesTaken: user.quizzesTaken || 0,
      correctAnswers: user.correctAnswers || 0,
      totalQuestions: user.totalQuestions || 0,
      accuracy,
      topicsStudied: user.topicsStudied || [],
      topicAccuracy: AccuracySystem.getAllTopicStats(user),
      weakAreas: AccuracySystem.getWeakTopics(user),
      strongAreas: AccuracySystem.getStrongTopics(user)
    };
  }
}

export default QuizEngine;
