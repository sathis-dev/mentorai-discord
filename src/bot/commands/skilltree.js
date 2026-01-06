import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } from 'discord.js';
import { getOrCreateUser } from '../../services/gamificationService.js';
import { COLORS, EMOJIS, createProgressBar } from '../../config/designSystem.js';

// Skill Tree definitions for each language
const SKILL_TREES = {
  javascript: {
    name: 'JavaScript',
    emoji: '🟨',
    nodes: [
      // Row 1 - Foundation
      { id: 'js-basics', name: 'JS Basics', row: 1, col: 2, requires: [], icon: '📚' },
      
      // Row 2 - Core Concepts
      { id: 'js-variables', name: 'Variables', row: 2, col: 1, requires: ['js-basics'], icon: '📦' },
      { id: 'js-datatypes', name: 'Data Types', row: 2, col: 2, requires: ['js-basics'], icon: '🔤' },
      { id: 'js-operators', name: 'Operators', row: 2, col: 3, requires: ['js-basics'], icon: '➕' },
      
      // Row 3 - Control Flow
      { id: 'js-conditionals', name: 'Conditionals', row: 3, col: 1, requires: ['js-variables'], icon: '🔀' },
      { id: 'js-loops', name: 'Loops', row: 3, col: 2, requires: ['js-datatypes'], icon: '🔄' },
      { id: 'js-functions', name: 'Functions', row: 3, col: 3, requires: ['js-operators'], icon: '⚙️' },
      
      // Row 4 - Data Structures
      { id: 'js-arrays', name: 'Arrays', row: 4, col: 1, requires: ['js-loops'], icon: '📊' },
      { id: 'js-objects', name: 'Objects', row: 4, col: 2, requires: ['js-loops', 'js-functions'], icon: '🎯' },
      { id: 'js-strings', name: 'Strings', row: 4, col: 3, requires: ['js-functions'], icon: '📝' },
      
      // Row 5 - Intermediate
      { id: 'js-callbacks', name: 'Callbacks', row: 5, col: 1, requires: ['js-arrays', 'js-functions'], icon: '📞' },
      { id: 'js-dom', name: 'DOM', row: 5, col: 2, requires: ['js-objects'], icon: '🌐' },
      { id: 'js-events', name: 'Events', row: 5, col: 3, requires: ['js-objects'], icon: '🎪' },
      
      // Row 6 - Advanced
      { id: 'js-promises', name: 'Promises', row: 6, col: 1, requires: ['js-callbacks'], icon: '🤝' },
      { id: 'js-fetch', name: 'Fetch API', row: 6, col: 2, requires: ['js-promises', 'js-dom'], icon: '🌍' },
      { id: 'js-modules', name: 'Modules', row: 6, col: 3, requires: ['js-events'], icon: '📦' },
      
      // Row 7 - Expert
      { id: 'js-async', name: 'Async/Await', row: 7, col: 1, requires: ['js-promises'], icon: '⏳' },
      { id: 'js-classes', name: 'Classes', row: 7, col: 2, requires: ['js-fetch', 'js-modules'], icon: '🏗️' },
      
      // Row 8 - Mastery
      { id: 'js-react', name: 'React', row: 8, col: 1, requires: ['js-async', 'js-classes'], icon: '⚛️' },
      { id: 'js-node', name: 'Node.js', row: 8, col: 2, requires: ['js-async', 'js-modules'], icon: '💚' },
      { id: 'js-typescript', name: 'TypeScript', row: 8, col: 3, requires: ['js-classes'], icon: '🔷' }
    ]
  },
  python: {
    name: 'Python',
    emoji: '🐍',
    nodes: [
      // Row 1 - Foundation
      { id: 'py-basics', name: 'Python Basics', row: 1, col: 2, requires: [], icon: '📚' },
      
      // Row 2 - Core Concepts
      { id: 'py-variables', name: 'Variables', row: 2, col: 1, requires: ['py-basics'], icon: '📦' },
      { id: 'py-datatypes', name: 'Data Types', row: 2, col: 2, requires: ['py-basics'], icon: '🔤' },
      { id: 'py-operators', name: 'Operators', row: 2, col: 3, requires: ['py-basics'], icon: '➕' },
      
      // Row 3 - Control Flow
      { id: 'py-conditionals', name: 'If/Else', row: 3, col: 1, requires: ['py-variables'], icon: '🔀' },
      { id: 'py-loops', name: 'Loops', row: 3, col: 2, requires: ['py-datatypes'], icon: '🔄' },
      { id: 'py-functions', name: 'Functions', row: 3, col: 3, requires: ['py-operators'], icon: '⚙️' },
      
      // Row 4 - Data Structures
      { id: 'py-lists', name: 'Lists', row: 4, col: 1, requires: ['py-loops'], icon: '📊' },
      { id: 'py-dicts', name: 'Dictionaries', row: 4, col: 2, requires: ['py-loops', 'py-functions'], icon: '🗂️' },
      { id: 'py-strings', name: 'Strings', row: 4, col: 3, requires: ['py-functions'], icon: '📝' },
      
      // Row 5 - Intermediate
      { id: 'py-files', name: 'File I/O', row: 5, col: 1, requires: ['py-lists'], icon: '📁' },
      { id: 'py-modules', name: 'Modules', row: 5, col: 2, requires: ['py-dicts'], icon: '📦' },
      { id: 'py-errors', name: 'Error Handling', row: 5, col: 3, requires: ['py-strings'], icon: '⚠️' },
      
      // Row 6 - Advanced
      { id: 'py-oop', name: 'OOP', row: 6, col: 1, requires: ['py-files', 'py-modules'], icon: '🏗️' },
      { id: 'py-comprehensions', name: 'Comprehensions', row: 6, col: 2, requires: ['py-modules'], icon: '✨' },
      { id: 'py-decorators', name: 'Decorators', row: 6, col: 3, requires: ['py-errors', 'py-modules'], icon: '🎀' },
      
      // Row 7 - Expert
      { id: 'py-generators', name: 'Generators', row: 7, col: 1, requires: ['py-oop', 'py-comprehensions'], icon: '⚡' },
      { id: 'py-async', name: 'Asyncio', row: 7, col: 2, requires: ['py-decorators'], icon: '⏳' },
      
      // Row 8 - Mastery
      { id: 'py-data', name: 'Data Science', row: 8, col: 1, requires: ['py-generators'], icon: '📈' },
      { id: 'py-web', name: 'Web (Flask)', row: 8, col: 2, requires: ['py-async'], icon: '🌐' },
      { id: 'py-ml', name: 'Machine Learning', row: 8, col: 3, requires: ['py-data'], icon: '🤖' }
    ]
  }
};

export const data = new SlashCommandBuilder()
  .setName('skill-tree')
  .setDescription('🌳 View your skill progression tree')
  .addStringOption(opt =>
    opt.setName('language')
      .setDescription('Programming language skill tree')
      .setRequired(false)
      .addChoices(
        { name: '🟨 JavaScript', value: 'javascript' },
        { name: '🐍 Python', value: 'python' }
      ));

export async function execute(interaction) {
  await interaction.deferReply();

  const language = interaction.options.getString('language') || 'javascript';

  try {
    const user = await getOrCreateUser(interaction.user.id, interaction.user.username);
    const tree = SKILL_TREES[language];

    if (!tree) {
      return interaction.editReply({ content: '❌ Skill tree not found!' });
    }

    // Get user's unlocked skills for this language
    const unlockedSkills = user.unlockedSkills?.get(language) || [];
    
    // Calculate available skills (all requirements met)
    const availableSkills = tree.nodes.filter(node => {
      if (unlockedSkills.includes(node.id)) return false; // Already unlocked
      return node.requires.every(req => unlockedSkills.includes(req));
    }).map(n => n.id);

    // Build visual skill tree
    const treeVisual = buildTreeVisual(tree, unlockedSkills, availableSkills);
    
    // Calculate progress
    const totalSkills = tree.nodes.length;
    const unlockedCount = unlockedSkills.length;
    const progress = Math.round((unlockedCount / totalSkills) * 100);

    // Build embed
    const embed = new EmbedBuilder()
      .setTitle(`${tree.emoji} ${tree.name} Skill Tree`)
      .setColor(COLORS.LESSON_BLUE)
      .setDescription([
        '```',
        treeVisual,
        '```'
      ].join('\n'))
      .addFields({
        name: '📊 Progress',
        value: `${createProgressBar(unlockedCount, totalSkills, 15)} ${unlockedCount}/${totalSkills} (${progress}%)`,
        inline: false
      });

    // Add legend
    embed.addFields({
      name: '📖 Legend',
      value: '✅ Mastered  |  🔓 Available  |  🔒 Locked',
      inline: false
    });

    // Show next available skills
    if (availableSkills.length > 0) {
      const nextSkills = tree.nodes
        .filter(n => availableSkills.includes(n.id))
        .slice(0, 3)
        .map(n => `${n.icon} **${n.name}** - Take a quiz to unlock!`)
        .join('\n');
      
      embed.addFields({
        name: '🎯 Next to Unlock',
        value: nextSkills || 'Complete prerequisites first!',
        inline: false
      });
    }

    embed.setFooter({ text: '💡 Complete quizzes with 70%+ accuracy to unlock skills!' });

    // Create navigation buttons
    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId('skilltree_select')
      .setPlaceholder('🔍 Select a skill to learn')
      .addOptions(
        tree.nodes
          .filter(n => availableSkills.includes(n.id))
          .slice(0, 25)
          .map(n => ({
            label: n.name,
            description: `Row ${n.row} - ${unlockedSkills.includes(n.id) ? 'Mastered' : 'Available'}`,
            value: n.id,
            emoji: n.icon
          }))
      );

    // Only add select menu if there are options
    const components = [];
    if (availableSkills.length > 0) {
      components.push(new ActionRowBuilder().addComponents(selectMenu));
    }

    // Add switch language button
    const buttons = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`skilltree_switch_${language === 'javascript' ? 'python' : 'javascript'}`)
        .setLabel(`View ${language === 'javascript' ? 'Python' : 'JavaScript'} Tree`)
        .setEmoji(language === 'javascript' ? '🐍' : '🟨')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('skilltree_details')
        .setLabel('Skill Details')
        .setEmoji('📋')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('exec_quiz')
        .setLabel('Take Quiz')
        .setEmoji('❓')
        .setStyle(ButtonStyle.Success)
    );
    components.push(buttons);

    await interaction.editReply({ embeds: [embed], components });

  } catch (error) {
    console.error('Skill tree error:', error);
    const errorEmbed = new EmbedBuilder()
      .setTitle('❌ Error Loading Skill Tree')
      .setColor(COLORS.ERROR)
      .setDescription('Failed to load your skill tree. Please try again!');
    await interaction.editReply({ embeds: [errorEmbed] });
  }
}

/**
 * Build ASCII visual representation of skill tree
 */
function buildTreeVisual(tree, unlocked, available) {
  const lines = [];
  const maxRow = Math.max(...tree.nodes.map(n => n.row));
  const width = 40;

  lines.push(`🌳 ${tree.name} Skill Tree`);
  lines.push('═'.repeat(width));

  // Process each row from top to bottom (higher rows = more advanced)
  for (let row = maxRow; row >= 1; row--) {
    const rowNodes = tree.nodes.filter(n => n.row === row).sort((a, b) => a.col - b.col);
    
    if (rowNodes.length === 0) continue;

    // Connection lines to children (skills below)
    if (row < maxRow) {
      let connLine = '';
      const positions = [10, 20, 30]; // Approximate column positions
      
      for (const node of rowNodes) {
        const childNodes = tree.nodes.filter(n => n.requires.includes(node.id));
        if (childNodes.length > 0) {
          connLine = '       │       │       │';
        }
      }
      if (connLine) lines.push(connLine);
    }

    // Skill nodes
    let line = '';
    for (let col = 1; col <= 3; col++) {
      const node = rowNodes.find(n => n.col === col);
      if (node) {
        const status = unlocked.includes(node.id) ? '✅' : 
                       available.includes(node.id) ? '🔓' : '🔒';
        const name = node.name.length > 10 ? node.name.substring(0, 9) + '.' : node.name.padEnd(10);
        line += ` [${status}${name}] `;
      } else {
        line += '               ';
      }
    }
    lines.push(line.trimEnd());

    // Connection line below
    if (row > 1) {
      const hasConnections = rowNodes.some(n => n.requires.length > 0);
      if (hasConnections) {
        lines.push('       │       │       │');
      }
    }
  }

  lines.push('═'.repeat(width));
  
  return lines.join('\n');
}

/**
 * Handle skill tree button interactions
 */
export async function handleSkillTreeButton(interaction, action, params) {
  if (action === 'switch') {
    const newLang = params[0];
    await interaction.deferUpdate();
    
    const user = await getOrCreateUser(interaction.user.id, interaction.user.username);
    const tree = SKILL_TREES[newLang];
    
    const unlockedSkills = user.unlockedSkills?.get(newLang) || [];
    const availableSkills = tree.nodes.filter(node => {
      if (unlockedSkills.includes(node.id)) return false;
      return node.requires.every(req => unlockedSkills.includes(req));
    }).map(n => n.id);

    const treeVisual = buildTreeVisual(tree, unlockedSkills, availableSkills);
    const totalSkills = tree.nodes.length;
    const progress = Math.round((unlockedSkills.length / totalSkills) * 100);

    const embed = new EmbedBuilder()
      .setTitle(`${tree.emoji} ${tree.name} Skill Tree`)
      .setColor(COLORS.LESSON_BLUE)
      .setDescription(`\`\`\`\n${treeVisual}\n\`\`\``)
      .addFields({
        name: '📊 Progress',
        value: `${createProgressBar(unlockedSkills.length, totalSkills, 15)} ${unlockedSkills.length}/${totalSkills} (${progress}%)`,
        inline: false
      })
      .addFields({
        name: '📖 Legend',
        value: '✅ Mastered  |  🔓 Available  |  🔒 Locked',
        inline: false
      })
      .setFooter({ text: '💡 Complete quizzes with 70%+ accuracy to unlock skills!' });

    const buttons = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`skilltree_switch_${newLang === 'javascript' ? 'python' : 'javascript'}`)
        .setLabel(`View ${newLang === 'javascript' ? 'Python' : 'JavaScript'} Tree`)
        .setEmoji(newLang === 'javascript' ? '🐍' : '🟨')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('skilltree_details')
        .setLabel('Skill Details')
        .setEmoji('📋')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('exec_quiz')
        .setLabel('Take Quiz')
        .setEmoji('❓')
        .setStyle(ButtonStyle.Success)
    );

    await interaction.editReply({ embeds: [embed], components: [buttons] });
  }
  
  if (action === 'details') {
    await interaction.reply({
      content: [
        '📋 **Skill Tree Details**',
        '',
        '**How to unlock skills:**',
        '• Take quizzes on the topic',
        '• Score 70% or higher to unlock',
        '• Complete prerequisites first',
        '',
        '**Benefits of unlocking:**',
        '• Track your learning progress',
        '• See clear learning paths',
        '• Unlock advanced topics',
        '',
        '**Tips:**',
        '• Start from the bottom (basics)',
        '• Master prerequisites first',
        '• Take multiple quizzes for accuracy'
      ].join('\n'),
      ephemeral: true
    });
  }
}

/**
 * Unlock a skill for a user
 */
export async function unlockSkill(userId, language, skillId) {
  const user = await getOrCreateUser(userId, 'User');
  
  if (!user.unlockedSkills) {
    user.unlockedSkills = new Map();
  }
  
  const currentSkills = user.unlockedSkills.get(language) || [];
  if (!currentSkills.includes(skillId)) {
    currentSkills.push(skillId);
    user.unlockedSkills.set(language, currentSkills);
    await user.save();
    return true;
  }
  
  return false;
}

/**
 * Check if a skill can be unlocked based on topic accuracy
 */
export function getMatchingSkill(language, topic) {
  const tree = SKILL_TREES[language];
  if (!tree) return null;
  
  // Try to match topic to a skill
  const normalizedTopic = topic.toLowerCase().replace(/\s+/g, '-');
  
  return tree.nodes.find(n => 
    n.id.includes(normalizedTopic) || 
    n.name.toLowerCase().includes(topic.toLowerCase())
  );
}
