/**
 * Services Index - Central Export for All Services
 * 
 * Usage:
 * import { xpService, quizEngine, achievementService } from './services/index.js';
 */

// Core Services
export { XPService, xpService } from './xpService.js';
export { AchievementService } from './achievementService.js';
export { SkillService } from './skillService.js';

// Quiz Services
export { QuizEngine } from './quiz/engine.js';
export * from './quiz/index.js';

// Multiplayer Services
export { ChallengeManager } from './multiplayer/challengeManager.js';
export { ArenaManager } from './multiplayer/arenaManager.js';
export { StudyPartyManager } from './multiplayer/studyPartyManager.js';
export * from './multiplayer/index.js';

// Create singleton instances for commonly used services
import { AchievementService } from './achievementService.js';
import { SkillService } from './skillService.js';
import { QuizEngine } from './quiz/engine.js';
import { ChallengeManager } from './multiplayer/challengeManager.js';
import { ArenaManager } from './multiplayer/arenaManager.js';
import { StudyPartyManager } from './multiplayer/studyPartyManager.js';

export const achievementService = new AchievementService();
export const skillService = new SkillService();
export const quizEngine = new QuizEngine();
export const challengeManager = new ChallengeManager();
export const arenaManager = new ArenaManager();
export const studyPartyManager = new StudyPartyManager();

// Default export with all services
export default {
  achievementService,
  skillService,
  quizEngine,
  challengeManager,
  arenaManager,
  studyPartyManager
};
