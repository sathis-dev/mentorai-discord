import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { getOrCreateUser, claimDailyBonus } from '../../services/gamificationService.js';
import { getTodaysTip } from '../../services/learningService.js';
import { 
  BRAND, COLORS, EMOJIS, VISUALS, RANKS,
  getRank, createProgressBar, formatNumber, getStreakMultiplier 
} from '../../config/brandSystem.js';
import { animateStreak, sleep } from '../../utils/animations.js';
import { checkMobileUser } from '../../utils/mobileUI.js';
import { createMobileDailyResultEmbed, createMobileDailyAlreadyClaimedEmbed } from '../../embeds/mobile/dailyMobile.js';

export const data = new SlashCommandBuilder()
  .setName('daily')
  .setDescription('🎁 Claim your daily XP bonus and get AI-powered tips');

export async function execute(interaction) {
  await interaction.deferReply();

  try {
    const user = await getOrCreateUser(interaction.user.id, interaction.user.username);
    const result = await claimDailyBonus(user);
    const isMobile = await checkMobileUser(interaction);

    if (!result.success) {
      // Calculate time remaining nicely
      const hours = result.hoursRemaining || 0;
      const minutes = result.minutesRemaining || 0;
      
      if (isMobile) {
        // Mobile: Compact already claimed view
        const response = createMobileDailyAlreadyClaimedEmbed(hours, minutes, user);
        await interaction.editReply(response);
        return;
      }
      
      // Desktop: Full already claimed view
      let timeString = '';
      if (hours > 0) timeString += `${hours} hour${hours !== 1 ? 's' : ''}`;
      if (minutes > 0) timeString += ` ${minutes} min`;
      
      const currentStreak = user.dailyBonusStreak || user.streak || 0;
      const nextMilestone = getNextStreakMilestone(currentStreak);
      const streakMultiplier = getStreakMultiplier(currentStreak);
      
      const waitEmbed = new EmbedBuilder()
        .setTitle(`${EMOJIS.clock} Already Claimed Today!`)
        .setColor(COLORS.WARNING)
        .setDescription(
          `\`\`\`\n${EMOJIS.check} You've already claimed today's bonus!\n\`\`\`\n` +
          `${EMOJIS.clock} **Next bonus available in:** ${timeString.trim()}\n\n` +
          `🕐 **Resets at:** <t:${Math.floor(result.nextClaimTime.getTime() / 1000)}:t> (<t:${Math.floor(result.nextClaimTime.getTime() / 1000)}:R>)`
        )
        .addFields(
          {
            name: `${EMOJIS.streak} Current Streak`,
            value: createStreakDisplay(currentStreak, streakMultiplier),
            inline: false
          },
          {
            name: `${EMOJIS.target} Next Milestone`,
            value: `**Day ${nextMilestone}** — ${nextMilestone - currentStreak} days away`,
            inline: true
          },
          {
            name: `${EMOJIS.tip} While You Wait`,
            value: `• \`/quiz\` - Earn XP from quizzes\n• \`/learn\` - Study new topics\n• \`/quickquiz\` - 60-second challenge`,
            inline: false
          }
        )
        .setFooter({ text: `${EMOJIS.brain} ${BRAND.name} | Daily bonus resets at midnight UTC` })
        .setTimestamp();

      const waitButtons = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('exec_quiz')
          .setLabel('Take Quiz')
          .setEmoji(EMOJIS.quiz)
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('exec_learn')
          .setLabel('Learn')
          .setEmoji(EMOJIS.learn)
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId('help_main')
          .setLabel('Menu')
          .setEmoji(EMOJIS.home)
          .setStyle(ButtonStyle.Secondary)
      );

      await interaction.editReply({ embeds: [waitEmbed], components: [waitButtons] });
      return;
    }

    // For mobile: Skip animation and show compact result
    if (isMobile) {
      const baseXP = 50;
      const streakBonus = result.xpEarned - baseXP;
      const response = createMobileDailyResultEmbed(baseXP, streakBonus > 0 ? streakBonus : 0, result.xpEarned || 50, result.streak || 1, user);
      await interaction.editReply(response);
      return;
    }

    // Desktop: Streak animation for streaks > 1
    if (result.streak > 1) {
      await animateStreak(interaction, result.streak);
      await sleep(500);
    }

    // Get AI tip
    const dailyTip = await getTodaysTip();
    const rank = getRank(result.newLevel || user.level || 1);
    const streakMultiplier = getStreakMultiplier(result.streak);
    const nextMilestone = getNextStreakMilestone(result.streak);

    // Create main bonus embed
    const bonusEmbed = new EmbedBuilder()
      .setTitle(`${EMOJIS.gift} Daily Bonus Claimed!`)
      .setColor(COLORS.XP_GOLD)
      .setDescription(
        `\`\`\`\n${EMOJIS.sparkle} Welcome back, ${interaction.user.username}! ${EMOJIS.sparkle}\n\`\`\`\n` +
        `${rank.emoji} **${rank.name}** • Level ${result.newLevel || user.level || 1}`
      );
    
    // XP Breakdown Section
    bonusEmbed.addFields({
      name: `${EMOJIS.coins} XP Breakdown`,
      value: createXPBreakdown(result),
      inline: false
    });
    
    // Streak display with visual
    bonusEmbed.addFields({
      name: `${EMOJIS.streak} Streak: ${result.streak} day${result.streak !== 1 ? 's' : ''} ${result.streakMaintained ? EMOJIS.target : ''}`,
      value: createStreakDisplay(result.streak, streakMultiplier),
      inline: false
    });
    
    // Next milestone progress
    bonusEmbed.addFields({
      name: `${EMOJIS.target} Next Milestone: Day ${nextMilestone}`,
      value: createProgressBar(result.streak, nextMilestone) + ` (${nextMilestone - result.streak} days)`,
      inline: false
    });
    
    // Milestone message
    if (result.milestoneMessage) {
      bonusEmbed.addFields({
        name: `${EMOJIS.trophy} MILESTONE REACHED!`,
        value: `\`\`\`\n${EMOJIS.party} ${result.milestoneMessage}\n\`\`\``,
        inline: false
      });
    }
    
    // Streak broken warning
    if (result.streakBroken) {
      bonusEmbed.addFields({
        name: `${EMOJIS.warning} Streak Reset`,
        value: `Your streak was reset. Claim daily to build it back up!`,
        inline: false
      });
    }

    // Level up notification
    if (result.leveledUp) {
      bonusEmbed.addFields({
        name: `${EMOJIS.levelup} LEVEL UP!`,
        value: `\`\`\`\n${EMOJIS.party} You reached Level ${result.newLevel}! ${EMOJIS.party}\n\`\`\``,
        inline: false
      });
    }

    // Achievements
    if (result.achievements && result.achievements.length > 0) {
      bonusEmbed.addFields({
        name: `${EMOJIS.trophy} Achievements Unlocked`,
        value: result.achievements.map(a => `${EMOJIS.medal} ${a}`).join('\n'),
        inline: false
      });
    }
    
    // Next claim time
    bonusEmbed.addFields({
      name: `${EMOJIS.clock} Next Bonus`,
      value: `Available <t:${Math.floor(result.nextClaimTime.getTime() / 1000)}:R>`,
      inline: true
    });
    
    bonusEmbed.setFooter({ text: `${EMOJIS.brain} ${BRAND.name} | Come back tomorrow to keep your streak!` })
      .setTimestamp();

    // AI Tip embed
    const tipEmbed = new EmbedBuilder()
      .setTitle(`${EMOJIS.tip} Today's AI Tip: ${dailyTip.category || 'Learning'}`)
      .setColor(COLORS.LESSON_BLUE)
      .setDescription(dailyTip.tip || 'Keep learning consistently!')
      .addFields(
        { name: `${EMOJIS.code} Example`, value: dailyTip.example || 'Practice daily!', inline: false },
        { name: `${EMOJIS.check} Today's Challenge`, value: dailyTip.actionItem || 'Complete one quiz!', inline: false }
      )
      .setFooter({ text: `${EMOJIS.brain} New tip every day!` });

    // Action buttons
    const buttons = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('exec_quiz')
        .setLabel('Take Quiz')
        .setEmoji(EMOJIS.quiz)
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('exec_leaderboard')
        .setLabel('Leaderboard')
        .setEmoji(EMOJIS.leaderboard)
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('help_main')
        .setLabel('Menu')
        .setEmoji(EMOJIS.home)
        .setStyle(ButtonStyle.Secondary)
    );

    await interaction.editReply({ embeds: [bonusEmbed, tipEmbed], components: [buttons] });

  } catch (error) {
    console.error('Daily command error:', error);
    await interaction.editReply({ content: `${EMOJIS.error} Failed to claim daily bonus. Please try again!` });
  }
}

// ═══════════════════════════════════════════════════════════
// 🔧 HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════

function createStreakDisplay(streak, multiplier) {
  const maxFires = 7;
  const fires = Math.min(streak, maxFires);
  const fireEmoji = EMOJIS.streak.repeat(fires);
  
  let title = '';
  if (streak >= 30) title = `${EMOJIS.crown} **LEGENDARY STREAK!**`;
  else if (streak >= 14) title = `${EMOJIS.lightning} **Two week warrior!**`;
  else if (streak >= 7) title = `${EMOJIS.muscle} **Week completed!**`;
  else if (streak >= 3) title = `${EMOJIS.sparkle} **Building momentum!**`;
  else title = `${RANKS.novice.emoji} **Keep it going!**`;

  return `${fireEmoji}\n${title}\n**${multiplier}x** XP Multiplier`;
}

function createXPBreakdown(result) {
  let breakdown = `\`\`\`diff\n`;
  breakdown += `+ ${result.baseXp} XP   Base Bonus\n`;
  if (result.streakBonus > 0) {
    breakdown += `+ ${result.streakBonus} XP   Streak Bonus\n`;
  }
  if (result.milestoneBonus > 0) {
    breakdown += `+ ${result.milestoneBonus} XP   Milestone Bonus!\n`;
  }
  breakdown += `${VISUALS.separators.thin}\n`;
  breakdown += `+ ${result.xpEarned} XP   TOTAL\n`;
  breakdown += `\`\`\``;
  return breakdown;
}

function getNextStreakMilestone(currentStreak) {
  const milestones = [3, 7, 14, 30, 50, 100, 365];
  for (const milestone of milestones) {
    if (currentStreak < milestone) return milestone;
  }
  return Math.ceil((currentStreak + 1) / 100) * 100; // Next hundred
}
