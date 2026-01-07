import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { Arena } from '../../database/models/Arena.js';
import { getOrCreateUser, addXpToUser } from '../../services/gamificationService.js';
import { generateQuiz } from '../../ai/index.js';
import { COLORS, EMOJIS, createProgressBar } from '../../config/designSystem.js';

// Active arenas cache (for quick lookups)
const activeArenas = new Map();

export const data = new SlashCommandBuilder()
  .setName('arena')
  .setDescription('🏟️ Multiplayer quiz battle arena')
  .addSubcommand(sub =>
    sub.setName('create')
      .setDescription('Create a new arena battle')
      .addStringOption(opt =>
        opt.setName('topic')
          .setDescription('Quiz topic for the battle')
          .setRequired(true)
          .setAutocomplete(true))
      .addStringOption(opt =>
        opt.setName('difficulty')
          .setDescription('Quiz difficulty')
          .addChoices(
            { name: '🟢 Easy', value: 'easy' },
            { name: '🟡 Medium', value: 'medium' },
            { name: '🔴 Hard', value: 'hard' }
          ))
      .addIntegerOption(opt =>
        opt.setName('questions')
          .setDescription('Number of questions (5-15)')
          .setMinValue(5)
          .setMaxValue(15)))
  .addSubcommand(sub =>
    sub.setName('join')
      .setDescription('Join an existing arena')
      .addStringOption(opt =>
        opt.setName('code')
          .setDescription('6-character arena join code')
          .setRequired(true)
          .setMaxLength(6)
          .setMinLength(6)))
  .addSubcommand(sub =>
    sub.setName('leave')
      .setDescription('Leave current arena'))
  .addSubcommand(sub =>
    sub.setName('status')
      .setDescription('Check your current arena status'));

export async function autocomplete(interaction) {
  const focused = interaction.options.getFocused().toLowerCase();
  const topics = [
    'JavaScript', 'Python', 'Java', 'C++', 'TypeScript',
    'React', 'Node.js', 'HTML', 'CSS', 'SQL',
    'Data Structures', 'Algorithms', 'Git', 'Linux', 'Web Development'
  ];
  
  const filtered = topics.filter(t => t.toLowerCase().includes(focused));
  await interaction.respond(filtered.slice(0, 25).map(t => ({ name: t, value: t })));
}

export async function execute(interaction) {
  const subcommand = interaction.options.getSubcommand();

  switch (subcommand) {
    case 'create':
      await createArena(interaction);
      break;
    case 'join':
      await joinArena(interaction);
      break;
    case 'leave':
      await leaveArena(interaction);
      break;
    case 'status':
      await arenaStatus(interaction);
      break;
  }
}

/**
 * Create a new arena
 */
async function createArena(interaction) {
  await interaction.deferReply();

  const topic = interaction.options.getString('topic');
  const difficulty = interaction.options.getString('difficulty') || 'medium';
  const questionCount = interaction.options.getInteger('questions') || 10;

  try {
    const user = await getOrCreateUser(interaction.user.id, interaction.user.username);

    // Check if user is already in an arena
    const existingArena = await Arena.findOne({
      'players.odiscordId': interaction.user.id,
      status: { $in: ['waiting', 'countdown', 'question'] }
    });

    if (existingArena) {
      const errorEmbed = new EmbedBuilder()
        .setTitle('❌ Already in Arena')
        .setColor(COLORS.ERROR)
        .setDescription(`You're already in an arena!\nCode: \`${existingArena.joinCode}\`\n\nUse \`/arena leave\` to exit first.`);
      return interaction.editReply({ embeds: [errorEmbed] });
    }

    // Generate unique join code
    let joinCode;
    let attempts = 0;
    do {
      joinCode = Arena.generateJoinCode();
      attempts++;
    } while (await Arena.findOne({ joinCode }) && attempts < 10);

    // Generate arena ID
    const arenaId = `arena_${Date.now()}_${interaction.user.id}`;

    // Create arena in database
    const arena = new Arena({
      arenaId,
      hostId: interaction.user.id,
      hostUsername: interaction.user.username,
      topic,
      difficulty,
      questionCount,
      joinCode,
      status: 'waiting',
      channelId: interaction.channelId,
      players: [{
        odiscordId: interaction.user.id,
        username: interaction.user.username,
        score: 0,
        answers: [],
        responseTimes: [],
        correctCount: 0,
        joinedAt: new Date()
      }]
    });

    await arena.save();

    // Cache arena
    activeArenas.set(joinCode, arenaId);

    // Create waiting room embed
    const embed = new EmbedBuilder()
      .setTitle('🏟️ Arena Created!')
      .setColor(COLORS.ACHIEVEMENT_PURPLE)
      .setDescription([
        '```',
        '╔══════════════════════════════════════╗',
        '║        QUIZ BATTLE ARENA             ║',
        '╠══════════════════════════════════════╣',
        `║  📋 Topic: ${topic.padEnd(26)}║`,
        `║  📊 Difficulty: ${difficulty.padEnd(21)}║`,
        `║  ❓ Questions: ${String(questionCount).padEnd(22)}║`,
        '╚══════════════════════════════════════╝',
        '```'
      ].join('\n'))
      .addFields(
        { 
          name: '🔑 Join Code', 
          value: `\`\`\`\n${joinCode}\n\`\`\``, 
          inline: true 
        },
        { 
          name: '👥 Players (1/10)', 
          value: `${EMOJIS.CROWN} ${interaction.user.username} (Host)`, 
          inline: true 
        }
      )
      .addFields({
        name: '📢 How to Join',
        value: `Other players can join with:\n\`/arena join code:${joinCode}\``,
        inline: false
      })
      .setFooter({ text: 'Host can start when ready • Arena expires in 10 minutes' })
      .setTimestamp();

    // Create action buttons
    const buttons = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`arena_start_${joinCode}`)
        .setLabel('Start Battle!')
        .setEmoji('🚀')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId(`arena_refresh_${joinCode}`)
        .setLabel('Refresh')
        .setEmoji('🔄')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId(`arena_cancel_${joinCode}`)
        .setLabel('Cancel')
        .setEmoji('❌')
        .setStyle(ButtonStyle.Danger)
    );

    const message = await interaction.editReply({ embeds: [embed], components: [buttons] });
    
    // Update arena with message ID
    arena.messageId = message.id;
    await arena.save();

    // Set auto-expire timeout (10 minutes)
    setTimeout(async () => {
      const arenaCheck = await Arena.findOne({ joinCode, status: 'waiting' });
      if (arenaCheck) {
        arenaCheck.status = 'cancelled';
        await arenaCheck.save();
        activeArenas.delete(joinCode);
      }
    }, 600000);

  } catch (error) {
    console.error('Create arena error:', error);
    const errorEmbed = new EmbedBuilder()
      .setTitle('❌ Arena Creation Failed')
      .setColor(COLORS.ERROR)
      .setDescription('Could not create the arena. Please try again!');
    await interaction.editReply({ embeds: [errorEmbed] });
  }
}

/**
 * Join an existing arena
 */
async function joinArena(interaction) {
  await interaction.deferReply({ ephemeral: true });

  const code = interaction.options.getString('code').toUpperCase();

  try {
    const arena = await Arena.findOne({ joinCode: code });

    if (!arena) {
      return interaction.editReply({ 
        content: '❌ Arena not found! Check the code and try again.',
        ephemeral: true 
      });
    }

    if (arena.status !== 'waiting') {
      return interaction.editReply({ 
        content: '❌ This arena has already started or ended!',
        ephemeral: true 
      });
    }

    // Check if already in this arena
    const alreadyJoined = arena.players.some(p => p.odiscordId === interaction.user.id);
    if (alreadyJoined) {
      return interaction.editReply({ 
        content: '✅ You\'re already in this arena!',
        ephemeral: true 
      });
    }

    // Check if arena is full
    if (arena.players.length >= arena.maxPlayers) {
      return interaction.editReply({ 
        content: '❌ This arena is full!',
        ephemeral: true 
      });
    }

    // Add player to arena
    arena.players.push({
      odiscordId: interaction.user.id,
      username: interaction.user.username,
      score: 0,
      answers: [],
      responseTimes: [],
      correctCount: 0,
      joinedAt: new Date()
    });

    await arena.save();

    // Send confirmation
    await interaction.editReply({ 
      content: `✅ Joined arena **${code}**!\n\nTopic: ${arena.topic}\nPlayers: ${arena.players.length}/${arena.maxPlayers}\n\nWaiting for host to start...`,
      ephemeral: true 
    });

    // Try to update the original arena message
    try {
      const channel = await interaction.client.channels.fetch(arena.channelId);
      const message = await channel.messages.fetch(arena.messageId);
      
      const playerList = arena.players.map((p, i) => {
        const prefix = p.odiscordId === arena.hostId ? `${EMOJIS.CROWN} ` : `${i + 1}. `;
        return `${prefix}${p.username}`;
      }).join('\n');

      const embed = EmbedBuilder.from(message.embeds[0])
        .spliceFields(1, 1, { 
          name: `👥 Players (${arena.players.length}/${arena.maxPlayers})`, 
          value: playerList, 
          inline: true 
        });

      await message.edit({ embeds: [embed] });
    } catch (err) {
      console.error('Could not update arena message:', err);
    }

  } catch (error) {
    console.error('Join arena error:', error);
    await interaction.editReply({ 
      content: '❌ Failed to join arena. Please try again!',
      ephemeral: true 
    });
  }
}

/**
 * Leave current arena
 */
async function leaveArena(interaction) {
  await interaction.deferReply({ ephemeral: true });

  try {
    const arena = await Arena.findOne({
      'players.odiscordId': interaction.user.id,
      status: { $in: ['waiting', 'countdown'] }
    });

    if (!arena) {
      return interaction.editReply({ 
        content: '❌ You\'re not in any arena!',
        ephemeral: true 
      });
    }

    // If user is host, cancel the arena
    if (arena.hostId === interaction.user.id) {
      arena.status = 'cancelled';
      await arena.save();
      activeArenas.delete(arena.joinCode);
      return interaction.editReply({ 
        content: '✅ Arena cancelled (you were the host)',
        ephemeral: true 
      });
    }

    // Remove player from arena
    arena.players = arena.players.filter(p => p.odiscordId !== interaction.user.id);
    await arena.save();

    await interaction.editReply({ 
      content: '✅ You left the arena!',
      ephemeral: true 
    });

  } catch (error) {
    console.error('Leave arena error:', error);
    await interaction.editReply({ 
      content: '❌ Failed to leave arena.',
      ephemeral: true 
    });
  }
}

/**
 * Check arena status
 */
async function arenaStatus(interaction) {
  await interaction.deferReply({ ephemeral: true });

  try {
    const arena = await Arena.findOne({
      'players.odiscordId': interaction.user.id,
      status: { $nin: ['finished', 'cancelled'] }
    });

    if (!arena) {
      return interaction.editReply({ 
        content: '📭 You\'re not in any active arena.\n\nCreate one with `/arena create` or join with `/arena join`!',
        ephemeral: true 
      });
    }

    const player = arena.players.find(p => p.odiscordId === interaction.user.id);
    const statusEmojis = {
      waiting: '⏳',
      countdown: '🔥',
      question: '❓',
      results: '📊',
      finished: '🏆'
    };

    const embed = new EmbedBuilder()
      .setTitle('🏟️ Your Arena Status')
      .setColor(COLORS.INFO)
      .addFields(
        { name: 'Code', value: `\`${arena.joinCode}\``, inline: true },
        { name: 'Status', value: `${statusEmojis[arena.status]} ${arena.status}`, inline: true },
        { name: 'Players', value: `${arena.players.length}/${arena.maxPlayers}`, inline: true },
        { name: 'Topic', value: arena.topic, inline: true },
        { name: 'Your Score', value: `${player.score} pts`, inline: true },
        { name: 'Correct', value: `${player.correctCount}/${arena.currentQuestion}`, inline: true }
      );

    await interaction.editReply({ embeds: [embed], ephemeral: true });

  } catch (error) {
    console.error('Arena status error:', error);
    await interaction.editReply({ 
      content: '❌ Failed to get arena status.',
      ephemeral: true 
    });
  }
}

/**
 * Handle arena button interactions
 */
export async function handleArenaButton(interaction, action, params) {
  const joinCode = params[0];

  if (action === 'start') {
    await startArena(interaction, joinCode);
  } else if (action === 'refresh') {
    await refreshArena(interaction, joinCode);
  } else if (action === 'cancel') {
    await cancelArena(interaction, joinCode);
  } else if (action === 'answer') {
    const answerIndex = parseInt(params[1]);
    await submitAnswer(interaction, joinCode, answerIndex);
  }
}

/**
 * Start the arena battle
 */
async function startArena(interaction, joinCode) {
  try {
    const arena = await Arena.findOne({ joinCode });

    if (!arena) {
      return interaction.reply({ content: '❌ Arena not found!', ephemeral: true });
    }

    if (arena.hostId !== interaction.user.id) {
      return interaction.reply({ content: '❌ Only the host can start the arena!', ephemeral: true });
    }

    if (arena.status !== 'waiting') {
      return interaction.reply({ content: '❌ Arena has already started!', ephemeral: true });
    }

    if (arena.players.length < 2) {
      return interaction.reply({ content: '❌ Need at least 2 players to start!', ephemeral: true });
    }

    await interaction.deferUpdate();

    // Generate questions
    const loadingEmbed = new EmbedBuilder()
      .setTitle('🏟️ Preparing Arena Battle...')
      .setColor(COLORS.WARNING)
      .setDescription('```\n🧠 Generating questions...\n```');

    await interaction.editReply({ embeds: [loadingEmbed], components: [] });

    // Generate quiz questions using AI
    const questions = await generateQuiz(arena.topic, arena.questionCount, arena.difficulty);
    
    if (!questions || questions.length === 0) {
      const errorEmbed = new EmbedBuilder()
        .setTitle('❌ Failed to Generate Questions')
        .setColor(COLORS.ERROR)
        .setDescription('Could not generate quiz questions. Please try again with a different topic.');
      return interaction.editReply({ embeds: [errorEmbed] });
    }

    // Store questions
    arena.questions = questions.map(q => ({
      question: q.question,
      options: q.options,
      correct: q.correctIndex,
      explanation: q.explanation
    }));
    arena.status = 'countdown';
    arena.startedAt = new Date();
    await arena.save();

    // Countdown
    for (let i = 3; i > 0; i--) {
      const countdownEmbed = new EmbedBuilder()
        .setTitle('🏟️ Arena Battle Starting!')
        .setColor(COLORS.STREAK_FIRE)
        .setDescription(`\`\`\`\n\n     ${i}     \n\n\`\`\``)
        .addFields({ 
          name: '👥 Players', 
          value: arena.players.map(p => `• ${p.username}`).join('\n'),
          inline: false 
        });

      await interaction.editReply({ embeds: [countdownEmbed] });
      await new Promise(r => setTimeout(r, 1000));
    }

    // Start first question
    arena.status = 'question';
    arena.currentQuestion = 0;
    arena.questionStartTime = new Date();
    await arena.save();

    await showQuestion(interaction, arena, 0);

  } catch (error) {
    console.error('Start arena error:', error);
    await interaction.followUp({ content: '❌ Failed to start arena.', ephemeral: true });
  }
}

/**
 * Show a question to all players
 */
async function showQuestion(interaction, arena, questionIndex) {
  const question = arena.questions[questionIndex];
  const optionEmojis = ['🅰️', '🅱️', '🅲', '🅳'];

  const embed = new EmbedBuilder()
    .setTitle(`🏟️ Arena Battle: ${arena.topic}`)
    .setColor(COLORS.QUIZ_PINK)
    .setDescription([
      '```',
      `Question ${questionIndex + 1}/${arena.questions.length}`,
      '```',
      '',
      `**${question.question}**`
    ].join('\n'))
    .addFields(
      ...question.options.map((opt, i) => ({
        name: optionEmojis[i],
        value: opt,
        inline: true
      }))
    )
    .addFields({
      name: '📊 Scoreboard',
      value: arena.players
        .sort((a, b) => b.score - a.score)
        .slice(0, 5)
        .map((p, i) => {
          const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`;
          return `${medal} ${p.username}: ${p.score} pts`;
        })
        .join('\n') || 'No scores yet',
      inline: false
    })
    .setFooter({ text: `⏱️ ${arena.timePerQuestion} seconds to answer!` })
    .setTimestamp();

  // Create answer buttons
  const buttons = new ActionRowBuilder().addComponents(
    ...question.options.map((_, i) => 
      new ButtonBuilder()
        .setCustomId(`arena_answer_${arena.joinCode}_${i}`)
        .setLabel(optionEmojis[i])
        .setStyle(ButtonStyle.Primary)
    )
  );

  await interaction.editReply({ embeds: [embed], components: [buttons] });

  // Set timeout for question
  setTimeout(async () => {
    await endQuestion(interaction, arena.joinCode, questionIndex);
  }, arena.timePerQuestion * 1000);
}

/**
 * Submit an answer
 */
async function submitAnswer(interaction, joinCode, answerIndex) {
  try {
    const arena = await Arena.findOne({ joinCode });
    
    if (!arena || arena.status !== 'question') {
      return interaction.reply({ content: '❌ No active question!', ephemeral: true });
    }

    const player = arena.players.find(p => p.odiscordId === interaction.user.id);
    if (!player) {
      return interaction.reply({ content: '❌ You\'re not in this arena!', ephemeral: true });
    }

    // Check if already answered this question
    if (player.answers.length > arena.currentQuestion) {
      return interaction.reply({ content: '⏳ You already answered!', ephemeral: true });
    }

    const responseTime = Date.now() - arena.questionStartTime.getTime();
    const isCorrect = answerIndex === arena.questions[arena.currentQuestion].correct;
    
    // Calculate score (faster = more points)
    let points = 0;
    if (isCorrect) {
      const timeBonus = Math.max(0, arena.timePerQuestion * 1000 - responseTime) / 100;
      points = 100 + Math.round(timeBonus);
      player.correctCount += 1;
    }

    player.answers.push(answerIndex);
    player.responseTimes.push(responseTime);
    player.score += points;

    await arena.save();

    const emoji = isCorrect ? '✅' : '❌';
    await interaction.reply({ 
      content: `${emoji} ${isCorrect ? `Correct! +${points} pts` : 'Wrong!'} (${(responseTime / 1000).toFixed(1)}s)`,
      ephemeral: true 
    });

  } catch (error) {
    console.error('Submit answer error:', error);
    await interaction.reply({ content: '❌ Failed to submit answer.', ephemeral: true });
  }
}

/**
 * End current question and show results / next question
 */
async function endQuestion(interaction, joinCode, questionIndex) {
  try {
    const arena = await Arena.findOne({ joinCode });
    if (!arena || arena.status !== 'question') return;

    const question = arena.questions[questionIndex];
    const optionEmojis = ['🅰️', '🅱️', '🅲', '🅳'];

    // Show answer reveal
    const revealEmbed = new EmbedBuilder()
      .setTitle('📊 Answer Revealed!')
      .setColor(COLORS.SUCCESS)
      .setDescription(`**${question.question}**\n\n✅ Correct Answer: **${optionEmojis[question.correct]} ${question.options[question.correct]}**`)
      .addFields({
        name: '📚 Explanation',
        value: question.explanation || 'Great job to those who got it right!',
        inline: false
      })
      .addFields({
        name: '🏆 Current Standings',
        value: arena.players
          .sort((a, b) => b.score - a.score)
          .map((p, i) => {
            const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`;
            const answeredCorrect = p.answers[questionIndex] === question.correct;
            return `${medal} ${p.username}: ${p.score} pts ${answeredCorrect ? '✅' : '❌'}`;
          })
          .join('\n'),
        inline: false
      });

    await interaction.editReply({ embeds: [revealEmbed], components: [] });

    // Wait before next question
    await new Promise(r => setTimeout(r, 3000));

    // Check if more questions
    if (questionIndex + 1 < arena.questions.length) {
      arena.currentQuestion = questionIndex + 1;
      arena.questionStartTime = new Date();
      await arena.save();
      await showQuestion(interaction, arena, questionIndex + 1);
    } else {
      // End arena
      await endArena(interaction, arena);
    }

  } catch (error) {
    console.error('End question error:', error);
  }
}

/**
 * End the arena and show final results
 */
async function endArena(interaction, arena) {
  arena.status = 'finished';
  arena.endedAt = new Date();
  await arena.save();

  const rankings = arena.getFinalRankings();

  // Award XP to participants
  for (const player of rankings) {
    const xpReward = arena.getXpReward(player.rank);
    await addXpToUser(player.odiscordId, xpReward, `Arena Battle - Rank ${player.rank}`);
    
    // Update arena stats
    const user = await getOrCreateUser(player.odiscordId, player.username);
    if (!user.arenaStats) user.arenaStats = { played: 0, wins: 0, podiums: 0, highestScore: 0 };
    user.arenaStats.played += 1;
    if (player.rank === 1) user.arenaStats.wins += 1;
    if (player.rank <= 3) user.arenaStats.podiums += 1;
    if (player.score > user.arenaStats.highestScore) {
      user.arenaStats.highestScore = player.score;
    }
    await user.save();
  }

  const finalEmbed = new EmbedBuilder()
    .setTitle('🏆 Arena Battle Complete!')
    .setColor(COLORS.XP_GOLD)
    .setDescription([
      '```',
      '╔══════════════════════════════════════╗',
      '║          FINAL RESULTS               ║',
      '╚══════════════════════════════════════╝',
      '```'
    ].join('\n'))
    .addFields({
      name: '🏆 Final Rankings',
      value: rankings.map((p, i) => {
        const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`;
        const xp = arena.getXpReward(p.rank);
        return `${medal} **${p.username}** - ${p.score} pts | ${p.correctCount}/${arena.questions.length} correct | +${xp} XP`;
      }).join('\n'),
      inline: false
    })
    .addFields(
      { name: '📋 Topic', value: arena.topic, inline: true },
      { name: '❓ Questions', value: String(arena.questions.length), inline: true },
      { name: '👥 Players', value: String(rankings.length), inline: true }
    )
    .setFooter({ text: '🎓 MentorAI Arena • Thanks for playing!' })
    .setTimestamp();

  // Play again button
  const buttons = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`arena_rematch_${arena.topic}`)
      .setLabel('Rematch!')
      .setEmoji('🔄')
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId('exec_leaderboard')
      .setLabel('Leaderboard')
      .setEmoji('📊')
      .setStyle(ButtonStyle.Secondary)
  );

  await interaction.editReply({ embeds: [finalEmbed], components: [buttons] });
  activeArenas.delete(arena.joinCode);
}

/**
 * Refresh arena display
 */
async function refreshArena(interaction, joinCode) {
  const arena = await Arena.findOne({ joinCode });
  if (!arena) {
    return interaction.reply({ content: '❌ Arena not found!', ephemeral: true });
  }

  await interaction.deferUpdate();

  const playerList = arena.players.map((p, i) => {
    const prefix = p.odiscordId === arena.hostId ? `${EMOJIS.CROWN} ` : `${i + 1}. `;
    return `${prefix}${p.username}`;
  }).join('\n');

  const embed = EmbedBuilder.from(interaction.message.embeds[0])
    .spliceFields(1, 1, { 
      name: `👥 Players (${arena.players.length}/${arena.maxPlayers})`, 
      value: playerList || 'No players', 
      inline: true 
    });

  await interaction.editReply({ embeds: [embed] });
}

/**
 * Cancel arena
 */
async function cancelArena(interaction, joinCode) {
  const arena = await Arena.findOne({ joinCode });
  
  if (!arena) {
    return interaction.reply({ content: '❌ Arena not found!', ephemeral: true });
  }

  if (arena.hostId !== interaction.user.id) {
    return interaction.reply({ content: '❌ Only the host can cancel!', ephemeral: true });
  }

  arena.status = 'cancelled';
  await arena.save();
  activeArenas.delete(joinCode);

  const embed = new EmbedBuilder()
    .setTitle('❌ Arena Cancelled')
    .setColor(COLORS.ERROR)
    .setDescription('The host has cancelled this arena.')
    .setFooter({ text: 'Create a new arena with /arena create' });

  await interaction.update({ embeds: [embed], components: [] });
}
