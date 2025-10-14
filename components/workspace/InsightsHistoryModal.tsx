import React, { useState } from 'react';
import { Modal, Button } from '../UI';
import { ClockIcon, SparklesIcon, PhotoIcon, BeakerIcon } from '../Icons';
import type { ChapterInsight } from '../../types';
import { InsightType } from '../../types';

interface InsightsHistoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    insights: ChapterInsight[];
    onRestoreInsight: (insight: ChapterInsight) => void;
}

export const InsightsHistoryModal: React.FC<InsightsHistoryModalProps> = ({
    isOpen,
    onClose,
    insights,
    onRestoreInsight
}) => {
    const [selectedType, setSelectedType] = useState<InsightType | 'all'>('all');

    const filteredInsights = selectedType === 'all'
        ? insights
        : insights.filter(i => i.type === selectedType);

    const sortedInsights = [...filteredInsights].sort((a, b) => b.timestamp - a.timestamp);

    const getTypeIcon = (type: InsightType) => {
        switch (type) {
            case InsightType.Structure:
                return <SparklesIcon className="w-5 h-5 text-blue-500" />;
            case InsightType.Suggestions:
                return <SparklesIcon className="w-5 h-5 text-green-500" />;
            case InsightType.VisualAnalysis:
                return <PhotoIcon className="w-5 h-5 text-purple-500" />;
            case InsightType.Grammar:
                return <BeakerIcon className="w-5 h-5 text-orange-500" />;
        }
    };

    const getTypeLabel = (type: InsightType) => {
        switch (type) {
            case InsightType.Structure:
                return 'Structure';
            case InsightType.Suggestions:
                return 'Suggestions';
            case InsightType.VisualAnalysis:
                return 'Visual Analysis';
            case InsightType.Grammar:
                return 'Grammar';
        }
    };

    const formatTimestamp = (timestamp: number) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Insights History" size="large">
            <div className="space-y-4">
                {/* Filter Tabs */}
                <div className="flex gap-2 border-b border-gray-200 pb-2">
                    <button
                        onClick={() => setSelectedType('all')}
                        className={`px-3 py-2 rounded-t text-sm font-medium transition-colors ${
                            selectedType === 'all'
                                ? 'bg-blue-100 text-blue-700'
                                : 'text-gray-600 hover:bg-gray-100'
                        }`}
                    >
                        All ({insights.length})
                    </button>
                    {Object.values(InsightType).map(type => {
                        const count = insights.filter(i => i.type === type).length;
                        if (count === 0) return null;
                        return (
                            <button
                                key={type}
                                onClick={() => setSelectedType(type)}
                                className={`px-3 py-2 rounded-t text-sm font-medium transition-colors ${
                                    selectedType === type
                                        ? 'bg-blue-100 text-blue-700'
                                        : 'text-gray-600 hover:bg-gray-100'
                                }`}
                            >
                                {getTypeLabel(type)} ({count})
                            </button>
                        );
                    })}
                </div>

                {/* Insights List */}
                <div className="space-y-3 max-h-96 overflow-y-auto">
                    {sortedInsights.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            <ClockIcon className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                            <p>No insights yet</p>
                            <p className="text-sm mt-1">
                                Generate structure analysis, suggestions, or visual analysis to see them here
                            </p>
                        </div>
                    ) : (
                        sortedInsights.map(insight => (
                            <div
                                key={insight.id}
                                className="bg-white border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors"
                            >
                                <div className="flex items-start justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        {getTypeIcon(insight.type)}
                                        <span className="font-semibold text-gray-900">
                                            {getTypeLabel(insight.type)}
                                        </span>
                                    </div>
                                    <span className="text-xs text-gray-500">
                                        {formatTimestamp(insight.timestamp)}
                                    </span>
                                </div>
                                <p className="text-sm text-gray-700 mb-3">{insight.summary}</p>

                                {/* Preview of data based on type */}
                                {insight.type === InsightType.Structure && Array.isArray(insight.data) && (
                                    <div className="text-xs text-gray-600 bg-gray-50 rounded p-2 mb-2">
                                        <div className="space-y-1">
                                            {insight.data.slice(0, 3).map((item: any, idx: number) => (
                                                <div key={idx}>• {item.point}</div>
                                            ))}
                                            {insight.data.length > 3 && (
                                                <div className="text-gray-500">
                                                    +{insight.data.length - 3} more points
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                <Button
                                    size="sm"
                                    variant="primary"
                                    onClick={() => onRestoreInsight(insight)}
                                    className="w-full"
                                >
                                    Restore This Insight
                                </Button>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </Modal>
    );
};
