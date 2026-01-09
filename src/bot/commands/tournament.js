// src/bot/commands/tournament.js
// ═══════════════════════════════════════════════════════════════════
// ULTRA QUIZ SYSTEM - WEEKLY TOURNAMENT SYSTEM
// ═══════════════════════════════════════════════════════════════════

import { 
  SlashCommandBuilder, 
  EmbedBuilder, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle 
} from 'discord.js';
import Tournament from '../../database/models/Tournament.js';
import { User } from '../../database/models/User.js';
import { getOrCreateUser } from '../../services/gamificationService.js';
import {
  QUIZ_COLORS,
  QUIZ_EMOJIS,
  DIFFICULTY,
  QUIZ_TOPICS,
  ASCII_ART
} from '../../config/quizConfig.js';
import {
  createProgressBar,
  formatNumber,
  formatRelativeTime,
  getRankFromXP
} from '../../utils/quizUtils.js';

// ═══════════════════════════════════════════════════════════════════
// COMMAND DEFINITION
// ═══════════════════════════════════════════════════════════════════

export const data = new SlashCommandBuilder()
  .setName('tournament')
  .setDescription('🏆 Weekly tournament system')
  .addSubcommand(sub =>
    sub.setName('view')
      .setDescription('View current tournament'))
  .addSubcommand(sub =>
    sub.setName('join')
      .setDescription('Join the current tournament'))
  .addSubcommand(sub =>
    sub.setName('bracket')
      .setDescription('View tournament bracket'))
  .addSubcommand(sub =>
    sub.setName('leaderboard')
      .setDescription('Tournament win leaderboard'))
  .addSubcommand(sub =>
    sub.setName('history')
      .setDescription('View past tournaments'));

// ═══════════════════════════════════════════════════════════════════
// MAIN EXECUTE FUNCTION
// ═══════════════════════════════════════════════════════════════════

export async function execute(interaction) {
  const subcommand = interaction.options.getSubcommand();

  try {
    switch (subcommand) {
      case 'view':
        await showTournament(interaction);
        break;
      case 'join':
        await joinTournament(interaction);
        break;
      case 'bracket':
        await showBracket(interaction);
        break;
      case 'leaderboard':
        await showTournamentLeaderboard(interaction);
        break;
      case 'history':
        await showHistory(interaction);
        break;
    }
  } catch (error) {
    console.error('Tournament command error:', error);
    await interaction.reply({
      content: `${QUIZ_EMOJIS.INCORRECT} An error occurred. Please try again!`,
      ephemeral: true
    });
  }
}

// ═══════════════════════════════════════════════════════════════════
// VIEW TOURNAMENT
// ═══════════════════════════════════════════════════════════════════

async function showTournament(interaction) {
  const tournament = await Tournament.findOne({
    status: { $in: ['registration', 'active'] }
  }).sort({ createdAt: -1 });

  if (!tournament) {
    const embed = new EmbedBuilder()
      .setColor(QUIZ_COLORS.PRIMARY)
      .setTitle(`${QUIZ_EMOJIS.TROPHY} No Active Tournament`)
      .setDescription(`
${ASCII_ART.header.tournament}

There's no tournament running right now.

${ASCII_ART.dividerThin}

${QUIZ_EMOJIS.TIMER} **Next Tournament**
Weekly tournaments start every **Monday at 12:00 UTC**!

${QUIZ_EMOJIS.BOOK} **How It Works**
1. Register during the sign-up period
2. Compete in bracket-style matches
3. Win to advance through rounds
4. Top 3 earn XP rewards & badges!

${ASCII_ART.dividerThin}

*Check back soon!*
      `)
      .setFooter({ text: `${QUIZ_EMOJIS.LIGHTNING} MentorAI Tournament System` });

    return interaction.reply({ embeds: [embed] });
  }

  const embed = createTournamentEmbed(tournament, interaction.user.id);
  const row = createTournamentButtons(tournament, interaction.user.id);

  await interaction.reply({ embeds: [embed], components: [row] });
}

// ═══════════════════════════════════════════════════════════════════
// JOIN TOURNAMENT
// ═══════════════════════════════════════════════════════════════════

async function joinTournament(interaction) {
  await interaction.deferReply({ ephemeral: true });

  const tournament = await Tournament.findOne({ status: 'registration' });

  if (!tournament) {
    return interaction.editReply({
      content: `${QUIZ_EMOJIS.INCORRECT} No tournament is currently accepting registrations!`
    });
  }

  const isRegistered = tournament.participants.some(
    p => p.discordId === interaction.user.id
  );

  if (isRegistered) {
    return interaction.editReply({
      content: `${QUIZ_EMOJIS.CORRECT} You are already registered for **${tournament.name}**!`
    });
  }

  if (tournament.participants.length >= tournament.settings.maxParticipants) {
    return interaction.editReply({
      content: `${QUIZ_EMOJIS.INCORRECT} Tournament is full! (${tournament.settings.maxParticipants}/${tournament.settings.maxParticipants})`
    });
  }

  // Register user
  tournament.participants.push({
    discordId: interaction.user.id,
    username: interaction.user.username,
    joinedAt: new Date()
  });
  await tournament.save();

  const user = await getOrCreateUser(interaction.user.id, interaction.user.username);
  const rank = getRankFromXP(user.xp || 0);

  const successEmbed = new EmbedBuilder()
    .setColor(QUIZ_COLORS.SUCCESS)
    .setTitle(`${QUIZ_EMOJIS.TROPHY} Registration Successful!`)
    .setDescription(`
${ASCII_ART.header.tournament}

You have been registered for **${tournament.name}**!

${ASCII_ART.dividerThin}

${QUIZ_EMOJIS.CHART} **Your Entry**
\`\`\`
Position:     #${tournament.participants.length}
Rank:         ${rank.name} ${rank.emoji}
Level:        ${user.level || 1}
\`\`\`

${ASCII_ART.dividerThin}

👥 **Total Participants:** ${tournament.participants.length}/${tournament.settings.maxParticipants}
📅 **Starts:** ${tournament.settings.startTime ? `<t:${Math.floor(new Date(tournament.settings.startTime).getTime() / 1000)}:R>` : 'TBD'}

${ASCII_ART.dividerThin}

${QUIZ_EMOJIS.SPARKLES} Good luck! Practice with \`/quiz\` to prepare!
    `)
    .setFooter({ text: '🏆 MentorAI Tournament System' })
    .setTimestamp();

  await interaction.editReply({ embeds: [successEmbed] });
}

// ═══════════════════════════════════════════════════════════════════
// SHOW BRACKET
// ═══════════════════════════════════════════════════════════════════

async function showBracket(interaction) {
  const tournament = await Tournament.findOne({ 
    status: { $in: ['active', 'completed'] } 
  }).sort({ createdAt: -1 });

  if (!tournament) {
    return interaction.reply({
      content: `${QUIZ_EMOJIS.INCORRECT} No tournament bracket available!`,
      ephemeral: true
    });
  }

  const bracketEmbed = createBracketEmbed(tournament);
  
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('tournament_view')
      .setLabel('Tournament Info')
      .setEmoji('📋')
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId('tournament_refresh')
      .setLabel('Refresh')
      .setEmoji('🔄')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId('help_main')
      .setLabel('Menu')
      .setEmoji('🏠')
      .setStyle(ButtonStyle.Secondary)
  );

  await interaction.reply({ embeds: [bracketEmbed], components: [row] });
}

// ═══════════════════════════════════════════════════════════════════
// TOURNAMENT LEADERBOARD
// ═══════════════════════════════════════════════════════════════════

async function showTournamentLeaderboard(interaction) {
  await interaction.deferReply();

  const users = await User.find({ tournamentWins: { $gt: 0 } })
    .sort({ tournamentWins: -1 })
    .limit(15);

  const leaderboardEmbed = new EmbedBuilder()
    .setColor(QUIZ_COLORS.XP_GOLD)
    .setTitle(`${QUIZ_EMOJIS.TROPHY} Tournament Champions`)
    .setDescription(`
${ASCII_ART.header.tournament}

**All-Time Tournament Winners**

${ASCII_ART.dividerThin}

${users.length > 0 
  ? users.map((u, i) => {
      const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `\`#${i + 1}\``;
      const rank = getRankFromXP(u.xp || 0);
      return `${medal} ${rank.emoji} **${u.username || 'Unknown'}** • ${QUIZ_EMOJIS.TROPHY} ${u.tournamentWins} wins`;
    }).join('\n')
  : '*No tournament winners yet!*'
}

${ASCII_ART.dividerThin}

*Win tournaments to climb the ranks!*
    `)
    .setFooter({ text: '🏆 MentorAI Tournament System' })
    .setTimestamp();

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('tournament_view')
      .setLabel('Current Tournament')
      .setEmoji('📋')
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId('tournament_join')
      .setLabel('Join')
      .setEmoji('✍️')
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId('help_main')
      .setLabel('Menu')
      .setEmoji('🏠')
      .setStyle(ButtonStyle.Secondary)
  );

  await interaction.editReply({ embeds: [leaderboardEmbed], components: [row] });
}

// ═══════════════════════════════════════════════════════════════════
// TOURNAMENT HISTORY
// ═══════════════════════════════════════════════════════════════════

async function showHistory(interaction) {
  await interaction.deferReply();

  const tournaments = await Tournament.find({ status: 'completed' })
    .sort({ endedAt: -1 })
    .limit(5);

  const historyEmbed = new EmbedBuilder()
    .setColor(QUIZ_COLORS.PRIMARY)
    .setTitle(`${QUIZ_EMOJIS.BOOK} Tournament History`)
    .setDescription(`
${ASCII_ART.header.tournament}

**Recent Tournaments**

${ASCII_ART.dividerThin}

${tournaments.length > 0
  ? tournaments.map((t, i) => {
      const winner = t.bracket?.find(m => m.round === Math.max(...t.bracket.map(b => b.round)) && m.winner);
      const winnerName = winner?.winner?.username || 'Unknown';
      const date = t.endedAt ? formatRelativeTime(new Date(t.endedAt)) : 'N/A';
      return `**${i + 1}. ${t.name}**\n   👑 Winner: **${winnerName}**\n   📚 Topic: ${t.topic}\n   📅 ${date}`;
    }).join('\n\n')
  : '*No completed tournaments yet!*'
}

${ASCII_ART.dividerThin}

*More tournaments coming soon!*
    `)
    .setFooter({ text: '🏆 MentorAI Tournament System' })
    .setTimestamp();

  await interaction.editReply({ embeds: [historyEmbed] });
}

// ═══════════════════════════════════════════════════════════════════
// BUTTON HANDLER
// ═══════════════════════════════════════════════════════════════════

export async function handleButton(interaction, action, params) {
  try {
    switch (action) {
      case 'view':
        await showTournament(interaction);
        break;
      case 'join':
        await joinTournament(interaction);
        break;
      case 'bracket':
        await showBracket(interaction);
        break;
      case 'leaderboard':
        await showTournamentLeaderboard(interaction);
        break;
      case 'refresh':
        await handleRefresh(interaction);
        break;
      case 'participants':
        await showParticipants(interaction);
        break;
      case 'rules':
        await showRules(interaction);
        break;
    }
  } catch (error) {
    console.error('Tournament button handler error:', error);
    await interaction.reply({
      content: `${QUIZ_EMOJIS.INCORRECT} Something went wrong!`,
      ephemeral: true
    }).catch(() => {});
  }
}

// ═══════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════

async function handleRefresh(interaction) {
  await interaction.deferUpdate();
  const tournament = await Tournament.findOne({
    status: { $in: ['registration', 'active'] }
  }).sort({ createdAt: -1 });

  if (tournament) {
    const embed = createTournamentEmbed(tournament, interaction.user.id);
    const row = createTournamentButtons(tournament, interaction.user.id);
    await interaction.editReply({ embeds: [embed], components: [row] });
  }
}

async function showParticipants(interaction) {
  const tournament = await Tournament.findOne({
    status: { $in: ['registration', 'active'] }
  }).sort({ createdAt: -1 });

  if (!tournament) {
    return interaction.reply({
      content: `${QUIZ_EMOJIS.INCORRECT} No active tournament!`,
      ephemeral: true
    });
  }

  const participantList = tournament.participants.slice(0, 20).map((p, i) => {
    const emoji = i < 3 ? ['🥇', '🥈', '🥉'][i] : `\`${i + 1}.\``;
    return `${emoji} ${p.username}`;
  }).join('\n') || '*No participants yet*';

  const embed = new EmbedBuilder()
    .setColor(QUIZ_COLORS.PRIMARY)
    .setTitle(`👥 Tournament Participants`)
    .setDescription(`
**${tournament.name}**

${ASCII_ART.dividerThin}

${participantList}

${tournament.participants.length > 20 ? `\n*...and ${tournament.participants.length - 20} more*` : ''}

${ASCII_ART.dividerThin}

**Total:** ${tournament.participants.length}/${tournament.settings.maxParticipants}
    `)
    .setFooter({ text: 'Use /tournament join to participate!' });

  await interaction.reply({ embeds: [embed], ephemeral: true });
}

async function showRules(interaction) {
  const rulesEmbed = new EmbedBuilder()
    .setColor(QUIZ_COLORS.INFO)
    .setTitle(`📜 Tournament Rules`)
    .setDescription(`
${ASCII_ART.header.tournament}

**How Tournaments Work**

${ASCII_ART.dividerThin}

${QUIZ_EMOJIS.CHECK} **Registration**
• Sign up during the registration period
• First come, first served
• Maximum participants vary by tournament

${QUIZ_EMOJIS.SWORD} **Matches**
• Bracket-style elimination
• Answer questions faster to score more
• Wrong answers = damage to your HP
• First to 0 HP loses the match

${QUIZ_EMOJIS.TROPHY} **Prizes**
• 🥇 1st: 500 XP + Champion Badge
• 🥈 2nd: 250 XP + Finalist Badge  
• 🥉 3rd: 100 XP

${QUIZ_EMOJIS.LIGHTNING} **Tips**
• Practice with \`/quiz\` before matches
• Speed matters - answer quickly!
• Stay active during your scheduled matches

${ASCII_ART.dividerThin}

*Good luck, champion!* 🏆
    `)
    .setFooter({ text: 'MentorAI Tournament System' });

  await interaction.reply({ embeds: [rulesEmbed], ephemeral: true });
}

function createTournamentEmbed(tournament, userId) {
  const topicData = QUIZ_TOPICS[tournament.topic?.toLowerCase()] || { emoji: '📚', name: tournament.topic };
  const diffData = DIFFICULTY[tournament.difficulty] || DIFFICULTY.medium;
  
  const isRegistered = tournament.participants.some(p => p.discordId === userId);
  const participantBar = createProgressBar(
    tournament.participants.length, 
    tournament.settings.maxParticipants, 
    20
  );
  const fillPercent = Math.round((tournament.participants.length / tournament.settings.maxParticipants) * 100);

  const timeLeft = tournament.settings.registrationEnd 
    ? `<t:${Math.floor(new Date(tournament.settings.registrationEnd).getTime() / 1000)}:R>`
    : 'TBD';

  const startTime = tournament.settings.startTime
    ? `<t:${Math.floor(new Date(tournament.settings.startTime).getTime() / 1000)}:F>`
    : 'TBD';

  return new EmbedBuilder()
    .setColor(QUIZ_COLORS.XP_GOLD)
    .setTitle(`${QUIZ_EMOJIS.TROPHY} ${tournament.name}`)
    .setDescription(`
${ASCII_ART.header.tournament}

${isRegistered ? `${QUIZ_EMOJIS.CORRECT} **You are registered!**` : `${QUIZ_EMOJIS.ARROW_UP} **Join now to compete!**`}

${ASCII_ART.dividerThin}

**TOURNAMENT INFO**

\`\`\`
┌─────────────────────────────────┐
│ Topic:       ${(topicData.name || tournament.topic).slice(0, 18).padEnd(18)} │
│ Difficulty:  ${diffData.name.padEnd(18)} │
│ Questions:   ${String(tournament.settings.questionsPerMatch || 5).padEnd(18)} │
│ Status:      ${tournament.status.toUpperCase().padEnd(18)} │
└─────────────────────────────────┘
\`\`\`

${ASCII_ART.dividerThin}

**SCHEDULE**

📝 Registration Ends: ${timeLeft}
🎮 Tournament Starts: ${startTime}

${ASCII_ART.dividerThin}

**PARTICIPANTS**

\`[${participantBar}]\` **${fillPercent}%**
👥 **${tournament.participants.length}** / ${tournament.settings.maxParticipants} registered

${ASCII_ART.dividerThin}

**PRIZES**

${QUIZ_EMOJIS.RANK_1} **1st:** ${tournament.prizes?.first?.xp || 500} XP + "${tournament.prizes?.first?.badge || 'Champion'}" Badge
${QUIZ_EMOJIS.RANK_2} **2nd:** ${tournament.prizes?.second?.xp || 250} XP + "${tournament.prizes?.second?.badge || 'Finalist'}" Badge
${QUIZ_EMOJIS.RANK_3} **3rd:** ${tournament.prizes?.third?.xp || 100} XP
    `)
    .setFooter({ text: `${QUIZ_EMOJIS.LIGHTNING} MentorAI Tournament System` })
    .setTimestamp();
}

function createBracketEmbed(tournament) {
  let bracketText = '';
  
  if (!tournament.bracket || tournament.bracket.length === 0) {
    bracketText = '*Bracket will be generated when the tournament starts.*';
  } else {
    const rounds = [...new Set(tournament.bracket.map(m => m.round))].sort((a, b) => a - b);

    for (const round of rounds) {
      const roundMatches = tournament.bracket.filter(m => m.round === round);
      bracketText += `\n**━━━ Round ${round} ━━━**\n`;
      
      for (const match of roundMatches) {
        const p1 = match.player1?.username || 'TBD';
        const p2 = match.player2?.username || 'TBD';
        const p1Score = match.player1?.score ?? '-';
        const p2Score = match.player2?.score ?? '-';
        const status = match.status === 'completed' ? '✅' : match.status === 'active' ? '🔴' : '⏳';
        
        bracketText += `${status} \`${p1.slice(0, 12).padEnd(12)}\` [${p1Score}] vs [${p2Score}] \`${p2.slice(0, 12).padEnd(12)}\`\n`;
      }
    }
  }

  return new EmbedBuilder()
    .setColor(QUIZ_COLORS.PRIMARY)
    .setTitle(`${QUIZ_EMOJIS.TROPHY} ${tournament.name} - Bracket`)
    .setDescription(`
${ASCII_ART.header.tournament}

${bracketText}

${ASCII_ART.dividerThin}

**Legend:** ✅ Completed | 🔴 Live | ⏳ Pending
    `)
    .setFooter({ text: '🏆 MentorAI Tournament System' })
    .setTimestamp();
}

function createTournamentButtons(tournament, userId) {
  const isRegistered = tournament.participants.some(p => p.discordId === userId);

  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('tournament_join')
      .setLabel(isRegistered ? '✅ Registered' : '📝 Join')
      .setStyle(isRegistered ? ButtonStyle.Success : ButtonStyle.Primary)
      .setDisabled(isRegistered || tournament.status !== 'registration'),
    new ButtonBuilder()
      .setCustomId('tournament_bracket')
      .setLabel('📊 Bracket')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(tournament.status === 'registration' && !tournament.bracket?.length),
    new ButtonBuilder()
      .setCustomId('tournament_participants')
      .setLabel(`👥 ${tournament.participants.length}`)
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId('tournament_rules')
      .setLabel('📜 Rules')
      .setStyle(ButtonStyle.Secondary)
  );
}

export default { data, execute, handleButton };
