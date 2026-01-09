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
  // Guard against division by zero
  const safeMax = max || 1;
  const safeCurrent = Math.max(0, current || 0);
  const percentage = Math.min(Math.max(safeCurrent / safeMax, 0), 1);
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

// Quiz Question Embed with Clean Premium UI
export function createQuizQuestionEmbed(question, questionNum, totalQuestions, topic, difficulty) {
  const difficultyColors = {
    easy: 0x57F287,    // Green
    medium: 0xFEE75C,  // Yellow
    hard: 0xED4245     // Red
  };
  
  const difficultyInfo = {
    easy: { dot: '🟢', label: 'Easy' },
    medium: { dot: '🟡', label: 'Medium' },
    hard: { dot: '🔴', label: 'Hard' }
  };
  
  const diffData = difficultyInfo[difficulty] || difficultyInfo.medium;
  
  // Create progress bar
  const filled = Math.floor((questionNum / totalQuestions) * 10);
  const empty = 10 - filled;
  const progressBar = '█'.repeat(filled) + '░'.repeat(empty);
  
  // Format question text
  let questionText = question.question || 'Loading question...';
  
  // Format answers - ensure single line display
  const options = question.options || ['N/A', 'N/A', 'N/A', 'N/A'];
  
  // Replace newlines in options with spaces to keep them single-line
  const cleanOptions = options.map(opt => String(opt).replace(/\n/g, ' '));
  
  const embed = new EmbedBuilder()
    .setColor(difficultyColors[difficulty] || difficultyColors.medium)
    .setTitle(`🎯 Question ${questionNum}/${totalQuestions}`)
    .setDescription(`┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓\n**${questionText}**\n┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛`)
    .addFields(
      {
        name: '🎯 Options',
        value: `🔵 ${cleanOptions[0]}\n\n🟢 ${cleanOptions[1]}\n\n🟡 ${cleanOptions[2]}\n\n🟣 ${cleanOptions[3]}`,
        inline: false
      },
      { name: '⚡ Topic', value: topic, inline: true },
      { name: `${diffData.dot} Difficulty`, value: diffData.label, inline: true },
      { name: '📊 Progress', value: `\`${progressBar}\``, inline: false }
    )
    .setFooter({ text: '🎓 MentorAI • Select an answer below' })
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

// Quiz Results Embed with Rich Stats - Premium V4 Design
export function createQuizResultsEmbed(result) {
  const percentage = result.percentage || Math.round((result.score / result.totalQuestions) * 100);
  const gradeLabel = getGrade(percentage);
  const gradeColor = getGradeColor(percentage);
  
  // Premium grade styling - extract just the letter grade
  const gradeLetter = gradeLabel.split(' ').pop();
  const gradeInfo = {
    'S+': { emoji: '👑', title: 'LEGENDARY', rank: 'S+' },
    'A+': { emoji: '⭐', title: 'EXCELLENT', rank: 'A+' },
    'A': { emoji: '✨', title: 'GREAT JOB', rank: 'A' },
    'B+': { emoji: '🌟', title: 'VERY GOOD', rank: 'B+' },
    'B': { emoji: '💫', title: 'GOOD', rank: 'B' },
    'C+': { emoji: '📗', title: 'DECENT', rank: 'C+' },
    'C': { emoji: '📚', title: 'KEEP LEARNING', rank: 'C' },
    'D': { emoji: '💪', title: 'PRACTICE MORE', rank: 'D' },
    'F': { emoji: '🔄', title: 'TRY AGAIN', rank: 'F' }
  };
  
  const gradeData = gradeInfo[gradeLetter] || gradeInfo['C'];
  
  // Create visual progress bar (20 chars for consistency)
  const filledBlocks = Math.round((percentage / 100) * 20);
  const emptyBlocks = 20 - filledBlocks;
  const progressBar = '█'.repeat(filledBlocks) + '░'.repeat(emptyBlocks);
  
  // Premium description with separators and clean layout
  const description = `▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬

**📊 YOUR RESULTS**

▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬

✅ **Correct:** \`${result.score}/${result.totalQuestions}\` (${percentage}%)
💎 **XP Earned:** \`${result.xpEarned || 0} XP\`
🔥 **Best Streak:** \`${result.bestStreak || result.score}\`

▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬

\`${progressBar}\` **${percentage}%**

▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬

🎖️ **RANK: ${gradeData.rank}**

> ${gradeData.emoji} *${gradeData.title}!*`;

  const embed = new EmbedBuilder()
    .setAuthor({ name: '🏆 QUIZ COMPLETE! 🏆' })
    .setTitle(`📚 ${(result.topic || 'Quiz').toUpperCase()}`)
    .setColor(gradeColor)
    .setDescription(description);
  
  if (result.leveledUp) {
    embed.addFields({
      name: '🎊 LEVEL UP!',
      value: `> ⭐ You reached **Level ${result.newLevel}**! Keep going!`,
      inline: false
    });
  }
  
  if (result.achievements && result.achievements.length > 0) {
    const achievementList = result.achievements.map(a => '🎖️ **' + a + '**').join('\n');
    embed.addFields({
      name: '🏆 Achievements Unlocked!',
      value: achievementList,
      inline: false
    });
  }
  
  if (result.conceptsToReview && result.conceptsToReview.length > 0) {
    const reviewList = result.conceptsToReview.map(c => '📖 ' + c).join('\n');
    embed.addFields({
      name: '📚 Concepts to Review',
      value: '> *Focus on these topics to improve:*\n' + reviewList,
      inline: false
    });
  }
  
  // Add motivational message based on score
  let motivation = '';
  if (percentage >= 90) {
    motivation = '🌟 *Outstanding performance! You\'re a master!*';
  } else if (percentage >= 70) {
    motivation = '💪 *Great job! Keep up the excellent work!*';
  } else if (percentage >= 50) {
    motivation = '📈 *Good effort! Practice makes perfect!*';
  } else {
    motivation = '🔄 *Don\'t give up! Review and try again!*';
  }
  
  embed.addFields({
    name: '\u200b',
    value: motivation,
    inline: false
  });
  
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
    .setDescription(`\`\`\`\n⭐ Level ${level} Learner\n\`\`\``)
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

// Leaderboard Embed - Premium V4 Styling
export function createLeaderboardEmbed(users, page = 1) {
  const medals = ['🥇', '🥈', '🥉'];
  const startRank = (page - 1) * 10;
  
  // Create header
  let description = '```\n';
  description += '🏆 GLOBAL LEADERBOARD 🏆\n';
  description += '```\n\n';
  
  users.forEach((user, index) => {
    const rank = startRank + index + 1;
    const medal = medals[rank - 1] || `**#${rank}**`;
    const tierEmoji = getTierEmoji(user.level || 1);
    const streakDisplay = (user.streak || 0) > 0 ? `🔥${user.streak}` : '';
    
    if (rank <= 3) {
      // Top 3 with special styling
      description += `${medal} ${tierEmoji} **${user.username || 'Unknown'}**\n`;
      description += `   ├─ Level **${user.level || 1}** • **${(user.xp || 0).toLocaleString()}** XP\n`;
      description += `   └─ ${streakDisplay || 'No streak'}\n\n`;
    } else {
      // Regular entries
      description += `\`#${String(rank).padStart(2, '0')}\` ${tierEmoji} **${user.username || 'Unknown'}** — Lv.${user.level || 1} • ${(user.xp || 0).toLocaleString()} XP ${streakDisplay}\n`;
    }
  });
  
  if (!users || users.length === 0) {
    description += '> *No users yet! Be the first to start learning!*';
  }
  
  const embed = new EmbedBuilder()
    .setTitle('🏆 Top Learners')
    .setColor(COLORS.XP_GOLD)
    .setDescription(description)
    .addFields({
      name: '💡 How to Climb',
      value: '> Complete quizzes, lessons, and maintain streaks to earn XP!',
      inline: false
    })
    .setFooter({ text: `🎓 MentorAI • Page ${page} • Keep learning!` })
    .setTimestamp();
  
  return embed;
}

// Daily Bonus Embed - Premium V4 Styling
export function createDailyBonusEmbed(result, motivation, dailyTip) {
  // Create XP breakdown panel
  let xpPanel = '```\n';
  xpPanel += '🎁 DAILY BONUS CLAIMED! 🎁\n';
  xpPanel += '──────────────────────────\n';
  xpPanel += `💰 Base XP:       +${result.baseXp || 75}\n`;
  xpPanel += `🔥 Streak Bonus:  +${result.streakBonus || 0}\n`;
  xpPanel += '──────────────────────────\n';
  xpPanel += `✨ TOTAL: +${result.xpEarned} XP\n`;
  xpPanel += '```';

  const embed = new EmbedBuilder()
    .setTitle('🎁 Daily Bonus Claimed!')
    .setColor(COLORS.XP_GOLD)
    .setDescription(xpPanel)
    .addFields(
      { 
        name: '🔥 Current Streak', 
        value: createStreakDisplay(result.streak), 
        inline: false 
      }
    );
  
  if (result.leveledUp) {
    embed.addFields({
      name: '🆙 LEVEL UP!',
      value: '\`\`\`\n🎉 Congratulations! You reached Level ' + result.newLevel + '! 🎉\n\`\`\`',
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

export function createQuizAnswerButtons(eliminatedOptions = []) {
  const row = new ActionRowBuilder();
  
  // Convert to array if not already (handle both boolean and array)
  const eliminated = Array.isArray(eliminatedOptions) ? eliminatedOptions : [];
  
  // A=Blue (Primary), B=Green (Success), C=Gray (Secondary), D=Gray (Secondary)
  // With colored circle emojis to match the embed
  row.addComponents(
    new ButtonBuilder()
      .setCustomId('quiz_answer_0')
      .setLabel('A')
      .setEmoji('🔵')
      .setStyle(ButtonStyle.Primary)
      .setDisabled(eliminated.includes(0)),
    new ButtonBuilder()
      .setCustomId('quiz_answer_1')
      .setLabel('B')
      .setEmoji('🟢')
      .setStyle(ButtonStyle.Success)
      .setDisabled(eliminated.includes(1)),
    new ButtonBuilder()
      .setCustomId('quiz_answer_2')
      .setLabel('C')
      .setEmoji('🟡')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(eliminated.includes(2)),
    new ButtonBuilder()
      .setCustomId('quiz_answer_3')
      .setLabel('D')
      .setEmoji('🟣')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(eliminated.includes(3))
  );
  
  return row;
}

export function createQuizControlButtons(hintUsed = false, fiftyUsed = false) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('quiz_hint')
      .setLabel('Hint')
      .setEmoji('💡')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(!!hintUsed),
    new ButtonBuilder()
      .setCustomId('quiz_fifty')
      .setLabel('50/50')
      .setEmoji('✂️')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(!!fiftyUsed),
    new ButtonBuilder()
      .setCustomId('quiz_cancel')
      .setLabel('Quit')
      .setEmoji('🚪')
      .setStyle(ButtonStyle.Danger),
    new ButtonBuilder()
      .setCustomId('help_main')
      .setLabel('Menu')
      .setEmoji('🏠')
      .setStyle(ButtonStyle.Secondary)
  );
}

export function createPostQuizButtons(topic) {
  const encodedTopic = encodeURIComponent(topic || 'general');
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('quiz_restart_' + encodedTopic)
      .setLabel('Play Again')
      .setEmoji('🔄')
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId('leaderboard_view')
      .setLabel('Leaderboard')
      .setEmoji('📊')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId('help_main')
      .setLabel('Menu')
      .setEmoji('🏠')
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
      .setCustomId('help_main')
      .setLabel('Menu')
      .setEmoji('🏠')
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
