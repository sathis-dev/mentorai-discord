import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { User } from '../../database/models/User.js';
import { COLORS } from '../../config/colors.js';

// Prestige bonuses - permanent XP multipliers
const PRESTIGE_BONUSES = {
  1: { multiplier: 1.05, title: 'Bronze Scholar', icon: '🥉', requirement: 10000 },
  2: { multiplier: 1.10, title: 'Silver Scholar', icon: '🥈', requirement: 25000 },
  3: { multiplier: 1.15, title: 'Gold Scholar', icon: '🥇', requirement: 50000 },
  4: { multiplier: 1.20, title: 'Platinum Scholar', icon: '💎', requirement: 100000 },
  5: { multiplier: 1.25, title: 'Diamond Scholar', icon: '💠', requirement: 200000 },
  6: { multiplier: 1.30, title: 'Master Scholar', icon: '🔮', requirement: 400000 },
  7: { multiplier: 1.35, title: 'Grandmaster', icon: '👑', requirement: 750000 },
  8: { multiplier: 1.40, title: 'Legendary', icon: '⭐', requirement: 1500000 },
  9: { multiplier: 1.45, title: 'Mythic', icon: '🌟', requirement: 3000000 },
  10: { multiplier: 1.50, title: 'Transcendent', icon: '✨', requirement: 5000000 }
};

export const data = new SlashCommandBuilder()
  .setName('prestige')
  .setDescription('Reset your level for permanent XP bonuses')
  .addSubcommand(sub =>
    sub.setName('view')
      .setDescription('View your prestige status and available upgrades'))
  .addSubcommand(sub =>
    sub.setName('ascend')
      .setDescription('Prestige and gain permanent XP bonus'));

export async function execute(interaction) {
  const subcommand = interaction.options.getSubcommand();
  const userId = interaction.user.id;

  let user = await User.findOne({ discordId: userId });
  if (!user) {
    return interaction.reply({
      content: '❌ You need to use some learning commands first!',
      ephemeral: true
    });
  }

  // Initialize prestige data if not exists
  if (!user.prestige) {
    user.prestige = {
      level: 0,
      totalXpEarned: user.xp || 0,
      bonusMultiplier: 1.0,
      prestigeHistory: []
    };
    await user.save();
  }

  const currentPrestige = user.prestige.level;
  const totalXp = user.prestige.totalXpEarned;
  const nextPrestige = PRESTIGE_BONUSES[currentPrestige + 1];

  if (subcommand === 'view') {
    const currentBonus = PRESTIGE_BONUSES[currentPrestige];
    const multiplier = currentBonus ? currentBonus.multiplier : 1.0;
    
    const embed = new EmbedBuilder()
      .setColor(getPrestigeColor(currentPrestige))
      .setTitle('⭐ Prestige System')
      .setThumbnail(interaction.user.displayAvatarURL())
      .setDescription(`
╔══════════════════════════════════════╗
║       YOUR PRESTIGE STATUS           ║
╚══════════════════════════════════════╝

${currentPrestige > 0 ? `${currentBonus.icon} **${currentBonus.title}**` : '🆕 **Novice**'}
**Prestige Level:** ${currentPrestige}
**XP Multiplier:** ${(multiplier * 100 - 100).toFixed(0)}% bonus

╔══════════════════════════════════════╗
║           PROGRESS                   ║
╚══════════════════════════════════════╝

📊 **Total XP Earned:** ${totalXp.toLocaleString()}
📈 **Current XP:** ${user.xp?.toLocaleString() || 0}
📚 **Current Level:** ${user.level || 1}

${nextPrestige ? `
╔══════════════════════════════════════╗
║         NEXT PRESTIGE                ║
╚══════════════════════════════════════╝

${nextPrestige.icon} **${nextPrestige.title}**
📋 **Requirement:** ${nextPrestige.requirement.toLocaleString()} total XP
📈 **Bonus:** +${((nextPrestige.multiplier - 1) * 100).toFixed(0)}% XP

${createProgressBar(totalXp, nextPrestige.requirement)}
${totalXp.toLocaleString()} / ${nextPrestige.requirement.toLocaleString()} XP
` : '🎉 **MAX PRESTIGE REACHED!**'}
      `);

    // Add prestige tiers preview
    const tierPreview = Object.entries(PRESTIGE_BONUSES)
      .slice(0, 5)
      .map(([level, data]) => {
        const achieved = currentPrestige >= parseInt(level);
        return `${achieved ? '✅' : '⬜'} ${data.icon} P${level}: ${data.title} (+${((data.multiplier - 1) * 100).toFixed(0)}%)`;
      })
      .join('\n');

    embed.addFields({
      name: '🏆 Prestige Tiers',
      value: `\`\`\`\n${tierPreview}\`\`\``
    });

    const row = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('prestige_ascend_confirm')
          .setLabel('⬆️ Prestige Now')
          .setStyle(ButtonStyle.Primary)
          .setDisabled(!nextPrestige || totalXp < nextPrestige.requirement),
        new ButtonBuilder()
          .setCustomId('prestige_all_tiers')
          .setLabel('📜 All Tiers')
          .setStyle(ButtonStyle.Secondary)
      );

    await interaction.reply({ embeds: [embed], components: [row] });

  } else if (subcommand === 'ascend') {
    if (!nextPrestige) {
      return interaction.reply({
        content: '✨ You\'ve already reached the maximum prestige level! You are truly transcendent!',
        ephemeral: true
      });
    }

    if (totalXp < nextPrestige.requirement) {
      const needed = nextPrestige.requirement - totalXp;
      return interaction.reply({
        content: `❌ You need **${needed.toLocaleString()}** more total XP to prestige!\n\nCurrent: ${totalXp.toLocaleString()} / ${nextPrestige.requirement.toLocaleString()}`,
        ephemeral: true
      });
    }

    // Show confirmation
    const embed = new EmbedBuilder()
      .setColor(COLORS.WARNING)
      .setTitle('⚠️ Confirm Prestige')
      .setDescription(`
Are you sure you want to prestige?

**What you'll gain:**
${nextPrestige.icon} **${nextPrestige.title}** title
📈 **+${((nextPrestige.multiplier - 1) * 100).toFixed(0)}%** permanent XP bonus

**What will reset:**
📊 Your level will reset to **1**
💫 Your current XP will reset to **0**

*Your total XP earned, achievements, and progress are preserved!*
      `)
      .setFooter({ text: 'This action cannot be undone!' });

    const row = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId(`prestige_confirm_${currentPrestige + 1}`)
          .setLabel('✅ Confirm Prestige')
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId('prestige_cancel')
          .setLabel('❌ Cancel')
          .setStyle(ButtonStyle.Danger)
      );

    await interaction.reply({ embeds: [embed], components: [row] });
  }
}

function createProgressBar(current, max) {
  const percentage = Math.min(current / max, 1);
  const filled = Math.floor(percentage * 20);
  const empty = 20 - filled;
  return `\`[${'█'.repeat(filled)}${'░'.repeat(empty)}]\` ${Math.floor(percentage * 100)}%`;
}

function getPrestigeColor(level) {
  const colors = {
    0: COLORS.INFO,
    1: 0xCD7F32, // Bronze
    2: 0xC0C0C0, // Silver
    3: 0xFFD700, // Gold
    4: 0xE5E4E2, // Platinum
    5: 0xB9F2FF, // Diamond
    6: 0x9400D3, // Master Purple
    7: 0xFFAA00, // Grandmaster
    8: 0xFF6B6B, // Legendary
    9: 0xFF69B4, // Mythic Pink
    10: 0xFFFFFF // Transcendent White
  };
  return colors[level] || COLORS.PRIMARY;
}

// Export for use in gamification service
export { PRESTIGE_BONUSES };
