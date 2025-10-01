
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
    const [customGenre, setCustomGenre] = useState('');
    const [showCustomGenre, setShowCustomGenre] = useState(false);
    const [visualStyle, setVisualStyle] = useState<string>(VisualStyle.Professional);
    const [customVisualStyle, setCustomVisualStyle] = useState('');
    const [showCustomVisualStyle, setShowCustomVisualStyle] = useState(false);
    const [description, setDescription] = useState('');

    const addProject = useBookCraftStore(state => state.addProject);
    const updateProject = useBookCraftStore(state => state.updateProject);
    const toast = useToast();

    useEffect(() => {
        if (projectToEdit) {
            setTitle(projectToEdit.title);
            setGenre(projectToEdit.genre);
            setVisualStyle(projectToEdit.visualStyle);
            setDescription(''); // Projects don't have description field yet, so default to empty
        } else {
            // Reset form for "create" mode
            setTitle('');
            setGenre(Genre.Fiction);
            setCustomGenre('');
            setShowCustomGenre(false);
            setVisualStyle(VisualStyle.Professional);
            setCustomVisualStyle('');
            setShowCustomVisualStyle(false);
            setDescription('');
        }
    }, [projectToEdit, isOpen]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) {
            toast.warning("Title Required", "A project title is required.");
            return;
        }

        // Use custom values if they're selected and provided
        const finalGenre = showCustomGenre && customGenre.trim() ? customGenre.trim() : genre;
        const finalVisualStyle = showCustomVisualStyle && customVisualStyle.trim() ? customVisualStyle.trim() : visualStyle;

        if (projectToEdit) {
            updateProject(projectToEdit.id, { title: title.trim(), genre: finalGenre, visualStyle: finalVisualStyle });
            toast.success("Project Updated", `"${title}" has been updated successfully.`);
        } else {
            addProject({ title: title.trim(), genre: finalGenre, visualStyle: finalVisualStyle, description: description.trim() });
            toast.success("Project Created", `"${title}" has been created successfully.`);
        }

        // Reset the form
        setTitle('');
        setGenre(Genre.Fiction);
        setCustomGenre('');
        setShowCustomGenre(false);
        setVisualStyle(VisualStyle.Professional);
        setCustomVisualStyle('');
        setShowCustomVisualStyle(false);
        setDescription('');

        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={projectToEdit ? "Edit Project" : "Create New Project"}>
            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label htmlFor="title" className="block text-sm font-medium text-slate-300">Project Title</label>
                    <input type="text" id="title" value={title} onChange={(e) => setTitle(e.target.value)} required
                        className="mt-1 block w-full bg-slate-700 border-slate-600 rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary sm:text-sm p-2 text-white placeholder-slate-400"
                        placeholder="e.g., The Last Voyage"
                     />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="genre" className="block text-sm font-medium text-slate-300">Genre</label>
                        {!showCustomGenre ? (
                            <div className="space-y-2">
                                <select
                                    id="genre"
                                    name="genre"
                                    value={genre}
                                    onChange={(e) => setGenre(e.target.value)}
                                    className="mt-1 block w-full bg-slate-700 border-slate-600 rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary sm:text-sm p-2 text-white"
                                >
                                    {Object.values(Genre).map(g => <option key={g} value={g}>{g}</option>)}
                                </select>
                                <button
                                    type="button"
                                    onClick={() => setShowCustomGenre(true)}
                                    className="text-xs text-brand-primary hover:text-brand-secondary underline"
                                >
                                    + Add custom genre
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <input
                                    type="text"
                                    value={customGenre}
                                    onChange={(e) => setCustomGenre(e.target.value)}
                                    placeholder="Enter custom genre..."
                                    className="mt-1 block w-full bg-slate-700 border-slate-600 rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary sm:text-sm p-2 text-white placeholder-slate-400"
                                />
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowCustomGenre(false);
                                        setCustomGenre('');
                                    }}
                                    className="text-xs text-slate-400 hover:text-slate-300 underline"
                                >
                                    ← Back to predefined genres
                                </button>
                            </div>
                        )}
                    </div>
                    <div>
                        <label htmlFor="visualStyle" className="block text-sm font-medium text-slate-300">Visual Style</label>
                        {!showCustomVisualStyle ? (
                            <div className="space-y-2">
                                <select
                                    id="visualStyle"
                                    name="visualStyle"
                                    value={visualStyle}
                                    onChange={(e) => setVisualStyle(e.target.value)}
                                    className="mt-1 block w-full bg-slate-700 border-slate-600 rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary sm:text-sm p-2 text-white"
                                >
                                    {Object.values(VisualStyle).map(vs => <option key={vs} value={vs}>{vs}</option>)}
                                </select>
                                <button
                                    type="button"
                                    onClick={() => setShowCustomVisualStyle(true)}
                                    className="text-xs text-brand-primary hover:text-brand-secondary underline"
                                >
                                    + Add custom style
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <input
                                    type="text"
                                    value={customVisualStyle}
                                    onChange={(e) => setCustomVisualStyle(e.target.value)}
                                    placeholder="Enter custom visual style..."
                                    className="mt-1 block w-full bg-slate-700 border-slate-600 rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary sm:text-sm p-2 text-white placeholder-slate-400"
                                />
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowCustomVisualStyle(false);
                                        setCustomVisualStyle('');
                                    }}
                                    className="text-xs text-slate-400 hover:text-slate-300 underline"
                                >
                                    ← Back to predefined styles
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                <div>
                    <label htmlFor="description" className="block text-sm font-medium text-slate-300">Description (Optional)</label>
                    <textarea
                        id="description"
                        name="description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Brief description of your project..."
                        rows={2}
                        className="mt-1 block w-full bg-slate-700 border-slate-600 rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary sm:text-sm p-2 text-white placeholder-slate-400 resize-none"
                    />
                </div>

                <p className="text-sm text-slate-400 text-center pt-2">
                    You can start adding chapters after creating the project.
                </p>

                <div className="flex justify-end space-x-3 pt-4 relative z-10">
                    <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
                    <Button type="submit" className="relative z-20">
                        {projectToEdit ? <PencilIcon className="w-5 h-5 mr-2"/> : <PlusIcon className="w-5 h-5 mr-2"/>}
                        {projectToEdit ? "Save Changes" : "Create Project"}
                    </Button>
                </div>
            </form>
        </Modal>
    );
};