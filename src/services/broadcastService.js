import { EventEmitter } from 'events';
import { User } from '../database/models/User.js';
import { ServerSettings } from '../database/models/ServerSettings.js';

// Broadcast event emitter for real-time updates
export const broadcastEvents = new EventEmitter();

// Sync events emitter for real-time analytics (used by SearchIntelligence, NOC)
export const syncEvents = new EventEmitter();

// Broadcast types with styling
export const BROADCAST_TYPES = {
  announcement: {
    name: 'Announcement',
    emoji: '📢',
    color: 0x5865F2, // Discord Blurple
    icon: 'bullhorn'
  },
  maintenance: {
    name: 'Maintenance',
    emoji: '🔧',
    color: 0xFFA500, // Orange
    icon: 'tools'
  },
  event: {
    name: 'Event',
    emoji: '🎉',
    color: 0x9B59B6, // Purple
    icon: 'calendar-star'
  },
  achievement: {
    name: 'Achievement',
    emoji: '🏆',
    color: 0xFFD700, // Gold
    icon: 'trophy'
  },
  tip: {
    name: 'Learning Tip',
    emoji: '💡',
    color: 0x00D166, // Green
    icon: 'lightbulb'
  },
  challenge: {
    name: 'Challenge',
    emoji: '⚔️',
    color: 0xE74C3C, // Red
    icon: 'fire'
  },
  update: {
    name: 'Bot Update',
    emoji: '✨',
    color: 0x3498DB, // Blue
    icon: 'rocket'
  },
  alert: {
    name: 'Alert',
    emoji: '⚠️',
    color: 0xE74C3C, // Red
    icon: 'exclamation-triangle'
  },
  welcome: {
    name: 'Welcome',
    emoji: '👋',
    color: 0x2ECC71, // Green
    icon: 'hand-wave'
  },
  reward: {
    name: 'Reward',
    emoji: '🎁',
    color: 0xE91E63, // Pink
    icon: 'gift'
  }
};

// Target audience options
export const TARGET_AUDIENCES = {
  all: { name: 'All Users', desc: 'Send to everyone', filter: () => ({}) },
  active_24h: { name: 'Active (24h)', desc: 'Users active in last 24 hours', filter: () => ({ lastActive: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } }) },
  active_7d: { name: 'Active (7 days)', desc: 'Users active in last week', filter: () => ({ lastActive: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } }) },
  inactive_7d: { name: 'Inactive (7+ days)', desc: 'Re-engage inactive users', filter: () => ({ lastActive: { $lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } }) },
  beginners: { name: 'Beginners', desc: 'Level 1-5 users', filter: () => ({ level: { $lte: 5 } }) },
  intermediate: { name: 'Intermediate', desc: 'Level 6-15 users', filter: () => ({ level: { $gte: 6, $lte: 15 } }) },
  advanced: { name: 'Advanced', desc: 'Level 16+ users', filter: () => ({ level: { $gte: 16 } }) },
  streak_holders: { name: 'Streak Holders', desc: 'Users with active streaks', filter: () => ({ streak: { $gte: 3 } }) },
  quiz_masters: { name: 'Quiz Masters', desc: '10+ quizzes completed', filter: () => ({ quizzesTaken: { $gte: 10 } }) },
  new_users: { name: 'New Users', desc: 'Joined in last 7 days', filter: () => ({ createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } }) }
};

// Personalization tokens
export const TOKENS = {
  '{{username}}': (user) => user.username || 'Learner',
  '{{level}}': (user) => user.level || 1,
  '{{xp}}': (user) => (user.xp || 0).toLocaleString(),
  '{{streak}}': (user) => user.streak || 0,
  '{{quizzes}}': (user) => user.quizzesTaken || 0,
  '{{rank}}': (user, rank) => rank || '?',
  '{{date}}': () => new Date().toLocaleDateString(),
  '{{time}}': () => new Date().toLocaleTimeString()
};

// In-memory storage for broadcasts
const broadcasts = [];
const scheduledBroadcasts = new Map();

// Discord client reference (set from bot)
let discordClient = null;

export function setDiscordClient(client) {
  discordClient = client;
  console.log('📡 Broadcast service connected to Discord client');
}

/**
 * Replace tokens in message with user data
 */
export function personalizeMessage(message, user, rank = null) {
  let result = message;
  for (const [token, fn] of Object.entries(TOKENS)) {
    result = result.replace(new RegExp(token.replace(/[{}]/g, '\\$&'), 'g'), fn(user, rank));
  }
  return result;
}

/**
 * Get target users based on audience
 */
export async function getTargetUsers(audience, customFilter = {}) {
  const audienceConfig = TARGET_AUDIENCES[audience] || TARGET_AUDIENCES.all;
  const filter = { ...audienceConfig.filter(), ...customFilter };
  
  try {
    const users = await User.find(filter).lean();
    return users;
  } catch (error) {
    console.error('Error getting target users:', error);
    return [];
  }
}

/**
 * Create Discord embed for broadcast
 */
export function createBroadcastEmbed(broadcast, user = null) {
  const type = BROADCAST_TYPES[broadcast.type] || BROADCAST_TYPES.announcement;
  
  let title = broadcast.title;
  let description = broadcast.message;
  
  // Personalize if user provided
  if (user) {
    title = personalizeMessage(title, user);
    description = personalizeMessage(description, user);
  }
  
  const embed = {
    title: `${type.emoji} ${title}`,
    description: description,
    color: broadcast.customColor || type.color,
    timestamp: new Date().toISOString(),
    footer: {
      text: `MentorAI ${type.name} • ${new Date().toLocaleDateString()}`
    }
  };
  
  // Add optional fields
  if (broadcast.image) {
    embed.image = { url: broadcast.image };
  }
  
  if (broadcast.thumbnail) {
    embed.thumbnail = { url: broadcast.thumbnail };
  }
  
  if (broadcast.fields && broadcast.fields.length > 0) {
    embed.fields = broadcast.fields;
  }
  
  // Add call to action if provided
  if (broadcast.cta) {
    embed.fields = embed.fields || [];
    embed.fields.push({
      name: '📌 Action',
      value: broadcast.cta,
      inline: false
    });
  }
  
  return embed;
}

/**
 * Send broadcast to a specific Discord channel (RECOMMENDED - Fast & Reliable)
 */
export async function sendChannelBroadcast(broadcast) {
  if (!discordClient) {
    console.error('Discord client not connected to broadcast service');
    return { success: false, error: 'Discord client not connected', sent: 0 };
  }
  
  const startTime = Date.now();
  
  try {
    const channelId = broadcast.channelId;
    if (!channelId) {
      return { success: false, error: 'No channel ID specified' };
    }
    
    // Fetch channel
    const channel = await discordClient.channels.fetch(channelId);
    if (!channel || !channel.isTextBased()) {
      return { success: false, error: 'Invalid or non-text channel' };
    }
    
    // Create embed
    const embed = createBroadcastEmbed(broadcast);
    
    // Create buttons if specified
    const components = [];
    if (broadcast.buttons && broadcast.buttons.length > 0) {
      const row = {
        type: 1,
        components: broadcast.buttons.slice(0, 5).map((btn, i) => ({
          type: 2,
          style: btn.style || 1,
          label: btn.label,
          custom_id: `broadcast_${broadcast.id}_btn_${i}`,
          emoji: btn.emoji ? { name: btn.emoji } : undefined
        }))
      };
      components.push(row);
    }
    
    // Add mention for visibility
    let content = '';
    if (broadcast.mention === 'everyone') content = '@everyone';
    else if (broadcast.mention === 'here') content = '@here';
    else if (broadcast.mentionRole) content = `<@&${broadcast.mentionRole}>`;
    
    // Send message to channel
    const message = await channel.send({
      content: content || undefined,
      embeds: [embed],
      components: components.length > 0 ? components : undefined
    });
    
    const duration = Date.now() - startTime;
    
    // Count approximate reach (members in channel)
    const memberCount = channel.guild?.memberCount || channel.members?.size || 1;
    
    const result = {
      id: broadcast.id || Date.now().toString(),
      ...broadcast,
      messageId: message.id,
      sentAt: new Date(),
      stats: {
        total: memberCount,
        sent: memberCount,
        failed: 0,
        successRate: 100,
        duration,
        method: 'channel'
      }
    };
    
    broadcasts.unshift(result);
    if (broadcasts.length > 100) broadcasts.pop();
    
    broadcastEvents.emit('complete', result);
    console.log(`📢 Channel broadcast sent to #${channel.name} (${memberCount} members)`);
    
    return { success: true, ...result.stats, messageId: message.id };
  } catch (error) {
    console.error('Channel broadcast error:', error);
    broadcastEvents.emit('error', { id: broadcast.id, error: error.message });
    return { success: false, error: error.message };
  }
}

/**
 * Send broadcast to all channels the bot is in
 */
/**
 * Send broadcast to ALL CONFIGURED announcement channels (BEST FOR BUILDATHON!)
 * Only sends to servers that have configured an announcement channel via /setup
 */
export async function sendToConfiguredChannels(broadcast) {
  if (!discordClient) {
    return { success: false, error: 'Discord client not connected' };
  }
  
  const startTime = Date.now();
  let totalSent = 0;
  let totalFailed = 0;
  let totalMembers = 0;
  const channelResults = [];
  
  try {
    // Get all servers with configured announcement channels
    const configuredServers = await ServerSettings.getConfiguredServers();
    
    if (configuredServers.length === 0) {
      return { 
        success: false, 
        error: 'No servers have configured announcement channels yet. Ask server admins to use /setup announcement' 
      };
    }
    
    broadcastEvents.emit('progress', {
      id: broadcast.id,
      status: 'sending',
      total: configuredServers.length,
      sent: 0,
      failed: 0
    });
    
    for (const server of configuredServers) {
      try {
        const guild = discordClient.guilds.cache.get(server.guildId);
        if (!guild) {
          totalFailed++;
          channelResults.push({ 
            guild: server.guildName, 
            success: false, 
            error: 'Bot no longer in server' 
          });
          continue;
        }
        
        const channel = guild.channels.cache.get(server.announcementChannelId);
        if (!channel) {
          totalFailed++;
          channelResults.push({ 
            guild: server.guildName, 
            success: false, 
            error: 'Channel not found (may have been deleted)' 
          });
          continue;
        }
        
        // Send to the configured channel
        const result = await sendChannelBroadcast({
          ...broadcast,
          channelId: channel.id
        });
        
        if (result.success) {
          totalSent++;
          totalMembers += guild.memberCount;
          channelResults.push({ 
            guild: server.guildName, 
            channel: channel.name, 
            success: true,
            members: guild.memberCount 
          });
          
          // Update server stats
          await ServerSettings.findOneAndUpdate(
            { guildId: server.guildId },
            { $inc: { 'stats.broadcastsReceived': 1 } }
          );
        } else {
          totalFailed++;
          channelResults.push({ 
            guild: server.guildName, 
            success: false, 
            error: result.error 
          });
        }
        
        // Emit progress
        broadcastEvents.emit('progress', {
          id: broadcast.id,
          status: 'sending',
          total: configuredServers.length,
          sent: totalSent,
          failed: totalFailed
        });
        
      } catch (err) {
        totalFailed++;
        channelResults.push({ 
          guild: server.guildName, 
          success: false, 
          error: err.message 
        });
      }
    }
    
    const duration = Date.now() - startTime;
    
    const result = {
      success: true,
      method: 'configured_channels',
      configuredServers: configuredServers.length,
      sent: totalSent,
      failed: totalFailed,
      totalMembers,
      duration,
      channels: channelResults
    };
    
    broadcastEvents.emit('complete', result);
    console.log(`📢 Broadcast sent to ${totalSent}/${configuredServers.length} configured channels (${totalMembers} total members)`);
    
    return result;
  } catch (error) {
    broadcastEvents.emit('error', { id: broadcast.id, error: error.message });
    return { success: false, error: error.message };
  }
}

/**
 * Get servers with configured announcement channels
 */
export async function getConfiguredServers() {
  const servers = await ServerSettings.getConfiguredServers();
  
  // Enrich with live data from Discord
  const enriched = [];
  for (const server of servers) {
    const guild = discordClient?.guilds.cache.get(server.guildId);
    enriched.push({
      ...server.toObject(),
      isOnline: !!guild,
      currentMemberCount: guild?.memberCount || server.memberCount,
      channelExists: guild?.channels.cache.has(server.announcementChannelId) || false
    });
  }
  
  return enriched;
}

export async function sendGlobalChannelBroadcast(broadcast) {
  if (!discordClient) {
    return { success: false, error: 'Discord client not connected' };
  }
  
  const startTime = Date.now();
  let totalSent = 0;
  let totalFailed = 0;
  const channelResults = [];
  
  try {
    // Get all guilds the bot is in
    const guilds = discordClient.guilds.cache;
    
    for (const [guildId, guild] of guilds) {
      try {
        // Find the best channel to post (system channel, general, or first text channel)
        let targetChannel = guild.systemChannel;
        
        if (!targetChannel) {
          // Try to find a "general" or "chat" channel
          targetChannel = guild.channels.cache.find(ch => 
            ch.isTextBased() && 
            !ch.isVoiceBased() &&
            (ch.name.includes('general') || ch.name.includes('chat') || ch.name.includes('bot'))
          );
        }
        
        if (!targetChannel) {
          // Get first text channel we can send to
          targetChannel = guild.channels.cache.find(ch => 
            ch.isTextBased() && 
            !ch.isVoiceBased() &&
            ch.permissionsFor(guild.members.me)?.has('SendMessages')
          );
        }
        
        if (targetChannel) {
          const result = await sendChannelBroadcast({
            ...broadcast,
            channelId: targetChannel.id
          });
          
          if (result.success) {
            totalSent++;
            channelResults.push({ guild: guild.name, channel: targetChannel.name, success: true });
          } else {
            totalFailed++;
            channelResults.push({ guild: guild.name, channel: targetChannel.name, success: false, error: result.error });
          }
        } else {
          totalFailed++;
          channelResults.push({ guild: guild.name, success: false, error: 'No suitable channel found' });
        }
      } catch (err) {
        totalFailed++;
        channelResults.push({ guild: guild.name, success: false, error: err.message });
      }
    }
    
    const duration = Date.now() - startTime;
    
    return {
      success: true,
      method: 'global_channel',
      guilds: guilds.size,
      sent: totalSent,
      failed: totalFailed,
      duration,
      channels: channelResults
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Get available channels for broadcast
 */
export function getAvailableChannels() {
  if (!discordClient) return [];
  
  const channels = [];
  
  for (const [guildId, guild] of discordClient.guilds.cache) {
    const textChannels = guild.channels.cache
      .filter(ch => ch.isTextBased() && !ch.isVoiceBased())
      .map(ch => ({
        id: ch.id,
        name: ch.name,
        guild: guild.name,
        guildId: guild.id,
        memberCount: guild.memberCount
      }));
    
    channels.push(...textChannels);
  }
  
  return channels;
}

/**
 * Send broadcast to Discord via DM (slower, more personal)
 */
export async function sendBroadcast(broadcast) {
  // If channelId is specified, use channel broadcast instead
  if (broadcast.channelId) {
    return sendChannelBroadcast(broadcast);
  }
  
  // If method is 'channel' and no specific channel, broadcast to all servers
  if (broadcast.method === 'channel' || broadcast.method === 'global') {
    return sendGlobalChannelBroadcast(broadcast);
  }
  
  if (!discordClient) {
    console.error('Discord client not connected to broadcast service');
    return { success: false, error: 'Discord client not connected', sent: 0, failed: 0 };
  }
  
  const startTime = Date.now();
  let sent = 0;
  let failed = 0;
  const errors = [];
  
  try {
    // Get target users
    const users = await getTargetUsers(broadcast.audience || 'all');
    const totalTargets = users.length;
    
    // Emit progress start
    broadcastEvents.emit('progress', { 
      id: broadcast.id, 
      status: 'sending', 
      total: totalTargets, 
      sent: 0, 
      failed: 0 
    });
    
    // Send to each user via DM
    for (const user of users) {
      try {
        const discordUser = await discordClient.users.fetch(user.discordId);
        if (discordUser) {
          const embed = createBroadcastEmbed(broadcast, user);
          
          // Create buttons if specified
          const components = [];
          if (broadcast.buttons && broadcast.buttons.length > 0) {
            const row = {
              type: 1, // Action Row
              components: broadcast.buttons.slice(0, 5).map((btn, i) => ({
                type: 2, // Button
                style: btn.style || 1,
                label: btn.label,
                custom_id: `broadcast_${broadcast.id}_btn_${i}`,
                emoji: btn.emoji ? { name: btn.emoji } : undefined
              }))
            };
            components.push(row);
          }
          
          await discordUser.send({ 
            embeds: [embed],
            components: components.length > 0 ? components : undefined
          });
          sent++;
        }
      } catch (err) {
        failed++;
        if (err.code !== 50007) { // Ignore "Cannot send messages to this user" (DMs disabled)
          errors.push({ userId: user.discordId, error: err.message });
        }
      }
      
      // Emit progress update every 10 users
      if ((sent + failed) % 10 === 0) {
        broadcastEvents.emit('progress', { 
          id: broadcast.id, 
          status: 'sending', 
          total: totalTargets, 
          sent, 
          failed 
        });
      }
      
      // Rate limiting: wait 100ms between messages
      await new Promise(r => setTimeout(r, 100));
    }
    
    // Calculate duration
    const duration = Date.now() - startTime;
    
    // Save broadcast result
    const result = {
      id: broadcast.id || Date.now().toString(),
      ...broadcast,
      sentAt: new Date(),
      stats: {
        total: totalTargets,
        sent,
        failed,
        successRate: totalTargets > 0 ? Math.round((sent / totalTargets) * 100) : 0,
        duration
      },
      errors: errors.slice(0, 10) // Keep first 10 errors
    };
    
    broadcasts.unshift(result);
    if (broadcasts.length > 100) broadcasts.pop(); // Keep last 100
    
    // Emit completion
    broadcastEvents.emit('complete', result);
    broadcastEvents.emit('progress', { 
      id: broadcast.id, 
      status: 'complete', 
      total: totalTargets, 
      sent, 
      failed 
    });
    
    console.log(`📢 Broadcast sent: ${sent}/${totalTargets} (${result.stats.successRate}% success)`);
    
    return { success: true, ...result.stats };
  } catch (error) {
    console.error('Broadcast error:', error);
    broadcastEvents.emit('error', { id: broadcast.id, error: error.message });
    return { success: false, error: error.message, sent, failed };
  }
}

/**
 * Schedule a broadcast for later
 */
export function scheduleBroadcast(broadcast, scheduledTime) {
  const id = broadcast.id || Date.now().toString();
  const delay = new Date(scheduledTime).getTime() - Date.now();
  
  if (delay <= 0) {
    return { success: false, error: 'Scheduled time must be in the future' };
  }
  
  const timeout = setTimeout(async () => {
    await sendBroadcast({ ...broadcast, id });
    scheduledBroadcasts.delete(id);
  }, delay);
  
  scheduledBroadcasts.set(id, {
    broadcast: { ...broadcast, id },
    scheduledTime: new Date(scheduledTime),
    timeout
  });
  
  broadcastEvents.emit('scheduled', { id, scheduledTime });
  
  return { success: true, id, scheduledTime };
}

/**
 * Cancel a scheduled broadcast
 */
export function cancelScheduledBroadcast(id) {
  const scheduled = scheduledBroadcasts.get(id);
  if (scheduled) {
    clearTimeout(scheduled.timeout);
    scheduledBroadcasts.delete(id);
    broadcastEvents.emit('cancelled', { id });
    return { success: true };
  }
  return { success: false, error: 'Broadcast not found' };
}

/**
 * Get all scheduled broadcasts
 */
export function getScheduledBroadcasts() {
  return Array.from(scheduledBroadcasts.values()).map(s => ({
    id: s.broadcast.id,
    ...s.broadcast,
    scheduledTime: s.scheduledTime
  }));
}

/**
 * Get broadcast history
 */
export function getBroadcastHistory(limit = 50) {
  return broadcasts.slice(0, limit);
}

/**
 * Get broadcast by ID
 */
export function getBroadcastById(id) {
  return broadcasts.find(b => b.id === id);
}

/**
 * Quick broadcast templates
 */
export const TEMPLATES = {
  maintenance_start: {
    type: 'maintenance',
    title: '🔧 Scheduled Maintenance',
    message: 'Hey {{username}}! MentorAI is going down for maintenance.\n\n⏰ **Duration:** {{duration}}\n📅 **Expected back:** {{eta}}\n\nWe\'re making improvements to serve you better! Your progress is safe.',
    audience: 'all'
  },
  maintenance_end: {
    type: 'update',
    title: '✨ We\'re Back!',
    message: 'Hey {{username}}! MentorAI is back online and better than ever!\n\n🎉 Thanks for your patience. Ready to continue learning?',
    audience: 'all'
  },
  daily_tip: {
    type: 'tip',
    title: '💡 Daily Learning Tip',
    message: 'Good {{timeOfDay}}, {{username}}!\n\n{{tip}}\n\n🔥 Keep that streak going!',
    audience: 'active_7d'
  },
  streak_reminder: {
    type: 'alert',
    title: '🔥 Don\'t Lose Your Streak!',
    message: 'Hey {{username}}! You have a {{streak}}-day streak at risk!\n\nComplete a quick quiz to keep it alive. You\'ve got this!',
    audience: 'streak_holders'
  },
  level_up_celebration: {
    type: 'achievement',
    title: '🎉 Level Up Celebration!',
    message: 'Congratulations {{username}}! 🎊\n\nYou\'ve reached **Level {{level}}**!\n\n⭐ Keep pushing your limits!\n📚 New challenges await!',
    audience: 'all'
  },
  weekly_challenge: {
    type: 'challenge',
    title: '⚔️ Weekly Challenge',
    message: 'Hey {{username}}! A new weekly challenge has begun!\n\n🎯 **Challenge:** {{challenge}}\n🏆 **Reward:** {{reward}} XP\n⏰ **Ends:** {{endDate}}\n\nAre you ready to compete?',
    audience: 'all'
  },
  welcome_new: {
    type: 'welcome',
    title: '👋 Welcome to MentorAI!',
    message: 'Hey {{username}}! Welcome to the MentorAI learning community! 🎉\n\n🚀 Start with `/help` to see all commands\n📚 Try `/learn` for AI lessons\n🎯 Take a `/quiz` to test yourself\n🔥 Build your streak with `/daily`\n\nLet\'s learn together!',
    audience: 'new_users'
  },
  reengagement: {
    type: 'reward',
    title: '🎁 We Miss You!',
    message: 'Hey {{username}}! It\'s been a while since we learned together.\n\n🎁 **Special offer:** Come back today and get **2x XP** on your first quiz!\n\nYour journey to mastery awaits!',
    audience: 'inactive_7d'
  },
  event_announcement: {
    type: 'event',
    title: '🎉 Special Event',
    message: 'Hey {{username}}! Something exciting is happening!\n\n📅 **Event:** {{eventName}}\n⏰ **When:** {{eventDate}}\n🎁 **Rewards:** {{rewards}}\n\nDon\'t miss out!',
    audience: 'all'
  }
};

/**
 * Get template with custom values
 */
export function getTemplate(templateName, customValues = {}) {
  const template = TEMPLATES[templateName];
  if (!template) return null;
  
  let result = { ...template };
  
  // Replace custom placeholders
  for (const [key, value] of Object.entries(customValues)) {
    result.title = result.title.replace(`{{${key}}}`, value);
    result.message = result.message.replace(new RegExp(`{{${key}}}`, 'g'), value);
  }
  
  return result;
}

/**
 * AI-powered message enhancement (placeholder for AI integration)
 */
export async function enhanceMessage(message, style = 'friendly') {
  // This can be connected to OpenAI for message enhancement
  const styles = {
    friendly: { prefix: '👋 ', suffix: '\n\n😊 Happy learning!' },
    professional: { prefix: '', suffix: '\n\n— The MentorAI Team' },
    exciting: { prefix: '🎉 ', suffix: '\n\n🚀 Let\'s go!' },
    urgent: { prefix: '⚠️ ', suffix: '\n\n⏰ Act now!' }
  };
  
  const s = styles[style] || styles.friendly;
  return s.prefix + message + s.suffix;
}

/**
 * Get broadcast analytics
 */
export function getBroadcastAnalytics() {
  const history = broadcasts.slice(0, 50);
  
  if (history.length === 0) {
    return {
      totalSent: 0,
      avgSuccessRate: 0,
      byType: {},
      recentTrend: []
    };
  }
  
  const totalSent = history.reduce((sum, b) => sum + (b.stats?.sent || 0), 0);
  const avgSuccessRate = Math.round(
    history.reduce((sum, b) => sum + (b.stats?.successRate || 0), 0) / history.length
  );
  
  const byType = {};
  for (const b of history) {
    byType[b.type] = (byType[b.type] || 0) + 1;
  }
  
  // Last 7 days trend
  const recentTrend = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
    
    const dayBroadcasts = history.filter(b => {
      const sentAt = new Date(b.sentAt);
      return sentAt >= dayStart && sentAt < dayEnd;
    });
    
    recentTrend.push({
      date: dayStart.toISOString().split('T')[0],
      count: dayBroadcasts.length,
      sent: dayBroadcasts.reduce((sum, b) => sum + (b.stats?.sent || 0), 0)
    });
  }
  
  return {
    totalSent,
    avgSuccessRate,
    byType,
    recentTrend,
    totalBroadcasts: history.length
  };
}
