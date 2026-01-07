// src/embeds/mobile/insightsMobile.js
import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { MOBILE, mobileProgressBar } from '../../utils/mobileUI.js';

export function createMobileInsightsEmbed(user, aiInsights) {
  const summary = aiInsights?.summary || 'Analyzing your learning patterns...';
  const strengths = aiInsights?.strengths || [];
  const weaknesses = aiInsights?.weaknesses || [];
  const recommendations = aiInsights?.recommendations || [];

  const embed = new EmbedBuilder()
    .setColor(MOBILE.colors.PRIMARY)
    .setAuthor({
      name: '🧠 AI Insights'
    })
    .setDescription(`
${MOBILE.separators.sparkle}

${summary.substring(0, 200)}${summary.length > 200 ? '...' : ''}

${MOBILE.separators.thin}

**💪 Strengths:**
${strengths.slice(0, 3).map(s => `✅ ${s}`).join('\n') || '*Keep learning to discover!*'}

${MOBILE.separators.thin}

**🎯 Focus Areas:**
${weaknesses.slice(0, 3).map(w => `📌 ${w}`).join('\n') || '*No weak spots found!*'}

${MOBILE.separators.thin}

**📈 Next Steps:**
${recommendations.slice(0, 2).map((r, i) => `${i + 1}. ${r}`).join('\n') || '*Complete more quizzes for recommendations*'}
    `)
    .setFooter({
      text: '🤖 AI-powered analysis'
    });

  const row = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('insights_practice')
        .setLabel('🎯 Practice')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('insights_lesson')
        .setLabel('📖 Lesson')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId('insights_refresh')
        .setLabel('🔄')
        .setStyle(ButtonStyle.Secondary)
    );

  return { embeds: [embed], components: [row] };
}

// Insights loading (mobile)
export function createMobileInsightsLoadingEmbed() {
  const embed = new EmbedBuilder()
    .setColor(MOBILE.colors.INFO)
    .setDescription(`
╭─────────────╮
│             │
│ 🧠 Thinking │
│             │
│  Analyzing  │
│  your data  │
│             │
│  ▰▰▱▱▱▱▱▱  │
│             │
╰─────────────╯
    `);

  return { embeds: [embed], components: [] };
}

// Detailed insights view (mobile)
export function createMobileInsightsDetailEmbed(user, category, insights) {
  const categoryTitles = {
    strengths: '💪 Your Strengths',
    weaknesses: '🎯 Focus Areas',
    recommendations: '📈 Recommendations',
    progress: '📊 Progress Analysis'
  };

  const content = insights?.[category] || [];

  const embed = new EmbedBuilder()
    .setColor(MOBILE.colors.INFO)
    .setTitle(categoryTitles[category] || '🧠 Insights')
    .setDescription(`
${MOBILE.separators.thin}

${content.length > 0 
  ? content.map((item, i) => `${i + 1}. ${item}`).join('\n\n')
  : '*No data available yet*'}

${MOBILE.separators.thin}

💡 Complete more activities for detailed insights!
    `)
    .setFooter({ text: '◀️ Back to overview' });

  const row = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('insights_back')
        .setLabel('◀️ Back')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('quick_quiz')
        .setLabel('🎯 Quiz')
        .setStyle(ButtonStyle.Primary)
    );

  return { embeds: [embed], components: [row] };
}

// Weekly insights summary (mobile)
export function createMobileWeeklyInsightsEmbed(user, weeklyStats) {
  const stats = weeklyStats || {};
  
  const embed = new EmbedBuilder()
    .setColor(MOBILE.colors.SUCCESS)
    .setTitle('📊 Weekly Summary')
    .setDescription(`
${MOBILE.separators.sparkle}

**This Week:**

✨ XP Earned: **${stats.xpEarned || 0}**
📖 Lessons: **${stats.lessonsCompleted || 0}**
🎯 Quizzes: **${stats.quizzesTaken || 0}**
✅ Accuracy: **${stats.accuracy || 0}%**

${MOBILE.separators.thin}

**Compared to Last Week:**
${stats.xpChange >= 0 ? '📈' : '📉'} XP: ${stats.xpChange >= 0 ? '+' : ''}${stats.xpChange || 0}%
${stats.activityChange >= 0 ? '📈' : '📉'} Activity: ${stats.activityChange >= 0 ? '+' : ''}${stats.activityChange || 0}%

${MOBILE.separators.thin}

${getWeeklyMessage(stats)}
    `)
    .setFooter({ text: '🔥 Keep up the momentum!' });

  const row = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('insights_full')
        .setLabel('🧠 Full Insights')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('view_profile')
        .setLabel('👤 Profile')
        .setStyle(ButtonStyle.Secondary)
    );

  return { embeds: [embed], components: [row] };
}

function getWeeklyMessage(stats) {
  const xpChange = stats?.xpChange || 0;
  if (xpChange >= 50) return '🏆 **Amazing week!** You\'re on fire!';
  if (xpChange >= 20) return '⭐ **Great progress!** Keep it up!';
  if (xpChange >= 0) return '💪 **Steady progress!** Nice work!';
  if (xpChange >= -20) return '📚 **Stay consistent!** You got this!';
  return '🎯 **Time to catch up!** Let\'s learn!';
}

export default {
  createMobileInsightsEmbed,
  createMobileInsightsLoadingEmbed,
  createMobileInsightsDetailEmbed,
  createMobileWeeklyInsightsEmbed
};
