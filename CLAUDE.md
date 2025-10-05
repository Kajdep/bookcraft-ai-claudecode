# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview
BookCraft AI is a React-based web application that helps users write books using AI assistance. It combines OpenRouter for text generation and Google Gemini for image generation, providing a comprehensive book creation platform.

## Development Commands

### Core Commands
- `npm install` - Install all dependencies
- `npm run dev` - Start development server (Vite on port 5173)
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## Architecture & Key Components

### State Management
- **Zustand with Immer**: All application state is managed in `store/useStore.ts`
- Uses persistence middleware with custom `storageAdapter` to save state to localStorage/IndexedDB
- **CRITICAL**: Use individual selectors instead of object destructuring to prevent unnecessary re-renders
  ```typescript
  // ✅ CORRECT - Individual selectors
  const projects = useBookCraftStore(state => state.projects);
  const activeProjectId = useBookCraftStore(state => state.activeProjectId);

  // ❌ WRONG - Object destructuring causes re-renders
  const { projects, activeProjectId } = useBookCraftStore();
  ```
- State includes: projects, chapters, visuals, research, materials, plot points, analytics, and UI state
- Centralized modal management via `closeAllModals()` action

### AI Integration
- **Hybrid Approach**:
  - **OpenRouter API** (default model: `nvidia/nemotron-nano-9b-v2:free`) for text generation
  - **Google Gemini API** for image generation and multimodal tasks
- Service layer in `services/ai.ts` handles all AI interactions with:
  - Rate limiting and retry logic
  - Environment config fallbacks via `getAISettings()`
  - Centralized error handling and logging
- All AI calls go through service functions: `generateChapterContent()`, `analyzeForVisuals()`, `generateResearch()`, etc.

### Component Structure
- **App.tsx**: Root component with Header, SettingsModal, and MainLayout
- **MainLayout.tsx**: Switches between Dashboard and ProjectWorkspace
- **Dashboard.tsx**: Project management, creation, and listing
- **ProjectWorkspace.tsx**: Main writing environment with tabbed interface:
  - **Writing Studio** (`WritingStudio.tsx`): Chapter management with Lexical rich text editor
  - **Visuals** (`VisualsWorkspace.tsx`, `AIVisualsTab.tsx`): AI-generated diagrams (Mermaid.js) and images
  - **Research** (`ResearchTab.tsx`): AI research tools, fact-checking, folder organization
  - **Material** (`MaterialTab.tsx`): Reference materials, documents, and attachments
  - **Plot** (`PlotTab.tsx`): Story structure and plot point management
  - **Analytics** (`AnalyticsTab.tsx`): Writing sessions, goals, streaks, productivity metrics
  - **Cover Creator** (`CoverCreator.tsx`): Book cover design with templates and elements
  - **KDP Calculator** (`KDPCalculator.tsx`): Amazon KDP pricing calculator
  - **Export** (`ExportTab.tsx`): Multi-format export (PDF, DOCX, EPUB, Markdown, TXT)

### Type System
- All types defined in `types.ts` with comprehensive TypeScript enums
- Key entities: `Project`, `Chapter`, `Visual`, `PlotPoint`, `ResearchItem`, `MaterialItem`, `WritingSession`, `WritingGoal`
- Uses enums for: `ProjectStatus`, `ChapterStatus`, `VisualType`, `ResearchType`, `CitationStyle`, etc.

### Rich Text Editor (Lexical)
- **Lexical v0.35.0** with React 19 integration
- Located in `components/workspace/lexical/`
- Components:
  - `LexicalEditor.tsx` - Main editor component with plugins
  - `LexicalToolbar.tsx` - Formatting toolbar with tooltips
  - `plugins/ToolbarPlugin.tsx` - Advanced toolbar actions
  - `plugins/HistoryPlugin.tsx` - Undo/redo support
  - `plugins/ResearchLookupPlugin.tsx` - Research integration
- Stores content as HTML in chapter.content
- Supports: bold, italic, underline, headings, lists, links, code blocks

## Key Features & Implementation Notes

### Export System
- Multi-format export via `services/export.ts`
- Formats: PDF (jsPDF), DOCX (docx), EPUB (epub-gen-memory), Markdown, Plain Text
- HTML to DOCX conversion handles rich text formatting
- Each export function is isolated and can be tested independently

### Research & Fact-Checking
- AI-powered research via OpenRouter
- Folder organization with types: Default, Chapter, Theme, Character, Location, Technical, Historical
- Citation management with multiple styles (APA, MLA, Chicago, Harvard)
- Fact-checking panel with confidence levels and source credibility tracking

### Visual Generation
- Text analysis recommends visual types (flowcharts, timelines, mind maps, comparison charts)
- Generates Mermaid.js diagram code
- Renders diagrams using mermaid library
- Image generation via Gemini API with prompt customization

### Analytics & Productivity
- Tracks writing sessions with word count, keystroke data, active/idle time
- Writing goals system (words, chapters, hours, pages, sessions)
- Streak tracking with calendar visualization
- Daily/weekly/monthly productivity metrics

## Environment Setup
Required environment variables in `.env.local`:
```
OPENROUTER_API_KEY=sk-or-v1-...
GEMINI_API_KEY=AIza...
```

Optional environment variables (with defaults):
```
OPENROUTER_ENDPOINT=https://openrouter.ai/api/v1
GEMINI_ENDPOINT=https://generativelanguage.googleapis.com
DEFAULT_AI_MODEL=nvidia/nemotron-nano-9b-v2:free
DEFAULT_TEMPERATURE=0.7
DEFAULT_MAX_TOKENS=4000
ENABLE_DEBUG_LOGGING=false
VALIDATE_API_KEYS=true
API_RATE_LIMIT=100
```

See `vite.config.ts` for full environment configuration.

## Code Conventions & Best Practices

### React & TypeScript
- Functional components with hooks (React 19)
- TypeScript strict mode enabled
- Prefer explicit typing over inference for component props
- Use `React.FC<Props>` for component type definitions

### State Management Patterns
- Individual Zustand selectors (not object destructuring)
- All state mutations through Zustand actions
- Use Immer for nested state updates
- Centralized modal state with cleanup hooks

### Styling
- Tailwind CSS with custom design system
- Color palette: brand-primary, slate-{100-900}, accent colors
- Dark theme by default
- Responsive design with mobile-first approach

### Error Handling
- Error boundaries wrap all major component trees
- Toast notifications for user-facing errors (`services/toast.ts`)
- Logging service for debugging (`services/logger.ts`)
- Graceful degradation for missing API keys

### Icons & UI
- Custom icon components in `components/Icons.tsx`
- Reusable UI components in `components/UI.tsx`: Button, Input, Card, Badge, etc.
- Consistent spacing and sizing via Tailwind utilities

## Important Files & Directories

### Core Application
- `App.tsx` - Root component with settings and layout
- `index.tsx` - Application entry point
- `types.ts` - TypeScript type definitions
- `vite.config.ts` - Build configuration with environment variables

### State & Services
- `store/useStore.ts` - Central Zustand store with all actions
- `store/storageAdapter.ts` - localStorage/IndexedDB persistence
- `services/ai.ts` - AI service integration (OpenRouter, Gemini)
- `services/export.ts` - Multi-format export functionality
- `services/logger.ts` - Logging utility
- `services/toast.ts` - Toast notification system

### Components
- `components/MainLayout.tsx` - Main layout wrapper
- `components/Dashboard.tsx` - Project dashboard
- `components/ProjectWorkspace.tsx` - Main workspace with tabs
- `components/workspace/*` - All workspace tab components
- `components/workspace/lexical/*` - Lexical editor components

## Development Workflow

### Making Changes
1. State changes must go through Zustand actions in `store/useStore.ts`
2. AI operations must use service layer functions in `services/ai.ts`
3. New features require TypeScript types in `types.ts`
4. Use existing UI components and styling patterns
5. Handle errors with toast notifications and logging
6. Add error boundaries for new component trees

### Zustand Best Practices
- Use individual selectors to prevent re-renders
- Avoid nested object selectors
- Use Immer for complex state updates
- Test state changes in isolation

### Common Pitfalls
- **Re-render loops**: Caused by object destructuring Zustand state or improper useEffect dependencies
- **Modal state**: Always use centralized modal actions (`closeAllModals()`)
- **API keys**: Check environment configuration in both `.env.local` and `vite.config.ts`
- **Storage limits**: localStorage has ~5MB limit; large projects use IndexedDB fallback

## Testing & Debugging
- Browser DevTools for React debugging
- Zustand DevTools for state inspection
- Logger service for application flow tracking
- Error boundaries provide detailed error information in development mode