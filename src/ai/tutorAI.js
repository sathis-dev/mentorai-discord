import { generateAIResponse } from './index.js';
import { curriculumIndexer } from '../core/curriculumIndexer.js';

/**
 * Build personalized system prompt based on user data
 * This creates a "Mentor Personality" that adapts to the user
 */
function buildPersonalizedPrompt(userContext) {
  const { userName, level, streak, prestige, accuracy, weakTopics, strongTopics } = userContext;
  
  // Determine teaching approach based on level
  let teachingApproach = '';
  if (level < 5) {
    teachingApproach = 'Focus on fundamentals with simple explanations. Use lots of analogies and real-world examples.';
  } else if (level < 15) {
    teachingApproach = 'Balance theory with practical examples. Encourage independent problem-solving with guided hints.';
  } else {
    teachingApproach = 'Discuss advanced concepts and best practices. Challenge with complex scenarios and edge cases.';
  }

  // Build weak spot awareness
  let weakSpotContext = '';
  if (weakTopics && weakTopics.length > 0) {
    weakSpotContext = `\nKNOWN WEAK SPOTS: ${weakTopics.join(', ')} - Be extra patient and thorough when these come up.`;
  }

  // Build strength awareness  
  let strengthContext = '';
  if (strongTopics && strongTopics.length > 0) {
    strengthContext = `\nSTRENGTHS: ${strongTopics.join(', ')} - Reference these as analogies when explaining new concepts.`;
  }

  // Streak-based encouragement
  let streakContext = '';
  if (streak >= 30) {
    streakContext = `\n${userName}'s ${streak}-day streak is legendary! Acknowledge this dedication occasionally.`;
  } else if (streak >= 7) {
    streakContext = `\n${userName} has a solid ${streak}-day streak. Mention it encouragingly when relevant.`;
  }

  // Prestige awareness
  let prestigeContext = '';
  if (prestige > 0) {
    prestigeContext = `\n${userName} is Prestige ${prestige} - an experienced learner who appreciates depth.`;
  }

  return `You are MentorAI, a friendly and knowledgeable coding tutor. You have perfect memory of our conversation.

STUDENT PROFILE:
- Name: ${userName}
- Level: ${level || 1} ${prestige > 0 ? `(Prestige ${prestige})` : ''}
- Streak: ${streak || 0} days
- Overall Accuracy: ${accuracy || 0}%${weakSpotContext}${strengthContext}${streakContext}${prestigeContext}

PERSONALITY:
- Address ${userName} by name occasionally to feel personal
- Encouraging and supportive, celebrating their ${level >= 10 ? 'impressive progress' : 'growth'}
- Patient with beginners, challenging with advanced learners
- Uses analogies and real-world examples
- Identifies learning patterns

TEACHING APPROACH FOR THIS LEARNER:
${teachingApproach}

TEACHING STYLE:
- Start with simple explanations, add complexity as needed
- Use code examples frequently
- Ask guiding questions to check understanding
- Suggest practice exercises
- Connect concepts to previously discussed topics

CONTEXT AWARENESS:
- Reference previous questions when relevant
- Build on established knowledge
- Notice patterns in what the user struggles with
- Adapt difficulty based on responses

RESPONSE FORMAT:
- Keep responses focused and concise (under 1500 characters ideally)
- Use markdown formatting for code
- Break complex topics into steps
- End with a question or suggestion when appropriate`;
}

export async function generateTutorResponse({ question, history, topic, goals, weaknesses, userName, userLevel, userStreak, userPrestige, userAccuracy, weakTopics, strongTopics }) {
  const userContext = {
    userName: userName || 'learner',
    level: userLevel || 1,
    streak: userStreak || 0,
    prestige: userPrestige || 0,
    accuracy: userAccuracy || 0,
    weakTopics: weakTopics || weaknesses || [],
    strongTopics: strongTopics || []
  };

  const personalizedPrompt = buildPersonalizedPrompt(userContext);
  
  // ═══════════════════════════════════════════════════════════════════
  // 🧠 RAG: Get curriculum context for grounded responses
  // ═══════════════════════════════════════════════════════════════════
  const ragContext = curriculumIndexer.getRAGContext(question);
  const curriculumReference = ragContext.hasRelevantContent 
    ? `\n\nCURRICULUM GROUNDING (Reference these lessons in your response):
${ragContext.context.map(c => `- [${c.lessonId}] ${c.title}: ${c.description}`).join('\n')}

IMPORTANT: When explaining concepts, prefix with "According to the MentorAI Curriculum..." and cite lesson IDs like [${ragContext.context[0]?.lessonId || 'js-1'}].`
    : '';
  
  const systemMessage = `${personalizedPrompt}

CURRENT SESSION:
- Topic Focus: ${topic || 'General programming'}
- Learning Goals: ${goals?.join(', ') || 'Not set'}
- Areas to Improve: ${weaknesses?.join(', ') || 'None identified yet'}${curriculumReference}`;

  const messages = [
    { role: 'system', content: systemMessage },
    ...history,
    { role: 'user', content: question }
  ];

  try {
    const content = await generateAIResponse(messages, {
      maxTokens: 1500,
      temperature: 0.7
    });
    
    // Detect if user might be struggling with something
    const detectedWeakness = detectWeakness(question, content);

    return {
      content,
      detectedWeakness,
      curriculumCitations: ragContext.citations,
      lessonsReferenced: ragContext.context.map(c => c.lessonId)
    };

  } catch (error) {
    console.error('Tutor AI error:', error);
    throw error;
  }
}

function detectWeakness(question, response) {
  const weaknessPatterns = [
    { pattern: /what is|what's|what are/i, topic: 'Basic concepts' },
    { pattern: /don't understand|confused|not sure/i, topic: 'Fundamental understanding' },
    { pattern: /error|bug|not working|broken/i, topic: 'Debugging' },
    { pattern: /syntax|how to write/i, topic: 'Syntax' },
    { pattern: /loop|for|while|iterate/i, topic: 'Loops' },
    { pattern: /function|method|def|return/i, topic: 'Functions' },
    { pattern: /class|object|oop|inherit/i, topic: 'Object-Oriented Programming' },
    { pattern: /array|list|dict|hash/i, topic: 'Data Structures' },
    { pattern: /async|await|promise|callback/i, topic: 'Asynchronous Programming' }
  ];

  for (const { pattern, topic } of weaknessPatterns) {
    if (pattern.test(question)) {
      return topic;
    }
  }

  return null;
}

export async function generateConversationSummary(messages) {
  const conversationText = messages.map(m => 
    `${m.role}: ${m.content}`
  ).join('\n');

  const summaryMessages = [
    {
      role: 'system',
      content: 'Summarize this tutoring conversation in 2-3 sentences, highlighting key topics discussed and any areas the student struggled with.'
    },
    {
      role: 'user',
      content: conversationText
    }
  ];

  return await generateAIResponse(summaryMessages, { maxTokens: 200 });
}

export async function generateInterviewQuestion({ category, difficulty, company }) {
  const difficultyContext = {
    entry: 'entry-level/junior developer with 0-2 years experience',
    mid: 'mid-level developer with 2-5 years experience',
    senior: 'senior developer with 5+ years experience'
  };

  const companyStyle = company ? `in the style of ${company} interviews` : '';

  const prompt = `Generate a technical interview question for a ${difficultyContext[difficulty]} ${companyStyle}.

Category: ${category}

Return a JSON object with:
{
  "question": "The interview question",
  "tips": ["3-4 tips for answering well"],
  "suggestedTime": "e.g., '5-10 minutes'",
  "keyPoints": number of key points expected in answer,
  "modelAnswer": "A comprehensive model answer",
  "followUps": ["2-3 potential follow-up questions"],
  "commonMistakes": ["2-3 common mistakes to avoid"]
}`;

  const messages = [
    { role: 'system', content: 'You are an expert technical interviewer at top tech companies. Return only valid JSON.' },
    { role: 'user', content: prompt }
  ];

  const response = await generateAIResponse(messages, { maxTokens: 1500 });
  
  try {
    return JSON.parse(response);
  } catch {
    return {
      question: response,
      tips: ['Take your time to think', 'Ask clarifying questions', 'Explain your thought process'],
      suggestedTime: '5-10 minutes',
      keyPoints: 3,
      modelAnswer: 'See the question for guidance.',
      followUps: [],
      commonMistakes: []
    };
  }
}

export async function evaluateAnswer({ question, answer, category, difficulty }) {
  const prompt = `Evaluate this interview answer:

Question: ${question}
Category: ${category}
Difficulty: ${difficulty}
Candidate's Answer: ${answer}

Provide a JSON response with:
{
  "score": 1-10,
  "strengths": ["what they did well"],
  "improvements": ["what could be better"],
  "missingPoints": ["key points they missed"],
  "feedback": "overall constructive feedback",
  "followUpQuestion": "a good follow-up based on their answer"
}`;

  const messages = [
    { role: 'system', content: 'You are an experienced technical interviewer providing constructive feedback. Return only valid JSON.' },
    { role: 'user', content: prompt }
  ];

  const response = await generateAIResponse(messages, { maxTokens: 800 });
  
  try {
    return JSON.parse(response);
  } catch {
    return {
      score: 5,
      strengths: ['Good attempt'],
      improvements: ['Could provide more detail'],
      missingPoints: [],
      feedback: response,
      followUpQuestion: 'Can you elaborate on that?'
    };
  }
}

export async function generateFlashcards(topic, count) {
  const prompt = `Generate ${count} flashcards for learning ${topic}.

Return a JSON array of flashcards:
[
  {
    "front": "Question or concept",
    "back": "Answer or explanation",
    "tags": ["relevant", "tags"]
  }
]

Make cards progressively harder. Include a mix of:
- Definitions
- Code examples
- Practical applications
- Common pitfalls`;

  const messages = [
    { role: 'system', content: 'You are an expert educator creating effective flashcards. Return only valid JSON array.' },
    { role: 'user', content: prompt }
  ];

  const response = await generateAIResponse(messages, { maxTokens: 2000 });
  
  try {
    return JSON.parse(response);
  } catch {
    // Return basic cards if parsing fails
    return [{
      front: `What is ${topic}?`,
      back: `${topic} is a programming concept. Use /learn ${topic} to learn more!`,
      tags: [topic.toLowerCase()]
    }];
  }
}

export async function generateDailyChallenge(topic, difficulty) {
  const prompt = `Generate a coding challenge for ${topic} at ${difficulty} difficulty.

Return a JSON object:
{
  "title": "Challenge title",
  "description": "Problem description",
  "examples": [
    { "input": "example input", "output": "expected output", "explanation": "why" }
  ],
  "constraints": ["constraint 1", "constraint 2"],
  "hints": ["hint 1", "hint 2", "hint 3"],
  "starterCode": {
    "python": "def solution():\\n    pass",
    "javascript": "function solution() {\\n    \\n}"
  },
  "testCases": [
    { "input": "test input", "expectedOutput": "expected", "isHidden": false }
  ],
  "solution": {
    "python": "working python solution",
    "javascript": "working javascript solution"
  },
  "solutionExplanation": "Explanation of the approach",
  "tags": ["arrays", "algorithms"]
}`;

  const messages = [
    { role: 'system', content: 'You are a coding challenge creator like LeetCode. Return only valid JSON.' },
    { role: 'user', content: prompt }
  ];

  const response = await generateAIResponse(messages, { maxTokens: 2000 });
  
  try {
    return JSON.parse(response);
  } catch {
    return {
      title: `${topic} Challenge`,
      description: `Solve a ${difficulty} ${topic} problem.`,
      examples: [{ input: 'sample', output: 'result', explanation: 'Basic example' }],
      constraints: ['Time limit: O(n)'],
      hints: ['Think step by step', 'Consider edge cases'],
      starterCode: { python: 'def solution():\n    pass', javascript: 'function solution() {\n}' },
      testCases: [{ input: 'test', expectedOutput: 'result', isHidden: false }],
      solution: { python: '# Solution', javascript: '// Solution' },
      solutionExplanation: 'Standard approach.',
      tags: [topic.toLowerCase()]
    };
  }
}
