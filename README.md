# 🎓 MentorAI - AI-Powered Discord Learning Platform

MentorAI is an intelligent Discord bot that transforms learning into an engaging, gamified experience powered by cutting-edge AI.

## ✨ Features

- 📚 **AI-Generated Lessons** - Learn any topic with personalized, adaptive content
- 🧠 **Smart Quizzes** - Test your knowledge with AI-generated questions
- 🏆 **Gamification** - Level up, earn XP, unlock achievements
- 🔥 **Streak System** - Build daily learning habits
- 🎉 **Study Parties** - Learn together with friends for bonus XP
- 📊 **Progress Tracking** - Detailed stats and leaderboards

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ installed
- Discord Developer Account
- OpenAI API Key
- MongoDB database

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd mentorai-discord
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment:
```bash
cp .env.example .env
# Edit .env with your actual keys
```

4. Deploy commands to Discord:
```bash
npm run deploy-commands
```

5. Start the bot:
```bash
npm run dev  # Development
npm start    # Production
```

## 📝 Commands

- `/learn [topic]` - Start learning any topic
- `/quiz [topic]` - Take a quiz on a subject
- `/progress` - View your learning stats
- `/studyparty [topic]` - Host a group study session
- `/help` - Get help with commands

## 🏗️ Project Structure

```
mentorai-discord/
├── src/
│   ├── bot/                 # Discord bot logic
│   ├── ai/                  # AI integration
│   ├── database/            # Database models
│   ├── services/            # Business logic
│   ├── utils/               # Utilities
│   └── config/              # Configuration
├── tests/                   # Test files
└── package.json
```

## 🔧 Configuration

Edit `.env` file with your credentials:

```env
DISCORD_TOKEN=your_discord_bot_token
DISCORD_CLIENT_ID=your_application_id
OPENAI_API_KEY=your_openai_api_key
DATABASE_URL=your_mongodb_connection_string
```

## 📊 Database Setup

MentorAI uses MongoDB. You can use:
- MongoDB Atlas (recommended for production)
- Local MongoDB instance

Connection string format:
```
mongodb+srv://username:password@cluster.mongodb.net/mentorai
```

## 🚀 Deployment

### Railway (Recommended)

```bash
npm install -g @railway/cli
railway login
railway init
railway up
```

### Docker

```bash
docker-compose up -d
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Support

- Join our Discord: [Support Server]
- Report Issues: [GitHub Issues]

---

Built with ❤️ using Discord.js and OpenAI
