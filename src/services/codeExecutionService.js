// ============================================
// MentorAI Code Execution Service
// Uses Piston API for safe, sandboxed code execution
// ============================================

const PISTON_API = 'https://emkc.org/api/v2/piston';

// Language configurations for Piston API
export const LANGUAGES = {
  python: { language: 'python', version: '3.10.0', aliases: ['py', 'python3'], emoji: '🐍', name: 'Python' },
  javascript: { language: 'javascript', version: '18.15.0', aliases: ['js', 'node'], emoji: '🟨', name: 'JavaScript' },
  typescript: { language: 'typescript', version: '5.0.3', aliases: ['ts'], emoji: '🔷', name: 'TypeScript' },
  java: { language: 'java', version: '15.0.2', aliases: [], emoji: '☕', name: 'Java' },
  cpp: { language: 'c++', version: '10.2.0', aliases: ['c++', 'cplusplus'], emoji: '⚡', name: 'C++' },
  c: { language: 'c', version: '10.2.0', aliases: [], emoji: '🔧', name: 'C' },
  csharp: { language: 'csharp', version: '6.12.0', aliases: ['cs', 'c#'], emoji: '💜', name: 'C#' },
  go: { language: 'go', version: '1.16.2', aliases: ['golang'], emoji: '🐹', name: 'Go' },
  rust: { language: 'rust', version: '1.68.2', aliases: ['rs'], emoji: '🦀', name: 'Rust' },
  ruby: { language: 'ruby', version: '3.0.1', aliases: ['rb'], emoji: '💎', name: 'Ruby' },
  php: { language: 'php', version: '8.2.3', aliases: [], emoji: '🐘', name: 'PHP' },
  swift: { language: 'swift', version: '5.3.3', aliases: [], emoji: '🍎', name: 'Swift' },
  kotlin: { language: 'kotlin', version: '1.8.20', aliases: ['kt'], emoji: '🎯', name: 'Kotlin' },
  lua: { language: 'lua', version: '5.4.4', aliases: [], emoji: '🌙', name: 'Lua' },
  bash: { language: 'bash', version: '5.2.0', aliases: ['sh', 'shell'], emoji: '🖥️', name: 'Bash' },
  sql: { language: 'sqlite3', version: '3.36.0', aliases: ['sqlite'], emoji: '🗃️', name: 'SQL' },
};

// Popular languages to show in autocomplete
export const POPULAR_LANGUAGES = ['python', 'javascript', 'java', 'cpp', 'typescript', 'go', 'rust', 'csharp'];

/**
 * Resolve language from user input
 */
export function resolveLanguage(input) {
  const normalized = input.toLowerCase().trim();
  
  // Direct match
  if (LANGUAGES[normalized]) {
    return LANGUAGES[normalized];
  }
  
  // Alias match
  for (const [key, config] of Object.entries(LANGUAGES)) {
    if (config.aliases.includes(normalized)) {
      return config;
    }
  }
  
  return null;
}

/**
 * Execute code using Piston API
 */
export async function executeCode(language, code, stdin = '') {
  const langConfig = typeof language === 'string' ? resolveLanguage(language) : language;
  
  if (!langConfig) {
    return {
      success: false,
      error: `Unknown language. Supported: ${Object.keys(LANGUAGES).join(', ')}`,
      output: null,
      executionTime: 0
    };
  }

  // Security checks
  const securityCheck = checkCodeSecurity(code, langConfig.language);
  if (!securityCheck.safe) {
    return {
      success: false,
      error: `⚠️ Security Warning: ${securityCheck.reason}`,
      output: null,
      executionTime: 0
    };
  }

  const startTime = Date.now();

  try {
    const response = await fetch(`${PISTON_API}/execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        language: langConfig.language,
        version: langConfig.version,
        files: [
          {
            name: getFileName(langConfig.language),
            content: code
          }
        ],
        stdin: stdin,
        run_timeout: 10000, // 10 seconds max
        compile_timeout: 10000,
        compile_memory_limit: 256000000, // 256MB
        run_memory_limit: 256000000
      })
    });

    if (!response.ok) {
      throw new Error(`Piston API error: ${response.status}`);
    }

    const result = await response.json();
    const executionTime = Date.now() - startTime;

    // Check for compilation errors
    if (result.compile && result.compile.code !== 0) {
      return {
        success: false,
        error: result.compile.stderr || result.compile.output || 'Compilation failed',
        output: null,
        executionTime,
        language: langConfig
      };
    }

    // Check for runtime errors
    if (result.run.code !== 0) {
      return {
        success: false,
        error: result.run.stderr || 'Runtime error',
        output: result.run.stdout || null,
        executionTime,
        language: langConfig
      };
    }

    return {
      success: true,
      error: null,
      output: result.run.stdout || '(No output)',
      stderr: result.run.stderr || null,
      executionTime,
      language: langConfig
    };

  } catch (error) {
    return {
      success: false,
      error: `Execution failed: ${error.message}`,
      output: null,
      executionTime: Date.now() - startTime,
      language: langConfig
    };
  }
}

/**
 * Get appropriate filename for language
 */
function getFileName(language) {
  const extensions = {
    python: 'main.py',
    javascript: 'main.js',
    typescript: 'main.ts',
    java: 'Main.java',
    'c++': 'main.cpp',
    c: 'main.c',
    csharp: 'Main.cs',
    go: 'main.go',
    rust: 'main.rs',
    ruby: 'main.rb',
    php: 'main.php',
    swift: 'main.swift',
    kotlin: 'Main.kt',
    lua: 'main.lua',
    bash: 'main.sh',
    sqlite3: 'main.sql'
  };
  return extensions[language] || 'main.txt';
}

/**
 * Basic security checks for code
 */
function checkCodeSecurity(code, language) {
  const lowerCode = code.toLowerCase();
  
  // Dangerous patterns
  const dangerousPatterns = [
    { pattern: /import\s+os/i, reason: 'OS module access not allowed', langs: ['python'] },
    { pattern: /from\s+os\s+import/i, reason: 'OS module access not allowed', langs: ['python'] },
    { pattern: /subprocess/i, reason: 'Subprocess module not allowed', langs: ['python'] },
    { pattern: /eval\s*\(/i, reason: 'eval() is restricted for security', langs: ['python', 'javascript'] },
    { pattern: /exec\s*\(/i, reason: 'exec() is restricted for security', langs: ['python'] },
    { pattern: /child_process/i, reason: 'child_process not allowed', langs: ['javascript'] },
    { pattern: /require\s*\(\s*['"]fs['"]\s*\)/i, reason: 'File system access not allowed', langs: ['javascript'] },
    { pattern: /require\s*\(\s*['"]child_process['"]\s*\)/i, reason: 'child_process not allowed', langs: ['javascript'] },
    { pattern: /system\s*\(/i, reason: 'system() calls not allowed', langs: ['c', 'c++', 'php'] },
    { pattern: /rm\s+-rf/i, reason: 'Destructive commands not allowed', langs: ['bash'] },
    { pattern: /:(){ :|:& };:/i, reason: 'Fork bombs not allowed', langs: ['bash'] },
  ];

  for (const check of dangerousPatterns) {
    if (check.langs.includes(language) && check.pattern.test(code)) {
      return { safe: false, reason: check.reason };
    }
  }

  // Code length check
  if (code.length > 10000) {
    return { safe: false, reason: 'Code too long (max 10,000 characters)' };
  }

  return { safe: true };
}

/**
 * Format output for Discord (truncate if needed)
 */
export function formatOutput(output, maxLength = 1900) {
  if (!output) return '(No output)';
  
  let formatted = output.toString();
  
  // Remove ANSI color codes if present
  formatted = formatted.replace(/\x1b\[[0-9;]*m/g, '');
  
  // Truncate if too long
  if (formatted.length > maxLength) {
    formatted = formatted.substring(0, maxLength - 50) + '\n... (output truncated)';
  }
  
  return formatted;
}

/**
 * Get code template for a language
 */
export function getCodeTemplate(language) {
  const templates = {
    python: `# Python Example
print("Hello, World!")

# Try some math
result = sum(range(1, 11))
print(f"Sum of 1-10: {result}")`,

    javascript: `// JavaScript Example
console.log("Hello, World!");

// Try some math
const sum = Array.from({length: 10}, (_, i) => i + 1)
  .reduce((a, b) => a + b, 0);
console.log(\`Sum of 1-10: \${sum}\`);`,

    java: `public class Main {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
        
        // Try some math
        int sum = 0;
        for (int i = 1; i <= 10; i++) {
            sum += i;
        }
        System.out.println("Sum of 1-10: " + sum);
    }
}`,

    cpp: `#include <iostream>
using namespace std;

int main() {
    cout << "Hello, World!" << endl;
    
    // Try some math
    int sum = 0;
    for (int i = 1; i <= 10; i++) {
        sum += i;
    }
    cout << "Sum of 1-10: " << sum << endl;
    return 0;
}`,

    typescript: `// TypeScript Example
console.log("Hello, World!");

const sum: number = Array.from({length: 10}, (_, i) => i + 1)
  .reduce((a, b) => a + b, 0);
console.log(\`Sum of 1-10: \${sum}\`);`,

    go: `package main

import "fmt"

func main() {
    fmt.Println("Hello, World!")
    
    // Try some math
    sum := 0
    for i := 1; i <= 10; i++ {
        sum += i
    }
    fmt.Printf("Sum of 1-10: %d\\n", sum)
}`,

    rust: `fn main() {
    println!("Hello, World!");
    
    // Try some math
    let sum: i32 = (1..=10).sum();
    println!("Sum of 1-10: {}", sum);
}`,

    csharp: `using System;

class Program {
    static void Main() {
        Console.WriteLine("Hello, World!");
        
        // Try some math
        int sum = 0;
        for (int i = 1; i <= 10; i++) {
            sum += i;
        }
        Console.WriteLine($"Sum of 1-10: {sum}");
    }
}`
  };

  return templates[language] || templates.javascript;
}

/**
 * Get available runtimes from Piston
 */
export async function getAvailableRuntimes() {
  try {
    const response = await fetch(`${PISTON_API}/runtimes`);
    if (!response.ok) throw new Error('Failed to fetch runtimes');
    return await response.json();
  } catch (error) {
    console.error('Error fetching runtimes:', error);
    return null;
  }
}
