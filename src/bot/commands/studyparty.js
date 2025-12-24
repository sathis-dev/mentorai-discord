import { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { createStudyParty } from '../../services/studyPartyService.js';
import { createStudyPartyEmbed } from '../../utils/embedBuilder.js';

export const data = new SlashCommandBuilder()
  .setName('studyparty')
  .setDescription('Start a study party with friends')
  .addStringOption(option =>
    option
      .setName('topic')
      .setDescription('What should we study?')
      .setRequired(true)
  )
  .addIntegerOption(option =>
    option
      .setName('duration')
      .setDescription('Duration in minutes (15-120)')
      .setMinValue(15)
      .setMaxValue(120)
  );

export async function execute(interaction) {
  const topic = interaction.options.getString('topic');
  const duration = interaction.options.getInteger('duration') || 30;

  await interaction.deferReply();

  try {
    const party = await createStudyParty({
      topic,
      duration,
      hostId: interaction.user.id,
      guildId: interaction.guild.id,
      channelId: interaction.channel.id
    });

    const embed = createStudyPartyEmbed(party, interaction.user);

    const buttons = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`party_join_${party.id}`)
        .setLabel('Join Party')
        .setStyle(ButtonStyle.Success)
        .setEmoji('🎉'),
      new ButtonBuilder()
        .setCustomId(`party_start_${party.id}`)
        .setLabel('Start Now')
        .setStyle(ButtonStyle.Primary)
        .setEmoji('🚀'),
      new ButtonBuilder()
        .setCustomId(`party_cancel_${party.id}`)
        .setLabel('Cancel')
        .setStyle(ButtonStyle.Danger)
    );

    await interaction.editReply({ embeds: [embed], components: [buttons] });

  } catch (error) {
    console.error('Study party error:', error);
    await interaction.editReply({
      content: '❌ Failed to create study party. Please try again!'
    });
  }
}
