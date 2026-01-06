import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { User } from '../../database/models/User.js';
import { Quiz } from '../../database/models/Quiz.js';
import { Lesson } from '../../database/models/Lesson.js';

// ═══════════════════════════════════════════════════════════════════════════════
//  📊 V4 DESIGN SYSTEM - PREMIUM GLOBAL STATS
//  Beautiful visualization of platform statistics
// ═══════════════════════════════════════════════════════════════════════════════

export const data = new SlashCommandBuilder()
  .setName('stats')
  .setDescription('📊 View global MentorAI platform statistics');

export async function execute(interaction) {
  await interaction.deferReply();
  
  try {
    // ═══ Gather Statistics ═══
    let userCount = 0;
    let quizCount = 0;
    let lessonCount = 0;
    let totalXP = 0;
    let avgLevel = 0;
    let topStreak = 0;
    
    try {
      userCount = await User.countDocuments() || 0;
      quizCount = await Quiz.countDocuments() || 0;
      lessonCount = await Lesson.countDocuments() || 0;
      
      const xpResult = await User.aggregate([
        { $group: { _id: null, total: { $sum: '$xp' }, avgLvl: { $avg: '$level' }, maxStreak: { $max: '$streak' } } }
      ]);
      totalXP = xpResult[0]?.total || 0;
      avgLevel = Math.round(xpResult[0]?.avgLvl || 1);
      topStreak = xpResult[0]?.maxStreak || 0;
    } catch (dbError) {
      console.error('Database error in stats:', dbError);
    }

    const serverCount = interaction.client.guilds.cache.size;
    const uptime = formatUptime(interaction.client.uptime);

    // ═══ Create Stats Panel ═══
    const statsPanel = `\`\`\`
📊 MENTORAI GLOBAL STATISTICS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

👥 COMMUNITY
├─ Total Learners:    ${userCount.toLocaleString()}
├─ Active Servers:    ${serverCount}
└─ Average Level:     ${avgLevel}

📚 CONTENT
├─ Quizzes Created:   ${quizCount.toLocaleString()}
└─ Lessons Generated: ${lessonCount.toLocaleString()}

✨ ACHIEVEMENTS
├─ Total XP Earned:   ${totalXP.toLocaleString()}
└─ Highest Streak:    ${topStreak} days
\`\`\``;

    // ═══ Main Embed ═══
    const embed = new EmbedBuilder()
      .setColor(0x5865F2)
      .setTitle('📊 MentorAI Platform Statistics')
      .setDescription(statsPanel)
      .addFields(
        {
          name: '⏱️ Bot Status',
          value: `\`\`\`\n🟢 Online • Uptime: ${uptime}\n\`\`\``,
          inline: false
        },
        {
          name: '🌟 Fun Facts',
          value: generateFunFact(userCount, totalXP, quizCount, lessonCount),
          inline: false
        }
      )
      .setFooter({ 
        text: '🎓 MentorAI • Growing Together',
        iconURL: interaction.client.user?.displayAvatarURL()
      })
      .setTimestamp();

    // ═══ Action Buttons ═══
    const buttons = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('exec_leaderboard')
        .setLabel('Leaderboard')
        .setEmoji('🏆')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('exec_profile')
        .setLabel('My Profile')
        .setEmoji('👤')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('help_main')
        .setLabel('Menu')
        .setEmoji('🏠')
        .setStyle(ButtonStyle.Secondary)
    );
    
    await interaction.editReply({ embeds: [embed], components: [buttons] });
    
  } catch (error) {
    console.error('Stats command error:', error);
    
    const errorEmbed = new EmbedBuilder()
      .setTitle('❌ Error')
      .setDescription('Failed to load platform stats. Please try again!')
      .setColor(0xED4245)
      .setFooter({ text: '🎓 MentorAI' });
    
    await interaction.editReply({ embeds: [errorEmbed] });
  }
}

// ═══════════════════════════════════════════════════════════
// 🛠️ HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════

function formatUptime(ms) {
  if (!ms) return 'N/A';
  
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) return `${days}d ${hours % 24}h ${minutes % 60}m`;
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
  return `${seconds}s`;
}

function generateFunFact(users, xp, quizzes, lessons) {
  const facts = [];
  
  if (xp > 1000000) {
    facts.push(`💫 Over **${(xp / 1000000).toFixed(1)}M XP** earned collectively!`);
  } else if (xp > 100000) {
    facts.push(`💫 Over **${(xp / 1000).toFixed(0)}K XP** earned collectively!`);
  } else {
    facts.push(`💫 Community has earned **${xp.toLocaleString()} XP** together!`);
  }
  
  if (quizzes > 100) {
    facts.push(`📝 That's **${(quizzes / users).toFixed(1)}** quizzes per learner on average!`);
  }
  
  if (lessons > 50) {
    facts.push(`📚 **${lessons}** unique lessons generated by AI!`);
  }
  
  const avgXP = users > 0 ? Math.round(xp / users) : 0;
  facts.push(`✨ Average learner has **${avgXP.toLocaleString()} XP**!`);
  
  return facts.slice(0, 3).join('\n') || '🚀 Growing every day!';
}
