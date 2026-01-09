// src/handlers/quizInteractionHandler.js
// ═══════════════════════════════════════════════════════════════════
// ULTRA QUIZ SYSTEM - CENTRALIZED INTERACTION HANDLER
// ═══════════════════════════════════════════════════════════════════

import { EmbedBuilder } from 'discord.js';
import { QUIZ_COLORS, QUIZ_EMOJIS } from '../config/quizConfig.js';

// Import command handlers
import * as quizCommand from '../bot/commands/quiz.js';
import * as challengeCommand from '../bot/commands/challenge.js';
import * as tournamentCommand from '../bot/commands/tournament.js';
import * as leaderboardCommand from '../bot/commands/leaderboard.js';
import * as dailychallengeCommand from '../bot/commands/dailychallenge.js';

// ═══════════════════════════════════════════════════════════════════
// BUTTON INTERACTION HANDLER
// ═══════════════════════════════════════════════════════════════════

/**
 * Handle all quiz-related button interactions
 * @param {ButtonInteraction} interaction - Discord button interaction
 * @returns {Promise<boolean>} - Whether the interaction was handled
 */
export async function handleQuizButton(interaction) {
  const customId = interaction.customId;
  
  // Parse the button customId
  // Format: prefix_action_params...
  const parts = customId.split('_');
  const prefix = parts[0];
  const action = parts[1];
  const params = parts.slice(2);

  try {
    switch (prefix) {
      case 'quiz':
        if (quizCommand.handleButton) {
          await quizCommand.handleButton(interaction, action, params);
          return true;
        }
        break;

      case 'challenge':
        if (challengeCommand.handleButton) {
          await challengeCommand.handleButton(interaction, action, params);
          return true;
        }
        break;

      case 'tournament':
        if (tournamentCommand.handleButton) {
          await tournamentCommand.handleButton(interaction, action, params);
          return true;
        }
        break;

      case 'leaderboard':
      case 'lb':
        if (leaderboardCommand.handleButton) {
          await leaderboardCommand.handleButton(interaction, action, params);
          return true;
        }
        break;

      case 'dailychallenge':
        if (dailychallengeCommand.handleButton) {
          await dailychallengeCommand.handleButton(interaction, action, params);
          return true;
        }
        break;
    }

    return false;
  } catch (error) {
    console.error(`Quiz button handler error (${customId}):`, error);
    await sendErrorMessage(interaction);
    return true;
  }
}

// ═══════════════════════════════════════════════════════════════════
// SELECT MENU INTERACTION HANDLER
// ═══════════════════════════════════════════════════════════════════

/**
 * Handle all quiz-related select menu interactions
 * @param {StringSelectMenuInteraction} interaction - Discord select menu interaction
 * @returns {Promise<boolean>} - Whether the interaction was handled
 */
export async function handleQuizSelectMenu(interaction) {
  const customId = interaction.customId;
  const parts = customId.split('_');
  const prefix = parts[0];
  const menuType = parts.slice(1).join('_');

  try {
    switch (prefix) {
      case 'quiz':
        if (menuType === 'topic_select') {
          // Handle topic selection from quiz hub
          const selectedTopic = interaction.values[0];
          await handleTopicSelection(interaction, selectedTopic);
          return true;
        }
        break;

      case 'lb':
        if (leaderboardCommand.handleSelectMenu) {
          await leaderboardCommand.handleSelectMenu(interaction, menuType);
          return true;
        }
        break;
    }

    return false;
  } catch (error) {
    console.error(`Quiz select menu handler error (${customId}):`, error);
    await sendErrorMessage(interaction);
    return true;
  }
}

// ═══════════════════════════════════════════════════════════════════
// MODAL SUBMIT HANDLER
// ═══════════════════════════════════════════════════════════════════

/**
 * Handle all quiz-related modal submissions
 * @param {ModalSubmitInteraction} interaction - Discord modal submit interaction
 * @returns {Promise<boolean>} - Whether the interaction was handled
 */
export async function handleQuizModal(interaction) {
  const customId = interaction.customId;

  try {
    if (customId === 'dailychallenge_solution_modal') {
      if (dailychallengeCommand.handleModalSubmit) {
        await dailychallengeCommand.handleModalSubmit(interaction);
        return true;
      }
    }

    return false;
  } catch (error) {
    console.error(`Quiz modal handler error (${customId}):`, error);
    await sendErrorMessage(interaction);
    return true;
  }
}

// ═══════════════════════════════════════════════════════════════════
// AUTOCOMPLETE HANDLER
// ═══════════════════════════════════════════════════════════════════

/**
 * Handle quiz-related autocomplete interactions
 * @param {AutocompleteInteraction} interaction - Discord autocomplete interaction
 * @returns {Promise<boolean>} - Whether the interaction was handled
 */
export async function handleQuizAutocomplete(interaction) {
  const commandName = interaction.commandName;
  const focusedOption = interaction.options.getFocused(true);

  if (focusedOption.name !== 'topic') {
    return false;
  }

  try {
    const query = focusedOption.value.toLowerCase();
    
    // Import topics from config
    const { QUIZ_TOPICS } = await import('../config/quizConfig.js');
    
    const topics = Object.entries(QUIZ_TOPICS)
      .filter(([key, data]) => 
        key.includes(query) || 
        data.name.toLowerCase().includes(query)
      )
      .slice(0, 25)
      .map(([key, data]) => ({
        name: `${data.emoji} ${data.name}`,
        value: data.name
      }));

    // Add custom topic option if query doesn't match existing topics
    if (query.length > 0 && !topics.some(t => t.value.toLowerCase() === query)) {
      topics.unshift({
        name: `📝 Custom: ${focusedOption.value}`,
        value: focusedOption.value
      });
    }

    await interaction.respond(topics);
    return true;
  } catch (error) {
    console.error('Quiz autocomplete error:', error);
    await interaction.respond([]).catch(() => {});
    return true;
  }
}

// ═══════════════════════════════════════════════════════════════════
// TOPIC SELECTION HANDLER
// ═══════════════════════════════════════════════════════════════════

async function handleTopicSelection(interaction, topicKey) {
  const { QUIZ_TOPICS } = await import('../config/quizConfig.js');
  const { createQuizSession, getCurrentQuestion } = await import('../services/quizService.js');
  const { getOrCreateUser } = await import('../services/gamificationService.js');
  
  await interaction.deferUpdate();

  const topicData = QUIZ_TOPICS[topicKey] || { name: topicKey, emoji: '📚' };
  const difficulty = 'medium';
  const numQuestions = 5;

  try {
    const user = await getOrCreateUser(interaction.user.id, interaction.user.username);

    // Show loading message
    const loadingEmbed = new EmbedBuilder()
      .setColor(QUIZ_COLORS.INFO)
      .setTitle(`${QUIZ_EMOJIS.LOADING} Starting Quiz...`)
      .setDescription(`
Generating **${topicData.name}** quiz...

${topicData.emoji} **Topic:** ${topicData.name}
🟡 **Difficulty:** Medium
📝 **Questions:** ${numQuestions}
      `)
      .setFooter({ text: 'Please wait...' });

    await interaction.editReply({ embeds: [loadingEmbed], components: [] });

    // Create quiz session
    const session = await createQuizSession(
      interaction.user.id, 
      topicData.name, 
      numQuestions, 
      difficulty
    );

    if (!session || !session.questions?.length) {
      const errorEmbed = new EmbedBuilder()
        .setColor(QUIZ_COLORS.DANGER)
        .setTitle(`${QUIZ_EMOJIS.INCORRECT} Quiz Generation Failed`)
        .setDescription('Could not generate quiz. Please try a different topic.')
        .setFooter({ text: 'Use /quiz topic:YourTopic' });

      return interaction.editReply({ embeds: [errorEmbed], components: [] });
    }

    // Get first question and show it
    const questionData = await getCurrentQuestion(interaction.user.id);
    
    if (questionData && quizCommand.handleButton) {
      // Use the quiz command's showQuestion indirectly by calling handleButton
      // In this case, we'll construct the question embed ourselves
      
      const { createProgressBar } = await import('../utils/quizUtils.js');
      const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = await import('discord.js');
      const { ASCII_ART, DIFFICULTY } = await import('../config/quizConfig.js');

      const diffData = DIFFICULTY[difficulty];
      const progressBar = createProgressBar(1, numQuestions, 10);

      const questionEmbed = new EmbedBuilder()
        .setColor(topicData.color || QUIZ_COLORS.PRIMARY)
        .setAuthor({ 
          name: `${topicData.emoji} ${topicData.name} Quiz`,
          iconURL: interaction.user.displayAvatarURL()
        })
        .setTitle(`Question 1 of ${numQuestions}`)
        .setDescription(`
\`╔${progressBar}╗\` **10%**

${ASCII_ART.dividerThin}

${QUIZ_EMOJIS.BRAIN} **${questionData.question}**

${ASCII_ART.dividerThin}

${QUIZ_EMOJIS.OPTION_A} ${questionData.options[0]}
${QUIZ_EMOJIS.OPTION_B} ${questionData.options[1]}
${QUIZ_EMOJIS.OPTION_C} ${questionData.options[2]}
${QUIZ_EMOJIS.OPTION_D} ${questionData.options[3]}

${ASCII_ART.dividerThin}

${diffData.emoji} **${diffData.name}** • ⏱️ ${diffData.timeLimit}s
        `)
        .setFooter({ text: `${QUIZ_EMOJIS.LIGHTNING} Select your answer below • ${user.streak || 0}🔥 streak` })
        .setTimestamp();

      const answerRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('quiz_answer_0_1')
          .setLabel('A')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('quiz_answer_1_1')
          .setLabel('B')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('quiz_answer_2_1')
          .setLabel('C')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('quiz_answer_3_1')
          .setLabel('D')
          .setStyle(ButtonStyle.Primary)
      );

      const controlRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('quiz_skip')
          .setLabel('Skip')
          .setEmoji(QUIZ_EMOJIS.SKIPPED)
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId('quiz_hint')
          .setLabel('Hint')
          .setEmoji('💡')
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId('quiz_end')
          .setLabel('End Quiz')
          .setEmoji('🛑')
          .setStyle(ButtonStyle.Danger)
      );

      await interaction.editReply({
        embeds: [questionEmbed],
        components: [answerRow, controlRow]
      });
    }
  } catch (error) {
    console.error('Topic selection error:', error);
    await sendErrorMessage(interaction);
  }
}

// ═══════════════════════════════════════════════════════════════════
// ERROR MESSAGE HELPER
// ═══════════════════════════════════════════════════════════════════

async function sendErrorMessage(interaction) {
  const errorEmbed = new EmbedBuilder()
    .setColor(QUIZ_COLORS.DANGER)
    .setTitle(`${QUIZ_EMOJIS.INCORRECT} Error`)
    .setDescription('Something went wrong. Please try again!')
    .setFooter({ text: '🎓 MentorAI' });

  try {
    if (interaction.deferred || interaction.replied) {
      await interaction.followUp({ embeds: [errorEmbed], ephemeral: true });
    } else {
      await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
    }
  } catch (e) {
    console.error('Error sending error message:', e);
  }
}

// ═══════════════════════════════════════════════════════════════════
// CHECK IF QUIZ-RELATED
// ═══════════════════════════════════════════════════════════════════

/**
 * Check if an interaction is quiz-related
 * @param {Interaction} interaction - Discord interaction
 * @returns {boolean} - Whether this is a quiz-related interaction
 */
export function isQuizInteraction(interaction) {
  if (!interaction.customId) return false;
  
  const quizPrefixes = [
    'quiz_',
    'challenge_',
    'tournament_',
    'leaderboard_',
    'lb_',
    'dailychallenge_'
  ];

  return quizPrefixes.some(prefix => interaction.customId.startsWith(prefix));
}

// ═══════════════════════════════════════════════════════════════════
// MAIN HANDLER
// ═══════════════════════════════════════════════════════════════════

/**
 * Main entry point for quiz interactions
 * @param {Interaction} interaction - Discord interaction
 * @returns {Promise<boolean>} - Whether the interaction was handled
 */
export async function handleQuizInteraction(interaction) {
  try {
    if (interaction.isButton()) {
      return await handleQuizButton(interaction);
    }

    if (interaction.isStringSelectMenu()) {
      return await handleQuizSelectMenu(interaction);
    }

    if (interaction.isModalSubmit()) {
      return await handleQuizModal(interaction);
    }

    if (interaction.isAutocomplete()) {
      const quizCommands = ['quiz', 'challenge', 'tournament'];
      if (quizCommands.includes(interaction.commandName)) {
        return await handleQuizAutocomplete(interaction);
      }
    }

    return false;
  } catch (error) {
    console.error('Quiz interaction handler error:', error);
    return false;
  }
}

export default {
  handleQuizButton,
  handleQuizSelectMenu,
  handleQuizModal,
  handleQuizAutocomplete,
  handleQuizInteraction,
  isQuizInteraction
};
