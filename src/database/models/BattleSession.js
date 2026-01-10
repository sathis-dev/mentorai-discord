/**
 * BattleSession Model - Multiplayer Battle Tracking
 * 
 * Supports:
 * - 1v1 Challenges
 * - Arena (battle royale)
 * - Tournaments
 */

import mongoose from 'mongoose';

const playerAnswerSchema = new mongoose.Schema({
  questionIndex: { type: Number, required: true },
  selectedIndex: { type: Number, required: true },
  correct: { type: Boolean, required: true },
  timeTaken: Number, // milliseconds
  points: { type: Number, default: 0 }
}, { _id: false });

const playerSchema = new mongoose.Schema({
  discordId: { type: String, required: true },
  username: { type: String, required: true },
  score: { type: Number, default: 0 },
  answers: [playerAnswerSchema],
  streak: { type: Number, default: 0 }, // Consecutive correct
  connected: { type: Boolean, default: true },
  ready: { type: Boolean, default: false },
  joinedAt: { type: Date, default: Date.now }
}, { _id: false });

const battleQuestionSchema = new mongoose.Schema({
  id: String,
  question: { type: String, required: true },
  options: [String],
  correctIndex: { type: Number, required: true }
}, { _id: false });

const battleSessionSchema = new mongoose.Schema({
  // Unique battle identifier
  battleId: { 
    type: String, 
    required: true, 
    unique: true,
    index: true
  },
  
  // Battle type
  type: { 
    type: String, 
    enum: ['challenge', 'arena', 'tournament'],
    required: true
  },
  
  // All players in battle
  players: [playerSchema],
  
  // Challenge-specific fields
  challenger: String, // discordId
  opponent: String,   // discordId
  accepted: { type: Boolean, default: false },
  
  // Arena-specific fields
  maxPlayers: { type: Number, default: 8 },
  minPlayers: { type: Number, default: 4 },
  
  // Tournament-specific fields
  tournamentId: String,
  round: Number,
  
  // Battle configuration
  topic: { type: String, default: 'random' },
  difficulty: { 
    type: String, 
    enum: ['easy', 'medium', 'hard', 'mixed'],
    default: 'medium'
  },
  questionCount: { type: Number, default: 10 },
  
  // Questions (same for all players)
  questions: [battleQuestionSchema],
  
  // Game state
  currentQuestion: { type: Number, default: 0 },
  questionStartTime: Date,
  timePerQuestion: { type: Number, default: 15000 }, // 15 seconds
  countdown: { type: Number, default: 10 }, // Countdown before start
  
  // Status
  status: { 
    type: String, 
    enum: ['pending', 'waiting', 'countdown', 'active', 'between_questions', 'completed', 'cancelled', 'expired'],
    default: 'pending'
  },
  
  // Timestamps
  createdAt: { type: Date, default: Date.now },
  expiresAt: Date, // For pending challenges
  startedAt: Date,
  completedAt: Date,
  
  // Results
  winner: String, // discordId
  podium: [String], // [1st, 2nd, 3rd] discordIds
  
  // XP awards calculated at end
  xpAwards: [{
    discordId: String,
    xp: Number,
    reason: String
  }],
  
  // Discord message tracking
  messageIds: [{
    discordId: String,
    messageId: String,
    channelId: String
  }],
  
  // Settings
  settings: {
    speedBonus: { type: Boolean, default: true },
    streakBonus: { type: Boolean, default: true },
    allowLateJoin: { type: Boolean, default: false }
  }
}, {
  timestamps: true
});

// Indexes
battleSessionSchema.index({ status: 1, createdAt: -1 });
battleSessionSchema.index({ 'players.discordId': 1 });
battleSessionSchema.index({ type: 1, status: 1 });
battleSessionSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 }); // TTL: 1 hour

// Virtuals
battleSessionSchema.virtual('playerCount').get(function() {
  return this.players.length;
});

battleSessionSchema.virtual('allPlayersReady').get(function() {
  return this.players.every(p => p.ready);
});

battleSessionSchema.virtual('allPlayersAnswered').get(function() {
  return this.players.every(p => 
    p.answers.length > this.currentQuestion
  );
});

// Methods
battleSessionSchema.methods.addPlayer = function(discordId, username) {
  if (this.players.some(p => p.discordId === discordId)) {
    throw new Error('Player already in battle');
  }
  
  if (this.type === 'arena' && this.players.length >= this.maxPlayers) {
    throw new Error('Battle is full');
  }
  
  this.players.push({
    discordId,
    username,
    score: 0,
    answers: [],
    streak: 0,
    connected: true,
    ready: false,
    joinedAt: new Date()
  });
  
  return this.players[this.players.length - 1];
};

battleSessionSchema.methods.removePlayer = function(discordId) {
  const index = this.players.findIndex(p => p.discordId === discordId);
  if (index === -1) {
    throw new Error('Player not in battle');
  }
  
  this.players.splice(index, 1);
  return true;
};

battleSessionSchema.methods.getPlayer = function(discordId) {
  return this.players.find(p => p.discordId === discordId);
};

battleSessionSchema.methods.setPlayerReady = function(discordId, ready = true) {
  const player = this.getPlayer(discordId);
  if (!player) {
    throw new Error('Player not in battle');
  }
  
  player.ready = ready;
  return this.allPlayersReady;
};

battleSessionSchema.methods.submitAnswer = function(discordId, answerIndex) {
  const player = this.getPlayer(discordId);
  if (!player) {
    throw new Error('Player not in battle');
  }
  
  // Check if already answered this question
  if (player.answers.some(a => a.questionIndex === this.currentQuestion)) {
    throw new Error('Already answered this question');
  }
  
  const question = this.questions[this.currentQuestion];
  const timeTaken = Date.now() - new Date(this.questionStartTime).getTime();
  const isCorrect = answerIndex === question.correctIndex;
  
  // Calculate points
  let points = 0;
  if (isCorrect) {
    // Base points
    points = 100;
    
    // Speed bonus (faster = more points)
    if (this.settings.speedBonus) {
      const speedBonus = Math.max(0, Math.floor((this.timePerQuestion - timeTaken) / 1000));
      points += speedBonus * 5;
    }
    
    // Streak bonus
    if (this.settings.streakBonus) {
      points += player.streak * 10;
    }
    
    player.streak++;
  } else {
    player.streak = 0;
  }
  
  player.answers.push({
    questionIndex: this.currentQuestion,
    selectedIndex: answerIndex,
    correct: isCorrect,
    timeTaken,
    points
  });
  
  player.score += points;
  
  return {
    correct: isCorrect,
    points,
    totalScore: player.score,
    streak: player.streak
  };
};

battleSessionSchema.methods.getLeaderboard = function() {
  return [...this.players]
    .sort((a, b) => b.score - a.score)
    .map((player, index) => ({
      position: index + 1,
      discordId: player.discordId,
      username: player.username,
      score: player.score,
      streak: player.streak,
      answeredCurrent: player.answers.length > this.currentQuestion
    }));
};

battleSessionSchema.methods.nextQuestion = function() {
  this.currentQuestion++;
  this.questionStartTime = new Date();
  this.status = 'active';
  
  // Reset streaks for incorrect players
  for (const player of this.players) {
    if (player.answers.length === this.currentQuestion - 1 || 
        !player.answers[this.currentQuestion - 1]?.correct) {
      player.streak = 0;
    }
  }
  
  if (this.currentQuestion >= this.questions.length) {
    return this.complete();
  }
  
  return {
    question: this.questions[this.currentQuestion],
    questionNumber: this.currentQuestion + 1,
    totalQuestions: this.questions.length
  };
};

battleSessionSchema.methods.complete = function() {
  this.status = 'completed';
  this.completedAt = new Date();
  
  // Determine winner and podium
  const sorted = this.getLeaderboard();
  
  if (sorted.length > 0) {
    this.winner = sorted[0].discordId;
    this.podium = sorted.slice(0, 3).map(p => p.discordId);
  }
  
  return {
    winner: this.winner,
    podium: this.podium,
    leaderboard: sorted
  };
};

battleSessionSchema.methods.cancel = function(reason = 'Cancelled') {
  this.status = 'cancelled';
  this.completedAt = new Date();
};

// Statics
battleSessionSchema.statics.findActiveChallenge = function(challengerId, opponentId) {
  return this.findOne({
    type: 'challenge',
    status: { $in: ['pending', 'waiting', 'active'] },
    $or: [
      { challenger: challengerId, opponent: opponentId },
      { challenger: opponentId, opponent: challengerId }
    ]
  });
};

battleSessionSchema.statics.findPlayerActiveBattle = function(discordId) {
  return this.findOne({
    status: { $in: ['waiting', 'countdown', 'active'] },
    'players.discordId': discordId
  });
};

battleSessionSchema.statics.findWaitingArenas = function() {
  return this.find({
    type: 'arena',
    status: 'waiting'
  }).sort({ createdAt: 1 });
};

battleSessionSchema.statics.cleanupExpired = async function() {
  const now = new Date();
  
  // Expire pending challenges after 5 minutes
  await this.updateMany(
    {
      type: 'challenge',
      status: 'pending',
      createdAt: { $lt: new Date(now - 5 * 60 * 1000) }
    },
    { $set: { status: 'expired' } }
  );
  
  // Expire inactive battles after 30 minutes
  await this.updateMany(
    {
      status: { $in: ['waiting', 'active'] },
      startedAt: { $lt: new Date(now - 30 * 60 * 1000) }
    },
    { $set: { status: 'expired' } }
  );
};

export const BattleSession = mongoose.model('BattleSession', battleSessionSchema);
export default BattleSession;
