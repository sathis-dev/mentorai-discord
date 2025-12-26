import { readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

export async function loadEvents(client) {
  const eventsPath = join(__dirname, 'events');
  
  let eventFiles;
  try {
    eventFiles = readdirSync(eventsPath).filter(file => file.endsWith('.js'));
  } catch (error) {
    console.error('Failed to read events directory:', error);
    return;
  }
  
  for (const file of eventFiles) {
    try {
      const filePath = join(eventsPath, file);
      const fileUrl = pathToFileURL(filePath).href;
      const event = await import(fileUrl);
      
      if (event.once) {
        client.once(event.name, (...args) => event.execute(...args));
      } else {
        client.on(event.name, (...args) => event.execute(...args));
      }
      
      console.log(`  ✓ Loaded event: ${event.name}`);
    } catch (error) {
      console.error(`  ✗ Failed to load ${file}:`, error.message);
    }
  }
}
