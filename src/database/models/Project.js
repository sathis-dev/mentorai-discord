import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema({
  projectId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  description: { type: String, required: true },
  language: { type: String, required: true },
  difficulty: { 
    type: String, 
    enum: ['beginner', 'intermediate', 'advanced'],
    default: 'beginner'
  },
  estimatedTime: { type: Number, default: 30 }, // in minutes
  xpReward: { type: Number, default: 250 },
  badgeReward: { type: String },
  
  // Project steps
  steps: [{
    stepNumber: { type: Number, required: true },
    title: { type: String, required: true },
    instruction: { type: String, required: true },
    starterCode: { type: String, default: '' },
    hints: [String],
    solution: { type: String },
    validation: { type: String }, // What to check for
    testCases: [{
      input: String,
      expectedOutput: String,
      isHidden: { type: Boolean, default: false }
    }]
  }],
  
  // Project metadata
  tags: [String],
  prerequisites: [String],
  learningOutcomes: [String],
  
  // Stats
  completions: { type: Number, default: 0 },
  averageRating: { type: Number, default: 0 },
  totalRatings: { type: Number, default: 0 },
  
  // Status
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Add rating method
projectSchema.methods.addRating = async function(rating) {
  const newTotal = this.totalRatings + 1;
  this.averageRating = ((this.averageRating * this.totalRatings) + rating) / newTotal;
  this.totalRatings = newTotal;
  await this.save();
};

// Index for efficient lookups
projectSchema.index({ language: 1, difficulty: 1 });
projectSchema.index({ isActive: 1 });

export const Project = mongoose.model('Project', projectSchema);

// ============================================
// SEED DATA - Pre-built projects
// ============================================

export const SEED_PROJECTS = [
  {
    projectId: 'calculator-python',
    name: 'Simple Calculator',
    description: 'Build a functional calculator that performs basic arithmetic operations',
    language: 'python',
    difficulty: 'beginner',
    estimatedTime: 20,
    xpReward: 200,
    badgeReward: 'project_builder',
    tags: ['math', 'functions', 'user-input'],
    prerequisites: ['Python basics', 'Functions'],
    learningOutcomes: [
      'Handle user input',
      'Write reusable functions',
      'Use conditional statements'
    ],
    steps: [
      {
        stepNumber: 1,
        title: 'Define the Operations',
        instruction: 'Create functions for add, subtract, multiply, and divide operations. Each should take two numbers and return the result.',
        starterCode: '# Define your calculator functions here\n\ndef add(a, b):\n    # Your code here\n    pass\n\ndef subtract(a, b):\n    # Your code here\n    pass',
        hints: [
          'Use the + operator for addition',
          'Remember to return the result',
          'For division, consider what happens when b is 0'
        ],
        solution: 'def add(a, b):\n    return a + b\n\ndef subtract(a, b):\n    return a - b\n\ndef multiply(a, b):\n    return a * b\n\ndef divide(a, b):\n    if b == 0:\n        return "Error: Division by zero"\n    return a / b',
        testCases: [
          { input: 'add(5, 3)', expectedOutput: '8' },
          { input: 'subtract(10, 4)', expectedOutput: '6' }
        ]
      },
      {
        stepNumber: 2,
        title: 'Create the Menu',
        instruction: 'Create a main function that displays a menu and gets user input for the operation and numbers.',
        starterCode: 'def calculator():\n    print("=== Calculator ===")\n    print("1. Add")\n    print("2. Subtract")\n    # Add more menu options\n    \n    choice = input("Enter choice (1-4): ")\n    # Get numbers from user',
        hints: [
          'Use input() to get user choices',
          'Convert string input to numbers with float()',
          'Use if/elif/else for menu choices'
        ],
        solution: 'def calculator():\n    print("=== Calculator ===")\n    print("1. Add")\n    print("2. Subtract")\n    print("3. Multiply")\n    print("4. Divide")\n    \n    choice = input("Enter choice (1-4): ")\n    num1 = float(input("Enter first number: "))\n    num2 = float(input("Enter second number: "))\n    \n    if choice == "1":\n        print(f"Result: {add(num1, num2)}")\n    elif choice == "2":\n        print(f"Result: {subtract(num1, num2)}")\n    elif choice == "3":\n        print(f"Result: {multiply(num1, num2)}")\n    elif choice == "4":\n        print(f"Result: {divide(num1, num2)}")\n    else:\n        print("Invalid choice")'
      },
      {
        stepNumber: 3,
        title: 'Add Loop and Error Handling',
        instruction: 'Wrap your calculator in a loop so users can do multiple calculations, and add error handling for invalid inputs.',
        starterCode: 'def main():\n    while True:\n        calculator()\n        again = input("Calculate again? (y/n): ")\n        if again.lower() != "y":\n            print("Goodbye!")\n            break\n\n# Add try/except for error handling',
        hints: [
          'Use while True for continuous loop',
          'Use try/except to catch ValueError',
          'Check if user wants to continue'
        ],
        solution: 'def main():\n    while True:\n        try:\n            calculator()\n        except ValueError:\n            print("Invalid input! Please enter numbers only.")\n        \n        again = input("Calculate again? (y/n): ")\n        if again.lower() != "y":\n            print("Thanks for using Calculator!")\n            break\n\nif __name__ == "__main__":\n    main()'
      }
    ]
  },
  {
    projectId: 'todo-javascript',
    name: 'Todo List App',
    description: 'Build a command-line todo list with add, complete, and delete functionality',
    language: 'javascript',
    difficulty: 'beginner',
    estimatedTime: 30,
    xpReward: 250,
    badgeReward: 'project_builder',
    tags: ['arrays', 'objects', 'CRUD'],
    prerequisites: ['JavaScript basics', 'Arrays'],
    learningOutcomes: [
      'Work with arrays and objects',
      'Implement CRUD operations',
      'Manage application state'
    ],
    steps: [
      {
        stepNumber: 1,
        title: 'Set Up Data Structure',
        instruction: 'Create an array to store todos and functions to add and list todos.',
        starterCode: '// Todo list application\nconst todos = [];\n\nfunction addTodo(text) {\n    // Add a new todo with id, text, and completed status\n}\n\nfunction listTodos() {\n    // Display all todos\n}',
        hints: [
          'Each todo should be an object with id, text, completed',
          'Use Date.now() for unique IDs',
          'Use forEach or map to display todos'
        ],
        solution: 'const todos = [];\nlet nextId = 1;\n\nfunction addTodo(text) {\n    todos.push({\n        id: nextId++,\n        text: text,\n        completed: false,\n        createdAt: new Date()\n    });\n    console.log(`Added: "${text}"`);\n}\n\nfunction listTodos() {\n    if (todos.length === 0) {\n        console.log("No todos yet!");\n        return;\n    }\n    todos.forEach(todo => {\n        const status = todo.completed ? "" : "";\n        console.log(`${todo.id}. [${status}] ${todo.text}`);\n    });\n}'
      },
      {
        stepNumber: 2,
        title: 'Add Complete and Delete',
        instruction: 'Create functions to mark todos as complete and delete todos by ID.',
        starterCode: 'function completeTodo(id) {\n    // Find todo by id and mark as completed\n}\n\nfunction deleteTodo(id) {\n    // Remove todo from array\n}',
        hints: [
          'Use find() to locate a todo by ID',
          'Use filter() or splice() to remove items',
          'Handle case when ID is not found'
        ],
        solution: 'function completeTodo(id) {\n    const todo = todos.find(t => t.id === id);\n    if (todo) {\n        todo.completed = true;\n        console.log(`Completed: "${todo.text}"`);\n    } else {\n        console.log("Todo not found!");\n    }\n}\n\nfunction deleteTodo(id) {\n    const index = todos.findIndex(t => t.id === id);\n    if (index !== -1) {\n        const removed = todos.splice(index, 1)[0];\n        console.log(`Deleted: "${removed.text}"`);\n    } else {\n        console.log("Todo not found!");\n    }\n}'
      },
      {
        stepNumber: 3,
        title: 'Create Interactive Menu',
        instruction: 'Build a menu system that lets users interact with the todo list.',
        starterCode: 'const readline = require("readline");\n\nconst rl = readline.createInterface({\n    input: process.stdin,\n    output: process.stdout\n});\n\nfunction showMenu() {\n    console.log("\\n=== Todo List ===");\n    console.log("1. Add todo");\n    console.log("2. List todos");\n    // Add more options\n}',
        hints: [
          'Use readline for Node.js input',
          'Use switch/case for menu options',
          'Call showMenu recursively for loop'
        ],
        solution: 'function showMenu() {\n    console.log("\\n=== Todo List ===");\n    console.log("1. Add todo");\n    console.log("2. List todos");\n    console.log("3. Complete todo");\n    console.log("4. Delete todo");\n    console.log("5. Exit");\n    \n    rl.question("Choose option: ", (choice) => {\n        switch(choice) {\n            case "1":\n                rl.question("Enter todo: ", (text) => {\n                    addTodo(text);\n                    showMenu();\n                });\n                break;\n            case "2":\n                listTodos();\n                showMenu();\n                break;\n            case "3":\n                rl.question("Enter ID: ", (id) => {\n                    completeTodo(parseInt(id));\n                    showMenu();\n                });\n                break;\n            case "4":\n                rl.question("Enter ID: ", (id) => {\n                    deleteTodo(parseInt(id));\n                    showMenu();\n                });\n                break;\n            case "5":\n                console.log("Goodbye!");\n                rl.close();\n                break;\n            default:\n                console.log("Invalid option");\n                showMenu();\n        }\n    });\n}\n\nshowMenu();'
      }
    ]
  },
  {
    projectId: 'weather-python',
    name: 'Weather App',
    description: 'Build a weather application that fetches real weather data from an API',
    language: 'python',
    difficulty: 'intermediate',
    estimatedTime: 45,
    xpReward: 400,
    badgeReward: 'api_master',
    tags: ['API', 'JSON', 'requests'],
    prerequisites: ['Python basics', 'Functions', 'Dictionaries'],
    learningOutcomes: [
      'Work with REST APIs',
      'Parse JSON data',
      'Handle API errors gracefully'
    ],
    steps: [
      {
        stepNumber: 1,
        title: 'Set Up API Connection',
        instruction: 'Create a function to fetch weather data from a free weather API (we\'ll use wttr.in which needs no API key).',
        starterCode: 'import requests\nimport json\n\ndef get_weather(city):\n    # Fetch weather from wttr.in API\n    # URL: https://wttr.in/{city}?format=j1\n    pass',
        hints: [
          'Use requests.get() to fetch data',
          'The response has .json() method',
          'Handle requests.exceptions.RequestException'
        ],
        solution: 'import requests\n\ndef get_weather(city):\n    try:\n        url = f"https://wttr.in/{city}?format=j1"\n        response = requests.get(url, timeout=10)\n        response.raise_for_status()\n        return response.json()\n    except requests.exceptions.RequestException as e:\n        print(f"Error fetching weather: {e}")\n        return None'
      },
      {
        stepNumber: 2,
        title: 'Parse Weather Data',
        instruction: 'Create a function to extract and format the relevant weather information.',
        starterCode: 'def parse_weather(data):\n    # Extract: temperature, description, humidity, wind\n    # Return formatted weather info\n    pass',
        hints: [
          'Weather data is nested in data["current_condition"][0]',
          'Temperature is in temp_C or temp_F',
          'Use f-strings for nice formatting'
        ],
        solution: 'def parse_weather(data):\n    if not data:\n        return None\n    \n    try:\n        current = data["current_condition"][0]\n        location = data["nearest_area"][0]\n        \n        return {\n            "city": location["areaName"][0]["value"],\n            "country": location["country"][0]["value"],\n            "temp_c": current["temp_C"],\n            "temp_f": current["temp_F"],\n            "description": current["weatherDesc"][0]["value"],\n            "humidity": current["humidity"],\n            "wind_kmph": current["windspeedKmph"],\n            "feels_like": current["FeelsLikeC"]\n        }\n    except (KeyError, IndexError) as e:\n        print(f"Error parsing weather: {e}")\n        return None'
      },
      {
        stepNumber: 3,
        title: 'Display Weather Nicely',
        instruction: 'Create a display function that shows weather in a nice formatted way, and add a main loop.',
        starterCode: 'def display_weather(weather):\n    # Display weather in a nice format\n    # Include emoji based on conditions\n    pass\n\ndef main():\n    # Main app loop\n    pass',
        hints: [
          'Use emoji for different weather conditions',
          'Create a weather-to-emoji mapping',
          'Add colors if terminal supports it'
        ],
        solution: "def get_weather_emoji(description):\n    desc = description.lower()\n    if 'sun' in desc or 'clear' in desc:\n        return 'sunny'\n    elif 'cloud' in desc:\n        return 'cloudy'\n    elif 'rain' in desc:\n        return 'rainy'\n    elif 'snow' in desc:\n        return 'snowy'\n    elif 'thunder' in desc:\n        return 'stormy'\n    else:\n        return 'partly cloudy'\n\ndef display_weather(weather):\n    if not weather:\n        print('Could not get weather data')\n        return\n    \n    emoji = get_weather_emoji(weather['description'])\n    \n    print('\\n' + '='*40)\n    print(f'{emoji} Weather in {weather[\"city\"]}, {weather[\"country\"]}')\n    print('='*40)\n    print(f'Temperature: {weather[\"temp_c\"]}C ({weather[\"temp_f\"]}F)')\n    print(f'Feels like: {weather[\"feels_like\"]}C')\n    print(f'Conditions: {weather[\"description\"]}')\n    print(f'Humidity: {weather[\"humidity\"]}%')\n    print(f'Wind: {weather[\"wind_kmph\"]} km/h')\n    print('='*40)\n\ndef main():\n    print('Weather App')\n    \n    while True:\n        city = input('\\nEnter city name (or quit): ').strip()\n        \n        if city.lower() == 'quit':\n            print('Goodbye!')\n            break\n        \n        if not city:\n            print('Please enter a city name')\n            continue\n        \n        print(f'\\nFetching weather for {city}...')\n        data = get_weather(city)\n        weather = parse_weather(data)\n        display_weather(weather)\n\nif __name__ == '__main__':\n    main()"
      }
    ]
  },
  {
    projectId: 'discord-bot',
    name: 'Discord Bot',
    description: 'Build your own Discord bot with custom commands',
    language: 'javascript',
    difficulty: 'intermediate',
    estimatedTime: 60,
    xpReward: 500,
    badgeReward: 'bot_builder',
    tags: ['Discord.js', 'API', 'async'],
    prerequisites: ['JavaScript', 'Node.js', 'Async/Await'],
    learningOutcomes: [
      'Use the Discord.js library',
      'Handle events and commands',
      'Work with async/await'
    ],
    steps: [
      {
        stepNumber: 1,
        title: 'Set Up Bot Client',
        instruction: 'Initialize a Discord.js client and connect to Discord.',
        starterCode: '// Install first: npm install discord.js\nconst { Client, GatewayIntentBits } = require("discord.js");\n\nconst client = new Client({\n    intents: [\n        // Add required intents\n    ]\n});\n\n// Add ready event\n// Add login',
        hints: [
          'Use GatewayIntentBits.Guilds and GatewayIntentBits.GuildMessages',
          'Add MessageContent intent for reading messages',
          'Use client.on("ready", ...) for ready event'
        ],
        solution: 'const { Client, GatewayIntentBits } = require("discord.js");\n\nconst client = new Client({\n    intents: [\n        GatewayIntentBits.Guilds,\n        GatewayIntentBits.GuildMessages,\n        GatewayIntentBits.MessageContent\n    ]\n});\n\nclient.on("ready", () => {\n    console.log(`Logged in as ${client.user.tag}!`);\n});\n\n// Replace with your token\nclient.login("YOUR_BOT_TOKEN");'
      },
      {
        stepNumber: 2,
        title: 'Add Command Handler',
        instruction: 'Create a message handler that responds to commands with a prefix.',
        starterCode: 'const PREFIX = "!";\n\nclient.on("messageCreate", (message) => {\n    // Ignore bots\n    // Check for prefix\n    // Parse command and args\n    // Handle commands\n});',
        hints: [
          'Check message.author.bot to ignore bots',
          'Use message.content.startsWith(PREFIX)',
          'Split content to get command and arguments'
        ],
        solution: 'const PREFIX = "!";\n\nclient.on("messageCreate", (message) => {\n    // Ignore bot messages\n    if (message.author.bot) return;\n    \n    // Check for prefix\n    if (!message.content.startsWith(PREFIX)) return;\n    \n    // Parse command and args\n    const args = message.content.slice(PREFIX.length).trim().split(/\\s+/);\n    const command = args.shift().toLowerCase();\n    \n    // Handle commands\n    if (command === "ping") {\n        message.reply("Pong! ");\n    }\n    else if (command === "hello") {\n        message.reply(`Hello, ${message.author.username}! `);\n    }\n    else if (command === "help") {\n        message.reply("Commands: !ping, !hello, !echo <text>, !roll");\n    }\n});'
      },
      {
        stepNumber: 3,
        title: 'Add Fun Commands',
        instruction: 'Add more interactive commands like echo, roll dice, and 8ball.',
        starterCode: '// Add these commands:\n// !echo <text> - Repeat user text\n// !roll - Roll a dice (1-6)\n// !8ball <question> - Magic 8 ball',
        hints: [
          'Use args.join(" ") to get remaining text',
          'Use Math.random() for random numbers',
          'Create an array of 8ball responses'
        ],
        solution: "else if (command === 'echo') {\n    if (args.length === 0) {\n        message.reply('Please provide text to echo!');\n        return;\n    }\n    message.channel.send(args.join(' '));\n}\nelse if (command === 'roll') {\n    const max = parseInt(args[0]) || 6;\n    const result = Math.floor(Math.random() * max) + 1;\n    message.reply(`You rolled: **${result}**`);\n}\nelse if (command === '8ball') {\n    if (args.length === 0) {\n        message.reply('Ask a question!');\n        return;\n    }\n    const responses = [\n        'Yes, definitely!',\n        'No way!',\n        'Maybe...',\n        'Ask again later',\n        'Absolutely!',\n        'I do not think so',\n        'Signs point to yes!',\n        'Very doubtful'\n    ];\n    const response = responses[Math.floor(Math.random() * responses.length)];\n    message.reply(response);\n}"
      }
    ]
  },
  {
    projectId: 'data-analyzer',
    name: 'Data Analyzer',
    description: 'Build a data analysis tool that reads CSV files and generates statistics',
    language: 'python',
    difficulty: 'advanced',
    estimatedTime: 60,
    xpReward: 600,
    badgeReward: 'data_scientist',
    tags: ['data', 'CSV', 'statistics', 'visualization'],
    prerequisites: ['Python', 'File I/O', 'Dictionaries', 'Lists'],
    learningOutcomes: [
      'Read and parse CSV files',
      'Calculate statistical measures',
      'Generate data visualizations'
    ],
    steps: [
      {
        stepNumber: 1,
        title: 'Read CSV Data',
        instruction: 'Create a function to read CSV files and parse them into a usable data structure.',
        starterCode: 'import csv\n\ndef read_csv(filename):\n    # Read CSV file\n    # Return list of dictionaries\n    pass',
        hints: [
          'Use csv.DictReader for easy parsing',
          'Handle file not found errors',
          'Convert numeric strings to numbers'
        ],
        solution: 'import csv\n\ndef read_csv(filename):\n    try:\n        with open(filename, "r") as f:\n            reader = csv.DictReader(f)\n            data = []\n            for row in reader:\n                # Try to convert numeric values\n                processed = {}\n                for key, value in row.items():\n                    try:\n                        processed[key] = float(value)\n                    except ValueError:\n                        processed[key] = value\n                data.append(processed)\n            return data\n    except FileNotFoundError:\n        print(f"File {filename} not found")\n        return None\n    except Exception as e:\n        print(f"Error reading file: {e}")\n        return None'
      },
      {
        stepNumber: 2,
        title: 'Calculate Statistics',
        instruction: 'Create functions to calculate mean, median, mode, and standard deviation.',
        starterCode: 'def calculate_stats(data, column):\n    # Extract column values\n    # Calculate: mean, median, mode, std_dev\n    # Return statistics dictionary\n    pass',
        hints: [
          'Use statistics module for median, mode, stdev',
          'Filter out non-numeric values',
          'Handle edge cases (empty data, etc.)'
        ],
        solution: 'import statistics\n\ndef calculate_stats(data, column):\n    # Extract numeric values from column\n    values = [row[column] for row in data if isinstance(row.get(column), (int, float))]\n    \n    if not values:\n        return None\n    \n    stats = {\n        "count": len(values),\n        "sum": sum(values),\n        "mean": statistics.mean(values),\n        "min": min(values),\n        "max": max(values)\n    }\n    \n    if len(values) >= 2:\n        stats["median"] = statistics.median(values)\n        stats["stdev"] = statistics.stdev(values)\n    \n    try:\n        stats["mode"] = statistics.mode(values)\n    except statistics.StatisticsError:\n        stats["mode"] = "No unique mode"\n    \n    return stats'
      },
      {
        stepNumber: 3,
        title: 'Create Visualization',
        instruction: 'Build ASCII charts and a report generator for the analysis results.',
        starterCode: 'def create_bar_chart(data, column, width=40):\n    # Create ASCII bar chart\n    pass\n\ndef generate_report(data, columns):\n    # Generate full analysis report\n    pass',
        hints: [
          'Use  character for bars',
          'Normalize values to fit width',
          'Format numbers nicely with f-strings'
        ],
        solution: 'def create_bar_chart(data, column, width=40):\n    values = [(row.get("name", f"Row {i}"), row[column]) \n              for i, row in enumerate(data) \n              if isinstance(row.get(column), (int, float))]\n    \n    if not values:\n        return "No numeric data to chart"\n    \n    max_val = max(v[1] for v in values)\n    \n    lines = [f"\\n Bar Chart: {column}", "=" * (width + 15)]\n    \n    for name, val in values[:10]:  # Limit to 10 items\n        bar_length = int((val / max_val) * width)\n        bar = "" * bar_length\n        lines.append(f"{name[:12]:12} | {bar} {val:.1f}")\n    \n    return "\\n".join(lines)\n\ndef generate_report(data, columns):\n    print("\\n" + "=" * 50)\n    print(" DATA ANALYSIS REPORT")\n    print("=" * 50)\n    print(f"Total records: {len(data)}")\n    \n    for col in columns:\n        stats = calculate_stats(data, col)\n        if stats:\n            print(f"\\n Column: {col}")\n            print("-" * 30)\n            print(f"  Count: {stats[\"count\"]}") \n            print(f"  Mean:  {stats[\"mean\"]:.2f}")\n            print(f"  Min:   {stats[\"min\"]:.2f}")\n            print(f"  Max:   {stats[\"max\"]:.2f}")\n            if \"median\" in stats:\n                print(f"  Median: {stats[\"median\"]:.2f}")\n            if \"stdev\" in stats:\n                print(f"  Std Dev: {stats[\"stdev\"]:.2f}")\n            \n            print(create_bar_chart(data, col))'
      }
    ]
  },
  {
    projectId: 'rest-api',
    name: 'REST API',
    description: 'Build a REST API with Express.js including CRUD operations',
    language: 'javascript',
    difficulty: 'advanced',
    estimatedTime: 90,
    xpReward: 700,
    badgeReward: 'backend_master',
    tags: ['Express', 'REST', 'API', 'CRUD'],
    prerequisites: ['JavaScript', 'Node.js', 'HTTP basics'],
    learningOutcomes: [
      'Build RESTful endpoints',
      'Handle HTTP methods',
      'Implement middleware'
    ],
    steps: [
      {
        stepNumber: 1,
        title: 'Set Up Express Server',
        instruction: 'Initialize an Express server with basic middleware.',
        starterCode: '// npm install express\nconst express = require("express");\nconst app = express();\n\n// Add middleware for JSON\n// Add basic route\n// Start server',
        hints: [
          'Use app.use(express.json()) for JSON parsing',
          'Create a simple GET route for testing',
          'Use app.listen() with a port'
        ],
        solution: 'const express = require("express");\nconst app = express();\nconst PORT = 3000;\n\n// Middleware\napp.use(express.json());\napp.use((req, res, next) => {\n    console.log(`${req.method} ${req.path}`);\n    next();\n});\n\n// Basic route\napp.get("/", (req, res) => {\n    res.json({ message: "Welcome to the API!" });\n});\n\napp.listen(PORT, () => {\n    console.log(`Server running on port ${PORT}`);\n});'
      },
      {
        stepNumber: 2,
        title: 'Create CRUD Routes',
        instruction: 'Implement GET, POST, PUT, DELETE routes for a "todos" resource.',
        starterCode: 'let todos = [];\nlet nextId = 1;\n\n// GET /todos - Get all todos\n// GET /todos/:id - Get one todo\n// POST /todos - Create todo\n// PUT /todos/:id - Update todo\n// DELETE /todos/:id - Delete todo',
        hints: [
          'Use req.params.id for URL parameters',
          'Use req.body for POST/PUT data',
          'Return appropriate status codes'
        ],
        solution: 'let todos = [];\nlet nextId = 1;\n\n// Get all todos\napp.get("/todos", (req, res) => {\n    res.json(todos);\n});\n\n// Get one todo\napp.get("/todos/:id", (req, res) => {\n    const todo = todos.find(t => t.id === parseInt(req.params.id));\n    if (!todo) return res.status(404).json({ error: "Not found" });\n    res.json(todo);\n});\n\n// Create todo\napp.post("/todos", (req, res) => {\n    const { text } = req.body;\n    if (!text) return res.status(400).json({ error: "Text required" });\n    \n    const todo = {\n        id: nextId++,\n        text,\n        completed: false,\n        createdAt: new Date()\n    };\n    todos.push(todo);\n    res.status(201).json(todo);\n});\n\n// Update todo\napp.put("/todos/:id", (req, res) => {\n    const todo = todos.find(t => t.id === parseInt(req.params.id));\n    if (!todo) return res.status(404).json({ error: "Not found" });\n    \n    todo.text = req.body.text || todo.text;\n    todo.completed = req.body.completed ?? todo.completed;\n    res.json(todo);\n});\n\n// Delete todo\napp.delete("/todos/:id", (req, res) => {\n    const index = todos.findIndex(t => t.id === parseInt(req.params.id));\n    if (index === -1) return res.status(404).json({ error: "Not found" });\n    \n    todos.splice(index, 1);\n    res.status(204).send();\n});'
      },
      {
        stepNumber: 3,
        title: 'Add Error Handling & Validation',
        instruction: 'Add proper error handling middleware and input validation.',
        starterCode: '// Add validation middleware\n// Add error handling middleware\n// Add not found handler',
        hints: [
          'Create middleware functions with (req, res, next)',
          'Use try/catch for async operations',
          'Error middleware has 4 parameters'
        ],
        solution: '// Validation middleware\nconst validateTodo = (req, res, next) => {\n    const { text } = req.body;\n    if (!text || typeof text !== "string" || text.trim().length === 0) {\n        return res.status(400).json({\n            error: "Validation failed",\n            message: "Text must be a non-empty string"\n        });\n    }\n    req.body.text = text.trim();\n    next();\n};\n\n// Apply to POST route\napp.post("/todos", validateTodo, (req, res) => {\n    // ... existing code\n});\n\n// 404 handler\napp.use((req, res) => {\n    res.status(404).json({ error: "Route not found" });\n});\n\n// Error handler\napp.use((err, req, res, next) => {\n    console.error(err.stack);\n    res.status(500).json({\n        error: "Internal server error",\n        message: err.message\n    });\n});'
      }
    ]
  }
];
