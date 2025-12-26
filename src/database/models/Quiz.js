import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema({
  question: { type: String, required: true },
  options: [{ type: String, required: true }],
  correctIndex: { type: Number, required: true },
  explanation: { type: String },
});

const quizSchema = new mongoose.Schema({
  topic: { type: String, required: true },
  difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' },
  questions: [questionSchema],
  createdBy: { type: String },
  createdAt: { type: Date, default: Date.now },
});

export const Quiz = mongoose.model('Quiz', quizSchema);
