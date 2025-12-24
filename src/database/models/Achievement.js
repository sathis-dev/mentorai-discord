import mongoose from 'mongoose';

const achievementSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true
  },
  name: String,
  description: String,
  emoji: String,
  category: {
    type: String,
    enum: ['learning', 'streak', 'social', 'quiz', 'milestone']
  },
  requirement: {
    type: { type: String },
    value: Number
  },
  xpReward: Number,
  rarity: {
    type: String,
    enum: ['common', 'uncommon', 'rare', 'epic', 'legendary']
  }
});

export const Achievement = mongoose.model('Achievement', achievementSchema);

export async function seedAchievements() {
  const achievements = [
    {
      id: 'first_lesson',
      name: 'First Steps',
      description: 'Complete your first lesson',
      emoji: '🎉',
      category: 'learning',
      requirement: { type: 'lessonsCompleted', value: 1 },
      xpReward: 50,
      rarity: 'common'
    },
    {
      id: 'streak_7',
      name: 'Week Warrior',
      description: 'Maintain a 7-day learning streak',
      emoji: '🔥',
      category: 'streak',
      requirement: { type: 'streak', value: 7 },
      xpReward: 200,
      rarity: 'uncommon'
    },
    {
      id: 'quiz_master',
      name: 'Quiz Master',
      description: 'Score 100% on 10 quizzes',
      emoji: '🧠',
      category: 'quiz',
      requirement: { type: 'perfectQuizzes', value: 10 },
      xpReward: 500,
      rarity: 'rare'
    },
    {
      id: 'level_10',
      name: 'Rising Scholar',
      description: 'Reach level 10',
      emoji: '📚',
      category: 'milestone',
      requirement: { type: 'level', value: 10 },
      xpReward: 300,
      rarity: 'uncommon'
    },
    {
      id: 'party_host',
      name: 'Party Host',
      description: 'Host your first study party',
      emoji: '🎊',
      category: 'social',
      requirement: { type: 'partiesHosted', value: 1 },
      xpReward: 100,
      rarity: 'common'
    }
  ];

  for (const achievement of achievements) {
    await Achievement.updateOne(
      { id: achievement.id },
      achievement,
      { upsert: true }
    );
  }
}
