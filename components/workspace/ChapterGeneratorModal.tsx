import React, { useState } from 'react';
import { useBookCraftStore } from '../../store/useStore';
import type { Chapter } from '../../types';
import { Modal, Button, Spinner } from '../UI';
import { SparklesIcon } from '../Icons';
import { log } from '../../services/logger';

interface ChapterGeneratorModalProps {
    isOpen: boolean;
    onClose: () => void;
    chapter: Chapter;
    onGenerated: (newContent: string) => void;
}

export const ChapterGeneratorModal: React.FC<ChapterGeneratorModalProps> = ({ isOpen, onClose, chapter, onGenerated }) => {
    const generateChapterContent = useBookCraftStore(state => state.generateChapterContent);
    const [prompt, setPrompt] = useState('');
    const [wordCount, setWordCount] = useState('');
    const [style, setStyle] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!prompt.trim()) return;

        setIsLoading(true);
        try {
            const newContent = await generateChapterContent(chapter.id, prompt, wordCount, style);
            onGenerated(newContent);
            onClose(); // Close modal on success
        } catch (error) {
            log.error('Failed to generate chapter content', error as Error, 'ChapterGeneratorModal');
            alert("Sorry, there was an error generating the chapter.");
        } finally {
            setIsLoading(false);
        }
    };
    
    // Reset state on close
    const handleClose = () => {
        setPrompt('');
        setWordCount('');
        setStyle('');
        setIsLoading(false);
        onClose();
    }
    
    return (
        <Modal isOpen={isOpen} onClose={handleClose} title={`Generate Content for: ${chapter.title}`}>
            <form onSubmit={handleSubmit} className="space-y-4">
                 <div>
                    <label htmlFor="chapter-prompt" className="block text-sm font-medium text-slate-300 mb-1">Chapter Outline / Key Points</label>
                    <textarea
                        id="chapter-prompt"
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder={`e.g., "The protagonist discovers a hidden clue in the old book..."`}
                        rows={4}
                        className="w-full bg-slate-700 border-slate-600 rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary sm:text-sm p-2"
                        required
                    />
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                         <label htmlFor="word-count" className="block text-sm font-medium text-slate-300 mb-1">Target Word Count (Optional)</label>
                         <input
                            type="text"
                            id="word-count"
                            value={wordCount}
                            onChange={(e) => setWordCount(e.target.value)}
                            placeholder="e.g., 1500"
                            className="w-full bg-slate-700 border-slate-600 rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary sm:text-sm p-2"
                         />
                    </div>
                 </div>
                 <div>
                    <label htmlFor="style-prompt" className="block text-sm font-medium text-slate-300 mb-1">Additional Instructions (Style, Tone, etc.)</label>
                    <textarea
                        id="style-prompt"
                        value={style}
                        onChange={(e) => setStyle(e.target.value)}
                        placeholder={`e.g., "Write in a fast-paced, suspenseful tone."`}
                        rows={2}
                        className="w-full bg-slate-700 border-slate-600 rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary sm:text-sm p-2"
                    />
                 </div>
                 <div className="flex justify-end space-x-3 pt-2">
                    <Button type="button" variant="secondary" onClick={handleClose}>Cancel</Button>
                    <Button type="submit" isLoading={isLoading} disabled={isLoading || !prompt.trim()}>
                        <SparklesIcon className="w-5 h-5 mr-2" />
                        {isLoading ? 'Writing...' : 'Generate Chapter'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
};