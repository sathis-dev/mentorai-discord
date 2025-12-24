import { User } from '../database/models/User.js';
import { Achievement } from '../database/models/Achievement.js';
import { logger } from '../utils/logger.js';

export const XP_REWARDS = {
  lessonComplete: 25,
  quizCorrect: 10,
  quizPerfect: 50,
  dailyLogin: 15,
  streakBonus: (days) => days * 5,
  studyPartyBonus: 1.5,
  firstOfDay: 20
};

export function calculateLevel(totalXp) {
  let level = 1;
  let xpThreshold = 100;
  let totalRequired = 0;

  while (totalXp >= totalRequired + xpThreshold) {
    totalRequired += xpThreshold;
    level++;
    xpThreshold = Math.floor(xpThreshold * 1.5);
  }

  return {
    level,
    currentXp: totalXp - totalRequired,
    xpForNext: xpThreshold,
    totalXp
  };
}

export async function checkAchievements(user) {
  const newAchievements = [];
  const allAchievements = await Achievement.find();

  for (const achievement of allAchievements) {
    if (user.achievements.some(a => a.id === achievement.id)) {
      continue;
    }

    let requirementMet = false;
    const req = achievement.requirement;

    switch (req.type) {
      case 'lessonsCompleted':
        requirementMet = user.lessonsCompleted >= req.value;
        break;
      case 'streak':
        requirementMet = user.currentStreak >= req.value;
        break;
      case 'level':
        requirementMet = user.level >= req.value;
        break;
      case 'quizzesCompleted':
        requirementMet = user.quizzesCompleted >= req.value;
        break;
      case 'totalXp':
        requirementMet = user.totalXp >= req.value;
        break;
      case 'perfectQuizzes':
        break;
    }

    if (requirementMet) {
      user.achievements.push({
        id: achievement.id,
        unlockedAt: new Date()
      });

      await user.addXp(achievement.xpReward);

      newAchievements.push(achievement);
    }
  }

  if (newAchievements.length > 0) {
    await user.save();
  }

  return newAchievements;
}

export function generateDailyChallenge() {
  const challenges = [
    {
      type: 'lessons',
      description: 'Complete 3 lessons',
      target: 3,
      xpReward: 100
    },
    {
      type: 'quizzes',
      description: 'Pass 2 quizzes with 80%+ score',
      target: 2,
      xpReward: 150
    },
    {
      type: 'time',
      description: 'Study for 30 minutes',
      target: 30,
      xpReward: 75
    },
    {
      type: 'perfect',
      description: 'Get a perfect score on any quiz',
      target: 1,
      xpReward: 200
    }
  ];

  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);
  return challenges[dayOfYear % challenges.length];
}

export default {
  XP_REWARDS,
  calculateLevel,
  checkAchievements,
  generateDailyChallenge
};
