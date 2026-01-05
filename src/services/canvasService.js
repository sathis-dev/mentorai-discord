// ============================================
// MentorAI Canvas Service
// Generate beautiful images: certificates, progress charts, skill trees
// ============================================

import { createCanvas, registerFont, loadImage } from 'canvas';
import { AttachmentBuilder } from 'discord.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Color constants
const COLORS = {
  background: '#0f0f1a',
  backgroundGradientStart: '#1a1a2e',
  backgroundGradientEnd: '#0f0f1a',
  primary: '#5865F2',
  secondary: '#7289da',
  success: '#57F287',
  warning: '#FEE75C',
  error: '#ED4245',
  gold: '#FFD700',
  text: '#ffffff',
  textMuted: '#99AAB5',
  border: '#2d2d44',
  card: 'rgba(45, 45, 68, 0.8)',
};

/**
 * Generate a completion certificate
 */
export async function generateCertificate(options = {}) {
  const {
    userName = 'Learner',
    courseName = 'JavaScript Fundamentals',
    completionDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
    score = 100,
    level = 1,
    certificateId = generateId()
  } = options;

  const canvas = createCanvas(1200, 800);
  const ctx = canvas.getContext('2d');

  // Background gradient
  const bgGradient = ctx.createLinearGradient(0, 0, 1200, 800);
  bgGradient.addColorStop(0, COLORS.backgroundGradientStart);
  bgGradient.addColorStop(1, COLORS.backgroundGradientEnd);
  ctx.fillStyle = bgGradient;
  ctx.fillRect(0, 0, 1200, 800);

  // Decorative border
  ctx.strokeStyle = COLORS.primary;
  ctx.lineWidth = 4;
  ctx.strokeRect(30, 30, 1140, 740);
  
  ctx.strokeStyle = COLORS.gold;
  ctx.lineWidth = 2;
  ctx.strokeRect(40, 40, 1120, 720);

  // Corner decorations
  drawCornerDecoration(ctx, 50, 50, 0);
  drawCornerDecoration(ctx, 1150, 50, 90);
  drawCornerDecoration(ctx, 1150, 750, 180);
  drawCornerDecoration(ctx, 50, 750, 270);

  // Title
  ctx.fillStyle = COLORS.gold;
  ctx.font = 'bold 48px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('CERTIFICATE OF COMPLETION', 600, 120);

  // MentorAI branding
  ctx.fillStyle = COLORS.primary;
  ctx.font = 'bold 28px Arial';
  ctx.fillText('🎓 MentorAI', 600, 170);

  // This certifies text
  ctx.fillStyle = COLORS.textMuted;
  ctx.font = '24px Arial';
  ctx.fillText('This is to certify that', 600, 250);

  // User name
  ctx.fillStyle = COLORS.text;
  ctx.font = 'bold 56px Arial';
  ctx.fillText(userName, 600, 330);

  // Underline for name
  ctx.strokeStyle = COLORS.gold;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(300, 350);
  ctx.lineTo(900, 350);
  ctx.stroke();

  // Has successfully completed
  ctx.fillStyle = COLORS.textMuted;
  ctx.font = '24px Arial';
  ctx.fillText('has successfully completed', 600, 410);

  // Course name
  ctx.fillStyle = COLORS.success;
  ctx.font = 'bold 40px Arial';
  ctx.fillText(courseName, 600, 470);

  // Score and level
  ctx.fillStyle = COLORS.text;
  ctx.font = '28px Arial';
  ctx.fillText(`Score: ${score}% • Level ${level}`, 600, 530);

  // Achievement badge
  drawAchievementBadge(ctx, 600, 610, score);

  // Date
  ctx.fillStyle = COLORS.textMuted;
  ctx.font = '20px Arial';
  ctx.fillText(`Completed on ${completionDate}`, 600, 700);

  // Certificate ID
  ctx.fillStyle = COLORS.textMuted;
  ctx.font = '14px Arial';
  ctx.fillText(`Certificate ID: ${certificateId}`, 600, 730);

  // Stars decoration
  for (let i = 0; i < 5; i++) {
    const starX = 400 + i * 100;
    drawStar(ctx, starX, 580, 15, COLORS.gold);
  }

  return createAttachment(canvas, 'certificate.png');
}

/**
 * Generate a progress chart
 */
export async function generateProgressChart(options = {}) {
  const {
    userName = 'Learner',
    xp = 0,
    level = 1,
    xpForNext = 100,
    totalLessons = 0,
    totalQuizzes = 0,
    streak = 0,
    topTopics = [], // Array of { name, progress } where progress is 0-100
    weeklyXp = [0, 0, 0, 0, 0, 0, 0] // Last 7 days
  } = options;

  const canvas = createCanvas(900, 600);
  const ctx = canvas.getContext('2d');

  // Background
  const bgGradient = ctx.createLinearGradient(0, 0, 900, 600);
  bgGradient.addColorStop(0, COLORS.backgroundGradientStart);
  bgGradient.addColorStop(1, COLORS.backgroundGradientEnd);
  ctx.fillStyle = bgGradient;
  ctx.fillRect(0, 0, 900, 600);

  // Border
  ctx.strokeStyle = COLORS.border;
  ctx.lineWidth = 2;
  ctx.strokeRect(10, 10, 880, 580);

  // Header
  ctx.fillStyle = COLORS.text;
  ctx.font = 'bold 32px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(`📊 ${userName}'s Progress`, 450, 50);

  // Main stats cards
  const stats = [
    { label: 'Level', value: level, emoji: '⭐', color: COLORS.gold },
    { label: 'XP', value: formatNumber(xp), emoji: '✨', color: COLORS.primary },
    { label: 'Streak', value: `${streak}🔥`, emoji: '', color: COLORS.warning },
    { label: 'Lessons', value: totalLessons, emoji: '📚', color: COLORS.success }
  ];

  stats.forEach((stat, i) => {
    const x = 80 + i * 200;
    drawStatCard(ctx, x, 80, stat);
  });

  // XP Progress Bar
  const xpProgress = xp / (xp + xpForNext);
  ctx.fillStyle = COLORS.textMuted;
  ctx.font = '16px Arial';
  ctx.textAlign = 'left';
  ctx.fillText(`XP to Level ${level + 1}:`, 50, 190);

  // Progress bar background
  ctx.fillStyle = COLORS.border;
  roundRect(ctx, 50, 200, 800, 30, 15);
  ctx.fill();

  // Progress bar fill
  const progressGradient = ctx.createLinearGradient(50, 0, 850, 0);
  progressGradient.addColorStop(0, COLORS.primary);
  progressGradient.addColorStop(1, COLORS.success);
  ctx.fillStyle = progressGradient;
  roundRect(ctx, 50, 200, 800 * xpProgress, 30, 15);
  ctx.fill();

  // Progress text
  ctx.fillStyle = COLORS.text;
  ctx.font = 'bold 14px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(`${xp} / ${xp + xpForNext} XP`, 450, 222);

  // Weekly XP Chart
  ctx.fillStyle = COLORS.text;
  ctx.font = 'bold 20px Arial';
  ctx.textAlign = 'left';
  ctx.fillText('📈 Weekly Activity', 50, 280);

  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const maxWeeklyXp = Math.max(...weeklyXp, 100);
  const chartHeight = 120;
  const barWidth = 80;
  const chartStartX = 80;
  const chartStartY = 420;

  weeklyXp.forEach((xpValue, i) => {
    const barHeight = (xpValue / maxWeeklyXp) * chartHeight;
    const x = chartStartX + i * (barWidth + 30);
    
    // Bar
    const barGradient = ctx.createLinearGradient(x, chartStartY - barHeight, x, chartStartY);
    barGradient.addColorStop(0, COLORS.primary);
    barGradient.addColorStop(1, COLORS.secondary);
    ctx.fillStyle = barGradient;
    roundRect(ctx, x, chartStartY - barHeight, barWidth, barHeight, 5);
    ctx.fill();

    // Day label
    ctx.fillStyle = COLORS.textMuted;
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(days[i], x + barWidth/2, chartStartY + 20);

    // XP value
    ctx.fillStyle = COLORS.text;
    ctx.font = 'bold 12px Arial';
    ctx.fillText(xpValue.toString(), x + barWidth/2, chartStartY - barHeight - 10);
  });

  // Top Topics (right side)
  ctx.fillStyle = COLORS.text;
  ctx.font = 'bold 20px Arial';
  ctx.textAlign = 'left';
  ctx.fillText('🎯 Top Topics', 50, 480);

  const topicsToShow = topTopics.slice(0, 4);
  topicsToShow.forEach((topic, i) => {
    const y = 500 + i * 25;
    
    // Topic name
    ctx.fillStyle = COLORS.textMuted;
    ctx.font = '14px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(topic.name, 70, y);

    // Mini progress bar
    ctx.fillStyle = COLORS.border;
    roundRect(ctx, 200, y - 10, 200, 12, 6);
    ctx.fill();

    const topicColor = i === 0 ? COLORS.gold : i === 1 ? COLORS.primary : COLORS.success;
    ctx.fillStyle = topicColor;
    roundRect(ctx, 200, y - 10, 200 * (topic.progress / 100), 12, 6);
    ctx.fill();

    // Percentage
    ctx.fillStyle = COLORS.text;
    ctx.font = 'bold 12px Arial';
    ctx.fillText(`${topic.progress}%`, 420, y);
  });

  // Footer branding
  ctx.fillStyle = COLORS.textMuted;
  ctx.font = '12px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('Generated by MentorAI • Your AI Coding Mentor', 450, 580);

  return createAttachment(canvas, 'progress.png');
}

/**
 * Generate a skill tree visualization
 */
export async function generateSkillTree(options = {}) {
  const {
    userName = 'Learner',
    skills = [] // Array of { name, level, maxLevel, unlocked, children }
  } = options;

  const canvas = createCanvas(1000, 700);
  const ctx = canvas.getContext('2d');

  // Background
  const bgGradient = ctx.createLinearGradient(0, 0, 1000, 700);
  bgGradient.addColorStop(0, '#1a1a2e');
  bgGradient.addColorStop(0.5, '#16213e');
  bgGradient.addColorStop(1, '#0f0f1a');
  ctx.fillStyle = bgGradient;
  ctx.fillRect(0, 0, 1000, 700);

  // Title
  ctx.fillStyle = COLORS.gold;
  ctx.font = 'bold 36px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('🌳 Skill Tree', 500, 50);

  ctx.fillStyle = COLORS.textMuted;
  ctx.font = '18px Arial';
  ctx.fillText(userName, 500, 80);

  // Default skill tree if none provided
  const defaultSkills = skills.length > 0 ? skills : [
    { name: 'Basics', level: 3, maxLevel: 3, unlocked: true, x: 500, y: 150 },
    { name: 'Variables', level: 2, maxLevel: 3, unlocked: true, x: 300, y: 280 },
    { name: 'Functions', level: 1, maxLevel: 3, unlocked: true, x: 500, y: 280 },
    { name: 'Loops', level: 1, maxLevel: 3, unlocked: true, x: 700, y: 280 },
    { name: 'Arrays', level: 0, maxLevel: 3, unlocked: false, x: 200, y: 410 },
    { name: 'Objects', level: 0, maxLevel: 3, unlocked: false, x: 400, y: 410 },
    { name: 'Async', level: 0, maxLevel: 3, unlocked: false, x: 600, y: 410 },
    { name: 'DOM', level: 0, maxLevel: 3, unlocked: false, x: 800, y: 410 },
    { name: 'APIs', level: 0, maxLevel: 3, unlocked: false, x: 400, y: 540 },
    { name: 'Frameworks', level: 0, maxLevel: 3, unlocked: false, x: 600, y: 540 },
  ];

  // Draw connections first
  ctx.strokeStyle = COLORS.border;
  ctx.lineWidth = 3;
  
  // Draw lines connecting skills (simplified)
  const connections = [
    [0, 1], [0, 2], [0, 3],
    [1, 4], [1, 5],
    [2, 5], [2, 6],
    [3, 6], [3, 7],
    [5, 8], [6, 9]
  ];

  connections.forEach(([from, to]) => {
    const fromSkill = defaultSkills[from];
    const toSkill = defaultSkills[to];
    
    ctx.strokeStyle = toSkill.unlocked ? COLORS.primary : COLORS.border;
    ctx.beginPath();
    ctx.moveTo(fromSkill.x, fromSkill.y + 30);
    ctx.lineTo(toSkill.x, toSkill.y - 30);
    ctx.stroke();
  });

  // Draw skill nodes
  defaultSkills.forEach(skill => {
    drawSkillNode(ctx, skill);
  });

  // Legend
  ctx.fillStyle = COLORS.textMuted;
  ctx.font = '14px Arial';
  ctx.textAlign = 'left';
  
  // Unlocked legend
  ctx.fillStyle = COLORS.success;
  ctx.beginPath();
  ctx.arc(50, 640, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = COLORS.textMuted;
  ctx.fillText('Unlocked', 70, 645);

  // Locked legend
  ctx.fillStyle = COLORS.border;
  ctx.beginPath();
  ctx.arc(180, 640, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = COLORS.textMuted;
  ctx.fillText('Locked', 200, 645);

  // Mastered legend
  ctx.fillStyle = COLORS.gold;
  ctx.beginPath();
  ctx.arc(300, 640, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = COLORS.textMuted;
  ctx.fillText('Mastered', 320, 645);

  // Footer
  ctx.fillStyle = COLORS.textMuted;
  ctx.font = '12px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('Complete lessons and quizzes to unlock new skills!', 500, 680);

  return createAttachment(canvas, 'skilltree.png');
}

/**
 * Generate a leaderboard image
 */
export async function generateLeaderboard(options = {}) {
  const {
    title = '🏆 Global Leaderboard',
    users = [], // Array of { rank, name, xp, level, avatar? }
    highlightUserId = null
  } = options;

  const rowHeight = 50;
  const headerHeight = 80;
  const usersToShow = users.slice(0, 10);
  const height = headerHeight + (usersToShow.length * rowHeight) + 40;

  const canvas = createCanvas(700, height);
  const ctx = canvas.getContext('2d');

  // Background
  ctx.fillStyle = COLORS.background;
  ctx.fillRect(0, 0, 700, height);

  // Header
  ctx.fillStyle = COLORS.gold;
  ctx.font = 'bold 28px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(title, 350, 45);

  // Column headers
  ctx.fillStyle = COLORS.textMuted;
  ctx.font = 'bold 14px Arial';
  ctx.textAlign = 'left';
  ctx.fillText('Rank', 30, 75);
  ctx.fillText('User', 120, 75);
  ctx.fillText('Level', 450, 75);
  ctx.textAlign = 'right';
  ctx.fillText('XP', 650, 75);

  // Users
  usersToShow.forEach((user, i) => {
    const y = headerHeight + 10 + (i * rowHeight);
    const isHighlighted = user.id === highlightUserId;

    // Row background
    if (isHighlighted) {
      ctx.fillStyle = 'rgba(88, 101, 242, 0.2)';
      roundRect(ctx, 20, y, 660, rowHeight - 5, 8);
      ctx.fill();
    } else if (i % 2 === 0) {
      ctx.fillStyle = 'rgba(45, 45, 68, 0.3)';
      roundRect(ctx, 20, y, 660, rowHeight - 5, 8);
      ctx.fill();
    }

    // Rank
    const rankColor = user.rank === 1 ? COLORS.gold : 
                      user.rank === 2 ? '#C0C0C0' : 
                      user.rank === 3 ? '#CD7F32' : COLORS.text;
    ctx.fillStyle = rankColor;
    ctx.font = 'bold 20px Arial';
    ctx.textAlign = 'left';
    
    const rankEmoji = user.rank === 1 ? '🥇' : user.rank === 2 ? '🥈' : user.rank === 3 ? '🥉' : '';
    ctx.fillText(`${rankEmoji}${user.rank}`, 30, y + 32);

    // Username
    ctx.fillStyle = isHighlighted ? COLORS.primary : COLORS.text;
    ctx.font = '18px Arial';
    ctx.fillText(user.name.substring(0, 20), 120, y + 32);

    // Level
    ctx.fillStyle = COLORS.success;
    ctx.font = 'bold 16px Arial';
    ctx.fillText(`Lv.${user.level}`, 450, y + 32);

    // XP
    ctx.fillStyle = COLORS.gold;
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'right';
    ctx.fillText(`${formatNumber(user.xp)} XP`, 650, y + 32);
  });

  // Footer
  ctx.fillStyle = COLORS.textMuted;
  ctx.font = '12px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('MentorAI • Updated in real-time', 350, height - 15);

  return createAttachment(canvas, 'leaderboard.png');
}

// ============ Helper Functions ============

function drawStatCard(ctx, x, y, stat) {
  // Card background
  ctx.fillStyle = COLORS.card;
  roundRect(ctx, x, y, 170, 80, 10);
  ctx.fill();

  // Border
  ctx.strokeStyle = stat.color;
  ctx.lineWidth = 2;
  roundRect(ctx, x, y, 170, 80, 10);
  ctx.stroke();

  // Emoji and value
  ctx.fillStyle = stat.color;
  ctx.font = 'bold 28px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(`${stat.emoji} ${stat.value}`, x + 85, y + 40);

  // Label
  ctx.fillStyle = COLORS.textMuted;
  ctx.font = '14px Arial';
  ctx.fillText(stat.label, x + 85, y + 65);
}

function drawSkillNode(ctx, skill) {
  const { x, y, name, level, maxLevel, unlocked } = skill;
  const radius = 35;

  // Glow effect for unlocked skills
  if (unlocked) {
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius + 15);
    gradient.addColorStop(0, level === maxLevel ? 'rgba(255, 215, 0, 0.3)' : 'rgba(87, 242, 135, 0.3)');
    gradient.addColorStop(1, 'transparent');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, radius + 15, 0, Math.PI * 2);
    ctx.fill();
  }

  // Node background
  ctx.fillStyle = unlocked ? 
    (level === maxLevel ? COLORS.gold : COLORS.primary) : 
    COLORS.border;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();

  // Border
  ctx.strokeStyle = unlocked ? COLORS.success : COLORS.border;
  ctx.lineWidth = 3;
  ctx.stroke();

  // Level indicators
  const indicatorRadius = 5;
  for (let i = 0; i < maxLevel; i++) {
    const indicatorX = x - 15 + (i * 15);
    const indicatorY = y + radius + 12;
    
    ctx.fillStyle = i < level ? COLORS.gold : COLORS.border;
    ctx.beginPath();
    ctx.arc(indicatorX, indicatorY, indicatorRadius, 0, Math.PI * 2);
    ctx.fill();
  }

  // Skill name
  ctx.fillStyle = COLORS.text;
  ctx.font = 'bold 12px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(name, x, y + 5);

  // Lock icon for locked skills
  if (!unlocked) {
    ctx.fillStyle = COLORS.textMuted;
    ctx.font = '16px Arial';
    ctx.fillText('🔒', x, y - 10);
  }
}

function drawCornerDecoration(ctx, x, y, rotation) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate((rotation * Math.PI) / 180);
  
  ctx.strokeStyle = COLORS.gold;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(30, 0);
  ctx.moveTo(0, 0);
  ctx.lineTo(0, 30);
  ctx.stroke();
  
  ctx.restore();
}

function drawAchievementBadge(ctx, x, y, score) {
  let badgeColor, badgeText;
  
  if (score >= 90) {
    badgeColor = COLORS.gold;
    badgeText = '★ EXCELLENT';
  } else if (score >= 70) {
    badgeColor = COLORS.primary;
    badgeText = '● GREAT';
  } else {
    badgeColor = COLORS.success;
    badgeText = '✓ PASSED';
  }

  ctx.fillStyle = badgeColor;
  ctx.font = 'bold 18px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(badgeText, x, y);
}

function drawStar(ctx, x, y, radius, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  for (let i = 0; i < 5; i++) {
    const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2;
    const px = x + radius * Math.cos(angle);
    const py = y + radius * Math.sin(angle);
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
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

function createAttachment(canvas, filename) {
  const buffer = canvas.toBuffer('image/png');
  return new AttachmentBuilder(buffer, { name: filename });
}

function formatNumber(num) {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
}

function generateId() {
  return 'CERT-' + Math.random().toString(36).substring(2, 8).toUpperCase();
}
