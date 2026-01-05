import { SlashCommandBuilder, EmbedBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { generateWithAI } from '../../ai/index.js';
import { getOrCreateUser, addXpToUser } from '../../services/gamificationService.js';
import { COLORS, EMOJIS } from '../../config/designSystem.js';

export const data = new SlashCommandBuilder()
  .setName('review')
  .setDescription('🔍 Get AI-powered code review and suggestions')
  .addStringOption(option =>
    option.setName('language')
      .setDescription('Programming language of your code')
      .setRequired(true)
      .addChoices(
        { name: '🟨 JavaScript', value: 'javascript' },
        { name: '🐍 Python', value: 'python' },
        { name: '🔷 TypeScript', value: 'typescript' },
        { name: '☕ Java', value: 'java' },
        { name: '⚡ C++', value: 'cpp' },
        { name: '💜 C#', value: 'csharp' },
        { name: '🐹 Go', value: 'go' },
        { name: '🦀 Rust', value: 'rust' },
        { name: '💎 Ruby', value: 'ruby' },
        { name: '🐘 PHP', value: 'php' }
      ))
  .addStringOption(option =>
    option.setName('focus')
      .setDescription('What aspect to focus on')
      .setRequired(false)
      .addChoices(
        { name: '🔍 General Review', value: 'general' },
        { name: '🐛 Bug Detection', value: 'bugs' },
        { name: '⚡ Performance', value: 'performance' },
        { name: '🔒 Security', value: 'security' },
        { name: '📖 Readability', value: 'readability' },
        { name: '✨ Best Practices', value: 'best-practices' }
      ))
  .addStringOption(option =>
    option.setName('code')
      .setDescription('Paste your code here (or leave empty to use modal for longer code)')
      .setRequired(false));

export async function execute(interaction) {
  const language = interaction.options.getString('language');
  const focus = interaction.options.getString('focus') || 'general';
  const code = interaction.options.getString('code');

  // If no code provided, show modal for code input
  if (!code) {
    const modal = new ModalBuilder()
      .setCustomId(`review_code_${language}_${focus}`)
      .setTitle(`🔍 Code Review - ${getLanguageName(language)}`);

    const codeInput = new TextInputBuilder()
      .setCustomId('code')
      .setLabel('Paste your code here')
      .setStyle(TextInputStyle.Paragraph)
      .setPlaceholder('// Paste your code here for AI review\n// The AI will analyze and provide suggestions')
      .setRequired(true)
      .setMaxLength(4000);

    const contextInput = new TextInputBuilder()
      .setCustomId('context')
      .setLabel('Additional context (optional)')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('What does this code do? Any specific concerns?')
      .setRequired(false)
      .setMaxLength(500);

    modal.addComponents(
      new ActionRowBuilder().addComponents(codeInput),
      new ActionRowBuilder().addComponents(contextInput)
    );

    return interaction.showModal(modal);
  }

  // Execute review directly
  await interaction.deferReply();
  await performCodeReview(interaction, language, focus, code, '');
}

/**
 * Perform the actual code review
 */
export async function performCodeReview(interaction, language, focus, code, context = '') {
  const startTime = Date.now();

  // Loading embed
  const loadingEmbed = new EmbedBuilder()
    .setColor(COLORS.INFO)
    .setTitle(`${EMOJIS.LOADING} Analyzing your ${getLanguageName(language)} code...`)
    .setDescription('Our AI is reviewing your code for:\n' + getFocusDescription(focus))
    .setFooter({ text: 'This may take a moment...' });

  if (interaction.deferred) {
    await interaction.editReply({ embeds: [loadingEmbed] });
  } else {
    await interaction.reply({ embeds: [loadingEmbed] });
  }

  try {
    // Create the review prompt
    const prompt = createReviewPrompt(language, focus, code, context);
    
    // Get AI review
    const review = await generateWithAI(getSystemPrompt(), prompt, {
      maxTokens: 1500
    });

    if (!review) {
      throw new Error('AI service unavailable');
    }

    const reviewTime = Date.now() - startTime;

    // Parse the review into sections
    const sections = parseReview(review);

    // Build the main embed
    const embed = new EmbedBuilder()
      .setColor(sections.overallScore >= 80 ? COLORS.SUCCESS : 
                sections.overallScore >= 60 ? COLORS.WARNING : COLORS.ERROR)
      .setTitle(`${EMOJIS.CODE} Code Review Complete`)
      .setDescription(`**Language:** ${getLanguageEmoji(language)} ${getLanguageName(language)}\n**Focus:** ${getFocusEmoji(focus)} ${getFocusName(focus)}\n**Score:** ${getScoreEmoji(sections.overallScore)} **${sections.overallScore}/100**`)
      .setTimestamp()
      .setFooter({ text: `Review completed in ${(reviewTime/1000).toFixed(1)}s • MentorAI` });

    // Add review sections
    if (sections.summary) {
      embed.addFields({ name: '📝 Summary', value: truncate(sections.summary, 1024) });
    }

    if (sections.issues && sections.issues.length > 0) {
      embed.addFields({ 
        name: `🐛 Issues Found (${sections.issues.length})`, 
        value: truncate(sections.issues.join('\n'), 1024) 
      });
    }

    if (sections.suggestions && sections.suggestions.length > 0) {
      embed.addFields({ 
        name: '💡 Suggestions', 
        value: truncate(sections.suggestions.join('\n'), 1024) 
      });
    }

    if (sections.positives && sections.positives.length > 0) {
      embed.addFields({ 
        name: '✅ What\'s Good', 
        value: truncate(sections.positives.join('\n'), 1024) 
      });
    }

    // Add original code preview (truncated)
    const codePreview = code.length > 300 ? code.substring(0, 300) + '...' : code;
    embed.addFields({
      name: '📄 Code Reviewed',
      value: `\`\`\`${language}\n${codePreview}\n\`\`\``
    });

    // Award XP
    try {
      const user = await getOrCreateUser(interaction.user.id, interaction.user.username);
      await addXpToUser(user, 10, 'code_review');
    } catch (err) {
      console.error('Failed to award XP:', err);
    }

    // Buttons for follow-up actions
    const buttons = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId(`review_improve_${language}`)
          .setLabel('Show Improved Code')
          .setEmoji('✨')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId(`review_explain_${language}`)
          .setLabel('Explain Issues')
          .setEmoji('📖')
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId('review_new')
          .setLabel('New Review')
          .setEmoji('🔄')
          .setStyle(ButtonStyle.Secondary)
      );

    await interaction.editReply({ embeds: [embed], components: [buttons] });

  } catch (error) {
    console.error('Code review error:', error);
    
    const errorEmbed = new EmbedBuilder()
      .setColor(COLORS.ERROR)
      .setTitle(`${EMOJIS.ERROR} Review Failed`)
      .setDescription('Failed to analyze your code. Please try again.')
      .addFields({ name: 'Error', value: error.message || 'Unknown error' });

    await interaction.editReply({ embeds: [errorEmbed], components: [] });
  }
}

// ============ Helper Functions ============

function getSystemPrompt() {
  return `You are an expert code reviewer with deep knowledge of software engineering best practices, design patterns, and common pitfalls across all programming languages.

Your reviews should be:
- Constructive and educational
- Specific with line references when possible
- Focused on the most impactful improvements
- Encouraging while being honest about issues

Format your response as:
SCORE: [0-100]
SUMMARY: [1-2 sentence overview]
ISSUES:
- [Issue 1]
- [Issue 2]
SUGGESTIONS:
- [Suggestion 1]
- [Suggestion 2]
POSITIVES:
- [Good thing 1]
- [Good thing 2]`;
}

function createReviewPrompt(language, focus, code, context) {
  const focusInstructions = {
    general: 'Provide a comprehensive review covering code quality, structure, and best practices.',
    bugs: 'Focus primarily on identifying potential bugs, edge cases, and runtime errors.',
    performance: 'Focus on performance optimizations, time/space complexity, and efficiency improvements.',
    security: 'Focus on security vulnerabilities, input validation, and secure coding practices.',
    readability: 'Focus on code readability, naming conventions, comments, and code organization.',
    'best-practices': 'Focus on language-specific best practices, idiomatic code, and modern patterns.'
  };

  return `Review this ${language} code with focus on: ${focusInstructions[focus]}

${context ? `Additional context from developer: ${context}\n\n` : ''}Code to review:
\`\`\`${language}
${code}
\`\`\`

Provide a detailed review following the format in your instructions.`;
}

function parseReview(review) {
  const result = {
    overallScore: 70,
    summary: '',
    issues: [],
    suggestions: [],
    positives: []
  };

  try {
    // Extract score
    const scoreMatch = review.match(/SCORE:\s*(\d+)/i);
    if (scoreMatch) {
      result.overallScore = Math.min(100, Math.max(0, parseInt(scoreMatch[1])));
    }

    // Extract summary
    const summaryMatch = review.match(/SUMMARY:\s*(.+?)(?=ISSUES:|SUGGESTIONS:|POSITIVES:|$)/is);
    if (summaryMatch) {
      result.summary = summaryMatch[1].trim();
    }

    // Extract issues
    const issuesMatch = review.match(/ISSUES:\s*([\s\S]*?)(?=SUGGESTIONS:|POSITIVES:|$)/i);
    if (issuesMatch) {
      result.issues = extractBulletPoints(issuesMatch[1]);
    }

    // Extract suggestions
    const suggestionsMatch = review.match(/SUGGESTIONS:\s*([\s\S]*?)(?=POSITIVES:|$)/i);
    if (suggestionsMatch) {
      result.suggestions = extractBulletPoints(suggestionsMatch[1]);
    }

    // Extract positives
    const positivesMatch = review.match(/POSITIVES:\s*([\s\S]*?)$/i);
    if (positivesMatch) {
      result.positives = extractBulletPoints(positivesMatch[1]);
    }

    // If parsing failed, use the whole response as summary
    if (!result.summary && !result.issues.length && !result.suggestions.length) {
      result.summary = review.substring(0, 500);
    }

  } catch (error) {
    result.summary = review.substring(0, 500);
  }

  return result;
}

function extractBulletPoints(text) {
  const lines = text.split('\n')
    .map(line => line.trim())
    .filter(line => line.startsWith('-') || line.startsWith('•') || line.startsWith('*'))
    .map(line => line.replace(/^[-•*]\s*/, '• '))
    .filter(line => line.length > 2);
  
  return lines.slice(0, 5); // Max 5 items
}

function getLanguageName(lang) {
  const names = {
    javascript: 'JavaScript',
    python: 'Python',
    typescript: 'TypeScript',
    java: 'Java',
    cpp: 'C++',
    csharp: 'C#',
    go: 'Go',
    rust: 'Rust',
    ruby: 'Ruby',
    php: 'PHP'
  };
  return names[lang] || lang;
}

function getLanguageEmoji(lang) {
  const emojis = {
    javascript: '🟨',
    python: '🐍',
    typescript: '🔷',
    java: '☕',
    cpp: '⚡',
    csharp: '💜',
    go: '🐹',
    rust: '🦀',
    ruby: '💎',
    php: '🐘'
  };
  return emojis[lang] || '💻';
}

function getFocusName(focus) {
  const names = {
    general: 'General Review',
    bugs: 'Bug Detection',
    performance: 'Performance',
    security: 'Security',
    readability: 'Readability',
    'best-practices': 'Best Practices'
  };
  return names[focus] || focus;
}

function getFocusEmoji(focus) {
  const emojis = {
    general: '🔍',
    bugs: '🐛',
    performance: '⚡',
    security: '🔒',
    readability: '📖',
    'best-practices': '✨'
  };
  return emojis[focus] || '🔍';
}

function getFocusDescription(focus) {
  const descriptions = {
    general: '• Code quality\n• Structure\n• Best practices',
    bugs: '• Potential bugs\n• Edge cases\n• Runtime errors',
    performance: '• Efficiency\n• Time complexity\n• Memory usage',
    security: '• Vulnerabilities\n• Input validation\n• Secure practices',
    readability: '• Code clarity\n• Naming conventions\n• Documentation',
    'best-practices': '• Idiomatic patterns\n• Modern standards\n• Language conventions'
  };
  return descriptions[focus] || descriptions.general;
}

function getScoreEmoji(score) {
  if (score >= 90) return '🌟';
  if (score >= 80) return '✅';
  if (score >= 70) return '👍';
  if (score >= 60) return '⚠️';
  return '❌';
}

function truncate(text, maxLength) {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}
