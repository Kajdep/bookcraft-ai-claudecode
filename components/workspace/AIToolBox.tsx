import React, { useState } from 'react';
import { ChevronDownIcon, ChevronUpIcon } from '../Icons';

interface AIToolBoxProps {
    title: string;
    icon?: React.ReactNode;
    isLoading?: boolean;
    children: React.ReactNode;
    defaultExpanded?: boolean;
    className?: string;
}

export const AIToolBox: React.FC<AIToolBoxProps> = ({
    title,
    icon,
    isLoading = false,
    children,
    defaultExpanded = false,
    className = ''
}) => {
    const [isExpanded, setIsExpanded] = useState(defaultExpanded);

    return (
        <div className={`bg-white border border-gray-300 rounded-lg shadow-sm ${className}`}>
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
                <div className="flex items-center gap-3">
                    {icon && <span className="text-gray-700">{icon}</span>}
                    <h3 className="font-semibold text-gray-900">{title}</h3>
                    {isLoading && (
                        <div className="flex items-center gap-2">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-brand-primary"></div>
                            <span className="text-xs text-gray-600">Processing...</span>
                        </div>
                    )}
                </div>
                {isExpanded ? (
                    <ChevronUpIcon className="w-5 h-5 text-gray-600" />
                ) : (
                    <ChevronDownIcon className="w-5 h-5 text-gray-600" />
                )}
            </button>
            {isExpanded && (
                <div className="p-4 border-t border-gray-200 animate-fade-in">
                    {children}
                </div>
            )}
        </div>
    );
};
