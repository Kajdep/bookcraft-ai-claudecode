# BookCraft AI - GitHub Issues to Create

This file contains all issues that should be created and assigned. Each issue is formatted for direct creation in GitHub.

---

## 🔴 Critical Priority

### Issue #1: Implement Comprehensive Test Suite
**Labels:** critical, testing, infrastructure  
**Assignee:** @Kajdep  
**Priority:** P0 - Critical  
**Estimated Effort:** 2-3 weeks

**Description:**
The project currently has zero unit or integration tests. This creates significant risk for:
- Code refactoring
- Feature additions
- Bug fixes
- Onboarding new developers

**Current State:**
- 0% test coverage
- No test framework configured
- Only archived E2E tests exist

**Acceptance Criteria:**
- [ ] Set up Vitest test framework
- [ ] Create unit tests for `services/ai.ts`
- [ ] Create unit tests for `services/grammarService.ts`
- [ ] Create unit tests for `store/useStore.ts`
- [ ] Create integration tests for project creation workflow
- [ ] Create integration tests for chapter editing
- [ ] Set up test coverage reporting (target: 70%+)
- [ ] Add pre-commit hooks for test running
- [ ] Document testing guidelines in README

**Files to Create/Modify:**
- `vitest.config.ts`
- `services/__tests__/ai.test.ts`
- `services/__tests__/grammarService.test.ts`
- `store/__tests__/useStore.test.ts`
- `components/__tests__/CreateProjectModal.test.tsx`

---

### Issue #2: Add Error Boundaries Throughout Application
**Labels:** critical, ux, error-handling  
**Assignee:** @Kajdep  
**Priority:** P0 - Critical  
**Estimated Effort:** 1 week

**Description:**
Currently, only one top-level ErrorBoundary exists. Component failures crash the entire app with a white screen, losing unsaved work.

**Current State:**
- Single ErrorBoundary in App.tsx
- No component-level boundaries
- No error recovery mechanism
- No error logging

**Acceptance Criteria:**
- [ ] Add ErrorBoundary around ProjectWorkspace
- [ ] Add ErrorBoundary around LexicalEditor
- [ ] Add ErrorBoundary around ResearchTab
- [ ] Add ErrorBoundary around ExportTab
- [ ] Implement error logging to IndexedDB
- [ ] Create user-friendly error messages
- [ ] Add "Reset" buttons for error recovery
- [ ] Add error reporting service integration

**Files to Modify:**
- `components/ProjectWorkspace.tsx`
- `components/workspace/WritingDesk.tsx`
- `components/workspace/ResearchTab.tsx`
- `components/workspace/ExportTab.tsx`
- Create: `components/ErrorBoundary.tsx` (enhanced version)

---

### Issue #3: Implement IndexedDB for Large File Storage
**Labels:** critical, storage, data-persistence  
**Assignee:** @Kajdep  
**Priority:** P0 - Critical  
**Estimated Effort:** 2 weeks

**Description:**
Currently using localStorage (5-10MB limit) for all data. This prevents:
- Storing uploaded research documents
- Saving generated images
- Handling large projects
- File attachments

**Current State:**
- Only localStorage persistence
- IndexedDB functions defined but not implemented
- No storage quota detection
- File uploads may not persist

**Acceptance Criteria:**
- [ ] Create `services/storage/indexedDBService.ts`
- [ ] Implement file storage for images
- [ ] Implement file storage for research documents (PDF, DOCX)
- [ ] Implement file storage for generated exports
- [ ] Add storage quota API integration
- [ ] Display storage usage in Settings UI
- [ ] Add warning at 80% capacity
- [ ] Implement file cleanup/archival options
- [ ] Test with 50MB+ files

**Files to Create:**
- `services/storage/indexedDBService.ts`
- `services/storage/storageService.ts`

**Files to Modify:**
- `store/useStore.ts`
- `components/SettingsModal.tsx`

---

### Issue #4: Optimize Bundle Size (2.6MB → <500KB)
**Labels:** critical, performance, optimization  
**Assignee:** @Kajdep  
**Priority:** P0 - Critical  
**Estimated Effort:** 1 week

**Description:**
Main bundle is 2.6MB (690KB gzipped), which is 3x the recommended limit. This causes:
- Slow initial page load
- Poor mobile experience
- High bounce rates
- Poor Core Web Vitals scores

**Current Bundle Analysis:**
```
Main bundle: 2,649.94 kB (690.19 kB gzipped)
Target: <500 kB (244 kB gzipped)
```

**Large Dependencies:**
- Mermaid.js (visualization library)
- Cytoscape.esm (442KB)
- Katex (265KB)
- html2canvas (202KB)

**Acceptance Criteria:**
- [ ] Implement lazy loading for ExportTab
- [ ] Implement lazy loading for VisualsWorkspace
- [ ] Implement lazy loading for CoverCreator
- [ ] Load Mermaid.js on-demand
- [ ] Configure manual chunks for large libraries
- [ ] Split routes into separate bundles
- [ ] Reduce main bundle to <500KB
- [ ] Test performance on slow 3G connection
- [ ] Improve Lighthouse score to 90+

**Files to Modify:**
- `vite.config.ts`
- `App.tsx` (add lazy loading)
- `components/ProjectWorkspace.tsx` (add lazy loading)

**Example Implementation:**
```typescript
const ExportTab = lazy(() => import('./ExportTab'));
const VisualsWorkspace = lazy(() => import('./VisualsWorkspace'));
```

---

### Issue #5: Production Build Testing & Deployment Setup
**Labels:** critical, deployment, devops  
**Assignee:** @Kajdep  
**Priority:** P0 - Critical  
**Estimated Effort:** 1 week

**Description:**
Production build succeeds but has never been tested in a production-like environment. No CI/CD pipeline exists.

**Current State:**
- Build passes but untested
- No environment variable validation
- No deployment documentation
- No CI/CD pipeline
- No rollback strategy

**Acceptance Criteria:**
- [ ] Create `.env.production` file
- [ ] Create `.env.staging` file
- [ ] Test production build locally with `npm run preview`
- [ ] Verify all features work in production mode
- [ ] Test with real API keys (OpenRouter, Gemini)
- [ ] Create `DEPLOYMENT.md` documentation
- [ ] Set up GitHub Actions CI/CD pipeline
- [ ] Add environment variable validation script
- [ ] Test deployment to staging environment
- [ ] Document rollback procedure

**Files to Create:**
- `.github/workflows/deploy.yml`
- `.github/workflows/test.yml`
- `scripts/validate-env.js`
- `DEPLOYMENT.md`
- `.env.production`
- `.env.staging`

---

## 🟡 High Priority

### Issue #6: Implement Settings UI
**Labels:** high-priority, ui, user-experience  
**Assignee:** @Kajdep  
**Priority:** P1 - High  
**Estimated Effort:** 1 week

**Description:**
SettingsModal exists but is empty. Users cannot:
- Configure API keys
- Select AI models
- Set writing preferences
- Manage storage

**Current State:**
- Empty/minimal SettingsModal component
- Settings state exists but no UI
- No API key validation

**Acceptance Criteria:**
- [ ] Create tabbed settings interface
- [ ] Add API Keys tab (OpenRouter, Gemini, LanguageTool)
- [ ] Add AI Model Selection tab
- [ ] Add Writing Preferences tab (auto-save, word count goals)
- [ ] Add Storage Management tab
- [ ] Implement API key validation
- [ ] Add settings import/export (JSON)
- [ ] Add dark/light theme toggle
- [ ] Add settings reset button

**Files to Modify:**
- `components/SettingsModal.tsx`

---

### Issue #7: Complete Citation Generator Implementation
**Labels:** high-priority, feature, research  
**Assignee:** @Kajdep  
**Priority:** P1 - High  
**Estimated Effort:** 1 week

**Description:**
Citation UI exists but has no formatting logic. Cannot generate properly formatted citations.

**Current State:**
- UI exists in CitationManager
- No formatting implementation
- No APA/MLA/Chicago support

**Acceptance Criteria:**
- [ ] Implement APA citation formatting
- [ ] Implement MLA citation formatting
- [ ] Implement Chicago citation formatting
- [ ] Add in-text citation insertion
- [ ] Add bibliography generation
- [ ] Add citation style switching
- [ ] Test with various source types (book, article, website)
- [ ] Add citation validation

**Files to Modify:**
- `components/workspace/CitationManager.tsx`
- `store/useStore.ts`

**Example Implementation:**
```typescript
formatAPA(citation: Citation): string {
  // Author, A. A. (Year). Title. Publisher.
  return `${citation.author} (${citation.year}). ${citation.title}. ${citation.publisher}.`;
}
```

---

### Issue #8: Implement Real Image Generation APIs
**Labels:** high-priority, feature, ai-integration  
**Assignee:** @Kajdep  
**Priority:** P1 - High  
**Estimated Effort:** 1 week

**Description:**
Image generation currently returns placeholder SVGs. Need real API integration.

**Current State:**
- DALL-E integration is stub
- Stability AI integration is stub
- Returns placeholder images

**Acceptance Criteria:**
- [ ] Implement DALL-E 3 API integration
- [ ] Implement Stability AI API integration
- [ ] Add proper error messages
- [ ] Document API key setup in README
- [ ] Add image generation quotas/rate limits
- [ ] Add image preview before saving
- [ ] Test with various prompts
- [ ] Handle API errors gracefully

**Files to Modify:**
- `services/ai.ts` (lines 384-523)
- `services/gemini.ts` (lines 473-520)

---

### Issue #9: Design & Implement Authentication System
**Labels:** high-priority, feature, security  
**Assignee:** @Kajdep  
**Priority:** P1 - High  
**Estimated Effort:** 2-3 weeks

**Description:**
App is completely client-side with no user accounts. Cannot:
- Sync data across devices
- Back up user data to cloud
- Share projects
- Protect user data

**Current State:**
- No authentication
- No user accounts
- No data sync
- Supabase dependency exists but unused

**Acceptance Criteria:**
- [ ] Evaluate auth providers (Supabase vs Firebase vs Auth0)
- [ ] Design auth flow (email/password + social logins)
- [ ] Implement user registration
- [ ] Implement user login
- [ ] Implement password reset
- [ ] Add user profile management
- [ ] Implement data sync to cloud
- [ ] Add cloud backup option
- [ ] Update privacy policy
- [ ] Add terms of service

**Files to Create:**
- `services/auth/authService.ts`
- `components/auth/LoginModal.tsx`
- `components/auth/SignupModal.tsx`
- `components/auth/ProfileModal.tsx`

---

### Issue #10: Test Export Functionality End-to-End
**Labels:** high-priority, testing, export  
**Assignee:** @Kajdep  
**Priority:** P1 - High  
**Estimated Effort:** 1 week

**Description:**
Comprehensive export code exists (PDF, EPUB, HTML, DOCX) but has never been tested end-to-end.

**Current State:**
- 700+ lines of export code
- Never tested with real projects
- Cross-browser compatibility unknown
- Large document performance unknown

**Acceptance Criteria:**
- [ ] Test PDF export with jsPDF
- [ ] Test EPUB export with epub-gen-memory
- [ ] Test HTML export
- [ ] Test DOCX export with docx package
- [ ] Test Mermaid diagram rendering in exports
- [ ] Test large documents (50k+ words)
- [ ] Test cross-browser (Chrome, Firefox, Safari, Edge)
- [ ] Add progress indicators for long exports
- [ ] Add export error handling
- [ ] Create export tests in test suite

**Files to Test:**
- `components/workspace/ExportTab.tsx`

---

## 🟢 Medium Priority

### Issue #11: Replace console.* with Logger Service
**Labels:** medium-priority, code-quality, logging  
**Assignee:** @Kajdep  
**Priority:** P2 - Medium  
**Estimated Effort:** 2 hours

**Description:**
9 console.* statements found that should use the centralized logger service.

**Acceptance Criteria:**
- [ ] Find all console.* statements
- [ ] Replace with log.info/warn/error
- [ ] Add proper context to logs
- [ ] Verify logging in production mode

**Example:**
```typescript
// Before
console.log('User action');

// After
import { log } from '../../services/logger';
log.info('User action', null, 'ComponentName');
```

---

### Issue #12: Reduce 'any' Type Usage (74 instances)
**Labels:** medium-priority, code-quality, typescript  
**Assignee:** @Kajdep  
**Priority:** P2 - Medium  
**Estimated Effort:** 1 week

**Description:**
74 uses of `: any` type compromise type safety.

**Acceptance Criteria:**
- [ ] Audit all 74 `any` usages
- [ ] Replace with proper types
- [ ] Use `unknown` where type is truly unknown
- [ ] Add type definitions where missing
- [ ] Enable `strict` mode in tsconfig.json

---

### Issue #13: Sanitize dangerouslySetInnerHTML Usage
**Labels:** medium-priority, security, xss  
**Assignee:** @Kajdep  
**Priority:** P2 - Medium  
**Estimated Effort:** 1 day

**Description:**
2 uses of dangerouslySetInnerHTML create XSS vulnerability risk.

**Files:**
- `components/workspace/MergeContentModal.tsx`
- `components/workspace/VisualCard.tsx`

**Acceptance Criteria:**
- [ ] Add DOMPurify dependency
- [ ] Sanitize HTML in MergeContentModal
- [ ] Sanitize HTML in VisualCard
- [ ] Add CSP headers
- [ ] Document HTML sanitization in code

---

### Issue #14: Test Document Analysis with Real Files
**Labels:** medium-priority, testing, document-parsing  
**Assignee:** @Kajdep  
**Priority:** P2 - Medium  
**Estimated Effort:** 3 days

**Description:**
Document parsing implemented but never tested with real files.

**Files:**
- `services/ai.ts` (lines 1196-1604)

**Acceptance Criteria:**
- [ ] Create test suite with sample files (PDF, DOCX, RTF, CSV)
- [ ] Test error handling for corrupted files
- [ ] Test large files (10MB+)
- [ ] Add file size limits (50MB?)
- [ ] Add progress indicators
- [ ] Document supported file formats

---

### Issue #15: Test Web Content Summarization
**Labels:** medium-priority, testing, web-scraping  
**Assignee:** @Kajdep  
**Priority:** P2 - Medium  
**Estimated Effort:** 3 days

**Description:**
HTML parsing with DOMParser implemented but CORS limitations need testing.

**Files:**
- `services/ai.ts` (lines 810-1191)

**Acceptance Criteria:**
- [ ] Test with real URLs
- [ ] Document CORS limitations
- [ ] Test ScrapingBee integration (if API key available)
- [ ] Implement rate limiting
- [ ] Add error messages for blocked domains
- [ ] Add URL validation

---

## 🔵 Low Priority

### Issue #16: Optimize Analytics Dashboard Performance
**Labels:** low-priority, performance, analytics  
**Assignee:** @Kajdep  
**Priority:** P3 - Low  
**Estimated Effort:** 2 days

**Description:**
Analytics implementation complete but large dataset rendering untested.

**Acceptance Criteria:**
- [ ] Test with multi-month data
- [ ] Add analytics export (CSV/JSON)
- [ ] Optimize chart rendering
- [ ] Add data caching
- [ ] Test with 1000+ writing sessions

---

### Issue #17: Verify KDP Calculator Pricing
**Labels:** low-priority, verification, kdp  
**Assignee:** @Kajdep  
**Priority:** P3 - Low  
**Estimated Effort:** 1 day

**Description:**
KDP pricing data marked as 2024, needs verification.

**Acceptance Criteria:**
- [ ] Update KDP pricing if changed
- [ ] Validate against real KDP examples
- [ ] Document calculation formulas
- [ ] Add link to official KDP pricing page

---

### Issue #18: Test Material Management File Upload
**Labels:** low-priority, testing, file-upload  
**Assignee:** @Kajdep  
**Priority:** P3 - Low  
**Estimated Effort:** 2 days

**Description:**
UI complete but IndexedDB file storage untested.

**Acceptance Criteria:**
- [ ] Test complete upload/retrieval flow
- [ ] Implement file size validation (10MB limit?)
- [ ] Test thumbnail generation for images
- [ ] Verify IndexedDB cleanup on delete
- [ ] Test with various file types

---

### Issue #19: Test Lexical Editor with Large Documents
**Labels:** low-priority, performance, editor  
**Assignee:** @Kajdep  
**Priority:** P3 - Low  
**Estimated Effort:** 3 days

**Description:**
Performance with 50k+ word documents untested.

**Acceptance Criteria:**
- [ ] Add performance monitoring
- [ ] Test with 50k word document
- [ ] Test with 100k word document
- [ ] Optimize auto-save debouncing
- [ ] Configure undo/redo history limits
- [ ] Consider virtual scrolling if needed

---

### Issue #20: Create User Documentation
**Labels:** low-priority, documentation, user-guides  
**Assignee:** @Kajdep  
**Priority:** P3 - Low  
**Estimated Effort:** 1-2 weeks

**Description:**
Only technical documentation exists. Need user-facing guides.

**Acceptance Criteria:**
- [ ] Create getting started guide
- [ ] Document API key setup (OpenRouter, Gemini)
- [ ] Create feature tutorials
- [ ] Add in-app help tooltips
- [ ] Create video walkthroughs
- [ ] Add FAQ section
- [ ] Document keyboard shortcuts

---

## Summary

**Total Issues:** 20
- 🔴 Critical: 5 issues
- 🟡 High: 5 issues
- 🟢 Medium: 5 issues
- 🔵 Low: 5 issues

**Estimated Total Effort:** 12-15 weeks

**Critical Path (Must Fix Before Production):**
1. Issue #1: Test Suite (2-3 weeks)
2. Issue #2: Error Boundaries (1 week)
3. Issue #3: Data Persistence (2 weeks)
4. Issue #4: Bundle Optimization (1 week)
5. Issue #5: Production Testing (1 week)

**Total Critical Path:** 7-9 weeks

---

## How to Create These Issues

1. Go to https://github.com/Kajdep/bookcraft-ai-claudecode/issues
2. Click "New Issue"
3. Copy/paste each issue above
4. Add labels as specified
5. Assign to @Kajdep
6. Set milestone (e.g., "Production Ready v1.0")
7. Add to project board if using one

---

**Document Generated:** 2025-01-25  
**All issues ready for GitHub creation**
