/**
 * Quiz Command - Complete Implementation
 * 
 * Features:
 * - AI question generation with fallback
 * - Multiple difficulty levels
 * - Lifelines (Hint, 50/50)
 * - Timer mode
 * - XP rewards
 * - Session management
 */

import { 
  SlashCommandBuilder, 
  EmbedBuilder, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle,
  ComponentType
} from 'discord.js';
import { QuizEngine } from '../../services/quiz/engine.js';
import { getOrCreateUser } from '../../services/gamificationService.js';
import { 
  BRAND, COLORS, EMOJIS,
  getTopicEmoji, getDifficultyEmoji
} from '../../config/brandSystem.js';

// Singleton quiz engine
const quizEngine = new QuizEngine();

// Topic suggestions for autocomplete
const TOPICS = [
  'Python', 'JavaScript', 'Java', 'C++', 'C#',
  'HTML', 'CSS', 'React', 'Node.js', 'TypeScript',
  'Algorithms', 'Data Structures', 'SQL', 'Git',
  'Linux', 'Docker', 'AWS', 'Machine Learning',
  'Data Science', 'Web Development', 'Mobile Development',
  'Vue.js', 'Angular', 'MongoDB', 'PostgreSQL',
  'REST API', 'GraphQL', 'DevOps', 'Kubernetes'
];

export const data = new SlashCommandBuilder()
  .setName('quiz')
  .setDescription('🎯 Take an AI-generated quiz on any topic')
  .addStringOption(option =>
    option.setName('topic')
      .setDescription('What topic do you want to be quizzed on?')
      .setRequired(false)
      .setAutocomplete(true))
  .addIntegerOption(option =>
    option.setName('questions')
      .setDescription('Number of questions (1-10)')
      .setMinValue(1)
      .setMaxValue(10))
  .addStringOption(option =>
    option.setName('difficulty')
      .setDescription('Quiz difficulty level')
      .addChoices(
        { name: '🧠 Easy (80% XP)', value: 'easy' },
        { name: '⚡ Medium (100% XP)', value: 'medium' },
        { name: '🔥 Hard (150% XP)', value: 'hard' }
      ))
  .addBooleanOption(option =>
    option.setName('timed')
      .setDescription('Enable timer (60 seconds per question)'));

/**
 * Autocomplete handler for topic
 */
export async function autocomplete(interaction) {
  const focusedValue = interaction.options.getFocused().toLowerCase();
  
  const filtered = TOPICS
    .filter(topic => topic.toLowerCase().includes(focusedValue))
    .slice(0, 25);
  
  await interaction.respond(
    filtered.map(topic => ({ name: topic, value: topic }))
  );
}

/**
 * Main execute function
 */
export async function execute(interaction) {
  await interaction.deferReply();

  const userId = interaction.user.id;
  const topic = interaction.options.getString('topic') || 'Programming';
  const numQuestions = interaction.options.getInteger('questions') || 5;
  const difficulty = interaction.options.getString('difficulty') || 'medium';
  const timed = interaction.options.getBoolean('timed') || false;

  try {
    // Get or create user
    const user = await getOrCreateUser(userId, interaction.user.username);
    if (user.updateStreak) await user.updateStreak();

    // Check for active session
    const existingSession = quizEngine.getActiveSession ? 
      await getActiveSessionForUser(userId) : null;
    
    if (existingSession) {
      const embed = new EmbedBuilder()
        .setColor(COLORS.WARNING || '#f59e0b')
        .setTitle('⏳ Quiz Already In Progress!')
        .setDescription('You already have an active quiz! Please complete it first.')
        .addFields(
          { name: 'Current Topic', value: existingSession.topic, inline: true },
          { name: 'Progress', value: `${existingSession.currentQuestion + 1}/${existingSession.questions.length}`, inline: true },
          { name: 'Score', value: `${existingSession.score}`, inline: true }
        )
        .setFooter({ text: 'Complete or cancel your current quiz to start a new one' });
      
      return interaction.editReply({ embeds: [embed] });
    }

    // Show loading
    const loadingEmbed = new EmbedBuilder()
      .setTitle('🎯 Generating Your Quiz')
      .setColor(COLORS.PRIMARY || '#5865F2')
      .setDescription(`Analyzing topic: **${topic}**\nCreating ${numQuestions} questions...`)
      .setFooter({ text: '🎓 MentorAI • Please wait...' });
    
    await interaction.editReply({ embeds: [loadingEmbed] });

    // Start quiz session
    const session = await quizEngine.startQuiz(userId, {
      topic,
      difficulty,
      count: numQuestions,
      timeLimit: timed ? 60000 : null
    });

    if (!session || !session.question) {
      throw new Error('Failed to create quiz session');
    }

    // Store channel ID for later reference
    session.channelId = interaction.channelId;
    session.messageId = (await interaction.fetchReply()).id;

    // Send first question
    await sendQuestion(interaction, session, 'editReply');

  } catch (error) {
    console.error('Quiz command error:', error);

    const errorEmbed = new EmbedBuilder()
      .setTitle('❌ Quiz Failed to Start')
      .setColor(COLORS.ERROR || '#ef4444')
      .setDescription('Something went wrong while creating your quiz.')
      .addFields(
        { name: 'Error', value: error.message?.slice(0, 100) || 'Unknown error' },
        { name: 'Suggestion', value: 'Try a different topic or fewer questions' }
      )
      .setFooter({ text: `${EMOJIS?.brain || '🧠'} ${BRAND?.name || 'MentorAI'}` });

    await interaction.editReply({ embeds: [errorEmbed], components: [] });
  }
}

/**
 * Button handler - called from interaction handler
 */
export async function handleButton(interaction, action, params) {
  const sessionId = params[0];
  
  try {
    switch (action) {
      case 'answer':
        const answerIndex = parseInt(params[1]);
        await handleAnswer(interaction, sessionId, answerIndex);
        break;
      case 'hint':
        await handleHint(interaction, sessionId);
        break;
      case 'fifty':
        await handleFiftyFifty(interaction, sessionId);
        break;
      case 'skip':
        await handleSkip(interaction, sessionId);
        break;
      case 'cancel':
        await handleCancel(interaction, sessionId);
        break;
      case 'next':
        await handleNext(interaction, sessionId);
        break;
      default:
        console.log('Unknown quiz action:', action);
    }
  } catch (error) {
    console.error('Quiz button error:', error);
    await interaction.reply({
      content: `❌ ${error.message || 'An error occurred'}`,
      ephemeral: true
    }).catch(() => {});
  }
}

/**
 * Handle answer submission
 */
async function handleAnswer(interaction, sessionId, answerIndex) {
  const session = await quizEngine.getSession(sessionId);
  
  if (!session) {
    return interaction.reply({
      content: '❌ Quiz session not found or expired!',
      ephemeral: true
    });
  }

  // Check if correct user
  if (session.discordId !== interaction.user.id) {
    return interaction.reply({
      content: '❌ This is not your quiz!',
      ephemeral: true
    });
  }

  // Submit answer
  const result = await quizEngine.submitAnswer(sessionId, answerIndex);
  
  // Create result embed
  const embed = new EmbedBuilder()
    .setColor(result.correct ? '#10b981' : '#ef4444')
    .setTitle(result.correct ? '✅ Correct!' : '❌ Incorrect')
    .setDescription(result.correct 
      ? `You selected: **${result.selectedAnswer}**. Well done!` 
      : `You selected: **${result.selectedAnswer}**\nCorrect answer: **${result.correctAnswer}**`)
    .addFields(
      { name: '📝 Explanation', value: result.explanation || 'No explanation available.', inline: false },
      { name: '📊 Score', value: `${result.score}/${result.totalQuestions}`, inline: true },
      { name: '📌 Question', value: `${result.questionNumber}/${result.totalQuestions}`, inline: true }
    )
    .setFooter({ text: result.isLastQuestion ? 'Quiz complete! Calculating results...' : 'Next question in 3 seconds...' });

  // Update message with result and disable buttons
  const disabledRow = createDisabledAnswerButtons(answerIndex, result.correctIndex);
  
  await interaction.update({
    embeds: [embed],
    components: [disabledRow]
  });

  // Wait and show next question or complete
  setTimeout(async () => {
    try {
      if (result.isLastQuestion) {
        await completeQuiz(interaction, sessionId);
      } else {
        const nextResult = await quizEngine.nextQuestion(sessionId);
        if (nextResult.completed) {
          await completeQuiz(interaction, sessionId);
        } else {
          await sendQuestion(interaction, {
            sessionId,
            question: nextResult.question,
            totalQuestions: nextResult.totalQuestions,
            topic: session.topic,
            difficulty: session.difficulty,
            score: nextResult.score,
            lifelines: nextResult.lifelines
          }, 'edit');
        }
      }
    } catch (error) {
      console.error('Error advancing quiz:', error);
    }
  }, 3000);
}

/**
 * Handle hint lifeline
 */
async function handleHint(interaction, sessionId) {
  try {
    const hint = await quizEngine.useHint(sessionId);
    
    const embed = new EmbedBuilder()
      .setColor('#f59e0b')
      .setTitle('💡 Hint')
      .setDescription(hint.hint)
      .addFields(
        { name: '🎯 Concept', value: hint.concept, inline: true }
      )
      .setFooter({ text: 'Choose your answer carefully!' });

    await interaction.reply({ embeds: [embed], ephemeral: true });
  } catch (error) {
    await interaction.reply({
      content: `❌ ${error.message}`,
      ephemeral: true
    });
  }
}

/**
 * Handle 50/50 lifeline
 */
async function handleFiftyFifty(interaction, sessionId) {
  try {
    const result = await quizEngine.useFiftyFifty(sessionId);
    const session = await quizEngine.getSession(sessionId);
    
    const options = ['A', 'B', 'C', 'D'];
    const question = session.questions[session.currentQuestion];
    
    const embed = new EmbedBuilder()
      .setColor('#8b5cf6')
      .setTitle('🎯 50/50 Lifeline Used!')
      .setDescription('Two incorrect answers have been eliminated.')
      .addFields(
        { 
          name: '❌ Eliminated', 
          value: result.eliminated.map(idx => `${options[idx]}. ${question.options[idx]}`).join('\n'),
          inline: true
        },
        { 
          name: '✅ Remaining', 
          value: result.remainingOptions.map(idx => `${options[idx]}. ${question.options[idx]}`).join('\n'),
          inline: true
        }
      )
      .setFooter({ text: 'Choose from the remaining options!' });

    await interaction.reply({ embeds: [embed], ephemeral: true });

    // Update the question message with disabled buttons
    await updateQuestionWithEliminated(interaction, session, result.eliminated);
  } catch (error) {
    await interaction.reply({
      content: `❌ ${error.message}`,
      ephemeral: true
    });
  }
}

/**
 * Handle skip
 */
async function handleSkip(interaction, sessionId) {
  const session = await quizEngine.getSession(sessionId);
  
  if (!session) {
    return interaction.reply({
      content: '❌ Quiz session not found!',
      ephemeral: true
    });
  }

  // Submit -1 as skip
  const result = await quizEngine.submitAnswer(sessionId, -1);
  
  const embed = new EmbedBuilder()
    .setColor('#f59e0b')
    .setTitle('⏭️ Question Skipped')
    .setDescription('This question has been skipped and counts as incorrect.')
    .addFields(
      { name: 'Correct Answer', value: result.correctAnswer, inline: true },
      { name: 'Current Score', value: `${result.score}/${result.totalQuestions}`, inline: true }
    );

  await interaction.update({
    embeds: [embed],
    components: []
  });

  // Move to next question
  setTimeout(async () => {
    try {
      if (result.isLastQuestion) {
        await completeQuiz(interaction, sessionId);
      } else {
        const nextResult = await quizEngine.nextQuestion(sessionId);
        await sendQuestion(interaction, {
          sessionId,
          question: nextResult.question,
          totalQuestions: nextResult.totalQuestions,
          topic: session.topic,
          difficulty: session.difficulty,
          score: nextResult.score,
          lifelines: nextResult.lifelines
        }, 'edit');
      }
    } catch (error) {
      console.error('Error after skip:', error);
    }
  }, 2000);
}

/**
 * Handle cancel
 */
async function handleCancel(interaction, sessionId) {
  const session = await quizEngine.getSession(sessionId);
  
  if (!session) {
    return interaction.reply({
      content: '❌ Quiz session not found!',
      ephemeral: true
    });
  }

  // Create confirmation buttons
  const confirmRow = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId(`quiz_confirmcancel_${sessionId}`)
        .setLabel('Yes, Cancel Quiz')
        .setStyle(ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId(`quiz_denycancel_${sessionId}`)
        .setLabel('No, Continue')
        .setStyle(ButtonStyle.Secondary)
    );

  const embed = new EmbedBuilder()
    .setColor('#ef4444')
    .setTitle('⚠️ Cancel Quiz?')
    .setDescription('Are you sure you want to cancel? All progress will be lost!')
    .addFields(
      { name: 'Current Score', value: `${session.score}/${session.questions.length}`, inline: true },
      { name: 'Topic', value: session.topic, inline: true }
    );

  await interaction.reply({
    embeds: [embed],
    components: [confirmRow],
    ephemeral: true
  });

  // Collect response
  const collector = interaction.channel.createMessageComponentCollector({
    componentType: ComponentType.Button,
    filter: i => i.user.id === interaction.user.id && 
                 (i.customId === `quiz_confirmcancel_${sessionId}` || 
                  i.customId === `quiz_denycancel_${sessionId}`),
    time: 15000,
    max: 1
  });

  collector.on('collect', async (i) => {
    if (i.customId.includes('confirmcancel')) {
      await quizEngine.abandonSession(session.discordId);
      
      await i.update({
        embeds: [new EmbedBuilder()
          .setColor('#ef4444')
          .setTitle('❌ Quiz Cancelled')
          .setDescription('Your quiz has been cancelled. No XP was earned.')
        ],
        components: []
      });

      // Update original message
      try {
        await interaction.message.edit({
          embeds: [new EmbedBuilder()
            .setColor('#ef4444')
            .setTitle('❌ Quiz Cancelled')
            .setDescription(`This quiz was cancelled by ${interaction.user.username}.`)
          ],
          components: []
        });
      } catch (e) {}
    } else {
      await i.update({
        content: '✅ Quiz continues!',
        embeds: [],
        components: []
      });
    }
  });
}

/**
 * Handle next question
 */
async function handleNext(interaction, sessionId) {
  try {
    const nextResult = await quizEngine.nextQuestion(sessionId);
    const session = await quizEngine.getSession(sessionId);
    
    if (nextResult.completed) {
      await completeQuiz(interaction, sessionId);
    } else {
      await sendQuestion(interaction, {
        sessionId,
        question: nextResult.question,
        totalQuestions: nextResult.totalQuestions,
        topic: session?.topic || 'Quiz',
        difficulty: session?.difficulty || 'medium',
        score: nextResult.score,
        lifelines: nextResult.lifelines
      }, 'update');
    }
  } catch (error) {
    await interaction.reply({
      content: `❌ ${error.message}`,
      ephemeral: true
    });
  }
}

/**
 * Send question embed with buttons
 */
async function sendQuestion(interaction, session, method = 'editReply') {
  const question = session.question;
  const eliminated = session.lifelines?.eliminatedOptions || [];

  const embed = new EmbedBuilder()
    .setColor('#5865F2')
    .setTitle(`📝 Question ${question.questionNumber}/${session.totalQuestions}`)
    .setDescription(`**${question.text}**`)
    .addFields(
      { name: `${getTopicEmoji(session.topic)} Topic`, value: session.topic, inline: true },
      { name: `${getDifficultyEmoji(session.difficulty)} Difficulty`, value: capitalize(session.difficulty), inline: true },
      { name: '📊 Score', value: `${session.score || 0}/${session.totalQuestions}`, inline: true }
    )
    .setFooter({ text: `Session: ${session.sessionId.slice(0, 8)}` });

  // Answer buttons
  const answerRow = new ActionRowBuilder();
  question.options.forEach((opt, index) => {
    const isEliminated = eliminated.includes(index);
    answerRow.addComponents(
      new ButtonBuilder()
        .setCustomId(`quiz_answer_${session.sessionId}_${index}`)
        .setLabel(`${opt.label}. ${opt.text.slice(0, 40)}`)
        .setStyle(ButtonStyle.Primary)
        .setDisabled(isEliminated)
    );
  });

  // Lifeline buttons
  const lifelineRow = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId(`quiz_hint_${session.sessionId}`)
        .setLabel('Hint')
        .setEmoji('💡')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(!session.lifelines?.hint),
      new ButtonBuilder()
        .setCustomId(`quiz_fifty_${session.sessionId}`)
        .setLabel('50/50')
        .setEmoji('🎯')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(!session.lifelines?.fiftyFifty)
    );

  // Control buttons
  const controlRow = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId(`quiz_skip_${session.sessionId}`)
        .setLabel('Skip')
        .setEmoji('⏭️')
        .setStyle(ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId(`quiz_cancel_${session.sessionId}`)
        .setLabel('Cancel')
        .setEmoji('❌')
        .setStyle(ButtonStyle.Danger)
    );

  const payload = {
    embeds: [embed],
    components: [answerRow, lifelineRow, controlRow]
  };

  if (method === 'editReply') {
    await interaction.editReply(payload);
  } else if (method === 'edit') {
    await interaction.message.edit(payload);
  } else if (method === 'update') {
    await interaction.update(payload);
  }
}

/**
 * Complete quiz and show results
 */
async function completeQuiz(interaction, sessionId) {
  try {
    const result = await quizEngine.completeQuiz(sessionId);
    
    const accuracy = result.accuracy || Math.round((result.score / result.totalQuestions) * 100);
    const performanceMsg = getPerformanceMessage(accuracy);

    const embed = new EmbedBuilder()
      .setColor('#10b981')
      .setTitle('🎉 Quiz Complete!')
      .setDescription(`You completed the **${result.topic}** quiz!`)
      .addFields(
        { name: '📊 Score', value: `${result.score}/${result.totalQuestions}`, inline: true },
        { name: '🎯 Accuracy', value: `${accuracy}%`, inline: true },
        { name: '⭐ XP Earned', value: `${result.xp?.earned || 0} XP`, inline: true },
        { name: '🏆 Performance', value: performanceMsg, inline: true },
        { name: '⏱️ Time', value: formatTime(result.timeTaken), inline: true },
        { name: '🔥 Difficulty', value: capitalize(result.difficulty), inline: true }
      );

    // Level up notification
    if (result.levelUp) {
      embed.addFields({
        name: '🎯 LEVEL UP!',
        value: `Congratulations! You reached **Level ${result.levelUp.newLevel}**!`,
        inline: false
      });
    }

    // XP breakdown
    if (result.xp?.breakdown) {
      const breakdownText = Object.entries(result.xp.breakdown)
        .map(([key, value]) => `${key}: +${value}`)
        .join('\n');
      embed.addFields({
        name: '💰 XP Breakdown',
        value: breakdownText || 'Base XP earned',
        inline: false
      });
    }

    // Next steps
    embed.addFields({
      name: '🚀 Next Steps',
      value: getNextSteps(accuracy, result.topic),
      inline: false
    });

    // Try to edit the message
    try {
      await interaction.message.edit({
        embeds: [embed],
        components: []
      });
    } catch (e) {
      // Message might be stale, try followUp
      await interaction.followUp({
        embeds: [embed]
      }).catch(() => {});
    }
  } catch (error) {
    console.error('Error completing quiz:', error);
  }
}

/**
 * Create disabled answer buttons showing correct answer
 */
function createDisabledAnswerButtons(selectedIndex, correctIndex) {
  const row = new ActionRowBuilder();
  const labels = ['A', 'B', 'C', 'D'];
  
  for (let i = 0; i < 4; i++) {
    let style = ButtonStyle.Secondary;
    if (i === correctIndex) style = ButtonStyle.Success;
    else if (i === selectedIndex && i !== correctIndex) style = ButtonStyle.Danger;
    
    row.addComponents(
      new ButtonBuilder()
        .setCustomId(`quiz_disabled_${i}`)
        .setLabel(labels[i])
        .setStyle(style)
        .setDisabled(true)
    );
  }
  
  return row;
}

/**
 * Update question with eliminated options
 */
async function updateQuestionWithEliminated(interaction, session, eliminated) {
  try {
    const question = session.questions[session.currentQuestion];
    
    const answerRow = new ActionRowBuilder();
    const labels = ['A', 'B', 'C', 'D'];
    
    question.options.forEach((opt, index) => {
      const isEliminated = eliminated.includes(index);
      answerRow.addComponents(
        new ButtonBuilder()
          .setCustomId(`quiz_answer_${session.sessionId}_${index}`)
          .setLabel(`${labels[index]}. ${opt.slice(0, 40)}`)
          .setStyle(isEliminated ? ButtonStyle.Secondary : ButtonStyle.Primary)
          .setDisabled(isEliminated)
      );
    });

    // Keep other rows
    const lifelineRow = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId(`quiz_hint_${session.sessionId}`)
          .setLabel('Hint')
          .setEmoji('💡')
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(session.lifelines.hintUsed),
        new ButtonBuilder()
          .setCustomId(`quiz_fifty_${session.sessionId}`)
          .setLabel('50/50')
          .setEmoji('🎯')
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(true) // Already used
      );

    const controlRow = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId(`quiz_skip_${session.sessionId}`)
          .setLabel('Skip')
          .setEmoji('⏭️')
          .setStyle(ButtonStyle.Danger),
        new ButtonBuilder()
          .setCustomId(`quiz_cancel_${session.sessionId}`)
          .setLabel('Cancel')
          .setEmoji('❌')
          .setStyle(ButtonStyle.Danger)
      );

    await interaction.message.edit({
      components: [answerRow, lifelineRow, controlRow]
    });
  } catch (error) {
    console.error('Error updating question:', error);
  }
}

/**
 * Get active session for user
 */
async function getActiveSessionForUser(userId) {
  try {
    const { QuizSession } = await import('../../database/models/QuizSession.js');
    return await QuizSession.findOne({ discordId: userId, status: 'active' });
  } catch (e) {
    return null;
  }
}

/**
 * Helper functions
 */
function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function formatTime(ms) {
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds}s`;
}

function getPerformanceMessage(accuracy) {
  if (accuracy === 100) return '🏅 Perfect Score!';
  if (accuracy >= 90) return '🌟 Excellent!';
  if (accuracy >= 80) return '🎯 Great Job!';
  if (accuracy >= 70) return '👍 Good Work!';
  if (accuracy >= 60) return '📈 Keep Improving!';
  if (accuracy >= 50) return '💪 Room for Growth';
  return '📚 Keep Learning!';
}

function getNextSteps(accuracy, topic) {
  if (accuracy >= 90) {
    return `You're mastering ${topic}! Try a **harder difficulty** or explore **/learn ${topic}** for advanced concepts.`;
  } else if (accuracy >= 70) {
    return `Solid understanding! Practice more with **/quiz ${topic}** or review with **/flashcard ${topic}**.`;
  } else {
    return `Keep practicing! Use **/learn ${topic}** for lessons or **/tutor** for personalized help.`;
  }
}

export default { data, execute, autocomplete, handleButton };
