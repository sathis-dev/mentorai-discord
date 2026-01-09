/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║                                                                              ║
 * ║   MentorAI Design System V4.0 - "Stellar"                                    ║
 * ║   Premium, Award-Winning Discord Bot UI Framework                            ║
 * ║                                                                              ║
 * ║   Crafted for Competition Excellence                                         ║
 * ║                                                                              ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

import { 
  EmbedBuilder, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle, 
  StringSelectMenuBuilder 
} from 'discord.js';

// ═══════════════════════════════════════════════════════════════════════════════
// 🎨 PREMIUM COLOR PALETTE - Carefully crafted for visual hierarchy
// ═══════════════════════════════════════════════════════════════════════════════

export const COLORS = {
  // Brand Identity
  BRAND_PRIMARY: 0x5865F2,      // Discord Blurple - Trust & Reliability
  BRAND_SECONDARY: 0x7289DA,    // Lighter Blurple - Friendly
  
  // Semantic Colors
  SUCCESS: 0x00D26A,            // Vibrant Green - Achievement
  WARNING: 0xFFB020,            // Warm Amber - Attention
  ERROR: 0xFF4757,              // Soft Red - Gentle Error
  INFO: 0x3B82F6,               // Clean Blue - Information
  
  // Feature-Specific Gradients
  LESSON: 0x667EEA,             // Purple-Blue - Learning
  QUIZ: 0xF093FB,               // Pink-Purple - Excitement
  QUIZ_CORRECT: 0x00D26A,       // Green - Correct
  QUIZ_WRONG: 0xFF6B6B,         // Coral - Incorrect
  
  // Gamification
  XP_GOLD: 0xFFD93D,            // Brilliant Gold - Rewards
  STREAK_FIRE: 0xFF6B35,        // Flame Orange - Streaks
  ACHIEVEMENT: 0xA855F7,        // Purple - Achievements
  CHALLENGE: 0xEF4444,          // Red - Challenges
  
  // Tier Colors - Player Progression
  TIER_NOVICE: 0x94A3B8,        // Slate - Beginner
  TIER_BRONZE: 0xCD7F32,        // Bronze
  TIER_SILVER: 0xC0C0C0,        // Silver
  TIER_GOLD: 0xFFD700,          // Gold
  TIER_PLATINUM: 0xE5E4E2,      // Platinum
  TIER_DIAMOND: 0x00D9FF,       // Diamond Blue
  TIER_MASTER: 0xA855F7,        // Master Purple
  TIER_LEGEND: 0xFF00FF,        // Legendary Magenta
  
  // Social Features
  PARTY: 0x8B5CF6,              // Violet - Study Party
  LEADERBOARD: 0xF59E0B,        // Amber - Competition
  PROFILE: 0x06B6D4,            // Cyan - Personal
  
  // UI States
  DISABLED: 0x4B5563,           // Muted Gray
  HIGHLIGHT: 0xFBBF24,          // Yellow Highlight
  PREMIUM: 0xD946EF,            // Fuchsia - Premium
};

// ═══════════════════════════════════════════════════════════════════════════════
// ✨ PREMIUM EMOJI SYSTEM - Consistent Visual Language
// ═══════════════════════════════════════════════════════════════════════════════

export const ICONS = {
  // Brand
  LOGO: '🎓',
  SPARKLE: '✨',
  STAR: '⭐',
  STARS: '🌟',
  
  // Navigation
  HOME: '🏠',
  BACK: '◀️',
  FORWARD: '▶️',
  FIRST: '⏮️',
  LAST: '⏭️',
  REFRESH: '🔄',
  CLOSE: '✖️',
  
  // Learning
  BOOK: '📚',
  LESSON: '📖',
  QUIZ: '🧠',
  CODE: '💻',
  LIGHTBULB: '💡',
  TARGET: '🎯',
  BRAIN: '🧠',
  PENCIL: '✏️',
  
  // Gamification
  XP: '✨',
  LEVEL: '🏆',
  STREAK: '🔥',
  CROWN: '👑',
  GEM: '💎',
  TROPHY: '🏆',
  MEDAL_GOLD: '🥇',
  MEDAL_SILVER: '🥈',
  MEDAL_BRONZE: '🥉',
  
  // Progress
  CHART: '📊',
  ROCKET: '🚀',
  CHECK: '✅',
  CROSS: '❌',
  CLOCK: '⏰',
  CALENDAR: '📅',
  
  // Status
  ONLINE: '🟢',
  IDLE: '🟡',
  DND: '🔴',
  OFFLINE: '⚫',
  
  // Quiz Options
  OPT_A: '🅰️',
  OPT_B: '🅱️',
  OPT_C: '©️',
  OPT_D: '🇩',
  
  // Misc
  GIFT: '🎁',
  PARTY: '🎉',
  SWORD: '⚔️',
  SHIELD: '🛡️',
  HEART: '❤️',
  FIRE: '🔥',
  ZAP: '⚡',
  PLANT: '🌱',
};

// ═══════════════════════════════════════════════════════════════════════════════
// 📐 LAYOUT SYSTEM - Perfect Spacing & Alignment
// ═══════════════════════════════════════════════════════════════════════════════

export const LAYOUT = {
  // Line Dividers - Clean Separators
  DIVIDER_THIN: '─'.repeat(40),
  DIVIDER_THICK: '━'.repeat(40),
  DIVIDER_DOUBLE: '═'.repeat(40),
  DIVIDER_DOTTED: '┈'.repeat(40),
  DIVIDER_DASHED: '╌'.repeat(40),
  
  // Box Drawing - Premium Frames
  BOX_TOP: '╭' + '─'.repeat(38) + '╮',
  BOX_MID: '│',
  BOX_BOT: '╰' + '─'.repeat(38) + '╯',
  
  // Section Headers
  SECTION_START: '▸ ',
  SUBSECTION: '  ├ ',
  SUBSECTION_END: '  └ ',
  
  // Bullet Points
  BULLET: '•',
  BULLET_HOLLOW: '○',
  ARROW: '→',
  DIAMOND: '◆',
  
  // Spacing
  INDENT: '   ',
  DOUBLE_INDENT: '      ',
  
  // Empty field value
  BLANK: '\u200B',
};

// ═══════════════════════════════════════════════════════════════════════════════
// 📊 PROGRESS BAR SYSTEM - Multiple Styles for Different Contexts
// ═══════════════════════════════════════════════════════════════════════════════

export const PROGRESS_STYLES = {
  // Modern Clean
  modern: {
    filled: '█',
    empty: '░',
    start: '',
    end: '',
  },
  // Rounded Aesthetic
  rounded: {
    filled: '●',
    empty: '○',
    start: '',
    end: '',
  },
  // Gradient Effect
  gradient: {
    chars: ['░', '▒', '▓', '█'],
    empty: '░',
  },
  // XP Bar - Gaming Style
  xp: {
    filled: '▰',
    empty: '▱',
    start: '〔',
    end: '〕',
  },
  // Health Bar Style
  health: {
    filled: '❤️',
    empty: '🖤',
  },
  // Stars
  stars: {
    filled: '★',
    empty: '☆',
  },
  // Blocks
  blocks: {
    filled: '▓',
    empty: '░',
    start: '▐',
    end: '▌',
  },
  // Minimal
  minimal: {
    filled: '━',
    empty: '─',
    start: '『',
    end: '』',
  },
};

/**
 * Create a beautiful progress bar
 * @param {number} current - Current value
 * @param {number} max - Maximum value  
 * @param {number} length - Bar length
 * @param {string} style - Style name
 * @returns {string} Formatted progress bar
 */
export function createProgressBar(current, max, length = 12, style = 'modern') {
  const safeMax = Math.max(max, 1);
  const safeCurrent = Math.max(0, Math.min(current, safeMax));
  const percentage = safeCurrent / safeMax;
  const filled = Math.round(percentage * length);
  const empty = length - filled;
  
  const s = PROGRESS_STYLES[style] || PROGRESS_STYLES.modern;
  
  if (style === 'gradient') {
    let bar = '';
    for (let i = 0; i < length; i++) {
      if (i < filled) {
        const charIndex = Math.min(3, Math.floor((i / filled) * 4));
        bar += s.chars[charIndex];
      } else {
        bar += s.empty;
      }
    }
    return bar;
  }
  
  const start = s.start || '';
  const end = s.end || '';
  
  return `${start}${s.filled.repeat(filled)}${s.empty.repeat(empty)}${end}`;
}

/**
 * Create percentage display with bar
 */
export function createPercentageDisplay(current, max, length = 10, style = 'xp') {
  const percentage = Math.round((Math.min(current, max) / Math.max(max, 1)) * 100);
  const bar = createProgressBar(current, max, length, style);
  return `${bar} \`${percentage}%\``;
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🏆 TIER & RANK SYSTEM
// ═══════════════════════════════════════════════════════════════════════════════

export const TIERS = {
  legend: { 
    name: 'Legend',
    emoji: '👑',
    color: COLORS.TIER_LEGEND,
    minLevel: 50,
    badge: '◆◆◆◆◆',
    title: 'Coding Legend',
    aura: '✧･ﾟ: *✧･ﾟ:*',
    xpMultiplier: 2.0,
  },
  master: {
    name: 'Master',
    emoji: '💎',
    color: COLORS.TIER_MASTER,
    minLevel: 40,
    badge: '◆◆◆◆◇',
    title: 'Code Master',
    aura: '💠═══════💠',
    xpMultiplier: 1.75,
  },
  diamond: { 
    name: 'Diamond',
    emoji: '💠',
    color: COLORS.TIER_DIAMOND,
    minLevel: 30,
    badge: '◆◆◆◇◇',
    title: 'Diamond Dev',
    aura: '✦═══════✦',
    xpMultiplier: 1.5,
  },
  platinum: { 
    name: 'Platinum',
    emoji: '🔮',
    color: COLORS.TIER_PLATINUM,
    minLevel: 20,
    badge: '◆◆◇◇◇',
    title: 'Platinum Pro',
    aura: '⚜️═══════⚜️',
    xpMultiplier: 1.35,
  },
  gold: { 
    name: 'Gold',
    emoji: '🥇',
    color: COLORS.TIER_GOLD,
    minLevel: 15,
    badge: '◆◇◇◇◇',
    title: 'Gold Scholar',
    aura: '🏆═══════🏆',
    xpMultiplier: 1.25,
  },
  silver: { 
    name: 'Silver',
    emoji: '🥈',
    color: COLORS.TIER_SILVER,
    minLevel: 10,
    badge: '◇◇◇◇◇',
    title: 'Silver Student',
    aura: '⚔️═══════⚔️',
    xpMultiplier: 1.15,
  },
  bronze: { 
    name: 'Bronze',
    emoji: '🥉',
    color: COLORS.TIER_BRONZE,
    minLevel: 5,
    badge: '○○○○○',
    title: 'Bronze Learner',
    aura: '🛡️═══════🛡️',
    xpMultiplier: 1.1,
  },
  novice: { 
    name: 'Novice',
    emoji: '🌱',
    color: COLORS.TIER_NOVICE,
    minLevel: 1,
    badge: '●○○○○',
    title: 'Novice Explorer',
    aura: '═══════════',
    xpMultiplier: 1.0,
  },
};

/**
 * Get user tier based on level
 */
export function getTier(level) {
  if (level >= 50) return TIERS.legend;
  if (level >= 40) return TIERS.master;
  if (level >= 30) return TIERS.diamond;
  if (level >= 20) return TIERS.platinum;
  if (level >= 15) return TIERS.gold;
  if (level >= 10) return TIERS.silver;
  if (level >= 5) return TIERS.bronze;
  return TIERS.novice;
}

// ═══════════════════════════════════════════════════════════════════════════════
// 📝 GRADE SYSTEM - For Quiz Results
// ═══════════════════════════════════════════════════════════════════════════════

export const GRADES = {
  'S+': { emoji: '👑', label: 'LEGENDARY', color: COLORS.TIER_LEGEND, minPercent: 100 },
  'S':  { emoji: '🏆', label: 'PERFECT', color: COLORS.XP_GOLD, minPercent: 95 },
  'A+': { emoji: '⭐', label: 'OUTSTANDING', color: COLORS.SUCCESS, minPercent: 90 },
  'A':  { emoji: '✨', label: 'EXCELLENT', color: COLORS.SUCCESS, minPercent: 85 },
  'B+': { emoji: '🌟', label: 'GREAT', color: COLORS.TIER_GOLD, minPercent: 80 },
  'B':  { emoji: '📗', label: 'GOOD', color: COLORS.INFO, minPercent: 75 },
  'C+': { emoji: '📘', label: 'FAIR', color: COLORS.INFO, minPercent: 70 },
  'C':  { emoji: '📙', label: 'PASSING', color: COLORS.WARNING, minPercent: 60 },
  'D':  { emoji: '📕', label: 'NEEDS WORK', color: COLORS.WARNING, minPercent: 50 },
  'F':  { emoji: '🔄', label: 'TRY AGAIN', color: COLORS.ERROR, minPercent: 0 },
};

/**
 * Get grade based on percentage
 */
export function getGrade(percentage) {
  if (percentage >= 100) return { grade: 'S+', ...GRADES['S+'] };
  if (percentage >= 95) return { grade: 'S', ...GRADES['S'] };
  if (percentage >= 90) return { grade: 'A+', ...GRADES['A+'] };
  if (percentage >= 85) return { grade: 'A', ...GRADES['A'] };
  if (percentage >= 80) return { grade: 'B+', ...GRADES['B+'] };
  if (percentage >= 75) return { grade: 'B', ...GRADES['B'] };
  if (percentage >= 70) return { grade: 'C+', ...GRADES['C+'] };
  if (percentage >= 60) return { grade: 'C', ...GRADES['C'] };
  if (percentage >= 50) return { grade: 'D', ...GRADES['D'] };
  return { grade: 'F', ...GRADES['F'] };
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🎨 ANSI STYLING - For Terminal-Style Text Blocks
// ═══════════════════════════════════════════════════════════════════════════════

export const ANSI = {
  reset: '\u001b[0m',
  bold: '\u001b[1m',
  underline: '\u001b[4m',
  
  // Colors
  gray: '\u001b[30m',
  red: '\u001b[31m',
  green: '\u001b[32m',
  yellow: '\u001b[33m',
  blue: '\u001b[34m',
  magenta: '\u001b[35m',
  cyan: '\u001b[36m',
  white: '\u001b[37m',
  
  // Bold Colors
  boldRed: '\u001b[1;31m',
  boldGreen: '\u001b[1;32m',
  boldYellow: '\u001b[1;33m',
  boldBlue: '\u001b[1;34m',
  boldMagenta: '\u001b[1;35m',
  boldCyan: '\u001b[1;36m',
  boldWhite: '\u001b[1;37m',
};

/**
 * Create ANSI formatted text block
 */
export function ansiBlock(content) {
  return '```ansi\n' + content + '\n```';
}

/**
 * Create styled ANSI header box
 */
export function ansiHeader(title, subtitle = '', style = 'default') {
  const { boldCyan, boldYellow, boldWhite, reset } = ANSI;
  
  const styles = {
    default: {
      top: `${boldCyan}╔${'═'.repeat(42)}╗${reset}`,
      mid: `${boldCyan}║${reset}`,
      bot: `${boldCyan}╚${'═'.repeat(42)}╝${reset}`,
    },
    gold: {
      top: `${boldYellow}╔${'═'.repeat(42)}╗${reset}`,
      mid: `${boldYellow}║${reset}`,
      bot: `${boldYellow}╚${'═'.repeat(42)}╝${reset}`,
    },
    minimal: {
      top: `${boldWhite}┌${'─'.repeat(42)}┐${reset}`,
      mid: `${boldWhite}│${reset}`,
      bot: `${boldWhite}└${'─'.repeat(42)}┘${reset}`,
    },
  };
  
  const s = styles[style] || styles.default;
  const titlePadded = centerText(title, 40);
  const subtitleLine = subtitle ? `\n${s.mid}  ${boldWhite}${centerText(subtitle, 38)}${reset}  ${s.mid}` : '';
  
  return ansiBlock(
    `${s.top}\n${s.mid}  ${boldYellow}${titlePadded}${reset}  ${s.mid}${subtitleLine}\n${s.bot}`
  );
}

/**
 * Center text within a given width
 */
function centerText(text, width) {
  const textLength = text.replace(/\u001b\[[0-9;]*m/g, '').length;
  const padding = Math.max(0, width - textLength);
  const leftPad = Math.floor(padding / 2);
  const rightPad = padding - leftPad;
  return ' '.repeat(leftPad) + text + ' '.repeat(rightPad);
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🖼️ EMBED TEMPLATES - Pre-designed Beautiful Embeds
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Base Premium Embed with consistent styling
 */
export function createPremiumEmbed(options = {}) {
  const embed = new EmbedBuilder()
    .setColor(options.color || COLORS.BRAND_PRIMARY)
    .setTimestamp();
  
  if (options.title) embed.setTitle(options.title);
  if (options.description) embed.setDescription(options.description);
  if (options.thumbnail) embed.setThumbnail(options.thumbnail);
  if (options.image) embed.setImage(options.image);
  if (options.author) embed.setAuthor(options.author);
  if (options.fields) embed.addFields(options.fields);
  
  embed.setFooter({ 
    text: options.footerText || `${ICONS.LOGO} MentorAI • AI-Powered Learning`,
    iconURL: options.footerIcon,
  });
  
  return embed;
}

/**
 * Success Embed - For positive outcomes
 */
export function createSuccessEmbed(title, description, options = {}) {
  return createPremiumEmbed({
    title: `${ICONS.CHECK} ${title}`,
    description,
    color: COLORS.SUCCESS,
    ...options,
  });
}

/**
 * Error Embed - For errors and failures
 */
export function createErrorEmbed(title, description, options = {}) {
  return createPremiumEmbed({
    title: `${ICONS.CROSS} ${title}`,
    description,
    color: COLORS.ERROR,
    ...options,
  });
}

/**
 * Warning Embed - For cautions and alerts
 */
export function createWarningEmbed(title, description, options = {}) {
  return createPremiumEmbed({
    title: `⚠️ ${title}`,
    description,
    color: COLORS.WARNING,
    ...options,
  });
}

/**
 * Info Embed - For informational content
 */
export function createInfoEmbed(title, description, options = {}) {
  return createPremiumEmbed({
    title: `ℹ️ ${title}`,
    description,
    color: COLORS.INFO,
    ...options,
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🔘 BUTTON BUILDER SYSTEM - Consistent Button Styling
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Create a styled action row with buttons
 */
export function createButtonRow(buttons) {
  const row = new ActionRowBuilder();
  buttons.forEach(btn => {
    row.addComponents(
      new ButtonBuilder()
        .setCustomId(btn.id)
        .setLabel(btn.label)
        .setStyle(btn.style || ButtonStyle.Secondary)
        .setEmoji(btn.emoji || null)
        .setDisabled(btn.disabled || false)
    );
  });
  return row;
}

/**
 * Quiz Answer Buttons - A, B, C, D with premium styling
 */
export function createQuizAnswerButtons(quizId = '', disabled = false) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`quiz_answer_${quizId}_0`)
      .setLabel('A')
      .setStyle(ButtonStyle.Primary)
      .setDisabled(disabled),
    new ButtonBuilder()
      .setCustomId(`quiz_answer_${quizId}_1`)
      .setLabel('B')
      .setStyle(ButtonStyle.Primary)
      .setDisabled(disabled),
    new ButtonBuilder()
      .setCustomId(`quiz_answer_${quizId}_2`)
      .setLabel('C')
      .setStyle(ButtonStyle.Primary)
      .setDisabled(disabled),
    new ButtonBuilder()
      .setCustomId(`quiz_answer_${quizId}_3`)
      .setLabel('D')
      .setStyle(ButtonStyle.Primary)
      .setDisabled(disabled),
  );
}

/**
 * Quiz Control Buttons - Hint, Skip, Cancel
 */
export function createQuizControlButtons(showHint = false) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('quiz_hint')
      .setLabel('Hint')
      .setEmoji('💡')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(!showHint),
    new ButtonBuilder()
      .setCustomId('quiz_skip')
      .setLabel('Skip')
      .setEmoji('⏭️')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId('quiz_cancel')
      .setLabel('Exit')
      .setEmoji('🚪')
      .setStyle(ButtonStyle.Danger),
  );
}

/**
 * Navigation Buttons - For pagination
 */
export function createNavigationButtons(currentPage, totalPages, prefix = 'page') {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`${prefix}_first`)
      .setEmoji('⏮️')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(currentPage <= 1),
    new ButtonBuilder()
      .setCustomId(`${prefix}_prev`)
      .setEmoji('◀️')
      .setStyle(ButtonStyle.Primary)
      .setDisabled(currentPage <= 1),
    new ButtonBuilder()
      .setCustomId(`${prefix}_indicator`)
      .setLabel(`${currentPage} / ${totalPages}`)
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(true),
    new ButtonBuilder()
      .setCustomId(`${prefix}_next`)
      .setEmoji('▶️')
      .setStyle(ButtonStyle.Primary)
      .setDisabled(currentPage >= totalPages),
    new ButtonBuilder()
      .setCustomId(`${prefix}_last`)
      .setEmoji('⏭️')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(currentPage >= totalPages),
  );
}

/**
 * Post-Quiz Action Buttons
 */
export function createPostQuizButtons(topic = 'general') {
  const safeTopic = encodeURIComponent(topic.substring(0, 50));
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`quiz_retry_${safeTopic}`)
      .setLabel('Try Again')
      .setEmoji('🔄')
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId(`lesson_start_${safeTopic}`)
      .setLabel('Learn More')
      .setEmoji('📚')
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId('view_leaderboard')
      .setLabel('Leaderboard')
      .setEmoji('🏆')
      .setStyle(ButtonStyle.Secondary),
  );
}

/**
 * Lesson Action Buttons
 */
export function createLessonButtons(topic = 'general') {
  const safeTopic = encodeURIComponent(topic.substring(0, 50));
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`quiz_start_${safeTopic}`)
      .setLabel('Take Quiz')
      .setEmoji('🎯')
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId(`lesson_next_${safeTopic}`)
      .setLabel('Next Lesson')
      .setEmoji('➡️')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId(`lesson_explain_${safeTopic}`)
      .setLabel('Explain More')
      .setEmoji('❓')
      .setStyle(ButtonStyle.Secondary),
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 📋 SELECT MENU BUILDERS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Create a styled select menu
 */
export function createSelectMenu(id, placeholder, options) {
  return new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId(id)
      .setPlaceholder(placeholder)
      .addOptions(options.map(opt => ({
        label: opt.label,
        description: opt.description,
        value: opt.value,
        emoji: opt.emoji,
        default: opt.default || false,
      })))
  );
}

/**
 * Topic Selection Menu
 */
export function createTopicSelectMenu(topics) {
  const options = topics.slice(0, 25).map(t => ({
    label: t.name || t,
    description: t.description || `Learn ${t.name || t}`,
    value: (t.value || t.name || t).toLowerCase(),
    emoji: t.emoji || '📚',
  }));
  
  return createSelectMenu('topic_select', '📚 Choose a topic...', options);
}

/**
 * Difficulty Selection Menu
 */
export function createDifficultySelectMenu() {
  return createSelectMenu('difficulty_select', '📊 Select difficulty...', [
    { label: 'Easy', description: 'Perfect for beginners', value: 'easy', emoji: '🟢' },
    { label: 'Medium', description: 'Standard challenge', value: 'medium', emoji: '🟡' },
    { label: 'Hard', description: 'For experienced coders', value: 'hard', emoji: '🔴' },
    { label: 'Expert', description: 'Ultimate challenge', value: 'expert', emoji: '💀' },
  ]);
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🎮 SPECIALIZED EMBED BUILDERS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Profile Card Embed - Beautiful user profile
 */
export function createProfileEmbed(user, avatarURL, options = {}) {
  const level = user.level || 1;
  const xp = user.xp || 0;
  const totalXp = user.totalXp || xp;
  // Use correct exponential XP formula: 100 * 1.5^(level-1)
  const xpNeeded = typeof user.xpForNextLevel === 'function' ? user.xpForNextLevel() : Math.floor(100 * Math.pow(1.5, level - 1));
  const streak = user.streak || 0;
  const tier = getTier(level);
  
  const accuracy = user.totalQuestions > 0 
    ? Math.round((user.correctAnswers / user.totalQuestions) * 100) 
    : 0;
  
  // Create XP progress display
  const xpProgress = createPercentageDisplay(xp, xpNeeded, 12, 'xp');
  
  // Streak display with visual
  const streakDisplay = streak >= 7 
    ? `${'🔥'.repeat(Math.min(streak, 7))} **${streak} days** 🎉`
    : streak > 0 
      ? `${'🔥'.repeat(streak)} **${streak} day${streak !== 1 ? 's' : ''}**`
      : '❄️ *No streak yet*';
  
  const embed = new EmbedBuilder()
    .setColor(tier.color)
    .setAuthor({
      name: `${tier.emoji} ${user.username || 'User'}'s Profile`,
      iconURL: avatarURL,
    })
    .setThumbnail(avatarURL)
    .setDescription(
      `${tier.aura}\n` +
      `**${tier.title}** • Level ${level}\n` +
      `${tier.aura}`
    )
    .addFields(
      { 
        name: '📊 Progress to Next Level', 
        value: `${xpProgress}\n**${xp.toLocaleString()}** / **${xpNeeded.toLocaleString()}** XP`, 
        inline: false,
      },
      { name: '⭐ Level', value: `**${level}**`, inline: true },
      { name: '💎 Total XP', value: `**${totalXp.toLocaleString()}**`, inline: true },
      { name: '🏆 Tier', value: `**${tier.name}**`, inline: true },
      { name: '🔥 Streak', value: streakDisplay, inline: true },
      { name: '🎯 Accuracy', value: `**${accuracy}%**`, inline: true },
      { name: '📝 Quizzes', value: `**${user.quizzesTaken || 0}**`, inline: true },
    )
    .setFooter({ text: `${ICONS.LOGO} MentorAI • ${tier.badge}` })
    .setTimestamp();
  
  // Add achievements if any
  if (user.achievements && user.achievements.length > 0) {
    const recentAchievements = user.achievements.slice(-4).map(a => `🏅 ${a}`).join('\n');
    embed.addFields({
      name: `🏆 Achievements (${user.achievements.length})`,
      value: recentAchievements,
      inline: false,
    });
  }
  
  return embed;
}

/**
 * Quiz Question Embed - Clean and focused
 */
export function createQuizQuestionEmbed(question, questionNum, totalQuestions, topic, difficulty = 'medium') {
  const difficultyConfig = {
    easy: { color: COLORS.SUCCESS, emoji: '🟢', xp: 20 },
    medium: { color: COLORS.QUIZ, emoji: '🟡', xp: 30 },
    hard: { color: COLORS.ERROR, emoji: '🔴', xp: 45 },
  };
  
  const diff = difficultyConfig[difficulty] || difficultyConfig.medium;
  const progress = createProgressBar(questionNum, totalQuestions, 10, 'modern');
  
  // Format question - if it has code, keep it, otherwise make it stand out
  const questionText = question.question || question;
  
  const embed = new EmbedBuilder()
    .setColor(diff.color)
    .setAuthor({ name: `📚 ${topic} Quiz` })
    .setTitle(`❓ Question ${questionNum} of ${totalQuestions}`)
    .setDescription(
      `${progress} \`${Math.round((questionNum/totalQuestions)*100)}%\`\n\n` +
      `### ${questionText}`
    )
    .setFooter({ 
      text: `${diff.emoji} ${difficulty.charAt(0).toUpperCase() + difficulty.slice(1)} • +${diff.xp} XP • ${ICONS.LOGO} MentorAI`,
    })
    .setTimestamp();
  
  // Add options as fields for cleaner display
  const options = question.options || [];
  const optionEmojis = ['🅰️', '🅱️', '🅲', '🅳'];
  
  if (options.length > 0) {
    const optionsText = options.map((opt, i) => 
      `${optionEmojis[i]}  ${opt.replace(/^[A-D][\.\)]\s*/i, '')}`
    ).join('\n\n');
    
    embed.addFields({
      name: '📝 Choose your answer:',
      value: optionsText,
      inline: false,
    });
  }
  
  return embed;
}

/**
 * Quiz Answer Result Embed
 */
export function createAnswerResultEmbed(isCorrect, explanation, correctAnswer, xpEarned = 0) {
  const color = isCorrect ? COLORS.SUCCESS : COLORS.ERROR;
  const title = isCorrect ? '✅ Correct!' : '❌ Incorrect';
  const message = isCorrect 
    ? '🎉 **Excellent work!** You nailed it!'
    : '💪 **Keep going!** Every mistake is a learning opportunity.';
  
  const embed = new EmbedBuilder()
    .setColor(color)
    .setTitle(title)
    .setDescription(
      `${message}\n\n` +
      (xpEarned > 0 ? `**+${xpEarned} XP** earned!\n\n` : '') +
      `> **${isCorrect ? '✓' : '→'} Correct Answer:** ${correctAnswer || 'N/A'}`
    )
    .setFooter({ text: `${ICONS.LOGO} MentorAI` })
    .setTimestamp();
  
  if (explanation) {
    embed.addFields({
      name: '📖 Explanation',
      value: explanation.length > 500 ? explanation.substring(0, 500) + '...' : explanation,
      inline: false,
    });
  }
  
  return embed;
}

/**
 * Quiz Final Results Embed
 */
export function createQuizResultsEmbed(result) {
  const score = result.score || 0;
  const total = result.totalQuestions || 1;
  const percentage = Math.round((score / total) * 100);
  const gradeInfo = getGrade(percentage);
  
  // Create visual score display
  const scoreBar = createProgressBar(score, total, 15, 'gradient');
  
  // Answer breakdown visual
  const answerBreakdown = result.answers 
    ? result.answers.map(a => a.isCorrect ? '✅' : '❌').join(' ')
    : `✅ x${score}  ❌ x${total - score}`;
  
  const embed = new EmbedBuilder()
    .setColor(gradeInfo.color)
    .setTitle(`${gradeInfo.emoji} Quiz Complete!`)
    .setDescription(
      `### ${gradeInfo.label}\n\n` +
      `**Score:** ${score} / ${total} (${percentage}%)\n\n` +
      `${scoreBar}\n\n` +
      `**Grade:** ${gradeInfo.emoji} ${gradeInfo.grade}`
    )
    .addFields(
      { name: '📝 Answer Breakdown', value: answerBreakdown, inline: false },
      { name: '✨ XP Earned', value: `**+${result.xpEarned || 0} XP**`, inline: true },
      { name: '📚 Topic', value: result.topic || 'General', inline: true },
    )
    .setFooter({ text: `${ICONS.LOGO} MentorAI • Keep learning!` })
    .setTimestamp();
  
  // Level up notification
  if (result.leveledUp) {
    embed.addFields({
      name: '🎊 LEVEL UP!',
      value: `Congratulations! You reached **Level ${result.newLevel}**! 🚀`,
      inline: false,
    });
  }
  
  // Achievements
  if (result.achievements && result.achievements.length > 0) {
    embed.addFields({
      name: '🏆 Achievements Unlocked',
      value: result.achievements.map(a => `🏅 ${a}`).join('\n'),
      inline: false,
    });
  }
  
  // Motivational message
  const motivations = {
    perfect: '🌟 *Flawless victory! You\'re absolutely incredible!*',
    excellent: '⭐ *Outstanding performance! You\'re on fire!*',
    great: '🔥 *Great work! Keep up the momentum!*',
    good: '📈 *Solid effort! You\'re improving every day!*',
    needsWork: '💪 *Don\'t give up! Practice makes perfect!*',
  };
  
  let motivation = motivations.needsWork;
  if (percentage === 100) motivation = motivations.perfect;
  else if (percentage >= 90) motivation = motivations.excellent;
  else if (percentage >= 75) motivation = motivations.great;
  else if (percentage >= 60) motivation = motivations.good;
  
  embed.addFields({ name: '\u200B', value: motivation, inline: false });
  
  return embed;
}

/**
 * Leaderboard Embed - Competition styling
 */
export function createLeaderboardEmbed(users, page = 1, totalPages = 1) {
  const medals = ['🥇', '🥈', '🥉'];
  const startRank = (page - 1) * 10;
  
  let leaderboardText = '';
  
  users.forEach((user, index) => {
    const rank = startRank + index + 1;
    const medal = medals[rank - 1] || `\`#${rank}\``;
    const tier = getTier(user.level || 1);
    
    leaderboardText += `${medal} ${tier.emoji} **${user.username || 'Unknown'}**\n`;
    leaderboardText += `${LAYOUT.SUBSECTION_END}Level **${user.level || 1}** • **${(user.xp || 0).toLocaleString()}** XP • 🔥 **${user.streak || 0}**\n\n`;
  });
  
  return new EmbedBuilder()
    .setColor(COLORS.LEADERBOARD)
    .setTitle('🏆 Global Leaderboard')
    .setDescription(leaderboardText || '*No learners yet! Be the first!*')
    .setFooter({ text: `${ICONS.LOGO} MentorAI • Page ${page}/${totalPages}` })
    .setTimestamp();
}

/**
 * Daily Bonus Embed
 */
export function createDailyBonusEmbed(result, tip = null) {
  const streak = result.streak || 1;
  const streakFires = '🔥'.repeat(Math.min(streak, 7));
  
  // Streak milestone messages
  const milestoneMessages = {
    3: '🎉 **3-Day Streak!** You\'re building momentum!',
    7: '⚡ **Week Warrior!** 7-day streak achieved!',
    14: '🏆 **Two Week Champion!** Unstoppable!',
    30: '👑 **Month Master!** Legendary dedication!',
  };
  
  let milestoneMsg = '';
  if (milestoneMessages[streak]) {
    milestoneMsg = `\n\n${milestoneMessages[streak]}`;
  }
  
  const embed = new EmbedBuilder()
    .setColor(COLORS.XP_GOLD)
    .setTitle('🎁 Daily Bonus Claimed!')
    .setDescription(
      `### ✨ Welcome back!\n\n` +
      `${streakFires} **${streak} day streak!**${milestoneMsg}`
    )
    .addFields(
      { name: '💰 Base XP', value: `**+${result.baseXp || 75}**`, inline: true },
      { name: '🔥 Streak Bonus', value: `**+${result.streakBonus || 0}**`, inline: true },
      { name: '✨ Total XP', value: `**+${result.xpEarned || 75}**`, inline: true },
    )
    .setFooter({ text: `${ICONS.LOGO} MentorAI • Come back tomorrow!` })
    .setTimestamp();
  
  if (result.leveledUp) {
    embed.addFields({
      name: '🆙 LEVEL UP!',
      value: `🎊 You reached **Level ${result.newLevel}**!`,
      inline: false,
    });
  }
  
  if (tip) {
    embed.addFields({
      name: `💡 Today's Tip: ${tip.category || 'Learning'}`,
      value: tip.tip || 'Keep learning consistently!',
      inline: false,
    });
  }
  
  return embed;
}

/**
 * Streak Display Embed
 */
export function createStreakEmbed(user, streak) {
  const fires = streak > 0 ? '🔥'.repeat(Math.min(streak, 7)) : '❄️';
  
  // Milestone calculation
  const milestones = [3, 7, 14, 30, 60, 100];
  const nextMilestone = milestones.find(m => m > streak) || null;
  
  // Streak tier
  let streakTier = 'Starting';
  let tierColor = COLORS.TIER_NOVICE;
  if (streak >= 30) { streakTier = 'Legendary'; tierColor = COLORS.TIER_LEGEND; }
  else if (streak >= 14) { streakTier = 'Champion'; tierColor = COLORS.XP_GOLD; }
  else if (streak >= 7) { streakTier = 'Warrior'; tierColor = COLORS.STREAK_FIRE; }
  else if (streak >= 3) { streakTier = 'Building'; tierColor = COLORS.INFO; }
  
  const embed = new EmbedBuilder()
    .setColor(tierColor)
    .setTitle(`${fires} Learning Streak`)
    .setDescription(
      `**${user.username}**'s streak status\n\n` +
      `### ${streak} day${streak !== 1 ? 's' : ''} • ${streakTier}`
    )
    .addFields(
      { name: '🔥 Current Streak', value: `**${streak}** days`, inline: true },
      { name: '📅 Last Active', value: user.lastActive ? `<t:${Math.floor(new Date(user.lastActive).getTime() / 1000)}:R>` : 'Today', inline: true },
    )
    .setFooter({ text: `${ICONS.LOGO} MentorAI • Don't break the chain!` })
    .setTimestamp();
  
  if (nextMilestone) {
    const daysToGo = nextMilestone - streak;
    embed.addFields({
      name: '🎯 Next Milestone',
      value: `**${nextMilestone} days** (${daysToGo} to go!)`,
      inline: false,
    });
  } else {
    embed.addFields({
      name: '👑 Status',
      value: 'All milestones reached! **LEGENDARY!**',
      inline: false,
    });
  }
  
  // XP Bonus info
  let bonus = '1x (Base)';
  if (streak >= 30) bonus = '**2x** 👑';
  else if (streak >= 14) bonus = '**1.75x** 🏆';
  else if (streak >= 7) bonus = '**1.5x** ⚡';
  else if (streak >= 3) bonus = '**1.25x** 🔥';
  
  embed.addFields({
    name: '✨ XP Multiplier',
    value: bonus,
    inline: true,
  });
  
  return embed;
}

/**
 * Achievement Unlock Embed
 */
export function createAchievementEmbed(achievement, user) {
  const rarityColors = {
    common: COLORS.TIER_NOVICE,
    uncommon: COLORS.SUCCESS,
    rare: COLORS.INFO,
    epic: COLORS.ACHIEVEMENT,
    legendary: COLORS.TIER_LEGEND,
  };
  
  const color = rarityColors[achievement.rarity] || COLORS.ACHIEVEMENT;
  
  return new EmbedBuilder()
    .setColor(color)
    .setTitle('🎊 Achievement Unlocked!')
    .setDescription(
      `**${user.username}** earned a new achievement!\n\n` +
      `### ${achievement.emoji || '🏆'} ${achievement.name}\n` +
      `*${achievement.description}*`
    )
    .addFields(
      { name: '⭐ Rarity', value: (achievement.rarity || 'common').toUpperCase(), inline: true },
      { name: '✨ XP Reward', value: `+${achievement.xpBonus || 0}`, inline: true },
    )
    .setFooter({ text: `${ICONS.LOGO} MentorAI • Keep collecting!` })
    .setTimestamp();
}

/**
 * Lesson Embed - Educational content display
 */
export function createLessonEmbed(lesson, xpEarned = 0) {
  const embed = new EmbedBuilder()
    .setColor(COLORS.LESSON)
    .setTitle(`📚 ${lesson.title || 'Lesson'}`)
    .setDescription(lesson.introduction || lesson.description || '')
    .setFooter({ text: `${ICONS.LOGO} MentorAI${xpEarned > 0 ? ` • +${xpEarned} XP earned!` : ''}` })
    .setTimestamp();
  
  // Main content
  if (lesson.content) {
    const content = lesson.content.length > 1000 
      ? lesson.content.substring(0, 1000) + '...' 
      : lesson.content;
    embed.addFields({
      name: '📖 Content',
      value: content,
      inline: false,
    });
  }
  
  // Key points
  if (lesson.keyPoints && lesson.keyPoints.length > 0) {
    const points = lesson.keyPoints.map((p, i) => `${i + 1}. ${p}`).join('\n');
    embed.addFields({
      name: '🔑 Key Points',
      value: points,
      inline: false,
    });
  }
  
  return embed;
}

/**
 * Code Example Embed - For displaying code
 */
export function createCodeEmbed(title, code, language = 'javascript', explanation = '') {
  const embed = new EmbedBuilder()
    .setColor(COLORS.INFO)
    .setTitle(`💻 ${title}`)
    .setDescription(`\`\`\`${language}\n${code.substring(0, 1800)}\n\`\`\``)
    .setFooter({ text: `${ICONS.LOGO} MentorAI • Code Example` })
    .setTimestamp();
  
  if (explanation) {
    embed.addFields({
      name: '📝 Explanation',
      value: explanation,
      inline: false,
    });
  }
  
  return embed;
}

/**
 * Challenge/Battle Embed
 */
export function createChallengeEmbed(challenger, opponent, topic, difficulty = 'medium') {
  return new EmbedBuilder()
    .setColor(COLORS.CHALLENGE)
    .setTitle('⚔️ QUIZ BATTLE CHALLENGE!')
    .setDescription(
      `### ${challenger.username} VS ${opponent.username}\n\n` +
      `*Who will prove their knowledge?*`
    )
    .addFields(
      { name: '🎯 Challenger', value: `**${challenger.username}**`, inline: true },
      { name: '⚔️ VS', value: '**🆚**', inline: true },
      { name: '🛡️ Opponent', value: `**${opponent.username}**`, inline: true },
      { name: LAYOUT.DIVIDER_THIN, value: '\u200B', inline: false },
      { name: '📚 Topic', value: topic, inline: true },
      { name: '📊 Difficulty', value: difficulty.charAt(0).toUpperCase() + difficulty.slice(1), inline: true },
      { name: '❓ Questions', value: '5', inline: true },
      { name: '🏆 Prize', value: '**+150 XP** for winner!', inline: false },
    )
    .setFooter({ text: `${ICONS.LOGO} MentorAI • ⏰ Expires in 60 seconds` })
    .setTimestamp();
}

/**
 * Study Party Embed
 */
export function createStudyPartyEmbed(party, host) {
  return new EmbedBuilder()
    .setColor(COLORS.PARTY)
    .setTitle('🎉 Study Party!')
    .setDescription(
      `**${host.username}** is hosting a study session!\n\n` +
      `Join to learn together and earn **+50% bonus XP**!`
    )
    .addFields(
      { name: '📖 Topic', value: party.topic, inline: true },
      { name: '⏱️ Duration', value: `${party.duration} min`, inline: true },
      { name: '👥 Members', value: `${party.members?.length || 1}`, inline: true },
      { name: '🎫 Party ID', value: `\`${party.id}\``, inline: true },
      { name: '⏰ Ends', value: `<t:${Math.floor(party.endTime / 1000)}:R>`, inline: true },
    )
    .setFooter({ text: `${ICONS.LOGO} MentorAI • Use /studyparty join to join!` })
    .setTimestamp();
}

/**
 * Stats/Analytics Embed
 */
export function createStatsEmbed(stats, client) {
  return new EmbedBuilder()
    .setColor(COLORS.BRAND_PRIMARY)
    .setTitle('📊 MentorAI Global Stats')
    .setDescription('*Real-time platform statistics*')
    .addFields(
      { name: '👥 Total Learners', value: `**${stats.userCount?.toLocaleString() || '0'}**`, inline: true },
      { name: '📝 Quizzes Taken', value: `**${stats.quizCount?.toLocaleString() || '0'}**`, inline: true },
      { name: '📚 Lessons Generated', value: `**${stats.lessonCount?.toLocaleString() || '0'}**`, inline: true },
      { name: '✨ Total XP Earned', value: `**${stats.totalXP?.toLocaleString() || '0'}**`, inline: true },
      { name: '🌐 Active Servers', value: `**${client?.guilds.cache.size || '0'}**`, inline: true },
      { name: '⏱️ Uptime', value: formatUptime(client?.uptime), inline: true },
    )
    .setFooter({ text: `${ICONS.LOGO} MentorAI • Learning Platform` })
    .setTimestamp();
}

/**
 * Format uptime for display
 */
function formatUptime(ms) {
  if (!ms) return 'N/A';
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) return `${days}d ${hours % 24}h`;
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
  return `${seconds}s`;
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🎯 LOADING & ANIMATION HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Create a loading embed
 */
export function createLoadingEmbed(title = 'Loading...', description = 'Please wait...', color = COLORS.INFO) {
  return new EmbedBuilder()
    .setColor(color)
    .setTitle(`⏳ ${title}`)
    .setDescription(description)
    .setFooter({ text: `${ICONS.LOGO} MentorAI` });
}

// ═══════════════════════════════════════════════════════════════════════════════
// 📤 EXPORT ALL
// ═══════════════════════════════════════════════════════════════════════════════

export default {
  COLORS,
  ICONS,
  LAYOUT,
  PROGRESS_STYLES,
  TIERS,
  GRADES,
  ANSI,
  createProgressBar,
  createPercentageDisplay,
  getTier,
  getGrade,
  ansiBlock,
  ansiHeader,
  createPremiumEmbed,
  createSuccessEmbed,
  createErrorEmbed,
  createWarningEmbed,
  createInfoEmbed,
  createButtonRow,
  createQuizAnswerButtons,
  createQuizControlButtons,
  createNavigationButtons,
  createPostQuizButtons,
  createLessonButtons,
  createSelectMenu,
  createTopicSelectMenu,
  createDifficultySelectMenu,
  createProfileEmbed,
  createQuizQuestionEmbed,
  createAnswerResultEmbed,
  createQuizResultsEmbed,
  createLeaderboardEmbed,
  createDailyBonusEmbed,
  createStreakEmbed,
  createAchievementEmbed,
  createLessonEmbed,
  createCodeEmbed,
  createChallengeEmbed,
  createStudyPartyEmbed,
  createStatsEmbed,
  createLoadingEmbed,
};
