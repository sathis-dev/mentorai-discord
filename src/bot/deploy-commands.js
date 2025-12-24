import 'dotenv/config';
import { REST, Routes } from 'discord.js';
import { readdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const commands = [];
const commandsPath = join(__dirname, 'commands');
const commandFiles = readdirSync(commandsPath).filter(file => file.endsWith('.js'));

async function deployCommands() {
  for (const file of commandFiles) {
    const command = await import(`file://${join(commandsPath, file)}`);
    if ('data' in command) {
      commands.push(command.data.toJSON());
    }
  }

  const rest = new REST().setToken(process.env.DISCORD_TOKEN);

  try {
    console.log(`🔄 Deploying ${commands.length} commands...`);

    await rest.put(
      Routes.applicationCommands(process.env.DISCORD_CLIENT_ID),
      { body: commands }
    );

    console.log('✅ Commands deployed successfully!');
    
  } catch (error) {
    console.error('❌ Failed to deploy commands:', error);
  }
}

deployCommands();
