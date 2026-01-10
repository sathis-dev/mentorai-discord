/**
 * Data Integrity Pass - Production Sanitization
 * 
 * Ensures all users have type-safe prestige objects and
 * synchronized lifetime XP values.
 */

import { User } from '../database/models/User.js';

/**
 * Run data integrity check and backfill on startup
 * Called automatically when database connects
 */
export async function runDataIntegrityPass() {
  console.log('🔍 Running data integrity pass...');
  
  try {
    const results = {
      usersChecked: 0,
      prestigeBackfilled: 0,
      xpSynchronized: 0,
      errors: 0
    };

    // Find users missing prestige object or with desync
    const usersToFix = await User.find({
      $or: [
        { prestige: { $exists: false } },
        { 'prestige.totalXpEarned': { $exists: false } },
        { 'prestige.level': { $exists: false } }
      ]
    }).limit(1000);

    results.usersChecked = usersToFix.length;

    for (const user of usersToFix) {
      try {
        // Ensure prestige object exists with proper structure
        const currentXP = user.xp || 0;
        const currentLevel = user.level || 1;
        
        // Calculate estimated lifetime XP from level if not tracked
        const estimatedLifetimeXP = calculateLifetimeXPFromLevel(currentLevel) + currentXP;
        
        await User.updateOne(
          { _id: user._id },
          {
            $set: {
              'prestige.level': user.prestige?.level || 0,
              'prestige.totalXpEarned': user.prestige?.totalXpEarned || estimatedLifetimeXP,
              'prestige.bonusMultiplier': user.prestige?.bonusMultiplier || 1.0,
              'prestige.lastPrestigeAt': user.prestige?.lastPrestigeAt || null
            }
          }
        );
        
        results.prestigeBackfilled++;
      } catch (err) {
        results.errors++;
      }
    }

    // Sync any users where totalXpEarned < current xp (data corruption)
    // Use aggregation pipeline with $expr for field comparison
    const desyncedUsers = await User.aggregate([
      {
        $match: {
          $expr: {
            $lt: [{ $ifNull: ['$prestige.totalXpEarned', 0] }, { $ifNull: ['$xp', 0] }]
          }
        }
      },
      { $limit: 500 }
    ]);

    for (const user of desyncedUsers) {
      try {
        const correctTotal = Math.max(user.prestige?.totalXpEarned || 0, user.xp || 0);
        await User.updateOne(
          { _id: user._id },
          { $set: { 'prestige.totalXpEarned': correctTotal } }
        );
        results.xpSynchronized++;
      } catch (err) {
        results.errors++;
      }
    }

    console.log(`✅ Data integrity pass complete:
   • Users checked: ${results.usersChecked}
   • Prestige backfilled: ${results.prestigeBackfilled}
   • XP synchronized: ${results.xpSynchronized}
   • Errors: ${results.errors}`);

    return results;
  } catch (error) {
    console.error('❌ Data integrity pass failed:', error.message);
    return null;
  }
}

/**
 * Calculate estimated lifetime XP from level
 * Based on the unified xpForLevel formula
 */
function calculateLifetimeXPFromLevel(level) {
  let total = 0;
  for (let l = 1; l < level; l++) {
    total += Math.floor(100 * Math.pow(1.5, l - 1));
  }
  return total;
}

/**
 * Sanitize console output - strip sensitive data
 * Called for production logging
 */
export function sanitizeLogOutput(message) {
  if (typeof message !== 'string') {
    message = String(message);
  }
  
  // Strip potential API keys and tokens
  const patterns = [
    /sk-[a-zA-Z0-9]{32,}/g,           // OpenAI keys
    /[A-Za-z0-9_-]{24}\.[A-Za-z0-9_-]{6}\.[A-Za-z0-9_-]{27}/g, // Discord tokens
    /mongodb(\+srv)?:\/\/[^\s]+/g,    // MongoDB URLs
    /Bearer [A-Za-z0-9_-]+/g,         // Bearer tokens
    /api[_-]?key[=:]\s*['"]?[^\s'"]+/gi, // Generic API keys
  ];
  
  let sanitized = message;
  for (const pattern of patterns) {
    sanitized = sanitized.replace(pattern, '[REDACTED]');
  }
  
  return sanitized;
}

/**
 * Production-safe logger wrapper
 */
export const safeLog = {
  info: (...args) => console.log(...args.map(a => sanitizeLogOutput(a))),
  warn: (...args) => console.warn(...args.map(a => sanitizeLogOutput(a))),
  error: (...args) => console.error(...args.map(a => sanitizeLogOutput(a))),
  debug: (...args) => {
    if (process.env.NODE_ENV !== 'production') {
      console.log('[DEBUG]', ...args.map(a => sanitizeLogOutput(a)));
    }
  }
};

export default { runDataIntegrityPass, sanitizeLogOutput, safeLog };
