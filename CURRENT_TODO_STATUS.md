# Current To-Do Status

This document aggregates all the to-do lists and status reports from the repository to provide a single source of truth for the project's status.

## ✅ Completed

*   **Light Mode Conversion:** The entire application has been successfully converted from a dark to a light theme.
*   **Text Persistence:** Text is now correctly saved when navigating away from the editor.
*   **Material Tab Error:** The `TypeError: Cannot read properties of undefined (reading 'map')` error has been fixed.
*   **Research Functionality:** The OpenRouter API key configuration is working as intended.
*   **Chapter Structure & Get Suggestions AI Features:** These AI-powered features have been implemented and improved.
*   **Merge AI Fallback:** The "Merge with AI" feature now gracefully handles empty content.
*   **Select Component Errors:** The `Select` component has been fixed to work correctly in the Material and Export tabs.
*   **Model Selector Fix:** The selected model from the settings is now properly used for all AI requests.
*   **Color Scheme Enhancement:** The application's color scheme has been updated for better contrast and readability.
*   **Word Count Enforcement:** The AI now more accurately follows word count requirements.
*   **Manual Save Button:** A manual save button has been added to the chapter editor.
*   **Expandable AI Tool Boxes:** The `AIToolBox` component has been created.
*   **Grammar Checker "Fix All" Button:** A "Fix All" button has been added to the grammar checker.
*   **Structure Analysis Persistence:** The generated structure analysis is now properly displayed across sessions.
*   **App Rebranding:** The application has been rebranded from "BookCraft AI" to "WrittenUpAi".

## ❌ Needs Doing

### 🔴 High Priority

*   **Implement Real Grammar Check:** The current grammar checker is a placeholder and needs to be replaced with a real implementation (e.g., using the LanguageTool API).
*   **Undo Button for AI Edits:** A separate undo stack is needed for AI-powered edits made through the context menu.
*   **Text Highlighting Duration:** The duration of text highlights needs to be increased for better usability.
*   **AI Tools Status Indicators:** Better visual feedback (e.g., loading spinners) is needed when the AI tools are running.
*   **Insights History View:** A feature to view previously generated structures, suggestions, and analyses is needed.

### 🟡 Medium Priority

*   **Block Reorganization Feature:** A drag-and-drop feature to reorganize structure blocks is needed.
*   **Expandable Tool Boxes in UI:** The `AIToolBox` component needs to be integrated into the `ChapterEditorView`.
*   **Fix Password Form Warnings:** The `[DOM] Password field is not contained in a form` warning in the settings modal needs to be fixed.
*   **Visual Analysis Works, Verify All Features:** The visual analysis feature needs to be fully tested to ensure all visualization types work correctly.

### 🟢 Low Priority / Technical Debt

*   **TypeScript Errors:** The remaining TypeScript errors in the codebase need to be fixed.
*   **Code Cleanup:** Unused imports and commented-out code should be removed.
*   **Performance:** The application's render cycles should be optimized for better performance.
*   **Testing:** Unit tests should be added for critical functions.
*   **Documentation:** An API setup guide, feature documentation, and a development guide need to be created.
