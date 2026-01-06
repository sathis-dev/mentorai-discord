import { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { getLeaderboard } from '../../services/gamificationService.js';
import { createLeaderboardEmbed, createNavigationButtons } from '../../config/designSystem.js';

export const data = new SlashCommandBuilder()
  .setName('leaderboard')
  .setDescription('🏆 View the top learners globally');

export async function execute(interaction) {
  await interaction.deferReply();

  try {
    const users = await getLeaderboard(10);
    const embed = createLeaderboardEmbed(users, 1);
    
    // Navigation buttons (if needed)
    const components = [];
    if (users.length >= 10) {
      components.push(createNavigationButtons(1, Math.ceil(users.length / 10) || 1, 'leaderboard'));
    }
    
    // Always add utility row with Menu button
    const utilityRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('exec_weekly')
        .setLabel('Weekly Challenge')
        .setEmoji('🏆')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId('help_main')
        .setLabel('Menu')
        .setEmoji('🏠')
        .setStyle(ButtonStyle.Secondary)
    );
    components.push(utilityRow);

    await interaction.editReply({ embeds: [embed], components });

  } catch (error) {
    console.error('Leaderboard command error:', error);
    await interaction.editReply({ content: '❌ Failed to load leaderboard. Please try again!' });
  }
}
