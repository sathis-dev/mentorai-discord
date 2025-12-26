import express from 'express';
import { User } from '../../database/models/User.js';

const router = express.Router();

// In-memory storage for non-persistent data
const systemLogs = [];
const botConfig = {
  maintenanceMode: false,
  features: {
    aiQuizzes: true,
    aiLessons: true,
    dailyBonus: true,
    leaderboard: true,
    challenges: true,
    studyParties: true
  },
  xpMultiplier: 1,
  maxQuestionsPerQuiz: 10
};

// Helper function - NOT exported here, will be exported at the end
async function getAdminStats() {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
  const monthAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);

  try {
    const [totalUsers, activeToday, newToday, newWeek, newMonth] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ lastActive: { $gte: todayStart } }),
      User.countDocuments({ createdAt: { $gte: todayStart } }),
      User.countDocuments({ createdAt: { $gte: weekAgo } }),
      User.countDocuments({ createdAt: { $gte: monthAgo } })
    ]);

    const agg = await User.aggregate([
      { $group: { _id: null, totalXp: { $sum: '$xp' }, avgLevel: { $avg: '$level' }, avgStreak: { $avg: '$streak' }, totalQuizzes: { $sum: '$quizzesTaken' }, totalCorrect: { $sum: '$correctAnswers' }, totalQuestions: { $sum: '$totalQuestions' } } }
    ]).catch(() => [{}]);

    const stats = agg[0] || {};

    return {
      users: { total: totalUsers, activeToday, newToday, newWeek, newMonth },
      metrics: { totalXp: stats.totalXp || 0, avgLevel: Math.round((stats.avgLevel || 1) * 10) / 10, avgStreak: Math.round((stats.avgStreak || 0) * 10) / 10, totalQuizzes: stats.totalQuizzes || 0, accuracy: stats.totalQuestions > 0 ? Math.round((stats.totalCorrect / stats.totalQuestions) * 100) : 0 },
      system: { uptime: process.uptime(), memory: process.memoryUsage(), nodeVersion: process.version, maintenanceMode: botConfig.maintenanceMode }
    };
  } catch (e) {
    return { users: { total: 0, activeToday: 0, newToday: 0, newWeek: 0, newMonth: 0 }, metrics: { totalXp: 0, avgLevel: 1, avgStreak: 0, totalQuizzes: 0, accuracy: 0 }, system: { uptime: process.uptime(), memory: process.memoryUsage(), nodeVersion: process.version, maintenanceMode: false } };
  }
}

// Log helper function
function addLog(type, message, user = 'System') {
  systemLogs.unshift({ id: Date.now(), type, message, user, timestamp: new Date() });
  if (systemLogs.length > 500) systemLogs.pop();
}

// ============================================================
// STATS
// ============================================================
router.get('/stats', async (req, res) => {
  try {
    const stats = await getAdminStats();
    res.json(stats);
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// User Growth Chart - Shows CUMULATIVE user growth over time
router.get('/stats/chart', async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 7;
    const data = [];
    
    // Get total users before the period
    const periodStart = new Date();
    periodStart.setDate(periodStart.getDate() - days);
    periodStart.setHours(0, 0, 0, 0);
    
    const usersBeforePeriod = await User.countDocuments({ createdAt: { $lt: periodStart } });
    let cumulativeCount = usersBeforePeriod;
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
      
      // Count new users that day
      const newUsersThisDay = await User.countDocuments({ createdAt: { $gte: dayStart, $lt: dayEnd } });
      cumulativeCount += newUsersThisDay;
      
      data.push({ 
        date: dayStart.toISOString().split('T')[0], 
        count: cumulativeCount,
        newUsers: newUsersThisDay
      });
    }
    
    res.json(data);
  } catch (e) {
    console.error('Chart data error:', e);
    res.json([]);
  }
});

// Activity Chart - Real activity data
router.get('/stats/activity', async (req, res) => {
  try {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
    
    // Get real activity data
    const [quizzesToday, activeToday, newToday, quizzesWeek, activeWeek, newWeek] = await Promise.all([
      User.aggregate([
        { $match: { lastActive: { $gte: todayStart } } },
        { $group: { _id: null, total: { $sum: '$quizzesTaken' } } }
      ]).then(r => r[0]?.total || 0),
      User.countDocuments({ lastActive: { $gte: todayStart } }),
      User.countDocuments({ createdAt: { $gte: todayStart } }),
      User.aggregate([
        { $match: { lastActive: { $gte: weekAgo } } },
        { $group: { _id: null, total: { $sum: '$quizzesTaken' } } }
      ]).then(r => r[0]?.total || 0),
      User.countDocuments({ lastActive: { $gte: weekAgo } }),
      User.countDocuments({ createdAt: { $gte: weekAgo } })
    ]);
    
    res.json({
      today: { quizzes: quizzesToday, active: activeToday, newUsers: newToday },
      week: { quizzes: quizzesWeek, active: activeWeek, newUsers: newWeek }
    });
  } catch (e) {
    res.json({ today: { quizzes: 0, active: 0, newUsers: 0 }, week: { quizzes: 0, active: 0, newUsers: 0 } });
  }
});

// Recent Users - Properly sorted by createdAt descending
router.get('/users/recent', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 5;
    const users = await User.find()
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
    
    res.json({ users: users.map(u => ({ ...u, banned: bannedUsers.has(u.discordId) })) });
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch recent users', users: [] });
  }
});

// ============================================================
// USERS
// ============================================================
router.get('/users', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const search = req.query.search || '';
    const sortBy = req.query.sortBy || 'level';
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;

    const query = search ? { $or: [{ username: { $regex: search, $options: 'i' } }, { discordId: search }] } : {};

    const [users, total] = await Promise.all([
      User.find(query).sort({ [sortBy]: sortOrder }).skip((page - 1) * limit).limit(limit).lean(),
      User.countDocuments(query)
    ]);

    res.json({ users: users.map(u => ({ ...u, banned: u.banned || false })), pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// IMPORTANT: Put specific routes BEFORE parameterized routes
// Move this route BEFORE router.get('/users/:id')
router.get('/users/banned/list', async (req, res) => {
  try {
    const bannedUsers = await User.find({ banned: true })
      .select('discordId username bannedAt bannedReason bannedBy')
      .lean();
    const list = bannedUsers.map(u => ({
      discordId: u.discordId,
      username: u.username,
      reason: u.bannedReason || 'No reason provided',
      date: u.bannedAt,
      by: u.bannedBy || 'Admin'
    }));
    res.json(list);
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch banned users' });
  }
});

// Then the parameterized route
router.get('/users/:id', async (req, res) => {
  try {
    const user = await User.findOne({ discordId: req.params.id }).lean();
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ ...user, banned: user.banned || false });
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

router.patch('/users/:id', async (req, res) => {
  try {
    const { xp, level, streak, banned } = req.body;
    const update = {};
    if (xp !== undefined) update.xp = parseInt(xp);
    if (level !== undefined) update.level = parseInt(level);
    if (streak !== undefined) update.streak = parseInt(streak);

    if (banned !== undefined) {
      update.banned = banned;
      if (banned) {
        update.bannedAt = new Date();
        update.bannedReason = 'Admin action';
        update.bannedBy = req.user?.username || 'Admin';
      } else {
        update.bannedAt = null;
        update.bannedReason = null;
        update.bannedBy = null;
      }
    }

    const user = await User.findOneAndUpdate({ discordId: req.params.id }, { $set: update }, { new: true });
    if (!user) return res.status(404).json({ error: 'User not found' });

    addLog('USER', `Updated user ${req.params.id}`, req.user?.username || 'Admin');
    req.app.get('io')?.emit('userUpdated', user);
    res.json({ success: true, user });
  } catch (e) {
    res.status(500).json({ error: 'Failed to update user' });
  }
});

router.delete('/users/:id', async (req, res) => {
  try {
    await User.deleteOne({ discordId: req.params.id });
    addLog('USER', `Deleted user ${req.params.id}`, req.user?.username || 'Admin');
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

router.post('/users/:id/reset', async (req, res) => {
  try {
    const user = await User.findOneAndUpdate(
      { discordId: req.params.id },
      { $set: { xp: 0, level: 1, streak: 0, quizzesTaken: 0, correctAnswers: 0, totalQuestions: 0, achievements: [], completedLessons: [], topicsStudied: [] } },
      { new: true }
    );
    addLog('USER', `Reset user ${req.params.id}`, req.user?.username || 'Admin');
    res.json({ success: true, user });
  } catch (e) {
    res.status(500).json({ error: 'Failed to reset user' });
  }
});

router.post('/users/:id/give-xp', async (req, res) => {
  try {
    const amount = parseInt(req.body.amount);
    const reason = req.body.reason || 'reward';
    const note = req.body.note || '';
    
    if (!amount || amount < 1 || amount > 100000) {
      return res.status(400).json({ error: 'Invalid XP amount (1-100000)' });
    }
    
    const user = await User.findOne({ discordId: req.params.id });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const oldXp = user.xp;
    const oldLevel = user.level;
    
    user.xp = (user.xp || 0) + amount;
    let leveledUp = false;
    let xpNeeded = Math.floor(100 * Math.pow(1.5, (user.level || 1) - 1));
    while (user.xp >= xpNeeded) {
      user.xp -= xpNeeded;
      user.level = (user.level || 1) + 1;
      xpNeeded = Math.floor(100 * Math.pow(1.5, user.level - 1));
      leveledUp = true;
    }
    await user.save();

    const logMsg = `Gave ${amount} XP to ${user.username}${reason !== 'reward' ? ' (' + reason + ')' : ''}${note ? ': ' + note : ''}`;
    console.log(`💰 Admin: ${logMsg}`);
    addLog('USER', logMsg, req.user?.username || 'Admin');
    
    // Emit real-time update to all connected clients
    req.app.get('io')?.emit('userUpdate', { 
      user: user.toObject(), 
      action: 'xp_given', 
      details: { amount, reason, note, oldXp, newXp: user.xp, oldLevel, newLevel: user.level, leveledUp },
      timestamp: new Date() 
    });
    
    res.json({ success: true, user, leveledUp, oldLevel, newLevel: user.level });
  } catch (e) {
    console.error('Give XP error:', e);
    res.status(500).json({ error: 'Failed to give XP' });
  }
});

router.post('/users/:id/set-level', async (req, res) => {
  try {
    const level = parseInt(req.body.level);
    const user = await User.findOneAndUpdate({ discordId: req.params.id }, { $set: { level, xp: 0 } }, { new: true });
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    console.log(`⬆️ Admin set ${user.username} to level ${level}`);
    addLog('USER', `Set ${user.username} (${req.params.id}) to level ${level}`, req.user?.username || 'Admin');
    
    // Emit real-time update
    req.app.get('io')?.emit('userUpdate', { 
      user: user.toObject(), 
      action: 'level_set', 
      details: { newLevel: level },
      timestamp: new Date() 
    });
    
    res.json({ success: true, user });
  } catch (e) {
    res.status(500).json({ error: 'Failed to set level' });
  }
});

// Level up user by 1 level
router.post('/users/:id/level-up', async (req, res) => {
  try {
    const user = await User.findOne({ discordId: req.params.id });
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    const oldLevel = user.level || 1;
    user.level = oldLevel + 1;
    user.xp = 0; // Reset XP for new level
    await user.save();
    
    console.log(`🎊 Admin leveled up ${user.username} from ${oldLevel} to ${user.level}`);
    addLog('USER', `Leveled up ${user.username} (${req.params.id}) to level ${user.level}`, req.user?.username || 'Admin');
    
    // Emit real-time update
    req.app.get('io')?.emit('userUpdate', { 
      user: user.toObject(), 
      action: 'level_up', 
      details: { oldLevel, newLevel: user.level },
      timestamp: new Date() 
    });
    
    res.json({ success: true, user, oldLevel, newLevel: user.level });
  } catch (e) {
    res.status(500).json({ error: 'Failed to level up user' });
  }
});

router.post('/users/:id/ban', async (req, res) => {
  try {
    const reason = req.body.reason || 'No reason provided';
    const user = await User.findOneAndUpdate(
      { discordId: req.params.id },
      {
        $set: {
          banned: true,
          bannedAt: new Date(),
          bannedReason: reason,
          bannedBy: req.user?.username || 'Admin'
        }
      },
      { new: true }
    );
    if (!user) return res.status(404).json({ error: 'User not found' });
    addLog('MODERATION', `Banned user ${user.username} (${req.params.id}): ${reason}`, req.user?.username || 'Admin');
    req.app.get('io')?.emit('userBanned', { userId: req.params.id, username: user.username, reason });
    res.json({ success: true, user });
  } catch (e) {
    res.status(500).json({ error: 'Failed to ban user' });
  }
});

router.post('/users/:id/unban', async (req, res) => {
  try {
    const user = await User.findOneAndUpdate(
      { discordId: req.params.id },
      {
        $set: {
          banned: false,
          bannedAt: null,
          bannedReason: null,
          bannedBy: null
        }
      },
      { new: true }
    );
    if (!user) return res.status(404).json({ error: 'User not found' });
    addLog('MODERATION', `Unbanned user ${user.username} (${req.params.id})`, req.user?.username || 'Admin');
    req.app.get('io')?.emit('userUnbanned', { userId: req.params.id, username: user.username });
    res.json({ success: true, user });
  } catch (e) {
    res.status(500).json({ error: 'Failed to unban user' });
  }
});

// ============================================================
// LEADERBOARD
// ============================================================
router.get('/leaderboard', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const type = req.query.type || 'xp';
    
    let sortField = 'xp';
    if (type === 'level') sortField = 'level';
    if (type === 'streak') sortField = 'streak';
    if (type === 'quizzes') sortField = 'quizzesTaken';

    const users = await User.find().sort({ [sortField]: -1 }).limit(limit).lean();
    res.json(users);
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

// ============================================================
// LOGS
// ============================================================
router.get('/logs', (req, res) => {
  const type = req.query.type;
  const limit = parseInt(req.query.limit) || 50;
  let logs = type && type !== 'all' ? systemLogs.filter(l => l.type === type) : systemLogs;
  res.json(logs.slice(0, limit));
});

router.delete('/logs', (req, res) => {
  systemLogs.length = 0;
  addLog('SYSTEM', 'Logs cleared', req.user?.username || 'Admin');
  res.json({ success: true });
});

// ============================================================
// CONFIG
// ============================================================
router.get('/config', (req, res) => {
  res.json(botConfig);
});

router.patch('/config', (req, res) => {
  const { maintenanceMode, features, xpMultiplier, maxQuestionsPerQuiz } = req.body;
  
  if (maintenanceMode !== undefined) botConfig.maintenanceMode = maintenanceMode;
  if (xpMultiplier !== undefined) botConfig.xpMultiplier = parseFloat(xpMultiplier);
  if (maxQuestionsPerQuiz !== undefined) botConfig.maxQuestionsPerQuiz = parseInt(maxQuestionsPerQuiz);
  if (features) Object.assign(botConfig.features, features);

  addLog('CONFIG', `Config updated`, req.user?.username || 'Admin');
  req.app.get('io')?.emit('configUpdated', botConfig);
  res.json({ success: true, config: botConfig });
});

router.post('/config/feature/:name', (req, res) => {
  const { name } = req.params;
  const { enabled } = req.body;
  
  if (name in botConfig.features) {
    botConfig.features[name] = enabled;
    addLog('CONFIG', `Feature ${name} ${enabled ? 'enabled' : 'disabled'}`, req.user?.username || 'Admin');
    res.json({ success: true, feature: name, enabled });
  } else {
    res.status(400).json({ error: 'Feature not found' });
  }
});

// ============================================================
// ADVANCED BROADCAST SYSTEM
// ============================================================
import * as broadcastService from '../../services/broadcastService.js';
import { ServerSettings } from '../../database/models/ServerSettings.js';

// Get broadcast configuration options
router.get('/broadcast/config', (req, res) => {
  res.json({
    types: broadcastService.BROADCAST_TYPES,
    audiences: broadcastService.TARGET_AUDIENCES,
    templates: Object.keys(broadcastService.TEMPLATES),
    tokens: Object.keys(broadcastService.TOKENS)
  });
});

// Get configured servers (servers with announcement channels set up)
router.get('/broadcast/servers', async (req, res) => {
  try {
    const servers = await broadcastService.getConfiguredServers();
    res.json(servers);
  } catch (e) {
    console.error('Error getting configured servers:', e);
    res.status(500).json({ error: 'Failed to get servers' });
  }
});

// Get all servers the bot is in
router.get('/servers', async (req, res) => {
  try {
    const allServers = await ServerSettings.getAllServers();
    res.json(allServers);
  } catch (e) {
    res.status(500).json({ error: 'Failed to get servers' });
  }
});

// Get a specific template
router.get('/broadcast/templates/:name', (req, res) => {
  const template = broadcastService.getTemplate(req.params.name, req.query);
  if (template) {
    res.json(template);
  } else {
    res.status(404).json({ error: 'Template not found' });
  }
});

// Get all templates
router.get('/broadcast/templates', (req, res) => {
  res.json(broadcastService.TEMPLATES);
});

// Preview broadcast (without sending)
router.post('/broadcast/preview', async (req, res) => {
  try {
    const { title, message, type, audience } = req.body;
    
    // Get target user count
    const targetUsers = await broadcastService.getTargetUsers(audience || 'all');
    
    // Create preview embed
    const embed = broadcastService.createBroadcastEmbed({
      title,
      message,
      type: type || 'announcement'
    }, { username: 'PreviewUser', level: 5, xp: 1000, streak: 7 });
    
    res.json({
      embed,
      targetCount: targetUsers.length,
      audience: broadcastService.TARGET_AUDIENCES[audience || 'all']
    });
  } catch (e) {
    res.status(500).json({ error: 'Preview failed' });
  }
});

// Get available channels for broadcast
router.get('/broadcast/channels', (req, res) => {
  try {
    const channels = broadcastService.getAvailableChannels();
    res.json(channels);
  } catch (e) {
    res.status(500).json({ error: 'Failed to get channels' });
  }
});

// Send broadcast (supports both DM and Channel methods)
router.post('/broadcast/send', async (req, res) => {
  try {
    const broadcast = {
      id: Date.now().toString(),
      title: req.body.title,
      message: req.body.message,
      type: req.body.type || 'announcement',
      audience: req.body.audience || 'all',
      image: req.body.image,
      thumbnail: req.body.thumbnail,
      cta: req.body.cta,
      buttons: req.body.buttons,
      customColor: req.body.customColor,
      sentBy: req.user?.username || 'Admin',
      // Channel broadcast options
      method: req.body.method || 'configured', // 'configured', 'channel', 'global', or 'dm'
      channelId: req.body.channelId,
      mention: req.body.mention, // 'everyone', 'here', or null
      mentionRole: req.body.mentionRole
    };
    
    // Emit start event
    req.app.get('io')?.emit('broadcastStart', { id: broadcast.id, title: broadcast.title });
    
    // Send broadcast based on method
    let result;
    if (broadcast.method === 'configured') {
      // RECOMMENDED: Send to all servers that have configured announcement channels
      result = await broadcastService.sendToConfiguredChannels(broadcast);
      addLog('BROADCAST', `Broadcast "${broadcast.title}" sent to ${result.sent} configured servers (${result.totalMembers} members)`, req.user?.username || 'Admin');
    } else if (broadcast.method === 'channel' && broadcast.channelId) {
      result = await broadcastService.sendChannelBroadcast(broadcast);
      addLog('BROADCAST', `Channel broadcast "${broadcast.title}" sent`, req.user?.username || 'Admin');
    } else if (broadcast.method === 'global') {
      result = await broadcastService.sendGlobalChannelBroadcast(broadcast);
      addLog('BROADCAST', `Global broadcast "${broadcast.title}" sent to ${result.sent} servers`, req.user?.username || 'Admin');
    } else {
      result = await broadcastService.sendBroadcast(broadcast);
      addLog('BROADCAST', `DM broadcast "${broadcast.title}" sent to ${result.sent} users`, req.user?.username || 'Admin');
    }
    
    req.app.get('io')?.emit('broadcastComplete', { id: broadcast.id, ...result });
    
    res.json({ success: true, ...result });
  } catch (e) {
    console.error('Broadcast error:', e);
    res.status(500).json({ error: 'Failed to send broadcast' });
  }
});

// Schedule broadcast
router.post('/broadcast/schedule', async (req, res) => {
  try {
    const broadcast = {
      id: Date.now().toString(),
      title: req.body.title,
      message: req.body.message,
      type: req.body.type || 'announcement',
      audience: req.body.audience || 'all',
      sentBy: req.user?.username || 'Admin'
    };
    
    const result = broadcastService.scheduleBroadcast(broadcast, req.body.scheduledTime);
    
    if (result.success) {
      addLog('BROADCAST', `Broadcast "${broadcast.title}" scheduled for ${req.body.scheduledTime}`, req.user?.username || 'Admin');
      req.app.get('io')?.emit('broadcastScheduled', result);
    }
    
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: 'Failed to schedule broadcast' });
  }
});

// Get scheduled broadcasts
router.get('/broadcast/scheduled', (req, res) => {
  res.json(broadcastService.getScheduledBroadcasts());
});

// Cancel scheduled broadcast
router.delete('/broadcast/scheduled/:id', (req, res) => {
  const result = broadcastService.cancelScheduledBroadcast(req.params.id);
  if (result.success) {
    addLog('BROADCAST', `Scheduled broadcast cancelled`, req.user?.username || 'Admin');
  }
  res.json(result);
});

// Get broadcast history with stats
router.get('/broadcast/history', (req, res) => {
  const limit = parseInt(req.query.limit) || 50;
  res.json(broadcastService.getBroadcastHistory(limit));
});

// Get broadcast by ID
router.get('/broadcast/:id', (req, res) => {
  const broadcast = broadcastService.getBroadcastById(req.params.id);
  if (broadcast) {
    res.json(broadcast);
  } else {
    res.status(404).json({ error: 'Broadcast not found' });
  }
});

// Get broadcast analytics
router.get('/broadcast/analytics', (req, res) => {
  res.json(broadcastService.getBroadcastAnalytics());
});

// Quick send from template
router.post('/broadcast/quick/:template', async (req, res) => {
  try {
    const template = broadcastService.getTemplate(req.params.template, req.body.values || {});
    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }
    
    const broadcast = {
      id: Date.now().toString(),
      ...template,
      sentBy: req.user?.username || 'Admin'
    };
    
    const result = await broadcastService.sendBroadcast(broadcast);
    addLog('BROADCAST', `Quick broadcast "${template.title}" sent`, req.user?.username || 'Admin');
    
    res.json({ success: true, ...result });
  } catch (e) {
    res.status(500).json({ error: 'Failed to send broadcast' });
  }
});

// ============================================================
// SYSTEM
// ============================================================
router.get('/system/health', (req, res) => {
  res.json({
    status: botConfig.maintenanceMode ? 'maintenance' : 'healthy',
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    nodeVersion: process.version,
    platform: process.platform
  });
});

router.post('/system/maintenance', async (req, res) => {
  const wasInMaintenance = botConfig.maintenanceMode;
  botConfig.maintenanceMode = req.body.enabled;
  
  addLog('SYSTEM', `Maintenance mode ${req.body.enabled ? 'enabled' : 'disabled'}`, req.user?.username || 'Admin');
  req.app.get('io')?.emit('maintenanceChanged', botConfig.maintenanceMode);
  
  // Auto-broadcast maintenance notifications
  if (req.body.autoBroadcast) {
    const template = req.body.enabled ? 'maintenance_start' : 'maintenance_end';
    const values = {
      duration: req.body.duration || '~30 minutes',
      eta: req.body.eta || 'Soon'
    };
    
    const broadcast = broadcastService.getTemplate(template, values);
    if (broadcast) {
      broadcast.id = Date.now().toString();
      broadcast.sentBy = 'System';
      await broadcastService.sendBroadcast(broadcast);
    }
  }
  
  res.json({ success: true, maintenanceMode: botConfig.maintenanceMode });
});

router.post('/system/cache/clear', (req, res) => {
  addLog('SYSTEM', 'Cache cleared', req.user?.username || 'Admin');
  res.json({ success: true, message: 'Cache cleared' });
});

// ============================================================
// ANALYTICS
// ============================================================
router.get('/analytics/overview', async (req, res) => {
  try {
    const now = new Date();
    const analytics = {};

    for (const days of [1, 7, 30, 90]) {
      const startDate = new Date(now - days * 24 * 60 * 60 * 1000);
      const users = await User.countDocuments({ createdAt: { $gte: startDate } });
      analytics[`last${days}d`] = { newUsers: users };
    }

    res.json(analytics);
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

router.get('/analytics/topics', async (req, res) => {
  try {
    const users = await User.find({ topicsStudied: { $exists: true, $ne: [] } }).select('topicsStudied').lean();
    const topicCounts = {};
    
    users.forEach(u => {
      (u.topicsStudied || []).forEach(topic => {
        topicCounts[topic] = (topicCounts[topic] || 0) + 1;
      });
    });

    const sorted = Object.entries(topicCounts).sort((a, b) => b[1] - a[1]).slice(0, 10);
    res.json(sorted.map(([topic, count]) => ({ topic, count })));
  } catch (e) {
    res.json([]);
  }
});

router.get('/analytics/achievements', async (req, res) => {
  try {
    const users = await User.find({ achievements: { $exists: true, $ne: [] } }).select('achievements').lean();
    const achCounts = {};
    
    users.forEach(u => {
      (u.achievements || []).forEach(ach => {
        achCounts[ach] = (achCounts[ach] || 0) + 1;
      });
    });

    const sorted = Object.entries(achCounts).sort((a, b) => b[1] - a[1]);
    res.json(sorted.map(([achievement, count]) => ({ achievement, count })));
  } catch (e) {
    res.json([]);
  }
});

// ============================================================
// VIRAL FEATURES ANALYTICS
// ============================================================
router.get('/analytics/viral', async (req, res) => {
  try {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);

    // Aggregate viral feature stats
    const [viralStats] = await User.aggregate([
      {
        $group: {
          _id: null,
          totalReferrals: { $sum: '$referrals' },
          totalShares: { $sum: '$shareCount' },
          totalQuickQuizzes: { $sum: '$quickQuizzesTaken' },
          totalFunFacts: { $sum: '$funFactsViewed' },
          totalWeeklyParticipations: { $sum: '$weeklyParticipations' },
          totalWeeklyWins: { $sum: '$weeklyWins' },
          totalReferralXP: { $sum: '$referralXpEarned' },
          quickQuizCorrect: { $sum: '$quickQuizCorrect' },
          usersWithReferrals: { $sum: { $cond: [{ $gt: ['$referrals', 0] }, 1, 0] } },
          usersWithShares: { $sum: { $cond: [{ $gt: ['$shareCount', 0] }, 1, 0] } }
        }
      }
    ]).catch(() => [{}]);

    const stats = viralStats || {};
    
    // Get today's activity
    const [todayActivity] = await User.aggregate([
      { $match: { lastActive: { $gte: todayStart } } },
      {
        $group: {
          _id: null,
          sharesToday: { $sum: { $cond: [{ $gte: ['$lastShareDate', todayStart] }, 1, 0] } },
          funFactsToday: { $sum: { $cond: [{ $gte: ['$lastFunFactDate', todayStart] }, 1, 0] } }
        }
      }
    ]).catch(() => [{}]);

    const today = todayActivity || {};

    res.json({
      referrals: {
        total: stats.totalReferrals || 0,
        activeReferrers: stats.usersWithReferrals || 0,
        xpDistributed: stats.totalReferralXP || 0
      },
      shares: {
        total: stats.totalShares || 0,
        today: today.sharesToday || 0,
        uniqueSharers: stats.usersWithShares || 0
      },
      quickQuiz: {
        total: stats.totalQuickQuizzes || 0,
        correct: stats.quickQuizCorrect || 0,
        accuracy: stats.totalQuickQuizzes > 0 ? Math.round((stats.quickQuizCorrect / stats.totalQuickQuizzes) * 100) : 0
      },
      funFacts: {
        total: stats.totalFunFacts || 0,
        today: today.funFactsToday || 0
      },
      weekly: {
        participations: stats.totalWeeklyParticipations || 0,
        wins: stats.totalWeeklyWins || 0
      }
    });
  } catch (e) {
    console.error('Viral analytics error:', e);
    res.json({
      referrals: { total: 0, activeReferrers: 0, xpDistributed: 0 },
      shares: { total: 0, today: 0, uniqueSharers: 0 },
      quickQuiz: { total: 0, correct: 0, accuracy: 0 },
      funFacts: { total: 0, today: 0 },
      weekly: { participations: 0, wins: 0 }
    });
  }
});

// Top Referrers Leaderboard
router.get('/analytics/referrers', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const referrers = await User.find({ referrals: { $gt: 0 } })
      .sort({ referrals: -1 })
      .limit(limit)
      .select('discordId username referrals referralXpEarned')
      .lean();
    res.json(referrers);
  } catch (e) {
    res.json([]);
  }
});

// Quick Quiz Leaderboard
router.get('/analytics/quickquiz', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const leaders = await User.find({ quickQuizzesTaken: { $gt: 0 } })
      .sort({ quickQuizCorrect: -1 })
      .limit(limit)
      .select('discordId username quickQuizzesTaken quickQuizCorrect quickQuizBestStreak')
      .lean();
    res.json(leaders);
  } catch (e) {
    res.json([]);
  }
});

// Initialize with startup log
addLog('SYSTEM', 'Admin panel started');

// Export router as default, and other items as named exports
export default router;
export { getAdminStats, addLog, botConfig };
