import React, { useState } from 'react';
import { useBookCraftStore } from '../../store/useStore';
import { Modal, Button, Spinner } from '../UI';
import { SparklesIcon } from '../Icons';
import { log } from '../../services/logger';

interface MergeContentModalProps {
    isOpen: boolean;
    onClose: () => void;
    originalContent: string;
    generatedContent: string;
    onApply: (finalContent: string) => void;
}

export const MergeContentModal: React.FC<MergeContentModalProps> = ({ isOpen, onClose, originalContent, generatedContent, onApply }) => {
    const combineChapterContent = useBookCraftStore(state => state.combineChapterContent);
    const refineGeneratedText = useBookCraftStore(state => state.refineGeneratedText);

    const [currentGeneratedContent, setCurrentGeneratedContent] = useState(generatedContent);
    const [refinementPrompt, setRefinementPrompt] = useState('');
    const [isCombining, setIsCombining] = useState(false);
    const [isRegenerating, setIsRegenerating] = useState(false);

    React.useEffect(() => {
        if (isOpen) {
            setCurrentGeneratedContent(generatedContent);
            setRefinementPrompt('');
        }
    }, [isOpen, generatedContent]);

    const handleReplace = () => {
        onApply(currentGeneratedContent);
        onClose();
    };

    const handleAppend = () => {
        const separator = originalContent.trim().length > 0 ? '\n<p><br></p>\n' : '';
        onApply(originalContent + separator + currentGeneratedContent);
        onClose();
    };

    const handleCombine = async () => {
        setIsCombining(true);
        try {
            const combinedContent = await combineChapterContent(originalContent, currentGeneratedContent);
            onApply(combinedContent);
            onClose();
        } catch (error) {
            log.error('Failed to combine content using AI', error as Error, 'MergeContentModal');
            alert("Sorry, there was an error combining the content with AI.");
        } finally {
            setIsCombining(false);
        }
    };

    const handleRegenerate = async () => {
        if (!refinementPrompt.trim()) return;
        setIsRegenerating(true);
        try {
            const refinedContent = await refineGeneratedText(currentGeneratedContent, refinementPrompt);
            setCurrentGeneratedContent(refinedContent);
            setRefinementPrompt('');
        } catch (error) {
            log.error('Failed to refine generated content', error as Error, 'MergeContentModal');
            alert("Sorry, there was an error refining the content.");
        } finally {
            setIsRegenerating(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Generated Content Ready">
            <div className="space-y-4">
                <div>
                    <h4 className="font-semibold text-slate-200 mb-2">AI Generated Content:</h4>
                    <div className="relative">
                        <div
                            className="prose prose-invert prose-sm max-w-none max-h-60 overflow-y-auto p-3 bg-slate-700/50 rounded-md border border-slate-600"
                            dangerouslySetInnerHTML={{ __html: currentGeneratedContent }}
                        />
                        {isRegenerating && (
                            <div className="absolute inset-0 bg-slate-700/80 flex items-center justify-center rounded-md">
                                <Spinner />
                            </div>
                        )}
                    </div>
                </div>

                <div className="space-y-2 pt-2">
                    <label htmlFor="refine-prompt" className="block text-sm font-medium text-slate-300">
                        Need changes? Tell the AI what to do:
                    </label>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            id="refine-prompt"
                            value={refinementPrompt}
                            onChange={(e) => setRefinementPrompt(e.target.value)}
                            onKeyDown={(e) => { if(e.key === 'Enter') handleRegenerate()}}
                            placeholder="e.g., Make it more formal, add a joke..."
                            className="flex-grow bg-slate-700 border-slate-600 rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary sm:text-sm p-2"
                            disabled={isRegenerating || isCombining}
                        />
                        <Button onClick={handleRegenerate} isLoading={isRegenerating} disabled={isRegenerating || isCombining || !refinementPrompt.trim()}>
                            <SparklesIcon className="w-5 h-5"/>
                        </Button>
                    </div>
                </div>

                <div className="pt-4">
                    <p className="text-slate-300 font-semibold mb-3">How would you like to use this content?</p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <Button variant="secondary" onClick={handleReplace} disabled={isCombining || isRegenerating}>Replace Existing</Button>
                        <Button variant="secondary" onClick={handleAppend} disabled={isCombining || isRegenerating}>Append to End</Button>
                        <Button variant="primary" onClick={handleCombine} isLoading={isCombining} disabled={isCombining || isRegenerating}>
                            <SparklesIcon className="w-5 h-5 mr-2" />
                            Merge with AI
                        </Button>
                    </div>
                </div>
            </div>
        </Modal>
    );
};
