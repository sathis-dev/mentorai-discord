import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle } from 'discord.js';
import DailyChallenge from '../../database/models/DailyChallenge.js';
import { User } from '../../database/models/User.js';
import { generateDailyChallenge } from '../../ai/tutorAI.js';
import { COLORS } from '../../config/colors.js';

// Difficulty settings
const DIFFICULTY_CONFIG = {
  easy: { xp: 50, icon: '🟢', time: 30 },
  medium: { xp: 100, icon: '🟡', time: 45 },
  hard: { xp: 200, icon: '🔴', time: 60 }
};

export const data = new SlashCommandBuilder()
  .setName('dailychallenge')
  .setDescription('Daily coding challenges (LeetCode-style)')
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

export async function execute(interaction) {
  const subcommand = interaction.options.getSubcommand();
  const userId = interaction.user.id;

  // Get or create today's challenge
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  let dailyChallenge = await DailyChallenge.findOne({
    date: {
      $gte: today,
      $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
    }
  });

  if (subcommand === 'today') {
    if (!dailyChallenge) {
      await interaction.deferReply();
      
      // Generate new challenge
      try {
        const challengeData = await generateDailyChallenge();
        dailyChallenge = await DailyChallenge.create({
          date: today,
          ...challengeData,
          participants: []
        });
      } catch (error) {
        console.error('Daily challenge generation error:', error);
        return interaction.editReply('❌ Failed to generate today\'s challenge. Please try again!');
      }
    }

    const diffConfig = DIFFICULTY_CONFIG[dailyChallenge.difficulty];
    const userParticipation = dailyChallenge.participants.find(p => p.discordId === userId);

    const embed = new EmbedBuilder()
      .setColor(userParticipation?.completed ? COLORS.SUCCESS : COLORS.PRIMARY)
      .setTitle(`📅 Daily Coding Challenge`)
      .setDescription(`
╔══════════════════════════════════════╗
║      ${dailyChallenge.title.toUpperCase().padStart(20).padEnd(36)}║
╚══════════════════════════════════════╝

${diffConfig.icon} **Difficulty:** ${dailyChallenge.difficulty.charAt(0).toUpperCase() + dailyChallenge.difficulty.slice(1)}
⭐ **XP Reward:** ${diffConfig.xp} XP
⏱️ **Est. Time:** ${diffConfig.time} minutes

═══════════════════════════════════════

**📋 Problem:**
${dailyChallenge.description}

**📥 Input:**
\`\`\`
${dailyChallenge.exampleInput}
\`\`\`

**📤 Expected Output:**
\`\`\`
${dailyChallenge.exampleOutput}
\`\`\`

${dailyChallenge.constraints ? `**⚠️ Constraints:**\n${dailyChallenge.constraints}\n` : ''}
      `)
      .addFields(
        { 
          name: '👥 Participants', 
          value: `${dailyChallenge.participants.length} coders`, 
          inline: true 
        },
        { 
          name: '✅ Completed', 
          value: `${dailyChallenge.participants.filter(p => p.completed).length}`, 
          inline: true 
        },
        {
          name: '🕐 Expires',
          value: `<t:${Math.floor((today.getTime() + 24 * 60 * 60 * 1000) / 1000)}:R>`,
          inline: true
        }
      );

    if (userParticipation?.completed) {
      embed.addFields({
        name: '🎉 Your Status',
        value: `✅ Completed! Earned ${diffConfig.xp} XP\nTime: ${userParticipation.timeTaken}ms`
      });
    }

    const row = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('dailychallenge_submit')
          .setLabel('📝 Submit Solution')
          .setStyle(ButtonStyle.Primary)
          .setDisabled(!!userParticipation?.completed),
        new ButtonBuilder()
          .setCustomId('dailychallenge_hint')
          .setLabel('💡 Get Hint')
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId('dailychallenge_leaderboard')
          .setLabel('🏆 Leaderboard')
          .setStyle(ButtonStyle.Secondary)
      );

    await (interaction.deferred ? interaction.editReply : interaction.reply).call(
      interaction, 
      { embeds: [embed], components: [row] }
    );

  } else if (subcommand === 'submit') {
    if (!dailyChallenge) {
      return interaction.reply({
        content: '❌ No challenge available today! Use `/dailychallenge today` first.',
        ephemeral: true
      });
    }

    const userParticipation = dailyChallenge.participants.find(p => p.discordId === userId);
    if (userParticipation?.completed) {
      return interaction.reply({
        content: '✅ You\'ve already completed today\'s challenge!',
        ephemeral: true
      });
    }

    const modal = new ModalBuilder()
      .setCustomId(`dailychallenge_solution_${dailyChallenge._id}`)
      .setTitle('Submit Your Solution');

    const codeInput = new TextInputBuilder()
      .setCustomId('code')
      .setLabel('Your Code Solution')
      .setPlaceholder('function solution(input) {\n  // Your code here\n  return result;\n}')
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(true);

    const languageInput = new TextInputBuilder()
      .setCustomId('language')
      .setLabel('Programming Language')
      .setPlaceholder('javascript, python, java, etc.')
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

    modal.addComponents(
      new ActionRowBuilder().addComponents(codeInput),
      new ActionRowBuilder().addComponents(languageInput)
    );

    await interaction.showModal(modal);

  } else if (subcommand === 'hint') {
    if (!dailyChallenge) {
      return interaction.reply({
        content: '❌ No challenge available today!',
        ephemeral: true
      });
    }

    // Track hint usage
    const hintsUsed = dailyChallenge.participants.find(p => p.discordId === userId)?.hintsUsed || 0;
    
    if (hintsUsed >= dailyChallenge.hints.length) {
      return interaction.reply({
        content: '💡 You\'ve used all available hints for this challenge!',
        ephemeral: true
      });
    }

    // Update hint usage
    await DailyChallenge.updateOne(
      { _id: dailyChallenge._id, 'participants.discordId': userId },
      { $inc: { 'participants.$.hintsUsed': 1 } }
    );

    // If user not in participants, add them
    if (!dailyChallenge.participants.find(p => p.discordId === userId)) {
      await DailyChallenge.updateOne(
        { _id: dailyChallenge._id },
        { 
          $push: { 
            participants: { 
              discordId: userId, 
              startTime: new Date(),
              hintsUsed: 1 
            } 
          } 
        }
      );
    }

    const hint = dailyChallenge.hints[hintsUsed];
    const xpPenalty = 10 * (hintsUsed + 1);

    const embed = new EmbedBuilder()
      .setColor(COLORS.WARNING)
      .setTitle(`💡 Hint ${hintsUsed + 1}/${dailyChallenge.hints.length}`)
      .setDescription(`
${hint}

⚠️ **XP Penalty:** -${xpPenalty} XP for using this hint
      `)
      .setFooter({ text: `Hints remaining: ${dailyChallenge.hints.length - hintsUsed - 1}` });

    await interaction.reply({ embeds: [embed], ephemeral: true });

  } else if (subcommand === 'leaderboard') {
    if (!dailyChallenge) {
      return interaction.reply({
        content: '❌ No challenge available today!',
        ephemeral: true
      });
    }

    const completed = dailyChallenge.participants
      .filter(p => p.completed)
      .sort((a, b) => a.timeTaken - b.timeTaken)
      .slice(0, 10);

    if (completed.length === 0) {
      return interaction.reply({
        content: '🏆 No one has completed today\'s challenge yet! Be the first!',
        ephemeral: true
      });
    }

    const leaderboard = await Promise.all(
      completed.map(async (p, i) => {
        try {
          const user = await interaction.client.users.fetch(p.discordId);
          const medal = ['🥇', '🥈', '🥉'][i] || `**${i + 1}.**`;
          const time = formatTime(p.timeTaken);
          return `${medal} ${user.username} - ${time}`;
        } catch {
          return null;
        }
      })
    );

    const embed = new EmbedBuilder()
      .setColor(COLORS.PRIMARY)
      .setTitle('🏆 Today\'s Challenge Leaderboard')
      .setDescription(`
**${dailyChallenge.title}**

${leaderboard.filter(Boolean).join('\n')}

Fastest solutions win! 🚀
      `)
      .setFooter({ text: `${completed.length} completions` });

    await interaction.reply({ embeds: [embed] });

  } else if (subcommand === 'streak') {
    const user = await User.findOne({ discordId: userId });
    const challengeStreak = user?.dailyChallengeStreak || 0;
    const totalCompleted = user?.stats?.challengesCompleted || 0;

    const embed = new EmbedBuilder()
      .setColor(COLORS.PRIMARY)
      .setTitle('🔥 Daily Challenge Streak')
      .setDescription(`
**Current Streak:** ${challengeStreak} days 🔥
**Total Completed:** ${totalCompleted} challenges

${getStreakMotivation(challengeStreak)}

${createStreakCalendar(challengeStreak)}
      `)
      .setFooter({ text: 'Complete today\'s challenge to continue your streak!' });

    await interaction.reply({ embeds: [embed] });
  }
}

function formatTime(ms) {
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  const minutes = Math.floor(ms / 60000);
  const seconds = ((ms % 60000) / 1000).toFixed(0);
  return `${minutes}m ${seconds}s`;
}

function getStreakMotivation(streak) {
  if (streak === 0) return '💪 Start your streak today!';
  if (streak < 3) return '🌱 Great start! Keep it going!';
  if (streak < 7) return '🔥 You\'re on fire!';
  if (streak < 14) return '⭐ Amazing dedication!';
  if (streak < 30) return '🏆 Coding champion!';
  if (streak < 100) return '💎 Legendary consistency!';
  return '👑 You are unstoppable!';
}

function createStreakCalendar(streak) {
  const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  const today = new Date().getDay();
  
  let calendar = '```\n';
  calendar += days.join(' ') + '\n';
  
  // Show last 7 days
  for (let i = 6; i >= 0; i--) {
    const dayIndex = (today - i + 7) % 7;
    const isCompleted = i < streak;
    calendar += (isCompleted ? '✓' : '○') + ' ';
  }
  
  calendar += '\n```';
  return calendar;
}
