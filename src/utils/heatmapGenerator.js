/**
 * Heatmap Generator - GitHub-Style Activity Visualization
 * 
 * Features:
 * - SVG generation for web display
 * - Text-based heatmap for Discord
 * - Activity tracking visualization
 * - Customizable colors
 */

import { User } from '../database/models/User.js';

class HeatmapGenerator {
  constructor() {
    this.colors = [
      '#ebedf0', // 0 activities
      '#9be9a8', // 1-2 activities
      '#40c463', // 3-4 activities
      '#30a14e', // 5-6 activities
      '#216e39'  // 7+ activities
    ];

    this.darkColors = [
      '#161b22', // 0 activities
      '#0e4429', // 1-2 activities
      '#006d32', // 3-4 activities
      '#26a641', // 5-6 activities
      '#39d353'  // 7+ activities
    ];

    this.monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    this.dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  }

  /**
   * Generate SVG heatmap
   * @param {string} discordId - User's Discord ID
   * @param {number} year - Year to display
   * @param {boolean} darkMode - Use dark mode colors
   * @returns {string} SVG string
   */
  async generateHeatmap(discordId, year = new Date().getFullYear(), darkMode = true) {
    const activity = await this.getUserActivity(discordId, year);
    return this.createSVG(activity, year, darkMode);
  }

  /**
   * Get user's activity data for a year
   * @param {string} discordId - User's Discord ID
   * @param {number} year - Year to query
   * @returns {Object} Activity data by date
   */
  async getUserActivity(discordId, year) {
    const activity = {};
    
    try {
      const user = await User.findOne({ discordId });
      if (!user) return activity;

      // Get activity from various sources
      const startDate = new Date(year, 0, 1);
      const endDate = new Date(year, 11, 31);

      // Count quizzes by date
      if (user.quizHistory) {
        for (const quiz of user.quizHistory) {
          if (quiz.completedAt) {
            const date = new Date(quiz.completedAt);
            if (date >= startDate && date <= endDate) {
              const dateStr = date.toISOString().split('T')[0];
              activity[dateStr] = (activity[dateStr] || 0) + 1;
            }
          }
        }
      }

      // Count lessons by date
      if (user.completedLessons) {
        for (const lesson of user.completedLessons) {
          if (lesson.completedAt) {
            const date = new Date(lesson.completedAt);
            if (date >= startDate && date <= endDate) {
              const dateStr = date.toISOString().split('T')[0];
              activity[dateStr] = (activity[dateStr] || 0) + 1;
            }
          }
        }
      }

      // Count daily claims
      if (user.dailyHistory) {
        for (const daily of user.dailyHistory) {
          const date = new Date(daily);
          if (date >= startDate && date <= endDate) {
            const dateStr = date.toISOString().split('T')[0];
            activity[dateStr] = (activity[dateStr] || 0) + 1;
          }
        }
      }

      // If no history available, use last active as indicator
      if (Object.keys(activity).length === 0 && user.lastActive) {
        const lastActiveDate = new Date(user.lastActive);
        if (lastActiveDate >= startDate && lastActiveDate <= endDate) {
          const dateStr = lastActiveDate.toISOString().split('T')[0];
          activity[dateStr] = 1;
        }
      }

    } catch (error) {
      console.error('Error fetching user activity:', error);
    }

    return activity;
  }

  /**
   * Create SVG heatmap
   * @param {Object} activity - Activity data by date
   * @param {number} year - Year
   * @param {boolean} darkMode - Use dark mode
   * @returns {string} SVG string
   */
  createSVG(activity, year, darkMode = true) {
    const colors = darkMode ? this.darkColors : this.colors;
    const bgColor = darkMode ? '#0d1117' : '#ffffff';
    const textColor = darkMode ? '#8b949e' : '#666666';
    
    const cellSize = 12;
    const cellMargin = 3;
    const totalCellSize = cellSize + cellMargin;
    const labelWidth = 30;
    const headerHeight = 20;
    const width = labelWidth + 53 * totalCellSize + 20;
    const height = headerHeight + 7 * totalCellSize + 40;

    let svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">`;
    
    // Background
    svg += `<rect width="${width}" height="${height}" fill="${bgColor}" rx="6" ry="6"/>`;

    // Title
    svg += `<text x="${width / 2}" y="15" font-size="12" fill="${textColor}" text-anchor="middle" font-family="Arial, sans-serif">${year} Learning Activity</text>`;

    // Calculate first day of year
    const firstDay = new Date(year, 0, 1);
    const startDayOfWeek = (firstDay.getDay() + 6) % 7; // Mon=0, Sun=6

    // Track which weeks belong to which month for month labels
    const monthStarts = [];
    let currentMonth = 0;

    // Draw cells
    const daysInYear = ((year % 4 === 0 && year % 100 !== 0) || year % 400 === 0) ? 366 : 365;
    
    for (let day = 0; day < daysInYear; day++) {
      const date = new Date(year, 0, day + 1);
      const dateStr = date.toISOString().split('T')[0];
      const activityCount = activity[dateStr] || 0;
      
      const colorIndex = this.getColorIndex(activityCount);
      const color = colors[colorIndex];

      const week = Math.floor((day + startDayOfWeek) / 7);
      const dayOfWeek = (day + startDayOfWeek) % 7;

      const x = labelWidth + week * totalCellSize;
      const y = headerHeight + dayOfWeek * totalCellSize;

      // Track month labels
      if (date.getDate() === 1) {
        monthStarts.push({ month: date.getMonth(), week });
      }

      svg += `<rect 
        x="${x}" 
        y="${y}" 
        width="${cellSize}" 
        height="${cellSize}" 
        fill="${color}" 
        rx="2" 
        ry="2"
        data-date="${dateStr}"
        data-count="${activityCount}"
      >
        <title>${dateStr}: ${activityCount} activities</title>
      </rect>`;
    }

    // Draw month labels
    monthStarts.forEach(({ month, week }) => {
      const x = labelWidth + week * totalCellSize;
      svg += `<text x="${x}" y="${headerHeight - 5}" font-size="10" fill="${textColor}" font-family="Arial, sans-serif">${this.monthLabels[month]}</text>`;
    });

    // Draw day labels (Mon, Wed, Fri)
    [0, 2, 4].forEach((dayIndex) => {
      const y = headerHeight + dayIndex * totalCellSize + cellSize - 2;
      svg += `<text x="5" y="${y}" font-size="10" fill="${textColor}" font-family="Arial, sans-serif">${this.dayLabels[dayIndex]}</text>`;
    });

    // Legend
    const legendY = height - 15;
    const legendX = width - 180;
    
    svg += `<text x="${legendX}" y="${legendY}" font-size="10" fill="${textColor}" font-family="Arial, sans-serif">Less</text>`;
    
    colors.forEach((color, i) => {
      const x = legendX + 30 + i * (cellSize + 3);
      svg += `<rect x="${x}" y="${legendY - 10}" width="${cellSize}" height="${cellSize}" fill="${color}" rx="2" ry="2"/>`;
    });
    
    svg += `<text x="${legendX + 30 + colors.length * (cellSize + 3) + 5}" y="${legendY}" font-size="10" fill="${textColor}" font-family="Arial, sans-serif">More</text>`;

    // Activity count
    const totalActivities = Object.values(activity).reduce((a, b) => a + b, 0);
    const activeDays = Object.keys(activity).length;
    svg += `<text x="10" y="${legendY}" font-size="10" fill="${textColor}" font-family="Arial, sans-serif">${totalActivities} activities in ${activeDays} days</text>`;

    svg += '</svg>';
    return svg;
  }

  /**
   * Get color index based on activity count
   */
  getColorIndex(count) {
    if (count === 0) return 0;
    if (count <= 2) return 1;
    if (count <= 4) return 2;
    if (count <= 6) return 3;
    return 4;
  }

  /**
   * Generate text-based heatmap for Discord
   * @param {string} discordId - User's Discord ID
   * @param {number} months - Number of months to show
   * @returns {string} Text heatmap
   */
  async generateTextHeatmap(discordId, months = 6) {
    const blocks = ['░', '▒', '▓', '█'];
    const now = new Date();
    const activity = await this.getUserActivity(discordId, now.getFullYear());
    
    let output = '```\n';
    output += '📊 Learning Activity Heatmap\n';
    output += '─'.repeat(40) + '\n\n';

    // Header with months
    output += '     ';
    for (let i = months - 1; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      output += this.monthLabels[monthDate.getMonth()].padEnd(4);
    }
    output += '\n';

    // Days of week
    for (let weekDay = 0; weekDay < 7; weekDay++) {
      output += this.dayLabels[weekDay].substring(0, 3) + '  ';
      
      for (let i = months - 1; i >= 0; i--) {
        const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const daysInMonth = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0).getDate();
        
        // Get average activity for this weekday in this month
        let totalActivity = 0;
        let dayCount = 0;
        
        for (let day = 1; day <= daysInMonth; day++) {
          const date = new Date(monthDate.getFullYear(), monthDate.getMonth(), day);
          if (date.getDay() === (weekDay + 1) % 7) { // Convert Mon=0 to JS Sunday=0
            const dateStr = date.toISOString().split('T')[0];
            totalActivity += activity[dateStr] || 0;
            dayCount++;
          }
        }
        
        const avgActivity = dayCount > 0 ? totalActivity / dayCount : 0;
        const blockIndex = Math.min(3, Math.floor(avgActivity));
        output += blocks[blockIndex] + '   ';
      }
      output += '\n';
    }
    
    output += '\n░ None  ▒ Low  ▓ Medium  █ High\n';
    output += '```';
    
    return output;
  }

  /**
   * Generate simple streak visualization
   * @param {number} streak - Current streak
   * @param {number} maxDisplay - Max days to display
   * @returns {string} Streak visualization
   */
  generateStreakBar(streak, maxDisplay = 30) {
    const filled = Math.min(streak, maxDisplay);
    const empty = maxDisplay - filled;
    
    let bar = '`';
    bar += '🔥'.repeat(Math.min(5, Math.floor(filled / 6)));
    bar += '▓'.repeat(filled % 6 > 0 ? filled % 6 : 0);
    bar += '░'.repeat(Math.max(0, empty));
    bar += '`';
    
    return bar;
  }

  /**
   * Get activity summary
   * @param {string} discordId - User's Discord ID
   * @returns {Object} Activity summary
   */
  async getActivitySummary(discordId) {
    const now = new Date();
    const activity = await this.getUserActivity(discordId, now.getFullYear());
    
    const totalActivities = Object.values(activity).reduce((a, b) => a + b, 0);
    const activeDays = Object.keys(activity).length;
    const dayOfYear = Math.floor((now - new Date(now.getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24));
    
    // Calculate current streak
    let currentStreak = 0;
    const today = now.toISOString().split('T')[0];
    let checkDate = new Date(now);
    
    while (true) {
      const dateStr = checkDate.toISOString().split('T')[0];
      if (activity[dateStr]) {
        currentStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    // Find longest streak
    let longestStreak = 0;
    let tempStreak = 0;
    const sortedDates = Object.keys(activity).sort();
    
    for (let i = 0; i < sortedDates.length; i++) {
      if (i === 0) {
        tempStreak = 1;
      } else {
        const prevDate = new Date(sortedDates[i - 1]);
        const currDate = new Date(sortedDates[i]);
        const diffDays = (currDate - prevDate) / (1000 * 60 * 60 * 24);
        
        if (diffDays === 1) {
          tempStreak++;
        } else {
          longestStreak = Math.max(longestStreak, tempStreak);
          tempStreak = 1;
        }
      }
    }
    longestStreak = Math.max(longestStreak, tempStreak);

    return {
      totalActivities,
      activeDays,
      dayOfYear,
      activityRate: ((activeDays / dayOfYear) * 100).toFixed(1),
      currentStreak,
      longestStreak,
      averagePerDay: (totalActivities / Math.max(1, activeDays)).toFixed(1)
    };
  }
}

export const heatmapGenerator = new HeatmapGenerator();
export default heatmapGenerator;
