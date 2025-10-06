# Design Document

## Overview

This design document outlines the technical approach for implementing critical fixes to the BookCraft AI application before production launch on Vercel. The design focuses on client-side solutions that work seamlessly with Vercel's static site deployment model, using IndexedDB for local storage and Supabase for cloud persistence.

### Architecture Principles

1. **Client-First**: All processing happens in the browser to avoid serverless function limitations
2. **Offline-Capable**: Core features work without internet connection using IndexedDB
3. **Progressive Enhancement**: Cloud sync enhances the experience but isn't required
4. **Performance-Focused**: Optimized for fast load times on Vercel's edge network
5. **Production-Ready**: Robust error handling, logging, and user feedback

## Architecture

### System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Vercel Edge Network                      │
│                    (Static Site Hosting)                     │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                   React Application                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Zustand    │  │   Lexical    │  │  Export Libs │     │
│  │    Store     │  │   Editor     │  │  (docx/pdf)  │     │
│  └──────┬───────┘  └──────────────┘  └──────────────┘     │
│         │                                                    │
│         ▼                                                    │
│  ┌──────────────────────────────────────────────┐          │
│  │         Storage Adapter Layer                │          │
│  │  (Manages IndexedDB + Supabase Sync)        │          │
│  └──────┬───────────────────────────┬───────────┘          │
└─────────┼───────────────────────────┼──────────────────────┘
          │                           │
          ▼                           ▼
┌──────────────────┐        ┌──────────────────┐
│   IndexedDB      │        │    Supabase      │
│  (Local First)   │◄──────►│  (Cloud Sync)    │
│  - Projects      │        │  - Projects      │
│  - Chapters      │        │  - Chapters      │
│  - Materials     │        │  - Storage       │
│  - Files < 5MB   │        │  - Files > 5MB   │
└──────────────────┘        └──────────────────┘
```

### Data Flow

1. **Write Path**: User edits → Zustand Store → Debounced Autosave → IndexedDB → Background Sync to Supabase
2. **Read Path**: App Load → IndexedDB (instant) → Background Sync from Supabase (if online)
3. **Export Path**: User triggers export → Gather data from store → Client-side library processing → Download file

## Components and Interfaces

### 1. Autosave System

#### AutosaveManager Component

```typescript
interface AutosaveConfig {
  debounceMs: number;        // Default: 2000ms
  retryAttempts: number;     // Default: 3
  retryDelayMs: number;      // Default: 5000ms
  syncToCloud: boolean;      // Default: true
}

interface AutosaveState {
  status: 'idle' | 'saving' | 'saved' | 'error';
  lastSaved: Date | null;
  pendingChanges: boolean;
  error: string | null;
}

class AutosaveManager {
  private config: AutosaveConfig;
  private debounceTimer: NodeJS.Timeout | null;
  private state: AutosaveState;
  
  // Trigger autosave with debouncing
  triggerSave(projectId: string, data: Partial<Project>): void;
  
  // Force immediate save (for manual save button)
  forceSave(projectId: string): Promise<void>;
  
  // Handle beforeunload to save pending changes
  handleBeforeUnload(): void;
  
  // Retry failed saves
  private retrySave(projectId: string, attempt: number): Promise<void>;
}
```

#### SaveStatusIndicator Component

```typescript
interface SaveStatusIndicatorProps {
  status: AutosaveState['status'];
  lastSaved: Date | null;
  error: string | null;
}

// Visual states:
// - Idle: No indicator
// - Saving: Spinner + "Saving..."
// - Saved: Checkmark + "Saved at HH:MM"
// - Error: Warning icon + "Save failed" + Retry button
```

#### Integration Points

- Hook into Zustand store's `updateChapter` action
- Listen to Lexical editor's onChange event
- Integrate with existing `storageAdapter.ts`
- Add save status to `SaveStatusIndicator.tsx` component

### 2. Dark Mode Color System

#### Theme Configuration

```typescript
// tailwind.config.js extensions
const darkModeColors = {
  // Backgrounds
  'dark-bg-primary': '#111827',    // Main background
  'dark-bg-secondary': '#1f2937',  // Cards, modals
  'dark-bg-tertiary': '#374151',   // Input fields, hover states
  
  // Text
  'dark-text-primary': '#f9fafb',   // Main text
  'dark-text-secondary': '#d1d5db', // Secondary text
  'dark-text-tertiary': '#9ca3af',  // Muted text
  
  // Borders
  'dark-border-primary': '#374151',
  'dark-border-secondary': '#4b5563',
  
  // Interactive
  'dark-hover': '#4b5563',
  'dark-active': '#6b7280',
};
```

#### Component Updates Required

1. **Modal.tsx**: Update background and border colors
2. **Input.tsx**: Update input field backgrounds and text colors
3. **Button.tsx**: Update hover and active states
4. **Card components**: Update backgrounds and borders
5. **Dashboard.tsx**: Update project card backgrounds
6. **SettingsModal.tsx**: Update all form elements

#### CSS Strategy

```css
/* Use Tailwind's dark: variant consistently */
.card {
  @apply bg-white dark:bg-dark-bg-secondary;
  @apply border-gray-200 dark:border-dark-border-primary;
  @apply text-gray-900 dark:text-dark-text-primary;
}

.input {
  @apply bg-gray-50 dark:bg-dark-bg-tertiary;
  @apply text-gray-900 dark:text-dark-text-primary;
  @apply border-gray-300 dark:border-dark-border-primary;
}
```

### 3. Theme Toggle System

#### ThemeManager Service

```typescript
class ThemeManager {
  private currentTheme: 'light' | 'dark';
  
  // Initialize theme from localStorage or system preference
  initialize(): void {
    const saved = localStorage.getItem('bookcraft-theme');
    const systemPreference = window.matchMedia('(prefers-color-scheme: dark)').matches;
    this.currentTheme = saved as 'light' | 'dark' || (systemPreference ? 'dark' : 'light');
    this.applyTheme(this.currentTheme);
  }
  
  // Toggle between themes
  toggle(): void {
    this.currentTheme = this.currentTheme === 'light' ? 'dark' : 'light';
    this.applyTheme(this.currentTheme);
    this.persist();
  }
  
  // Apply theme to DOM
  private applyTheme(theme: 'light' | 'dark'): void {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }
  
  // Persist to localStorage
  private persist(): void {
    localStorage.setItem('bookcraft-theme', this.currentTheme);
  }
}
```

#### Integration with Zustand Store

```typescript
// Update useStore.ts
setTheme: (theme: 'light' | 'dark') => {
  set((state) => {
    if (!state.settings) {
      state.settings = {};
    }
    state.settings.theme = theme;
  });
  
  // Apply to DOM immediately
  if (theme === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
  
  // Persist to localStorage
  localStorage.setItem('bookcraft-theme', theme);
}
```

### 4. Material Management System

#### Data Models

```typescript
interface MaterialItem {
  id: string;
  projectId: string;
  title: string;
  type: MaterialType;
  category: MaterialCategory;
  content?: string;           // For notes
  url?: string;               // For links
  fileId?: string;            // Reference to file in storage
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
  thumbnail?: string;         // Base64 or URL
  tags: string[];
  linkedChapterIds: string[];
  folderId?: string;
  isBookmarked: boolean;
  createdAt: Date;
  lastModified: Date;
}

interface MaterialFolder {
  id: string;
  projectId: string;
  name: string;
  parentFolderId?: string;
  color: string;
  icon?: string;
  createdAt: Date;
}
```

#### MaterialsTab Component Structure

```
MaterialsTab
├── MaterialsToolbar
│   ├── AddMaterialButton (dropdown menu)
│   ├── SearchBar
│   └── ViewToggle (grid/list)
├── MaterialsSidebar
│   ├── FolderTree
│   ├── TagFilter
│   └── BookmarksSection
└── MaterialsGrid/List
    └── MaterialCard
        ├── Thumbnail
        ├── Title & Metadata
        ├── Tags
        └── Actions (edit, delete, link)
```

#### File Storage Strategy

```typescript
class MaterialFileManager {
  private readonly SMALL_FILE_THRESHOLD = 5 * 1024 * 1024; // 5MB
  
  async storeFile(file: File, projectId: string): Promise<string> {
    const fileId = `file_${Date.now()}_${Math.random()}`;
    
    if (file.size < this.SMALL_FILE_THRESHOLD) {
      // Store in IndexedDB
      await db.fileBlobs.put({
        id: fileId,
        blob: file,
        mimeType: file.type,
        size: file.size,
        createdAt: new Date()
      });
    } else {
      // Store in Supabase Storage
      const supabase = getSupabaseClient();
      const { data, error } = await supabase.storage
        .from('materials')
        .upload(`${projectId}/${fileId}`, file);
      
      if (error) throw error;
    }
    
    return fileId;
  }
  
  async retrieveFile(fileId: string, projectId: string): Promise<Blob> {
    // Try IndexedDB first
    const localFile = await db.fileBlobs.get(fileId);
    if (localFile) return localFile.blob;
    
    // Fallback to Supabase
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.storage
      .from('materials')
      .download(`${projectId}/${fileId}`);
    
    if (error) throw error;
    return data;
  }
}
```

### 5. KDP Calculator

#### Calculator Component Structure

```typescript
interface KDPCalculation {
  // Inputs
  pageCount: number;
  listPrice: number;
  marketplace: 'US' | 'UK' | 'EU' | 'CA' | 'AU' | 'JP';
  bookType: 'paperback' | 'hardcover';
  interior: 'black-white' | 'color';
  trim: '5x8' | '6x9' | '8.5x11' | 'other';
  
  // Calculated outputs
  printingCost: number;
  royalty35: number;
  royalty70: number;
  breakEvenPrice: number;
  recommendedPrice: number;
}

class KDPCalculator {
  // KDP pricing formulas by marketplace
  private readonly PRINTING_COSTS = {
    'US': {
      'black-white': { fixed: 0.85, perPage: 0.012 },
      'color': { fixed: 0.85, perPage: 0.06 }
    },
    // ... other marketplaces
  };
  
  calculate(input: Partial<KDPCalculation>): KDPCalculation {
    const printingCost = this.calculatePrintingCost(input);
    const royalty35 = this.calculateRoyalty(input.listPrice, printingCost, 0.35);
    const royalty70 = this.calculateRoyalty(input.listPrice, printingCost, 0.70);
    const breakEvenPrice = this.calculateBreakEven(printingCost);
    
    return {
      ...input as KDPCalculation,
      printingCost,
      royalty35,
      royalty70,
      breakEvenPrice,
      recommendedPrice: breakEvenPrice * 1.5 // 50% markup
    };
  }
  
  private calculatePrintingCost(input: Partial<KDPCalculation>): number {
    const costs = this.PRINTING_COSTS[input.marketplace][input.interior];
    return costs.fixed + (costs.perPage * input.pageCount);
  }
  
  private calculateRoyalty(listPrice: number, printingCost: number, rate: number): number {
    return (listPrice * rate) - printingCost;
  }
}
```

#### KDPCalculatorTab Component

```
KDPCalculatorTab
├── InputSection
│   ├── PageCountInput
│   ├── ListPriceInput
│   ├── MarketplaceSelect
│   ├── BookTypeSelect
│   ├── InteriorSelect
│   └── TrimSizeSelect
├── ResultsSection
│   ├── PrintingCostDisplay
│   ├── RoyaltyComparison (35% vs 70%)
│   ├── BreakEvenPriceDisplay
│   └── RecommendedPriceDisplay
└── ActionsSection
    ├── SaveCalculationButton
    └── CalculationHistoryButton
```

### 6. Export System

#### Export Manager

```typescript
interface ExportOptions {
  format: 'docx' | 'pdf' | 'epub';
  includeChapters: string[];  // Chapter IDs
  includeMetadata: boolean;
  includeTOC: boolean;
  includeImages: boolean;
  includeVisuals: boolean;
  
  // Format-specific options
  docx?: {
    pageSize: 'A4' | 'Letter';
    margins: { top: number; bottom: number; left: number; right: number };
    fontSize: number;
    fontFamily: string;
  };
  
  pdf?: {
    pageSize: 'A4' | 'Letter';
    margins: { top: number; bottom: number; left: number; right: number };
    includePageNumbers: boolean;
    headerText?: string;
    footerText?: string;
  };
  
  epub?: {
    author: string;
    publisher?: string;
    isbn?: string;
    language: string;
    coverImage?: string;
  };
}

class ExportManager {
  async exportToDOCX(project: Project, options: ExportOptions): Promise<Blob> {
    const { Document, Packer, Paragraph, TextRun, HeadingLevel } = await import('docx');
    
    const doc = new Document({
      sections: [{
        properties: {},
        children: this.buildDOCXContent(project, options)
      }]
    });
    
    return await Packer.toBlob(doc);
  }
  
  async exportToPDF(project: Project, options: ExportOptions): Promise<Blob> {
    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF(options.pdf);
    
    this.buildPDFContent(doc, project, options);
    
    return doc.output('blob');
  }
  
  async exportToEPUB(project: Project, options: ExportOptions): Promise<Blob> {
    const EPub = await import('epub-gen-memory');
    
    const epub = new EPub({
      title: project.title,
      author: options.epub.author,
      publisher: options.epub.publisher,
      content: this.buildEPUBContent(project, options)
    });
    
    return await epub.genEpub();
  }
  
  private buildDOCXContent(project: Project, options: ExportOptions): Paragraph[] {
    const content: Paragraph[] = [];
    
    // Title page
    if (options.includeMetadata) {
      content.push(
        new Paragraph({
          text: project.title,
          heading: HeadingLevel.TITLE,
          alignment: 'center'
        })
      );
    }
    
    // Table of contents
    if (options.includeTOC) {
      // Generate TOC
    }
    
    // Chapters
    const chapters = project.chapters
      .filter(ch => options.includeChapters.includes(ch.id))
      .sort((a, b) => a.order - b.order);
    
    for (const chapter of chapters) {
      content.push(
        new Paragraph({
          text: chapter.title,
          heading: HeadingLevel.HEADING_1
        })
      );
      
      // Parse HTML content and convert to DOCX paragraphs
      const paragraphs = this.parseHTMLToDOCX(chapter.content);
      content.push(...paragraphs);
    }
    
    return content;
  }
  
  private parseHTMLToDOCX(html: string): Paragraph[] {
    // Parse HTML and convert to DOCX format
    // Handle: <p>, <h1-h6>, <strong>, <em>, <ul>, <ol>, <li>
    // This is a simplified version - full implementation would use DOMParser
    const paragraphs: Paragraph[] = [];
    
    // Implementation details...
    
    return paragraphs;
  }
}
```

#### ExportTab Component

```
ExportTab
├── FormatSelector
│   └── RadioGroup (DOCX, PDF, EPUB)
├── ChapterSelector
│   └── CheckboxList (all chapters)
├── OptionsPanel
│   ├── MetadataToggle
│   ├── TOCToggle
│   ├── ImagesToggle
│   └── FormatSpecificOptions
├── PreviewSection (optional)
│   └── PreviewPane
└── ExportButton
    └── ProgressIndicator
```

## Data Models

### Enhanced Project Model

```typescript
interface Project {
  // ... existing fields
  
  // New fields for materials
  materials: MaterialItem[];
  materialFolders: MaterialFolder[];
  
  // New fields for KDP calculations
  kdpCalculations: KDPCalculation[];
  
  // Export history
  exportHistory: ExportRecord[];
}

interface ExportRecord {
  id: string;
  format: 'docx' | 'pdf' | 'epub';
  exportedAt: Date;
  fileSize: number;
  options: ExportOptions;
}
```

### Storage Schema Updates

```typescript
// IndexedDB schema additions
db.version(2).stores({
  // ... existing tables
  materials: 'id, projectId, type, category, folderId, createdAt',
  materialFolders: 'id, projectId, parentFolderId',
  kdpCalculations: 'id, projectId, createdAt',
  exportHistory: 'id, projectId, exportedAt'
});
```

## Error Handling

### Autosave Error Handling

```typescript
class AutosaveErrorHandler {
  handleError(error: Error, context: { projectId: string; attempt: number }): void {
    // Log error
    logger.error('Autosave failed', error, context);
    
    // Categorize error
    if (error.message.includes('quota')) {
      // Storage quota exceeded
      toast.error('Storage Full', 'Please free up space or upgrade your plan');
      this.suggestCleanup();
    } else if (error.message.includes('network')) {
      // Network error - will retry
      toast.warning('Offline', 'Changes saved locally, will sync when online');
    } else {
      // Unknown error
      toast.error('Save Failed', 'Please try saving manually');
    }
    
    // Update UI state
    useBookCraftStore.getState().setAutoSaveStatus('error');
  }
  
  private suggestCleanup(): void {
    // Show modal suggesting:
    // - Delete old projects
    // - Clear export history
    // - Remove unused materials
  }
}
```

### Export Error Handling

```typescript
class ExportErrorHandler {
  handleError(error: Error, format: string): void {
    logger.error('Export failed', error, { format });
    
    if (error.message.includes('memory')) {
      toast.error('Export Too Large', 'Try exporting fewer chapters or reducing image quality');
    } else if (error.message.includes('format')) {
      toast.error('Format Error', 'There was an issue formatting your document. Please try again.');
    } else {
      toast.error('Export Failed', 'An unexpected error occurred. Please try again.');
    }
  }
}
```

## Testing Strategy

### Unit Tests

1. **AutosaveManager**: Test debouncing, retry logic, error handling
2. **ThemeManager**: Test theme switching, persistence, system preference detection
3. **KDPCalculator**: Test calculation accuracy for all marketplaces
4. **ExportManager**: Test each export format with sample data
5. **MaterialFileManager**: Test file storage routing (IndexedDB vs Supabase)

### Integration Tests

1. **Autosave Flow**: User types → debounce → save to IndexedDB → sync to Supabase
2. **Theme Toggle**: Click button → DOM updates → localStorage persists → reload restores
3. **Material Upload**: Select file → store → display thumbnail → link to chapter
4. **Export Flow**: Select options → generate file → download → verify format

### E2E Tests (Playwright)

1. **Autosave**: Type in editor, wait 2s, verify "Saved" indicator, refresh page, verify content persists
2. **Theme**: Toggle theme, verify all components update, refresh, verify theme persists
3. **Materials**: Upload file, create folder, organize materials, link to chapter
4. **KDP Calculator**: Enter values, verify calculations, save calculation
5. **Export**: Export to each format, verify file downloads, verify content

### Performance Tests

1. **Autosave**: Measure debounce timing, save duration
2. **Export**: Measure export time for various manuscript sizes
3. **Material Upload**: Measure upload time for various file sizes
4. **Theme Toggle**: Measure DOM update time

## Deployment Considerations

### Environment Variables (Vercel)

```bash
# .env.production
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_APP_VERSION=1.0.0
VITE_ENABLE_DEBUG_LOGGING=false
```

### Build Configuration

```json
// vercel.json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        }
      ]
    }
  ]
}
```

### Performance Optimizations

1. **Code Splitting**: Lazy load export libraries
2. **Asset Optimization**: Compress images, use WebP format
3. **Caching**: Configure Vercel edge caching for static assets
4. **Bundle Size**: Monitor and optimize bundle size (target < 500KB initial)

### Monitoring

1. **Error Tracking**: Integrate Sentry or similar for production error tracking
2. **Analytics**: Track feature usage, export formats, autosave success rate
3. **Performance**: Monitor Core Web Vitals (LCP, FID, CLS)

## Migration Plan

### Phase 1: Autosave & Theme (Week 1)
- Implement AutosaveManager
- Fix dark mode colors
- Fix theme toggle
- Add SaveStatusIndicator
- Test and deploy

### Phase 2: Materials (Week 2)
- Implement MaterialFileManager
- Build MaterialsTab UI
- Add folder management
- Test file upload/download
- Deploy

### Phase 3: KDP Calculator (Week 3)
- Implement KDPCalculator
- Build KDPCalculatorTab UI
- Add calculation history
- Test calculations
- Deploy

### Phase 4: Export (Week 4)
- Implement ExportManager
- Build ExportTab UI
- Test all export formats
- Optimize performance
- Deploy

### Phase 5: Polish & Launch (Week 5)
- Fix any remaining bugs
- Performance optimization
- Documentation
- Production deployment
- Launch! 🚀
