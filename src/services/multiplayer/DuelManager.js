/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║   DuelManager - Pro Max Game Engine for 1v1 Quiz Battles                     ║
 * ║   Discord.js v14 • MongoDB Persistent • Real-Time Components                 ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 * 
 * Features:
 *   - StringSelectMenu for topic selection
 *   - Modal for XP stake setting
 *   - MessageComponentCollector with strict filters
 *   - 2x2 Button Grid with instant feedback
 *   - ASCII progress bars for time remaining
 *   - Single-message editing (clean channels)
 *   - Auto-timeout with collector cleanup
 *   - Atomic MongoDB operations ($inc)
 */

import {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ComponentType
} from 'discord.js';
import { ChallengeSession } from '../../database/models/ChallengeSession.js';
import { User } from '../../database/models/User.js';
import { calculateFinalXp, addXpAtomic, getOrCreateUser } from '../gamificationService.js';
import { getConceptExplanation } from '../learningService.js';
import aiOrchestrator from '../../ai/orchestrator.js';
import { COLORS } from '../../config/brandSystem.js';

// ═══════════════════════════════════════════════════════════════════════════════
// 🎨 DUEL THEME COLORS
// ═══════════════════════════════════════════════════════════════════════════════

const DUEL_COLORS = {
  SETUP: 0x5865F2,      // Discord Blurple - Setup phase
  INVITE: 0x9B59B6,     // Purple - Waiting for opponent
  LOADING: 0xF39C12,    // Orange - Generating
  BATTLE: 0xE91E63,     // Pink - Active battle
  CORRECT: 0x57F287,    // Green
  WRONG: 0xED4245,      // Red
  VICTORY: 0xFFD700,    // Gold
  DEFEAT: 0x607D8B,     // Slate
  DRAW: 0x9B59B6,       // Purple
  TIMEOUT: 0x95A5A6,    // Gray
  ANALYSIS: 0x3498DB    // Blue - AI Analysis
};

// ═══════════════════════════════════════════════════════════════════════════════
// 📊 ASCII PROGRESS BAR UTILITIES
// ═══════════════════════════════════════════════════════════════════════════════

function createASCIIProgressBar(current, max, length = 10) {
  const filled = Math.round((current / max) * length);
  const empty = length - filled;
  const bar = '█'.repeat(filled) + '░'.repeat(empty);
  const percent = Math.round((current / max) * 100);
  return `[${bar}] ${percent}%`;
}

function createTimeBar(remainingMs, totalMs) {
  const seconds = Math.ceil(remainingMs / 1000);
  const progress = createASCIIProgressBar(remainingMs, totalMs, 12);
  return `⏱️ ${progress} (${seconds}s)`;
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🎮 DUEL MANAGER CLASS
// ═══════════════════════════════════════════════════════════════════════════════

class DuelManager {
  constructor() {
    this.activeDuels = new Map(); // discordId -> DuelState
    this.collectors = new Map();   // challengeId -> collector
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // PHASE 1: SETUP - Topic Selection + Stake Modal
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Create topic selection menu
   */
  createTopicSelectMenu(challengerId) {
    return new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId(`duel_topic_${challengerId}`)
        .setPlaceholder('🎯 Select Battle Topic')
        .addOptions([
          { label: 'Python', value: 'python', emoji: '🐍', description: 'Python programming' },
          { label: 'JavaScript', value: 'javascript', emoji: '🟨', description: 'Web scripting language' },
          { label: 'React', value: 'react', emoji: '⚛️', description: 'Frontend framework' },
          { label: 'Algorithms', value: 'algorithms', emoji: '📊', description: 'Data structures & algorithms' },
          { label: 'SQL', value: 'sql', emoji: '🗄️', description: 'Database queries' },
          { label: 'TypeScript', value: 'typescript', emoji: '🔷', description: 'Typed JavaScript' },
          { label: 'Node.js', value: 'nodejs', emoji: '🟢', description: 'Server-side JS' },
          { label: 'Random Mix', value: 'random', emoji: '🎲', description: 'Surprise topics!' }
        ])
    );
  }

  /**
   * Create difficulty selection menu
   */
  createDifficultySelectMenu(challengerId) {
    return new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId(`duel_difficulty_${challengerId}`)
        .setPlaceholder('⚙️ Select Difficulty')
        .addOptions([
          { label: 'Easy', value: 'easy', emoji: '🟢', description: 'Beginner friendly' },
          { label: 'Medium', value: 'medium', emoji: '🟡', description: 'Balanced challenge' },
          { label: 'Hard', value: 'hard', emoji: '🔴', description: 'Expert level' }
        ])
    );
  }

  /**
   * Create XP stake modal
   */
  createStakeModal(challengeId) {
    return new ModalBuilder()
      .setCustomId(`duel_stake_${challengeId}`)
      .setTitle('⚔️ Set XP Stake')
      .addComponents(
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId('stake_amount')
            .setLabel('XP Amount to Wager (0-500)')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('100')
            .setRequired(false)
            .setMinLength(1)
            .setMaxLength(3)
        )
      );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // PHASE 2: CHALLENGE INVITE
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Create challenge invite embed
   */
  createInviteEmbed(challenger, opponent, settings) {
    const topicEmojis = {
      python: '🐍', javascript: '🟨', react: '⚛️', algorithms: '📊',
      sql: '🗄️', typescript: '🔷', nodejs: '🟢', random: '🎲'
    };
    const diffEmojis = { easy: '🟢', medium: '🟡', hard: '🔴' };

    return new EmbedBuilder()
      .setColor(DUEL_COLORS.INVITE)
      .setAuthor({ name: '⚔️ QUIZ DUEL CHALLENGE', iconURL: challenger.displayAvatarURL() })
      .setDescription(
        `## ${challenger.username} challenges ${opponent.username}!\n\n` +
        `> *"Think you're smarter? Prove it in the arena!"*\n\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`
      )
      .addFields(
        { name: '👤 Challenger', value: `\`${challenger.username}\``, inline: true },
        { name: '⚡ VS ⚡', value: '\u200B', inline: true },
        { name: '🎯 Opponent', value: `\`${opponent.username}\``, inline: true }
      )
      .addFields({ name: '\u200B', value: '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', inline: false })
      .addFields(
        { name: '📚 Topic', value: `${topicEmojis[settings.topic] || '📝'} ${settings.topic}`, inline: true },
        { name: '⚙️ Difficulty', value: `${diffEmojis[settings.difficulty]} ${settings.difficulty}`, inline: true },
        { name: '❓ Questions', value: `${settings.questionCount}`, inline: true }
      )
      .addFields(
        { name: '⏱️ Time/Question', value: '15 seconds', inline: true },
        { name: '💰 XP Stake', value: settings.stake > 0 ? `${settings.stake} XP` : 'None', inline: true },
        { name: '⏳ Expires', value: '<t:' + Math.floor((Date.now() + 300000) / 1000) + ':R>', inline: true }
      )
      .setThumbnail(opponent.displayAvatarURL({ size: 256 }))
      .setFooter({ text: '🎮 First to answer correctly wins each round!' })
      .setTimestamp();
  }

  /**
   * Create accept/decline buttons
   */
  createInviteButtons(challengeId, opponentId) {
    return new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`duel_accept_${challengeId}_${opponentId}`)
        .setLabel('Accept Duel')
        .setStyle(ButtonStyle.Success)
        .setEmoji('⚔️'),
      new ButtonBuilder()
        .setCustomId(`duel_decline_${challengeId}_${opponentId}`)
        .setLabel('Decline')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji('🚫'),
      new ButtonBuilder()
        .setCustomId(`duel_stake_${challengeId}_${opponentId}`)
        .setLabel('Set Stake')
        .setStyle(ButtonStyle.Primary)
        .setEmoji('💰')
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // PHASE 3: LOADING ANIMATION
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Create loading embed with animated progress
   */
  createLoadingEmbed(stage, message = 'Generating questions...') {
    const frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
    const frame = frames[stage % frames.length];
    const progress = createASCIIProgressBar(stage, 10, 15);

    return new EmbedBuilder()
      .setColor(DUEL_COLORS.LOADING)
      .setTitle(`${frame} PREPARING DUEL...`)
      .setDescription(
        `\`\`\`\n` +
        `╭─────────────────────────────────╮\n` +
        `│                                 │\n` +
        `│   ${message.padEnd(28)}    │\n` +
        `│                                 │\n` +
        `│   ${progress}       │\n` +
        `│                                 │\n` +
        `╰─────────────────────────────────╯\n` +
        `\`\`\``
      )
      .setFooter({ text: '🎮 Get ready for battle!' });
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // PHASE 4: BATTLE UI - Questions & Answers
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Create question embed with timer
   */
  createQuestionEmbed(question, questionNum, totalQuestions, timeRemaining, totalTime) {
    const timeBar = createTimeBar(timeRemaining, totalTime);
    
    return new EmbedBuilder()
      .setColor(DUEL_COLORS.BATTLE)
      .setAuthor({ name: `⚔️ ROUND ${questionNum} OF ${totalQuestions}` })
      .setTitle(`❓ ${question.question}`)
      .setDescription(
        `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
        `🅰️  ${question.options[0]}\n\n` +
        `🅱️  ${question.options[1]}\n\n` +
        `🇨  ${question.options[2]}\n\n` +
        `🇩  ${question.options[3]}\n\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`
      )
      .addFields({ name: '⏱️ Time Remaining', value: timeBar, inline: false })
      .setFooter({ text: '⚡ First correct answer wins the round! Speed = Bonus Points!' })
      .setTimestamp();
  }

  /**
   * Create 2x2 answer button grid
   */
  createAnswerButtons(challengeId, disabled = false, selectedIndex = -1, correctIndex = -1) {
    const labels = ['A', 'B', 'C', 'D'];
    const emojis = ['🅰️', '🅱️', '🇨', '🇩'];
    
    const getStyle = (index) => {
      if (selectedIndex === -1) return ButtonStyle.Primary;
      if (index === correctIndex) return ButtonStyle.Success;
      if (index === selectedIndex && selectedIndex !== correctIndex) return ButtonStyle.Danger;
      return ButtonStyle.Secondary;
    };

    // Row 1: A and B
    const row1 = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`duel_answer_${challengeId}_0`)
        .setLabel(labels[0])
        .setStyle(getStyle(0))
        .setEmoji(emojis[0])
        .setDisabled(disabled),
      new ButtonBuilder()
        .setCustomId(`duel_answer_${challengeId}_1`)
        .setLabel(labels[1])
        .setStyle(getStyle(1))
        .setEmoji(emojis[1])
        .setDisabled(disabled)
    );

    // Row 2: C and D
    const row2 = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`duel_answer_${challengeId}_2`)
        .setLabel(labels[2])
        .setStyle(getStyle(2))
        .setEmoji(emojis[2])
        .setDisabled(disabled),
      new ButtonBuilder()
        .setCustomId(`duel_answer_${challengeId}_3`)
        .setLabel(labels[3])
        .setStyle(getStyle(3))
        .setEmoji(emojis[3])
        .setDisabled(disabled)
    );

    return [row1, row2];
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // PHASE 5: RESULTS & POST-MATCH
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Create round result embed
   */
  createRoundResultEmbed(isCorrect, correctAnswer, explanation, playerScore, opponentScore, roundNum, totalRounds) {
    const answerLetters = ['A', 'B', 'C', 'D'];
    
    return new EmbedBuilder()
      .setColor(isCorrect ? DUEL_COLORS.CORRECT : DUEL_COLORS.WRONG)
      .setAuthor({ name: isCorrect ? '✅ CORRECT!' : '❌ WRONG!' })
      .setDescription(
        `**Correct Answer:** ${answerLetters[correctAnswer.correctIndex]} - ${correctAnswer.options[correctAnswer.correctIndex]}\n\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
        `💡 ${explanation || 'Great question!'}`
      )
      .addFields(
        { name: '📊 Your Score', value: `\`${playerScore} pts\``, inline: true },
        { name: '👤 Opponent', value: `\`${opponentScore} pts\``, inline: true },
        { name: '🎯 Progress', value: `\`${roundNum}/${totalRounds}\``, inline: true }
      )
      .setFooter({ text: roundNum < totalRounds ? '⏳ Next round in 3 seconds...' : '🏆 Final results incoming!' })
      .setTimestamp();
  }

  /**
   * Create final results embed
   */
  createFinalResultsEmbed(isWinner, isDraw, playerStats, opponentName, xpAwarded) {
    let title, color, description;
    
    if (isDraw) {
      title = '🤝 DRAW!';
      color = DUEL_COLORS.DRAW;
      description = `## Tied with ${opponentName}!\n\nBoth gladiators fought equally!`;
    } else if (isWinner) {
      title = '🏆 VICTORY!';
      color = DUEL_COLORS.VICTORY;
      description = `## You defeated ${opponentName}!\n\n👑 **Champion Performance**`;
    } else {
      title = '💔 Defeat';
      color = DUEL_COLORS.DEFEAT;
      description = `## ${opponentName} wins this time!\n\n📈 Keep practicing!`;
    }

    return new EmbedBuilder()
      .setColor(color)
      .setAuthor({ name: title })
      .setDescription(description)
      .addFields(
        { name: '🎯 Your Score', value: `\`${playerStats.score} pts\``, inline: true },
        { name: '✅ Accuracy', value: `\`${playerStats.accuracy}%\``, inline: true },
        { name: '⭐ XP Earned', value: `\`+${xpAwarded} XP\``, inline: true }
      )
      .addFields({
        name: '📊 Performance',
        value: `\`\`\`\nCorrect: ${playerStats.correct}/${playerStats.total}\nTime: ${playerStats.avgTime}s avg\n\`\`\``,
        inline: false
      })
      .setFooter({ text: isWinner ? 'GG! Challenge someone else!' : "Don't give up! Try again!" })
      .setTimestamp();
  }

  /**
   * Create AI post-match analysis embed
   */
  createAnalysisEmbed(analysis, topic) {
    return new EmbedBuilder()
      .setColor(DUEL_COLORS.ANALYSIS)
      .setAuthor({ name: '🎓 MENTOR\'S POST-MATCH ANALYSIS' })
      .setDescription(
        `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
        `${analysis}\n\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`
      )
      .addFields({
        name: '📚 Want to learn more?',
        value: `Use \`/learn ${topic}\` to dive deeper!`,
        inline: false
      })
      .setFooter({ text: '🧠 MentorAI • Your coding companion' })
      .setTimestamp();
  }

  /**
   * Create timeout/expired embed
   */
  createExpiredEmbed(reason = 'Challenge expired') {
    return new EmbedBuilder()
      .setColor(DUEL_COLORS.TIMEOUT)
      .setAuthor({ name: '⏰ DUEL EXPIRED' })
      .setDescription(`${reason}\n\nUse \`/challenge\` to start a new duel!`)
      .setTimestamp();
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // CORE GAME ENGINE METHODS
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Start a new duel with full UI flow
   */
  async startDuel(interaction, opponent, settings = {}) {
    const challenger = interaction.user;
    
    // Validate
    if (challenger.id === opponent.id) {
      return interaction.reply({ content: '❌ You cannot challenge yourself!', ephemeral: true });
    }
    if (opponent.bot) {
      return interaction.reply({ content: '❌ Bots cannot accept challenges!', ephemeral: true });
    }

    // Check for existing duels
    if (this.activeDuels.has(challenger.id) || this.activeDuels.has(opponent.id)) {
      return interaction.reply({ content: '❌ One of the players is already in a duel!', ephemeral: true });
    }

    await interaction.deferReply();

    try {
      // Ensure users exist
      await Promise.all([
        getOrCreateUser(challenger.id, challenger.username),
        getOrCreateUser(opponent.id, opponent.username)
      ]);

      // Create challenge in database
      const challenge = await ChallengeSession.createChallenge(
        { discordId: challenger.id, username: challenger.username },
        { discordId: opponent.id, username: opponent.username },
        {
          topic: settings.topic || 'random',
          difficulty: settings.difficulty || 'medium',
          questions: settings.questionCount || 5
        }
      );

      // Store duel state
      const duelState = {
        challengeId: challenge.challengeId,
        challengerId: challenger.id,
        opponentId: opponent.id,
        settings: { ...settings, stake: settings.stake || 0 },
        phase: 'invite',
        message: null,
        collector: null
      };

      this.activeDuels.set(challenger.id, duelState);
      this.activeDuels.set(opponent.id, duelState);

      // Create invite UI
      const embed = this.createInviteEmbed(challenger, opponent, {
        topic: settings.topic || 'random',
        difficulty: settings.difficulty || 'medium',
        questionCount: settings.questionCount || 5,
        stake: settings.stake || 0
      });
      const buttons = this.createInviteButtons(challenge.challengeId, opponent.id);

      const message = await interaction.editReply({
        content: `<@${opponent.id}>, you have been challenged to a duel! ⚔️`,
        embeds: [embed],
        components: [buttons]
      });

      duelState.message = message;

      // Setup collector with strict filter
      const collector = message.createMessageComponentCollector({
        componentType: ComponentType.Button,
        time: 300000, // 5 minutes
        filter: (i) => {
          const [, action, , odId] = i.customId.split('_');
          // Only opponent can accept/decline, anyone can view stake modal
          if (action === 'accept' || action === 'decline') {
            return i.user.id === opponent.id;
          }
          return i.user.id === challenger.id || i.user.id === opponent.id;
        }
      });

      collector.on('collect', async (btnInteraction) => {
        await this.handleInviteInteraction(btnInteraction, duelState, challenger, opponent);
      });

      collector.on('end', async (collected, reason) => {
        if (reason === 'time' && duelState.phase === 'invite') {
          await this.handleDuelExpired(duelState, 'Challenge timed out - no response');
        }
      });

      duelState.collector = collector;
      this.collectors.set(challenge.challengeId, collector);

    } catch (error) {
      console.error('Error starting duel:', error);
      await interaction.editReply({ 
        content: '❌ Failed to create challenge. Please try again.',
        embeds: [],
        components: []
      });
    }
  }

  /**
   * Handle invite phase interactions
   */
  async handleInviteInteraction(interaction, duelState, challenger, opponent) {
    const [, action] = interaction.customId.split('_');

    if (action === 'accept') {
      await this.handleAccept(interaction, duelState, challenger, opponent);
    } else if (action === 'decline') {
      await this.handleDecline(interaction, duelState);
    } else if (action === 'stake') {
      const modal = this.createStakeModal(duelState.challengeId);
      await interaction.showModal(modal);
    }
  }

  /**
   * Handle challenge acceptance
   */
  async handleAccept(interaction, duelState, challenger, opponent) {
    await interaction.deferUpdate();
    duelState.phase = 'loading';

    // Stop the invite collector
    if (duelState.collector) {
      duelState.collector.stop('accepted');
    }

    // Show loading animation
    for (let i = 0; i <= 10; i++) {
      const messages = [
        'Channeling quiz energy...',
        'Generating questions...',
        'Calibrating difficulty...',
        'Preparing the arena...',
        'Almost ready...'
      ];
      const msgIndex = Math.min(Math.floor(i / 2), messages.length - 1);
      const loadingEmbed = this.createLoadingEmbed(i, messages[msgIndex]);
      
      await interaction.editReply({
        content: '',
        embeds: [loadingEmbed],
        components: []
      });
      
      if (i < 10) await this.sleep(300);
    }

    // Generate questions
    const questions = await this.generateQuestions(duelState.settings);
    
    // Update challenge in DB
    const challenge = await ChallengeSession.findOne({ challengeId: duelState.challengeId });
    if (challenge) {
      await challenge.accept(questions);
    }

    duelState.questions = questions;
    duelState.phase = 'battle';
    duelState.currentQuestion = 0;
    duelState.scores = {
      [challenger.id]: { score: 0, answers: [], streak: 0 },
      [opponent.id]: { score: 0, answers: [], streak: 0 }
    };
    duelState.answeredThisRound = new Set();

    // Start battle
    await this.runBattleRound(interaction, duelState, challenger, opponent);
  }

  /**
   * Handle challenge decline
   */
  async handleDecline(interaction, duelState) {
    await interaction.update({
      content: '',
      embeds: [
        new EmbedBuilder()
          .setColor(DUEL_COLORS.TIMEOUT)
          .setAuthor({ name: '🚫 Challenge Declined' })
          .setDescription('Maybe next time!')
          .setTimestamp()
      ],
      components: []
    });

    this.cleanupDuel(duelState);
  }

  /**
   * Run a single battle round
   */
  async runBattleRound(interaction, duelState, challenger, opponent) {
    const question = duelState.questions[duelState.currentQuestion];
    const totalTime = 15000;
    const startTime = Date.now();
    
    duelState.answeredThisRound = new Set();
    duelState.roundStartTime = startTime;

    // Initial question embed
    const questionEmbed = this.createQuestionEmbed(
      question,
      duelState.currentQuestion + 1,
      duelState.questions.length,
      totalTime,
      totalTime
    );
    const answerButtons = this.createAnswerButtons(duelState.challengeId);

    await interaction.editReply({
      content: '',
      embeds: [questionEmbed],
      components: answerButtons
    });

    // Setup answer collector
    const answerCollector = duelState.message.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: totalTime,
      filter: (i) => {
        return (i.user.id === challenger.id || i.user.id === opponent.id) &&
               !duelState.answeredThisRound.has(i.user.id);
      }
    });

    // Update timer periodically
    const timerInterval = setInterval(async () => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, totalTime - elapsed);
      
      if (remaining > 0 && duelState.answeredThisRound.size < 2) {
        const updatedEmbed = this.createQuestionEmbed(
          question,
          duelState.currentQuestion + 1,
          duelState.questions.length,
          remaining,
          totalTime
        );
        
        try {
          await duelState.message.edit({ embeds: [updatedEmbed] });
        } catch (e) {}
      }
    }, 2000);

    answerCollector.on('collect', async (btnInteraction) => {
      const answerIndex = parseInt(btnInteraction.customId.split('_').pop());
      const isCorrect = answerIndex === question.correctIndex;
      const timeTaken = Date.now() - startTime;
      
      duelState.answeredThisRound.add(btnInteraction.user.id);
      
      // Calculate points
      let points = 0;
      const playerScore = duelState.scores[btnInteraction.user.id];
      
      if (isCorrect) {
        points = 100 + Math.max(0, Math.floor((totalTime - timeTaken) / 1000) * 5);
        points += playerScore.streak * 10;
        playerScore.streak++;
      } else {
        playerScore.streak = 0;
      }
      
      playerScore.score += points;
      playerScore.answers.push({ correct: isCorrect, time: timeTaken, points });

      // Update buttons with feedback
      const updatedButtons = this.createAnswerButtons(
        duelState.challengeId,
        true,
        answerIndex,
        question.correctIndex
      );

      await btnInteraction.update({ components: updatedButtons });

      // Check if both answered
      if (duelState.answeredThisRound.size >= 2) {
        clearInterval(timerInterval);
        answerCollector.stop('allAnswered');
      }
    });

    answerCollector.on('end', async (collected, reason) => {
      clearInterval(timerInterval);

      // Mark unanswered players
      for (const id of [challenger.id, opponent.id]) {
        if (!duelState.answeredThisRound.has(id)) {
          duelState.scores[id].answers.push({ correct: false, time: totalTime, points: 0 });
          duelState.scores[id].streak = 0;
        }
      }

      // Show round results
      await this.showRoundResults(interaction, duelState, question, challenger, opponent);
    });
  }

  /**
   * Show round results and proceed
   */
  async showRoundResults(interaction, duelState, question, challenger, opponent) {
    await this.sleep(1000);

    const chalScore = duelState.scores[challenger.id].score;
    const oppScore = duelState.scores[opponent.id].score;

    // Show brief result
    const resultEmbed = new EmbedBuilder()
      .setColor(DUEL_COLORS.BATTLE)
      .setTitle(`📊 Round ${duelState.currentQuestion + 1} Results`)
      .setDescription(
        `**Correct Answer:** ${['A', 'B', 'C', 'D'][question.correctIndex]} - ${question.options[question.correctIndex]}\n\n` +
        `💡 ${question.explanation || ''}`
      )
      .addFields(
        { name: `👤 ${challenger.username}`, value: `\`${chalScore} pts\``, inline: true },
        { name: `👤 ${opponent.username}`, value: `\`${oppScore} pts\``, inline: true }
      )
      .setFooter({ text: '⏳ Next round in 3 seconds...' });

    await duelState.message.edit({
      embeds: [resultEmbed],
      components: []
    });

    await this.sleep(3000);

    // Next round or finish
    duelState.currentQuestion++;
    
    if (duelState.currentQuestion < duelState.questions.length) {
      await this.runBattleRound(interaction, duelState, challenger, opponent);
    } else {
      await this.finishDuel(interaction, duelState, challenger, opponent);
    }
  }

  /**
   * Finish duel and award XP
   */
  async finishDuel(interaction, duelState, challenger, opponent) {
    duelState.phase = 'complete';

    const chalStats = duelState.scores[challenger.id];
    const oppStats = duelState.scores[opponent.id];

    const isDraw = chalStats.score === oppStats.score;
    const winnerId = isDraw ? null : (chalStats.score > oppStats.score ? challenger.id : opponent.id);

    // Calculate XP awards (atomic)
    const baseXp = 50; // Participation
    const winBonus = 150;
    const perfectBonus = 100;

    for (const [playerId, stats] of Object.entries(duelState.scores)) {
      const isWinner = playerId === winnerId;
      const correct = stats.answers.filter(a => a.correct).length;
      const total = duelState.questions.length;
      const accuracy = Math.round((correct / total) * 100);
      
      let xp = baseXp;
      if (isWinner) xp += winBonus;
      if (isDraw) xp += Math.floor(winBonus / 2);
      if (accuracy === 100) xp += perfectBonus;

      // Atomic XP update
      await addXpAtomic(playerId, xp, isWinner ? 'duel_win' : 'duel_participate');

      stats.accuracy = accuracy;
      stats.correct = correct;
      stats.total = total;
      stats.avgTime = Math.round(stats.answers.reduce((sum, a) => sum + a.time, 0) / total / 1000 * 10) / 10;
      stats.xpAwarded = xp;
    }

    // Final results embed
    const finalEmbed = this.createFinalResultsEmbed(
      challenger.id === winnerId,
      isDraw,
      { ...chalStats, score: chalStats.score },
      opponent.username,
      chalStats.xpAwarded
    );

    await duelState.message.edit({
      embeds: [finalEmbed],
      components: []
    });

    // AI Post-match analysis
    try {
      const missedQ = duelState.questions.find((q, i) => 
        !duelState.scores[challenger.id].answers[i]?.correct &&
        !duelState.scores[opponent.id].answers[i]?.correct
      ) || duelState.questions[0];

      const analysis = await getConceptExplanation(
        missedQ.topic || duelState.settings.topic,
        `Explain why "${missedQ.options[missedQ.correctIndex]}" is correct for: ${missedQ.question}`
      );

      if (analysis) {
        await this.sleep(2000);
        const analysisEmbed = this.createAnalysisEmbed(analysis, duelState.settings.topic);
        await duelState.message.channel.send({ embeds: [analysisEmbed] });
      }
    } catch (e) {
      console.error('AI analysis failed:', e);
    }

    // Cleanup
    this.cleanupDuel(duelState);
  }

  /**
   * Handle duel expiration
   */
  async handleDuelExpired(duelState, reason) {
    if (duelState.message) {
      try {
        await duelState.message.edit({
          content: '',
          embeds: [this.createExpiredEmbed(reason)],
          components: []
        });
      } catch (e) {}
    }
    this.cleanupDuel(duelState);
  }

  /**
   * Cleanup duel state
   */
  cleanupDuel(duelState) {
    if (duelState.collector) {
      duelState.collector.stop('cleanup');
    }
    this.activeDuels.delete(duelState.challengerId);
    this.activeDuels.delete(duelState.opponentId);
    this.collectors.delete(duelState.challengeId);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // UTILITY METHODS
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Generate questions using AI
   */
  async generateQuestions(settings) {
    try {
      const result = await aiOrchestrator.generateQuiz(
        settings.topic || 'random',
        settings.questionCount || 5,
        settings.difficulty || 'medium'
      );

      if (result.success && Array.isArray(result.data) && result.data.length > 0) {
        return result.data.map(q => ({
          question: q.question,
          options: q.options?.map(opt => opt.replace(/^[A-D]\)\s*/, '')) || [],
          correctIndex: q.correct ?? q.correctIndex ?? 0,
          explanation: q.explanation || '',
          topic: q.topic || settings.topic
        }));
      }
    } catch (e) {
      console.error('AI question generation failed:', e);
    }

    return this.getFallbackQuestions(settings);
  }

  /**
   * Fallback questions
   */
  getFallbackQuestions(settings) {
    const fallback = [
      { question: 'What does "def" do in Python?', options: ['Defines a variable', 'Defines a function', 'Defines a class', 'Defines a module'], correctIndex: 1, explanation: '"def" defines a function in Python.', topic: 'python' },
      { question: 'What is O(1) time complexity?', options: ['Linear', 'Constant', 'Logarithmic', 'Quadratic'], correctIndex: 1, explanation: 'O(1) means constant time - same time regardless of input size.', topic: 'algorithms' },
      { question: 'What does === mean in JavaScript?', options: ['Assignment', 'Loose equality', 'Strict equality', 'Not equal'], correctIndex: 2, explanation: '=== checks both value and type equality.', topic: 'javascript' },
      { question: 'Which structure uses LIFO?', options: ['Queue', 'Stack', 'Array', 'Tree'], correctIndex: 1, explanation: 'Stack uses Last In First Out ordering.', topic: 'data_structures' },
      { question: 'What is a closure?', options: ['Browser close', 'Function with outer scope access', 'Loop end', 'Error type'], correctIndex: 1, explanation: 'A closure is a function that retains access to its outer scope.', topic: 'javascript' }
    ];

    return fallback.slice(0, settings.questionCount || 5);
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORT SINGLETON
// ═══════════════════════════════════════════════════════════════════════════════

export const duelManager = new DuelManager();
export default duelManager;
