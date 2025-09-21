
import React from 'react';
// FIX: Corrected import paths for store, types, and other components.
import { useBookCraftStore } from '../../store/useStore';
import { Button, Card } from '../UI';
import { SparklesIcon } from '../Icons';
import { RecommendationCard } from './RecommendationCard';
import { LoadingState } from '../LoadingState';
import { ErrorBoundary } from '../ErrorBoundary';
import type { Project } from '../../types';

interface AIVisualsTabProps {
    project: Project;
}

const analysisMessages = [
    "AI is reading your manuscript...",
    "Identifying key concepts and data...",
    "Scanning for complex processes...",
    "Evaluating opportunities for visualization...",
    "Finalizing recommendations..."
];

export const AIVisualsTab: React.FC<AIVisualsTabProps> = ({ project }) => {
    const startAnalysis = useBookCraftStore(state => state.startAnalysis);
    const isLoading = useBookCraftStore(state => state.isLoading);
    const [messageIndex, setMessageIndex] = React.useState(0);

    React.useEffect(() => {
        // FIX: Changed to window.setInterval and window.clearInterval to resolve TypeScript type conflicts between Node.js and browser environments for timer functions.
        // This ensures the correct 'number' type is used for the interval ID.
        let interval: number;
        if (isLoading) {
            interval = window.setInterval(() => {
                setMessageIndex(prev => (prev + 1) % analysisMessages.length);
            }, 2000);
        }
        return () => window.clearInterval(interval);
    }, [isLoading]);


    return (
        <ErrorBoundary>
            <div className="space-y-6 animate-fade-in">
                <Card className="p-6">
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                        <div className="text-center sm:text-left">
                            <h3 className="text-xl font-bold">AI Content Analysis</h3>
                            <p className="text-slate-400 mt-1">Let Gemini analyze your manuscript to find the best opportunities for visuals.</p>
                        </div>
                        <Button onClick={startAnalysis} isLoading={isLoading} disabled={isLoading}>
                            <SparklesIcon className="w-5 h-5 mr-2"/>
                            {project.status === 'Review' ? 'Re-analyze Manuscript' : 'Start Analysis'}
                        </Button>
                    </div>
                </Card>

                {isLoading && (
                    <Card className="bg-slate-800/50">
                        <LoadingState
                            type="analysis"
                            message={analysisMessages[messageIndex]}
                            size="lg"
                        />
                    </Card>
                )}

                {!isLoading && project.recommendations.length > 0 && (
                     <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                        {project.recommendations.map(rec =>
                            <ErrorBoundary key={rec.id}>
                                <RecommendationCard rec={rec} />
                            </ErrorBoundary>
                        )}
                    </div>
                )}

                 {!isLoading && project.recommendations.length === 0 && (project.status === 'Review' || project.status === 'Done') && (
                    <div className="text-center py-16 border-2 border-dashed border-slate-700 rounded-lg bg-slate-800/20">
                        <SparklesIcon className="mx-auto h-12 w-12 text-slate-600" />
                        <h3 className="mt-4 text-xl font-semibold text-slate-300">Analysis Complete</h3>
                        <p className="mt-2 text-slate-400">Gemini couldn't find any new visual recommendations at this time.</p>
                    </div>
                 )}
            </div>
        </ErrorBoundary>
    );
};
