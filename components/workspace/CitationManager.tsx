import React, { useState, useMemo } from 'react';
import { Card, Button, Input } from '../UI';
import { DocumentTextIcon, ClipboardDocumentIcon, PlusIcon, TrashIcon, CheckIcon, LinkIcon } from '../Icons';
import { useBookCraftStore } from '../../store/useStore';
import { CitationStyle, Citation, ResearchSource } from '../../types';
import { toast } from '../../services/toast';

interface CitationManagerProps {
  className?: string;
}

const CitationStyleIcon: React.FC<{ style: CitationStyle; className?: string }> = ({ style, className = "w-4 h-4" }) => {
  return <DocumentTextIcon className={className} />;
};

const formatCitation = (source: ResearchSource, style: CitationStyle): string => {
  switch (style) {
    case CitationStyle.APA:
      return formatAPACitation(source);
    case CitationStyle.MLA:
      return formatMLACitation(source);
    case CitationStyle.Chicago:
      return formatChicagoCitation(source);
    case CitationStyle.Harvard:
      return formatHarvardCitation(source);
    default:
      return formatAPACitation(source);
  }
};

const formatAPACitation = (source: ResearchSource): string => {
  const author = source.author || 'Unknown Author';
  const year = source.publishDate ? new Date(source.publishDate).getFullYear() : 'n.d.';
  const title = source.title;

  if (source.sourceType === 'Website') {
    return `${author} (${year}). ${title}. Retrieved from ${source.url}`;
  } else if (source.sourceType === 'Journal') {
    return `${author} (${year}). ${title}. ${source.journal}${source.volume ? `, ${source.volume}` : ''}${source.issue ? `(${source.issue})` : ''}${source.pages ? `, ${source.pages}` : ''}.`;
  } else if (source.sourceType === 'Book') {
    return `${author} (${year}). ${title}. ${source.publisher || 'Unknown Publisher'}.`;
  }

  return `${author} (${year}). ${title}.`;
};

const formatMLACitation = (source: ResearchSource): string => {
  const author = source.author || 'Unknown Author';
  const title = `"${source.title}"`;

  if (source.sourceType === 'Website') {
    const date = source.publishDate ? new Date(source.publishDate).toLocaleDateString() : '';
    return `${author}. ${title} Web. ${date}.`;
  } else if (source.sourceType === 'Journal') {
    return `${author}. ${title} ${source.journal || ''}, ${source.publishDate || ''}.`;
  } else if (source.sourceType === 'Book') {
    return `${author}. ${source.title}. ${source.publisher || ''}, ${source.publishDate || ''}.`;
  }

  return `${author}. ${title}`;
};

const formatChicagoCitation = (source: ResearchSource): string => {
  const author = source.author || 'Unknown Author';
  const title = `"${source.title}"`;

  if (source.sourceType === 'Website') {
    return `${author}. ${title} Accessed ${new Date(source.accessDate).toLocaleDateString()}. ${source.url}.`;
  } else if (source.sourceType === 'Journal') {
    return `${author}. ${title} ${source.journal || ''} ${source.volume || ''}, no. ${source.issue || ''} (${source.publishDate || ''}): ${source.pages || ''}.`;
  } else if (source.sourceType === 'Book') {
    return `${author}. ${source.title}. ${source.publisher || ''}, ${source.publishDate || ''}.`;
  }

  return `${author}. ${title}`;
};

const formatHarvardCitation = (source: ResearchSource): string => {
  const author = source.author || 'Unknown Author';
  const year = source.publishDate ? new Date(source.publishDate).getFullYear() : 'n.d.';
  const title = source.title;

  if (source.sourceType === 'Website') {
    return `${author} ${year}, ${title}, viewed ${new Date(source.accessDate).toLocaleDateString()}, <${source.url}>.`;
  } else if (source.sourceType === 'Journal') {
    return `${author} ${year}, '${title}', ${source.journal || ''}, vol. ${source.volume || ''}, no. ${source.issue || ''}, pp. ${source.pages || ''}.`;
  } else if (source.sourceType === 'Book') {
    return `${author} ${year}, ${title}, ${source.publisher || ''}.`;
  }

  return `${author} ${year}, ${title}.`;
};

const getInTextCitation = (source: ResearchSource, style: CitationStyle): string => {
  const author = source.author?.split(' ').pop() || 'Unknown';
  const year = source.publishDate ? new Date(source.publishDate).getFullYear() : 'n.d.';

  switch (style) {
    case CitationStyle.APA:
    case CitationStyle.Harvard:
      return `(${author}, ${year})`;
    case CitationStyle.MLA:
      return `(${author})`;
    case CitationStyle.Chicago:
      return `(${author}, ${year})`;
    default:
      return `(${author}, ${year})`;
  }
};

export const CitationManager: React.FC<CitationManagerProps> = ({ className = "" }) => {
  const [selectedStyle, setSelectedStyle] = useState<CitationStyle>(CitationStyle.APA);
  const [searchTerm, setSearchTerm] = useState('');
  const [generatingFor, setGeneratingFor] = useState<string | null>(null);

  // Store hooks
  const project = useBookCraftStore(state => state.projects[state.activeProjectId!]);
  const generateCitation = useBookCraftStore(state => state.generateCitation);
  const formatBibliography = useBookCraftStore(state => state.formatBibliography);
  const isGeneratingCitation = useBookCraftStore(state => state.isGeneratingCitation);

  // Get all unique sources from research items
  const allSources = useMemo(() => {
    const sources: ResearchSource[] = [];
    const seenIds = new Set<string>();

    project?.research.forEach(item => {
      item.sources.forEach(source => {
        if (!seenIds.has(source.id)) {
          seenIds.add(source.id);
          sources.push(source);
        }
      });
    });

    return sources;
  }, [project?.research]);

  // Filter sources based on search
  const filteredSources = useMemo(() => {
    if (!searchTerm) return allSources;

    const term = searchTerm.toLowerCase();
    return allSources.filter(source =>
      source.title.toLowerCase().includes(term) ||
      source.author?.toLowerCase().includes(term) ||
      source.sourceType.toLowerCase().includes(term)
    );
  }, [allSources, searchTerm]);

  // Get existing citations for current style
  const existingCitations = project?.citations.filter(c => c.style === selectedStyle) || [];

  const handleGenerateCitation = async (source: ResearchSource) => {
    const researchItem = project?.research.find(r =>
      r.sources.some(s => s.id === source.id)
    );

    if (!researchItem) return;

    setGeneratingFor(source.id);
    try {
      await generateCitation(researchItem.id, source.id, selectedStyle);
      toast.success('Citation Generated', `${selectedStyle} citation created successfully!`);
    } catch (error) {
      console.error('Failed to generate citation:', error);
      toast.error('Citation Failed', 'Failed to generate citation. Please try again.');
    } finally {
      setGeneratingFor(null);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied!', 'Citation copied to clipboard');
  };

  const copyAllBibliography = () => {
    const bibliography = formatBibliography(selectedStyle);
    const formattedBibliography = bibliography.join('\n\n');
    navigator.clipboard.writeText(formattedBibliography);
    toast.success('Bibliography Copied!', `Complete ${selectedStyle} bibliography copied to clipboard`);
  };

  return (
    <div className={`citation-manager ${className}`}>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-100 mb-2">Citation Manager</h2>
        <p className="text-slate-400">
          Generate academic citations and manage your bibliography
        </p>
      </div>

      {/* Style Selector and Search */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <Card className="p-4">
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Citation Style
          </label>
          <select
            value={selectedStyle}
            onChange={(e) => setSelectedStyle(e.target.value as CitationStyle)}
            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-primary"
          >
            {Object.values(CitationStyle).map(style => (
              <option key={style} value={style}>{style}</option>
            ))}
          </select>
        </Card>

        <Card className="p-4">
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Search Sources
          </label>
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by title, author, or type..."
            className="w-full"
          />
        </Card>
      </div>

      {/* Sources and Citation Generation */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Available Sources */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-200">Available Sources</h3>
            <span className="text-sm text-slate-400">{filteredSources.length} sources</span>
          </div>

          {filteredSources.length === 0 ? (
            <Card className="p-6 text-center">
              <DocumentTextIcon className="mx-auto h-12 w-12 text-slate-600 mb-4" />
              <h4 className="text-lg font-semibold text-slate-300 mb-2">No sources found</h4>
              <p className="text-slate-400">
                {searchTerm ? 'Try adjusting your search terms.' : 'Add research items to generate citations.'}
              </p>
            </Card>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {filteredSources.map(source => {
                const hasExistingCitation = existingCitations.some(c => c.sourceId === source.id);
                const isGenerating = generatingFor === source.id;

                return (
                  <Card key={source.id} className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-slate-200 mb-1">{source.title}</h4>
                        <p className="text-xs text-slate-400 mb-2">
                          {source.author && <span>By {source.author} • </span>}
                          <span className="capitalize">{source.sourceType}</span>
                          {source.publishDate && <span> • {new Date(source.publishDate).getFullYear()}</span>}
                        </p>

                        {source.url && (
                          <a
                            href={source.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-brand-primary hover:text-brand-secondary flex items-center gap-1"
                          >
                            <LinkIcon className="w-3 h-3" />
                            View Source
                          </a>
                        )}
                      </div>

                      <div className="flex items-center gap-2 ml-4">
                        {hasExistingCitation && (
                          <CheckIcon className="w-4 h-4 text-green-400" title="Citation exists" />
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleGenerateCitation(source)}
                          disabled={isGenerating || isGeneratingCitation}
                        >
                          {isGenerating ? (
                            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                          ) : hasExistingCitation ? (
                            'Regenerate'
                          ) : (
                            'Generate'
                          )}
                        </Button>
                      </div>
                    </div>

                    {/* Preview citation */}
                    <div className="mt-3 p-2 bg-slate-800/50 rounded text-xs text-slate-300">
                      <strong>Preview ({selectedStyle}):</strong><br />
                      {formatCitation(source, selectedStyle)}
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* Generated Citations */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-200">Generated Citations ({selectedStyle})</h3>
            {existingCitations.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={copyAllBibliography}
                className="flex items-center gap-2"
              >
                <ClipboardDocumentIcon className="w-4 h-4" />
                Copy Bibliography
              </Button>
            )}
          </div>

          {existingCitations.length === 0 ? (
            <Card className="p-6 text-center">
              <DocumentTextIcon className="mx-auto h-12 w-12 text-slate-600 mb-4" />
              <h4 className="text-lg font-semibold text-slate-300 mb-2">No citations yet</h4>
              <p className="text-slate-400">
                Generate citations from your sources to build your bibliography.
              </p>
            </Card>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {existingCitations.map(citation => {
                const source = allSources.find(s => s.id === citation.sourceId);
                if (!source) return null;

                return (
                  <Card key={citation.id} className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <h4 className="text-sm font-medium text-slate-200">{source.title}</h4>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(citation.formatted)}
                        className="text-slate-400 hover:text-slate-200"
                        title="Copy citation"
                      >
                        <ClipboardDocumentIcon className="w-4 h-4" />
                      </Button>
                    </div>

                    <div className="space-y-2">
                      <div>
                        <p className="text-xs font-medium text-slate-400">Full Citation:</p>
                        <p className="text-xs text-slate-300 bg-slate-800/50 p-2 rounded">
                          {citation.formatted}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs font-medium text-slate-400">In-Text Citation:</p>
                        <p className="text-xs text-slate-300 bg-slate-800/50 p-2 rounded">
                          {citation.inText}
                        </p>
                      </div>

                      {citation.shortForm && (
                        <div>
                          <p className="text-xs font-medium text-slate-400">Short Form:</p>
                          <p className="text-xs text-slate-300 bg-slate-800/50 p-2 rounded">
                            {citation.shortForm}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="mt-3 text-xs text-slate-500">
                      Created: {new Date(citation.createdAt).toLocaleString()}
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Usage Instructions */}
      <Card className="p-4 mt-6">
        <h4 className="text-sm font-medium text-slate-300 mb-2">Usage Instructions</h4>
        <div className="text-xs text-slate-400 space-y-1">
          <p>• Select your preferred citation style (APA, MLA, Chicago, Harvard)</p>
          <p>• Generate citations for your research sources</p>
          <p>• Copy individual citations or the entire bibliography</p>
          <p>• Use in-text citations while writing your chapters</p>
        </div>
      </Card>
    </div>
  );
};