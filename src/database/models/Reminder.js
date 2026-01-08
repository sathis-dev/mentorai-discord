import mongoose from 'mongoose';

const reminderSchema = new mongoose.Schema({
  discordId: { type: String, required: true, index: true },
  guildId: String,
  channelId: String,
  type: { 
    type: String, 
    enum: ['daily', 'streak', 'custom', 'challenge', 'tournament'],
    default: 'daily'
  },
  time: { type: String, required: true }, // HH:mm format
  timezone: { type: String, default: 'UTC' },
  days: [{ type: Number }], // 0-6 for Sunday-Saturday
  message: String,
  enabled: { type: Boolean, default: true },
  lastSent: Date,
  createdAt: { type: Date, default: Date.now }
});

const Reminder = mongoose.model('Reminder', reminderSchema);
export default Reminder;
