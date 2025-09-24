import React, { useState, useMemo } from 'react';
import { useBookCraftStore } from '../../store/useStore';
import { ChapterKanbanView } from './ChapterKanbanView';
import { ChapterListView } from './ChapterListView';
// FIX: Corrected import path for ChapterEditorView.
import { ChapterEditorView } from './ChapterEditorView';
import { Button } from '../UI';
import { Bars3Icon, MapIcon, SparklesIcon, ArrowLeftIcon, MagnifyingGlassIcon } from '../Icons';
import { ProjectPlannerModal } from './ProjectPlannerModal';
import { ResearchSidebar } from './ResearchSidebar';
import { ErrorBoundary } from '../ErrorBoundary';

type ViewMode = 'list' | 'kanban';

export const WritingDesk: React.FC = () => {
    const [viewMode, setViewMode] = useState<ViewMode>('list');
    const chapters = useBookCraftStore(state => state.projects[state.activeProjectId!]?.chapters || []);
    const [selectedChapterId, setSelectedChapterId] = useState<string | null>(null);
    const [isPlannerOpen, setIsPlannerOpen] = useState(false);
    const [isResearchOpen, setIsResearchOpen] = useState(false);

    // FIX: Refactored active chapter logic to be more declarative and robust.
    // This solves the bug where the editor wouldn't appear after generating chapters.
    const activeChapterId = useMemo(() => {
        // If the user has selected a chapter and it still exists, keep it.
        if (selectedChapterId && chapters.some(c => c.id === selectedChapterId)) {
            return selectedChapterId;
        }
        // If there's no valid selection but chapters exist, default to the first one.
        if (chapters.length > 0) {
            return [...chapters].sort((a, b) => a.order - b.order)[0].id;
        }
        // Otherwise, no chapter is active.
        return null;
    }, [chapters, selectedChapterId]);

    const handleChapterSelect = (id: string) => {
        setSelectedChapterId(id);
    };

    const ViewToggle: React.FC = () => (
        <div className="flex items-center gap-2 p-1 bg-slate-800/50 rounded-lg border border-slate-700/50">
            <Button
                variant={'secondary'}
                size="sm"
                onClick={() => setViewMode('list')}
                className={`!shadow-none ${viewMode === 'list' ? 'bg-slate-600' : 'bg-transparent hover:bg-slate-700'}`}
            >
                <Bars3Icon className="w-5 h-5" />
                <span className="ml-2 hidden sm:inline">List</span>
            </Button>
            <Button
                variant={'secondary'}
                size="sm"
                onClick={() => setViewMode('kanban')}
                className={`!shadow-none ${viewMode === 'kanban' ? 'bg-slate-600' : 'bg-transparent hover:bg-slate-700'}`}
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
                    </div>
                </div>
                <ChapterKanbanView onChapterSelect={(id) => {
                    setSelectedChapterId(id);
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
                            <div className="h-full flex flex-col items-center justify-center text-center p-6 bg-slate-800/50 rounded-lg border border-slate-700/50">
                                <h3 className="text-xl font-semibold text-slate-300 mb-2">Editor Error</h3>
                                <p className="text-slate-400 mb-4">The chapter editor encountered an issue. Try refreshing the page.</p>
                                <Button onClick={() => window.location.reload()}>Refresh</Button>
                            </div>
                        }>
                            <ChapterEditorView chapterId={activeChapterId} />
                        </ErrorBoundary>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-center p-6 bg-slate-800/50 rounded-lg border border-slate-700/50">
                            <ArrowLeftIcon className="mx-auto h-12 w-12 text-slate-600" />
                            <h3 className="mt-4 text-xl font-semibold text-slate-300">Select a Chapter</h3>
                            <p className="mt-2 text-slate-400">Choose a chapter from the list to start editing.</p>
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
        </div>
    );
};