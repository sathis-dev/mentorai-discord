// src/config/quizConfig.js
// ═══════════════════════════════════════════════════════════════════
// ULTRA QUIZ SYSTEM - CONFIGURATION
// ═══════════════════════════════════════════════════════════════════

import { ButtonStyle } from 'discord.js';

// ═══════════════════════════════════════════════════════════════════
// COLOR SCHEME
// ═══════════════════════════════════════════════════════════════════

export const QUIZ_COLORS = {
  // Primary Colors
  PRIMARY: 0x5865F2,
  SECONDARY: 0x99AAB5,
  
  // Status Colors
  SUCCESS: 0x57F287,
  WARNING: 0xFEE75C,
  DANGER: 0xED4245,
  INFO: 0x3498DB,
  
  // Special Colors
  XP_GOLD: 0xFFD700,
  STREAK_FIRE: 0xFF6B35,
  PREMIUM: 0xF47FFF,
  
  // Difficulty Colors
  EASY: 0x57F287,
  MEDIUM: 0xFEE75C,
  HARD: 0xED4245,
  EXPERT: 0x9B59B6,
  
  // Rank Colors
  BRONZE: 0xCD7F32,
  SILVER: 0xC0C0C0,
  GOLD: 0xFFD700,
  PLATINUM: 0xE5E4E2,
  DIAMOND: 0xB9F2FF,
  MASTER: 0xFF4500,
  GRANDMASTER: 0x9400D3,
  LEGEND: 0xFF1493
};

// ═══════════════════════════════════════════════════════════════════
// EMOJIS
// ═══════════════════════════════════════════════════════════════════

export const QUIZ_EMOJIS = {
  // Answer Options
  OPTION_A: '🅰️',
  OPTION_B: '🅱️',
  OPTION_C: '🅲',
  OPTION_D: '🅳',
  
  // Status
  CORRECT: '✅',
  INCORRECT: '❌',
  TIMEOUT: '⏰',
  SKIPPED: '⏭️',
  
  // Progress
  FILLED: '█',
  EMPTY: '░',
  PROGRESS_START: '╔',
  PROGRESS_END: '╗',
  
  // Difficulty
  EASY: '🟢',
  MEDIUM: '🟡',
  HARD: '🔴',
  EXPERT: '🟣',
  
  // Rewards
  XP: '✨',
  STREAK: '🔥',
  COIN: '🪙',
  GEM: '💎',
  TROPHY: '🏆',
  MEDAL: '🏅',
  CROWN: '👑',
  STAR: '⭐',
  
  // Ranks
  RANK_1: '🥇',
  RANK_2: '🥈',
  RANK_3: '🥉',
  
  // Misc
  TIMER: '⏱️',
  BRAIN: '🧠',
  TARGET: '🎯',
  LIGHTNING: '⚡',
  FIRE: '🔥',
  SPARKLES: '✨',
  CHART: '📊',
  BOOK: '📚',
  SWORD: '⚔️',
  SHIELD: '🛡️',
  VS: '⚔️',
  LOADING: '⏳',
  CHECK: '☑️',
  CROSS: '☒',
  ARROW_UP: '📈',
  ARROW_DOWN: '📉',
  NEW: '🆕',
  HOT: '🔥',
  LOCK: '🔒',
  UNLOCK: '🔓'
};

// ═══════════════════════════════════════════════════════════════════
// DIFFICULTY SETTINGS
// ═══════════════════════════════════════════════════════════════════

export const DIFFICULTY = {
  easy: {
    name: 'Easy',
    emoji: QUIZ_EMOJIS.EASY,
    color: QUIZ_COLORS.EASY,
    timeLimit: 30,
    xpMultiplier: 1.0,
    pointsPerCorrect: 10,
    description: 'Perfect for beginners'
  },
  medium: {
    name: 'Medium',
    emoji: QUIZ_EMOJIS.MEDIUM,
    color: QUIZ_COLORS.MEDIUM,
    timeLimit: 25,
    xpMultiplier: 1.5,
    pointsPerCorrect: 15,
    description: 'A balanced challenge'
  },
  hard: {
    name: 'Hard',
    emoji: QUIZ_EMOJIS.HARD,
    color: QUIZ_COLORS.HARD,
    timeLimit: 20,
    xpMultiplier: 2.0,
    pointsPerCorrect: 25,
    description: 'For experienced learners'
  },
  expert: {
    name: 'Expert',
    emoji: QUIZ_EMOJIS.EXPERT,
    color: QUIZ_COLORS.EXPERT,
    timeLimit: 15,
    xpMultiplier: 3.0,
    pointsPerCorrect: 40,
    description: 'Ultimate challenge'
  }
};

// ═══════════════════════════════════════════════════════════════════
// TOPICS
// ═══════════════════════════════════════════════════════════════════

export const QUIZ_TOPICS = {
  javascript: { name: 'JavaScript', emoji: '🟨', color: 0xF7DF1E },
  python: { name: 'Python', emoji: '🐍', color: 0x3776AB },
  java: { name: 'Java', emoji: '☕', color: 0xED8B00 },
  csharp: { name: 'C#', emoji: '🟪', color: 0x239120 },
  cpp: { name: 'C++', emoji: '🔷', color: 0x00599C },
  typescript: { name: 'TypeScript', emoji: '🔷', color: 0x3178C6 },
  react: { name: 'React', emoji: '⚛️', color: 0x61DAFB },
  nodejs: { name: 'Node.js', emoji: '🟩', color: 0x339933 },
  html: { name: 'HTML', emoji: '🌐', color: 0xE34F26 },
  css: { name: 'CSS', emoji: '🎨', color: 0x1572B6 },
  sql: { name: 'SQL', emoji: '🗄️', color: 0x4479A1 },
  git: { name: 'Git', emoji: '📦', color: 0xF05032 },
  algorithms: { name: 'Algorithms', emoji: '🧮', color: 0x9B59B6 },
  datastructures: { name: 'Data Structures', emoji: '🏗️', color: 0x3498DB },
  webdev: { name: 'Web Development', emoji: '🌍', color: 0x1ABC9C },
  devops: { name: 'DevOps', emoji: '🔧', color: 0x2C3E50 },
  security: { name: 'Security', emoji: '🔐', color: 0xE74C3C },
  ai: { name: 'AI/ML', emoji: '🤖', color: 0x9B59B6 },
  mobile: { name: 'Mobile Dev', emoji: '📱', color: 0x3DDC84 },
  cloud: { name: 'Cloud', emoji: '☁️', color: 0x4285F4 },
  mixed: { name: 'Mixed', emoji: '🎲', color: 0x95A5A6 }
};

// ═══════════════════════════════════════════════════════════════════
// XP & REWARDS
// ═══════════════════════════════════════════════════════════════════

export const XP_REWARDS = {
  baseQuizComplete: 50,
  perfectQuiz: 100,
  firstQuizOfDay: 25,
  streakBonus: (streak) => Math.min(streak * 5, 100),
  difficultyBonus: {
    easy: 0,
    medium: 25,
    hard: 50,
    expert: 100
  },
  speedBonus: (avgTime, timeLimit) => {
    const ratio = avgTime / timeLimit;
    if (ratio < 0.3) return 50;
    if (ratio < 0.5) return 30;
    if (ratio < 0.7) return 15;
    return 0;
  },
  accuracyBonus: (accuracy) => {
    if (accuracy >= 100) return 100;
    if (accuracy >= 90) return 50;
    if (accuracy >= 80) return 25;
    if (accuracy >= 70) return 10;
    return 0;
  }
};

// ═══════════════════════════════════════════════════════════════════
// STREAK MULTIPLIERS
// ═══════════════════════════════════════════════════════════════════

export const STREAK_MULTIPLIERS = [
  { minStreak: 0, multiplier: 1.0, name: 'No Streak', emoji: '❄️' },
  { minStreak: 3, multiplier: 1.1, name: 'Warming Up', emoji: '✨' },
  { minStreak: 7, multiplier: 1.25, name: 'On Fire', emoji: '🔥' },
  { minStreak: 14, multiplier: 1.5, name: 'Blazing', emoji: '💥' },
  { minStreak: 30, multiplier: 2.0, name: 'Inferno', emoji: '🌟' },
  { minStreak: 60, multiplier: 2.5, name: 'Supernova', emoji: '💫' },
  { minStreak: 100, multiplier: 3.0, name: 'Legendary', emoji: '👑' }
];

// ═══════════════════════════════════════════════════════════════════
// RANKS
// ═══════════════════════════════════════════════════════════════════

export const QUIZ_RANKS = {
  BEGINNER: { name: 'Beginner', emoji: '🌱', color: QUIZ_COLORS.SECONDARY, minXP: 0 },
  APPRENTICE: { name: 'Apprentice', emoji: '📘', color: QUIZ_COLORS.INFO, minXP: 500 },
  INTERMEDIATE: { name: 'Intermediate', emoji: '⚡', color: QUIZ_COLORS.WARNING, minXP: 2000 },
  ADVANCED: { name: 'Advanced', emoji: '🔥', color: QUIZ_COLORS.STREAK_FIRE, minXP: 5000 },
  EXPERT: { name: 'Expert', emoji: '💎', color: QUIZ_COLORS.DIAMOND, minXP: 10000 },
  MASTER: { name: 'Master', emoji: '👑', color: QUIZ_COLORS.GOLD, minXP: 25000 },
  GRANDMASTER: { name: 'Grandmaster', emoji: '🏆', color: QUIZ_COLORS.MASTER, minXP: 50000 },
  LEGEND: { name: 'Legend', emoji: '⭐', color: QUIZ_COLORS.LEGEND, minXP: 100000 }
};

// ═══════════════════════════════════════════════════════════════════
// ASCII ART COMPONENTS
// ═══════════════════════════════════════════════════════════════════

export const ASCII_ART = {
  header: {
    quiz: `\`\`\`
╔══════════════════════════════════════════════════════════════╗
║                        🎯 QUIZ TIME                          ║
╚══════════════════════════════════════════════════════════════╝
\`\`\``,
    challenge: `\`\`\`
╔══════════════════════════════════════════════════════════════╗
║                     ⚔️ CHALLENGE MODE                        ║
╚══════════════════════════════════════════════════════════════╝
\`\`\``,
    tournament: `\`\`\`
╔══════════════════════════════════════════════════════════════╗
║                    🏆 TOURNAMENT ARENA                       ║
╚══════════════════════════════════════════════════════════════╝
\`\`\``,
    teambattle: `\`\`\`
╔══════════════════════════════════════════════════════════════╗
║                     🏰 TEAM BATTLE                           ║
╚══════════════════════════════════════════════════════════════╝
\`\`\``,
    leaderboard: `\`\`\`
╔══════════════════════════════════════════════════════════════╗
║                     📊 LEADERBOARD                           ║
╚══════════════════════════════════════════════════════════════╝
\`\`\``,
    results: `\`\`\`
╔══════════════════════════════════════════════════════════════╗
║                     📊 QUIZ RESULTS                          ║
╚══════════════════════════════════════════════════════════════╝
\`\`\``,
    daily: `\`\`\`
╔══════════════════════════════════════════════════════════════╗
║                   💻 DAILY CHALLENGE                         ║
╚══════════════════════════════════════════════════════════════╝
\`\`\``
  },
  divider: '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
  dividerThin: '─────────────────────────────────────────────────────────',
  boxTop: '┌─────────────────────────────────────────────────────────────┐',
  boxBottom: '└─────────────────────────────────────────────────────────────┘',
  boxSide: '│'
};

// ═══════════════════════════════════════════════════════════════════
// GRADE THRESHOLDS
// ═══════════════════════════════════════════════════════════════════

export const GRADES = {
  'S+': { minPercent: 100, emoji: '🌟', label: 'PERFECT!', color: QUIZ_COLORS.XP_GOLD },
  'S':  { minPercent: 95, emoji: '🏆', label: 'Excellent!', color: QUIZ_COLORS.SUCCESS },
  'A+': { minPercent: 90, emoji: '🎉', label: 'Amazing!', color: QUIZ_COLORS.SUCCESS },
  'A':  { minPercent: 85, emoji: '⭐', label: 'Great!', color: QUIZ_COLORS.SUCCESS },
  'B+': { minPercent: 80, emoji: '👍', label: 'Good!', color: QUIZ_COLORS.WARNING },
  'B':  { minPercent: 75, emoji: '📝', label: 'Solid', color: QUIZ_COLORS.WARNING },
  'C+': { minPercent: 70, emoji: '📚', label: 'Passing', color: QUIZ_COLORS.WARNING },
  'C':  { minPercent: 60, emoji: '💪', label: 'Keep Going', color: QUIZ_COLORS.DANGER },
  'D':  { minPercent: 50, emoji: '📖', label: 'Needs Work', color: QUIZ_COLORS.DANGER },
  'F':  { minPercent: 0, emoji: '🔄', label: 'Try Again', color: QUIZ_COLORS.DANGER }
};

// ═══════════════════════════════════════════════════════════════════
// ANIMATION FRAMES
// ═══════════════════════════════════════════════════════════════════

export const LOADING_FRAMES = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
export const COUNTDOWN_FRAMES = ['3️⃣', '2️⃣', '1️⃣', '🚀'];
export const THINKING_FRAMES = ['🤔', '💭', '💡'];
