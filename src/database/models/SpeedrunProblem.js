import mongoose from 'mongoose';

const speedrunProblemSchema = new mongoose.Schema({
  problemId: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  difficulty: { 
    type: String, 
    enum: ['easy', 'medium', 'hard'],
    default: 'easy'
  },
  languages: [String], // Supported languages
  timeLimit: { type: Number, default: 300 }, // 5 minutes in seconds
  xpReward: { type: Number, default: 100 },
  
  // Test cases
  testCases: [{
    input: String,
    expectedOutput: String,
    isHidden: { type: Boolean, default: false }
  }],
  
  // Starter code for each language
  starterCode: {
    type: Map,
    of: String,
    default: new Map()
  },
  
  // Function signature hints
  functionName: { type: String },
  parameters: [String],
  returnType: { type: String },
  
  // Leaderboard (top 10)
  leaderboard: [{
    odiscordId: String,
    username: String,
    time: Number, // milliseconds
    rank: String, // S, A, B, C, D, F
    submittedAt: Date
  }],
  
  // Stats
  totalAttempts: { type: Number, default: 0 },
  successRate: { type: Number, default: 0 },
  averageTime: { type: Number, default: 0 },
  
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

// Calculate rank based on time and correctness
speedrunProblemSchema.statics.calculateRank = function(timeMs, testsPassed, totalTests, difficulty) {
  const passRate = testsPassed / totalTests;
  
  // Must pass all tests for S or A rank
  if (passRate < 1) {
    if (passRate >= 0.8) return 'C';
    if (passRate >= 0.5) return 'D';
    return 'F';
  }
  
  // Time thresholds in milliseconds based on difficulty
  const thresholds = {
    easy: { S: 60000, A: 120000, B: 180000 },    // 1, 2, 3 min
    medium: { S: 120000, A: 180000, B: 240000 }, // 2, 3, 4 min
    hard: { S: 180000, A: 240000, B: 300000 }    // 3, 4, 5 min
  };
  
  const t = thresholds[difficulty] || thresholds.easy;
  
  if (timeMs <= t.S) return 'S';
  if (timeMs <= t.A) return 'A';
  if (timeMs <= t.B) return 'B';
  return 'C';
};

// Calculate XP reward based on rank
speedrunProblemSchema.statics.getXpReward = function(rank, baseXp) {
  const multipliers = { S: 3, A: 2, B: 1.5, C: 1, D: 0.5, F: 0.25 };
  return Math.round(baseXp * (multipliers[rank] || 1));
};

// Update leaderboard
speedrunProblemSchema.methods.updateLeaderboard = async function(entry) {
  // Add to leaderboard
  this.leaderboard.push(entry);
  
  // Sort by time (fastest first) and keep top 10
  this.leaderboard.sort((a, b) => a.time - b.time);
  this.leaderboard = this.leaderboard.slice(0, 10);
  
  await this.save();
};

export const SpeedrunProblem = mongoose.model('SpeedrunProblem', speedrunProblemSchema);

// ============================================
// SEED DATA - Pre-built speedrun problems
// ============================================

export const SEED_SPEEDRUNS = [
  {
    problemId: 'sum-positives',
    title: 'Sum of Positives',
    description: 'Write a function that takes an array of numbers and returns the sum of all positive numbers.',
    difficulty: 'easy',
    languages: ['python', 'javascript'],
    timeLimit: 300,
    xpReward: 100,
    functionName: 'sum_positives',
    parameters: ['numbers: array'],
    returnType: 'number',
    testCases: [
      { input: '[-1, 2, 3, -4, 5]', expectedOutput: '10', isHidden: false },
      { input: '[1, 2, 3, 4, 5]', expectedOutput: '15', isHidden: false },
      { input: '[-1, -2, -3]', expectedOutput: '0', isHidden: false },
      { input: '[0, 0, 0]', expectedOutput: '0', isHidden: true },
      { input: '[]', expectedOutput: '0', isHidden: true }
    ],
    starterCode: new Map([
      ['python', 'def sum_positives(numbers):\n    # Your code here\n    pass'],
      ['javascript', 'function sumPositives(numbers) {\n    // Your code here\n}']
    ])
  },
  {
    problemId: 'reverse-string',
    title: 'Reverse String',
    description: 'Write a function that reverses a string without using built-in reverse methods.',
    difficulty: 'easy',
    languages: ['python', 'javascript'],
    timeLimit: 300,
    xpReward: 100,
    functionName: 'reverse_string',
    parameters: ['text: string'],
    returnType: 'string',
    testCases: [
      { input: '"hello"', expectedOutput: '"olleh"', isHidden: false },
      { input: '"Python"', expectedOutput: '"nohtyP"', isHidden: false },
      { input: '""', expectedOutput: '""', isHidden: true },
      { input: '"a"', expectedOutput: '"a"', isHidden: true }
    ],
    starterCode: new Map([
      ['python', 'def reverse_string(text):\n    # Your code here (no slicing [::-1]!)\n    pass'],
      ['javascript', 'function reverseString(text) {\n    // Your code here (no .reverse()!)\n}']
    ])
  },
  {
    problemId: 'fizzbuzz',
    title: 'FizzBuzz',
    description: 'Return "Fizz" for multiples of 3, "Buzz" for multiples of 5, "FizzBuzz" for multiples of both, otherwise return the number as a string.',
    difficulty: 'easy',
    languages: ['python', 'javascript'],
    timeLimit: 300,
    xpReward: 100,
    functionName: 'fizzbuzz',
    parameters: ['n: number'],
    returnType: 'string',
    testCases: [
      { input: '3', expectedOutput: '"Fizz"', isHidden: false },
      { input: '5', expectedOutput: '"Buzz"', isHidden: false },
      { input: '15', expectedOutput: '"FizzBuzz"', isHidden: false },
      { input: '7', expectedOutput: '"7"', isHidden: false },
      { input: '30', expectedOutput: '"FizzBuzz"', isHidden: true }
    ],
    starterCode: new Map([
      ['python', 'def fizzbuzz(n):\n    # Your code here\n    pass'],
      ['javascript', 'function fizzbuzz(n) {\n    // Your code here\n}']
    ])
  },
  {
    problemId: 'palindrome-check',
    title: 'Palindrome Check',
    description: 'Check if a string is a palindrome (reads the same forwards and backwards). Ignore case and non-alphanumeric characters.',
    difficulty: 'medium',
    languages: ['python', 'javascript'],
    timeLimit: 300,
    xpReward: 150,
    functionName: 'is_palindrome',
    parameters: ['text: string'],
    returnType: 'boolean',
    testCases: [
      { input: '"racecar"', expectedOutput: 'true', isHidden: false },
      { input: '"A man a plan a canal Panama"', expectedOutput: 'true', isHidden: false },
      { input: '"hello"', expectedOutput: 'false', isHidden: false },
      { input: '""', expectedOutput: 'true', isHidden: true },
      { input: '"Was it a car or a cat I saw?"', expectedOutput: 'true', isHidden: true }
    ],
    starterCode: new Map([
      ['python', 'def is_palindrome(text):\n    # Your code here\n    pass'],
      ['javascript', 'function isPalindrome(text) {\n    // Your code here\n}']
    ])
  },
  {
    problemId: 'two-sum',
    title: 'Two Sum',
    description: 'Given an array of integers and a target sum, return the indices of two numbers that add up to the target.',
    difficulty: 'medium',
    languages: ['python', 'javascript'],
    timeLimit: 300,
    xpReward: 200,
    functionName: 'two_sum',
    parameters: ['nums: array', 'target: number'],
    returnType: 'array',
    testCases: [
      { input: '[2, 7, 11, 15], 9', expectedOutput: '[0, 1]', isHidden: false },
      { input: '[3, 2, 4], 6', expectedOutput: '[1, 2]', isHidden: false },
      { input: '[3, 3], 6', expectedOutput: '[0, 1]', isHidden: true }
    ],
    starterCode: new Map([
      ['python', 'def two_sum(nums, target):\n    # Your code here\n    pass'],
      ['javascript', 'function twoSum(nums, target) {\n    // Your code here\n}']
    ])
  },
  {
    problemId: 'find-duplicates',
    title: 'Find Duplicates',
    description: 'Given an array of integers, return all elements that appear more than once.',
    difficulty: 'medium',
    languages: ['python', 'javascript'],
    timeLimit: 300,
    xpReward: 175,
    functionName: 'find_duplicates',
    parameters: ['nums: array'],
    returnType: 'array',
    testCases: [
      { input: '[1, 2, 3, 2, 1, 4]', expectedOutput: '[1, 2]', isHidden: false },
      { input: '[1, 2, 3, 4, 5]', expectedOutput: '[]', isHidden: false },
      { input: '[1, 1, 1, 1]', expectedOutput: '[1]', isHidden: true }
    ],
    starterCode: new Map([
      ['python', 'def find_duplicates(nums):\n    # Your code here\n    pass'],
      ['javascript', 'function findDuplicates(nums) {\n    // Your code here\n}']
    ])
  },
  {
    problemId: 'valid-parentheses',
    title: 'Valid Parentheses',
    description: 'Check if a string of parentheses (), [], {} is valid (properly opened and closed).',
    difficulty: 'hard',
    languages: ['python', 'javascript'],
    timeLimit: 300,
    xpReward: 250,
    functionName: 'is_valid',
    parameters: ['s: string'],
    returnType: 'boolean',
    testCases: [
      { input: '"()"', expectedOutput: 'true', isHidden: false },
      { input: '"()[]{}"', expectedOutput: 'true', isHidden: false },
      { input: '"(]"', expectedOutput: 'false', isHidden: false },
      { input: '"([)]"', expectedOutput: 'false', isHidden: true },
      { input: '"{[]}"', expectedOutput: 'true', isHidden: true }
    ],
    starterCode: new Map([
      ['python', 'def is_valid(s):\n    # Your code here\n    pass'],
      ['javascript', 'function isValid(s) {\n    // Your code here\n}']
    ])
  },
  {
    problemId: 'merge-sorted-arrays',
    title: 'Merge Sorted Arrays',
    description: 'Merge two sorted arrays into one sorted array.',
    difficulty: 'hard',
    languages: ['python', 'javascript'],
    timeLimit: 300,
    xpReward: 275,
    functionName: 'merge_sorted',
    parameters: ['arr1: array', 'arr2: array'],
    returnType: 'array',
    testCases: [
      { input: '[1, 3, 5], [2, 4, 6]', expectedOutput: '[1, 2, 3, 4, 5, 6]', isHidden: false },
      { input: '[1, 2, 3], [4, 5, 6]', expectedOutput: '[1, 2, 3, 4, 5, 6]', isHidden: false },
      { input: '[], [1, 2, 3]', expectedOutput: '[1, 2, 3]', isHidden: true }
    ],
    starterCode: new Map([
      ['python', 'def merge_sorted(arr1, arr2):\n    # Your code here (no built-in sort!)\n    pass'],
      ['javascript', 'function mergeSorted(arr1, arr2) {\n    // Your code here (no .sort()!)\n}']
    ])
  }
];
