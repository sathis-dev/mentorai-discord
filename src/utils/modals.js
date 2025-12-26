import { 
  ModalBuilder, 
  TextInputBuilder, 
  TextInputStyle, 
  ActionRowBuilder 
} from 'discord.js';

/**
 * Modal Builders for User Input
 */

export function createFeedbackModal() {
  const modal = new ModalBuilder()
    .setCustomId('modal_feedback')
    .setTitle('📝 Share Your Feedback');

  const ratingInput = new TextInputBuilder()
    .setCustomId('feedback_rating')
    .setLabel('How would you rate MentorAI? (1-5)')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('5')
    .setRequired(true)
    .setMinLength(1)
    .setMaxLength(1);

  const feedbackInput = new TextInputBuilder()
    .setCustomId('feedback_text')
    .setLabel('What do you like or want improved?')
    .setStyle(TextInputStyle.Paragraph)
    .setPlaceholder('Your feedback helps us improve...')
    .setRequired(true)
    .setMinLength(10)
    .setMaxLength(1000);

  const featureInput = new TextInputBuilder()
    .setCustomId('feedback_feature')
    .setLabel('Any feature requests?')
    .setStyle(TextInputStyle.Paragraph)
    .setPlaceholder('Describe a feature you would love to see...')
    .setRequired(false)
    .setMaxLength(500);

  modal.addComponents(
    new ActionRowBuilder().addComponents(ratingInput),
    new ActionRowBuilder().addComponents(feedbackInput),
    new ActionRowBuilder().addComponents(featureInput)
  );

  return modal;
}

export function createCustomQuizModal() {
  const modal = new ModalBuilder()
    .setCustomId('modal_custom_quiz')
    .setTitle('🎯 Create Custom Quiz');

  const topicInput = new TextInputBuilder()
    .setCustomId('quiz_topic')
    .setLabel('Quiz Topic')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('e.g., JavaScript Promises, React Hooks')
    .setRequired(true)
    .setMaxLength(100);

  const questionsInput = new TextInputBuilder()
    .setCustomId('quiz_questions')
    .setLabel('Number of Questions (1-10)')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('5')
    .setRequired(true)
    .setMaxLength(2);

  const focusInput = new TextInputBuilder()
    .setCustomId('quiz_focus')
    .setLabel('Specific areas to focus on?')
    .setStyle(TextInputStyle.Paragraph)
    .setPlaceholder('e.g., async/await, error handling, best practices')
    .setRequired(false)
    .setMaxLength(300);

  modal.addComponents(
    new ActionRowBuilder().addComponents(topicInput),
    new ActionRowBuilder().addComponents(questionsInput),
    new ActionRowBuilder().addComponents(focusInput)
  );

  return modal;
}

export function createLearningGoalModal() {
  const modal = new ModalBuilder()
    .setCustomId('modal_learning_goal')
    .setTitle('🎯 Set Your Learning Goal');

  const goalInput = new TextInputBuilder()
    .setCustomId('goal_description')
    .setLabel('What do you want to learn?')
    .setStyle(TextInputStyle.Paragraph)
    .setPlaceholder('e.g., I want to become a full-stack developer')
    .setRequired(true)
    .setMaxLength(500);

  const timelineInput = new TextInputBuilder()
    .setCustomId('goal_timeline')
    .setLabel('Target timeline')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('e.g., 3 months')
    .setRequired(true)
    .setMaxLength(50);

  const experienceInput = new TextInputBuilder()
    .setCustomId('goal_experience')
    .setLabel('Current experience level')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('beginner / intermediate / advanced')
    .setRequired(true)
    .setMaxLength(20);

  modal.addComponents(
    new ActionRowBuilder().addComponents(goalInput),
    new ActionRowBuilder().addComponents(timelineInput),
    new ActionRowBuilder().addComponents(experienceInput)
  );

  return modal;
}

export function createBugReportModal() {
  const modal = new ModalBuilder()
    .setCustomId('modal_bug_report')
    .setTitle('🐛 Report a Bug');

  const commandInput = new TextInputBuilder()
    .setCustomId('bug_command')
    .setLabel('Which command had the issue?')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('/quiz, /learn, etc.')
    .setRequired(true)
    .setMaxLength(50);

  const descriptionInput = new TextInputBuilder()
    .setCustomId('bug_description')
    .setLabel('Describe what happened')
    .setStyle(TextInputStyle.Paragraph)
    .setPlaceholder('Please describe the bug in detail...')
    .setRequired(true)
    .setMinLength(20)
    .setMaxLength(1000);

  const stepsInput = new TextInputBuilder()
    .setCustomId('bug_steps')
    .setLabel('Steps to reproduce (if known)')
    .setStyle(TextInputStyle.Paragraph)
    .setPlaceholder('1. Used /quiz command\n2. Selected topic...')
    .setRequired(false)
    .setMaxLength(500);

  modal.addComponents(
    new ActionRowBuilder().addComponents(commandInput),
    new ActionRowBuilder().addComponents(descriptionInput),
    new ActionRowBuilder().addComponents(stepsInput)
  );

  return modal;
}

export function createStudyNoteModal(topic) {
  const modal = new ModalBuilder()
    .setCustomId('modal_study_note_' + encodeURIComponent(topic || 'general'))
    .setTitle('📝 Add Study Note');

  const titleInput = new TextInputBuilder()
    .setCustomId('note_title')
    .setLabel('Note Title')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('e.g., Key concept about closures')
    .setRequired(true)
    .setMaxLength(100);

  const contentInput = new TextInputBuilder()
    .setCustomId('note_content')
    .setLabel('Your Notes')
    .setStyle(TextInputStyle.Paragraph)
    .setPlaceholder('Write your notes, key points, or code snippets...')
    .setRequired(true)
    .setMaxLength(2000);

  modal.addComponents(
    new ActionRowBuilder().addComponents(titleInput),
    new ActionRowBuilder().addComponents(contentInput)
  );

  return modal;
}

export function createChallengeMessageModal() {
  const modal = new ModalBuilder()
    .setCustomId('modal_challenge_message')
    .setTitle('⚔️ Challenge Message');

  const messageInput = new TextInputBuilder()
    .setCustomId('challenge_message')
    .setLabel('Add a message to your challenge')
    .setStyle(TextInputStyle.Paragraph)
    .setPlaceholder('Think you can beat me? 😎')
    .setRequired(false)
    .setMaxLength(200);

  modal.addComponents(
    new ActionRowBuilder().addComponents(messageInput)
  );

  return modal;
}
