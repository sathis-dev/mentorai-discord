/**
 * Challenge Interaction Handler
 * 
 * Handles button interactions for:
 * - Challenge accept/decline (legacy: challenge_, new: duel_)
 * - Battle answer submission (legacy: battle_, new: duel_)
 * - MongoDB-backed ChallengeSession for restart-resistant duels
 */

import { EmbedBuilder } from 'discord.js';
import challengeManager from '../services/multiplayer/challengeManager.js';

/**
 * Handle challenge-related button interactions
 * @param {ButtonInteraction} interaction - Discord button interaction
 * @returns {boolean} Whether the interaction was handled
 */
export async function handleChallengeInteraction(interaction) {
  const customId = interaction.customId;
  
  // Handle NEW MongoDB-backed duel buttons (from refactored challenge.js)
  if (customId.startsWith('duel_')) {
    const { handleButtonInteraction } = await import('../bot/commands/challenge.js');
    await handleButtonInteraction(interaction);
    return true;
  }
  
  // Only handle legacy challenge/battle buttons
  if (!customId.startsWith('challenge_') && !customId.startsWith('battle_')) {
    return false;
  }
  
  // Handle challenge accept
  if (customId.startsWith('challenge_accept_')) {
    await handleChallengeAccept(interaction);
    return true;
  }
  
  // Handle challenge decline
  if (customId.startsWith('challenge_decline_')) {
    await handleChallengeDecline(interaction);
    return true;
  }
  
  // Handle battle answer
  if (customId.startsWith('battle_answer_')) {
    await handleBattleAnswer(interaction);
    return true;
  }
  
  return false;
}

/**
 * Handle challenge accept button
 * @param {ButtonInteraction} interaction
 */
async function handleChallengeAccept(interaction) {
  const challengeId = interaction.customId.replace('challenge_accept_', '');
  
  // Get the challenge
  const challenge = challengeManager.getChallenge(challengeId);
  
  if (!challenge) {
    return interaction.reply({
      content: '❌ This challenge has expired or was already accepted.',
      ephemeral: true
    });
  }
  
  // Verify the user is the opponent
  if (challenge.opponent.discordId !== interaction.user.id) {
    return interaction.reply({
      content: '❌ Only the challenged player can accept this challenge!',
      ephemeral: true
    });
  }
  
  await interaction.deferReply({ ephemeral: true });
  
  try {
    // Set client if not set
    if (!challengeManager.client) {
      challengeManager.setClient(interaction.client);
    }
    
    // Setup legacy event handlers if not done
    try {
      const { setupLegacyChallengeEvents } = await import('../bot/commands/challenge.js');
      setupLegacyChallengeEvents(interaction.client);
    } catch (e) {
      console.error('Failed to setup legacy events:', e.message);
    }
    
    // Accept the challenge
    const battle = await challengeManager.acceptChallenge(challengeId, interaction.user.id);
    
    await interaction.editReply({
      content: '✅ Challenge accepted! Check your DMs for the battle. 🎮',
      ephemeral: true
    });
    
  } catch (error) {
    console.error('Challenge accept error:', error);
    
    await interaction.editReply({
      content: `❌ Failed to accept challenge: ${error.message}`,
      ephemeral: true
    });
  }
}

/**
 * Handle challenge decline button
 * @param {ButtonInteraction} interaction
 */
async function handleChallengeDecline(interaction) {
  const challengeId = interaction.customId.replace('challenge_decline_', '');
  
  // Get the challenge
  const challenge = challengeManager.getChallenge(challengeId);
  
  if (!challenge) {
    return interaction.reply({
      content: '❌ This challenge has already expired or been handled.',
      ephemeral: true
    });
  }
  
  // Verify the user is the opponent
  if (challenge.opponent.discordId !== interaction.user.id) {
    return interaction.reply({
      content: '❌ Only the challenged player can decline this challenge!',
      ephemeral: true
    });
  }
  
  await interaction.deferReply({ ephemeral: true });
  
  try {
    await challengeManager.declineChallenge(challengeId, interaction.user.id);
    
    await interaction.editReply({
      content: '✅ Challenge declined.',
      ephemeral: true
    });
    
  } catch (error) {
    console.error('Challenge decline error:', error);
    
    await interaction.editReply({
      content: `❌ Failed to decline challenge: ${error.message}`,
      ephemeral: true
    });
  }
}

/**
 * Handle battle answer button
 * @param {ButtonInteraction} interaction
 */
async function handleBattleAnswer(interaction) {
  // Parse battleId and answer from customId
  // Format: battle_answer_{battleId}_{answerIndex}
  const parts = interaction.customId.replace('battle_answer_', '').split('_');
  const answerIndex = parseInt(parts.pop());
  const battleId = parts.join('_');
  
  // Get the battle
  const battle = challengeManager.activeBattles.get(battleId);
  
  if (!battle) {
    return interaction.reply({
      content: '❌ This battle has ended or does not exist.',
      ephemeral: true
    });
  }
  
  // Verify the user is in the battle
  const player = battle.players.find(p => p.discordId === interaction.user.id);
  if (!player) {
    return interaction.reply({
      content: '❌ You are not part of this battle!',
      ephemeral: true
    });
  }
  
  // Check if battle is active
  if (battle.status !== 'active') {
    return interaction.reply({
      content: '❌ The battle is not currently active.',
      ephemeral: true
    });
  }
  
  await interaction.deferUpdate();
  
  try {
    const result = await challengeManager.submitAnswer(battleId, interaction.user.id, answerIndex);
    
    // Disable the buttons after answering
    const disabledRow = interaction.message.components[0];
    if (disabledRow) {
      const newComponents = disabledRow.components.map((btn, idx) => {
        const newBtn = { ...btn.data };
        newBtn.disabled = true;
        
        // Highlight selected answer
        if (idx === answerIndex) {
          newBtn.style = result.correct ? 3 : 4; // 3 = Success (green), 4 = Danger (red)
        }
        
        return newBtn;
      });
      
      // Update the message with disabled buttons
      try {
        await interaction.message.edit({
          components: [{
            type: 1,
            components: newComponents
          }]
        });
      } catch (e) {
        // Message might already be updated
      }
    }
    
    // Send feedback
    const answerLetter = String.fromCharCode(65 + answerIndex);
    const feedbackEmbed = new EmbedBuilder()
      .setColor(result.correct ? '#00FF00' : '#FF0000')
      .setDescription(
        result.correct 
          ? `✅ **Correct!** You selected **${answerLetter}**\n\n🎯 **+${result.points} points** (Speed bonus: +${result.speedBonus})\n📊 Total: **${result.totalScore} pts** | Position: **#${result.currentPosition}**`
          : `❌ **Incorrect!** You selected **${answerLetter}**\n\n📊 Total: **${result.totalScore} pts** | Position: **#${result.currentPosition}**`
      )
      .setFooter({ text: 'Waiting for opponent...' });
    
    await interaction.followUp({
      embeds: [feedbackEmbed],
      ephemeral: true
    });
    
  } catch (error) {
    console.error('Battle answer error:', error);
    
    // Only send error if we haven't already responded
    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({
        content: `❌ ${error.message}`,
        ephemeral: true
      });
    } else {
      await interaction.followUp({
        content: `❌ ${error.message}`,
        ephemeral: true
      });
    }
  }
}

export default { handleChallengeInteraction };
