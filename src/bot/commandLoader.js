import { readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

export async function loadCommands(client) {
  const commandsPath = join(__dirname, 'commands');
  
  let commandFiles;
  try {
    commandFiles = readdirSync(commandsPath).filter(file => file.endsWith('.js'));
  } catch (error) {
    console.error('Failed to read commands directory:', error);
    return;
  }
  
  for (const file of commandFiles) {
    try {
      const filePath = join(commandsPath, file);
      const fileUrl = pathToFileURL(filePath).href;
      const command = await import(fileUrl);
      
      if ('data' in command && 'execute' in command) {
        client.commands.set(command.data.name, command);
        console.log(`  ✓ Loaded command: ${command.data.name}`);
      } else {
        console.warn(`  ⚠ Command ${file} missing required exports`);
      }
    } catch (error) {
      console.error(`  ✗ Failed to load ${file}:`, error.message);
    }
  }
}
