# MentorAI - AI Coding Agent Instructions

## Project Overview
MentorAI is a gamified Discord learning bot with AI-generated lessons and quizzes. Built with Node.js, Discord.js v14, MongoDB, and OpenAI/Anthropic for AI-powered content generation.

## Architecture & Data Flow

```
User Command → src/bot/commands/*.js → src/services/*Service.js → src/ai/openai.js → MongoDB
                     ↓
              src/utils/embedBuilder.js + src/config/designSystem.js → Discord Embed Response
```

- **Commands** (`src/bot/commands/`): Slash commands export `data` (SlashCommandBuilder) + `execute(interaction)`
- **Services** (`src/services/`): Business logic layer - `learningService`, `quizService`, `gamificationService`
- **AI Layer** (`src/ai/index.js`): OpenAI primary, falls back to Anthropic Claude on failure
- **Quiz Fallback**: If OpenAI unavailable, uses curated questions from `src/data/quizzes/`

## Key Patterns & Conventions

### Adding a New Slash Command
```javascript
// src/bot/commands/mycommand.js
import { SlashCommandBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('mycommand')
  .setDescription('Description');

export async function execute(interaction) {
  await interaction.deferReply(); // For long operations
  // ... logic
}
```
Then run `npm run deploy-commands` to register with Discord.

### Discord Embeds - Use Design System
Always use helpers from `src/config/designSystem.js` and colors from `src/config/colors.js`:
```javascript
import { COLORS } from '../config/colors.js';
import { createLessonEmbed, progressBar } from '../config/designSystem.js';
```

### User Data & Gamification
- User model (`src/database/models/User.js`) has `addXp()` and `updateStreak()` methods
- After XP changes, call `checkAchievements(user)` from gamificationService
- XP rewards defined in `XP_REWARDS` object in gamificationService.js

### Button/Interaction Handlers
Button customIds follow pattern: `action_subaction_params` (e.g., `quiz_answer_2_quizId123`)
Handle in `src/bot/events/interactionCreate.js`

## Critical Commands

```bash
npm install              # Install dependencies
npm run deploy-commands  # Register slash commands with Discord (required after adding/modifying commands)
npm run dev              # Start with nodemon (development)
npm start                # Production start
```

## Environment Variables (Required)
```
DISCORD_TOKEN, DISCORD_CLIENT_ID, OPENAI_API_KEY, DATABASE_URL (MongoDB)
```

## Testing Locally
1. Use `/help` to verify bot responds
2. `/quiz topic:JavaScript questions:3` tests AI generation + quiz flow
3. `/progress` tests database user retrieval + embed formatting
