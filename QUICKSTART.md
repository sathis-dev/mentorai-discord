# ⚡ MentorAI - Quick Start (5 Minutes)

## 🎯 What You Need

1. **Discord Bot Token** - [Get it here](https://discord.com/developers/applications)
2. **OpenAI API Key** - [Get it here](https://platform.openai.com/api-keys)
3. **MongoDB Database** - [Free at MongoDB Atlas](https://www.mongodb.com/atlas)

---

## 🚀 3-Step Setup

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Configure Environment
Create a `.env` file with your credentials:
```env
DISCORD_TOKEN=paste_your_discord_bot_token_here
DISCORD_CLIENT_ID=paste_your_discord_client_id_here
OPENAI_API_KEY=sk-paste_your_openai_key_here
DATABASE_URL=mongodb+srv://your_mongodb_connection_string
NODE_ENV=development
```

### Step 3: Deploy & Run
```bash
# Deploy commands to Discord
npm run deploy-commands

# Start the bot
npm run dev
```

---

## 🎮 Test Your Bot

In Discord, try:
- `/help` - See all commands
- `/learn topic:Python` - Start learning
- `/quiz topic:Math questions:3` - Take a quiz
- `/progress` - View your stats

---

## 📁 Project Structure

```
src/
├── bot/
│   ├── commands/      # All slash commands
│   ├── events/        # Bot event handlers
│   └── handlers/      # Command/event loaders
├── ai/                # OpenAI & Anthropic integration
├── database/
│   └── models/        # User, Progress, Achievement
├── services/          # Business logic
├── utils/             # Helper functions
└── index.js           # Main entry point
```

---

## 🔧 Common Issues

**Bot doesn't come online?**
- Check `DISCORD_TOKEN` is correct
- Enable all Privileged Gateway Intents in Discord Developer Portal

**Commands don't appear?**
- Run `npm run deploy-commands` again
- Wait 1 hour for global commands (or use guild-specific for instant)

**AI not responding?**
- Verify `OPENAI_API_KEY` is valid
- Check you have credits at https://platform.openai.com/account/billing

**Database errors?**
- Confirm `DATABASE_URL` is correct
- Whitelist your IP in MongoDB Atlas

---

## 📚 Full Documentation

- **Detailed Setup:** See `SETUP_GUIDE.md`
- **Deployment:** See `DEPLOYMENT.md`
- **Testing:** See `TESTING_CHECKLIST.md`

---

## 💡 Next Steps

1. ✅ Customize bot status in `src/bot/events/ready.js`
2. ✅ Add more subjects in `src/config/subjects.js`
3. ✅ Create custom achievements
4. ✅ Deploy to production (Railway recommended)

---

**Ready to launch? Let's go! 🚀**
