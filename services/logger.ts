// Production-ready logging service
type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
    level: LogLevel;
    message: string;
    context?: any;
    timestamp: Date;
    source?: string;
}

class Logger {
    private isDevelopment = import.meta.env.DEV;

    private formatMessage(level: LogLevel, message: string, context?: any, source?: string): string {
        const timestamp = new Date().toISOString();
        const sourcePrefix = source ? `[${source}] ` : '';
        const contextSuffix = context ? ` | Context: ${JSON.stringify(context)}` : '';
        return `${timestamp} [${level.toUpperCase()}] ${sourcePrefix}${message}${contextSuffix}`;
    }

    debug(message: string, context?: any, source?: string): void {
        if (this.isDevelopment) {
            console.debug(this.formatMessage('debug', message, context, source));
        }
    }

    info(message: string, context?: any, source?: string): void {
        if (this.isDevelopment) {
            console.info(this.formatMessage('info', message, context, source));
        }
    }

    warn(message: string, context?: any, source?: string): void {
        if (this.isDevelopment) {
            console.warn(this.formatMessage('warn', message, context, source));
        }
        // In production, you might want to send to error reporting service
    }

    error(message: string, error?: Error | any, source?: string): void {
        const errorContext = error instanceof Error ? {
            name: error.name,
            message: error.message,
            stack: error.stack
        } : error;

        if (this.isDevelopment) {
            console.error(this.formatMessage('error', message, errorContext, source));
        }

        // In production, send to error reporting service (Sentry, LogRocket, etc.)
        // this.sendToErrorReporting(message, errorContext, source);
    }

    // Group related logs together
    group(label: string): void {
        if (this.isDevelopment) {
            console.group(label);
        }
    }

    groupEnd(): void {
        if (this.isDevelopment) {
            console.groupEnd();
        }
    }

    // Performance timing
    time(label: string): void {
        if (this.isDevelopment) {
            console.time(label);
        }
    }

    timeEnd(label: string): void {
        if (this.isDevelopment) {
            console.timeEnd(label);
        }
    }

    // API specific logging
    apiRequest(method: string, url: string, context?: any): void {
        this.debug(`API Request: ${method} ${url}`, context, 'API');
    }

    apiResponse(method: string, url: string, status: number, duration?: number): void {
        const message = `API Response: ${method} ${url} - ${status}`;
        const context = duration ? { duration: `${duration}ms` } : undefined;

        if (status >= 400) {
            this.error(message, context, 'API');
        } else {
            this.debug(message, context, 'API');
        }
    }

    apiError(method: string, url: string, error: Error): void {
        this.error(`API Error: ${method} ${url}`, error, 'API');
    }
}

// Create singleton instance
export const logger = new Logger();

// Convenience methods for common use cases
export const log = {
    debug: (message: string, context?: any) => logger.debug(message, context),
    info: (message: string, context?: any) => logger.info(message, context),
    warn: (message: string, context?: any) => logger.warn(message, context),
    error: (message: string, error?: Error | any) => logger.error(message, error),

    // AI-specific logging
    aiRequest: (operation: string, model: string) => logger.debug(`AI Request: ${operation}`, { model }, 'AI'),
    aiResponse: (operation: string, success: boolean, duration?: number) => {
        const message = `AI Response: ${operation} - ${success ? 'Success' : 'Failed'}`;
        const context = duration ? { duration: `${duration}ms` } : undefined;

        if (success) {
            logger.debug(message, context, 'AI');
        } else {
            logger.warn(message, context, 'AI');
        }
    },
    aiError: (operation: string, error: Error) => logger.error(`AI Error: ${operation}`, error, 'AI'),

    // Store-specific logging
    storeAction: (action: string, payload?: any) => logger.debug(`Store Action: ${action}`, payload, 'Store'),
    storeError: (action: string, error: Error) => logger.error(`Store Error: ${action}`, error, 'Store'),
};