import React, { useState, useEffect, useMemo } from 'react';
import { useBookCraftStore } from '../../store/useStore';
import { Button } from '../UI';
import { SparklesIcon, ChatBubbleLeftRightIcon, BrainCircuitIcon, PhotoIcon } from '../Icons';
import { ChapterGeneratorModal } from './ChapterGeneratorModal';
import { AIAssistantModal } from './AIAssistantModal';
import { AIContextMenu } from './AIContextMenu';
import { MergeContentModal } from './MergeContentModal';
import { LexicalEditor } from './lexical/LexicalEditor';
import { Chapter, PlotPoint } from '../../types';
import { log } from '../../services/logger';


interface ChapterEditorViewProps {
    chapterId: string;
}

export const ChapterEditorView: React.FC<ChapterEditorViewProps> = ({ chapterId }) => {
    const chapter = useBookCraftStore(state => state.projects[state.activeProjectId!]?.chapters.find(c => c.id === chapterId)) as Chapter;
    // FIX: Stable plot points selection to prevent infinite loops
    const plotPoints = useBookCraftStore(state => {
        const project = state.projects[state.activeProjectId!];
        if (!project?.plotPoints) return [];
        return [...project.plotPoints].sort((a, b) => a.order - b.order);
    });
    const updateChapter = useBookCraftStore(state => state.updateChapter);
    const generateChapterStructure = useBookCraftStore(state => state.generateChapterStructure);
    const cleanupAndFormatText = useBookCraftStore(state => state.cleanupAndFormatText);
    const suggestVisualForText = useBookCraftStore(state => state.suggestVisualForText);
    const analyzeChapterForVisuals = useBookCraftStore(state => state.analyzeChapterForVisuals);
    const isAnalyzingChapter = useBookCraftStore(state => state.isAnalyzingChapter);


    const [title, setTitle] = useState(chapter?.title || '');
    const [content, setContent] = useState(chapter?.content || '');
    const [notes, setNotes] = useState(chapter?.notes || '');
    const [isGeneratorOpen, setIsGeneratorOpen] = useState(false);
    const [isAssistantOpen, setIsAssistantOpen] = useState(false);
    const [contextMenu, setContextMenu] = useState<{ x: number; y: number; text: string; range: Range } | null>(null);
    const [mergeState, setMergeState] = useState<{ original: string; generated: string } | null>(null);
    const [isGeneratingStructure, setIsGeneratingStructure] = useState(false);
    const [isCleaning, setIsCleaning] = useState(false);

    useEffect(() => {
        if (chapter) {
            setTitle(chapter.title);
            setContent(chapter.content);
            setNotes(chapter.notes || '');
        }
    }, [chapter]);


    useEffect(() => {
        const handler = setTimeout(() => {
            if (chapter && content !== chapter.content) updateChapter(chapter.id, { content });
        }, 500);
        return () => clearTimeout(handler);
    }, [content, chapter, updateChapter]);
    
    useEffect(() => {
        const handler = setTimeout(() => {
            if (chapter && notes !== chapter.notes) updateChapter(chapter.id, { notes });
        }, 500);
        return () => clearTimeout(handler);
    }, [notes, chapter, updateChapter]);

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

    if (!chapter) return <div className="p-4 text-center">Chapter not found.</div>;

    return (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 h-full">
            <div className="xl:col-span-2 bg-slate-800/50 rounded-lg border border-slate-700/50 h-full flex flex-col">
                <div className="p-4 border-b border-slate-700/50">
                    <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} onBlur={handleTitleBlur} placeholder="Chapter Title" className="w-full bg-transparent text-2xl font-bold text-slate-100 focus:outline-none focus:ring-0" />
                </div>
                <LexicalEditor
                    content={content}
                    onContentChange={setContent}
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
                    <div className="text-xs text-slate-400">
                        Words: {content.replace(/<[^>]*>/g, '').split(/\s+/).filter(w => w.length > 0).length}
                    </div>
                </div>
            </div>
            <div className="xl:col-span-1 h-full flex flex-col gap-6" style={{maxHeight: 'calc(100vh - 250px)'}}>
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
                 <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4 flex-grow flex flex-col">
                    <div className="mb-4 flex-shrink-0">
                        <h3 className="text-slate-200 font-bold mb-2">AI Tools</h3>
                        <div className="space-y-2">
                             <Button size="sm" variant="secondary" onClick={handleGenerateStructure} isLoading={isGeneratingStructure} disabled={!chapter.content.trim()} className="w-full justify-start"><BrainCircuitIcon className="w-4 h-4 mr-2" /> Chapter Structure</Button>
                             <Button size="sm" variant="secondary" onClick={() => analyzeChapterForVisuals(chapter.id)} isLoading={isAnalyzingChapter === chapter.id} disabled={!chapter.content.trim()} className="w-full justify-start"><PhotoIcon className="w-4 h-4 mr-2" /> Visual Analysis</Button>
                        </div>
                    </div>
                    <div className="overflow-y-auto text-sm text-slate-400 space-y-2 flex-grow">
                        {chapter.structure && chapter.structure.length > 0 ? (
                            chapter.structure.map((item, index) => (
                                <div key={index} className="p-2 bg-slate-700/30 rounded">
                                    <p className="font-semibold text-slate-300">{item.point}</p>
                                    <p className="text-xs">{item.details}</p>
                                </div>
                            ))
                        ) : (<p className="italic text-center pt-4">Generated structure will appear here.</p>)}
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
                        setContent(finalContent);
                    }}/>
            )}
        </div>
    );
};