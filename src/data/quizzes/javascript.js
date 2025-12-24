export const javascriptQuizzes = {
  beginner: [
    {
      question: "What is the correct way to declare a variable in modern JavaScript?",
      options: [
        "let x = 5;",
        "var x = 5;",
        "int x = 5;",
        "variable x = 5;"
      ],
      correctIndex: 0,
      explanation: "Modern JavaScript uses 'let' for variables that can change and 'const' for constants. 'var' is outdated.",
      difficulty: "easy",
      xp: 10,
      category: "basics"
    },
    {
      question: "What does === check in JavaScript?",
      options: [
        "Value and type equality (strict equality)",
        "Only value equality",
        "Reference equality",
        "String comparison"
      ],
      correctIndex: 0,
      explanation: "=== checks both value AND type. 5 === '5' is false. == only checks value (type coercion).",
      difficulty: "easy",
      xp: 10,
      category: "operators"
    },
    {
      question: "How do you write a function in JavaScript?",
      options: [
        "function myFunc() {}",
        "def myFunc():",
        "func myFunc() {}",
        "function: myFunc() {}"
      ],
      correctIndex: 0,
      explanation: "JavaScript uses 'function' keyword or arrow functions: const myFunc = () => {}",
      difficulty: "easy",
      xp: 10,
      category: "functions"
    },
    {
      question: "What is the output of: console.log(typeof null)?",
      options: [
        "object",
        "null",
        "undefined",
        "number"
      ],
      correctIndex: 0,
      explanation: "This is a famous JavaScript bug! typeof null returns 'object' instead of 'null'.",
      difficulty: "easy",
      xp: 10,
      category: "types"
    },
    {
      question: "How do you create an array in JavaScript?",
      options: [
        "const arr = [1, 2, 3];",
        "const arr = (1, 2, 3);",
        "const arr = {1, 2, 3};",
        "array arr = [1, 2, 3];"
      ],
      correctIndex: 0,
      explanation: "Arrays use square brackets []. Parentheses () are for grouping, braces {} for objects.",
      difficulty: "easy",
      xp: 10,
      category: "arrays"
    },
    {
      question: "What does the push() method do?",
      options: [
        "Adds element to end of array",
        "Removes last element",
        "Sorts array",
        "Reverses array"
      ],
      correctIndex: 0,
      explanation: "push() adds elements to the end. pop() removes from end. unshift() adds to start, shift() removes from start.",
      difficulty: "easy",
      xp: 10,
      category: "arrays"
    },
    {
      question: "How do you write a single-line comment?",
      options: [
        "// This is a comment",
        "# This is a comment",
        "<!-- This is a comment -->",
        "/* This is a comment */"
      ],
      correctIndex: 0,
      explanation: "JavaScript uses // for single-line and /* */ for multi-line comments.",
      difficulty: "easy",
      xp: 10,
      category: "basics"
    },
    {
      question: "What is the correct way to write an if statement?",
      options: [
        "if (x > 5) { }",
        "if x > 5 then { }",
        "if (x > 5): { }",
        "if x > 5 { }"
      ],
      correctIndex: 0,
      explanation: "JavaScript if statements use parentheses for condition and braces for the code block.",
      difficulty: "easy",
      xp: 10,
      category: "control-flow"
    },
    {
      question: "What does the length property return for [1, 2, 3]?",
      options: [
        "3",
        "2",
        "undefined",
        "Error"
      ],
      correctIndex: 0,
      explanation: ".length returns the number of elements in an array or characters in a string.",
      difficulty: "easy",
      xp: 10,
      category: "arrays"
    },
    {
      question: "How do you concatenate strings in JavaScript?",
      options: [
        "'Hello' + ' ' + 'World'",
        "'Hello' . ' ' . 'World'",
        "'Hello' & ' ' & 'World'",
        "concat('Hello', 'World')"
      ],
      correctIndex: 0,
      explanation: "Use + operator or template literals: `Hello ${variable} World`",
      difficulty: "easy",
      xp: 10,
      category: "strings"
    }
  ],
  
  intermediate: [
    {
      question: "What is the difference between let and const?",
      options: [
        "const cannot be reassigned, let can",
        "They are identical",
        "let is faster",
        "const is global only"
      ],
      correctIndex: 0,
      explanation: "const creates a constant reference (can't reassign). let allows reassignment. Both are block-scoped.",
      difficulty: "medium",
      xp: 15,
      category: "variables"
    },
    {
      question: "What does the map() method do?",
      options: [
        "Creates new array by transforming each element",
        "Filters array elements",
        "Sorts the array",
        "Finds an element"
      ],
      correctIndex: 0,
      explanation: "map() transforms each element and returns a new array: [1,2,3].map(x => x*2) → [2,4,6]",
      difficulty: "medium",
      xp: 15,
      category: "arrays"
    },
    {
      question: "What is the output of: [1, 2, 3].filter(x => x > 1)?",
      options: [
        "[2, 3]",
        "[1, 2, 3]",
        "[1]",
        "3"
      ],
      correctIndex: 0,
      explanation: "filter() returns a new array with elements that pass the test. Elements > 1 are 2 and 3.",
      difficulty: "medium",
      xp: 15,
      category: "arrays"
    },
    {
      question: "What is an arrow function?",
      options: [
        "A shorter syntax for functions: () => {}",
        "A function pointer",
        "A class method",
        "A loop"
      ],
      correctIndex: 0,
      explanation: "Arrow functions provide shorter syntax and lexical 'this' binding: const add = (a, b) => a + b",
      difficulty: "medium",
      xp: 15,
      category: "functions"
    },
    {
      question: "What does destructuring do? const {name, age} = person;",
      options: [
        "Extracts properties from objects",
        "Deletes properties",
        "Creates new objects",
        "Copies objects"
      ],
      correctIndex: 0,
      explanation: "Destructuring unpacks values from arrays or properties from objects into distinct variables.",
      difficulty: "medium",
      xp: 15,
      category: "es6"
    },
    {
      question: "What is the spread operator (...)?",
      options: [
        "Expands iterables into individual elements",
        "Multiplies numbers",
        "Concatenates strings",
        "Deletes items"
      ],
      correctIndex: 0,
      explanation: "Spread operator unpacks arrays/objects: [...arr1, ...arr2] or {...obj1, ...obj2}",
      difficulty: "medium",
      xp: 15,
      category: "es6"
    },
    {
      question: "What does async/await do?",
      options: [
        "Handles asynchronous code synchronously",
        "Speeds up code",
        "Creates threads",
        "Delays execution"
      ],
      correctIndex: 0,
      explanation: "async/await makes asynchronous code look synchronous, making it easier to read and write.",
      difficulty: "medium",
      xp: 15,
      category: "async"
    },
    {
      question: "What is the difference between == and ===?",
      options: [
        "=== checks type and value, == only value",
        "They are the same",
        "== is faster",
        "=== is deprecated"
      ],
      correctIndex: 0,
      explanation: "=== is strict equality (no type coercion). == allows type conversion: '5' == 5 is true, '5' === 5 is false.",
      difficulty: "medium",
      xp: 15,
      category: "operators"
    },
    {
      question: "What does JSON.parse() do?",
      options: [
        "Converts JSON string to JavaScript object",
        "Converts object to JSON string",
        "Validates JSON",
        "Formats JSON"
      ],
      correctIndex: 0,
      explanation: "JSON.parse() parses JSON string into JS object. JSON.stringify() does the opposite.",
      difficulty: "medium",
      xp: 15,
      category: "json"
    },
    {
      question: "What is a callback function?",
      options: [
        "A function passed as an argument to another function",
        "A function that calls itself",
        "A return function",
        "A class method"
      ],
      correctIndex: 0,
      explanation: "Callbacks are functions passed as arguments to be executed later: setTimeout(callback, 1000)",
      difficulty: "medium",
      xp: 15,
      category: "functions"
    }
  ],
  
  advanced: [
    {
      question: "What is a closure in JavaScript?",
      options: [
        "A function with access to outer function's variables",
        "A closed function",
        "A private method",
        "A class constructor"
      ],
      correctIndex: 0,
      explanation: "Closures allow inner functions to access outer function variables even after outer function returns.",
      difficulty: "hard",
      xp: 20,
      category: "closures"
    },
    {
      question: "What is the event loop?",
      options: [
        "Manages asynchronous operations in JavaScript",
        "A for loop",
        "An event listener",
        "A debugging tool"
      ],
      correctIndex: 0,
      explanation: "The event loop handles async operations by managing the call stack, callback queue, and Web APIs.",
      difficulty: "hard",
      xp: 20,
      category: "async"
    },
    {
      question: "What is prototypal inheritance?",
      options: [
        "Objects inherit from other objects via prototype chain",
        "Class-based inheritance",
        "Multiple inheritance",
        "Interface implementation"
      ],
      correctIndex: 0,
      explanation: "JavaScript uses prototypes, not classes. Objects can inherit properties from other objects via __proto__.",
      difficulty: "hard",
      xp: 20,
      category: "oop"
    },
    {
      question: "What does Promise.all() do?",
      options: [
        "Waits for all promises to resolve",
        "Runs promises in sequence",
        "Returns first resolved promise",
        "Cancels all promises"
      ],
      correctIndex: 0,
      explanation: "Promise.all() runs multiple promises concurrently and resolves when ALL complete (or rejects if ANY fails).",
      difficulty: "hard",
      xp: 20,
      category: "promises"
    },
    {
      question: "What is the difference between call() and apply()?",
      options: [
        "call() takes arguments separately, apply() as array",
        "They are identical",
        "call() is faster",
        "apply() is deprecated"
      ],
      correctIndex: 0,
      explanation: "Both invoke functions with specific 'this'. call(obj, a, b), apply(obj, [a, b]). bind() creates new function.",
      difficulty: "hard",
      xp: 20,
      category: "functions"
    },
    {
      question: "What is hoisting in JavaScript?",
      options: [
        "Variables/functions moved to top of scope during compilation",
        "Lifting performance",
        "Memory management",
        "Code optimization"
      ],
      correctIndex: 0,
      explanation: "Hoisting moves declarations to the top. var is hoisted and initialized with undefined. let/const throw errors.",
      difficulty: "hard",
      xp: 20,
      category: "scope"
    },
    {
      question: "What is the difference between Map and Object?",
      options: [
        "Map allows any key type, Object only strings/symbols",
        "They are identical",
        "Map is faster always",
        "Object is deprecated"
      ],
      correctIndex: 0,
      explanation: "Map: any key type, maintains insertion order, has size property. Object: string/symbol keys only.",
      difficulty: "hard",
      xp: 20,
      category: "data-structures"
    },
    {
      question: "What is WeakMap used for?",
      options: [
        "Storing objects without preventing garbage collection",
        "Weak references",
        "Small datasets",
        "Temporary storage"
      ],
      correctIndex: 0,
      explanation: "WeakMap only accepts objects as keys and doesn't prevent garbage collection, useful for private data.",
      difficulty: "hard",
      xp: 20,
      category: "memory"
    },
    {
      question: "What is the difference between null and undefined?",
      options: [
        "null is assigned, undefined is default",
        "They are identical",
        "null is a number",
        "undefined is deprecated"
      ],
      correctIndex: 0,
      explanation: "undefined means variable declared but not assigned. null is explicitly assigned absence of value.",
      difficulty: "hard",
      xp: 20,
      category: "types"
    },
    {
      question: "What is memoization?",
      options: [
        "Caching function results for performance",
        "Memory management",
        "Data compression",
        "Code optimization"
      ],
      correctIndex: 0,
      explanation: "Memoization caches expensive function results to avoid recalculation with same inputs.",
      difficulty: "hard",
      xp: 20,
      category: "optimization"
    }
  ]
};

export function getJavaScriptQuiz(difficulty = 'beginner', count = 5) {
  const pool = javascriptQuizzes[difficulty] || javascriptQuizzes.beginner;
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

export default javascriptQuizzes;
