import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  discordId: {
    type: String,
    required: true,
    unique: true
  },
  username: String,
  
  level: {
    type: Number,
    default: 1
  },
  totalXp: {
    type: Number,
    default: 0
  },
  currentXp: {
    type: Number,
    default: 0
  },
  
  lessonsCompleted: {
    type: Number,
    default: 0
  },
  quizzesCompleted: {
    type: Number,
    default: 0
  },
  quizzesPassed: {
    type: Number,
    default: 0
  },
  totalQuestions: {
    type: Number,
    default: 0
  },
  correctAnswers: {
    type: Number,
    default: 0
  },
  
  currentStreak: {
    type: Number,
    default: 0
  },
  longestStreak: {
    type: Number,
    default: 0
  },
  lastActiveDate: Date,
  
  achievements: [{
    id: String,
    unlockedAt: Date
  }],
  
  activePaths: [{
    pathId: String,
    currentLesson: Number,
    startedAt: Date,
    completedLessons: [Number]
  }],
  
  preferredLevel: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    default: 'beginner'
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

userSchema.methods.xpForNextLevel = function() {
  return Math.floor(100 * Math.pow(1.5, this.level - 1));
};

userSchema.methods.addXp = async function(amount) {
  this.totalXp += amount;
  this.currentXp += amount;
  
  const xpNeeded = this.xpForNextLevel();
  
  while (this.currentXp >= xpNeeded) {
    this.currentXp -= xpNeeded;
    this.level += 1;
  }
  
  this.updatedAt = new Date();
  await this.save();
  
  return {
    newXp: this.currentXp,
    level: this.level,
    totalXp: this.totalXp
  };
};

userSchema.methods.updateStreak = async function() {
  const today = new Date().toDateString();
  const lastActive = this.lastActiveDate?.toDateString();
  
  if (lastActive === today) {
    return this.currentStreak;
  }
  
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  
  if (lastActive === yesterday.toDateString()) {
    this.currentStreak += 1;
  } else {
    this.currentStreak = 1;
  }
  
  if (this.currentStreak > this.longestStreak) {
    this.longestStreak = this.currentStreak;
  }
  
  this.lastActiveDate = new Date();
  await this.save();
  
  return this.currentStreak;
};

export const User = mongoose.model('User', userSchema);
