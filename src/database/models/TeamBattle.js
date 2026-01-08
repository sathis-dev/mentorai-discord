import mongoose from 'mongoose';

const teamBattleSchema = new mongoose.Schema({
  team1: {
    guildId: String,
    guildName: String,
    members: [{
      discordId: String,
      username: String,
      score: { type: Number, default: 0 },
      questionsAnswered: { type: Number, default: 0 }
    }],
    totalScore: { type: Number, default: 0 }
  },
  team2: {
    guildId: String,
    guildName: String,
    members: [{
      discordId: String,
      username: String,
      score: { type: Number, default: 0 },
      questionsAnswered: { type: Number, default: 0 }
    }],
    totalScore: { type: Number, default: 0 }
  },
  topic: String,
  difficulty: String,
  status: { 
    type: String, 
    enum: ['pending', 'active', 'completed'], 
    default: 'pending' 
  },
  settings: {
    maxMembersPerTeam: { type: Number, default: 5 },
    questionsPerMember: { type: Number, default: 10 },
    duration: { type: Number, default: 24 }, // hours
    startTime: Date,
    endTime: Date
  },
  winner: String, // guildId
  prizes: {
    xpBonus: Number,
    badge: String
  },
  createdAt: { type: Date, default: Date.now }
});

const TeamBattle = mongoose.model('TeamBattle', teamBattleSchema);
export default TeamBattle;
