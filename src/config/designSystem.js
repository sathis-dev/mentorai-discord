// ============================================
// MentorAI - Discord.js Implementation
// REALISTIC Design System - Copy & Paste Ready
// ============================================

import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { COLORS, ANSI, EMOJIS } from './colors.js';

// ============================================
// ANSI COLOR HELPERS (for code blocks)
// ============================================

export { ANSI };

// Helper to create ANSI colored text
export function ansi(text, color) {
  return `\`\`\`ansi\n${color}${text}${ANSI.reset}\n\`\`\``;
}

// ============================================
// VISUAL HELPERS
// ============================================

// Progress bar generator
export function progressBar(current, max, length = 10, style = 'blocks') {
  const percent = Math.min(100, Math.floor((current / max) * 100));
  const filled = Math.floor((percent / 100) * length);
  const empty = length - filled;
  
  const styles = {
    blocks: { filled: '█', empty: '░' },
    squares: { filled: '▰', empty: '▱' },
    circles: { filled: '●', empty: '○' },
    emoji: { filled: '🟩', empty: '⬜' }
  };
  
  const s = styles[style] || styles.blocks;
  return `${s.filled.repeat(filled)}${s.empty.repeat(empty)} ${percent}%`;
}

// Lesson progress dots
export function lessonDots(current, total) {
  return Array(total).fill(null)
    .map((_, i) => i < current - 1 ? '●' : i === current - 1 ? '◉' : '○')
    .join(' ');
}

// Format numbers (1000 -> 1K)
export function formatNumber(num) {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toLocaleString();
}

// Divider
export const DIVIDER = '━━━━━━━━━━━━━━━━━━━━━━━━━━';

// ============================================
// EMBED BUILDERS
// ============================================

/**
 * Help Guide Embed - World-Class Edition
 */
export function createHelpEmbed() {
  const asciiHeader = `╔═══════════════════════════════════╗
║     🎓  MENTORAI  HELP GUIDE     ║
╚═══════════════════════════════════╝`;

  return new EmbedBuilder()
    .setColor(COLORS.HELP)
    .setTitle('⭐ Welcome to MentorAI!')
    .setDescription(`\`\`\`\n${asciiHeader}\n\`\`\`
> **Your World-Class AI Learning Companion**
> Master any skill with personalized AI-powered education

${DIVIDER}

## 📖 Available Commands`)
    .addFields(
      {
        name: '📚 **Learn Anything**',
        value: `\`\`\`js
/learn [topic]
\`\`\`
> Start personalized lessons on any subject
> 💡 *Try: \`/learn Python basics\` or \`/learn React hooks\`*`,
        inline: false
      },
      {
        name: '🧠 **Test Your Knowledge**',
        value: `\`\`\`js
/quiz [topic]
\`\`\`
> Take AI-generated quizzes with instant feedback
> 💡 *Try: \`/quiz JavaScript\` or \`/quiz Data Science\`*`,
        inline: false
      },
      {
        name: '📊 **Track Progress**',
        value: `\`\`\`js
/progress
\`\`\`
> View your level, XP, streak, and achievements
> 🏆 *See how far you've come!*`,
        inline: true
      },
      {
        name: '🎉 **Study Together**',
        value: `\`\`\`js
/studyparty [topic]
\`\`\`
> Host study sessions and earn **+50% XP**
> 👥 *Learn with friends!*`,
        inline: true
      },
      {
        name: '🏆 **Compete & Win**',
        value: `\`\`\`js
/leaderboard
\`\`\`
> See top learners in your server
> 🥇 *Can you reach #1?*`,
        inline: true
      }
    )
    .addFields({
      name: '💎 Pro Tips',
      value: `\`\`\`diff
+ Complete lessons daily to level up faster
+ Maintain your streak for massive XP bonuses 🔥
+ Join study parties for +50% bonus XP
+ Earn achievements to unlock special rewards
\`\`\``,
      inline: false
    })
    .addFields({
      name: '⚡ Quick Start',
      value: '**1.** Type `/learn Python` to start your first lesson\n**2.** Complete lessons to earn XP\n**3.** Take `/quiz` to test yourself\n**4.** Check `/progress` to track growth',
      inline: false
    })
    .setFooter({ text: '🌟 MentorAI - Trusted by 10,000+ learners worldwide', iconURL: 'https://cdn.discordapp.com/emojis/1234567890.png' })
    .setTimestamp();
}

/**
 * Quiz Question Embed
 */
export function createQuizEmbed(quiz, questionIndex) {
  const q = quiz.questions[questionIndex];
  const progress = `${questionIndex + 1}/${quiz.questions.length}`;
  const dots = lessonDots(questionIndex + 1, quiz.questions.length);
  
  return new EmbedBuilder()
    .setColor(COLORS.QUIZ)
    .setTitle(`🧠 Quiz: ${quiz.topic}`)
    .setDescription(`${dots}

${DIVIDER}

**Question ${progress}**

${q.question}

${DIVIDER}

**Options**
🅰️ ${q.options[0]}
🅱️ ${q.options[1]}
🅲 ${q.options[2]}
🅳 ${q.options[3]}`)
    .setFooter({ text: `Score: ${quiz.score} XP • Time: 30s` });
}

/**
 * Quiz Correct Answer Embed
 */
export function createCorrectEmbed(question, xpEarned, streak) {
  const streakBonus = streak > 2 ? Math.floor(xpEarned * 0.1 * Math.min(streak - 2, 10)) : 0;
  
  return new EmbedBuilder()
    .setColor(COLORS.QUIZ_CORRECT)
    .setTitle('✅ Correct!')
    .setDescription(`\`\`\`diff
+ ${question.options[question.correctIndex]}
\`\`\`

**📖 Explanation**
${question.explanation}`)
    .addFields(
      {
        name: '⭐ XP Earned',
        value: `\`\`\`diff\n+ ${xpEarned} XP\n\`\`\``,
        inline: true
      },
      {
        name: '🔥 Streak Bonus',
        value: `\`\`\`diff\n+ ${streakBonus} XP\n\`\`\``,
        inline: true
      },
      {
        name: '💰 Total',
        value: `\`\`\`diff\n+ ${xpEarned + streakBonus} XP\n\`\`\``,
        inline: true
      }
    )
    .setFooter({ text: `🔥 ${streak} correct in a row!` });
}

/**
 * Quiz Incorrect Answer Embed
 */
export function createIncorrectEmbed(question, selectedIndex) {
  return new EmbedBuilder()
    .setColor(COLORS.QUIZ_INCORRECT)
    .setTitle('❌ Incorrect')
    .setDescription(`**Your answer:**
\`\`\`diff
- ${question.options[selectedIndex]}
\`\`\`

**Correct answer:**
\`\`\`diff
+ ${question.options[question.correctIndex]}
\`\`\`

**📖 Explanation**
${question.explanation}`)
    .setFooter({ text: "Don't worry! Every mistake is a learning opportunity. 💪" });
}

/**
 * Progress Dashboard Embed
 */
export function createProgressEmbed(user, stats) {
  const currentXP = stats.xpProgress || 0;
  const xpNeeded = stats.xpNeeded || 100;
  const totalXP = stats.totalXp || 0;
  const xpPercent = Math.floor((currentXP / xpNeeded) * 100);
  const bar = progressBar(currentXP, xpNeeded, 10);
  
  const streakDisplay = stats.streak > 0 
    ? '🔥'.repeat(Math.min(stats.streak, 7)) + (stats.streak > 7 ? ` +${stats.streak - 7}` : '')
    : '❄️ No streak';
  
  return new EmbedBuilder()
    .setColor(COLORS.PROGRESS)
    .setAuthor({ name: `${user.username}'s Learning Journey`, iconURL: user.displayAvatarURL() })
    .setTitle('📊 Progress Dashboard')
    .setThumbnail(user.displayAvatarURL({ size: 256 }))
    .setDescription(`> Level **${stats.level}** • *${getLevelTitle(stats.level)}*`)
    .addFields(
      { name: '🏆 Level', value: `\`\`\`${stats.level}\`\`\``, inline: true },
      { name: '⭐ Total XP', value: `\`\`\`${formatNumber(totalXP)}\`\`\``, inline: true },
      { name: '🔥 Streak', value: `\`\`\`${stats.streak} days\`\`\``, inline: true },
      { name: '📚 Lessons', value: `\`\`\`${stats.lessonsCompleted}\`\`\``, inline: true },
      { name: '✅ Quizzes', value: `\`\`\`${stats.quizzesPassed}/${stats.quizzesCompleted}\`\`\``, inline: true },
      { name: '🎯 Accuracy', value: `\`\`\`${stats.accuracy}%\`\`\``, inline: true }
    )
    .addFields({
      name: `📈 Progress to Level ${stats.level + 1}`,
      value: `\`\`\`\n${bar}\n${currentXP.toLocaleString()} / ${xpNeeded.toLocaleString()} XP\n\`\`\``,
      inline: false
    })
    .addFields({
      name: '🔥 Streak Status',
      value: streakDisplay,
      inline: false
    })
    .setFooter({ text: 'Keep learning to level up! 🚀' });
}

/**
 * Study Party Embed
 */
export function createStudyPartyEmbed(party, host) {
  const participantList = party.participants
    .slice(0, 10)
    .map((p, i) => `${i + 1}. <@${p.id}>`)
    .join('\n') || '*Be the first to join!*';

  return new EmbedBuilder()
    .setColor(COLORS.STUDY_PARTY)
    .setTitle(`🎉 Study Party: ${party.topic}`)
    .setDescription(`**${host.username}** is hosting a study party!

Join to learn together and earn bonus rewards!

\`\`\`diff
+ 50% BONUS XP FOR ALL PARTICIPANTS!
\`\`\``)
    .addFields(
      { name: '📚 Topic', value: `\`\`\`${party.topic}\`\`\``, inline: true },
      { name: '⏱️ Duration', value: `\`\`\`${party.duration} min\`\`\``, inline: true },
      { name: '👥 Participants', value: `\`\`\`${party.participants.length}/${party.maxParticipants}\`\`\``, inline: true }
    )
    .addFields({
      name: '👥 Who\'s Joining',
      value: participantList,
      inline: false
    })
    .setFooter({ text: `Party ID: ${party.id}` })
    .setTimestamp();
}

/**
 * Leaderboard Embed
 */
export function createLeaderboardEmbed(users, guildName) {
  const rankings = users.slice(0, 10).map((user, i) => {
    const rank = i + 1;
    const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `\`${rank}.\``;
    const crown = rank === 1 ? ' 👑' : '';
    
    if (rank <= 3) {
      return `${medal}${crown} **${user.username}** • Level ${user.level} • \`${formatNumber(user.totalXP)} XP\``;
    }
    return `${medal} ${user.username} • Level ${user.level} • \`${formatNumber(user.totalXP)} XP\``;
  }).join('\n\n');

  return new EmbedBuilder()
    .setColor(COLORS.LEADERBOARD)
    .setTitle('🏆 Learning Leaderboard')
    .setDescription(`**${guildName}** • Top Learners

${DIVIDER}

${rankings}

${DIVIDER}`)
    .setFooter({ text: 'Use /learn to climb the ranks! • Updated every 5 min' })
    .setTimestamp();
}

/**
 * Achievement Unlock Embed
 */
export function createAchievementEmbed(achievement, user) {
  const rarityColors = {
    common: COLORS.COMMON,
    uncommon: COLORS.UNCOMMON,
    rare: COLORS.RARE,
    epic: COLORS.EPIC,
    legendary: COLORS.LEGENDARY,
    mythic: COLORS.MYTHIC
  };

  const rarityEmojis = {
    common: '⬜',
    uncommon: '🟩',
    rare: '🟦',
    epic: '🟪',
    legendary: '🟨',
    mythic: '🟥'
  };

  return new EmbedBuilder()
    .setColor(rarityColors[achievement.rarity] || COLORS.ACHIEVEMENT)
    .setAuthor({ name: '🏅 Achievement Unlocked!', iconURL: user.displayAvatarURL() })
    .setTitle(`${achievement.emoji} ${achievement.name}`)
    .setDescription(`> *${achievement.description}*

${DIVIDER}`)
    .addFields(
      { 
        name: '✨ Rarity', 
        value: `${rarityEmojis[achievement.rarity]} ${achievement.rarity.charAt(0).toUpperCase() + achievement.rarity.slice(1)}`, 
        inline: true 
      },
      { 
        name: '⭐ Reward', 
        value: `\`\`\`diff\n+ ${achievement.xpReward} XP\n\`\`\``, 
        inline: true 
      }
    )
    .setFooter({ text: `${user.achievements?.length || 0} achievements unlocked` })
    .setTimestamp();
}

/**
 * Level Up Embed
 */
export function createLevelUpEmbed(user, newLevel) {
  const title = getLevelTitle(newLevel);
  
  return new EmbedBuilder()
    .setColor(COLORS.LEVEL_UP)
    .setTitle('⬆️ LEVEL UP!')
    .setDescription(`\`\`\` 
╔════════════════════════════════╗
║                                ║
║    🎉 CONGRATULATIONS! 🎉      ║
║                                ║
║        Level ${String(newLevel).padStart(2, ' ')}              ║
║    "${title}"                  ║
║                                ║
╚════════════════════════════════╝
\`\`\`

**${user.username}** reached **Level ${newLevel}**!`)
    .addFields({
      name: '🎁 Rewards Unlocked',
      value: getLevelRewards(newLevel).map(r => `${r.emoji} ${r.name}`).join('\n') || '*Keep leveling for rewards!*',
      inline: false
    })
    .setFooter({ text: `${getXPForLevel(newLevel + 1)} XP to Level ${newLevel + 1}` })
    .setTimestamp();
}

/**
 * Lesson Embed
 */
export function createLessonEmbed(lesson, currentLesson, totalLessons) {
  const dots = lessonDots(currentLesson, totalLessons);
  
  return new EmbedBuilder()
    .setColor(COLORS.LESSON)
    .setAuthor({ name: `${lesson.course} • Lesson ${currentLesson}/${totalLessons}` })
    .setTitle(`${lesson.emoji || '📖'} ${lesson.title}`)
    .setDescription(`${dots}

${DIVIDER}

${lesson.content}`)
    .addFields(
      { name: '🎓 Level', value: `\`\`\`${lesson.difficulty}\`\`\``, inline: true },
      { name: '⏱️ Est. Time', value: `\`\`\`${lesson.estimatedMinutes} min\`\`\``, inline: true },
      { name: '🎯 XP Reward', value: `\`\`\`diff\n+ ${lesson.xpReward} XP\n\`\`\``, inline: true }
    )
    .setFooter({ text: `Use buttons to navigate • ${lesson.tip || 'Happy learning!'}` })
    .setTimestamp();
}

/**
 * Error Embed
 */
export function createErrorEmbed(message, suggestion = null) {
  const embed = new EmbedBuilder()
    .setColor(COLORS.ERROR)
    .setTitle('❌ Oops! Something went wrong')
    .setDescription(`\`\`\`diff\n- ${message}\n\`\`\``);
  
  if (suggestion) {
    embed.addFields({
      name: '💡 Suggestion',
      value: suggestion,
      inline: false
    });
  }
  
  return embed.setFooter({ text: 'Need help? Use /help' });
}

/**
 * XP Gain Notification (Ephemeral)
 */
export function createXPGainEmbed(amount, reason, total, levelProgress) {
  const bar = progressBar(levelProgress.current, levelProgress.needed, 10);
  
  return new EmbedBuilder()
    .setColor(COLORS.XP)
    .setDescription(`⭐ **+${amount} XP** • *${reason}*

\`${bar}\` 
${levelProgress.current.toLocaleString()}/${levelProgress.needed.toLocaleString()} to Level ${levelProgress.nextLevel}`)
    .setFooter({ text: `Total: ${formatNumber(total)} XP` });
}

// ============================================
// BUTTON BUILDERS
// ============================================

/**
 * Quiz Answer Buttons
 */
export function createQuizButtons(quizId) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`quiz_answer_0_${quizId}`)
      .setLabel('A')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId(`quiz_answer_1_${quizId}`)
      .setLabel('B')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId(`quiz_answer_2_${quizId}`)
      .setLabel('C')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId(`quiz_answer_3_${quizId}`)
      .setLabel('D')
      .setStyle(ButtonStyle.Secondary)
  );
}

/**
 * Lesson Navigation Buttons
 */
export function createLessonButtons(hasPrev = false, hasNext = true) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('lesson_prev')
      .setLabel('Previous')
      .setEmoji('◀️')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(!hasPrev),
    new ButtonBuilder()
      .setCustomId('lesson_next')
      .setLabel('Next')
      .setEmoji('▶️')
      .setStyle(ButtonStyle.Primary)
      .setDisabled(!hasNext),
    new ButtonBuilder()
      .setCustomId('lesson_quiz')
      .setLabel('Quiz Me!')
      .setEmoji('🧠')
      .setStyle(ButtonStyle.Success)
  );
}

/**
 * Study Party Buttons
 */
export function createStudyPartyButtons(partyId) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`party_join_${partyId}`)
      .setLabel('Join Party')
      .setEmoji('🎉')
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId(`party_start_${partyId}`)
      .setLabel('Start Now')
      .setEmoji('🚀')
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId(`party_cancel_${partyId}`)
      .setLabel('Cancel')
      .setStyle(ButtonStyle.Danger)
  );
}

/**
 * Confirmation Buttons
 */
export function createConfirmButtons(confirmId, cancelId) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(confirmId)
      .setLabel('Confirm')
      .setEmoji('✅')
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId(cancelId)
      .setLabel('Cancel')
      .setStyle(ButtonStyle.Secondary)
  );
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function getLevelTitle(level) {
  const titles = {
    1: 'Curious Beginner',
    5: 'Dedicated Student',
    10: 'Rising Scholar',
    15: 'Knowledge Seeker',
    20: 'Learning Enthusiast',
    25: 'Wisdom Gatherer',
    30: 'Expert Learner',
    40: 'Master Scholar',
    50: 'Grand Master',
    75: 'Legendary Mind',
    100: 'Transcendent Genius'
  };
  
  const levels = Object.keys(titles).map(Number).sort((a, b) => b - a);
  const matchedLevel = levels.find(l => level >= l) || 1;
  return titles[matchedLevel];
}

function getLevelRewards(level) {
  const rewards = [];
  
  if (level === 5) rewards.push({ emoji: '🎨', name: 'Custom Profile Badge' });
  if (level === 10) rewards.push({ emoji: '⭐', name: '+10% XP Boost' });
  if (level === 25) rewards.push({ emoji: '👑', name: 'Crown Badge' });
  if (level === 50) rewards.push({ emoji: '🔥', name: '+25% XP Boost' });
  if (level % 10 === 0) rewards.push({ emoji: '🏆', name: `Level ${level} Achievement` });
  
  return rewards;
}

function getXPForLevel(level) {
  return Math.floor(100 * Math.pow(1.5, level - 1));
}

// ============================================
// EXPORTS
// ============================================

export default {
  COLORS,
  ANSI,
  EMOJIS,
  ansi,
  progressBar,
  lessonDots,
  formatNumber,
  DIVIDER,
  
  // Embeds
  createHelpEmbed,
  createQuizEmbed,
  createCorrectEmbed,
  createIncorrectEmbed,
  createProgressEmbed,
  createStudyPartyEmbed,
  createLeaderboardEmbed,
  createAchievementEmbed,
  createLevelUpEmbed,
  createLessonEmbed,
  createErrorEmbed,
  createXPGainEmbed,
  
  // Buttons
  createQuizButtons,
  createLessonButtons,
  createStudyPartyButtons,
  createConfirmButtons
};
