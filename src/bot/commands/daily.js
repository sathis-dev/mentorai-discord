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
      const waitEmbed = new EmbedBuilder()
        .setTitle('⏰ Daily Bonus Not Ready')
        .setColor(COLORS.WARNING)
        .setDescription(
          '```ansi\n\u001b[1;33m⏳ Come back in ' + result.hoursRemaining + ' hour' +
          (result.hoursRemaining !== 1 ? 's' : '') + '!\u001b[0m\n```'
        )
        .addFields({
          name: '💡 While You Wait',
          value: '• `/quiz` - Test your knowledge\n• `/learn` - Study a new topic\n• `/leaderboard` - Check rankings',
          inline: false
        })
        .setFooter({ text: '🎓 MentorAI' })
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
        '```ansi\n' +
        '\u001b[1;33m✨ Welcome back, ' + interaction.user.username + '! ✨\u001b[0m\n' +
        '```'
      )
      .addFields(
        { name: '💰 Base XP', value: '```diff\n+ ' + (result.baseXp || 75) + ' XP\n```', inline: true },
        { name: '🔥 Streak Bonus', value: '```diff\n+ ' + (result.streakBonus || 0) + ' XP\n```', inline: true },
        { name: '✨ Total', value: '```diff\n+ ' + result.xpEarned + ' XP\n```', inline: true },
        {
          name: '🔥 Current Streak: ' + result.streak + ' day' + (result.streak !== 1 ? 's' : ''),
          value: createStreakVisual(result.streak),
          inline: false
        }
      )
      .setFooter({ text: '🎓 MentorAI | Come back tomorrow!' })
      .setTimestamp();

    // Level up notification
    if (result.leveledUp) {
      bonusEmbed.addFields({
        name: '🆙 LEVEL UP!',
        value: '```ansi\n\u001b[1;32m🎉 You reached Level ' + result.newLevel + '! 🎉\u001b[0m\n```',
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
        .setCustomId('lesson_suggest_general')
        .setLabel('Start Learning')
        .setEmoji('📚')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('leaderboard_view')
        .setLabel('Leaderboard')
        .setEmoji('🏆')
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
