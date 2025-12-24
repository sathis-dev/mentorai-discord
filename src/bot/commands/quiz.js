import { SlashCommandBuilder } from 'discord.js';
import { generateQuiz } from '../../services/quizService.js';
import { createQuizEmbed, createQuizButtons, createErrorEmbed } from '../../config/designSystem.js';

export const data = new SlashCommandBuilder()
  .setName('quiz')
  .setDescription('Test your knowledge with a quiz')
  .addStringOption(option =>
    option
      .setName('topic')
      .setDescription('Topic to be quizzed on')
      .setRequired(true)
  )
  .addIntegerOption(option =>
    option
      .setName('questions')
      .setDescription('Number of questions (1-10)')
      .setMinValue(1)
      .setMaxValue(10)
  );

export async function execute(interaction) {
  const topic = interaction.options.getString('topic');
  const numQuestions = interaction.options.getInteger('questions') || 5;

  await interaction.deferReply();

  try {
    const quiz = await generateQuiz({
      topic,
      numQuestions,
      userId: interaction.user.id
    });

    const embed = createQuizEmbed(quiz, 0);
    const buttons = createQuizButtons(quiz.id);

    await interaction.editReply({ embeds: [embed], components: [buttons] });

  } catch (error) {
    console.error('Quiz command error:', error);
    const errorEmbed = createErrorEmbed(
      'Failed to generate quiz. Please try again!',
      'Make sure you entered a valid topic and try again.'
    );
    await interaction.editReply({ embeds: [errorEmbed] });
  }
}
