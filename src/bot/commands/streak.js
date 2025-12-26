import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { getOrCreateUser } from '../../services/gamificationService.js';

export const data = new SlashCommandBuilder()
  .setName('streak')
  .setDescription('Check your learning streak');

export async function execute(interaction) {
  await interaction.deferReply();
  
  try {
    const user = await getOrCreateUser(interaction.user.id, interaction.user.username);
    const streak = user?.streak || 0;
    const lastActive = user?.lastActive ? new Date(user.lastActive) : new Date();
    
    const streakEmojis = ['🔥', '⚡', '💫', '🌟', '✨'];
    const emoji = streakEmojis[Math.min(Math.floor(streak / 7), streakEmojis.length - 1)];
    
    const embed = new EmbedBuilder()
      .setTitle(`${emoji} Learning Streak`)
      .setColor(0xFF6B35)
      .setDescription(`**${interaction.user.username}**'s streak status`)
      .addFields(
        { name: '🔥 Current Streak', value: `**${streak}** days`, inline: true },
        { name: '📅 Last Active', value: `<t:${Math.floor(lastActive.getTime() / 1000)}:R>`, inline: true },
      )
      .setTimestamp()
      .setFooter({ text: '🎓 MentorAI' });
    
    // Streak milestones
    const milestones = [3, 7, 14, 30, 60, 100];
    const nextMilestone = milestones.find(m => m > streak);
    
    if (nextMilestone) {
      embed.addFields({
        name: '🎯 Next Milestone',
        value: `${nextMilestone} days (${nextMilestone - streak} to go!)`,
      });
    } else {
      embed.addFields({
        name: '🏆 Status',
        value: 'You\'ve reached all milestones! Keep it up!',
      });
    }
    
    await interaction.editReply({ embeds: [embed] });
  } catch (error) {
    console.error('Streak command error:', error);
    
    const errorEmbed = new EmbedBuilder()
      .setTitle('❌ Error')
      .setDescription('Failed to load streak. Please try again!')
      .setColor(0xED4245);
    
    await interaction.editReply({ embeds: [errorEmbed] });
  }
}
