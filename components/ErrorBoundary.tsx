import React, { Component, ErrorInfo, ReactNode } from 'react';
import { ExclamationTriangleIcon } from './Icons';
import { log } from '../services/logger';
import { exportAllData } from '../services/storage/indexedDB';

interface Props {
    children?: ReactNode;
    fallback?: ReactNode;
    level?: 'app' | 'feature' | 'component';
    featureName?: string;
    onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
    hasError: boolean;
    error?: Error;
    errorInfo?: ErrorInfo;
    errorCount: number;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        errorCount: 0
    };

    public static getDerivedStateFromError(error: Error): Partial<State> {
        return { hasError: true };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        const { level = 'component', featureName, onError } = this.props;
        
        // Log error with full context
        log.error(
            `Error caught by ${level} boundary${featureName ? ` (${featureName})` : ''}`,
            error,
            {
                componentStack: errorInfo.componentStack,
                errorCount: this.state.errorCount + 1
            }
        );

        // Update state
        this.setState(prevState => ({
            error,
            errorInfo,
            errorCount: prevState.errorCount + 1
        }));

        // Call custom error handler if provided
        if (onError) {
            try {
                onError(error, errorInfo);
            } catch (handlerError) {
                log.error('Error in custom error handler', handlerError as Error);
            }
        }

        // For app-level errors, try to backup data
        if (level === 'app') {
            this.backupData();
        }
    }

    /**
     * Attempt to backup all data before crash
     */
    private async backupData(): Promise<void> {
        try {
            log.info('Attempting emergency data backup...');
            const data = await exportAllData();
            
            // Save to localStorage as last resort
            try {
                localStorage.setItem('emergency_backup', data);
                localStorage.setItem('emergency_backup_time', new Date().toISOString());
                log.info('Emergency backup saved to localStorage');
            } catch (storageError) {
                log.error('Failed to save emergency backup', storageError as Error);
            }
        } catch (error) {
            log.error('Failed to backup data', error as Error);
        }
    }

    private handleRetry = () => {
        log.info('Resetting error boundary');
        this.setState({ 
            hasError: false, 
            error: undefined, 
            errorInfo: undefined 
        });
    };

    /**
     * Copy error details to clipboard
     */
    private handleCopyError = async (): Promise<void> => {
        const { error, errorInfo } = this.state;
        if (!error) return;

        const errorText = `
BookCraft AI Error Report
========================
Time: ${new Date().toISOString()}
Error: ${error.name}
Message: ${error.message}

Stack Trace:
${error.stack || 'No stack trace available'}

Component Stack:
${errorInfo?.componentStack || 'No component stack available'}
        `;

        try {
            await navigator.clipboard.writeText(errorText);
            log.info('Error details copied to clipboard');
            alert('Error details copied to clipboard!');
        } catch (err) {
            log.error('Failed to copy error details', err as Error);
            alert(errorText);
        }
    };

    public render() {
        if (!this.state.hasError) {
            return this.props.children;
        }

        // Use custom fallback if provided
        if (this.props.fallback) {
            return this.props.fallback;
        }

        const { level = 'component', featureName } = this.props;
        const { error, errorInfo, errorCount } = this.state;

        // App-level error UI (full screen)
        if (level === 'app') {
            return (
                <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
                    <div className="max-w-2xl w-full">
                        <div className="bg-gray-100 rounded-lg shadow-2xl border border-red-900/50 p-8">
                            <div className="flex items-center justify-center mb-6">
                                <div className="w-20 h-20 bg-red-900/20 rounded-full flex items-center justify-center">
                                    <ExclamationTriangleIcon className="w-12 h-12 text-red-400" />
                                </div>
                            </div>
                            <h1 className="text-3xl font-bold text-red-400 text-center mb-4">
                                Oops! Something went wrong
                            </h1>
                            <p className="text-gray-700 text-center mb-6">
                                BookCraft AI encountered an unexpected error. Your data has been automatically backed up.
                            </p>
                            <div className="bg-white/50 rounded-lg p-4 mb-6">
                                <p className="text-sm font-mono text-red-300 mb-2">
                                    <strong>Error:</strong> {error?.message || 'Unknown error'}
                                </p>
                                {errorCount > 1 && (
                                    <p className="text-sm text-yellow-400">
                                        ⚠️ This error has occurred {errorCount} times
                                    </p>
                                )}
                            </div>
                            <div className="space-y-3">
                                <button
                                    onClick={this.handleRetry}
                                    className="w-full bg-brand-primary hover:bg-brand-primary/80 text-gray-900 font-semibold py-3 px-6 rounded-lg transition-colors"
                                >
                                    Try Again
                                </button>
                                <button
                                    onClick={() => window.location.reload()}
                                    className="w-full bg-white hover:bg-gray-300 text-gray-900 font-semibold py-3 px-6 rounded-lg transition-colors"
                                >
                                    Reload Page
                                </button>
                                <button
                                    onClick={this.handleCopyError}
                                    className="w-full bg-white hover:bg-gray-300 text-gray-700 font-semibold py-2 px-6 rounded-lg transition-colors text-sm"
                                >
                                    Copy Error Details
                                </button>
                            </div>
                            <div className="mt-6 pt-6 border-t border-gray-300">
                                <p className="text-sm text-gray-600 text-center">
                                    If this problem persists, please report it with the error details.
                                    <br />
                                    Your data backup has been saved automatically.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            );
        }

        // Feature-level error UI (contained card)
        if (level === 'feature') {
            return (
                <div className="bg-gray-100 rounded-lg border border-red-900/30 p-6 m-4">
                    <div className="flex items-start space-x-4">
                        <div className="flex-shrink-0">
                            <ExclamationTriangleIcon className="w-8 h-8 text-red-400" />
                        </div>
                        <div className="flex-1">
                            <h3 className="text-lg font-semibold text-red-400 mb-2">
                                {featureName || 'Feature'} Error
                            </h3>
                            <p className="text-gray-700 mb-4">
                                This feature encountered an error. Other parts of the app should still work.
                            </p>
                            <div className="bg-white/50 rounded p-3 mb-4">
                                <p className="text-sm font-mono text-red-300">
                                    {error?.message || 'Unknown error'}
                                </p>
                            </div>
                            <div className="flex space-x-3">
                                <button
                                    onClick={this.handleRetry}
                                    className="bg-brand-primary hover:bg-brand-primary/80 text-gray-900 text-sm font-semibold py-2 px-4 rounded transition-colors"
                                >
                                    Retry
                                </button>
                                <button
                                    onClick={this.handleCopyError}
                                    className="bg-white hover:bg-gray-300 text-gray-700 text-sm font-semibold py-2 px-4 rounded transition-colors"
                                >
                                    Copy Error
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            );
        }

        // Component-level error UI (inline, minimal)
        return (
            <div className="bg-red-900/10 border border-red-900/30 rounded-lg p-4 m-2">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <ExclamationTriangleIcon className="w-5 h-5 text-red-400" />
                        <div>
                            <p className="text-sm font-semibold text-red-400">Component Error</p>
                            <p className="text-xs text-gray-600">
                                {error?.message || 'Something went wrong'}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={this.handleRetry}
                        className="bg-white hover:bg-gray-300 text-gray-900 text-xs font-semibold py-1 px-3 rounded transition-colors"
                    >
                        Retry
                    </button>
                </div>
                {process.env.NODE_ENV === 'development' && errorInfo && (
                    <details className="mt-3">
                        <summary className="cursor-pointer text-xs text-gray-500 hover:text-gray-600">
                            Dev: Error Details
                        </summary>
                        <pre className="mt-2 text-xs text-red-400 bg-white p-2 rounded overflow-auto max-h-32">
                            {errorInfo.componentStack}
                        </pre>
                    </details>
                )}
            </div>
        );
    }
}

// HOC for wrapping components with error boundary
export function withErrorBoundary<P extends {}>(
    Component: React.ComponentType<P>,
    level: 'app' | 'feature' | 'component' = 'component',
    featureName?: string
) {
    return function WithErrorBoundaryComponent(props: P) {
        return (
            <ErrorBoundary level={level} featureName={featureName}>
                <Component {...props} />
            </ErrorBoundary>
        );
    };
}

export default ErrorBoundary;
