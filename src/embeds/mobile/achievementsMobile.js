// src/embeds/mobile/achievementsMobile.js
import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } from 'discord.js';
import { MOBILE, mobileProgressBar } from '../../utils/mobileUI.js';

// All achievements definition
export const ACHIEVEMENTS = {
  // Learning
  first_lesson: { emoji: '📖', name: 'First Steps', desc: 'Complete first lesson', xp: 25, category: 'learning' },
  lessons_10: { emoji: '📚', name: 'Bookworm', desc: 'Complete 10 lessons', xp: 100, category: 'learning' },
  lessons_50: { emoji: '🎓', name: 'Scholar', desc: 'Complete 50 lessons', xp: 500, category: 'learning' },
  topics_5: { emoji: '🌐', name: 'Explorer', desc: 'Study 5 topics', xp: 150, category: 'learning' },
  
  // Quizzes
  first_quiz: { emoji: '🎯', name: 'Quiz Taker', desc: 'Complete first quiz', xp: 25, category: 'quiz' },
  perfect_quiz: { emoji: '💯', name: 'Perfect!', desc: 'Get 100% on quiz', xp: 100, category: 'quiz' },
  perfect_10: { emoji: '🌟', name: 'Perfectionist', desc: '10 perfect quizzes', xp: 300, category: 'quiz' },
  quizzes_100: { emoji: '🧠', name: 'Quiz Master', desc: '100 quizzes done', xp: 500, category: 'quiz' },
  
  // Streaks
  streak_3: { emoji: '🔥', name: 'Warming Up', desc: '3 day streak', xp: 50, category: 'streak' },
  streak_7: { emoji: '⚡', name: 'On Fire', desc: '7 day streak', xp: 150, category: 'streak' },
  streak_30: { emoji: '💎', name: 'Unstoppable', desc: '30 day streak', xp: 500, category: 'streak' },
  
  // Levels
  level_5: { emoji: '⭐', name: 'Rising Star', desc: 'Reach level 5', xp: 100, category: 'level' },
  level_10: { emoji: '🌟', name: 'Achiever', desc: 'Reach level 10', xp: 250, category: 'level' },
  level_25: { emoji: '👑', name: 'Champion', desc: 'Reach level 25', xp: 1000, category: 'level' },
  
  // Social
  first_challenge: { emoji: '⚔️', name: 'Challenger', desc: 'Win first challenge', xp: 50, category: 'social' },
  arena_win: { emoji: '🏟️', name: 'Arena Victor', desc: 'Win arena battle', xp: 100, category: 'social' },
  help_others: { emoji: '🤝', name: 'Mentor', desc: 'Help 10 users', xp: 200, category: 'social' },
  
  // Special
  night_owl: { emoji: '🦉', name: 'Night Owl', desc: 'Learn at 3 AM', xp: 50, category: 'special' },
  early_bird: { emoji: '🐦', name: 'Early Bird', desc: 'Learn at 6 AM', xp: 50, category: 'special' },
  speedrun: { emoji: '⚡', name: 'Speed Demon', desc: 'Perfect quiz <60s', xp: 150, category: 'special' }
};

export function createMobileAchievementsEmbed(user) {
  const unlocked = user?.achievements || [];
  const total = Object.keys(ACHIEVEMENTS).length;
  const percentage = Math.round((unlocked.length / total) * 100);

  // Group by category
  const categories = ['learning', 'quiz', 'streak', 'level', 'social', 'special'];
  
  let achievementDisplay = '';
  for (const cat of categories.slice(0, 3)) { // Show 3 categories
    const catAchievements = Object.entries(ACHIEVEMENTS)
      .filter(([_, a]) => a.category === cat)
      .slice(0, 4); // Max 4 per category
    
    const catEmojis = catAchievements.map(([id, a]) => 
      unlocked.includes(id) ? a.emoji : '🔒'
    ).join(' ');
    
    achievementDisplay += `${catEmojis}\n`;
  }

  const embed = new EmbedBuilder()
    .setColor(MOBILE.colors.ACHIEVEMENT)
    .setAuthor({
      name: '🏆 Achievements'
    })
    .setDescription(`
${MOBILE.separators.thin}

🏆 **${unlocked.length}/${total}** unlocked

${mobileProgressBar(unlocked.length, total, 10)}
${percentage}% complete

${MOBILE.separators.thin}

${achievementDisplay}

${MOBILE.separators.thin}

💡 *Select category below*
    `)
    .setFooter({ text: '👇 Filter by category' });

  // Category select menu
  const selectMenu = new ActionRowBuilder()
    .addComponents(
      new StringSelectMenuBuilder()
        .setCustomId('achievement_category')
        .setPlaceholder('📂 Category...')
        .addOptions([
          { label: 'Learning', value: 'learning', emoji: '📚' },
          { label: 'Quizzes', value: 'quiz', emoji: '🎯' },
          { label: 'Streaks', value: 'streak', emoji: '🔥' },
          { label: 'Levels', value: 'level', emoji: '⭐' },
          { label: 'Social', value: 'social', emoji: '👥' },
          { label: 'Special', value: 'special', emoji: '✨' }
        ])
    );

  const buttons = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('achievements_locked')
        .setLabel('🔒 Locked')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('achievements_hint')
        .setLabel('💡 Hints')
        .setStyle(ButtonStyle.Primary)
    );

  return { embeds: [embed], components: [selectMenu, buttons] };
}

// Category detail view (mobile)
export function createMobileAchievementCategoryEmbed(category, user) {
  const unlocked = user?.achievements || [];
  
  const categoryNames = {
    learning: '📚 Learning',
    quiz: '🎯 Quiz',
    streak: '🔥 Streak',
    level: '⭐ Level',
    social: '👥 Social',
    special: '✨ Special'
  };

  const catAchievements = Object.entries(ACHIEVEMENTS)
    .filter(([_, a]) => a.category === category);

  const achievementList = catAchievements.map(([id, a]) => {
    const isUnlocked = unlocked.includes(id);
    return `${isUnlocked ? a.emoji : '🔒'} **${a.name}**\n└ ${a.desc}${isUnlocked ? ' ✅' : ''}`;
  }).join('\n\n');

  const unlockedCount = catAchievements.filter(([id]) => unlocked.includes(id)).length;

  const embed = new EmbedBuilder()
    .setColor(MOBILE.colors.ACHIEVEMENT)
    .setTitle(categoryNames[category] || category)
    .setDescription(`
${MOBILE.separators.thin}

${unlockedCount}/${catAchievements.length} unlocked

${MOBILE.separators.thin}

${achievementList}
    `)
    .setFooter({ text: '◀️ Back to all' });

  const row = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('achievements_back')
        .setLabel('◀️ Back')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('view_profile')
        .setLabel('👤 Profile')
        .setStyle(ButtonStyle.Primary)
    );

  return { embeds: [embed], components: [row] };
}

// Achievement unlock notification (mobile)
export function createMobileAchievementUnlockEmbed(achievementId) {
  const achievement = ACHIEVEMENTS[achievementId];
  if (!achievement) return null;

  const embed = new EmbedBuilder()
    .setColor(MOBILE.colors.XP)
    .setDescription(`
╭─────────────────╮
│                 │
│  🏆 UNLOCKED!   │
│                 │
│  ${achievement.emoji} ${achievement.name.padEnd(12)} │
│                 │
│  ✨ +${achievement.xp} XP      │
│                 │
╰─────────────────╯

*${achievement.desc}*
    `);

  return { embeds: [embed] };
}

// Locked achievements hints (mobile)
export function createMobileAchievementHintsEmbed(user) {
  const unlocked = user?.achievements || [];
  
  // Find next achievements to unlock
  const locked = Object.entries(ACHIEVEMENTS)
    .filter(([id]) => !unlocked.includes(id))
    .slice(0, 5);

  const hints = locked.map(([id, a]) => 
    `🔒 **${a.name}** (+${a.xp} XP)\n└ ${a.desc}`
  ).join('\n\n');

  const embed = new EmbedBuilder()
    .setColor(MOBILE.colors.INFO)
    .setTitle('💡 Next Achievements')
    .setDescription(`
${MOBILE.separators.thin}

**Coming up:**

${hints}

${MOBILE.separators.thin}

💪 Keep learning to unlock!
    `)
    .setFooter({ text: '◀️ Back' });

  const row = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('achievements_back')
        .setLabel('◀️ Back')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('start_quiz')
        .setLabel('🎯 Quiz')
        .setStyle(ButtonStyle.Primary)
    );

  return { embeds: [embed], components: [row] };
}

export default {
  ACHIEVEMENTS,
  createMobileAchievementsEmbed,
  createMobileAchievementCategoryEmbed,
  createMobileAchievementUnlockEmbed,
  createMobileAchievementHintsEmbed
};
