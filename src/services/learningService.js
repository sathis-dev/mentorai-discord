import { generateLessonContent } from '../ai/openai.js';
import { User } from '../database/models/User.js';
import { Progress } from '../database/models/Progress.js';
import { logger } from '../utils/logger.js';

export async function generateLesson({ topic, level, userId, guildId }) {
  let user = await User.findOne({ discordId: userId });
  if (!user) {
    user = await User.create({
      discordId: userId,
      preferredLevel: level
    });
  }

  const prompt = `Create a lesson about: ${topic}
  
  User level: ${level}
  This should be lesson 1 in a learning path.
  
  Include:
  1. A catchy title
  2. Clear explanation with examples
  3. Key takeaways
  4. A mini exercise`;

  const content = await generateLessonContent(prompt, { level });

  const lesson = {
    id: `lesson_${Date.now()}`,
    title: extractTitle(content),
    content: content,
    topic: topic,
    level: level,
    estimatedMinutes: estimateReadTime(content),
    xpReward: calculateXpReward(level),
    totalLessons: 5,
    createdAt: new Date()
  };

  await Progress.updateOne(
    { discordId: userId, topic },
    {
      $push: { lessonsViewed: lesson.id },
      $set: { updatedAt: new Date() }
    },
    { upsert: true }
  );

  await user.updateStreak();

  return lesson;
}

export async function completeLesson(userId, lessonId) {
  const user = await User.findOne({ discordId: userId });
  if (!user) throw new Error('User not found');

  const xpReward = 25;
  await user.addXp(xpReward);

  await Progress.updateOne(
    { discordId: userId },
    {
      $addToSet: { lessonsCompleted: lessonId },
      $inc: { totalTimeSpent: 5 }
    }
  );

  user.lessonsCompleted += 1;
  await user.save();

  return {
    xpEarned: xpReward,
    newLevel: user.level,
    totalXp: user.totalXp
  };
}

function extractTitle(content) {
  const titleMatch = content.match(/^#\s*(.+)|^(.+)\n=+/m);
  return titleMatch ? (titleMatch[1] || titleMatch[2]).trim() : 'Lesson';
}

function estimateReadTime(content) {
  const wordsPerMinute = 200;
  const words = content.split(/\s+/).length;
  return Math.ceil(words / wordsPerMinute);
}

function calculateXpReward(level) {
  const baseXp = { beginner: 20, intermediate: 30, advanced: 50 };
  return baseXp[level] || 25;
}

export default {
  generateLesson,
  completeLesson
};
