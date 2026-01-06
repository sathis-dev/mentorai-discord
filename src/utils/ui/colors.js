/**
 * MentorAI Ultimate Color Palette
 * Consistent colors across all embeds and UI elements
 */

export const Colors = {
  // Primary Brand
  PRIMARY: 0x5865F2,       // Discord Blurple
  SECONDARY: 0x57F287,     // Success Green
  
  // Semantic
  SUCCESS: 0x57F287,       // Green
  WARNING: 0xFEE75C,       // Yellow
  ERROR: 0xED4245,         // Red
  INFO: 0x5865F2,          // Blurple
  
  // Ranks
  BRONZE: 0xCD7F32,
  SILVER: 0xC0C0C0,
  GOLD: 0xFFD700,
  DIAMOND: 0xB9F2FF,
  LEGENDARY: 0x9B59B6,
  
  // Difficulty
  EASY: 0x57F287,          // Green
  MEDIUM: 0xFEE75C,        // Yellow
  HARD: 0xED4245,          // Red
  
  // Topics/Languages
  PYTHON: 0x3776AB,
  JAVASCRIPT: 0xF7DF1E,
  REACT: 0x61DAFB,
  NODEJS: 0x339933,
  TYPESCRIPT: 0x3178C6,
  RUST: 0xDEA584,
  GO: 0x00ADD8,
  JAVA: 0xED8B00,
  CPP: 0x00599C,
  CSHARP: 0x239120,
  
  // Gradients/Themes
  SUNSET: 0xFF6B6B,
  OCEAN: 0x4ECDC4,
  PURPLE_DREAM: 0x6C5CE7,
  CYBER: 0x00F5FF,
  NEON_PINK: 0xFF6B9D,
  ELECTRIC_BLUE: 0x0984E3,
  MINT: 0x00B894,
  CORAL: 0xFF7675,
  
  // Neutral
  DARK: 0x2C2F33,
  LIGHT: 0x99AAB5,
  
  // Special
  XP_GOLD: 0xFFD700,
  STREAK_FIRE: 0xFF4500,
  ACHIEVEMENT: 0x9B59B6,
  LEVEL_UP: 0xFFD700,
  ARENA: 0x6C5CE7
};

// Rank color mapping
export const RANK_COLORS = {
  'Bronze Learner': Colors.BRONZE,
  'Silver Scholar': Colors.SILVER,
  'Gold Master': Colors.GOLD,
  'Diamond Expert': Colors.DIAMOND,
  'Legendary Guru': Colors.LEGENDARY
};

// Difficulty color mapping
export const DIFFICULTY_COLORS = {
  easy: Colors.EASY,
  medium: Colors.MEDIUM,
  hard: Colors.HARD
};

// Language color mapping
export const LANGUAGE_COLORS = {
  python: Colors.PYTHON,
  javascript: Colors.JAVASCRIPT,
  typescript: Colors.TYPESCRIPT,
  react: Colors.REACT,
  nodejs: Colors.NODEJS,
  rust: Colors.RUST,
  go: Colors.GO,
  java: Colors.JAVA,
  cpp: Colors.CPP,
  'c++': Colors.CPP,
  csharp: Colors.CSHARP,
  'c#': Colors.CSHARP
};

// Rarity colors for achievements
export const RARITY_COLORS = {
  common: 0x95A5A6,
  uncommon: 0x3498DB,
  rare: 0x9B59B6,
  epic: 0xE91E63,
  legendary: 0xF39C12
};

export default Colors;
