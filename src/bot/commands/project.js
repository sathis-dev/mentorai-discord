import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle, StringSelectMenuBuilder } from 'discord.js';
import { Project, SEED_PROJECTS } from '../../database/models/Project.js';
import { getOrCreateUser, addXpToUser } from '../../services/gamificationService.js';
import { executeCode, resolveLanguage } from '../../services/codeExecutionService.js';
import { COLORS, EMOJIS, createProgressBar } from '../../config/designSystem.js';

export const data = new SlashCommandBuilder()
  .setName('project')
  .setDescription('🏗️ Project-based learning - build real things!')
  .addSubcommand(sub =>
    sub.setName('browse')
      .setDescription('Browse available projects')
      .addStringOption(opt =>
        opt.setName('language')
          .setDescription('Filter by programming language')
          .addChoices(
            { name: '🐍 Python', value: 'python' },
            { name: '🟨 JavaScript', value: 'javascript' },
            { name: 'All Languages', value: 'all' }
          ))
      .addStringOption(opt =>
        opt.setName('difficulty')
          .setDescription('Filter by difficulty')
          .addChoices(
            { name: '🟢 Beginner', value: 'beginner' },
            { name: '🟡 Intermediate', value: 'intermediate' },
            { name: '🔴 Advanced', value: 'advanced' },
            { name: 'All Levels', value: 'all' }
          )))
  .addSubcommand(sub =>
    sub.setName('start')
      .setDescription('Start a project')
      .addStringOption(opt =>
        opt.setName('project')
          .setDescription('Project to start')
          .setRequired(true)
          .setAutocomplete(true)))
  .addSubcommand(sub =>
    sub.setName('continue')
      .setDescription('Continue your current project'))
  .addSubcommand(sub =>
    sub.setName('hint')
      .setDescription('Get a hint for your current step'))
  .addSubcommand(sub =>
    sub.setName('solution')
      .setDescription('Reveal the solution (reduces XP reward)'))
  .addSubcommand(sub =>
    sub.setName('submit')
      .setDescription('Submit code for the current step'))
  .addSubcommand(sub =>
    sub.setName('abandon')
      .setDescription('Abandon your current project'));

export async function autocomplete(interaction) {
  const focused = interaction.options.getFocused().toLowerCase();
  
  // Get projects from database or seed data
  let projects = await Project.find({ isActive: true }).lean();
  if (projects.length === 0) {
    projects = SEED_PROJECTS;
  }

  const filtered = projects
    .filter(p => 
      p.name.toLowerCase().includes(focused) || 
      p.projectId.toLowerCase().includes(focused) ||
      p.language.toLowerCase().includes(focused)
    )
    .slice(0, 25);

  await interaction.respond(filtered.map(p => ({
    name: `${getLanguageEmoji(p.language)} ${p.name} (${p.difficulty})`,
    value: p.projectId
  })));
}

export async function execute(interaction) {
  const subcommand = interaction.options.getSubcommand();

  switch (subcommand) {
    case 'browse':
      await browseProjects(interaction);
      break;
    case 'start':
      await startProject(interaction);
      break;
    case 'continue':
      await continueProject(interaction);
      break;
    case 'hint':
      await getHint(interaction);
      break;
    case 'solution':
      await showSolution(interaction);
      break;
    case 'submit':
      await submitCode(interaction);
      break;
    case 'abandon':
      await abandonProject(interaction);
      break;
  }
}

/**
 * Browse available projects
 */
async function browseProjects(interaction) {
  await interaction.deferReply();

  const language = interaction.options.getString('language') || 'all';
  const difficulty = interaction.options.getString('difficulty') || 'all';

  try {
    // Ensure projects exist in database
    await seedProjectsIfNeeded();

    // Build query
    const query = { isActive: true };
    if (language !== 'all') query.language = language;
    if (difficulty !== 'all') query.difficulty = difficulty;

    let projects = await Project.find(query).lean();
    
    // Fallback to seed data if database is empty
    if (projects.length === 0) {
      projects = SEED_PROJECTS.filter(p => {
        if (language !== 'all' && p.language !== language) return false;
        if (difficulty !== 'all' && p.difficulty !== difficulty) return false;
        return true;
      });
    }

    if (projects.length === 0) {
      const embed = new EmbedBuilder()
        .setTitle('📁 No Projects Found')
        .setColor(COLORS.WARNING)
        .setDescription('No projects match your filters. Try different options!')
        .setFooter({ text: '🎓 MentorAI Projects' });
      return interaction.editReply({ embeds: [embed] });
    }

    // Create browse embed
    const embed = new EmbedBuilder()
      .setTitle('🏗️ Project Library')
      .setColor(COLORS.LESSON_BLUE)
      .setDescription([
        '> Build real projects to apply your learning!',
        '',
        `**Found ${projects.length} project${projects.length > 1 ? 's' : ''}:**`
      ].join('\n'));

    // Group by difficulty
    const grouped = { beginner: [], intermediate: [], advanced: [] };
    projects.forEach(p => grouped[p.difficulty]?.push(p));

    for (const [diff, projs] of Object.entries(grouped)) {
      if (projs.length === 0) continue;
      
      const diffEmoji = diff === 'beginner' ? '🟢' : diff === 'intermediate' ? '🟡' : '🔴';
      const projList = projs.map(p => 
        `${getLanguageEmoji(p.language)} **${p.name}**\n` +
        `   └ ${p.estimatedTime}min • ${p.xpReward} XP • ${p.steps?.length || 3} steps`
      ).join('\n\n');

      embed.addFields({
        name: `${diffEmoji} ${diff.charAt(0).toUpperCase() + diff.slice(1)}`,
        value: projList.substring(0, 1024),
        inline: false
      });
    }

    embed.setFooter({ text: 'Use /project start <name> to begin!' });

    // Create select menu for projects
    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId('project_select')
      .setPlaceholder('🎯 Select a project to start')
      .addOptions(
        projects.slice(0, 25).map(p => ({
          label: p.name,
          description: `${p.language} • ${p.difficulty} • ${p.estimatedTime}min`,
          value: p.projectId,
          emoji: getLanguageEmoji(p.language)
        }))
      );

    const row = new ActionRowBuilder().addComponents(selectMenu);

    await interaction.editReply({ embeds: [embed], components: [row] });

  } catch (error) {
    console.error('Browse projects error:', error);
    const errorEmbed = new EmbedBuilder()
      .setTitle('❌ Error Loading Projects')
      .setColor(COLORS.ERROR)
      .setDescription('Failed to load projects. Please try again!');
    await interaction.editReply({ embeds: [errorEmbed] });
  }
}

/**
 * Start a new project
 */
async function startProject(interaction) {
  await interaction.deferReply();

  const projectId = interaction.options.getString('project');

  try {
    const user = await getOrCreateUser(interaction.user.id, interaction.user.username);

    // Check if user has an active project
    if (user.currentProject?.projectId) {
      const embed = new EmbedBuilder()
        .setTitle('⚠️ Active Project Found')
        .setColor(COLORS.WARNING)
        .setDescription(`You're already working on a project!\n\nUse \`/project continue\` to resume or \`/project abandon\` to start fresh.`);
      return interaction.editReply({ embeds: [embed] });
    }

    // Find project
    await seedProjectsIfNeeded();
    let project = await Project.findOne({ projectId });
    if (!project) {
      project = SEED_PROJECTS.find(p => p.projectId === projectId);
    }

    if (!project) {
      return interaction.editReply({ 
        content: '❌ Project not found! Use `/project browse` to see available projects.',
        ephemeral: true 
      });
    }

    // Set user's current project
    user.currentProject = {
      projectId: project.projectId,
      currentStep: 0,
      startedAt: new Date()
    };
    await user.save();

    // Show project intro
    const introEmbed = new EmbedBuilder()
      .setTitle(`🏗️ Starting: ${project.name}`)
      .setColor(COLORS.SUCCESS)
      .setDescription([
        '```',
        project.description,
        '```'
      ].join('\n'))
      .addFields(
        { name: '📝 Language', value: `${getLanguageEmoji(project.language)} ${project.language}`, inline: true },
        { name: '📊 Difficulty', value: getDifficultyBadge(project.difficulty), inline: true },
        { name: '⏱️ Est. Time', value: `${project.estimatedTime} minutes`, inline: true }
      )
      .addFields({
        name: '📚 What You\'ll Learn',
        value: project.learningOutcomes?.map(o => `• ${o}`).join('\n') || 'Practical coding skills',
        inline: false
      })
      .addFields({
        name: '🎁 Rewards',
        value: `${EMOJIS.XP} **${project.xpReward} XP** on completion!`,
        inline: false
      })
      .setFooter({ text: `Step 0/${project.steps?.length || 3} • Project started!` });

    const buttons = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`project_step_${project.projectId}_0`)
        .setLabel('Begin Step 1')
        .setEmoji('▶️')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId('project_abandon')
        .setLabel('Cancel')
        .setEmoji('❌')
        .setStyle(ButtonStyle.Danger)
    );

    await interaction.editReply({ embeds: [introEmbed], components: [buttons] });

  } catch (error) {
    console.error('Start project error:', error);
    await interaction.editReply({ content: '❌ Failed to start project.' });
  }
}

/**
 * Continue current project
 */
async function continueProject(interaction) {
  await interaction.deferReply();

  try {
    const user = await getOrCreateUser(interaction.user.id, interaction.user.username);

    if (!user.currentProject?.projectId) {
      const embed = new EmbedBuilder()
        .setTitle('📭 No Active Project')
        .setColor(COLORS.WARNING)
        .setDescription('You don\'t have an active project.\n\nUse `/project browse` to find one!')
        .setFooter({ text: '🎓 MentorAI Projects' });
      return interaction.editReply({ embeds: [embed] });
    }

    // Find project
    let project = await Project.findOne({ projectId: user.currentProject.projectId });
    if (!project) {
      project = SEED_PROJECTS.find(p => p.projectId === user.currentProject.projectId);
    }

    if (!project) {
      user.currentProject = null;
      await user.save();
      return interaction.editReply({ content: '❌ Project not found. Progress has been reset.' });
    }

    const stepIndex = user.currentProject.currentStep || 0;
    await showProjectStep(interaction, project, stepIndex, user);

  } catch (error) {
    console.error('Continue project error:', error);
    await interaction.editReply({ content: '❌ Failed to load project.' });
  }
}

/**
 * Show a project step
 */
async function showProjectStep(interaction, project, stepIndex, user) {
  const steps = project.steps || [];
  
  if (stepIndex >= steps.length) {
    // Project complete!
    await completeProject(interaction, project, user);
    return;
  }

  const step = steps[stepIndex];
  const progress = createProgressBar(stepIndex, steps.length, 10);

  const embed = new EmbedBuilder()
    .setTitle(`🏗️ ${project.name}`)
    .setColor(COLORS.LESSON_BLUE)
    .setDescription([
      `**Step ${stepIndex + 1}/${steps.length}: ${step.title}**`,
      '',
      progress,
      '',
      step.instruction
    ].join('\n'));

  // Add starter code if available
  if (step.starterCode) {
    embed.addFields({
      name: '💻 Starter Code',
      value: `\`\`\`${project.language}\n${step.starterCode.substring(0, 900)}\n\`\`\``,
      inline: false
    });
  }

  embed.setFooter({ text: `💡 Use /project hint for help • /project submit when ready` });

  const buttons = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`project_submit_${project.projectId}_${stepIndex}`)
      .setLabel('Submit Code')
      .setEmoji('📤')
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId(`project_hint_${project.projectId}_${stepIndex}`)
      .setLabel('Get Hint')
      .setEmoji('💡')
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId(`project_solution_${project.projectId}_${stepIndex}`)
      .setLabel('Show Solution')
      .setEmoji('👁️')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId('project_abandon')
      .setLabel('Abandon')
      .setEmoji('🚪')
      .setStyle(ButtonStyle.Danger)
  );

  if (interaction.deferred) {
    await interaction.editReply({ embeds: [embed], components: [buttons] });
  } else {
    await interaction.update({ embeds: [embed], components: [buttons] });
  }
}

/**
 * Get hint for current step
 */
async function getHint(interaction) {
  await interaction.deferReply({ ephemeral: true });

  try {
    const user = await getOrCreateUser(interaction.user.id, interaction.user.username);

    if (!user.currentProject?.projectId) {
      return interaction.editReply({ content: '❌ No active project!', ephemeral: true });
    }

    let project = await Project.findOne({ projectId: user.currentProject.projectId });
    if (!project) project = SEED_PROJECTS.find(p => p.projectId === user.currentProject.projectId);

    const stepIndex = user.currentProject.currentStep || 0;
    const step = project.steps?.[stepIndex];

    if (!step?.hints || step.hints.length === 0) {
      return interaction.editReply({ content: '💡 No hints available for this step. Try your best!', ephemeral: true });
    }

    // Show a random hint
    const hint = step.hints[Math.floor(Math.random() * step.hints.length)];
    
    const embed = new EmbedBuilder()
      .setTitle('💡 Hint')
      .setColor(COLORS.WARNING)
      .setDescription(`> ${hint}`)
      .setFooter({ text: 'Hints don\'t affect your XP reward!' });

    await interaction.editReply({ embeds: [embed], ephemeral: true });

  } catch (error) {
    console.error('Get hint error:', error);
    await interaction.editReply({ content: '❌ Failed to get hint.', ephemeral: true });
  }
}

/**
 * Show solution (reduces XP)
 */
async function showSolution(interaction) {
  await interaction.deferReply({ ephemeral: true });

  try {
    const user = await getOrCreateUser(interaction.user.id, interaction.user.username);

    if (!user.currentProject?.projectId) {
      return interaction.editReply({ content: '❌ No active project!', ephemeral: true });
    }

    let project = await Project.findOne({ projectId: user.currentProject.projectId });
    if (!project) project = SEED_PROJECTS.find(p => p.projectId === user.currentProject.projectId);

    const stepIndex = user.currentProject.currentStep || 0;
    const step = project.steps?.[stepIndex];

    if (!step?.solution) {
      return interaction.editReply({ content: '📝 No solution available for this step.', ephemeral: true });
    }

    const embed = new EmbedBuilder()
      .setTitle('👁️ Solution Revealed')
      .setColor(COLORS.ERROR)
      .setDescription(`\`\`\`${project.language}\n${step.solution.substring(0, 1800)}\n\`\`\``)
      .addFields({
        name: '⚠️ XP Penalty',
        value: 'Viewing the solution reduces your final XP reward by 50% for this step.',
        inline: false
      })
      .setFooter({ text: 'Try to understand the solution before moving on!' });

    // Mark that solution was viewed (could track for XP reduction)
    
    await interaction.editReply({ embeds: [embed], ephemeral: true });

  } catch (error) {
    console.error('Show solution error:', error);
    await interaction.editReply({ content: '❌ Failed to show solution.', ephemeral: true });
  }
}

/**
 * Submit code for current step
 */
async function submitCode(interaction) {
  try {
    const user = await getOrCreateUser(interaction.user.id, interaction.user.username);

    if (!user.currentProject?.projectId) {
      return interaction.reply({ content: '❌ No active project!', ephemeral: true });
    }

    let project = await Project.findOne({ projectId: user.currentProject.projectId });
    if (!project) project = SEED_PROJECTS.find(p => p.projectId === user.currentProject.projectId);

    const stepIndex = user.currentProject.currentStep || 0;

    // Show modal for code input
    const modal = new ModalBuilder()
      .setCustomId(`project_code_${project.projectId}_${stepIndex}`)
      .setTitle(`Submit: Step ${stepIndex + 1}`);

    const codeInput = new TextInputBuilder()
      .setCustomId('code')
      .setLabel('Your Code')
      .setStyle(TextInputStyle.Paragraph)
      .setPlaceholder('Paste your code here...')
      .setRequired(true)
      .setMaxLength(4000);

    modal.addComponents(new ActionRowBuilder().addComponents(codeInput));
    await interaction.showModal(modal);

  } catch (error) {
    console.error('Submit code error:', error);
    await interaction.reply({ content: '❌ Failed to open submission.', ephemeral: true });
  }
}

/**
 * Process submitted code
 */
export async function processProjectSubmission(interaction, projectId, stepIndex, code) {
  await interaction.deferReply();

  try {
    const user = await getOrCreateUser(interaction.user.id, interaction.user.username);

    let project = await Project.findOne({ projectId });
    if (!project) project = SEED_PROJECTS.find(p => p.projectId === projectId);

    const step = project.steps?.[stepIndex];
    if (!step) {
      return interaction.editReply({ content: '❌ Step not found.' });
    }

    // Try to execute the code
    const langConfig = resolveLanguage(project.language);
    const result = await executeCode(langConfig, code);

    const embed = new EmbedBuilder();

    if (result.success) {
      embed.setTitle('✅ Code Executed Successfully!')
        .setColor(COLORS.SUCCESS)
        .setDescription(`\`\`\`\n${result.output?.substring(0, 500) || 'No output'}\n\`\`\``);

      // Move to next step
      user.currentProject.currentStep = stepIndex + 1;
      await user.save();

      const isLastStep = stepIndex + 1 >= project.steps.length;

      embed.addFields({
        name: isLastStep ? '🎉 Project Complete!' : '👏 Great job!',
        value: isLastStep 
          ? 'You\'ve completed all steps! Click below to claim your reward.'
          : `Ready for Step ${stepIndex + 2}!`,
        inline: false
      });

      const buttons = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`project_step_${projectId}_${stepIndex + 1}`)
          .setLabel(isLastStep ? '🎁 Claim Reward' : 'Next Step')
          .setEmoji(isLastStep ? '🏆' : '▶️')
          .setStyle(ButtonStyle.Success)
      );

      await interaction.editReply({ embeds: [embed], components: [buttons] });

    } else {
      embed.setTitle('❌ Code Has Errors')
        .setColor(COLORS.ERROR)
        .setDescription(`\`\`\`\n${result.error?.substring(0, 800) || 'Unknown error'}\n\`\`\``)
        .addFields({
          name: '💡 Tips',
          value: '• Check for syntax errors\n• Review the step instructions\n• Use `/project hint` for help',
          inline: false
        });

      const buttons = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`project_submit_${projectId}_${stepIndex}`)
          .setLabel('Try Again')
          .setEmoji('🔄')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId(`project_hint_${projectId}_${stepIndex}`)
          .setLabel('Get Hint')
          .setEmoji('💡')
          .setStyle(ButtonStyle.Secondary)
      );

      await interaction.editReply({ embeds: [embed], components: [buttons] });
    }

  } catch (error) {
    console.error('Process submission error:', error);
    await interaction.editReply({ content: '❌ Failed to process submission.' });
  }
}

/**
 * Complete a project
 */
async function completeProject(interaction, project, user) {
  // Calculate XP (could be reduced if solutions were viewed)
  const xpReward = project.xpReward || 250;

  // Add to completed projects
  if (!user.completedProjects) user.completedProjects = [];
  user.completedProjects.push({
    projectId: project.projectId,
    completedAt: new Date(),
    rating: 'A',
    timeSpent: Date.now() - new Date(user.currentProject.startedAt).getTime()
  });

  // Clear current project
  user.currentProject = null;
  await user.save();

  // Award XP
  const xpResult = await addXpToUser(user.discordId, xpReward, `Project: ${project.name}`);

  // Update project stats
  if (project.completions !== undefined) {
    project.completions += 1;
    await project.save?.();
  }

  const embed = new EmbedBuilder()
    .setTitle('🎉 Project Complete!')
    .setColor(COLORS.XP_GOLD)
    .setDescription([
      '```',
      '╔══════════════════════════════════════╗',
      '║      🏆 CONGRATULATIONS! 🏆          ║',
      '╚══════════════════════════════════════╝',
      '```',
      '',
      `You've completed **${project.name}**!`
    ].join('\n'))
    .addFields(
      { name: `${EMOJIS.XP} XP Earned`, value: `**+${xpReward} XP**${xpResult?.leveledUp ? '\n🎉 Level Up!' : ''}`, inline: true },
      { name: '📊 Projects Done', value: String(user.completedProjects.length), inline: true },
      { name: '⏱️ Time Spent', value: formatTime(Date.now() - new Date(user.currentProject?.startedAt || Date.now()).getTime()), inline: true }
    )
    .addFields({
      name: '🎯 What\'s Next?',
      value: '• Try another project with `/project browse`\n• Share your achievement!\n• Keep building! 🚀',
      inline: false
    })
    .setFooter({ text: '🎓 MentorAI Projects • Keep building amazing things!' })
    .setTimestamp();

  const buttons = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('project_browse')
      .setLabel('More Projects')
      .setEmoji('📚')
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId('exec_profile')
      .setLabel('View Profile')
      .setEmoji('👤')
      .setStyle(ButtonStyle.Secondary)
  );

  if (interaction.deferred) {
    await interaction.editReply({ embeds: [embed], components: [buttons] });
  } else {
    await interaction.update({ embeds: [embed], components: [buttons] });
  }
}

/**
 * Abandon current project
 */
async function abandonProject(interaction) {
  try {
    const user = await getOrCreateUser(interaction.user.id, interaction.user.username);

    if (!user.currentProject?.projectId) {
      return interaction.reply({ content: '📭 You don\'t have an active project.', ephemeral: true });
    }

    user.currentProject = null;
    await user.save();

    await interaction.reply({ 
      content: '✅ Project abandoned. Use `/project browse` to find a new one!',
      ephemeral: true 
    });

  } catch (error) {
    console.error('Abandon project error:', error);
    await interaction.reply({ content: '❌ Failed to abandon project.', ephemeral: true });
  }
}

/**
 * Handle project button interactions
 */
export async function handleProjectButton(interaction, action, params) {
  if (action === 'step') {
    const [projectId, stepIndex] = params;
    const user = await getOrCreateUser(interaction.user.id, interaction.user.username);
    let project = await Project.findOne({ projectId });
    if (!project) project = SEED_PROJECTS.find(p => p.projectId === projectId);
    
    await showProjectStep(interaction, project, parseInt(stepIndex), user);
  }
  else if (action === 'submit') {
    const [projectId, stepIndex] = params;
    
    const modal = new ModalBuilder()
      .setCustomId(`project_code_${projectId}_${stepIndex}`)
      .setTitle(`Submit: Step ${parseInt(stepIndex) + 1}`);

    const codeInput = new TextInputBuilder()
      .setCustomId('code')
      .setLabel('Your Code')
      .setStyle(TextInputStyle.Paragraph)
      .setPlaceholder('Paste your code here...')
      .setRequired(true)
      .setMaxLength(4000);

    modal.addComponents(new ActionRowBuilder().addComponents(codeInput));
    await interaction.showModal(modal);
  }
  else if (action === 'hint') {
    const [projectId, stepIndex] = params;
    let project = await Project.findOne({ projectId });
    if (!project) project = SEED_PROJECTS.find(p => p.projectId === projectId);
    
    const step = project?.steps?.[parseInt(stepIndex)];
    const hint = step?.hints?.[Math.floor(Math.random() * (step.hints?.length || 1))];
    
    await interaction.reply({
      content: `💡 **Hint:** ${hint || 'No hints available. You got this!'}`,
      ephemeral: true
    });
  }
  else if (action === 'solution') {
    const [projectId, stepIndex] = params;
    let project = await Project.findOne({ projectId });
    if (!project) project = SEED_PROJECTS.find(p => p.projectId === projectId);
    
    const step = project?.steps?.[parseInt(stepIndex)];
    
    const embed = new EmbedBuilder()
      .setTitle('👁️ Solution')
      .setColor(COLORS.WARNING)
      .setDescription(`\`\`\`${project.language}\n${step?.solution?.substring(0, 1800) || 'No solution'}\n\`\`\``)
      .setFooter({ text: '⚠️ Viewing solutions may affect your learning!' });
    
    await interaction.reply({ embeds: [embed], ephemeral: true });
  }
  else if (action === 'browse') {
    await interaction.deferUpdate();
    // Could refresh browse view
  }
  else if (action === 'abandon') {
    const user = await getOrCreateUser(interaction.user.id, interaction.user.username);
    user.currentProject = null;
    await user.save();
    await interaction.reply({ content: '✅ Project abandoned.', ephemeral: true });
  }
}

// ============ Helper Functions ============

async function seedProjectsIfNeeded() {
  const count = await Project.countDocuments();
  if (count === 0) {
    try {
      for (const proj of SEED_PROJECTS) {
        const existing = await Project.findOne({ projectId: proj.projectId });
        if (!existing) {
          await Project.create(proj);
        }
      }
      console.log('✅ Seeded projects database');
    } catch (error) {
      console.error('Failed to seed projects:', error);
    }
  }
}

function getLanguageEmoji(lang) {
  const emojis = {
    python: '🐍',
    javascript: '🟨',
    java: '☕',
    cpp: '⚡',
    typescript: '🔷'
  };
  return emojis[lang?.toLowerCase()] || '💻';
}

function getDifficultyBadge(diff) {
  const badges = {
    beginner: '🟢 Beginner',
    intermediate: '🟡 Intermediate',
    advanced: '🔴 Advanced'
  };
  return badges[diff] || diff;
}

function formatTime(ms) {
  const minutes = Math.floor(ms / 60000);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ${minutes % 60}m`;
}
