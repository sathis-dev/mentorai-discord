// ============================================
// MentorAI Discord Design System v3.0-REALISTIC
// Color Constants - Discord-Compatible Only
// ============================================

/**
 * Embed Accent Colors
 * Use with embed.setColor() - controls the LEFT colored bar only
 */
export const COLORS = {
  // Embed Accents (use with .setColor())
  HELP: 0x8B5CF6,
  LESSON: 0x8B5CF6,
  QUIZ: 0xF59E0B,
  QUIZ_CORRECT: 0x22C55E,
  QUIZ_INCORRECT: 0xEF4444,
  PROGRESS: 0x6366F1,
  STUDY_PARTY: 0xEC4899,
  LEADERBOARD: 0xF59E0B,
  ACHIEVEMENT: 0xF59E0B,
  LEVEL_UP: 0xA855F7,
  STREAK: 0xF97316,
  XP: 0xEAB308,
  ERROR: 0xEF4444,
  INFO: 0x3B82F6,
  SUCCESS: 0x22C55E,
  
  // Rarity Colors
  COMMON: 0x9CA3AF,
  UNCOMMON: 0x22C55E,
  RARE: 0x3B82F6,
  EPIC: 0xA855F7,
  LEGENDARY: 0xF59E0B,
  MYTHIC: 0xEC4899
};

/**
 * ANSI Color Codes for use inside ```ansi code blocks
 * Usage: ```ansi\n\u001b[1;32mGreen Bold Text\u001b[0m\n```
 */
export const ANSI = {
  reset: '\u001b[0m',
  bold: '\u001b[1m',
  underline: '\u001b[4m',
  
  // Foreground Colors
  gray: '\u001b[30m',
  red: '\u001b[31m',
  green: '\u001b[32m',
  yellow: '\u001b[33m',
  blue: '\u001b[34m',
  pink: '\u001b[35m',
  cyan: '\u001b[36m',
  white: '\u001b[37m',
  
  // Bold Foreground Colors
  boldGray: '\u001b[1;30m',
  boldRed: '\u001b[1;31m',
  boldGreen: '\u001b[1;32m',
  boldYellow: '\u001b[1;33m',
  boldBlue: '\u001b[1;34m',
  boldPink: '\u001b[1;35m',
  boldCyan: '\u001b[1;36m',
  boldWhite: '\u001b[1;37m',
  
  // Background Colors
  bgFireflyDarkBlue: '\u001b[40m',
  bgOrange: '\u001b[41m',
  bgMarbleBlue: '\u001b[42m',
  bgGreyishTurquoise: '\u001b[43m',
  bgGray: '\u001b[44m',
  bgIndigo: '\u001b[45m',
  bgLightGray: '\u001b[46m',
  bgWhite: '\u001b[47m'
};

/**
 * Emoji Constants
 */
export const EMOJIS = {
  // Commands
  commands: {
    learn: '📚',
    quiz: '🧠',
    progress: '📊',
    studyparty: '🎉',
    leaderboard: '🏆',
    help: '🎓',
    daily: '📅',
    streak: '🔥'
  },
  
  // Stats
  stats: {
    level: '🏆',
    xp: '⭐',
    totalXp: '💎',
    streak: '🔥',
    lessons: '📚',
    quizzes: '✅',
    accuracy: '🎯',
    time: '⏱️',
    rank: '🥇'
  },
  
  // Feedback
  feedback: {
    correct: '✅',
    incorrect: '❌',
    warning: '⚠️',
    info: 'ℹ️',
    tip: '💡',
    celebration: '🎉',
    fire: '🔥',
    star: '⭐',
    sparkles: '✨',
    rocket: '🚀',
    trophy: '🏆',
    medal: '🏅',
    crown: '👑'
  },
  
  // Progress
  progress: {
    checkmark: '✅',
    current: '📍',
    locked: '🔒',
    unlocked: '🔓',
    complete: '✔️',
    incomplete: '○',
    inProgress: '◉'
  },
  
  // Rankings
  rankings: {
    first: '🥇',
    second: '🥈',
    third: '🥉',
    crown: '👑'
  },
  
  // Topics
  topics: {
    python: '🐍',
    javascript: '💛',
    java: '☕',
    csharp: '🎮',
    html: '🌐',
    css: '🎨',
    react: '⚛️',
    database: '🗄️',
    ai: '🤖',
    math: '🔢',
    science: '🔬',
    language: '🗣️'
  },
  
  // Quiz Options
  quizOptions: {
    A: '🅰️',
    B: '🅱️',
    C: '🅲',
    D: '🅳'
  },
  
  // Rarity
  rarity: {
    common: '⬜',
    uncommon: '🟩',
    rare: '🟦',
    epic: '🟪',
    legendary: '🟨',
    mythic: '🟥'
  }
};

// Backward compatibility exports
export const EMBED_COLORS = {
  quiz: COLORS.QUIZ,
  lesson: COLORS.LESSON,
  help: COLORS.HELP,
  progress: COLORS.PROGRESS,
  studyParty: COLORS.STUDY_PARTY,
  error: COLORS.ERROR,
  success: COLORS.SUCCESS,
  info: COLORS.INFO,
  default: COLORS.INFO
};

export const RARITY_COLORS = {
  common: { color: COLORS.COMMON },
  uncommon: { color: COLORS.UNCOMMON },
  rare: { color: COLORS.RARE },
  epic: { color: COLORS.EPIC },
  legendary: { color: COLORS.LEGENDARY },
  mythic: { color: COLORS.MYTHIC }
};

export default {
  COLORS,
  ANSI,
  EMOJIS,
  EMBED_COLORS,
  RARITY_COLORS
};
