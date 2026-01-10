import 'dotenv/config';
import { Client, GatewayIntentBits, Collection } from 'discord.js';
import { connectDatabase } from './database/connection.js';
import { loadCommands } from './bot/commandLoader.js';
import { loadEvents } from './bot/eventLoader.js';
import { setDiscordClient } from './services/broadcastService.js';
import { startAdminPanel } from './web/server.js';
import { sovereignOrchestrator } from './services/sovereignOrchestrator.js';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.commands = new Collection();

// Handle uncaught errors
process.on('unhandledRejection', (error) => {
  console.error('Unhandled promise rejection:', error);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
});

async function start() {
  try {
    console.log('🚀 Starting MentorAI...\n');

    // Validate environment variables
    if (!process.env.DISCORD_TOKEN) {
      throw new Error('DISCORD_TOKEN is required in .env file');
    }

    // Connect to database (non-blocking)
    const db = await connectDatabase();
    if (db) {
      console.log('✅ Database connected');
    } else {
      console.log('⚠️ Running without database');
    }

    // Load commands and events
    await loadCommands(client);
    console.log('✅ Commands loaded');

    await loadEvents(client);
    console.log('✅ Events loaded');

    // Login to Discord
    await client.login(process.env.DISCORD_TOKEN);
    
    // Connect broadcast service to Discord client
    setDiscordClient(client);
    console.log('✅ Broadcast service connected');
    
    // Initialize Sovereign Orchestrator for autonomous engagement
    sovereignOrchestrator.initialize(client);
    console.log('✅ Sovereign Orchestrator activated');
    
    // Start admin panel in the same process (shares Discord client)
    await startAdminPanel();
    console.log('✅ Admin panel started');
  } catch (error) {
    console.error('❌ Failed to start bot:', error.message);
    process.exit(1);
  }
}

start();
