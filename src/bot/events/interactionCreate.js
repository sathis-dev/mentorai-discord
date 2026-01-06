import { Events, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, PermissionFlagsBits, ChannelSelectMenuBuilder, ChannelType, ModalBuilder, TextInputBuilder, TextInputStyle } from 'discord.js';
import { submitAnswer, getCurrentQuestion, cancelSession, useHint, useFiftyFifty, resetEliminatedOptions } from '../../services/quizService.js';
import { getOrCreateUser } from '../../services/gamificationService.js';
import { ServerSettings } from '../../database/models/ServerSettings.js';
import { 
  createQuizQuestionEmbed,
  createQuizAnswerButtons,
  createQuizControlButtons,
  createQuizResultsEmbed,
  createPostQuizButtons,
  COLORS
} from '../../config/designSystem.js';
import { sleep } from '../../utils/animations.js';
import {
  createLearningHelpEmbed,
  createGamificationHelpEmbed,
  createProgressHelpEmbed,
  createSocialHelpEmbed,
  createUtilityHelpEmbed,
  createAllCommandsEmbed,
  createQuickStartEmbed,
  createPopularCommandsEmbed,
  createProTipsEmbed
} from '../../utils/helpEmbeds.js';
import logger from '../../utils/logger.js';
import {
  toggleMaintenanceMode,
  toggleFeature,
  clearLogs,
  searchUser,
  banUser,
  unbanUser,
  resetUserProgress,
  giveUserXp,
  setUserLevel,
  getBannedUsers,
  broadcastMessage,
  getAdminStats,
  getBotHealth,
  isUserBanned
} from '../../services/adminService.js';
import { 
  checkUserAccess, 
  activateAccessKey,
  BOT_OWNER_IDS,
  BETA_MODE
} from '../../services/accessService.js';

export const name = Events.InteractionCreate;

export async function execute(interaction) {
  try {
    // Skip checks for autocomplete
    if (interaction.isAutocomplete()) {
      await handleAutocomplete(interaction);
      return;
    }
    
    // Check if user is banned
    const isBanned = await isUserBanned(interaction.user.id);
    if (isBanned) {
      const bannedEmbed = new EmbedBuilder()
        .setTitle('🚫 Access Denied')
        .setColor(0xED4245)
        .setDescription('You have been banned from using MentorAI.\n\nIf you believe this is a mistake, please contact the bot owner.')
        .setFooter({ text: 'Ban ID: ' + interaction.user.id })
        .setTimestamp();
      
      if (interaction.replied || interaction.deferred) {
        return interaction.followUp({ embeds: [bannedEmbed], ephemeral: true });
      }
      return interaction.reply({ embeds: [bannedEmbed], ephemeral: true });
    }
    
    // Handle access key modal submission first (before access check)
    if (interaction.isModalSubmit() && interaction.customId === 'access_key_modal') {
      await handleAccessKeySubmit(interaction);
      return;
    }
    
    // Check beta access (skip for access key activation button)
    if (BETA_MODE && !interaction.customId?.startsWith('access_')) {
      const accessCheck = await checkUserAccess(interaction.user.id, interaction.user.username);
      
      if (!accessCheck.hasAccess) {
        await showAccessKeyPrompt(interaction, accessCheck.reason);
        return;
      }
    }
    
    if (interaction.isChatInputCommand()) {
      await handleCommand(interaction);
    } else if (interaction.isButton()) {
      await handleButton(interaction);
    } else if (interaction.isStringSelectMenu()) {
      await handleSelectMenu(interaction);
    } else if (interaction.isChannelSelectMenu()) {
      await handleChannelSelect(interaction);
    } else if (interaction.isModalSubmit()) {
      await handleModal(interaction);
    }
  } catch (error) {
    logger.error('Interaction error:', error);
    await sendError(interaction, 'An unexpected error occurred.');
  }
}

async function handleCommand(interaction) {
  const command = interaction.client.commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction);
  } catch (error) {
    logger.error('Command error [' + interaction.commandName + ']:', error);
    await sendError(interaction, 'Failed to execute command.');
  }
}

async function handleButton(interaction) {
  const [category, action, ...params] = interaction.customId.split('_');

  try {
    // Handle access buttons first (before access check)
    if (category === 'access') {
      await handleAccessButton(interaction, action);
      return;
    }
    
    // Handle run code buttons
    if (category === 'run') {
      await handleRunButton(interaction, action, params);
      return;
    }
    
    // Handle review buttons
    if (category === 'review') {
      await handleReviewButton(interaction, action, params);
      return;
    }
    
    // NEW V4: Handle help_action buttons from new help menu
    if (category === 'help' && action === 'action') {
      const helpModule = await import('../commands/help.js');
      await helpModule.handleButton(interaction, params[0]);
      return;
    }
    
    // NEW V4: Handle exec_ buttons (execute commands directly)
    if (category === 'exec') {
      await handleExecButton(interaction, action, params);
      return;
    }
    
    if (category === 'quiz') {
      await handleQuizButton(interaction, action, params);
    } else if (category === 'help') {
      await handleHelpButton(interaction, action, params);
    } else if (category === 'action') {
      // NEW: Handle action buttons from help menu
      await handleActionButton(interaction, action, params);
    } else if (category === 'execute') {
      // NEW: Execute actual commands
      await handleExecuteButton(interaction, action, params);
    } else if (category === 'lesson') {
      await handleLessonButton(interaction, action, params);
    } else if (category === 'progress' || category === 'profile') {
      await handleProfileButton(interaction, action, params);
    } else if (category === 'leaderboard') {
      await handleLeaderboardButton(interaction, action, params);
    } else if (category === 'challenge') {
      await handleChallengeButton(interaction, action, params);
    } else if (category === 'admin') {
      await handleAdminButton(interaction, action, params);
    } else if (category === 'setup') {
      await handleSetupButton(interaction, action, params);
    } else if (category === 'qq') {
      // Quick Quiz answers
      await handleQuickQuizAnswer(interaction, action, params);
    } else if (category === 'funfact') {
      await handleFunFactButton(interaction, action, params);
    } else if (category === 'weekly') {
      await handleWeeklyButton(interaction, action, params);
    } else if (category === 'share') {
      await handleShareButton(interaction, action, params);
    } else if (category === 'referral') {
      await handleReferralButton(interaction, action, params);
    }
  } catch (error) {
    logger.error('Button error:', error);
    await sendError(interaction, 'Button interaction failed.');
  }
}

// Handle setup buttons from welcome message
async function handleSetupButton(interaction, action, params) {
  if (action === 'announcement' && params[0] === 'prompt') {
    // Check if user has permission
    if (!interaction.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(COLORS.error)
            .setTitle('❌ Permission Denied')
            .setDescription('You need **Manage Server** permission to configure MentorAI.\n\nAsk a server admin to run `/setup announcement #channel`')
        ],
        ephemeral: true
      });
    }
    
    // Show channel selector
    const row = new ActionRowBuilder()
      .addComponents(
        new ChannelSelectMenuBuilder()
          .setCustomId('setup_select_announcement')
          .setPlaceholder('Select announcement channel...')
          .setChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
      );
    
    await interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(COLORS.primary)
          .setTitle('📢 Select Announcement Channel')
          .setDescription('Choose a channel where MentorAI will send important announcements and broadcasts.\n\nMake sure I have **Send Messages** and **Embed Links** permissions in that channel!')
      ],
      components: [row],
      ephemeral: true
    });
  } else if (action === 'skip') {
    await interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(COLORS.secondary)
          .setTitle('⏭️ Setup Skipped')
          .setDescription('No problem! You can always configure announcements later with `/setup announcement #channel`\n\nUse `/help` to see all available commands!')
      ],
      ephemeral: true
    });
  }
}

// Handle channel select menu for setup
async function handleChannelSelect(interaction) {
  if (interaction.customId === 'setup_select_announcement') {
    const channel = interaction.channels.first();
    
    if (!channel) {
      return interaction.reply({ content: 'No channel selected', ephemeral: true });
    }
    
    // Check bot permissions
    const permissions = channel.permissionsFor(interaction.client.user);
    if (!permissions.has('SendMessages') || !permissions.has('EmbedLinks')) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(COLORS.error)
            .setTitle('❌ Missing Permissions')
            .setDescription(`I need **Send Messages** and **Embed Links** permissions in ${channel}!\n\nPlease add the permissions and try again.`)
        ],
        ephemeral: true
      });
    }
    
    // Save settings
    await ServerSettings.setAnnouncementChannel(
      interaction.guild.id,
      channel.id,
      channel.name,
      interaction.user.id
    );
    
    // Send confirmation to the channel
    try {
      await channel.send({
        embeds: [
          new EmbedBuilder()
            .setColor(COLORS.success)
            .setTitle('📢 Announcement Channel Configured!')
            .setDescription('This channel will now receive important announcements from MentorAI.')
            .addFields({ name: 'Configured By', value: `<@${interaction.user.id}>` })
            .setTimestamp()
        ]
      });
    } catch (e) {
      console.error('Could not send confirmation:', e);
    }
    
    await interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(COLORS.success)
          .setTitle('✅ Announcement Channel Set!')
          .setDescription(`Broadcasts will be sent to ${channel}.\n\nYou can change this anytime with \`/setup announcement\``)
      ],
      ephemeral: true
    });
  }
}

async function handleSelectMenu(interaction) {
  const customId = interaction.customId;
  const value = interaction.values[0];

  try {
    if (customId === 'topic_select') {
      const embed = new EmbedBuilder()
        .setTitle('📚 ' + value.charAt(0).toUpperCase() + value.slice(1))
        .setColor(COLORS.LESSON_BLUE)
        .setDescription('**Great choice!** Here are your options:')
        .addFields(
          { name: '📖 Learn', value: '`/learn topic:' + value + '`', inline: true },
          { name: '🎯 Quiz', value: '`/quiz topic:' + value + '`', inline: true }
        )
        .setFooter({ text: '🎓 MentorAI' });

      await interaction.reply({ embeds: [embed], ephemeral: true });
    } else if (customId === 'help_category_select') {
      await handleHelpCategorySelect(interaction, value);
    } else if (customId === 'help_category') {
      // NEW: Handle new help category menu
      const helpModule = await import('../commands/help.js');
      await helpModule.handleCategorySelect(interaction, value);
    } else if (customId === 'help_category_v4') {
      // NEW V4: Handle help category menu from V4 design
      const helpModule = await import('../commands/help.js');
      await helpModule.handleCategorySelect(interaction, value);
    } else if (customId === 'quiz_topic_select' || customId === 'quiz_topic_select_v4') {
      // NEW: Start quiz with selected topic (both old and V4 versions)
      await startQuizFromHelpMenu(interaction, value);
    } else if (customId === 'learn_topic_select' || customId === 'learn_topic_select_v4') {
      // NEW: Start lesson with selected topic (both old and V4 versions)
      await startLearnFromHelpMenu(interaction, value);
    }
  } catch (error) {
    logger.error('Select menu error:', error);
  }
}

// NEW: Start quiz from help menu topic selection
async function startQuizFromHelpMenu(interaction, topic) {
  if (topic === 'custom') {
    await interaction.reply({ 
      content: '📚 Use `/learn topic:your-topic` to learn about any topic!', 
      ephemeral: true 
    });
    return;
  }
  
  const quizCommand = interaction.client.commands.get('quiz');
  if (!quizCommand) {
    return interaction.reply({ content: '❌ Quiz command not found', ephemeral: true });
  }
  
  try {
    // Defer first
    await interaction.deferReply();
    let hasResponded = false;
    
    // Start quiz with selected topic
    const fakeInteraction = {
      ...interaction,
      isChatInputCommand: () => true,
      isButton: () => false,
      isStringSelectMenu: () => false,
      commandName: 'quiz',
      options: {
        getString: (name) => name === 'topic' ? topic : null,
        getInteger: (name) => name === 'questions' ? 5 : null,
        getBoolean: () => false,
        getUser: () => null,
        getSubcommand: () => null,
        get: () => null
      },
      replied: true,
      deferred: true,
      reply: async (opts) => {
        if (hasResponded) return interaction.followUp(opts);
        hasResponded = true;
        return interaction.editReply(opts);
      },
      deferReply: async () => {},
      editReply: async (opts) => {
        hasResponded = true;
        return interaction.editReply(opts);
      },
      followUp: async (opts) => interaction.followUp(opts)
    };
    
    await quizCommand.execute(fakeInteraction);
  } catch (error) {
    logger.error('Quiz from help error:', error);
    if (interaction.deferred) {
      await interaction.editReply({ content: `Use \`/quiz topic:${topic}\` to start!` });
    } else {
      await interaction.reply({ content: `Use \`/quiz topic:${topic}\` to start!`, ephemeral: true });
    }
  }
}

// NEW: Start lesson from help menu topic selection  
async function startLearnFromHelpMenu(interaction, topic) {
  if (topic === 'custom') {
    await interaction.reply({ 
      content: '🤖 Use `/learn topic:your-topic` to learn about anything!\n\nExample: `/learn topic:async await in JavaScript`', 
      ephemeral: true 
    });
    return;
  }
  
  const topicMap = {
    'javascript-basics': 'JavaScript variables and functions',
    'python-basics': 'Python fundamentals',
    'webdev': 'Web development with HTML CSS and JavaScript',
    'datastructures': 'Data structures',
    'apis': 'REST APIs',
    'databases': 'SQL databases',
    'algorithms': 'Basic algorithms'
  };
  
  const learnCommand = interaction.client.commands.get('learn');
  if (!learnCommand) {
    return interaction.reply({ content: '❌ Learn command not found', ephemeral: true });
  }
  
  const actualTopic = topicMap[topic] || topic;
  
  try {
    // Defer first
    await interaction.deferReply();
    let hasResponded = false;
    
    const fakeInteraction = {
      ...interaction,
      isChatInputCommand: () => true,
      isButton: () => false,
      isStringSelectMenu: () => false,
      commandName: 'learn',
      options: {
        getString: (name) => name === 'topic' ? actualTopic : null,
        getInteger: () => null,
        getUser: () => null,
        getSubcommand: () => null,
        get: () => null
      },
      replied: true,
      deferred: true,
      reply: async (opts) => {
        if (hasResponded) return interaction.followUp(opts);
        hasResponded = true;
        return interaction.editReply(opts);
      },
      deferReply: async () => {},
      editReply: async (opts) => {
        hasResponded = true;
        return interaction.editReply(opts);
      },
      followUp: async (opts) => interaction.followUp(opts)
    };
    
    await learnCommand.execute(fakeInteraction);
  } catch (error) {
    logger.error('Learn from help error:', error);
    if (interaction.deferred) {
      await interaction.editReply({ content: `Use \`/learn topic:${actualTopic}\` to start!` });
    } else {
      await interaction.reply({ content: `Use \`/learn topic:${actualTopic}\` to start!`, ephemeral: true });
    }
  }
}

async function handleHelpCategorySelect(interaction, category) {
  const embedMap = {
    learning: createLearningHelpEmbed,
    gamification: createGamificationHelpEmbed,
    progress: createProgressHelpEmbed,
    social: createSocialHelpEmbed,
    utility: createUtilityHelpEmbed,
    all: createAllCommandsEmbed
  };

  const createEmbed = embedMap[category];
  if (createEmbed) {
    const embed = createEmbed();
    const backButton = createHelpBackButton();
    await interaction.update({ embeds: [embed], components: [backButton] });
  }
}

async function handleHelpButton(interaction, action, params) {
  if (action === 'main' || action === 'menu') {
    // Show main help menu
    const helpModule = await import('../commands/help.js');
    await helpModule.execute({
      ...interaction,
      isChatInputCommand: () => true,
      replied: false,
      deferred: false,
      reply: async (opts) => interaction.update(opts),
      deferReply: async () => {},
      editReply: async (opts) => interaction.editReply(opts),
      followUp: async (opts) => interaction.followUp(opts),
      user: interaction.user,
      client: interaction.client
    });
  } else if (action === 'quickstart') {
    const embed = createQuickStartEmbed();
    await interaction.update({ embeds: [embed], components: [createHelpBackButton()] });
  } else if (action === 'popular') {
    const embed = createPopularCommandsEmbed();
    await interaction.update({ embeds: [embed], components: [createHelpBackButton()] });
  } else if (action === 'tips') {
    const embed = createProTipsEmbed();
    await interaction.update({ embeds: [embed], components: [createHelpBackButton()] });
  } else if (action === 'back' && params[0] === 'main') {
    // Return to main help menu
    const welcomeEmbed = createWelcomeEmbed(interaction);
    const statsEmbed = createStatsEmbed(interaction);
    const components = createHelpComponents();
    await interaction.update({ embeds: [welcomeEmbed, statsEmbed], components });
  } else if (action === 'feature') {
    const feature = params[0];
    // Execute commands directly instead of showing text!
    if (feature === 'quiz') {
      // Show quiz topic selector
      await showQuizTopicSelector(interaction);
    } else if (feature === 'learn') {
      // Show learn topic selector
      await showLearnTopicSelector(interaction);
    } else if (feature === 'daily' || feature === 'profile') {
      // Execute the command directly
      await executeCommandFromButton(interaction, feature);
    }
  }
}

// Show quiz topic selector for help feature button
async function showQuizTopicSelector(interaction) {
  const embed = new EmbedBuilder()
    .setTitle('🎯 Choose a Quiz Topic')
    .setColor(COLORS.SUCCESS)
    .setDescription('**Select a topic to start your quiz!**\n\nEach quiz gives you XP based on performance.')
    .addFields({
      name: '🏆 Earn XP',
      value: 'Correct answers earn you XP and help build your streak!',
      inline: false
    });

  const topicMenu = new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId('quiz_topic_select')
      .setPlaceholder('🎯 Select a topic...')
      .addOptions([
        { label: 'JavaScript', value: 'JavaScript', emoji: '🟨', description: 'Test your JS skills' },
        { label: 'Python', value: 'Python', emoji: '🐍', description: 'Python programming quiz' },
        { label: 'React', value: 'React', emoji: '⚛️', description: 'React & components' },
        { label: 'Node.js', value: 'Node.js', emoji: '🟢', description: 'Backend JS quiz' },
        { label: 'HTML & CSS', value: 'HTML and CSS', emoji: '🌐', description: 'Web fundamentals' },
        { label: 'SQL', value: 'SQL', emoji: '🗄️', description: 'Database quiz' },
        { label: 'Git', value: 'Git', emoji: '📦', description: 'Version control' },
        { label: 'TypeScript', value: 'TypeScript', emoji: '🔷', description: 'Typed JavaScript' },
        { label: 'APIs', value: 'APIs', emoji: '🔌', description: 'API concepts' },
        { label: 'General Programming', value: 'Programming', emoji: '💻', description: 'Mixed topics' }
      ])
  );

  const backButton = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('help_main')
      .setLabel('Back to Help')
      .setEmoji('◀️')
      .setStyle(ButtonStyle.Secondary)
  );

  const payload = { embeds: [embed], components: [topicMenu, backButton] };
  
  // Handle both update (from help menu) and reply (from execute button)
  try {
    if (interaction.replied || interaction.deferred) {
      await interaction.editReply(payload);
    } else if (interaction.message) {
      await interaction.update(payload);
    } else {
      await interaction.reply(payload);
    }
  } catch (error) {
    await interaction.reply(payload);
  }
}

// Show learn topic selector for help feature button
async function showLearnTopicSelector(interaction) {
  const embed = new EmbedBuilder()
    .setTitle('📚 Choose a Learning Topic')
    .setColor(COLORS.PRIMARY)
    .setDescription('**Select a topic to get an AI-generated lesson!**\n\nLearn anything with personalized explanations.')
    .addFields({
      name: '💡 Tip',
      value: 'You can learn about anything! Use `/learn topic:YourTopic` for custom topics.',
      inline: false
    });

  const topicMenu = new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId('learn_topic_select')
      .setPlaceholder('📚 Select a topic...')
      .addOptions([
        { label: 'JavaScript', value: 'JavaScript', emoji: '🟨', description: 'Web programming fundamentals' },
        { label: 'Python', value: 'Python', emoji: '🐍', description: 'Versatile & beginner-friendly' },
        { label: 'React', value: 'React', emoji: '⚛️', description: 'Modern UI development' },
        { label: 'Node.js', value: 'Node.js', emoji: '🟢', description: 'Server-side JavaScript' },
        { label: 'HTML & CSS', value: 'HTML and CSS', emoji: '🌐', description: 'Web basics' },
        { label: 'SQL', value: 'SQL', emoji: '🗄️', description: 'Database queries' },
        { label: 'Git & GitHub', value: 'Git and GitHub', emoji: '📚', description: 'Version control' },
        { label: 'TypeScript', value: 'TypeScript', emoji: '🔷', description: 'Typed JavaScript' },
        { label: 'REST APIs', value: 'REST APIs', emoji: '🔌', description: 'API fundamentals' },
        { label: 'Data Structures', value: 'Data Structures', emoji: '📊', description: 'CS fundamentals' }
      ])
  );

  const backButton = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('help_main')
      .setLabel('Back to Help')
      .setEmoji('◀️')
      .setStyle(ButtonStyle.Secondary)
  );

  const payload = { embeds: [embed], components: [topicMenu, backButton] };
  
  // Handle both update (from help menu) and reply (from execute button)
  try {
    if (interaction.replied || interaction.deferred) {
      await interaction.editReply(payload);
    } else if (interaction.message) {
      await interaction.update(payload);
    } else {
      await interaction.reply(payload);
    }
  } catch (error) {
    await interaction.reply(payload);
  }
}

function createWelcomeEmbed(interaction) {
  return new EmbedBuilder()
    .setTitle('✨ Welcome to MentorAI ✨')
    .setColor(0x5865F2)
    .setDescription(
      '```\n' +
      '🎓 Your AI-Powered Learning Companion\n' +
      '```\n' +
      '> *Learn any programming topic with AI-generated lessons,*\n' +
      '> *test your knowledge with smart quizzes, and level up!*'
    )
    .setThumbnail(interaction.client.user.displayAvatarURL({ dynamic: true, size: 256 }))
    .addFields({
      name: '🌟 Why MentorAI?',
      value: 
        '```diff\n' +
        '+ AI-Generated Lessons & Quizzes\n' +
        '+ Gamified Learning with XP & Levels\n' +
        '+ Daily Streaks & Achievements\n' +
        '+ Challenge Friends to Quiz Battles\n' +
        '```',
      inline: false
    })
    .setFooter({ text: '🎮 Select a category below to explore!' })
    .setTimestamp();
}

function createStatsEmbed(interaction) {
  return new EmbedBuilder()
    .setColor(0x2ECC71)
    .addFields(
      { name: '🌐 Servers', value: '`' + interaction.client.guilds.cache.size + '`', inline: true },
      { name: '👥 Users', value: '`' + interaction.client.users.cache.size + '`', inline: true },
      { name: '⚡ Latency', value: '`' + interaction.client.ws.ping + 'ms`', inline: true }
    );
}

// NEW: Handle action buttons from help command (show sub-menus)
async function handleActionButton(interaction, action, params) {
  const helpModule = await import('../commands/help.js');
  
  if (action === 'back' && params[0] === 'help') {
    // Go back to main help menu
    await helpModule.execute({ 
      ...interaction, 
      reply: async (opts) => interaction.update(opts),
      user: interaction.user,
      client: interaction.client
    });
    return;
  }
  
  // Handle the action button
  await helpModule.handleButton(interaction, action);
}

// NEW: Execute actual commands from help menu buttons
async function handleExecuteButton(interaction, action, params) {
  // Commands that need special handling (require options)
  const specialCommands = {
    'learn': showLearnTopicSelector,
    'quiz': showQuizTopicSelector
  };
  
  // Check if this is a special command
  if (specialCommands[action]) {
    return specialCommands[action](interaction);
  }
  
  const commandMap = {
    'daily': 'daily',
    'profile': 'profile', 
    'progress': 'progress',
    'streak': 'streak',
    'achievements': 'achievements',
    'leaderboard': 'leaderboard',
    'topics': 'topics',
    'help': 'help'
  };
  
  const commandName = commandMap[action];
  if (!commandName) {
    // If not a command, show a helpful message
    return interaction.reply({ 
      content: `Use \`/${action}\` to access this feature!`, 
      flags: 64 // Ephemeral flag
    });
  }
  
  const command = interaction.client.commands.get(commandName);
  if (!command) {
    return interaction.reply({ 
      content: `❌ Command not found. Use \`/${commandName}\` directly.`, 
      flags: 64 // Ephemeral flag instead of deprecated ephemeral
    });
  }
  
  try {
    // First, defer the button interaction
    await interaction.deferReply();
    
    // Track if we've responded
    let hasResponded = false;
    
    // Create a fake interaction that redirects responses
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
        get: () => null
      },
      replied: true, // Already deferred
      deferred: true,
      reply: async (opts) => {
        if (hasResponded) {
          return interaction.followUp(opts);
        }
        hasResponded = true;
        return interaction.editReply(opts);
      },
      deferReply: async () => {
        // Already deferred, do nothing
        return;
      },
      editReply: async (opts) => {
        hasResponded = true;
        return interaction.editReply(opts);
      },
      followUp: async (opts) => interaction.followUp(opts)
    };
    
    await command.execute(fakeInteraction);
  } catch (error) {
    logger.error('Execute button error:', error);
    // Use editReply since we deferred
    if (interaction.deferred) {
      await interaction.editReply({ 
        content: `❌ Failed to execute. Try \`/${commandName}\` directly.`
      });
    } else {
      await interaction.reply({ 
        content: `❌ Failed to execute. Try \`/${commandName}\` directly.`, 
        ephemeral: true 
      });
    }
  }
}

// Helper function to execute any command from a button
async function executeCommandFromButton(interaction, commandName) {
  const command = interaction.client.commands.get(commandName);
  if (!command) {
    return interaction.reply({ 
      content: `❌ Command not found.`, 
      ephemeral: true 
    });
  }
  
  try {
    await interaction.deferReply();
    let hasResponded = false;
    
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
        get: () => null
      },
      replied: true,
      deferred: true,
      reply: async (opts) => {
        if (hasResponded) return interaction.followUp(opts);
        hasResponded = true;
        return interaction.editReply(opts);
      },
      deferReply: async () => {},
      editReply: async (opts) => {
        hasResponded = true;
        return interaction.editReply(opts);
      },
      followUp: async (opts) => interaction.followUp(opts)
    };
    
    await command.execute(fakeInteraction);
  } catch (error) {
    logger.error(`Execute ${commandName} from button error:`, error);
    if (interaction.deferred) {
      await interaction.editReply({ content: `❌ Something went wrong.` });
    } else {
      await interaction.reply({ content: `❌ Something went wrong.`, ephemeral: true });
    }
  }
}

// NEW V4: Handle exec_ buttons from V4 help menu
async function handleExecButton(interaction, action, params) {
  // Map of actions to command names
  const commandMap = {
    'daily': 'daily',
    'profile': 'profile',
    'progress': 'progress',
    'streak': 'streak',
    'achievements': 'achievements',
    'leaderboard': 'leaderboard',
    'topics': 'topics',
    'help': 'help',
    'stats': 'stats',
    'challenge': 'challenge',
    'weekly': 'weekly',
    'funfact': 'funfact',
    'path': 'path',
    'share': 'share'
  };
  
  // Special commands that need topic selection
  if (action === 'quiz' || action === 'learn') {
    if (action === 'quiz') {
      return showQuizTopicSelector(interaction);
    } else {
      return showLearnTopicSelector(interaction);
    }
  }
  
  // Special handling for weekly command (needs subcommand)
  if (action === 'weekly') {
    const command = interaction.client.commands.get('weekly');
    if (!command) {
      return interaction.reply({ content: '❌ Weekly command not found', ephemeral: true });
    }
    
    try {
      await interaction.deferReply();
      const fakeInteraction = {
        ...interaction,
        isChatInputCommand: () => true,
        isButton: () => false,
        commandName: 'weekly',
        options: {
          getSubcommand: () => 'challenge',
          getString: () => null,
          getInteger: () => null,
          getUser: () => null,
          get: () => null
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
    } catch (error) {
      logger.error('Weekly exec error:', error);
      return interaction.editReply({ content: '❌ Failed to load weekly challenge' });
    }
  }
  
  const commandName = commandMap[action];
  if (!commandName) {
    return interaction.reply({ 
      content: `✨ Use \`/${action}\` to access this feature!`, 
      ephemeral: true 
    });
  }
  
  const command = interaction.client.commands.get(commandName);
  if (!command) {
    return interaction.reply({ 
      content: `❌ Command not found. Use \`/${commandName}\` directly.`, 
      ephemeral: true
    });
  }
  
  try {
    await interaction.deferReply();
    let hasResponded = false;
    
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
      reply: async (opts) => {
        if (hasResponded) return interaction.followUp(opts);
        hasResponded = true;
        return interaction.editReply(opts);
      },
      deferReply: async () => {},
      editReply: async (opts) => {
        hasResponded = true;
        return interaction.editReply(opts);
      },
      followUp: async (opts) => interaction.followUp(opts)
    };
    
    await command.execute(fakeInteraction);
  } catch (error) {
    logger.error(`Exec button error (${action}):`, error);
    if (interaction.deferred) {
      await interaction.editReply({ content: `❌ Failed. Try \`/${commandName}\` directly.` });
    } else {
      await interaction.reply({ content: `❌ Failed. Try \`/${commandName}\` directly.`, ephemeral: true });
    }
  }
}

function createHelpComponents() {
  const categoryMenu = new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId('help_category_select')
      .setPlaceholder('📂 Choose a category to explore...')
      .addOptions([
        { label: '📚 Learning Commands', description: 'AI lessons, quizzes, and explanations', value: 'learning', emoji: '📚' },
        { label: '🎮 Gamification', description: 'XP, levels, streaks, and achievements', value: 'gamification', emoji: '🎮' },
        { label: '📊 Progress & Stats', description: 'Track your learning journey', value: 'progress', emoji: '📊' },
        { label: '👥 Social Features', description: 'Challenges, parties, and leaderboards', value: 'social', emoji: '👥' },
        { label: '⚙️ Utility Commands', description: 'Settings, feedback, and more', value: 'utility', emoji: '⚙️' },
        { label: '📋 All Commands', description: 'View complete command list', value: 'all', emoji: '📋' }
      ])
  );

  const quickButtons = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('help_quickstart')
      .setLabel('🚀 Quick Start')
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId('help_popular')
      .setLabel('⭐ Popular')
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId('help_tips')
      .setLabel('💡 Pro Tips')
      .setStyle(ButtonStyle.Secondary)
  );

  const featureButtons = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('help_feature_quiz')
      .setLabel('Take Quiz')
      .setEmoji('🎯')
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId('help_feature_learn')
      .setLabel('Learn')
      .setEmoji('📚')
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId('help_feature_daily')
      .setLabel('Daily')
      .setEmoji('🎁')
      .setStyle(ButtonStyle.Success)
  );

  return [categoryMenu, quickButtons, featureButtons];
}

function createHelpBackButton() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('help_back_main')
      .setLabel('← Back to Main Menu')
      .setEmoji('🏠')
      .setStyle(ButtonStyle.Secondary)
  );
}

// ============================================================
// QUIZ HANDLERS - Enhanced with Continue Button
// ============================================================

async function handleQuizButton(interaction, action, params) {
  const userId = interaction.user.id;

  if (action === 'answer') {
    const answerIndex = parseInt(params[0]);
    const user = await getOrCreateUser(userId, interaction.user.username);
    const result = await submitAnswer(userId, answerIndex, user);

    if (!result) {
      await interaction.reply({ content: '❌ No active quiz! Start one with `/quiz`', ephemeral: true });
      return;
    }

    if (result.isComplete) {
      // Quiz complete - show calculating then results
      const calculatingEmbed = new EmbedBuilder()
        .setTitle('🎯 Calculating Your Results...')
        .setColor(COLORS.PRIMARY)
        .setDescription(`\`\`\`
⏳ Analyzing Performance...
\`\`\``);

      await interaction.update({ embeds: [calculatingEmbed], components: [] });

      user.quizzesTaken = (user.quizzesTaken || 0) + 1;
      user.correctAnswers = (user.correctAnswers || 0) + result.score;
      user.totalQuestions = (user.totalQuestions || 0) + result.totalQuestions;

      const levelResult = await user.addXp(result.xpEarned);
      result.leveledUp = levelResult.leveledUp;
      result.newLevel = levelResult.newLevel;
      await user.save();

      await sleep(1500);
      const resultsEmbed = createQuizResultsEmbed(result);
      const postButtons = createPostQuizButtons(result.topic);
      await interaction.editReply({ embeds: [resultsEmbed], components: [postButtons] });

      if (result.leveledUp) {
        await sleep(500);
        const levelUpEmbed = new EmbedBuilder()
          .setTitle('🎉 LEVEL UP!')
          .setColor(COLORS.XP_GOLD)
          .setDescription(`\`\`\`
⭐ LEVEL ${result.newLevel} REACHED! ⭐
\`\`\``)
          .setFooter({ text: '🎓 MentorAI | Keep learning!' });
        await interaction.followUp({ embeds: [levelUpEmbed] });
      }
    } else {
      // Show answer result with CONTINUE button - Premium V4 Design
      const answerEmojis = ['🔵', '🟢', '🟡', '🟣'];
      const correctLetter = ['A', 'B', 'C', 'D'][result.correctAnswer] || '?';
      const selectedLetter = ['A', 'B', 'C', 'D'][answerIndex] || '?';
      const selectedEmoji = answerEmojis[answerIndex] || '⚪';
      const correctEmoji = answerEmojis[result.correctAnswer] || '⚪';
      
      // Create premium feedback embed matching design system
      const feedbackEmbed = new EmbedBuilder()
        .setColor(result.isCorrect ? 0x57F287 : 0xED4245)
        .setAuthor({ name: result.isCorrect ? '✨ CORRECT! ✨' : '❌ INCORRECT' })
        .setDescription(result.isCorrect 
          ? `**You selected:** ${selectedEmoji} **${selectedLetter}**

▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬

💎 **+25 XP** earned!
🔥 Streak: **${result.streak || 1}**

▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬

> 📖 ${result.explanation || 'Great job!'}`
          : `**You selected:** ${selectedEmoji} **${selectedLetter}**
**Correct answer:** ${correctEmoji} **${correctLetter}**

▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬

🔥 Streak reset to **0**

▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬

> 📖 ${result.explanation || 'Keep learning!'}`)
        .setFooter({ text: `Question ${result.currentQuestion}/${result.totalQuestions} • Click Continue` })
        .setTimestamp();

      // Create CONTINUE button
      const continueRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('quiz_continue')
          .setLabel('Continue')
          .setEmoji('▶️')
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId('quiz_cancel')
          .setLabel('Quit')
          .setEmoji('🚪')
          .setStyle(ButtonStyle.Danger),
        new ButtonBuilder()
          .setCustomId('help_main')
          .setLabel('Menu')
          .setEmoji('🏠')
          .setStyle(ButtonStyle.Secondary)
      );

      await interaction.update({ embeds: [feedbackEmbed], components: [continueRow] });
    }
  } else if (action === 'continue') {
    // User clicked continue - show next question
    resetEliminatedOptions(userId); // Reset 50/50 for new question
    const questionData = getCurrentQuestion(userId);
    
    if (!questionData || !questionData.question) {
      await interaction.reply({ content: '❌ Quiz session expired. Start a new one with `/quiz`', ephemeral: true });
      return;
    }

    // Create styled transition embed
    const transitionEmbed = new EmbedBuilder()
      .setTitle('⏳ Loading Next Question...')
      .setColor(COLORS.PRIMARY)
      .setDescription(`\`\`\`\n▓▓▓▓▓▓▓▓▓▓ Question ${questionData.questionNum}/${questionData.totalQuestions}\n\`\`\``);

    await interaction.update({ embeds: [transitionEmbed], components: [] });
    await sleep(800);

    const questionEmbed = createQuizQuestionEmbed(
      questionData.question, 
      questionData.questionNum, 
      questionData.totalQuestions, 
      questionData.topic || 'Quiz', 
      questionData.difficulty || 'medium'
    );
    
    await interaction.editReply({ 
      embeds: [questionEmbed], 
      components: [createQuizAnswerButtons(), createQuizControlButtons()] 
    });
    
  } else if (action === 'cancel') {
    cancelSession(userId);
    const cancelEmbed = new EmbedBuilder()
      .setTitle('🛑 Quiz Ended')
      .setColor(COLORS.WARNING)
      .setDescription(`\`\`\`\nQuiz cancelled - No XP earned\n\`\`\``)
      .addFields({
        name: '🎯 Ready for another challenge?',
        value: 'Use `/quiz` to start a new quiz!',
        inline: false
      })
      .setFooter({ text: '🎓 MentorAI' });
    await interaction.update({ embeds: [cancelEmbed], components: [] });
  } else if (action === 'hint') {
    // Handle hint button
    const hintResult = useHint(userId);
    
    if (!hintResult) {
      return interaction.reply({ content: '❌ No active quiz session!', ephemeral: true });
    }
    
    if (hintResult.alreadyUsed) {
      return interaction.reply({ content: '💡 You already used your hint for this quiz!', ephemeral: true });
    }
    
    const hintEmbed = new EmbedBuilder()
      .setTitle('💡 Hint')
      .setColor(COLORS.WARNING)
      .setDescription(hintResult.hint)
      .setFooter({ text: 'Hint used - Choose your answer wisely!' });
    
    await interaction.reply({ embeds: [hintEmbed], ephemeral: true });
    
  } else if (action === 'fifty') {
    // Handle 50/50 button
    const fiftyResult = useFiftyFifty(userId);
    
    if (!fiftyResult) {
      return interaction.reply({ content: '❌ No active quiz session!', ephemeral: true });
    }
    
    if (fiftyResult.alreadyUsed) {
      return interaction.reply({ content: '✂️ You already used 50/50 for this quiz!', ephemeral: true });
    }
    
    // Update the buttons to show eliminated options
    const questionData = getCurrentQuestion(userId);
    if (!questionData || !questionData.question) {
      return interaction.reply({ content: '❌ Could not get question data!', ephemeral: true });
    }
    
    // Create updated answer buttons with eliminated options disabled
    const updatedRow = new ActionRowBuilder();
    const labels = ['A', 'B', 'C', 'D'];
    const styles = [ButtonStyle.Primary, ButtonStyle.Success, ButtonStyle.Secondary, ButtonStyle.Secondary];
    
    for (let i = 0; i < 4; i++) {
      const isEliminated = fiftyResult.eliminated.includes(i);
      updatedRow.addComponents(
        new ButtonBuilder()
          .setCustomId('quiz_answer_' + i)
          .setLabel(isEliminated ? '❌' : labels[i])
          .setStyle(isEliminated ? ButtonStyle.Secondary : styles[i])
          .setDisabled(isEliminated)
      );
    }
    
    // Create control buttons with 50/50 disabled
    const controlRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('quiz_hint')
        .setLabel('Hint')
        .setEmoji('💡')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('quiz_fifty')
        .setLabel('50/50 ✓')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(true),
      new ButtonBuilder()
        .setCustomId('quiz_cancel')
        .setLabel('Cancel Quiz')
        .setStyle(ButtonStyle.Danger)
    );
    
    await interaction.update({ components: [updatedRow, controlRow] });
    
  } else if (action === 'restart' || action === 'start') {
    const topic = decodeURIComponent(params.join('_') || 'JavaScript');
    
    // Start a new quiz directly
    const quizCommand = interaction.client.commands.get('quiz');
    if (!quizCommand) {
      return interaction.reply({ content: '❌ Quiz command not found', ephemeral: true });
    }
    
    try {
      await interaction.deferReply();
      let hasResponded = false;
      
      const fakeInteraction = {
        ...interaction,
        isChatInputCommand: () => true,
        isButton: () => false,
        commandName: 'quiz',
        options: {
          getString: (name) => name === 'topic' ? topic : null,
          getInteger: (name) => name === 'questions' ? 5 : null,
          getUser: () => null,
          getSubcommand: () => null,
          get: () => null
        },
        replied: true,
        deferred: true,
        reply: async (opts) => {
          if (hasResponded) return interaction.followUp(opts);
          hasResponded = true;
          return interaction.editReply(opts);
        },
        deferReply: async () => {},
        editReply: async (opts) => {
          hasResponded = true;
          return interaction.editReply(opts);
        },
        followUp: async (opts) => interaction.followUp(opts)
      };
      
      await quizCommand.execute(fakeInteraction);
    } catch (error) {
      logger.error('Quiz restart error:', error);
      if (interaction.deferred) {
        await interaction.editReply({ content: `Starting quiz on ${topic}...` });
      }
    }
  }
}

// ============================================================
// OTHER HANDLERS
// ============================================================

async function handleLessonButton(interaction, action, params) {
  const topic = decodeURIComponent(params.join('_') || 'programming');
  
  // Execute learn command directly
  const learnCommand = interaction.client.commands.get('learn');
  if (!learnCommand) {
    return interaction.reply({ content: '❌ Learn command not found', ephemeral: true });
  }
  
  try {
    await interaction.deferReply();
    let hasResponded = false;
    
    const fakeInteraction = {
      ...interaction,
      isChatInputCommand: () => true,
      isButton: () => false,
      commandName: 'learn',
      options: {
        getString: (name) => name === 'topic' ? topic : null,
        getInteger: () => null,
        getUser: () => null,
        getSubcommand: () => null,
        get: () => null
      },
      replied: true,
      deferred: true,
      reply: async (opts) => {
        if (hasResponded) return interaction.followUp(opts);
        hasResponded = true;
        return interaction.editReply(opts);
      },
      deferReply: async () => {},
      editReply: async (opts) => {
        hasResponded = true;
        return interaction.editReply(opts);
      },
      followUp: async (opts) => interaction.followUp(opts)
    };
    
    await learnCommand.execute(fakeInteraction);
  } catch (error) {
    logger.error('Lesson button error:', error);
    if (interaction.deferred) {
      await interaction.editReply({ content: `Starting lesson on ${topic}...` });
    }
  }
}

async function handleProfileButton(interaction, action, params) {
  const userId = interaction.user.id;
  const username = interaction.user.username;
  
  try {
    // NEW V4: Use profile module's handleButton for V4 actions
    if (action === 'achievements' || action === 'stats' || action === 'share') {
      const profileModule = await import('../commands/profile.js');
      if (profileModule.handleButton) {
        await profileModule.handleButton(interaction, action, params);
        return;
      }
    }
    
    const user = await getOrCreateUser(userId, username);
    
    switch(action) {
      case 'achievements':
        // Execute achievements command directly
        await executeCommandFromButton(interaction, 'achievements');
        break;
        
      case 'history':
        // Show learning history
        await showLearningHistory(interaction, user);
        break;
        
      case 'compare':
        // Show compare prompt
        await showComparePrompt(interaction);
        break;
        
      case 'share':
        // Generate shareable profile card
        await shareProfile(interaction, user);
        break;
        
      default:
        await executeCommandFromButton(interaction, 'profile');
    }
  } catch (error) {
    logger.error('Profile button error:', error);
    await interaction.reply({ content: '❌ Something went wrong', ephemeral: true });
  }
}

// Show learning history embed
async function showLearningHistory(interaction, user) {
  const lessonsCompleted = user.lessonsCompleted || 0;
  const quizzesTaken = user.quizzesTaken || 0;
  const correctAnswers = user.correctAnswers || 0;
  const totalQuestions = user.totalQuestions || 0;
  const recentTopics = user.topicsLearned || [];
  
  const embed = new EmbedBuilder()
    .setTitle('📜 Learning History')
    .setColor(COLORS.INFO)
    .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
    .setDescription(`**${interaction.user.username}'s learning journey**`)
    .addFields(
      {
        name: '📊 Overall Stats',
        value: [
          `📚 **Lessons Completed:** ${lessonsCompleted}`,
          `🎯 **Quizzes Taken:** ${quizzesTaken}`,
          `✅ **Correct Answers:** ${correctAnswers}/${totalQuestions}`,
          `📈 **Accuracy:** ${totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0}%`
        ].join('\n'),
        inline: false
      },
      {
        name: '🎓 Recent Topics',
        value: recentTopics.length > 0 
          ? recentTopics.slice(-5).map(t => `• ${t}`).join('\n')
          : '_Start learning to see your topics here!_',
        inline: false
      },
      {
        name: '🔥 Streak Info',
        value: `Current: **${user.streak || 0}** days | Best: **${user.bestStreak || 0}** days`,
        inline: false
      }
    )
    .setFooter({ text: '🎓 MentorAI | Keep learning!' })
    .setTimestamp();

  const buttons = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('execute_progress')
      .setLabel('View Progress')
      .setEmoji('📊')
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId('execute_achievements')
      .setLabel('Achievements')
      .setEmoji('🏆')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId('help_main')
      .setLabel('Menu')
      .setEmoji('🏠')
      .setStyle(ButtonStyle.Secondary)
  );

  await interaction.reply({ embeds: [embed], components: [buttons], ephemeral: true });
}

// Show compare prompt
async function showComparePrompt(interaction) {
  const embed = new EmbedBuilder()
    .setTitle('⚔️ Compare Profiles')
    .setColor(COLORS.INFO)
    .setDescription(
      '**Challenge a friend to see who\'s learned more!**\n\n' +
      '> 🎯 Compare XP, levels, and achievements\n' +
      '> 📊 See who has better quiz accuracy\n' +
      '> 🔥 Compare learning streaks\n\n' +
      '*Use `/challenge @user` to start a quiz battle!*'
    )
    .setFooter({ text: '🎓 MentorAI' });

  const buttons = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('execute_leaderboard')
      .setLabel('View Leaderboard')
      .setEmoji('🏆')
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId('help_main')
      .setLabel('Menu')
      .setEmoji('🏠')
      .setStyle(ButtonStyle.Secondary)
  );

  await interaction.reply({ embeds: [embed], components: [buttons], ephemeral: true });
}

// Share profile
async function shareProfile(interaction, user) {
  const level = user.level || 1;
  const xp = user.xp || 0;
  const achievements = user.achievements || [];
  
  const embed = new EmbedBuilder()
    .setTitle(`🎓 ${interaction.user.username}'s MentorAI Profile`)
    .setColor(0x5865F2)
    .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true, size: 256 }))
    .setDescription(
      `**Level ${level} Learner**\n\n` +
      `⭐ **${xp.toLocaleString()}** Total XP\n` +
      `🔥 **${user.streak || 0}** Day Streak\n` +
      `🏆 **${achievements.length}** Achievements\n` +
      `📝 **${user.quizzesTaken || 0}** Quizzes Completed`
    )
    .setFooter({ text: '🎓 Powered by MentorAI | Learn with AI!' })
    .setTimestamp();

  // Send as a public message (not ephemeral)
  await interaction.reply({ 
    content: `**${interaction.user.username}** shared their profile! 🎉`,
    embeds: [embed] 
  });
}

async function handleLeaderboardButton(interaction, action, params) {
  // Execute leaderboard command directly
  await executeCommandFromButton(interaction, 'leaderboard');
}

async function handleChallengeButton(interaction, action, params) {
  const opponentId = params[1];

  if (action === 'accept') {
    if (interaction.user.id !== opponentId) {
      await interaction.reply({ content: '❌ This challenge is not for you!', ephemeral: true });
      return;
    }
    const embed = new EmbedBuilder()
      .setTitle('⚔️ Challenge Accepted!')
      .setColor(COLORS.SUCCESS)
      .setDescription('Both players use `/quiz` to compete!');
    await interaction.update({ embeds: [embed], components: [] });
  } else if (action === 'decline') {
    if (interaction.user.id !== opponentId) {
      await interaction.reply({ content: '❌ This challenge is not for you!', ephemeral: true });
      return;
    }
    const embed = new EmbedBuilder()
      .setTitle('❌ Challenge Declined')
      .setColor(COLORS.ERROR)
      .setDescription('Maybe next time!');
    await interaction.update({ embeds: [embed], components: [] });
  }
}

async function handleAutocomplete(interaction) {
  const command = interaction.client.commands.get(interaction.commandName);
  
  // If command has its own autocomplete handler, use it
  if (command?.autocomplete) {
    try {
      await command.autocomplete(interaction);
      return;
    } catch (error) {
      logger.error('Autocomplete error:', error);
    }
  }
  
  // Default topic autocomplete
  const focused = interaction.options.getFocused(true);
  if (focused.name === 'topic') {
    const topics = ['JavaScript', 'Python', 'React', 'Node.js', 'TypeScript', 'HTML', 'CSS', 'SQL', 'Git', 'Docker', 'APIs', 'Algorithms'];
    const filtered = topics.filter(t => t.toLowerCase().includes(focused.value.toLowerCase())).slice(0, 25);
    await interaction.respond(filtered.map(t => ({ name: t, value: t })));
  }
}

// Handle run code buttons
async function handleRunButton(interaction, action, params) {
  const { resolveLanguage, getCodeTemplate, LANGUAGES } = await import('../../services/codeExecutionService.js');
  const { createLanguagesEmbed } = await import('../commands/run.js');
  
  if (action === 'again') {
    // Show modal to enter new code
    const language = params[0];
    const langConfig = resolveLanguage(language);
    
    if (!langConfig) {
      return interaction.reply({ content: '❌ Unknown language', ephemeral: true });
    }
    
    const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = await import('discord.js');
    
    const modal = new ModalBuilder()
      .setCustomId(`run_code_${langConfig.language}`)
      .setTitle(`${langConfig.emoji} ${langConfig.name} Code`);

    const codeInput = new TextInputBuilder()
      .setCustomId('code')
      .setLabel('Enter your code')
      .setStyle(TextInputStyle.Paragraph)
      .setPlaceholder(getCodeTemplate(language).substring(0, 100) + '...')
      .setRequired(true)
      .setMaxLength(4000);

    const stdinInput = new TextInputBuilder()
      .setCustomId('stdin')
      .setLabel('Input (stdin) - Optional')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('Input to pass to your program')
      .setRequired(false)
      .setMaxLength(1000);

    modal.addComponents(
      new ActionRowBuilder().addComponents(codeInput),
      new ActionRowBuilder().addComponents(stdinInput)
    );

    return interaction.showModal(modal);
  }
  
  if (action === 'template') {
    // Run the template code
    const language = params[0];
    const langConfig = resolveLanguage(language);
    
    if (!langConfig) {
      return interaction.reply({ content: '❌ Unknown language', ephemeral: true });
    }
    
    await interaction.deferReply();
    
    const { executeAndRespond } = await import('../commands/run.js');
    const template = getCodeTemplate(language);
    await executeAndRespond(interaction, langConfig, template, '');
    return;
  }
  
  if (action === 'help') {
    // Show languages list
    const embed = createLanguagesEmbed();
    await interaction.reply({ embeds: [embed], ephemeral: true });
    return;
  }
}

// Handle review buttons
async function handleReviewButton(interaction, action, params) {
  if (action === 'new') {
    // Show language selection for new review
    const embed = new EmbedBuilder()
      .setColor(COLORS.PRIMARY)
      .setTitle('🔍 Start New Code Review')
      .setDescription('Use `/review` command to submit new code for review!\n\nExample: `/review language:python`');
    await interaction.reply({ embeds: [embed], ephemeral: true });
    return;
  }
  
  if (action === 'improve' || action === 'explain') {
    const embed = new EmbedBuilder()
      .setColor(COLORS.INFO)
      .setTitle(action === 'improve' ? '✨ Improved Code' : '📖 Issue Explanation')
      .setDescription('This feature is coming soon! For now, you can:\n\n• Use `/explain` to get explanations for any code concept\n• Use `/learn` to study the topics related to the issues found');
    await interaction.reply({ embeds: [embed], ephemeral: true });
    return;
  }
}

async function handleModal(interaction) {
  // Handle code execution modal
  if (interaction.customId.startsWith('run_code_')) {
    const language = interaction.customId.replace('run_code_', '');
    const code = interaction.fields.getTextInputValue('code');
    const stdin = interaction.fields.getTextInputValue('stdin') || '';
    
    await interaction.deferReply();
    
    const { executeAndRespond } = await import('../commands/run.js');
    const { resolveLanguage } = await import('../../services/codeExecutionService.js');
    const langConfig = resolveLanguage(language);
    
    if (langConfig) {
      await executeAndRespond(interaction, langConfig, code, stdin);
    } else {
      await interaction.editReply({ content: '❌ Unknown language', ephemeral: true });
    }
    return;
  }
  
  // Handle code review modal
  if (interaction.customId.startsWith('review_code_')) {
    const parts = interaction.customId.replace('review_code_', '').split('_');
    const language = parts[0];
    const focus = parts[1] || 'general';
    const code = interaction.fields.getTextInputValue('code');
    const context = interaction.fields.getTextInputValue('context') || '';
    
    await interaction.deferReply();
    
    const { performCodeReview } = await import('../commands/review.js');
    await performCodeReview(interaction, language, focus, code, context);
    return;
  }
  
  if (interaction.customId === 'modal_feedback') {
    const rating = interaction.fields.getTextInputValue('feedback_rating');
    logger.info('Feedback from ' + interaction.user.tag + ': ' + rating + ' stars');
    const embed = new EmbedBuilder()
      .setTitle('✅ Thank You!')
      .setColor(COLORS.SUCCESS)
      .setDescription('Your feedback has been received!');
    await interaction.reply({ embeds: [embed], ephemeral: true });
  } else if (interaction.customId === 'admin_modal_broadcast') {
    const title = interaction.fields.getTextInputValue('broadcast_title');
    const message = interaction.fields.getTextInputValue('broadcast_message');
    await broadcastMessage(title, message);
    const embed = new EmbedBuilder()
      .setTitle('📢 Broadcast Sent')
      .setColor(COLORS.SUCCESS)
      .setDescription('Your message has been sent to all users.');
    await interaction.reply({ embeds: [embed], ephemeral: true });
  }
}

async function sendError(interaction, message) {
  const embed = new EmbedBuilder()
    .setTitle('❌ Error')
    .setDescription(message)
    .setColor(COLORS.ERROR);
  try {
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({ embeds: [embed], ephemeral: true });
    } else {
      await interaction.reply({ embeds: [embed], ephemeral: true });
    }
  } catch (e) {
    logger.error('Failed to send error:', e);
  }
}

async function handleAdminButton(interaction, action, params) {
  // Admin ID check
  const ADMIN_IDS = ['YOUR_DISCORD_ID_HERE']; // Replace with your ID
  if (!ADMIN_IDS.includes(interaction.user.id)) {
    await interaction.reply({ content: '🔒 Access denied.', ephemeral: true });
    return;
  }

  if (action === 'nav') {
    const page = params[0];
    if (page === 'dashboard') {
      // Re-run dashboard
      const adminCmd = interaction.client.commands.get('admin');
      interaction.options = { getSubcommand: () => 'dashboard' };
      await adminCmd.execute(interaction);
    } else if (page === 'users') {
      interaction.options = { getSubcommand: () => 'users' };
      const adminCmd = interaction.client.commands.get('admin');
      await adminCmd.execute(interaction);
    } else if (page === 'analytics') {
      interaction.options = { getSubcommand: () => 'analytics' };
      const adminCmd = interaction.client.commands.get('admin');
      await adminCmd.execute(interaction);
    } else if (page === 'logs') {
      interaction.options = { getSubcommand: () => 'logs' };
      const adminCmd = interaction.client.commands.get('admin');
      await adminCmd.execute(interaction);
    } else if (page === 'config') {
      interaction.options = { getSubcommand: () => 'config' };
      const adminCmd = interaction.client.commands.get('admin');
      await adminCmd.execute(interaction);
    }
  } else if (action === 'action') {
    const actionType = params[0];
    if (actionType === 'refresh') {
      await interaction.reply({ content: '🔄 Dashboard refreshed!', ephemeral: true });
    } else if (actionType === 'broadcast') {
      // Show broadcast modal
      const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = await import('discord.js');
      const modal = new ModalBuilder()
        .setCustomId('admin_modal_broadcast')
        .setTitle('📢 Broadcast Announcement');
      
      const titleInput = new TextInputBuilder()
        .setCustomId('broadcast_title')
        .setLabel('Title')
        .setStyle(TextInputStyle.Short)
        .setRequired(true);
      
      const messageInput = new TextInputBuilder()
        .setCustomId('broadcast_message')
        .setLabel('Message')
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(true);
      
      modal.addComponents(
        new ActionRowBuilder().addComponents(titleInput),
        new ActionRowBuilder().addComponents(messageInput)
      );
      
      await interaction.showModal(modal);
    } else if (actionType === 'maintenance') {
      const isEnabled = toggleMaintenanceMode();
      await interaction.reply({
        content: isEnabled ? '🔧 Maintenance mode **ENABLED**' : '🟢 Maintenance mode **DISABLED**',
        ephemeral: true
      });
    }
  } else if (action === 'maint') {
    const maintAction = params[0];
    if (maintAction === 'toggle') {
      const isEnabled = toggleMaintenanceMode();
      await interaction.reply({
        content: isEnabled ? '🔧 Maintenance mode **ENABLED**' : '🟢 Maintenance mode **DISABLED**',
        ephemeral: true
      });
    } else if (maintAction === 'cache') {
      await interaction.reply({ content: '🗑️ Cache cleared!', ephemeral: true });
    } else if (maintAction === 'sync') {
      await interaction.reply({ content: '🔄 Database synced!', ephemeral: true });
    } else if (maintAction === 'health') {
      const health = await getBotHealth();
      await interaction.reply({
        content: '❤️ **Health Check**\n```\nStatus: ' + health.status + '\nMemory: ' + 
          (health.memory.heapUsed / 1024 / 1024).toFixed(2) + 'MB\nMaintenance: ' + 
          (health.maintenanceMode ? 'ON' : 'OFF') + '\n```',
        ephemeral: true
      });
    }
  } else if (action === 'logs') {
    const logAction = params[0];
    if (logAction === 'clear') {
      clearLogs();
      await interaction.reply({ content: '🗑️ Logs cleared!', ephemeral: true });
    } else if (logAction === 'export') {
      await interaction.reply({ content: '📥 Log export feature coming soon!', ephemeral: true });
    }
  } else if (action === 'analytics') {
    const range = params[0];
    await interaction.reply({ content: '📊 Showing ' + range + ' analytics...', ephemeral: true });
  } else if (action === 'users') {
    const userAction = params[0];
    if (userAction === 'export') {
      await interaction.reply({ content: '📥 User export feature coming soon!', ephemeral: true });
    } else if (userAction === 'refresh') {
      await interaction.reply({ content: '🔄 User list refreshed!', ephemeral: true });
    }
  } else if (action === 'config') {
    const configAction = params[0];
    if (configAction === 'reload') {
      await interaction.reply({ content: '🔄 Configuration reloaded!', ephemeral: true });
    } else if (configAction === 'restart') {
      await interaction.reply({ content: '🔄 Restart initiated... (This is a simulation)', ephemeral: true });
    }
  }
}
// Handle Quick Quiz answers
async function handleQuickQuizAnswer(interaction, quizId, params) {
  const answerIndex = parseInt(params[0]);
  
  // Dynamic import to avoid circular dependency
  const { activeQuizzes } = await import('../commands/quickquiz.js');
  const quiz = activeQuizzes.get(quizId);
  
  if (!quiz) {
    return interaction.reply({ content: '❌ This quiz has expired!', ephemeral: true });
  }
  
  if (quiz.userId !== interaction.user.id) {
    return interaction.reply({ content: '❌ This isn\'t your quiz!', ephemeral: true });
  }
  
  quiz.answered = true;
  activeQuizzes.delete(quizId);
  
  const isCorrect = answerIndex === quiz.correct;
  const user = await getOrCreateUser(interaction.user.id, interaction.user.username);
  
  // Track quick quiz stats
  user.quickQuizzesTaken = (user.quickQuizzesTaken || 0) + 1;
  if (isCorrect) {
    user.quickQuizCorrect = (user.quickQuizCorrect || 0) + 1;
    // Track best streak (consecutive correct answers)
    user.quickQuizCurrentStreak = (user.quickQuizCurrentStreak || 0) + 1;
    if (user.quickQuizCurrentStreak > (user.quickQuizBestStreak || 0)) {
      user.quickQuizBestStreak = user.quickQuizCurrentStreak;
    }
    await user.addXp(25);
  } else {
    // Reset current streak on wrong answer
    user.quickQuizCurrentStreak = 0;
  }
  await user.save();
  
  const resultEmbed = new EmbedBuilder()
    .setTitle(isCorrect ? '✅ Correct!' : '❌ Wrong!')
    .setColor(isCorrect ? COLORS.SUCCESS_GREEN : COLORS.ERROR_RED)
    .setDescription(
      '**Question:** ' + quiz.question + '\n\n' +
      '**Your Answer:** ' + quiz.options[answerIndex] + '\n' +
      '**Correct Answer:** ' + quiz.options[quiz.correct] + '\n\n' +
      '**Explanation:** ' + quiz.explanation
    )
    .addFields({
      name: '🎁 Reward',
      value: isCorrect ? '+25 XP earned!' : 'Try again for XP!',
      inline: false
    })
    .setFooter({ text: '🎓 MentorAI | /quickquiz for more!' })
    .setTimestamp();

  const buttons = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('execute_quickquiz')
      .setLabel('Another Question')
      .setEmoji('⚡')
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId('funfact_learn_' + encodeURIComponent(quiz.topic))
      .setLabel('Learn This Topic')
      .setEmoji('📚')
      .setStyle(ButtonStyle.Secondary)
  );

  await interaction.update({ embeds: [resultEmbed], components: [buttons] });
}

// Handle Fun Fact buttons
async function handleFunFactButton(interaction, action, params) {
  if (action === 'another') {
    // Execute funfact command
    const command = interaction.client.commands.get('funfact');
    if (command) {
      await command.execute(interaction);
    }
  } else if (action === 'learn') {
    const topic = decodeURIComponent(params.join('_'));
    const command = interaction.client.commands.get('learn');
    if (command) {
      // Create a mock interaction with the topic
      interaction.options = {
        getString: (name) => name === 'topic' ? topic : null
      };
      await interaction.deferUpdate();
      await command.execute(interaction);
    }
  } else if (action === 'quiz') {
    const topic = decodeURIComponent(params.join('_'));
    const command = interaction.client.commands.get('quiz');
    if (command) {
      interaction.options = {
        getString: (name) => name === 'topic' ? topic : null,
        getInteger: () => 3,
        getBoolean: () => false
      };
      await interaction.deferUpdate();
      await command.execute(interaction);
    }
  }
}

// Handle Weekly challenge buttons
async function handleWeeklyButton(interaction, action, params) {
  if (action === 'leaderboard') {
    const command = interaction.client.commands.get('weekly');
    if (command) {
      interaction.options = {
        getSubcommand: () => 'leaderboard'
      };
      await command.execute(interaction);
    }
  }
}

// Handle Share buttons
async function handleShareButton(interaction, action, params) {
  if (action === 'copy') {
    const type = params[0];
    await interaction.reply({
      content: '📋 Copy the share text from the message above and paste it anywhere!',
      ephemeral: true
    });
  }
}

// Handle Referral buttons  
async function handleReferralButton(interaction, action, params) {
  const command = interaction.client.commands.get('referral');
  if (!command) return;

  if (action === 'stats') {
    interaction.options = {
      getSubcommand: () => 'stats'
    };
    await command.execute(interaction);
  } else if (action === 'link') {
    interaction.options = {
      getSubcommand: () => 'link'
    };
    await command.execute(interaction);
  } else if (action === 'leaderboard') {
    interaction.options = {
      getSubcommand: () => 'leaderboard'
    };
    await command.execute(interaction);
  } else if (action === 'claim') {
    interaction.options = {
      getSubcommand: () => 'claim'
    };
    await command.execute(interaction);
  }
}

// ============================================================
// BETA ACCESS KEY SYSTEM - Premium UI
// ============================================================

/**
 * Show beautiful access key prompt to user
 */
async function showAccessKeyPrompt(interaction, reason) {
  const reasonMessages = {
    'no_key': 'You need an **Access Key** to use MentorAI during the beta phase.',
    'expired': 'Your **beta access has expired**. Please contact the bot owner for a new key.',
    'revoked': 'Your **access has been revoked**. Please contact the bot owner if you believe this is an error.'
  };
  
  const accessEmbed = new EmbedBuilder()
    .setTitle('🔐 MentorAI Beta Access Required')
    .setColor(0x5865F2)
    .setDescription(
      '```\n' +
      '⚡ EXCLUSIVE BETA ACCESS ⚡\n' +
      '```\n\n' +
      (reasonMessages[reason] || reasonMessages['no_key']) +
      '\n\n' +
      '**How to get access:**\n' +
      '> 🎫 Request an access key from the bot owner\n' +
      '> 🔑 Click the button below to enter your key\n' +
      '> ✨ Enjoy full access to MentorAI!'
    )
    .addFields(
      {
        name: '🎁 Beta Testers Get',
        value: '```diff\n+ Early access to all features\n+ Exclusive beta tester badge\n+ Direct feedback channel\n+ Priority support\n```',
        inline: false
      }
    )
    .setFooter({ text: '🔒 Access keys are one-time use and bound to your account' })
    .setTimestamp();
  
  const buttons = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('access_enter_key')
      .setLabel('🔑 Enter Access Key')
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId('access_request_info')
      .setLabel('ℹ️ How to Get a Key')
      .setStyle(ButtonStyle.Secondary)
  );
  
  if (interaction.replied || interaction.deferred) {
    await interaction.followUp({ embeds: [accessEmbed], components: [buttons], ephemeral: true });
  } else {
    await interaction.reply({ embeds: [accessEmbed], components: [buttons], ephemeral: true });
  }
}

/**
 * Handle access key button clicks
 */
async function handleAccessButton(interaction, action) {
  if (action === 'enter' && interaction.customId === 'access_enter_key') {
    // Show modal for key entry
    const modal = new ModalBuilder()
      .setCustomId('access_key_modal')
      .setTitle('🔑 Enter Your Access Key');
    
    const keyInput = new TextInputBuilder()
      .setCustomId('access_key_input')
      .setLabel('Access Key')
      .setPlaceholder('MENTOR-XXXX-XXXX-XXXX')
      .setStyle(TextInputStyle.Short)
      .setMinLength(19)
      .setMaxLength(25)
      .setRequired(true);
    
    const row = new ActionRowBuilder().addComponents(keyInput);
    modal.addComponents(row);
    
    await interaction.showModal(modal);
  } else if (action === 'request' && interaction.customId === 'access_request_info') {
    const infoEmbed = new EmbedBuilder()
      .setTitle('ℹ️ How to Get an Access Key')
      .setColor(0x5865F2)
      .setDescription(
        '```\n' +
        '📋 GETTING YOUR ACCESS KEY\n' +
        '```\n\n' +
        '**MentorAI is currently in private beta.**\n\n' +
        '**To get an access key:**\n\n' +
        '1️⃣ **Join our community** - Contact the bot owner\n' +
        '2️⃣ **Request access** - Explain why you want to test\n' +
        '3️⃣ **Receive your key** - It will look like `MENTOR-XXXX-XXXX-XXXX`\n' +
        '4️⃣ **Activate it here** - Click "Enter Access Key"\n\n' +
        '**Bot Owner:** <@1116096965755813968>\n\n' +
        '> ⚠️ Each key is **one-time use** and bound to your account!'
      )
      .setFooter({ text: '🎓 MentorAI Beta Program' })
      .setTimestamp();
    
    await interaction.reply({ embeds: [infoEmbed], ephemeral: true });
  }
}

/**
 * Handle access key modal submission
 */
async function handleAccessKeySubmit(interaction) {
  const key = interaction.fields.getTextInputValue('access_key_input').trim().toUpperCase();
  
  // Show processing message
  await interaction.deferReply({ ephemeral: true });
  
  // Import here to avoid circular dependency
  const { activateAccessKey } = await import('../../services/accessService.js');
  
  const result = await activateAccessKey(key, interaction.user.id, interaction.user.username);
  
  if (!result.success) {
    const errorMessages = {
      'INVALID_KEY': { emoji: '❌', title: 'Invalid Key', desc: 'This access key does not exist. Please check and try again.' },
      'ALREADY_USED': { emoji: '🚫', title: 'Key Already Used', desc: 'This key has already been activated by another user.' },
      'REVOKED': { emoji: '⛔', title: 'Key Revoked', desc: 'This key has been revoked by an administrator.' },
      'EXPIRED': { emoji: '⏰', title: 'Key Expired', desc: 'This access key has expired.' }
    };
    
    const err = errorMessages[result.error] || errorMessages['INVALID_KEY'];
    
    const errorEmbed = new EmbedBuilder()
      .setTitle(`${err.emoji} ${err.title}`)
      .setColor(0xED4245)
      .setDescription(
        '```\n' + err.desc + '\n```\n\n' +
        '**What to do:**\n' +
        '• Double-check your key for typos\n' +
        '• Request a new key from the bot owner\n' +
        '• Contact support if you believe this is an error'
      )
      .setFooter({ text: '🔑 Key entered: ' + key })
      .setTimestamp();
    
    await interaction.editReply({ embeds: [errorEmbed] });
    return;
  }
  
  // Success! Show beautiful welcome
  const successEmbed = new EmbedBuilder()
    .setTitle('🎉 Welcome to MentorAI Beta!')
    .setColor(0x57F287)
    .setDescription(
      '```\n' +
      '✨ ACCESS GRANTED ✨\n' +
      '```\n\n' +
      `Welcome, **${interaction.user.username}**! 🎊\n\n` +
      'Your access key has been activated. You now have **full access** to all MentorAI features!'
    )
    .addFields(
      {
        name: '🔑 Key Activated',
        value: '```\n' + key + '\n```',
        inline: true
      },
      {
        name: '📅 Access Type',
        value: '```\n' + (result.key.keyType || 'Beta').toUpperCase() + ' ACCESS\n```',
        inline: true
      },
      {
        name: '🚀 Get Started',
        value: 
          '> `/help` - See all commands\n' +
          '> `/learn` - Start learning\n' +
          '> `/quiz` - Take a quiz\n' +
          '> `/daily` - Claim daily bonus',
        inline: false
      }
    );
  
  if (result.expiresAt) {
    successEmbed.addFields({
      name: '⏰ Access Expires',
      value: `<t:${Math.floor(result.expiresAt.getTime() / 1000)}:F>`,
      inline: true
    });
  }
  
  successEmbed.setFooter({ text: '🎓 Thank you for being a beta tester!' })
    .setTimestamp();
  
  const buttons = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('help_main')
      .setLabel('📚 View Commands')
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId('execute_learn')
      .setLabel('🎯 Start Learning')
      .setStyle(ButtonStyle.Success)
  );
  
  await interaction.editReply({ embeds: [successEmbed], components: [buttons] });
}