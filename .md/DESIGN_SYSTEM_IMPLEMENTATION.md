# 🎨 MentorAI Design System v2.0 - Implementation Guide

## ✅ Implementation Complete

All design system specifications from v2.0 have been implemented.

---

## 📁 Files Created/Updated

### 1. **`src/config/colors.js`** ✅ Updated
Complete color system with pixel-accurate Discord values:
- Discord background colors (#313338, #2B2D31, #1E1F22)
- Discord text colors (#DBDEE1, #949BA4, #FFFFFF)
- Embed accent colors (quiz #F59E0B, lesson #8B5CF6, etc.)
- Button colors (Primary #5865F2, Secondary #4E5058, etc.)
- Semantic colors (XP, level, streak, accuracy)
- Code syntax highlighting colors
- Rarity colors

### 2. **`src/config/designSystem.js`** ✅ Created
Complete design system utilities:
- Icon emojis by context
- Typography helpers (bold, code, codeBlock, etc.)
- Embed title formatters
- Progress bar generator
- Quiz option formatter
- Lesson metadata formatter
- Progress stats formatter
- Design rule validators
- Semantic color getters

### 3. **`DESIGN_SYSTEM_V2.json`** ✅ Created
Full JSON specification for reference and documentation.

---

## 🎨 Color System

### Embed Accent Colors (Left Border Only)
```javascript
import { EMBED_COLORS } from './config/colors.js';

// Quiz embeds
.setColor(EMBED_COLORS.quiz)           // #F59E0B (Orange)

// Lesson embeds
.setColor(EMBED_COLORS.lesson)         // #8B5CF6 (Purple)

// Help embeds
.setColor(EMBED_COLORS.help)           // #A855F7 (Light Purple)

// Progress embeds
.setColor(EMBED_COLORS.progress)       // #8B5CF6 (Purple)

// Study party embeds
.setColor(EMBED_COLORS.studyParty)     // #EAB308 (Yellow)

// Error embeds
.setColor(EMBED_COLORS.error)          // #EF4444 (Red)

// Success embeds
.setColor(EMBED_COLORS.success)        // #22C55E (Green)
```

### Button Colors
```javascript
import { ButtonStyle } from 'discord.js';

// Primary actions (Next, Start, Submit)
.setStyle(ButtonStyle.Primary)         // #5865F2

// Navigation & Quiz options (A, B, C, D, Previous)
.setStyle(ButtonStyle.Secondary)       // #4E5058

// Positive actions (Join, Confirm, Quiz Me)
.setStyle(ButtonStyle.Success)         // #248046

// Destructive actions (Cancel, Leave, Delete)
.setStyle(ButtonStyle.Danger)          // #DA373C
```

---

## 🛠️ Usage Examples

### Creating Quiz Embed
```javascript
import { EmbedBuilder } from 'discord.js';
import { EMBED_COLORS, ICONS, formatQuizOptions } from './config/designSystem.js';

const embed = new EmbedBuilder()
  .setColor(EMBED_COLORS.quiz)
  .setTitle(`${ICONS.commands.quiz} Quiz: Java`)
  .setDescription(`**Question 1/5**\n\n${question.question}\n\n${formatQuizOptions(question.options)}`)
  .setFooter({ text: 'Score: 0 XP • Time: 30s' });
```

### Creating Lesson Embed
```javascript
import { EMBED_COLORS, ICONS, formatLessonMetadata } from './config/designSystem.js';

const embed = new EmbedBuilder()
  .setColor(EMBED_COLORS.lesson)
  .setTitle(`${ICONS.topics.python} Python Basics`)
  .setDescription(lessonContent)
  .addFields(...Object.values(formatLessonMetadata('Beginner', '2 min', 20)))
  .setFooter({ text: 'Lesson 1/5 • Use buttons to navigate' });
```

### Creating Progress Embed
```javascript
import { EMBED_COLORS, ICONS, formatProgressStats, createProgressBar } from './config/designSystem.js';

const stats = {
  level: 5,
  totalXp: 1250,
  streak: 7,
  lessonsCompleted: 15,
  quizzesPassed: 10,
  quizzesCompleted: 12,
  accuracy: 83.3
};

const embed = new EmbedBuilder()
  .setColor(EMBED_COLORS.progress)
  .setTitle(`${ICONS.stats.progress} ${user.username}'s Progress`)
  .setThumbnail(user.displayAvatarURL())
  .addFields(...formatProgressStats(stats))
  .addFields({
    name: '📈 Progress to Next Level',
    value: createProgressBar(250, 500, 10) + ' XP'
  });
```

### Creating Quiz Buttons
```javascript
import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { DESIGN_RULES } from './config/designSystem.js';

// CRITICAL: Quiz buttons MUST use Secondary style
const row = new ActionRowBuilder().addComponents(
  ['A', 'B', 'C', 'D'].map((label, i) =>
    new ButtonBuilder()
      .setCustomId(`quiz_answer_${i}_${quizId}`)
      .setLabel(label)
      .setStyle(ButtonStyle.Secondary)  // Always Secondary for quiz options
  )
);
```

### Creating Action Buttons
```javascript
const row = new ActionRowBuilder().addComponents(
  // Primary action
  new ButtonBuilder()
    .setCustomId('next')
    .setLabel('Next')
    .setStyle(ButtonStyle.Primary),
  
  // Success action with emoji
  new ButtonBuilder()
    .setCustomId('join')
    .setLabel('Join Party')
    .setEmoji('🎉')
    .setStyle(ButtonStyle.Success),
  
  // Danger action
  new ButtonBuilder()
    .setCustomId('cancel')
    .setLabel('Cancel')
    .setStyle(ButtonStyle.Danger)
);
```

---

## 🚨 Critical Design Rules

### ❌ DO NOT:
1. **DO NOT apply embed accent colors to button backgrounds**
   - ❌ Wrong: Quiz buttons with #F59E0B background
   - ✅ Correct: Quiz buttons use ButtonStyle.Secondary (#4E5058)

2. **DO NOT use gradients on embed backgrounds**
   - ❌ Wrong: `background: linear-gradient(...)`
   - ✅ Correct: Always `#2B2D31`

3. **DO NOT make quiz answer buttons match the embed theme**
   - ❌ Wrong: Orange A/B/C/D buttons for quiz
   - ✅ Correct: Secondary gray buttons (A/B/C/D)

4. **DO NOT add shadows to Discord embeds**
   - ❌ Wrong: `box-shadow: 0 4px 8px rgba(0,0,0,0.2)`
   - ✅ Correct: No shadows on embeds

5. **DO NOT use accent colors for body text**
   - ❌ Wrong: Purple description text
   - ✅ Correct: #DBDEE1 for all body text

6. **DO NOT round embed corners beyond 4px**
   - ❌ Wrong: `border-radius: 12px`
   - ✅ Correct: `border-radius: 4px`

### ✅ MUST DO:
1. **Left accent bar is the ONLY colored element on embeds**
2. **Quiz A/B/C/D buttons ALWAYS use Secondary style**
3. **Action buttons follow semantic meaning:**
   - Green = Positive actions (Join, Confirm)
   - Red = Negative actions (Cancel, Leave)
   - Blue = Primary actions (Next, Start)
4. **Embed backgrounds are ALWAYS #2B2D31**
5. **Use icons consistently from ICONS object**

---

## 🎯 Design System Validators

The design system includes validators to enforce rules:

```javascript
import { DESIGN_RULES } from './config/designSystem.js';

// Validate embed color
const color = DESIGN_RULES.validateEmbedColor('#F59E0B');

// Get correct quiz button style
const quizButtonStyle = DESIGN_RULES.getQuizButtonStyle(); // Returns 'Secondary'

// Get embed background
const bg = DESIGN_RULES.getEmbedBackground(); // Returns '#2B2D31'

// Validate no gradients
try {
  DESIGN_RULES.validateNoGradient('linear-gradient(...)'); // Throws error
} catch (error) {
  console.error(error.message);
}
```

---

## 📊 Typography Helpers

```javascript
import { TYPOGRAPHY } from './config/designSystem.js';

// Bold text
TYPOGRAPHY.bold('Important!');           // **Important!**

// Code
TYPOGRAPHY.code('/quiz python');         // `/quiz python`

// Code block
TYPOGRAPHY.codeBlock('print("Hello")', 'python');
// ```python
// print("Hello")
// ```

// Link
TYPOGRAPHY.link('Discord', 'https://discord.com');
// [Discord](https://discord.com)
```

---

## 🎨 Progress Bars

```javascript
import { createProgressBar } from './config/designSystem.js';

// XP progress
createProgressBar(250, 500, 10);
// Output: ▓▓▓▓▓░░░░░ 250/500

// Lesson completion
createProgressBar(7, 10, 10);
// Output: ▓▓▓▓▓▓▓░░░ 7/10
```

---

## 🏆 Rarity Colors

```javascript
import { getRarityColor, COLORS } from './config/designSystem.js';

// Get rarity color
getRarityColor('legendary');  // #FF9800
getRarityColor('epic');       // #9C27B0
getRarityColor('rare');       // #2196F3

// Direct access
COLORS.rarity.legendary;      // #FF9800
```

---

## ✅ Current Implementation Status

All components currently use the design system correctly:

### Commands Using Design System ✅
- `/quiz` - Quiz accent (#F59E0B), Secondary buttons
- `/learn` - Lesson accent (#8B5CF6), Primary navigation
- `/progress` - Progress accent (#8B5CF6), stats formatting
- `/studyparty` - Party accent (#EAB308), Success join button
- `/challenge` - Success/Danger buttons
- `/path` - Lesson accent, structured navigation
- `/help` - Help accent (#A855F7)
- `/leaderboard` - Info accent (#5865F2)

### Components Validated ✅
- ✅ Quiz embeds use correct orange accent
- ✅ Quiz A/B/C/D buttons use Secondary style
- ✅ Lesson embeds use purple accent
- ✅ Action buttons use semantic colors
- ✅ Progress bars use correct formatting
- ✅ Icons used consistently
- ✅ No gradients on embeds
- ✅ No shadows on embeds
- ✅ 4px border radius maintained

---

## 🚀 Next Steps (Optional Enhancements)

If you want to go beyond the current implementation:

1. **Animated XP feedback** (Tier 1 - 1-2 hrs)
2. **Streak multipliers** (Tier 1 - 1-2 hrs)
3. **Visual skill trees** (Tier 2 - 4-8 hrs)
4. **Achievement badge generation** (Tier 3 - 1-2 days)
5. **Voice learning mode** (Tier 3 - 1-2 days)

---

## 📚 Reference

- **Design System V2.0 JSON:** `DESIGN_SYSTEM_V2.json`
- **Colors Config:** `src/config/colors.js`
- **Design Utilities:** `src/config/designSystem.js`
- **Discord.js Docs:** https://discord.js.org/

---

**Design System v2.0 is fully implemented and production-ready!** 🎉
