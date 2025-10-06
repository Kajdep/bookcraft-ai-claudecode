import React, { useState, useEffect, useRef } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $getSelection, $isRangeSelection, $getNodeByKey } from 'lexical';
import { Card, Button, Input } from '../../../UI';
import { MagnifyingGlassIcon, BookOpenIcon, XMarkIcon, SparklesIcon, ClockIcon, DocumentTextIcon } from '../../../Icons';
import { useBookCraftStore } from '../../../../store/useStore';
import { ResearchType, ResearchConfidence, ResearchItem } from '../../../../types';
import { log } from '../../../../services/logger';

interface ResearchLookupPluginProps {
  isEnabled?: boolean;
}

interface LookupModalState {
  isOpen: boolean;
  position: { x: number; y: number };
  selectedText: string;
  suggestions: ResearchItem[];
  isLoading: boolean;
}

const ResearchTypeIcon: React.FC<{ type: ResearchType; className?: string }> = ({ type, className = "w-4 h-4" }) => {
  const icons = {
    [ResearchType.FactCheck]: DocumentTextIcon,
    [ResearchType.TopicalResearch]: BookOpenIcon,
    [ResearchType.SourceVerification]: DocumentTextIcon,
    [ResearchType.QuickLookup]: SparklesIcon,
    [ResearchType.Historical]: ClockIcon,
    [ResearchType.Statistical]: DocumentTextIcon,
    [ResearchType.Expert]: DocumentTextIcon
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

export const ResearchLookupPlugin: React.FC<ResearchLookupPluginProps> = ({
  isEnabled = true
}) => {
  const [editor] = useLexicalComposerContext();
  const [modalState, setModalState] = useState<LookupModalState>({
    isOpen: false,
    position: { x: 0, y: 0 },
    selectedText: '',
    suggestions: [],
    isLoading: false
  });
  const [customQuery, setCustomQuery] = useState('');
  const modalRef = useRef<HTMLDivElement>(null);

  // Store hooks
  const project = useBookCraftStore(state => state.projects[state.activeProjectId!]);
  const searchResearch = useBookCraftStore(state => state.searchResearch);
  const performResearch = useBookCraftStore(state => state.performResearch);
  const isResearching = useBookCraftStore(state => state.isResearching);

  useEffect(() => {
    if (!isEnabled) return;

    const editorElement = editor.getRootElement();
    if (!editorElement) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Listen for /research command
      if (event.key === '/' && event.ctrlKey) {
        event.preventDefault();
        handleSlashCommand();
        return;
      }

      // Listen for Ctrl+Shift+R for research lookup
      if (event.key === 'R' && event.ctrlKey && event.shiftKey) {
        event.preventDefault();
        handleResearchLookup(event);
        return;
      }
    };

    const handleDoubleClick = (event: MouseEvent) => {
      // Double-click to research selected text
      setTimeout(() => {
        const selection = window.getSelection();
        const selectedText = selection?.toString().trim();

        if (selectedText && selectedText.length > 3) {
          handleResearchLookup(event, selectedText);
        }
      }, 0);
    };

    editorElement.addEventListener('keydown', handleKeyDown);
    editorElement.addEventListener('dblclick', handleDoubleClick);

    return () => {
      editorElement.removeEventListener('keydown', handleKeyDown);
      editorElement.removeEventListener('dblclick', handleDoubleClick);
    };
  }, [editor, isEnabled]);

  // Close modal on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        closeModal();
      }
    };

    if (modalState.isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [modalState.isOpen]);

  const handleSlashCommand = () => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        const rect = selection.getRootNode().getTopLevelElementOrThrow().getBoundingClientRect();
        openModal('', { x: rect.left, y: rect.bottom + 10 });
      }
    });
  };

  const handleResearchLookup = (event: MouseEvent | KeyboardEvent, text?: string) => {
    const selectedText = text || window.getSelection()?.toString().trim() || '';

    if (!selectedText || selectedText.length < 3) return;

    // Get cursor position for modal placement
    const range = window.getSelection()?.getRangeAt(0);
    const rect = range?.getBoundingClientRect();

    if (rect) {
      openModal(selectedText, {
        x: Math.min(rect.left, window.innerWidth - 400),
        y: rect.bottom + 10
      });
    }
  };

  const openModal = (selectedText: string, position: { x: number; y: number }) => {
    // Search existing research for related items
    const suggestions = selectedText ? searchResearch(selectedText).slice(0, 3) : [];

    setModalState({
      isOpen: true,
      position,
      selectedText,
      suggestions,
      isLoading: false
    });
    setCustomQuery(selectedText);
  };

  const closeModal = () => {
    setModalState(prev => ({ ...prev, isOpen: false }));
    setCustomQuery('');
  };

  const handleQuickResearch = async (query: string, type: ResearchType = ResearchType.QuickLookup) => {
    if (!query.trim()) return;

    setModalState(prev => ({ ...prev, isLoading: true }));

    try {
      await performResearch(query.trim(), type);
      // Refresh suggestions after new research
      const newSuggestions = searchResearch(query).slice(0, 3);
      setModalState(prev => ({
        ...prev,
        suggestions: newSuggestions,
        isLoading: false
      }));
    } catch (error) {
      log.error('Research failed', error);
      setModalState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const insertResearchReference = (research: ResearchItem) => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        const textNode = selection.getTextContent();
        const referenceText = ` [Research: ${research.query}]`;
        selection.insertText(referenceText);
      }
    });
    closeModal();
  };

  if (!modalState.isOpen) return null;

  return (
    <div
      ref={modalRef}
      className="fixed z-50 bg-gray-100 border border-gray-300 rounded-lg shadow-xl max-w-md w-96"
      style={{
        left: `${modalState.position.x}px`,
        top: `${modalState.position.y}px`,
        maxHeight: '400px'
      }}
    >
      <div className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <MagnifyingGlassIcon className="w-5 h-5" />
            Research Lookup
          </h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={closeModal}
            className="text-gray-600 hover:text-gray-800"
          >
            <XMarkIcon className="w-4 h-4" />
          </Button>
        </div>

        {/* Selected Text Display */}
        {modalState.selectedText && (
          <div className="mb-4 p-3 bg-white/50 rounded-lg">
            <p className="text-sm text-gray-700">
              <span className="font-medium">Selected text:</span> "{modalState.selectedText}"
            </p>
          </div>
        )}

        {/* Quick Research Input */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Research Query
          </label>
          <div className="flex gap-2">
            <Input
              value={customQuery}
              onChange={(e) => setCustomQuery(e.target.value)}
              placeholder="Enter research topic..."
              className="flex-1"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleQuickResearch(customQuery);
                }
              }}
            />
            <Button
              onClick={() => handleQuickResearch(customQuery)}
              disabled={!customQuery.trim() || modalState.isLoading}
              size="sm"
              className="min-w-[80px]"
            >
              {modalState.isLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <MagnifyingGlassIcon className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-4">
          <p className="text-sm font-medium text-gray-700 mb-2">Quick Actions:</p>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleQuickResearch(modalState.selectedText || customQuery, ResearchType.FactCheck)}
              disabled={!(modalState.selectedText || customQuery.trim()) || modalState.isLoading}
            >
              Fact Check
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleQuickResearch(modalState.selectedText || customQuery, ResearchType.Historical)}
              disabled={!(modalState.selectedText || customQuery.trim()) || modalState.isLoading}
            >
              Historical Context
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleQuickResearch(modalState.selectedText || customQuery, ResearchType.Expert)}
              disabled={!(modalState.selectedText || customQuery.trim()) || modalState.isLoading}
            >
              Expert Opinion
            </Button>
          </div>
        </div>

        {/* Existing Research Suggestions */}
        {modalState.suggestions.length > 0 && (
          <div>
            <p className="text-sm font-medium text-gray-700 mb-3">Related Research:</p>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {modalState.suggestions.map((research) => (
                <Card key={research.id} className="p-3 hover:bg-white/50 cursor-pointer transition-colors">
                  <div
                    onClick={() => insertResearchReference(research)}
                    className="space-y-2"
                  >
                    <div className="flex items-center gap-2">
                      <ResearchTypeIcon type={research.type} className="w-3 h-3" />
                      <h4 className="text-sm font-medium text-gray-800 flex-1">{research.query}</h4>
                      <ConfidenceBadge confidence={research.confidence} />
                    </div>
                    <p className="text-xs text-gray-600 line-clamp-2">{research.summary}</p>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>{research.wordCount} words</span>
                      <span>{new Date(research.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Help Text */}
        <div className="mt-4 pt-3 border-t border-gray-300">
          <p className="text-xs text-gray-500">
            <strong>Tip:</strong> Double-click text to research, Ctrl+Shift+R for lookup, or Ctrl+/ for command palette
          </p>
        </div>
      </div>
    </div>
  );
};