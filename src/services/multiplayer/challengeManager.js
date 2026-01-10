/**
 * Challenge Manager - Complete 1v1 Quiz Battle System
 * 
 * Handles:
 * - Challenge creation, acceptance, and decline
 * - Real-time battle flow with countdown
 * - Simultaneous question delivery
 * - Speed-based scoring
 * - XP rewards and stats tracking
 */

import { EventEmitter } from 'events';
import { User } from '../../database/models/User.js';
import { BattleSession } from '../../database/models/BattleSession.js';

class ChallengeManager extends EventEmitter {
  constructor() {
    super();
    
    // Storage for active challenges
    this.activeChallenges = new Map();        // challengeId → challenge
    this.pendingChallenges = new Map();       // odiscordId → pendingChallengeId
    this.activeBattles = new Map();           // battleId → battle
    this.playerStates = new Map();            // odiscordId → { battleId, ... }
    
    // Discord client reference (set later)
    this.client = null;
    
    // Cleanup intervals
    setInterval(() => this.cleanupExpiredChallenges(), 60000); // Every minute
    setInterval(() => this.cleanupStaleBattles(), 30000);      // Every 30 seconds
    
    console.log('🎮 Challenge Manager initialized');
  }
  
  /**
   * Set the Discord client reference
   * @param {Client} client - Discord.js client
   */
  setClient(client) {
    this.client = client;
  }
  
  // ===== PUBLIC METHODS =====
  
  /**
   * Create a new challenge
   * @param {string} challengerId - Discord ID of challenger
   * @param {string} opponentId - Discord ID of opponent
   * @param {Object} options - Challenge options
   * @returns {Object} Challenge object
   */
  async createChallenge(challengerId, opponentId, options = {}) {
    // Validate users exist
    const [challenger, opponent] = await Promise.all([
      this.getUser(challengerId),
      this.getUser(opponentId)
    ]);
    
    if (!challenger || !opponent) {
      throw new Error('One or both users not found');
    }
    
    // Check if opponent already has a pending challenge
    if (this.pendingChallenges.has(opponentId)) {
      const existingId = this.pendingChallenges.get(opponentId);
      const existing = this.activeChallenges.get(existingId);
      throw new Error(`${opponent.username || 'User'} already has a pending challenge`);
    }
    
    // Check if either user is in an active battle
    if (this.playerStates.has(challengerId) || this.playerStates.has(opponentId)) {
      throw new Error('One or both players are already in a battle');
    }
    
    // Create challenge
    const challengeId = `challenge_${Date.now()}_${challengerId}`;
    const challenge = {
      challengeId,
      challenger: {
        discordId: challengerId,
        username: challenger.username,
        avatar: challenger.avatar
      },
      opponent: {
        discordId: opponentId,
        username: opponent.username,
        avatar: opponent.avatar
      },
      options: {
        topic: options.topic || 'random',
        difficulty: options.difficulty || 'medium',
        questions: Math.min(Math.max(options.questions || 5, 3), 10), // 3-10 questions
        timePerQuestion: 15000, // 15 seconds
        category: options.category || 'programming'
      },
      status: 'pending',
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes to accept
      messageId: null, // Discord message ID for updating
      channelId: null  // Discord channel ID
    };
    
    // Store challenge
    this.activeChallenges.set(challengeId, challenge);
    this.pendingChallenges.set(opponentId, challengeId);
    
    // Emit event for Discord to send message
    this.emit('challenge_created', challenge);
    
    return challenge;
  }
  
  /**
   * Accept a challenge
   * @param {string} challengeId - Challenge ID
   * @param {string} accepterId - User accepting the challenge
   * @returns {Object} Battle object
   */
  async acceptChallenge(challengeId, accepterId) {
    const challenge = this.activeChallenges.get(challengeId);
    
    if (!challenge) {
      throw new Error('Challenge not found or expired');
    }
    
    // Verify accepter is the opponent
    if (challenge.opponent.discordId !== accepterId) {
      throw new Error('Only the challenged player can accept');
    }
    
    // Check if expired
    if (challenge.expiresAt < new Date()) {
      this.removeChallenge(challengeId);
      throw new Error('Challenge has expired');
    }
    
    // Check if both players are still available
    if (this.playerStates.has(challenge.challenger.discordId) || 
        this.playerStates.has(challenge.opponent.discordId)) {
      throw new Error('One or both players are now unavailable');
    }
    
    // Generate questions for the battle
    const questions = await this.generateQuestions(challenge.options);
    
    // Create battle
    const battleId = `battle_${Date.now()}`;
    const battle = {
      battleId,
      challengeId,
      type: 'challenge',
      players: [
        {
          discordId: challenge.challenger.discordId,
          username: challenge.challenger.username,
          avatar: challenge.challenger.avatar,
          score: 0,
          answers: [],
          streak: 0,
          connected: true,
          ready: false
        },
        {
          discordId: challenge.opponent.discordId,
          username: challenge.opponent.username,
          avatar: challenge.opponent.avatar,
          score: 0,
          answers: [],
          streak: 0,
          connected: true,
          ready: false
        }
      ],
      questions,
      currentQuestion: 0,
      questionStartTime: null,
      timePerQuestion: challenge.options.timePerQuestion,
      status: 'waiting_for_players', // waiting → starting → active → completed
      startedAt: null,
      countdown: 5, // 5 second countdown before start
      results: null,
      settings: challenge.options,
      channelId: challenge.channelId,
      messageId: challenge.messageId
    };
    
    // Store battle
    this.activeBattles.set(battleId, battle);
    
    // Update player states
    this.playerStates.set(challenge.challenger.discordId, { battleId, role: 'player' });
    this.playerStates.set(challenge.opponent.discordId, { battleId, role: 'player' });
    
    // Save to database
    try {
      await BattleSession.create({
        battleId,
        type: 'challenge',
        status: 'active',
        players: battle.players.map(p => ({
          odiscordId: p.discordId,
          username: p.username,
          score: 0,
          answers: [],
          isReady: false
        })),
        questions: questions.map(q => ({
          question: q.question,
          options: q.options,
          correctIndex: q.correctIndex,
          explanation: q.explanation,
          topic: q.topic || challenge.options.topic
        })),
        settings: {
          topic: challenge.options.topic,
          difficulty: challenge.options.difficulty,
          questionCount: challenge.options.questions,
          timePerQuestion: challenge.options.timePerQuestion
        }
      });
    } catch (error) {
      console.error('Failed to save battle to database:', error);
    }
    
    // Remove from pending
    this.activeChallenges.delete(challengeId);
    this.pendingChallenges.delete(challenge.opponent.discordId);
    
    // Emit events
    this.emit('challenge_accepted', { challenge, battle });
    this.emit('battle_created', battle);
    
    // Start countdown
    this.startBattleCountdown(battleId);
    
    return battle;
  }
  
  /**
   * Decline a challenge
   * @param {string} challengeId - Challenge ID
   * @param {string} declinerId - User declining
   */
  async declineChallenge(challengeId, declinerId) {
    const challenge = this.activeChallenges.get(challengeId);
    
    if (!challenge) {
      throw new Error('Challenge not found');
    }
    
    // Verify decliner is the opponent
    if (challenge.opponent.discordId !== declinerId) {
      throw new Error('Only the challenged player can decline');
    }
    
    // Update challenge status
    challenge.status = 'declined';
    challenge.declinedAt = new Date();
    
    // Emit event
    this.emit('challenge_declined', challenge);
    
    // Clean up
    this.removeChallenge(challengeId);
    
    return challenge;
  }
  
  /**
   * Player is ready for battle
   * @param {string} battleId - Battle ID
   * @param {string} playerId - Player ID
   */
  async playerReady(battleId, playerId) {
    const battle = this.activeBattles.get(battleId);
    
    if (!battle) {
      throw new Error('Battle not found');
    }
    
    const player = battle.players.find(p => p.discordId === playerId);
    if (!player) {
      throw new Error('Player not in this battle');
    }
    
    player.ready = true;
    
    // Check if both players are ready
    const allReady = battle.players.every(p => p.ready);
    
    if (allReady && battle.status === 'waiting_for_players') {
      battle.status = 'starting';
      this.emit('battle_all_ready', battle);
    }
    
    return { ready: true, allReady };
  }
  
  /**
   * Submit answer in battle
   * @param {string} battleId - Battle ID
   * @param {string} playerId - Player ID
   * @param {number} answerIndex - 0-3
   */
  async submitAnswer(battleId, playerId, answerIndex) {
    const battle = this.activeBattles.get(battleId);
    
    if (!battle) {
      throw new Error('Battle not found');
    }
    
    if (battle.status !== 'active') {
      throw new Error('Battle is not active');
    }
    
    const player = battle.players.find(p => p.discordId === playerId);
    if (!player) {
      throw new Error('Player not in this battle');
    }
    
    // Check if player already answered this question
    const existingAnswer = player.answers.find(a => 
      a.questionIndex === battle.currentQuestion
    );
    
    if (existingAnswer) {
      throw new Error('Already answered this question');
    }
    
    const question = battle.questions[battle.currentQuestion];
    const timeTaken = Date.now() - battle.questionStartTime;
    
    // Calculate score
    const isCorrect = answerIndex === question.correctIndex;
    const speedBonus = this.calculateSpeedBonus(timeTaken, battle.timePerQuestion);
    
    let points = 0;
    if (isCorrect) {
      // Base points + speed bonus + streak bonus
      points = 100 + speedBonus + (player.streak * 10);
      player.streak++;
    } else {
      player.streak = 0;
      points = 0;
    }
    
    player.score += points;
    
    // Record answer
    const answer = {
      questionIndex: battle.currentQuestion,
      selectedIndex: answerIndex,
      correct: isCorrect,
      timeTaken,
      points,
      submittedAt: new Date()
    };
    
    player.answers.push(answer);
    
    // Check if both players answered
    const allAnswered = battle.players.every(p => 
      p.answers.some(a => a.questionIndex === battle.currentQuestion)
    );
    
    // Emit answer submitted event
    this.emit('answer_submitted', {
      battleId,
      player: {
        discordId: playerId,
        username: player.username
      },
      answer,
      questionNumber: battle.currentQuestion + 1,
      allAnswered
    });
    
    if (allAnswered) {
      // Move to next question
      await this.nextQuestion(battleId);
    }
    
    return {
      correct: isCorrect,
      points,
      totalScore: player.score,
      speedBonus,
      currentPosition: this.getPlayerPosition(battle, playerId)
    };
  }
  
  /**
   * Get battle status
   * @param {string} battleId - Battle ID
   */
  getBattleStatus(battleId) {
    const battle = this.activeBattles.get(battleId);
    if (!battle) return null;
    
    const leaderboard = battle.players
      .sort((a, b) => b.score - a.score)
      .map((p, index) => ({
        position: index + 1,
        username: p.username,
        score: p.score,
        streak: p.streak,
        answers: p.answers.length
      }));
    
    return {
      battleId,
      status: battle.status,
      currentQuestion: battle.currentQuestion,
      totalQuestions: battle.questions.length,
      timeRemaining: battle.questionStartTime ? 
        Math.max(0, battle.timePerQuestion - (Date.now() - battle.questionStartTime)) : 
        null,
      leaderboard,
      players: battle.players.map(p => ({
        username: p.username,
        ready: p.ready,
        connected: p.connected
      }))
    };
  }
  
  /**
   * Get player's active battle
   * @param {string} playerId - Player Discord ID
   */
  getPlayerBattle(playerId) {
    const state = this.playerStates.get(playerId);
    if (!state) return null;
    return this.activeBattles.get(state.battleId);
  }
  
  /**
   * Get challenge by ID
   * @param {string} challengeId - Challenge ID
   */
  getChallenge(challengeId) {
    return this.activeChallenges.get(challengeId);
  }
  
  // ===== BATTLE FLOW CONTROL =====
  
  /**
   * Start battle countdown
   * @param {string} battleId - Battle ID
   */
  startBattleCountdown(battleId) {
    const battle = this.activeBattles.get(battleId);
    
    if (!battle || battle.status !== 'waiting_for_players') return;
    
    battle.status = 'countdown';
    
    // Emit countdown start
    this.emit('battle_countdown_start', battle);
    
    const countdownInterval = setInterval(() => {
      battle.countdown--;
      
      // Emit countdown update
      this.emit('battle_countdown', {
        battleId,
        countdown: battle.countdown,
        battle
      });
      
      if (battle.countdown <= 0) {
        clearInterval(countdownInterval);
        this.startBattle(battleId);
      }
    }, 1000);
    
    battle.countdownInterval = countdownInterval;
  }
  
  /**
   * Start the battle
   * @param {string} battleId - Battle ID
   */
  async startBattle(battleId) {
    const battle = this.activeBattles.get(battleId);
    
    if (!battle) return;
    
    battle.status = 'active';
    battle.startedAt = new Date();
    
    // Clear any existing interval
    if (battle.countdownInterval) {
      clearInterval(battle.countdownInterval);
    }
    
    // Emit battle started
    this.emit('battle_started', battle);
    
    // Start first question
    await this.startQuestion(battleId, 0);
  }
  
  /**
   * Start a question
   * @param {string} battleId - Battle ID
   * @param {number} questionIndex - Question index
   */
  async startQuestion(battleId, questionIndex) {
    const battle = this.activeBattles.get(battleId);
    
    if (!battle) return;
    
    battle.currentQuestion = questionIndex;
    battle.questionStartTime = Date.now();
    
    const question = battle.questions[questionIndex];
    
    // Emit question to players (hide correct answer)
    this.emit('question_started', {
      battleId,
      question: {
        question: question.question,
        options: question.options,
        topic: question.topic,
        difficulty: question.difficulty
      },
      questionNumber: questionIndex + 1,
      totalQuestions: battle.questions.length,
      timeLimit: battle.timePerQuestion
    });
    
    // Set timeout for question
    battle.questionTimeout = setTimeout(() => {
      this.questionTimeout(battleId);
    }, battle.timePerQuestion);
  }
  
  /**
   * Question timeout - move to next question
   * @param {string} battleId - Battle ID
   */
  async questionTimeout(battleId) {
    const battle = this.activeBattles.get(battleId);
    
    if (!battle || battle.status !== 'active') return;
    
    // Mark unanswered players as wrong
    for (const player of battle.players) {
      const answered = player.answers.some(a => 
        a.questionIndex === battle.currentQuestion
      );
      
      if (!answered) {
        player.answers.push({
          questionIndex: battle.currentQuestion,
          selectedIndex: -1,
          correct: false,
          timeTaken: battle.timePerQuestion,
          points: 0,
          submittedAt: new Date()
        });
        player.streak = 0;
      }
    }
    
    // Move to next question
    await this.nextQuestion(battleId);
  }
  
  /**
   * Move to next question or end battle
   * @param {string} battleId - Battle ID
   */
  async nextQuestion(battleId) {
    const battle = this.activeBattles.get(battleId);
    
    if (!battle) return;
    
    // Clear timeout
    if (battle.questionTimeout) {
      clearTimeout(battle.questionTimeout);
      battle.questionTimeout = null;
    }
    
    // Show results for current question
    const question = battle.questions[battle.currentQuestion];
    const results = this.calculateQuestionResults(battle);
    
    // Emit question results
    this.emit('question_results', {
      battleId,
      question,
      results,
      leaderboard: this.getLeaderboard(battle)
    });
    
    // Wait 3 seconds before next question
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Check if battle is complete
    if (battle.currentQuestion >= battle.questions.length - 1) {
      await this.completeBattle(battleId);
    } else {
      // Start next question
      await this.startQuestion(battleId, battle.currentQuestion + 1);
    }
  }
  
  /**
   * Complete battle and declare winner
   * @param {string} battleId - Battle ID
   */
  async completeBattle(battleId) {
    const battle = this.activeBattles.get(battleId);
    
    if (!battle) return;
    
    battle.status = 'completed';
    battle.completedAt = new Date();
    
    // Calculate final results
    const results = this.calculateFinalResults(battle);
    battle.results = results;
    
    // Award XP to players
    await this.awardBattleXP(battle, results);
    
    // Update database
    try {
      await BattleSession.findOneAndUpdate(
        { battleId },
        {
          status: 'completed',
          completedAt: battle.completedAt,
          winner: results.winner,
          'players.$[].score': battle.players.map(p => p.score)
        }
      );
    } catch (error) {
      console.error('Failed to update battle in database:', error);
    }
    
    // Emit battle complete
    this.emit('battle_complete', {
      battleId,
      results,
      battle
    });
    
    // Clean up after 30 seconds
    setTimeout(() => {
      this.cleanupBattle(battleId);
    }, 30000);
    
    return results;
  }
  
  // ===== HELPER METHODS =====
  
  /**
   * Generate questions for battle
   * @param {Object} options - Question options
   * @returns {Array} Questions
   */
  async generateQuestions(options) {
    // Try AI generation first
    try {
      const { default: aiOrchestrator } = await import('../../ai/orchestrator.js');
      
      // Use the correct method from aiOrchestrator
      const result = await aiOrchestrator.generateQuiz(options.topic, options.questions, options.difficulty);
      
      if (result.success && Array.isArray(result.data) && result.data.length > 0) {
        return result.data.map(q => ({
          question: q.question,
          options: q.options?.map(opt => opt.replace(/^[A-D]\)\s*/, '')) || [],
          correctIndex: q.correct ?? q.correctIndex ?? 0,
          explanation: q.explanation || '',
          topic: q.topic || options.topic
        }));
      }
    } catch (error) {
      console.error('AI question generation failed:', error);
    }
    
    // Fallback to curated questions
    return this.getFallbackQuestions(options);
  }
  
  /**
   * Get fallback questions from database
   * @param {Object} options - Question options
   * @returns {Array} Questions
   */
  getFallbackQuestions(options) {
    // Sample fallback questions
    const fallbackQuestions = [
      {
        question: 'What does the "def" keyword do in Python?',
        options: ['Defines a variable', 'Defines a function', 'Defines a class', 'Defines a module'],
        correctIndex: 1,
        explanation: 'The "def" keyword is used to define (create) a function in Python.',
        topic: 'python'
      },
      {
        question: 'What is the time complexity of accessing an element in an array by index?',
        options: ['O(n)', 'O(log n)', 'O(1)', 'O(n²)'],
        correctIndex: 2,
        explanation: 'Array access by index is O(1) because arrays store elements in contiguous memory.',
        topic: 'algorithms'
      },
      {
        question: 'What does === mean in JavaScript?',
        options: ['Assignment', 'Loose equality', 'Strict equality', 'Not equal'],
        correctIndex: 2,
        explanation: 'Triple equals (===) checks both value and type equality in JavaScript.',
        topic: 'javascript'
      },
      {
        question: 'Which data structure uses LIFO (Last In First Out)?',
        options: ['Queue', 'Stack', 'Array', 'Linked List'],
        correctIndex: 1,
        explanation: 'A Stack follows LIFO - the last element added is the first to be removed.',
        topic: 'data_structures'
      },
      {
        question: 'What is the purpose of the "this" keyword in JavaScript?',
        options: ['Creates a new variable', 'Refers to the current object', 'Imports a module', 'Declares a constant'],
        correctIndex: 1,
        explanation: 'The "this" keyword refers to the object that is executing the current function.',
        topic: 'javascript'
      },
      {
        question: 'What does CSS stand for?',
        options: ['Creative Style Sheets', 'Cascading Style Sheets', 'Computer Style Sheets', 'Colorful Style Sheets'],
        correctIndex: 1,
        explanation: 'CSS stands for Cascading Style Sheets, used for styling web pages.',
        topic: 'web'
      },
      {
        question: 'What is a closure in JavaScript?',
        options: ['A way to close the browser', 'A function with access to its outer scope', 'A method to end a loop', 'A type of error'],
        correctIndex: 1,
        explanation: 'A closure is a function that has access to variables from its outer (enclosing) scope.',
        topic: 'javascript'
      },
      {
        question: 'What is the main purpose of a constructor in OOP?',
        options: ['Destroy objects', 'Initialize objects', 'Copy objects', 'Compare objects'],
        correctIndex: 1,
        explanation: 'A constructor is a special method used to initialize new objects with default values.',
        topic: 'oop'
      },
      {
        question: 'What is Big O notation used for?',
        options: ['Measuring file size', 'Describing algorithm efficiency', 'Counting lines of code', 'Checking syntax errors'],
        correctIndex: 1,
        explanation: 'Big O notation describes the worst-case time or space complexity of an algorithm.',
        topic: 'algorithms'
      },
      {
        question: 'What is the difference between let and var in JavaScript?',
        options: ['No difference', 'let is block-scoped, var is function-scoped', 'var is newer', 'let cannot be reassigned'],
        correctIndex: 1,
        explanation: 'let is block-scoped (limited to the block) while var is function-scoped.',
        topic: 'javascript'
      }
    ];
    
    // Filter by topic if specified
    let filtered = fallbackQuestions;
    if (options.topic && options.topic !== 'random') {
      filtered = fallbackQuestions.filter(q => 
        q.topic.toLowerCase().includes(options.topic.toLowerCase())
      );
    }
    
    // If not enough questions, use all
    if (filtered.length < options.questions) {
      filtered = fallbackQuestions;
    }
    
    // Random selection
    const selected = [];
    const available = [...filtered];
    
    while (selected.length < options.questions && available.length > 0) {
      const randomIndex = Math.floor(Math.random() * available.length);
      selected.push(available[randomIndex]);
      available.splice(randomIndex, 1);
    }
    
    return selected;
  }
  
  /**
   * Calculate speed bonus
   * @param {number} timeTaken - Time taken in ms
   * @param {number} timeLimit - Time limit in ms
   * @returns {number} Speed bonus
   */
  calculateSpeedBonus(timeTaken, timeLimit) {
    // Faster answers get higher bonus
    const percentage = 1 - (timeTaken / timeLimit);
    return Math.floor(Math.max(0, percentage * 50)); // Max 50 bonus points
  }
  
  /**
   * Calculate question results
   * @param {Object} battle - Battle object
   * @returns {Object} Results
   */
  calculateQuestionResults(battle) {
    const question = battle.questions[battle.currentQuestion];
    const results = {
      correctAnswer: question.correctIndex,
      correctOption: question.options[question.correctIndex],
      explanation: question.explanation,
      playerResults: []
    };
    
    for (const player of battle.players) {
      const answer = player.answers.find(a => 
        a.questionIndex === battle.currentQuestion
      );
      
      results.playerResults.push({
        discordId: player.discordId,
        username: player.username,
        correct: answer ? answer.correct : false,
        timeTaken: answer ? answer.timeTaken : null,
        points: answer ? answer.points : 0,
        selectedIndex: answer ? answer.selectedIndex : -1
      });
    }
    
    // Sort by speed (fastest first)
    results.playerResults.sort((a, b) => {
      if (a.correct && b.correct) {
        return a.timeTaken - b.timeTaken;
      }
      return a.correct ? -1 : 1;
    });
    
    return results;
  }
  
  /**
   * Calculate final results
   * @param {Object} battle - Battle object
   * @returns {Object} Final results
   */
  calculateFinalResults(battle) {
    const results = {
      winner: null,
      isDraw: false,
      players: [],
      accuracy: {}
    };
    
    // Calculate accuracy per player
    for (const player of battle.players) {
      const correct = player.answers.filter(a => a.correct).length;
      const total = battle.questions.length;
      const accuracy = total > 0 ? (correct / total) * 100 : 0;
      
      results.players.push({
        username: player.username,
        discordId: player.discordId,
        score: player.score,
        correct,
        total,
        accuracy: Math.round(accuracy * 10) / 10,
        averageTime: this.calculateAverageTime(player.answers),
        streak: player.streak
      });
      
      results.accuracy[player.discordId] = accuracy;
    }
    
    // Determine winner (highest score, tie goes to accuracy, then speed)
    results.players.sort((a, b) => {
      if (a.score !== b.score) return b.score - a.score;
      if (a.accuracy !== b.accuracy) return b.accuracy - a.accuracy;
      return a.averageTime - b.averageTime; // Lower time is better
    });
    
    // Check for draw
    if (results.players.length >= 2 && 
        results.players[0].score === results.players[1].score &&
        results.players[0].accuracy === results.players[1].accuracy) {
      results.isDraw = true;
    }
    
    results.winner = results.players[0].discordId;
    
    return results;
  }
  
  /**
   * Award XP to players
   * @param {Object} battle - Battle object
   * @param {Object} results - Battle results
   */
  async awardBattleXP(battle, results) {
    for (const playerResult of results.players) {
      try {
        const user = await User.findOne({ discordId: playerResult.discordId });
        if (!user) continue;
        
        // Base XP: 100 for participation
        let xpEarned = 100;
        
        // Winner bonus
        const isWinner = playerResult.discordId === results.winner && !results.isDraw;
        if (isWinner) {
          xpEarned += 150;
        } else if (results.isDraw) {
          xpEarned += 75; // Draw bonus
        }
        
        // Accuracy bonus
        if (playerResult.accuracy >= 80) {
          xpEarned += 50;
        }
        
        // Perfect score bonus
        if (playerResult.accuracy === 100) {
          xpEarned += 100;
        }
        
        // Apply streak multiplier
        const streakMultiplier = user.getStreakMultiplier ? user.getStreakMultiplier() : 1;
        const prestigeMultiplier = user.prestige?.bonusMultiplier || 1;
        const finalXp = Math.floor(xpEarned * streakMultiplier * prestigeMultiplier);
        
        // Award XP
        if (user.addXp) {
          await user.addXp(finalXp, isWinner ? 'challenge_win' : 'challenge_participation');
        } else {
          user.xp = (user.xp || 0) + finalXp;
          user.totalXpEarned = (user.totalXpEarned || 0) + finalXp;
        }
        
        // Update multiplayer stats
        if (!user.multiplayerStats) {
          user.multiplayerStats = { challenges: { played: 0, wins: 0, losses: 0 } };
        }
        if (!user.multiplayerStats.challenges) {
          user.multiplayerStats.challenges = { played: 0, wins: 0, losses: 0 };
        }
        
        user.multiplayerStats.challenges.played++;
        if (isWinner) {
          user.multiplayerStats.challenges.wins++;
        } else if (!results.isDraw) {
          user.multiplayerStats.challenges.losses++;
        }
        
        await user.save();
        
        // Store XP earned for emit
        playerResult.xpEarned = finalXp;
        
      } catch (error) {
        console.error(`Failed to award XP to ${playerResult.username}:`, error);
      }
    }
  }
  
  /**
   * Get player position in leaderboard
   * @param {Object} battle - Battle object
   * @param {string} playerId - Player ID
   * @returns {number} Position (1-based)
   */
  getPlayerPosition(battle, playerId) {
    const sorted = [...battle.players].sort((a, b) => b.score - a.score);
    return sorted.findIndex(p => p.discordId === playerId) + 1;
  }
  
  /**
   * Get leaderboard
   * @param {Object} battle - Battle object
   * @returns {Array} Leaderboard
   */
  getLeaderboard(battle) {
    return [...battle.players]
      .sort((a, b) => b.score - a.score)
      .map((p, index) => ({
        position: index + 1,
        discordId: p.discordId,
        username: p.username,
        score: p.score,
        answers: p.answers.length,
        streak: p.streak
      }));
  }
  
  /**
   * Calculate average answer time
   * @param {Array} answers - Player answers
   * @returns {number} Average time in seconds
   */
  calculateAverageTime(answers) {
    const correctAnswers = answers.filter(a => a.correct && a.timeTaken > 0);
    if (correctAnswers.length === 0) return 999;
    
    const totalTime = correctAnswers.reduce((sum, answer) => sum + answer.timeTaken, 0);
    return Math.round(totalTime / correctAnswers.length / 100) / 10; // Seconds with 1 decimal
  }
  
  /**
   * Get user from database
   * @param {string} discordId - Discord ID
   * @returns {Object} User object
   */
  async getUser(discordId) {
    try {
      let user = await User.findOne({ discordId });
      
      if (!user) {
        // Create new user
        user = await User.create({
          discordId,
          username: `User_${discordId.slice(-4)}`,
          level: 1,
          xp: 0
        });
      }
      
      return user;
    } catch (error) {
      console.error('Error getting user:', error);
      // Return mock data as fallback
      return {
        discordId,
        username: `User_${discordId.slice(-4)}`,
        avatar: null,
        level: 1,
        xp: 0,
        getStreakMultiplier: () => 1
      };
    }
  }
  
  /**
   * Remove challenge
   * @param {string} challengeId - Challenge ID
   */
  removeChallenge(challengeId) {
    const challenge = this.activeChallenges.get(challengeId);
    if (challenge) {
      this.pendingChallenges.delete(challenge.opponent.discordId);
    }
    this.activeChallenges.delete(challengeId);
  }
  
  /**
   * Cleanup battle
   * @param {string} battleId - Battle ID
   */
  cleanupBattle(battleId) {
    const battle = this.activeBattles.get(battleId);
    if (battle) {
      // Clear timeouts
      if (battle.questionTimeout) {
        clearTimeout(battle.questionTimeout);
      }
      if (battle.countdownInterval) {
        clearInterval(battle.countdownInterval);
      }
      
      // Remove player states
      for (const player of battle.players) {
        this.playerStates.delete(player.discordId);
      }
    }
    this.activeBattles.delete(battleId);
  }
  
  /**
   * Cleanup expired challenges
   */
  cleanupExpiredChallenges() {
    const now = new Date();
    
    for (const [challengeId, challenge] of this.activeChallenges.entries()) {
      if (challenge.expiresAt < now) {
        this.emit('challenge_expired', challenge);
        this.removeChallenge(challengeId);
      }
    }
  }
  
  /**
   * Cleanup stale battles
   */
  cleanupStaleBattles() {
    const now = Date.now();
    
    for (const [battleId, battle] of this.activeBattles.entries()) {
      // Remove battles inactive for 10 minutes
      const startTime = battle.startedAt ? battle.startedAt.getTime() : battle.createdAt?.getTime() || now;
      if (now - startTime > 10 * 60 * 1000 && battle.status !== 'completed') {
        console.log(`Cleaning up stale battle: ${battleId}`);
        this.cleanupBattle(battleId);
      }
    }
  }
  
  /**
   * Force end a battle (for admin/emergency)
   * @param {string} battleId - Battle ID
   */
  async forceEndBattle(battleId) {
    const battle = this.activeBattles.get(battleId);
    if (!battle) return null;
    
    await this.completeBattle(battleId);
    return battle;
  }
}

// Singleton instance
const challengeManager = new ChallengeManager();

export { ChallengeManager };
export default challengeManager;
