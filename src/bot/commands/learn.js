import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { getLesson, getRecommendedTopic } from '../../services/learningService.js';
import { getOrCreateUser } from '../../services/gamificationService.js';
import { 
  BRAND, COLORS, EMOJIS, VISUALS, 
  getRank, formatNumber, getTopicEmoji, getTopicColor 
} from '../../config/brandSystem.js';
import { animateLoading } from '../../utils/animations.js';

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
  const topicEmoji = getTopicEmoji(topic);
  const topicColor = getTopicColor(topic);

  try {
    const user = await getOrCreateUser(interaction.user.id, interaction.user.username);
    await user.updateStreak();

    // Simple loading message (no animation to avoid multiple edits)
    const loadingEmbed = new EmbedBuilder()
      .setTitle('📖 Generating Your Lesson')
      .setColor(topicColor)
      .setDescription(`Analyzing topic: **${topic}**\nCrafting ${difficulty} lesson...`)
      .setFooter({ text: '🎓 MentorAI • Please wait...' });
    
    await interaction.editReply({ embeds: [loadingEmbed] });

    // Generate lesson with AI
    const result = await getLesson(topic, difficulty, user);
    const lesson = result.lesson;
    const rank = getRank(user.level || 1);

    // Create main lesson embed
    const lessonEmbed = new EmbedBuilder()
      .setTitle(`${topicEmoji} ${lesson.title || topic}`)
      .setColor(topicColor)
      .setDescription(
        `${VISUALS.separators.fancy}\n` +
        `${lesson.introduction || ''}\n` +
        `${VISUALS.separators.fancy}`
      )
      .setTimestamp()
      .setFooter({ text: `${EMOJIS.brain} ${BRAND.name} | +${formatNumber(result.xpEarned)} XP earned!` });

    // Add main content
    if (lesson.content) {
      const content = lesson.content.length > 1000 
        ? lesson.content.substring(0, 1000) + '...' 
        : lesson.content;
      lessonEmbed.addFields({
        name: `${EMOJIS.learn} Lesson Content`,
        value: content,
        inline: false
      });
    }

    // Add key points
    if (lesson.keyPoints && lesson.keyPoints.length > 0) {
      lessonEmbed.addFields({
        name: `${EMOJIS.target} Key Points`,
        value: lesson.keyPoints.map(p => `${EMOJIS.check} ${p}`).join('\n'),
        inline: false
      });
    }

    // Create code example embed if exists
    const embeds = [lessonEmbed];

    if (lesson.codeExample && lesson.codeExample.code) {
      const codeEmbed = new EmbedBuilder()
        .setTitle(`${EMOJIS.code} Code Example`)
        .setColor(COLORS.QUIZ_GREEN)
        .setDescription('```' + (lesson.codeExample.language || 'javascript') + '\n' + 
          lesson.codeExample.code.substring(0, 1500) + '\n```')
        .addFields({
          name: `${EMOJIS.tip} Explanation`,
          value: lesson.codeExample.explanation || 'Study this example carefully!',
          inline: false
        });
      embeds.push(codeEmbed);
    }

    // Add practice challenge if exists
    if (lesson.practiceChallenge) {
      const challengeEmbed = new EmbedBuilder()
        .setTitle(`${EMOJIS.quiz} Practice Challenge`)
        .setColor(COLORS.QUIZ_PINK)
        .setDescription(`**${lesson.practiceChallenge.task}**`)
        .addFields({
          name: `${EMOJIS.tip} Hint`,
          value: lesson.practiceChallenge.hint || 'Take your time and think it through!',
          inline: false
        });
      
      if (lesson.nextSteps) {
        challengeEmbed.addFields({
          name: `${EMOJIS.rocket} Next Steps`,
          value: lesson.nextSteps,
          inline: false
        });
      }

      if (lesson.funFact) {
        challengeEmbed.addFields({
          name: `${EMOJIS.party} Fun Fact`,
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
        .setLabel('Take Quiz')
        .setEmoji(EMOJIS.quiz)
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('lesson_next_' + safeTopic)
        .setLabel('Next Lesson')
        .setEmoji(EMOJIS.learn)
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('help_main')
        .setLabel('Menu')
        .setEmoji(EMOJIS.home)
        .setStyle(ButtonStyle.Secondary)
    );

    // Update user stats
    if (!user.topicsStudied) user.topicsStudied = [];
    if (!user.topicsStudied.includes(topic.toLowerCase())) {
      user.topicsStudied.push(topic.toLowerCase());
    }
    if (!user.completedLessons) user.completedLessons = [];
    user.completedLessons.push(`${topic}:${difficulty}:${Date.now()}`);
    
    const levelResult = user.addXp(result.xpEarned); // Sync now
    await user.save();

    await interaction.editReply({ 
      embeds: embeds.slice(0, 3), // Discord limit is 10, but keep it clean
      components: [actionRow] 
    });

    // Send level up notification if applicable
    if (levelResult.leveledUp) {
      const newRank = getRank(levelResult.newLevel);
      const levelUpEmbed = new EmbedBuilder()
        .setTitle(`${EMOJIS.levelup} LEVEL UP!`)
        .setColor(COLORS.XP_GOLD)
        .setDescription(
          `**Congratulations ${interaction.user.username}!**\n\n` +
          `You reached **Level ${levelResult.newLevel}**! ${EMOJIS.party}\n` +
          `${newRank.emoji} **${newRank.name}**\n\n` +
          `Keep learning to unlock more achievements!`
        )
        .setTimestamp();
      
      await interaction.followUp({ embeds: [levelUpEmbed] });
    }

  } catch (error) {
    console.error('Learn command error:', error);

    const errorEmbed = new EmbedBuilder()
      .setTitle(`${EMOJIS.error} Lesson Generation Failed`)
      .setDescription(
        `Sorry, I could not generate a lesson right now.\n\n` +
        `**Possible reasons:**\n` +
        `• AI service is temporarily busy\n` +
        `• The topic might be too specific\n\n` +
        `**Try:**\n` +
        `• A more common topic like "JavaScript" or "Python"\n` +
        `• Waiting a moment and trying again`
      )
      .setColor(COLORS.ERROR)
      .setFooter({ text: `${EMOJIS.brain} ${BRAND.name}` });

    await interaction.editReply({ embeds: [errorEmbed] });
  }
}
