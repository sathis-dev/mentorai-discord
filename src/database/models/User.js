import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  discordId: { type: String, required: true, unique: true },
  username: { type: String, required: true },
  xp: { type: Number, default: 0 },
  level: { type: Number, default: 1 },
  streak: { type: Number, default: 0 },
  lastActive: { type: Date, default: Date.now },
  lastDailyBonus: { type: Date }, // Separate field for daily bonus tracking
  dailyBonusStreak: { type: Number, default: 0 }, // Separate streak for daily bonus
  timezone: { type: String, default: 'UTC' }, // User timezone for proper reset
  achievements: [{ type: String }],
  completedLessons: [{ type: String }],
  quizzesTaken: { type: Number, default: 0 },
  correctAnswers: { type: Number, default: 0 },
  totalQuestions: { type: Number, default: 0 },
  topicsStudied: [{ type: String }],
  createdAt: { type: Date, default: Date.now },
  
  // Referral System
  referralCode: { type: String, unique: true, sparse: true },
  referredBy: { type: String },
  referrals: { type: Number, default: 0 },
  referralXpEarned: { type: Number, default: 0 },
  pendingReferralRewards: { type: Number, default: 0 },
  
  // Share System
  shareCount: { type: Number, default: 0 },
  lastShareDate: { type: Date },
  
  // Weekly Challenges
  weeklyParticipations: { type: Number, default: 0 },
  weeklyWins: { type: Number, default: 0 },
  lastWeeklyDate: { type: Date },
  lastWeeklyParticipation: { type: Number, default: 0 },
  
  // Quick Quiz Stats
  quickQuizzesTaken: { type: Number, default: 0 },
  quickQuizCorrect: { type: Number, default: 0 },
  quickQuizBestStreak: { type: Number, default: 0 },
  quickQuizCurrentStreak: { type: Number, default: 0 },
  
  // Fun Facts
  funFactsViewed: { type: Number, default: 0 },
  lastFunFactDate: { type: Date },
  
  // Ban System
  banned: { type: Boolean, default: false },
  bannedAt: { type: Date },
  bannedReason: { type: String },
  bannedBy: { type: String },
  
  // Beta Access System
  hasAccess: { type: Boolean, default: false },
  accessKey: { type: String },
  accessGrantedAt: { type: Date },
  accessExpiresAt: { type: Date },
  accessType: { type: String, default: 'none' }, // none, beta, premium, lifetime

  // ============================================
  // NEW ADVANCED FEATURES
  // ============================================
  
  // Code Review & Debug Tracking
  codeReviews: { type: Number, default: 0 },
  debugSessions: { type: Number, default: 0 },
  
  // Topic Accuracy Tracking (for weak spots)
  topicAccuracy: {
    type: Map,
    of: {
      correct: { type: Number, default: 0 },
      total: { type: Number, default: 0 },
      lastAttempt: { type: Date }
    },
    default: new Map()
  },
  
  // Skill Tree System
  unlockedSkills: {
    type: Map,
    of: [String],
    default: new Map()
  },
  
  // Project System
  completedProjects: [{
    projectId: String,
    completedAt: Date,
    rating: String,
    timeSpent: Number
  }],
  currentProject: {
    projectId: String,
    currentStep: { type: Number, default: 0 },
    startedAt: Date
  },
  
  // Arena/Multiplayer Stats
  arenaStats: {
    played: { type: Number, default: 0 },
    wins: { type: Number, default: 0 },
    podiums: { type: Number, default: 0 },
    highestScore: { type: Number, default: 0 }
  },
  
  // Speedrun Stats
  speedrunStats: {
    completed: { type: Number, default: 0 },
    sRanks: { type: Number, default: 0 },
    bestTime: { type: Number, default: 0 },
    totalTime: { type: Number, default: 0 }
  },
  
  // Certificates
  certificates: [{
    certificateId: String,
    skill: String,
    level: String,
    issuedAt: Date
  }],
  
  // Engagement Preferences
  streakReminderSent: { type: Date },
  lastWeeklySummary: { type: Date },
  dmPreferences: {
    streakReminders: { type: Boolean, default: true },
    weeklySummary: { type: Boolean, default: true },
    achievementAlerts: { type: Boolean, default: true }
  },
  
  // Mentor Chat Sessions
  mentorSessions: { type: Number, default: 0 },
  mentorMinutes: { type: Number, default: 0 },
  
  // Longest streak ever (for achievements)
  longestStreak: { type: Number, default: 0 }
});

// Calculate XP needed for next level
userSchema.methods.xpForNextLevel = function() {
  return Math.floor(100 * Math.pow(1.5, this.level - 1));
};

// Add XP and handle level ups
// Note: Does NOT auto-save - caller must save to avoid double-saves
userSchema.methods.addXp = function(amount) {
  this.xp += amount;
  
  let leveledUp = false;
  let levelsGained = 0;
  while (this.xp >= this.xpForNextLevel()) {
    this.xp -= this.xpForNextLevel();
    this.level += 1;
    leveledUp = true;
    levelsGained++;
  }
  
  // Don't save here - let caller batch saves
  return { leveledUp, newLevel: this.level, levelsGained };
};

// Update streak - Fixed logic for first-time users and edge cases
userSchema.methods.updateStreak = async function() {
  const now = new Date();
  const lastActive = this.lastActive ? new Date(this.lastActive) : null;
  
  // First time user or never had activity
  if (!lastActive || this.streak === 0) {
    this.streak = 1;
    this.lastActive = now;
    // Track longest streak
    if (this.streak > (this.longestStreak || 0)) {
      this.longestStreak = this.streak;
    }
    await this.save();
    return this.streak;
  }
  
  const diffHours = (now - lastActive) / (1000 * 60 * 60);
  
  // Already active today (less than 24h) - no change needed
  if (diffHours < 24) {
    // Just update lastActive, don't increment streak
    this.lastActive = now;
    await this.save();
    return this.streak;
  }
  
  // Active within 24-48 hours - increment streak!
  if (diffHours >= 24 && diffHours < 48) {
    this.streak += 1;
  } 
  // More than 48 hours - streak broken, reset to 1
  else if (diffHours >= 48) {
    this.streak = 1;
  }
  
  // Track longest streak achievement
  if (this.streak > (this.longestStreak || 0)) {
    this.longestStreak = this.streak;
  }
  
  this.lastActive = now;
  await this.save();
  return this.streak;
};

export const User = mongoose.model('User', userSchema);
