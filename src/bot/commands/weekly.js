import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { User } from '../../database/models/User.js';
import { getOrCreateUser } from '../../services/gamificationService.js';
import { COLORS, createProgressBar, createSectionDivider } from '../../config/designSystem.js';
import { animateLoading } from '../../utils/animations.js';

// Weekly challenge themes with enhanced data
const WEEKLY_THEMES = [
  { id: 'quiz_master', name: 'Quiz Master Week', description: 'Complete the most quizzes!', emoji: '🎯', metric: 'quizzesTaken', color: 0xE91E63, icon: '🧠' },
  { id: 'streak_warrior', name: 'Streak Warriors', description: 'Build the longest streak!', emoji: '🔥', metric: 'streak', color: 0xFF6B35, icon: '⚡' },
  { id: 'xp_hunter', name: 'XP Hunters', description: 'Earn the most XP!', emoji: '✨', metric: 'xp', color: 0xFFD700, icon: '💎' },
  { id: 'lesson_grind', name: 'Lesson Grinders', description: 'Complete the most lessons!', emoji: '📚', metric: 'lessonsCompleted', color: 0x3498DB, icon: '🎓' },
  { id: 'accuracy_king', name: 'Accuracy Kings', description: 'Get the highest quiz accuracy!', emoji: '🎯', metric: 'accuracy', color: 0x9B59B6, icon: '👑' }
];

export const data = new SlashCommandBuilder()
  .setName('weekly')
  .setDescription('🏆 Weekly server challenges with bonus rewards!')
  .addSubcommand(sub =>
    sub.setName('challenge')
      .setDescription('View this week\'s challenge'))
  .addSubcommand(sub =>
    sub.setName('leaderboard')
      .setDescription('See who\'s winning the weekly challenge'))
  .addSubcommand(sub =>
    sub.setName('rewards')
      .setDescription('View weekly challenge rewards'));

export async function execute(interaction) {
  const subcommand = interaction.options.getSubcommand();

  switch (subcommand) {
    case 'challenge':
      await showChallenge(interaction);
      break;
    case 'leaderboard':
      await showLeaderboard(interaction);
      break;
    case 'rewards':
      await showRewards(interaction);
      break;
  }
}

async function showChallenge(interaction) {
  await interaction.deferReply();
  
  // Track weekly participation
  const user = await getOrCreateUser(interaction.user.id, interaction.user.username);
  const currentWeek = getWeekNumber();
  
  // Check if this is a new weekly participation
  if (!user.lastWeeklyParticipation || user.lastWeeklyParticipation !== currentWeek) {
    user.weeklyParticipations = (user.weeklyParticipations || 0) + 1;
    user.lastWeeklyParticipation = currentWeek;
    user.lastWeeklyDate = new Date();
    await user.save();
  }
  
  // Animated loading
  await animateLoading(interaction, {
    title: '🏆 Loading Weekly Challenge',
    color: COLORS.XP_GOLD,
    duration: 1500,
    style: 'sparkle',
    stages: [
      { text: 'Fetching challenge data...', status: '📊 Loading' },
      { text: 'Calculating standings...', status: '🏆 Ready' }
    ]
  });

  const weekNumber = getWeekNumber();
  const challenge = WEEKLY_THEMES[weekNumber % WEEKLY_THEMES.length];
  
  const endOfWeek = getEndOfWeek();
  const daysLeft = Math.ceil((endOfWeek - new Date()) / (1000 * 60 * 60 * 24));
  const hoursLeft = Math.ceil((endOfWeek - new Date()) / (1000 * 60 * 60)) % 24;
  
  // Get current leader
  const users = await User.find({}).lean();
  const sorted = sortUsersByMetric(users, challenge.metric);
  const leader = sorted[0];

  const embed = new EmbedBuilder()
    .setTitle(challenge.emoji + ' Weekly Challenge: ' + challenge.name)
    .setColor(challenge.color || COLORS.XP_GOLD)
    .setDescription(
      '```\n' +
      "🏆 THIS WEEK'S GLOBAL CHALLENGE 🏆\n" +
      challenge.icon + ' ' + challenge.name.toUpperCase() + ' ' + challenge.icon + '\n' +
      '```\n' +
      '### ' + challenge.emoji + ' ' + challenge.description
    )
    .addFields(
      { name: '━━━━━ CHALLENGE INFO ━━━━━', value: '\u200b', inline: false },
      { name: '🎯 Objective', value: '```\n' + challenge.description + '\n```', inline: true },
      { name: '⏰ Time Left', value: '`' + daysLeft + 'd ' + hoursLeft + 'h`', inline: true },
      { name: '🏅 Current Leader', value: leader ? '`👑 ' + leader.username + '`' : '`No one yet!`', inline: true },
      { 
        name: '━━━━━━ REWARDS ━━━━━━', 
        value: '🥇 **1st Place:** +500 XP + "🏆 Weekly Champion" badge\n' +
               '🥈 **2nd Place:** +300 XP + "🥈 Runner Up" badge\n' +
               '🥉 **3rd Place:** +150 XP\n' +
               '📍 **Top 10:** +50 XP each',
        inline: false 
      },
      {
        name: '💡 How to Win',
        value: '> Just keep learning! Your progress is **automatically tracked**.\n> Use `/weekly leaderboard` to see live standings.',
        inline: false
      }
    )
    .setFooter({ text: '🎓 MentorAI Weekly Challenges | Week #' + weekNumber + ' | Ends Sunday 11:59 PM' })
    .setTimestamp();

  const buttons = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('weekly_leaderboard')
      .setLabel('View Leaderboard')
      .setEmoji('🏆')
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId('execute_quiz')
      .setLabel('Start Quiz')
      .setEmoji('🎯')
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId('weekly_rewards')
      .setLabel('Rewards')
      .setEmoji('🎁')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId('help_main')
      .setLabel('Menu')
      .setEmoji('🏠')
      .setStyle(ButtonStyle.Secondary)
  );

  await interaction.editReply({ embeds: [embed], components: [buttons] });
}

function sortUsersByMetric(users, metric) {
  return [...users].sort((a, b) => {
    switch (metric) {
      case 'quizzesTaken':
        return (b.quizzesTaken || 0) - (a.quizzesTaken || 0);
      case 'streak':
        return (b.streak || 0) - (a.streak || 0);
      case 'xp':
        return (b.xp || 0) - (a.xp || 0);
      case 'lessonsCompleted':
        return (b.completedLessons?.length || 0) - (a.completedLessons?.length || 0);
      case 'accuracy':
        const accA = a.totalQuestions > 0 ? (a.correctAnswers / a.totalQuestions) : 0;
        const accB = b.totalQuestions > 0 ? (b.correctAnswers / b.totalQuestions) : 0;
        return accB - accA;
      default:
        return 0;
    }
  });
}

async function showLeaderboard(interaction) {
  await interaction.deferReply();

  // Loading animation
  await animateLoading(interaction, {
    title: '🏆 Loading Leaderboard',
    color: COLORS.XP_GOLD,
    duration: 1500,
    style: 'bar',
    stages: [
      { text: 'Gathering rankings...', status: '📊 Calculating' },
      { text: 'Building leaderboard...', status: '🏆 Ready' }
    ]
  });

  const weekNumber = getWeekNumber();
  const challenge = WEEKLY_THEMES[weekNumber % WEEKLY_THEMES.length];

  // Get all users and sort by challenge metric
  const users = await User.find({}).lean();
  const sortedUsers = sortUsersByMetric(users, challenge.metric);

  const top10 = sortedUsers.slice(0, 10);
  const userRank = sortedUsers.findIndex(u => u.discordId === interaction.user.id) + 1;
  const userData = sortedUsers.find(u => u.discordId === interaction.user.id);

  // Create premium leaderboard display
  const medals = ['🥇', '🥈', '🥉'];
  const rankEmojis = ['👑', '⭐', '🌟', '✨', '💫', '🌟', '✨', '💫', '🌟', '✨'];
  
  let leaderboardText = '';
  top10.forEach((user, index) => {
    const medal = medals[index] || rankEmojis[index] || `\`${index + 1}.\``;
    const value = getMetricValue(user, challenge.metric);
    const highlight = user.discordId === interaction.user.id ? '**➤ ' : '**';
    const suffix = user.discordId === interaction.user.id ? ' ← YOU**' : '**';
    leaderboardText += `${medal} ${highlight}${user.username}${suffix} — ${value}\n`;
  });

  if (leaderboardText === '') {
    leaderboardText = '_No participants yet! Be the first!_';
  }

  const embed = new EmbedBuilder()
    .setTitle('🏆 Weekly Leaderboard')
    .setColor(challenge.color || COLORS.XP_GOLD)
    .setDescription(
      '```\n' +
      challenge.emoji + ' ' + challenge.name.toUpperCase() + '\n' +
      'Week #' + weekNumber + ' Rankings\n' +
      '```\n\n' +
      leaderboardText
    )
    .setTimestamp();

  // Add user's position if not in top 10
  if (userData && userRank > 10) {
    embed.addFields({
      name: '📍 Your Position',
      value: '`#' + userRank + '` - ' + getMetricValue(userData, challenge.metric),
      inline: false
    });
  }

  embed.addFields(
    {
      name: '🏅 Prize Pool',
      value: '🥇 +500 XP | 🥈 +300 XP | 🥉 +150 XP',
      inline: true
    },
    {
      name: '👥 Participants',
      value: sortedUsers.length.toString(),
      inline: true
    }
  );

  embed.setFooter({ text: userRank > 0 ? '🎯 Your Rank: #' + userRank + ' | Keep learning to climb!' : '🚀 Start learning to join the leaderboard!' });

  const buttons = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('weekly_challenge')
      .setLabel('View Challenge')
      .setEmoji('🎯')
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId('execute_quiz')
      .setLabel('Take Quiz')
      .setEmoji('🧠')
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId('weekly_refresh')
      .setLabel('Refresh')
      .setEmoji('🔄')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId('help_main')
      .setLabel('Menu')
      .setEmoji('🏠')
      .setStyle(ButtonStyle.Secondary)
  );

  await interaction.editReply({ embeds: [embed], components: [buttons] });
}

async function showRewards(interaction) {
  const embed = new EmbedBuilder()
    .setTitle('🎁 Weekly Challenge Rewards')
    .setColor(COLORS.ACHIEVEMENT_PURPLE)
    .setDescription(
      '**Compete in weekly challenges for amazing rewards!**\n\n' +
      'Every week features a new challenge theme. Top performers earn:\n'
    )
    .addFields(
      { 
        name: '🥇 1st Place', 
        value: '• +500 Bonus XP\n• "Weekly Champion" Achievement\n• Special Discord Role (if configured)', 
        inline: true 
      },
      { 
        name: '🥈 2nd Place', 
        value: '• +300 Bonus XP\n• "Runner Up" Achievement', 
        inline: true 
      },
      { 
        name: '🥉 3rd Place', 
        value: '• +150 Bonus XP\n• "Podium Finisher" Achievement', 
        inline: true 
      },
      { 
        name: '📍 Top 10', 
        value: '• +50 Bonus XP\n• "Weekly Top 10" Badge', 
        inline: false 
      },
      { 
        name: '🔄 Challenge Themes', 
        value: WEEKLY_THEMES.map(t => t.emoji + ' ' + t.name).join('\n'), 
        inline: false 
      }
    )
    .setFooter({ text: '🎓 MentorAI | New challenge every Monday!' })
    .setTimestamp();

  const buttons = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('weekly_challenge')
      .setLabel('View Challenge')
      .setEmoji('🎯')
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId('help_main')
      .setLabel('Menu')
      .setEmoji('🏠')
      .setStyle(ButtonStyle.Secondary)
  );

  await interaction.reply({ embeds: [embed], components: [buttons] });
}

function getWeekNumber() {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  const diff = now - start;
  const oneWeek = 1000 * 60 * 60 * 24 * 7;
  return Math.floor(diff / oneWeek);
}

function getEndOfWeek() {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const daysUntilSunday = 7 - dayOfWeek;
  const endOfWeek = new Date(now);
  endOfWeek.setDate(now.getDate() + daysUntilSunday);
  endOfWeek.setHours(23, 59, 59, 999);
  return endOfWeek;
}

function getMetricValue(user, metric) {
  switch (metric) {
    case 'quizzesTaken':
      return (user.quizzesTaken || 0) + ' quizzes';
    case 'streak':
      return (user.streak || 0) + ' day streak';
    case 'xp':
      return (user.xp || 0).toLocaleString() + ' XP';
    case 'lessonsCompleted':
      return (user.completedLessons?.length || 0) + ' lessons';
    case 'accuracy':
      const acc = user.totalQuestions > 0 
        ? Math.round((user.correctAnswers / user.totalQuestions) * 100) 
        : 0;
      return acc + '% accuracy';
    default:
      return '0';
  }
}
