# Implementation Plan

- [x] 1. Set up autosave infrastructure


  - Create AutosaveManager class in `services/autosave.ts`
  - Implement debouncing logic with configurable delay (default 2000ms)
  - Add retry mechanism with exponential backoff
  - Integrate with existing storageAdapter for IndexedDB + Supabase sync
  - Add beforeunload event handler to save pending changes
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9, 1.10_



- [ ] 2. Implement autosave UI components
  - Update SaveStatusIndicator component with all states (idle, saving, saved, error)
  - Add visual feedback: spinner for saving, checkmark for saved, warning for error
  - Display last saved timestamp
  - Add retry button for failed saves

  - Integrate SaveStatusIndicator into ProjectWorkspace header
  - _Requirements: 1.2, 1.3, 1.4_

- [ ] 3. Connect autosave to editor
  - Hook AutosaveManager into Lexical editor's onChange event
  - Trigger autosave on chapter content changes
  - Update Zustand store's updateChapter action to trigger autosave


  - Add manual save button that bypasses debounce
  - Test autosave with rapid typing and verify debouncing works
  - _Requirements: 1.1, 1.6_

- [ ] 4. Fix dark mode color system
  - Extend tailwind.config.js with dark mode color palette
  - Update Modal component with dark mode styles
  - Update Input component with dark mode styles


  - Update Button component with dark mode hover states
  - Update Card components with dark mode backgrounds
  - Update Dashboard project cards with dark mode styles
  - Update SettingsModal with dark mode form elements
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7_

- [x] 5. Implement theme toggle functionality


  - Create ThemeManager service in `services/themeManager.ts`
  - Implement theme initialization from localStorage or system preference
  - Implement toggle function that updates DOM and persists to localStorage
  - Update Zustand store's setTheme action to use ThemeManager
  - Fix theme toggle button in App.tsx header
  - Test theme persistence across page reloads


  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7_

- [ ] 6. Create material management data layer
  - Add MaterialItem and MaterialFolder types to types.ts (already exist, verify)
  - Update IndexedDB schema to include materials and materialFolders tables
  - Create MaterialFileManager class in `services/materialFileManager.ts`

  - Implement file storage routing (IndexedDB for < 5MB, Supabase for > 5MB)
  - Add material CRUD operations to Zustand store
  - _Requirements: 4.1, 4.4, 4.10, 7.4_

- [ ] 7. Build materials tab UI
  - Create MaterialsTab component in `components/workspace/MaterialsTab.tsx`
  - Create MaterialsToolbar with Add Material dropdown, search, and view toggle
  - Create MaterialsSidebar with folder tree and tag filters
  - Create MaterialCard component for grid/list display


  - Implement drag-and-drop for organizing materials into folders
  - _Requirements: 4.1, 4.2, 4.6_

- [ ] 8. Implement material operations
  - Implement add note functionality with rich text editor
  - Implement file upload with thumbnail generation


  - Implement add link with URL validation
  - Implement folder creation and management
  - Implement tagging system with autocomplete
  - Implement bookmark functionality
  - Implement link material to chapter functionality
  - _Requirements: 4.3, 4.4, 4.5, 4.6, 4.7, 4.8, 4.9_



- [ ] 9. Create KDP calculator logic
  - Create KDPCalculator class in `services/kdpCalculator.ts`
  - Implement printing cost calculations for all marketplaces
  - Implement royalty calculations for 35% and 70% options
  - Implement break-even price calculation
  - Add KDP calculation storage to Zustand store
  - _Requirements: 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8_


- [ ] 10. Build KDP calculator UI
  - Create KDPCalculatorTab component in `components/workspace/KDPCalculatorTab.tsx`
  - Create input section with all required fields
  - Create results section with calculated values
  - Implement real-time calculation updates
  - Add save calculation functionality
  - Add calculation history view

  - _Requirements: 5.1, 5.8, 5.9, 5.10_

- [ ] 11. Implement DOCX export
  - Create ExportManager class in `services/exportManager.ts`
  - Implement exportToDOCX method using docx.js library
  - Parse HTML chapter content to DOCX format
  - Handle formatting: bold, italic, headings, lists
  - Add title page and table of contents generation


  - Test with sample manuscript
  - _Requirements: 6.2, 6.5, 6.6, 6.7, 6.8, 6.11_

- [ ] 12. Implement PDF export
  - Implement exportToPDF method using jsPDF library
  - Parse HTML chapter content to PDF format
  - Add page numbers and margins


  - Handle page breaks between chapters
  - Add header/footer support
  - Test with sample manuscript
  - _Requirements: 6.3, 6.5, 6.6, 6.7, 6.8, 6.10, 6.12_

- [x] 13. Implement EPUB export


  - Implement exportToEPUB method using epub-gen-memory library
  - Parse HTML chapter content to EPUB format
  - Add metadata (author, publisher, ISBN)
  - Generate table of contents with chapter navigation
  - Add cover image support
  - Test with e-reader apps

  - _Requirements: 6.4, 6.5, 6.6, 6.7, 6.8, 6.13_

- [ ] 14. Build export tab UI
  - Create ExportTab component in `components/workspace/ExportTab.tsx`
  - Create format selector (DOCX, PDF, EPUB)
  - Create chapter selector with checkboxes
  - Create options panel with format-specific settings
  - Add export button with progress indicator
  - Handle file download

  - _Requirements: 6.1, 6.5, 6.9, 6.10_

- [ ] 15. Add error handling and logging
  - Implement AutosaveErrorHandler for autosave failures
  - Implement ExportErrorHandler for export failures
  - Add comprehensive error logging throughout
  - Add user-friendly error messages with toast notifications
  - Test error scenarios (quota exceeded, network failure, etc.)
  - _Requirements: 1.4, 6.9_

- [ ] 16. Optimize for production deployment
  - Configure Vercel environment variables
  - Add code splitting for export libraries (lazy loading)
  - Optimize bundle size (target < 500KB initial)
  - Add security headers in vercel.json
  - Test deployment on Vercel preview environment
  - _Requirements: 7.1, 7.2, 7.3, 7.5, 7.6, 7.7, 7.8_

- [ ] 17. Testing and quality assurance
  - Write unit tests for AutosaveManager
  - Write unit tests for KDPCalculator
  - Write unit tests for ExportManager
  - Write integration tests for autosave flow
  - Write E2E tests for all new features
  - Test on multiple browsers (Chrome, Firefox, Safari)
  - Test on mobile devices
  - _Requirements: All_

- [ ] 18. Documentation and launch preparation
  - Update README with new features
  - Create user guide for materials management
  - Create user guide for KDP calculator
  - Create user guide for export functionality
  - Add changelog entry
  - Prepare launch announcement
  - _Requirements: All_
