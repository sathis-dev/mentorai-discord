import mongoose from 'mongoose';
import crypto from 'crypto';

const certificateSchema = new mongoose.Schema({
  certificateId: { 
    type: String, 
    required: true, 
    unique: true,
    default: () => generateCertificateId()
  },
  
  // Cryptographic Credential ID (new format: MENTOR-XXXXXXXX)
  credentialId: { type: String, unique: true, sparse: true },
  hash: { type: String }, // SHA256 hash for verification
  
  // User info
  discordId: { type: String, required: true },
  discordUsername: { type: String },
  username: { type: String }, // Alias for discordUsername
  
  // Certificate details
  skill: { type: String }, // e.g., "JavaScript Fundamentals"
  courseName: { type: String }, // Alternative to skill
  score: { type: Number }, // Score percentage
  level: { 
    type: String, 
    enum: ['beginner', 'intermediate', 'advanced', 'expert', null],
    default: null
  },
  lifetimeXP: { type: Number, default: 0 },
  verified: { type: Boolean, default: true },
  
  // Achievement stats at time of issue
  stats: {
    lessonsCompleted: { type: Number, default: 0 },
    quizAccuracy: { type: Number, default: 0 },
    projectsBuilt: { type: Number, default: 0 },
    totalXP: { type: Number, default: 0 },
    streak: { type: Number, default: 0 },
    achievementCount: { type: Number, default: 0 }
  },
  
  // Timestamps
  issuedAt: { type: Date, default: Date.now },
  expiresAt: { type: Date }, // Optional expiration
  
  // Verification
  verificationUrl: { type: String },
  isVerified: { type: Boolean, default: true },
  
  // Visual customization
  template: { type: String, default: 'default' },
  specialBadge: { type: String }
});

// Generate unique certificate ID
function generateCertificateId() {
  const prefix = 'MC'; // MentorAI Certificate
  const year = new Date().getFullYear();
  const random = crypto.randomBytes(4).toString('hex').toUpperCase();
  return `${prefix}-${year}-${random}`;
}

// Static method to create certificate for a user
certificateSchema.statics.createForUser = async function(user, skill, level) {
  const certificate = new this({
    discordId: user.discordId,
    discordUsername: user.username,
    skill,
    level,
    stats: {
      lessonsCompleted: user.completedLessons?.length || 0,
      quizAccuracy: user.totalQuestions > 0 
        ? Math.round((user.correctAnswers / user.totalQuestions) * 100) 
        : 0,
      projectsBuilt: user.completedProjects?.length || 0,
      totalXP: user.xp || 0,
      streak: user.streak || 0,
      achievementCount: user.achievements?.length || 0
    }
  });
  
  // Generate verification URL
  certificate.verificationUrl = `https://mentorai.up.railway.app/verify/${certificate.certificateId}`;
  
  await certificate.save();
  return certificate;
};

// Method to verify certificate
certificateSchema.statics.verify = async function(certificateId) {
  const cert = await this.findOne({ certificateId });
  if (!cert) return { valid: false, message: 'Certificate not found' };
  if (cert.expiresAt && new Date() > cert.expiresAt) {
    return { valid: false, message: 'Certificate has expired', certificate: cert };
  }
  return { valid: true, certificate: cert };
};

// Format certificate for display
certificateSchema.methods.toDisplayFormat = function() {
  const levelEmoji = {
    beginner: '🌱',
    intermediate: '⭐',
    advanced: '🌟',
    expert: '👑'
  };
  
  return {
    id: this.certificateId,
    recipient: this.discordUsername,
    skill: this.skill,
    level: `${levelEmoji[this.level]} ${this.level.charAt(0).toUpperCase() + this.level.slice(1)}`,
    issuedDate: this.issuedAt.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }),
    stats: this.stats,
    verifyUrl: this.verificationUrl
  };
};

// Index for efficient lookups (certificateId and credentialId already indexed via unique: true)
certificateSchema.index({ discordId: 1 });

export const Certificate = mongoose.model('Certificate', certificateSchema);

// ============================================
// Certificate Templates
// ============================================

export const CERTIFICATE_TEMPLATES = {
  javascript: {
    name: 'JavaScript',
    levels: {
      beginner: 'JavaScript Fundamentals',
      intermediate: 'JavaScript Developer',
      advanced: 'JavaScript Expert',
      expert: 'JavaScript Master'
    },
    requirements: {
      beginner: { lessons: 5, accuracy: 60, quizzes: 3 },
      intermediate: { lessons: 15, accuracy: 70, quizzes: 10 },
      advanced: { lessons: 30, accuracy: 80, quizzes: 20 },
      expert: { lessons: 50, accuracy: 90, quizzes: 35 }
    }
  },
  python: {
    name: 'Python',
    levels: {
      beginner: 'Python Fundamentals',
      intermediate: 'Python Developer',
      advanced: 'Python Expert',
      expert: 'Python Master'
    },
    requirements: {
      beginner: { lessons: 5, accuracy: 60, quizzes: 3 },
      intermediate: { lessons: 15, accuracy: 70, quizzes: 10 },
      advanced: { lessons: 30, accuracy: 80, quizzes: 20 },
      expert: { lessons: 50, accuracy: 90, quizzes: 35 }
    }
  },
  webdev: {
    name: 'Web Development',
    levels: {
      beginner: 'Web Development Basics',
      intermediate: 'Web Developer',
      advanced: 'Full Stack Developer',
      expert: 'Web Development Master'
    },
    requirements: {
      beginner: { lessons: 10, accuracy: 60, quizzes: 5 },
      intermediate: { lessons: 25, accuracy: 70, quizzes: 15 },
      advanced: { lessons: 45, accuracy: 80, quizzes: 30 },
      expert: { lessons: 70, accuracy: 90, quizzes: 50 }
    }
  },
  general: {
    name: 'Programming',
    levels: {
      beginner: 'Coding Fundamentals',
      intermediate: 'Programmer',
      advanced: 'Senior Programmer',
      expert: 'Programming Master'
    },
    requirements: {
      beginner: { lessons: 5, accuracy: 60, quizzes: 3 },
      intermediate: { lessons: 20, accuracy: 70, quizzes: 12 },
      advanced: { lessons: 40, accuracy: 80, quizzes: 25 },
      expert: { lessons: 60, accuracy: 90, quizzes: 40 }
    }
  }
};

// Check if user qualifies for a certificate
export function checkCertificateEligibility(user, skill = 'general') {
  const template = CERTIFICATE_TEMPLATES[skill.toLowerCase()] || CERTIFICATE_TEMPLATES.general;
  const stats = {
    lessons: user.completedLessons?.length || 0,
    accuracy: user.totalQuestions > 0 
      ? Math.round((user.correctAnswers / user.totalQuestions) * 100) 
      : 0,
    quizzes: user.quizzesTaken || 0
  };
  
  const eligibility = {
    eligible: false,
    level: null,
    progress: {},
    nextLevel: null
  };
  
  // Check each level from highest to lowest
  for (const level of ['expert', 'advanced', 'intermediate', 'beginner']) {
    const req = template.requirements[level];
    const meetsRequirements = 
      stats.lessons >= req.lessons &&
      stats.accuracy >= req.accuracy &&
      stats.quizzes >= req.quizzes;
    
    if (meetsRequirements && !eligibility.eligible) {
      eligibility.eligible = true;
      eligibility.level = level;
      eligibility.skillName = template.levels[level];
    }
    
    // Track progress for each level
    eligibility.progress[level] = {
      lessons: { current: stats.lessons, required: req.lessons, met: stats.lessons >= req.lessons },
      accuracy: { current: stats.accuracy, required: req.accuracy, met: stats.accuracy >= req.accuracy },
      quizzes: { current: stats.quizzes, required: req.quizzes, met: stats.quizzes >= req.quizzes }
    };
  }
  
  // Find next level to work towards
  if (eligibility.eligible) {
    const levels = ['beginner', 'intermediate', 'advanced', 'expert'];
    const currentIndex = levels.indexOf(eligibility.level);
    if (currentIndex < levels.length - 1) {
      eligibility.nextLevel = levels[currentIndex + 1];
    }
  } else {
    eligibility.nextLevel = 'beginner';
  }
  
  return eligibility;
}
