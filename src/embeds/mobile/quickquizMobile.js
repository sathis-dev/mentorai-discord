// src/embeds/mobile/quickquizMobile.js
import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { MOBILE } from '../../utils/mobileUI.js';

export function createMobileQuickQuizEmbed(question, topic) {
  const questionText = question?.text || question?.question || 'Loading...';
  const mobileQuestion = questionText.length > 120 
    ? questionText.substring(0, 117) + '...'
    : questionText;
  
  const options = question?.options || ['A', 'B', 'C', 'D'];

  const embed = new EmbedBuilder()
    .setColor(MOBILE.colors.INFO)
    .setAuthor({ name: '⚡ Quick Quiz' })
    .setDescription(`
📚 ${topic || 'Random'}

${MOBILE.separators.thin}

**${mobileQuestion}**

${MOBILE.separators.thin}

🅰️ ${options[0]}

🅱️ ${options[1]}

🅲️ ${options[2]}

🅳️ ${options[3]}
    `)
    .setFooter({ text: '✨ +20 XP if correct!' });

  const row = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('qq_a')
        .setLabel('A')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('qq_b')
        .setLabel('B')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('qq_c')
        .setLabel('C')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('qq_d')
        .setLabel('D')
        .setStyle(ButtonStyle.Primary)
    );

  return { embeds: [embed], components: [row] };
}

// Quick quiz result (mobile)
export function createMobileQuickQuizResultEmbed(correct, correctAnswer, explanation, xpEarned) {
  const mobileExplanation = explanation?.length > 80 
    ? explanation.substring(0, 77) + '...'
    : explanation || '';

  const embed = new EmbedBuilder()
    .setColor(correct ? MOBILE.colors.SUCCESS : MOBILE.colors.ERROR)
    .setDescription(`
╭─────────────╮
│             │
│  ${correct ? '✅ RIGHT!' : '❌ Wrong'}   │
│             │
${correct ? `│  ✨ +${xpEarned || 20} XP  │` : `│  Answer: ${correctAnswer || '?'}  │`}
│             │
╰─────────────╯

${mobileExplanation ? `💡 ${mobileExplanation}` : ''}
    `);

  const row = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('quickquiz_another')
        .setLabel('⚡ Another')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('start_quiz')
        .setLabel('🎯 Full Quiz')
        .setStyle(ButtonStyle.Success)
    );

  return { embeds: [embed], components: [row] };
}

// Quick quiz topic selection (mobile)
export function createMobileQuickQuizTopicEmbed() {
  const embed = new EmbedBuilder()
    .setColor(MOBILE.colors.PRIMARY)
    .setTitle('⚡ Quick Quiz')
    .setDescription(`
${MOBILE.separators.thin}

**Select a topic:**

🐍 Python
⚡ JavaScript
💙 TypeScript
🎲 Random

${MOBILE.separators.thin}

*One question, instant feedback!*
    `)
    .setFooter({ text: '👇 Choose topic' });

  const row1 = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('qq_topic_python')
        .setLabel('🐍 Python')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('qq_topic_javascript')
        .setLabel('⚡ JS')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('qq_topic_typescript')
        .setLabel('💙 TS')
        .setStyle(ButtonStyle.Primary)
    );

  const row2 = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('qq_topic_random')
        .setLabel('🎲 Random')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId('qq_topic_more')
        .setLabel('📋 More')
        .setStyle(ButtonStyle.Secondary)
    );

  return { embeds: [embed], components: [row1, row2] };
}

// Quick quiz streak bonus (mobile)
export function createMobileQuickQuizStreakEmbed(streakCount, bonusXP) {
  const embed = new EmbedBuilder()
    .setColor(MOBILE.colors.XP)
    .setDescription(`
╭─────────────╮
│             │
│  🔥 STREAK! │
│             │
│  ${streakCount} in a row │
│             │
│  ✨ +${bonusXP} XP  │
│             │
╰─────────────╯

Keep going for bigger bonuses!
    `);

  return { embeds: [embed] };
}

export default {
  createMobileQuickQuizEmbed,
  createMobileQuickQuizResultEmbed,
  createMobileQuickQuizTopicEmbed,
  createMobileQuickQuizStreakEmbed
};
