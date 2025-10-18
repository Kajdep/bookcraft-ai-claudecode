<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# WrittenUpAI (BookCraft AI)

**A comprehensive AI-powered writing platform for authors** - Create, organize, and publish your books with cutting-edge AI assistance, professional-grade tools, and intelligent workflow automation.

[![Version](https://img.shields.io/badge/version-2.0.0-blue.svg)](https://github.com/Kajdep/bookcraft-ai-claudecode)
[![Status](https://img.shields.io/badge/status-production--ready-green.svg)](https://github.com/Kajdep/bookcraft-ai-claudecode)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

---

## 📚 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [Quick Start](#-quick-start)
- [Core Features](#-core-features)
- [AI Integration](#-ai-integration)
- [Technology Stack](#-technology-stack)
- [Project Structure](#-project-structure)
- [Configuration](#-configuration)
- [Development](#-development)
- [Deployment](#-deployment)
- [Documentation](#-documentation)
- [Contributing](#-contributing)

---

## 🎯 Overview

WrittenUpAI (formerly BookCraft AI) is a modern, feature-rich writing platform designed for authors who want professional-grade tools combined with AI assistance. Whether you're writing fiction, non-fiction, technical documentation, or academic papers, WrittenUpAI provides everything you need in one integrated environment.

### What Makes WrittenUpAI Special?

- **🤖 Hybrid AI System** - Combines OpenRouter (text) and Google Gemini (images) for best-in-class AI capabilities
- **💾 Smart Storage** - Hybrid IndexedDB + Supabase architecture with 50MB+ local capacity and optional cloud sync
- **📴 Offline-First** - Full functionality without internet connection, auto-sync when online
- **✍️ Professional Editor** - Powered by Lexical with rich text formatting and research integration
- **📊 Analytics & Insights** - Track writing sessions, goals, streaks, and productivity metrics
- **🎨 Visual Tools** - AI-generated diagrams (Mermaid.js) and images for your manuscript
- **📚 Research Hub** - Integrated fact-checking, citation management, and research organization
- **📤 Multi-Format Export** - Export to DOCX, PDF, EPUB, Markdown, and plain text

---

## ✨ Key Features

### 🖊️ Writing & Editing

- **Lexical Rich Text Editor** - Distraction-free writing with advanced formatting
- **Chapter Management** - Organize manuscripts with drag-and-drop chapter ordering
- **Multiple Views** - List, Kanban board, and split-screen editor views
- **Auto-Save System** - Save every 2 seconds with visual status indicators
- **Writing Templates** - Pre-built templates for various genres and formats
- **Grammar Checker** - Integrated grammar and style checking (optional API)
- **Contradiction Detection** - AI-powered consistency checking across chapters

### 🤖 AI Assistance

- **Content Generation** - AI-powered chapter and content creation
- **AI Assistant** - Context-aware writing suggestions and improvements
- **Writer's Block Tool** - Overcome creative blocks with AI prompts
- **Research Assistant** - Automated fact-checking and topic research
- **Visual Generation** - Create flowcharts, timelines, mind maps, and diagrams
- **Image Generation** - Generate book-related images via Gemini AI
- **Plot Development** - AI-assisted story structure and plot point planning

### 📁 Organization & Management

- **Project Management** - Multiple projects with status tracking
- **Material Library** - Store references, images, documents, audio, and video
- **Research Tools** - Web scraping, citation management, and folder organization
- **Plot Board** - Visual plot point management and story arc planning
- **Tags & Folders** - Flexible organization system for all content types
- **Chapter Notes** - Per-chapter annotations and reminders

### 📊 Analytics & Productivity

- **Writing Sessions** - Track time, word count, and keystrokes
- **Goal Setting** - Set goals for words, chapters, hours, pages, or sessions
- **Streak Tracking** - Maintain writing momentum with calendar visualization
- **Productivity Insights** - Identify best writing times and patterns
- **Progress Visualization** - Charts and graphs for writing metrics
- **Export Reports** - Generate productivity reports for analysis

### 🎨 Publishing Tools

- **Cover Creator** - Design book covers with templates and custom elements
- **KDP Calculator** - Calculate Amazon KDP printing costs and royalties
- **Multi-Format Export** - Export to DOCX, PDF, EPUB, Markdown, TXT
- **Custom Formatting** - Control fonts, spacing, margins, and styles
- **Metadata Management** - Add title, author, ISBN, and publication info
- **Table of Contents** - Automatic TOC generation for all formats

### 💾 Storage & Sync

- **Hybrid Storage** - IndexedDB for local data (50MB+), Supabase for cloud backup
- **Offline Mode** - Work anywhere without internet
- **Auto-Sync** - Background synchronization every 30 seconds
- **Conflict Resolution** - Automatic handling of sync conflicts
- **Data Migration** - Seamless upgrade from localStorage to IndexedDB
- **Backup System** - Automatic backups before critical operations

### 🎨 User Experience

- **Theme System** - Light and dark modes with system preference detection
- **Responsive Design** - Works on desktop, tablet, and mobile devices
- **Error Boundaries** - Graceful error handling with data recovery
- **Toast Notifications** - User-friendly feedback for all actions
- **Keyboard Shortcuts** - Efficient navigation and editing
- **Settings Hub** - Comprehensive 6-tab settings interface

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ (recommended: 20+)
- **npm** or **yarn** package manager
- **Modern browser** (Chrome, Firefox, Safari, Edge)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Kajdep/bookcraft-ai-claudecode.git
   cd bookcraft-ai-claudecode
   ```

2. **Install dependencies:**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Set up environment variables (optional):**
   ```bash
   cp .env.example .env.local
   ```
   
   Edit `.env.local` and add optional configuration:
   ```env
   # Optional - Cloud sync (Supabase)
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   
   # Optional - Configuration
   VITE_ENABLE_DEBUG_LOGGING=false
   VITE_VALIDATE_API_KEYS=true
   ```

4. **Start development server:**
   ```bash
   npm run dev
   ```

5. **Open in browser:**
   Navigate to [http://localhost:5173](http://localhost:5173)

### First-Time Setup

1. **Configure AI Keys** - Click the settings icon (⚙️) in the header
2. **Add API Keys:**
   - **OpenRouter API Key** - Get from [openrouter.ai/keys](https://openrouter.ai/keys)
   - **Gemini API Key** - Get from [makersuite.google.com/app/apikey](https://makersuite.google.com/app/apikey)
3. **Choose AI Model** - Select your preferred model (default: nvidia/nemotron-nano-9b-v2:free)
4. **Start Writing** - Create your first project from the dashboard!

---

## 🎯 Core Features

### Writing Studio

The heart of WrittenUpAI - a distraction-free writing environment with powerful tools:

- **Lexical Editor** - Rich text editing with formatting toolbar
- **Chapter Sidebar** - Quick navigation between chapters
- **AI Toolbox** - One-click access to AI tools
- **Research Sidebar** - Access research without leaving the editor
- **Status Indicators** - Real-time save and sync status
- **Word Count** - Live word count tracking

**Keyboard Shortcuts:**
- `Ctrl/Cmd + B` - Bold
- `Ctrl/Cmd + I` - Italic
- `Ctrl/Cmd + U` - Underline
- `Ctrl/Cmd + S` - Manual save
- `Ctrl/Cmd + Z` - Undo
- `Ctrl/Cmd + Shift + Z` - Redo

### Research Tab

Comprehensive research tools for fact-checking and content organization:

- **AI Research** - Generate research on any topic
- **Fact Checking** - Verify claims with confidence levels
- **Citation Manager** - APA, MLA, Chicago, Harvard styles
- **Folder Organization** - Chapter, Theme, Character, Location, etc.
- **Source Credibility** - Track source reliability
- **Web Scraping** - Extract content from URLs (optional API)

### Materials Tab

Centralized repository for all reference materials:

- **File Upload** - Support for images, documents, audio, video
- **Smart Storage** - Automatic routing (IndexedDB < 5MB, Supabase >= 5MB)
- **Thumbnails** - Auto-generated image previews
- **Metadata** - Extract file dimensions, duration, etc.
- **Organization** - Folders, tags, bookmarks, favorites
- **Chapter Links** - Associate materials with specific chapters

### Visuals Tab

Create visual content to enhance your manuscript:

- **AI Analysis** - Analyze text and recommend visual types
- **Diagram Generation** - Flowcharts, timelines, mind maps, comparison charts
- **Mermaid.js** - Professional diagram rendering
- **Image Generation** - Generate custom images via Gemini AI
- **Visual Library** - Organize and manage all visuals
- **Export** - Download visuals as PNG or SVG

### Analytics Tab

Track and optimize your writing productivity:

- **Writing Sessions** - Time tracking with active/idle detection
- **Goals System** - Set and track multiple goal types
- **Streak Calendar** - Visual representation of writing consistency
- **Productivity Metrics** - Daily, weekly, monthly statistics
- **Charts & Graphs** - Visualize progress over time
- **Export Reports** - Generate PDF reports

### Export Tab

Professional multi-format export capabilities:

- **DOCX Export** - Microsoft Word format with full formatting
- **PDF Export** - Print-ready PDFs with page numbers and TOC
- **EPUB Export** - E-reader compatible format
- **Markdown Export** - Plain text with Markdown formatting
- **Plain Text Export** - Simple TXT format
- **Chapter Selection** - Export full manuscript or selected chapters
- **Custom Metadata** - Add title, author, ISBN, etc.

### Cover Creator

Design professional book covers:

- **Templates** - Pre-designed cover layouts
- **Custom Elements** - Add text, images, shapes
- **Font Library** - Choose from multiple fonts
- **Color Picker** - Full color customization
- **Preview** - See cover in multiple sizes
- **Export** - Download as high-resolution image

### KDP Calculator

Amazon KDP pricing calculator:

- **All Marketplaces** - US, UK, EU, CA, AU, JP
- **Print Costs** - Black & white and color pricing
- **Royalty Options** - Compare 35% vs 70% royalties
- **Break-Even** - Calculate minimum profitable price
- **Recommendations** - Suggested pricing strategies
- **All Trim Sizes** - Support for all KDP trim sizes

---

## 🤖 AI Integration

### OpenRouter Integration

**Purpose:** Text generation and content creation  
**Default Model:** `nvidia/nemotron-nano-9b-v2:free`

**Capabilities:**
- Chapter content generation
- Plot point development
- Research and fact-checking
- Writing suggestions and improvements
- Grammar and style analysis
- Contradiction detection

**Configuration:**
- Set API key in Settings → API Keys
- Choose from 100+ models in Settings → AI Models
- Adjust temperature, max tokens, and other parameters

### Google Gemini Integration

**Purpose:** Image generation and multimodal tasks  
**Model:** `gemini-pro` and `gemini-pro-vision`

**Capabilities:**
- Image generation for covers and visuals
- Visual analysis and description
- Multimodal content understanding
- Image-to-text conversion

**Configuration:**
- Set API key in Settings → API Keys
- Configure image generation parameters

### Rate Limiting & Error Handling

- Automatic retry logic with exponential backoff
- Rate limiting to prevent API quota exhaustion
- Graceful degradation when APIs are unavailable
- User-friendly error messages and recovery options

---

## 🛠️ Technology Stack

### Frontend Framework
- **React 19** - Modern React with hooks and concurrent features
- **TypeScript 5.8** - Type-safe development
- **Vite 6.2** - Lightning-fast build tool and dev server

### State Management
- **Zustand 5.0** - Lightweight state management
- **Immer 10.1** - Immutable state updates
- **Persistence** - Custom storage adapter with IndexedDB/Supabase

### Rich Text Editor
- **Lexical 0.35** - Facebook's extensible text editor framework
- **Plugins:** History, Links, Lists, Rich Text, HTML serialization
- **Custom Plugins:** Research lookup, toolbar, custom formatting

### Storage & Database
- **Dexie 4.2** - IndexedDB wrapper with powerful queries
- **Supabase 2.58** - Cloud backend (optional)
- **Storage Adapter** - Unified API for both storage types

### AI Services
- **OpenRouter API** - Access to 100+ AI models
- **Google Gemini API** - Multimodal AI capabilities
- **Rate Limiting** - Prevent quota exhaustion

### Export Libraries
- **docx 9.5** - Microsoft Word document generation
- **jsPDF 3.0** - PDF creation and export
- **epub-gen-memory 1.1** - EPUB e-book generation
- **file-saver 2.0** - Client-side file downloads

### Visualization
- **Mermaid 11.11** - Diagram and flowchart rendering
- **html2canvas 1.4** - Screenshot and image generation
- **Lucide React 0.544** - Beautiful icon library

### Styling
- **Tailwind CSS 3.4** - Utility-first CSS framework
- **PostCSS 8.5** - CSS processing and optimization
- **Autoprefixer 10.4** - Browser compatibility

### Testing & Quality
- **Vitest 3.2** - Fast unit testing framework
- **Playwright 1.55** - End-to-end testing
- **Testing Library 16.3** - React component testing
- **TypeScript** - Static type checking

### Development Tools
- **ESLint** - Code linting and quality
- **Prettier** - Code formatting
- **Git** - Version control
- **npm/yarn** - Package management

---

## 📂 Project Structure

```
bookcraft-ai-claudecode/
├── components/                 # React components
│   ├── workspace/             # Main workspace components
│   │   ├── lexical/          # Lexical editor components
│   │   │   ├── LexicalEditor.tsx
│   │   │   ├── LexicalToolbar.tsx
│   │   │   └── plugins/      # Editor plugins
│   │   ├── AnalyticsTab.tsx  # Analytics and metrics
│   │   ├── ChapterEditorView.tsx
│   │   ├── CitationManager.tsx
│   │   ├── ContradictionDetectionPanel.tsx
│   │   ├── CoverCreator.tsx  # Book cover designer
│   │   ├── ExportTab.tsx     # Export functionality
│   │   ├── GrammarCheckerPanel.tsx
│   │   ├── KDPCalculator.tsx # Amazon KDP calculator
│   │   ├── MaterialTab.tsx   # Material management
│   │   ├── PlotTab.tsx       # Plot management
│   │   ├── ResearchTab.tsx   # Research tools
│   │   └── VisualsWorkspace.tsx
│   ├── auth/                 # Authentication components
│   ├── Dashboard.tsx         # Project dashboard
│   ├── ErrorBoundary.tsx     # Error handling
│   ├── Icons.tsx             # Custom icons
│   ├── MainLayout.tsx        # Main app layout
│   ├── SettingsModal.tsx     # Settings interface
│   ├── SyncStatusIndicator.tsx
│   ├── Toast.tsx             # Notifications
│   └── UI.tsx                # Reusable UI components
├── services/                  # Business logic layer
│   ├── storage/              # Storage system
│   │   ├── indexedDB.ts     # Dexie implementation
│   │   ├── supabase.ts      # Supabase client
│   │   ├── syncEngine.ts    # Sync logic
│   │   └── storageService.ts # Unified storage API
│   ├── ai.ts                 # AI service (OpenRouter)
│   ├── auth.ts               # Authentication
│   ├── autosave.ts           # Auto-save manager
│   ├── contradictionService.ts
│   ├── exportManager.ts      # Export functionality
│   ├── gemini.ts             # Gemini AI service
│   ├── grammarService.ts     # Grammar checking
│   ├── kdpCalculator.ts      # KDP calculations
│   ├── logger.ts             # Logging utility
│   ├── materialFileManager.ts
│   ├── themeManager.ts       # Theme management
│   └── toast.ts              # Toast notifications
├── store/                     # State management
│   ├── useStore.ts           # Main Zustand store
│   ├── storageAdapter.ts     # Storage persistence
│   └── supabaseSync.ts       # Supabase sync logic
├── docs/                      # Documentation
│   ├── IMPLEMENTATION_SUMMARY.md
│   ├── PROJECT_COMPLETION_SUMMARY.md
│   └── VERCEL_DEPLOYMENT.md
├── tests/                     # Test files
│   └── storage/              # Storage tests
├── App.tsx                    # Root component
├── index.tsx                  # Application entry point
├── types.ts                   # TypeScript types
├── index.css                  # Global styles
├── tailwind.config.js         # Tailwind configuration
├── vite.config.ts            # Vite configuration
├── tsconfig.json             # TypeScript configuration
├── package.json              # Dependencies
├── .env.example              # Environment template
└── README.md                 # This file
```

---

## ⚙️ Configuration

### Environment Variables

Create a `.env.local` file in the root directory:

```env
# === OPTIONAL - CLOUD SYNC ===
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here

# === APPLICATION SETTINGS ===
VITE_APP_NAME=WrittenUpAI
VITE_APP_VERSION=2.0.0

# === FEATURE FLAGS ===
VITE_ENABLE_DEBUG_LOGGING=false
VITE_VALIDATE_API_KEYS=true

# === API CONFIGURATION ===
VITE_API_RATE_LIMIT=100
VITE_API_RATE_WINDOW=3600000
```

### User Configuration

Users configure API keys in-app via Settings (⚙️):

**Required:**
- OpenRouter API Key (for text generation)
- Google Gemini API Key (for image generation)

**Optional:**
- LanguageTool API Key (for grammar checking)
- Grammarly API Key (for advanced grammar)
- Scraping API Key (for web research)
- Document Parser API Key (for file parsing)
- Fact Check API Key (for verification)

### AI Model Configuration

Configure AI behavior in Settings → AI Models:

- **Model Selection** - Choose from 100+ OpenRouter models
- **Temperature** - Control randomness (0.0 - 2.0)
- **Max Tokens** - Set response length (1 - 32000)
- **Top P** - Nucleus sampling parameter
- **Frequency Penalty** - Reduce repetition
- **Presence Penalty** - Encourage diversity

---

## 💻 Development

### Available Scripts

```bash
# Development
npm run dev          # Start dev server (port 5173)
npm run build        # Build for production
npm run preview      # Preview production build

# Testing
npm test             # Run unit tests
npm run test:watch   # Run tests in watch mode
npm run test:ui      # Run tests with UI
npm run test:coverage # Run tests with coverage

# Code Quality
npm run lint         # Run ESLint (if configured)
npm run format       # Format code with Prettier (if configured)
```

### Development Workflow

1. **Create a feature branch:**
   ```bash
   git checkout -b feature/my-feature
   ```

2. **Make changes following conventions:**
   - Use TypeScript for type safety
   - Follow existing code style
   - Use Zustand actions for state changes
   - Add proper error handling
   - Update types in `types.ts`

3. **Test your changes:**
   ```bash
   npm run dev
   # Test functionality in browser
   npm test
   # Run unit tests
   ```

4. **Commit and push:**
   ```bash
   git add .
   git commit -m "feat: add new feature"
   git push origin feature/my-feature
   ```

5. **Create Pull Request**

### Code Conventions

**State Management:**
- Use individual Zustand selectors (not object destructuring)
- All state mutations through Zustand actions
- Use Immer for nested state updates

**TypeScript:**
- Explicit typing for component props
- Use `React.FC<Props>` for components
- Define all types in `types.ts`

**Styling:**
- Tailwind CSS utility classes
- Follow existing color palette
- Responsive design (mobile-first)

**Error Handling:**
- Use error boundaries for component trees
- Toast notifications for user feedback
- Logging service for debugging

---

## 🚀 Deployment

### Vercel Deployment (Recommended)

1. **Push to GitHub:**
   ```bash
   git push origin main
   ```

2. **Import in Vercel:**
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository

3. **Configure Environment Variables:**
   Add optional variables in Vercel dashboard:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_ENABLE_DEBUG_LOGGING=false`

4. **Deploy:**
   - Click "Deploy"
   - Vercel will build and deploy automatically

5. **Custom Domain (Optional):**
   - Add custom domain in Vercel settings
   - Configure DNS records

### Manual Deployment

```bash
# Build for production
npm run build

# The 'dist' folder contains production-ready files
# Deploy to any static hosting service:
# - Netlify
# - GitHub Pages
# - AWS S3 + CloudFront
# - Cloudflare Pages
```

### Post-Deployment Checklist

- [ ] Verify all features work in production
- [ ] Test autosave and sync functionality
- [ ] Check theme toggle works correctly
- [ ] Test file uploads (small and large)
- [ ] Verify AI generation works
- [ ] Test export to all formats
- [ ] Check on multiple browsers
- [ ] Test on mobile devices

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed deployment guide.

---

## 📖 Documentation

### User Documentation
- **README.md** (this file) - Complete project overview
- **Quick Start** - Getting started guide above
- **Feature Guides** - In-app help and tooltips

### Developer Documentation
- **CLAUDE.md** - Development guidelines for AI assistants
- **IMPLEMENTATION_SUMMARY.md** - Technical implementation details
- **PROJECT_COMPLETION_SUMMARY.md** - Project milestone summary
- **DEPLOYMENT.md** - Deployment guide
- **types.ts** - TypeScript type definitions

### Additional Resources
- [React Documentation](https://react.dev)
- [Zustand Documentation](https://zustand-demo.pmnd.rs)
- [Lexical Documentation](https://lexical.dev)
- [Tailwind CSS Documentation](https://tailwindcss.com)
- [OpenRouter Documentation](https://openrouter.ai/docs)
- [Google Gemini Documentation](https://ai.google.dev)

---

## 🤝 Contributing

Contributions are welcome! Whether it's bug fixes, new features, or documentation improvements.

### How to Contribute

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/amazing-feature`)
3. **Make your changes**
4. **Test thoroughly**
5. **Commit your changes** (`git commit -m 'feat: add amazing feature'`)
6. **Push to your branch** (`git push origin feature/amazing-feature`)
7. **Open a Pull Request**

### Contribution Guidelines

- Write clean, readable code
- Follow existing code style and conventions
- Add tests for new features
- Update documentation as needed
- Use structured logging (logger service)
- Handle errors gracefully
- Use TypeScript for type safety

### Bug Reports

If you find a bug, please create an issue with:
- Clear description of the bug
- Steps to reproduce
- Expected vs actual behavior
- Browser and OS information
- Console errors (if any)
- Screenshots (if applicable)

### Feature Requests

Have an idea? Create an issue with:
- Clear description of the feature
- Use case and benefits
- Possible implementation approach
- Mockups or examples (if applicable)

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

### Technologies
- [React](https://react.dev) - UI framework
- [TypeScript](https://www.typescriptlang.org) - Type safety
- [Vite](https://vitejs.dev) - Build tool
- [Zustand](https://zustand-demo.pmnd.rs) - State management
- [Dexie.js](https://dexie.org) - IndexedDB wrapper
- [Supabase](https://supabase.com) - Cloud backend
- [Lexical](https://lexical.dev) - Rich text editor
- [Tailwind CSS](https://tailwindcss.com) - Styling
- [OpenRouter](https://openrouter.ai) - AI model routing
- [Google Gemini](https://ai.google.dev) - AI capabilities
- [Lucide React](https://lucide.dev) - Icon library
- [Mermaid](https://mermaid.js.org) - Diagrams
- [jsPDF](https://github.com/parallax/jsPDF) - PDF generation
- [docx](https://github.com/dolanmiu/docx) - Word document generation

### Inspiration
Built for authors who want:
- Professional writing tools
- AI that enhances (not replaces) creativity
- Reliable, secure data storage
- Offline-first functionality
- Modern, intuitive interface
- Complete control over their work

---

## 📞 Support & Contact

- **GitHub Repository:** [Kajdep/bookcraft-ai-claudecode](https://github.com/Kajdep/bookcraft-ai-claudecode)
- **Issues:** [GitHub Issues](https://github.com/Kajdep/bookcraft-ai-claudecode/issues)
- **Discussions:** [GitHub Discussions](https://github.com/Kajdep/bookcraft-ai-claudecode/discussions)

---

## ⭐ Show Your Support

If you find WrittenUpAI useful, please consider:
- ⭐ **Starring** this repository
- 🐛 **Reporting** bugs and issues
- 💡 **Suggesting** new features
- 📢 **Sharing** with other authors
- 🤝 **Contributing** to the project

---

<div align="center">

**Happy Writing!** ✍️

*WrittenUpAI - Where AI meets creativity*

---

**Version:** 2.0.0  
**Last Updated:** October 2025  
**Status:** Production Ready 🚀

</div>
