import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import SeasonalEvent from '../../database/models/SeasonalEvent.js';
import { User } from '../../database/models/User.js';
import { COLORS } from '../../config/colors.js';

// Seasonal event templates
const EVENT_TEMPLATES = {
  winter: {
    name: 'Winter Wonderland',
    icon: '❄️',
    theme: 0x87CEEB,
    rewards: ['Snowflake Badge', 'Winter Theme', 'Frost Title']
  },
  spring: {
    name: 'Spring Learning Festival',
    icon: '🌸',
    theme: 0xFFB7C5,
    rewards: ['Blossom Badge', 'Spring Theme', 'Growth Title']
  },
  summer: {
    name: 'Summer Code Camp',
    icon: '☀️',
    theme: 0xFFD700,
    rewards: ['Sunshine Badge', 'Summer Theme', 'Champion Title']
  },
  fall: {
    name: 'Autumn Harvest',
    icon: '🍂',
    theme: 0xFF8C00,
    rewards: ['Harvest Badge', 'Autumn Theme', 'Scholar Title']
  },
  halloween: {
    name: 'Spooky Code Night',
    icon: '🎃',
    theme: 0xFF6600,
    rewards: ['Pumpkin Badge', 'Spooky Theme', 'Phantom Coder Title']
  },
  holiday: {
    name: 'Holiday Hackathon',
    icon: '🎄',
    theme: 0x228B22,
    rewards: ['Holiday Badge', 'Festive Theme', 'Gift Giver Title']
  }
};

export const data = new SlashCommandBuilder()
  .setName('event')
  .setDescription('Seasonal events and limited-time challenges!')
  .addSubcommand(sub =>
    sub.setName('current')
      .setDescription('View the current seasonal event'))
  .addSubcommand(sub =>
    sub.setName('progress')
      .setDescription('Check your event progress'))
  .addSubcommand(sub =>
    sub.setName('rewards')
      .setDescription('View event rewards'))
  .addSubcommand(sub =>
    sub.setName('leaderboard')
      .setDescription('Event leaderboard'));

export async function execute(interaction) {
  const subcommand = interaction.options.getSubcommand();
  const userId = interaction.user.id;

  // Find active event
  const now = new Date();
  let activeEvent = await SeasonalEvent.findOne({
    startDate: { $lte: now },
    endDate: { $gt: now },
    active: true
  });

  if (subcommand === 'current') {
    if (!activeEvent) {
      // Check if there's an upcoming event
      const upcomingEvent = await SeasonalEvent.findOne({
        startDate: { $gt: now },
        active: true
      }).sort({ startDate: 1 });

      const embed = new EmbedBuilder()
        .setColor(COLORS.INFO)
        .setTitle('🎪 Seasonal Events')
        .setDescription(upcomingEvent ? `
No active event right now!

**Coming Soon:**
${getEventTemplate(upcomingEvent.type).icon} **${upcomingEvent.name}**
Starts: <t:${Math.floor(upcomingEvent.startDate.getTime() / 1000)}:R>

Check back later for exclusive rewards!
        ` : `
No events are currently active.

Stay tuned for upcoming seasonal events with:
🎁 Exclusive rewards
🏆 Limited-time challenges
✨ Special themes and badges
        `);

      return interaction.reply({ embeds: [embed] });
    }

    const template = getEventTemplate(activeEvent.type);
    const userProgress = activeEvent.participants.find(p => p.discordId === userId);
    const totalParticipants = activeEvent.participants.length;
    const daysLeft = Math.ceil((activeEvent.endDate - now) / (1000 * 60 * 60 * 24));

    const embed = new EmbedBuilder()
      .setColor(template.theme)
      .setTitle(`${template.icon} ${activeEvent.name}`)
      .setDescription(`
╔══════════════════════════════════════╗
║           SEASONAL EVENT             ║
╚══════════════════════════════════════╝

${activeEvent.description}

**Duration:** ${activeEvent.startDate.toLocaleDateString()} - ${activeEvent.endDate.toLocaleDateString()}
**Time Left:** ${daysLeft} days (<t:${Math.floor(activeEvent.endDate.getTime() / 1000)}:R>)

═══════════════════════════════════════

${userProgress ? `
**📊 Your Progress**
Points: ${userProgress.points.toLocaleString()}
Rank: #${calculateRank(activeEvent.participants, userId)}
Challenges: ${userProgress.challengesCompleted}/${activeEvent.challenges.length}
` : `
⚠️ You haven't joined this event yet!
Click the button below to participate!
`}
      `)
      .addFields(
        { name: '👥 Participants', value: `${totalParticipants.toLocaleString()}`, inline: true },
        { name: '🎯 Challenges', value: `${activeEvent.challenges.length}`, inline: true },
        { name: '🎁 Rewards', value: `${activeEvent.rewards.length}`, inline: true }
      );

    // Add challenges preview
    const challengesList = activeEvent.challenges.slice(0, 3).map((c, i) => {
      const completed = userProgress?.completedChallenges?.includes(c.id);
      return `${completed ? '✅' : '⬜'} ${c.name} (+${c.points} pts)`;
    }).join('\n');

    embed.addFields({
      name: '📋 Featured Challenges',
      value: challengesList || 'Complete challenges to earn event points!'
    });

    const row = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('event_join')
          .setLabel(userProgress ? '✅ Participating' : '🎪 Join Event')
          .setStyle(userProgress ? ButtonStyle.Success : ButtonStyle.Primary)
          .setDisabled(!!userProgress),
        new ButtonBuilder()
          .setCustomId('event_challenges')
          .setLabel('📋 All Challenges')
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId('event_rewards')
          .setLabel('🎁 Rewards')
          .setStyle(ButtonStyle.Secondary)
      );

    await interaction.reply({ embeds: [embed], components: [row] });

  } else if (subcommand === 'progress') {
    if (!activeEvent) {
      return interaction.reply({
        content: '🎪 No active event right now! Check back later.',
        ephemeral: true
      });
    }

    const userProgress = activeEvent.participants.find(p => p.discordId === userId);
    if (!userProgress) {
      return interaction.reply({
        content: '❌ You haven\'t joined this event! Use `/event current` to join.',
        ephemeral: true
      });
    }

    const template = getEventTemplate(activeEvent.type);
    const rank = calculateRank(activeEvent.participants, userId);

    // Calculate progress toward next reward tier
    const rewardTiers = [100, 500, 1000, 2500, 5000, 10000];
    const currentTier = rewardTiers.filter(t => userProgress.points >= t).length;
    const nextTier = rewardTiers[currentTier];
    const tierProgress = nextTier ? (userProgress.points / nextTier) : 1;

    const embed = new EmbedBuilder()
      .setColor(template.theme)
      .setTitle(`${template.icon} Your Event Progress`)
      .setThumbnail(interaction.user.displayAvatarURL())
      .setDescription(`
**${activeEvent.name}**

╔══════════════════════════════════════╗
║           YOUR STATS                 ║
╚══════════════════════════════════════╝

📊 **Points:** ${userProgress.points.toLocaleString()}
🏆 **Rank:** #${rank}
🎯 **Challenges:** ${userProgress.challengesCompleted}/${activeEvent.challenges.length}

╔══════════════════════════════════════╗
║         REWARD PROGRESS              ║
╚══════════════════════════════════════╝

${createProgressBar(tierProgress)} ${Math.round(tierProgress * 100)}%
${nextTier ? `Next reward at ${nextTier} points` : '🎉 All tiers unlocked!'}

**Unlocked Rewards:**
${userProgress.rewards?.map(r => `✅ ${r}`).join('\n') || 'Complete challenges to unlock rewards!'}
      `);

    // Show challenge progress
    const challengeProgress = activeEvent.challenges.map(c => {
      const completed = userProgress.completedChallenges?.includes(c.id);
      return `${completed ? '✅' : '⬜'} **${c.name}**\n└─ ${c.description} (+${c.points} pts)`;
    }).join('\n\n');

    if (challengeProgress) {
      embed.addFields({
        name: '📋 Challenges',
        value: challengeProgress.slice(0, 1000)
      });
    }

    await interaction.reply({ embeds: [embed] });

  } else if (subcommand === 'rewards') {
    if (!activeEvent) {
      return interaction.reply({
        content: '🎪 No active event right now!',
        ephemeral: true
      });
    }

    const template = getEventTemplate(activeEvent.type);
    const userProgress = activeEvent.participants.find(p => p.discordId === userId);
    const userPoints = userProgress?.points || 0;

    const rewardList = activeEvent.rewards.map(r => {
      const earned = userPoints >= r.pointsRequired;
      const status = earned ? '✅' : '🔒';
      return `${status} **${r.name}** (${r.pointsRequired} pts)\n└─ ${r.description}`;
    }).join('\n\n');

    const embed = new EmbedBuilder()
      .setColor(template.theme)
      .setTitle(`🎁 ${activeEvent.name} Rewards`)
      .setDescription(`
Your Points: **${userPoints.toLocaleString()}**

${rewardList || 'No rewards configured for this event.'}

═══════════════════════════════════════

**Exclusive Rewards:**
${template.rewards.map(r => `✨ ${r}`).join('\n')}

*These rewards are only available during this event!*
      `);

    await interaction.reply({ embeds: [embed] });

  } else if (subcommand === 'leaderboard') {
    if (!activeEvent) {
      return interaction.reply({
        content: '🎪 No active event right now!',
        ephemeral: true
      });
    }

    const template = getEventTemplate(activeEvent.type);
    const sorted = [...activeEvent.participants].sort((a, b) => b.points - a.points);
    const top10 = sorted.slice(0, 10);

    const leaderboard = await Promise.all(
      top10.map(async (p, i) => {
        try {
          const user = await interaction.client.users.fetch(p.discordId);
          const medal = ['🥇', '🥈', '🥉'][i] || `\`${(i + 1).toString().padStart(2)}\``;
          const isYou = p.discordId === userId;
          return `${medal} ${isYou ? '**' : ''}${user.username}${isYou ? ' ◀️**' : ''} - ${p.points.toLocaleString()} pts`;
        } catch {
          return null;
        }
      })
    );

    // Get user's rank if not in top 10
    const userRank = calculateRank(activeEvent.participants, userId);
    const userProgress = activeEvent.participants.find(p => p.discordId === userId);

    const embed = new EmbedBuilder()
      .setColor(template.theme)
      .setTitle(`🏆 ${activeEvent.name} Leaderboard`)
      .setDescription(`
${leaderboard.filter(Boolean).join('\n')}

${userRank > 10 && userProgress ? `
═══════════════════════════════════════
**Your Rank:** #${userRank} with ${userProgress.points.toLocaleString()} points
` : ''}
      `)
      .setFooter({ text: `${activeEvent.participants.length} participants` });

    await interaction.reply({ embeds: [embed] });
  }
}

function getEventTemplate(type) {
  return EVENT_TEMPLATES[type] || EVENT_TEMPLATES.summer;
}

function calculateRank(participants, discordId) {
  const sorted = [...participants].sort((a, b) => b.points - a.points);
  const index = sorted.findIndex(p => p.discordId === discordId);
  return index >= 0 ? index + 1 : participants.length + 1;
}

function createProgressBar(percentage) {
  const filled = Math.floor(percentage * 20);
  const empty = 20 - filled;
  return `\`[${'█'.repeat(filled)}${'░'.repeat(empty)}]\``;
}
