import { ActivityType, Events } from 'discord.js';
import logger from '../../utils/logger.js';

export const name = Events.ClientReady;
export const once = true;

export async function execute(client) {
  logger.info(`🚀 MentorAI is online! Logged in as ${client.user.tag}`);
  logger.info(`📊 Serving ${client.guilds.cache.size} servers`);
  logger.info(`👥 Watching ${client.users.cache.size} users`);
  
  // Set bot status
  client.user.setActivity('/help to start learning!', { 
    type: ActivityType.Playing 
  });
  
  // Rotate status messages
  const statuses = [
    { name: '/help to start learning!', type: ActivityType.Playing },
    { name: '/quiz to test your knowledge', type: ActivityType.Playing },
    { name: `${client.guilds.cache.size} servers`, type: ActivityType.Watching },
    { name: '/learn for AI lessons', type: ActivityType.Playing },
  ];
  
  let index = 0;
  setInterval(() => {
    index = (index + 1) % statuses.length;
    client.user.setActivity(statuses[index].name, { type: statuses[index].type });
  }, 30000);
}
