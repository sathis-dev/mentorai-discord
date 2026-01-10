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
    
    // ─── Create Challenge Embed ────────────────────────────────────
    
    const topicDisplay = {
      python: '🐍 Python',
      javascript: '🟨 JavaScript',
      algorithms: '📊 Algorithms',
      data_structures: '🗃️ Data Structures',
      web: '🌐 HTML/CSS',
      random: '🎲 Random'
    };
    
    const difficultyDisplay = {
      easy: '🟢 Easy',
      medium: '🟡 Medium',
      hard: '🔴 Hard'
    };
    
    const embed = new EmbedBuilder()
      .setColor(COLORS.primary || '#5865F2')
      .setTitle('⚔️ Quiz Challenge!')
      .setDescription(`**${challenger.username}** has challenged **${opponent.username}** to a quiz battle!`)
      .addFields(
        { 
          name: '📚 Topic', 
          value: topicDisplay[topic] || topic, 
          inline: true 
        },
        { 
          name: '⚡ Difficulty', 
          value: difficultyDisplay[difficulty] || difficulty, 
          inline: true 
        },
        { 
          name: '❓ Questions', 
          value: `${questions} questions`, 
          inline: true 
        },
        {
          name: '⏱️ Time Limit',
          value: '15 seconds per question',
          inline: true
        },
        {
          name: '🏆 Scoring',
          value: 'Fastest correct answer wins more points!',
          inline: true
        },
        {
          name: '⏳ Expires',
          value: '<t:' + Math.floor(challenge.expiresAt.getTime() / 1000) + ':R>',
          inline: true
        }
      )
      .setThumbnail(challenger.displayAvatarURL({ size: 128 }))
      .setFooter({ 
        text: `Challenge ID: ${challenge.challengeId.slice(-8)}` 
      })
      .setTimestamp();
    
    // ─── Create Buttons ────────────────────────────────────────────
    
    const row = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId(`challenge_accept_${challenge.challengeId}`)
          .setLabel('Accept Challenge')
          .setStyle(ButtonStyle.Success)
          .setEmoji('✅'),
        new ButtonBuilder()
          .setCustomId(`challenge_decline_${challenge.challengeId}`)
          .setLabel('Decline')
          .setStyle(ButtonStyle.Danger)
          .setEmoji('❌')
      );
    
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
      
      const embed = new EmbedBuilder()
        .setColor('#00FF00')
        .setTitle('✅ Challenge Accepted!')
        .setDescription(`**${challenge.opponent.username}** accepted the challenge!\n\nBattle starting in **5 seconds**...`)
        .addFields(
          { name: '🎮 Battle ID', value: `\`${battle.battleId.slice(-8)}\``, inline: true },
          { name: '👥 Players', value: `${challenge.challenger.username} vs ${challenge.opponent.username}`, inline: true }
        )
        .setTimestamp();
      
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
      
      const embed = new EmbedBuilder()
        .setColor('#FF0000')
        .setTitle('❌ Challenge Declined')
        .setDescription(`**${challenge.opponent.username}** declined the challenge.`)
        .setTimestamp();
      
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
      
      const embed = new EmbedBuilder()
        .setColor('#808080')
        .setTitle('⏰ Challenge Expired')
        .setDescription(`The challenge from **${challenge.challenger.username}** has expired.`)
        .setTimestamp();
      
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
          
          const embed = new EmbedBuilder()
            .setColor('#5865F2')
            .setTitle('⚔️ Quiz Battle Starting!')
            .setDescription(`You are battling **${opponent?.username || 'Unknown'}**!`)
            .addFields(
              { name: '📚 Topic', value: battle.settings.topic, inline: true },
              { name: '❓ Questions', value: `${battle.settings.questions}`, inline: true },
              { name: '⏱️ Time', value: '15s per question', inline: true }
            )
            .setFooter({ text: 'Get ready! Questions start in 5 seconds...' })
            .setTimestamp();
          
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
        
        const embed = new EmbedBuilder()
          .setColor('#5865F2')
          .setTitle(`❓ Question ${questionNumber}/${totalQuestions}`)
          .setDescription(`**${question.question}**`)
          .addFields(
            { name: 'A', value: question.options[0], inline: true },
            { name: 'B', value: question.options[1], inline: true },
            { name: '\u200b', value: '\u200b', inline: true },
            { name: 'C', value: question.options[2], inline: true },
            { name: 'D', value: question.options[3], inline: true },
            { name: '\u200b', value: '\u200b', inline: true }
          )
          .setFooter({ text: `⏱️ ${timeLimit / 1000} seconds | Answer quickly for bonus points!` })
          .setTimestamp();
        
        const row = new ActionRowBuilder()
          .addComponents(
            new ButtonBuilder()
              .setCustomId(`battle_answer_${battleId}_0`)
              .setLabel('A')
              .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
              .setCustomId(`battle_answer_${battleId}_1`)
              .setLabel('B')
              .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
              .setCustomId(`battle_answer_${battleId}_2`)
              .setLabel('C')
              .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
              .setCustomId(`battle_answer_${battleId}_3`)
              .setLabel('D')
              .setStyle(ButtonStyle.Primary)
          );
        
        await user.send({ embeds: [embed], components: [row] });
      } catch (e) {
        console.error(`Failed to send question to ${player.username}:`, e.message);
      }
    }
  });
  
  // ─── Question Results ────────────────────────────────────────────
  challengeManager.on('question_results', async ({ battleId, question, results, leaderboard }) => {
    const battle = challengeManager.activeBattles.get(battleId);
    if (!battle) return;
    
    for (const player of battle.players) {
      try {
        const user = await client.users.fetch(player.discordId);
        const playerResult = results.playerResults.find(r => r.discordId === player.discordId);
        
        const isCorrect = playerResult?.correct;
        const embed = new EmbedBuilder()
          .setColor(isCorrect ? '#00FF00' : '#FF0000')
          .setTitle(isCorrect ? '✅ Correct!' : '❌ Incorrect')
          .setDescription(`**Correct Answer:** ${String.fromCharCode(65 + results.correctAnswer)} - ${results.correctOption}`)
          .addFields(
            { 
              name: '💡 Explanation', 
              value: results.explanation || 'No explanation available.' 
            },
            { 
              name: '⏱️ Your Time', 
              value: playerResult?.timeTaken ? `${(playerResult.timeTaken / 1000).toFixed(1)}s` : 'Timeout', 
              inline: true 
            },
            { 
              name: '🎯 Points', 
              value: `+${playerResult?.points || 0}`, 
              inline: true 
            }
          );
        
        // Add leaderboard
        if (leaderboard && leaderboard.length > 0) {
          const leaderboardText = leaderboard
            .map((p, i) => `${i === 0 ? '👑' : '👤'} **${p.username}**: ${p.score} pts`)
            .join('\n');
          
          embed.addFields({ name: '📊 Current Standings', value: leaderboardText });
        }
        
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
        
        let title, color, description;
        if (results.isDraw) {
          title = '🤝 Draw!';
          color = '#FFD700';
          description = 'The battle ended in a draw! Both players performed equally.';
        } else if (isWinner) {
          title = '🏆 VICTORY!';
          color = '#FFD700';
          const opponent = battle.players.find(p => p.discordId !== player.discordId);
          description = `Congratulations! You defeated **${opponent?.username}**!`;
        } else {
          title = '💔 Defeat';
          color = '#808080';
          const winner = battle.players.find(p => p.discordId === results.winner);
          description = `**${winner?.username}** won this time. Better luck next round!`;
        }
        
        const embed = new EmbedBuilder()
          .setColor(color)
          .setTitle(title)
          .setDescription(description)
          .addFields(
            { name: '🎯 Your Score', value: `${playerResult?.score || 0} pts`, inline: true },
            { name: '📊 Accuracy', value: `${playerResult?.accuracy || 0}%`, inline: true },
            { name: '⏱️ Avg Time', value: `${playerResult?.averageTime || 0}s`, inline: true },
            { name: '✅ Correct', value: `${playerResult?.correct || 0}/${playerResult?.total || 0}`, inline: true },
            { name: '🔥 Best Streak', value: `${playerResult?.streak || 0}`, inline: true },
            { name: '⭐ XP Earned', value: `+${playerResult?.xpEarned || 0} XP`, inline: true }
          )
          .setTimestamp();
        
        // Add final leaderboard
        const leaderboardText = results.players
          .map((p, i) => {
            const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉';
            return `${medal} **${p.username}**: ${p.score} pts (${p.accuracy}%)`;
          })
          .join('\n');
        
        embed.addFields({ name: '🏆 Final Results', value: leaderboardText });
        
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
          const winner = battle.players.find(p => p.discordId === results.winner);
          const loser = battle.players.find(p => p.discordId !== results.winner);
          
          const embed = new EmbedBuilder()
            .setColor('#FFD700')
            .setTitle('⚔️ Battle Complete!')
            .setDescription(
              results.isDraw 
                ? `The battle between **${battle.players[0].username}** and **${battle.players[1].username}** ended in a **draw**!`
                : `🏆 **${winner?.username}** defeated **${loser?.username}**!`
            )
            .addFields(
              { 
                name: '📊 Final Scores', 
                value: results.players
                  .map((p, i) => `${i === 0 ? '🥇' : '🥈'} ${p.username}: ${p.score} pts (${p.accuracy}%)`)
                  .join('\n')
              }
            )
            .setTimestamp();
          
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
