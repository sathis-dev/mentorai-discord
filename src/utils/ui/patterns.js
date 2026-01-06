/**
 * MentorAI Advanced UI Patterns
 * Reusable UI components: pagination, confirmations, animations
 */

import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } from 'discord.js';
import { Colors } from './colors.js';
import { Visual } from './visualElements.js';

// ============================================
// EMBED PAGINATOR
// ============================================

/**
 * Reusable embed pagination system
 */
export class EmbedPaginator {
  constructor(pages, userId, options = {}) {
    this.pages = pages;
    this.currentPage = 0;
    this.userId = userId;
    this.timeout = options.timeout || 120000; // 2 minutes
    this.showPageNumbers = options.showPageNumbers !== false;
  }
  
  getComponents() {
    return new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('page_first')
          .setEmoji('⏮️')
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(this.currentPage === 0),
        new ButtonBuilder()
          .setCustomId('page_prev')
          .setEmoji('◀️')
          .setStyle(ButtonStyle.Primary)
          .setDisabled(this.currentPage === 0),
        new ButtonBuilder()
          .setCustomId('page_indicator')
          .setLabel(`${this.currentPage + 1} / ${this.pages.length}`)
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(true),
        new ButtonBuilder()
          .setCustomId('page_next')
          .setEmoji('▶️')
          .setStyle(ButtonStyle.Primary)
          .setDisabled(this.currentPage === this.pages.length - 1),
        new ButtonBuilder()
          .setCustomId('page_last')
          .setEmoji('⏭️')
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(this.currentPage === this.pages.length - 1)
      );
  }
  
  getCurrentEmbed() {
    return this.pages[this.currentPage];
  }
  
  async handleInteraction(interaction) {
    if (interaction.user.id !== this.userId) {
      return interaction.reply({ 
        content: '❌ This menu belongs to someone else!', 
        ephemeral: true 
      });
    }
    
    switch (interaction.customId) {
      case 'page_first': this.currentPage = 0; break;
      case 'page_prev': this.currentPage = Math.max(0, this.currentPage - 1); break;
      case 'page_next': this.currentPage = Math.min(this.pages.length - 1, this.currentPage + 1); break;
      case 'page_last': this.currentPage = this.pages.length - 1; break;
    }
    
    await interaction.update({
      embeds: [this.getCurrentEmbed()],
      components: [this.getComponents()]
    });
  }
}

// ============================================
// CONFIRMATION DIALOG
// ============================================

/**
 * Create a confirmation dialog and wait for response
 * @param {Interaction} interaction - Discord interaction
 * @param {Object} options - Configuration options
 * @returns {Promise<boolean>} Whether user confirmed
 */
export async function confirmAction(interaction, options) {
  const { 
    title, 
    description, 
    confirmLabel = 'Confirm', 
    cancelLabel = 'Cancel', 
    dangerous = false,
    timeout = 30000
  } = options;
  
  const embed = new EmbedBuilder()
    .setColor(dangerous ? Colors.ERROR : Colors.WARNING)
    .setTitle(title)
    .setDescription(description);
  
  const buttons = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('confirm_yes')
        .setLabel(confirmLabel)
        .setStyle(dangerous ? ButtonStyle.Danger : ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId('confirm_no')
        .setLabel(cancelLabel)
        .setStyle(ButtonStyle.Secondary)
    );
  
  const msg = await interaction.reply({ 
    embeds: [embed], 
    components: [buttons],
    fetchReply: true 
  });
  
  try {
    const response = await msg.awaitMessageComponent({
      filter: i => i.user.id === interaction.user.id,
      time: timeout
    });
    
    await response.deferUpdate();
    return response.customId === 'confirm_yes';
  } catch {
    // Timeout - disable buttons
    const disabledButtons = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('confirm_yes')
          .setLabel(confirmLabel)
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(true),
        new ButtonBuilder()
          .setCustomId('confirm_no')
          .setLabel(cancelLabel)
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(true)
      );
    
    await msg.edit({ components: [disabledButtons] }).catch(() => {});
    return false;
  }
}

// ============================================
// ANIMATED EMBEDS
// ============================================

/**
 * Show thinking animation while processing
 * @param {Interaction} interaction - Discord interaction
 * @returns {Function} Cleanup function to stop animation
 */
export async function showThinkingAnimation(interaction) {
  const frames = [
    '🤔 Thinking.',
    '🤔 Thinking..',
    '🤔 Thinking...',
    '🧠 Processing.',
    '🧠 Processing..',
    '🧠 Processing...',
    '✨ Generating.',
    '✨ Generating..',
    '✨ Generating...'
  ];
  
  let frameIndex = 0;
  let stopped = false;
  
  const thinkingEmbed = new EmbedBuilder()
    .setColor(Colors.INFO)
    .setDescription(frames[0]);
  
  const msg = await interaction.editReply({ embeds: [thinkingEmbed] });
  
  const interval = setInterval(async () => {
    if (stopped) return;
    frameIndex = (frameIndex + 1) % frames.length;
    const updatedEmbed = new EmbedBuilder()
      .setColor(Colors.INFO)
      .setDescription(frames[frameIndex]);
    await msg.edit({ embeds: [updatedEmbed] }).catch(() => {});
  }, 500);
  
  return () => {
    stopped = true;
    clearInterval(interval);
  };
}

/**
 * Show level up animation
 * @param {TextChannel} channel - Channel to send animation
 * @param {number} oldLevel - Previous level
 * @param {number} newLevel - New level
 * @param {User} user - Discord user
 */
export async function showLevelUpAnimation(channel, oldLevel, newLevel, user) {
  const frames = [
    { bar: '░░░░░░░░', color: Colors.INFO },
    { bar: '▓▓░░░░░░', color: Colors.INFO },
    { bar: '▓▓▓▓░░░░', color: Colors.WARNING },
    { bar: '▓▓▓▓▓▓░░', color: Colors.WARNING },
    { bar: '▓▓▓▓▓▓▓▓', color: Colors.GOLD }
  ];
  
  // Send initial frame
  const msg = await channel.send({
    embeds: [
      new EmbedBuilder()
        .setColor(frames[0].color)
        .setDescription(`
╔═══════════════════════════════════╗
║                                   ║
║         ⚡ LEVEL UP! ⚡           ║
║                                   ║
║            ${frames[0].bar}               ║
║                                   ║
╚═══════════════════════════════════╝
        `)
    ]
  });
  
  // Animate through frames
  for (let i = 1; i < frames.length; i++) {
    await sleep(400);
    await msg.edit({
      embeds: [
        new EmbedBuilder()
          .setColor(frames[i].color)
          .setDescription(`
╔═══════════════════════════════════╗
║                                   ║
║         ⚡ LEVEL UP! ⚡           ║
║                                   ║
║            ${frames[i].bar}               ║
║                                   ║
╚═══════════════════════════════════╝
          `)
      ]
    });
  }
  
  // Final celebration frame
  await sleep(400);
  const rankEmoji = getRankEmoji(newLevel);
  const rankName = getRankName(newLevel);
  
  await msg.edit({
    embeds: [
      new EmbedBuilder()
        .setColor(Colors.GOLD)
        .setTitle('🎉 LEVEL UP! 🎉')
        .setThumbnail(user.displayAvatarURL({ dynamic: true }))
        .setDescription(`
╔═══════════════════════════════════╗
║                                   ║
║     🌟 Congratulations! 🌟        ║
║                                   ║
║       Level ${oldLevel} ➜ Level ${newLevel}          ║
║                                   ║
║     ${rankEmoji} ${rankName}           ║
║                                   ║
╠═══════════════════════════════════╣
║                                   ║
║     🎁 Rewards Unlocked:          ║
║     • +50 Bonus XP                ║
║                                   ║
╚═══════════════════════════════════╝
        `)
        .setFooter({ text: `Total XP: ${user.xp?.toLocaleString() || 0}` })
    ]
  });
}

/**
 * Show slot machine animation for daily rewards
 * @param {Interaction} interaction - Discord interaction
 * @param {Object} rewards - Reward info {baseXP, streakBonus, streak}
 */
export async function showSlotMachineAnimation(interaction, rewards) {
  const { baseXP, streakBonus, streak } = rewards;
  const totalXP = baseXP + streakBonus;
  
  const frames = [
    { slots: '[ 🔄 ] [ 🔄 ] [ 🔄 ]', label: '🎰 SPINNING... 🎰' },
    { slots: '[ ⭐ ] [ 🔄 ] [ 🔄 ]', label: '🎰 SPINNING... 🎰' },
    { slots: '[ ⭐ ] [ ⭐ ] [ 🔄 ]', label: '🎰 SPINNING... 🎰' },
    { slots: '[ ⭐ ] [ ⭐ ] [ ⭐ ]', label: '🎉 JACKPOT! 🎉' }
  ];
  
  // Initial frame
  await interaction.editReply({
    embeds: [
      new EmbedBuilder()
        .setColor(Colors.GOLD)
        .setTitle('🎰 Daily Bonus!')
        .setDescription(`
╔═══════════════════════════════════╗
║                                   ║
║    ${frames[0].label}            ║
║                                   ║
║    ${frames[0].slots}           ║
║                                   ║
╚═══════════════════════════════════╝
        `)
    ]
  });
  
  // Animate slots
  for (let i = 1; i < frames.length; i++) {
    await sleep(800);
    await interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setColor(Colors.GOLD)
          .setTitle('🎰 Daily Bonus!')
          .setDescription(`
╔═══════════════════════════════════╗
║                                   ║
║    ${frames[i].label}            ║
║                                   ║
║    ${frames[i].slots}           ║
║                                   ║
╚═══════════════════════════════════╝
          `)
      ]
    });
  }
  
  // Final result
  await sleep(500);
  await interaction.editReply({
    embeds: [
      new EmbedBuilder()
        .setColor(Colors.GOLD)
        .setTitle('🎰 Daily Bonus!')
        .setDescription(`
╔═══════════════════════════════════╗
║                                   ║
║    🎉  JACKPOT!  🎉               ║
║                                   ║
║    [ ⭐ ] [ ⭐ ] [ ⭐ ]           ║
║                                   ║
╠═══════════════════════════════════╣
║                                   ║
║  💰 **+${baseXP} XP** Base Reward          ║
║  🔥 **+${streakBonus} XP** Streak Bonus (${streak} days) ║
║  ━━━━━━━━━━━━━━━━━━━━━━━━         ║
║  ✨ **Total: +${totalXP} XP**              ║
║                                   ║
╚═══════════════════════════════════╝

🔥 **Streak:** ${streak} days
        `)
        .setFooter({ text: '⏰ Next bonus available in 24 hours' })
    ],
    components: [
      new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('daily_share')
            .setLabel('Share Streak')
            .setEmoji('📤')
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId('exec_quiz')
            .setLabel('Quick Quiz')
            .setEmoji('🎯')
            .setStyle(ButtonStyle.Success)
        )
    ]
  });
}

// ============================================
// SELECT MENUS
// ============================================

/**
 * Create a topic select menu
 */
export function createTopicSelectMenu(topics, customId = 'select_topic') {
  const options = topics.slice(0, 25).map(topic => ({
    label: capitalizeFirst(topic.name || topic),
    value: topic.id || topic.name?.toLowerCase() || topic.toLowerCase(),
    description: topic.description || `Learn about ${topic.name || topic}`,
    emoji: Visual.TOPICS[topic.name?.toLowerCase() || topic.toLowerCase()] || '📖'
  }));
  
  return new ActionRowBuilder()
    .addComponents(
      new StringSelectMenuBuilder()
        .setCustomId(customId)
        .setPlaceholder('📚 Select a topic...')
        .addOptions(options)
    );
}

/**
 * Create a difficulty select menu
 */
export function createDifficultySelectMenu(customId = 'select_difficulty') {
  return new ActionRowBuilder()
    .addComponents(
      new StringSelectMenuBuilder()
        .setCustomId(customId)
        .setPlaceholder('🎯 Select difficulty...')
        .addOptions([
          { label: 'Easy', value: 'easy', description: 'Basic concepts', emoji: '🟢' },
          { label: 'Medium', value: 'medium', description: 'Intermediate level', emoji: '🟡' },
          { label: 'Hard', value: 'hard', description: 'Advanced challenges', emoji: '🔴' }
        ])
    );
}

/**
 * Create a language select menu
 */
export function createLanguageSelectMenu(customId = 'select_language') {
  return new ActionRowBuilder()
    .addComponents(
      new StringSelectMenuBuilder()
        .setCustomId(customId)
        .setPlaceholder('💻 Select a language...')
        .addOptions([
          { label: 'Python', value: 'python', description: 'Beginner friendly', emoji: '🐍' },
          { label: 'JavaScript', value: 'javascript', description: 'Web development', emoji: '⚡' },
          { label: 'TypeScript', value: 'typescript', description: 'Typed JavaScript', emoji: '💠' },
          { label: 'Java', value: 'java', description: 'Enterprise apps', emoji: '☕' },
          { label: 'C++', value: 'cpp', description: 'Systems programming', emoji: '⚙️' },
          { label: 'Go', value: 'go', description: 'Modern systems', emoji: '🐹' },
          { label: 'Rust', value: 'rust', description: 'Safe systems', emoji: '🦀' },
          { label: 'Ruby', value: 'ruby', description: 'Rails framework', emoji: '💎' }
        ])
    );
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function capitalizeFirst(str) {
  return str ? str.charAt(0).toUpperCase() + str.slice(1) : '';
}

function getRankEmoji(level) {
  if (level >= 50) return '👑';
  if (level >= 30) return '💎';
  if (level >= 20) return '🥇';
  if (level >= 10) return '🥈';
  if (level >= 5) return '🥉';
  return '🔰';
}

function getRankName(level) {
  if (level >= 50) return 'Legendary Guru';
  if (level >= 30) return 'Diamond Expert';
  if (level >= 20) return 'Gold Master';
  if (level >= 10) return 'Silver Scholar';
  if (level >= 5) return 'Bronze Learner';
  return 'Newcomer';
}

export default {
  EmbedPaginator,
  confirmAction,
  showThinkingAnimation,
  showLevelUpAnimation,
  showSlotMachineAnimation,
  createTopicSelectMenu,
  createDifficultySelectMenu,
  createLanguageSelectMenu
};
