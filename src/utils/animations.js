import { EmbedBuilder } from 'discord.js';

/**
 * Advanced Animation Utilities for Discord Bot
 * Simulates animations through timed message edits
 */

// Loading Animation Frames
export const LOADING_FRAMES = {
  dots: ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'],
  bar: ['[▱▱▱▱▱▱▱▱▱▱]', '[▰▱▱▱▱▱▱▱▱▱]', '[▰▰▱▱▱▱▱▱▱▱]', '[▰▰▰▱▱▱▱▱▱▱]', '[▰▰▰▰▱▱▱▱▱▱]', '[▰▰▰▰▰▱▱▱▱▱]', '[▰▰▰▰▰▰▱▱▱▱]', '[▰▰▰▰▰▰▰▱▱▱]', '[▰▰▰▰▰▰▰▰▱▱]', '[▰▰▰▰▰▰▰▰▰▱]', '[▰▰▰▰▰▰▰▰▰▰]'],
  brain: ['🧠', '🧠💭', '🧠💭💡', '🧠💭💡✨'],
  rocket: ['🚀', '🚀💨', '🚀💨⭐', '🚀💨⭐✨'],
  typing: ['●○○', '○●○', '○○●', '○●○'],
  pulse: ['◉', '○', '◉', '○'],
  wave: ['▁', '▂', '▃', '▄', '▅', '▆', '▇', '█', '▇', '▆', '▅', '▄', '▃', '▂'],
  blocks: ['░░░░░', '█░░░░', '██░░░', '███░░', '████░', '█████'],
  circle: ['◜', '◠', '◝', '◞', '◡', '◟'],
  arrows: ['←', '↖', '↑', '↗', '→', '↘', '↓', '↙'],
  bounce: ['⠁', '⠂', '⠄', '⠂'],
  sparkle: ['✦', '✧', '★', '✧'],
  fire: ['🔥', '🔥🔥', '🔥🔥🔥', '🔥🔥', '🔥'],
  magic: ['🪄', '🪄✨', '🪄✨⭐', '🪄✨⭐💫']
};

// Animated text effects
export const TEXT_EFFECTS = {
  typewriter: async (text, delay = 50) => {
    const frames = [];
    for (let i = 0; i <= text.length; i++) {
      frames.push(text.substring(0, i) + (i < text.length ? '▌' : ''));
    }
    return frames;
  },
  
  glitch: (text) => {
    const glitchChars = '!@#$%^&*()_+-=[]{}|;:,.<>?';
    return text.split('').map(() => 
      glitchChars[Math.floor(Math.random() * glitchChars.length)]
    ).join('');
  },
  
  rainbow: (text) => {
    const colors = ['🔴', '🟠', '🟡', '🟢', '🔵', '🟣'];
    return text.split('').map((char, i) => 
      colors[i % colors.length] + char
    ).join('');
  }
};

/**
 * Create animated loading sequence
 */
export async function animateLoading(interaction, options = {}) {
  const {
    title = 'Loading...',
    description = 'Please wait',
    color = 0x5865F2,
    duration = 3000,
    style = 'bar',
    stages = null
  } = options;

  const frames = LOADING_FRAMES[style] || LOADING_FRAMES.bar;
  const frameDelay = duration / (stages ? stages.length : frames.length);
  
  for (let i = 0; i < (stages ? stages.length : frames.length); i++) {
    const embed = new EmbedBuilder()
      .setTitle(title)
      .setColor(color)
      .setDescription(stages ? stages[i].text : description)
      .addFields({
        name: stages ? stages[i].status : 'Progress',
        value: '```\n' + frames[Math.min(i, frames.length - 1)] + '\n```',
        inline: false
      })
      .setFooter({ text: '🎓 MentorAI' })
      .setTimestamp();

    try {
      await interaction.editReply({ embeds: [embed] });
      await sleep(frameDelay);
    } catch (e) {
      break;
    }
  }
}

/**
 * Create countdown timer animation
 */
export async function animateCountdown(interaction, seconds, onComplete) {
  const colors = [0x57F287, 0xFEE75C, 0xED4245];
  
  for (let i = seconds; i >= 0; i--) {
    const colorIndex = i <= 3 ? 2 : (i <= 5 ? 1 : 0);
    const emoji = i <= 3 ? '🔴' : (i <= 5 ? '🟡' : '🟢');
    
    const embed = new EmbedBuilder()
      .setTitle(emoji + ' Time Remaining')
      .setColor(colors[colorIndex])
      .setDescription('```ansi\n\u001b[1;' + (i <= 3 ? '31' : '32') + 'm' + 
        '⏱️ ' + formatTime(i) + '\n```')
      .setFooter({ text: '🎓 MentorAI' });

    try {
      await interaction.editReply({ embeds: [embed] });
      if (i > 0) await sleep(1000);
    } catch (e) {
      break;
    }
  }

  if (onComplete) await onComplete();
}

/**
 * Create score reveal animation
 */
export async function animateScoreReveal(interaction, score, total, xpEarned) {
  const percentage = Math.round((score / total) * 100);
  
  // Stage 1: Counting animation
  for (let i = 0; i <= score; i++) {
    const embed = new EmbedBuilder()
      .setTitle('📊 Calculating Score...')
      .setColor(0x5865F2)
      .setDescription('```\n' + createProgressBar(i, total, 20) + '\n```')
      .addFields({
        name: '🎯 Correct Answers',
        value: '**' + i + '** / ' + total,
        inline: true
      })
      .setFooter({ text: '🎓 MentorAI' });

    await interaction.editReply({ embeds: [embed] });
    await sleep(150);
  }

  // Stage 2: Percentage reveal
  await sleep(500);
  
  for (let p = 0; p <= percentage; p += 5) {
    const color = p >= 80 ? 0x57F287 : (p >= 60 ? 0xFEE75C : 0xED4245);
    const embed = new EmbedBuilder()
      .setTitle('📈 Your Score')
      .setColor(color)
      .setDescription('```ansi\n\u001b[1;33m' + p + '%\u001b[0m\n```')
      .setFooter({ text: '🎓 MentorAI' });

    await interaction.editReply({ embeds: [embed] });
    await sleep(50);
  }

  // Stage 3: XP reveal
  await sleep(300);
  
  for (let xp = 0; xp <= xpEarned; xp += Math.ceil(xpEarned / 10)) {
    const currentXp = Math.min(xp, xpEarned);
    const embed = new EmbedBuilder()
      .setTitle('✨ XP Earned!')
      .setColor(0xFFD700)
      .setDescription('```diff\n+ ' + currentXp + ' XP\n```')
      .setFooter({ text: '🎓 MentorAI' });

    await interaction.editReply({ embeds: [embed] });
    await sleep(80);
  }

  await sleep(500);
}

/**
 * Create level up celebration animation
 */
export async function animateLevelUp(interaction, newLevel) {
  const celebrationFrames = [
    '🎉',
    '🎉✨',
    '🎉✨🌟',
    '🎉✨🌟⭐',
    '🎉✨🌟⭐💫',
    '🎊🎉✨🌟⭐💫🎊',
  ];

  for (const frame of celebrationFrames) {
    const embed = new EmbedBuilder()
      .setTitle(frame + ' LEVEL UP! ' + frame)
      .setColor(0xFFD700)
      .setDescription('```ansi\n\u001b[1;33m⬆️ You reached Level ' + newLevel + '! ⬆️\u001b[0m\n```')
      .setFooter({ text: '🎓 MentorAI' });

    await interaction.editReply({ embeds: [embed] });
    await sleep(200);
  }
}

/**
 * Create typing effect for AI responses
 */
export async function animateTyping(interaction, finalEmbed, text, chunkSize = 50) {
  const chunks = [];
  for (let i = 0; i < text.length; i += chunkSize) {
    chunks.push(text.substring(0, i + chunkSize));
  }

  for (const chunk of chunks) {
    const embed = EmbedBuilder.from(finalEmbed)
      .setDescription(chunk + '▌');
    
    await interaction.editReply({ embeds: [embed] });
    await sleep(100);
  }

  await interaction.editReply({ embeds: [finalEmbed] });
}

/**
 * Streak fire animation
 */
export async function animateStreak(interaction, streakDays) {
  const fireFrames = ['🔥', '🔥🔥', '🔥🔥🔥', '🔥🔥🔥🔥', '🔥🔥🔥🔥🔥'];
  const maxFrame = Math.min(streakDays, fireFrames.length) - 1;

  for (let i = 0; i <= maxFrame; i++) {
    const embed = new EmbedBuilder()
      .setTitle(fireFrames[i] + ' Streak Building...')
      .setColor(0xFF6B35)
      .setDescription('**Day ' + (i + 1) + '**')
      .setFooter({ text: '🎓 MentorAI' });

    await interaction.editReply({ embeds: [embed] });
    await sleep(300);
  }
}

/**
 * Achievement unlock animation
 */
export async function animateAchievement(interaction, achievementName) {
  const frames = [
    { emoji: '🔒', text: 'Achievement Locked', color: 0x99AAB5 },
    { emoji: '🔓', text: 'Unlocking...', color: 0xFEE75C },
    { emoji: '✨', text: 'Almost there...', color: 0xFFD700 },
    { emoji: '🏆', text: 'UNLOCKED!', color: 0x57F287 }
  ];

  for (const frame of frames) {
    const embed = new EmbedBuilder()
      .setTitle(frame.emoji + ' ' + frame.text)
      .setColor(frame.color)
      .setDescription(frame.emoji === '🏆' ? '**' + achievementName + '**' : '...')
      .setFooter({ text: '🎓 MentorAI' });

    await interaction.editReply({ embeds: [embed] });
    await sleep(400);
  }
}

// Utility functions
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return mins > 0 ? mins + ':' + secs.toString().padStart(2, '0') : secs + 's';
}

function createProgressBar(current, max, length = 10) {
  const filled = Math.round((current / max) * length);
  const empty = length - filled;
  return '█'.repeat(filled) + '░'.repeat(empty);
}

export { sleep, formatTime, createProgressBar };
