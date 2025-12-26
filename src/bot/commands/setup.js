import { SlashCommandBuilder, PermissionFlagsBits, ChannelType, EmbedBuilder } from 'discord.js';
import { ServerSettings } from '../../database/models/ServerSettings.js';
import { COLORS } from '../../config/colors.js';

export const data = new SlashCommandBuilder()
  .setName('setup')
  .setDescription('Configure MentorAI for your server (Admin/Moderator only)')
  .setDMPermission(false)
  .addSubcommand(sub =>
    sub
      .setName('announcement')
      .setDescription('Set the channel for bot announcements & broadcasts')
      .addChannelOption(opt =>
        opt
          .setName('channel')
          .setDescription('The channel for announcements')
          .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
          .setRequired(true)
      )
  )
  .addSubcommand(sub =>
    sub
      .setName('welcome')
      .setDescription('Configure welcome messages for new members')
      .addChannelOption(opt =>
        opt
          .setName('channel')
          .setDescription('Channel for welcome messages')
          .addChannelTypes(ChannelType.GuildText)
          .setRequired(true)
      )
      .addStringOption(opt =>
        opt
          .setName('message')
          .setDescription('Custom welcome message (use {{user}}, {{server}})')
          .setRequired(false)
      )
  )
  .addSubcommand(sub =>
    sub
      .setName('levelup')
      .setDescription('Configure level-up announcements')
      .addChannelOption(opt =>
        opt
          .setName('channel')
          .setDescription('Channel for level-up messages (leave empty to disable)')
          .addChannelTypes(ChannelType.GuildText)
          .setRequired(false)
      )
  )
  .addSubcommand(sub =>
    sub
      .setName('view')
      .setDescription('View current server configuration')
  )
  .addSubcommand(sub =>
    sub
      .setName('reset')
      .setDescription('Reset all MentorAI settings for this server')
  );

export async function execute(interaction) {
  // Check if user has permission (Admin, Moderator, ManageGuild, ManageChannels, or Owner)
  const member = interaction.member;
  const hasPermission = member.permissions.has(PermissionFlagsBits.Administrator) ||
                        member.permissions.has(PermissionFlagsBits.ManageGuild) ||
                        member.permissions.has(PermissionFlagsBits.ManageChannels) ||
                        member.permissions.has(PermissionFlagsBits.ModerateMembers) ||
                        interaction.guild.ownerId === member.id;
  
  if (!hasPermission) {
    return interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(COLORS.ERROR)
          .setTitle('🔒 Permission Required')
          .setDescription('You need one of these permissions to configure MentorAI:\n• Administrator\n• Manage Server\n• Manage Channels\n• Moderate Members\n• Server Owner')
      ],
      ephemeral: true
    });
  }

  const subcommand = interaction.options.getSubcommand();
  const guild = interaction.guild;
  
  // Get or create server settings
  const settings = await ServerSettings.getOrCreate(guild.id, {
    name: guild.name,
    icon: guild.iconURL(),
    memberCount: guild.memberCount
  });
  
  switch (subcommand) {
    case 'announcement':
      return handleAnnouncementSetup(interaction, settings);
    case 'welcome':
      return handleWelcomeSetup(interaction, settings);
    case 'levelup':
      return handleLevelUpSetup(interaction, settings);
    case 'view':
      return handleViewConfig(interaction, settings);
    case 'reset':
      return handleReset(interaction, settings);
  }
}

async function handleAnnouncementSetup(interaction, settings) {
  const channel = interaction.options.getChannel('channel');
  
  // Check bot permissions in channel
  const permissions = channel.permissionsFor(interaction.client.user);
  if (!permissions.has('SendMessages') || !permissions.has('EmbedLinks')) {
    return interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(COLORS.ERROR)
          .setTitle('❌ Missing Permissions')
          .setDescription(`I need **Send Messages** and **Embed Links** permissions in ${channel}!`)
      ],
      ephemeral: true
    });
  }
  
  // Save settings
  await ServerSettings.setAnnouncementChannel(
    interaction.guild.id,
    channel.id,
    channel.name,
    interaction.user.id
  );
  
  // Send confirmation to the channel
  const confirmEmbed = new EmbedBuilder()
    .setColor(COLORS.SUCCESS)
    .setTitle('📢 Announcement Channel Configured!')
    .setDescription('This channel will now receive important announcements and broadcasts from MentorAI.')
    .addFields(
      { name: 'Configured By', value: `<@${interaction.user.id}>`, inline: true },
      { name: 'Server', value: interaction.guild.name, inline: true }
    )
    .setFooter({ text: 'Server admins can change this anytime with /setup announcement' })
    .setTimestamp();
  
  try {
    await channel.send({ embeds: [confirmEmbed] });
  } catch (e) {
    console.error('Could not send confirmation to channel:', e);
  }
  
  // Reply to user
  const embed = new EmbedBuilder()
    .setColor(COLORS.SUCCESS)
    .setTitle('✅ Announcement Channel Set!')
    .setDescription(`Broadcasts and announcements will be sent to ${channel}`)
    .addFields(
      { name: '📢 Channel', value: `${channel}`, inline: true },
      { name: '🔔 Status', value: 'Ready to receive broadcasts', inline: true }
    )
    .setFooter({ text: 'You can change this anytime by running /setup announcement again' });
  
  return interaction.reply({ embeds: [embed], ephemeral: true });
}

async function handleWelcomeSetup(interaction, settings) {
  const channel = interaction.options.getChannel('channel');
  const message = interaction.options.getString('message');
  
  settings.settings.welcomeEnabled = true;
  settings.settings.welcomeChannelId = channel.id;
  if (message) {
    settings.settings.welcomeMessage = message;
  }
  await settings.save();
  
  const embed = new EmbedBuilder()
    .setColor(COLORS.SUCCESS)
    .setTitle('✅ Welcome Messages Configured!')
    .setDescription(`New members will be welcomed in ${channel}`)
    .addFields(
      { name: '📝 Message Preview', value: settings.settings.welcomeMessage.replace('{{user}}', '@NewUser').replace('{{server}}', interaction.guild.name) }
    );
  
  return interaction.reply({ embeds: [embed], ephemeral: true });
}

async function handleLevelUpSetup(interaction, settings) {
  const channel = interaction.options.getChannel('channel');
  
  if (channel) {
    settings.settings.levelUpEnabled = true;
    settings.settings.levelUpChannelId = channel.id;
    await settings.save();
    
    const embed = new EmbedBuilder()
      .setColor(COLORS.SUCCESS)
      .setTitle('✅ Level-Up Announcements Enabled!')
      .setDescription(`Level-up messages will be sent to ${channel}`);
    
    return interaction.reply({ embeds: [embed], ephemeral: true });
  } else {
    settings.settings.levelUpEnabled = false;
    settings.settings.levelUpChannelId = null;
    await settings.save();
    
    const embed = new EmbedBuilder()
      .setColor(COLORS.WARNING)
      .setTitle('📴 Level-Up Announcements Disabled')
      .setDescription('Level-up messages will only be shown in the channel where the user gained XP.');
    
    return interaction.reply({ embeds: [embed], ephemeral: true });
  }
}

async function handleViewConfig(interaction, settings) {
  const guild = interaction.guild;
  
  const announcementChannel = settings.announcementChannelId 
    ? `<#${settings.announcementChannelId}>` 
    : '❌ Not configured';
  
  const welcomeChannel = settings.settings.welcomeChannelId
    ? `<#${settings.settings.welcomeChannelId}>`
    : '❌ Disabled';
  
  const levelUpChannel = settings.settings.levelUpChannelId
    ? `<#${settings.settings.levelUpChannelId}>`
    : '❌ Disabled';
  
  const embed = new EmbedBuilder()
    .setColor(COLORS.PRIMARY)
    .setTitle(`⚙️ MentorAI Configuration - ${guild.name}`)
    .setThumbnail(guild.iconURL())
    .addFields(
      { name: '📢 Announcement Channel', value: announcementChannel, inline: true },
      { name: '👋 Welcome Channel', value: welcomeChannel, inline: true },
      { name: '⬆️ Level-Up Channel', value: levelUpChannel, inline: true },
      { name: '🎯 XP Multiplier', value: `${settings.settings.xpMultiplier}x`, inline: true },
      { name: '📊 Broadcasts Allowed', value: settings.settings.allowBroadcasts ? '✅ Yes' : '❌ No', inline: true },
      { name: '📅 Bot Joined', value: settings.joinedAt ? `<t:${Math.floor(settings.joinedAt.getTime() / 1000)}:R>` : 'Unknown', inline: true }
    )
    .setFooter({ text: 'Use /setup <option> to change settings' });
  
  if (settings.configuredBy) {
    embed.addFields({
      name: '🔧 Last Configured By',
      value: `<@${settings.configuredBy}> on <t:${Math.floor(settings.configuredAt.getTime() / 1000)}:f>`,
      inline: false
    });
  }
  
  return interaction.reply({ embeds: [embed], ephemeral: true });
}

async function handleReset(interaction, settings) {
  settings.announcementChannelId = null;
  settings.announcementChannelName = null;
  settings.configuredBy = null;
  settings.configuredAt = null;
  settings.settings = {
    allowBroadcasts: true,
    prefix: '!',
    xpMultiplier: 1.0,
    disabledCommands: [],
    welcomeEnabled: false,
    welcomeChannelId: null,
    welcomeMessage: 'Welcome {{user}} to {{server}}! 🎉 Use /help to get started with MentorAI!',
    levelUpEnabled: true,
    levelUpChannelId: null
  };
  await settings.save();
  
  const embed = new EmbedBuilder()
    .setColor(COLORS.WARNING)
    .setTitle('🔄 Settings Reset')
    .setDescription('All MentorAI settings for this server have been reset to defaults.')
    .setFooter({ text: 'Use /setup to configure the bot again' });
  
  return interaction.reply({ embeds: [embed], ephemeral: true });
}
