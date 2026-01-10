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
  longestStreak: { type: Number, default: 0 },

  // ============================================
  // ULTIMATE UPGRADE FEATURES V2
  // ============================================

  // Prestige System
  prestige: {
    level: { type: Number, default: 0 },
    totalXpEarned: { type: Number, default: 0 },
    bonusMultiplier: { type: Number, default: 1.0 },
    prestigeHistory: [{
      level: Number,
      xpAtPrestige: Number,
      date: { type: Date, default: Date.now }
    }]
  },

  // Custom Theme System
  theme: { type: String, default: 'default' },
  unlockedThemes: [{ type: String }],

  // Interview Prep Stats
  interviewStats: {
    totalSessions: { type: Number, default: 0 },
    averageScore: { type: Number, default: 0 },
    categoryScores: {
      type: Map,
      of: {
        sessions: { type: Number, default: 0 },
        averageScore: { type: Number, default: 0 }
      },
      default: new Map()
    },
    companiesPracticed: [{ type: String }],
    readinessScore: { type: Number, default: 0 }
  },

  // Flashcard/SRS Stats
  flashcardStats: {
    totalCards: { type: Number, default: 0 },
    cardsReviewed: { type: Number, default: 0 },
    accuracy: { type: Number, default: 0 },
    streakDays: { type: Number, default: 0 },
    lastReviewDate: { type: Date }
  },

  // Tournament Stats
  tournamentStats: {
    participated: { type: Number, default: 0 },
    wins: { type: Number, default: 0 },
    topThreeFinishes: { type: Number, default: 0 },
    totalPrizeXp: { type: Number, default: 0 }
  },

  // Daily Challenge Stats
  dailyChallengeStats: {
    completed: { type: Number, default: 0 },
    currentStreak: { type: Number, default: 0 },
    longestStreak: { type: Number, default: 0 },
    lastCompletedDate: { type: Date },
    averageTime: { type: Number, default: 0 }
  },

  // Team Battle Stats
  teamBattleStats: {
    participated: { type: Number, default: 0 },
    wins: { type: Number, default: 0 },
    xpContributed: { type: Number, default: 0 }
  },

  // Seasonal Event Stats
  eventStats: {
    eventsParticipated: { type: Number, default: 0 },
    exclusiveRewards: [{ type: String }],
    totalEventPoints: { type: Number, default: 0 }
  },

  // Skill Radar Data (for visualization)
  skillRadar: {
    type: Map,
    of: { type: Number, default: 0 },
    default: new Map()
  },

  // Activity Heatmap Data (last 365 days)
  activityLog: [{
    date: { type: Date },
    activities: { type: Number, default: 0 },
    xpEarned: { type: Number, default: 0 }
  }],

  // Trading Card Collection
  tradingCards: [{
    cardId: String,
    style: String,
    rarity: String,
    earnedAt: { type: Date, default: Date.now }
  }]
});

// Calculate XP needed for next level
userSchema.methods.xpForNextLevel = function() {
  return Math.floor(100 * Math.pow(1.5, this.level - 1));
};

// Add XP and handle level ups
// Note: Does NOT auto-save - caller must save to avoid double-saves
// FIXED: Now atomically tracks prestige.totalXpEarned
userSchema.methods.addXp = function(amount) {
  this.xp += amount;
  
  // Initialize prestige object if needed
  if (!this.prestige) {
    this.prestige = {
      level: 0,
      totalXpEarned: 0,
      bonusMultiplier: 1.0,
      prestigeHistory: []
    };
  }
  
  // Track lifetime XP earned (critical for prestige system)
  this.prestige.totalXpEarned = (this.prestige.totalXpEarned || 0) + amount;
  
  let leveledUp = false;
  let levelsGained = 0;
  while (this.xp >= this.xpForNextLevel()) {
    this.xp -= this.xpForNextLevel();
    this.level += 1;
    leveledUp = true;
    levelsGained++;
  }
  
  // Don't save here - let caller batch saves
  return { leveledUp, newLevel: this.level, levelsGained, xpAdded: amount };
};

// Update streak - Uses UTC midnight boundaries for consistency
// FIXED: Unified streak system with /daily command
userSchema.methods.updateStreak = async function() {
  const now = new Date();
  const lastActive = this.lastActive ? new Date(this.lastActive) : null;
  
  // Get today's midnight UTC
  const todayMidnight = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const yesterdayMidnight = new Date(todayMidnight.getTime() - 24 * 60 * 60 * 1000);
  const twoDaysAgoMidnight = new Date(todayMidnight.getTime() - 48 * 60 * 60 * 1000);
  
  // First time user or never had activity
  if (!lastActive || this.streak === 0) {
    this.streak = 1;
    this.lastActive = now;
    if (this.streak > (this.longestStreak || 0)) {
      this.longestStreak = this.streak;
    }
    await this.save();
    return this.streak;
  }
  
  // Already active today (after midnight UTC) - no change needed
  if (lastActive >= todayMidnight) {
    this.lastActive = now;
    await this.save();
    return this.streak;
  }
  
  // Active yesterday (between yesterday midnight and today midnight) - increment streak!
  if (lastActive >= yesterdayMidnight) {
    this.streak += 1;
  }
  // Active 2 days ago - streak broken but grace period
  else if (lastActive >= twoDaysAgoMidnight) {
    this.streak = 1;
  }
  // More than 2 days ago - streak fully reset
  else {
    this.streak = 1;
  }
  
  // Track longest streak achievement
  if (this.streak > (this.longestStreak || 0)) {
    this.longestStreak = this.streak;
  }
  
  // Sync with dailyBonusStreak for unified system
  this.dailyBonusStreak = this.streak;
  this.lastActive = now;
  await this.save();
  return this.streak;
};

// ═══════════════════════════════════════════════════════════════════════════════
// STATIC METHODS - Atomic Operations for Concurrency Safety
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * XP formula - Single source of truth
 * @param {number} level - Current level
 * @returns {number} XP needed to complete this level
 */
userSchema.statics.xpForLevel = function(level) {
  return Math.floor(100 * Math.pow(1.5, level - 1));
};

/**
 * Atomic XP addition with level-up handling
 * Uses MongoDB $inc to prevent race conditions
 * @param {string} discordId - User's Discord ID
 * @param {number} amount - XP to add
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} Result with user and level info
 */
userSchema.statics.addXpAtomic = async function(discordId, amount, options = {}) {
  const { reason = 'unknown', skipMultipliers = false } = options;
  
  // First, atomically increment XP and totalXpEarned
  const user = await this.findOneAndUpdate(
    { discordId: String(discordId) },
    {
      $inc: {
        xp: amount,
        'prestige.totalXpEarned': amount
      },
      $set: { lastActive: new Date() }
    },
    { new: true }
  );
  
  if (!user) return null;
  
  // Check for level-ups
  let leveledUp = false;
  let levelsGained = 0;
  let currentXp = user.xp;
  let currentLevel = user.level;
  
  while (currentXp >= this.xpForLevel(currentLevel)) {
    currentXp -= this.xpForLevel(currentLevel);
    currentLevel++;
    leveledUp = true;
    levelsGained++;
  }
  
  // Apply level-up changes atomically if needed
  if (leveledUp) {
    await this.findOneAndUpdate(
      { discordId: String(discordId) },
      { $set: { level: currentLevel, xp: currentXp } }
    );
  }
  
  console.log(`💫 ${user.username} +${amount} XP (${reason}) → Level ${currentLevel}`);
  
  return {
    user,
    leveledUp,
    newLevel: currentLevel,
    levelsGained,
    xpAwarded: amount,
    currentXp
  };
};

/**
 * Estimate lifetime XP for migration purposes
 * @param {Object} user - User document
 * @returns {number} Estimated lifetime XP
 */
userSchema.statics.estimateLifetimeXp = function(user) {
  let total = user.xp || 0;
  for (let lvl = 1; lvl < (user.level || 1); lvl++) {
    total += this.xpForLevel(lvl);
  }
  return total;
};

/**
 * Migrate a single user's prestige.totalXpEarned
 * @param {string} discordId - User's Discord ID
 * @returns {Promise<Object>} Migration result
 */
userSchema.statics.migrateUserLifetimeXp = async function(discordId) {
  const user = await this.findOne({ discordId: String(discordId) });
  if (!user) return null;
  
  const currentTotal = user.prestige?.totalXpEarned || 0;
  const estimatedTotal = this.estimateLifetimeXp(user);
  
  // Only update if current is less than estimated (don't lose data)
  if (currentTotal < estimatedTotal) {
    await this.findOneAndUpdate(
      { discordId: String(discordId) },
      { $set: { 'prestige.totalXpEarned': estimatedTotal } }
    );
    return { discordId, before: currentTotal, after: estimatedTotal, migrated: true };
  }
  
  return { discordId, before: currentTotal, after: currentTotal, migrated: false };
};

/**
 * Batch migrate all users' lifetime XP
 * @returns {Promise<Object>} Migration statistics
 */
userSchema.statics.migrateAllLifetimeXp = async function() {
  const users = await this.find({});
  let migrated = 0;
  let skipped = 0;
  
  for (const user of users) {
    const result = await this.migrateUserLifetimeXp(user.discordId);
    if (result?.migrated) migrated++;
    else skipped++;
  }
  
  console.log(`📊 Migration complete: ${migrated} migrated, ${skipped} skipped`);
  return { migrated, skipped, total: users.length };
};

/**
 * Sync streak fields (unify dailyBonusStreak and streak)
 * @param {string} discordId - User's Discord ID
 * @returns {Promise<number>} Unified streak value
 */
userSchema.statics.syncStreaks = async function(discordId) {
  const user = await this.findOne({ discordId: String(discordId) });
  if (!user) return 0;
  
  // Take the higher value as the source of truth
  const unifiedStreak = Math.max(user.streak || 0, user.dailyBonusStreak || 0);
  
  await this.findOneAndUpdate(
    { discordId: String(discordId) },
    { $set: { streak: unifiedStreak, dailyBonusStreak: unifiedStreak } }
  );
  
  return unifiedStreak;
};

export const User = mongoose.model('User', userSchema);
