import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { COLORS, EMOJIS } from '../../config/brandSystem.js';

export const data = new SlashCommandBuilder()
  .setName('website')
  .setDescription('🌐 Visit the MentorAI website and dashboard');

export async function execute(interaction) {
  const embed = new EmbedBuilder()
    .setColor(COLORS.PRIMARY)
    .setAuthor({
      name: '🌐 MentorAI Online',
      iconURL: interaction.client.user.displayAvatarURL()
    })
    .setTitle('Visit Us Online!')
    .setDescription(`
╭───────────────────────────────╮
│                               │
│  ${EMOJIS.SPARKLE} **MentorAI Web Platform** ${EMOJIS.SPARKLE}  │
│                               │
╰───────────────────────────────╯

**🌐 Official Website**
View all features, live stats, and learn more about MentorAI

**📊 Dashboard**
Track your learning progress online with Discord login

**💬 Support Server**
Get help, report issues, and meet other learners

**📖 Documentation**
Full command reference and guides

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

*Click the buttons below to visit!*
    `)
    .setThumbnail(interaction.client.user.displayAvatarURL({ size: 256 }))
    .addFields(
      {
        name: '🔗 Quick Links',
        value: [
          '• **Website**: mentorai.dev',
          '• **Dashboard**: mentorai.dev/dashboard',
          '• **GitHub**: github.com/sathis-dev/mentorai-discord'
        ].join('\n'),
        inline: false
      }
    )
    .setFooter({
      text: '🚀 Learn to code like playing a game!',
      iconURL: interaction.user.displayAvatarURL()
    })
    .setTimestamp();

  const row1 = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setLabel('🌐 Website')
        .setURL('https://mentorai.dev')
        .setStyle(ButtonStyle.Link),
      new ButtonBuilder()
        .setLabel('📊 Dashboard')
        .setURL('https://mentorai.dev/dashboard')
        .setStyle(ButtonStyle.Link),
      new ButtonBuilder()
        .setLabel('💬 Support Server')
        .setURL('https://discord.gg/mentorai')
        .setStyle(ButtonStyle.Link)
    );

  const row2 = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setLabel('➕ Add MentorAI to Your Server')
        .setURL(`https://discord.com/api/oauth2/authorize?client_id=${interaction.client.user.id}&permissions=277025704960&scope=bot%20applications.commands`)
        .setStyle(ButtonStyle.Link),
      new ButtonBuilder()
        .setLabel('⭐ GitHub')
        .setURL('https://github.com/sathis-dev/mentorai-discord')
        .setStyle(ButtonStyle.Link)
    );

  await interaction.reply({ embeds: [embed], components: [row1, row2] });
}
