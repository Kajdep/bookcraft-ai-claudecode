import React, { useState, useMemo } from 'react';
import { useBookCraftStore } from '../../store/useStore';
import { MaterialType, MaterialCategory, MaterialItem, MaterialFolder } from '../../types';
import { Button, Card, Input, Select } from '../UI';
import { log } from '../../services/logger';
import {
    PaperClipIcon,
    PlusIcon,
    FolderIcon,
    DocumentIcon,
    PhotoIcon,
    LinkIcon,
    SpeakerWaveIcon,
    VideoCameraIcon,
    ArchiveBoxIcon,
    MagnifyingGlassIcon,
    FunnelIcon,
    BookmarkIcon,
    HeartIcon,
    TagIcon,
    TrashIcon,
    PencilIcon,
    EyeIcon,
    ArrowDownTrayIcon
} from '../Icons';

interface MaterialCardProps {
    material: MaterialItem;
    onUpdate: (id: string, updates: Partial<MaterialItem>) => void;
    onDelete: (id: string) => void;
    onBookmark: (id: string) => void;
    onFavorite: (id: string) => void;
    onLink: (id: string, chapterId: string) => void;
}

const MaterialCard: React.FC<MaterialCardProps> = ({
    material,
    onUpdate,
    onDelete,
    onBookmark,
    onFavorite,
    onLink
}) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editTitle, setEditTitle] = useState(material.title);
    const [editDescription, setEditDescription] = useState(material.description || '');
    const [editTags, setEditTags] = useState(material.tags.join(', '));

    const chapters = useBookCraftStore(state => 
        state.activeProjectId ? state.projects[state.activeProjectId]?.chapters || [] : []
    );

    const handleSave = () => {
        onUpdate(material.id, {
            title: editTitle,
            description: editDescription,
            tags: editTags.split(',').map(tag => tag.trim()).filter(Boolean)
        });
        setIsEditing(false);
    };

    const handleCancel = () => {
        setEditTitle(material.title);
        setEditDescription(material.description || '');
        setEditTags(material.tags.join(', '));
        setIsEditing(false);
    };

    const getTypeIcon = (type: MaterialType) => {
        switch (type) {
            case MaterialType.Note:
                return <DocumentIcon className="w-4 h-4" />;
            case MaterialType.Image:
                return <PhotoIcon className="w-4 h-4" />;
            case MaterialType.Link:
                return <LinkIcon className="w-4 h-4" />;
            case MaterialType.Audio:
                return <SpeakerWaveIcon className="w-4 h-4" />;
            case MaterialType.Video:
                return <VideoCameraIcon className="w-4 h-4" />;
            case MaterialType.Archive:
                return <ArchiveBoxIcon className="w-4 h-4" />;
            default:
                return <DocumentIcon className="w-4 h-4" />;
        }
    };

    const getCategoryColor = (category: MaterialCategory) => {
        switch (category) {
            case MaterialCategory.Reference:
                return 'bg-blue-100 text-blue-800';
            case MaterialCategory.Inspiration:
                return 'bg-purple-100 text-purple-800';
            case MaterialCategory.Research:
                return 'bg-green-100 text-green-800';
            case MaterialCategory.Character:
                return 'bg-yellow-100 text-yellow-800';
            case MaterialCategory.Setting:
                return 'bg-indigo-100 text-indigo-800';
            case MaterialCategory.Plot:
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const retrieveFileFromIndexedDB = useBookCraftStore(state => state.retrieveFileFromIndexedDB);
    
    const handleView = async () => {
        if (material.type === MaterialType.Link && material.url) {
            window.open(material.url, '_blank');
        } else if (material.url) {
            if (material.url.startsWith('indexeddb://')) {
                // Retrieve file from IndexedDB
                const fileId = material.url.replace('indexeddb://', '');
                try {
                    const file = await retrieveFileFromIndexedDB(fileId);
                    if (file) {
                        const objectUrl = URL.createObjectURL(file);
                        window.open(objectUrl, '_blank');
                        // Clean up the object URL after some time
                        setTimeout(() => URL.revokeObjectURL(objectUrl), 60000);
                    } else {
                        log.error('MaterialTab: File not found in IndexedDB', { fileId });
                    }
                } catch (error) {
                    log.error('MaterialTab: Failed to retrieve file from IndexedDB', error);
                }
            } else {
                // Handle base64 or regular URLs
                window.open(material.url, '_blank');
            }
        }
    };

    const handleDownload = async () => {
        if (material.url && material.fileName) {
            if (material.url.startsWith('indexeddb://')) {
                // Retrieve file from IndexedDB for download
                const fileId = material.url.replace('indexeddb://', '');
                try {
                    const file = await retrieveFileFromIndexedDB(fileId);
                    if (file) {
                        const objectUrl = URL.createObjectURL(file);
                        const link = document.createElement('a');
                        link.href = objectUrl;
                        link.download = material.fileName;
                        link.click();
                        URL.revokeObjectURL(objectUrl);
                    } else {
                        log.error('MaterialTab: File not found in IndexedDB for download', { fileId });
                    }
                } catch (error) {
                    log.error('MaterialTab: Failed to retrieve file from IndexedDB for download', error);
                }
            } else {
                // Handle base64 or regular URLs
                const link = document.createElement('a');
                link.href = material.url;
                link.download = material.fileName;
                link.click();
            }
        }
    };

    return (
        <Card className="p-4 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-2 flex-1">
                    <div className="flex-shrink-0 text-slate-400">
                        {getTypeIcon(material.type)}
                    </div>
                    {isEditing ? (
                        <Input
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            className="flex-1 font-medium"
                            placeholder="Material title..."
                        />
                    ) : (
                        <h3 className="font-medium text-slate-200 flex-1 truncate">
                            {material.title}
                        </h3>
                    )}
                </div>
                <div className="flex items-center space-x-1 flex-shrink-0">
                    <button
                        onClick={() => onFavorite(material.id)}
                        className={`p-1 rounded hover:bg-slate-700 ${
                            material.isFavorite ? 'text-red-400' : 'text-slate-400'
                        }`}
                        title="Favorite"
                    >
                        <HeartIcon className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => onBookmark(material.id)}
                        className={`p-1 rounded hover:bg-slate-700 ${
                            material.isBookmarked ? 'text-yellow-400' : 'text-slate-400'
                        }`}
                        title="Bookmark"
                    >
                        <BookmarkIcon className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => setIsEditing(!isEditing)}
                        className="p-1 rounded hover:bg-slate-700 text-slate-400"
                        title="Edit"
                    >
                        <PencilIcon className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => onDelete(material.id)}
                        className="p-1 rounded hover:bg-slate-700 text-red-400"
                        title="Delete"
                    >
                        <TrashIcon className="w-4 h-4" />
                    </button>
                </div>
            </div>

            <div className="flex items-center space-x-2 mb-2">
                <span className={`px-2 py-1 text-xs rounded-full ${getCategoryColor(material.category)}`}>
                    {material.category}
                </span>
                <span className="text-xs text-slate-400">
                    {material.createdAt.toLocaleDateString()}
                </span>
                {material.fileSize && (
                    <span className="text-xs text-slate-400">
                        {formatFileSize(material.fileSize)}
                    </span>
                )}
            </div>

            {/* Thumbnail for images */}
            {material.thumbnail && (
                <div className="mb-3">
                    <img 
                        src={material.thumbnail} 
                        alt={material.title}
                        className="w-full h-32 object-cover rounded border"
                        onClick={handleView}
                    />
                </div>
            )}

            {/* Description */}
            {isEditing ? (
                <textarea
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    className="w-full p-2 bg-slate-700 border border-slate-600 rounded text-sm resize-none"
                    rows={3}
                    placeholder="Description..."
                />
            ) : (
                material.description && (
                    <p className="text-sm text-slate-400 mb-2 line-clamp-2">
                        {material.description}
                    </p>
                )
            )}

            {/* Content preview for notes */}
            {material.type === MaterialType.Note && material.content && !isEditing && (
                <p className="text-sm text-slate-300 mb-2 line-clamp-3 bg-slate-800/50 p-2 rounded">
                    {material.content}
                </p>
            )}

            {/* Tags */}
            {isEditing ? (
                <Input
                    value={editTags}
                    onChange={(e) => setEditTags(e.target.value)}
                    placeholder="Tags (comma separated)..."
                    className="text-sm mb-3"
                />
            ) : (
                material.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                        {material.tags.map((tag, index) => (
                            <span key={index} className="px-2 py-1 text-xs bg-slate-700 text-slate-300 rounded">
                                {tag}
                            </span>
                        ))}
                    </div>
                )
            )}

            {/* Linked chapters */}
            {material.linkedChapterIds.length > 0 && (
                <div className="mb-2">
                    <p className="text-xs text-slate-500 mb-1">Linked to:</p>
                    <div className="flex flex-wrap gap-1">
                        {material.linkedChapterIds.map((chapterId) => {
                            const chapter = chapters.find(c => c.id === chapterId);
                            return chapter ? (
                                <span key={chapterId} className="px-2 py-1 text-xs bg-blue-600 text-blue-100 rounded">
                                    {chapter.title}
                                </span>
                            ) : null;
                        })}
                    </div>
                </div>
            )}

            {/* Action buttons */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-700">
                {isEditing ? (
                    <div className="flex space-x-2">
                        <Button size="sm" onClick={handleSave}>
                            Save
                        </Button>
                        <Button size="sm" variant="secondary" onClick={handleCancel}>
                            Cancel
                        </Button>
                    </div>
                ) : (
                    <div className="flex space-x-2">
                        {(material.type === MaterialType.Link || material.type === MaterialType.Image) && (
                            <Button size="sm" variant="ghost" onClick={handleView}>
                                <EyeIcon className="w-4 h-4 mr-1" />
                                View
                            </Button>
                        )}
                        {material.fileName && (
                            <Button size="sm" variant="ghost" onClick={handleDownload}>
                                <ArrowDownTrayIcon className="w-4 h-4 mr-1" />
                                Download
                            </Button>
                        )}
                    </div>
                )}
                
                <div className="text-xs text-slate-500">
                    Modified: {material.lastModified.toLocaleDateString()}
                </div>
            </div>
        </Card>
    );
};

interface AddMaterialModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAdd: (type: 'note' | 'link' | 'file') => void;
}

const AddMaterialModal: React.FC<AddMaterialModalProps> = ({ isOpen, onClose, onAdd }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <Card className="p-6 max-w-md w-full mx-4">
                <h3 className="text-lg font-semibold mb-4">Add Material</h3>
                <div className="space-y-3">
                    <Button
                        onClick={() => { onAdd('note'); onClose(); }}
                        className="w-full justify-start"
                        variant="secondary"
                    >
                        <DocumentIcon className="w-4 h-4 mr-2" />
                        Create Note
                    </Button>
                    <Button
                        onClick={() => { onAdd('link'); onClose(); }}
                        className="w-full justify-start"
                        variant="secondary"
                    >
                        <LinkIcon className="w-4 h-4 mr-2" />
                        Add Link
                    </Button>
                    <Button
                        onClick={() => { onAdd('file'); onClose(); }}
                        className="w-full justify-start"
                        variant="secondary"
                    >
                        <PaperClipIcon className="w-4 h-4 mr-2" />
                        Upload File
                    </Button>
                </div>
                <div className="flex justify-end mt-6">
                    <Button variant="secondary" onClick={onClose}>
                        Cancel
                    </Button>
                </div>
            </Card>
        </div>
    );
};

export const MaterialTab: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState<MaterialType | ''>('');
    const [filterCategory, setFilterCategory] = useState<MaterialCategory | ''>('');
    const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
    const [showBookmarkedOnly, setShowBookmarkedOnly] = useState(false);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [newNoteTitle, setNewNoteTitle] = useState('');
    const [newNoteContent, setNewNoteContent] = useState('');
    const [newNoteCategory, setNewNoteCategory] = useState<MaterialCategory>(MaterialCategory.General);
    const [newLinkTitle, setNewLinkTitle] = useState('');
    const [newLinkUrl, setNewLinkUrl] = useState('');
    const [newLinkCategory, setNewLinkCategory] = useState<MaterialCategory>(MaterialCategory.General);
    const [showNoteForm, setShowNoteForm] = useState(false);
    const [showLinkForm, setShowLinkForm] = useState(false);

    // Store functions - ensure materials is always an array
    const materials = useBookCraftStore(state => {
        if (!state.activeProjectId) return [];
        const project = state.projects[state.activeProjectId];
        if (!project) return [];
        return Array.isArray(project.materials) ? project.materials : [];
    });
    const updateMaterial = useBookCraftStore(state => state.updateMaterial);
    const deleteMaterial = useBookCraftStore(state => state.deleteMaterial);
    const bookmarkMaterial = useBookCraftStore(state => state.bookmarkMaterial);
    const favoriteMaterial = useBookCraftStore(state => state.favoriteMaterial);
    const linkMaterialToChapter = useBookCraftStore(state => state.linkMaterialToChapter);
    const addMaterialNote = useBookCraftStore(state => state.addMaterialNote);
    const addMaterialLink = useBookCraftStore(state => state.addMaterialLink);
    const uploadMaterialFile = useBookCraftStore(state => state.uploadMaterialFile);

    // Filter and search materials
    const filteredMaterials = useMemo(() => {
        return materials.filter(material => {
            if (searchTerm && !material.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
                !material.description?.toLowerCase().includes(searchTerm.toLowerCase()) &&
                !material.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))) {
                return false;
            }
            if (filterType && material.type !== filterType) return false;
            if (filterCategory && material.category !== filterCategory) return false;
            if (showFavoritesOnly && !material.isFavorite) return false;
            if (showBookmarkedOnly && !material.isBookmarked) return false;
            return true;
        }).sort((a, b) => b.lastModified.getTime() - a.lastModified.getTime());
    }, [materials, searchTerm, filterType, filterCategory, showFavoritesOnly, showBookmarkedOnly]);

    const handleAddMaterial = (type: 'note' | 'link' | 'file') => {
        if (type === 'note') {
            setShowNoteForm(true);
        } else if (type === 'link') {
            setShowLinkForm(true);
        } else if (type === 'file') {
            // Trigger file input
            const input = document.createElement('input');
            input.type = 'file';
            input.multiple = true;
            input.onchange = (e) => {
                const files = (e.target as HTMLInputElement).files;
                if (files) {
                    Array.from(files).forEach(file => {
                        uploadMaterialFile(file, MaterialCategory.General);
                    });
                }
            };
            input.click();
        }
    };

    const handleCreateNote = () => {
        if (newNoteTitle && newNoteContent) {
            addMaterialNote(newNoteTitle, newNoteContent, newNoteCategory);
            setNewNoteTitle('');
            setNewNoteContent('');
            setNewNoteCategory(MaterialCategory.General);
            setShowNoteForm(false);
        }
    };

    const handleCreateLink = () => {
        if (newLinkTitle && newLinkUrl) {
            addMaterialLink(newLinkTitle, newLinkUrl, newLinkCategory);
            setNewLinkTitle('');
            setNewLinkUrl('');
            setNewLinkCategory(MaterialCategory.General);
            setShowLinkForm(false);
        }
    };

    const stats = useMemo(() => {
        return {
            total: materials.length,
            favorites: materials.filter(m => m.isFavorite).length,
            bookmarks: materials.filter(m => m.isBookmarked).length,
            notes: materials.filter(m => m.type === MaterialType.Note).length,
            images: materials.filter(m => m.type === MaterialType.Image).length,
            links: materials.filter(m => m.type === MaterialType.Link).length,
            documents: materials.filter(m => m.type === MaterialType.Document).length,
            totalSize: materials.reduce((total, material) => total + (material.fileSize || 0), 0)
        };
    }, [materials]);

    return (
        <div className="animate-fade-in space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold flex items-center">
                        <PaperClipIcon className="w-6 h-6 mr-2 text-brand-primary" />
                        Project Materials
                    </h2>
                    <p className="text-slate-400 mt-1">
                        Organize your notes, files, links, and reference materials.
                    </p>
                </div>
                <Button onClick={() => setIsAddModalOpen(true)}>
                    <PlusIcon className="w-4 h-4 mr-2" />
                    Add Material
                </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <Card className="p-4 text-center">
                    <div className="text-2xl font-bold text-slate-200">{stats.total}</div>
                    <div className="text-sm text-slate-400">Total Items</div>
                </Card>
                <Card className="p-4 text-center">
                    <div className="text-2xl font-bold text-red-400">{stats.favorites}</div>
                    <div className="text-sm text-slate-400">Favorites</div>
                </Card>
                <Card className="p-4 text-center">
                    <div className="text-2xl font-bold text-yellow-400">{stats.bookmarks}</div>
                    <div className="text-sm text-slate-400">Bookmarked</div>
                </Card>
                <Card className="p-4 text-center">
                    <div className="text-2xl font-bold text-blue-400">{stats.notes}</div>
                    <div className="text-sm text-slate-400">Notes</div>
                </Card>
                <Card className="p-4 text-center">
                    <div className="text-2xl font-bold text-green-400">
                        {(stats.totalSize / (1024 * 1024)).toFixed(1)}MB
                    </div>
                    <div className="text-sm text-slate-400" title="Files are stored locally using IndexedDB for better performance. Large files (>50MB) will prompt for external storage.">
                        Storage Used
                    </div>
                </Card>
            </div>

            {/* Filters and Search */}
            <Card className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                    <div className="md:col-span-2">
                        <Input
                            placeholder="Search materials..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            icon={<MagnifyingGlassIcon className="w-4 h-4" />}
                        />
                    </div>
                    <div>
                        <Select
                            value={filterType}
                            onChange={(e) => setFilterType(e.target.value as MaterialType | '')}
                        >
                            <option value="">All Types</option>
                            {Object.values(MaterialType).map(type => (
                                <option key={type} value={type}>{type}</option>
                            ))}
                        </Select>
                    </div>
                    <div>
                        <Select
                            value={filterCategory}
                            onChange={(e) => setFilterCategory(e.target.value as MaterialCategory | '')}
                        >
                            <option value="">All Categories</option>
                            {Object.values(MaterialCategory).map(category => (
                                <option key={category} value={category}>{category}</option>
                            ))}
                        </Select>
                    </div>
                    <div className="flex items-center space-x-4">
                        <label className="flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={showFavoritesOnly}
                                onChange={(e) => setShowFavoritesOnly(e.target.checked)}
                                className="mr-2"
                            />
                            <HeartIcon className="w-4 h-4 text-red-400" />
                        </label>
                        <label className="flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={showBookmarkedOnly}
                                onChange={(e) => setShowBookmarkedOnly(e.target.checked)}
                                className="mr-2"
                            />
                            <BookmarkIcon className="w-4 h-4 text-yellow-400" />
                        </label>
                    </div>
                    <div className="flex items-center text-sm text-slate-400">
                        {filteredMaterials.length} of {materials.length} items
                    </div>
                </div>
            </Card>

            {/* Materials Grid */}
            {filteredMaterials.length === 0 ? (
                <Card className="p-12 text-center">
                    <PaperClipIcon className="mx-auto h-12 w-12 text-slate-600 mb-4" />
                    <h3 className="text-xl font-semibold text-slate-300 mb-2">
                        {materials.length === 0 ? 'No Materials Yet' : 'No Matching Materials'}
                    </h3>
                    <p className="text-slate-400 mb-6">
                        {materials.length === 0 
                            ? 'Start building your materials library by adding notes, files, or links.'
                            : 'Try adjusting your search or filter criteria.'
                        }
                    </p>
                    {materials.length === 0 && (
                        <Button onClick={() => setIsAddModalOpen(true)}>
                            <PlusIcon className="w-4 h-4 mr-2" />
                            Add Your First Material
                        </Button>
                    )}
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredMaterials.map(material => (
                        <MaterialCard
                            key={material.id}
                            material={material}
                            onUpdate={updateMaterial}
                            onDelete={deleteMaterial}
                            onBookmark={bookmarkMaterial}
                            onFavorite={favoriteMaterial}
                            onLink={linkMaterialToChapter}
                        />
                    ))}
                </div>
            )}

            {/* Add Material Modal */}
            <AddMaterialModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onAdd={handleAddMaterial}
            />

            {/* Add Note Form */}
            {showNoteForm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <Card className="p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                        <h3 className="text-lg font-semibold mb-4">Create Note</h3>
                        <div className="space-y-4">
                            <Input
                                placeholder="Note title..."
                                value={newNoteTitle}
                                onChange={(e) => setNewNoteTitle(e.target.value)}
                            />
                            <Select
                                value={newNoteCategory}
                                onChange={(e) => setNewNoteCategory(e.target.value as MaterialCategory)}
                            >
                                {Object.values(MaterialCategory).map(category => (
                                    <option key={category} value={category}>{category}</option>
                                ))}
                            </Select>
                            <textarea
                                placeholder="Write your note content here..."
                                value={newNoteContent}
                                onChange={(e) => setNewNoteContent(e.target.value)}
                                className="w-full p-3 bg-slate-700 border border-slate-600 rounded resize-none"
                                rows={10}
                            />
                        </div>
                        <div className="flex justify-end space-x-3 mt-6">
                            <Button variant="secondary" onClick={() => setShowNoteForm(false)}>
                                Cancel
                            </Button>
                            <Button 
                                onClick={handleCreateNote}
                                disabled={!newNoteTitle || !newNoteContent}
                            >
                                Create Note
                            </Button>
                        </div>
                    </Card>
                </div>
            )}

            {/* Add Link Form */}
            {showLinkForm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <Card className="p-6 max-w-md w-full mx-4">
                        <h3 className="text-lg font-semibold mb-4">Add Link</h3>
                        <div className="space-y-4">
                            <Input
                                placeholder="Link title..."
                                value={newLinkTitle}
                                onChange={(e) => setNewLinkTitle(e.target.value)}
                            />
                            <Input
                                placeholder="https://..."
                                value={newLinkUrl}
                                onChange={(e) => setNewLinkUrl(e.target.value)}
                                type="url"
                            />
                            <Select
                                value={newLinkCategory}
                                onChange={(e) => setNewLinkCategory(e.target.value as MaterialCategory)}
                            >
                                {Object.values(MaterialCategory).map(category => (
                                    <option key={category} value={category}>{category}</option>
                                ))}
                            </Select>
                        </div>
                        <div className="flex justify-end space-x-3 mt-6">
                            <Button variant="secondary" onClick={() => setShowLinkForm(false)}>
                                Cancel
                            </Button>
                            <Button 
                                onClick={handleCreateLink}
                                disabled={!newLinkTitle || !newLinkUrl}
                            >
                                Add Link
                            </Button>
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
};
