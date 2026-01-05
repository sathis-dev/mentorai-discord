import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { getOrCreateUser } from '../../services/gamificationService.js';

// ═══════════════════════════════════════════════════════════════════════════════
//  🎨 V4 DESIGN SYSTEM - PREMIUM PROFILE CARD
//  Beautiful, mobile-optimized, competition-winning UI
// ═══════════════════════════════════════════════════════════════════════════════

export const data = new SlashCommandBuilder()
  .setName('profile')
  .setDescription('👤 View your premium profile card with stats & achievements')
  .addUserOption(option =>
    option.setName('user')
      .setDescription('View another user\'s profile'));

// ═══════════════════════════════════════════════════════════
// 🏆 TIER SYSTEM - Prestigious rank progression
// ═══════════════════════════════════════════════════════════
const TIERS = {
  legend: { 
    name: 'Legend', 
    emoji: '👑', 
    color: 0xFF6B35,
    gradient: '🔶🟠🟡',
    minLevel: 50,
    badge: '◆◆◆◆◆',
    title: 'LEGENDARY MENTOR',
    border: '═',
    glow: '✦'
  },
  master: { 
    name: 'Master', 
    emoji: '💎', 
    color: 0x00D4FF,
    gradient: '🔷💠🔹',
    minLevel: 40,
    badge: '◆◆◆◆○',
    title: 'MASTER CODER',
    border: '═',
    glow: '◈'
  },
  expert: { 
    name: 'Expert', 
    emoji: '🔮', 
    color: 0xA855F7,
    gradient: '🟣🔮💜',
    minLevel: 30,
    badge: '◆◆◆○○',
    title: 'EXPERT DEV',
    border: '─',
    glow: '◇'
  },
  advanced: { 
    name: 'Advanced', 
    emoji: '🥇', 
    color: 0xFFD700,
    gradient: '🟡⭐🌟',
    minLevel: 20,
    badge: '◆◆○○○',
    title: 'ADVANCED SCHOLAR',
    border: '─',
    glow: '★'
  },
  intermediate: { 
    name: 'Intermediate', 
    emoji: '🥈', 
    color: 0xC0C0C0,
    gradient: '⚪🔘⚫',
    minLevel: 12,
    badge: '◆○○○○',
    title: 'RISING STAR',
    border: '─',
    glow: '☆'
  },
  beginner: { 
    name: 'Beginner', 
    emoji: '🥉', 
    color: 0xCD7F32,
    gradient: '🟤🟠🔶',
    minLevel: 5,
    badge: '○○○○○',
    title: 'KEEN LEARNER',
    border: '─',
    glow: '○'
  },
  novice: { 
    name: 'Novice', 
    emoji: '🌱', 
    color: 0x22C55E,
    gradient: '🟢💚🌿',
    minLevel: 1,
    badge: '●○○○○',
    title: 'NEW EXPLORER',
    border: '─',
    glow: '•'
  }
};

function getTier(level) {
  if (level >= 50) return TIERS.legend;
  if (level >= 40) return TIERS.master;
  if (level >= 30) return TIERS.expert;
  if (level >= 20) return TIERS.advanced;
  if (level >= 12) return TIERS.intermediate;
  if (level >= 5) return TIERS.beginner;
  return TIERS.novice;
}

function getNextTier(level) {
  const tiers = Object.values(TIERS).sort((a, b) => a.minLevel - b.minLevel);
  return tiers.find(t => t.minLevel > level) || TIERS.legend;
}

// ═══════════════════════════════════════════════════════════
// 🎨 PREMIUM VISUAL COMPONENTS
// ═══════════════════════════════════════════════════════════

function createPremiumProgressBar(current, max, length = 16) {
  const safeMax = Math.max(max, 1);
  const safeCurrent = Math.max(0, Math.min(current, safeMax));
  const percentage = Math.round((safeCurrent / safeMax) * 100);
  const filled = Math.round((percentage / 100) * length);
  
  // Premium gradient bar
  const fillChar = '█';
  const emptyChar = '░';
  const bar = fillChar.repeat(filled) + emptyChar.repeat(length - filled);
  
  return { bar, percentage };
}

function createLevelCard(level, xp, xpNeeded, tier) {
  const { bar, percentage } = createPremiumProgressBar(xp, xpNeeded);
  const nextTier = getNextTier(level);
  const levelsToNext = nextTier.minLevel - level;
  
  return `\`\`\`ansi
\u001b[1;36m╔══════════════════════════════════════╗\u001b[0m
\u001b[1;36m║\u001b[0m  ${tier.glow} \u001b[1;33mLEVEL ${String(level).padStart(2, '0')}\u001b[0m ${tier.badge} ${tier.glow}  \u001b[1;36m║\u001b[0m
\u001b[1;36m╠══════════════════════════════════════╣\u001b[0m
\u001b[1;36m║\u001b[0m  \u001b[1;32m${bar}\u001b[0m  \u001b[1;36m║\u001b[0m
\u001b[1;36m║\u001b[0m  \u001b[1;37m${xp.toLocaleString().padStart(7)}\u001b[0m / \u001b[1;33m${xpNeeded.toLocaleString().padEnd(7)}\u001b[0m XP \u001b[1;35m${String(percentage).padStart(3)}%\u001b[0m  \u001b[1;36m║\u001b[0m
\u001b[1;36m╠══════════════════════════════════════╣\u001b[0m
\u001b[1;36m║\u001b[0m  ${nextTier.emoji} Next: \u001b[1;36m${nextTier.name}\u001b[0m in \u001b[1;33m${levelsToNext}\u001b[0m levels       \u001b[1;36m║\u001b[0m
\u001b[1;36m╚══════════════════════════════════════╝\u001b[0m
\`\`\``;
}

function createStatsPanel(stats) {
  const { quizzes, accuracy, lessons, topics, streak, achievements } = stats;
  
  // Accuracy grade
  let grade, gradeColor;
  if (accuracy >= 95) { grade = 'S+'; gradeColor = '\u001b[1;33m'; }
  else if (accuracy >= 90) { grade = 'S'; gradeColor = '\u001b[1;33m'; }
  else if (accuracy >= 85) { grade = 'A+'; gradeColor = '\u001b[1;32m'; }
  else if (accuracy >= 80) { grade = 'A'; gradeColor = '\u001b[1;32m'; }
  else if (accuracy >= 70) { grade = 'B'; gradeColor = '\u001b[1;36m'; }
  else if (accuracy >= 60) { grade = 'C'; gradeColor = '\u001b[1;37m'; }
  else { grade = 'D'; gradeColor = '\u001b[0;37m'; }

  return `\`\`\`ansi
\u001b[1;35m┌─────────────────────────────────────┐\u001b[0m
\u001b[1;35m│\u001b[0m      \u001b[1;37m📊 PERFORMANCE STATS\u001b[0m            \u001b[1;35m│\u001b[0m
\u001b[1;35m├─────────────────────────────────────┤\u001b[0m
\u001b[1;35m│\u001b[0m  🎯 Quizzes   \u001b[1;33m${String(quizzes).padStart(5)}\u001b[0m    📚 Lessons \u001b[1;32m${String(lessons).padStart(4)}\u001b[0m \u001b[1;35m│\u001b[0m
\u001b[1;35m│\u001b[0m  📂 Topics    \u001b[1;36m${String(topics).padStart(5)}\u001b[0m    🔥 Streak  \u001b[1;31m${String(streak).padStart(4)}\u001b[0m \u001b[1;35m│\u001b[0m
\u001b[1;35m├─────────────────────────────────────┤\u001b[0m
\u001b[1;35m│\u001b[0m  📈 Accuracy  ${gradeColor}${String(accuracy).padStart(3)}%\u001b[0m   Grade: ${gradeColor}[ ${grade.padEnd(2)} ]\u001b[0m   \u001b[1;35m│\u001b[0m
\u001b[1;35m│\u001b[0m  🏆 Achievements Unlocked    \u001b[1;33m${String(achievements).padStart(4)}\u001b[0m   \u001b[1;35m│\u001b[0m
\u001b[1;35m└─────────────────────────────────────┘\u001b[0m
\`\`\``;
}

function createStreakIndicator(streak) {
  if (streak === 0) {
    return '❄️ **No streak** — Start today with `/daily`!';
  }
  
  const flames = Math.min(streak, 7);
  const fireEmoji = '🔥'.repeat(flames);
  
  let status, bonus;
  if (streak >= 30) {
    status = '**🌟 LEGENDARY STREAK!**';
    bonus = '`+100% XP`';
  } else if (streak >= 14) {
    status = '**💫 Epic Streak!**';
    bonus = '`+75% XP`';
  } else if (streak >= 7) {
    status = '**🔥 On Fire!**';
    bonus = '`+50% XP`';
  } else if (streak >= 3) {
    status = '*Building momentum*';
    bonus = '`+25% XP`';
  } else {
    status = '*Just getting started*';
    bonus = '`+10% XP`';
  }
  
  return `${fireEmoji} **${streak} day${streak !== 1 ? 's' : ''}** ${status}\n> Bonus: ${bonus}`;
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
    
    // ═══ Calculate stats with safe defaults ═══
    const level = user?.level || 1;
    const xp = user?.xp || 0;
    const xpNeeded = typeof user?.xpForNextLevel === 'function' ? user.xpForNextLevel() : (level * 100);
    const streak = user?.streak || 0;
    const quizzes = user?.quizzesTaken || 0;
    const totalQ = user?.totalQuestions || 0;
    const correctA = user?.correctAnswers || 0;
    const accuracy = totalQ > 0 ? Math.round((correctA / totalQ) * 100) : 0;
    const achievements = user?.achievements || [];
    const lessonsCompleted = user?.completedLessons?.length || 0;
    const topicsStudied = user?.topicsStudied || [];
    const joinDate = user?.createdAt || new Date();
    
    // ═══ Get tier info ═══
    const tier = getTier(level);
    const memberDuration = Math.floor((Date.now() - new Date(joinDate).getTime()) / (1000 * 60 * 60 * 24));

    // ═══ Build Premium Profile Embed ═══
    const profileEmbed = new EmbedBuilder()
      .setColor(tier.color)
      .setAuthor({
        name: `${tier.emoji} ${tier.title} ${tier.emoji}`,
        iconURL: targetUser.displayAvatarURL({ dynamic: true })
      })
      .setTitle(`${targetUser.displayName || targetUser.username}`)
      .setThumbnail(targetUser.displayAvatarURL({ dynamic: true, size: 512 }))
      .setDescription(createLevelCard(level, xp, xpNeeded, tier))
      .addFields(
        {
          name: '📊 Statistics',
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
          name: '🔥 Daily Streak',
          value: createStreakIndicator(streak),
          inline: true
        },
        {
          name: `${tier.emoji} Current Rank`,
          value: `**${tier.name}**\n${tier.gradient}`,
          inline: true
        }
      );

    // Add achievements field if user has any
    if (achievements.length > 0 || isOwnProfile) {
      profileEmbed.addFields({
        name: `🏆 Achievements (${achievements.length})`,
        value: createAchievementBadges(achievements),
        inline: false
      });
    }

    // Add motivational message
    profileEmbed.addFields({
      name: '💬 Message',
      value: getMotivationalMessage(level, streak, accuracy),
      inline: false
    });

    profileEmbed.setFooter({ 
      text: `🎓 MentorAI • ${tier.emoji} ${tier.name} • Day ${memberDuration + 1}`,
      iconURL: interaction.client.user?.displayAvatarURL()
    });
    profileEmbed.setTimestamp();

    // ═══ Topics Panel (if user has studied topics) ═══
    const embeds = [profileEmbed];
    
    if (topicsStudied.length > 0 && isOwnProfile) {
      const topicsDisplay = topicsStudied.slice(0, 10).map(t => `\`${t}\``).join(' • ');
      const moreCount = topicsStudied.length > 10 ? `\n*...+${topicsStudied.length - 10} more*` : '';
      
      const topicsEmbed = new EmbedBuilder()
        .setColor(0x3B82F6)
        .setTitle('📚 Your Learning Journey')
        .setDescription(`**Topics Explored:**\n${topicsDisplay}${moreCount}`)
        .addFields({
          name: '💡 Suggested Next',
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
        .setEmoji('🏆')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId(`profile_stats_${targetUser.id}`)
        .setLabel('Full Stats')
        .setEmoji('📊')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('exec_leaderboard')
        .setLabel('Leaderboard')
        .setEmoji('🏅')
        .setStyle(ButtonStyle.Secondary)
    );

    const row2 = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('exec_daily')
        .setLabel('Daily')
        .setEmoji('📅')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId('exec_quiz')
        .setLabel('Quiz')
        .setEmoji('🎯')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId(`profile_share_${targetUser.id}`)
        .setLabel('Share')
        .setEmoji('📤')
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
      const fallbackEmbed = new EmbedBuilder()
        .setTitle(`👤 ${targetUser?.username || 'User'}'s Profile`)
        .setColor(0x22C55E)
        .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))
        .setDescription(`\`\`\`ansi
\u001b[1;36m╔══════════════════════════════╗\u001b[0m
\u001b[1;36m║\u001b[0m    \u001b[1;32m🌱 NEW EXPLORER 🌱\u001b[0m       \u001b[1;36m║\u001b[0m
\u001b[1;36m╚══════════════════════════════╝\u001b[0m
\`\`\``)
        .addFields(
          { name: '⭐ Level', value: '`1`', inline: true },
          { name: '✨ XP', value: '`0`', inline: true },
          { name: '🔥 Streak', value: '`0`', inline: true },
          { 
            name: '🚀 Get Started', 
            value: '> `/learn` — Start a lesson\n> `/quiz` — Test knowledge\n> `/daily` — Claim rewards',
            inline: false 
          }
        )
        .setFooter({ text: '🎓 MentorAI • Begin your journey!' })
        .setTimestamp();

      const fallbackButtons = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('exec_learn')
          .setLabel('Learn')
          .setEmoji('📚')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('exec_quiz')
          .setLabel('Quiz')
          .setEmoji('🎯')
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId('exec_help')
          .setLabel('Help')
          .setEmoji('❓')
          .setStyle(ButtonStyle.Secondary)
      );

      await interaction.editReply({ embeds: [fallbackEmbed], components: [fallbackButtons] });
    } catch (fallbackError) {
      console.error('Profile fallback error:', fallbackError);
      await interaction.editReply({ content: '❌ Could not load profile. Try `/profile` again.' });
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
      .setColor(0xFFD700)
      .setTitle('🏆 All Achievements')
      .setDescription(achievements.length > 0 
        ? achievements.map((a, i) => `${i + 1}. 🏅 **${a}**`).join('\n')
        : '> No achievements unlocked yet!\n> Complete quizzes and lessons to earn badges.')
      .setFooter({ text: `Total: ${achievements.length} achievements` })
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  } catch (error) {
    console.error('Achievements panel error:', error);
    await interaction.reply({ content: '❌ Could not load achievements.', ephemeral: true });
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

    const embed = new EmbedBuilder()
      .setColor(0x3B82F6)
      .setTitle('📊 Detailed Statistics')
      .setDescription(`\`\`\`ansi
\u001b[1;36m╔═══════════════════════════════════════╗\u001b[0m
\u001b[1;36m║\u001b[0m         \u001b[1;37mCOMPLETE STATS BREAKDOWN\u001b[0m       \u001b[1;36m║\u001b[0m
\u001b[1;36m╠═══════════════════════════════════════╣\u001b[0m
\u001b[1;36m║\u001b[0m  ⭐ Level:        \u001b[1;33m${String(stats.level).padStart(6)}\u001b[0m              \u001b[1;36m║\u001b[0m
\u001b[1;36m║\u001b[0m  ✨ Total XP:     \u001b[1;32m${String(stats.xp).padStart(6)}\u001b[0m              \u001b[1;36m║\u001b[0m
\u001b[1;36m║\u001b[0m  🔥 Best Streak:  \u001b[1;31m${String(stats.streak).padStart(6)}\u001b[0m days         \u001b[1;36m║\u001b[0m
\u001b[1;36m╠═══════════════════════════════════════╣\u001b[0m
\u001b[1;36m║\u001b[0m  🎯 Quizzes:      \u001b[1;35m${String(stats.quizzes).padStart(6)}\u001b[0m              \u001b[1;36m║\u001b[0m
\u001b[1;36m║\u001b[0m  📝 Questions:    \u001b[1;36m${String(stats.totalQ).padStart(6)}\u001b[0m              \u001b[1;36m║\u001b[0m
\u001b[1;36m║\u001b[0m  ✅ Correct:      \u001b[1;32m${String(stats.correct).padStart(6)}\u001b[0m              \u001b[1;36m║\u001b[0m
\u001b[1;36m║\u001b[0m  📈 Accuracy:     \u001b[1;33m${String(accuracy).padStart(5)}%\u001b[0m              \u001b[1;36m║\u001b[0m
\u001b[1;36m╠═══════════════════════════════════════╣\u001b[0m
\u001b[1;36m║\u001b[0m  📚 Lessons:      \u001b[1;34m${String(stats.lessons).padStart(6)}\u001b[0m              \u001b[1;36m║\u001b[0m
\u001b[1;36m║\u001b[0m  📂 Topics:       \u001b[1;35m${String(stats.topics).padStart(6)}\u001b[0m              \u001b[1;36m║\u001b[0m
\u001b[1;36m║\u001b[0m  🏆 Achievements: \u001b[1;33m${String(stats.achievements).padStart(6)}\u001b[0m              \u001b[1;36m║\u001b[0m
\u001b[1;36m╚═══════════════════════════════════════╝\u001b[0m
\`\`\``)
      .setFooter({ text: '🎓 MentorAI Statistics' })
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  } catch (error) {
    console.error('Stats panel error:', error);
    await interaction.reply({ content: '❌ Could not load stats.', ephemeral: true });
  }
}

async function shareProfile(interaction, userId) {
  try {
    const user = await getOrCreateUser(userId);
    const tier = getTier(user?.level || 1);
    
    const shareEmbed = new EmbedBuilder()
      .setColor(tier.color)
      .setTitle(`${tier.emoji} Check out my profile!`)
      .setDescription(`**Level ${user?.level || 1}** • **${user?.xp || 0} XP** • **${user?.streak || 0} day streak** 🔥`)
      .addFields(
        { name: '🏆 Rank', value: tier.name, inline: true },
        { name: '🎯 Quizzes', value: String(user?.quizzesTaken || 0), inline: true },
        { name: '📚 Lessons', value: String(user?.completedLessons?.length || 0), inline: true }
      )
      .setFooter({ text: '🎓 Learn with MentorAI • /help' })
      .setTimestamp();

    await interaction.reply({ embeds: [shareEmbed] });
  } catch (error) {
    console.error('Share profile error:', error);
    await interaction.reply({ content: '❌ Could not share profile.', ephemeral: true });
  }
}
