import React, { Component, ErrorInfo, ReactNode } from 'react';
import { ExclamationTriangleIcon } from './Icons';
import { log } from '../services/logger';

interface Props {
    children?: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error?: Error;
    errorInfo?: ErrorInfo;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        log.error('React Error Boundary caught an error', error, 'ErrorBoundary');

        this.setState({
            error,
            errorInfo
        });
    }

    private handleRetry = () => {
        this.setState({ hasError: false, error: undefined, errorInfo: undefined });
    };

    public render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className="min-h-[200px] flex items-center justify-center p-6">
                    <div className="text-center max-w-md">
                        <div className="flex justify-center mb-4">
                            <ExclamationTriangleIcon className="h-12 w-12 text-red-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-slate-100 mb-2">
                            Something went wrong
                        </h3>
                        <p className="text-slate-400 mb-4">
                            An unexpected error occurred. Please try again or refresh the page.
                        </p>
                        <div className="space-y-2">
                            <button
                                onClick={this.handleRetry}
                                className="px-4 py-2 bg-brand-primary text-white rounded-md hover:bg-brand-primary/80 transition-colors"
                            >
                                Try Again
                            </button>
                            <button
                                onClick={() => window.location.reload()}
                                className="block w-full px-4 py-2 text-slate-400 hover:text-slate-200 transition-colors"
                            >
                                Refresh Page
                            </button>
                        </div>
                        {process.env.NODE_ENV === 'development' && this.state.error && (
                            <details className="mt-4 text-left">
                                <summary className="cursor-pointer text-sm text-slate-500 hover:text-slate-400">
                                    Error Details (Development)
                                </summary>
                                <pre className="mt-2 text-xs text-red-400 bg-slate-900 p-2 rounded overflow-auto">
                                    {this.state.error.message}
                                    {this.state.error.stack && `\n${this.state.error.stack}`}
                                </pre>
                            </details>
                        )}
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

// HOC for wrapping components with error boundary
export function withErrorBoundary<P extends {}>(
    Component: React.ComponentType<P>,
    fallback?: ReactNode
) {
    return function WithErrorBoundaryComponent(props: P) {
        return (
            <ErrorBoundary fallback={fallback}>
                <Component {...props} />
            </ErrorBoundary>
        );
    };
}