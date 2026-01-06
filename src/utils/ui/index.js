/**
 * MentorAI Ultimate UI System
 * Central export for all UI utilities
 */

// Colors
export { 
  Colors, 
  RANK_COLORS, 
  DIFFICULTY_COLORS, 
  LANGUAGE_COLORS, 
  RARITY_COLORS,
  default as ColorsDefault 
} from './colors.js';

// Visual Elements
export { 
  Visual, 
  getTopicEmoji, 
  getDifficultyEmoji, 
  getMedalEmoji, 
  getGradeEmoji, 
  getRankEmoji,
  default as VisualDefault 
} from './visualElements.js';

// Progress Bars
export { 
  createProgressBar, 
  createLabeledBar, 
  createXPBar, 
  createStatBars, 
  createTimerBar, 
  createStreakDisplay, 
  getRankInfo, 
  createStarRating, 
  createAccuracyDisplay, 
  createMiniChart, 
  createChecklist,
  default as ProgressBarDefault 
} from './progressBar.js';

// Embed Templates
export { 
  // Profile
  createProfileEmbed,
  createProfileButtons,
  // Lesson
  createLessonEmbed,
  createLessonButtons,
  // Quiz
  createQuizQuestionEmbed,
  createQuizAnswerButtons,
  createQuizControlButtons,
  createQuizResultsEmbed,
  createPostQuizButtons,
  // Leaderboard
  createLeaderboardEmbed,
  createLeaderboardPagination,
  createLeaderboardFilters,
  // Achievement
  createAchievementUnlockEmbed,
  // Utility
  createSuccessEmbed,
  createErrorEmbed,
  createInfoEmbed,
  createWarningEmbed,
  createLoadingEmbed,
  default as EmbedTemplatesDefault 
} from './embedTemplates.js';

// UI Patterns
export { 
  EmbedPaginator,
  confirmAction,
  showThinkingAnimation,
  showLevelUpAnimation,
  showSlotMachineAnimation,
  createTopicSelectMenu,
  createDifficultySelectMenu,
  createLanguageSelectMenu,
  default as PatternsDefault 
} from './patterns.js';

// ============================================
// QUICK HELPERS
// ============================================

/**
 * Format a number with commas
 */
export function formatNumber(n) {
  return (n || 0).toLocaleString();
}

/**
 * Format a date nicely
 */
export function formatDate(d) {
  return new Date(d).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

/**
 * Format relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(date) {
  const now = new Date();
  const then = new Date(date);
  const diffMs = now - then;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
  return formatDate(date);
}

/**
 * Capitalize first letter
 */
export function capitalizeFirst(s) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : '';
}

/**
 * Truncate text with ellipsis
 */
export function truncate(str, maxLength = 100) {
  if (!str || str.length <= maxLength) return str;
  return str.substring(0, maxLength - 3) + '...';
}

/**
 * Sleep for specified milliseconds
 */
export function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Get streak multiplier based on streak days
 */
export function getStreakMultiplier(streak) {
  if (streak >= 30) return 2.0;
  if (streak >= 14) return 1.75;
  if (streak >= 7) return 1.5;
  if (streak >= 3) return 1.25;
  return 1.0;
}

/**
 * Calculate XP needed for a level
 */
export function calculateXPForLevel(level) {
  return Math.floor(100 * Math.pow(1.5, level - 1));
}

/**
 * Calculate total XP accumulated up to a level
 */
export function calculateTotalXPForLevel(level) {
  let total = 0;
  for (let i = 1; i < level; i++) {
    total += calculateXPForLevel(i);
  }
  return total;
}

/**
 * Calculate level from XP
 */
export function calculateLevelFromXP(xp) {
  let level = 1;
  let totalXP = 0;
  while (totalXP + calculateXPForLevel(level) <= xp) {
    totalXP += calculateXPForLevel(level);
    level++;
  }
  return level;
}

/**
 * Get random element from array
 */
export function randomChoice(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Shuffle array (Fisher-Yates)
 */
export function shuffleArray(arr) {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
