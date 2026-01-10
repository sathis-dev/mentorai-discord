import { 
  EmbedBuilder, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle,
  StringSelectMenuBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle
} from 'discord.js';
import { User } from '../database/models/User.js';
import { HELP_COLORS, HELP_CATEGORIES, QUICK_ACTIONS } from '../config/helpConfig.js';
import {
  getRandomTip,
  formatCommandList,
  createProgressBar,
  formatXP,
  getRankEmoji,
  getRankName,
  getStreakEmoji,
  getStreakMultiplier,
  getCommandByName,
  getAllCategories,
  getCommandCount,
  getNewCommands,
  getPopularCommands,
  searchCommands,
  calculateXPRequired,
  calculateAccuracy
} from '../utils/helpUtils.js';
import { RecommendationEngine } from '../core/recommendationEngine.js';
import { helpStateManager } from './HelpStateManager.js';
import { searchIntelligence } from '../services/searchIntelligence.js';
import { TierSystem } from '../core/tierSystem.js';

// ═══════════════════════════════════════════════════════════════════
// MAIN HUB VIEW
// ═══════════════════════════════════════════════════════════════════

export async function showMainHub(interaction, user) {
  const embed = buildMainHubEmbed(interaction, user);
  const components = buildMainHubComponents(user, interaction.user);

  const replyOptions = {
    embeds: [embed],
    components
  };

  if (interaction.replied || interaction.deferred) {
    await interaction.editReply(replyOptions);
  } else if (interaction.isButton() || interaction.isStringSelectMenu()) {
    await interaction.update(replyOptions);
  } else {
    await interaction.reply(replyOptions);
  }
}

function buildMainHubEmbed(interaction, user) {
  const level = user?.level || 1;
  const xp = user?.xp || 0;
  const xpRequired = calculateXPRequired(level);
  const streak = user?.streak || 0;
  const lessonsCompleted = user?.completedLessons?.length || 0;
  const quizzesTaken = user?.quizzesTaken || 0;
  const accuracy = calculateAccuracy(user?.correctAnswers, user?.totalQuestions);
  const achievements = user?.achievements?.length || 0;
  const prestige = user?.prestige?.level || 0;

  const rankEmoji = getRankEmoji(level);
  const rankName = getRankName(level);
  const streakEmoji = getStreakEmoji(streak);
  const multiplier = getStreakMultiplier(streak);

  // AI-Powered personalized suggestion from RecommendationEngine
  const suggestion = RecommendationEngine.getSuggestion(user);
  const mentorGreeting = RecommendationEngine.generateMentorGreeting(user);
  const tip = getRandomTip();
  
  // Calculate total XP multiplier for display
  const prestigeMultiplier = user?.prestige?.bonusMultiplier || 1.0;
  const totalMultiplier = (multiplier * prestigeMultiplier).toFixed(2);

  const newCommands = getNewCommands().slice(0, 3);
  const newFeaturesText = newCommands.length > 0
    ? newCommands.map(c => `${c.categoryEmoji} \`/${c.name}\``).join(' • ')
    : 'All caught up!';

  const embed = new EmbedBuilder()
    .setColor(HELP_COLORS.PRIMARY)
    .setAuthor({
      name: '🎓 MentorAI Command Center',
      iconURL: interaction.client.user.displayAvatarURL()
    })
    .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true, size: 128 }))
    .setDescription(`
## 👋 ${mentorGreeting}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${rankEmoji} **${rankName}** • Level ${level}${prestige > 0 ? ` • ⭐ P${prestige}` : ''}
${createProgressBar(xp, xpRequired, 12)}
✨ ${formatXP(xp, xpRequired)} XP to Level ${level + 1}${totalMultiplier > 1 ? ` • 💫 ${totalMultiplier}x XP Bonus` : ''}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

### 📊 Your Stats
${streakEmoji} **${streak}** day streak ${multiplier > 1 ? `(${multiplier}x)` : ''}${prestigeMultiplier > 1 ? ` • ⭐ P${prestige} (${prestigeMultiplier}x)` : ''}
📖 **${lessonsCompleted}** lessons • 🎯 **${quizzesTaken}** quizzes • **${accuracy}%** accuracy
🏆 **${achievements}** achievements unlocked

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

### ⚡ AI-Powered Suggestion
${suggestion.emoji} **${suggestion.text}**
└─ *${suggestion.reason || 'Personalized for you'}* — \`${suggestion.command}\`

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

### 🆕 New Features
${newFeaturesText}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${tip}
    `)
    .setFooter({ 
      text: `MentorAI • ${getCommandCount()} commands • Use the menu below to explore`,
      iconURL: interaction.client.user.displayAvatarURL()
    })
    .setTimestamp();

  return embed;
}

function buildMainHubComponents(user, discordUser) {
  const categoryOptions = getAllCategories().map(cat => ({
    label: cat.name,
    description: cat.description.slice(0, 50),
    value: cat.id,
    emoji: cat.emoji
  }));

  const categorySelect = new StringSelectMenuBuilder()
    .setCustomId('help_category_select')
    .setPlaceholder('📁 Explore command categories...')
    .addOptions(categoryOptions);

  const navRow = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('help_search')
        .setLabel('Search')
        .setEmoji('🔍')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('help_ask_ai')
        .setLabel('Ask AI')
        .setEmoji('🧠')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('help_new')
        .setLabel('New')
        .setEmoji('🆕')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('help_popular')
        .setLabel('Popular')
        .setEmoji('🔥')
        .setStyle(ButtonStyle.Secondary)
    );

  const quickRow1 = new ActionRowBuilder()
    .addComponents(
      QUICK_ACTIONS.row1.map(action =>
        new ButtonBuilder()
          .setCustomId(action.id)
          .setLabel(action.label)
          .setEmoji(action.emoji)
          .setStyle(action.style)
      )
    );

  const quickRow2 = new ActionRowBuilder()
    .addComponents(
      QUICK_ACTIONS.row2.map(action =>
        new ButtonBuilder()
          .setCustomId(action.id)
          .setLabel(action.label)
          .setEmoji(action.emoji)
          .setStyle(action.style)
      )
    );

  // Build website URL with FULL user data for profile sync
  const accuracy = user.totalQuestions > 0 
    ? Math.round((user.correctAnswers / user.totalQuestions) * 100) 
    : 0;
  
  const joinedDate = user.createdAt 
    ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    : 'Jan 2026';

  const websiteParams = new URLSearchParams({
    user: discordUser.id,
    avatar: discordUser.avatar || '',
    name: discordUser.username,
    xp: (user.xp || 0).toString(),
    level: (user.level || 1).toString(),
    streak: (user.streak || 0).toString(),
    quizzes: (user.quizzesTaken || 0).toString(),
    accuracy: accuracy.toString(),
    lessons: (user.completedLessons?.length || 0).toString(),
    achievements: (user.achievements?.length || 0).toString(),
    prestige: (user.prestige?.level || 0).toString(),
    joined: encodeURIComponent(joinedDate)
  });
  const websiteURL = `https://mentorai.up.railway.app/?${websiteParams.toString()}`;

  const linksRow = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setLabel('Website')
        .setEmoji('🌐')
        .setStyle(ButtonStyle.Link)
        .setURL(websiteURL),
      new ButtonBuilder()
        .setLabel('Community')
        .setEmoji('💬')
        .setStyle(ButtonStyle.Link)
        .setURL('https://discord.gg/eEbnkvKUqe'),
      new ButtonBuilder()
        .setCustomId('help_feedback')
        .setLabel('Feedback')
        .setEmoji('💡')
        .setStyle(ButtonStyle.Success)
    );

  return [
    new ActionRowBuilder().addComponents(categorySelect),
    navRow,
    quickRow1,
    quickRow2,
    linksRow
  ];
}

// ═══════════════════════════════════════════════════════════════════
// CATEGORY VIEW
// ═══════════════════════════════════════════════════════════════════

export async function showCategoryView(interaction, categoryId, user) {
  const category = HELP_CATEGORIES[categoryId];
  if (!category) {
    return interaction.reply({ content: '❌ Category not found!', ephemeral: true });
  }

  // Update state manager
  helpStateManager.setState(interaction.user.id, { 
    currentView: 'category', 
    categoryId 
  });

  // Atomic state verification
  const verifiedUser = await helpStateManager.verifyUserState(interaction.user.id) || user;

  // Build category-specific enhanced content
  let enhancedContent = '';
  
  // ═══════════════════════════════════════════════════════════════════
  // 🧠 RAG-DRIVEN LEARNING RECOMMENDATIONS (Learning Category)
  // ═══════════════════════════════════════════════════════════════════
  if (categoryId === 'learning') {
    const recommendations = await helpStateManager.getLearningRecommendations(verifiedUser);
    
    if (recommendations.personalizedCTA) {
      enhancedContent = `
### 🎯 Recommended For You
${recommendations.personalizedCTA}
${recommendations.suggestedLessons.length > 0 ? `\n📚 **Curriculum Lessons:** ${recommendations.curriculumCitations.map(id => `\`${id}\``).join(', ')}` : ''}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;
    }
  }

  // ═══════════════════════════════════════════════════════════════════
  // 🏆 COMPETITIVE INTELLIGENCE (Competition Category)
  // ═══════════════════════════════════════════════════════════════════
  if (categoryId === 'competition') {
    const compStats = await helpStateManager.getCompetitionStats(verifiedUser);
    const { multipliers, percentile } = compStats;

    enhancedContent = `
### 💫 Your Competitive Edge
**Streak Multiplier:** \`${multipliers.streak.display}\` (${multipliers.streak.days} days)
**Prestige Multiplier:** \`${multipliers.prestige.display}\` (P${multipliers.prestige.level})
**Total XP Bonus:** \`${multipliers.total.display}\` (+${multipliers.total.bonusPercent}% XP)

${multipliers.streak.nextTier.daysNeeded > 0 ? `⚡ *${multipliers.streak.nextTier.daysNeeded} more days to ${multipliers.streak.nextTier.tierName} (${multipliers.streak.nextTier.nextMultiplier}x)*` : '🏆 *MAX streak bonus achieved!*'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

### 🌍 Global Ranking
${percentile.displayText || `Lifetime XP: **${compStats.lifetimeXP.toLocaleString()}**`}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;
  }

  // ═══════════════════════════════════════════════════════════════════
  // 📊 PROGRESS CATEGORY - XP Formula Transparency
  // ═══════════════════════════════════════════════════════════════════
  if (categoryId === 'progress') {
    const xpProgress = helpStateManager.getXPProgress(verifiedUser);
    
    enhancedContent = `
### 📈 Your Progress (Verified)
**Level ${xpProgress.level}** • ${xpProgress.current.toLocaleString()} / ${xpProgress.needed.toLocaleString()} XP (${xpProgress.percent}%)
*Formula: ${xpProgress.formula}*

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;
  }

  const embed = new EmbedBuilder()
    .setColor(category.color)
    .setAuthor({
      name: `${category.emoji} ${category.name}`,
      iconURL: interaction.client.user.displayAvatarURL()
    })
    .setDescription(`
${category.description}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${enhancedContent}
### 📋 Commands

${formatCommandList(category.commands, true)}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

*Click a command below for detailed usage*
    `)
    .setFooter({ text: `${category.commands.length} commands in this category` });

  const commandOptions = category.commands.map(cmd => {
    const badges = [];
    if (cmd.new) badges.push('🆕');
    if (cmd.popular) badges.push('🔥');
    if (cmd.premium) badges.push('💎');
    
    return {
      label: `/${cmd.name}`,
      description: cmd.description.slice(0, 50) + (badges.length ? ` ${badges.join('')}` : ''),
      value: cmd.name,
      emoji: category.emoji
    };
  });

  const commandSelect = new StringSelectMenuBuilder()
    .setCustomId('help_command_select')
    .setPlaceholder('📖 Select a command for details...')
    .addOptions(commandOptions);

  const navRow = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('help_back_main')
        .setLabel('Back to Hub')
        .setEmoji('🏠')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId(`help_prev_category_${categoryId}`)
        .setLabel('Previous')
        .setEmoji('◀️')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId(`help_next_category_${categoryId}`)
        .setLabel('Next')
        .setEmoji('▶️')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('help_search')
        .setLabel('Search')
        .setEmoji('🔍')
        .setStyle(ButtonStyle.Primary)
    );

  const components = [
    new ActionRowBuilder().addComponents(commandSelect),
    navRow
  ];

  if (interaction.replied || interaction.deferred) {
    await interaction.editReply({ embeds: [embed], components });
  } else {
    await interaction.update({ embeds: [embed], components });
  }
}

// ═══════════════════════════════════════════════════════════════════
// COMMAND DETAIL VIEW
// ═══════════════════════════════════════════════════════════════════

export async function showCommandHelp(interaction, commandName, user) {
  const command = getCommandByName(commandName);
  
  if (!command) {
    const results = searchCommands(commandName);
    if (results.length > 0) {
      return showSearchResults(interaction, commandName, user, results);
    }
    return interaction.reply({
      content: `❌ Command \`/${commandName}\` not found. Use \`/help\` to see all commands.`,
      ephemeral: true
    });
  }

  const embed = new EmbedBuilder()
    .setColor(command.categoryColor)
    .setAuthor({
      name: `${command.categoryEmoji} ${command.categoryName}`,
      iconURL: interaction.client.user.displayAvatarURL()
    })
    .setTitle(`\`/${command.name}\``)
    .setDescription(`
${command.description}

${command.new ? '🆕 **NEW!**' : ''} ${command.popular ? '🔥 **Popular**' : ''} ${command.premium ? '💎 **Premium**' : ''}
    `)
    .addFields(
      {
        name: '📝 Usage',
        value: `\`\`\`${command.usage}\`\`\``,
        inline: false
      },
      {
        name: '📚 Examples',
        value: command.examples.map(e => `\`${e}\``).join('\n'),
        inline: true
      },
      {
        name: '⏱️ Cooldown',
        value: command.cooldown,
        inline: true
      }
    );

  if (command.subcommands && command.subcommands.length > 0) {
    embed.addFields({
      name: '🔧 Subcommands',
      value: command.subcommands.map(s => `\`${s}\``).join(', '),
      inline: false
    });
  }

  const category = HELP_CATEGORIES[command.category];
  const relatedCommands = category.commands
    .filter(c => c.name !== command.name)
    .slice(0, 3)
    .map(c => `\`/${c.name}\``)
    .join(' • ');

  if (relatedCommands) {
    embed.addFields({
      name: '🔗 Related Commands',
      value: relatedCommands,
      inline: false
    });
  }

  embed.setFooter({ 
    text: `Category: ${command.categoryName} • Use the buttons below to try it!` 
  });

  const actionRow = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId(`try_command_${command.name}`)
        .setLabel('Try This Command')
        .setEmoji('▶️')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId(`help_category_${command.category}`)
        .setLabel(`More ${command.categoryName}`)
        .setEmoji(command.categoryEmoji)
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('help_back_main')
        .setLabel('Back to Hub')
        .setEmoji('🏠')
        .setStyle(ButtonStyle.Secondary)
    );

  const reply = {
    embeds: [embed],
    components: [actionRow]
  };

  if (interaction.replied || interaction.deferred) {
    await interaction.editReply(reply);
  } else if (interaction.isStringSelectMenu() || interaction.isButton()) {
    await interaction.update(reply);
  } else {
    await interaction.reply(reply);
  }
}

// ═══════════════════════════════════════════════════════════════════
// SEARCH FUNCTIONALITY
// ═══════════════════════════════════════════════════════════════════

export async function showSearchResults(interaction, query, user, preResults = null) {
  const results = preResults || searchCommands(query);

  if (results.length === 0) {
    const embed = new EmbedBuilder()
      .setColor(HELP_COLORS.WARNING)
      .setTitle('🔍 Search Results')
      .setDescription(`
No commands found matching **"${query}"**

**Suggestions:**
• Check your spelling
• Try a shorter search term
• Browse categories using the menu

**Popular searches:**
\`quiz\` • \`learn\` • \`profile\` • \`daily\` • \`flashcard\`
      `);

    const backRow = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('help_back_main')
          .setLabel('Back to Hub')
          .setEmoji('🏠')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('help_search')
          .setLabel('Search Again')
          .setEmoji('🔍')
          .setStyle(ButtonStyle.Secondary)
      );

    if (interaction.replied || interaction.deferred) {
      return interaction.editReply({ embeds: [embed], components: [backRow] });
    }
    return interaction.reply({ embeds: [embed], components: [backRow], ephemeral: true });
  }

  const resultsText = results.map((cmd, i) => {
    const badges = [];
    if (cmd.new) badges.push('🆕');
    if (cmd.popular) badges.push('🔥');
    if (cmd.premium) badges.push('💎');
    const badgeStr = badges.length > 0 ? ` ${badges.join('')}` : '';
    
    return `**${i + 1}.** ${cmd.categoryEmoji} \`/${cmd.name}\`${badgeStr}\n└─ ${cmd.description}`;
  }).join('\n\n');

  const embed = new EmbedBuilder()
    .setColor(HELP_COLORS.PRIMARY)
    .setTitle(`🔍 Search Results for "${query}"`)
    .setDescription(`
Found **${results.length}** matching command${results.length > 1 ? 's' : ''}:

${resultsText}

*Select a command below for detailed info*
    `)
    .setFooter({ text: 'Results sorted by relevance' });

  const resultOptions = results.slice(0, 25).map(cmd => ({
    label: `/${cmd.name}`,
    description: cmd.description.slice(0, 50),
    value: cmd.name,
    emoji: cmd.categoryEmoji
  }));

  const resultSelect = new StringSelectMenuBuilder()
    .setCustomId('help_command_select')
    .setPlaceholder('📖 Select a command for details...')
    .addOptions(resultOptions);

  const navRow = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('help_back_main')
        .setLabel('Back to Hub')
        .setEmoji('🏠')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('help_search')
        .setLabel('New Search')
        .setEmoji('🔍')
        .setStyle(ButtonStyle.Primary)
    );

  const components = [
    new ActionRowBuilder().addComponents(resultSelect),
    navRow
  ];

  if (interaction.replied || interaction.deferred) {
    await interaction.editReply({ embeds: [embed], components });
  } else {
    await interaction.reply({ embeds: [embed], components });
  }
}

// ═══════════════════════════════════════════════════════════════════
// SPECIAL VIEWS
// ═══════════════════════════════════════════════════════════════════

export async function showNewFeatures(interaction, user) {
  // ═══════════════════════════════════════════════════════════════════
  // NEW POTENTIAL DISCOVERY HUB - Milestone Proximity + Level-Up Forecast
  // ═══════════════════════════════════════════════════════════════════
  
  const { xpForLevel } = await import('../config/brandSystem.js');
  const { User } = await import('../database/models/User.js');
  
  // Calculate user's current stats
  const userLevel = user?.level || 1;
  const userXP = user?.xp || 0;
  const userStreak = user?.streak || 0;
  const userPrestige = user?.prestige?.level || 0;
  const lifetimeXP = user?.prestige?.totalXpEarned || userXP;
  
  // Calculate XP for next level using unified formula
  const xpNeededForNextLevel = xpForLevel(userLevel + 1);
  const xpProgress = userXP;
  const xpRemaining = Math.max(0, xpNeededForNextLevel - xpProgress);
  const progressPercent = Math.min(100, Math.floor((xpProgress / xpNeededForNextLevel) * 100));
  
  // Calculate current multiplier stack
  const streakMultiplier = userStreak >= 30 ? 2.0 : userStreak >= 14 ? 1.5 : userStreak >= 7 ? 1.25 : userStreak >= 3 ? 1.1 : 1.0;
  const prestigeMultiplier = 1 + (userPrestige * 0.1);
  const totalMultiplier = (streakMultiplier * prestigeMultiplier).toFixed(2);
  
  // Calculate activities needed to level up (assuming ~50 XP per activity with multiplier)
  const baseXPPerActivity = 50;
  const effectiveXPPerActivity = Math.floor(baseXPPerActivity * parseFloat(totalMultiplier));
  const activitiesNeeded = Math.ceil(xpRemaining / effectiveXPPerActivity);
  
  // Build progress bar
  const progressBarLength = 12;
  const filledBars = Math.floor((progressPercent / 100) * progressBarLength);
  const progressBar = '█'.repeat(filledBars) + '░'.repeat(progressBarLength - filledBars);
  
  // ═══════════════════════════════════════════════════════════════════
  // MILESTONE PROXIMITY ANALYSIS - Top 3 Closest Achievements
  // ═══════════════════════════════════════════════════════════════════
  
  const milestones = [
    { 
      name: 'Quiz Master', 
      emoji: '🎯', 
      current: user?.quizzesTaken || 0, 
      target: 10, 
      reward: 'Badge + 500 XP',
      action: 'quiz'
    },
    { 
      name: 'Streak Champion', 
      emoji: '🔥', 
      current: userStreak, 
      target: 7, 
      reward: '1.25x Multiplier',
      action: 'daily'
    },
    { 
      name: 'Knowledge Seeker', 
      emoji: '📚', 
      current: user?.lessonsCompleted?.length || 0, 
      target: 5, 
      reward: 'Badge + 300 XP',
      action: 'learn'
    },
    { 
      name: 'Flashcard Pro', 
      emoji: '🃏', 
      current: user?.flashcardsReviewed || 0, 
      target: 25, 
      reward: 'Badge + 200 XP',
      action: 'flashcard'
    },
    { 
      name: 'Code Warrior', 
      emoji: '⚔️', 
      current: user?.challengesWon || 0, 
      target: 3, 
      reward: 'Badge + 400 XP',
      action: 'challenge'
    }
  ];
  
  // Sort by proximity to completion (closest first)
  const sortedMilestones = milestones
    .filter(m => m.current < m.target)
    .map(m => ({
      ...m,
      remaining: m.target - m.current,
      percent: Math.floor((m.current / m.target) * 100)
    }))
    .sort((a, b) => a.remaining - b.remaining)
    .slice(0, 3);
  
  // Build milestone cards
  const milestoneCards = sortedMilestones.map(m => {
    const barLength = 8;
    const filled = Math.floor((m.percent / 100) * barLength);
    const bar = '█'.repeat(filled) + '░'.repeat(barLength - filled);
    return `${m.emoji} **${m.name}**\n└─ \`${bar}\` ${m.current}/${m.target} (${m.percent}%)\n   🎁 *${m.reward}*`;
  }).join('\n\n');
  
  // ═══════════════════════════════════════════════════════════════════
  // SOCIAL PROOF - Global Pulse (Recent Achievements)
  // ═══════════════════════════════════════════════════════════════════
  
  let socialProof = '';
  try {
    const recentAchievers = await User.find({ 
      'achievements.0': { $exists: true } 
    })
    .sort({ 'achievements.unlockedAt': -1 })
    .limit(1)
    .select('username level');
    
    if (recentAchievers.length > 0) {
      const achiever = recentAchievers[0];
      socialProof = `\n✨ *${achiever.username || 'A learner'} just reached Level ${achiever.level || 1}!*`;
    }
  } catch (e) {
    socialProof = '\n✨ *Join hundreds of learners leveling up today!*';
  }
  
  // ═══════════════════════════════════════════════════════════════════
  // BUILD DISCOVERY HUB EMBED
  // ═══════════════════════════════════════════════════════════════════
  
  const embed = new EmbedBuilder()
    .setColor(HELP_COLORS.SUCCESS)
    .setTitle('🚀 Your Growth Path')
    .setDescription(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

### 📈 Level-Up Forecast
**Level ${userLevel}** → **Level ${userLevel + 1}**
\`${progressBar}\` **${progressPercent}%**

⚡ **${xpRemaining.toLocaleString()} XP** needed
🎯 **~${activitiesNeeded} activities** at your **${totalMultiplier}x** multiplier
📊 *Formula: ⌊100 × 1.5^${userLevel}⌋ = ${xpNeededForNextLevel.toLocaleString()} XP*

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

### 🏆 Closest Milestones

${milestoneCards || '*Complete activities to unlock milestones!*'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

### 💫 Your Multiplier Stack
🔥 Streak: **${streakMultiplier}x** (${userStreak} days)
⭐ Prestige: **${prestigeMultiplier}x** (P${userPrestige})
**Total Bonus: ${totalMultiplier}x** (+${Math.round((parseFloat(totalMultiplier) - 1) * 100)}% XP)
${socialProof}
    `)
    .setFooter({ 
      text: `MentorAI Growth Engine • XP Formula: ⌊100 × 1.5^(L-1)⌋`,
      iconURL: interaction.client.user.displayAvatarURL()
    })
    .setTimestamp();

  // ═══════════════════════════════════════════════════════════════════
  // OPPORTUNITY CARDS - Try It Now Buttons
  // ═══════════════════════════════════════════════════════════════════
  
  const topMilestone = sortedMilestones[0];
  const actionButtons = [];
  const usedActions = new Set();
  
  if (topMilestone) {
    actionButtons.push(
      new ButtonBuilder()
        .setCustomId(`discovery_milestone_${topMilestone.action}`)
        .setLabel(`${topMilestone.emoji} ${topMilestone.name}`)
        .setStyle(ButtonStyle.Success)
    );
    usedActions.add(topMilestone.action);
  }
  
  // Add Quick Quiz if not already the milestone
  if (!usedActions.has('quiz')) {
    actionButtons.push(
      new ButtonBuilder()
        .setCustomId('discovery_action_quiz')
        .setLabel('🎯 Quick Quiz')
        .setStyle(ButtonStyle.Primary)
    );
  }
  
  // Add Daily Bonus if not already the milestone
  if (!usedActions.has('daily')) {
    actionButtons.push(
      new ButtonBuilder()
        .setCustomId('discovery_action_daily')
        .setLabel('🔥 Daily Bonus')
        .setStyle(ButtonStyle.Primary)
    );
  }
  
  // Add Learn if we have space
  if (actionButtons.length < 3 && !usedActions.has('learn')) {
    actionButtons.push(
      new ButtonBuilder()
        .setCustomId('discovery_action_learn')
        .setLabel('📚 Learn')
        .setStyle(ButtonStyle.Primary)
    );
  }
  
  const actionRow = new ActionRowBuilder().addComponents(actionButtons.slice(0, 3));
  
  const navRow = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('help_back_main')
        .setLabel('Back to Hub')
        .setEmoji('🏠')
        .setStyle(ButtonStyle.Secondary)
    );

  await interaction.update({ embeds: [embed], components: [actionRow, navRow] });
}

export async function showPopularCommands(interaction, user) {
  const popularCommands = getPopularCommands();

  const embed = new EmbedBuilder()
    .setColor(HELP_COLORS.STREAK_FIRE)
    .setTitle('🔥 Popular Commands')
    .setDescription(`
The most-used commands in MentorAI!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${popularCommands.map((cmd, i) => 
  `**${i + 1}.** ${cmd.categoryEmoji} \`/${cmd.name}\`\n└─ ${cmd.description}`
).join('\n\n')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

*These commands are loved by our community!*
    `)
    .setFooter({ text: `${popularCommands.length} popular commands` });

  const navRow = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('help_back_main')
        .setLabel('Back to Hub')
        .setEmoji('🏠')
        .setStyle(ButtonStyle.Secondary)
    );

  await interaction.update({ embeds: [embed], components: [navRow] });
}

export async function showAllCommands(interaction, user) {
  const categories = getAllCategories();
  
  let allCommandsText = '';
  for (const category of categories) {
    const cmdList = category.commands.map(c => `\`/${c.name}\``).join(' • ');
    allCommandsText += `\n**${category.emoji} ${category.name}**\n${cmdList}\n`;
  }

  const embed = new EmbedBuilder()
    .setColor(HELP_COLORS.PRIMARY)
    .setTitle('📋 All Commands')
    .setDescription(`
MentorAI has **${getCommandCount()}** commands across **${categories.length}** categories!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${allCommandsText}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

*Use \`/help <command>\` for detailed info*
    `)
    .setFooter({ text: 'Select a category for more details' });

  const categorySelect = new StringSelectMenuBuilder()
    .setCustomId('help_category_select')
    .setPlaceholder('📁 Select a category...')
    .addOptions(categories.map(cat => ({
      label: cat.name,
      description: `${cat.commands.length} commands`,
      value: cat.id,
      emoji: cat.emoji
    })));

  const navRow = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('help_back_main')
        .setLabel('Back to Hub')
        .setEmoji('🏠')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('help_search')
        .setLabel('Search')
        .setEmoji('🔍')
        .setStyle(ButtonStyle.Primary)
    );

  await interaction.update({
    embeds: [embed],
    components: [
      new ActionRowBuilder().addComponents(categorySelect),
      navRow
    ]
  });
}

// ═══════════════════════════════════════════════════════════════════
// MODALS
// ═══════════════════════════════════════════════════════════════════

export async function showSearchModal(interaction) {
  const modal = new ModalBuilder()
    .setCustomId('help_semantic_search_modal')
    .setTitle('🧠 MentorAI Semantic Search');

  const searchInput = new TextInputBuilder()
    .setCustomId('semantic_query')
    .setLabel('Enter a concept, topic, or question')
    .setPlaceholder('e.g., how to handle errors in JavaScript, async programming, loops...')
    .setStyle(TextInputStyle.Paragraph)
    .setRequired(true)
    .setMinLength(3)
    .setMaxLength(200);

  modal.addComponents(
    new ActionRowBuilder().addComponents(searchInput)
  );

  await interaction.showModal(modal);
}

/**
 * Handle Semantic Search Modal Submission
 * RAG-Powered curriculum discovery with tier-themed results
 */
export async function handleSemanticSearchSubmit(interaction, user) {
  const query = interaction.fields.getTextInputValue('semantic_query');
  
  await interaction.deferReply({ ephemeral: true });

  // Perform semantic search
  const searchResult = await searchIntelligence.semanticSearch(query, user);
  
  if (!searchResult.success || searchResult.results.length === 0) {
    return showNoResultsEmbed(interaction, query, user);
  }

  // Build tier-themed results embed
  const embed = buildSemanticResultsEmbed(interaction, query, searchResult, user);
  const components = buildSemanticResultsComponents(searchResult);

  await interaction.editReply({ embeds: [embed], components });
}

/**
 * Build Semantic Search Results Embed with Tier Theme
 */
function buildSemanticResultsEmbed(interaction, query, searchResult, user) {
  const { results, mentorTip, relevanceScore, searchTime, userTier } = searchResult;
  
  // Get tier-based theme colors
  const tierColors = {
    'Bronze': 0xCD7F32,
    'Silver': 0xC0C0C0,
    'Gold': 0xFFD700,
    'Platinum': 0xE5E4E2,
    'Diamond': 0xB9F2FF,
    'Master': 0x9B59B6,
    'Grandmaster': 0xFF6B6B,
    'Legend': 0x00FF88
  };
  
  const tierName = userTier?.name || 'Bronze';
  const embedColor = tierColors[tierName] || 0x5865F2;

  // Build results list
  const resultsText = results.slice(0, 5).map((r, i) => {
    const priorityBadge = r.isWeakSpot ? '🎯' : `${i + 1}.`;
    const xpBadge = `+${r.xpReward} XP`;
    return `${priorityBadge} **${r.title}**\n└─ ${r.description?.slice(0, 60) || r.subject}... • \`${xpBadge}\`${r.priorityReason ? `\n   ${r.priorityReason}` : ''}`;
  }).join('\n\n');

  const embed = new EmbedBuilder()
    .setColor(embedColor)
    .setAuthor({
      name: `🧠 Semantic Search Results`,
      iconURL: interaction.client.user.displayAvatarURL()
    })
    .setTitle(`"${query}"`)
    .setDescription(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

### 📚 Curriculum Matches (${results.length} found)

${resultsText}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

### 🤖 AI Mentor Insight
${mentorTip}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    `)
    .addFields(
      { name: '📊 Relevance', value: `${relevanceScore}%`, inline: true },
      { name: '⚡ Search Time', value: `${searchTime}ms`, inline: true },
      { name: '🏆 Your Tier', value: tierName, inline: true }
    )
    .setFooter({ 
      text: `MentorAI Semantic Search • XP rewards use formula: ⌊100 × 1.5^(L-1)⌋`,
      iconURL: interaction.client.user.displayAvatarURL()
    })
    .setTimestamp();

  return embed;
}

/**
 * Build action buttons for semantic search results
 */
function buildSemanticResultsComponents(searchResult) {
  const { results } = searchResult;
  const topResults = results.slice(0, 3);

  // Action buttons for top results - ensure unique custom_ids with index
  const actionButtons = topResults.map((r, i) => 
    new ButtonBuilder()
      .setCustomId(`search_action_${i}_${r.actionType || 'lesson'}_${(r.subject || 'general').slice(0, 10)}`)
      .setLabel(r.actionLabel || 'Start Lesson')
      .setEmoji(r.actionEmoji || '📚')
      .setStyle(i === 0 ? ButtonStyle.Success : ButtonStyle.Primary)
  );

  // Add back button
  actionButtons.push(
    new ButtonBuilder()
      .setCustomId('help_back_main')
      .setLabel('Back to Hub')
      .setEmoji('🏠')
      .setStyle(ButtonStyle.Secondary)
  );

  const actionRow = new ActionRowBuilder().addComponents(actionButtons);

  // Quick filter row
  const filterRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('search_filter_lessons')
      .setLabel('Lessons Only')
      .setEmoji('📖')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId('search_filter_quizzes')
      .setLabel('Quizzes Only')
      .setEmoji('🎯')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId('help_search')
      .setLabel('New Search')
      .setEmoji('🔍')
      .setStyle(ButtonStyle.Secondary)
  );

  return [actionRow, filterRow];
}

/**
 * Show no results embed with suggestions
 */
async function showNoResultsEmbed(interaction, query, user) {
  const embed = new EmbedBuilder()
    .setColor(HELP_COLORS.WARNING)
    .setTitle('🔍 No Curriculum Matches Found')
    .setDescription(`
No results found for **"${query}"**

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

### 💡 Try These Popular Topics
\`javascript\` • \`python\` • \`loops\` • \`functions\` • \`async\`
\`arrays\` • \`objects\` • \`react\` • \`node\` • \`api\`

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

### 🎯 Or Explore Commands
Use the category menu in \`/help\` to browse all features!
    `)
    .setFooter({ text: 'MentorAI Semantic Search • Try a different search term' });

  const backRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('help_search')
      .setLabel('Try Again')
      .setEmoji('🔍')
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId('help_back_main')
      .setLabel('Back to Hub')
      .setEmoji('🏠')
      .setStyle(ButtonStyle.Secondary)
  );

  await interaction.editReply({ embeds: [embed], components: [backRow] });
}

export async function showFeedbackModal(interaction) {
  const modal = new ModalBuilder()
    .setCustomId('help_feedback_modal')
    .setTitle('💡 Send Feedback');

  const feedbackInput = new TextInputBuilder()
    .setCustomId('feedback_text')
    .setLabel('Your feedback')
    .setPlaceholder('Share your thoughts, suggestions, or report issues...')
    .setStyle(TextInputStyle.Paragraph)
    .setRequired(true)
    .setMinLength(10)
    .setMaxLength(1000);

  modal.addComponents(
    new ActionRowBuilder().addComponents(feedbackInput)
  );

  await interaction.showModal(modal);
}

/**
 * Sovereign AI Research Assistant Modal
 * Upgraded from simple Q&A to grounded research interface
 */
export async function showAIQuestionModal(interaction) {
  const modal = new ModalBuilder()
    .setCustomId('help_research_modal')
    .setTitle('🧠 MentorAI Research Assistant');

  const questionInput = new TextInputBuilder()
    .setCustomId('research_query')
    .setLabel('Your research question')
    .setPlaceholder('e.g., How do async/await work? What are closures? Explain React hooks...')
    .setStyle(TextInputStyle.Paragraph)
    .setRequired(true)
    .setMinLength(5)
    .setMaxLength(500);

  modal.addComponents(
    new ActionRowBuilder().addComponents(questionInput)
  );

  await interaction.showModal(modal);
}

/**
 * Handle Research Modal Submission
 * RAG-grounded reasoning with adaptive persona based on user level
 */
export async function handleResearchSubmit(interaction, user) {
  const query = interaction.fields.getTextInputValue('research_query');
  const startTime = Date.now();
  
  await interaction.deferReply({ ephemeral: true });

  try {
    // Import dependencies
    const { curriculumIndexer } = await import('../core/curriculumIndexer.js');
    const { generateAIResponse } = await import('../ai/index.js');
    const { syncEvents } = await import('../services/broadcastService.js');
    const { AccuracySystem } = await import('../core/accuracySystem.js');

    // Get RAG context from curriculum (top 3 lessons)
    const ragResults = curriculumIndexer.search(query, 3);
    const hasRagContext = ragResults && ragResults.length > 0;

    // Build curriculum context for grounding
    const curriculumContext = hasRagContext 
      ? ragResults.map((r, i) => `[${r.lessonId || `REF-${i+1}`}] ${r.title}: ${r.description || r.content?.slice(0, 100) || ''}`).join('\n')
      : '';

    // Get user weak spots for personalization
    const weakTopics = AccuracySystem.getWeakTopics(user, 60, 3);
    const userLevel = user?.level || 1;

    // Build adaptive persona based on user level
    const personaInstructions = userLevel < 10
      ? `The user is a BEGINNER (Level ${userLevel}). Use:
        - Simple analogies and real-world comparisons
        - Basic code examples with detailed comments
        - Encouraging, supportive tone
        - Break down complex concepts into small steps
        - Avoid jargon without explanation`
      : `The user is INTERMEDIATE/ADVANCED (Level ${userLevel}). Use:
        - Technical depth and precise terminology
        - Advanced code patterns and optimizations
        - Performance considerations and best practices
        - Industry-standard approaches
        - Brief explanations, focus on practical application`;

    // Build weak spots context
    const weakSpotsContext = weakTopics.length > 0
      ? `\nUser's weak areas (be extra helpful here): ${weakTopics.map(w => `${w.topic} (${w.accuracy}%)`).join(', ')}`
      : '';

    // Build system prompt with RAG grounding
    const systemPrompt = `You are MentorAI, a sovereign AI research assistant for programming education.

${personaInstructions}
${weakSpotsContext}

${hasRagContext ? `CURRICULUM GROUNDING (cite these references):
${curriculumContext}

When answering, ALWAYS cite relevant lessons like "[Reference: JS-Core-08]" to ground your response in the MentorAI curriculum.` : ''}

Response format:
1. Direct answer to the question
2. Code example if applicable (with comments appropriate to user level)
3. Key takeaway or learning tip
4. Reference any relevant curriculum lessons

Keep response concise but comprehensive (max 1500 chars).`;

    // Generate AI response with failover chain
    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: query }
    ];

    const aiResponse = await generateAIResponse(messages, {
      maxTokens: 800,
      temperature: 0.7
    });

    const responseTime = Date.now() - startTime;

    // Calculate relevance score
    const relevanceScore = hasRagContext 
      ? Math.round(ragResults.reduce((sum, r) => sum + (r.relevanceScore || 0.5), 0) / ragResults.length * 100)
      : 50;

    // Emit to NOC dashboard
    syncEvents.emit('research_query', {
      query,
      userId: user?.discordId,
      username: user?.username,
      userLevel,
      relevanceScore,
      responseTime,
      ragResultCount: ragResults.length,
      timestamp: new Date()
    });

    // Build response embed
    const embed = buildResearchEmbed(interaction, query, aiResponse, ragResults, user, relevanceScore, responseTime);
    const components = buildResearchComponents(ragResults);

    await interaction.editReply({ embeds: [embed], components });

  } catch (error) {
    console.error('Research assistant error:', error);
    
    // Failover: Show graceful error with suggestion
    const fallbackEmbed = new EmbedBuilder()
      .setColor(HELP_COLORS.WARNING)
      .setTitle('🧠 Research Assistant')
      .setDescription(`
I couldn't fully process your research query, but here's what I can suggest:

**Your Question:** ${query.slice(0, 100)}...

**Quick Tips:**
• Try the \`/tutor\` command for in-depth explanations
• Use \`/learn\` to study this topic interactively
• Check \`/quiz\` to test your understanding

*The AI research service will be back shortly!*
      `)
      .setFooter({ text: 'MentorAI Research Assistant • Try again in a moment' });

    const backRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('help_ask_ai')
        .setLabel('Try Again')
        .setEmoji('🔄')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('help_back_main')
        .setLabel('Back to Hub')
        .setEmoji('🏠')
        .setStyle(ButtonStyle.Secondary)
    );

    await interaction.editReply({ embeds: [fallbackEmbed], components: [backRow] });
  }
}

/**
 * Build Research Response Embed with Tier Theme
 */
function buildResearchEmbed(interaction, query, response, ragResults, user, relevanceScore, responseTime) {
  const userLevel = user?.level || 1;
  const tierInfo = TierSystem.getTierFromXP(user?.prestige?.totalXpEarned || user?.xp || 0);
  
  // Tier-based colors
  const tierColors = {
    'Bronze': 0xCD7F32,
    'Silver': 0xC0C0C0,
    'Gold': 0xFFD700,
    'Platinum': 0xE5E4E2,
    'Diamond': 0xB9F2FF,
    'Master': 0x9B59B6,
    'Grandmaster': 0xFF6B6B,
    'Legend': 0x00FF88
  };
  
  const embedColor = tierColors[tierInfo?.name] || 0x5865F2;

  // Build curriculum references
  const references = ragResults.length > 0
    ? ragResults.map(r => `\`${r.lessonId || r.subject}\``).join(' • ')
    : 'General knowledge';

  const embed = new EmbedBuilder()
    .setColor(embedColor)
    .setAuthor({
      name: `🧠 Mentor Insight`,
      iconURL: interaction.client.user.displayAvatarURL()
    })
    .setTitle(`"${query.slice(0, 50)}${query.length > 50 ? '...' : ''}"`)
    .setDescription(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${response}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

### 📚 Curriculum References
${references}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    `)
    .addFields(
      { name: '📊 Relevance', value: `${relevanceScore}%`, inline: true },
      { name: '⚡ Response', value: `${responseTime}ms`, inline: true },
      { name: '🎓 Your Level', value: `${userLevel}`, inline: true }
    )
    .setFooter({ 
      text: `Adaptive ${userLevel < 10 ? 'Beginner' : 'Advanced'} Mode • ${tierInfo?.name || 'Bronze'} Tier`,
      iconURL: interaction.client.user.displayAvatarURL()
    })
    .setTimestamp();

  return embed;
}

/**
 * Build continuity buttons for research results
 */
function buildResearchComponents(ragResults) {
  const buttons = [];
  
  // Add dynamic lesson/quiz buttons based on RAG results
  if (ragResults.length > 0) {
    const topResult = ragResults[0];
    const subject = topResult.subject || 'javascript';
    
    buttons.push(
      new ButtonBuilder()
        .setCustomId(`research_lesson_${subject.slice(0, 15)}`)
        .setLabel('Start Lesson')
        .setEmoji('📚')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId(`research_quiz_${subject.slice(0, 15)}`)
        .setLabel('Take Quiz')
        .setEmoji('🎯')
        .setStyle(ButtonStyle.Primary)
    );
  }

  // Add ask another and back buttons
  buttons.push(
    new ButtonBuilder()
      .setCustomId('help_ask_ai')
      .setLabel('Ask Another')
      .setEmoji('🔄')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId('help_back_main')
      .setLabel('Back to Hub')
      .setEmoji('🏠')
      .setStyle(ButtonStyle.Secondary)
  );

  return [new ActionRowBuilder().addComponents(buttons)];
}

export async function showTryCommandPrompt(interaction, commandName) {
  // Commands that need special handling (require user input)
  const specialCommands = {
    'learn': 'showTopicSelector',
    'quiz': 'showTopicSelector',
    'explain': 'needsModal',
    'tutor': 'needsModal'
  };
  
  // Check if it's a special command that needs a topic selector or modal
  if (specialCommands[commandName] === 'showTopicSelector') {
    // Show topic selector instead of executing
    const embed = new EmbedBuilder()
      .setColor(HELP_COLORS.PRIMARY)
      .setTitle(`🎯 Choose a Topic for /${commandName}`)
      .setDescription('Select a topic to get started:')
      .setFooter({ text: 'MentorAI' });

    const { StringSelectMenuBuilder } = await import('discord.js');
    
    const topicMenu = new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId(`${commandName === 'quiz' ? 'quiz_topic_select' : 'learn_topic_select'}`)
        .setPlaceholder('🎯 Select a topic...')
        .addOptions([
          { label: 'JavaScript', value: 'JavaScript', emoji: '🟨' },
          { label: 'Python', value: 'Python', emoji: '🐍' },
          { label: 'React', value: 'React', emoji: '⚛️' },
          { label: 'Node.js', value: 'Node.js', emoji: '🟢' },
          { label: 'TypeScript', value: 'TypeScript', emoji: '🔷' },
          { label: 'HTML & CSS', value: 'HTML and CSS', emoji: '🌐' },
          { label: 'SQL', value: 'SQL', emoji: '🗃️' },
          { label: 'Git', value: 'Git', emoji: '📚' }
        ])
    );

    const backRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('help_back_main')
        .setLabel('Back')
        .setEmoji('🏠')
        .setStyle(ButtonStyle.Secondary)
    );

    await interaction.update({ embeds: [embed], components: [topicMenu, backRow] });
    return;
  }
  
  // For commands that don't need special handling, execute directly
  try {
    const command = interaction.client.commands.get(commandName);
    
    if (command) {
      await interaction.deferReply();
      
      // Create a fake interaction with mocked options
      const fakeInteraction = {
        ...interaction,
        isChatInputCommand: () => true,
        isButton: () => false,
        commandName: commandName,
        options: {
          getString: () => null,
          getInteger: () => null,
          getUser: () => null,
          getSubcommand: () => null,
          get: () => null,
          getBoolean: () => null
        },
        replied: true,
        deferred: true,
        reply: async (opts) => interaction.editReply(opts),
        deferReply: async () => {},
        editReply: async (opts) => interaction.editReply(opts),
        followUp: async (opts) => interaction.followUp(opts)
      };
      
      await command.execute(fakeInteraction);
      return;
    }
  } catch (error) {
    console.error(`Error executing command ${commandName}:`, error);
  }

  // Fallback if command fails or doesn't exist
  const embed = new EmbedBuilder()
    .setColor(HELP_COLORS.WARNING)
    .setTitle(`⚠️ Command: /${commandName}`)
    .setDescription(`Use \`/${commandName}\` in chat to execute this command.`)
    .setFooter({ text: 'Type the command in chat' });

  const row = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('help_back_main')
        .setLabel('Back to Help')
        .setEmoji('🏠')
        .setStyle(ButtonStyle.Secondary)
    );

  if (interaction.replied || interaction.deferred) {
    await interaction.editReply({ embeds: [embed], components: [row] });
  } else {
    await interaction.update({ embeds: [embed], components: [row] });
  }
}

export async function showQuickActionPrompt(interaction, action) {
  const commandName = action.command;
  
  // If command needs input, show a modal
  if (action.needsInput) {
    const modal = new ModalBuilder()
      .setCustomId(`quick_input_${commandName}`)
      .setTitle(`${action.emoji} ${action.label}`);

    const input = new TextInputBuilder()
      .setCustomId('input_value')
      .setLabel(action.inputLabel === 'topic' ? 'What topic?' : 'Your question')
      .setPlaceholder(action.inputLabel === 'topic' ? 'e.g., JavaScript, Python, React...' : 'Ask anything...')
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

    modal.addComponents(new ActionRowBuilder().addComponents(input));
    return interaction.showModal(modal);
  }

  // For commands that don't need input, execute directly
  try {
    const commandModule = await import(`../bot/commands/${commandName}.js`);
    
    if (commandModule.execute) {
      // Create a proxy interaction that mocks the options
      const mockOptions = {
        getString: (name) => {
          if (name === 'subcommand' || action.subcommand) return action.subcommand || null;
          return null;
        },
        getSubcommand: () => action.subcommand || null,
        getInteger: () => null,
        getBoolean: () => null,
        getUser: () => null,
        getMember: () => null
      };

      // Wrap the interaction with mocked options
      const wrappedInteraction = new Proxy(interaction, {
        get(target, prop) {
          if (prop === 'options') return mockOptions;
          if (prop === 'isChatInputCommand') return () => false;
          if (prop === 'isButton') return () => true;
          return target[prop];
        }
      });

      await commandModule.execute(wrappedInteraction);
    }
  } catch (error) {
    console.error(`Error executing quick action ${commandName}:`, error);
    
    // Fallback - just tell them the command worked or show error
    const embed = new EmbedBuilder()
      .setColor(HELP_COLORS.WARNING)
      .setTitle(`${action.emoji} ${action.label}`)
      .setDescription(`Use \`/${action.command}${action.subcommand ? ' ' + action.subcommand : ''}\` to start!`)
      .setFooter({ text: 'Type the command in chat' });

    const row = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('help_back_main')
          .setLabel('Back to Help')
          .setEmoji('🏠')
          .setStyle(ButtonStyle.Secondary)
      );

    if (interaction.replied || interaction.deferred) {
      await interaction.editReply({ embeds: [embed], components: [row] });
    } else {
      await interaction.update({ embeds: [embed], components: [row] });
    }
  }
}
