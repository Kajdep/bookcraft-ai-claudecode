import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useBookCraftStore } from '../../store/useStore';
import { Button } from '../UI';
import { SparklesIcon, ChatBubbleLeftRightIcon, BrainCircuitIcon, PhotoIcon, BookOpenIcon, PlusIcon, BeakerIcon } from '../Icons';
import { ChapterGeneratorModal } from './ChapterGeneratorModal';
import { AIAssistantModal } from './AIAssistantModal';
import { AIContextMenu } from './AIContextMenu';
import { MergeContentModal } from './MergeContentModal';
import { LexicalEditor } from './lexical/LexicalEditor';
import { SaveStatusIndicator } from '../SaveStatusIndicator';
import { GrammarCheckerPanel } from './GrammarCheckerPanel';
import { Chapter, PlotPoint } from '../../types';
import { log } from '../../services/logger';


interface ChapterEditorViewProps {
    chapterId: string;
}

export const ChapterEditorView: React.FC<ChapterEditorViewProps> = ({ chapterId }) => {
    // FIX: Use stable individual selectors
    const activeProjectId = useBookCraftStore(state => state.activeProjectId);
    const projects = useBookCraftStore(state => state.projects);
    const updateChapter = useBookCraftStore(state => state.updateChapter);

    // FIX: Derive data using useMemo with stable dependencies
    const { chapter, plotPoints, researchItems } = useMemo(() => {
        if (!activeProjectId) return { chapter: null, plotPoints: [], researchItems: [] };

        const project = projects[activeProjectId];
        if (!project) return { chapter: null, plotPoints: [], researchItems: [] };

        const foundChapter = project.chapters.find(c => c.id === chapterId) as Chapter;
        const sortedPlotPoints = project.plotPoints ? [...project.plotPoints].sort((a, b) => a.order - b.order) : [];
        const relevantResearch = project.research ? project.research.filter(item => 
            item.linkedChapterIds.includes(chapterId) || item.linkedChapterIds.length === 0
        ) : [];

        return {
            chapter: foundChapter,
            plotPoints: sortedPlotPoints,
            researchItems: relevantResearch
        };
    }, [activeProjectId, projects, chapterId]);
    const generateChapterStructure = useBookCraftStore(state => state.generateChapterStructure);
    const cleanupAndFormatText = useBookCraftStore(state => state.cleanupAndFormatText);
    const suggestVisualForText = useBookCraftStore(state => state.suggestVisualForText);
    const analyzeChapterForVisuals = useBookCraftStore(state => state.analyzeChapterForVisuals);
    const isAnalyzingChapter = useBookCraftStore(state => state.isAnalyzingChapter);


    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [notes, setNotes] = useState('');
    const [isGeneratorOpen, setIsGeneratorOpen] = useState(false);
    const [isAssistantOpen, setIsAssistantOpen] = useState(false);
    const [contextMenu, setContextMenu] = useState<{ x: number; y: number; text: string; range: Range } | null>(null);
    const [mergeState, setMergeState] = useState<{ original: string; generated: string } | null>(null);
    const [isGeneratingStructure, setIsGeneratingStructure] = useState(false);
    const [isCleaning, setIsCleaning] = useState(false);
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [isGeneratingSuggestions, setIsGeneratingSuggestions] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [showGrammarChecker, setShowGrammarChecker] = useState(false);

    useEffect(() => {
        if (chapter) {
            setTitle(chapter.title);
            setContent(chapter.content);
            setNotes(chapter.notes || '');
        }
    }, [chapter]);


    // FIX: Stable content saving with memoized comparison
    const chapterContent = chapter?.content || '';
    const chapterNotes = chapter?.notes || '';

    useEffect(() => {
        if (!chapter) return;

        const handler = setTimeout(() => {
            if (content !== chapterContent) {
                updateChapter(chapter.id, { content });
            }
        }, 500);
        return () => clearTimeout(handler);
    }, [content, chapterContent, chapter?.id, updateChapter]);

    useEffect(() => {
        if (!chapter) return;

        const handler = setTimeout(() => {
            if (notes !== chapterNotes) {
                updateChapter(chapter.id, { notes });
            }
        }, 500);
        return () => clearTimeout(handler);
    }, [notes, chapterNotes, chapter?.id, updateChapter]);

    const handleTitleBlur = () => {
        if (chapter && title !== chapter.title) updateChapter(chapter.id, { title });
    };

    const handleContextMenu = (e: React.MouseEvent) => {
        const selection = window.getSelection();
        const selectedText = selection?.toString().trim();
        if (selection && selectedText && selectedText.length > 10) {
            e.preventDefault();
            const range = selection.getRangeAt(0).cloneRange();
            setContextMenu({ x: e.clientX, y: e.clientY, text: selectedText, range });
        }
    };

    const handleApplyFromContextMenu = (newText: string) => {
        if (contextMenu) {
            // For Lexical editor, we'll handle this through the editor's update mechanism
            // The text replacement will be handled by the AI context menu component
            setContent(prevContent => {
                return prevContent.replace(contextMenu.text, newText);
            });
        }
        setContextMenu(null);
    };

    const handleTextCorrection = (originalText: string, correctedText: string, startOffset: number, endOffset: number) => {
        setContent(prevContent => {
            // Simple text replacement - in a production app, you'd want more sophisticated handling
            return prevContent.replace(originalText, correctedText);
        });
    };

    const handleGenerateStructure = async () => {
        setIsGeneratingStructure(true);
        try {
            await generateChapterStructure(chapter.id);
        } catch (error) {
            log.error('Failed to generate chapter structure', error as Error, 'ChapterEditorView');
            alert("Failed to generate chapter structure.");
        } finally {
            setIsGeneratingStructure(false);
        }
    };

    const handleCleanAndFormat = async () => {
        if (!content.trim()) return;
        setIsCleaning(true);
        try {
            const cleanedContent = await cleanupAndFormatText(content);
            setContent(cleanedContent);
        } catch (error) {
            log.error('Failed to clean and format content', error as Error, 'ChapterEditorView');
            alert("Sorry, there was an error cleaning up the content.");
        } finally {
            setIsCleaning(false);
        }
    };

    const handleInsertResearch = (researchItem: any) => {
        // Format research content for insertion
        const formattedResearch = `<p><strong>Research Note:</strong> ${researchItem.summary}</p><p>${researchItem.content.substring(0, 300)}${researchItem.content.length > 300 ? '...' : ''}</p>`;
        
        // Insert at the end of current content
        const separator = content.trim().length > 0 ? '<p><br></p>' : '';
        setContent(content + separator + formattedResearch);
    };

    const handleBlendResearch = (researchItem: any) => {
        // Set up merge state to blend research with existing content
        const formattedResearch = `<p><em>Based on research:</em> ${researchItem.summary}</p><p>${researchItem.content.substring(0, 500)}${researchItem.content.length > 500 ? '...' : ''}</p>`;
        setMergeState({ original: content, generated: formattedResearch });
    };

    const handleGenerateSuggestions = async () => {
        if (!chapter.content.trim()) return;
        setIsGeneratingSuggestions(true);
        try {
            // Create a context-aware prompt for suggestions
            const plainText = content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
            const prompt = `Analyze this chapter content and provide 5 specific, actionable suggestions for improvement. Consider pacing, character development, dialogue, description, plot progression, and structure. 

Chapter: "${chapter.title}"
Content: ${plainText.substring(0, 1000)}${plainText.length > 1000 ? '...' : ''}

Provide suggestions in this format:
1. [Suggestion type]: [Specific actionable advice]

Focus on concrete improvements the author can implement.`;
            
            const response = await getAIAssistantResponse(chapter.id, prompt);
            const suggestionLines = response.split('\n').filter(line => line.match(/^\d+\./)).slice(0, 5);
            setSuggestions(suggestionLines);
            setShowSuggestions(true);
        } catch (error) {
            log.error('Failed to generate chapter suggestions', error as Error, 'ChapterEditorView');
            alert("Sorry, there was an error generating suggestions.");
        } finally {
            setIsGeneratingSuggestions(false);
        }
    };

    if (!chapter) return <div className="p-4 text-center">Chapter not found.</div>;

    return (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 h-full">
            <div className="xl:col-span-2 bg-slate-800/50 rounded-lg border border-slate-700/50 h-full flex flex-col">
                <div className="p-4 border-b border-slate-700/50">
                    <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} onBlur={handleTitleBlur} placeholder="Chapter Title" className="w-full bg-transparent text-2xl font-bold text-slate-100 focus:outline-none focus:ring-0" />
                </div>
                <LexicalEditor
                    content={content}
                    onContentChange={(newContent) => {
                        console.log('ChapterEditorView: Content changed from editor:', newContent.substring(0, 100));
                        setContent(newContent);
                    }}
                    onContextMenu={handleContextMenu}
                    placeholder="Start writing your chapter..."
                    className="flex-grow"
                />
                <div className="p-3 bg-slate-900/50 border-t border-slate-700/50 flex items-center justify-between space-x-3 rounded-b-lg flex-wrap">
                    <div className="flex items-center space-x-2">
                        <Button variant="secondary" size="sm" onClick={handleCleanAndFormat} isLoading={isCleaning}>
                            <SparklesIcon className="w-4 h-4 mr-1" />
                            Clean & Format
                        </Button>
                        <Button variant="secondary" size="sm" onClick={() => setIsGeneratorOpen(true)}>
                            <SparklesIcon className="w-4 h-4 mr-1" />
                            Generate
                        </Button>
                        <Button variant="secondary" size="sm" onClick={() => setIsAssistantOpen(true)}>
                            <ChatBubbleLeftRightIcon className="w-4 h-4 mr-1" />
                            Assistant
                        </Button>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-slate-400">
                        <span>Words: {content.replace(/<[^>]*>/g, '').split(/\s+/).filter(w => w.length > 0).length}</span>
                        <SaveStatusIndicator />
                    </div>
                </div>
            </div>
            <div className="xl:col-span-1 h-full flex flex-col gap-4" style={{maxHeight: 'calc(100vh - 250px)'}}>
                {/* Grammar Checker Panel */}
                {showGrammarChecker ? (
                    <GrammarCheckerPanel 
                        text={content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()}
                        onTextCorrection={handleTextCorrection}
                        className="h-1/2"
                    />
                ) : (
                    <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4 flex-grow flex flex-col">
                        <h3 className="text-slate-200 font-bold mb-2 flex-shrink-0">Research</h3>
                    <div className="overflow-y-auto text-sm text-slate-400 space-y-2 flex-grow">
                        {researchItems.length > 0 ? (
                            researchItems.map((item) => (
                                <div key={item.id} className="p-2 bg-slate-700/30 rounded group">
                                    <p className="font-semibold text-slate-300 text-xs mb-1">{item.query}</p>
                                    <p className="text-xs mb-2 line-clamp-2">{item.summary}</p>
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button size="xs" variant="secondary" onClick={() => handleInsertResearch(item)} className="text-xs py-1 px-2">
                                            <PlusIcon className="w-3 h-3 mr-1" />Insert
                                        </Button>
                                        <Button size="xs" variant="secondary" onClick={() => handleBlendResearch(item)} className="text-xs py-1 px-2">
                                            <SparklesIcon className="w-3 h-3 mr-1" />Blend
                                        </Button>
                                    </div>
                                </div>
                            ))
                        ) : (<p className="italic text-center pt-4">Use the 'Research' tab to add research notes.</p>)}
                    </div>
                </div>
                )}
                {!showGrammarChecker && (
                <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4 flex-grow flex flex-col">
                    <h3 className="text-slate-200 font-bold mb-2 flex-shrink-0">Plot Points</h3>
                    <div className="overflow-y-auto text-sm text-slate-400 space-y-2 flex-grow">
                        {plotPoints.length > 0 ? (
                            plotPoints.map((item) => (
                                <div key={item.id} className="p-2 bg-slate-700/30 rounded">
                                    <p className="font-semibold text-slate-300">{item.title}</p>
                                    <p className="text-xs">{item.description}</p>
                                </div>
                            ))
                        ) : (<p className="italic text-center pt-4">Use the 'Plot' tab to build your story structure.</p>)}
                    </div>
                </div>
                )}
                 <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4 flex-grow flex flex-col">
                    <div className="mb-4 flex-shrink-0">
                        <h3 className="text-slate-200 font-bold mb-2">AI Tools</h3>
                        <div className="space-y-2">
                             <Button size="sm" variant={showGrammarChecker ? "primary" : "secondary"} onClick={() => setShowGrammarChecker(!showGrammarChecker)} className="w-full justify-start"><BeakerIcon className="w-4 h-4 mr-2" /> Grammar Check</Button>
                             <Button size="sm" variant="secondary" onClick={handleGenerateStructure} isLoading={isGeneratingStructure} disabled={!chapter.content.trim()} className="w-full justify-start"><BrainCircuitIcon className="w-4 h-4 mr-2" /> Chapter Structure</Button>
                             <Button size="sm" variant="secondary" onClick={() => analyzeChapterForVisuals(chapter.id)} isLoading={isAnalyzingChapter === chapter.id} disabled={!chapter.content.trim()} className="w-full justify-start"><PhotoIcon className="w-4 h-4 mr-2" /> Visual Analysis</Button>
                             <Button size="sm" variant="secondary" onClick={handleGenerateSuggestions} isLoading={isGeneratingSuggestions} disabled={!chapter.content.trim()} className="w-full justify-start"><SparklesIcon className="w-4 h-4 mr-2" /> Get Suggestions</Button>
                        </div>
                    </div>
                    <div className="overflow-y-auto text-sm text-slate-400 space-y-2 flex-grow">
                        {showSuggestions && suggestions.length > 0 ? (
                            <>
                                <h4 className="text-slate-300 font-semibold text-xs mb-2">Chapter Suggestions:</h4>
                                {suggestions.map((suggestion, index) => (
                                    <div key={index} className="p-2 bg-slate-700/30 rounded">
                                        <p className="text-xs text-slate-300">{suggestion}</p>
                                    </div>
                                ))}
                            </>
                        ) : chapter.structure && chapter.structure.length > 0 ? (
                            <>
                                <h4 className="text-slate-300 font-semibold text-xs mb-2">Chapter Structure:</h4>
                                {chapter.structure.map((item, index) => (
                                    <div key={index} className="p-2 bg-slate-700/30 rounded">
                                        <p className="font-semibold text-slate-300">{item.point}</p>
                                        <p className="text-xs">{item.details}</p>
                                    </div>
                                ))}
                            </>
                        ) : (<p className="italic text-center pt-4">AI analysis results will appear here.</p>)}
                    </div>
                </div>
            </div>

            <ChapterGeneratorModal isOpen={isGeneratorOpen} onClose={() => setIsGeneratorOpen(false)} chapter={chapter} onGenerated={(generated) => setMergeState({ original: content, generated })} />
            <AIAssistantModal isOpen={isAssistantOpen} onClose={() => setIsAssistantOpen(false)} chapter={chapter} onGenerated={(generated) => setMergeState({ original: content, generated })} />
            {contextMenu && (
                <AIContextMenu 
                    x={contextMenu.x} 
                    y={contextMenu.y} 
                    selectedText={contextMenu.text} 
                    onClose={() => setContextMenu(null)} 
                    onApply={handleApplyFromContextMenu}
                    onSuggestVisual={() => suggestVisualForText(contextMenu.text)}
                />
            )}
            {mergeState && (
                <MergeContentModal isOpen={!!mergeState} onClose={() => setMergeState(null)} originalContent={mergeState.original} generatedContent={mergeState.generated} onApply={(finalContent) => {
                        console.log('ChapterEditorView: Applying content from MergeContentModal:', finalContent.substring(0, 100));
                        setContent(finalContent);
                    }}/>
            )}
        </div>
    );
};