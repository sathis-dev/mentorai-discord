import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import Reminder from '../../database/models/Reminder.js';
import { COLORS } from '../../config/colors.js';

// Timezone mappings (common ones)
const TIMEZONES = {
  'UTC': 0,
  'EST': -5, 'EDT': -4,
  'CST': -6, 'CDT': -5,
  'MST': -7, 'MDT': -6,
  'PST': -8, 'PDT': -7,
  'GMT': 0, 'BST': 1,
  'CET': 1, 'CEST': 2,
  'IST': 5.5,
  'JST': 9,
  'AEST': 10, 'AEDT': 11
};

export const data = new SlashCommandBuilder()
  .setName('remind')
  .setDescription('Set smart study reminders')
  .addSubcommand(sub =>
    sub.setName('set')
      .setDescription('Create a study reminder')
      .addStringOption(opt =>
        opt.setName('time')
          .setDescription('Time for reminder (e.g., 09:00, 2:30pm)')
          .setRequired(true))
      .addStringOption(opt =>
        opt.setName('message')
          .setDescription('Reminder message')
          .setRequired(true))
      .addStringOption(opt =>
        opt.setName('repeat')
          .setDescription('Repeat schedule')
          .addChoices(
            { name: 'Once', value: 'once' },
            { name: 'Daily', value: 'daily' },
            { name: 'Weekdays', value: 'weekdays' },
            { name: 'Weekends', value: 'weekends' },
            { name: 'Weekly', value: 'weekly' }
          ))
      .addStringOption(opt =>
        opt.setName('timezone')
          .setDescription('Your timezone (e.g., EST, PST, UTC)')
          .addChoices(
            { name: 'UTC (GMT+0)', value: 'UTC' },
            { name: 'EST (GMT-5)', value: 'EST' },
            { name: 'CST (GMT-6)', value: 'CST' },
            { name: 'MST (GMT-7)', value: 'MST' },
            { name: 'PST (GMT-8)', value: 'PST' },
            { name: 'GMT (London)', value: 'GMT' },
            { name: 'CET (Central Europe)', value: 'CET' },
            { name: 'IST (India)', value: 'IST' },
            { name: 'JST (Japan)', value: 'JST' },
            { name: 'AEST (Australia)', value: 'AEST' }
          )))
  .addSubcommand(sub =>
    sub.setName('list')
      .setDescription('View your active reminders'))
  .addSubcommand(sub =>
    sub.setName('delete')
      .setDescription('Delete a reminder')
      .addStringOption(opt =>
        opt.setName('id')
          .setDescription('Reminder ID to delete')
          .setRequired(true)))
  .addSubcommand(sub =>
    sub.setName('pause')
      .setDescription('Pause or resume reminders'));

export async function execute(interaction) {
  const subcommand = interaction.options.getSubcommand();
  const userId = interaction.user.id;

  if (subcommand === 'set') {
    const timeStr = interaction.options.getString('time');
    const message = interaction.options.getString('message');
    const repeat = interaction.options.getString('repeat') || 'once';
    const timezone = interaction.options.getString('timezone') || 'UTC';

    // Parse time
    const parsedTime = parseTime(timeStr);
    if (!parsedTime) {
      return interaction.reply({
        content: '❌ Invalid time format! Use formats like: `09:00`, `2:30pm`, `14:00`',
        ephemeral: true
      });
    }

    // Calculate next trigger time
    const tzOffset = TIMEZONES[timezone] || 0;
    const nextTrigger = calculateNextTrigger(parsedTime.hour, parsedTime.minute, tzOffset, repeat);

    const reminder = await Reminder.create({
      discordId: userId,
      channelId: interaction.channelId,
      message,
      time: `${parsedTime.hour.toString().padStart(2, '0')}:${parsedTime.minute.toString().padStart(2, '0')}`,
      timezone,
      repeat,
      nextTrigger,
      active: true
    });

    const embed = new EmbedBuilder()
      .setColor(COLORS.SUCCESS)
      .setTitle('⏰ Reminder Set!')
      .setDescription(`
I'll remind you about:
> ${message}

**Schedule:**
🕐 **Time:** ${formatTime(parsedTime.hour, parsedTime.minute)}
🌍 **Timezone:** ${timezone}
🔄 **Repeat:** ${formatRepeat(repeat)}

**Next reminder:** <t:${Math.floor(nextTrigger.getTime() / 1000)}:R>
      `)
      .setFooter({ text: `ID: ${reminder._id.toString().slice(-6)}` });

    const row = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId(`reminder_test_${reminder._id}`)
          .setLabel('🔔 Test Now')
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId(`reminder_delete_${reminder._id}`)
          .setLabel('🗑️ Delete')
          .setStyle(ButtonStyle.Danger)
      );

    await interaction.reply({ embeds: [embed], components: [row] });

  } else if (subcommand === 'list') {
    const reminders = await Reminder.find({ discordId: userId, active: true })
      .sort({ nextTrigger: 1 });

    if (reminders.length === 0) {
      return interaction.reply({
        content: '📭 You have no active reminders.\n\nUse `/remind set` to create one!',
        ephemeral: true
      });
    }

    const reminderList = reminders.map((r, i) => {
      const shortId = r._id.toString().slice(-6);
      return `**${i + 1}.** ${r.message.slice(0, 40)}${r.message.length > 40 ? '...' : ''}
└─ 🕐 ${r.time} ${r.timezone} | 🔄 ${formatRepeat(r.repeat)}
└─ Next: <t:${Math.floor(r.nextTrigger.getTime() / 1000)}:R> | ID: \`${shortId}\``;
    }).join('\n\n');

    const embed = new EmbedBuilder()
      .setColor(COLORS.PRIMARY)
      .setTitle('📋 Your Study Reminders')
      .setDescription(reminderList)
      .setFooter({ text: `${reminders.length} active reminder(s)` });

    await interaction.reply({ embeds: [embed] });

  } else if (subcommand === 'delete') {
    const idInput = interaction.options.getString('id');
    
    // Find reminder by partial ID
    const reminders = await Reminder.find({ discordId: userId });
    const reminder = reminders.find(r => r._id.toString().endsWith(idInput));

    if (!reminder) {
      return interaction.reply({
        content: '❌ Reminder not found! Use `/remind list` to see your reminders.',
        ephemeral: true
      });
    }

    await Reminder.deleteOne({ _id: reminder._id });

    await interaction.reply({
      content: `✅ Reminder deleted: "${reminder.message.slice(0, 50)}..."`,
      ephemeral: true
    });

  } else if (subcommand === 'pause') {
    const activeReminders = await Reminder.find({ discordId: userId, active: true });
    const pausedReminders = await Reminder.find({ discordId: userId, active: false });

    const embed = new EmbedBuilder()
      .setColor(COLORS.INFO)
      .setTitle('⏸️ Manage Reminders')
      .setDescription(`
**Active reminders:** ${activeReminders.length}
**Paused reminders:** ${pausedReminders.length}

Use the buttons below to pause or resume all reminders.
      `);

    const row = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('reminder_pause_all')
          .setLabel('⏸️ Pause All')
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(activeReminders.length === 0),
        new ButtonBuilder()
          .setCustomId('reminder_resume_all')
          .setLabel('▶️ Resume All')
          .setStyle(ButtonStyle.Primary)
          .setDisabled(pausedReminders.length === 0),
        new ButtonBuilder()
          .setCustomId('reminder_delete_all')
          .setLabel('🗑️ Delete All')
          .setStyle(ButtonStyle.Danger)
      );

    await interaction.reply({ embeds: [embed], components: [row] });
  }
}

function parseTime(timeStr) {
  // Handle formats: 09:00, 9:00, 2:30pm, 14:00, 2pm
  const time = timeStr.toLowerCase().trim();
  
  // Match patterns
  const match24 = time.match(/^(\d{1,2}):(\d{2})$/);
  const match12 = time.match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)$/);

  let hour, minute;

  if (match24) {
    hour = parseInt(match24[1]);
    minute = parseInt(match24[2]);
  } else if (match12) {
    hour = parseInt(match12[1]);
    minute = match12[2] ? parseInt(match12[2]) : 0;
    
    if (match12[3] === 'pm' && hour !== 12) hour += 12;
    if (match12[3] === 'am' && hour === 12) hour = 0;
  } else {
    return null;
  }

  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) {
    return null;
  }

  return { hour, minute };
}

function calculateNextTrigger(hour, minute, tzOffset, repeat) {
  const now = new Date();
  const next = new Date();
  
  // Set time in UTC, adjusting for timezone
  next.setUTCHours(hour - tzOffset, minute, 0, 0);
  
  // If time already passed today, move to next day
  if (next <= now) {
    next.setDate(next.getDate() + 1);
  }

  // Adjust for repeat type
  if (repeat === 'weekdays') {
    while (next.getDay() === 0 || next.getDay() === 6) {
      next.setDate(next.getDate() + 1);
    }
  } else if (repeat === 'weekends') {
    while (next.getDay() !== 0 && next.getDay() !== 6) {
      next.setDate(next.getDate() + 1);
    }
  }

  return next;
}

function formatTime(hour, minute) {
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minute.toString().padStart(2, '0')} ${period}`;
}

function formatRepeat(repeat) {
  const formats = {
    once: 'Once',
    daily: 'Daily',
    weekdays: 'Mon-Fri',
    weekends: 'Sat-Sun',
    weekly: 'Weekly'
  };
  return formats[repeat] || repeat;
}
