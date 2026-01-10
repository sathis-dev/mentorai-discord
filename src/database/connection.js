import mongoose from 'mongoose';

let isConnected = false;
let migrationRan = false;

// XP formula - single source of truth
function xpForLevel(level) {
  return Math.floor(100 * Math.pow(1.5, level - 1));
}

// Estimate lifetime XP based on current level and XP
function estimateLifetimeXp(user) {
  let total = user.xp || 0;
  for (let lvl = 1; lvl < (user.level || 1); lvl++) {
    total += xpForLevel(lvl);
  }
  return total;
}

/**
 * Run one-time migration to backfill prestige.totalXpEarned
 * Safe to run multiple times - only updates users who need it
 */
async function runLifetimeXpMigration() {
  if (migrationRan) return;
  migrationRan = true;

  try {
    console.log('🔄 Checking for lifetime XP migration...');
    const User = mongoose.model('User');
    
    // Find users with missing or zero totalXpEarned who have level > 1
    const usersToMigrate = await User.find({
      $or: [
        { 'prestige.totalXpEarned': { $exists: false } },
        { 'prestige.totalXpEarned': 0 },
        { 'prestige.totalXpEarned': null }
      ],
      level: { $gt: 1 }
    }).lean();

    if (usersToMigrate.length === 0) {
      console.log('✅ No users need lifetime XP migration');
      return;
    }

    console.log(`📊 Migrating ${usersToMigrate.length} users...`);
    let migrated = 0;

    for (const user of usersToMigrate) {
      const estimatedTotal = estimateLifetimeXp(user);
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
      migrated++;
    }

    console.log(`✅ Migration complete: ${migrated} users updated`);
  } catch (error) {
    console.error('⚠️ Migration error (non-fatal):', error.message);
  }
}

export async function connectDatabase() {
  if (isConnected) {
    console.log('Using existing database connection');
    return mongoose.connection;
  }
  
  const uri = process.env.DATABASE_URL || 'mongodb://localhost:27017/mentorai';
  
  mongoose.connection.on('error', (err) => {
    console.error('MongoDB connection error:', err);
    isConnected = false;
  });

  mongoose.connection.on('disconnected', () => {
    console.log('MongoDB disconnected');
    isConnected = false;
  });

  mongoose.connection.on('connected', () => {
    console.log('MongoDB connected');
    isConnected = true;
  });

  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    isConnected = true;
    
    // Run migration after connection (async, non-blocking)
    setTimeout(() => runLifetimeXpMigration(), 3000);
    
    return mongoose.connection;
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error.message);
    console.log('⚠️ Bot will run without database functionality');
    return null;
  }
}

export function isDatabaseConnected() {
  return isConnected;
}
