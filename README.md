# 🎓 MentorAI - Gamified Discord Learning Bot

An AI-powered Discord bot that makes learning fun with generated lessons, quizzes, XP rewards, and achievements!

## ✨ Features

- 🤖 **AI-Generated Content** - Lessons and quizzes powered by OpenAI/Anthropic
- 📚 **Interactive Lessons** - Learn any programming topic with AI explanations
- ❓ **Smart Quizzes** - Test your knowledge with adaptive quizzes
- ⭐ **XP & Leveling** - Earn XP and level up as you learn
- 🔥 **Daily Streaks** - Maintain streaks for bonus rewards
- 🏆 **Achievements** - Unlock achievements for milestones
- 📊 **Leaderboards** - Compete with other learners
- ⚔️ **Challenges** - Battle friends in quiz duels

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- MongoDB database
- Discord Bot Token
- OpenAI API Key (optional: Anthropic API Key)

### Installation

```bash
# Clone and install
git clone <your-repo>
cd mentorai
npm install

# Configure environment
cp .env.example .env
# Edit .env with your credentials

# Deploy commands to Discord
npm run deploy-commands

# Start the bot
npm run dev
```

### Environment Variables

```env
DISCORD_TOKEN=your_discord_bot_token
DISCORD_CLIENT_ID=your_application_client_id
OPENAI_API_KEY=your_openai_api_key
ANTHROPIC_API_KEY=your_anthropic_api_key (optional)
DATABASE_URL=mongodb://localhost:27017/mentorai
```

## 📖 Commands

| Command | Description |
|---------|-------------|
| `/help` | View all commands |
| `/learn <topic>` | Get an AI-generated lesson |
| `/quiz <topic>` | Take a quiz on any topic |
| `/progress` | View your learning stats |
| `/leaderboard` | See top learners |
| `/daily` | Claim daily XP bonus |
| `/streak` | Check your streak |
| `/achievements` | View your achievements |
| `/topics` | Browse popular topics |
| `/challenge @user` | Challenge a friend |
| `/stats` | Global bot statistics |
| `/invite` | Add bot to your server |

## 🏗️ Architecture

```
src/
├── index.js              # Entry point
├── deploy-commands.js    # Command deployment
├── ai/
│   └── index.js          # OpenAI + Anthropic integration
├── bot/
│   ├── commands/         # Slash commands
│   ├── events/           # Discord event handlers
│   ├── commandLoader.js
│   └── eventLoader.js
├── config/
│   ├── colors.js         # Color constants
│   └── designSystem.js   # Embed builders
├── database/
│   ├── connection.js
│   └── models/           # MongoDB models
├── data/
│   └── quizzes/          # Fallback quiz data
└── services/
    ├── gamificationService.js
    ├── learningService.js
    └── quizService.js
```

## 🎮 Gamification System

### XP Rewards

- Correct quiz answer: +25 XP
- Quiz completion: +50 XP
- Perfect score: +100 XP
- Lesson completion: +30 XP
- Daily bonus: +50 XP + streak bonus

### Achievements

- 📖 First Steps - Complete your first lesson
- 🎯 Quiz Starter - Complete your first quiz
- 💯 Perfectionist - Get 100% on a quiz
- 🔥 On Fire - 3 day streak
- ⚡ Week Warrior - 7 day streak
- ⭐ Rising Star - Reach level 5
- And many more!

## 🛠️ Development

```bash
npm run dev    # Start with hot reload
npm start      # Production start
npm run deploy-commands  # Update Discord commands
```

## 📄 License

MIT License - feel free to use and modify!

---

Built with ❤️ for the Discord Buildathon
