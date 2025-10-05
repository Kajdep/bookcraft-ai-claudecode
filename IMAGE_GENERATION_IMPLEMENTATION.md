# Real Image Generation Implementation

## Overview

The BookCraft AI application now supports **real AI-powered image generation** using Google's Gemini Imagen API. This replaces the previous placeholder image system with actual AI-generated images.

## Implementation Details

### Primary Image Generation Method: Google Gemini Imagen

**File**: `services/ai.ts`

The application now uses Google's Gemini Imagen 3.0 model for image generation through the `generateImageWithGemini()` function.

**API Endpoint**: 
```
https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-001:generateImages
```

**Features**:
- ✅ Uses Gemini API key from application settings
- ✅ Generates 1024x1024 images in 1:1 aspect ratio
- ✅ Configurable safety filters
- ✅ Supports person generation
- ✅ Returns base64-encoded images
- ✅ Comprehensive error handling and logging

### Fallback Options

The system includes multiple fallback options for maximum reliability:

1. **Primary**: Gemini Imagen (via `settings.geminiApiKey`)
2. **Secondary**: DALL-E (via `process.env.DALLE_API_KEY`)
3. **Tertiary**: Stability AI (via `process.env.STABILITY_API_KEY`)
4. **Final Fallback**: Procedural placeholder images

### Request Format

```typescript
{
  prompt: string,              // User's image generation prompt
  number_of_images: 1,        // Always generate 1 image
  aspect_ratio: '1:1',        // Square images
  safety_filter_level: 'block_some',  // Moderate safety filtering
  person_generation: 'allow_adult',   // Allow person generation
  include_safety_attributes: false    // Simplified response
}
```

### Response Handling

The implementation checks multiple possible response formats to ensure compatibility:

```typescript
// Primary format
data.generated_images[0].image_base64

// Alternative formats (for API version compatibility)
data.generated_images[0].bytesBase64Encoded
data.generated_images[0].image
data.predictions[0].bytesBase64Encoded
```

## Configuration

### Setting Up Gemini API Key

1. **Get API Key**:
   - Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Create a new API key
   - Copy the key

2. **Configure in BookCraft AI**:
   - Open Settings in the application
   - Navigate to the "AI Configuration" section
   - Paste your Gemini API key in the "Gemini API Key" field
   - Save settings

3. **Enable Imagen API** (if needed):
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Enable the "Vertex AI API" for your project
   - Image generation should now work

### Environment Variables (Optional)

For development or alternative image generation services, you can set:

```env
# OpenAI DALL-E (fallback)
DALLE_API_KEY=sk-...

# Stability AI (fallback)
STABILITY_API_KEY=sk-...
```

## Usage in Application

### Where Image Generation is Used

1. **Visuals Workspace**:
   - "Generate Image" button on visual recommendations
   - Fallback when Mermaid diagrams fail to render

2. **Cover Creator**:
   - Book cover image generation
   - Background image creation

3. **Writing Studio** (future):
   - Inline image suggestions
   - Scene illustrations

### Example Usage

```typescript
import { generateImage } from '../services/ai';

// Generate an image from a text prompt
const prompt = "A serene mountain landscape at sunset with a lake";
const base64Image = await generateImage(prompt);

// Display the image
<img src={`data:image/png;base64,${base64Image}`} alt="Generated" />
```

## Error Handling

The implementation includes comprehensive error handling:

### Common Errors

1. **API Key Not Configured**:
   ```
   No image generation API configured, using placeholder
   ```
   - **Solution**: Configure Gemini API key in settings

2. **API Not Available**:
   ```
   Gemini Imagen API is not available or not enabled for this API key
   ```
   - **Solution**: Enable Vertex AI Imagen in Google Cloud Console

3. **Network Errors**:
   ```
   Gemini Imagen API error (500): ...
   ```
   - **Solution**: Check internet connection, try again later

4. **Safety Filter Triggered**:
   - The API may reject prompts that violate safety guidelines
   - **Solution**: Rephrase the prompt to be more appropriate

### Fallback Behavior

If image generation fails:
1. Error is logged with full details
2. System tries next available method (DALL-E, Stability AI)
3. If all fail, generates artistic placeholder with:
   - Gradient background (colors based on prompt)
   - Geometric shapes
   - Prompt text overlay
   - Notification that it's a placeholder

## Technical Implementation

### Key Functions

#### `generateImage(prompt: string): Promise<string>`
- Main entry point for image generation
- Checks configured API keys in priority order
- Returns base64-encoded image string
- Never throws (always returns placeholder on failure)

#### `generateImageWithGemini(prompt: string, apiKey: string): Promise<string>`
- Calls Gemini Imagen API
- Handles response parsing
- Throws on failure (caught by parent function)

#### `generatePlaceholderImage(prompt: string): string`
- Creates canvas-based placeholder
- Uses hash of prompt for consistent colors
- Adds geometric shapes and text

### Logging

All image generation attempts are logged:

```typescript
// Success
log.info('Gemini Imagen generation successful via image_base64')

// Failure
log.error('Gemini Imagen generation failed', { 
  error: 'API error message',
  promptPreview: 'First 50 chars of prompt'
})
```

## Performance Considerations

- **Generation Time**: Typically 3-8 seconds per image
- **Image Size**: ~300KB-500KB for base64-encoded 1024x1024 images
- **Rate Limits**: Check Google AI Studio quotas
- **Caching**: Consider implementing client-side caching for generated images

## Security Considerations

1. **API Key Storage**: 
   - Gemini API key is stored in browser's localStorage
   - Never committed to version control
   - Not exposed in client-side logs

2. **Content Safety**:
   - Gemini Imagen includes built-in safety filters
   - Safety level set to "block_some" (moderate)
   - Inappropriate content is automatically rejected

3. **Prompt Injection**:
   - User prompts are sent directly to API
   - Gemini's safety systems handle malicious prompts
   - Consider additional prompt validation for production

## Future Enhancements

Potential improvements for future versions:

1. **Image Editing**:
   - Inpainting (edit parts of generated images)
   - Outpainting (extend images beyond borders)
   - Style transfer

2. **Advanced Controls**:
   - Multiple aspect ratios (16:9, 4:3, etc.)
   - Image resolution options
   - Style presets (realistic, artistic, sketch, etc.)

3. **Image Management**:
   - Save generated images to project library
   - Image history and regeneration
   - Batch generation

4. **Alternative Models**:
   - Support for more Imagen variants
   - Integration with other providers (FLUX, Midjourney API)
   - Local model support (Stable Diffusion)

## Testing

### Manual Testing Checklist

- [ ] Configure Gemini API key in settings
- [ ] Generate an image from Visuals tab
- [ ] Verify image displays correctly
- [ ] Test with various prompts (landscapes, portraits, abstract)
- [ ] Test with invalid API key (should fall back to placeholder)
- [ ] Test without API key (should use placeholder)
- [ ] Check browser console for error logs

### Example Test Prompts

```
1. "A cozy library with floor-to-ceiling bookshelves and warm lighting"
2. "An abstract representation of data flowing through neural networks"
3. "A vintage typewriter on a wooden desk with coffee"
4. "A futuristic cityscape at night with neon lights"
5. "A peaceful zen garden with rocks and sand patterns"
```

## Troubleshooting

### Issue: Images Not Generating

**Check**:
1. Is Gemini API key configured in settings?
2. Is Vertex AI enabled in Google Cloud Console?
3. Check browser console for error messages
4. Verify internet connection

### Issue: Getting Placeholder Images

**Reasons**:
- API key not configured
- API key invalid or expired
- Quota exceeded
- Network error
- Safety filter triggered

**Solution**: Check logs in browser console for specific error message

### Issue: Slow Generation

**Normal**: Image generation takes 3-8 seconds
**Slow**: If taking >15 seconds, check:
- Network connection speed
- Google AI Studio status page
- API quota limits

## API Costs

As of 2024:
- **Google AI Studio** (Gemini): Free tier available, check current pricing
- **DALL-E**: ~$0.02 per image (1024x1024)
- **Stability AI**: ~$0.002-0.008 per image

Always check current pricing at the respective provider websites.

## Related Files

- `services/ai.ts` - Image generation implementation
- `components/workspace/VisualCard.tsx` - Image display component
- `store/useStore.ts` - Image state management
- `types.ts` - Type definitions for images

## References

- [Google AI Studio](https://makersuite.google.com/)
- [Gemini API Documentation](https://ai.google.dev/docs)
- [Vertex AI Imagen](https://cloud.google.com/vertex-ai/docs/generative-ai/image/overview)
