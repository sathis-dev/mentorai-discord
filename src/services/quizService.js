import { generateQuizQuestions } from '../ai/openai.js';
import { User } from '../database/models/User.js';
import { Progress } from '../database/models/Progress.js';
import { checkAchievements } from './gamificationService.js';
import { logger } from '../utils/logger.js';

const activeQuizzes = new Map();

export async function generateQuiz({ topic, numQuestions, userId }) {
  const questions = await generateQuizQuestions(topic, numQuestions);

  const quiz = {
    id: `quiz_${Date.now()}_${userId}`,
    topic,
    questions,
    currentQuestion: 0,
    score: 0,
    answers: [],
    startedAt: new Date(),
    userId
  };

  activeQuizzes.set(quiz.id, quiz);

  return quiz;
}

export async function answerQuestion(quizId, answerIndex) {
  const quiz = activeQuizzes.get(quizId);
  if (!quiz) throw new Error('Quiz not found or expired');

  const question = quiz.questions[quiz.currentQuestion];
  const isCorrect = answerIndex === question.correctIndex;

  quiz.answers.push({
    questionIndex: quiz.currentQuestion,
    selectedAnswer: answerIndex,
    isCorrect,
    timeSpent: 0
  });

  if (isCorrect) {
    quiz.score += question.xp || 10;
  }

  quiz.currentQuestion += 1;

  const isComplete = quiz.currentQuestion >= quiz.questions.length;

  if (isComplete) {
    await completeQuiz(quiz);
  }

  return {
    isCorrect,
    correctAnswer: question.options[question.correctIndex],
    explanation: question.explanation,
    score: quiz.score,
    isComplete,
    nextQuestion: isComplete ? null : quiz.questions[quiz.currentQuestion]
  };
}

async function completeQuiz(quiz) {
  const user = await User.findOne({ discordId: quiz.userId });
  if (!user) return;

  const correctCount = quiz.answers.filter(a => a.isCorrect).length;
  const totalQuestions = quiz.questions.length;
  const percentage = (correctCount / totalQuestions) * 100;

  await user.addXp(quiz.score);

  user.quizzesCompleted += 1;
  user.totalQuestions += totalQuestions;
  user.correctAnswers += correctCount;

  if (percentage >= 70) {
    user.quizzesPassed += 1;
  }

  await user.save();

  await Progress.updateOne(
    { discordId: quiz.userId },
    {
      $push: {
        quizResults: {
          quizId: quiz.id,
          score: quiz.score,
          totalQuestions,
          completedAt: new Date()
        }
      }
    },
    { upsert: true }
  );

  await checkAchievements(user);

  activeQuizzes.delete(quiz.id);

  return {
    finalScore: quiz.score,
    correctAnswers: correctCount,
    totalQuestions,
    percentage,
    passed: percentage >= 70
  };
}

export function getQuiz(quizId) {
  return activeQuizzes.get(quizId);
}

export default {
  generateQuiz,
  answerQuestion,
  getQuiz
};
