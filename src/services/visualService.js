import OpenAI from 'openai';
import { logger } from '../utils/logger.js';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export async function generateLessonDiagram(lessonTopic, lessonContent) {
  try {
    const prompt = `Create an educational diagram for: ${lessonTopic}. 
    Make it clear, colorful, and easy to understand. 
    Style: Modern, clean, professional educational infographic.
    Include: Key concepts, arrows showing relationships, visual examples.
    Context: ${lessonContent.substring(0, 200)}`;

    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: prompt,
      n: 1,
      size: "1024x1024",
      quality: "standard",
      style: "natural"
    });

    return response.data[0].url;
  } catch (error) {
    logger.error('Failed to generate lesson diagram:', error);
    return null;
  }
}

export async function generateCodeVisualization(code, language, concept) {
  try {
    const prompt = `Create a visual flowchart or diagram showing how this ${language} code works:
    Concept: ${concept}
    Make it educational with clear steps, arrows, and labels.
    Style: Clean, modern, suitable for learning.
    Show: Flow of execution, data transformation, key concepts.`;

    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: prompt,
      n: 1,
      size: "1024x1024",
      quality: "standard"
    });

    return response.data[0].url;
  } catch (error) {
    logger.error('Failed to generate code visualization:', error);
    return null;
  }
}

export async function generateConceptIllustration(concept, explanation) {
  try {
    const prompt = `Create an educational illustration explaining: ${concept}
    Make it visually engaging and easy to understand.
    Style: Modern infographic, colorful, professional.
    Include: Visual metaphors, icons, clear labels.
    Context: ${explanation.substring(0, 200)}`;

    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: prompt,
      n: 1,
      size: "1024x1024",
      quality: "standard"
    });

    return response.data[0].url;
  } catch (error) {
    logger.error('Failed to generate concept illustration:', error);
    return null;
  }
}

export async function generateSkillTreeVisual(skills, userProgress) {
  try {
    const unlockedSkills = skills.filter(s => userProgress.includes(s.id)).map(s => s.name).join(', ');
    const lockedSkills = skills.filter(s => !userProgress.includes(s.id)).map(s => s.name).join(', ');

    const prompt = `Create a skill tree visualization showing:
    Unlocked skills (glowing/colored): ${unlockedSkills || 'None yet'}
    Locked skills (greyed out): ${lockedSkills}
    Style: Game-like skill tree with nodes, connections, and progression paths.
    Make it inspiring and show clear progression.`;

    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: prompt,
      n: 1,
      size: "1024x1024",
      quality: "standard"
    });

    return response.data[0].url;
  } catch (error) {
    logger.error('Failed to generate skill tree visual:', error);
    return null;
  }
}

export default {
  generateLessonDiagram,
  generateCodeVisualization,
  generateConceptIllustration,
  generateSkillTreeVisual
};
