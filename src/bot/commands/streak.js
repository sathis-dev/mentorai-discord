import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { getOrCreateUser } from '../../services/gamificationService.js';

// ═══════════════════════════════════════════════════════════════════════════════
//  🔥 V4 DESIGN SYSTEM - PREMIUM STREAK TRACKER
//  Beautiful flame visualization with milestone progress
// ═══════════════════════════════════════════════════════════════════════════════

export const data = new SlashCommandBuilder()
  .setName('streak')
  .setDescription('🔥 View your learning streak and flame status');

// ═══════════════════════════════════════════════════════════
// 🔥 STREAK TIER SYSTEM
// ═══════════════════════════════════════════════════════════
const STREAK_TIERS = {
  legendary: { name: 'LEGENDARY FLAME', emoji: '👑', color: 0xFF6B35, minDays: 100, multiplier: '2.0x' },
  inferno: { name: 'INFERNO', emoji: '🌋', color: 0xE74C3C, minDays: 60, multiplier: '1.75x' },
  blazing: { name: 'BLAZING', emoji: '🔥', color: 0xFF9500, minDays: 30, multiplier: '1.5x' },
  burning: { name: 'BURNING', emoji: '🔥', color: 0xFFA500, minDays: 14, multiplier: '1.35x' },
  hot: { name: 'HOT', emoji: '🔥', color: 0xFFB84D, minDays: 7, multiplier: '1.25x' },
  warm: { name: 'WARMING UP', emoji: '✨', color: 0xFFD700, minDays: 3, multiplier: '1.1x' },
  spark: { name: 'SPARK', emoji: '💫', color: 0x9B9B9B, minDays: 1, multiplier: '1.0x' },
  cold: { name: 'COLD', emoji: '❄️', color: 0x5DADE2, minDays: 0, multiplier: '0.5x' }
};

function getStreakTier(streak) {
  if (streak >= 100) return STREAK_TIERS.legendary;
  if (streak >= 60) return STREAK_TIERS.inferno;
  if (streak >= 30) return STREAK_TIERS.blazing;
  if (streak >= 14) return STREAK_TIERS.burning;
  if (streak >= 7) return STREAK_TIERS.hot;
  if (streak >= 3) return STREAK_TIERS.warm;
  if (streak >= 1) return STREAK_TIERS.spark;
  return STREAK_TIERS.cold;
}

// ═══════════════════════════════════════════════════════════
// 🎨 VISUAL COMPONENTS
// ═══════════════════════════════════════════════════════════

function createFlameVisualization(streak) {
  const tier = getStreakTier(streak);
  
  if (streak === 0) {
    return `\`\`\`
❄️  NO ACTIVE STREAK  ❄️

Use /daily to ignite your flame!
\`\`\``;
  }
  
  // Create flame intensity based on streak
  const flameCount = Math.min(streak, 7);
  const flames = '🔥'.repeat(flameCount);
  
  let tierName;
  let flameDisplay;
  if (streak >= 100) {
    tierName = '👑 LEGENDARY 👑';
    flameDisplay = '🔥🔥🔥🔥🔥🔥🔥';
  } else if (streak >= 30) {
    tierName = '🔥 BLAZING 🔥';
    flameDisplay = flames;
  } else if (streak >= 7) {
    tierName = '🔥 HOT 🔥';
    flameDisplay = flames;
  } else {
    tierName = '✨ SPARK ✨';
    flameDisplay = flames || '💫';
  }

  return `\`\`\`
${tierName}
${flameDisplay}
──────────────────────────
Streak: ${streak} days
Bonus: ${tier.multiplier} XP
\`\`\``;
}

function createMilestoneProgress(streak) {
  const milestones = [
    { days: 3, name: 'Beginner', emoji: '🌱', reward: '+10% XP' },
    { days: 7, name: 'Week Warrior', emoji: '⚔️', reward: '+25% XP' },
    { days: 14, name: 'Dedicated', emoji: '💪', reward: '+35% XP' },
    { days: 30, name: 'Monthly Master', emoji: '🏆', reward: '+50% XP' },
    { days: 60, name: 'Champion', emoji: '👑', reward: '+75% XP' },
    { days: 100, name: 'Legend', emoji: '🌟', reward: '+100% XP' }
  ];
  
  let display = '';
  for (const m of milestones) {
    const completed = streak >= m.days;
    const current = !completed && streak < m.days && (milestones.findIndex(x => x.days === m.days) === 0 || streak >= milestones[milestones.findIndex(x => x.days === m.days) - 1]?.days);
    
    if (completed) {
      display += `✅ **${m.emoji} ${m.name}** — ${m.days} days (${m.reward})\n`;
    } else {
      const daysLeft = m.days - streak;
      display += `⬜ ${m.emoji} ${m.name} — ${daysLeft} days to go\n`;
    }
  }
  
  return display || 'Start your streak to see milestones!';
}

function getNextMilestone(streak) {
  const milestones = [3, 7, 14, 30, 60, 100];
  const next = milestones.find(m => m > streak);
  if (!next) return null;
  return { days: next, remaining: next - streak };
}

function getMotivationalMessage(streak, tier) {
  if (streak === 0) {
    return '💭 *"The journey of a thousand miles begins with a single step."*\nUse `/daily` to start your streak!';
  }
  
  const messages = {
    legendary: '👑 *"You are a true legend! Your dedication is unmatched!"*',
    inferno: '🌋 *"Your learning is on fire! Nothing can stop you now!"*',
    blazing: '🔥 *"One month strong! You\'re in the elite club!"*',
    burning: '💪 *"Two weeks! Your consistency is paying off!"*',
    hot: '⚡ *"A week already! You\'re building great habits!"*',
    warm: '✨ *"You\'re warming up! Keep the momentum going!"*',
    spark: '💫 *"Every streak starts with day one. You\'ve got this!"*',
    cold: '❄️ *"Time to ignite your flame! Start with /daily!"*'
  };
  
  return messages[Object.keys(STREAK_TIERS).find(k => STREAK_TIERS[k] === tier)] || messages.spark;
}

// ═══════════════════════════════════════════════════════════
// 🚀 MAIN EXECUTE FUNCTION
// ═══════════════════════════════════════════════════════════

export async function execute(interaction) {
  await interaction.deferReply();
  
  try {
    const user = await getOrCreateUser(interaction.user.id, interaction.user.username);
    const streak = user?.streak || 0;
    const bestStreak = user?.bestStreak || streak;
    const lastActive = user?.lastActive ? new Date(user.lastActive) : new Date();
    
    const tier = getStreakTier(streak);
    const nextMilestone = getNextMilestone(streak);

    // ═══ Main Streak Embed ═══
    const embed = new EmbedBuilder()
      .setColor(tier.color)
      .setAuthor({
        name: `${tier.emoji} ${tier.name} ${tier.emoji}`,
        iconURL: interaction.user.displayAvatarURL({ dynamic: true })
      })
      .setTitle(`${interaction.user.displayName || interaction.user.username}'s Streak`)
      .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true, size: 256 }))
      .setDescription(createFlameVisualization(streak))
      .addFields(
        {
          name: '📊 Stats',
          value: `🔥 **Current:** ${streak} days\n👑 **Best:** ${bestStreak} days\n⏰ **Active:** <t:${Math.floor(lastActive.getTime() / 1000)}:R>`,
          inline: true
        },
        {
          name: '💰 XP Bonus',
          value: `**${tier.multiplier}** multiplier\n${tier.emoji} ${tier.name}`,
          inline: true
        }
      );

    // Add next milestone if not at max
    if (nextMilestone) {
      embed.addFields({
        name: '🎯 Next Milestone',
        value: `**${nextMilestone.days} days** — ${nextMilestone.remaining} day${nextMilestone.remaining !== 1 ? 's' : ''} to go!`,
        inline: false
      });
    }

    // Add milestone progress
    embed.addFields({
      name: '🏆 Milestone Progress',
      value: createMilestoneProgress(streak),
      inline: false
    });

    // Add motivational message
    embed.addFields({
      name: '💬 Message',
      value: getMotivationalMessage(streak, tier),
      inline: false
    });

    embed.setFooter({ 
      text: `🎓 MentorAI • ${tier.emoji} ${tier.name} • Keep the flame alive!`,
      iconURL: interaction.client.user?.displayAvatarURL()
    });
    embed.setTimestamp();

    // ═══ Action Buttons ═══
    const buttons = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('exec_daily')
        .setLabel('Claim Daily')
        .setEmoji('🎁')
        .setStyle(streak === 0 ? ButtonStyle.Success : ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('exec_profile')
        .setLabel('Profile')
        .setEmoji('👤')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('exec_leaderboard')
        .setLabel('Leaderboard')
        .setEmoji('🏅')
        .setStyle(ButtonStyle.Secondary)
    );

    await interaction.editReply({ embeds: [embed], components: [buttons] });
    
  } catch (error) {
    console.error('Streak command error:', error);
    
    const errorEmbed = new EmbedBuilder()
      .setTitle('❌ Error')
      .setDescription('Failed to load streak data. Please try again!')
      .setColor(0xED4245)
      .addFields({
        name: '💡 Tip',
        value: 'Try using `/daily` to start your streak!',
        inline: false
      })
      .setFooter({ text: '🎓 MentorAI' });
    
    await interaction.editReply({ embeds: [errorEmbed] });
  }
}
