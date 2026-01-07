import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle } from 'discord.js';
import { getOrCreateUser, addXpToUser } from '../../services/gamificationService.js';
import { executeCode } from '../../services/codeExecutionService.js';
import { SpeedrunProblem, SEED_SPEEDRUNS } from '../../database/models/SpeedrunProblem.js';
import { COLORS, EMOJIS, createProgressBar } from '../../config/designSystem.js';

// Active speedrun sessions
const activeSessions = new Map();

// Time bonuses and rankings
const RANK_THRESHOLDS = {
  S: 0.5,   // <= 50% of time limit
  A: 0.7,   // <= 70%
  B: 0.85,  // <= 85%
  C: 1.0,   // <= 100%
  D: 1.2,   // <= 120%
  F: Infinity
};

const RANK_XP = {
  S: 150,
  A: 100,
  B: 75,
  C: 50,
  D: 25,
  F: 10
};

const RANK_COLORS = {
  S: 0xFFD700, // Gold
  A: 0xC0C0C0, // Silver
  B: 0xCD7F32, // Bronze
  C: 0x4CAF50, // Green
  D: 0xFF9800, // Orange
  F: 0xF44336  // Red
};

export const data = new SlashCommandBuilder()
  .setName('speedrun')
  .setDescription('⚡ Timed coding challenges - race against the clock!')
  .addSubcommand(sub =>
    sub.setName('start')
      .setDescription('Start a speedrun challenge')
      .addStringOption(opt =>
        opt.setName('difficulty')
          .setDescription('Problem difficulty')
          .setRequired(false)
          .addChoices(
            { name: '🟢 Easy', value: 'easy' },
            { name: '🟡 Medium', value: 'medium' },
            { name: '🔴 Hard', value: 'hard' }
          ))
      .addStringOption(opt =>
        opt.setName('language')
          .setDescription('Programming language')
          .setRequired(false)
          .addChoices(
            { name: '🟨 JavaScript', value: 'javascript' },
            { name: '🐍 Python', value: 'python' }
          )))
  .addSubcommand(sub =>
    sub.setName('submit')
      .setDescription('Submit your speedrun solution'))
  .addSubcommand(sub =>
    sub.setName('leaderboard')
      .setDescription('View speedrun leaderboards')
      .addStringOption(opt =>
        opt.setName('problem')
          .setDescription('Problem ID to view leaderboard for')
          .setRequired(false)))
  .addSubcommand(sub =>
    sub.setName('problems')
      .setDescription('Browse available speedrun problems'));

export async function execute(interaction) {
  const subcommand = interaction.options.getSubcommand();

  switch (subcommand) {
    case 'start':
      await startSpeedrun(interaction);
      break;
    case 'submit':
      await showSubmitModal(interaction);
      break;
    case 'leaderboard':
      await showLeaderboard(interaction);
      break;
    case 'problems':
      await browseProblems(interaction);
      break;
  }
}

async function seedProblemsIfNeeded() {
  const count = await SpeedrunProblem.countDocuments();
  if (count === 0) {
    await SpeedrunProblem.insertMany(SEED_SPEEDRUNS);
    console.log('Seeded speedrun problems');
  }
}

async function startSpeedrun(interaction) {
  await interaction.deferReply();

  try {
    await seedProblemsIfNeeded();

    const difficulty = interaction.options.getString('difficulty') || 'easy';
    const language = interaction.options.getString('language') || 'javascript';
    const userId = interaction.user.id;

    // Check if user already has active session
    if (activeSessions.has(userId)) {
      return interaction.editReply({
        content: '⚠️ You already have an active speedrun! Use `/speedrun submit` to complete it first.',
        ephemeral: true
      });
    }

    // Get random problem for difficulty
    const problems = await SpeedrunProblem.find({ difficulty });
    
    if (problems.length === 0) {
      return interaction.editReply({
        content: '❌ No problems found for that difficulty!',
        ephemeral: true
      });
    }

    const problem = problems[Math.floor(Math.random() * problems.length)];
    const starterCode = problem.starterCode.get(language) || '// Write your solution here';
    const timeLimit = problem.timeLimit || 300; // 5 minutes default

    // Create session
    const session = {
      problemId: problem.problemId,
      problem,
      language,
      startTime: Date.now(),
      timeLimit: timeLimit * 1000 // Convert to ms
    };
    activeSessions.set(userId, session);

    // Build embed
    const difficultyEmoji = { easy: '🟢', medium: '🟡', hard: '🔴' }[difficulty];
    
    const embed = new EmbedBuilder()
      .setTitle(`⚡ Speedrun: ${problem.title}`)
      .setColor(COLORS.WARNING)
      .setDescription([
        `${difficultyEmoji} **Difficulty:** ${difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}`,
        `⏱️ **Time Limit:** ${timeLimit} seconds`,
        `💻 **Language:** ${language === 'javascript' ? '🟨 JavaScript' : '🐍 Python'}`,
        '',
        '─'.repeat(35),
        '',
        '📋 **Problem:**',
        problem.description,
        '',
        '**Examples:**'
      ].join('\n'));

    // Add examples
    if (problem.examples && problem.examples.length > 0) {
      const exampleText = problem.examples.map((ex, i) => 
        `\`\`\`\nInput: ${ex.input}\nOutput: ${ex.output}${ex.explanation ? `\nExplanation: ${ex.explanation}` : ''}\n\`\`\``
      ).join('\n');
      embed.addFields({ name: '📝 Examples', value: exampleText || 'No examples provided' });
    }

    // Add starter code
    embed.addFields({
      name: '🚀 Starter Code',
      value: `\`\`\`${language}\n${starterCode}\n\`\`\``
    });

    embed.addFields({
      name: '⏰ Timer Started!',
      value: `You have **${timeLimit} seconds** to solve this!\nClick **Submit Solution** when ready.`
    });

    embed.setFooter({ text: '⚡ Speedrun Mode | Fast solutions = Better rank!' });

    // Buttons
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('speedrun_submit')
        .setLabel('Submit Solution')
        .setEmoji('📤')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId('speedrun_hint')
        .setLabel('Get Hint (-50 XP)')
        .setEmoji('💡')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('speedrun_giveup')
        .setLabel('Give Up')
        .setEmoji('🏳️')
        .setStyle(ButtonStyle.Danger)
    );

    await interaction.editReply({ embeds: [embed], components: [row] });

    // Set timeout for time limit
    setTimeout(async () => {
      const session = activeSessions.get(userId);
      if (session && session.problemId === problem.problemId) {
        activeSessions.delete(userId);
        try {
          await interaction.followUp({
            content: '⏰ **Time\'s up!** Your speedrun session has expired. Try again with `/speedrun start`!',
            ephemeral: true
          });
        } catch (e) {
          // Interaction may have expired
        }
      }
    }, timeLimit * 1000);

  } catch (error) {
    console.error('Speedrun start error:', error);
    await interaction.editReply({
      content: '❌ Failed to start speedrun. Please try again!',
      ephemeral: true
    });
  }
}

async function showSubmitModal(interaction) {
  const session = activeSessions.get(interaction.user.id);

  if (!session) {
    return interaction.reply({
      content: '❌ No active speedrun session! Start one with `/speedrun start`',
      ephemeral: true
    });
  }

  const modal = new ModalBuilder()
    .setCustomId('speedrun_solution_modal')
    .setTitle(`⚡ Submit: ${session.problem.title}`);

  const codeInput = new TextInputBuilder()
    .setCustomId('solution_code')
    .setLabel(`Your ${session.language} solution`)
    .setStyle(TextInputStyle.Paragraph)
    .setPlaceholder('Paste your complete solution here...')
    .setRequired(true);

  modal.addComponents(new ActionRowBuilder().addComponents(codeInput));
  await interaction.showModal(modal);
}

export async function handleSpeedrunSubmission(interaction) {
  const userId = interaction.user.id;
  const session = activeSessions.get(userId);

  if (!session) {
    return interaction.reply({
      content: '❌ Your speedrun session expired! Start a new one with `/speedrun start`',
      ephemeral: true
    });
  }

  await interaction.deferReply();

  const code = interaction.fields.getTextInputValue('solution_code');
  const endTime = Date.now();
  const timeTaken = endTime - session.startTime;
  const timeSeconds = Math.round(timeTaken / 1000);
  const problem = session.problem;

  // Run test cases
  let passedTests = 0;
  let totalTests = problem.testCases?.length || 0;
  let testResults = [];

  for (const testCase of (problem.testCases || [])) {
    try {
      // Prepare code with test wrapper
      let wrappedCode = code;
      
      if (session.language === 'javascript') {
        wrappedCode = `${code}\nconsole.log(JSON.stringify(${problem.functionName}(${testCase.input})));`;
      } else if (session.language === 'python') {
        wrappedCode = `${code}\nimport json\nprint(json.dumps(${problem.functionName}(${testCase.input})))`;
      }

      const result = await executeCode(session.language, wrappedCode);
      const output = result.output?.trim();
      const expected = JSON.stringify(testCase.expectedOutput);

      if (output === expected) {
        passedTests++;
        testResults.push({ status: 'pass', input: testCase.input });
      } else {
        testResults.push({ 
          status: 'fail', 
          input: testCase.input, 
          expected,
          got: output || 'No output'
        });
      }
    } catch (error) {
      testResults.push({ 
        status: 'error', 
        input: testCase.input, 
        error: error.message 
      });
    }
  }

  // Calculate rank based on time
  const timeRatio = timeTaken / session.timeLimit;
  let rank = 'F';
  for (const [r, threshold] of Object.entries(RANK_THRESHOLDS)) {
    if (timeRatio <= threshold && passedTests === totalTests) {
      rank = r;
      break;
    }
  }

  // If not all tests passed, cap at C
  if (passedTests < totalTests) {
    if (passedTests === 0) rank = 'F';
    else if (passedTests / totalTests < 0.5) rank = 'F';
    else if (passedTests / totalTests < 0.7) rank = 'D';
    else rank = 'C';
  }

  // Calculate XP
  const baseXP = RANK_XP[rank] || 10;
  const bonusXP = passedTests === totalTests ? 25 : 0;
  const totalXP = baseXP + bonusXP;

  // Clear session
  activeSessions.delete(userId);

  // Update user stats
  const user = await getOrCreateUser(userId, interaction.user.username);
  if (!user.speedrunStats) {
    user.speedrunStats = {
      totalAttempts: 0,
      totalCompleted: 0,
      bestRank: 'F',
      avgTime: 0,
      problemsSolved: []
    };
  }

  user.speedrunStats.totalAttempts++;
  if (passedTests === totalTests) {
    user.speedrunStats.totalCompleted++;
    if (!user.speedrunStats.problemsSolved.includes(problem.problemId)) {
      user.speedrunStats.problemsSolved.push(problem.problemId);
    }
  }

  // Update best rank
  const rankOrder = ['S', 'A', 'B', 'C', 'D', 'F'];
  const currentBest = rankOrder.indexOf(user.speedrunStats.bestRank);
  const newRank = rankOrder.indexOf(rank);
  if (newRank < currentBest) {
    user.speedrunStats.bestRank = rank;
  }

  await user.save();
  await addXpToUser(userId, interaction.user.username, totalXP, 'speedrun');

  // Update leaderboard
  await updateLeaderboard(problem.problemId, userId, interaction.user.username, timeSeconds, rank);

  // Build result embed
  const embed = new EmbedBuilder()
    .setTitle(`⚡ Speedrun Complete!`)
    .setColor(RANK_COLORS[rank])
    .setDescription([
      `### ${getGradeEmoji(rank)} Rank: **${rank}**`,
      '',
      `**Problem:** ${problem.title}`,
      `**Time:** ⏱️ ${formatTime(timeSeconds)}`,
      `**Tests Passed:** ${passedTests}/${totalTests}`
    ].join('\n'));

  // Test results details
  const resultsText = testResults.slice(0, 5).map((t, i) => {
    if (t.status === 'pass') return `✅ Test ${i + 1}: Passed`;
    if (t.status === 'fail') return `❌ Test ${i + 1}: Expected \`${t.expected}\`, got \`${t.got}\``;
    return `⚠️ Test ${i + 1}: Error`;
  }).join('\n');

  embed.addFields({
    name: '🧪 Test Results',
    value: resultsText || 'No tests run'
  });

  // XP earned
  embed.addFields({
    name: '✨ Rewards',
    value: [
      `**+${totalXP} XP** earned!`,
      bonusXP > 0 ? '🎯 **+25 XP** Perfect Solution Bonus!' : ''
    ].filter(Boolean).join('\n')
  });

  // Rank scale
  embed.addFields({
    name: '📊 Rank Scale',
    value: '🏆 S → A → B → C → D → F'
  });

  embed.setFooter({ text: '⚡ Want another challenge? Use /speedrun start' });

  // Buttons
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('speedrun_retry')
      .setLabel('Try Again')
      .setEmoji('🔄')
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId(`speedrun_lb_${problem.problemId}`)
      .setLabel('View Leaderboard')
      .setEmoji('🏆')
      .setStyle(ButtonStyle.Secondary)
  );

  await interaction.editReply({ embeds: [embed], components: [row] });
}

async function updateLeaderboard(problemId, discordId, username, timeSeconds, rank) {
  const problem = await SpeedrunProblem.findOne({ problemId });
  if (!problem) return;

  // Check if user already on leaderboard
  const existingIdx = problem.leaderboard.findIndex(e => e.discordId === discordId);
  
  if (existingIdx >= 0) {
    // Update if better time
    if (timeSeconds < problem.leaderboard[existingIdx].timeSeconds) {
      problem.leaderboard[existingIdx] = { discordId, username, timeSeconds, rank, date: new Date() };
    }
  } else {
    problem.leaderboard.push({ discordId, username, timeSeconds, rank, date: new Date() });
  }

  // Sort by time and keep top 100
  problem.leaderboard.sort((a, b) => a.timeSeconds - b.timeSeconds);
  problem.leaderboard = problem.leaderboard.slice(0, 100);

  await problem.save();
}

async function showLeaderboard(interaction) {
  await interaction.deferReply();

  const problemId = interaction.options.getString('problem');

  try {
    if (problemId) {
      // Show specific problem leaderboard
      const problem = await SpeedrunProblem.findOne({ problemId });
      if (!problem) {
        return interaction.editReply({ content: '❌ Problem not found!' });
      }

      const embed = new EmbedBuilder()
        .setTitle(`🏆 Leaderboard: ${problem.title}`)
        .setColor(COLORS.XP_GOLD);

      if (problem.leaderboard.length === 0) {
        embed.setDescription('No completions yet! Be the first to complete this challenge.');
      } else {
        const lbText = problem.leaderboard.slice(0, 10).map((entry, i) => {
          const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`;
          return `${medal} **${entry.username}** - ${formatTime(entry.timeSeconds)} (${entry.rank})`;
        }).join('\n');

        embed.setDescription(lbText);
      }

      await interaction.editReply({ embeds: [embed] });
    } else {
      // Show global speedrun stats
      const problems = await SpeedrunProblem.find({});
      
      const embed = new EmbedBuilder()
        .setTitle('🏆 Speedrun Leaderboards')
        .setColor(COLORS.XP_GOLD)
        .setDescription('Select a problem to view its leaderboard:');

      for (const problem of problems.slice(0, 10)) {
        const topRunner = problem.leaderboard[0];
        embed.addFields({
          name: `${getDifficultyEmoji(problem.difficulty)} ${problem.title}`,
          value: topRunner 
            ? `🥇 ${topRunner.username} - ${formatTime(topRunner.timeSeconds)}`
            : 'No completions yet',
          inline: true
        });
      }

      await interaction.editReply({ embeds: [embed] });
    }
  } catch (error) {
    console.error('Leaderboard error:', error);
    await interaction.editReply({ content: '❌ Failed to load leaderboard!' });
  }
}

async function browseProblems(interaction) {
  await interaction.deferReply();

  try {
    await seedProblemsIfNeeded();
    const problems = await SpeedrunProblem.find({}).sort({ difficulty: 1 });

    const embed = new EmbedBuilder()
      .setTitle('⚡ Speedrun Problems')
      .setColor(COLORS.PRIMARY)
      .setDescription('Race against the clock to solve coding challenges!\n\n');

    const grouped = {
      easy: problems.filter(p => p.difficulty === 'easy'),
      medium: problems.filter(p => p.difficulty === 'medium'),
      hard: problems.filter(p => p.difficulty === 'hard')
    };

    for (const [difficulty, probs] of Object.entries(grouped)) {
      if (probs.length > 0) {
        const emoji = getDifficultyEmoji(difficulty);
        const list = probs.map(p => `• **${p.title}** (${p.timeLimit}s)`).join('\n');
        embed.addFields({
          name: `${emoji} ${difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}`,
          value: list
        });
      }
    }

    embed.setFooter({ text: 'Use /speedrun start to begin a challenge!' });

    await interaction.editReply({ embeds: [embed] });
  } catch (error) {
    console.error('Browse problems error:', error);
    await interaction.editReply({ content: '❌ Failed to load problems!' });
  }
}

function getGradeEmoji(rank) {
  const emojis = {
    S: '🏆',
    A: '🥇',
    B: '🥈', 
    C: '🥉',
    D: '📊',
    F: '📉'
  };
  return emojis[rank] || '❓';
}

function getDifficultyEmoji(difficulty) {
  const emojis = { easy: '🟢', medium: '🟡', hard: '🔴' };
  return emojis[difficulty] || '⚪';
}

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
}

/**
 * Handle speedrun button interactions
 */
export async function handleSpeedrunButton(interaction, action, params) {
  if (action === 'submit') {
    await showSubmitModal(interaction);
  } else if (action === 'retry') {
    // Rerun start with defaults
    await interaction.deferUpdate();
    await startSpeedrun({
      ...interaction,
      deferReply: async () => {},
      editReply: interaction.editReply.bind(interaction),
      options: {
        getString: () => null,
        getSubcommand: () => 'start'
      }
    });
  } else if (action === 'giveup') {
    activeSessions.delete(interaction.user.id);
    await interaction.reply({
      content: '🏳️ Speedrun abandoned. You can try again with `/speedrun start`!',
      ephemeral: true
    });
  } else if (action === 'hint') {
    const session = activeSessions.get(interaction.user.id);
    if (!session) {
      return interaction.reply({ content: '❌ No active session!', ephemeral: true });
    }
    await interaction.reply({
      content: `💡 **Hint:** ${session.problem.hints?.[0] || 'Think about the problem step by step!'}`,
      ephemeral: true
    });
  } else if (action === 'lb') {
    await interaction.deferReply();
    const problemId = params[0];
    const problem = await SpeedrunProblem.findOne({ problemId });
    if (!problem) {
      return interaction.editReply({ content: '❌ Problem not found!' });
    }
    
    const embed = new EmbedBuilder()
      .setTitle(`🏆 Leaderboard: ${problem.title}`)
      .setColor(COLORS.XP_GOLD);

    if (problem.leaderboard.length === 0) {
      embed.setDescription('No completions yet!');
    } else {
      const lbText = problem.leaderboard.slice(0, 10).map((entry, i) => {
        const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`;
        return `${medal} **${entry.username}** - ${formatTime(entry.timeSeconds)} (${entry.rank})`;
      }).join('\n');
      embed.setDescription(lbText);
    }

    await interaction.editReply({ embeds: [embed] });
  }
}
