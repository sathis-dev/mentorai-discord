/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║   MentorAI Help Command - Premium UI V4.0                                    ║
 * ║   Beautiful, Intuitive, Mobile-Friendly Command Center                       ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

import { 
  SlashCommandBuilder, 
  EmbedBuilder, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle,
  StringSelectMenuBuilder 
} from 'discord.js';
import {
  COLORS,
  ICONS,
  LAYOUT,
  createProgressBar,
  getTier,
} from '../../config/designSystemV4.js';
import { getOrCreateUser } from '../../services/gamificationService.js';

// ═══════════════════════════════════════════════════════════════════════════════
// COMMAND DEFINITION
// ═══════════════════════════════════════════════════════════════════════════════

export const data = new SlashCommandBuilder()
  .setName('help')
  .setDescription('📖 Discover all MentorAI features and commands');

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN EXECUTE - Premium Welcome Screen
// ═══════════════════════════════════════════════════════════════════════════════

export async function execute(interaction) {
  try {
    // Get user data for personalization
    const user = await getOrCreateUser(interaction.user.id, interaction.user.username);
    const tier = getTier(user.level || 1);
    
    // Create premium welcome embed
    const mainEmbed = new EmbedBuilder()
      .setColor(COLORS.BRAND_PRIMARY)
      .setAuthor({ 
        name: 'MentorAI Command Center', 
        iconURL: interaction.client.user.displayAvatarURL() 
      })
      .setTitle(`${ICONS.LOGO} Welcome, ${interaction.user.username}!`)
      .setDescription(
        `${tier.emoji} **${tier.title}** • Level ${user.level || 1}\n\n` +
        `**🌟 Your AI-Powered Learning Journey**\n` +
        `MentorAI transforms coding education into an exciting adventure with:\n\n` +
        `${ICONS.BRAIN} **AI Lessons** — Learn any topic\n` +
        `${ICONS.TARGET} **Quizzes** — Test knowledge\n` +
        `${ICONS.XP} **XP & Levels** — Track progress\n` +
        `${ICONS.STREAK} **Streaks** — Stay consistent\n` +
        `${ICONS.TROPHY} **Achievements** — Collect badges\n` +
        `${ICONS.SWORD} **Battles** — Challenge friends\n\n` +
        `**🚀 Quick Start** — Select an action below!`
      )
      .setThumbnail(interaction.client.user.displayAvatarURL({ dynamic: true, size: 256 }))
      .setFooter({ 
        text: `${ICONS.LOGO} MentorAI • ${interaction.client.guilds.cache.size} servers • ${interaction.client.ws.ping}ms`,
        iconURL: interaction.user.displayAvatarURL()
      })
      .setTimestamp();

    // Category select menu - clean and organized
    const categoryMenu = new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId('help_category_v4')
        .setPlaceholder('📂 Explore command categories...')
        .addOptions([
          { 
            label: 'Learning', 
            description: 'AI lessons, explanations, topics', 
            value: 'learning', 
            emoji: '📚' 
          },
          { 
            label: 'Quizzes & Challenges', 
            description: 'Test knowledge, quiz battles', 
            value: 'quizzes', 
            emoji: '🎯' 
          },
          { 
            label: 'Progress & Stats', 
            description: 'XP, levels, achievements', 
            value: 'progress', 
            emoji: '📊' 
          },
          { 
            label: 'Social', 
            description: 'Leaderboards, study parties', 
            value: 'social', 
            emoji: '👥' 
          },
          { 
            label: 'Daily & Streaks', 
            description: 'Daily bonus, streak rewards', 
            value: 'daily', 
            emoji: '🔥' 
          },
          { 
            label: 'All Commands', 
            description: 'Complete command reference', 
            value: 'all', 
            emoji: '📋' 
          }
        ])
    );

    // Primary action buttons - most used features
    const primaryButtons = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('help_action_quiz')
        .setLabel('Quick Quiz')
        .setEmoji('🎯')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId('help_action_learn')
        .setLabel('Start Lesson')
        .setEmoji('📚')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('help_action_daily')
        .setLabel('Daily Bonus')
        .setEmoji('🎁')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('help_action_profile')
        .setLabel('My Profile')
        .setEmoji('👤')
        .setStyle(ButtonStyle.Secondary)
    );

    // Secondary action buttons
    const secondaryButtons = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('help_action_leaderboard')
        .setLabel('Rankings')
        .setEmoji('🏆')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('help_action_achievements')
        .setLabel('Achievements')
        .setEmoji('🎖️')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('help_action_streak')
        .setLabel('Streak')
        .setEmoji('🔥')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('help_action_topics')
        .setLabel('Topics')
        .setEmoji('📖')
        .setStyle(ButtonStyle.Secondary)
    );

    await interaction.reply({ 
      embeds: [mainEmbed], 
      components: [categoryMenu, primaryButtons, secondaryButtons] 
    });
    
  } catch (error) {
    console.error('Help command error:', error);
    await interaction.reply({
      content: '❌ An error occurred. Please try again!',
      ephemeral: true
    });
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// BUTTON HANDLERS - Rich Interactive Experiences
// ═══════════════════════════════════════════════════════════════════════════════

export async function handleButton(interaction, action) {
  const handlers = {
    'quiz': showQuizPanel,
    'learn': showLearnPanel,
    'daily': showDailyPanel,
    'profile': showProfilePanel,
    'leaderboard': showLeaderboardPanel,
    'achievements': showAchievementsPanel,
    'streak': showStreakPanel,
    'topics': showTopicsPanel,
    'back': showMainMenu,
  };
  
  const handler = handlers[action];
  if (handler) {
    await handler(interaction);
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// QUIZ PANEL - Start a Quiz
// ═══════════════════════════════════════════════════════════════════════════════

async function showQuizPanel(interaction) {
  const embed = new EmbedBuilder()
    .setColor(COLORS.QUIZ)
    .setTitle('🎯 Quiz Center')
    .setDescription(
      `### Test Your Knowledge!\n\n` +
      `Choose a topic and difficulty to start your quiz.\n` +
      `Each correct answer earns you **XP** based on difficulty:\n\n` +
      `🟢 **Easy** — +20 XP per question\n` +
      `🟡 **Medium** — +30 XP per question\n` +
      `🔴 **Hard** — +45 XP per question\n\n` +
      `*💡 Tip: Complete quizzes to unlock achievements!*`
    )
    .setFooter({ text: `${ICONS.LOGO} MentorAI • Select a topic below` });

  const topicMenu = new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId('quiz_topic_select_v4')
      .setPlaceholder('🎯 Choose a quiz topic...')
      .addOptions([
        { label: 'Random Mix', description: 'Surprise me with random topics!', value: 'random', emoji: '🎲' },
        { label: 'JavaScript', description: 'Web development fundamentals', value: 'javascript', emoji: '🟨' },
        { label: 'Python', description: 'General programming & AI', value: 'python', emoji: '🐍' },
        { label: 'TypeScript', description: 'Typed JavaScript', value: 'typescript', emoji: '🔷' },
        { label: 'React', description: 'Frontend framework', value: 'react', emoji: '⚛️' },
        { label: 'Node.js', description: 'Backend development', value: 'nodejs', emoji: '🟢' },
        { label: 'HTML & CSS', description: 'Web design basics', value: 'html-css', emoji: '🌐' },
        { label: 'SQL', description: 'Database queries', value: 'sql', emoji: '🗄️' },
        { label: 'Git', description: 'Version control', value: 'git', emoji: '📦' },
        { label: 'Data Structures', description: 'Arrays, trees, graphs', value: 'data-structures', emoji: '🔢' }
      ])
  );

  const buttons = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('exec_quickquiz')
      .setLabel('⚡ Quick Quiz')
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId('exec_challenge')
      .setLabel('⚔️ Challenge Friend')
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId('help_action_back')
      .setLabel('Back')
      .setEmoji('◀️')
      .setStyle(ButtonStyle.Secondary)
  );

  await interaction.update({ embeds: [embed], components: [topicMenu, buttons] });
}

// ═══════════════════════════════════════════════════════════════════════════════
// LEARN PANEL - Start Learning
// ═══════════════════════════════════════════════════════════════════════════════

async function showLearnPanel(interaction) {
  const embed = new EmbedBuilder()
    .setColor(COLORS.LESSON)
    .setTitle('📚 Learning Center')
    .setDescription(
      `### AI-Powered Lessons\n\n` +
      `Get personalized lessons on any programming topic!\n\n` +
      `**What you'll get:**\n` +
      `${ICONS.CHECK} Clear explanations\n` +
      `${ICONS.CHECK} Code examples\n` +
      `${ICONS.CHECK} Key concepts\n` +
      `${ICONS.CHECK} Practice challenges\n\n` +
      `**Difficulty Levels:**\n` +
      `🌱 **Beginner** — Start from scratch\n` +
      `🌿 **Intermediate** — Build on basics\n` +
      `🌳 **Advanced** — Deep dive`
    )
    .setFooter({ text: `${ICONS.LOGO} MentorAI • Select a topic to begin` });

  const topicMenu = new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId('learn_topic_select_v4')
      .setPlaceholder('📚 Choose a learning topic...')
      .addOptions([
        { label: 'JavaScript Basics', description: 'Variables, functions, loops', value: 'javascript-basics', emoji: '🟨' },
        { label: 'Python Fundamentals', description: 'Core Python concepts', value: 'python-basics', emoji: '🐍' },
        { label: 'Web Development', description: 'HTML, CSS, JS together', value: 'webdev', emoji: '🌐' },
        { label: 'React Essentials', description: 'Components, hooks, state', value: 'react', emoji: '⚛️' },
        { label: 'Data Structures', description: 'Arrays, objects, maps', value: 'datastructures', emoji: '🔢' },
        { label: 'APIs & REST', description: 'Working with APIs', value: 'apis', emoji: '🔗' },
        { label: 'Databases', description: 'SQL & NoSQL basics', value: 'databases', emoji: '🗄️' },
        { label: 'Algorithms', description: 'Problem solving', value: 'algorithms', emoji: '🧮' },
        { label: 'Custom Topic', description: 'Ask AI anything', value: 'custom', emoji: '🤖' }
      ])
  );

  const buttons = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('exec_explain')
      .setLabel('❓ Explain Concept')
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId('exec_path')
      .setLabel('🛤️ Learning Paths')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId('help_action_back')
      .setLabel('Back')
      .setEmoji('◀️')
      .setStyle(ButtonStyle.Secondary)
  );

  await interaction.update({ embeds: [embed], components: [topicMenu, buttons] });
}

// ═══════════════════════════════════════════════════════════════════════════════
// DAILY PANEL - Daily Bonus Info
// ═══════════════════════════════════════════════════════════════════════════════

async function showDailyPanel(interaction) {
  const embed = new EmbedBuilder()
    .setColor(COLORS.XP_GOLD)
    .setTitle('🎁 Daily Bonus Center')
    .setDescription(
      `### Claim Your Daily Rewards!\n\n` +
      `Come back every day to earn bonus XP and build your streak!\n\n` +
      `**Base Reward:** +75 XP\n\n` +
      `**Streak Multipliers:**\n` +
      `🔥 3+ days — **1.25x** XP\n` +
      `🔥 7+ days — **1.5x** XP\n` +
      `🔥 14+ days — **1.75x** XP\n` +
      `🔥 30+ days — **2x** XP\n\n` +
      `*Plus: AI-powered daily tips & fun facts!*`
    )
    .setFooter({ text: `${ICONS.LOGO} MentorAI • Resets at midnight UTC` });

  const buttons = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('exec_daily')
      .setLabel('🎁 Claim Now')
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId('exec_streak')
      .setLabel('🔥 View Streak')
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId('exec_funfact')
      .setLabel('🎲 Fun Fact')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId('help_action_back')
      .setLabel('Back')
      .setEmoji('◀️')
      .setStyle(ButtonStyle.Secondary)
  );

  await interaction.update({ embeds: [embed], components: [buttons] });
}

// ═══════════════════════════════════════════════════════════════════════════════
// PROFILE PANEL - User Stats
// ═══════════════════════════════════════════════════════════════════════════════

async function showProfilePanel(interaction) {
  const user = await getOrCreateUser(interaction.user.id, interaction.user.username);
  const tier = getTier(user.level || 1);
  const xpNeeded = user.xpForNextLevel ? user.xpForNextLevel() : 100;
  const xpProgress = createProgressBar(user.xp || 0, xpNeeded, 12, 'xp');
  
  const embed = new EmbedBuilder()
    .setColor(tier.color)
    .setTitle(`${tier.emoji} ${interaction.user.username}'s Profile`)
    .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
    .setDescription(
      `**${tier.title}** • Level ${user.level || 1}\n\n` +
      `**XP Progress:**\n${xpProgress}`
    )
    .addFields(
      { name: '⭐ Level', value: `**${user.level || 1}**`, inline: true },
      { name: '💎 XP', value: `**${(user.xp || 0).toLocaleString()}**`, inline: true },
      { name: '🔥 Streak', value: `**${user.streak || 0}** days`, inline: true },
      { name: '📝 Quizzes', value: `**${user.quizzesTaken || 0}**`, inline: true },
      { name: '🎯 Accuracy', value: `**${user.totalQuestions > 0 ? Math.round((user.correctAnswers / user.totalQuestions) * 100) : 0}%**`, inline: true },
      { name: '🏆 Badges', value: `**${user.achievements?.length || 0}**`, inline: true }
    )
    .setFooter({ text: `${ICONS.LOGO} MentorAI • ${tier.badge}` });

  const buttons = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('exec_profile')
      .setLabel('📊 Full Profile')
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId('exec_progress')
      .setLabel('📈 Detailed Stats')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId('exec_achievements')
      .setLabel('🏆 Achievements')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId('help_action_back')
      .setLabel('Back')
      .setEmoji('◀️')
      .setStyle(ButtonStyle.Secondary)
  );

  await interaction.update({ embeds: [embed], components: [buttons] });
}

// ═══════════════════════════════════════════════════════════════════════════════
// LEADERBOARD PANEL
// ═══════════════════════════════════════════════════════════════════════════════

async function showLeaderboardPanel(interaction) {
  const embed = new EmbedBuilder()
    .setColor(COLORS.LEADERBOARD)
    .setTitle('🏆 Leaderboard Center')
    .setDescription(
      `### Compete with Other Learners!\n\n` +
      `See who's at the top and climb the ranks!\n\n` +
      `**Rankings based on:**\n` +
      `🥇 Total XP earned\n` +
      `📈 Level progression\n` +
      `🔥 Learning streak\n\n` +
      `*Complete quizzes and lessons to rise up!*`
    )
    .setFooter({ text: `${ICONS.LOGO} MentorAI • Rise to the top!` });

  const buttons = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('exec_leaderboard')
      .setLabel('🌍 Global Rankings')
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId('exec_weekly')
      .setLabel('🏆 Weekly Challenge')
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId('help_action_back')
      .setLabel('Back')
      .setEmoji('◀️')
      .setStyle(ButtonStyle.Secondary)
  );

  await interaction.update({ embeds: [embed], components: [buttons] });
}

// ═══════════════════════════════════════════════════════════════════════════════
// ACHIEVEMENTS PANEL
// ═══════════════════════════════════════════════════════════════════════════════

async function showAchievementsPanel(interaction) {
  const embed = new EmbedBuilder()
    .setColor(COLORS.ACHIEVEMENT)
    .setTitle('🎖️ Achievement Gallery')
    .setDescription(
      `### Unlock Achievements!\n\n` +
      `Complete challenges to earn badges and bonus XP.\n\n` +
      `**Sample Achievements:**\n\n` +
      `🌟 **First Steps** — Complete your first quiz\n` +
      `🔥 **On Fire** — Achieve 7-day streak\n` +
      `🎯 **Sharpshooter** — Score 100% on a quiz\n` +
      `📚 **Bookworm** — Complete 10 lessons\n` +
      `👑 **Champion** — Reach level 10\n` +
      `💎 **Diamond Mind** — Reach level 30\n\n` +
      `*Each achievement grants bonus XP!*`
    )
    .setFooter({ text: `${ICONS.LOGO} MentorAI • Collect them all!` });

  const buttons = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('exec_achievements')
      .setLabel('🎖️ My Achievements')
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId('exec_profile')
      .setLabel('👤 My Profile')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId('help_action_back')
      .setLabel('Back')
      .setEmoji('◀️')
      .setStyle(ButtonStyle.Secondary)
  );

  await interaction.update({ embeds: [embed], components: [buttons] });
}

// ═══════════════════════════════════════════════════════════════════════════════
// STREAK PANEL
// ═══════════════════════════════════════════════════════════════════════════════

async function showStreakPanel(interaction) {
  const user = await getOrCreateUser(interaction.user.id, interaction.user.username);
  const streak = user.streak || 0;
  const fires = streak > 0 ? '🔥'.repeat(Math.min(streak, 7)) : '❄️';
  
  const embed = new EmbedBuilder()
    .setColor(COLORS.STREAK_FIRE)
    .setTitle('🔥 Streak Status')
    .setDescription(
      `### Keep the Fire Burning!\n\n` +
      `${fires}\n` +
      `**Current Streak:** ${streak} day${streak !== 1 ? 's' : ''}\n\n` +
      `**Streak Bonuses:**\n` +
      `📅 3 days → **+25%** XP\n` +
      `📅 7 days → **+50%** XP\n` +
      `📅 14 days → **+75%** XP\n` +
      `📅 30 days → **+100%** XP\n\n` +
      `*Complete any activity daily to maintain your streak!*`
    )
    .setFooter({ text: `${ICONS.LOGO} MentorAI • Consistency is key!` });

  const buttons = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('exec_streak')
      .setLabel('🔥 Full Streak Info')
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId('exec_daily')
      .setLabel('🎁 Claim Daily')
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId('help_action_back')
      .setLabel('Back')
      .setEmoji('◀️')
      .setStyle(ButtonStyle.Secondary)
  );

  await interaction.update({ embeds: [embed], components: [buttons] });
}

// ═══════════════════════════════════════════════════════════════════════════════
// TOPICS PANEL
// ═══════════════════════════════════════════════════════════════════════════════

async function showTopicsPanel(interaction) {
  const embed = new EmbedBuilder()
    .setColor(COLORS.LESSON)
    .setTitle('📖 Available Topics')
    .setDescription(
      `### Master These Programming Topics\n\n` +
      `**💻 Languages**\n` +
      `🟨 JavaScript • 🐍 Python • 🔷 TypeScript\n` +
      `☕ Java • 🔵 C++ • 🦀 Rust • 🐹 Go\n\n` +
      `**🌐 Web Development**\n` +
      `⚛️ React • 💚 Vue.js • 🅰️ Angular\n` +
      `🟢 Node.js • 🎨 CSS/Tailwind • 📱 Responsive\n\n` +
      `**🗄️ Backend & Data**\n` +
      `🗃️ SQL • 🍃 MongoDB • 🔥 Firebase\n` +
      `📦 REST APIs • 🔒 Authentication\n\n` +
      `**🧠 Computer Science**\n` +
      `🔢 Data Structures • 🧮 Algorithms\n` +
      `🤖 Machine Learning • ☁️ Cloud Computing\n\n` +
      `*Or ask about any topic — AI can teach it!*`
    )
    .setFooter({ text: `${ICONS.LOGO} MentorAI • Learn anything!` });

  const buttons = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('exec_topics')
      .setLabel('📋 Full Topic List')
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId('help_action_learn')
      .setLabel('📚 Start Learning')
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId('help_action_quiz')
      .setLabel('🎯 Take Quiz')
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId('help_action_back')
      .setLabel('Back')
      .setEmoji('◀️')
      .setStyle(ButtonStyle.Secondary)
  );

  await interaction.update({ embeds: [embed], components: [buttons] });
}

// ═══════════════════════════════════════════════════════════════════════════════
// BACK TO MAIN MENU
// ═══════════════════════════════════════════════════════════════════════════════

async function showMainMenu(interaction) {
  try {
    const user = await getOrCreateUser(interaction.user.id, interaction.user.username);
    const tier = getTier(user.level || 1);
    
    const mainEmbed = new EmbedBuilder()
      .setColor(COLORS.BRAND_PRIMARY)
      .setAuthor({ 
        name: 'MentorAI Command Center', 
        iconURL: interaction.client.user.displayAvatarURL() 
      })
      .setTitle(`${ICONS.LOGO} Welcome, ${interaction.user.username}!`)
      .setDescription(
        `${tier.emoji} **${tier.title}** • Level ${user.level || 1}\n\n` +
        `**🌟 Your AI-Powered Learning Journey**\n` +
        `MentorAI transforms coding education into an exciting adventure with:\n\n` +
        `${ICONS.BRAIN} **AI Lessons** — Learn any topic\n` +
        `${ICONS.TARGET} **Quizzes** — Test knowledge\n` +
        `${ICONS.XP} **XP & Levels** — Track progress\n` +
        `${ICONS.STREAK} **Streaks** — Stay consistent\n` +
        `${ICONS.TROPHY} **Achievements** — Collect badges\n` +
        `${ICONS.SWORD} **Battles** — Challenge friends\n\n` +
        `**🚀 Quick Start** — Select an action below!`
      )
      .setThumbnail(interaction.client.user.displayAvatarURL({ dynamic: true, size: 256 }))
      .setFooter({ 
        text: `${ICONS.LOGO} MentorAI • ${interaction.client.guilds.cache.size} servers • ${interaction.client.ws.ping}ms`,
        iconURL: interaction.user.displayAvatarURL()
      })
      .setTimestamp();

    const categoryMenu = new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId('help_category_v4')
        .setPlaceholder('📂 Explore command categories...')
        .addOptions([
          { label: 'Learning', description: 'AI lessons, explanations, topics', value: 'learning', emoji: '📚' },
          { label: 'Quizzes & Challenges', description: 'Test knowledge, quiz battles', value: 'quizzes', emoji: '🎯' },
          { label: 'Progress & Stats', description: 'XP, levels, achievements', value: 'progress', emoji: '📊' },
          { label: 'Social', description: 'Leaderboards, study parties', value: 'social', emoji: '👥' },
          { label: 'Daily & Streaks', description: 'Daily bonus, streak rewards', value: 'daily', emoji: '🔥' },
          { label: 'All Commands', description: 'Complete command reference', value: 'all', emoji: '📋' }
        ])
    );

    const primaryButtons = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('help_action_quiz')
        .setLabel('Quick Quiz')
        .setEmoji('🎯')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId('help_action_learn')
        .setLabel('Start Lesson')
        .setEmoji('📚')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('help_action_daily')
        .setLabel('Daily Bonus')
        .setEmoji('🎁')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('help_action_profile')
        .setLabel('My Profile')
        .setEmoji('👤')
        .setStyle(ButtonStyle.Secondary)
    );

    const secondaryButtons = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('help_action_leaderboard')
        .setLabel('Rankings')
        .setEmoji('🏆')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('help_action_achievements')
        .setLabel('Achievements')
        .setEmoji('🎖️')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('help_action_streak')
        .setLabel('Streak')
        .setEmoji('🔥')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('help_action_topics')
        .setLabel('Topics')
        .setEmoji('📖')
        .setStyle(ButtonStyle.Secondary)
    );

    await interaction.update({ 
      embeds: [mainEmbed], 
      components: [categoryMenu, primaryButtons, secondaryButtons] 
    });
  } catch (error) {
    console.error('Error returning to main menu:', error);
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// CATEGORY SELECT HANDLER
// ═══════════════════════════════════════════════════════════════════════════════

export async function handleCategorySelect(interaction, category) {
  const categoryEmbeds = {
    learning: createLearningCategoryEmbed(),
    quizzes: createQuizzesCategoryEmbed(),
    progress: createProgressCategoryEmbed(),
    social: createSocialCategoryEmbed(),
    daily: createDailyCategoryEmbed(),
    all: createAllCommandsEmbed(),
  };
  
  const embed = categoryEmbeds[category] || categoryEmbeds.all;
  
  const categoryMenu = new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId('help_category_v4')
      .setPlaceholder('📂 Explore command categories...')
      .addOptions([
        { label: 'Learning', description: 'AI lessons, explanations, topics', value: 'learning', emoji: '📚' },
        { label: 'Quizzes & Challenges', description: 'Test knowledge, quiz battles', value: 'quizzes', emoji: '🎯' },
        { label: 'Progress & Stats', description: 'XP, levels, achievements', value: 'progress', emoji: '📊' },
        { label: 'Social', description: 'Leaderboards, study parties', value: 'social', emoji: '👥' },
        { label: 'Daily & Streaks', description: 'Daily bonus, streak rewards', value: 'daily', emoji: '🔥' },
        { label: 'All Commands', description: 'Complete command reference', value: 'all', emoji: '📋' }
      ])
  );

  const buttons = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('help_action_quiz')
      .setLabel('Quiz')
      .setEmoji('🎯')
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId('help_action_learn')
      .setLabel('Learn')
      .setEmoji('📚')
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId('help_action_back')
      .setLabel('Main Menu')
      .setEmoji('🏠')
      .setStyle(ButtonStyle.Secondary)
  );

  await interaction.update({ embeds: [embed], components: [categoryMenu, buttons] });
}

// ═══════════════════════════════════════════════════════════════════════════════
// CATEGORY EMBED BUILDERS
// ═══════════════════════════════════════════════════════════════════════════════

function createLearningCategoryEmbed() {
  return new EmbedBuilder()
    .setColor(COLORS.LESSON)
    .setTitle('📚 Learning Commands')
    .setDescription(`### Master Any Programming Topic!\n\n`)
    .addFields(
      { 
        name: '`/learn [topic]`', 
        value: '📖 Get an AI-generated lesson on any topic\n*Example: `/learn JavaScript async/await`*', 
        inline: false 
      },
      { 
        name: '`/explain [concept]`', 
        value: '💡 Get detailed explanation with examples\n*Example: `/explain recursion`*', 
        inline: false 
      },
      { 
        name: '`/topics`', 
        value: '📋 Browse all available learning topics', 
        inline: false 
      },
      { 
        name: '`/path [subject]`', 
        value: '🛤️ Follow structured learning paths', 
        inline: false 
      },
      { 
        name: '`/funfact [topic]`', 
        value: '🎲 Learn fun facts about programming', 
        inline: false 
      }
    )
    .setFooter({ text: `${ICONS.LOGO} MentorAI • AI-Powered Learning` });
}

function createQuizzesCategoryEmbed() {
  return new EmbedBuilder()
    .setColor(COLORS.QUIZ)
    .setTitle('🎯 Quiz Commands')
    .setDescription(`### Test Your Knowledge!\n\n`)
    .addFields(
      { 
        name: '`/quiz [topic]`', 
        value: '🎯 Take an AI-generated quiz\n*Options: questions count, difficulty*', 
        inline: false 
      },
      { 
        name: '`/quickquiz`', 
        value: '⚡ Instant one-question challenge', 
        inline: false 
      },
      { 
        name: '`/challenge @user`', 
        value: '⚔️ Challenge a friend to quiz battle', 
        inline: false 
      },
      { 
        name: '`/studyparty start`', 
        value: '🎉 Start a group study session', 
        inline: false 
      },
      { 
        name: '`/weekly`', 
        value: '🏆 View weekly server challenges', 
        inline: false 
      }
    )
    .setFooter({ text: `${ICONS.LOGO} MentorAI • Earn XP through quizzes!` });
}

function createProgressCategoryEmbed() {
  return new EmbedBuilder()
    .setColor(COLORS.XP_GOLD)
    .setTitle('📊 Progress Commands')
    .setDescription(`### Track Your Learning Journey!\n\n`)
    .addFields(
      { 
        name: '`/profile`', 
        value: '👤 View your complete profile and tier', 
        inline: false 
      },
      { 
        name: '`/progress`', 
        value: '📈 Detailed statistics and history', 
        inline: false 
      },
      { 
        name: '`/achievements`', 
        value: '🎖️ View and track achievements', 
        inline: false 
      },
      { 
        name: '`/stats`', 
        value: '📊 Global platform statistics', 
        inline: false 
      }
    )
    .setFooter({ text: `${ICONS.LOGO} MentorAI • Level up your skills!` });
}

function createSocialCategoryEmbed() {
  return new EmbedBuilder()
    .setColor(COLORS.PARTY)
    .setTitle('👥 Social Commands')
    .setDescription(`### Learn Together!\n\n`)
    .addFields(
      { 
        name: '`/leaderboard`', 
        value: '🏆 View global rankings', 
        inline: false 
      },
      { 
        name: '`/challenge @user`', 
        value: '⚔️ 1v1 quiz battle', 
        inline: false 
      },
      { 
        name: '`/studyparty`', 
        value: '🎉 Group study sessions with XP bonus', 
        inline: false 
      },
      { 
        name: '`/invite`', 
        value: '📨 Add MentorAI to other servers', 
        inline: false 
      },
      { 
        name: '`/share`', 
        value: '📤 Share your achievements', 
        inline: false 
      },
      { 
        name: '`/referral`', 
        value: '🎁 Invite friends and earn rewards', 
        inline: false 
      }
    )
    .setFooter({ text: `${ICONS.LOGO} MentorAI • Better together!` });
}

function createDailyCategoryEmbed() {
  return new EmbedBuilder()
    .setColor(COLORS.STREAK_FIRE)
    .setTitle('🔥 Daily & Streak Commands')
    .setDescription(`### Stay Consistent!\n\n`)
    .addFields(
      { 
        name: '`/daily`', 
        value: '🎁 Claim daily XP bonus + AI tips', 
        inline: false 
      },
      { 
        name: '`/streak`', 
        value: '🔥 Check your learning streak', 
        inline: false 
      },
      { 
        name: '`/weekly`', 
        value: '🏆 Weekly challenges and rewards', 
        inline: false 
      }
    )
    .addFields({
      name: '📅 Streak Bonuses',
      value: 
        `\`3+ days\` → +25% XP\n` +
        `\`7+ days\` → +50% XP\n` +
        `\`14+ days\` → +75% XP\n` +
        `\`30+ days\` → +100% XP`,
      inline: false
    })
    .setFooter({ text: `${ICONS.LOGO} MentorAI • Consistency wins!` });
}

function createAllCommandsEmbed() {
  return new EmbedBuilder()
    .setColor(COLORS.BRAND_PRIMARY)
    .setTitle('📋 All Commands')
    .setDescription(`### Complete Command Reference\n`)
    .addFields(
      { 
        name: '📚 Learning', 
        value: '`/learn` `/explain` `/topics` `/path` `/funfact`', 
        inline: true 
      },
      { 
        name: '🎯 Quizzes', 
        value: '`/quiz` `/quickquiz` `/challenge`', 
        inline: true 
      },
      { 
        name: '📊 Progress', 
        value: '`/profile` `/progress` `/achievements` `/stats`', 
        inline: true 
      },
      { 
        name: '🔥 Daily', 
        value: '`/daily` `/streak` `/weekly`', 
        inline: true 
      },
      { 
        name: '👥 Social', 
        value: '`/leaderboard` `/studyparty` `/invite` `/share` `/referral`', 
        inline: true 
      },
      { 
        name: '⚙️ Utility', 
        value: '`/help` `/ping` `/feedback` `/setup` `/run`', 
        inline: true 
      }
    )
    .setFooter({ text: `${ICONS.LOGO} MentorAI • Your AI Learning Companion` });
}
