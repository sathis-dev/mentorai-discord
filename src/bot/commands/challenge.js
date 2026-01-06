import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { COLORS } from '../../config/designSystem.js';
import { getOrCreateUser } from '../../services/gamificationService.js';

export const data = new SlashCommandBuilder()
  .setName('challenge')
  .setDescription('⚔️ Challenge another user to a quiz battle!')
  .addUserOption(option =>
    option.setName('opponent')
      .setDescription('User to challenge')
      .setRequired(true))
  .addStringOption(option =>
    option.setName('topic')
      .setDescription('Quiz topic')
      .setRequired(true)
      .setAutocomplete(true))
  .addStringOption(option =>
    option.setName('difficulty')
      .setDescription('Challenge difficulty')
      .addChoices(
        { name: '🟢 Easy', value: 'easy' },
        { name: '🟡 Medium', value: 'medium' },
        { name: '🔴 Hard', value: 'hard' }
      ));

export async function execute(interaction) {
  const opponent = interaction.options.getUser('opponent');
  const topic = interaction.options.getString('topic');
  const difficulty = interaction.options.getString('difficulty') || 'medium';

  // Validation
  if (opponent.id === interaction.user.id) {
    return interaction.reply({ content: '❌ You cannot challenge yourself!', ephemeral: true });
  }

  if (opponent.bot) {
    return interaction.reply({ content: '❌ You cannot challenge a bot!', ephemeral: true });
  }

  // Get challenger stats
  const challenger = await getOrCreateUser(interaction.user.id, interaction.user.username);
  const challengerLevel = challenger.level || 1;

  // Create challenge embed
  const embed = new EmbedBuilder()
    .setTitle('⚔️ QUIZ BATTLE CHALLENGE!')
    .setColor(COLORS.CHALLENGE_RED)
    .setDescription(
      '```\n' +
      '⚔️ ' + interaction.user.username + ' VS ' + opponent.username + ' ⚔️\n' +
      '```'
    )
    .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
    .addFields(
      { name: '🎯 Challenger', value: '**' + interaction.user.username + '**\nLevel ' + challengerLevel, inline: true },
      { name: '⚔️ VS', value: '```\n🆚\n```', inline: true },
      { name: '🛡️ Opponent', value: '**' + opponent.username + '**', inline: true },
      { name: '━━━━━━━━━━━━━━━━━━━━', value: '**BATTLE DETAILS**', inline: false },
      { name: '📚 Topic', value: topic, inline: true },
      { name: '📊 Difficulty', value: difficulty.charAt(0).toUpperCase() + difficulty.slice(1), inline: true },
      { name: '❓ Questions', value: '5', inline: true },
      { name: '🏆 Prize', value: '+150 XP for winner!', inline: false }
    )
    .setFooter({ text: '⏰ Challenge expires in 60 seconds' })
    .setTimestamp();

  // Challenge buttons
  const buttons = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('challenge_accept_' + interaction.user.id + '_' + opponent.id + '_' + encodeURIComponent(topic))
      .setLabel('Accept Challenge')
      .setEmoji('⚔️')
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId('challenge_decline_' + interaction.user.id + '_' + opponent.id)
      .setLabel('Decline')
      .setEmoji('🛡️')
      .setStyle(ButtonStyle.Danger)
  );

  await interaction.reply({ 
    content: opponent.toString() + ' **You have been challenged!**', 
    embeds: [embed], 
    components: [buttons] 
  });

  // Auto-expire after 60 seconds
  setTimeout(async () => {
    try {
      const message = await interaction.fetchReply();
      if (message.components.length > 0) {
        const expiredEmbed = EmbedBuilder.from(embed)
          .setColor(COLORS.SECONDARY)
          .setFooter({ text: '⏰ Challenge expired' });

        await interaction.editReply({ embeds: [expiredEmbed], components: [] });
      }
    } catch (e) {
      // Message might be deleted
    }
  }, 60000);
}

export default { data, execute };
