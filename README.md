<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# BookCraft AI

A powerful AI-assisted writing application for authors, featuring intelligent content generation, material management, and professional export capabilities.

## ✨ Features

- **AI-Powered Writing** - Generate chapters, plot points, and content with AI assistance
- **Smart Autosave** - Never lose your work with automatic saving every 2 seconds
- **Dark Mode** - Beautiful light and dark themes with system preference detection
- **Material Management** - Organize research, images, and references with smart file storage
- **KDP Calculator** - Calculate Amazon KDP printing costs and royalties
- **Professional Export** - Export to DOCX, PDF, and EPUB formats
- **Offline Support** - Works offline with IndexedDB, syncs when online
- **Visual Tools** - Generate diagrams and visuals for your manuscript

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone <your-repo-url>
   cd bookcraft-ai
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Copy environment variables (optional):
   ```bash
   cp .env.example .env.local
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:5173](http://localhost:5173) in your browser

### User Configuration

Users configure their own API keys in the app settings:
- **OpenRouter API Key** - For AI text generation ([Get key](https://openrouter.ai/keys))
- **Gemini API Key** - For image generation ([Get key](https://makersuite.google.com/app/apikey))

## 📦 Production Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Import project in [Vercel](https://vercel.com)
3. Configure environment variables (optional):
   - `VITE_SUPABASE_URL` - For cloud sync
   - `VITE_SUPABASE_ANON_KEY` - For cloud sync
   - See [SUPABASE_DATABASE_SETUP.md](SUPABASE_DATABASE_SETUP.md) for how to find these credentials
4. Deploy!

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed deployment instructions.

## 🛠️ Tech Stack

- **Frontend:** React 19 + TypeScript + Vite
- **State Management:** Zustand with Immer
- **Storage:** IndexedDB (Dexie) + Supabase (optional)
- **Editor:** Lexical
- **Styling:** Tailwind CSS
- **Export:** docx.js, jsPDF, epub-gen-memory
- **Deployment:** Vercel Edge Network

## 📖 Documentation

- [Deployment Guide](DEPLOYMENT.md) - Complete deployment instructions
- [Supabase Database Setup](SUPABASE_DATABASE_SETUP.md) - How to configure Supabase and find database credentials
- [Implementation Summary](IMPLEMENTATION_SUMMARY.md) - Technical details and features

## 🎯 Key Features

### Autosave System
- Automatic saving every 2 seconds
- Visual save status indicator
- Offline support with IndexedDB
- Retry on failure

### Theme System
- Light and dark modes
- System preference detection
- Persistent across sessions
- WCAG AA compliant contrast

### Material Management
- Upload files (images, documents, audio, video)
- Smart storage routing (IndexedDB < 5MB, Supabase >= 5MB)
- Organize with folders and tags
- Link to chapters

### KDP Calculator
- Accurate Amazon KDP pricing
- All marketplaces supported
- 35% and 70% royalty calculations
- Break-even and recommended pricing

### Export Functionality
- Export to DOCX, PDF, EPUB
- Chapter selection
- Metadata and table of contents
- Custom formatting options

## 🔒 Security

- API keys stored securely in browser localStorage
- Security headers configured
- No API keys in codebase
- User data stays in browser (IndexedDB)
- Optional cloud sync with user consent

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

[Your License Here]

## 🙏 Acknowledgments

- Built with React, TypeScript, and Vite
- AI powered by OpenRouter and Google Gemini
- Icons by Lucide React
- Deployed on Vercel

---

**Version:** 1.0.0  
**Status:** Production Ready ✅
