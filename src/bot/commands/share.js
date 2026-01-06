import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { getOrCreateUser } from '../../services/gamificationService.js';
import { COLORS, createProgressBar, createSectionDivider } from '../../config/designSystem.js';
import { animateLoading } from '../../utils/animations.js';

export const data = new SlashCommandBuilder()
  .setName('share')
  .setDescription('🎫 Generate a stunning shareable card of your achievements!')
  .addStringOption(option =>
    option.setName('type')
      .setDescription('What do you want to share?')
      .setRequired(true)
      .addChoices(
        { name: '📊 Progress Card - Show your journey', value: 'progress' },
        { name: '🏆 Achievement Showcase - Flex your trophies', value: 'achievements' },
        { name: '🔥 Streak Flex - Show dedication', value: 'streak' },
        { name: '🎯 Quiz Stats - Prove your skills', value: 'quiz' }
      ));

export async function execute(interaction) {
  await interaction.deferReply();

  const type = interaction.options.getString('type');
  const user = await getOrCreateUser(interaction.user.id, interaction.user.username);

  // Animated loading
  await animateLoading(interaction, {
    title: '🎨 Creating Your Card',
    color: COLORS.PREMIUM_GOLD,
    duration: 2000,
    style: 'magic',
    stages: [
      { text: 'Gathering your stats...', status: '📊 Loading' },
      { text: 'Designing your card...', status: '🎨 Creating' },
      { text: 'Adding sparkles...', status: '✨ Polishing' }
    ]
  });

  // Create shareable embed based on type
  let embed;
  let shareText;

  switch (type) {
    case 'progress':
      embed = createProgressCard(interaction.user, user);
      shareText = `🎓 I'm Level ${user.level} on MentorAI with ${user.xp.toLocaleString()} XP! Learning is fun when it's gamified 🚀`;
      break;
    case 'achievements':
      embed = createAchievementCard(interaction.user, user);
      shareText = `🏆 I've unlocked ${user.achievements?.length || 0} achievements on MentorAI! How many do you have?`;
      break;
    case 'streak':
      embed = createStreakCard(interaction.user, user);
      shareText = `🔥 ${user.streak || 0} day learning streak on MentorAI! Consistency is key 💪`;
      break;
    case 'quiz':
      embed = createQuizCard(interaction.user, user);
      const accuracy = user.totalQuestions > 0 
        ? Math.round((user.correctAnswers / user.totalQuestions) * 100) 
        : 0;
      shareText = `🎯 I've taken ${user.quizzesTaken || 0} quizzes with ${accuracy}% accuracy on MentorAI!`;
      break;
  }

  // Premium share buttons
  const buttons = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setLabel('🌐 Add MentorAI')
      .setStyle(ButtonStyle.Link)
      .setURL(`https://discord.com/api/oauth2/authorize?client_id=${process.env.DISCORD_CLIENT_ID}&permissions=277025508416&scope=bot%20applications.commands`),
    new ButtonBuilder()
      .setCustomId('share_refresh_' + type)
      .setLabel('Refresh')
      .setStyle(ButtonStyle.Secondary)
      .setEmoji('🔄')
  );

  const row2 = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('execute_quiz')
      .setLabel('Take Quiz')
      .setStyle(ButtonStyle.Primary)
      .setEmoji('🎯'),
    new ButtonBuilder()
      .setCustomId('execute_learn')
      .setLabel('Learn')
      .setStyle(ButtonStyle.Success)
      .setEmoji('📚'),
    new ButtonBuilder()
      .setCustomId('help_main')
      .setLabel('Menu')
      .setStyle(ButtonStyle.Secondary)
      .setEmoji('🏠')
  );

  embed.setFooter({ 
    text: '🎓 MentorAI - AI-Powered Learning on Discord',
    iconURL: interaction.client.user.displayAvatarURL()
  });

  // Track share in database
  user.shareCount = (user.shareCount || 0) + 1;
  user.lastShareDate = new Date();
  await user.save();

  await interaction.editReply({ 
    content: '**✨ Share this with your friends!**\n\n> ' + shareText + '\n\n' + createSectionDivider(),
    embeds: [embed], 
    components: [buttons, row2] 
  });
}

function createProgressCard(discordUser, user) {
  const level = user.level || 1;
  const xp = user.xp || 0;
  const totalXp = (user.totalXp || xp).toLocaleString();
  
  const xpNeeded = Math.floor(100 * Math.pow(1.5, level - 1));
  const progressBar = createProgressBar(xp, xpNeeded, 15, 'blocks');
  const tier = getTier(level);

  return new EmbedBuilder()
    .setColor(tier.color)
    .setAuthor({ 
      name: '✨ ' + discordUser.username + '\'s Learning Journey',
      iconURL: discordUser.displayAvatarURL({ dynamic: true })
    })
    .setThumbnail(discordUser.displayAvatarURL({ dynamic: true, size: 512 }))
    .setDescription(
      '```\n' +
      '🎓 MENTORAI PROGRESS CARD\n' +
      tier.badge + ' ' + tier.name + ' TIER ' + tier.badge + '\n' +
      '```'
    )
    .addFields(
      { name: '━━━━━━━ STATS ━━━━━━━', value: '\u200b', inline: false },
      { name: '⭐ Level', value: '`' + level + '`', inline: true },
      { name: '✨ Total XP', value: '`' + totalXp + '`', inline: true },
      { name: '🔥 Streak', value: '`' + (user.streak || 0) + ' days`', inline: true },
      { name: '📈 Level Progress', value: '```\n' + progressBar + ' ' + Math.round((xp/xpNeeded)*100) + '%\n' + xp + ' / ' + xpNeeded + ' XP\n```', inline: false },
      { name: '📚 Lessons', value: '```\n' + (user.completedLessons?.length || 0) + '\n```', inline: true },
      { name: '🎯 Quizzes', value: '```\n' + (user.quizzesTaken || 0) + '\n```', inline: true },
      { name: '🏆 Achievements', value: '```\n' + (user.achievements?.length || 0) + '/40\n```', inline: true }
    )
    .setTimestamp();
}

function getTier(level) {
  if (level >= 50) return { name: 'LEGENDARY', color: 0xFF00FF, badge: '💫' };
  if (level >= 30) return { name: 'PLATINUM', color: 0xE5E4E2, badge: '💎' };
  if (level >= 20) return { name: 'GOLD', color: 0xFFD700, badge: '🥇' };
  if (level >= 10) return { name: 'SILVER', color: 0xC0C0C0, badge: '🥈' };
  return { name: 'BRONZE', color: 0xCD7F32, badge: '🥉' };
}

function createAchievementCard(discordUser, user) {
  const achievements = user.achievements || [];
  const totalAchievements = 40; // Total available
  
  const recentAchievements = achievements.slice(-5).map(a => '🏆 ' + a).join('\n') || '_No achievements yet!_';

  return new EmbedBuilder()
    .setColor(COLORS.ACHIEVEMENT_PURPLE)
    .setAuthor({ 
      name: discordUser.username + '\'s Trophy Case',
      iconURL: discordUser.displayAvatarURL({ dynamic: true })
    })
    .setThumbnail(discordUser.displayAvatarURL({ dynamic: true, size: 256 }))
    .setDescription(
      '```\n' +
      '🏆 ACHIEVEMENT SHOWCASE\n' +
      '```'
    )
    .addFields(
      { name: '🏆 Unlocked', value: '```\n' + achievements.length + ' / ' + totalAchievements + '\n```', inline: true },
      { name: '📊 Completion', value: '```\n' + Math.round((achievements.length/totalAchievements)*100) + '%\n```', inline: true },
      { name: '⭐ Rarity', value: '```\n' + getRarityTitle(achievements.length) + '\n```', inline: true },
      { name: '🎖️ Recent Achievements', value: recentAchievements, inline: false }
    )
    .setTimestamp();
}

function createStreakCard(discordUser, user) {
  const streak = user.streak || 0;
  const streakEmoji = getStreakEmoji(streak);
  const streakTitle = getStreakTitle(streak);

  // Create flame visualization
  const flames = streak > 0 ? '🔥'.repeat(Math.min(streak, 10)) : '❄️';

  return new EmbedBuilder()
    .setColor(0xFF6B35)
    .setAuthor({ 
      name: discordUser.username + '\'s Streak',
      iconURL: discordUser.displayAvatarURL({ dynamic: true })
    })
    .setThumbnail(discordUser.displayAvatarURL({ dynamic: true, size: 256 }))
    .setDescription(
      '```\n' +
      '🔥 STREAK FLEX CARD\n' +
      '```\n' + flames
    )
    .addFields(
      { name: streakEmoji + ' Current Streak', value: '```\n' + streak + ' DAYS\n```', inline: true },
      { name: '🏅 Title', value: '```\n' + streakTitle + '\n```', inline: true },
      { name: '📅 Status', value: streak > 0 ? '✅ Active Today!' : '❌ Start learning!', inline: false }
    )
    .setTimestamp();
}

function createQuizCard(discordUser, user) {
  const quizzes = user.quizzesTaken || 0;
  const correct = user.correctAnswers || 0;
  const total = user.totalQuestions || 0;
  const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;

  return new EmbedBuilder()
    .setColor(COLORS.QUIZ_PINK)
    .setAuthor({ 
      name: discordUser.username + '\'s Quiz Stats',
      iconURL: discordUser.displayAvatarURL({ dynamic: true })
    })
    .setThumbnail(discordUser.displayAvatarURL({ dynamic: true, size: 256 }))
    .setDescription(
      '```\n' +
      '🎯 QUIZ MASTER CARD\n' +
      '```'
    )
    .addFields(
      { name: '🎯 Quizzes Taken', value: '```\n' + quizzes + '\n```', inline: true },
      { name: '✅ Correct Answers', value: '```\n' + correct + ' / ' + total + '\n```', inline: true },
      { name: '📊 Accuracy', value: '```\n' + accuracy + '%\n```', inline: true },
      { name: '🏅 Quiz Rank', value: '```\n' + getQuizRank(accuracy, quizzes) + '\n```', inline: false }
    )
    .setTimestamp();
}

function getRarityTitle(count) {
  if (count >= 35) return '🌟 Legendary Collector';
  if (count >= 25) return '💎 Epic Collector';
  if (count >= 15) return '💜 Rare Collector';
  if (count >= 5) return '💚 Uncommon';
  return '⚪ Getting Started';
}

function getStreakEmoji(streak) {
  if (streak >= 100) return '💫';
  if (streak >= 30) return '🌟';
  if (streak >= 14) return '⚡';
  if (streak >= 7) return '🔥';
  return '✨';
}

function getStreakTitle(streak) {
  if (streak >= 100) return 'LEGENDARY';
  if (streak >= 30) return 'UNSTOPPABLE';
  if (streak >= 14) return 'ON FIRE';
  if (streak >= 7) return 'WEEK WARRIOR';
  if (streak >= 3) return 'BUILDING MOMENTUM';
  return 'JUST STARTING';
}

function getQuizRank(accuracy, quizzes) {
  if (quizzes < 5) return '🆕 Newcomer';
  if (accuracy >= 90) return '👑 Quiz Master';
  if (accuracy >= 75) return '🎯 Sharp Shooter';
  if (accuracy >= 60) return '📚 Dedicated Learner';
  return '🌱 Growing';
}
