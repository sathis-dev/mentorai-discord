import { SlashCommandBuilder } from 'discord.js';
import { getServerLeaderboard } from '../../services/progressService.js';
import { createLeaderboardEmbed, createErrorEmbed } from '../../config/designSystem.js';

export const data = new SlashCommandBuilder()
  .setName('leaderboard')
  .setDescription('View the top learners in this server')
  .addIntegerOption(option =>
    option
      .setName('limit')
      .setDescription('Number of users to show (1-25)')
      .setMinValue(1)
      .setMaxValue(25)
  );

export async function execute(interaction) {
  await interaction.deferReply();

  try {
    const limit = interaction.options.getInteger('limit') || 10;
    const leaderboard = await getServerLeaderboard(interaction.guild.id, limit);

    const usersWithNames = await Promise.all(
      leaderboard.map(async (entry) => {
        try {
          const user = await interaction.client.users.fetch(entry.discordId);
          return { ...entry, username: user.username, level: entry.level, totalXP: entry.totalXp };
        } catch (error) {
          return { ...entry, username: 'Unknown User', level: entry.level, totalXP: entry.totalXp };
        }
      })
    );

    const embed = createLeaderboardEmbed(usersWithNames, interaction.guild.name);
    await interaction.editReply({ embeds: [embed] });

  } catch (error) {
    console.error('Leaderboard command error:', error);
    const errorEmbed = createErrorEmbed(
      'Failed to load leaderboard. Please try again!',
      'Make sure you are using this command in a server.'
    );
    await interaction.editReply({ embeds: [errorEmbed] });
  }
}
