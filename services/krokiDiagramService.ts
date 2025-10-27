import { DiagramFormat, DiagramConfig, DiagramResult, Settings } from '../types';
import { log } from './logger';

/**
 * Kroki Diagram Service
 *
 * Provides multi-format diagram rendering via Kroki API (kroki.io).
 * Supports D2, Graphviz, PlantUML, Mermaid, and Nomnoml formats.
 *
 * Features:
 * - SVG and PNG rendering
 * - Embeddable URL generation
 * - Automatic retry with exponential backoff
 * - Response caching (1 hour TTL)
 * - Syntax validation
 */

// Default configuration
const DEFAULT_KROKI_URL = 'https://kroki.io';
const CACHE_TTL = 3600000; // 1 hour in milliseconds
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 1000; // 1 second

// Cache structure
interface CacheEntry {
    data: DiagramResult;
    timestamp: number;
}

const cache = new Map<string, CacheEntry>();

/**
 * Get Kroki API URL from settings or environment
 */
const getKrokiUrl = async (): Promise<string> => {
    try {
        const { useBookCraftStore } = await import('../store/useStore');
        const settings = useBookCraftStore.getState().settings;
        return settings?.krokiApiUrl || import.meta.env.VITE_KROKI_API_URL || DEFAULT_KROKI_URL;
    } catch (error) {
        log.warn('Failed to load settings, using default Kroki URL', { error });
        return import.meta.env.VITE_KROKI_API_URL || DEFAULT_KROKI_URL;
    }
};

/**
 * Generate cache key from diagram config
 */
const getCacheKey = (code: string, format: DiagramFormat): string => {
    return `${format}:${code}`;
};

/**
 * Check if cache entry is still valid
 */
const isCacheValid = (entry: CacheEntry): boolean => {
    return Date.now() - entry.timestamp < CACHE_TTL;
};

import pako from 'pako';

/**
 * Compress diagram code using deflate and encode to base64 for Kroki URL embedding
 */
const compressToBase64 = (text: string): string => {
    try {
        // Deflate the text using pako
        const deflated = pako.deflate(text, { level: 9 });
        // Convert Uint8Array to string for base64 encoding
        let binary = '';
        deflated.forEach((byte) => {
            binary += String.fromCharCode(byte);
        });
        // Encode to base64
        return btoa(binary);
    } catch (error) {
        log.error('Failed to compress and encode diagram for Kroki', error as Error);
        throw new Error('Failed to compress and encode diagram');
    }
};

/**
 * Decompress base64 to original text
 */
const decompressFromBase64 = (encoded: string): string => {
    try {
        return decodeURIComponent(escape(atob(encoded)));
    } catch (error) {
        log.error('Failed to decode diagram from base64', error as Error);
        throw new Error('Failed to decode diagram');
    }
};

/**
 * Validate diagram syntax based on format
 */
export const validateFormat = (code: string, format: DiagramFormat): { valid: boolean; error?: string } => {
    if (!code || code.trim().length === 0) {
        return { valid: false, error: 'Diagram code cannot be empty' };
    }

    if (code.length > 50000) {
        return { valid: false, error: 'Diagram code is too long (max 50,000 characters)' };
    }

    switch (format) {
        case DiagramFormat.PlantUML:
            if (!code.includes('@startuml') || !code.includes('@enduml')) {
                return {
                    valid: false,
                    error: 'PlantUML diagrams must start with @startuml and end with @enduml'
                };
            }
            break;

        case DiagramFormat.Graphviz:
            if (!code.match(/^\s*(di)?graph/i)) {
                return {
                    valid: false,
                    error: 'Graphviz diagrams must start with "graph" or "digraph"'
                };
            }
            break;

        case DiagramFormat.D2:
            // D2 is very forgiving, basic check for arrow syntax
            if (!code.match(/->|--/)) {
                log.warn('D2 diagram may be missing connections', { codePreview: code.substring(0, 100) });
            }
            break;

        case DiagramFormat.Nomnoml:
            // Nomnoml should have box syntax [Text]
            if (!code.match(/\[[^\]]+\]/)) {
                return {
                    valid: false,
                    error: 'Nomnoml diagrams should contain box syntax like [Text]'
                };
            }
            break;

        case DiagramFormat.Mermaid:
            // Basic Mermaid validation
            const validTypes = ['graph', 'flowchart', 'sequenceDiagram', 'classDiagram', 'stateDiagram',
                               'erDiagram', 'journey', 'gantt', 'pie', 'mindmap', 'timeline'];
            const hasValidType = validTypes.some(type => code.toLowerCase().includes(type.toLowerCase()));
            if (!hasValidType) {
                return {
                    valid: false,
                    error: `Mermaid diagram must include a valid type: ${validTypes.join(', ')}`
                };
            }
            break;
    }

    return { valid: true };
};

/**
 * Sleep utility for retry delays
 */
const sleep = (ms: number): Promise<void> => {
    return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Render diagram via Kroki API with retry logic
 */
export const renderDiagram = async (
    code: string,
    format: DiagramFormat,
    outputFormat: 'svg' | 'png' = 'svg'
): Promise<DiagramResult> => {
    // Check cache first
    const cacheKey = getCacheKey(code, format);
    const cached = cache.get(cacheKey);
    if (cached && isCacheValid(cached)) {
        log.debug('Returning cached diagram result', { format, cacheKey: cacheKey.substring(0, 50) });
        return cached.data;
    }

    // Validate format
    const validation = validateFormat(code, format);
    if (!validation.valid) {
        log.warn('Diagram validation failed', { format, error: validation.error });
        return {
            format,
            error: validation.error
        };
    }

    const krokiUrl = await getKrokiUrl();
    let lastError: Error | null = null;

    // Retry logic with exponential backoff
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
        try {
            log.debug('Rendering diagram via Kroki', {
                format,
                attempt: attempt + 1,
                codeLength: code.length
            });

            // Use POST request for better reliability with large diagrams
            const response = await fetch(`${krokiUrl}/${format}/${outputFormat}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'text/plain',
                },
                body: code,
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Kroki API error (${response.status}): ${errorText}`);
            }

            const result: DiagramResult = {
                format,
            };

            if (outputFormat === 'svg') {
                result.svg = await response.text();
            } else {
                // For PNG, convert to base64
                const blob = await response.blob();
                const base64 = await blobToBase64(blob);
                result.svg = `<img src="${base64}" alt="${format} diagram" />`;
            }

            // Generate embeddable URL
            result.url = getDiagramUrl(code, format, outputFormat);

            // Cache the result
            cache.set(cacheKey, {
                data: result,
                timestamp: Date.now()
            });

            log.info('Diagram rendered successfully via Kroki', {
                format,
                svgLength: result.svg?.length || 0
            });

            return result;

        } catch (error) {
            lastError = error as Error;
            log.warn('Kroki rendering attempt failed', {
                format,
                attempt: attempt + 1,
                error: lastError.message
            });

            // If not the last attempt, wait before retrying
            if (attempt < MAX_RETRIES - 1) {
                const delay = INITIAL_RETRY_DELAY * Math.pow(2, attempt);
                log.debug('Retrying Kroki request', { delay, nextAttempt: attempt + 2 });
                await sleep(delay);
            }
        }
    }

    // All retries failed
    const errorMessage = lastError?.message || 'Unknown error rendering diagram';
    log.error('Kroki rendering failed after all retries', lastError as Error);

    return {
        format,
        error: `Failed to render diagram: ${errorMessage}`
    };
};

/**
 * Convert Blob to base64 string
 */
const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
};

/**
 * Get embeddable Kroki URL for a diagram
 * Uses base64 encoding for simplicity
 */
export const getDiagramUrl = (
    code: string,
    format: DiagramFormat,
    outputFormat: 'svg' | 'png' = 'svg'
): string => {
    try {
        const encoded = compressToBase64(code);
        const krokiUrl = DEFAULT_KROKI_URL; // Use default for embeddable URLs
        return `${krokiUrl}/${format}/${outputFormat}/${encoded}`;
    } catch (error) {
        log.error('Failed to generate diagram URL', error as Error);
        return '';
    }
};

/**
 * Clear expired cache entries
 */
export const clearExpiredCache = (): void => {
    const now = Date.now();
    let cleared = 0;

    for (const [key, entry] of cache.entries()) {
        if (now - entry.timestamp >= CACHE_TTL) {
            cache.delete(key);
            cleared++;
        }
    }

    if (cleared > 0) {
        log.debug('Cleared expired Kroki cache entries', { count: cleared });
    }
};

/**
 * Clear all cache entries
 */
export const clearCache = (): void => {
    const size = cache.size;
    cache.clear();
    log.debug('Cleared Kroki cache', { entriesCleared: size });
};

/**
 * Get cache statistics
 */
export const getCacheStats = () => {
    return {
        size: cache.size,
        entries: Array.from(cache.entries()).map(([key, entry]) => ({
            key: key.substring(0, 50) + '...',
            age: Date.now() - entry.timestamp,
            valid: isCacheValid(entry)
        }))
    };
};

// Periodically clear expired cache entries (every 10 minutes)
if (typeof window !== 'undefined') {
    setInterval(clearExpiredCache, 600000);
}
