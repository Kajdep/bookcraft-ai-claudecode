
import React, { useMemo } from 'react';
// FIX: Corrected import paths for store, types, and other components.
import { useBookCraftStore } from '../../store/useStore';
import { Chapter, ChapterStatus } from '../../types';
import { Button, Card } from '../UI';
import { PlusIcon, TrashIcon, XCircleIcon } from '../Icons';

interface ChapterCardProps {
    chapter: Chapter;
    onSelect: (id: string) => void;
}

const ChapterCard: React.FC<ChapterCardProps> = ({ chapter, onSelect }) => {
    // FIX: Select actions individually to prevent re-renders from new object references.
    const updateChapter = useBookCraftStore(state => state.updateChapter);
    const deleteChapter = useBookCraftStore(state => state.deleteChapter);
    const setActiveChapter = useBookCraftStore(state => state.setActiveChapter);
    const clearActiveChapter = useBookCraftStore(state => state.clearActiveChapter);

    const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        e.stopPropagation();
        updateChapter(chapter.id, { status: e.target.value as ChapterStatus });
    };

    const handleDelete = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (window.confirm(`Are you sure you want to delete "${chapter.title}"?`)) {
            deleteChapter(chapter.id);
            if (useBookCraftStore.getState().activeChapterId === chapter.id) {
                clearActiveChapter();
            }
        }
    };

    return (
        <Card
            className="mb-3 cursor-pointer bg-gray-100 hover:bg-white/50 hover:border-brand-primary"
            onClick={() => {
                setActiveChapter(chapter.id);
                onSelect(chapter.id);
            }}
        >
            <div className="p-4">
                <div className="flex justify-between items-start">
                    <h4 className="font-bold text-gray-900 pr-2">{chapter.title}</h4>
                    <button onClick={handleDelete} className="text-gray-500 hover:text-red-400 transition-colors flex-shrink-0">
                        <XCircleIcon className="w-5 h-5"/>
                    </button>
                </div>
                <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                    {chapter.content || <span className="italic">No content yet...</span>}
                </p>
                <div className="mt-4">
                     <select 
                        value={chapter.status}
                        onChange={handleStatusChange}
                        onClick={(e) => e.stopPropagation()}
                        className="w-full bg-white border-gray-300 rounded-md text-xs p-1 text-gray-900 focus:ring-brand-primary focus:border-brand-primary"
                     >
                        {/* FIX: Type errors are resolved now that `ChapterStatus` is a defined enum. */}
                        {Object.values(ChapterStatus).map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                </div>
            </div>
        </Card>
    );
};


interface KanbanColumnProps {
    status: ChapterStatus;
    chapters: Chapter[];
    onChapterSelect: (id: string) => void;
}

const statusStyles: Record<ChapterStatus, { border: string, text: string }> = {
    [ChapterStatus.Idea]: { border: 'border-purple-500', text: 'text-purple-300' },
    [ChapterStatus.Outline]: { border: 'border-sky-500', text: 'text-sky-300' },
    [ChapterStatus.Draft]: { border: 'border-blue-500', text: 'text-blue-300' },
    [ChapterStatus.Review]: { border: 'border-yellow-500', text: 'text-yellow-300' },
    [ChapterStatus.Done]: { border: 'border-green-500', text: 'text-green-300' },
};

const KanbanColumn: React.FC<KanbanColumnProps> = ({ status, chapters, onChapterSelect }) => {
    const { border, text } = statusStyles[status];
    // FIX: Memoize the sorted chapters array to prevent re-sorting on every render,
    // which was the cause of the infinite loop.
    const sortedChapters = useMemo(() => 
        [...chapters].sort((a, b) => a.order - b.order), 
        [chapters]
    );

    return (
        <div className="bg-white/50 rounded-lg w-full flex-shrink-0">
            <div className={`flex items-center justify-between p-3 border-b-2 ${border}`}>
                <h3 className={`font-semibold text-lg ${text}`}>{status}</h3>
                <span className="bg-white text-gray-800 text-sm font-bold w-6 h-6 flex items-center justify-center rounded-full">{chapters.length}</span>
            </div>
            <div className="p-2 h-full overflow-y-auto">
                {sortedChapters.map(chap => (
                    <ChapterCard key={chap.id} chapter={chap} onSelect={onChapterSelect} />
                ))}
            </div>
        </div>
    );
};


interface ChapterKanbanViewProps {
    onChapterSelect: (id: string) => void;
}

export const ChapterKanbanView: React.FC<ChapterKanbanViewProps> = ({ onChapterSelect }) => {
    // FIX: Select only the 'chapters' array instead of the whole project object.
    // This makes the component re-render only when chapters change.
    const chapters = useBookCraftStore(state => state.projects[state.activeProjectId!].chapters);
    const addChapter = useBookCraftStore(state => state.addChapter);

    const chaptersByStatus = useMemo(() => {
        const grouped = {} as Record<ChapterStatus, Chapter[]>;
        for (const status of Object.values(ChapterStatus)) {
            grouped[status] = [];
        }
        chapters.forEach(chapter => {
            // FIX: Indexing type error is resolved now that `ChapterStatus` is a defined enum.
            grouped[chapter.status].push(chapter);
        });
        return grouped;
    }, [chapters]);

    return (
        <div className="animate-fade-in">
            <div className="flex justify-end mb-6">
                <Button onClick={addChapter}>
                    <PlusIcon className="w-5 h-5 mr-2"/>
                    Add New Chapter
                </Button>
            </div>
            <div className="flex gap-6 overflow-x-auto pb-4" style={{ height: 'calc(100vh - 300px)'}}>
                {/* FIX: Type errors are resolved now that `ChapterStatus` is a defined enum. */}
                {Object.values(ChapterStatus).map(status => (
                    <div key={status} className="w-80 md:w-96 flex flex-col">
                        <KanbanColumn
                            status={status}
                            // FIX: Indexing type error is resolved.
                            chapters={chaptersByStatus[status]}
                            onChapterSelect={onChapterSelect}
                        />
                    </div>
                ))}
            </div>
        </div>
    );
};
