import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { generateWithAI } from '../../ai/index.js';
import { getOrCreateUser } from '../../services/gamificationService.js';
import { COLORS, createProgressBar } from '../../config/designSystem.js';
import { animateLoading } from '../../utils/animations.js';

export const data = new SlashCommandBuilder()
  .setName('quickquiz')
  .setDescription('⚡ Instant one-question quiz - perfect for quick brain training!')
  .addStringOption(option =>
    option.setName('topic')
      .setDescription('Topic (random if empty)')
      .setAutocomplete(true))
  .addStringOption(option =>
    option.setName('difficulty')
      .setDescription('Challenge level')
      .addChoices(
        { name: '🟢 Easy - Warm up', value: 'easy' },
        { name: '🟡 Medium - Standard', value: 'medium' },
        { name: '🔴 Hard - Expert', value: 'hard' }
      ));

const QUICK_TOPICS = [
  'JavaScript basics', 'Python fundamentals', 'HTML & CSS', 'Git commands',
  'Data structures', 'Algorithms', 'Web development', 'APIs',
  'Databases', 'React', 'Node.js', 'TypeScript'
];

// Store active quick quizzes
const activeQuizzes = new Map();

export async function execute(interaction) {
  await interaction.deferReply();

  let topic = interaction.options.getString('topic');
  const difficulty = interaction.options.getString('difficulty') || 'medium';
  
  if (!topic) {
    topic = QUICK_TOPICS[Math.floor(Math.random() * QUICK_TOPICS.length)];
  }

  const difficultyData = {
    easy: { xp: 15, time: 45, color: 0x57F287, emoji: '🟢' },
    medium: { xp: 25, time: 30, color: COLORS.QUIZ_PINK, emoji: '🟡' },
    hard: { xp: 40, time: 20, color: 0xED4245, emoji: '🔴' }
  };
  const diff = difficultyData[difficulty];

  try {
    const user = await getOrCreateUser(interaction.user.id, interaction.user.username);

    // Animated loading
    await animateLoading(interaction, {
      title: '⚡ Generating Quick Quiz',
      color: diff.color,
      duration: 2000,
      style: 'brain',
      stages: [
        { text: 'Picking topic: **' + topic + '**', status: '🎯 Targeting' },
        { text: 'Generating question...', status: '🧠 Creating' },
        { text: 'Ready to go!', status: '⚡ Launch' }
      ]
    });

    // Generate quick question
    const result = await generateWithAI(
      `Generate ONE multiple choice programming question.
      Return JSON: {
        "question": "the question",
        "options": ["A) option1", "B) option2", "C) option3", "D) option4"],
        "correct": 0,
        "explanation": "brief explanation"
      }
      correct is the index (0-3) of the right answer.
      Keep it quick and educational.`,
      `Topic: ${topic}. Difficulty: medium. Generate one question.`,
      { jsonMode: true, maxTokens: 500 }
    );

    let quizData;
    try {
      quizData = JSON.parse(result);
    } catch {
      // Fallback question
      quizData = {
        question: 'What does API stand for?',
        options: [
          'A) Application Programming Interface',
          'B) Advanced Program Integration',
          'C) Automated Process Input',
          'D) Application Process Integration'
        ],
        correct: 0,
        explanation: 'API stands for Application Programming Interface - a set of protocols for building software.'
      };
    }

    // Store quiz data
    const quizId = Date.now().toString(36);
    activeQuizzes.set(quizId, {
      ...quizData,
      topic,
      userId: interaction.user.id,
      startTime: Date.now()
    });

    // Clean old quizzes (older than 5 minutes)
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
    for (const [id, quiz] of activeQuizzes) {
      if (quiz.startTime < fiveMinutesAgo) {
        activeQuizzes.delete(id);
      }
    }

    const embed = new EmbedBuilder()
      .setTitle('⚡ Quick Quiz: ' + topic)
      .setColor(diff.color)
      .setDescription(
        '```\n' +
        '⚡ QUICK QUIZ CHALLENGE ⚡\n' +
        '```\n\n' +
        '### 📝 ' + quizData.question + '\n\n' +
        quizData.options.map((opt, i) => {
          const letters = ['🅰️', '🅱️', '🅲️', '🅳️'];
          return letters[i] + ' ' + opt.substring(3);
        }).join('\n')
      )
      .addFields(
        { name: '⏱️ Time Limit', value: '`' + diff.time + ' seconds`', inline: true },
        { name: '🎁 Reward', value: '`+' + diff.xp + ' XP`', inline: true },
        { name: diff.emoji + ' Difficulty', value: '`' + difficulty.toUpperCase() + '`', inline: true }
      )
      .setFooter({ text: '🎓 MentorAI Quick Quiz | Answer before time runs out!' })
      .setTimestamp();

    const buttons = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('qq_' + quizId + '_0')
        .setLabel('A')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('qq_' + quizId + '_1')
        .setLabel('B')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('qq_' + quizId + '_2')
        .setLabel('C')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('qq_' + quizId + '_3')
        .setLabel('D')
        .setStyle(ButtonStyle.Primary)
    );

    await interaction.editReply({ embeds: [embed], components: [buttons] });

    // Set timeout to reveal answer
    setTimeout(async () => {
      const quiz = activeQuizzes.get(quizId);
      if (quiz && !quiz.answered) {
        activeQuizzes.delete(quizId);
        try {
          const timeoutEmbed = new EmbedBuilder()
            .setTitle('⏰ Time\'s Up!')
            .setColor(0xED4245)
            .setDescription(
              '```\n' +
              '⏰ OUT OF TIME! ⏰\n' +
              '```'
            )
            .addFields(
              { name: '📝 Question', value: quizData.question, inline: false },
              { name: '✅ Correct Answer', value: '```\n' + quizData.options[quizData.correct] + '\n```', inline: false },
              { name: '💡 Explanation', value: quizData.explanation, inline: false }
            )
            .setFooter({ text: '🎓 Try /quickquiz again! Speed is key!' });

          const retryButton = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setCustomId('execute_quickquiz')
              .setLabel('Try Again')
              .setEmoji('⚡')
              .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
              .setCustomId('help_main')
              .setLabel('Menu')
              .setEmoji('🏠')
              .setStyle(ButtonStyle.Secondary)
          );

          await interaction.editReply({ embeds: [timeoutEmbed], components: [retryButton] });
        } catch (e) {
          // Message may have been deleted
        }
      }
    }, diff.time * 1000);

  } catch (error) {
    console.error('Quick quiz error:', error);
    await interaction.editReply({ content: '❌ Failed to generate quiz. Try again!' });
  }
}

// Export for button handler
export { activeQuizzes };
