import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { getOrCreateUser, ACHIEVEMENTS } from '../../services/gamificationService.js';
import { 
  BRAND, COLORS, EMOJIS, VISUALS, 
  getRank, createProgressBar, formatNumber 
} from '../../config/brandSystem.js';
import { PaginatedEmbed, createAchievementCard } from '../../utils/advancedUI.js';

// Achievement categories for organized display
const ACHIEVEMENT_CATEGORIES = {
  learning: { name: 'Learning', emoji: EMOJIS.learn, color: COLORS.LESSON_BLUE },
  quiz: { name: 'Quiz Master', emoji: EMOJIS.quiz, color: COLORS.QUIZ_GREEN },
  streak: { name: 'Consistency', emoji: EMOJIS.streak, color: COLORS.STREAK_ORANGE },
  social: { name: 'Community', emoji: EMOJIS.social, color: COLORS.PRIMARY },
  special: { name: 'Special', emoji: EMOJIS.trophy, color: COLORS.XP_GOLD }
};

export const data = new SlashCommandBuilder()
  .setName('achievements')
  .setDescription('🏆 View your achievements and progress');

export async function execute(interaction) {
  await interaction.deferReply();

  try {
    const user = await getOrCreateUser(interaction.user.id, interaction.user.username);
    const userAchievements = user.achievements || [];
    const allAchievements = Object.values(ACHIEVEMENTS);
    const rank = getRank(user.level || 1);
    
    // Calculate stats
    const totalAchievements = allAchievements.length;
    const unlockedCount = userAchievements.length;
    const completionPercent = Math.round((unlockedCount / totalAchievements) * 100);
    const totalXPFromAchievements = calculateTotalAchievementXP(userAchievements, allAchievements);

    // Categorize achievements
    const categorized = categorizeAchievements(allAchievements, userAchievements);

    // Create pages for pagination
    const pages = [];
    const achievementsPerPage = 5;

    // ═══ Overview Page ═══
    const overviewEmbed = new EmbedBuilder()
      .setTitle(`${EMOJIS.trophy} Achievement Center`)
      .setColor(COLORS.ACHIEVEMENT_PURPLE)
      .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
      .setDescription(
        `**${interaction.user.username}'s Achievement Progress**\n` +
        `${rank.emoji} **${rank.name}** • Level ${user.level || 1}`
      )
      .addFields(
        { 
          name: `${EMOJIS.stats} Overall Progress`, 
          value: `\`\`\`\n${createAchievementProgressBar(unlockedCount, totalAchievements)}\n` +
            `${unlockedCount} / ${totalAchievements} Unlocked (${completionPercent}%)\n\`\`\``,
          inline: false 
        },
        {
          name: `${EMOJIS.coins} XP Earned from Achievements`,
          value: `**${formatNumber(totalXPFromAchievements)} XP**`,
          inline: true
        },
        {
          name: `${EMOJIS.target} Rarity`,
          value: getCollectorRank(completionPercent),
          inline: true
        }
      );

    // Add category breakdown
    const categoryBreakdown = Object.entries(categorized).map(([catId, data]) => {
      const cat = ACHIEVEMENT_CATEGORIES[catId] || ACHIEVEMENT_CATEGORIES.special;
      return `${cat.emoji} **${cat.name}:** ${data.unlocked}/${data.total}`;
    }).join('\n');

    overviewEmbed.addFields({
      name: `${EMOJIS.topics} By Category`,
      value: categoryBreakdown || 'No categories',
      inline: false
    });

    // Recent achievements
    if (userAchievements.length > 0) {
      const recentDisplay = userAchievements.slice(-3).reverse().map(a => `${EMOJIS.check} **${a}**`).join('\n');
      overviewEmbed.addFields({
        name: `${EMOJIS.sparkle} Recently Unlocked`,
        value: recentDisplay,
        inline: false
      });
    }

    overviewEmbed.setFooter({ text: `${EMOJIS.brain} ${BRAND.name} | Use arrows to browse all achievements` })
      .setTimestamp();

    pages.push(overviewEmbed);

    // ═══ Achievement Detail Pages ═══
    for (let i = 0; i < allAchievements.length; i += achievementsPerPage) {
      const chunk = allAchievements.slice(i, i + achievementsPerPage);
      const pageNum = Math.floor(i / achievementsPerPage) + 1;
      const totalPages = Math.ceil(allAchievements.length / achievementsPerPage);
      
      const pageEmbed = new EmbedBuilder()
        .setTitle(`${EMOJIS.trophy} All Achievements (${pageNum}/${totalPages})`)
        .setColor(COLORS.ACHIEVEMENT_PURPLE)
        .setDescription(chunk.map(ach => {
          const unlocked = userAchievements.includes(ach.name);
          const statusEmoji = unlocked ? EMOJIS.check : EMOJIS.locked;
          const rarity = getAchievementRarity(ach);
          return `${statusEmoji} **${ach.name}** ${rarity}\n` +
            `   └ ${ach.desc}\n` +
            `   └ ${EMOJIS.coins} +${formatNumber(ach.xpBonus || 0)} XP`;
        }).join('\n\n'))
        .setFooter({ text: `${EMOJIS.brain} ${BRAND.name} | Page ${pageNum}/${totalPages}` })
        .setTimestamp();

      pages.push(pageEmbed);
    }

    // Start paginated display
    const paginator = new PaginatedEmbed(interaction, pages);
    await paginator.start();

  } catch (error) {
    console.error('Achievements command error:', error);
    await interaction.editReply({ content: `${EMOJIS.error} Failed to load achievements.` });
  }
}

// ═══════════════════════════════════════════════════════════
// 🔧 HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════

function createAchievementProgressBar(current, max) {
  const length = 20;
  const filled = Math.round((current / max) * length);
  const empty = length - filled;
  return VISUALS.progressBar.full.repeat(filled) + VISUALS.progressBar.empty.repeat(empty);
}

function calculateTotalAchievementXP(userAchievements, allAchievements) {
  return allAchievements
    .filter(ach => userAchievements.includes(ach.name))
    .reduce((sum, ach) => sum + (ach.xpBonus || 0), 0);
}

function categorizeAchievements(allAchievements, userAchievements) {
  const categories = {};
  
  for (const ach of allAchievements) {
    const catId = ach.category || 'special';
    if (!categories[catId]) {
      categories[catId] = { total: 0, unlocked: 0 };
    }
    categories[catId].total++;
    if (userAchievements.includes(ach.name)) {
      categories[catId].unlocked++;
    }
  }
  
  return categories;
}

function getCollectorRank(percent) {
  if (percent >= 100) return `${EMOJIS.crown} **Completionist**`;
  if (percent >= 75) return `${EMOJIS.trophy} **Elite Collector**`;
  if (percent >= 50) return `${EMOJIS.medal} **Dedicated**`;
  if (percent >= 25) return `${EMOJIS.star} **Rising**`;
  return `${EMOJIS.sparkle} **Beginner**`;
}

function getAchievementRarity(achievement) {
  const xp = achievement.xpBonus || 0;
  if (xp >= 500) return `${EMOJIS.crown}`;
  if (xp >= 200) return `${EMOJIS.trophy}`;
  if (xp >= 100) return `${EMOJIS.medal}`;
  return '';
}
