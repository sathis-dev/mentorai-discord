/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║   /challenge Command - Premium 1v1 Quiz Duel                                  ║
 * ║   MongoDB-Backed • Restart-Resistant • AI-Enhanced                           ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 * 
 * 3-Stage Flow:
 *   Stage 1: Premium Challenge Invite (Accept/Decline buttons)
 *   Stage 2: Loading Animation (3-second "Generating Duel..." progress bar)
 *   Stage 3: Simultaneous Questions (A/B/C/D buttons, first correct wins round)
 * 
 * Features:
 *   - MongoDB persistence via ChallengeSession model
 *   - Atomic XP updates with prestige/streak multipliers
 *   - AI-powered Post-Match Analysis via explainConcept service
 */

import { 
  SlashCommandBuilder, 
  EmbedBuilder, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle 
} from 'discord.js';
import { ChallengeSession } from '../../database/models/ChallengeSession.js';
import { User } from '../../database/models/User.js';
import { 
  XP_REWARDS, 
  calculateFinalXp, 
  addXpAtomic,
  getOrCreateUser,
  checkAchievements
} from '../../services/gamificationService.js';
import { getConceptExplanation } from '../../services/learningService.js';
import aiOrchestrator from '../../ai/orchestrator.js';
import { 
  COLORS, 
  EMOJIS,
  VISUALS,
  createProgressBar,
  getTopicEmoji,
  getDifficultyEmoji,
  getDifficultyColor,
  formatDuration
} from '../../config/brandSystem.js';

// ═══════════════════════════════════════════════════════════════════════════════
// 🎨 PREMIUM COLOR PALETTE
// ═══════════════════════════════════════════════════════════════════════════════

const DUEL_COLORS = {
  INVITE: 0x5865F2,        // Discord Blurple - Fresh challenge
  LOADING: 0x9B59B6,       // Purple - Generating
  BATTLE: 0xE91E63,        // Hot Pink - Active battle
  VICTORY: 0xFFD700,       // Gold - Winner
  DEFEAT: 0x607D8B,        // Slate - Loser
  DRAW: 0x9B59B6,          // Purple - Tie
  CORRECT: 0x57F287,       // Green - Right answer
  WRONG: 0xED4245,         // Red - Wrong answer
  ANALYSIS: 0x3498DB       // Blue - AI Analysis
};

// ═══════════════════════════════════════════════════════════════════════════════
// 📐 VISUAL CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════════

const DIVIDER = '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
const DIVIDER_THIN = '───────────────────────────────────';
const SPACER = '\u200B';

const TOPIC_DISPLAY = {
  python: '🐍 Python',
  javascript: '🟨 JavaScript',
  algorithms: '📊 Algorithms',
  data_structures: '🗃️ Data Structures',
  web: '🌐 HTML/CSS',
  java: '☕ Java',
  typescript: '🔷 TypeScript',
  random: '🎲 Random Mix'
};

const DIFFICULTY_DISPLAY = {
  easy: { text: '🟢 Easy', color: COLORS.EASY },
  medium: { text: '🟡 Medium', color: COLORS.MEDIUM },
  hard: { text: '🔴 Hard', color: COLORS.HARD }
};

// ═══════════════════════════════════════════════════════════════════════════════
// COMMAND DEFINITION
// ═══════════════════════════════════════════════════════════════════════════════

export const data = new SlashCommandBuilder()
  .setName('challenge')
  .setDescription('⚔️ Challenge another user to a 1v1 quiz duel!')
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

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN EXECUTE FUNCTION
// ═══════════════════════════════════════════════════════════════════════════════

export async function execute(interaction) {
  const challenger = interaction.user;
  const opponent = interaction.options.getUser('opponent');
  const topic = interaction.options.getString('topic') || 'random';
  const difficulty = interaction.options.getString('difficulty') || 'medium';
  const questionCount = interaction.options.getInteger('questions') || 5;
  
  // ─── Validations ───────────────────────────────────────────────
  
  if (challenger.id === opponent.id) {
    return interaction.reply({
      content: '❌ You cannot challenge yourself! Find a worthy opponent.',
      ephemeral: true
    });
  }
  
  if (opponent.bot) {
    return interaction.reply({
      content: '❌ Bots cannot accept challenges... yet. 🤖',
      ephemeral: true
    });
  }
  
  // Check if either user is in an active battle
  const [challengerBattle, opponentBattle] = await Promise.all([
    ChallengeSession.findActiveForPlayer(challenger.id),
    ChallengeSession.findActiveForPlayer(opponent.id)
  ]);
  
  if (challengerBattle) {
    return interaction.reply({
      content: '❌ You are already in an active duel! Finish it first.',
      ephemeral: true
    });
  }
  
  if (opponentBattle) {
    return interaction.reply({
      content: `❌ ${opponent.username} is already in a duel. Wait for them to finish.`,
      ephemeral: true
    });
  }
  
  // Check for pending challenge to opponent
  const pendingChallenge = await ChallengeSession.findPendingForOpponent(opponent.id);
  if (pendingChallenge && pendingChallenge.challenger.discordId !== challenger.id) {
    return interaction.reply({
      content: `❌ ${opponent.username} already has a pending challenge from someone else.`,
      ephemeral: true
    });
  }
  
  await interaction.deferReply();
  
  try {
    // Ensure both users exist in database
    await Promise.all([
      getOrCreateUser(challenger.id, challenger.username),
      getOrCreateUser(opponent.id, opponent.username)
    ]);
    
    // ─── STAGE 1: Create Challenge & Premium Invite ───────────────────────
    
    const challenge = await ChallengeSession.createChallenge(
      { discordId: challenger.id, username: challenger.username },
      { discordId: opponent.id, username: opponent.username },
      { topic, difficulty, questions: questionCount }
    );
    
    // Store channel for later updates
    challenge.channelId = interaction.channelId;
    
    const embed = createChallengeInviteEmbed(challenge, challenger, opponent);
    const buttons = createChallengeButtons(challenge.challengeId);
    
    const message = await interaction.editReply({
      content: `<@${opponent.id}>, you have been challenged to a duel! ⚔️`,
      embeds: [embed],
      components: [buttons]
    });
    
    // Store message ID for updates
    challenge.messageId = message.id;
    await challenge.save();
    
    // Set up expiration handler
    setTimeout(async () => {
      const currentChallenge = await ChallengeSession.findOne({ 
        challengeId: challenge.challengeId,
        status: 'pending'
      });
      
      if (currentChallenge) {
        currentChallenge.status = 'expired';
        await currentChallenge.save();
        
        const expiredEmbed = createExpiredEmbed(challenge);
        try {
          await interaction.editReply({
            content: '',
            embeds: [expiredEmbed],
            components: []
          });
        } catch (e) {
          // Message may have been deleted
        }
      }
    }, 5 * 60 * 1000); // 5 minutes
    
  } catch (error) {
    console.error('Challenge creation error:', error);
    
    const errorEmbed = new EmbedBuilder()
      .setColor(COLORS.ERROR)
      .setTitle('❌ Challenge Failed')
      .setDescription(error.message || 'Failed to create challenge. Please try again.')
      .setTimestamp();
    
    await interaction.editReply({
      embeds: [errorEmbed],
      components: []
    });
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// STAGE 1: CHALLENGE INVITE EMBED
// ═══════════════════════════════════════════════════════════════════════════════

function createChallengeInviteEmbed(challenge, challengerUser, opponentUser) {
  const topic = challenge.settings?.topic || 'random';
  const difficulty = challenge.settings?.difficulty || 'medium';
  const questions = challenge.settings?.questionCount || 5;
  
  return new EmbedBuilder()
    .setColor(DUEL_COLORS.INVITE)
    .setAuthor({
      name: '⚔️ QUIZ DUEL CHALLENGE',
      iconURL: challengerUser.displayAvatarURL({ size: 64 })
    })
    .setDescription(
      `## ${challengerUser.username} challenges ${opponentUser.username}!\n` +
      `\n` +
      `> *"Think you can beat me? Prove it in the arena!"*\n` +
      `\n` +
      `${DIVIDER}`
    )
    .addFields(
      {
        name: `🎮 ${challengerUser.username}`,
        value: '`Challenger`',
        inline: true
      },
      {
        name: '⚡ VS ⚡',
        value: SPACER,
        inline: true
      },
      {
        name: `🎯 ${opponentUser.username}`,
        value: '`Opponent`',
        inline: true
      }
    )
    .addFields({ name: SPACER, value: DIVIDER, inline: false })
    .addFields(
      {
        name: '📚 Topic',
        value: TOPIC_DISPLAY[topic] || topic,
        inline: true
      },
      {
        name: '⚙️ Difficulty',
        value: DIFFICULTY_DISPLAY[difficulty]?.text || difficulty,
        inline: true
      },
      {
        name: '❓ Rounds',
        value: `${questions} questions`,
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
        name: '🏆 Win Bonus',
        value: `+${XP_REWARDS.CHALLENGE_WIN} XP`,
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
      text: `🎯 First to answer correctly wins each round • Speed = Bonus Points!`
    })
    .setTimestamp();
}

function createChallengeButtons(challengeId) {
  return new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId(`duel_accept_${challengeId}`)
        .setLabel('Accept Duel')
        .setStyle(ButtonStyle.Success)
        .setEmoji('⚔️'),
      new ButtonBuilder()
        .setCustomId(`duel_decline_${challengeId}`)
        .setLabel('Decline')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji('🚫')
    );
}

// ═══════════════════════════════════════════════════════════════════════════════
// STAGE 2: LOADING ANIMATION EMBED
// ═══════════════════════════════════════════════════════════════════════════════

function createLoadingEmbed(stage, totalStages = 10) {
  const progressBars = [
    '░░░░░░░░░░',
    '▓░░░░░░░░░',
    '▓▓░░░░░░░░',
    '▓▓▓░░░░░░░',
    '▓▓▓▓░░░░░░',
    '▓▓▓▓▓░░░░░',
    '▓▓▓▓▓▓░░░░',
    '▓▓▓▓▓▓▓░░░',
    '▓▓▓▓▓▓▓▓░░',
    '▓▓▓▓▓▓▓▓▓░',
    '▓▓▓▓▓▓▓▓▓▓'
  ];
  
  const messages = [
    '🔮 Channeling quiz energy...',
    '🧠 Generating questions...',
    '⚡ Calibrating difficulty...',
    '🎯 Preparing the arena...',
    '🚀 Almost ready...'
  ];
  
  const barIndex = Math.min(stage, progressBars.length - 1);
  const msgIndex = Math.min(Math.floor(stage / 2), messages.length - 1);
  
  return new EmbedBuilder()
    .setColor(DUEL_COLORS.LOADING)
    .setTitle('⚔️ GENERATING DUEL...')
    .setDescription(
      `\n` +
      `╭─────────────────────────────────╮\n` +
      `│                                 │\n` +
      `│   ${messages[msgIndex].padEnd(28)} │\n` +
      `│                                 │\n` +
      `│   [${progressBars[barIndex]}]  ${Math.round((stage / totalStages) * 100)}%    │\n` +
      `│                                 │\n` +
      `╰─────────────────────────────────╯\n`
    )
    .setFooter({ text: '🎮 Preparing your battle experience...' });
}

// ═══════════════════════════════════════════════════════════════════════════════
// STAGE 3: BATTLE QUESTION EMBED
// ═══════════════════════════════════════════════════════════════════════════════

function createQuestionEmbed(question, questionNumber, totalQuestions, timeLimit = 15) {
  return new EmbedBuilder()
    .setColor(DUEL_COLORS.BATTLE)
    .setAuthor({
      name: `⚔️ ROUND ${questionNumber} OF ${totalQuestions}`,
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
    .addFields({
      name: '⏱️ Time Remaining',
      value: `\`${timeLimit} seconds\``,
      inline: true
    })
    .setFooter({
      text: '⚡ First correct answer wins the round! Speed = Bonus Points!'
    })
    .setTimestamp();
}

function createAnswerButtons(challengeId, disabled = false) {
  return new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId(`duel_answer_${challengeId}_0`)
        .setLabel('A')
        .setStyle(ButtonStyle.Primary)
        .setEmoji('🅰️')
        .setDisabled(disabled),
      new ButtonBuilder()
        .setCustomId(`duel_answer_${challengeId}_1`)
        .setLabel('B')
        .setStyle(ButtonStyle.Primary)
        .setEmoji('🅱️')
        .setDisabled(disabled),
      new ButtonBuilder()
        .setCustomId(`duel_answer_${challengeId}_2`)
        .setLabel('C')
        .setStyle(ButtonStyle.Primary)
        .setEmoji('🅲')
        .setDisabled(disabled),
      new ButtonBuilder()
        .setCustomId(`duel_answer_${challengeId}_3`)
        .setLabel('D')
        .setStyle(ButtonStyle.Primary)
        .setEmoji('🅳')
        .setDisabled(disabled)
    );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ROUND RESULT EMBED
// ═══════════════════════════════════════════════════════════════════════════════

function createRoundResultEmbed(playerResult, correctAnswer, explanation, leaderboard, questionNum, totalQuestions) {
  const isCorrect = playerResult?.correct;
  const answerLetters = ['A', 'B', 'C', 'D'];
  
  const embed = new EmbedBuilder()
    .setColor(isCorrect ? DUEL_COLORS.CORRECT : DUEL_COLORS.WRONG)
    .setAuthor({
      name: isCorrect ? '✅ CORRECT!' : '❌ WRONG!',
      iconURL: 'https://cdn.discordapp.com/embed/avatars/0.png'
    })
    .setDescription(
      `**Correct Answer:** ${answerLetters[correctAnswer.correctIndex]} - ${correctAnswer.options[correctAnswer.correctIndex]}\n\n` +
      `${DIVIDER_THIN}\n\n` +
      `💡 ${explanation || 'Great job on this question!'}`
    )
    .addFields(
      {
        name: '⏱️ Your Time',
        value: playerResult?.timeTaken ? `${(playerResult.timeTaken / 1000).toFixed(1)}s` : '⏰ Timeout',
        inline: true
      },
      {
        name: '🎯 Points Earned',
        value: `+${playerResult?.points || 0}`,
        inline: true
      },
      {
        name: '📊 Progress',
        value: `${questionNum}/${totalQuestions}`,
        inline: true
      }
    );
  
  if (leaderboard && leaderboard.length > 0) {
    const standingsText = leaderboard
      .map((p, i) => `${i === 0 ? '👑' : '  '} **${p.username}**: ${p.score} pts`)
      .join('\n');
    
    embed.addFields({
      name: '🏆 Current Standings',
      value: standingsText,
      inline: false
    });
  }
  
  if (questionNum < totalQuestions) {
    embed.setFooter({ text: '⏳ Next round in 3 seconds...' });
  }
  
  return embed;
}

// ═══════════════════════════════════════════════════════════════════════════════
// FINAL RESULT EMBEDS
// ═══════════════════════════════════════════════════════════════════════════════

function createVictoryEmbed(playerResult, results, opponentName, xpAwarded) {
  return new EmbedBuilder()
    .setColor(DUEL_COLORS.VICTORY)
    .setAuthor({
      name: '🏆 VICTORY!',
      iconURL: 'https://cdn.discordapp.com/embed/avatars/0.png'
    })
    .setDescription(
      `## You defeated ${opponentName}!\n\n` +
      `${DIVIDER}\n\n` +
      `👑 **Champion Performance**\n\n` +
      `\`\`\`\n` +
      `Score      │ ${playerResult?.score || 0} pts\n` +
      `Accuracy   │ ${playerResult?.accuracy || 0}%\n` +
      `Correct    │ ${playerResult?.correct || 0}/${playerResult?.total || 0}\n` +
      `\`\`\`\n\n` +
      `${DIVIDER}`
    )
    .addFields(
      {
        name: '⭐ XP Earned',
        value: `**+${xpAwarded.finalXp} XP**\n${xpAwarded.multiplier > 1 ? `(${xpAwarded.breakdown.baseXp} × ${xpAwarded.multiplier.toFixed(2)}x)` : '(includes win bonus!)'}`,
        inline: true
      },
      {
        name: '🎯 Win Streak',
        value: 'See `/profile`',
        inline: true
      }
    )
    .setFooter({ text: 'GG! Challenge someone else to keep winning!' })
    .setTimestamp();
}

function createDefeatEmbed(playerResult, results, winnerName, xpAwarded) {
  return new EmbedBuilder()
    .setColor(DUEL_COLORS.DEFEAT)
    .setAuthor({
      name: '💔 Defeat',
      iconURL: 'https://cdn.discordapp.com/embed/avatars/0.png'
    })
    .setDescription(
      `## ${winnerName} wins this time!\n\n` +
      `${DIVIDER}\n\n` +
      `📊 **Your Performance**\n\n` +
      `\`\`\`\n` +
      `Score      │ ${playerResult?.score || 0} pts\n` +
      `Accuracy   │ ${playerResult?.accuracy || 0}%\n` +
      `Correct    │ ${playerResult?.correct || 0}/${playerResult?.total || 0}\n` +
      `\`\`\`\n\n` +
      `${DIVIDER}`
    )
    .addFields(
      {
        name: '⭐ XP Earned',
        value: `**+${xpAwarded.finalXp} XP**\n(participation bonus)`,
        inline: true
      },
      {
        name: '💡 Tip',
        value: 'Practice makes perfect!',
        inline: true
      }
    )
    .setFooter({ text: "Don't give up! Challenge again to improve." })
    .setTimestamp();
}

function createDrawEmbed(playerResult, opponentName, xpAwarded) {
  return new EmbedBuilder()
    .setColor(DUEL_COLORS.DRAW)
    .setAuthor({
      name: '🤝 DRAW!',
      iconURL: 'https://cdn.discordapp.com/embed/avatars/0.png'
    })
    .setDescription(
      `## Tied with ${opponentName}!\n\n` +
      `${DIVIDER}\n\n` +
      `⚖️ **Evenly Matched!**\n` +
      `Both players scored **${playerResult?.score || 0} points**\n\n` +
      `${DIVIDER}`
    )
    .addFields(
      {
        name: '⭐ XP Earned',
        value: `**+${xpAwarded.finalXp} XP**`,
        inline: true
      },
      {
        name: '📊 Accuracy',
        value: `${playerResult?.accuracy || 0}%`,
        inline: true
      }
    )
    .setFooter({ text: 'Rematch to break the tie!' })
    .setTimestamp();
}

// ═══════════════════════════════════════════════════════════════════════════════
// AI POST-MATCH ANALYSIS EMBED
// ═══════════════════════════════════════════════════════════════════════════════

function createPostMatchAnalysisEmbed(analysis, topic) {
  return new EmbedBuilder()
    .setColor(DUEL_COLORS.ANALYSIS)
    .setAuthor({
      name: '🎓 MENTOR\'S POST-MATCH ANALYSIS',
      iconURL: 'https://cdn.discordapp.com/embed/avatars/0.png'
    })
    .setDescription(
      `${DIVIDER}\n\n` +
      `${analysis}\n\n` +
      `${DIVIDER}`
    )
    .addFields({
      name: '📚 Want to learn more?',
      value: `Use \`/learn ${topic}\` to dive deeper into this topic!`,
      inline: false
    })
    .setFooter({ text: '🧠 MentorAI • Your coding companion' })
    .setTimestamp();
}

// ═══════════════════════════════════════════════════════════════════════════════
// CHANNEL SUMMARY EMBED
// ═══════════════════════════════════════════════════════════════════════════════

function createBattleSummaryEmbed(challenge, results) {
  const winner = challenge.players.find(p => p.discordId === results.winner);
  const loser = challenge.players.find(p => p.discordId !== results.winner);
  
  if (results.isDraw) {
    return new EmbedBuilder()
      .setColor(DUEL_COLORS.DRAW)
      .setAuthor({
        name: '⚔️ DUEL COMPLETE',
        iconURL: 'https://cdn.discordapp.com/embed/avatars/0.png'
      })
      .setDescription(
        `## 🤝 It's a Draw!\n\n` +
        `**${challenge.players[0].username}** ⚡ VS ⚡ **${challenge.players[1].username}**\n\n` +
        `${DIVIDER}\n\n` +
        `Both gladiators scored equally! Time for a rematch?`
      )
      .addFields({
        name: '📊 Final Scores',
        value: challenge.players
          .map((p, i) => `${i === 0 ? '🥇' : '🥈'} **${p.username}**: ${p.score} pts`)
          .join('\n'),
        inline: false
      })
      .setFooter({ text: 'Use /challenge for a rematch!' })
      .setTimestamp();
  }
  
  return new EmbedBuilder()
    .setColor(DUEL_COLORS.VICTORY)
    .setAuthor({
      name: '⚔️ DUEL COMPLETE',
      iconURL: 'https://cdn.discordapp.com/embed/avatars/0.png'
    })
    .setDescription(
      `## 👑 ${winner?.username} Wins!\n\n` +
      `**${challenge.players[0].username}** ⚡ VS ⚡ **${challenge.players[1].username}**\n\n` +
      `${DIVIDER}`
    )
    .addFields(
      {
        name: '🥇 Winner',
        value: `**${winner?.username}**\n${results.winnerScore} pts`,
        inline: true
      },
      {
        name: '🥈 Runner-up',
        value: `**${loser?.username}**\n${results.loserScore} pts`,
        inline: true
      }
    )
    .addFields({
      name: '📊 Battle Stats',
      value: `👑 ${winner?.username}: ${results.winnerAccuracy}% accuracy\n` +
             `   ${loser?.username}: ${results.loserAccuracy}% accuracy`,
      inline: false
    })
    .setFooter({ text: 'GG! Use /challenge to start another duel' })
    .setTimestamp();
}

// ═══════════════════════════════════════════════════════════════════════════════
// UTILITY EMBEDS
// ═══════════════════════════════════════════════════════════════════════════════

function createDeclinedEmbed(challenge) {
  return new EmbedBuilder()
    .setColor(0x95A5A6)
    .setAuthor({ name: '🚫 Challenge Declined' })
    .setDescription(
      `**${challenge.opponent.username}** declined the challenge from **${challenge.challenger.username}**.\n\n` +
      `> *Perhaps another time!*`
    )
    .setFooter({ text: 'Better luck next time!' })
    .setTimestamp();
}

function createExpiredEmbed(challenge) {
  return new EmbedBuilder()
    .setColor(0x7F8C8D)
    .setAuthor({ name: '⏰ Challenge Expired' })
    .setDescription(
      `The challenge from **${challenge.challenger.username}** to **${challenge.opponent.username}** has expired.\n\n` +
      `> *No response within 5 minutes.*`
    )
    .setFooter({ text: 'Create a new challenge to try again!' })
    .setTimestamp();
}

function createBattleStartEmbed(challenge, opponentName) {
  return new EmbedBuilder()
    .setColor(DUEL_COLORS.BATTLE)
    .setAuthor({
      name: '⚔️ DUEL STARTING!',
      iconURL: 'https://cdn.discordapp.com/embed/avatars/0.png'
    })
    .setDescription(
      `## You VS ${opponentName}\n\n` +
      `${DIVIDER}\n\n` +
      `🎯 **${challenge.settings.questionCount} questions** • ⏱️ **15s each**\n\n` +
      `📚 Topic: **${TOPIC_DISPLAY[challenge.settings.topic] || challenge.settings.topic}**\n` +
      `⚡ Difficulty: **${DIFFICULTY_DISPLAY[challenge.settings.difficulty]?.text || challenge.settings.difficulty}**\n\n` +
      `${DIVIDER}`
    )
    .addFields({
      name: '💡 Pro Tips',
      value: 
        '```\n' +
        '• Answer FAST for bonus points\n' +
        '• First correct answer wins round\n' +
        '• Wrong answer = 0 points\n' +
        '```',
      inline: false
    })
    .setFooter({ text: '🚀 First question incoming in 3 seconds...' })
    .setTimestamp();
}

// ═══════════════════════════════════════════════════════════════════════════════
// BUTTON INTERACTION HANDLER
// ═══════════════════════════════════════════════════════════════════════════════

export async function handleButtonInteraction(interaction) {
  const customId = interaction.customId;
  
  // Handle challenge accept/decline
  if (customId.startsWith('duel_accept_')) {
    return handleAccept(interaction);
  }
  
  if (customId.startsWith('duel_decline_')) {
    return handleDecline(interaction);
  }
  
  // Handle answer submission
  if (customId.startsWith('duel_answer_')) {
    return handleAnswer(interaction);
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// ACCEPT HANDLER - STAGE 2 LOADING ANIMATION
// ═══════════════════════════════════════════════════════════════════════════════

async function handleAccept(interaction) {
  const challengeId = interaction.customId.replace('duel_accept_', '');
  
  const challenge = await ChallengeSession.getByIdIfValid(challengeId);
  if (!challenge) {
    return interaction.reply({
      content: '❌ This challenge has expired or no longer exists.',
      ephemeral: true
    });
  }
  
  // Verify accepter is the opponent
  if (challenge.opponent.discordId !== interaction.user.id) {
    return interaction.reply({
      content: '❌ Only the challenged player can accept!',
      ephemeral: true
    });
  }
  
  await interaction.deferUpdate();
  
  try {
    // ─── STAGE 2: Loading Animation ───────────────────────────────────────
    
    challenge.status = 'loading';
    await challenge.save();
    
    // Show loading animation with progress bar updates
    for (let stage = 0; stage <= 10; stage++) {
      const loadingEmbed = createLoadingEmbed(stage);
      await interaction.editReply({
        content: '',
        embeds: [loadingEmbed],
        components: []
      });
      
      if (stage < 10) {
        await sleep(300); // 3 seconds total for animation
      }
    }
    
    // Generate questions using AI
    const questions = await generateDuelQuestions(challenge.settings);
    
    // Accept challenge with questions
    await challenge.accept(questions);
    
    // ─── STAGE 3: Start Battle ───────────────────────────────────────────
    
    // Send battle start to channel
    const battleStartEmbed = new EmbedBuilder()
      .setColor(DUEL_COLORS.BATTLE)
      .setTitle('⚔️ DUEL ACCEPTED!')
      .setDescription(
        `**${challenge.challenger.username}** vs **${challenge.opponent.username}**\n\n` +
        `📱 **Check your DMs!** Questions will be sent privately.\n` +
        `⏱️ **Starting now...**`
      )
      .setFooter({ text: 'May the best coder win!' })
      .setTimestamp();
    
    await interaction.editReply({
      embeds: [battleStartEmbed],
      components: []
    });
    
    // Send DMs to both players
    const client = interaction.client;
    
    for (const player of challenge.players) {
      try {
        const user = await client.users.fetch(player.discordId);
        const opponent = challenge.players.find(p => p.discordId !== player.discordId);
        
        const startEmbed = createBattleStartEmbed(challenge, opponent.username);
        const dm = await user.send({ embeds: [startEmbed] });
        
        // Store DM info
        player.channelId = dm.channelId;
        player.messageId = dm.id;
      } catch (e) {
        console.error(`Failed to DM ${player.username}:`, e.message);
      }
    }
    
    await challenge.save();
    
    // Wait 3 seconds then start first question
    await sleep(3000);
    
    await challenge.startBattle();
    await sendQuestion(client, challenge);
    
  } catch (error) {
    console.error('Error accepting challenge:', error);
    await interaction.editReply({
      content: '❌ Failed to start duel. Please try again.',
      embeds: [],
      components: []
    });
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// DECLINE HANDLER
// ═══════════════════════════════════════════════════════════════════════════════

async function handleDecline(interaction) {
  const challengeId = interaction.customId.replace('duel_decline_', '');
  
  const challenge = await ChallengeSession.getByIdIfValid(challengeId);
  if (!challenge) {
    return interaction.reply({
      content: '❌ This challenge has expired or no longer exists.',
      ephemeral: true
    });
  }
  
  if (challenge.opponent.discordId !== interaction.user.id) {
    return interaction.reply({
      content: '❌ Only the challenged player can decline!',
      ephemeral: true
    });
  }
  
  await challenge.decline();
  
  const embed = createDeclinedEmbed(challenge);
  await interaction.update({
    content: '',
    embeds: [embed],
    components: []
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// ANSWER HANDLER
// ═══════════════════════════════════════════════════════════════════════════════

async function handleAnswer(interaction) {
  const parts = interaction.customId.split('_');
  const challengeId = parts[2];
  const answerIndex = parseInt(parts[3]);
  
  const challenge = await ChallengeSession.findOne({
    challengeId,
    status: 'active'
  });
  
  if (!challenge) {
    return interaction.reply({
      content: '❌ This duel is no longer active.',
      ephemeral: true
    });
  }
  
  const player = challenge.getPlayer(interaction.user.id);
  if (!player) {
    return interaction.reply({
      content: '❌ You are not in this duel!',
      ephemeral: true
    });
  }
  
  try {
    // Submit answer (atomic operation)
    const result = await challenge.submitAnswer(interaction.user.id, answerIndex);
    
    // Disable buttons for this player
    const disabledButtons = createAnswerButtons(challengeId, true);
    
    // Quick acknowledgment
    await interaction.update({
      components: [disabledButtons]
    });
    
    // Check if both players answered
    const allAnswered = challenge.allAnswered();
    
    if (allAnswered) {
      // Both answered - show results and move to next question
      await showRoundResults(interaction.client, challenge);
    }
    
  } catch (error) {
    if (error.message === 'Already answered this question') {
      return interaction.reply({
        content: '⏳ You already answered! Waiting for opponent...',
        ephemeral: true
      });
    }
    
    console.error('Error submitting answer:', error);
    return interaction.reply({
      content: '❌ Error submitting answer. Please try again.',
      ephemeral: true
    });
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// BATTLE FLOW FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

async function sendQuestion(client, challenge) {
  const question = challenge.questions[challenge.currentQuestion];
  const questionNumber = challenge.currentQuestion + 1;
  const totalQuestions = challenge.questions.length;
  
  const questionEmbed = createQuestionEmbed(question, questionNumber, totalQuestions);
  const answerButtons = createAnswerButtons(challenge.challengeId);
  
  // Send to both players
  for (const player of challenge.players) {
    try {
      const user = await client.users.fetch(player.discordId);
      await user.send({
        embeds: [questionEmbed],
        components: [answerButtons]
      });
    } catch (e) {
      console.error(`Failed to send question to ${player.username}:`, e.message);
    }
  }
  
  // Set timeout for question (15 seconds)
  setTimeout(async () => {
    // Reload challenge to check current state
    const currentChallenge = await ChallengeSession.findOne({
      challengeId: challenge.challengeId,
      status: 'active',
      currentQuestion: challenge.currentQuestion
    });
    
    if (currentChallenge && !currentChallenge.allAnswered()) {
      // Force timeout - mark unanswered players
      for (const player of currentChallenge.players) {
        const answered = player.answers.some(a => a.questionIndex === currentChallenge.currentQuestion);
        if (!answered) {
          player.answers.push({
            questionIndex: currentChallenge.currentQuestion,
            selectedIndex: -1,
            correct: false,
            timeTaken: 15000,
            points: 0,
            answeredAt: new Date()
          });
          player.streak = 0;
        }
      }
      await currentChallenge.save();
      
      await showRoundResults(client, currentChallenge);
    }
  }, 15000);
}

async function showRoundResults(client, challenge) {
  const currentQuestion = challenge.questions[challenge.currentQuestion];
  const leaderboard = challenge.getLeaderboard();
  const questionNum = challenge.currentQuestion + 1;
  const totalQuestions = challenge.questions.length;
  
  // Send results to each player
  for (const player of challenge.players) {
    try {
      const user = await client.users.fetch(player.discordId);
      const playerAnswer = player.answers.find(a => a.questionIndex === challenge.currentQuestion);
      
      const resultEmbed = createRoundResultEmbed(
        playerAnswer,
        currentQuestion,
        currentQuestion.explanation,
        leaderboard,
        questionNum,
        totalQuestions
      );
      
      await user.send({ embeds: [resultEmbed] });
    } catch (e) {
      console.error(`Failed to send results to ${player.username}:`, e.message);
    }
  }
  
  // Wait 3 seconds
  await sleep(3000);
  
  // Move to next question or complete
  const nextResult = await challenge.nextQuestion();
  
  if (nextResult.isComplete || challenge.status === 'completed') {
    await completeBattle(client, challenge);
  } else {
    await sendQuestion(client, challenge);
  }
}

async function completeBattle(client, challenge) {
  // Reload to get final state
  const finalChallenge = await ChallengeSession.findOne({ challengeId: challenge.challengeId });
  const results = finalChallenge.results;
  
  // Award XP to players
  for (const player of finalChallenge.players) {
    const isWinner = player.discordId === results.winner && !results.isDraw;
    const correctCount = player.answers.filter(a => a.correct).length;
    const totalCount = finalChallenge.questions.length;
    const accuracy = Math.round((correctCount / totalCount) * 100);
    
    // Calculate base XP
    let baseXp = XP_REWARDS.CHALLENGE_PARTICIPATE;
    if (isWinner) {
      baseXp += XP_REWARDS.CHALLENGE_WIN;
    } else if (results.isDraw) {
      baseXp += Math.floor(XP_REWARDS.CHALLENGE_WIN / 2);
    }
    
    // Perfect accuracy bonus
    if (accuracy === 100) {
      baseXp += XP_REWARDS.CHALLENGE_PERFECT;
    } else if (accuracy >= 80) {
      baseXp += 50;
    }
    
    // Award XP atomically with multipliers
    const xpResult = await addXpAtomic(player.discordId, baseXp, isWinner ? 'challenge_win' : 'challenge_participate');
    
    // Update multiplayer stats atomically
    await User.findOneAndUpdate(
      { discordId: player.discordId },
      {
        $inc: {
          'multiplayerStats.challenges.played': 1,
          'multiplayerStats.challenges.wins': isWinner ? 1 : 0,
          'multiplayerStats.challenges.losses': (!isWinner && !results.isDraw) ? 1 : 0
        }
      }
    );
    
    // Store XP award info
    finalChallenge.xpAwards.push({
      discordId: player.discordId,
      baseXp,
      multiplier: xpResult?.multiplier || 1,
      finalXp: xpResult?.xpAwarded || baseXp,
      reason: isWinner ? 'challenge_win' : 'challenge_participate'
    });
    
    // Send final result DM
    try {
      const user = await client.users.fetch(player.discordId);
      const opponent = finalChallenge.players.find(p => p.discordId !== player.discordId);
      
      const playerStats = {
        score: player.score,
        correct: correctCount,
        total: totalCount,
        accuracy
      };
      
      let finalEmbed;
      if (results.isDraw) {
        finalEmbed = createDrawEmbed(playerStats, opponent.username, {
          finalXp: xpResult?.xpAwarded || baseXp,
          multiplier: xpResult?.multiplier || 1,
          breakdown: xpResult?.breakdown || { baseXp }
        });
      } else if (isWinner) {
        finalEmbed = createVictoryEmbed(playerStats, results, opponent.username, {
          finalXp: xpResult?.xpAwarded || baseXp,
          multiplier: xpResult?.multiplier || 1,
          breakdown: xpResult?.breakdown || { baseXp }
        });
      } else {
        const winnerPlayer = finalChallenge.players.find(p => p.discordId === results.winner);
        finalEmbed = createDefeatEmbed(playerStats, results, winnerPlayer.username, {
          finalXp: xpResult?.xpAwarded || baseXp,
          multiplier: xpResult?.multiplier || 1,
          breakdown: xpResult?.breakdown || { baseXp }
        });
      }
      
      await user.send({ embeds: [finalEmbed] });
      
      // Check achievements
      const userDoc = await User.findOne({ discordId: player.discordId });
      if (userDoc) {
        await checkAchievements(userDoc);
      }
      
    } catch (e) {
      console.error(`Failed to send final results to ${player.username}:`, e.message);
    }
  }
  
  await finalChallenge.save();
  
  // ─── AI POST-MATCH ANALYSIS ───────────────────────────────────────────
  
  try {
    // Get the most missed question or a random one
    const missedQuestions = finalChallenge.questions.filter((q, i) => {
      const bothWrong = finalChallenge.players.every(p => {
        const answer = p.answers.find(a => a.questionIndex === i);
        return !answer?.correct;
      });
      return bothWrong;
    });
    
    const questionToExplain = missedQuestions[0] || finalChallenge.questions[0];
    
    const analysis = await getConceptExplanation(
      questionToExplain.conceptTested || questionToExplain.question,
      `This was from a quiz about ${finalChallenge.settings.topic}. Explain why "${questionToExplain.options[questionToExplain.correctIndex]}" is the correct answer in 2-3 sentences.`
    );
    
    if (analysis) {
      finalChallenge.postMatchAnalysis = analysis;
      await finalChallenge.save();
      
      // Send analysis to both players
      const analysisEmbed = createPostMatchAnalysisEmbed(analysis, finalChallenge.settings.topic);
      
      for (const player of finalChallenge.players) {
        try {
          const user = await client.users.fetch(player.discordId);
          await user.send({ embeds: [analysisEmbed] });
        } catch (e) {
          // Silently fail on analysis send
        }
      }
    }
  } catch (e) {
    console.error('Failed to generate post-match analysis:', e.message);
  }
  
  // Post summary in original channel
  try {
    if (finalChallenge.channelId) {
      const channel = await client.channels.fetch(finalChallenge.channelId);
      if (channel) {
        const summaryEmbed = createBattleSummaryEmbed(finalChallenge, results);
        await channel.send({ embeds: [summaryEmbed] });
      }
    }
  } catch (e) {
    console.error('Failed to post battle summary:', e.message);
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// QUESTION GENERATION
// ═══════════════════════════════════════════════════════════════════════════════

async function generateDuelQuestions(settings) {
  const { topic, difficulty, questionCount } = settings;
  
  try {
    const result = await aiOrchestrator.generateQuiz(topic, questionCount, difficulty);
    
    if (result.success && result.data && Array.isArray(result.data)) {
      return result.data.map(q => ({
        question: q.question,
        options: q.options?.map(opt => opt.replace(/^[A-D]\)\s*/, '')) || [],
        correctIndex: q.correct ?? q.correctIndex ?? 0,
        explanation: q.explanation || '',
        conceptTested: q.conceptTested || q.topic || topic,
        topic: topic,
        difficulty: difficulty
      }));
    }
  } catch (error) {
    console.error('AI question generation failed:', error);
  }
  
  // Fallback questions
  return getFallbackQuestions(topic, questionCount);
}

function getFallbackQuestions(topic, count) {
  const fallbackQuestions = [
    {
      question: 'What does the "def" keyword do in Python?',
      options: ['Defines a variable', 'Defines a function', 'Defines a class', 'Defines a module'],
      correctIndex: 1,
      explanation: 'The "def" keyword is used to define (create) a function in Python.',
      conceptTested: 'Python functions',
      topic: 'python'
    },
    {
      question: 'What is the time complexity of accessing an element in an array by index?',
      options: ['O(n)', 'O(log n)', 'O(1)', 'O(n²)'],
      correctIndex: 2,
      explanation: 'Array access by index is O(1) because arrays store elements in contiguous memory.',
      conceptTested: 'Time complexity',
      topic: 'algorithms'
    },
    {
      question: 'What does === mean in JavaScript?',
      options: ['Assignment', 'Loose equality', 'Strict equality', 'Not equal'],
      correctIndex: 2,
      explanation: 'Triple equals (===) checks both value and type equality in JavaScript.',
      conceptTested: 'JavaScript equality',
      topic: 'javascript'
    },
    {
      question: 'Which data structure uses LIFO (Last In First Out)?',
      options: ['Queue', 'Stack', 'Array', 'Linked List'],
      correctIndex: 1,
      explanation: 'A Stack follows LIFO - the last element added is the first to be removed.',
      conceptTested: 'Data structures',
      topic: 'data_structures'
    },
    {
      question: 'What is the purpose of the "this" keyword in JavaScript?',
      options: ['Creates a new variable', 'Refers to the current object', 'Imports a module', 'Declares a constant'],
      correctIndex: 1,
      explanation: 'The "this" keyword refers to the object that is executing the current function.',
      conceptTested: 'JavaScript this keyword',
      topic: 'javascript'
    },
    {
      question: 'What does CSS stand for?',
      options: ['Creative Style Sheets', 'Cascading Style Sheets', 'Computer Style Sheets', 'Colorful Style Sheets'],
      correctIndex: 1,
      explanation: 'CSS stands for Cascading Style Sheets, used for styling web pages.',
      conceptTested: 'CSS basics',
      topic: 'web'
    },
    {
      question: 'What is a closure in JavaScript?',
      options: ['A way to close the browser', 'A function with access to its outer scope', 'A method to end a loop', 'A type of error'],
      correctIndex: 1,
      explanation: 'A closure is a function that has access to variables from its outer (enclosing) scope.',
      conceptTested: 'JavaScript closures',
      topic: 'javascript'
    },
    {
      question: 'What is the main purpose of a constructor in OOP?',
      options: ['Destroy objects', 'Initialize objects', 'Copy objects', 'Compare objects'],
      correctIndex: 1,
      explanation: 'A constructor is a special method used to initialize new objects with default values.',
      conceptTested: 'OOP constructors',
      topic: 'oop'
    },
    {
      question: 'What is Big O notation used for?',
      options: ['Measuring file size', 'Describing algorithm efficiency', 'Counting lines of code', 'Checking syntax errors'],
      correctIndex: 1,
      explanation: 'Big O notation describes the worst-case time or space complexity of an algorithm.',
      conceptTested: 'Algorithm analysis',
      topic: 'algorithms'
    },
    {
      question: 'What is the difference between let and var in JavaScript?',
      options: ['No difference', 'let is block-scoped, var is function-scoped', 'var is newer', 'let cannot be reassigned'],
      correctIndex: 1,
      explanation: 'let is block-scoped (limited to the block) while var is function-scoped.',
      conceptTested: 'JavaScript scoping',
      topic: 'javascript'
    }
  ];
  
  // Filter by topic if not random
  let filtered = topic === 'random' 
    ? fallbackQuestions 
    : fallbackQuestions.filter(q => q.topic === topic || q.topic === 'javascript');
  
  if (filtered.length < count) {
    filtered = fallbackQuestions;
  }
  
  // Shuffle and select
  const shuffled = [...filtered].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

// ═══════════════════════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
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
      { name: '📊 Algorithms', value: 'algorithms' },
      { name: '🗃️ Data Structures', value: 'data_structures' },
      { name: '🌐 HTML/CSS', value: 'web' },
      { name: '☕ Java', value: 'java' },
      { name: '🔷 TypeScript', value: 'typescript' },
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

export { handleButtonInteraction };

export default { 
  data, 
  execute, 
  autocomplete,
  handleButtonInteraction
};
