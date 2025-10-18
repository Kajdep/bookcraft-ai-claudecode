// src/services/grammarCheck.ts
import { log } from './logger';

const API_URL = 'https://api.languagetool.org/v2/check';
const API_KEY = import.meta.env.VITE_LANGUAGETOOL_API_KEY || 'your-languagetool-api-key';


export interface GrammarError {
    message: string;
    shortMessage: string;
    offset: number;
    length: number;
    replacements: Array<{ value: string }>;
    rule: {
        id: string;
        description: string;
        issueType: string;
        category: {
            id: string;
            name: string;
        };
    };
    context: {
        text: string;
        offset: number;
        length: number;
    };
}

export async function checkGrammar(text: string): Promise<GrammarError[]> {
    if (!text.trim()) {
        return [];
    }

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Accept': 'application/json'
            },
            body: new URLSearchParams({
                text: text,
                language: 'en-US',
                apiKey: API_KEY,
                enabledOnly: 'false',
            }),
        });

        if (!response.ok) {
            log.error('Grammar check API request failed', { status: response.status });
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data.matches as GrammarError[];

    } catch (error) {
        log.error('Failed to check grammar', error as Error);
        return [];
    }
}
