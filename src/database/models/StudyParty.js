/**
 * StudyParty Model - Group Learning Sessions
 * 
 * Enables collaborative learning with XP bonuses
 * and group activities.
 */

import mongoose from 'mongoose';

const memberSchema = new mongoose.Schema({
  discordId: { type: String, required: true },
  username: { type: String, required: true },
  joinedAt: { type: Date, default: Date.now },
  xpContribution: { type: Number, default: 0 },
  questionsAnswered: { type: Number, default: 0 },
  correctAnswers: { type: Number, default: 0 },
  isCreator: { type: Boolean, default: false }
}, { _id: false });

const activitySchema = new mongoose.Schema({
  type: { 
    type: String, 
    enum: ['quiz', 'lesson', 'flashcards', 'discussion'],
    required: true
  },
  topic: String,
  startedAt: { type: Date, default: Date.now },
  completedAt: Date,
  participants: [String], // discordIds
  results: mongoose.Schema.Types.Mixed
}, { _id: false });

const studyPartySchema = new mongoose.Schema({
  // Unique party identifier
  partyId: { 
    type: String, 
    required: true, 
    unique: true,
    index: true
  },
  
  // Party name/topic
  name: { type: String, required: true },
  topic: { type: String, default: 'General Learning' },
  description: String,
  
  // Creator info
  creator: {
    discordId: { type: String, required: true },
    username: String
  },
  
  // Members
  members: [memberSchema],
  maxMembers: { type: Number, default: 5 },
  
  // Privacy
  privacy: { 
    type: String, 
    enum: ['public', 'private', 'invite-only'],
    default: 'public'
  },
  inviteCode: String, // For private parties
  
  // Status
  status: { 
    type: String, 
    enum: ['active', 'inactive', 'disbanded'],
    default: 'active'
  },
  
  // Settings
  settings: {
    xpMultiplier: { type: Number, default: 1.5 }, // +50% XP
    sharedGoals: { type: Boolean, default: true },
    collaborativeQuizzes: { type: Boolean, default: true },
    notifications: { type: Boolean, default: true }
  },
  
  // Current activity
  currentActivity: {
    type: activitySchema,
    default: null
  },
  
  // Activity history
  activityHistory: [activitySchema],
  
  // Party stats
  stats: {
    totalXpEarned: { type: Number, default: 0 },
    quizzesCompleted: { type: Number, default: 0 },
    lessonsCompleted: { type: Number, default: 0 },
    totalQuestions: { type: Number, default: 0 },
    totalCorrect: { type: Number, default: 0 }
  },
  
  // Achievements earned as a group
  achievements: [{
    id: String,
    name: String,
    earnedAt: Date
  }],
  
  // Timestamps
  createdAt: { type: Date, default: Date.now },
  lastActivityAt: { type: Date, default: Date.now },
  
  // Discord channel (if linked)
  linkedChannel: String
}, {
  timestamps: true
});

// Indexes
studyPartySchema.index({ status: 1, createdAt: -1 });
studyPartySchema.index({ 'members.discordId': 1 });
studyPartySchema.index({ privacy: 1, status: 1 });

// Virtuals
studyPartySchema.virtual('memberCount').get(function() {
  return this.members.length;
});

studyPartySchema.virtual('isFull').get(function() {
  return this.members.length >= this.maxMembers;
});

studyPartySchema.virtual('hasActivity').get(function() {
  return this.currentActivity !== null;
});

// Methods
studyPartySchema.methods.addMember = function(discordId, username) {
  if (this.members.some(m => m.discordId === discordId)) {
    throw new Error('Already a member');
  }
  
  if (this.isFull) {
    throw new Error('Party is full');
  }
  
  this.members.push({
    discordId,
    username,
    joinedAt: new Date(),
    xpContribution: 0,
    isCreator: false
  });
  
  this.lastActivityAt = new Date();
  return this.members[this.members.length - 1];
};

studyPartySchema.methods.removeMember = function(discordId) {
  const index = this.members.findIndex(m => m.discordId === discordId);
  if (index === -1) {
    throw new Error('Not a member');
  }
  
  const member = this.members[index];
  this.members.splice(index, 1);
  
  // If creator left, assign new creator or disband
  if (member.isCreator) {
    if (this.members.length > 0) {
      this.members[0].isCreator = true;
      this.creator = {
        discordId: this.members[0].discordId,
        username: this.members[0].username
      };
    } else {
      this.status = 'disbanded';
    }
  }
  
  this.lastActivityAt = new Date();
  return true;
};

studyPartySchema.methods.getMember = function(discordId) {
  return this.members.find(m => m.discordId === discordId);
};

studyPartySchema.methods.isMember = function(discordId) {
  return this.members.some(m => m.discordId === discordId);
};

studyPartySchema.methods.startActivity = function(type, topic) {
  if (this.currentActivity) {
    throw new Error('An activity is already in progress');
  }
  
  this.currentActivity = {
    type,
    topic,
    startedAt: new Date(),
    participants: this.members.map(m => m.discordId),
    results: {}
  };
  
  this.lastActivityAt = new Date();
  return this.currentActivity;
};

studyPartySchema.methods.endActivity = function(results = {}) {
  if (!this.currentActivity) {
    throw new Error('No active activity');
  }
  
  this.currentActivity.completedAt = new Date();
  this.currentActivity.results = results;
  
  // Add to history
  this.activityHistory.push(this.currentActivity);
  
  // Update stats
  if (this.currentActivity.type === 'quiz') {
    this.stats.quizzesCompleted++;
  } else if (this.currentActivity.type === 'lesson') {
    this.stats.lessonsCompleted++;
  }
  
  const completed = this.currentActivity;
  this.currentActivity = null;
  this.lastActivityAt = new Date();
  
  return completed;
};

studyPartySchema.methods.addXpContribution = function(discordId, xp) {
  const member = this.getMember(discordId);
  if (!member) {
    throw new Error('Not a member');
  }
  
  member.xpContribution += xp;
  this.stats.totalXpEarned += xp;
  this.lastActivityAt = new Date();
  
  return member.xpContribution;
};

studyPartySchema.methods.generateInviteCode = function() {
  this.inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();
  return this.inviteCode;
};

studyPartySchema.methods.getLeaderboard = function() {
  return [...this.members]
    .sort((a, b) => b.xpContribution - a.xpContribution)
    .map((member, index) => ({
      position: index + 1,
      discordId: member.discordId,
      username: member.username,
      xpContribution: member.xpContribution,
      accuracy: member.questionsAnswered > 0 
        ? Math.round((member.correctAnswers / member.questionsAnswered) * 100)
        : 0
    }));
};

// Statics
studyPartySchema.statics.findByMember = function(discordId) {
  return this.findOne({
    status: 'active',
    'members.discordId': discordId
  });
};

studyPartySchema.statics.findPublicParties = function(limit = 10) {
  return this.find({
    status: 'active',
    privacy: 'public',
    $expr: { $lt: [{ $size: '$members' }, '$maxMembers'] }
  })
    .sort({ lastActivityAt: -1 })
    .limit(limit);
};

studyPartySchema.statics.findByInviteCode = function(code) {
  return this.findOne({
    status: 'active',
    inviteCode: code.toUpperCase()
  });
};

export const StudyParty = mongoose.model('StudyParty', studyPartySchema);
export default StudyParty;
