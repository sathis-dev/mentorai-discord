import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType } from 'discord.js';
import { ServerSettings } from '../../database/models/ServerSettings.js';
import { COLORS } from '../../config/colors.js';

export const name = 'guildCreate';
export const once = false;

export async function execute(guild) {
  console.log(`[INFO] 🎉 Joined new server: ${guild.name} (${guild.id}) - ${guild.memberCount} members`);
  
  // Create/update server settings
  await ServerSettings.getOrCreate(guild.id, {
    name: guild.name,
    icon: guild.iconURL(),
    memberCount: guild.memberCount
  });
  
  // Find the best channel to send setup message
  let targetChannel = guild.systemChannel;
  
  if (!targetChannel) {
    // Try to find general/welcome/bot channel
    targetChannel = guild.channels.cache.find(ch =>
      ch.type === ChannelType.GuildText &&
      ch.permissionsFor(guild.members.me)?.has(['SendMessages', 'EmbedLinks']) &&
      (ch.name.includes('general') || ch.name.includes('welcome') || ch.name.includes('bot') || ch.name.includes('chat'))
    );
  }
  
  if (!targetChannel) {
    // Get first text channel we can send to
    targetChannel = guild.channels.cache.find(ch =>
      ch.type === ChannelType.GuildText &&
      ch.permissionsFor(guild.members.me)?.has(['SendMessages', 'EmbedLinks'])
    );
  }
  
  if (!targetChannel) {
    console.log(`[WARN] Could not find a channel to send welcome message in ${guild.name}`);
    return;
  }
  
  // Create welcome/setup embed
  const embed = new EmbedBuilder()
    .setColor(COLORS.primary)
    .setTitle('🎓 Thanks for adding MentorAI!')
    .setDescription(
      `Hello **${guild.name}**! I'm your AI-powered learning companion with gamification! 🚀\n\n` +
      `**Quick Setup (Recommended)**\n` +
      `To receive announcements and updates from MentorAI, a server admin should set up an announcement channel.\n\n` +
      `**Getting Started:**\n` +
      `• \`/help\` - See all available commands\n` +
      `• \`/quiz\` - Start an AI-generated quiz\n` +
      `• \`/learn\` - Get a personalized lesson\n` +
      `• \`/profile\` - View your learning profile\n` +
      `• \`/leaderboard\` - See top learners`
    )
    .addFields(
      {
        name: '⚙️ For Server Admins',
        value: 'Use `/setup announcement #channel` to configure where I send important updates and broadcasts.',
        inline: false
      },
      {
        name: '🎮 Features',
        value: '✨ AI-Generated Quizzes\n📚 Personalized Lessons\n🔥 Daily Streaks\n🏆 XP & Leveling\n🎯 Achievements',
        inline: true
      },
      {
        name: '📊 Statistics',
        value: `👥 Server Members: ${guild.memberCount}\n🌐 Total Servers: ${guild.client.guilds.cache.size}`,
        inline: true
      }
    )
    .setThumbnail(guild.client.user.displayAvatarURL())
    .setFooter({ text: 'Only users with "Manage Server" permission can configure the bot' })
    .setTimestamp();
  
  // Create setup button
  const row = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('setup_announcement_prompt')
        .setLabel('📢 Setup Announcement Channel')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('setup_skip')
        .setLabel('Skip for Now')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setLabel('Documentation')
        .setURL('https://github.com/yourusername/mentorai')
        .setStyle(ButtonStyle.Link)
    );
  
  try {
    await targetChannel.send({ embeds: [embed], components: [row] });
    console.log(`[INFO] Sent welcome message to #${targetChannel.name} in ${guild.name}`);
  } catch (error) {
    console.error(`[ERROR] Failed to send welcome message in ${guild.name}:`, error.message);
  }
}
