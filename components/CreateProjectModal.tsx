
import React, { useState, useEffect } from 'react';
// FIX: Corrected import paths for store, types, and other components.
import { useBookCraftStore } from '../store/useStore';
import { Genre, VisualStyle, Project } from '../types';
import { Button, Modal } from './UI';
import { PlusIcon, PencilIcon } from './Icons';
import { useToast } from './Toast';

interface CreateProjectModalProps {
    isOpen: boolean;
    onClose: () => void;
    projectToEdit?: Project | null;
}

export const CreateProjectModal: React.FC<CreateProjectModalProps> = ({ isOpen, onClose, projectToEdit }) => {
    const [title, setTitle] = useState('');
    const [genre, setGenre] = useState<string>(Genre.Fiction);
    const [visualStyle, setVisualStyle] = useState<string>(VisualStyle.Professional);

    const addProject = useBookCraftStore(state => state.addProject);
    const updateProject = useBookCraftStore(state => state.updateProject);
    const toast = useToast();

    useEffect(() => {
        if (projectToEdit) {
            setTitle(projectToEdit.title);
            setGenre(projectToEdit.genre);
            setVisualStyle(projectToEdit.visualStyle);
        } else {
            // Reset form for "create" mode
            setTitle('');
            setGenre(Genre.Fiction);
            setVisualStyle(VisualStyle.Professional);
        }
    }, [projectToEdit, isOpen]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!title) {
            toast.warning("Title Required", "A project title is required.");
            return;
        }

        if (projectToEdit) {
            updateProject(projectToEdit.id, { title, genre, visualStyle });
        } else {
            addProject({ title, genre, visualStyle });
        }
        
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={projectToEdit ? "Edit Project" : "Create New Project"}>
            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label htmlFor="title" className="block text-sm font-medium text-slate-300">Project Title</label>
                    <input type="text" id="title" value={title} onChange={(e) => setTitle(e.target.value)} required
                        className="mt-1 block w-full bg-slate-700 border-slate-600 rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary sm:text-sm p-2"
                        placeholder="e.g., The Last Voyage"
                     />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="genre" className="block text-sm font-medium text-slate-300">Genre</label>
                        <input
                            type="text"
                            id="genre"
                            list="genre-list"
                            value={genre}
                            onChange={(e) => setGenre(e.target.value)}
                            className="mt-1 block w-full bg-slate-700 border-slate-600 rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary sm:text-sm p-2"
                            placeholder="e.g., Sci-Fi Thriller"
                        />
                        <datalist id="genre-list">
                            {Object.values(Genre).map(g => <option key={g} value={g} />)}
                        </datalist>
                    </div>
                    <div>
                        <label htmlFor="visualStyle" className="block text-sm font-medium text-slate-300">Visual Style</label>
                         <input
                            type="text"
                            id="visualStyle"
                            list="visualstyle-list"
                            value={visualStyle}
                            onChange={(e) => setVisualStyle(e.target.value)}
                            className="mt-1 block w-full bg-slate-700 border-slate-600 rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary sm:text-sm p-2"
                            placeholder="e.g., Cyberpunk"
                        />
                        <datalist id="visualstyle-list">
                            {Object.values(VisualStyle).map(vs => <option key={vs} value={vs} />)}
                        </datalist>
                    </div>
                </div>

                <p className="text-sm text-slate-400 text-center pt-2">
                    You can start adding chapters after creating the project.
                </p>

                <div className="flex justify-end space-x-3 pt-4">
                    <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
                    <Button type="submit">
                        {projectToEdit ? <PencilIcon className="w-5 h-5 mr-2"/> : <PlusIcon className="w-5 h-5 mr-2"/>}
                        {projectToEdit ? "Save Changes" : "Create Project"}
                    </Button>
                </div>
            </form>
        </Modal>
    );
};