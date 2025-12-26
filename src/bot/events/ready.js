import { ActivityType, Events } from 'discord.js';
import logger from '../../utils/logger.js';

export const name = Events.ClientReady;
export const once = true;

export async function execute(client) {
  logger.info(`🚀 MentorAI is online! Logged in as ${client.user.tag}`);
  logger.info(`📊 Serving ${client.guilds.cache.size} servers`);
  logger.info(`👥 Watching ${client.users.cache.size} users`);
  
  // Set initial bot status
  client.user.setActivity('🎓 /help to start learning!', { 
    type: ActivityType.Custom 
  });
  
  // Rotate engaging status messages
  const statuses = [
    { name: '🎓 Your AI-Powered Coding Mentor', type: ActivityType.Custom },
    { name: '🧠 Master Programming with AI Lessons', type: ActivityType.Custom },
    { name: '🎯 /quiz - Test Your Skills!', type: ActivityType.Playing },
    { name: `📚 Teaching ${client.guilds.cache.size}+ servers`, type: ActivityType.Custom },
    { name: '⚡ /learn - AI-Generated Lessons', type: ActivityType.Playing },
    { name: '🔥 Build Your Daily Streak!', type: ActivityType.Custom },
    { name: '🏆 Unlock Achievements & Level Up', type: ActivityType.Custom },
    { name: '💡 /help - See All Commands', type: ActivityType.Playing },
  ];
  
  let index = 0;
  setInterval(() => {
    index = (index + 1) % statuses.length;
    client.user.setActivity(statuses[index].name, { type: statuses[index].type });
  }, 20000); // Rotate every 20 seconds
}
