import mongoose from 'mongoose';

const serverSettingsSchema = new mongoose.Schema({
  // Discord server ID
  guildId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  
  // Server info (cached for dashboard)
  guildName: {
    type: String,
    default: 'Unknown Server'
  },
  
  guildIcon: String,
  
  memberCount: {
    type: Number,
    default: 0
  },
  
  // Announcement channel for broadcasts
  announcementChannelId: {
    type: String,
    default: null
  },
  
  announcementChannelName: {
    type: String,
    default: null
  },
  
  // Who configured this
  configuredBy: {
    type: String,
    default: null
  },
  
  configuredAt: {
    type: Date,
    default: null
  },
  
  // Bot settings per server
  settings: {
    // Allow broadcasts from admin panel
    allowBroadcasts: {
      type: Boolean,
      default: true
    },
    
    // Prefix for legacy commands (if any)
    prefix: {
      type: String,
      default: '!'
    },
    
    // XP multiplier for this server
    xpMultiplier: {
      type: Number,
      default: 1.0
    },
    
    // Disabled commands
    disabledCommands: [{
      type: String
    }],
    
    // Welcome message settings
    welcomeEnabled: {
      type: Boolean,
      default: false
    },
    
    welcomeChannelId: String,
    
    welcomeMessage: {
      type: String,
      default: 'Welcome {{user}} to {{server}}! 🎉 Use /help to get started with MentorAI!'
    },
    
    // Leveling announcements
    levelUpEnabled: {
      type: Boolean,
      default: true
    },
    
    levelUpChannelId: String
  },
  
  // Statistics
  stats: {
    totalUsers: {
      type: Number,
      default: 0
    },
    totalQuizzes: {
      type: Number,
      default: 0
    },
    totalXpGiven: {
      type: Number,
      default: 0
    },
    broadcastsReceived: {
      type: Number,
      default: 0
    }
  },
  
  // Timestamps
  joinedAt: {
    type: Date,
    default: Date.now
  },
  
  lastActivity: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Static methods
serverSettingsSchema.statics.getOrCreate = async function(guildId, guildData = {}) {
  let settings = await this.findOne({ guildId });
  
  if (!settings) {
    settings = await this.create({
      guildId,
      guildName: guildData.name || 'Unknown Server',
      guildIcon: guildData.icon || null,
      memberCount: guildData.memberCount || 0,
      joinedAt: new Date()
    });
  } else if (guildData.name) {
    // Update cached info
    settings.guildName = guildData.name;
    settings.guildIcon = guildData.icon || settings.guildIcon;
    settings.memberCount = guildData.memberCount || settings.memberCount;
    await settings.save();
  }
  
  return settings;
};

serverSettingsSchema.statics.setAnnouncementChannel = async function(guildId, channelId, channelName, userId) {
  return this.findOneAndUpdate(
    { guildId },
    {
      announcementChannelId: channelId,
      announcementChannelName: channelName,
      configuredBy: userId,
      configuredAt: new Date()
    },
    { new: true, upsert: true }
  );
};

serverSettingsSchema.statics.getConfiguredServers = async function() {
  return this.find({ 
    announcementChannelId: { $ne: null } 
  }).select('guildId guildName memberCount announcementChannelId announcementChannelName configuredAt');
};

serverSettingsSchema.statics.getAllServers = async function() {
  return this.find({}).sort({ memberCount: -1 });
};

export const ServerSettings = mongoose.model('ServerSettings', serverSettingsSchema);
