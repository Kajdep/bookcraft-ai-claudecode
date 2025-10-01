import React, { useState } from 'react';
import { Card, Button, Input } from '../UI';
import { MagnifyingGlassIcon, XMarkIcon, BookOpenIcon, BeakerIcon, DocumentTextIcon, ClockIcon, ChartBarIcon, UserGroupIcon, SparklesIcon, TrashIcon, TagIcon, ChevronRightIcon, ChevronDownIcon, BookmarkIcon, PlusIcon } from '../Icons';
import { useBookCraftStore } from '../../store/useStore';
import { ResearchType, ResearchConfidence, ResearchItem } from '../../types';

const ResearchTypeIcon: React.FC<{ type: ResearchType; className?: string }> = ({ type, className = "w-3 h-3" }) => {
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

const ConfidenceBadge: React.FC<{ confidence: ResearchConfidence; size?: 'sm' | 'xs' }> = ({ confidence, size = 'xs' }) => {
    const colors = {
        [ResearchConfidence.High]: 'bg-green-100 text-green-800',
        [ResearchConfidence.Medium]: 'bg-yellow-100 text-yellow-800',
        [ResearchConfidence.Low]: 'bg-red-100 text-red-800',
        [ResearchConfidence.Unknown]: 'bg-gray-100 text-gray-800'
    };

    const sizeClasses = size === 'xs' ? 'px-1 py-0.5 text-xs' : 'px-2 py-1 text-xs';

    return (
        <span className={`inline-flex items-center font-medium rounded ${colors[confidence]} ${sizeClasses}`}>
            {confidence}
        </span>
    );
};

const CompactResearchItem: React.FC<{
    item: ResearchItem;
    onDelete: (id: string) => void;
    onSelect: (item: ResearchItem) => void;
    onBookmarkToggle: (id: string) => void;
    onAddToBibliography: (item: ResearchItem) => void;
}> = ({ item, onDelete, onSelect, onBookmarkToggle, onAddToBibliography }) => {
    const [expanded, setExpanded] = useState(false);

    return (
        <div className="border-b border-slate-700/30 last:border-b-0">
            <div className="p-3 hover:bg-slate-800/30 transition-colors">
                <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                        <ResearchTypeIcon type={item.type} />
                        <h4 className="text-xs font-medium text-slate-200 truncate">{item.query}</h4>
                    </div>
                    <div className="flex items-center gap-1 ml-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setExpanded(!expanded)}
                            className="p-1 text-slate-400 hover:text-slate-200"
                        >
                            {expanded ? <ChevronDownIcon className="w-3 h-3" /> : <ChevronRightIcon className="w-3 h-3" />}
                        </Button>
                    </div>
                </div>

                <div className="flex items-center justify-between mb-2">
                    <ConfidenceBadge confidence={item.confidence} size="xs" />
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDelete(item.id)}
                        className="p-1 text-red-400 hover:text-red-300"
                    >
                        <TrashIcon className="w-3 h-3" />
                    </Button>
                </div>

                <p className="text-xs text-slate-300 line-clamp-2 mb-2">{item.summary}</p>

                {item.tags.length > 0 && (
                    <div className="flex items-center gap-1 mb-2">
                        <TagIcon className="w-2 h-2 text-slate-500" />
                        <div className="flex flex-wrap gap-1">
                            {item.tags.slice(0, 2).map(tag => (
                                <span key={tag} className="inline-flex items-center px-1 py-0.5 text-xs bg-slate-700 text-slate-400 rounded">
                                    {tag}
                                </span>
                            ))}
                            {item.tags.length > 2 && (
                                <span className="text-xs text-slate-500">+{item.tags.length - 2}</span>
                            )}
                        </div>
                    </div>
                )}

                {expanded && (
                    <div className="mt-3 p-2 bg-slate-800/50 rounded text-xs">
                        <div className="text-slate-300 mb-2">
                            <p className="line-clamp-4">{item.content}</p>
                        </div>

                        <div className="flex gap-2 flex-wrap">
                            <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => onSelect(item)}
                                className="text-xs py-1 px-2"
                            >
                                View Full
                            </Button>
                            <Button
                                size="sm"
                                variant={item.isBookmarked ? "primary" : "ghost"}
                                onClick={() => onBookmarkToggle(item.id)}
                                className={`text-xs py-1 px-2 ${item.isBookmarked ? 'text-yellow-300' : 'text-slate-400 hover:text-yellow-300'}`}
                                title={item.isBookmarked ? "Remove bookmark" : "Bookmark this research"}
                            >
                                <BookmarkIcon className="w-3 h-3 mr-1" />
                                {item.isBookmarked ? "Bookmarked" : "Bookmark"}
                            </Button>
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => onAddToBibliography(item)}
                                className="text-xs py-1 px-2 text-slate-400 hover:text-blue-300"
                                title="Add to bibliography"
                            >
                                <PlusIcon className="w-3 h-3 mr-1" />
                                Bibliography
                            </Button>
                        </div>

                        {item.sources.length > 0 && (
                            <div className="mt-2 pt-2 border-t border-slate-700/30">
                                <h6 className="text-xs font-medium text-slate-400 mb-1">Sources:</h6>
                                {item.sources.slice(0, 2).map(source => (
                                    <div key={source.id} className="text-xs text-slate-500 truncate">
                                        • {source.title}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

interface ResearchSidebarProps {
    isOpen: boolean;
    onClose: () => void;
    chapterId?: string;
}

export const ResearchSidebar: React.FC<ResearchSidebarProps> = ({ isOpen, onClose, chapterId }) => {
    const [query, setQuery] = useState('');
    const [selectedType, setSelectedType] = useState<ResearchType>(ResearchType.QuickLookup);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedItem, setSelectedItem] = useState<ResearchItem | null>(null);
    const [showBookmarksOnly, setShowBookmarksOnly] = useState(false);
    const [showBibliographyView, setShowBibliographyView] = useState(false);

    const project = useBookCraftStore(state => state.projects[state.activeProjectId!]);
    const isResearching = useBookCraftStore(state => state.isResearching);
    const performResearch = useBookCraftStore(state => state.performResearch);
    const deleteResearchItem = useBookCraftStore(state => state.deleteResearchItem);
    const searchResearch = useBookCraftStore(state => state.searchResearch);
    const updateResearchItem = useBookCraftStore(state => state.updateResearchItem);
    const addCitation = useBookCraftStore(state => state.addCitation);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim()) return;

        await performResearch(query, selectedType, chapterId);
        setQuery('');
    };

    const handleBookmarkToggle = (itemId: string) => {
        const item = project?.research.find(r => r.id === itemId);
        if (item) {
            updateResearchItem(itemId, { isBookmarked: !item.isBookmarked });
        }
    };

    const handleAddToBibliography = (item: ResearchItem) => {
        // Create citations for all sources in this research item
        item.sources.forEach(source => {
            addCitation({
                id: `citation-${source.id}-${Date.now()}`,
                sourceId: source.id,
                researchItemId: item.id,
                citationType: 'reference',
                pageNumber: source.pageNumber,
                quotedText: item.summary,
                context: `From research: "${item.query}"`,
                createdAt: new Date(),
            });
        });

        // Show success feedback
        alert(`Added ${item.sources.length} sources to bibliography from "${item.query}"`);
    };

    const filteredResearch = searchTerm ? searchResearch(searchTerm) : project?.research || [];
    let chapterResearch = chapterId
        ? filteredResearch.filter(item => item.linkedChapterIds.includes(chapterId))
        : filteredResearch;

    // Apply bookmark filter if active
    if (showBookmarksOnly) {
        chapterResearch = chapterResearch.filter(item => item.isBookmarked);
    }

    if (!isOpen) return null;

    return (
        <div className="fixed right-0 top-0 h-full w-80 bg-slate-900/95 backdrop-blur-sm border-l border-slate-700/50 z-40 flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-700/50">
                <h3 className="text-lg font-semibold text-slate-200">Research</h3>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={onClose}
                    className="text-slate-400 hover:text-slate-200"
                >
                    <XMarkIcon className="w-5 h-5" />
                </Button>
            </div>

            {/* Research Form */}
            <div className="p-4 border-b border-slate-700/30">
                <form onSubmit={handleSubmit} className="space-y-3">
                    <select
                        value={selectedType}
                        onChange={(e) => setSelectedType(e.target.value as ResearchType)}
                        className="w-full px-2 py-1 text-xs bg-slate-700 border border-slate-600 rounded text-slate-200 focus:outline-none focus:ring-1 focus:ring-brand-primary"
                    >
                        {Object.values(ResearchType).map(type => (
                            <option key={type} value={type}>{type}</option>
                        ))}
                    </select>

                    <div className="flex gap-2">
                        <Input
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Research query..."
                            className="flex-1 text-xs py-2"
                            disabled={isResearching}
                        />
                        <Button
                            type="submit"
                            disabled={isResearching || !query.trim()}
                            size="sm"
                            className="px-2"
                        >
                            {isResearching ? (
                                <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <MagnifyingGlassIcon className="w-3 h-3" />
                            )}
                        </Button>
                    </div>
                </form>

                {/* Filter Controls */}
                <div className="flex gap-2 mt-3">
                    <Button
                        size="sm"
                        variant={showBookmarksOnly ? "primary" : "ghost"}
                        onClick={() => setShowBookmarksOnly(!showBookmarksOnly)}
                        className={`text-xs py-1 px-2 ${showBookmarksOnly ? 'text-yellow-300' : 'text-slate-400 hover:text-yellow-300'}`}
                    >
                        <BookmarkIcon className="w-3 h-3 mr-1" />
                        Bookmarks Only
                    </Button>
                    <Button
                        size="sm"
                        variant={showBibliographyView ? "primary" : "ghost"}
                        onClick={() => setShowBibliographyView(!showBibliographyView)}
                        className={`text-xs py-1 px-2 ${showBibliographyView ? 'text-blue-300' : 'text-slate-400 hover:text-blue-300'}`}
                    >
                        <DocumentTextIcon className="w-3 h-3 mr-1" />
                        Bibliography
                    </Button>
                </div>
            </div>

            {/* Search Bar */}
            <div className="p-4 border-b border-slate-700/30">
                <Input
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search research..."
                    className="w-full text-xs"
                />
            </div>

            {/* Research Items */}
            <div className="flex-1 overflow-y-auto">
                {selectedItem ? (
                    /* Full Item View */
                    <div className="p-4">
                        <div className="flex items-center justify-between mb-4">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelectedItem(null)}
                                className="text-slate-400 hover:text-slate-200"
                            >
                                ← Back
                            </Button>
                            <ConfidenceBadge confidence={selectedItem.confidence} />
                        </div>

                        <div className="space-y-3">
                            <div>
                                <h4 className="text-sm font-medium text-slate-200 mb-2">{selectedItem.query}</h4>
                                <p className="text-xs text-slate-300 mb-3">{selectedItem.summary}</p>
                            </div>

                            <div className="p-3 bg-slate-800/50 rounded text-xs">
                                <div className="text-slate-300 whitespace-pre-wrap">
                                    {selectedItem.content}
                                </div>
                            </div>

                            {selectedItem.sources.length > 0 && (
                                <div>
                                    <h5 className="text-xs font-medium text-slate-400 mb-2">Sources:</h5>
                                    {selectedItem.sources.map(source => (
                                        <div key={source.id} className="text-xs text-slate-400 mb-1 p-2 bg-slate-800/30 rounded">
                                            <div className="font-medium">{source.title}</div>
                                            {source.url && (
                                                <div className="text-slate-500 truncate">{source.url}</div>
                                            )}
                                            <div className="text-slate-500">Credibility: {source.credibility}</div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {selectedItem.tags.length > 0 && (
                                <div>
                                    <h5 className="text-xs font-medium text-slate-400 mb-2">Tags:</h5>
                                    <div className="flex flex-wrap gap-1">
                                        {selectedItem.tags.map(tag => (
                                            <span key={tag} className="inline-flex items-center px-2 py-1 text-xs bg-slate-700 text-slate-300 rounded">
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    /* Research List */
                    <div>
                        <div className="px-4 py-2 text-xs text-slate-400 bg-slate-800/30">
                            {chapterId ? 'Chapter Research' : 'All Research'} ({chapterResearch.length})
                        </div>

                        {chapterResearch.length === 0 ? (
                            <div className="p-6 text-center">
                                <MagnifyingGlassIcon className="mx-auto h-8 w-8 text-slate-600 mb-3" />
                                <h4 className="text-sm font-medium text-slate-300 mb-2">
                                    {searchTerm ? 'No matching research' : 'No research yet'}
                                </h4>
                                <p className="text-xs text-slate-400">
                                    {searchTerm
                                        ? 'Try different search terms.'
                                        : 'Start researching to build your knowledge base.'
                                    }
                                </p>
                            </div>
                        ) : (
                            <div>
                                {chapterResearch
                                    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                                    .map(item => (
                                        <CompactResearchItem
                                            key={item.id}
                                            item={item}
                                            onDelete={deleteResearchItem}
                                            onSelect={setSelectedItem}
                                            onBookmarkToggle={handleBookmarkToggle}
                                            onAddToBibliography={handleAddToBibliography}
                                        />
                                    ))
                                }
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};