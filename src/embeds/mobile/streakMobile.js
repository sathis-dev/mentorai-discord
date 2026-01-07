// src/embeds/mobile/streakMobile.js
import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { MOBILE, mobileProgressBar, getMultiplier, getStreakTip } from '../../utils/mobileUI.js';

export function createMobileStreakEmbed(user) {
  const streak = user?.streak || 0;
  const bestStreak = user?.bestStreak || 0;
  const multiplier = getMultiplier(streak);
  
  // Streak milestones
  const milestones = [3, 7, 14, 30, 60, 100];
  const nextMilestone = milestones.find(m => m > streak) || 100;
  const prevMilestone = [...milestones].reverse().find(m => m <= streak) || 0;
  
  // Visual streak fire
  const fireLevel = streak >= 30 ? '🔥🔥🔥' : streak >= 7 ? '🔥🔥' : streak >= 1 ? '🔥' : '❄️';
  
  // Calendar week view (mobile compact)
  const today = new Date().getDay();
  const weekDays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  const weekView = weekDays.map((day, i) => {
    if (i < today) return '✅'; // Past days (assume completed if streak active)
    if (i === today) return streak > 0 ? '🔥' : '⭕';
    return '⬜'; // Future days
  }).join(' ');

  const embed = new EmbedBuilder()
    .setColor(MOBILE.colors.STREAK)
    .setTitle(`${fireLevel} Streak`)
    .setDescription(`
${MOBILE.separators.thin}

╭─────────────────╮
│                 │
│    **${streak}** DAYS    │
│                 │
│  ${fireLevel.padStart(10)}       │
│                 │
╰─────────────────╯

⚡ **Multiplier:** ${multiplier}x

${MOBILE.separators.thin}

**This Week:**
${weekView}

${MOBILE.separators.thin}

🏆 **Best:** ${bestStreak} days
🎯 **Next:** ${nextMilestone} days

${mobileProgressBar(streak - prevMilestone, nextMilestone - prevMilestone, 8)}
${streak}/${nextMilestone}

${MOBILE.separators.thin}

${getStreakTip(streak)}
    `)
    .setFooter({ text: '⏰ Resets at midnight UTC' });

  const row = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('claim_daily')
        .setLabel('🎁 Daily')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId('quick_quiz')
        .setLabel('🎯 Quiz')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('streak_share')
        .setLabel('📤')
        .setStyle(ButtonStyle.Secondary)
    );

  return { embeds: [embed], components: [row] };
}

// Streak at risk warning (mobile)
export function createMobileStreakWarningEmbed(user, hoursLeft) {
  const embed = new EmbedBuilder()
    .setColor(MOBILE.colors.WARNING)
    .setTitle('⚠️ Streak at Risk!')
    .setDescription(`
╭─────────────────╮
│                 │
│  🔥 ${user?.streak || 0} DAYS     │
│                 │
│  ⏰ ${hoursLeft || 0}h left!   │
│                 │
╰─────────────────╯

Don't lose your **${getMultiplier(user?.streak || 0)}x** bonus!

Do any activity to save it:
• 📖 /learn
• 🎯 /quiz
• 🎁 /daily
    `)
    .setFooter({ text: '💡 Quick quiz takes 2 mins!' });

  const row = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('quick_quiz')
        .setLabel('🎯 Save Streak!')
        .setStyle(ButtonStyle.Danger)
    );

  return { embeds: [embed], components: [row] };
}

// Streak broken notification (mobile)
export function createMobileStreakBrokenEmbed(previousStreak) {
  const embed = new EmbedBuilder()
    .setColor(MOBILE.colors.ERROR)
    .setTitle('💔 Streak Lost')
    .setDescription(`
╭─────────────────╮
│                 │
│    ❄️ 0 DAYS    │
│                 │
│  Was: ${previousStreak || 0} days   │
│                 │
╰─────────────────╯

Your **${previousStreak || 0}** day streak ended.

${MOBILE.separators.thin}

💪 Don't give up!
Start a new streak today!
    `)
    .setFooter({ text: '🔥 Every master was once a beginner' });

  const row = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('claim_daily')
        .setLabel('🎁 Start Fresh!')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId('quick_quiz')
        .setLabel('🎯 Quiz')
        .setStyle(ButtonStyle.Primary)
    );

  return { embeds: [embed], components: [row] };
}

// Streak milestone reached (mobile)
export function createMobileStreakMilestoneEmbed(streak, bonusXP) {
  const milestoneEmojis = {
    3: '⚡',
    7: '🔥',
    14: '💎',
    30: '👑',
    60: '🏆',
    100: '🌟'
  };

  const emoji = milestoneEmojis[streak] || '🔥';

  const embed = new EmbedBuilder()
    .setColor(MOBILE.colors.XP)
    .setDescription(`
╭─────────────────╮
│                 │
│  ${emoji} MILESTONE!  │
│                 │
│   ${streak} DAYS!     │
│                 │
│  ✨ +${bonusXP} XP    │
│                 │
╰─────────────────╯

New multiplier: **${getMultiplier(streak)}x**

${getStreakTip(streak)}
    `);

  return { embeds: [embed] };
}

export default {
  createMobileStreakEmbed,
  createMobileStreakWarningEmbed,
  createMobileStreakBrokenEmbed,
  createMobileStreakMilestoneEmbed
};
