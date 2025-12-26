import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { generateWithAI } from '../../ai/index.js';
import { getOrCreateUser } from '../../services/gamificationService.js';
import { COLORS } from '../../config/designSystem.js';
import { animateLoading } from '../../utils/animations.js';

export const data = new SlashCommandBuilder()
  .setName('funfact')
  .setDescription('🎲 Get an amazing AI-generated fun fact about any topic!')
  .addStringOption(option =>
    option.setName('topic')
      .setDescription('Topic for the fun fact (leave empty for random)')
      .setAutocomplete(true))
  .addStringOption(option =>
    option.setName('category')
      .setDescription('Choose a category')
      .addChoices(
        { name: '💻 Programming', value: 'programming' },
        { name: '🤖 AI & Machine Learning', value: 'artificial intelligence' },
        { name: '🌌 Space & Science', value: 'space' },
        { name: '🎮 Gaming History', value: 'video games history' },
        { name: '🔒 Cybersecurity', value: 'cybersecurity' },
        { name: '🎲 Random', value: 'random' }
      ));

const RANDOM_TOPICS = [
  'programming', 'artificial intelligence', 'space', 'mathematics', 
  'computer science', 'internet history', 'famous programmers',
  'coding languages', 'tech companies', 'algorithms', 'cybersecurity',
  'video games history', 'robotics', 'quantum computing', 'blockchain',
  'open source software', 'Silicon Valley history', 'computer viruses',
  'Easter eggs in software', 'programming languages origins'
];

const CATEGORY_COLORS = {
  'programming': 0x3498DB,
  'artificial intelligence': 0x9B59B6,
  'space': 0x1ABC9C,
  'video games history': 0xE91E63,
  'cybersecurity': 0xE74C3C,
  'random': COLORS.LESSON_BLUE
};

export async function execute(interaction) {
  await interaction.deferReply();

  let topic = interaction.options.getString('topic');
  const category = interaction.options.getString('category');
  
  // Use category if no topic specified
  if (!topic && category && category !== 'random') {
    topic = category;
  } else if (!topic) {
    topic = RANDOM_TOPICS[Math.floor(Math.random() * RANDOM_TOPICS.length)];
  }

  const embedColor = CATEGORY_COLORS[topic] || COLORS.LESSON_BLUE;

  try {
    const user = await getOrCreateUser(interaction.user.id, interaction.user.username);

    // Animated loading
    await animateLoading(interaction, {
      title: '🎲 Discovering Fun Fact',
      color: embedColor,
      duration: 2000,
      style: 'sparkle',
      stages: [
        { text: 'Exploring: **' + topic + '**', status: '🔍 Searching' },
        { text: 'Found something cool!', status: '✨ Discovered' }
      ]
    });

    // Generate fun fact with AI
    const result = await generateWithAI(
      `You are a fun fact generator. Generate ONE interesting, surprising, and educational fun fact about the given topic. 
      Format your response as JSON: {"fact": "the fun fact here", "emoji": "relevant emoji", "source": "brief source or context", "didYouKnow": true}
      Make it engaging and shareable. The fact should be mind-blowing or surprising.`,
      `Generate a fun fact about: ${topic}`,
      { jsonMode: true, maxTokens: 300 }
    );

    let factData;
    try {
      factData = JSON.parse(result);
    } catch {
      factData = {
        fact: `Did you know? ${topic} is one of the most fascinating subjects in technology!`,
        emoji: '🧠',
        source: 'MentorAI'
      };
    }

    // Award small XP for curiosity
    await user.addXp(5);
    
    // Track fun facts viewed
    user.funFactsViewed = (user.funFactsViewed || 0) + 1;
    user.lastFunFactDate = new Date();
    await user.save();

    const embed = new EmbedBuilder()
      .setTitle(factData.emoji + ' Fun Fact')
      .setColor(embedColor)
      .setDescription(
        '```ansi\n' +
        '\u001b[1;36m╔═══════════════════════════════════╗\u001b[0m\n' +
        '\u001b[1;36m║\u001b[0m   🎲 DID YOU KNOW?   \u001b[1;36m║\u001b[0m\n' +
        '\u001b[1;36m╚═══════════════════════════════════╝\u001b[0m\n' +
        '```\n\n' +
        '> 💡 **' + factData.fact + '**'
      )
      .addFields(
        { name: '🎯 Topic', value: '```\n' + topic.charAt(0).toUpperCase() + topic.slice(1) + '\n```', inline: true },
        { name: '📚 Source', value: '```\n' + (factData.source || 'General Knowledge') + '\n```', inline: true },
        { name: '✨ Reward', value: '```diff\n+ 5 XP\n```', inline: true }
      )
      .setFooter({ text: '🎓 MentorAI | Curiosity earns XP! Use /funfact for more' })
      .setTimestamp();

    const buttons = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('funfact_another')
        .setLabel('Another Fact')
        .setEmoji('🎲')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('funfact_learn_' + encodeURIComponent(topic))
        .setLabel('Learn More')
        .setEmoji('📚')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId('funfact_quiz_' + encodeURIComponent(topic))
        .setLabel('Quiz Me')
        .setEmoji('🎯')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('execute_share')
        .setLabel('Share')
        .setEmoji('📤')
        .setStyle(ButtonStyle.Secondary)
    );

    await interaction.editReply({ embeds: [embed], components: [buttons] });

  } catch (error) {
    console.error('Fun fact error:', error);
    
    // Fallback fun facts with premium styling
    const fallbackFacts = [
      { fact: 'The first computer bug was an actual bug - a moth found in Harvard\'s Mark II computer in 1947!', emoji: '🐛', topic: 'Computer History' },
      { fact: 'Python was named after Monty Python, not the snake!', emoji: '🐍', topic: 'Python' },
      { fact: 'The first programmer was Ada Lovelace, who wrote code in the 1840s!', emoji: '👩‍💻', topic: 'Programming History' },
      { fact: 'JavaScript was created in just 10 days by Brendan Eich in 1995!', emoji: '⚡', topic: 'JavaScript' },
      { fact: 'The first computer mouse was made of wood!', emoji: '🖱️', topic: 'Hardware' },
      { fact: 'The first domain ever registered was symbolics.com in 1985!', emoji: '🌐', topic: 'Internet History' },
      { fact: 'Over 500 hours of video are uploaded to YouTube every minute!', emoji: '🎥', topic: 'Tech Stats' }
    ];
    
    const randomFact = fallbackFacts[Math.floor(Math.random() * fallbackFacts.length)];
    
    const embed = new EmbedBuilder()
      .setTitle(randomFact.emoji + ' Fun Fact')
      .setColor(COLORS.LESSON_BLUE)
      .setDescription(
        '```ansi\n' +
        '\u001b[1;36m╔═══════════════════════════════════╗\u001b[0m\n' +
        '\u001b[1;36m║\u001b[0m   🎲 DID YOU KNOW?   \u001b[1;36m║\u001b[0m\n' +
        '\u001b[1;36m╚═══════════════════════════════════╝\u001b[0m\n' +
        '```\n\n' +
        '> 💡 **' + randomFact.fact + '**'
      )
      .addFields(
        { name: '🎯 Topic', value: '```\n' + randomFact.topic + '\n```', inline: true }
      )
      .setFooter({ text: '🎓 MentorAI | /funfact for more!' })
      .setTimestamp();

    const buttons = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('funfact_another')
        .setLabel('Another Fact')
        .setEmoji('🎲')
        .setStyle(ButtonStyle.Primary)
    );

    await interaction.editReply({ embeds: [embed], components: [buttons] });
  }
}
