export const achievements = [
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
    id: 'lessons_10',
    name: 'Dedicated Learner',
    description: 'Complete 10 lessons',
    emoji: '📚',
    category: 'learning',
    requirement: { type: 'lessonsCompleted', value: 10 },
    xpReward: 200,
    rarity: 'uncommon'
  },
  {
    id: 'lessons_50',
    name: 'Knowledge Seeker',
    description: 'Complete 50 lessons',
    emoji: '🎓',
    category: 'learning',
    requirement: { type: 'lessonsCompleted', value: 50 },
    xpReward: 500,
    rarity: 'rare'
  },
  {
    id: 'lessons_100',
    name: 'Master Scholar',
    description: 'Complete 100 lessons',
    emoji: '👨‍🎓',
    category: 'learning',
    requirement: { type: 'lessonsCompleted', value: 100 },
    xpReward: 1000,
    rarity: 'epic'
  },
  {
    id: 'streak_3',
    name: 'Getting Started',
    description: '3-day learning streak',
    emoji: '🔥',
    category: 'streak',
    requirement: { type: 'streak', value: 3 },
    xpReward: 75,
    rarity: 'common'
  },
  {
    id: 'streak_7',
    name: 'Week Warrior',
    description: '7-day learning streak',
    emoji: '🔥',
    category: 'streak',
    requirement: { type: 'streak', value: 7 },
    xpReward: 200,
    rarity: 'uncommon'
  },
  {
    id: 'streak_30',
    name: 'Monthly Master',
    description: '30-day learning streak',
    emoji: '🌟',
    category: 'streak',
    requirement: { type: 'streak', value: 30 },
    xpReward: 1000,
    rarity: 'epic'
  },
  {
    id: 'streak_100',
    name: 'Century Streak',
    description: '100-day learning streak',
    emoji: '💫',
    category: 'streak',
    requirement: { type: 'streak', value: 100 },
    xpReward: 5000,
    rarity: 'legendary'
  },
  {
    id: 'first_quiz',
    name: 'Quiz Taker',
    description: 'Complete your first quiz',
    emoji: '🧠',
    category: 'quiz',
    requirement: { type: 'quizzesCompleted', value: 1 },
    xpReward: 50,
    rarity: 'common'
  },
  {
    id: 'quiz_perfect',
    name: 'Perfect Score',
    description: 'Get 100% on a quiz',
    emoji: '💯',
    category: 'quiz',
    requirement: { type: 'perfectQuizzes', value: 1 },
    xpReward: 100,
    rarity: 'uncommon'
  },
  {
    id: 'quiz_master',
    name: 'Quiz Master',
    description: 'Score 100% on 10 quizzes',
    emoji: '🏆',
    category: 'quiz',
    requirement: { type: 'perfectQuizzes', value: 10 },
    xpReward: 500,
    rarity: 'rare'
  },
  {
    id: 'level_5',
    name: 'Rising Star',
    description: 'Reach level 5',
    emoji: '⭐',
    category: 'milestone',
    requirement: { type: 'level', value: 5 },
    xpReward: 150,
    rarity: 'common'
  },
  {
    id: 'level_10',
    name: 'Scholar',
    description: 'Reach level 10',
    emoji: '📖',
    category: 'milestone',
    requirement: { type: 'level', value: 10 },
    xpReward: 300,
    rarity: 'uncommon'
  },
  {
    id: 'level_25',
    name: 'Expert',
    description: 'Reach level 25',
    emoji: '🏅',
    category: 'milestone',
    requirement: { type: 'level', value: 25 },
    xpReward: 750,
    rarity: 'rare'
  },
  {
    id: 'level_50',
    name: 'Grandmaster',
    description: 'Reach level 50',
    emoji: '👑',
    category: 'milestone',
    requirement: { type: 'level', value: 50 },
    xpReward: 2000,
    rarity: 'legendary'
  },
  {
    id: 'party_host',
    name: 'Party Starter',
    description: 'Host your first study party',
    emoji: '🎊',
    category: 'social',
    requirement: { type: 'partiesHosted', value: 1 },
    xpReward: 100,
    rarity: 'common'
  },
  {
    id: 'party_joiner',
    name: 'Team Player',
    description: 'Join 5 study parties',
    emoji: '🤝',
    category: 'social',
    requirement: { type: 'partiesJoined', value: 5 },
    xpReward: 150,
    rarity: 'uncommon'
  },
  {
    id: 'early_bird',
    name: 'Early Bird',
    description: 'Study before 8 AM',
    emoji: '🌅',
    category: 'learning',
    requirement: { type: 'earlyMorning', value: 1 },
    xpReward: 50,
    rarity: 'common'
  },
  {
    id: 'night_owl',
    name: 'Night Owl',
    description: 'Study after 10 PM',
    emoji: '🦉',
    category: 'learning',
    requirement: { type: 'lateNight', value: 1 },
    xpReward: 50,
    rarity: 'common'
  },
  {
    id: 'polymath',
    name: 'Polymath',
    description: 'Complete lessons in 5 different subjects',
    emoji: '🎭',
    category: 'learning',
    requirement: { type: 'subjectsStudied', value: 5 },
    xpReward: 300,
    rarity: 'rare'
  }
];

export const rarityColors = {
  common: '#9E9E9E',
  uncommon: '#4CAF50',
  rare: '#2196F3',
  epic: '#9C27B0',
  legendary: '#FF9800'
};

export default achievements;
