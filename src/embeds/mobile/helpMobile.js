// src/embeds/mobile/helpMobile.js
import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } from 'discord.js';
import { MOBILE, mobileNumber } from '../../utils/mobileUI.js';

export function createMobileHelpEmbed(user, isNewUser, client) {
  const embed = new EmbedBuilder()
    .setColor(MOBILE.colors.PRIMARY)
    .setAuthor({
      name: '🎓 MentorAI',
      iconURL: client?.user?.displayAvatarURL?.() || undefined
    })
    .setDescription(`
${MOBILE.separators.sparkle}

**Learn to code like a game**

🎯 AI lessons & quizzes
🏆 XP, levels, achievements
⚔️ Challenge friends
💻 Run real code

${MOBILE.separators.sparkle}

${isNewUser 
  ? '🚀 **Ready to start?**' 
  : `📊 Lv.${user.level || 1} • ✨${mobileNumber(user.xp || 0)} • 🔥${user.streak || 0}d`}
    `)
    .setFooter({
      text: '👇 Tap to explore'
    });

  // Mobile-optimized: Fewer buttons, clearer labels
  const row1 = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('help_quickstart')
        .setLabel('🚀 Start')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId('help_action_learn')
        .setLabel('📖 Learn')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('help_action_quiz')
        .setLabel('🎯 Quiz')
        .setStyle(ButtonStyle.Primary)
    );

  const row2 = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('help_action_profile')
        .setLabel('👤 Profile')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('help_action_leaderboard')
        .setLabel('🏆 Compete')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('help_more')
        .setLabel('📋 More')
        .setStyle(ButtonStyle.Secondary)
    );

  return { embeds: [embed], components: [row1, row2] };
}

// Quick Start Mobile
export function createMobileQuickStartEmbed() {
  const embed = new EmbedBuilder()
    .setColor(MOBILE.colors.SUCCESS)
    .setTitle('🚀 Quick Start')
    .setDescription(`
${MOBILE.separators.thin}

**3 easy steps:**

1️⃣ Pick a topic
2️⃣ Take quick quiz
3️⃣ Start learning!

${MOBILE.separators.thin}

🎁 **+100 XP** for setup!

**What to learn?**
    `)
    .setFooter({ text: '👇 Choose below' });

  const row1 = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('start_python')
        .setLabel('🐍 Python')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('start_javascript')
        .setLabel('⚡ JavaScript')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('start_web')
        .setLabel('🌐 Web')
        .setStyle(ButtonStyle.Primary)
    );

  const row2 = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('start_other')
        .setLabel('📚 Other')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('start_random')
        .setLabel('🎲 Surprise')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId('help_action_back')
        .setLabel('◀️ Back')
        .setStyle(ButtonStyle.Secondary)
    );

  return { embeds: [embed], components: [row1, row2] };
}

// Help Categories Mobile (via select menu handler)
export function createMobileHelpCategoryEmbed(category) {
  const categories = {
    learning: {
      title: '📖 Learning',
      commands: [
        '`/learn` - AI lessons',
        '`/explain` - Explanations',
        '`/topics` - Browse all',
        '`/path` - Learning paths'
      ]
    },
    practice: {
      title: '🎯 Practice',
      commands: [
        '`/quiz` - Take quiz',
        '`/quickquiz` - Fast quiz',
        '`/run` - Run code',
        '`/review` - Review mistakes'
      ]
    },
    progress: {
      title: '📊 Progress',
      commands: [
        '`/profile` - Your stats',
        '`/streak` - Streak info',
        '`/achievements` - Badges',
        '`/progress` - Full progress'
      ]
    },
    compete: {
      title: '🏆 Compete',
      commands: [
        '`/challenge` - 1v1 battle',
        '`/arena` - Multiplayer',
        '`/leaderboard` - Rankings',
        '`/weekly` - Challenges'
      ]
    },
    rewards: {
      title: '🎁 Rewards',
      commands: [
        '`/daily` - Daily bonus',
        '`/certificate` - Get cert',
        '`/share` - Share progress',
        '`/referral` - Invite friends'
      ]
    }
  };

  const cat = categories[category] || categories.learning;

  const embed = new EmbedBuilder()
    .setColor(MOBILE.colors.INFO)
    .setTitle(cat.title)
    .setDescription(`
${MOBILE.separators.thin}

${cat.commands.join('\n')}

${MOBILE.separators.thin}
    `)
    .setFooter({ text: '💡 Tap command to use' });

  const row = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('help_action_back')
        .setLabel('◀️ Back')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('help_home')
        .setLabel('🏠 Home')
        .setStyle(ButtonStyle.Primary)
    );

  return { embeds: [embed], components: [row] };
}

// More commands panel (mobile)
export function createMobileMoreCommandsEmbed() {
  const embed = new EmbedBuilder()
    .setColor(MOBILE.colors.INFO)
    .setTitle('📋 All Categories')
    .setDescription(`
${MOBILE.separators.thin}

Select a category to explore:

📖 **Learning** - Lessons & paths
🎯 **Practice** - Quizzes & code
📊 **Progress** - Stats & badges
🏆 **Compete** - PvP & rankings
🎁 **Rewards** - Daily & bonuses

${MOBILE.separators.thin}
    `)
    .setFooter({ text: '👇 Choose below' });

  const selectMenu = new ActionRowBuilder()
    .addComponents(
      new StringSelectMenuBuilder()
        .setCustomId('help_category_mobile')
        .setPlaceholder('📂 Select category...')
        .addOptions([
          { label: 'Learning', description: 'AI lessons & paths', value: 'learning', emoji: '📖' },
          { label: 'Practice', description: 'Quizzes & coding', value: 'practice', emoji: '🎯' },
          { label: 'Progress', description: 'Stats & achievements', value: 'progress', emoji: '📊' },
          { label: 'Compete', description: 'PvP & leaderboards', value: 'compete', emoji: '🏆' },
          { label: 'Rewards', description: 'Daily & bonuses', value: 'rewards', emoji: '🎁' }
        ])
    );

  const buttons = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('help_action_back')
        .setLabel('◀️ Back')
        .setStyle(ButtonStyle.Secondary)
    );

  return { embeds: [embed], components: [selectMenu, buttons] };
}

export default {
  createMobileHelpEmbed,
  createMobileQuickStartEmbed,
  createMobileHelpCategoryEmbed,
  createMobileMoreCommandsEmbed
};
