import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import TeamBattle from '../../database/models/TeamBattle.js';
import { User } from '../../database/models/User.js';
import { COLORS } from '../../config/colors.js';

export const data = new SlashCommandBuilder()
  .setName('teambattle')
  .setDescription('Server vs Server team battles!')
  .addSubcommand(sub =>
    sub.setName('status')
      .setDescription('View current team battle status'))
  .addSubcommand(sub =>
    sub.setName('join')
      .setDescription('Join your server\'s team'))
  .addSubcommand(sub =>
    sub.setName('contribute')
      .setDescription('Contribute XP to your team'))
  .addSubcommand(sub =>
    sub.setName('leaderboard')
      .setDescription('View server rankings'))
  .addSubcommand(sub =>
    sub.setName('history')
      .setDescription('View past battle results'));

export async function execute(interaction) {
  const subcommand = interaction.options.getSubcommand();
  const userId = interaction.user.id;
  const guildId = interaction.guildId;

  if (!guildId) {
    return interaction.reply({
      content: '❌ Team battles are only available in servers!',
      ephemeral: true
    });
  }

  // Get current week's battle
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setHours(0, 0, 0, 0);
  weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // Start of week (Sunday)
  
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 7);

  let currentBattle = await TeamBattle.findOne({
    startDate: { $lte: now },
    endDate: { $gt: now },
    status: 'active'
  });

  if (subcommand === 'status') {
    if (!currentBattle) {
      // Create a new battle if none exists
      currentBattle = await TeamBattle.create({
        startDate: weekStart,
        endDate: weekEnd,
        teams: [],
        status: 'active'
      });
    }

    // Get this server's team
    const serverTeam = currentBattle.teams.find(t => t.serverId === guildId);
    const sortedTeams = [...currentBattle.teams].sort((a, b) => b.totalXp - a.totalXp);
    const serverRank = sortedTeams.findIndex(t => t.serverId === guildId) + 1;

    const embed = new EmbedBuilder()
      .setColor(COLORS.PRIMARY)
      .setTitle('⚔️ Weekly Team Battle')
      .setDescription(`
╔══════════════════════════════════════╗
║          BATTLE STATUS               ║
╚══════════════════════════════════════╝

**Week:** ${weekStart.toLocaleDateString()} - ${weekEnd.toLocaleDateString()}
**Ends:** <t:${Math.floor(weekEnd.getTime() / 1000)}:R>

${serverTeam ? `
╔══════════════════════════════════════╗
║          YOUR SERVER                 ║
╚══════════════════════════════════════╝

🏰 **${interaction.guild.name}**
📊 **Rank:** #${serverRank || 'Unranked'}
⭐ **Total XP:** ${serverTeam.totalXp.toLocaleString()}
👥 **Members:** ${serverTeam.members.length}
🔥 **Streak:** ${serverTeam.winStreak || 0} weeks

${createRankBar(serverRank, sortedTeams.length)}
` : `
⚠️ Your server hasn't joined this week's battle yet!
Use \`/teambattle join\` to participate!
`}
      `);

    // Add top 5 servers
    if (sortedTeams.length > 0) {
      const top5 = sortedTeams.slice(0, 5).map((team, i) => {
        const medal = ['🥇', '🥈', '🥉'][i] || `${i + 1}.`;
        const isCurrentServer = team.serverId === guildId;
        return `${medal} ${isCurrentServer ? '**' : ''}${team.serverName.slice(0, 20)}${isCurrentServer ? '**' : ''} - ${team.totalXp.toLocaleString()} XP`;
      }).join('\n');

      embed.addFields({
        name: '🏆 Top Servers',
        value: top5 || 'No participants yet!'
      });
    }

    // Rewards info
    embed.addFields({
      name: '🎁 Weekly Rewards',
      value: '🥇 1st: 5000 XP + Exclusive Badge\n🥈 2nd: 3000 XP\n🥉 3rd: 1500 XP\nTop 10: 500 XP'
    });

    const row = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('teambattle_join')
          .setLabel(serverTeam ? '✅ Joined' : '⚔️ Join Battle')
          .setStyle(serverTeam ? ButtonStyle.Success : ButtonStyle.Primary)
          .setDisabled(!!serverTeam),
        new ButtonBuilder()
          .setCustomId('teambattle_contribute')
          .setLabel('📊 Contribute XP')
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(!serverTeam),
        new ButtonBuilder()
          .setCustomId('teambattle_leaderboard')
          .setLabel('🏆 Full Rankings')
          .setStyle(ButtonStyle.Secondary)
      );

    await interaction.reply({ embeds: [embed], components: [row] });

  } else if (subcommand === 'join') {
    if (!currentBattle) {
      return interaction.reply({
        content: '❌ No active battle this week!',
        ephemeral: true
      });
    }

    const existingTeam = currentBattle.teams.find(t => t.serverId === guildId);
    if (existingTeam) {
      // Add user to team if not already a member
      if (!existingTeam.members.find(m => m.discordId === userId)) {
        await TeamBattle.updateOne(
          { _id: currentBattle._id, 'teams.serverId': guildId },
          { 
            $push: { 
              'teams.$.members': { 
                discordId: userId, 
                xpContributed: 0,
                joinedAt: new Date()
              } 
            } 
          }
        );

        return interaction.reply({
          content: `✅ You've joined **${interaction.guild.name}**'s team! Use \`/teambattle contribute\` to earn XP for your server!`,
          ephemeral: true
        });
      }

      return interaction.reply({
        content: '✅ You\'re already on your server\'s team!',
        ephemeral: true
      });
    }

    // Create new team for this server
    await TeamBattle.updateOne(
      { _id: currentBattle._id },
      { 
        $push: { 
          teams: {
            serverId: guildId,
            serverName: interaction.guild.name,
            totalXp: 0,
            members: [{
              discordId: userId,
              xpContributed: 0,
              joinedAt: new Date()
            }]
          }
        }
      }
    );

    const embed = new EmbedBuilder()
      .setColor(COLORS.SUCCESS)
      .setTitle('⚔️ Team Registered!')
      .setDescription(`
**${interaction.guild.name}** has joined the battle!

Your server is now competing against other servers this week.
Every quiz, lesson, and activity contributes XP to your team!

**How to win:**
📚 Complete lessons and quizzes
🏆 Earn achievements
🔥 Maintain streaks
👥 Get more server members to join!
      `)
      .setFooter({ text: 'Battle ends ' + weekEnd.toLocaleDateString() });

    await interaction.reply({ embeds: [embed] });

  } else if (subcommand === 'contribute') {
    if (!currentBattle) {
      return interaction.reply({
        content: '❌ No active battle this week!',
        ephemeral: true
      });
    }

    const serverTeam = currentBattle.teams.find(t => t.serverId === guildId);
    if (!serverTeam) {
      return interaction.reply({
        content: '❌ Your server hasn\'t joined yet! Use `/teambattle join` first.',
        ephemeral: true
      });
    }

    const user = await User.findOne({ discordId: userId });
    const userXp = user?.xp || 0;
    
    const member = serverTeam.members.find(m => m.discordId === userId);
    const contributed = member?.xpContributed || 0;

    const embed = new EmbedBuilder()
      .setColor(COLORS.PRIMARY)
      .setTitle('📊 Your Contribution')
      .setDescription(`
**Your XP:** ${userXp.toLocaleString()}
**Contributed:** ${contributed.toLocaleString()} XP

╔══════════════════════════════════════╗
║       HOW TO CONTRIBUTE              ║
╚══════════════════════════════════════╝

Your XP earnings automatically count toward your team!
Activities that help your server:

📚 \`/learn\` - Earn lesson XP
❓ \`/quiz\` - Complete quizzes
🎯 \`/dailychallenge\` - Daily challenges
🏆 \`/achievements\` - Unlock achievements
🔥 \`/streak\` - Maintain daily streak

**Tip:** The more you learn, the more you help your team!
      `)
      .addFields(
        { name: '🏰 Server Total', value: `${serverTeam.totalXp.toLocaleString()} XP`, inline: true },
        { name: '👥 Team Size', value: `${serverTeam.members.length} members`, inline: true }
      );

    await interaction.reply({ embeds: [embed] });

  } else if (subcommand === 'leaderboard') {
    if (!currentBattle || currentBattle.teams.length === 0) {
      return interaction.reply({
        content: '📊 No teams have joined this week\'s battle yet!',
        ephemeral: true
      });
    }

    const sortedTeams = [...currentBattle.teams].sort((a, b) => b.totalXp - a.totalXp);
    
    const leaderboard = sortedTeams.slice(0, 15).map((team, i) => {
      const medal = ['🥇', '🥈', '🥉'][i] || `\`${(i + 1).toString().padStart(2)}\``;
      const isCurrentServer = team.serverId === guildId;
      const name = team.serverName.slice(0, 25);
      return `${medal} ${isCurrentServer ? '**' : ''}${name}${isCurrentServer ? ' ◀️**' : ''}\n└─ ${team.totalXp.toLocaleString()} XP | ${team.members.length} members`;
    }).join('\n\n');

    const embed = new EmbedBuilder()
      .setColor(COLORS.PRIMARY)
      .setTitle('🏆 Team Battle Leaderboard')
      .setDescription(`
**Week of ${weekStart.toLocaleDateString()}**

${leaderboard}
      `)
      .setFooter({ text: `${sortedTeams.length} servers competing` });

    await interaction.reply({ embeds: [embed] });

  } else if (subcommand === 'history') {
    const pastBattles = await TeamBattle.find({ 
      status: 'completed',
      'teams.serverId': guildId
    })
    .sort({ endDate: -1 })
    .limit(5);

    if (pastBattles.length === 0) {
      return interaction.reply({
        content: '📜 No battle history yet! Compete this week to start building your legacy.',
        ephemeral: true
      });
    }

    const history = pastBattles.map(battle => {
      const serverTeam = battle.teams.find(t => t.serverId === guildId);
      const sortedTeams = [...battle.teams].sort((a, b) => b.totalXp - a.totalXp);
      const rank = sortedTeams.findIndex(t => t.serverId === guildId) + 1;
      const medal = ['🥇', '🥈', '🥉'][rank - 1] || `#${rank}`;
      const weekStr = new Date(battle.startDate).toLocaleDateString();
      
      return `${medal} **${weekStr}**\n└─ ${serverTeam.totalXp.toLocaleString()} XP | Rank ${rank}/${battle.teams.length}`;
    }).join('\n\n');

    const embed = new EmbedBuilder()
      .setColor(COLORS.PRIMARY)
      .setTitle('📜 Battle History')
      .setDescription(`
**${interaction.guild.name}**

${history}
      `)
      .setFooter({ text: 'Last 5 battles shown' });

    await interaction.reply({ embeds: [embed] });
  }
}

function createRankBar(rank, total) {
  if (!rank || total === 0) return '';
  const position = Math.max(0, Math.min(1, (total - rank) / total));
  const filled = Math.floor(position * 20);
  const empty = 20 - filled;
  return `Position: \`[${'█'.repeat(filled)}${'░'.repeat(empty)}]\` Top ${Math.round((rank / total) * 100)}%`;
}
