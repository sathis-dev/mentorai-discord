/**
 * Trading Card Generator - Beautiful Visual Cards
 * 
 * Features:
 * - Multiple themes (default, dark, neon, classic, futuristic)
 * - User avatar integration
 * - Stats display
 * - Tier badges
 * - Prestige crowns
 */

import { createCanvas, loadImage, registerFont } from 'canvas';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class CardGenerator {
  constructor() {
    // Try to register custom fonts
    try {
      registerFont(path.join(__dirname, '../assets/fonts/Roboto-Bold.ttf'), { family: 'Roboto', weight: 'bold' });
      registerFont(path.join(__dirname, '../assets/fonts/Roboto-Regular.ttf'), { family: 'Roboto' });
    } catch (error) {
      console.log('Using default fonts - custom fonts not found');
    }

    this.themes = {
      default: {
        background: '#5865F2', // Discord blurple
        primary: '#FFFFFF',
        secondary: '#F0F0F0',
        accent: '#57F287',
        text: '#FFFFFF',
        textDark: '#000000'
      },
      dark: {
        background: '#2C2F33',
        primary: '#23272A',
        secondary: '#99AAB5',
        accent: '#7289DA',
        text: '#FFFFFF',
        textDark: '#FFFFFF'
      },
      neon: {
        background: '#0A0A0A',
        primary: '#1A1A1A',
        secondary: '#333333',
        accent: '#00FFAA',
        text: '#FFFFFF',
        textDark: '#FFFFFF'
      },
      classic: {
        background: '#F5F5DC',
        primary: '#DEB887',
        secondary: '#8B4513',
        accent: '#A0522D',
        text: '#000000',
        textDark: '#000000'
      },
      futuristic: {
        background: '#001F3F',
        primary: '#0074D9',
        secondary: '#7FDBFF',
        accent: '#FFDC00',
        text: '#FFFFFF',
        textDark: '#FFFFFF'
      }
    };

    this.tierColors = {
      Bronze: '#CD7F32',
      Silver: '#C0C0C0',
      Gold: '#FFD700',
      Platinum: '#E5E4E2',
      Diamond: '#B9F2FF',
      Master: '#FF6B6B'
    };
  }

  /**
   * Main card generation function
   * @param {Object} user - User data
   * @param {Object} options - Generation options
   * @returns {Buffer} PNG image buffer
   */
  async generateCard(user, options = {}) {
    const themeName = options.theme || user.settings?.theme || 'default';
    const theme = this.themes[themeName] || this.themes.default;
    const canvas = createCanvas(800, 400);
    const ctx = canvas.getContext('2d');

    // Draw background
    this.drawBackground(ctx, canvas, theme, themeName);

    // Draw user avatar
    await this.drawAvatar(ctx, user.avatar);

    // Draw user info
    this.drawUserInfo(ctx, user, theme);

    // Draw XP bar
    this.drawXPBar(ctx, user, theme);

    // Draw stats
    this.drawStats(ctx, user, theme);

    // Draw tier badge
    if (user.tier) {
      this.drawTierBadge(ctx, user.tier);
    }

    // Draw prestige crown (if any)
    if (user.prestige?.level > 0) {
      this.drawPrestigeCrown(ctx, user.prestige.level);
    }

    // Draw decorative frame
    this.drawFrame(ctx, canvas, theme);

    // Return as buffer
    return canvas.toBuffer('image/png');
  }

  /**
   * Draw gradient background with decorative elements
   */
  drawBackground(ctx, canvas, theme, themeName) {
    // Gradient background
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, theme.background);
    gradient.addColorStop(1, theme.primary);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Decorative circles
    ctx.fillStyle = theme.accent + '20'; // 12% opacity
    for (let i = 0; i < 20; i++) {
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height;
      const radius = Math.random() * 15 + 5;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    }

    // Theme-specific decorations
    if (themeName === 'neon') {
      // Neon glow lines
      ctx.strokeStyle = theme.accent + '40';
      ctx.lineWidth = 2;
      for (let i = 0; i < 5; i++) {
        ctx.beginPath();
        ctx.moveTo(0, i * 100);
        ctx.lineTo(canvas.width, i * 100 + 50);
        ctx.stroke();
      }
    } else if (themeName === 'futuristic') {
      // Grid pattern
      ctx.strokeStyle = theme.secondary + '30';
      ctx.lineWidth = 1;
      for (let i = 0; i < canvas.width; i += 40) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, canvas.height);
        ctx.stroke();
      }
      for (let i = 0; i < canvas.height; i += 40) {
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(canvas.width, i);
        ctx.stroke();
      }
    }
  }

  /**
   * Draw user avatar in a circle
   */
  async drawAvatar(ctx, avatarUrl) {
    const x = 100;
    const y = 120;
    const radius = 60;

    try {
      const avatar = await loadImage(avatarUrl || 'https://cdn.discordapp.com/embed/avatars/0.png');
      
      // Draw avatar in a circle
      ctx.save();
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(avatar, x - radius, y - radius, radius * 2, radius * 2);
      ctx.restore();

      // Draw border
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(x, y, radius + 4, 0, Math.PI * 2);
      ctx.stroke();

      // Draw glow effect
      ctx.strokeStyle = '#FFFFFF30';
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.arc(x, y, radius + 10, 0, Math.PI * 2);
      ctx.stroke();
    } catch (error) {
      console.error('Error loading avatar:', error);
      // Draw placeholder
      ctx.fillStyle = '#7289DA';
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();

      // Draw question mark
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 48px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('?', x, y + 15);
      ctx.textAlign = 'left';
    }
  }

  /**
   * Draw user information
   */
  drawUserInfo(ctx, user, theme) {
    const startX = 200;

    // Username
    ctx.fillStyle = theme.text;
    ctx.font = 'bold 32px Roboto, Arial';
    ctx.fillText(user.username || 'Unknown User', startX, 80);

    // Level
    ctx.font = '22px Roboto, Arial';
    ctx.fillText(`Level ${user.level || 1}`, startX, 115);

    // Tier
    if (user.tier) {
      const tierColor = this.tierColors[user.tier.name] || theme.accent;
      ctx.fillStyle = tierColor;
      ctx.font = 'bold 18px Roboto, Arial';
      ctx.fillText(`${user.tier.emoji || '🏅'} ${user.tier.name}`, startX, 145);
    }

    // Total XP earned
    ctx.fillStyle = theme.secondary;
    ctx.font = '14px Roboto, Arial';
    const totalXp = user.prestige?.totalXpEarned || user.totalXp || user.xp || 0;
    ctx.fillText(`Total XP: ${totalXp.toLocaleString()}`, startX, 170);
  }

  /**
   * Draw XP progress bar
   */
  drawXPBar(ctx, user, theme) {
    const x = 200;
    const y = 190;
    const width = 400;
    const height = 24;
    const radius = 12;

    // Calculate XP for next level
    const currentXp = user.xp || 0;
    const xpForNext = user.xpForNextLevel?.() || Math.floor(100 * Math.pow(1.5, (user.level || 1) - 1));
    const progress = Math.min(1, currentXp / xpForNext);
    const fillWidth = Math.max(radius * 2, progress * width);

    // Background
    ctx.fillStyle = theme.secondary + '40';
    this.roundRect(ctx, x, y, width, height, radius);
    ctx.fill();

    // Fill
    const gradient = ctx.createLinearGradient(x, y, x + fillWidth, y);
    gradient.addColorStop(0, theme.accent);
    gradient.addColorStop(1, theme.accent + 'CC');
    ctx.fillStyle = gradient;
    this.roundRect(ctx, x, y, fillWidth, height, radius);
    ctx.fill();

    // Text
    ctx.fillStyle = theme.textDark;
    ctx.font = 'bold 14px Roboto, Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`${currentXp.toLocaleString()} / ${xpForNext.toLocaleString()} XP (${Math.round(progress * 100)}%)`, x + width / 2, y + 17);
    ctx.textAlign = 'left';
  }

  /**
   * Draw user stats
   */
  drawStats(ctx, user, theme) {
    const stats = [
      { label: 'Streak', value: `${user.streak || 0} days`, emoji: '🔥' },
      { label: 'Accuracy', value: `${user.quizStats?.accuracy?.toFixed(1) || 0}%`, emoji: '🎯' },
      { label: 'Quizzes', value: user.quizStats?.taken || 0, emoji: '📝' },
      { label: 'Achievements', value: user.achievements?.length || 0, emoji: '🏆' }
    ];

    const startX = 200;
    const startY = 250;
    const colWidth = 200;
    const rowHeight = 55;

    stats.forEach((stat, index) => {
      const col = index % 2;
      const row = Math.floor(index / 2);
      const x = startX + col * colWidth;
      const y = startY + row * rowHeight;

      // Stat box background
      ctx.fillStyle = theme.primary + '40';
      this.roundRect(ctx, x - 10, y - 20, 180, 45, 8);
      ctx.fill();

      // Label
      ctx.fillStyle = theme.text;
      ctx.font = 'bold 16px Roboto, Arial';
      ctx.fillText(`${stat.emoji} ${stat.label}`, x, y);

      // Value
      ctx.fillStyle = theme.accent;
      ctx.font = 'bold 20px Roboto, Arial';
      ctx.fillText(String(stat.value), x, y + 25);
    });
  }

  /**
   * Draw tier badge
   */
  drawTierBadge(ctx, tier) {
    if (!tier) return;

    const x = 700;
    const y = 100;
    const radius = 45;

    const color = this.tierColors[tier.name] || '#000000';

    // Outer glow
    ctx.fillStyle = color + '40';
    ctx.beginPath();
    ctx.arc(x, y, radius + 10, 0, Math.PI * 2);
    ctx.fill();

    // Badge circle
    const gradient = ctx.createRadialGradient(x - 10, y - 10, 0, x, y, radius);
    gradient.addColorStop(0, color);
    gradient.addColorStop(1, this.darkenColor(color, 30));
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();

    // Border
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.stroke();

    // Tier letter
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 36px Roboto, Arial';
    ctx.textAlign = 'center';
    ctx.fillText(tier.name.charAt(0), x, y + 12);

    // Tier name below
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 14px Roboto, Arial';
    ctx.fillText(tier.name, x, y + radius + 25);
    ctx.textAlign = 'left';
  }

  /**
   * Draw prestige crown
   */
  drawPrestigeCrown(ctx, prestigeLevel) {
    const x = 100;
    const y = 45;

    // Crown emoji
    ctx.font = '36px Arial';
    ctx.fillText('👑', x - 18, y);

    // Prestige level with glow
    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 22px Roboto, Arial';
    ctx.shadowColor = '#FFD700';
    ctx.shadowBlur = 10;
    ctx.fillText(`P${prestigeLevel}`, x + 25, y - 5);
    ctx.shadowBlur = 0;
  }

  /**
   * Draw decorative frame
   */
  drawFrame(ctx, canvas, theme) {
    const margin = 15;
    const radius = 20;

    ctx.strokeStyle = theme.accent + '60';
    ctx.lineWidth = 3;
    this.roundRect(ctx, margin, margin, canvas.width - margin * 2, canvas.height - margin * 2, radius);
    ctx.stroke();

    // Corner decorations
    const cornerSize = 30;
    ctx.fillStyle = theme.accent;
    
    // Top-left
    ctx.fillRect(margin, margin, cornerSize, 3);
    ctx.fillRect(margin, margin, 3, cornerSize);
    
    // Top-right
    ctx.fillRect(canvas.width - margin - cornerSize, margin, cornerSize, 3);
    ctx.fillRect(canvas.width - margin - 3, margin, 3, cornerSize);
    
    // Bottom-left
    ctx.fillRect(margin, canvas.height - margin - 3, cornerSize, 3);
    ctx.fillRect(margin, canvas.height - margin - cornerSize, 3, cornerSize);
    
    // Bottom-right
    ctx.fillRect(canvas.width - margin - cornerSize, canvas.height - margin - 3, cornerSize, 3);
    ctx.fillRect(canvas.width - margin - 3, canvas.height - margin - cornerSize, 3, cornerSize);
  }

  /**
   * Helper function for rounded rectangles
   */
  roundRect(ctx, x, y, width, height, radius) {
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

  /**
   * Darken a hex color
   */
  darkenColor(hex, percent) {
    const num = parseInt(hex.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = Math.max(0, (num >> 16) - amt);
    const G = Math.max(0, ((num >> 8) & 0x00FF) - amt);
    const B = Math.max(0, (num & 0x0000FF) - amt);
    return `#${(1 << 24 | R << 16 | G << 8 | B).toString(16).slice(1)}`;
  }

  /**
   * Get available themes
   */
  getThemes() {
    return Object.keys(this.themes);
  }
}

export const cardGenerator = new CardGenerator();
export default cardGenerator;
