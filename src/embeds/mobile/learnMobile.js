// src/embeds/mobile/learnMobile.js
import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { MOBILE, mobileWrap, mobileNumber } from '../../utils/mobileUI.js';

const topicEmojis = {
  python: '🐍', javascript: '⚡', react: '⚛️',
  nodejs: '💚', html: '🌐', css: '🎨',
  sql: '🗃️', git: '📚', typescript: '💙',
  java: '☕', cpp: '⚙️', csharp: '🎯',
  default: '📖'
};

export function createMobileLearnEmbed(topic, lessonContent, user, keyPoints = []) {
  const emoji = topicEmojis[topic?.toLowerCase()] || topicEmojis.default;
  
  // Mobile: Shorter lesson content
  const mobileLesson = lessonContent?.length > 800 
    ? lessonContent.substring(0, 800) + '...\n\n*Tap "More" for full lesson*'
    : lessonContent;

  const embed = new EmbedBuilder()
    .setColor(MOBILE.colors.PRIMARY)
    .setAuthor({
      name: '📖 Lesson'
    })
    .setTitle(`${emoji} ${topic}`)
    .setDescription(`
${MOBILE.separators.thin}

${mobileLesson || 'Loading lesson content...'}

${keyPoints.length > 0 ? `
${MOBILE.separators.thin}

📌 **Key Points:**
${keyPoints.slice(0, 3).map((p, i) => `${i + 1}. ${p}`).join('\n')}
` : ''}
    `)
    .addFields({
      name: '🎁 Rewards',
      value: `✨ +40 XP • 📚 ${(user?.lessonsCompleted?.length || 0) + 1} lessons`,
      inline: false
    })
    .setFooter({
      text: '💡 Take a quiz to test!'
    });

  // Mobile: 3 buttons max per row
  const row1 = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId(`quiz_${topic}_easy`)
        .setLabel('🟢 Easy Quiz')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId(`quiz_${topic}_medium`)
        .setLabel('🟡 Medium')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId(`quiz_${topic}_hard`)
        .setLabel('🔴 Hard')
        .setStyle(ButtonStyle.Danger)
    );

  const row2 = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId(`learn_more_${topic}`)
        .setLabel('📖 More')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId(`practice_${topic}`)
        .setLabel('💻 Code')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('lesson_bookmark')
        .setLabel('🔖 Save')
        .setStyle(ButtonStyle.Secondary)
    );

  return { embeds: [embed], components: [row1, row2] };
}

// Mobile Loading State
export function createMobileLearnLoadingEmbed(topic) {
  const emoji = topicEmojis[topic?.toLowerCase()] || topicEmojis.default;
  
  const embed = new EmbedBuilder()
    .setColor(MOBILE.colors.INFO)
    .setDescription(`
╭─────────────╮
│             │
│ 🧠 Creating │
│   lesson... │
│             │
│  ▰▰▰▱▱▱▱▱  │
│             │
╰─────────────╯

${emoji} Topic: **${topic}**
    `);

  return { embeds: [embed], components: [] };
}

// Mobile XP Gain Notification
export function createMobileXPGainEmbed(xpGained, newTotal, leveledUp = false, newLevel = null) {
  if (leveledUp) {
    return new EmbedBuilder()
      .setColor(MOBILE.colors.XP)
      .setDescription(`
╭─────────────╮
│  🎉 LEVEL   │
│     UP!     │
│             │
│  → Lv.${newLevel}    │
│             │
│ ✨+${xpGained} XP   │
╰─────────────╯
      `);
  }

  return new EmbedBuilder()
    .setColor(MOBILE.colors.XP)
    .setDescription(`
╭─────────────╮
│ ✨ +${xpGained} XP  │
│             │
│ Total: ${mobileNumber(newTotal)} │
╰─────────────╯
    `);
}

// Topic selection for learning (mobile)
export function createMobileTopicSelectEmbed() {
  const embed = new EmbedBuilder()
    .setColor(MOBILE.colors.PRIMARY)
    .setTitle('📚 Choose Topic')
    .setDescription(`
${MOBILE.separators.thin}

**Popular Topics:**

🐍 Python - Beginner friendly
⚡ JavaScript - Web & apps
💙 TypeScript - Typed JS
⚛️ React - UI library
💚 Node.js - Backend JS

${MOBILE.separators.thin}

Or type any topic!
    `)
    .setFooter({ text: '👇 Select below' });

  const row1 = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('learn_python')
        .setLabel('🐍 Python')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('learn_javascript')
        .setLabel('⚡ JS')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('learn_typescript')
        .setLabel('💙 TS')
        .setStyle(ButtonStyle.Primary)
    );

  const row2 = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('learn_react')
        .setLabel('⚛️ React')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('learn_nodejs')
        .setLabel('💚 Node')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('learn_more_topics')
        .setLabel('📋 More')
        .setStyle(ButtonStyle.Secondary)
    );

  return { embeds: [embed], components: [row1, row2] };
}

export default {
  createMobileLearnEmbed,
  createMobileLearnLoadingEmbed,
  createMobileXPGainEmbed,
  createMobileTopicSelectEmbed
};
