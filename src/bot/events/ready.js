import { logger } from '../../utils/logger.js';

export const name = 'ready';
export const once = true;

export function execute(client) {
  logger.info(`🚀 MentorAI is online! Logged in as ${client.user.tag}`);
  
  client.user.setPresence({
    activities: [{ 
      name: '/learn to start learning!',
      type: 3
    }],
    status: 'online',
  });
  
  logger.info(`📊 Serving ${client.guilds.cache.size} servers`);
}
