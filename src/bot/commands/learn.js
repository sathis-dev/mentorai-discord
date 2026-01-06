import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { getLesson, getRecommendedTopic } from '../../services/learningService.js';
import { getOrCreateUser } from '../../services/gamificationService.js';

export const data = new SlashCommandBuilder()
  .setName('learn')
  .setDescription('Get an AI-generated lesson on any topic')
  .addStringOption(option =>
    option.setName('topic')
      .setDescription('What do you want to learn about?')
      .setRequired(true)
      .setAutocomplete(true))
  .addStringOption(option =>
    option.setName('difficulty')
      .setDescription('Lesson difficulty level')
      .addChoices(
        { name: '🌱 Beginner - Start from scratch', value: 'beginner' },
        { name: '🌿 Intermediate - Build on basics', value: 'intermediate' },
        { name: '🌳 Advanced - Deep dive', value: 'advanced' }
      ));

export async function execute(interaction) {
  await interaction.deferReply();

  const topic = interaction.options.getString('topic');
  const difficulty = interaction.options.getString('difficulty') || 'beginner';

  try {
    const user = await getOrCreateUser(interaction.user.id, interaction.user.username);
    await user.updateStreak();

    // Show loading message
    const loadingEmbed = new EmbedBuilder()
      .setTitle('📚 Generating Your Personalized Lesson...')
      .setDescription('🤖 **AI is crafting a lesson just for you!**\n\n' +
        '**Topic:** ' + topic + '\n' +
        '**Difficulty:** ' + difficulty.charAt(0).toUpperCase() + difficulty.slice(1) + '\n\n' +
        '_This usually takes 5-10 seconds..._')
      .setColor(0x5865F2)
      .setFooter({ text: '🎓 MentorAI - Powered by GPT' });

    await interaction.editReply({ embeds: [loadingEmbed] });

    // Generate lesson with AI
    const result = await getLesson(topic, difficulty, user);
    const lesson = result.lesson;

    // Create main lesson embed
    const lessonEmbed = new EmbedBuilder()
      .setTitle('📚 ' + (lesson.title || topic))
      .setColor(0x3498DB)
      .setDescription(lesson.introduction || '')
      .setTimestamp()
      .setFooter({ text: '🎓 MentorAI | +' + result.xpEarned + ' XP earned!' });

    // Add main content
    if (lesson.content) {
      const content = lesson.content.length > 1000 
        ? lesson.content.substring(0, 1000) + '...' 
        : lesson.content;
      lessonEmbed.addFields({
        name: '📖 Lesson Content',
        value: content,
        inline: false
      });
    }

    // Add key points
    if (lesson.keyPoints && lesson.keyPoints.length > 0) {
      lessonEmbed.addFields({
        name: '🔑 Key Points',
        value: lesson.keyPoints.map(p => '• ' + p).join('\n'),
        inline: false
      });
    }

    // Create code example embed if exists
    const embeds = [lessonEmbed];

    if (lesson.codeExample && lesson.codeExample.code) {
      const codeEmbed = new EmbedBuilder()
        .setTitle('💻 Code Example')
        .setColor(0x2ECC71)
        .setDescription('```' + (lesson.codeExample.language || 'javascript') + '\n' + 
          lesson.codeExample.code.substring(0, 1500) + '\n```')
        .addFields({
          name: '📝 Explanation',
          value: lesson.codeExample.explanation || 'Study this example carefully!',
          inline: false
        });
      embeds.push(codeEmbed);
    }

    // Add practice challenge if exists
    if (lesson.practiceChallenge) {
      const challengeEmbed = new EmbedBuilder()
        .setTitle('🎯 Practice Challenge')
        .setColor(0xE91E63)
        .setDescription('**' + lesson.practiceChallenge.task + '**')
        .addFields({
          name: '💡 Hint',
          value: lesson.practiceChallenge.hint || 'Take your time and think it through!',
          inline: false
        });
      
      if (lesson.nextSteps) {
        challengeEmbed.addFields({
          name: '🚀 Next Steps',
          value: lesson.nextSteps,
          inline: false
        });
      }

      if (lesson.funFact) {
        challengeEmbed.addFields({
          name: '🎉 Fun Fact',
          value: lesson.funFact,
          inline: false
        });
      }
      
      embeds.push(challengeEmbed);
    }

    // Create action buttons - truncate topic for customId (max 100 chars total)
    const safeTopic = encodeURIComponent(topic.substring(0, 50));
    const actionRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('quiz_start_' + safeTopic)
        .setLabel('🎯 Take Quiz')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('lesson_next_' + safeTopic)
        .setLabel('📚 Next Lesson')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('help_main')
        .setLabel('🏠 Menu')
        .setStyle(ButtonStyle.Secondary)
    );

    // Update user stats
    if (!user.topicsStudied) user.topicsStudied = [];
    if (!user.topicsStudied.includes(topic.toLowerCase())) {
      user.topicsStudied.push(topic.toLowerCase());
    }
    if (!user.completedLessons) user.completedLessons = [];
    user.completedLessons.push(`${topic}:${difficulty}:${Date.now()}`);
    
    const levelResult = await user.addXp(result.xpEarned);
    await user.save();

    await interaction.editReply({ 
      embeds: embeds.slice(0, 3), // Discord limit is 10, but keep it clean
      components: [actionRow] 
    });

    // Send level up notification if applicable
    if (levelResult.leveledUp) {
      const levelUpEmbed = new EmbedBuilder()
        .setTitle('🎉 LEVEL UP!')
        .setColor(0xFFD700)
        .setDescription('**Congratulations ' + interaction.user.username + '!**\n\n' +
          'You reached **Level ' + levelResult.newLevel + '**! 🌟\n\n' +
          'Keep learning to unlock more achievements!')
        .setTimestamp();
      
      await interaction.followUp({ embeds: [levelUpEmbed] });
    }

  } catch (error) {
    console.error('Learn command error:', error);

    const errorEmbed = new EmbedBuilder()
      .setTitle('❌ Lesson Generation Failed')
      .setDescription('Sorry, I could not generate a lesson right now.\n\n' +
        '**Possible reasons:**\n' +
        '• AI service is temporarily busy\n' +
        '• The topic might be too specific\n\n' +
        '**Try:**\n' +
        '• A more common topic like "JavaScript" or "Python"\n' +
        '• Waiting a moment and trying again')
      .setColor(0xED4245)
      .setFooter({ text: '🎓 MentorAI' });

    await interaction.editReply({ embeds: [errorEmbed] });
  }
}
