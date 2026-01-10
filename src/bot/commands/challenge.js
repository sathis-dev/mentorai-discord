/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║   /challenge Command - Pro Max 1v1 Quiz Duel                                 ║
 * ║   DuelManager Game Engine • Real-Time Components • Single-Message UI        ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 * 
 * Features:
 *   - StringSelectMenu for topic selection
 *   - Modal for XP stake setting
 *   - MessageComponentCollector with strict filters
 *   - 2x2 Button Grid with instant feedback
 *   - ASCII progress bars for time remaining
 *   - Single-message editing (clean channels)
 *   - Auto-timeout with collector cleanup
 *   - Atomic MongoDB operations ($inc)
 */

import { SlashCommandBuilder } from 'discord.js';
import { duelManager } from '../../services/multiplayer/DuelManager.js';

// ═══════════════════════════════════════════════════════════════════════════════
// COMMAND DEFINITION
// ═══════════════════════════════════════════════════════════════════════════════

export const data = new SlashCommandBuilder()
  .setName('challenge')
  .setDescription('⚔️ Challenge another user to a Pro 1v1 Quiz Duel!')
  .addUserOption(option =>
    option.setName('opponent')
      .setDescription('User to challenge')
      .setRequired(true))
  .addStringOption(option =>
    option.setName('topic')
      .setDescription('Quiz topic')
      .setRequired(false)
      .addChoices(
        { name: '🐍 Python', value: 'python' },
        { name: '🟨 JavaScript', value: 'javascript' },
        { name: '⚛️ React', value: 'react' },
        { name: '📊 Algorithms', value: 'algorithms' },
        { name: '🗄️ SQL', value: 'sql' },
        { name: '🔷 TypeScript', value: 'typescript' },
        { name: '🟢 Node.js', value: 'nodejs' },
        { name: '🎲 Random Mix', value: 'random' }
      ))
  .addStringOption(option =>
    option.setName('difficulty')
      .setDescription('Quiz difficulty')
      .setRequired(false)
      .addChoices(
        { name: '🟢 Easy', value: 'easy' },
        { name: '🟡 Medium', value: 'medium' },
        { name: '🔴 Hard', value: 'hard' }
      ))
  .addIntegerOption(option =>
    option.setName('questions')
      .setDescription('Number of questions (3-10)')
      .setRequired(false)
      .setMinValue(3)
      .setMaxValue(10));

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN EXECUTE FUNCTION
// ═══════════════════════════════════════════════════════════════════════════════

export async function execute(interaction) {
  const opponent = interaction.options.getUser('opponent');
  const topic = interaction.options.getString('topic') || 'random';
  const difficulty = interaction.options.getString('difficulty') || 'medium';
  const questionCount = interaction.options.getInteger('questions') || 5;

  // Delegate to DuelManager
  await duelManager.startDuel(interaction, opponent, {
    topic,
    difficulty,
    questionCount,
    stake: 0
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// AUTOCOMPLETE HANDLER
// ═══════════════════════════════════════════════════════════════════════════════

export async function autocomplete(interaction) {
  const focusedOption = interaction.options.getFocused(true);
  
  if (focusedOption.name === 'topic') {
    const topics = [
      { name: '🐍 Python', value: 'python' },
      { name: '🟨 JavaScript', value: 'javascript' },
      { name: '⚛️ React', value: 'react' },
      { name: '📊 Algorithms', value: 'algorithms' },
      { name: '🗄️ SQL', value: 'sql' },
      { name: '🔷 TypeScript', value: 'typescript' },
      { name: '🟢 Node.js', value: 'nodejs' },
      { name: '☕ Java', value: 'java' },
      { name: '🎲 Random', value: 'random' }
    ];
    
    const filtered = topics.filter(t => 
      t.name.toLowerCase().includes(focusedOption.value.toLowerCase()) ||
      t.value.toLowerCase().includes(focusedOption.value.toLowerCase())
    );
    
    await interaction.respond(filtered.slice(0, 25));
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

export default { data, execute, autocomplete };
