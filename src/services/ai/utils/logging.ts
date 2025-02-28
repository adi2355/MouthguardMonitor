/**
 * Logging utility for AI service
 * Provides consistent logging format and levels
 */

// Log levels
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  NONE = 4
}

// Current log level - can be changed at runtime
let currentLogLevel: LogLevel = LogLevel.INFO;

// Set the current log level
export function setLogLevel(level: LogLevel): void {
  currentLogLevel = level;
}

// Get the current log level
export function getLogLevel(): LogLevel {
  return currentLogLevel;
}

// Format a log message with timestamp and module
function formatLogMessage(module: string, message: string): string {
  const timestamp = new Date().toISOString();
  return `[${timestamp}] [${module}] ${message}`;
}

// Debug level logging
export function debug(module: string, message: string, ...args: any[]): void {
  if (currentLogLevel <= LogLevel.DEBUG) {
    console.debug(formatLogMessage(module, message), ...args);
  }
}

// Info level logging
export function info(module: string, message: string, ...args: any[]): void {
  if (currentLogLevel <= LogLevel.INFO) {
    console.info(formatLogMessage(module, message), ...args);
  }
}

// Warning level logging
export function warn(module: string, message: string, ...args: any[]): void {
  if (currentLogLevel <= LogLevel.WARN) {
    console.warn(formatLogMessage(module, message), ...args);
  }
}

// Error level logging
export function error(module: string, message: string, ...args: any[]): void {
  if (currentLogLevel <= LogLevel.ERROR) {
    console.error(formatLogMessage(module, message), ...args);
  }
}

// Log an error object with stack trace
export function logError(module: string, error: Error, message?: string): void {
  if (currentLogLevel <= LogLevel.ERROR) {
    const errorMessage = message ? `${message}: ${error.message}` : error.message;
    console.error(formatLogMessage(module, errorMessage));
    if (error.stack) {
      console.error(error.stack);
    }
  }
} 