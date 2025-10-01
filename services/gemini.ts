import { GoogleGenAI, SchemaType } from "@google/genai";
import { Chapter, Project, VisualRecommendation, VisualType, PlotPoint } from "../types";
import { log } from "./logger";

/**
 * Gemini API Service with comprehensive error handling and fallback mechanisms.
 * Provides AI-powered features including content generation, visual analysis, and image creation.
 */

// Rate limiting for API calls
interface RateLimitInfo {
    lastCall: number;
    callCount: number;
    windowStart: number;
}

const rateLimitMap = new Map<string, RateLimitInfo>();

// Configuration interface
interface GeminiConfig {
    apiKey: string;
    model: string;
    temperature: number;
    maxTokens: number;
    enableDebugLogging: boolean;
}

// Get Gemini configuration from environment variables
const getGeminiConfig = (): GeminiConfig => {
    const isProduction = process.env.NODE_ENV === 'production';
    const debugLogging = process.env.ENABLE_DEBUG_LOGGING === 'true' && !isProduction;
    
    return {
        apiKey: process.env.GEMINI_API_KEY || '',
        model: 'gemini-1.5-flash-002', // Latest stable model
        temperature: parseFloat(process.env.DEFAULT_TEMPERATURE || '0.7'),
        maxTokens: parseInt(process.env.DEFAULT_MAX_TOKENS || '4000'),
        enableDebugLogging: debugLogging
    };
};

// Initialize Gemini AI instance with proper error handling
const createGeminiInstance = (): GoogleGenAI | null => {
    const config = getGeminiConfig();
    
    if (!config.apiKey) {
        if (config.enableDebugLogging) {
            console.warn('⚠️ Gemini API key not configured - AI features will use fallback responses');
        }
        return null;
    }
    
    try {
        return new GoogleGenAI(config.apiKey);
    } catch (error) {
        if (config.enableDebugLogging) {
            console.error('❌ Failed to initialize Gemini AI:', error);
        }
        return null;
    }
};

// Rate limiting check
const checkRateLimit = async (apiKey: string): Promise<void> => {
    const limit = parseInt(process.env.API_RATE_LIMIT || '60'); // More conservative for Gemini
    const window = parseInt(process.env.API_RATE_WINDOW || '3600000'); // 1 hour
    
    const keyHash = apiKey.slice(-8);
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
        throw new Error(`Gemini API rate limit exceeded. Try again in ${waitTime} seconds.`);
    }
    
    // Update rate limit info
    rateLimitInfo.lastCall = now;
    rateLimitInfo.callCount++;
    rateLimitMap.set(keyHash, rateLimitInfo);
    
    // Add small delay between requests
    if (rateLimitInfo.callCount > 1) {
        await new Promise(resolve => setTimeout(resolve, 200));
    }
};

// Generic Gemini API call wrapper with error handling
const callGemini = async <T>(operation: string, apiCall: () => Promise<T>, fallback?: () => T): Promise<T> => {
    const config = getGeminiConfig();
    const gemini = createGeminiInstance();
    
    if (!gemini) {
        if (fallback) {
            if (config.enableDebugLogging) {
                console.log(`🔄 Using fallback for ${operation} (Gemini API unavailable)`);
            }
            return fallback();
        }
        throw new Error(`Gemini API not available for ${operation}. Please configure GEMINI_API_KEY.`);
    }
    
    try {
        // Check rate limits
        await checkRateLimit(config.apiKey);
        
        if (config.enableDebugLogging) {
            console.log(`🚀 Gemini API Call: ${operation}`);
        }
        
        const startTime = Date.now();
        const result = await apiCall();
        
        if (config.enableDebugLogging) {
            console.log(`✅ Gemini API Success: ${operation} (${Date.now() - startTime}ms)`);
        }
        
        return result;
    } catch (error: any) {
        const errorMsg = error?.message || 'Unknown error';
        log.aiError(`Gemini ${operation} failed`, error);
        
        if (config.enableDebugLogging) {
            console.error(`❌ Gemini API Error (${operation}):`, errorMsg);
        }
        
        // Try fallback if available
        if (fallback && (errorMsg.includes('API_KEY') || errorMsg.includes('quota') || errorMsg.includes('network'))) {
            if (config.enableDebugLogging) {
                console.log(`🔄 Using fallback for ${operation} due to API error`);
            }
            return fallback();
        }
        
        throw new Error(`Failed to ${operation}: ${errorMsg}`);
    }
};

/**
 * Generates a list of chapter titles based on a user prompt.
 */
export const planChapters = async (prompt: string): Promise<string[]> => {
    return callGemini(
        'planChapters',
        async () => {
            const gemini = createGeminiInstance()!;
            const model = gemini.getGenerativeModel({ 
                model: getGeminiConfig().model,
                generationConfig: {
                    temperature: getGeminiConfig().temperature,
                    maxOutputTokens: 1000,
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: SchemaType.OBJECT,
                        properties: {
                            chapters: {
                                type: SchemaType.ARRAY,
                                items: {
                                    type: SchemaType.STRING,
                                    description: "A single chapter title"
                                }
                            }
                        },
                        required: ["chapters"]
                    },
                }
            });
            
            const promptText = `Based on the following request, generate a list of concise, compelling chapter titles. Return ONLY the list in the requested JSON format. Request: "${prompt}"`;
            const result = await model.generateContent(promptText);
            const response = await result.response;
            
            if (!response.text()) {
                throw new Error('Empty response from Gemini API');
            }
            
            const json = JSON.parse(response.text());
            return json.chapters || [];
        },
        // Fallback function
        () => {
            const fallbackTitles = [
                "Introduction", 
                "Background", 
                "Main Content", 
                "Analysis", 
                "Conclusion"
            ];
            return fallbackTitles;
        }
    );
};

/**
 * Regenerates a single chapter title based on the original prompt.
 */
export const regenerateChapterTitle = async (originalPrompt: string, titleToReplace: string): Promise<string> => {
    return callGemini(
        'regenerateChapterTitle',
        async () => {
            const gemini = createGeminiInstance()!;
            const model = gemini.getGenerativeModel({ 
                model: getGeminiConfig().model,
                generationConfig: {
                    temperature: getGeminiConfig().temperature,
                    maxOutputTokens: 100
                }
            });
            
            const promptText = `Based on the user's original request for a book outline ("${originalPrompt}"), generate a new, single chapter title to replace the existing one: "${titleToReplace}". The new title should be different but fit the same thematic purpose. Return ONLY the new title as a single string.`;
            const result = await model.generateContent(promptText);
            const response = await result.response;
            
            if (!response.text()) {
                throw new Error('Empty response from Gemini API');
            }
            
            return response.text().trim();
        },
        // Fallback function
        () => {
            const variations = [
                titleToReplace + " Revised",
                "New " + titleToReplace,
                titleToReplace + " Updated",
                "Alternative " + titleToReplace,
                titleToReplace + " V2"
            ];
            return variations[Math.floor(Math.random() * variations.length)];
        }
    );
};


/**
 * Analyzes the entire manuscript to find opportunities for visuals.
 */
export const analyzeForVisuals = async (manuscript: string): Promise<Omit<VisualRecommendation, 'id'>[]> => {
    return callGemini(
        'analyzeForVisuals',
        async () => {
            const gemini = createGeminiInstance()!;
            const model = gemini.getGenerativeModel({ 
                model: getGeminiConfig().model,
                generationConfig: {
                    temperature: 0.3, // Lower temperature for more consistent analysis
                    maxOutputTokens: 2000,
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: SchemaType.OBJECT,
                        properties: {
                            recommendations: {
                                type: SchemaType.ARRAY,
                                items: {
                                    type: SchemaType.OBJECT,
                                    properties: {
                                        type: { 
                                            type: SchemaType.STRING, 
                                            enum: Object.values(VisualType),
                                            description: "Type of visual diagram"
                                        },
                                        reasoning: { 
                                            type: SchemaType.STRING,
                                            description: "Brief reason why this visual is needed (under 20 words)"
                                        },
                                        context: { 
                                            type: SchemaType.STRING,
                                            description: "Specific text snippet that justifies the recommendation"
                                        },
                                        pageNumber: { 
                                            type: SchemaType.NUMBER,
                                            description: "Estimated page number (assuming 250 words per page)"
                                        }
                                    },
                                    required: ["type", "reasoning", "context", "pageNumber"]
                                }
                            }
                        },
                        required: ["recommendations"]
                    }
                }
            });
            
            const promptText = `
                Analyze the following manuscript and identify up to 5 key opportunities where a visual diagram would significantly enhance reader comprehension.
                For each opportunity, provide:
                1. A suitable visual type from this list: [${Object.values(VisualType).join(', ')}].
                2. A brief reasoning (under 20 words) for why the visual is needed.
                3. The specific snippet of text (context) that justifies the recommendation.
                4. An estimated page number, assuming 250 words per page.

                Return ONLY the JSON object with the recommendations. Do not add any conversational text.

                Manuscript:
                ---
                ${manuscript.substring(0, 10000)} 
                ---
            `;
            
            const result = await model.generateContent(promptText);
            const response = await result.response;
            
            if (!response.text()) {
                throw new Error('Empty response from Gemini API');
            }
            
            const json = JSON.parse(response.text());
            return [...(json.recommendations || [])];
        },
        // Fallback function
        () => {
            const fallbackRecommendations: Omit<VisualRecommendation, 'id'>[] = [
                {
                    type: VisualType.FLOWCHART,
                    reasoning: "Process visualization would help readers understand workflow",
                    context: "The document appears to contain process descriptions",
                    pageNumber: 1
                },
                {
                    type: VisualType.MINDMAP,
                    reasoning: "Concept relationships could be visualized better",
                    context: "Multiple related concepts are discussed throughout",
                    pageNumber: Math.ceil(manuscript.length / 250 / 2) // Middle of document
                }
            ];
            return fallbackRecommendations;
        }
    );
};

/**
 * Analyzes a single chapter to find opportunities for visuals.
 */
export const analyzeChapterForVisuals = async (chapterContent: string, chapterTitle: string): Promise<Omit<VisualRecommendation, 'id'>[]> => {
    return callGemini(
        'analyzeChapterForVisuals',
        async () => {
            const gemini = createGeminiInstance()!;
            const model = gemini.getGenerativeModel({ 
                model: getGeminiConfig().model,
                generationConfig: {
                    temperature: 0.3,
                    maxOutputTokens: 1500,
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: SchemaType.OBJECT,
                        properties: {
                            recommendations: {
                                type: SchemaType.ARRAY,
                                items: {
                                    type: SchemaType.OBJECT,
                                    properties: {
                                        type: { type: SchemaType.STRING, enum: Object.values(VisualType) },
                                        reasoning: { type: SchemaType.STRING },
                                        context: { type: SchemaType.STRING },
                                        pageNumber: { type: SchemaType.NUMBER }
                                    },
                                    required: ["type", "reasoning", "context", "pageNumber"]
                                }
                            }
                        },
                        required: ["recommendations"]
                    }
                }
            });
            
            const promptText = `
                Analyze the following chapter content titled "${chapterTitle}". Identify up to 3 key opportunities where a visual diagram would significantly enhance reader comprehension.
                For each opportunity, provide:
                1. A suitable visual type from this list: [${Object.values(VisualType).join(', ')}].
                2. A brief reasoning (under 20 words) for why the visual is needed.
                3. The specific snippet of text (context) that justifies the recommendation.
                4. An estimated page number, which should be 1 for a single chapter analysis.

                Return ONLY the JSON object with the recommendations. Do not add any conversational text.

                Chapter Content:
                ---
                ${chapterContent.substring(0, 10000)} 
                ---
            `;
            
            const result = await model.generateContent(promptText);
            const response = await result.response;
            
            if (!response.text()) {
                throw new Error('Empty response from Gemini API');
            }
            
            const json = JSON.parse(response.text());
            return [...(json.recommendations || [])];
        },
        // Fallback function
        () => {
            const fallbackRecommendations: Omit<VisualRecommendation, 'id'>[] = [
                {
                    type: VisualType.DIAGRAM,
                    reasoning: "Chapter concepts would benefit from visual representation",
                    context: `Content from chapter: ${chapterTitle}`,
                    pageNumber: 1
                }
            ];
            return fallbackRecommendations;
        }
    );
};


/**
 * Generates Mermaid.js code for a specific visual recommendation.
 */
export const generateVisual = async (rec: VisualRecommendation): Promise<string> => {
    return callGemini(
        'generateVisual',
        async () => {
            const gemini = createGeminiInstance()!;
            const model = gemini.getGenerativeModel({ 
                model: getGeminiConfig().model,
                generationConfig: {
                    temperature: 0.3,
                    maxOutputTokens: 1000
                }
            });
            
            const promptText = `
                Generate Mermaid.js code for a "${rec.type}" diagram.
                The diagram should visually represent the concept from the following text snippet:
                "${rec.context}"
                Reasoning for creation: ${rec.reasoning}.
                
                Return ONLY the raw Mermaid.js code block. Do not include markdown fences like \`\`\`mermaid or any other explanations.
            `;
            
            const result = await model.generateContent(promptText);
            const response = await result.response;
            
            if (!response.text()) {
                throw new Error('Empty response from Gemini API');
            }
            
            // Clean up response to ensure it's valid mermaid code
            return response.text().replace(/```mermaid\n|```/g, "").trim();
        },
        // Fallback function
        () => {
            const fallbackMermaid = {
                [VisualType.FLOWCHART]: "flowchart TD\n    A[Start] --> B[Process]\n    B --> C[End]",
                [VisualType.MINDMAP]: "mindmap\n  root(Central Topic)\n    Branch 1\n    Branch 2\n    Branch 3",
                [VisualType.SEQUENCE]: "sequenceDiagram\n    participant A as Actor A\n    participant B as Actor B\n    A->>B: Message\n    B-->>A: Response",
                [VisualType.GANTT]: "gantt\n    title Project Timeline\n    section Phase 1\n    Task 1 : 2024-01-01, 30d\n    Task 2 : 30d",
                [VisualType.DIAGRAM]: "graph TD\n    A[Concept A] --> B[Concept B]\n    B --> C[Concept C]",
                [VisualType.TIMELINE]: "timeline\n    title Event Timeline\n    2024 : Event 1\n    2025 : Event 2"
            };
            return fallbackMermaid[rec.type as VisualType] || fallbackMermaid[VisualType.DIAGRAM];
        }
    );
};


/**
 * Generates an image based on a text prompt.
 * Note: As of current Gemini API, image generation is not directly supported.
 * This function provides a fallback mechanism and placeholder for future implementations.
 */
export const generateImage = async (prompt: string): Promise<string> => {
    return callGemini(
        'generateImage',
        async () => {
            // Note: Current Google GenAI SDK doesn't support image generation
            // This is a placeholder for when the feature becomes available
            throw new Error('Image generation not yet supported in current Gemini API');
        },
        // Fallback function - return a placeholder image data URL
        () => {
            // Create a simple placeholder image as base64 data URL
            const canvas = document.createElement('canvas');
            canvas.width = 400;
            canvas.height = 400;
            const ctx = canvas.getContext('2d');
            
            if (ctx) {
                // Create a gradient background
                const gradient = ctx.createLinearGradient(0, 0, 400, 400);
                gradient.addColorStop(0, '#667eea');
                gradient.addColorStop(1, '#764ba2');
                ctx.fillStyle = gradient;
                ctx.fillRect(0, 0, 400, 400);
                
                // Add text
                ctx.fillStyle = 'white';
                ctx.font = 'bold 24px sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('Generated Image', 200, 180);
                ctx.font = '16px sans-serif';
                ctx.fillText('Placeholder', 200, 220);
                
                // Add a simple shape
                ctx.strokeStyle = 'white';
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.arc(200, 280, 50, 0, 2 * Math.PI);
                ctx.stroke();
                
                return canvas.toDataURL('image/png');
            }
            
            // If canvas fails, return a minimal SVG as data URL
            const svg = `<svg width="400" height="400" xmlns="http://www.w3.org/2000/svg">\n  <rect width="400" height="400" fill="#667eea"/>\n  <text x="200" y="200" text-anchor="middle" fill="white" font-family="sans-serif" font-size="24">Generated Image</text>\n  <text x="200" y="230" text-anchor="middle" fill="white" font-family="sans-serif" font-size="16">Placeholder</text>\n</svg>`;
            return `data:image/svg+xml;base64,${btoa(svg)}`;
        }
    );
};

/**
 * Generates content for a chapter based on its title, a prompt, and project context.
 */
export const generateChapterContent = async (project: Project, chapter: Chapter, prompt: string, wordCount?: string, style?: string): Promise<string> => {
    return callGemini(
        'generateChapterContent',
        async () => {
            const gemini = createGeminiInstance()!;
            const model = gemini.getGenerativeModel({ 
                model: getGeminiConfig().model,
                generationConfig: {
                    temperature: getGeminiConfig().temperature,
                    maxOutputTokens: parseInt(wordCount || '1000') + 500 // Add buffer
                }
            });
            
            const fullPrompt = `
                The user is writing a chapter titled "${chapter.title}" for their book, "${project.title}" (Genre: ${project.genre}).
                The user's instructions for the new content are: "${prompt}".

                ${wordCount ? `The target word count is approximately ${wordCount} words.` : ''}
                ${style ? `Additional style guidance: "${style}"` : ''}

                Return ONLY the generated text for the chapter. Do not include conversational wrappers or headings.
            `;
            
            const result = await model.generateContent(fullPrompt);
            const response = await result.response;
            
            if (!response.text()) {
                throw new Error('Empty response from Gemini API');
            }
            
            return response.text();
        },
        // Fallback function
        () => {
            return `This chapter content would normally be generated by AI based on your prompt: "${prompt}". The chapter is titled "${chapter.title}" for the book "${project.title}". Please configure your Gemini API key to enable AI content generation.`;
        }
    );
};

/**
 * Gets a response from the AI assistant in the context of a chapter.
 */
export const getAIAssistantResponse = async (chapter: Chapter, prompt: string): Promise<string> => {
    return callGemini(
        'getAIAssistantResponse',
        async () => {
            const gemini = createGeminiInstance()!;
            const model = gemini.getGenerativeModel({ 
                model: getGeminiConfig().model,
                generationConfig: {
                    temperature: getGeminiConfig().temperature,
                    maxOutputTokens: 1000
                }
            });
            
            const fullPrompt = `
                You are a helpful writing assistant.
                The user is working on a chapter titled "${chapter.title}".
                The user's request is: "${prompt}"
                
                Provide a helpful response. Do not add conversational filler.
            `;
            
            const result = await model.generateContent(fullPrompt);
            const response = await result.response;
            
            if (!response.text()) {
                throw new Error('Empty response from Gemini API');
            }
            
            return response.text();
        },
        // Fallback function
        () => {
            return `I'd be happy to help with your chapter "${chapter.title}". Your request was: "${prompt}". Please configure your Gemini API key to get personalized AI assistance with your writing.`;
        }
    );
};

/**
 * Gets a response from the AI assistant for a specific text selection.
 */
export const getAIContextMenuResponse = async (text: string, action: string): Promise<string> => {
    return callGemini(
        'getAIContextMenuResponse',
        async () => {
            const gemini = createGeminiInstance()!;
            const model = gemini.getGenerativeModel({ 
                model: getGeminiConfig().model,
                generationConfig: {
                    temperature: 0.3, // Lower temperature for text editing
                    maxOutputTokens: text.length * 2 // Allow for expansion
                }
            });
            
            const promptText = `
                A user has selected the following text:
                ---
                ${text}
                ---
                Perform this action on the text: ${action}.
                Return ONLY the modified text.
            `;
            
            const result = await model.generateContent(promptText);
            const response = await result.response;
            
            if (!response.text()) {
                throw new Error('Empty response from Gemini API');
            }
            
            return response.text();
        },
        // Fallback function
        () => {
            // Simple fallback transformations
            switch (action.toLowerCase()) {
                case 'expand':
                case 'elaborate':
                    return text + " [This text would be expanded by AI. Please configure your Gemini API key for full functionality.]";
                case 'summarize':
                    return text.substring(0, Math.min(100, text.length)) + "... [Summary would be generated by AI]";
                case 'improve':
                case 'enhance':
                    return text + " [Enhanced version would be generated by AI]";
                case 'rewrite':
                    return "[Rewritten version: " + text + "]";
                default:
                    return text;
            }
        }
    );
};

/**
 * Combines original and new content into a cohesive narrative.
 */
export const combineChapterContent = async (originalContent: string, newContent: string): Promise<string> => {
    return callGemini(
        'combineChapterContent',
        async () => {
            const gemini = createGeminiInstance()!;
            const model = gemini.getGenerativeModel({ 
                model: getGeminiConfig().model,
                generationConfig: {
                    temperature: 0.5, // Moderate creativity for content merging
                    maxOutputTokens: (originalContent.length + newContent.length) * 2
                }
            });
            
            const promptText = `
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
            
            const result = await model.generateContent(promptText);
            const response = await result.response;
            
            if (!response.text()) {
                throw new Error('Empty response from Gemini API');
            }
            
            return response.text();
        },
        // Fallback function
        () => {
            // Simple concatenation as fallback
            return originalContent + "\n\n" + newContent;
        }
    );
};

/**
 * Generates a structural outline for a given chapter's content.
 */
export const generateChapterStructure = async (chapterContent: string): Promise<{ point: string; details: string }[]> => {
    return callGemini(
        'generateChapterStructure',
        async () => {
            const gemini = createGeminiInstance()!;
            const model = gemini.getGenerativeModel({ 
                model: getGeminiConfig().model,
                generationConfig: {
                    temperature: 0.3, // Lower temperature for analytical tasks
                    maxOutputTokens: 1500,
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: SchemaType.OBJECT,
                        properties: {
                            structure: {
                                type: SchemaType.ARRAY,
                                items: {
                                    type: SchemaType.OBJECT,
                                    properties: {
                                        point: { type: SchemaType.STRING, description: "The main structural point or heading." },
                                        details: { type: SchemaType.STRING, description: "A brief summary of this section." }
                                    },
                                    required: ["point", "details"]
                                }
                            }
                        },
                        required: ["structure"]
                    }
                }
            });
            
            const promptText = `
                Analyze the following chapter content and generate a structural outline.
                Identify the main points or sections and provide a brief summary for each.

                Chapter Content:
                ---
                ${chapterContent.substring(0, 5000)}
                ---
                Return ONLY the JSON object.
            `;
            
            const result = await model.generateContent(promptText);
            const response = await result.response;
            
            if (!response.text()) {
                throw new Error('Empty response from Gemini API');
            }
            
            const json = JSON.parse(response.text());
            return json.structure || [];
        },
        // Fallback function
        () => {
            // Simple structural analysis as fallback
            const wordCount = chapterContent.split(' ').length;
            const fallbackStructure = [
                {
                    point: "Opening",
                    details: "Chapter introduction and setup"
                },
                {
                    point: "Development", 
                    details: "Main content and key points"
                },
                {
                    point: "Conclusion",
                    details: "Chapter summary and transition"
                }
            ];
            return fallbackStructure;
        }
    );
};

/**
 * Refines a piece of generated text based on a user's prompt.
 */
export const refineGeneratedText = async (originalText: string, refinementPrompt: string): Promise<string> => {
    return callGemini(
        'refineGeneratedText',
        async () => {
            const gemini = createGeminiInstance()!;
            const model = gemini.getGenerativeModel({ 
                model: getGeminiConfig().model,
                generationConfig: {
                    temperature: 0.6, // Moderate creativity for refinements
                    maxOutputTokens: originalText.length * 2
                }
            });
            
            const promptText = `
                Original Text:
                ---
                ${originalText}
                ---

                User's Refinement Request: "${refinementPrompt}"

                Rewrite the original text based on the user's request. Return ONLY the newly refined text.
            `;
            
            const result = await model.generateContent(promptText);
            const response = await result.response;
            
            if (!response.text()) {
                throw new Error('Empty response from Gemini API');
            }
            
            return response.text();
        },
        // Fallback function
        () => {
            return originalText + " [Refined based on: " + refinementPrompt + "]";
        }
    );
};

/**
 * Cleans up and formats a block of text, adding paragraph structure.
 */
export const cleanupAndFormatText = async (text: string): Promise<string> => {
    return callGemini(
        'cleanupAndFormatText',
        async () => {
            const gemini = createGeminiInstance()!;
            const model = gemini.getGenerativeModel({ 
                model: getGeminiConfig().model,
                generationConfig: {
                    temperature: 0.2, // Low temperature for formatting tasks
                    maxOutputTokens: text.length * 2
                },
                systemInstruction: "You are an HTML-aware text editor. Your only output should be the modified HTML content provided by the user."
            });
            
            const promptText = `
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
            
            const result = await model.generateContent(promptText);
            const response = await result.response;
            
            if (!response.text()) {
                throw new Error('Empty response from Gemini API');
            }
            
            return response.text();
        },
        // Fallback function
        () => {
            // Basic HTML cleanup as fallback
            return text
                .replace(/\s+/g, ' ') // Normalize whitespace
                .replace(/(<p>\s*<\/p>)/g, '') // Remove empty paragraphs
                .trim();
        }
    );
};

/**
 * Analyzes text and suggests a visual (image or diagram).
 */
export const generateVisualSuggestion = async (text: string): Promise<{ type: 'image' | 'diagram'; prompt: string; reasoning: string; diagramType?: VisualType }> => {
    return callGemini(
        'generateVisualSuggestion',
        async () => {
            const gemini = createGeminiInstance()!;
            const model = gemini.getGenerativeModel({ 
                model: getGeminiConfig().model,
                generationConfig: {
                    temperature: 0.4, // Moderate temperature for creative analysis
                    maxOutputTokens: 800,
                    responseMimeType: 'application/json',
                    responseSchema: {
                        type: SchemaType.OBJECT,
                        properties: {
                            type: { type: SchemaType.STRING, enum: ['image', 'diagram'] },
                            prompt: { type: SchemaType.STRING },
                            reasoning: { type: SchemaType.STRING },
                            diagramType: { type: SchemaType.STRING, enum: Object.values(VisualType) },
                        },
                        required: ['type', 'prompt', 'reasoning']
                    }
                }
            });
            
            const promptText = `
                Analyze the following text. Decide if it's better suited for a photographic IMAGE or a structured DIAGRAM (like a flowchart, mindmap, etc.).
                Based on your decision, provide:
                1. "type": either "image" or "diagram".
                2. "prompt": a detailed, descriptive prompt for an AI to generate the visual. For an image, this should be a vivid description. For a diagram, it should be a clear instruction of what to illustrate.
                3. "reasoning": a brief explanation for your choice.
                4. "diagramType": if the type is "diagram", specify which kind from this list: [${Object.values(VisualType).join(', ')}].
                
                Text: "${text}"

                Return ONLY the JSON object.
            `;
            
            const result = await model.generateContent(promptText);
            const response = await result.response;
            
            if (!response.text()) {
                throw new Error('Empty response from Gemini API');
            }
            
            return JSON.parse(response.text());
        },
        // Fallback function
        () => {
            // Simple heuristic-based suggestion as fallback
            const containsProcessWords = /process|step|flow|procedure|method|workflow/i.test(text);
            const containsRelationshipWords = /relationship|connect|link|between|versus|compare/i.test(text);
            const containsVisualWords = /scene|image|picture|visual|appearance|looks like/i.test(text);
            
            if (containsVisualWords) {
                return {
                    type: 'image' as const,
                    prompt: `Generate an image based on: ${text.substring(0, 100)}...`,
                    reasoning: "Text contains visual descriptions suitable for image generation"
                };
            } else if (containsProcessWords) {
                return {
                    type: 'diagram' as const,
                    prompt: `Create a flowchart showing: ${text.substring(0, 100)}...`,
                    reasoning: "Text describes a process that would benefit from a flowchart",
                    diagramType: VisualType.FLOWCHART
                };
            } else if (containsRelationshipWords) {
                return {
                    type: 'diagram' as const,
                    prompt: `Create a mind map showing: ${text.substring(0, 100)}...`,
                    reasoning: "Text discusses relationships that would benefit from a mind map",
                    diagramType: VisualType.MINDMAP
                };
            } else {
                return {
                    type: 'diagram' as const,
                    prompt: `Create a diagram illustrating: ${text.substring(0, 100)}...`,
                    reasoning: "General content that would benefit from a diagram",
                    diagramType: VisualType.DIAGRAM
                };
            }
        }
    );
};

/**
 * Generates a list of plot points for a fiction book.
 */
export const generatePlotPoints = async (prompt: string): Promise<Omit<PlotPoint, 'id' | 'order'>[]> => {
    return callGemini(
        'generatePlotPoints',
        async () => {
            const gemini = createGeminiInstance()!;
            const model = gemini.getGenerativeModel({ 
                model: getGeminiConfig().model,
                generationConfig: {
                    temperature: 0.7, // Higher temperature for creative story generation
                    maxOutputTokens: 2000,
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: SchemaType.OBJECT,
                        properties: {
                            plotPoints: {
                                type: SchemaType.ARRAY,
                                items: {
                                    type: SchemaType.OBJECT,
                                    properties: {
                                        title: { type: SchemaType.STRING, description: "A short, impactful title for the plot point (e.g., 'The Inciting Incident')." },
                                        description: { type: SchemaType.STRING, description: "A 1-2 sentence summary of what happens at this plot point." }
                                    },
                                    required: ["title", "description"]
                                }
                            }
                        },
                        required: ["plotPoints"]
                    }
                }
            });
            
            const fullPrompt = `
                You are an expert story structure consultant. Based on the user's idea, generate a list of key plot points for a compelling narrative.
                Use a standard story structure (like the three-act structure) to outline the plot.
                For each point, provide a concise "title" and a one or two-sentence "description".

                User's Idea: "${prompt}"

                Return ONLY the JSON object containing the plot points.
            `;
            
            const result = await model.generateContent(fullPrompt);
            const response = await result.response;
            
            if (!response.text()) {
                throw new Error('Empty response from Gemini API');
            }
            
            const json = JSON.parse(response.text());
            return json.plotPoints || [];
        },
        // Fallback function
        () => {
            // Standard three-act structure as fallback
            const fallbackPlotPoints: Omit<PlotPoint, 'id' | 'order'>[] = [
                {
                    title: "Opening/Setup",
                    description: "Introduce the main character, setting, and initial situation. Establish the normal world before change occurs."
                },
                {
                    title: "Inciting Incident",
                    description: "The event that sets the story in motion and disrupts the protagonist's normal world."
                },
                {
                    title: "First Plot Point",
                    description: "The protagonist makes a decision to pursue their goal and enters the main conflict."
                },
                {
                    title: "Midpoint",
                    description: "A major revelation or shift that changes the protagonist's approach to their goal."
                },
                {
                    title: "Crisis",
                    description: "The lowest point where the protagonist faces their greatest challenge or darkest moment."
                },
                {
                    title: "Climax",
                    description: "The final confrontation where the central conflict reaches its peak and is resolved."
                },
                {
                    title: "Resolution",
                    description: "The aftermath of the climax, showing how the world and characters have changed."
                }
            ];
            return fallbackPlotPoints;
        }
    );
};
