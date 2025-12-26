import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { getOrCreateUser, ACHIEVEMENTS } from '../../services/gamificationService.js';
import { COLORS } from '../../config/designSystem.js';
import { PaginatedEmbed, createAchievementCard } from '../../utils/advancedUI.js';

export const data = new SlashCommandBuilder()
  .setName('achievements')
  .setDescription('🏆 View your achievements and progress');

export async function execute(interaction) {
  await interaction.deferReply();

  try {
    const user = await getOrCreateUser(interaction.user.id, interaction.user.username);
    const userAchievements = user.achievements || [];
    const allAchievements = Object.values(ACHIEVEMENTS);

    // Create pages for pagination
    const pages = [];
    const achievementsPerPage = 5;

    // Overview page
    const overviewEmbed = new EmbedBuilder()
      .setTitle('🏆 Achievement Center')
      .setColor(COLORS.ACHIEVEMENT_PURPLE)
      .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
      .setDescription('**' + interaction.user.username + '\'s Achievement Progress**')
      .addFields(
        { 
          name: '📊 Progress', 
          value: '```\n' + createProgressBar(userAchievements.length, allAchievements.length, 15) + '\n' +
            userAchievements.length + ' / ' + allAchievements.length + ' Unlocked\n```',
          inline: false 
        },
        {
          name: '✅ Unlocked Achievements',
          value: userAchievements.length > 0 
            ? userAchievements.slice(0, 5).map(a => '🏆 ' + a).join('\n') 
            : '_No achievements yet! Start learning to unlock them._',
          inline: false
        }
      )
      .setFooter({ text: '🎓 MentorAI | Use arrows to browse all achievements' })
      .setTimestamp();

    pages.push(overviewEmbed);

    // Achievement detail pages
    for (let i = 0; i < allAchievements.length; i += achievementsPerPage) {
      const chunk = allAchievements.slice(i, i + achievementsPerPage);
      
      const pageEmbed = new EmbedBuilder()
        .setTitle('🏆 All Achievements (' + (Math.floor(i / achievementsPerPage) + 1) + '/' + 
          Math.ceil(allAchievements.length / achievementsPerPage) + ')')
        .setColor(COLORS.ACHIEVEMENT_PURPLE)
        .setDescription(chunk.map(ach => {
          const unlocked = userAchievements.includes(ach.name);
          return (unlocked ? '✅' : '🔒') + ' **' + ach.name + '**\n' +
            '   └ ' + ach.desc + ' (+' + (ach.xpBonus || 0) + ' XP)';
        }).join('\n\n'))
        .setFooter({ text: '🎓 MentorAI' })
        .setTimestamp();

      pages.push(pageEmbed);
    }

    // Start paginated display
    const paginator = new PaginatedEmbed(interaction, pages);
    await paginator.start();

  } catch (error) {
    console.error('Achievements command error:', error);
    await interaction.editReply({ content: '❌ Failed to load achievements.' });
  }
}

function createProgressBar(current, max, length) {
  const filled = Math.round((current / max) * length);
  const empty = length - filled;
  return '█'.repeat(filled) + '░'.repeat(empty);
}
