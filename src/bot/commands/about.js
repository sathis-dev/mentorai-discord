import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { COLORS, EMOJIS, VISUALS } from '../../config/brandSystem.js';
import User from '../../database/models/User.js';

export const data = new SlashCommandBuilder()
  .setName('about')
  .setDescription('📖 Learn about MentorAI and see live statistics');

export async function execute(interaction) {
  await interaction.deferReply();
  
  const client = interaction.client;
  
  // Gather real stats
  let userCount = 0;
  let totalXP = 0;
  let activeStreaks = 0;
  
  try {
    const [countResult, xpResult, streakResult] = await Promise.all([
      User.countDocuments(),
      User.aggregate([{ $group: { _id: null, total: { $sum: '$xp' } } }]),
      User.countDocuments({ streak: { $gt: 0 } })
    ]);
    
    userCount = countResult;
    totalXP = xpResult[0]?.total || 0;
    activeStreaks = streakResult;
  } catch (error) {
    console.error('Error fetching stats:', error);
  }

  const serverCount = client.guilds.cache.size;
  
  // Calculate uptime
  const uptime = process.uptime();
  const days = Math.floor(uptime / 86400);
  const hours = Math.floor((uptime % 86400) / 3600);
  const minutes = Math.floor((uptime % 3600) / 60);
  const uptimeStr = `${days}d ${hours}h ${minutes}m`;

  const embed = new EmbedBuilder()
    .setColor(COLORS.PRIMARY)
    .setAuthor({
      name: '🎓 About MentorAI',
      iconURL: client.user.displayAvatarURL()
    })
    .setTitle('Learn to Code Like Playing a Game')
    .setDescription(`
${VISUALS.HEADER_LINE}

MentorAI is an **AI-powered Discord bot** that transforms coding education into an engaging, gamified experience.

${VISUALS.DIVIDER}

**🧠 AI-Powered Learning**
${EMOJIS.DOT} GPT-4o generated lessons on any topic
${EMOJIS.DOT} Intelligent quizzes with explanations
${EMOJIS.DOT} Personalized learning insights

**🎮 Full Gamification**
${EMOJIS.DOT} XP, levels, and ranks (50 levels!)
${EMOJIS.DOT} Daily streaks with multipliers (up to 2x)
${EMOJIS.DOT} 30+ achievements across 6 categories

**⚔️ Social Competition**
${EMOJIS.DOT} 1v1 quiz challenges
${EMOJIS.DOT} Study parties with friends
${EMOJIS.DOT} Global & server leaderboards

**💻 Code Execution**
${EMOJIS.DOT} Run code in 15+ languages
${EMOJIS.DOT} AI code review
${EMOJIS.DOT} Practice challenges

${VISUALS.HEADER_LINE}
    `)
    .addFields(
      {
        name: '📊 Live Statistics',
        value: `\`\`\`yaml
Users       : ${userCount.toLocaleString()}
Servers     : ${serverCount.toLocaleString()}
Commands    : 35
Languages   : 15+
Total XP    : ${totalXP.toLocaleString()}
Streaks     : ${activeStreaks.toLocaleString()} active
\`\`\``,
        inline: true
      },
      {
        name: '🛠️ Tech Stack',
        value: `\`\`\`yaml
Runtime     : Node.js 18+
Framework   : Discord.js v14
Database    : MongoDB
AI Models   : GPT-4o, Gemini
Version     : 3.0.0
Uptime      : ${uptimeStr}
\`\`\``,
        inline: true
      }
    )
    .setThumbnail(client.user.displayAvatarURL({ size: 256 }))
    .setFooter({
      text: `Version 3.0.0 • Made with ❤️ for learners`,
      iconURL: client.user.displayAvatarURL()
    })
    .setTimestamp();

  const row1 = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setLabel('🌐 Website')
        .setURL('https://mentorai.dev')
        .setStyle(ButtonStyle.Link),
      new ButtonBuilder()
        .setLabel('➕ Add Bot')
        .setURL(`https://discord.com/api/oauth2/authorize?client_id=${client.user.id}&permissions=277025704960&scope=bot%20applications.commands`)
        .setStyle(ButtonStyle.Link),
      new ButtonBuilder()
        .setLabel('💬 Support')
        .setURL('https://discord.gg/mentorai')
        .setStyle(ButtonStyle.Link),
      new ButtonBuilder()
        .setLabel('⭐ GitHub')
        .setURL('https://github.com/sathis-dev/mentorai-discord')
        .setStyle(ButtonStyle.Link)
    );

  const row2 = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('about_features')
        .setLabel('✨ All Features')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('about_commands')
        .setLabel('📋 Commands')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('about_changelog')
        .setLabel('📝 Changelog')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('profile_view')
        .setLabel('👤 My Profile')
        .setStyle(ButtonStyle.Secondary)
    );

  await interaction.editReply({ embeds: [embed], components: [row1, row2] });
}
