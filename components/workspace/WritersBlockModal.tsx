import React, { useState } from 'react';
import { XMarkIcon, SparklesIcon, LightBulbIcon } from '../Icons';
import { Button } from '../UI';
import { useBookCraftStore } from '../../store/useStore';
import { Chapter } from '../../types';
import { log } from '../../services/logger';

interface WritersBlockModalProps {
    isOpen: boolean;
    onClose: () => void;
    chapter: Chapter;
    onSuggestionApplied: (suggestion: string) => void;
}

export const WritersBlockModal: React.FC<WritersBlockModalProps> = ({
    isOpen,
    onClose,
    chapter,
    onSuggestionApplied,
}) => {
    const [selectedPrompt, setSelectedPrompt] = useState<string>('');
    const [customPrompt, setCustomPrompt] = useState<string>('');
    const [isGenerating, setIsGenerating] = useState(false);
    const getAIAssistantResponse = useBookCraftStore(state => state.getAIAssistantResponse);

    const writingPrompts = [
        "What happens next in this scene?",
        "Describe the setting in more detail",
        "What is the main character thinking right now?",
        "Add some dialogue to move the story forward",
        "What conflict or tension can you introduce here?",
        "How does this scene connect to the larger plot?",
        "What emotions are the characters experiencing?",
        "Add a sensory detail (sight, sound, smell, touch, taste)",
        "What backstory can you reveal through this scene?",
        "How can you raise the stakes in this moment?"
    ];

    const handleGenerateSuggestion = async () => {
        const prompt = selectedPrompt || customPrompt;
        if (!prompt.trim()) return;

        setIsGenerating(true);
        try {
            const suggestion = await getAIAssistantResponse(chapter, `I'm experiencing writer's block. Help me with this: ${prompt}. Provide a specific suggestion or short paragraph I can use to continue writing.`);
            onSuggestionApplied(suggestion);
            onClose();
        } catch (error) {
            log.error('Failed to generate writing suggestion', error as Error, 'WritersBlockModal');
            alert('Failed to generate suggestion. Please try again.');
        } finally {
            setIsGenerating(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-100 rounded-lg border border-gray-300 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between p-6 border-b border-gray-300">
                    <div className="flex items-center space-x-2">
                        <LightBulbIcon className="w-6 h-6 text-yellow-400" />
                        <h2 className="text-xl font-bold text-gray-900">Writer's Block Helper</h2>
                    </div>
                    <button onClick={onClose} className="text-gray-600 hover:text-gray-800">
                        <XMarkIcon className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    <div>
                        <p className="text-gray-700 mb-4">
                            Stuck on "<strong>{chapter.title}</strong>"? Choose a prompt below or write your own to get AI-powered suggestions to overcome writer's block.
                        </p>
                    </div>

                    <div>
                        <h3 className="text-lg font-semibold text-gray-800 mb-3">Quick Prompts</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {writingPrompts.map((prompt, index) => (
                                <button
                                    key={index}
                                    onClick={() => {
                                        setSelectedPrompt(prompt);
                                        setCustomPrompt('');
                                    }}
                                    className={`p-3 text-left rounded-lg border transition-colors ${
                                        selectedPrompt === prompt
                                            ? 'border-brand-primary bg-brand-primary/10 text-brand-primary'
                                            : 'border-gray-300 hover:border-gray-400 text-gray-700 hover:text-gray-800'
                                    }`}
                                >
                                    {prompt}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <h3 className="text-lg font-semibold text-gray-800 mb-3">Custom Prompt</h3>
                        <textarea
                            value={customPrompt}
                            onChange={(e) => {
                                setCustomPrompt(e.target.value);
                                setSelectedPrompt('');
                            }}
                            placeholder="Describe what you're struggling with or what kind of help you need..."
                            className="w-full h-24 bg-white border border-gray-300 rounded-lg p-3 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-primary"
                        />
                    </div>

                    {chapter.content && (
                        <div>
                            <h3 className="text-lg font-semibold text-gray-800 mb-3">Current Chapter Preview</h3>
                            <div className="bg-white border border-gray-300 rounded-lg p-3 max-h-32 overflow-y-auto">
                                <p className="text-gray-600 text-sm">
                                    {chapter.content.replace(/<[^>]*>/g, '').substring(0, 300)}
                                    {chapter.content.length > 300 ? '...' : ''}
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-300">
                    <Button variant="ghost" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleGenerateSuggestion}
                        isLoading={isGenerating}
                        disabled={!selectedPrompt && !customPrompt.trim()}
                    >
                        <SparklesIcon className="w-4 h-4 mr-2" />
                        Get Suggestion
                    </Button>
                </div>
            </div>
        </div>
    );
};