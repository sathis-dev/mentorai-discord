// src/utils/responsiveUI.js
/**
 * Responsive UI Factory
 * Automatically serves mobile-optimized or desktop UI based on context
 * Mobile-first approach for Discord bots
 */

import * as mobileEmbeds from '../embeds/mobile/index.js';
import { MOBILE } from './mobileUI.js';

/**
 * Responsive Embed Factory
 */
class ResponsiveUI {
  /**
   * Detect if user is likely on mobile
   * Note: Discord doesn't provide direct device info, so we use heuristics
   * @param {Object} interaction - Discord interaction object
   * @returns {boolean} - Whether user is likely on mobile
   */
  static detectMobile(interaction) {
    // Heuristic 1: Check if user has mobile status via presence
    try {
      const member = interaction.member;
      if (member?.presence?.clientStatus?.mobile) {
        return true;
      }
    } catch (e) {
      // Presence may not be available
    }
    
    // Heuristic 2: Check user's stored preference (if available)
    // This can be extended to read from database
    
    // Default: Mobile-first approach (most Discord users are on mobile)
    return true;
  }
  
  /**
   * Get the appropriate embed based on type and data
   * @param {string} type - The embed type identifier
   * @param {Object} data - Data to pass to the embed generator
   * @param {boolean|null} forceMobile - Force mobile (true) or desktop (false), null for auto
   * @returns {Object} - Discord embed response object
   */
  static getEmbed(type, data = {}, forceMobile = null) {
    const isMobile = forceMobile ?? true; // Default to mobile-first
    
    // All embeds are mobile by default
    const embedMap = {
      // ═══════════════════════════════════════════════════════════════
      // HELP
      // ═══════════════════════════════════════════════════════════════
      'help': () => mobileEmbeds.createMobileHelpEmbed(data.user, data.isNewUser, data.client),
      'help_quickstart': () => mobileEmbeds.createMobileQuickStartEmbed(),
      'help_category': () => mobileEmbeds.createMobileHelpCategoryEmbed(data.category),
      'help_more': () => mobileEmbeds.createMobileMoreCommandsEmbed(),
      
      // ═══════════════════════════════════════════════════════════════
      // LEARNING
      // ═══════════════════════════════════════════════════════════════
      'learn': () => mobileEmbeds.createMobileLearnEmbed(data.topic, data.content, data.user, data.keyPoints),
      'learn_loading': () => mobileEmbeds.createMobileLearnLoadingEmbed(data.topic),
      'learn_topics': () => mobileEmbeds.createMobileTopicSelectEmbed(),
      'xp_gain': () => mobileEmbeds.createMobileXPGainEmbed(data.xp, data.total, data.leveledUp, data.newLevel),
      
      // ═══════════════════════════════════════════════════════════════
      // QUIZ
      // ═══════════════════════════════════════════════════════════════
      'quiz_start': () => mobileEmbeds.createMobileQuizStartEmbed(data.topic, data.difficulty, data.user),
      'quiz_question': () => mobileEmbeds.createMobileQuizQuestionEmbed(data.question, data.num, data.total, data.score, data.difficulty),
      'quiz_correct': () => mobileEmbeds.createMobileCorrectEmbed(data.explanation, data.xp),
      'quiz_wrong': () => mobileEmbeds.createMobileWrongEmbed(data.answer, data.explanation),
      'quiz_results': () => mobileEmbeds.createMobileQuizResultsEmbed(data.score, data.total, data.xp, data.bonuses, data.user, data.achievements),
      
      // ═══════════════════════════════════════════════════════════════
      // PROFILE
      // ═══════════════════════════════════════════════════════════════
      'profile': () => mobileEmbeds.createMobileProfileEmbed(data.user, data.member),
      'profile_stats': () => mobileEmbeds.createMobileStatsEmbed(data.user),
      'profile_skills': () => mobileEmbeds.createMobileSkillTreeEmbed(data.user),
      
      // ═══════════════════════════════════════════════════════════════
      // DAILY
      // ═══════════════════════════════════════════════════════════════
      'daily_preview': () => mobileEmbeds.createMobileDailyPreviewEmbed(data.user),
      'daily_spin': () => mobileEmbeds.createMobileDailySpinEmbed(data.frame),
      'daily_result': () => mobileEmbeds.createMobileDailyResultEmbed(data.base, data.streak, data.total, data.days, data.user),
      'daily_claimed': () => mobileEmbeds.createMobileDailyAlreadyClaimedEmbed(data.hours, data.minutes, data.user),
      
      // ═══════════════════════════════════════════════════════════════
      // ACHIEVEMENTS
      // ═══════════════════════════════════════════════════════════════
      'achievements': () => mobileEmbeds.createMobileAchievementsEmbed(data.user),
      'achievement_category': () => mobileEmbeds.createMobileAchievementCategoryEmbed(data.category, data.user),
      'achievement_unlock': () => mobileEmbeds.createMobileAchievementUnlockEmbed(data.achievementId),
      'achievement_hints': () => mobileEmbeds.createMobileAchievementHintsEmbed(data.user),
      
      // ═══════════════════════════════════════════════════════════════
      // LEADERBOARD
      // ═══════════════════════════════════════════════════════════════
      'leaderboard': () => mobileEmbeds.createMobileLeaderboardEmbed(data.users, data.page, data.totalPages, data.currentUser, data.sortBy),
      'leaderboard_me': () => mobileEmbeds.createMobileLeaderboardMeEmbed(data.surrounding, data.currentUser),
      'leaderboard_server': () => mobileEmbeds.createMobileServerLeaderboardEmbed(data.users, data.serverName),
      
      // ═══════════════════════════════════════════════════════════════
      // RUN CODE
      // ═══════════════════════════════════════════════════════════════
      'run_select': () => mobileEmbeds.createMobileRunSelectEmbed(),
      'run_loading': () => mobileEmbeds.createMobileRunLoadingEmbed(data.language),
      'run_result': () => mobileEmbeds.createMobileRunResultEmbed(data.success, data.code, data.output, data.language, data.time, data.user),
      'run_more': () => mobileEmbeds.createMobileMoreLanguagesEmbed(),
      
      // ═══════════════════════════════════════════════════════════════
      // STREAK
      // ═══════════════════════════════════════════════════════════════
      'streak': () => mobileEmbeds.createMobileStreakEmbed(data.user),
      'streak_warning': () => mobileEmbeds.createMobileStreakWarningEmbed(data.user, data.hours),
      'streak_broken': () => mobileEmbeds.createMobileStreakBrokenEmbed(data.previousStreak),
      'streak_milestone': () => mobileEmbeds.createMobileStreakMilestoneEmbed(data.streak, data.bonusXP),
      
      // ═══════════════════════════════════════════════════════════════
      // CHALLENGE
      // ═══════════════════════════════════════════════════════════════
      'challenge_invite': () => mobileEmbeds.createMobileChallengeInviteEmbed(data.challenger, data.opponent, data.topic),
      'challenge_question': () => mobileEmbeds.createMobileChallengeQuestionEmbed(data.question, data.num, data.challenger, data.opponent, data.scores),
      'challenge_result': () => mobileEmbeds.createMobileChallengeResultEmbed(data.winner, data.loser, data.scores, data.topic),
      'challenge_waiting': () => mobileEmbeds.createMobileChallengeWaitingEmbed(data.challenger, data.opponent, data.topic),
      'challenge_declined': () => mobileEmbeds.createMobileChallengeDeclinedEmbed(data.opponent),
      
      // ═══════════════════════════════════════════════════════════════
      // ARENA
      // ═══════════════════════════════════════════════════════════════
      'arena_lobby': () => mobileEmbeds.createMobileArenaLobbyEmbed(data.arena),
      'arena_question': () => mobileEmbeds.createMobileArenaQuestionEmbed(data.question, data.num, data.total, data.scores),
      'arena_results': () => mobileEmbeds.createMobileArenaResultsEmbed(data.scores, data.topic),
      'arena_join': () => mobileEmbeds.createMobileArenaJoinEmbed(),
      'arena_waiting': () => mobileEmbeds.createMobileArenaWaitingEmbed(data.arena),
      
      // ═══════════════════════════════════════════════════════════════
      // INSIGHTS
      // ═══════════════════════════════════════════════════════════════
      'insights': () => mobileEmbeds.createMobileInsightsEmbed(data.user, data.insights),
      'insights_loading': () => mobileEmbeds.createMobileInsightsLoadingEmbed(),
      'insights_detail': () => mobileEmbeds.createMobileInsightsDetailEmbed(data.user, data.category, data.insights),
      'insights_weekly': () => mobileEmbeds.createMobileWeeklyInsightsEmbed(data.user, data.weeklyStats),
      
      // ═══════════════════════════════════════════════════════════════
      // QUICK QUIZ
      // ═══════════════════════════════════════════════════════════════
      'quickquiz': () => mobileEmbeds.createMobileQuickQuizEmbed(data.question, data.topic),
      'quickquiz_result': () => mobileEmbeds.createMobileQuickQuizResultEmbed(data.correct, data.answer, data.explanation, data.xp),
      'quickquiz_topics': () => mobileEmbeds.createMobileQuickQuizTopicEmbed(),
      'quickquiz_streak': () => mobileEmbeds.createMobileQuickQuizStreakEmbed(data.streakCount, data.bonusXP)
    };
    
    const embedFn = embedMap[type];
    if (!embedFn) {
      console.warn(`Unknown embed type: ${type}`);
      return null;
    }
    
    try {
      return embedFn();
    } catch (error) {
      console.error(`Error generating embed "${type}":`, error);
      return null;
    }
  }
  
  /**
   * Get MOBILE design constants
   */
  static get constants() {
    return MOBILE;
  }
  
  /**
   * Check if an embed type exists
   * @param {string} type - The embed type to check
   * @returns {boolean}
   */
  static hasEmbed(type) {
    const validTypes = [
      'help', 'help_quickstart', 'help_category', 'help_more',
      'learn', 'learn_loading', 'learn_topics', 'xp_gain',
      'quiz_start', 'quiz_question', 'quiz_correct', 'quiz_wrong', 'quiz_results',
      'profile', 'profile_stats', 'profile_skills',
      'daily_preview', 'daily_spin', 'daily_result', 'daily_claimed',
      'achievements', 'achievement_category', 'achievement_unlock', 'achievement_hints',
      'leaderboard', 'leaderboard_me', 'leaderboard_server',
      'run_select', 'run_loading', 'run_result', 'run_more',
      'streak', 'streak_warning', 'streak_broken', 'streak_milestone',
      'challenge_invite', 'challenge_question', 'challenge_result', 'challenge_waiting', 'challenge_declined',
      'arena_lobby', 'arena_question', 'arena_results', 'arena_join', 'arena_waiting',
      'insights', 'insights_loading', 'insights_detail', 'insights_weekly',
      'quickquiz', 'quickquiz_result', 'quickquiz_topics', 'quickquiz_streak'
    ];
    return validTypes.includes(type);
  }
}

export default ResponsiveUI;
export { ResponsiveUI, MOBILE };
