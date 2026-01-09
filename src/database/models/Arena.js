import mongoose from 'mongoose';

const arenaSchema = new mongoose.Schema({
  arenaId: { type: String, required: true, unique: true },
  hostId: { type: String, required: true },
  hostUsername: { type: String, required: true },
  
  // Arena Configuration
  topic: { type: String, required: true },
  difficulty: { type: String, default: 'medium' },
  maxPlayers: { type: Number, default: 10 },
  questionCount: { type: Number, default: 10 },
  timePerQuestion: { type: Number, default: 15 }, // seconds
  
  // Arena State
  status: { 
    type: String, 
    enum: ['waiting', 'countdown', 'question', 'results', 'finished', 'cancelled'],
    default: 'waiting'
  },
  currentQuestion: { type: Number, default: 0 },
  questionStartTime: { type: Date },
  
  // Players
  players: [{
    odiscordId: String,
    username: String,
    score: { type: Number, default: 0 },
    answers: [Number], // Index of answer chosen for each question
    responseTimes: [Number], // Time taken for each answer in ms
    correctCount: { type: Number, default: 0 },
    joinedAt: Date
  }],
  
  // Questions
  questions: [{
    question: String,
    options: [String],
    correct: Number, // Index of correct answer
    explanation: String
  }],
  
  // Join Code (6 character alphanumeric)
  joinCode: { type: String, unique: true },
  
  // Timestamps
  createdAt: { type: Date, default: Date.now },
  startedAt: { type: Date },
  endedAt: { type: Date },
  
  // Channel where arena is hosted
  channelId: { type: String },
  messageId: { type: String }
});

// Generate a unique join code
arenaSchema.statics.generateJoinCode = function() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed confusing chars
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

// Calculate final rankings
arenaSchema.methods.getFinalRankings = function() {
  return [...this.players]
    .sort((a, b) => {
      // Sort by score first, then by total response time (faster = better)
      if (b.score !== a.score) return b.score - a.score;
      const aTime = a.responseTimes.reduce((s, t) => s + t, 0);
      const bTime = b.responseTimes.reduce((s, t) => s + t, 0);
      return aTime - bTime;
    })
    .map((player, index) => ({
      rank: index + 1,
      ...player.toObject()
    }));
};

// Calculate XP rewards for placement
arenaSchema.methods.getXpReward = function(rank) {
  const rewards = {
    1: 300,  // 1st place
    2: 200,  // 2nd place
    3: 150,  // 3rd place
  };
  return rewards[rank] || 50; // Participation XP
};

// Index for efficient lookups (joinCode already has unique:true, no need for separate index)
arenaSchema.index({ status: 1, createdAt: -1 });
arenaSchema.index({ hostId: 1 });

export const Arena = mongoose.model('Arena', arenaSchema);
