/**
 * MentorAI Progress Bar Generators
 * Beautiful progress visualizations for Discord embeds
 */

/**
 * Create a customizable progress bar
 * @param {number} current - Current value
 * @param {number} max - Maximum value
 * @param {number} length - Bar length (default 10)
 * @param {string} style - Bar style (default 'modern')
 * @returns {string} Progress bar string
 */
export function createProgressBar(current, max, length = 10, style = 'modern') {
  const percentage = Math.min(Math.max(current / max, 0), 1);
  const filled = Math.round(percentage * length);
  const empty = length - filled;
  
  const styles = {
    modern: {
      filled: '▰',
      empty: '▱',
      start: '',
      end: ''
    },
    classic: {
      filled: '█',
      empty: '░',
      start: '',
      end: ''
    },
    circle: {
      filled: '●',
      empty: '○',
      start: '',
      end: ''
    },
    fancy: {
      filled: '▓',
      empty: '░',
      start: '┃',
      end: '┃'
    },
    minimal: {
      filled: '━',
      empty: '─',
      start: '『',
      end: '』'
    },
    dots: {
      filled: '⬤',
      empty: '○',
      start: '',
      end: ''
    },
    blocks: {
      filled: '⣿',
      empty: '⣀',
      start: '⌜',
      end: '⌟'
    },
    neon: {
      filled: '■',
      empty: '□',
      start: '【',
      end: '】'
    },
    hearts: {
      filled: '❤️',
      empty: '🖤',
      start: '',
      end: ''
    },
    stars: {
      filled: '★',
      empty: '☆',
      start: '',
      end: ''
    },
    fire: {
      filled: '🔥',
      empty: '⬜',
      start: '',
      end: ''
    },
    gradient: {
      filled: '▓',
      partial: '▒',
      empty: '░',
      start: '',
      end: ''
    }
  };
  
  const s = styles[style] || styles.modern;
  
  return `${s.start}${s.filled.repeat(filled)}${s.empty.repeat(empty)}${s.end}`;
}

/**
 * Create a labeled progress bar with percentage
 * @param {string} label - Label text
 * @param {number} current - Current value
 * @param {number} max - Maximum value
 * @param {number} length - Bar length
 * @returns {string} Labeled progress bar
 */
export function createLabeledBar(label, current, max, length = 10) {
  const percentage = Math.round((current / max) * 100);
  const bar = createProgressBar(current, max, length, 'modern');
  return `${label}\n${bar} ${percentage}%`;
}

/**
 * Create an XP progress bar with level info
 * @param {number} currentXP - Current XP in level
 * @param {number} xpForNext - XP needed for next level
 * @param {number} level - Current level
 * @returns {string} XP progress bar with level markers
 */
export function createXPBar(currentXP, xpForNext, level) {
  const bar = createProgressBar(currentXP, xpForNext, 12, 'neon');
  const pct = Math.round((currentXP / xpForNext) * 100);
  return `**Level ${level}** ${bar} **Level ${level + 1}**\n\`${currentXP.toLocaleString()} / ${xpForNext.toLocaleString()} XP\` (${pct}%)`;
}

/**
 * Create multiple stat bars
 * @param {Array} stats - Array of {label, value, max, emoji?}
 * @returns {string} Multiple stat bars
 */
export function createStatBars(stats) {
  let output = '';
  for (const stat of stats) {
    const bar = createProgressBar(stat.value, stat.max, 8, 'modern');
    const pct = Math.round((stat.value / stat.max) * 100);
    output += `${stat.emoji || '📊'} **${stat.label}**\n${bar} \`${pct}%\`\n\n`;
  }
  return output.trim();
}

/**
 * Create a timer bar (for quizzes, countdowns)
 * @param {number} current - Current time remaining
 * @param {number} max - Maximum time
 * @returns {string} Timer bar with color indicator
 */
export function createTimerBar(current, max) {
  const percentage = current / max;
  let color = '🟩';
  if (percentage <= 0.3) color = '🟥';
  else if (percentage <= 0.6) color = '🟨';
  
  const filled = Math.ceil(percentage * 10);
  const empty = 10 - filled;
  
  return `${color.repeat(filled)}${'⬜'.repeat(empty)} **${current}s**`;
}

/**
 * Create a streak display with fire intensity
 * @param {number} streak - Current streak
 * @returns {string} Streak display
 */
export function createStreakDisplay(streak) {
  if (streak === 0) return '❄️ No streak';
  if (streak < 3) return `🔥 ${streak} day${streak !== 1 ? 's' : ''}`;
  if (streak < 7) return `🔥🔥 ${streak} days`;
  if (streak < 14) return `🔥🔥🔥 ${streak} days`;
  if (streak < 30) return `🔥🔥🔥🔥 ${streak} days`;
  return `🔥🔥🔥🔥🔥 ${streak} days (LEGENDARY!)`;
}

/**
 * Create a rank badge display
 * @param {number} level - User level
 * @returns {object} Rank info with emoji, name, and color
 */
export function getRankInfo(level) {
  if (level >= 50) return { emoji: '👑', name: 'Legendary Guru', tier: 'legendary' };
  if (level >= 30) return { emoji: '💎', name: 'Diamond Expert', tier: 'diamond' };
  if (level >= 20) return { emoji: '🥇', name: 'Gold Master', tier: 'gold' };
  if (level >= 10) return { emoji: '🥈', name: 'Silver Scholar', tier: 'silver' };
  if (level >= 5) return { emoji: '🥉', name: 'Bronze Learner', tier: 'bronze' };
  return { emoji: '🔰', name: 'Newcomer', tier: 'newcomer' };
}

/**
 * Create a star rating display
 * @param {number} rating - Rating (0-5)
 * @param {number} maxStars - Maximum stars (default 5)
 * @returns {string} Star rating display
 */
export function createStarRating(rating, maxStars = 5) {
  const fullStars = Math.floor(rating);
  const halfStar = rating % 1 >= 0.5 ? 1 : 0;
  const emptyStars = maxStars - fullStars - halfStar;
  
  return '⭐'.repeat(fullStars) + (halfStar ? '✨' : '') + '☆'.repeat(emptyStars);
}

/**
 * Create an accuracy indicator
 * @param {number} correct - Correct answers
 * @param {number} total - Total questions
 * @returns {string} Accuracy display with color
 */
export function createAccuracyDisplay(correct, total) {
  if (total === 0) return '📊 No data';
  
  const pct = Math.round((correct / total) * 100);
  let indicator;
  
  if (pct >= 90) indicator = '🟢';
  else if (pct >= 70) indicator = '🟡';
  else if (pct >= 50) indicator = '🟠';
  else indicator = '🔴';
  
  return `${indicator} ${pct}% (${correct}/${total})`;
}

/**
 * Create a mini chart using block characters
 * @param {Array} values - Array of numeric values
 * @param {number} height - Chart height (default 5)
 * @returns {string} ASCII mini chart
 */
export function createMiniChart(values, height = 5) {
  if (!values.length) return 'No data';
  
  const max = Math.max(...values);
  const blocks = ['▁', '▂', '▃', '▄', '▅', '▆', '▇', '█'];
  
  return values.map(v => {
    const normalized = Math.round((v / max) * (blocks.length - 1));
    return blocks[normalized];
  }).join('');
}

/**
 * Create a completion checkmark list
 * @param {Array} items - Array of {label, completed}
 * @returns {string} Checklist display
 */
export function createChecklist(items) {
  return items.map(item => 
    `${item.completed ? '✅' : '⬜'} ${item.label}`
  ).join('\n');
}

export default {
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
  createChecklist
};
