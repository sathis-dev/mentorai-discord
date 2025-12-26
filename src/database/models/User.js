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
});

// Calculate XP needed for next level
userSchema.methods.xpForNextLevel = function() {
  return Math.floor(100 * Math.pow(1.5, this.level - 1));
};

// Add XP and handle level ups
userSchema.methods.addXp = async function(amount) {
  this.xp += amount;
  
  let leveledUp = false;
  while (this.xp >= this.xpForNextLevel()) {
    this.xp -= this.xpForNextLevel();
    this.level += 1;
    leveledUp = true;
  }
  
  await this.save();
  return { leveledUp, newLevel: this.level };
};

// Update streak
userSchema.methods.updateStreak = async function() {
  const now = new Date();
  const lastActive = new Date(this.lastActive);
  const diffHours = (now - lastActive) / (1000 * 60 * 60);
  
  if (diffHours >= 24 && diffHours < 48) {
    this.streak += 1;
  } else if (diffHours >= 48) {
    this.streak = 1;
  }
  
  this.lastActive = now;
  await this.save();
  return this.streak;
};

export const User = mongoose.model('User', userSchema);
