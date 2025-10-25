import { env, isDevelopment, isProduction } from './env'

/**
 * Log levels
 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

/**
 * Log context with additional metadata
 */
export interface LogContext {
  userId?: string
  accountId?: string
  invoiceId?: string
  transactionId?: string
  action?: string
  duration?: number
  [key: string]: any
}

/**
 * Structured logger class
 * Provides consistent logging across the application
 */
class Logger {
  /**
   * Internal log method
   */
  private log(level: LogLevel, message: string, context?: LogContext) {
    const timestamp = new Date().toISOString()
    const logData = {
      timestamp,
      level,
      message,
      env: env.NODE_ENV,
      ...context,
    }

    // In production, send to logging service (Sentry, Datadog, etc)
    if (isProduction()) {
      // TODO: Integrate with Sentry or similar service
      // Sentry.captureMessage(message, { level, extra: context })
    }

    // Console output with emoji for readability
    const emoji = {
      debug: '🔍',
      info: 'ℹ️',
      warn: '⚠️',
      error: '❌',
    }[level]

    const consoleMethod = level === 'debug' ? 'log' : level

    if (isDevelopment()) {
      // Detailed output in development
      console[consoleMethod](
        `${emoji} [${level.toUpperCase()}] ${message}`,
        context ? JSON.stringify(context, null, 2) : ''
      )
    } else {
      // Compact output in production
      console[consoleMethod](JSON.stringify(logData))
    }
  }

  /**
   * Log debug message (only in development)
   */
  debug(message: string, context?: LogContext): void {
    if (isDevelopment()) {
      this.log('debug', message, context)
    }
  }

  /**
   * Log info message
   */
  info(message: string, context?: LogContext): void {
    this.log('info', message, context)
  }

  /**
   * Log warning message
   */
  warn(message: string, context?: LogContext): void {
    this.log('warn', message, context)
  }

  /**
   * Log error message
   */
  error(message: string, error?: Error | unknown, context?: LogContext): void {
    const errorContext: LogContext = {
      ...context,
    }

    if (error instanceof Error) {
      errorContext.error = error.message
      errorContext.stack = error.stack
      errorContext.errorName = error.name
    } else if (error) {
      errorContext.error = String(error)
    }

    this.log('error', message, errorContext)
  }

  /**
   * Time a function execution
   */
  async time<T>(
    label: string,
    fn: () => Promise<T>,
    context?: LogContext
  ): Promise<T> {
    const start = Date.now()

    try {
      const result = await fn()
      const duration = Date.now() - start

      this.debug(`${label} completed`, {
        ...context,
        duration,
      })

      return result
    } catch (error) {
      const duration = Date.now() - start

      this.error(`${label} failed`, error, {
        ...context,
        duration,
      })

      throw error
    }
  }
}

/**
 * Global logger instance
 */
export const logger = new Logger()

/**
 * Helper to create logger with default context
 */
export function createLogger(defaultContext: LogContext): Logger {
  const contextLogger = new Logger()

  // Override methods to inject default context
  const originalDebug = contextLogger.debug.bind(contextLogger)
  const originalInfo = contextLogger.info.bind(contextLogger)
  const originalWarn = contextLogger.warn.bind(contextLogger)
  const originalError = contextLogger.error.bind(contextLogger)

  contextLogger.debug = (message, context?) =>
    originalDebug(message, { ...defaultContext, ...context })
  contextLogger.info = (message, context?) =>
    originalInfo(message, { ...defaultContext, ...context })
  contextLogger.warn = (message, context?) =>
    originalWarn(message, { ...defaultContext, ...context })
  contextLogger.error = (message, error?, context?) =>
    originalError(message, error, { ...defaultContext, ...context })

  return contextLogger
}
