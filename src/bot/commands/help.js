/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║   MentorAI Help Command - ULTIMATE V6.0 - Complete Redesign                  ║
 * ║   Personalized Hub + Category Navigation + Smart Suggestions                 ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

import { SlashCommandBuilder } from 'discord.js';
import { User } from '../../database/models/User.js';
import {
  showMainHub,
  showCategoryView,
  showCommandHelp,
  showSearchResults,
  showNewFeatures,
  showPopularCommands,
  showAllCommands,
  showSearchModal,
  showFeedbackModal,
  showTryCommandPrompt,
  showQuickActionPrompt
} from '../../handlers/helpInteractionHandler.js';
import { HELP_CATEGORIES, QUICK_ACTIONS } from '../../config/helpConfig.js';
import { searchCommands, getAllCategories } from '../../utils/helpUtils.js';

// ═══════════════════════════════════════════════════════════════════════════════
// COMMAND DEFINITION
// ═══════════════════════════════════════════════════════════════════════════════

export const data = new SlashCommandBuilder()
  .setName('help')
  .setDescription('📖 Discover all MentorAI features and commands')
  .addStringOption(option =>
    option.setName('command')
      .setDescription('Get detailed help for a specific command')
      .setRequired(false)
      .setAutocomplete(true)
  );

// ═══════════════════════════════════════════════════════════════════════════════
// AUTOCOMPLETE HANDLER
// ═══════════════════════════════════════════════════════════════════════════════

export async function autocomplete(interaction) {
  const focusedValue = interaction.options.getFocused().toLowerCase();
  
  if (!focusedValue) {
    // Show popular commands when no input
    const popularChoices = [
      { name: '📖 /learn - Start interactive AI lessons', value: 'learn' },
      { name: '🎯 /quiz - Take AI-generated quizzes', value: 'quiz' },
      { name: '👤 /profile - View your learning profile', value: 'profile' },
      { name: '🔥 /daily - Daily challenge & streak', value: 'daily' },
      { name: '📚 /flashcard - Practice with flashcards', value: 'flashcard' },
      { name: '🏆 /leaderboard - See top learners', value: 'leaderboard' }
    ];
    return interaction.respond(popularChoices);
  }

  const results = searchCommands(focusedValue);
  const choices = results.slice(0, 25).map(cmd => ({
    name: `${cmd.categoryEmoji} /${cmd.name} - ${cmd.description.slice(0, 40)}`,
    value: cmd.name
  }));

  await interaction.respond(choices);
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN EXECUTE
// ═══════════════════════════════════════════════════════════════════════════════

export async function execute(interaction) {
  try {
    // Get or create user data
    let user = await User.findOne({ discordId: interaction.user.id });
    if (!user) {
      user = await User.create({
        discordId: interaction.user.id,
        username: interaction.user.username,
        level: 1,
        xp: 0,
        streak: 0,
        achievements: [],
        completedLessons: [],
        quizzesTaken: 0,
        correctAnswers: 0,
        totalQuestions: 0
      });
    }

    // Check if user requested specific command help
    const commandName = interaction.options.getString('command');
    
    if (commandName) {
      await showCommandHelp(interaction, commandName, user);
    } else {
      await showMainHub(interaction, user);
    }

  } catch (error) {
    console.error('Help command error:', error);
    
    const errorReply = {
      content: '❌ An error occurred while loading help. Please try again!',
      ephemeral: true
    };

    if (interaction.replied || interaction.deferred) {
      await interaction.editReply(errorReply);
    } else {
      await interaction.reply(errorReply);
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// BUTTON/INTERACTION HANDLERS
// ═══════════════════════════════════════════════════════════════════════════════

export async function handleHelpInteraction(interaction) {
  try {
    // Get user data
    let user = await User.findOne({ discordId: interaction.user.id });
    if (!user) {
      user = { level: 1, xp: 0, streak: 0, achievements: [], completedLessons: [] };
    }

    // Handle select menus
    if (interaction.isStringSelectMenu()) {
      if (interaction.customId === 'help_category_select') {
        const categoryId = interaction.values[0];
        return showCategoryView(interaction, categoryId, user);
      }
      
      if (interaction.customId === 'help_command_select') {
        const commandName = interaction.values[0];
        return showCommandHelp(interaction, commandName, user);
      }
    }

    // Handle buttons
    if (interaction.isButton()) {
      const customId = interaction.customId;

      // Back to main hub (handle both help_main and help_back_main)
      if (customId === 'help_main' || customId === 'help_back_main') {
        return showMainHub(interaction, user);
      }

      // Search modal
      if (customId === 'help_search') {
        return showSearchModal(interaction);
      }

      // New features
      if (customId === 'help_new') {
        return showNewFeatures(interaction, user);
      }

      // Popular commands
      if (customId === 'help_popular') {
        return showPopularCommands(interaction, user);
      }

      // All commands
      if (customId === 'help_all') {
        return showAllCommands(interaction, user);
      }

      // Category navigation
      if (customId.startsWith('help_prev_category_') || customId.startsWith('help_next_category_')) {
        const currentCategoryId = customId.replace('help_prev_category_', '').replace('help_next_category_', '');
        const categories = getAllCategories();
        const currentIndex = categories.findIndex(c => c.id === currentCategoryId);
        
        let newIndex;
        if (customId.startsWith('help_prev_')) {
          newIndex = currentIndex <= 0 ? categories.length - 1 : currentIndex - 1;
        } else {
          newIndex = currentIndex >= categories.length - 1 ? 0 : currentIndex + 1;
        }
        
        return showCategoryView(interaction, categories[newIndex].id, user);
      }

      // Category direct navigation
      if (customId.startsWith('help_category_')) {
        const categoryId = customId.replace('help_category_', '');
        return showCategoryView(interaction, categoryId, user);
      }

      // Try command
      if (customId.startsWith('try_command_')) {
        const commandName = customId.replace('try_command_', '');
        return showTryCommandPrompt(interaction, commandName);
      }

      // Quick actions
      if (customId.startsWith('quick_')) {
        const actionId = customId;
        const allActions = [...QUICK_ACTIONS.row1, ...QUICK_ACTIONS.row2];
        const action = allActions.find(a => a.id === actionId);
        if (action) {
          return showQuickActionPrompt(interaction, action);
        }
      }

      // Feedback
      if (customId === 'help_feedback') {
        return showFeedbackModal(interaction);
      }
    }

    // Handle modal submissions
    if (interaction.isModalSubmit()) {
      if (interaction.customId === 'help_search_modal') {
        const query = interaction.fields.getTextInputValue('search_query');
        await interaction.deferUpdate();
        return showSearchResults(interaction, query, user);
      }

      if (interaction.customId === 'help_feedback_modal') {
        const feedback = interaction.fields.getTextInputValue('feedback_text');
        
        // Log feedback (you can save to database or send to a channel)
        console.log(`[FEEDBACK] From ${interaction.user.tag}: ${feedback}`);
        
        await interaction.reply({
          content: '✅ **Thank you for your feedback!**\n\nYour input helps us improve MentorAI. We read every submission!',
          ephemeral: true
        });
        return;
      }
    }

  } catch (error) {
    console.error('Help interaction error:', error);
    
    try {
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({
          content: '❌ An error occurred. Please try again!',
          ephemeral: true
        });
      } else {
        await interaction.reply({
          content: '❌ An error occurred. Please try again!',
          ephemeral: true
        });
      }
    } catch (e) {
      console.error('Error sending error message:', e);
    }
  }
}
