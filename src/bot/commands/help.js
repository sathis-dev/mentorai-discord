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

// Helper to pad text to exact width (34 chars for inner box content)
const pad = (text, width = 34) => (String(text) + ' '.repeat(width)).slice(0, width);
// Pad with 1 emoji prefix (emoji takes 2 visual chars, so text gets 31 chars + 1 space)
const pad1 = (emoji, text) => emoji + ' ' + (String(text) + ' '.repeat(31)).slice(0, 31);
// Pad with 2 emoji prefix (2 emojis = 4 visual chars, text gets 28 chars + 2 spaces)  
const pad2 = (e1, e2, text) => e1 + ' ' + e2 + ' ' + (String(text) + ' '.repeat(28)).slice(0, 28);

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
    
    // Calculate XP progress
    const currentXP = (user.xp || 0) % 1000;
    const xpNeeded = 1000;
    const xpPercent = Math.floor((currentXP / xpNeeded) * 100);
    const progressLength = 20;
    const filledBars = Math.floor((currentXP / xpNeeded) * progressLength);
    const emptyBars = progressLength - filledBars;
    const progressBar = '█'.repeat(filledBars) + '░'.repeat(emptyBars);
    
    // Stats
    const streak = user.streak || 0;
    const lessonsCompleted = user.lessonsCompleted || 0;
    const quizzesTaken = user.quizzesTaken || 0;
    const achievements = user.achievements?.length || 0;
    
    // Create premium RPG-style embed
    const mainEmbed = new EmbedBuilder()
      .setColor(COLORS.BRAND_PRIMARY)
      .setAuthor({ 
        name: '✦ MENTOR AI ✦', 
        iconURL: interaction.client.user.displayAvatarURL() 
      })
      .setThumbnail(interaction.client.user.displayAvatarURL({ dynamic: true, size: 256 }))
      .setDescription(
`\`\`\`
============================================
          M E N T O R   A I
       Next-Gen Learning Platform
============================================
\`\`\`

# 👋 Welcome, ${interaction.user.username}!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

### 🎮 PLAYER PROFILE

> 🏆 **${tier.title.toUpperCase()}** • Level **${user.level || 1}**
> ✨ Total XP: **${(user.xp || 0).toLocaleString()}**

\`${progressBar}\` **${xpPercent}%**
*${currentXP}/1000 XP to next level*

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

### 📊 STATISTICS

> 🔥 **${streak}** day streak
> 📚 **${lessonsCompleted}** lessons completed
> ✅ **${quizzesTaken}** quizzes passed
> 🏆 **${achievements}** badges earned

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

### ⚡ GAME MODES

> 📖 **Lessons** — AI-powered learning
> 🎯 **Quizzes** — Test your knowledge
> ⚔️ **Battles** — 1v1 challenges
> 🏆 **Rankings** — Climb leaderboards
> 🎖️ **Badges** — Unlock achievements

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

\`\`\`
============================================
      🚀 SELECT AN ACTION BELOW 🚀
============================================
\`\`\``
      )
      .setFooter({ 
        text: `⚡ MentorAI • ${interaction.client.guilds.cache.size} servers • ${interaction.client.ws.ping}ms`,
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

    // Primary action buttons - Fixed colors per design spec
    const primaryButtons = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('help_action_quiz')
        .setLabel('Quick Quiz')
        .setEmoji('🎯')
        .setStyle(ButtonStyle.Primary),  // Blue
      new ButtonBuilder()
        .setCustomId('help_action_learn')
        .setLabel('Start Lesson')
        .setEmoji('📚')
        .setStyle(ButtonStyle.Success),  // Green
      new ButtonBuilder()
        .setCustomId('help_action_daily')
        .setLabel('Daily Bonus')
        .setEmoji('🎁')
        .setStyle(ButtonStyle.Danger),   // Red - catches attention!
      new ButtonBuilder()
        .setCustomId('help_action_profile')
        .setLabel('My Profile')
        .setEmoji('👤')
        .setStyle(ButtonStyle.Secondary) // Gray
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
    .setAuthor({ name: '🎯 QUIZ COMMANDS', iconURL: interaction.client.user.displayAvatarURL() })
    .setDescription(
`### 🎮 TEST YOUR KNOWLEDGE

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**📋 COMMANDS**

> **/quiz [topic]** — Start a 5-question quiz
> **/quiz [topic] [difficulty]** — Choose: easy, medium, hard
> **/quickquiz** — Random topic, instant start!
> **/challenge @user** — Battle a friend!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**💎 XP REWARDS**

> 🟢 Easy = **+20 XP** per correct
> 🟡 Medium = **+30 XP** per correct
> 🔴 Hard = **+45 XP** per correct
    `)
    .setFooter({ text: '⚡ MentorAI • Select a topic below' });

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
    .setAuthor({ name: '📖 LEARNING COMMANDS', iconURL: interaction.client.user.displayAvatarURL() })
    .setDescription(
`### 📚 AI-POWERED LEARNING

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**📋 COMMANDS**

> **/learn [topic]** — Start an AI lesson
> **/explain [concept]** — Get explanations
> **/path browse** — Learning paths
> **/topics** — See all topics

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**✨ WHAT YOU GET**

> ✅ Clear explanations
> ✅ Code examples
> ✅ Key concepts
> ✅ Practice challenges
    `)
    .setFooter({ text: '⚡ MentorAI • Select a topic to begin' });

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
    .setAuthor({ name: '🎁 DAILY REWARDS', iconURL: interaction.client.user.displayAvatarURL() })
    .setDescription(
`### ✨ DAILY BONUS CENTER

Come back every day to earn bonus XP!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**🎁 STREAK REWARDS**

> 💫 Base Reward: **+75 XP**
> 🔥 3+ days = **1.25x** XP
> 🔥 7+ days = **1.5x** XP
> 🔥 14+ days = **1.75x** XP
> 🔥 30+ days = **2x** XP

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

> ✨ *Plus: AI-powered daily tips & fun facts!*
    `)
    .setFooter({ text: '⚡ MentorAI • Resets at midnight UTC' });

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
  
  // Calculate XP progress
  const currentXP = (user.xp || 0) % 1000;
  const xpNeeded = 1000;
  const progressLength = 16;
  const filledBars = Math.floor((currentXP / xpNeeded) * progressLength);
  const emptyBars = progressLength - filledBars;
  const progressBar = '█'.repeat(filledBars) + '░'.repeat(emptyBars);
  
  const xpPercent = Math.floor((currentXP / xpNeeded) * 100);
  
  const embed = new EmbedBuilder()
    .setColor(tier.color)
    .setAuthor({ name: '👤 YOUR PROFILE', iconURL: interaction.client.user.displayAvatarURL() })
    .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
    .setDescription(
`### 🏆 ${tier.title.toUpperCase()}
### ⭐ Level ${user.level || 1} • ${(user.xp || 0).toLocaleString()} Total XP

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**📈 PROGRESS TO NEXT LEVEL**

\`${progressBar}\` **${xpPercent}%**
*${currentXP}/1000 XP to next level*

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**📊 YOUR STATS**

> 🔥 **${user.streak || 0}** day streak
> 📝 **${user.quizzesTaken || 0}** quizzes taken
> 🎯 **${user.totalQuestions > 0 ? Math.round((user.correctAnswers / user.totalQuestions) * 100) : 0}%** accuracy
> 🏆 **${user.achievements?.length || 0}** achievements
    `)
    .setFooter({ text: `⚡ MentorAI • ${tier.badge || tier.title}` });

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
    .setAuthor({ name: '🏆 LEADERBOARD', iconURL: interaction.client.user.displayAvatarURL() })
    .setDescription(
`### 🏅 COMPETE & CLIMB RANKS

Compete with learners worldwide!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**📊 RANKING CRITERIA**

> 🏆 Total XP earned
> ⬆️ Level progression
> 🔥 Learning streak
> 🎯 Quiz accuracy

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

> 🚀 *Complete quizzes & lessons to rise up!*
    `)
    .setFooter({ text: '⚡ MentorAI • Rise to the top!' });

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
    .setAuthor({ name: '🏅 ACHIEVEMENTS', iconURL: interaction.client.user.displayAvatarURL() })
    .setDescription(
`### 🏆 UNLOCK ACHIEVEMENTS

Collect badges and earn bonus XP!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**🏅 AVAILABLE BADGES**

> 🎯 **First Steps** — First quiz
> 🔥 **On Fire** — 7-day streak
> 🎯 **Sharpshooter** — 100% quiz
> 📖 **Bookworm** — 10 lessons
> 🏆 **Champion** — Level 10
> 💎 **Diamond Mind** — Level 30

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

> ✨ *Each achievement grants bonus XP!*
    `)
    .setFooter({ text: '⚡ MentorAI • Collect them all!' });

  const buttons = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('exec_achievements')
      .setLabel('🏅 My Achievements')
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
    .setAuthor({ name: '🔥 STREAK STATUS', iconURL: interaction.client.user.displayAvatarURL() })
    .setDescription(
`### ${fires} KEEP THE FIRE BURNING

**Current Streak: ${streak} day${streak !== 1 ? 's' : ''}**

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**💎 STREAK BONUSES**

> 🔥 3 days = **+25%** XP
> 🔥 7 days = **+50%** XP
> 🔥 14 days = **+75%** XP
> 🔥 30 days = **+100%** XP

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

> 🎯 *Complete any activity daily to maintain!*
    `)
    .setFooter({ text: '⚡ MentorAI • Consistency is key!' });

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
    .setAuthor({ name: '📖 AVAILABLE TOPICS', iconURL: interaction.client.user.displayAvatarURL() })
    .setDescription(
`### 📚 MASTER THESE TOPICS

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**💻 PROGRAMMING LANGUAGES**

> 🟨 JavaScript • 🐍 Python • 🔷 TypeScript
> ☕ Java • ⚙️ C++ • 🦀 Rust • 🔵 Go

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**🌐 WEB DEVELOPMENT**

> ⚛️ React • 💚 Vue.js • 🅰️ Angular
> 🟢 Node.js • 🎨 CSS • 💨 Tailwind

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**🗄️ BACKEND & DATA**

> 📊 SQL • 🍃 MongoDB • 🔥 Firebase
> 🔗 REST APIs • 🔐 Authentication

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

> 🤖 *Or ask about any topic — AI can teach it!*
    `)
    .setFooter({ text: '⚡ MentorAI • Learn anything!' });

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
    
    // Calculate XP progress
    const currentXP = (user.xp || 0) % 1000;
    const xpNeeded = 1000;
    const progressLength = 20;
    const filledBars = Math.floor((currentXP / xpNeeded) * progressLength);
    const emptyBars = progressLength - filledBars;
    const progressBar = '█'.repeat(filledBars) + '░'.repeat(emptyBars);
    
    // Stats
    const streak = user.streak || 0;
    const lessonsCompleted = user.lessonsCompleted || 0;
    const quizzesTaken = user.quizzesTaken || 0;
    const achievements = user.achievements?.length || 0;
    
    const xpPercent = Math.floor((currentXP / xpNeeded) * 100);
    
    const mainEmbed = new EmbedBuilder()
      .setColor(COLORS.BRAND_PRIMARY)
      .setAuthor({ 
        name: '✦ MENTOR AI ✦', 
        iconURL: interaction.client.user.displayAvatarURL() 
      })
      .setThumbnail(interaction.client.user.displayAvatarURL({ dynamic: true, size: 256 }))
      .setDescription(
`\`\`\`
============================================
          M E N T O R   A I
       Next-Gen Learning Platform
============================================
\`\`\`

# 👋 Welcome, ${interaction.user.username}!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

### 🎮 PLAYER PROFILE

> 🏆 **${tier.title.toUpperCase()}** • Level **${user.level || 1}**
> ✨ Total XP: **${(user.xp || 0).toLocaleString()}**

\`${progressBar}\` **${xpPercent}%**
*${currentXP}/1000 XP to next level*

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

### 📊 STATISTICS

> 🔥 **${streak}** day streak
> 📚 **${lessonsCompleted}** lessons completed
> ✅ **${quizzesTaken}** quizzes passed
> 🏆 **${achievements}** badges earned

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

### ⚡ GAME MODES

> 📖 **Lessons** — AI-powered learning
> 🎯 **Quizzes** — Test your knowledge
> ⚔️ **Battles** — 1v1 challenges
> 🏆 **Rankings** — Climb leaderboards
> 🎖️ **Badges** — Unlock achievements

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

\`\`\`
============================================
      🚀 SELECT AN ACTION BELOW 🚀
============================================
\`\`\``
      )
      .setFooter({ 
        text: `⚡ MentorAI • ${interaction.client.guilds.cache.size} servers • ${interaction.client.ws.ping}ms`,
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
