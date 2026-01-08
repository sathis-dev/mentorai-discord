import mongoose from 'mongoose';

const flashcardSchema = new mongoose.Schema({
  discordId: { type: String, required: true, index: true },
  deck: { type: String, default: 'default' },
  front: { type: String, required: true },
  back: { type: String, required: true },
  topic: String,
  tags: [String],
  
  // Spaced Repetition fields (SM-2 Algorithm)
  easeFactor: { type: Number, default: 2.5 },
  interval: { type: Number, default: 1 }, // days
  repetitions: { type: Number, default: 0 },
  nextReview: { type: Date, default: Date.now },
  lastReview: Date,
  
  // Stats
  timesReviewed: { type: Number, default: 0 },
  timesCorrect: { type: Number, default: 0 },
  averageResponseTime: { type: Number, default: 0 },
  
  createdAt: { type: Date, default: Date.now }
});

// SM-2 Algorithm implementation
flashcardSchema.methods.updateSRS = function(quality) {
  // quality: 0-5 (0-2 = wrong, 3-5 = correct with varying difficulty)
  
  if (quality >= 3) {
    // Correct response
    if (this.repetitions === 0) {
      this.interval = 1;
    } else if (this.repetitions === 1) {
      this.interval = 6;
    } else {
      this.interval = Math.round(this.interval * this.easeFactor);
    }
    this.repetitions++;
  } else {
    // Incorrect response - reset
    this.repetitions = 0;
    this.interval = 1;
  }
  
  // Update ease factor
  this.easeFactor = Math.max(1.3, 
    this.easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
  );
  
  // Set next review date
  this.nextReview = new Date(Date.now() + this.interval * 24 * 60 * 60 * 1000);
  this.lastReview = new Date();
  this.timesReviewed++;
  
  if (quality >= 3) {
    this.timesCorrect++;
  }
};

const Flashcard = mongoose.model('Flashcard', flashcardSchema);
export default Flashcard;
