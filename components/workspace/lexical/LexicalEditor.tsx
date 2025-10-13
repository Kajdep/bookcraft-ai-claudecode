import React, { useEffect, useRef } from 'react';
import { $generateHtmlFromNodes, $generateNodesFromDOM } from '@lexical/html';
import { $getRoot, $getSelection, $isRangeSelection } from 'lexical';
import { AutoFocusPlugin } from '@lexical/react/LexicalAutoFocusPlugin';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { HeadingNode, QuoteNode } from '@lexical/rich-text';
import { ListNode, ListItemNode } from '@lexical/list';
import { LinkNode, AutoLinkNode } from '@lexical/link';
import { ToolbarPlugin } from './plugins/ToolbarPlugin';
import { ResearchLookupPlugin } from './plugins/ResearchLookupPlugin';
import { DebugPlugin } from './plugins/DebugPlugin';
import { log } from '../../../services/logger';

// Content sync plugin to handle HTML import/export
function ContentSyncPlugin({
  content,
  onContentChange
}: {
  content: string;
  onContentChange: (html: string) => void;
}) {
  const [editor] = useLexicalComposerContext();
  const isUpdatingRef = useRef(false);

  // Import HTML content when it changes externally
  useEffect(() => {
    if (isUpdatingRef.current) {
      log.debug('Lexical: Skipping update - already updating');
      return;
    }

    editor.update(() => {
      try {
        // Only update if content is different from current editor content
        const currentHtml = $generateHtmlFromNodes(editor, null);
        const normalizedCurrentHtml = currentHtml.trim();
        const normalizedNewContent = (content || '').trim();
        
        // Additional validation for content integrity
        if (normalizedCurrentHtml === normalizedNewContent) {
          log.debug('Lexical: Content already matches, skipping update');
          return;
        }
        
        // Validate that we're not trying to update with invalid content
        if (normalizedNewContent && normalizedNewContent.length > 0 && normalizedNewContent !== '<p></p>') {
          log.debug('Lexical: Valid content detected, proceeding with update');
        } else if (normalizedCurrentHtml.length > 0) {
          log.debug('Lexical: New content is empty but current content exists, preserving current content');
          return;
        }

        log.debug('Lexical: Updating content', {
          from: normalizedCurrentHtml.substring(0, 50),
          to: normalizedNewContent.substring(0, 50)
        });
        
        // Set updating flag to prevent race conditions
        isUpdatingRef.current = true;
        
        const parser = new DOMParser();
        const dom = parser.parseFromString(normalizedNewContent || '<p></p>', 'text/html');
        const nodes = $generateNodesFromDOM(editor, dom);
        const root = $getRoot();
        root.clear();
        root.append(...nodes);
        
        log.debug('Lexical: Content updated successfully');
        
        // Force editor to focus after content update to ensure it's visible
        setTimeout(() => {
          try {
            const selection = $getSelection();
            if ($isRangeSelection(selection)) {
              const rootNode = $getRoot();
              if (rootNode.getChildrenSize() > 0) {
                const lastChild = rootNode.getLastChild();
                if (lastChild) {
                  lastChild.selectEnd();
                }
              }
            }
          } catch (selectionError) {
            // Selection error is not critical
            log.warn('Lexical: Selection update failed', selectionError);
          }
          // Reset updating flag after focus is set
          isUpdatingRef.current = false;
        }, 100);
        
      } catch (error) {
        log.error('Failed to import HTML content', error as Error, 'ContentSyncPlugin');
        // Reset flag on error
        isUpdatingRef.current = false;
      }
    });
  }, [content, editor]);

  // Export HTML when content changes
  useEffect(() => {
    const removeListener = editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        try {
          isUpdatingRef.current = true;
          const html = $generateHtmlFromNodes(editor, null);
          onContentChange(html);
          setTimeout(() => {
            isUpdatingRef.current = false;
          }, 0);
        } catch (error) {
          log.error('Failed to export HTML content', error as Error, 'ContentSyncPlugin');
        }
      });
    });

    return removeListener;
  }, [editor, onContentChange]);

  return null;
}

// Selection tracking plugin for toolbar state
function SelectionPlugin({ onSelectionChange }: { onSelectionChange: () => void }) {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    const removeListener = editor.registerUpdateListener(() => {
      onSelectionChange();
    });

    return removeListener;
  }, [editor, onSelectionChange]);

  return null;
}

// Context menu plugin
function ContextMenuPlugin({ onContextMenu }: { onContextMenu: (e: React.MouseEvent) => void }) {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    const editorElement = editor.getRootElement();
    if (!editorElement) return;

    const handleContextMenu = (e: MouseEvent) => {
      const selection = window.getSelection();
      const selectedText = selection?.toString().trim();

      if (selection && selectedText && selectedText.length > 10) {
        onContextMenu(e as any);
      }
    };

    editorElement.addEventListener('contextmenu', handleContextMenu);
    return () => editorElement.removeEventListener('contextmenu', handleContextMenu);
  }, [editor, onContextMenu]);

  return null;
}

interface LexicalEditorProps {
  content: string;
  onContentChange: (html: string) => void;
  onContextMenu?: (e: React.MouseEvent) => void;
  onSelectionChange?: () => void;
  placeholder?: string;
  className?: string;
  enableResearchLookup?: boolean;
}

export const LexicalEditor: React.FC<LexicalEditorProps> = ({
  content,
  onContentChange,
  onContextMenu,
  onSelectionChange,
  placeholder = "Start writing...",
  className = "",
  enableResearchLookup = true
}) => {
  // Editor configuration
  const initialConfig = {
    namespace: 'BookCraftEditor',
    editorState: null, // Let the ContentSyncPlugin handle the initial state
    theme: {
      text: {
        bold: 'font-bold',
        italic: 'italic',
        underline: 'underline',
        strikethrough: 'line-through',
      },
      heading: {
        h1: 'text-3xl font-bold mb-4',
        h2: 'text-2xl font-bold mb-3',
        h3: 'text-xl font-bold mb-2',
      },
      list: {
        listitem: 'mb-1',
        ol: 'list-decimal pl-6',
        ul: 'list-disc pl-6',
      },
      quote: 'border-l-4 border-slate-400 pl-4 italic',
      link: 'text-blue-600 underline hover:text-blue-800',
      paragraph: 'mb-4',
    },
    nodes: [
      HeadingNode,
      ListNode,
      ListItemNode,
      QuoteNode,
      LinkNode,
      AutoLinkNode,
    ],
    onError: (error: Error) => {
      log.error('Lexical editor error', error);
    },
  };

  const handleSelectionChange = () => {
    if (onSelectionChange) {
      onSelectionChange();
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    if (onContextMenu) {
      onContextMenu(e);
    }
  };

  return (
    <div className={`lexical-editor h-full flex flex-col ${className}`}>
      <LexicalComposer initialConfig={initialConfig}>
        <ToolbarPlugin />
        <div className="flex-grow relative overflow-y-auto bg-[#fdf6e3] rounded-b-lg">
          <RichTextPlugin
            contentEditable={
              <ContentEditable
                className="w-full h-full bg-transparent text-slate-800 p-6 resize-none focus:outline-none focus:ring-0 leading-relaxed prose prose-lg max-w-none min-h-full"
                style={{ minHeight: '100%' }}
                aria-label={placeholder}
                role="textbox"
                aria-multiline="true"
                data-testid="lexical-content-editable"
              />
            }
            placeholder={
              <div className="absolute top-6 left-6 text-gray-500 pointer-events-none">
                {placeholder}
              </div>
            }
            ErrorBoundary={LexicalErrorBoundary}
          />
          <HistoryPlugin />
          <AutoFocusPlugin />
          <ContentSyncPlugin
            content={content}
            onContentChange={onContentChange}
          />
          <SelectionPlugin onSelectionChange={handleSelectionChange} />
          {onContextMenu && (
            <ContextMenuPlugin onContextMenu={handleContextMenu} />
          )}
          {enableResearchLookup && (
            <ResearchLookupPlugin isEnabled={enableResearchLookup} />
          )}
          <DebugPlugin />
        </div>
      </LexicalComposer>
    </div>
  );
};