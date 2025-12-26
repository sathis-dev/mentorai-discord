import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { User } from '../../database/models/User.js';
import { Quiz } from '../../database/models/Quiz.js';
import { Lesson } from '../../database/models/Lesson.js';

export const data = new SlashCommandBuilder()
  .setName('stats')
  .setDescription('View global MentorAI statistics');

export async function execute(interaction) {
  await interaction.deferReply();
  
  try {
    let userCount = 0;
    let quizCount = 0;
    let lessonCount = 0;
    let totalXP = 0;
    
    try {
      userCount = await User.countDocuments() || 0;
      quizCount = await Quiz.countDocuments() || 0;
      lessonCount = await Lesson.countDocuments() || 0;
      
      const xpResult = await User.aggregate([
        { $group: { _id: null, total: { $sum: '$xp' } } }
      ]);
      totalXP = xpResult[0]?.total || 0;
    } catch (dbError) {
      console.error('Database error in stats:', dbError);
    }
    
    const embed = new EmbedBuilder()
      .setTitle('📊 MentorAI Global Stats')
      .setColor(0x5865F2)
      .addFields(
        { name: '👥 Total Learners', value: `${userCount.toLocaleString()}`, inline: true },
        { name: '📝 Quizzes Created', value: `${quizCount.toLocaleString()}`, inline: true },
        { name: '📚 Lessons Generated', value: `${lessonCount.toLocaleString()}`, inline: true },
        { name: '✨ Total XP Earned', value: `${totalXP.toLocaleString()}`, inline: true },
        { name: '🌐 Servers', value: `${interaction.client.guilds.cache.size}`, inline: true },
        { name: '⏱️ Uptime', value: formatUptime(interaction.client.uptime), inline: true },
      )
      .setTimestamp()
      .setFooter({ text: '🎓 MentorAI - Learn & Level Up!' });
    
    await interaction.editReply({ embeds: [embed] });
  } catch (error) {
    console.error('Stats command error:', error);
    
    const errorEmbed = new EmbedBuilder()
      .setTitle('❌ Error')
      .setDescription('Failed to load stats. Please try again!')
      .setColor(0xED4245);
    
    await interaction.editReply({ embeds: [errorEmbed] });
  }
}

function formatUptime(ms) {
  if (!ms) return 'N/A';
  
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) return `${days}d ${hours % 24}h`;
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
  return `${seconds}s`;
}
