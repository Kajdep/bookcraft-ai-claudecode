import React, { useState, useMemo } from 'react';
import { Card, Button, Input } from '../UI';
import { MagnifyingGlassIcon, BookOpenIcon, BeakerIcon, DocumentTextIcon, ClockIcon, ChartBarIcon, UserGroupIcon, SparklesIcon, TrashIcon, TagIcon, FolderIcon, PlusIcon, StarIcon, LinkIcon, GlobeAltIcon, DocumentDuplicateIcon, ExclamationTriangleIcon, CheckCircleIcon, EyeIcon, GridIcon, ListIcon, TimelineIcon, ShareIcon, RocketLaunchIcon } from '../Icons';
import { useBookCraftStore } from '../../store/useStore';
import { ResearchType, ResearchConfidence, SourceCredibility, ResearchItem, ResearchFolder, ResearchFolderType, CitationStyle } from '../../types';
import { ResearchTemplatesModal } from './ResearchTemplatesModal';
import { ContradictionDetectionPanel } from './ContradictionDetectionPanel';
import { log } from '../../services/logger';

const ResearchTypeIcon: React.FC<{ type: ResearchType; className?: string }> = ({ type, className = "w-4 h-4" }) => {
    const icons = {
        [ResearchType.FactCheck]: BeakerIcon,
        [ResearchType.TopicalResearch]: BookOpenIcon,
        [ResearchType.SourceVerification]: DocumentTextIcon,
        [ResearchType.QuickLookup]: SparklesIcon,
        [ResearchType.Historical]: ClockIcon,
        [ResearchType.Statistical]: ChartBarIcon,
        [ResearchType.Expert]: UserGroupIcon
    };
    const Icon = icons[type];
    return <Icon className={className} />;
};

const ConfidenceBadge: React.FC<{ confidence: ResearchConfidence }> = ({ confidence }) => {
    const colors = {
        [ResearchConfidence.High]: 'bg-green-100 text-green-800 border-green-300',
        [ResearchConfidence.Medium]: 'bg-yellow-100 text-yellow-800 border-yellow-300',
        [ResearchConfidence.Low]: 'bg-red-100 text-red-800 border-red-300',
        [ResearchConfidence.Unknown]: 'bg-gray-100 text-gray-800 border-gray-300'
    };

    return (
        <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded border ${colors[confidence]}`}>
            {confidence}
        </span>
    );
};

// Enhanced components for the new research system
const FolderIcon_Component: React.FC<{ type: ResearchFolderType; className?: string }> = ({ type, className = "w-4 h-4" }) => {
    const icons = {
        [ResearchFolderType.Default]: FolderIcon,
        [ResearchFolderType.Chapter]: BookOpenIcon,
        [ResearchFolderType.Theme]: TagIcon,
        [ResearchFolderType.Character]: UserGroupIcon,
        [ResearchFolderType.Location]: GlobeAltIcon,
        [ResearchFolderType.Technical]: BeakerIcon,
        [ResearchFolderType.Historical]: ClockIcon
    };
    const Icon = icons[type];
    return <Icon className={className} />;
};

const QualityScoreIndicator: React.FC<{ score?: number }> = ({ score }) => {
    if (!score) return null;

    const color = score >= 80 ? 'text-green-400' : score >= 60 ? 'text-yellow-400' : 'text-red-400';
    return <span className={`text-xs ${color} font-medium`}>{score}/100</span>;
};

const ResearchItemCard: React.FC<{
    item: ResearchItem;
    onDelete: (id: string) => void;
    onBookmark: (id: string) => void;
    onMoveToFolder: (id: string, folderId: string) => void;
    folders: ResearchFolder[];
    selected: boolean;
    onSelect: (id: string) => void;
}> = ({ item, onDelete, onBookmark, onMoveToFolder, folders, selected, onSelect }) => {
    const [expanded, setExpanded] = useState(false);
    const [showMoveMenu, setShowMoveMenu] = useState(false);

    return (
        <Card className={`p-4 mb-4 transition-all border-2 ${selected ? 'border-brand-primary bg-slate-800/30' : 'border-transparent hover:shadow-lg'}`}>
            <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                    <input
                        type="checkbox"
                        checked={selected}
                        onChange={() => onSelect(item.id)}
                        className="mt-1 rounded border-slate-600 bg-slate-800 text-brand-primary focus:ring-brand-primary"
                    />

                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                            <ResearchTypeIcon type={item.type} />
                            <h4 className="text-sm font-medium text-slate-200">{item.query}</h4>
                            <ConfidenceBadge confidence={item.confidence} />
                            <QualityScoreIndicator score={item.qualityScore} />
                            {item.isBookmarked && <StarIcon className="w-4 h-4 text-yellow-400" />}
                            {item.contradictions && item.contradictions.length > 0 && (
                                <ExclamationTriangleIcon className="w-4 h-4 text-red-400" title="Has contradictions" />
                            )}
                            {item.verified && <CheckCircleIcon className="w-4 h-4 text-green-400" title="Verified" />}
                        </div>

                        <p className="text-sm text-slate-300 mb-3">{item.summary}</p>

                        <div className="flex items-center justify-between text-xs text-slate-500 mb-3">
                            <span>{item.wordCount} words • {new Date(item.createdAt).toLocaleDateString()}</span>
                            {item.linkedChapterIds.length > 0 && (
                                <span className="flex items-center gap-1">
                                    <LinkIcon className="w-3 h-3" />
                                    {item.linkedChapterIds.length} chapter{item.linkedChapterIds.length > 1 ? 's' : ''}
                                </span>
                            )}
                        </div>

                        {item.tags.length > 0 && (
                            <div className="flex items-center gap-1 mb-3 flex-wrap">
                                <TagIcon className="w-3 h-3 text-slate-500" />
                                {item.tags.map(tag => (
                                    <span key={tag} className="inline-flex items-center px-2 py-1 text-xs bg-slate-700 text-slate-300 rounded">
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        )}

                        {expanded && (
                            <div className="mt-3 p-3 bg-slate-800/50 rounded-lg">
                                <div className="prose prose-sm prose-invert max-w-none">
                                    <p className="text-slate-300">{item.content}</p>
                                </div>

                                {item.sources.length > 0 && (
                                    <div className="mt-4">
                                        <h5 className="text-xs font-medium text-slate-400 mb-2">Sources:</h5>
                                        {item.sources.map(source => (
                                            <div key={source.id} className="text-xs text-slate-400 mb-1 flex items-center justify-between">
                                                <span>• {source.title} ({source.credibility})</span>
                                                {source.url && (
                                                    <a href={source.url} target="_blank" rel="noopener noreferrer"
                                                       className="text-brand-primary hover:text-brand-secondary">
                                                        <GlobeAltIcon className="w-3 h-3" />
                                                    </a>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {item.attachments && item.attachments.length > 0 && (
                                    <div className="mt-4">
                                        <h5 className="text-xs font-medium text-slate-400 mb-2">Attachments:</h5>
                                        {item.attachments.map(attachment => (
                                            <div key={attachment.id} className="text-xs text-slate-400 mb-1 flex items-center gap-2">
                                                <DocumentDuplicateIcon className="w-3 h-3" />
                                                {attachment.name} ({(attachment.size! / 1024).toFixed(1)} KB)
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {item.contradictions && item.contradictions.length > 0 && (
                                    <div className="mt-4">
                                        <h5 className="text-xs font-medium text-red-400 mb-2">Contradictions:</h5>
                                        {item.contradictions.map(contradiction => (
                                            <div key={contradiction.id} className="text-xs text-red-300 mb-1 p-2 bg-red-900/20 rounded">
                                                <span className="font-medium">{contradiction.conflictType}:</span> {contradiction.description}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-2 ml-4">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onBookmark(item.id)}
                        className={`${item.isBookmarked ? 'text-yellow-400' : 'text-slate-400'} hover:text-yellow-300`}
                        title="Bookmark"
                    >
                        <StarIcon className="w-4 h-4" />
                    </Button>

                    <div className="relative">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowMoveMenu(!showMoveMenu)}
                            className="text-slate-400 hover:text-slate-200"
                            title="Move to folder"
                        >
                            <FolderIcon className="w-4 h-4" />
                        </Button>

                        {showMoveMenu && (
                            <div className="absolute right-0 top-8 bg-slate-800 border border-slate-600 rounded-lg shadow-lg z-10 min-w-[200px]">
                                <div className="p-2">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                            onMoveToFolder(item.id, '');
                                            setShowMoveMenu(false);
                                        }}
                                        className="w-full text-left text-slate-300 hover:text-slate-100"
                                    >
                                        Move to Root
                                    </Button>
                                    {folders.map(folder => (
                                        <Button
                                            key={folder.id}
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => {
                                                onMoveToFolder(item.id, folder.id);
                                                setShowMoveMenu(false);
                                            }}
                                            className="w-full text-left text-slate-300 hover:text-slate-100 flex items-center gap-2"
                                        >
                                            <FolderIcon_Component type={folder.type} className="w-3 h-3" />
                                            {folder.name}
                                        </Button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setExpanded(!expanded)}
                        className="text-slate-400 hover:text-slate-200"
                    >
                        <EyeIcon className="w-4 h-4" />
                    </Button>

                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDelete(item.id)}
                        className="text-red-400 hover:text-red-300"
                    >
                        <TrashIcon className="w-4 h-4" />
                    </Button>
                </div>
            </div>
        </Card>
    );
};

const FolderCard: React.FC<{
    folder: ResearchFolder;
    itemCount: number;
    onSelect: () => void;
    onEdit: (folder: ResearchFolder) => void;
    onDelete: (id: string) => void;
    isActive: boolean;
}> = ({ folder, itemCount, onSelect, onEdit, onDelete, isActive }) => {
    return (
        <Card
            className={`p-4 mb-2 cursor-pointer transition-all ${
                isActive ? 'border-brand-primary bg-slate-800/50' : 'hover:bg-slate-800/30'
            }`}
            onClick={onSelect}
        >
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div
                        className="w-4 h-4 rounded"
                        style={{ backgroundColor: folder.color }}
                    />
                    <FolderIcon_Component type={folder.type} className="w-4 h-4 text-slate-400" />
                    <div>
                        <h4 className="text-sm font-medium text-slate-200">{folder.name}</h4>
                        <p className="text-xs text-slate-500">{itemCount} items</p>
                    </div>
                </div>

                <div className="flex items-center gap-1">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                            e.stopPropagation();
                            onEdit(folder);
                        }}
                        className="text-slate-400 hover:text-slate-200"
                    >
                        Edit
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                            e.stopPropagation();
                            onDelete(folder.id);
                        }}
                        className="text-red-400 hover:text-red-300"
                    >
                        <TrashIcon className="w-3 h-3" />
                    </Button>
                </div>
            </div>
        </Card>
    );
};

export const ResearchTab: React.FC = () => {
    const [query, setQuery] = useState('');
    const [selectedType, setSelectedType] = useState<ResearchType>(ResearchType.TopicalResearch);
    const [searchTerm, setSearchTerm] = useState('');
    const [showNewFolderModal, setShowNewFolderModal] = useState(false);
    const [showEditFolderModal, setShowEditFolderModal] = useState(false);
    const [showTemplatesModal, setShowTemplatesModal] = useState(false);
    const [showContradictionPanel, setShowContradictionPanel] = useState(false);
    const [editingFolder, setEditingFolder] = useState<ResearchFolder | null>(null);
    const [newFolderName, setNewFolderName] = useState('');
    const [newFolderType, setNewFolderType] = useState<ResearchFolderType>(ResearchFolderType.Default);
    const [newFolderColor, setNewFolderColor] = useState('#6B7280');
    const [newFolderTags, setNewFolderTags] = useState<string[]>([]);
    const [tagInput, setTagInput] = useState('');
    const [showBulkActions, setShowBulkActions] = useState(false);
    const [urlToSummarize, setUrlToSummarize] = useState('');

    // Store hooks
    const activeProjectId = useBookCraftStore(state => state.activeProjectId);
    const project = useBookCraftStore(state => activeProjectId ? state.projects[activeProjectId] : null);
    const isResearching = useBookCraftStore(state => state.isResearching);
    
    // Early return if no project is active
    if (!activeProjectId || !project) {
        return (
            <div className="animate-fade-in max-w-7xl mx-auto p-8 text-center">
                <h2 className="text-2xl font-bold text-slate-100 mb-2">Research Intelligence Hub</h2>
                <p className="text-slate-400 mb-4">Please select a project to access research tools.</p>
            </div>
        );
    }
    const isAnalyzingThemes = useBookCraftStore(state => state.isAnalyzingThemes);
    const isDetectingContradictions = useBookCraftStore(state => state.isDetectingContradictions);
    const selectedResearchItems = useBookCraftStore(state => state.selectedResearchItems);
    const activeResearchFolder = useBookCraftStore(state => state.activeResearchFolder);
    const researchView = useBookCraftStore(state => state.researchView);
    const researchFilters = useBookCraftStore(state => state.researchFilters);

    // Actions
    const performResearch = useBookCraftStore(state => state.performResearch);
    const deleteResearchItem = useBookCraftStore(state => state.deleteResearchItem);
    const searchResearch = useBookCraftStore(state => state.searchResearch);
    const bookmarkResearchItem = useBookCraftStore(state => state.bookmarkResearchItem);
    const moveResearchToFolder = useBookCraftStore(state => state.moveResearchToFolder);
    const createResearchFolder = useBookCraftStore(state => state.createResearchFolder);
    const updateResearchFolder = useBookCraftStore(state => state.updateResearchFolder);
    const deleteResearchFolder = useBookCraftStore(state => state.deleteResearchFolder);
    const setActiveResearchFolder = useBookCraftStore(state => state.setActiveResearchFolder);
    const setResearchView = useBookCraftStore(state => state.setResearchView);
    const toggleResearchItemSelection = useBookCraftStore(state => state.toggleResearchItemSelection);
    const selectResearchItems = useBookCraftStore(state => state.selectResearchItems);
    const analyzeResearchThemes = useBookCraftStore(state => state.analyzeResearchThemes);
    const detectContradictions = useBookCraftStore(state => state.detectContradictions);
    const summarizeWebContent = useBookCraftStore(state => state.summarizeWebContent);

    // Computed values
    const filteredResearch = useMemo(() => {
        let items = searchTerm ? searchResearch(searchTerm) : project?.research || [];

        // Apply folder filter
        if (activeResearchFolder) {
            items = items.filter(item => item.folderId === activeResearchFolder);
        } else if (activeResearchFolder === null) {
            items = items.filter(item => !item.folderId);
        }

        // Apply other filters
        if (researchFilters.confidence) {
            items = items.filter(item => item.confidence === researchFilters.confidence);
        }
        if (researchFilters.type) {
            items = items.filter(item => item.type === researchFilters.type);
        }
        if (researchFilters.verified !== undefined) {
            items = items.filter(item => item.verified === researchFilters.verified);
        }
        if (researchFilters.tags && researchFilters.tags.length > 0) {
            items = items.filter(item =>
                researchFilters.tags!.some(tag => item.tags.includes(tag))
            );
        }

        return items;
    }, [searchTerm, project?.research, activeResearchFolder, researchFilters, searchResearch]);

    const folderCounts = useMemo(() => {
        const counts: Record<string, number> = {};
        project?.research.forEach(item => {
            const folderId = item.folderId || 'root';
            counts[folderId] = (counts[folderId] || 0) + 1;
        });
        return counts;
    }, [project?.research]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim()) return;

        await performResearch(query, selectedType);
        setQuery('');
    };

    const handleCreateFolder = () => {
        if (newFolderName.trim()) {
            createResearchFolder(newFolderName.trim(), newFolderType);
            setNewFolderName('');
            setNewFolderType(ResearchFolderType.Default);
            setNewFolderColor('#6B7280');
            setNewFolderTags([]);
            setShowNewFolderModal(false);
        }
    };

    const handleEditFolder = (folder: ResearchFolder) => {
        setEditingFolder(folder);
        setNewFolderName(folder.name);
        setNewFolderType(folder.type);
        setNewFolderColor(folder.color || '#6B7280');
        setNewFolderTags(folder.tags || []);
        setShowEditFolderModal(true);
    };

    const handleUpdateFolder = () => {
        if (editingFolder && newFolderName.trim()) {
            updateResearchFolder(editingFolder.id, {
                name: newFolderName.trim(),
                type: newFolderType,
                color: newFolderColor,
                tags: newFolderTags
            });
            setEditingFolder(null);
            setNewFolderName('');
            setNewFolderType(ResearchFolderType.Default);
            setNewFolderColor('#6B7280');
            setNewFolderTags([]);
            setShowEditFolderModal(false);
        }
    };

    const handleAddTag = () => {
        if (tagInput.trim() && !newFolderTags.includes(tagInput.trim())) {
            setNewFolderTags([...newFolderTags, tagInput.trim()]);
            setTagInput('');
        }
    };

    const handleRemoveTag = (tag: string) => {
        setNewFolderTags(newFolderTags.filter(t => t !== tag));
    };

    const handleSummarizeUrl = async () => {
        if (urlToSummarize.trim()) {
            try {
                await summarizeWebContent(urlToSummarize.trim());
                setUrlToSummarize('');
            } catch (error) {
                log.error('ResearchTab: Failed to summarize URL', error);
            }
        }
    };

    const handleBulkDelete = () => {
        selectedResearchItems.forEach(itemId => {
            deleteResearchItem(itemId);
        });
        selectResearchItems([]);
        setShowBulkActions(false);
    };

    const handleSelectAll = () => {
        if (selectedResearchItems.length === filteredResearch.length) {
            selectResearchItems([]);
        } else {
            selectResearchItems(filteredResearch.map(item => item.id));
        }
    };

    return (
        <div className="animate-fade-in max-w-7xl mx-auto">
            <div className="mb-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-100 mb-2">Research Intelligence Hub</h2>
                        <p className="text-slate-400">
                            AI-powered research, fact-checking, and knowledge organization
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Research Templates */}
                        <Button
                            onClick={() => setShowTemplatesModal(true)}
                            className="bg-purple-600 hover:bg-purple-700"
                        >
                            <RocketLaunchIcon className="w-4 h-4 mr-2" />
                            Templates
                        </Button>
                        
                        {/* View Toggle */}
                        <div className="flex items-center gap-1 bg-slate-800 rounded-lg p-1">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setResearchView('list')}
                                className={researchView === 'list' ? 'bg-slate-700' : ''}
                            >
                                <ListIcon className="w-4 h-4" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setResearchView('grid')}
                                className={researchView === 'grid' ? 'bg-slate-700' : ''}
                            >
                                <GridIcon className="w-4 h-4" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setResearchView('timeline')}
                                className={researchView === 'timeline' ? 'bg-slate-700' : ''}
                            >
                                <TimelineIcon className="w-4 h-4" />
                            </Button>
                        </div>

                        {/* AI Analysis Actions */}
                        <Button
                            onClick={analyzeResearchThemes}
                            disabled={isAnalyzingThemes || !project?.research.length}
                            className="bg-purple-600 hover:bg-purple-700"
                        >
                            {isAnalyzingThemes ? (
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    Analyzing
                                </div>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <TagIcon className="w-4 h-4" />
                                    Analyze Themes
                                </div>
                            )}
                        </Button>

                        <Button
                            onClick={() => setShowContradictionPanel(!showContradictionPanel)}
                            className={`${showContradictionPanel ? 'bg-orange-700' : 'bg-orange-600 hover:bg-orange-700'}`}
                        >
                            <ExclamationTriangleIcon className="w-4 h-4 mr-2" />
                            Contradiction Analysis
                        </Button>
                    </div>
                </div>
            </div>

            {/* Research Input Section */}
            {/* Contradiction Detection Panel */}
            {showContradictionPanel && (
                <div className="mb-6">
                    <ContradictionDetectionPanel className="" />
                </div>
            )}
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* Traditional Research */}
                <Card className="p-6">
                    <h3 className="text-lg font-semibold text-slate-200 mb-4">AI Research</h3>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Research Type
                            </label>
                            <select
                                value={selectedType}
                                onChange={(e) => setSelectedType(e.target.value as ResearchType)}
                                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-primary"
                            >
                                {Object.values(ResearchType).map(type => (
                                    <option key={type} value={type}>{type}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Research Query
                            </label>
                            <div className="flex gap-2">
                                <Input
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    placeholder="e.g., Victorian medical practices in London"
                                    className="flex-1"
                                    disabled={isResearching}
                                />
                                <Button
                                    type="submit"
                                    disabled={isResearching || !query.trim()}
                                    className="min-w-[100px]"
                                >
                                    {isResearching ? (
                                        <div className="flex items-center gap-2">
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                            Research
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            <MagnifyingGlassIcon className="w-4 h-4" />
                                            Research
                                        </div>
                                    )}
                                </Button>
                            </div>
                        </div>
                    </form>
                </Card>

                {/* Web Content Summarization */}
                <Card className="p-6">
                    <h3 className="text-lg font-semibold text-slate-200 mb-4">Web Content Analysis</h3>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                URL to Summarize
                            </label>
                            <div className="flex gap-2">
                                <Input
                                    value={urlToSummarize}
                                    onChange={(e) => setUrlToSummarize(e.target.value)}
                                    placeholder="https://example.com/article"
                                    className="flex-1"
                                    disabled={isResearching}
                                />
                                <Button
                                    onClick={handleSummarizeUrl}
                                    disabled={isResearching || !urlToSummarize.trim()}
                                    className="min-w-[120px] bg-green-600 hover:bg-green-700"
                                >
                                    {isResearching ? (
                                        <div className="flex items-center gap-2">
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                            Summarizing
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            <GlobeAltIcon className="w-4 h-4" />
                                            Summarize
                                        </div>
                                    )}
                                </Button>
                            </div>
                        </div>

                        <div className="text-sm text-slate-400">
                            Enter a URL to automatically extract and summarize web content for your research.
                        </div>
                    </div>
                </Card>
            </div>

            {/* Research Organization */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Sidebar: Folders and Filters */}
                <div className="lg:col-span-1">
                    <Card className="p-4 mb-4">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-slate-200">Folders</h3>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setShowNewFolderModal(true)}
                                className="text-slate-400 hover:text-slate-200"
                            >
                                <PlusIcon className="w-4 h-4" />
                            </Button>
                        </div>

                        {/* Root folder */}
                        <FolderCard
                            folder={{
                                id: 'root',
                                name: 'All Research',
                                type: ResearchFolderType.Default,
                                tags: [],
                                createdAt: new Date(),
                                color: '#6B7280'
                            }}
                            itemCount={folderCounts['root'] || 0}
                            onSelect={() => setActiveResearchFolder(null)}
                            onEdit={() => {}}
                            onDelete={() => {}}
                            isActive={activeResearchFolder === null}
                        />

                        {/* User folders */}
                        {project?.researchFolders.map(folder => (
                            <FolderCard
                                key={folder.id}
                                folder={folder}
                                itemCount={folderCounts[folder.id] || 0}
                                onSelect={() => setActiveResearchFolder(folder.id)}
                                onEdit={() => handleEditFolder(folder)}
                                onDelete={deleteResearchFolder}
                                isActive={activeResearchFolder === folder.id}
                            />
                        ))}
                    </Card>

                    {/* Quick Stats */}
                    <Card className="p-4">
                        <h4 className="text-sm font-medium text-slate-300 mb-3">Research Stats</h4>
                        <div className="space-y-2 text-xs text-slate-400">
                            <div className="flex justify-between">
                                <span>Total Items:</span>
                                <span>{project?.research.length || 0}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>High Confidence:</span>
                                <span>{project?.research.filter(r => r.confidence === ResearchConfidence.High).length || 0}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Verified:</span>
                                <span>{project?.research.filter(r => r.verified).length || 0}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Bookmarked:</span>
                                <span>{project?.research.filter(r => r.isBookmarked).length || 0}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>With Contradictions:</span>
                                <span className="text-red-400">{project?.research.filter(r => r.contradictions && r.contradictions.length > 0).length || 0}</span>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Main Content Area */}
                <div className="lg:col-span-3">
                    {/* Search and Bulk Actions */}
                    <Card className="p-4 mb-4">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-4 flex-1">
                                <Input
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="Search research..."
                                    className="max-w-md"
                                />

                                {selectedResearchItems.length > 0 && (
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm text-slate-400">
                                            {selectedResearchItems.length} selected
                                        </span>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setShowBulkActions(!showBulkActions)}
                                            className="text-slate-400 hover:text-slate-200"
                                        >
                                            Actions
                                        </Button>
                                    </div>
                                )}
                            </div>

                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleSelectAll}
                                className="text-slate-400 hover:text-slate-200"
                            >
                                {selectedResearchItems.length === filteredResearch.length && filteredResearch.length > 0
                                    ? 'Deselect All'
                                    : 'Select All'
                                }
                            </Button>
                        </div>

                        {showBulkActions && selectedResearchItems.length > 0 && (
                            <div className="flex items-center gap-2 p-3 bg-slate-800/50 rounded-lg">
                                <Button
                                    onClick={handleBulkDelete}
                                    className="bg-red-600 hover:bg-red-700"
                                >
                                    Delete Selected
                                </Button>
                                <Button variant="outline">
                                    Export Selected
                                </Button>
                                <Button variant="outline">
                                    Tag Selected
                                </Button>
                            </div>
                        )}
                    </Card>

                    {/* Research Items */}
                    {filteredResearch.length === 0 ? (
                        <Card className="p-8 text-center">
                            <MagnifyingGlassIcon className="mx-auto h-12 w-12 text-slate-600 mb-4" />
                            <h3 className="text-lg font-semibold text-slate-300 mb-2">
                                {searchTerm ? 'No matching research found' : 'No research yet'}
                            </h3>
                            <p className="text-slate-400">
                                {searchTerm
                                    ? 'Try adjusting your search terms or filters.'
                                    : 'Start by entering a research query or URL above to gather information for your book.'
                                }
                            </p>
                        </Card>
                    ) : (
                        <div className={researchView === 'grid' ? 'grid grid-cols-1 lg:grid-cols-2 gap-4' : 'space-y-4'}>
                            {filteredResearch
                                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                                .map(item => (
                                    <ResearchItemCard
                                        key={item.id}
                                        item={item}
                                        onDelete={deleteResearchItem}
                                        onBookmark={bookmarkResearchItem}
                                        onMoveToFolder={moveResearchToFolder}
                                        folders={project?.researchFolders || []}
                                        selected={selectedResearchItems.includes(item.id)}
                                        onSelect={toggleResearchItemSelection}
                                    />
                                ))
                            }
                        </div>
                    )}
                </div>
            </div>

            {/* New Folder Modal */}
            {showNewFolderModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <Card className="p-6 max-w-lg w-full mx-4 max-h-[80vh] overflow-y-auto">
                        <h3 className="text-lg font-semibold text-slate-200 mb-4">Create New Folder</h3>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    Folder Name
                                </label>
                                <Input
                                    value={newFolderName}
                                    onChange={(e) => setNewFolderName(e.target.value)}
                                    placeholder="Enter folder name"
                                    className="w-full"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    Folder Type
                                </label>
                                <select
                                    value={newFolderType}
                                    onChange={(e) => setNewFolderType(e.target.value as ResearchFolderType)}
                                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-primary"
                                >
                                    {Object.values(ResearchFolderType).map(type => (
                                        <option key={type} value={type}>{type}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    Folder Color
                                </label>
                                <div className="flex items-center gap-3">
                                    <input
                                        type="color"
                                        value={newFolderColor}
                                        onChange={(e) => setNewFolderColor(e.target.value)}
                                        className="w-10 h-10 rounded border border-slate-600 bg-slate-700 cursor-pointer"
                                    />
                                    <div className="flex gap-2">
                                        {['#6B7280', '#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899'].map(color => (
                                            <button
                                                key={color}
                                                type="button"
                                                onClick={() => setNewFolderColor(color)}
                                                className={`w-6 h-6 rounded border-2 ${
                                                    newFolderColor === color ? 'border-white' : 'border-slate-600'
                                                }`}
                                                style={{ backgroundColor: color }}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    Tags
                                </label>
                                <div className="flex gap-2 mb-2">
                                    <Input
                                        value={tagInput}
                                        onChange={(e) => setTagInput(e.target.value)}
                                        placeholder="Add a tag"
                                        className="flex-1"
                                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                                    />
                                    <Button
                                        type="button"
                                        onClick={handleAddTag}
                                        size="sm"
                                        disabled={!tagInput.trim()}
                                    >
                                        Add
                                    </Button>
                                </div>
                                {newFolderTags.length > 0 && (
                                    <div className="flex flex-wrap gap-2">
                                        {newFolderTags.map(tag => (
                                            <span
                                                key={tag}
                                                className="inline-flex items-center px-2 py-1 text-xs bg-slate-700 text-slate-300 rounded"
                                            >
                                                {tag}
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveTag(tag)}
                                                    className="ml-1 text-slate-400 hover:text-slate-200"
                                                >
                                                    ×
                                                </button>
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center gap-2 mt-6">
                            <Button
                                onClick={handleCreateFolder}
                                disabled={!newFolderName.trim()}
                                className="flex-1"
                            >
                                Create Folder
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setShowNewFolderModal(false);
                                    setNewFolderName('');
                                    setNewFolderType(ResearchFolderType.Default);
                                    setNewFolderColor('#6B7280');
                                    setNewFolderTags([]);
                                    setTagInput('');
                                }}
                                className="flex-1"
                            >
                                Cancel
                            </Button>
                        </div>
                    </Card>
                </div>
            )}

            {/* Edit Folder Modal */}
            {showEditFolderModal && editingFolder && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <Card className="p-6 max-w-lg w-full mx-4 max-h-[80vh] overflow-y-auto">
                        <h3 className="text-lg font-semibold text-slate-200 mb-4">Edit Folder</h3>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    Folder Name
                                </label>
                                <Input
                                    value={newFolderName}
                                    onChange={(e) => setNewFolderName(e.target.value)}
                                    placeholder="Enter folder name"
                                    className="w-full"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    Folder Type
                                </label>
                                <select
                                    value={newFolderType}
                                    onChange={(e) => setNewFolderType(e.target.value as ResearchFolderType)}
                                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-primary"
                                >
                                    {Object.values(ResearchFolderType).map(type => (
                                        <option key={type} value={type}>{type}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    Folder Color
                                </label>
                                <div className="flex items-center gap-3">
                                    <input
                                        type="color"
                                        value={newFolderColor}
                                        onChange={(e) => setNewFolderColor(e.target.value)}
                                        className="w-10 h-10 rounded border border-slate-600 bg-slate-700 cursor-pointer"
                                    />
                                    <div className="flex gap-2">
                                        {['#6B7280', '#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899'].map(color => (
                                            <button
                                                key={color}
                                                type="button"
                                                onClick={() => setNewFolderColor(color)}
                                                className={`w-6 h-6 rounded border-2 ${
                                                    newFolderColor === color ? 'border-white' : 'border-slate-600'
                                                }`}
                                                style={{ backgroundColor: color }}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    Tags
                                </label>
                                <div className="flex gap-2 mb-2">
                                    <Input
                                        value={tagInput}
                                        onChange={(e) => setTagInput(e.target.value)}
                                        placeholder="Add a tag"
                                        className="flex-1"
                                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                                    />
                                    <Button
                                        type="button"
                                        onClick={handleAddTag}
                                        size="sm"
                                        disabled={!tagInput.trim()}
                                    >
                                        Add
                                    </Button>
                                </div>
                                {newFolderTags.length > 0 && (
                                    <div className="flex flex-wrap gap-2">
                                        {newFolderTags.map(tag => (
                                            <span
                                                key={tag}
                                                className="inline-flex items-center px-2 py-1 text-xs bg-slate-700 text-slate-300 rounded"
                                            >
                                                {tag}
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveTag(tag)}
                                                    className="ml-1 text-slate-400 hover:text-slate-200"
                                                >
                                                    ×
                                                </button>
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="bg-slate-800/50 p-3 rounded-lg">
                                <h5 className="text-sm font-medium text-slate-300 mb-2">Folder Statistics</h5>
                                <div className="text-xs text-slate-400 space-y-1">
                                    <div className="flex justify-between">
                                        <span>Created:</span>
                                        <span>{new Date(editingFolder.createdAt).toLocaleDateString()}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Items:</span>
                                        <span>{folderCounts[editingFolder.id] || 0}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 mt-6">
                            <Button
                                onClick={handleUpdateFolder}
                                disabled={!newFolderName.trim()}
                                className="flex-1 bg-blue-600 hover:bg-blue-700"
                            >
                                Update Folder
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setShowEditFolderModal(false);
                                    setEditingFolder(null);
                                    setNewFolderName('');
                                    setNewFolderType(ResearchFolderType.Default);
                                    setNewFolderColor('#6B7280');
                                    setNewFolderTags([]);
                                    setTagInput('');
                                }}
                                className="flex-1"
                            >
                                Cancel
                            </Button>
                        </div>
                    </Card>
                </div>
            )}
            
            {/* Research Templates Modal */}
            <ResearchTemplatesModal
                isOpen={showTemplatesModal}
                onClose={() => setShowTemplatesModal(false)}
            />
        </div>
    );
};
