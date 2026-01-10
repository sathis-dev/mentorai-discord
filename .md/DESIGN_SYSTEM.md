# 🎨 MentorAI Design System Guide

## Overview

MentorAI uses a gaming-inspired design language optimized for Discord's dark mode with clear visual feedback for learning progress.

## Color Usage

### Brand Colors
- **Primary (#5865F2)** - Discord blurple for main actions, links, primary buttons
- **Primary Light (#7289DA)** - Hover states, selected items
- **Primary Dark (#4752C4)** - Pressed states, focus rings

### Semantic Colors

#### Success (#00FF88) - Green
✅ **Use for:**
- Correct quiz answers
- Completed lessons
- Success messages
- Active streaks

❌ **DO NOT use for:**
- Error states
- XP displays (use gold instead)
- Primary buttons

#### Warning (#FFD700) - Gold
✅ **Use for:**
- XP rewards and badges
- Quiz mode indicators
- Achievements
- Attention states

❌ **DO NOT use for:**
- Error messages (use red)
- Success states (use green)

#### Error (#FF4444) - Red
✅ **Use for:**
- Wrong answers
- Error messages
- Destructive actions (delete, cancel)

❌ **DO NOT use for:**
- XP rewards
- Primary actions
- Success states

#### Info (#00D4FF) - Cyan
✅ **Use for:**
- Tips and help content
- Informational messages
- Help embeds

### Accent Colors

- **Purple (#9B59B6)** - Progress tracking, stats
- **Pink (#FF6B6B)** - Social features, study parties
- **Teal (#4ECDC4)** - Learning paths, navigation
- **Orange (#FF9800)** - Streaks, fire indicators

### Rarity Colors

| Rarity | Color | Gradient | Glow |
|--------|-------|----------|------|
| Common | #9E9E9E | None | None |
| Uncommon | #4CAF50 | Yes | 10px |
| Rare | #2196F3 | Yes | 15px |
| Epic | #9C27B0 | Yes | 20px |
| Legendary | #FF9800 | Animated | 25px + Pulse |

## Discord Embed Colors

Each embed type has ONE specific color:

| Embed Type | Color | Hex | Icon |
|-----------|-------|-----|------|
| Lesson | Success Green | #00FF88 | 📖 |
| Quiz | Warning Gold | #FFD700 | 🧠 |
| Progress | Accent Purple | #9B59B6 | 📊 |
| Study Party | Accent Pink | #FF6B6B | 🎉 |
| Achievement | Dynamic (Rarity) | Varies | 🏆 |
| Error | Error Red | #FF4444 | ❌ |
| Success | Success Green | #00FF88 | ✅ |
| Help | Primary Blue | #5865F2 | ❓ |

## Button Styles

### Primary Button
```javascript
// Use for: Main actions (Start Learning, Take Quiz)
background: #5865F2
hover: #4752C4
active: #3C45A5
```

### Secondary Button
```javascript
// Use for: Navigation (Previous, Next, Back)
background: #4F545C
hover: #5D6269
active: #40444B
```

### Success Button
```javascript
// Use for: Confirmation (Confirm, Submit, Complete)
background: #3BA55C
hover: #2D7D46
active: #236B3A
```

### Danger Button
```javascript
// Use for: Destructive actions (Cancel, Leave, Delete)
background: #ED4245
hover: #C53538
active: #A12D2F
```

## Typography

### Font Family
- **Primary:** 'gg sans', 'Noto Sans', Helvetica, Arial, sans-serif
- **Monospace:** 'Consolas', 'Monaco', 'Courier New', monospace

### Text Hierarchy

| Element | Size | Weight | Color |
|---------|------|--------|-------|
| H1 (Embed Title) | 16px | 600 | #FFFFFF |
| H2 (Section) | 16px | 600 | #FFFFFF |
| H3 (Subheading) | 14px | 600 | #FFFFFF |
| Body | 14px | 400 | #B9BBBE |
| Body Small | 12px | 400 | #B9BBBE |
| Caption | 11px | 500 | #72767D |

## Implementation Examples

### Creating a Lesson Embed
```javascript
import { createLessonEmbed } from './utils/embedBuilder.js';

const lesson = {
  title: 'Introduction to Python',
  content: 'Learn the basics...',
  level: 'beginner',
  estimatedMinutes: 5,
  xpReward: 25
};

const embed = createLessonEmbed(lesson, 1, 5);
```

### Creating Buttons
```javascript
import { ButtonBuilder, ButtonStyle } from 'discord.js';

// Primary action
const startButton = new ButtonBuilder()
  .setCustomId('start_lesson')
  .setLabel('Start Learning')
  .setStyle(ButtonStyle.Primary);

// Danger action
const cancelButton = new ButtonBuilder()
  .setCustomId('cancel')
  .setLabel('Cancel')
  .setStyle(ButtonStyle.Danger);
```

### Using Colors in Code
```javascript
import { COLORS, EMBED_COLORS } from '../config/colors.js';

// For embeds
embed.setColor(EMBED_COLORS.lesson); // #00FF88

// For custom components
const badge = {
  background: COLORS.semantic.warning, // #FFD700
  text: COLORS.neutral.textPrimary    // #FFFFFF
};
```

## Critical Rules

### ❌ DO NOT

1. **DO NOT** apply gradients to icon fills (use solid colors only)
2. **DO NOT** use rarity glow effects on non-achievement elements
3. **DO NOT** mix embed accent colors (one color per embed type)
4. **DO NOT** use primary blue for destructive actions (use danger red)
5. **DO NOT** use gold (#FFD700) for error states (use red #FF4444)
6. **DO NOT** apply shadows to text elements (only containers)
7. **DO NOT** use body text color (#B9BBBE) for headings (use #FFFFFF)
8. **DO NOT** apply hover effects to non-interactive elements

### ✅ DO

1. **DO** use semantic colors appropriately (green=success, red=error, gold=XP)
2. **DO** maintain consistent embed colors per type
3. **DO** use proper button styles for each action type
4. **DO** keep text hierarchy clear (white headings, gray body)
5. **DO** apply shadows only to containers (cards, modals, dropdowns)
6. **DO** use rarity colors only for achievements and badges
7. **DO** test colors on Discord's dark background
8. **DO** follow the design system file for all styling decisions

## Component Checklist

Before implementing any component, verify:

- [ ] Correct color from design system
- [ ] Proper semantic meaning (success/error/warning)
- [ ] Appropriate button style for action type
- [ ] No gradients on icons or small elements
- [ ] Shadows only on containers, not text
- [ ] Text hierarchy follows guidelines
- [ ] Hover states only on interactive elements

## Quick Reference

```javascript
// Import design system
import { COLORS, EMBED_COLORS, RARITY_COLORS } from '../config/colors.js';

// Embed colors
EMBED_COLORS.lesson      // #00FF88 (green)
EMBED_COLORS.quiz        // #FFD700 (gold)
EMBED_COLORS.progress    // #9B59B6 (purple)
EMBED_COLORS.studyParty  // #FF6B6B (pink)
EMBED_COLORS.error       // #FF4444 (red)
EMBED_COLORS.success     // #00FF88 (green)

// Semantic colors
COLORS.semantic.success  // #00FF88
COLORS.semantic.warning  // #FFD700
COLORS.semantic.error    // #FF4444
COLORS.semantic.info     // #00D4FF

// Text colors
COLORS.neutral.textPrimary   // #FFFFFF (headings)
COLORS.neutral.textSecondary // #B9BBBE (body)
COLORS.neutral.textMuted     // #72767D (captions)

// Rarity colors
RARITY_COLORS.common.color      // #9E9E9E
RARITY_COLORS.uncommon.color    // #4CAF50
RARITY_COLORS.rare.color        // #2196F3
RARITY_COLORS.epic.color        // #9C27B0
RARITY_COLORS.legendary.color   // #FF9800
```

## Questions?

If you're unsure which color to use:
1. Check `src/config/designSystem.json` for detailed guidance
2. Look at `src/config/colors.js` for all color constants
3. Review existing components in `src/utils/embedBuilder.js`
4. Follow the "DO NOT" rules strictly

**Remember:** Consistency is key to a polished user experience!
