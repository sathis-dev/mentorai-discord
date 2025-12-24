import { pythonQuizzes, getPythonQuiz } from './python.js';
import { javascriptQuizzes, getJavaScriptQuiz } from './javascript.js';

export const quizDatabase = {
  python: pythonQuizzes,
  javascript: javascriptQuizzes,
  js: javascriptQuizzes,
  'web-development': {
    beginner: [
      {
        question: "What does HTML stand for?",
        options: [
          "HyperText Markup Language",
          "High-Level Text Management Language",
          "HyperTransfer Markup Language",
          "Home Tool Markup Language"
        ],
        correctIndex: 0,
        explanation: "HTML is HyperText Markup Language, the standard language for creating web pages.",
        difficulty: "easy",
        xp: 10,
        category: "html"
      },
      {
        question: "Which HTML tag is used for the largest heading?",
        options: [
          "<h1>",
          "<h6>",
          "<heading>",
          "<head>"
        ],
        correctIndex: 0,
        explanation: "<h1> is the largest heading tag, <h6> is the smallest. HTML has 6 heading levels.",
        difficulty: "easy",
        xp: 10,
        category: "html"
      },
      {
        question: "What does CSS stand for?",
        options: [
          "Cascading Style Sheets",
          "Computer Style Sheets",
          "Creative Style System",
          "Colorful Style Sheets"
        ],
        correctIndex: 0,
        explanation: "CSS is Cascading Style Sheets, used to style and layout web pages.",
        difficulty: "easy",
        xp: 10,
        category: "css"
      },
      {
        question: "How do you select an element with id='header' in CSS?",
        options: [
          "#header",
          ".header",
          "header",
          "*header"
        ],
        correctIndex: 0,
        explanation: "# selects by ID, . selects by class, element name selects by tag.",
        difficulty: "easy",
        xp: 10,
        category: "css"
      },
      {
        question: "Which property changes text color in CSS?",
        options: [
          "color",
          "text-color",
          "font-color",
          "text-style"
        ],
        correctIndex: 0,
        explanation: "The 'color' property sets text color. 'background-color' sets background color.",
        difficulty: "easy",
        xp: 10,
        category: "css"
      }
    ],
    intermediate: [
      {
        question: "What is the CSS Box Model?",
        options: [
          "Content, Padding, Border, Margin",
          "Width, Height, Color, Font",
          "Top, Right, Bottom, Left",
          "Block, Inline, Flex, Grid"
        ],
        correctIndex: 0,
        explanation: "Box Model consists of: Content → Padding → Border → Margin (inside to outside).",
        difficulty: "medium",
        xp: 15,
        category: "css"
      },
      {
        question: "What does Flexbox do?",
        options: [
          "Creates flexible layouts in one dimension",
          "Makes images flexible",
          "Changes font size",
          "Adds animations"
        ],
        correctIndex: 0,
        explanation: "Flexbox is a one-dimensional layout system (row OR column). CSS Grid is two-dimensional.",
        difficulty: "medium",
        xp: 15,
        category: "css"
      },
      {
        question: "What is the purpose of semantic HTML?",
        options: [
          "Improves accessibility and SEO",
          "Makes pages load faster",
          "Adds styling",
          "Reduces file size"
        ],
        correctIndex: 0,
        explanation: "Semantic HTML (<header>, <nav>, <article>) provides meaning, improving accessibility and SEO.",
        difficulty: "medium",
        xp: 15,
        category: "html"
      },
      {
        question: "What is the difference between display: none and visibility: hidden?",
        options: [
          "display:none removes from layout, visibility:hidden keeps space",
          "They are the same",
          "visibility:hidden is faster",
          "display:none is deprecated"
        ],
        correctIndex: 0,
        explanation: "display:none removes element completely. visibility:hidden hides but maintains space.",
        difficulty: "medium",
        xp: 15,
        category: "css"
      },
      {
        question: "What is a media query used for?",
        options: [
          "Responsive design for different screen sizes",
          "Loading images",
          "Playing videos",
          "Audio controls"
        ],
        correctIndex: 0,
        explanation: "Media queries apply CSS based on device characteristics like screen width (responsive design).",
        difficulty: "medium",
        xp: 15,
        category: "css"
      }
    ],
    advanced: [
      {
        question: "What is CSS Grid?",
        options: [
          "A two-dimensional layout system",
          "A one-dimensional layout",
          "A design framework",
          "A JavaScript library"
        ],
        correctIndex: 0,
        explanation: "CSS Grid creates two-dimensional layouts (rows AND columns). Flexbox is one-dimensional.",
        difficulty: "hard",
        xp: 20,
        category: "css"
      },
      {
        question: "What are CSS Custom Properties (CSS Variables)?",
        options: [
          "Reusable values stored in --variable-name",
          "JavaScript variables",
          "HTML attributes",
          "Browser settings"
        ],
        correctIndex: 0,
        explanation: "CSS variables: --main-color: blue; use with var(--main-color). They cascade and can be changed dynamically.",
        difficulty: "hard",
        xp: 20,
        category: "css"
      },
      {
        question: "What is the Critical Rendering Path?",
        options: [
          "Steps browser takes to render page",
          "A design pattern",
          "A JavaScript framework",
          "A CSS property"
        ],
        correctIndex: 0,
        explanation: "Critical Rendering Path: DOM → CSSOM → Render Tree → Layout → Paint. Optimizing this improves performance.",
        difficulty: "hard",
        xp: 20,
        category: "performance"
      }
    ]
  },
  'data-science': {
    beginner: [
      {
        question: "What is NumPy used for in Python?",
        options: [
          "Numerical computing and arrays",
          "Web development",
          "Game development",
          "GUI creation"
        ],
        correctIndex: 0,
        explanation: "NumPy provides support for large arrays and matrices with mathematical functions.",
        difficulty: "easy",
        xp: 10,
        category: "numpy"
      },
      {
        question: "What does Pandas primarily work with?",
        options: [
          "DataFrames and Series",
          "Images",
          "Audio files",
          "Web requests"
        ],
        correctIndex: 0,
        explanation: "Pandas is a data manipulation library working with DataFrames (2D) and Series (1D).",
        difficulty: "easy",
        xp: 10,
        category: "pandas"
      },
      {
        question: "What type of chart is best for showing trends over time?",
        options: [
          "Line chart",
          "Pie chart",
          "Bar chart",
          "Scatter plot"
        ],
        correctIndex: 0,
        explanation: "Line charts show trends over time. Bar charts compare categories, pie shows proportions.",
        difficulty: "easy",
        xp: 10,
        category: "visualization"
      }
    ],
    intermediate: [
      {
        question: "What is the difference between mean and median?",
        options: [
          "Mean is average, median is middle value",
          "They are the same",
          "Mean is always larger",
          "Median is deprecated"
        ],
        correctIndex: 0,
        explanation: "Mean: sum/count. Median: middle value when sorted. Median is less affected by outliers.",
        difficulty: "medium",
        xp: 15,
        category: "statistics"
      },
      {
        question: "What does df.head() do in Pandas?",
        options: [
          "Shows first 5 rows of DataFrame",
          "Deletes top rows",
          "Sorts DataFrame",
          "Counts rows"
        ],
        correctIndex: 0,
        explanation: "df.head(n) shows first n rows (default 5). df.tail() shows last n rows.",
        difficulty: "medium",
        xp: 15,
        category: "pandas"
      }
    ],
    advanced: [
      {
        question: "What is the purpose of train-test split?",
        options: [
          "Evaluate model on unseen data",
          "Speed up training",
          "Reduce dataset size",
          "Clean data"
        ],
        correctIndex: 0,
        explanation: "Train-test split validates model performance on data it hasn't seen, preventing overfitting.",
        difficulty: "hard",
        xp: 20,
        category: "machine-learning"
      }
    ]
  },
  algorithms: {
    beginner: [
      {
        question: "What is Big O notation?",
        options: [
          "Measures algorithm time/space complexity",
          "A programming language",
          "A data structure",
          "A design pattern"
        ],
        correctIndex: 0,
        explanation: "Big O describes how algorithm performance scales with input size. O(1), O(n), O(n²), etc.",
        difficulty: "easy",
        xp: 10,
        category: "complexity"
      },
      {
        question: "What is the time complexity of binary search?",
        options: [
          "O(log n)",
          "O(n)",
          "O(n²)",
          "O(1)"
        ],
        correctIndex: 0,
        explanation: "Binary search halves search space each step, giving O(log n). Linear search is O(n).",
        difficulty: "easy",
        xp: 10,
        category: "searching"
      }
    ],
    intermediate: [
      {
        question: "What is a hash table?",
        options: [
          "Data structure with O(1) average lookup",
          "A sorting algorithm",
          "A tree structure",
          "A queue"
        ],
        correctIndex: 0,
        explanation: "Hash tables use hash functions for O(1) average-case insertion, deletion, and lookup.",
        difficulty: "medium",
        xp: 15,
        category: "data-structures"
      }
    ],
    advanced: [
      {
        question: "What is dynamic programming?",
        options: [
          "Solving problems by breaking into overlapping subproblems",
          "A programming paradigm",
          "A design pattern",
          "A testing method"
        ],
        correctIndex: 0,
        explanation: "Dynamic programming optimizes by storing solutions to subproblems (memoization or tabulation).",
        difficulty: "hard",
        xp: 20,
        category: "techniques"
      }
    ]
  }
};

export function getQuizByTopic(topic, difficulty = 'beginner', count = 5) {
  const normalizedTopic = topic.toLowerCase().trim();
  
  const topicMap = {
    'python': pythonQuizzes,
    'py': pythonQuizzes,
    'javascript': javascriptQuizzes,
    'js': javascriptQuizzes,
    'web': quizDatabase['web-development'],
    'web-dev': quizDatabase['web-development'],
    'web development': quizDatabase['web-development'],
    'html': quizDatabase['web-development'],
    'css': quizDatabase['web-development'],
    'data science': quizDatabase['data-science'],
    'data': quizDatabase['data-science'],
    'pandas': quizDatabase['data-science'],
    'numpy': quizDatabase['data-science'],
    'algorithms': quizDatabase.algorithms,
    'algo': quizDatabase.algorithms,
    'dsa': quizDatabase.algorithms
  };

  const quizSet = topicMap[normalizedTopic] || pythonQuizzes;
  const difficultyPool = quizSet[difficulty] || quizSet.beginner || [];
  
  if (difficultyPool.length === 0) {
    return [];
  }

  const shuffled = [...difficultyPool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

export default {
  quizDatabase,
  getQuizByTopic,
  getPythonQuiz,
  getJavaScriptQuiz
};
