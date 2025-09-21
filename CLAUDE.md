# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview
BookCraft AI is a React-based web application that helps users write books using AI assistance. It combines OpenRouter for text generation and Google Gemini for image generation, providing a comprehensive book creation platform. Use Agents to be as efficient and skilful as much as possible. 

## Development Commands

### Core Commands
- `npm install` - Install all dependencies
- `npm run dev` - Start development server (Vite)
- `npm run build` - Build for production
- `npm run preview` - Preview production build

### Testing
- `node test-apis.js` - Test API connections
- `node test-full-workflow.js` - Test complete workflow

## Architecture & Key Components

### State Management
- **Zustand with Immer**: All application state is managed in `store/useStore.ts`
- Uses persistence middleware to save state to localStorage
- State includes projects, chapters, visuals, and AI generation status

### AI Integration
- **Hybrid Approach**:
  - OpenRouter API (`nvidia/nemotron-nano-9b-v2:free`) for text generation
  - Google Gemini API for image generation
- Service layer in `services/ai.ts` handles all AI interactions
- All AI calls go through centralized service functions with error handling

### Component Structure
- **Main Layout**: `App.tsx` switches between Dashboard and ProjectWorkspace
- **Dashboard**: Project management and creation
- **ProjectWorkspace**: Main writing environment with tabs for different features:
  - WritingDesk: Chapter editing with rich text editor
  - PlotTab: Plot point management
  - ResearchTab: Research material storage
  - VisualsWorkspace: AI-generated visuals and charts
  - CoverCreator: Book cover design
  - ExportTab: Export functionality

### Type System
- All types defined in `types.ts`
- Key entities: Project, Chapter, Visual, PlotPoint, VisualRecommendation
- Uses TypeScript enums for statuses (ProjectStatus, ChapterStatus, etc.)

## Key Features & Implementation Notes

### Chapter Management
- Chapters stored with HTML content (rich text editing)
- Support for reordering via drag-and-drop
- AI-powered content generation with customizable word count and style

### Visual Generation
- Analyzes text to recommend visual types (flowcharts, timelines, etc.)
- Generates Mermaid.js code for diagrams
- Image generation via Gemini API

### AI Assistant Features
- Chapter planning and structure generation
- Content refinement and expansion
- Context-aware suggestions
- Writer's block assistance

## Environment Setup
Required environment variables in `.env.local`:
- `GEMINI_API_KEY` - Google AI Studio API key
- `OPENROUTER_API_KEY` - OpenRouter API key

## Code Conventions
- React functional components with hooks
- TypeScript for all components and services
- Tailwind CSS for styling with custom design system colors
- Icons from custom Icons.tsx component
- Error boundaries for graceful error handling
- Toast notifications for user feedback

## Important Files
- `store/useStore.ts` - Central state management
- `services/ai.ts` - AI service integration
- `types.ts` - TypeScript type definitions
- `components/ProjectWorkspace.tsx` - Main workspace component
- `components/workspace/*` - Feature-specific workspace tabs

## Development Workflow
1. Changes to state should be made through Zustand actions
2. AI operations should use the service layer functions
3. All new features should have proper TypeScript types
4. Use existing UI components and styling patterns
5. Handle errors with toast notifications and logging

## Current Progress & Status (Updated: 2025-09-21)

### ✅ Completed Features
- **Lexical Rich Text Editor**: Full implementation with toolbar, formatting options, and tooltips
- **Research Tab**: Fully functional with AI research tools and folder organization
- **Export Tab**: Basic UI implementation complete
- **Icons System**: All icons properly exported and displaying correctly
- **UI/UX Design**: Professional dark theme with consistent branding

### 🐛 Known Issues (Critical - Needs Immediate Fix)
1. **PlotTab Infinite Loop** (`components/workspace/PlotTab.tsx`):
   - Maximum update depth exceeded error
   - Component crashes on mount
   - Likely Zustand state management issue

2. **Project Creation Workflow Broken**:
   - "New Project" button non-functional
   - Modal/form not accessible
   - Blocks users from creating projects

3. **Modal State Management**:
   - Persistent modals blocking navigation
   - State not properly clearing on dismissal

4. **Lexical Editor Not Accessible**:
   - Integration appears incomplete in WritingDesk
   - No contenteditable elements found

5. **AI Features Not Working**:
   - OpenRouter text generation inaccessible
   - Google Gemini image generation blocked by modal issues

### 📝 Next Steps (Priority Order)
1. Fix PlotTab infinite loop - Check useEffect dependencies in PlotTab.tsx
2. Implement project creation modal in Dashboard.tsx
3. Debug modal state management in useStore.ts
4. Verify Lexical editor mounting in ChapterEditorView.tsx
5. Test and fix AI service integrations
6. Add error boundaries for better crash recovery

### 💡 Development Notes
- The Zustand store may have circular dependencies causing infinite loops
- Modal state management needs a centralized controller
- Consider implementing React Error Boundaries for better error handling
- All AI API keys are properly configured in .env.local