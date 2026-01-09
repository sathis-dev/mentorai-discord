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
  getSmartSuggestion,
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

// ═══════════════════════════════════════════════════════════════════
// MAIN HUB VIEW
// ═══════════════════════════════════════════════════════════════════

export async function showMainHub(interaction, user) {
  const embed = buildMainHubEmbed(interaction, user);
  const components = buildMainHubComponents(user);

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

  const suggestion = getSmartSuggestion(user);
  const tip = getRandomTip();

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
## 👋 Welcome back, ${interaction.user.displayName}!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${rankEmoji} **${rankName}** • Level ${level}${prestige > 0 ? ` • ⭐ P${prestige}` : ''}
${createProgressBar(xp, xpRequired, 12)}
✨ ${formatXP(xp, xpRequired)} XP to Level ${level + 1}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

### 📊 Your Stats
${streakEmoji} **${streak}** day streak ${multiplier > 1 ? `(${multiplier}x XP!)` : ''}
📖 **${lessonsCompleted}** lessons completed
🎯 **${quizzesTaken}** quizzes taken • **${accuracy}%** accuracy
🏆 **${achievements}** achievements unlocked

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

### ⚡ Suggested Next Step
${suggestion.emoji} **${suggestion.text}** — Use \`${suggestion.command}\`

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

function buildMainHubComponents(user) {
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
        .setCustomId('help_new')
        .setLabel('New Features')
        .setEmoji('🆕')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('help_popular')
        .setLabel('Popular')
        .setEmoji('🔥')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('help_all')
        .setLabel('All Commands')
        .setEmoji('📋')
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

  const linksRow = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setLabel('Website')
        .setEmoji('🌐')
        .setStyle(ButtonStyle.Link)
        .setURL('https://web-production-e09e9.up.railway.app'),
      new ButtonBuilder()
        .setLabel('Support')
        .setEmoji('💬')
        .setStyle(ButtonStyle.Link)
        .setURL('https://discord.gg/mentorai'),
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

  const embed = new EmbedBuilder()
    .setColor(category.color)
    .setAuthor({
      name: `${category.emoji} ${category.name}`,
      iconURL: interaction.client.user.displayAvatarURL()
    })
    .setDescription(`
${category.description}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

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
  const newCommands = getNewCommands();

  const embed = new EmbedBuilder()
    .setColor(HELP_COLORS.SUCCESS)
    .setTitle('🆕 New Features')
    .setDescription(`
Check out the latest additions to MentorAI!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${newCommands.map(cmd => 
  `${cmd.categoryEmoji} **\`/${cmd.name}\`**\n└─ ${cmd.description}`
).join('\n\n')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

*These features were added recently. Try them out!*
    `)
    .setFooter({ text: `${newCommands.length} new features` });

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
    .setCustomId('help_search_modal')
    .setTitle('🔍 Search Commands');

  const searchInput = new TextInputBuilder()
    .setCustomId('search_query')
    .setLabel('What are you looking for?')
    .setPlaceholder('e.g., quiz, flashcard, tournament...')
    .setStyle(TextInputStyle.Short)
    .setRequired(true)
    .setMaxLength(50);

  modal.addComponents(
    new ActionRowBuilder().addComponents(searchInput)
  );

  await interaction.showModal(modal);
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

export async function showTryCommandPrompt(interaction, commandName) {
  try {
    // Import and execute the actual command directly
    const commandModule = await import(`../bot/commands/${commandName}.js`);
    
    if (commandModule.execute) {
      await interaction.deferUpdate();
      await commandModule.execute(interaction);
      return;
    }
  } catch (error) {
    console.error(`Error executing command ${commandName}:`, error);
  }

  // Fallback if command fails or doesn't exist
  const embed = new EmbedBuilder()
    .setColor(HELP_COLORS.SUCCESS)
    .setTitle('▶️ Try This Command')
    .setDescription(`
To use **\`/${commandName}\`**, type it in the chat:

\`/${commandName}\`

The command will guide you through any options.
    `)
    .setFooter({ text: 'Type the command in chat to use it!' });

  const row = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('help_back_main')
        .setLabel('Back to Help')
        .setEmoji('🏠')
        .setStyle(ButtonStyle.Secondary)
    );

  await interaction.update({ embeds: [embed], components: [row] });
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
