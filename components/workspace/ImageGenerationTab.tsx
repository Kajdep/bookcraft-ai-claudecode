
import React, { useState, FormEvent } from 'react';
// FIX: Corrected import paths for types, store, and other components.
import type { Project } from '../../types';
import { useBookCraftStore } from '../../store/useStore';
import { Button, Card } from '../UI';
import { PhotoIcon, SparklesIcon } from '../Icons';
import { LoadingState } from '../LoadingState';
import { ErrorBoundary } from '../ErrorBoundary';

interface ImageGenerationTabProps {
    project: Project;
}

export const ImageGenerationTab: React.FC<ImageGenerationTabProps> = ({ project }) => {
    const [prompt, setPrompt] = useState('');
    const generateImage = useBookCraftStore(state => state.generateImage);
    const isGeneratingImage = useBookCraftStore(state => state.isGeneratingImage);

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        if (!prompt.trim()) return;
        generateImage(prompt);
        setPrompt('');
    };

    return (
        <ErrorBoundary>
            <div className="space-y-8 animate-fade-in">
            <Card className="p-6">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="image-prompt" className="block text-sm font-bold text-slate-200 mb-2">
                           Image Prompt
                        </label>
                        <textarea
                            id="image-prompt"
                            rows={3}
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder="e.g., A majestic castle on a floating island, digital painting style..."
                            className="w-full bg-slate-700 border-slate-600 rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary sm:text-sm p-2 text-slate-200"
                            required
                        />
                    </div>
                    <div className="flex justify-end">
                        <Button type="submit" isLoading={isGeneratingImage} disabled={isGeneratingImage || !prompt.trim()}>
                            <SparklesIcon className="w-5 h-5 mr-2" />
                            {isGeneratingImage ? 'Generating...' : 'Generate Image'}
                        </Button>
                    </div>
                </form>
            </Card>

            <div>
                <h3 className="text-2xl font-bold mb-4">Generated Images</h3>
                {isGeneratingImage && project.generatedImages.length === 0 && (
                     <Card className="bg-slate-800/50">
                        <LoadingState
                            type="image"
                            message="Gemini Flash 2.5 is generating your image..."
                            size="lg"
                        />
                    </Card>
                )}

                {project.generatedImages.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {project.generatedImages.map(image => (
                            <ErrorBoundary key={image.id}>
                                <Card className="group overflow-hidden">
                                    <div className="aspect-square bg-slate-900 flex items-center justify-center">
                                        <img
                                            src={`data:image/png;base64,${image.base64Image}`}
                                            alt={image.prompt}
                                            className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-105"
                                        />
                                    </div>
                                    <div className="p-4">
                                        <p className="text-sm text-slate-400 truncate group-hover:whitespace-normal">{image.prompt}</p>
                                    </div>
                                </Card>
                            </ErrorBoundary>
                        ))}
                    </div>
                ) : (
                    !isGeneratingImage && (
                        <div className="text-center py-16 border-2 border-dashed border-slate-700 rounded-lg bg-slate-800/20">
                            <PhotoIcon className="mx-auto h-12 w-12 text-slate-600" />
                            <h3 className="mt-4 text-xl font-semibold text-slate-300">No Images Generated Yet</h3>
                            <p className="mt-2 text-slate-400">Use the form above to create your first visual.</p>
                        </div>
                    )
                )}
            </div>
            </div>
        </ErrorBoundary>
    );
};
