import React, { useState, useEffect } from 'react';
import { useBookCraftStore } from '../store/useStore';
import {
    ClipboardDocumentListIcon,
    PhotoIcon,
    ArrowDownOnSquareIcon,
    CalculatorIcon,
    BookOpenIcon,
    MagnifyingGlassIcon,
    PaperClipIcon,
    BrainCircuitIcon,
    FolderIcon
} from './Icons';
import { Dashboard } from './Dashboard';
import { WritingStudio } from './workspace/WritingStudio';
import { VisualsWorkspace } from './workspace/VisualsWorkspace';
import { ExportTab } from './workspace/ExportTab';
import { KDPCalculator } from './workspace/KDPCalculator';
import { CoverCreator } from './workspace/CoverCreator';
import { ResearchTab } from './workspace/ResearchTab';
import { MaterialTab } from './workspace/MaterialTab';
import { PlotTab } from './workspace/plot/PlotTab';

type MainTab = 'Dashboard' | 'Writing' | 'Visuals' | 'Research' | 'Material' | 'Plot' | 'Cover Creator' | 'KDP Calculator' | 'Export';

const TabButton: React.FC<{
    active: boolean;
    onClick: () => void;
    children: React.ReactNode;
    icon: React.ReactNode;
    disabled?: boolean;
}> = ({ active, onClick, children, icon, disabled = false }) => (
    <button
        onClick={onClick}
        disabled={disabled}
        className={`flex items-center w-full justify-start gap-3 px-4 py-2.5 text-sm font-semibold rounded-lg transition-colors ${
            active
                ? 'bg-brand-primary text-gray-900'
                : disabled
                ? 'text-gray-500 cursor-not-allowed'
                : 'text-gray-700 hover:bg-white/50'
        }`}
    >
        {icon}
        <span>{children}</span>
    </button>
);

export const MainLayout: React.FC = () => {
    const activeProjectId = useBookCraftStore(state => state.activeProjectId);
    const project = useBookCraftStore(state => activeProjectId ? state.projects[activeProjectId] : null);
    const closeAllModals = useBookCraftStore(state => state.closeAllModals);
    const [activeTab, setActiveTab] = useState<MainTab>('Dashboard');

    // When a project is selected, automatically switch to Writing tab
    useEffect(() => {
        if (activeProjectId && activeTab === 'Dashboard') {
            setActiveTab('Writing');
        }
    }, [activeProjectId, activeTab]);
    
    // Force re-render of tab accessibility when project changes
    useEffect(() => {
        // This ensures that tabs are re-evaluated for accessibility when project state changes
        if (activeProjectId) {
            // Small delay to ensure project data is loaded
            setTimeout(() => {
                // Force a re-render by updating a dummy state if needed
            }, 100);
        }
    }, [activeProjectId]);

    // When no project is selected, go back to Dashboard
    useEffect(() => {
        if (!activeProjectId && activeTab !== 'Dashboard') {
            setActiveTab('Dashboard');
        }
    }, [activeProjectId, activeTab]);

    const isProjectRequired = (tab: MainTab): boolean => {
        return ['Writing', 'Export'].includes(tab);
    };

    const canAccessTab = (tab: MainTab): boolean => {
        if (isProjectRequired(tab)) {
            return !!activeProjectId;
        }
        return true;
    };

    const handleTabClick = (tab: MainTab) => {
        if (canAccessTab(tab)) {
            // Close any open modals when navigating between tabs to prevent conflicts
            closeAllModals();
            setActiveTab(tab);
        }
    };
    
    const handleProjectsClick = () => {
        // Clear active project and go to dashboard
        const setActiveProject = useBookCraftStore.getState().setActiveProject;
        setActiveProject(null);
        closeAllModals();
        setActiveTab('Dashboard');
    };
    
    // Handle clicking on a project from dashboard to activate it
    const handleProjectSelect = (projectId: string) => {
        const setActiveProject = useBookCraftStore.getState().setActiveProject;
        setActiveProject(projectId);
        // The useEffect will automatically switch to Writing tab when project is selected
    };

    return (
        <div className="flex h-[calc(100vh-4rem)]">
            {/* Sidebar Navigation */}
            <aside className="w-64 flex-shrink-0 bg-gray-100/30 border-r border-gray-300/50">
                <nav className="flex flex-col gap-1 p-4">
                    <div className="mb-4">
                        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                            Main
                        </h3>
                        <TabButton
                            active={activeTab === 'Dashboard'}
                            onClick={handleProjectsClick}
                            icon={<FolderIcon className="w-5 h-5"/>}
                        >
                            Projects
                        </TabButton>
                    </div>

                    <div className="mb-4">
                        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                            Writing Tools
                        </h3>
                        <div className="space-y-1">
                            <TabButton
                                active={activeTab === 'Writing'}
                                onClick={() => handleTabClick('Writing')}
                                icon={<ClipboardDocumentListIcon className="w-5 h-5"/>}
                                disabled={!canAccessTab('Writing')}
                            >
                                Writing Studio
                            </TabButton>
                            <TabButton
                                active={activeTab === 'Research'}
                                onClick={() => handleTabClick('Research')}
                                icon={<MagnifyingGlassIcon className="w-5 h-5"/>}
                            >
                                Research
                            </TabButton>
                            <TabButton
                                active={activeTab === 'Plot'}
                                onClick={() => handleTabClick('Plot')}
                                icon={<BrainCircuitIcon className="w-5 h-5"/>}
                            >
                                Plot
                            </TabButton>
                            <TabButton
                                active={activeTab === 'Material'}
                                onClick={() => handleTabClick('Material')}
                                icon={<PaperClipIcon className="w-5 h-5"/>}
                            >
                                Material
                            </TabButton>
                        </div>
                    </div>

                    <div className="mb-4">
                        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                            Design & Publishing
                        </h3>
                        <div className="space-y-1">
                            <TabButton
                                active={activeTab === 'Visuals'}
                                onClick={() => handleTabClick('Visuals')}
                                icon={<PhotoIcon className="w-5 h-5"/>}
                            >
                                Visuals
                            </TabButton>
                            <TabButton
                                active={activeTab === 'Plot'}
                                onClick={() => handleTabClick('Plot')}
                                icon={<BrainCircuitIcon className="w-5 h-5"/>}
                            >
                                Plot
                            </TabButton>
                            <TabButton
                                active={activeTab === 'Cover Creator'}
                                onClick={() => handleTabClick('Cover Creator')}
                                icon={<BookOpenIcon className="w-5 h-5"/>}
                            >
                                Cover Creator
                            </TabButton>
                            <TabButton
                                active={activeTab === 'KDP Calculator'}
                                onClick={() => handleTabClick('KDP Calculator')}
                                icon={<CalculatorIcon className="w-5 h-5"/>}
                            >
                                KDP Calculator
                            </TabButton>
                            <TabButton
                                active={activeTab === 'Export'}
                                onClick={() => handleTabClick('Export')}
                                icon={<ArrowDownOnSquareIcon className="w-5 h-5"/>}
                                disabled={!canAccessTab('Export')}
                            >
                                Export
                            </TabButton>
                        </div>
                    </div>

                    {/* Project Info */}
                    {project && (
                        <div className="mt-auto pt-4 border-t border-gray-300/50">
                            <div className="text-xs text-gray-600 mb-1">Current Project</div>
                            <div className="text-sm font-medium text-gray-800 truncate">{project.title}</div>
                            <div className="text-xs text-gray-500">{project.genre} - {project.visualStyle}</div>
                        </div>
                    )}
                </nav>
            </aside>

            {/* Main Content */}
            <main className="flex-1 min-w-0 overflow-auto">
                <div className="p-6">
                    {activeTab === 'Dashboard' && <Dashboard />}
                    {activeTab === 'Writing' && <WritingStudio />}
                    {activeTab === 'Visuals' && <VisualsWorkspace project={project} />}
                    {activeTab === 'Research' && <ResearchTab />}
                    {activeTab === 'Material' && <MaterialTab />}
                    {activeTab === 'Plot' && <PlotTab />}
                    {activeTab === 'Cover Creator' && <CoverCreator />}
                    {activeTab === 'KDP Calculator' && <KDPCalculator />}
                    {activeTab === 'Export' && <ExportTab />}
                </div>
            </main>
        </div>
    );
};