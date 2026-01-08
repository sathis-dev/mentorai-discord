import { SlashCommandBuilder, EmbedBuilder, AttachmentBuilder } from 'discord.js';
import { createCanvas, loadImage } from '@napi-rs/canvas';
import { User } from '../../database/models/User.js';
import { COLORS } from '../../config/colors.js';

export const data = new SlashCommandBuilder()
  .setName('card')
  .setDescription('Generate your achievement trading card')
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
  await interaction.deferReply();
  
  const user = await User.findOne({ discordId: interaction.user.id });
  if (!user) {
    return interaction.editReply('You need to earn some achievements first! Try `/quiz`');
  }
  
  const style = interaction.options.getString('style') || 'holo';
  
  const cardBuffer = await generateTradingCard({
    user,
    discordUser: interaction.user,
    style
  });
  
  const attachment = new AttachmentBuilder(cardBuffer, { name: 'card.png' });
  
  const embed = new EmbedBuilder()
    .setColor(getStyleColor(style))
    .setTitle('🃏 Your Trading Card')
    .setDescription(`**${interaction.user.username}**'s Profile Card`)
    .setImage('attachment://card.png')
    .setFooter({ text: `Style: ${style.toUpperCase()} | Share with friends!` });

  await interaction.editReply({ embeds: [embed], files: [attachment] });
}

async function generateTradingCard({ user, discordUser, style }) {
  const canvas = createCanvas(400, 560);
  const ctx = canvas.getContext('2d');
  
  const gradients = {
    holo: ['#667eea', '#764ba2', '#f093fb'],
    fire: ['#f12711', '#f5af19', '#f12711'],
    ice: ['#4facfe', '#00f2fe', '#4facfe'],
    electric: ['#f7971e', '#ffd200', '#f7971e'],
    dark: ['#232526', '#414345', '#232526']
  };
  
  const colors = gradients[style] || gradients.holo;
  
  // Draw gradient background
  const gradient = ctx.createLinearGradient(0, 0, 400, 560);
  gradient.addColorStop(0, colors[0]);
  gradient.addColorStop(0.5, colors[1]);
  gradient.addColorStop(1, colors[2]);
  ctx.fillStyle = gradient;
  roundRect(ctx, 0, 0, 400, 560, 20);
  ctx.fill();
  
  // Inner card
  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
  roundRect(ctx, 15, 15, 370, 530, 15);
  ctx.fill();
  
  // Holographic effect (diagonal lines)
  if (style === 'holo') {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 2;
    for (let i = -560; i < 400; i += 20) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i + 560, 560);
      ctx.stroke();
    }
  }
  
  // Avatar area
  ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.beginPath();
  ctx.arc(200, 130, 70, 0, Math.PI * 2);
  ctx.fill();
  
  // Try to load avatar
  try {
    const avatarURL = discordUser.displayAvatarURL({ extension: 'png', size: 128 });
    const avatar = await loadImage(avatarURL);
    ctx.save();
    ctx.beginPath();
    ctx.arc(200, 130, 60, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(avatar, 140, 70, 120, 120);
    ctx.restore();
  } catch {
    // Draw placeholder
    ctx.fillStyle = '#5865F2';
    ctx.beginPath();
    ctx.arc(200, 130, 60, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 40px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(discordUser.username[0].toUpperCase(), 200, 145);
  }
  
  // Username
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 28px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(discordUser.username, 200, 230);
  
  // Rank badge
  const rank = getRank(user.level);
  ctx.font = '18px Arial';
  ctx.fillStyle = rank.color;
  ctx.fillText(`${rank.emoji} ${rank.name}`, 200, 260);
  
  // Stats section
  const stats = [
    { label: 'LEVEL', value: user.level, icon: '⭐' },
    { label: 'XP', value: formatNumber(user.xp), icon: '✨' },
    { label: 'STREAK', value: `${user.streak}d`, icon: '🔥' },
    { label: 'ACCURACY', value: `${calculateAccuracy(user)}%`, icon: '🎯' }
  ];
  
  ctx.font = 'bold 14px Arial';
  let yPos = 300;
  
  for (const stat of stats) {
    // Stat box
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    roundRect(ctx, 40, yPos, 320, 45, 8);
    ctx.fill();
    
    // Icon and label
    ctx.fillStyle = '#888';
    ctx.textAlign = 'left';
    ctx.fillText(`${stat.icon} ${stat.label}`, 55, yPos + 28);
    
    // Value
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'right';
    ctx.font = 'bold 18px Arial';
    ctx.fillText(String(stat.value), 340, yPos + 30);
    ctx.font = 'bold 14px Arial';
    
    yPos += 55;
  }
  
  // Achievement count
  ctx.fillStyle = '#888';
  ctx.font = '14px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(`🏆 ${user.achievements?.length || 0} Achievements Unlocked`, 200, 510);
  
  // Rarity indicator
  const rarity = calculateRarity(user);
  ctx.fillStyle = rarity.color;
  ctx.font = 'bold 12px Arial';
  ctx.textAlign = 'right';
  ctx.fillText(rarity.name.toUpperCase(), 370, 40);
  
  // Card border glow effect
  ctx.strokeStyle = colors[1];
  ctx.lineWidth = 3;
  roundRect(ctx, 5, 5, 390, 550, 18);
  ctx.stroke();
  
  return canvas.toBuffer('image/png');
}

function roundRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

function getRank(level) {
  const ranks = [
    { min: 1, name: 'Novice', emoji: '🌱', color: '#57F287' },
    { min: 5, name: 'Apprentice', emoji: '📘', color: '#3498DB' },
    { min: 10, name: 'Scholar', emoji: '🎓', color: '#9B59B6' },
    { min: 20, name: 'Expert', emoji: '💡', color: '#F1C40F' },
    { min: 30, name: 'Master', emoji: '🏆', color: '#E67E22' },
    { min: 40, name: 'Grandmaster', emoji: '⚡', color: '#E74C3C' },
    { min: 50, name: 'Legend', emoji: '🌟', color: '#FFD700' }
  ];
  
  for (let i = ranks.length - 1; i >= 0; i--) {
    if (level >= ranks[i].min) return ranks[i];
  }
  return ranks[0];
}

function calculateAccuracy(user) {
  if (!user.totalQuestions || user.totalQuestions === 0) return 0;
  return Math.round((user.correctAnswers / user.totalQuestions) * 100);
}

function calculateRarity(user) {
  const score = user.level + (user.achievements?.length || 0) * 2 + Math.floor(user.xp / 1000);
  
  if (score >= 100) return { name: 'Legendary', color: '#FFD700' };
  if (score >= 50) return { name: 'Epic', color: '#9B59B6' };
  if (score >= 25) return { name: 'Rare', color: '#3498DB' };
  if (score >= 10) return { name: 'Uncommon', color: '#57F287' };
  return { name: 'Common', color: '#95A5A6' };
}

function formatNumber(num) {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return String(num);
}

function getStyleColor(style) {
  const colorMap = {
    holo: 0x667eea,
    fire: 0xf12711,
    ice: 0x4facfe,
    electric: 0xf7971e,
    dark: 0x232526
  };
  return colorMap[style] || colorMap.holo;
}
