/**
 * /challenge Command - 1v1 Quiz Battle
 * 
 * Challenge another user to a quiz battle with:
 * - Real-time simultaneous questions
 * - Speed-based scoring
 * - XP rewards for winner
 */

import { 
  SlashCommandBuilder, 
  EmbedBuilder, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle 
} from 'discord.js';
import challengeManager from '../../services/multiplayer/challengeManager.js';
import { COLORS } from '../../config/colors.js';
import {
  createChallengeIssuedEmbed,
  createChallengeButtons,
  createChallengeAcceptedEmbed,
  createChallengeDeclinedEmbed,
  createChallengeExpiredEmbed,
  createBattleStartEmbed,
  createQuestionEmbed,
  createAnswerButtons,
  createQuestionResultEmbed,
  createVictoryEmbed,
  createDefeatEmbed,
  createDrawEmbed,
  createBattleSummaryEmbed,
  createLiveBattleEmbed
} from '../../embeds/challengeEmbeds.js';

// ═══════════════════════════════════════════════════════════════════
// COMMAND DEFINITION
// ═══════════════════════════════════════════════════════════════════

export const data = new SlashCommandBuilder()
  .setName('challenge')
  .setDescription('⚔️ Challenge another user to a 1v1 quiz battle!')
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
        { name: '📊 Algorithms', value: 'algorithms' },
        { name: '🗃️ Data Structures', value: 'data_structures' },
        { name: '🌐 HTML/CSS', value: 'web' },
        { name: '🎲 Random', value: 'random' }
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

// ═══════════════════════════════════════════════════════════════════
// MAIN EXECUTE FUNCTION
// ═══════════════════════════════════════════════════════════════════

export async function execute(interaction) {
  const challenger = interaction.user;
  const opponent = interaction.options.getUser('opponent');
  const topic = interaction.options.getString('topic') || 'random';
  const difficulty = interaction.options.getString('difficulty') || 'medium';
  const questions = interaction.options.getInteger('questions') || 5;
  
  // ─── Validations ───────────────────────────────────────────────
  
  // Can't challenge yourself
  if (challenger.id === opponent.id) {
    return interaction.reply({
      content: '❌ You cannot challenge yourself!',
      ephemeral: true
    });
  }
  
  // Can't challenge bots
  if (opponent.bot) {
    return interaction.reply({
      content: '❌ You cannot challenge bots!',
      ephemeral: true
    });
  }
  
  await interaction.deferReply();
  
  try {
    // Set client reference if not set
    if (!challengeManager.client) {
      challengeManager.setClient(interaction.client);
      setupChallengeEvents(interaction.client);
    }
    
    // Create challenge
    const challenge = await challengeManager.createChallenge(
      challenger.id,
      opponent.id,
      { topic, difficulty, questions }
    );
    
    // Store channel info
    challenge.channelId = interaction.channelId;
    
    // ─── Create Premium Challenge Embed ────────────────────────────────
    
    const embed = createChallengeIssuedEmbed(challenge, challenger, opponent);
    const row = createChallengeButtons(challenge.challengeId);
    
    const message = await interaction.editReply({
      content: `${opponent}, you have been challenged! ⚔️`,
      embeds: [embed],
      components: [row]
    });
    
    // Store message ID for later updates
    challenge.messageId = message.id;
    
  } catch (error) {
    console.error('Challenge creation error:', error);
    
    const errorEmbed = new EmbedBuilder()
      .setColor('#FF0000')
      .setTitle('❌ Challenge Failed')
      .setDescription(error.message || 'Failed to create challenge. Please try again.')
      .setTimestamp();
    
    await interaction.editReply({
      embeds: [errorEmbed],
      components: []
    });
  }
}

// ═══════════════════════════════════════════════════════════════════
// CHALLENGE EVENT HANDLERS
// ═══════════════════════════════════════════════════════════════════

function setupChallengeEvents(client) {
  // Prevent duplicate listeners
  if (challengeManager.eventsSetup) return;
  challengeManager.eventsSetup = true;
  
  // ─── Challenge Accepted ──────────────────────────────────────────
  challengeManager.on('challenge_accepted', async ({ challenge, battle }) => {
    try {
      const channel = await client.channels.fetch(challenge.channelId);
      if (!channel) return;
      
      const embed = createChallengeAcceptedEmbed(challenge, battle);
      
      // Update original message
      if (challenge.messageId) {
        try {
          const message = await channel.messages.fetch(challenge.messageId);
          await message.edit({
            content: '⚔️ Battle starting!',
            embeds: [embed],
            components: []
          });
        } catch (e) {
          await channel.send({ embeds: [embed] });
        }
      }
    } catch (error) {
      console.error('Error handling challenge_accepted:', error);
    }
  });
  
  // ─── Challenge Declined ──────────────────────────────────────────
  challengeManager.on('challenge_declined', async (challenge) => {
    try {
      const channel = await client.channels.fetch(challenge.channelId);
      if (!channel) return;
      
      const embed = createChallengeDeclinedEmbed(challenge);
      
      if (challenge.messageId) {
        try {
          const message = await channel.messages.fetch(challenge.messageId);
          await message.edit({
            content: '',
            embeds: [embed],
            components: []
          });
        } catch (e) {
          await channel.send({ embeds: [embed] });
        }
      }
    } catch (error) {
      console.error('Error handling challenge_declined:', error);
    }
  });
  
  // ─── Challenge Expired ───────────────────────────────────────────
  challengeManager.on('challenge_expired', async (challenge) => {
    try {
      const channel = await client.channels.fetch(challenge.channelId);
      if (!channel) return;
      
      const embed = createChallengeExpiredEmbed(challenge);
      
      if (challenge.messageId) {
        try {
          const message = await channel.messages.fetch(challenge.messageId);
          await message.edit({
            content: '',
            embeds: [embed],
            components: []
          });
        } catch (e) {
          // Message may have been deleted
        }
      }
    } catch (error) {
      console.error('Error handling challenge_expired:', error);
    }
  });
  
  // ─── Battle Countdown ────────────────────────────────────────────
  challengeManager.on('battle_countdown_start', async (battle) => {
    try {
      // Send DM to both players
      for (const player of battle.players) {
        try {
          const user = await client.users.fetch(player.discordId);
          const opponent = battle.players.find(p => p.discordId !== player.discordId);
          
          const embed = createBattleStartEmbed(battle, opponent?.username || 'Unknown');
          
          await user.send({ embeds: [embed] });
        } catch (e) {
          console.error(`Failed to DM ${player.username}:`, e.message);
        }
      }
    } catch (error) {
      console.error('Error in battle_countdown_start:', error);
    }
  });
  
  // ─── Question Started ────────────────────────────────────────────
  challengeManager.on('question_started', async ({ battleId, question, questionNumber, totalQuestions, timeLimit }) => {
    const battle = challengeManager.activeBattles.get(battleId);
    if (!battle) return;
    
    for (const player of battle.players) {
      try {
        const user = await client.users.fetch(player.discordId);
        
        const embed = createQuestionEmbed(question, questionNumber, totalQuestions, timeLimit);
        const row = createAnswerButtons(battleId);
        
        await user.send({ embeds: [embed], components: [row] });
      } catch (e) {
        console.error(`Failed to send question to ${player.username}:`, e.message);
      }
    }
  });
  
  // ─── Question Results ────────────────────────────────────────────
  challengeManager.on('question_results', async ({ battleId, question, results, leaderboard, questionNumber, totalQuestions }) => {
    const battle = challengeManager.activeBattles.get(battleId);
    if (!battle) return;
    
    for (const player of battle.players) {
      try {
        const user = await client.users.fetch(player.discordId);
        const playerResult = results.playerResults.find(r => r.discordId === player.discordId);
        
        const embed = createQuestionResultEmbed(
          playerResult, 
          results, 
          leaderboard, 
          questionNumber || battle.currentQuestion || 1, 
          totalQuestions || battle.settings?.questions || 5
        );
        
        await user.send({ embeds: [embed] });
      } catch (e) {
        console.error(`Failed to send results to ${player.username}:`, e.message);
      }
    }
  });
  
  // ─── Battle Complete ─────────────────────────────────────────────
  challengeManager.on('battle_complete', async ({ battleId, results, battle }) => {
    // Send results to each player via DM
    for (const player of battle.players) {
      try {
        const user = await client.users.fetch(player.discordId);
        const playerResult = results.players.find(p => p.discordId === player.discordId);
        const isWinner = results.winner === player.discordId && !results.isDraw;
        const opponent = battle.players.find(p => p.discordId !== player.discordId);
        const winner = battle.players.find(p => p.discordId === results.winner);
        
        let embed;
        if (results.isDraw) {
          embed = createDrawEmbed(playerResult, results, battle, opponent?.username || 'Opponent');
        } else if (isWinner) {
          embed = createVictoryEmbed(playerResult, results, battle, opponent?.username || 'Opponent');
        } else {
          embed = createDefeatEmbed(playerResult, results, battle, winner?.username || 'Winner');
        }
        
        await user.send({ embeds: [embed] });
      } catch (e) {
        console.error(`Failed to send final results to ${player.username}:`, e.message);
      }
    }
    
    // Post summary in original channel
    try {
      if (battle.channelId) {
        const channel = await client.channels.fetch(battle.channelId);
        if (channel) {
          const embed = createBattleSummaryEmbed(results, battle);
          await channel.send({ embeds: [embed] });
        }
      }
    } catch (e) {
      console.error('Failed to post battle summary:', e.message);
    }
  });
  
  console.log('✅ Challenge event handlers registered');
}

// ═══════════════════════════════════════════════════════════════════
// AUTOCOMPLETE HANDLER
// ═══════════════════════════════════════════════════════════════════

export async function autocomplete(interaction) {
  const focusedOption = interaction.options.getFocused(true);
  
  if (focusedOption.name === 'topic') {
    const topics = [
      { name: '🐍 Python', value: 'python' },
      { name: '🟨 JavaScript', value: 'javascript' },
      { name: '📊 Algorithms', value: 'algorithms' },
      { name: '🗃️ Data Structures', value: 'data_structures' },
      { name: '🌐 HTML/CSS', value: 'web' },
      { name: '☕ Java', value: 'java' },
      { name: '🔷 TypeScript', value: 'typescript' },
      { name: '🐹 Go', value: 'go' },
      { name: '🦀 Rust', value: 'rust' },
      { name: '💾 SQL', value: 'sql' },
      { name: '🎲 Random', value: 'random' }
    ];
    
    const filtered = topics.filter(t => 
      t.name.toLowerCase().includes(focusedOption.value.toLowerCase()) ||
      t.value.toLowerCase().includes(focusedOption.value.toLowerCase())
    );
    
    await interaction.respond(filtered.slice(0, 25));
  }
}

export default { data, execute, autocomplete };
