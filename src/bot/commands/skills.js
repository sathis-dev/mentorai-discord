import { SlashCommandBuilder, EmbedBuilder, AttachmentBuilder } from 'discord.js';
import { createCanvas } from '@napi-rs/canvas';
import { User } from '../../database/models/User.js';
import { COLORS } from '../../config/colors.js';

export const data = new SlashCommandBuilder()
  .setName('skills')
  .setDescription('View your skill radar chart')
  .addUserOption(opt =>
    opt.setName('user')
      .setDescription('User to view'));

export async function execute(interaction) {
  await interaction.deferReply();
  
  const targetUser = interaction.options.getUser('user') || interaction.user;
  const user = await User.findOne({ discordId: targetUser.id });
  
  if (!user) {
    return interaction.editReply('User has no data yet! Complete some quizzes to build your skills.');
  }

  const skills = calculateSkillLevels(user);
  const chartBuffer = await generateRadarChart(skills, targetUser.username);
  const attachment = new AttachmentBuilder(chartBuffer, { name: 'skills.png' });

  const embed = new EmbedBuilder()
    .setColor(COLORS.PRIMARY)
    .setAuthor({
      name: `${targetUser.username}'s Skill Radar`,
      iconURL: targetUser.displayAvatarURL()
    })
    .setImage('attachment://skills.png')
    .addFields(
      { 
        name: '🏆 Strongest Skill', 
        value: `**${skills.strongest.name}** - Level ${skills.strongest.level}`, 
        inline: true 
      },
      { 
        name: '📈 Average Level', 
        value: `**${skills.average}**`, 
        inline: true 
      },
      {
        name: '🎯 Suggested Focus',
        value: `**${skills.weakest.name}** - Level ${skills.weakest.level}`,
        inline: true
      }
    )
    .setFooter({ text: 'Complete quizzes and lessons to level up your skills!' });

  await interaction.editReply({ embeds: [embed], files: [attachment] });
}

function calculateSkillLevels(user) {
  const skills = {};

  // Calculate each skill (0-100 scale)
  skills['Problem Solving'] = Math.min(100, 
    (user.quizzesTaken * 2) + 
    ((user.correctAnswers || 0) / Math.max(1, user.totalQuestions || 1) * 50) +
    (user.level * 2)
  );

  skills['Programming'] = Math.min(100,
    ((user.completedLessons?.length || 0) * 5) +
    ((user.codeExecutions || 0) * 2) +
    (user.level * 3)
  );

  skills['Algorithms'] = Math.min(100,
    ((user.speedrunStats?.completed || 0) * 10) +
    ((user.speedrunStats?.sRanks || 0) * 20) +
    (user.level * 2)
  );

  skills['Debugging'] = Math.min(100,
    ((user.codeReviews || 0) * 5) +
    ((user.bugsFound || 0) * 10) +
    (user.level * 2)
  );

  skills['Consistency'] = Math.min(100,
    (user.streak * 2) +
    ((user.longestStreak || 0) * 1) +
    ((user.dailyBonusStreak || 0) * 3)
  );

  skills['Speed'] = Math.min(100,
    ((user.speedrunStats?.sRanks || 0) * 15) +
    ((user.arenaStats?.wins || 0) * 10) +
    (user.level)
  );

  // Ensure minimum values for visual
  for (const key of Object.keys(skills)) {
    skills[key] = Math.max(5, Math.round(skills[key]));
  }

  const skillArray = Object.entries(skills).map(([name, level]) => ({ name, level }));
  skillArray.sort((a, b) => b.level - a.level);

  return {
    data: skills,
    strongest: skillArray[0],
    weakest: skillArray[skillArray.length - 1],
    average: Math.round(skillArray.reduce((a, b) => a + b.level, 0) / skillArray.length)
  };
}

async function generateRadarChart(skills, username) {
  const canvas = createCanvas(600, 600);
  const ctx = canvas.getContext('2d');

  const centerX = 300;
  const centerY = 300;
  const maxRadius = 200;
  const skillNames = Object.keys(skills.data);
  const skillValues = Object.values(skills.data);
  const numSkills = skillNames.length;

  // Background
  ctx.fillStyle = '#1a1a2e';
  ctx.fillRect(0, 0, 600, 600);

  // Draw radar grid
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.lineWidth = 1;

  // Draw concentric hexagons (grid)
  for (let level = 1; level <= 5; level++) {
    const radius = (maxRadius / 5) * level;
    ctx.beginPath();
    for (let i = 0; i <= numSkills; i++) {
      const angle = (Math.PI * 2 / numSkills) * i - Math.PI / 2;
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }

  // Draw axis lines
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
  for (let i = 0; i < numSkills; i++) {
    const angle = (Math.PI * 2 / numSkills) * i - Math.PI / 2;
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(
      centerX + Math.cos(angle) * maxRadius,
      centerY + Math.sin(angle) * maxRadius
    );
    ctx.stroke();
  }

  // Draw skill area (filled)
  ctx.beginPath();
  const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, maxRadius);
  gradient.addColorStop(0, 'rgba(88, 101, 242, 0.8)');
  gradient.addColorStop(1, 'rgba(87, 242, 135, 0.6)');
  ctx.fillStyle = gradient;

  for (let i = 0; i <= numSkills; i++) {
    const index = i % numSkills;
    const angle = (Math.PI * 2 / numSkills) * index - Math.PI / 2;
    const value = skillValues[index] / 100;
    const x = centerX + Math.cos(angle) * maxRadius * value;
    const y = centerY + Math.sin(angle) * maxRadius * value;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fill();

  // Draw skill area outline
  ctx.strokeStyle = '#5865F2';
  ctx.lineWidth = 3;
  ctx.stroke();

  // Draw points
  for (let i = 0; i < numSkills; i++) {
    const angle = (Math.PI * 2 / numSkills) * i - Math.PI / 2;
    const value = skillValues[i] / 100;
    const x = centerX + Math.cos(angle) * maxRadius * value;
    const y = centerY + Math.sin(angle) * maxRadius * value;

    ctx.beginPath();
    ctx.arc(x, y, 8, 0, Math.PI * 2);
    ctx.fillStyle = '#57F287';
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  // Draw labels
  ctx.font = 'bold 16px Inter, Arial, sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';

  for (let i = 0; i < numSkills; i++) {
    const angle = (Math.PI * 2 / numSkills) * i - Math.PI / 2;
    const labelRadius = maxRadius + 40;
    const x = centerX + Math.cos(angle) * labelRadius;
    const y = centerY + Math.sin(angle) * labelRadius;

    ctx.fillStyle = '#ffffff';
    ctx.fillText(skillNames[i], x, y);
    ctx.font = '14px Inter, Arial, sans-serif';
    ctx.fillStyle = '#888';
    ctx.fillText(`Lv.${Math.round(skillValues[i])}`, x, y + 18);
    ctx.font = 'bold 16px Inter, Arial, sans-serif';
  }

  // Draw title
  ctx.font = 'bold 24px Inter, Arial, sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.fillText(`${username}'s Skills`, centerX, 40);

  // Draw average
  ctx.font = '18px Inter, Arial, sans-serif';
  ctx.fillStyle = '#57F287';
  ctx.fillText(`Average: ${skills.average}`, centerX, 580);

  return canvas.toBuffer('image/png');
}
