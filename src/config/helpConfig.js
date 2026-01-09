import { ButtonStyle } from 'discord.js';

// ═══════════════════════════════════════════════════════════════════
// COLOR SCHEME
// ═══════════════════════════════════════════════════════════════════

export const HELP_COLORS = {
  PRIMARY: 0x5865F2,      // Discord Blurple
  SUCCESS: 0x57F287,      // Green
  WARNING: 0xFEE75C,      // Yellow
  DANGER: 0xED4245,       // Red
  PREMIUM: 0xF47FFF,      // Pink/Purple
  XP_GOLD: 0xFFD700,      // Gold
  LEARNING: 0x3498DB,     // Blue
  COMPETITION: 0xE74C3C,  // Red
  AI: 0x9B59B6,           // Purple
  PROGRESS: 0x2ECC71,     // Emerald
  CUSTOMIZE: 0xE91E63,    // Pink
  ACHIEVEMENT: 0xF39C12,  // Orange
  EVENT: 0x1ABC9C,        // Teal
  SETTINGS: 0x95A5A6,     // Gray
  STREAK_FIRE: 0xFF6B35   // Fire Orange
};

// ═══════════════════════════════════════════════════════════════════
// CATEGORY DEFINITIONS
// ═══════════════════════════════════════════════════════════════════

export const HELP_CATEGORIES = {
  learning: {
    id: 'learning',
    name: 'Learning',
    emoji: '📚',
    color: HELP_COLORS.LEARNING,
    description: 'Master new skills with lessons, flashcards & challenges',
    icon: '📖',
    order: 1,
    commands: [
      {
        name: 'learn',
        description: 'Start an interactive AI-powered lesson',
        usage: '/learn <topic> [difficulty]',
        examples: [
          '/learn python',
          '/learn javascript intermediate',
          '/learn react advanced'
        ],
        subcommands: null,
        cooldown: 'None',
        premium: false,
        new: false,
        popular: true
      },
      {
        name: 'flashcard',
        description: 'Spaced repetition flashcard system',
        usage: '/flashcard <subcommand>',
        examples: [
          '/flashcard study',
          '/flashcard create',
          '/flashcard generate python 10'
        ],
        subcommands: ['study', 'create', 'generate', 'stats', 'decks'],
        cooldown: 'None',
        premium: false,
        new: true,
        popular: false
      },
      {
        name: 'dailychallenge',
        description: 'Daily coding challenges with rewards',
        usage: '/dailychallenge [subcommand]',
        examples: [
          '/dailychallenge today',
          '/dailychallenge submit',
          '/dailychallenge streak'
        ],
        subcommands: ['today', 'submit', 'hint', 'leaderboard', 'streak'],
        cooldown: '24 hours',
        premium: false,
        new: true,
        popular: true
      },
      {
        name: 'tutor',
        description: 'AI-powered personal tutor with memory',
        usage: '/tutor <action>',
        examples: [
          '/tutor ask "how do closures work?"',
          '/tutor topic javascript',
          '/tutor history'
        ],
        subcommands: ['ask', 'topic', 'history', 'reset', 'goals'],
        cooldown: 'None',
        premium: false,
        new: true,
        popular: true
      },
      {
        name: 'path',
        description: 'Generate personalized learning paths',
        usage: '/path <goal>',
        examples: [
          '/path "become a fullstack developer"',
          '/path "learn machine learning"'
        ],
        subcommands: ['create', 'view', 'progress'],
        cooldown: '1 per day',
        premium: false,
        new: false,
        popular: false
      }
    ]
  },

  competition: {
    id: 'competition',
    name: 'Competition',
    emoji: '🎮',
    color: HELP_COLORS.COMPETITION,
    description: 'Compete in quizzes, tournaments & team battles',
    icon: '⚔️',
    order: 2,
    commands: [
      {
        name: 'quiz',
        description: 'Test your knowledge with AI quizzes',
        usage: '/quiz <topic> [difficulty] [count]',
        examples: [
          '/quiz javascript',
          '/quiz python hard 10',
          '/quiz algorithms medium 5'
        ],
        subcommands: null,
        cooldown: 'None',
        premium: false,
        new: false,
        popular: true
      },
      {
        name: 'challenge',
        description: 'Challenge another user to a duel',
        usage: '/challenge <user> [topic]',
        examples: [
          '/challenge @user',
          '/challenge @user python'
        ],
        subcommands: null,
        cooldown: '5 minutes',
        premium: false,
        new: false,
        popular: true
      },
      {
        name: 'tournament',
        description: 'Weekly competitive tournaments',
        usage: '/tournament <subcommand>',
        examples: [
          '/tournament join',
          '/tournament view',
          '/tournament leaderboard'
        ],
        subcommands: ['view', 'join', 'bracket', 'leaderboard'],
        cooldown: 'None',
        premium: false,
        new: true,
        popular: true
      },
      {
        name: 'teambattle',
        description: 'Server vs Server team competitions',
        usage: '/teambattle <subcommand>',
        examples: [
          '/teambattle status',
          '/teambattle join',
          '/teambattle leaderboard'
        ],
        subcommands: ['status', 'join', 'contribute', 'leaderboard', 'history'],
        cooldown: 'None',
        premium: false,
        new: true,
        popular: false
      },
      {
        name: 'leaderboard',
        description: 'View global and server rankings',
        usage: '/leaderboard [type]',
        examples: [
          '/leaderboard',
          '/leaderboard global',
          '/leaderboard weekly'
        ],
        subcommands: ['server', 'global', 'weekly', 'topic'],
        cooldown: 'None',
        premium: false,
        new: false,
        popular: true
      },
      {
        name: 'arena',
        description: 'Real-time multiplayer quiz battles',
        usage: '/arena <subcommand>',
        examples: [
          '/arena create',
          '/arena join ABC123'
        ],
        subcommands: ['create', 'join', 'status'],
        cooldown: 'None',
        premium: false,
        new: false,
        popular: false
      }
    ]
  },

  ai: {
    id: 'ai',
    name: 'AI Features',
    emoji: '🤖',
    color: HELP_COLORS.AI,
    description: 'Advanced AI-powered learning tools',
    icon: '🧠',
    order: 3,
    commands: [
      {
        name: 'explain',
        description: 'Get detailed explanations of concepts',
        usage: '/explain <concept>',
        examples: [
          '/explain closures',
          '/explain async/await',
          '/explain big O notation'
        ],
        subcommands: null,
        cooldown: '10 seconds',
        premium: false,
        new: false,
        popular: true
      },
      {
        name: 'interview',
        description: 'Practice technical interview questions',
        usage: '/interview <subcommand>',
        examples: [
          '/interview start behavioral',
          '/interview start technical',
          '/interview stats'
        ],
        subcommands: ['start', 'stats'],
        cooldown: 'None',
        premium: false,
        new: true,
        popular: true
      },
      {
        name: 'review',
        description: 'Get AI code review and suggestions',
        usage: '/review',
        examples: ['/review (then paste code)'],
        subcommands: null,
        cooldown: '1 minute',
        premium: false,
        new: false,
        popular: false
      },
      {
        name: 'run',
        description: 'Execute code snippets safely',
        usage: '/run <language>',
        examples: [
          '/run python',
          '/run javascript'
        ],
        subcommands: null,
        cooldown: '30 seconds',
        premium: false,
        new: false,
        popular: true
      },
      {
        name: 'funfact',
        description: 'Get interesting programming facts',
        usage: '/funfact [topic]',
        examples: ['/funfact', '/funfact python'],
        subcommands: null,
        cooldown: '1 minute',
        premium: false,
        new: false,
        popular: false
      }
    ]
  },

  progress: {
    id: 'progress',
    name: 'Progress',
    emoji: '📊',
    color: HELP_COLORS.PROGRESS,
    description: 'Track your learning journey & visualize growth',
    icon: '📈',
    order: 4,
    commands: [
      {
        name: 'profile',
        description: 'View your detailed profile & stats',
        usage: '/profile [user]',
        examples: [
          '/profile',
          '/profile @user'
        ],
        subcommands: null,
        cooldown: 'None',
        premium: false,
        new: false,
        popular: true
      },
      {
        name: 'stats',
        description: 'Detailed statistics and analytics',
        usage: '/stats [category]',
        examples: [
          '/stats',
          '/stats weekly',
          '/stats topics'
        ],
        subcommands: null,
        cooldown: 'None',
        premium: false,
        new: false,
        popular: false
      },
      {
        name: 'skills',
        description: 'Visual skill radar chart',
        usage: '/skills [user]',
        examples: ['/skills', '/skills @user'],
        subcommands: null,
        cooldown: '30 seconds',
        premium: false,
        new: true,
        popular: true
      },
      {
        name: 'heatmap',
        description: 'Activity heatmap visualization',
        usage: '/heatmap [year]',
        examples: ['/heatmap', '/heatmap 2024'],
        subcommands: null,
        cooldown: '30 seconds',
        premium: false,
        new: true,
        popular: true
      },
      {
        name: 'card',
        description: 'Generate shareable achievement cards',
        usage: '/card [style]',
        examples: [
          '/card',
          '/card holo',
          '/card fire'
        ],
        subcommands: null,
        cooldown: '5 minutes',
        premium: false,
        new: true,
        popular: true
      },
      {
        name: 'streak',
        description: 'View and manage your streak',
        usage: '/streak',
        examples: ['/streak'],
        subcommands: null,
        cooldown: 'None',
        premium: false,
        new: false,
        popular: true
      },
      {
        name: 'progress',
        description: 'View your overall progress',
        usage: '/progress',
        examples: ['/progress'],
        subcommands: null,
        cooldown: 'None',
        premium: false,
        new: false,
        popular: false
      },
      {
        name: 'weakspots',
        description: 'Identify areas to improve',
        usage: '/weakspots',
        examples: ['/weakspots'],
        subcommands: null,
        cooldown: 'None',
        premium: false,
        new: false,
        popular: false
      }
    ]
  },

  achievements: {
    id: 'achievements',
    name: 'Achievements',
    emoji: '🏆',
    color: HELP_COLORS.ACHIEVEMENT,
    description: 'Earn badges, certificates & prestige',
    icon: '🎖️',
    order: 5,
    commands: [
      {
        name: 'achievements',
        description: 'Track achievement progress',
        usage: '/achievements [category]',
        examples: [
          '/achievements',
          '/achievements learning'
        ],
        subcommands: null,
        cooldown: 'None',
        premium: false,
        new: false,
        popular: true
      },
      {
        name: 'certificate',
        description: 'Generate achievement certificates',
        usage: '/certificate <type>',
        examples: [
          '/certificate completion python',
          '/certificate progress',
          '/certificate skilltree'
        ],
        subcommands: ['completion', 'progress', 'skilltree'],
        cooldown: '1 per day',
        premium: false,
        new: false,
        popular: true
      },
      {
        name: 'prestige',
        description: 'Reset for permanent XP bonuses',
        usage: '/prestige <subcommand>',
        examples: ['/prestige view', '/prestige ascend'],
        subcommands: ['view', 'ascend'],
        cooldown: 'None',
        premium: false,
        new: true,
        popular: false
      },
      {
        name: 'skilltree',
        description: 'View your skill tree',
        usage: '/skilltree [topic]',
        examples: ['/skilltree', '/skilltree python'],
        subcommands: null,
        cooldown: 'None',
        premium: false,
        new: false,
        popular: false
      }
    ]
  },

  customize: {
    id: 'customize',
    name: 'Customize',
    emoji: '🎨',
    color: HELP_COLORS.CUSTOMIZE,
    description: 'Personalize your experience',
    icon: '✨',
    order: 6,
    commands: [
      {
        name: 'theme',
        description: 'Customize your profile theme',
        usage: '/theme <action>',
        examples: [
          '/theme view',
          '/theme set ocean',
          '/theme preview galaxy'
        ],
        subcommands: ['view', 'set', 'preview'],
        cooldown: 'None',
        premium: false,
        new: true,
        popular: true
      },
      {
        name: 'remind',
        description: 'Set smart learning reminders',
        usage: '/remind <action>',
        examples: [
          '/remind set 09:00 "Study time!"',
          '/remind list',
          '/remind delete abc123'
        ],
        subcommands: ['set', 'list', 'delete', 'pause'],
        cooldown: 'None',
        premium: false,
        new: true,
        popular: false
      },
      {
        name: 'setup',
        description: 'Configure bot for your server',
        usage: '/setup',
        examples: ['/setup'],
        subcommands: null,
        cooldown: 'None',
        premium: false,
        new: false,
        popular: false
      }
    ]
  },

  events: {
    id: 'events',
    name: 'Events',
    emoji: '🎪',
    color: HELP_COLORS.EVENT,
    description: 'Seasonal events & limited-time content',
    icon: '🎉',
    order: 7,
    commands: [
      {
        name: 'event',
        description: 'View current seasonal events',
        usage: '/event <subcommand>',
        examples: [
          '/event current',
          '/event progress',
          '/event rewards'
        ],
        subcommands: ['current', 'progress', 'rewards', 'leaderboard'],
        cooldown: 'None',
        premium: false,
        new: true,
        popular: true
      },
      {
        name: 'daily',
        description: 'Claim daily rewards & bonuses',
        usage: '/daily',
        examples: ['/daily'],
        subcommands: null,
        cooldown: '24 hours',
        premium: false,
        new: false,
        popular: true
      },
      {
        name: 'weekly',
        description: 'View weekly challenges',
        usage: '/weekly',
        examples: ['/weekly'],
        subcommands: null,
        cooldown: 'None',
        premium: false,
        new: false,
        popular: false
      }
    ]
  },

  utility: {
    id: 'utility',
    name: 'Utility',
    emoji: '⚙️',
    color: HELP_COLORS.SETTINGS,
    description: 'Helpful tools & information',
    icon: '🔧',
    order: 8,
    commands: [
      {
        name: 'help',
        description: 'This command - explore all features',
        usage: '/help [command]',
        examples: ['/help', '/help quiz'],
        subcommands: null,
        cooldown: 'None',
        premium: false,
        new: false,
        popular: true
      },
      {
        name: 'topics',
        description: 'Browse available learning topics',
        usage: '/topics [search]',
        examples: ['/topics', '/topics web'],
        subcommands: null,
        cooldown: 'None',
        premium: false,
        new: false,
        popular: false
      },
      {
        name: 'ping',
        description: 'Check bot latency',
        usage: '/ping',
        examples: ['/ping'],
        subcommands: null,
        cooldown: 'None',
        premium: false,
        new: false,
        popular: false
      },
      {
        name: 'invite',
        description: 'Invite MentorAI to your server',
        usage: '/invite',
        examples: ['/invite'],
        subcommands: null,
        cooldown: 'None',
        premium: false,
        new: false,
        popular: false
      },
      {
        name: 'feedback',
        description: 'Send feedback to developers',
        usage: '/feedback <message>',
        examples: ['/feedback Great bot!'],
        subcommands: null,
        cooldown: '1 hour',
        premium: false,
        new: false,
        popular: false
      },
      {
        name: 'about',
        description: 'Learn about MentorAI',
        usage: '/about',
        examples: ['/about'],
        subcommands: null,
        cooldown: 'None',
        premium: false,
        new: false,
        popular: false
      },
      {
        name: 'referral',
        description: 'Share your referral code',
        usage: '/referral',
        examples: ['/referral'],
        subcommands: null,
        cooldown: 'None',
        premium: false,
        new: false,
        popular: false
      },
      {
        name: 'share',
        description: 'Share your achievements',
        usage: '/share',
        examples: ['/share'],
        subcommands: null,
        cooldown: 'None',
        premium: false,
        new: false,
        popular: false
      }
    ]
  }
};

// ═══════════════════════════════════════════════════════════════════
// QUICK ACTION CONFIGURATIONS
// ═══════════════════════════════════════════════════════════════════

export const QUICK_ACTIONS = {
  row1: [
    { id: 'quick_quiz', label: 'Quick Quiz', emoji: '🎯', style: ButtonStyle.Primary, command: 'quiz', needsInput: true, inputLabel: 'topic' },
    { id: 'quick_lesson', label: 'Start Lesson', emoji: '📚', style: ButtonStyle.Success, command: 'learn', needsInput: true, inputLabel: 'topic' },
    { id: 'quick_daily', label: 'Daily Bonus', emoji: '🎁', style: ButtonStyle.Danger, command: 'daily', needsInput: false },
    { id: 'quick_profile', label: 'My Profile', emoji: '👤', style: ButtonStyle.Secondary, command: 'profile', needsInput: false }
  ],
  row2: [
    { id: 'quick_flashcard', label: 'Flashcards', emoji: '🃏', style: ButtonStyle.Primary, command: 'flashcard', needsInput: false, subcommand: 'study' },
    { id: 'quick_challenge', label: 'Daily Challenge', emoji: '💻', style: ButtonStyle.Success, command: 'dailychallenge', needsInput: false, subcommand: 'today' },
    { id: 'quick_tournament', label: 'Tournament', emoji: '🏆', style: ButtonStyle.Danger, command: 'tournament', needsInput: false, subcommand: 'view' },
    { id: 'quick_tutor', label: 'AI Tutor', emoji: '🤖', style: ButtonStyle.Secondary, command: 'tutor', needsInput: true, inputLabel: 'question' }
  ]
};

// ═══════════════════════════════════════════════════════════════════
// SMART SUGGESTIONS ENGINE CONFIG
// ═══════════════════════════════════════════════════════════════════

export const SUGGESTION_RULES = [
  {
    condition: (user) => !user || (user.completedLessons?.length || 0) === 0,
    suggestion: { command: '/learn', text: 'Start your first lesson!', emoji: '📚', priority: 10 }
  },
  {
    condition: (user) => (user?.streak || 0) === 0,
    suggestion: { command: '/daily', text: 'Start a streak today!', emoji: '🔥', priority: 9 }
  },
  {
    condition: (user) => (user?.quizzesTaken || 0) < 5,
    suggestion: { command: '/quiz', text: 'Take more quizzes to level up!', emoji: '🎯', priority: 8 }
  },
  {
    condition: (user) => {
      const accuracy = user?.totalQuestions > 0 
        ? Math.round((user.correctAnswers / user.totalQuestions) * 100) 
        : 0;
      return accuracy < 50 && (user?.totalQuestions || 0) > 5;
    },
    suggestion: { command: '/flashcard study', text: 'Use flashcards to improve!', emoji: '🃏', priority: 8 }
  },
  {
    condition: (user) => (user?.level || 1) >= 10 && !(user?.interviewStats?.totalSessions),
    suggestion: { command: '/interview start', text: 'Ready for interview prep!', emoji: '💼', priority: 7 }
  },
  {
    condition: (user) => (user?.level || 1) >= 5 && !(user?.tournamentStats?.participated),
    suggestion: { command: '/tournament join', text: "Join this week's tournament!", emoji: '🏆', priority: 7 }
  },
  {
    condition: (user) => (user?.streak || 0) >= 7,
    suggestion: { command: '/card', text: 'Generate your achievement card!', emoji: '🎴', priority: 6 }
  },
  {
    condition: (user) => (user?.level || 1) >= 25,
    suggestion: { command: '/prestige view', text: 'Check out the prestige system!', emoji: '⭐', priority: 5 }
  },
  {
    condition: (user) => (user?.streak || 0) >= 3,
    suggestion: { command: '/challenge @friend', text: 'Challenge a friend!', emoji: '⚔️', priority: 5 }
  },
  {
    condition: () => true, // Default
    suggestion: { command: '/tutor ask', text: 'Chat with AI tutor!', emoji: '🤖', priority: 1 }
  }
];

// ═══════════════════════════════════════════════════════════════════
// TIPS AND TRICKS
// ═══════════════════════════════════════════════════════════════════

export const TIPS = [
  '💡 Use `/flashcard generate <topic>` to auto-create study cards!',
  '💡 Your streak multiplier maxes out at 2x after 30 days!',
  '💡 Challenge friends with `/challenge @user` to earn bonus XP!',
  '💡 Use `/tutor` for personalized tutoring that remembers your progress!',
  '💡 Complete daily challenges for exclusive rewards!',
  '💡 Join tournaments every week for competitive learning!',
  '💡 Generate shareable trading cards with `/card`!',
  '💡 Set reminders with `/remind` to never miss a study session!',
  '💡 Reach level 25 to unlock the prestige system!',
  '💡 Use `/skills` to visualize your skill distribution!',
  '💡 Team up with your server for team battles!',
  '💡 Earn certificates to showcase your achievements!',
  '💡 Use `/heatmap` to see your GitHub-style activity calendar!',
  '💡 Interview prep with `/interview` for real job readiness!',
  '💡 Custom themes unlock as you level up - check `/theme`!'
];
