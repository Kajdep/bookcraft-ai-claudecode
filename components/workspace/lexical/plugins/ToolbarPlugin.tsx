import React from 'react';
import { LexicalToolbar } from '../LexicalToolbar';

/**
 * Toolbar plugin that provides a rich text formatting toolbar for the Lexical editor.
 * This plugin wraps the LexicalToolbar component and integrates it with the editor.
 */
export const ToolbarPlugin: React.FC = () => {
  return <LexicalToolbar />;
};