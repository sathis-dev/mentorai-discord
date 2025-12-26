import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('ping')
  .setDescription('Check bot latency and status');

export async function execute(interaction) {
  const start = Date.now();
  
  await interaction.reply({ content: '🏓 Pinging...' });
  
  const latency = Date.now() - start;
  const apiLatency = Math.round(interaction.client.ws.ping);
  
  let color = 0x57F287; // Green
  if (latency > 200) color = 0xFEE75C; // Yellow
  if (latency > 500) color = 0xED4245; // Red
  
  const embed = new EmbedBuilder()
    .setTitle('🏓 Pong!')
    .setColor(color)
    .addFields(
      { name: '📡 Bot Latency', value: `${latency}ms`, inline: true },
      { name: '🌐 API Latency', value: `${apiLatency}ms`, inline: true },
      { name: '✅ Status', value: 'Online & Ready!', inline: true },
    )
    .setTimestamp()
    .setFooter({ text: '🎓 MentorAI' });
  
  await interaction.editReply({ content: null, embeds: [embed] });
}
