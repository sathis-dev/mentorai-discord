/**
 * Question Bank - AI + Curated Questions
 * 
 * Features:
 * - AI question generation with fallback
 * - Curated question loading from JSON files
 * - Question caching
 * - Topic-based filtering
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class QuestionBank {
  constructor() {
    this.curatedQuestions = new Map();
    this.questionCache = new Map();
    this.cacheExpiry = 30 * 60 * 1000; // 30 minutes
    this.loadCuratedQuestions();
  }

  /**
   * Load curated questions from JSON files
   */
  async loadCuratedQuestions() {
    try {
      const questionsPath = path.join(__dirname, '..', '..', 'data', 'quizzes');
      const files = await fs.readdir(questionsPath);
      
      for (const file of files) {
        if (file.endsWith('.json')) {
          const topic = file.replace('.json', '').toLowerCase();
          const filePath = path.join(questionsPath, file);
          const content = await fs.readFile(filePath, 'utf8');
          const data = JSON.parse(content);
          
          // Handle both array format and object format with questions property
          const questions = Array.isArray(data) ? data : (data.questions || []);
          this.curatedQuestions.set(topic, questions);
        }
      }
      console.log(`✅ Loaded curated questions for ${this.curatedQuestions.size} topics`);
    } catch (error) {
      console.log('⚠️ No curated questions found, using AI only:', error.message);
    }
  }

  /**
   * Generate questions (AI with fallback to curated)
   * @param {string} topic - Quiz topic
   * @param {string} difficulty - easy/medium/hard
   * @param {number} count - Number of questions
   * @returns {Promise<Array>} Questions array
   */
  async generateQuestions(topic, difficulty, count) {
    // Check cache first
    const cacheKey = `${topic.toLowerCase()}_${difficulty}_${count}`;
    const cached = this.questionCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
      // Return shuffled copy of cached questions
      return this.shuffleQuestions([...cached.questions]);
    }

    try {
      // Try AI generation first
      const questions = await this.generateAIQuestions(topic, difficulty, count);
      
      // Cache the questions
      this.questionCache.set(cacheKey, {
        questions,
        timestamp: Date.now()
      });
      
      return questions;
    } catch (error) {
      console.log('AI generation failed, using fallback:', error.message);
      return this.getFallbackQuestions(topic, difficulty, count);
    }
  }

  /**
   * Generate questions using AI
   */
  async generateAIQuestions(topic, difficulty, count) {
    // Dynamic import to avoid circular dependencies
    const { generateQuiz } = await import('../../ai/index.js');
    
    const result = await generateQuiz(topic, count, difficulty);
    
    if (!result || !result.questions || result.questions.length === 0) {
      throw new Error('AI returned no questions');
    }

    return result.questions.map((q, index) => ({
      id: `ai_${Date.now()}_${index}`,
      question: q.question,
      options: q.options || [],
      correctIndex: typeof q.correctIndex === 'number' ? q.correctIndex : 0,
      explanation: q.explanation || 'No explanation available.',
      concept: q.conceptTested || q.concept || topic,
      hint: q.hint || `Think about ${topic} fundamentals.`,
      difficulty: q.difficulty || difficulty,
      topic: topic.toLowerCase()
    }));
  }

  /**
   * Get fallback questions from curated database
   */
  getFallbackQuestions(topic, difficulty, count) {
    const lowerTopic = topic.toLowerCase();
    
    // Try to find questions for this specific topic
    let questions = this.curatedQuestions.get(lowerTopic);
    
    // If not found, try partial match
    if (!questions) {
      for (const [key, qs] of this.curatedQuestions.entries()) {
        if (lowerTopic.includes(key) || key.includes(lowerTopic)) {
          questions = qs;
          break;
        }
      }
    }
    
    // Fall back to default questions
    if (!questions || questions.length === 0) {
      questions = this.getDefaultQuestions();
    }

    // Filter by difficulty if available
    let filtered = questions;
    if (questions[0]?.difficulty) {
      const difficultyFiltered = questions.filter(q => q.difficulty === difficulty);
      if (difficultyFiltered.length >= count) {
        filtered = difficultyFiltered;
      }
    }

    // Shuffle and select
    const shuffled = this.shuffleQuestions([...filtered]);
    const selected = shuffled.slice(0, Math.min(count, shuffled.length));

    return selected.map((q, index) => ({
      id: `fallback_${Date.now()}_${index}`,
      question: q.question,
      options: q.options || [],
      correctIndex: typeof q.correctIndex === 'number' ? q.correctIndex : 0,
      explanation: q.explanation || 'No explanation available.',
      concept: q.concept || q.conceptTested || topic,
      hint: q.hint || 'Think carefully about the question.',
      difficulty: q.difficulty || difficulty,
      topic: topic.toLowerCase()
    }));
  }

  /**
   * Default questions when no curated questions available
   */
  getDefaultQuestions() {
    return [
      {
        question: "What does HTML stand for?",
        options: [
          "Hyper Text Markup Language",
          "High Tech Modern Language",
          "Hyper Transfer Markup Language",
          "Home Tool Markup Language"
        ],
        correctIndex: 0,
        explanation: "HTML stands for Hyper Text Markup Language, which is the standard markup language for creating web pages.",
        concept: "HTML Basics",
        hint: "Think about what web pages are made of",
        difficulty: "easy"
      },
      {
        question: "Which keyword is used to declare a variable in JavaScript?",
        options: ["var", "variable", "v", "declare"],
        correctIndex: 0,
        explanation: "In JavaScript, 'var', 'let', and 'const' are used to declare variables. 'var' was the original keyword.",
        concept: "JavaScript Variables",
        hint: "It's a 3-letter keyword",
        difficulty: "easy"
      },
      {
        question: "What is the time complexity of binary search?",
        options: ["O(log n)", "O(n)", "O(n²)", "O(1)"],
        correctIndex: 0,
        explanation: "Binary search has O(log n) time complexity because it divides the search space in half each iteration.",
        concept: "Algorithms - Searching",
        hint: "It divides the search space in half each time",
        difficulty: "medium"
      },
      {
        question: "What does CSS stand for?",
        options: [
          "Cascading Style Sheets",
          "Computer Style Sheets",
          "Creative Style System",
          "Colorful Style Sheets"
        ],
        correctIndex: 0,
        explanation: "CSS stands for Cascading Style Sheets, used to style HTML elements.",
        concept: "CSS Basics",
        hint: "It describes how styles 'cascade' through elements",
        difficulty: "easy"
      },
      {
        question: "Which data structure uses LIFO (Last In, First Out)?",
        options: ["Stack", "Queue", "Array", "Linked List"],
        correctIndex: 0,
        explanation: "A Stack uses LIFO - the last element added is the first one removed.",
        concept: "Data Structures",
        hint: "Think of a stack of plates",
        difficulty: "medium"
      },
      {
        question: "What is the purpose of a constructor in OOP?",
        options: [
          "Initialize object properties",
          "Delete objects",
          "Print object details",
          "Clone objects"
        ],
        correctIndex: 0,
        explanation: "A constructor initializes object properties when an object is created.",
        concept: "Object-Oriented Programming",
        hint: "It 'constructs' the initial state",
        difficulty: "medium"
      },
      {
        question: "What does API stand for?",
        options: [
          "Application Programming Interface",
          "Advanced Programming Integration",
          "Automated Processing Input",
          "Application Process Interface"
        ],
        correctIndex: 0,
        explanation: "API stands for Application Programming Interface - a set of protocols for building software.",
        concept: "APIs",
        hint: "It's an 'interface' for programming",
        difficulty: "easy"
      },
      {
        question: "Which SQL command is used to retrieve data?",
        options: ["SELECT", "GET", "FETCH", "RETRIEVE"],
        correctIndex: 0,
        explanation: "SELECT is the SQL command used to retrieve data from a database.",
        concept: "SQL",
        hint: "You 'select' what data you want",
        difficulty: "easy"
      },
      {
        question: "What is recursion?",
        options: [
          "A function calling itself",
          "A loop that runs forever",
          "A type of variable",
          "A sorting algorithm"
        ],
        correctIndex: 0,
        explanation: "Recursion is when a function calls itself to solve a smaller instance of the same problem.",
        concept: "Recursion",
        hint: "It involves self-reference",
        difficulty: "medium"
      },
      {
        question: "What does REST stand for in RESTful APIs?",
        options: [
          "Representational State Transfer",
          "Remote State Transfer",
          "Real-time State Transfer",
          "Request State Transfer"
        ],
        correctIndex: 0,
        explanation: "REST stands for Representational State Transfer, an architectural style for web services.",
        concept: "REST APIs",
        hint: "It's about transferring state representations",
        difficulty: "medium"
      }
    ];
  }

  /**
   * Shuffle questions using Fisher-Yates algorithm
   */
  shuffleQuestions(questions) {
    for (let i = questions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [questions[i], questions[j]] = [questions[j], questions[i]];
    }
    return questions;
  }

  /**
   * Get available topics
   */
  getAvailableTopics() {
    return Array.from(this.curatedQuestions.keys());
  }

  /**
   * Get question count for a topic
   */
  getQuestionCount(topic) {
    const questions = this.curatedQuestions.get(topic.toLowerCase());
    return questions ? questions.length : 0;
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.questionCache.clear();
  }

  /**
   * Reload curated questions
   */
  async reload() {
    this.curatedQuestions.clear();
    this.questionCache.clear();
    await this.loadCuratedQuestions();
  }
}

// Export singleton instance
export const questionBank = new QuestionBank();
export default questionBank;
