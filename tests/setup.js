/**
 * Test Setup - Configuration for test suite
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.test' });

// Test database connection
const TEST_DB_URI = process.env.TEST_DATABASE_URL || 'mongodb://localhost:27017/mentorai_test';

/**
 * Setup before all tests
 */
export async function globalSetup() {
  console.log('🧪 Setting up test environment...');
  
  try {
    await mongoose.connect(TEST_DB_URI);
    console.log('  ✅ Connected to test database');
  } catch (error) {
    console.error('  ❌ Failed to connect to test database:', error);
    throw error;
  }
}

/**
 * Teardown after all tests
 */
export async function globalTeardown() {
  console.log('🧹 Cleaning up test environment...');
  
  try {
    // Drop test database
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.db.dropDatabase();
      await mongoose.disconnect();
    }
    console.log('  ✅ Test cleanup complete');
  } catch (error) {
    console.error('  ❌ Cleanup error:', error);
  }
}

/**
 * Setup before each test
 */
export async function beforeEachTest() {
  // Clear all collections
  const collections = await mongoose.connection.db.collections();
  for (const collection of collections) {
    await collection.deleteMany({});
  }
}

/**
 * Mock Discord interaction
 */
export function createMockInteraction(options = {}) {
  return {
    user: {
      id: options.userId || 'test_user_123',
      username: options.username || 'TestUser',
      avatar: options.avatar || null
    },
    guild: {
      id: options.guildId || 'test_guild_123',
      name: options.guildName || 'Test Guild'
    },
    channel: {
      id: options.channelId || 'test_channel_123',
      send: async (content) => ({ content }),
      name: 'test-channel'
    },
    commandName: options.commandName || 'test',
    options: {
      getString: (name) => options.strings?.[name] || null,
      getInteger: (name) => options.integers?.[name] || null,
      getUser: (name) => options.users?.[name] || null,
      getBoolean: (name) => options.booleans?.[name] || null,
      getSubcommand: () => options.subcommand || null
    },
    replied: false,
    deferred: false,
    reply: async function(content) {
      this.replied = true;
      return { content };
    },
    deferReply: async function() {
      this.deferred = true;
    },
    editReply: async function(content) {
      return { content };
    },
    followUp: async function(content) {
      return { content };
    }
  };
}

/**
 * Create test user in database
 */
export async function createTestUser(options = {}) {
  const User = (await import('../src/database/models/User.js')).User;
  
  const userData = {
    discordId: options.discordId || `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    username: options.username || 'TestUser',
    xp: options.xp || 0,
    level: options.level || 1,
    streak: options.streak || 0,
    timezone: options.timezone || 'UTC',
    ...options
  };

  const user = await User.create(userData);
  return user;
}

/**
 * Assert helpers
 */
export const assert = {
  strictEqual(actual, expected, message) {
    if (actual !== expected) {
      throw new Error(message || `Expected ${expected}, got ${actual}`);
    }
  },
  
  deepStrictEqual(actual, expected, message) {
    const actualStr = JSON.stringify(actual);
    const expectedStr = JSON.stringify(expected);
    if (actualStr !== expectedStr) {
      throw new Error(message || `Expected ${expectedStr}, got ${actualStr}`);
    }
  },
  
  ok(value, message) {
    if (!value) {
      throw new Error(message || `Expected truthy value, got ${value}`);
    }
  },
  
  throws(fn, message) {
    try {
      fn();
      throw new Error(message || 'Expected function to throw');
    } catch (error) {
      if (error.message === (message || 'Expected function to throw')) {
        throw error;
      }
      // Expected to throw, all good
    }
  },
  
  async rejects(promise, message) {
    try {
      await promise;
      throw new Error(message || 'Expected promise to reject');
    } catch (error) {
      if (error.message === (message || 'Expected promise to reject')) {
        throw error;
      }
      // Expected to reject, all good
    }
  }
};

export default {
  globalSetup,
  globalTeardown,
  beforeEachTest,
  createMockInteraction,
  createTestUser,
  assert
};
