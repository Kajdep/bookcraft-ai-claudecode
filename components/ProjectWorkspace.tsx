import React, { useState } from 'react';
import { useBookCraftStore } from '../store/useStore';
import { ArrowLeftIcon, ClipboardDocumentListIcon, PhotoIcon, ArrowDownOnSquareIcon, CalculatorIcon, BookCoverIcon, MagnifyingGlassIcon, PaperClipIcon, BrainCircuitIcon, ChartBarIcon } from './Icons';
import { Button } from './UI';
import { WritingStudio } from './workspace/WritingStudio';
import { VisualsWorkspace } from './workspace/VisualsWorkspace';
import { ExportTab } from './workspace/ExportTab';
import { KDPCalculator } from './workspace/KDPCalculator';
import { CoverCreator } from './workspace/CoverCreator';
import { ResearchTab } from './workspace/ResearchTab';
import { MaterialTab } from './workspace/MaterialTab';
import { PlotTab } from './workspace/PlotTab';
import { AnalyticsTab } from './workspace/AnalyticsTab';
import { ErrorBoundary } from './ErrorBoundary';
import { SaveStatusIndicator } from './SaveStatusIndicator';

type WorkspaceTab = 'Writing' | 'Visuals' | 'Research' | 'Material' | 'Plot' | 'Analytics' | 'Cover Creator' | 'KDP Calculator' | 'Export';

const TabButton: React.FC<{ active: boolean; onClick: () => void; children: React.ReactNode; icon: React.ReactNode }> = ({ active, onClick, children, icon }) => (
    <button
        onClick={onClick}
        className={`flex items-center w-full md:w-auto justify-center md:justify-start gap-3 px-4 py-2.5 text-sm font-semibold rounded-lg transition-colors ${
            active ? 'bg-brand-primary text-gray-900' : 'text-gray-700 hover:bg-white/50'
        }`}
    >
        {icon}
        <span className="hidden md:inline">{children}</span>
    </button>
);

export const ProjectWorkspace: React.FC = () => {
    const activeProjectId = useBookCraftStore(state => state.activeProjectId);
    const project = useBookCraftStore(state => activeProjectId ? state.projects[activeProjectId] : null);
    const setActiveProject = useBookCraftStore(state => state.setActiveProject);
    const [activeTab, setActiveTab] = useState<WorkspaceTab>('Writing');

    if (!project) {
        return (
            <div className="text-center">
                <p className="text-gray-600">Project not found.</p>
                <Button onClick={() => setActiveProject(null)} className="mt-4">
                    <ArrowLeftIcon className="w-5 h-5 mr-2"/>
                    Back to Dashboard
                </Button>
            </div>
        );
    }

    return (
        <div className="animate-fade-in">
            <header className="mb-8">
                <div className="flex items-center justify-between mb-4">
                    <Button onClick={() => setActiveProject(null)} variant="secondary">
                        <ArrowLeftIcon className="w-5 h-5 mr-2"/>
                        Back to Dashboard
                    </Button>
                    <SaveStatusIndicator />
                </div>
                <h2 className="text-4xl font-bold bg-gradient-to-r from-slate-100 to-slate-400 text-transparent bg-clip-text">{project.title}</h2>
                <p className="text-gray-600 dark:text-gray-400 mt-1">{project.genre} - {project.visualStyle} Style</p>
            </header>

            <div className="flex flex-col lg:flex-row gap-6">
                <aside className="lg:w-64 flex-shrink-0">
                    <nav className="flex flex-row lg:flex-col gap-2 p-2 bg-gray-100/50 rounded-lg border border-gray-300/50">
                        <TabButton active={activeTab === 'Writing'} onClick={() => setActiveTab('Writing')} icon={<ClipboardDocumentListIcon className="w-5 h-5"/>}>
                            Writing Studio
                        </TabButton>
                        <TabButton active={activeTab === 'Visuals'} onClick={() => setActiveTab('Visuals')} icon={<PhotoIcon className="w-5 h-5"/>}>
                            Visuals
                        </TabButton>
                        <TabButton active={activeTab === 'Research'} onClick={() => setActiveTab('Research')} icon={<MagnifyingGlassIcon className="w-5 h-5"/>}>
                            Research
                        </TabButton>
                        <TabButton active={activeTab === 'Material'} onClick={() => setActiveTab('Material')} icon={<PaperClipIcon className="w-5 h-5"/>}>
                            Material
                        </TabButton>
                        <TabButton active={activeTab === 'Plot'} onClick={() => setActiveTab('Plot')} icon={<BrainCircuitIcon className="w-5 h-5"/>}>
                            Plot
                        </TabButton>
                        <TabButton active={activeTab === 'Analytics'} onClick={() => setActiveTab('Analytics')} icon={<ChartBarIcon className="w-5 h-5"/>}>
                            Analytics
                        </TabButton>
                        <TabButton active={activeTab === 'Cover Creator'} onClick={() => setActiveTab('Cover Creator')} icon={<BookCoverIcon className="w-5 h-5"/>}>
                            Cover Creator
                        </TabButton>
                        <TabButton active={activeTab === 'KDP Calculator'} onClick={() => setActiveTab('KDP Calculator')} icon={<CalculatorIcon className="w-5 h-5"/>}>
                            KDP Calculator
                        </TabButton>
                        <TabButton active={activeTab === 'Export'} onClick={() => setActiveTab('Export')} icon={<ArrowDownOnSquareIcon className="w-5 h-5"/>}>
                            Export
                        </TabButton>
                    </nav>
                </aside>
                
                <main className="flex-1 min-w-0">
                    {activeTab === 'Writing' && <WritingStudio />}
                    {activeTab === 'Visuals' && <VisualsWorkspace project={project} />}
                    {activeTab === 'Research' && <ResearchTab />}
                    {activeTab === 'Material' && (
                        <ErrorBoundary fallback={
                            <div className="p-8 text-center bg-gray-100/50 rounded-lg border border-gray-300/50">
                                <h3 className="text-xl font-semibold text-gray-700 mb-2">Material Tab Error</h3>
                                <p className="text-gray-600 mb-4">There was an issue loading the materials library. Try refreshing.</p>
                                <Button onClick={() => window.location.reload()}>Refresh</Button>
                            </div>
                        }>
                            <MaterialTab />
                        </ErrorBoundary>
                    )}
                    {activeTab === 'Plot' && (
                        <ErrorBoundary fallback={
                            <div className="p-8 text-center bg-gray-100/50 rounded-lg border border-gray-300/50">
                                <h3 className="text-xl font-semibold text-gray-700 mb-2">Plot Tab Error</h3>
                                <p className="text-gray-600 mb-4">There was an issue loading the plot management. Try refreshing.</p>
                                <Button onClick={() => window.location.reload()}>Refresh</Button>
                            </div>
                        }>
                            <PlotTab />
                        </ErrorBoundary>
                    )}
                    {activeTab === 'Analytics' && (
                        <ErrorBoundary fallback={
                            <div className="p-8 text-center bg-gray-100/50 rounded-lg border border-gray-300/50">
                                <h3 className="text-xl font-semibold text-gray-700 mb-2">Analytics Tab Error</h3>
                                <p className="text-gray-600 mb-4">There was an issue loading the analytics dashboard. Try refreshing.</p>
                                <Button onClick={() => window.location.reload()}>Refresh</Button>
                            </div>
                        }>
                            <AnalyticsTab />
                        </ErrorBoundary>
                    )}
                    {activeTab === 'Cover Creator' && (
                        <ErrorBoundary fallback={
                            <div className="p-8 text-center bg-gray-100/50 rounded-lg border border-gray-300/50">
                                <h3 className="text-xl font-semibold text-gray-700 mb-2">Cover Creator Error</h3>
                                <p className="text-gray-600 mb-4">There was an issue loading the cover creator. Try refreshing.</p>
                                <Button onClick={() => window.location.reload()}>Refresh</Button>
                            </div>
                        }>
                            <CoverCreator />
                        </ErrorBoundary>
                    )}
                    {activeTab === 'KDP Calculator' && (
                        <ErrorBoundary fallback={
                            <div className="p-8 text-center bg-gray-100/50 rounded-lg border border-gray-300/50">
                                <h3 className="text-xl font-semibold text-gray-700 mb-2">KDP Calculator Error</h3>
                                <p className="text-gray-600 mb-4">There was an issue loading the KDP calculator. Try refreshing.</p>
                                <Button onClick={() => window.location.reload()}>Refresh</Button>
                            </div>
                        }>
                            <KDPCalculator />
                        </ErrorBoundary>
                    )}
                    {activeTab === 'Export' && <ExportTab />}
                </main>
            </div>
        </div>
    );
};
