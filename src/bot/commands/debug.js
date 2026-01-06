import { SlashCommandBuilder, EmbedBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { generateWithAI } from '../../ai/index.js';
import { getOrCreateUser, addXpToUser } from '../../services/gamificationService.js';
import { executeCode, resolveLanguage, LANGUAGES, POPULAR_LANGUAGES } from '../../services/codeExecutionService.js';
import { COLORS, EMOJIS, createProgressBar } from '../../config/designSystem.js';

// XP rewards
const DEBUG_XP = 25;

export const data = new SlashCommandBuilder()
  .setName('debug')
  .setDescription('🐛 AI-powered debugging assistant - fix broken code')
  .addStringOption(option =>
    option.setName('language')
      .setDescription('Programming language of your code')
      .setRequired(true)
      .setAutocomplete(true))
  .addStringOption(option =>
    option.setName('code')
      .setDescription('Paste broken code (or leave empty for modal)')
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

  const langConfig = resolveLanguage(languageInput);
  const languageName = langConfig?.name || languageInput;
  const languageEmoji = langConfig?.emoji || '💻';

  // If no code provided, show modal
  if (!code) {
    const modal = new ModalBuilder()
      .setCustomId(`debug_code_${languageInput}`)
      .setTitle(`🐛 Debug - ${languageName}`);

    const codeInput = new TextInputBuilder()
      .setCustomId('code')
      .setLabel('Paste your broken code')
      .setStyle(TextInputStyle.Paragraph)
      .setPlaceholder('Paste code that has errors or isn\'t working correctly...')
      .setRequired(true)
      .setMaxLength(4000);

    const errorInput = new TextInputBuilder()
      .setCustomId('error')
      .setLabel('Error message (if any)')
      .setStyle(TextInputStyle.Paragraph)
      .setPlaceholder('Paste the error message you\'re seeing, or describe what\'s wrong')
      .setRequired(false)
      .setMaxLength(1000);

    const expectedInput = new TextInputBuilder()
      .setCustomId('expected')
      .setLabel('What should it do? (Optional)')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('e.g., Should return the sum of all numbers')
      .setRequired(false)
      .setMaxLength(200);

    modal.addComponents(
      new ActionRowBuilder().addComponents(codeInput),
      new ActionRowBuilder().addComponents(errorInput),
      new ActionRowBuilder().addComponents(expectedInput)
    );

    return interaction.showModal(modal);
  }

  // If code provided directly, process it
  await interaction.deferReply();
  await processDebug(interaction, languageInput, code, '', '');
}

/**
 * Process debugging with AI
 */
export async function processDebug(interaction, language, code, errorMessage = '', expected = '') {
  const langConfig = resolveLanguage(language);
  const languageName = langConfig?.name || language;
  const languageEmoji = langConfig?.emoji || '💻';

  // Show loading embed
  const loadingEmbed = new EmbedBuilder()
    .setTitle(`${EMOJIS.LOADING} Debugging Your Code...`)
    .setColor(COLORS.WARNING)
    .setDescription('```\n🔍 AI Bug Hunter Activated\n```')
    .addFields(
      { name: '📝 Language', value: `${languageEmoji} ${languageName}`, inline: true },
      { name: '📏 Lines', value: `${code.split('\n').length} lines`, inline: true },
      { name: '🐛 Status', value: 'Analyzing...', inline: true }
    )
    .setFooter({ text: '🧠 AI is finding bugs and creating fixes...' });

  await interaction.editReply({ embeds: [loadingEmbed] });

  // Generate AI debugging response
  const systemPrompt = `You are an expert debugger helping students fix their code. Your role is to:
1. Identify exactly what's wrong
2. Explain WHY it's wrong (educational)
3. Show the corrected code
4. Teach them how to avoid this in the future

Be friendly, patient, and educational. Use emojis to make it engaging.

IMPORTANT: Respond in valid JSON format only.`;

  const userPrompt = `Debug this ${languageName} code:

\`\`\`${language}
${code}
\`\`\`
${errorMessage ? `\nError message: ${errorMessage}` : ''}
${expected ? `\nExpected behavior: ${expected}` : ''}

Analyze and fix the code. Respond in this exact JSON format:
{
  "problemSummary": "One-line description of the main issue",
  "bugs": [
    {
      "type": "syntax|logic|runtime|semantic",
      "location": "line number or function name",
      "problem": "What's wrong",
      "cause": "Why this happened"
    }
  ],
  "fixedCode": "The complete corrected code",
  "explanation": "Step-by-step explanation of the fixes made",
  "prevention": "How to avoid this bug in the future",
  "testTip": "A simple way to verify the fix works"
}

Maximum 3 bugs. Focus on the most impactful issues.`;

  try {
    const response = await generateWithAI(systemPrompt, userPrompt, {
      maxTokens: 2000,
      temperature: 0.5,
      jsonMode: true
    });

    if (!response) {
      throw new Error('AI response was empty');
    }

    // Parse JSON response
    let debug;
    try {
      debug = JSON.parse(response);
    } catch {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        debug = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Failed to parse AI response');
      }
    }

    // Get user and award XP
    const user = await getOrCreateUser(interaction.user.id, interaction.user.username);
    
    // Track debug usage
    if (!user.debugSessions) user.debugSessions = 0;
    user.debugSessions += 1;
    await user.save();
    
    const xpResult = await addXpToUser(interaction.user.id, DEBUG_XP, 'Debug Session');

    // Build result embeds
    const bugTypeEmojis = {
      syntax: '📝',
      logic: '🧠',
      runtime: '💥',
      semantic: '🔤'
    };

    const mainEmbed = new EmbedBuilder()
      .setTitle(`🐛 Debug Complete - ${languageEmoji} ${languageName}`)
      .setColor(COLORS.SUCCESS)
      .setDescription(`\`\`\`\n🔍 ${debug.problemSummary}\n\`\`\``);

    // Add bugs found
    if (debug.bugs && debug.bugs.length > 0) {
      const bugsText = debug.bugs.map((bug, i) => {
        const emoji = bugTypeEmojis[bug.type] || '🐛';
        return `${emoji} **Bug ${i + 1}:** ${bug.problem}\n   📍 Location: \`${bug.location}\`\n   💡 Cause: ${bug.cause}`;
      }).join('\n\n');
      
      mainEmbed.addFields({ 
        name: `🔴 Issues Found (${debug.bugs.length})`, 
        value: bugsText.substring(0, 1024), 
        inline: false 
      });
    }

    // Add explanation
    if (debug.explanation) {
      mainEmbed.addFields({ 
        name: '🛠️ How I Fixed It', 
        value: debug.explanation.substring(0, 1024), 
        inline: false 
      });
    }

    // Add prevention tip
    if (debug.prevention) {
      mainEmbed.addFields({ 
        name: '🛡️ Prevention Tip', 
        value: `> ${debug.prevention}`, 
        inline: false 
      });
    }

    // Add test tip
    if (debug.testTip) {
      mainEmbed.addFields({ 
        name: '🧪 Verify Fix', 
        value: `> ${debug.testTip}`, 
        inline: false 
      });
    }

    // Add XP earned
    mainEmbed.addFields({
      name: `${EMOJIS.XP} Reward`,
      value: `+${DEBUG_XP} XP earned!${xpResult?.leveledUp ? ` 🎉 **Level Up! → ${xpResult.newLevel}**` : ''}`,
      inline: true
    });

    mainEmbed.setFooter({ text: `🎓 MentorAI Debug • Total Sessions: ${user.debugSessions}` });
    mainEmbed.setTimestamp();

    // Create fixed code embed
    const codeEmbed = new EmbedBuilder()
      .setTitle('✅ Fixed Code')
      .setColor(COLORS.SUCCESS)
      .setDescription(`\`\`\`${language}\n${debug.fixedCode?.substring(0, 1800) || 'No fix needed'}\n\`\`\``);

    // Store the fixed code for the run button
    const fixedCodeId = `fixed_${Date.now()}_${interaction.user.id}`;
    global.debugFixedCode = global.debugFixedCode || new Map();
    global.debugFixedCode.set(fixedCodeId, {
      code: debug.fixedCode,
      language: language,
      timestamp: Date.now()
    });

    // Clean up old stored code (older than 10 minutes)
    const tenMinutesAgo = Date.now() - 600000;
    for (const [key, value] of global.debugFixedCode.entries()) {
      if (value.timestamp < tenMinutesAgo) {
        global.debugFixedCode.delete(key);
      }
    }

    // Create action buttons
    const buttons = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`debug_run_${fixedCodeId}`)
        .setLabel('▶️ Run Fixed Code')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId(`debug_compare_${language}`)
        .setLabel('🔀 Compare Changes')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId(`debug_another_${language}`)
        .setLabel('🐛 Debug Another')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId(`review_code_${language}`)
        .setLabel('🔍 Review Code')
        .setStyle(ButtonStyle.Secondary)
    );

    await interaction.editReply({ 
      embeds: [mainEmbed, codeEmbed], 
      components: [buttons] 
    });

  } catch (error) {
    console.error('Debug error:', error);
    
    const errorEmbed = new EmbedBuilder()
      .setTitle('❌ Debug Failed')
      .setColor(COLORS.ERROR)
      .setDescription('```diff\n- Could not analyze the code\n```')
      .addFields(
        { name: '💡 Try These Steps', value: 
          '1. Make sure your code is properly formatted\n' +
          '2. Include the complete error message if available\n' +
          '3. Try with a smaller code snippet\n' +
          '4. Check for obvious typos first', inline: false }
      )
      .setFooter({ text: '🎓 MentorAI' });

    await interaction.editReply({ embeds: [errorEmbed] });
  }
}

/**
 * Handle debug button interactions
 */
export async function handleDebugButton(interaction, action, params) {
  if (action === 'run') {
    const fixedCodeId = params[0];
    const stored = global.debugFixedCode?.get(fixedCodeId);
    
    if (!stored) {
      await interaction.reply({
        content: '⏰ This code session has expired. Please debug again!',
        ephemeral: true
      });
      return;
    }

    await interaction.deferReply();
    
    const langConfig = resolveLanguage(stored.language);
    const result = await executeCode(langConfig, stored.code);

    const resultEmbed = new EmbedBuilder()
      .setTitle(`${result.success ? '✅' : '❌'} Fixed Code Execution`)
      .setColor(result.success ? COLORS.SUCCESS : COLORS.ERROR)
      .setDescription(`\`\`\`\n${result.output || result.error || 'No output'}\n\`\`\``);

    await interaction.editReply({ embeds: [resultEmbed] });
    return;
  }

  if (action === 'another') {
    const language = params[0];
    const langConfig = resolveLanguage(language);
    
    const modal = new ModalBuilder()
      .setCustomId(`debug_code_${language}`)
      .setTitle(`🐛 Debug - ${langConfig?.name || language}`);

    const codeInput = new TextInputBuilder()
      .setCustomId('code')
      .setLabel('Paste your broken code')
      .setStyle(TextInputStyle.Paragraph)
      .setPlaceholder('Paste code that has errors...')
      .setRequired(true)
      .setMaxLength(4000);

    const errorInput = new TextInputBuilder()
      .setCustomId('error')
      .setLabel('Error message (if any)')
      .setStyle(TextInputStyle.Paragraph)
      .setPlaceholder('Paste the error message')
      .setRequired(false)
      .setMaxLength(1000);

    modal.addComponents(
      new ActionRowBuilder().addComponents(codeInput),
      new ActionRowBuilder().addComponents(errorInput)
    );

    await interaction.showModal(modal);
    return;
  }
}
