import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import Tournament from '../../database/models/Tournament.js';
import { User } from '../../database/models/User.js';
import { COLORS } from '../../config/colors.js';

export const data = new SlashCommandBuilder()
  .setName('tournament')
  .setDescription('Weekly tournament system')
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
      .setDescription('Tournament win leaderboard'));

export async function execute(interaction) {
  const subcommand = interaction.options.getSubcommand();

  if (subcommand === 'view') {
    const tournament = await Tournament.findOne({
      status: { $in: ['registration', 'active'] }
    }).sort({ createdAt: -1 });

    if (!tournament) {
      const embed = new EmbedBuilder()
        .setColor(COLORS.PRIMARY)
        .setTitle('🏆 No Active Tournament')
        .setDescription('There\'s no tournament running right now. Check back soon!')
        .setFooter({ text: 'Weekly tournaments start every Monday!' });
      return interaction.reply({ embeds: [embed] });
    }

    const embed = createTournamentEmbed(tournament);
    const row = createTournamentButtons(tournament, interaction.user.id);

    await interaction.reply({ embeds: [embed], components: [row] });

  } else if (subcommand === 'join') {
    const tournament = await Tournament.findOne({ status: 'registration' });

    if (!tournament) {
      return interaction.reply({
        content: '❌ No tournament is currently accepting registrations!',
        ephemeral: true
      });
    }

    const isRegistered = tournament.participants.some(
      p => p.discordId === interaction.user.id
    );

    if (isRegistered) {
      return interaction.reply({
        content: '✅ You are already registered for this tournament!',
        ephemeral: true
      });
    }

    if (tournament.participants.length >= tournament.settings.maxParticipants) {
      return interaction.reply({
        content: '❌ Tournament is full!',
        ephemeral: true
      });
    }

    tournament.participants.push({
      discordId: interaction.user.id,
      username: interaction.user.username
    });
    await tournament.save();

    const embed = new EmbedBuilder()
      .setColor(COLORS.SUCCESS)
      .setTitle('🏆 Tournament Registration Successful!')
      .setDescription(`
You have been registered for **${tournament.name}**!

📊 **Your Position:** #${tournament.participants.length}
👥 **Total Participants:** ${tournament.participants.length}/${tournament.settings.maxParticipants}
📅 **Starts:** ${tournament.settings.startTime ? `<t:${Math.floor(tournament.settings.startTime.getTime() / 1000)}:R>` : 'TBD'}

Good luck! 🍀
      `)
      .setFooter({ text: 'Practice with /quiz to prepare!' });

    await interaction.reply({ embeds: [embed] });

  } else if (subcommand === 'bracket') {
    const tournament = await Tournament.findOne({ status: 'active' });

    if (!tournament) {
      return interaction.reply({
        content: '❌ No active tournament with bracket!',
        ephemeral: true
      });
    }

    const bracketEmbed = createBracketEmbed(tournament);
    await interaction.reply({ embeds: [bracketEmbed] });

  } else if (subcommand === 'leaderboard') {
    const users = await User.find({ tournamentWins: { $gt: 0 } })
      .sort({ tournamentWins: -1 })
      .limit(10);
    
    const leaderboardText = users.length > 0
      ? users.map((u, i) => {
          const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`;
          return `${medal} **${u.username || 'Unknown'}** - ${u.tournamentWins} wins`;
        }).join('\n')
      : '*No tournament winners yet!*';

    const embed = new EmbedBuilder()
      .setColor(COLORS.XP_GOLD)
      .setTitle('🏆 Tournament Champions')
      .setDescription(leaderboardText)
      .setFooter({ text: 'Win tournaments to climb the ranks!' });

    await interaction.reply({ embeds: [embed] });
  }
}

function createTournamentEmbed(tournament) {
  const timeLeft = tournament.settings.registrationEnd 
    ? `<t:${Math.floor(tournament.settings.registrationEnd.getTime() / 1000)}:R>`
    : 'TBD';

  const startTime = tournament.settings.startTime
    ? `<t:${Math.floor(tournament.settings.startTime.getTime() / 1000)}:F>`
    : 'TBD';

  const participantBar = createParticipantBar(
    tournament.participants.length, 
    tournament.settings.maxParticipants
  );

  return new EmbedBuilder()
    .setColor(COLORS.XP_GOLD)
    .setAuthor({ name: '🏆 Weekly Tournament' })
    .setTitle(tournament.name)
    .setDescription(`
╔══════════════════════════════════════╗
║           TOURNAMENT INFO            ║
╚══════════════════════════════════════╝

📚 **Topic:** ${tournament.topic}
⚡ **Difficulty:** ${tournament.difficulty.toUpperCase()}
❓ **Questions per Match:** ${tournament.settings.questionsPerMatch}

╔══════════════════════════════════════╗
║              SCHEDULE                ║
╚══════════════════════════════════════╝

📝 **Registration Ends:** ${timeLeft}
🎮 **Tournament Starts:** ${startTime}

╔══════════════════════════════════════╗
║             PARTICIPANTS             ║
╚══════════════════════════════════════╝

👥 **Registered:** ${tournament.participants.length}/${tournament.settings.maxParticipants}
${participantBar}

╔══════════════════════════════════════╗
║               PRIZES                 ║
╚══════════════════════════════════════╝

🥇 **1st Place:** ${tournament.prizes.first.xp} XP + "${tournament.prizes.first.badge}" Badge
🥈 **2nd Place:** ${tournament.prizes.second.xp} XP + "${tournament.prizes.second.badge}" Badge
🥉 **3rd Place:** ${tournament.prizes.third.xp} XP
    `)
    .setFooter({ text: `Status: ${tournament.status.toUpperCase()}` })
    .setTimestamp();
}

function createParticipantBar(current, max) {
  const filled = Math.round((current / max) * 20);
  const empty = 20 - filled;
  return `\`[${'█'.repeat(filled)}${'░'.repeat(empty)}]\` ${Math.round((current/max)*100)}%`;
}

function createBracketEmbed(tournament) {
  let bracketText = '';
  const rounds = [...new Set(tournament.bracket.map(m => m.round))].sort();

  for (const round of rounds) {
    const roundMatches = tournament.bracket.filter(m => m.round === round);
    bracketText += `\n**━━━ Round ${round} ━━━**\n`;
    
    for (const match of roundMatches) {
      const p1 = match.player1?.username || 'TBD';
      const p2 = match.player2?.username || 'TBD';
      const p1Score = match.player1?.score ?? '-';
      const p2Score = match.player2?.score ?? '-';
      const status = match.status === 'completed' ? '✅' : match.status === 'active' ? '🔴' : '⏳';
      
      bracketText += `${status} \`${p1}\` [${p1Score}] vs [${p2Score}] \`${p2}\`\n`;
    }
  }

  return new EmbedBuilder()
    .setColor(COLORS.PRIMARY)
    .setTitle(`🏆 ${tournament.name} - Bracket`)
    .setDescription(bracketText || 'Bracket not generated yet.')
    .setFooter({ text: '✅ Completed | 🔴 Live | ⏳ Pending' });
}

function createTournamentButtons(tournament, oduserId) {
  const isRegistered = tournament.participants.some(p => p.discordId === oduserId);

  return new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('tournament_join')
        .setLabel(isRegistered ? '✅ Registered' : '📝 Join')
        .setStyle(isRegistered ? ButtonStyle.Success : ButtonStyle.Primary)
        .setDisabled(isRegistered || tournament.status !== 'registration'),
      new ButtonBuilder()
        .setCustomId('tournament_bracket')
        .setLabel('📊 Bracket')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(tournament.status === 'registration'),
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
