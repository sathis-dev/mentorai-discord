import { generateQuiz } from '../ai/index.js';
import { XP_REWARDS, checkAchievements, ACHIEVEMENTS } from './gamificationService.js';

// In-memory quiz sessions
const activeSessions = new Map();

/**
 * Create a new quiz session with AI-generated questions
 */
export async function createQuizSession(userId, topic, numQuestions = 5, difficulty = 'medium') {
  // Get user context for personalization (can be enhanced with DB data later)
  const userContext = {
    weakAreas: [],
    recentlyLearned: topic
  };

  // Generate quiz using AI
  const quizData = await generateQuiz(topic, numQuestions, difficulty, userContext);

  if (!quizData || !quizData.questions || quizData.questions.length === 0) {
    console.error('Failed to generate quiz');
    return null;
  }

  // Create session
  const session = {
    quizId: 'quiz_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 9),
    topic: quizData.topic || topic,
    difficulty: quizData.difficulty || difficulty,
    quizTitle: quizData.quizTitle || topic + ' Quiz',
    questions: quizData.questions,
    currentQuestion: 0,
    score: 0,
    answers: [],
    startedAt: Date.now(),
    encouragement: quizData.encouragement || 'Great job completing the quiz!',
    hintUsed: false,
    fiftyUsed: false,
    eliminatedOptions: [] // For 50/50
  };

  activeSessions.set(userId, session);
  
  console.log('Quiz session created for user ' + userId + ' with ' + session.questions.length + ' questions');
  
  return session;
}

/**
 * Use hint for current question
 */
export function useHint(userId) {
  const session = activeSessions.get(userId);
  if (!session) return null;
  
  if (session.hintUsed) {
    return { alreadyUsed: true };
  }
  
  session.hintUsed = true;
  const currentQ = session.questions[session.currentQuestion];
  
  // Generate a hint based on the question
  const hint = currentQ.explanation 
    ? `💡 **Hint:** Think about ${currentQ.conceptTested || 'the core concept'}...`
    : `💡 **Hint:** Consider what makes option ${['A', 'B', 'C', 'D'][currentQ.correctIndex]} unique.`;
  
  return { hint, conceptTested: currentQ.conceptTested };
}

/**
 * Use 50/50 lifeline - eliminate 2 wrong answers
 */
export function useFiftyFifty(userId) {
  const session = activeSessions.get(userId);
  if (!session) return null;
  
  if (session.fiftyUsed) {
    return { alreadyUsed: true };
  }
  
  session.fiftyUsed = true;
  const currentQ = session.questions[session.currentQuestion];
  const correctIndex = currentQ.correctIndex;
  
  // Get wrong answer indices
  const wrongIndices = [0, 1, 2, 3].filter(i => i !== correctIndex);
  
  // Randomly pick 2 wrong answers to eliminate
  const shuffled = wrongIndices.sort(() => Math.random() - 0.5);
  const eliminated = shuffled.slice(0, 2);
  
  session.eliminatedOptions = eliminated;
  
  return { 
    eliminated, 
    remaining: [0, 1, 2, 3].filter(i => !eliminated.includes(i))
  };
}

/**
 * Check if options are eliminated (for 50/50)
 */
export function getEliminatedOptions(userId) {
  const session = activeSessions.get(userId);
  return session?.eliminatedOptions || [];
}

/**
 * Reset eliminated options for next question
 */
export function resetEliminatedOptions(userId) {
  const session = activeSessions.get(userId);
  if (session) {
    session.eliminatedOptions = [];
  }
}

/**
 * Get current session for a user
 */
export function getSession(userId) {
  return activeSessions.get(userId);
}

/**
 * Get current question data
 */
export function getCurrentQuestion(userId) {
  const session = activeSessions.get(userId);
  if (!session) return null;

  const currentQ = session.questions[session.currentQuestion];
  if (!currentQ) return null;

  return {
    question: currentQ,
    questionNum: session.currentQuestion + 1,
    totalQuestions: session.questions.length,
    topic: session.topic,
    difficulty: session.difficulty
  };
}

/**
 * Submit an answer and get result - Enhanced with more data
 */
export async function submitAnswer(userId, answerIndex, user) {
  const session = activeSessions.get(userId);
  if (!session) return null;

  const currentQ = session.questions[session.currentQuestion];
  if (!currentQ) return null;

  const isCorrect = answerIndex === currentQ.correctIndex;

  // Record answer
  session.answers.push({
    questionIndex: session.currentQuestion,
    questionId: currentQ.id,
    selected: answerIndex,
    correct: currentQ.correctIndex,
    isCorrect,
    conceptTested: currentQ.conceptTested
  });

  if (isCorrect) {
    session.score++;
  }

  session.currentQuestion++;

  // Check if quiz is complete
  if (session.currentQuestion >= session.questions.length) {
    return await completeQuiz(userId, user);
  }

  // Return result with more data for enhanced UI
  return {
    isCorrect,
    explanation: currentQ.explanation,
    correctAnswer: currentQ.correctIndex,
    selectedAnswer: answerIndex,
    correctOption: currentQ.options[currentQ.correctIndex],
    isComplete: false,
    currentQuestion: session.currentQuestion,
    totalQuestions: session.questions.length,
    score: session.score,
    nextQuestion: null // Don't include next question - wait for continue button
  };
}

/**
 * Complete quiz and calculate rewards
 */
async function completeQuiz(userId, user) {
  const session = activeSessions.get(userId);
  if (!session) return null;

  const totalQuestions = session.questions.length;
  const score = session.score;
  const percentage = Math.round((score / totalQuestions) * 100);
  const isPerfect = score === totalQuestions;
  const duration = Date.now() - session.startedAt;

  // Calculate XP
  let xpEarned = XP_REWARDS.QUIZ_COMPLETE;
  xpEarned += score * XP_REWARDS.QUIZ_CORRECT;

  // Bonus for perfect score
  if (isPerfect) {
    xpEarned += XP_REWARDS.QUIZ_PERFECT;
  }

  // Difficulty multiplier
  const difficultyMultiplier = { easy: 0.8, medium: 1, hard: 1.5 };
  xpEarned = Math.floor(xpEarned * (difficultyMultiplier[session.difficulty] || 1));

  // Determine achievements
  const achievements = [];
  
  if (isPerfect) {
    achievements.push(ACHIEVEMENTS.PERFECT_QUIZ.name);
  }
  
  // First quiz achievement (check if user has taken quizzes before)
  if (!user?.quizzesTaken || user.quizzesTaken === 0) {
    achievements.push(ACHIEVEMENTS.FIRST_QUIZ.name);
    xpEarned += XP_REWARDS.FIRST_QUIZ;
  }

  // Prepare result
  const result = {
    isComplete: true,
    score,
    totalQuestions,
    percentage,
    xpEarned,
    isPerfect,
    duration,
    leveledUp: false,
    newLevel: user?.level || 1,
    achievements,
    answers: session.answers,
    topic: session.topic,
    difficulty: session.difficulty,
    encouragement: session.encouragement,
    conceptsToReview: session.answers
      .filter(a => !a.isCorrect)
      .map(a => a.conceptTested)
      .filter(Boolean)
  };

  // Clean up session
  activeSessions.delete(userId);

  return result;
}

/**
 * Cancel a quiz session
 */
export function cancelSession(userId) {
  activeSessions.delete(userId);
}

/**
 * Get quiz statistics for a user
 */
export function getQuizStats(userId) {
  // This would normally come from the database
  return {
    totalQuizzes: 0,
    averageScore: 0,
    bestScore: 0,
    topicsQuizzed: [],
    recentQuizzes: []
  };
}
