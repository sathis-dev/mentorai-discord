/**
 * Emergency Fixes - Quick fixes for competition day issues
 */

import dotenv from 'dotenv';
dotenv.config();

const emergencyFixes = {
  /**
   * Enable AI fallback mode (use curated questions)
   */
  async enableAIFallback() {
    console.log('🚨 Enabling AI fallback mode...');
    process.env.USE_AI_FALLBACK = 'true';
    
    console.log('✅ AI fallback enabled');
    console.log('   Quizzes will use curated question bank');
    console.log('   Located at: src/data/quizzes/');
  },
  
  /**
   * Enable read cache for slow database
   */
  async enableReadCache() {
    console.log('🚨 Enabling enhanced read cache...');
    
    const { cache } = await import('../src/utils/cache.js');
    
    // Increase cache TTL
    cache.defaultTTL = 60 * 1000; // 1 minute
    
    console.log('✅ Read cache enabled (60s TTL)');
  },
  
  /**
   * Disable rate limiting for demo
   */
  async disableRateLimiting() {
    console.log('🚨 Disabling rate limiting...');
    
    const { rateLimiter } = await import('../src/utils/rateLimiter.js');
    
    // Override check to always allow
    rateLimiter.check = () => ({ allowed: true, remaining: 999 });
    
    console.log('✅ Rate limiting disabled');
    console.log('   All commands now unrestricted');
  },
  
  /**
   * Enable single-player mode (disable multiplayer)
   */
  async enableSinglePlayerMode() {
    console.log('🚨 Enabling single-player mode...');
    
    process.env.DISABLE_MULTIPLAYER = 'true';
    
    console.log('✅ Single-player mode enabled');
    console.log('   Challenges and arena disabled');
    console.log('   Users will see: "Multiplayer temporarily unavailable"');
  },
  
  /**
   * Reset a stuck user
   */
  async resetUser(discordId) {
    if (!discordId) {
      console.log('Usage: resetUser <discordId>');
      return;
    }
    
    console.log(`🚨 Resetting user ${discordId}...`);
    
    const mongoose = await import('mongoose');
    const { User } = await import('../src/database/models/User.js');
    
    await mongoose.connect(process.env.DATABASE_URL);
    
    const result = await User.updateOne(
      { discordId },
      {
        $set: {
          xp: 0,
          level: 1,
          streak: 0,
          'prestige.level': 0,
          'prestige.bonusMultiplier': 1.0
        },
        $unset: {
          activeQuiz: '',
          activeBattle: ''
        }
      }
    );
    
    if (result.modifiedCount > 0) {
      console.log(`✅ User ${discordId} reset to level 1`);
    } else {
      console.log(`⚠️ User ${discordId} not found or already reset`);
    }
    
    await mongoose.disconnect();
  },
  
  /**
   * Clear all active sessions
   */
  async clearActiveSessions() {
    console.log('🚨 Clearing all active sessions...');
    
    const mongoose = await import('mongoose');
    
    await mongoose.connect(process.env.DATABASE_URL);
    
    const { QuizSession } = await import('../src/database/models/QuizSession.js');
    const { BattleSession } = await import('../src/database/models/BattleSession.js');
    
    const quizResult = await QuizSession.deleteMany({ status: { $ne: 'completed' } });
    const battleResult = await BattleSession.deleteMany({ status: { $ne: 'completed' } });
    
    console.log(`✅ Cleared ${quizResult.deletedCount} quiz sessions`);
    console.log(`✅ Cleared ${battleResult.deletedCount} battle sessions`);
    
    await mongoose.disconnect();
  },
  
  /**
   * Show system status
   */
  async showStatus() {
    console.log('\n📊 SYSTEM STATUS');
    console.log('═'.repeat(40));
    
    // Process info
    console.log('\n🖥️ Process:');
    console.log(`   PID: ${process.pid}`);
    console.log(`   Uptime: ${Math.round(process.uptime())}s`);
    console.log(`   Node Version: ${process.version}`);
    
    // Memory
    const mem = process.memoryUsage();
    console.log('\n💾 Memory:');
    console.log(`   Heap Used: ${Math.round(mem.heapUsed / 1024 / 1024)} MB`);
    console.log(`   Heap Total: ${Math.round(mem.heapTotal / 1024 / 1024)} MB`);
    console.log(`   RSS: ${Math.round(mem.rss / 1024 / 1024)} MB`);
    
    // Environment
    console.log('\n🔑 API Keys:');
    console.log(`   DISCORD_TOKEN: ${process.env.DISCORD_TOKEN ? '✅ Set' : '❌ Missing'}`);
    console.log(`   OPENAI_API_KEY: ${process.env.OPENAI_API_KEY ? '✅ Set' : '❌ Missing'}`);
    console.log(`   GEMINI_API_KEY: ${process.env.GEMINI_API_KEY ? '✅ Set' : '❌ Missing'}`);
    console.log(`   ANTHROPIC_API_KEY: ${process.env.ANTHROPIC_API_KEY ? '✅ Set' : '❌ Missing'}`);
    console.log(`   DATABASE_URL: ${process.env.DATABASE_URL ? '✅ Set' : '❌ Missing'}`);
    
    // Database
    try {
      const mongoose = await import('mongoose');
      await mongoose.connect(process.env.DATABASE_URL, { serverSelectionTimeoutMS: 5000 });
      console.log('\n🗄️ Database: ✅ Connected');
      
      const { User } = await import('../src/database/models/User.js');
      const userCount = await User.countDocuments();
      console.log(`   Users: ${userCount}`);
      
      await mongoose.disconnect();
    } catch (error) {
      console.log('\n🗄️ Database: ❌ Not connected');
      console.log(`   Error: ${error.message}`);
    }
    
    console.log('\n' + '═'.repeat(40));
  },
  
  /**
   * Warm up AI providers
   */
  async warmUpAI() {
    console.log('🚨 Warming up AI providers...');
    
    try {
      const { aiOrchestrator } = await import('../src/ai/orchestrator.js');
      
      // Make test calls to each provider
      const testPrompt = 'Say "ready" in one word.';
      
      console.log('   Testing Gemini...');
      await aiOrchestrator.executeWithProvider('gemini', async (provider) => {
        if (provider.module.chat) {
          return await provider.module.chat(testPrompt);
        }
        return 'ready';
      });
      console.log('   ✅ Gemini ready');
      
      console.log('   Testing OpenAI...');
      await aiOrchestrator.executeWithProvider('openai', async (provider) => {
        if (provider.module.chat) {
          return await provider.module.chat(testPrompt);
        }
        return 'ready';
      });
      console.log('   ✅ OpenAI ready');
      
      console.log('✅ All AI providers warmed up');
    } catch (error) {
      console.log(`⚠️ Some providers may not be ready: ${error.message}`);
    }
  },
  
  /**
   * Create demo accounts for judges
   */
  async createJudgeAccounts() {
    console.log('🚨 Creating judge demo accounts...');
    
    const mongoose = await import('mongoose');
    const { User } = await import('../src/database/models/User.js');
    
    await mongoose.connect(process.env.DATABASE_URL);
    
    const judgeAccounts = [
      {
        discordId: 'judge_demo_1',
        username: 'JudgeDemo1',
        level: 25,
        xp: 5000,
        streak: 7,
        quizStats: { taken: 50, correct: 40, total: 50, accuracy: 80 }
      },
      {
        discordId: 'judge_demo_2',
        username: 'JudgeDemo2',
        level: 50,
        xp: 0,
        streak: 14,
        prestige: { level: 1, bonusMultiplier: 1.05 },
        quizStats: { taken: 100, correct: 85, total: 100, accuracy: 85 }
      }
    ];
    
    for (const account of judgeAccounts) {
      await User.findOneAndUpdate(
        { discordId: account.discordId },
        account,
        { upsert: true }
      );
      console.log(`   ✅ Created ${account.username}`);
    }
    
    console.log('✅ Judge accounts ready');
    await mongoose.disconnect();
  },
  
  /**
   * Quick health check
   */
  async healthCheck() {
    console.log('🏥 Running health check...\n');
    
    let healthy = true;
    
    // Check environment
    const requiredEnvVars = ['DISCORD_TOKEN', 'DATABASE_URL'];
    for (const envVar of requiredEnvVars) {
      if (!process.env[envVar]) {
        console.log(`   ❌ Missing: ${envVar}`);
        healthy = false;
      } else {
        console.log(`   ✅ ${envVar}`);
      }
    }
    
    // Check database
    try {
      const mongoose = await import('mongoose');
      await mongoose.connect(process.env.DATABASE_URL, { serverSelectionTimeoutMS: 5000 });
      console.log('   ✅ Database connection');
      await mongoose.disconnect();
    } catch (error) {
      console.log('   ❌ Database connection');
      healthy = false;
    }
    
    console.log('\n' + (healthy ? '✅ System healthy' : '❌ Issues detected'));
    return healthy;
  }
};

// CLI runner
const command = process.argv[2];
const args = process.argv.slice(3);

if (command && emergencyFixes[command]) {
  emergencyFixes[command](...args)
    .then(() => process.exit(0))
    .catch(error => {
      console.error('Error:', error);
      process.exit(1);
    });
} else {
  console.log('🛠️ Emergency Fixes - Available Commands:\n');
  Object.keys(emergencyFixes).forEach(cmd => {
    console.log(`   node scripts/emergencyFixes.js ${cmd}`);
  });
  console.log('');
}

export default emergencyFixes;
