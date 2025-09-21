import React from 'react';
import { Spinner } from './UI';
import { SparklesIcon, CogIcon, PhotoIcon, ChartBarIcon } from './Icons';

interface LoadingStateProps {
    type?: 'ai' | 'analysis' | 'image' | 'visual' | 'general';
    message?: string;
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}

const loadingConfig = {
    ai: {
        icon: SparklesIcon,
        defaultMessage: 'AI is thinking...',
        color: 'text-yellow-400'
    },
    analysis: {
        icon: ChartBarIcon,
        defaultMessage: 'Analyzing content...',
        color: 'text-blue-400'
    },
    image: {
        icon: PhotoIcon,
        defaultMessage: 'Generating image...',
        color: 'text-green-400'
    },
    visual: {
        icon: CogIcon,
        defaultMessage: 'Creating visual...',
        color: 'text-purple-400'
    },
    general: {
        icon: CogIcon,
        defaultMessage: 'Loading...',
        color: 'text-slate-400'
    }
};

export const LoadingState: React.FC<LoadingStateProps> = ({
    type = 'general',
    message,
    size = 'md',
    className = ''
}) => {
    const config = loadingConfig[type];
    const Icon = config.icon;
    const displayMessage = message || config.defaultMessage;

    const sizeClasses = {
        sm: {
            container: 'p-4',
            icon: 'h-6 w-6',
            text: 'text-sm',
            spinner: 'sm' as const
        },
        md: {
            container: 'p-6',
            icon: 'h-8 w-8',
            text: 'text-base',
            spinner: 'md' as const
        },
        lg: {
            container: 'p-8',
            icon: 'h-12 w-12',
            text: 'text-lg',
            spinner: 'lg' as const
        }
    };

    const sizes = sizeClasses[size];

    return (
        <div className={`flex flex-col items-center justify-center text-center ${sizes.container} ${className}`}>
            <div className="flex items-center space-x-3 mb-3">
                <Icon className={`${sizes.icon} ${config.color} animate-pulse`} />
                <Spinner size={sizes.spinner} />
            </div>
            <p className={`${sizes.text} text-slate-300 font-medium`}>
                {displayMessage}
            </p>
        </div>
    );
};

// Inline loading component for smaller spaces
export const InlineLoading: React.FC<{ message?: string; className?: string }> = ({
    message = 'Loading...',
    className = ''
}) => (
    <div className={`flex items-center space-x-2 ${className}`}>
        <Spinner size="sm" />
        <span className="text-sm text-slate-400">{message}</span>
    </div>
);

// Overlay loading component
export const LoadingOverlay: React.FC<LoadingStateProps> = (props) => (
    <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-slate-800 rounded-lg border border-slate-700 shadow-xl">
            <LoadingState {...props} />
        </div>
    </div>
);