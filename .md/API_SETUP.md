# 🤖 AI Setup Guide - Enable Full MentorAI Power

MentorAI is **AI-POWERED** - it uses OpenAI's GPT-4 to generate lessons and quizzes on **ANY topic in the world**.

## 🔑 Get Your OpenAI API Key

### Step 1: Create OpenAI Account
1. Go to https://platform.openai.com/signup
2. Sign up with your email or Google account
3. Verify your email address

### Step 2: Get API Key
1. Go to https://platform.openai.com/api-keys
2. Click **"Create new secret key"**
3. Give it a name like "MentorAI"
4. **Copy the key immediately** (you won't see it again!)
5. It looks like: `sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

### Step 3: Add Billing (Required)
1. Go to https://platform.openai.com/account/billing
2. Add a payment method
3. Add credit ($5-10 is enough to start)
4. **Cost:** ~$0.01-0.03 per quiz/lesson (very cheap!)

### Step 4: Configure MentorAI
1. Open your `.env` file in the project
2. Replace the placeholder with your real key:
   ```
   OPENAI_API_KEY=sk-proj-your-actual-key-here
   ```
3. Save the file
4. Restart the bot (`npm run dev`)

---

## ✨ What You Get With AI

### Without API Key (Limited):
- ❌ Only 100 curated questions (Python, JS, Web Dev, Data Science)
- ❌ Cannot generate lessons
- ❌ Cannot generate quizzes on custom topics
- ❌ No AI diagrams or visualizations
- ❌ Limited to pre-made content

### With API Key (UNLIMITED): ⚡
- ✅ **INFINITE quiz topics** - Ask about ANYTHING!
- ✅ **AI-generated lessons** - Personalized explanations
- ✅ **Custom difficulty** - Adapts to user level
- ✅ **DALL-E diagrams** - Visual learning
- ✅ **Any subject** - Math, Physics, History, Languages, etc.
- ✅ **Real-time generation** - Fresh content every time

---

## 💡 Examples With AI Enabled

### Quiz on ANY Topic:
```
/quiz quantum physics       → Real physics questions
/quiz spanish grammar       → Language learning
/quiz react hooks          → Latest web dev
/quiz machine learning     → AI/ML concepts
/quiz blockchain           → Crypto technology
/quiz photography          → Creative skills
```

### Lessons on ANYTHING:
```
/learn photosynthesis      → Biology lesson
/learn derivatives         → Calculus tutorial
/learn design patterns     → Software engineering
/learn japanese hiragana   → Language basics
```

**The curated database is ONLY a fallback!**

---

## 💰 API Costs (Very Affordable)

### Typical Usage:
- **Quiz (5 questions):** ~$0.01-0.02
- **Lesson:** ~$0.02-0.04
- **DALL-E Image:** ~$0.04

### Monthly Estimate:
- **100 quizzes:** ~$1-2
- **50 lessons:** ~$1-2
- **20 images:** ~$0.80
- **Total:** ~$3-5/month for active use

**This is INCREDIBLY cheap for unlimited AI tutoring!**

---

## 🚀 How to Set Up (Full Instructions)

### 1. Open `.env` file:
```bash
# In your project folder
notepad .env
# or
code .env
```

### 2. Add your OpenAI API key:
```env
# Discord Bot Configuration
DISCORD_TOKEN=your_discord_token_here
DISCORD_CLIENT_ID=your_client_id_here

# 🤖 AI Configuration (REQUIRED for full features)
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Database
MONGODB_URI=mongodb://localhost:27017/mentorai
```

### 3. Save and restart:
```bash
# Stop the bot (Ctrl+C)
# Start it again
npm run dev
```

### 4. Verify it's working:
Look for this in the console:
```
🤖 Generating AI-powered python quiz (5 questions, beginner level)
✅ Successfully generated 5 AI quiz questions
```

If you see:
```
⚠️ OpenAI API key not configured
📚 Using curated questions from database
```
Then your API key isn't set correctly.

---

## 🔧 Troubleshooting

### "Invalid API Key" Error
- Make sure you copied the FULL key (starts with `sk-`)
- No spaces before/after the key
- No quotes around the key in `.env`

### "Insufficient Quota" Error
- You need to add billing: https://platform.openai.com/account/billing
- Add at least $5 credit

### "Model not found" Error
- Your account needs GPT-4 access
- Use GPT-3.5 instead (change in `src/ai/openai.js`)
- Or wait for GPT-4 access approval

### API Key Not Detected
```bash
# Windows - Check .env file
type .env

# Should show:
OPENAI_API_KEY=sk-proj-...
```

---

## 📊 Monitoring Usage

1. Go to https://platform.openai.com/usage
2. See your daily/monthly costs
3. Set usage limits if needed

---

## 🎯 Recommended Setup

### For Development:
```env
OPENAI_API_KEY=sk-proj-your-key-here  # ✅ REQUIRED
```

### For Production:
```env
OPENAI_API_KEY=sk-proj-your-key-here  # ✅ REQUIRED
MONGODB_URI=your-atlas-connection     # ✅ REQUIRED
```

---

## 🌟 Why Use OpenAI API?

**MentorAI is designed to be AI-FIRST:**

1. **Infinite Variety** - Any topic, any time
2. **Personalized** - Adapts to user level
3. **Up-to-date** - Latest information
4. **Engaging** - Natural explanations
5. **Scalable** - Handles any subject

**The curated questions (100+ in database) are just a backup for when API is unavailable.**

---

## ✅ Quick Start Checklist

- [ ] Create OpenAI account
- [ ] Get API key from platform.openai.com
- [ ] Add billing ($5-10 credit)
- [ ] Add key to `.env` file
- [ ] Restart bot
- [ ] Test with `/quiz artificial intelligence`
- [ ] See AI-generated questions ✨

---

## 🎉 You're Ready!

Once your API key is configured, MentorAI becomes a **world-class AI tutor** that can teach ANYTHING.

**Test it with:**
```
/quiz machine learning
/quiz react native
/quiz quantum computing
/learn neural networks
/learn blockchain basics
```

**Welcome to the future of learning!** 🚀
