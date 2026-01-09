// src/bot/commands/challenge.js
// ═══════════════════════════════════════════════════════════════════
// ULTRA QUIZ SYSTEM - 1v1 PVP CHALLENGE MODE
// ═══════════════════════════════════════════════════════════════════

import { 
  SlashCommandBuilder, 
  EmbedBuilder, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle 
} from 'discord.js';
import { createQuizSession, getCurrentQuestion, submitAnswer } from '../../services/quizService.js';
import { getOrCreateUser } from '../../services/gamificationService.js';
import {
  QUIZ_COLORS,
  QUIZ_EMOJIS,
  DIFFICULTY,
  QUIZ_TOPICS,
  ASCII_ART
} from '../../config/quizConfig.js';
import {
  createHealthBar,
  formatNumber,
  getRankFromXP,
  getGrade
} from '../../utils/quizUtils.js';

// Active challenges stored in memory (should be Redis in production)
const activeChallenges = new Map();
const activeBattles = new Map();

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
      .setDescription('Quiz battle topic')
      .setRequired(true)
      .setAutocomplete(true))
  .addStringOption(option =>
    option.setName('difficulty')
      .setDescription('Battle difficulty')
      .addChoices(
        { name: '🟢 Easy - Casual battle', value: 'easy' },
        { name: '🟡 Medium - Standard fight', value: 'medium' },
        { name: '🔴 Hard - Intense duel', value: 'hard' },
        { name: '🟣 Expert - Ultimate showdown', value: 'expert' }
      ))
  .addIntegerOption(option =>
    option.setName('rounds')
      .setDescription('Number of rounds (3-10)')
      .setMinValue(3)
      .setMaxValue(10));

// ═══════════════════════════════════════════════════════════════════
// MAIN EXECUTE FUNCTION
// ═══════════════════════════════════════════════════════════════════

export async function execute(interaction) {
  const opponent = interaction.options.getUser('opponent');
  const topic = interaction.options.getString('topic');
  const difficulty = interaction.options.getString('difficulty') || 'medium';
  const rounds = interaction.options.getInteger('rounds') || 5;

  // Validation
  if (opponent.id === interaction.user.id) {
    return interaction.reply({ 
      content: `${QUIZ_EMOJIS.INCORRECT} You cannot challenge yourself!`, 
      ephemeral: true 
    });
  }

  if (opponent.bot) {
    return interaction.reply({ 
      content: `${QUIZ_EMOJIS.INCORRECT} You cannot challenge a bot!`, 
      ephemeral: true 
    });
  }

  // Check if either user is already in a battle
  if (activeBattles.has(interaction.user.id) || activeBattles.has(opponent.id)) {
    return interaction.reply({ 
      content: `${QUIZ_EMOJIS.INCORRECT} One of the players is already in a battle!`, 
      ephemeral: true 
    });
  }

  // Get both users' stats
  const challenger = await getOrCreateUser(interaction.user.id, interaction.user.username);
  const opponentData = await getOrCreateUser(opponent.id, opponent.username);
  
  const challengerRank = getRankFromXP(challenger.xp || 0);
  const opponentRank = getRankFromXP(opponentData.xp || 0);
  const topicData = QUIZ_TOPICS[topic.toLowerCase()] || { emoji: '📚', name: topic };
  const diffData = DIFFICULTY[difficulty] || DIFFICULTY.medium;

  // Calculate XP stakes
  const xpStake = Math.round(50 * diffData.xpMultiplier * (rounds / 5));

  // Create challenge ID
  const challengeId = `${interaction.user.id}_${opponent.id}_${Date.now()}`;

  // Store challenge data
  activeChallenges.set(challengeId, {
    challengerId: interaction.user.id,
    challengerName: interaction.user.username,
    opponentId: opponent.id,
    opponentName: opponent.username,
    topic,
    difficulty,
    rounds,
    xpStake,
    createdAt: Date.now()
  });

  // Create challenge embed
  const challengeEmbed = new EmbedBuilder()
    .setColor(QUIZ_COLORS.STREAK_FIRE)
    .setTitle(`${QUIZ_EMOJIS.SWORD} CHALLENGE ISSUED!`)
    .setDescription(`
${ASCII_ART.header.challenge}

${challengerRank.emoji} **${interaction.user.username}** challenges ${opponentRank.emoji} **${opponent.username}**!

${ASCII_ART.dividerThin}

⚔️ **BATTLE DETAILS**

\`\`\`
┌─────────────────────────────────────┐
│  CHALLENGER      VS      OPPONENT   │
├─────────────────────────────────────┤
│  ${interaction.user.username.slice(0, 12).padEnd(12)}      ⚔️      ${opponent.username.slice(0, 12).padEnd(12)} │
│  Lv.${String(challenger.level || 1).padEnd(4)}              Lv.${String(opponentData.level || 1).padEnd(4)}  │
│  ${formatNumber(challenger.xp || 0).padStart(8)} XP      ${formatNumber(opponentData.xp || 0).padStart(8)} XP │
└─────────────────────────────────────┘
\`\`\`

${ASCII_ART.dividerThin}

${topicData.emoji} **Topic:** ${topicData.name || topic}
${diffData.emoji} **Difficulty:** ${diffData.name}
❓ **Rounds:** ${rounds}
${QUIZ_EMOJIS.XP} **Stakes:** ${xpStake} XP

${ASCII_ART.dividerThin}

⏰ *Challenge expires in 60 seconds*
    `)
    .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
    .setFooter({ text: `${QUIZ_EMOJIS.LIGHTNING} MentorAI Battle System` })
    .setTimestamp();

  // Challenge buttons
  const buttons = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`challenge_accept_${challengeId}`)
      .setLabel('Accept Challenge')
      .setEmoji('⚔️')
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId(`challenge_decline_${challengeId}`)
      .setLabel('Decline')
      .setEmoji('🛡️')
      .setStyle(ButtonStyle.Danger),
    new ButtonBuilder()
      .setCustomId('help_main')
      .setLabel('Menu')
      .setEmoji('🏠')
      .setStyle(ButtonStyle.Secondary)
  );

  await interaction.reply({ 
    content: `${opponent} **You have been challenged to a battle!**`, 
    embeds: [challengeEmbed], 
    components: [buttons] 
  });

  // Auto-expire after 60 seconds
  setTimeout(async () => {
    if (activeChallenges.has(challengeId)) {
      activeChallenges.delete(challengeId);
      try {
        const message = await interaction.fetchReply();
        if (message.components.length > 0) {
          const expiredEmbed = EmbedBuilder.from(challengeEmbed)
            .setColor(QUIZ_COLORS.SECONDARY)
            .setTitle(`${QUIZ_EMOJIS.TIMEOUT} Challenge Expired`)
            .setFooter({ text: '⏰ Challenge was not accepted in time' });

          await interaction.editReply({ embeds: [expiredEmbed], components: [] });
        }
      } catch (e) {
        // Message might be deleted
      }
    }
  }, 60000);
}

// ═══════════════════════════════════════════════════════════════════
// BUTTON HANDLER
// ═══════════════════════════════════════════════════════════════════

export async function handleButton(interaction, action, params) {
  try {
    if (action === 'accept') {
      await handleAcceptChallenge(interaction, params.join('_'));
    } else if (action === 'decline') {
      await handleDeclineChallenge(interaction, params.join('_'));
    } else if (action === 'answer') {
      await handleBattleAnswer(interaction, parseInt(params[0], 10), params[1]);
    } else if (action === 'forfeit') {
      await handleForfeit(interaction, params[0]);
    }
  } catch (error) {
    console.error('Challenge button handler error:', error);
    await interaction.reply({
      content: `${QUIZ_EMOJIS.INCORRECT} Something went wrong!`,
      ephemeral: true
    }).catch(() => {});
  }
}

// ═══════════════════════════════════════════════════════════════════
// ACCEPT CHALLENGE
// ═══════════════════════════════════════════════════════════════════

async function handleAcceptChallenge(interaction, challengeId) {
  const challenge = activeChallenges.get(challengeId);
  
  if (!challenge) {
    return interaction.reply({
      content: `${QUIZ_EMOJIS.INCORRECT} This challenge has expired!`,
      ephemeral: true
    });
  }

  // Only the opponent can accept
  if (interaction.user.id !== challenge.opponentId) {
    return interaction.reply({
      content: `${QUIZ_EMOJIS.INCORRECT} Only ${challenge.opponentName} can accept this challenge!`,
      ephemeral: true
    });
  }

  await interaction.deferUpdate();

  // Remove from challenges, add to active battles
  activeChallenges.delete(challengeId);

  // Create battle state
  const battleId = `battle_${Date.now()}`;
  const battle = {
    id: battleId,
    player1: {
      id: challenge.challengerId,
      username: challenge.challengerName,
      hp: 100,
      maxHp: 100,
      score: 0,
      correct: 0,
      answered: false
    },
    player2: {
      id: challenge.opponentId,
      username: challenge.opponentName,
      hp: 100,
      maxHp: 100,
      score: 0,
      correct: 0,
      answered: false
    },
    topic: challenge.topic,
    difficulty: challenge.difficulty,
    rounds: challenge.rounds,
    currentRound: 1,
    xpStake: challenge.xpStake,
    questions: [],
    currentQuestion: null,
    status: 'active'
  };

  // Generate questions for the battle
  try {
    const session = await createQuizSession(battleId, challenge.topic, challenge.rounds, challenge.difficulty);
    if (!session || !session.questions?.length) {
      throw new Error('Failed to generate battle questions');
    }
    battle.questions = session.questions;
    battle.currentQuestion = session.questions[0];
  } catch (error) {
    console.error('Battle question generation error:', error);
    await interaction.editReply({
      content: `${QUIZ_EMOJIS.INCORRECT} Failed to start battle. Please try again!`,
      embeds: [],
      components: []
    });
    return;
  }

  // Store battle
  activeBattles.set(challenge.challengerId, battle);
  activeBattles.set(challenge.opponentId, battle);

  // Show countdown
  await showBattleCountdown(interaction);

  // Show first question
  await showBattleQuestion(interaction, battle);
}

// ═══════════════════════════════════════════════════════════════════
// DECLINE CHALLENGE
// ═══════════════════════════════════════════════════════════════════

async function handleDeclineChallenge(interaction, challengeId) {
  const challenge = activeChallenges.get(challengeId);
  
  if (!challenge) {
    return interaction.reply({
      content: `${QUIZ_EMOJIS.INCORRECT} This challenge has already expired!`,
      ephemeral: true
    });
  }

  // Only the opponent can decline
  if (interaction.user.id !== challenge.opponentId) {
    return interaction.reply({
      content: `${QUIZ_EMOJIS.INCORRECT} Only ${challenge.opponentName} can decline this challenge!`,
      ephemeral: true
    });
  }

  activeChallenges.delete(challengeId);

  const declinedEmbed = new EmbedBuilder()
    .setColor(QUIZ_COLORS.DANGER)
    .setTitle(`${QUIZ_EMOJIS.SHIELD} Challenge Declined`)
    .setDescription(`
**${challenge.opponentName}** has declined the challenge from **${challenge.challengerName}**.

*Maybe next time!* 🤝
    `)
    .setFooter({ text: 'Challenge another player with /challenge' });

  await interaction.update({ embeds: [declinedEmbed], components: [] });
}

// ═══════════════════════════════════════════════════════════════════
// BATTLE COUNTDOWN
// ═══════════════════════════════════════════════════════════════════

async function showBattleCountdown(interaction) {
  const frames = ['3️⃣', '2️⃣', '1️⃣', '⚔️'];
  
  for (let i = 0; i < frames.length; i++) {
    const isLast = i === frames.length - 1;
    
    const countEmbed = new EmbedBuilder()
      .setColor(isLast ? QUIZ_COLORS.STREAK_FIRE : QUIZ_COLORS.WARNING)
      .setTitle(isLast ? `${QUIZ_EMOJIS.SWORD} BATTLE START!` : `${frames[i]} Get Ready...`)
      .setDescription(`
\`\`\`
╔══════════════════════════════════════╗
║          ${isLast ? '⚔️ FIGHT! ⚔️' : `  ${frames[i]} PREPARING...`}          ║
╚══════════════════════════════════════╝
\`\`\`

${isLast ? '**Answer quickly to deal damage!**' : '*Both players get ready...*'}
      `);

    await interaction.editReply({ embeds: [countEmbed], components: [] });
    
    if (!isLast) {
      await new Promise(r => setTimeout(r, 1000));
    }
  }
  
  await new Promise(r => setTimeout(r, 500));
}

// ═══════════════════════════════════════════════════════════════════
// BATTLE QUESTION DISPLAY
// ═══════════════════════════════════════════════════════════════════

async function showBattleQuestion(interaction, battle) {
  const question = battle.currentQuestion;
  const diffData = DIFFICULTY[battle.difficulty] || DIFFICULTY.medium;
  const topicData = QUIZ_TOPICS[battle.topic?.toLowerCase()] || { emoji: '📚', name: battle.topic };

  // Reset answered status
  battle.player1.answered = false;
  battle.player2.answered = false;

  const battleEmbed = new EmbedBuilder()
    .setColor(QUIZ_COLORS.STREAK_FIRE)
    .setTitle(`${QUIZ_EMOJIS.SWORD} Round ${battle.currentRound}/${battle.rounds}`)
    .setDescription(`
${ASCII_ART.dividerThin}

**${battle.player1.username}** ${getRankFromXP(0).emoji}
${createHealthBar(battle.player1.hp, battle.player1.maxHp)}
⭐ Score: **${battle.player1.score}** | ✅ ${battle.player1.correct}

${QUIZ_EMOJIS.VS} **VS** ${QUIZ_EMOJIS.VS}

**${battle.player2.username}** ${getRankFromXP(0).emoji}
${createHealthBar(battle.player2.hp, battle.player2.maxHp)}
⭐ Score: **${battle.player2.score}** | ✅ ${battle.player2.correct}

${ASCII_ART.dividerThin}

${QUIZ_EMOJIS.BRAIN} **${question.question}**

${ASCII_ART.dividerThin}

${QUIZ_EMOJIS.OPTION_A} ${question.options[0]}
${QUIZ_EMOJIS.OPTION_B} ${question.options[1]}
${QUIZ_EMOJIS.OPTION_C} ${question.options[2]}
${QUIZ_EMOJIS.OPTION_D} ${question.options[3]}

${ASCII_ART.dividerThin}

${topicData.emoji} ${topicData.name} • ${diffData.emoji} ${diffData.name} • ⏱️ ${diffData.timeLimit}s
    `)
    .setFooter({ text: `${QUIZ_EMOJIS.LIGHTNING} Answer fast! Speed = Bonus Damage` })
    .setTimestamp();

  // Answer buttons (both players use same buttons)
  const answerRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`challenge_answer_0_${battle.id}`)
      .setLabel('A')
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId(`challenge_answer_1_${battle.id}`)
      .setLabel('B')
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId(`challenge_answer_2_${battle.id}`)
      .setLabel('C')
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId(`challenge_answer_3_${battle.id}`)
      .setLabel('D')
      .setStyle(ButtonStyle.Primary)
  );

  const controlRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`challenge_forfeit_${battle.id}`)
      .setLabel('Forfeit')
      .setEmoji('🏳️')
      .setStyle(ButtonStyle.Danger)
  );

  await interaction.editReply({
    embeds: [battleEmbed],
    components: [answerRow, controlRow]
  });

  // Auto-advance after time limit
  const timeLimit = (diffData.timeLimit || 20) * 1000;
  setTimeout(async () => {
    if (battle.status === 'active' && (!battle.player1.answered || !battle.player2.answered)) {
      await advanceRound(interaction, battle, true);
    }
  }, timeLimit);
}

// ═══════════════════════════════════════════════════════════════════
// HANDLE BATTLE ANSWER
// ═══════════════════════════════════════════════════════════════════

async function handleBattleAnswer(interaction, answerIndex, battleId) {
  // Find the battle
  let battle = activeBattles.get(interaction.user.id);
  
  if (!battle || battle.id !== battleId) {
    return interaction.reply({
      content: `${QUIZ_EMOJIS.INCORRECT} No active battle found!`,
      ephemeral: true
    });
  }

  // Determine which player
  const isPlayer1 = interaction.user.id === battle.player1.id;
  const player = isPlayer1 ? battle.player1 : battle.player2;
  const opponent = isPlayer1 ? battle.player2 : battle.player1;

  // Check if already answered
  if (player.answered) {
    return interaction.reply({
      content: `${QUIZ_EMOJIS.TIMEOUT} You already answered this round!`,
      ephemeral: true
    });
  }

  await interaction.deferUpdate().catch(() => {});

  // Mark as answered
  player.answered = true;
  const question = battle.currentQuestion;
  const isCorrect = answerIndex === question.correctIndex;
  const diffData = DIFFICULTY[battle.difficulty] || DIFFICULTY.medium;

  if (isCorrect) {
    player.correct++;
    player.score += diffData.pointsPerCorrect;
    
    // Damage opponent
    const damage = Math.round(20 * diffData.xpMultiplier);
    opponent.hp = Math.max(0, opponent.hp - damage);
  } else {
    // Wrong answer = take damage
    const selfDamage = 10;
    player.hp = Math.max(0, player.hp - selfDamage);
  }

  // Show feedback
  await interaction.followUp({
    content: isCorrect 
      ? `${QUIZ_EMOJIS.CORRECT} **Correct!** You dealt damage to ${opponent.username}!`
      : `${QUIZ_EMOJIS.INCORRECT} **Wrong!** The correct answer was: ${question.options[question.correctIndex]}`,
    ephemeral: true
  }).catch(() => {});

  // Check if both answered or someone's HP is 0
  if ((battle.player1.answered && battle.player2.answered) || battle.player1.hp <= 0 || battle.player2.hp <= 0) {
    await advanceRound(interaction, battle, false);
  }
}

// ═══════════════════════════════════════════════════════════════════
// ADVANCE ROUND / END BATTLE
// ═══════════════════════════════════════════════════════════════════

async function advanceRound(interaction, battle, timeout) {
  // Check for knockout
  if (battle.player1.hp <= 0 || battle.player2.hp <= 0) {
    await endBattle(interaction, battle, 'knockout');
    return;
  }

  // Check if all rounds complete
  if (battle.currentRound >= battle.rounds) {
    await endBattle(interaction, battle, 'complete');
    return;
  }

  // Advance to next round
  battle.currentRound++;
  battle.currentQuestion = battle.questions[battle.currentRound - 1];

  // Brief pause then show next question
  await new Promise(r => setTimeout(r, 1500));
  await showBattleQuestion(interaction, battle);
}

// ═══════════════════════════════════════════════════════════════════
// END BATTLE
// ═══════════════════════════════════════════════════════════════════

async function endBattle(interaction, battle, reason) {
  battle.status = 'ended';

  // Determine winner
  let winner, loser;
  if (battle.player1.hp <= 0) {
    winner = battle.player2;
    loser = battle.player1;
  } else if (battle.player2.hp <= 0) {
    winner = battle.player1;
    loser = battle.player2;
  } else {
    // Compare scores
    if (battle.player1.score > battle.player2.score) {
      winner = battle.player1;
      loser = battle.player2;
    } else if (battle.player2.score > battle.player1.score) {
      winner = battle.player2;
      loser = battle.player1;
    } else {
      // Tie - compare HP
      if (battle.player1.hp > battle.player2.hp) {
        winner = battle.player1;
        loser = battle.player2;
      } else if (battle.player2.hp > battle.player1.hp) {
        winner = battle.player2;
        loser = battle.player1;
      }
    }
  }

  const isTie = !winner;
  const xpWin = battle.xpStake;
  const xpLose = Math.round(battle.xpStake * 0.25);

  // Update user XP
  if (!isTie) {
    try {
      const winnerUser = await getOrCreateUser(winner.id, winner.username);
      const loserUser = await getOrCreateUser(loser.id, loser.username);
      
      if (winnerUser.addXp) await winnerUser.addXp(xpWin);
      if (loserUser.addXp) await loserUser.addXp(xpLose);
    } catch (e) {
      console.error('XP update error:', e);
    }
  }

  const resultEmbed = new EmbedBuilder()
    .setColor(isTie ? QUIZ_COLORS.WARNING : QUIZ_COLORS.SUCCESS)
    .setTitle(
      reason === 'knockout' ? `${QUIZ_EMOJIS.TROPHY} KNOCKOUT!` :
      reason === 'forfeit' ? `🏳️ FORFEIT!` :
      isTie ? `🤝 IT'S A TIE!` :
      `${QUIZ_EMOJIS.TROPHY} VICTORY!`
    )
    .setDescription(`
${ASCII_ART.header.challenge}

${isTie 
  ? `The battle ends in a draw!`
  : `**${winner.username}** wins the battle!`
}

${ASCII_ART.dividerThin}

**FINAL STATS**

\`\`\`
┌───────────────────────────────────────┐
│           BATTLE RESULTS              │
├───────────────────────────────────────┤
│  ${battle.player1.username.slice(0, 12).padEnd(12)}  │  ${battle.player2.username.slice(0, 12).padEnd(12)}  │
│  HP: ${String(battle.player1.hp).padStart(3)}/${battle.player1.maxHp}     │  HP: ${String(battle.player2.hp).padStart(3)}/${battle.player2.maxHp}     │
│  Score: ${String(battle.player1.score).padStart(4)}    │  Score: ${String(battle.player2.score).padStart(4)}    │
│  Correct: ${String(battle.player1.correct).padStart(2)}    │  Correct: ${String(battle.player2.correct).padStart(2)}    │
└───────────────────────────────────────┘
\`\`\`

${ASCII_ART.dividerThin}

${QUIZ_EMOJIS.XP} **REWARDS**

${isTie 
  ? `Both players earn **+${Math.round(xpWin * 0.5)} XP**`
  : `${QUIZ_EMOJIS.TROPHY} **${winner.username}**: +${xpWin} XP\n${QUIZ_EMOJIS.MEDAL} **${loser.username}**: +${xpLose} XP (participation)`
}

${ASCII_ART.dividerThin}

*Good fight!* ⚔️
    `)
    .setFooter({ text: 'Challenge again with /challenge!' })
    .setTimestamp();

  // Clean up
  activeBattles.delete(battle.player1.id);
  activeBattles.delete(battle.player2.id);

  const actionRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('exec_challenge')
      .setLabel('Rematch')
      .setEmoji('🔄')
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId('exec_leaderboard')
      .setLabel('Leaderboard')
      .setEmoji('🏆')
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId('help_main')
      .setLabel('Menu')
      .setEmoji('🏠')
      .setStyle(ButtonStyle.Secondary)
  );

  await interaction.editReply({
    embeds: [resultEmbed],
    components: [actionRow]
  });
}

// ═══════════════════════════════════════════════════════════════════
// FORFEIT
// ═══════════════════════════════════════════════════════════════════

async function handleForfeit(interaction, battleId) {
  const battle = activeBattles.get(interaction.user.id);
  
  if (!battle || battle.id !== battleId) {
    return interaction.reply({
      content: `${QUIZ_EMOJIS.INCORRECT} No active battle to forfeit!`,
      ephemeral: true
    });
  }

  await interaction.deferUpdate();

  // Determine who forfeited
  const isPlayer1 = interaction.user.id === battle.player1.id;
  if (isPlayer1) {
    battle.player1.hp = 0;
  } else {
    battle.player2.hp = 0;
  }

  await endBattle(interaction, battle, 'forfeit');
}

export default { data, execute, handleButton };
