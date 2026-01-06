import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { getOrCreateUser, claimDailyBonus } from '../../services/gamificationService.js';
import { getTodaysTip } from '../../services/learningService.js';
import { COLORS } from '../../config/designSystem.js';
import { animateStreak, sleep } from '../../utils/animations.js';

export const data = new SlashCommandBuilder()
  .setName('daily')
  .setDescription('🎁 Claim your daily XP bonus and get AI-powered tips');

export async function execute(interaction) {
  await interaction.deferReply();

  try {
    const user = await getOrCreateUser(interaction.user.id, interaction.user.username);
    const result = await claimDailyBonus(user);

    if (!result.success) {
      // Calculate time remaining nicely
      const hours = result.hoursRemaining || 0;
      const minutes = result.minutesRemaining || 0;
      let timeString = '';
      if (hours > 0) timeString += `${hours} hour${hours !== 1 ? 's' : ''}`;
      if (minutes > 0) timeString += ` ${minutes} min`;
      
      const waitEmbed = new EmbedBuilder()
        .setTitle('⏰ Already Claimed Today!')
        .setColor(COLORS.WARNING)
        .setDescription(
          '```\n✓ You\'ve already claimed today\'s bonus!\n```\n' +
          `⏳ **Next bonus available in:** ${timeString.trim()}\n\n` +
          `🕐 **Resets at:** <t:${Math.floor(result.nextClaimTime.getTime() / 1000)}:t> (<t:${Math.floor(result.nextClaimTime.getTime() / 1000)}:R>)`
        )
        .addFields(
          {
            name: '🔥 Current Streak',
            value: `**${user.dailyBonusStreak || user.streak || 0} days** - Don\'t break it!`,
            inline: true
          },
          {
            name: '💡 While You Wait',
            value: '• `/quiz` - Earn XP from quizzes\n• `/learn` - Study new topics\n• `/quickquiz` - 60-second challenge',
            inline: false
          }
        )
        .setFooter({ text: '🎓 MentorAI | Daily bonus resets at midnight UTC' })
        .setTimestamp();

      await interaction.editReply({ embeds: [waitEmbed] });
      return;
    }

    // Streak animation for streaks > 1
    if (result.streak > 1) {
      await animateStreak(interaction, result.streak);
      await sleep(500);
    }

    // Get AI tip
    const dailyTip = await getTodaysTip();

    // Create main bonus embed
    const bonusEmbed = new EmbedBuilder()
      .setTitle('🎁 Daily Bonus Claimed!')
      .setColor(COLORS.XP_GOLD)
      .setDescription(
        '```\n' +
        '✨ Welcome back, ' + interaction.user.username + '! ✨\n' +
        '```'
      );
    
    // Add XP breakdown fields
    const xpFields = [
      { name: '💰 Base XP', value: '```diff\n+ ' + result.baseXp + ' XP\n```', inline: true },
      { name: '🔥 Streak Bonus', value: '```diff\n+ ' + result.streakBonus + ' XP\n```', inline: true }
    ];
    
    // Add milestone bonus if earned
    if (result.milestoneBonus > 0) {
      xpFields.push({ name: '🏆 Milestone!', value: '```diff\n+ ' + result.milestoneBonus + ' XP\n```', inline: true });
    }
    
    xpFields.push({ name: '✨ Total Earned', value: '```diff\n+ ' + result.xpEarned + ' XP\n```', inline: true });
    
    bonusEmbed.addFields(...xpFields);
    
    // Streak display
    bonusEmbed.addFields({
      name: '🔥 Streak: ' + result.streak + ' day' + (result.streak !== 1 ? 's' : '') + (result.streakMaintained ? ' 🎯' : ''),
      value: createStreakVisual(result.streak),
      inline: false
    });
    
    // Milestone message
    if (result.milestoneMessage) {
      bonusEmbed.addFields({
        name: '🎊 MILESTONE REACHED!',
        value: '```\n🎉 ' + result.milestoneMessage + '\n```',
        inline: false
      });
    }
    
    // Streak broken warning
    if (result.streakBroken) {
      bonusEmbed.addFields({
        name: '💔 Streak Reset',
        value: 'Your streak was reset. Claim daily to build it back up!',
        inline: false
      });
    }

    // Level up notification
    if (result.leveledUp) {
      bonusEmbed.addFields({
        name: '🆙 LEVEL UP!',
        value: '```\n🎉 You reached Level ' + result.newLevel + '! 🎉\n```',
        inline: false
      });
    }

    // Achievements
    if (result.achievements && result.achievements.length > 0) {
      bonusEmbed.addFields({
        name: '🏆 Achievements Unlocked',
        value: result.achievements.map(a => '🎖️ ' + a).join('\n'),
        inline: false
      });
    }
    
    // Next claim time
    bonusEmbed.addFields({
      name: '⏰ Next Bonus',
      value: `Available <t:${Math.floor(result.nextClaimTime.getTime() / 1000)}:R>`,
      inline: true
    });
    
    bonusEmbed.setFooter({ text: '🎓 MentorAI | Come back tomorrow to keep your streak!' })
      .setTimestamp();

    // AI Tip embed
    const tipEmbed = new EmbedBuilder()
      .setTitle('💡 Today\'s AI Tip: ' + (dailyTip.category || 'Learning'))
      .setColor(COLORS.LESSON_BLUE)
      .setDescription(dailyTip.tip || 'Keep learning consistently!')
      .addFields(
        { name: '📝 Example', value: dailyTip.example || 'Practice daily!', inline: false },
        { name: '✅ Today\'s Challenge', value: dailyTip.actionItem || 'Complete one quiz!', inline: false }
      )
      .setFooter({ text: '🎓 New tip every day!' });

    // Action buttons
    const buttons = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('quiz_start_general')
        .setLabel('Take Quiz')
        .setEmoji('🎯')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('leaderboard_view')
        .setLabel('Leaderboard')
        .setEmoji('🏆')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('help_main')
        .setLabel('Menu')
        .setEmoji('🏠')
        .setStyle(ButtonStyle.Secondary)
    );

    await interaction.editReply({ embeds: [bonusEmbed, tipEmbed], components: [buttons] });

  } catch (error) {
    console.error('Daily command error:', error);
    await interaction.editReply({ content: '❌ Failed to claim daily bonus. Please try again!' });
  }
}

function createStreakVisual(streak) {
  const maxFires = 7;
  const fires = Math.min(streak, maxFires);
  const fireEmoji = '🔥'.repeat(fires);

  let message = fireEmoji + '\n';

  if (streak >= 30) message += '👑 **LEGENDARY STREAK!**';
  else if (streak >= 14) message += '⚡ **Two week warrior!**';
  else if (streak >= 7) message += '💪 **Week completed!**';
  else if (streak >= 3) message += '✨ **Building momentum!**';
  else message += '🌱 **Keep it going!**';

  return message;
}
