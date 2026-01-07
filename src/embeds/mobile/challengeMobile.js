// src/embeds/mobile/challengeMobile.js
import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { MOBILE, mobileProgressBar, mobileNumber } from '../../utils/mobileUI.js';

// Challenge invitation (mobile)
export function createMobileChallengeInviteEmbed(challenger, opponent, topic) {
  const embed = new EmbedBuilder()
    .setColor(MOBILE.colors.PRIMARY)
    .setTitle('⚔️ Challenge!')
    .setDescription(`
${MOBILE.separators.thin}

**${challenger?.username || 'Challenger'}**
      ⚔️
**${opponent?.username || 'Opponent'}**

${MOBILE.separators.thin}

📚 **Topic:** ${topic || 'Random'}
📝 **Questions:** 5
⏱️ **Time:** 15s each

🏆 **Winner:** +100 XP
💔 **Loser:** +25 XP

${MOBILE.separators.thin}

⏳ Expires in 60 seconds
    `)
    .setFooter({ text: `${opponent?.username || 'Opponent'}, accept?` });

  const row = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('challenge_accept')
        .setLabel('✅ Accept')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId('challenge_decline')
        .setLabel('❌ Decline')
        .setStyle(ButtonStyle.Danger)
    );

  return { embeds: [embed], components: [row] };
}

// Challenge in progress (mobile)
export function createMobileChallengeQuestionEmbed(question, questionNum, challenger, opponent, scores) {
  const questionText = question?.text || question?.question || 'Loading...';
  const mobileQuestion = questionText.length > 120 
    ? questionText.substring(0, 117) + '...'
    : questionText;
  
  const options = question?.options || ['A', 'B', 'C', 'D'];

  const embed = new EmbedBuilder()
    .setColor(MOBILE.colors.WARNING)
    .setAuthor({
      name: `⚔️ Q${questionNum}/5`
    })
    .setDescription(`
**${challenger?.username?.substring(0, 10) || 'P1'}** ${scores?.challenger || 0} - ${scores?.opponent || 0} **${opponent?.username?.substring(0, 10) || 'P2'}**

${MOBILE.separators.thin}

**${mobileQuestion}**

${MOBILE.separators.thin}

🅰️ ${options[0]}

🅱️ ${options[1]}

🅲️ ${options[2]}

🅳️ ${options[3]}
    `)
    .setFooter({ text: '⏱️ 15 seconds!' });

  const row = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('challenge_a')
        .setLabel('A')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('challenge_b')
        .setLabel('B')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('challenge_c')
        .setLabel('C')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('challenge_d')
        .setLabel('D')
        .setStyle(ButtonStyle.Primary)
    );

  return { embeds: [embed], components: [row] };
}

// Challenge results (mobile)
export function createMobileChallengeResultEmbed(winner, loser, scores, topic) {
  const isDraw = scores?.winner === scores?.loser;

  const embed = new EmbedBuilder()
    .setColor(isDraw ? MOBILE.colors.WARNING : MOBILE.colors.SUCCESS)
    .setTitle(isDraw ? '🤝 Draw!' : '🏆 Victory!')
    .setDescription(`
${MOBILE.separators.sparkle}

${isDraw ? `
**Both scored ${scores?.winner || 0}/5!**

${winner?.username || 'Player 1'} 🤝 ${loser?.username || 'Player 2'}

✨ +50 XP each
` : `
**${winner?.username || 'Winner'}** wins!

${scores?.winner || 0} - ${scores?.loser || 0}

${winner?.username || 'Winner'}: ✨ +100 XP
${loser?.username || 'Loser'}: ✨ +25 XP
`}

${MOBILE.separators.sparkle}

📚 Topic: ${topic || 'General'}
    `)
    .setFooter({ text: '⚔️ Rematch?' });

  const row = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('challenge_rematch')
        .setLabel('🔄 Rematch')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('challenge_new')
        .setLabel('👤 New')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('view_profile')
        .setLabel('📊')
        .setStyle(ButtonStyle.Secondary)
    );

  return { embeds: [embed], components: [row] };
}

// Waiting for opponent (mobile)
export function createMobileChallengeWaitingEmbed(challenger, opponent, topic) {
  const embed = new EmbedBuilder()
    .setColor(MOBILE.colors.INFO)
    .setTitle('⏳ Waiting...')
    .setDescription(`
${MOBILE.separators.thin}

Challenge sent to **${opponent?.username || 'opponent'}**

📚 Topic: **${topic || 'Random'}**

⏳ Waiting for response...

${MOBILE.separators.thin}

*Expires in 60 seconds*
    `)
    .setFooter({ text: '🎯 They have 60s to accept' });

  const row = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('challenge_cancel')
        .setLabel('❌ Cancel')
        .setStyle(ButtonStyle.Danger)
    );

  return { embeds: [embed], components: [row] };
}

// Challenge declined (mobile)
export function createMobileChallengeDeclinedEmbed(opponent) {
  const embed = new EmbedBuilder()
    .setColor(MOBILE.colors.ERROR)
    .setTitle('❌ Declined')
    .setDescription(`
${MOBILE.separators.thin}

**${opponent?.username || 'Opponent'}** declined.

${MOBILE.separators.thin}

💡 Try challenging someone else!
    `)
    .setFooter({ text: '🎯 Practice with a quiz instead?' });

  const row = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('quick_quiz')
        .setLabel('🎯 Quiz')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('challenge_find')
        .setLabel('🔍 Find Match')
        .setStyle(ButtonStyle.Secondary)
    );

  return { embeds: [embed], components: [row] };
}

export default {
  createMobileChallengeInviteEmbed,
  createMobileChallengeQuestionEmbed,
  createMobileChallengeResultEmbed,
  createMobileChallengeWaitingEmbed,
  createMobileChallengeDeclinedEmbed
};
