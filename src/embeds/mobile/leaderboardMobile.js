// src/embeds/mobile/leaderboardMobile.js
import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { MOBILE, mobileNumber } from '../../utils/mobileUI.js';

export function createMobileLeaderboardEmbed(users, page, totalPages, currentUser, sortBy = 'xp') {
  const startRank = (page - 1) * 10 + 1;
  
  // Medals for top 3
  const medals = ['👑', '🥈', '🥉'];
  
  // Build compact leaderboard
  let leaderboardText = '';
  
  (users || []).forEach((u, index) => {
    const rank = startRank + index;
    const medal = rank <= 3 ? medals[rank - 1] : `\`${rank.toString().padStart(2)}\``;
    const isYou = u.odiscordId === currentUser?.discordId;
    const highlight = isYou ? '**' : '';
    
    // Compact format for mobile
    const xpDisplay = mobileNumber(u.xp || 0);
    const levelDisplay = `Lv.${u.level || 1}`;
    const username = (u.username || 'User').substring(0, 12);
    
    leaderboardText += `${medal} ${highlight}${username}${highlight}\n`;
    leaderboardText += `   ${levelDisplay} • ✨${xpDisplay} • 🔥${u.streak || 0}\n`;
  });

  const sortEmojis = {
    xp: '✨',
    level: '📊',
    streak: '🔥',
    accuracy: '🎯'
  };

  const embed = new EmbedBuilder()
    .setColor(MOBILE.colors.GOLD)
    .setAuthor({
      name: '👑 Leaderboard'
    })
    .setDescription(`
${MOBILE.separators.sparkle}

${sortEmojis[sortBy] || '✨'} Sort: **${(sortBy || 'xp').toUpperCase()}**

${MOBILE.separators.thin}

${leaderboardText || 'No users yet!'}
${MOBILE.separators.thin}

📍 You: **#${currentUser?.rank || '???'}**
    `)
    .setFooter({
      text: `Page ${page}/${totalPages}`
    });

  // Mobile pagination (compact)
  const paginationRow = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('lb_prev')
        .setLabel('◀️')
        .setStyle(ButtonStyle.Primary)
        .setDisabled(page === 1),
      new ButtonBuilder()
        .setCustomId('lb_page')
        .setLabel(`${page}/${totalPages}`)
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(true),
      new ButtonBuilder()
        .setCustomId('lb_next')
        .setLabel('▶️')
        .setStyle(ButtonStyle.Primary)
        .setDisabled(page === totalPages),
      new ButtonBuilder()
        .setCustomId('lb_me')
        .setLabel('📍 Me')
        .setStyle(ButtonStyle.Success)
    );

  // Sort options (compact)
  const sortRow = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('lb_sort_xp')
        .setLabel('✨')
        .setStyle(sortBy === 'xp' ? ButtonStyle.Success : ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('lb_sort_level')
        .setLabel('📊')
        .setStyle(sortBy === 'level' ? ButtonStyle.Success : ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('lb_sort_streak')
        .setLabel('🔥')
        .setStyle(sortBy === 'streak' ? ButtonStyle.Success : ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('lb_sort_accuracy')
        .setLabel('🎯')
        .setStyle(sortBy === 'accuracy' ? ButtonStyle.Success : ButtonStyle.Secondary)
    );

  return { embeds: [embed], components: [paginationRow, sortRow] };
}

// "Jump to me" view
export function createMobileLeaderboardMeEmbed(surroundingUsers, currentUser) {
  let text = '';
  
  (surroundingUsers || []).forEach(u => {
    const isYou = u.discordId === currentUser?.discordId;
    const marker = isYou ? '→ ' : '  ';
    const highlight = isYou ? '**' : '';
    const username = (u.username || 'User').substring(0, 10);
    
    text += `${marker}#${u.rank || '?'} ${highlight}${username}${highlight}\n`;
    text += `     Lv.${u.level || 1} • ✨${mobileNumber(u.xp || 0)}\n`;
  });

  const embed = new EmbedBuilder()
    .setColor(MOBILE.colors.PRIMARY)
    .setTitle('📍 Your Position')
    .setDescription(`
${MOBILE.separators.thin}

${text || 'No data available'}
${MOBILE.separators.thin}

💪 ${getMotivation(currentUser?.rank)}
    `)
    .setFooter({ text: '🔼 Keep learning to climb!' });

  const row = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('lb_back')
        .setLabel('◀️ Back')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('quick_quiz')
        .setLabel('🎯 Quiz')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('view_profile')
        .setLabel('👤')
        .setStyle(ButtonStyle.Secondary)
    );

  return { embeds: [embed], components: [row] };
}

function getMotivation(rank) {
  if (!rank) return 'Start learning to get ranked!';
  if (rank <= 3) return '🏆 Top 3! Amazing!';
  if (rank <= 10) return '⭐ Top 10! Keep it up!';
  if (rank <= 50) return '🔥 Top 50! Great work!';
  if (rank <= 100) return '💪 Top 100! Nice!';
  return 'Keep learning to climb!';
}

// Server leaderboard (mobile)
export function createMobileServerLeaderboardEmbed(users, serverName) {
  const medals = ['👑', '🥈', '🥉'];
  
  let leaderboardText = '';
  (users || []).slice(0, 10).forEach((u, index) => {
    const rank = index + 1;
    const medal = rank <= 3 ? medals[rank - 1] : `\`${rank.toString().padStart(2)}\``;
    const username = (u.username || 'User').substring(0, 12);
    
    leaderboardText += `${medal} ${username}\n`;
    leaderboardText += `   Lv.${u.level || 1} • ✨${mobileNumber(u.xp || 0)}\n`;
  });

  const embed = new EmbedBuilder()
    .setColor(MOBILE.colors.GOLD)
    .setTitle('🏆 Server Rankings')
    .setDescription(`
${MOBILE.separators.sparkle}

**${serverName || 'This Server'}**

${MOBILE.separators.thin}

${leaderboardText || 'No users yet!'}
    `)
    .setFooter({ text: '🌐 View global rankings' });

  const row = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('lb_global')
        .setLabel('🌐 Global')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('lb_weekly')
        .setLabel('📅 Weekly')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('view_profile')
        .setLabel('👤')
        .setStyle(ButtonStyle.Secondary)
    );

  return { embeds: [embed], components: [row] };
}

export default {
  createMobileLeaderboardEmbed,
  createMobileLeaderboardMeEmbed,
  createMobileServerLeaderboardEmbed
};
