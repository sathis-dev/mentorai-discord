import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { generateWithAI } from '../../ai/index.js';
import { getOrCreateUser } from '../../services/gamificationService.js';
import { COLORS, EMOJIS, createProgressBar } from '../../config/designSystem.js';

export const data = new SlashCommandBuilder()
  .setName('insights')
  .setDescription('🧠 Get AI-powered personalized learning insights and recommendations');

export async function execute(interaction) {
  await interaction.deferReply();

  try {
    const user = await getOrCreateUser(interaction.user.id, interaction.user.username);

    // Show loading embed
    const loadingEmbed = new EmbedBuilder()
      .setTitle(`${EMOJIS.LOADING} Analyzing Your Learning Journey...`)
      .setColor(COLORS.INFO)
      .setDescription('```\n🧠 AI is studying your progress patterns...\n```')
      .setFooter({ text: 'Generating personalized insights...' });

    await interaction.editReply({ embeds: [loadingEmbed] });

    // Calculate learning stats
    const stats = calculateLearningStats(user);

    // Generate AI insights
    const insights = await generateAIInsights(user, stats);

    // Build the main insights embed
    const mainEmbed = new EmbedBuilder()
      .setTitle('🧠 Your Learning Insights')
      .setColor(COLORS.LESSON_BLUE)
      .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
      .setDescription(`> ${insights.personalizedMessage || 'Keep up the great work!'}\n\n**Learning Profile:** ${insights.learnerType || 'Explorer'}`)
      .setTimestamp();

    // Overall Progress Section
    const progressText = [
      `📊 **Level ${user.level}** • ${user.xp}/${user.xpForNextLevel()} XP`,
      createProgressBar(user.xp, user.xpForNextLevel(), 15),
      '',
      `🔥 **Streak:** ${user.streak} days`,
      `📚 **Lessons:** ${user.completedLessons?.length || 0}`,
      `❓ **Quizzes:** ${user.quizzesTaken || 0}`,
      `🎯 **Accuracy:** ${stats.accuracy}%`
    ].join('\n');

    mainEmbed.addFields({ name: '📈 Progress Overview', value: progressText, inline: false });

    // Strengths Section
    if (insights.strengths && insights.strengths.length > 0) {
      const strengthsText = insights.strengths
        .slice(0, 3)
        .map(s => `✅ ${s}`)
        .join('\n');
      mainEmbed.addFields({ name: '💪 Your Strengths', value: strengthsText, inline: true });
    }

    // Areas to Improve
    if (insights.areasToImprove && insights.areasToImprove.length > 0) {
      const improvementsText = insights.areasToImprove
        .slice(0, 3)
        .map(a => `📈 ${a}`)
        .join('\n');
      mainEmbed.addFields({ name: '🎯 Focus Areas', value: improvementsText, inline: true });
    }

    // Learning Pattern Analysis
    mainEmbed.addFields({ name: '\u200B', value: '\u200B', inline: false }); // Spacer

    const patternEmbed = new EmbedBuilder()
      .setTitle('📊 Learning Pattern Analysis')
      .setColor(COLORS.ACHIEVEMENT_PURPLE);

    // Topic breakdown
    if (user.topicsStudied && user.topicsStudied.length > 0) {
      const topicsText = user.topicsStudied
        .slice(0, 5)
        .map((topic, i) => `${i + 1}. ${topic}`)
        .join('\n');
      patternEmbed.addFields({ name: '📚 Topics Explored', value: topicsText || 'Start learning!', inline: true });
    }

    // Activity patterns
    const activityText = [
      `📅 **Member since:** ${formatDate(user.createdAt)}`,
      `⏰ **Last active:** ${formatTimeAgo(user.lastActive)}`,
      `🏆 **Achievements:** ${user.achievements?.length || 0}`
    ].join('\n');
    patternEmbed.addFields({ name: '⚡ Activity', value: activityText, inline: true });

    // Recommendations embed
    const recsEmbed = new EmbedBuilder()
      .setTitle('🚀 Personalized Recommendations')
      .setColor(COLORS.SUCCESS);

    if (insights.recommendations && insights.recommendations.length > 0) {
      const recsText = insights.recommendations
        .slice(0, 4)
        .map((rec, i) => `${i + 1}. ${rec}`)
        .join('\n\n');
      recsEmbed.setDescription(recsText);
    } else {
      recsEmbed.setDescription(getDefaultRecommendations(stats));
    }

    // Next steps
    if (insights.nextSteps) {
      recsEmbed.addFields({ 
        name: '📋 Your Next Steps', 
        value: insights.nextSteps, 
        inline: false 
      });
    }

    // Weekly goal suggestion
    if (insights.weeklyGoal) {
      recsEmbed.addFields({
        name: '🎯 Suggested Weekly Goal',
        value: `> ${insights.weeklyGoal}`,
        inline: false
      });
    }

    recsEmbed.setFooter({ text: '💡 Insights are personalized based on your learning history' });

    // Action buttons
    const buttons = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('insights_weakspots')
        .setLabel('View Weak Spots')
        .setEmoji('🎯')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('insights_studyplan')
        .setLabel('Generate Study Plan')
        .setEmoji('📋')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('exec_learn')
        .setLabel('Start Learning')
        .setEmoji('📚')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId('exec_quiz')
        .setLabel('Take Quiz')
        .setEmoji('❓')
        .setStyle(ButtonStyle.Secondary)
    );

    await interaction.editReply({ 
      embeds: [mainEmbed, patternEmbed, recsEmbed], 
      components: [buttons] 
    });

  } catch (error) {
    console.error('Insights error:', error);
    
    const errorEmbed = new EmbedBuilder()
      .setTitle('❌ Insights Generation Failed')
      .setColor(COLORS.ERROR)
      .setDescription('Could not generate your learning insights. Please try again!')
      .setFooter({ text: '🎓 MentorAI' });

    await interaction.editReply({ embeds: [errorEmbed] });
  }
}

/**
 * Calculate learning statistics from user data
 */
function calculateLearningStats(user) {
  const totalQuestions = user.totalQuestions || 0;
  const correctAnswers = user.correctAnswers || 0;
  const accuracy = totalQuestions > 0 
    ? Math.round((correctAnswers / totalQuestions) * 100) 
    : 0;

  const lessonsCount = user.completedLessons?.length || 0;
  const quizCount = user.quizzesTaken || 0;
  const topicCount = user.topicsStudied?.length || 0;
  
  // Calculate engagement score
  const engagementScore = Math.min(100, 
    (lessonsCount * 5) + 
    (quizCount * 3) + 
    (user.streak * 2) + 
    (topicCount * 10)
  );

  // Calculate consistency (based on streak)
  const consistencyScore = Math.min(100, user.streak * 10);

  // Days since account creation
  const daysSinceCreation = Math.floor(
    (Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24)
  );
  const lessonsPerDay = daysSinceCreation > 0 
    ? (lessonsCount / daysSinceCreation).toFixed(2) 
    : lessonsCount;

  return {
    accuracy,
    lessonsCount,
    quizCount,
    topicCount,
    engagementScore,
    consistencyScore,
    daysSinceCreation,
    lessonsPerDay,
    totalXP: user.xp,
    level: user.level,
    streak: user.streak,
    achievements: user.achievements?.length || 0
  };
}

/**
 * Generate AI-powered insights
 */
async function generateAIInsights(user, stats) {
  const userContext = `
User Profile:
- Level: ${stats.level}
- XP: ${stats.totalXP}
- Streak: ${stats.streak} days
- Accuracy: ${stats.accuracy}%
- Lessons completed: ${stats.lessonsCount}
- Quizzes taken: ${stats.quizCount}
- Topics studied: ${user.topicsStudied?.join(', ') || 'None yet'}
- Achievements: ${stats.achievements}
- Days active: ${stats.daysSinceCreation}
- Engagement score: ${stats.engagementScore}/100
- Consistency score: ${stats.consistencyScore}/100
`;

  const systemPrompt = `You are an AI learning coach analyzing a student's coding journey.
Provide personalized, encouraging insights that are specific to their data.
Be positive but honest. Give actionable advice.

IMPORTANT: Respond in valid JSON format only.`;

  const userPrompt = `${userContext}

Analyze this learner and provide insights in this JSON format:
{
  "personalizedMessage": "A warm, personalized message about their journey (1-2 sentences)",
  "learnerType": "Categorize them: Beginner Explorer | Steady Learner | Rising Star | Dedicated Student | Power Learner | Master Coder",
  "strengths": ["Specific strength 1", "Specific strength 2", "Specific strength 3"],
  "areasToImprove": ["Area 1 based on data", "Area 2"],
  "recommendations": [
    "Specific actionable recommendation based on their topics",
    "Learning activity they should try",
    "Way to improve their weak areas",
    "Challenge appropriate for their level"
  ],
  "nextSteps": "A clear 1-2 sentence next step they should take",
  "weeklyGoal": "A specific, achievable weekly goal"
}

Make insights specific to their actual data. Don't be generic.`;

  try {
    const response = await generateWithAI(systemPrompt, userPrompt, {
      maxTokens: 800,
      temperature: 0.7,
      jsonMode: true
    });

    if (response) {
      try {
        return JSON.parse(response);
      } catch {
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }
      }
    }
  } catch (error) {
    console.error('AI insights generation failed:', error);
  }

  // Fallback insights if AI fails
  return generateFallbackInsights(user, stats);
}

/**
 * Generate fallback insights when AI is unavailable
 */
function generateFallbackInsights(user, stats) {
  const insights = {
    personalizedMessage: `You're doing great with your ${stats.streak}-day streak! Keep the momentum going.`,
    learnerType: getLearnerType(stats),
    strengths: [],
    areasToImprove: [],
    recommendations: [],
    nextSteps: '',
    weeklyGoal: ''
  };

  // Determine strengths
  if (stats.streak >= 7) insights.strengths.push('Excellent consistency with daily practice');
  if (stats.accuracy >= 80) insights.strengths.push('Strong quiz performance');
  if (stats.topicCount >= 5) insights.strengths.push('Wide range of topics explored');
  if (stats.lessonsCount >= 10) insights.strengths.push('Dedicated lesson completion');
  if (insights.strengths.length === 0) insights.strengths.push('Eagerness to learn new things');

  // Determine areas to improve
  if (stats.streak < 3) insights.areasToImprove.push('Build a daily learning habit');
  if (stats.accuracy < 70) insights.areasToImprove.push('Focus on understanding concepts before quizzes');
  if (stats.topicCount < 3) insights.areasToImprove.push('Explore more diverse topics');
  if (insights.areasToImprove.length === 0) insights.areasToImprove.push('Challenge yourself with harder content');

  // Recommendations based on level
  if (stats.level < 5) {
    insights.recommendations = [
      'Complete your daily lesson to build momentum',
      'Try the /quiz command to test your knowledge',
      'Explore the /topics command to find new areas'
    ];
    insights.nextSteps = 'Start with /learn to get your first lesson of the day!';
    insights.weeklyGoal = 'Complete 5 lessons and maintain a 3-day streak';
  } else if (stats.level < 15) {
    insights.recommendations = [
      'Challenge yourself with harder difficulty quizzes',
      'Try coding challenges with /run',
      'Explore advanced topics in your favorite subject'
    ];
    insights.nextSteps = 'Take a hard difficulty quiz to push your limits!';
    insights.weeklyGoal = 'Achieve 85% accuracy across 10 quizzes';
  } else {
    insights.recommendations = [
      'Help others in the community to reinforce your learning',
      'Try the speedrun challenges for competitive practice',
      'Explore project-based learning'
    ];
    insights.nextSteps = 'You\'re ready for advanced challenges!';
    insights.weeklyGoal = 'Complete a project and maintain your streak';
  }

  return insights;
}

/**
 * Determine learner type based on stats
 */
function getLearnerType(stats) {
  if (stats.level >= 25 && stats.accuracy >= 85) return 'Master Coder 🏆';
  if (stats.level >= 15) return 'Power Learner ⚡';
  if (stats.engagementScore >= 70) return 'Dedicated Student 📚';
  if (stats.streak >= 7) return 'Rising Star ⭐';
  if (stats.lessonsCount >= 5) return 'Steady Learner 📖';
  return 'Beginner Explorer 🌱';
}

/**
 * Get default recommendations based on stats
 */
function getDefaultRecommendations(stats) {
  const recs = [];
  
  if (stats.streak < 3) {
    recs.push('🔥 **Build Your Streak** - Learn daily to unlock streak bonuses');
  }
  if (stats.accuracy < 75) {
    recs.push('📖 **Review Before Quizzes** - Read lessons carefully before testing');
  }
  if (stats.topicCount < 5) {
    recs.push('🗺️ **Explore More Topics** - Broaden your knowledge base');
  }
  if (stats.quizCount < 10) {
    recs.push('❓ **Take More Quizzes** - Practice makes perfect');
  }
  
  recs.push('🚀 **Set Daily Goals** - Consistency beats intensity');
  
  return recs.slice(0, 4).join('\n\n');
}

/**
 * Format date for display
 */
function formatDate(date) {
  if (!date) return 'Unknown';
  return new Date(date).toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  });
}

/**
 * Format time ago
 */
function formatTimeAgo(date) {
  if (!date) return 'Unknown';
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  
  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return formatDate(date);
}

/**
 * Handle insight button interactions
 */
export async function handleInsightButton(interaction, action) {
  if (action === 'weakspots') {
    // Redirect to weak spots analysis
    await interaction.reply({
      content: '🎯 Use `/weak-spots` to see your detailed topic accuracy breakdown!',
      ephemeral: true
    });
    return;
  }

  if (action === 'studyplan') {
    await interaction.deferReply({ ephemeral: true });
    
    const user = await getOrCreateUser(interaction.user.id, interaction.user.username);
    const studyPlan = await generateStudyPlan(user);
    
    const planEmbed = new EmbedBuilder()
      .setTitle('📋 Your Personalized Study Plan')
      .setColor(COLORS.LESSON_BLUE)
      .setDescription(studyPlan)
      .setFooter({ text: '💡 Follow this plan for optimal learning progress!' });

    await interaction.editReply({ embeds: [planEmbed] });
    return;
  }
}

/**
 * Generate a personalized study plan
 */
async function generateStudyPlan(user) {
  const topics = user.topicsStudied || ['JavaScript', 'Python'];
  const level = user.level || 1;
  
  const plan = [
    `**📅 This Week's Focus**`,
    ``,
    `**Day 1-2:** Review fundamentals in ${topics[0] || 'JavaScript'}`,
    `• Complete 2 lessons`,
    `• Take 1 easy quiz`,
    ``,
    `**Day 3-4:** Practice and apply`,
    `• Try a coding challenge with /run`,
    `• Get code review feedback`,
    ``,
    `**Day 5-6:** Explore new topics`,
    `• Learn something from a new area`,
    `• Take a medium difficulty quiz`,
    ``,
    `**Day 7:** Review and test`,
    `• Review weak areas`,
    `• Take a comprehensive quiz`,
    ``,
    `**🎯 Weekly Goals:**`,
    `• Complete 7 lessons`,
    `• Take 5 quizzes with 80%+ accuracy`,
    `• Maintain your streak!`
  ];

  return plan.join('\n');
}
