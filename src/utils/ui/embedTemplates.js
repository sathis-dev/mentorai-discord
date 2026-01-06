/**
 * MentorAI Embed Templates
 * Beautiful, consistent embed designs for all bot responses
 */

import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { Colors, RANK_COLORS, DIFFICULTY_COLORS, RARITY_COLORS } from './colors.js';
import { Visual, getTopicEmoji, getDifficultyEmoji, getRankEmoji, getMedalEmoji, getGradeEmoji } from './visualElements.js';
import { createProgressBar, createXPBar, createStatBars, createTimerBar, createStreakDisplay, getRankInfo, createAccuracyDisplay } from './progressBar.js';

// ============================================
// PROFILE EMBEDS
// ============================================

/**
 * Create a stunning profile card embed
 */
export function createProfileEmbed(user, member, stats = {}) {
  const rankInfo = getRankInfo(user.level || 1);
  const xpForNext = calculateXPForLevel(user.level + 1);
  const currentLevelXP = user.xp - calculateTotalXPForLevel(user.level);
  const xpNeeded = xpForNext - calculateTotalXPForLevel(user.level);
  
  const accuracy = user.totalQuestions > 0 
    ? ((user.correctAnswers / user.totalQuestions) * 100).toFixed(1) 
    : 0;

  const embed = new EmbedBuilder()
    .setColor(RANK_COLORS[rankInfo.name] || Colors.PRIMARY)
    .setAuthor({
      name: `${member.displayName}'s Profile`,
      iconURL: member.user.displayAvatarURL({ dynamic: true })
    })
    .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 256 }))
    .setDescription(`
${rankInfo.emoji} **${rankInfo.name}**
${createXPBar(currentLevelXP, xpNeeded, user.level || 1)}

${Visual.SEPARATOR.LINE}
    `)
    .addFields(
      {
        name: '📊 Statistics',
        value: `\`\`\`yaml
Total XP      : ${(user.xp || 0).toLocaleString()}
Level         : ${user.level || 1}
Streak        : ${user.streak || 0} days ${user.streak >= 7 ? '🔥' : ''}
Multiplier    : ${getStreakMultiplier(user.streak || 0)}x
\`\`\``,
        inline: true
      },
      {
        name: '📚 Learning',
        value: `\`\`\`yaml
Lessons       : ${user.lessonsCompleted || 0}
Quizzes       : ${user.quizzesTaken || 0}
Accuracy      : ${accuracy}%
Topics        : ${user.topicsStudied?.length || 0}
\`\`\``,
        inline: true
      },
      {
        name: '\u200b',
        value: Visual.SEPARATOR.LINE,
        inline: false
      },
      {
        name: '🏆 Achievements',
        value: user.achievements?.length > 0 
          ? user.achievements.slice(0, 8).map(a => a.emoji || '🏅').join(' ')
          : '*No achievements yet - start learning!*',
        inline: false
      }
    )
    .setFooter({
      text: `🗓️ Member for ${getDaysAgo(user.createdAt || new Date())} days`
    })
    .setTimestamp();

  return embed;
}

/**
 * Create profile action buttons
 */
export function createProfileButtons() {
  return new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('profile_achievements')
        .setLabel('Achievements')
        .setEmoji('🏆')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('profile_stats')
        .setLabel('Detailed Stats')
        .setEmoji('📊')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('profile_history')
        .setLabel('History')
        .setEmoji('📜')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('profile_share')
        .setLabel('Share')
        .setEmoji('📤')
        .setStyle(ButtonStyle.Success)
    );
}

// ============================================
// LESSON EMBEDS
// ============================================

/**
 * Create a beautiful lesson embed
 */
export function createLessonEmbed(topic, content, user = {}) {
  const emoji = getTopicEmoji(topic);

  const embed = new EmbedBuilder()
    .setColor(Colors.PRIMARY)
    .setAuthor({
      name: '📚 MentorAI Lesson',
      iconURL: 'https://cdn.discordapp.com/embed/avatars/0.png'
    })
    .setTitle(`${emoji} ${capitalizeFirst(topic)}`)
    .setDescription(`
${Visual.SEPARATOR.LINE}

${content}

${Visual.SEPARATOR.LINE}
    `)
    .addFields(
      {
        name: '✨ XP Earned',
        value: '`+40 XP`',
        inline: true
      },
      {
        name: '📊 Progress',
        value: `\`${(user.lessonsCompleted || 0) + 1} lessons\``,
        inline: true
      },
      {
        name: '🎯 Next Step',
        value: '`Take a quiz!`',
        inline: true
      }
    )
    .setFooter({
      text: '💡 Tip: Use /quiz to test your knowledge!'
    })
    .setTimestamp();

  return embed;
}

/**
 * Create lesson action buttons
 */
export function createLessonButtons(topic) {
  return new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId(`quiz_topic_${topic}`)
        .setLabel('Take Quiz')
        .setEmoji('🎯')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId(`learn_more_${topic}`)
        .setLabel('Learn More')
        .setEmoji('📖')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId(`practice_${topic}`)
        .setLabel('Practice Code')
        .setEmoji('💻')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('lesson_bookmark')
        .setLabel('Bookmark')
        .setEmoji('🔖')
        .setStyle(ButtonStyle.Success)
    );
}

// ============================================
// QUIZ EMBEDS
// ============================================

/**
 * Create quiz question embed
 */
export function createQuizQuestionEmbed(question, questionNum, totalQuestions, difficulty, topic, timeLeft = 30) {
  const diffConfig = {
    easy: { color: Colors.EASY, emoji: '🟢', label: 'Easy' },
    medium: { color: Colors.MEDIUM, emoji: '🟡', label: 'Medium' },
    hard: { color: Colors.HARD, emoji: '🔴', label: 'Hard' }
  };
  
  const config = diffConfig[difficulty] || diffConfig.easy;
  const topicEmoji = getTopicEmoji(topic);
  
  const optionEmojis = ['🅰️', '🅱️', '🅲️', '🅳️'];
  const optionsText = question.options
    .map((opt, i) => `${optionEmojis[i]} ${opt}`)
    .join('\n\n');

  const embed = new EmbedBuilder()
    .setColor(config.color)
    .setAuthor({
      name: `📝 Quiz: ${capitalizeFirst(topic)} ${topicEmoji}`
    })
    .setTitle(`Question ${questionNum} of ${totalQuestions}`)
    .setDescription(`
${config.emoji} **Difficulty:** ${config.label}

${Visual.SEPARATOR.LINE}

### ${question.question}

${optionsText}

${Visual.SEPARATOR.LINE}
    `)
    .addFields({
      name: '⏱️ Time Remaining',
      value: createTimerBar(timeLeft, 30),
      inline: false
    })
    .setFooter({
      text: '💡 ' + getRandomTip()
    });

  return embed;
}

/**
 * Create quiz answer buttons
 */
export function createQuizAnswerButtons(eliminatedOptions = []) {
  const row = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('quiz_answer_0')
        .setLabel('A')
        .setStyle(ButtonStyle.Primary)
        .setDisabled(eliminatedOptions.includes(0)),
      new ButtonBuilder()
        .setCustomId('quiz_answer_1')
        .setLabel('B')
        .setStyle(ButtonStyle.Primary)
        .setDisabled(eliminatedOptions.includes(1)),
      new ButtonBuilder()
        .setCustomId('quiz_answer_2')
        .setLabel('C')
        .setStyle(ButtonStyle.Primary)
        .setDisabled(eliminatedOptions.includes(2)),
      new ButtonBuilder()
        .setCustomId('quiz_answer_3')
        .setLabel('D')
        .setStyle(ButtonStyle.Primary)
        .setDisabled(eliminatedOptions.includes(3))
    );

  return row;
}

/**
 * Create quiz control buttons (hint, 50/50, skip)
 */
export function createQuizControlButtons(hintsRemaining = 1, fiftyFiftyUsed = false) {
  return new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('quiz_hint')
        .setLabel(`Hint (${hintsRemaining})`)
        .setEmoji('💡')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(hintsRemaining <= 0),
      new ButtonBuilder()
        .setCustomId('quiz_5050')
        .setLabel('50/50')
        .setEmoji('✂️')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(fiftyFiftyUsed),
      new ButtonBuilder()
        .setCustomId('quiz_skip')
        .setLabel('Skip')
        .setEmoji('⏭️')
        .setStyle(ButtonStyle.Danger)
    );
}

/**
 * Create quiz results embed
 */
export function createQuizResultsEmbed(score, total, xpEarned, achievements = [], streak = 0, user = {}) {
  const percentage = (score / total) * 100;
  
  let celebration, color, grade;
  if (percentage === 100) {
    celebration = '🎉🏆 PERFECT SCORE! 🏆🎉';
    color = Colors.GOLD;
    grade = 'S';
  } else if (percentage >= 80) {
    celebration = '⭐ Excellent Work! ⭐';
    color = Colors.SUCCESS;
    grade = 'A';
  } else if (percentage >= 60) {
    celebration = '👍 Good Job!';
    color = Colors.INFO;
    grade = 'B';
  } else if (percentage >= 40) {
    celebration = '📚 Keep Practicing!';
    color = Colors.WARNING;
    grade = 'C';
  } else {
    celebration = '💪 Don\'t Give Up!';
    color = Colors.ERROR;
    grade = 'D';
  }

  const gradeEmoji = getGradeEmoji(grade);
  const streakMultiplier = getStreakMultiplier(streak);
  const streakBonus = percentage === 100 ? Math.floor(xpEarned * 0.25) : 0;

  const embed = new EmbedBuilder()
    .setColor(color)
    .setAuthor({
      name: '📊 Quiz Complete!'
    })
    .setDescription(`
╔═══════════════════════════════════╗
║                                   ║
║     ${celebration.padStart(25)}      ║
║                                   ║
║        Grade: ${gradeEmoji} **${grade}**           ║
║                                   ║
║     **${score}/${total}** Questions       ║
║     ${createProgressBar(score, total, 15, 'neon')}     ║
║     **${percentage.toFixed(0)}%** Correct          ║
║                                   ║
╚═══════════════════════════════════╝
    `)
    .addFields(
      {
        name: '💰 Rewards',
        value: `\`\`\`diff
+ ${xpEarned} XP earned
${percentage === 100 ? '+ 100 XP Perfect Bonus!' : ''}
${streak >= 3 ? `+ ${streakBonus} XP Streak Bonus (${streakMultiplier}x)` : ''}
\`\`\``,
        inline: true
      },
      {
        name: '📈 Stats Update',
        value: `\`\`\`yaml
New XP: ${((user.xp || 0) + xpEarned).toLocaleString()}
Streak: ${streak} days
\`\`\``,
        inline: true
      }
    );

  if (achievements.length > 0) {
    embed.addFields({
      name: '🏆 Achievements Unlocked!',
      value: achievements.map(a => `${a.emoji} **${a.name}**\n┗ *${a.description}*`).join('\n\n'),
      inline: false
    });
  }

  embed.setFooter({
    text: '🔄 Try again to improve your score!'
  });

  return embed;
}

/**
 * Create post-quiz action buttons
 */
export function createPostQuizButtons() {
  return new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('quiz_retry')
        .setLabel('Try Again')
        .setEmoji('🔄')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('quiz_new_topic')
        .setLabel('New Topic')
        .setEmoji('📚')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('quiz_review')
        .setLabel('Review Answers')
        .setEmoji('📝')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('quiz_share')
        .setLabel('Share')
        .setEmoji('📤')
        .setStyle(ButtonStyle.Success)
    );
}

// ============================================
// LEADERBOARD EMBEDS
// ============================================

/**
 * Create leaderboard embed
 */
export function createLeaderboardEmbed(users, page = 1, totalPages = 1, requestingUserId = null) {
  const startRank = (page - 1) * 10 + 1;
  
  let leaderboardText = '';
  
  users.forEach((user, index) => {
    const rank = startRank + index;
    const medal = getMedalEmoji(rank);
    const isRequesting = user.discordId === requestingUserId;
    const highlight = isRequesting ? '**' : '';
    
    const rankEmoji = getRankEmoji(user.level || 1);
    const xpFormatted = (user.xp || 0) >= 1000 
      ? `${((user.xp || 0) / 1000).toFixed(1)}k` 
      : (user.xp || 0);
    
    leaderboardText += `${medal} ${highlight}${user.username}${highlight} ${rankEmoji}\n`;
    leaderboardText += `┗ Level \`${user.level || 1}\` • \`${xpFormatted} XP\` • 🔥 \`${user.streak || 0}\`\n\n`;
  });

  const embed = new EmbedBuilder()
    .setColor(Colors.GOLD)
    .setAuthor({
      name: '🏆 Global Leaderboard'
    })
    .setDescription(`
${Visual.SEPARATOR.LINE}

${leaderboardText || '*No users found*'}

${Visual.SEPARATOR.LINE}
    `)
    .setFooter({
      text: `Page ${page}/${totalPages}`
    })
    .setTimestamp();

  return embed;
}

/**
 * Create leaderboard pagination buttons
 */
export function createLeaderboardPagination(page, totalPages) {
  return new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('lb_first')
        .setEmoji('⏮️')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(page === 1),
      new ButtonBuilder()
        .setCustomId('lb_prev')
        .setEmoji('◀️')
        .setStyle(ButtonStyle.Primary)
        .setDisabled(page === 1),
      new ButtonBuilder()
        .setCustomId('lb_page')
        .setLabel(`${page} / ${totalPages}`)
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(true),
      new ButtonBuilder()
        .setCustomId('lb_next')
        .setEmoji('▶️')
        .setStyle(ButtonStyle.Primary)
        .setDisabled(page === totalPages),
      new ButtonBuilder()
        .setCustomId('lb_last')
        .setEmoji('⏭️')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(page === totalPages)
    );
}

/**
 * Create leaderboard filter buttons
 */
export function createLeaderboardFilters(activeFilter = 'xp') {
  return new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('lb_filter_xp')
        .setLabel('By XP')
        .setStyle(activeFilter === 'xp' ? ButtonStyle.Primary : ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('lb_filter_level')
        .setLabel('By Level')
        .setStyle(activeFilter === 'level' ? ButtonStyle.Primary : ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('lb_filter_streak')
        .setLabel('By Streak')
        .setStyle(activeFilter === 'streak' ? ButtonStyle.Primary : ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('lb_filter_accuracy')
        .setLabel('By Accuracy')
        .setStyle(activeFilter === 'accuracy' ? ButtonStyle.Primary : ButtonStyle.Secondary)
    );
}

// ============================================
// ACHIEVEMENT EMBEDS
// ============================================

/**
 * Create achievement unlock embed
 */
export function createAchievementUnlockEmbed(achievement, totalUnlocked = 0, totalAchievements = 0) {
  const rarityConfig = {
    common: { color: 0x95A5A6, stars: '⭐', label: 'Common' },
    uncommon: { color: 0x3498DB, stars: '⭐⭐', label: 'Uncommon' },
    rare: { color: 0x9B59B6, stars: '⭐⭐⭐', label: 'Rare' },
    epic: { color: 0xE91E63, stars: '⭐⭐⭐⭐', label: 'Epic' },
    legendary: { color: 0xF39C12, stars: '⭐⭐⭐⭐⭐', label: 'Legendary' }
  };
  
  const rarity = rarityConfig[achievement.rarity] || rarityConfig.common;

  const embed = new EmbedBuilder()
    .setColor(rarity.color)
    .setTitle('🏆 Achievement Unlocked!')
    .setDescription(`
╔═══════════════════════════════════════╗
║                                       ║
║   ✨ **${achievement.emoji} ${achievement.name}** ✨   ║
║                                       ║
║   *${achievement.description}*        ║
║                                       ║
╠═══════════════════════════════════════╣
║                                       ║
║   Rarity: ${rarity.stars}                     ║
║   ${rarity.label}                             ║
║                                       ║
║   **+${achievement.xpReward || 0} XP**                    ║
║                                       ║
╚═══════════════════════════════════════╝
    `)
    .setFooter({
      text: `${totalUnlocked} / ${totalAchievements} achievements unlocked`
    });

  return embed;
}

// ============================================
// UTILITY EMBEDS
// ============================================

/**
 * Create a success embed
 */
export function createSuccessEmbed(title, description) {
  return new EmbedBuilder()
    .setColor(Colors.SUCCESS)
    .setTitle(`✅ ${title}`)
    .setDescription(description);
}

/**
 * Create an error embed
 */
export function createErrorEmbed(title, description) {
  return new EmbedBuilder()
    .setColor(Colors.ERROR)
    .setTitle(`❌ ${title}`)
    .setDescription(description);
}

/**
 * Create an info embed
 */
export function createInfoEmbed(title, description) {
  return new EmbedBuilder()
    .setColor(Colors.INFO)
    .setTitle(`ℹ️ ${title}`)
    .setDescription(description);
}

/**
 * Create a warning embed
 */
export function createWarningEmbed(title, description) {
  return new EmbedBuilder()
    .setColor(Colors.WARNING)
    .setTitle(`⚠️ ${title}`)
    .setDescription(description);
}

/**
 * Create a loading/thinking embed
 */
export function createLoadingEmbed(message = 'Processing...') {
  return new EmbedBuilder()
    .setColor(Colors.INFO)
    .setDescription(`🔄 ${message}`);
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function capitalizeFirst(str) {
  return str ? str.charAt(0).toUpperCase() + str.slice(1) : '';
}

function getDaysAgo(date) {
  const now = new Date();
  const then = new Date(date);
  const diffTime = Math.abs(now - then);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

function getStreakMultiplier(streak) {
  if (streak >= 30) return 2.0;
  if (streak >= 14) return 1.75;
  if (streak >= 7) return 1.5;
  if (streak >= 3) return 1.25;
  return 1.0;
}

function calculateXPForLevel(level) {
  return Math.floor(100 * Math.pow(1.5, level - 1));
}

function calculateTotalXPForLevel(level) {
  let total = 0;
  for (let i = 1; i < level; i++) {
    total += calculateXPForLevel(i);
  }
  return total;
}

function getRandomTip() {
  const tips = [
    'Take your time to read each question carefully!',
    'Eliminate obviously wrong answers first.',
    'Trust your first instinct!',
    'Learning from mistakes is part of growth.',
    'Streaks boost your XP - keep learning daily!',
    'Use hints wisely - they\'re limited!',
    'Review your wrong answers to improve.',
    'Practice makes perfect!'
  ];
  return tips[Math.floor(Math.random() * tips.length)];
}

export default {
  // Profile
  createProfileEmbed,
  createProfileButtons,
  // Lesson
  createLessonEmbed,
  createLessonButtons,
  // Quiz
  createQuizQuestionEmbed,
  createQuizAnswerButtons,
  createQuizControlButtons,
  createQuizResultsEmbed,
  createPostQuizButtons,
  // Leaderboard
  createLeaderboardEmbed,
  createLeaderboardPagination,
  createLeaderboardFilters,
  // Achievement
  createAchievementUnlockEmbed,
  // Utility
  createSuccessEmbed,
  createErrorEmbed,
  createInfoEmbed,
  createWarningEmbed,
  createLoadingEmbed
};
