
import React, { useState } from 'react';
// FIX: Corrected import paths for store, types, and other components.
import { useBookCraftStore } from '../store/useStore';
import type { Project } from '../types';
import { Genre, ProjectStatus } from '../types';
import { Button, Card, ConfirmationModal } from './UI';
import { PlusIcon, DocumentTextIcon, BookOpenIcon, AcademicCapIcon, RocketLaunchIcon, SparklesIcon, BriefcaseIcon, LightBulbIcon, PencilIcon, TrashIcon } from './Icons';
import { CreateProjectModal } from './CreateProjectModal';

const StatusBadge: React.FC<{ status: ProjectStatus }> = ({ status }) => {
    // FIX: Added 'InProgress' to the status styles to match the updated ProjectStatus enum and prevent runtime errors.
    // The other errors related to 'Analyzing' and 'Review' are fixed by updating the ProjectStatus enum in types.ts.
    const statusStyles: Record<ProjectStatus, string> = {
        [ProjectStatus.Draft]: 'bg-gray-300/50 text-gray-700 border border-gray-400',
        [ProjectStatus.InProgress]: 'bg-indigo-500/50 text-indigo-200 border border-indigo-500',
        [ProjectStatus.Analyzing]: 'bg-blue-500/50 text-blue-200 border border-blue-500 animate-pulse',
        [ProjectStatus.Review]: 'bg-yellow-500/50 text-yellow-200 border border-yellow-500',
        [ProjectStatus.Done]: 'bg-green-500/50 text-green-200 border border-green-500',
    };
    return (
        <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${statusStyles[status]}`}>
            {status}
        </span>
    );
};

const GenreIcon: React.FC<{ genre: string }> = ({ genre }) => {
    const iconMap: Record<string, React.ReactNode> = {
        [Genre.Fiction]: <BookOpenIcon className="w-6 h-6 text-indigo-400" />,
        [Genre.NonFiction]: <AcademicCapIcon className="w-6 h-6 text-sky-400" />,
        [Genre.SciFi]: <RocketLaunchIcon className="w-6 h-6 text-cyan-400" />,
        [Genre.Fantasy]: <SparklesIcon className="w-6 h-6 text-purple-400" />,
        [Genre.Business]: <BriefcaseIcon className="w-6 h-6 text-emerald-400" />,
        [Genre.SelfHelp]: <LightBulbIcon className="w-6 h-6 text-amber-400" />,
        [Genre.Technical]: <AcademicCapIcon className="w-6 h-6 text-rose-400" />,
    };
    return <div className="p-2 bg-white/50 dark:bg-dark-bg-tertiary rounded-full">{iconMap[genre] || <BookOpenIcon className="w-6 h-6 text-gray-600 dark:text-gray-400" />}</div>
}


const ProjectCard: React.FC<{ project: Project; onEdit: () => void; onDelete: () => void; }> = ({ project, onEdit, onDelete }) => {
    const setActiveProject = useBookCraftStore(state => state.setActiveProject);
    return (
        <Card className="hover:border-brand-primary transition-all duration-300 transform hover:-translate-y-1 flex flex-col">
            <div className="p-5 flex-grow">
                 <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-4">
                        <GenreIcon genre={project.genre} />
                        <div>
                             <h3 className="text-lg font-bold text-gray-900 dark:text-dark-text-primary truncate">{project.title}</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{project.genre}</p>
                        </div>
                    </div>
                    <StatusBadge status={project.status} />
                </div>
                
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">
                    Created on: {new Date(project.createdAt).toLocaleDateString()}
                </p>
            </div>
            <div className="bg-gray-50 dark:bg-dark-bg-tertiary p-3 border-t border-gray-200 dark:border-dark-border-primary flex items-center justify-between gap-2">
                <Button onClick={() => setActiveProject(project.id)} className="flex-grow" variant="secondary">
                    Open Project
                </Button>
                <div className="flex gap-2">
                    <Button onClick={onEdit} variant="secondary" className="!p-2.5" aria-label="Edit project">
                        <PencilIcon className="w-5 h-5"/>
                    </Button>
                    <Button onClick={onDelete} variant="danger" className="!p-2.5" aria-label="Delete project">
                        <TrashIcon className="w-5 h-5"/>
                    </Button>
                </div>
            </div>
        </Card>
    );
};

export const Dashboard: React.FC = () => {
    const projectsMap = useBookCraftStore(state => state.projects);
    // FIX: Type errors are resolved as the store now provides a strongly-typed Project map.
    // FIX: Convert createdAt string from persisted state back to a Date object before sorting.
    const projects = React.useMemo(() => 
        // FIX: Explicitly cast `Object.values` result to `Project[]` to resolve type inference issues.
        (Object.values(projectsMap) as Project[]).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()), 
        [projectsMap]
    );
    const isCreateModalOpen = useBookCraftStore(state => state.isCreateModalOpen);
    const toggleCreateModal = useBookCraftStore(state => state.toggleCreateModal);
    const deleteProject = useBookCraftStore(state => state.deleteProject);

    const [projectToEdit, setProjectToEdit] = useState<Project | null>(null);
    const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);

    const handleEdit = (project: Project) => {
        setProjectToEdit(project);
        toggleCreateModal(true);
    };

    const handleDeleteRequest = (project: Project) => {
        setProjectToDelete(project);
    };

    const handleConfirmDelete = () => {
        if (projectToDelete) {
            deleteProject(projectToDelete.id);
        }
    };


    return (
        <>
            <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
                <h2 className="text-3xl font-bold text-gray-900">My Projects</h2>
                <Button onClick={() => toggleCreateModal(true)}>
                    <PlusIcon className="w-5 h-5 mr-2" />
                    New Project
                </Button>
            </div>
            {projects.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {projects.map(p => 
                        <ProjectCard 
                            key={p.id} 
                            project={p} 
                            onEdit={() => handleEdit(p)}
                            onDelete={() => handleDeleteRequest(p)}
                        />
                    )}
                </div>
            ) : (
                <div className="text-center py-20 border-2 border-dashed border-gray-300 rounded-lg bg-gray-100/20">
                    <DocumentTextIcon className="mx-auto h-12 w-12 text-slate-600" />
                    <h3 className="mt-4 text-xl font-semibold text-gray-700">No Projects Yet</h3>
                    <p className="mt-2 text-gray-600">Get started by creating your first project.</p>
                    <div className="mt-6">
                         <Button onClick={() => toggleCreateModal(true)}>
                            <PlusIcon className="w-5 h-5 mr-2" />
                            Create Your First Project
                        </Button>
                    </div>
                </div>
            )}
            <CreateProjectModal 
                isOpen={isCreateModalOpen || !!projectToEdit} 
                onClose={() => {
                    toggleCreateModal(false);
                    setProjectToEdit(null);
                }}
                projectToEdit={projectToEdit}
            />
            <ConfirmationModal
                isOpen={!!projectToDelete}
                onClose={() => setProjectToDelete(null)}
                onConfirm={handleConfirmDelete}
                title="Delete Project"
                confirmText="Delete"
            >
                Are you sure you want to permanently delete "{projectToDelete?.title}"? This action cannot be undone.
            </ConfirmationModal>
        </>
    );
};
