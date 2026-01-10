/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║   MentorAI Premium Challenge Embeds                                          ║
 * ║   Competition-Winning UI for 1v1 Quiz Battles                                ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';

// ═══════════════════════════════════════════════════════════════════════════════
// 🎨 CHALLENGE COLOR PALETTE
// ═══════════════════════════════════════════════════════════════════════════════

const CHALLENGE_COLORS = {
  ISSUED: 0x5865F2,       // Discord Blurple - Fresh challenge
  ACCEPTED: 0x57F287,     // Green - Let's go!
  DECLINED: 0x95A5A6,     // Gray - Declined
  EXPIRED: 0x7F8C8D,      // Darker gray - Timed out
  BATTLE: 0xE91E63,       // Hot pink - Battle mode
  VICTORY: 0xFFD700,      // Gold - Winner
  DEFEAT: 0x607D8B,       // Slate - Loser
  DRAW: 0x9B59B6,         // Purple - Tie
  CORRECT: 0x2ECC71,      // Emerald - Right answer
  WRONG: 0xE74C3C,        // Red - Wrong answer
  TIMEOUT: 0xF39C12,      // Orange - Ran out of time
};

// ═══════════════════════════════════════════════════════════════════════════════
// 📐 LAYOUT HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

const DIVIDER = '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
const DIVIDER_THIN = '───────────────────────────────';
const SPACER = '\u200B';

/**
 * Create progress bar for battle
 */
function battleProgressBar(current, max, length = 10) {
  const filled = Math.round((current / Math.max(max, 1)) * length);
  const empty = length - filled;
  return '▓'.repeat(filled) + '░'.repeat(empty);
}

/**
 * Format time display
 */
function formatTime(ms) {
  return `${(ms / 1000).toFixed(1)}s`;
}

/**
 * Get rank emoji based on position
 */
function getRankEmoji(position) {
  return position === 0 ? '👑' : position === 1 ? '🥈' : '🥉';
}

// ═══════════════════════════════════════════════════════════════════════════════
// ⚔️ CHALLENGE ISSUED EMBED
// ═══════════════════════════════════════════════════════════════════════════════

export function createChallengeIssuedEmbed(challenge, challengerUser, opponentUser) {
  const topicDisplay = {
    python: '🐍 Python',
    javascript: '🟨 JavaScript',
    algorithms: '📊 Algorithms',
    data_structures: '🗃️ Data Structures',
    web: '🌐 HTML/CSS',
    java: '☕ Java',
    random: '🎲 Random Mix'
  };
  
  const difficultyDisplay = {
    easy: { text: '🟢 Easy', stars: '⭐' },
    medium: { text: '🟡 Medium', stars: '⭐⭐' },
    hard: { text: '🔴 Hard', stars: '⭐⭐⭐' }
  };
  
  const topic = challenge.options?.topic || 'random';
  const difficulty = challenge.options?.difficulty || 'medium';
  const questions = challenge.options?.questions || 5;
  
  const embed = new EmbedBuilder()
    .setColor(CHALLENGE_COLORS.ISSUED)
    .setAuthor({
      name: '⚔️ QUIZ BATTLE CHALLENGE',
      iconURL: challengerUser.displayAvatarURL({ size: 64 })
    })
    .setDescription(
      `### ${challengerUser.username} challenges ${opponentUser.username}!\n` +
      `\n` +
      `> *"Think you can beat me? Prove it!"*\n` +
      `\n` +
      `${DIVIDER}`
    )
    .addFields(
      {
        name: `👤 ${challengerUser.username}`,
        value: `Challenger`,
        inline: true
      },
      {
        name: '⚡ VS ⚡',
        value: SPACER,
        inline: true
      },
      {
        name: `👤 ${opponentUser.username}`,
        value: `Opponent`,
        inline: true
      }
    )
    .addFields(
      { name: SPACER, value: DIVIDER, inline: false }
    )
    .addFields(
      {
        name: '📚 Topic',
        value: topicDisplay[topic] || topic,
        inline: true
      },
      {
        name: '⚙️ Difficulty',
        value: difficultyDisplay[difficulty]?.text || difficulty,
        inline: true
      },
      {
        name: '❓ Questions',
        value: `${questions} rounds`,
        inline: true
      }
    )
    .addFields(
      {
        name: '⏱️ Time Limit',
        value: '15 seconds/question',
        inline: true
      },
      {
        name: '🏆 Scoring',
        value: 'Speed = Bonus pts!',
        inline: true
      },
      {
        name: '⏳ Expires',
        value: `<t:${Math.floor(challenge.expiresAt.getTime() / 1000)}:R>`,
        inline: true
      }
    )
    .setThumbnail(opponentUser.displayAvatarURL({ size: 256 }))
    .setFooter({
      text: `Challenge ID: ${challenge.challengeId?.slice(-8) || 'BATTLE'} • May the best coder win!`,
      iconURL: 'https://cdn.discordapp.com/embed/avatars/0.png'
    })
    .setTimestamp();
  
  return embed;
}

/**
 * Create challenge buttons
 */
export function createChallengeButtons(challengeId) {
  return new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId(`challenge_accept_${challengeId}`)
        .setLabel('Accept Battle')
        .setStyle(ButtonStyle.Success)
        .setEmoji('⚔️'),
      new ButtonBuilder()
        .setCustomId(`challenge_decline_${challengeId}`)
        .setLabel('Decline')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji('🚫')
    );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ✅ CHALLENGE ACCEPTED EMBED
// ═══════════════════════════════════════════════════════════════════════════════

export function createChallengeAcceptedEmbed(challenge, battle) {
  return new EmbedBuilder()
    .setColor(CHALLENGE_COLORS.ACCEPTED)
    .setAuthor({
      name: '⚔️ CHALLENGE ACCEPTED!',
      iconURL: 'https://cdn.discordapp.com/embed/avatars/0.png'
    })
    .setDescription(
      `### 🎮 Battle is starting!\n` +
      `\n` +
      `**${challenge.challenger.username}** ⚡ VS ⚡ **${challenge.opponent.username}**\n` +
      `\n` +
      `${DIVIDER}\n` +
      `\n` +
      `📱 **Check your DMs!** Questions will be sent privately.\n` +
      `⏱️ **Starting in 5 seconds...**\n` +
      `\n` +
      `> 💡 *Answer quickly for bonus points!*`
    )
    .addFields(
      {
        name: '📚 Topic',
        value: challenge.options?.topic || 'Random',
        inline: true
      },
      {
        name: '❓ Questions',
        value: `${challenge.options?.questions || 5}`,
        inline: true
      },
      {
        name: '🎯 Battle ID',
        value: `\`${battle.battleId?.slice(-8) || 'LIVE'}\``,
        inline: true
      }
    )
    .setFooter({ text: 'Good luck to both players!' })
    .setTimestamp();
}

// ═══════════════════════════════════════════════════════════════════════════════
// ❌ CHALLENGE DECLINED/EXPIRED EMBEDS
// ═══════════════════════════════════════════════════════════════════════════════

export function createChallengeDeclinedEmbed(challenge) {
  return new EmbedBuilder()
    .setColor(CHALLENGE_COLORS.DECLINED)
    .setAuthor({ name: '🚫 Challenge Declined' })
    .setDescription(
      `**${challenge.opponent.username}** declined the challenge from **${challenge.challenger.username}**.\n` +
      `\n` +
      `> *Perhaps another time!*`
    )
    .setFooter({ text: 'Better luck next time!' })
    .setTimestamp();
}

export function createChallengeExpiredEmbed(challenge) {
  return new EmbedBuilder()
    .setColor(CHALLENGE_COLORS.EXPIRED)
    .setAuthor({ name: '⏰ Challenge Expired' })
    .setDescription(
      `The challenge from **${challenge.challenger.username}** to **${challenge.opponent.username}** has expired.\n` +
      `\n` +
      `> *No response within 5 minutes.*`
    )
    .setFooter({ text: 'Create a new challenge to try again!' })
    .setTimestamp();
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🎮 BATTLE START EMBED (DM)
// ═══════════════════════════════════════════════════════════════════════════════

export function createBattleStartEmbed(battle, opponentName) {
  return new EmbedBuilder()
    .setColor(CHALLENGE_COLORS.BATTLE)
    .setAuthor({
      name: '⚔️ BATTLE STARTING!',
      iconURL: 'https://cdn.discordapp.com/embed/avatars/0.png'
    })
    .setDescription(
      `### You VS ${opponentName}\n` +
      `\n` +
      `${DIVIDER}\n` +
      `\n` +
      `🎯 **${battle.settings?.questions || 5} questions** • ⏱️ **15s each**\n` +
      `\n` +
      `📚 Topic: **${battle.settings?.topic || 'Random'}**\n` +
      `⚡ Difficulty: **${battle.settings?.difficulty || 'Medium'}**\n` +
      `\n` +
      `${DIVIDER}`
    )
    .addFields(
      {
        name: '💡 Pro Tips',
        value: 
          '```\n' +
          '• Answer FAST for bonus points\n' +
          '• First to answer correctly wins tiebreaker\n' +
          '• Wrong answer = 0 points\n' +
          '```',
        inline: false
      }
    )
    .setFooter({ text: '🚀 First question incoming in 5 seconds...' })
    .setTimestamp();
}

// ═══════════════════════════════════════════════════════════════════════════════
// ❓ QUESTION EMBED
// ═══════════════════════════════════════════════════════════════════════════════

export function createQuestionEmbed(question, questionNumber, totalQuestions, timeLimit = 15000) {
  const embed = new EmbedBuilder()
    .setColor(CHALLENGE_COLORS.BATTLE)
    .setAuthor({
      name: `Question ${questionNumber} of ${totalQuestions}`,
      iconURL: 'https://cdn.discordapp.com/embed/avatars/0.png'
    })
    .setTitle(`❓ ${question.question}`)
    .setDescription(
      `${DIVIDER_THIN}\n\n` +
      `🅰️  ${question.options[0]}\n\n` +
      `🅱️  ${question.options[1]}\n\n` +
      `🅲  ${question.options[2]}\n\n` +
      `🅳  ${question.options[3]}\n\n` +
      `${DIVIDER_THIN}`
    )
    .setFooter({
      text: `⏱️ ${timeLimit / 1000}s remaining • Answer quickly for bonus points!`
    })
    .setTimestamp();
  
  return embed;
}

/**
 * Create answer buttons
 */
export function createAnswerButtons(battleId, disabled = false) {
  return new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId(`battle_answer_${battleId}_0`)
        .setLabel('A')
        .setStyle(ButtonStyle.Primary)
        .setEmoji('🅰️')
        .setDisabled(disabled),
      new ButtonBuilder()
        .setCustomId(`battle_answer_${battleId}_1`)
        .setLabel('B')
        .setStyle(ButtonStyle.Primary)
        .setEmoji('🅱️')
        .setDisabled(disabled),
      new ButtonBuilder()
        .setCustomId(`battle_answer_${battleId}_2`)
        .setLabel('C')
        .setStyle(ButtonStyle.Primary)
        .setEmoji('🅲')
        .setDisabled(disabled),
      new ButtonBuilder()
        .setCustomId(`battle_answer_${battleId}_3`)
        .setLabel('D')
        .setStyle(ButtonStyle.Primary)
        .setEmoji('🅳')
        .setDisabled(disabled)
    );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 📊 QUESTION RESULT EMBED
// ═══════════════════════════════════════════════════════════════════════════════

export function createQuestionResultEmbed(playerResult, results, leaderboard, questionNumber, totalQuestions) {
  const isCorrect = playerResult?.correct;
  const answerLetters = ['A', 'B', 'C', 'D'];
  
  const embed = new EmbedBuilder()
    .setColor(isCorrect ? CHALLENGE_COLORS.CORRECT : CHALLENGE_COLORS.WRONG)
    .setAuthor({
      name: isCorrect ? '✅ CORRECT!' : '❌ WRONG!',
      iconURL: 'https://cdn.discordapp.com/embed/avatars/0.png'
    })
    .setDescription(
      `**Correct Answer:** ${answerLetters[results.correctAnswer]} - ${results.correctOption}\n` +
      `\n` +
      `${DIVIDER_THIN}\n` +
      `\n` +
      `${results.explanation || 'No explanation available.'}`
    )
    .addFields(
      {
        name: '⏱️ Your Time',
        value: playerResult?.timeTaken ? formatTime(playerResult.timeTaken) : '⏰ Timeout',
        inline: true
      },
      {
        name: '🎯 Points Earned',
        value: `+${playerResult?.points || 0}`,
        inline: true
      },
      {
        name: '📊 Progress',
        value: `${questionNumber}/${totalQuestions}`,
        inline: true
      }
    );
  
  // Add current standings
  if (leaderboard && leaderboard.length > 0) {
    const standingsText = leaderboard
      .map((p, i) => {
        const emoji = i === 0 ? '👑' : '  ';
        return `${emoji} **${p.username}**: ${p.score} pts`;
      })
      .join('\n');
    
    embed.addFields({
      name: '🏆 Current Standings',
      value: standingsText,
      inline: false
    });
  }
  
  if (questionNumber < totalQuestions) {
    embed.setFooter({ text: `Next question in 3 seconds...` });
  }
  
  return embed;
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🏆 VICTORY EMBED (Winner's DM)
// ═══════════════════════════════════════════════════════════════════════════════

export function createVictoryEmbed(playerResult, results, battle, opponentName) {
  const accuracy = playerResult?.accuracy || 0;
  const correctCount = playerResult?.correct || 0;
  const totalCount = playerResult?.total || 0;
  
  return new EmbedBuilder()
    .setColor(CHALLENGE_COLORS.VICTORY)
    .setAuthor({
      name: '🏆 VICTORY!',
      iconURL: 'https://cdn.discordapp.com/embed/avatars/0.png'
    })
    .setDescription(
      `### You defeated ${opponentName}!\n` +
      `\n` +
      `${DIVIDER}\n` +
      `\n` +
      `👑 **Champion Performance**\n` +
      `\n` +
      `\`\`\`\n` +
      `Score      │ ${playerResult?.score || 0} pts\n` +
      `Accuracy   │ ${accuracy}% (${correctCount}/${totalCount})\n` +
      `Avg Speed  │ ${playerResult?.averageTime || 0}s\n` +
      `\`\`\`\n` +
      `\n` +
      `${DIVIDER}`
    )
    .addFields(
      {
        name: '⭐ XP Earned',
        value: `**+${playerResult?.xpEarned || 0} XP**\n(includes win bonus!)`,
        inline: true
      },
      {
        name: '🔥 Win Streak',
        value: `${playerResult?.winStreak || 1} wins`,
        inline: true
      },
      {
        name: '📈 Battle Record',
        value: `See \`/stats\``,
        inline: true
      }
    )
    .setFooter({ text: 'GG! Challenge someone else to keep the streak!' })
    .setTimestamp();
}

// ═══════════════════════════════════════════════════════════════════════════════
// 💔 DEFEAT EMBED (Loser's DM)
// ═══════════════════════════════════════════════════════════════════════════════

export function createDefeatEmbed(playerResult, results, battle, winnerName) {
  const accuracy = playerResult?.accuracy || 0;
  const correctCount = playerResult?.correct || 0;
  const totalCount = playerResult?.total || 0;
  
  return new EmbedBuilder()
    .setColor(CHALLENGE_COLORS.DEFEAT)
    .setAuthor({
      name: '💔 Defeat',
      iconURL: 'https://cdn.discordapp.com/embed/avatars/0.png'
    })
    .setDescription(
      `### ${winnerName} wins this time!\n` +
      `\n` +
      `${DIVIDER}\n` +
      `\n` +
      `📊 **Your Performance**\n` +
      `\n` +
      `\`\`\`\n` +
      `Score      │ ${playerResult?.score || 0} pts\n` +
      `Accuracy   │ ${accuracy}% (${correctCount}/${totalCount})\n` +
      `Avg Speed  │ ${playerResult?.averageTime || 0}s\n` +
      `\`\`\`\n` +
      `\n` +
      `${DIVIDER}`
    )
    .addFields(
      {
        name: '⭐ XP Earned',
        value: `**+${playerResult?.xpEarned || 0} XP**\n(participation bonus)`,
        inline: true
      },
      {
        name: '💡 Tip',
        value: 'Practice makes perfect!',
        inline: true
      }
    )
    .setFooter({ text: 'Don\'t give up! Challenge again to improve.' })
    .setTimestamp();
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🤝 DRAW EMBED
// ═══════════════════════════════════════════════════════════════════════════════

export function createDrawEmbed(playerResult, results, battle, opponentName) {
  const accuracy = playerResult?.accuracy || 0;
  
  return new EmbedBuilder()
    .setColor(CHALLENGE_COLORS.DRAW)
    .setAuthor({
      name: '🤝 DRAW!',
      iconURL: 'https://cdn.discordapp.com/embed/avatars/0.png'
    })
    .setDescription(
      `### Tied with ${opponentName}!\n` +
      `\n` +
      `${DIVIDER}\n` +
      `\n` +
      `⚖️ **Evenly Matched!**\n` +
      `Both players scored **${playerResult?.score || 0} points**\n` +
      `\n` +
      `${DIVIDER}`
    )
    .addFields(
      {
        name: '⭐ XP Earned',
        value: `**+${playerResult?.xpEarned || 0} XP**`,
        inline: true
      },
      {
        name: '📊 Accuracy',
        value: `${accuracy}%`,
        inline: true
      }
    )
    .setFooter({ text: 'Rematch to break the tie!' })
    .setTimestamp();
}

// ═══════════════════════════════════════════════════════════════════════════════
// 📢 CHANNEL BATTLE SUMMARY EMBED
// ═══════════════════════════════════════════════════════════════════════════════

export function createBattleSummaryEmbed(results, battle) {
  const winner = battle.players.find(p => p.discordId === results.winner);
  const loser = battle.players.find(p => p.discordId !== results.winner);
  
  if (results.isDraw) {
    return new EmbedBuilder()
      .setColor(CHALLENGE_COLORS.DRAW)
      .setAuthor({
        name: '⚔️ BATTLE COMPLETE',
        iconURL: 'https://cdn.discordapp.com/embed/avatars/0.png'
      })
      .setDescription(
        `### 🤝 It's a Draw!\n` +
        `\n` +
        `**${battle.players[0].username}** ⚡ VS ⚡ **${battle.players[1].username}**\n` +
        `\n` +
        `${DIVIDER}\n` +
        `\n` +
        `Both players scored equally! Rematch?`
      )
      .addFields(
        {
          name: '📊 Final Scores',
          value: results.players
            .map((p, i) => `${i === 0 ? '🥇' : '🥈'} **${p.username}**: ${p.score} pts (${p.accuracy}%)`)
            .join('\n'),
          inline: false
        }
      )
      .setFooter({ text: 'Use /challenge for a rematch!' })
      .setTimestamp();
  }
  
  return new EmbedBuilder()
    .setColor(CHALLENGE_COLORS.VICTORY)
    .setAuthor({
      name: '⚔️ BATTLE COMPLETE',
      iconURL: 'https://cdn.discordapp.com/embed/avatars/0.png'
    })
    .setDescription(
      `### 👑 ${winner?.username} Wins!\n` +
      `\n` +
      `**${battle.players[0].username}** ⚡ VS ⚡ **${battle.players[1].username}**\n` +
      `\n` +
      `${DIVIDER}`
    )
    .addFields(
      {
        name: '🥇 Winner',
        value: `**${winner?.username}**\n${results.players.find(p => p.discordId === winner?.discordId)?.score || 0} pts`,
        inline: true
      },
      {
        name: '🥈 Runner-up',
        value: `**${loser?.username}**\n${results.players.find(p => p.discordId === loser?.discordId)?.score || 0} pts`,
        inline: true
      }
    )
    .addFields(
      {
        name: '📊 Battle Stats',
        value: results.players
          .sort((a, b) => b.score - a.score)
          .map((p, i) => `${i === 0 ? '👑' : '  '} ${p.username}: ${p.accuracy}% accuracy`)
          .join('\n'),
        inline: false
      }
    )
    .setFooter({ text: 'GG! Use /challenge to start another battle' })
    .setTimestamp();
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🔄 REMATCH BUTTONS
// ═══════════════════════════════════════════════════════════════════════════════

export function createRematchButtons(opponentId, originalSettings = {}) {
  return new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId(`challenge_rematch_${opponentId}`)
        .setLabel('Rematch')
        .setStyle(ButtonStyle.Primary)
        .setEmoji('🔄'),
      new ButtonBuilder()
        .setCustomId(`challenge_stats`)
        .setLabel('View Stats')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji('📊'),
      new ButtonBuilder()
        .setCustomId(`challenge_done`)
        .setLabel('Done')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji('✅')
    );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🔴 LIVE BATTLE HQ EMBED (Channel Status)
// ═══════════════════════════════════════════════════════════════════════════════

export function createLiveBattleEmbed(battle, questionNumber, totalQuestions, scores) {
  const player1 = battle.players[0];
  const player2 = battle.players[1];
  const score1 = scores[player1.discordId] || 0;
  const score2 = scores[player2.discordId] || 0;
  const maxScore = Math.max(score1, score2, 1);
  
  return new EmbedBuilder()
    .setColor(CHALLENGE_COLORS.BATTLE)
    .setAuthor({
      name: '🔴 LIVE BATTLE',
      iconURL: 'https://cdn.discordapp.com/embed/avatars/0.png'
    })
    .setDescription(
      `### ${player1.username} ⚡ VS ⚡ ${player2.username}\n` +
      `\n` +
      `${DIVIDER}\n` +
      `\n` +
      `📍 **Question ${questionNumber}/${totalQuestions}**\n` +
      `\n` +
      `${player1.username}\n` +
      `${battleProgressBar(score1, maxScore * 1.2, 15)} ${score1} pts\n` +
      `\n` +
      `${player2.username}\n` +
      `${battleProgressBar(score2, maxScore * 1.2, 15)} ${score2} pts\n` +
      `\n` +
      `${DIVIDER}`
    )
    .setFooter({ text: `Battle ID: ${battle.battleId?.slice(-8)}` })
    .setTimestamp();
}

export default {
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
  createRematchButtons,
  createLiveBattleEmbed,
  CHALLENGE_COLORS
};
