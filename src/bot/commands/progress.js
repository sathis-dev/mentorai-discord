import { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { getOrCreateUser } from '../../services/gamificationService.js';
import { createProgressEmbed } from '../../config/designSystem.js';

export const data = new SlashCommandBuilder()
  .setName('progress')
  .setDescription('📊 View your learning progress and stats')
  .addUserOption(option =>
    option.setName('user')
      .setDescription('View another user\'s progress'));

export async function execute(interaction) {
  await interaction.deferReply();

  const targetUser = interaction.options.getUser('user') || interaction.user;

  try {
    const user = await getOrCreateUser(targetUser.id, targetUser.username);
    const avatarURL = targetUser.displayAvatarURL({ dynamic: true, size: 256 });
    
    const embed = createProgressEmbed(user, avatarURL);

    // Action buttons - these work now!
    const buttons = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('execute_achievements')
        .setLabel('Achievements')
        .setEmoji('🏆')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('execute_leaderboard')
        .setLabel('Leaderboard')
        .setEmoji('🏅')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('help_main')
        .setLabel('Menu')
        .setEmoji('🏠')
        .setStyle(ButtonStyle.Secondary)
    );

    await interaction.editReply({ embeds: [embed], components: [buttons] });

  } catch (error) {
    console.error('Progress command error:', error);
    await interaction.editReply({ content: '❌ Failed to load progress. Please try again!' });
  }
}
