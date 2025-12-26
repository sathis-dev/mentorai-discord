import { EmbedBuilder } from 'discord.js';

const COLORS = {
  LEARNING: 0x3498DB,
  GAMIFICATION: 0xE91E63,
  PROGRESS: 0x9B59B6,
  SOCIAL: 0xE67E22,
  UTILITY: 0x95A5A6,
  PRIMARY: 0x5865F2,
  SUCCESS: 0x2ECC71,
  GOLD: 0xFFD700
};

export function createLearningHelpEmbed() {
  return new EmbedBuilder()
    .setTitle('📚 Learning Commands')
    .setColor(COLORS.LEARNING)
    .setDescription(
      '```ansi\n' +
      '\u001b[1;36m🎓 Master any topic with AI-powered learning!\u001b[0m\n' +
      '```'
    )
    .addFields(
      {
        name: '📖 /learn `<topic>`',
        value: '> Get an AI-generated lesson on any programming topic\n' +
          '> **Example:** `/learn topic:React Hooks`\n' +
          '> 📝 Includes code examples, key points & practice challenges',
        inline: false
      },
      {
        name: '🎯 /quiz `<topic>` `[questions]` `[difficulty]`',
        value: '> Test your knowledge with AI-generated quizzes\n' +
          '> **Example:** `/quiz topic:JavaScript questions:5 difficulty:medium`\n' +
          '> 🏆 Earn XP for correct answers!',
        inline: false
      },
      {
        name: '🧠 /explain `<concept>`',
        value: '> Get detailed AI explanations of programming concepts\n' +
          '> **Example:** `/explain concept:closures`\n' +
          '> 💡 Includes analogies & common mistakes',
        inline: false
      },
      {
        name: '📋 /topics',
        value: '> Browse popular learning topics with interactive menu\n' +
          '> 🔥 Discover trending topics & recommendations',
        inline: false
      }
    )
    .setFooter({ text: '💡 Tip: Use autocomplete for topic suggestions!' })
    .setTimestamp();
}

export function createGamificationHelpEmbed() {
  return new EmbedBuilder()
    .setTitle('🎮 Gamification Commands')
    .setColor(COLORS.GAMIFICATION)
    .setDescription(
      '```ansi\n' +
      '\u001b[1;35m🏆 Level up, earn XP, and unlock achievements!\u001b[0m\n' +
      '```'
    )
    .addFields(
      {
        name: '🎁 /daily',
        value: '> Claim your daily XP bonus + AI study tips\n' +
          '> 🔥 Streak bonuses for consecutive days!\n' +
          '> **Rewards:** 75 base XP + streak multipliers',
        inline: false
      },
      {
        name: '🔥 /streak',
        value: '> Check your learning streak status\n' +
          '> 📈 View milestones & upcoming rewards\n' +
          '> **Tip:** Login daily to maintain your streak!',
        inline: false
      },
      {
        name: '🏆 /achievements',
        value: '> View all achievements & your progress\n' +
          '> 🎖️ Unlock badges for milestones\n' +
          '> **Categories:** Learning, Streaks, Quizzes, Levels',
        inline: false
      },
      {
        name: '✨ XP Rewards',
        value: 
          '```diff\n' +
          '+ Quiz Correct Answer: 25 XP\n' +
          '+ Quiz Completion: 50 XP\n' +
          '+ Perfect Score: 100 XP BONUS\n' +
          '+ Lesson Completed: 40 XP\n' +
          '+ Daily Bonus: 75+ XP\n' +
          '```',
        inline: false
      }
    )
    .setFooter({ text: '⭐ Every action earns XP towards your next level!' })
    .setTimestamp();
}

export function createProgressHelpEmbed() {
  return new EmbedBuilder()
    .setTitle('📊 Progress & Stats Commands')
    .setColor(COLORS.PROGRESS)
    .setDescription(
      '```ansi\n' +
      '\u001b[1;34m📈 Track your learning journey!\u001b[0m\n' +
      '```'
    )
    .addFields(
      {
        name: '👤 /profile `[@user]`',
        value: '> View detailed profile with tier badges\n' +
          '> 📊 Stats, achievements, and XP progress\n' +
          '> 🎨 Tier colors: Novice → Legendary',
        inline: false
      },
      {
        name: '📈 /progress `[@user]`',
        value: '> Quick progress overview\n' +
          '> 📉 Level, XP, streak, accuracy stats',
        inline: false
      },
      {
        name: '🏅 /leaderboard',
        value: '> See top learners globally\n' +
          '> 🥇🥈🥉 Compete for top positions\n' +
          '> 📄 Paginated with navigation',
        inline: false
      },
      {
        name: '📊 /stats',
        value: '> View global MentorAI statistics\n' +
          '> 👥 Total users, quizzes, lessons generated',
        inline: false
      },
      {
        name: '🎖️ Tier System',
        value: 
          '```\n' +
          '🌱 Novice    (Lv 1-4)   │ ⚔️ Iron      (Lv 5-9)\n' +
          '🥉 Bronze    (Lv 10-14) │ 🥈 Silver    (Lv 15-19)\n' +
          '🥇 Gold      (Lv 20-29) │ 🔮 Platinum  (Lv 30-39)\n' +
          '💎 Diamond   (Lv 40-49) │ 👑 Legendary (Lv 50+)\n' +
          '```',
        inline: false
      }
    )
    .setFooter({ text: '📈 Check your progress regularly to stay motivated!' })
    .setTimestamp();
}

export function createSocialHelpEmbed() {
  return new EmbedBuilder()
    .setTitle('👥 Social Features')
    .setColor(COLORS.SOCIAL)
    .setDescription(
      '```ansi\n' +
      '\u001b[1;33m🤝 Learn together, compete, and have fun!\u001b[0m\n' +
      '```'
    )
    .addFields(
      {
        name: '⚔️ /challenge `@user` `<topic>`',
        value: '> Challenge friends to quiz battles!\n' +
          '> 🏆 Winner gets 150 XP bonus\n' +
          '> **Example:** `/challenge @friend topic:Python`',
        inline: false
      },
      {
        name: '📚 /studyparty',
        value: '> Start or join collaborative study sessions\n' +
          '> **Subcommands:**\n' +
          '> • `/studyparty start <topic>` - Create a party\n' +
          '> • `/studyparty join <id>` - Join existing party\n' +
          '> • `/studyparty leave` - Leave current party',
        inline: false
      },
      {
        name: '🏅 /leaderboard',
        value: '> Compete for top positions!\n' +
          '> 📊 Rankings update in real-time',
        inline: false
      },
      {
        name: '🎉 Coming Soon',
        value: 
          '```diff\n' +
          '! Team Battles\n' +
          '! Study Groups\n' +
          '! Weekly Tournaments\n' +
          '! Friend Lists\n' +
          '```',
        inline: false
      }
    )
    .setFooter({ text: '👥 Learning is more fun with friends!' })
    .setTimestamp();
}

export function createUtilityHelpEmbed() {
  return new EmbedBuilder()
    .setTitle('⚙️ Utility Commands')
    .setColor(COLORS.UTILITY)
    .setDescription(
      '```ansi\n' +
      '\u001b[1;37m🔧 Helpful tools and settings\u001b[0m\n' +
      '```'
    )
    .addFields(
      {
        name: '❓ /help',
        value: '> View this help menu\n' +
          '> 📂 Browse by category',
        inline: true
      },
      {
        name: '🏓 /ping',
        value: '> Check bot latency\n' +
          '> 📡 API response time',
        inline: true
      },
      {
        name: '📝 /feedback',
        value: '> Share your feedback\n' +
          '> 💡 Suggest features',
        inline: true
      },
      {
        name: '➕ /invite',
        value: '> Add MentorAI to your server\n' +
          '> 🔗 Get invite link',
        inline: true
      },
      {
        name: '🐛 Bug Reports',
        value: '> Use `/feedback` to report issues\n' +
          '> 📧 Or join our support server',
        inline: true
      },
      {
        name: '⚙️ Settings',
        value: '> Coming soon!\n' +
          '> 🔔 Notifications & more',
        inline: true
      }
    )
    .setFooter({ text: '🔧 More utility features coming soon!' })
    .setTimestamp();
}

export function createAllCommandsEmbed() {
  return new EmbedBuilder()
    .setTitle('📋 All Commands')
    .setColor(COLORS.PRIMARY)
    .setDescription(
      '```ansi\n' +
      '\u001b[1;32m📜 Complete command reference\u001b[0m\n' +
      '```'
    )
    .addFields(
      {
        name: '📚 Learning',
        value: '`/learn` `/quiz` `/explain` `/topics`',
        inline: true
      },
      {
        name: '🎮 Gamification',
        value: '`/daily` `/streak` `/achievements`',
        inline: true
      },
      {
        name: '📊 Progress',
        value: '`/profile` `/progress` `/leaderboard` `/stats`',
        inline: true
      },
      {
        name: '👥 Social',
        value: '`/challenge` `/studyparty`',
        inline: true
      },
      {
        name: '⚙️ Utility',
        value: '`/help` `/ping` `/feedback` `/invite`',
        inline: true
      },
      {
        name: '🔜 Coming Soon',
        value: '`/settings` `/notes` `/goals`',
        inline: true
      }
    )
    .addFields({
      name: '━━━━━━━━━━━━━━━━━━━━━━━━━━━',
      value: '**💡 Pro Tip:** Most commands support autocomplete - just start typing!',
      inline: false
    })
    .setFooter({ text: '📖 Use the category menu for detailed info!' })
    .setTimestamp();
}

export function createQuickStartEmbed() {
  return new EmbedBuilder()
    .setTitle('🚀 Quick Start Guide')
    .setColor(COLORS.SUCCESS)
    .setDescription(
      '```ansi\n' +
      '\u001b[1;32m🎯 Get started in 60 seconds!\u001b[0m\n' +
      '```'
    )
    .addFields(
      {
        name: 'Step 1️⃣ - Claim Daily Bonus',
        value: '> Type `/daily` to get your first XP!\n' +
          '> 🎁 You\'ll receive 75+ XP and a study tip',
        inline: false
      },
      {
        name: 'Step 2️⃣ - Take Your First Quiz',
        value: '> Type `/quiz topic:JavaScript questions:3`\n' +
          '> 🎯 Answer questions to earn XP!',
        inline: false
      },
      {
        name: 'Step 3️⃣ - Learn Something New',
        value: '> Type `/learn topic:Python`\n' +
          '> 📚 Get an AI-generated lesson!',
        inline: false
      },
      {
        name: 'Step 4️⃣ - Check Your Progress',
        value: '> Type `/profile` to see your stats\n' +
          '> 📊 Track XP, level, and achievements!',
        inline: false
      },
      {
        name: 'Step 5️⃣ - Keep Your Streak',
        value: '> Come back tomorrow for `/daily`\n' +
          '> 🔥 Build your streak for bonus XP!',
        inline: false
      }
    )
    .addFields({
      name: '🎉 You\'re Ready!',
      value: 
        '```diff\n' +
        '+ Now explore more commands with /help\n' +
        '+ Challenge friends with /challenge\n' +
        '+ Climb the /leaderboard!\n' +
        '```',
      inline: false
    })
    .setFooter({ text: '🚀 Your learning journey starts now!' })
    .setTimestamp();
}

export function createPopularCommandsEmbed() {
  return new EmbedBuilder()
    .setTitle('⭐ Most Popular Commands')
    .setColor(COLORS.GOLD)
    .setDescription(
      '```ansi\n' +
      '\u001b[1;33m🔥 What everyone is using!\u001b[0m\n' +
      '```'
    )
    .addFields(
      {
        name: '🥇 #1 - /quiz',
        value: '> The most used command!\n' +
          '> `Example: /quiz topic:React questions:5`\n' +
          '> ⚡ Fast, fun, and educational',
        inline: false
      },
      {
        name: '🥈 #2 - /daily',
        value: '> Claim daily rewards\n' +
          '> `Just type: /daily`\n' +
          '> 🎁 Free XP every day!',
        inline: false
      },
      {
        name: '🥉 #3 - /learn',
        value: '> Get AI lessons\n' +
          '> `Example: /learn topic:Node.js`\n' +
          '> 📚 Comprehensive tutorials',
        inline: false
      },
      {
        name: '🏅 #4 - /leaderboard',
        value: '> Check rankings\n' +
          '> `Just type: /leaderboard`\n' +
          '> 🏆 See where you stand!',
        inline: false
      },
      {
        name: '🎖️ #5 - /challenge',
        value: '> Battle friends\n' +
          '> `Example: /challenge @user topic:Python`\n' +
          '> ⚔️ Compete for glory!',
        inline: false
      }
    )
    .setFooter({ text: '⭐ Try them all to maximize your learning!' })
    .setTimestamp();
}

export function createProTipsEmbed() {
  return new EmbedBuilder()
    .setTitle('💡 Pro Tips & Secrets')
    .setColor(0x9B59B6)
    .setDescription(
      '```ansi\n' +
      '\u001b[1;35m🧙 Master MentorAI like a pro!\u001b[0m\n' +
      '```'
    )
    .addFields(
      {
        name: '🔥 Streak Strategy',
        value: '> Claim `/daily` at the same time each day\n' +
          '> Build streaks for up to **500% XP bonus!**\n' +
          '> 📅 Set a daily reminder!',
        inline: false
      },
      {
        name: '🎯 Quiz Mastery',
        value: '> Start with `easy` difficulty, work up to `hard`\n' +
          '> Perfect scores give **+100 XP bonus!**\n' +
          '> 💡 Read explanations to learn from mistakes',
        inline: false
      },
      {
        name: '⚡ XP Farming',
        value: '> Combine daily + quizzes for max XP\n' +
          '> Higher difficulties = more XP\n' +
          '> 🏆 Achievements give bonus XP!',
        inline: false
      },
      {
        name: '📚 Learning Efficiently',
        value: '> Use `/explain` for tough concepts\n' +
          '> Take quiz after lesson for best retention\n' +
          '> 🔄 Review topics you scored low on',
        inline: false
      },
      {
        name: '🎮 Hidden Features',
        value: 
          '```diff\n' +
          '+ Autocomplete suggests popular topics\n' +
          '+ Quiz buttons appear instantly\n' +
          '+ Achievements unlock secretly\n' +
          '+ Tier badges change with level!\n' +
          '```',
        inline: false
      },
      {
        name: '🏆 Speedrun to Level 10',
        value: '> 1. Daily bonus every day (+75 XP)\n' +
          '> 2. 3 quizzes/day (+150-300 XP)\n' +
          '> 3. Complete lessons (+40 XP each)\n' +
          '> ⏱️ **Possible in ~2 weeks!**',
        inline: false
      }
    )
    .setFooter({ text: '🧙 Now you know the secrets!' })
    .setTimestamp();
}
