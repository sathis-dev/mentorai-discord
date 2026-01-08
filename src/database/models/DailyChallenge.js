import mongoose from 'mongoose';

const dailyChallengeSchema = new mongoose.Schema({
  date: { type: Date, required: true, unique: true },
  title: String,
  difficulty: { type: String, enum: ['easy', 'medium', 'hard'] },
  description: String,
  examples: [{
    input: String,
    output: String,
    explanation: String
  }],
  constraints: [String],
  hints: [String],
  starterCode: {
    python: String,
    javascript: String,
    java: String
  },
  testCases: [{
    input: String,
    expectedOutput: String,
    isHidden: { type: Boolean, default: false }
  }],
  solution: {
    python: String,
    javascript: String,
    java: String
  },
  solutionExplanation: String,
  xpReward: Number,
  completions: [{
    discordId: String,
    username: String,
    language: String,
    code: String,
    passedTests: Number,
    totalTests: Number,
    runtime: Number,
    completedAt: { type: Date, default: Date.now }
  }],
  topic: String,
  tags: [String]
});

const DailyChallenge = mongoose.model('DailyChallenge', dailyChallengeSchema);
export default DailyChallenge;
