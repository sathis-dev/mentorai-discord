import { 
  SlashCommandBuilder, 
  EmbedBuilder, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle,
  StringSelectMenuBuilder 
} from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('help')
  .setDescription('📖 View all MentorAI commands and features');

export async function execute(interaction) {
  const mainEmbed = new EmbedBuilder()
    .setColor(0x5865F2)
    .setAuthor({ 
      name: 'MentorAI • Your AI-Powered Coding Mentor', 
      iconURL: interaction.client.user.displayAvatarURL() 
    })
    .setTitle('🎓 Master Programming with AI — The Fun Way!')
    .setDescription(
      `Hey **${interaction.user.username}**! 👋\n\n` +
      `Welcome to **MentorAI** — the gamified Discord bot that transforms learning to code into an exciting adventure!\n\n` +
      `**What makes MentorAI special:**\n` +
      `> 🧠 **AI-Generated Lessons** — Personalized tutorials on any topic\n` +
      `> 🎯 **Smart Quizzes** — Adaptive questions that match your level\n` +
      `> ⭐ **XP & Levels** — Earn rewards as you learn\n` +
      `> 🔥 **Daily Streaks** — Stay consistent, unlock bonuses\n` +
      `> 🏆 **Achievements** — Collect badges & show off progress\n` +
      `> ⚔️ **Quiz Battles** — Challenge friends in real-time!`
    )
    .setThumbnail(interaction.client.user.displayAvatarURL({ dynamic: true, size: 256 }))
    .addFields(
      {
        name: '📊 Quick Stats',
        value: `\`\`\`yml\nServers: ${interaction.client.guilds.cache.size} | Users: ${interaction.client.users.cache.size} | Ping: ${interaction.client.ws.ping}ms\n\`\`\``,
        inline: false
      },
      {
        name: '⚡ Quick Actions',
        value: 'Use the buttons below to get started instantly!',
        inline: false
      }
    )
    .setFooter({ 
      text: '💡 Tip: Click any button below to start immediately!',
      iconURL: interaction.user.displayAvatarURL()
    })
    .setTimestamp();

  // Category select menu
  const categoryMenu = new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId('help_category')
      .setPlaceholder('📂 Browse command categories...')
      .addOptions([
        { label: 'Learning', description: 'AI lessons & explanations', value: 'learning', emoji: '📚' },
        { label: 'Quizzes', description: 'Test your knowledge', value: 'quizzes', emoji: '🎯' },
        { label: 'Progress', description: 'XP, levels & achievements', value: 'progress', emoji: '📈' },
        { label: 'Social', description: 'Challenges & leaderboards', value: 'social', emoji: '👥' },
        { label: 'All Commands', description: 'Complete command list', value: 'all', emoji: '📋' }
      ])
  );

  // Main action buttons - these directly execute commands!
  const actionButtons1 = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('action_quiz')
      .setLabel('Take a Quiz')
      .setEmoji('🎯')
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId('action_learn')
      .setLabel('Start Lesson')
      .setEmoji('📚')
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId('action_daily')
      .setLabel('Daily Bonus')
      .setEmoji('🎁')
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId('action_profile')
      .setLabel('My Profile')
      .setEmoji('👤')
      .setStyle(ButtonStyle.Secondary)
  );

  const actionButtons2 = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('action_leaderboard')
      .setLabel('Leaderboard')
      .setEmoji('🏆')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId('action_achievements')
      .setLabel('Achievements')
      .setEmoji('🎖️')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId('action_streak')
      .setLabel('My Streak')
      .setEmoji('🔥')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId('action_topics')
      .setLabel('Topics')
      .setEmoji('📖')
      .setStyle(ButtonStyle.Secondary)
  );

  await interaction.reply({ 
    embeds: [mainEmbed], 
    components: [categoryMenu, actionButtons1, actionButtons2] 
  });
}

// Handle button interactions - execute actual commands!
export async function handleButton(interaction, action) {
  switch(action) {
    case 'quiz':
      return await showQuizSelector(interaction);
    case 'learn':
      return await showLearnSelector(interaction);
    case 'daily':
      return await showDailyInfo(interaction);
    case 'profile':
      return await showProfilePreview(interaction);
    case 'leaderboard':
      return await showLeaderboardInfo(interaction);
    case 'achievements':
      return await showAchievementsInfo(interaction);
    case 'streak':
      return await showStreakInfo(interaction);
    case 'topics':
      return await showTopicsInfo(interaction);
    case 'back_help':
      return await execute(Object.assign({}, interaction, { reply: interaction.update.bind(interaction) }));
  }
}

// Show quiz topic selector
async function showQuizSelector(interaction) {
  const embed = new EmbedBuilder()
    .setColor(0x00D166)
    .setTitle('🎯 Start a Quiz')
    .setDescription('**Select a topic to test your knowledge!**\n\n*Each quiz gives you XP based on your performance.*')
    .setFooter({ text: '💡 Choose a topic below' });

  const topicMenu = new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId('quiz_topic_select')
      .setPlaceholder('🎯 Choose a quiz topic...')
      .addOptions([
        { label: 'JavaScript', description: 'Web development fundamentals', value: 'javascript', emoji: '🟨' },
        { label: 'Python', description: 'General programming & AI', value: 'python', emoji: '🐍' },
        { label: 'HTML & CSS', description: 'Web design basics', value: 'html', emoji: '🌐' },
        { label: 'React', description: 'Frontend framework', value: 'react', emoji: '⚛️' },
        { label: 'Node.js', description: 'Backend development', value: 'nodejs', emoji: '🟢' },
        { label: 'SQL', description: 'Database queries', value: 'sql', emoji: '🗄️' },
        { label: 'Git', description: 'Version control', value: 'git', emoji: '📦' },
        { label: 'Random Mix', description: 'Surprise me!', value: 'random', emoji: '🎲' }
      ])
  );

  const backButton = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('action_back_help')
      .setLabel('Back to Help')
      .setEmoji('◀️')
      .setStyle(ButtonStyle.Secondary)
  );

  await interaction.update({ embeds: [embed], components: [topicMenu, backButton] });
}

// Show learn topic selector
async function showLearnSelector(interaction) {
  const embed = new EmbedBuilder()
    .setColor(0x5865F2)
    .setTitle('📚 Start Learning')
    .setDescription('**Choose a topic for an AI-generated lesson!**\n\n*Lessons are personalized and give you XP for completion.*')
    .setFooter({ text: '💡 Select a topic to learn' });

  const topicMenu = new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId('learn_topic_select')
      .setPlaceholder('📚 Choose a learning topic...')
      .addOptions([
        { label: 'JavaScript Basics', description: 'Variables, functions, loops', value: 'javascript-basics', emoji: '🟨' },
        { label: 'Python Fundamentals', description: 'Core Python concepts', value: 'python-basics', emoji: '🐍' },
        { label: 'Web Development', description: 'HTML, CSS, JS together', value: 'webdev', emoji: '🌐' },
        { label: 'Data Structures', description: 'Arrays, objects, maps', value: 'datastructures', emoji: '🔢' },
        { label: 'APIs & REST', description: 'Working with APIs', value: 'apis', emoji: '🔗' },
        { label: 'Databases', description: 'SQL & NoSQL basics', value: 'databases', emoji: '🗄️' },
        { label: 'Algorithms', description: 'Problem solving', value: 'algorithms', emoji: '🧮' },
        { label: 'Ask AI Anything', description: 'Custom topic', value: 'custom', emoji: '🤖' }
      ])
  );

  const backButton = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('action_back_help')
      .setLabel('Back to Help')
      .setEmoji('◀️')
      .setStyle(ButtonStyle.Secondary)
  );

  await interaction.update({ embeds: [embed], components: [topicMenu, backButton] });
}

// Show daily info
async function showDailyInfo(interaction) {
  const embed = new EmbedBuilder()
    .setColor(0x00D166)
    .setTitle('🎁 Daily Bonus')
    .setDescription(
      '**Claim your daily rewards!**\n\n' +
      '> 🌟 **+50 XP** base reward\n' +
      '> 🔥 **Streak Bonus** for consecutive days\n' +
      '> 🎲 **Random Bonus** chance for extra XP\n\n' +
      '*Come back every day to build your streak!*'
    )
    .addFields({ name: '💡 How to claim', value: 'Type `/daily` or click below!', inline: false })
    .setFooter({ text: 'Claim once every 24 hours' });

  const buttons = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('execute_daily')
      .setLabel('Claim Now!')
      .setEmoji('🎁')
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId('action_back_help')
      .setLabel('Back to Help')
      .setEmoji('◀️')
      .setStyle(ButtonStyle.Secondary)
  );

  await interaction.update({ embeds: [embed], components: [buttons] });
}

// Show profile preview
async function showProfilePreview(interaction) {
  const embed = new EmbedBuilder()
    .setColor(0x5865F2)
    .setTitle(`👤 ${interaction.user.username}'s Profile`)
    .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
    .setDescription('**View your complete stats and progress!**')
    .addFields(
      { name: '📊 What you\'ll see:', value: 
        '> 📈 Level & XP progress\n' +
        '> 🔥 Current streak\n' +
        '> 🎯 Quiz performance\n' +
        '> 🏆 Achievements unlocked', 
        inline: false 
      }
    )
    .setFooter({ text: 'Type /profile for detailed stats' });

  const buttons = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('execute_profile')
      .setLabel('View Full Profile')
      .setEmoji('👤')
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId('execute_progress')
      .setLabel('View Progress')
      .setEmoji('📈')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId('action_back_help')
      .setLabel('Back')
      .setEmoji('◀️')
      .setStyle(ButtonStyle.Secondary)
  );

  await interaction.update({ embeds: [embed], components: [buttons] });
}

// Show leaderboard info
async function showLeaderboardInfo(interaction) {
  const embed = new EmbedBuilder()
    .setColor(0xFFD700)
    .setTitle('🏆 Leaderboard')
    .setDescription(
      '**Compete with other learners!**\n\n' +
      '> 🥇 Top XP earners\n' +
      '> 🔥 Highest streaks\n' +
      '> 📊 Most quizzes completed\n\n' +
      '*Rise through the ranks!*'
    )
    .setFooter({ text: 'Click below to see rankings' });

  const buttons = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('execute_leaderboard')
      .setLabel('View Rankings')
      .setEmoji('🏆')
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId('action_back_help')
      .setLabel('Back')
      .setEmoji('◀️')
      .setStyle(ButtonStyle.Secondary)
  );

  await interaction.update({ embeds: [embed], components: [buttons] });
}

// Show achievements info
async function showAchievementsInfo(interaction) {
  const embed = new EmbedBuilder()
    .setColor(0xE91E63)
    .setTitle('🎖️ Achievements')
    .setDescription(
      '**Unlock achievements as you learn!**\n\n' +
      '> 🌟 **First Steps** - Complete your first quiz\n' +
      '> 🔥 **On Fire** - 7 day streak\n' +
      '> 🎯 **Sharpshooter** - 100% on a quiz\n' +
      '> 📚 **Bookworm** - Complete 10 lessons\n' +
      '> 🏆 **Champion** - Reach level 10'
    )
    .setFooter({ text: 'Collect them all!' });

  const buttons = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('execute_achievements')
      .setLabel('My Achievements')
      .setEmoji('🎖️')
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId('action_back_help')
      .setLabel('Back')
      .setEmoji('◀️')
      .setStyle(ButtonStyle.Secondary)
  );

  await interaction.update({ embeds: [embed], components: [buttons] });
}

// Show streak info
async function showStreakInfo(interaction) {
  const embed = new EmbedBuilder()
    .setColor(0xFF6B35)
    .setTitle('🔥 Daily Streak')
    .setDescription(
      '**Keep your learning streak alive!**\n\n' +
      'Streak bonuses:\n' +
      '> 📅 **3 days** → +10% XP\n' +
      '> 📅 **7 days** → +25% XP\n' +
      '> 📅 **30 days** → +50% XP\n' +
      '> 📅 **100 days** → +100% XP!'
    )
    .setFooter({ text: 'Complete activities daily!' });

  const buttons = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('execute_streak')
      .setLabel('Check Streak')
      .setEmoji('🔥')
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId('action_daily')
      .setLabel('Claim Daily')
      .setEmoji('🎁')
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId('action_back_help')
      .setLabel('Back')
      .setEmoji('◀️')
      .setStyle(ButtonStyle.Secondary)
  );

  await interaction.update({ embeds: [embed], components: [buttons] });
}

// Show topics info
async function showTopicsInfo(interaction) {
  const embed = new EmbedBuilder()
    .setColor(0x9B59B6)
    .setTitle('📖 Available Topics')
    .setDescription(
      '**Master these programming topics:**\n\n' +
      '**Languages:**\n' +
      '> 🟨 JavaScript • 🐍 Python • 🔷 TypeScript\n' +
      '> ☕ Java • 🔵 C++ • 🦀 Rust • 🐹 Go\n\n' +
      '**Web Development:**\n' +
      '> ⚛️ React • 💚 Vue • 🅰️ Angular • 🔥 Svelte\n' +
      '> 🟢 Node.js • 🌐 HTML/CSS • 🎨 Tailwind\n\n' +
      '**Other:**\n' +
      '> 🗄️ SQL/Databases • 📦 Git • ☁️ Cloud • 🤖 AI/ML'
    )
    .setFooter({ text: 'Pick a topic and start learning!' });

  const buttons = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('action_quiz')
      .setLabel('Take Quiz')
      .setEmoji('🎯')
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId('action_learn')
      .setLabel('Start Lesson')
      .setEmoji('📚')
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId('action_back_help')
      .setLabel('Back')
      .setEmoji('◀️')
      .setStyle(ButtonStyle.Secondary)
  );

  await interaction.update({ embeds: [embed], components: [buttons] });
}

// Handle category selection
export async function handleCategorySelect(interaction, category) {
  let embed;
  
  switch(category) {
    case 'learning':
      embed = new EmbedBuilder()
        .setColor(0x5865F2)
        .setTitle('📚 Learning Commands')
        .setDescription('Master any programming topic with AI!')
        .addFields(
          { name: '</learn:0>', value: '📖 Get an AI lesson on any topic', inline: false },
          { name: '</explain:0>', value: '💡 Detailed concept explanation', inline: false },
          { name: '</topics:0>', value: '📋 Browse available topics', inline: false },
          { name: '</path:0>', value: '🛤️ Your learning path', inline: false }
        );
      break;
      
    case 'quizzes':
      embed = new EmbedBuilder()
        .setColor(0x00D166)
        .setTitle('🎯 Quiz Commands')
        .setDescription('Test your knowledge and earn XP!')
        .addFields(
          { name: '</quiz:0>', value: '🎯 Start a quiz on any topic', inline: false },
          { name: '</challenge:0>', value: '⚔️ 1v1 quiz battle', inline: false },
          { name: '</studyparty:0>', value: '🎉 Group study session', inline: false }
        );
      break;
      
    case 'progress':
      embed = new EmbedBuilder()
        .setColor(0xF1C40F)
        .setTitle('📈 Progress Commands')
        .setDescription('Track your learning journey!')
        .addFields(
          { name: '</profile:0>', value: '👤 Your complete profile', inline: false },
          { name: '</progress:0>', value: '📊 Detailed progress', inline: false },
          { name: '</streak:0>', value: '🔥 Daily streak', inline: false },
          { name: '</achievements:0>', value: '🎖️ Your achievements', inline: false },
          { name: '</daily:0>', value: '🎁 Daily bonus', inline: false }
        );
      break;
      
    case 'social':
      embed = new EmbedBuilder()
        .setColor(0xE91E63)
        .setTitle('👥 Social Commands')
        .setDescription('Learn together with friends!')
        .addFields(
          { name: '</leaderboard:0>', value: '🏆 Server rankings', inline: false },
          { name: '</challenge:0>', value: '⚔️ 1v1 quiz battle', inline: false },
          { name: '</studyparty:0>', value: '🎉 Group learning', inline: false },
          { name: '</invite:0>', value: '📨 Invite MentorAI', inline: false }
        );
      break;
      
    case 'all':
      embed = new EmbedBuilder()
        .setColor(0x9B59B6)
        .setTitle('📋 All Commands')
        .setDescription('Complete command list')
        .addFields(
          { name: '📚 Learning', value: '`/learn` `/explain` `/topics` `/path`', inline: true },
          { name: '🎯 Quizzes', value: '`/quiz` `/challenge` `/studyparty`', inline: true },
          { name: '📈 Progress', value: '`/profile` `/progress` `/streak` `/daily` `/achievements`', inline: true },
          { name: '👥 Social', value: '`/leaderboard` `/invite`', inline: true },
          { name: '⚙️ Utility', value: '`/help` `/ping` `/feedback` `/setup`', inline: true },
          { name: '🔧 Admin', value: '`/stats` `/admin`', inline: true }
        );
      break;
      
    default:
      embed = new EmbedBuilder()
        .setColor(0x5865F2)
        .setTitle('📖 Help')
        .setDescription('Select a category from the menu.');
  }
  
  embed.setFooter({ text: '💡 Click buttons to try commands!' });

  const categoryMenu = new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId('help_category')
      .setPlaceholder('📂 Browse categories...')
      .addOptions([
        { label: 'Learning', description: 'AI lessons', value: 'learning', emoji: '📚' },
        { label: 'Quizzes', description: 'Test knowledge', value: 'quizzes', emoji: '🎯' },
        { label: 'Progress', description: 'XP & achievements', value: 'progress', emoji: '📈' },
        { label: 'Social', description: 'Leaderboards', value: 'social', emoji: '👥' },
        { label: 'All Commands', description: 'Full list', value: 'all', emoji: '📋' }
      ])
  );

  const buttons = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('action_quiz')
      .setLabel('Quiz')
      .setEmoji('🎯')
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId('action_learn')
      .setLabel('Learn')
      .setEmoji('📚')
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId('action_back_help')
      .setLabel('Main Menu')
      .setEmoji('🏠')
      .setStyle(ButtonStyle.Secondary)
  );

  await interaction.update({ embeds: [embed], components: [categoryMenu, buttons] });
}
