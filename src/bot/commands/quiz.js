// src/bot/commands/quiz.js
// ═══════════════════════════════════════════════════════════════════
// ULTRA QUIZ SYSTEM - MAIN QUIZ COMMAND
// ═══════════════════════════════════════════════════════════════════

import { 
  SlashCommandBuilder, 
  EmbedBuilder, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle,
  StringSelectMenuBuilder
} from 'discord.js';
import { createQuizSession, getCurrentQuestion, submitAnswer, endQuiz, getQuizSession } from '../../services/quizService.js';
import { getOrCreateUser } from '../../services/gamificationService.js';
import {
  QUIZ_COLORS,
  QUIZ_EMOJIS,
  DIFFICULTY,
  QUIZ_TOPICS,
  ASCII_ART,
  COUNTDOWN_FRAMES
} from '../../config/quizConfig.js';
import {
  createProgressBar,
  formatNumber,
  getGrade,
  getStreakMultiplier,
  calculateQuizXP,
  getRankFromXP
} from '../../utils/quizUtils.js';

// ═══════════════════════════════════════════════════════════════════
// COMMAND DEFINITION
// ═══════════════════════════════════════════════════════════════════

export const data = new SlashCommandBuilder()
  .setName('quiz')
  .setDescription('🎯 Take an AI-generated quiz on any programming topic')
  .addStringOption(option =>
    option.setName('topic')
      .setDescription('What topic do you want to be quizzed on?')
      .setRequired(false)
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
        { name: '🟢 Easy - Perfect for beginners', value: 'easy' },
        { name: '🟡 Medium - A balanced challenge', value: 'medium' },
        { name: '🔴 Hard - For experienced learners', value: 'hard' },
        { name: '🟣 Expert - Ultimate challenge', value: 'expert' }
      ))
  .addBooleanOption(option =>
    option.setName('timed')
      .setDescription('Enable timer for each question?'));

// ═══════════════════════════════════════════════════════════════════
// MAIN EXECUTE FUNCTION
// ═══════════════════════════════════════════════════════════════════

export async function execute(interaction) {
  const topic = interaction.options.getString('topic');
  
  // If no topic provided, show Quiz Hub
  if (!topic) {
    return showQuizHub(interaction);
  }
  
  await interaction.deferReply();

  const numQuestions = interaction.options.getInteger('questions') || 5;
  const difficulty = interaction.options.getString('difficulty') || 'medium';
  const timed = interaction.options.getBoolean('timed') ?? true;

  try {
    // Get user and update streak
    const user = await getOrCreateUser(interaction.user.id, interaction.user.username);
    if (user.updateStreak) await user.updateStreak();

    // Show animated loading
    await showLoadingAnimation(interaction, topic, numQuestions, difficulty);

    // Generate quiz
    const session = await createQuizSession(interaction.user.id, topic, numQuestions, difficulty);

    // Check for rate limiting
    if (session?.error === 'rate_limited') {
      return showRateLimitError(interaction, session.waitTime);
    }

    if (!session || !session.questions || session.questions.length === 0) {
      return showGenerationError(interaction, topic);
    }

    // Show countdown animation
    await showCountdown(interaction, topic, difficulty);

    // Get and display first question
    const questionData = await getCurrentQuestion(interaction.user.id);
    if (!questionData || !questionData.question) {
      throw new Error('Failed to get question');
    }

    await showQuestion(interaction, questionData, topic, difficulty, timed, user);

  } catch (error) {
    console.error('Quiz command error:', error);
    await showErrorMessage(interaction, error);
  }
}

// ═══════════════════════════════════════════════════════════════════
// QUIZ HUB - Topic Selection Screen
// ═══════════════════════════════════════════════════════════════════

async function showQuizHub(interaction) {
  const user = await getOrCreateUser(interaction.user.id, interaction.user.username);
  const userRank = getRankFromXP(user.xp || 0);
  const streakData = getStreakMultiplier(user.streak || 0);

  // Build topic list with emojis
  const topicList = Object.entries(QUIZ_TOPICS)
    .slice(0, 12)
    .map(([key, data]) => `${data.emoji} **${data.name}**`)
    .join(' • ');

  const embed = new EmbedBuilder()
    .setColor(QUIZ_COLORS.PRIMARY)
    .setTitle(`${QUIZ_EMOJIS.BRAIN} QUIZ HUB`)
    .setDescription(`
${ASCII_ART.header.quiz}

Welcome back, **${interaction.user.username}**! ${userRank.emoji}

${ASCII_ART.dividerThin}

${QUIZ_EMOJIS.CHART} **Your Stats**
\`\`\`
Level: ${user.level || 1}  •  XP: ${formatNumber(user.xp || 0)}
Streak: ${user.streak || 0} days ${streakData.emoji}
Multiplier: x${streakData.multiplier}
\`\`\`

${ASCII_ART.dividerThin}

${QUIZ_EMOJIS.BOOK} **Popular Topics**
${topicList}

${ASCII_ART.dividerThin}

**Select a topic below or use:**
\`/quiz topic:JavaScript questions:5 difficulty:medium\`
    `)
    .setFooter({ text: `${QUIZ_EMOJIS.LIGHTNING} Powered by AI • Choose a topic to begin!` })
    .setTimestamp();

  // Topic select menu
  const topicOptions = Object.entries(QUIZ_TOPICS).slice(0, 25).map(([key, data]) => ({
    label: data.name,
    value: key,
    emoji: data.emoji,
    description: `Quiz yourself on ${data.name}`
  }));

  const topicMenu = new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId('quiz_topic_select')
      .setPlaceholder('🎯 Select a Topic...')
      .addOptions(topicOptions)
  );

  // Difficulty buttons
  const difficultyRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('quiz_difficulty_easy')
      .setLabel('Easy')
      .setEmoji(QUIZ_EMOJIS.EASY)
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId('quiz_difficulty_medium')
      .setLabel('Medium')
      .setEmoji(QUIZ_EMOJIS.MEDIUM)
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId('quiz_difficulty_hard')
      .setLabel('Hard')
      .setEmoji(QUIZ_EMOJIS.HARD)
      .setStyle(ButtonStyle.Danger),
    new ButtonBuilder()
      .setCustomId('quiz_difficulty_expert')
      .setLabel('Expert')
      .setEmoji(QUIZ_EMOJIS.EXPERT)
      .setStyle(ButtonStyle.Secondary)
  );

  // Quick action buttons
  const quickRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('quiz_quick_random')
      .setLabel('Random Quiz')
      .setEmoji('🎲')
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId('quiz_quick_daily')
      .setLabel('Daily Challenge')
      .setEmoji('📅')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId('quiz_stats')
      .setLabel('My Stats')
      .setEmoji('📊')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId('help_main')
      .setLabel('Menu')
      .setEmoji('🏠')
      .setStyle(ButtonStyle.Secondary)
  );

  await interaction.reply({
    embeds: [embed],
    components: [topicMenu, difficultyRow, quickRow]
  });
}

// ═══════════════════════════════════════════════════════════════════
// LOADING ANIMATION
// ═══════════════════════════════════════════════════════════════════

async function showLoadingAnimation(interaction, topic, numQuestions, difficulty) {
  const diffData = DIFFICULTY[difficulty] || DIFFICULTY.medium;
  const topicData = QUIZ_TOPICS[topic.toLowerCase()] || { emoji: '📚', name: topic };
  
  const stages = [
    { text: 'Connecting to AI...', emoji: '🔌' },
    { text: `Analyzing: ${topic}`, emoji: '🧠' },
    { text: `Generating ${numQuestions} questions...`, emoji: '✍️' },
    { text: 'Preparing quiz...', emoji: '✨' }
  ];

  const loadingEmbed = new EmbedBuilder()
    .setColor(QUIZ_COLORS.INFO)
    .setTitle(`${QUIZ_EMOJIS.LOADING} Generating Quiz...`)
    .setDescription(`
\`\`\`
╔══════════════════════════════════════╗
║         PREPARING YOUR QUIZ          ║
╚══════════════════════════════════════╝
\`\`\`

${topicData.emoji} **Topic:** ${topicData.name || topic}
${diffData.emoji} **Difficulty:** ${diffData.name}
${QUIZ_EMOJIS.BRAIN} **Questions:** ${numQuestions}

${ASCII_ART.dividerThin}

${stages[0].emoji} ${stages[0].text}
    `)
    .setFooter({ text: 'Please wait...' });

  await interaction.editReply({ embeds: [loadingEmbed] });

  // Animate through stages
  for (let i = 1; i < stages.length; i++) {
    await new Promise(r => setTimeout(r, 800));
    
    const progressDesc = stages.slice(0, i + 1)
      .map((s, idx) => `${idx < i ? '✅' : s.emoji} ${s.text}`)
      .join('\n');

    loadingEmbed.setDescription(`
\`\`\`
╔══════════════════════════════════════╗
║         PREPARING YOUR QUIZ          ║
╚══════════════════════════════════════╝
\`\`\`

${topicData.emoji} **Topic:** ${topicData.name || topic}
${diffData.emoji} **Difficulty:** ${diffData.name}
${QUIZ_EMOJIS.BRAIN} **Questions:** ${numQuestions}

${ASCII_ART.dividerThin}

${progressDesc}
    `);

    await interaction.editReply({ embeds: [loadingEmbed] });
  }
}

// ═══════════════════════════════════════════════════════════════════
// COUNTDOWN ANIMATION
// ═══════════════════════════════════════════════════════════════════

async function showCountdown(interaction, topic, difficulty) {
  const diffData = DIFFICULTY[difficulty] || DIFFICULTY.medium;
  
  for (let i = 0; i < COUNTDOWN_FRAMES.length; i++) {
    const frame = COUNTDOWN_FRAMES[i];
    const isLast = i === COUNTDOWN_FRAMES.length - 1;
    
    const countEmbed = new EmbedBuilder()
      .setColor(isLast ? QUIZ_COLORS.SUCCESS : QUIZ_COLORS.WARNING)
      .setTitle(isLast ? `${QUIZ_EMOJIS.LIGHTNING} GO!` : `${frame} Get Ready...`)
      .setDescription(`
\`\`\`
╔══════════════════════════════════════╗
║              ${isLast ? '🚀 STARTING!' : `   ${frame}   `.padStart(22).padEnd(34)}║
╚══════════════════════════════════════╝
\`\`\`

${diffData.emoji} **${diffData.name}** Mode
⏱️ **${diffData.timeLimit}s** per question
      `);

    await interaction.editReply({ embeds: [countEmbed], components: [] });
    
    if (!isLast) {
      await new Promise(r => setTimeout(r, 800));
    }
  }
  
  await new Promise(r => setTimeout(r, 500));
}

// ═══════════════════════════════════════════════════════════════════
// QUESTION DISPLAY
// ═══════════════════════════════════════════════════════════════════

async function showQuestion(interaction, questionData, topic, difficulty, timed, user) {
  const { question, options, questionNum, totalQuestions } = questionData;
  const diffData = DIFFICULTY[difficulty] || DIFFICULTY.medium;
  const topicData = QUIZ_TOPICS[topic.toLowerCase()] || { emoji: '📚', name: topic, color: QUIZ_COLORS.PRIMARY };

  // Progress bar
  const progressBar = createProgressBar(questionNum, totalQuestions, 10);
  const progressPercent = Math.round((questionNum / totalQuestions) * 100);

  const questionEmbed = new EmbedBuilder()
    .setColor(topicData.color || QUIZ_COLORS.PRIMARY)
    .setAuthor({ 
      name: `${topicData.emoji} ${topicData.name || topic} Quiz`,
      iconURL: interaction.user.displayAvatarURL()
    })
    .setTitle(`Question ${questionNum} of ${totalQuestions}`)
    .setDescription(`
\`╔${progressBar}╗\` **${progressPercent}%**

${ASCII_ART.dividerThin}

${QUIZ_EMOJIS.BRAIN} **${question}**

${ASCII_ART.dividerThin}

${QUIZ_EMOJIS.OPTION_A} ${options[0]}
${QUIZ_EMOJIS.OPTION_B} ${options[1]}
${QUIZ_EMOJIS.OPTION_C} ${options[2]}
${QUIZ_EMOJIS.OPTION_D} ${options[3]}

${ASCII_ART.dividerThin}

${diffData.emoji} **${diffData.name}** ${timed ? `• ⏱️ ${diffData.timeLimit}s` : ''}
    `)
    .setFooter({ text: `${QUIZ_EMOJIS.LIGHTNING} Select your answer below • ${user.streak || 0}🔥 streak` })
    .setTimestamp();

  // Answer buttons
  const answerRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`quiz_answer_0_${questionNum}`)
      .setLabel('A')
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId(`quiz_answer_1_${questionNum}`)
      .setLabel('B')
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId(`quiz_answer_2_${questionNum}`)
      .setLabel('C')
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId(`quiz_answer_3_${questionNum}`)
      .setLabel('D')
      .setStyle(ButtonStyle.Primary)
  );

  // Control buttons
  const controlRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('quiz_skip')
      .setLabel('Skip')
      .setEmoji(QUIZ_EMOJIS.SKIPPED)
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId('quiz_hint')
      .setLabel('Hint')
      .setEmoji('💡')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId('quiz_end')
      .setLabel('End Quiz')
      .setEmoji('🛑')
      .setStyle(ButtonStyle.Danger)
  );

  await interaction.editReply({
    embeds: [questionEmbed],
    components: [answerRow, controlRow]
  });
}

// ═══════════════════════════════════════════════════════════════════
// BUTTON HANDLER - Answer Submission
// ═══════════════════════════════════════════════════════════════════

export async function handleButton(interaction, action, params) {
  try {
    if (action === 'answer') {
      const answerIndex = parseInt(params[0], 10);
      await handleAnswerSubmission(interaction, answerIndex);
    } else if (action === 'skip') {
      await handleSkip(interaction);
    } else if (action === 'hint') {
      await handleHint(interaction);
    } else if (action === 'end') {
      await handleEndQuiz(interaction);
    } else if (action === 'topic') {
      await handleTopicSelect(interaction, params[0]);
    } else if (action === 'difficulty') {
      await handleDifficultySelect(interaction, params[0]);
    } else if (action === 'quick') {
      await handleQuickAction(interaction, params[0]);
    } else if (action === 'stats') {
      await handleShowStats(interaction);
    } else if (action === 'review') {
      await handleReview(interaction);
    } else if (action === 'share') {
      await handleShare(interaction);
    } else if (action === 'retry') {
      await handleRetry(interaction);
    }
  } catch (error) {
    console.error('Quiz button handler error:', error);
    await interaction.reply({
      content: `${QUIZ_EMOJIS.INCORRECT} Something went wrong. Please try again!`,
      ephemeral: true
    }).catch(() => {});
  }
}

// ═══════════════════════════════════════════════════════════════════
// ANSWER SUBMISSION
// ═══════════════════════════════════════════════════════════════════

async function handleAnswerSubmission(interaction, answerIndex) {
  await interaction.deferUpdate();

  const result = await submitAnswer(interaction.user.id, answerIndex);
  
  if (!result) {
    return interaction.followUp({
      content: '❌ No active quiz session found. Start a new quiz!',
      ephemeral: true
    });
  }

  const { isCorrect, correctAnswer, explanation, isComplete, session } = result;

  // Show answer feedback briefly
  const feedbackEmbed = new EmbedBuilder()
    .setColor(isCorrect ? QUIZ_COLORS.SUCCESS : QUIZ_COLORS.DANGER)
    .setTitle(isCorrect ? `${QUIZ_EMOJIS.CORRECT} Correct!` : `${QUIZ_EMOJIS.INCORRECT} Incorrect`)
    .setDescription(`
${isCorrect 
  ? `${QUIZ_EMOJIS.SPARKLES} Great job! You got it right!` 
  : `The correct answer was: **${correctAnswer}**`}

${explanation ? `\n📝 **Explanation:**\n${explanation}` : ''}
    `)
    .setFooter({ text: isComplete ? 'Quiz Complete!' : 'Loading next question...' });

  await interaction.editReply({ embeds: [feedbackEmbed], components: [] });

  await new Promise(r => setTimeout(r, 2000));

  if (isComplete) {
    await showResults(interaction, session);
  } else {
    // Get next question
    const nextQuestion = await getCurrentQuestion(interaction.user.id);
    if (nextQuestion) {
      const user = await getOrCreateUser(interaction.user.id, interaction.user.username);
      await showQuestion(
        interaction, 
        nextQuestion, 
        session.topic, 
        session.difficulty || 'medium', 
        true, 
        user
      );
    }
  }
}

// ═══════════════════════════════════════════════════════════════════
// RESULTS DISPLAY
// ═══════════════════════════════════════════════════════════════════

async function showResults(interaction, session) {
  const user = await getOrCreateUser(interaction.user.id, interaction.user.username);
  
  const correct = session.correctCount || 0;
  const total = session.questions?.length || session.totalQuestions || 5;
  const accuracy = (correct / total) * 100;
  const grade = getGrade(accuracy);
  const streakData = getStreakMultiplier(user.streak || 0);
  
  // Calculate XP
  const xpResult = calculateQuizXP({
    correct,
    total,
    difficulty: session.difficulty || 'medium',
    streak: user.streak || 0,
    isPerfect: accuracy === 100
  });

  const topicData = QUIZ_TOPICS[session.topic?.toLowerCase()] || { emoji: '📚', name: session.topic };

  const resultsEmbed = new EmbedBuilder()
    .setColor(grade.color)
    .setTitle(`${grade.emoji} Quiz Complete!`)
    .setDescription(`
${ASCII_ART.header.results}

**Grade: ${grade.grade}** - ${grade.label}

${ASCII_ART.dividerThin}

${QUIZ_EMOJIS.CHART} **PERFORMANCE**

\`\`\`
┌─────────────────────────────────┐
│ ✅ Correct:    ${String(correct).padStart(2)} / ${total}          │
│ 📊 Accuracy:   ${accuracy.toFixed(1).padStart(5)}%         │
│ 🎯 Topic:      ${(topicData.name || session.topic).slice(0, 15).padEnd(15)} │
│ ⚡ Difficulty: ${(session.difficulty || 'Medium').padEnd(15)} │
└─────────────────────────────────┘
\`\`\`

${ASCII_ART.dividerThin}

${QUIZ_EMOJIS.XP} **XP BREAKDOWN**

• Base Reward: **+${xpResult.breakdown.base}** XP
${xpResult.breakdown.accuracy > 0 ? `• Accuracy Bonus: **+${xpResult.breakdown.accuracy}** XP` : ''}
${xpResult.breakdown.difficulty > 0 ? `• Difficulty Bonus: **+${xpResult.breakdown.difficulty}** XP` : ''}
${xpResult.breakdown.perfect ? `• ${QUIZ_EMOJIS.STAR} Perfect Bonus: **+${xpResult.breakdown.perfect}** XP` : ''}
${xpResult.breakdown.streakBonus > 0 ? `• ${QUIZ_EMOJIS.STREAK} Streak Bonus: **+${xpResult.breakdown.streakBonus}** XP` : ''}
${xpResult.breakdown.streakMultiplier > 1 ? `• ${streakData.emoji} Multiplier: **x${xpResult.breakdown.streakMultiplier}**` : ''}

**Total: +${xpResult.total} XP** ${QUIZ_EMOJIS.SPARKLES}

${ASCII_ART.dividerThin}

${QUIZ_EMOJIS.STREAK} Streak: **${user.streak || 0} days** ${streakData.emoji}
    `)
    .setFooter({ text: '🎓 Keep learning to level up!' })
    .setTimestamp();

  // Result action buttons
  const actionRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('quiz_retry')
      .setLabel('Play Again')
      .setEmoji('🔄')
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId('quiz_review')
      .setLabel('Review Answers')
      .setEmoji('📝')
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId('quiz_share')
      .setLabel('Share')
      .setEmoji('📤')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId('help_main')
      .setLabel('Menu')
      .setEmoji('🏠')
      .setStyle(ButtonStyle.Secondary)
  );

  await interaction.editReply({
    embeds: [resultsEmbed],
    components: [actionRow]
  });
}

// ═══════════════════════════════════════════════════════════════════
// HELPER HANDLERS
// ═══════════════════════════════════════════════════════════════════

async function handleSkip(interaction) {
  await interaction.deferUpdate();
  
  const result = await submitAnswer(interaction.user.id, -1);
  
  if (!result) {
    return interaction.followUp({ content: '❌ No active quiz!', ephemeral: true });
  }

  if (result.isComplete) {
    await showResults(interaction, result.session);
  } else {
    const nextQuestion = await getCurrentQuestion(interaction.user.id);
    if (nextQuestion) {
      const user = await getOrCreateUser(interaction.user.id, interaction.user.username);
      await showQuestion(interaction, nextQuestion, result.session.topic, result.session.difficulty, true, user);
    }
  }
}

async function handleHint(interaction) {
  const session = await getQuizSession(interaction.user.id);
  
  if (!session) {
    return interaction.reply({ content: '❌ No active quiz!', ephemeral: true });
  }

  const currentQ = session.questions?.[session.currentQuestion];
  const hintText = currentQ?.hint || 'Think carefully about the fundamentals!';

  await interaction.reply({
    content: `💡 **Hint:** ${hintText}`,
    ephemeral: true
  });
}

async function handleEndQuiz(interaction) {
  await interaction.deferUpdate();
  
  const session = await endQuiz(interaction.user.id);
  
  if (session) {
    await showResults(interaction, session);
  } else {
    await interaction.editReply({
      content: '❌ No active quiz to end.',
      embeds: [],
      components: []
    });
  }
}

async function handleTopicSelect(interaction, topic) {
  await interaction.update({
    content: `Selected: **${QUIZ_TOPICS[topic]?.name || topic}**\nNow choose difficulty and click a difficulty button to start!`,
    components: interaction.message.components
  });
}

async function handleDifficultySelect(interaction, difficulty) {
  await interaction.deferUpdate();
  
  const randomTopic = Object.keys(QUIZ_TOPICS)[Math.floor(Math.random() * Object.keys(QUIZ_TOPICS).length)];
  const topicData = QUIZ_TOPICS[randomTopic];
  
  try {
    const user = await getOrCreateUser(interaction.user.id, interaction.user.username);
    
    await showLoadingAnimation(
      { editReply: (opts) => interaction.editReply(opts), user: interaction.user },
      topicData.name,
      5,
      difficulty
    );

    const session = await createQuizSession(interaction.user.id, topicData.name, 5, difficulty);
    
    if (!session || !session.questions?.length) {
      return showGenerationError({ editReply: (opts) => interaction.editReply(opts) }, topicData.name);
    }

    await showCountdown(
      { editReply: (opts) => interaction.editReply(opts) },
      topicData.name,
      difficulty
    );

    const questionData = await getCurrentQuestion(interaction.user.id);
    await showQuestion(
      { editReply: (opts) => interaction.editReply(opts), user: interaction.user },
      questionData,
      topicData.name,
      difficulty,
      true,
      user
    );
  } catch (error) {
    console.error('Difficulty select error:', error);
    await interaction.editReply({
      content: '❌ Failed to start quiz. Please try again!',
      components: []
    });
  }
}

async function handleQuickAction(interaction, action) {
  if (action === 'random') {
    await handleDifficultySelect(interaction, 'medium');
  } else if (action === 'daily') {
    await interaction.reply({
      content: '📅 Use `/dailychallenge today` for the daily coding challenge!',
      ephemeral: true
    });
  }
}

async function handleShowStats(interaction) {
  const user = await getOrCreateUser(interaction.user.id, interaction.user.username);
  const rank = getRankFromXP(user.xp || 0);
  const streakData = getStreakMultiplier(user.streak || 0);

  const statsEmbed = new EmbedBuilder()
    .setColor(rank.color)
    .setTitle(`${QUIZ_EMOJIS.CHART} Your Quiz Stats`)
    .setDescription(`
${rank.emoji} **${rank.name}**

\`\`\`
Level:     ${user.level || 1}
XP:        ${formatNumber(user.xp || 0)}
Streak:    ${user.streak || 0} days ${streakData.emoji}
Quizzes:   ${user.quizzesCompleted || 0}
Correct:   ${user.correctAnswers || 0}
Accuracy:  ${user.correctAnswers && user.totalAnswers ? ((user.correctAnswers / user.totalAnswers) * 100).toFixed(1) : 0}%
\`\`\`
    `)
    .setFooter({ text: 'Keep quizzing to level up!' });

  await interaction.reply({ embeds: [statsEmbed], ephemeral: true });
}

async function handleReview(interaction) {
  await interaction.reply({
    content: '📝 Review feature coming soon! Use `/progress` to see your learning history.',
    ephemeral: true
  });
}

async function handleShare(interaction) {
  await interaction.reply({
    content: '📤 Share your results with `/share` command!',
    ephemeral: true
  });
}

async function handleRetry(interaction) {
  await interaction.update({
    content: 'Starting new quiz...',
    embeds: [],
    components: []
  });
  
  await showQuizHub({ 
    reply: (opts) => interaction.editReply(opts), 
    user: interaction.user, 
    options: { getString: () => null } 
  });
}

// ═══════════════════════════════════════════════════════════════════
// ERROR HANDLERS
// ═══════════════════════════════════════════════════════════════════

function showRateLimitError(interaction, waitTime) {
  const embed = new EmbedBuilder()
    .setColor(QUIZ_COLORS.WARNING)
    .setTitle(`${QUIZ_EMOJIS.TIMEOUT} Slow Down!`)
    .setDescription(`
You're generating quizzes too quickly!

Please wait **${waitTime} seconds** before creating another quiz.

${ASCII_ART.dividerThin}

💡 **Tip:** Take your time with each quiz to learn better!
    `)
    .setFooter({ text: '⏳ Rate limit helps ensure fair usage' });

  return interaction.editReply({ embeds: [embed], components: [] });
}

function showGenerationError(interaction, topic) {
  const embed = new EmbedBuilder()
    .setColor(QUIZ_COLORS.DANGER)
    .setTitle(`${QUIZ_EMOJIS.INCORRECT} Quiz Generation Failed`)
    .setDescription(`
\`\`\`diff
- Could not generate quiz for "${topic}"
\`\`\`

**💡 Try These Topics:**
\`JavaScript\` \`Python\` \`React\` \`Node.js\` \`HTML\` \`CSS\`

**🔧 Or Try:**
• A more specific topic
• Different difficulty
• Fewer questions
    `)
    .setFooter({ text: '🎓 MentorAI' });

  return interaction.editReply({ embeds: [embed], components: [] });
}

async function showErrorMessage(interaction, error) {
  const embed = new EmbedBuilder()
    .setColor(QUIZ_COLORS.DANGER)
    .setTitle(`${QUIZ_EMOJIS.INCORRECT} Error`)
    .setDescription('Something went wrong while creating your quiz. Please try again!')
    .setFooter({ text: '🎓 MentorAI' });

  await interaction.editReply({ embeds: [embed], components: [] }).catch(() => {});
}

export default { data, execute, handleButton };
