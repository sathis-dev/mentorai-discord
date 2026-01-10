/**
 * Database Indexes - Optimal Database Configuration
 * 
 * Creates indexes for optimal query performance
 */

import mongoose from 'mongoose';

/**
 * Create all database indexes
 */
export async function createIndexes() {
  console.log('📊 Creating database indexes...');

  try {
    // User collection indexes
    const userIndexes = [
      // Primary lookup by discordId
      { key: { discordId: 1 }, unique: true, name: 'discordId_unique' },
      
      // Leaderboard queries
      { key: { level: -1, xp: -1 }, name: 'leaderboard_level' },
      { key: { 'prestige.totalXpEarned': -1 }, name: 'leaderboard_totalXp' },
      { key: { streak: -1 }, name: 'leaderboard_streak' },
      { key: { 'quizStats.accuracy': -1 }, name: 'leaderboard_accuracy' },
      { key: { 'arenaStats.rating': -1 }, name: 'leaderboard_arena' },
      
      // Daily bonus queries
      { key: { lastDailyBonus: 1 }, name: 'daily_bonus' },
      
      // Activity queries
      { key: { lastActive: -1 }, name: 'last_active' },
      
      // Search by username (case insensitive text search)
      { key: { username: 'text' }, name: 'username_text' },
      
      // Achievement queries
      { key: { 'achievements.id': 1 }, name: 'achievement_id', sparse: true },
      
      // Tier and prestige queries
      { key: { 'tier.name': 1 }, name: 'tier_name' },
      { key: { 'prestige.level': 1 }, name: 'prestige_level' },
      
      // Timezone for daily resets
      { key: { timezone: 1 }, name: 'timezone' }
    ];

    const usersCollection = mongoose.connection.collection('users');
    for (const index of userIndexes) {
      try {
        await usersCollection.createIndex(index.key, {
          name: index.name,
          unique: index.unique || false,
          sparse: index.sparse || false,
          background: true
        });
      } catch (err) {
        if (err.code !== 85) { // Ignore "index already exists" errors
          console.warn(`Warning creating index ${index.name}:`, err.message);
        }
      }
    }
    console.log('  ✅ User indexes created');

    // QuizSession collection indexes
    const quizIndexes = [
      // Primary lookup
      { key: { sessionId: 1 }, unique: true, name: 'sessionId_unique' },
      
      // User's active sessions
      { key: { discordId: 1, status: 1 }, name: 'user_active_sessions' },
      
      // Compound index for user history
      { key: { discordId: 1, startedAt: -1 }, name: 'user_quiz_history' },
      
      // Topic and difficulty queries
      { key: { topic: 1, difficulty: 1 }, name: 'topic_difficulty' },
      
      // TTL index for automatic cleanup (30 minutes)
      { key: { startedAt: 1 }, name: 'session_ttl', expireAfterSeconds: 30 * 60 }
    ];

    if (mongoose.connection.collections['quizsessions']) {
      const quizCollection = mongoose.connection.collection('quizsessions');
      for (const index of quizIndexes) {
        try {
          await quizCollection.createIndex(index.key, {
            name: index.name,
            unique: index.unique || false,
            expireAfterSeconds: index.expireAfterSeconds,
            background: true
          });
        } catch (err) {
          if (err.code !== 85) {
            console.warn(`Warning creating index ${index.name}:`, err.message);
          }
        }
      }
      console.log('  ✅ QuizSession indexes created');
    }

    // BattleSession collection indexes
    const battleIndexes = [
      { key: { battleId: 1 }, unique: true, name: 'battleId_unique' },
      { key: { status: 1 }, name: 'battle_status' },
      { key: { type: 1, status: 1 }, name: 'battle_type_status' },
      { key: { 'players.discordId': 1 }, name: 'battle_players' },
      { key: { createdAt: 1 }, name: 'battle_ttl', expireAfterSeconds: 60 * 60 } // 1 hour
    ];

    if (mongoose.connection.collections['battlesessions']) {
      const battleCollection = mongoose.connection.collection('battlesessions');
      for (const index of battleIndexes) {
        try {
          await battleCollection.createIndex(index.key, {
            name: index.name,
            unique: index.unique || false,
            expireAfterSeconds: index.expireAfterSeconds,
            background: true
          });
        } catch (err) {
          if (err.code !== 85) {
            console.warn(`Warning creating index ${index.name}:`, err.message);
          }
        }
      }
      console.log('  ✅ BattleSession indexes created');
    }

    // StudyParty collection indexes
    const partyIndexes = [
      { key: { partyId: 1 }, unique: true, name: 'partyId_unique' },
      { key: { inviteCode: 1 }, unique: true, sparse: true, name: 'inviteCode_unique' },
      { key: { hostId: 1 }, name: 'party_host' },
      { key: { 'members.discordId': 1 }, name: 'party_members' },
      { key: { status: 1 }, name: 'party_status' },
      { key: { channelId: 1 }, name: 'party_channel' }
    ];

    if (mongoose.connection.collections['studyparties']) {
      const partyCollection = mongoose.connection.collection('studyparties');
      for (const index of partyIndexes) {
        try {
          await partyCollection.createIndex(index.key, {
            name: index.name,
            unique: index.unique || false,
            sparse: index.sparse || false,
            background: true
          });
        } catch (err) {
          if (err.code !== 85) {
            console.warn(`Warning creating index ${index.name}:`, err.message);
          }
        }
      }
      console.log('  ✅ StudyParty indexes created');
    }

    // Arena collection indexes
    if (mongoose.connection.collections['arenas']) {
      const arenaCollection = mongoose.connection.collection('arenas');
      const arenaIndexes = [
        { key: { arenaId: 1 }, unique: true, name: 'arenaId_unique' },
        { key: { status: 1 }, name: 'arena_status' },
        { key: { 'players.discordId': 1 }, name: 'arena_players' },
        { key: { createdAt: 1 }, name: 'arena_ttl', expireAfterSeconds: 30 * 60 }
      ];

      for (const index of arenaIndexes) {
        try {
          await arenaCollection.createIndex(index.key, {
            name: index.name,
            unique: index.unique || false,
            expireAfterSeconds: index.expireAfterSeconds,
            background: true
          });
        } catch (err) {
          if (err.code !== 85) {
            console.warn(`Warning creating index ${index.name}:`, err.message);
          }
        }
      }
      console.log('  ✅ Arena indexes created');
    }

    console.log('✅ All database indexes created successfully');
    return true;

  } catch (error) {
    console.error('❌ Error creating indexes:', error);
    return false;
  }
}

/**
 * List all indexes for a collection
 * @param {string} collectionName - Collection name
 */
export async function listIndexes(collectionName) {
  try {
    const collection = mongoose.connection.collection(collectionName);
    const indexes = await collection.indexes();
    console.log(`Indexes for ${collectionName}:`, indexes);
    return indexes;
  } catch (error) {
    console.error(`Error listing indexes for ${collectionName}:`, error);
    return [];
  }
}

/**
 * Drop all custom indexes (keep _id)
 * @param {string} collectionName - Collection name
 */
export async function dropCustomIndexes(collectionName) {
  try {
    const collection = mongoose.connection.collection(collectionName);
    await collection.dropIndexes();
    console.log(`Dropped all custom indexes for ${collectionName}`);
    return true;
  } catch (error) {
    console.error(`Error dropping indexes for ${collectionName}:`, error);
    return false;
  }
}

/**
 * Analyze query performance
 * @param {string} collectionName - Collection name
 * @param {Object} query - Query to analyze
 */
export async function analyzeQuery(collectionName, query) {
  try {
    const collection = mongoose.connection.collection(collectionName);
    const explanation = await collection.find(query).explain('executionStats');
    
    console.log('Query Analysis:');
    console.log('  Total Docs Examined:', explanation.executionStats.totalDocsExamined);
    console.log('  Total Keys Examined:', explanation.executionStats.totalKeysExamined);
    console.log('  Execution Time (ms):', explanation.executionStats.executionTimeMillis);
    console.log('  Index Used:', explanation.queryPlanner.winningPlan.inputStage?.indexName || 'None (COLLSCAN)');
    
    return explanation;
  } catch (error) {
    console.error('Error analyzing query:', error);
    return null;
  }
}

/**
 * Get collection statistics
 * @param {string} collectionName - Collection name
 */
export async function getCollectionStats(collectionName) {
  try {
    const stats = await mongoose.connection.db.command({
      collStats: collectionName
    });
    
    return {
      count: stats.count,
      size: stats.size,
      avgObjSize: stats.avgObjSize,
      storageSize: stats.storageSize,
      totalIndexSize: stats.totalIndexSize,
      indexSizes: stats.indexSizes
    };
  } catch (error) {
    console.error(`Error getting stats for ${collectionName}:`, error);
    return null;
  }
}

export default createIndexes;
