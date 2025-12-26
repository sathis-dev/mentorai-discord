import mongoose from 'mongoose';

const lessonSchema = new mongoose.Schema({
  topic: { type: String, required: true },
  title: { type: String, required: true },
  content: { type: String, required: true },
  difficulty: { type: String, enum: ['beginner', 'intermediate', 'advanced'], default: 'beginner' },
  codeExamples: [{ type: String }],
  keyPoints: [{ type: String }],
  createdAt: { type: Date, default: Date.now },
});

export const Lesson = mongoose.model('Lesson', lessonSchema);
