/**
 * Streak System Unit Tests
 */

import { StreakSystem } from '../../src/core/streakSystem.js';
import { assert } from '../setup.js';

const streakSystem = new StreakSystem();

describe('Streak System', () => {
  
  describe('updateStreak', () => {
    it('should start a new streak from 0', () => {
      const user = {
        streak: 0,
        lastActive: null,
        timezone: 'UTC'
      };
      
      const result = streakSystem.updateStreak(user);
      assert.strictEqual(result.newStreak, 1, 'Should start at streak 1');
      assert.strictEqual(result.increased, true, 'Should indicate increase');
    });
    
    it('should continue streak for next day activity', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      const user = {
        streak: 5,
        lastActive: yesterday,
        timezone: 'UTC'
      };
      
      const result = streakSystem.updateStreak(user);
      assert.strictEqual(result.newStreak, 6, 'Should increase to 6');
      assert.strictEqual(result.increased, true, 'Should indicate increase');
    });
    
    it('should maintain streak for same day activity', () => {
      const user = {
        streak: 5,
        lastActive: new Date(),
        timezone: 'UTC'
      };
      
      const result = streakSystem.updateStreak(user);
      assert.strictEqual(result.newStreak, 5, 'Should maintain at 5');
      assert.strictEqual(result.increased, false, 'Should not indicate increase');
    });
    
    it('should reset streak after 2+ days', () => {
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
      
      const user = {
        streak: 10,
        lastActive: threeDaysAgo,
        timezone: 'UTC'
      };
      
      const result = streakSystem.updateStreak(user);
      assert.strictEqual(result.newStreak, 1, 'Should reset to 1');
      assert.strictEqual(result.reset, true, 'Should indicate reset');
    });
  });
  
  describe('getStreakMultiplier', () => {
    it('should return 1.0x for streak 0', () => {
      const multiplier = streakSystem.getStreakMultiplier(0);
      assert.strictEqual(multiplier, 1.0, 'Streak 0 should have 1.0x multiplier');
    });
    
    it('should return 1.0x for streak 1-2', () => {
      const multiplier = streakSystem.getStreakMultiplier(2);
      assert.strictEqual(multiplier, 1.0, 'Streak 2 should have 1.0x multiplier');
    });
    
    it('should return 1.1x for streak 3-6', () => {
      const multiplier = streakSystem.getStreakMultiplier(5);
      assert.strictEqual(multiplier, 1.1, 'Streak 5 should have 1.1x multiplier');
    });
    
    it('should return 1.25x for streak 7-13', () => {
      const multiplier = streakSystem.getStreakMultiplier(10);
      assert.strictEqual(multiplier, 1.25, 'Streak 10 should have 1.25x multiplier');
    });
    
    it('should return 1.5x for streak 14-29', () => {
      const multiplier = streakSystem.getStreakMultiplier(20);
      assert.strictEqual(multiplier, 1.5, 'Streak 20 should have 1.5x multiplier');
    });
    
    it('should return 2.0x for streak 30+', () => {
      const multiplier = streakSystem.getStreakMultiplier(30);
      assert.strictEqual(multiplier, 2.0, 'Streak 30 should have 2.0x multiplier');
    });
  });
  
  describe('getStreakVisual', () => {
    it('should return Newbie Glow for streak 0-2', () => {
      const visual = streakSystem.getStreakVisual(1);
      assert.strictEqual(visual.name, 'Newbie Glow', 'Should be Newbie Glow');
      assert.strictEqual(visual.emoji, '✨', 'Should have spark emoji');
    });
    
    it('should return Spark for streak 3-6', () => {
      const visual = streakSystem.getStreakVisual(5);
      assert.strictEqual(visual.name, 'Spark', 'Should be Spark');
      assert.strictEqual(visual.emoji, '🔥', 'Should have fire emoji');
    });
    
    it('should return Shining for streak 7-13', () => {
      const visual = streakSystem.getStreakVisual(10);
      assert.strictEqual(visual.name, 'Shining', 'Should be Shining');
    });
    
    it('should return Power Surge for streak 14-29', () => {
      const visual = streakSystem.getStreakVisual(20);
      assert.strictEqual(visual.name, 'Power Surge', 'Should be Power Surge');
    });
    
    it('should return Inferno for streak 30+', () => {
      const visual = streakSystem.getStreakVisual(50);
      assert.strictEqual(visual.name, 'Inferno', 'Should be Inferno');
      assert.strictEqual(visual.emoji, '🌋', 'Should have volcano emoji');
    });
  });
  
  describe('canClaimDaily', () => {
    it('should allow first daily claim', () => {
      const user = {
        lastDailyBonus: null,
        timezone: 'UTC'
      };
      
      const result = streakSystem.canClaimDaily(user);
      assert.strictEqual(result.canClaim, true, 'Should allow first claim');
    });
    
    it('should not allow claim on same day', () => {
      const user = {
        lastDailyBonus: new Date(),
        timezone: 'UTC'
      };
      
      const result = streakSystem.canClaimDaily(user);
      assert.strictEqual(result.canClaim, false, 'Should not allow same day claim');
    });
    
    it('should allow claim after midnight', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      const user = {
        lastDailyBonus: yesterday,
        timezone: 'UTC'
      };
      
      const result = streakSystem.canClaimDaily(user);
      assert.strictEqual(result.canClaim, true, 'Should allow claim after midnight');
    });
  });
  
  describe('calculateMilestoneBonus', () => {
    it('should give bonus at streak 7', () => {
      const bonus = streakSystem.calculateMilestoneBonus(7);
      assert.ok(bonus > 0, 'Should give bonus at streak 7');
    });
    
    it('should give larger bonus at streak 30', () => {
      const bonus7 = streakSystem.calculateMilestoneBonus(7);
      const bonus30 = streakSystem.calculateMilestoneBonus(30);
      assert.ok(bonus30 > bonus7, 'Streak 30 bonus should be larger than streak 7');
    });
    
    it('should return 0 for non-milestone streaks', () => {
      const bonus = streakSystem.calculateMilestoneBonus(5);
      assert.strictEqual(bonus, 0, 'Non-milestone streaks should have no bonus');
    });
  });
});

export default describe;
