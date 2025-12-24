import { logger } from '../../utils/logger.js';
import { answerQuestion, getQuiz } from '../../services/quizService.js';
import { EmbedBuilder } from 'discord.js';
import { COLORS } from '../../config/colors.js';
import { 
  createCorrectEmbed, 
  createIncorrectEmbed, 
  createQuizEmbed, 
  createQuizButtons 
} from '../../config/designSystem.js';

export const name = 'interactionCreate';

export async function execute(interaction) {
  if (interaction.isChatInputCommand()) {
    const command = interaction.client.commands.get(interaction.commandName);

    if (!command) {
      logger.warn(`Unknown command: ${interaction.commandName}`);
      return;
    }

    try {
      await command.execute(interaction);
    } catch (error) {
      logger.error(`Error executing ${interaction.commandName}:`, error);
      
      const errorMessage = {
        content: '❌ There was an error executing this command!',
        ephemeral: true
      };

      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(errorMessage);
      } else {
        await interaction.reply(errorMessage);
      }
    }
  }

  if (interaction.isButton()) {
    try {
      await handleButton(interaction);
    } catch (error) {
      logger.error('Button interaction error:', error);
      await interaction.reply({
        content: '❌ Failed to process button interaction!',
        ephemeral: true
      }).catch(() => {});
    }
  }

  if (interaction.isStringSelectMenu()) {
    await handleSelectMenu(interaction);
  }
}

async function handleButton(interaction) {
  const [action, subaction, ...params] = interaction.customId.split('_');
  
  if (action === 'quiz' && subaction === 'answer') {
    await handleQuizAnswer(interaction, params);
    return;
  }
  
  switch (action) {
    case 'lesson':
      await interaction.reply({ content: '📚 Lesson features coming soon!', ephemeral: true });
      break;
    case 'next':
      await interaction.reply({ content: '➡️ Next action!', ephemeral: true });
      break;
    default:
      logger.warn(`Unknown button action: ${action}`);
      await interaction.reply({ content: '❌ Unknown action!', ephemeral: true });
  }
}

async function handleQuizAnswer(interaction, params) {
  // Parse: quiz_answer_${answerIndex}_${quizId}
  const [answerIndex, ...quizIdParts] = params;
  const quizId = quizIdParts.join('_');
  const selectedAnswer = parseInt(answerIndex);

  try {
    const result = await answerQuestion(quizId, selectedAnswer);
    const quiz = getQuiz(quizId);
    
    if (result.isComplete) {
      // Quiz complete - get final stats from quiz object
      const correctCount = quiz ? quiz.answers.filter(a => a.isCorrect).length : 0;
      const totalQuestions = quiz ? quiz.questions.length : 5;
      const percentage = (correctCount / totalQuestions) * 100;
      const passed = percentage >= 70;
      
      const embed = new EmbedBuilder()
        .setColor(passed ? COLORS.SUCCESS : COLORS.ERROR)
        .setTitle(passed ? '🎉 Quiz Complete! Passed!' : '📝 Quiz Complete')
        .setDescription(`You scored **${correctCount}/${totalQuestions}** (${Math.round(percentage)}%)

\`\`\`diff
${passed ? '+' : '-'} ${passed ? 'PASSED!' : 'Try again to improve'}
\`\`\``)
        .addFields(
          { name: '📊 Performance', value: passed ? 'Passed! ✅' : 'Keep learning! 📚', inline: true },
          { name: '⭐ XP Earned', value: `\`\`\`diff\n+ ${result.score} XP\n\`\`\``, inline: true }
        )
        .setFooter({ text: `Accuracy: ${correctCount}/${totalQuestions} correct` });

      await interaction.update({ embeds: [embed], components: [] });
    } else {
      // Show feedback and next question using NEW design system
      const currentQuestion = quiz.questions[quiz.currentQuestion - 1];
      const streak = quiz.answers.filter(a => a.isCorrect).length;
      
      // Use new design system embeds
      const feedbackEmbed = result.isCorrect 
        ? createCorrectEmbed(currentQuestion, currentQuestion.xp || 10, streak)
        : createIncorrectEmbed(currentQuestion, selectedAnswer);

      // Create next question embed
      quiz.currentQuestion = quiz.currentQuestion; // Keep current index
      const questionEmbed = createQuizEmbed(quiz, quiz.currentQuestion);
      
      const buttons = createQuizButtons(quizId);

      await interaction.update({ 
        embeds: [feedbackEmbed, questionEmbed], 
        components: [buttons] 
      });
    }
  } catch (error) {
    logger.error('Quiz answer handling error:', error);
    const errorMsg = error.message || 'Unknown error';
    await interaction.reply({
      content: `❌ ${errorMsg.includes('expired') ? 'Quiz session expired' : 'Error processing answer'}. Start a new quiz with \`/quiz\`!`,
      flags: 64 // Ephemeral flag
    }).catch(() => {});
  }
}

async function handleSelectMenu(interaction) {
  const [action, ...params] = interaction.customId.split('_');
  
  switch (action) {
    case 'subject':
      break;
    case 'topic':
      break;
    default:
      logger.warn(`Unknown select menu action: ${action}`);
  }
}
