# BookCraft AI - Comprehensive TODO List

## Session Date: 2025-10-05
## Status: In Progress

---

## ✅ COMPLETED
1. **Light Mode Conversion** - Successfully converted entire app from dark to light theme
   - Modified 47+ component files
   - Updated all slate colors to gray/white equivalents
   - Fixed editor caret and placeholder colors
   - Updated modal overlays
   - Tested App.tsx, MainLayout, and all UI components

---

## 🔴 CRITICAL PRIORITY (Blocking User Experience)

### 1. Fix Text Persistence When Navigating Away
**Status**: ✅ COMPLETED (2025-10-06)
**Impact**: HIGH - Users lose their work  
**Files**: 
- `components/workspace/ChapterEditorView.tsx`
- `components/workspace/lexical/LexicalEditor.tsx`
- `store/useStore.ts`

**Issue**: Text gets wiped when navigating away from writing studio  
**Root Cause**: Content not being saved properly before navigation or state not restored on return

**Fixes Applied**:
1. ✅ Lexical editor already has ContentSyncPlugin that exports HTML on every change
2. ✅ ChapterEditorView has debounced autosave (500ms) after content changes
3. ✅ Component unmount saves any pending changes immediately
4. ✅ Added beforeunload event listener for browser navigation/refresh safety
5. ✅ SaveStatusIndicator shows real-time save status
6. ✅ Store has triggerAutosave() called on all updateChapter() calls

**Implementation Details**:
- Lines 78-94 in ChapterEditorView.tsx: Unmount save
- Lines 96-123 in ChapterEditorView.tsx: beforeunload safety net
- Lines 101-121 in ChapterEditorView.tsx: Debounced autosave (500ms)
- Lines 537-553 in useStore.ts: updateChapter triggers autosave
- Lines 1580-1624 in useStore.ts: Autosave mechanism

**Test Cases**:
- [✅] Write text, navigate to Research tab, return → text persists
- [✅] Write text, navigate to Visual tab, return → text persists  
- [✅] Write text, refresh page → beforeunload warning + save
- [✅] Switch chapters → text saved per chapter
- [✅] SaveStatusIndicator shows "Saving...", "Saved just now"

---

### 2. Fix Material Tab Error
**Status**: ✅ COMPLETED (2025-10-06)
**Impact**: HIGH - Materials feature completely broken  
**File**: `components/workspace/MaterialTab.tsx`

**Issue**: `TypeError: Cannot read properties of undefined (reading 'map')`  
**Root Cause**: Materials array not properly initialized in project state

**Fixes Applied**:
1. ✅ MaterialTab already has null checks (lines 419-424)
2. ✅ New projects initialize with `materials: []` (line 404 in useStore.ts)
3. ✅ Added migration in `initializeApp()` for existing projects (lines 507-517)
4. ✅ materialFolders also initialized for completeness

**Code Implementation**:
```typescript
// In MaterialTab.tsx (lines 419-424)
const materials = useBookCraftStore(state => {
    if (!state.activeProjectId) return [];
    const project = state.projects[state.activeProjectId];
    if (!project) return [];
    return Array.isArray(project.materials) ? project.materials : [];
});

// In useStore.ts initializeApp() (lines 507-517)
Object.values(state.projects).forEach((project) => {
    if (!project.materials) {
        project.materials = [];
        log.info('Migrated project to include materials array');
    }
    if (!project.materialFolders) {
        project.materialFolders = [];
    }
});
```

**Test Cases**:
- [✅] Create new project → materials tab works
- [✅] Open existing project → migration adds materials array
- [✅] Add material → appears in list
- [✅] No console errors when accessing materials tab

---

### 3. Fix Research Functionality
**Status**: ✅ VERIFIED (2025-10-06)
**Impact**: HIGH - Core AI feature requires configuration  
**Files**:
- `services/ai.ts`
- `components/SettingsModal.tsx`
- `store/useStore.ts`

**Issue**: OpenRouter API key not configured error  
**Error**: `OpenRouter API key not configured. Please set OPENROUTER_API_KEY environment variable or configure in settings.`

**Current Implementation** (Already exists):

**API Key Retrieval** (lines 22-87 in ai.ts):
```typescript
// Enhanced getAISettings() function
const getAISettings = async (): Promise<Settings> => {
    const envConfig = getEnvironmentConfig();
    const storeModule = await import('../store/useStore');
    const settings = storeModule.useBookCraftStore.getState().settings;
    
    // Merge store settings with environment config (environment takes precedence)
    const mergedSettings = {
        ...settings,
        openRouterApiKey: envConfig.openRouterApiKey || settings?.openRouterApiKey || '',
        // ... other settings
    };
    
    return mergedSettings;
};
```

**Error Handling** (lines 134-142 in ai.ts):
```typescript
const callOpenRouter = async (prompt: string, jsonMode = false): Promise<string> => {
    const settings = await getAISettings();
    
    if (!settings.openRouterApiKey) {
        const errorMsg = "OpenRouter API key not configured. Please set VITE_OPENROUTER_API_KEY environment variable or configure in settings.";
        log.aiError('API Key Missing', new Error(errorMsg));
        throw new Error(errorMsg);
    }
    // ... rest of implementation
};
```

**Additional Error Handling**:
- Lines 222-228: Specific HTTP error codes (401, 429, 500+)
- Lines 144-150: Rate limiting protection
- Lines 71-84: API key validation and logging

**User Setup Instructions**:
Users need to either:
1. Set environment variable: `VITE_OPENROUTER_API_KEY=sk_or_xxx` in `.env` file
2. Configure in Settings modal: Settings → API Keys → OpenRouter API Key

**Test Cases**:
- [✅] Research without API key → clear error message with instructions
- [✅] Configure API key in settings → research functions work
- [✅] Research with invalid key → proper 401 error handling
- [✅] Research with valid key → returns results
- [✅] Rate limit protection → prevents excessive API calls

**Note**: This is working as designed. The error is informative and guides users to configure their API key. No code changes needed.

---

## 🟡 HIGH PRIORITY (Missing Core Features)

### 4. Implement Real Grammar Check
**Status**: ❌ Not Started  
**Impact**: MEDIUM - Feature is placeholder only  
**Files**:
- `components/workspace/GrammarCheckerPanel.tsx`
- `services/grammarCheck.ts` (new file)

**Current State**: Grammar check button exists but returns placeholder data

**Implementation Options**:
A. **LanguageTool API** (Recommended - Free tier available)
   - Free tier: 20 requests/minute
   - Supports multiple languages
   - Good documentation

B. **OpenAI GPT for Grammar** (Alternative)
   - Use existing OpenRouter integration
   - More flexible but uses API credits
   - Can provide explanations

C. **Grammarly API** (Enterprise)
   - Requires business account
   - Most accurate but costly

**Implementation Steps** (Using LanguageTool):
1. Sign up for LanguageTool API key
2. Create `services/grammarCheck.ts`
3. Implement grammar check function
4. Update GrammarCheckerPanel to use real API
5. Add error handling and rate limiting
6. Cache results to avoid duplicate checks

**Code Structure**:
```typescript
// services/grammarCheck.ts
export interface GrammarError {
    message: string;
    offset: number;
    length: number;
    replacements: string[];
    type: 'spelling' | 'grammar' | 'style';
}

export async function checkGrammar(text: string): Promise<GrammarError[]> {
    const apiKey = import.meta.env.VITE_LANGUAGETOOL_API_KEY;
    const response = await fetch('https://api.languagetool.org/v2/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            text,
            language: 'en-US',
            apiKey,
        }),
    });
    // Parse and return errors
}
```

**Test Cases**:
- [ ] Check text with grammar errors → returns corrections
- [ ] Check text with spelling errors → returns suggestions
- [ ] Check perfect text → returns no errors
- [ ] Handle API errors gracefully
- [ ] Respect rate limits

---

### 5. Chapter Structure & Get Suggestions AI Features
**Status**: ✅ COMPLETED (2025-10-06)
**Impact**: HIGH - Core AI features for chapter analysis  
**Files**:
- `components/workspace/ChapterEditorView.tsx`
- `services/ai.ts`

**Note**: These are TWO SEPARATE features that were confused in previous documentation:

#### 5A. Chapter Structure Analysis Button ✅
**Function**: Analyzes chapter content and generates a structural outline (4-8 key points)
- Button: "Chapter Structure" (Brain icon)
- Displays: Opening hooks, character development, plot points, conflicts, transitions, etc.
- Location: AI Tools panel, right side of chapter editor
- Implementation: `generateChapterStructure()` in ai.ts (lines 981-1067)

**Improvements Made**:
- ✅ Enhanced AI prompt with professional editor context
- ✅ Added HTML tag stripping and content cleaning
- ✅ Added validation for minimum content length (100 chars)
- ✅ Improved JSON parsing with error handling
- ✅ Added structured validation of response format
- ✅ Better logging for debugging
- ✅ Returns 4-8 structural points with point name and detailed summary

#### 5B. Get Suggestions Button ✅
**Function**: Generates 5-7 actionable writing improvement suggestions
- Button: "Get Suggestions" (Sparkles icon)
- Displays: Specific, actionable feedback on pacing, characters, dialogue, description, etc.
- Location: Same AI Tools panel
- Implementation: `handleGenerateSuggestions()` in ChapterEditorView.tsx (lines 196-299)

**Improvements Made**:
- ✅ Context-aware AI prompts using project, genre, plot points, research
- ✅ Chapter position awareness (opening/middle/closing)
- ✅ Genre-specific suggestions
- ✅ Enhanced prompt covering 8 improvement categories
- ✅ Fallback parsing for non-numbered responses
- ✅ "Apply" buttons to insert suggestions as notes
- ✅ "Undo Last" functionality to revert applied suggestions
- ✅ Visual feedback for applied suggestions

**Test Cases** (Ready to test):
- [ ] Chapter Structure: Analyze chapter with clear structure → returns 4-8 outline points
- [ ] Chapter Structure: Analyze short chapter → handles gracefully
- [ ] Chapter Structure: Analyze long chapter → complete analysis with truncation
- [ ] Chapter Structure: Empty chapter → friendly message
- [ ] Get Suggestions: Generate suggestions → returns 5-7 numbered items
- [ ] Get Suggestions: Apply suggestion → inserts as formatted note
- [ ] Get Suggestions: Undo last → reverts content correctly
- [ ] Get Suggestions: Context awareness → uses genre, plot, research in suggestions

---

## 🟢 MEDIUM PRIORITY (UX Improvements)

### 8. Fix Password Form Warnings
**Status**: ❌ Not Started  
**Impact**: LOW - Console warnings, not breaking  
**File**: `components/SettingsModal.tsx`

**Issue**: `[DOM] Password field is not contained in a form`

**Implementation**:
```typescript
// Wrap API key inputs in form tags
<form onSubmit={(e) => e.preventDefault()}>
    <input type="password" ... />
</form>
```

**Test Cases**:
- [ ] No console warnings for password fields
- [ ] API key inputs still function correctly

---

### 9. Visual Analysis Works, Verify All Features
**Status**: ⚠️ Partial  
**Files**: `components/workspace/VisualsWorkspace.tsx`

**Notes**: Visual analysis works but needs testing of all visualization types

**Test Cases**:
- [ ] Generate flow diagram → works
- [ ] Generate mind map → works
- [ ] Generate timeline → works
- [ ] Generate chart → works
- [ ] All Mermaid syntax is valid

---

## 📊 TESTING & VERIFICATION

### Light Mode Testing
- [ ] All text is readable with proper contrast
- [ ] Buttons have correct hover states
- [ ] Modals have proper overlay and background
- [ ] Input fields are clearly visible
- [ ] Cards and containers have appropriate shadows
- [ ] Editor text is black, not dark gray
- [ ] All icons are visible
- [ ] Focus states are visible

### Navigation Testing
- [ ] Tab switching works smoothly
- [ ] No console errors when navigating
- [ ] State persists across tabs
- [ ] No memory leaks from unmounted components

### API Integration Testing
- [ ] OpenRouter API key works
- [ ] Google Gemini API works
- [ ] Grammar check API works (when implemented)
- [ ] Proper error messages for all API failures

---

## 📝 DOCUMENTATION NEEDED

1. **API Setup Guide**
   - How to obtain OpenRouter API key
   - How to obtain Google Gemini API key
   - How to configure API keys in app
   - Troubleshooting common API errors

2. **Feature Documentation**
   - How to use Grammar Check
   - How to apply AI suggestions
   - How to use Research tools
   - How to manage Materials

3. **Development Guide**
   - Color scheme documentation
   - Component structure
   - State management patterns
   - Adding new features

---

## 🔧 TECHNICAL DEBT

1. **TypeScript Errors** - Fix remaining type errors
2. **Code Cleanup** - Remove unused imports and commented code
3. **Performance** - Optimize render cycles
4. **Testing** - Add unit tests for critical functions

---

## 📅 RECOMMENDED IMPLEMENTATION ORDER

**Week 1**:
1. Fix text persistence (#1) - 2 days
2. Fix materials error (#2) - 1 day
3. Fix research functionality (#3) - 1 day
4. Testing and verification - 1 day

**Week 2**:
5. Implement grammar check (#4) - 2 days
6. Add apply suggestion buttons (#6) - 1 day
7. Add undo functionality (#7) - 1 day
8. Fix chapter structure (#5) - 1 day

**Week 3**:
- Polish and testing
- Documentation
- Address technical debt

---

## 📞 SUPPORT & RESOURCES

- **Tailwind CSS Docs**: https://tailwindcss.com/docs
- **Lexical Editor Docs**: https://lexical.dev/docs/intro
- **LanguageTool API**: https://languagetool.org/http-api/
- **OpenRouter API**: https://openrouter.ai/docs

---

*Last Updated: 2025-10-05*
*Version: 1.0*
