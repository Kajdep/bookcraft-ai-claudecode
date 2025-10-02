# 📚 BookCraft AI v2.0

**An AI-powered writing assistant for authors, with offline-first storage, cloud sync, and intelligent research tools.**

[![Version](https://img.shields.io/badge/version-2.0.0-blue.svg)](https://github.com/yourusername/bookcraft-ai)
[![Status](https://img.shields.io/badge/status-production--ready-green.svg)](https://github.com/yourusername/bookcraft-ai)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

---

## 🎉 What's New in v2.0

### Major Features
- ✨ **Hybrid Storage System** - IndexedDB + Supabase cloud sync
- 🔄 **Auto-Sync** - Background synchronization every 30 seconds
- 📴 **Offline-First** - Full functionality without internet
- 🛡️ **Multi-Level Error Boundaries** - Graceful error handling
- ⚙️ **Comprehensive Settings** - 6-tab configuration interface
- 📊 **Storage Visualization** - Real-time usage tracking
- 🔐 **Automatic Backups** - Data safety built-in

### Performance Improvements
- 🚀 **10x Storage Capacity** - 50MB+ (vs 5MB localStorage)
- ⚡ **Faster Saves** - IndexedDB optimizations
- 📱 **Better Mobile Support** - Responsive design
- 🔥 **Reduced Bundle Size** - Code splitting

---

## 🚀 Quick Start

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/bookcraft-ai.git

# Navigate to project directory
cd bookcraft-ai

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env and add your API keys

# Start development server
npm run dev
```

### Required API Keys

BookCraft AI requires two API keys to function:

1. **OpenRouter API Key** - For AI text generation
   - Get it from: https://openrouter.ai/keys
   - Add to `.env`: `OPENROUTER_API_KEY=sk-or-v1-...`

2. **Google Gemini API Key** - For image generation
   - Get it from: https://makersuite.google.com/app/apikey
   - Add to `.env`: `GEMINI_API_KEY=AIza...`

3. **Supabase Credentials** (Optional, for cloud sync)
   - Create project at: https://supabase.com
   - Add to `.env`:
     ```
     VITE_SUPABASE_URL=https://your-project.supabase.co
     VITE_SUPABASE_ANON_KEY=your-anon-key
     ```

### First Run

```bash
# Run the development server
npm run dev

# Open http://localhost:5173 in your browser

# Add your API keys in Settings (gear icon)

# Start creating!
```

---

## 📖 Features

### Writing & Editing
- 📝 **Rich Text Editor** - Distraction-free writing
- 📑 **Chapter Management** - Organize your manuscript
- 🎨 **Visual Style Selection** - Genre-appropriate aesthetics
- 📊 **Structure Generation** - AI-powered outlines
- ✍️ **Multiple Genres** - Fiction, Non-fiction, Technical, etc.

### AI Assistance
- 🤖 **Content Generation** - AI-powered chapter writing
- 💡 **Writing Suggestions** - Context-aware help
- 🎯 **Plot Development** - Story arc planning
- 🔍 **Research Assistant** - Integrated fact-checking
- 📚 **Citation Management** - Multiple citation styles

### Organization
- 📁 **Project Management** - Multiple books/projects
- 🔖 **Materials Library** - Reference documents
- 🎓 **Research Tools** - Web scraping & analysis
- 📝 **Notes & Annotations** - Chapter-specific notes
- 🏷️ **Tags & Folders** - Flexible organization

### Analytics
- 📈 **Writing Statistics** - Words, sessions, streaks
- ⏱️ **Time Tracking** - Active vs idle time
- 🎯 **Goal Setting** - Word count, chapter, time goals
- 📊 **Productivity Insights** - Best writing times
- 🔥 **Writing Streaks** - Maintain momentum

### Storage & Sync
- 💾 **Local Storage** - 50MB+ with IndexedDB
- ☁️ **Cloud Backup** - Automatic Supabase sync
- 📴 **Offline Mode** - Work anywhere, anytime
- 🔄 **Auto-Sync** - Background synchronization
- 🔐 **Data Safety** - Automatic backups

---

## 🎯 Usage Guide

### Creating Your First Project

1. **Click "New Project"** in the dashboard
2. **Fill in details**:
   - Title
   - Genre (Fiction, Non-fiction, etc.)
   - Visual Style
   - Description (optional)
3. **Click "Create"** - A default chapter is created automatically

### Writing with AI

1. **Select a chapter** from the sidebar
2. **Use AI tools**:
   - **Generate Content**: Full chapter generation
   - **AI Assistant**: Context-aware suggestions
   - **Writer's Block**: Overcome creative blocks
   - **Refine Text**: Improve existing content

### Research & Materials

1. **Open Research tab** in sidebar
2. **Add research**:
   - Web URLs (auto-summarized)
   - Documents (PDF, DOCX)
   - Manual entries
3. **Organize** with folders and tags
4. **Link to chapters** for easy reference

### Settings & Sync

1. **Click Settings** (gear icon)
2. **Configure**:
   - **API Keys**: Add your credentials
   - **AI Models**: Choose preferred model
   - **Storage**: View usage, sync manually
   - **Editor**: Font, autosave, spell check
   - **Export**: Default format, options
   - **Advanced**: Debug mode, telemetry

---

## 🛠️ Development

### Technology Stack

**Frontend**:
- React 18 + TypeScript
- Zustand (State Management)
- TailwindCSS (Styling)
- Vite (Build Tool)

**Storage**:
- Dexie.js (IndexedDB wrapper)
- Supabase (Cloud backend)

**AI Services**:
- OpenRouter (Text generation)
- Google Gemini (Image generation)

### Project Structure

```
bookcraft-ai/
├── components/          # React components
│   ├── workspace/      # Main workspace UI
│   ├── research/       # Research tools
│   ├── ErrorBoundary.tsx
│   └── SettingsModal.tsx
├── services/           # Business logic
│   ├── storage/       # Storage system
│   │   ├── indexedDB.ts
│   │   ├── supabase.ts
│   │   ├── syncEngine.ts
│   │   └── storageService.ts
│   ├── ai/            # AI integrations
│   └── logger.ts      # Logging service
├── store/             # State management
│   ├── useStore.ts
│   └── storageAdapter.ts
├── types/             # TypeScript definitions
├── docs/              # Documentation
│   ├── FEATURE_AUDIT.md
│   ├── TESTING_GUIDE.md
│   ├── QUICK_TEST.md
│   └── IMPLEMENTATION_SUMMARY.md
└── tests/             # Test suites
    └── storage/
```

### Building for Production

```bash
# Build optimized production bundle
npm run build

# Preview production build
npm run preview

# Deploy (example with Vercel)
vercel deploy
```

### Environment Variables

Create a `.env` file with:

```env
# Required - OpenRouter
OPENROUTER_API_KEY=sk-or-v1-...
OPENROUTER_ENDPOINT=https://openrouter.ai/api/v1

# Required - Google Gemini
GEMINI_API_KEY=AIza...
GEMINI_ENDPOINT=https://generativelanguage.googleapis.com

# Optional - Supabase (for cloud sync)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Optional - AI Configuration
DEFAULT_AI_MODEL=nvidia/nemotron-nano-9b-v2:free
DEFAULT_TEMPERATURE=0.7
DEFAULT_MAX_TOKENS=4000

# Optional - Debug
ENABLE_DEBUG_LOGGING=false
```

---

## 🧪 Testing

### Quick Test (5 minutes)

Follow the guide in `docs/QUICK_TEST.md`:

```bash
# Open in browser
npm run dev

# Open DevTools Console (F12)
# Run the test script from QUICK_TEST.md
# Verify all features work
```

### Comprehensive Testing

Follow `docs/TESTING_GUIDE.md` for:
- Storage migration tests
- Sync engine verification
- Settings UI validation
- Error boundary testing
- Performance benchmarks

### Running Unit Tests

```bash
# Install test dependencies (if not already installed)
npm install -D vitest @vitest/ui

# Run tests
npm test

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage
```

---

## 📚 Documentation

### For Users
- **Getting Started**: This README
- **Settings Guide**: `docs/SETTINGS_GUIDE.md` (to be created)
- **Troubleshooting**: `docs/TESTING_GUIDE.md` (Common Issues section)

### For Developers
- **Feature Audit**: `docs/FEATURE_AUDIT.md` - Complete feature inventory
- **Implementation**: `docs/IMPLEMENTATION_SUMMARY.md` - Technical details
- **Database Schema**: `docs/SUPABASE_SCHEMA.sql` - Supabase structure
- **Testing**: `docs/TESTING_GUIDE.md` - Comprehensive test procedures
- **Completion Summary**: `docs/PROJECT_COMPLETION_SUMMARY.md` - Project overview

---

## 🐛 Troubleshooting

### Common Issues

**Problem**: Migration not running
```javascript
// Clear migration flag and reload
localStorage.removeItem('bookcraft-migration-complete');
location.reload();
```

**Problem**: Sync fails with 401 error
- Check Supabase credentials in `.env`
- Verify credentials are exposed in `vite.config.ts`
- Check browser console for specific error

**Problem**: App won't load
- Check browser console for errors
- Verify all API keys are set
- Try clearing browser cache
- Check network tab for failed requests

**Problem**: Data not saving
- Check IndexedDB in DevTools
- Verify storage quota not exceeded
- Check console for error messages
- Try manual sync in Settings

### Getting Help

1. **Check Documentation**: See `docs/` folder
2. **Console Logs**: Open DevTools (F12) and check console
3. **Health Check**: Run the health check script from `QUICK_TEST.md`
4. **Report Issues**: Include browser, steps to reproduce, console errors

---

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Use TypeScript for type safety
- Follow existing code style
- Add tests for new features
- Update documentation
- Use structured logging (logger service)
- Handle errors gracefully

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

### Technologies
- [React](https://react.dev) - UI framework
- [Dexie.js](https://dexie.org) - IndexedDB wrapper
- [Supabase](https://supabase.com) - Backend as a Service
- [OpenRouter](https://openrouter.ai) - AI model routing
- [Google Gemini](https://ai.google.dev) - AI capabilities
- [Zustand](https://zustand-demo.pmnd.rs) - State management
- [TailwindCSS](https://tailwindcss.com) - Styling
- [Vite](https://vitejs.dev) - Build tool

### Inspiration
Built for authors who want:
- Professional writing tools
- AI assistance that enhances creativity
- Reliable data storage
- Offline-first functionality
- Modern, intuitive UI

---

## 🗺️ Roadmap

### v2.1 (Next Release)
- [ ] User authentication (Supabase Auth)
- [ ] Cross-device sync
- [ ] Conflict resolution UI
- [ ] Real-time collaboration (beta)

### v2.2 (Future)
- [ ] Mobile apps (iOS/Android)
- [ ] Browser extensions
- [ ] Advanced analytics
- [ ] Team workspaces
- [ ] Version history

### v3.0 (Long-term)
- [ ] Marketplace for templates
- [ ] Plugin system
- [ ] Custom AI model training
- [ ] Publishing integrations

---

## 📞 Contact

- **GitHub**: [yourusername/bookcraft-ai](https://github.com/yourusername/bookcraft-ai)
- **Issues**: [GitHub Issues](https://github.com/yourusername/bookcraft-ai/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/bookcraft-ai/discussions)

---

## ⭐ Show Your Support

If you find BookCraft AI useful, please:
- ⭐ Star this repository
- 🐛 Report bugs
- 💡 Suggest features
- 📢 Share with other authors

---

**Happy Writing!** ✍️

---

**Version**: 2.0.0  
**Last Updated**: January 2, 2025  
**Status**: Production Ready 🚀
