import Anthropic from '@anthropic-ai/sdk';
import { logger } from '../utils/logger.js';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});

export async function generateWithClaude(prompt, systemPrompt, options = {}) {
  try {
    const response = await anthropic.messages.create({
      model: options.model || 'claude-3-sonnet-20240229',
      max_tokens: options.maxTokens || 2000,
      system: systemPrompt,
      messages: [
        { role: 'user', content: prompt }
      ]
    });

    return response.content[0].text;
  } catch (error) {
    logger.error('Anthropic API error:', error);
    throw error;
  }
}

export default { generateWithClaude };
