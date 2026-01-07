/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║   MentorAI Help Command - ULTIMATE V5.0                                      ║
 * ║   Gateway Experience with New vs Returning User Flows                        ║
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
  BRAND,
  COLORS,
  EMOJIS,
  VISUALS,
  RANKS,
  getRank,
  getNextRank,
  createProgressBar,
  createXPBar,
  xpForLevel,
  formatNumber,
  getStreakMultiplier,
  createTopicSelectMenu
} from '../../config/brandSystem.js';
import { getOrCreateUser } from '../../services/gamificationService.js';
import { checkMobileUser } from '../../utils/mobileUI.js';
import { 
  createMobileHelpEmbed, 
  createMobileQuickStartEmbed, 
  createMobileMoreCommandsEmbed,
  createMobileHelpCategoryEmbed 
} from '../../embeds/mobile/helpMobile.js';

// ═══════════════════════════════════════════════════════════════════════════════
// COMMAND DEFINITION
// ═══════════════════════════════════════════════════════════════════════════════

export const data = new SlashCommandBuilder()
  .setName('help')
  .setDescription('📖 Discover all MentorAI features and commands');

// ═══════════════════════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

function isNewUser(user) {
  return (user.lessonsCompleted || 0) === 0 && 
         (user.quizzesTaken || 0) === 0 && 
         (user.level || 1) <= 1;
}

function getUserJourneyStage(user) {
  const lessons = user.lessonsCompleted || 0;
  const quizzes = user.quizzesTaken || 0;
  const level = user.level || 1;
  const streak = user.streak || 0;
  
  if (lessons === 0 && quizzes === 0) return 'new';
  if (lessons < 5 && level < 3) return 'exploring';
  if (level < 10 && streak < 3) return 'learning';
  if (level < 20) return 'progressing';
  if (level < 35) return 'advanced';
  return 'mastery';
}

// Safe interaction updater - prevents "This interaction failed" errors
async function safeUpdate(interaction, payload) {
  try {
    await interaction.update(payload);
  } catch (error) {
    console.error('Safe update failed:', error.message);
    try {
      // Fallback: try to reply if update fails
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({ ...payload, ephemeral: true });
      }
    } catch (e) {
      // Last resort: just acknowledge
      try { await interaction.deferUpdate(); } catch (_) {}
    }
  }
}

function getNextAction(user) {
  const stage = getUserJourneyStage(user);
  const actions = {
    new: { text: 'Take your first quiz!', command: 'quiz', emoji: '🎯' },
    exploring: { text: 'Try a coding lesson!', command: 'learn', emoji: '📖' },
    learning: { text: 'Build your streak!', command: 'daily', emoji: '🔥' },
    progressing: { text: 'Challenge a friend!', command: 'challenge', emoji: '⚔️' },
    advanced: { text: 'Check the leaderboard!', command: 'leaderboard', emoji: '🏆' },
    mastery: { text: 'Run some code!', command: 'run', emoji: '💻' }
  };
  return actions[stage] || actions.exploring;
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN EXECUTE - Gateway Experience
// ═══════════════════════════════════════════════════════════════════════════════

export async function execute(interaction) {
  try {
    // Get user data for personalization
    const user = await getOrCreateUser(interaction.user.id, interaction.user.username);
    
    // Check if user is on mobile
    const isMobile = await checkMobileUser(interaction);
    
    // Route to appropriate experience based on device
    if (isMobile) {
      // Mobile-optimized UI
      const response = createMobileHelpEmbed(user, isNewUser(user), interaction.client);
      await interaction.reply(response);
    } else if (isNewUser(user)) {
      await showNewUserWelcome(interaction, user);
    } else {
      await showReturningUserDashboard(interaction, user);
    }
    
  } catch (error) {
    console.error('Help command error:', error);
    await interaction.reply({
      content: '❌ An error occurred. Please try again!',
      ephemeral: true
    });
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// NEW USER WELCOME - First Time Experience
// ═══════════════════════════════════════════════════════════════════════════════

async function showNewUserWelcome(interaction, user) {
  const welcomeEmbed = new EmbedBuilder()
    .setColor(COLORS.PRIMARY)
    .setAuthor({ 
      name: `${EMOJIS.sparkle} Welcome to ${BRAND.name}!`, 
      iconURL: interaction.client.user.displayAvatarURL() 
    })
    .setThumbnail(interaction.client.user.displayAvatarURL({ dynamic: true, size: 256 }))
    .setDescription(`
${VISUALS.separators.fancy}

# ${EMOJIS.rocket} Hey ${interaction.user.username}!

**Ready to level up your coding skills?**

${BRAND.name} is your AI-powered coding mentor that makes learning fun with:

${EMOJIS.learn} **Interactive Lessons** — AI explains any topic
${EMOJIS.quiz} **Smart Quizzes** — Test & earn XP
${EMOJIS.streak} **Daily Streaks** — Build consistency
${EMOJIS.achievement} **Achievements** — Unlock badges
${EMOJIS.challenge} **Challenges** — Compete with friends

${VISUALS.separators.thin}

### ${EMOJIS.target} Quick Start Guide

**Step 1:** Take a quick quiz to test your level
**Step 2:** Learn something new with /learn
**Step 3:** Come back daily for streak bonuses!

${VISUALS.separators.fancy}
    `)
    .setFooter({ 
      text: `${EMOJIS.hint} ${BRAND.tagline}`,
      iconURL: interaction.user.displayAvatarURL()
    })
    .setTimestamp();

  // Quick Start Action Buttons
  const quickStartRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('help_quickstart_quiz')
      .setLabel('🎯 Take First Quiz')
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId('help_quickstart_learn')
      .setLabel('📖 Start Learning')
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId('help_quickstart_explore')
      .setLabel('🗺️ Explore Features')
      .setStyle(ButtonStyle.Secondary)
  );

  // Topic Selection for new users
  const topicRow = createTopicSelectMenu('help_topic');

  await interaction.reply({ 
    embeds: [welcomeEmbed], 
    components: [quickStartRow, topicRow] 
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// RETURNING USER DASHBOARD - Personalized Hub
// ═══════════════════════════════════════════════════════════════════════════════

async function showReturningUserDashboard(interaction, user) {
  const rank = getRank(user.level || 1);
  const nextRank = getNextRank(user.level || 1);
  const xpNeeded = xpForLevel(user.level + 1);
  const xpProgress = user.xp || 0;
  const progressPercent = Math.min(Math.round((xpProgress / xpNeeded) * 100), 100);
  const streak = user.streak || 0;
  const streakMultiplier = getStreakMultiplier(streak);
  const nextAction = getNextAction(user);
  
  // Calculate stats
  const accuracy = user.totalQuestions > 0 
    ? Math.round((user.correctAnswers / user.totalQuestions) * 100) 
    : 0;

  const dashboardEmbed = new EmbedBuilder()
    .setColor(rank.color)
    .setAuthor({ 
      name: `${EMOJIS.crown} ${BRAND.name} Command Center`, 
      iconURL: interaction.client.user.displayAvatarURL() 
    })
    .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true, size: 256 }))
    .setDescription(`
${VISUALS.separators.fancy}

# ${EMOJIS.rocket} Welcome back, ${interaction.user.username}!

${VISUALS.separators.thin}

### ${rank.emoji} ${rank.name.toUpperCase()} • Level ${user.level || 1}

\`${createProgressBar(xpProgress, xpNeeded, 14)}\` **${progressPercent}%**
${EMOJIS.xp} \`${formatNumber(xpProgress)} / ${formatNumber(xpNeeded)} XP\` to Level ${(user.level || 1) + 1}

${VISUALS.separators.thin}

### ${EMOJIS.stats} Your Stats

> ${EMOJIS.streak} **${streak}** day streak ${streakMultiplier > 1 ? `(${streakMultiplier}x XP!)` : ''}
> ${EMOJIS.learn} **${user.lessonsCompleted || 0}** lessons completed
> ${EMOJIS.quiz} **${user.quizzesTaken || 0}** quizzes taken
> ${EMOJIS.target} **${accuracy}%** accuracy
> ${EMOJIS.achievement} **${user.achievements?.length || 0}** achievements

${VISUALS.separators.thin}

### ${EMOJIS.lightning} Suggested Next Step
> ${nextAction.emoji} **${nextAction.text}** — Use \`/${nextAction.command}\`

${VISUALS.separators.fancy}
    `)
    .setFooter({ 
      text: `⚡ ${BRAND.name} • ${interaction.client.guilds.cache.size} servers • ${interaction.client.ws.ping}ms`,
      iconURL: interaction.user.displayAvatarURL()
    })
    .setTimestamp();

  // Category select menu
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

  // Primary action buttons
  const primaryButtons = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('help_action_quiz')
      .setLabel('Quick Quiz')
      .setEmoji('🎯')
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId('help_action_learn')
      .setLabel('Start Lesson')
      .setEmoji('📚')
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId('help_action_daily')
      .setLabel('Daily Bonus')
      .setEmoji('🎁')
      .setStyle(ButtonStyle.Danger),
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
      .setLabel('Badges')
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
    embeds: [dashboardEmbed], 
    components: [categoryMenu, primaryButtons, secondaryButtons] 
  });
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
    try {
      await handler(interaction);
    } catch (error) {
      console.error(`Help button handler error (${action}):`, error);
      // Attempt to show a graceful error
      try {
        if (interaction.replied || interaction.deferred) {
          await interaction.followUp({ content: `❌ Failed to load panel. Try \`/${action}\` directly.`, ephemeral: true });
        } else {
          await interaction.reply({ content: `❌ Failed to load panel. Try \`/${action}\` directly.`, ephemeral: true });
        }
      } catch (e) {
        // Last resort - acknowledge the interaction
        try { await interaction.deferUpdate(); } catch (_) {}
      }
    }
  } else {
    // Unknown action - provide a helpful fallback
    try {
      await interaction.reply({ 
        content: `✨ Use \`/${action}\` to access this feature!`, 
        ephemeral: true 
      });
    } catch (e) {
      try { await interaction.deferUpdate(); } catch (_) {}
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// QUICK START HANDLERS - New User Onboarding
// ═══════════════════════════════════════════════════════════════════════════════

export async function handleQuickStartButton(interaction, action) {
  try {
    if (action === 'quiz') {
      await showQuizPanel(interaction);
    } else if (action === 'learn') {
      await showLearnPanel(interaction);
    } else if (action === 'explore') {
      const user = await getOrCreateUser(interaction.user.id, interaction.user.username);
      await showReturningUserDashboard({ ...interaction, reply: interaction.update.bind(interaction) }, user);
    } else {
      // Unknown action - provide fallback
      await interaction.reply({ 
        content: `✨ Getting started? Try \`/quiz\` or \`/learn\` to begin!`, 
        ephemeral: true 
      });
    }
  } catch (error) {
    console.error(`QuickStart button error (${action}):`, error);
    try {
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({ content: '❌ Something went wrong. Try `/help` again!', ephemeral: true });
      } else {
        await interaction.reply({ content: '❌ Something went wrong. Try `/help` again!', ephemeral: true });
      }
    } catch (e) {
      try { await interaction.deferUpdate(); } catch (_) {}
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// MOBILE BUTTON HANDLERS
// ═══════════════════════════════════════════════════════════════════════════════

export async function handleMobileButton(interaction, action) {
  try {
    const user = await getOrCreateUser(interaction.user.id, interaction.user.username);
    
    switch (action) {
      case 'quickstart': {
        const response = createMobileQuickStartEmbed();
        await safeUpdate(interaction, response);
        break;
      }
      case 'more': {
        const response = createMobileMoreCommandsEmbed();
        await safeUpdate(interaction, response);
        break;
      }
      case 'home': {
        const response = createMobileHelpEmbed(user, isNewUser(user), interaction.client);
        await safeUpdate(interaction, response);
        break;
      }
      default: {
        await interaction.reply({ content: '✨ Try `/help` for commands!', ephemeral: true });
      }
    }
  } catch (error) {
    console.error(`Mobile button error (${action}):`, error);
    try { await interaction.deferUpdate(); } catch (_) {}
  }
}

// Handle mobile category select menu
export async function handleMobileCategorySelect(interaction, value) {
  try {
    const response = createMobileHelpCategoryEmbed(value);
    await safeUpdate(interaction, response);
  } catch (error) {
    console.error(`Mobile category select error (${value}):`, error);
    try { await interaction.deferUpdate(); } catch (_) {}
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// QUIZ PANEL - Start a Quiz
// ═══════════════════════════════════════════════════════════════════════════════

async function showQuizPanel(interaction) {
  const embed = new EmbedBuilder()
    .setColor(COLORS.QUIZ_PINK)
    .setAuthor({ name: `${EMOJIS.quiz} QUIZ CENTER`, iconURL: interaction.client.user.displayAvatarURL() })
    .setDescription(`
${VISUALS.separators.fancy}

### ${EMOJIS.target} Test Your Knowledge

${VISUALS.separators.thin}

**📋 COMMANDS**

> \`/quiz [topic]\` — Start a 5-question quiz
> \`/quiz [topic] [difficulty]\` — Choose difficulty
> \`/quickquiz\` — Random topic, instant start!
> \`/challenge @user\` — Battle a friend!

${VISUALS.separators.thin}

**💎 XP REWARDS**

> 🟢 Easy = **+15 XP** per correct
> 🟡 Medium = **+25 XP** per correct  
> 🔴 Hard = **+40 XP** per correct
> 💯 Perfect Score = **+100 XP** bonus!

${VISUALS.separators.fancy}
    `)
    .setFooter({ text: `${EMOJIS.hint} Select a topic below to begin!` });

  const topicMenu = new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId('quiz_topic_select_v4')
      .setPlaceholder('🎯 Choose a quiz topic...')
      .addOptions([
        { label: 'Random Mix', description: 'Surprise me with random topics!', value: 'random', emoji: '🎲' },
        { label: 'JavaScript', description: 'Web development fundamentals', value: 'javascript', emoji: EMOJIS.javascript },
        { label: 'Python', description: 'General programming & AI', value: 'python', emoji: EMOJIS.python },
        { label: 'TypeScript', description: 'Typed JavaScript', value: 'typescript', emoji: EMOJIS.typescript },
        { label: 'React', description: 'Frontend framework', value: 'react', emoji: EMOJIS.react },
        { label: 'Node.js', description: 'Backend development', value: 'nodejs', emoji: EMOJIS.node },
        { label: 'HTML & CSS', description: 'Web design basics', value: 'html-css', emoji: EMOJIS.html },
        { label: 'SQL', description: 'Database queries', value: 'sql', emoji: EMOJIS.sql },
        { label: 'Git', description: 'Version control', value: 'git', emoji: EMOJIS.git },
        { label: 'Algorithms', description: 'Problem solving', value: 'algorithms', emoji: EMOJIS.algorithms }
      ])
  );

  const buttons = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('exec_quickquiz')
      .setLabel('Quick Quiz')
      .setEmoji(EMOJIS.lightning)
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId('exec_challenge')
      .setLabel('Challenge Friend')
      .setEmoji(EMOJIS.challenge)
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId('help_action_back')
      .setLabel('Back')
      .setEmoji(EMOJIS.back)
      .setStyle(ButtonStyle.Secondary)
  );

  await safeUpdate(interaction, { embeds: [embed], components: [topicMenu, buttons] });
}

// ═══════════════════════════════════════════════════════════════════════════════
// LEARN PANEL - Start Learning
// ═══════════════════════════════════════════════════════════════════════════════

async function showLearnPanel(interaction) {
  const embed = new EmbedBuilder()
    .setColor(COLORS.LESSON_BLUE)
    .setAuthor({ name: `${EMOJIS.learn} LEARNING CENTER`, iconURL: interaction.client.user.displayAvatarURL() })
    .setDescription(`
${VISUALS.separators.fancy}

### ${EMOJIS.book} AI-Powered Learning

${VISUALS.separators.thin}

**📋 COMMANDS**

> \`/learn [topic]\` — Start an AI lesson
> \`/explain [concept]\` — Get detailed explanations  
> \`/path browse\` — Structured learning paths
> \`/topics\` — Browse all available topics

${VISUALS.separators.thin}

**${EMOJIS.sparkle} WHAT YOU GET**

> ${EMOJIS.correct} Clear, beginner-friendly explanations
> ${EMOJIS.run} Real code examples you can try
> ${EMOJIS.brain} Key concepts highlighted
> ${EMOJIS.target} Practice challenges to test yourself

${VISUALS.separators.fancy}
    `)
    .setFooter({ text: `${EMOJIS.hint} Select a topic below to start learning!` });

  const topicMenu = new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId('learn_topic_select_v4')
      .setPlaceholder('📚 Choose a learning topic...')
      .addOptions([
        { label: 'JavaScript Basics', description: 'Variables, functions, loops', value: 'javascript-basics', emoji: EMOJIS.javascript },
        { label: 'Python Fundamentals', description: 'Core Python concepts', value: 'python-basics', emoji: EMOJIS.python },
        { label: 'Web Development', description: 'HTML, CSS, JS together', value: 'webdev', emoji: EMOJIS.html },
        { label: 'React Essentials', description: 'Components, hooks, state', value: 'react', emoji: EMOJIS.react },
        { label: 'Data Structures', description: 'Arrays, objects, maps', value: 'datastructures', emoji: EMOJIS.datastructures },
        { label: 'APIs & REST', description: 'Working with APIs', value: 'apis', emoji: EMOJIS.api },
        { label: 'Databases', description: 'SQL & NoSQL basics', value: 'databases', emoji: EMOJIS.sql },
        { label: 'Algorithms', description: 'Problem solving', value: 'algorithms', emoji: EMOJIS.algorithms },
        { label: 'Custom Topic', description: 'Ask AI anything!', value: 'custom', emoji: EMOJIS.brain }
      ])
  );

  const buttons = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('exec_explain')
      .setLabel('Explain Concept')
      .setEmoji(EMOJIS.explain)
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId('exec_path')
      .setLabel('Learning Paths')
      .setEmoji('🛤️')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId('help_action_back')
      .setLabel('Back')
      .setEmoji(EMOJIS.back)
      .setStyle(ButtonStyle.Secondary)
  );

  await safeUpdate(interaction, { embeds: [embed], components: [topicMenu, buttons] });
}

// ═══════════════════════════════════════════════════════════════════════════════
// DAILY PANEL - Daily Bonus Info
// ═══════════════════════════════════════════════════════════════════════════════

async function showDailyPanel(interaction) {
  const user = await getOrCreateUser(interaction.user.id, interaction.user.username);
  const streak = user.streak || 0;
  const multiplier = getStreakMultiplier(streak);
  const baseXP = 75;
  const bonusXP = Math.floor(baseXP * multiplier);
  
  const embed = new EmbedBuilder()
    .setColor(COLORS.XP_GOLD)
    .setAuthor({ name: `${EMOJIS.gift} DAILY REWARDS`, iconURL: interaction.client.user.displayAvatarURL() })
    .setDescription(`
${VISUALS.separators.fancy}

### ${EMOJIS.sparkle} Daily Bonus Center

Come back every day to earn bonus XP!

${VISUALS.separators.thin}

**${EMOJIS.streak} YOUR CURRENT STREAK: ${streak} days**
${streak > 0 ? EMOJIS.streak.repeat(Math.min(streak, 7)) : '❄️ Start your streak today!'}

${VISUALS.separators.thin}

**${EMOJIS.gift} STREAK MULTIPLIERS**

> ${EMOJIS.xp} Base Reward: **+${baseXP} XP**
> ${EMOJIS.streak} 3+ days = **1.1x** XP
> ${EMOJIS.streak} 7+ days = **1.25x** XP
> ${EMOJIS.streak} 14+ days = **1.5x** XP
> ${EMOJIS.streak} 30+ days = **2.0x** XP

**Your current bonus: +${bonusXP} XP (${multiplier}x)**

${VISUALS.separators.fancy}
    `)
    .setFooter({ text: `${EMOJIS.clock} Resets at midnight UTC` });

  const buttons = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('exec_daily')
      .setLabel('Claim Now')
      .setEmoji(EMOJIS.gift)
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId('exec_streak')
      .setLabel('View Streak')
      .setEmoji(EMOJIS.streak)
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId('exec_funfact')
      .setLabel('Fun Fact')
      .setEmoji('🎲')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId('help_action_back')
      .setLabel('Back')
      .setEmoji(EMOJIS.back)
      .setStyle(ButtonStyle.Secondary)
  );

  await safeUpdate(interaction, { embeds: [embed], components: [buttons] });
}

// ═══════════════════════════════════════════════════════════════════════════════
// PROFILE PANEL - User Stats
// ═══════════════════════════════════════════════════════════════════════════════

async function showProfilePanel(interaction) {
  const user = await getOrCreateUser(interaction.user.id, interaction.user.username);
  const rank = getRank(user.level || 1);
  const xpNeeded = xpForLevel((user.level || 1) + 1);
  const xpProgress = user.xp || 0;
  const progressPercent = Math.min(Math.round((xpProgress / xpNeeded) * 100), 100);
  
  const accuracy = user.totalQuestions > 0 
    ? Math.round((user.correctAnswers / user.totalQuestions) * 100) 
    : 0;
  
  const embed = new EmbedBuilder()
    .setColor(rank.color)
    .setAuthor({ name: '👤 YOUR PROFILE', iconURL: interaction.client.user.displayAvatarURL() })
    .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
    .setDescription(`
${VISUALS.separators.fancy}

### ${rank.emoji} ${rank.name.toUpperCase()}
### ${EMOJIS.star} Level ${user.level || 1} • ${formatNumber(user.xp || 0)} Total XP

${VISUALS.separators.thin}

**${EMOJIS.progress} PROGRESS TO NEXT LEVEL**

\`${createProgressBar(xpProgress, xpNeeded, 16)}\` **${progressPercent}%**
${EMOJIS.xp} \`${formatNumber(xpProgress)} / ${formatNumber(xpNeeded)} XP\`

${VISUALS.separators.thin}

**${EMOJIS.stats} YOUR STATS**

> ${EMOJIS.streak} **${user.streak || 0}** day streak
> ${EMOJIS.quiz} **${user.quizzesTaken || 0}** quizzes taken
> ${EMOJIS.target} **${accuracy}%** accuracy  
> ${EMOJIS.achievement} **${user.achievements?.length || 0}** achievements

${VISUALS.separators.fancy}
    `)
    .setFooter({ text: `${EMOJIS.lightning} ${BRAND.name} • ${rank.badge}` });

  const buttons = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('exec_profile')
      .setLabel('Full Profile')
      .setEmoji(EMOJIS.stats)
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId('exec_progress')
      .setLabel('Detailed Stats')
      .setEmoji(EMOJIS.progress)
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId('exec_achievements')
      .setLabel('Achievements')
      .setEmoji(EMOJIS.achievement)
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId('help_action_back')
      .setLabel('Back')
      .setEmoji(EMOJIS.back)
      .setStyle(ButtonStyle.Secondary)
  );

  await safeUpdate(interaction, { embeds: [embed], components: [buttons] });
}

// ═══════════════════════════════════════════════════════════════════════════════
// LEADERBOARD PANEL
// ═══════════════════════════════════════════════════════════════════════════════

async function showLeaderboardPanel(interaction) {
  const embed = new EmbedBuilder()
    .setColor(COLORS.XP_GOLD)
    .setAuthor({ name: `${EMOJIS.leaderboard} LEADERBOARD`, iconURL: interaction.client.user.displayAvatarURL() })
    .setDescription(`
${VISUALS.separators.fancy}

### ${EMOJIS.trophy} Compete & Climb Ranks

Compete with learners worldwide!

${VISUALS.separators.thin}

**${EMOJIS.stats} RANKING CRITERIA**

> ${EMOJIS.xp} Total XP earned
> ${EMOJIS.level} Level progression
> ${EMOJIS.streak} Learning streak
> ${EMOJIS.target} Quiz accuracy

${VISUALS.separators.thin}

> ${EMOJIS.rocket} *Complete quizzes & lessons to rise up!*

${VISUALS.separators.fancy}
    `)
    .setFooter({ text: `${EMOJIS.crown} Rise to the top!` });

  const buttons = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('exec_leaderboard')
      .setLabel('Global Rankings')
      .setEmoji('🌍')
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId('exec_weekly')
      .setLabel('Weekly Challenge')
      .setEmoji(EMOJIS.trophy)
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId('help_action_back')
      .setLabel('Back')
      .setEmoji(EMOJIS.back)
      .setStyle(ButtonStyle.Secondary)
  );

  await safeUpdate(interaction, { embeds: [embed], components: [buttons] });
}

// ═══════════════════════════════════════════════════════════════════════════════
// ACHIEVEMENTS PANEL
// ═══════════════════════════════════════════════════════════════════════════════

async function showAchievementsPanel(interaction) {
  const user = await getOrCreateUser(interaction.user.id, interaction.user.username);
  const unlockedCount = user.achievements?.length || 0;
  const totalCount = 30; // Total achievements available
  
  const embed = new EmbedBuilder()
    .setColor(COLORS.ACHIEVEMENT)
    .setAuthor({ name: `${EMOJIS.achievement} ACHIEVEMENTS`, iconURL: interaction.client.user.displayAvatarURL() })
    .setDescription(`
${VISUALS.separators.fancy}

### ${EMOJIS.trophy} Collect Badges & Earn XP!

**Your Progress: ${unlockedCount}/${totalCount} unlocked**
\`${createProgressBar(unlockedCount, totalCount, 14)}\`

${VISUALS.separators.thin}

**${EMOJIS.medal} ACHIEVEMENT CATEGORIES**

> ${EMOJIS.learn} **Learning** — Complete lessons
> ${EMOJIS.quiz} **Quizzes** — Ace your tests
> ${EMOJIS.streak} **Streaks** — Stay consistent
> ${EMOJIS.level} **Levels** — Level up
> ${EMOJIS.challenge} **Social** — Compete with friends

${VISUALS.separators.thin}

**${EMOJIS.star} RARE BADGES**

> 💯 **Perfectionist** — 10 perfect quiz scores
> 👑 **Legend** — Reach Level 50
> ⚡ **Speedrunner** — Quiz in under 30s

${VISUALS.separators.fancy}
    `)
    .setFooter({ text: `${EMOJIS.sparkle} Each achievement grants bonus XP!` });

  const buttons = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('exec_achievements')
      .setLabel('My Achievements')
      .setEmoji(EMOJIS.medal)
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId('exec_profile')
      .setLabel('My Profile')
      .setEmoji('👤')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId('help_action_back')
      .setLabel('Back')
      .setEmoji(EMOJIS.back)
      .setStyle(ButtonStyle.Secondary)
  );

  await safeUpdate(interaction, { embeds: [embed], components: [buttons] });
}

// ═══════════════════════════════════════════════════════════════════════════════
// STREAK PANEL
// ═══════════════════════════════════════════════════════════════════════════════

async function showStreakPanel(interaction) {
  const user = await getOrCreateUser(interaction.user.id, interaction.user.username);
  const streak = user.streak || 0;
  const longestStreak = user.longestStreak || streak;
  const multiplier = getStreakMultiplier(streak);
  const fires = streak > 0 ? EMOJIS.streak.repeat(Math.min(streak, 7)) : '❄️';
  
  // Next milestone
  const milestones = [3, 7, 14, 30, 100];
  const nextMilestone = milestones.find(m => m > streak) || 'MAX';
  
  const embed = new EmbedBuilder()
    .setColor(COLORS.STREAK_FIRE)
    .setAuthor({ name: `${EMOJIS.streak} STREAK STATUS`, iconURL: interaction.client.user.displayAvatarURL() })
    .setDescription(`
${VISUALS.separators.fancy}

### ${fires} Keep the Fire Burning!

**Current Streak: ${streak} day${streak !== 1 ? 's' : ''}**
**Longest Streak: ${longestStreak} days** ${EMOJIS.trophy}
**Current Multiplier: ${multiplier}x XP** ${EMOJIS.xp}

${VISUALS.separators.thin}

**${EMOJIS.gem} STREAK MILESTONES**

> ${streak >= 3 ? EMOJIS.correct : EMOJIS.incomplete} 3 days = **1.1x** XP
> ${streak >= 7 ? EMOJIS.correct : EMOJIS.incomplete} 7 days = **1.25x** XP  
> ${streak >= 14 ? EMOJIS.correct : EMOJIS.incomplete} 14 days = **1.5x** XP
> ${streak >= 30 ? EMOJIS.correct : EMOJIS.incomplete} 30 days = **2.0x** XP

${nextMilestone !== 'MAX' ? `**Next milestone: ${nextMilestone} days** (${nextMilestone - streak} to go!)` : '**🎉 MAX STREAK ACHIEVED!**'}

${VISUALS.separators.thin}

> ${EMOJIS.tip} *Complete any activity daily to maintain your streak!*

${VISUALS.separators.fancy}
    `)
    .setFooter({ text: `${EMOJIS.lightning} Consistency is key!` });

  const buttons = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('exec_streak')
      .setLabel('Full Streak Info')
      .setEmoji(EMOJIS.streak)
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId('exec_daily')
      .setLabel('Claim Daily')
      .setEmoji(EMOJIS.gift)
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId('help_action_back')
      .setLabel('Back')
      .setEmoji(EMOJIS.back)
      .setStyle(ButtonStyle.Secondary)
  );

  await safeUpdate(interaction, { embeds: [embed], components: [buttons] });
}

// ═══════════════════════════════════════════════════════════════════════════════
// TOPICS PANEL
// ═══════════════════════════════════════════════════════════════════════════════

async function showTopicsPanel(interaction) {
  const embed = new EmbedBuilder()
    .setColor(COLORS.LESSON_BLUE)
    .setAuthor({ name: `${EMOJIS.book} AVAILABLE TOPICS`, iconURL: interaction.client.user.displayAvatarURL() })
    .setDescription(`
${VISUALS.separators.fancy}

### ${EMOJIS.learn} Master These Topics

${VISUALS.separators.thin}

**${EMOJIS.run} PROGRAMMING LANGUAGES**

> ${EMOJIS.javascript} JavaScript • ${EMOJIS.python} Python • ${EMOJIS.typescript} TypeScript
> ☕ Java • ⚙️ C++ • 🦀 Rust • 🔵 Go

${VISUALS.separators.thin}

**${EMOJIS.html} WEB DEVELOPMENT**

> ${EMOJIS.react} React • 💚 Vue.js • 🅰️ Angular
> ${EMOJIS.node} Node.js • ${EMOJIS.css} CSS • 💨 Tailwind

${VISUALS.separators.thin}

**${EMOJIS.sql} BACKEND & DATA**

> ${EMOJIS.sql} SQL • 🍃 MongoDB • 🔥 Firebase
> ${EMOJIS.api} REST APIs • 🔐 Authentication

${VISUALS.separators.thin}

> ${EMOJIS.brain} *Or ask about any topic — AI can teach it!*

${VISUALS.separators.fancy}
    `)
    .setFooter({ text: `${EMOJIS.rocket} Learn anything!` });

  const buttons = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('exec_topics')
      .setLabel('Full Topic List')
      .setEmoji('📋')
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId('help_action_learn')
      .setLabel('Start Learning')
      .setEmoji(EMOJIS.learn)
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId('help_action_quiz')
      .setLabel('Take Quiz')
      .setEmoji(EMOJIS.quiz)
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId('help_action_back')
      .setLabel('Back')
      .setEmoji(EMOJIS.back)
      .setStyle(ButtonStyle.Secondary)
  );

  await safeUpdate(interaction, { embeds: [embed], components: [buttons] });
}

// ═══════════════════════════════════════════════════════════════════════════════
// BACK TO MAIN MENU
// ═══════════════════════════════════════════════════════════════════════════════

async function showMainMenu(interaction) {
  try {
    const user = await getOrCreateUser(interaction.user.id, interaction.user.username);
    
    // Redirect to the appropriate dashboard
    const fakeInteraction = {
      ...interaction,
      reply: interaction.update.bind(interaction)
    };
    
    if (isNewUser(user)) {
      await showNewUserWelcome(fakeInteraction, user);
    } else {
      await showReturningUserDashboard(fakeInteraction, user);
    }
  } catch (error) {
    console.error('Show main menu error:', error);
    // Must acknowledge the interaction to prevent "This interaction failed"
    try {
      await interaction.deferUpdate();
    } catch (e) {
      // Fallback to reply if update fails
      try {
        await interaction.reply({ content: '❌ Failed to load menu. Try `/help` again!', ephemeral: true });
      } catch (_) {}
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// CATEGORY SELECT HANDLER
// ═══════════════════════════════════════════════════════════════════════════════

export async function handleCategorySelect(interaction, category) {
  try {
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
        .setEmoji(EMOJIS.quiz)
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId('help_action_learn')
        .setLabel('Learn')
        .setEmoji(EMOJIS.learn)
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('help_action_back')
        .setLabel('Main Menu')
        .setEmoji(EMOJIS.home)
        .setStyle(ButtonStyle.Secondary)
    );

    await safeUpdate(interaction, { embeds: [embed], components: [categoryMenu, buttons] });
  } catch (error) {
    console.error('Category select error:', error);
    try {
      await interaction.reply({ content: '❌ Failed to load category. Try `/help` again!', ephemeral: true });
    } catch (e) {
      try { await interaction.deferUpdate(); } catch (_) {}
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// CATEGORY EMBED BUILDERS
// ═══════════════════════════════════════════════════════════════════════════════

function createLearningCategoryEmbed() {
  return new EmbedBuilder()
    .setColor(COLORS.LESSON_BLUE)
    .setTitle(`${EMOJIS.learn} Learning Commands`)
    .setDescription(`
${VISUALS.separators.fancy}

### Master Any Programming Topic!

${VISUALS.separators.thin}
    `)
    .addFields(
      { 
        name: '\`/learn [topic]\`', 
        value: `${EMOJIS.learn} Get an AI-generated lesson on any topic\n*Example: \`/learn JavaScript async/await\`*`, 
        inline: false 
      },
      { 
        name: '\`/explain [concept]\`', 
        value: `${EMOJIS.explain} Get detailed explanation with examples\n*Example: \`/explain recursion\`*`, 
        inline: false 
      },
      { 
        name: '\`/topics\`', 
        value: `${EMOJIS.book} Browse all available learning topics`, 
        inline: false 
      },
      { 
        name: '\`/path [subject]\`', 
        value: `🛤️ Follow structured learning paths`, 
        inline: false 
      },
      { 
        name: '\`/funfact [topic]\`', 
        value: `🎲 Learn fun facts about programming`, 
        inline: false 
      }
    )
    .setFooter({ text: `${EMOJIS.brain} ${BRAND.name} • AI-Powered Learning` });
}

function createQuizzesCategoryEmbed() {
  return new EmbedBuilder()
    .setColor(COLORS.QUIZ_PINK)
    .setTitle(`${EMOJIS.quiz} Quiz Commands`)
    .setDescription(`
${VISUALS.separators.fancy}

### Test Your Knowledge & Earn XP!

${VISUALS.separators.thin}
    `)
    .addFields(
      { 
        name: '\`/quiz [topic]\`', 
        value: `${EMOJIS.target} Take an AI-generated quiz\n*Options: questions count, difficulty*`, 
        inline: false 
      },
      { 
        name: '\`/quickquiz\`', 
        value: `${EMOJIS.lightning} Instant one-question challenge`, 
        inline: false 
      },
      { 
        name: '\`/challenge @user\`', 
        value: `${EMOJIS.challenge} Challenge a friend to quiz battle`, 
        inline: false 
      },
      { 
        name: '\`/studyparty start\`', 
        value: `${EMOJIS.party} Start a group study session`, 
        inline: false 
      },
      { 
        name: '\`/weekly\`', 
        value: `${EMOJIS.trophy} View weekly server challenges`, 
        inline: false 
      }
    )
    .setFooter({ text: `${EMOJIS.xp} ${BRAND.name} • Earn XP through quizzes!` });
}

function createProgressCategoryEmbed() {
  return new EmbedBuilder()
    .setColor(COLORS.XP_GOLD)
    .setTitle(`${EMOJIS.stats} Progress Commands`)
    .setDescription(`
${VISUALS.separators.fancy}

### Track Your Learning Journey!

${VISUALS.separators.thin}
    `)
    .addFields(
      { 
        name: '\`/profile\`', 
        value: `👤 View your complete profile and rank`, 
        inline: false 
      },
      { 
        name: '\`/progress\`', 
        value: `${EMOJIS.progress} Detailed statistics and history`, 
        inline: false 
      },
      { 
        name: '\`/achievements\`', 
        value: `${EMOJIS.medal} View and track achievements`, 
        inline: false 
      },
      { 
        name: '\`/stats\`', 
        value: `${EMOJIS.stats} Global platform statistics`, 
        inline: false 
      }
    )
    .setFooter({ text: `${EMOJIS.level} ${BRAND.name} • Level up your skills!` });
}

function createSocialCategoryEmbed() {
  return new EmbedBuilder()
    .setColor(COLORS.PRIMARY)
    .setTitle(`👥 Social Commands`)
    .setDescription(`
${VISUALS.separators.fancy}

### Learn Together & Compete!

${VISUALS.separators.thin}
    `)
    .addFields(
      { 
        name: '\`/leaderboard\`', 
        value: `${EMOJIS.leaderboard} View global rankings`, 
        inline: false 
      },
      { 
        name: '\`/challenge @user\`', 
        value: `${EMOJIS.challenge} 1v1 quiz battle`, 
        inline: false 
      },
      { 
        name: '\`/studyparty\`', 
        value: `${EMOJIS.party} Group study sessions with XP bonus`, 
        inline: false 
      },
      { 
        name: '\`/invite\`', 
        value: `${EMOJIS.invite} Add ${BRAND.name} to other servers`, 
        inline: false 
      },
      { 
        name: '\`/share\`', 
        value: `${EMOJIS.share} Share your achievements`, 
        inline: false 
      },
      { 
        name: '\`/referral\`', 
        value: `${EMOJIS.gift} Invite friends and earn rewards`, 
        inline: false 
      }
    )
    .setFooter({ text: `${EMOJIS.party} ${BRAND.name} • Better together!` });
}

function createDailyCategoryEmbed() {
  return new EmbedBuilder()
    .setColor(COLORS.STREAK_FIRE)
    .setTitle(`${EMOJIS.streak} Daily & Streak Commands`)
    .setDescription(`
${VISUALS.separators.fancy}

### Stay Consistent & Earn Bonus XP!

${VISUALS.separators.thin}
    `)
    .addFields(
      { 
        name: '\`/daily\`', 
        value: `${EMOJIS.gift} Claim daily XP bonus + AI tips`, 
        inline: false 
      },
      { 
        name: '\`/streak\`', 
        value: `${EMOJIS.streak} Check your learning streak`, 
        inline: false 
      },
      { 
        name: '\`/weekly\`', 
        value: `${EMOJIS.trophy} Weekly challenges and rewards`, 
        inline: false 
      }
    )
    .addFields({
      name: `${EMOJIS.calendar} Streak Bonuses`,
      value: 
        `\`3+ days\` → 1.1x XP\n` +
        `\`7+ days\` → 1.25x XP\n` +
        `\`14+ days\` → 1.5x XP\n` +
        `\`30+ days\` → 2.0x XP`,
      inline: false
    })
    .setFooter({ text: `${EMOJIS.streak} ${BRAND.name} • Consistency wins!` });
}

function createAllCommandsEmbed() {
  return new EmbedBuilder()
    .setColor(COLORS.PRIMARY)
    .setTitle(`📋 All Commands`)
    .setDescription(`
${VISUALS.separators.fancy}

### Complete Command Reference

${VISUALS.separators.thin}
    `)
    .addFields(
      { 
        name: `${EMOJIS.learn} Learning`, 
        value: '\`/learn\` \`/explain\` \`/topics\` \`/path\` \`/funfact\`', 
        inline: true 
      },
      { 
        name: `${EMOJIS.quiz} Quizzes`, 
        value: '\`/quiz\` \`/quickquiz\` \`/challenge\`', 
        inline: true 
      },
      { 
        name: `${EMOJIS.stats} Progress`, 
        value: '\`/profile\` \`/progress\` \`/achievements\` \`/stats\`', 
        inline: true 
      },
      { 
        name: `${EMOJIS.streak} Daily`, 
        value: '\`/daily\` \`/streak\` \`/weekly\`', 
        inline: true 
      },
      { 
        name: '👥 Social', 
        value: '\`/leaderboard\` \`/studyparty\` \`/invite\` \`/share\` \`/referral\`', 
        inline: true 
      },
      { 
        name: '⚙️ Utility', 
        value: '\`/help\` \`/ping\` \`/feedback\` \`/setup\` \`/run\`', 
        inline: true 
      }
    )
    .setFooter({ text: `${EMOJIS.brain} ${BRAND.name} • ${BRAND.tagline}` });
}
