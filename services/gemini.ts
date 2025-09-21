import { GoogleGenAI, Type } from "@google/genai";
import { Chapter, Project, VisualRecommendation, VisualType, PlotPoint } from "../types";

// FIX: Create full content for services/gemini.ts to provide all Gemini API functionality.

// Always use new GoogleGenAI({apiKey: process.env.API_KEY});
const ai = new GoogleGenAI({apiKey: process.env.API_KEY!});

/**
 * Generates a list of chapter titles based on a user prompt.
 */
export const planChapters = async (prompt: string): Promise<string[]> => {
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Based on the following request, generate a list of concise, compelling chapter titles. Return ONLY the list in the requested JSON format. Request: "${prompt}"`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        chapters: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.STRING,
                                description: "A single chapter title"
                            }
                        }
                    },
                    required: ["chapters"]
                },
            },
        });

        const json = JSON.parse(response.text);
        return json.chapters || [];
    } catch (error) {
        console.error("Gemini API Error (planChapters):", error);
        throw new Error("Failed to generate chapter plan from AI.");
    }
};

/**
 * Regenerates a single chapter title based on the original prompt.
 */
export const regenerateChapterTitle = async (originalPrompt: string, titleToReplace: string): Promise<string> => {
    const prompt = `Based on the user's original request for a book outline ("${originalPrompt}"), generate a new, single chapter title to replace the existing one: "${titleToReplace}". The new title should be different but fit the same thematic purpose. Return ONLY the new title as a single string.`;
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
        });
        return response.text.trim();
    } catch (error) {
        console.error("Gemini API Error (regenerateChapterTitle):", error);
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

        Return ONLY the JSON object with the recommendations. Do not add any conversational text.

        Manuscript:
        ---
        ${manuscript.substring(0, 10000)} 
        ---
    `;
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        recommendations: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    type: { type: Type.STRING, enum: Object.values(VisualType) },
                                    reasoning: { type: Type.STRING },
                                    context: { type: Type.STRING },
                                    pageNumber: { type: Type.NUMBER }
                                },
                                required: ["type", "reasoning", "context", "pageNumber"]
                            }
                        }
                    },
                    required: ["recommendations"]
                }
            }
        });

        const json = JSON.parse(response.text);
        // FIX: Return a new array to prevent "read-only" modification errors in the store.
        return [...(json.recommendations || [])];
    } catch (error) {
        console.error("Gemini API Error (analyzeForVisuals):", error);
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

        Return ONLY the JSON object with the recommendations. Do not add any conversational text.

        Chapter Content:
        ---
        ${chapterContent.substring(0, 10000)} 
        ---
    `;
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        recommendations: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    type: { type: Type.STRING, enum: Object.values(VisualType) },
                                    reasoning: { type: Type.STRING },
                                    context: { type: Type.STRING },
                                    pageNumber: { type: Type.NUMBER }
                                },
                                required: ["type", "reasoning", "context", "pageNumber"]
                            }
                        }
                    },
                    required: ["recommendations"]
                }
            }
        });

        const json = JSON.parse(response.text);
        return [...(json.recommendations || [])];
    } catch (error) {
        console.error("Gemini API Error (analyzeChapterForVisuals):", error);
        throw new Error("Failed to analyze chapter for visuals.");
    }
};


/**
 * Generates Mermaid.js code for a specific visual recommendation.
 */
export const generateVisual = async (rec: VisualRecommendation): Promise<string> => {
    const prompt = `
        Generate Mermaid.js code for a "${rec.type}" diagram.
        The diagram should visually represent the concept from the following text snippet:
        "${rec.context}"
        Reasoning for creation: ${rec.reasoning}.
        
        Return ONLY the raw Mermaid.js code block. Do not include markdown fences like \`\`\`mermaid or any other explanations.
    `;
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
        });
        
        // Clean up response to ensure it's valid mermaid code
        return response.text.replace(/```mermaid\n|```/g, "").trim();
    } catch (error) {
        console.error("Gemini API Error (generateVisual):", error);
        throw new Error("Failed to generate visual from AI.");
    }
};


/**
 * Generates an image based on a text prompt.
 */
export const generateImage = async (prompt: string): Promise<string> => {
    try {
        const response = await ai.models.generateImages({
            model: 'imagen-4.0-generate-001',
            prompt: prompt,
            config: {
                numberOfImages: 1,
                outputMimeType: 'image/png',
                aspectRatio: '1:1',
            },
        });

        if (response.generatedImages && response.generatedImages.length > 0) {
            return response.generatedImages[0].image.imageBytes;
        }
        throw new Error("No image was generated by the API.");
    } catch (error) {
        console.error("Gemini API Error (generateImage):", error);
        throw new Error("Failed to generate image from AI.");
    }
};

/**
 * Generates content for a chapter based on its title, a prompt, and project context.
 */
export const generateChapterContent = async (project: Project, chapter: Chapter, prompt: string, wordCount?: string, style?: string): Promise<string> => {
     let fullPrompt = `
        The user is writing a chapter titled "${chapter.title}" for their book, "${project.title}" (Genre: ${project.genre}).
        The user's instructions for the new content are: "${prompt}".

        ${wordCount ? `The target word count is approximately ${wordCount} words.` : ''}
        ${style ? `Additional style guidance: "${style}"` : ''}

        Return ONLY the generated text for the chapter. Do not include conversational wrappers or headings.
    `;
    
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: fullPrompt,
            config: {
                temperature: 0.7,
            },
        });
        return response.text;
    } catch (error) {
        console.error("Gemini API Error (generateChapterContent):", error);
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
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: fullPrompt,
        });
        return response.text;
    } catch (error) {
        console.error("Gemini API Error (getAIAssistantResponse):", error);
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
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
        });
        return response.text;
    } catch (error) {
        console.error("Gemini API Error (getAIContextMenuResponse):", error);
        throw new Error(`Failed to ${action} text.`);
    }
}

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
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
        });
        return response.text;
    } catch (error) {
        console.error("Gemini API Error (combineChapterContent):", error);
        throw new Error("Failed to combine content with AI.");
    }
};

/**
 * Generates a structural outline for a given chapter's content.
 */
export const generateChapterStructure = async (chapterContent: string): Promise<{ point: string; details: string }[]> => {
    const prompt = `
        Analyze the following chapter content and generate a structural outline.
        Identify the main points or sections and provide a brief summary for each.

        Chapter Content:
        ---
        ${chapterContent.substring(0, 5000)}
        ---
        Return ONLY the JSON object.
    `;
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        structure: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    point: { type: Type.STRING, description: "The main structural point or heading." },
                                    details: { type: Type.STRING, description: "A brief summary of this section." }
                                },
                                required: ["point", "details"]
                            }
                        }
                    },
                    required: ["structure"]
                }
            }
        });
        const json = JSON.parse(response.text);
        return json.structure || [];
    } catch (error) {
        console.error("Gemini API Error (generateChapterStructure):", error);
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
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
        });
        return response.text;
    } catch (error) {
        console.error("Gemini API Error (refineGeneratedText):", error);
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
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                 systemInstruction: "You are an HTML-aware text editor. Your only output should be the modified HTML content provided by the user.",
            }
        });
        return response.text;
    } catch (error) {
        console.error("Gemini API Error (cleanupAndFormatText):", error);
        throw new Error("Failed to clean and format text with AI.");
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

        Return ONLY the JSON object.
    `;
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        type: { type: Type.STRING, enum: ['image', 'diagram'] },
                        prompt: { type: Type.STRING },
                        reasoning: { type: Type.STRING },
                        diagramType: { type: Type.STRING, enum: Object.values(VisualType) },
                    },
                    required: ['type', 'prompt', 'reasoning']
                }
            }
        });
        return JSON.parse(response.text);
    } catch (error) {
        console.error("Gemini API Error (generateVisualSuggestion):", error);
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

        Return ONLY the JSON object containing the plot points.
    `;
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: fullPrompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        plotPoints: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    title: { type: Type.STRING, description: "A short, impactful title for the plot point (e.g., 'The Inciting Incident')." },
                                    description: { type: Type.STRING, description: "A 1-2 sentence summary of what happens at this plot point." }
                                },
                                required: ["title", "description"]
                            }
                        }
                    },
                    required: ["plotPoints"]
                }
            }
        });
        const json = JSON.parse(response.text);
        return json.plotPoints || [];
    } catch (error) {
        console.error("Gemini API Error (generatePlotPoints):", error);
        throw new Error("Failed to generate plot points from AI.");
    }
};