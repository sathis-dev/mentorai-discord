// src/embeds/mobile/quizMobile.js
import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { MOBILE, mobileProgressBar, mobileNumber } from '../../utils/mobileUI.js';

// Quiz Start Screen (Mobile)
export function createMobileQuizStartEmbed(topic, difficulty, user) {
  const diffConfig = {
    easy: { emoji: '🟢', color: MOBILE.colors.SUCCESS, xp: 15 },
    medium: { emoji: '🟡', color: MOBILE.colors.WARNING, xp: 25 },
    hard: { emoji: '🔴', color: MOBILE.colors.ERROR, xp: 40 }
  };
  
  const config = diffConfig[difficulty] || diffConfig.medium;

  const embed = new EmbedBuilder()
    .setColor(config.color)
    .setTitle(`🎯 ${topic} Quiz`)
    .setDescription(`
${MOBILE.separators.thin}

${config.emoji} **${(difficulty || 'medium').toUpperCase()}**

📝 5 questions
✨ +${config.xp} XP each
🏆 Perfect: +100 bonus

${MOBILE.separators.thin}

🔥 Streak: **${user?.streakMultiplier || 1}x**

**Ready?**
    `)
    .setFooter({ text: '💡 Read carefully!' });

  const row = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('quiz_begin')
        .setLabel('🚀 Start!')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId('quiz_change_diff')
        .setLabel('⚙️ Change')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('quiz_cancel')
        .setLabel('❌')
        .setStyle(ButtonStyle.Danger)
    );

  return { embeds: [embed], components: [row] };
}

// Quiz Question (Mobile)
export function createMobileQuizQuestionEmbed(question, questionNum, total, score, difficulty) {
  const diffConfig = {
    easy: { emoji: '🟢', color: MOBILE.colors.SUCCESS },
    medium: { emoji: '🟡', color: MOBILE.colors.WARNING },
    hard: { emoji: '🔴', color: MOBILE.colors.ERROR }
  };
  
  const config = diffConfig[difficulty] || diffConfig.medium;

  // Mobile: Shorter question display
  const questionText = question?.text || question?.question || 'Loading question...';
  const mobileQuestion = questionText.length > 150 
    ? questionText.substring(0, 147) + '...'
    : questionText;

  const options = question?.options || ['A', 'B', 'C', 'D'];

  const embed = new EmbedBuilder()
    .setColor(config.color)
    .setAuthor({
      name: `Q${questionNum}/${total} ${config.emoji}`
    })
    .setDescription(`
${MOBILE.separators.thin}

**${mobileQuestion}**

${MOBILE.separators.thin}

🅰️ ${options[0]}

🅱️ ${options[1]}

🅲️ ${options[2]}

🅳️ ${options[3]}
    `)
    .setFooter({
      text: `Score: ${score}/${questionNum - 1} ✅`
    });

  // Mobile: Answer buttons only, power-ups in second row
  const row1 = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('answer_0')
        .setLabel('A')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('answer_1')
        .setLabel('B')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('answer_2')
        .setLabel('C')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('answer_3')
        .setLabel('D')
        .setStyle(ButtonStyle.Primary)
    );

  const row2 = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('quiz_hint')
        .setLabel('💡 Hint')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('quiz_5050')
        .setLabel('✂️ 50/50')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('quiz_skip')
        .setLabel('⏭️ Skip')
        .setStyle(ButtonStyle.Danger)
    );

  return { embeds: [embed], components: [row1, row2] };
}

// Correct Answer Feedback (Mobile)
export function createMobileCorrectEmbed(explanation, xpEarned) {
  const mobileExplanation = explanation?.length > 100 
    ? explanation.substring(0, 97) + '...' 
    : explanation || 'Great job!';

  const embed = new EmbedBuilder()
    .setColor(MOBILE.colors.SUCCESS)
    .setDescription(`
╭─────────────╮
│             │
│   ✅ YES!   │
│             │
│  ✨ +${xpEarned || 25} XP  │
│             │
╰─────────────╯

💡 ${mobileExplanation}
    `);

  return { embeds: [embed] };
}

// Wrong Answer Feedback (Mobile)
export function createMobileWrongEmbed(correctAnswer, explanation) {
  const mobileExplanation = explanation?.length > 100 
    ? explanation.substring(0, 97) + '...' 
    : explanation || 'Keep trying!';

  const embed = new EmbedBuilder()
    .setColor(MOBILE.colors.ERROR)
    .setDescription(`
╭─────────────╮
│             │
│   ❌ Oops   │
│             │
│ Answer: ${correctAnswer}  │
│             │
╰─────────────╯

💡 ${mobileExplanation}
    `);

  return { embeds: [embed] };
}

// Quiz Results (Mobile)
export function createMobileQuizResultsEmbed(score, total, xpEarned, bonuses = {}, user = {}, newAchievements = []) {
  const percentage = Math.round((score / total) * 100);
  
  // Dynamic celebration
  let title, color, celebration;
  if (percentage === 100) {
    title = '🎉 PERFECT!';
    color = MOBILE.colors.XP;
    celebration = '⭐⭐⭐⭐⭐';
  } else if (percentage >= 80) {
    title = '⭐ Excellent!';
    color = MOBILE.colors.SUCCESS;
    celebration = '⭐⭐⭐⭐';
  } else if (percentage >= 60) {
    title = '👍 Good Job!';
    color = MOBILE.colors.INFO;
    celebration = '⭐⭐⭐';
  } else if (percentage >= 40) {
    title = '📚 Keep Going!';
    color = MOBILE.colors.WARNING;
    celebration = '⭐⭐';
  } else {
    title = '💪 Practice More';
    color = MOBILE.colors.ERROR;
    celebration = '⭐';
  }

  // Calculate total XP
  const totalXP = (xpEarned || 0) + (bonuses.perfect || 0) + (bonuses.streak || 0);

  let description = `
╭─────────────────╮
│                 │
│   ${title.padStart(12)}    │
│                 │
│   ${celebration.padStart(13)}   │
│                 │
│   ${score}/${total} = ${percentage}%     │
│   ${mobileProgressBar(score, total, 8)}  │
│                 │
╰─────────────────╯

💰 **XP Breakdown:**
✨ Base: +${xpEarned || 0}`;

  if (bonuses.perfect) {
    description += `\n🏆 Perfect: +${bonuses.perfect}`;
  }
  if (bonuses.streak) {
    description += `\n🔥 Streak: +${bonuses.streak}`;
  }
  
  description += `\n${'─'.repeat(15)}\n💎 **Total: +${totalXP} XP**`;

  // Add achievements if any
  if (newAchievements.length > 0) {
    description += `\n\n🏆 **Unlocked:**\n${newAchievements.map(a => `${a.emoji} ${a.name}`).join('\n')}`;
  }

  const embed = new EmbedBuilder()
    .setColor(color)
    .setAuthor({
      name: '📊 Quiz Complete'
    })
    .setDescription(description)
    .setFooter({
      text: `📈 Total XP: ${mobileNumber(user.xp || 0)} • Lv.${user.level || 1}`
    });

  // Mobile: Priority actions only
  const row1 = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('quiz_retry')
        .setLabel('🔄 Retry')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('quiz_harder')
        .setLabel('⬆️ Harder')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId('quiz_new')
        .setLabel('🎲 New')
        .setStyle(ButtonStyle.Secondary)
    );

  const row2 = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('view_profile')
        .setLabel('👤 Profile')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('quiz_share')
        .setLabel('📤 Share')
        .setStyle(ButtonStyle.Secondary)
    );

  return { embeds: [embed], components: [row1, row2] };
}

export default {
  createMobileQuizStartEmbed,
  createMobileQuizQuestionEmbed,
  createMobileCorrectEmbed,
  createMobileWrongEmbed,
  createMobileQuizResultsEmbed
};
