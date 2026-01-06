/**
 * MentorAI Visual Elements
 * Unicode characters and emojis for beautiful UI
 */

export const Visual = {
  // Progress Bars
  BAR: {
    FULL: '█',
    THREE_QUARTER: '▓',
    HALF: '▒',
    QUARTER: '░',
    EMPTY: '░'
  },
  
  // Modern Progress (cleaner look)
  PROGRESS: {
    FILLED: '▰',
    EMPTY: '▱'
  },
  
  // Circular Progress
  CIRCLE: {
    FULL: '●',
    EMPTY: '○'
  },
  
  // Fancy Bars
  FANCY: {
    START_FULL: '┣',
    MIDDLE_FULL: '█',
    END_FULL: '┫',
    START_EMPTY: '┣',
    MIDDLE_EMPTY: '━',
    END_EMPTY: '┫'
  },
  
  // Separators
  SEPARATOR: {
    LINE: '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
    THIN: '──────────────────────────────',
    DOTS: '• • • • • • • • • • • • • • •',
    FANCY: '═══════════════════════════════',
    WAVE: '〰️〰️〰️〰️〰️〰️〰️〰️〰️〰️〰️〰️〰️〰️〰️',
    GRADIENT: '░▒▓█▓▒░░▒▓█▓▒░░▒▓█▓▒░',
    STARS: '✦ ✧ ✦ ✧ ✦ ✧ ✦ ✧ ✦ ✧ ✦ ✧ ✦'
  },
  
  // Corners & Boxes
  BOX: {
    TOP_LEFT: '╭',
    TOP_RIGHT: '╮',
    BOTTOM_LEFT: '╰',
    BOTTOM_RIGHT: '╯',
    HORIZONTAL: '─',
    VERTICAL: '│',
    CROSS: '┼',
    T_DOWN: '┬',
    T_UP: '┴',
    T_RIGHT: '├',
    T_LEFT: '┤'
  },
  
  // Double Box
  DOUBLE_BOX: {
    TOP_LEFT: '╔',
    TOP_RIGHT: '╗',
    BOTTOM_LEFT: '╚',
    BOTTOM_RIGHT: '╝',
    HORIZONTAL: '═',
    VERTICAL: '║'
  },
  
  // Rank Icons
  RANK: {
    BRONZE: '🥉',
    SILVER: '🥈',
    GOLD: '🥇',
    DIAMOND: '💎',
    LEGENDARY: '👑',
    UNRANKED: '🔰'
  },
  
  // Status Indicators
  STATUS: {
    ONLINE: '🟢',
    IDLE: '🟡',
    DND: '🔴',
    OFFLINE: '⚫',
    STREAMING: '🟣'
  },
  
  // Decorative Emojis
  SPARKLE: '✨',
  FIRE: '🔥',
  STAR: '⭐',
  STAR_FILLED: '★',
  STAR_EMPTY: '☆',
  TROPHY: '🏆',
  LIGHTNING: '⚡',
  ROCKET: '🚀',
  CHECK: '✅',
  CROSS: '❌',
  ARROW_RIGHT: '➜',
  ARROW_DOWN: '▼',
  ARROW_UP: '▲',
  DIAMOND_SHAPE: '◆',
  CIRCLE_FILLED: '●',
  CIRCLE_EMPTY: '○',
  HEART: '❤️',
  CROWN: '👑',
  MEDAL: '🎖️',
  TARGET: '🎯',
  BOOK: '📚',
  BRAIN: '🧠',
  LIGHT_BULB: '💡',
  CODE: '💻',
  GEAR: '⚙️',
  LOCK: '🔒',
  UNLOCK: '🔓',
  KEY: '🔑',
  GIFT: '🎁',
  PARTY: '🎉',
  CONFETTI: '🎊',
  CLOCK: '⏰',
  HOURGLASS: '⏳',
  CALENDAR: '📅',
  CHART: '📊',
  GRAPH: '📈',
  PIN: '📌',
  BOOKMARK: '🔖',
  LINK: '🔗',
  SHIELD: '🛡️',
  SWORD: '⚔️',
  
  // Numbers (stylized)
  NUMBERS: ['0️⃣', '1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'],
  
  // Letters for quiz options
  LETTERS: {
    A: '🅰️',
    B: '🅱️',
    C: '🅲️',
    D: '🅳️'
  },
  
  // Medals for leaderboard
  MEDALS: ['🥇', '🥈', '🥉', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'],
  
  // Topic Emojis
  TOPICS: {
    python: '🐍',
    javascript: '⚡',
    typescript: '💠',
    react: '⚛️',
    nodejs: '💚',
    html: '🌐',
    css: '🎨',
    sql: '🗃️',
    git: '📚',
    rust: '🦀',
    go: '🐹',
    java: '☕',
    cpp: '⚙️',
    csharp: '🟪',
    ruby: '💎',
    php: '🐘',
    swift: '🍎',
    kotlin: '🟠',
    default: '📖'
  },
  
  // Difficulty Emojis
  DIFFICULTY: {
    easy: '🟢',
    medium: '🟡',
    hard: '🔴',
    expert: '🟣'
  },
  
  // Grade Emojis
  GRADES: {
    S: '🏆',
    A: '🥇',
    B: '🥈',
    C: '🥉',
    D: '📊',
    F: '📉'
  }
};

// Helper functions
export function getTopicEmoji(topic) {
  return Visual.TOPICS[topic?.toLowerCase()] || Visual.TOPICS.default;
}

export function getDifficultyEmoji(difficulty) {
  return Visual.DIFFICULTY[difficulty?.toLowerCase()] || '⚪';
}

export function getMedalEmoji(position) {
  if (position >= 1 && position <= 10) {
    return Visual.MEDALS[position - 1];
  }
  return `\`${position}\``;
}

export function getGradeEmoji(grade) {
  return Visual.GRADES[grade?.toUpperCase()] || '❓';
}

export function getRankEmoji(level) {
  if (level >= 50) return Visual.RANK.LEGENDARY;
  if (level >= 30) return Visual.RANK.DIAMOND;
  if (level >= 20) return Visual.RANK.GOLD;
  if (level >= 10) return Visual.RANK.SILVER;
  if (level >= 5) return Visual.RANK.BRONZE;
  return Visual.RANK.UNRANKED;
}

export default Visual;
