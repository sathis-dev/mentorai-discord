import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { COLORS } from '../../config/colors.js';
import { getOrCreateUser } from '../../services/gamificationService.js';

// In-memory study parties (in production, use database)
const activeParties = new Map();

export const data = new SlashCommandBuilder()
  .setName('studyparty')
  .setDescription('Start or join a study party with friends!')
  .addSubcommand(subcommand =>
    subcommand
      .setName('start')
      .setDescription('Start a new study party')
      .addStringOption(option =>
        option.setName('topic')
          .setDescription('What are you studying?')
          .setRequired(true))
      .addIntegerOption(option =>
        option.setName('duration')
          .setDescription('Duration in minutes (default: 30)')
          .setMinValue(5)
          .setMaxValue(120)))
  .addSubcommand(subcommand =>
    subcommand
      .setName('join')
      .setDescription('Join an existing study party')
      .addStringOption(option =>
        option.setName('party_id')
          .setDescription('Party ID to join')
          .setRequired(true)))
  .addSubcommand(subcommand =>
    subcommand
      .setName('leave')
      .setDescription('Leave your current study party'))
  .addSubcommand(subcommand =>
    subcommand
      .setName('status')
      .setDescription('Check current study party status'));

export async function execute(interaction) {
  const subcommand = interaction.options.getSubcommand();
  
  switch (subcommand) {
    case 'start':
      await startParty(interaction);
      break;
    case 'join':
      await joinParty(interaction);
      break;
    case 'leave':
      await leaveParty(interaction);
      break;
    case 'status':
      await partyStatus(interaction);
      break;
  }
}

async function startParty(interaction) {
  const topic = interaction.options.getString('topic');
  const duration = interaction.options.getInteger('duration') || 30;
  const partyId = `party_${Date.now().toString(36)}`;
  
  const party = {
    id: partyId,
    host: interaction.user.id,
    hostName: interaction.user.username,
    topic,
    duration,
    startTime: Date.now(),
    endTime: Date.now() + (duration * 60 * 1000),
    members: [{ id: interaction.user.id, name: interaction.user.username }],
    channelId: interaction.channelId,
  };
  
  activeParties.set(partyId, party);
  
  const embed = new EmbedBuilder()
    .setTitle('📚 Study Party Started!')
    .setColor(COLORS.SUCCESS)
    .setDescription(`**${interaction.user.username}** started a study session!`)
    .addFields(
      { name: '📖 Topic', value: topic, inline: true },
      { name: '⏱️ Duration', value: `${duration} minutes`, inline: true },
      { name: '🎫 Party ID', value: `\`${partyId}\``, inline: true },
      { name: '👥 Members', value: `1 member`, inline: true },
      { name: '⏰ Ends', value: `<t:${Math.floor(party.endTime / 1000)}:R>`, inline: true },
    )
    .setFooter({ text: 'Use /studyparty join to join this session!' });
  
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`studyparty_join_${partyId}`)
      .setLabel('Join Party')
      .setStyle(ButtonStyle.Success)
      .setEmoji('🎉'),
    new ButtonBuilder()
      .setCustomId(`studyparty_end_${partyId}`)
      .setLabel('End Party')
      .setStyle(ButtonStyle.Danger)
      .setEmoji('🛑'),
    new ButtonBuilder()
      .setCustomId('help_main')
      .setLabel('Menu')
      .setStyle(ButtonStyle.Secondary)
      .setEmoji('🏠'),
  );
  
  await interaction.reply({ embeds: [embed], components: [row] });
  
  // Auto-end party after duration
  setTimeout(async () => {
    const p = activeParties.get(partyId);
    if (p) {
      activeParties.delete(partyId);
      // Award XP to all members
      console.log(`Study party ${partyId} ended automatically`);
    }
  }, duration * 60 * 1000);
}

async function joinParty(interaction) {
  const partyId = interaction.options.getString('party_id');
  const party = activeParties.get(partyId);
  
  if (!party) {
    await interaction.reply({
      content: '❌ Party not found! Check the party ID and try again.',
      ephemeral: true,
    });
    return;
  }
  
  if (party.members.find(m => m.id === interaction.user.id)) {
    await interaction.reply({
      content: '❌ You\'re already in this party!',
      ephemeral: true,
    });
    return;
  }
  
  party.members.push({ id: interaction.user.id, name: interaction.user.username });
  
  const embed = new EmbedBuilder()
    .setTitle('🎉 Joined Study Party!')
    .setColor(COLORS.SUCCESS)
    .setDescription(`**${interaction.user.username}** joined the study party!`)
    .addFields(
      { name: '📖 Topic', value: party.topic, inline: true },
      { name: '👥 Members', value: party.members.map(m => m.name).join(', '), inline: false },
      { name: '⏰ Ends', value: `<t:${Math.floor(party.endTime / 1000)}:R>`, inline: true },
    );
  
  await interaction.reply({ embeds: [embed] });
}

async function leaveParty(interaction) {
  let userParty = null;
  let partyId = null;
  
  for (const [id, party] of activeParties) {
    if (party.members.find(m => m.id === interaction.user.id)) {
      userParty = party;
      partyId = id;
      break;
    }
  }
  
  if (!userParty) {
    await interaction.reply({
      content: '❌ You\'re not in any study party!',
      ephemeral: true,
    });
    return;
  }
  
  userParty.members = userParty.members.filter(m => m.id !== interaction.user.id);
  
  if (userParty.members.length === 0) {
    activeParties.delete(partyId);
  }
  
  await interaction.reply({
    content: '👋 You left the study party!',
    ephemeral: true,
  });
}

async function partyStatus(interaction) {
  let userParty = null;
  
  for (const [id, party] of activeParties) {
    if (party.members.find(m => m.id === interaction.user.id)) {
      userParty = party;
      break;
    }
  }
  
  if (!userParty) {
    // Show all active parties
    if (activeParties.size === 0) {
      await interaction.reply({
        content: '📚 No active study parties. Start one with `/studyparty start`!',
        ephemeral: true,
      });
      return;
    }
    
    const embed = new EmbedBuilder()
      .setTitle('📚 Active Study Parties')
      .setColor(COLORS.INFO)
      .setDescription('Join a party or start your own!');
    
    for (const [id, party] of activeParties) {
      embed.addFields({
        name: `${party.topic}`,
        value: `Host: ${party.hostName} | Members: ${party.members.length} | ID: \`${id}\``,
      });
    }
    
    await interaction.reply({ embeds: [embed], ephemeral: true });
    return;
  }
  
  const embed = new EmbedBuilder()
    .setTitle('📚 Your Study Party')
    .setColor(COLORS.INFO)
    .addFields(
      { name: '📖 Topic', value: userParty.topic, inline: true },
      { name: '👑 Host', value: userParty.hostName, inline: true },
      { name: '👥 Members', value: userParty.members.map(m => m.name).join(', '), inline: false },
      { name: '⏰ Ends', value: `<t:${Math.floor(userParty.endTime / 1000)}:R>`, inline: true },
    );
  
  await interaction.reply({ embeds: [embed] });
}
