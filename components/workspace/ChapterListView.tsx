// FIX: Created missing ChapterListView component.
import React, { useState } from 'react';
import { useBookCraftStore } from '../../store/useStore';
import { Chapter } from '../../types';
import { Button } from '../UI';
import { PlusIcon, Bars3Icon } from '../Icons';

interface ChapterListItemProps {
    chapter: Chapter;
    isActive: boolean;
    onSelect: (id: string) => void;
    // Drag and Drop props
    index: number;
    isDragged: boolean;
    isDropTarget: boolean;
    onDragStart: (e: React.DragEvent, index: number) => void;
    onDragEnter: (e: React.DragEvent, index: number) => void;
    onDragEnd: (e: React.DragEvent) => void;
}

const ChapterListItem: React.FC<ChapterListItemProps> = ({ chapter, isActive, onSelect, index, isDragged, isDropTarget, onDragStart, onDragEnter, onDragEnd }) => (
    <div 
        className={`relative transition-colors ${isDropTarget ? 'bg-brand-primary/10' : ''}`}
        onDragEnter={(e) => onDragEnter(e, index)}
    >
        <button
            onClick={() => onSelect(chapter.id)}
            draggable="true"
            onDragStart={(e) => onDragStart(e, index)}
            onDragEnd={onDragEnd}
            className={`w-full text-left p-3 rounded-md transition-all duration-200 flex items-start gap-3 ${
                isActive ? 'bg-brand-primary/20' : 'hover:bg-slate-700/50'
            } ${isDragged ? 'opacity-30' : 'opacity-100'}`}
        >
            <Bars3Icon className="h-5 w-5 text-slate-500 mt-0.5 flex-shrink-0 cursor-grab"/>
            <div>
                <h5 className={`font-semibold ${isActive ? 'text-brand-primary' : 'text-slate-200'}`}>{chapter.title}</h5>
                <p className="text-xs text-slate-400 mt-1 line-clamp-1">{chapter.content || <span className="italic">Empty</span>}</p>
            </div>
        </button>
    </div>
);


interface ChapterListViewProps {
    activeChapterId: string | null;
    onChapterSelect: (id: string) => void;
}

export const ChapterListView: React.FC<ChapterListViewProps> = ({ activeChapterId, onChapterSelect }) => {
    // FIX: Select the raw chapters array to prevent re-renders.
    const rawChapters = useBookCraftStore(state => state.projects[state.activeProjectId!]?.chapters || []);
    const reorderChapters = useBookCraftStore(state => state.reorderChapters);

    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
    const [dropTargetIndex, setDropTargetIndex] = useState<number | null>(null);

    // FIX: Use useMemo to sort the array only when the raw data changes. This prevents an infinite loop.
    const chapters = React.useMemo(() => 
        [...rawChapters].sort((a, b) => a.order - b.order),
        [rawChapters]
    );
    const addChapter = useBookCraftStore(state => state.addChapter);

    const handleDragStart = (e: React.DragEvent, index: number) => {
        setDraggedIndex(index);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragEnter = (e: React.DragEvent, index: number) => {
        if (draggedIndex !== null && draggedIndex !== index) {
            setDropTargetIndex(index);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault(); // This is necessary to allow dropping
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        if (draggedIndex !== null && dropTargetIndex !== null) {
            reorderChapters(draggedIndex, dropTargetIndex);
        }
        setDraggedIndex(null);
        setDropTargetIndex(null);
    };

    const handleDragEnd = () => {
        setDraggedIndex(null);
        setDropTargetIndex(null);
    };

    return (
        <div className="bg-slate-800/50 rounded-lg border border-slate-700/50 h-full flex flex-col">
            <div className="p-3 border-b border-slate-700/50">
                <Button onClick={addChapter} variant="secondary" className="w-full">
                    <PlusIcon className="w-5 h-5 mr-2" />
                    New Chapter
                </Button>
            </div>
            <div 
                className="p-2 overflow-y-auto flex-grow"
                onDragOver={handleDragOver}
                onDrop={handleDrop}
            >
                {chapters.length > 0 ? (
                    chapters.map((chap, index) => (
                        <ChapterListItem 
                            key={chap.id} 
                            chapter={chap}
                            index={index}
                            isActive={chap.id === activeChapterId}
                            onSelect={onChapterSelect}
                            isDragged={draggedIndex === index}
                            isDropTarget={dropTargetIndex === index}
                            onDragStart={handleDragStart}
                            onDragEnter={handleDragEnter}
                            onDragEnd={handleDragEnd}
                        />
                    ))
                ) : (
                    <p className="p-4 text-center text-sm text-slate-400">No chapters yet.</p>
                )}
            </div>
        </div>
    );
};