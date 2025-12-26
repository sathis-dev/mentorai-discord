import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { POPULAR_TOPICS } from '../../services/learningService.js';
import { createTopicSelectMenu, COLORS } from '../../config/designSystem.js';

export const data = new SlashCommandBuilder()
  .setName('topics')
  .setDescription('📚 Browse popular learning topics');

export async function execute(interaction) {
  // Create beautiful topics display
  const categories = {
    languages: { emoji: '💻', name: 'Programming Languages', topics: [] },
    frameworks: { emoji: '⚛️', name: 'Frameworks & Libraries', topics: [] },
    web: { emoji: '🌐', name: 'Web Development', topics: [] },
    databases: { emoji: '🗄️', name: 'Databases', topics: [] },
    tools: { emoji: '🔧', name: 'Developer Tools', topics: [] },
    concepts: { emoji: '🧠', name: 'CS Concepts', topics: [] }
  };

  // Organize topics by category
  POPULAR_TOPICS.forEach(topic => {
    const cat = topic.category || 'concepts';
    if (categories[cat]) {
      categories[cat].topics.push(topic);
    } else {
      categories.concepts.topics.push(topic);
    }
  });

  const embed = new EmbedBuilder()
    .setTitle('📚 Learning Topics')
    .setColor(COLORS.LESSON_BLUE)
    .setDescription('**Explore our curated topics or type your own!**\n' +
      'Use `/learn topic:<name>` or `/quiz topic:<name>`\n\n' +
      '━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  // Add categorized topics
  Object.entries(categories).forEach(([key, cat]) => {
    if (cat.topics.length > 0) {
      const topicList = cat.topics.map(t => t.emoji + ' ' + t.name).join('\n');
      embed.addFields({
        name: cat.emoji + ' ' + cat.name,
        value: topicList,
        inline: true
      });
    }
  });

  embed.addFields({
    name: '💡 Pro Tip',
    value: 'You can learn about **any topic** - not just these! Try `/learn topic:Machine Learning`',
    inline: false
  });

  embed.setFooter({ text: '🎓 MentorAI | Powered by AI' });
  embed.setTimestamp();

  // Topic select menu
  const selectMenu = createTopicSelectMenu(POPULAR_TOPICS.slice(0, 25));

  await interaction.reply({ embeds: [embed], components: [selectMenu] });
}
