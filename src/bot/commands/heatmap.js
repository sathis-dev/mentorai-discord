import { SlashCommandBuilder, EmbedBuilder, AttachmentBuilder } from 'discord.js';
import { createCanvas } from '@napi-rs/canvas';
import Activity from '../../database/models/Activity.js';
import { COLORS } from '../../config/colors.js';

export const data = new SlashCommandBuilder()
  .setName('heatmap')
  .setDescription('View your learning activity heatmap')
  .addIntegerOption(opt =>
    opt.setName('months')
      .setDescription('Number of months to show (1-6)')
      .setMinValue(1)
      .setMaxValue(6));

export async function execute(interaction) {
  await interaction.deferReply();
  
  const months = interaction.options.getInteger('months') || 3;
  const userId = interaction.user.id;
  
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - months);
  
  const activities = await Activity.find({
    discordId: userId,
    timestamp: { $gte: startDate }
  });
  
  const heatmapBuffer = await generateHeatmap(activities, months, interaction.user.username);
  const attachment = new AttachmentBuilder(heatmapBuffer, { name: 'heatmap.png' });
  
  const stats = calculateActivityStats(activities);
  
  const embed = new EmbedBuilder()
    .setColor(0x57F287)
    .setTitle(`📅 ${interaction.user.username}'s Learning Heatmap`)
    .setDescription(`Activity over the last ${months} month(s)`)
    .setImage('attachment://heatmap.png')
    .addFields(
      { name: '🔥 Active Days', value: `${stats.activeDays}`, inline: true },
      { name: '📊 Total Activities', value: `${stats.totalActivities}`, inline: true },
      { name: '⚡ Best Day', value: `${stats.bestDay.count} activities`, inline: true },
      { name: '📈 Current Streak', value: `${stats.currentStreak} days`, inline: true },
      { name: '🏆 Longest Streak', value: `${stats.longestStreak} days`, inline: true },
      { name: '📅 Most Active Day', value: stats.mostActiveWeekday, inline: true }
    )
    .setFooter({ text: 'Darker = More activity | Keep learning every day!' });

  await interaction.editReply({ embeds: [embed], files: [attachment] });
}

async function generateHeatmap(activities, months, username) {
  const cellSize = 15;
  const cellGap = 3;
  const weeksToShow = months * 4 + 2;
  const width = (cellSize + cellGap) * weeksToShow + 80;
  const height = (cellSize + cellGap) * 7 + 100;
  
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');
  
  // Background
  ctx.fillStyle = '#1a1a2e';
  ctx.fillRect(0, 0, width, height);
  
  // Title
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 18px Arial';
  ctx.fillText(`${username}'s Activity`, 50, 30);
  
  // Day labels
  ctx.font = '12px Arial';
  ctx.fillStyle = '#666';
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  for (let i = 0; i < 7; i++) {
    if (i % 2 === 1) {
      ctx.fillText(days[i], 10, 70 + i * (cellSize + cellGap) + cellSize / 2 + 4);
    }
  }
  
  // Build activity map
  const activityMap = new Map();
  for (const activity of activities) {
    const dateKey = activity.timestamp.toISOString().split('T')[0];
    activityMap.set(dateKey, (activityMap.get(dateKey) || 0) + 1);
  }
  
  const maxActivity = Math.max(...activityMap.values(), 1);
  
  const colorScale = [
    '#161b22',
    '#0e4429',
    '#006d32',
    '#26a641',
    '#39d353'
  ];
  
  // Calculate start date
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - (weeksToShow * 7));
  const dayOfWeek = startDate.getDay();
  startDate.setDate(startDate.getDate() - dayOfWeek);
  
  let currentDate = new Date(startDate);
  
  for (let week = 0; week < weeksToShow; week++) {
    for (let day = 0; day < 7; day++) {
      const dateKey = currentDate.toISOString().split('T')[0];
      const count = activityMap.get(dateKey) || 0;
      
      let colorIndex;
      if (count === 0) colorIndex = 0;
      else if (count <= maxActivity * 0.25) colorIndex = 1;
      else if (count <= maxActivity * 0.5) colorIndex = 2;
      else if (count <= maxActivity * 0.75) colorIndex = 3;
      else colorIndex = 4;
      
      const x = 50 + week * (cellSize + cellGap);
      const y = 55 + day * (cellSize + cellGap);
      
      if (currentDate <= new Date()) {
        ctx.fillStyle = colorScale[colorIndex];
        roundRect(ctx, x, y, cellSize, cellSize, 3);
        ctx.fill();
      }
      
      currentDate.setDate(currentDate.getDate() + 1);
    }
  }
  
  // Month labels
  ctx.fillStyle = '#666';
  ctx.font = '11px Arial';
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  let labelDate = new Date(startDate);
  let lastMonth = -1;
  
  for (let week = 0; week < weeksToShow; week++) {
    const month = labelDate.getMonth();
    if (month !== lastMonth && labelDate.getDate() <= 7) {
      ctx.fillText(monthNames[month], 50 + week * (cellSize + cellGap), height - 30);
      lastMonth = month;
    }
    labelDate.setDate(labelDate.getDate() + 7);
  }
  
  // Legend
  ctx.fillStyle = '#666';
  ctx.fillText('Less', width - 120, height - 30);
  for (let i = 0; i < 5; i++) {
    ctx.fillStyle = colorScale[i];
    roundRect(ctx, width - 90 + i * 18, height - 42, 14, 14, 2);
    ctx.fill();
  }
  ctx.fillStyle = '#666';
  ctx.fillText('More', width - 20, height - 30);
  
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

function calculateActivityStats(activities) {
  const dailyActivities = new Map();
  const weekdayCount = new Array(7).fill(0);
  
  for (const activity of activities) {
    const dateKey = activity.timestamp.toISOString().split('T')[0];
    dailyActivities.set(dateKey, (dailyActivities.get(dateKey) || 0) + 1);
    weekdayCount[activity.timestamp.getDay()]++;
  }
  
  let bestDay = { date: '', count: 0 };
  for (const [date, count] of dailyActivities) {
    if (count > bestDay.count) {
      bestDay = { date, count };
    }
  }
  
  const sortedDates = [...dailyActivities.keys()].sort();
  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 1;
  
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  
  if (sortedDates.includes(today) || sortedDates.includes(yesterday)) {
    currentStreak = 1;
  }
  
  for (let i = 1; i < sortedDates.length; i++) {
    const prevDate = new Date(sortedDates[i - 1]);
    const currDate = new Date(sortedDates[i]);
    const diff = (currDate - prevDate) / 86400000;
    
    if (diff === 1) {
      tempStreak++;
      if (sortedDates[i] === today || sortedDates[i] === yesterday) {
        currentStreak = tempStreak;
      }
    } else {
      longestStreak = Math.max(longestStreak, tempStreak);
      tempStreak = 1;
    }
  }
  longestStreak = Math.max(longestStreak, tempStreak);
  
  const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const maxWeekday = weekdayCount.indexOf(Math.max(...weekdayCount));
  
  return {
    activeDays: dailyActivities.size,
    totalActivities: activities.length,
    bestDay,
    currentStreak,
    longestStreak,
    mostActiveWeekday: weekdays[maxWeekday]
  };
}
