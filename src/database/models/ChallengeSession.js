/**
 * ChallengeSession Model - MongoDB-Backed Challenge State
 * 
 * Ensures challenges survive bot restarts and provides:
 * - Persistent challenge invites
 * - Real-time duel state tracking
 * - Atomic score/XP updates
 */

import mongoose from 'mongoose';

// ═══════════════════════════════════════════════════════════════════════════════
// SCHEMAS
// ═══════════════════════════════════════════════════════════════════════════════

const playerAnswerSchema = new mongoose.Schema({
  questionIndex: { type: Number, required: true },
  selectedIndex: { type: Number, required: true },
  correct: { type: Boolean, required: true },
  timeTaken: { type: Number, default: 0 }, // milliseconds
  points: { type: Number, default: 0 },
  answeredAt: { type: Date, default: Date.now }
}, { _id: false });

const playerSchema = new mongoose.Schema({
  discordId: { type: String, required: true },
  username: { type: String, required: true },
  score: { type: Number, default: 0 },
  answers: [playerAnswerSchema],
  streak: { type: Number, default: 0 },
  connected: { type: Boolean, default: true },
  ready: { type: Boolean, default: false },
  messageId: { type: String }, // DM message ID for updates
  channelId: { type: String }  // DM channel ID
}, { _id: false });

const questionSchema = new mongoose.Schema({
  question: { type: String, required: true },
  options: [{ type: String }],
  correctIndex: { type: Number, required: true },
  explanation: { type: String },
  conceptTested: { type: String },
  topic: { type: String },
  difficulty: { type: String }
}, { _id: false });

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN SCHEMA
// ═══════════════════════════════════════════════════════════════════════════════

const challengeSessionSchema = new mongoose.Schema({
  // Unique identifiers
  challengeId: { 
    type: String, 
    required: true, 
    unique: true,
    index: true 
  },
  
  // Challenge participants
  challenger: {
    discordId: { type: String, required: true },
    username: { type: String, required: true }
  },
  opponent: {
    discordId: { type: String, required: true },
    username: { type: String, required: true }
  },
  
  // Battle players (populated when accepted)
  players: [playerSchema],
  
  // Challenge settings
  settings: {
    topic: { type: String, default: 'random' },
    difficulty: { type: String, default: 'medium' },
    questionCount: { type: Number, default: 5 },
    timePerQuestion: { type: Number, default: 15000 } // 15 seconds
  },
  
  // Questions (generated on accept)
  questions: [questionSchema],
  
  // Game state
  currentQuestion: { type: Number, default: 0 },
  questionStartTime: { type: Date },
  roundWinner: { type: String }, // discordId of round winner (first correct)
  
  // Status tracking
  status: { 
    type: String, 
    enum: ['pending', 'accepted', 'loading', 'countdown', 'active', 'between_rounds', 'completed', 'declined', 'expired', 'cancelled'],
    default: 'pending',
    index: true
  },
  
  // Discord message tracking (for edits)
  channelId: { type: String },
  messageId: { type: String },
  
  // Timestamps
  createdAt: { type: Date, default: Date.now },
  expiresAt: { type: Date },
  acceptedAt: { type: Date },
  startedAt: { type: Date },
  completedAt: { type: Date },
  
  // Results (populated on completion)
  results: {
    winner: { type: String },
    isDraw: { type: Boolean, default: false },
    winnerScore: { type: Number },
    loserScore: { type: Number },
    winnerAccuracy: { type: Number },
    loserAccuracy: { type: Number }
  },
  
  // XP awards
  xpAwards: [{
    discordId: { type: String },
    baseXp: { type: Number },
    multiplier: { type: Number },
    finalXp: { type: Number },
    reason: { type: String }
  }],
  
  // AI Commentary (post-match analysis)
  postMatchAnalysis: { type: String }
});

// ═══════════════════════════════════════════════════════════════════════════════
// INDEXES
// ═══════════════════════════════════════════════════════════════════════════════

// Find pending challenges for a user
challengeSessionSchema.index({ 'opponent.discordId': 1, status: 1 });
challengeSessionSchema.index({ 'challenger.discordId': 1, status: 1 });

// Find active battles
challengeSessionSchema.index({ 'players.discordId': 1, status: 1 });

// Auto-expire after 1 hour (cleanup)
challengeSessionSchema.index({ createdAt: 1 }, { expireAfterSeconds: 3600 });

// ═══════════════════════════════════════════════════════════════════════════════
// STATIC METHODS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Create a new challenge
 */
challengeSessionSchema.statics.createChallenge = async function(challenger, opponent, settings = {}) {
  const challengeId = `duel_${Date.now().toString(36)}_${Math.random().toString(36).substr(2, 6)}`;
  
  // Cancel any existing pending challenges between these users
  await this.updateMany(
    {
      status: 'pending',
      $or: [
        { 'challenger.discordId': challenger.discordId, 'opponent.discordId': opponent.discordId },
        { 'challenger.discordId': opponent.discordId, 'opponent.discordId': challenger.discordId }
      ]
    },
    { $set: { status: 'cancelled' } }
  );
  
  return this.create({
    challengeId,
    challenger: {
      discordId: challenger.discordId,
      username: challenger.username
    },
    opponent: {
      discordId: opponent.discordId,
      username: opponent.username
    },
    settings: {
      topic: settings.topic || 'random',
      difficulty: settings.difficulty || 'medium',
      questionCount: Math.min(Math.max(settings.questions || 5, 3), 10),
      timePerQuestion: 15000
    },
    status: 'pending',
    expiresAt: new Date(Date.now() + 5 * 60 * 1000) // 5 minute expiry
  });
};

/**
 * Find pending challenge for opponent
 */
challengeSessionSchema.statics.findPendingForOpponent = function(opponentId) {
  return this.findOne({
    'opponent.discordId': opponentId,
    status: 'pending',
    expiresAt: { $gt: new Date() }
  });
};

/**
 * Find active battle for player
 */
challengeSessionSchema.statics.findActiveForPlayer = function(discordId) {
  return this.findOne({
    'players.discordId': discordId,
    status: { $in: ['loading', 'countdown', 'active', 'between_rounds'] }
  });
};

/**
 * Get challenge by ID
 */
challengeSessionSchema.statics.getByIdIfValid = function(challengeId) {
  return this.findOne({
    challengeId,
    status: { $in: ['pending', 'accepted', 'loading', 'countdown', 'active', 'between_rounds'] }
  });
};

/**
 * Cleanup expired challenges
 */
challengeSessionSchema.statics.cleanupExpired = async function() {
  const result = await this.updateMany(
    {
      status: 'pending',
      expiresAt: { $lt: new Date() }
    },
    { $set: { status: 'expired' } }
  );
  return result.modifiedCount;
};

// ═══════════════════════════════════════════════════════════════════════════════
// INSTANCE METHODS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Accept challenge and initialize battle
 */
challengeSessionSchema.methods.accept = async function(questions) {
  this.status = 'accepted';
  this.acceptedAt = new Date();
  this.questions = questions;
  
  // Initialize players array
  this.players = [
    {
      discordId: this.challenger.discordId,
      username: this.challenger.username,
      score: 0,
      answers: [],
      streak: 0,
      connected: true,
      ready: false
    },
    {
      discordId: this.opponent.discordId,
      username: this.opponent.username,
      score: 0,
      answers: [],
      streak: 0,
      connected: true,
      ready: false
    }
  ];
  
  return this.save();
};

/**
 * Decline the challenge
 */
challengeSessionSchema.methods.decline = async function() {
  this.status = 'declined';
  return this.save();
};

/**
 * Start the battle (after loading animation)
 */
challengeSessionSchema.methods.startBattle = async function() {
  this.status = 'active';
  this.startedAt = new Date();
  this.currentQuestion = 0;
  this.questionStartTime = new Date();
  return this.save();
};

/**
 * Submit answer - ATOMIC operation
 */
challengeSessionSchema.methods.submitAnswer = async function(discordId, answerIndex) {
  const player = this.players.find(p => p.discordId === discordId);
  if (!player) throw new Error('Player not in battle');
  
  // Check if already answered this question
  const alreadyAnswered = player.answers.some(a => a.questionIndex === this.currentQuestion);
  if (alreadyAnswered) throw new Error('Already answered this question');
  
  const question = this.questions[this.currentQuestion];
  const timeTaken = Date.now() - new Date(this.questionStartTime).getTime();
  const isCorrect = answerIndex === question.correctIndex;
  
  // Calculate points
  let points = 0;
  if (isCorrect) {
    // Base: 100 points
    points = 100;
    
    // Speed bonus (max 50 extra for instant answer)
    const speedBonus = Math.max(0, Math.floor((this.settings.timePerQuestion - timeTaken) / this.settings.timePerQuestion * 50));
    points += speedBonus;
    
    // Streak bonus
    points += player.streak * 10;
    
    player.streak++;
    
    // Check if first correct answer for this round
    const otherPlayer = this.players.find(p => p.discordId !== discordId);
    const otherAnswered = otherPlayer?.answers.some(a => a.questionIndex === this.currentQuestion && a.correct);
    if (!otherAnswered) {
      this.roundWinner = discordId;
    }
  } else {
    player.streak = 0;
  }
  
  // Record answer
  player.answers.push({
    questionIndex: this.currentQuestion,
    selectedIndex: answerIndex,
    correct: isCorrect,
    timeTaken,
    points,
    answeredAt: new Date()
  });
  
  player.score += points;
  
  await this.save();
  
  return {
    correct: isCorrect,
    points,
    totalScore: player.score,
    timeTaken,
    isRoundWinner: this.roundWinner === discordId
  };
};

/**
 * Check if all players answered current question
 */
challengeSessionSchema.methods.allAnswered = function() {
  return this.players.every(p => 
    p.answers.some(a => a.questionIndex === this.currentQuestion)
  );
};

/**
 * Move to next question
 */
challengeSessionSchema.methods.nextQuestion = async function() {
  this.currentQuestion++;
  this.roundWinner = null;
  
  if (this.currentQuestion >= this.questions.length) {
    return this.complete();
  }
  
  this.questionStartTime = new Date();
  this.status = 'active';
  await this.save();
  
  return {
    isComplete: false,
    question: this.questions[this.currentQuestion],
    questionNumber: this.currentQuestion + 1,
    totalQuestions: this.questions.length
  };
};

/**
 * Complete battle and calculate results
 */
challengeSessionSchema.methods.complete = async function() {
  this.status = 'completed';
  this.completedAt = new Date();
  
  // Sort players by score
  const sorted = [...this.players].sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    // Tiebreaker: accuracy
    const aAcc = a.answers.filter(ans => ans.correct).length / this.questions.length;
    const bAcc = b.answers.filter(ans => ans.correct).length / this.questions.length;
    if (bAcc !== aAcc) return bAcc - aAcc;
    // Tiebreaker: total time
    const aTime = a.answers.reduce((sum, ans) => sum + ans.timeTaken, 0);
    const bTime = b.answers.reduce((sum, ans) => sum + ans.timeTaken, 0);
    return aTime - bTime;
  });
  
  const winner = sorted[0];
  const loser = sorted[1];
  
  const winnerCorrect = winner.answers.filter(a => a.correct).length;
  const loserCorrect = loser.answers.filter(a => a.correct).length;
  
  this.results = {
    winner: winner.score === loser.score ? null : winner.discordId,
    isDraw: winner.score === loser.score,
    winnerScore: winner.score,
    loserScore: loser.score,
    winnerAccuracy: Math.round((winnerCorrect / this.questions.length) * 100),
    loserAccuracy: Math.round((loserCorrect / this.questions.length) * 100)
  };
  
  await this.save();
  
  return this.results;
};

/**
 * Get current leaderboard
 */
challengeSessionSchema.methods.getLeaderboard = function() {
  return [...this.players]
    .sort((a, b) => b.score - a.score)
    .map((p, i) => ({
      position: i + 1,
      discordId: p.discordId,
      username: p.username,
      score: p.score,
      streak: p.streak,
      correct: p.answers.filter(a => a.correct).length
    }));
};

/**
 * Get player by Discord ID
 */
challengeSessionSchema.methods.getPlayer = function(discordId) {
  return this.players.find(p => p.discordId === discordId);
};

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORT
// ═══════════════════════════════════════════════════════════════════════════════

export const ChallengeSession = mongoose.model('ChallengeSession', challengeSessionSchema);
export default ChallengeSession;
