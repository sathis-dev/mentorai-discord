import mongoose from 'mongoose';

const activitySchema = new mongoose.Schema({
  discordId: { type: String, required: true, index: true },
  guildId: String,
  type: { 
    type: String, 
    enum: ['lesson', 'quiz', 'challenge', 'daily', 'streak', 'tournament', 'arena', 'flashcard'],
    required: true 
  },
  topic: String,
  xpEarned: { type: Number, default: 0 },
  details: mongoose.Schema.Types.Mixed,
  timestamp: { type: Date, default: Date.now, index: true }
});

// Index for efficient querying
activitySchema.index({ discordId: 1, timestamp: -1 });
activitySchema.index({ discordId: 1, type: 1, timestamp: -1 });

const Activity = mongoose.model('Activity', activitySchema);
export default Activity;
