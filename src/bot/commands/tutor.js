import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle } from 'discord.js';
import Conversation from '../../database/models/Conversation.js';
import { generateTutorResponse } from '../../ai/tutorAI.js';
import { COLORS } from '../../config/colors.js';

export const data = new SlashCommandBuilder()
  .setName('tutor')
  .setDescription('Your personal AI coding tutor with memory')
  .addSubcommand(sub =>
    sub.setName('ask')
      .setDescription('Ask your AI tutor anything')
      .addStringOption(opt =>
        opt.setName('question')
          .setDescription('Your question')
          .setRequired(true)))
  .addSubcommand(sub =>
    sub.setName('topic')
      .setDescription('Set your current learning topic')
      .addStringOption(opt =>
        opt.setName('topic')
          .setDescription('Topic to focus on')
          .setRequired(true)))
  .addSubcommand(sub =>
    sub.setName('history')
      .setDescription('View conversation history'))
  .addSubcommand(sub =>
    sub.setName('reset')
      .setDescription('Start a fresh conversation'))
  .addSubcommand(sub =>
    sub.setName('goals')
      .setDescription('Set your learning goals'));

export async function execute(interaction) {
  const subcommand = interaction.options.getSubcommand();
  const userId = interaction.user.id;
  
  // Get or create conversation
  let conversation = await Conversation.findOne({ discordId: userId });
  if (!conversation) {
    conversation = await Conversation.create({
      discordId: userId,
      guildId: interaction.guildId,
      messages: []
    });
  }

  if (subcommand === 'ask') {
    await interaction.deferReply();
    
    const question = interaction.options.getString('question');
    
    // Build context from conversation history
    const contextMessages = conversation.getContext();
    
    // Add user question to conversation
    await conversation.addMessage('user', question);
    
    try {
      // Generate AI response with full context
      const response = await generateTutorResponse({
        question,
        history: contextMessages,
        topic: conversation.topic,
        goals: conversation.learningGoals,
        weaknesses: conversation.identifiedWeaknesses,
        userName: interaction.user.username
      });
      
      // Save AI response
      await conversation.addMessage('assistant', response.content);
      
      const embed = new EmbedBuilder()
        .setColor(COLORS.PRIMARY)
        .setAuthor({
          name: '🧠 AI Tutor',
          iconURL: interaction.client.user.displayAvatarURL()
        })
        .setTitle(`📚 ${conversation.topic || 'General'} Help`)
        .setDescription(response.content.slice(0, 4000))
        .addFields({
          name: '💬 Your Question',
          value: `> ${question.slice(0, 200)}${question.length > 200 ? '...' : ''}`,
          inline: false
        })
        .setFooter({
          text: `Session: ${conversation.messageCount} messages • /tutor history to review`,
          iconURL: interaction.user.displayAvatarURL()
        })
        .setTimestamp();

      // Add detected weakness if any
      if (response.detectedWeakness) {
        if (!conversation.identifiedWeaknesses.includes(response.detectedWeakness)) {
          conversation.identifiedWeaknesses.push(response.detectedWeakness);
          await conversation.save();
        }
        embed.addFields({
          name: '💡 Learning Tip',
          value: `I noticed you might want to review: **${response.detectedWeakness}**`,
          inline: false
        });
      }

      const row = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('tutor_followup')
            .setLabel('🔄 Follow-up')
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId('tutor_example')
            .setLabel('📝 Show Example')
            .setStyle(ButtonStyle.Secondary),
          new ButtonBuilder()
            .setCustomId('tutor_quiz')
            .setLabel('🎯 Quiz Me')
            .setStyle(ButtonStyle.Success),
          new ButtonBuilder()
            .setCustomId('tutor_explain_simpler')
            .setLabel('🔽 Simpler')
            .setStyle(ButtonStyle.Secondary)
        );

      await interaction.editReply({ embeds: [embed], components: [row] });

    } catch (error) {
      console.error('Tutor error:', error);
      await interaction.editReply({
        content: '❌ Sorry, I encountered an error. Please try again!',
        ephemeral: true
      });
    }

  } else if (subcommand === 'topic') {
    const topic = interaction.options.getString('topic');
    conversation.topic = topic;
    await conversation.save();
    
    const embed = new EmbedBuilder()
      .setColor(COLORS.SUCCESS)
      .setTitle('📚 Topic Set!')
      .setDescription(`
Your AI tutor will now focus on: **${topic}**

The tutor will:
• Remember our conversation context
• Tailor explanations to ${topic}
• Track your progress in this area
• Identify areas to improve

Ask your first question with \`/tutor ask\`!
      `)
      .setFooter({ text: '🧠 AI Tutor - Personalized Learning' });

    await interaction.reply({ embeds: [embed] });

  } else if (subcommand === 'history') {
    const recentMessages = conversation.messages.slice(-10);
    
    let historyText = '';
    for (const msg of recentMessages) {
      const prefix = msg.role === 'user' ? '👤 You' : '🤖 Tutor';
      const content = msg.content.slice(0, 150) + (msg.content.length > 150 ? '...' : '');
      historyText += `**${prefix}:** ${content}\n\n`;
    }
    
    const embed = new EmbedBuilder()
      .setColor(COLORS.PRIMARY)
      .setTitle('📜 Conversation History')
      .setDescription(historyText || '*No conversation yet. Start with /tutor ask!*')
      .addFields(
        { name: '📊 Stats', value: `Messages: ${conversation.messageCount}\nTopic: ${conversation.topic || 'General'}`, inline: true },
        { name: '🎯 Goals', value: conversation.learningGoals.join(', ') || '*None set*', inline: true }
      )
      .setFooter({ text: 'Last 10 messages shown' });

    await interaction.reply({ embeds: [embed], ephemeral: true });

  } else if (subcommand === 'reset') {
    conversation.messages = [];
    conversation.messageCount = 0;
    conversation.summary = '';
    await conversation.save();
    
    const embed = new EmbedBuilder()
      .setColor(COLORS.WARNING)
      .setTitle('🔄 Conversation Reset')
      .setDescription('Your conversation history has been cleared. Start fresh!')
      .setFooter({ text: 'Your topic and goals are preserved' });

    await interaction.reply({ embeds: [embed], ephemeral: true });

  } else if (subcommand === 'goals') {
    const modal = new ModalBuilder()
      .setCustomId('tutor_goals_modal')
      .setTitle('Set Learning Goals');

    const goalsInput = new TextInputBuilder()
      .setCustomId('goals_input')
      .setLabel('What do you want to learn?')
      .setPlaceholder('e.g., Master Python basics, Build a web app, Learn algorithms')
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(true);

    modal.addComponents(new ActionRowBuilder().addComponents(goalsInput));
    await interaction.showModal(modal);
  }
}
