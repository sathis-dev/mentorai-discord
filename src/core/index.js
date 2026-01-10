/**
 * Core Systems Index
 * 
 * Exports all mathematical foundation systems
 */

export { XPSystem } from './xpSystem.js';
export { StreakSystem } from './streakSystem.js';
export { PrestigeSystem } from './prestigeSystem.js';
export { TierSystem } from './tierSystem.js';
export { AccuracySystem } from './accuracySystem.js';

// Default export for convenience
export default {
  XPSystem: require('./xpSystem.js').XPSystem,
  StreakSystem: require('./streakSystem.js').StreakSystem,
  PrestigeSystem: require('./prestigeSystem.js').PrestigeSystem,
  TierSystem: require('./tierSystem.js').TierSystem,
  AccuracySystem: require('./accuracySystem.js').AccuracySystem
};
