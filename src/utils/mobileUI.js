// src/utils/mobileUI.js - COMPLETE MOBILE UI SYSTEM
import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } from 'discord.js';

// ═══════════════════════════════════════════════════════════════
// MOBILE DESIGN CONSTANTS
// ═══════════════════════════════════════════════════════════════

export const MOBILE = {
  // Max characters per line for clean mobile display
  MAX_LINE_WIDTH: 28,
  
  // Progress bar lengths
  PROGRESS_BAR: {
    STANDARD: 8,
    COMPACT: 6,
    MINI: 4
  },
  
  // Colors (same as desktop for consistency)
  colors: {
    PRIMARY: 0x5865F2,
    SUCCESS: 0x57F287,
    ERROR: 0xED4245,
    WARNING: 0xFEE75C,
    INFO: 0x5865F2,
    XP: 0xFFD700,
    STREAK: 0xFF4500,
    BRONZE: 0xCD7F32,
    SILVER: 0xC0C0C0,
    GOLD: 0xFFD700,
    DIAMOND: 0xB9F2FF,
    LEGENDARY: 0x9B59B6,
    ACHIEVEMENT: 0x9B59B6
  },
  
  // Mobile-friendly separators (shorter)
  separators: {
    thin: '───────────────',
    thick: '═══════════════',
    dots: '• • • • • • • •',
    sparkle: '✦ ─────── ✦',
    wave: '〰️〰️〰️〰️〰️〰️〰️',
    stars: '⭐─────────⭐'
  },
  
  // Mobile-friendly box elements
  box: {
    top: '╭─────────────╮',
    bottom: '╰─────────────╯',
    side: '│',
    topWide: '╭───────────────────╮',
    bottomWide: '╰───────────────────╯'
  },
  
  // Compact emojis for mobile
  emojis: {
    xp: '✨',
    level: '📊',
    streak: '🔥',
    correct: '✅',
    wrong: '❌',
    trophy: '🏆',
    star: '⭐',
    lock: '🔒',
    unlock: '🔓',
    arrow: '→',
    bullet: '•',
    check: '✓',
    cross: '✗'
  }
};

// ═══════════════════════════════════════════════════════════════
// MOBILE PROGRESS BARS
// ═══════════════════════════════════════════════════════════════

export function mobileProgressBar(current, max, length = 8, style = 'default') {
  const percentage = Math.min(current / max, 1);
  const filled = Math.round(percentage * length);
  const empty = length - filled;
  
  const styles = {
    default: { filled: '█', empty: '░' },
    modern: { filled: '▰', empty: '▱' },
    circle: { filled: '●', empty: '○' },
    square: { filled: '■', empty: '□' },
    star: { filled: '★', empty: '☆' },
    heart: { filled: '❤️', empty: '🤍' },
    block: { filled: '⬛', empty: '⬜' }
  };
  
  const s = styles[style] || styles.default;
  return `${s.filled.repeat(filled)}${s.empty.repeat(empty)}`;
}

export function mobileXPBar(currentXP, maxXP, level) {
  const bar = mobileProgressBar(currentXP, maxXP, 8, 'modern');
  const pct = Math.round((currentXP / maxXP) * 100);
  return `Lv.${level} ${bar} ${pct}%`;
}

export function mobileStatBar(label, value, max, emoji = '📊') {
  const bar = mobileProgressBar(value, max, 6, 'modern');
  const pct = Math.round((value / max) * 100);
  return `${emoji} ${label}\n${bar} \`${pct}%\``;
}

// ═══════════════════════════════════════════════════════════════
// MOBILE NUMBER FORMATTING
// ═══════════════════════════════════════════════════════════════

export function mobileNumber(num) {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
}

export function mobileTime(seconds) {
  if (seconds >= 3600) return `${Math.floor(seconds / 3600)}h`;
  if (seconds >= 60) return `${Math.floor(seconds / 60)}m`;
  return `${seconds}s`;
}

// ═══════════════════════════════════════════════════════════════
// MOBILE TEXT FORMATTING
// ═══════════════════════════════════════════════════════════════

export function mobileTruncate(text, maxLength = 25) {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}

export function mobileWrap(text, maxWidth = 28) {
  const words = text.split(' ');
  const lines = [];
  let currentLine = '';
  
  for (const word of words) {
    if ((currentLine + ' ' + word).trim().length <= maxWidth) {
      currentLine = (currentLine + ' ' + word).trim();
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    }
  }
  if (currentLine) lines.push(currentLine);
  
  return lines.join('\n');
}

// ═══════════════════════════════════════════════════════════════
// MOBILE STAT BLOCKS
// ═══════════════════════════════════════════════════════════════

export function mobileStatBlock(stats) {
  // stats = [{ emoji, label, value }, ...]
  return stats.map(s => `${s.emoji} ${s.label}: **${s.value}**`).join('\n');
}

export function mobileCompactStats(stats) {
  // Two stats per line for ultra-compact
  const lines = [];
  for (let i = 0; i < stats.length; i += 2) {
    const left = `${stats[i].emoji}${stats[i].value}`;
    const right = stats[i + 1] ? `${stats[i + 1].emoji}${stats[i + 1].value}` : '';
    lines.push(`${left}  ${right}`.trim());
  }
  return lines.join('\n');
}

// ═══════════════════════════════════════════════════════════════
// MULTIPLIER HELPERS
// ═══════════════════════════════════════════════════════════════

export function getMultiplier(streak) {
  if (streak >= 30) return 2.0;
  if (streak >= 14) return 1.75;
  if (streak >= 7) return 1.5;
  if (streak >= 3) return 1.25;
  return 1.0;
}

export function getStreakMessage(streak) {
  if (streak >= 30) return '🏆 **LEGENDARY!** Max bonus!';
  if (streak >= 14) return '💎 **Amazing!** 2 weeks strong!';
  if (streak >= 7) return '🔥 **On fire!** 1 week!';
  if (streak >= 3) return '⚡ **Nice!** Bonus active!';
  return '💪 Keep going!';
}

export function getStreakTip(streak) {
  if (streak === 0) return '💡 Start your streak today!';
  if (streak < 3) return '💡 3 more days for 1.25x!';
  if (streak < 7) return '💡 Reach 7 days for 1.5x!';
  if (streak < 14) return '💡 2 weeks = 1.75x bonus!';
  if (streak < 30) return '💡 30 days = MAX 2x bonus!';
  return '👑 MAX STREAK! You\'re a legend!';
}

export default {
  MOBILE,
  mobileProgressBar,
  mobileXPBar,
  mobileStatBar,
  mobileNumber,
  mobileTime,
  mobileTruncate,
  mobileWrap,
  mobileStatBlock,
  mobileCompactStats,
  getMultiplier,
  getStreakMessage,
  getStreakTip
};
