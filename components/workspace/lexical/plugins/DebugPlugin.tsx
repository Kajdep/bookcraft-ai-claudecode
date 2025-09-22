import { useEffect } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $getRoot } from 'lexical';

interface DebugPluginProps {
  enabled?: boolean;
}

export function DebugPlugin({ enabled = process.env.NODE_ENV === 'development' }: DebugPluginProps) {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    if (!enabled) return;

    console.log('Lexical Editor Debug Plugin: Editor initialized');

    const rootElement = editor.getRootElement();
    if (rootElement) {
      console.log('Lexical Editor Debug Plugin: Root element found', rootElement);
      // Add visual debug indicator
      rootElement.setAttribute('data-lexical-debug', 'enabled');
    } else {
      console.warn('Lexical Editor Debug Plugin: No root element found');
    }

    const removeUpdateListener = editor.registerUpdateListener(({ editorState }) => {
      if (enabled) {
        editorState.read(() => {
          const root = $getRoot();
          console.log('Lexical Editor Debug Plugin: Content updated', {
            isEmpty: root.isEmpty(),
            textContent: root.getTextContent(),
            nodeCount: root.getChildrenSize()
          });
        });
      }
    });

    const removeMountListener = editor.registerRootListener((rootElement) => {
      if (enabled) {
        console.log('Lexical Editor Debug Plugin: Root element changed', rootElement);
      }
    });

    return () => {
      removeUpdateListener();
      removeMountListener();
    };
  }, [editor, enabled]);

  return null;
}