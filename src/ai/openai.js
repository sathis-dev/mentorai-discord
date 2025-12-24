import OpenAI from 'openai';
import { logger } from '../utils/logger.js';
import { getQuizByTopic } from '../data/quizzes/index.js';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export async function generateLessonContent(prompt, options = {}) {
  // Check if API key is configured
  if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your-openai-api-key-here') {
    const errorMsg = '⚠️ OpenAI API key not configured! Add OPENAI_API_KEY to your .env file to enable AI-powered lessons.';
    logger.error(errorMsg);
    throw new Error(errorMsg);
  }

  try {
    logger.info(`🤖 Generating AI lesson: ${prompt.substring(0, 50)}...`);
    
    const response = await openai.chat.completions.create({
      model: options.model || 'gpt-4o-mini', // Fast, cheap, powerful
      messages: [
        {
          role: 'system',
          content: getTeacherPrompt(options.level || 'beginner')
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: options.maxTokens || 2000,
      temperature: options.temperature || 0.7
    });

    logger.info('✅ AI lesson generated successfully');
    return response.choices[0].message.content;
  } catch (error) {
    logger.error('❌ OpenAI lesson generation failed:', error.message);
    throw error;
  }
}

export async function generateQuizQuestions(topic, numQuestions = 5, level = 'beginner') {
  // ⚡ PRIORITY: Try OpenAI API FIRST for infinite variety and personalization
  if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your-openai-api-key-here') {
    try {
      logger.info(`🤖 Generating AI-powered ${topic} quiz (${numQuestions} questions, ${level} level)`);
      
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini', // Using gpt-4o-mini: faster, cheaper, supports JSON mode
        messages: [
          {
            role: 'system',
            content: getQuizMasterPrompt(level) + '\n\nYou MUST respond with valid JSON only, no other text.'
          },
          {
            role: 'user',
            content: `Generate ${numQuestions} multiple choice questions about: ${topic}

Return ONLY a JSON object with this exact structure (no markdown, no code blocks, just raw JSON):
{
  "questions": [
    {
      "question": "The question text",
      "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
      "correctIndex": 0,
      "explanation": "Why this is correct",
      "difficulty": "${level}",
      "xp": ${level === 'beginner' ? 10 : level === 'intermediate' ? 15 : 20}
    }
  ]
}`
          }
        ],
        max_tokens: 2000,
        temperature: 0.8,
        response_format: { type: 'json_object' }
      });

      const content = response.choices[0].message.content;
      const parsed = JSON.parse(content);
      const questions = parsed.questions || parsed;
      
      if (Array.isArray(questions) && questions.length > 0) {
        logger.info(`✅ Successfully generated ${questions.length} AI quiz questions`);
        return questions;
      }
    } catch (error) {
      logger.error('⚠️ OpenAI API ERROR Details:');
      logger.error(`   Error Type: ${error.constructor.name}`);
      logger.error(`   Error Message: ${error.message}`);
      logger.error(`   Error Code: ${error.code || 'N/A'}`);
      logger.error(`   Error Status: ${error.status || 'N/A'}`);
      if (error.response) {
        logger.error(`   Response Status: ${error.response.status}`);
        logger.error(`   Response Data: ${JSON.stringify(error.response.data)}`);
      }
      logger.error('   → Falling back to curated question database');
    }
  } else {
    logger.warn('⚠️ OpenAI API key not configured. Add OPENAI_API_KEY to .env for AI-powered quizzes!');
    logger.warn('   → Get your key at: https://platform.openai.com/api-keys');
    logger.warn('   → Add to .env file: OPENAI_API_KEY=sk-proj-...');
  }

  // 📚 FALLBACK: Use curated question database (backup only)
  logger.info(`📚 Using curated ${topic} questions from database`);
  const curatedQuestions = getQuizByTopic(topic, level, numQuestions);
  
  if (curatedQuestions && curatedQuestions.length > 0) {
    return curatedQuestions;
  }

  // Last resort: try any topic from database
  logger.warn(`⚠️ No questions found for ${topic}, using Python questions`);
  return getQuizByTopic('python', level, numQuestions);
}

export async function generateImage(prompt) {
  try {
    const response = await openai.images.generate({
      model: 'dall-e-3',
      prompt: `Educational diagram: ${prompt}. Clean, modern, professional style suitable for learning. White background, clear labels.`,
      n: 1,
      size: '1024x1024',
      quality: 'standard'
    });

    return response.data[0].url;
  } catch (error) {
    logger.error('DALL-E image generation error:', error);
    throw error;
  }
}

export async function chat(messages, systemPrompt) {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages
      ],
      max_tokens: 1500,
      temperature: 0.7
    });

    return response.choices[0].message.content;
  } catch (error) {
    logger.error('OpenAI chat error:', error);
    throw error;
  }
}

function getTeacherPrompt(level) {
  const levelGuides = {
    beginner: 'Use simple language, lots of examples, and avoid jargon. Explain concepts like talking to a curious 12-year-old.',
    intermediate: 'Assume basic knowledge. Use technical terms but explain advanced concepts. Include practical examples.',
    advanced: 'Use technical language freely. Focus on nuances, edge cases, and advanced patterns. Challenge the learner.'
  };

  return `You are MentorAI, an expert teacher who makes learning fun and engaging.

Your teaching style:
- Be encouraging and supportive
- Use analogies and real-world examples
- Break complex topics into digestible chunks
- Include "Try This" exercises when appropriate
- Use emojis sparingly but effectively
- Keep explanations under 1500 characters for Discord

Level guidance: ${levelGuides[level]}

Format your response with:
- A catchy title
- Clear explanation (2-3 paragraphs max)
- Key Points section (3-5 bullet points)
- A "Try This" mini-exercise if appropriate
- What's Next teaser

Never use code blocks longer than 10 lines. If more code is needed, suggest checking documentation.`;
}

function getQuizMasterPrompt(level) {
  return `You are a quiz master creating engaging multiple-choice questions.

Rules:
- Questions should test understanding, not just memorization
- Include one clearly correct answer and three plausible distractors
- Vary difficulty based on level: ${level}
- Keep questions concise but clear
- Provide helpful explanations for learning

For ${level} level:
${level === 'beginner' ? '- Focus on fundamental concepts and definitions' : ''}
${level === 'intermediate' ? '- Include application-based questions' : ''}
${level === 'advanced' ? '- Test edge cases and deeper understanding' : ''}`;
}

export default {
  generateLessonContent,
  generateQuizQuestions,
  generateImage,
  chat
};
