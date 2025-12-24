import mongoose from 'mongoose';

const progressSchema = new mongoose.Schema({
  discordId: {
    type: String,
    required: true
  },
  guildId: String,
  
  subject: String,
  topic: String,
  
  lessonsViewed: [String],
  lessonsCompleted: [String],
  
  quizResults: [{
    quizId: String,
    score: Number,
    totalQuestions: Number,
    completedAt: Date,
    timeSpent: Number
  }],
  
  bookmarks: [{
    lessonId: String,
    note: String,
    createdAt: Date
  }],
  
  totalTimeSpent: {
    type: Number,
    default: 0
  },
  
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

progressSchema.index({ discordId: 1, subject: 1, topic: 1 });

export const Progress = mongoose.model('Progress', progressSchema);
