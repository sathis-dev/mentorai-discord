import mongoose from 'mongoose';

const challengeSchema = new mongoose.Schema({
  guildId: { type: String, required: true },
  channelId: { type: String, required: true },
  name: { type: String, required: true },
  description: String,
  subject: { type: String, required: true },
  difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' },
  
  type: { type: String, enum: ['quiz', 'project', 'speedrun', 'collaborative'], default: 'quiz' },
  
  teams: [{
    name: String,
    members: [String],
    score: { type: Number, default: 0 },
    progress: { type: Number, default: 0 },
    completedTasks: [String]
  }],
  
  status: { type: String, enum: ['waiting', 'active', 'completed'], default: 'waiting' },
  
  startTime: Date,
  endTime: Date,
  duration: { type: Number, default: 30 },
  
  questions: [{
    question: String,
    options: [String],
    correctIndex: Number,
    points: { type: Number, default: 10 }
  }],
  
  winner: {
    teamName: String,
    members: [String],
    finalScore: Number
  },
  
  xpReward: { type: Number, default: 200 },
  achievementReward: String,
  
  createdBy: String,
  createdAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

challengeSchema.index({ guildId: 1, status: 1 });
challengeSchema.index({ createdAt: -1 });

challengeSchema.methods.addTeam = function(teamName, members) {
  if (this.teams.length >= 4) {
    return { success: false, message: 'Maximum 4 teams allowed' };
  }
  
  this.teams.push({
    name: teamName,
    members: members,
    score: 0,
    progress: 0,
    completedTasks: []
  });
  
  return { success: true, teamIndex: this.teams.length - 1 };
};

challengeSchema.methods.updateTeamScore = function(teamIndex, points) {
  if (teamIndex >= this.teams.length) return false;
  
  this.teams[teamIndex].score += points;
  return true;
};

challengeSchema.methods.completeChallenge = function() {
  this.status = 'completed';
  this.endTime = new Date();
  
  const sortedTeams = this.teams.sort((a, b) => b.score - a.score);
  if (sortedTeams.length > 0) {
    this.winner = {
      teamName: sortedTeams[0].name,
      members: sortedTeams[0].members,
      finalScore: sortedTeams[0].score
    };
  }
};

export const TeamChallenge = mongoose.model('TeamChallenge', challengeSchema);
export default TeamChallenge;
