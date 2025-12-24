import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } from 'discord.js';
import { COLORS, EMBED_COLORS, RARITY_COLORS } from '../config/colors.js';

export { COLORS };

export function createLessonEmbed(lesson, currentPage = 1, totalPages = 1) {
  return new EmbedBuilder()
    .setColor(EMBED_COLORS.lesson)
    .setTitle(`📖 ${lesson.title}`)
    .setDescription(lesson.content)
    .addFields(
      { name: '📊 Level', value: capitalizeFirst(lesson.level), inline: true },
      { name: '⏱️ Est. Time', value: `${lesson.estimatedMinutes} min`, inline: true },
      { name: '🎯 XP Reward', value: `+${lesson.xpReward} XP`, inline: true }
    )
    .setFooter({ text: `Lesson ${currentPage}/${totalPages} • Use buttons to navigate` })
    .setTimestamp();
}

export function createQuizEmbed(quiz, questionIndex) {
  const question = quiz.questions[questionIndex];
  const progress = `Question ${questionIndex + 1}/${quiz.questions.length}`;

  return new EmbedBuilder()
    .setColor(EMBED_COLORS.quiz)
    .setTitle(`🧠 Quiz: ${quiz.topic}`)
    .setDescription(`**${progress}**\n\n${question.question}`)
    .addFields({
      name: 'Options',
      value: question.options.map((opt, i) => `${getLetterEmoji(i)} ${opt}`).join('\n')
    })
    .setFooter({ text: `Score: ${quiz.score} XP • Time: 30s` });
}

export function createQuizResultEmbed(result, wasCorrect, question) {
  const color = wasCorrect ? EMBED_COLORS.success : EMBED_COLORS.error;
  const emoji = wasCorrect ? '✅' : '❌';

  return new EmbedBuilder()
    .setColor(color)
    .setTitle(`${emoji} ${wasCorrect ? 'Correct!' : 'Incorrect'}`)
    .setDescription(question.explanation)
    .addFields(
      { name: 'Correct Answer', value: question.options[question.correctIndex], inline: true },
      { name: 'XP Earned', value: wasCorrect ? `+${question.xp} XP` : '+0 XP', inline: true }
    );
}

export function createProgressEmbed(user, progress) {
  const xpBar = createProgressBar(progress.xpProgress, progress.xpNeeded, 10);

  const embed = new EmbedBuilder()
    .setColor(EMBED_COLORS.progress)
    .setTitle(`📊 ${user.username}'s Progress`)
    .setThumbnail(user.displayAvatarURL())
    .addFields(
      { name: '🏆 Level', value: `${progress.level}`, inline: true },
      { name: '⭐ Total XP', value: `${progress.totalXp.toLocaleString()}`, inline: true },
      { name: '🔥 Streak', value: `${progress.streak} days`, inline: true },
      { name: '📚 Lessons', value: `${progress.lessonsCompleted}`, inline: true },
      { name: '✅ Quizzes', value: `${progress.quizzesPassed}/${progress.quizzesCompleted}`, inline: true },
      { name: '🎯 Accuracy', value: `${progress.accuracy}%`, inline: true },
      { name: '📈 Progress to Next Level', value: `${xpBar}\n${progress.xpProgress}/${progress.xpNeeded} XP`, inline: false }
    )
    .setFooter({ text: 'Keep learning to level up!' });

  if (progress.recentAchievements?.length > 0) {
    embed.addFields({
      name: '🏅 Recent Achievements',
      value: progress.recentAchievements.map(a => `${a.emoji} ${a.name}`).join(' • '),
      inline: false
    });
  }

  return embed;
}

export function createLeaderboardEmbed(users, guildName) {
  const medals = ['🥇', '🥈', '🥉'];
  const leaderboardText = users.map((user, i) => {
    const medal = i < 3 ? medals[i] : `${i + 1}.`;
    return `${medal} **${user.username}** - Level ${user.level} (${user.totalXp.toLocaleString()} XP)`;
  }).join('\n');

  return new EmbedBuilder()
    .setColor(EMBED_COLORS.quiz)
    .setTitle(`🏆 ${guildName} Leaderboard`)
    .setDescription(leaderboardText || 'No learners yet! Be the first!')
    .setFooter({ text: 'Use /learn to start climbing the ranks!' });
}

export function createStudyPartyEmbed(party, host) {
  return new EmbedBuilder()
    .setColor(EMBED_COLORS.studyParty)
    .setTitle(`🎉 Study Party: ${party.topic}`)
    .setDescription(`**${host.username}** is hosting a study party!\n\nJoin to learn together and earn **+50% bonus XP**!`)
    .addFields(
      { name: '📚 Topic', value: party.topic, inline: true },
      { name: '⏱️ Duration', value: `${party.duration} min`, inline: true },
      { name: '👥 Participants', value: `${party.participants.length}`, inline: true }
    )
    .setFooter({ text: `Party ID: ${party.id}` });
}

export function createAchievementEmbed(achievement, user) {
  return new EmbedBuilder()
    .setColor(getRarityColor(achievement.rarity))
    .setTitle(`🎊 Achievement Unlocked!`)
    .setDescription(`**${user.username}** earned:\n\n${achievement.emoji} **${achievement.name}**\n*${achievement.description}*`)
    .addFields(
      { name: 'Rarity', value: capitalizeFirst(achievement.rarity), inline: true },
      { name: 'XP Reward', value: `+${achievement.xpReward} XP`, inline: true }
    )
    .setFooter({ text: 'Keep learning to unlock more!' });
}

export function createNavigationButtons(options = {}) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('lesson_prev')
      .setLabel('Previous')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(options.prevDisabled ?? true),
    new ButtonBuilder()
      .setCustomId('lesson_next')
      .setLabel('Next')
      .setStyle(ButtonStyle.Primary)
      .setDisabled(options.nextDisabled ?? false),
    new ButtonBuilder()
      .setCustomId('lesson_quiz')
      .setLabel('Quiz Me!')
      .setStyle(ButtonStyle.Success)
      .setEmoji('🧠')
  );
}

export function createQuizAnswerButtons(options) {
  return new ActionRowBuilder().addComponents(
    options.map((opt, i) => 
      new ButtonBuilder()
        .setCustomId(`quiz_answer_${i}`)
        .setLabel(opt)
        .setStyle(ButtonStyle.Secondary)
    )
  );
}

function createProgressBar(current, max, length = 10) {
  const percentage = current / max;
  const filled = Math.round(percentage * length);
  const empty = length - filled;
  return '█'.repeat(filled) + '░'.repeat(empty);
}

function capitalizeFirst(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function getLetterEmoji(index) {
  const letters = ['🅰️', '🅱️', '©️', '🇩'];
  return letters[index] || `${index + 1}.`;
}

function getRarityColor(rarity) {
  return RARITY_COLORS[rarity]?.color || COLORS.brand.primary;
}

export default {
  COLORS,
  createLessonEmbed,
  createQuizEmbed,
  createQuizResultEmbed,
  createProgressEmbed,
  createLeaderboardEmbed,
  createStudyPartyEmbed,
  createAchievementEmbed,
  createNavigationButtons,
  createQuizAnswerButtons
};
