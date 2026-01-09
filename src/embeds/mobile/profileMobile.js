// src/embeds/mobile/profileMobile.js
import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { MOBILE, mobileProgressBar, mobileNumber, mobileXPBar } from '../../utils/mobileUI.js';

// Rank definitions
const RANKS = [
  { min: 0, name: 'Beginner', emoji: '🌱', color: 0x95A5A6 },
  { min: 5, name: 'Learner', emoji: '📚', color: 0x3498DB },
  { min: 10, name: 'Scholar', emoji: '🎓', color: 0x2ECC71 },
  { min: 20, name: 'Expert', emoji: '💎', color: 0x9B59B6 },
  { min: 30, name: 'Master', emoji: '👑', color: 0xF39C12 }
];

function getRank(level) {
  return [...RANKS].reverse().find(r => level >= r.min) || RANKS[0];
}

function getAchievementEmoji(achievementId) {
  const emojis = {
    first_lesson: '📖',
    first_quiz: '🎯',
    streak_7: '🔥',
    streak_3: '⚡',
    level_10: '⭐',
    level_5: '🌟',
    perfect_quiz: '💯',
    lessons_10: '📚',
    quizzes_100: '🧠',
    arena_win: '🏟️'
  };
  return emojis[achievementId] || '🏆';
}

function getDaysActive(user) {
  if (!user?.createdAt) return 1;
  const created = new Date(user.createdAt);
  const now = new Date();
  return Math.max(1, Math.floor((now - created) / (1000 * 60 * 60 * 24)));
}

function xpForLevel(level) {
  return Math.floor(100 * Math.pow(1.5, level - 1));
}

export function createMobileProfileEmbed(user, member) {
  const level = user?.level || 1;
  const rank = getRank(level);
  
  // XP for next level
  const xpForNext = xpForLevel(level);
  const currentLevelXP = (user?.xp || 0) % xpForNext;
  
  // Calculate accuracy
  const accuracy = user?.totalQuestions > 0 
    ? Math.round((user.correctAnswers / user.totalQuestions) * 100)
    : 0;

  // Get display name with fallbacks
  const displayName = member?.displayName || member?.user?.username || user?.username || 'User';
  const avatarURL = member?.user?.displayAvatarURL?.({ dynamic: true }) || member?.displayAvatarURL?.({ dynamic: true }) || undefined;

  const embed = new EmbedBuilder()
    .setColor(rank.color || MOBILE.colors.PRIMARY)
    .setAuthor({
      name: `${displayName}'s Profile`,
      iconURL: avatarURL
    })
    .setThumbnail(avatarURL)
    .setDescription(`
${rank.emoji} **${rank.name}**

${MOBILE.separators.thin}

${mobileXPBar(currentLevelXP, xpForNext, level)}

${MOBILE.separators.thin}

✨ **XP:** ${mobileNumber(user?.xp || 0)}
📊 **Level:** ${level}
🔥 **Streak:** ${user?.streak || 0}d
⚡ **Multi:** ${user?.streakMultiplier || 1}x

${MOBILE.separators.thin}

📖 **Lessons:** ${user?.lessonsCompleted?.length || 0}
🎯 **Quizzes:** ${user?.quizzesTaken || 0}
✅ **Accuracy:** ${accuracy}%
    `)
    .addFields({
      name: '🏆 Badges',
      value: user?.achievements?.length > 0 
        ? user.achievements.slice(0, 6).map(a => getAchievementEmoji(a)).join(' ')
        : '*None yet*',
      inline: false
    })
    .setFooter({
      text: `📅 ${getDaysActive(user)} days learning`
    });

  const row1 = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('profile_achievements')
        .setLabel('🏆 Badges')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('profile_stats')
        .setLabel('📊 Stats')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('profile_tree')
        .setLabel('🌳 Skills')
        .setStyle(ButtonStyle.Secondary)
    );

  const row2 = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('profile_history')
        .setLabel('📜 History')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('profile_share')
        .setLabel('📤 Share')
        .setStyle(ButtonStyle.Success)
    );

  return { embeds: [embed], components: [row1, row2] };
}

// Mobile Detailed Stats View
export function createMobileStatsEmbed(user) {
  const accuracy = user?.totalQuestions > 0 
    ? Math.round((user.correctAnswers / user.totalQuestions) * 100)
    : 0;

  const embed = new EmbedBuilder()
    .setColor(MOBILE.colors.INFO)
    .setTitle('📊 Full Statistics')
    .setDescription(`
${MOBILE.separators.thin}

**📚 Learning**
• Lessons: ${user?.lessonsCompleted?.length || 0}
• Topics: ${user?.topicsStudied?.length || 0}
• Hours: ~${Math.round((user?.lessonsCompleted?.length || 0) * 5 / 60)}

${MOBILE.separators.thin}

**🎯 Quizzes**
• Taken: ${user?.quizzesTaken || 0}
• Correct: ${user?.correctAnswers || 0}
• Accuracy: ${accuracy}%

${MOBILE.separators.thin}

**🔥 Streaks**
• Current: ${user?.streak || 0}d
• Best: ${user?.bestStreak || 0}d
• Multi: ${user?.streakMultiplier || 1}x

${MOBILE.separators.thin}

**🏆 Competition**
• Arena Wins: ${user?.arenaWins || 0}
• Challenges: ${user?.challengeWins || 0}
• Rank: #${user?.globalRank || '???'}
    `)
    .setFooter({ text: '◀️ Back to profile' });

  const row = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('profile_back')
        .setLabel('◀️ Back')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('view_leaderboard')
        .setLabel('👑 Ranks')
        .setStyle(ButtonStyle.Primary)
    );

  return { embeds: [embed], components: [row] };
}

// Profile skill tree view (mobile)
export function createMobileSkillTreeEmbed(user) {
  const skills = user?.skills || {};
  
  const embed = new EmbedBuilder()
    .setColor(MOBILE.colors.SUCCESS)
    .setTitle('🌳 Skill Tree')
    .setDescription(`
${MOBILE.separators.thin}

**Your Skills:**

🐍 Python ${mobileProgressBar(skills.python || 0, 100, 6)}
⚡ JavaScript ${mobileProgressBar(skills.javascript || 0, 100, 6)}
💙 TypeScript ${mobileProgressBar(skills.typescript || 0, 100, 6)}
⚛️ React ${mobileProgressBar(skills.react || 0, 100, 6)}
💚 Node.js ${mobileProgressBar(skills.nodejs || 0, 100, 6)}

${MOBILE.separators.thin}

💡 Complete quizzes to grow!
    `)
    .setFooter({ text: '◀️ Back to profile' });

  const row = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('profile_back')
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
  createMobileProfileEmbed,
  createMobileStatsEmbed,
  createMobileSkillTreeEmbed
};
