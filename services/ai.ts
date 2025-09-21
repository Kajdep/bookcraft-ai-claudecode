import { GoogleGenAI } from "@google/genai";
import { Chapter, Project, VisualRecommendation, VisualType, PlotPoint, ResearchType, ResearchConfidence, ResearchSource, SourceCredibility, FactCheckResult, ResearchItem, Citation, CitationStyle, ThematicTag, ResearchContradiction, ResearchTimeline, ResearchMindMap, Settings } from "../types";
import { log } from "./logger";

// Default configuration - will be overridden by user settings
const DEFAULT_OPENROUTER_MODEL = "nvidia/nemotron-nano-9b-v2:free";

// Function to get current settings from store
const getAISettings = (): Settings => {
    // Since this is a service layer, we need to get settings from the store
    // We'll import the store hook at runtime to avoid circular dependencies
    const { useBookCraftStore } = require('../store/useStore');
    const settings = useBookCraftStore.getState().settings;

    return {
        openRouterApiKey: settings?.openRouterApiKey || process.env.OPENROUTER_API_KEY || '',
        openRouterEndpoint: settings?.openRouterEndpoint || 'https://openrouter.ai/api/v1',
        geminiApiKey: settings?.geminiApiKey || process.env.GEMINI_API_KEY || '',
        geminiEndpoint: settings?.geminiEndpoint || 'https://generativelanguage.googleapis.com',
        ...settings
    };
};

/**
 * Makes a request to OpenRouter API for text generation
 */
const callOpenRouter = async (prompt: string, jsonMode = false): Promise<string> => {
    const settings = getAISettings();

    if (!settings.openRouterApiKey) {
        throw new Error("OpenRouter API key not configured. Please check your settings.");
    }

    const apiUrl = `${settings.openRouterEndpoint}/chat/completions`;

    const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${settings.openRouterApiKey}`,
            "Content-Type": "application/json",
            "HTTP-Referer": "https://bookcraft-ai.local",
            "X-Title": "BookCraft AI"
        },
        body: JSON.stringify({
            model: settings.defaultModel || DEFAULT_OPENROUTER_MODEL,
            messages: [
                {
                    role: "user",
                    content: prompt
                }
            ],
            response_format: jsonMode ? { type: "json_object" } : undefined,
            temperature: settings.temperature || 0.7,
            max_tokens: settings.maxTokens
        })
    });

    if (!response.ok) {
        throw new Error(`OpenRouter API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
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
        const response = await callOpenRouter(prompt);
        return response.replace(/```mermaid\n|```/g, "").trim();
    } catch (error) {
        log.aiError('Visual generation failed', error as Error);
        throw new Error("Failed to generate visual from AI.");
    }
};

/**
 * Generates an image based on a text prompt using Gemini Flash 2.5 native image generation.
 */
export const generateImage = async (prompt: string): Promise<string> => {
    const settings = getAISettings();

    if (!settings.geminiApiKey) {
        throw new Error("Gemini API key not configured. Please check your settings.");
    }

    try {
        // Initialize Gemini AI with user's API key and endpoint
        const geminiAI = new GoogleGenAI({
            apiKey: settings.geminiApiKey,
            baseURL: settings.geminiEndpoint
        });

        const response = await geminiAI.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Generate an image: ${prompt}`,
            config: {
                temperature: settings.temperature || 0.7,
            },
        });

        // Gemini Flash 2.5 returns image data in the response
        if (response.candidates && response.candidates[0] && response.candidates[0].content) {
            const content = response.candidates[0].content;

            // Look for image parts in the response
            for (const part of content.parts) {
                if (part.inlineData && part.inlineData.mimeType?.startsWith('image/')) {
                    return part.inlineData.data;
                }
            }
        }

        throw new Error("No image was generated by Gemini Flash 2.5.");
    } catch (error) {
        log.aiError('Gemini image generation failed', error as Error);
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
    const prompt = `
        Analyze the following chapter content and generate a structural outline.
        Identify the main points or sections and provide a brief summary for each.

        Chapter Content:
        ---
        ${chapterContent.substring(0, 5000)}
        ---

        Return ONLY a valid JSON object with this exact format:
        {"structure": [{"point": "Main Point 1", "details": "Brief summary..."}, {"point": "Main Point 2", "details": "Brief summary..."}]}
    `;

    try {
        const response = await callOpenRouter(prompt, true);
        const json = JSON.parse(response);
        return json.structure || [];
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
        const result = JSON.parse(response);

        // Convert response to proper format
        const sources: ResearchSource[] = result.sources.map((s: any, index: number) => ({
            id: `source_${Date.now()}_${index}`,
            title: s.title,
            credibility: s.credibility as SourceCredibility,
            accessDate: new Date(),
            notes: s.type
        }));

        return {
            content: result.content,
            summary: result.summary,
            confidence: result.confidence as ResearchConfidence,
            sources,
            tags: result.tags
        };
    } catch (error) {
        log.aiError('Research failed', error as Error);
        throw new Error("Failed to perform research with AI.");
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
 * Summarizes web content from a URL
 */
export const summarizeWebContent = async (url: string): Promise<ResearchItem> => {
    const prompt = `
        Analyze and summarize the content from this URL: ${url}

        Please provide:
        1. A comprehensive summary of the main points
        2. Key facts and data points
        3. Assessment of source credibility
        4. Relevant tags for categorization
        5. Main themes covered

        Return ONLY a valid JSON object with this format:
        {
            "summary": "Comprehensive summary...",
            "content": "Detailed content extraction...",
            "confidence": "High|Medium|Low",
            "credibility": "Verified|Credible|Questionable|Unverified",
            "tags": ["tag1", "tag2", "tag3"],
            "sourceInfo": {
                "title": "Article title",
                "author": "Author name",
                "publishDate": "Date if available",
                "sourceType": "Website"
            }
        }
    `;

    try {
        const response = await callOpenRouter(prompt, true);
        const result = JSON.parse(response);

        const researchItem: ResearchItem = {
            id: `research_${Date.now()}`,
            query: `Web content analysis: ${url}`,
            type: ResearchType.SourceVerification,
            content: result.content,
            summary: result.summary,
            confidence: result.confidence as ResearchConfidence,
            sources: [{
                id: `source_${Date.now()}`,
                title: result.sourceInfo.title,
                url: url,
                author: result.sourceInfo.author,
                publishDate: result.sourceInfo.publishDate,
                credibility: result.credibility as SourceCredibility,
                accessDate: new Date(),
                sourceType: 'Website'
            }],
            tags: result.tags || [],
            linkedChapterIds: [],
            createdAt: new Date(),
            lastUpdated: new Date(),
            verified: false,
            isBookmarked: false,
            wordCount: result.content.split(/\s+/).length,
            qualityScore: result.confidence === 'High' ? 85 : result.confidence === 'Medium' ? 65 : 45,
            attachments: [],
            relatedResearchIds: [],
            contradictions: []
        };

        return researchItem;
    } catch (error) {
        log.aiError('Web content summarization failed', error as Error);
        throw new Error("Failed to summarize web content with AI.");
    }
};

/**
 * Analyzes document file content (PDF, DOCX, etc.)
 */
export const analyzeDocumentFile = async (file: File): Promise<ResearchItem> => {
    // Note: In a real implementation, you would extract text from the file first
    // For now, we'll simulate this with the filename and mock content

    const prompt = `
        Analyze the uploaded document: "${file.name}" (${file.type}, ${(file.size / 1024).toFixed(1)} KB)

        Based on the filename and file type, provide a research analysis structure:
        1. Likely content type and subject matter
        2. Research value assessment
        3. Suggested categorization
        4. Recommended verification steps

        Return ONLY a valid JSON object with this format:
        {
            "summary": "Analysis of document purpose and content...",
            "content": "Detailed analysis of likely document content...",
            "confidence": "Medium",
            "tags": ["document-analysis", "uploaded-file"],
            "sourceInfo": {
                "title": "Document title",
                "sourceType": "Document",
                "fileInfo": {
                    "name": "${file.name}",
                    "type": "${file.type}",
                    "size": ${file.size}
                }
            }
        }
    `;

    try {
        const response = await callOpenRouter(prompt, true);
        const result = JSON.parse(response);

        const researchItem: ResearchItem = {
            id: `research_${Date.now()}`,
            query: `Document analysis: ${file.name}`,
            type: ResearchType.SourceVerification,
            content: result.content,
            summary: result.summary,
            confidence: ResearchConfidence.Medium,
            sources: [{
                id: `source_${Date.now()}`,
                title: result.sourceInfo.title || file.name,
                credibility: SourceCredibility.Unverified,
                accessDate: new Date(),
                sourceType: 'Document',
                notes: `File: ${file.name} (${file.type})`
            }],
            tags: result.tags || ['document-analysis'],
            linkedChapterIds: [],
            createdAt: new Date(),
            lastUpdated: new Date(),
            verified: false,
            isBookmarked: false,
            wordCount: result.content.split(/\s+/).length,
            qualityScore: 60,
            attachments: [{
                id: `attachment_${Date.now()}`,
                name: file.name,
                type: file.type.includes('pdf') ? 'pdf' : 'document',
                file: file,
                size: file.size,
                uploadedAt: new Date()
            }],
            relatedResearchIds: [],
            contradictions: []
        };

        return researchItem;
    } catch (error) {
        log.aiError('Document analysis failed', error as Error);
        throw new Error("Failed to analyze document with AI.");
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