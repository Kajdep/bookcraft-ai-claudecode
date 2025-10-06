
import React, { useState } from 'react';
// FIX: Corrected import paths for types, store, and other components.
import type { VisualRecommendation } from '../../types';
import { useBookCraftStore } from '../../store/useStore';
import { Card, Button, Spinner } from '../UI';
import { VisualIcon } from './VisualIcon';
import { CheckIcon, XMarkIcon, PhotoIcon, ChartBarIcon } from '../Icons';

interface RecommendationCardProps {
    rec: VisualRecommendation;
}

type VisualGenerationMode = 'diagram' | 'image';

export const RecommendationCard: React.FC<RecommendationCardProps> = ({ rec }) => {
    const acceptRecommendation = useBookCraftStore(state => state.acceptRecommendation);
    const acceptRecommendationAsImage = useBookCraftStore(state => state.acceptRecommendationAsImage);
    const rejectRecommendation = useBookCraftStore(state => state.rejectRecommendation);
    const generatingVisualFor = useBookCraftStore(state => state.generatingVisualFor);
    const isGenerating = generatingVisualFor === rec.id;
    
    const [generationMode, setGenerationMode] = useState<VisualGenerationMode>('diagram');

    return (
        <Card className="flex flex-col transition-shadow hover:shadow-brand-primary/20">
            <div className="p-5 flex-grow">
                <div className="flex items-center space-x-3 mb-3">
                    <div className="flex-shrink-0 bg-white/50 p-2 rounded-full">
                        <VisualIcon type={rec.type} className="h-6 w-6 text-brand-primary" />
                    </div>
                    <h4 className="font-bold text-lg text-gray-900">{rec.type}</h4>
                </div>
                <p className="text-sm text-gray-700 mb-4">{rec.reasoning}</p>
                <div className="text-xs p-3 bg-white/50 rounded-md border border-gray-300 font-mono text-gray-600 italic">
                    <p>"{rec.context}"</p>
                    <p className="text-right text-gray-500 not-italic mt-2">- Est. Page {rec.pageNumber}</p>
                </div>
                
                {/* Visual Type Selection */}
                <div className="mt-4 p-3 bg-gray-100/50 rounded-lg border border-gray-300/50">
                    <label className="text-xs font-semibold text-gray-600 mb-2 block">Generate As:</label>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setGenerationMode('diagram')}
                            disabled={isGenerating}
                            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                                generationMode === 'diagram'
                                    ? 'bg-brand-primary text-gray-900'
                                    : 'bg-white/50 text-gray-700 hover:bg-white'
                            } ${isGenerating ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                        >
                            <ChartBarIcon className="w-4 h-4" />
                            <span>Diagram</span>
                        </button>
                        <button
                            onClick={() => setGenerationMode('image')}
                            disabled={isGenerating}
                            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                                generationMode === 'image'
                                    ? 'bg-brand-primary text-gray-900'
                                    : 'bg-white/50 text-gray-700 hover:bg-white'
                            } ${isGenerating ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                        >
                            <PhotoIcon className="w-4 h-4" />
                            <span>AI Image</span>
                        </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                        {generationMode === 'diagram' 
                            ? 'Generate an interactive Mermaid diagram' 
                            : 'Generate an AI-powered image using Gemini'}
                    </p>
                </div>
            </div>
            <div className="p-3 bg-white/50 border-t border-gray-300/50 flex justify-end space-x-2">
                <Button variant="danger" onClick={() => rejectRecommendation(rec.id)} disabled={isGenerating}>
                    <XMarkIcon className="w-5 h-5"/>
                </Button>
                <Button 
                    variant="success" 
                    onClick={() => {
                        if (generationMode === 'image') {
                            acceptRecommendationAsImage(rec);
                        } else {
                            acceptRecommendation(rec);
                        }
                    }} 
                    isLoading={isGenerating} 
                    disabled={isGenerating}
                >
                    {isGenerating ? 'Generating...' : <CheckIcon className="w-5 h-5"/>}
                </Button>
            </div>
        </Card>
    );
};
