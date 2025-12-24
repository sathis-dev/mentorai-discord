import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { EMBED_COLORS } from '../../config/colors.js';
import { TeamChallenge } from '../../database/models/TeamChallenge.js';
import { generateQuiz } from '../../ai/index.js';
import { User } from '../../database/models/User.js';

export const data = new SlashCommandBuilder()
  .setName('challenge')
  .setDescription('🏆 Create team challenges and compete!')
  .addSubcommand(subcommand =>
    subcommand
      .setName('create')
      .setDescription('Create a new team challenge')
      .addStringOption(option =>
        option
          .setName('subject')
          .setDescription('Challenge topic')
          .setRequired(true)
          .addChoices(
            { name: 'Python', value: 'python' },
            { name: 'JavaScript', value: 'javascript' },
            { name: 'Web Development', value: 'web-dev' },
            { name: 'Data Science', value: 'data-science' },
            { name: 'Algorithms', value: 'algorithms' }
          )
      )
      .addStringOption(option =>
        option
          .setName('difficulty')
          .setDescription('Challenge difficulty')
          .setRequired(true)
          .addChoices(
            { name: '🟢 Easy', value: 'easy' },
            { name: '🟡 Medium', value: 'medium' },
            { name: '🔴 Hard', value: 'hard' }
          )
      )
      .addIntegerOption(option =>
        option
          .setName('duration')
          .setDescription('Duration in minutes')
          .setRequired(false)
          .setMinValue(5)
          .setMaxValue(60)
      )
  )
  .addSubcommand(subcommand =>
    subcommand
      .setName('join')
      .setDescription('Join an active challenge')
      .addStringOption(option =>
        option
          .setName('team')
          .setDescription('Team name to join or create')
          .setRequired(true)
      )
  )
  .addSubcommand(subcommand =>
    subcommand
      .setName('start')
      .setDescription('Start the challenge (creator only)')
  )
  .addSubcommand(subcommand =>
    subcommand
      .setName('leaderboard')
      .setDescription('View active challenge leaderboard')
  );

export async function execute(interaction) {
  const subcommand = interaction.options.getSubcommand();

  if (subcommand === 'create') {
    return await createChallenge(interaction);
  } else if (subcommand === 'join') {
    return await joinChallenge(interaction);
  } else if (subcommand === 'start') {
    return await startChallenge(interaction);
  } else if (subcommand === 'leaderboard') {
    return await showLeaderboard(interaction);
  }
}

async function createChallenge(interaction) {
  await interaction.deferReply();

  const subject = interaction.options.getString('subject');
  const difficulty = interaction.options.getString('difficulty');
  const duration = interaction.options.getInteger('duration') || 30;

  const activeChallenge = await TeamChallenge.findOne({
    guildId: interaction.guild.id,
    status: { $in: ['waiting', 'active'] }
  });

  if (activeChallenge) {
    return await interaction.editReply({
      content: '⚠️ There\'s already an active challenge in this server! Use `/challenge join` to participate.',
      ephemeral: true
    });
  }

  const questionCount = difficulty === 'easy' ? 5 : difficulty === 'medium' ? 8 : 12;
  const quiz = await generateQuiz(subject, difficulty, questionCount);

  const challenge = new TeamChallenge({
    guildId: interaction.guild.id,
    channelId: interaction.channel.id,
    name: `${subject.toUpperCase()} ${difficulty.toUpperCase()} Challenge`,
    description: `Team quiz challenge - ${questionCount} questions`,
    subject,
    difficulty,
    duration,
    questions: quiz.questions || [],
    xpReward: difficulty === 'easy' ? 150 : difficulty === 'medium' ? 250 : 400,
    createdBy: interaction.user.id
  });

  await challenge.save();

  const embed = new EmbedBuilder()
    .setColor(EMBED_COLORS.quiz)
    .setTitle('🏆 Team Challenge Created!')
    .setDescription(`**${challenge.name}**\n\n${challenge.description}`)
    .addFields(
      { name: '📚 Subject', value: subject.toUpperCase(), inline: true },
      { name: '⏱️ Duration', value: `${duration} minutes`, inline: true },
      { name: '🎯 XP Reward', value: `+${challenge.xpReward} XP per winner`, inline: true },
      { name: '❓ Questions', value: `${questionCount} questions`, inline: true },
      { name: '👥 Teams', value: '0/4 teams joined', inline: true },
      { name: '📊 Difficulty', value: difficulty.toUpperCase(), inline: true }
    )
    .setFooter({ text: 'Use /challenge join <team-name> to participate!' });

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('challenge_quick_join')
      .setLabel('Quick Join')
      .setStyle(ButtonStyle.Success)
      .setEmoji('⚡'),
    new ButtonBuilder()
      .setCustomId('challenge_start')
      .setLabel('Start Challenge')
      .setStyle(ButtonStyle.Primary)
      .setEmoji('🚀')
      .setDisabled(true)
  );

  await interaction.editReply({ embeds: [embed], components: [row] });
}

async function joinChallenge(interaction) {
  const teamName = interaction.options.getString('team');

  const challenge = await TeamChallenge.findOne({
    guildId: interaction.guild.id,
    status: 'waiting'
  });

  if (!challenge) {
    return await interaction.reply({
      content: '⚠️ No active challenge to join! Use `/challenge create` to start one.',
      ephemeral: true
    });
  }

  const alreadyJoined = challenge.teams.some(team => 
    team.members.includes(interaction.user.id)
  );

  if (alreadyJoined) {
    return await interaction.reply({
      content: '⚠️ You\'ve already joined a team!',
      ephemeral: true
    });
  }

  let team = challenge.teams.find(t => t.name === teamName);
  
  if (!team) {
    const result = challenge.addTeam(teamName, [interaction.user.id]);
    if (!result.success) {
      return await interaction.reply({
        content: `⚠️ ${result.message}`,
        ephemeral: true
      });
    }
    team = challenge.teams[result.teamIndex];
  } else {
    if (team.members.length >= 4) {
      return await interaction.reply({
        content: '⚠️ This team is full! Try another team name.',
        ephemeral: true
      });
    }
    team.members.push(interaction.user.id);
  }

  await challenge.save();

  const embed = new EmbedBuilder()
    .setColor(EMBED_COLORS.success)
    .setTitle('✅ Joined Team Challenge!')
    .setDescription(`**${interaction.user.username}** joined team **${teamName}**!`)
    .addFields(
      { name: '👥 Team Members', value: team.members.map(id => `<@${id}>`).join('\n'), inline: false },
      { name: '📊 Current Teams', value: `${challenge.teams.length}/4 teams`, inline: true },
      { name: '🎯 Challenge', value: challenge.name, inline: true }
    )
    .setFooter({ text: 'Waiting for challenge to start...' });

  await interaction.reply({ embeds: [embed] });
}

async function startChallenge(interaction) {
  const challenge = await TeamChallenge.findOne({
    guildId: interaction.guild.id,
    status: 'waiting'
  });

  if (!challenge) {
    return await interaction.reply({
      content: '⚠️ No challenge waiting to start!',
      ephemeral: true
    });
  }

  if (challenge.createdBy !== interaction.user.id) {
    return await interaction.reply({
      content: '⚠️ Only the challenge creator can start it!',
      ephemeral: true
    });
  }

  if (challenge.teams.length < 2) {
    return await interaction.reply({
      content: '⚠️ Need at least 2 teams to start!',
      ephemeral: true
    });
  }

  challenge.status = 'active';
  challenge.startTime = new Date();
  await challenge.save();

  const embed = new EmbedBuilder()
    .setColor(EMBED_COLORS.warning)
    .setTitle('🚀 Challenge Started!')
    .setDescription(`**${challenge.name}** is now LIVE!\n\n**Rules:**\n• First team to answer gets the points\n• Wrong answers = no penalty\n• Collaboration encouraged!\n• Have fun! 🎉`)
    .addFields(
      { name: '⏱️ Duration', value: `${challenge.duration} minutes`, inline: true },
      { name: '❓ Questions', value: `${challenge.questions.length}`, inline: true },
      { name: '👥 Teams', value: challenge.teams.map(t => `**${t.name}** (${t.members.length})`).join('\n'), inline: false }
    )
    .setFooter({ text: 'First question coming up!' });

  await interaction.reply({ embeds: [embed] });

  setTimeout(() => sendFirstQuestion(interaction, challenge), 3000);
}

async function sendFirstQuestion(interaction, challenge) {
  if (challenge.questions.length === 0) return;

  const question = challenge.questions[0];
  const embed = new EmbedBuilder()
    .setColor(EMBED_COLORS.quiz)
    .setTitle(`Question 1/${challenge.questions.length}`)
    .setDescription(`**${question.question}**\n\n${question.options.map((opt, i) => `${String.fromCharCode(65 + i)}. ${opt}`).join('\n')}`)
    .addFields({
      name: '🎯 Points',
      value: `${question.points} points`,
      inline: true
    })
    .setFooter({ text: 'First correct answer wins!' });

  const row = new ActionRowBuilder().addComponents(
    question.options.slice(0, 4).map((_, i) =>
      new ButtonBuilder()
        .setCustomId(`challenge_answer_${challenge._id}_0_${i}`)
        .setLabel(String.fromCharCode(65 + i))
        .setStyle(ButtonStyle.Secondary)
    )
  );

  await interaction.channel.send({ embeds: [embed], components: [row] });
}

async function showLeaderboard(interaction) {
  const challenge = await TeamChallenge.findOne({
    guildId: interaction.guild.id,
    status: 'active'
  });

  if (!challenge) {
    return await interaction.reply({
      content: '⚠️ No active challenge right now!',
      ephemeral: true
    });
  }

  const sortedTeams = [...challenge.teams].sort((a, b) => b.score - a.score);

  const embed = new EmbedBuilder()
    .setColor(EMBED_COLORS.quiz)
    .setTitle('🏆 Challenge Leaderboard')
    .setDescription(`**${challenge.name}**\n\n**Current Standings:**`);

  sortedTeams.forEach((team, i) => {
    const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`;
    embed.addFields({
      name: `${medal} ${team.name}`,
      value: `**${team.score} points** • ${team.members.length} members • ${team.progress}% progress`,
      inline: false
    });
  });

  embed.setFooter({ text: `Questions: ${challenge.questions.length} | Duration: ${challenge.duration}min` });

  await interaction.reply({ embeds: [embed] });
}

export default { data, execute };
