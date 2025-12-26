import mongoose from 'mongoose';
import crypto from 'crypto';

const accessKeySchema = new mongoose.Schema({
  // Key format: MENTOR-XXXX-XXXX-XXXX
  key: { 
    type: String, 
    required: true, 
    unique: true,
    uppercase: true
  },
  
  // Key metadata
  createdAt: { type: Date, default: Date.now },
  createdBy: { type: String, required: true }, // Admin Discord ID
  note: { type: String }, // Admin note (e.g., "For John's testing")
  
  // Activation status
  status: { 
    type: String, 
    enum: ['active', 'used', 'revoked', 'expired'],
    default: 'active'
  },
  
  // When activated by a user
  activatedBy: { type: String }, // Discord ID
  activatedByUsername: { type: String },
  activatedAt: { type: Date },
  
  // Expiration (optional)
  expiresAt: { type: Date },
  
  // Revocation
  revoked: { type: Boolean, default: false },
  revokedAt: { type: Date },
  revokedBy: { type: String },
  revokedReason: { type: String },
  
  // Usage limits (optional for future)
  maxUses: { type: Number, default: 1 },
  currentUses: { type: Number, default: 0 },
  
  // Key type for future expansion
  keyType: {
    type: String,
    enum: ['beta', 'premium', 'lifetime', 'trial'],
    default: 'beta'
  },
  
  // Trial duration in days (for trial keys)
  trialDays: { type: Number, default: 30 }
});

// Generate a unique key
accessKeySchema.statics.generateKey = function() {
  const segments = [];
  for (let i = 0; i < 3; i++) {
    segments.push(crypto.randomBytes(2).toString('hex').toUpperCase());
  }
  return `MENTOR-${segments.join('-')}`;
};

// Create a new access key
accessKeySchema.statics.createKey = async function(createdBy, options = {}) {
  const key = this.generateKey();
  
  const accessKey = new this({
    key,
    createdBy,
    note: options.note || null,
    keyType: options.keyType || 'beta',
    expiresAt: options.expiresAt || null,
    maxUses: options.maxUses || 1,
    trialDays: options.trialDays || 30
  });
  
  await accessKey.save();
  return accessKey;
};

// Validate and activate a key for a user
accessKeySchema.statics.activateKey = async function(keyString, userId, username) {
  const key = await this.findOne({ 
    key: keyString.toUpperCase().trim() 
  });
  
  if (!key) {
    return { success: false, error: 'INVALID_KEY', message: 'This access key is invalid.' };
  }
  
  if (key.status === 'used') {
    return { success: false, error: 'ALREADY_USED', message: 'This key has already been activated by another user.' };
  }
  
  if (key.status === 'revoked') {
    return { success: false, error: 'REVOKED', message: 'This key has been revoked by an administrator.' };
  }
  
  if (key.status === 'expired' || (key.expiresAt && new Date() > key.expiresAt)) {
    key.status = 'expired';
    await key.save();
    return { success: false, error: 'EXPIRED', message: 'This key has expired.' };
  }
  
  // Activate the key
  key.status = 'used';
  key.activatedBy = userId;
  key.activatedByUsername = username;
  key.activatedAt = new Date();
  key.currentUses += 1;
  
  await key.save();
  
  return { 
    success: true, 
    key: key,
    message: 'Access key activated successfully!'
  };
};

// Revoke a key
accessKeySchema.statics.revokeKey = async function(keyString, revokedBy, reason = 'No reason provided') {
  const key = await this.findOne({ key: keyString.toUpperCase() });
  
  if (!key) {
    return { success: false, error: 'Key not found' };
  }
  
  key.status = 'revoked';
  key.revoked = true;
  key.revokedAt = new Date();
  key.revokedBy = revokedBy;
  key.revokedReason = reason;
  
  await key.save();
  
  return { success: true, key };
};

// Get all keys with optional filters
accessKeySchema.statics.getAllKeys = async function(filter = {}) {
  return await this.find(filter).sort({ createdAt: -1 }).lean();
};

// Get key stats
accessKeySchema.statics.getStats = async function() {
  const total = await this.countDocuments();
  const active = await this.countDocuments({ status: 'active' });
  const used = await this.countDocuments({ status: 'used' });
  const revoked = await this.countDocuments({ status: 'revoked' });
  const expired = await this.countDocuments({ status: 'expired' });
  
  return { total, active, used, revoked, expired };
};

export const AccessKey = mongoose.model('AccessKey', accessKeySchema);
