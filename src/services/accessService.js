import { AccessKey } from '../database/models/AccessKey.js';
import { User } from '../database/models/User.js';

// Bot Owner IDs - These users ALWAYS have access
export const BOT_OWNER_IDS = process.env.BOT_OWNER_IDS 
  ? process.env.BOT_OWNER_IDS.split(',').map(id => id.trim())
  : [
    '1116096965755813968', // sathis.dev - Primary Owner
  ];

// Beta mode - Set to false to disable access key requirement
export const BETA_MODE = process.env.BETA_MODE !== 'false';

/**
 * Check if a user has access to the bot
 * Returns: { hasAccess: boolean, reason: string, user: User }
 */
export async function checkUserAccess(userId, username) {
  // Owners always have access
  if (BOT_OWNER_IDS.includes(userId)) {
    return { 
      hasAccess: true, 
      reason: 'owner',
      isOwner: true
    };
  }
  
  // If beta mode is disabled, everyone has access
  if (!BETA_MODE) {
    return { 
      hasAccess: true, 
      reason: 'public',
      isOwner: false
    };
  }
  
  // Check user's access status
  let user = await User.findOne({ discordId: userId });
  
  // New user - no access yet
  if (!user) {
    return { 
      hasAccess: false, 
      reason: 'no_key',
      isOwner: false,
      user: null
    };
  }
  
  // Check if user has access
  if (user.hasAccess) {
    // Check if access has expired
    if (user.accessExpiresAt && new Date() > user.accessExpiresAt) {
      user.hasAccess = false;
      user.accessType = 'expired';
      await user.save();
      
      return { 
        hasAccess: false, 
        reason: 'expired',
        isOwner: false,
        user
      };
    }
    
    return { 
      hasAccess: true, 
      reason: 'activated',
      isOwner: false,
      user
    };
  }
  
  return { 
    hasAccess: false, 
    reason: 'no_key',
    isOwner: false,
    user
  };
}

/**
 * Activate an access key for a user
 */
export async function activateAccessKey(keyString, userId, username) {
  // Validate the key
  const result = await AccessKey.activateKey(keyString, userId, username);
  
  if (!result.success) {
    return result;
  }
  
  // Grant access to user
  let user = await User.findOne({ discordId: userId });
  
  if (!user) {
    user = new User({
      discordId: userId,
      username: username
    });
  }
  
  // Calculate expiration based on key type
  let expiresAt = null;
  if (result.key.keyType === 'trial' && result.key.trialDays) {
    expiresAt = new Date(Date.now() + result.key.trialDays * 24 * 60 * 60 * 1000);
  } else if (result.key.expiresAt) {
    expiresAt = result.key.expiresAt;
  }
  
  user.hasAccess = true;
  user.accessKey = result.key.key;
  user.accessGrantedAt = new Date();
  user.accessExpiresAt = expiresAt;
  user.accessType = result.key.keyType;
  
  await user.save();
  
  return {
    success: true,
    message: 'Access granted!',
    user,
    key: result.key,
    expiresAt
  };
}

/**
 * Revoke access from a user (admin function)
 */
export async function revokeUserAccess(userId, revokedBy, reason = 'Access revoked by admin') {
  const user = await User.findOne({ discordId: userId });
  
  if (!user) {
    return { success: false, error: 'User not found' };
  }
  
  // Also revoke the key if it exists
  if (user.accessKey) {
    await AccessKey.revokeKey(user.accessKey, revokedBy, reason);
  }
  
  user.hasAccess = false;
  user.accessType = 'revoked';
  await user.save();
  
  return { success: true, user };
}

/**
 * Generate new access keys (admin function)
 */
export async function generateAccessKeys(createdBy, count = 1, options = {}) {
  const keys = [];
  
  for (let i = 0; i < count; i++) {
    const key = await AccessKey.createKey(createdBy, options);
    keys.push(key);
  }
  
  return keys;
}

/**
 * Get all access keys with stats
 */
export async function getAccessKeyStats() {
  const stats = await AccessKey.getStats();
  const keys = await AccessKey.getAllKeys();
  
  return { stats, keys };
}

/**
 * Get users with beta access
 */
export async function getBetaUsers() {
  return await User.find({ hasAccess: true })
    .select('discordId username accessKey accessGrantedAt accessExpiresAt accessType')
    .sort({ accessGrantedAt: -1 })
    .lean();
}
