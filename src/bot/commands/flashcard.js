import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle } from 'discord.js';
import Flashcard from '../../database/models/Flashcard.js';
import { generateFlashcards } from '../../ai/tutorAI.js';
import { COLORS } from '../../config/colors.js';

export const data = new SlashCommandBuilder()
  .setName('flashcard')
  .setDescription('Spaced repetition flashcard system')
  .addSubcommand(sub =>
    sub.setName('study')
      .setDescription('Study due flashcards')
      .addStringOption(opt =>
        opt.setName('deck')
          .setDescription('Deck to study')))
  .addSubcommand(sub =>
    sub.setName('create')
      .setDescription('Create a new flashcard'))
  .addSubcommand(sub =>
    sub.setName('generate')
      .setDescription('AI-generate flashcards for a topic')
      .addStringOption(opt =>
        opt.setName('topic')
          .setDescription('Topic to generate cards for')
          .setRequired(true))
      .addIntegerOption(opt =>
        opt.setName('count')
          .setDescription('Number of cards (1-20)')
          .setMinValue(1)
          .setMaxValue(20)))
  .addSubcommand(sub =>
    sub.setName('stats')
      .setDescription('View your flashcard statistics'))
  .addSubcommand(sub =>
    sub.setName('decks')
      .setDescription('View your flashcard decks'));

export async function execute(interaction) {
  const subcommand = interaction.options.getSubcommand();
  const userId = interaction.user.id;

  if (subcommand === 'study') {
    const deck = interaction.options.getString('deck');
    
    const query = {
      discordId: userId,
      nextReview: { $lte: new Date() }
    };
    if (deck) query.deck = deck;
    
    const dueCards = await Flashcard.find(query)
      .sort({ nextReview: 1 })
      .limit(20);
    
    if (dueCards.length === 0) {
      const nextCard = await Flashcard.findOne({ discordId: userId })
        .sort({ nextReview: 1 });
      
      const nextReviewText = nextCard 
        ? `\n\nNext card due: <t:${Math.floor(nextCard.nextReview.getTime() / 1000)}:R>`
        : '';
      
      return interaction.reply({
        content: `✅ No flashcards due for review right now! Great job staying on top of your studies.${nextReviewText}`,
        ephemeral: true
      });
    }
    
    // Show first card
    const card = dueCards[0];
    const embed = new EmbedBuilder()
      .setColor(COLORS.PRIMARY)
      .setAuthor({
        name: `📚 Study Session • Card 1/${dueCards.length}`,
        iconURL: interaction.user.displayAvatarURL()
      })
      .setTitle('❓ Question')
      .setDescription(card.front)
      .addFields(
        { name: '📁 Deck', value: card.deck || 'default', inline: true },
        { name: '🔄 Reviews', value: `${card.timesReviewed}`, inline: true },
        { name: '📈 Streak', value: `${card.repetitions}`, inline: true }
      )
      .setFooter({ text: 'Try to recall the answer, then flip' });

    const row = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId(`srs_flip_${card._id}`)
          .setLabel('🔄 Show Answer')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('srs_skip')
          .setLabel('⏭️ Skip')
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId('srs_end')
          .setLabel('🛑 End Session')
          .setStyle(ButtonStyle.Danger)
      );

    await interaction.reply({ embeds: [embed], components: [row] });

  } else if (subcommand === 'create') {
    const modal = new ModalBuilder()
      .setCustomId('flashcard_create_modal')
      .setTitle('Create Flashcard');

    const frontInput = new TextInputBuilder()
      .setCustomId('front')
      .setLabel('Front (Question)')
      .setPlaceholder('What is the time complexity of binary search?')
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(true);

    const backInput = new TextInputBuilder()
      .setCustomId('back')
      .setLabel('Back (Answer)')
      .setPlaceholder('O(log n)')
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(true);

    const deckInput = new TextInputBuilder()
      .setCustomId('deck')
      .setLabel('Deck Name')
      .setPlaceholder('algorithms')
      .setStyle(TextInputStyle.Short)
      .setRequired(false);

    modal.addComponents(
      new ActionRowBuilder().addComponents(frontInput),
      new ActionRowBuilder().addComponents(backInput),
      new ActionRowBuilder().addComponents(deckInput)
    );

    await interaction.showModal(modal);

  } else if (subcommand === 'generate') {
    await interaction.deferReply();
    
    const topic = interaction.options.getString('topic');
    const count = interaction.options.getInteger('count') || 10;
    
    try {
      const generatedCards = await generateFlashcards(topic, count);
      
      const savedCards = [];
      for (const card of generatedCards) {
        const flashcard = await Flashcard.create({
          discordId: userId,
          deck: topic.toLowerCase().replace(/\s+/g, '-'),
          front: card.front,
          back: card.back,
          topic,
          tags: card.tags || []
        });
        savedCards.push(flashcard);
      }
      
      const embed = new EmbedBuilder()
        .setColor(COLORS.SUCCESS)
        .setTitle('🃏 Flashcards Generated!')
        .setDescription(`
Created **${savedCards.length}** flashcards for **${topic}**!

**Sample Cards:**
${savedCards.slice(0, 3).map((c, i) => `
${i + 1}. **Q:** ${c.front.slice(0, 50)}${c.front.length > 50 ? '...' : ''}
   **A:** ${c.back.slice(0, 50)}${c.back.length > 50 ? '...' : ''}`).join('\n')}

Use \`/flashcard study\` to start reviewing!
        `)
        .setFooter({ text: `Deck: ${topic.toLowerCase().replace(/\s+/g, '-')}` });

      const row = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('flashcard_study_now')
            .setLabel('📚 Study Now')
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId('flashcard_generate_more')
            .setLabel('➕ Generate More')
            .setStyle(ButtonStyle.Secondary)
        );

      await interaction.editReply({ embeds: [embed], components: [row] });

    } catch (error) {
      console.error('Flashcard generation error:', error);
      await interaction.editReply('❌ Failed to generate flashcards. Please try again!');
    }

  } else if (subcommand === 'stats') {
    const cards = await Flashcard.find({ discordId: userId });
    
    const totalCards = cards.length;
    const totalReviews = cards.reduce((acc, c) => acc + c.timesReviewed, 0);
    const totalCorrect = cards.reduce((acc, c) => acc + c.timesCorrect, 0);
    const accuracy = totalReviews > 0 ? Math.round((totalCorrect / totalReviews) * 100) : 0;
    
    const dueNow = cards.filter(c => c.nextReview <= new Date()).length;
    const dueToday = cards.filter(c => {
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      return c.nextReview <= today;
    }).length;
    
    const newCards = cards.filter(c => c.repetitions === 0).length;
    const learning = cards.filter(c => c.repetitions > 0 && c.interval < 21).length;
    const mature = cards.filter(c => c.interval >= 21).length;
    
    const embed = new EmbedBuilder()
      .setColor(COLORS.PRIMARY)
      .setTitle('📊 Flashcard Statistics')
      .setDescription(`
╔══════════════════════════════════════╗
║           OVERVIEW                   ║
╚══════════════════════════════════════╝

🃏 **Total Cards:** ${totalCards}
📖 **Total Reviews:** ${totalReviews}
✅ **Accuracy:** ${accuracy}%

╔══════════════════════════════════════╗
║           DUE CARDS                  ║
╚══════════════════════════════════════╝

⏰ **Due Now:** ${dueNow}
📅 **Due Today:** ${dueToday}

╔══════════════════════════════════════╗
║        RETENTION STAGES              ║
╚══════════════════════════════════════╝

🆕 **New:** ${newCards}
📚 **Learning:** ${learning}
🎓 **Mature:** ${mature}

${createRetentionBar(newCards, learning, mature)}
      `)
      .setFooter({ text: 'Study consistently for best retention!' });

    await interaction.reply({ embeds: [embed] });

  } else if (subcommand === 'decks') {
    const cards = await Flashcard.find({ discordId: userId });
    
    const deckStats = {};
    for (const card of cards) {
      const deck = card.deck || 'default';
      if (!deckStats[deck]) {
        deckStats[deck] = { total: 0, due: 0, mastered: 0 };
      }
      deckStats[deck].total++;
      if (card.nextReview <= new Date()) deckStats[deck].due++;
      if (card.interval >= 21) deckStats[deck].mastered++;
    }
    
    const deckList = Object.entries(deckStats)
      .map(([name, stats]) => {
        const masteryPercent = Math.round((stats.mastered / stats.total) * 100);
        return `📁 **${name}**\n└─ ${stats.total} cards | ${stats.due} due | ${masteryPercent}% mastered`;
      })
      .join('\n\n');

    const embed = new EmbedBuilder()
      .setColor(COLORS.PRIMARY)
      .setTitle('📚 Your Flashcard Decks')
      .setDescription(deckList || '*No decks yet! Create flashcards to get started.*')
      .setFooter({ text: 'Use /flashcard study <deck> to study a specific deck' });

    await interaction.reply({ embeds: [embed] });
  }
}

function createRetentionBar(newCount, learning, mature) {
  const total = newCount + learning + mature;
  if (total === 0) return '`[No cards yet]`';
  
  const newPct = Math.round((newCount / total) * 20);
  const learnPct = Math.round((learning / total) * 20);
  const maturePct = Math.max(0, 20 - newPct - learnPct);
  
  return `\`[${'🟦'.repeat(Math.min(newPct, 20))}${'🟨'.repeat(Math.min(learnPct, 20 - newPct))}${'🟩'.repeat(maturePct)}]\`\n🟦 New 🟨 Learning 🟩 Mature`;
}
