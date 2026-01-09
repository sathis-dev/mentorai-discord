import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { getOrCreateUser } from '../../services/gamificationService.js';
import {
  BRAND,
  COLORS,
  EMOJIS,
  VISUALS,
  RANKS,
  getRank,
  getNextRank,
  createProgressBar,
  xpForLevel,
  formatNumber,
  getStreakMultiplier
} from '../../config/brandSystem.js';
import { checkMobileUser } from '../../utils/mobileUI.js';
import { createMobileProfileEmbed } from '../../embeds/mobile/profileMobile.js';

// ═══════════════════════════════════════════════════════════════════════════════
//  🎨 V5 DESIGN SYSTEM - PREMIUM PROFILE CARD
//  Beautiful, mobile-optimized, competition-winning UI
// ═══════════════════════════════════════════════════════════════════════════════

export const data = new SlashCommandBuilder()
  .setName('profile')
  .setDescription('👤 View your premium profile card with stats & achievements')
  .addUserOption(option =>
    option.setName('user')
      .setDescription('View another user\'s profile'));

// ═══════════════════════════════════════════════════════════
// 🏆 TIER SYSTEM - Use brand system
// ═══════════════════════════════════════════════════════════

// Use getRank and getNextRank from brandSystem instead of local TIERS

// ═══════════════════════════════════════════════════════════
// 🎨 PREMIUM VISUAL COMPONENTS
// ═══════════════════════════════════════════════════════════

function createLevelCard(level, xp, xpNeeded, rank) {
  const bar = createProgressBar(xp, xpNeeded, 20);
  const percentage = Math.min(Math.round((xp / (xpNeeded || 1)) * 100), 100);
  const nextRank = getNextRank(level);
  const levelsToNext = nextRank.minLevel - level;
  
  return `
${VISUALS.separators.fancy}

### ${rank.emoji} ${rank.title}

**Level ${level}** ${rank.badge}

\`${bar}\` **${percentage}%**
${EMOJIS.xp} \`${formatNumber(xp)} / ${formatNumber(xpNeeded)} XP\`

${VISUALS.separators.thin}

${nextRank.emoji} **Next Rank:** ${nextRank.name} in **${levelsToNext}** levels

${VISUALS.separators.fancy}`;
}

function createStatsPanel(stats) {
  const { quizzes, accuracy, lessons, topics, streak, achievements } = stats;
  
  // Accuracy grade
  let grade;
  if (accuracy >= 95) { grade = 'S+'; }
  else if (accuracy >= 90) { grade = 'S'; }
  else if (accuracy >= 85) { grade = 'A+'; }
  else if (accuracy >= 80) { grade = 'A'; }
  else if (accuracy >= 70) { grade = 'B'; }
  else if (accuracy >= 60) { grade = 'C'; }
  else { grade = 'D'; }

  return `
**${EMOJIS.stats} PERFORMANCE STATS**

> ${EMOJIS.quiz} Quizzes: **${quizzes}** | ${EMOJIS.learn} Lessons: **${lessons}**
> ${EMOJIS.book} Topics: **${topics}** | ${EMOJIS.streak} Streak: **${streak}**

${VISUALS.separators.thin}

> ${EMOJIS.target} Accuracy: **${accuracy}%** | Grade: **[${grade}]**
> ${EMOJIS.achievement} Achievements: **${achievements}**`;
}

function createStreakIndicator(streak) {
  if (streak === 0) {
    return `❄️ **No streak** — Start today with \`/daily\`!`;
  }
  
  const flames = Math.min(streak, 7);
  const fireEmoji = EMOJIS.streak.repeat(flames);
  const multiplier = getStreakMultiplier(streak);
  
  let status;
  if (streak >= 30) {
    status = `**${EMOJIS.crown} LEGENDARY STREAK!**`;
  } else if (streak >= 14) {
    status = `**${EMOJIS.gem} Epic Streak!**`;
  } else if (streak >= 7) {
    status = `**${EMOJIS.streak} On Fire!**`;
  } else if (streak >= 3) {
    status = `*Building momentum*`;
  } else {
    status = `*Just getting started*`;
  }
  
  return `${fireEmoji} **${streak} day${streak !== 1 ? 's' : ''}** ${status}\n> Bonus: \`${multiplier}x XP\``;
}

function createAchievementBadges(achievements) {
  if (!achievements || achievements.length === 0) {
    return '> 🎮 No achievements yet — Start your journey!\n> Use `/quiz` or `/learn` to unlock badges!';
  }
  
  // Display up to 6 achievements with emojis
  const displayCount = Math.min(achievements.length, 6);
  const badges = achievements.slice(-displayCount).map(a => `🏅 \`${a}\``);
  const remaining = achievements.length > 6 ? `\n> *+${achievements.length - 6} more unlocked!*` : '';
  
  return badges.join('\n') + remaining;
}

function getMotivationalMessage(level, streak, accuracy) {
  const messages = [
    { check: () => streak >= 30, msg: '👑 **Unstoppable!** Your dedication inspires everyone!' },
    { check: () => accuracy >= 95, msg: '🎯 **Perfect Precision!** Your accuracy is legendary!' },
    { check: () => level >= 40, msg: '💎 **Master Level!** You\'ve truly mastered the craft!' },
    { check: () => level >= 20, msg: '🌟 **Rising Star!** You\'re making incredible progress!' },
    { check: () => streak >= 7, msg: '🔥 **Blazing Hot!** Keep that streak going strong!' },
    { check: () => accuracy >= 80, msg: '📈 **Sharp Mind!** Your knowledge is impressive!' },
    { check: () => level >= 10, msg: '🚀 **Double Digits!** You\'re on the right track!' },
    { check: () => streak >= 3, msg: '💪 **Consistency Wins!** Every day counts!' },
    { check: () => true, msg: '🌱 **Every expert was once a beginner!** Keep learning!' }
  ];
  
  return messages.find(m => m.check())?.msg;
}

function getSuggestedTopics(studiedTopics) {
  const topicMap = {
    'javascript': ['TypeScript', 'React', 'Node.js'],
    'python': ['Django', 'FastAPI', 'Data Science'],
    'react': ['Next.js', 'Redux', 'TypeScript'],
    'html': ['CSS', 'JavaScript', 'Tailwind'],
    'css': ['Tailwind', 'SASS', 'Bootstrap'],
    'node': ['Express', 'MongoDB', 'GraphQL'],
    'sql': ['PostgreSQL', 'MongoDB', 'Redis']
  };
  
  const suggestions = new Set();
  const studiedLower = studiedTopics.map(t => t.toLowerCase());
  
  for (const [topic, related] of Object.entries(topicMap)) {
    if (studiedLower.some(s => s.includes(topic))) {
      related.forEach(r => {
        if (!studiedLower.includes(r.toLowerCase())) {
          suggestions.add(r);
        }
      });
    }
  }
  
  if (suggestions.size === 0) {
    return '`JavaScript` `Python` `HTML/CSS` — Great starting points!';
  }
  
  return Array.from(suggestions).slice(0, 4).map(t => `\`${t}\``).join(' ');
}

// ═══════════════════════════════════════════════════════════
// 🚀 MAIN EXECUTE FUNCTION
// ═══════════════════════════════════════════════════════════

export async function execute(interaction) {
  await interaction.deferReply();

  const targetUser = interaction.options.getUser('user') || interaction.user;
  const isOwnProfile = targetUser.id === interaction.user.id;

  try {
    const user = await getOrCreateUser(targetUser.id, targetUser.username);
    
    // Check if user is on mobile
    const isMobile = await checkMobileUser(interaction);
    
    if (isMobile) {
      // Mobile-optimized profile
      const member = interaction.guild?.members.cache.get(targetUser.id) || interaction.member;
      const response = createMobileProfileEmbed(user, member);
      await interaction.editReply(response);
      return;
    }
    
    // ═══ Desktop: Full profile experience ═══
    
    // ═══ Calculate stats with safe defaults ═══
    const level = user?.level || 1;
    const xp = user?.xp || 0;
    // xpForLevel(level) = XP needed to level up FROM current level TO next level
    const xpNeeded = xpForLevel(level);
    const streak = user?.streak || 0;
    const quizzes = user?.quizzesTaken || 0;
    const totalQ = user?.totalQuestions || 0;
    const correctA = user?.correctAnswers || 0;
    const accuracy = totalQ > 0 ? Math.round((correctA / totalQ) * 100) : 0;
    const achievements = user?.achievements || [];
    const lessonsCompleted = user?.completedLessons?.length || user?.lessonsCompleted || 0;
    const topicsStudied = user?.topicsStudied || [];
    const joinDate = user?.createdAt || new Date();
    
    // ═══ Get rank info from brand system ═══
    const rank = getRank(level);
    const memberDuration = Math.floor((Date.now() - new Date(joinDate).getTime()) / (1000 * 60 * 60 * 24));

    // ═══ Build Premium Profile Embed ═══
    const profileEmbed = new EmbedBuilder()
      .setColor(rank.color)
      .setAuthor({
        name: `${rank.emoji} ${rank.title} ${rank.emoji}`,
        iconURL: targetUser.displayAvatarURL({ dynamic: true })
      })
      .setTitle(`${targetUser.displayName || targetUser.username}`)
      .setThumbnail(targetUser.displayAvatarURL({ dynamic: true, size: 512 }))
      .setDescription(createLevelCard(level, xp, xpNeeded, rank))
      .addFields(
        {
          name: `${EMOJIS.stats} Statistics`,
          value: createStatsPanel({
            quizzes,
            accuracy,
            lessons: lessonsCompleted,
            topics: topicsStudied.length,
            streak,
            achievements: achievements.length
          }),
          inline: false
        },
        {
          name: `${EMOJIS.streak} Daily Streak`,
          value: createStreakIndicator(streak),
          inline: true
        },
        {
          name: `${rank.emoji} Current Rank`,
          value: `**${rank.name}**\n${rank.badge}`,
          inline: true
        }
      );

    // Add achievements field if user has any
    if (achievements.length > 0 || isOwnProfile) {
      profileEmbed.addFields({
        name: `${EMOJIS.trophy} Achievements (${achievements.length})`,
        value: createAchievementBadges(achievements),
        inline: false
      });
    }

    // Add motivational message
    profileEmbed.addFields({
      name: `${EMOJIS.tip} Message`,
      value: getMotivationalMessage(level, streak, accuracy),
      inline: false
    });

    profileEmbed.setFooter({ 
      text: `${EMOJIS.brain} ${BRAND.name} • ${rank.emoji} ${rank.name} • Day ${memberDuration + 1}`,
      iconURL: interaction.client.user?.displayAvatarURL()
    });
    profileEmbed.setTimestamp();

    // ═══ Topics Panel (if user has studied topics) ═══
    const embeds = [profileEmbed];
    
    if (topicsStudied.length > 0 && isOwnProfile) {
      const topicsDisplay = topicsStudied.slice(0, 10).map(t => `\`${t}\``).join(' • ');
      const moreCount = topicsStudied.length > 10 ? `\n*...+${topicsStudied.length - 10} more*` : '';
      
      const topicsEmbed = new EmbedBuilder()
        .setColor(COLORS.LESSON_BLUE)
        .setTitle(`${EMOJIS.learn} Your Learning Journey`)
        .setDescription(`**Topics Explored:**\n${topicsDisplay}${moreCount}`)
        .addFields({
          name: `${EMOJIS.explain} Suggested Next`,
          value: getSuggestedTopics(topicsStudied),
          inline: false
        });
      
      embeds.push(topicsEmbed);
    }

    // ═══ Action Buttons ═══
    const row1 = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`profile_achievements_${targetUser.id}`)
        .setLabel('Achievements')
        .setEmoji(EMOJIS.trophy)
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId(`profile_stats_${targetUser.id}`)
        .setLabel('Full Stats')
        .setEmoji(EMOJIS.stats)
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('exec_leaderboard')
        .setLabel('Leaderboard')
        .setEmoji(EMOJIS.leaderboard)
        .setStyle(ButtonStyle.Secondary)
    );

    const row2 = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('exec_daily')
        .setLabel('Daily')
        .setEmoji(EMOJIS.calendar)
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId('exec_quiz')
        .setLabel('Quiz')
        .setEmoji(EMOJIS.quiz)
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('help_main')
        .setLabel('Menu')
        .setEmoji(EMOJIS.home)
        .setStyle(ButtonStyle.Secondary)
    );

    await interaction.editReply({ 
      embeds, 
      components: [row1, row2] 
    });

  } catch (error) {
    console.error('Profile command error:', error);
    
    // ═══ Fallback Profile ═══
    try {
      const rank = RANKS.novice;
      const displayName = targetUser?.displayName || targetUser?.username || 'User';
      const fallbackEmbed = new EmbedBuilder()
        .setTitle(`${EMOJIS.profile || '👤'} ${displayName}'s Profile`)
        .setColor(rank.color)
        .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))
        .setDescription(`\`\`\`
${rank.emoji} NEW EXPLORER ${rank.emoji}
${VISUALS.separators.thick}
Begin your learning journey!
\`\`\``)
        .addFields(
          { name: `${EMOJIS.xp} Level`, value: '`1`', inline: true },
          { name: `${EMOJIS.sparkle} XP`, value: '`0`', inline: true },
          { name: `${EMOJIS.streak} Streak`, value: '`0`', inline: true },
          { 
            name: `${EMOJIS.rocket} Get Started`, 
            value: `> \`/learn\` — Start a lesson\n> \`/quiz\` — Test knowledge\n> \`/daily\` — Claim rewards`,
            inline: false 
          }
        )
        .setFooter({ text: `${EMOJIS.brain} ${BRAND.name} • Begin your journey!` })
        .setTimestamp();

      const fallbackButtons = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('exec_learn')
          .setLabel('Learn')
          .setEmoji(EMOJIS.learn)
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('exec_quiz')
          .setLabel('Quiz')
          .setEmoji(EMOJIS.quiz)
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId('help_main')
          .setLabel('Menu')
          .setEmoji(EMOJIS.home)
          .setStyle(ButtonStyle.Secondary)
      );

      await interaction.editReply({ embeds: [fallbackEmbed], components: [fallbackButtons] });
    } catch (fallbackError) {
      console.error('Profile fallback error:', fallbackError);
      await interaction.editReply({ content: `${EMOJIS.error} Could not load profile. Try \`/profile\` again.` });
    }
  }
}

// ═══════════════════════════════════════════════════════════
// 🔘 BUTTON HANDLERS
// ═══════════════════════════════════════════════════════════

export async function handleButton(interaction, action, params) {
  const userId = params[0];
  
  if (action === 'achievements') {
    await showAchievementsPanel(interaction, userId);
  } else if (action === 'stats') {
    await showStatsPanel(interaction, userId);
  } else if (action === 'share') {
    await shareProfile(interaction, userId);
  }
}

async function showAchievementsPanel(interaction, userId) {
  try {
    await interaction.deferReply({ ephemeral: true });
    
    const user = await getOrCreateUser(userId);
    const achievements = user?.achievements || [];
    
    const embed = new EmbedBuilder()
      .setColor(COLORS.XP_GOLD)
      .setTitle(`${EMOJIS.trophy} All Achievements`)
      .setDescription(achievements.length > 0 
        ? achievements.map((a, i) => `${i + 1}. ${EMOJIS.medal} **${a}**`).join('\n')
        : `> No achievements unlocked yet!\n> Complete quizzes and lessons to earn badges.`)
      .setFooter({ text: `Total: ${achievements.length} achievements` })
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  } catch (error) {
    console.error('Achievements panel error:', error);
    await interaction.reply({ content: `${EMOJIS.error} Could not load achievements.`, ephemeral: true });
  }
}

async function showStatsPanel(interaction, userId) {
  try {
    await interaction.deferReply({ ephemeral: true });
    
    const user = await getOrCreateUser(userId);
    
    const stats = {
      level: user?.level || 1,
      xp: user?.xp || 0,
      streak: user?.streak || 0,
      quizzes: user?.quizzesTaken || 0,
      totalQ: user?.totalQuestions || 0,
      correct: user?.correctAnswers || 0,
      lessons: user?.completedLessons?.length || 0,
      topics: user?.topicsStudied?.length || 0,
      achievements: user?.achievements?.length || 0
    };
    
    const accuracy = stats.totalQ > 0 ? Math.round((stats.correct / stats.totalQ) * 100) : 0;
    const rank = getRank(stats.level);

    const embed = new EmbedBuilder()
      .setColor(COLORS.LESSON_BLUE)
      .setTitle(`${EMOJIS.stats} Detailed Statistics`)
      .setDescription(`\`\`\`
COMPLETE STATS BREAKDOWN
${VISUALS.separators.thick}
${EMOJIS.xp} Level:        ${stats.level}
${EMOJIS.sparkle} Total XP:     ${formatNumber(stats.xp)}
${EMOJIS.streak} Best Streak:  ${stats.streak} days
${VISUALS.separators.thick}
${EMOJIS.quiz} Quizzes:      ${stats.quizzes}
${EMOJIS.code} Questions:    ${stats.totalQ}
${EMOJIS.check} Correct:      ${stats.correct}
${EMOJIS.stats} Accuracy:     ${accuracy}%
${VISUALS.separators.thick}
${EMOJIS.learn} Lessons:      ${stats.lessons}
${EMOJIS.topics} Topics:       ${stats.topics}
${EMOJIS.trophy} Achievements: ${stats.achievements}
\`\`\``)
      .addFields({
        name: `${rank.emoji} Current Rank`,
        value: `**${rank.name}** - ${rank.title}`,
        inline: false
      })
      .setFooter({ text: `${EMOJIS.brain} ${BRAND.name} Statistics` })
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  } catch (error) {
    console.error('Stats panel error:', error);
    await interaction.reply({ content: `${EMOJIS.error} Could not load stats.`, ephemeral: true });
  }
}

async function shareProfile(interaction, userId) {
  try {
    const user = await getOrCreateUser(userId);
    const rank = getRank(user?.level || 1);
    
    const shareEmbed = new EmbedBuilder()
      .setColor(rank.color)
      .setTitle(`${rank.emoji} Check out my profile!`)
      .setDescription(`**Level ${user?.level || 1}** • **${formatNumber(user?.xp || 0)} XP** • **${user?.streak || 0} day streak** ${EMOJIS.streak}`)
      .addFields(
        { name: `${EMOJIS.trophy} Rank`, value: rank.name, inline: true },
        { name: `${EMOJIS.quiz} Quizzes`, value: String(user?.quizzesTaken || 0), inline: true },
        { name: `${EMOJIS.learn} Lessons`, value: String(user?.completedLessons?.length || 0), inline: true }
      )
      .setFooter({ text: `${EMOJIS.brain} Learn with ${BRAND.name} • /help` })
      .setTimestamp();

    await interaction.reply({ embeds: [shareEmbed] });
  } catch (error) {
    console.error('Share profile error:', error);
    await interaction.reply({ content: `${EMOJIS.error} Could not share profile.`, ephemeral: true });
  }
}
