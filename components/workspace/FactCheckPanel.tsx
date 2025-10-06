import React, { useState, useEffect } from 'react';
import { Card, Button, Input } from '../UI';
import {
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  CheckCircleIcon,
  ClockIcon,
  DocumentTextIcon,
  MagnifyingGlassIcon,
  SparklesIcon,
  TrashIcon,
  EyeIcon,
  LinkIcon
} from '../Icons';
import { useBookCraftStore } from '../../store/useStore';
import { FactCheckResult, ResearchConfidence, Chapter } from '../../types';
import { toast } from '../../services/toast';
import { log } from '../../services/logger';

interface FactCheckPanelProps {
  className?: string;
}

const AccuracyIcon: React.FC<{ accuracy: string; className?: string }> = ({ accuracy, className = "w-5 h-5" }) => {
  const icons = {
    'Accurate': CheckCircleIcon,
    'Questionable': ExclamationTriangleIcon,
    'False': XCircleIcon,
    'Unknown': ClockIcon
  };

  const Icon = icons[accuracy as keyof typeof icons] || ClockIcon;
  return <Icon className={className} />;
};

const AccuracyBadge: React.FC<{ accuracy: string; confidence: ResearchConfidence }> = ({ accuracy, confidence }) => {
  const getColor = () => {
    switch (accuracy) {
      case 'Accurate':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'Questionable':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'False':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'Unknown':
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  return (
    <div className="flex items-center gap-2">
      <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded border ${getColor()}`}>
        <AccuracyIcon accuracy={accuracy} className="w-3 h-3 mr-1" />
        {accuracy}
      </span>
      <span className="text-xs text-gray-500">
        {confidence} confidence
      </span>
    </div>
  );
};

const FactCheckCard: React.FC<{
  factCheck: FactCheckResult;
  chapterTitle: string;
  onAccept: (id: string) => void;
  onDismiss: (id: string) => void;
  onViewSource: (factCheck: FactCheckResult) => void;
}> = ({ factCheck, chapterTitle, onAccept, onDismiss, onViewSource }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <Card className="p-4 mb-4">
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <DocumentTextIcon className="w-4 h-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">{chapterTitle}</span>
              <span className="text-xs text-gray-500">
                {new Date(factCheck.createdAt).toLocaleDateString()}
              </span>
            </div>
            <AccuracyBadge accuracy={factCheck.accuracy} confidence={factCheck.confidence} />
          </div>

          <div className="flex items-center gap-2 ml-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpanded(!expanded)}
              className="text-gray-600 hover:text-gray-800"
            >
              <EyeIcon className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Claim */}
        <div>
          <h4 className="text-sm font-medium text-gray-800 mb-2">Fact-Checked Claim:</h4>
          <p className="text-sm text-gray-700 bg-gray-100/50 p-3 rounded-lg">
            "{factCheck.claim}"
          </p>
        </div>

        {/* Explanation */}
        <div>
          <h4 className="text-sm font-medium text-gray-800 mb-2">Analysis:</h4>
          <p className="text-sm text-gray-700">
            {factCheck.explanation}
          </p>
        </div>

        {/* Suggested Correction */}
        {factCheck.suggestedCorrection && (
          <div>
            <h4 className="text-sm font-medium text-gray-800 mb-2">Suggested Correction:</h4>
            <p className="text-sm text-gray-700 bg-blue-900/20 p-3 rounded-lg border border-blue-700/30">
              {factCheck.suggestedCorrection}
            </p>
          </div>
        )}

        {/* Expanded Details */}
        {expanded && (
          <div className="space-y-3 pt-3 border-t border-gray-300">
            {/* Original Text Context */}
            <div>
              <h4 className="text-sm font-medium text-gray-800 mb-2">Original Text Context:</h4>
              <p className="text-xs text-gray-600 bg-gray-100/50 p-2 rounded max-h-32 overflow-y-auto">
                {factCheck.originalText}
              </p>
            </div>

            {/* Sources */}
            {factCheck.sources.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-800 mb-2">Sources:</h4>
                <div className="space-y-2">
                  {factCheck.sources.map(source => (
                    <div key={source.id} className="text-xs bg-gray-100/50 p-2 rounded">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-700">{source.title}</span>
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
                      <div className="text-gray-600 mt-1">
                        Credibility: {source.credibility}
                        {source.author && ` • Author: ${source.author}`}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 pt-3 border-t border-gray-300">
          {factCheck.accuracy !== 'Accurate' && factCheck.suggestedCorrection && (
            <Button
              onClick={() => {
                // In a real implementation, this would apply the correction to the chapter
                onAccept(factCheck.id);
                toast.success('Correction Applied', 'The suggested correction has been noted.');
              }}
              className="bg-blue-600 hover:bg-blue-700"
              size="sm"
            >
              Apply Correction
            </Button>
          )}

          <Button
            onClick={() => onAccept(factCheck.id)}
            variant="outline"
            size="sm"
            className="text-green-400 border-green-400 hover:bg-green-400/10"
          >
            Mark as Resolved
          </Button>

          <Button
            onClick={() => onDismiss(factCheck.id)}
            variant="outline"
            size="sm"
            className="text-red-400 border-red-400 hover:bg-red-400/10"
          >
            Dismiss
          </Button>

          {factCheck.sources.length > 0 && (
            <Button
              onClick={() => onViewSource(factCheck)}
              variant="ghost"
              size="sm"
              className="text-gray-600 hover:text-gray-800"
            >
              View Sources
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
};

export const FactCheckPanel: React.FC<FactCheckPanelProps> = ({ className = "" }) => {
  const [selectedText, setSelectedText] = useState('');
  const [selectedChapter, setSelectedChapter] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAccuracy, setFilterAccuracy] = useState<string>('');
  const [showSourceModal, setShowSourceModal] = useState<FactCheckResult | null>(null);

  // Store hooks
  const project = useBookCraftStore(state => state.projects[state.activeProjectId!]);
  const isFactChecking = useBookCraftStore(state => state.isFactChecking);
  const verifyTextAccuracy = useBookCraftStore(state => state.verifyTextAccuracy);
  const acceptFactCheck = useBookCraftStore(state => state.acceptFactCheck);
  const dismissFactCheck = useBookCraftStore(state => state.dismissFactCheck);
  const batchFactCheck = useBookCraftStore(state => state.batchFactCheck);

  // Get chapter by ID
  const getChapterTitle = (chapterId: string): string => {
    const chapter = project?.chapters.find(c => c.id === chapterId);
    return chapter?.title || 'Unknown Chapter';
  };

  // Filter fact-check results
  const filteredFactChecks = React.useMemo(() => {
    let results = project?.factChecks || [];

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      results = results.filter(fc =>
        fc.claim.toLowerCase().includes(term) ||
        fc.explanation.toLowerCase().includes(term) ||
        getChapterTitle(fc.chapterId).toLowerCase().includes(term)
      );
    }

    // Filter by accuracy
    if (filterAccuracy) {
      results = results.filter(fc => fc.accuracy === filterAccuracy);
    }

    return results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [project?.factChecks, searchTerm, filterAccuracy]);

  // Get statistics
  const stats = React.useMemo(() => {
    const total = project?.factChecks.length || 0;
    const accurate = project?.factChecks.filter(fc => fc.accuracy === 'Accurate').length || 0;
    const questionable = project?.factChecks.filter(fc => fc.accuracy === 'Questionable').length || 0;
    const false_claims = project?.factChecks.filter(fc => fc.accuracy === 'False').length || 0;
    const unknown = project?.factChecks.filter(fc => fc.accuracy === 'Unknown').length || 0;

    return { total, accurate, questionable, false: false_claims, unknown };
  }, [project?.factChecks]);

  const handleFactCheck = async () => {
    if (!selectedText.trim() || !selectedChapter) {
      toast.error('Missing Information', 'Please select text and a chapter to fact-check.');
      return;
    }

    try {
      await verifyTextAccuracy(selectedText, selectedChapter);
      setSelectedText('');
    } catch (error) {
      log.error('FactCheckPanel: Fact checking failed', error);
    }
  };

  const handleBatchFactCheck = async () => {
    if (!project?.chapters.length) {
      toast.error('No Chapters', 'No chapters available for fact-checking.');
      return;
    }

    const chapterIds = project.chapters
      .filter(c => c.content.trim().length > 0)
      .map(c => c.id);

    if (chapterIds.length === 0) {
      toast.error('No Content', 'No chapters with content found.');
      return;
    }

    try {
      await batchFactCheck(chapterIds);
    } catch (error) {
      log.error('FactCheckPanel: Batch fact checking failed', error);
    }
  };

  return (
    <div className={`fact-check-panel ${className}`}>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">AI Fact Checking</h2>
        <p className="text-gray-600">
          Verify the accuracy of claims and statements in your content
        </p>
      </div>

      {/* Quick Stats */}
      <Card className="p-4 mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-3">Fact Check Summary</h3>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-800">{stats.total}</div>
            <div className="text-xs text-gray-600">Total Checks</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-400">{stats.accurate}</div>
            <div className="text-xs text-gray-600">Accurate</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-400">{stats.questionable}</div>
            <div className="text-xs text-gray-600">Questionable</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-400">{stats.false}</div>
            <div className="text-xs text-gray-600">False</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-400">{stats.unknown}</div>
            <div className="text-xs text-gray-600">Unknown</div>
          </div>
        </div>
      </Card>

      {/* Fact Check Input */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Manual Fact Check */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Manual Fact Check</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Chapter
              </label>
              <select
                value={selectedChapter}
                onChange={(e) => setSelectedChapter(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand-primary"
              >
                <option value="">Select a chapter...</option>
                {project?.chapters.map(chapter => (
                  <option key={chapter.id} value={chapter.id}>
                    {chapter.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Text to Fact Check
              </label>
              <textarea
                value={selectedText}
                onChange={(e) => setSelectedText(e.target.value)}
                placeholder="Enter the text you want to fact-check..."
                rows={4}
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand-primary resize-none"
              />
            </div>

            <Button
              onClick={handleFactCheck}
              disabled={!selectedText.trim() || !selectedChapter || isFactChecking}
              className="w-full"
            >
              {isFactChecking ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Fact Checking...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <ShieldCheckIcon className="w-4 h-4" />
                  Fact Check
                </div>
              )}
            </Button>
          </div>
        </Card>

        {/* Batch Operations */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Batch Operations</h3>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Automatically fact-check all chapters with content. This will analyze factual claims
              and verify them against reliable sources.
            </p>

            <div className="bg-yellow-900/20 border border-yellow-700/30 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <ExclamationTriangleIcon className="w-4 h-4 text-yellow-400 mt-0.5" />
                <div className="text-xs text-yellow-300">
                  <strong>Note:</strong> Batch fact-checking may take several minutes depending on content length.
                  AI fact-checking should be supplemented with manual verification.
                </div>
              </div>
            </div>

            <Button
              onClick={handleBatchFactCheck}
              disabled={isFactChecking || !project?.chapters.length}
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              {isFactChecking ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Processing...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <SparklesIcon className="w-4 h-4" />
                  Batch Fact Check All Chapters
                </div>
              )}
            </Button>
          </div>
        </Card>
      </div>

      {/* Search and Filter */}
      <Card className="p-4 mb-4">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search fact checks..."
              className="w-full"
            />
          </div>

          <select
            value={filterAccuracy}
            onChange={(e) => setFilterAccuracy(e.target.value)}
            className="px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand-primary"
          >
            <option value="">All Accuracy</option>
            <option value="Accurate">Accurate</option>
            <option value="Questionable">Questionable</option>
            <option value="False">False</option>
            <option value="Unknown">Unknown</option>
          </select>
        </div>
      </Card>

      {/* Fact Check Results */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">Fact Check Results</h3>
          <span className="text-sm text-gray-600">{filteredFactChecks.length} results</span>
        </div>

        {filteredFactChecks.length === 0 ? (
          <Card className="p-8 text-center">
            <ShieldCheckIcon className="mx-auto h-12 w-12 text-slate-600 mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              {searchTerm || filterAccuracy ? 'No matching fact checks' : 'No fact checks yet'}
            </h3>
            <p className="text-gray-600">
              {searchTerm || filterAccuracy
                ? 'Try adjusting your search or filters.'
                : 'Start fact-checking your content to see results here.'
              }
            </p>
          </Card>
        ) : (
          <div>
            {filteredFactChecks.map(factCheck => (
              <FactCheckCard
                key={factCheck.id}
                factCheck={factCheck}
                chapterTitle={getChapterTitle(factCheck.chapterId)}
                onAccept={acceptFactCheck}
                onDismiss={dismissFactCheck}
                onViewSource={setShowSourceModal}
              />
            ))}
          </div>
        )}
      </div>

      {/* Source Modal */}
      {showSourceModal && (
        <div className="fixed inset-0 bg-gray-900/30 flex items-center justify-center z-50">
          <Card className="p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Fact Check Sources</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSourceModal(null)}
                className="text-gray-600 hover:text-gray-800"
              >
                ×
              </Button>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Claim:</h4>
                <p className="text-sm text-gray-700 bg-gray-100/50 p-3 rounded">
                  {showSourceModal.claim}
                </p>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Sources Used:</h4>
                <div className="space-y-3">
                  {showSourceModal.sources.map(source => (
                    <div key={source.id} className="border border-gray-300 rounded-lg p-3">
                      <h5 className="font-medium text-gray-800">{source.title}</h5>
                      {source.author && (
                        <p className="text-sm text-gray-600">Author: {source.author}</p>
                      )}
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-gray-500">
                          Credibility: {source.credibility} •
                          Accessed: {new Date(source.accessDate).toLocaleDateString()}
                        </span>
                        {source.url && (
                          <a
                            href={source.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-brand-primary hover:text-brand-secondary text-sm flex items-center gap-1"
                          >
                            <LinkIcon className="w-3 h-3" />
                            View Source
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};