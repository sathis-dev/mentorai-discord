// src/embeds/mobile/index.js
// Central export for all mobile embeds

// Help
export * from './helpMobile.js';

// Learn
export * from './learnMobile.js';

// Quiz
export * from './quizMobile.js';

// Profile
export * from './profileMobile.js';

// Daily
export * from './dailyMobile.js';

// Achievements
export * from './achievementsMobile.js';

// Leaderboard
export * from './leaderboardMobile.js';

// Run Code
export * from './runMobile.js';

// Streak
export * from './streakMobile.js';

// Challenge
export * from './challengeMobile.js';

// Arena
export * from './arenaMobile.js';

// Insights
export * from './insightsMobile.js';

// Quick Quiz
export * from './quickquizMobile.js';

// Re-export defaults for convenience
import helpMobile from './helpMobile.js';
import learnMobile from './learnMobile.js';
import quizMobile from './quizMobile.js';
import profileMobile from './profileMobile.js';
import dailyMobile from './dailyMobile.js';
import achievementsMobile from './achievementsMobile.js';
import leaderboardMobile from './leaderboardMobile.js';
import runMobile from './runMobile.js';
import streakMobile from './streakMobile.js';
import challengeMobile from './challengeMobile.js';
import arenaMobile from './arenaMobile.js';
import insightsMobile from './insightsMobile.js';
import quickquizMobile from './quickquizMobile.js';

export default {
  ...helpMobile,
  ...learnMobile,
  ...quizMobile,
  ...profileMobile,
  ...dailyMobile,
  ...achievementsMobile,
  ...leaderboardMobile,
  ...runMobile,
  ...streakMobile,
  ...challengeMobile,
  ...arenaMobile,
  ...insightsMobile,
  ...quickquizMobile
};
