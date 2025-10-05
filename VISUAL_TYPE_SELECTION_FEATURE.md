# Visual Type Selection Feature

## Overview

Users can now choose between generating a **Mermaid diagram** (infographic) or an **AI-generated image** when accepting visual recommendations in the AI Visuals tab.

## Implementation Details

### User Interface

**Location**: `components/workspace/RecommendationCard.tsx`

Each visual recommendation card now includes a selection UI with two options:

1. **Diagram** (Mermaid infographic)
   - Icon: ChartBarIcon
   - Description: "Generate an interactive Mermaid diagram"
   - Default selection

2. **AI Image** (Gemini-generated)
   - Icon: PhotoIcon
   - Description: "Generate an AI-powered image using Gemini"

### UI Components

```tsx
<div className="mt-4 p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
    <label className="text-xs font-semibold text-slate-400 mb-2 block">Generate As:</label>
    <div className="flex gap-2">
        <button onClick={() => setGenerationMode('diagram')}>
            <ChartBarIcon />
            Diagram
        </button>
        <button onClick={() => setGenerationMode('image')}>
            <PhotoIcon />
            AI Image
        </button>
    </div>
</div>
```

### State Management

**Component State**:
```typescript
type VisualGenerationMode = 'diagram' | 'image';
const [generationMode, setGenerationMode] = useState<VisualGenerationMode>('diagram');
```

**Store Actions** (`store/useStore.ts`):

1. **acceptRecommendation**: Generates Mermaid diagram (existing)
2. **acceptRecommendationAsImage**: Generates AI image (new)

### Flow Diagram

```
User clicks recommendation ✓
    ↓
Select generation mode:
    ├─ Diagram (default)
    │   ↓
    │   acceptRecommendation()
    │   ↓
    │   Generate Mermaid code via AI
    │   ↓
    │   Add to Visual Library
    │   ↓
    │   Remove from recommendations
    │
    └─ AI Image
        ↓
        acceptRecommendationAsImage()
        ↓
        Create descriptive prompt from recommendation
        ↓
        Generate image via Gemini Imagen
        ↓
        Add to Image Generation library
        ↓
        Remove from recommendations
```

## Implementation Files

### Modified Files

1. **`components/workspace/RecommendationCard.tsx`**
   - Added visual generation mode selection UI
   - Added state management for mode selection
   - Updated accept handler to call appropriate store action
   - Added imports for PhotoIcon and ChartBarIcon

2. **`store/useStore.ts`**
   - Added `acceptRecommendationAsImage` to BookCraftActions interface
   - Implemented `acceptRecommendationAsImage` function
   - Added success toast for diagram generation

3. **`components/Icons.tsx`**
   - No changes needed (icons already existed)

## Feature Behavior

### Diagram Mode (Default)

When user selects "Diagram" and clicks accept:

1. **Process**:
   - Calls `acceptRecommendation(rec)`
   - Generates Mermaid diagram code via AI
   - Validates and sanitizes Mermaid syntax
   - Falls back to simple diagram if validation fails
   - Adds Visual object to `project.visuals[]`

2. **Result Location**: Visual Library tab
3. **Display**: Rendered Mermaid SVG diagram
4. **Toast**: "Diagram Generated - The diagram has been added to your Visual Library!"

### AI Image Mode

When user selects "AI Image" and clicks accept:

1. **Process**:
   - Calls `acceptRecommendationAsImage(rec)`
   - Creates descriptive prompt from recommendation:
     ```
     Create a professional {type} visualization for: {context}. 
     {reasoning}. Style: clean, modern, informative.
     ```
   - Generates image via Gemini Imagen API
   - Adds GeneratedImage object to `project.generatedImages[]`

2. **Result Location**: Image Generation tab
3. **Display**: AI-generated PNG image (base64)
4. **Toast**: "Image Generated - The AI image has been added to your Image Generation library!"

## Example Usage

### User Workflow

1. **Analyze Manuscript**:
   - User clicks "Start Analysis" in AI Visuals tab
   - AI analyzes content and creates visual recommendations

2. **Review Recommendation**:
   - User sees recommendation card with:
     - Visual type (e.g., "Flowchart")
     - Reasoning
     - Context quote from manuscript
     - Page number

3. **Choose Generation Mode**:
   - User clicks either "Diagram" or "AI Image" button
   - Selection is highlighted in brand color

4. **Accept Recommendation**:
   - User clicks check mark button
   - System generates visual in selected mode
   - Loading spinner shown during generation
   - Success toast notification appears

5. **View Result**:
   - Diagram: Switch to Visual Library tab
   - Image: Switch to Image Generation tab

## Technical Details

### Prompt Construction for Images

```typescript
const prompt = `Create a professional ${rec.type.toLowerCase()} visualization for: ${rec.context}. ${rec.reasoning}. Style: clean, modern, informative.`;
```

**Example Prompts**:

- **Flowchart**:
  ```
  Create a professional flowchart visualization for: "The customer onboarding process begins with account creation...". 
  Shows sequential steps in customer journey. Style: clean, modern, informative.
  ```

- **Timeline**:
  ```
  Create a professional timeline visualization for: "The historical events from 1950 to 2000...". 
  Depicts chronological progression of events. Style: clean, modern, informative.
  ```

### Generation Time

- **Diagram**: 1-3 seconds (AI text generation + validation)
- **AI Image**: 5-10 seconds (Gemini Imagen API call)

### Error Handling

Both modes include comprehensive error handling:

**Diagram Mode**:
- AI generation failure → Use fallback diagram
- Mermaid validation failure → Use fallback diagram
- Render failure → Show error with retry option

**Image Mode**:
- Gemini API failure → Fall back to placeholder image
- Network error → Log and show error toast
- Invalid API key → Show configuration error

## User Benefits

1. **Flexibility**: Choose the best visual format for the content
2. **Quick Diagrams**: Fast, editable Mermaid diagrams for technical content
3. **Rich Images**: AI-generated images for more artistic/illustrative needs
4. **Organized**: Results automatically sorted into appropriate libraries
5. **Non-destructive**: Original recommendation removed only after success

## Future Enhancements

### Potential Improvements

1. **Preview Before Accept**:
   - Generate preview of both diagram and image
   - Allow side-by-side comparison
   - Let user pick after seeing results

2. **Bulk Generation**:
   - Select multiple recommendations
   - Generate all as diagrams or images
   - Batch processing for efficiency

3. **Hybrid Mode**:
   - Generate both diagram AND image
   - Keep both versions in respective libraries
   - Allow switching between versions

4. **Custom Prompts**:
   - Let users edit the AI image prompt
   - Provide prompt templates
   - Save prompt preferences

5. **Style Presets**:
   - Different art styles for images (realistic, sketch, 3D, etc.)
   - Different diagram themes (corporate, playful, academic)
   - Per-project style settings

6. **Generation History**:
   - Track what was generated from each recommendation
   - Allow regeneration with different mode
   - Version control for visuals

## Testing

### Manual Testing Checklist

- [ ] Create new project and analyze manuscript
- [ ] Verify recommendations appear with selection UI
- [ ] Test diagram generation (default)
  - [ ] Verify diagram appears in Visual Library
  - [ ] Check Mermaid rendering works
  - [ ] Confirm toast notification
- [ ] Test AI image generation
  - [ ] Verify image appears in Image Generation tab
  - [ ] Check image quality and relevance
  - [ ] Confirm toast notification
- [ ] Test mode switching before accept
  - [ ] Verify button highlights correctly
  - [ ] Check description text updates
- [ ] Test error scenarios
  - [ ] Invalid API key for images
  - [ ] Network failure during generation
  - [ ] Verify fallback behavior

### Edge Cases

1. **Rapid Clicking**: Disabled state prevents duplicate generations
2. **Mode Change During Generation**: Selection locked while generating
3. **Recommendation Deletion**: Mode state resets per card
4. **Empty Context**: Fallback prompts handle edge cases

## Performance Considerations

- Mode selection is instant (local state only)
- No additional API calls unless user accepts
- Both paths are equally efficient
- Caching could be added for repeated generations

## Accessibility

- Clear labels for both options
- Icons have semantic meaning
- Keyboard navigation supported
- Screen reader compatible descriptions

## Related Documentation

- [Mermaid Diagram Fixes](./MERMAID_DIAGRAM_FIXES.md)
- [Image Generation Implementation](./IMAGE_GENERATION_IMPLEMENTATION.md)
- [Session Summary](./SESSION_SUMMARY_2025-10-05.md)

## API Reference

### Store Actions

```typescript
// Generate Mermaid diagram from recommendation
acceptRecommendation(rec: VisualRecommendation): Promise<void>

// Generate AI image from recommendation
acceptRecommendationAsImage(rec: VisualRecommendation): Promise<void>

// Reject recommendation
rejectRecommendation(recId: string): void
```

### Component Props

```typescript
interface RecommendationCardProps {
    rec: VisualRecommendation;  // The visual recommendation
}

type VisualGenerationMode = 'diagram' | 'image';
```

## Summary

This feature provides users with meaningful choice in how their content is visualized, combining the best of both diagram-based and AI-generated imagery. The implementation is clean, performant, and follows existing patterns in the codebase.

---

*Feature implemented: October 5, 2025*
