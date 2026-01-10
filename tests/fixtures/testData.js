/**
 * Test Fixtures - Sample Data for Testing
 */

import { User } from '../../src/database/models/User.js';
import { QuizSession } from '../../src/database/models/QuizSession.js';
import { BattleSession } from '../../src/database/models/BattleSession.js';

/**
 * Test User Class
 * Provides helpers for creating and managing test users
 */
export class TestUser {
  constructor(discordId) {
    this.discordId = discordId || `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.username = `TestUser_${this.discordId.slice(-6)}`;
    this.data = null;
  }
  
  /**
   * Create user in database
   */
  async create(overrides = {}) {
    this.data = await User.create({
      discordId: this.discordId,
      username: this.username,
      xp: 0,
      level: 1,
      streak: 0,
      timezone: 'UTC',
      quizStats: {
        taken: 0,
        correct: 0,
        total: 0,
        accuracy: 0
      },
      achievements: [],
      ...overrides
    });
    
    return this.data;
  }
  
  /**
   * Refresh user data from database
   */
  async refresh() {
    this.data = await User.findOne({ discordId: this.discordId });
    return this.data;
  }
  
  /**
   * Cleanup - remove test user
   */
  async cleanup() {
    await User.deleteOne({ discordId: this.discordId });
    await QuizSession.deleteMany({ discordId: this.discordId });
    await BattleSession.deleteMany({ 'players.discordId': this.discordId });
    this.data = null;
  }
  
  /**
   * Simulate time travel (for streak testing)
   */
  async travelInTime(ms) {
    if (!this.data) return;
    
    if (this.data.lastActive) {
      this.data.lastActive = new Date(this.data.lastActive.getTime() - ms);
    }
    if (this.data.lastDailyBonus) {
      this.data.lastDailyBonus = new Date(this.data.lastDailyBonus.getTime() - ms);
    }
    await this.data.save();
  }
  
  /**
   * Add XP to user
   */
  async addXp(amount) {
    if (!this.data) return;
    
    this.data.xp += amount;
    
    // Check for level up
    const xpForNext = Math.floor(100 * Math.pow(1.5, this.data.level - 1));
    while (this.data.xp >= xpForNext) {
      this.data.xp -= xpForNext;
      this.data.level += 1;
    }
    
    await this.data.save();
    return this.data;
  }
  
  /**
   * Set streak
   */
  async setStreak(streak) {
    if (!this.data) return;
    
    this.data.streak = streak;
    await this.data.save();
    return this.data;
  }
  
  // Getters for common properties
  get xp() { return this.data?.xp || 0; }
  get level() { return this.data?.level || 1; }
  get streak() { return this.data?.streak || 0; }
  get achievements() { return this.data?.achievements || []; }
}

/**
 * Create a test user
 */
export async function createTestUser(id) {
  const user = new TestUser(id);
  await user.create();
  return user;
}

/**
 * Create multiple test users
 */
export async function createTestUsers(count) {
  const users = [];
  for (let i = 0; i < count; i++) {
    const user = await createTestUser(`test_user_${i}_${Date.now()}`);
    users.push(user);
  }
  return users;
}

/**
 * Sample quiz questions for testing
 */
export const sampleQuizQuestions = [
  {
    question: 'What is the output of print(2 + 2)?',
    options: ['A) 22', 'B) 4', 'C) Error', 'D) None'],
    correctIndex: 1,
    explanation: 'In Python, 2 + 2 equals 4, which is then printed.',
    difficulty: 'easy',
    topic: 'Python'
  },
  {
    question: 'Which keyword is used to define a function in Python?',
    options: ['A) function', 'B) def', 'C) define', 'D) fn'],
    correctIndex: 1,
    explanation: 'The "def" keyword is used to define functions in Python.',
    difficulty: 'easy',
    topic: 'Python'
  },
  {
    question: 'What is a closure in JavaScript?',
    options: [
      'A) A way to close the browser',
      'B) A function with access to its outer scope',
      'C) A type of loop',
      'D) An error type'
    ],
    correctIndex: 1,
    explanation: 'A closure is a function that retains access to variables from its outer scope.',
    difficulty: 'medium',
    topic: 'JavaScript'
  },
  {
    question: 'What is the time complexity of binary search?',
    options: ['A) O(n)', 'B) O(n²)', 'C) O(log n)', 'D) O(1)'],
    correctIndex: 2,
    explanation: 'Binary search has O(log n) time complexity as it halves the search space each step.',
    difficulty: 'medium',
    topic: 'Algorithms'
  },
  {
    question: 'What does SQL stand for?',
    options: [
      'A) Structured Query Language',
      'B) Simple Query Language',
      'C) Standard Query Language',
      'D) Sequential Query Language'
    ],
    correctIndex: 0,
    explanation: 'SQL stands for Structured Query Language.',
    difficulty: 'easy',
    topic: 'Databases'
  }
];

/**
 * Sample achievement data
 */
export const sampleAchievements = [
  {
    id: 'first_quiz',
    name: '🎯 First Quiz',
    description: 'Complete your first quiz',
    rarity: 'common',
    xp: 50
  },
  {
    id: 'streak_7',
    name: '⚡ Week Warrior',
    description: 'Maintain a 7-day streak',
    rarity: 'uncommon',
    xp: 200
  },
  {
    id: 'level_10',
    name: '🌟 Shining Bright',
    description: 'Reach level 10',
    rarity: 'rare',
    xp: 500
  }
];

/**
 * Simulate a quiz completion
 */
export async function simulateQuizCompletion(user, correct, total) {
  if (!user.data) return;
  
  user.data.quizStats.taken += 1;
  user.data.quizStats.correct += correct;
  user.data.quizStats.total += total;
  user.data.quizStats.accuracy = (user.data.quizStats.correct / user.data.quizStats.total) * 100;
  
  // Add XP (25 per correct answer)
  const xpEarned = correct * 25;
  user.data.xp += xpEarned;
  
  await user.data.save();
  return { correct, total, xpEarned };
}

/**
 * Wait helper
 */
export function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Mock interaction options
 */
export function createInteractionOptions(command, options = {}) {
  return {
    commandName: command,
    strings: options.strings || {},
    integers: options.integers || {},
    users: options.users || {},
    booleans: options.booleans || {},
    subcommand: options.subcommand || null
  };
}

export default {
  TestUser,
  createTestUser,
  createTestUsers,
  sampleQuizQuestions,
  sampleAchievements,
  simulateQuizCompletion,
  wait,
  createInteractionOptions
};
