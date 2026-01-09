import { Events, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { User } from '../../database/models/User.js';
import { ServerSettings } from '../../database/models/ServerSettings.js';
import { COLORS, EMOJIS } from '../../config/brandSystem.js';
import logger from '../../utils/logger.js';

export const name = Events.GuildMemberAdd;

export async function execute(member) {
  try {
    // Check if server has welcome channel configured
    const settings = await ServerSettings.findOne({ guildId: member.guild.id });
    
    if (!settings?.welcomeChannel) return;
    
    const channel = member.guild.channels.cache.get(settings.welcomeChannel);
    if (!channel) return;
    
    // Create or get user
    let user = await User.findOne({ discordId: member.id });
    const isNewUser = !user;
    
    if (!user) {
      user = await User.create({
        discordId: member.id,
        username: member.user.username,
        xp: 50, // Welcome bonus
        level: 1,
        streak: 0
      });
      logger.info(`New user created via welcome: ${member.user.username} (${member.id})`);
    }
    
    const embed = new EmbedBuilder()
      .setColor(COLORS.SUCCESS)
      .setAuthor({
        name: '🎉 Welcome to the Server!',
        iconURL: member.user.displayAvatarURL()
      })
      .setTitle(`Welcome, ${member.user.username}!`)
      .setDescription(isNewUser 
        ? `
━━━━━━━━━━━━━━━━━━━━━

Hey **${member.user.username}**! 👋

${EMOJIS.GIFT} You've received **+50 XP** as a welcome bonus!

**🚀 Start your coding journey:**
• Use \`/help\` to see all commands
• Try \`/learn python\` for your first lesson
• Take \`/quiz\` to test your knowledge
• Claim \`/daily\` rewards every day!

━━━━━━━━━━━━━━━━━━━━━
        `
        : `
━━━━━━━━━━━━━━━━━━━━━

Welcome back, **${member.user.username}**! 👋

Your progress has been saved.

${EMOJIS.SPARKLE} **Your Stats:**
• Level: ${user.level}
• XP: ${user.xp.toLocaleString()}
• Streak: ${user.streak} days

━━━━━━━━━━━━━━━━━━━━━
        `)
      .setThumbnail(member.user.displayAvatarURL({ size: 256 }))
      .setFooter({
        text: '🎓 MentorAI - Learn to code like playing a game!',
        iconURL: member.client.user.displayAvatarURL()
      })
      .setTimestamp();

    const row = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('welcome_start')
          .setLabel('🚀 Quick Start')
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId('welcome_help')
          .setLabel('📖 Commands')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setLabel('🌐 Website')
          .setURL('https://mentorai.up.railway.app')
          .setStyle(ButtonStyle.Link)
      );

    await channel.send({ 
      content: `Welcome ${member}! ${EMOJIS.WAVE}`,
      embeds: [embed], 
      components: [row] 
    });
    
    logger.info(`Welcomed ${member.user.username} to ${member.guild.name}`);
    
  } catch (error) {
    logger.error(`Error in guildMemberAdd event: ${error.message}`);
  }
}
