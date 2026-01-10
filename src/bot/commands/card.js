import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { User } from '../../database/models/User.js';

export const data = new SlashCommandBuilder()
  .setName('card')
  .setDescription('🎴 View your trading card profile')
  .addUserOption(opt =>
    opt.setName('user')
      .setDescription('View another user\'s card')
      .setRequired(false)
  )
  .addStringOption(opt =>
    opt.setName('style')
      .setDescription('Card style')
      .addChoices(
        { name: '🌟 Holographic', value: 'holo' },
        { name: '🔥 Fire', value: 'fire' },
        { name: '❄️ Ice', value: 'ice' },
        { name: '⚡ Electric', value: 'electric' },
        { name: '🌙 Dark', value: 'dark' }
      ));

export async function execute(interaction) {
  const targetUser = interaction.options.getUser('user') || interaction.user;
  const style = interaction.options.getString('style') || 'holo';
  
  const user = await User.findOne({ discordId: targetUser.id });
  
  if (!user) {
    return interaction.reply({
      content: targetUser.id === interaction.user.id 
        ? '❌ You haven\'t started learning yet! Use `/learn` or `/quiz` to begin.'
        : `❌ ${targetUser.username} hasn't started learning yet!`,
      ephemeral: true
    });
  }
  
  // Calculate stats
  const level = user.level || 1;
  const xp = user.xp || 0;
  const streak = user.streak || 0;
  const quizzes = user.quizzesTaken || 0;
  const accuracy = user.totalQuestions > 0 
    ? Math.round((user.correctAnswers / user.totalQuestions) * 100) 
    : 0;
  const achievements = user.achievements?.length || 0;
  const lessons = user.completedLessons?.length || 0;
  const prestige = user.prestige || 0;
  
  // Get rank info
  const rank = getRank(level);
  const rarity = getRarity(level, xp, achievements);
  const tier = getTier(xp);
  
  // Calculate XP progress
  const xpForNext = calculateXPForLevel(level + 1);
  const xpForCurrent = calculateXPForLevel(level);
  const xpProgress = xp - xpForCurrent;
  const xpNeeded = xpForNext - xpForCurrent;
  const progressPercent = Math.min(Math.round((xpProgress / xpNeeded) * 100), 100);
  
  // Build progress bar
  const progressBar = buildProgressBar(progressPercent);
  
  // Style colors
  const styleColors = {
    holo: 0x667eea,
    fire: 0xf12711,
    ice: 0x4facfe,
    electric: 0xf7971e,
    dark: 0x2f3136
  };
  
  // Style emojis for border effect
  const styleEmojis = {
    holo: '✨',
    fire: '🔥',
    ice: '❄️',
    electric: '⚡',
    dark: '🌙'
  };
  
  const embed = new EmbedBuilder()
    .setColor(styleColors[style])
    .setAuthor({
      name: `${styleEmojis[style]} Trading Card • ${style.toUpperCase()}`,
      iconURL: targetUser.displayAvatarURL()
    })
    .setTitle(`${rarity.emoji} ${targetUser.username}`)
    .setThumbnail(targetUser.displayAvatarURL({ size: 256 }))
    .setDescription(`
${tier.emoji} **${tier.name}** ${tier.emoji}
${rank.emoji} ${rank.name} • Level ${level}

━━━━━━━━━━━━━━━━━━━━━━━━━━
`)
    .addFields(
      {
        name: '📊 Progress',
        value: `${progressBar}\n\`${xp.toLocaleString()} / ${xpForNext.toLocaleString()} XP\``,
        inline: false
      },
      {
        name: '⚡ Total XP',
        value: `\`${xp.toLocaleString()}\``,
        inline: true
      },
      {
        name: '🔥 Streak',
        value: `\`${streak} days\``,
        inline: true
      },
      {
        name: '📈 Level',
        value: `\`${level}\``,
        inline: true
      },
      {
        name: '🎯 Quizzes',
        value: `\`${quizzes}\``,
        inline: true
      },
      {
        name: '✅ Accuracy',
        value: `\`${accuracy}%\``,
        inline: true
      },
      {
        name: '📚 Lessons',
        value: `\`${lessons}\``,
        inline: true
      },
      {
        name: '🏆 Achievements',
        value: `\`${achievements}/40\``,
        inline: true
      },
      {
        name: '⭐ Prestige',
        value: `\`${prestige}\``,
        inline: true
      },
      {
        name: '💎 Rarity',
        value: `\`${rarity.name}\``,
        inline: true
      }
    )
    .setFooter({
      text: `${styleEmojis[style]} Style: ${style.toUpperCase()} • Share with friends!`,
      iconURL: interaction.client.user.displayAvatarURL()
    })
    .setTimestamp();

  // Share button
  const row = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId(`card_refresh_${targetUser.id}_${style}`)
        .setLabel('Refresh')
        .setEmoji('🔄')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setLabel('View on Website')
        .setEmoji('🌐')
        .setStyle(ButtonStyle.Link)
        .setURL(buildWebsiteURL(targetUser, user))
    );

  await interaction.reply({ embeds: [embed], components: [row] });
}

function buildProgressBar(percent) {
  const filled = Math.round(percent / 10);
  const empty = 10 - filled;
  return '`' + '█'.repeat(filled) + '░'.repeat(empty) + '` ' + percent + '%';
}

function getRank(level) {
  const ranks = [
    { min: 1, name: 'Novice', emoji: '🌱' },
    { min: 5, name: 'Learner', emoji: '📖' },
    { min: 10, name: 'Apprentice', emoji: '🎓' },
    { min: 20, name: 'Developer', emoji: '💻' },
    { min: 30, name: 'Pro Coder', emoji: '🔥' },
    { min: 40, name: 'Expert', emoji: '💎' },
    { min: 50, name: 'Master', emoji: '🏆' },
    { min: 75, name: 'Grandmaster', emoji: '⚡' },
    { min: 100, name: 'Legend', emoji: '👑' }
  ];
  
  for (let i = ranks.length - 1; i >= 0; i--) {
    if (level >= ranks[i].min) return ranks[i];
  }
  return ranks[0];
}

function getTier(xp) {
  const tiers = [
    { min: 0, name: 'Bronze', emoji: '🥉' },
    { min: 1000, name: 'Silver', emoji: '🥈' },
    { min: 5000, name: 'Gold', emoji: '🥇' },
    { min: 15000, name: 'Platinum', emoji: '💠' },
    { min: 50000, name: 'Diamond', emoji: '💎' },
    { min: 100000, name: 'Master', emoji: '👑' }
  ];
  
  for (let i = tiers.length - 1; i >= 0; i--) {
    if (xp >= tiers[i].min) return tiers[i];
  }
  return tiers[0];
}

function getRarity(level, xp, achievements) {
  const score = level + achievements * 2 + Math.floor(xp / 1000);
  
  if (score >= 100) return { name: 'Legendary', emoji: '🌟' };
  if (score >= 50) return { name: 'Epic', emoji: '💜' };
  if (score >= 25) return { name: 'Rare', emoji: '💙' };
  if (score >= 10) return { name: 'Uncommon', emoji: '💚' };
  return { name: 'Common', emoji: '⬜' };
}

function calculateXPForLevel(level) {
  return Math.floor(100 * Math.pow(level, 1.5));
}

function buildWebsiteURL(discordUser, user) {
  const params = new URLSearchParams({
    user: discordUser.id,
    avatar: discordUser.avatar || '',
    name: discordUser.username,
    xp: (user.xp || 0).toString(),
    level: (user.level || 1).toString(),
    streak: (user.streak || 0).toString(),
    quizzes: (user.quizzesTaken || 0).toString(),
    accuracy: user.totalQuestions > 0 
      ? Math.round((user.correctAnswers / user.totalQuestions) * 100).toString()
      : '0',
    lessons: (user.completedLessons?.length || 0).toString(),
    achievements: (user.achievements?.length || 0).toString(),
    prestige: (user.prestige || 0).toString()
  });
  return `https://mentorai.up.railway.app/?${params.toString()}`;
}
