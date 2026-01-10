/**
 * Error Handler - Comprehensive Error Handling & Logging
 * 
 * Features:
 * - Structured logging
 * - File-based log storage
 * - Error reporting
 * - Graceful shutdown
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class ErrorHandler {
  constructor() {
    this.levels = {
      ERROR: 'error',
      WARN: 'warn',
      INFO: 'info',
      DEBUG: 'debug'
    };
    
    this.logDir = path.join(__dirname, '../../logs');
    this.logFile = path.join(this.logDir, 'mentorai.log');
    this.errorLogFile = path.join(this.logDir, 'errors.log');
    
    // Ensure log directory exists
    this.ensureLogDirectory();
    
    // Error counts for monitoring
    this.errorCounts = {
      total: 0,
      byType: {}
    };

    // Setup handlers
    this.setupErrorHandlers();
  }

  /**
   * Ensure log directory exists
   */
  ensureLogDirectory() {
    try {
      if (!fs.existsSync(this.logDir)) {
        fs.mkdirSync(this.logDir, { recursive: true });
      }
    } catch (error) {
      console.error('Failed to create log directory:', error);
    }
  }

  /**
   * Log a message
   * @param {string} level - Log level
   * @param {string} message - Log message
   * @param {Object} data - Additional data
   */
  log(level, message, data = {}) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      data,
      pid: process.pid
    };

    // Console output with colors
    const colors = {
      error: '\x1b[31m',   // Red
      warn: '\x1b[33m',    // Yellow
      info: '\x1b[36m',    // Cyan
      debug: '\x1b[90m'    // Gray
    };
    const reset = '\x1b[0m';
    const color = colors[level] || '';

    console.log(
      `${color}[${timestamp}] ${level.toUpperCase()}:${reset} ${message}`,
      Object.keys(data).length ? data : ''
    );

    // File output (async, non-blocking)
    this.writeToFile(logEntry);
    
    // Track errors
    if (level === this.levels.ERROR) {
      this.trackError(message, data);
    }
  }

  /**
   * Convenience methods for each log level
   */
  error(message, data = {}) {
    this.log(this.levels.ERROR, message, data);
  }

  warn(message, data = {}) {
    this.log(this.levels.WARN, message, data);
  }

  info(message, data = {}) {
    this.log(this.levels.INFO, message, data);
  }

  debug(message, data = {}) {
    if (process.env.NODE_ENV === 'development' || process.env.DEBUG) {
      this.log(this.levels.DEBUG, message, data);
    }
  }

  /**
   * Write log entry to file
   * @param {Object} entry - Log entry
   */
  writeToFile(entry) {
    const line = JSON.stringify(entry) + '\n';
    
    fs.appendFile(this.logFile, line, (err) => {
      if (err) {
        console.error('Failed to write to log file:', err);
      }
    });

    // Also write errors to separate file
    if (entry.level === this.levels.ERROR) {
      fs.appendFile(this.errorLogFile, line, (err) => {
        if (err) {
          console.error('Failed to write to error log file:', err);
        }
      });
    }
  }

  /**
   * Track error for monitoring
   * @param {string} message - Error message
   * @param {Object} data - Error data
   */
  trackError(message, data) {
    this.errorCounts.total++;
    
    const errorType = data.type || 'unknown';
    this.errorCounts.byType[errorType] = (this.errorCounts.byType[errorType] || 0) + 1;

    // Could integrate with external monitoring here
    if (process.env.SENTRY_DSN) {
      this.reportToSentry(message, data);
    }
  }

  /**
   * Report error to Sentry (placeholder)
   */
  reportToSentry(message, data) {
    // Implementation would go here
    // Sentry.captureException(new Error(message), { extra: data });
  }

  /**
   * Wrap async function with error handling
   * @param {Function} fn - Async function
   * @param {Object} context - Context for error logging
   * @returns {Promise<*>} Result or throws
   */
  async wrapAsync(fn, context = {}) {
    try {
      return await fn();
    } catch (error) {
      this.log(this.levels.ERROR, error.message, {
        stack: error.stack,
        type: error.constructor.name,
        ...context
      });
      
      throw error;
    }
  }

  /**
   * Create error wrapper that doesn't throw
   * @param {Function} fn - Async function
   * @param {*} fallback - Fallback value on error
   * @param {Object} context - Context for error logging
   * @returns {Promise<*>} Result or fallback
   */
  async wrapAsyncSafe(fn, fallback = null, context = {}) {
    try {
      return await fn();
    } catch (error) {
      this.log(this.levels.ERROR, error.message, {
        stack: error.stack,
        type: error.constructor.name,
        fallbackUsed: true,
        ...context
      });
      
      return fallback;
    }
  }

  /**
   * Create Discord interaction error handler
   * @param {Object} interaction - Discord interaction
   * @returns {Function} Error handler
   */
  interactionHandler(interaction) {
    return async (error) => {
      this.log(this.levels.ERROR, 'Interaction error', {
        error: error.message,
        stack: error.stack,
        command: interaction.commandName,
        user: interaction.user?.id,
        guild: interaction.guild?.id
      });

      try {
        const errorMessage = {
          content: '❌ An error occurred while processing your command. Please try again later.',
          ephemeral: true
        };

        if (interaction.replied || interaction.deferred) {
          await interaction.followUp(errorMessage);
        } else {
          await interaction.reply(errorMessage);
        }
      } catch (replyError) {
        this.log(this.levels.ERROR, 'Failed to send error response', {
          error: replyError.message
        });
      }
    };
  }

  /**
   * Create Express error middleware
   * @returns {Function} Express middleware
   */
  expressMiddleware() {
    return (err, req, res, next) => {
      this.log(this.levels.ERROR, err.message, {
        stack: err.stack,
        url: req.url,
        method: req.method,
        ip: req.ip,
        body: req.body,
        params: req.params,
        query: req.query
      });

      res.status(err.status || 500).json({
        error: 'Internal Server Error',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong',
        requestId: req.id
      });
    };
  }

  /**
   * Setup global error handlers
   */
  setupErrorHandlers() {
    // Uncaught exceptions
    process.on('uncaughtException', (error) => {
      this.log(this.levels.ERROR, 'Uncaught Exception', {
        error: error.message,
        stack: error.stack,
        type: 'uncaughtException'
      });

      // Exit after logging
      setTimeout(() => {
        process.exit(1);
      }, 1000);
    });

    // Unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      this.log(this.levels.ERROR, 'Unhandled Rejection', {
        reason: reason?.message || String(reason),
        stack: reason?.stack,
        type: 'unhandledRejection'
      });
    });

    // Warnings
    process.on('warning', (warning) => {
      this.log(this.levels.WARN, warning.message, {
        name: warning.name,
        stack: warning.stack,
        type: 'warning'
      });
    });
  }

  /**
   * Setup graceful shutdown handlers
   * @param {Function} cleanup - Cleanup function
   */
  setupShutdownHandlers(cleanup) {
    const signals = ['SIGINT', 'SIGTERM', 'SIGHUP'];
    
    signals.forEach(signal => {
      process.on(signal, async () => {
        this.log(this.levels.INFO, `Received ${signal}, shutting down gracefully...`);
        
        try {
          // Run cleanup
          if (cleanup) {
            await cleanup();
          }
          
          this.log(this.levels.INFO, 'Cleanup completed');
        } catch (error) {
          this.log(this.levels.ERROR, 'Error during cleanup', {
            error: error.message
          });
        }
        
        // Exit after cleanup
        setTimeout(() => {
          process.exit(0);
        }, 1000);
      });
    });
  }

  /**
   * Get error statistics
   * @returns {Object} Error stats
   */
  getStats() {
    return {
      ...this.errorCounts,
      uptime: process.uptime(),
      memory: process.memoryUsage()
    };
  }

  /**
   * Rotate log files (call periodically or on startup)
   * @param {number} maxSize - Max file size in bytes (default 10MB)
   */
  async rotateLogs(maxSize = 10 * 1024 * 1024) {
    try {
      for (const logFile of [this.logFile, this.errorLogFile]) {
        if (fs.existsSync(logFile)) {
          const stats = fs.statSync(logFile);
          
          if (stats.size > maxSize) {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const rotatedFile = logFile.replace('.log', `-${timestamp}.log`);
            
            fs.renameSync(logFile, rotatedFile);
            this.log(this.levels.INFO, `Rotated log file: ${logFile}`);
          }
        }
      }
    } catch (error) {
      console.error('Failed to rotate logs:', error);
    }
  }

  /**
   * Read recent logs
   * @param {number} lines - Number of lines to read
   * @param {string} level - Filter by level
   * @returns {Array} Log entries
   */
  async readRecentLogs(lines = 100, level = null) {
    try {
      if (!fs.existsSync(this.logFile)) {
        return [];
      }

      const content = fs.readFileSync(this.logFile, 'utf8');
      const logLines = content.trim().split('\n').slice(-lines);
      
      const entries = logLines
        .map(line => {
          try {
            return JSON.parse(line);
          } catch {
            return null;
          }
        })
        .filter(entry => entry !== null);

      if (level) {
        return entries.filter(entry => entry.level === level);
      }

      return entries;
    } catch (error) {
      console.error('Failed to read logs:', error);
      return [];
    }
  }
}

// Singleton instance
export const errorHandler = new ErrorHandler();
export default errorHandler;
