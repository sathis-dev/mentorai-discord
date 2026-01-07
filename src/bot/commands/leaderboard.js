import { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { getLeaderboard, getOrCreateUser } from '../../services/gamificationService.js';
import { 
  BRAND, COLORS, EMOJIS, 
  createLeaderboardEmbed, createNavigationButtons 
} from '../../config/brandSystem.js';
import { checkMobileUser } from '../../utils/mobileUI.js';
import { createMobileLeaderboardEmbed } from '../../embeds/mobile/leaderboardMobile.js';

export const data = new SlashCommandBuilder()
  .setName('leaderboard')
  .setDescription('🏆 View the top learners globally');

export async function execute(interaction) {
  await interaction.deferReply();

  try {
    const users = await getLeaderboard(10);
    const totalPages = Math.ceil(users.length / 10) || 1;
    const isMobile = await checkMobileUser(interaction);
    
    if (isMobile) {
      // Mobile: Compact leaderboard
      const currentUser = await getOrCreateUser(interaction.user.id, interaction.user.username);
      const response = createMobileLeaderboardEmbed(users, 1, totalPages, currentUser, 'xp');
      await interaction.editReply(response);
      return;
    }
    
    // Desktop: Create leaderboard embed with user highlight
    const embed = createLeaderboardEmbed(users, 1, totalPages, interaction.user.id);
    
    // Build component rows
    const components = [];
    
    // Navigation buttons (if more than one page)
    if (users.length >= 10) {
      components.push(createNavigationButtons(1, totalPages, 'leaderboard'));
    }
    
    // Utility row with actions
    const utilityRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('exec_weekly')
        .setLabel('Weekly Challenge')
        .setEmoji(EMOJIS.trophy)
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId('exec_profile')
        .setLabel('My Profile')
        .setEmoji(EMOJIS.profile)
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('help_main')
        .setLabel('Menu')
        .setEmoji(EMOJIS.home)
        .setStyle(ButtonStyle.Secondary)
    );
    components.push(utilityRow);

    await interaction.editReply({ embeds: [embed], components });

  } catch (error) {
    console.error('Leaderboard command error:', error);
    await interaction.editReply({ content: `${EMOJIS.error} Failed to load leaderboard. Please try again!` });
  }
}

// ═══════════════════════════════════════════════════════════
// 🔘 BUTTON HANDLER FOR PAGINATION
// ═══════════════════════════════════════════════════════════

export async function handleButton(interaction, action, params) {
  if (action === 'page') {
    const page = parseInt(params[0], 10) || 1;
    await showPage(interaction, page);
  }
}

async function showPage(interaction, page) {
  try {
    await interaction.deferUpdate();
    
    const users = await getLeaderboard(100); // Get more users for pagination
    const usersPerPage = 10;
    const totalPages = Math.ceil(users.length / usersPerPage) || 1;
    const currentPage = Math.min(Math.max(1, page), totalPages);
    
    const startIndex = (currentPage - 1) * usersPerPage;
    const pageUsers = users.slice(startIndex, startIndex + usersPerPage);
    
    const embed = createLeaderboardEmbed(pageUsers, currentPage, totalPages, interaction.user.id);
    
    const components = [];
    
    // Navigation buttons
    if (totalPages > 1) {
      components.push(createNavigationButtons(currentPage, totalPages, 'leaderboard'));
    }
    
    // Utility row
    const utilityRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('exec_weekly')
        .setLabel('Weekly Challenge')
        .setEmoji(EMOJIS.trophy)
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId('exec_profile')
        .setLabel('My Profile')
        .setEmoji(EMOJIS.profile)
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('help_main')
        .setLabel('Menu')
        .setEmoji(EMOJIS.home)
        .setStyle(ButtonStyle.Secondary)
    );
    components.push(utilityRow);

    await interaction.editReply({ embeds: [embed], components });
    
  } catch (error) {
    console.error('Leaderboard page error:', error);
    await interaction.followUp({ content: `${EMOJIS.error} Failed to load page.`, ephemeral: true });
  }
}
