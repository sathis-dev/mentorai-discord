// ═══════════════════════════════════════════════════════════════════════════════
// 🎨 MENTORAI MASTER BRAND & DESIGN SYSTEM
// The Single Source of Truth for ALL UI Components
// ═══════════════════════════════════════════════════════════════════════════════

import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } from 'discord.js';

// ═══════════════════════════════════════════════════════════════════════════════
// 🏷️ BRAND IDENTITY
// ═══════════════════════════════════════════════════════════════════════════════

export const BRAND = {
  name: 'MentorAI',
  tagline: 'Learn. Code. Level Up.',
  icon: '🎓',
  version: '2.0.0'
};

// ═══════════════════════════════════════════════════════════════════════════════
// 🎨 COLOR PALETTE
// ═══════════════════════════════════════════════════════════════════════════════

export const COLORS = {
  // Primary Palette
  PRIMARY: 0x5865F2,        // Discord Blurple - Main actions
  SECONDARY: 0x99AAB5,      // Gray - Secondary elements
  ACCENT: 0xFEE75C,         // Yellow - Highlights
  
  // Semantic Colors
  SUCCESS: 0x57F287,        // Green - Correct, completions
  ERROR: 0xED4245,          // Red - Wrong, errors
  WARNING: 0xFEE75C,        // Yellow - Cautions
  INFO: 0x5865F2,           // Blurple - Information
  
  // Feature Colors
  XP_GOLD: 0xFFD700,        // Gold - XP gains
  STREAK_FIRE: 0xFF6B35,    // Orange - Streaks
  ACHIEVEMENT: 0x9B59B6,    // Purple - Achievements
  LESSON_BLUE: 0x3498DB,    // Blue - Lessons
  QUIZ_PINK: 0xE91E63,      // Pink - Quizzes
  LEVEL_UP: 0xFF6B6B,       // Coral - Level up
  
  // Rank Colors (Progression Tiers)
  BRONZE: 0xCD7F32,         // Level 1-4
  SILVER: 0xC0C0C0,         // Level 5-9
  GOLD: 0xFFD700,           // Level 10-19
  PLATINUM: 0xE5E4E2,       // Level 20-29
  DIAMOND: 0xB9F2FF,        // Level 30-39
  LEGENDARY: 0xFF00FF,      // Level 40+
  
  // Topic/Language Colors
  PYTHON: 0x3776AB,
  JAVASCRIPT: 0xF7DF1E,
  TYPESCRIPT: 0x3178C6,
  REACT: 0x61DAFB,
  NODEJS: 0x339933,
  HTML: 0xE34F26,
  CSS: 0x1572B6,
  SQL: 0x4479A1,
  GIT: 0xF05032,
  
  // Difficulty Colors
  EASY: 0x57F287,
  MEDIUM: 0xFEE75C,
  HARD: 0xED4245,
  
  // Dark/Neutral
  DARK: 0x2F3136,
  DARKER: 0x202225
};

// ═══════════════════════════════════════════════════════════════════════════════
// 😊 EMOJI SYSTEM
// ═══════════════════════════════════════════════════════════════════════════════

export const EMOJIS = {
  // Navigation
  home: '🏠',
  back: '◀️',
  forward: '▶️',
  up: '🔼',
  down: '🔽',
  first: '⏮️',
  last: '⏭️',
  refresh: '🔄',
  
  // Core Actions
  learn: '📖',
  quiz: '🎯',
  run: '💻',
  debug: '🐛',
  review: '🔍',
  explain: '💡',
  profile: '👤',
  error: '❌',
  
  // Progress & Stats
  xp: '✨',
  level: '📊',
  streak: '🔥',
  achievement: '🏆',
  certificate: '🎓',
  progress: '📈',
  stats: '📊',
  
  // Feedback
  correct: '✅',
  wrong: '❌',
  hint: '💡',
  tip: '💭',
  warning: '⚠️',
  info: 'ℹ️',
  
  // Social & Competition
  challenge: '⚔️',
  arena: '🏟️',
  leaderboard: '👑',
  party: '🎉',
  share: '📤',
  invite: '📨',
  
  // Ranks
  bronze: '🥉',
  silver: '🥈',
  gold: '🥇',
  diamond: '💎',
  legendary: '👑',
  
  // Topics
  python: '🐍',
  javascript: '⚡',
  typescript: '🔷',
  react: '⚛️',
  node: '💚',
  html: '🌐',
  css: '🎨',
  sql: '🗃️',
  git: '📚',
  api: '🔌',
  algorithms: '🧮',
  datastructures: '📊',
  
  // Quiz Options
  optionA: '🔵',
  optionB: '🟢',
  optionC: '🟡',
  optionD: '🟣',
  
  // Misc
  rocket: '🚀',
  star: '⭐',
  sparkle: '✨',
  fire: '🔥',
  lightning: '⚡',
  trophy: '🏆',
  medal: '🏅',
  gem: '💎',
  crown: '👑',
  target: '🎯',
  brain: '🧠',
  book: '📚',
  clock: '⏰',
  calendar: '📅',
  gift: '🎁',
  lock: '🔒',
  unlock: '🔓',
  checkmark: '✓',
  cross: '✗',
  
  // Status
  online: '🟢',
  offline: '⚫',
  loading: '⏳',
  complete: '✅',
  incomplete: '⬜',
  active: '🟢',
  inactive: '⚫'
};

// ═══════════════════════════════════════════════════════════════════════════════
// 🎨 VISUAL ELEMENTS
// ═══════════════════════════════════════════════════════════════════════════════

export const VISUALS = {
  // Progress Bar Characters
  progressBar: {
    filled: '▰',
    empty: '▱',
    filledAlt: '█',
    emptyAlt: '░'
  },
  
  // Separators
  separators: {
    thin: '━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
    thick: '═══════════════════════════════',
    dots: '• • • • • • • • • • • • • • •',
    fancy: '✦ ═══════════════════════ ✦',
    dashed: '─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─'
  },
  
  // Box Drawing
  box: {
    topLeft: '╭',
    topRight: '╮',
    bottomLeft: '╰',
    bottomRight: '╯',
    horizontal: '─',
    vertical: '│',
    
    // Double line box
    dTopLeft: '╔',
    dTopRight: '╗',
    dBottomLeft: '╚',
    dBottomRight: '╝',
    dHorizontal: '═',
    dVertical: '║'
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// 🏆 RANK SYSTEM
// ═══════════════════════════════════════════════════════════════════════════════

export const RANKS = {
  novice: { 
    name: 'Novice', 
    emoji: '🌱', 
    color: COLORS.BRONZE, 
    minLevel: 1,
    badge: '○○○○○',
    title: 'NEW EXPLORER'
  },
  beginner: { 
    name: 'Beginner', 
    emoji: '🥉', 
    color: COLORS.BRONZE, 
    minLevel: 5,
    badge: '●○○○○',
    title: 'KEEN LEARNER'
  },
  intermediate: { 
    name: 'Intermediate', 
    emoji: '🥈', 
    color: COLORS.SILVER, 
    minLevel: 12,
    badge: '●●○○○',
    title: 'RISING STAR'
  },
  advanced: { 
    name: 'Advanced', 
    emoji: '🥇', 
    color: COLORS.GOLD, 
    minLevel: 20,
    badge: '●●●○○',
    title: 'SKILLED CODER'
  },
  expert: { 
    name: 'Expert', 
    emoji: '🔮', 
    color: COLORS.PLATINUM, 
    minLevel: 30,
    badge: '●●●●○',
    title: 'EXPERT DEV'
  },
  master: { 
    name: 'Master', 
    emoji: '💎', 
    color: COLORS.DIAMOND, 
    minLevel: 40,
    badge: '●●●●●',
    title: 'MASTER CODER'
  },
  legend: { 
    name: 'Legend', 
    emoji: '👑', 
    color: COLORS.LEGENDARY, 
    minLevel: 50,
    badge: '◆◆◆◆◆',
    title: 'LEGENDARY MENTOR'
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// 🎁 XP REWARDS SYSTEM
// ═══════════════════════════════════════════════════════════════════════════════

export const XP_REWARDS = {
  // Learning
  LESSON_COMPLETE: 40,
  FIRST_LESSON: 25,
  TOPIC_MASTERY: 100,
  
  // Quizzes
  QUIZ_COMPLETE: 20,
  QUIZ_CORRECT: 15,
  QUIZ_PERFECT: 100,
  FIRST_QUIZ: 25,
  
  // Daily & Streaks
  DAILY_BONUS: 75,
  STREAK_BONUS: 10, // Per day of streak
  STREAK_MILESTONE_7: 200,
  STREAK_MILESTONE_14: 400,
  STREAK_MILESTONE_30: 1000,
  STREAK_MILESTONE_100: 5000,
  
  // Engagement
  CODE_RUN: 10,
  CODE_REVIEW: 20,
  DEBUG_SESSION: 25,
  EXPLANATION: 15,
  FUN_FACT: 5,
  QUICK_QUIZ: 25,
  
  // Social
  CHALLENGE_WIN: 100,
  CHALLENGE_PARTICIPATE: 25,
  REFERRAL: 200,
  SHARE: 10,
  
  // Achievements
  ACHIEVEMENT_UNLOCK: 50,
  LEVEL_UP_BONUS: 50
};

// ═══════════════════════════════════════════════════════════════════════════════
// 📊 HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Get rank info based on level
 */
export function getRank(level) {
  if (level >= 50) return RANKS.legend;
  if (level >= 40) return RANKS.master;
  if (level >= 30) return RANKS.expert;
  if (level >= 20) return RANKS.advanced;
  if (level >= 12) return RANKS.intermediate;
  if (level >= 5) return RANKS.beginner;
  return RANKS.novice;
}

/**
 * Get next rank info
 */
export function getNextRank(level) {
  const ranks = Object.values(RANKS).sort((a, b) => a.minLevel - b.minLevel);
  return ranks.find(r => r.minLevel > level) || RANKS.legend;
}

/**
 * Create progress bar
 */
export function createProgressBar(current, max, length = 10, style = 'default') {
  const safeMax = max || 1;
  const safeCurrent = Math.max(0, current || 0);
  const percentage = Math.min(safeCurrent / safeMax, 1);
  const filled = Math.round(percentage * length);
  const empty = length - filled;
  
  const styles = {
    default: { f: VISUALS.progressBar.filled, e: VISUALS.progressBar.empty },
    block: { f: VISUALS.progressBar.filledAlt, e: VISUALS.progressBar.emptyAlt },
    circle: { f: '●', e: '○' },
    square: { f: '◆', e: '◇' },
    star: { f: '★', e: '☆' }
  };
  
  const s = styles[style] || styles.default;
  return s.f.repeat(filled) + s.e.repeat(empty);
}

/**
 * Create XP progress bar with level info
 */
export function createXPBar(user, length = 12) {
  // xpForLevel(level) = XP needed to go from current level to next
  const xpNeeded = xpForLevel(user.level);
  const xpIntoLevel = user.xp;
  const bar = createProgressBar(xpIntoLevel, xpNeeded, length);
  const percentage = Math.round((xpIntoLevel / (xpNeeded || 1)) * 100);
  
  return `${bar} ${percentage}%\n✨ ${xpIntoLevel.toLocaleString()} / ${xpNeeded.toLocaleString()} XP`;
}

/**
 * Calculate XP needed to level up from a given level
 * xpForLevel(1) = 100 XP to reach level 2
 * xpForLevel(6) = 759 XP to reach level 7
 */
export function xpForLevel(level) {
  return Math.floor(100 * Math.pow(1.5, level - 1));
}

/**
 * Get topic emoji
 */
export function getTopicEmoji(topic) {
  const normalized = topic.toLowerCase().replace(/[^a-z]/g, '');
  const topicMap = {
    python: EMOJIS.python,
    javascript: EMOJIS.javascript,
    js: EMOJIS.javascript,
    typescript: EMOJIS.typescript,
    ts: EMOJIS.typescript,
    react: EMOJIS.react,
    node: EMOJIS.node,
    nodejs: EMOJIS.node,
    html: EMOJIS.html,
    css: EMOJIS.css,
    sql: EMOJIS.sql,
    git: EMOJIS.git,
    api: EMOJIS.api,
    algorithms: EMOJIS.algorithms,
    datastructures: EMOJIS.datastructures
  };
  return topicMap[normalized] || EMOJIS.book;
}

/**
 * Get topic color
 */
export function getTopicColor(topic) {
  const normalized = topic.toLowerCase().replace(/[^a-z]/g, '');
  const colorMap = {
    python: COLORS.PYTHON,
    javascript: COLORS.JAVASCRIPT,
    js: COLORS.JAVASCRIPT,
    typescript: COLORS.TYPESCRIPT,
    ts: COLORS.TYPESCRIPT,
    react: COLORS.REACT,
    node: COLORS.NODEJS,
    nodejs: COLORS.NODEJS,
    html: COLORS.HTML,
    css: COLORS.CSS,
    sql: COLORS.SQL,
    git: COLORS.GIT
  };
  return colorMap[normalized] || COLORS.PRIMARY;
}

/**
 * Get difficulty color
 */
export function getDifficultyColor(difficulty) {
  const map = {
    easy: COLORS.EASY,
    medium: COLORS.MEDIUM,
    hard: COLORS.HARD
  };
  return map[difficulty?.toLowerCase()] || COLORS.MEDIUM;
}

/**
 * Get difficulty emoji
 */
export function getDifficultyEmoji(difficulty) {
  const map = {
    easy: '🟢',
    medium: '🟡',
    hard: '🔴'
  };
  return map[difficulty?.toLowerCase()] || '🟡';
}

/**
 * Format large numbers
 */
export function formatNumber(num) {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toLocaleString();
}

/**
 * Format duration
 */
export function formatDuration(ms) {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
  return `${seconds}s`;
}

/**
 * Get streak multiplier
 */
export function getStreakMultiplier(streak) {
  if (streak >= 30) return 2.0;
  if (streak >= 14) return 1.5;
  if (streak >= 7) return 1.25;
  if (streak >= 3) return 1.1;
  return 1.0;
}

// ═══════════════════════════════════════════════════════════════════════════════
// 📐 EMBED TEMPLATES
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Create standard embed with consistent styling
 */
export function createEmbed(options = {}) {
  const embed = new EmbedBuilder()
    .setColor(options.color || COLORS.PRIMARY)
    .setTimestamp();
  
  if (options.author) {
    embed.setAuthor({
      name: options.author.name || `${EMOJIS.achievement} ${BRAND.name}`,
      iconURL: options.author.icon
    });
  }
  
  if (options.title) embed.setTitle(options.title);
  if (options.description) embed.setDescription(options.description);
  if (options.thumbnail) embed.setThumbnail(options.thumbnail);
  if (options.image) embed.setImage(options.image);
  if (options.fields) embed.addFields(options.fields);
  
  if (options.footer) {
    embed.setFooter({
      text: options.footer.text || `${EMOJIS.hint} ${BRAND.tagline}`,
      iconURL: options.footer.icon
    });
  }
  
  return embed;
}

/**
 * Create loading embed
 */
export function createLoadingEmbed(message = 'Loading...', stage = 0) {
  const frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
  const progressBars = [
    '▱▱▱▱▱▱▱▱▱▱',
    '▰▱▱▱▱▱▱▱▱▱',
    '▰▰▱▱▱▱▱▱▱▱',
    '▰▰▰▱▱▱▱▱▱▱',
    '▰▰▰▰▱▱▱▱▱▱',
    '▰▰▰▰▰▱▱▱▱▱',
    '▰▰▰▰▰▰▱▱▱▱',
    '▰▰▰▰▰▰▰▱▱▱',
    '▰▰▰▰▰▰▰▰▱▱',
    '▰▰▰▰▰▰▰▰▰▱',
    '▰▰▰▰▰▰▰▰▰▰'
  ];
  
  const barIndex = Math.min(stage, progressBars.length - 1);
  
  return new EmbedBuilder()
    .setColor(COLORS.PRIMARY)
    .setDescription(`
╭─────────────────────────────╮
│                             │
│   ${EMOJIS.brain} ${message.padEnd(20)}  │
│                             │
│   ${progressBars[barIndex]}        │
│                             │
╰─────────────────────────────╯
    `);
}

/**
 * Create success embed
 */
export function createSuccessEmbed(title, description) {
  return new EmbedBuilder()
    .setColor(COLORS.SUCCESS)
    .setTitle(`${EMOJIS.correct} ${title}`)
    .setDescription(description)
    .setTimestamp();
}

/**
 * Create error embed with helpful suggestions
 */
export function createErrorEmbed(title, description, suggestion) {
  const embed = new EmbedBuilder()
    .setColor(COLORS.ERROR)
    .setTitle(`${EMOJIS.warning} ${title}`)
    .setDescription(description)
    .setTimestamp();
  
  if (suggestion) {
    embed.addFields({
      name: `${EMOJIS.hint} Suggestion`,
      value: suggestion,
      inline: false
    });
  }
  
  embed.setFooter({ text: '🛠️ If this keeps happening, use /feedback to let us know!' });
  
  return embed;
}

/**
 * Create XP gain notification embed
 */
export function createXPGainEmbed(xpEarned, newTotal, leveledUp = false, newLevel = null) {
  if (leveledUp) {
    return new EmbedBuilder()
      .setColor(COLORS.LEVEL_UP)
      .setTitle(`${EMOJIS.party} LEVEL UP!`)
      .setDescription(`
╔═══════════════════════════════════════╗
║                                       ║
║     ⬆️ **Level ${newLevel} Reached!**      ║
║                                       ║
║     ${getRank(newLevel).emoji} ${getRank(newLevel).name}           ║
║                                       ║
║     ${EMOJIS.gift} +${XP_REWARDS.LEVEL_UP_BONUS} Bonus XP Awarded!          ║
║                                       ║
╚═══════════════════════════════════════╝
      `)
      .setFooter({ text: `✨ +${xpEarned} XP earned!` });
  }
  
  return new EmbedBuilder()
    .setColor(COLORS.XP_GOLD)
    .setDescription(`
╭─────────────────────────────╮
│  ${EMOJIS.xp} **+${xpEarned} XP** Earned!       │
│  📊 Total: ${formatNumber(newTotal)} XP   │
╰─────────────────────────────╯
    `);
}

/**
 * Create quiz question embed
 */
export function createQuizQuestionEmbed(question, questionNum, totalQuestions, topic, difficulty) {
  const topicEmoji = getTopicEmoji(topic);
  const diffEmoji = getDifficultyEmoji(difficulty);
  const diffColor = getDifficultyColor(difficulty);
  
  const embed = new EmbedBuilder()
    .setColor(diffColor)
    .setTitle(`${EMOJIS.quiz} Question ${questionNum}/${totalQuestions}`)
    .setDescription(
      `${VISUALS.separators.fancy}\n` +
      `**${question.question}**\n` +
      `${VISUALS.separators.fancy}`
    );
  
  // Add options
  const optionEmojis = [EMOJIS.optionA, EMOJIS.optionB, EMOJIS.optionC, EMOJIS.optionD];
  const optionsText = question.options.map((opt, i) => 
    `${optionEmojis[i]} ${opt}`
  ).join('\n');
  
  embed.addFields({
    name: `${EMOJIS.target} Options`,
    value: optionsText,
    inline: false
  });
  
  // Add quiz info
  embed.addFields(
    { name: `${topicEmoji} Topic`, value: topic, inline: true },
    { name: `${diffEmoji} Difficulty`, value: difficulty.charAt(0).toUpperCase() + difficulty.slice(1), inline: true }
  );
  
  // Add progress bar
  const progress = createProgressBar(questionNum - 1, totalQuestions);
  embed.addFields({
    name: `${EMOJIS.stats} Progress`,
    value: progress,
    inline: false
  });
  
  embed.setFooter({ text: `${EMOJIS.brain} ${BRAND.name} • Select an answer below` });
  
  return embed;
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🔘 BUTTON TEMPLATES
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Create button row
 */
export function createButtonRow(buttons) {
  const row = new ActionRowBuilder();
  
  buttons.forEach(btn => {
    const button = new ButtonBuilder()
      .setCustomId(btn.customId)
      .setStyle(getButtonStyle(btn.style));
    
    if (btn.label) button.setLabel(btn.label);
    if (btn.emoji) button.setEmoji(btn.emoji);
    if (btn.disabled) button.setDisabled(true);
    if (btn.url) {
      button.setStyle(ButtonStyle.Link);
      button.setURL(btn.url);
    }
    
    row.addComponents(button);
  });
  
  return row;
}

function getButtonStyle(style) {
  const styles = {
    primary: ButtonStyle.Primary,
    secondary: ButtonStyle.Secondary,
    success: ButtonStyle.Success,
    danger: ButtonStyle.Danger,
    link: ButtonStyle.Link
  };
  return styles[style?.toLowerCase()] || ButtonStyle.Secondary;
}

/**
 * Standard navigation buttons
 */
export function createNavigationButtons(page, totalPages) {
  return createButtonRow([
    { customId: 'nav_first', emoji: EMOJIS.first, style: 'secondary', disabled: page <= 1 },
    { customId: 'nav_prev', emoji: EMOJIS.back, style: 'primary', disabled: page <= 1 },
    { customId: 'nav_indicator', label: `${page}/${totalPages}`, style: 'secondary', disabled: true },
    { customId: 'nav_next', emoji: EMOJIS.forward, style: 'primary', disabled: page >= totalPages },
    { customId: 'nav_last', emoji: EMOJIS.last, style: 'secondary', disabled: page >= totalPages }
  ]);
}

/**
 * Quiz answer buttons
 */
export function createQuizAnswerButtons(eliminatedOptions = []) {
  const labels = ['A', 'B', 'C', 'D'];
  const emojis = [EMOJIS.optionA, EMOJIS.optionB, EMOJIS.optionC, EMOJIS.optionD];
  
  return createButtonRow(
    labels.map((label, i) => ({
      customId: `quiz_answer_${i}`,
      label: eliminatedOptions.includes(i) ? '❌' : label,
      emoji: eliminatedOptions.includes(i) ? undefined : emojis[i],
      style: eliminatedOptions.includes(i) ? 'secondary' : 'primary',
      disabled: eliminatedOptions.includes(i)
    }))
  );
}

/**
 * Quiz control buttons (hint, 50/50, skip)
 */
export function createQuizControlButtons(hintUsed = false, fiftyUsed = false) {
  return createButtonRow([
    { customId: 'quiz_hint', label: hintUsed ? 'Hint ✓' : 'Hint', emoji: EMOJIS.hint, style: 'secondary', disabled: hintUsed },
    { customId: 'quiz_fifty', label: fiftyUsed ? '50/50 ✓' : '50/50', emoji: '✂️', style: 'secondary', disabled: fiftyUsed },
    { customId: 'quiz_cancel', label: 'Quit', emoji: '🚪', style: 'danger' }
  ]);
}

/**
 * Post-quiz action buttons
 */
export function createPostQuizButtons(topic) {
  return createButtonRow([
    { customId: `quiz_retry_${encodeURIComponent(topic)}`, label: 'Try Again', emoji: EMOJIS.refresh, style: 'primary' },
    { customId: `learn_${encodeURIComponent(topic)}`, label: 'Study More', emoji: EMOJIS.learn, style: 'success' },
    { customId: 'quiz_new', label: 'New Topic', emoji: '🎲', style: 'secondary' },
    { customId: 'profile_view', label: 'Profile', emoji: '👤', style: 'secondary' }
  ]);
}

// ═══════════════════════════════════════════════════════════════════════════════
// 📋 SELECT MENU TEMPLATES
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Create select menu
 */
export function createSelectMenu(options) {
  const menu = new StringSelectMenuBuilder()
    .setCustomId(options.customId)
    .setPlaceholder(options.placeholder);
  
  if (options.minValues) menu.setMinValues(options.minValues);
  if (options.maxValues) menu.setMaxValues(options.maxValues);
  
  menu.addOptions(options.options.map(opt => ({
    label: opt.label,
    value: opt.value,
    description: opt.description,
    emoji: opt.emoji,
    default: opt.default
  })));
  
  return new ActionRowBuilder().addComponents(menu);
}

/**
 * Topic selection menu
 */
export function createTopicSelectMenu(customIdPrefix = 'topic') {
  return createSelectMenu({
    customId: `${customIdPrefix}_select`,
    placeholder: '📚 Choose a topic...',
    options: [
      { label: 'JavaScript', value: 'JavaScript', emoji: EMOJIS.javascript, description: 'Web programming' },
      { label: 'Python', value: 'Python', emoji: EMOJIS.python, description: 'Versatile & beginner-friendly' },
      { label: 'React', value: 'React', emoji: EMOJIS.react, description: 'UI component library' },
      { label: 'Node.js', value: 'Node.js', emoji: EMOJIS.node, description: 'Server-side JavaScript' },
      { label: 'TypeScript', value: 'TypeScript', emoji: EMOJIS.typescript, description: 'Typed JavaScript' },
      { label: 'HTML & CSS', value: 'HTML CSS', emoji: EMOJIS.html, description: 'Web fundamentals' },
      { label: 'SQL', value: 'SQL', emoji: EMOJIS.sql, description: 'Database queries' },
      { label: 'Git', value: 'Git', emoji: EMOJIS.git, description: 'Version control' },
      { label: 'APIs', value: 'APIs', emoji: EMOJIS.api, description: 'API fundamentals' },
      { label: 'Algorithms', value: 'Algorithms', emoji: EMOJIS.algorithms, description: 'Problem solving' }
    ]
  });
}

/**
 * Difficulty selection menu
 */
export function createDifficultySelectMenu(customIdPrefix = 'difficulty') {
  return createSelectMenu({
    customId: `${customIdPrefix}_select`,
    placeholder: '📊 Choose difficulty...',
    options: [
      { label: 'Easy', value: 'easy', emoji: '🟢', description: 'Beginner friendly' },
      { label: 'Medium', value: 'medium', emoji: '🟡', description: 'Standard challenge' },
      { label: 'Hard', value: 'hard', emoji: '🔴', description: 'Expert level' }
    ]
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🏆 ACHIEVEMENT DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════════════

export const ACHIEVEMENTS = {
  // Learning Milestones
  FIRST_LESSON: { id: 'first_lesson', name: 'First Steps', emoji: '👣', description: 'Complete your first lesson', xp: 50, rarity: 'common' },
  LESSONS_10: { id: 'lessons_10', name: 'Dedicated Learner', emoji: '📚', description: 'Complete 10 lessons', xp: 100, rarity: 'uncommon' },
  LESSONS_50: { id: 'lessons_50', name: 'Knowledge Seeker', emoji: '🧠', description: 'Complete 50 lessons', xp: 250, rarity: 'rare' },
  LESSONS_100: { id: 'lessons_100', name: 'Scholar', emoji: '🎓', description: 'Complete 100 lessons', xp: 500, rarity: 'epic' },
  
  // Quiz Achievements
  FIRST_QUIZ: { id: 'first_quiz', name: 'Quiz Taker', emoji: '🎯', description: 'Complete your first quiz', xp: 50, rarity: 'common' },
  PERFECT_QUIZ: { id: 'perfect_quiz', name: 'Perfect Score', emoji: '💯', description: 'Get 100% on a quiz', xp: 100, rarity: 'uncommon' },
  PERFECT_10: { id: 'perfect_10', name: 'Perfectionist', emoji: '⭐', description: 'Get 10 perfect scores', xp: 300, rarity: 'rare' },
  QUIZZES_50: { id: 'quizzes_50', name: 'Quiz Master', emoji: '🏆', description: 'Complete 50 quizzes', xp: 250, rarity: 'rare' },
  SHARPSHOOTER: { id: 'sharpshooter', name: 'Sharpshooter', emoji: '🎯', description: '90%+ overall accuracy', xp: 400, rarity: 'epic' },
  
  // Streak Achievements
  STREAK_3: { id: 'streak_3', name: 'Getting Started', emoji: '🔥', description: '3 day streak', xp: 75, rarity: 'common' },
  STREAK_7: { id: 'streak_7', name: 'On Fire', emoji: '🔥', description: '7 day streak', xp: 150, rarity: 'uncommon' },
  STREAK_14: { id: 'streak_14', name: 'Committed', emoji: '💪', description: '14 day streak', xp: 300, rarity: 'rare' },
  STREAK_30: { id: 'streak_30', name: 'Unstoppable', emoji: '⚡', description: '30 day streak', xp: 500, rarity: 'epic' },
  STREAK_100: { id: 'streak_100', name: 'Legendary', emoji: '👑', description: '100 day streak', xp: 1000, rarity: 'legendary' },
  
  // Level Achievements
  LEVEL_5: { id: 'level_5', name: 'Rising Star', emoji: '⭐', description: 'Reach Level 5', xp: 100, rarity: 'common' },
  LEVEL_10: { id: 'level_10', name: 'Dedicated', emoji: '🌟', description: 'Reach Level 10', xp: 200, rarity: 'uncommon' },
  LEVEL_25: { id: 'level_25', name: 'Expert', emoji: '💫', description: 'Reach Level 25', xp: 500, rarity: 'rare' },
  LEVEL_50: { id: 'level_50', name: 'Master', emoji: '👑', description: 'Reach Level 50', xp: 1000, rarity: 'legendary' },
  
  // Topic Achievements
  POLYMATH: { id: 'polymath', name: 'Polymath', emoji: '🧩', description: 'Study 5 different topics', xp: 150, rarity: 'uncommon' },
  SPECIALIST: { id: 'specialist', name: 'Specialist', emoji: '🔬', description: 'Reach 80% mastery in a topic', xp: 200, rarity: 'rare' },
  
  // Code Execution
  FIRST_RUN: { id: 'first_run', name: 'Hello World', emoji: '💻', description: 'Run your first code', xp: 50, rarity: 'common' },
  CODE_RUNS_50: { id: 'code_runs_50', name: 'Coder', emoji: '⌨️', description: 'Run 50 code snippets', xp: 200, rarity: 'rare' },
  
  // Social
  CHALLENGER: { id: 'challenger', name: 'Challenger', emoji: '⚔️', description: 'Win your first challenge', xp: 100, rarity: 'uncommon' },
  SOCIAL_BUTTERFLY: { id: 'social_butterfly', name: 'Social Butterfly', emoji: '🦋', description: 'Invite 5 friends', xp: 300, rarity: 'rare' },
  
  // Special
  NIGHT_OWL: { id: 'night_owl', name: 'Night Owl', emoji: '🦉', description: 'Learn after midnight', xp: 50, rarity: 'common' },
  EARLY_BIRD: { id: 'early_bird', name: 'Early Bird', emoji: '🐦', description: 'Learn before 6 AM', xp: 50, rarity: 'common' },
  SPEEDRUNNER: { id: 'speedrunner', name: 'Speedrunner', emoji: '⚡', description: 'Complete a quiz in under 30 seconds', xp: 150, rarity: 'rare' }
};

export const ACHIEVEMENT_CATEGORIES = {
  learning: { name: 'Learning', emoji: '📚', ids: ['first_lesson', 'lessons_10', 'lessons_50', 'lessons_100'] },
  quizzes: { name: 'Quizzes', emoji: '🎯', ids: ['first_quiz', 'perfect_quiz', 'perfect_10', 'quizzes_50', 'sharpshooter'] },
  streaks: { name: 'Streaks', emoji: '🔥', ids: ['streak_3', 'streak_7', 'streak_14', 'streak_30', 'streak_100'] },
  levels: { name: 'Levels', emoji: '⭐', ids: ['level_5', 'level_10', 'level_25', 'level_50'] },
  coding: { name: 'Coding', emoji: '💻', ids: ['first_run', 'code_runs_50'] },
  social: { name: 'Social', emoji: '👥', ids: ['challenger', 'social_butterfly'] },
  special: { name: 'Special', emoji: '✨', ids: ['night_owl', 'early_bird', 'speedrunner', 'polymath', 'specialist'] }
};

/**
 * Get rarity color
 */
export function getRarityColor(rarity) {
  const colors = {
    common: 0x95A5A6,
    uncommon: 0x2ECC71,
    rare: 0x3498DB,
    epic: 0x9B59B6,
    legendary: 0xF1C40F
  };
  return colors[rarity] || colors.common;
}

/**
 * Get rarity stars
 */
export function getRarityStars(rarity) {
  const stars = {
    common: '⭐',
    uncommon: '⭐⭐',
    rare: '⭐⭐⭐',
    epic: '⭐⭐⭐⭐',
    legendary: '⭐⭐⭐⭐⭐'
  };
  return stars[rarity] || stars.common;
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🏆 LEADERBOARD EMBED
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Create a beautiful leaderboard embed
 * @param {Array} users - Array of user objects sorted by XP/Level
 * @param {number} page - Current page number
 * @param {number} totalPages - Total number of pages
 * @param {string} requestingUserId - The ID of the user viewing (to highlight their position)
 * @returns {EmbedBuilder}
 */
export function createLeaderboardEmbed(users, page = 1, totalPages = 1, requestingUserId = null) {
  const positionEmojis = ['👑', '🥈', '🥉'];
  const usersPerPage = 10;
  const startPos = (page - 1) * usersPerPage;

  const embed = new EmbedBuilder()
    .setTitle(`${EMOJIS.leaderboard} Global Leaderboard`)
    .setColor(COLORS.XP_GOLD)
    .setDescription(`${VISUALS.separators.fancy}\n**Top learners ranked by XP**\n${VISUALS.separators.fancy}`);

  if (!users || users.length === 0) {
    embed.addFields({
      name: `${EMOJIS.tip} No entries yet`,
      value: 'Be the first on the leaderboard! Use `/quiz` to earn XP.',
      inline: false
    });
  } else {
    // Build leaderboard entries
    const entries = users.map((user, index) => {
      const globalPosition = startPos + index + 1;
      const rank = getRank(user.level || 1);
      const isRequestingUser = user.discordId === requestingUserId || user.id === requestingUserId;
      
      // Position indicator
      let positionDisplay;
      if (globalPosition <= 3) {
        positionDisplay = positionEmojis[globalPosition - 1];
      } else {
        positionDisplay = `\`#${globalPosition}\``;
      }
      
      // User line with highlight for requesting user
      const userLine = isRequestingUser
        ? `**${positionDisplay} ${user.username || 'Unknown'}** ← You`
        : `${positionDisplay} ${user.username || 'Unknown'}`;
      
      // Stats line
      const statsLine = `${rank.emoji} Lv.${user.level || 1} • ${formatNumber(user.xp || 0)} XP`;
      
      // Streak indicator
      const streakDisplay = (user.streak || 0) > 0 ? ` • ${EMOJIS.streak}${user.streak}` : '';
      
      return `${userLine}\n   └ ${statsLine}${streakDisplay}`;
    }).join('\n\n');

    embed.addFields({
      name: `${EMOJIS.trophy} Rankings`,
      value: entries,
      inline: false
    });
  }

  // Add footer with page info
  embed.setFooter({ 
    text: `${EMOJIS.brain} ${BRAND.name} • Page ${page}/${totalPages} • Updated ${new Date().toLocaleDateString()}`
  });
  embed.setTimestamp();

  return embed;
}

// ═══════════════════════════════════════════════════════════════════════════════
// 📤 EXPORT ALL
// ═══════════════════════════════════════════════════════════════════════════════

export default {
  BRAND,
  COLORS,
  EMOJIS,
  VISUALS,
  RANKS,
  XP_REWARDS,
  ACHIEVEMENTS,
  ACHIEVEMENT_CATEGORIES,
  
  // Functions
  getRank,
  getNextRank,
  createProgressBar,
  createXPBar,
  xpForLevel,
  getTopicEmoji,
  getTopicColor,
  getDifficultyColor,
  getDifficultyEmoji,
  formatNumber,
  formatDuration,
  getStreakMultiplier,
  getRarityColor,
  getRarityStars,
  
  // Embed creators
  createEmbed,
  createLoadingEmbed,
  createSuccessEmbed,
  createErrorEmbed,
  createXPGainEmbed,
  createLeaderboardEmbed,
  createQuizQuestionEmbed,
  
  // Button creators
  createButtonRow,
  createNavigationButtons,
  createQuizAnswerButtons,
  createQuizControlButtons,
  createPostQuizButtons,
  
  // Select menu creators
  createSelectMenu,
  createTopicSelectMenu,
  createDifficultySelectMenu
};
