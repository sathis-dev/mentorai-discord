import { SlashCommandBuilder } from 'discord.js';
import { createFeedbackModal } from '../../utils/modals.js';

export const data = new SlashCommandBuilder()
  .setName('feedback')
  .setDescription('📝 Share your feedback and help improve MentorAI');

export async function execute(interaction) {
  const modal = createFeedbackModal();
  await interaction.showModal(modal);
}
