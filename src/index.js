import 'dotenv/config';
import { Client, GatewayIntentBits, Collection } from 'discord.js';
import { connectDatabase } from './database/connection.js';
import { loadCommands } from './bot/handlers/commandHandler.js';
import { loadEvents } from './bot/handlers/eventHandler.js';
import { logger } from './utils/logger.js';
import { seedAchievements } from './database/models/Achievement.js';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildVoiceStates,
  ],
});

client.commands = new Collection();

async function init() {
  try {
    await connectDatabase();
    logger.info('✅ Database connected');

    await seedAchievements();
    logger.info('✅ Achievements seeded');

    await loadCommands(client);
    logger.info('✅ Commands loaded');

    await loadEvents(client);
    logger.info('✅ Events loaded');

    await client.login(process.env.DISCORD_TOKEN);
  } catch (error) {
    logger.error('Failed to initialize bot:', error);
    process.exit(1);
  }
}

process.on('unhandledRejection', error => {
  logger.error('Unhandled promise rejection:', error);
});

init();
