import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useBookCraftStore } from '../../store/useStore';
import { Button } from '../UI';
import { SparklesIcon, ChatBubbleLeftRightIcon, BrainCircuitIcon, PhotoIcon, BookOpenIcon, PlusIcon, BeakerIcon } from '../Icons';
import { ChapterGeneratorModal } from './ChapterGeneratorModal';
import { AIAssistantModal } from './AIAssistantModal';
import { AIContextMenu } from './AIContextMenu';
import { MergeContentModal } from './MergeContentModal';
import { LexicalEditor } from './lexical/LexicalEditor';
import { InsightsHistoryModal } from './InsightsHistoryModal';
import { SaveStatusIndicator } from '../SaveStatusIndicator';
import { GrammarCheckerPanel } from './GrammarCheckerPanel';
import { Chapter, PlotPoint } from '../../types';
import { log } from '../../services/logger';
import { toast } from '../../services/toast';


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
    const getAIAssistantResponse = useBookCraftStore(state => state.getAIAssistantResponse);


    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [notes, setNotes] = useState('');
    const [isGeneratorOpen, setIsGeneratorOpen] = useState(false);
    const [isAssistantOpen, setIsAssistantOpen] = useState(false);
    const [contextMenu, setContextMenu] = useState<{ x: number; y: number; text: string; range: Range } | null>(null);
    const [mergeState, setMergeState] = useState<{ original: string; generated: string } | null>(null);
    const [showInsightsHistory, setShowInsightsHistory] = useState(false);
    const [isGeneratingStructure, setIsGeneratingStructure] = useState(false);
    const [isCleaning, setIsCleaning] = useState(false);
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [isGeneratingSuggestions, setIsGeneratingSuggestions] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [showGrammarChecker, setShowGrammarChecker] = useState(false);
    const [appliedSuggestions, setAppliedSuggestions] = useState<Set<number>>(new Set());
    const [undoStack, setUndoStack] = useState<Array<{content: string; suggestionIndex: number}>>([]);

    useEffect(() => {
        if (chapter) {
            setTitle(chapter.title);
            setContent(chapter.content);
            setNotes(chapter.notes || '');
        }
    }, [chapter]);

    // FIX: Save content immediately when component unmounts
    // Use refs to avoid infinite loop caused by dependencies
    const contentRef = React.useRef(content);
    const notesRef = React.useRef(notes);
    const titleRef = React.useRef(title);
    const chapterRef = React.useRef(chapter);

    React.useEffect(() => {
        contentRef.current = content;
        notesRef.current = notes;
        titleRef.current = title;
        chapterRef.current = chapter;
    }, [content, notes, title, chapter]);

    useEffect(() => {
        return () => {
            // Save any pending changes when unmounting
            const currentChapter = chapterRef.current;
            const currentContent = contentRef.current;
            const currentNotes = notesRef.current;
            const currentTitle = titleRef.current;

            if (currentChapter && currentContent && currentContent !== currentChapter.content) {
                log.debug('ChapterEditorView: Saving content on unmount', { chapterId: currentChapter.id });
                updateChapter(currentChapter.id, { content: currentContent });
            }
            if (currentChapter && currentNotes && currentNotes !== currentChapter.notes) {
                log.debug('ChapterEditorView: Saving notes on unmount', { chapterId: currentChapter.id });
                updateChapter(currentChapter.id, { notes: currentNotes });
            }
            if (currentChapter && currentTitle && currentTitle !== currentChapter.title) {
                log.debug('ChapterEditorView: Saving title on unmount', { chapterId: currentChapter.id });
                updateChapter(currentChapter.id, { title: currentTitle });
            }
        };
    }, [updateChapter]); // Only depend on updateChapter, use refs for values

    // ENHANCED: Add beforeunload safety to prevent data loss on browser navigation/refresh
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            // Always try to save before potential unload using refs
            const currentChapter = chapterRef.current;
            const currentContent = contentRef.current;
            const currentNotes = notesRef.current;
            const currentTitle = titleRef.current;

            if (currentChapter) {
                if (currentContent && currentContent !== currentChapter.content) {
                    updateChapter(currentChapter.id, { content: currentContent });
                    log.info('ChapterEditorView: Emergency save on beforeunload', { chapterId: currentChapter.id });
                }
                if (currentNotes && currentNotes !== currentChapter.notes) {
                    updateChapter(currentChapter.id, { notes: currentNotes });
                }
                if (currentTitle && currentTitle !== currentChapter.title) {
                    updateChapter(currentChapter.id, { title: currentTitle });
                }

                // Show warning if there are unsaved changes
                if (currentContent !== currentChapter.content || currentNotes !== currentChapter.notes || currentTitle !== currentChapter.title) {
                    e.preventDefault();
                    e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
                    return e.returnValue;
                }
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [updateChapter]); // Only updateChapter in dependencies


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
        // Save current content for undo
        setUndoStack(prev => [...prev, { content, suggestionIndex: startOffset }]);

        setContent(prevContent => {
            const len = prevContent.length;
            // Guard invalid offsets
            if (startOffset < 0 || endOffset < 0 || startOffset > endOffset || startOffset > len) {
                log.warn('Invalid correction offsets; correction skipped', { startOffset, endOffset, len });
                // Optionally notify the user via UI (e.g., toast)
                if (window && window.toast) {
                    window.toast('Correction could not be applied due to invalid offsets.', { type: 'warning' });
                }
                return prevContent;
            }

            // Verify the substring roughly matches expected originalText (best-effort)
            const slice = prevContent.substring(startOffset, Math.min(endOffset, len));
            if (slice && originalText && !slice.includes(originalText)) {
                log.warn('Offset-text mismatch; attempting safe replace', { slicePreview: slice.slice(0, 50), originalText });
                const replaced = prevContent.replace(originalText, correctedText);
                return replaced === prevContent ? prevContent : replaced;
            }

            const newContent = prevContent.substring(0, startOffset) + correctedText + prevContent.substring(Math.min(endOffset, len));
            log.debug('Grammar correction applied', { originalText, correctedText, startOffset, endOffset });
            return newContent;
        });
        // Force update the chapter content immediately
        if (chapter) {
            updateChapter(chapter.id, { content });
        }
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
            // Get project context for more intelligent suggestions
            const project = activeProjectId ? projects[activeProjectId] : null;
            const plainText = content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
            const wordCount = plainText.split(/\s+/).filter(w => w.length > 0).length;
            
            // Build context-aware prompt with project details
            let contextInfo = '';
            
            if (project) {
                contextInfo += `\n\nPROJECT CONTEXT:\n`;
                contextInfo += `- Book Title: "${project.title}"\n`;
                contextInfo += `- Genre: ${project.genre}\n`;
                
                // Add plot point context if available
                if (plotPoints && plotPoints.length > 0) {
                    const plotContext = plotPoints.slice(0, 3).map(p => `  • ${p.title}: ${p.description}`).join('\n');
                    contextInfo += `- Key Plot Points:\n${plotContext}\n`;
                }
                
                // Add research context if available
                if (researchItems && researchItems.length > 0) {
                    const researchContext = researchItems.slice(0, 2).map(r => `  • ${r.query}`).join('\n');
                    contextInfo += `- Related Research:\n${researchContext}\n`;
                }
                
                // Add chapter position context
                const chapterIndex = project.chapters.findIndex(c => c.id === chapterId);
                const totalChapters = project.chapters.length;
                if (chapterIndex !== -1) {
                    const position = chapterIndex === 0 ? 'opening' : 
                                   chapterIndex === totalChapters - 1 ? 'closing' : 
                                   chapterIndex < totalChapters / 3 ? 'early' :
                                   chapterIndex > (totalChapters * 2) / 3 ? 'late' : 'middle';
                    contextInfo += `- Chapter Position: Chapter ${chapterIndex + 1} of ${totalChapters} (${position} stage)\n`;
                }
            }
            
            const prompt = `You are a professional editor providing detailed, actionable feedback on a chapter.

CHAPTER DETAILS:
- Title: "${chapter.title}"
- Word Count: ${wordCount} words${contextInfo}

CHAPTER CONTENT (first 1500 words):
---
${plainText.substring(0, 1500)}${plainText.length > 1500 ? '\n... [content continues]' : ''}
---

Provide 5-7 specific, actionable suggestions for improving this chapter. Consider:

1. **Pacing & Structure**: Does the chapter flow well? Are scenes balanced?
2. **Character Development**: Are characters authentic and evolving?
3. **Dialogue**: Is it natural, purposeful, and revealing?
4. **Description & Atmosphere**: Is the setting vivid without being overdone?
5. **Plot Progression**: Does the chapter advance the story meaningfully?
6. **Genre Conventions**: Does it meet ${project?.genre || 'the genre'} reader expectations?
7. **Opening & Closing**: Strong hooks and transitions?
8. **Show vs Tell**: Balance of action/dialogue vs exposition?

For each suggestion:
- Be specific about what needs improvement
- Explain WHY it matters for the story
- Provide concrete examples or techniques

Format your response as a numbered list:
1. [Category]: [Specific suggestion with reasoning and example]

Provide 5-7 suggestions, prioritizing the most impactful improvements.`;
            
            log.debug('Generating enhanced suggestions', { 
                chapterTitle: chapter.title,
                wordCount,
                hasPlotContext: plotPoints.length > 0,
                hasResearchContext: researchItems.length > 0
            });
            
            const response = await getAIAssistantResponse(chapter.id, prompt);
            const suggestionLines = response.split('\n').filter(line => line.match(/^\d+\./)).slice(0, 7);
            
            if (suggestionLines.length === 0) {
                // Fallback: split by double newlines or sentences if numbered format fails
                const fallbackSuggestions = response
                    .split(/\n\n+/)
                    .filter(s => s.trim().length > 20)
                    .map((s, i) => `${i + 1}. ${s.trim()}`)
                    .slice(0, 7);
                setSuggestions(fallbackSuggestions.length > 0 ? fallbackSuggestions : ['Unable to generate suggestions. Please try again.']);
            } else {
                setSuggestions(suggestionLines);
            }
            
            setShowSuggestions(true);
            log.info('Suggestions generated successfully', { count: suggestionLines.length });
        } catch (error) {
            log.error('Failed to generate chapter suggestions', error as Error, 'ChapterEditorView');
            alert("Sorry, there was an error generating suggestions. Please check your AI configuration.");
        } finally {
            setIsGeneratingSuggestions(false);
        }
    };

    const handleApplySuggestion = (suggestionText: string, index: number) => {
        // Save current content for undo
        setUndoStack(prev => [...prev, { content, suggestionIndex: index }]);
        
        // Extract the actual suggestion text (remove the number prefix)
        const cleanSuggestion = suggestionText.replace(/^\d+\.\s*/, '');
        
        // Add suggestion as a note/comment at the end of the content
        const separator = content.trim().length > 0 ? '<p><br></p>' : '';
        const formattedSuggestion = `<p><em><strong>AI Suggestion:</strong> ${cleanSuggestion}</em></p>`;
        setContent(content + separator + formattedSuggestion);
        
        // Mark as applied
        setAppliedSuggestions(prev => new Set(prev).add(index));
        
        log.debug('Applied suggestion', { index, suggestion: cleanSuggestion });
    };

    const handleUndoLastSuggestion = () => {
        if (undoStack.length === 0) return;
        
        const lastUndo = undoStack[undoStack.length - 1];
        setContent(lastUndo.content);
        
        // Remove from applied set
        setAppliedSuggestions(prev => {
            const newSet = new Set(prev);
            newSet.delete(lastUndo.suggestionIndex);
            return newSet;
        });
        
        // Remove from undo stack
        setUndoStack(prev => prev.slice(0, -1));
        
        log.debug('Undid last suggestion', { suggestionIndex: lastUndo.suggestionIndex });
    };

    if (!chapter) return <div className="p-4 text-center">Chapter not found.</div>;

    return (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 h-full">
            <div className="xl:col-span-2 bg-gray-100/50 rounded-lg border border-gray-300/50 h-full flex flex-col">
                <div className="p-4 border-b border-gray-300/50">
                    <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} onBlur={handleTitleBlur} placeholder="Chapter Title" className="w-full bg-transparent text-2xl font-bold text-gray-900 focus:outline-none focus:ring-0" />
                </div>
                <LexicalEditor
                    content={content}
                    onContentChange={(newContent) => {
                        log.debug('ChapterEditorView: Content changed from editor', { preview: newContent.substring(0, 100) });
                        setContent(newContent);
                    }}
                    onContextMenu={handleContextMenu}
                    placeholder="Start writing your chapter..."
                    className="flex-grow"
                />
                <div className="p-3 bg-white/50 border-t border-gray-300/50 flex items-center justify-between space-x-3 rounded-b-lg flex-wrap">
                    <div className="flex items-center space-x-2">
                        <Button
                            variant="primary"
                            size="sm"
                            onClick={() => {
                                if (chapter) {
                                    updateChapter(chapter.id, { content, title, notes });
                                    toast.success('Chapter saved successfully');
                                    log.info('Manual save triggered', { chapterId: chapter.id });
                                }
                            }}
                        >
                            💾 Save
                        </Button>
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
                    <div className="flex items-center gap-4 text-xs text-gray-700">
                        <span>Words: {content.replace(/<[^>]*>/g, '').split(/\s+/).filter(w => w.length > 0).length}</span>
                        <SaveStatusIndicator />
                    </div>
                </div>
            </div>
            <div className="xl:col-span-1 h-full flex flex-col gap-4" style={{maxHeight: 'calc(100vh - 250px)'}}>
                {/* Grammar Checker Panel */}
                {showGrammarChecker ? (
                    <GrammarCheckerPanel
                        text={content}
                        onTextCorrection={handleTextCorrection}
                        className="h-1/2"
                    />
                ) : (
                    <div className="bg-gray-100/50 border border-gray-300/50 rounded-lg p-4 flex-grow flex flex-col">
                        <h3 className="text-gray-800 font-bold mb-2 flex-shrink-0">Research</h3>
                    <div className="overflow-y-auto text-sm text-gray-600 space-y-2 flex-grow">
                        {researchItems.length > 0 ? (
                            researchItems.map((item) => (
                                <div key={item.id} className="p-2 bg-white/30 rounded group">
                                    <p className="font-semibold text-gray-700 text-xs mb-1">{item.query}</p>
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
                <div className="bg-gray-100/50 border border-gray-300/50 rounded-lg p-4 flex-grow flex flex-col">
                    <h3 className="text-gray-800 font-bold mb-2 flex-shrink-0">Plot Points</h3>
                    <div className="overflow-y-auto text-sm text-gray-600 space-y-2 flex-grow">
                        {plotPoints.length > 0 ? (
                            plotPoints.map((item) => (
                                <div key={item.id} className="p-2 bg-white/30 rounded">
                                    <p className="font-semibold text-gray-700">{item.title}</p>
                                    <p className="text-xs">{item.description}</p>
                                </div>
                            ))
                        ) : (<p className="italic text-center pt-4">Use the 'Plot' tab to build your story structure.</p>)}
                    </div>
                </div>
                )}
                 <div className="bg-gray-100/50 border border-gray-300/50 rounded-lg p-4 flex-grow flex flex-col">
                    <div className="mb-4 flex-shrink-0">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-gray-800 font-bold">AI Tools</h3>
                            <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => setShowInsightsHistory(true)}
                                disabled={!chapter.insightHistory || chapter.insightHistory.length === 0}
                                title="View insights history"
                            >
                                📜 History ({chapter.insightHistory?.length || 0})
                            </Button>
                        </div>
                        <div className="space-y-2">
                             <Button size="sm" variant={showGrammarChecker ? "primary" : "secondary"} onClick={() => setShowGrammarChecker(!showGrammarChecker)} className="w-full justify-start"><BeakerIcon className="w-4 h-4 mr-2" /> Grammar Check</Button>
                             <Button size="sm" variant="secondary" onClick={handleGenerateStructure} isLoading={isGeneratingStructure} disabled={!chapter.content.trim()} className="w-full justify-start"><BrainCircuitIcon className="w-4 h-4 mr-2" /> Chapter Structure</Button>
                             <Button size="sm" variant="secondary" onClick={() => analyzeChapterForVisuals(chapter.id)} isLoading={isAnalyzingChapter === chapter.id} disabled={!chapter.content.trim()} className="w-full justify-start"><PhotoIcon className="w-4 h-4 mr-2" /> Visual Analysis</Button>
                             <Button size="sm" variant="secondary" onClick={handleGenerateSuggestions} isLoading={isGeneratingSuggestions} disabled={!chapter.content.trim()} className="w-full justify-start"><SparklesIcon className="w-4 h-4 mr-2" /> Get Suggestions</Button>
                        </div>
                    </div>
                    <div className="overflow-y-auto text-sm text-gray-600 space-y-2 flex-grow">
                        {showSuggestions && suggestions.length > 0 ? (
                            <>
                                <div className="flex items-center justify-between mb-2">
                                    <h4 className="text-gray-700 font-semibold text-xs">Chapter Suggestions:</h4>
                                    {undoStack.length > 0 && (
                                        <Button 
                                            size="sm" 
                                            variant="secondary" 
                                            onClick={handleUndoLastSuggestion}
                                            className="text-xs py-1 px-2"
                                        >
                                            Undo Last
                                        </Button>
                                    )}
                                </div>
                                {suggestions.map((suggestion, index) => (
                                    <div key={index} className="p-2 bg-white/30 rounded mb-2 group">
                                        <p className="text-xs text-gray-700 mb-2">{suggestion}</p>
                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button 
                                                size="sm" 
                                                variant={appliedSuggestions.has(index) ? "success" : "primary"}
                                                onClick={() => handleApplySuggestion(suggestion, index)}
                                                disabled={appliedSuggestions.has(index)}
                                                className="text-xs py-1 px-2"
                                            >
                                                {appliedSuggestions.has(index) ? '✓ Applied' : 'Apply'}
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </>
                        ) : chapter.structure && chapter.structure.length > 0 ? (
                            <>
                                <h4 className="text-gray-700 font-semibold text-xs mb-2">Chapter Structure:</h4>
                                {chapter.structure.map((item, index) => (
                                    <div key={index} className="p-2 bg-white/30 rounded">
                                        <p className="font-semibold text-gray-700">{item.point}</p>
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
            <InsightsHistoryModal
                isOpen={showInsightsHistory}
                onClose={() => setShowInsightsHistory(false)}
                insights={chapter.insightHistory || []}
                onRestoreInsight={(insight) => {
                    if (insight.type === 'structure' && Array.isArray(insight.data)) {
                        updateChapter(chapter.id, { structure: insight.data });
                        toast.success('Structure restored from history');
                    }
                    setShowInsightsHistory(false);
                }}
            />
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
                        log.debug('ChapterEditorView: Applying content from MergeContentModal', { preview: finalContent.substring(0, 100) });
                        setContent(finalContent);
                    }}/>
            )}
        </div>
    );
};