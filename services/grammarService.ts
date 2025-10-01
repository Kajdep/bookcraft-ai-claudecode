import { log } from './logger';

export interface GrammarIssue {
    id: string;
    type: 'grammar' | 'spelling' | 'style' | 'readability' | 'tone';
    severity: 'low' | 'medium' | 'high';
    message: string;
    suggestion: string;
    startOffset: number;
    endOffset: number;
    originalText: string;
    replacementText?: string;
    category: string;
    rule?: string;
}

export interface StyleAnalysis {
    readabilityScore: number;
    readabilityLevel: string;
    avgSentenceLength: number;
    avgWordsPerSentence: number;
    complexWords: number;
    passiveVoiceCount: number;
    sentenceVariation: number;
    toneAnalysis: {
        dominant: string;
        confidence: number;
        emotions: Record<string, number>;
    };
    suggestions: string[];
}

export interface GrammarCheckResult {
    issues: GrammarIssue[];
    styleAnalysis: StyleAnalysis;
    wordCount: number;
    characterCount: number;
    sentenceCount: number;
    paragraphCount: number;
    processingTime: number;
}

class GrammarService {
    private apiKey: string | null = null;
    private languageToolKey: string | null = null;
    private grammarlyKey: string | null = null;

    constructor() {
        // Initialize API keys from environment
        this.apiKey = process.env.OPENROUTER_API_KEY || null;
        this.languageToolKey = process.env.LANGUAGETOOL_API_KEY || null;
        this.grammarlyKey = process.env.GRAMMARLY_API_KEY || null;
    }

    setApiKey(key: string) {
        this.apiKey = key;
    }
    
    setLanguageToolApiKey(key: string) {
        this.languageToolKey = key;
    }
    
    setGrammarlyApiKey(key: string) {
        this.grammarlyKey = key;
    }

    async checkGrammarAndStyle(text: string): Promise<GrammarCheckResult> {
        const startTime = Date.now();
        
        // Basic text analysis
        const wordCount = this.countWords(text);
        const characterCount = text.length;
        const sentenceCount = this.countSentences(text);
        const paragraphCount = this.countParagraphs(text);

        // Run both rule-based and AI-based checks
        const ruleBasedIssues = await this.runRuleBasedChecks(text);
        const aiIssues = this.apiKey ? await this.runAIBasedChecks(text) : [];
        const styleAnalysis = await this.analyzeStyle(text);

        const allIssues = [...ruleBasedIssues, ...aiIssues];
        
        // Remove duplicates and merge similar issues
        const deduplicatedIssues = this.deduplicateIssues(allIssues);

        return {
            issues: deduplicatedIssues,
            styleAnalysis,
            wordCount,
            characterCount,
            sentenceCount,
            paragraphCount,
            processingTime: Date.now() - startTime
        };
    }

    private async runRuleBasedChecks(text: string): Promise<GrammarIssue[]> {
        const issues: GrammarIssue[] = [];

        // Common grammar patterns
        const patterns = [
            // Spelling issues (common mistakes)
            {
                pattern: /\bteh\b/gi,
                replacement: 'the',
                type: 'spelling' as const,
                severity: 'high' as const,
                message: 'Possible spelling error',
                suggestion: 'Did you mean "the"?',
                category: 'Spelling'
            },
            {
                pattern: /\brecieve\b/gi,
                replacement: 'receive',
                type: 'spelling' as const,
                severity: 'high' as const,
                message: 'Spelling error',
                suggestion: 'Use "receive" instead of "recieve"',
                category: 'Spelling'
            },
            {
                pattern: /\boccured\b/gi,
                replacement: 'occurred',
                type: 'spelling' as const,
                severity: 'high' as const,
                message: 'Spelling error',
                suggestion: 'Use "occurred" instead of "occured"',
                category: 'Spelling'
            },
            
            // Grammar patterns
            {
                pattern: /\b(could|would|should) of\b/gi,
                replacement: '$1 have',
                type: 'grammar' as const,
                severity: 'high' as const,
                message: 'Incorrect phrase',
                suggestion: 'Use "could have", "would have", or "should have"',
                category: 'Grammar'
            },
            {
                pattern: /\bits\s/gi,
                replacement: "it's",
                type: 'grammar' as const,
                severity: 'medium' as const,
                message: 'Possible contraction error',
                suggestion: 'Consider using "it\'s" if you mean "it is"',
                category: 'Grammar'
            },
            {
                pattern: /\byour\s+(going|coming|being)/gi,
                replacement: "you're $1",
                type: 'grammar' as const,
                severity: 'high' as const,
                message: 'Incorrect possessive/contraction',
                suggestion: 'Use "you\'re" (you are) instead of "your"',
                category: 'Grammar'
            },

            // Style issues
            {
                pattern: /\bvery\s+(\w+)/gi,
                replacement: '$1',
                type: 'style' as const,
                severity: 'low' as const,
                message: 'Weak intensifier',
                suggestion: 'Consider a stronger word instead of "very"',
                category: 'Style'
            },
            {
                pattern: /\breally\s+(\w+)/gi,
                replacement: '$1',
                type: 'style' as const,
                severity: 'low' as const,
                message: 'Unnecessary intensifier',
                suggestion: 'Consider removing "really" or using a stronger word',
                category: 'Style'
            },
            {
                pattern: /\bin order to\b/gi,
                replacement: 'to',
                type: 'style' as const,
                severity: 'low' as const,
                message: 'Wordy phrase',
                suggestion: 'Use "to" instead of "in order to"',
                category: 'Conciseness'
            },

            // Redundancy
            {
                pattern: /\bfree gift\b/gi,
                replacement: 'gift',
                type: 'style' as const,
                severity: 'medium' as const,
                message: 'Redundant phrase',
                suggestion: 'A gift is already free',
                category: 'Redundancy'
            },
            {
                pattern: /\bunexpected surprise\b/gi,
                replacement: 'surprise',
                type: 'style' as const,
                severity: 'medium' as const,
                message: 'Redundant phrase',
                suggestion: 'A surprise is already unexpected',
                category: 'Redundancy'
            }
        ];

        patterns.forEach(pattern => {
            let match;
            while ((match = pattern.pattern.exec(text)) !== null) {
                issues.push({
                    id: `rule_${Date.now()}_${Math.random()}`,
                    type: pattern.type,
                    severity: pattern.severity,
                    message: pattern.message,
                    suggestion: pattern.suggestion,
                    startOffset: match.index,
                    endOffset: match.index + match[0].length,
                    originalText: match[0],
                    replacementText: match[0].replace(pattern.pattern, pattern.replacement),
                    category: pattern.category,
                    rule: `rule-based-${pattern.category.toLowerCase()}`
                });
            }
        });

        // Passive voice detection
        const passiveVoiceIssues = this.detectPassiveVoice(text);
        issues.push(...passiveVoiceIssues);

        // Long sentence detection
        const longSentenceIssues = this.detectLongSentences(text);
        issues.push(...longSentenceIssues);

        return issues;
    }

    private async runAIBasedChecks(text: string): Promise<GrammarIssue[]> {
        if (!this.apiKey) return [];

        try {
            // First try LanguageTool API if available
            const languageToolKey = process.env.LANGUAGETOOL_API_KEY;
            const languageToolEndpoint = process.env.LANGUAGETOOL_ENDPOINT || 'https://api.languagetool.org';
            
            if (languageToolKey) {
                return await this.runLanguageToolCheck(text, languageToolKey, languageToolEndpoint);
            }
            
            // Fallback to OpenRouter AI for grammar checking
            return await this.runOpenRouterGrammarCheck(text);
            
        } catch (error) {
            log.error('AI-based grammar check failed', error);
            // Fallback to enhanced rule-based checking
            return this.runEnhancedRuleBasedChecks(text);
        }
    }

    private async runLanguageToolCheck(text: string, apiKey: string, endpoint: string): Promise<GrammarIssue[]> {
        const issues: GrammarIssue[] = [];
        
        try {
            const response = await fetch(`${endpoint}/v2/check`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: new URLSearchParams({
                    'text': text,
                    'language': 'en-US',
                    'enabledRules': '',
                    'disabledRules': ''
                })
            });
            
            if (!response.ok) {
                throw new Error(`LanguageTool API error: ${response.status}`);
            }
            
            const data = await response.json();
            
            data.matches.forEach((match: any, index: number) => {
                const severity = this.mapLanguageToolSeverity(match.rule.category.name);
                const type = this.mapLanguageToolType(match.rule.category.name);
                
                issues.push({
                    id: `lt_${Date.now()}_${index}`,
                    type,
                    severity,
                    message: match.message,
                    suggestion: match.replacements.length > 0 ? 
                        `Suggested: ${match.replacements.slice(0, 3).map((r: any) => r.value).join(', ')}` : 
                        match.shortMessage || match.message,
                    startOffset: match.offset,
                    endOffset: match.offset + match.length,
                    originalText: text.substring(match.offset, match.offset + match.length),
                    replacementText: match.replacements.length > 0 ? match.replacements[0].value : undefined,
                    category: match.rule.category.name,
                    rule: match.rule.id
                });
            });
            
            return issues;
        } catch (error) {
            log.error('LanguageTool API failed', error);
            throw error;
        }
    }
    
    private async runOpenRouterGrammarCheck(text: string): Promise<GrammarIssue[]> {
        try {
            // Import AI service dynamically to avoid circular dependencies
            const { callOpenRouter } = await import('./ai');
            
            const prompt = `
Analyze the following text for grammar, spelling, style, and readability issues. 
Return a JSON array of issues with this exact format:

[
  {
    "type": "grammar|spelling|style|readability",
    "severity": "low|medium|high",
    "message": "Clear description of the issue",
    "suggestion": "Specific suggestion for improvement",
    "startOffset": number,
    "endOffset": number,
    "originalText": "text with the issue",
    "replacementText": "suggested replacement (optional)",
    "category": "Grammar|Spelling|Style|Clarity|etc",
    "rule": "rule-name"
  }
]

Text to analyze:
"${text}"

Return ONLY the JSON array, no explanations.`;
            
            const response = await callOpenRouter(prompt, true);
            const aiIssues = JSON.parse(response);
            
            return aiIssues.map((issue: any, index: number) => ({
                id: `ai_${Date.now()}_${index}`,
                type: issue.type || 'style',
                severity: issue.severity || 'medium',
                message: issue.message,
                suggestion: issue.suggestion,
                startOffset: issue.startOffset,
                endOffset: issue.endOffset,
                originalText: issue.originalText,
                replacementText: issue.replacementText,
                category: issue.category || 'AI Analysis',
                rule: issue.rule || 'ai-analysis'
            }));
            
        } catch (error) {
            log.error('OpenRouter grammar check failed', error);
            throw error;
        }
    }
    
    private runEnhancedRuleBasedChecks(text: string): GrammarIssue[] {
        const issues: GrammarIssue[] = [];
        const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
        
        for (let i = 0; i < sentences.length; i++) {
            const sentence = sentences[i].trim();
            if (sentence.length < 3) continue;

            // Enhanced subject-verb disagreement detection
            if (this.detectSubjectVerbDisagreement(sentence)) {
                const startOffset = text.indexOf(sentence);
                issues.push({
                    id: `enhanced_${Date.now()}_${i}`,
                    type: 'grammar',
                    severity: 'high',
                    message: 'Possible subject-verb disagreement',
                    suggestion: 'Check that the subject and verb agree in number',
                    startOffset,
                    endOffset: startOffset + sentence.length,
                    originalText: sentence,
                    category: 'Subject-Verb Agreement',
                    rule: 'enhanced-subject-verb'
                });
            }

            // Enhanced awkward phrasing detection
            if (this.detectAwkwardPhrasing(sentence)) {
                const startOffset = text.indexOf(sentence);
                issues.push({
                    id: `enhanced_awkward_${Date.now()}_${i}`,
                    type: 'style',
                    severity: 'medium',
                    message: 'Potentially awkward or unclear phrasing',
                    suggestion: 'Consider rephrasing for better clarity and flow',
                    startOffset,
                    endOffset: startOffset + sentence.length,
                    originalText: sentence,
                    category: 'Clarity',
                    rule: 'enhanced-clarity'
                });
            }
            
            // Check for run-on sentences
            if (this.isRunOnSentence(sentence)) {
                const startOffset = text.indexOf(sentence);
                issues.push({
                    id: `runon_${Date.now()}_${i}`,
                    type: 'style',
                    severity: 'medium',
                    message: 'Possible run-on sentence',
                    suggestion: 'Consider breaking this into shorter sentences',
                    startOffset,
                    endOffset: startOffset + sentence.length,
                    originalText: sentence,
                    category: 'Sentence Length',
                    rule: 'run-on-sentence'
                });
            }
        }

        return issues;
    }
    
    private mapLanguageToolSeverity(category: string): 'low' | 'medium' | 'high' {
        const highSeverityCategories = ['GRAMMAR', 'TYPOS', 'CONFUSED_WORDS'];
        const mediumSeverityCategories = ['STYLE', 'REDUNDANCY', 'WORDINESS'];
        
        if (highSeverityCategories.includes(category.toUpperCase())) {
            return 'high';
        } else if (mediumSeverityCategories.includes(category.toUpperCase())) {
            return 'medium';
        }
        return 'low';
    }
    
    private mapLanguageToolType(category: string): 'grammar' | 'spelling' | 'style' | 'readability' {
        const grammarCategories = ['GRAMMAR', 'CONFUSED_WORDS'];
        const spellingCategories = ['TYPOS', 'MISSPELLING'];
        const styleCategories = ['STYLE', 'REDUNDANCY', 'WORDINESS'];
        
        if (grammarCategories.includes(category.toUpperCase())) {
            return 'grammar';
        } else if (spellingCategories.includes(category.toUpperCase())) {
            return 'spelling';
        } else if (styleCategories.includes(category.toUpperCase())) {
            return 'style';
        }
        return 'readability';
    }
    
    private isRunOnSentence(sentence: string): boolean {
        const words = sentence.split(/\s+/);
        const hasMultipleClauses = (sentence.match(/,/g) || []).length >= 3 || 
                                  (sentence.match(/\band\b/gi) || []).length >= 2 ||
                                  (sentence.match(/\bor\b/gi) || []).length >= 2;
        
        return words.length > 25 && hasMultipleClauses;
    }

    private async analyzeStyle(text: string): Promise<StyleAnalysis> {
        const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
        const words = text.split(/\s+/).filter(w => w.length > 0);
        
        // Readability calculations (Flesch Reading Ease approximation)
        const avgSentenceLength = words.length / sentences.length || 0;
        const syllables = words.reduce((sum, word) => sum + this.countSyllables(word), 0);
        const avgSyllablesPerWord = syllables / words.length || 0;
        
        const fleschScore = 206.835 - (1.015 * avgSentenceLength) - (84.6 * avgSyllablesPerWord);
        const readabilityScore = Math.max(0, Math.min(100, fleschScore));
        
        const readabilityLevel = this.getReadabilityLevel(readabilityScore);
        
        // Complex words (3+ syllables)
        const complexWords = words.filter(word => this.countSyllables(word) >= 3).length;
        
        // Passive voice detection
        const passiveVoiceCount = this.countPassiveVoice(text);
        
        // Sentence variation
        const sentenceLengths = sentences.map(s => s.split(/\s+/).length);
        const sentenceVariation = this.calculateVariation(sentenceLengths);
        
        // Basic tone analysis
        const toneAnalysis = this.analyzeTone(text);
        
        // Generate suggestions
        const suggestions = this.generateStyleSuggestions({
            readabilityScore,
            avgSentenceLength,
            complexWords: complexWords / words.length,
            passiveVoiceCount,
            sentenceVariation
        });

        return {
            readabilityScore,
            readabilityLevel,
            avgSentenceLength,
            avgWordsPerSentence: avgSentenceLength,
            complexWords,
            passiveVoiceCount,
            sentenceVariation,
            toneAnalysis,
            suggestions
        };
    }

    private detectPassiveVoice(text: string): GrammarIssue[] {
        const issues: GrammarIssue[] = [];
        const passivePatterns = [
            /\b(was|were|is|are|been|being)\s+([\w]+ed|[\w]+en)\b/gi,
            /\b(was|were|is|are)\s+being\s+([\w]+ed|[\w]+en)\b/gi
        ];

        passivePatterns.forEach(pattern => {
            let match;
            while ((match = pattern.exec(text)) !== null) {
                // Skip some common false positives
                if (!this.isLikelyPassiveVoice(match[0])) continue;
                
                issues.push({
                    id: `passive_${Date.now()}_${Math.random()}`,
                    type: 'style',
                    severity: 'low',
                    message: 'Passive voice detected',
                    suggestion: 'Consider using active voice for stronger writing',
                    startOffset: match.index,
                    endOffset: match.index + match[0].length,
                    originalText: match[0],
                    category: 'Voice',
                    rule: 'passive-voice'
                });
            }
        });

        return issues;
    }

    private detectLongSentences(text: string): GrammarIssue[] {
        const issues: GrammarIssue[] = [];
        const sentences = text.split(/[.!?]+/);
        let currentOffset = 0;

        sentences.forEach(sentence => {
            const trimmedSentence = sentence.trim();
            if (trimmedSentence.length === 0) {
                currentOffset += sentence.length + 1;
                return;
            }

            const wordCount = trimmedSentence.split(/\s+/).length;
            if (wordCount > 25) {
                issues.push({
                    id: `long_sentence_${Date.now()}_${Math.random()}`,
                    type: 'readability',
                    severity: 'medium',
                    message: 'Long sentence detected',
                    suggestion: `This sentence has ${wordCount} words. Consider breaking it into shorter sentences.`,
                    startOffset: currentOffset,
                    endOffset: currentOffset + sentence.length,
                    originalText: sentence,
                    category: 'Sentence Length',
                    rule: 'long-sentence'
                });
            }

            currentOffset += sentence.length + 1;
        });

        return issues;
    }

    private detectSubjectVerbDisagreement(sentence: string): boolean {
        // Simplified detection - in a real implementation, this would use NLP
        const singularSubjects = /\b(he|she|it|this|that|everyone|someone|nobody)\s+(\w+)/gi;
        const pluralVerbs = /\b(are|were|have)\b/gi;
        
        return singularSubjects.test(sentence) && pluralVerbs.test(sentence);
    }

    private detectAwkwardPhrasing(sentence: string): boolean {
        // Simplified detection for demonstration
        const awkwardPatterns = [
            /\bthat\s+that\b/gi,
            /\bwhich\s+which\b/gi,
            /\bthe\s+the\b/gi,
            /\band\s+and\b/gi
        ];
        
        return awkwardPatterns.some(pattern => pattern.test(sentence));
    }

    private countWords(text: string): number {
        return text.split(/\s+/).filter(word => word.length > 0).length;
    }

    private countSentences(text: string): number {
        return text.split(/[.!?]+/).filter(s => s.trim().length > 0).length;
    }

    private countParagraphs(text: string): number {
        return text.split(/\n\s*\n/).filter(p => p.trim().length > 0).length;
    }

    private countSyllables(word: string): number {
        // Simplified syllable counting
        const vowels = word.toLowerCase().match(/[aeiouy]+/g);
        let syllableCount = vowels ? vowels.length : 1;
        
        // Adjust for silent e
        if (word.toLowerCase().endsWith('e')) {
            syllableCount--;
        }
        
        return Math.max(1, syllableCount);
    }

    private countPassiveVoice(text: string): number {
        const passivePattern = /\b(was|were|is|are|been|being)\s+([\w]+ed|[\w]+en)\b/gi;
        const matches = text.match(passivePattern);
        return matches ? matches.length : 0;
    }

    private isLikelyPassiveVoice(phrase: string): boolean {
        // Filter out common false positives
        const falsePositives = [
            /was\s+interested/i,
            /were\s+excited/i,
            /is\s+located/i,
            /are\s+situated/i
        ];
        
        return !falsePositives.some(pattern => pattern.test(phrase));
    }

    private calculateVariation(numbers: number[]): number {
        if (numbers.length === 0) return 0;
        
        const mean = numbers.reduce((sum, n) => sum + n, 0) / numbers.length;
        const variance = numbers.reduce((sum, n) => sum + Math.pow(n - mean, 2), 0) / numbers.length;
        return Math.sqrt(variance);
    }

    private getReadabilityLevel(score: number): string {
        if (score >= 90) return 'Very Easy';
        if (score >= 80) return 'Easy';
        if (score >= 70) return 'Fairly Easy';
        if (score >= 60) return 'Standard';
        if (score >= 50) return 'Fairly Difficult';
        if (score >= 30) return 'Difficult';
        return 'Very Difficult';
    }

    private analyzeTone(text: string): { dominant: string; confidence: number; emotions: Record<string, number> } {
        // Simplified tone analysis - in production, this would use sentiment analysis APIs
        const positiveWords = ['good', 'great', 'excellent', 'wonderful', 'amazing', 'love', 'happy', 'joy'];
        const negativeWords = ['bad', 'terrible', 'awful', 'hate', 'sad', 'angry', 'disappointed'];
        const formalWords = ['therefore', 'furthermore', 'consequently', 'moreover', 'nevertheless'];
        const casualWords = ['like', 'totally', 'really', 'pretty', 'kinda', 'gonna'];

        const words = text.toLowerCase().split(/\s+/);
        
        const positive = positiveWords.reduce((sum, word) => sum + (words.filter(w => w.includes(word)).length), 0);
        const negative = negativeWords.reduce((sum, word) => sum + (words.filter(w => w.includes(word)).length), 0);
        const formal = formalWords.reduce((sum, word) => sum + (words.filter(w => w.includes(word)).length), 0);
        const casual = casualWords.reduce((sum, word) => sum + (words.filter(w => w.includes(word)).length), 0);

        const total = positive + negative + formal + casual || 1;
        
        const emotions = {
            positive: positive / total,
            negative: negative / total,
            formal: formal / total,
            casual: casual / total,
            neutral: 1 - ((positive + negative + formal + casual) / total)
        };

        const dominant = Object.entries(emotions).reduce((a, b) => emotions[a[0]] > emotions[b[0]] ? a : b)[0];
        const confidence = emotions[dominant];

        return { dominant, confidence, emotions };
    }

    private generateStyleSuggestions(analysis: {
        readabilityScore: number;
        avgSentenceLength: number;
        complexWords: number;
        passiveVoiceCount: number;
        sentenceVariation: number;
    }): string[] {
        const suggestions: string[] = [];

        if (analysis.readabilityScore < 30) {
            suggestions.push('Consider simplifying your language for better readability');
        }

        if (analysis.avgSentenceLength > 20) {
            suggestions.push('Try breaking up long sentences for better flow');
        }

        if (analysis.complexWords > 0.2) {
            suggestions.push('Consider using simpler words where possible');
        }

        if (analysis.passiveVoiceCount > 5) {
            suggestions.push('Reduce passive voice usage for more engaging writing');
        }

        if (analysis.sentenceVariation < 3) {
            suggestions.push('Vary your sentence lengths for better rhythm');
        }

        if (suggestions.length === 0) {
            suggestions.push('Your writing style looks good! Keep up the excellent work.');
        }

        return suggestions;
    }

    private deduplicateIssues(issues: GrammarIssue[]): GrammarIssue[] {
        // Remove duplicate issues based on position and type
        const seen = new Set();
        return issues.filter(issue => {
            const key = `${issue.startOffset}-${issue.endOffset}-${issue.type}`;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });
    }
}

export const grammarService = new GrammarService();