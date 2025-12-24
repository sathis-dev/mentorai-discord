import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { getAllCurriculums, getCurriculumBySubject } from '../../data/curriculums/index.js';
import { EMBED_COLORS } from '../../config/colors.js';
import { LearningPath, UserPathProgress } from '../../database/models/LearningPath.js';
import { User } from '../../database/models/User.js';

export const data = new SlashCommandBuilder()
  .setName('path')
  .setDescription('📚 View and start structured learning paths')
  .addSubcommand(subcommand =>
    subcommand
      .setName('browse')
      .setDescription('Browse all available learning paths')
  )
  .addSubcommand(subcommand =>
    subcommand
      .setName('start')
      .setDescription('Start a learning path')
      .addStringOption(option =>
        option
          .setName('subject')
          .setDescription('Choose a subject to learn')
          .setRequired(true)
          .addChoices(
            { name: '🐍 Python - Complete Mastery', value: 'python' },
            { name: '⚡ JavaScript - Modern JS & React', value: 'javascript' },
            { name: '🌐 Web Development - Full Stack', value: 'web-development' },
            { name: '📊 Data Science - Python Analytics', value: 'data-science' },
            { name: '🤖 Machine Learning - AI Basics', value: 'machine-learning' },
            { name: '🎮 Game Development - Pygame', value: 'game-development' },
            { name: '🔒 Cybersecurity - Ethical Hacking', value: 'cybersecurity' },
            { name: '📚 Git & GitHub - Version Control', value: 'git-github' },
            { name: '💾 SQL - Database Mastery', value: 'sql-databases' },
            { name: '🧮 Algorithms - Data Structures', value: 'algorithms' }
          )
      )
  )
  .addSubcommand(subcommand =>
    subcommand
      .setName('continue')
      .setDescription('Continue your current learning path')
  )
  .addSubcommand(subcommand =>
    subcommand
      .setName('progress')
      .setDescription('View your progress on a learning path')
      .addStringOption(option =>
        option
          .setName('subject')
          .setDescription('Subject to view progress for')
          .setRequired(false)
      )
  );

export async function execute(interaction) {
  const subcommand = interaction.options.getSubcommand();

  if (subcommand === 'browse') {
    return await browsePaths(interaction);
  } else if (subcommand === 'start') {
    return await startPath(interaction);
  } else if (subcommand === 'continue') {
    return await continuePath(interaction);
  } else if (subcommand === 'progress') {
    return await viewPathProgress(interaction);
  }
}

async function browsePaths(interaction) {
  const curriculums = getAllCurriculums();
  
  const embed = new EmbedBuilder()
    .setColor(EMBED_COLORS.lesson)
    .setTitle('📚 Available Learning Paths')
    .setDescription('Choose a structured curriculum and master a skill step-by-step!\n\n**Each path includes:**\n✅ Structured lessons with prerequisites\n✅ Hands-on projects\n✅ Quizzes to test knowledge\n✅ Progress tracking\n✅ XP rewards & achievements')
    .setFooter({ text: 'Use /path start <subject> to begin!' });

  curriculums.slice(0, 10).forEach(curr => {
    const difficultyEmoji = curr.difficulty === 'beginner' ? '🟢' : curr.difficulty === 'intermediate' ? '🟡' : '🔴';
    embed.addFields({
      name: `${curr.icon} ${curr.title}`,
      value: `${curr.description}\n${difficultyEmoji} ${curr.difficulty.toUpperCase()} • ${curr.totalLessons} lessons • ${curr.estimatedHours}h`,
      inline: false
    });
  });

  await interaction.reply({ embeds: [embed], ephemeral: false });
}

async function startPath(interaction) {
  const subject = interaction.options.getString('subject');
  const curriculum = getCurriculumBySubject(subject);
  
  if (!curriculum || !curriculum.lessons || curriculum.lessons.length === 0) {
    return await interaction.reply({
      content: '⚠️ This learning path is coming soon! Try **Python** or **JavaScript** for now.',
      ephemeral: true
    });
  }

  const user = await User.findOne({
    userId: interaction.user.id,
    guildId: interaction.guild.id
  });

  const progress = await UserPathProgress.findOneAndUpdate(
    {
      userId: interaction.user.id,
      guildId: interaction.guild.id,
      subject: subject
    },
    {
      $setOnInsert: {
        currentLesson: 0,
        completedLessons: [],
        startedAt: new Date(),
        lastAccessedAt: new Date(),
        completionPercentage: 0
      }
    },
    { upsert: true, new: true }
  );

  const firstLesson = curriculum.lessons[0];
  
  const embed = new EmbedBuilder()
    .setColor(EMBED_COLORS.success)
    .setTitle(`${curriculum.icon} ${curriculum.title}`)
    .setDescription(`**You've started this learning path!**\n\n${curriculum.description}\n\n**📋 Path Overview:**\n• ${curriculum.totalLessons} lessons\n• ~${curriculum.estimatedHours} hours total\n• Level: ${curriculum.difficulty}`)
    .addFields(
      {
        name: '📖 First Lesson',
        value: `**${firstLesson.title}**\n${firstLesson.description}\n⏱️ ${firstLesson.estimatedMinutes} min • 🎯 +${firstLesson.xpReward} XP`,
        inline: false
      },
      {
        name: '🎮 How It Works',
        value: '1️⃣ Complete lessons in order\n2️⃣ Take quizzes to test knowledge\n3️⃣ Unlock new lessons as you progress\n4️⃣ Earn XP and level up!',
        inline: false
      }
    )
    .setFooter({ text: 'Use /path continue to start learning!' });

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`start_lesson_${subject}_${firstLesson.id}`)
      .setLabel('Start First Lesson')
      .setStyle(ButtonStyle.Success)
      .setEmoji('📖'),
    new ButtonBuilder()
      .setCustomId(`view_path_${subject}`)
      .setLabel('View Full Path')
      .setStyle(ButtonStyle.Primary)
      .setEmoji('🗺️')
  );

  await interaction.reply({ embeds: [embed], components: [row] });
}

async function continuePath(interaction) {
  const activePaths = await UserPathProgress.find({
    userId: interaction.user.id,
    guildId: interaction.guild.id
  }).sort({ lastAccessedAt: -1 });

  if (activePaths.length === 0) {
    return await interaction.reply({
      content: '📚 You haven\'t started any learning paths yet! Use `/path browse` to see available paths.',
      ephemeral: true
    });
  }

  const mostRecent = activePaths[0];
  const curriculum = getCurriculumBySubject(mostRecent.subject);
  
  if (!curriculum) {
    return await interaction.reply({
      content: '⚠️ Could not find that learning path.',
      ephemeral: true
    });
  }

  const nextLesson = curriculum.lessons.find(
    lesson => !mostRecent.completedLessons.includes(lesson.id)
  );

  if (!nextLesson) {
    return await interaction.reply({
      content: `🎉 Congratulations! You've completed the **${curriculum.title}** path!`,
      ephemeral: false
    });
  }

  const progressPercent = Math.round(
    (mostRecent.completedLessons.length / curriculum.totalLessons) * 100
  );

  const embed = new EmbedBuilder()
    .setColor(EMBED_COLORS.lesson)
    .setTitle(`${curriculum.icon} Continue: ${curriculum.title}`)
    .setDescription(`**Next Lesson:**\n${nextLesson.title}\n\n${nextLesson.description}`)
    .addFields(
      {
        name: '📊 Your Progress',
        value: `${mostRecent.completedLessons.length}/${curriculum.totalLessons} lessons (${progressPercent}%)`,
        inline: true
      },
      {
        name: '⏱️ Estimated Time',
        value: `${nextLesson.estimatedMinutes} minutes`,
        inline: true
      },
      {
        name: '🎯 XP Reward',
        value: `+${nextLesson.xpReward} XP`,
        inline: true
      }
    )
    .setFooter({ text: `Lesson ${mostRecent.completedLessons.length + 1}/${curriculum.totalLessons}` });

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`start_lesson_${mostRecent.subject}_${nextLesson.id}`)
      .setLabel('Start Lesson')
      .setStyle(ButtonStyle.Success)
      .setEmoji('🚀')
  );

  await interaction.reply({ embeds: [embed], components: [row] });
}

async function viewPathProgress(interaction) {
  const subject = interaction.options.getString('subject');
  
  const query = {
    userId: interaction.user.id,
    guildId: interaction.guild.id
  };
  
  if (subject) {
    query.subject = subject;
  }

  const paths = await UserPathProgress.find(query).sort({ lastAccessedAt: -1 });

  if (paths.length === 0) {
    return await interaction.reply({
      content: '📚 You haven\'t started any learning paths yet!',
      ephemeral: true
    });
  }

  const embed = new EmbedBuilder()
    .setColor(EMBED_COLORS.progress)
    .setTitle('📊 Your Learning Path Progress')
    .setDescription('Here\'s your progress on all active learning paths:');

  paths.slice(0, 5).forEach(path => {
    const curriculum = getCurriculumBySubject(path.subject);
    if (!curriculum) return;

    const percent = Math.round((path.completedLessons.length / curriculum.totalLessons) * 100);
    const progressBar = createProgressBar(percent, 10);

    embed.addFields({
      name: `${curriculum.icon} ${curriculum.title}`,
      value: `${progressBar} ${percent}%\n${path.completedLessons.length}/${curriculum.totalLessons} lessons completed`,
      inline: false
    });
  });

  embed.setFooter({ text: 'Use /path continue to keep learning!' });

  await interaction.reply({ embeds: [embed], ephemeral: false });
}

function createProgressBar(percentage, length = 10) {
  const filled = Math.round((percentage / 100) * length);
  const empty = length - filled;
  return '█'.repeat(filled) + '░'.repeat(empty);
}

export default { data, execute };
