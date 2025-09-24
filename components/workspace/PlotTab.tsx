import React, { useState, useMemo } from 'react';
import { useBookCraftStore } from '../../store/useStore';
import type { PlotPoint } from '../../types';
import { Button, Card } from '../UI';
import { BrainCircuitIcon, PlusIcon, SparklesIcon, TrashIcon } from '../Icons';
import { PlottingToolModal } from './PlottingToolModal';

interface PlotPointCardProps {
    point: PlotPoint;
    onDelete: (id: string) => void;
    onUpdate: (id: string, updates: Partial<PlotPoint>) => void;
    // Drag props
    index: number;
    onDragStart: (e: React.DragEvent, index: number) => void;
    onDragOver: (e: React.DragEvent, index: number) => void;
    onDrop: (e: React.DragEvent, index: number) => void;
    isDragging?: boolean;
    isDragOver?: boolean;
}

const PlotPointCard: React.FC<PlotPointCardProps> = ({
    point,
    onDelete,
    onUpdate,
    index,
    onDragStart,
    onDragOver,
    onDrop,
    isDragging = false,
    isDragOver = false
}) => {
    const [title, setTitle] = useState(point.title);
    const [description, setDescription] = useState(point.description);

    // Sync local state with prop changes to prevent stale state
    React.useEffect(() => {
        setTitle(point.title);
    }, [point.title]);

    React.useEffect(() => {
        setDescription(point.description);
    }, [point.description]);

    const handleTitleBlur = () => {
        if (title !== point.title) onUpdate(point.id, { title });
    };

    const handleDescriptionBlur = () => {
        if (description !== point.description) onUpdate(point.id, { description });
    };

    return (
        <Card
            className={`p-4 transition-all duration-200 ${
                isDragging ? 'opacity-50 scale-95' :
                isDragOver ? 'bg-slate-700 border-blue-400' :
                'bg-slate-800'
            }`}
            draggable="true"
            onDragStart={(e) => onDragStart(e, index)}
            onDragOver={(e) => onDragOver(e, index)}
            onDrop={(e) => onDrop(e, index)}
        >
            <div className="flex justify-between items-start gap-2">
                <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    onBlur={handleTitleBlur}
                    className="w-full bg-transparent text-lg font-bold text-slate-100 focus:outline-none focus:ring-0 focus:bg-slate-700/50 rounded px-1"
                />
                <Button variant="danger" size="sm" onClick={() => onDelete(point.id)} className="!p-2 flex-shrink-0">
                    <TrashIcon className="w-4 h-4"/>
                </Button>
            </div>
            <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                onBlur={handleDescriptionBlur}
                rows={3}
                className="w-full bg-transparent text-slate-300 focus:outline-none focus:ring-0 focus:bg-slate-700/50 rounded px-1 mt-2 resize-none"
            />
        </Card>
    );
};

export const PlotTab: React.FC = () => {
    // Consolidate store selectors to minimize subscriptions and prevent infinite loops
    // FIX: Separate stable selectors to prevent infinite loops
    const activeProjectId = useBookCraftStore(state => state.activeProjectId);
    const rawPlotPoints = useBookCraftStore(state =>
        state.activeProjectId && state.projects[state.activeProjectId]
            ? state.projects[state.activeProjectId].plotPoints
            : []
    );
    const addPlotPoint = useBookCraftStore(state => state.addPlotPoint);
    const deletePlotPoint = useBookCraftStore(state => state.deletePlotPoint);
    const updatePlotPoint = useBookCraftStore(state => state.updatePlotPoint);
    const reorderPlotPoints = useBookCraftStore(state => state.reorderPlotPoints);

    // Early return if no active project to prevent unnecessary rendering
    if (!activeProjectId) {
        return (
            <div className="animate-fade-in">
                <header className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
                    <h3 className="text-2xl font-bold">Plot & Story Structure</h3>
                </header>
                <Card className="p-12 text-center border-2 border-dashed border-slate-700">
                    <h4 className="mt-4 text-xl font-semibold text-slate-300">No Active Project</h4>
                    <p className="mt-2 text-slate-400">Please create or select a project to manage plot points.</p>
                </Card>
            </div>
        );
    }

    // FIX: Use stable dependency for useMemo to prevent infinite loops
    const plotPoints = useMemo(() => {
        if (!rawPlotPoints || rawPlotPoints.length === 0) return [];
        return [...rawPlotPoints].sort((a, b) => a.order - b.order);
    }, [rawPlotPoints]);

    const [isPlannerOpen, setIsPlannerOpen] = useState(false);
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
    const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

    const handleDragStart = (e: React.DragEvent, index: number) => {
        setDraggedIndex(index);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e: React.DragEvent, index: number) => {
        e.preventDefault();
        setDragOverIndex(index);
    };

    const handleDrop = (e: React.DragEvent, targetIndex: number) => {
        e.preventDefault();
        if (draggedIndex !== null && draggedIndex !== targetIndex) {
            reorderPlotPoints(draggedIndex, targetIndex);
        }
        setDraggedIndex(null);
        setDragOverIndex(null);
    };

    const handleDragEnd = () => {
        setDraggedIndex(null);
        setDragOverIndex(null);
    };

    return (
        <div className="animate-fade-in">
            <header className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
                <h3 className="text-2xl font-bold">Plot & Story Structure</h3>
                <div className="flex gap-2">
                    <Button variant="secondary" onClick={addPlotPoint}>
                        <PlusIcon className="w-5 h-5 mr-2"/>
                        Add Plot Point
                    </Button>
                    <Button onClick={() => setIsPlannerOpen(true)}>
                        <SparklesIcon className="w-5 h-5 mr-2"/>
                        AI Plotting Tool
                    </Button>
                </div>
            </header>

            <div
                className="space-y-4"
                onDragEnd={handleDragEnd}
            >
                {plotPoints.length > 0 ? (
                    plotPoints.map((point, index) => (
                        <PlotPointCard
                            key={point.id}
                            point={point}
                            index={index}
                            onDelete={deletePlotPoint}
                            onUpdate={updatePlotPoint}
                            onDragStart={handleDragStart}
                            onDragOver={handleDragOver}
                            onDrop={handleDrop}
                            isDragging={draggedIndex === index}
                            isDragOver={dragOverIndex === index}
                        />
                    ))
                ) : (
                    <Card className="p-12 text-center border-2 border-dashed border-slate-700">
                        <BrainCircuitIcon className="mx-auto h-12 w-12 text-slate-600" />
                        <h4 className="mt-4 text-xl font-semibold text-slate-300">Map Your Narrative</h4>
                        <p className="mt-2 text-slate-400">Use the AI Plotting Tool to generate a structure or add plot points manually.</p>
                    </Card>
                )}
            </div>

            <PlottingToolModal isOpen={isPlannerOpen} onClose={() => setIsPlannerOpen(false)} />
        </div>
    );
};