import { useEffect } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { CAN_REDO_COMMAND, CAN_UNDO_COMMAND } from 'lexical';

interface HistoryState {
  canUndo: boolean;
  canRedo: boolean;
}

interface HistoryPluginProps {
  onHistoryStateChange: (state: HistoryState) => void;
}

export function HistoryStatePlugin({ onHistoryStateChange }: HistoryPluginProps) {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    const canUndoHandler = (canUndo: boolean) => {
      onHistoryStateChange(prev => ({ ...prev, canUndo }));
    };

    const canRedoHandler = (canRedo: boolean) => {
      onHistoryStateChange(prev => ({ ...prev, canRedo }));
    };

    // Register command listeners
    const removeCanUndoListener = editor.registerCommand(
      CAN_UNDO_COMMAND,
      canUndoHandler,
      1
    );

    const removeCanRedoListener = editor.registerCommand(
      CAN_REDO_COMMAND,
      canRedoHandler,
      1
    );

    return () => {
      removeCanUndoListener();
      removeCanRedoListener();
    };
  }, [editor, onHistoryStateChange]);

  return null;
}