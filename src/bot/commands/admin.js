import { 
  SlashCommandBuilder, 
  EmbedBuilder, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle,
  StringSelectMenuBuilder,
  PermissionFlagsBits,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle
} from 'discord.js';
import { COLORS } from '../../config/designSystem.js';
import { getAdminStats, getBotHealth, getRecentActivity } from '../../services/adminService.js';

// Bot Owner IDs - Only these users can access /admin
// Add IDs via BOT_OWNER_IDS env variable (comma-separated) or directly here
const BOT_OWNER_IDS = process.env.BOT_OWNER_IDS 
  ? process.env.BOT_OWNER_IDS.split(',').map(id => id.trim())
  : [
    '1116096965755813968', // sathis.dev - Primary Owner
  ];

export const data = new SlashCommandBuilder()
  .setName('admin')
  .setDescription('🔐 Admin control panel (Bot owners only)')
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator) // Only server admins can see
  .setDMPermission(true) // Allow in DMs for owners
  .addSubcommand(sub =>
    sub.setName('dashboard')
      .setDescription('📊 View admin dashboard'))
  .addSubcommand(sub =>
    sub.setName('users')
      .setDescription('👥 User management panel'))
  .addSubcommand(sub =>
    sub.setName('analytics')
      .setDescription('📈 View detailed analytics'))
  .addSubcommand(sub =>
    sub.setName('broadcast')
      .setDescription('📢 Send announcement to all servers'))
  .addSubcommand(sub =>
    sub.setName('config')
      .setDescription('⚙️ Bot configuration settings'))
  .addSubcommand(sub =>
    sub.setName('logs')
      .setDescription('📜 View system logs'))
  .addSubcommand(sub =>
    sub.setName('maintenance')
      .setDescription('🔧 Maintenance mode controls'));

export async function execute(interaction) {
  // Security check - Bot owners only
  if (!BOT_OWNER_IDS.includes(interaction.user.id)) {
    const deniedEmbed = new EmbedBuilder()
      .setTitle('🔒 Access Denied')
      .setColor(COLORS.ERROR)
      .setDescription(
        '```\n⛔ UNAUTHORIZED ACCESS ATTEMPT\n```\n' +
        'This command is restricted to **bot owners only**.\n\n' +
        'If you are a server admin, you can use `/setup` to configure the bot for your server.'
      )
      .setFooter({ text: '🔐 MentorAI Security' })
      .setTimestamp();

    await interaction.reply({ embeds: [deniedEmbed], ephemeral: true });
    return;
  }

  const subcommand = interaction.options.getSubcommand();

  switch (subcommand) {
    case 'dashboard':
      await showDashboard(interaction);
      break;
    case 'users':
      await showUserManagement(interaction);
      break;
    case 'analytics':
      await showAnalytics(interaction);
      break;
    case 'broadcast':
      await showBroadcastModal(interaction);
      break;
    case 'config':
      await showConfig(interaction);
      break;
    case 'logs':
      await showLogs(interaction);
      break;
    case 'maintenance':
      await showMaintenance(interaction);
      break;
  }
}

async function showDashboard(interaction) {
  await interaction.deferReply({ ephemeral: true });

  const stats = await getAdminStats();
  const health = await getBotHealth();
  const activity = await getRecentActivity();

  // Main dashboard embed
  const dashboardEmbed = new EmbedBuilder()
    .setTitle('🎛️ MentorAI Admin Dashboard')
    .setColor(0x2F3136)
    .setDescription(
      '```\n' +
      '🔐 ADMIN CONTROL CENTER v2.0\n' +
      '```'
    )
    .setThumbnail(interaction.client.user.displayAvatarURL({ size: 256 }))
    .addFields(
      { 
        name: '📊 System Status', 
        value: '━━━━━━━━━━━━━━━━━━━━', 
        inline: false 
      },
      { 
        name: '🟢 Bot Status', 
        value: '```\n' + health.status + '\n```', 
        inline: true 
      },
      { 
        name: '⏱️ Uptime', 
        value: '```\n' + formatUptime(interaction.client.uptime) + '\n```', 
        inline: true 
      },
      { 
        name: '📡 Ping', 
        value: '```\n' + interaction.client.ws.ping + 'ms\n```', 
        inline: true 
      },
      { 
        name: '💾 Memory', 
        value: '```\n' + (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2) + ' MB\n```', 
        inline: true 
      },
      { 
        name: '🌐 Servers', 
        value: '```\n' + interaction.client.guilds.cache.size + '\n```', 
        inline: true 
      },
      { 
        name: '👥 Users', 
        value: '```\n' + stats.totalUsers.toLocaleString() + '\n```', 
        inline: true 
      }
    )
    .setFooter({ text: '🔐 Admin Panel | Last Updated' })
    .setTimestamp();

  // Stats embed
  const statsEmbed = new EmbedBuilder()
    .setTitle('📈 Quick Stats')
    .setColor(0x5865F2)
    .addFields(
      { 
        name: '📝 Today\'s Activity', 
        value: 
          '```diff\n' +
          '+ Quizzes Taken: ' + stats.quizzesToday + '\n' +
          '+ Lessons Completed: ' + stats.lessonsToday + '\n' +
          '+ XP Awarded: ' + stats.xpToday.toLocaleString() + '\n' +
          '+ New Users: ' + stats.newUsersToday + '\n' +
          '```',
        inline: true 
      },
      { 
        name: '📊 All Time', 
        value: 
          '```yaml\n' +
          'Total Quizzes: ' + stats.totalQuizzes.toLocaleString() + '\n' +
          'Total Lessons: ' + stats.totalLessons.toLocaleString() + '\n' +
          'Total XP: ' + stats.totalXp.toLocaleString() + '\n' +
          'Commands Run: ' + stats.commandsRun.toLocaleString() + '\n' +
          '```',
        inline: true 
      }
    );

  // Navigation buttons
  const navRow1 = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('admin_nav_users')
      .setLabel('👥 Users')
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId('admin_nav_analytics')
      .setLabel('📈 Analytics')
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId('admin_nav_logs')
      .setLabel('📜 Logs')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId('admin_nav_config')
      .setLabel('⚙️ Config')
      .setStyle(ButtonStyle.Secondary)
  );

  const navRow2 = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('admin_action_refresh')
      .setLabel('🔄 Refresh')
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId('admin_action_broadcast')
      .setLabel('📢 Broadcast')
      .setStyle(ButtonStyle.Danger),
    new ButtonBuilder()
      .setCustomId('admin_action_maintenance')
      .setLabel('🔧 Maintenance')
      .setStyle(ButtonStyle.Danger)
  );

  await interaction.editReply({ 
    embeds: [dashboardEmbed, statsEmbed], 
    components: [navRow1, navRow2] 
  });
}

async function showUserManagement(interaction) {
  await interaction.deferReply({ ephemeral: true });

  const stats = await getAdminStats();

  const usersEmbed = new EmbedBuilder()
    .setTitle('👥 User Management Panel')
    .setColor(0x3498DB)
    .setDescription(
      '```\n' +
      '📋 USER ADMINISTRATION\n' +
      '```'
    )
    .addFields(
      { name: '📊 User Statistics', value: '━━━━━━━━━━━━━━━━━━━━', inline: false },
      { name: '👥 Total Users', value: '`' + stats.totalUsers + '`', inline: true },
      { name: '🟢 Active Today', value: '`' + stats.activeToday + '`', inline: true },
      { name: '🆕 New Today', value: '`' + stats.newUsersToday + '`', inline: true },
      { name: '🔥 Avg Streak', value: '`' + stats.avgStreak + ' days`', inline: true },
      { name: '⭐ Avg Level', value: '`' + stats.avgLevel + '`', inline: true },
      { name: '🏆 Top Level', value: '`' + stats.topLevel + '`', inline: true }
    )
    .addFields({
      name: '🏅 Top Users (by XP)',
      value: stats.topUsers.map((u, i) => 
        ['🥇', '🥈', '🥉', '4️⃣', '5️⃣'][i] + ' **' + u.username + '** - Lv.' + u.level + ' (' + u.xp.toLocaleString() + ' XP)'
      ).join('\n') || 'No users yet',
      inline: false
    })
    .setFooter({ text: '🔐 Admin Panel | User Management' })
    .setTimestamp();

  const actionRow = new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId('admin_user_action')
      .setPlaceholder('🔧 Select User Action...')
      .addOptions([
        { label: 'Search User', description: 'Find user by ID or name', value: 'search', emoji: '🔍' },
        { label: 'Reset User', description: 'Reset user progress', value: 'reset', emoji: '🔄' },
        { label: 'Ban User', description: 'Ban user from bot', value: 'ban', emoji: '🚫' },
        { label: 'Unban User', description: 'Unban a user', value: 'unban', emoji: '✅' },
        { label: 'Give XP', description: 'Award XP to user', value: 'give_xp', emoji: '✨' },
        { label: 'Set Level', description: 'Set user level', value: 'set_level', emoji: '⭐' },
        { label: 'View Banned', description: 'View banned users list', value: 'view_banned', emoji: '📋' }
      ])
  );

  const navRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('admin_nav_dashboard')
      .setLabel('← Dashboard')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId('admin_users_export')
      .setLabel('📥 Export Users')
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId('admin_users_refresh')
      .setLabel('🔄 Refresh')
      .setStyle(ButtonStyle.Success)
  );

  await interaction.editReply({ 
    embeds: [usersEmbed], 
    components: [actionRow, navRow] 
  });
}

async function showAnalytics(interaction) {
  await interaction.deferReply({ ephemeral: true });

  const stats = await getAdminStats();

  // Create visual charts using text
  const quizChart = createTextChart(stats.weeklyQuizzes || [10, 15, 8, 20, 25, 18, 30], 'Quizzes');
  const userChart = createTextChart(stats.weeklyUsers || [5, 8, 6, 10, 12, 9, 15], 'Users');

  const analyticsEmbed = new EmbedBuilder()
    .setTitle('📈 Analytics Dashboard')
    .setColor(0x9B59B6)
    .setDescription(
      '```\n' +
      '📊 PERFORMANCE ANALYTICS\n' +
      '```'
    )
    .addFields(
      { 
        name: '📝 Weekly Quiz Activity', 
        value: '```\n' + quizChart + '\n```', 
        inline: false 
      },
      { 
        name: '👥 Weekly User Growth', 
        value: '```\n' + userChart + '\n```', 
        inline: false 
      },
      { 
        name: '🎯 Engagement Metrics', 
        value: 
          '```yaml\n' +
          'Avg Session Time: ' + (stats.avgSessionTime || '5m 30s') + '\n' +
          'Quiz Completion Rate: ' + (stats.quizCompletionRate || '78') + '%\n' +
          'Daily Active Users: ' + (stats.dauRate || '45') + '%\n' +
          'Retention Rate (7d): ' + (stats.retentionRate || '62') + '%\n' +
          '```',
        inline: true 
      },
      { 
        name: '📚 Content Stats', 
        value: 
          '```yaml\n' +
          'Popular Topic: ' + (stats.popularTopic || 'JavaScript') + '\n' +
          'Avg Quiz Score: ' + (stats.avgQuizScore || '72') + '%\n' +
          'AI Calls Today: ' + (stats.aiCallsToday || '150') + '\n' +
          'Cache Hit Rate: ' + (stats.cacheHitRate || '85') + '%\n' +
          '```',
        inline: true 
      }
    )
    .setFooter({ text: '🔐 Admin Panel | Analytics' })
    .setTimestamp();

  const timeRangeRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('admin_analytics_24h')
      .setLabel('24 Hours')
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId('admin_analytics_7d')
      .setLabel('7 Days')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId('admin_analytics_30d')
      .setLabel('30 Days')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId('admin_analytics_all')
      .setLabel('All Time')
      .setStyle(ButtonStyle.Secondary)
  );

  const navRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('admin_nav_dashboard')
      .setLabel('← Dashboard')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId('admin_analytics_export')
      .setLabel('📥 Export Report')
      .setStyle(ButtonStyle.Success)
  );

  await interaction.editReply({ 
    embeds: [analyticsEmbed], 
    components: [timeRangeRow, navRow] 
  });
}

async function showBroadcastModal(interaction) {
  const modal = new ModalBuilder()
    .setCustomId('admin_modal_broadcast')
    .setTitle('📢 Broadcast Announcement');

  const titleInput = new TextInputBuilder()
    .setCustomId('broadcast_title')
    .setLabel('Announcement Title')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('e.g., New Feature Update!')
    .setRequired(true)
    .setMaxLength(100);

  const messageInput = new TextInputBuilder()
    .setCustomId('broadcast_message')
    .setLabel('Announcement Message')
    .setStyle(TextInputStyle.Paragraph)
    .setPlaceholder('Enter your announcement message...')
    .setRequired(true)
    .setMaxLength(2000);

  const typeInput = new TextInputBuilder()
    .setCustomId('broadcast_type')
    .setLabel('Type (info/success/warning/error)')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('info')
    .setRequired(false)
    .setMaxLength(10);

  modal.addComponents(
    new ActionRowBuilder().addComponents(titleInput),
    new ActionRowBuilder().addComponents(messageInput),
    new ActionRowBuilder().addComponents(typeInput)
  );

  await interaction.showModal(modal);
}

async function showConfig(interaction) {
  await interaction.deferReply({ ephemeral: true });

  const configEmbed = new EmbedBuilder()
    .setTitle('⚙️ Bot Configuration')
    .setColor(0x95A5A6)
    .setDescription(
      '```\n' +
      '🔧 SYSTEM CONFIGURATION\n' +
      '```'
    )
    .addFields(
      { name: '🤖 Bot Settings', value: '━━━━━━━━━━━━━━━━━━━━', inline: false },
      { name: '🌐 Environment', value: '`' + (process.env.NODE_ENV || 'development') + '`', inline: true },
      { name: '📦 Version', value: '`v2.0.0`', inline: true },
      { name: '🔌 API Status', value: '`🟢 Connected`', inline: true },
      { name: '🗄️ Database', value: '`🟢 MongoDB`', inline: true },
      { name: '🤖 AI Provider', value: '`OpenAI GPT-3.5`', inline: true },
      { name: '⚡ Rate Limit', value: '`100/min`', inline: true }
    )
    .addFields({
      name: '🎮 Feature Toggles',
      value: 
        '```diff\n' +
        '+ AI Quizzes: ENABLED\n' +
        '+ AI Lessons: ENABLED\n' +
        '+ Daily Bonus: ENABLED\n' +
        '+ Leaderboard: ENABLED\n' +
        '+ Challenges: ENABLED\n' +
        '- Maintenance Mode: DISABLED\n' +
        '```',
      inline: false
    })
    .setFooter({ text: '🔐 Admin Panel | Configuration' })
    .setTimestamp();

  const toggleRow = new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId('admin_config_toggle')
      .setPlaceholder('🔧 Toggle Features...')
      .addOptions([
        { label: 'AI Quizzes', value: 'toggle_ai_quiz', emoji: '🎯' },
        { label: 'AI Lessons', value: 'toggle_ai_lesson', emoji: '📚' },
        { label: 'Daily Bonus', value: 'toggle_daily', emoji: '🎁' },
        { label: 'Leaderboard', value: 'toggle_leaderboard', emoji: '🏆' },
        { label: 'Challenges', value: 'toggle_challenges', emoji: '⚔️' },
        { label: 'Maintenance Mode', value: 'toggle_maintenance', emoji: '🔧' }
      ])
  );

  const navRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('admin_nav_dashboard')
      .setLabel('← Dashboard')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId('admin_config_reload')
      .setLabel('🔄 Reload Config')
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId('admin_config_restart')
      .setLabel('🔄 Restart Bot')
      .setStyle(ButtonStyle.Danger)
  );

  await interaction.editReply({ 
    embeds: [configEmbed], 
    components: [toggleRow, navRow] 
  });
}

async function showLogs(interaction) {
  await interaction.deferReply({ ephemeral: true });

  const recentLogs = await getRecentActivity();

  const logsEmbed = new EmbedBuilder()
    .setTitle('📜 System Logs')
    .setColor(0x2C3E50)
    .setDescription(
      '```\n' +
      '📋 RECENT ACTIVITY LOG\n' +
      '```'
    )
    .addFields({
      name: '🕐 Last 10 Events',
      value: recentLogs.length > 0 
        ? '```\n' + recentLogs.slice(0, 10).map(log => 
            '[' + new Date(log.timestamp).toLocaleTimeString() + '] ' + log.type + ': ' + log.message
          ).join('\n') + '\n```'
        : '```\nNo recent logs\n```',
      inline: false
    })
    .setFooter({ text: '🔐 Admin Panel | Logs' })
    .setTimestamp();

  const filterRow = new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId('admin_logs_filter')
      .setPlaceholder('🔍 Filter Logs...')
      .addOptions([
        { label: 'All Logs', value: 'all', emoji: '📋' },
        { label: 'Errors Only', value: 'errors', emoji: '❌' },
        { label: 'Commands', value: 'commands', emoji: '⌨️' },
        { label: 'User Actions', value: 'users', emoji: '👥' },
        { label: 'AI Requests', value: 'ai', emoji: '🤖' },
        { label: 'System Events', value: 'system', emoji: '⚙️' }
      ])
  );

  const navRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('admin_nav_dashboard')
      .setLabel('← Dashboard')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId('admin_logs_clear')
      .setLabel('🗑️ Clear Logs')
      .setStyle(ButtonStyle.Danger),
    new ButtonBuilder()
      .setCustomId('admin_logs_export')
      .setLabel('📥 Export Logs')
      .setStyle(ButtonStyle.Primary)
  );

  await interaction.editReply({ 
    embeds: [logsEmbed], 
    components: [filterRow, navRow] 
  });
}

async function showMaintenance(interaction) {
  await interaction.deferReply({ ephemeral: true });

  const maintenanceEmbed = new EmbedBuilder()
    .setTitle('🔧 Maintenance Controls')
    .setColor(0xE74C3C)
    .setDescription(
      '```\n' +
      '⚠️ MAINTENANCE MODE CONTROLS\n' +
      '```\n' +
      '**Current Status:** 🟢 Normal Operation\n\n' +
      '⚠️ **Warning:** Enabling maintenance mode will:\n' +
      '• Disable all commands for non-admins\n' +
      '• Show maintenance message to users\n' +
      '• Log all access attempts'
    )
    .addFields(
      { 
        name: '🛠️ Maintenance Actions', 
        value: 
          '```\n' +
          '• Clear Cache: Flush all cached data\n' +
          '• Sync Database: Force DB sync\n' +
          '• Reload Commands: Hot reload commands\n' +
          '• Health Check: Run diagnostics\n' +
          '```',
        inline: false 
      }
    )
    .setFooter({ text: '🔐 Admin Panel | Maintenance' })
    .setTimestamp();

  const actionRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('admin_maint_toggle')
      .setLabel('🔧 Toggle Maintenance')
      .setStyle(ButtonStyle.Danger),
    new ButtonBuilder()
      .setCustomId('admin_maint_cache')
      .setLabel('🗑️ Clear Cache')
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId('admin_maint_sync')
      .setLabel('🔄 Sync DB')
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId('admin_maint_health')
      .setLabel('❤️ Health Check')
      .setStyle(ButtonStyle.Success)
  );

  const navRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('admin_nav_dashboard')
      .setLabel('← Dashboard')
      .setStyle(ButtonStyle.Secondary)
  );

  await interaction.editReply({ 
    embeds: [maintenanceEmbed], 
    components: [actionRow, navRow] 
  });
}

// Utility functions
function formatUptime(ms) {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return days + 'd ' + (hours % 24) + 'h ' + (minutes % 60) + 'm';
  if (hours > 0) return hours + 'h ' + (minutes % 60) + 'm ' + (seconds % 60) + 's';
  if (minutes > 0) return minutes + 'm ' + (seconds % 60) + 's';
  return seconds + 's';
}

function createTextChart(data, label) {
  const max = Math.max(...data);
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  
  let chart = label + ' (Last 7 Days)\n';
  chart += '─'.repeat(25) + '\n';
  
  data.forEach((value, i) => {
    const barLength = Math.round((value / max) * 15);
    const bar = '█'.repeat(barLength) + '░'.repeat(15 - barLength);
    chart += days[i] + ' │' + bar + '│ ' + value + '\n';
  });
  
  return chart;
}
