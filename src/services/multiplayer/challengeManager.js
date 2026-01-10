/**
 * Challenge Manager - 1v1 Quiz Battles
 * 
 * Handles:
 * - Challenge creation and acceptance
 * - Real-time gameplay synchronization
 * - Score calculation with speed bonuses
 * - XP rewards
 */

import { BattleSession } from '../../database/models/BattleSession.js';
import { User } from '../../database/models/User.js';
import { XPService } from '../xpService.js';
import { QuizEngine } from '../quiz/engine.js';

export class ChallengeManager {
  constructor() {
    /**
     * Active challenges in memory for quick access
     */
    this.challenges = new Map();
    
    /**
     * Pending challenges per user
     */
    this.pendingChallenges = new Map();
    
    /**
     * XP Service
     */
    this.xpService = new XPService();
    
    /**
     * Quiz Engine for question generation
     */
    this.quizEngine = new QuizEngine();
    
    /**
     * Challenge expiry time (5 minutes)
     */
    this.CHALLENGE_EXPIRY = 5 * 60 * 1000;
    
    /**
     * Cleanup interval
     */
    setInterval(() => this.cleanupExpired(), 5 * 60 * 1000);
  }

  /**
   * Create a new challenge
   * @param {string} challengerId - Discord ID of challenger
   * @param {string} opponentId - Discord ID of opponent
   * @param {Object} options - Challenge options
   * @returns {Object} Challenge data
   */
  async createChallenge(challengerId, opponentId, options = {}) {
    // Get users
    const challenger = await User.findOne({ discordId: challengerId });
    const opponent = await User.findOne({ discordId: opponentId });

    if (!challenger) throw new Error('Challenger not found');
    if (!opponent) throw new Error('Opponent not found');

    // Check if opponent has pending challenge
    if (this.pendingChallenges.has(opponentId)) {
      throw new Error(`${opponent.username} already has a pending challenge`);
    }

    // Check if either player is in an active battle
    const existingBattle = await BattleSession.findPlayerActiveBattle(challengerId);
    if (existingBattle) {
      throw new Error('You are already in an active battle');
    }

    const opponentBattle = await BattleSession.findPlayerActiveBattle(opponentId);
    if (opponentBattle) {
      throw new Error(`${opponent.username} is already in a battle`);
    }

    // Create challenge ID
    const challengeId = `challenge_${Date.now()}_${challengerId}`;
    
    // Create challenge
    const challenge = {
      challengeId,
      challenger: {
        discordId: challengerId,
        username: challenger.username
      },
      opponent: {
        discordId: opponentId,
        username: opponent.username
      },
      options: {
        topic: options.topic || 'random',
        questions: Math.min(Math.max(options.questions || 5, 3), 10),
        difficulty: options.difficulty || 'medium',
        timePerQuestion: options.timePerQuestion || 15000
      },
      status: 'pending',
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + this.CHALLENGE_EXPIRY)
    };

    // Store challenge
    this.challenges.set(challengeId, challenge);
    this.pendingChallenges.set(opponentId, challengeId);

    return challenge;
  }

  /**
   * Accept a challenge
   * @param {string} challengeId - Challenge ID
   * @param {string} accepterId - Discord ID of accepter
   * @returns {Object} Battle data with first question
   */
  async acceptChallenge(challengeId, accepterId) {
    const challenge = this.challenges.get(challengeId);
    
    if (!challenge) {
      throw new Error('Challenge not found or expired');
    }

    // Verify accepter is the opponent
    if (challenge.opponent.discordId !== accepterId) {
      throw new Error('Only the challenged player can accept');
    }

    // Check expiry
    if (new Date() > challenge.expiresAt) {
      this.challenges.delete(challengeId);
      this.pendingChallenges.delete(accepterId);
      throw new Error('Challenge has expired');
    }

    // Generate questions
    const questions = await this.quizEngine.generateQuestions({
      topic: challenge.options.topic,
      difficulty: challenge.options.difficulty,
      count: challenge.options.questions
    });

    // Create battle session
    const battleId = challengeId.replace('challenge_', 'battle_');
    
    const battle = await BattleSession.create({
      battleId,
      type: 'challenge',
      players: [
        {
          discordId: challenge.challenger.discordId,
          username: challenge.challenger.username,
          score: 0,
          answers: [],
          streak: 0,
          connected: true,
          ready: true
        },
        {
          discordId: challenge.opponent.discordId,
          username: challenge.opponent.username,
          score: 0,
          answers: [],
          streak: 0,
          connected: true,
          ready: true
        }
      ],
      challenger: challenge.challenger.discordId,
      opponent: challenge.opponent.discordId,
      accepted: true,
      topic: challenge.options.topic,
      difficulty: challenge.options.difficulty,
      questionCount: questions.length,
      questions: questions.map(q => ({
        id: q.id,
        question: q.question,
        options: q.options,
        correctIndex: q.correctIndex
      })),
      currentQuestion: 0,
      questionStartTime: new Date(),
      timePerQuestion: challenge.options.timePerQuestion,
      status: 'active',
      startedAt: new Date()
    });

    // Update challenge status
    challenge.status = 'accepted';
    challenge.battleId = battleId;

    // Remove from pending
    this.pendingChallenges.delete(accepterId);

    return {
      battleId,
      players: battle.players.map(p => ({
        discordId: p.discordId,
        username: p.username
      })),
      firstQuestion: this.formatBattleQuestion(battle, 0),
      totalQuestions: questions.length,
      timePerQuestion: challenge.options.timePerQuestion
    };
  }

  /**
   * Decline a challenge
   * @param {string} challengeId - Challenge ID
   * @param {string} declinerId - Discord ID of decliner
   */
  async declineChallenge(challengeId, declinerId) {
    const challenge = this.challenges.get(challengeId);
    
    if (!challenge) {
      throw new Error('Challenge not found');
    }

    if (challenge.opponent.discordId !== declinerId) {
      throw new Error('Only the challenged player can decline');
    }

    challenge.status = 'declined';
    this.challenges.delete(challengeId);
    this.pendingChallenges.delete(declinerId);

    return {
      declined: true,
      challenger: challenge.challenger,
      opponent: challenge.opponent
    };
  }

  /**
   * Submit answer in battle
   * @param {string} battleId - Battle ID
   * @param {string} playerId - Player's Discord ID
   * @param {number} answerIndex - Selected answer (0-3)
   * @returns {Object} Answer result
   */
  async submitBattleAnswer(battleId, playerId, answerIndex) {
    const battle = await BattleSession.findOne({ battleId });
    
    if (!battle) {
      throw new Error('Battle not found');
    }

    if (battle.status !== 'active') {
      throw new Error('Battle is not active');
    }

    const result = battle.submitAnswer(playerId, answerIndex);
    await battle.save();

    // Check if both players answered
    const allAnswered = battle.allPlayersAnswered;

    return {
      ...result,
      allAnswered,
      leaderboard: battle.getLeaderboard(),
      currentQuestion: battle.currentQuestion + 1,
      totalQuestions: battle.questions.length
    };
  }

  /**
   * Advance to next question
   * @param {string} battleId - Battle ID
   * @returns {Object} Next question or completion result
   */
  async nextBattleQuestion(battleId) {
    const battle = await BattleSession.findOne({ battleId });
    
    if (!battle) {
      throw new Error('Battle not found');
    }

    // Check if battle is complete
    if (battle.currentQuestion >= battle.questions.length - 1) {
      return this.completeBattle(battleId);
    }

    const result = battle.nextQuestion();
    await battle.save();

    return {
      question: this.formatBattleQuestion(battle, battle.currentQuestion),
      questionNumber: battle.currentQuestion + 1,
      totalQuestions: battle.questions.length,
      leaderboard: battle.getLeaderboard()
    };
  }

  /**
   * Complete battle and award XP
   * @param {string} battleId - Battle ID
   * @returns {Object} Battle results
   */
  async completeBattle(battleId) {
    const battle = await BattleSession.findOne({ battleId });
    
    if (!battle) {
      throw new Error('Battle not found');
    }

    // Complete the battle
    const result = battle.complete();
    
    // Award XP to players
    const xpAwards = [];
    
    for (let i = 0; i < battle.players.length; i++) {
      const player = battle.players[i];
      const user = await User.findOne({ discordId: player.discordId });
      
      if (!user) continue;

      const isWinner = player.discordId === battle.winner;
      const isDraw = battle.players[0].score === battle.players[1].score;

      // Calculate XP
      const xpCalc = this.xpService.calculateXp(user, 'challenge', {
        win: isWinner && !isDraw,
        draw: isDraw,
        correct: player.answers.filter(a => a.correct).length,
        total: battle.questions.length
      });

      // Award XP
      await this.xpService.awardXp(user, xpCalc.finalXp, 'challenge');

      // Update multiplayer stats
      if (!user.multiplayerStats) {
        user.multiplayerStats = { challenges: { wins: 0, losses: 0, draws: 0 } };
      }
      
      if (isDraw) {
        user.multiplayerStats.challenges.draws++;
      } else if (isWinner) {
        user.multiplayerStats.challenges.wins++;
      } else {
        user.multiplayerStats.challenges.losses++;
      }

      await user.save();

      xpAwards.push({
        discordId: player.discordId,
        username: player.username,
        xp: xpCalc.finalXp,
        isWinner: isWinner && !isDraw,
        isDraw
      });
    }

    battle.xpAwards = xpAwards;
    await battle.save();

    return {
      completed: true,
      winner: result.winner,
      isDraw: battle.players[0].score === battle.players[1].score,
      leaderboard: result.leaderboard.map((p, i) => ({
        position: i + 1,
        discordId: p.discordId,
        username: p.username,
        score: p.score,
        accuracy: battle.questions.length > 0 
          ? Math.round((battle.players.find(pl => pl.discordId === p.discordId).answers.filter(a => a.correct).length / battle.questions.length) * 100)
          : 0
      })),
      xpAwards,
      totalQuestions: battle.questions.length
    };
  }

  /**
   * Get pending challenge for user
   * @param {string} userId - Discord ID
   * @returns {Object|null} Pending challenge
   */
  getPendingChallenge(userId) {
    const challengeId = this.pendingChallenges.get(userId);
    if (!challengeId) return null;
    
    return this.challenges.get(challengeId);
  }

  /**
   * Get user's active battle
   * @param {string} userId - Discord ID
   * @returns {Object|null} Active battle
   */
  async getActiveBattle(userId) {
    return BattleSession.findPlayerActiveBattle(userId);
  }

  /**
   * Format battle question for display
   */
  formatBattleQuestion(battle, questionIndex) {
    const question = battle.questions[questionIndex];
    
    return {
      id: question.id,
      text: question.question,
      options: question.options.map((opt, i) => ({
        index: i,
        text: opt,
        label: String.fromCharCode(65 + i)
      })),
      questionNumber: questionIndex + 1,
      totalQuestions: battle.questions.length,
      timeLimit: battle.timePerQuestion
    };
  }

  /**
   * Cleanup expired challenges
   */
  cleanupExpired() {
    const now = new Date();

    for (const [challengeId, challenge] of this.challenges.entries()) {
      if (challenge.status === 'pending' && challenge.expiresAt < now) {
        this.challenges.delete(challengeId);
        this.pendingChallenges.delete(challenge.opponent.discordId);
      }
    }

    // Also cleanup in database
    BattleSession.cleanupExpired();
  }

  /**
   * Cancel a challenge
   * @param {string} challengeId - Challenge ID
   * @param {string} userId - User requesting cancellation
   */
  async cancelChallenge(challengeId, userId) {
    const challenge = this.challenges.get(challengeId);
    
    if (!challenge) {
      throw new Error('Challenge not found');
    }

    // Only challenger can cancel
    if (challenge.challenger.discordId !== userId) {
      throw new Error('Only the challenger can cancel');
    }

    challenge.status = 'cancelled';
    this.challenges.delete(challengeId);
    this.pendingChallenges.delete(challenge.opponent.discordId);

    return {
      cancelled: true,
      challengeId
    };
  }
}

export default ChallengeManager;
