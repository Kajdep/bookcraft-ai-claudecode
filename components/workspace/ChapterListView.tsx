// FIX: Created missing ChapterListView component.
import React, { useState } from 'react';
import { useBookCraftStore } from '../../store/useStore';
import { Chapter, ChapterStatus } from '../../types';
import { Button } from '../UI';
import { PlusIcon, Bars3Icon, TrashIcon, ChevronDownIcon } from '../Icons';

interface ChapterListItemProps {
    chapter: Chapter;
    isActive: boolean;
    onSelect: (id: string) => void;
    onDelete: (id: string) => void;
    onStatusChange: (id: string, status: ChapterStatus) => void;
    // Drag and Drop props
    index: number;
    isDragged: boolean;
    isDropTarget: boolean;
    onDragStart: (e: React.DragEvent, index: number) => void;
    onDragEnter: (e: React.DragEvent, index: number) => void;
    onDragEnd: (e: React.DragEvent) => void;
}

const ChapterListItem: React.FC<ChapterListItemProps> = ({ chapter, isActive, onSelect, onDelete, onStatusChange, index, isDragged, isDropTarget, onDragStart, onDragEnter, onDragEnd }) => {
    const [showConfirm, setShowConfirm] = useState(false);
    const [showStatusDropdown, setShowStatusDropdown] = useState(false);
    
    const handleDelete = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (showConfirm) {
            onDelete(chapter.id);
            setShowConfirm(false);
        } else {
            setShowConfirm(true);
        }
    };
    
    const handleCancel = (e: React.MouseEvent) => {
        e.stopPropagation();
        setShowConfirm(false);
    };
    
    const handleStatusChange = (e: React.MouseEvent, status: ChapterStatus) => {
        e.stopPropagation();
        onStatusChange(chapter.id, status);
        setShowStatusDropdown(false);
    };
    
    const getStatusColor = (status: ChapterStatus) => {
        switch (status) {
            case ChapterStatus.Idea: return 'text-gray-600';
            case ChapterStatus.Outline: return 'text-blue-400';
            case ChapterStatus.Draft: return 'text-yellow-400';
            case ChapterStatus.Review: return 'text-orange-400';
            case ChapterStatus.Done: return 'text-green-400';
            default: return 'text-gray-600';
        }
    };
    
    return (
        <div 
            className={`relative transition-colors group ${isDropTarget ? 'bg-brand-primary/10' : ''}`}
            onDragEnter={(e) => onDragEnter(e, index)}
        >
            <div className={`flex items-start gap-2 p-3 rounded-md transition-all duration-200 ${
                isActive ? 'bg-brand-primary/20' : 'hover:bg-white/50'
            } ${isDragged ? 'opacity-30' : 'opacity-100'}`}>
                <button
                    onClick={() => onSelect(chapter.id)}
                    draggable="true"
                    onDragStart={(e) => onDragStart(e, index)}
                    onDragEnd={onDragEnd}
                    className="flex items-start gap-3 flex-grow text-left"
                >
                    <Bars3Icon className="h-5 w-5 text-gray-500 mt-0.5 flex-shrink-0 cursor-grab"/>
                    <div className="flex-grow">
                        <h5 className={`font-semibold ${isActive ? 'text-brand-primary' : 'text-gray-800'}`}>{chapter.title}</h5>
                        <div className="flex items-center gap-2 mt-1">
                            <div className="relative">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setShowStatusDropdown(!showStatusDropdown);
                                    }}
                                    className={`text-xs px-2 py-1 rounded-full border ${getStatusColor(chapter.status)} border-current hover:bg-current hover:text-slate-900 transition-colors flex items-center gap-1`}
                                >
                                    {chapter.status}
                                    <ChevronDownIcon className="w-3 h-3" />
                                </button>
                                
                                {showStatusDropdown && (
                                    <div className="absolute top-full left-0 mt-1 bg-gray-100 border border-gray-300 rounded-md shadow-lg z-10 min-w-[120px]">
                                        {Object.values(ChapterStatus).map(status => (
                                            <button
                                                key={status}
                                                onClick={(e) => handleStatusChange(e, status)}
                                                className={`w-full text-left px-3 py-2 text-xs hover:bg-white transition-colors ${getStatusColor(status)} ${chapter.status === status ? 'bg-white' : ''}`}
                                            >
                                                {status}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <p className="text-xs text-gray-500 flex-grow truncate">{chapter.content ? `${chapter.content.replace(/<[^>]*>/g, '').substring(0, 50)}...` : <span className="italic">Empty</span>}</p>
                        </div>
                    </div>
                </button>
                
                {/* Delete button - shows on hover */}
                <div className={`flex items-center ${showConfirm ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity`}>
                    {showConfirm ? (
                        <div className="flex gap-1">
                            <button
                                onClick={handleDelete}
                                className="p-1 text-red-400 hover:text-red-300 text-xs"
                                title="Confirm delete"
                            >
                                ✓
                            </button>
                            <button
                                onClick={handleCancel}
                                className="p-1 text-gray-600 hover:text-gray-700 text-xs"
                                title="Cancel"
                            >
                                ✕
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={handleDelete}
                            className="p-1 text-gray-600 hover:text-red-400 transition-colors"
                            title="Delete chapter"
                        >
                            <TrashIcon className="h-4 w-4" />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};


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
    const deleteChapter = useBookCraftStore(state => state.deleteChapter);
    const updateChapter = useBookCraftStore(state => state.updateChapter);
    
    const handleDeleteChapter = (chapterId: string) => {
        deleteChapter(chapterId);
        // If the deleted chapter was active, clear the selection
        if (chapterId === activeChapterId) {
            // Select the first remaining chapter if available
            const remainingChapters = chapters.filter(c => c.id !== chapterId);
            if (remainingChapters.length > 0) {
                onChapterSelect(remainingChapters[0].id);
            }
        }
    };
    
    const handleStatusChange = (chapterId: string, status: ChapterStatus) => {
        updateChapter(chapterId, { status });
    };

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
        <div className="bg-gray-100/50 rounded-lg border border-gray-300/50 h-full flex flex-col">
            <div className="p-3 border-b border-gray-300/50">
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
                            onDelete={handleDeleteChapter}
                            onStatusChange={handleStatusChange}
                            isDragged={draggedIndex === index}
                            isDropTarget={dropTargetIndex === index}
                            onDragStart={handleDragStart}
                            onDragEnter={handleDragEnter}
                            onDragEnd={handleDragEnd}
                        />
                    ))
                ) : (
                    <p className="p-4 text-center text-sm text-gray-600">No chapters yet.</p>
                )}
            </div>
        </div>
    );
};