import React, { useState, useMemo } from 'react';
import { useBookCraftStore } from '../../store/useStore';
import type { Chapter, ResearchItem, PlotPoint } from '../../types';
import { Modal, Button, Spinner } from '../UI';
import { SparklesIcon, SearchIcon, BookOpenIcon, MapIcon } from '../Icons';
import { log } from '../../services/logger';

interface ChapterGeneratorModalProps {
    isOpen: boolean;
    onClose: () => void;
    chapter: Chapter;
    onGenerated: (newContent: string) => void;
}

export const ChapterGeneratorModal: React.FC<ChapterGeneratorModalProps> = ({ isOpen, onClose, chapter, onGenerated }) => {
    const generateChapterContent = useBookCraftStore(state => state.generateChapterContent);
    const activeProject = useBookCraftStore(state => state.activeProjectId ? state.projects[state.activeProjectId] : null);
    const [prompt, setPrompt] = useState('');
    const [wordCount, setWordCount] = useState('');
    const [style, setStyle] = useState('');
    const [selectedResearchItems, setSelectedResearchItems] = useState<string[]>([]);
    const [showResearchSelector, setShowResearchSelector] = useState(false);
    const [selectedPlotPoints, setSelectedPlotPoints] = useState<string[]>([]);
    const [showPlotSelector, setShowPlotSelector] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [useInternetSearch, setUseInternetSearch] = useState(false);

    // Get available research items for this chapter or all research
    const availableResearch = useMemo(() => {
        if (!activeProject) return [];
        return activeProject.research.filter(item => 
            item.linkedChapterIds.includes(chapter.id) || item.linkedChapterIds.length === 0
        );
    }, [activeProject, chapter.id]);

    const selectedResearch = useMemo(() => {
        return availableResearch.filter(item => selectedResearchItems.includes(item.id));
    }, [availableResearch, selectedResearchItems]);

    // Get available plot points
    const availablePlotPoints = useMemo(() => {
        if (!activeProject) return [];
        return activeProject.plotPoints.sort((a, b) => a.order - b.order);
    }, [activeProject]);

    const selectedPlotPointsData = useMemo(() => {
        return availablePlotPoints.filter(point => selectedPlotPoints.includes(point.id));
    }, [availablePlotPoints, selectedPlotPoints]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!prompt.trim()) return;

        setIsLoading(true);
        try {
            // Build full book context
            let bookContext = '';
            if (activeProject) {
                bookContext = `Book Title: "${activeProject.title}"\nGenre: ${activeProject.genre}\n`;
                
                // Add chapter context
                const otherChapters = activeProject.chapters
                    .filter(c => c.id !== chapter.id)
                    .sort((a, b) => a.order - b.order)
                    .map(c => `Chapter ${c.order + 1}: "${c.title}"${c.content ? ' (has content)' : ' (empty)'}`);
                    
                if (otherChapters.length > 0) {
                    bookContext += `\nOther Chapters:\n${otherChapters.join('\n')}`;
                }
                
                // Add current chapter context
                if (chapter.content && chapter.content.trim()) {
                    const plainTextContent = chapter.content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
                    bookContext += `\n\nCurrent Chapter Content (${plainTextContent.split(' ').length} words):\n${plainTextContent.substring(0, 1000)}${plainTextContent.length > 1000 ? '...' : ''}`;
                }
            }
            
            // Build research context if research items are selected
            let researchContext = '';
            if (selectedResearch.length > 0) {
                researchContext = selectedResearch.map(item => 
                    `Research: ${item.query}\nSummary: ${item.summary}\nContent: ${item.content.substring(0, 500)}...`
                ).join('\n\n');
            }
            
            // Build plot context if plot points are selected
            let plotContext = '';
            if (selectedPlotPointsData.length > 0) {
                plotContext = selectedPlotPointsData.map(point => 
                    `Plot Point ${point.order + 1}: ${point.title}\nDescription: ${point.description}`
                ).join('\n\n');
            }
            
            // Combine all contexts with the user prompt
            let enhancedPrompt = prompt;
            if (bookContext) {
                enhancedPrompt += `\n\nBook Context:\n${bookContext}`;
            }
            if (researchContext) {
                enhancedPrompt += `\n\nRelevant Research Context:\n${researchContext}`;
            }
            if (plotContext) {
                enhancedPrompt += `\n\nRelevant Plot Points:\n${plotContext}`;
            }

            const newContent = await generateChapterContent(chapter.id, enhancedPrompt, wordCount, style, useInternetSearch);
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
        setSelectedResearchItems([]);
        setShowResearchSelector(false);
        setSelectedPlotPoints([]);
        setShowPlotSelector(false);
        setIsLoading(false);
        setUseInternetSearch(false);
        onClose();
    }
    
    const toggleResearchSelector = () => {
        setShowResearchSelector(!showResearchSelector);
    }
    
    const toggleResearchItem = (itemId: string) => {
        setSelectedResearchItems(prev => {
            if (prev.includes(itemId)) {
                return prev.filter(id => id !== itemId);
            } else {
                return [...prev, itemId];
            }
        });
    }
    
    const togglePlotSelector = () => {
        setShowPlotSelector(!showPlotSelector);
    }
    
    const togglePlotPoint = (plotId: string) => {
        setSelectedPlotPoints(prev => {
            if (prev.includes(plotId)) {
                return prev.filter(id => id !== plotId);
            } else {
                return [...prev, plotId];
            }
        });
    }
    
    return (
        <Modal isOpen={isOpen} onClose={handleClose} title={`Generate Content for: ${chapter.title}`}>
            <form onSubmit={handleSubmit} className="space-y-4">
                 <div>
                    <label htmlFor="chapter-prompt" className="block text-sm font-medium text-gray-700 mb-1">Chapter Outline / Key Points</label>
                    <textarea
                        id="chapter-prompt"
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder={`e.g., "The protagonist discovers a hidden clue in the old book..."`}
                        rows={4}
                        className="w-full bg-white border-gray-300 rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary sm:text-sm p-2 text-gray-900 placeholder-gray-400"
                        required
                    />
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                         <label htmlFor="word-count" className="block text-sm font-medium text-gray-700 mb-1">Target Word Count (Optional)</label>
                         <input
                            type="text"
                            id="word-count"
                            value={wordCount}
                            onChange={(e) => setWordCount(e.target.value)}
                            placeholder="e.g., 1500"
                            className="w-full bg-white border-gray-300 rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary sm:text-sm p-2 text-gray-900 placeholder-gray-400"
                         />
                    </div>
                    <div className="flex items-end">
                        <label className="flex items-center space-x-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={useInternetSearch}
                                onChange={(e) => setUseInternetSearch(e.target.checked)}
                                className="w-4 h-4 text-brand-primary bg-white border-gray-300 rounded focus:ring-brand-primary"
                            />
                            <span className="text-sm text-gray-700">Use Internet Search</span>
                        </label>
                    </div>
                 </div>
                 
                 {/* Research Integration Section */}
                 <div className="border-t border-gray-300 pt-4">
                    <div className="flex items-center justify-between mb-2">
                        <label className="block text-sm font-medium text-gray-700">Reference Research (Optional)</label>
                        <Button 
                            type="button" 
                            variant="secondary" 
                            size="sm"
                            onClick={toggleResearchSelector}
                            disabled={availableResearch.length === 0}
                        >
                            <BookOpenIcon className="w-4 h-4 mr-2" />
                            {availableResearch.length === 0 ? 'No Research Available' : `Select Research (${selectedResearchItems.length})`}
                        </Button>
                    </div>
                    
                    {selectedResearch.length > 0 && (
                        <div className="mb-3">
                            <div className="text-xs text-gray-600 mb-2">Selected research items will provide context for generation:</div>
                            <div className="space-y-1 max-h-20 overflow-y-auto">
                                {selectedResearch.map(item => (
                                    <div key={item.id} className="flex items-center justify-between text-xs bg-gray-100 p-2 rounded">
                                        <span className="text-gray-700 truncate">{item.query}</span>
                                        <button 
                                            type="button"
                                            onClick={() => toggleResearchItem(item.id)}
                                            className="text-gray-600 hover:text-red-400 ml-2"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    
                    {showResearchSelector && availableResearch.length > 0 && (
                        <div className="mb-4 p-3 bg-gray-100 rounded-md border border-gray-300">
                            <div className="text-sm text-gray-700 mb-2">Choose research to reference:</div>
                            <div className="space-y-2 max-h-40 overflow-y-auto">
                                {availableResearch.map(item => (
                                    <label key={item.id} className="flex items-start space-x-2 cursor-pointer hover:bg-white p-2 rounded">
                                        <input
                                            type="checkbox"
                                            checked={selectedResearchItems.includes(item.id)}
                                            onChange={() => toggleResearchItem(item.id)}
                                            className="mt-1 rounded border-gray-300 bg-white text-brand-primary focus:ring-brand-primary"
                                        />
                                        <div className="flex-1">
                                            <div className="text-sm text-gray-800 font-medium">{item.query}</div>
                                            <div className="text-xs text-gray-600 line-clamp-2">{item.summary}</div>
                                            <div className="text-xs text-gray-500 mt-1">
                                                {item.type} • {item.confidence} confidence
                                            </div>
                                        </div>
                                    </label>
                                ))}
                            </div>
                        </div>
                    )}
                 </div>
                 
                 {/* Plot Integration Section */}
                 <div className="border-t border-gray-300 pt-4">
                    <div className="flex items-center justify-between mb-2">
                        <label className="block text-sm font-medium text-gray-700">Reference Plot Points (Optional)</label>
                        <Button 
                            type="button" 
                            variant="secondary" 
                            size="sm"
                            onClick={togglePlotSelector}
                            disabled={availablePlotPoints.length === 0}
                        >
                            <MapIcon className="w-4 h-4 mr-2" />
                            {availablePlotPoints.length === 0 ? 'No Plot Points Available' : `Select Plot Points (${selectedPlotPoints.length})`}
                        </Button>
                    </div>
                    
                    {selectedPlotPointsData.length > 0 && (
                        <div className="mb-3">
                            <div className="text-xs text-gray-600 mb-2">Selected plot points will guide the chapter narrative:</div>
                            <div className="space-y-1 max-h-20 overflow-y-auto">
                                {selectedPlotPointsData.map(point => (
                                    <div key={point.id} className="flex items-center justify-between text-xs bg-gray-100 p-2 rounded">
                                        <span className="text-gray-700 truncate">
                                            {point.order + 1}. {point.title}
                                        </span>
                                        <button 
                                            type="button"
                                            onClick={() => togglePlotPoint(point.id)}
                                            className="text-gray-600 hover:text-red-400 ml-2"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    
                    {showPlotSelector && availablePlotPoints.length > 0 && (
                        <div className="mb-4 p-3 bg-gray-100 rounded-md border border-gray-300">
                            <div className="text-sm text-gray-700 mb-2">Choose plot points to reference:</div>
                            <div className="space-y-2 max-h-40 overflow-y-auto">
                                {availablePlotPoints.map(point => (
                                    <label key={point.id} className="flex items-start space-x-2 cursor-pointer hover:bg-white p-2 rounded">
                                        <input
                                            type="checkbox"
                                            checked={selectedPlotPoints.includes(point.id)}
                                            onChange={() => togglePlotPoint(point.id)}
                                            className="mt-1 rounded border-gray-300 bg-white text-brand-primary focus:ring-brand-primary"
                                        />
                                        <div className="flex-1">
                                            <div className="text-sm text-gray-800 font-medium">
                                                {point.order + 1}. {point.title}
                                            </div>
                                            <div className="text-xs text-gray-600 line-clamp-3">{point.description}</div>
                                        </div>
                                    </label>
                                ))}
                            </div>
                        </div>
                    )}
                 </div>
                 
                 <div>
                    <label htmlFor="style-prompt" className="block text-sm font-medium text-gray-700 mb-1">Additional Instructions (Style, Tone, etc.)</label>
                    <textarea
                        id="style-prompt"
                        value={style}
                        onChange={(e) => setStyle(e.target.value)}
                        placeholder={`e.g., "Write in a fast-paced, suspenseful tone."`}
                        rows={2}
                        className="w-full bg-white border-gray-300 rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary sm:text-sm p-2 text-gray-900 placeholder-gray-400"
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