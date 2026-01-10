/**
 * Sovereign Event Orchestrator
 * 
 * Background service that monitors server "stagnation" and triggers
 * automatic engagement events to drive retention.
 */

import { EventEmitter } from 'events';
import { User } from '../database/models/User.js';
import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';

class SovereignOrchestrator extends EventEmitter {
  constructor() {
    super();
    this.client = null;
    this.checkInterval = null;
    this.lastActivityTime = Date.now();
    this.studyPartyActive = false;
    this.studyPartyEndTime = null;
    
    // Configuration
    this.config = {
      stagnationThreshold: 6 * 60 * 60 * 1000, // 6 hours in ms
      studyPartyDuration: 2 * 60 * 60 * 1000,  // 2 hours
      studyPartyBonus: 1.5, // 50% XP bonus
      checkIntervalMs: 30 * 60 * 1000, // Check every 30 minutes
      minUsersForParty: 3 // Minimum active users needed
    };
  }

  /**
   * Initialize the orchestrator with Discord client
   */
  initialize(client) {
    this.client = client;
    console.log('🎭 Sovereign Orchestrator initialized');
    
    // Start monitoring
    this.startMonitoring();
    
    return this;
  }

  /**
   * Start the background monitoring service
   */
  startMonitoring() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }

    console.log('🔍 Sovereign monitoring started - checking for stagnation every 30 minutes');
    
    // Check immediately on start
    this.checkServerActivity();
    
    // Then check periodically
    this.checkInterval = setInterval(() => {
      this.checkServerActivity();
    }, this.config.checkIntervalMs);
  }

  /**
   * Stop monitoring
   */
  stopMonitoring() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    console.log('🛑 Sovereign monitoring stopped');
  }

  /**
   * Record user activity (called when users learn/quiz)
   */
  recordActivity(userId) {
    this.lastActivityTime = Date.now();
    this.emit('activity', { userId, timestamp: this.lastActivityTime });
  }

  /**
   * Check server activity and trigger events if stagnant
   */
  async checkServerActivity() {
    try {
      const now = Date.now();
      const timeSinceActivity = now - this.lastActivityTime;
      
      // Check recent activity from database
      const sixHoursAgo = new Date(now - this.config.stagnationThreshold);
      const recentActiveUsers = await User.countDocuments({
        lastActive: { $gte: sixHoursAgo }
      });

      console.log(`🔍 Activity check: ${recentActiveUsers} users active in last 6h`);

      // If stagnant and no party active, trigger study party
      if (timeSinceActivity >= this.config.stagnationThreshold && !this.studyPartyActive) {
        if (recentActiveUsers >= this.config.minUsersForParty) {
          await this.triggerStudyParty();
        } else {
          console.log('📊 Low activity but not enough users for study party');
        }
      }

      // Check if study party should end
      if (this.studyPartyActive && this.studyPartyEndTime && now >= this.studyPartyEndTime) {
        await this.endStudyParty();
      }

    } catch (error) {
      console.error('Sovereign check error:', error);
    }
  }

  /**
   * Trigger a Global Study Party
   */
  async triggerStudyParty() {
    if (!this.client || this.studyPartyActive) return;

    this.studyPartyActive = true;
    this.studyPartyEndTime = Date.now() + this.config.studyPartyDuration;

    console.log('🎉 TRIGGERING GLOBAL STUDY PARTY! +50% XP for 2 hours');

    // Emit event for gamification service to apply bonus
    this.emit('studyPartyStart', {
      bonus: this.config.studyPartyBonus,
      duration: this.config.studyPartyDuration,
      endTime: this.studyPartyEndTime
    });

    // Build the Pro Max announcement embed
    const embed = new EmbedBuilder()
      .setColor(0xFFD700)
      .setTitle('🎉 GLOBAL STUDY PARTY ACTIVATED!')
      .setDescription(`
╔══════════════════════════════════════════════════╗
║  🚀 **+50% XP BONUS** FOR THE NEXT 2 HOURS! 🚀   ║
╚══════════════════════════════════════════════════╝

The MentorAI Sovereign has detected low learning activity and is rewarding all active learners with a **massive XP boost**!

✨ **All quizzes** → +50% XP
✨ **All lessons** → +50% XP  
✨ **Daily bonus** → +50% XP

⏰ **Ends:** <t:${Math.floor(this.studyPartyEndTime / 1000)}:R>
      `)
      .addFields(
        { name: '🎯 How to Participate', value: 'Just use any learning command!\n`/quiz` • `/learn` • `/challenge`', inline: true },
        { name: '💎 Stack Bonuses', value: 'Study Party stacks with:\n• Streak Multiplier\n• Prestige Bonus', inline: true }
      )
      .setImage('https://media.giphy.com/media/l0MYt5jPR6QX5pnqM/giphy.gif')
      .setFooter({ text: '🎭 MentorAI Sovereign • Driving Educational Excellence' })
      .setTimestamp();

    const buttons = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('exec_quiz')
          .setLabel('Start Quiz Now!')
          .setEmoji('🎯')
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId('exec_learn')
          .setLabel('Learn Something')
          .setEmoji('📚')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('exec_leaderboard')
          .setLabel('Leaderboard')
          .setEmoji('🏆')
          .setStyle(ButtonStyle.Secondary)
      );

    // Send to all guilds' main channels
    await this.broadcastToGuilds(embed, buttons);
  }

  /**
   * End the study party
   */
  async endStudyParty() {
    if (!this.studyPartyActive) return;

    this.studyPartyActive = false;
    this.studyPartyEndTime = null;

    console.log('🏁 Study Party ended');

    this.emit('studyPartyEnd', {});

    const embed = new EmbedBuilder()
      .setColor(0x5865F2)
      .setTitle('🏁 Study Party Has Ended!')
      .setDescription(`
Thanks for participating in the Global Study Party!

Check your progress with \`/profile\` or \`/card\`!

**Next party:** When the Sovereign detects learning stagnation 🎭
      `)
      .setFooter({ text: '🎭 MentorAI Sovereign • Keep Learning!' })
      .setTimestamp();

    await this.broadcastToGuilds(embed);
  }

  /**
   * Broadcast message to all guilds
   */
  async broadcastToGuilds(embed, components = null) {
    if (!this.client) return;

    for (const [guildId, guild] of this.client.guilds.cache) {
      try {
        // Find a suitable channel (system channel or first text channel)
        let channel = guild.systemChannel;
        
        if (!channel) {
          channel = guild.channels.cache.find(
            ch => ch.type === 0 && ch.permissionsFor(guild.members.me)?.has('SendMessages')
          );
        }

        if (channel) {
          const messageOptions = { embeds: [embed] };
          if (components) messageOptions.components = [components];
          
          await channel.send(messageOptions);
          console.log(`📢 Broadcast sent to ${guild.name}`);
        }
      } catch (error) {
        console.error(`Failed to broadcast to ${guild.name}:`, error.message);
      }
    }
  }

  /**
   * Check if study party is currently active
   */
  isStudyPartyActive() {
    return this.studyPartyActive;
  }

  /**
   * Get current study party bonus multiplier
   */
  getStudyPartyBonus() {
    return this.studyPartyActive ? this.config.studyPartyBonus : 1.0;
  }

  /**
   * Get study party status
   */
  getStatus() {
    return {
      active: this.studyPartyActive,
      endTime: this.studyPartyEndTime,
      bonus: this.studyPartyActive ? this.config.studyPartyBonus : 1.0,
      lastActivity: this.lastActivityTime,
      timeSinceActivity: Date.now() - this.lastActivityTime
    };
  }

  /**
   * Manually trigger a study party (for admin/testing)
   */
  async manualTrigger() {
    this.lastActivityTime = 0; // Force stagnation
    await this.triggerStudyParty();
  }
}

// Singleton instance
export const sovereignOrchestrator = new SovereignOrchestrator();

export default sovereignOrchestrator;
