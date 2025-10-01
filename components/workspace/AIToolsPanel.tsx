import React, { useState, useMemo } from 'react';
import { useBookCraftStore } from '../../store/useStore';
import { Button, Spinner } from '../UI';
import { 
    SparklesIcon, 
    ChevronDownIcon, 
    ChevronUpIcon,
    BrainCircuitIcon,
    PhotoIcon,
    MagnifyingGlassIcon,
    DocumentTextIcon,
    ChatBubbleLeftRightIcon,
    BookOpenIcon,
    ClockIcon,
    CheckIcon
} from '../Icons';

interface AIProcess {
    id: string;
    name: string;
    type: 'content' | 'visual' | 'research' | 'analysis' | 'planning';
    status: 'active' | 'completed' | 'failed';
    description: string;
    startTime: Date;
    icon: React.ReactNode;
}

export const AIToolsPanel: React.FC = () => {
    const [isExpanded, setIsExpanded] = useState(false);
    
    // Get all AI loading states from the store
    const isLoading = useBookCraftStore(state => state.isLoading);
    const generatingVisualFor = useBookCraftStore(state => state.generatingVisualFor);
    const isGeneratingImage = useBookCraftStore(state => state.isGeneratingImage);
    const isSuggestingVisual = useBookCraftStore(state => state.isSuggestingVisual);
    const isAnalyzingChapter = useBookCraftStore(state => state.isAnalyzingChapter);
    const isResearching = useBookCraftStore(state => state.isResearching);
    const isFactChecking = useBookCraftStore(state => state.isFactChecking);
    const isGeneratingCitation = useBookCraftStore(state => state.isGeneratingCitation);
    const isAnalyzingThemes = useBookCraftStore(state => state.isAnalyzingThemes);
    const isDetectingContradictions = useBookCraftStore(state => state.isDetectingContradictions);
    const isAutoSaving = useBookCraftStore(state => state.isAutoSaving);
    const activeAIProcesses = useBookCraftStore(state => state.activeAIProcesses);
    
    // Get chapter and project data for context
    const activeProjectId = useBookCraftStore(state => state.activeProjectId);
    const chapters = useBookCraftStore(state => 
        state.activeProjectId ? state.projects[state.activeProjectId]?.chapters || [] : []
    );
    
    const getChapterTitle = (chapterId: string) => {
        const chapter = chapters.find(c => c.id === chapterId);
        return chapter ? chapter.title : `Chapter ${chapterId.slice(-4)}`;
    };
    
    // Build active processes list
    const activeProcesses = useMemo((): AIProcess[] => {
        const processes: AIProcess[] = [];
        const now = new Date();
        
        if (isLoading) {
            processes.push({
                id: 'global-loading',
                name: 'AI Processing',
                type: 'analysis',
                status: 'active',
                description: 'General AI processing in progress',
                startTime: now,
                icon: <BrainCircuitIcon className="w-4 h-4" />
            });
        }
        
        if (generatingVisualFor) {
            processes.push({
                id: `visual-gen-${generatingVisualFor}`,
                name: 'Generating Visual',
                type: 'visual',
                status: 'active',
                description: `Creating diagram for recommendation`,
                startTime: now,
                icon: <PhotoIcon className="w-4 h-4" />
            });
        }
        
        if (isGeneratingImage) {
            processes.push({
                id: 'image-generation',
                name: 'AI Image Generation',
                type: 'visual',
                status: 'active',
                description: 'Creating AI-generated image',
                startTime: now,
                icon: <PhotoIcon className="w-4 h-4" />
            });
        }
        
        if (isSuggestingVisual) {
            processes.push({
                id: 'visual-suggestion',
                name: 'Visual Suggestion',
                type: 'visual',
                status: 'active',
                description: 'Analyzing text for visual recommendations',
                startTime: now,
                icon: <PhotoIcon className="w-4 h-4" />
            });
        }
        
        if (isAnalyzingChapter) {
            processes.push({
                id: `chapter-analysis-${isAnalyzingChapter}`,
                name: 'Chapter Analysis',
                type: 'analysis',
                status: 'active',
                description: `Analyzing ${getChapterTitle(isAnalyzingChapter)} for visuals`,
                startTime: now,
                icon: <BrainCircuitIcon className="w-4 h-4" />
            });
        }
        
        if (isResearching) {
            processes.push({
                id: 'research-query',
                name: 'AI Research',
                type: 'research',
                status: 'active',
                description: 'Performing research query',
                startTime: now,
                icon: <MagnifyingGlassIcon className="w-4 h-4" />
            });
        }
        
        if (isFactChecking) {
            processes.push({
                id: 'fact-checking',
                name: 'Fact Checking',
                type: 'research',
                status: 'active',
                description: 'Verifying content accuracy',
                startTime: now,
                icon: <DocumentTextIcon className="w-4 h-4" />
            });
        }
        
        if (isGeneratingCitation) {
            processes.push({
                id: 'citation-generation',
                name: 'Citation Generation',
                type: 'research',
                status: 'active',
                description: 'Formatting research citation',
                startTime: now,
                icon: <BookOpenIcon className="w-4 h-4" />
            });
        }
        
        if (isAnalyzingThemes) {
            processes.push({
                id: 'theme-analysis',
                name: 'Theme Analysis',
                type: 'analysis',
                status: 'active',
                description: 'Analyzing research themes',
                startTime: now,
                icon: <BrainCircuitIcon className="w-4 h-4" />
            });
        }
        
        if (isDetectingContradictions) {
            processes.push({
                id: 'contradiction-detection',
                name: 'Contradiction Detection',
                type: 'analysis',
                status: 'active',
                description: 'Analyzing research for contradictions',
                startTime: now,
                icon: <BrainCircuitIcon className="w-4 h-4" />
            });
        }
        
        if (isAutoSaving) {
            processes.push({
                id: 'autosave',
                name: 'Autosave',
                type: 'content',
                status: 'active',
                description: 'Saving your work automatically',
                startTime: now,
                icon: <ClockIcon className="w-4 h-4" />
            });
        }
        
        // Add modal-based processes from store
        Object.entries(activeAIProcesses).forEach(([id, process]) => {
            processes.push({
                id,
                name: process.name,
                type: process.type,
                status: 'active',
                description: process.description,
                startTime: process.startTime,
                icon: getTypeIcon(process.type)
            });
        });
        
        return processes;
    }, [
        isLoading, generatingVisualFor, isGeneratingImage, isSuggestingVisual, isAnalyzingChapter,
        isResearching, isFactChecking, isGeneratingCitation, isAnalyzingThemes, 
        isDetectingContradictions, isAutoSaving, activeAIProcesses, chapters
    ]);
    
    const getTypeColor = (type: AIProcess['type']) => {
        switch (type) {
            case 'content': return 'text-blue-400';
            case 'visual': return 'text-green-400';
            case 'research': return 'text-purple-400';
            case 'analysis': return 'text-yellow-400';
            case 'planning': return 'text-orange-400';
            default: return 'text-slate-400';
        }
    };
    
    const getTypeIcon = (type: AIProcess['type']) => {
        switch (type) {
            case 'content': return <DocumentTextIcon className="w-3 h-3" />;
            case 'visual': return <PhotoIcon className="w-3 h-3" />;
            case 'research': return <MagnifyingGlassIcon className="w-3 h-3" />;
            case 'analysis': return <BrainCircuitIcon className="w-3 h-3" />;
            case 'planning': return <SparklesIcon className="w-3 h-3" />;
            default: return <ClockIcon className="w-3 h-3" />;
        }
    };
    
    if (!activeProjectId) {
        return null; // Don't show panel if no project is active
    }
    
    return (
        <div className="fixed bottom-4 right-4 z-50">
            <div className="bg-slate-800 border border-slate-700 rounded-lg shadow-lg max-w-sm">
                {/* Header */}
                <div 
                    className="flex items-center justify-between p-3 cursor-pointer hover:bg-slate-700/50 rounded-t-lg transition-colors"
                    onClick={() => setIsExpanded(!isExpanded)}
                >
                    <div className="flex items-center gap-2">
                        <SparklesIcon className="w-5 h-5 text-blue-400" />
                        <span className="font-medium text-slate-200">AI Tools</span>
                        {activeProcesses.length > 0 && (
                            <div className="flex items-center gap-1 text-xs text-slate-400">
                                <Spinner size="sm" />
                                <span>{activeProcesses.length}</span>
                            </div>
                        )}
                    </div>
                    {isExpanded ? (
                        <ChevronDownIcon className="w-4 h-4 text-slate-400" />
                    ) : (
                        <ChevronUpIcon className="w-4 h-4 text-slate-400" />
                    )}
                </div>
                
                {/* Content */}
                {isExpanded && (
                    <div className="border-t border-slate-700">
                        {activeProcesses.length > 0 ? (
                            <div className="p-3 space-y-3 max-h-80 overflow-y-auto">
                                <div className="text-xs text-slate-400 mb-2">Active AI Processes:</div>
                                {activeProcesses.map((process) => (
                                    <div key={process.id} className="flex items-start gap-3 p-2 bg-slate-900/50 rounded-md">
                                        <div className="flex-shrink-0 mt-0.5">
                                            <div className={`${getTypeColor(process.type)} flex items-center gap-1`}>
                                                {getTypeIcon(process.type)}
                                            </div>
                                        </div>
                                        <div className="flex-grow min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium text-slate-200 text-sm truncate">
                                                    {process.name}
                                                </span>
                                                {process.status === 'active' && <Spinner size="xs" />}
                                                {process.status === 'completed' && <CheckIcon className="w-3 h-3 text-green-400" />}
                                            </div>
                                            <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                                                {process.description}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="p-4 text-center">
                                <CheckIcon className="w-8 h-8 text-green-400 mx-auto mb-2" />
                                <p className="text-sm text-slate-400">No active AI processes</p>
                                <p className="text-xs text-slate-500 mt-1">All AI tasks completed</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};