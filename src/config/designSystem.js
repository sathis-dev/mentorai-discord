import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } from 'discord.js';

// Premium Color Palette
export const COLORS = {
  // Primary Brand Colors
  PRIMARY: 0x5865F2,
  SECONDARY: 0x99AAB5,
  
  // Status Colors
  SUCCESS: 0x57F287,
  WARNING: 0xFEE75C,
  ERROR: 0xED4245,
  INFO: 0x5865F2,
  
  // Feature Colors
  XP_GOLD: 0xFFD700,
  STREAK_FIRE: 0xFF6B35,
  ACHIEVEMENT_PURPLE: 0x9B59B6,
  LESSON_BLUE: 0x3498DB,
  QUIZ_PINK: 0xE91E63,
  CHALLENGE_RED: 0xE74C3C,
  
  // Gradient-like Colors
  PREMIUM_GOLD: 0xF1C40F,
  DIAMOND: 0x00D9FF,
  EMERALD: 0x2ECC71,
  RUBY: 0xE91E63,
  SAPPHIRE: 0x3498DB,
  AMETHYST: 0x9B59B6,
  
  // Level Colors (for different tiers)
  BRONZE: 0xCD7F32,
  SILVER: 0xC0C0C0,
  GOLD: 0xFFD700,
  PLATINUM: 0xE5E4E2,
  LEGENDARY: 0xFF00FF
};

// Emoji Constants for consistent branding
export const EMOJIS = {
  // Status
  SUCCESS: '✅',
  ERROR: '❌',
  WARNING: '⚠️',
  INFO: 'ℹ️',
  LOADING: '⏳',
  
  // Gamification
  XP: '✨',
  LEVEL: '⭐',
  STREAK: '🔥',
  ACHIEVEMENT: '🏆',
  CROWN: '👑',
  GEM: '💎',
  
  // Learning
  BOOK: '📚',
  LESSON: '📖',
  QUIZ: '❓',
  CODE: '💻',
  BRAIN: '🧠',
  LIGHTBULB: '💡',
  TARGET: '🎯',
  
  // Progress
  PROGRESS: '📊',
  CHART: '📈',
  ROCKET: '🚀',
  MEDAL_GOLD: '🥇',
  MEDAL_SILVER: '🥈',
  MEDAL_BRONZE: '🥉',
  
  // Actions
  PLAY: '▶️',
  PAUSE: '⏸️',
  STOP: '⏹️',
  SKIP: '⏭️',
  REFRESH: '🔄',
  
  // Options
  A: '🅰️',
  B: '🅱️',
  C: '🅲',
  D: '🅳',
  
  // Misc
  STAR: '⭐',
  SPARKLES: '✨',
  FIRE: '🔥',
  PARTY: '🎉',
  TROPHY: '🏆',
  HEART: '❤️',
  CLOCK: '⏰',
  CALENDAR: '📅'
};

// Progress Bar Styles
export function createProgressBar(current, max, length = 10, style = 'default') {
  const percentage = Math.min(Math.max(current / max, 0), 1);
  const filled = Math.round(percentage * length);
  const empty = length - filled;
  
  const styles = {
    default: { filled: '█', empty: '░' },
    rounded: { filled: '●', empty: '○' },
    squares: { filled: '◆', empty: '◇' },
    arrows: { filled: '▶', empty: '▷' },
    blocks: { filled: '▓', empty: '░' },
    dots: { filled: '⬤', empty: '○' },
    stars: { filled: '★', empty: '☆' },
    hearts: { filled: '❤️', empty: '🤍' },
    fire: { filled: '🔥', empty: '⬜' }
  };
  
  const s = styles[style] || styles.default;
  return s.filled.repeat(filled) + s.empty.repeat(empty);
}

// Animated-style text effects
export function createGlowText(text) {
  return '✧ ' + text + ' ✧';
}

export function createHeaderText(text) {
  return '═══════════════════════\n' + text + '\n═══════════════════════';
}

export function createSectionDivider() {
  return '━━━━━━━━━━━━━━━━━━━━━━━━━━━';
}

// ============================================================
// PREMIUM EMBED BUILDERS
// ============================================================

export function createPremiumEmbed(options = {}) {
  const embed = new EmbedBuilder();
  
  if (options.title) embed.setTitle(options.title);
  if (options.description) embed.setDescription(options.description);
  if (options.color) embed.setColor(options.color);
  if (options.thumbnail) embed.setThumbnail(options.thumbnail);
  if (options.image) embed.setImage(options.image);
  if (options.author) embed.setAuthor(options.author);
  if (options.fields) embed.addFields(options.fields);
  
  embed.setTimestamp();
  embed.setFooter({ 
    text: options.footerText || '🎓 MentorAI | AI-Powered Learning',
    iconURL: options.footerIcon || undefined
  });
  
  return embed;
}

// Quiz Question Embed with Rich UI
export function createQuizQuestionEmbed(question, questionNum, totalQuestions, topic, difficulty) {
  const difficultyColors = {
    easy: COLORS.SUCCESS,
    medium: COLORS.WARNING,
    hard: COLORS.ERROR
  };
  
  const difficultyEmojis = {
    easy: '🟢',
    medium: '🟡',
    hard: '🔴'
  };
  
  const embed = new EmbedBuilder()
    .setTitle(EMOJIS.QUIZ + ' Question ' + questionNum + '/' + totalQuestions)
    .setColor(difficultyColors[difficulty] || COLORS.QUIZ_PINK)
    .setDescription('```\n' + question.question + '\n```')
    .addFields(
      {
        name: EMOJIS.A + ' Option A',
        value: '> ' + (question.options[0] || 'N/A'),
        inline: true
      },
      {
        name: EMOJIS.B + ' Option B',
        value: '> ' + (question.options[1] || 'N/A'),
        inline: true
      },
      { name: '\u200B', value: '\u200B', inline: true },
      {
        name: EMOJIS.C + ' Option C',
        value: '> ' + (question.options[2] || 'N/A'),
        inline: true
      },
      {
        name: EMOJIS.D + ' Option D',
        value: '> ' + (question.options[3] || 'N/A'),
        inline: true
      },
      { name: '\u200B', value: '\u200B', inline: true }
    )
    .addFields({
      name: createSectionDivider(),
      value: '**Topic:** ' + topic + ' | **Difficulty:** ' + difficultyEmojis[difficulty] + ' ' + 
        (difficulty ? difficulty.charAt(0).toUpperCase() + difficulty.slice(1) : 'Medium'),
      inline: false
    })
    .setFooter({ text: '🎓 MentorAI | Select your answer below' })
    .setTimestamp();
  
  return embed;
}

// Answer Result Embed
export function createAnswerResultEmbed(isCorrect, explanation, xpEarned = 0) {
  const embed = new EmbedBuilder()
    .setTitle(isCorrect ? '✅ Correct Answer!' : '❌ Incorrect!')
    .setColor(isCorrect ? COLORS.SUCCESS : COLORS.ERROR)
    .setDescription(isCorrect 
      ? '🎉 **Excellent work!** You got it right!\n\n' + (xpEarned > 0 ? '**+' + xpEarned + ' XP earned!**' : '')
      : '💪 **Keep learning!** Every mistake is a step forward.')
    .addFields({
      name: '📝 Explanation',
      value: '> ' + (explanation || 'This is the correct answer based on the concept.'),
      inline: false
    })
    .setTimestamp();
  
  return embed;
}

// Quiz Results Embed with Rich Stats
export function createQuizResultsEmbed(result) {
  const percentage = result.percentage || Math.round((result.score / result.totalQuestions) * 100);
  const grade = getGrade(percentage);
  const gradeColor = getGradeColor(percentage);
  
  // Create visual score display
  const scoreBar = createProgressBar(result.score, result.totalQuestions, 10, 'stars');
  
  // Create answer breakdown visualization
  const answerBreakdown = result.answers 
    ? result.answers.map((a, i) => (a.isCorrect ? '✅' : '❌')).join(' ')
    : '';
  
  const embed = new EmbedBuilder()
    .setTitle('🎉 Quiz Complete!')
    .setColor(gradeColor)
    .setDescription(getResultBanner(percentage))
    .addFields(
      { name: '📊 Score', value: '**' + result.score + '/' + result.totalQuestions + '** (' + percentage + '%)', inline: true },
      { name: '🏆 Grade', value: '**' + grade + '**', inline: true },
      { name: '✨ XP Earned', value: '**+' + (result.xpEarned || 0) + ' XP**', inline: true },
      { name: '📈 Performance', value: scoreBar, inline: false },
      { name: '📝 Answer Breakdown', value: answerBreakdown || 'N/A', inline: false }
    );
  
  if (result.leveledUp) {
    embed.addFields({
      name: '🆙 LEVEL UP!',
      value: '```diff\n+ You reached Level ' + result.newLevel + '!\n```',
      inline: false
    });
  }
  
  if (result.achievements && result.achievements.length > 0) {
    embed.addFields({
      name: '🏆 Achievements Unlocked',
      value: result.achievements.map(a => '🎖️ ' + a).join('\n'),
      inline: false
    });
  }
  
  if (result.conceptsToReview && result.conceptsToReview.length > 0) {
    embed.addFields({
      name: '📚 Concepts to Review',
      value: result.conceptsToReview.map(c => '• ' + c).join('\n'),
      inline: false
    });
  }
  
  embed.setFooter({ text: '🎓 MentorAI | Keep learning and growing!' });
  embed.setTimestamp();
  
  return embed;
}

// Lesson Embed with Premium Layout
export function createLessonEmbed(lesson, xpEarned = 0) {
  const embed = new EmbedBuilder()
    .setTitle(EMOJIS.BOOK + ' ' + (lesson.title || 'Lesson'))
    .setColor(COLORS.LESSON_BLUE)
    .setDescription('> ' + (lesson.introduction || lesson.content?.substring(0, 200) || ''));
  
  if (lesson.content) {
    const content = lesson.content.length > 800 
      ? lesson.content.substring(0, 800) + '...'
      : lesson.content;
    embed.addFields({
      name: '📖 Content',
      value: content,
      inline: false
    });
  }
  
  if (lesson.keyPoints && lesson.keyPoints.length > 0) {
    embed.addFields({
      name: '🔑 Key Points',
      value: lesson.keyPoints.map((p, i) => '**' + (i + 1) + '.** ' + p).join('\n'),
      inline: false
    });
  }
  
  if (lesson.codeExample) {
    const code = typeof lesson.codeExample === 'string' 
      ? lesson.codeExample 
      : lesson.codeExample.code || '';
    embed.addFields({
      name: '💻 Code Example',
      value: '```javascript\n' + code.substring(0, 500) + '\n```',
      inline: false
    });
  }
  
  if (xpEarned > 0) {
    embed.addFields({
      name: '✨ Rewards',
      value: '**+' + xpEarned + ' XP** earned for completing this lesson!',
      inline: false
    });
  }
  
  embed.setFooter({ text: '🎓 MentorAI | AI-Powered Learning' });
  embed.setTimestamp();
  
  return embed;
}

// Progress/Stats Embed with Visual Flair
export function createProgressEmbed(user, avatarURL) {
  const level = user.level || 1;
  const xp = user.xp || 0;
  const xpNeeded = typeof user.xpForNextLevel === 'function' ? user.xpForNextLevel() : 100;
  const streak = user.streak || 0;
  const accuracy = user.totalQuestions > 0 
    ? Math.round((user.correctAnswers / user.totalQuestions) * 100) 
    : 0;
  
  const xpBar = createProgressBar(xp, xpNeeded, 12, 'blocks');
  const tierEmoji = getTierEmoji(level);
  
  const embed = new EmbedBuilder()
    .setTitle(tierEmoji + ' ' + (user.username || 'User') + '\'s Profile')
    .setColor(getTierColor(level))
    .setThumbnail(avatarURL)
    .setDescription('```ansi\n\u001b[1;33m⭐ Level ' + level + ' Learner\u001b[0m\n```')
    .addFields(
      { 
        name: '📊 Experience', 
        value: xpBar + '\n**' + xp.toLocaleString() + '** / **' + xpNeeded.toLocaleString() + '** XP', 
        inline: false 
      },
      { name: '⭐ Level', value: '**' + level + '**', inline: true },
      { name: '🔥 Streak', value: '**' + streak + '** days', inline: true },
      { name: '🎯 Accuracy', value: '**' + accuracy + '%**', inline: true },
      { name: '📝 Quizzes', value: '**' + (user.quizzesTaken || 0) + '**', inline: true },
      { name: '📚 Lessons', value: '**' + (user.completedLessons?.length || 0) + '**', inline: true },
      { name: '🏆 Achievements', value: '**' + (user.achievements?.length || 0) + '**', inline: true }
    );
  
  if (user.achievements && user.achievements.length > 0) {
    embed.addFields({
      name: '🎖️ Recent Achievements',
      value: user.achievements.slice(-3).map(a => '• ' + a).join('\n'),
      inline: false
    });
  }
  
  embed.setFooter({ text: '🎓 MentorAI | Keep leveling up!' });
  embed.setTimestamp();
  
  return embed;
}

// Leaderboard Embed
export function createLeaderboardEmbed(users, page = 1) {
  const medals = ['🥇', '🥈', '🥉'];
  const startRank = (page - 1) * 10;
  
  let description = '';
  users.forEach((user, index) => {
    const rank = startRank + index + 1;
    const medal = medals[rank - 1] || '**#' + rank + '**';
    const tierEmoji = getTierEmoji(user.level || 1);
    
    description += medal + ' ' + tierEmoji + ' **' + (user.username || 'Unknown') + '**\n';
    description += '   └ Level **' + (user.level || 1) + '** • **' + (user.xp || 0).toLocaleString() + '** XP • 🔥 **' + (user.streak || 0) + '**\n\n';
  });
  
  const embed = new EmbedBuilder()
    .setTitle('🏆 Global Leaderboard')
    .setColor(COLORS.XP_GOLD)
    .setDescription(description || 'No users yet! Be the first to start learning!')
    .setFooter({ text: '🎓 MentorAI | Page ' + page })
    .setTimestamp();
  
  return embed;
}

// Daily Bonus Embed
export function createDailyBonusEmbed(result, motivation, dailyTip) {
  const embed = new EmbedBuilder()
    .setTitle('🎁 Daily Bonus Claimed!')
    .setColor(COLORS.XP_GOLD)
    .setDescription('```diff\n+ Welcome back! Here are your rewards:\n```')
    .addFields(
      { name: '✨ Base XP', value: '+' + (result.baseXp || 75), inline: true },
      { name: '🔥 Streak Bonus', value: '+' + (result.streakBonus || 0), inline: true },
      { name: '💰 Total XP', value: '**+' + result.xpEarned + '**', inline: true },
      { 
        name: '🔥 Current Streak', 
        value: createStreakDisplay(result.streak), 
        inline: false 
      }
    );
  
  if (result.leveledUp) {
    embed.addFields({
      name: '🆙 LEVEL UP!',
      value: '```diff\n+ Congratulations! You reached Level ' + result.newLevel + '!\n```',
      inline: false
    });
  }
  
  if (motivation && motivation.message) {
    embed.addFields({
      name: '💬 AI Motivation',
      value: '> _"' + motivation.message + '"_',
      inline: false
    });
  }
  
  if (dailyTip && dailyTip.tip) {
    embed.addFields({
      name: '💡 Today\'s Tip: ' + (dailyTip.category || 'Learning'),
      value: dailyTip.tip,
      inline: false
    });
  }
  
  embed.setFooter({ text: '🎓 MentorAI | Come back tomorrow for more rewards!' });
  embed.setTimestamp();
  
  return embed;
}

// Streak Display Helper
function createStreakDisplay(streak) {
  if (streak >= 30) return '👑 **' + streak + ' days** - LEGENDARY STREAK!';
  if (streak >= 14) return '⚡ **' + streak + ' days** - You\'re on fire!';
  if (streak >= 7) return '🔥 **' + streak + ' days** - Week warrior!';
  if (streak >= 3) return '✨ **' + streak + ' days** - Keep it up!';
  return '🌱 **' + streak + ' day' + (streak !== 1 ? 's' : '') + '** - Just getting started!';
}

// Help Menu Embed
export function createHelpEmbed() {
  return new EmbedBuilder()
    .setTitle('📖 MentorAI Command Center')
    .setColor(COLORS.PRIMARY)
    .setDescription('Your AI-powered learning companion! Here\'s everything you can do:')
    .addFields(
      {
        name: '📚 __Learning Commands__',
        value: '`/learn` - Get AI-generated lessons on any topic\n' +
          '`/quiz` - Test your knowledge with AI quizzes\n' +
          '`/explain` - Get detailed concept explanations\n' +
          '`/topics` - Browse popular learning topics',
        inline: false
      },
      {
        name: '📊 __Progress Commands__',
        value: '`/progress` - View your stats and achievements\n' +
          '`/leaderboard` - See top learners globally\n' +
          '`/achievements` - View all your achievements\n' +
          '`/stats` - Global bot statistics',
        inline: false
      },
      {
        name: '🎮 __Gamification Commands__',
        value: '`/daily` - Claim daily XP bonus + AI tips\n' +
          '`/streak` - Check your learning streak\n' +
          '`/challenge` - Challenge friends to quiz battles',
        inline: false
      },
      {
        name: '👥 __Social Commands__',
        value: '`/studyparty` - Start or join study sessions\n' +
          '`/path` - Generate learning paths\n' +
          '`/invite` - Add MentorAI to your server',
        inline: false
      },
      {
        name: '🔧 __Utility Commands__',
        value: '`/ping` - Check bot status\n' +
          '`/help` - Show this menu',
        inline: false
      }
    )
    .setFooter({ text: '🎓 MentorAI | Powered by AI | Made with ❤️' })
    .setTimestamp();
}

// ============================================================
// BUTTON BUILDERS
// ============================================================

export function createQuizAnswerButtons(disabled = false) {
  const row = new ActionRowBuilder();
  const labels = ['A', 'B', 'C', 'D'];
  const styles = [ButtonStyle.Primary, ButtonStyle.Primary, ButtonStyle.Primary, ButtonStyle.Primary];
  
  for (let i = 0; i < 4; i++) {
    row.addComponents(
      new ButtonBuilder()
        .setCustomId('quiz_answer_' + i)
        .setLabel(labels[i])
        .setStyle(styles[i])
        .setDisabled(disabled)
    );
  }
  
  return row;
}

export function createQuizControlButtons() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('quiz_hint')
      .setLabel('Hint')
      .setEmoji('💡')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(true),
    new ButtonBuilder()
      .setCustomId('quiz_fifty')
      .setLabel('50/50')
      .setEmoji('✂️')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(true),
    new ButtonBuilder()
      .setCustomId('quiz_cancel')
      .setLabel('Cancel Quiz')
      .setEmoji('🛑')
      .setStyle(ButtonStyle.Danger)
  );
}

export function createPostQuizButtons(topic) {
  const encodedTopic = encodeURIComponent(topic || 'general');
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('quiz_restart_' + encodedTopic)
      .setLabel('Try Again')
      .setEmoji('🔄')
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId('lesson_suggest_' + encodedTopic)
      .setLabel('Learn More')
      .setEmoji('📚')
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId('leaderboard_view')
      .setLabel('Leaderboard')
      .setEmoji('🏆')
      .setStyle(ButtonStyle.Secondary)
  );
}

export function createLessonButtons(topic) {
  const encodedTopic = encodeURIComponent(topic || 'general');
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('quiz_start_' + encodedTopic)
      .setLabel('Take Quiz')
      .setEmoji('🎯')
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId('lesson_next_' + encodedTopic)
      .setLabel('Next Lesson')
      .setEmoji('➡️')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId('lesson_explain_' + encodedTopic)
      .setLabel('Explain More')
      .setEmoji('❓')
      .setStyle(ButtonStyle.Secondary)
  );
}

export function createNavigationButtons(currentPage, totalPages, prefix) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(prefix + '_first')
      .setLabel('≪')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(currentPage <= 1),
    new ButtonBuilder()
      .setCustomId(prefix + '_prev')
      .setLabel('◀')
      .setStyle(ButtonStyle.Primary)
      .setDisabled(currentPage <= 1),
    new ButtonBuilder()
      .setCustomId(prefix + '_page')
      .setLabel(currentPage + ' / ' + totalPages)
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(true),
    new ButtonBuilder()
      .setCustomId(prefix + '_next')
      .setLabel('▶')
      .setStyle(ButtonStyle.Primary)
      .setDisabled(currentPage >= totalPages),
    new ButtonBuilder()
      .setCustomId(prefix + '_last')
      .setLabel('≫')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(currentPage >= totalPages)
  );
}

// ============================================================
// SELECT MENU BUILDERS
// ============================================================

export function createTopicSelectMenu(topics) {
  return new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId('topic_select')
      .setPlaceholder('🎯 Select a topic to explore...')
      .addOptions(topics.map(t => ({
        label: t.name,
        description: t.description,
        value: t.name.toLowerCase(),
        emoji: t.emoji
      })))
  );
}

export function createDifficultySelectMenu() {
  return new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId('difficulty_select')
      .setPlaceholder('📊 Select difficulty level...')
      .addOptions([
        { label: 'Easy', description: 'Perfect for beginners', value: 'easy', emoji: '🟢' },
        { label: 'Medium', description: 'Some challenge awaits', value: 'medium', emoji: '🟡' },
        { label: 'Hard', description: 'For advanced learners', value: 'hard', emoji: '🔴' },
        { label: 'Expert', description: 'Ultimate challenge', value: 'expert', emoji: '💀' }
      ])
  );
}

// ============================================================
// UTILITY FUNCTIONS
// ============================================================

function getGrade(percentage) {
  if (percentage >= 95) return '🌟 S+';
  if (percentage >= 90) return '⭐ A+';
  if (percentage >= 85) return '⭐ A';
  if (percentage >= 80) return '📗 B+';
  if (percentage >= 75) return '📗 B';
  if (percentage >= 70) return '📘 C+';
  if (percentage >= 65) return '📘 C';
  if (percentage >= 60) return '📙 D';
  return '📕 F';
}

function getGradeColor(percentage) {
  if (percentage >= 90) return COLORS.XP_GOLD;
  if (percentage >= 80) return COLORS.SUCCESS;
  if (percentage >= 70) return COLORS.SAPPHIRE;
  if (percentage >= 60) return COLORS.WARNING;
  return COLORS.ERROR;
}

function getResultBanner(percentage) {
  if (percentage === 100) return '```diff\n+ 🎯 PERFECT SCORE! 🎯\n+ You are a true master!\n```';
  if (percentage >= 90) return '```diff\n+ 🌟 OUTSTANDING!\n+ Nearly perfect performance!\n```';
  if (percentage >= 80) return '```fix\n⭐ EXCELLENT!\nYou really know your stuff!\n```';
  if (percentage >= 70) return '```fix\n📗 GOOD JOB!\nSolid understanding!\n```';
  if (percentage >= 60) return '```yaml\n📘 NOT BAD!\nRoom for improvement.\n```';
  return '```yaml\n📙 KEEP LEARNING!\nEvery expert was once a beginner.\n```';
}

function getTierEmoji(level) {
  if (level >= 50) return '👑';
  if (level >= 40) return '💎';
  if (level >= 30) return '🔮';
  if (level >= 20) return '⚡';
  if (level >= 15) return '🌟';
  if (level >= 10) return '⭐';
  if (level >= 5) return '✨';
  return '🌱';
}

function getTierColor(level) {
  if (level >= 50) return COLORS.LEGENDARY;
  if (level >= 40) return COLORS.DIAMOND;
  if (level >= 30) return COLORS.AMETHYST;
  if (level >= 20) return COLORS.EMERALD;
  if (level >= 15) return COLORS.XP_GOLD;
  if (level >= 10) return COLORS.SILVER;
  if (level >= 5) return COLORS.BRONZE;
  return COLORS.PRIMARY;
}
