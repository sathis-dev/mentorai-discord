import { SlashCommandBuilder } from 'discord.js';
import { getUserProgress } from '../../services/progressService.js';
import { createProgressEmbed, createErrorEmbed } from '../../config/designSystem.js';

export const data = new SlashCommandBuilder()
  .setName('progress')
  .setDescription('View your learning progress and stats');

export async function execute(interaction) {
  await interaction.deferReply();

  try {
    const progress = await getUserProgress(interaction.user.id);
    const embed = createProgressEmbed(interaction.user, progress);

    await interaction.editReply({ embeds: [embed] });

  } catch (error) {
    console.error('Progress command error:', error);
    const errorEmbed = createErrorEmbed(
      'Failed to load your progress. Please try again!',
      'Use `/help` to see available commands.'
    );
    await interaction.editReply({ embeds: [errorEmbed] });
  }
}
