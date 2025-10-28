
import React, { useState } from 'react';
// FIX: Corrected import path for types.
import type { Project } from '../../types';
import { AIVisualsTab } from './AIVisualsTab';
import { VisualLibraryTab } from './VisualLibraryTab';
import { ImageGenerationTab } from './ImageGenerationTab';

type Tab = 'AI Visuals' | 'Visual Library' | 'Image Generation';

const TabButton: React.FC<{ active: boolean; onClick: () => void; children: React.ReactNode }> = ({ active, onClick, children }) => (
    <button
        onClick={onClick}
        className={`px-4 py-2 text-sm font-medium rounded-md transition-colors relative ${
            active ? 'text-gray-900' : 'text-gray-700 hover:bg-white/50'
        }`}
    >
        {children}
        {active && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-primary rounded-full"></div>}
    </button>
);

interface VisualsWorkspaceProps {
    project: Project;
}

export const VisualsWorkspace: React.FC<VisualsWorkspaceProps> = ({ project }) => {
    const [activeTab, setActiveTab] = useState<Tab>('AI Visuals');

    return (
        <div className="animate-fade-in">
             <div className="border-b border-gray-300 mb-8">
                <nav className="flex space-x-2">
                    <TabButton active={activeTab === 'AI Visuals'} onClick={() => setActiveTab('AI Visuals')}>AI Visuals</TabButton>
                    <TabButton active={activeTab === 'Visual Library'} onClick={() => setActiveTab('Visual Library')}>
                        Visual Library <span className="ml-2 bg-white text-gray-800 text-xs font-bold px-2 py-0.5 rounded-full">{project.visuals?.length || 0}</span>
                    </TabButton>
                    <TabButton active={activeTab === 'Image Generation'} onClick={() => setActiveTab('Image Generation')}>
                        Image Generation <span className="ml-2 bg-white text-gray-800 text-xs font-bold px-2 py-0.5 rounded-full">{project.generatedImages?.length || 0}</span>
                    </TabButton>
                </nav>
            </div>
            
            <div>
                {activeTab === 'AI Visuals' && <AIVisualsTab project={project} />}
                {activeTab === 'Visual Library' && <VisualLibraryTab project={project} />}
                {activeTab === 'Image Generation' && <ImageGenerationTab project={project} />}
            </div>
        </div>
    );
};
