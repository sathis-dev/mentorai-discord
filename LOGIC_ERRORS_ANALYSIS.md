# MentorAI Bot - Comprehensive Logic & Science Errors Analysis
## Complete Documentation for DeepSeek AI Analysis

**Document Version:** 1.0  
**Analysis Date:** January 2025  
**Purpose:** Complete identification of ALL logic, science, and functional errors in the MentorAI Discord bot codebase for systematic fixing  
**Target:** DeepSeek AI DeepThink Analysis and Planning

---

# TABLE OF CONTENTS

1. [CRITICAL XP FORMULA INCONSISTENCY](#1-critical-xp-formula-inconsistency)
2. [XP REPRESENTATION CONFUSION](#2-xp-representation-confusion)
3. [DUAL STREAK SYSTEM CONFLICT](#3-dual-streak-system-conflict)
4. [PRESTIGE SYSTEM TYPE MISMATCH](#4-prestige-system-type-mismatch)
5. [ACHIEVEMENT SYSTEM XP BYPASS](#5-achievement-system-xp-bypass)
6. [LEADERBOARD SORTING ERROR](#6-leaderboard-sorting-error)
7. [QUIZ SESSION MEMORY LEAK](#7-quiz-session-memory-leak)
8. [RATE LIMITING PERSISTENCE ISSUE](#8-rate-limiting-persistence-issue)
9. [ELIMINATED OPTIONS NOT RESETTING](#9-eliminated-options-not-resetting)
10. [UPDATESTREAK DOUBLE SAVE ISSUE](#10-updatestreak-double-save-issue)
11. [TIER CALCULATION USING WRONG XP](#11-tier-calculation-using-wrong-xp)
12. [AI MODEL INCONSISTENCY](#12-ai-model-inconsistency)
13. [JSON PARSING FRAGILITY](#13-json-parsing-fragility)
14. [USER CONTEXT INCOMPLETE FALLBACK](#14-user-context-incomplete-fallback)
15. [QUIZ COMPLETION XP NOT USING ADDXP](#15-quiz-completion-xp-not-using-addxp)
16. [LEARNING PROGRESS IN-MEMORY LOSS](#16-learning-progress-in-memory-loss)
17. [PRESTIGE MULTIPLIER NOT APPLIED](#17-prestige-multiplier-not-applied)
18. [STREAK MULTIPLIER NOT APPLIED](#18-streak-multiplier-not-applied)
19. [FIRST-TIME USER STREAK BUG](#19-first-time-user-streak-bug)
20. [TIMEZONE HANDLING IGNORED](#20-timezone-handling-ignored)
21. [TOTAL XP TRACKING ISSUE](#21-total-xp-tracking-issue)
22. [WEBSITE API XP FORMULA MISMATCH](#22-website-api-xp-formula-mismatch)
23. [ACCURACY CALCULATION EDGE CASES](#23-accuracy-calculation-edge-cases)
24. [QUIZ DIFFICULTY MULTIPLIER INCONSISTENCY](#24-quiz-difficulty-multiplier-inconsistency)
25. [CONCURRENCY ISSUES](#25-concurrency-issues)

---

# 1. CRITICAL XP FORMULA INCONSISTENCY

## Severity: 🔴 CRITICAL

## Problem Description
The bot uses TWO DIFFERENT XP formulas in different files, causing major inconsistencies in how XP and progress are calculated and displayed.

## Files Affected
- `src/config/brandSystem.js` (Line 392)
- `src/bot/commands/card.js` (Line 224)
- `src/database/models/User.js` (Line 237)
- `website/index.html` (JavaScript section)

## Current Code Analysis

### Formula 1: brandSystem.js (Used by profile, daily, most commands)
```javascript
// File: src/config/brandSystem.js Line 392
export function xpForLevel(level) {
  return Math.floor(100 * Math.pow(1.5, level - 1));
}
```
**What this calculates:** XP needed to level up FROM level N to level N+1
- xpForLevel(1) = 100 XP (to go from level 1 → 2)
- xpForLevel(2) = 150 XP (to go from level 2 → 3)
- xpForLevel(5) = 506 XP (to go from level 5 → 6)
- xpForLevel(10) = 2,562 XP (to go from level 10 → 11)

### Formula 2: card.js (Trading card display)
```javascript
// File: src/bot/commands/card.js Line 224
function calculateXPForLevel(level) {
  return Math.floor(100 * Math.pow(level, 1.5));
}
```
**What this calculates:** Cumulative XP to reach level N (COMPLETELY DIFFERENT CONCEPT)
- calculateXPForLevel(1) = 100 XP
- calculateXPForLevel(2) = 282 XP
- calculateXPForLevel(5) = 1,118 XP
- calculateXPForLevel(10) = 3,162 XP

### Formula 3: User.js (Matches brandSystem)
```javascript
// File: src/database/models/User.js Line 237
userSchema.methods.xpForNextLevel = function() {
  return Math.floor(100 * Math.pow(1.5, this.level - 1));
};
```

### Formula 4: Website (Matches card.js - WRONG)
```javascript
// File: website/index.html JavaScript
function calculateXPForLevel(level) {
    return Math.floor(100 * Math.pow(level, 1.5));
}
```

## The Logic Error
The card.js formula uses `level` as the exponent base, while brandSystem uses `1.5` as the base with `level-1` as exponent. These produce completely different numbers:

| Level | brandSystem (per-level) | card.js (cumulative-style) | Difference |
|-------|-------------------------|---------------------------|------------|
| 1     | 100                     | 100                       | 0          |
| 5     | 506                     | 1,118                     | 612        |
| 10    | 2,562                   | 3,162                     | 600        |
| 20    | 18,837                  | 8,944                     | -9,893     |
| 50    | 2,379,586               | 35,355                    | -2,344,231 |

## Impact
1. **Trading card shows wrong XP progress** - Progress bar is calculated incorrectly
2. **Website shows wrong XP needed** - Users see different numbers on website vs Discord
3. **User confusion** - "I need 1118 XP" on card vs "I need 506 XP" on profile
4. **Progress bar percentages wrong** - Could show 50% when actually 80%

## Root Cause
The card.js formula was likely intended to calculate CUMULATIVE total XP to reach a level, but was confused with the PER-LEVEL XP requirement formula.

## Correct Solution
ALL files should use ONE formula. The brandSystem formula is correct for PER-LEVEL XP:
```javascript
xpForLevel(level) = Math.floor(100 * Math.pow(1.5, level - 1))
```

For cumulative XP (total XP from level 1 to level N), the formula should be:
```javascript
totalXpForLevel(level) = sum from i=1 to level-1 of (100 * 1.5^(i-1))
// Or approximately: 100 * (1.5^(level-1) - 1) / 0.5
```

---

# 2. XP REPRESENTATION CONFUSION

## Severity: 🔴 CRITICAL

## Problem Description
The `user.xp` field represents DIFFERENT things in different contexts, causing systemic calculation errors throughout the bot.

## Files Affected
- `src/database/models/User.js` (addXp method, lines 240-253)
- `src/bot/commands/card.js` (getTier function, line 196)
- `src/bot/commands/leaderboard.js` (sorting by xp)
- `src/services/gamificationService.js` (getLeaderboard)

## Current Code Analysis

### How addXp Works
```javascript
// File: src/database/models/User.js Lines 240-253
userSchema.methods.addXp = function(amount) {
  this.xp += amount;  // Add XP to current level XP
  
  let leveledUp = false;
  let levelsGained = 0;
  while (this.xp >= this.xpForNextLevel()) {
    this.xp -= this.xpForNextLevel();  // SUBTRACT XP when leveling!
    this.level += 1;
    leveledUp = true;
    levelsGained++;
  }
  
  return { leveledUp, newLevel: this.level, levelsGained };
};
```

### Key Behavior
When user levels up, XP is SUBTRACTED. This means:
- `user.xp` = XP WITHIN current level (0 to xpForNextLevel-1)
- `user.xp` does NOT represent total lifetime XP

### Example Scenario
1. User at Level 1 with 0 XP
2. User earns 150 XP
3. xpForNextLevel(1) = 100
4. User levels up to Level 2
5. user.xp = 150 - 100 = 50 (NOT 150!)
6. User at Level 2 with 50 XP

### Where This Breaks

#### Problem 1: Tier Calculation in card.js
```javascript
// File: src/bot/commands/card.js Lines 196-207
function getTier(xp) {
  const tiers = [
    { min: 0, name: 'Bronze', emoji: '🥉' },
    { min: 1000, name: 'Silver', emoji: '🥈' },
    { min: 5000, name: 'Gold', emoji: '🥇' },
    { min: 15000, name: 'Platinum', emoji: '💠' },
    { min: 50000, name: 'Diamond', emoji: '💎' },
    { min: 100000, name: 'Master', emoji: '👑' }
  ];
  // This uses user.xp which is WITHIN-LEVEL XP, not total!
}
```

**Bug:** A Level 50 user might have only 500 XP (within level) but should be Diamond tier. Instead they show as Bronze because 500 < 1000.

#### Problem 2: Leaderboard Sorting
```javascript
// File: src/bot/commands/leaderboard.js Lines 85-88
switch (type) {
  case 'xp':
    sortField = { xp: -1 };  // Sorts by WITHIN-LEVEL XP!
    break;
}
```

**Bug:** A Level 50 user with 0 XP (just leveled up) would rank BELOW a Level 1 user with 99 XP. This is completely wrong.

## Impact
1. **Leaderboard rankings are wrong** - High level users can appear at bottom
2. **Tier display is wrong** - Level 100 user shows as "Bronze"
3. **Stats are misleading** - "Total XP: 500" when user actually earned 500,000 lifetime XP
4. **Rarity calculations wrong** - Based on wrong XP values

## Correct Solution
Need to track TWO separate XP values:
1. `user.xp` - XP within current level (for progress bars)
2. `user.totalXpEarned` - Lifetime XP (for tiers, leaderboards, rarity)

The prestige system has `prestige.totalXpEarned` but it's not used consistently.

---

# 3. DUAL STREAK SYSTEM CONFLICT

## Severity: 🟠 HIGH

## Problem Description
The bot maintains TWO separate streak tracking systems that use different logic and can become desynchronized.

## Files Affected
- `src/database/models/User.js` (streak field, updateStreak method)
- `src/services/gamificationService.js` (dailyBonusStreak, claimDailyBonus)

## Current Code Analysis

### Streak Fields in User Schema
```javascript
// File: src/database/models/User.js Lines 7-10
const userSchema = new mongoose.Schema({
  streak: { type: Number, default: 0 },           // General activity streak
  lastActive: { type: Date, default: Date.now },
  lastDailyBonus: { type: Date },                 // Daily bonus specific
  dailyBonusStreak: { type: Number, default: 0 }, // Separate daily bonus streak
  // ...
});
```

### updateStreak Method Logic
```javascript
// File: src/database/models/User.js Lines 258-289
userSchema.methods.updateStreak = async function() {
  const now = new Date();
  const lastActive = this.lastActive;
  
  // First time user
  if (!lastActive || this.streak === 0) {
    this.streak = 1;
    this.lastActive = now;
    await this.save();
    return this.streak;
  }
  
  const diffHours = (now - lastActive) / (1000 * 60 * 60);
  
  // Already active today
  if (diffHours < 24) {
    this.lastActive = now;
    await this.save();
    return this.streak;
  }
  
  // 24-48 hours: increment
  if (diffHours >= 24 && diffHours < 48) {
    this.streak += 1;
  } 
  // >48 hours: reset
  else {
    this.streak = 1;
  }
  
  this.lastActive = now;
  await this.save();
  return this.streak;
};
```

### claimDailyBonus Logic
```javascript
// File: src/services/gamificationService.js Lines 236-320
export async function claimDailyBonus(user) {
  const now = new Date();
  const lastClaim = user.lastDailyBonus;
  
  const todayMidnight = new Date(Date.UTC(...));
  const yesterdayMidnight = new Date(todayMidnight - 24*60*60*1000);
  
  // Calculate dailyBonusStreak separately
  let newStreak = 1;
  if (lastClaim >= yesterdayMidnight) {
    newStreak = (user.dailyBonusStreak || 0) + 1;
  }
  
  // Update both streaks
  user.dailyBonusStreak = newStreak;
  user.streak = newStreak;  // Sync the two
  
  await user.save();
}
```

## The Logic Errors

### Error 1: Different Time Logic
- `updateStreak`: Uses 24/48 hour rolling window from last activity
- `claimDailyBonus`: Uses midnight-to-midnight UTC day boundaries

**Conflict Example:**
1. User claims daily at 11pm Day 1
2. User active at 1am Day 2 (2 hours later)
3. `updateStreak`: diffHours=2, within 24h, no change
4. `claimDailyBonus`: New day, would increment
5. Streaks now out of sync

### Error 2: Double Save in updateStreak
```javascript
// updateStreak saves inside the method
await this.save();

// But calling code often saves again
await user.updateStreak();
await user.save();  // Second save!
```
This wastes database operations and could cause race conditions.

### Error 3: Sync Direction
`claimDailyBonus` sets `user.streak = newStreak` which overwrites any `updateStreak` calculations. But `updateStreak` doesn't sync back to `dailyBonusStreak`.

## Impact
1. **Inconsistent streak display** - Profile shows 5, daily bonus shows 3
2. **Achievement triggers wrong** - "7 day streak" might never trigger
3. **XP multipliers inconsistent** - Different multiplier calculated each time
4. **User confusion** - "Why did my streak reset?"

## Correct Solution
Should have ONE streak system with clear rules:
1. Single `streak` field
2. Single `lastStreakUpdate` date field
3. One function that handles all streak logic
4. Clear timezone-aware day boundary checking

---

# 4. PRESTIGE SYSTEM TYPE MISMATCH

## Severity: 🔴 CRITICAL

## Problem Description
The prestige field is defined as a nested OBJECT in the schema, but some code reads it as a NUMBER.

## Files Affected
- `src/database/models/User.js` (prestige schema definition)
- `src/bot/commands/card.js` (prestige reading)
- `src/bot/commands/prestige.js` (prestige handling)

## Current Code Analysis

### Schema Definition
```javascript
// File: src/database/models/User.js Lines 139-150
prestige: {
  level: { type: Number, default: 0 },
  totalXpEarned: { type: Number, default: 0 },
  bonusMultiplier: { type: Number, default: 1.0 },
  prestigeHistory: [{
    level: Number,
    xpAtPrestige: Number,
    date: { type: Date, default: Date.now }
  }]
},
```

### card.js Reading
```javascript
// File: src/bot/commands/card.js Line 46
const prestige = user.prestige || 0;  // WRONG!
```

### Embed Display
```javascript
// File: src/bot/commands/card.js Lines 122-126
{
  name: '⭐ Prestige',
  value: `\`${prestige}\``,  // Shows "[object Object]" or crashes
  inline: true
}
```

### Website URL Building
```javascript
// File: src/bot/commands/card.js Line 238
prestige: (user.prestige || 0).toString()  // Becomes "[object Object]"
```

## The Logic Error
When `user.prestige` is an object like `{ level: 2, totalXpEarned: 50000, ... }`:
- `user.prestige || 0` returns the OBJECT (truthy)
- `prestige.toString()` returns "[object Object]"
- String interpolation shows "[object Object]"
- Numeric operations return NaN

## Impact
1. **Trading card shows "[object Object]"** for prestige
2. **Website URL contains garbage** parameters
3. **Possible crashes** if code expects number
4. **Prestige level never displays correctly**

## Correct Solution
```javascript
const prestigeLevel = user.prestige?.level || 0;
const prestigeMultiplier = user.prestige?.bonusMultiplier || 1.0;
```

---

# 5. ACHIEVEMENT SYSTEM XP BYPASS

## Severity: 🟠 HIGH

## Problem Description
When achievements are awarded, the XP bonus is added DIRECTLY to user.xp, bypassing the addXp method which handles level-up logic.

## Files Affected
- `src/services/gamificationService.js` (checkAchievements function)

## Current Code Analysis

```javascript
// File: src/services/gamificationService.js Lines 146-190
export async function checkAchievements(user) {
  const newAchievements = [];
  const earned = [...(user.achievements || [])];

  const tryAdd = (key) => {
    const ach = ACHIEVEMENTS[key];
    if (ach && !earned.includes(ach.name)) {
      earned.push(ach.name);
      newAchievements.push(ach.name);
      user.xp = (user.xp || 0) + (ach.xpBonus || 0);  // DIRECT ADD!
    }
  };

  // Achievement checks...
  if (user.streak >= 3) tryAdd('STREAK_3');
  // etc...

  if (newAchievements.length > 0) {
    user.achievements = earned;
    await user.save();
  }

  return newAchievements;
}
```

## The Logic Error

### What Should Happen
```javascript
const result = user.addXp(ach.xpBonus);  // Properly handles level-up
if (result.leveledUp) {
  // User could level up from achievement XP!
}
```

### What Actually Happens
```javascript
user.xp = user.xp + ach.xpBonus;  // Just adds, no level-up check
```

## Example Bug
1. User at Level 1 with 90 XP (needs 100 to level)
2. User gets "STREAK_3" achievement (+100 XP bonus)
3. Direct add: user.xp = 190
4. User is now at Level 1 with 190 XP
5. But xpForNextLevel(1) = 100
6. User should be Level 2 with 90 XP!

## Impact
1. **Missed level-ups** - User could have 10,000 XP at Level 1
2. **Incorrect progress display** - "1000 / 100 XP" shows as 1000%
3. **Achievement XP not tracked** - prestige.totalXpEarned not updated
4. **No level-up notification** - User misses celebration

## Correct Solution
```javascript
const tryAdd = (key) => {
  const ach = ACHIEVEMENTS[key];
  if (ach && !earned.includes(ach.name)) {
    earned.push(ach.name);
    newAchievements.push(ach.name);
    
    // Use proper XP adding method
    const levelResult = user.addXp(ach.xpBonus || 0);
    if (levelResult.leveledUp) {
      // Track level-up from achievement
      newAchievements.push(`Level ${levelResult.newLevel} reached!`);
    }
  }
};
```

---

# 6. LEADERBOARD SORTING ERROR

## Severity: 🔴 CRITICAL

## Problem Description
The XP leaderboard sorts by `user.xp` which is WITHIN-LEVEL XP, not total XP earned. This produces completely wrong rankings.

## Files Affected
- `src/bot/commands/leaderboard.js` (getLeaderboardData function)
- `src/services/gamificationService.js` (getLeaderboard function)

## Current Code Analysis

```javascript
// File: src/bot/commands/leaderboard.js Lines 85-88
switch (type) {
  case 'xp':
    sortField = { xp: -1 };  // Sorts by within-level XP!
    break;
}

// File: src/services/gamificationService.js Lines 194-210
export async function getLeaderboard(limit = 10, sortBy = 'xp') {
  const sortField = sortBy === 'level' ? { level: -1, xp: -1 } : 
                    sortBy === 'streak' ? { streak: -1 } : 
                    { xp: -1 };  // Same problem
}
```

## Example Bug

| User    | Level | XP (within level) | Actual Rank | Shown Rank |
|---------|-------|-------------------|-------------|------------|
| Alice   | 50    | 0 (just leveled)  | 1st         | 4th        |
| Bob     | 30    | 50                | 2nd         | 3rd        |
| Charlie | 10    | 500               | 3rd         | 2nd        |
| Dave    | 1     | 99                | 4th         | 1st        |

Dave at Level 1 with 99 XP ranks ABOVE Alice at Level 50 because 99 > 0.

## Impact
1. **Rankings completely wrong** - Top players appear at bottom
2. **Demotivating for advanced users** - "Why am I #50 when I'm Level 100?"
3. **Rewards given to wrong users** - If leaderboard used for prizes
4. **Destroys competitive motivation**

## Correct Solution
Should sort by LEVEL first, then XP within level:
```javascript
case 'xp':
  sortField = { level: -1, xp: -1 };
  break;
```

Or calculate total XP:
```javascript
case 'xp':
  // Use aggregation to calculate total XP
  // totalXP = sum of XP needed for all previous levels + current xp
```

---

# 7. QUIZ SESSION MEMORY LEAK

## Severity: 🟡 MEDIUM

## Problem Description
The in-memory fallback session cache (`memorySessionCache`) is never cleaned up, leading to memory growth.

## Files Affected
- `src/services/quizService.js` (memorySessionCache)

## Current Code Analysis

```javascript
// File: src/services/quizService.js Lines 11-12
const memorySessionCache = new Map();  // Never cleaned!

// Only cleared on quiz completion
memorySessionCache.delete(userId);
```

## The Problem
1. User starts quiz (session added to Map)
2. User abandons quiz (never completes)
3. Session stays in Map forever
4. Memory grows over time
5. Bot restart is only way to clear

## Impact
1. **Memory growth** - Potentially unbounded
2. **Stale sessions** - Old sessions could be retrieved
3. **No cleanup** - Unlike MongoDB TTL index

## Correct Solution
Add periodic cleanup:
```javascript
setInterval(() => {
  const now = Date.now();
  for (const [userId, session] of memorySessionCache) {
    if (now - session.startedAt > 30 * 60 * 1000) {  // 30 min
      memorySessionCache.delete(userId);
    }
  }
}, 5 * 60 * 1000);  // Every 5 min
```

---

# 8. RATE LIMITING PERSISTENCE ISSUE

## Severity: 🟡 MEDIUM

## Problem Description
Rate limiting uses an in-memory Map that resets on bot restart, allowing rate limit bypass.

## Files Affected
- `src/services/quizService.js` (rateLimitMap)

## Current Code Analysis

```javascript
// File: src/services/quizService.js Lines 15-17
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const MAX_AI_CALLS_PER_MINUTE = 5;
```

## The Problem
1. User generates 5 quizzes (hits rate limit)
2. Bot restarts (crash, deploy, etc.)
3. rateLimitMap is reset to empty
4. User can immediately generate 5 more quizzes
5. Repeat to abuse AI API

## Impact
1. **Rate limit bypass** - Easy to circumvent
2. **API cost increase** - More AI calls than intended
3. **Potential abuse** - Malicious users can spam

## Correct Solution
Store rate limit data in Redis or MongoDB with TTL:
```javascript
// In MongoDB
await RateLimit.findOneAndUpdate(
  { discordId: userId },
  { $push: { calls: { $each: [Date.now()], $slice: -MAX_CALLS } } },
  { upsert: true }
);
```

---

# 9. ELIMINATED OPTIONS NOT RESETTING

## Severity: 🟡 MEDIUM

## Problem Description
The 50/50 lifeline's eliminated options may not properly reset between questions in some code paths.

## Files Affected
- `src/services/quizService.js` (useFiftyFifty, submitAnswer)

## Current Code Analysis

```javascript
// File: src/services/quizService.js Lines 173-199
export async function useFiftyFifty(userId) {
  const session = await getActiveSession(userId);
  // ...
  session.eliminatedOptions = eliminated;  // Set
  if (session.save) await session.save();
}

// File: src/services/quizService.js Lines 253-280
export async function submitAnswer(userId, answerIndex, user) {
  // ...
  session.eliminatedOptions = [];  // Reset
  session.currentQuestion++;
  if (session.save) await session.save();
}
```

## The Problem
The reset happens in `submitAnswer`, but if user:
1. Uses 50/50 on question 3
2. Skips question 3 (doesn't submit answer)
3. `submitAnswer` not called
4. Goes to question 4
5. eliminatedOptions still has question 3's eliminated options!

## Impact
1. **Wrong options highlighted** - Options eliminated for wrong question
2. **Confusing UI** - "Why are options A and C greyed out?"
3. **Unfair advantage/disadvantage** - Random options disabled

## Correct Solution
Reset eliminatedOptions when getting next question:
```javascript
export async function getCurrentQuestion(userId) {
  const session = await getActiveSession(userId);
  // Reset for new question
  if (session.currentQuestion !== session._lastQuestionIndex) {
    session.eliminatedOptions = [];
    session._lastQuestionIndex = session.currentQuestion;
  }
  // ...
}
```

---

# 10. UPDATESTREAK DOUBLE SAVE ISSUE

## Severity: 🟡 MEDIUM

## Problem Description
The `updateStreak` method saves the user internally, but calling code often saves again, causing unnecessary database operations.

## Files Affected
- `src/database/models/User.js` (updateStreak method)
- Multiple command files that call updateStreak

## Current Code Analysis

```javascript
// File: src/database/models/User.js Lines 258-289
userSchema.methods.updateStreak = async function() {
  // ... logic ...
  await this.save();  // Saves internally
  return this.streak;
};

// Typical calling pattern
const user = await getOrCreateUser(id, name);
await user.updateStreak();  // Saves
await someOtherOperation(user);
await user.save();  // Saves AGAIN - unnecessary!
```

## The Problem
1. Double database writes
2. Potential race conditions
3. Inconsistent pattern (addXp doesn't save, updateStreak does)

## Impact
1. **Performance overhead** - 2x database operations
2. **Race conditions** - Two saves could conflict
3. **Inconsistent API** - Some methods save, some don't

## Correct Solution
Methods should NOT save internally. Caller decides when to save:
```javascript
userSchema.methods.updateStreak = function() {
  // ... logic (no await this.save()) ...
  return this.streak;
};

// Caller batches saves
user.updateStreak();
user.addXp(100);
await user.save();  // Single save
```

---

# 11. TIER CALCULATION USING WRONG XP

## Severity: 🔴 CRITICAL

## Problem Description
Tier determination uses `user.xp` (within-level XP) instead of total lifetime XP.

## Files Affected
- `src/bot/commands/card.js` (getTier function)

## Current Code Analysis

```javascript
// File: src/bot/commands/card.js Lines 196-207
function getTier(xp) {
  const tiers = [
    { min: 0, name: 'Bronze', emoji: '🥉' },
    { min: 1000, name: 'Silver', emoji: '🥈' },
    { min: 5000, name: 'Gold', emoji: '🥇' },
    { min: 15000, name: 'Platinum', emoji: '💠' },
    { min: 50000, name: 'Diamond', emoji: '💎' },
    { min: 100000, name: 'Master', emoji: '👑' }
  ];
  
  for (let i = tiers.length - 1; i >= 0; i--) {
    if (xp >= tiers[i].min) return tiers[i];
  }
  return tiers[0];
}

// Called with:
const tier = getTier(user.xp);  // WRONG - uses within-level XP!
```

## Example Bug
A Level 100 user who just leveled up:
- `user.xp` = 0 (reset on level-up)
- `getTier(0)` returns Bronze
- User displays as "Bronze" tier despite being Level 100!

## Impact
1. **Incorrect tier display** - Top players show as lowest tier
2. **Demotivating** - "Why am I Bronze after all this work?"
3. **Trading card looks wrong**

## Correct Solution
Use calculated total XP or prestige.totalXpEarned:
```javascript
const totalXp = user.prestige?.totalXpEarned || calculateTotalXp(user);
const tier = getTier(totalXp);
```

---

# 12. AI MODEL INCONSISTENCY

## Severity: 🟡 MEDIUM

## Problem Description
Different files use different AI models and configurations, leading to inconsistent behavior.

## Files Affected
- `src/ai/index.js` (uses gpt-4o, o1)
- `src/ai/openai.js` (uses gpt-4o-mini)
- `src/ai/gemini.js` (uses gemini-2.0-flash)

## Current Code Analysis

```javascript
// File: src/ai/index.js - Quiz generation
model: 'o1',  // Most advanced, expensive

// File: src/ai/openai.js - Lesson generation
model: 'gpt-4o-mini',  // Fast, cheap

// File: src/ai/gemini.js - Fast quiz generation
model: 'gemini-2.0-flash',  // Different provider entirely
```

## The Problem
1. No centralized model configuration
2. Hard to change models
3. Different quality levels for different features
4. Confusing debugging

## Impact
1. **Inconsistent quality** - Some features better than others
2. **Cost unpredictability** - o1 is much more expensive
3. **Maintenance burden** - Multiple places to update

## Correct Solution
Centralized config:
```javascript
// config/aiConfig.js
export const AI_MODELS = {
  quiz: process.env.QUIZ_MODEL || 'gpt-4o-mini',
  lesson: process.env.LESSON_MODEL || 'gpt-4o-mini',
  // etc.
};
```

---

# 13. JSON PARSING FRAGILITY

## Severity: 🟡 MEDIUM

## Problem Description
AI response JSON parsing has multiple fallback methods but can still fail on edge cases.

## Files Affected
- `src/ai/index.js` (parseAIJson function)
- `src/ai/gemini.js` (response parsing)

## Current Code Analysis

```javascript
// File: src/ai/index.js Lines 44-95
function parseAIJson(response) {
  if (!response) return null;

  // Try direct parse
  try {
    return JSON.parse(response);
  } catch (e) { /* continue */ }

  // Try extracting JSON block
  const jsonMatch = response.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) {
    try {
      return JSON.parse(jsonMatch[1]);
    } catch (e) { /* continue */ }
  }

  // Try finding raw JSON object
  const objectMatch = response.match(/\{[\s\S]*\}/);
  if (objectMatch) {
    try {
      return JSON.parse(objectMatch[0]);
    } catch (e) { /* continue */ }
  }

  return null;
}
```

## Edge Cases That Fail
1. JSON with trailing commas (common AI mistake)
2. JSON with comments
3. Multiple JSON objects in response
4. JSON with unescaped characters
5. Nested braces that confuse regex

## Impact
1. **Quiz generation fails** - Returns null, fallback used
2. **Lessons fail** - Same issue
3. **Silent failures** - Just logs error, continues
4. **User sees generic content** - Fallback is less engaging

## Correct Solution
Use robust JSON parsing library:
```javascript
import { parse as parseJson5 } from 'json5';  // Handles trailing commas, comments

function parseAIJson(response) {
  try {
    return parseJson5(extractJson(response));
  } catch (e) {
    // Try repair library
    return jsonrepair(response);
  }
}
```

---

# 14. USER CONTEXT INCOMPLETE FALLBACK

## Severity: 🟢 LOW

## Problem Description
When database errors occur, the fallback user object has incomplete method implementations.

## Files Affected
- `src/services/gamificationService.js` (getOrCreateUser catch block)

## Current Code Analysis

```javascript
// File: src/services/gamificationService.js Lines 71-86
catch (error) {
  console.error('Error in getOrCreateUser:', error);
  return {
    discordId,
    username: safeUsername,
    xp: 0,
    level: 1,
    // ... basic fields ...
    xpForNextLevel: function() { return Math.floor(100 * Math.pow(1.5, (this.level || 1) - 1)); },
    addXp: async () => ({ leveledUp: false, newLevel: 1 }),  // BROKEN
    updateStreak: async () => 0,  // BROKEN
    save: async () => {}
  };
}
```

## The Problem
The fallback `addXp` function:
1. Doesn't actually modify xp
2. Always returns same result
3. User can't progress in fallback mode

## Impact
1. **Degraded experience** - User can't earn XP during DB issues
2. **Lost progress** - Any XP earned is discarded
3. **Silent failure** - User doesn't know DB is down

## Correct Solution
Better fallback that queues changes:
```javascript
const pendingChanges = [];
return {
  // ...
  addXp: function(amount) {
    this.xp += amount;
    pendingChanges.push({ type: 'xp', amount });
    // Check level up
    while (this.xp >= this.xpForNextLevel()) {
      this.xp -= this.xpForNextLevel();
      this.level++;
    }
    return { leveledUp: this.level > 1, newLevel: this.level };
  },
  sync: async () => {
    // Retry saving to DB when it's back
  }
};
```

---

# 15. QUIZ COMPLETION XP NOT USING ADDXP

## Severity: 🟡 MEDIUM

## Problem Description
Quiz completion in quizService calculates XP but the actual XP addition happens elsewhere, potentially inconsistently.

## Files Affected
- `src/services/quizService.js` (completeQuiz function)
- `src/services/gamificationService.js` (recordQuizCompletion)

## Current Code Analysis

```javascript
// File: src/services/quizService.js Lines 298-345
async function completeQuiz(userId, user, session) {
  // Calculate XP
  let xpEarned = XP_REWARDS.QUIZ_COMPLETE;
  xpEarned += score * XP_REWARDS.QUIZ_CORRECT;
  if (isPerfect) xpEarned += XP_REWARDS.QUIZ_PERFECT;
  
  // Apply difficulty multiplier
  xpEarned = Math.floor(xpEarned * (difficultyMultiplier[session.difficulty] || 1));

  // BUT: This XP is just returned, not added to user!
  return {
    xpEarned,  // Just a number
    // ...
  };
}
```

## The Problem
`completeQuiz` calculates XP but doesn't add it. The caller must:
1. Get the result
2. Call `user.addXp(result.xpEarned)`
3. Save the user

If any caller forgets step 2, XP is lost.

## Impact
1. **Lost XP** - If caller doesn't handle properly
2. **Inconsistent handling** - Different callers might handle differently
3. **Difficult debugging** - "Where does XP actually get added?"

## Correct Solution
Let completeQuiz handle XP addition:
```javascript
async function completeQuiz(userId, user, session) {
  // ... calculate xpEarned ...
  
  // Actually add the XP
  if (user && user.addXp) {
    const levelResult = user.addXp(xpEarned);
    await user.save();
    return { xpEarned, ...levelResult };
  }
}
```

---

# 16. LEARNING PROGRESS IN-MEMORY LOSS

## Severity: 🟡 MEDIUM

## Problem Description
Learning progress tracking uses in-memory Map that is lost on restart.

## Files Affected
- `src/services/learningService.js` (userLearningData)

## Current Code Analysis

```javascript
// File: src/services/learningService.js Lines 4-5
const userLearningData = new Map();  // Lost on restart!

// File: src/services/learningService.js Lines 119-134
function trackLearningProgress(userId, topic, type) {
  if (!userLearningData.has(userId)) {
    userLearningData.set(userId, {
      lessonsCompleted: [],
      quizzesCompleted: [],
      topicsStudied: new Set(),
      lastActivity: null
    });
  }
  // ... updates ...
}
```

## The Problem
1. Bot restarts (deploy, crash, etc.)
2. userLearningData = new Map() (empty)
3. All learning progress tracking lost
4. Topic recommendations reset
5. User appears as new learner

## Impact
1. **Lost personalization** - Recommendations reset
2. **Repeated content** - Already-learned topics recommended again
3. **Poor user experience** - "I already learned this"

## Correct Solution
Store in MongoDB (User model already has topicsStudied):
```javascript
function trackLearningProgress(userId, topic, type) {
  await User.findOneAndUpdate(
    { discordId: userId },
    { 
      $addToSet: { topicsStudied: topic.toLowerCase() },
      $set: { lastActive: new Date() }
    }
  );
}
```

---

# 17. PRESTIGE MULTIPLIER NOT APPLIED

## Severity: 🔴 CRITICAL

## Problem Description
The prestige system tracks `bonusMultiplier` but this multiplier is never actually applied to XP gains.

## Files Affected
- `src/database/models/User.js` (prestige.bonusMultiplier field)
- `src/services/gamificationService.js` (addXpToUser, recordQuizCompletion)
- `src/bot/commands/prestige.js` (defines multipliers)

## Current Code Analysis

```javascript
// File: src/bot/commands/prestige.js Lines 8-19
const PRESTIGE_BONUSES = {
  1: { multiplier: 1.05, ... },  // +5% XP
  2: { multiplier: 1.10, ... },  // +10% XP
  // ...
  10: { multiplier: 1.50, ... }  // +50% XP
};

// File: src/services/gamificationService.js Lines 123-136
export async function addXpToUser(discordId, amount, reason = 'Unknown') {
  const user = await User.findOne({ discordId });
  const result = user.addXp(amount);  // NO MULTIPLIER APPLIED!
  await user.save();
  return { user, ...result };
}

// File: src/services/gamificationService.js Lines 359-395
export async function recordQuizCompletion(user, correct, total, topic) {
  let xpEarned = XP_REWARDS.QUIZ_COMPLETE + (correct * XP_REWARDS.QUIZ_CORRECT);
  // NO PRESTIGE MULTIPLIER!
  const levelResult = user.addXp(xpEarned);
}
```

## The Problem
Users prestige to get XP bonuses, but:
1. Multiplier stored: `user.prestige.bonusMultiplier = 1.10`
2. XP earned: 100
3. XP actually added: 100 (NOT 110!)
4. The whole point of prestige is broken

## Impact
1. **Prestige is meaningless** - No actual benefit
2. **Users feel cheated** - "I reset my progress for nothing"
3. **Feature is broken** - Core mechanic doesn't work
4. **Trust damaged** - Promised bonus not delivered

## Correct Solution
Apply multiplier in addXp or in calling functions:
```javascript
export async function addXpToUser(discordId, amount, reason = 'Unknown') {
  const user = await User.findOne({ discordId });
  
  // Apply prestige multiplier
  const multiplier = user.prestige?.bonusMultiplier || 1.0;
  const adjustedAmount = Math.floor(amount * multiplier);
  
  const result = user.addXp(adjustedAmount);
  // ...
}
```

---

# 18. STREAK MULTIPLIER NOT APPLIED

## Severity: 🔴 CRITICAL

## Problem Description
Similar to prestige, streak multipliers are calculated but never applied to XP.

## Files Affected
- `src/config/brandSystem.js` (getStreakMultiplier function)
- All XP-awarding functions

## Current Code Analysis

```javascript
// File: src/config/brandSystem.js Lines 485-493
export function getStreakMultiplier(streak) {
  if (streak >= 30) return 2.0;   // 2x XP!
  if (streak >= 14) return 1.5;   // 1.5x XP
  if (streak >= 7) return 1.25;
  if (streak >= 3) return 1.1;
  return 1.0;
}
```

But nowhere in the codebase is this multiplier actually used to modify XP!

## Search Results
Searching for `getStreakMultiplier` usage:
- `daily.js` - Used for DISPLAY only
- `profile.js` - Used for DISPLAY only
- Never used in XP calculation

## Impact
1. **Streak bonus is fake** - 30 day streak doesn't give 2x XP
2. **Displayed but not applied** - Shows "2.0x XP" but you get 1x
3. **Misleading users** - False advertising of feature

## Correct Solution
Same as prestige - apply in addXp or XP calculation:
```javascript
export async function recordQuizCompletion(user, correct, total, topic) {
  const baseXp = XP_REWARDS.QUIZ_COMPLETE + (correct * XP_REWARDS.QUIZ_CORRECT);
  
  // Apply multipliers
  const streakMultiplier = getStreakMultiplier(user.streak);
  const prestigeMultiplier = user.prestige?.bonusMultiplier || 1.0;
  const totalMultiplier = streakMultiplier * prestigeMultiplier;
  
  const xpEarned = Math.floor(baseXp * totalMultiplier);
  user.addXp(xpEarned);
}
```

---

# 19. FIRST-TIME USER STREAK BUG

## Severity: 🟡 MEDIUM

## Problem Description
First-time users get streak = 1 immediately, which may trigger achievements prematurely.

## Files Affected
- `src/database/models/User.js` (updateStreak method)

## Current Code Analysis

```javascript
// File: src/database/models/User.js Lines 265-275
userSchema.methods.updateStreak = async function() {
  const now = new Date();
  const lastActive = this.lastActive;
  
  // First time user
  if (!lastActive || this.streak === 0) {
    this.streak = 1;  // Immediately 1
    // ...
  }
}
```

## The Problem
Day 1: User joins, streak = 1
Day 2: User returns, streak = 2 (should be 1st streak day)

The first visit shouldn't count as a "streak" - streaks require CONSECUTIVE days.

## Impact
1. **Inflated streaks** - Everyone starts at 1 instead of 0
2. **Faster achievements** - "3 day streak" achieved on day 3 instead of day 4
3. **Inconsistent logic** - A "streak" implies repetition

## Correct Solution
First visit sets lastActive, streak stays 0. Second visit starts streak:
```javascript
if (!lastActive) {
  this.streak = 0;  // No streak yet
  this.lastActive = now;
  return 0;
}

if (this.streak === 0 && diffHours < 48) {
  this.streak = 1;  // First streak day
}
```

---

# 20. TIMEZONE HANDLING IGNORED

## Severity: 🟡 MEDIUM

## Problem Description
User timezone field exists but is never used. Daily reset is always UTC.

## Files Affected
- `src/database/models/User.js` (timezone field)
- `src/services/gamificationService.js` (claimDailyBonus)

## Current Code Analysis

```javascript
// File: src/database/models/User.js Line 10
timezone: { type: String, default: 'UTC' },  // Stored but unused

// File: src/services/gamificationService.js Lines 241-245
const todayMidnight = new Date(Date.UTC(
  now.getUTCFullYear(), 
  now.getUTCMonth(), 
  now.getUTCDate()
));  // Always UTC, ignores user timezone
```

## The Problem
1. User in Tokyo (UTC+9) claims daily at 10am local
2. For them, it's clearly "today"
3. But UTC says it's yesterday (1am UTC)
4. User might miss their claim window

## Impact
1. **Unfair for non-UTC users** - Reset timing doesn't match their day
2. **Streak breaks** - User claims "daily" but system says too early/late
3. **Wasted feature** - Timezone field exists but is useless

## Correct Solution
Use user's timezone for calculations:
```javascript
import { DateTime } from 'luxon';

const userNow = DateTime.now().setZone(user.timezone || 'UTC');
const todayMidnight = userNow.startOf('day');
```

---

# 21. TOTAL XP TRACKING ISSUE

## Severity: 🔴 CRITICAL

## Problem Description
The `prestige.totalXpEarned` field exists but is not consistently updated when XP is earned.

## Files Affected
- `src/database/models/User.js` (prestige.totalXpEarned field)
- `src/services/gamificationService.js` (addXpToUser)
- All XP-awarding functions

## Current Code Analysis

```javascript
// Field exists:
prestige: {
  totalXpEarned: { type: Number, default: 0 },  // Never updated!
  // ...
}

// addXpToUser doesn't update it:
export async function addXpToUser(discordId, amount, reason = 'Unknown') {
  const user = await User.findOne({ discordId });
  const result = user.addXp(amount);  // Only updates user.xp
  await user.save();
  // user.prestige.totalXpEarned is NOT updated!
}
```

## The Problem
1. User earns 100 XP
2. `user.xp += 100` ✓
3. `user.prestige.totalXpEarned += 100` ✗ (never happens)
4. Total XP stays at 0 forever
5. Prestige requirements never met (need X total XP)

## Impact
1. **Can't prestige** - Requirements based on totalXpEarned which is 0
2. **Wrong tier calculations** - If using totalXpEarned
3. **Broken prestige system** - Core field never updated

## Correct Solution
Update in addXp method:
```javascript
userSchema.methods.addXp = function(amount) {
  this.xp += amount;
  
  // Track lifetime XP
  if (!this.prestige) {
    this.prestige = { level: 0, totalXpEarned: 0, bonusMultiplier: 1.0 };
  }
  this.prestige.totalXpEarned += amount;
  
  // Level up logic...
};
```

---

# 22. WEBSITE API XP FORMULA MISMATCH

## Severity: 🔴 CRITICAL

## Problem Description
The website JavaScript uses a different XP formula than the bot, causing display inconsistencies.

## Files Affected
- `website/index.html` (JavaScript)
- `src/config/brandSystem.js` (correct formula)

## Current Code Analysis

```javascript
// Website (WRONG)
function calculateXPForLevel(level) {
    return Math.floor(100 * Math.pow(level, 1.5));
}

// Bot (CORRECT)
export function xpForLevel(level) {
  return Math.floor(100 * Math.pow(1.5, level - 1));
}
```

## The Problem
Website shows different XP requirements than Discord bot!

| Level | Bot (correct) | Website (wrong) | Difference |
|-------|--------------|-----------------|------------|
| 5     | 506 XP       | 1,118 XP       | 612 XP     |
| 10    | 2,562 XP     | 3,162 XP       | 600 XP     |
| 20    | 18,837 XP    | 8,944 XP       | -9,893 XP  |

## Impact
1. **User confusion** - "Bot says I need 500, website says 1100"
2. **Progress bars wrong** - Different percentages shown
3. **Trust damaged** - Inconsistent information

## Correct Solution
Website should use exact same formula:
```javascript
function xpForLevel(level) {
    return Math.floor(100 * Math.pow(1.5, level - 1));
}
```

---

# 23. ACCURACY CALCULATION EDGE CASES

## Severity: 🟢 LOW

## Problem Description
Accuracy calculation doesn't handle edge cases like 0 questions answered.

## Files Affected
- Multiple files that calculate accuracy

## Current Code Analysis

```javascript
// Various places:
const accuracy = user.correctAnswers / user.totalQuestions;  // Division by zero!

// Sometimes guarded:
const accuracy = user.totalQuestions > 0 
  ? Math.round((user.correctAnswers / user.totalQuestions) * 100) 
  : 0;
```

## The Problem
Inconsistent handling:
1. Some places guard against division by zero
2. Some don't
3. Result could be NaN, Infinity, or crash

## Impact
1. **NaN displayed** - "Accuracy: NaN%"
2. **Potential crashes** - Unhandled NaN in calculations
3. **Inconsistent display** - Different handling in different places

## Correct Solution
Centralized accuracy function:
```javascript
export function calculateAccuracy(correct, total) {
  if (!total || total === 0) return 0;
  return Math.round((correct / total) * 100);
}
```

---

# 24. QUIZ DIFFICULTY MULTIPLIER INCONSISTENCY

## Severity: 🟡 MEDIUM

## Problem Description
Difficulty multipliers are defined in multiple places with different values.

## Files Affected
- `src/services/quizService.js`
- `src/services/learningService.js`
- `src/config/quizConfig.js`

## Current Code Analysis

```javascript
// quizService.js Lines 314-315
const difficultyMultiplier = { easy: 0.8, medium: 1, hard: 1.5 };

// learningService.js Lines 46-47
const difficultyMultiplier = { beginner: 1, intermediate: 1.5, advanced: 2 };

// Different names too! easy vs beginner, hard vs advanced
```

## The Problem
1. Same concept, different values
2. Different naming (easy/hard vs beginner/advanced)
3. Confusing which to use
4. XP calculation unpredictable

## Impact
1. **Inconsistent XP rewards** - Same difficulty, different XP
2. **Confusing code** - Which multiplier map to use?
3. **Bugs** - Using wrong map for context

## Correct Solution
Single source of truth in config:
```javascript
// config/xpConfig.js
export const DIFFICULTY_MULTIPLIERS = {
  easy: 0.8,
  beginner: 0.8,
  medium: 1.0,
  intermediate: 1.0,
  hard: 1.5,
  advanced: 1.5
};
```

---

# 25. CONCURRENCY ISSUES

## Severity: 🟠 HIGH

## Problem Description
Multiple simultaneous requests can cause race conditions with user data.

## Example Scenario

```
Time 0ms: User clicks "Answer A" on Quiz Q1
Time 1ms: User clicks "Answer B" on Quiz Q1 (double-click)

Request 1:
  - Loads user (xp: 100)
  - Calculates reward
  - Adds XP: 100 + 25 = 125
  - Saves user

Request 2:
  - Loads user (xp: 100) <- STALE DATA
  - Calculates reward
  - Adds XP: 100 + 25 = 125  <- WRONG, should be 150
  - Saves user

Final: user.xp = 125 (lost 25 XP!)
```

## Files Affected
- All interaction handlers
- All database operations

## Impact
1. **Lost XP** - Race conditions lose data
2. **Double rewards** - Some operations might give double
3. **Corrupted state** - User data becomes inconsistent
4. **Hard to reproduce** - Only happens under load

## Correct Solution
Use atomic operations:
```javascript
// Instead of:
const user = await User.findOne({ discordId });
user.xp += 25;
await user.save();

// Use:
await User.findOneAndUpdate(
  { discordId },
  { $inc: { xp: 25 } }
);
```

---

# SUMMARY OF FIXES REQUIRED

## Priority 1: Critical (Must Fix)
1. **XP Formula Inconsistency** - Unify to single formula
2. **XP Representation** - Track total XP separately
3. **Prestige Type Mismatch** - Read .level not whole object
4. **Leaderboard Sorting** - Sort by level first
5. **Tier Calculation** - Use total XP
6. **Prestige Multiplier Not Applied** - Actually apply it
7. **Streak Multiplier Not Applied** - Actually apply it
8. **Total XP Not Tracked** - Update on every XP gain
9. **Website XP Formula** - Match bot formula

## Priority 2: High (Should Fix Soon)
1. **Dual Streak System** - Merge into one
2. **Achievement XP Bypass** - Use addXp method
3. **Concurrency Issues** - Use atomic operations

## Priority 3: Medium (Fix When Possible)
1. **Quiz Session Memory Leak** - Add cleanup
2. **Rate Limiting Persistence** - Store in DB
3. **Eliminated Options Reset** - Reset on question change
4. **UpdateStreak Double Save** - Remove internal save
5. **Quiz Completion XP** - Add XP in function
6. **Learning Progress In-Memory** - Move to DB
7. **Timezone Handling** - Actually use user timezone
8. **Difficulty Multiplier Inconsistency** - Centralize config

## Priority 4: Low (Nice to Have)
1. **AI Model Inconsistency** - Centralize config
2. **JSON Parsing Fragility** - Use robust parser
3. **User Context Fallback** - Better fallback behavior
4. **Accuracy Edge Cases** - Centralize calculation
5. **First-Time User Streak** - Start at 0

---

# CODE REFERENCES QUICK LOOKUP

| Issue | Primary File | Line Numbers |
|-------|-------------|--------------|
| XP Formula 1 | brandSystem.js | 392 |
| XP Formula 2 | card.js | 224 |
| XP Subtraction | User.js | 247 |
| Dual Streak | gamificationService.js | 236-320 |
| Prestige Schema | User.js | 139-150 |
| Achievement XP | gamificationService.js | 169 |
| Leaderboard Sort | leaderboard.js | 85-88 |
| Tier Function | card.js | 196-207 |
| Session Cache | quizService.js | 11-12 |
| Rate Limit Map | quizService.js | 15-17 |

---

**END OF ANALYSIS DOCUMENT**

*This document contains complete analysis of all identified logic, science, and functional errors in the MentorAI Discord bot. Use with DeepSeek AI for systematic planning and fixing.*
