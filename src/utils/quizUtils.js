// src/utils/quizUtils.js
// ═══════════════════════════════════════════════════════════════════
// ULTRA QUIZ SYSTEM - UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════════

import {
  QUIZ_COLORS,
  QUIZ_EMOJIS,
  DIFFICULTY,
  QUIZ_TOPICS,
  XP_REWARDS,
  STREAK_MULTIPLIERS,
  QUIZ_RANKS,
  ASCII_ART,
  GRADES,
  LOADING_FRAMES,
  COUNTDOWN_FRAMES
} from '../config/quizConfig.js';

// ═══════════════════════════════════════════════════════════════════
// PROGRESS BAR GENERATORS
// ═══════════════════════════════════════════════════════════════════

/**
 * Create a visual progress bar
 * @param {number} current - Current value
 * @param {number} max - Maximum value
 * @param {number} length - Bar length (default 10)
 * @param {string} filledChar - Filled character
 * @param {string} emptyChar - Empty character
 * @returns {string} Progress bar string
 */
export function createProgressBar(current, max, length = 10, filledChar = '█', emptyChar = '░') {
  const percentage = Math.min(Math.max(current / max, 0), 1);
  const filled = Math.round(percentage * length);
  const empty = length - filled;
  return filledChar.repeat(filled) + emptyChar.repeat(empty);
}

/**
 * Create a fancy progress bar with borders
 * @param {number} current - Current value
 * @param {number} max - Maximum value
 * @param {number} length - Bar length (default 20)
 * @returns {string} Fancy progress bar
 */
export function createFancyProgressBar(current, max, length = 20) {
  const bar = createProgressBar(current, max, length);
  const percent = Math.round((current / max) * 100);
  return `\`╔${bar}╗\` **${percent}%**`;
}

/**
 * Create a timer bar showing remaining time
 * @param {number} remaining - Remaining seconds
 * @param {number} total - Total seconds
 * @returns {string} Timer bar with emoji
 */
export function createTimerBar(remaining, total) {
  const bar = createProgressBar(remaining, total, 10);
  const emoji = remaining > total * 0.5 ? '🟢' : remaining > total * 0.25 ? '🟡' : '🔴';
  return `${emoji} \`${bar}\` **${remaining}s**`;
}

/**
 * Create a health/HP bar for battles
 * @param {number} current - Current HP
 * @param {number} max - Max HP
 * @returns {string} HP bar
 */
export function createHealthBar(current, max) {
  const percent = (current / max) * 100;
  let color;
  if (percent > 60) color = '🟩';
  else if (percent > 30) color = '🟨';
  else color = '🟥';
  
  const filled = Math.round(percent / 10);
  const empty = 10 - filled;
  return `${color.repeat(filled)}${'⬛'.repeat(empty)} ${current}/${max}`;
}

/**
 * Create an XP progress bar
 * @param {number} currentXP - Current XP
 * @param {number} nextLevelXP - XP needed for next level
 * @param {number} currentLevel - Current level
 * @returns {string} XP bar with level info
 */
export function createXPBar(currentXP, nextLevelXP, currentLevel) {
  const bar = createProgressBar(currentXP, nextLevelXP, 15, '▓', '░');
  return `**Lv.${currentLevel}** \`[${bar}]\` **Lv.${currentLevel + 1}**\n✨ ${currentXP}/${nextLevelXP} XP`;
}

// ═══════════════════════════════════════════════════════════════════
// FORMATTING UTILITIES
// ═══════════════════════════════════════════════════════════════════

/**
 * Format a number with commas
 * @param {number} num - Number to format
 * @returns {string} Formatted number
 */
export function formatNumber(num) {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/**
 * Format time remaining in MM:SS format
 * @param {number} seconds - Seconds remaining
 * @returns {string} Formatted time
 */
export function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Format a date to relative time
 * @param {Date} date - Date to format
 * @returns {string} Relative time string
 */
export function formatRelativeTime(date) {
  const now = new Date();
  const diff = now - date;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return 'Just now';
}

/**
 * Create a boxed text block
 * @param {string} text - Text to box
 * @param {number} width - Box width
 * @returns {string} Boxed text
 */
export function createBox(text, width = 50) {
  const lines = text.split('\n');
  const boxTop = '┌' + '─'.repeat(width) + '┐';
  const boxBottom = '└' + '─'.repeat(width) + '┘';
  const boxedLines = lines.map(line => {
    const padding = width - line.length;
    return '│ ' + line + ' '.repeat(Math.max(0, padding - 1)) + '│';
  });
  return [boxTop, ...boxedLines, boxBottom].join('\n');
}

// ═══════════════════════════════════════════════════════════════════
// RANK & GRADE UTILITIES
// ═══════════════════════════════════════════════════════════════════

/**
 * Get user's rank based on XP
 * @param {number} xp - User's total XP
 * @returns {Object} Rank object
 */
export function getRankFromXP(xp) {
  const ranks = Object.values(QUIZ_RANKS).reverse();
  for (const rank of ranks) {
    if (xp >= rank.minXP) {
      return rank;
    }
  }
  return QUIZ_RANKS.BEGINNER;
}

/**
 * Get grade based on percentage score
 * @param {number} percent - Score percentage (0-100)
 * @returns {Object} Grade object with emoji and label
 */
export function getGrade(percent) {
  const grades = Object.entries(GRADES);
  for (const [grade, data] of grades) {
    if (percent >= data.minPercent) {
      return { grade, ...data };
    }
  }
  return { grade: 'F', ...GRADES.F };
}

/**
 * Get streak multiplier based on current streak
 * @param {number} streak - Current streak count
 * @returns {Object} Streak multiplier info
 */
export function getStreakMultiplier(streak) {
  const multipliers = [...STREAK_MULTIPLIERS].reverse();
  for (const mult of multipliers) {
    if (streak >= mult.minStreak) {
      return mult;
    }
  }
  return STREAK_MULTIPLIERS[0];
}

// ═══════════════════════════════════════════════════════════════════
// XP CALCULATION
// ═══════════════════════════════════════════════════════════════════

/**
 * Calculate total XP earned from a quiz
 * @param {Object} params - Quiz parameters
 * @returns {Object} XP breakdown
 */
export function calculateQuizXP({ 
  correct, 
  total, 
  difficulty = 'medium',
  avgTime,
  timeLimit,
  streak = 0,
  isFirstOfDay = false,
  isPerfect = false
}) {
  const breakdown = {};
  
  // Base XP
  breakdown.base = XP_REWARDS.baseQuizComplete;
  
  // Accuracy bonus
  const accuracy = (correct / total) * 100;
  breakdown.accuracy = XP_REWARDS.accuracyBonus(accuracy);
  
  // Difficulty bonus
  breakdown.difficulty = XP_REWARDS.difficultyBonus[difficulty] || 0;
  
  // Speed bonus
  if (avgTime && timeLimit) {
    breakdown.speed = XP_REWARDS.speedBonus(avgTime, timeLimit);
  }
  
  // Perfect bonus
  if (isPerfect) {
    breakdown.perfect = XP_REWARDS.perfectQuiz;
  }
  
  // First of day bonus
  if (isFirstOfDay) {
    breakdown.firstOfDay = XP_REWARDS.firstQuizOfDay;
  }
  
  // Calculate subtotal
  const subtotal = Object.values(breakdown).reduce((a, b) => a + b, 0);
  
  // Streak multiplier
  const streakData = getStreakMultiplier(streak);
  breakdown.streakMultiplier = streakData.multiplier;
  breakdown.streakBonus = XP_REWARDS.streakBonus(streak);
  
  // Final total
  const total_xp = Math.round((subtotal * streakData.multiplier) + breakdown.streakBonus);
  
  return {
    breakdown,
    total: total_xp
  };
}

// ═══════════════════════════════════════════════════════════════════
// QUESTION DISPLAY HELPERS
// ═══════════════════════════════════════════════════════════════════

/**
 * Create a formatted question display
 * @param {Object} question - Question object
 * @param {number} index - Question index
 * @param {number} total - Total questions
 * @param {string} difficulty - Difficulty level
 * @returns {string} Formatted question
 */
export function formatQuestion(question, index, total, difficulty = 'medium') {
  const diffData = DIFFICULTY[difficulty] || DIFFICULTY.medium;
  const topicData = QUIZ_TOPICS[question.topic] || QUIZ_TOPICS.mixed;
  
  let display = '';
  display += `**Question ${index + 1}/${total}** ${diffData.emoji}\n`;
  display += `${ASCII_ART.dividerThin}\n\n`;
  display += `${QUIZ_EMOJIS.BRAIN} **${question.question}**\n\n`;
  
  const options = ['A', 'B', 'C', 'D'];
  question.options.forEach((opt, i) => {
    display += `${QUIZ_EMOJIS[`OPTION_${options[i]}`]} ${opt}\n`;
  });
  
  display += `\n${ASCII_ART.dividerThin}\n`;
  display += `${topicData.emoji} **${topicData.name}** • ⏱️ ${diffData.timeLimit}s`;
  
  return display;
}

/**
 * Create answer result display
 * @param {boolean} isCorrect - Whether answer was correct
 * @param {string} correctAnswer - The correct answer
 * @param {string} userAnswer - User's answer
 * @param {string} explanation - Answer explanation
 * @returns {string} Formatted result
 */
export function formatAnswerResult(isCorrect, correctAnswer, userAnswer, explanation) {
  const emoji = isCorrect ? QUIZ_EMOJIS.CORRECT : QUIZ_EMOJIS.INCORRECT;
  const status = isCorrect ? '**CORRECT!**' : '**INCORRECT**';
  const color = isCorrect ? 'green' : 'red';
  
  let display = `${emoji} ${status}\n\n`;
  
  if (!isCorrect) {
    display += `Your answer: ❌ ${userAnswer}\n`;
    display += `Correct answer: ✅ ${correctAnswer}\n\n`;
  }
  
  if (explanation) {
    display += `📝 **Explanation:**\n${explanation}`;
  }
  
  return display;
}

// ═══════════════════════════════════════════════════════════════════
// LEADERBOARD HELPERS
// ═══════════════════════════════════════════════════════════════════

/**
 * Format leaderboard entry
 * @param {Object} user - User data
 * @param {number} position - Position on leaderboard
 * @param {string} stat - Stat to display (xp, wins, streak)
 * @returns {string} Formatted entry
 */
export function formatLeaderboardEntry(user, position, stat = 'xp') {
  let posEmoji;
  switch (position) {
    case 1: posEmoji = QUIZ_EMOJIS.RANK_1; break;
    case 2: posEmoji = QUIZ_EMOJIS.RANK_2; break;
    case 3: posEmoji = QUIZ_EMOJIS.RANK_3; break;
    default: posEmoji = `\`#${position}\``;
  }
  
  const rank = getRankFromXP(user.xp || 0);
  const value = formatNumber(user[stat] || 0);
  const statEmoji = stat === 'xp' ? QUIZ_EMOJIS.XP : stat === 'streak' ? QUIZ_EMOJIS.STREAK : QUIZ_EMOJIS.TROPHY;
  
  return `${posEmoji} ${rank.emoji} **${user.username || 'Unknown'}** • ${statEmoji} ${value}`;
}

/**
 * Create a full leaderboard display
 * @param {Array} users - Array of user data
 * @param {string} title - Leaderboard title
 * @param {string} stat - Stat to display
 * @returns {string} Formatted leaderboard
 */
export function formatLeaderboard(users, title, stat = 'xp') {
  let display = `${ASCII_ART.header.leaderboard}\n`;
  display += `**${title}**\n\n`;
  
  users.slice(0, 10).forEach((user, index) => {
    display += formatLeaderboardEntry(user, index + 1, stat) + '\n';
  });
  
  return display;
}

// ═══════════════════════════════════════════════════════════════════
// BATTLE HELPERS
// ═══════════════════════════════════════════════════════════════════

/**
 * Create battle status display for 1v1
 * @param {Object} player1 - Player 1 data
 * @param {Object} player2 - Player 2 data
 * @returns {string} Battle status
 */
export function formatBattleStatus(player1, player2) {
  let display = '';
  
  // Player 1
  display += `**${player1.username}** ${getRankFromXP(player1.xp).emoji}\n`;
  display += createHealthBar(player1.hp, player1.maxHp) + '\n';
  display += `⭐ Score: **${player1.score}**\n\n`;
  
  display += `⚔️ **VS** ⚔️\n\n`;
  
  // Player 2
  display += `**${player2.username}** ${getRankFromXP(player2.xp).emoji}\n`;
  display += createHealthBar(player2.hp, player2.maxHp) + '\n';
  display += `⭐ Score: **${player2.score}**`;
  
  return display;
}

// ═══════════════════════════════════════════════════════════════════
// ANIMATION HELPERS
// ═══════════════════════════════════════════════════════════════════

/**
 * Get loading animation frame
 * @param {number} tick - Animation tick
 * @returns {string} Loading frame
 */
export function getLoadingFrame(tick) {
  return LOADING_FRAMES[tick % LOADING_FRAMES.length];
}

/**
 * Create loading message
 * @param {string} message - Loading message
 * @param {number} tick - Animation tick
 * @returns {string} Animated loading message
 */
export function createLoadingMessage(message, tick) {
  return `${getLoadingFrame(tick)} ${message}...`;
}

/**
 * Get countdown frame
 * @param {number} count - Countdown value (3, 2, 1, 0)
 * @returns {string} Countdown emoji
 */
export function getCountdownFrame(count) {
  if (count >= COUNTDOWN_FRAMES.length) return COUNTDOWN_FRAMES[0];
  if (count < 0) return COUNTDOWN_FRAMES[COUNTDOWN_FRAMES.length - 1];
  return COUNTDOWN_FRAMES[COUNTDOWN_FRAMES.length - 1 - count];
}

// ═══════════════════════════════════════════════════════════════════
// TOPIC UTILITIES
// ═══════════════════════════════════════════════════════════════════

/**
 * Get topic info
 * @param {string} topicKey - Topic key
 * @returns {Object} Topic info
 */
export function getTopicInfo(topicKey) {
  return QUIZ_TOPICS[topicKey?.toLowerCase()] || QUIZ_TOPICS.mixed;
}

/**
 * Get all available topics as a formatted list
 * @returns {string} Formatted topic list
 */
export function getTopicList() {
  return Object.entries(QUIZ_TOPICS)
    .map(([key, data]) => `${data.emoji} ${data.name}`)
    .join('\n');
}

/**
 * Validate topic key
 * @param {string} topicKey - Topic to validate
 * @returns {boolean} Is valid topic
 */
export function isValidTopic(topicKey) {
  return Object.keys(QUIZ_TOPICS).includes(topicKey?.toLowerCase());
}

// ═══════════════════════════════════════════════════════════════════
// DIFFICULTY UTILITIES
// ═══════════════════════════════════════════════════════════════════

/**
 * Get difficulty info
 * @param {string} diffKey - Difficulty key
 * @returns {Object} Difficulty info
 */
export function getDifficultyInfo(diffKey) {
  return DIFFICULTY[diffKey?.toLowerCase()] || DIFFICULTY.medium;
}

/**
 * Validate difficulty key
 * @param {string} diffKey - Difficulty to validate
 * @returns {boolean} Is valid difficulty
 */
export function isValidDifficulty(diffKey) {
  return Object.keys(DIFFICULTY).includes(diffKey?.toLowerCase());
}

// ═══════════════════════════════════════════════════════════════════
// RESULTS SUMMARY
// ═══════════════════════════════════════════════════════════════════

/**
 * Create a complete results summary
 * @param {Object} results - Quiz results object
 * @returns {string} Formatted results
 */
export function createResultsSummary(results) {
  const { correct, total, xpEarned, timeSpent, streak, grade, accuracy } = results;
  
  let summary = ASCII_ART.header.results + '\n';
  
  // Grade display
  const gradeData = getGrade(accuracy);
  summary += `\n${gradeData.emoji} **Grade: ${gradeData.grade}** - ${gradeData.label}\n\n`;
  
  // Stats
  summary += `${ASCII_ART.dividerThin}\n`;
  summary += `📊 **STATS**\n\n`;
  summary += `✅ Correct: **${correct}/${total}** (${accuracy.toFixed(1)}%)\n`;
  summary += `⏱️ Time: **${formatTime(timeSpent)}**\n`;
  summary += `🔥 Streak: **${streak}**\n`;
  summary += `${ASCII_ART.dividerThin}\n\n`;
  
  // XP breakdown
  summary += `✨ **XP EARNED**\n\n`;
  
  if (xpEarned.breakdown) {
    const { breakdown } = xpEarned;
    if (breakdown.base) summary += `• Base: +${breakdown.base} XP\n`;
    if (breakdown.accuracy) summary += `• Accuracy Bonus: +${breakdown.accuracy} XP\n`;
    if (breakdown.difficulty) summary += `• Difficulty Bonus: +${breakdown.difficulty} XP\n`;
    if (breakdown.speed) summary += `• Speed Bonus: +${breakdown.speed} XP\n`;
    if (breakdown.perfect) summary += `• 🌟 Perfect Bonus: +${breakdown.perfect} XP\n`;
    if (breakdown.firstOfDay) summary += `• 🌅 First of Day: +${breakdown.firstOfDay} XP\n`;
    if (breakdown.streakBonus) summary += `• 🔥 Streak Bonus: +${breakdown.streakBonus} XP\n`;
    if (breakdown.streakMultiplier > 1) {
      summary += `• 💫 Streak Multiplier: x${breakdown.streakMultiplier}\n`;
    }
    summary += `\n**Total: +${xpEarned.total} XP**`;
  } else {
    summary += `**+${xpEarned} XP**`;
  }
  
  return summary;
}

// ═══════════════════════════════════════════════════════════════════
// RANDOM UTILITIES
// ═══════════════════════════════════════════════════════════════════

/**
 * Shuffle an array
 * @param {Array} array - Array to shuffle
 * @returns {Array} Shuffled array
 */
export function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Get random item from array
 * @param {Array} array - Array to pick from
 * @returns {*} Random item
 */
export function getRandomItem(array) {
  return array[Math.floor(Math.random() * array.length)];
}

/**
 * Generate unique ID
 * @returns {string} Unique ID
 */
export function generateQuizId() {
  return `quiz_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// ═══════════════════════════════════════════════════════════════════
// EXPORT DEFAULT OBJECT (for convenience)
// ═══════════════════════════════════════════════════════════════════

export default {
  // Progress bars
  createProgressBar,
  createFancyProgressBar,
  createTimerBar,
  createHealthBar,
  createXPBar,
  
  // Formatting
  formatNumber,
  formatTime,
  formatRelativeTime,
  createBox,
  
  // Rank/Grade
  getRankFromXP,
  getGrade,
  getStreakMultiplier,
  
  // XP
  calculateQuizXP,
  
  // Question display
  formatQuestion,
  formatAnswerResult,
  
  // Leaderboard
  formatLeaderboardEntry,
  formatLeaderboard,
  
  // Battle
  formatBattleStatus,
  
  // Animation
  getLoadingFrame,
  createLoadingMessage,
  getCountdownFrame,
  
  // Topics
  getTopicInfo,
  getTopicList,
  isValidTopic,
  
  // Difficulty
  getDifficultyInfo,
  isValidDifficulty,
  
  // Results
  createResultsSummary,
  
  // Random
  shuffleArray,
  getRandomItem,
  generateQuizId
};
