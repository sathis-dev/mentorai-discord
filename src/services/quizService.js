import { generateQuiz } from '../ai/index.js';
import { XP_REWARDS, checkAchievements, ACHIEVEMENTS } from './gamificationService.js';
import { QuizSession } from '../database/models/QuizSession.js';
import logger from '../utils/logger.js';

// ============================================
// Quiz Service - Persistent Session Management
// Uses MongoDB with in-memory fallback
// ============================================

// In-memory fallback for when DB is unavailable
const memorySessionCache = new Map();

// Rate limiting: Track AI calls per user
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const MAX_AI_CALLS_PER_MINUTE = 5;

/**
 * Check rate limit for AI quiz generation
 */
function checkRateLimit(userId) {
  const now = Date.now();
  const userCalls = rateLimitMap.get(userId) || [];
  
  // Filter to calls within the window
  const recentCalls = userCalls.filter(time => now - time < RATE_LIMIT_WINDOW);
  
  if (recentCalls.length >= MAX_AI_CALLS_PER_MINUTE) {
    const oldestCall = Math.min(...recentCalls);
    const waitTime = Math.ceil((RATE_LIMIT_WINDOW - (now - oldestCall)) / 1000);
    return { allowed: false, waitTime };
  }
  
  // Record this call
  recentCalls.push(now);
  rateLimitMap.set(userId, recentCalls);
  
  return { allowed: true };
}

/**
 * Convert Mongoose document to plain object
 */
function sessionToObject(session) {
  if (!session) return null;
  const obj = session.toObject ? session.toObject() : session;
  return {
    ...obj,
    quizId: obj.sessionId,
    startedAt: obj.startedAt?.getTime() || Date.now()
  };
}

/**
 * Get active session for user (DB first, then memory)
 */
async function getActiveSession(userId) {
  try {
    const dbSession = await QuizSession.getActiveSession(userId);
    if (dbSession) return dbSession;
  } catch (err) {
    logger.error('DB error getting session:', err.message);
  }
  
  // Fallback to memory
  return memorySessionCache.get(userId) || null;
}

/**
 * Create a new quiz session with AI-generated questions
 */
export async function createQuizSession(userId, topic, numQuestions = 5, difficulty = 'medium') {
  // Check rate limit
  const rateCheck = checkRateLimit(userId);
  if (!rateCheck.allowed) {
    logger.warn(`Rate limit hit for user ${userId}`);
    return { 
      error: 'rate_limited', 
      waitTime: rateCheck.waitTime,
      message: `Please wait ${rateCheck.waitTime} seconds before generating another quiz.`
    };
  }

  // Get user context for personalization
  const userContext = {
    weakAreas: [],
    recentlyLearned: topic
  };

  // Generate quiz using AI
  const quizData = await generateQuiz(topic, numQuestions, difficulty, userContext);

  if (!quizData || !quizData.questions || quizData.questions.length === 0) {
    logger.error('Failed to generate quiz for topic: ' + topic);
    return null;
  }

  // Prepare session data
  const sessionData = {
    topic: quizData.topic || topic,
    difficulty: quizData.difficulty || difficulty,
    quizTitle: quizData.quizTitle || topic + ' Quiz',
    questions: quizData.questions.map((q) => ({
      question: q.question,
      options: q.options,
      correctIndex: q.correctIndex,
      explanation: q.explanation || '',
      conceptTested: q.conceptTested || '',
      difficulty: q.difficulty || difficulty
    })),
    encouragement: quizData.encouragement || 'Great job completing the quiz!'
  };

  try {
    // Try to save to MongoDB
    const session = await QuizSession.createSession(userId, sessionData);
    logger.info(`Quiz session created in DB for user ${userId} with ${session.questions.length} questions`);
    return sessionToObject(session);
  } catch (dbError) {
    logger.error('DB error creating quiz session, using memory fallback:', dbError.message);
    
    // Fallback to in-memory
    const session = {
      sessionId: 'quiz_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 9),
      discordId: userId,
      ...sessionData,
      currentQuestion: 0,
      score: 0,
      answers: [],
      startedAt: Date.now(),
      hintUsed: false,
      fiftyUsed: false,
      eliminatedOptions: [],
      status: 'active'
    };
    
    memorySessionCache.set(userId, session);
    return session;
  }
}

/**
 * Use hint for current question
 */
export async function useHint(userId) {
  const session = await getActiveSession(userId);
  if (!session) return null;
  
  if (session.hintUsed) {
    return { alreadyUsed: true };
  }
  
  const currentQ = session.questions[session.currentQuestion];
  if (!currentQ) return null;
  
  // Generate a hint based on the question
  const hint = currentQ.explanation 
    ? `💡 **Hint:** Think about ${currentQ.conceptTested || 'the core concept'}...`
    : `💡 **Hint:** Consider what makes the correct answer unique.`;
  
  // Update session
  session.hintUsed = true;
  if (session.save) await session.save();
  
  return { hint, conceptTested: currentQ.conceptTested };
}

/**
 * Use 50/50 lifeline - eliminate 2 wrong answers
 */
export async function useFiftyFifty(userId) {
  const session = await getActiveSession(userId);
  if (!session) return null;
  
  if (session.fiftyUsed) {
    return { alreadyUsed: true };
  }
  
  const currentQ = session.questions[session.currentQuestion];
  if (!currentQ) return null;
  
  const correctIndex = currentQ.correctIndex;
  
  // Get wrong answer indices
  const wrongIndices = [0, 1, 2, 3].filter(i => i !== correctIndex);
  
  // Randomly pick 2 wrong answers to eliminate
  const shuffled = wrongIndices.sort(() => Math.random() - 0.5);
  const eliminated = shuffled.slice(0, 2);
  
  // Update session
  session.fiftyUsed = true;
  session.eliminatedOptions = eliminated;
  if (session.save) await session.save();
  
  return { 
    eliminated, 
    remaining: [0, 1, 2, 3].filter(i => !eliminated.includes(i))
  };
}

/**
 * Check if options are eliminated (for 50/50)
 */
export async function getEliminatedOptions(userId) {
  const session = await getActiveSession(userId);
  return session?.eliminatedOptions || [];
}

/**
 * Reset eliminated options for next question
 */
export async function resetEliminatedOptions(userId) {
  const session = await getActiveSession(userId);
  if (session) {
    session.eliminatedOptions = [];
    if (session.save) await session.save();
  }
}

/**
 * Get current session for a user
 */
export async function getSession(userId) {
  return await getActiveSession(userId);
}

/**
 * Get current question data
 */
export async function getCurrentQuestion(userId) {
  const session = await getActiveSession(userId);
  if (!session) return null;

  const currentQ = session.questions[session.currentQuestion];
  if (!currentQ) return null;

  return {
    question: currentQ,
    questionNum: session.currentQuestion + 1,
    totalQuestions: session.questions.length,
    topic: session.topic,
    difficulty: session.difficulty,
    eliminatedOptions: session.eliminatedOptions || [],
    hintUsed: session.hintUsed,
    fiftyUsed: session.fiftyUsed
  };
}

/**
 * Submit an answer and get result - Enhanced with persistence
 */
export async function submitAnswer(userId, answerIndex, user) {
  const session = await getActiveSession(userId);
  if (!session) return null;

  const currentQ = session.questions[session.currentQuestion];
  if (!currentQ) return null;

  const isCorrect = answerIndex === currentQ.correctIndex;

  // Record answer
  const answerRecord = {
    questionIndex: session.currentQuestion,
    selectedIndex: answerIndex,
    correct: isCorrect,
    isCorrect, // Keep both for compatibility
    conceptTested: currentQ.conceptTested,
    timeSpent: 0
  };

  session.answers.push(answerRecord);
  if (isCorrect) session.score++;
  session.eliminatedOptions = [];
  session.currentQuestion++;
  
  if (session.save) {
    session.lastActivityAt = new Date();
  }

  // Check if quiz is complete
  if (session.currentQuestion >= session.questions.length) {
    if (session.save) {
      session.status = 'completed';
      session.completedAt = new Date();
      await session.save();
    }
    return await completeQuiz(userId, user, session);
  }

  // Save progress
  if (session.save) await session.save();

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
async function completeQuiz(userId, user, session) {
  if (!session) {
    session = await getActiveSession(userId);
  }
  if (!session) return null;

  const totalQuestions = session.questions.length;
  const score = session.score;
  const percentage = Math.round((score / totalQuestions) * 100);
  const isPerfect = score === totalQuestions;
  const startedAt = session.startedAt instanceof Date ? session.startedAt.getTime() : session.startedAt;
  const duration = Date.now() - startedAt;

  // Calculate XP
  let xpEarned = XP_REWARDS.QUIZ_COMPLETE;
  xpEarned += score * XP_REWARDS.QUIZ_CORRECT;

  // Bonus for perfect score
  if (isPerfect) {
    xpEarned += XP_REWARDS.QUIZ_PERFECT || 50;
  }

  // Difficulty multiplier
  const difficultyMultiplier = { easy: 0.8, medium: 1, hard: 1.5 };
  xpEarned = Math.floor(xpEarned * (difficultyMultiplier[session.difficulty] || 1));

  // Determine achievements
  const achievements = [];
  
  if (isPerfect) {
    achievements.push(ACHIEVEMENTS.PERFECT_QUIZ?.name || 'Perfect Score');
  }
  
  // First quiz achievement (check if user has taken quizzes before)
  if (!user?.quizzesTaken || user.quizzesTaken === 0) {
    achievements.push(ACHIEVEMENTS.FIRST_QUIZ?.name || 'Quiz Starter');
    xpEarned += XP_REWARDS.FIRST_QUIZ || 25;
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
      .filter(a => !a.isCorrect && !a.correct)
      .map(a => a.conceptTested)
      .filter(Boolean)
  };

  // Clean up memory session if used
  memorySessionCache.delete(userId);

  return result;
}

/**
 * Cancel a quiz session
 */
export async function cancelSession(userId) {
  try {
    await QuizSession.updateMany(
      { discordId: userId, status: 'active' },
      { status: 'cancelled' }
    );
  } catch (err) {
    logger.error('DB error cancelling session:', err.message);
  }
  
  memorySessionCache.delete(userId);
}

/**
 * Cleanup expired sessions (call periodically)
 */
export async function cleanupExpiredSessions() {
  try {
    const count = await QuizSession.cleanupOldSessions();
    if (count > 0) {
      logger.info(`Cleaned up ${count} expired quiz sessions`);
    }
    return count;
  } catch (err) {
    logger.error('Error cleaning up sessions:', err.message);
    return 0;
  }
}

/**
 * Get quiz statistics for a user
 */
export async function getQuizStats(userId) {
  try {
    const completed = await QuizSession.find({
      discordId: userId,
      status: 'completed'
    }).sort({ completedAt: -1 }).limit(10).lean();
    
    const totalQuizzes = completed.length;
    const totalScore = completed.reduce((sum, q) => sum + q.score, 0);
    const totalQs = completed.reduce((sum, q) => sum + q.questions.length, 0);
    
    return {
      totalQuizzes,
      averageScore: totalQs > 0 ? Math.round((totalScore / totalQs) * 100) : 0,
      bestScore: completed.reduce((best, q) => {
        const pct = (q.score / q.questions.length) * 100;
        return pct > best ? pct : best;
      }, 0),
      topicsQuizzed: [...new Set(completed.map(q => q.topic))],
      recentQuizzes: completed.slice(0, 5)
    };
  } catch (err) {
    logger.error('Error getting quiz stats:', err.message);
    return {
      totalQuizzes: 0,
      averageScore: 0,
      bestScore: 0,
      topicsQuizzed: [],
      recentQuizzes: []
    };
  }
}
