/**
 * Study Party Manager - Collaborative Learning
 * 
 * Features:
 * - Group creation and management
 * - XP multiplier bonuses for group learning
 * - Collaborative quizzes
 * - Invite system
 */

import { StudyParty } from '../../database/models/StudyParty.js';
import { User } from '../../database/models/User.js';
import { XPService } from '../xpService.js';
import { QuizEngine } from '../quiz/engine.js';

export class StudyPartyManager {
  constructor() {
    /**
     * Active parties in memory
     */
    this.parties = new Map();
    
    /**
     * Party invites
     */
    this.invites = new Map();
    
    /**
     * XP Service
     */
    this.xpService = new XPService();
    
    /**
     * Quiz Engine
     */
    this.quizEngine = new QuizEngine();
    
    /**
     * Party settings
     */
    this.settings = {
      maxMembers: 5,
      xpMultiplier: 1.5, // +50% XP
      inviteExpiry: 30 * 60 * 1000, // 30 minutes
      inactivityTimeout: 60 * 60 * 1000 // 1 hour
    };
  }

  /**
   * Create a new study party
   * @param {string} creatorId - Discord ID
   * @param {Object} options - Party options
   * @returns {Object} Party data
   */
  async createParty(creatorId, options = {}) {
    const creator = await User.findOne({ discordId: creatorId });
    if (!creator) throw new Error('User not found');

    // Check if already in a party
    const existingParty = await this.getUserParty(creatorId);
    if (existingParty) {
      throw new Error('Already in a study party. Leave first to create a new one.');
    }

    // Generate party ID and invite code
    const partyId = `party_${Date.now()}_${creatorId}`;
    const inviteCode = this.generateInviteCode();

    // Create party
    const party = await StudyParty.create({
      partyId,
      name: options.name || `${creator.username}'s Study Party`,
      topic: options.topic || 'General Learning',
      description: options.description || '',
      creator: {
        discordId: creatorId,
        username: creator.username
      },
      members: [{
        discordId: creatorId,
        username: creator.username,
        joinedAt: new Date(),
        xpContribution: 0,
        questionsAnswered: 0,
        correctAnswers: 0,
        isCreator: true
      }],
      maxMembers: options.maxMembers || this.settings.maxMembers,
      privacy: options.privacy || 'public',
      inviteCode,
      status: 'active',
      settings: {
        xpMultiplier: this.settings.xpMultiplier,
        sharedGoals: true,
        collaborativeQuizzes: true,
        notifications: true
      }
    });

    // Update user's current party
    creator.currentStudyParty = partyId;
    await creator.save();

    // Cache party
    this.parties.set(partyId, party);

    return {
      partyId,
      name: party.name,
      topic: party.topic,
      inviteCode,
      members: party.members.length,
      maxMembers: party.maxMembers,
      xpBonus: `${Math.round((this.settings.xpMultiplier - 1) * 100)}%`
    };
  }

  /**
   * Join party by invite code
   * @param {string} userId - Discord ID
   * @param {string} code - Invite code
   * @returns {Object} Party data
   */
  async joinByCode(userId, code) {
    const user = await User.findOne({ discordId: userId });
    if (!user) throw new Error('User not found');

    // Check if already in a party
    if (user.currentStudyParty) {
      throw new Error('Already in a study party. Leave first to join another.');
    }

    // Find party by code
    const party = await StudyParty.findOne({
      inviteCode: code.toUpperCase(),
      status: 'active'
    });

    if (!party) {
      throw new Error('Invalid invite code or party not found');
    }

    if (party.members.length >= party.maxMembers) {
      throw new Error('Party is full');
    }

    // Add member
    party.members.push({
      discordId: userId,
      username: user.username,
      joinedAt: new Date(),
      xpContribution: 0,
      questionsAnswered: 0,
      correctAnswers: 0,
      isCreator: false
    });

    party.lastActivityAt = new Date();
    await party.save();

    // Update user
    user.currentStudyParty = party.partyId;
    await user.save();

    // Update cache
    this.parties.set(party.partyId, party);

    return {
      partyId: party.partyId,
      name: party.name,
      topic: party.topic,
      members: party.members.map(m => m.username),
      xpBonus: `${Math.round((party.settings.xpMultiplier - 1) * 100)}%`
    };
  }

  /**
   * Invite user to party
   * @param {string} partyId - Party ID
   * @param {string} inviterId - Inviter's Discord ID
   * @param {string} inviteeId - Invitee's Discord ID
   * @returns {Object} Invite data
   */
  async inviteUser(partyId, inviterId, inviteeId) {
    const party = await this.getParty(partyId);
    if (!party) throw new Error('Party not found');

    // Verify inviter is in party
    if (!party.members.some(m => m.discordId === inviterId)) {
      throw new Error('Only party members can invite others');
    }

    // Check if party is full
    if (party.members.length >= party.maxMembers) {
      throw new Error('Party is full');
    }

    // Check if invitee exists
    const invitee = await User.findOne({ discordId: inviteeId });
    if (!invitee) throw new Error('User not found');

    // Check if already in party
    if (party.members.some(m => m.discordId === inviteeId)) {
      throw new Error('User is already in the party');
    }

    // Create invite
    const inviteId = `invite_${Date.now()}_${inviteeId}`;
    const invite = {
      inviteId,
      partyId,
      partyName: party.name,
      inviter: {
        discordId: inviterId,
        username: party.members.find(m => m.discordId === inviterId).username
      },
      inviteeId,
      expiresAt: new Date(Date.now() + this.settings.inviteExpiry),
      status: 'pending'
    };

    // Store invite
    if (!this.invites.has(inviteeId)) {
      this.invites.set(inviteeId, []);
    }
    this.invites.get(inviteeId).push(invite);

    return invite;
  }

  /**
   * Accept party invite
   * @param {string} inviteId - Invite ID
   * @param {string} userId - User's Discord ID
   * @returns {Object} Party data
   */
  async acceptInvite(inviteId, userId) {
    const userInvites = this.invites.get(userId) || [];
    const invite = userInvites.find(i => i.inviteId === inviteId);

    if (!invite) throw new Error('Invite not found');
    if (new Date() > invite.expiresAt) {
      this.removeInvite(userId, inviteId);
      throw new Error('Invite has expired');
    }

    // Join party
    const result = await this.joinByCode(userId, 
      (await this.getParty(invite.partyId)).inviteCode);

    // Remove invite
    this.removeInvite(userId, inviteId);

    return result;
  }

  /**
   * Leave party
   * @param {string} userId - Discord ID
   * @returns {Object} Result
   */
  async leaveParty(userId) {
    const user = await User.findOne({ discordId: userId });
    if (!user) throw new Error('User not found');
    if (!user.currentStudyParty) throw new Error('Not in a party');

    const party = await this.getParty(user.currentStudyParty);
    if (!party) {
      user.currentStudyParty = null;
      await user.save();
      throw new Error('Party not found');
    }

    // Remove from party
    const memberIndex = party.members.findIndex(m => m.discordId === userId);
    if (memberIndex === -1) {
      user.currentStudyParty = null;
      await user.save();
      throw new Error('Not a member of this party');
    }

    const wasCreator = party.members[memberIndex].isCreator;
    party.members.splice(memberIndex, 1);

    // If party is empty, disband
    if (party.members.length === 0) {
      party.status = 'disbanded';
      await party.save();
      this.parties.delete(party.partyId);
      user.currentStudyParty = null;
      await user.save();
      return { disbanded: true };
    }

    // If creator left, assign new creator
    if (wasCreator && party.members.length > 0) {
      party.members[0].isCreator = true;
      party.creator = {
        discordId: party.members[0].discordId,
        username: party.members[0].username
      };
    }

    party.lastActivityAt = new Date();
    await party.save();
    this.parties.set(party.partyId, party);

    user.currentStudyParty = null;
    await user.save();

    return {
      left: true,
      partyName: party.name,
      remainingMembers: party.members.length
    };
  }

  /**
   * Start collaborative quiz
   * @param {string} partyId - Party ID
   * @param {string} initiatorId - Discord ID of initiator
   * @param {Object} options - Quiz options
   * @returns {Object} Quiz data
   */
  async startPartyQuiz(partyId, initiatorId, options = {}) {
    const party = await this.getParty(partyId);
    if (!party) throw new Error('Party not found');

    if (!party.members.some(m => m.discordId === initiatorId)) {
      throw new Error('Only party members can start activities');
    }

    if (party.currentActivity) {
      throw new Error('An activity is already in progress');
    }

    // Generate questions
    const questions = await this.quizEngine.generateQuestions({
      topic: options.topic || party.topic,
      difficulty: options.difficulty || 'medium',
      count: options.count || 10
    });

    // Create activity
    party.currentActivity = {
      type: 'quiz',
      topic: options.topic || party.topic,
      startedAt: new Date(),
      participants: party.members.map(m => m.discordId),
      results: {
        questions,
        currentQuestion: 0,
        answers: new Map(),
        scores: new Map()
      }
    };

    party.lastActivityAt = new Date();
    await party.save();
    this.parties.set(partyId, party);

    return {
      started: true,
      type: 'quiz',
      topic: party.currentActivity.topic,
      questions: questions.length,
      participants: party.members.map(m => m.username),
      firstQuestion: this.formatPartyQuestion(questions[0], 0)
    };
  }

  /**
   * Submit answer in party quiz
   * @param {string} partyId - Party ID
   * @param {string} userId - User's Discord ID
   * @param {number} answerIndex - Selected answer
   * @returns {Object} Answer result
   */
  async submitPartyAnswer(partyId, userId, answerIndex) {
    const party = await this.getParty(partyId);
    if (!party) throw new Error('Party not found');

    if (!party.currentActivity || party.currentActivity.type !== 'quiz') {
      throw new Error('No active quiz');
    }

    const activity = party.currentActivity;
    const questions = activity.results.questions;
    const currentQ = activity.results.currentQuestion;
    const question = questions[currentQ];

    const isCorrect = answerIndex === question.correctIndex;

    // Initialize user maps if needed
    if (!activity.results.answers.has(userId)) {
      activity.results.answers.set(userId, []);
    }
    if (!activity.results.scores.has(userId)) {
      activity.results.scores.set(userId, 0);
    }

    // Record answer
    activity.results.answers.get(userId).push({
      questionIndex: currentQ,
      answer: answerIndex,
      correct: isCorrect
    });

    // Update score
    if (isCorrect) {
      activity.results.scores.set(
        userId, 
        activity.results.scores.get(userId) + 10
      );
    }

    // Update member stats
    const member = party.members.find(m => m.discordId === userId);
    if (member) {
      member.questionsAnswered++;
      if (isCorrect) member.correctAnswers++;
    }

    await party.save();
    this.parties.set(partyId, party);

    // Check if all answered
    const allAnswered = party.members.every(m => {
      const answers = activity.results.answers.get(m.discordId);
      return answers && answers.length > currentQ;
    });

    return {
      correct: isCorrect,
      score: activity.results.scores.get(userId),
      allAnswered,
      answeredCount: party.members.filter(m => {
        const answers = activity.results.answers.get(m.discordId);
        return answers && answers.length > currentQ;
      }).length,
      totalMembers: party.members.length
    };
  }

  /**
   * Complete party quiz
   * @param {string} partyId - Party ID
   * @returns {Object} Results
   */
  async completePartyQuiz(partyId) {
    const party = await this.getParty(partyId);
    if (!party) throw new Error('Party not found');

    if (!party.currentActivity) throw new Error('No active activity');

    const activity = party.currentActivity;
    const questions = activity.results.questions;
    const xpMultiplier = party.settings.xpMultiplier;

    // Calculate and award XP
    const results = [];

    for (const member of party.members) {
      const user = await User.findOne({ discordId: member.discordId });
      if (!user) continue;

      const score = activity.results.scores.get(member.discordId) || 0;
      const correctCount = (activity.results.answers.get(member.discordId) || [])
        .filter(a => a.correct).length;

      // Calculate XP with party bonus
      let xpEarned = correctCount * 5; // Base XP
      const { finalXp, multipliers } = this.xpService.applyMultipliers(user, xpEarned);
      
      // Apply party multiplier on top
      const partyXp = Math.floor(finalXp * xpMultiplier);

      // Award XP
      await this.xpService.awardXp(user, partyXp, 'party_quiz');

      // Update member contribution
      member.xpContribution += partyXp;

      results.push({
        discordId: member.discordId,
        username: member.username,
        score,
        correct: correctCount,
        total: questions.length,
        xpEarned: partyXp
      });

      await user.save();
    }

    // Update party stats
    party.stats.quizzesCompleted++;
    party.stats.totalXpEarned += results.reduce((sum, r) => sum + r.xpEarned, 0);
    party.stats.totalQuestions += questions.length * party.members.length;
    party.stats.totalCorrect += results.reduce((sum, r) => sum + r.correct, 0);

    // Move activity to history
    party.activityHistory.push({
      ...activity,
      completedAt: new Date(),
      results: results
    });

    party.currentActivity = null;
    party.lastActivityAt = new Date();
    await party.save();
    this.parties.set(partyId, party);

    return {
      completed: true,
      results: results.sort((a, b) => b.score - a.score),
      partyXpBonus: `${Math.round((xpMultiplier - 1) * 100)}%`,
      totalXpAwarded: results.reduce((sum, r) => sum + r.xpEarned, 0)
    };
  }

  /**
   * Get party leaderboard
   * @param {string} partyId - Party ID
   * @returns {Array} Leaderboard
   */
  async getPartyLeaderboard(partyId) {
    const party = await this.getParty(partyId);
    if (!party) throw new Error('Party not found');

    return party.members
      .map(m => ({
        discordId: m.discordId,
        username: m.username,
        xpContribution: m.xpContribution,
        accuracy: m.questionsAnswered > 0
          ? Math.round((m.correctAnswers / m.questionsAnswered) * 100)
          : 0,
        isCreator: m.isCreator
      }))
      .sort((a, b) => b.xpContribution - a.xpContribution);
  }

  /**
   * Get user's current party
   * @param {string} userId - Discord ID
   * @returns {Object|null} Party data
   */
  async getUserParty(userId) {
    const user = await User.findOne({ discordId: userId });
    if (!user || !user.currentStudyParty) return null;

    return this.getParty(user.currentStudyParty);
  }

  /**
   * Get party by ID
   */
  async getParty(partyId) {
    // Check cache
    if (this.parties.has(partyId)) {
      return this.parties.get(partyId);
    }

    // Load from database
    const party = await StudyParty.findOne({ partyId, status: 'active' });
    if (party) {
      this.parties.set(partyId, party);
    }
    return party;
  }

  /**
   * Format question for party display
   */
  formatPartyQuestion(question, index) {
    return {
      id: question.id,
      text: question.question,
      options: question.options.map((opt, i) => ({
        index: i,
        text: opt,
        label: String.fromCharCode(65 + i)
      })),
      questionNumber: index + 1
    };
  }

  /**
   * Generate invite code
   */
  generateInviteCode() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  }

  /**
   * Remove invite
   */
  removeInvite(userId, inviteId) {
    const invites = this.invites.get(userId) || [];
    const filtered = invites.filter(i => i.inviteId !== inviteId);
    
    if (filtered.length === 0) {
      this.invites.delete(userId);
    } else {
      this.invites.set(userId, filtered);
    }
  }

  /**
   * Get public parties
   */
  async getPublicParties(limit = 10) {
    return StudyParty.findPublicParties(limit);
  }

  /**
   * Get party stats
   */
  async getPartyStats(partyId) {
    const party = await this.getParty(partyId);
    if (!party) throw new Error('Party not found');

    return {
      name: party.name,
      topic: party.topic,
      memberCount: party.members.length,
      maxMembers: party.maxMembers,
      totalXpEarned: party.stats.totalXpEarned,
      quizzesCompleted: party.stats.quizzesCompleted,
      accuracy: party.stats.totalQuestions > 0
        ? Math.round((party.stats.totalCorrect / party.stats.totalQuestions) * 100)
        : 0,
      xpMultiplier: party.settings.xpMultiplier
    };
  }
}

export default StudyPartyManager;
