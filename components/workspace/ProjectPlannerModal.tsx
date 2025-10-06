import React, { useState, useRef } from 'react';
import { useBookCraftStore } from '../../store/useStore';
import { Modal, Button, Spinner } from '../UI';
import { SparklesIcon, PlusIcon, RefreshCwIcon, UploadIcon, TrashIcon } from '../Icons';
import { log } from '../../services/logger';

interface ProjectPlannerModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const ProjectPlannerModal: React.FC<ProjectPlannerModalProps> = ({ isOpen, onClose }) => {
    const planChapters = useBookCraftStore(state => state.planChapters);
    const regenerateChapterTitle = useBookCraftStore(state => state.regenerateChapterTitle);
    const addChaptersFromPlan = useBookCraftStore(state => state.addChaptersFromPlan);
    
    const [prompt, setPrompt] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [regeneratingIndex, setRegeneratingIndex] = useState<number | null>(null);
    const [chapterTitles, setChapterTitles] = useState<string[]>([]);
    const [fileName, setFileName] = useState('');
    // FIX: Add a ref for the file input to trigger it programmatically.
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleSubmit = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!prompt.trim()) return;

        setIsLoading(true);
        setChapterTitles([]);
        try {
            const titles = await planChapters(prompt);
            setChapterTitles(titles);
        } catch (error) {
            log.error('Failed to plan chapters with AI', error as Error, 'ProjectPlannerModal');
            alert("Sorry, there was an error planning the chapters.");
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleRegenerateTitle = async (index: number) => {
        setRegeneratingIndex(index);
        try {
            const oldTitle = chapterTitles[index];
            const newTitle = await regenerateChapterTitle(prompt, oldTitle);
            setChapterTitles(currentTitles => {
                const newTitles = [...currentTitles];
                newTitles[index] = newTitle.trim();
                return newTitles;
            });
        } catch (error) {
            log.error('Failed to regenerate chapter title', error as Error, 'ProjectPlannerModal');
            alert("Sorry, there was an error regenerating the chapter title.");
        } finally {
            setRegeneratingIndex(null);
        }
    };

    const handleDeleteChapter = (indexToDelete: number) => {
        setChapterTitles(currentTitles => currentTitles.filter((_, index) => index !== indexToDelete));
    };


    const handleAddChapters = () => {
        if (chapterTitles.length > 0) {
            addChaptersFromPlan(chapterTitles);
            onClose();
        }
    };
    
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const text = event.target?.result as string;
                setPrompt(text);
                setFileName(file.name);
            };
            reader.readAsText(file);
        }
    };

    const handleClose = () => {
        setPrompt('');
        setChapterTitles([]);
        setIsLoading(false);
        setRegeneratingIndex(null);
        setFileName('');
        onClose();
    }

    // FIX: Create a handler to trigger the hidden file input's click event.
    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title="AI Project Planner">
            <div className="space-y-4">
                <p className="text-gray-600">Describe your book, or upload a document, and the AI will help you create a chapter outline. e.g., "A 10-chapter outline for a sci-fi mystery."</p>
                <form onSubmit={handleSubmit} className="space-y-3">
                    <textarea
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="Your planning request..."
                        rows={3}
                        className="w-full bg-white border-gray-300 rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary sm:text-sm p-2 text-gray-900 placeholder-gray-400"
                    />
                    {fileName && <p className="text-xs text-gray-600">Loaded from: {fileName}</p>}
                    <div className="flex justify-end items-center gap-2">
                         {/* FIX: Replaced the incorrect `as="label"` pattern with a standard button that triggers a hidden file input. */}
                         <Button type="button" variant="secondary" className="cursor-pointer" onClick={handleUploadClick}>
                            <UploadIcon className="w-5 h-5 mr-2"/>
                            Upload Doc
                        </Button>
                        <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".txt,.md" className="hidden"/>
                        {chapterTitles.length > 0 && (
                             <Button type="button" variant="secondary" onClick={() => handleSubmit()} isLoading={isLoading} disabled={isLoading || !prompt.trim()}>
                                <RefreshCwIcon className="w-5 h-5 mr-2" />
                                Regenerate All
                            </Button>
                        )}
                        <Button type="submit" isLoading={isLoading} disabled={isLoading || !prompt.trim()}>
                            <SparklesIcon className="w-5 h-5 mr-2" />
                            {isLoading ? 'Planning...' : 'Generate Plan'}
                        </Button>
                    </div>
                </form>

                {isLoading && (
                    <div className="flex flex-col items-center justify-center p-6">
                        <Spinner />
                        <p className="mt-3 text-gray-700">AI is building your outline...</p>
                    </div>
                )}
                
                {chapterTitles.length > 0 && !isLoading && (
                    <div className="space-y-3 pt-4 animate-fade-in">
                        <h4 className="font-semibold text-gray-800">Suggested Chapters:</h4>
                        <ul className="space-y-2 bg-white/50 p-3 rounded-md border border-gray-300 max-h-60 overflow-y-auto">
                            {chapterTitles.map((title, index) => (
                                <li key={index} className="flex items-center justify-between text-gray-700 p-2 bg-gray-100 rounded group">
                                    <span className="flex-grow pr-2">{title}</span>
                                    <div className={`flex items-center space-x-1 transition-opacity ${regeneratingIndex === index ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                                        <button 
                                            onClick={() => handleRegenerateTitle(index)} 
                                            className="p-1 text-gray-600 hover:text-brand-primary rounded-full hover:bg-white disabled:opacity-50"
                                            disabled={regeneratingIndex !== null}
                                            aria-label="Regenerate title"
                                        >
                                            {regeneratingIndex === index ? <Spinner size="sm" /> : <RefreshCwIcon className="w-4 h-4" />}
                                        </button>
                                        <button 
                                            onClick={() => handleDeleteChapter(index)}
                                            className="p-1 text-gray-600 hover:text-red-400 rounded-full hover:bg-white disabled:opacity-50"
                                            disabled={regeneratingIndex !== null}
                                            aria-label="Delete title"
                                        >
                                            <TrashIcon className="w-4 h-4" />
                                        </button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                        <div className="flex justify-end pt-2">
                             <Button onClick={handleAddChapters} variant="success">
                                <PlusIcon className="w-5 h-5 mr-2"/>
                                Add to Project
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </Modal>
    );
};