import { generateLesson, getStudyAdvice, explainConcept, getDailyTip, generateLearningPath } from '../ai/index.js';
import { XP_REWARDS, checkAchievements } from './gamificationService.js';

// In-memory storage for user learning progress (replace with DB later)
const userLearningData = new Map();

export const POPULAR_TOPICS = [
  { name: 'JavaScript', emoji: '🟨', description: 'Web programming language', category: 'languages' },
  { name: 'Python', emoji: '🐍', description: 'Versatile & beginner-friendly', category: 'languages' },
  { name: 'React', emoji: '⚛️', description: 'UI component library', category: 'frameworks' },
  { name: 'Node.js', emoji: '🟢', description: 'Server-side JavaScript', category: 'runtime' },
  { name: 'TypeScript', emoji: '🔷', description: 'Typed JavaScript', category: 'languages' },
  { name: 'HTML/CSS', emoji: '🌐', description: 'Web structure & styling', category: 'web' },
  { name: 'SQL', emoji: '🗄️', description: 'Database queries', category: 'databases' },
  { name: 'Git', emoji: '📚', description: 'Version control', category: 'tools' },
  { name: 'APIs', emoji: '🔌', description: 'Application interfaces', category: 'concepts' },
  { name: 'Algorithms', emoji: '🧮', description: 'Problem-solving patterns', category: 'cs-fundamentals' },
  { name: 'Data Structures', emoji: '📊', description: 'Organizing data', category: 'cs-fundamentals' },
  { name: 'Docker', emoji: '🐳', description: 'Containerization', category: 'devops' }
];

/**
 * Get a lesson on any topic using AI
 */
export async function getLesson(topic, difficulty = 'beginner', user = null) {
  try {
    // Get user context for personalization
    const userContext = user ? {
      previousTopics: user.topicsStudied || [],
      level: user.level || 1,
      struggles: user.weakAreas || []
    } : {};

    // Generate lesson using AI
    const lesson = await generateLesson(topic, difficulty, userContext);

    // Ensure lesson is valid
    if (!lesson || typeof lesson !== 'object') {
      throw new Error('Invalid lesson returned from AI');
    }

    // Calculate XP reward
    const difficultyMultiplier = { beginner: 1, intermediate: 1.5, advanced: 2 };
    const xpEarned = Math.floor(XP_REWARDS.LESSON_COMPLETE * (difficultyMultiplier[difficulty] || 1));

    // Track learning progress
    if (user) {
      trackLearningProgress(user.discordId, topic, 'lesson');
    }

    return {
      lesson,
      xpEarned,
      leveledUp: false,
      newLevel: user?.level || 1,
      achievements: []
    };
  } catch (error) {
    console.error('Error in getLesson:', error.message);
    
    // Return a fallback lesson so the command doesn't fail
    const fallbackLesson = {
      title: `Introduction to ${topic}`,
      introduction: `Let's explore ${topic} together! This is a great topic to learn.`,
      content: `${topic} is an important area in software development. Understanding it will help you become a better programmer.\n\nThis lesson covers the fundamentals to get you started on your learning journey.`,
      keyPoints: [
        `${topic} is essential for modern development`,
        'Practice makes perfect',
        'Start with basics, then advance',
        'Build projects to solidify learning'
      ],
      codeExample: {
        language: 'javascript',
        code: `// Start learning ${topic}\nconsole.log("Hello ${topic}!");`,
        explanation: 'A simple starting point for your learning'
      },
      practiceChallenge: {
        task: `Research 3 real-world uses of ${topic}`,
        hint: 'Look at popular open source projects'
      },
      nextSteps: `Continue exploring advanced ${topic} concepts`,
      funFact: `${topic} is used by developers worldwide!`
    };

    const difficultyMultiplier = { beginner: 1, intermediate: 1.5, advanced: 2 };
    const xpEarned = Math.floor(XP_REWARDS.LESSON_COMPLETE * (difficultyMultiplier[difficulty] || 1));

    return {
      lesson: fallbackLesson,
      xpEarned,
      leveledUp: false,
      newLevel: user?.level || 1,
      achievements: []
    };
  }
}

/**
 * Get personalized study advice
 */
export async function getPersonalizedAdvice(user) {
  const userStats = {
    level: user?.level || 1,
    xp: user?.xp || 0,
    streak: user?.streak || 0,
    quizzesTaken: user?.quizzesTaken || 0,
    accuracy: user?.totalQuestions > 0 
      ? Math.round((user.correctAnswers / user.totalQuestions) * 100) 
      : 0,
    topicsStudied: user?.topicsStudied || [],
    weakAreas: user?.weakAreas || []
  };

  return await getStudyAdvice(userStats);
}

/**
 * Get explanation for a concept
 */
export async function getConceptExplanation(concept, context = '') {
  return await explainConcept(concept, context);
}

/**
 * Get daily learning tip
 */
export async function getTodaysTip() {
  return await getDailyTip();
}

/**
 * Generate a learning path
 */
export async function createLearningPath(goal, currentLevel = 'beginner') {
  return await generateLearningPath(goal, currentLevel);
}

/**
 * Track user learning progress
 */
function trackLearningProgress(userId, topic, type) {
  if (!userLearningData.has(userId)) {
    userLearningData.set(userId, {
      lessonsCompleted: [],
      quizzesCompleted: [],
      topicsStudied: new Set(),
      lastActivity: null
    });
  }

  const data = userLearningData.get(userId);
  data.topicsStudied.add(topic.toLowerCase());
  data.lastActivity = new Date();

  if (type === 'lesson') {
    data.lessonsCompleted.push({ topic, timestamp: new Date() });
  } else if (type === 'quiz') {
    data.quizzesCompleted.push({ topic, timestamp: new Date() });
  }
}

/**
 * Get recommended next topic based on learning history
 */
export function getRecommendedTopic(user) {
  const studied = new Set((user?.topicsStudied || []).map(t => t.toLowerCase()));
  
  // Find topics not yet studied
  const unstudied = POPULAR_TOPICS.filter(t => !studied.has(t.name.toLowerCase()));
  
  if (unstudied.length > 0) {
    // Prioritize based on category progression
    const categoryOrder = ['languages', 'web', 'frameworks', 'runtime', 'databases', 'tools', 'concepts', 'cs-fundamentals', 'devops'];
    
    for (const category of categoryOrder) {
      const inCategory = unstudied.filter(t => t.category === category);
      if (inCategory.length > 0) {
        return inCategory[0];
      }
    }
    
    return unstudied[0];
  }
  
  // If all studied, recommend deepening knowledge
  return POPULAR_TOPICS[Math.floor(Math.random() * POPULAR_TOPICS.length)];
}
