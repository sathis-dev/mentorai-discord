/**
 * User Journey End-to-End Tests
 */

import { createTestUser, simulateQuizCompletion, wait } from '../fixtures/testData.js';
import { assert } from '../setup.js';

describe('User Journey', () => {
  let testUser;
  
  beforeEach(async () => {
    testUser = await createTestUser('test_user_journey');
  });
  
  afterEach(async () => {
    if (testUser) {
      await testUser.cleanup();
    }
  });
  
  it('should complete full learning journey', async () => {
    // 1. User starts at level 1 with 0 XP
    assert.strictEqual(testUser.level, 1, 'Should start at level 1');
    assert.strictEqual(testUser.xp, 0, 'Should start with 0 XP');
    
    // 2. Complete a quiz (5 questions, 4 correct)
    const quizResult = await simulateQuizCompletion(testUser, 4, 5);
    await testUser.refresh();
    
    assert.strictEqual(testUser.data.quizStats.taken, 1, 'Should have 1 quiz taken');
    assert.strictEqual(testUser.data.quizStats.correct, 4, 'Should have 4 correct answers');
    assert.ok(testUser.data.xp > 0, 'Should have earned XP');
    
    // 3. Check accuracy
    assert.strictEqual(testUser.data.quizStats.accuracy, 80, 'Accuracy should be 80%');
    
    // 4. Add enough XP for level up
    await testUser.addXp(200);
    await testUser.refresh();
    
    assert.ok(testUser.level >= 2, 'Should have leveled up');
    
    // 5. Set streak
    await testUser.setStreak(7);
    await testUser.refresh();
    
    assert.strictEqual(testUser.streak, 7, 'Should have 7-day streak');
  });
  
  it('should handle streak correctly', async () => {
    // Start streak
    await testUser.setStreak(1);
    await testUser.refresh();
    assert.strictEqual(testUser.streak, 1, 'Should have streak of 1');
    
    // Continue streak
    await testUser.setStreak(5);
    await testUser.refresh();
    assert.strictEqual(testUser.streak, 5, 'Should have streak of 5');
  });
  
  it('should track quiz progress', async () => {
    // Take multiple quizzes
    await simulateQuizCompletion(testUser, 5, 5); // Perfect
    await simulateQuizCompletion(testUser, 3, 5);
    await simulateQuizCompletion(testUser, 4, 5);
    
    await testUser.refresh();
    
    assert.strictEqual(testUser.data.quizStats.taken, 3, 'Should have 3 quizzes taken');
    assert.strictEqual(testUser.data.quizStats.correct, 12, 'Should have 12 correct answers');
    assert.strictEqual(testUser.data.quizStats.total, 15, 'Should have 15 total questions');
    assert.strictEqual(testUser.data.quizStats.accuracy, 80, 'Accuracy should be 80%');
  });
  
  it('should level up correctly', async () => {
    const startLevel = testUser.level;
    
    // Add enough XP for multiple level ups
    await testUser.addXp(1000);
    await testUser.refresh();
    
    assert.ok(testUser.level > startLevel, 'Should have leveled up');
    assert.ok(testUser.level >= 4, 'Should be at least level 4 with 1000 XP');
  });
});

describe('Multiplayer Journey', () => {
  let user1, user2;
  
  beforeEach(async () => {
    user1 = await createTestUser('challenge_user_1');
    user2 = await createTestUser('challenge_user_2');
  });
  
  afterEach(async () => {
    if (user1) await user1.cleanup();
    if (user2) await user2.cleanup();
  });
  
  it('should create two users for challenge', async () => {
    assert.ok(user1.data, 'User 1 should exist');
    assert.ok(user2.data, 'User 2 should exist');
    assert.ok(user1.discordId !== user2.discordId, 'Users should have different IDs');
  });
  
  it('should track separate stats for each user', async () => {
    // User 1 takes a quiz
    await simulateQuizCompletion(user1, 5, 5);
    await user1.refresh();
    await user2.refresh();
    
    assert.strictEqual(user1.data.quizStats.taken, 1, 'User 1 should have 1 quiz');
    assert.strictEqual(user2.data.quizStats.taken, 0, 'User 2 should have 0 quizzes');
  });
});

describe('Achievement Progress', () => {
  let testUser;
  
  beforeEach(async () => {
    testUser = await createTestUser('achievement_user');
  });
  
  afterEach(async () => {
    if (testUser) await testUser.cleanup();
  });
  
  it('should start with no achievements', async () => {
    assert.strictEqual(testUser.achievements.length, 0, 'Should have no achievements');
  });
  
  it('should be able to add achievements', async () => {
    testUser.data.achievements.push({
      id: 'first_quiz',
      name: '🎯 First Quiz',
      earnedAt: new Date()
    });
    await testUser.data.save();
    await testUser.refresh();
    
    assert.strictEqual(testUser.achievements.length, 1, 'Should have 1 achievement');
    assert.strictEqual(testUser.achievements[0].id, 'first_quiz', 'Should be first_quiz achievement');
  });
});

// Export for test runner
export default { describe };
