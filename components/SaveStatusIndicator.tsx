import React from 'react';
import { useBookCraftStore } from '../store/useStore';
import { CheckIcon, ClockIcon } from './Icons';

interface SaveStatusIndicatorProps {
    className?: string;
}

export const SaveStatusIndicator: React.FC<SaveStatusIndicatorProps> = ({ className = '' }) => {
    const isAutoSaving = useBookCraftStore(state => state.isAutoSaving);
    const pendingChanges = useBookCraftStore(state => state.pendingChanges);
    const lastSaved = useBookCraftStore(state => state.lastSaved);

    const getStatusText = () => {
        if (isAutoSaving) {
            return 'Saving...';
        }
        if (pendingChanges) {
            return 'Unsaved changes';
        }
        if (lastSaved) {
            const now = new Date();
            const diffMinutes = Math.floor((now.getTime() - lastSaved.getTime()) / 60000);
            if (diffMinutes < 1) {
                return 'Saved just now';
            } else if (diffMinutes < 60) {
                return `Saved ${diffMinutes}m ago`;
            } else {
                const diffHours = Math.floor(diffMinutes / 60);
                return `Saved ${diffHours}h ago`;
            }
        }
        return 'Not saved';
    };

    const getStatusIcon = () => {
        if (isAutoSaving || pendingChanges) {
            return <ClockIcon className="w-4 h-4" />;
        }
        return <CheckIcon className="w-4 h-4" />;
    };

    const getStatusColor = () => {
        if (isAutoSaving) {
            return 'text-blue-400';
        }
        if (pendingChanges) {
            return 'text-yellow-400';
        }
        return 'text-green-400';
    };

    return (
        <div className={`flex items-center gap-2 text-xs ${getStatusColor()} ${className}`}>
            {getStatusIcon()}
            <span>{getStatusText()}</span>
        </div>
    );
};