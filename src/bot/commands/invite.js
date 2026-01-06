import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('invite')
  .setDescription('Get the invite link to add MentorAI to your server');

export async function execute(interaction) {
  const clientId = process.env.DISCORD_CLIENT_ID || interaction.client.user.id;
  const inviteUrl = `https://discord.com/api/oauth2/authorize?client_id=${clientId}&permissions=277025508416&scope=bot%20applications.commands`;
  
  const embed = new EmbedBuilder()
    .setTitle('🎓 Invite MentorAI')
    .setColor(0x5865F2)
    .setDescription('Bring AI-powered learning to your server!')
    .addFields({
      name: '✨ Features',
      value: '• 🤖 AI-generated lessons & quizzes\n• 📊 XP & leveling system\n• 🏆 Achievements & leaderboards\n• 🔥 Daily streaks & rewards\n• 👥 Study parties with friends',
    })
    .setTimestamp()
    .setFooter({ text: '🎓 MentorAI - Learn & Level Up!' });
  
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setLabel('Add to Server')
      .setStyle(ButtonStyle.Link)
      .setURL(inviteUrl)
      .setEmoji('➕'),
    new ButtonBuilder()
      .setCustomId('help_main')
      .setLabel('Menu')
      .setStyle(ButtonStyle.Secondary)
      .setEmoji('🏠'),
  );
  
  await interaction.reply({ embeds: [embed], components: [row] });
}
