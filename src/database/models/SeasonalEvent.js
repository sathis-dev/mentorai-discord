import mongoose from 'mongoose';

const seasonalEventSchema = new mongoose.Schema({
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  description: String,
  theme: {
    emoji: String,
    color: Number,
    bannerUrl: String
  },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  isActive: { type: Boolean, default: false },
  
  challenges: [{
    id: String,
    name: String,
    description: String,
    type: { type: String, enum: ['quiz', 'streak', 'xp', 'lessons', 'special'] },
    requirement: Number,
    reward: {
      xp: Number,
      badge: String,
      title: String,
      cosmetic: String
    }
  }],
  
  leaderboard: [{
    discordId: String,
    username: String,
    points: Number,
    challengesCompleted: [String]
  }],
  
  globalProgress: {
    target: Number,
    current: { type: Number, default: 0 }
  },
  
  exclusiveRewards: [{
    name: String,
    type: { type: String, enum: ['badge', 'title', 'theme', 'card_style'] },
    requirement: String,
    icon: String
  }],
  
  createdAt: { type: Date, default: Date.now }
});

const SeasonalEvent = mongoose.model('SeasonalEvent', seasonalEventSchema);
export default SeasonalEvent;
