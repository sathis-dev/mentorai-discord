import { SlashCommandBuilder } from 'discord.js';
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
    
    // Only show navigation if there might be more pages
    const components = users.length >= 10 
      ? [createNavigationButtons(1, Math.ceil(users.length / 10) || 1, 'leaderboard')]
      : [];

    await interaction.editReply({ embeds: [embed], components });

  } catch (error) {
    console.error('Leaderboard command error:', error);
    await interaction.editReply({ content: '❌ Failed to load leaderboard. Please try again!' });
  }
}
