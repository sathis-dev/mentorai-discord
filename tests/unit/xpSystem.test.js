/**
 * XP System Unit Tests
 */

import { XPSystem } from '../../src/core/xpSystem.js';
import { assert } from '../setup.js';

const xpSystem = new XPSystem();

describe('XP System', () => {
  
  describe('xpForLevel', () => {
    it('should calculate XP for level 1', () => {
      const result = xpSystem.xpForLevel(1);
      assert.strictEqual(result, 100, 'Level 1 should require 100 XP');
    });
    
    it('should calculate XP for level 2', () => {
      const result = xpSystem.xpForLevel(2);
      assert.strictEqual(result, 150, 'Level 2 should require 150 XP');
    });
    
    it('should calculate XP for level 5', () => {
      const result = xpSystem.xpForLevel(5);
      // 100 * 1.5^4 = 506.25 → 506
      assert.strictEqual(result, 506, 'Level 5 should require 506 XP');
    });
    
    it('should have exponential growth', () => {
      const level5 = xpSystem.xpForLevel(5);
      const level6 = xpSystem.xpForLevel(6);
      const ratio = level6 / level5;
      
      assert.ok(ratio > 1.4, 'Ratio should be > 1.4');
      assert.ok(ratio < 1.6, 'Ratio should be < 1.6');
    });
    
    it('should handle high levels', () => {
      const level100 = xpSystem.xpForLevel(100);
      assert.ok(level100 > 1000000, 'Level 100 should require > 1M XP');
    });
  });
  
  describe('totalXpToLevel', () => {
    it('should calculate total XP to reach level 1', () => {
      const result = xpSystem.totalXpToLevel(1);
      assert.strictEqual(result, 0, 'Level 1 needs 0 total XP');
    });
    
    it('should calculate total XP to reach level 2', () => {
      const result = xpSystem.totalXpToLevel(2);
      assert.strictEqual(result, 100, 'Level 2 needs 100 total XP');
    });
    
    it('should calculate total XP to reach level 3', () => {
      const result = xpSystem.totalXpToLevel(3);
      assert.strictEqual(result, 250, 'Level 3 needs 250 total XP (100 + 150)');
    });
  });
  
  describe('levelFromTotalXp', () => {
    it('should calculate level from 0 XP', () => {
      const result = xpSystem.levelFromTotalXp(0);
      assert.strictEqual(result.level, 1, '0 XP should be level 1');
      assert.strictEqual(result.currentXp, 0, 'Current XP should be 0');
      assert.strictEqual(result.xpToNext, 100, 'XP to next should be 100');
    });
    
    it('should calculate level from 150 XP', () => {
      const result = xpSystem.levelFromTotalXp(150);
      assert.strictEqual(result.level, 2, '150 XP should be level 2');
      assert.strictEqual(result.currentXp, 50, 'Current XP should be 50');
    });
    
    it('should calculate level from 1000 XP', () => {
      const result = xpSystem.levelFromTotalXp(1000);
      assert.strictEqual(result.level, 4, '1000 XP should be level 4');
    });
    
    it('should handle exact level boundaries', () => {
      const result = xpSystem.levelFromTotalXp(100);
      assert.strictEqual(result.level, 2, '100 XP should be level 2');
      assert.strictEqual(result.currentXp, 0, 'Current XP should be 0');
    });
  });
  
  describe('progressPercentage', () => {
    it('should calculate 0% progress', () => {
      const result = xpSystem.progressPercentage(0, 1);
      assert.strictEqual(result, 0, 'Progress should be 0%');
    });
    
    it('should calculate 50% progress', () => {
      const result = xpSystem.progressPercentage(50, 1);
      assert.strictEqual(result, 50, 'Progress should be 50%');
    });
    
    it('should calculate 100% progress', () => {
      const result = xpSystem.progressPercentage(100, 1);
      assert.strictEqual(result, 100, 'Progress should be 100%');
    });
    
    it('should cap at 100%', () => {
      const result = xpSystem.progressPercentage(150, 1);
      assert.strictEqual(result, 100, 'Progress should cap at 100%');
    });
  });
  
  describe('getProgressBar', () => {
    it('should generate progress bar at 0%', () => {
      const bar = xpSystem.getProgressBar(0, 100);
      assert.ok(bar.includes('░'), 'Bar should contain empty blocks');
      assert.ok(!bar.includes('█'), 'Bar should not contain filled blocks');
    });
    
    it('should generate progress bar at 50%', () => {
      const bar = xpSystem.getProgressBar(50, 100);
      assert.ok(bar.includes('█'), 'Bar should contain filled blocks');
      assert.ok(bar.includes('░'), 'Bar should contain empty blocks');
    });
    
    it('should generate progress bar at 100%', () => {
      const bar = xpSystem.getProgressBar(100, 100);
      assert.ok(bar.includes('█'), 'Bar should contain filled blocks');
      assert.ok(!bar.includes('░'), 'Bar should not contain empty blocks');
    });
  });
});

// Simple test runner
async function runTests() {
  console.log('\n🧪 Running XP System Tests...\n');
  
  const tests = [];
  let currentDescribe = '';
  
  // Collect tests
  global.describe = (name, fn) => {
    currentDescribe = name;
    fn();
  };
  
  global.it = (name, fn) => {
    tests.push({
      describe: currentDescribe,
      name,
      fn
    });
  };
  
  // Run the test definitions
  eval(`(${describe.toString()})`);
  
  // Execute tests
  let passed = 0;
  let failed = 0;
  
  for (const test of tests) {
    try {
      await test.fn();
      console.log(`  ✅ ${test.describe} > ${test.name}`);
      passed++;
    } catch (error) {
      console.log(`  ❌ ${test.describe} > ${test.name}`);
      console.log(`     Error: ${error.message}`);
      failed++;
    }
  }
  
  console.log(`\n📊 Results: ${passed} passed, ${failed} failed\n`);
  
  return failed === 0;
}

// Export for test runner
export { runTests };
export default runTests;
