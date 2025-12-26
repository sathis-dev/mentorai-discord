import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { getOrCreateUser } from '../../services/gamificationService.js';
import { COLORS, EMOJIS } from '../../config/designSystem.js';
import { DECORATIONS, createBanner } from '../../utils/advancedUI.js';

export const data = new SlashCommandBuilder()
  .setName('profile')
  .setDescription('👤 View your detailed profile and statistics')
  .addUserOption(option =>
    option.setName('user')
      .setDescription('View another user\'s profile'));

export async function execute(interaction) {
  await interaction.deferReply();

  const targetUser = interaction.options.getUser('user') || interaction.user;

  try {
    const user = await getOrCreateUser(targetUser.id, targetUser.username);
    
    // Calculate stats
    const level = user.level || 1;
    const xp = user.xp || 0;
    const xpNeeded = typeof user.xpForNextLevel === 'function' ? user.xpForNextLevel() : 100;
    const streak = user.streak || 0;
    const quizzes = user.quizzesTaken || 0;
    const accuracy = user.totalQuestions > 0 
      ? Math.round((user.correctAnswers / user.totalQuestions) * 100) 
      : 0;
    const achievements = user.achievements || [];

    // Determine rank/tier
    const tier = getTier(level);
    
    // Create profile embed
    const profileEmbed = new EmbedBuilder()
      .setAuthor({
        name: targetUser.username + '\'s Profile',
        iconURL: targetUser.displayAvatarURL({ dynamic: true })
      })
      .setColor(tier.color)
      .setThumbnail(targetUser.displayAvatarURL({ dynamic: true, size: 256 }))
      .setDescription(createBanner(tier.name + ' Learner', 'fancy'))
      .addFields(
        { 
          name: DECORATIONS.sparkDivider, 
          value: '**📊 STATISTICS**', 
          inline: false 
        },
        { 
          name: '⭐ Level', 
          value: '```ansi\n\u001b[1;33m' + level + '\u001b[0m\n```', 
          inline: true 
        },
        { 
          name: '✨ Total XP', 
          value: '```ansi\n\u001b[1;36m' + xp.toLocaleString() + '\u001b[0m\n```', 
          inline: true 
        },
        { 
          name: '🔥 Streak', 
          value: '```ansi\n\u001b[1;31m' + streak + ' days\u001b[0m\n```', 
          inline: true 
        },
        {
          name: '📈 Progress to Level ' + (level + 1),
          value: createFancyProgressBar(xp, xpNeeded),
          inline: false
        },
        { 
          name: DECORATIONS.sparkDivider, 
          value: '**🎮 PERFORMANCE**', 
          inline: false 
        },
        { 
          name: '📝 Quizzes', 
          value: quizzes.toString(), 
          inline: true 
        },
        { 
          name: '🎯 Accuracy', 
          value: accuracy + '%', 
          inline: true 
        },
        { 
          name: '🏆 Achievements', 
          value: achievements.length.toString(), 
          inline: true 
        }
      )
      .setFooter({ 
        text: '🎓 MentorAI | ' + tier.emoji + ' ' + tier.name + ' Tier',
        iconURL: interaction.client.user.displayAvatarURL()
      })
      .setTimestamp();

    // Add recent achievements if any
    if (achievements.length > 0) {
      profileEmbed.addFields({
        name: '🎖️ Recent Achievements',
        value: achievements.slice(-3).map(a => '• ' + a).join('\n'),
        inline: false
      });
    }

    // Action buttons - these now work!
    const buttons = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('profile_achievements')
        .setLabel('Achievements')
        .setEmoji('🏆')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('profile_history')
        .setLabel('History')
        .setEmoji('📜')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('execute_leaderboard')
        .setLabel('Leaderboard')
        .setEmoji('🏅')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('profile_share')
        .setLabel('Share')
        .setEmoji('📤')
        .setStyle(ButtonStyle.Success)
    );

    await interaction.editReply({ embeds: [profileEmbed], components: [buttons] });

  } catch (error) {
    console.error('Profile command error:', error);
    await interaction.editReply({ content: '❌ Failed to load profile.' });
  }
}

function getTier(level) {
  if (level >= 50) return { name: 'Legendary', emoji: '👑', color: 0xFF00FF };
  if (level >= 40) return { name: 'Diamond', emoji: '💎', color: 0x00D9FF };
  if (level >= 30) return { name: 'Platinum', emoji: '🔮', color: 0xE5E4E2 };
  if (level >= 20) return { name: 'Gold', emoji: '🥇', color: 0xFFD700 };
  if (level >= 15) return { name: 'Silver', emoji: '🥈', color: 0xC0C0C0 };
  if (level >= 10) return { name: 'Bronze', emoji: '🥉', color: 0xCD7F32 };
  if (level >= 5) return { name: 'Iron', emoji: '⚔️', color: 0x71797E };
  return { name: 'Novice', emoji: '🌱', color: 0x57F287 };
}

function createFancyProgressBar(current, max) {
  const percentage = Math.round((current / max) * 100);
  const filled = Math.round(percentage / 5);
  const empty = 20 - filled;
  
  const bar = '▓'.repeat(filled) + '░'.repeat(empty);
  
  return '```\n[' + bar + '] ' + percentage + '%\n' + 
    current.toLocaleString() + ' / ' + max.toLocaleString() + ' XP\n```';
}
