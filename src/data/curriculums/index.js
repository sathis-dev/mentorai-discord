import { pythonCurriculum } from './python.js';
import { javascriptCurriculum } from './javascript.js';

export const curriculums = {
  python: pythonCurriculum,
  javascript: javascriptCurriculum,
  'web-development': {
    subject: 'web-development',
    title: 'Full-Stack Web Development',
    description: 'HTML, CSS, JavaScript, React, Node.js - build complete web apps',
    category: 'Web Development',
    icon: '🌐',
    difficulty: 'beginner',
    totalLessons: 25,
    estimatedHours: 35,
    skills: ['html', 'css', 'javascript', 'react', 'nodejs'],
    lessons: []
  },
  'data-science': {
    subject: 'data-science',
    title: 'Data Science with Python',
    description: 'NumPy, Pandas, Matplotlib, Machine Learning basics',
    category: 'Data Science',
    icon: '📊',
    difficulty: 'intermediate',
    totalLessons: 20,
    estimatedHours: 30,
    skills: ['python', 'pandas', 'numpy', 'visualization', 'ml'],
    lessons: []
  },
  'machine-learning': {
    subject: 'machine-learning',
    title: 'Machine Learning Fundamentals',
    description: 'Supervised learning, neural networks, scikit-learn, TensorFlow',
    category: 'AI & ML',
    icon: '🤖',
    difficulty: 'advanced',
    totalLessons: 22,
    estimatedHours: 40,
    skills: ['ml', 'neural-networks', 'tensorflow', 'data'],
    lessons: []
  },
  'game-development': {
    subject: 'game-development',
    title: 'Game Development with Python',
    description: 'Pygame, game loops, sprites, collision detection',
    category: 'Game Dev',
    icon: '🎮',
    difficulty: 'intermediate',
    totalLessons: 18,
    estimatedHours: 25,
    skills: ['pygame', 'oop', 'graphics', 'physics'],
    lessons: []
  },
  'cybersecurity': {
    subject: 'cybersecurity',
    title: 'Cybersecurity Essentials',
    description: 'Network security, encryption, ethical hacking basics',
    category: 'Security',
    icon: '🔒',
    difficulty: 'advanced',
    totalLessons: 20,
    estimatedHours: 30,
    skills: ['networking', 'encryption', 'security', 'linux'],
    lessons: []
  },
  'git-github': {
    subject: 'git-github',
    title: 'Git & GitHub Mastery',
    description: 'Version control, collaboration, branching, workflows',
    category: 'DevOps',
    icon: '📚',
    difficulty: 'beginner',
    totalLessons: 12,
    estimatedHours: 15,
    skills: ['git', 'github', 'collaboration', 'cli'],
    lessons: []
  },
  'sql-databases': {
    subject: 'sql-databases',
    title: 'SQL & Database Design',
    description: 'SQL queries, database design, PostgreSQL, optimization',
    category: 'Databases',
    icon: '💾',
    difficulty: 'intermediate',
    totalLessons: 15,
    estimatedHours: 20,
    skills: ['sql', 'databases', 'design', 'queries'],
    lessons: []
  },
  'algorithms': {
    subject: 'algorithms',
    title: 'Data Structures & Algorithms',
    description: 'Arrays, linked lists, trees, sorting, big O notation',
    category: 'Computer Science',
    icon: '🧮',
    difficulty: 'advanced',
    totalLessons: 25,
    estimatedHours: 40,
    skills: ['algorithms', 'data-structures', 'problem-solving'],
    lessons: []
  },
  'design': {
    subject: 'design',
    title: 'UI/UX Design Fundamentals',
    description: 'Design principles, Figma, color theory, typography',
    category: 'Design',
    icon: '🎨',
    difficulty: 'beginner',
    totalLessons: 16,
    estimatedHours: 20,
    skills: ['design', 'ui', 'ux', 'figma'],
    lessons: []
  },
  'japanese': {
    subject: 'japanese',
    title: 'Japanese Language Course',
    description: 'Hiragana, Katakana, basic grammar, conversation',
    category: 'Languages',
    icon: '🇯🇵',
    difficulty: 'beginner',
    totalLessons: 30,
    estimatedHours: 45,
    skills: ['hiragana', 'katakana', 'grammar', 'vocabulary'],
    lessons: []
  }
};

export const getAllCurriculums = () => Object.values(curriculums);

export const getCurriculumBySubject = (subject) => curriculums[subject] || null;

export const getCurriculumsByCategory = (category) => {
  return getAllCurriculums().filter(c => c.category === category);
};

export const getCurriculumsByDifficulty = (difficulty) => {
  return getAllCurriculums().filter(c => c.difficulty === difficulty);
};

export default curriculums;
