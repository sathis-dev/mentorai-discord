import { SlashCommandBuilder, EmbedBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { executeCode, resolveLanguage, formatOutput, LANGUAGES, POPULAR_LANGUAGES, getCodeTemplate } from '../../services/codeExecutionService.js';
import { getOrCreateUser, addXpToUser } from '../../services/gamificationService.js';
import { COLORS, EMOJIS } from '../../config/designSystem.js';

export const data = new SlashCommandBuilder()
  .setName('run')
  .setDescription('🖥️ Execute code in 15+ programming languages')
  .addStringOption(option =>
    option.setName('language')
      .setDescription('Programming language to use')
      .setRequired(true)
      .setAutocomplete(true))
  .addStringOption(option =>
    option.setName('code')
      .setDescription('Code to execute (or use modal for longer code)')
      .setRequired(false))
  .addStringOption(option =>
    option.setName('stdin')
      .setDescription('Input to pass to the program')
      .setRequired(false));

export async function autocomplete(interaction) {
  const focused = interaction.options.getFocused().toLowerCase();
  
  const choices = Object.entries(LANGUAGES)
    .filter(([key, config]) => {
      return key.includes(focused) || 
             config.name.toLowerCase().includes(focused) ||
             config.aliases.some(a => a.includes(focused));
    })
    .slice(0, 25)
    .map(([key, config]) => ({
      name: `${config.emoji} ${config.name}`,
      value: key
    }));

  // If no filter, show popular languages first
  if (!focused) {
    const popular = POPULAR_LANGUAGES.map(key => ({
      name: `${LANGUAGES[key].emoji} ${LANGUAGES[key].name}`,
      value: key
    }));
    await interaction.respond(popular);
    return;
  }

  await interaction.respond(choices);
}

export async function execute(interaction) {
  const languageInput = interaction.options.getString('language');
  const code = interaction.options.getString('code');
  const stdin = interaction.options.getString('stdin') || '';

  const langConfig = resolveLanguage(languageInput);

  if (!langConfig) {
    const embed = new EmbedBuilder()
      .setColor(COLORS.ERROR)
      .setTitle('❌ Unknown Language')
      .setDescription(`\`${languageInput}\` is not supported.`)
      .addFields({
        name: '📋 Supported Languages',
        value: Object.entries(LANGUAGES)
          .map(([key, config]) => `${config.emoji} ${config.name}`)
          .join(', ')
      });
    
    return interaction.reply({ embeds: [embed], ephemeral: true });
  }

  // If no code provided, show modal for code input
  if (!code) {
    const modal = new ModalBuilder()
      .setCustomId(`run_code_${langConfig.language}`)
      .setTitle(`${langConfig.emoji} ${langConfig.name} Code`);

    const codeInput = new TextInputBuilder()
      .setCustomId('code')
      .setLabel('Enter your code')
      .setStyle(TextInputStyle.Paragraph)
      .setPlaceholder(getCodeTemplate(languageInput).substring(0, 100) + '...')
      .setRequired(true)
      .setMaxLength(4000);

    const stdinInput = new TextInputBuilder()
      .setCustomId('stdin')
      .setLabel('Input (stdin) - Optional')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('Input to pass to your program')
      .setRequired(false)
      .setMaxLength(1000);

    modal.addComponents(
      new ActionRowBuilder().addComponents(codeInput),
      new ActionRowBuilder().addComponents(stdinInput)
    );

    return interaction.showModal(modal);
  }

  // Execute the code
  await interaction.deferReply();
  
  await executeAndRespond(interaction, langConfig, code, stdin);
}

/**
 * Execute code and send response
 */
export async function executeAndRespond(interaction, langConfig, code, stdin = '') {
  const startTime = Date.now();
  
  // Show "executing" message
  const loadingEmbed = new EmbedBuilder()
    .setColor(COLORS.INFO)
    .setTitle(`${EMOJIS.LOADING} Executing ${langConfig.emoji} ${langConfig.name} Code...`)
    .setDescription('```\nCompiling and running...\n```')
    .setFooter({ text: 'Powered by Piston API • Sandboxed execution' });

  let message;
  if (interaction.deferred) {
    message = await interaction.editReply({ embeds: [loadingEmbed] });
  } else {
    message = await interaction.reply({ embeds: [loadingEmbed], fetchReply: true });
  }

  // Execute the code
  const result = await executeCode(langConfig, code, stdin);
  const totalTime = Date.now() - startTime;

  // Build result embed
  const embed = new EmbedBuilder()
    .setTimestamp();

  if (result.success) {
    embed
      .setColor(COLORS.SUCCESS)
      .setTitle(`${EMOJIS.SUCCESS} ${langConfig.emoji} ${langConfig.name} - Execution Successful`)
      .setDescription(`**Output:**\n\`\`\`${getHighlightLang(langConfig.language)}\n${formatOutput(result.output)}\n\`\`\``);

    if (result.stderr) {
      embed.addFields({
        name: '⚠️ Warnings',
        value: `\`\`\`\n${formatOutput(result.stderr, 500)}\n\`\`\``
      });
    }

    // Award XP for successful execution
    try {
      const user = await getOrCreateUser(interaction.user.id, interaction.user.username);
      await addXpToUser(user, 5, 'code_execution');
      embed.setFooter({ text: `⏱️ ${totalTime}ms • +5 XP earned! • Keep coding!` });
    } catch (err) {
      embed.setFooter({ text: `⏱️ ${totalTime}ms • Powered by Piston API` });
    }

  } else {
    embed
      .setColor(COLORS.ERROR)
      .setTitle(`${EMOJIS.ERROR} ${langConfig.emoji} ${langConfig.name} - Execution Failed`)
      .setDescription(`**Error:**\n\`\`\`\n${formatOutput(result.error)}\n\`\`\``)
      .setFooter({ text: `⏱️ ${totalTime}ms • Check your code and try again` });

    if (result.output) {
      embed.addFields({
        name: '📤 Partial Output',
        value: `\`\`\`\n${formatOutput(result.output, 500)}\n\`\`\``
      });
    }
  }

  // Add code preview (truncated)
  const codePreview = code.length > 300 ? code.substring(0, 300) + '...' : code;
  embed.addFields({
    name: '📝 Code',
    value: `\`\`\`${getHighlightLang(langConfig.language)}\n${codePreview}\n\`\`\``
  });

  // Action buttons
  const buttons = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId(`run_again_${langConfig.language}`)
        .setLabel('Run Again')
        .setEmoji('🔄')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId(`run_template_${langConfig.language}`)
        .setLabel('Try Template')
        .setEmoji('📝')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('help_main')
        .setLabel('Menu')
        .setEmoji('🏠')
        .setStyle(ButtonStyle.Secondary)
    );

  await interaction.editReply({ embeds: [embed], components: [buttons] });
}

/**
 * Get syntax highlight language for Discord code blocks
 */
function getHighlightLang(language) {
  const mapping = {
    python: 'python',
    javascript: 'javascript',
    typescript: 'typescript',
    java: 'java',
    'c++': 'cpp',
    c: 'c',
    csharp: 'csharp',
    go: 'go',
    rust: 'rust',
    ruby: 'ruby',
    php: 'php',
    swift: 'swift',
    kotlin: 'kotlin',
    lua: 'lua',
    bash: 'bash',
    sqlite3: 'sql'
  };
  return mapping[language] || 'text';
}

/**
 * Create embed showing all supported languages
 */
export function createLanguagesEmbed() {
  const embed = new EmbedBuilder()
    .setColor(COLORS.INFO)
    .setTitle('🖥️ Supported Programming Languages')
    .setDescription('Run code in any of these languages using `/run`!')
    .setFooter({ text: 'All code runs in a secure, sandboxed environment' });

  const languageList = Object.entries(LANGUAGES)
    .map(([key, config]) => `${config.emoji} **${config.name}** - \`/run language:${key}\``)
    .join('\n');

  embed.addFields(
    { name: '📋 Available Languages', value: languageList },
    { name: '💡 Tips', value: 
      '• Use the modal for longer code (don\'t provide code in command)\n' +
      '• Code is executed in an isolated sandbox\n' +
      '• 10 second timeout for execution\n' +
      '• +5 XP for each successful run!'
    }
  );

  return embed;
}
