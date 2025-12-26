import OpenAI from 'openai';

// Initialize OpenAI client
const openai = process.env.OPENAI_API_KEY 
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

if (!openai) {
  console.warn('⚠️ OpenAI API key not found. AI features will use fallback data.');
}

/**
 * Core AI generation function with retry logic
 */
export async function generateWithAI(systemPrompt, userPrompt, options = {}) {
  const { 
    maxTokens = 2000, 
    temperature = 0.7,
    model = 'gpt-3.5-turbo',
    jsonMode = false 
  } = options;

  if (!openai) {
    console.log('No OpenAI client available');
    return null;
  }

  try {
    const response = await openai.chat.completions.create({
      model: model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      max_tokens: maxTokens,
      temperature: temperature,
      ...(jsonMode && { response_format: { type: 'json_object' } })
    });

    return response.choices[0]?.message?.content || null;
  } catch (error) {
    console.error('OpenAI API error:', error.message);
    
    // Retry with fallback model if rate limited
    if (error.status === 429 && model !== 'gpt-3.5-turbo') {
      console.log('Retrying with gpt-3.5-turbo...');
      return generateWithAI(systemPrompt, userPrompt, { ...options, model: 'gpt-3.5-turbo' });
    }
    
    return null;
  }
}

/**
 * Parse JSON from AI response safely
 */
function parseAIJson(response) {
  if (!response) return null;
  
  try {
    // Try direct parse first
    return JSON.parse(response);
  } catch {
    // Extract JSON from markdown code blocks
    const jsonMatch = response.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[1].trim());
      } catch {
        // Continue to next method
      }
    }
    
    // Try to find JSON object in response
    const objectMatch = response.match(/\{[\s\S]*\}/);
    if (objectMatch) {
      try {
        return JSON.parse(objectMatch[0]);
      } catch {
        // Continue
      }
    }
    
    console.error('Failed to parse AI JSON response');
    return null;
  }
}

// ============================================================
// LESSON GENERATION
// ============================================================

export async function generateLesson(topic, difficulty = 'beginner', userContext = {}) {
  const systemPrompt = `You are MentorAI, an expert programming tutor. Create engaging, practical lessons.

Your teaching style:
- Use simple analogies and real-world examples
- Include practical code examples that students can try
- Break complex concepts into digestible chunks
- Be encouraging and supportive
- Adapt to the difficulty level

Difficulty levels:
- beginner: Assume no prior knowledge, explain everything
- intermediate: Assume basic understanding, go deeper
- advanced: Assume strong foundation, cover edge cases and optimizations`;

  const userPrompt = `Create a ${difficulty} level lesson about "${topic}".

${userContext.previousTopics ? 'Student has learned: ' + userContext.previousTopics.join(', ') : ''}
${userContext.struggles ? 'Student struggles with: ' + userContext.struggles : ''}

Return ONLY valid JSON:
{
  "title": "Engaging lesson title",
  "introduction": "Hook the student with why this matters (2-3 sentences)",
  "content": "Main lesson content with clear explanations (3-4 paragraphs, ~500 words)",
  "keyPoints": ["Key point 1", "Key point 2", "Key point 3", "Key point 4"],
  "codeExample": {
    "language": "javascript",
    "code": "// Practical code example\\nconsole.log('Hello');",
    "explanation": "What this code does and why"
  },
  "practiceChallenge": {
    "task": "A mini challenge for the student",
    "hint": "A helpful hint"
  },
  "nextSteps": "What to learn next and why",
  "funFact": "An interesting fact about this topic"
}`;

  const response = await generateWithAI(systemPrompt, userPrompt, { 
    maxTokens: 2000, 
    temperature: 0.7,
    jsonMode: true 
  });

  const parsed = parseAIJson(response);
  
  if (parsed) {
    return parsed;
  }

  // Fallback lesson
  return {
    title: `Introduction to ${topic}`,
    introduction: `Let's explore ${topic} together! This is a fundamental concept in programming.`,
    content: `${topic} is an important topic in software development. Understanding it will help you become a better programmer. Practice regularly and don't be afraid to experiment!`,
    keyPoints: [
      `${topic} is essential for modern development`,
      'Practice makes perfect',
      'Start with basics, then advance',
      'Build projects to solidify learning'
    ],
    codeExample: {
      language: 'javascript',
      code: '// Start your ' + topic + ' journey here\nconsole.log("Learning ' + topic + '!");',
      explanation: 'A simple starting point for your learning'
    },
    practiceChallenge: {
      task: 'Research 3 real-world uses of ' + topic,
      hint: 'Look at popular open source projects'
    },
    nextSteps: 'Continue exploring advanced ' + topic + ' concepts',
    funFact: topic + ' is used by millions of developers worldwide!'
  };
}

// ============================================================
// QUIZ GENERATION
// ============================================================

export async function generateQuiz(topic, numQuestions = 5, difficulty = 'medium', userContext = {}) {
  const systemPrompt = `You are MentorAI Quiz Master. Create educational, fair, and engaging quiz questions.

Guidelines:
- Questions should test understanding, not just memorization
- All options should be plausible (no obviously wrong answers)
- Include practical/applied questions, not just theory
- Explanations should teach, not just state the answer
- Match the difficulty level appropriately

Difficulty:
- easy: Basic concepts, straightforward questions
- medium: Applied knowledge, some tricky options
- hard: Edge cases, deep understanding required`;

  const userPrompt = `Create a ${difficulty} quiz about "${topic}" with exactly ${numQuestions} questions.

${userContext.weakAreas ? 'Focus on areas student struggles with: ' + userContext.weakAreas.join(', ') : ''}
${userContext.recentlyLearned ? 'Recently learned: ' + userContext.recentlyLearned : ''}

Return ONLY valid JSON:
{
  "quizTitle": "Engaging quiz title",
  "topic": "${topic}",
  "difficulty": "${difficulty}",
  "questions": [
    {
      "id": 1,
      "question": "Clear, specific question?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctIndex": 0,
      "explanation": "Why this is correct and why others are wrong",
      "conceptTested": "What concept this tests",
      "difficulty": "easy|medium|hard"
    }
  ],
  "passingScore": 60,
  "encouragement": "Motivational message for completing the quiz"
}`;

  const response = await generateWithAI(systemPrompt, userPrompt, { 
    maxTokens: 2500, 
    temperature: 0.8,
    jsonMode: true 
  });

  const parsed = parseAIJson(response);
  
  if (parsed && parsed.questions && parsed.questions.length > 0) {
    // Validate and fix questions
    parsed.questions = parsed.questions.map((q, i) => ({
      id: q.id || i + 1,
      question: q.question || 'Question ' + (i + 1),
      options: Array.isArray(q.options) && q.options.length === 4 
        ? q.options 
        : ['Option A', 'Option B', 'Option C', 'Option D'],
      correctIndex: typeof q.correctIndex === 'number' && q.correctIndex >= 0 && q.correctIndex <= 3 
        ? q.correctIndex 
        : 0,
      explanation: q.explanation || 'This is the correct answer.',
      conceptTested: q.conceptTested || topic,
      difficulty: q.difficulty || difficulty
    }));
    
    return parsed;
  }

  // Fallback quiz
  return generateFallbackQuiz(topic, numQuestions, difficulty);
}

function generateFallbackQuiz(topic, numQuestions, difficulty) {
  const fallbackQuestions = {
    javascript: [
      { question: 'What keyword declares a block-scoped variable in JavaScript?', options: ['var', 'let', 'const', 'Both let and const'], correctIndex: 3, explanation: 'Both let and const declare block-scoped variables. let allows reassignment, const does not.' },
      { question: 'Which method adds an element to the end of an array?', options: ['unshift()', 'push()', 'pop()', 'shift()'], correctIndex: 1, explanation: 'push() adds to the end, unshift() adds to the beginning, pop() removes from end, shift() removes from beginning.' },
      { question: 'What is the result of typeof null?', options: ['"null"', '"undefined"', '"object"', '"boolean"'], correctIndex: 2, explanation: 'This is a famous JavaScript quirk. typeof null returns "object" due to a legacy bug.' },
      { question: 'Which operator checks both value and type equality?', options: ['==', '===', '!=', '='], correctIndex: 1, explanation: '=== is the strict equality operator that checks both value and type without type coercion.' },
      { question: 'What does async/await help with?', options: ['Styling', 'Asynchronous code', 'Variable declaration', 'Loops'], correctIndex: 1, explanation: 'async/await provides a cleaner syntax for working with Promises and asynchronous operations.' }
    ],
    python: [
      { question: 'How do you create a list in Python?', options: ['list = {}', 'list = []', 'list = ()', 'list = <>'], correctIndex: 1, explanation: 'Square brackets [] create a list. {} creates a dict, () creates a tuple.' },
      { question: 'What is the correct way to define a function?', options: ['function myFunc():', 'def myFunc():', 'func myFunc():', 'define myFunc():'], correctIndex: 1, explanation: 'Python uses the def keyword to define functions.' },
      { question: 'Which method adds an item to a list?', options: ['add()', 'append()', 'push()', 'insert()'], correctIndex: 1, explanation: 'append() adds to the end. insert() adds at a specific index. Python lists do not have add() or push().' },
      { question: 'What is a dictionary in Python?', options: ['An ordered list', 'Key-value pairs', 'A function', 'A loop type'], correctIndex: 1, explanation: 'Dictionaries store data as key-value pairs, created with curly braces {}.' },
      { question: 'How do you write a comment in Python?', options: ['// comment', '/* comment */', '# comment', '-- comment'], correctIndex: 2, explanation: 'Python uses # for single-line comments.' }
    ],
    default: [
      { question: 'What does API stand for?', options: ['Application Programming Interface', 'Advanced Program Integration', 'Automated Protocol Interface', 'Application Process Integration'], correctIndex: 0, explanation: 'API stands for Application Programming Interface, allowing different software to communicate.' },
      { question: 'What is version control used for?', options: ['Controlling versions of hardware', 'Tracking code changes', 'Managing user accounts', 'Optimizing performance'], correctIndex: 1, explanation: 'Version control systems like Git track changes in code over time and enable collaboration.' },
      { question: 'What is debugging?', options: ['Adding new features', 'Finding and fixing errors', 'Writing documentation', 'Deploying code'], correctIndex: 1, explanation: 'Debugging is the process of identifying, analyzing, and removing bugs from code.' },
      { question: 'What is an algorithm?', options: ['A programming language', 'A step-by-step procedure', 'A type of database', 'A web framework'], correctIndex: 1, explanation: 'An algorithm is a step-by-step procedure or formula for solving a problem.' },
      { question: 'What does HTML stand for?', options: ['Hyper Text Markup Language', 'High Tech Modern Language', 'Home Tool Markup Language', 'Hyperlink Text Management Language'], correctIndex: 0, explanation: 'HTML stands for HyperText Markup Language, the standard language for web pages.' }
    ]
  };

  const topicLower = topic.toLowerCase();
  let questions = fallbackQuestions.default;
  
  if (topicLower.includes('javascript') || topicLower.includes('js')) {
    questions = fallbackQuestions.javascript;
  } else if (topicLower.includes('python')) {
    questions = fallbackQuestions.python;
  }

  const selectedQuestions = questions
    .sort(() => Math.random() - 0.5)
    .slice(0, numQuestions)
    .map((q, i) => ({ ...q, id: i + 1, conceptTested: topic, difficulty: difficulty }));

  return {
    quizTitle: topic + ' Quiz',
    topic: topic,
    difficulty: difficulty,
    questions: selectedQuestions,
    passingScore: 60,
    encouragement: 'Great job completing the quiz! Keep learning and growing!'
  };
}

// ============================================================
// AI MENTOR FEATURES
// ============================================================

export async function getStudyAdvice(userStats) {
  const systemPrompt = `You are MentorAI, a supportive and encouraging learning coach. Provide personalized study advice based on student progress.`;

  const userPrompt = `Based on this student's progress, provide personalized study advice:

Stats:
- Level: ${userStats.level || 1}
- XP: ${userStats.xp || 0}
- Streak: ${userStats.streak || 0} days
- Quizzes taken: ${userStats.quizzesTaken || 0}
- Accuracy: ${userStats.accuracy || 0}%
- Topics studied: ${userStats.topicsStudied?.join(', ') || 'None yet'}
- Recent struggles: ${userStats.weakAreas?.join(', ') || 'Unknown'}

Return ONLY valid JSON:
{
  "greeting": "Personalized greeting",
  "overallAssessment": "Brief assessment of their progress",
  "strengths": ["Strength 1", "Strength 2"],
  "areasToImprove": ["Area 1", "Area 2"],
  "dailyGoal": "A specific goal for today",
  "recommendedTopic": "Best topic to study next",
  "motivationalMessage": "Encouraging message",
  "studyTip": "A practical study tip"
}`;

  const response = await generateWithAI(systemPrompt, userPrompt, {
    maxTokens: 800,
    temperature: 0.8,
    jsonMode: true
  });

  return parseAIJson(response) || {
    greeting: 'Welcome back, learner!',
    overallAssessment: 'You are making great progress!',
    strengths: ['Consistency', 'Curiosity'],
    areasToImprove: ['Practice more frequently'],
    dailyGoal: 'Complete one lesson and one quiz today',
    recommendedTopic: 'JavaScript',
    motivationalMessage: 'Every expert was once a beginner. Keep going!',
    studyTip: 'Try teaching what you learn to solidify your understanding.'
  };
}

export async function explainConcept(concept, context = '') {
  const systemPrompt = `You are MentorAI, an expert at explaining complex programming concepts simply. Use analogies, examples, and clear language.`;

  const userPrompt = `Explain "${concept}" in a clear, beginner-friendly way.
${context ? 'Context: ' + context : ''}

Return ONLY valid JSON:
{
  "concept": "${concept}",
  "simpleExplanation": "ELI5 explanation (2-3 sentences)",
  "technicalExplanation": "More detailed technical explanation",
  "analogy": "A real-world analogy to help understand",
  "codeExample": "// Simple code example",
  "commonMistakes": ["Mistake 1", "Mistake 2"],
  "relatedConcepts": ["Related 1", "Related 2"]
}`;

  const response = await generateWithAI(systemPrompt, userPrompt, {
    maxTokens: 1000,
    temperature: 0.7,
    jsonMode: true
  });

  return parseAIJson(response) || {
    concept: concept,
    simpleExplanation: concept + ' is a fundamental programming concept.',
    technicalExplanation: 'This concept is important for building software applications.',
    analogy: 'Think of it like building blocks for your code.',
    codeExample: '// Example of ' + concept,
    commonMistakes: ['Not practicing enough', 'Skipping fundamentals'],
    relatedConcepts: ['Programming basics', 'Software development']
  };
}

export async function generateChallenge(topic, difficulty = 'medium') {
  const systemPrompt = `You are MentorAI Challenge Creator. Create engaging coding challenges that test practical skills.`;

  const userPrompt = `Create a ${difficulty} coding challenge about "${topic}".

Return ONLY valid JSON:
{
  "title": "Challenge title",
  "description": "What the student needs to accomplish",
  "requirements": ["Requirement 1", "Requirement 2", "Requirement 3"],
  "starterCode": "// Starter code template",
  "hints": ["Hint 1", "Hint 2"],
  "solutionApproach": "How to approach this problem",
  "xpReward": 50,
  "estimatedTime": "15 minutes"
}`;

  const response = await generateWithAI(systemPrompt, userPrompt, {
    maxTokens: 800,
    temperature: 0.8,
    jsonMode: true
  });

  return parseAIJson(response) || {
    title: topic + ' Challenge',
    description: 'Apply your ' + topic + ' knowledge!',
    requirements: ['Complete the task', 'Test your code', 'Optimize if possible'],
    starterCode: '// Your code here',
    hints: ['Start simple', 'Break it into steps'],
    solutionApproach: 'Think about the problem step by step',
    xpReward: 50,
    estimatedTime: '15 minutes'
  };
}

export async function getDailyTip() {
  const systemPrompt = `You are MentorAI. Provide a helpful, actionable programming tip of the day.`;

  const topics = ['debugging', 'code quality', 'learning strategies', 'productivity', 'best practices', 'career advice'];
  const randomTopic = topics[Math.floor(Math.random() * topics.length)];

  const userPrompt = `Give a practical programming tip about "${randomTopic}".

Return ONLY valid JSON:
{
  "category": "${randomTopic}",
  "tip": "The actual tip (2-3 sentences)",
  "example": "A quick example or application",
  "actionItem": "Something the student can do today"
}`;

  const response = await generateWithAI(systemPrompt, userPrompt, {
    maxTokens: 400,
    temperature: 0.9,
    jsonMode: true
  });

  return parseAIJson(response) || {
    category: 'learning',
    tip: 'Consistency beats intensity. 30 minutes daily is better than 5 hours once a week.',
    example: 'Set a daily reminder to code for at least 30 minutes.',
    actionItem: 'Code for 30 minutes today, no matter how small the task.'
  };
}

export async function generateMotivation(userStats) {
  const systemPrompt = `You are MentorAI, an encouraging and supportive mentor. Generate personalized motivation.`;

  const streakDays = userStats.streak || 0;
  const level = userStats.level || 1;

  const userPrompt = `Create a motivational message for a student:
- Streak: ${streakDays} days
- Level: ${level}
- Recent activity: ${userStats.recentActivity || 'Just started'}

Return ONLY valid JSON:
{
  "message": "Personalized motivational message",
  "celebration": "What to celebrate about their progress",
  "nextMilestone": "Their next achievable goal",
  "quote": "An inspiring programming quote"
}`;

  const response = await generateWithAI(systemPrompt, userPrompt, {
    maxTokens: 400,
    temperature: 0.9,
    jsonMode: true
  });

  return parseAIJson(response) || {
    message: 'You are doing amazing! Every line of code is progress.',
    celebration: 'You showed up today - that is what matters!',
    nextMilestone: 'Complete your next lesson to keep the momentum!',
    quote: '"First, solve the problem. Then, write the code." - John Johnson'
  };
}

// ============================================================
// LEARNING PATH GENERATION
// ============================================================

export async function generateLearningPath(goal, currentLevel = 'beginner') {
  const systemPrompt = `You are MentorAI Learning Path Architect. Create structured, achievable learning paths.`;

  const userPrompt = `Create a learning path for someone who wants to learn "${goal}" starting from ${currentLevel} level.

Return ONLY valid JSON:
{
  "pathTitle": "Path name",
  "description": "What they will achieve",
  "estimatedDuration": "4-6 weeks",
  "modules": [
    {
      "week": 1,
      "title": "Module title",
      "topics": ["Topic 1", "Topic 2"],
      "project": "Mini project to build",
      "milestone": "What they can do after this"
    }
  ],
  "finalProject": "Capstone project idea",
  "careerRelevance": "How this helps their career"
}`;

  const response = await generateWithAI(systemPrompt, userPrompt, {
    maxTokens: 1500,
    temperature: 0.7,
    jsonMode: true
  });

  return parseAIJson(response) || {
    pathTitle: goal + ' Learning Path',
    description: 'Master ' + goal + ' from scratch',
    estimatedDuration: '4-6 weeks',
    modules: [
      { week: 1, title: 'Fundamentals', topics: ['Basics', 'Core concepts'], project: 'Hello World', milestone: 'Understand basics' },
      { week: 2, title: 'Intermediate', topics: ['Advanced topics'], project: 'Mini app', milestone: 'Build simple apps' }
    ],
    finalProject: 'Build a complete ' + goal + ' application',
    careerRelevance: 'This skill is in high demand in the tech industry.'
  };
}
