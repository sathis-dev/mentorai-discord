import { readdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export async function loadCommands(client) {
  const commandsPath = join(__dirname, '..', 'commands');
  const commandFiles = readdirSync(commandsPath).filter(file => file.endsWith('.js'));

  for (const file of commandFiles) {
    const filePath = join(commandsPath, file);
    const command = await import(`file://${filePath}`);
    
    if ('data' in command && 'execute' in command) {
      client.commands.set(command.data.name, command);
    }
  }
}
