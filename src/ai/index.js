import openai from './openai.js';
import anthropic from './anthropic.js';
import { logger } from '../utils/logger.js';

export async function generateLesson(prompt, options = {}) {
  try {
    return await openai.generateLessonContent(prompt, options);
  } catch (error) {
    logger.warn('OpenAI failed, falling back to Claude');
    return await anthropic.generateWithClaude(
      prompt,
      getTeacherPrompt(options.level),
      options
    );
  }
}

export async function generateQuiz(topic, numQuestions, level) {
  try {
    return await openai.generateQuizQuestions(topic, numQuestions, level);
  } catch (error) {
    logger.warn('OpenAI quiz failed, falling back to Claude');
    throw error;
  }
}

export async function generateImage(prompt) {
  return await openai.generateImage(prompt);
}

function getTeacherPrompt(level) {
  const levelGuides = {
    beginner: 'Use simple language, lots of examples, and avoid jargon.',
    intermediate: 'Assume basic knowledge. Use technical terms but explain advanced concepts.',
    advanced: 'Use technical language freely. Focus on nuances and advanced patterns.'
  };

  return `You are MentorAI, an expert teacher. ${levelGuides[level || 'beginner']}`;
}

export { openai, anthropic };
export default {
  generateLesson,
  generateQuiz,
  generateImage
};
