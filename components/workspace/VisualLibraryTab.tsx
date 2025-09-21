
import React from 'react';
// FIX: Corrected import paths for types and other components.
import type { Project } from '../../types';
import { VisualCard } from './VisualCard';
import { CheckIcon } from '../Icons';

interface VisualLibraryTabProps {
    project: Project;
}

export const VisualLibraryTab: React.FC<VisualLibraryTabProps> = ({ project }) => {
    return (
        <div className="space-y-6 animate-fade-in">
             <h3 className="text-2xl font-bold">Generated Visuals</h3>
             {project.visuals.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                    {project.visuals.map(vis => <VisualCard key={vis.id} visual={vis} />)}
                </div>
             ) : (
                <div className="text-center py-16 border-2 border-dashed border-slate-700 rounded-lg bg-slate-800/20">
                    <CheckIcon className="mx-auto h-12 w-12 text-slate-600" />
                    <h3 className="mt-4 text-xl font-semibold text-slate-300">Your Library is Empty</h3>
                    <p className="mt-2 text-slate-400">Accept some AI recommendations from the 'AI Visuals' tab to get started.</p>
                </div>
             )}
        </div>
    );
};
