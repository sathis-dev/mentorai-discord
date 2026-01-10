# 🚀 MentorAI - Complete Setup Guide

## Step 1: Prerequisites

Before starting, ensure you have:
- ✅ Node.js 18 or higher installed
- ✅ Git installed
- ✅ A Discord account
- ✅ A code editor (VS Code recommended)

## Step 2: Create Required Accounts

### Discord Developer Portal
1. Go to https://discord.com/developers/applications
2. Click "New Application"
3. Name it "MentorAI" and click "Create"
4. Go to "Bot" tab → Click "Add Bot"
5. **Save the Bot Token** (you'll need this for `.env`)
6. Enable these Privileged Gateway Intents:
   - ✅ PRESENCE INTENT
   - ✅ SERVER MEMBERS INTENT
   - ✅ MESSAGE CONTENT INTENT
7. Go to "OAuth2" → "General"
8. **Save the CLIENT ID** (you'll need this for `.env`)

### OpenAI API
1. Go to https://platform.openai.com/signup
2. Create an account
3. Navigate to https://platform.openai.com/api-keys
4. Click "Create new secret key"
5. Name it "MentorAI-Production"
6. **Save the API key** (starts with `sk-...`)
7. Add billing at https://platform.openai.com/account/billing
   - Recommended: Add $20-50 to start

### MongoDB Atlas (Database)
1. Go to https://www.mongodb.com/atlas
2. Create a free account
3. Create a new cluster (M0 Free tier is perfect)
4. Click "Connect" → "Connect your application"
5. **Save the connection string**
6. Replace `<password>` with your database password
7. Replace `<dbname>` with `mentorai`

## Step 3: Install Dependencies

```bash
# Navigate to project directory
cd mentorai-discord

# Install all dependencies
npm install
```

## Step 4: Configure Environment

Create a `.env` file in the root directory:

```bash
# Copy the example file
cp .env.example .env
```

Edit `.env` and add your credentials:

```env
# Discord
DISCORD_TOKEN=your_bot_token_here
DISCORD_CLIENT_ID=your_client_id_here

# OpenAI
OPENAI_API_KEY=sk-your-openai-key-here

# Anthropic (optional - backup AI)
ANTHROPIC_API_KEY=sk-ant-your-key-here

# Database
DATABASE_URL=mongodb+srv://username:password@cluster.mongodb.net/mentorai

# App Settings
NODE_ENV=development
PORT=3000
LOG_LEVEL=info
```

## Step 5: Deploy Commands to Discord

```bash
npm run deploy-commands
```

You should see: ✅ Commands deployed successfully!

## Step 6: Start the Bot

```bash
# Development (with auto-restart)
npm run dev

# Production
npm start
```

## Step 7: Invite Bot to Your Server

1. Go to Discord Developer Portal
2. Select your application
3. Go to "OAuth2" → "URL Generator"
4. Select scopes:
   - ✅ bot
   - ✅ applications.commands
5. Select permissions:
   - ✅ Send Messages
   - ✅ Embed Links
   - ✅ Attach Files
   - ✅ Read Message History
   - ✅ Add Reactions
   - ✅ Use Slash Commands
6. Copy the generated URL
7. Open in browser and select your server

## Step 8: Test the Bot

In Discord, try these commands:
- `/help` - View all commands
- `/learn topic:Python` - Start a lesson
- `/progress` - Check your stats
- `/quiz topic:Math` - Take a quiz

## 🎉 You're All Set!

Your bot should now be online and responding to commands!

## 🐛 Troubleshooting

### Bot doesn't come online
- Check that `DISCORD_TOKEN` is correct in `.env`
- Verify bot has all required intents enabled
- Check logs folder for error messages

### Commands don't appear
- Run `npm run deploy-commands` again
- Wait up to 1 hour for global commands to propagate
- Try using guild-specific commands for instant updates

### AI responses fail
- Verify `OPENAI_API_KEY` is correct
- Check you have sufficient credits
- Review error logs in `logs/error.log`

### Database connection fails
- Verify `DATABASE_URL` is correct
- Check MongoDB Atlas allows connections from your IP
- Ensure database user has read/write permissions

## 📚 Next Steps

1. Customize the bot's presence in `src/bot/events/ready.js`
2. Add more subjects in `src/config/subjects.js`
3. Create custom achievements in `src/database/models/Achievement.js`
4. Deploy to production (see DEPLOYMENT.md)

## 🆘 Need Help?

- Check the logs: `logs/combined.log` and `logs/error.log`
- Review Discord.js documentation: https://discord.js.org/
- OpenAI API docs: https://platform.openai.com/docs

Good luck with MentorAI! 🚀
