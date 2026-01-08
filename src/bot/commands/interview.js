import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle } from 'discord.js';
import { generateInterviewQuestion, evaluateAnswer } from '../../ai/tutorAI.js';
import { User } from '../../database/models/User.js';
import { COLORS } from '../../config/colors.js';

const INTERVIEW_CATEGORIES = {
  behavioral: { name: 'Behavioral', icon: '🗣️', description: 'Common behavioral questions' },
  technical: { name: 'Technical Concepts', icon: '🧠', description: 'CS fundamentals and theory' },
  coding: { name: 'Coding Problems', icon: '💻', description: 'Live coding challenges' },
  system_design: { name: 'System Design', icon: '🏗️', description: 'Architecture and design' },
  language: { name: 'Language Specific', icon: '📝', description: 'Python, JavaScript, etc.' }
};

// Store current questions temporarily
const activeQuestions = new Map();

export const data = new SlashCommandBuilder()
  .setName('interview')
  .setDescription('Practice technical interview questions')
  .addSubcommand(sub =>
    sub.setName('start')
      .setDescription('Start an interview practice session')
      .addStringOption(opt =>
        opt.setName('category')
          .setDescription('Question category')
          .setRequired(true)
          .addChoices(
            ...Object.entries(INTERVIEW_CATEGORIES).map(([key, cat]) => ({
              name: `${cat.icon} ${cat.name}`,
              value: key
            }))
          ))
      .addStringOption(opt =>
        opt.setName('difficulty')
          .setDescription('Question difficulty')
          .addChoices(
            { name: '🟢 Entry Level', value: 'entry' },
            { name: '🟡 Mid Level', value: 'mid' },
            { name: '🔴 Senior Level', value: 'senior' }
          ))
      .addStringOption(opt =>
        opt.setName('company')
          .setDescription('Company style (optional)')
          .addChoices(
            { name: 'Google', value: 'google' },
            { name: 'Amazon', value: 'amazon' },
            { name: 'Meta', value: 'meta' },
            { name: 'Microsoft', value: 'microsoft' },
            { name: 'Startup', value: 'startup' }
          )))
  .addSubcommand(sub =>
    sub.setName('stats')
      .setDescription('View your interview prep stats'));

export async function execute(interaction) {
  const subcommand = interaction.options.getSubcommand();

  if (subcommand === 'start') {
    await interaction.deferReply();
    
    const category = interaction.options.getString('category');
    const difficulty = interaction.options.getString('difficulty') || 'mid';
    const company = interaction.options.getString('company');
    
    try {
      const question = await generateInterviewQuestion({
        category,
        difficulty,
        company
      });
      
      // Store question for later
      activeQuestions.set(interaction.user.id, {
        question,
        category,
        difficulty,
        company,
        startTime: Date.now()
      });
      
      const categoryInfo = INTERVIEW_CATEGORIES[category];
      
      const embed = new EmbedBuilder()
        .setColor(COLORS.PRIMARY)
        .setAuthor({
          name: `${categoryInfo.icon} ${categoryInfo.name} Question`,
          iconURL: interaction.client.user.displayAvatarURL()
        })
        .setTitle('🎤 Interview Question')
        .setDescription(`
${company ? `**Company Style:** ${company.charAt(0).toUpperCase() + company.slice(1)}\n` : ''}**Difficulty:** ${getDifficultyEmoji(difficulty)} ${difficulty.charAt(0).toUpperCase() + difficulty.slice(1)} Level

━━━━━━━━━━━━━━━━━━━━━

${question.question}

━━━━━━━━━━━━━━━━━━━━━

**Tips:**
${question.tips.map(t => `• ${t}`).join('\n')}
        `)
        .addFields(
          { name: '⏱️ Suggested Time', value: question.suggestedTime, inline: true },
          { name: '🎯 Key Points', value: `${question.keyPoints} expected`, inline: true }
        )
        .setFooter({ text: 'Click "Answer" when ready to respond' });

      const row = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId(`interview_answer_${category}_${difficulty}`)
            .setLabel('✍️ Answer')
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId('interview_hint')
            .setLabel('💡 Hint')
            .setStyle(ButtonStyle.Secondary),
          new ButtonBuilder()
            .setCustomId('interview_skip')
            .setLabel('⏭️ Skip')
            .setStyle(ButtonStyle.Secondary),
          new ButtonBuilder()
            .setCustomId('interview_solution')
            .setLabel('📖 Model Answer')
            .setStyle(ButtonStyle.Secondary)
        );

      await interaction.editReply({ embeds: [embed], components: [row] });

    } catch (error) {
      console.error('Interview question error:', error);
      await interaction.editReply('❌ Failed to generate question. Please try again!');
    }

  } else if (subcommand === 'stats') {
    const user = await User.findOne({ discordId: interaction.user.id });
    const stats = user?.interviewStats || {
      totalSessions: 0,
      questionsAnswered: 0,
      averageScore: 0,
      categoryScores: {},
      bestScore: 0
    };

    const categoryBreakdown = Object.entries(INTERVIEW_CATEGORIES)
      .map(([key, cat]) => {
        const score = stats.categoryScores?.[key] || { total: 0, count: 0 };
        const avg = score.count > 0 ? (score.total / score.count).toFixed(1) : '-';
        return `${cat.icon} **${cat.name}:** ${avg}/10 (${score.count} questions)`;
      })
      .join('\n');

    const embed = new EmbedBuilder()
      .setColor(COLORS.PRIMARY)
      .setTitle('📊 Interview Prep Statistics')
      .setDescription(`
╔══════════════════════════════════════╗
║           OVERALL STATS              ║
╚══════════════════════════════════════╝

📝 **Total Sessions:** ${stats.totalSessions}
❓ **Questions Answered:** ${stats.questionsAnswered}
⭐ **Average Score:** ${stats.averageScore.toFixed(1)}/10
🏆 **Best Score:** ${stats.bestScore}/10

╔══════════════════════════════════════╗
║         CATEGORY BREAKDOWN           ║
╚══════════════════════════════════════╝

${categoryBreakdown}

╔══════════════════════════════════════╗
║          READINESS LEVEL             ║
╚══════════════════════════════════════╝

${getReadinessBar(stats.averageScore)}
${getReadinessLevel(stats.averageScore)}
      `)
      .setFooter({ text: 'Keep practicing to improve your scores!' });

    await interaction.reply({ embeds: [embed] });
  }
}

function getDifficultyEmoji(difficulty) {
  return { entry: '🟢', mid: '🟡', senior: '🔴' }[difficulty] || '🟡';
}

function getReadinessBar(score) {
  const percentage = Math.round((score / 10) * 100);
  const filled = Math.round(percentage / 5);
  const empty = 20 - filled;
  return `\`[${'█'.repeat(filled)}${'░'.repeat(empty)}]\` ${percentage}%`;
}

function getReadinessLevel(score) {
  if (score >= 8) return '✅ **Interview Ready!** You\'re well prepared.';
  if (score >= 6) return '🟡 **Almost There!** A bit more practice needed.';
  if (score >= 4) return '🟠 **Making Progress!** Keep practicing regularly.';
  return '🔴 **Keep Learning!** Focus on fundamentals first.';
}

// Export for button handlers
export { activeQuestions };
