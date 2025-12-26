import { 
  EmbedBuilder, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle,
  StringSelectMenuBuilder,
  ComponentType
} from 'discord.js';
import { COLORS, EMOJIS } from '../config/designSystem.js';

/**
 * Advanced UI Components and Interactions
 */

// ============================================================
// PAGINATED EMBEDS
// ============================================================

export class PaginatedEmbed {
  constructor(interaction, pages, options = {}) {
    this.interaction = interaction;
    this.pages = pages;
    this.currentPage = 0;
    this.timeout = options.timeout || 120000;
    this.ephemeral = options.ephemeral || false;
  }

  createNavigationRow() {
    return new ActionRowBuilder().addComponents(
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
        .setLabel((this.currentPage + 1) + ' / ' + this.pages.length)
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

  async start() {
    const message = await this.interaction.editReply({
      embeds: [this.pages[0]],
      components: [this.createNavigationRow()]
    });

    const collector = message.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: this.timeout
    });

    collector.on('collect', async (i) => {
      if (i.user.id !== this.interaction.user.id) {
        await i.reply({ content: '❌ This is not your menu!', ephemeral: true });
        return;
      }

      switch (i.customId) {
        case 'page_first':
          this.currentPage = 0;
          break;
        case 'page_prev':
          this.currentPage = Math.max(0, this.currentPage - 1);
          break;
        case 'page_next':
          this.currentPage = Math.min(this.pages.length - 1, this.currentPage + 1);
          break;
        case 'page_last':
          this.currentPage = this.pages.length - 1;
          break;
      }

      await i.update({
        embeds: [this.pages[this.currentPage]],
        components: [this.createNavigationRow()]
      });
    });

    collector.on('end', async () => {
      try {
        const disabledRow = new ActionRowBuilder().addComponents(
          ...this.createNavigationRow().components.map(btn => 
            ButtonBuilder.from(btn).setDisabled(true)
          )
        );
        await this.interaction.editReply({ components: [disabledRow] });
      } catch (e) {
        // Message might be deleted
      }
    });
  }
}

// ============================================================
// CONFIRMATION DIALOGS
// ============================================================

export async function confirmationDialog(interaction, options = {}) {
  const {
    title = 'Confirm Action',
    description = 'Are you sure you want to proceed?',
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    confirmStyle = ButtonStyle.Success,
    timeout = 30000
  } = options;

  const embed = new EmbedBuilder()
    .setTitle('⚠️ ' + title)
    .setColor(COLORS.WARNING)
    .setDescription(description)
    .setFooter({ text: 'This will expire in 30 seconds' });

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('confirm_yes')
      .setLabel(confirmLabel)
      .setStyle(confirmStyle)
      .setEmoji('✅'),
    new ButtonBuilder()
      .setCustomId('confirm_no')
      .setLabel(cancelLabel)
      .setStyle(ButtonStyle.Secondary)
      .setEmoji('❌')
  );

  const response = await interaction.reply({
    embeds: [embed],
    components: [row],
    ephemeral: true,
    fetchReply: true
  });

  try {
    const confirmation = await response.awaitMessageComponent({
      filter: i => i.user.id === interaction.user.id,
      time: timeout
    });

    return confirmation.customId === 'confirm_yes';
  } catch (e) {
    return false;
  }
}

// ============================================================
// MULTI-STEP WIZARD
// ============================================================

export class StepWizard {
  constructor(interaction, steps) {
    this.interaction = interaction;
    this.steps = steps;
    this.currentStep = 0;
    this.data = {};
  }

  createStepIndicator() {
    return this.steps.map((step, i) => {
      if (i < this.currentStep) return '✅';
      if (i === this.currentStep) return '🔵';
      return '⚪';
    }).join(' ➜ ');
  }

  createNavigationRow() {
    return new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('wizard_back')
        .setLabel('Back')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(this.currentStep === 0),
      new ButtonBuilder()
        .setCustomId('wizard_next')
        .setLabel(this.currentStep === this.steps.length - 1 ? 'Finish' : 'Next')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('wizard_cancel')
        .setLabel('Cancel')
        .setStyle(ButtonStyle.Danger)
    );
  }

  async start() {
    await this.showStep();
  }

  async showStep() {
    const step = this.steps[this.currentStep];
    
    const embed = new EmbedBuilder()
      .setTitle(step.title)
      .setColor(COLORS.PRIMARY)
      .setDescription(step.description)
      .addFields({
        name: 'Progress',
        value: this.createStepIndicator(),
        inline: false
      })
      .setFooter({ text: 'Step ' + (this.currentStep + 1) + ' of ' + this.steps.length });

    const components = [this.createNavigationRow()];
    if (step.components) {
      components.unshift(...step.components);
    }

    await this.interaction.editReply({
      embeds: [embed],
      components
    });
  }
}

// ============================================================
// INTERACTIVE MENU SYSTEM
// ============================================================

export function createAdvancedMenu(options = {}) {
  const {
    title = 'Menu',
    description = 'Select an option',
    choices = [],
    placeholder = 'Choose an option...'
  } = options;

  const embed = new EmbedBuilder()
    .setTitle('📋 ' + title)
    .setColor(COLORS.PRIMARY)
    .setDescription(description);

  const selectMenu = new StringSelectMenuBuilder()
    .setCustomId('advanced_menu')
    .setPlaceholder(placeholder)
    .addOptions(choices.map(choice => ({
      label: choice.label,
      description: choice.description,
      value: choice.value,
      emoji: choice.emoji
    })));

  return {
    embed,
    components: [new ActionRowBuilder().addComponents(selectMenu)]
  };
}

// ============================================================
// REAL-TIME STATS DISPLAY
// ============================================================

export function createLiveStatsEmbed(stats) {
  const embed = new EmbedBuilder()
    .setTitle('📊 Live Statistics')
    .setColor(COLORS.PRIMARY)
    .setDescription('Real-time learning statistics')
    .addFields(
      { 
        name: '👥 Active Learners', 
        value: '```\n' + stats.activeUsers + '\n```', 
        inline: true 
      },
      { 
        name: '📝 Quizzes Today', 
        value: '```\n' + stats.quizzesToday + '\n```', 
        inline: true 
      },
      { 
        name: '✨ XP Awarded', 
        value: '```\n' + stats.xpAwarded.toLocaleString() + '\n```', 
        inline: true 
      }
    )
    .setTimestamp()
    .setFooter({ text: '🔄 Updates every 30 seconds' });

  return embed;
}

// ============================================================
// CARD LAYOUTS
// ============================================================

export function createTopicCard(topic) {
  return new EmbedBuilder()
    .setTitle(topic.emoji + ' ' + topic.name)
    .setColor(topic.color || COLORS.LESSON_BLUE)
    .setDescription(topic.description)
    .addFields(
      { name: '📊 Difficulty', value: topic.difficulty || 'All Levels', inline: true },
      { name: '⏱️ Est. Time', value: topic.estimatedTime || '30 mins', inline: true },
      { name: '📚 Lessons', value: (topic.lessonCount || 0) + ' available', inline: true }
    )
    .setThumbnail(topic.thumbnail || null)
    .setFooter({ text: '🎓 MentorAI' });
}

export function createAchievementCard(achievement, unlocked = false) {
  return new EmbedBuilder()
    .setTitle((unlocked ? '🏆' : '🔒') + ' ' + achievement.name)
    .setColor(unlocked ? COLORS.XP_GOLD : COLORS.SECONDARY)
    .setDescription(unlocked ? achievement.desc : '???')
    .addFields(
      { name: 'Reward', value: '+' + (achievement.xpBonus || 0) + ' XP', inline: true },
      { name: 'Rarity', value: achievement.rarity || 'Common', inline: true }
    )
    .setFooter({ text: unlocked ? '✅ Unlocked!' : '🔒 Keep learning to unlock!' });
}

// ============================================================
// VISUAL SEPARATORS & DECORATIONS
// ============================================================

export const DECORATIONS = {
  divider: '━━━━━━━━━━━━━━━━━━━━━━━━━━━',
  doubleDivider: '═══════════════════════════',
  starDivider: '✦═══════════════════════✦',
  dotDivider: '• • • • • • • • • • • • •',
  arrowDivider: '➤➤➤➤➤➤➤➤➤➤➤➤➤➤➤',
  waveDivider: '～～～～～～～～～～～～～',
  sparkDivider: '✨━━━━━━━━━━━━━━━━✨'
};

export function createBanner(text, style = 'default') {
  const styles = {
    default: '╔══════════════════════════╗\n║  ' + text.padEnd(22) + '  ║\n╚══════════════════════════╝',
    simple: '[ ' + text + ' ]',
    fancy: '✧･ﾟ: *✧･ﾟ:* ' + text + ' *:･ﾟ✧*:･ﾟ✧',
    box: '┌─────────────────────────┐\n│  ' + text.padEnd(21) + '  │\n└─────────────────────────┘',
    arrow: '▶▶▶ ' + text + ' ◀◀◀'
  };
  
  return '```\n' + (styles[style] || styles.default) + '\n```';
}

// ============================================================
// STATUS INDICATORS
// ============================================================

export function createStatusIndicator(status, animated = false) {
  const indicators = {
    online: animated ? '🟢' : '🟢',
    idle: animated ? '🟡' : '🟡',
    dnd: animated ? '🔴' : '🔴',
    offline: '⚫',
    loading: animated ? '⏳' : '⌛',
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️'
  };
  
  return indicators[status] || indicators.info;
}

export function createHealthBar(current, max, length = 10) {
  const percentage = current / max;
  const filled = Math.round(percentage * length);
  const empty = length - filled;
  
  let color = '🟩';
  if (percentage <= 0.25) color = '🟥';
  else if (percentage <= 0.5) color = '🟨';
  
  return color.repeat(filled) + '⬜'.repeat(empty);
}
