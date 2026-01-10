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
  showAIQuestionModal,
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

      // Ask AI modal
      if (customId === 'help_ask_ai') {
        return showAIQuestionModal(interaction);
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
          // Special case: quiz should show topic selector, not modal
          if (action.command === 'quiz') {
            const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle } = await import('discord.js');
            
            const embed = new EmbedBuilder()
              .setTitle('🎯 Choose a Quiz Topic')
              .setColor(0x57F287)
              .setDescription('**Select a topic to start your quiz!**\n\nEach quiz gives you XP based on performance.')
              .addFields({
                name: '🏆 Earn XP',
                value: 'Correct answers earn you XP and help build your streak!',
                inline: false
              });

            const topicMenu = new ActionRowBuilder().addComponents(
              new StringSelectMenuBuilder()
                .setCustomId('quiz_topic_select')
                .setPlaceholder('🎯 Select a topic...')
                .addOptions([
                  { label: 'JavaScript', value: 'JavaScript', emoji: '🟨', description: 'Test your JS skills' },
                  { label: 'Python', value: 'Python', emoji: '🐍', description: 'Python programming quiz' },
                  { label: 'React', value: 'React', emoji: '⚛️', description: 'React & components' },
                  { label: 'Node.js', value: 'Node.js', emoji: '🟢', description: 'Backend JS quiz' },
                  { label: 'HTML & CSS', value: 'HTML and CSS', emoji: '🌐', description: 'Web fundamentals' },
                  { label: 'TypeScript', value: 'TypeScript', emoji: '🔷', description: 'Typed JavaScript' },
                  { label: 'SQL', value: 'SQL', emoji: '🗄️', description: 'Database quiz' },
                  { label: 'Git', value: 'Git', emoji: '📦', description: 'Version control' },
                  { label: 'APIs', value: 'APIs', emoji: '🔌', description: 'API concepts' },
                  { label: 'General', value: 'Programming', emoji: '💻', description: 'Mixed topics' }
                ])
            );

            const backButton = new ActionRowBuilder().addComponents(
              new ButtonBuilder()
                .setCustomId('help_main')
                .setLabel('Back to Help')
                .setEmoji('◀️')
                .setStyle(ButtonStyle.Secondary)
            );

            return interaction.update({ embeds: [embed], components: [topicMenu, backButton] });
          }
          
          // Special case: learn should show topic selector
          if (action.command === 'learn') {
            const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle } = await import('discord.js');
            
            const embed = new EmbedBuilder()
              .setTitle('📚 Choose a Learning Topic')
              .setColor(0x5865F2)
              .setDescription('**Select a topic to start your AI-powered lesson!**\n\nLearn anything with personalized explanations.')
              .addFields({
                name: '💡 Tip',
                value: 'Use `/learn topic:YourTopic` for custom topics!',
                inline: false
              });

            const topicMenu = new ActionRowBuilder().addComponents(
              new StringSelectMenuBuilder()
                .setCustomId('learn_topic_select')
                .setPlaceholder('📚 Select a topic...')
                .addOptions([
                  { label: 'JavaScript Basics', value: 'JavaScript basics', emoji: '🟨', description: 'Learn JS fundamentals' },
                  { label: 'Python Basics', value: 'Python basics', emoji: '🐍', description: 'Learn Python fundamentals' },
                  { label: 'React Fundamentals', value: 'React fundamentals', emoji: '⚛️', description: 'Learn React basics' },
                  { label: 'Node.js Basics', value: 'Node.js basics', emoji: '🟢', description: 'Learn backend JS' },
                  { label: 'HTML & CSS', value: 'HTML and CSS basics', emoji: '🌐', description: 'Web fundamentals' },
                  { label: 'TypeScript', value: 'TypeScript basics', emoji: '🔷', description: 'Typed JavaScript' },
                  { label: 'SQL Basics', value: 'SQL basics', emoji: '🗄️', description: 'Database fundamentals' },
                  { label: 'Git & GitHub', value: 'Git and GitHub', emoji: '📦', description: 'Version control' },
                  { label: 'APIs & REST', value: 'REST APIs', emoji: '🔌', description: 'API concepts' },
                  { label: 'Data Structures', value: 'Data structures', emoji: '🧮', description: 'CS fundamentals' }
                ])
            );

            const backButton = new ActionRowBuilder().addComponents(
              new ButtonBuilder()
                .setCustomId('help_main')
                .setLabel('Back to Help')
                .setEmoji('◀️')
                .setStyle(ButtonStyle.Secondary)
            );

            return interaction.update({ embeds: [embed], components: [topicMenu, backButton] });
          }
          
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

      // Handle AI Question modal
      if (interaction.customId === 'help_ai_question_modal') {
        const question = interaction.fields.getTextInputValue('ai_question');
        const topic = interaction.fields.getTextInputValue('ai_topic') || 'general programming';
        
        await interaction.deferReply();
        
        try {
          // Import AI orchestrator dynamically
          const { default: aiOrchestrator } = await import('../../ai/orchestrator.js');
          const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = await import('discord.js');
          
          // Generate AI response
          const response = await aiOrchestrator.generateExplanation(question, topic);
          
          const embed = new EmbedBuilder()
            .setColor(0x5865F2)
            .setAuthor({ name: '🧠 MentorAI Response', iconURL: interaction.client.user.displayAvatarURL() })
            .setTitle(`📚 ${topic}`)
            .setDescription(response.slice(0, 4000))
            .setFooter({ text: `Asked by ${interaction.user.username} • Use /tutor for follow-up questions` })
            .setTimestamp();

          const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setCustomId('help_back_main')
              .setLabel('Back to Help')
              .setEmoji('🏠')
              .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
              .setCustomId('help_ask_ai')
              .setLabel('Ask Another')
              .setEmoji('🧠')
              .setStyle(ButtonStyle.Primary)
          );

          await interaction.editReply({ embeds: [embed], components: [row] });
        } catch (error) {
          console.error('AI Question error:', error);
          await interaction.editReply({
            content: '❌ Sorry, I couldn\'t process your question. Please try `/tutor` for a full conversation!'
          });
        }
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
