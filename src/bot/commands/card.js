import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { User } from '../../database/models/User.js';
import { TierSystem } from '../../core/tierSystem.js';
import { xpForLevel } from '../../config/brandSystem.js';

export const data = new SlashCommandBuilder()
  .setName('card')
  .setDescription('🎴 View your Pro Max trading card')
  .addUserOption(opt =>
    opt.setName('user')
      .setDescription('View another user\'s card')
      .setRequired(false)
  );

export async function execute(interaction) {
  const targetUser = interaction.options.getUser('user') || interaction.user;
  
  const user = await User.findOne({ discordId: targetUser.id });
  
  if (!user) {
    return interaction.reply({
      content: targetUser.id === interaction.user.id 
        ? '❌ You haven\'t started learning yet! Use `/learn` or `/quiz` to begin.'
        : `❌ ${targetUser.username} hasn't started learning yet!`,
      ephemeral: true
    });
  }
  
  // ═══════════════════════════════════════════════════════════════════
  // 📊 EXTRACT USER DATA (Atomic read - no modifications)
  // ═══════════════════════════════════════════════════════════════════
  const level = user.level || 1;
  const xp = user.xp || 0;
  const streak = user.streak || 0;
  const quizzes = user.quizzesTaken || 0;
  const accuracy = user.totalQuestions > 0 
    ? Math.round((user.correctAnswers / user.totalQuestions) * 100) 
    : 0;
  const achievements = user.achievements?.length || 0;
  const lessons = user.completedLessons?.length || 0;
  const prestigeLevel = user.prestige?.level || 0;
  const prestigeMultiplier = user.prestige?.bonusMultiplier || 1.0;
  const lifetimeXP = user.prestige?.totalXpEarned || xp;
  
  // ═══════════════════════════════════════════════════════════════════
  // 🎴 PRO MAX THEME ENGINE
  // ═══════════════════════════════════════════════════════════════════
  const theme = TierSystem.getProMaxTheme(user);
  const multiplierBox = TierSystem.buildMultiplierBox(streak, prestigeLevel, prestigeMultiplier);
  const rank = getRank(level);
  const rarity = getRarity(level, lifetimeXP, achievements);
  
  // ═══════════════════════════════════════════════════════════════════
  // 📈 PRECISION PROGRESS BAR (xp / xpForLevel formula)
  // ═══════════════════════════════════════════════════════════════════
  const xpNeeded = xpForLevel(level);
  const progressPercent = Math.min(Math.round((xp / Math.max(xpNeeded, 1)) * 100), 100);
  const progressBar = buildProMaxProgressBar(progressPercent, theme.tier);
  
  // ═══════════════════════════════════════════════════════════════════
  // 🌟 BUILD PRO MAX CARD EMBED
  // ═══════════════════════════════════════════════════════════════════
  const embed = new EmbedBuilder()
    .setColor(theme.embedColor)
    .setAuthor({
      name: `${theme.tier.badge} ${theme.tier.name.toUpperCase()} TIER`,
      iconURL: targetUser.displayAvatarURL()
    })
    .setTitle(`${theme.aura.emoji || rarity.emoji} ${targetUser.username} ${theme.aura.emoji || ''}`.trim())
    .setThumbnail(targetUser.displayAvatarURL({ size: 512 }))
    .setDescription(`
${theme.border}
${rank.emoji} **${rank.name}** • Level ${level}${prestigeLevel > 0 ? ` • ⭐ P${prestigeLevel}` : ''}
${theme.border}

**╭─────── XP PROGRESS ───────╮**
${progressBar}
\`${xp.toLocaleString()} / ${xpNeeded.toLocaleString()} XP\` to Level ${level + 1}
**╰───────────────────────────╯**
`)
    .addFields(
      {
        name: '💫 ACTIVE MULTIPLIERS',
        value: multiplierBox.formatted,
        inline: false
      },
      {
        name: '⚡ Lifetime XP',
        value: `\`${lifetimeXP.toLocaleString()}\``,
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
        value: prestigeLevel > 0 ? `\`P${prestigeLevel}\` ${theme.aura.name}` : '`P0`',
        inline: true
      },
      {
        name: '💎 Rarity',
        value: `\`${rarity.name}\``,
        inline: true
      }
    )
    .setFooter({
      text: theme.footerText,
      iconURL: interaction.client.user.displayAvatarURL()
    })
    .setTimestamp();

  // ═══════════════════════════════════════════════════════════════════
  // 🔘 ACTION BUTTONS
  // ═══════════════════════════════════════════════════════════════════
  const row = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId(`card_refresh_${targetUser.id}`)
        .setLabel('Refresh')
        .setEmoji('🔄')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId(`card_share_${targetUser.id}`)
        .setLabel('Share')
        .setEmoji('📤')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setLabel('View on Website')
        .setEmoji('🌐')
        .setStyle(ButtonStyle.Link)
        .setURL(buildWebsiteURL(targetUser, user, theme))
    );

  await interaction.reply({ embeds: [embed], components: [row] });
}

// ═══════════════════════════════════════════════════════════════════
// 🎨 PRO MAX VISUAL HELPERS
// ═══════════════════════════════════════════════════════════════════

/**
 * Build tier-themed progress bar with gradient effect
 */
function buildProMaxProgressBar(percent, tier) {
  const length = 20;
  const filled = Math.round((percent / 100) * length);
  const empty = length - filled;
  
  // Tier-based fill characters
  let fillChar = '█';
  let emptyChar = '░';
  
  if (tier.cardStyle === 'legendary') {
    fillChar = '▓';
  } else if (tier.cardStyle === 'elite') {
    fillChar = '▓';
  }
  
  const bar = fillChar.repeat(filled) + emptyChar.repeat(empty);
  return `\`${bar}\` **${percent}%**`;
}

/**
 * Get rank based on level
 */
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

/**
 * Calculate rarity based on lifetime XP and achievements
 */
function getRarity(level, lifetimeXP, achievements) {
  // Score based on lifetime XP (more weight) + achievements
  const score = Math.floor(lifetimeXP / 500) + achievements * 3 + level;
  
  if (score >= 250) return { name: 'Legendary', emoji: '🌟' };
  if (score >= 100) return { name: 'Epic', emoji: '💜' };
  if (score >= 50) return { name: 'Rare', emoji: '💙' };
  if (score >= 20) return { name: 'Uncommon', emoji: '💚' };
  return { name: 'Common', emoji: '⬜' };
}

/**
 * Build website URL with full Pro Max data
 */
function buildWebsiteURL(discordUser, user, theme) {
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
    prestige: (user.prestige?.level || 0).toString(),
    lifetimeXP: (user.prestige?.totalXpEarned || user.xp || 0).toString(),
    tier: theme?.tier?.name || 'Bronze',
    multiplier: (theme?.multiplierBox?.totalMultiplier || 1).toString()
  });
  return `https://mentorai.up.railway.app/?${params.toString()}`;
}

// ═══════════════════════════════════════════════════════════════════
// 🔘 BUTTON INTERACTION HANDLER
// ═══════════════════════════════════════════════════════════════════

export async function handleCardButton(interaction, action, userId) {
  // Validate userId before any operations
  if (!userId || userId === 'null' || userId === 'undefined') {
    console.error('Card button handler received invalid userId:', userId);
    return interaction.reply({ 
      content: '❌ Invalid user ID. Please use `/card` command again.', 
      ephemeral: true 
    });
  }

  if (action === 'refresh') {
    const user = await User.findOne({ discordId: userId });
    if (!user) {
      return interaction.reply({ content: '❌ User data not found.', ephemeral: true });
    }
    
    // Re-fetch and rebuild card
    let targetUser;
    try {
      targetUser = await interaction.client.users.fetch(userId);
    } catch (fetchError) {
      console.error('Failed to fetch user for card refresh:', fetchError);
      return interaction.reply({ 
        content: '❌ Could not fetch user data. Please try again.', 
        ephemeral: true 
      });
    }
    
    // Rebuild with fresh data
    const level = user.level || 1;
    const xp = user.xp || 0;
    const streak = user.streak || 0;
    const quizzes = user.quizzesTaken || 0;
    const accuracy = user.totalQuestions > 0 
      ? Math.round((user.correctAnswers / user.totalQuestions) * 100) 
      : 0;
    const achievements = user.achievements?.length || 0;
    const lessons = user.completedLessons?.length || 0;
    const prestigeLevel = user.prestige?.level || 0;
    const prestigeMultiplier = user.prestige?.bonusMultiplier || 1.0;
    const lifetimeXP = user.prestige?.totalXpEarned || xp;
    
    const theme = TierSystem.getProMaxTheme(user);
    const multiplierBox = TierSystem.buildMultiplierBox(streak, prestigeLevel, prestigeMultiplier);
    const rank = getRank(level);
    const rarity = getRarity(level, lifetimeXP, achievements);
    
    const xpNeeded = xpForLevel(level);
    const progressPercent = Math.min(Math.round((xp / Math.max(xpNeeded, 1)) * 100), 100);
    const progressBar = buildProMaxProgressBar(progressPercent, theme.tier);
    
    const embed = new EmbedBuilder()
      .setColor(theme.embedColor)
      .setAuthor({
        name: `${theme.tier.badge} ${theme.tier.name.toUpperCase()} TIER`,
        iconURL: targetUser.displayAvatarURL()
      })
      .setTitle(`${theme.aura.emoji || rarity.emoji} ${targetUser.username} ${theme.aura.emoji || ''}`.trim())
      .setThumbnail(targetUser.displayAvatarURL({ size: 512 }))
      .setDescription(`
${theme.border}
${rank.emoji} **${rank.name}** • Level ${level}${prestigeLevel > 0 ? ` • ⭐ P${prestigeLevel}` : ''}
${theme.border}

**╭─────── XP PROGRESS ───────╮**
${progressBar}
\`${xp.toLocaleString()} / ${xpNeeded.toLocaleString()} XP\` to Level ${level + 1}
**╰───────────────────────────╯**
`)
      .addFields(
        { name: '💫 ACTIVE MULTIPLIERS', value: multiplierBox.formatted, inline: false },
        { name: '⚡ Lifetime XP', value: `\`${lifetimeXP.toLocaleString()}\``, inline: true },
        { name: '🔥 Streak', value: `\`${streak} days\``, inline: true },
        { name: '📈 Level', value: `\`${level}\``, inline: true },
        { name: '🎯 Quizzes', value: `\`${quizzes}\``, inline: true },
        { name: '✅ Accuracy', value: `\`${accuracy}%\``, inline: true },
        { name: '📚 Lessons', value: `\`${lessons}\``, inline: true },
        { name: '🏆 Achievements', value: `\`${achievements}/40\``, inline: true },
        { name: '⭐ Prestige', value: prestigeLevel > 0 ? `\`P${prestigeLevel}\` ${theme.aura.name}` : '`P0`', inline: true },
        { name: '💎 Rarity', value: `\`${rarity.name}\``, inline: true }
      )
      .setFooter({ text: `${theme.footerText} • 🔄 Refreshed`, iconURL: interaction.client.user.displayAvatarURL() })
      .setTimestamp();

    const row = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId(`card_refresh_${userId}`)
          .setLabel('Refresh')
          .setEmoji('🔄')
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId(`card_share_${userId}`)
          .setLabel('Share')
          .setEmoji('📤')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setLabel('View on Website')
          .setEmoji('🌐')
          .setStyle(ButtonStyle.Link)
          .setURL(buildWebsiteURL(targetUser, user, theme))
      );

    await interaction.update({ embeds: [embed], components: [row] });
  } else if (action === 'share') {
    const user = await User.findOne({ discordId: userId });
    if (!user) {
      return interaction.reply({ content: '❌ User data not found.', ephemeral: true });
    }
    
    let targetUser;
    try {
      targetUser = await interaction.client.users.fetch(userId);
    } catch (fetchError) {
      console.error('Failed to fetch user for card share:', fetchError);
      return interaction.reply({ 
        content: '❌ Could not fetch user data. Please try again.', 
        ephemeral: true 
      });
    }
    
    const theme = TierSystem.getProMaxTheme(user);
    
    const shareEmbed = new EmbedBuilder()
      .setColor(theme.embedColor)
      .setTitle(`${theme.tier.badge} Check out ${targetUser.username}'s Pro Max Card!`)
      .setDescription(`**Level ${user?.level || 1}** • **${(user?.prestige?.totalXpEarned || 0).toLocaleString()} Lifetime XP** • **${user?.streak || 0} day streak** 🔥`)
      .setThumbnail(targetUser.displayAvatarURL({ size: 128 }))
      .setFooter({ text: theme.footerText });

    await interaction.reply({ embeds: [shareEmbed] });
  }
}
