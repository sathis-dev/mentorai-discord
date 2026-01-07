// src/embeds/mobile/dailyMobile.js
import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { MOBILE, mobileNumber, getMultiplier, getStreakMessage } from '../../utils/mobileUI.js';

// Mobile Slot Machine Animation Frames
export const mobileSlotFrames = [
  { slots: '🔄 🔄 🔄', text: 'Spinning...' },
  { slots: '⭐ 🔄 🔄', text: 'Spinning...' },
  { slots: '⭐ ⭐ 🔄', text: 'Almost...' },
  { slots: '⭐ ⭐ ⭐', text: 'JACKPOT!' }
];

export function createMobileDailySpinEmbed(frameIndex) {
  const frame = mobileSlotFrames[frameIndex] || mobileSlotFrames[0];
  
  return new EmbedBuilder()
    .setColor(MOBILE.colors.XP)
    .setDescription(`
╭─────────────╮
│             │
│  🎰 DAILY   │
│             │
│ ${frame.slots} │
│             │
│ ${frame.text.padStart(10)}  │
│             │
╰─────────────╯
    `);
}

export function createMobileDailyResultEmbed(baseXP, streakBonus, totalXP, streak, user) {
  const embed = new EmbedBuilder()
    .setColor(MOBILE.colors.XP)
    .setTitle('🎉 Daily Claimed!')
    .setDescription(`
╭─────────────╮
│             │
│ ⭐ ⭐ ⭐   │
│  JACKPOT!   │
│             │
╰─────────────╯

💰 **Rewards:**
✨ Base: +${baseXP}
🔥 Streak: +${streakBonus}
${'─'.repeat(13)}
💎 **Total: +${totalXP}**

${MOBILE.separators.thin}

🔥 **Streak:** ${streak} days
⚡ **Multiplier:** ${getMultiplier(streak)}x

${getStreakMessage(streak)}
    `)
    .setFooter({
      text: '⏰ Next: 24 hours'
    });

  const row = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('daily_quiz')
        .setLabel('🎯 Quiz')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('daily_learn')
        .setLabel('📖 Learn')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId('daily_share')
        .setLabel('📤')
        .setStyle(ButtonStyle.Secondary)
    );

  return { embeds: [embed], components: [row] };
}

export function createMobileDailyAlreadyClaimedEmbed(hoursLeft, minutesLeft, user) {
  const embed = new EmbedBuilder()
    .setColor(MOBILE.colors.WARNING)
    .setTitle('⏰ Already Claimed!')
    .setDescription(`
╭─────────────╮
│             │
│  ⏳ Wait    │
│             │
│  ${hoursLeft}h ${minutesLeft}m     │
│             │
╰─────────────╯

🔥 Streak: **${user?.streak || 0}** days
⚡ Multi: **${getMultiplier(user?.streak || 0)}x**

💡 *Don't break it!*
    `)
    .setFooter({ text: '🎯 Do a quiz while waiting!' });

  const row = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('quick_quiz')
        .setLabel('🎯 Quick Quiz')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('view_streak')
        .setLabel('🔥 Streak')
        .setStyle(ButtonStyle.Secondary)
    );

  return { embeds: [embed], components: [row] };
}

// Daily rewards preview (mobile)
export function createMobileDailyPreviewEmbed(user) {
  const streak = user?.streak || 0;
  const multiplier = getMultiplier(streak);
  const baseReward = 50;
  const estimatedTotal = Math.round(baseReward * multiplier);

  const embed = new EmbedBuilder()
    .setColor(MOBILE.colors.SUCCESS)
    .setTitle('🎁 Daily Bonus')
    .setDescription(`
${MOBILE.separators.thin}

**Ready to claim!**

╭─────────────╮
│             │
│  🎰 SPIN    │
│             │
│ ❓ ❓ ❓   │
│             │
╰─────────────╯

${MOBILE.separators.thin}

🔥 Streak: **${streak}** days
⚡ Multiplier: **${multiplier}x**
💰 Est. reward: **~${estimatedTotal} XP**

${MOBILE.separators.thin}

${getStreakMessage(streak)}
    `)
    .setFooter({ text: '👇 Tap to claim!' });

  const row = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('daily_claim')
        .setLabel('🎰 Claim Daily!')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId('view_streak')
        .setLabel('🔥 Streak')
        .setStyle(ButtonStyle.Secondary)
    );

  return { embeds: [embed], components: [row] };
}

export default {
  mobileSlotFrames,
  createMobileDailySpinEmbed,
  createMobileDailyResultEmbed,
  createMobileDailyAlreadyClaimedEmbed,
  createMobileDailyPreviewEmbed
};
