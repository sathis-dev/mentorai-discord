/**
 * Arena Manager - Battle Royale Quiz Matches
 * 
 * Features:
 * - Matchmaking queue
 * - Multi-player battles (4-8 players)
 * - Real-time scoring with speed bonuses
 * - Streak bonuses
 * - Podium placement
 */

import { BattleSession } from '../../database/models/BattleSession.js';
import { User } from '../../database/models/User.js';
import { XPService } from '../xpService.js';
import { QuizEngine } from '../quiz/engine.js';

export class ArenaManager {
  constructor() {
    /**
     * Active arenas
     */
    this.arenas = new Map();
    
    /**
     * Matchmaking queue
     */
    this.matchmakingQueue = [];
    
    /**
     * XP Service
     */
    this.xpService = new XPService();
    
    /**
     * Quiz Engine
     */
    this.quizEngine = new QuizEngine();
    
    /**
     * Arena settings
     */
    this.settings = {
      minPlayers: 4,
      maxPlayers: 8,
      questionsCount: 10,
      timePerQuestion: 10000, // 10 seconds
      countdownTime: 10,      // 10 second countdown
      matchmakingInterval: 10000 // Check every 10 seconds
    };
    
    /**
     * Start matchmaking processor
     */
    this.matchmakingInterval = setInterval(
      () => this.processMatchmaking(), 
      this.settings.matchmakingInterval
    );
    
    /**
     * Cleanup interval
     */
    setInterval(() => this.cleanupArenas(), 5 * 60 * 1000);
  }

  /**
   * Join arena matchmaking queue
   * @param {string} userId - Discord ID
   * @param {Object} options - Preferences
   * @returns {Object} Queue position
   */
  async joinQueue(userId, options = {}) {
    const user = await User.findOne({ discordId: userId });
    if (!user) throw new Error('User not found');

    // Check if already in queue
    if (this.isUserInQueue(userId)) {
      throw new Error('Already in matchmaking queue');
    }

    // Check if already in arena
    if (await this.isUserInArena(userId)) {
      throw new Error('Already in an active arena');
    }

    // Add to queue
    this.matchmakingQueue.push({
      discordId: userId,
      username: user.username,
      level: user.level || 1,
      joinedAt: new Date(),
      options
    });

    return {
      position: this.matchmakingQueue.length,
      estimatedWait: Math.max(10, this.matchmakingQueue.length * 5),
      playersNeeded: Math.max(0, this.settings.minPlayers - this.matchmakingQueue.length)
    };
  }

  /**
   * Leave matchmaking queue
   * @param {string} userId - Discord ID
   */
  leaveQueue(userId) {
    const index = this.matchmakingQueue.findIndex(p => p.discordId === userId);
    if (index !== -1) {
      this.matchmakingQueue.splice(index, 1);
      return true;
    }
    return false;
  }

  /**
   * Get queue status
   * @param {string} userId - Discord ID
   * @returns {Object} Queue status
   */
  getQueueStatus(userId) {
    const position = this.matchmakingQueue.findIndex(p => p.discordId === userId);
    
    if (position === -1) {
      return { inQueue: false };
    }

    return {
      inQueue: true,
      position: position + 1,
      totalInQueue: this.matchmakingQueue.length,
      playersNeeded: Math.max(0, this.settings.minPlayers - this.matchmakingQueue.length)
    };
  }

  /**
   * Process matchmaking queue
   */
  async processMatchmaking() {
    if (this.matchmakingQueue.length < this.settings.minPlayers) {
      return; // Not enough players
    }

    // Group players by similar level for fair matching
    const groups = this.createMatchmakingGroups();

    for (const group of groups) {
      if (group.length >= this.settings.minPlayers) {
        try {
          await this.createArena(group);
        } catch (error) {
          console.error('Failed to create arena:', error);
        }
      }
    }
  }

  /**
   * Create matchmaking groups
   */
  createMatchmakingGroups() {
    const groups = [];
    const queue = [...this.matchmakingQueue];

    // Sort by level for fair matching
    queue.sort((a, b) => a.level - b.level);

    // Create groups of maxPlayers or minPlayers
    while (queue.length >= this.settings.minPlayers) {
      const groupSize = Math.min(this.settings.maxPlayers, queue.length);
      const group = queue.splice(0, groupSize);
      groups.push(group);
    }

    // Update queue (remaining players stay)
    this.matchmakingQueue = queue;

    return groups;
  }

  /**
   * Create an arena
   * @param {Array} players - Player data
   * @returns {string} Arena ID
   */
  async createArena(players) {
    const arenaId = `arena_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;

    // Calculate average level for difficulty
    const avgLevel = players.reduce((sum, p) => sum + p.level, 0) / players.length;
    const difficulty = this.calculateArenaDifficulty(avgLevel);

    // Generate questions
    const questions = await this.quizEngine.generateQuestions({
      topic: 'random',
      difficulty,
      count: this.settings.questionsCount
    });

    // Create arena object
    const arena = {
      arenaId,
      players: players.map(p => ({
        discordId: p.discordId,
        username: p.username,
        score: 0,
        answers: [],
        streak: 0,
        connected: true,
        ready: false
      })),
      questions: questions.map(q => ({
        id: q.id,
        question: q.question,
        options: q.options,
        correctIndex: q.correctIndex
      })),
      currentQuestion: 0,
      questionStartTime: null,
      timePerQuestion: this.settings.timePerQuestion,
      status: 'waiting',
      countdown: this.settings.countdownTime,
      difficulty,
      startedAt: null,
      leaderboard: [],
      messages: []
    };

    // Store arena
    this.arenas.set(arenaId, arena);

    // Remove players from queue
    for (const player of players) {
      this.leaveQueue(player.discordId);
    }

    // Start countdown
    this.startArenaCountdown(arenaId);

    return arenaId;
  }

  /**
   * Start arena countdown
   */
  startArenaCountdown(arenaId) {
    const arena = this.arenas.get(arenaId);
    if (!arena) return;

    arena.status = 'countdown';

    const countdownInterval = setInterval(() => {
      arena.countdown--;

      // Broadcast countdown
      this.broadcastToArena(arenaId, {
        type: 'countdown',
        countdown: arena.countdown,
        players: arena.players.map(p => p.username)
      });

      if (arena.countdown <= 0) {
        clearInterval(countdownInterval);
        this.startArena(arenaId);
      }
    }, 1000);

    // Store interval for cleanup
    arena.countdownInterval = countdownInterval;
  }

  /**
   * Start arena gameplay
   */
  async startArena(arenaId) {
    const arena = this.arenas.get(arenaId);
    if (!arena) return;

    arena.status = 'active';
    arena.startedAt = new Date();
    arena.questionStartTime = new Date();

    // Broadcast start
    this.broadcastToArena(arenaId, {
      type: 'arena_start',
      question: this.formatArenaQuestion(arena, 0),
      players: arena.players.length
    });

    // Start question timer
    arena.questionTimer = setTimeout(() => {
      this.nextArenaQuestion(arenaId);
    }, arena.timePerQuestion + 3000); // +3s for results display
  }

  /**
   * Submit answer in arena
   * @param {string} arenaId - Arena ID
   * @param {string} playerId - Player's Discord ID
   * @param {number} answerIndex - Selected answer
   * @returns {Object} Answer result
   */
  async submitArenaAnswer(arenaId, playerId, answerIndex) {
    const arena = this.arenas.get(arenaId);
    
    if (!arena || arena.status !== 'active') {
      throw new Error('Arena not active');
    }

    const player = arena.players.find(p => p.discordId === playerId);
    if (!player) throw new Error('Player not in arena');

    // Check if already answered this question
    if (player.answers.some(a => a.questionIndex === arena.currentQuestion)) {
      throw new Error('Already answered this question');
    }

    const question = arena.questions[arena.currentQuestion];
    const timeTaken = Date.now() - new Date(arena.questionStartTime).getTime();
    const isCorrect = answerIndex === question.correctIndex;

    // Calculate points
    let points = 0;
    if (isCorrect) {
      // Base: 100 points
      points = 100;

      // Speed bonus: faster = more points (max 50)
      const speedBonus = Math.max(0, Math.floor((arena.timePerQuestion - timeTaken) / 200));
      points += Math.min(speedBonus, 50);

      // Streak bonus: +10 per consecutive correct
      points += player.streak * 10;

      player.streak++;
    } else {
      player.streak = 0;
    }

    // Record answer
    player.answers.push({
      questionIndex: arena.currentQuestion,
      selectedIndex: answerIndex,
      correct: isCorrect,
      timeTaken,
      points
    });

    player.score += points;

    // Update leaderboard
    this.updateArenaLeaderboard(arena);

    // Check if all players answered
    const allAnswered = arena.players.every(p => 
      p.answers.length > arena.currentQuestion
    );

    if (allAnswered) {
      clearTimeout(arena.questionTimer);
      setTimeout(() => this.nextArenaQuestion(arenaId), 3000); // 3s results
    }

    return {
      correct: isCorrect,
      points,
      totalScore: player.score,
      streak: player.streak,
      position: this.getPlayerPosition(arena, playerId),
      leaderboard: arena.leaderboard.slice(0, 5)
    };
  }

  /**
   * Move to next question
   */
  async nextArenaQuestion(arenaId) {
    const arena = this.arenas.get(arenaId);
    if (!arena) return;

    // Show results
    this.broadcastQuestionResults(arenaId);

    // Wait 3 seconds
    await new Promise(resolve => setTimeout(resolve, 3000));

    arena.currentQuestion++;

    // Check if arena is complete
    if (arena.currentQuestion >= arena.questions.length) {
      return this.completeArena(arenaId);
    }

    arena.questionStartTime = new Date();
    arena.status = 'active';

    // Broadcast next question
    this.broadcastToArena(arenaId, {
      type: 'next_question',
      question: this.formatArenaQuestion(arena, arena.currentQuestion),
      leaderboard: arena.leaderboard.slice(0, 5)
    });

    // Start timer
    arena.questionTimer = setTimeout(() => {
      this.nextArenaQuestion(arenaId);
    }, arena.timePerQuestion + 3000);
  }

  /**
   * Complete arena and award XP
   */
  async completeArena(arenaId) {
    const arena = this.arenas.get(arenaId);
    if (!arena) return;

    arena.status = 'completed';

    // Final leaderboard
    this.updateArenaLeaderboard(arena);
    const podium = arena.leaderboard.slice(0, 3);

    // Award XP
    const xpAwards = [];

    for (let i = 0; i < arena.players.length; i++) {
      const player = arena.leaderboard[i];
      const user = await User.findOne({ discordId: player.discordId });
      
      if (!user) continue;

      // Calculate XP based on position
      const xpCalc = this.xpService.calculateXp(user, 'arena', {
        position: i + 1,
        correct: arena.players.find(p => p.discordId === player.discordId)
          .answers.filter(a => a.correct).length,
        total: arena.questions.length
      });

      // Award XP
      await this.xpService.awardXp(user, xpCalc.finalXp, 'arena');

      // Update arena stats
      if (!user.arenaStats) {
        user.arenaStats = { played: 0, wins: 0, podiums: 0, highestScore: 0 };
      }
      
      user.arenaStats.played++;
      if (i === 0) user.arenaStats.wins++;
      if (i < 3) user.arenaStats.podiums++;
      if (player.score > user.arenaStats.highestScore) {
        user.arenaStats.highestScore = player.score;
      }

      await user.save();

      xpAwards.push({
        discordId: player.discordId,
        username: player.username,
        position: i + 1,
        xp: xpCalc.finalXp
      });
    }

    // Broadcast completion
    this.broadcastToArena(arenaId, {
      type: 'arena_complete',
      podium: podium.map((p, i) => ({
        position: i + 1,
        username: p.username,
        score: p.score
      })),
      leaderboard: arena.leaderboard,
      xpAwards
    });

    // Cleanup after 30 seconds
    setTimeout(() => {
      this.arenas.delete(arenaId);
    }, 30000);

    return {
      completed: true,
      podium,
      leaderboard: arena.leaderboard,
      xpAwards
    };
  }

  /**
   * Update arena leaderboard
   */
  updateArenaLeaderboard(arena) {
    arena.leaderboard = arena.players
      .map(p => ({
        discordId: p.discordId,
        username: p.username,
        score: p.score,
        streak: p.streak,
        answeredCurrent: p.answers.length > arena.currentQuestion
      }))
      .sort((a, b) => b.score - a.score);
  }

  /**
   * Get player position in leaderboard
   */
  getPlayerPosition(arena, playerId) {
    return arena.leaderboard.findIndex(p => p.discordId === playerId) + 1;
  }

  /**
   * Format question for arena display
   */
  formatArenaQuestion(arena, questionIndex) {
    const question = arena.questions[questionIndex];
    
    return {
      id: question.id,
      text: question.question,
      options: question.options.map((opt, i) => ({
        index: i,
        text: opt,
        label: String.fromCharCode(65 + i)
      })),
      questionNumber: questionIndex + 1,
      totalQuestions: arena.questions.length,
      timeLimit: arena.timePerQuestion
    };
  }

  /**
   * Broadcast to arena players
   */
  broadcastToArena(arenaId, message) {
    const arena = this.arenas.get(arenaId);
    if (!arena) return;

    if (!arena.messages) arena.messages = [];
    arena.messages.push({ 
      timestamp: new Date(), 
      message 
    });

    // In a real implementation, this would send to Discord
    // For now, we just store for retrieval
  }

  /**
   * Broadcast question results
   */
  broadcastQuestionResults(arenaId) {
    const arena = this.arenas.get(arenaId);
    if (!arena) return;

    const question = arena.questions[arena.currentQuestion];

    this.broadcastToArena(arenaId, {
      type: 'question_results',
      correctAnswer: question.correctIndex,
      correctText: question.options[question.correctIndex],
      leaderboard: arena.leaderboard.slice(0, 5)
    });
  }

  /**
   * Calculate difficulty based on average level
   */
  calculateArenaDifficulty(avgLevel) {
    if (avgLevel >= 30) return 'hard';
    if (avgLevel >= 15) return 'medium';
    return 'easy';
  }

  /**
   * Check if user is in queue
   */
  isUserInQueue(userId) {
    return this.matchmakingQueue.some(p => p.discordId === userId);
  }

  /**
   * Check if user is in active arena
   */
  async isUserInArena(userId) {
    for (const arena of this.arenas.values()) {
      if (arena.players.some(p => p.discordId === userId) &&
          ['waiting', 'countdown', 'active'].includes(arena.status)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Get user's active arena
   */
  getUserArena(userId) {
    for (const [arenaId, arena] of this.arenas.entries()) {
      if (arena.players.some(p => p.discordId === userId) &&
          ['waiting', 'countdown', 'active'].includes(arena.status)) {
        return { arenaId, arena };
      }
    }
    return null;
  }

  /**
   * Cleanup old arenas
   */
  cleanupArenas() {
    const now = new Date();

    for (const [arenaId, arena] of this.arenas.entries()) {
      // Remove completed arenas older than 5 minutes
      if (arena.status === 'completed' && 
          arena.startedAt && 
          now - new Date(arena.startedAt) > 5 * 60 * 1000) {
        this.arenas.delete(arenaId);
      }

      // Remove stuck arenas (waiting > 10 minutes)
      if (arena.status === 'waiting' && 
          now - new Date(arena.startedAt || now) > 10 * 60 * 1000) {
        this.arenas.delete(arenaId);
      }
    }
  }

  /**
   * Get arena statistics
   */
  getStats() {
    return {
      activeArenas: [...this.arenas.values()].filter(
        a => ['waiting', 'countdown', 'active'].includes(a.status)
      ).length,
      playersInQueue: this.matchmakingQueue.length,
      totalPlayers: [...this.arenas.values()].reduce(
        (sum, a) => sum + a.players.length, 0
      )
    };
  }
}

export default ArenaManager;
