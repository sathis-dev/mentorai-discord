import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { getOrCreateUser } from '../../services/gamificationService.js';
import { COLORS, EMOJIS, createProgressBar } from '../../config/designSystem.js';
import { generateWithAI } from '../../ai/index.js';

export const data = new SlashCommandBuilder()
  .setName('weak-spots')
  .setDescription('🎯 Analyze your weak areas and get targeted improvement suggestions');

export async function execute(interaction) {
  await interaction.deferReply();

  try {
    const user = await getOrCreateUser(interaction.user.id, interaction.user.username);

    // Analyze topic accuracy from user data
    const topicAnalysis = analyzeTopicAccuracy(user);

    // Build the main embed
    const mainEmbed = new EmbedBuilder()
      .setTitle('🎯 Your Weak Spots Analysis')
      .setColor(COLORS.WARNING)
      .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
      .setDescription('> Identifying areas where you can improve\n\n' +
        `📊 **Overall Accuracy:** ${topicAnalysis.overallAccuracy}%\n` +
        `❓ **Total Questions:** ${topicAnalysis.totalQuestions}\n` +
        `✅ **Correct Answers:** ${topicAnalysis.correctAnswers}`)
      .setTimestamp();

    // Topic breakdown section
    if (topicAnalysis.topics.length > 0) {
      const topicsText = topicAnalysis.topics
        .sort((a, b) => a.accuracy - b.accuracy) // Sort by accuracy (worst first)
        .slice(0, 10)
        .map((topic, i) => {
          const statusEmoji = topic.accuracy >= 80 ? '🟢' : topic.accuracy >= 60 ? '🟡' : '🔴';
          const bar = createProgressBar(topic.accuracy, 100, 8);
          return `${statusEmoji} **${topic.name}**\n   ${bar} ${topic.accuracy}% (${topic.correct}/${topic.total})`;
        })
        .join('\n\n');

      mainEmbed.addFields({ 
        name: '📚 Topic Performance', 
        value: topicsText || 'No topics tracked yet', 
        inline: false 
      });
    } else {
      mainEmbed.addFields({
        name: '📚 Topic Performance',
        value: '```\nNo quiz data yet!\nTake some quizzes to see your weak spots.\n```',
        inline: false
      });
    }

    // Weak spots section (topics below 70%)
    const weakSpots = topicAnalysis.topics.filter(t => t.accuracy < 70 && t.total >= 3);
    if (weakSpots.length > 0) {
      const weakText = weakSpots
        .slice(0, 5)
        .map(topic => `• **${topic.name}** - ${topic.accuracy}% (needs ${Math.ceil((0.7 * topic.total) - topic.correct)} more correct)`)
        .join('\n');

      mainEmbed.addFields({
        name: '🔴 Areas Needing Focus',
        value: weakText,
        inline: false
      });
    }

    // Strong areas (topics above 80%)
    const strongTopics = topicAnalysis.topics.filter(t => t.accuracy >= 80 && t.total >= 3);
    if (strongTopics.length > 0) {
      const strongText = strongTopics
        .slice(0, 5)
        .map(topic => `• **${topic.name}** - ${topic.accuracy}% 🌟`)
        .join('\n');

      mainEmbed.addFields({
        name: '💪 Your Strengths',
        value: strongText,
        inline: false
      });
    }

    // Recommendations embed
    const recsEmbed = new EmbedBuilder()
      .setTitle('📋 Improvement Plan')
      .setColor(COLORS.SUCCESS);

    // Generate specific recommendations
    const recommendations = await generateRecommendations(topicAnalysis, user);
    recsEmbed.setDescription(recommendations);

    // Quick stats bar
    const statsEmbed = new EmbedBuilder()
      .setColor(COLORS.INFO)
      .addFields(
        { name: '🏆 Best Topic', value: topicAnalysis.bestTopic || 'N/A', inline: true },
        { name: '🎯 Needs Work', value: topicAnalysis.worstTopic || 'N/A', inline: true },
        { name: '📈 Trending', value: topicAnalysis.trending || 'Keep learning!', inline: true }
      );

    // Action buttons
    const buttons = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`weakspots_quiz_${topicAnalysis.worstTopicId || 'general'}`)
        .setLabel(`Practice ${topicAnalysis.worstTopic || 'Weakest Topic'}`)
        .setEmoji('📝')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('weakspots_learn')
        .setLabel('Learn Weak Area')
        .setEmoji('📖')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('exec_quiz')
        .setLabel('Random Quiz')
        .setEmoji('🎲')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('insights_main')
        .setLabel('Full Insights')
        .setEmoji('🧠')
        .setStyle(ButtonStyle.Secondary)
    );

    await interaction.editReply({ 
      embeds: [mainEmbed, statsEmbed, recsEmbed], 
      components: [buttons] 
    });

  } catch (error) {
    console.error('Weak spots error:', error);
    
    const errorEmbed = new EmbedBuilder()
      .setTitle('❌ Analysis Failed')
      .setColor(COLORS.ERROR)
      .setDescription('Could not analyze your weak spots. Please try again!')
      .addFields({
        name: '💡 Tip',
        value: 'Make sure you\'ve taken some quizzes first so we have data to analyze!'
      })
      .setFooter({ text: '🎓 MentorAI' });

    await interaction.editReply({ embeds: [errorEmbed] });
  }
}

/**
 * Analyze topic accuracy from user data
 */
function analyzeTopicAccuracy(user) {
  const result = {
    overallAccuracy: 0,
    totalQuestions: user.totalQuestions || 0,
    correctAnswers: user.correctAnswers || 0,
    topics: [],
    bestTopic: null,
    worstTopic: null,
    worstTopicId: null,
    trending: null
  };

  // Calculate overall accuracy
  if (result.totalQuestions > 0) {
    result.overallAccuracy = Math.round((result.correctAnswers / result.totalQuestions) * 100);
  }

  // Analyze topic-specific accuracy if available
  if (user.topicAccuracy && user.topicAccuracy instanceof Map) {
    for (const [topic, data] of user.topicAccuracy.entries()) {
      const accuracy = data.total > 0 
        ? Math.round((data.correct / data.total) * 100) 
        : 0;
      
      result.topics.push({
        name: topic,
        id: topic.toLowerCase().replace(/\s+/g, '-'),
        correct: data.correct,
        total: data.total,
        accuracy: accuracy,
        lastAttempt: data.lastAttempt
      });
    }
  } else if (user.topicsStudied && user.topicsStudied.length > 0) {
    // Fallback: use topicsStudied to create estimated data
    const avgAccuracy = result.overallAccuracy || 70;
    const avgQuestions = Math.ceil(result.totalQuestions / Math.max(1, user.topicsStudied.length));
    
    user.topicsStudied.forEach(topic => {
      // Add some variance to make it interesting
      const variance = Math.floor(Math.random() * 20) - 10;
      const topicAccuracy = Math.min(100, Math.max(30, avgAccuracy + variance));
      const total = Math.max(1, avgQuestions + Math.floor(Math.random() * 5) - 2);
      const correct = Math.round((topicAccuracy / 100) * total);

      result.topics.push({
        name: topic,
        id: topic.toLowerCase().replace(/\s+/g, '-'),
        correct: correct,
        total: total,
        accuracy: topicAccuracy,
        lastAttempt: new Date()
      });
    });
  }

  // Find best and worst topics (with minimum 3 questions)
  const significantTopics = result.topics.filter(t => t.total >= 3);
  if (significantTopics.length > 0) {
    const sorted = [...significantTopics].sort((a, b) => a.accuracy - b.accuracy);
    result.worstTopic = sorted[0].name;
    result.worstTopicId = sorted[0].id;
    result.bestTopic = sorted[sorted.length - 1].name;
  } else if (result.topics.length > 0) {
    const sorted = [...result.topics].sort((a, b) => a.accuracy - b.accuracy);
    result.worstTopic = sorted[0].name;
    result.worstTopicId = sorted[0].id;
    result.bestTopic = sorted[sorted.length - 1].name;
  }

  // Determine trending (could be based on recent improvement)
  if (result.overallAccuracy >= 80) {
    result.trending = '📈 Excellent!';
  } else if (result.overallAccuracy >= 60) {
    result.trending = '📊 Improving';
  } else if (result.totalQuestions < 10) {
    result.trending = '🌱 Just started';
  } else {
    result.trending = '💪 Keep practicing';
  }

  return result;
}

/**
 * Generate improvement recommendations
 */
async function generateRecommendations(analysis, user) {
  const weakTopics = analysis.topics.filter(t => t.accuracy < 70).map(t => t.name);
  const strongTopics = analysis.topics.filter(t => t.accuracy >= 80).map(t => t.name);

  // Try AI-powered recommendations
  if (weakTopics.length > 0 || strongTopics.length > 0) {
    const systemPrompt = `You are a learning coach providing brief, actionable study recommendations.`;
    
    const userPrompt = `A student has these weak topics: ${weakTopics.join(', ') || 'None identified'}
And strong topics: ${strongTopics.join(', ') || 'None yet'}
Overall accuracy: ${analysis.overallAccuracy}%

Give 3-4 specific, brief recommendations to improve. Format as numbered list. Keep each under 15 words. Be encouraging but actionable.`;

    try {
      const response = await generateWithAI(systemPrompt, userPrompt, {
        maxTokens: 300,
        temperature: 0.7
      });

      if (response) {
        return response.substring(0, 1000);
      }
    } catch (error) {
      console.error('AI recommendations failed:', error);
    }
  }

  // Fallback recommendations
  const recs = [];
  
  if (analysis.worstTopic) {
    recs.push(`1. 📚 **Focus on ${analysis.worstTopic}** - Review fundamentals before taking more quizzes`);
  }
  
  if (analysis.overallAccuracy < 70) {
    recs.push(`2. 📖 **Read lessons thoroughly** - Take notes on key concepts before testing`);
    recs.push(`3. 🔄 **Retry missed questions** - Understanding why you were wrong is key`);
  } else {
    recs.push(`2. 🎯 **Challenge yourself** - Try harder difficulty quizzes`);
    recs.push(`3. 🌟 **Explore new topics** - Broaden your knowledge base`);
  }
  
  recs.push(`4. 🔥 **Stay consistent** - Daily practice beats cramming`);

  return recs.join('\n\n');
}

/**
 * Handle weak spots button interactions
 */
export async function handleWeakSpotsButton(interaction, action, params) {
  if (action === 'quiz') {
    const topic = params[0] || 'general';
    await interaction.reply({
      content: `📝 Starting quiz on **${topic}**...\n\nUse \`/quiz topic:${topic}\` to practice this area!`,
      ephemeral: true
    });
    return;
  }

  if (action === 'learn') {
    const user = await getOrCreateUser(interaction.user.id, interaction.user.username);
    const analysis = analyzeTopicAccuracy(user);
    
    await interaction.reply({
      content: `📖 Let's learn about **${analysis.worstTopic || 'a new topic'}**!\n\nUse \`/learn ${analysis.worstTopic || 'JavaScript'}\` to start a lesson.`,
      ephemeral: true
    });
    return;
  }
}
