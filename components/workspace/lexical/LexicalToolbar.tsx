import React, { useCallback, useEffect, useState } from 'react';
import {
  $getSelection,
  $isRangeSelection,
  SELECTION_CHANGE_COMMAND,
  FORMAT_TEXT_COMMAND,
  FORMAT_ELEMENT_COMMAND,
  UNDO_COMMAND,
  REDO_COMMAND,
  $getNodeByKey,
} from 'lexical';
import {
  $isHeadingNode,
  $createHeadingNode,
  $createQuoteNode,
  HeadingTagType,
} from '@lexical/rich-text';
import {
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_UNORDERED_LIST_COMMAND,
  REMOVE_LIST_COMMAND,
  $isListNode,
} from '@lexical/list';
import {
  $isLinkNode,
  TOGGLE_LINK_COMMAND,
} from '@lexical/link';
import { $isAtNodeEnd } from '@lexical/selection';
import { $getNearestNodeOfType, mergeRegister } from '@lexical/utils';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { HistoryStatePlugin } from './plugins/HistoryPlugin';
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Link,
  Quote,
  Type,
} from 'lucide-react';
import { Tooltip } from '../../UI';
import { log } from '../../../services/logger';

type FormatType = 'bold' | 'italic' | 'underline' | 'strikethrough';
type BlockType = 'paragraph' | 'h1' | 'h2' | 'h3' | 'quote' | 'bullet' | 'number';

interface ToolbarButtonProps {
  onClick: () => void;
  isActive?: boolean;
  disabled?: boolean;
  icon: React.ReactNode;
  tooltip: {
    title: string;
    description?: string;
    shortcut?: string;
  };
}

const ToolbarButton: React.FC<ToolbarButtonProps> = ({
  onClick,
  isActive = false,
  disabled = false,
  icon,
  tooltip,
}) => {
  const getButtonClass = (active: boolean, isDisabled: boolean) =>
    `p-2 rounded transition-colors ${
      isDisabled
        ? 'text-gray-500 cursor-not-allowed'
        : active
        ? 'bg-brand-primary text-gray-900'
        : 'hover:bg-gray-300 text-gray-700'
    }`;

  const tooltipContent = (
    <div className="text-center">
      <div className="font-medium">{tooltip.title}</div>
      {tooltip.description && (
        <div className="text-xs text-gray-700 mt-1">{tooltip.description}</div>
      )}
      {tooltip.shortcut && (
        <div className="text-xs text-gray-600 mt-1 font-mono bg-gray-100 px-1.5 py-0.5 rounded border border-gray-300">
          {tooltip.shortcut}
        </div>
      )}
    </div>
  );

  return (
    <Tooltip content={tooltipContent} position="top" delay={300}>
      <button
        onClick={onClick}
        disabled={disabled}
        className={getButtonClass(isActive, disabled)}
        type="button"
      >
        {icon}
      </button>
    </Tooltip>
  );
};

interface ToolbarState {
  isBold: boolean;
  isItalic: boolean;
  isUnderline: boolean;
  isStrikethrough: boolean;
  isLink: boolean;
  blockType: BlockType;
  canUndo: boolean;
  canRedo: boolean;
}

const getSelectedNode = (selection: any) => {
  const anchor = selection.anchor;
  const focus = selection.focus;
  const anchorNode = selection.anchor.getNode();
  const focusNode = selection.focus.getNode();
  if (anchorNode === focusNode) {
    return anchorNode;
  }
  const isBackward = selection.isBackward();
  if (isBackward) {
    return $isAtNodeEnd(focus) ? anchorNode : focusNode;
  } else {
    return $isAtNodeEnd(anchor) ? focusNode : anchorNode;
  }
};

export const LexicalToolbar: React.FC = () => {
  const [editor] = useLexicalComposerContext();
  const [toolbarState, setToolbarState] = useState<ToolbarState>({
    isBold: false,
    isItalic: false,
    isUnderline: false,
    isStrikethrough: false,
    isLink: false,
    blockType: 'paragraph',
    canUndo: false,
    canRedo: false,
  });

  const updateToolbar = useCallback(() => {
    try {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        const anchorNode = selection.anchor.getNode();
        let element;

        try {
          if (anchorNode.getKey() === 'root') {
            element = anchorNode;
          } else {
            element = anchorNode.getTopLevelElementOrThrow();
          }
        } catch (error) {
          log.warn('LexicalToolbar: Error getting element node', error);
          element = anchorNode.getParent() || anchorNode;
        }

        // Update format state
        setToolbarState(prevState => ({
          ...prevState,
          isBold: selection.hasFormat('bold'),
          isItalic: selection.hasFormat('italic'),
          isUnderline: selection.hasFormat('underline'),
          isStrikethrough: selection.hasFormat('strikethrough'),
          isLink: false,
          blockType: 'paragraph',
        }));

        // Check if we're in a link
        try {
          const node = getSelectedNode(selection);
          const parent = node.getParent();
          if ($isLinkNode(parent) || $isLinkNode(node)) {
            setToolbarState(prevState => ({
              ...prevState,
              isLink: true,
            }));
          }
        } catch (linkError) {
          log.warn('LexicalToolbar: Error checking link state', linkError);
        }

        // Determine block type
        try {
          if (element && $isListNode(element)) {
            const type = element.getListType();
            setToolbarState(prevState => ({
              ...prevState,
              blockType: type === 'bullet' ? 'bullet' : 'number',
            }));
          } else if (element && $isHeadingNode(element)) {
            const type = element.getTag();
            setToolbarState(prevState => ({
              ...prevState,
              blockType: type as BlockType,
            }));
          } else {
            // Default to paragraph for unknown or null elements
            setToolbarState(prevState => ({
              ...prevState,
              blockType: 'paragraph',
            }));
          }
        } catch (blockError) {
          log.warn('LexicalToolbar: Error determining block type', blockError);
          setToolbarState(prevState => ({
            ...prevState,
            blockType: 'paragraph',
          }));
        }
      }
    } catch (error) {
      log.error('LexicalToolbar: Error updating toolbar state', error);
    }
  }, [editor]);

  useEffect(() => {
    try {
      return mergeRegister(
        editor.registerUpdateListener(({ editorState }) => {
          editorState.read(() => {
            updateToolbar();
          });
        }),
        editor.registerCommand(
          SELECTION_CHANGE_COMMAND,
          () => {
            updateToolbar();
            return false;
          },
          1
        )
      );
    } catch (error) {
      log.error('LexicalToolbar: Error registering toolbar listeners', error);
      return () => {}; // Return empty cleanup function
    }
  }, [editor, updateToolbar]);

  const handleHistoryStateChange = useCallback((historyState: { canUndo?: boolean; canRedo?: boolean }) => {
    setToolbarState(prevState => ({
      ...prevState,
      ...historyState,
    }));
  }, []);

  const formatText = useCallback(
    (format: FormatType) => {
      try {
        editor.update(() => {
          editor.dispatchCommand(FORMAT_TEXT_COMMAND, format);
        });
      } catch (error) {
        log.error('LexicalToolbar: Format text command failed', error);
      }
    },
    [editor]
  );

  const formatHeading = useCallback(
    (headingSize: HeadingTagType) => {
      try {
        editor.update(() => {
          const selection = $getSelection();
          if ($isRangeSelection(selection)) {
            editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, headingSize);
          }
        });
      } catch (error) {
        log.error('LexicalToolbar: Format heading command failed', error);
      }
    },
    [editor]
  );

  const formatParagraph = useCallback(() => {
    try {
      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'paragraph');
        }
      });
    } catch (error) {
      log.error('LexicalToolbar: Format paragraph command failed', error);
    }
  }, [editor]);

  const formatQuote = useCallback(() => {
    try {
      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'quote');
        }
      });
    } catch (error) {
      log.error('LexicalToolbar: Format quote command failed', error);
    }
  }, [editor]);

  const formatBulletList = useCallback(() => {
    try {
      if (toolbarState.blockType !== 'bullet') {
        editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined);
      } else {
        editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined);
      }
    } catch (error) {
      log.error('LexicalToolbar: Format bullet list command failed', error);
    }
  }, [editor, toolbarState.blockType]);

  const formatNumberedList = useCallback(() => {
    try {
      if (toolbarState.blockType !== 'number') {
        editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined);
      } else {
        editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined);
      }
    } catch (error) {
      log.error('LexicalToolbar: Format numbered list command failed', error);
    }
  }, [editor, toolbarState.blockType]);

  const insertLink = useCallback(() => {
    try {
      if (!toolbarState.isLink) {
        const url = prompt('Enter the URL');
        if (url) {
          editor.dispatchCommand(TOGGLE_LINK_COMMAND, url);
        }
      } else {
        editor.dispatchCommand(TOGGLE_LINK_COMMAND, null);
      }
    } catch (error) {
      log.error('LexicalToolbar: Insert link command failed', error);
    }
  }, [editor, toolbarState.isLink]);

  const undo = useCallback(() => {
    try {
      editor.dispatchCommand(UNDO_COMMAND, undefined);
    } catch (error) {
      log.error('LexicalToolbar: Undo command failed', error);
    }
  }, [editor]);

  const redo = useCallback(() => {
    try {
      editor.dispatchCommand(REDO_COMMAND, undefined);
    } catch (error) {
      log.error('LexicalToolbar: Redo command failed', error);
    }
  }, [editor]);

  return (
    <>
      <HistoryStatePlugin onHistoryStateChange={handleHistoryStateChange} />
      <div className="p-3 border-b border-gray-300/50 flex items-center gap-1 bg-gray-100 rounded-t-lg flex-wrap">
      {/* Text Formatting */}
      <div className="flex items-center gap-1">
        <ToolbarButton
          onClick={() => formatText('bold')}
          isActive={toolbarState.isBold}
          icon={<Bold size={16} />}
          tooltip={{
            title: "Bold",
            description: "Make text bold",
            shortcut: "Ctrl+B"
          }}
        />
        <ToolbarButton
          onClick={() => formatText('italic')}
          isActive={toolbarState.isItalic}
          icon={<Italic size={16} />}
          tooltip={{
            title: "Italic",
            description: "Make text italic",
            shortcut: "Ctrl+I"
          }}
        />
        <ToolbarButton
          onClick={() => formatText('underline')}
          isActive={toolbarState.isUnderline}
          icon={<Underline size={16} />}
          tooltip={{
            title: "Underline",
            description: "Underline text",
            shortcut: "Ctrl+U"
          }}
        />
        <ToolbarButton
          onClick={() => formatText('strikethrough')}
          isActive={toolbarState.isStrikethrough}
          icon={<Strikethrough size={16} />}
          tooltip={{
            title: "Strikethrough",
            description: "Strike through text"
          }}
        />
      </div>

      <div className="w-px h-6 bg-gray-200 mx-2"></div>

      {/* Headings */}
      <div className="flex items-center gap-1">
        <ToolbarButton
          onClick={() => formatHeading('h1')}
          isActive={toolbarState.blockType === 'h1'}
          icon={<Heading1 size={16} />}
          tooltip={{
            title: "Heading 1",
            description: "Large heading for main sections"
          }}
        />
        <ToolbarButton
          onClick={() => formatHeading('h2')}
          isActive={toolbarState.blockType === 'h2'}
          icon={<Heading2 size={16} />}
          tooltip={{
            title: "Heading 2",
            description: "Medium heading for subsections"
          }}
        />
        <ToolbarButton
          onClick={() => formatHeading('h3')}
          isActive={toolbarState.blockType === 'h3'}
          icon={<Heading3 size={16} />}
          tooltip={{
            title: "Heading 3",
            description: "Small heading for sub-subsections"
          }}
        />
        <ToolbarButton
          onClick={formatParagraph}
          isActive={toolbarState.blockType === 'paragraph'}
          icon={<Type size={16} />}
          tooltip={{
            title: "Paragraph",
            description: "Normal paragraph text"
          }}
        />
      </div>

      <div className="w-px h-6 bg-gray-200 mx-2"></div>

      {/* Lists */}
      <div className="flex items-center gap-1">
        <ToolbarButton
          onClick={formatBulletList}
          isActive={toolbarState.blockType === 'bullet'}
          icon={<List size={16} />}
          tooltip={{
            title: "Bullet List",
            description: "Create an unordered list with bullet points"
          }}
        />
        <ToolbarButton
          onClick={formatNumberedList}
          isActive={toolbarState.blockType === 'number'}
          icon={<ListOrdered size={16} />}
          tooltip={{
            title: "Numbered List",
            description: "Create an ordered list with numbers"
          }}
        />
      </div>

      <div className="w-px h-6 bg-gray-200 mx-2"></div>

      {/* Advanced */}
      <div className="flex items-center gap-1">
        <ToolbarButton
          onClick={insertLink}
          isActive={toolbarState.isLink}
          icon={<Link size={16} />}
          tooltip={{
            title: "Insert Link",
            description: "Add or remove a hyperlink"
          }}
        />
        <ToolbarButton
          onClick={formatQuote}
          isActive={toolbarState.blockType === 'quote'}
          icon={<Quote size={16} />}
          tooltip={{
            title: "Quote",
            description: "Format text as a blockquote"
          }}
        />
      </div>

      <div className="w-px h-6 bg-gray-200 mx-2"></div>

      {/* Actions */}
      <div className="flex items-center gap-1">
        <ToolbarButton
          onClick={undo}
          disabled={!toolbarState.canUndo}
          icon={<span className="text-xs font-bold">↶</span>}
          tooltip={{
            title: "Undo",
            description: "Undo the last action",
            shortcut: "Ctrl+Z"
          }}
        />
        <ToolbarButton
          onClick={redo}
          disabled={!toolbarState.canRedo}
          icon={<span className="text-xs font-bold">↷</span>}
          tooltip={{
            title: "Redo",
            description: "Redo the last undone action",
            shortcut: "Ctrl+Y"
          }}
        />
      </div>
      </div>
    </>
  );
};