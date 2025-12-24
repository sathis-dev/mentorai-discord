import mongoose from 'mongoose';

const skillNodeSchema = new mongoose.Schema({
  id: { type: String, required: true },
  name: { type: String, required: true },
  description: String,
  category: String,
  level: { type: Number, default: 1 },
  maxLevel: { type: Number, default: 5 },
  xpRequired: { type: Number, default: 100 },
  prerequisites: [String],
  unlocks: [String],
  icon: String,
  position: {
    x: Number,
    y: Number
  }
});

const userSkillSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  guildId: { type: String, required: true },
  skills: [{
    skillId: String,
    level: { type: Number, default: 0 },
    xp: { type: Number, default: 0 },
    unlockedAt: Date,
    lastPracticedAt: Date
  }],
  totalSkillPoints: { type: Number, default: 0 }
}, {
  timestamps: true
});

userSkillSchema.index({ userId: 1, guildId: 1 }, { unique: true });

userSkillSchema.methods.unlockSkill = function(skillId) {
  const existing = this.skills.find(s => s.skillId === skillId);
  if (existing) return false;
  
  this.skills.push({
    skillId,
    level: 1,
    xp: 0,
    unlockedAt: new Date()
  });
  
  return true;
};

userSkillSchema.methods.addSkillXP = function(skillId, xp) {
  const skill = this.skills.find(s => s.skillId === skillId);
  if (!skill) return null;
  
  skill.xp += xp;
  skill.lastPracticedAt = new Date();
  
  const xpForNextLevel = skill.level * 100;
  if (skill.xp >= xpForNextLevel) {
    skill.level++;
    skill.xp -= xpForNextLevel;
    this.totalSkillPoints++;
    return { leveledUp: true, newLevel: skill.level };
  }
  
  return { leveledUp: false, currentXP: skill.xp };
};

export const SkillNode = mongoose.model('SkillNode', skillNodeSchema);
export const UserSkills = mongoose.model('UserSkills', userSkillSchema);

export default { SkillNode, UserSkills };
