import mongoose from 'mongoose';

// ============================================
// Quiz Session Model - Persistent quiz storage
// Replaces in-memory Map to survive restarts
// ============================================

const quizSessionSchema = new mongoose.Schema({
  // Session identification
  sessionId: { 
    type: String, 
    required: true, 
    unique: true,
    index: true 
  },
  
  // User who owns this session
  discordId: { 
    type: String, 
    required: true, 
    index: true 
  },
  
  // Quiz metadata
  topic: { type: String, required: true },
  difficulty: { type: String, default: 'medium' },
  quizTitle: { type: String },
  
  // Questions array (embedded)
  questions: [{
    question: { type: String, required: true },
    options: [{ type: String }],
    correctIndex: { type: Number, required: true },
    explanation: { type: String },
    conceptTested: { type: String },
    difficulty: { type: String }
  }],
  
  // Progress tracking
  currentQuestion: { type: Number, default: 0 },
  score: { type: Number, default: 0 },
  answers: [{
    questionIndex: Number,
    selectedIndex: Number,
    correct: Boolean,
    timeSpent: Number
  }],
  
  // Lifelines
  hintUsed: { type: Boolean, default: false },
  fiftyUsed: { type: Boolean, default: false },
  eliminatedOptions: [{ type: Number }],
  
  // Timing
  startedAt: { type: Date, default: Date.now },
  lastActivityAt: { type: Date, default: Date.now },
  completedAt: { type: Date },
  
  // Status
  status: { 
    type: String, 
    enum: ['active', 'completed', 'cancelled', 'expired'],
    default: 'active',
    index: true
  },
  
  // AI encouragement message
  encouragement: { type: String },
  
  // Timed mode
  timedMode: { type: Boolean, default: false },
  timePerQuestion: { type: Number, default: 30 } // seconds
});

// Auto-expire sessions after 30 minutes of inactivity
quizSessionSchema.index(
  { lastActivityAt: 1 }, 
  { expireAfterSeconds: 1800 } // 30 minutes
);

// Index for finding user's active session
quizSessionSchema.index({ discordId: 1, status: 1 });

// Static: Get user's active session
quizSessionSchema.statics.getActiveSession = async function(discordId) {
  return this.findOne({ 
    discordId, 
    status: 'active' 
  }).sort({ startedAt: -1 });
};

// Static: Create new session (cancels any existing)
quizSessionSchema.statics.createSession = async function(discordId, quizData) {
  // Cancel any existing active sessions
  await this.updateMany(
    { discordId, status: 'active' },
    { status: 'cancelled' }
  );
  
  // Create new session
  const sessionId = 'quiz_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 9);
  
  return this.create({
    sessionId,
    discordId,
    ...quizData,
    startedAt: new Date(),
    lastActivityAt: new Date()
  });
};

// Method: Update activity timestamp
quizSessionSchema.methods.touch = function() {
  this.lastActivityAt = new Date();
  return this.save();
};

// Method: Submit answer
quizSessionSchema.methods.submitAnswer = function(answerIndex, timeSpent = 0) {
  const question = this.questions[this.currentQuestion];
  if (!question) return null;
  
  const correct = answerIndex === question.correctIndex;
  
  this.answers.push({
    questionIndex: this.currentQuestion,
    selectedIndex: answerIndex,
    correct,
    timeSpent
  });
  
  if (correct) {
    this.score += 1;
  }
  
  // Reset 50/50 for next question
  this.eliminatedOptions = [];
  
  // Move to next question
  this.currentQuestion += 1;
  this.lastActivityAt = new Date();
  
  // Check if quiz complete
  if (this.currentQuestion >= this.questions.length) {
    this.status = 'completed';
    this.completedAt = new Date();
  }
  
  return {
    correct,
    correctIndex: question.correctIndex,
    explanation: question.explanation,
    isComplete: this.status === 'completed',
    score: this.score,
    totalQuestions: this.questions.length
  };
};

// Method: Use hint
quizSessionSchema.methods.useHint = function() {
  if (this.hintUsed) {
    return { alreadyUsed: true };
  }
  
  this.hintUsed = true;
  const currentQ = this.questions[this.currentQuestion];
  
  const hint = currentQ.explanation 
    ? `💡 **Hint:** Think about ${currentQ.conceptTested || 'the core concept'}...`
    : `💡 **Hint:** Consider what makes the correct answer unique.`;
  
  return { hint, conceptTested: currentQ.conceptTested };
};

// Method: Use 50/50
quizSessionSchema.methods.useFiftyFifty = function() {
  if (this.fiftyUsed) {
    return { alreadyUsed: true };
  }
  
  this.fiftyUsed = true;
  const currentQ = this.questions[this.currentQuestion];
  const correctIndex = currentQ.correctIndex;
  
  // Get wrong answer indices
  const wrongIndices = [0, 1, 2, 3].filter(i => i !== correctIndex);
  
  // Randomly pick 2 wrong answers to eliminate
  const shuffled = wrongIndices.sort(() => Math.random() - 0.5);
  const eliminated = shuffled.slice(0, 2);
  
  this.eliminatedOptions = eliminated;
  
  return { 
    eliminated, 
    remaining: [0, 1, 2, 3].filter(i => !eliminated.includes(i))
  };
};

// Static: Cleanup old sessions (run periodically)
quizSessionSchema.statics.cleanupOldSessions = async function() {
  const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
  
  const result = await this.updateMany(
    { 
      status: 'active',
      lastActivityAt: { $lt: thirtyMinutesAgo }
    },
    { status: 'expired' }
  );
  
  return result.modifiedCount;
};

export const QuizSession = mongoose.model('QuizSession', quizSessionSchema);
