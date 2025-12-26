import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { createQuizSession, getCurrentQuestion } from '../../services/quizService.js';
import { getOrCreateUser } from '../../services/gamificationService.js';
import { 
  createQuizQuestionEmbed, 
  createQuizAnswerButtons, 
  createQuizControlButtons,
  COLORS 
} from '../../config/designSystem.js';
import { animateLoading, LOADING_FRAMES } from '../../utils/animations.js';

export const data = new SlashCommandBuilder()
  .setName('quiz')
  .setDescription('🎯 Take an AI-generated quiz on any topic')
  .addStringOption(option =>
    option.setName('topic')
      .setDescription('What topic do you want to be quizzed on?')
      .setRequired(true)
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
        { name: '🟢 Easy - Beginner friendly', value: 'easy' },
        { name: '🟡 Medium - Standard challenge', value: 'medium' },
        { name: '🔴 Hard - Expert level', value: 'hard' }
      ))
  .addBooleanOption(option =>
    option.setName('timed')
      .setDescription('Enable timer for each question?'));

export async function execute(interaction) {
  await interaction.deferReply();

  const topic = interaction.options.getString('topic');
  const numQuestions = interaction.options.getInteger('questions') || 5;
  const difficulty = interaction.options.getString('difficulty') || 'medium';
  const timed = interaction.options.getBoolean('timed') || false;

  try {
    const user = await getOrCreateUser(interaction.user.id, interaction.user.username);
    if (user.updateStreak) await user.updateStreak();

    // Animated loading sequence
    await animateLoading(interaction, {
      title: '🎯 Generating Your Quiz',
      color: COLORS.QUIZ_PINK,
      duration: 4000,
      style: 'brain',
      stages: [
        { text: 'Connecting to AI...', status: '🔌 Initializing' },
        { text: 'Analyzing topic: **' + topic + '**', status: '🧠 Processing' },
        { text: 'Generating ' + numQuestions + ' questions...', status: '✍️ Creating' },
        { text: 'Finalizing quiz...', status: '✨ Almost Ready' }
      ]
    });

    // Generate quiz
    const session = await createQuizSession(interaction.user.id, topic, numQuestions, difficulty);

    if (!session || !session.questions || session.questions.length === 0) {
      const errorEmbed = new EmbedBuilder()
        .setTitle('❌ Quiz Generation Failed')
        .setColor(COLORS.ERROR)
        .setDescription('```diff\n- Could not generate quiz for this topic\n```')
        .addFields(
          { name: '💡 Try These Topics', value: '`JavaScript` `Python` `React` `Node.js` `HTML` `CSS`', inline: false },
          { name: '🔧 Or Try', value: '• A more specific topic\n• Different difficulty\n• Fewer questions', inline: false }
        )
        .setFooter({ text: '🎓 MentorAI' });

      await interaction.editReply({ embeds: [errorEmbed] });
      return;
    }

    // Show ready message briefly
    const readyEmbed = new EmbedBuilder()
      .setTitle('✅ Quiz Ready!')
      .setColor(COLORS.SUCCESS)
      .setDescription('```ansi\n\u001b[1;32m🎮 Get ready to test your knowledge!\u001b[0m\n```')
      .addFields(
        { name: '📚 Topic', value: topic, inline: true },
        { name: '❓ Questions', value: String(numQuestions), inline: true },
        { name: '📊 Difficulty', value: difficulty.charAt(0).toUpperCase() + difficulty.slice(1), inline: true }
      )
      .setFooter({ text: '🎓 Starting in 2 seconds...' });

    await interaction.editReply({ embeds: [readyEmbed] });
    await new Promise(r => setTimeout(r, 2000));

    // Get first question
    const questionData = getCurrentQuestion(interaction.user.id);
    if (!questionData || !questionData.question) throw new Error('Failed to get question');

    const questionEmbed = createQuizQuestionEmbed(
      questionData.question,
      questionData.questionNum,
      questionData.totalQuestions,
      topic,
      difficulty
    );

    // Add timer field if timed mode
    if (timed) {
      questionEmbed.addFields({
        name: '⏱️ Time Limit',
        value: '30 seconds per question',
        inline: false
      });
    }

    const answerButtons = createQuizAnswerButtons();
    const controlButtons = createQuizControlButtons();

    await interaction.editReply({
      embeds: [questionEmbed],
      components: [answerButtons, controlButtons]
    });

  } catch (error) {
    console.error('Quiz command error:', error);

    const errorEmbed = new EmbedBuilder()
      .setTitle('❌ Error')
      .setColor(COLORS.ERROR)
      .setDescription('Something went wrong while creating your quiz.')
      .setFooter({ text: '🎓 MentorAI' });

    await interaction.editReply({ embeds: [errorEmbed], components: [] });
  }
}
