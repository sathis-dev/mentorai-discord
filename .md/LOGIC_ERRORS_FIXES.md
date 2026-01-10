# MentorAI Bot - Exact Fix Implementations
## Ready-to-Apply Code Solutions for Each Logic Error

**Purpose:** Companion document to LOGIC_ERRORS_ANALYSIS.md with exact code fixes  
**Usage:** Apply these fixes in order of priority

---

# FIX 1: UNIFIED XP FORMULA

## Files to Modify:
- `src/config/brandSystem.js` (keep as-is - this is correct)
- `src/bot/commands/card.js` (fix)
- `website/index.html` (fix)

### Fix for card.js (Line 224)

**CURRENT (WRONG):**
```javascript
function calculateXPForLevel(level) {
  return Math.floor(100 * Math.pow(level, 1.5));
}
```

**REPLACE WITH:**
```javascript
// XP needed to level up FROM this level to next level
function xpForLevel(level) {
  return Math.floor(100 * Math.pow(1.5, level - 1));
}

// Also fix the progress calculation (around lines 50-55)
// CURRENT (WRONG):
const xpForNext = calculateXPForLevel(level + 1);
const xpForCurrent = calculateXPForLevel(level);
const xpProgress = xp - xpForCurrent;
const xpNeeded = xpForNext - xpForCurrent;

// REPLACE WITH:
const xpNeeded = xpForLevel(level);  // XP needed for next level
const xpProgress = xp;  // user.xp is already XP within current level
```

### Fix for website/index.html

**FIND AND REPLACE:**
```javascript
// CURRENT (WRONG):
function calculateXPForLevel(level) {
    return Math.floor(100 * Math.pow(level, 1.5));
}

// REPLACE WITH:
function xpForLevel(level) {
    return Math.floor(100 * Math.pow(1.5, level - 1));
}
```

---

# FIX 2: TRACK TOTAL XP EARNED

## Files to Modify:
- `src/database/models/User.js`

### Add totalXpEarned tracking in addXp method

**CURRENT (Line 240-253):**
```javascript
userSchema.methods.addXp = function(amount) {
  this.xp += amount;
  
  let leveledUp = false;
  let levelsGained = 0;
  while (this.xp >= this.xpForNextLevel()) {
    this.xp -= this.xpForNextLevel();
    this.level += 1;
    leveledUp = true;
    levelsGained++;
  }
  
  return { leveledUp, newLevel: this.level, levelsGained };
};
```

**REPLACE WITH:**
```javascript
userSchema.methods.addXp = function(amount) {
  this.xp += amount;
  
  // Track lifetime XP for tiers, prestige requirements, and leaderboards
  if (!this.prestige) {
    this.prestige = { 
      level: 0, 
      totalXpEarned: 0, 
      bonusMultiplier: 1.0,
      prestigeHistory: []
    };
  }
  this.prestige.totalXpEarned = (this.prestige.totalXpEarned || 0) + amount;
  
  let leveledUp = false;
  let levelsGained = 0;
  while (this.xp >= this.xpForNextLevel()) {
    this.xp -= this.xpForNextLevel();
    this.level += 1;
    leveledUp = true;
    levelsGained++;
  }
  
  return { leveledUp, newLevel: this.level, levelsGained, totalXpEarned: this.prestige.totalXpEarned };
};
```

---

# FIX 3: PRESTIGE TYPE MISMATCH

## Files to Modify:
- `src/bot/commands/card.js`

### Fix prestige reading (Line 46)

**CURRENT (WRONG):**
```javascript
const prestige = user.prestige || 0;
```

**REPLACE WITH:**
```javascript
const prestigeLevel = user.prestige?.level || 0;
const prestigeMultiplier = user.prestige?.bonusMultiplier || 1.0;
const totalXpEarned = user.prestige?.totalXpEarned || 0;
```

### Fix prestige display in embed (Line 122-126)

**CURRENT:**
```javascript
{
  name: '⭐ Prestige',
  value: `\`${prestige}\``,
  inline: true
}
```

**REPLACE WITH:**
```javascript
{
  name: '⭐ Prestige',
  value: `\`${prestigeLevel}\``,
  inline: true
}
```

### Fix URL building (Line 238)

**CURRENT:**
```javascript
prestige: (user.prestige || 0).toString()
```

**REPLACE WITH:**
```javascript
prestige: (user.prestige?.level || 0).toString()
```

---

# FIX 4: LEADERBOARD SORTING

## Files to Modify:
- `src/bot/commands/leaderboard.js`
- `src/services/gamificationService.js`

### Fix leaderboard.js (Lines 85-88)

**CURRENT:**
```javascript
switch (type) {
  case 'xp':
    sortField = { xp: -1 };
    break;
```

**REPLACE WITH:**
```javascript
switch (type) {
  case 'xp':
    // Sort by level first, then XP within level
    // Better: sort by total XP earned
    sortField = { 'prestige.totalXpEarned': -1, level: -1, xp: -1 };
    break;
```

### Fix gamificationService.js getLeaderboard (Lines 194-210)

**CURRENT:**
```javascript
export async function getLeaderboard(limit = 10, sortBy = 'xp') {
  const sortField = sortBy === 'level' ? { level: -1, xp: -1 } : 
                    sortBy === 'streak' ? { streak: -1 } : 
                    { xp: -1 };
```

**REPLACE WITH:**
```javascript
export async function getLeaderboard(limit = 10, sortBy = 'xp') {
  let sortField;
  switch (sortBy) {
    case 'level':
      sortField = { level: -1, xp: -1 };
      break;
    case 'streak':
      sortField = { streak: -1 };
      break;
    case 'xp':
    default:
      // Sort by total XP earned (lifetime), not current level XP
      sortField = { 'prestige.totalXpEarned': -1, level: -1, xp: -1 };
      break;
  }
```

---

# FIX 5: TIER CALCULATION

## Files to Modify:
- `src/bot/commands/card.js`

### Fix getTier usage (around Line 48)

**CURRENT:**
```javascript
const tier = getTier(xp);  // Uses within-level XP
```

**REPLACE WITH:**
```javascript
const tier = getTier(user.prestige?.totalXpEarned || 0);  // Uses lifetime XP
```

---

# FIX 6: APPLY PRESTIGE MULTIPLIER

## Files to Modify:
- `src/services/gamificationService.js`

### Create centralized XP addition with multipliers

**ADD NEW FUNCTION (around Line 120):**
```javascript
/**
 * Calculate final XP with all multipliers applied
 * @param {number} baseXp - Base XP before multipliers
 * @param {Object} user - User document
 * @returns {number} Final XP to award
 */
export function calculateFinalXp(baseXp, user) {
  // Get prestige multiplier
  const prestigeMultiplier = user?.prestige?.bonusMultiplier || 1.0;
  
  // Get streak multiplier
  const streak = user?.streak || user?.dailyBonusStreak || 0;
  let streakMultiplier = 1.0;
  if (streak >= 30) streakMultiplier = 2.0;
  else if (streak >= 14) streakMultiplier = 1.5;
  else if (streak >= 7) streakMultiplier = 1.25;
  else if (streak >= 3) streakMultiplier = 1.1;
  
  // Apply all multipliers
  const totalMultiplier = prestigeMultiplier * streakMultiplier;
  return Math.floor(baseXp * totalMultiplier);
}
```

### Update addXpToUser (Lines 123-136)

**CURRENT:**
```javascript
export async function addXpToUser(discordId, amount, reason = 'Unknown') {
  const user = await User.findOne({ discordId });
  if (!user) return null;

  const result = user.addXp(amount);
  await user.save();
  
  console.log(`💫 ${user.username} earned ${amount} XP (${reason})`);
  
  return { user, ...result };
}
```

**REPLACE WITH:**
```javascript
export async function addXpToUser(discordId, amount, reason = 'Unknown', applyMultipliers = true) {
  const user = await User.findOne({ discordId });
  if (!user) return null;

  // Apply multipliers if requested
  const finalAmount = applyMultipliers ? calculateFinalXp(amount, user) : amount;
  const result = user.addXp(finalAmount);
  await user.save();
  
  // Log with multiplier info
  const multiplierInfo = applyMultipliers && finalAmount !== amount 
    ? ` (${amount} base × multipliers)` 
    : '';
  console.log(`💫 ${user.username} earned ${finalAmount} XP${multiplierInfo} (${reason})`);
  
  broadcastUserUpdate(user.toObject(), 'xp_update');
  
  return { user, ...result, baseXp: amount, finalXp: finalAmount };
}
```

### Update recordQuizCompletion (Lines 359-395)

**CURRENT:**
```javascript
let xpEarned = XP_REWARDS.QUIZ_COMPLETE + (correct * XP_REWARDS.QUIZ_CORRECT);
if (correct === total) {
  xpEarned += XP_REWARDS.QUIZ_PERFECT;
}
const levelResult = user.addXp(xpEarned);
```

**REPLACE WITH:**
```javascript
let baseXp = XP_REWARDS.QUIZ_COMPLETE + (correct * XP_REWARDS.QUIZ_CORRECT);
if (correct === total) {
  baseXp += XP_REWARDS.QUIZ_PERFECT;
}

// Apply difficulty multiplier
const diffMultipliers = { easy: 0.8, medium: 1.0, hard: 1.5 };
baseXp = Math.floor(baseXp * (diffMultipliers[difficulty] || 1.0));

// Apply prestige and streak multipliers
const xpEarned = calculateFinalXp(baseXp, user);
const levelResult = user.addXp(xpEarned);
```

---

# FIX 7: ACHIEVEMENT XP BYPASS

## Files to Modify:
- `src/services/gamificationService.js`

### Fix checkAchievements (Lines 146-190)

**CURRENT (inside tryAdd function):**
```javascript
const tryAdd = (key) => {
  const ach = ACHIEVEMENTS[key];
  if (ach && !earned.includes(ach.name)) {
    earned.push(ach.name);
    newAchievements.push(ach.name);
    user.xp = (user.xp || 0) + (ach.xpBonus || 0);  // DIRECT ADD!
  }
};
```

**REPLACE WITH:**
```javascript
let achievementLevelUps = [];

const tryAdd = (key) => {
  const ach = ACHIEVEMENTS[key];
  if (ach && !earned.includes(ach.name)) {
    earned.push(ach.name);
    newAchievements.push(ach.name);
    
    // Use proper addXp method to handle level-ups
    if (ach.xpBonus && user.addXp) {
      const levelResult = user.addXp(ach.xpBonus);
      if (levelResult.leveledUp) {
        achievementLevelUps.push({
          achievement: ach.name,
          newLevel: levelResult.newLevel
        });
      }
    }
  }
};

// ... rest of achievement checks ...

if (newAchievements.length > 0) {
  user.achievements = earned;
  await user.save();
}

return { newAchievements, achievementLevelUps };
```

---

# FIX 8: MERGE DUAL STREAK SYSTEM

## Files to Modify:
- `src/database/models/User.js`
- `src/services/gamificationService.js`

### Update User.js updateStreak (Lines 258-289)

**REPLACE ENTIRE METHOD WITH:**
```javascript
// Unified streak update - handles both general activity and daily bonus
// Uses midnight-based day boundaries for consistency
userSchema.methods.updateStreak = function(options = {}) {
  const now = new Date();
  const timezone = this.timezone || 'UTC';
  
  // Calculate today's midnight in user's timezone
  // For simplicity, using UTC. For full timezone support, use luxon
  const todayMidnight = new Date(Date.UTC(
    now.getUTCFullYear(), 
    now.getUTCMonth(), 
    now.getUTCDate()
  ));
  const yesterdayMidnight = new Date(todayMidnight.getTime() - 24 * 60 * 60 * 1000);
  
  const lastActive = this.lastActive ? new Date(this.lastActive) : null;
  
  // First time user
  if (!lastActive) {
    this.streak = 0;  // No streak yet - need consecutive days
    this.dailyBonusStreak = 0;
    this.lastActive = now;
    return { streak: 0, isNewUser: true };
  }
  
  // Already active today (after today's midnight)
  if (lastActive >= todayMidnight) {
    this.lastActive = now;
    return { streak: this.streak, alreadyActiveToday: true };
  }
  
  // Active yesterday (between yesterday and today midnight)
  if (lastActive >= yesterdayMidnight) {
    this.streak = (this.streak || 0) + 1;
  } 
  // More than 1 day gap - streak broken
  else {
    this.streak = 1;  // Start new streak
  }
  
  // Sync dailyBonusStreak
  this.dailyBonusStreak = this.streak;
  
  // Track longest streak
  if (this.streak > (this.longestStreak || 0)) {
    this.longestStreak = this.streak;
  }
  
  this.lastActive = now;
  
  // NOTE: Does not save - caller should save
  return { 
    streak: this.streak, 
    longestStreak: this.longestStreak,
    streakIncremented: true 
  };
};
```

### Update claimDailyBonus in gamificationService.js

**SIMPLIFY to use unified streak:**
```javascript
export async function claimDailyBonus(user) {
  if (!user) return { success: false, hoursRemaining: 24 };

  const now = new Date();
  const lastClaim = user.lastDailyBonus ? new Date(user.lastDailyBonus) : null;
  
  const todayMidnight = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  
  // Check if already claimed today
  if (lastClaim && lastClaim >= todayMidnight) {
    const tomorrowMidnight = new Date(todayMidnight.getTime() + 24 * 60 * 60 * 1000);
    const msRemaining = tomorrowMidnight - now;
    const hoursRemaining = Math.ceil(msRemaining / (1000 * 60 * 60));
    const minutesRemaining = Math.ceil((msRemaining % (1000 * 60 * 60)) / (1000 * 60));
    
    return { 
      success: false, 
      hoursRemaining,
      minutesRemaining,
      nextClaimTime: tomorrowMidnight
    };
  }
  
  // Update streak using unified method
  const streakResult = user.updateStreak();
  const previousStreak = user.streak;
  
  // Calculate rewards
  const baseXp = XP_REWARDS.DAILY_BONUS;
  const streakBonus = Math.min(user.streak * XP_REWARDS.STREAK_BONUS, 100);
  
  // Milestone bonuses
  let milestoneBonus = 0;
  let milestoneMessage = null;
  const milestones = {
    7: { bonus: 200, message: '🎉 1 Week Streak! +200 XP Bonus!' },
    14: { bonus: 400, message: '⚡ 2 Week Streak! +400 XP Bonus!' },
    30: { bonus: 1000, message: '👑 1 Month Streak! +1000 XP Bonus!' },
    100: { bonus: 5000, message: '🏆 100 Day Legend! +5000 XP Bonus!' }
  };
  
  if (milestones[user.streak]) {
    milestoneBonus = milestones[user.streak].bonus;
    milestoneMessage = milestones[user.streak].message;
  }
  
  const totalXp = calculateFinalXp(baseXp + streakBonus + milestoneBonus, user);

  // Update user
  user.lastDailyBonus = now;
  const levelResult = user.addXp(totalXp);
  const achievements = await checkAchievements(user);
  
  await user.save();
  broadcastUserUpdate(user.toObject(), 'daily_bonus');

  return {
    success: true,
    xpEarned: totalXp,
    baseXp,
    streakBonus,
    milestoneBonus,
    milestoneMessage,
    streak: user.streak,
    previousStreak,
    leveledUp: levelResult.leveledUp,
    newLevel: levelResult.newLevel,
    achievements: achievements.newAchievements || achievements,
    nextClaimTime: new Date(todayMidnight.getTime() + 24 * 60 * 60 * 1000)
  };
}
```

---

# FIX 9: MEMORY CLEANUP

## Files to Modify:
- `src/services/quizService.js`

### Add cleanup interval (after Line 12)

**ADD:**
```javascript
// Cleanup expired memory sessions every 5 minutes
setInterval(() => {
  const now = Date.now();
  const EXPIRY_TIME = 30 * 60 * 1000; // 30 minutes
  
  for (const [userId, session] of memorySessionCache) {
    const startedAt = session.startedAt instanceof Date 
      ? session.startedAt.getTime() 
      : session.startedAt;
    
    if (now - startedAt > EXPIRY_TIME) {
      memorySessionCache.delete(userId);
      console.log(`🧹 Cleaned up expired quiz session for user ${userId}`);
    }
  }
}, 5 * 60 * 1000);
```

---

# FIX 10: ACCURACY HELPER

## Files to Modify:
- `src/utils/quizUtils.js` (add function)
- All files that calculate accuracy

### Add centralized function to quizUtils.js

**ADD:**
```javascript
/**
 * Calculate accuracy percentage safely
 * @param {number} correct - Number of correct answers
 * @param {number} total - Total number of questions
 * @returns {number} Accuracy as percentage (0-100)
 */
export function calculateAccuracy(correct, total) {
  if (!total || total === 0 || isNaN(total)) return 0;
  if (!correct || isNaN(correct)) return 0;
  
  const accuracy = (correct / total) * 100;
  return Math.round(Math.min(Math.max(accuracy, 0), 100));
}
```

### Then replace all accuracy calculations:

**FIND patterns like:**
```javascript
const accuracy = user.correctAnswers / user.totalQuestions;
// or
const accuracy = Math.round((user.correctAnswers / user.totalQuestions) * 100);
```

**REPLACE WITH:**
```javascript
import { calculateAccuracy } from '../utils/quizUtils.js';
const accuracy = calculateAccuracy(user.correctAnswers, user.totalQuestions);
```

---

# FIX 11: ATOMIC DATABASE OPERATIONS

## Files to Modify:
- `src/services/gamificationService.js`

### Example: Make addXpToUser atomic

**NEW VERSION:**
```javascript
export async function addXpToUser(discordId, amount, reason = 'Unknown', applyMultipliers = true) {
  try {
    // First get user to calculate multipliers
    const user = await User.findOne({ discordId });
    if (!user) return null;
    
    const finalAmount = applyMultipliers ? calculateFinalXp(amount, user) : amount;
    
    // Use atomic update
    const result = await User.findOneAndUpdate(
      { discordId },
      { 
        $inc: { 
          xp: finalAmount,
          'prestige.totalXpEarned': finalAmount
        },
        $set: { lastActive: new Date() }
      },
      { new: true }
    );
    
    if (!result) return null;
    
    // Check for level up in a separate operation
    let leveledUp = false;
    let levelsGained = 0;
    
    while (result.xp >= result.xpForNextLevel()) {
      await User.findOneAndUpdate(
        { discordId },
        { 
          $inc: { level: 1 },
          $set: { xp: result.xp - result.xpForNextLevel() }
        }
      );
      leveledUp = true;
      levelsGained++;
      result.xp -= result.xpForNextLevel();
      result.level++;
    }
    
    console.log(`💫 ${result.username} earned ${finalAmount} XP (${reason})`);
    broadcastUserUpdate(result.toObject(), 'xp_update');
    
    return { user: result, leveledUp, newLevel: result.level, levelsGained };
  } catch (error) {
    console.error('Error adding XP:', error);
    return null;
  }
}
```

---

# TESTING CHECKLIST

After applying fixes, test these scenarios:

## XP System
- [ ] Earn XP at level 1, verify XP needed matches formula
- [ ] Level up, verify XP resets correctly
- [ ] Check trading card shows correct XP progress
- [ ] Check website shows same XP as Discord
- [ ] Verify prestige.totalXpEarned updates

## Leaderboard
- [ ] Level 50 user with 0 XP ranks above Level 1 user with 99 XP
- [ ] Sorting by XP shows highest total XP first

## Tiers
- [ ] Level 50 user shows appropriate tier (not Bronze)
- [ ] Tier thresholds work with total XP

## Streaks
- [ ] New user starts with streak 0
- [ ] Second day activity gives streak 1
- [ ] Missing a day resets to 1
- [ ] Streak multiplier actually applies to XP

## Prestige
- [ ] Prestige level displays correctly (number, not [object Object])
- [ ] Prestige multiplier applies to XP gains
- [ ] totalXpEarned tracks correctly

## Achievements
- [ ] Achievement XP can trigger level ups
- [ ] Achievements don't leave user with XP > xpForNextLevel

---

**END OF FIX IMPLEMENTATIONS**
