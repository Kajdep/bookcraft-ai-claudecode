import { GoogleGenAI } from "@google/genai";
import { Chapter, Project, VisualRecommendation, VisualType, PlotPoint, ResearchType, ResearchConfidence, ResearchSource, SourceCredibility, FactCheckResult, ResearchItem, Citation, CitationStyle, ThematicTag, ResearchContradiction, ResearchTimeline, ResearchMindMap, Settings } from "../types";
import { log } from "./logger";

// Default configuration - will be overridden by user settings
const DEFAULT_OPENROUTER_MODEL = "nvidia/nemotron-nano-9b-v2:free";

// Enhanced environment configuration
interface AIEnvironmentConfig {
    openRouterApiKey: string;
    openRouterEndpoint: string;
    geminiApiKey: string;
    geminiEndpoint: string;
    defaultModel: string;
    temperature: number;
    maxTokens: number;
    enableDebugLogging: boolean;
    validateApiKeys: boolean;
}

// Get environment configuration with fallbacks
const getEnvironmentConfig = (): AIEnvironmentConfig => {
    const isProduction = import.meta.env.MODE === 'production';
    const debugLogging = import.meta.env.VITE_ENABLE_DEBUG_LOGGING === 'true';
    
    return {
        openRouterApiKey: import.meta.env.VITE_OPENROUTER_API_KEY || '',
        openRouterEndpoint: import.meta.env.VITE_OPENROUTER_ENDPOINT || 'https://openrouter.ai/api/v1',
        geminiApiKey: import.meta.env.VITE_GEMINI_API_KEY || '',
        geminiEndpoint: import.meta.env.VITE_GEMINI_ENDPOINT || 'https://generativelanguage.googleapis.com',
        defaultModel: import.meta.env.VITE_DEFAULT_AI_MODEL || DEFAULT_OPENROUTER_MODEL,
        temperature: parseFloat(import.meta.env.VITE_DEFAULT_TEMPERATURE || '0.7'),
        maxTokens: parseInt(import.meta.env.VITE_DEFAULT_MAX_TOKENS || '4000'),
        enableDebugLogging: debugLogging && !isProduction,
        validateApiKeys: import.meta.env.VITE_VALIDATE_API_KEYS !== 'false'
    };
};

// Function to get current settings from store with environment fallbacks
const getAISettings = async (): Promise<Settings> => {
    const envConfig = getEnvironmentConfig();
    
    // Use dynamic import to avoid circular dependencies
    let useBookCraftStore;
    try {
        const storeModule = await import('../store/useStore');
        useBookCraftStore = storeModule.useBookCraftStore;
    } catch (importError) {
        if (envConfig.enableDebugLogging) {
            log.error('Store import failed, using environment config only', importError);
        }
        // Return environment config if store import fails
        return envConfig as Settings;
    }

    const settings = useBookCraftStore.getState().settings;
    
    // Merge store settings with environment config (environment takes precedence)
    const mergedSettings = {
        ...settings,
        openRouterApiKey: envConfig.openRouterApiKey || settings?.openRouterApiKey || '',
        openRouterEndpoint: envConfig.openRouterEndpoint || settings?.openRouterEndpoint || envConfig.openRouterEndpoint,
        geminiApiKey: envConfig.geminiApiKey || settings?.geminiApiKey || '',
        geminiEndpoint: envConfig.geminiEndpoint || settings?.geminiEndpoint || envConfig.geminiEndpoint,
        defaultModel: envConfig.defaultModel || settings?.defaultModel || envConfig.defaultModel,
        temperature: settings?.temperature ?? envConfig.temperature,
        maxTokens: settings?.maxTokens ?? envConfig.maxTokens
    };
    
    // Validate API keys if enabled
    if (envConfig.validateApiKeys && envConfig.enableDebugLogging) {
        const validationResults = {
            openRouterConfigured: !!mergedSettings.openRouterApiKey,
            geminiConfigured: !!mergedSettings.geminiApiKey,
            hasValidModel: !!mergedSettings.defaultModel
        };
        
        if (!validationResults.openRouterConfigured) {
            log.warn('OpenRouter API key not configured - AI text features will be limited');
        }
        if (!validationResults.geminiConfigured) {
            log.warn('Gemini API key not configured - Image generation will be disabled');
        }
    }

    return mergedSettings as Settings;
};

// Rate limiting for API calls
interface RateLimitInfo {
    lastCall: number;
    callCount: number;
    windowStart: number;
}

const rateLimitMap = new Map<string, RateLimitInfo>();

const checkRateLimit = async (apiKey: string): Promise<void> => {
    const envConfig = getEnvironmentConfig();
    const limit = parseInt(import.meta.env.VITE_API_RATE_LIMIT || '100');
    const window = parseInt(import.meta.env.VITE_API_RATE_WINDOW || '3600000'); // 1 hour
    
    const keyHash = apiKey.slice(-8); // Use last 8 chars for identification
    const now = Date.now();
    const rateLimitInfo = rateLimitMap.get(keyHash) || { lastCall: 0, callCount: 0, windowStart: now };
    
    // Reset window if needed
    if (now - rateLimitInfo.windowStart > window) {
        rateLimitInfo.callCount = 0;
        rateLimitInfo.windowStart = now;
    }
    
    // Check rate limit
    if (rateLimitInfo.callCount >= limit) {
        const resetTime = rateLimitInfo.windowStart + window;
        const waitTime = Math.ceil((resetTime - now) / 1000);
        throw new Error(`Rate limit exceeded. Try again in ${waitTime} seconds.`);
    }
    
    // Update rate limit info
    rateLimitInfo.lastCall = now;
    rateLimitInfo.callCount++;
    rateLimitMap.set(keyHash, rateLimitInfo);
    
    // Add small delay between requests to be respectful
    if (now - rateLimitInfo.lastCall < 1000) {
        await new Promise(resolve => setTimeout(resolve, 100));
    }
};

/**
 * Makes a request to OpenRouter API for text generation with enhanced error handling
 */
const callOpenRouter = async (prompt: string, jsonMode = false, overrideModel?: string): Promise<string> => {
    const settings = await getAISettings();
    const envConfig = getEnvironmentConfig();

    if (!settings.openRouterApiKey) {
        const errorMsg = "OpenRouter API key not configured. Please set OPENROUTER_API_KEY environment variable or configure in settings.";
        log.aiError('API Key Missing', new Error(errorMsg));
        throw new Error(errorMsg);
    }

    // Check rate limiting
    try {
        await checkRateLimit(settings.openRouterApiKey);
    } catch (rateLimitError) {
        log.aiError('Rate Limit Exceeded', rateLimitError as Error);
        throw rateLimitError;
    }

    const modelToUse = overrideModel || settings.defaultModel || DEFAULT_OPENROUTER_MODEL;
    const apiUrl = `${settings.openRouterEndpoint}/chat/completions`;
    const requestBody = {
        model: modelToUse,
        messages: [
            {
                role: "system",
                content: "You are a helpful AI assistant for WrittenUpAi, a professional writing application. Provide accurate, helpful, and well-structured responses. ALWAYS follow word count and length requirements precisely when specified."
            },
            {
                role: "user",
                content: prompt
            }
        ],
        response_format: jsonMode ? { type: "json_object" } : undefined,
        temperature: settings.temperature || 0.7,
        max_tokens: settings.maxTokens || 4000,
        stream: false
    };

    if (envConfig.enableDebugLogging) {
        log.aiRequest('OpenRouter API Call', requestBody.model);
        log.debug('OpenRouter request details', {
            endpoint: apiUrl,
            model: requestBody.model,
            promptLength: prompt.length,
            jsonMode,
            temperature: requestBody.temperature,
            maxTokens: requestBody.max_tokens
        });
    }

    let response: Response;
    try {
        response = await fetch(apiUrl, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${settings.openRouterApiKey}`,
                "Content-Type": "application/json",
                "HTTP-Referer": import.meta.env.VITE_APP_NAME || "BookCraft AI",
                "X-Title": import.meta.env.VITE_APP_NAME || "BookCraft AI",
                "User-Agent": `${import.meta.env.VITE_APP_NAME || "BookCraft AI"}/${import.meta.env.VITE_APP_VERSION || "1.0.0"}`
            },
            body: JSON.stringify(requestBody)
        });
    } catch (networkError) {
        const errorMsg = `Network error connecting to OpenRouter: ${networkError.message}`;
        log.aiError('Network Error', new Error(errorMsg));
        throw new Error(errorMsg);
    }

    if (!response.ok) {
        let errorData: any = {};
        try {
            errorData = await response.json();
        } catch {
            errorData = { message: await response.text() };
        }

        const errorMsg = `OpenRouter API error (${response.status}): ${errorData.error?.message || errorData.message || response.statusText}`;
        
        if (envConfig.enableDebugLogging) {
            log.error('OpenRouter API Error', {
                status: response.status,
                statusText: response.statusText,
                error: errorData,
                model: requestBody.model
            });
        }
        
        // Handle specific error types
        if (response.status === 401) {
            throw new Error("Invalid OpenRouter API key. Please check your configuration.");
        } else if (response.status === 429) {
            throw new Error("OpenRouter rate limit exceeded. Please try again later.");
        } else if (response.status >= 500) {
            throw new Error("OpenRouter service is temporarily unavailable. Please try again later.");
        }
        
        log.aiError('OpenRouter API Error', new Error(errorMsg));
        throw new Error(errorMsg);
    }

    let data: any;
    try {
        data = await response.json();
    } catch (parseError) {
        const errorMsg = "Failed to parse OpenRouter API response";
        log.aiError('Parse Error', parseError as Error);
        throw new Error(errorMsg);
    }

    if (!data.choices || data.choices.length === 0) {
        throw new Error("No response generated from OpenRouter API");
    }

    const content = data.choices[0].message?.content;
    if (!content) {
        throw new Error("Empty response from OpenRouter API");
    }

    if (envConfig.enableDebugLogging) {
        log.aiResponse('OpenRouter Success', true);
        log.debug('OpenRouter response details', {
            model: data.model,
            usage: data.usage,
            responseLength: content.length
        });
    }

    return content;
};

/**
 * Generates a list of chapter titles based on a user prompt.
 */
export const planChapters = async (prompt: string): Promise<string[]> => {
    const fullPrompt = `Based on the following request, generate a list of concise, compelling chapter titles. Return ONLY a valid JSON object with this exact format: {"chapters": ["Chapter Title 1", "Chapter Title 2", ...]}. Request: "${prompt}"`;

    try {
        const response = await callOpenRouter(fullPrompt, true);
        const json = JSON.parse(response);
        return json.chapters || [];
    } catch (error) {
        log.aiError('Chapter planning failed', error as Error);
        throw new Error("Failed to generate chapter plan from AI.");
    }
};

/**
 * Regenerates a single chapter title based on the original prompt.
 */
export const regenerateChapterTitle = async (originalPrompt: string, titleToReplace: string): Promise<string> => {
    const prompt = `Based on the user's original request for a book outline ("${originalPrompt}"), generate a new, single chapter title to replace the existing one: "${titleToReplace}". The new title should be different but fit the same thematic purpose. Return ONLY the new title as a single string.`;

    try {
        const response = await callOpenRouter(prompt);
        return response.trim();
    } catch (error) {
        log.aiError('Chapter title regeneration failed', error as Error);
        throw new Error("Failed to regenerate chapter title from AI.");
    }
};

/**
 * Analyzes the entire manuscript to find opportunities for visuals.
 */
export const analyzeForVisuals = async (manuscript: string): Promise<Omit<VisualRecommendation, 'id'>[]> => {
    const prompt = `
        Analyze the following manuscript and identify up to 5 key opportunities where a visual diagram would significantly enhance reader comprehension.
        For each opportunity, provide:
        1. A suitable visual type from this list: [${Object.values(VisualType).join(', ')}].
        2. A brief reasoning (under 20 words) for why the visual is needed.
        3. The specific snippet of text (context) that justifies the recommendation.
        4. An estimated page number, assuming 250 words per page.

        Return ONLY a valid JSON object with this exact format:
        {"recommendations": [{"type": "flowchart", "reasoning": "...", "context": "...", "pageNumber": 1}]}

        Manuscript:
        ---
        ${manuscript.substring(0, 10000)}
        ---
    `;

    try {
        const response = await callOpenRouter(prompt, true);
        const json = JSON.parse(response);
        return [...(json.recommendations || [])];
    } catch (error) {
        log.aiError('Manuscript visual analysis failed', error as Error);
        throw new Error("Failed to analyze manuscript for visuals.");
    }
};

/**
 * Analyzes a single chapter to find opportunities for visuals.
 */
export const analyzeChapterForVisuals = async (chapterContent: string, chapterTitle: string): Promise<Omit<VisualRecommendation, 'id'>[]> => {
    const prompt = `
        Analyze the following chapter content titled "${chapterTitle}". Identify up to 3 key opportunities where a visual diagram would significantly enhance reader comprehension.
        For each opportunity, provide:
        1. A suitable visual type from this list: [${Object.values(VisualType).join(', ')}].
        2. A brief reasoning (under 20 words) for why the visual is needed.
        3. The specific snippet of text (context) that justifies the recommendation.
        4. An estimated page number, which should be 1 for a single chapter analysis.

        Return ONLY a valid JSON object with this exact format:
        {"recommendations": [{"type": "mindmap", "reasoning": "...", "context": "...", "pageNumber": 1}]}

        Chapter Content:
        ---
        ${chapterContent.substring(0, 10000)}
        ---
    `;

    try {
        const response = await callOpenRouter(prompt, true);
        const json = JSON.parse(response);
        return [...(json.recommendations || [])];
    } catch (error) {
        log.aiError('Chapter visual analysis failed', error as Error);
        throw new Error("Failed to analyze chapter for visuals.");
    }
};

/**
 * Sanitizes and validates Mermaid.js code
 */
const sanitizeMermaidCode = (code: string): string => {
    // Remove markdown fences
    let cleaned = code.replace(/```mermaid\n|```/g, "").trim();
    
    // Remove any leading/trailing quotes that might have been added
    cleaned = cleaned.replace(/^["']|["']$/g, '');
    
    // Ensure proper line breaks and remove excessive whitespace
    cleaned = cleaned.replace(/\r\n/g, '\n');
    cleaned = cleaned.split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0)
        .join('\n');
    
    // Fix common syntax issues
    // 1. Ensure arrows have proper spacing
    cleaned = cleaned.replace(/-->/g, ' --> ');
    cleaned = cleaned.replace(/--->/g, ' ---> ');
    cleaned = cleaned.replace(/\|/g, ' | ');
    
    // 2. Clean up excessive spaces
    cleaned = cleaned.replace(/\s+/g, ' ');
    cleaned = cleaned.split('\n').map(line => line.trim()).join('\n');
    
    // 3. Ensure node IDs don't have spaces (common error)
    // This is a basic fix for common cases
    cleaned = cleaned.replace(/([A-Z]+\d+)\s+([A-Z]+\d+)/g, '$1_$2');
    
    return cleaned;
};

/**
 * Validates basic Mermaid.js syntax
 */
const validateMermaidSyntax = (code: string): { valid: boolean; error?: string } => {
    const lines = code.split('\n');
    
    // Check if first line declares diagram type
    const validTypes = ['graph', 'flowchart', 'sequenceDiagram', 'classDiagram', 'stateDiagram', 
                        'erDiagram', 'journey', 'gantt', 'pie', 'mindmap', 'timeline'];
    
    const firstLine = lines[0].toLowerCase();
    const hasValidType = validTypes.some(type => firstLine.startsWith(type));
    
    if (!hasValidType) {
        return { 
            valid: false, 
            error: `Missing or invalid diagram type. First line should start with one of: ${validTypes.join(', ')}` 
        };
    }
    
    // Basic syntax checks
    if (code.length < 10) {
        return { valid: false, error: 'Mermaid code too short to be valid' };
    }
    
    // Check for balanced brackets/quotes (basic check)
    const openBrackets = (code.match(/\[/g) || []).length;
    const closeBrackets = (code.match(/\]/g) || []).length;
    const openParens = (code.match(/\(/g) || []).length;
    const closeParens = (code.match(/\)/g) || []).length;
    
    if (Math.abs(openBrackets - closeBrackets) > 2 || Math.abs(openParens - closeParens) > 2) {
        return { valid: false, error: 'Unbalanced brackets or parentheses in Mermaid code' };
    }
    
    return { valid: true };
};

/**
 * Generates a fallback simple Mermaid diagram when generation fails
 */
const generateFallbackMermaid = (type: VisualType, context: string): string => {
    const safeContext = context.substring(0, 50).replace(/[\[\]"']/g, '');
    
    switch (type) {
        case VisualType.Flowchart:
            return `flowchart TD
    A[Start] --> B[${safeContext}]
    B --> C[End]`;
        
        case VisualType.MindMap:
            return `mindmap
  root((${safeContext}))
    Topic 1
    Topic 2
    Topic 3`;
        
        case VisualType.Timeline:
            return `timeline
    title ${safeContext}
    Step 1
    Step 2
    Step 3`;
        
        case VisualType.Pie:
            return `pie title ${safeContext}
    "Section A" : 30
    "Section B" : 40
    "Section C" : 30`;
        
        case VisualType.Gantt:
            return `gantt
    title ${safeContext}
    dateFormat YYYY-MM-DD
    section Section
    Task 1 :a1, 2024-01-01, 30d
    Task 2 :after a1, 20d`;
        
        default:
            return `graph TD
    A[${safeContext}] --> B[Details]
    B --> C[More Info]`;
    }
};

/**
 * Generates Mermaid.js code for a specific visual recommendation.
 */
export const generateVisual = async (rec: VisualRecommendation): Promise<string> => {
    // Enhanced prompt with specific Mermaid syntax guidance
    const typeGuidance = {
        [VisualType.Flowchart]: 'Use "flowchart TD" or "flowchart LR" syntax. Nodes should be in format: A[Label] --> B[Label]',
        [VisualType.MindMap]: 'Use "mindmap" syntax with proper indentation. Root node: root((Label))',
        [VisualType.Timeline]: 'Use "timeline" syntax with title and chronological events',
        [VisualType.Pie]: 'Use "pie" syntax with title and sections with percentages',
        [VisualType.Gantt]: 'Use "gantt" syntax with dateFormat, sections, and tasks',
        [VisualType.Diagram]: 'Use "graph TD" syntax for top-down or "graph LR" for left-right flow'
    };
    
    const guidance = typeGuidance[rec.type] || 'Use appropriate Mermaid syntax';
    
    const prompt = `
        Generate valid Mermaid.js code for a "${rec.type}" diagram.
        
        Context to visualize: "${rec.context.substring(0, 300)}"
        Purpose: ${rec.reasoning}
        
        IMPORTANT SYNTAX RULES:
        - ${guidance}
        - Start with the diagram type declaration (e.g., "flowchart TD", "mindmap", "timeline")
        - Keep node labels short and clear (under 30 characters)
        - Use simple ASCII characters only, avoid special symbols
        - Ensure all brackets and parentheses are balanced
        - Test that your syntax is valid Mermaid.js v10+ compatible
        
        Return ONLY the raw Mermaid.js code. Do NOT include:
        - Markdown fences (\`\`\`mermaid)
        - Explanations or comments
        - Any text before or after the diagram code
        
        Example format:
        flowchart TD
            A[Start] --> B[Process]
            B --> C[End]
    `;

    try {
        const response = await callOpenRouter(prompt);
        let mermaidCode = sanitizeMermaidCode(response);
        
        // Validate the generated code
        const validation = validateMermaidSyntax(mermaidCode);
        
        if (!validation.valid) {
            log.warn('Generated Mermaid code failed validation', { 
                error: validation.error,
                type: rec.type,
                codePreview: mermaidCode.substring(0, 100)
            });
            
            // Try to use fallback
            log.info('Using fallback Mermaid diagram', { type: rec.type });
            mermaidCode = generateFallbackMermaid(rec.type, rec.context);
        }
        
        return mermaidCode;
    } catch (error) {
        log.aiError('Visual generation failed, using fallback', error as Error);
        // Return a fallback diagram instead of throwing
        return generateFallbackMermaid(rec.type, rec.context);
    }
};

/**
 * Generates an image based on a text prompt using Google Gemini Imagen API.
 * Falls back to placeholder generation if Gemini API is not configured.
 */
export const generateImage = async (prompt: string): Promise<string> => {
    const settings = await getAISettings();
    const envConfig = getEnvironmentConfig();
    
    try {
        // Primary: Try Gemini Imagen if API key is available
        if (settings.geminiApiKey) {
            log.info('Attempting Gemini Imagen generation', { prompt: prompt.substring(0, 50) });
            try {
                return await generateImageWithGemini(prompt, settings.geminiApiKey);
            } catch (error) {
                log.error('Gemini image generation failed', error as Error);
                // Continue to fallbacks
            }
        }
        
        // Secondary: Check for alternative image generation APIs from environment
        const dalleApiKey = process.env.DALLE_API_KEY;
        const stabilityApiKey = process.env.STABILITY_API_KEY;
        
        // Try DALL-E if available
        if (dalleApiKey) {
            log.info('Attempting DALL-E image generation', { prompt: prompt.substring(0, 50) });
            try {
                return await generateImageWithDallE(prompt, dalleApiKey);
            } catch (error) {
                log.error('DALL-E image generation failed', error as Error);
            }
        }
        
        // Try Stability AI if available
        if (stabilityApiKey) {
            log.info('Attempting Stability AI image generation', { prompt: prompt.substring(0, 50) });
            try {
                return await generateImageWithStability(prompt, stabilityApiKey);
            } catch (error) {
                log.error('Stability AI image generation failed', error as Error);
            }
        }
        
        // Fallback: Generate a placeholder image with text overlay
        log.info('No image generation API configured, using placeholder', { prompt: prompt.substring(0, 50) });
        return generatePlaceholderImage(prompt);
        
    } catch (error) {
        log.aiError('All image generation methods failed', error as Error);
        // Always fall back to placeholder generation
        return generatePlaceholderImage(prompt);
    }
};

/**
 * Generates an image using Google Gemini Imagen API via Vertex AI
 * Note: As of 2024, Gemini's text-to-image is available through Vertex AI Imagen
 * This implementation uses the Google AI Studio API format
 */
const generateImageWithGemini = async (prompt: string, apiKey: string): Promise<string> => {
    log.info('Attempting Gemini-based image generation', { promptLength: prompt.length });
    
    try {
        // Try using Vertex AI Imagen API format
        // Model: imagen-3.0-generate-001 or imagen-3.0-fast-generate-001
        const apiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-001:generateImages';
        
        const response = await fetch(`${apiUrl}?key=${apiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                prompt: prompt,
                number_of_images: 1,
                aspect_ratio: '1:1',
                safety_filter_level: 'block_some',
                person_generation: 'allow_adult',
                include_safety_attributes: false
            })
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            let errorDetails;
            try {
                errorDetails = JSON.parse(errorText);
            } catch {
                errorDetails = errorText;
            }
            
            log.error('Gemini Imagen API error', { 
                status: response.status, 
                statusText: response.statusText,
                error: errorDetails 
            });
            
            // Check if it's a "not available" error
            if (response.status === 404 || response.status === 400) {
                throw new Error('Gemini Imagen API is not available or not enabled for this API key. Please enable Vertex AI Imagen in your Google Cloud project.');
            }
            
            throw new Error(`Gemini Imagen API error (${response.status}): ${JSON.stringify(errorDetails)}`);
        }
        
        const data = await response.json();
        
        log.debug('Gemini Imagen response structure', { 
            hasGeneratedImages: !!data.generated_images,
            responseKeys: Object.keys(data)
        });
        
        // Parse response - Gemini Imagen returns base64 images
        if (data.generated_images && data.generated_images.length > 0) {
            const imageData = data.generated_images[0];
            
            // Check various possible field names for the base64 image
            if (imageData.image_base64) {
                log.info('Gemini Imagen generation successful via image_base64');
                return imageData.image_base64;
            } else if (imageData.bytesBase64Encoded) {
                log.info('Gemini Imagen generation successful via bytesBase64Encoded');
                return imageData.bytesBase64Encoded;
            } else if (imageData.image) {
                log.info('Gemini Imagen generation successful via image');
                return imageData.image;
            } else if (typeof imageData === 'string') {
                log.info('Gemini Imagen generation successful (string response)');
                return imageData;
            } else {
                log.error('Unexpected image data structure', { imageData: JSON.stringify(imageData).substring(0, 200) });
                throw new Error('Gemini Imagen returned unexpected image data structure');
            }
        }
        
        // Also check for alternative response formats
        if (data.predictions && data.predictions.length > 0) {
            const prediction = data.predictions[0];
            if (prediction.bytesBase64Encoded) {
                log.info('Gemini Imagen generation successful via predictions');
                return prediction.bytesBase64Encoded;
            }
        }
        
        log.error('Gemini Imagen response missing image data', { 
            responseKeys: Object.keys(data),
            response: JSON.stringify(data).substring(0, 500)
        });
        throw new Error('Gemini Imagen response did not contain expected image data');
        
    } catch (error) {
        log.error('Gemini Imagen generation failed', {
            error: error instanceof Error ? error.message : String(error),
            promptPreview: prompt.substring(0, 50)
        });
        throw error;
    }
};

/**
 * Generates an image using DALL-E API (OpenAI)
 */
const generateImageWithDallE = async (prompt: string, apiKey: string): Promise<string> => {
    const response = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            prompt: prompt,
            n: 1,
            size: '1024x1024',
            response_format: 'b64_json'
        })
    });
    
    if (!response.ok) {
        throw new Error(`DALL-E API error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data[0].b64_json;
};

/**
 * Generates an image using Stability AI
 */
const generateImageWithStability = async (prompt: string, apiKey: string): Promise<string> => {
    const response = await fetch('https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            text_prompts: [{ text: prompt }],
            cfg_scale: 7,
            height: 1024,
            width: 1024,
            samples: 1,
            steps: 30
        })
    });
    
    if (!response.ok) {
        throw new Error(`Stability AI error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.artifacts[0].base64;
};

/**
 * Attempts to generate an image using OpenRouter
 * Note: Most text models don't support image generation, so this may fail
 */
const generateImageWithOpenRouter = async (prompt: string, apiKey: string): Promise<string> => {
    // This is a placeholder - OpenRouter doesn't currently support image generation
    // but we keep it here for future compatibility
    throw new Error('OpenRouter does not support image generation yet');
};

/**
 * Generates a placeholder image with the prompt text overlaid
 * This ensures the feature always works, even without API keys
 */
const generatePlaceholderImage = (prompt: string): string => {
    // Create a canvas element
    if (typeof document !== 'undefined') {
        const canvas = document.createElement('canvas');
        canvas.width = 1024;
        canvas.height = 1024;
        const ctx = canvas.getContext('2d');
        
        if (ctx) {
            // Create a gradient background
            const gradient = ctx.createLinearGradient(0, 0, 1024, 1024);
            
            // Generate colors based on prompt text hash
            const hash = prompt.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
            const hue1 = hash % 360;
            const hue2 = (hash * 137) % 360;
            
            gradient.addColorStop(0, `hsl(${hue1}, 70%, 50%)`);
            gradient.addColorStop(1, `hsl(${hue2}, 70%, 40%)`);
            
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, 1024, 1024);
            
            // Add some geometric shapes for visual interest
            ctx.globalAlpha = 0.3;
            ctx.fillStyle = 'white';
            
            // Draw circles
            for (let i = 0; i < 5; i++) {
                const x = (hash * (i + 1) * 17) % 1024;
                const y = (hash * (i + 1) * 23) % 1024;
                const radius = 50 + ((hash * (i + 1)) % 150);
                
                ctx.beginPath();
                ctx.arc(x, y, radius, 0, 2 * Math.PI);
                ctx.fill();
            }
            
            // Add text overlay
            ctx.globalAlpha = 1;
            ctx.fillStyle = 'white';
            ctx.strokeStyle = 'rgba(0,0,0,0.5)';
            ctx.lineWidth = 4;
            ctx.font = 'bold 36px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            
            // Add a semi-transparent background for the text
            ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
            ctx.fillRect(0, 400, 1024, 224);
            
            // Draw the prompt text (wrapped)
            ctx.fillStyle = 'white';
            const words = prompt.split(' ');
            let line = '';
            let y = 480;
            const maxWidth = 900;
            
            for (let i = 0; i < words.length; i++) {
                const testLine = line + words[i] + ' ';
                const metrics = ctx.measureText(testLine);
                
                if (metrics.width > maxWidth && i > 0) {
                    ctx.strokeText(line, 512, y);
                    ctx.fillText(line, 512, y);
                    line = words[i] + ' ';
                    y += 44;
                } else {
                    line = testLine;
                }
            }
            ctx.strokeText(line, 512, y);
            ctx.fillText(line, 512, y);
            
            // Add watermark
            ctx.font = '16px sans-serif';
            ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
            ctx.fillText('Generated by BookCraft AI - Placeholder Image', 512, 980);
            ctx.fillText('Configure DALL-E or Stability AI API keys for real image generation', 512, 1000);
            
            // Convert to base64
            return canvas.toDataURL('image/png').split(',')[1];
        }
    }
    
    // Fallback for non-browser environments: return a minimal SVG as base64
    const svg = `<svg width="1024" height="1024" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style="stop-color:rgb(102,126,234);stop-opacity:1" />
                <stop offset="100%" style="stop-color:rgb(118,75,162);stop-opacity:1" />
            </linearGradient>
        </defs>
        <rect width="1024" height="1024" fill="url(#grad)"/>
        <rect x="62" y="400" width="900" height="224" fill="rgba(0,0,0,0.6)"/>
        <text x="512" y="512" text-anchor="middle" fill="white" font-family="sans-serif" font-size="36" font-weight="bold">
            ${prompt.substring(0, 50)}${prompt.length > 50 ? '...' : ''}
        </text>
        <text x="512" y="980" text-anchor="middle" fill="rgba(255,255,255,0.6)" font-family="sans-serif" font-size="16">
            Generated by BookCraft AI - Placeholder Image
        </text>
        <text x="512" y="1000" text-anchor="middle" fill="rgba(255,255,255,0.6)" font-family="sans-serif" font-size="16">
            Configure DALL-E or Stability AI API keys for real image generation
        </text>
    </svg>`;
    
    // Convert SVG to base64
    return btoa(unescape(encodeURIComponent(svg)));
};

/**
 * Generates content for a chapter based on its title, a prompt, and project context.
 */
export const generateChapterContent = async (project: Project, chapter: Chapter, prompt: string, wordCount?: string, style?: string, useInternetSearch?: boolean): Promise<string> => {
    let fullPrompt = `
        The user is writing a chapter titled "${chapter.title}" for their book, "${project.title}" (Genre: ${project.genre}).
        The user's instructions for the new content are: "${prompt}".

        ${wordCount ? `The target word count is approximately ${wordCount} words.` : ''}
        ${style ? `Additional style guidance: "${style}"` : ''}
        ${useInternetSearch ? '\n\nIMPORTANT: This request should use internet search for current information and facts. Include relevant, up-to-date details.' : ''}

        Return ONLY the generated text for the chapter. Do not include conversational wrappers or headings.
    `;

    try {
        const response = await callOpenRouter(fullPrompt);
        return response;
    } catch (error) {
        log.aiError('Chapter content generation failed', error as Error);
        throw new Error("Failed to generate chapter content from AI.");
    }
};

/**
 * Gets a response from the AI assistant in the context of a chapter.
 */
export const getAIAssistantResponse = async (chapter: Chapter, prompt: string): Promise<string> => {
    const fullPrompt = `
        You are a helpful writing assistant.
        The user is working on a chapter titled "${chapter.title}".
        The user's request is: "${prompt}"

        Provide a helpful response. Do not add conversational filler.
    `;

    try {
        const response = await callOpenRouter(fullPrompt);
        return response;
    } catch (error) {
        log.aiError('AI assistant response failed', error as Error);
        throw new Error("Failed to get response from AI assistant.");
    }
};

/**
 * Gets a response from the AI assistant for a specific text selection.
 */
export const getAIContextMenuResponse = async (text: string, action: string): Promise<string> => {
    const prompt = `
        A user has selected the following text:
        ---
        ${text}
        ---
        Perform this action on the text: ${action}.
        Return ONLY the modified text.
    `;

    try {
        const response = await callOpenRouter(prompt);
        return response;
    } catch (error) {
        log.aiError('AI context menu response failed', error as Error);
        throw new Error(`Failed to ${action} text.`);
    }
};

/**
 * Combines original and new content into a cohesive narrative.
 */
export const combineChapterContent = async (originalContent: string, newContent: string): Promise<string> => {
    const prompt = `
        Merge the "Newly Generated Text" into the "Original Text" to create a single, cohesive narrative.
        You may need to rewrite transitions, remove redundant sentences, or restructure paragraphs to make them fit together naturally.

        Original Text:
        ---
        ${originalContent}
        ---

        Newly Generated Text:
        ---
        ${newContent}
        ---

        Return ONLY the final, merged text.
    `;

    try {
        const response = await callOpenRouter(prompt);
        return response;
    } catch (error) {
        log.aiError('Chapter content combination failed', error as Error);
        throw new Error("Failed to combine content with AI.");
    }
};

/**
 * Generates a structural outline for a given chapter's content.
 */
export const generateChapterStructure = async (chapterContent: string): Promise<{ point: string; details: string }[]> => {
    // Strip HTML tags and clean up content for analysis
    const cleanContent = chapterContent
        .replace(/<[^>]*>/g, ' ')  // Remove HTML tags
        .replace(/\s+/g, ' ')       // Normalize whitespace
        .trim();
    
    // Check if content is too short for meaningful analysis
    if (cleanContent.length < 100) {
        log.warn('Chapter content too short for structure analysis', { length: cleanContent.length });
        return [];
    }
    
    const prompt = `
        You are a professional editor analyzing a chapter's narrative structure.
        
        Analyze the following chapter content and generate a detailed structural outline.
        Identify 4-8 key structural elements such as:
        - Opening/Hook
        - Character introductions or developments
        - Major plot developments
        - Conflicts or tensions
        - Scene transitions
        - Climactic moments
        - Resolution or cliffhangers
        - Closing/Transition to next chapter
        
        For each structural element, provide:
        1. A concise point name (3-8 words)
        2. A detailed summary (1-2 sentences) explaining what happens and its significance

        Chapter Content (${cleanContent.split(/\s+/).length} words):
        ---
        ${cleanContent.substring(0, 5000)}${cleanContent.length > 5000 ? '... [truncated]' : ''}
        ---

        Return ONLY a valid JSON object with this exact format (no markdown, no explanations):
        {"structure": [{"point": "Opening Hook", "details": "The chapter begins with..."}, {"point": "Character Development", "details": "We see the protagonist..."}]}
        
        Provide at least 4 structural points, but no more than 8.
    `;

    try {
        log.debug('Generating chapter structure', { contentLength: cleanContent.length });
        const response = await callOpenRouter(prompt, true);
        
        // Enhanced JSON parsing with validation
        let json;
        try {
            json = JSON.parse(response);
        } catch (parseError) {
            log.error('Failed to parse chapter structure JSON', { 
                response: response.substring(0, 200),
                error: parseError 
            });
            throw new Error('Invalid JSON response from AI service');
        }
        
        // Validate structure
        if (!json.structure || !Array.isArray(json.structure)) {
            log.error('Invalid structure format', { json });
            throw new Error('AI response missing structure array');
        }
        
        // Validate each item has required fields
        const validStructure = json.structure.filter((item: any) => 
            item.point && item.details && 
            typeof item.point === 'string' && 
            typeof item.details === 'string'
        );
        
        if (validStructure.length === 0) {
            log.warn('No valid structure items found', { rawStructure: json.structure });
            return [];
        }
        
        log.info('Chapter structure generated successfully', { 
            itemCount: validStructure.length 
        });
        
        return validStructure;
    } catch (error) {
        log.aiError('Chapter structure generation failed', error as Error);
        throw new Error("Failed to generate chapter structure from AI.");
    }
};

/**
 * Refines a piece of generated text based on a user's prompt.
 */
export const refineGeneratedText = async (originalText: string, refinementPrompt: string): Promise<string> => {
    const prompt = `
        Original Text:
        ---
        ${originalText}
        ---

        User's Refinement Request: "${refinementPrompt}"

        Rewrite the original text based on the user's request. Return ONLY the newly refined text.
    `;

    try {
        const response = await callOpenRouter(prompt);
        return response;
    } catch (error) {
        log.aiError('Text refinement failed', error as Error);
        throw new Error("Failed to refine text with AI.");
    }
};

/**
 * Cleans up and formats a block of text, adding paragraph structure.
 */
export const cleanupAndFormatText = async (text: string): Promise<string> => {
    const prompt = `
        Review the following HTML content from a rich-text editor.
        Your task is to:
        1. Correct spelling and grammar errors.
        2. Improve sentence flow and clarity.
        3. Ensure proper paragraph structure using <p> tags and other basic HTML like <h1>, <h2>, etc where appropriate.

        Do not add horizontal rules (<hr>) or any other document-level separators. The output should be a single, continuous block of HTML content for one chapter.

        Original HTML:
        ---
        ${text}
        ---

        Return ONLY the cleaned and corrected HTML content as a single block of text. Do not include markdown fences, explanations, or any conversational text.
    `;

    try {
        const response = await callOpenRouter(prompt);
        return response;
    } catch (error) {
        log.aiError('Text cleanup and formatting failed', error as Error);
        throw new Error("Failed to clean and format text with AI.");
    }
};

/**
 * Grammar check interface
 */
export interface GrammarError {
    id: string;
    type: 'grammar' | 'spelling' | 'punctuation' | 'style' | 'clarity';
    originalText: string;
    suggestion: string;
    explanation: string;
    startOffset: number;
    endOffset: number;
    severity: 'error' | 'warning' | 'suggestion';
}

/**
 * Performs comprehensive grammar, spelling, punctuation, and style checking on text.
 * Uses AI to detect and suggest corrections for various writing issues.
 */
export const checkGrammar = async (text: string): Promise<GrammarError[]> => {
    // Limit text length to avoid excessive API costs
    const maxLength = 3000;
    const analyzedText = text.length > maxLength ? text.substring(0, maxLength) : text;
    
    const prompt = `
        You are an expert copy editor and proofreader. Analyze the following text for grammar, spelling, punctuation, style, and clarity issues.
        
        TEXT TO ANALYZE:
        ---
        ${analyzedText}
        ---
        
        For EACH issue you find, provide:
        1. "type": The category - one of: grammar, spelling, punctuation, style, clarity
        2. "originalText": The exact text that has the issue (keep it short, 1-10 words)
        3. "suggestion": The corrected version
        4. "explanation": Brief explanation of why this is an issue (1 sentence)
        5. "severity": How serious - one of: error, warning, suggestion
        
        IMPORTANT RULES:
        - Focus on the most important issues (max 15 issues)
        - "originalText" should be SHORT - just the phrase with the problem
        - Be specific and actionable
        - Prioritize errors > warnings > suggestions
        - For clarity issues, suggest better phrasing
        - For style issues, suggest improvements for readability
        
        Return ONLY a valid JSON object with this exact format (no markdown, no explanations):
        {
            "errors": [
                {
                    "type": "grammar",
                    "originalText": "he don't",
                    "suggestion": "he doesn't",
                    "explanation": "Subject-verb agreement: singular subject requires 'doesn't'",
                    "severity": "error"
                },
                {
                    "type": "clarity",
                    "originalText": "very good",
                    "suggestion": "excellent",
                    "explanation": "More precise word choice improves clarity",
                    "severity": "suggestion"
                }
            ]
        }
        
        If no issues are found, return: {"errors": []}
    `;

    try {
        log.debug('Starting grammar check', { textLength: analyzedText.length });
        const response = await callOpenRouter(prompt, true);
        
        let json;
        try {
            json = JSON.parse(response);
        } catch (parseError) {
            log.error('Failed to parse grammar check JSON', { 
                response: response.substring(0, 200),
                error: parseError 
            });
            throw new Error('Invalid JSON response from AI service');
        }
        
        // Validate and process errors
        if (!json.errors || !Array.isArray(json.errors)) {
            log.warn('Invalid grammar check response format', { json });
            return [];
        }
        
        // Map to GrammarError format with IDs and offsets
        const grammarErrors: GrammarError[] = json.errors
            .filter((e: any) => 
                e.type && e.originalText && e.suggestion && e.explanation && e.severity
            )
            .map((e: any, index: number) => {
                // Try to find the text position in the original
                const startOffset = text.indexOf(e.originalText);
                const endOffset = startOffset >= 0 ? startOffset + e.originalText.length : 0;
                
                return {
                    id: `grammar_${Date.now()}_${index}`,
                    type: e.type,
                    originalText: e.originalText,
                    suggestion: e.suggestion,
                    explanation: e.explanation,
                    startOffset: startOffset >= 0 ? startOffset : 0,
                    endOffset: endOffset,
                    severity: e.severity
                } as GrammarError;
            });
        
        log.info('Grammar check completed', { 
            errorsFound: grammarErrors.length,
            byType: {
                grammar: grammarErrors.filter(e => e.type === 'grammar').length,
                spelling: grammarErrors.filter(e => e.type === 'spelling').length,
                punctuation: grammarErrors.filter(e => e.type === 'punctuation').length,
                style: grammarErrors.filter(e => e.type === 'style').length,
                clarity: grammarErrors.filter(e => e.type === 'clarity').length,
            }
        });
        
        return grammarErrors;
    } catch (error) {
        log.aiError('Grammar check failed', error as Error);
        throw new Error("Failed to check grammar with AI.");
    }
};

/**
 * Analyzes text and suggests a visual (image or diagram).
 */
export const generateVisualSuggestion = async (text: string): Promise<{ type: 'image' | 'diagram'; prompt: string; reasoning: string; diagramType?: VisualType }> => {
    const prompt = `
        Analyze the following text. Decide if it's better suited for a photographic IMAGE or a structured DIAGRAM (like a flowchart, mindmap, etc.).
        Based on your decision, provide:
        1. "type": either "image" or "diagram".
        2. "prompt": a detailed, descriptive prompt for an AI to generate the visual. For an image, this should be a vivid description. For a diagram, it should be a clear instruction of what to illustrate.
        3. "reasoning": a brief explanation for your choice.
        4. "diagramType": if the type is "diagram", specify which kind from this list: [${Object.values(VisualType).join(', ')}].

        Text: "${text}"

        Return ONLY a valid JSON object with this exact format:
        {"type": "image", "prompt": "...", "reasoning": "...", "diagramType": "flowchart"}
    `;

    try {
        const response = await callOpenRouter(prompt, true);
        return JSON.parse(response);
    } catch (error) {
        log.aiError('Visual suggestion generation failed', error as Error);
        throw new Error("Failed to suggest visual from AI.");
    }
};

/**
 * Generates a list of plot points for a fiction book.
 */
export const generatePlotPoints = async (prompt: string): Promise<Omit<PlotPoint, 'id' | 'order'>[]> => {
    const fullPrompt = `
        You are an expert story structure consultant. Based on the user's idea, generate a list of key plot points for a compelling narrative.
        Use a standard story structure (like the three-act structure) to outline the plot.
        For each point, provide a concise "title" and a one or two-sentence "description".

        User's Idea: "${prompt}"

        Return ONLY a valid JSON object with this exact format:
        {"plotPoints": [{"title": "The Inciting Incident", "description": "The event that sets the story in motion..."}]}
    `;

    try {
        const response = await callOpenRouter(fullPrompt, true);
        const json = JSON.parse(response);
        return json.plotPoints || [];
    } catch (error) {
        log.aiError('Plot points generation failed', error as Error);
        throw new Error("Failed to generate plot points from AI.");
    }
};

/**
 * Performs comprehensive research on a topic
 */
export const performResearch = async (query: string, type: ResearchType, context: {genre: string, chapterId?: string, projectPhase: string}): Promise<{
    content: string;
    summary: string;
    confidence: ResearchConfidence;
    sources: ResearchSource[];
    tags?: string[];
}> => {
    const genreContext = context.genre === 'Fiction' || context.genre === 'Sci-Fi' || context.genre === 'Fantasy' ? 'fiction' : 'non-fiction';

    const prompt = `
        You are a research assistant for a ${genreContext} writer working on a ${context.genre} book.
        The user needs ${type.toLowerCase()} about: "${query}"

        Please provide:
        1. Comprehensive research content relevant to the query
        2. A brief summary (2-3 sentences)
        3. Confidence level for the information (High/Medium/Low)
        4. Key sources or types of sources this information comes from
        5. Relevant tags for categorization

        ${genreContext === 'fiction' ?
            'Focus on accuracy for world-building, historical context, and technical details that enhance authenticity.' :
            'Focus on current, verifiable information with statistical data and expert opinions where relevant.'
        }

        Return ONLY a valid JSON object with this format:
        {
            "content": "Detailed research content...",
            "summary": "Brief summary...",
            "confidence": "High|Medium|Low",
            "sources": [
                {
                    "title": "Source title",
                    "type": "Academic|News|Government|Expert|Historical",
                    "credibility": "Verified|Credible|Questionable"
                }
            ],
            "tags": ["tag1", "tag2", "tag3"]
        }
    `;

    try {
        const response = await callOpenRouter(prompt, true);
        
        // Validate response is not empty
        if (!response || response.trim().length === 0) {
            log.error('Empty response from OpenRouter for research query', { query, type });
            throw new Error("Received empty response from AI service");
        }
        
        let result: any;
        try {
            result = JSON.parse(response);
        } catch (parseError) {
            log.error('Failed to parse research response', { response: response.substring(0, 500), error: parseError });
            throw new Error("AI response was not valid JSON format");
        }
        
        // Validate required fields exist
        if (!result.content || !result.summary || !result.confidence) {
            log.error('Missing required fields in research response', { result });
            throw new Error("AI response missing required fields");
        }

        // Convert response to proper format with fallbacks
        const sources: ResearchSource[] = Array.isArray(result.sources) 
            ? result.sources.map((s: any, index: number) => ({
                id: `source_${Date.now()}_${index}`,
                title: s.title || 'Unknown Source',
                credibility: (s.credibility as SourceCredibility) || 'Questionable',
                accessDate: new Date(),
                notes: s.type || 'General'
            }))
            : [];

        return {
            content: result.content,
            summary: result.summary,
            confidence: result.confidence as ResearchConfidence,
            sources,
            tags: Array.isArray(result.tags) ? result.tags : []
        };
    } catch (error) {
        log.aiError('Research failed', error as Error);
        // Provide more specific error message
        const errorMessage = error instanceof Error ? error.message : "Failed to perform research with AI";
        throw new Error(errorMessage);
    }
};

/**
 * Verifies factual accuracy of text content
 */
export const verifyFacts = async (content: string, context: {projectId: string, chapterId: string}): Promise<FactCheckResult[]> => {
    const prompt = `
        Analyze the following text for factual accuracy. Identify any claims that may need verification:

        "${content}"

        For each factual claim you identify, provide:
        1. The specific claim
        2. Accuracy assessment (Accurate/Questionable/False/Unknown)
        3. Confidence level (High/Medium/Low)
        4. Brief explanation of your assessment
        5. Suggested correction if needed

        Return ONLY a valid JSON object with this format:
        {
            "factChecks": [
                {
                    "claim": "The specific factual claim",
                    "accuracy": "Accurate|Questionable|False|Unknown",
                    "confidence": "High|Medium|Low",
                    "explanation": "Brief explanation...",
                    "suggestedCorrection": "Optional correction if needed"
                }
            ]
        }
    `;

    try {
        const response = await callOpenRouter(prompt, true);
        const result = JSON.parse(response);

        return result.factChecks.map((fc: any, index: number) => ({
            id: `factcheck_${Date.now()}_${index}`,
            originalText: content,
            claim: fc.claim,
            accuracy: fc.accuracy,
            confidence: fc.confidence as ResearchConfidence,
            explanation: fc.explanation,
            suggestedCorrection: fc.suggestedCorrection,
            sources: [],
            chapterId: context.chapterId,
            createdAt: new Date()
        }));
    } catch (error) {
        log.aiError('Fact checking failed', error as Error);
        throw new Error("Failed to verify facts with AI.");
    }
};

/**
 * Suggests research topics based on chapter content
 */
export const suggestResearchTopics = async (chapterContent: string, genre: string): Promise<{query: string, type: ResearchType, reasoning: string}[]> => {
    const prompt = `
        Analyze the following chapter content from a ${genre} book and suggest 3-5 research topics that would enhance the accuracy and depth of the writing.

        Chapter content: "${chapterContent.substring(0, 2000)}"

        For each suggestion, provide:
        1. A specific research query
        2. The type of research from: [${Object.values(ResearchType).join(', ')}]
        3. Brief reasoning for why this research would be valuable

        Return ONLY a valid JSON object with this format:
        {
            "suggestions": [
                {
                    "query": "Specific research question",
                    "type": "Research type",
                    "reasoning": "Why this research is needed"
                }
            ]
        }
    `;

    try {
        const response = await callOpenRouter(prompt, true);
        const result = JSON.parse(response);
        return result.suggestions || [];
    } catch (error) {
        log.aiError('Research topic suggestion failed', error as Error);
        throw new Error("Failed to suggest research topics with AI.");
    }
};

/**
 * Extracts content from a web page URL
 */
const extractWebContent = async (url: string): Promise<{content: string, metadata: any}> => {
    // Validate URL
    try {
        new URL(url);
    } catch (error) {
        throw new Error('Invalid URL format');
    }
    
    // Security check - block potentially harmful URLs
    const blockedDomains = ['localhost', '127.0.0.1', '0.0.0.0', '10.', '192.168.', '172.'];
    const urlObj = new URL(url);
    
    if (blockedDomains.some(domain => urlObj.hostname.includes(domain))) {
        throw new Error('URL not accessible: Private or local network addresses are not allowed');
    }
    
    try {
        // Use fetch with proper headers to scrape content
        log.info('Fetching web content', { url });
        
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
                'Accept-Encoding': 'gzip, deflate, br',
                'DNT': '1',
                'Connection': 'keep-alive',
                'Upgrade-Insecure-Requests': '1'
            },
            // Add timeout to prevent hanging requests
            signal: AbortSignal.timeout(30000) // 30 seconds timeout
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const contentType = response.headers.get('content-type') || '';
        if (!contentType.includes('text/html') && !contentType.includes('application/xml')) {
            throw new Error('Content type not supported. Only HTML and XML content can be analyzed.');
        }
        
        const html = await response.text();
        
        // Parse HTML content
        const parsedContent = parseHTMLContent(html);
        
        return {
            content: parsedContent.text,
            metadata: {
                type: 'webpage',
                url: url,
                contentType: contentType,
                title: parsedContent.title,
                description: parsedContent.description,
                author: parsedContent.author,
                publishDate: parsedContent.publishDate,
                wordCount: parsedContent.text.split(/\s+/).filter(word => word.length > 0).length,
                characterCount: parsedContent.text.length,
                lastAccessed: new Date().toISOString(),
                domain: urlObj.hostname,
                extractedElements: {
                    headings: parsedContent.headings,
                    links: parsedContent.links,
                    images: parsedContent.images
                }
            }
        };
        
    } catch (error) {
        if (error instanceof TypeError && error.message.includes('fetch')) {
            throw new Error('Network error: Unable to access the URL. Please check your internet connection and try again.');
        }
        
        if (error instanceof DOMException && error.name === 'TimeoutError') {
            throw new Error('Request timeout: The webpage took too long to respond. Please try again later.');
        }
        
        log.error('Web content extraction failed', error as Error, 'WebScraping');
        throw new Error(`Failed to extract web content: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
};

/**
 * Parses HTML content and extracts text, metadata, and structure
 */
const parseHTMLContent = (html: string): {
    text: string;
    title: string;
    description: string;
    author: string;
    publishDate: string;
    headings: string[];
    links: string[];
    images: string[];
} => {
    // Create a DOM parser (in a browser environment)
    let doc: Document;
    
    if (typeof DOMParser !== 'undefined') {
        const parser = new DOMParser();
        doc = parser.parseFromString(html, 'text/html');
    } else {
        // Fallback for non-browser environments - basic HTML parsing
        return parseHTMLBasic(html);
    }
    
    // Extract title
    const title = doc.querySelector('title')?.textContent?.trim() || 
                  doc.querySelector('h1')?.textContent?.trim() || 
                  'Untitled';
    
    // Extract meta description
    const description = doc.querySelector('meta[name="description"]')?.getAttribute('content') || 
                       doc.querySelector('meta[property="og:description"]')?.getAttribute('content') || 
                       '';
    
    // Extract author
    const author = doc.querySelector('meta[name="author"]')?.getAttribute('content') || 
                  doc.querySelector('meta[property="article:author"]')?.getAttribute('content') || 
                  doc.querySelector('[rel="author"]')?.textContent?.trim() || 
                  '';
    
    // Extract publish date
    const publishDate = doc.querySelector('meta[property="article:published_time"]')?.getAttribute('content') || 
                       doc.querySelector('meta[name="date"]')?.getAttribute('content') || 
                       doc.querySelector('time[datetime]')?.getAttribute('datetime') || 
                       '';
    
    // Extract headings
    const headings = Array.from(doc.querySelectorAll('h1, h2, h3, h4, h5, h6'))
        .map(h => h.textContent?.trim())
        .filter(h => h && h.length > 0) as string[];
    
    // Extract external links
    const links = Array.from(doc.querySelectorAll('a[href]'))
        .map(a => a.getAttribute('href'))
        .filter(href => href && href.startsWith('http'))
        .slice(0, 10) as string[]; // Limit to first 10 external links
    
    // Extract image sources
    const images = Array.from(doc.querySelectorAll('img[src]'))
        .map(img => img.getAttribute('src'))
        .filter(src => src)
        .slice(0, 5) as string[]; // Limit to first 5 images
    
    // Remove script and style elements
    const scripts = doc.querySelectorAll('script, style, nav, footer, aside, .sidebar, #sidebar, .navigation, .menu');
    scripts.forEach(el => el.remove());
    
    // Extract main content
    let contentElement = doc.querySelector('main, article, .content, .post, .entry, #content');
    if (!contentElement) {
        contentElement = doc.body;
    }
    
    const text = contentElement?.textContent || '';
    
    // Clean up text
    const cleanText = text
        .replace(/\s+/g, ' ') // Normalize whitespace
        .replace(/\n\s*\n/g, '\n') // Remove empty lines
        .trim();
    
    return {
        text: cleanText,
        title,
        description,
        author,
        publishDate,
        headings,
        links,
        images
    };
};

/**
 * Basic HTML parsing for environments without DOMParser
 */
const parseHTMLBasic = (html: string): {
    text: string;
    title: string;
    description: string;
    author: string;
    publishDate: string;
    headings: string[];
    links: string[];
    images: string[];
} => {
    // Extract title
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : 'Untitled';
    
    // Extract meta description
    const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i);
    const description = descMatch ? descMatch[1] : '';
    
    // Extract author
    const authorMatch = html.match(/<meta[^>]*name=["']author["'][^>]*content=["']([^"']+)["']/i);
    const author = authorMatch ? authorMatch[1] : '';
    
    // Extract publish date
    const dateMatch = html.match(/<meta[^>]*property=["']article:published_time["'][^>]*content=["']([^"']+)["']/i);
    const publishDate = dateMatch ? dateMatch[1] : '';
    
    // Extract headings
    const headingMatches = html.match(/<h[1-6][^>]*>([^<]+)<\/h[1-6]>/gi) || [];
    const headings = headingMatches.map(h => h.replace(/<[^>]+>/g, '').trim());
    
    // Extract links
    const linkMatches = html.match(/<a[^>]*href=["'](https?:\/\/[^"']+)["']/gi) || [];
    const links = linkMatches
        .map(link => {
            const match = link.match(/href=["'](https?:\/\/[^"']+)["']/i);
            return match ? match[1] : null;
        })
        .filter(link => link)
        .slice(0, 10) as string[];
    
    // Extract images
    const imgMatches = html.match(/<img[^>]*src=["']([^"']+)["']/gi) || [];
    const images = imgMatches
        .map(img => {
            const match = img.match(/src=["']([^"']+)["']/i);
            return match ? match[1] : null;
        })
        .filter(src => src)
        .slice(0, 5) as string[];
    
    // Remove scripts, styles, and HTML tags
    let text = html
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
        .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
        .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')
        .replace(/<[^>]+>/g, '') // Remove all HTML tags
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/\s+/g, ' ')
        .trim();
    
    return {
        text,
        title,
        description,
        author,
        publishDate,
        headings,
        links,
        images
    };
};

/**
 * Summarizes web content from a URL with real content extraction
 */
export const summarizeWebContent = async (url: string): Promise<ResearchItem> => {
    log.info('Starting web content analysis', { url });
    
    try {
        // Extract actual content from the webpage
        const { content, metadata } = await extractWebContent(url);
        
        if (!content || content.trim().length === 0) {
            throw new Error('No readable content found on the webpage.');
        }
        
        log.info('Web content extracted successfully', { 
            url, 
            contentLength: content.length, 
            title: metadata.title 
        });
        
        // Analyze the extracted content with AI
        const analysisPrompt = `
            Analyze the following web content and provide a comprehensive summary:
            
            URL: ${url}
            Title: ${metadata.title}
            Author: ${metadata.author || 'Not specified'}
            Publish Date: ${metadata.publishDate || 'Not specified'}
            Domain: ${metadata.domain}
            
            Content: "${content.substring(0, 4000)}${content.length > 4000 ? '...' : ''}"
            
            Provide a thorough analysis including:
            1. Comprehensive summary of the main content
            2. Key facts, data points, and insights
            3. Assessment of source credibility and authority
            4. Main themes and topics covered
            5. Research value assessment
            6. Relevant categorization tags
            
            Return ONLY a valid JSON object with this format:
            {
                "summary": "Comprehensive summary of the webpage content...",
                "content": "Detailed analysis including key points, facts, and insights...",
                "confidence": "High|Medium|Low",
                "credibility": "Verified|Credible|Questionable|Unverified",
                "mainTopics": ["topic1", "topic2", "topic3"],
                "keyFacts": ["fact1", "fact2", "fact3"],
                "tags": ["tag1", "tag2", "tag3"],
                "researchValue": "High|Medium|Low",
                "sourceAssessment": "Assessment of the website's authority and reliability",
                "contentType": "news|blog|academic|commercial|government|nonprofit|other"
            }
        `;
        
        const response = await callOpenRouter(analysisPrompt, true);
        const analysisResult = JSON.parse(response);
        
        // Create comprehensive research item
        const researchItem: ResearchItem = {
            id: `research_${Date.now()}`,
            query: `Web content analysis: ${metadata.title || url}`,
            type: ResearchType.TopicalResearch,
            content: `${analysisResult.content}\n\n--- Original Web Content ---\n${content}`,
            summary: analysisResult.summary,
            confidence: analysisResult.confidence as ResearchConfidence,
            sources: [{
                id: `source_${Date.now()}`,
                title: metadata.title,
                url: url,
                author: metadata.author,
                publishDate: metadata.publishDate,
                credibility: analysisResult.credibility as SourceCredibility,
                accessDate: new Date(),
                sourceType: 'Website',
                notes: `${analysisResult.contentType} content - ${analysisResult.sourceAssessment}`,
                metadata: {
                    domain: metadata.domain,
                    contentType: analysisResult.contentType,
                    wordCount: metadata.wordCount,
                    headings: metadata.extractedElements.headings,
                    externalLinks: metadata.extractedElements.links,
                    images: metadata.extractedElements.images
                }
            }],
            tags: [...(analysisResult.tags || []), 'web-content', analysisResult.contentType],
            linkedChapterIds: [],
            createdAt: new Date(),
            lastUpdated: new Date(),
            verified: false,
            isBookmarked: false,
            wordCount: content.split(/\s+/).filter(word => word.length > 0).length,
            qualityScore: analysisResult.researchValue === 'High' ? 85 : 
                         analysisResult.researchValue === 'Medium' ? 65 : 45,
            attachments: [],
            relatedResearchIds: [],
            contradictions: [],
            metadata: {
                originalUrl: url,
                extraction: metadata,
                analysis: {
                    mainTopics: analysisResult.mainTopics,
                    keyFacts: analysisResult.keyFacts,
                    contentType: analysisResult.contentType,
                    researchValue: analysisResult.researchValue,
                    sourceAssessment: analysisResult.sourceAssessment
                }
            }
        };
        
        log.info('Web content analysis completed successfully', { 
            researchItemId: researchItem.id,
            confidence: researchItem.confidence,
            qualityScore: researchItem.qualityScore
        });
        
        return researchItem;
        
    } catch (error) {
        log.error('Web content analysis failed', error as Error, 'WebScraping');
        throw new Error(`Failed to analyze web content: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
};

/**
 * Extracts text content from various document formats
 */
const extractTextFromFile = async (file: File): Promise<{text: string, metadata: any}> => {
    const fileType = file.type.toLowerCase();
    const fileName = file.name.toLowerCase();
    
    // Handle text files directly
    if (fileType.includes('text/') || fileName.endsWith('.txt') || fileName.endsWith('.md')) {
        const text = await readFileAsText(file);
        return {
            text,
            metadata: {
                type: 'text',
                encoding: 'UTF-8',
                wordCount: text.split(/\s+/).filter(word => word.length > 0).length,
                characterCount: text.length,
                lineCount: text.split('\n').length
            }
        };
    }
    
    // Handle PDF files
    if (fileType.includes('pdf') || fileName.endsWith('.pdf')) {
        return await extractTextFromPDF(file);
    }
    
    // Handle Microsoft Word documents
    if (fileType.includes('word') || fileType.includes('msword') || 
        fileName.endsWith('.docx') || fileName.endsWith('.doc')) {
        return await extractTextFromWord(file);
    }
    
    // Handle RTF files
    if (fileType.includes('rtf') || fileName.endsWith('.rtf')) {
        return await extractTextFromRTF(file);
    }
    
    // Handle CSV files
    if (fileType.includes('csv') || fileName.endsWith('.csv')) {
        const text = await readFileAsText(file);
        return {
            text,
            metadata: {
                type: 'csv',
                rowCount: text.split('\n').length - 1,
                hasHeader: true
            }
        };
    }
    
    // Handle JSON files
    if (fileType.includes('json') || fileName.endsWith('.json')) {
        const text = await readFileAsText(file);
        try {
            const jsonData = JSON.parse(text);
            const formattedText = JSON.stringify(jsonData, null, 2);
            return {
                text: formattedText,
                metadata: {
                    type: 'json',
                    isValid: true,
                    objectCount: Array.isArray(jsonData) ? jsonData.length : Object.keys(jsonData).length
                }
            };
        } catch (error) {
            return {
                text,
                metadata: {
                    type: 'json',
                    isValid: false,
                    error: 'Invalid JSON format'
                }
            };
        }
    }
    
    // Default: try to read as text
    try {
        const text = await readFileAsText(file);
        return {
            text,
            metadata: {
                type: 'unknown',
                fallbackToText: true,
                warning: 'File format not specifically supported, extracted as text'
            }
        };
    } catch (error) {
        throw new Error(`Unsupported file format: ${file.type}. Supported formats: PDF, Word (.docx/.doc), Text (.txt/.md), RTF, CSV, JSON`);
    }
};

/**
 * Reads file as text with proper encoding handling
 */
const readFileAsText = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsText(file, 'UTF-8');
    });
};

/**
 * Extracts text from PDF files using PDF.js-like approach
 */
const extractTextFromPDF = async (file: File): Promise<{text: string, metadata: any}> => {
    // Note: In a full implementation, you would use PDF.js or a similar library
    // For now, we'll implement a basic PDF text extraction approach
    
    try {
        const arrayBuffer = await file.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);
        const pdfData = new TextDecoder('latin1').decode(uint8Array);
        
        // Basic PDF text extraction - looks for text between stream markers
        const textRegex = /BT\s+.*?ET/gs;
        const streamMatches = pdfData.match(textRegex) || [];
        
        let extractedText = '';
        for (const match of streamMatches) {
            // Extract text from PDF text objects (simplified approach)
            const textMatches = match.match(/\(([^\)]*)\)\s*Tj/g) || [];
            for (const textMatch of textMatches) {
                const text = textMatch.match(/\(([^\)]*)\)/)?.[1] || '';
                if (text) {
                    extractedText += text + ' ';
                }
            }
        }
        
        // If no text found with basic extraction, try alternative method
        if (!extractedText.trim()) {
            // Look for plain text content in the PDF
            const plainTextRegex = /[A-Za-z0-9\s.,;:!?"'-]{10,}/g;
            const plainTextMatches = pdfData.match(plainTextRegex) || [];
            extractedText = plainTextMatches.join(' ');
        }
        
        if (!extractedText.trim()) {
            throw new Error('Could not extract readable text from PDF. The PDF might be image-based or encrypted.');
        }
        
        return {
            text: extractedText.trim(),
            metadata: {
                type: 'pdf',
                fileSize: file.size,
                extractionMethod: 'basic',
                wordCount: extractedText.trim().split(/\s+/).filter(word => word.length > 0).length,
                note: 'Basic PDF text extraction. For better accuracy, consider using dedicated PDF processing tools.'
            }
        };
    } catch (error) {
        log.error('PDF text extraction failed', error as Error, 'DocumentAnalysis');
        throw new Error('Failed to extract text from PDF. The file might be corrupted, encrypted, or image-based.');
    }
};

/**
 * Extracts text from Word documents
 */
const extractTextFromWord = async (file: File): Promise<{text: string, metadata: any}> => {
    // Note: Full Word document parsing requires libraries like mammoth.js
    // This is a basic implementation that handles simple Word documents
    
    try {
        const arrayBuffer = await file.arrayBuffer();
        
        if (file.name.endsWith('.docx')) {
            return await extractTextFromDocx(arrayBuffer);
        } else {
            return await extractTextFromDoc(arrayBuffer);
        }
    } catch (error) {
        log.error('Word document text extraction failed', error as Error, 'DocumentAnalysis');
        throw new Error('Failed to extract text from Word document. The file might be corrupted or in an unsupported format.');
    }
};

/**
 * Extracts text from DOCX files (ZIP-based format)
 */
const extractTextFromDocx = async (arrayBuffer: ArrayBuffer): Promise<{text: string, metadata: any}> => {
    // DOCX files are ZIP archives containing XML files
    // This is a simplified extraction that doesn't handle complex formatting
    
    try {
        // For a full implementation, you'd need a ZIP library to extract document.xml
        // and then parse the XML content. This is a simplified version.
        
        const uint8Array = new Uint8Array(arrayBuffer);
        const docxData = new TextDecoder('utf-8', { ignoreBOM: true }).decode(uint8Array);
        
        // Look for text content patterns in DOCX (simplified)
        const textRegex = /<w:t[^>]*>([^<]+)<\/w:t>/g;
        let extractedText = '';
        let match;
        
        while ((match = textRegex.exec(docxData)) !== null) {
            extractedText += match[1] + ' ';
        }
        
        if (!extractedText.trim()) {
            throw new Error('No readable text content found in the Word document.');
        }
        
        return {
            text: extractedText.trim(),
            metadata: {
                type: 'docx',
                extractionMethod: 'basic',
                wordCount: extractedText.trim().split(/\s+/).filter(word => word.length > 0).length,
                note: 'Basic DOCX text extraction. Complex formatting and embedded objects are not preserved.'
            }
        };
    } catch (error) {
        throw new Error('Failed to parse DOCX file structure.');
    }
};

/**
 * Extracts text from legacy DOC files
 */
const extractTextFromDoc = async (arrayBuffer: ArrayBuffer): Promise<{text: string, metadata: any}> => {
    // Legacy DOC files use a complex binary format
    // This is a very basic extraction that looks for readable text
    
    const uint8Array = new Uint8Array(arrayBuffer);
    const docData = new TextDecoder('latin1').decode(uint8Array);
    
    // Look for readable text patterns (very simplified)
    const textRegex = /[A-Za-z0-9\s.,;:!?"'-]{10,}/g;
    const textMatches = docData.match(textRegex) || [];
    
    // Filter out binary data and keep likely text content
    const extractedText = textMatches
        .filter(text => {
            // Filter out strings that are likely binary data
            const alphaRatio = (text.match(/[A-Za-z]/g) || []).length / text.length;
            return alphaRatio > 0.6 && text.length > 3;
        })
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim();
    
    if (!extractedText) {
        throw new Error('No readable text content found in the DOC file.');
    }
    
    return {
        text: extractedText,
        metadata: {
            type: 'doc',
            extractionMethod: 'basic',
            wordCount: extractedText.split(/\s+/).filter(word => word.length > 0).length,
            note: 'Basic DOC text extraction. Formatting and structure are not preserved. Consider converting to DOCX for better results.'
        }
    };
};

/**
 * Extracts text from RTF files
 */
const extractTextFromRTF = async (file: File): Promise<{text: string, metadata: any}> => {
    const text = await readFileAsText(file);
    
    // Remove RTF control codes and extract plain text
    let extractedText = text
        .replace(/\{[^{}]*\}/g, '') // Remove RTF groups
        .replace(/\\[a-z]+\d*/gi, '') // Remove RTF control words
        .replace(/\\[^a-z]/gi, '') // Remove RTF control symbols
        .replace(/\s+/g, ' ') // Normalize whitespace
        .trim();
    
    return {
        text: extractedText,
        metadata: {
            type: 'rtf',
            wordCount: extractedText.split(/\s+/).filter(word => word.length > 0).length,
            note: 'RTF formatting codes removed, plain text extracted.'
        }
    };
};

/**
 * Analyzes document file content with real text extraction
 */
export const analyzeDocumentFile = async (file: File): Promise<ResearchItem> => {
    log.info('Starting document analysis', { fileName: file.name, fileType: file.type, fileSize: file.size });
    
    try {
        // Extract actual text content from the file
        const { text, metadata } = await extractTextFromFile(file);
        
        if (!text || text.trim().length === 0) {
            throw new Error('No readable content found in the document.');
        }
        
        log.info('Text extracted successfully', { textLength: text.length, wordCount: metadata.wordCount });
        
        // Analyze the extracted content with AI
        const analysisPrompt = `
            Analyze the following document content and provide a comprehensive research analysis:
            
            Document: "${file.name}" (${file.type}, ${(file.size / 1024).toFixed(1)} KB)
            Content Preview: "${text.substring(0, 2000)}${text.length > 2000 ? '...' : ''}"
            
            Provide a thorough analysis including:
            1. Document type and subject matter identification
            2. Key themes and topics covered
            3. Research value and reliability assessment
            4. Important facts, data points, or insights
            5. Relevant categorization tags
            6. Summary of the main content
            
            Return ONLY a valid JSON object with this format:
            {
                "summary": "Comprehensive summary of the document content...",
                "content": "Detailed analysis including key points, themes, and insights...",
                "confidence": "High|Medium|Low",
                "subjectMatter": "Primary subject area of the document",
                "documentType": "Type of document (research paper, report, article, etc.)",
                "keyInsights": ["insight1", "insight2", "insight3"],
                "factualClaims": ["claim1", "claim2"],
                "tags": ["tag1", "tag2", "tag3"],
                "credibilityAssessment": "Assessment of document reliability and authority",
                "researchValue": "High|Medium|Low"
            }
        `;
        
        const response = await callOpenRouter(analysisPrompt, true);
        const analysisResult = JSON.parse(response);
        
        // Create comprehensive research item
        const researchItem: ResearchItem = {
            id: `research_${Date.now()}`,
            query: `Document analysis: ${file.name}`,
            type: ResearchType.SourceVerification,
            content: `${analysisResult.content}\n\n--- Original Document Content ---\n${text}`,
            summary: analysisResult.summary,
            confidence: analysisResult.confidence as ResearchConfidence,
            sources: [{
                id: `source_${Date.now()}`,
                title: analysisResult.documentType ? `${analysisResult.documentType}: ${file.name}` : file.name,
                credibility: analysisResult.researchValue === 'High' ? SourceCredibility.Credible : 
                           analysisResult.researchValue === 'Medium' ? SourceCredibility.Unverified : 
                           SourceCredibility.Questionable,
                accessDate: new Date(),
                sourceType: 'Document',
                notes: `${metadata.type.toUpperCase()} file - ${analysisResult.credibilityAssessment}`,
                metadata: {
                    fileSize: file.size,
                    wordCount: metadata.wordCount,
                    extractionMethod: metadata.extractionMethod,
                    documentType: analysisResult.documentType,
                    subjectMatter: analysisResult.subjectMatter
                }
            }],
            tags: [...(analysisResult.tags || []), 'document-analysis', metadata.type],
            linkedChapterIds: [],
            createdAt: new Date(),
            lastUpdated: new Date(),
            verified: false,
            isBookmarked: false,
            wordCount: text.split(/\s+/).filter(word => word.length > 0).length,
            qualityScore: analysisResult.researchValue === 'High' ? 85 : 
                         analysisResult.researchValue === 'Medium' ? 65 : 45,
            attachments: [{
                id: `attachment_${Date.now()}`,
                name: file.name,
                type: metadata.type === 'pdf' ? 'pdf' : 'document',
                file: file,
                size: file.size,
                uploadedAt: new Date(),
                metadata: metadata
            }],
            relatedResearchIds: [],
            contradictions: [],
            metadata: {
                originalFile: {
                    name: file.name,
                    type: file.type,
                    size: file.size
                },
                extraction: metadata,
                analysis: {
                    documentType: analysisResult.documentType,
                    subjectMatter: analysisResult.subjectMatter,
                    keyInsights: analysisResult.keyInsights,
                    factualClaims: analysisResult.factualClaims,
                    researchValue: analysisResult.researchValue,
                    credibilityAssessment: analysisResult.credibilityAssessment
                }
            }
        };
        
        log.info('Document analysis completed successfully', { 
            researchItemId: researchItem.id,
            confidence: researchItem.confidence,
            qualityScore: researchItem.qualityScore
        });
        
        return researchItem;
        
    } catch (error) {
        log.error('Document analysis failed', error as Error, 'DocumentAnalysis');
        throw new Error(`Failed to analyze document: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
};

/**
 * Generates citations in various academic formats
 */
export const generateCitation = async (researchId: string, sourceId: string, style: CitationStyle): Promise<Citation> => {
    // This would typically get the source information from the database
    // For now, we'll simulate citation generation

    const prompt = `
        Generate a ${style} style citation for a research source.

        Create both:
        1. Full bibliography entry
        2. In-text citation format
        3. Short form for subsequent references

        Return ONLY a valid JSON object with this format:
        {
            "formatted": "Full ${style} bibliography entry...",
            "inText": "(Author, Year)" or "[1]" depending on style,
            "shortForm": "Shortened reference for subsequent use"
        }
    `;

    try {
        const response = await callOpenRouter(prompt, true);
        const result = JSON.parse(response);

        const citation: Citation = {
            id: `citation_${Date.now()}`,
            researchItemId: researchId,
            sourceId: sourceId,
            style: style,
            formatted: result.formatted,
            shortForm: result.shortForm,
            inText: result.inText,
            createdAt: new Date()
        };

        return citation;
    } catch (error) {
        log.aiError('Citation generation failed', error as Error);
        throw new Error("Failed to generate citation with AI.");
    }
};

/**
 * Analyzes research for thematic patterns
 */
export const analyzeResearchThemes = async (researchItems: ResearchItem[]): Promise<ThematicTag[]> => {
    const combinedContent = researchItems.map(item => `${item.query}: ${item.summary}`).join('\n\n');

    const prompt = `
        Analyze the following research summaries and identify 5-8 major themes or patterns:

        ${combinedContent.substring(0, 8000)}

        For each theme, provide:
        1. Theme name
        2. Brief description
        3. Color code (hex)
        4. Sentiment (Positive/Negative/Neutral)
        5. Related topics/keywords

        Return ONLY a valid JSON object with this format:
        {
            "themes": [
                {
                    "name": "Theme name",
                    "description": "Brief description...",
                    "color": "#hex-color",
                    "sentiment": "Positive|Negative|Neutral",
                    "themes": ["keyword1", "keyword2"],
                    "frequency": 5
                }
            ]
        }
    `;

    try {
        const response = await callOpenRouter(prompt, true);
        const result = JSON.parse(response);

        return result.themes.map((theme: any, index: number) => ({
            id: `theme_${Date.now()}_${index}`,
            name: theme.name,
            description: theme.description,
            color: theme.color,
            researchItemIds: [], // Would be populated based on theme matching
            themes: theme.themes,
            sentiment: theme.sentiment,
            frequency: theme.frequency || 1
        }));
    } catch (error) {
        log.aiError('Theme analysis failed', error as Error);
        throw new Error("Failed to analyze research themes with AI.");
    }
};

/**
 * Detects contradictions between research items
 */
export const detectResearchContradictions = async (researchItems: ResearchItem[]): Promise<ResearchContradiction[]> => {
    const researchSummaries = researchItems.map(item => ({
        id: item.id,
        summary: `${item.query}: ${item.summary}`,
        confidence: item.confidence
    }));

    const prompt = `
        Analyze these research summaries for potential contradictions or conflicts:

        ${JSON.stringify(researchSummaries, null, 2)}

        Identify any:
        1. Direct contradictions (opposite claims)
        2. Implicit conflicts (different implications)
        3. Source reliability conflicts

        Return ONLY a valid JSON object with this format:
        {
            "contradictions": [
                {
                    "researchId": "research_id",
                    "conflictingResearchId": "other_research_id",
                    "conflictType": "Direct|Implicit|Source",
                    "description": "Description of the contradiction...",
                    "severity": "High|Medium|Low"
                }
            ]
        }
    `;

    try {
        const response = await callOpenRouter(prompt, true);
        const result = JSON.parse(response);

        return result.contradictions.map((contradiction: any, index: number) => ({
            id: `contradiction_${Date.now()}_${index}`,
            conflictingResearchId: contradiction.conflictingResearchId,
            conflictType: contradiction.conflictType,
            description: contradiction.description,
            severity: contradiction.severity
        }));
    } catch (error) {
        log.aiError('Contradiction detection failed', error as Error);
        throw new Error("Failed to detect contradictions with AI.");
    }
};

/**
 * Creates a thematic timeline from research
 */
export const createThematicTimeline = async (themeTag: string, researchItems: ResearchItem[]): Promise<ResearchTimeline> => {
    const themeContent = researchItems.map(item => `${item.query}: ${item.summary}`).join('\n\n');

    const prompt = `
        Create a chronological timeline for the theme "${themeTag}" based on this research:

        ${themeContent.substring(0, 6000)}

        Extract and organize:
        1. Key dates and events related to the theme
        2. Historical progression
        3. Important milestones
        4. Verification status of each event

        Return ONLY a valid JSON object with this format:
        {
            "title": "Timeline title",
            "description": "Brief description",
            "events": [
                {
                    "title": "Event title",
                    "date": "YYYY-MM-DD or estimated date",
                    "description": "Event description",
                    "importance": "High|Medium|Low",
                    "verified": true/false
                }
            ]
        }
    `;

    try {
        const response = await callOpenRouter(prompt, true);
        const result = JSON.parse(response);

        const timeline: ResearchTimeline = {
            id: `timeline_${Date.now()}`,
            title: result.title,
            description: result.description,
            events: result.events.map((event: any, index: number) => ({
                id: `event_${Date.now()}_${index}`,
                title: event.title,
                date: new Date(event.date),
                description: event.description,
                importance: event.importance,
                verified: event.verified
            })),
            createdAt: new Date(),
            researchItemIds: researchItems.map(r => r.id)
        };

        return timeline;
    } catch (error) {
        log.aiError('Timeline creation failed', error as Error);
        throw new Error("Failed to create thematic timeline with AI.");
    }
};

/**
 * Creates a research mind map
 */
export const createResearchMindMap = async (centerTopic: string, researchItems: ResearchItem[]): Promise<ResearchMindMap> => {
    const researchContent = researchItems.map(item => `${item.query}: ${item.summary}`).join('\n\n');

    const prompt = `
        Create a mind map structure for the central topic "${centerTopic}" based on this research:

        ${researchContent.substring(0, 6000)}

        Organize into:
        1. Central topic (root)
        2. Main branches (major themes)
        3. Sub-branches (specific topics)
        4. Detail nodes (facts/findings)

        Return ONLY a valid JSON object with this format:
        {
            "nodes": [
                {
                    "label": "Node text",
                    "x": 400,
                    "y": 300,
                    "type": "central|main|sub|detail",
                    "color": "#hex-color"
                }
            ],
            "connections": [
                {
                    "sourceId": "node1",
                    "targetId": "node2",
                    "label": "relationship",
                    "strength": 0.8
                }
            ]
        }
    `;

    try {
        const response = await callOpenRouter(prompt, true);
        const result = JSON.parse(response);

        const mindMap: ResearchMindMap = {
            id: `mindmap_${Date.now()}`,
            title: `${centerTopic} Research Map`,
            centralTopic: centerTopic,
            nodes: result.nodes.map((node: any, index: number) => ({
                id: `node_${Date.now()}_${index}`,
                label: node.label,
                x: node.x || Math.random() * 800,
                y: node.y || Math.random() * 600,
                type: node.type,
                color: node.color
            })),
            connections: result.connections.map((conn: any, index: number) => ({
                id: `conn_${Date.now()}_${index}`,
                sourceId: conn.sourceId,
                targetId: conn.targetId,
                label: conn.label,
                strength: conn.strength || 1
            })),
            createdAt: new Date(),
            researchItemIds: researchItems.map(r => r.id)
        };

        return mindMap;
    } catch (error) {
        log.aiError('Mind map creation failed', error as Error);
        throw new Error("Failed to create research mind map with AI.");
    }
};