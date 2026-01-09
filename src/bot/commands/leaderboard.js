// src/bot/commands/leaderboard.js
// ═══════════════════════════════════════════════════════════════════
// ULTRA QUIZ SYSTEM - LEADERBOARD COMMAND
// ═══════════════════════════════════════════════════════════════════

import { 
  SlashCommandBuilder, 
  EmbedBuilder, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle,
  StringSelectMenuBuilder
} from 'discord.js';
import { User } from '../../database/models/User.js';
import { getLeaderboard, getOrCreateUser } from '../../services/gamificationService.js';
import {
  formatNumber,
  getRankFromXP
} from '../../utils/quizUtils.js';

// ═══════════════════════════════════════════════════════════════════
// COMMAND DEFINITION
// ═══════════════════════════════════════════════════════════════════

export const data = new SlashCommandBuilder()
  .setName('leaderboard')
  .setDescription('🏆 View the top learners')
  .addStringOption(option =>
    option.setName('type')
      .setDescription('Leaderboard type')
      .addChoices(
        { name: '✨ XP - Total experience points', value: 'xp' },
        { name: '🔥 Streak - Longest learning streaks', value: 'streak' },
        { name: '🎯 Quizzes - Most quizzes completed', value: 'quizzes' },
        { name: '🏆 Wins - Tournament victories', value: 'wins' },
        { name: '📊 Accuracy - Best quiz accuracy', value: 'accuracy' }
      ))
  .addStringOption(option =>
    option.setName('scope')
      .setDescription('Leaderboard scope')
      .addChoices(
        { name: '🌍 Global - All users', value: 'global' },
        { name: '🏠 Server - This server only', value: 'server' },
        { name: '📅 Weekly - This week', value: 'weekly' }
      ));

// ═══════════════════════════════════════════════════════════════════
// MAIN EXECUTE FUNCTION
// ═══════════════════════════════════════════════════════════════════

export async function execute(interaction) {
  await interaction.deferReply();

  const type = interaction.options.getString('type') || 'xp';
  const scope = interaction.options.getString('scope') || 'global';

  try {
    const currentUser = await getOrCreateUser(interaction.user.id, interaction.user.username);
    const users = await getLeaderboardData(type, scope, interaction.guild?.id);
    
    const embed = createLeaderboardEmbed(users, type, scope, currentUser, 1);
    const components = createLeaderboardComponents(type, scope, 1, Math.ceil(users.length / 10));

    await interaction.editReply({ embeds: [embed], components });
  } catch (error) {
    console.error('Leaderboard command error:', error);
    await interaction.editReply({
      content: `${QUIZ_EMOJIS.INCORRECT} Failed to load leaderboard. Please try again!`
    });
  }
}

// ═══════════════════════════════════════════════════════════════════
// GET LEADERBOARD DATA
// ═══════════════════════════════════════════════════════════════════

async function getLeaderboardData(type, scope, guildId) {
  let query = {};
  let sortField = {};
  
  // Build sort field based on type
  switch (type) {
    case 'xp':
      sortField = { xp: -1 };
      break;
    case 'streak':
      sortField = { streak: -1 };
      break;
    case 'quizzes':
      sortField = { quizzesCompleted: -1 };
      break;
    case 'wins':
      sortField = { tournamentWins: -1 };
      query.tournamentWins = { $gt: 0 };
      break;
    case 'accuracy':
      sortField = { 'stats.accuracy': -1 };
      break;
    default:
      sortField = { xp: -1 };
  }

  // Build scope filter
  if (scope === 'weekly') {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    query.lastActive = { $gte: weekAgo };
  }

  // Note: Server-specific leaderboards would require storing guildId with users
  // For now, we'll use global data

  try {
    const users = await User.find(query)
      .sort(sortField)
      .limit(100)
      .lean();
    return users;
  } catch (error) {
    console.error('Error fetching leaderboard data:', error);
    return [];
  }
}

// ═══════════════════════════════════════════════════════════════════
// CREATE LEADERBOARD EMBED
// ═══════════════════════════════════════════════════════════════════

function createLeaderboardEmbed(users, type, scope, currentUser, page) {
  const usersPerPage = 10;
  const startIndex = (page - 1) * usersPerPage;
  const pageUsers = users.slice(startIndex, startIndex + usersPerPage);
  const totalPages = Math.ceil(users.length / usersPerPage) || 1;

  // Type info
  const typeInfo = {
    xp: { emoji: '✨', name: 'XP Leaderboard', color: 0xFFD700, field: 'xp', format: (v) => `${formatNumber(v || 0)} XP` },
    streak: { emoji: '🔥', name: 'Streak Champions', color: 0xFF6B35, field: 'streak', format: (v) => `${v || 0} days` },
    quizzes: { emoji: '🎯', name: 'Quiz Masters', color: 0x5865F2, field: 'quizzesCompleted', format: (v) => `${v || 0} quizzes` },
    wins: { emoji: '🏆', name: 'Tournament Champions', color: 0x57F287, field: 'tournamentWins', format: (v) => `${v || 0} wins` },
    accuracy: { emoji: '📊', name: 'Accuracy Leaders', color: 0x3498DB, field: 'stats.accuracy', format: (v) => `${(v || 0).toFixed(1)}%` }
  };

  const info = typeInfo[type] || typeInfo.xp;

  // Scope info
  const scopeEmoji = scope === 'global' ? '🌍' : scope === 'server' ? '🏠' : '📅';
  const scopeName = scope === 'global' ? 'Global' : scope === 'server' ? 'This Server' : 'This Week';

  // Build leaderboard entries with proper formatting
  let leaderboardText = '';
  
  pageUsers.forEach((user, index) => {
    const position = startIndex + index + 1;
    const rank = getRankFromXP(user.xp || 0);
    
    // Medal emojis for top 3
    let medal = '';
    if (position === 1) medal = '🥇';
    else if (position === 2) medal = '🥈';
    else if (position === 3) medal = '🥉';
    else medal = `\`${position}.\``;

    // Get the value based on type
    let value;
    if (type === 'accuracy') {
      value = user.stats?.accuracy || (user.correctAnswers && user.totalAnswers 
        ? (user.correctAnswers / user.totalAnswers) * 100 
        : 0);
    } else {
      value = user[info.field] || 0;
    }

    const isCurrentUser = user.discordId === currentUser.discordId;
    const username = user.username || 'Unknown';
    
    if (isCurrentUser) {
      leaderboardText += `${medal} **${rank.emoji} ${username}** › \`${info.format(value)}\` ⬅️\n`;
    } else {
      leaderboardText += `${medal} ${rank.emoji} ${username} › \`${info.format(value)}\`\n`;
    }
  });

  if (!leaderboardText) {
    leaderboardText = '*No users found yet. Be the first!*';
  }

  // Find current user's position
  const userPosition = users.findIndex(u => u.discordId === currentUser.discordId) + 1;
  const userRank = getRankFromXP(currentUser.xp || 0);
  let userValue;
  if (type === 'accuracy') {
    userValue = currentUser.stats?.accuracy || (currentUser.correctAnswers && currentUser.totalAnswers 
      ? (currentUser.correctAnswers / currentUser.totalAnswers) * 100 
      : 0);
  } else {
    userValue = currentUser[info.field] || 0;
  }

  const embed = new EmbedBuilder()
    .setColor(info.color)
    .setTitle(`${info.emoji} ${info.name}`)
    .setDescription(`${scopeEmoji} **${scopeName}** Rankings`)
    .addFields(
      {
        name: '🏅 Top Players',
        value: leaderboardText || '*No data*',
        inline: false
      },
      {
        name: '📍 Your Rank',
        value: userPosition > 0 
          ? `${userRank.emoji} **#${userPosition}** › \`${info.format(userValue)}\``
          : `${userRank.emoji} Not ranked yet • Take a quiz to join!`,
        inline: false
      }
    )
    .setFooter({ text: `Page ${page}/${totalPages} • ${users.length} learners • Updated live` })
    .setTimestamp();

  return embed;
}

// ═══════════════════════════════════════════════════════════════════
// CREATE LEADERBOARD COMPONENTS
// ═══════════════════════════════════════════════════════════════════

function createLeaderboardComponents(type, scope, currentPage, totalPages) {
  const components = [];

  // Type selector
  const typeMenu = new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId('lb_type_select')
      .setPlaceholder('📊 Select Leaderboard Type')
      .addOptions([
        { label: 'XP', value: 'xp', emoji: '✨', description: 'Total experience points', default: type === 'xp' },
        { label: 'Streak', value: 'streak', emoji: '🔥', description: 'Longest learning streaks', default: type === 'streak' },
        { label: 'Quizzes', value: 'quizzes', emoji: '🎯', description: 'Most quizzes completed', default: type === 'quizzes' },
        { label: 'Tournament Wins', value: 'wins', emoji: '🏆', description: 'Tournament victories', default: type === 'wins' },
        { label: 'Accuracy', value: 'accuracy', emoji: '📊', description: 'Best quiz accuracy', default: type === 'accuracy' }
      ])
  );
  components.push(typeMenu);

  // Navigation buttons
  const navRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`lb_page_${currentPage - 1}_${type}_${scope}`)
      .setLabel('◀ Previous')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(currentPage <= 1),
    new ButtonBuilder()
      .setCustomId(`lb_refresh_${type}_${scope}`)
      .setLabel('🔄 Refresh')
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId(`lb_page_${currentPage + 1}_${type}_${scope}`)
      .setLabel('Next ▶')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(currentPage >= totalPages)
  );
  components.push(navRow);

  // Utility buttons
  const utilRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('exec_profile')
      .setLabel('My Profile')
      .setEmoji('👤')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId('exec_quiz')
      .setLabel('Take Quiz')
      .setEmoji('🎯')
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId('help_main')
      .setLabel('Menu')
      .setEmoji('🏠')
      .setStyle(ButtonStyle.Secondary)
  );
  components.push(utilRow);

  return components;
}

// ═══════════════════════════════════════════════════════════════════
// BUTTON HANDLER
// ═══════════════════════════════════════════════════════════════════

export async function handleButton(interaction, action, params) {
  try {
    if (action === 'page') {
      const page = parseInt(params[0], 10) || 1;
      const type = params[1] || 'xp';
      const scope = params[2] || 'global';
      await showPage(interaction, page, type, scope);
    } else if (action === 'refresh') {
      const type = params[0] || 'xp';
      const scope = params[1] || 'global';
      await showPage(interaction, 1, type, scope);
    } else if (action === 'type') {
      await handleTypeChange(interaction, params[0]);
    } else if (action === 'scope') {
      await handleScopeChange(interaction, params[0]);
    }
  } catch (error) {
    console.error('Leaderboard button handler error:', error);
    await interaction.reply({
      content: `${QUIZ_EMOJIS.INCORRECT} Something went wrong!`,
      ephemeral: true
    }).catch(() => {});
  }
}

// ═══════════════════════════════════════════════════════════════════
// SELECT MENU HANDLER
// ═══════════════════════════════════════════════════════════════════

export async function handleSelectMenu(interaction, menuType) {
  if (menuType === 'type_select') {
    const newType = interaction.values[0];
    await showPage(interaction, 1, newType, 'global');
  }
}

// ═══════════════════════════════════════════════════════════════════
// SHOW PAGE
// ═══════════════════════════════════════════════════════════════════

async function showPage(interaction, page, type, scope) {
  await interaction.deferUpdate();

  try {
    const currentUser = await getOrCreateUser(interaction.user.id, interaction.user.username);
    const users = await getLeaderboardData(type, scope, interaction.guild?.id);
    
    const totalPages = Math.ceil(users.length / 10) || 1;
    const safePage = Math.min(Math.max(1, page), totalPages);
    
    const embed = createLeaderboardEmbed(users, type, scope, currentUser, safePage);
    const components = createLeaderboardComponents(type, scope, safePage, totalPages);

    await interaction.editReply({ embeds: [embed], components });
  } catch (error) {
    console.error('Leaderboard page error:', error);
    await interaction.followUp({
      content: `${QUIZ_EMOJIS.INCORRECT} Failed to load page.`,
      ephemeral: true
    });
  }
}

async function handleTypeChange(interaction, type) {
  await showPage(interaction, 1, type, 'global');
}

async function handleScopeChange(interaction, scope) {
  await showPage(interaction, 1, 'xp', scope);
}

export default { data, execute, handleButton, handleSelectMenu };
