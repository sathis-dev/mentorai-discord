import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { getOrCreateUser } from '../../services/gamificationService.js';

export const data = new SlashCommandBuilder()
  .setName('profile')
  .setDescription('👤 View your detailed profile and statistics')
  .addUserOption(option =>
    option.setName('user')
      .setDescription('View another user\'s profile'));

// ═══════════════════════════════════════════════════════════
// TIER SYSTEM - Ranks based on level
// ═══════════════════════════════════════════════════════════
const TIERS = {
  legendary: { 
    name: 'Legendary', 
    emoji: '👑', 
    color: 0xFF00FF, 
    minLevel: 50,
    badge: '◆◆◆◆◆',
    title: 'Code Legend',
    aura: '✧･ﾟ: *✧･ﾟ:*'
  },
  diamond: { 
    name: 'Diamond', 
    emoji: '💎', 
    color: 0x00D9FF, 
    minLevel: 40,
    badge: '◆◆◆◆◇',
    title: 'Diamond Coder',
    aura: '💠═══════💠'
  },
  platinum: { 
    name: 'Platinum', 
    emoji: '🔮', 
    color: 0xE5E4E2, 
    minLevel: 30,
    badge: '◆◆◆◇◇',
    title: 'Platinum Dev',
    aura: '⚜️═══════⚜️'
  },
  gold: { 
    name: 'Gold', 
    emoji: '🥇', 
    color: 0xFFD700, 
    minLevel: 20,
    badge: '◆◆◇◇◇',
    title: 'Gold Scholar',
    aura: '🏆═══════🏆'
  },
  silver: { 
    name: 'Silver', 
    emoji: '🥈', 
    color: 0xC0C0C0, 
    minLevel: 15,
    badge: '◆◇◇◇◇',
    title: 'Silver Student',
    aura: '⚔️═══════⚔️'
  },
  bronze: { 
    name: 'Bronze', 
    emoji: '🥉', 
    color: 0xCD7F32, 
    minLevel: 10,
    badge: '◇◇◇◇◇',
    title: 'Bronze Learner',
    aura: '🛡️═══════🛡️'
  },
  iron: { 
    name: 'Iron', 
    emoji: '⚔️', 
    color: 0x71797E, 
    minLevel: 5,
    badge: '○○○○○',
    title: 'Iron Apprentice',
    aura: '━━━━━━━━━'
  },
  novice: { 
    name: 'Novice', 
    emoji: '🌱', 
    color: 0x57F287, 
    minLevel: 1,
    badge: '●○○○○',
    title: 'Novice Explorer',
    aura: '🌟━━━━━━━🌟'
  }
};

function getTier(level) {
  if (level >= 50) return TIERS.legendary;
  if (level >= 40) return TIERS.diamond;
  if (level >= 30) return TIERS.platinum;
  if (level >= 20) return TIERS.gold;
  if (level >= 15) return TIERS.silver;
  if (level >= 10) return TIERS.bronze;
  if (level >= 5) return TIERS.iron;
  return TIERS.novice;
}

// ═══════════════════════════════════════════════════════════
// VISUAL HELPERS
// ═══════════════════════════════════════════════════════════

function createAnimatedProgressBar(current, max, length = 20) {
  const safeMax = max > 0 ? max : 100;
  const safeCurrent = Math.min(current >= 0 ? current : 0, safeMax);
  const percentage = Math.round((safeCurrent / safeMax) * 100);
  const filled = Math.round((percentage / 100) * length);
  const empty = length - filled;
  
  // Gradient effect using different characters
  const gradient = ['█', '▓', '▒', '░'];
  let bar = '';
  
  for (let i = 0; i < filled; i++) {
    if (i < filled * 0.3) bar += gradient[0];
    else if (i < filled * 0.6) bar += gradient[1];
    else if (i < filled * 0.9) bar += gradient[2];
    else bar += gradient[3];
  }
  bar += '░'.repeat(empty);
  
  return bar;
}

function createXPDisplay(current, max, level) {
  const bar = createAnimatedProgressBar(current, max);
  const percentage = max > 0 ? Math.round((current / max) * 100) : 0;
  
  return `\`\`\`ansi
\u001b[1;36m╔══════════════════════════════╗\u001b[0m
\u001b[1;36m║\u001b[0m  \u001b[1;33m⭐ LEVEL ${level}\u001b[0m → \u001b[1;32mLEVEL ${level + 1}\u001b[0m   \u001b[1;36m║\u001b[0m
\u001b[1;36m╠══════════════════════════════╣\u001b[0m
\u001b[1;36m║\u001b[0m \u001b[1;35m${bar}\u001b[0m \u001b[1;36m║\u001b[0m
\u001b[1;36m╠══════════════════════════════╣\u001b[0m
\u001b[1;36m║\u001b[0m  \u001b[1;37m${current.toLocaleString().padStart(6)} / ${max.toLocaleString().padEnd(6)} XP\u001b[0m  \u001b[1;33m${percentage}%\u001b[0m  \u001b[1;36m║\u001b[0m
\u001b[1;36m╚══════════════════════════════╝\u001b[0m
\`\`\``;
}

function createStreakDisplay(streak) {
  const flames = streak > 0 ? '🔥'.repeat(Math.min(streak, 7)) : '❄️';
  const streakStatus = streak >= 7 ? '**BLAZING!**' : streak >= 3 ? '*On Fire!*' : streak > 0 ? 'Building...' : 'Start today!';
  
  let streakBonus = '';
  if (streak >= 7) streakBonus = '\n> 🎁 **+50% XP Bonus Active!**';
  else if (streak >= 3) streakBonus = '\n> 🎁 *+25% XP Bonus Active!*';
  
  return `${flames}\n**${streak} day${streak !== 1 ? 's' : ''}** ${streakStatus}${streakBonus}`;
}

function createStatsGrid(quizzes, accuracy, lessonsCompleted, topicsCount) {
  return `\`\`\`ansi
\u001b[1;36m┌────────────┬────────────┐\u001b[0m
\u001b[1;36m│\u001b[0m \u001b[1;33m📝 QUIZZES\u001b[0m \u001b[1;36m│\u001b[0m \u001b[1;32m🎯 ACCURACY\u001b[0m\u001b[1;36m│\u001b[0m
\u001b[1;36m│\u001b[0m    \u001b[1;37m${String(quizzes).padStart(4)}\u001b[0m    \u001b[1;36m│\u001b[0m    \u001b[1;37m${String(accuracy).padStart(3)}%\u001b[0m   \u001b[1;36m│\u001b[0m
\u001b[1;36m├────────────┼────────────┤\u001b[0m
\u001b[1;36m│\u001b[0m \u001b[1;35m📚 LESSONS\u001b[0m \u001b[1;36m│\u001b[0m \u001b[1;34m🗂️ TOPICS \u001b[0m \u001b[1;36m│\u001b[0m
\u001b[1;36m│\u001b[0m    \u001b[1;37m${String(lessonsCompleted).padStart(4)}\u001b[0m    \u001b[1;36m│\u001b[0m    \u001b[1;37m${String(topicsCount).padStart(4)}\u001b[0m    \u001b[1;36m│\u001b[0m
\u001b[1;36m└────────────┴────────────┘\u001b[0m
\`\`\``;
}

function getMotivationalQuote(level, streak, accuracy) {
  const quotes = [
    { condition: () => streak >= 7, quote: "🔥 You're on fire! 7+ day streak - unstoppable!" },
    { condition: () => accuracy >= 90, quote: "🎯 Quiz master! Over 90% accuracy is incredible!" },
    { condition: () => level >= 20, quote: "👑 A true coding veteran! Keep inspiring others!" },
    { condition: () => level >= 10, quote: "🚀 Double digits! You're making serious progress!" },
    { condition: () => streak >= 3, quote: "💪 Consistency is key - keep that streak going!" },
    { condition: () => accuracy >= 70, quote: "📈 Great accuracy! You're learning effectively!" },
    { condition: () => level >= 5, quote: "🌟 Level 5+! You're building a solid foundation!" },
    { condition: () => true, quote: "🌱 Every expert was once a beginner. Keep going!" }
  ];
  
  return quotes.find(q => q.condition())?.quote || quotes[quotes.length - 1].quote;
}

function getAchievementShowcase(achievements) {
  if (!achievements || achievements.length === 0) {
    return '> 🎮 *Complete quizzes and lessons to unlock achievements!*';
  }
  
  const recent = achievements.slice(-5);
  const display = recent.map(a => `> 🏅 ${a}`).join('\n');
  const hidden = achievements.length > 5 ? `\n> *...and ${achievements.length - 5} more!*` : '';
  
  return display + hidden;
}

// ═══════════════════════════════════════════════════════════
// MAIN EXECUTE FUNCTION
// ═══════════════════════════════════════════════════════════

export async function execute(interaction) {
  await interaction.deferReply();

  const targetUser = interaction.options.getUser('user') || interaction.user;

  try {
    const user = await getOrCreateUser(targetUser.id, targetUser.username);
    
    // ═══ Calculate all stats with safe defaults ═══
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
    const nextTier = Object.values(TIERS).find(t => t.minLevel > level) || tier;
    const levelsToNextTier = nextTier.minLevel - level;

    // ═══ Create Header Banner ═══
    const headerBanner = `
\`\`\`ansi
\u001b[1;36m╔═══════════════════════════════════════════════════╗\u001b[0m
\u001b[1;36m║\u001b[0m   ${tier.aura}   \u001b[1;36m║\u001b[0m
\u001b[1;36m║\u001b[0m      \u001b[1;33m${tier.emoji} ${tier.title.toUpperCase()} ${tier.emoji}\u001b[0m      \u001b[1;36m║\u001b[0m
\u001b[1;36m║\u001b[0m   ${tier.aura}   \u001b[1;36m║\u001b[0m
\u001b[1;36m╚═══════════════════════════════════════════════════╝\u001b[0m
\`\`\``;

    // ═══ Main Profile Embed ═══
    const profileEmbed = new EmbedBuilder()
      .setAuthor({
        name: `${targetUser.username}'s Profile`,
        iconURL: targetUser.displayAvatarURL({ dynamic: true })
      })
      .setColor(tier.color)
      .setThumbnail(targetUser.displayAvatarURL({ dynamic: true, size: 512 }))
      .setDescription(headerBanner)
      .addFields(
        {
          name: '✨ XP & PROGRESS',
          value: createXPDisplay(xp, xpNeeded, level),
          inline: false
        },
        {
          name: '🔥 STREAK',
          value: createStreakDisplay(streak),
          inline: true
        },
        {
          name: `${tier.emoji} RANK`,
          value: `**${tier.name}** ${tier.badge}\n> Next: ${nextTier.emoji} *${nextTier.name}*\n> ${levelsToNextTier} level${levelsToNextTier !== 1 ? 's' : ''} to go`,
          inline: true
        },
        {
          name: '📊 STATISTICS',
          value: createStatsGrid(quizzes, accuracy, lessonsCompleted, topicsStudied.length),
          inline: false
        },
        {
          name: '🏆 ACHIEVEMENTS ' + `(${achievements.length})`,
          value: getAchievementShowcase(achievements),
          inline: false
        },
        {
          name: '💬 TODAY\'S MOTIVATION',
          value: getMotivationalQuote(level, streak, accuracy),
          inline: false
        }
      )
      .setFooter({ 
        text: `🎓 MentorAI | Member since ${joinDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })} | ${tier.emoji} ${tier.name} Tier`,
        iconURL: interaction.client.user?.displayAvatarURL() || undefined
      })
      .setTimestamp();

    // ═══ Topics Studied - Second Embed ═══
    let embeds = [profileEmbed];
    
    if (topicsStudied.length > 0) {
      const topicsDisplay = topicsStudied.slice(0, 12).map(t => `\`${t}\``).join(' • ');
      const moreTopics = topicsStudied.length > 12 ? `\n*...and ${topicsStudied.length - 12} more*` : '';
      
      const topicsEmbed = new EmbedBuilder()
        .setColor(tier.color)
        .setTitle('📚 Topics Explored')
        .setDescription(topicsDisplay + moreTopics)
        .addFields({
          name: '🎯 Suggested Next Topics',
          value: getSuggestedTopics(topicsStudied),
          inline: false
        });
      
      embeds.push(topicsEmbed);
    }

    // ═══ Action Buttons ═══
    const row1 = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('profile_achievements_' + targetUser.id)
        .setLabel('All Achievements')
        .setEmoji('🏆')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('profile_stats_' + targetUser.id)
        .setLabel('Detailed Stats')
        .setEmoji('📊')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('execute_leaderboard')
        .setLabel('Leaderboard')
        .setEmoji('🏅')
        .setStyle(ButtonStyle.Secondary)
    );

    const row2 = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('execute_daily')
        .setLabel('Daily Challenge')
        .setEmoji('📅')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId('execute_quiz')
        .setLabel('Take Quiz')
        .setEmoji('🎯')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('profile_share_' + targetUser.id)
        .setLabel('Share Profile')
        .setEmoji('📤')
        .setStyle(ButtonStyle.Secondary)
    );

    await interaction.editReply({ 
      embeds: embeds, 
      components: [row1, row2] 
    });

  } catch (error) {
    console.error('Profile command error:', error);
    console.error('Profile error details:', {
      userId: targetUser?.id,
      username: targetUser?.username,
      errorMessage: error.message
    });
    
    // ═══ Enhanced Fallback Profile ═══
    try {
      const fallbackEmbed = new EmbedBuilder()
        .setTitle(`👤 ${targetUser?.username || 'User'}'s Profile`)
        .setColor(0x5865F2)
        .setThumbnail(targetUser.displayAvatarURL({ dynamic: true, size: 256 }))
        .setDescription(`
\`\`\`ansi
\u001b[1;36m╔═══════════════════════════════╗\u001b[0m
\u001b[1;36m║\u001b[0m    \u001b[1;33m🌱 NOVICE EXPLORER 🌱\u001b[0m    \u001b[1;36m║\u001b[0m
\u001b[1;36m╚═══════════════════════════════╝\u001b[0m
\`\`\`
`)
        .addFields(
          { name: '⭐ Level', value: '```\n1\n```', inline: true },
          { name: '✨ XP', value: '```\n0\n```', inline: true },
          { name: '🔥 Streak', value: '```\n0 days\n```', inline: true },
          { name: '💡 Getting Started', value: '> Use `/learn` to start learning!\n> Use `/quiz` to test your knowledge!\n> Use `/daily` for daily rewards!', inline: false }
        )
        .setFooter({ text: '🎓 MentorAI | Start your journey today!' })
        .setTimestamp();
      
      const fallbackButtons = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('execute_learn')
          .setLabel('Start Learning')
          .setEmoji('📚')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('execute_quiz')
          .setLabel('Take Quiz')
          .setEmoji('🎯')
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId('execute_help')
          .setLabel('View Help')
          .setEmoji('❓')
          .setStyle(ButtonStyle.Secondary)
      );
      
      await interaction.editReply({ embeds: [fallbackEmbed], components: [fallbackButtons] });
    } catch (fallbackError) {
      console.error('Profile fallback error:', fallbackError);
      await interaction.editReply({ 
        content: '❌ Failed to load profile. Try `/profile` directly.' 
      });
    }
  }
}

// ═══════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════

function getSuggestedTopics(studiedTopics) {
  const allTopics = [
    { name: 'JavaScript', related: ['TypeScript', 'Node.js', 'React'] },
    { name: 'Python', related: ['Django', 'FastAPI', 'Machine Learning'] },
    { name: 'React', related: ['Redux', 'Next.js', 'TypeScript'] },
    { name: 'Node.js', related: ['Express', 'MongoDB', 'REST APIs'] },
    { name: 'HTML/CSS', related: ['JavaScript', 'Tailwind', 'Bootstrap'] },
    { name: 'SQL', related: ['PostgreSQL', 'MongoDB', 'Database Design'] },
    { name: 'Git', related: ['GitHub Actions', 'CI/CD', 'DevOps'] },
    { name: 'TypeScript', related: ['React', 'Node.js', 'Angular'] }
  ];
  
  const suggestions = new Set();
  const studiedLower = studiedTopics.map(t => t.toLowerCase());
  
  for (const topic of allTopics) {
    if (studiedLower.includes(topic.name.toLowerCase())) {
      topic.related.forEach(r => {
        if (!studiedLower.includes(r.toLowerCase())) {
          suggestions.add(r);
        }
      });
    }
  }
  
  if (suggestions.size === 0) {
    return '> 🌟 `JavaScript` • `Python` • `HTML/CSS` - Great places to start!';
  }
  
  return '> 🎯 ' + Array.from(suggestions).slice(0, 4).map(t => `\`${t}\``).join(' • ');
}
