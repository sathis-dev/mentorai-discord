import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { User } from '../../database/models/User.js';
import { COLORS } from '../../config/colors.js';

// Available themes with unlock requirements
const THEMES = {
  default: {
    name: 'Default',
    icon: '🎨',
    colors: { primary: COLORS.PRIMARY, secondary: COLORS.INFO, accent: COLORS.SUCCESS },
    requirement: { type: 'free' },
    description: 'The classic MentorAI look'
  },
  ocean: {
    name: 'Ocean Depths',
    icon: '🌊',
    colors: { primary: 0x0077BE, secondary: 0x00A86B, accent: 0x40E0D0 },
    requirement: { type: 'level', value: 10 },
    description: 'Dive into learning with calming blues'
  },
  forest: {
    name: 'Enchanted Forest',
    icon: '🌲',
    colors: { primary: 0x228B22, secondary: 0x8B4513, accent: 0xFFD700 },
    requirement: { type: 'level', value: 15 },
    description: 'Natural greens for focused learning'
  },
  sunset: {
    name: 'Golden Sunset',
    icon: '🌅',
    colors: { primary: 0xFF6B35, secondary: 0xFF8C00, accent: 0xFFD93D },
    requirement: { type: 'streak', value: 7 },
    description: 'Warm gradients for cozy studying'
  },
  galaxy: {
    name: 'Cosmic Galaxy',
    icon: '🌌',
    colors: { primary: 0x4B0082, secondary: 0x8A2BE2, accent: 0xDA70D6 },
    requirement: { type: 'xp', value: 10000 },
    description: 'Explore the universe of knowledge'
  },
  neon: {
    name: 'Cyberpunk Neon',
    icon: '💜',
    colors: { primary: 0xFF00FF, secondary: 0x00FFFF, accent: 0x39FF14 },
    requirement: { type: 'quizzes', value: 50 },
    description: 'High-tech vibes for power learners'
  },
  fire: {
    name: 'Dragon Fire',
    icon: '🔥',
    colors: { primary: 0xFF4500, secondary: 0xFF0000, accent: 0xFFD700 },
    requirement: { type: 'streak', value: 30 },
    description: 'Burn through your study goals'
  },
  ice: {
    name: 'Arctic Frost',
    icon: '❄️',
    colors: { primary: 0x87CEEB, secondary: 0xE0FFFF, accent: 0xADD8E6 },
    requirement: { type: 'level', value: 25 },
    description: 'Cool and refreshing aesthetics'
  },
  royal: {
    name: 'Royal Kingdom',
    icon: '👑',
    colors: { primary: 0x4169E1, secondary: 0xFFD700, accent: 0x9932CC },
    requirement: { type: 'achievements', value: 20 },
    description: 'For the kings and queens of learning'
  },
  midnight: {
    name: 'Midnight Shadow',
    icon: '🌑',
    colors: { primary: 0x1C1C1C, secondary: 0x2C2C2C, accent: 0x8B0000 },
    requirement: { type: 'xp', value: 50000 },
    description: 'Dark mode for night owls'
  },
  rainbow: {
    name: 'Prismatic Rainbow',
    icon: '🌈',
    colors: { primary: 0xFF6B6B, secondary: 0x4ECDC4, accent: 0xFFE66D },
    requirement: { type: 'prestige', value: 1 },
    description: 'All colors for true masters'
  },
  legendary: {
    name: 'Legendary Aura',
    icon: '✨',
    colors: { primary: 0xFFD700, secondary: 0xFFA500, accent: 0xFFFFFF },
    requirement: { type: 'prestige', value: 5 },
    description: 'The ultimate prestige theme'
  }
};

export const data = new SlashCommandBuilder()
  .setName('theme')
  .setDescription('Customize your MentorAI experience')
  .addSubcommand(sub =>
    sub.setName('view')
      .setDescription('View all available themes'))
  .addSubcommand(sub =>
    sub.setName('set')
      .setDescription('Set your active theme')
      .addStringOption(opt =>
        opt.setName('theme')
          .setDescription('Theme to apply')
          .setRequired(true)
          .addChoices(
            Object.entries(THEMES).map(([key, theme]) => ({
              name: `${theme.icon} ${theme.name}`,
              value: key
            }))
          )))
  .addSubcommand(sub =>
    sub.setName('preview')
      .setDescription('Preview a theme')
      .addStringOption(opt =>
        opt.setName('theme')
          .setDescription('Theme to preview')
          .setRequired(true)
          .addChoices(
            Object.entries(THEMES).map(([key, theme]) => ({
              name: `${theme.icon} ${theme.name}`,
              value: key
            }))
          )));

export async function execute(interaction) {
  const subcommand = interaction.options.getSubcommand();
  const userId = interaction.user.id;

  let user = await User.findOne({ discordId: userId });
  if (!user) {
    user = await User.create({ discordId: userId });
  }

  const currentTheme = user.theme || 'default';

  if (subcommand === 'view') {
    const unlockedThemes = [];
    const lockedThemes = [];

    for (const [key, theme] of Object.entries(THEMES)) {
      const isUnlocked = checkThemeUnlock(user, theme.requirement);
      if (isUnlocked) {
        unlockedThemes.push({ key, ...theme });
      } else {
        lockedThemes.push({ key, ...theme });
      }
    }

    const unlockedList = unlockedThemes
      .map(t => `${t.icon} **${t.name}**${t.key === currentTheme ? ' ✓' : ''}\n└─ ${t.description}`)
      .join('\n\n');

    const lockedList = lockedThemes
      .map(t => `🔒 **${t.name}**\n└─ ${formatRequirement(t.requirement)}`)
      .join('\n\n');

    const embed = new EmbedBuilder()
      .setColor(THEMES[currentTheme].colors.primary)
      .setTitle('🎨 Theme Collection')
      .setDescription(`
**Current Theme:** ${THEMES[currentTheme].icon} ${THEMES[currentTheme].name}

═══════════════════════════════════

**✨ UNLOCKED THEMES**

${unlockedList}

═══════════════════════════════════

**🔒 LOCKED THEMES**

${lockedList}
      `)
      .setFooter({ text: 'Use /theme set <theme> to apply a theme' });

    await interaction.reply({ embeds: [embed] });

  } else if (subcommand === 'set') {
    const themeKey = interaction.options.getString('theme');
    const theme = THEMES[themeKey];

    if (!theme) {
      return interaction.reply({ content: '❌ Theme not found!', ephemeral: true });
    }

    const isUnlocked = checkThemeUnlock(user, theme.requirement);
    
    if (!isUnlocked) {
      return interaction.reply({
        content: `🔒 This theme is locked!\n\n**Requirement:** ${formatRequirement(theme.requirement)}`,
        ephemeral: true
      });
    }

    user.theme = themeKey;
    await user.save();

    const embed = new EmbedBuilder()
      .setColor(theme.colors.primary)
      .setTitle(`${theme.icon} Theme Applied!`)
      .setDescription(`
You're now using **${theme.name}**!

${theme.description}

Your embeds will now use this color scheme.
      `)
      .addFields(
        { name: 'Primary', value: `\`#${theme.colors.primary.toString(16).padStart(6, '0')}\``, inline: true },
        { name: 'Secondary', value: `\`#${theme.colors.secondary.toString(16).padStart(6, '0')}\``, inline: true },
        { name: 'Accent', value: `\`#${theme.colors.accent.toString(16).padStart(6, '0')}\``, inline: true }
      );

    await interaction.reply({ embeds: [embed] });

  } else if (subcommand === 'preview') {
    const themeKey = interaction.options.getString('theme');
    const theme = THEMES[themeKey];

    if (!theme) {
      return interaction.reply({ content: '❌ Theme not found!', ephemeral: true });
    }

    const isUnlocked = checkThemeUnlock(user, theme.requirement);

    const embed = new EmbedBuilder()
      .setColor(theme.colors.primary)
      .setTitle(`${theme.icon} ${theme.name} Preview`)
      .setDescription(`
${theme.description}

**This is how your embeds would look!**

╔══════════════════════════════════════╗
║        SAMPLE CONTENT                ║
╚══════════════════════════════════════╝

📊 **Your Progress**
Level: 42 | XP: 12,500

🏆 **Recent Achievement**
Earned: Master Learner

${isUnlocked ? '✅ **You have this theme unlocked!**' : `🔒 **Locked:** ${formatRequirement(theme.requirement)}`}
      `)
      .addFields(
        { name: 'Colors', value: `Primary: \`#${theme.colors.primary.toString(16).padStart(6, '0')}\`\nSecondary: \`#${theme.colors.secondary.toString(16).padStart(6, '0')}\`\nAccent: \`#${theme.colors.accent.toString(16).padStart(6, '0')}\`` }
      );

    const row = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId(`theme_apply_${themeKey}`)
          .setLabel(isUnlocked ? '✅ Apply Theme' : '🔒 Locked')
          .setStyle(isUnlocked ? ButtonStyle.Success : ButtonStyle.Secondary)
          .setDisabled(!isUnlocked)
      );

    await interaction.reply({ embeds: [embed], components: [row] });
  }
}

function checkThemeUnlock(user, requirement) {
  if (requirement.type === 'free') return true;
  
  switch (requirement.type) {
    case 'level':
      return (user.level || 1) >= requirement.value;
    case 'xp':
      return (user.xp || 0) >= requirement.value;
    case 'streak':
      return (user.currentStreak || 0) >= requirement.value;
    case 'quizzes':
      return (user.stats?.quizzesCompleted || 0) >= requirement.value;
    case 'achievements':
      return (user.achievements?.length || 0) >= requirement.value;
    case 'prestige':
      return (user.prestige?.level || 0) >= requirement.value;
    default:
      return false;
  }
}

function formatRequirement(requirement) {
  if (requirement.type === 'free') return 'Free!';
  
  const formats = {
    level: `Reach Level ${requirement.value}`,
    xp: `Earn ${requirement.value.toLocaleString()} XP`,
    streak: `${requirement.value}-day streak`,
    quizzes: `Complete ${requirement.value} quizzes`,
    achievements: `Unlock ${requirement.value} achievements`,
    prestige: `Reach Prestige ${requirement.value}`
  };
  
  return formats[requirement.type] || 'Unknown requirement';
}

// Export themes for use in other commands
export { THEMES };
