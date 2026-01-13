# MentorAI Discord Bot

<div align="center">

![MentorAI](https://img.shields.io/badge/MentorAI-v2.0.0-00D4FF?style=for-the-badge&logo=discord&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=node.js&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white)
![Discord.js](https://img.shields.io/badge/Discord.js-v14-5865F2?style=for-the-badge&logo=discord&logoColor=white)

**AI-Powered Learning Platform for Discord**

*Transform any Discord server into an interactive coding academy with gamification, AI tutoring, and real-time multiplayer challenges.*

[Features](#-features) • [Installation](#-installation) • [Commands](#-commands) • [Architecture](#-architecture) • [Contributing](#-contributing)

</div>

---

## 🎯 Overview

MentorAI is a comprehensive learning bot that brings professional-grade educational features to Discord. Built with **Explainable AI (XAI)** principles, it provides personalized learning paths, adaptive quizzes, and a full gamification system to keep learners engaged.

### Key Highlights

- **🧠 AI-Powered Tutoring** — Claude/GPT integration for personalized explanations
- **🎮 Full Gamification** — XP, levels, streaks, achievements, prestige system
- **⚔️ Multiplayer Modes** — Team battles, tournaments, study parties
- **📊 Explainable AI** — Transparent reasoning for all AI recommendations
- **🏆 Competitive Features** — Leaderboards, speedruns, daily challenges
- **📜 Certificates** — PDF certificates for course completions

---

## ✨ Features

### 📚 Learning System

| Feature | Description |
|---------|-------------|
| **Adaptive Quizzes** | AI-generated questions that scale with your level |
| **Learning Paths** | Structured curriculum from beginner to advanced |
| **Flashcards** | Spaced repetition system for retention |
| **Code Execution** | Run code directly in Discord with `/run` |
| **AI Tutor** | Ask questions and get detailed explanations |
| **Skill Trees** | Visual progression through topics |

### 🎮 Gamification

| Feature | Description |
|---------|-------------|
| **XP & Levels** | Unified formula: `XP = ⌊100 × 1.5^(L-1)⌋ × Multiplier` |
| **Streak System** | Daily login rewards up to 2x multiplier |
| **Prestige** | Reset at max level for permanent bonuses |
| **Achievements** | 50+ unlockable badges |
| **Profile Cards** | Canvas-rendered profile images |
| **Themes** | Customizable embed colors and styles |

### ⚔️ Multiplayer

| Feature | Description |
|---------|-------------|
| **Arena** | 1v1 real-time quiz battles |
| **Team Battles** | Collaborative team competitions |
| **Tournaments** | Bracket-style elimination events |
| **Study Parties** | Synchronized group learning sessions |
| **Speedruns** | Timed coding challenges |

### 📊 Analytics & Insights

| Feature | Description |
|---------|-------------|
| **Progress Tracking** | Detailed accuracy per topic |
| **Heatmaps** | Activity visualization |
| **Weak Spots** | AI-identified areas for improvement |
| **Insights** | Learning pattern analysis |
| **Global Pulse** | Real-time community learning trends |

---

## 🚀 Installation

### Prerequisites

- Node.js 18+
- MongoDB database
- Discord Bot Token
- OpenAI or Anthropic API key

### Quick Start

```bash
# Clone the repository
git clone https://github.com/sathis-dev/mentorai-discord.git
cd mentorai-discord

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your credentials

# Deploy slash commands
npm run deploy-commands

# Start the bot
npm start
```

### Environment Variables

```env
# Discord
DISCORD_TOKEN=your_bot_token
CLIENT_ID=your_client_id
GUILD_ID=your_dev_guild_id

# Database
MONGODB_URI=mongodb://localhost:27017/mentorai

# AI Providers
OPENAI_API_KEY=your_openai_key
ANTHROPIC_API_KEY=your_anthropic_key

# Optional
REDIS_URL=redis://localhost:6379
ADMIN_USER_IDS=123456789,987654321
```

### Docker Deployment

```bash
docker-compose up -d
```

---

## 📋 Commands

### Core Learning

| Command | Description |
|---------|-------------|
| `/help` | Interactive command hub with all features |
| `/quiz [topic]` | Start an adaptive quiz session |
| `/learn [topic]` | Begin a structured lesson |
| `/tutor [question]` | Ask the AI tutor anything |
| `/explain [concept]` | Get detailed explanations |
| `/run [language]` | Execute code snippets |
| `/flashcard` | Practice with spaced repetition |

### Progress & Stats

| Command | Description |
|---------|-------------|
| `/profile [@user]` | View your learning profile |
| `/stats` | Detailed statistics breakdown |
| `/progress` | Current learning path progress |
| `/heatmap` | Activity visualization |
| `/weakspots` | AI-identified improvement areas |
| `/insights` | Learning pattern analysis |
| `/skilltree` | Visual skill progression |

### Gamification

| Command | Description |
|---------|-------------|
| `/daily` | Claim daily rewards |
| `/streak` | View streak status |
| `/achievements` | Browse unlocked badges |
| `/leaderboard` | Server and global rankings |
| `/prestige` | Prestige system info |
| `/card` | Generate profile card image |
| `/certificate` | Generate completion certificates |

### Multiplayer

| Command | Description |
|---------|-------------|
| `/arena` | Start a 1v1 battle |
| `/teambattle` | Create team competition |
| `/tournament` | Join/create tournaments |
| `/studyparty` | Start group study session |
| `/speedrun` | Timed coding challenge |
| `/dailychallenge` | Daily community challenge |

### Server Management

| Command | Description |
|---------|-------------|
| `/setup` | Configure bot for your server |
| `/admin` | Admin dashboard access |
| `/remind` | Set learning reminders |
| `/theme` | Customize appearance |

---

## 🏗️ Architecture

```
src/
├── ai/                 # AI provider integrations (OpenAI, Anthropic)
├── bot/
│   ├── commands/       # 50+ slash commands
│   └── events/         # Discord event handlers
├── config/             # Configuration and brand system
├── database/
│   └── models/         # MongoDB schemas (User, Quiz, etc.)
├── handlers/           # Interaction and help handlers
├── services/
│   ├── gamificationService.js    # XP, levels, achievements
│   ├── quizService.js            # Quiz generation & grading
│   ├── skillService.js           # Skill tree management
│   ├── multiplayer/              # Arena, tournaments, battles
│   └── broadcastService.js       # Real-time events
├── utils/              # Helper functions
└── web/                # Admin dashboard (Express)
```

### Tech Stack

- **Runtime:** Node.js 18+
- **Framework:** Discord.js v14
- **Database:** MongoDB with Mongoose ODM
- **AI:** OpenAI GPT-4 / Anthropic Claude
- **Caching:** Redis (optional)
- **Canvas:** @napi-rs/canvas for image generation
- **PDF:** PDFKit for certificates
- **Hosting:** Railway / Docker

---

## 🎨 Tier System

Users progress through visual tiers based on level:

| Level | Tier | Color | Emoji |
|-------|------|-------|-------|
| 1-4 | Bronze | `#CD7F32` | 🥉 |
| 5-9 | Silver | `#C0C0C0` | 🥈 |
| 10-19 | Gold | `#FFD700` | 🥇 |
| 20-29 | Platinum | `#E5E4E2` | 🏆 |
| 30-49 | Diamond | `#00D4FF` | 💎 |
| 50+ | Legend | `#FF6B35` | 👑 |

---

## 🧪 Testing

```bash
# Run all tests
npm test

# Unit tests only
npm run test:unit

# End-to-end tests
npm run test:e2e

# Performance benchmarks
npm run test:bench
```

---

## 📦 Scripts

| Script | Description |
|--------|-------------|
| `npm start` | Start production bot |
| `npm run dev` | Start with hot-reload |
| `npm run deploy-commands` | Register slash commands |
| `npm run admin` | Start admin web dashboard |
| `npm run health` | Run health check |
| `npm run emergency` | Emergency maintenance tools |

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- [Discord.js](https://discord.js.org/) for the excellent Discord API wrapper
- [OpenAI](https://openai.com/) and [Anthropic](https://anthropic.com/) for AI capabilities
- The open-source community for inspiration and tools

---

<div align="center">

**Built with ❤️ for learners everywhere**

[⬆ Back to Top](#mentorai-discord-bot)

</div>
