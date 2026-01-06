import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { explainConcept } from '../../ai/index.js';
import { getOrCreateUser } from '../../services/gamificationService.js';
import { COLORS, EMOJIS } from '../../config/designSystem.js';
import { animateLoading } from '../../utils/animations.js';

export const data = new SlashCommandBuilder()
  .setName('explain')
  .setDescription('🧠 Get an AI-powered explanation of any programming concept')
  .addStringOption(option =>
    option.setName('concept')
      .setDescription('What concept do you want explained?')
      .setRequired(true)
      .setAutocomplete(true))
  .addStringOption(option =>
    option.setName('context')
      .setDescription('Any specific context or area of confusion?'));

export async function execute(interaction) {
  await interaction.deferReply();

  const concept = interaction.options.getString('concept');
  const context = interaction.options.getString('context') || '';

  try {
    const user = await getOrCreateUser(interaction.user.id, interaction.user.username);

    // Animated loading
    await animateLoading(interaction, {
      title: '🧠 Generating Explanation',
      color: COLORS.LESSON_BLUE,
      duration: 3000,
      style: 'brain',
      stages: [
        { text: 'Understanding your question...', status: '🔍 Analyzing' },
        { text: 'Researching: **' + concept + '**', status: '📚 Researching' },
        { text: 'Creating explanation...', status: '✍️ Writing' }
      ]
    });

    // Get AI explanation
    const explanation = await explainConcept(concept, context);

    // Main explanation embed
    const mainEmbed = new EmbedBuilder()
      .setTitle('🧠 ' + (explanation.concept || concept))
      .setColor(COLORS.LESSON_BLUE)
      .setDescription('### Simple Explanation\n' + explanation.simpleExplanation)
      .addFields({
        name: '📖 Technical Details',
        value: explanation.technicalExplanation || 'See the simple explanation above.',
        inline: false
      })
      .setFooter({ text: '🎓 MentorAI | AI-Powered Learning' })
      .setTimestamp();

    // Analogy embed
    const analogyEmbed = new EmbedBuilder()
      .setTitle('💡 Analogy')
      .setColor(COLORS.WARNING)
      .setDescription('> ' + (explanation.analogy || 'Think of it as a building block for your code.'))
      .addFields({
        name: '💻 Code Example',
        value: '```javascript\n' + (explanation.codeExample || '// Example coming soon').substring(0, 500) + '\n```',
        inline: false
      });

    // Tips embed
    const tipsEmbed = new EmbedBuilder()
      .setTitle('⚠️ Common Mistakes to Avoid')
      .setColor(COLORS.ERROR)
      .setDescription(
        (explanation.commonMistakes || ['Not practicing enough']).map((m, i) => 
          '**' + (i + 1) + '.** ' + m
        ).join('\n')
      )
      .addFields({
        name: '🔗 Related Concepts',
        value: (explanation.relatedConcepts || ['Programming basics']).join(', '),
        inline: false
      });

    // Action buttons
    const buttons = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('quiz_start_' + encodeURIComponent(concept))
        .setLabel('Take Quiz')
        .setEmoji('🎯')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('lesson_suggest_' + encodeURIComponent(concept))
        .setLabel('Full Lesson')
        .setEmoji('📚')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('help_main')
        .setLabel('Menu')
        .setEmoji('🏠')
        .setStyle(ButtonStyle.Secondary)
    );

    // Award XP for learning
    await user.addXp(15);
    await user.save();

    await interaction.editReply({ 
      embeds: [mainEmbed, analogyEmbed, tipsEmbed], 
      components: [buttons] 
    });

  } catch (error) {
    console.error('Explain command error:', error);

    const errorEmbed = new EmbedBuilder()
      .setTitle('❌ Explanation Failed')
      .setColor(COLORS.ERROR)
      .setDescription('Could not generate explanation. Try a different concept!')
      .setFooter({ text: '🎓 MentorAI' });

    await interaction.editReply({ embeds: [errorEmbed] });
  }
}
