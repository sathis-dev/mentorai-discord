import 'dotenv/config';
import { REST, Routes } from 'discord.js';
import { readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

async function deployCommands() {
  if (!process.env.DISCORD_TOKEN || !process.env.DISCORD_CLIENT_ID) {
    console.error('❌ Missing DISCORD_TOKEN or DISCORD_CLIENT_ID in .env');
    process.exit(1);
  }
  
  const commands = [];
  const commandsPath = join(__dirname, 'bot', 'commands');
  
  let commandFiles;
  try {
    commandFiles = readdirSync(commandsPath).filter(file => file.endsWith('.js'));
  } catch (error) {
    console.error('❌ Commands folder not found:', commandsPath);
    process.exit(1);
  }
  
  console.log('📦 Loading commands...');
  
  // Commands to skip from global registration (owner-only)
  const OWNER_ONLY_COMMANDS = ['admin'];
  
  for (const file of commandFiles) {
    try {
      const filePath = join(commandsPath, file);
      const fileUrl = pathToFileURL(filePath).href;
      const command = await import(fileUrl);
      
      if ('data' in command) {
        // Skip owner-only commands from global deployment
        if (OWNER_ONLY_COMMANDS.includes(command.data.name)) {
          console.log(`  ⊘ ${command.data.name} (owner-only, not deployed globally)`);
          continue;
        }
        commands.push(command.data.toJSON());
        console.log(`  ✓ ${command.data.name}`);
      }
    } catch (error) {
      console.error(`  ✗ Failed to load ${file}:`, error.message);
    }
  }
  
  if (commands.length === 0) {
    console.error('❌ No commands found to deploy');
    process.exit(1);
  }
  
  const rest = new REST().setToken(process.env.DISCORD_TOKEN);
  
  try {
    console.log(`\n🚀 Deploying ${commands.length} commands...`);
    
    // First, get existing commands to preserve Entry Point
    const existingCommands = await rest.get(
      Routes.applicationCommands(process.env.DISCORD_CLIENT_ID)
    );
    
    // Find Entry Point command if exists
    const entryPointCommand = existingCommands.find(cmd => cmd.type === 4);
    
    // If there's an entry point, include it in the update
    if (entryPointCommand) {
      console.log('📌 Preserving Entry Point command...');
      commands.push(entryPointCommand);
    }
    
    const data = await rest.put(
      Routes.applicationCommands(process.env.DISCORD_CLIENT_ID),
      { body: commands },
    );
    
    console.log(`✅ Successfully deployed ${data.length} commands globally!`);
    console.log('\n⚠️ Note: Global commands may take up to 1 hour to appear.');
  } catch (error) {
    // If bulk update fails, try individual command registration
    if (error.code === 50240) {
      console.log('\n⚠️ Entry Point conflict detected. Deploying commands individually...');
      
      let successCount = 0;
      for (const command of commands) {
        try {
          await rest.post(
            Routes.applicationCommands(process.env.DISCORD_CLIENT_ID),
            { body: command },
          );
          successCount++;
          console.log(`  ✓ Deployed: ${command.name}`);
        } catch (err) {
          console.error(`  ✗ Failed: ${command.name} - ${err.message}`);
        }
      }
      
      console.log(`\n✅ Deployed ${successCount}/${commands.length} commands!`);
    } else {
      console.error('❌ Failed to deploy commands:', error.message);
      process.exit(1);
    }
  }
}

deployCommands();
