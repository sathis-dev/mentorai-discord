import mongoose from 'mongoose';

const matchSchema = new mongoose.Schema({
  round: Number,
  matchNumber: Number,
  player1: { discordId: String, username: String, score: Number },
  player2: { discordId: String, username: String, score: Number },
  winner: String,
  status: { type: String, enum: ['pending', 'active', 'completed'], default: 'pending' },
  topic: String,
  completedAt: Date
});

const tournamentSchema = new mongoose.Schema({
  name: String,
  type: { type: String, enum: ['weekly', 'special', 'seasonal'], default: 'weekly' },
  topic: String,
  difficulty: { type: String, default: 'medium' },
  status: { type: String, enum: ['registration', 'active', 'completed'], default: 'registration' },
  
  participants: [{
    discordId: String,
    username: String,
    registeredAt: { type: Date, default: Date.now },
    seed: Number
  }],
  
  bracket: [matchSchema],
  
  prizes: {
    first: { xp: Number, badge: String },
    second: { xp: Number, badge: String },
    third: { xp: Number, badge: String }
  },
  
  settings: {
    maxParticipants: { type: Number, default: 32 },
    questionsPerMatch: { type: Number, default: 5 },
    registrationEnd: Date,
    startTime: Date
  },
  
  results: {
    champion: { discordId: String, username: String },
    runnerUp: { discordId: String, username: String },
    thirdPlace: { discordId: String, username: String }
  },
  
  guildId: String,
  channelId: String,
  createdAt: { type: Date, default: Date.now }
});

const Tournament = mongoose.model('Tournament', tournamentSchema);
export default Tournament;
