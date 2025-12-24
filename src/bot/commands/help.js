import { SlashCommandBuilder } from 'discord.js';
import { createHelpEmbed } from '../../config/designSystem.js';

export const data = new SlashCommandBuilder()
  .setName('help')
  .setDescription('Learn how to use MentorAI');

export async function execute(interaction) {
  const embed = createHelpEmbed();
  await interaction.reply({ embeds: [embed] });
}
