export const pythonQuizzes = {
  beginner: [
    {
      question: "What is the correct way to create a variable in Python?",
      options: [
        "x = 5",
        "int x = 5",
        "var x = 5",
        "let x = 5"
      ],
      correctIndex: 0,
      explanation: "Python uses dynamic typing, so you don't need to specify the type. Just use 'variable_name = value'.",
      difficulty: "easy",
      xp: 10,
      category: "basics"
    },
    {
      question: "Which of these is NOT a valid Python data type?",
      options: [
        "list",
        "tuple",
        "array",
        "dictionary"
      ],
      correctIndex: 2,
      explanation: "Python doesn't have a built-in 'array' type (though NumPy adds arrays). Python has list, tuple, dict, set, etc.",
      difficulty: "easy",
      xp: 10,
      category: "data-types"
    },
    {
      question: "How do you write a comment in Python?",
      options: [
        "# This is a comment",
        "// This is a comment",
        "/* This is a comment */",
        "<!-- This is a comment -->"
      ],
      correctIndex: 0,
      explanation: "Python uses # for single-line comments and triple quotes (''' or \"\"\") for multi-line comments.",
      difficulty: "easy",
      xp: 10,
      category: "basics"
    },
    {
      question: "What does the len() function do?",
      options: [
        "Returns the length of an object",
        "Converts to lowercase",
        "Returns the largest number",
        "Deletes elements"
      ],
      correctIndex: 0,
      explanation: "len() returns the number of items in a container like a list, string, tuple, or dictionary.",
      difficulty: "easy",
      xp: 10,
      category: "functions"
    },
    {
      question: "Which keyword is used to create a function in Python?",
      options: [
        "def",
        "function",
        "fun",
        "func"
      ],
      correctIndex: 0,
      explanation: "Python uses 'def' to define functions: def my_function():",
      difficulty: "easy",
      xp: 10,
      category: "functions"
    },
    {
      question: "What is the output of: print(type(5))?",
      options: [
        "<class 'int'>",
        "<class 'float'>",
        "<class 'str'>",
        "5"
      ],
      correctIndex: 0,
      explanation: "The type() function returns the class/type of an object. 5 is an integer, so it returns <class 'int'>.",
      difficulty: "easy",
      xp: 10,
      category: "data-types"
    },
    {
      question: "How do you convert a string '123' to an integer?",
      options: [
        "int('123')",
        "str.to_int('123')",
        "Integer('123')",
        "parse('123')"
      ],
      correctIndex: 0,
      explanation: "int() converts strings and floats to integers. Example: int('123') returns 123.",
      difficulty: "easy",
      xp: 10,
      category: "type-conversion"
    },
    {
      question: "What will this print? print('Hello' + 'World')",
      options: [
        "HelloWorld",
        "Hello World",
        "Error",
        "Hello+World"
      ],
      correctIndex: 0,
      explanation: "The + operator concatenates strings in Python without adding spaces.",
      difficulty: "easy",
      xp: 10,
      category: "strings"
    },
    {
      question: "Which of these is the correct way to create a list?",
      options: [
        "my_list = [1, 2, 3]",
        "my_list = (1, 2, 3)",
        "my_list = {1, 2, 3}",
        "my_list = <1, 2, 3>"
      ],
      correctIndex: 0,
      explanation: "Lists use square brackets []. Tuples use (), sets use {}, and <> is not valid in Python.",
      difficulty: "easy",
      xp: 10,
      category: "data-structures"
    },
    {
      question: "What does the append() method do for lists?",
      options: [
        "Adds an element to the end",
        "Removes the last element",
        "Sorts the list",
        "Reverses the list"
      ],
      correctIndex: 0,
      explanation: "append() adds a single element to the end of a list. Example: [1, 2].append(3) → [1, 2, 3]",
      difficulty: "easy",
      xp: 10,
      category: "lists"
    }
  ],
  
  intermediate: [
    {
      question: "What is the output of: print([1, 2, 3][1:3])?",
      options: [
        "[2, 3]",
        "[1, 2]",
        "[1, 2, 3]",
        "[2]"
      ],
      correctIndex: 0,
      explanation: "List slicing [start:end] includes start index but excludes end index. [1:3] gets indices 1 and 2.",
      difficulty: "medium",
      xp: 15,
      category: "slicing"
    },
    {
      question: "What does *args allow in a function?",
      options: [
        "Variable number of positional arguments",
        "Variable number of keyword arguments",
        "Only one argument",
        "No arguments"
      ],
      correctIndex: 0,
      explanation: "*args collects extra positional arguments into a tuple. **kwargs does the same for keyword arguments.",
      difficulty: "medium",
      xp: 15,
      category: "functions"
    },
    {
      question: "What is a lambda function?",
      options: [
        "An anonymous one-line function",
        "A regular function",
        "A class method",
        "A loop"
      ],
      correctIndex: 0,
      explanation: "Lambda functions are anonymous functions defined in one line: lambda x: x * 2",
      difficulty: "medium",
      xp: 15,
      category: "functions"
    },
    {
      question: "What does list comprehension [x**2 for x in range(5)] produce?",
      options: [
        "[0, 1, 4, 9, 16]",
        "[0, 1, 2, 3, 4]",
        "[1, 2, 3, 4, 5]",
        "[1, 4, 9, 16, 25]"
      ],
      correctIndex: 0,
      explanation: "List comprehension squares each number from 0-4: 0²=0, 1²=1, 2²=4, 3²=9, 4²=16",
      difficulty: "medium",
      xp: 15,
      category: "comprehensions"
    },
    {
      question: "What is the difference between is and ==?",
      options: [
        "'is' checks identity, '==' checks equality",
        "They are the same",
        "'is' checks equality, '==' checks identity",
        "'is' is faster"
      ],
      correctIndex: 0,
      explanation: "'is' checks if two variables point to the same object in memory. '==' checks if values are equal.",
      difficulty: "medium",
      xp: 15,
      category: "operators"
    },
    {
      question: "What does the zip() function do?",
      options: [
        "Combines multiple iterables into tuples",
        "Compresses files",
        "Reverses a list",
        "Sorts elements"
      ],
      correctIndex: 0,
      explanation: "zip() pairs elements from multiple iterables: zip([1,2], ['a','b']) → [(1,'a'), (2,'b')]",
      difficulty: "medium",
      xp: 15,
      category: "functions"
    },
    {
      question: "What is the purpose of __init__ in a class?",
      options: [
        "Constructor to initialize objects",
        "Destructor to clean up",
        "Main function",
        "Import statement"
      ],
      correctIndex: 0,
      explanation: "__init__ is the constructor method called when creating a new instance of a class.",
      difficulty: "medium",
      xp: 15,
      category: "oop"
    },
    {
      question: "What does enumerate() do?",
      options: [
        "Returns index and value pairs",
        "Counts items",
        "Sorts a list",
        "Removes duplicates"
      ],
      correctIndex: 0,
      explanation: "enumerate() adds a counter to an iterable: enumerate(['a','b']) → [(0,'a'), (1,'b')]",
      difficulty: "medium",
      xp: 15,
      category: "functions"
    },
    {
      question: "What's the difference between remove() and pop() for lists?",
      options: [
        "remove() takes value, pop() takes index",
        "They are identical",
        "remove() is faster",
        "pop() doesn't work on lists"
      ],
      correctIndex: 0,
      explanation: "remove(value) deletes first occurrence of a value. pop(index) removes and returns element at index.",
      difficulty: "medium",
      xp: 15,
      category: "lists"
    },
    {
      question: "What does the with statement do?",
      options: [
        "Context management for resource cleanup",
        "Creates a loop",
        "Defines a function",
        "Imports modules"
      ],
      correctIndex: 0,
      explanation: "'with' ensures proper cleanup (like closing files). with open('file.txt') as f: automatically closes the file.",
      difficulty: "medium",
      xp: 15,
      category: "file-handling"
    }
  ],
  
  advanced: [
    {
      question: "What is a decorator in Python?",
      options: [
        "A function that modifies another function",
        "A design pattern",
        "A class method",
        "A loop construct"
      ],
      correctIndex: 0,
      explanation: "Decorators wrap functions to extend behavior without modifying the original function. Syntax: @decorator",
      difficulty: "hard",
      xp: 20,
      category: "advanced-functions"
    },
    {
      question: "What is the difference between deepcopy and shallow copy?",
      options: [
        "Deepcopy copies nested objects, shallow doesn't",
        "They are the same",
        "Shallow is slower",
        "Deepcopy only works on lists"
      ],
      correctIndex: 0,
      explanation: "Shallow copy creates a new object but references nested objects. Deepcopy recursively copies everything.",
      difficulty: "hard",
      xp: 20,
      category: "memory"
    },
    {
      question: "What is a generator in Python?",
      options: [
        "A function that yields values lazily",
        "A random number creator",
        "A class factory",
        "A module loader"
      ],
      correctIndex: 0,
      explanation: "Generators use yield to produce values on-demand, saving memory. They're iterators that generate values lazily.",
      difficulty: "hard",
      xp: 20,
      category: "generators"
    },
    {
      question: "What does the GIL (Global Interpreter Lock) do?",
      options: [
        "Ensures only one thread executes Python code at a time",
        "Locks files",
        "Prevents memory leaks",
        "Speeds up execution"
      ],
      correctIndex: 0,
      explanation: "The GIL is a mutex that protects Python objects, preventing multiple threads from executing Python bytecode simultaneously.",
      difficulty: "hard",
      xp: 20,
      category: "concurrency"
    },
    {
      question: "What is the purpose of __call__ method?",
      options: [
        "Makes an object callable like a function",
        "Initializes the object",
        "Deletes the object",
        "Compares objects"
      ],
      correctIndex: 0,
      explanation: "__call__ allows an instance to be called as a function: obj() calls obj.__call__()",
      difficulty: "hard",
      xp: 20,
      category: "magic-methods"
    },
    {
      question: "What is monkey patching?",
      options: [
        "Modifying code at runtime",
        "A debugging technique",
        "A design pattern",
        "Error handling"
      ],
      correctIndex: 0,
      explanation: "Monkey patching is dynamically modifying a class or module at runtime, often to fix bugs or add features.",
      difficulty: "hard",
      xp: 20,
      category: "metaprogramming"
    },
    {
      question: "What does asyncio.gather() do?",
      options: [
        "Runs multiple coroutines concurrently",
        "Collects garbage",
        "Groups imports",
        "Batches database queries"
      ],
      correctIndex: 0,
      explanation: "asyncio.gather() runs multiple async tasks concurrently and waits for all to complete.",
      difficulty: "hard",
      xp: 20,
      category: "async"
    },
    {
      question: "What is the purpose of __slots__?",
      options: [
        "Restricts attributes and saves memory",
        "Creates slots for data",
        "Enables inheritance",
        "Speeds up functions"
      ],
      correctIndex: 0,
      explanation: "__slots__ restricts instance attributes to save memory by avoiding __dict__ creation.",
      difficulty: "hard",
      xp: 20,
      category: "optimization"
    },
    {
      question: "What is metaclass in Python?",
      options: [
        "A class of a class",
        "A parent class",
        "An abstract class",
        "A mixin"
      ],
      correctIndex: 0,
      explanation: "Metaclasses define how classes behave. They're 'classes that create classes', allowing deep customization.",
      difficulty: "hard",
      xp: 20,
      category: "metaprogramming"
    },
    {
      question: "What does functools.lru_cache do?",
      options: [
        "Caches function results for performance",
        "Limits recursion depth",
        "Logs function calls",
        "Runs functions in parallel"
      ],
      correctIndex: 0,
      explanation: "@lru_cache memoizes function results using LRU (Least Recently Used) caching for optimization.",
      difficulty: "hard",
      xp: 20,
      category: "optimization"
    }
  ]
};

export function getPythonQuiz(difficulty = 'beginner', count = 5) {
  const pool = pythonQuizzes[difficulty] || pythonQuizzes.beginner;
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

export default pythonQuizzes;
