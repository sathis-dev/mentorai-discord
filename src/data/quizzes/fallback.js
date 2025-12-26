export const fallbackQuizzes = {
  javascript: [
    {
      question: 'What is the correct way to declare a variable in modern JavaScript?',
      options: ['var x = 5', 'let x = 5', 'variable x = 5', 'int x = 5'],
      correctIndex: 1,
      explanation: 'let and const are the modern ways to declare variables in JavaScript (ES6+).',
    },
    {
      question: 'Which method adds an element to the end of an array?',
      options: ['push()', 'pop()', 'shift()', 'unshift()'],
      correctIndex: 0,
      explanation: 'push() adds to the end, pop() removes from end, shift() removes from start, unshift() adds to start.',
    },
    {
      question: 'What does === compare in JavaScript?',
      options: ['Only value', 'Only type', 'Value and type', 'Reference only'],
      correctIndex: 2,
      explanation: 'The strict equality operator (===) compares both value and type.',
    },
    {
      question: 'What is a closure in JavaScript?',
      options: [
        'A way to close the browser',
        'A function that has access to outer scope variables',
        'A method to end a loop',
        'A type of array'
      ],
      correctIndex: 1,
      explanation: 'A closure is a function that retains access to variables from its outer (enclosing) scope.',
    },
    {
      question: 'Which keyword is used to define an async function?',
      options: ['await', 'async', 'promise', 'defer'],
      correctIndex: 1,
      explanation: 'The async keyword is used before function to make it asynchronous.',
    },
  ],
  python: [
    {
      question: 'How do you start a comment in Python?',
      options: ['//', '#', '/*', '--'],
      correctIndex: 1,
      explanation: 'Python uses # for single-line comments.',
    },
    {
      question: 'Which is the correct way to create a list in Python?',
      options: ['list = (1, 2, 3)', 'list = [1, 2, 3]', 'list = {1, 2, 3}', 'list = <1, 2, 3>'],
      correctIndex: 1,
      explanation: 'Lists in Python use square brackets [].',
    },
    {
      question: 'What does the len() function do?',
      options: ['Calculates length/size', 'Creates a new list', 'Sorts items', 'Prints output'],
      correctIndex: 0,
      explanation: 'len() returns the number of items in a sequence or collection.',
    },
    {
      question: 'Which loop is used for iterating over a sequence?',
      options: ['while loop', 'do-while loop', 'for loop', 'repeat loop'],
      correctIndex: 2,
      explanation: 'The for loop in Python is designed for iterating over sequences.',
    },
    {
      question: 'What is a dictionary in Python?',
      options: ['A list of words', 'Key-value pairs collection', 'A type of function', 'A module'],
      correctIndex: 1,
      explanation: 'Dictionaries store data as key-value pairs using curly braces {}.',
    },
  ],
  general: [
    {
      question: 'What does API stand for?',
      options: [
        'Application Programming Interface',
        'Automated Program Integration',
        'Application Process Integration',
        'Advanced Programming Input'
      ],
      correctIndex: 0,
      explanation: 'API stands for Application Programming Interface.',
    },
    {
      question: 'What is an algorithm?',
      options: [
        'A programming language',
        'A step-by-step procedure to solve a problem',
        'A type of computer',
        'A database system'
      ],
      correctIndex: 1,
      explanation: 'An algorithm is a set of instructions to accomplish a specific task.',
    },
    {
      question: 'What does HTML stand for?',
      options: [
        'Hyper Text Markup Language',
        'High Tech Modern Language',
        'Hyper Transfer Markup Language',
        'Home Tool Markup Language'
      ],
      correctIndex: 0,
      explanation: 'HTML stands for Hyper Text Markup Language.',
    },
    {
      question: 'What is version control used for?',
      options: [
        'Controlling computer versions',
        'Tracking changes in code over time',
        'Managing software licenses',
        'Testing software versions'
      ],
      correctIndex: 1,
      explanation: 'Version control systems like Git track code changes and enable collaboration.',
    },
    {
      question: 'What is debugging?',
      options: [
        'Adding bugs to code',
        'Finding and fixing errors in code',
        'Removing features',
        'Writing documentation'
      ],
      correctIndex: 1,
      explanation: 'Debugging is the process of identifying and removing errors from code.',
    },
  ],
  html: [
    {
      question: 'Which tag is used for the largest heading?',
      options: ['<h6>', '<h1>', '<head>', '<header>'],
      correctIndex: 1,
      explanation: '<h1> is the largest heading, <h6> is the smallest.',
    },
    {
      question: 'What does the <a> tag do?',
      options: ['Creates an image', 'Creates a link', 'Creates a list', 'Creates a paragraph'],
      correctIndex: 1,
      explanation: 'The <a> (anchor) tag creates hyperlinks.',
    },
    {
      question: 'Which attribute specifies the URL in a link?',
      options: ['src', 'href', 'link', 'url'],
      correctIndex: 1,
      explanation: 'The href attribute specifies the link destination.',
    },
  ],
  css: [
    {
      question: 'How do you select an element with id "demo"?',
      options: ['.demo', '#demo', 'demo', '*demo'],
      correctIndex: 1,
      explanation: 'The # symbol is used to select elements by ID.',
    },
    {
      question: 'Which property changes the text color?',
      options: ['font-color', 'text-color', 'color', 'foreground'],
      correctIndex: 2,
      explanation: 'The color property sets the text color in CSS.',
    },
    {
      question: 'What does "flex" display value enable?',
      options: ['Block layout', 'Flexbox layout', 'Grid layout', 'Inline layout'],
      correctIndex: 1,
      explanation: 'display: flex enables Flexbox layout for flexible container design.',
    },
  ],
};
