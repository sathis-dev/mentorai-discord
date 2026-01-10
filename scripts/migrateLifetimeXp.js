/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║   Migration Script: Backfill prestige.totalXpEarned                          ║
 * ║   Foundation Engine Overhaul v2.0                                            ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 * 
 * This script estimates and backfills prestige.totalXpEarned for existing users
 * based on their current level and within-level XP.
 * 
 * Formula: totalXpEarned = sum of xpForLevel(1..level-1) + current xp
 * Where: xpForLevel(lvl) = Math.floor(100 * Math.pow(1.5, lvl - 1))
 * 
 * Usage: node scripts/migrateLifetimeXp.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// XP formula - single source of truth
function xpForLevel(level) {
  return Math.floor(100 * Math.pow(1.5, level - 1));
}

// Estimate lifetime XP based on current level and XP
function estimateLifetimeXp(user) {
  let total = user.xp || 0;  // Current within-level XP
  for (let lvl = 1; lvl < (user.level || 1); lvl++) {
    total += xpForLevel(lvl);
  }
  return total;
}

async function runMigration() {
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║   MentorAI Lifetime XP Migration Script                      ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');
  console.log('');

  // Connect to MongoDB
  const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!mongoUri) {
    console.error('❌ MONGODB_URI not found in environment variables');
    process.exit(1);
  }

  try {
    console.log('📡 Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');
    console.log('');

    // Get User model
    const userSchema = new mongoose.Schema({}, { strict: false });
    const User = mongoose.models.User || mongoose.model('User', userSchema);

    // Fetch all users
    console.log('📊 Fetching all users...');
    const users = await User.find({}).lean();
    console.log(`   Found ${users.length} users`);
    console.log('');

    // Migration stats
    let migrated = 0;
    let skipped = 0;
    let errors = 0;

    console.log('🔄 Starting migration...');
    console.log('─'.repeat(60));

    for (const user of users) {
      try {
        const currentTotal = user.prestige?.totalXpEarned || 0;
        const estimatedTotal = estimateLifetimeXp(user);

        // Only update if current is less than estimated (don't lose data)
        if (currentTotal < estimatedTotal) {
          await User.updateOne(
            { _id: user._id },
            {
              $set: {
                'prestige.totalXpEarned': estimatedTotal,
                'prestige.level': user.prestige?.level || 0,
                'prestige.bonusMultiplier': user.prestige?.bonusMultiplier || 1.0
              }
            }
          );
          console.log(`✅ ${user.username}: ${currentTotal} → ${estimatedTotal} XP (Level ${user.level})`);
          migrated++;
        } else {
          console.log(`⏭️  ${user.username}: Already has ${currentTotal} XP (skipped)`);
          skipped++;
        }
      } catch (err) {
        console.error(`❌ Error migrating ${user.username}: ${err.message}`);
        errors++;
      }
    }

    console.log('');
    console.log('─'.repeat(60));
    console.log('');
    console.log('╔══════════════════════════════════════════════════════════════╗');
    console.log('║   MIGRATION COMPLETE                                         ║');
    console.log('╠══════════════════════════════════════════════════════════════╣');
    console.log(`║   ✅ Migrated: ${String(migrated).padEnd(44)}║`);
    console.log(`║   ⏭️  Skipped:  ${String(skipped).padEnd(44)}║`);
    console.log(`║   ❌ Errors:   ${String(errors).padEnd(44)}║`);
    console.log(`║   📊 Total:    ${String(users.length).padEnd(44)}║`);
    console.log('╚══════════════════════════════════════════════════════════════╝');

  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('');
    console.log('📡 Disconnected from MongoDB');
  }
}

// Also export for programmatic use
export async function migrateUser(userId) {
  const User = mongoose.model('User');
  const user = await User.findOne({ discordId: userId }).lean();
  
  if (!user) return null;
  
  const currentTotal = user.prestige?.totalXpEarned || 0;
  const estimatedTotal = estimateLifetimeXp(user);
  
  if (currentTotal < estimatedTotal) {
    await User.updateOne(
      { discordId: userId },
      { $set: { 'prestige.totalXpEarned': estimatedTotal } }
    );
    return { before: currentTotal, after: estimatedTotal, migrated: true };
  }
  
  return { before: currentTotal, after: currentTotal, migrated: false };
}

// Sync all streaks (unify dailyBonusStreak and streak)
export async function syncAllStreaks() {
  const User = mongoose.model('User');
  const users = await User.find({}).lean();
  
  let synced = 0;
  for (const user of users) {
    const unifiedStreak = Math.max(user.streak || 0, user.dailyBonusStreak || 0);
    if (user.streak !== unifiedStreak || user.dailyBonusStreak !== unifiedStreak) {
      await User.updateOne(
        { _id: user._id },
        { $set: { streak: unifiedStreak, dailyBonusStreak: unifiedStreak } }
      );
      synced++;
    }
  }
  
  return { synced, total: users.length };
}

// Run if called directly
runMigration();
