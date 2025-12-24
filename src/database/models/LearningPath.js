import mongoose from 'mongoose';

const lessonSchema = new mongoose.Schema({
  id: { type: String, required: true },
  title: { type: String, required: true },
  description: String,
  difficulty: { type: String, enum: ['beginner', 'intermediate', 'advanced'], default: 'beginner' },
  estimatedMinutes: { type: Number, default: 10 },
  xpReward: { type: Number, default: 50 },
  prerequisites: [String],
  locked: { type: Boolean, default: true },
  order: { type: Number, required: true }
});

const pathSchema = new mongoose.Schema({
  subject: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  description: String,
  category: { type: String, required: true },
  icon: String,
  totalLessons: { type: Number, default: 0 },
  estimatedHours: { type: Number, default: 0 },
  difficulty: { type: String, enum: ['beginner', 'intermediate', 'advanced'], default: 'beginner' },
  lessons: [lessonSchema],
  skills: [String],
  active: { type: Boolean, default: true }
}, {
  timestamps: true
});

const userProgressSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  guildId: { type: String, required: true },
  subject: { type: String, required: true },
  currentLesson: { type: Number, default: 0 },
  completedLessons: [String],
  startedAt: { type: Date, default: Date.now },
  lastAccessedAt: { type: Date, default: Date.now },
  completionPercentage: { type: Number, default: 0 },
  totalTimeSpent: { type: Number, default: 0 }
}, {
  timestamps: true
});

userProgressSchema.index({ userId: 1, guildId: 1, subject: 1 }, { unique: true });

pathSchema.methods.getNextLesson = function(completedLessons = []) {
  return this.lessons.find(lesson => 
    !completedLessons.includes(lesson.id) && 
    lesson.prerequisites.every(prereq => completedLessons.includes(prereq))
  );
};

pathSchema.methods.unlockLesson = function(lessonId, completedLessons = []) {
  const lesson = this.lessons.find(l => l.id === lessonId);
  if (!lesson) return false;
  
  const prereqsMet = lesson.prerequisites.every(prereq => 
    completedLessons.includes(prereq)
  );
  
  if (prereqsMet) {
    lesson.locked = false;
  }
  
  return prereqsMet;
};

export const LearningPath = mongoose.model('LearningPath', pathSchema);
export const UserPathProgress = mongoose.model('UserPathProgress', userProgressSchema);

export default LearningPath;
