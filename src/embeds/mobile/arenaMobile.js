// src/embeds/mobile/arenaMobile.js
import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { MOBILE, mobileNumber } from '../../utils/mobileUI.js';

// Arena lobby (mobile)
export function createMobileArenaLobbyEmbed(arena) {
  const players = arena?.players || [];
  const playerList = players
    .map((p, i) => `${i === 0 ? '👑' : '👤'} ${(p.username || 'Player').substring(0, 12)}`)
    .join('\n') || '*Empty*';

  const embed = new EmbedBuilder()
    .setColor(MOBILE.colors.PRIMARY)
    .setTitle('🏟️ Arena Lobby')
    .setDescription(`
${MOBILE.separators.thin}

📋 Code: **\`${arena?.code || 'XXXX'}\`**

${MOBILE.separators.thin}

👥 **Players (${players.length}/8):**
${playerList}

${MOBILE.separators.thin}

⚙️ **Settings:**
• 📚 ${arena?.topic || 'Random'}
• 📝 ${arena?.totalQuestions || 10} questions
• ${arena?.difficulty === 'easy' ? '🟢' : arena?.difficulty === 'medium' ? '🟡' : '🔴'} ${arena?.difficulty || 'medium'}

${MOBILE.separators.thin}

${players.length < 2 ? '⏳ Need 2+ players' : '✅ Ready to start!'}
    `)
    .setFooter({ text: '📤 Share code to invite!' });

  const row = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('arena_start')
        .setLabel('🚀 Start')
        .setStyle(ButtonStyle.Success)
        .setDisabled(players.length < 2),
      new ButtonBuilder()
        .setCustomId('arena_settings')
        .setLabel('⚙️')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('arena_leave')
        .setLabel('🚪')
        .setStyle(ButtonStyle.Danger)
    );

  return { embeds: [embed], components: [row] };
}

// Arena question (mobile)
export function createMobileArenaQuestionEmbed(question, questionNum, total, scores) {
  // Top 3 scoreboard only for mobile
  const sortedScores = (scores || [])
    .sort((a, b) => (b.score || 0) - (a.score || 0))
    .slice(0, 3);
  
  const medals = ['🥇', '🥈', '🥉'];
  const topScores = sortedScores
    .map((p, i) => `${medals[i]} ${(p.username || 'P').substring(0, 8)}: ${p.score || 0}`)
    .join(' | ');

  const questionText = question?.text || question?.question || 'Loading...';
  const mobileQuestion = questionText.length > 100 
    ? questionText.substring(0, 97) + '...'
    : questionText;
  
  const options = question?.options || ['A', 'B', 'C', 'D'];

  const embed = new EmbedBuilder()
    .setColor(MOBILE.colors.WARNING)
    .setAuthor({ name: `🏟️ Q${questionNum}/${total}` })
    .setDescription(`
${topScores || 'No scores yet'}

${MOBILE.separators.thin}

**${mobileQuestion}**

${MOBILE.separators.thin}

🅰️ ${options[0]}

🅱️ ${options[1]}

🅲️ ${options[2]}

🅳️ ${options[3]}
    `)
    .setFooter({ text: '⏱️ 15s - First correct = bonus!' });

  const row = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('arena_a')
        .setLabel('A')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('arena_b')
        .setLabel('B')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('arena_c')
        .setLabel('C')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('arena_d')
        .setLabel('D')
        .setStyle(ButtonStyle.Primary)
    );

  return { embeds: [embed], components: [row] };
}

// Arena final results (mobile)
export function createMobileArenaResultsEmbed(finalScores, topic) {
  const sorted = (finalScores || []).sort((a, b) => (b.score || 0) - (a.score || 0));
  const winner = sorted[0];

  const podium = sorted.slice(0, 3).map((p, i) => {
    const medals = ['🥇', '🥈', '🥉'];
    const xp = [150, 100, 75][i];
    return `${medals[i]} **${p.username || 'Player'}**\n   ${p.score || 0} pts • +${xp} XP`;
  }).join('\n\n');

  const others = sorted.slice(3).map((p, i) => 
    `${i + 4}. ${(p.username || 'Player').substring(0, 10)}: ${p.score || 0} pts`
  ).join('\n');

  const embed = new EmbedBuilder()
    .setColor(MOBILE.colors.GOLD)
    .setTitle('🏆 Arena Complete!')
    .setDescription(`
${MOBILE.separators.sparkle}

👑 **${winner?.username || 'Winner'} Wins!**

${MOBILE.separators.thin}

${podium}

${others ? `\n${MOBILE.separators.thin}\n${others}` : ''}

${MOBILE.separators.thin}

📚 Topic: ${topic || 'Mixed'}
    `)
    .setFooter({ text: '🔄 Play again?' });

  const row = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('arena_rematch')
        .setLabel('🔄 Again')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('arena_new')
        .setLabel('🆕 New')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('view_leaderboard')
        .setLabel('👑')
        .setStyle(ButtonStyle.Secondary)
    );

  return { embeds: [embed], components: [row] };
}

// Join arena (mobile)
export function createMobileArenaJoinEmbed() {
  const embed = new EmbedBuilder()
    .setColor(MOBILE.colors.PRIMARY)
    .setTitle('🏟️ Join Arena')
    .setDescription(`
${MOBILE.separators.thin}

**Options:**

🆕 **Create** - Host a new arena
🔗 **Join** - Enter arena code
🔍 **Quick** - Auto-match

${MOBILE.separators.thin}

💡 *Arenas support 2-8 players*
    `)
    .setFooter({ text: '👇 Choose an option' });

  const row = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('arena_create')
        .setLabel('🆕 Create')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId('arena_join_code')
        .setLabel('🔗 Join')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('arena_quick')
        .setLabel('🔍 Quick')
        .setStyle(ButtonStyle.Secondary)
    );

  return { embeds: [embed], components: [row] };
}

// Arena waiting for players (mobile)
export function createMobileArenaWaitingEmbed(arena) {
  const players = arena?.players || [];
  
  const embed = new EmbedBuilder()
    .setColor(MOBILE.colors.INFO)
    .setTitle('⏳ Waiting...')
    .setDescription(`
${MOBILE.separators.thin}

📋 Code: **\`${arena?.code || 'XXXX'}\`**

Share this code to invite friends!

${MOBILE.separators.thin}

👥 Players: ${players.length}/8
${players.map(p => `• ${p.username || 'Player'}`).join('\n') || '*Waiting...*'}

${MOBILE.separators.thin}

*Game starts when host is ready*
    `)
    .setFooter({ text: '🎮 Minimum 2 players to start' });

  const row = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('arena_refresh')
        .setLabel('🔄 Refresh')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('arena_leave')
        .setLabel('🚪 Leave')
        .setStyle(ButtonStyle.Danger)
    );

  return { embeds: [embed], components: [row] };
}

export default {
  createMobileArenaLobbyEmbed,
  createMobileArenaQuestionEmbed,
  createMobileArenaResultsEmbed,
  createMobileArenaJoinEmbed,
  createMobileArenaWaitingEmbed
};
