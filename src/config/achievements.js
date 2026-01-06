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
  },

  // === DEBUG ACHIEVEMENTS ===
  {
    id: 'first_debug',
    name: 'Bug Squasher',
    description: 'Debug your first piece of code',
    emoji: '🐛',
    category: 'debug',
    requirement: { type: 'debugSessions', value: 1 },
    xpReward: 50,
    rarity: 'common'
  },
  {
    id: 'debug_10',
    name: 'Exterminator',
    description: 'Complete 10 debug sessions',
    emoji: '🔍',
    category: 'debug',
    requirement: { type: 'debugSessions', value: 10 },
    xpReward: 200,
    rarity: 'uncommon'
  },
  {
    id: 'debug_master',
    name: 'Debug Master',
    description: 'Complete 50 debug sessions',
    emoji: '🧹',
    category: 'debug',
    requirement: { type: 'debugSessions', value: 50 },
    xpReward: 500,
    rarity: 'rare'
  },

  // === CODE REVIEW ACHIEVEMENTS ===
  {
    id: 'first_review',
    name: 'Code Critic',
    description: 'Get your first code review',
    emoji: '👁️',
    category: 'review',
    requirement: { type: 'codeReviews', value: 1 },
    xpReward: 50,
    rarity: 'common'
  },
  {
    id: 'review_10',
    name: 'Quality Control',
    description: 'Get 10 code reviews',
    emoji: '✅',
    category: 'review',
    requirement: { type: 'codeReviews', value: 10 },
    xpReward: 200,
    rarity: 'uncommon'
  },
  {
    id: 'review_expert',
    name: 'Code Craftsman',
    description: 'Get 50 code reviews',
    emoji: '🎨',
    category: 'review',
    requirement: { type: 'codeReviews', value: 50 },
    xpReward: 500,
    rarity: 'rare'
  },

  // === ARENA ACHIEVEMENTS ===
  {
    id: 'first_arena',
    name: 'Arena Rookie',
    description: 'Compete in your first arena battle',
    emoji: '⚔️',
    category: 'arena',
    requirement: { type: 'arenaGames', value: 1 },
    xpReward: 75,
    rarity: 'common'
  },
  {
    id: 'arena_winner',
    name: 'Arena Champion',
    description: 'Win your first arena battle',
    emoji: '🏆',
    category: 'arena',
    requirement: { type: 'arenaWins', value: 1 },
    xpReward: 150,
    rarity: 'uncommon'
  },
  {
    id: 'arena_veteran',
    name: 'Arena Veteran',
    description: 'Compete in 25 arena battles',
    emoji: '🛡️',
    category: 'arena',
    requirement: { type: 'arenaGames', value: 25 },
    xpReward: 400,
    rarity: 'rare'
  },
  {
    id: 'arena_legend',
    name: 'Arena Legend',
    description: 'Win 50 arena battles',
    emoji: '👑',
    category: 'arena',
    requirement: { type: 'arenaWins', value: 50 },
    xpReward: 1000,
    rarity: 'epic'
  },
  {
    id: 'arena_undefeated',
    name: 'Undefeated',
    description: 'Win 10 arena battles in a row',
    emoji: '💪',
    category: 'arena',
    requirement: { type: 'arenaWinStreak', value: 10 },
    xpReward: 750,
    rarity: 'epic'
  },

  // === SPEEDRUN ACHIEVEMENTS ===
  {
    id: 'first_speedrun',
    name: 'Speed Demon',
    description: 'Complete your first speedrun',
    emoji: '⚡',
    category: 'speedrun',
    requirement: { type: 'speedrunsCompleted', value: 1 },
    xpReward: 75,
    rarity: 'common'
  },
  {
    id: 'speedrun_s_rank',
    name: 'Lightning Fast',
    description: 'Achieve S rank on a speedrun',
    emoji: '🌟',
    category: 'speedrun',
    requirement: { type: 'speedrunSRanks', value: 1 },
    xpReward: 200,
    rarity: 'rare'
  },
  {
    id: 'speedrun_master',
    name: 'Speed Master',
    description: 'Complete 25 speedruns',
    emoji: '🏎️',
    category: 'speedrun',
    requirement: { type: 'speedrunsCompleted', value: 25 },
    xpReward: 500,
    rarity: 'rare'
  },
  {
    id: 'speedrun_legend',
    name: 'Speed Legend',
    description: 'Get S rank on 10 speedruns',
    emoji: '🚀',
    category: 'speedrun',
    requirement: { type: 'speedrunSRanks', value: 10 },
    xpReward: 1000,
    rarity: 'epic'
  },

  // === PROJECT ACHIEVEMENTS ===
  {
    id: 'first_project',
    name: 'Builder',
    description: 'Complete your first project',
    emoji: '🏗️',
    category: 'project',
    requirement: { type: 'projectsCompleted', value: 1 },
    xpReward: 100,
    rarity: 'common'
  },
  {
    id: 'project_5',
    name: 'Project Pro',
    description: 'Complete 5 projects',
    emoji: '🔨',
    category: 'project',
    requirement: { type: 'projectsCompleted', value: 5 },
    xpReward: 300,
    rarity: 'uncommon'
  },
  {
    id: 'project_master',
    name: 'Master Builder',
    description: 'Complete 15 projects',
    emoji: '🏛️',
    category: 'project',
    requirement: { type: 'projectsCompleted', value: 15 },
    xpReward: 750,
    rarity: 'rare'
  },
  {
    id: 'project_architect',
    name: 'Architect',
    description: 'Complete projects in 3 different languages',
    emoji: '📐',
    category: 'project',
    requirement: { type: 'projectLanguages', value: 3 },
    xpReward: 500,
    rarity: 'rare'
  },

  // === SKILL TREE ACHIEVEMENTS ===
  {
    id: 'first_skill',
    name: 'Skill Unlocked',
    description: 'Unlock your first skill in the skill tree',
    emoji: '🌱',
    category: 'skilltree',
    requirement: { type: 'skillsUnlocked', value: 1 },
    xpReward: 50,
    rarity: 'common'
  },
  {
    id: 'skill_10',
    name: 'Growing Tree',
    description: 'Unlock 10 skills',
    emoji: '🌳',
    category: 'skilltree',
    requirement: { type: 'skillsUnlocked', value: 10 },
    xpReward: 250,
    rarity: 'uncommon'
  },
  {
    id: 'skill_mastery',
    name: 'Skill Master',
    description: 'Complete an entire skill tree branch',
    emoji: '🌟',
    category: 'skilltree',
    requirement: { type: 'treeBranchComplete', value: 1 },
    xpReward: 500,
    rarity: 'rare'
  },
  {
    id: 'skill_complete',
    name: 'Full Stack',
    description: 'Complete an entire skill tree',
    emoji: '🎓',
    category: 'skilltree',
    requirement: { type: 'treeComplete', value: 1 },
    xpReward: 2000,
    rarity: 'legendary'
  },

  // === CERTIFICATE ACHIEVEMENTS ===
  {
    id: 'first_certificate',
    name: 'Certified',
    description: 'Earn your first certificate',
    emoji: '📜',
    category: 'certificate',
    requirement: { type: 'certificates', value: 1 },
    xpReward: 150,
    rarity: 'uncommon'
  },
  {
    id: 'certificate_collector',
    name: 'Certificate Collector',
    description: 'Earn 5 certificates',
    emoji: '🎖️',
    category: 'certificate',
    requirement: { type: 'certificates', value: 5 },
    xpReward: 500,
    rarity: 'rare'
  },
  {
    id: 'certificate_master',
    name: 'Credential Master',
    description: 'Earn 10 certificates',
    emoji: '🏅',
    category: 'certificate',
    requirement: { type: 'certificates', value: 10 },
    xpReward: 1000,
    rarity: 'epic'
  },

  // === SPECIAL ACHIEVEMENTS ===
  {
    id: 'mentor_session',
    name: 'Mentorship',
    description: 'Complete a mentor session',
    emoji: '🧑‍🏫',
    category: 'special',
    requirement: { type: 'mentorSessions', value: 1 },
    xpReward: 100,
    rarity: 'uncommon'
  },
  {
    id: 'all_rounder',
    name: 'All-Rounder',
    description: 'Use all major features: quiz, debug, project, arena',
    emoji: '🌈',
    category: 'special',
    requirement: { type: 'featuresUsed', value: 4 },
    xpReward: 300,
    rarity: 'rare'
  },
  {
    id: 'comeback_king',
    name: 'Comeback King',
    description: 'Return after 7 days away and study',
    emoji: '👋',
    category: 'special',
    requirement: { type: 'comeback', value: 7 },
    xpReward: 200,
    rarity: 'uncommon'
  },
  {
    id: 'perfectionist',
    name: 'Perfectionist',
    description: 'Get 100% on 5 quizzes in a row',
    emoji: '💯',
    category: 'quiz',
    requirement: { type: 'perfectStreak', value: 5 },
    xpReward: 500,
    rarity: 'rare'
  },
  {
    id: 'hundred_xp',
    name: 'XP Collector',
    description: 'Earn 10,000 total XP',
    emoji: '💎',
    category: 'milestone',
    requirement: { type: 'totalXp', value: 10000 },
    xpReward: 500,
    rarity: 'rare'
  },
  {
    id: 'mega_xp',
    name: 'XP Millionaire',
    description: 'Earn 100,000 total XP',
    emoji: '💰',
    category: 'milestone',
    requirement: { type: 'totalXp', value: 100000 },
    xpReward: 5000,
    rarity: 'legendary'
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
