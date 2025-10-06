import React, { useEffect, useMemo, useState } from 'react';
import { useBookCraftStore } from '../../store/useStore';
import { ChapterKanbanView } from './ChapterKanbanView';
import { ChapterListView } from './ChapterListView';
// FIX: Corrected import path for ChapterEditorView.
import { ChapterEditorView } from './ChapterEditorView';
import { Button } from '../UI';
import { Bars3Icon, MapIcon, SparklesIcon, ArrowLeftIcon, MagnifyingGlassIcon, DocumentTextIcon } from '../Icons';
import { ProjectPlannerModal } from './ProjectPlannerModal';
import { ResearchSidebar } from './ResearchSidebar';
import { AIToolsPanel } from './AIToolsPanel';
import { ErrorBoundary } from '../ErrorBoundary';
import { WritingTemplatesModal } from './WritingTemplatesModal';

type ViewMode = 'list' | 'kanban';

export const WritingDesk: React.FC = () => {
    const [viewMode, setViewMode] = useState<ViewMode>('list');
    const chapters = useBookCraftStore(state => state.projects[state.activeProjectId!]?.chapters || []);
    const storedActiveChapterId = useBookCraftStore(state => state.activeChapterId);
    const setActiveChapter = useBookCraftStore(state => state.setActiveChapter);
    const clearActiveChapter = useBookCraftStore(state => state.clearActiveChapter);
    const [isPlannerOpen, setIsPlannerOpen] = useState(false);
    const [isResearchOpen, setIsResearchOpen] = useState(false);
    const [isTemplatesOpen, setIsTemplatesOpen] = useState(false);

    // FIX: Refactored active chapter logic to be more declarative and robust.
    // This solves the bug where the editor wouldn't appear after generating chapters.
    const sortedChapters = useMemo(() => [...chapters].sort((a, b) => a.order - b.order), [chapters]);

    const activeChapterId = useMemo(() => {
        if (storedActiveChapterId && sortedChapters.some(c => c.id === storedActiveChapterId)) {
            return storedActiveChapterId;
        }
        if (sortedChapters.length > 0) {
            return sortedChapters[0].id;
        }
        return null;
    }, [sortedChapters, storedActiveChapterId]);

    useEffect(() => {
        if (activeChapterId && activeChapterId !== storedActiveChapterId) {
            setActiveChapter(activeChapterId);
        }
        if (!activeChapterId && storedActiveChapterId) {
            clearActiveChapter();
        }
    }, [activeChapterId, storedActiveChapterId, setActiveChapter, clearActiveChapter]);

    const handleChapterSelect = (id: string) => {
        setActiveChapter(id);
    };

    const ViewToggle: React.FC = () => (
        <div className="flex items-center gap-2 p-1 bg-gray-100/50 rounded-lg border border-gray-300/50">
            <Button
                variant={'secondary'}
                size="sm"
                onClick={() => setViewMode('list')}
                className={`!shadow-none ${viewMode === 'list' ? 'bg-gray-200' : 'bg-transparent hover:bg-white'}`}
            >
                <Bars3Icon className="w-5 h-5" />
                <span className="ml-2 hidden sm:inline">List</span>
            </Button>
            <Button
                variant={'secondary'}
                size="sm"
                onClick={() => setViewMode('kanban')}
                className={`!shadow-none ${viewMode === 'kanban' ? 'bg-gray-200' : 'bg-transparent hover:bg-white'}`}
            >
                <MapIcon className="w-5 h-5" />
                <span className="ml-2 hidden sm:inline">Kanban</span>
            </Button>
        </div>
    );
    
    if (viewMode === 'kanban') {
         return (
            <div className={`${isResearchOpen ? 'pr-80' : ''} transition-all duration-300`}>
                <div className="flex justify-between items-center mb-6">
                    <ViewToggle />
                    <div className="flex gap-3">
                        <Button
                            variant={isResearchOpen ? "secondary" : "primary"}
                            onClick={() => setIsResearchOpen(!isResearchOpen)}
                        >
                            <MagnifyingGlassIcon className="w-5 h-5 mr-2"/>
                            Research
                        </Button>
                        <Button onClick={() => setIsPlannerOpen(true)}>
                            <SparklesIcon className="w-5 h-5 mr-2"/>
                            AI Project Planner
                        </Button>
                        <Button onClick={() => setIsTemplatesOpen(true)} variant="outline">
                            <DocumentTextIcon className="w-5 h-5 mr-2"/>
                            Writing Templates
                        </Button>
                    </div>
                </div>
                <ChapterKanbanView onChapterSelect={(id) => {
                    setActiveChapter(id);
                    setViewMode('list');
                }} />

                <ResearchSidebar
                    isOpen={isResearchOpen}
                    onClose={() => setIsResearchOpen(false)}
                    chapterId={activeChapterId || undefined}
                />
                 <ProjectPlannerModal
                    isOpen={isPlannerOpen}
                    onClose={() => setIsPlannerOpen(false)}
                />
                <WritingTemplatesModal 
                    isOpen={isTemplatesOpen}
                    onClose={() => setIsTemplatesOpen(false)}
                />
                <AIToolsPanel />
            </div>
        );
    }
    
    // Default to 'list' view which shows editor and list
    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <ViewToggle />
                <div className="flex gap-3">
                    <Button
                        variant={isResearchOpen ? "secondary" : "primary"}
                        onClick={() => setIsResearchOpen(!isResearchOpen)}
                    >
                        <MagnifyingGlassIcon className="w-5 h-5 mr-2"/>
                        Research
                    </Button>
                    <Button onClick={() => setIsPlannerOpen(true)}>
                        <SparklesIcon className="w-5 h-5 mr-2"/>
                        AI Project Planner
                    </Button>
                    <Button onClick={() => setIsTemplatesOpen(true)} variant="secondary">
                        <DocumentTextIcon className="w-5 h-5 mr-2"/>
                        Writing Templates
                    </Button>
                </div>
            </div>
            <div className={`grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-230px)] ${isResearchOpen ? 'pr-80' : ''} transition-all duration-300`}>
                <aside className="lg:col-span-4 xl:col-span-3 h-full">
                    <ChapterListView
                        activeChapterId={activeChapterId}
                        onChapterSelect={handleChapterSelect}
                    />
                </aside>
                <main className="lg:col-span-8 xl:col-span-9 h-full">
                    {activeChapterId ? (
                        <ErrorBoundary fallback={
                            <div className="h-full flex flex-col items-center justify-center text-center p-6 bg-gray-100/50 rounded-lg border border-gray-300/50">
                                <h3 className="text-xl font-semibold text-gray-700 mb-2">Editor Error</h3>
                                <p className="text-gray-600 mb-4">The chapter editor encountered an issue. Try refreshing the page.</p>
                                <Button onClick={() => window.location.reload()}>Refresh</Button>
                            </div>
                        }>
                            <ChapterEditorView chapterId={activeChapterId} />
                        </ErrorBoundary>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-center p-6 bg-gray-100/50 rounded-lg border border-gray-300/50">
                            <ArrowLeftIcon className="mx-auto h-12 w-12 text-slate-600" />
                            <h3 className="mt-4 text-xl font-semibold text-gray-700">Select a Chapter</h3>
                            <p className="mt-2 text-gray-600">Choose a chapter from the list to start editing.</p>
                        </div>
                    )}
                </main>
            </div>

            <ResearchSidebar
                isOpen={isResearchOpen}
                onClose={() => setIsResearchOpen(false)}
                chapterId={activeChapterId || undefined}
            />
            <ProjectPlannerModal 
                isOpen={isPlannerOpen}
                onClose={() => setIsPlannerOpen(false)}
            />
            <WritingTemplatesModal 
                isOpen={isTemplatesOpen}
                onClose={() => setIsTemplatesOpen(false)}
            />
            <AIToolsPanel />
        </div>
    );
};