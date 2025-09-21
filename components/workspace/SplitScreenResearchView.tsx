import React, { useState, useRef, useEffect } from 'react';
import { Card, Button, Input } from '../UI';
import {
  AdjustmentsHorizontalIcon,
  MagnifyingGlassIcon,
  EyeIcon,
  EyeSlashIcon,
  ArrowsPointingInIcon,
  ArrowsPointingOutIcon,
  XMarkIcon,
  BookOpenIcon,
  ClipboardDocumentIcon,
  LinkIcon,
  TagIcon
} from '../Icons';
import { useBookCraftStore } from '../../store/useStore';
import { ResearchItem, ResearchConfidence, ResearchType } from '../../types';
import { LexicalEditor } from './lexical/LexicalEditor';

interface SplitScreenResearchViewProps {
  chapterId: string;
  chapterTitle: string;
  chapterContent: string;
  onContentChange: (content: string) => void;
  className?: string;
}

interface ResearchPanelState {
  isVisible: boolean;
  width: number; // percentage
  selectedResearch: ResearchItem | null;
  searchTerm: string;
  filterType?: ResearchType;
  filterConfidence?: ResearchConfidence;
}

const ResearchTypeIcon: React.FC<{ type: ResearchType; className?: string }> = ({ type, className = "w-4 h-4" }) => {
  const icons = {
    [ResearchType.FactCheck]: BookOpenIcon,
    [ResearchType.TopicalResearch]: BookOpenIcon,
    [ResearchType.SourceVerification]: BookOpenIcon,
    [ResearchType.QuickLookup]: BookOpenIcon,
    [ResearchType.Historical]: BookOpenIcon,
    [ResearchType.Statistical]: BookOpenIcon,
    [ResearchType.Expert]: BookOpenIcon
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

const ResearchItemPreview: React.FC<{
  item: ResearchItem;
  onSelect: () => void;
  isSelected: boolean;
}> = ({ item, onSelect, isSelected }) => {
  return (
    <Card
      className={`p-3 mb-2 cursor-pointer transition-all ${
        isSelected ? 'border-brand-primary bg-slate-800/50' : 'hover:bg-slate-800/30'
      }`}
      onClick={onSelect}
    >
      <div className="flex items-start gap-2">
        <ResearchTypeIcon type={item.type} className="w-4 h-4 text-slate-400 mt-1" />
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium text-slate-200 truncate">{item.query}</h4>
          <p className="text-xs text-slate-400 line-clamp-2 mt-1">{item.summary}</p>
          <div className="flex items-center gap-2 mt-2">
            <ConfidenceBadge confidence={item.confidence} />
            <span className="text-xs text-slate-500">{item.wordCount} words</span>
          </div>
        </div>
      </div>
    </Card>
  );
};

const ResearchDetailView: React.FC<{
  item: ResearchItem;
  onClose: () => void;
  onCopyContent: (content: string) => void;
}> = ({ item, onClose, onCopyContent }) => {
  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-slate-600">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-slate-200 mb-2">{item.query}</h3>
            <div className="flex items-center gap-2 mb-2">
              <ResearchTypeIcon type={item.type} />
              <span className="text-sm text-slate-400">{item.type}</span>
              <ConfidenceBadge confidence={item.confidence} />
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200"
          >
            <XMarkIcon className="w-4 h-4" />
          </Button>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onCopyContent(item.summary)}
          >
            <ClipboardDocumentIcon className="w-4 h-4 mr-1" />
            Copy Summary
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onCopyContent(item.content)}
          >
            <ClipboardDocumentIcon className="w-4 h-4 mr-1" />
            Copy Content
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* Summary */}
        <div className="mb-4">
          <h4 className="text-sm font-medium text-slate-300 mb-2">Summary</h4>
          <p className="text-sm text-slate-300 bg-slate-800/50 p-3 rounded-lg">
            {item.summary}
          </p>
        </div>

        {/* Full Content */}
        <div className="mb-4">
          <h4 className="text-sm font-medium text-slate-300 mb-2">Content</h4>
          <div className="text-sm text-slate-300 bg-slate-800/50 p-3 rounded-lg max-h-64 overflow-y-auto">
            <div className="prose prose-sm prose-invert max-w-none">
              {item.content.split('\n').map((paragraph, index) => (
                <p key={index} className="mb-2 last:mb-0">{paragraph}</p>
              ))}
            </div>
          </div>
        </div>

        {/* Tags */}
        {item.tags.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-medium text-slate-300 mb-2">Tags</h4>
            <div className="flex flex-wrap gap-1">
              {item.tags.map(tag => (
                <span key={tag} className="inline-flex items-center px-2 py-1 text-xs bg-slate-700 text-slate-300 rounded">
                  <TagIcon className="w-3 h-3 mr-1" />
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Sources */}
        {item.sources.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-medium text-slate-300 mb-2">Sources</h4>
            <div className="space-y-2">
              {item.sources.map(source => (
                <div key={source.id} className="text-xs text-slate-400 bg-slate-800/50 p-2 rounded">
                  <div className="font-medium text-slate-300">{source.title}</div>
                  {source.author && <div>Author: {source.author}</div>}
                  <div className="flex items-center justify-between mt-1">
                    <span>Credibility: {source.credibility}</span>
                    {source.url && (
                      <a
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-brand-primary hover:text-brand-secondary flex items-center gap-1"
                      >
                        <LinkIcon className="w-3 h-3" />
                        View
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Metadata */}
        <div className="text-xs text-slate-500 space-y-1">
          <div>Created: {new Date(item.createdAt).toLocaleString()}</div>
          <div>Last Updated: {new Date(item.lastUpdated).toLocaleString()}</div>
          <div>Word Count: {item.wordCount}</div>
          {item.qualityScore && <div>Quality Score: {item.qualityScore}/100</div>}
        </div>
      </div>
    </div>
  );
};

export const SplitScreenResearchView: React.FC<SplitScreenResearchViewProps> = ({
  chapterId,
  chapterTitle,
  chapterContent,
  onContentChange,
  className = ""
}) => {
  const [panelState, setPanelState] = useState<ResearchPanelState>({
    isVisible: false,
    width: 35, // 35% width by default
    selectedResearch: null,
    searchTerm: '',
  });

  const [isDragging, setIsDragging] = useState(false);
  const resizeRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Store hooks
  const project = useBookCraftStore(state => state.projects[state.activeProjectId!]);
  const searchResearch = useBookCraftStore(state => state.searchResearch);

  // Filter research items
  const filteredResearch = React.useMemo(() => {
    let items = panelState.searchTerm
      ? searchResearch(panelState.searchTerm)
      : project?.research || [];

    // Filter by type
    if (panelState.filterType) {
      items = items.filter(item => item.type === panelState.filterType);
    }

    // Filter by confidence
    if (panelState.filterConfidence) {
      items = items.filter(item => item.confidence === panelState.filterConfidence);
    }

    // Filter by chapter relevance (items linked to this chapter or general items)
    items = items.filter(item =>
      item.linkedChapterIds.includes(chapterId) ||
      item.linkedChapterIds.length === 0
    );

    return items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [panelState.searchTerm, panelState.filterType, panelState.filterConfidence, project?.research, chapterId, searchResearch]);

  // Handle resize
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !containerRef.current) return;

      const containerRect = containerRef.current.getBoundingClientRect();
      const newWidth = ((containerRect.right - e.clientX) / containerRect.width) * 100;
      const clampedWidth = Math.max(20, Math.min(60, newWidth)); // Between 20% and 60%

      setPanelState(prev => ({ ...prev, width: clampedWidth }));
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isDragging]);

  const togglePanel = () => {
    setPanelState(prev => ({ ...prev, isVisible: !prev.isVisible }));
  };

  const handleResearchSelect = (item: ResearchItem) => {
    setPanelState(prev => ({
      ...prev,
      selectedResearch: prev.selectedResearch?.id === item.id ? null : item
    }));
  };

  const copyToClipboard = (content: string) => {
    navigator.clipboard.writeText(content);
    // Could add a toast notification here
  };

  const editorWidth = panelState.isVisible ? `${100 - panelState.width}%` : '100%';
  const panelWidth = `${panelState.width}%`;

  return (
    <div ref={containerRef} className={`h-full flex ${className}`}>
      {/* Editor Section */}
      <div
        className="flex flex-col transition-all duration-200 ease-in-out"
        style={{ width: editorWidth }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-slate-800 border-b border-slate-600">
          <h2 className="text-lg font-semibold text-slate-200">{chapterTitle}</h2>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={togglePanel}
              className={`${panelState.isVisible ? 'text-brand-primary' : 'text-slate-400'} hover:text-slate-200`}
            >
              {panelState.isVisible ? (
                <EyeSlashIcon className="w-4 h-4 mr-1" />
              ) : (
                <EyeIcon className="w-4 h-4 mr-1" />
              )}
              Research Panel
            </Button>
          </div>
        </div>

        {/* Editor */}
        <div className="flex-1">
          <LexicalEditor
            content={chapterContent}
            onContentChange={onContentChange}
            placeholder={`Start writing ${chapterTitle}...`}
            enableResearchLookup={true}
            className="h-full"
          />
        </div>
      </div>

      {/* Resize Handle */}
      {panelState.isVisible && (
        <div
          ref={resizeRef}
          className="w-1 bg-slate-600 cursor-col-resize hover:bg-slate-500 transition-colors"
          onMouseDown={() => setIsDragging(true)}
        />
      )}

      {/* Research Panel */}
      {panelState.isVisible && (
        <div
          className="flex flex-col bg-slate-900 border-l border-slate-600"
          style={{ width: panelWidth }}
        >
          {/* Panel Header */}
          <div className="p-4 border-b border-slate-600">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-200">Research</h3>
              <span className="text-sm text-slate-400">{filteredResearch.length} items</span>
            </div>

            {/* Search and Filters */}
            <div className="space-y-3">
              <Input
                value={panelState.searchTerm}
                onChange={(e) => setPanelState(prev => ({ ...prev, searchTerm: e.target.value }))}
                placeholder="Search research..."
                className="w-full"
              />

              <div className="grid grid-cols-2 gap-2">
                <select
                  value={panelState.filterType || ''}
                  onChange={(e) => setPanelState(prev => ({
                    ...prev,
                    filterType: e.target.value as ResearchType || undefined
                  }))}
                  className="px-2 py-1 text-xs bg-slate-700 border border-slate-600 rounded text-slate-200"
                >
                  <option value="">All Types</option>
                  {Object.values(ResearchType).map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>

                <select
                  value={panelState.filterConfidence || ''}
                  onChange={(e) => setPanelState(prev => ({
                    ...prev,
                    filterConfidence: e.target.value as ResearchConfidence || undefined
                  }))}
                  className="px-2 py-1 text-xs bg-slate-700 border border-slate-600 rounded text-slate-200"
                >
                  <option value="">All Confidence</option>
                  {Object.values(ResearchConfidence).map(conf => (
                    <option key={conf} value={conf}>{conf}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Panel Content */}
          <div className="flex-1 overflow-hidden">
            {panelState.selectedResearch ? (
              <ResearchDetailView
                item={panelState.selectedResearch}
                onClose={() => setPanelState(prev => ({ ...prev, selectedResearch: null }))}
                onCopyContent={copyToClipboard}
              />
            ) : (
              <div className="h-full overflow-y-auto p-4">
                {filteredResearch.length === 0 ? (
                  <div className="text-center py-8">
                    <MagnifyingGlassIcon className="mx-auto h-12 w-12 text-slate-600 mb-4" />
                    <h4 className="text-lg font-semibold text-slate-300 mb-2">No research found</h4>
                    <p className="text-slate-400 text-sm">
                      {panelState.searchTerm || panelState.filterType || panelState.filterConfidence
                        ? 'Try adjusting your search or filters.'
                        : 'Start researching to see items here.'
                      }
                    </p>
                  </div>
                ) : (
                  <div>
                    {filteredResearch.map(item => (
                      <ResearchItemPreview
                        key={item.id}
                        item={item}
                        onSelect={() => handleResearchSelect(item)}
                        isSelected={panelState.selectedResearch?.id === item.id}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};