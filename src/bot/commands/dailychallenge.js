// src/bot/commands/dailychallenge.js
// ═══════════════════════════════════════════════════════════════════
// ULTRA QUIZ SYSTEM - DAILY CODING CHALLENGE
// ═══════════════════════════════════════════════════════════════════

import { 
  SlashCommandBuilder, 
  EmbedBuilder, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle
} from 'discord.js';
import DailyChallenge from '../../database/models/DailyChallenge.js';
import { User } from '../../database/models/User.js';
import { getOrCreateUser } from '../../services/gamificationService.js';
import {
  QUIZ_COLORS,
  QUIZ_EMOJIS,
  DIFFICULTY,
  ASCII_ART
} from '../../config/quizConfig.js';
import {
  formatNumber,
  getRankFromXP,
  createProgressBar,
  formatTime
} from '../../utils/quizUtils.js';

// Difficulty settings for daily challenges
const CHALLENGE_CONFIG = {
  easy: { xp: 75, emoji: '🟢', time: 30, points: 100 },
  medium: { xp: 150, emoji: '🟡', time: 45, points: 200 },
  hard: { xp: 300, emoji: '🔴', time: 60, points: 400 }
};

// ═══════════════════════════════════════════════════════════════════
// COMMAND DEFINITION
// ═══════════════════════════════════════════════════════════════════

export const data = new SlashCommandBuilder()
  .setName('dailychallenge')
  .setDescription('💻 Daily coding challenges (LeetCode-style)')
  .addSubcommand(sub =>
    sub.setName('today')
      .setDescription('View today\'s coding challenge'))
  .addSubcommand(sub =>
    sub.setName('submit')
      .setDescription('Submit your solution'))
  .addSubcommand(sub =>
    sub.setName('hint')
      .setDescription('Get a hint for today\'s challenge'))
  .addSubcommand(sub =>
    sub.setName('leaderboard')
      .setDescription('View today\'s challenge leaderboard'))
  .addSubcommand(sub =>
    sub.setName('streak')
      .setDescription('View your daily challenge streak'));

// ═══════════════════════════════════════════════════════════════════
// MAIN EXECUTE FUNCTION
// ═══════════════════════════════════════════════════════════════════

export async function execute(interaction) {
  const subcommand = interaction.options.getSubcommand();

  try {
    switch (subcommand) {
      case 'today':
        await showTodaysChallenge(interaction);
        break;
      case 'submit':
        await showSubmitModal(interaction);
        break;
      case 'hint':
        await showHint(interaction);
        break;
      case 'leaderboard':
        await showChallengeLeaderboard(interaction);
        break;
      case 'streak':
        await showChallengeStreak(interaction);
        break;
    }
  } catch (error) {
    console.error('Daily challenge command error:', error);
    await interaction.reply({
      content: `${QUIZ_EMOJIS.INCORRECT} An error occurred. Please try again!`,
      ephemeral: true
    });
  }
}

// ═══════════════════════════════════════════════════════════════════
// SHOW TODAY'S CHALLENGE
// ═══════════════════════════════════════════════════════════════════

async function showTodaysChallenge(interaction) {
  await interaction.deferReply();

  const userId = interaction.user.id;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Find or create today's challenge
  let challenge = await DailyChallenge.findOne({
    date: {
      $gte: today,
      $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
    }
  });

  if (!challenge) {
    // Generate a sample challenge (in production, use AI)
    challenge = await createSampleChallenge(today);
  }

  const config = CHALLENGE_CONFIG[challenge.difficulty] || CHALLENGE_CONFIG.medium;
  const userParticipation = challenge.participants?.find(p => p.discordId === userId);
  const user = await getOrCreateUser(userId, interaction.user.username);
  const userRank = getRankFromXP(user.xp || 0);

  // Time remaining
  const endOfDay = new Date(today.getTime() + 24 * 60 * 60 * 1000);
  const timeRemaining = Math.max(0, Math.floor((endOfDay - Date.now()) / 1000));
  const hoursLeft = Math.floor(timeRemaining / 3600);
  const minsLeft = Math.floor((timeRemaining % 3600) / 60);

  const embed = new EmbedBuilder()
    .setColor(userParticipation?.completed ? QUIZ_COLORS.SUCCESS : QUIZ_COLORS.PRIMARY)
    .setTitle(`${QUIZ_EMOJIS.BRAIN} Daily Coding Challenge`)
    .setDescription(`
${ASCII_ART.header.daily}

${userParticipation?.completed 
  ? `${QUIZ_EMOJIS.CORRECT} **You've completed today's challenge!**`
  : `${QUIZ_EMOJIS.TARGET} **Today's Challenge Awaits!**`
}

${ASCII_ART.dividerThin}

**${challenge.title}**

${config.emoji} Difficulty: **${challenge.difficulty.charAt(0).toUpperCase() + challenge.difficulty.slice(1)}**
${QUIZ_EMOJIS.XP} Reward: **${config.xp} XP**
⏱️ Est. Time: **${config.time} minutes**

${ASCII_ART.dividerThin}

**📋 Problem Description**

${challenge.description}

${ASCII_ART.dividerThin}

**📥 Example Input**
\`\`\`
${challenge.exampleInput || 'See problem description'}
\`\`\`

**📤 Expected Output**
\`\`\`
${challenge.exampleOutput || 'See problem description'}
\`\`\`

${challenge.constraints ? `\n**⚠️ Constraints**\n${challenge.constraints}\n` : ''}

${ASCII_ART.dividerThin}

👥 **${challenge.participants?.length || 0}** participants • ✅ **${challenge.participants?.filter(p => p.completed).length || 0}** completed
⏰ Expires in: **${hoursLeft}h ${minsLeft}m**
    `)
    .setFooter({ text: `${userRank.emoji} ${userRank.name} • ${QUIZ_EMOJIS.LIGHTNING} MentorAI Daily Challenge` })
    .setTimestamp();

  // Buttons
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('dailychallenge_submit')
      .setLabel(userParticipation?.completed ? '✅ Completed' : '📝 Submit Solution')
      .setStyle(userParticipation?.completed ? ButtonStyle.Success : ButtonStyle.Primary)
      .setDisabled(!!userParticipation?.completed),
    new ButtonBuilder()
      .setCustomId('dailychallenge_hint')
      .setLabel('💡 Get Hint')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId('dailychallenge_leaderboard')
      .setLabel('🏆 Leaderboard')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId('help_main')
      .setLabel('Menu')
      .setEmoji('🏠')
      .setStyle(ButtonStyle.Secondary)
  );

  await interaction.editReply({ embeds: [embed], components: [row] });
}

// ═══════════════════════════════════════════════════════════════════
// SUBMIT MODAL
// ═══════════════════════════════════════════════════════════════════

async function showSubmitModal(interaction) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const challenge = await DailyChallenge.findOne({
    date: {
      $gte: today,
      $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
    }
  });

  if (!challenge) {
    return interaction.reply({
      content: `${QUIZ_EMOJIS.INCORRECT} No challenge available today! Use \`/dailychallenge today\` first.`,
      ephemeral: true
    });
  }

  // Check if already completed
  const userParticipation = challenge.participants?.find(p => p.discordId === interaction.user.id);
  if (userParticipation?.completed) {
    return interaction.reply({
      content: `${QUIZ_EMOJIS.CORRECT} You've already completed today's challenge!`,
      ephemeral: true
    });
  }

  const modal = new ModalBuilder()
    .setCustomId('dailychallenge_solution_modal')
    .setTitle('Submit Your Solution');

  const languageInput = new TextInputBuilder()
    .setCustomId('language')
    .setLabel('Programming Language')
    .setPlaceholder('e.g., JavaScript, Python, Java')
    .setStyle(TextInputStyle.Short)
    .setRequired(true)
    .setMaxLength(30);

  const codeInput = new TextInputBuilder()
    .setCustomId('code')
    .setLabel('Your Solution Code')
    .setPlaceholder('Paste your code here...')
    .setStyle(TextInputStyle.Paragraph)
    .setRequired(true)
    .setMaxLength(4000);

  const explanationInput = new TextInputBuilder()
    .setCustomId('explanation')
    .setLabel('Brief Explanation (Optional)')
    .setPlaceholder('Explain your approach...')
    .setStyle(TextInputStyle.Paragraph)
    .setRequired(false)
    .setMaxLength(500);

  modal.addComponents(
    new ActionRowBuilder().addComponents(languageInput),
    new ActionRowBuilder().addComponents(codeInput),
    new ActionRowBuilder().addComponents(explanationInput)
  );

  await interaction.showModal(modal);
}

// ═══════════════════════════════════════════════════════════════════
// HINT
// ═══════════════════════════════════════════════════════════════════

async function showHint(interaction) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const challenge = await DailyChallenge.findOne({
    date: {
      $gte: today,
      $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
    }
  });

  if (!challenge) {
    return interaction.reply({
      content: `${QUIZ_EMOJIS.INCORRECT} No challenge available today!`,
      ephemeral: true
    });
  }

  const hints = challenge.hints || [
    'Think about the problem step by step.',
    'Consider edge cases in your solution.',
    'What data structures would be most efficient here?'
  ];

  // Track hint usage (costs XP in some systems)
  const hintEmbed = new EmbedBuilder()
    .setColor(QUIZ_COLORS.WARNING)
    .setTitle('💡 Hint')
    .setDescription(`
**${challenge.title}**

${ASCII_ART.dividerThin}

${hints.map((h, i) => `**Hint ${i + 1}:** ${h}`).join('\n\n')}

${ASCII_ART.dividerThin}

*Try to solve it yourself first!*
    `)
    .setFooter({ text: '💡 Hints help you learn!' });

  await interaction.reply({ embeds: [hintEmbed], ephemeral: true });
}

// ═══════════════════════════════════════════════════════════════════
// LEADERBOARD
// ═══════════════════════════════════════════════════════════════════

async function showChallengeLeaderboard(interaction) {
  await interaction.deferReply();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const challenge = await DailyChallenge.findOne({
    date: {
      $gte: today,
      $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
    }
  });

  if (!challenge || !challenge.participants?.length) {
    const embed = new EmbedBuilder()
      .setColor(QUIZ_COLORS.PRIMARY)
      .setTitle(`${QUIZ_EMOJIS.TROPHY} Daily Challenge Leaderboard`)
      .setDescription(`
${ASCII_ART.header.daily}

*No completions yet today!*

Be the first to solve today's challenge!
      `)
      .setFooter({ text: 'Use /dailychallenge today to see the challenge' });

    return interaction.editReply({ embeds: [embed] });
  }

  // Sort by completion time
  const completedParticipants = challenge.participants
    .filter(p => p.completed)
    .sort((a, b) => (a.timeTaken || Infinity) - (b.timeTaken || Infinity))
    .slice(0, 10);

  const leaderboardText = completedParticipants.length > 0
    ? completedParticipants.map((p, i) => {
        const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `\`#${i + 1}\``;
        const timeStr = p.timeTaken ? `${(p.timeTaken / 1000).toFixed(1)}s` : 'N/A';
        return `${medal} **${p.username || 'Unknown'}** • ⏱️ ${timeStr}`;
      }).join('\n')
    : '*No completions yet!*';

  const embed = new EmbedBuilder()
    .setColor(QUIZ_COLORS.XP_GOLD)
    .setTitle(`${QUIZ_EMOJIS.TROPHY} Today's Challenge Leaderboard`)
    .setDescription(`
${ASCII_ART.header.daily}

**${challenge.title}**

${ASCII_ART.dividerThin}

${leaderboardText}

${ASCII_ART.dividerThin}

👥 **${challenge.participants.length}** attempted • ✅ **${completedParticipants.length}** completed
    `)
    .setFooter({ text: `${QUIZ_EMOJIS.LIGHTNING} Fastest solutions win!` })
    .setTimestamp();

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('dailychallenge_today')
      .setLabel('View Challenge')
      .setEmoji('📋')
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId('dailychallenge_submit')
      .setLabel('Submit Solution')
      .setEmoji('📝')
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId('help_main')
      .setLabel('Menu')
      .setEmoji('🏠')
      .setStyle(ButtonStyle.Secondary)
  );

  await interaction.editReply({ embeds: [embed], components: [row] });
}

// ═══════════════════════════════════════════════════════════════════
// STREAK
// ═══════════════════════════════════════════════════════════════════

async function showChallengeStreak(interaction) {
  const user = await getOrCreateUser(interaction.user.id, interaction.user.username);
  const userRank = getRankFromXP(user.xp || 0);
  
  // Get challenge completion history
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const recentChallenges = await DailyChallenge.find({
    date: { $gte: thirtyDaysAgo },
    'participants.discordId': interaction.user.id,
    'participants.completed': true
  }).sort({ date: -1 });

  const completedDays = recentChallenges.length;
  const currentStreak = user.dailyChallengeStreak || 0;
  const longestStreak = user.longestDailyChallengeStreak || currentStreak;

  // Create visual calendar (last 7 days)
  const calendarDays = [];
  for (let i = 6; i >= 0; i--) {
    const day = new Date();
    day.setDate(day.getDate() - i);
    day.setHours(0, 0, 0, 0);
    
    const completed = recentChallenges.some(c => {
      const cDate = new Date(c.date);
      cDate.setHours(0, 0, 0, 0);
      return cDate.getTime() === day.getTime();
    });
    
    calendarDays.push(completed ? '🟩' : '⬜');
  }

  const embed = new EmbedBuilder()
    .setColor(QUIZ_COLORS.STREAK_FIRE)
    .setTitle(`${QUIZ_EMOJIS.STREAK} Daily Challenge Streak`)
    .setDescription(`
${ASCII_ART.header.daily}

${userRank.emoji} **${interaction.user.username}**

${ASCII_ART.dividerThin}

**Current Streak:** ${currentStreak} days ${currentStreak >= 7 ? '🔥' : ''}
**Longest Streak:** ${longestStreak} days
**This Month:** ${completedDays}/30 challenges

${ASCII_ART.dividerThin}

**Last 7 Days**
\`\`\`
${calendarDays.join(' ')}
Mon Tue Wed Thu Fri Sat Sun
\`\`\`

${ASCII_ART.dividerThin}

${currentStreak >= 7 
  ? `${QUIZ_EMOJIS.STREAK} **You're on fire!** Keep the streak going!`
  : `${QUIZ_EMOJIS.TARGET} Complete today's challenge to build your streak!`
}
    `)
    .setFooter({ text: '📅 Complete challenges daily to maintain your streak!' })
    .setTimestamp();

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('dailychallenge_today')
      .setLabel('Today\'s Challenge')
      .setEmoji('📋')
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId('exec_streak')
      .setLabel('Overall Streak')
      .setEmoji('🔥')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId('help_main')
      .setLabel('Menu')
      .setEmoji('🏠')
      .setStyle(ButtonStyle.Secondary)
  );

  await interaction.reply({ embeds: [embed], components: [row] });
}

// ═══════════════════════════════════════════════════════════════════
// BUTTON HANDLER
// ═══════════════════════════════════════════════════════════════════

export async function handleButton(interaction, action, params) {
  try {
    switch (action) {
      case 'today':
        await showTodaysChallenge(interaction);
        break;
      case 'submit':
        await showSubmitModal(interaction);
        break;
      case 'hint':
        await showHint(interaction);
        break;
      case 'leaderboard':
        await showChallengeLeaderboard(interaction);
        break;
      case 'streak':
        await showChallengeStreak(interaction);
        break;
    }
  } catch (error) {
    console.error('Daily challenge button handler error:', error);
    await interaction.reply({
      content: `${QUIZ_EMOJIS.INCORRECT} Something went wrong!`,
      ephemeral: true
    }).catch(() => {});
  }
}

// ═══════════════════════════════════════════════════════════════════
// MODAL SUBMISSION HANDLER
// ═══════════════════════════════════════════════════════════════════

export async function handleModalSubmit(interaction) {
  await interaction.deferReply();

  const language = interaction.fields.getTextInputValue('language');
  const code = interaction.fields.getTextInputValue('code');
  const explanation = interaction.fields.getTextInputValue('explanation') || '';

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const challenge = await DailyChallenge.findOne({
    date: {
      $gte: today,
      $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
    }
  });

  if (!challenge) {
    return interaction.editReply({
      content: `${QUIZ_EMOJIS.INCORRECT} No challenge found!`
    });
  }

  const config = CHALLENGE_CONFIG[challenge.difficulty] || CHALLENGE_CONFIG.medium;
  const startTime = Date.now();

  // Simple validation (in production, use actual code execution)
  const isValid = code.length > 10 && code.includes('function') || code.includes('def ') || code.includes('public ') || code.includes('=>');

  if (!isValid) {
    return interaction.editReply({
      content: `${QUIZ_EMOJIS.INCORRECT} Your solution doesn't appear to be valid code. Please submit a proper solution.`
    });
  }

  // Update challenge participation
  const existingParticipant = challenge.participants?.find(p => p.discordId === interaction.user.id);
  
  if (existingParticipant) {
    existingParticipant.completed = true;
    existingParticipant.code = code;
    existingParticipant.language = language;
    existingParticipant.timeTaken = Date.now() - (existingParticipant.startedAt || startTime);
    existingParticipant.completedAt = new Date();
  } else {
    challenge.participants = challenge.participants || [];
    challenge.participants.push({
      discordId: interaction.user.id,
      username: interaction.user.username,
      completed: true,
      code,
      language,
      startedAt: startTime,
      completedAt: new Date(),
      timeTaken: 0
    });
  }

  await challenge.save();

  // Award XP
  const user = await getOrCreateUser(interaction.user.id, interaction.user.username);
  if (user.addXp) {
    await user.addXp(config.xp);
  }

  // Update daily challenge streak
  user.dailyChallengeStreak = (user.dailyChallengeStreak || 0) + 1;
  if (user.dailyChallengeStreak > (user.longestDailyChallengeStreak || 0)) {
    user.longestDailyChallengeStreak = user.dailyChallengeStreak;
  }
  await user.save();

  const userRank = getRankFromXP(user.xp || 0);

  const successEmbed = new EmbedBuilder()
    .setColor(QUIZ_COLORS.SUCCESS)
    .setTitle(`${QUIZ_EMOJIS.CORRECT} Solution Accepted!`)
    .setDescription(`
${ASCII_ART.header.daily}

**Congratulations!** You've completed today's challenge!

${ASCII_ART.dividerThin}

**${challenge.title}**

\`\`\`${language.toLowerCase()}
${code.slice(0, 500)}${code.length > 500 ? '\n...' : ''}
\`\`\`

${explanation ? `**Your Explanation:**\n${explanation}\n` : ''}

${ASCII_ART.dividerThin}

${QUIZ_EMOJIS.XP} **+${config.xp} XP** earned!
${QUIZ_EMOJIS.STREAK} Daily streak: **${user.dailyChallengeStreak}** days

${ASCII_ART.dividerThin}

${userRank.emoji} Keep coding, champion!
    `)
    .setFooter({ text: '💻 MentorAI Daily Challenge' })
    .setTimestamp();

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('dailychallenge_leaderboard')
      .setLabel('View Leaderboard')
      .setEmoji('🏆')
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId('exec_quiz')
      .setLabel('Take a Quiz')
      .setEmoji('🎯')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId('help_main')
      .setLabel('Menu')
      .setEmoji('🏠')
      .setStyle(ButtonStyle.Secondary)
  );

  await interaction.editReply({ embeds: [successEmbed], components: [row] });
}

// ═══════════════════════════════════════════════════════════════════
// HELPER: CREATE SAMPLE CHALLENGE
// ═══════════════════════════════════════════════════════════════════

async function createSampleChallenge(date) {
  const challenges = [
    {
      title: 'Two Sum',
      description: 'Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to `target`.\n\nYou may assume that each input would have exactly one solution, and you may not use the same element twice.',
      difficulty: 'easy',
      exampleInput: 'nums = [2,7,11,15], target = 9',
      exampleOutput: '[0,1]',
      constraints: '• 2 <= nums.length <= 10^4\n• -10^9 <= nums[i] <= 10^9\n• Only one valid answer exists',
      hints: [
        'Think about using a hash map to store values you\'ve seen.',
        'For each number, check if target - number exists in your map.',
        'You can do this in O(n) time complexity.'
      ]
    },
    {
      title: 'Reverse String',
      description: 'Write a function that reverses a string. The input string is given as an array of characters.\n\nYou must do this by modifying the input array in-place with O(1) extra memory.',
      difficulty: 'easy',
      exampleInput: 's = ["h","e","l","l","o"]',
      exampleOutput: '["o","l","l","e","h"]',
      constraints: '• 1 <= s.length <= 10^5\n• s[i] is a printable ASCII character',
      hints: [
        'Use two pointers, one at the start and one at the end.',
        'Swap the characters and move the pointers toward the center.',
        'Stop when the pointers meet or cross.'
      ]
    },
    {
      title: 'FizzBuzz',
      description: 'Given an integer n, return a string array where:\n• answer[i] == "FizzBuzz" if i is divisible by 3 and 5\n• answer[i] == "Fizz" if i is divisible by 3\n• answer[i] == "Buzz" if i is divisible by 5\n• answer[i] == i (as string) otherwise',
      difficulty: 'easy',
      exampleInput: 'n = 15',
      exampleOutput: '["1","2","Fizz","4","Buzz","Fizz","7","8","Fizz","Buzz","11","Fizz","13","14","FizzBuzz"]',
      constraints: '• 1 <= n <= 10^4',
      hints: [
        'Use the modulo operator (%) to check divisibility.',
        'Check for divisibility by 15 first (3 and 5).',
        'Iterate from 1 to n and build your answer array.'
      ]
    }
  ];

  const randomChallenge = challenges[Math.floor(Math.random() * challenges.length)];
  
  const challenge = await DailyChallenge.create({
    date,
    ...randomChallenge,
    participants: []
  });

  return challenge;
}

export default { data, execute, handleButton, handleModalSubmit };
