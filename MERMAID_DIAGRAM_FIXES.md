# Mermaid Diagram Syntax Error Fixes

## Problem Summary

The application was experiencing Mermaid diagram rendering failures due to syntax errors in the AI-generated Mermaid code. The VisualCard component would show error messages like "Could not render diagram. Please check syntax." when attempting to display visual diagrams.

## Root Causes Identified

1. **Inconsistent AI-generated syntax**: The OpenRouter AI model was generating Mermaid code with varying syntax quality, sometimes including invalid characters, unbalanced brackets, or incorrect diagram type declarations.

2. **Lack of validation**: Generated Mermaid code was passed directly to the Mermaid renderer without any validation or sanitization.

3. **Insufficient error handling**: Error messages were generic and didn't help users understand what went wrong.

4. **No fallback mechanism**: When Mermaid code failed to render, there was no backup solution provided.

## Solutions Implemented

### 1. Enhanced AI Prompt Engineering (`services/ai.ts`)

**Changes to `generateVisual()` function:**

- Added specific syntax guidance for each diagram type (flowchart, mindmap, timeline, pie, gantt)
- Included explicit instructions to:
  - Use proper Mermaid v10+ syntax
  - Keep labels short and clear
  - Use only ASCII characters
  - Ensure balanced brackets/parentheses
  - Avoid markdown fences in output

**Example enhancement:**
```typescript
const typeGuidance = {
    [VisualType.Flowchart]: 'Use "flowchart TD" or "flowchart LR" syntax. Nodes should be in format: A[Label] --> B[Label]',
    [VisualType.MindMap]: 'Use "mindmap" syntax with proper indentation. Root node: root((Label))',
    // ... more type-specific guidance
};
```

### 2. Mermaid Code Sanitization (`services/ai.ts`)

**New `sanitizeMermaidCode()` function:**

- Removes markdown fences (```mermaid, ```)
- Strips leading/trailing quotes
- Normalizes line breaks and whitespace
- Fixes common syntax issues:
  - Proper arrow spacing (`-->`, `--->`)
  - Balanced pipe characters
  - Removes spaces in node IDs

### 3. Syntax Validation (`services/ai.ts`)

**New `validateMermaidSyntax()` function:**

Performs pre-render validation checks:
- Verifies first line contains valid diagram type declaration
- Checks minimum code length
- Validates balanced brackets and parentheses
- Returns detailed error messages for debugging

**Supported diagram types:**
- graph, flowchart, sequenceDiagram, classDiagram
- stateDiagram, erDiagram, journey, gantt
- pie, mindmap, timeline

### 4. Fallback Diagram Generation (`services/ai.ts`)

**New `generateFallbackMermaid()` function:**

Provides simple but valid Mermaid diagrams when AI generation or validation fails:

```typescript
// Example fallback for Flowchart
flowchart TD
    A[Start] --> B[Context snippet]
    B --> C[End]
```

Fallback diagrams are customized for each visual type and include safe, sanitized context text.

### 5. Enhanced Error Handling (`components/workspace/VisualCard.tsx`)

**Improvements to the rendering logic:**

- Added debug logging to track diagram rendering attempts
- Captures and logs the actual Mermaid code being rendered
- Provides specific error messages based on error types:
  - "Diagram syntax error detected" for parse errors
  - "Invalid characters in diagram code" for lexical errors
  - General message for other failures
- Logs complete error context for debugging

**Enhanced Mermaid initialization:**
```typescript
mermaid.initialize({
    startOnLoad: false,
    theme: 'dark',
    securityLevel: 'loose',
    logLevel: 'error',
    suppressErrors: false  // Show errors for debugging
});
```

## Error Recovery Flow

```
AI generates Mermaid code
    ↓
Sanitize code (remove fences, normalize whitespace)
    ↓
Validate syntax (check diagram type, balanced brackets)
    ↓
    ├─ Valid? → Render with Mermaid
    └─ Invalid? → Use fallback diagram
         ↓
    Render attempt fails?
         ↓
    Show specific error + offer retry/image generation
```

## Testing Recommendations

To verify these fixes work correctly:

1. **Test diagram generation:**
   - Create a new project
   - Analyze for visuals
   - Accept a recommendation
   - Verify diagram renders correctly

2. **Test error handling:**
   - Manually inject invalid Mermaid code (if possible)
   - Verify fallback is used
   - Check error messages are helpful

3. **Test different diagram types:**
   - Generate flowcharts
   - Generate mindmaps
   - Generate timelines
   - Verify type-specific syntax is correct

4. **Check logs:**
   - Look for "Generated Mermaid code failed validation" warnings
   - Check "Using fallback Mermaid diagram" info messages
   - Verify detailed error logging on render failures

## Benefits

1. **Improved reliability**: Diagrams now render successfully even when AI generates imperfect code
2. **Better user experience**: Specific error messages help users understand issues
3. **Graceful degradation**: Fallback diagrams ensure features still work
4. **Enhanced debugging**: Detailed logging helps identify and fix issues quickly
5. **Future-proof**: Validation can be extended with more syntax checks as needed

## Future Enhancements

Potential improvements for the future:

1. **User editing**: Allow users to manually edit Mermaid code
2. **Template library**: Provide pre-made diagram templates
3. **Syntax highlighting**: Show Mermaid code with syntax highlighting
4. **Live preview**: Real-time preview while editing
5. **Export options**: Export diagrams as PNG, SVG, or PDF
6. **Version history**: Track changes to diagrams over time

## Related Files Modified

- `services/ai.ts` - AI generation and validation logic
- `components/workspace/VisualCard.tsx` - Rendering and error handling
- `types.ts` - Type definitions (no changes needed)

## Notes

- These fixes prioritize user experience and reliability over perfect AI generation
- Fallback diagrams ensure the feature is always functional
- Detailed logging helps with ongoing maintenance and debugging
- The validation is intentionally permissive to avoid false positives
