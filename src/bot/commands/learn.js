import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } from 'discord.js';
import { generateLesson } from '../../services/learningService.js';
import { subjects } from '../../config/subjects.js';
import { createLessonEmbed, createNavigationButtons } from '../../utils/embedBuilder.js';

export const data = new SlashCommandBuilder()
  .setName('learn')
  .setDescription('Start learning a new topic')
  .addStringOption(option =>
    option
      .setName('topic')
      .setDescription('What do you want to learn?')
      .setRequired(false)
  )
  .addStringOption(option =>
    option
      .setName('level')
      .setDescription('Your skill level')
      .setRequired(false)
      .addChoices(
        { name: '🌱 Beginner', value: 'beginner' },
        { name: '🌿 Intermediate', value: 'intermediate' },
        { name: '🌳 Advanced', value: 'advanced' }
      )
  );

export async function execute(interaction) {
  const topic = interaction.options.getString('topic');
  const level = interaction.options.getString('level') || 'beginner';

  if (!topic) {
    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId('subject_select')
      .setPlaceholder('Choose a subject to learn')
      .addOptions(
        subjects.map(subject => ({
          label: subject.name,
          description: subject.description,
          emoji: subject.emoji,
          value: subject.id
        }))
      );

    const row = new ActionRowBuilder().addComponents(selectMenu);

    const embed = new EmbedBuilder()
      .setColor('#5865F2')
      .setTitle('📚 What would you like to learn?')
      .setDescription('Choose a subject below, or use `/learn topic:your topic` for anything specific!')
      .setFooter({ text: 'MentorAI - Your personal AI tutor' });

    await interaction.reply({ embeds: [embed], components: [row] });
    return;
  }

  await interaction.deferReply();

  try {
    const lesson = await generateLesson({
      topic,
      level,
      userId: interaction.user.id,
      guildId: interaction.guild?.id
    });

    const embed = createLessonEmbed(lesson, 1, lesson.totalLessons);
    const buttons = createNavigationButtons({ prevDisabled: true });

    await interaction.editReply({ embeds: [embed], components: [buttons] });

  } catch (error) {
    console.error('Learn command error:', error);
    await interaction.editReply({
      content: '❌ Sorry, I had trouble generating that lesson. Please try again!'
    });
  }
}
