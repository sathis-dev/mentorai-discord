import { HELP_CATEGORIES, SUGGESTION_RULES, TIPS } from '../config/helpConfig.js';

// ═══════════════════════════════════════════════════════════════════
// SEARCH FUNCTIONS
// ═══════════════════════════════════════════════════════════════════

export function searchCommands(query) {
  const results = [];
  const lowerQuery = query.toLowerCase();

  for (const [categoryId, category] of Object.entries(HELP_CATEGORIES)) {
    for (const command of category.commands) {
      const score = calculateSearchScore(command, lowerQuery);
      if (score > 0) {
        results.push({
          ...command,
          category: categoryId,
          categoryName: category.name,
          categoryEmoji: category.emoji,
          categoryColor: category.color,
          score
        });
      }
    }
  }

  return results.sort((a, b) => b.score - a.score).slice(0, 10);
}

function calculateSearchScore(command, query) {
  let score = 0;

  // Exact name match
  if (command.name === query) score += 100;
  // Name starts with query
  else if (command.name.startsWith(query)) score += 50;
  // Name contains query
  else if (command.name.includes(query)) score += 30;

  // Description contains query
  if (command.description.toLowerCase().includes(query)) score += 20;

  // Subcommands contain query
  if (command.subcommands?.some(s => s.includes(query))) score += 15;

  // Examples contain query
  if (command.examples?.some(e => e.toLowerCase().includes(query))) score += 10;

  return score;
}

// ═══════════════════════════════════════════════════════════════════
// SMART SUGGESTION ENGINE
// ═══════════════════════════════════════════════════════════════════

export function getSmartSuggestion(user) {
  const suggestions = SUGGESTION_RULES
    .filter(rule => rule.condition(user))
    .sort((a, b) => b.suggestion.priority - a.suggestion.priority);

  return suggestions[0]?.suggestion || SUGGESTION_RULES[SUGGESTION_RULES.length - 1].suggestion;
}

export function getRandomTip() {
  return TIPS[Math.floor(Math.random() * TIPS.length)];
}

// ═══════════════════════════════════════════════════════════════════
// FORMATTING HELPERS
// ═══════════════════════════════════════════════════════════════════

export function formatCommandList(commands, showDetails = false) {
  return commands.map(cmd => {
    const badges = [];
    if (cmd.new) badges.push('🆕');
    if (cmd.popular) badges.push('🔥');
    if (cmd.premium) badges.push('💎');

    const badgeStr = badges.length > 0 ? ` ${badges.join('')}` : '';

    if (showDetails) {
      return `\`/${cmd.name}\`${badgeStr}\n└─ ${cmd.description}`;
    }
    return `\`/${cmd.name}\`${badgeStr} — ${cmd.description}`;
  }).join('\n');
}

export function createProgressBar(current, max, length = 10) {
  const percentage = Math.min(current / max, 1);
  const filled = Math.round(percentage * length);
  const empty = length - filled;
  const bar = '█'.repeat(filled) + '░'.repeat(empty);
  return `\`[${bar}]\` ${Math.round(percentage * 100)}%`;
}

export function formatXP(current, required) {
  const formatNum = (n) => {
    if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
    if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
    return n.toString();
  };
  return `${formatNum(current)} / ${formatNum(required)}`;
}

export function getRankEmoji(level) {
  if (level >= 100) return '👑';
  if (level >= 75) return '🏆';
  if (level >= 50) return '💎';
  if (level >= 35) return '🔥';
  if (level >= 25) return '⚡';
  if (level >= 15) return '📘';
  if (level >= 5) return '🌿';
  return '🌱';
}

export function getRankName(level) {
  if (level >= 100) return 'LEGEND';
  if (level >= 75) return 'GRANDMASTER';
  if (level >= 50) return 'MASTER';
  if (level >= 35) return 'EXPERT';
  if (level >= 25) return 'ADVANCED';
  if (level >= 15) return 'INTERMEDIATE';
  if (level >= 5) return 'APPRENTICE';
  return 'BEGINNER';
}

export function getStreakEmoji(streak) {
  if (streak >= 365) return '🌟';
  if (streak >= 100) return '💎';
  if (streak >= 30) return '🔥';
  if (streak >= 7) return '⚡';
  if (streak >= 1) return '✨';
  return '❄️';
}

export function getStreakMultiplier(streak) {
  if (streak >= 30) return 2.0;
  if (streak >= 14) return 1.5;
  if (streak >= 7) return 1.3;
  if (streak >= 3) return 1.1;
  return 1.0;
}

// ═══════════════════════════════════════════════════════════════════
// CATEGORY HELPERS
// ═══════════════════════════════════════════════════════════════════

export function getCategoryById(categoryId) {
  return HELP_CATEGORIES[categoryId] || null;
}

export function getCommandByName(commandName) {
  for (const category of Object.values(HELP_CATEGORIES)) {
    const command = category.commands.find(c => c.name === commandName);
    if (command) {
      return {
        ...command,
        category: category.id,
        categoryName: category.name,
        categoryEmoji: category.emoji,
        categoryColor: category.color
      };
    }
  }
  return null;
}

export function getAllCategories() {
  return Object.values(HELP_CATEGORIES)
    .sort((a, b) => a.order - b.order);
}

export function getCommandCount() {
  return Object.values(HELP_CATEGORIES)
    .reduce((acc, cat) => acc + cat.commands.length, 0);
}

export function getNewCommands() {
  const newCommands = [];
  for (const category of Object.values(HELP_CATEGORIES)) {
    for (const command of category.commands) {
      if (command.new) {
        newCommands.push({
          ...command,
          categoryEmoji: category.emoji,
          categoryName: category.name,
          categoryColor: category.color
        });
      }
    }
  }
  return newCommands;
}

export function getPopularCommands() {
  const popular = [];
  for (const category of Object.values(HELP_CATEGORIES)) {
    for (const command of category.commands) {
      if (command.popular) {
        popular.push({
          ...command,
          categoryEmoji: category.emoji,
          categoryName: category.name,
          categoryColor: category.color
        });
      }
    }
  }
  return popular;
}

// ═══════════════════════════════════════════════════════════════════
// XP CALCULATION
// ═══════════════════════════════════════════════════════════════════

export function calculateXPRequired(level) {
  return Math.floor(100 * Math.pow(1.5, level - 1));
}

export function calculateAccuracy(correct, total) {
  if (!total || total === 0) return 0;
  return Math.round((correct / total) * 100);
}
