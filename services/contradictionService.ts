import { ResearchItem, Chapter, Character, PlotPoint } from '../types';
import { log } from './logger';

export interface Contradiction {
    id: string;
    type: 'character' | 'plot' | 'setting' | 'timeline' | 'fact' | 'research';
    severity: 'low' | 'medium' | 'high' | 'critical';
    title: string;
    description: string;
    sources: ContradictionSource[];
    suggestions: string[];
    confidence: number; // 0-1 score from AI analysis
    category: string;
    detected: Date;
    resolved: boolean;
    userNotes?: string;
}

export interface ContradictionSource {
    type: 'research' | 'chapter' | 'character' | 'plot';
    id: string;
    title: string;
    excerpt: string;
    location?: string; // For chapters: page/paragraph, for research: section
}

export interface ContradictionAnalysis {
    contradictions: Contradiction[];
    summary: {
        total: number;
        bySeverity: Record<string, number>;
        byType: Record<string, number>;
        resolved: number;
        pending: number;
    };
    consistency: {
        overall: number; // 0-100 consistency score
        character: number;
        plot: number;
        setting: number;
        timeline: number;
    };
    recommendations: string[];
    processingTime: number;
}

class ContradictionDetectionService {
    private apiKey: string | null = null;

    setApiKey(key: string) {
        this.apiKey = key;
    }

    async analyzeProjectConsistency(projectData: {
        chapters: Chapter[];
        research: ResearchItem[];
        characters?: Character[];
        plotPoints?: PlotPoint[];
    }): Promise<ContradictionAnalysis> {
        const startTime = Date.now();

        try {
            // Extract all text content for analysis
            const textContent = this.extractTextContent(projectData);
            
            // Run various contradiction detection methods
            const contradictions: Contradiction[] = [];
            
            // Rule-based detection
            const ruleBasedContradictions = await this.detectRuleBasedContradictions(projectData);
            contradictions.push(...ruleBasedContradictions);
            
            // AI-powered detection (if API key available)
            if (this.apiKey) {
                const aiContradictions = await this.detectAIBasedContradictions(textContent, projectData);
                contradictions.push(...aiContradictions);
            }
            
            // Cross-reference analysis
            const crossRefContradictions = await this.detectCrossReferenceContradictions(projectData);
            contradictions.push(...crossRefContradictions);
            
            // Timeline consistency
            const timelineContradictions = await this.detectTimelineContradictions(projectData);
            contradictions.push(...timelineContradictions);
            
            // Remove duplicates and prioritize
            const deduplicatedContradictions = this.deduplicateContradictions(contradictions);
            
            // Calculate consistency scores
            const consistency = this.calculateConsistencyScores(deduplicatedContradictions, projectData);
            
            // Generate summary statistics
            const summary = this.generateSummary(deduplicatedContradictions);
            
            // Generate recommendations
            const recommendations = this.generateRecommendations(deduplicatedContradictions, consistency);
            
            return {
                contradictions: deduplicatedContradictions,
                summary,
                consistency,
                recommendations,
                processingTime: Date.now() - startTime
            };
        } catch (error) {
            log.error('Contradiction analysis failed', error);
            return {
                contradictions: [],
                summary: {
                    total: 0,
                    bySeverity: {},
                    byType: {},
                    resolved: 0,
                    pending: 0
                },
                consistency: {
                    overall: 100,
                    character: 100,
                    plot: 100,
                    setting: 100,
                    timeline: 100
                },
                recommendations: ['Analysis failed - please try again'],
                processingTime: Date.now() - startTime
            };
        }
    }

    private extractTextContent(projectData: {
        chapters: Chapter[];
        research: ResearchItem[];
        characters?: Character[];
        plotPoints?: PlotPoint[];
    }) {
        return {
            chapters: projectData.chapters.map(chapter => ({
                id: chapter.id,
                title: chapter.title,
                content: this.stripHtml(chapter.content),
                notes: chapter.notes || '',
                order: chapter.order
            })),
            research: projectData.research.map(item => ({
                id: item.id,
                query: item.query,
                content: item.content,
                summary: item.summary,
                tags: item.tags || []
            })),
            characters: projectData.characters || [],
            plotPoints: projectData.plotPoints || []
        };
    }

    private async detectRuleBasedContradictions(projectData: {
        chapters: Chapter[];
        research: ResearchItem[];
        characters?: Character[];
        plotPoints?: PlotPoint[];
    }): Promise<Contradiction[]> {
        const contradictions: Contradiction[] = [];
        
        // Character name consistency
        const characterContradictions = this.detectCharacterNameContradictions(projectData);
        contradictions.push(...characterContradictions);
        
        // Number inconsistencies (dates, ages, quantities)
        const numberContradictions = this.detectNumberContradictions(projectData);
        contradictions.push(...numberContradictions);
        
        // Location/setting inconsistencies
        const locationContradictions = this.detectLocationContradictions(projectData);
        contradictions.push(...locationContradictions);
        
        // Fact contradictions between research and content
        const factContradictions = this.detectFactualContradictions(projectData);
        contradictions.push(...factContradictions);
        
        return contradictions;
    }

    private detectCharacterNameContradictions(projectData: any): Contradiction[] {
        const contradictions: Contradiction[] = [];
        const nameVariations: Record<string, string[]> = {};
        
        // Extract character names from all chapters
        projectData.chapters.forEach((chapter: Chapter) => {
            const content = this.stripHtml(chapter.content);
            const names = this.extractProperNouns(content);
            
            names.forEach(name => {
                const similarNames = this.findSimilarNames(name, Object.keys(nameVariations));
                if (similarNames.length > 0) {
                    const baseName = similarNames[0];
                    if (!nameVariations[baseName]) {
                        nameVariations[baseName] = [baseName];
                    }
                    nameVariations[baseName].push(name);
                } else {
                    nameVariations[name] = [name];
                }
            });
        });
        
        // Find inconsistent character names
        Object.entries(nameVariations).forEach(([baseName, variations]) => {
            if (variations.length > 1) {
                const uniqueVariations = [...new Set(variations)];
                if (uniqueVariations.length > 1) {
                    contradictions.push({
                        id: `char_name_${Date.now()}_${Math.random()}`,
                        type: 'character',
                        severity: 'medium',
                        title: `Inconsistent character name: ${baseName}`,
                        description: `Character name appears with different spellings: ${uniqueVariations.join(', ')}`,
                        sources: this.findNameSources(uniqueVariations, projectData),
                        suggestions: [
                            `Choose one consistent spelling for the character name`,
                            `Consider using find-and-replace to fix all instances`,
                            `Add character name to style guide for future reference`
                        ],
                        confidence: 0.8,
                        category: 'Character Consistency',
                        detected: new Date(),
                        resolved: false
                    });
                }
            }
        });
        
        return contradictions;
    }

    private detectNumberContradictions(projectData: any): Contradiction[] {
        const contradictions: Contradiction[] = [];
        const numbers: Record<string, Array<{ value: string; source: ContradictionSource }>> = {};
        
        // Extract numbers with context
        projectData.chapters.forEach((chapter: Chapter) => {
            const content = this.stripHtml(chapter.content);
            const numberMatches = this.extractNumbersWithContext(content);
            
            numberMatches.forEach(match => {
                const key = match.context.toLowerCase().replace(/[^a-z0-9]/g, '');
                if (!numbers[key]) {
                    numbers[key] = [];
                }
                numbers[key].push({
                    value: match.value,
                    source: {
                        type: 'chapter',
                        id: chapter.id,
                        title: chapter.title,
                        excerpt: match.fullContext,
                        location: `Chapter ${chapter.order}`
                    }
                });
            });
        });
        
        // Check for contradictions
        Object.entries(numbers).forEach(([context, values]) => {
            const uniqueValues = [...new Set(values.map(v => v.value))];
            if (uniqueValues.length > 1) {
                contradictions.push({
                    id: `number_${Date.now()}_${Math.random()}`,
                    type: 'fact',
                    severity: 'high',
                    title: `Contradictory numbers for ${context}`,
                    description: `Different values found: ${uniqueValues.join(', ')}`,
                    sources: values.map(v => v.source),
                    suggestions: [
                        'Verify which number is correct',
                        'Update all instances to use the correct value',
                        'Keep a reference document for important numbers'
                    ],
                    confidence: 0.9,
                    category: 'Factual Accuracy',
                    detected: new Date(),
                    resolved: false
                });
            }
        });
        
        return contradictions;
    }

    private detectLocationContradictions(projectData: any): Contradiction[] {
        const contradictions: Contradiction[] = [];
        const locations: Record<string, Array<{ description: string; source: ContradictionSource }>> = {};
        
        // Extract location descriptions
        projectData.chapters.forEach((chapter: Chapter) => {
            const content = this.stripHtml(chapter.content);
            const locationDescriptions = this.extractLocationDescriptions(content);
            
            locationDescriptions.forEach(desc => {
                const locationName = desc.name.toLowerCase();
                if (!locations[locationName]) {
                    locations[locationName] = [];
                }
                locations[locationName].push({
                    description: desc.description,
                    source: {
                        type: 'chapter',
                        id: chapter.id,
                        title: chapter.title,
                        excerpt: desc.fullContext,
                        location: `Chapter ${chapter.order}`
                    }
                });
            });
        });
        
        // Check for contradictory descriptions
        Object.entries(locations).forEach(([locationName, descriptions]) => {
            if (descriptions.length > 1) {
                const conflicts = this.findConflictingDescriptions(descriptions);
                if (conflicts.length > 0) {
                    contradictions.push({
                        id: `location_${Date.now()}_${Math.random()}`,
                        type: 'setting',
                        severity: 'medium',
                        title: `Contradictory descriptions for ${locationName}`,
                        description: `Found conflicting descriptions of this location`,
                        sources: descriptions.map(d => d.source),
                        suggestions: [
                            'Review all descriptions of this location',
                            'Create a consistent description to use throughout',
                            'Consider whether the location changes over time'
                        ],
                        confidence: 0.7,
                        category: 'Setting Consistency',
                        detected: new Date(),
                        resolved: false
                    });
                }
            }
        });
        
        return contradictions;
    }

    private detectFactualContradictions(projectData: any): Contradiction[] {
        const contradictions: Contradiction[] = [];
        
        // Compare research facts with chapter content
        projectData.research.forEach((researchItem: ResearchItem) => {
            const researchFacts = this.extractFactsFromResearch(researchItem);
            
            projectData.chapters.forEach((chapter: Chapter) => {
                const chapterContent = this.stripHtml(chapter.content);
                const conflictingFacts = this.findConflictingFacts(researchFacts, chapterContent);
                
                conflictingFacts.forEach(conflict => {
                    contradictions.push({
                        id: `fact_${Date.now()}_${Math.random()}`,
                        type: 'research',
                        severity: 'high',
                        title: `Research contradiction: ${conflict.topic}`,
                        description: `Chapter content contradicts research findings`,
                        sources: [
                            {
                                type: 'research',
                                id: researchItem.id,
                                title: researchItem.query,
                                excerpt: conflict.researchExcerpt,
                                location: 'Research Notes'
                            },
                            {
                                type: 'chapter',
                                id: chapter.id,
                                title: chapter.title,
                                excerpt: conflict.chapterExcerpt,
                                location: `Chapter ${chapter.order}`
                            }
                        ],
                        suggestions: [
                            'Verify the accuracy of the research',
                            'Update the chapter content to match verified facts',
                            'Consider if creative license is being taken'
                        ],
                        confidence: 0.6,
                        category: 'Research Accuracy',
                        detected: new Date(),
                        resolved: false
                    });
                });
            });
        });
        
        return contradictions;
    }

    private async detectAIBasedContradictions(textContent: any, projectData: any): Promise<Contradiction[]> {
        try {
            // Import AI service dynamically to avoid circular dependencies
            const { callOpenRouter } = await import('./ai');
            
            const contradictions: Contradiction[] = [];
            
            // Prepare content for AI analysis
            const analysisContent = this.prepareContentForAIAnalysis(textContent);
            
            const prompt = `
Analyze the following book content for contradictions and inconsistencies. Look for:
1. Character inconsistencies (names, descriptions, behaviors)
2. Plot contradictions (events that don't align)
3. Setting/location inconsistencies 
4. Timeline conflicts
5. Factual contradictions
6. Research vs. content mismatches

Content to analyze:
${JSON.stringify(analysisContent, null, 2)}

Return a JSON array of contradictions with this exact format:
[
  {
    "type": "character|plot|setting|timeline|fact|research",
    "severity": "low|medium|high|critical",
    "title": "Brief title describing the contradiction",
    "description": "Detailed description of the inconsistency",
    "evidence": [
      {
        "source": "chapter_id or research_id",
        "excerpt": "Relevant text excerpt",
        "location": "Chapter X or Research Notes"
      }
    ],
    "suggestions": ["suggestion1", "suggestion2"],
    "confidence": 0.8,
    "category": "Specific category"
  }
]

Return ONLY the JSON array, no explanations.`;
            
            const response = await callOpenRouter(prompt, true);
            const aiContradictions = JSON.parse(response);
            
            // Convert AI response to internal format
            aiContradictions.forEach((aiContradiction: any, index: number) => {
                const sources: ContradictionSource[] = aiContradiction.evidence.map((evidence: any) => {
                    const sourceData = this.findSourceData(evidence.source, projectData);
                    return {
                        type: sourceData.type,
                        id: evidence.source,
                        title: sourceData.title,
                        excerpt: evidence.excerpt,
                        location: evidence.location
                    };
                });
                
                contradictions.push({
                    id: `ai_contradiction_${Date.now()}_${index}`,
                    type: aiContradiction.type,
                    severity: aiContradiction.severity,
                    title: aiContradiction.title,
                    description: aiContradiction.description,
                    sources,
                    suggestions: aiContradiction.suggestions || [
                        'Review the identified content for accuracy',
                        'Consider revising for consistency'
                    ],
                    confidence: aiContradiction.confidence || 0.7,
                    category: aiContradiction.category || 'AI Analysis',
                    detected: new Date(),
                    resolved: false
                });
            });
            
            return contradictions;
            
        } catch (error) {
            log.error('AI-based contradiction detection failed', error);
            // Fallback to enhanced rule-based detection
            return this.detectEnhancedRuleBasedContradictions(textContent, projectData);
        }
    }
    
    private prepareContentForAIAnalysis(textContent: any): any {
        return {
            chapters: textContent.chapters.map((chapter: any) => ({
                id: chapter.id,
                title: chapter.title,
                content: chapter.content.substring(0, 2000), // Limit content length for AI analysis
                order: chapter.order
            })),
            research: textContent.research.map((research: any) => ({
                id: research.id,
                query: research.query,
                content: research.content.substring(0, 1000), // Limit content length
                summary: research.summary
            })),
            characters: textContent.characters.slice(0, 10), // Limit to first 10 characters
            plotPoints: textContent.plotPoints.slice(0, 15) // Limit to first 15 plot points
        };
    }
    
    private findSourceData(sourceId: string, projectData: any): { type: 'chapter' | 'research' | 'character' | 'plot'; title: string } {
        // Find source in chapters
        const chapter = projectData.chapters.find((c: any) => c.id === sourceId);
        if (chapter) {
            return { type: 'chapter', title: chapter.title };
        }
        
        // Find source in research
        const research = projectData.research.find((r: any) => r.id === sourceId);
        if (research) {
            return { type: 'research', title: research.query };
        }
        
        // Find source in characters
        const character = projectData.characters?.find((c: any) => c.id === sourceId);
        if (character) {
            return { type: 'character', title: character.name || 'Character' };
        }
        
        // Find source in plot points
        const plotPoint = projectData.plotPoints?.find((p: any) => p.id === sourceId);
        if (plotPoint) {
            return { type: 'plot', title: plotPoint.title || 'Plot Point' };
        }
        
        // Default fallback
        return { type: 'chapter', title: 'Unknown Source' };
    }
    
    private detectEnhancedRuleBasedContradictions(textContent: any, projectData: any): Contradiction[] {
        const contradictions: Contradiction[] = [];
        
        // Enhanced character analysis
        const characterContradictions = this.analyzeCharacterConsistency(textContent);
        contradictions.push(...characterContradictions);
        
        // Enhanced plot analysis
        const plotContradictions = this.analyzePlotConsistency(textContent);
        contradictions.push(...plotContradictions);
        
        // Enhanced setting analysis
        const settingContradictions = this.analyzeSettingConsistency(textContent);
        contradictions.push(...settingContradictions);
        
        return contradictions;
    }
    
    private analyzeCharacterConsistency(textContent: any): Contradiction[] {
        const contradictions: Contradiction[] = [];
        const characterTraits: Record<string, Array<{ trait: string; source: string; chapter: string }>> = {};
        
        // Extract character traits from all chapters
        textContent.chapters.forEach((chapter: any) => {
            const characterMentions = this.extractCharacterTraits(chapter.content, chapter);
            characterMentions.forEach(mention => {
                if (!characterTraits[mention.character]) {
                    characterTraits[mention.character] = [];
                }
                characterTraits[mention.character].push({
                    trait: mention.trait,
                    source: mention.excerpt,
                    chapter: chapter.title
                });
            });
        });
        
        // Check for contradictory traits
        Object.entries(characterTraits).forEach(([character, traits]) => {
            const conflictingTraits = this.findConflictingTraits(traits);
            if (conflictingTraits.length > 0) {
                contradictions.push({
                    id: `char_trait_${Date.now()}_${Math.random()}`,
                    type: 'character',
                    severity: 'medium',
                    title: `Contradictory character traits: ${character}`,
                    description: `Found conflicting descriptions of ${character}'s characteristics`,
                    sources: conflictingTraits.map(trait => ({
                        type: 'chapter' as const,
                        id: `chapter_${trait.chapter}`,
                        title: trait.chapter,
                        excerpt: trait.source,
                        location: trait.chapter
                    })),
                    suggestions: [
                        'Review character descriptions for consistency',
                        'Create a character sheet with definitive traits',
                        'Consider if character development explains the differences'
                    ],
                    confidence: 0.7,
                    category: 'Character Development',
                    detected: new Date(),
                    resolved: false
                });
            }
        });
        
        return contradictions;
    }
    
    private extractCharacterTraits(content: string, chapter: any): Array<{ character: string; trait: string; excerpt: string }> {
        const traits: Array<{ character: string; trait: string; excerpt: string }> = [];
        
        // Simple pattern matching for character descriptions
        const characterNames = this.extractProperNouns(content);
        const traitPatterns = [
            /(\w+)\s+(?:is|was|were)\s+(\w+(?:\s+\w+)?)/gi,
            /(\w+)\s+(?:has|had)\s+([^.]{10,50})/gi,
            /(\w+)'s\s+(\w+(?:\s+\w+)?)/gi
        ];
        
        characterNames.forEach(name => {
            traitPatterns.forEach(pattern => {
                let match;
                const namePattern = new RegExp(pattern.source.replace('\\w+', name), 'gi');
                while ((match = namePattern.exec(content)) !== null) {
                    const trait = match[2]?.trim();
                    if (trait && trait.length > 2) {
                        const index = match.index;
                        const excerpt = content.substring(Math.max(0, index - 30), index + match[0].length + 30);
                        traits.push({
                            character: name,
                            trait,
                            excerpt: excerpt.trim()
                        });
                    }
                }
            });
        });
        
        return traits;
    }
    
    private findConflictingTraits(traits: Array<{ trait: string; source: string; chapter: string }>): Array<{ trait: string; source: string; chapter: string }> {
        const conflicts: Array<{ trait: string; source: string; chapter: string }> = [];
        
        // Define contradictory trait pairs
        const contradictoryPairs = [
            ['tall', 'short'], ['big', 'small'], ['young', 'old'],
            ['kind', 'cruel'], ['brave', 'coward'], ['smart', 'stupid'],
            ['rich', 'poor'], ['happy', 'sad'], ['calm', 'angry']
        ];
        
        for (let i = 0; i < traits.length; i++) {
            for (let j = i + 1; j < traits.length; j++) {
                const trait1 = traits[i].trait.toLowerCase();
                const trait2 = traits[j].trait.toLowerCase();
                
                for (const [word1, word2] of contradictoryPairs) {
                    if ((trait1.includes(word1) && trait2.includes(word2)) ||
                        (trait1.includes(word2) && trait2.includes(word1))) {
                        conflicts.push(traits[i], traits[j]);
                        break;
                    }
                }
            }
        }
        
        return [...new Set(conflicts)];
    }
    
    private analyzePlotConsistency(textContent: any): Contradiction[] {
        const contradictions: Contradiction[] = [];
        
        // Check for plot events that contradict each other
        const events = this.extractPlotEvents(textContent.chapters);
        const eventConflicts = this.findPlotConflicts(events);
        
        eventConflicts.forEach(conflict => {
            contradictions.push({
                id: `plot_${Date.now()}_${Math.random()}`,
                type: 'plot',
                severity: 'high',
                title: `Plot contradiction: ${conflict.event}`,
                description: conflict.description,
                sources: conflict.sources,
                suggestions: [
                    'Review the plot events for logical consistency',
                    'Create a plot outline to track story progression',
                    'Consider if the events can coexist or need revision'
                ],
                confidence: 0.6,
                category: 'Plot Development',
                detected: new Date(),
                resolved: false
            });
        });
        
        return contradictions;
    }
    
    private extractPlotEvents(chapters: any[]): Array<{ event: string; chapter: string; context: string }> {
        const events: Array<{ event: string; chapter: string; context: string }> = [];
        
        chapters.forEach(chapter => {
            // Look for action verbs and significant events
            const eventPatterns = [
                /(\w+)\s+(died|killed|murdered|destroyed|exploded|disappeared)/gi,
                /(\w+)\s+(arrived|left|returned|escaped|fled)/gi,
                /(\w+)\s+(married|divorced|born|graduated)/gi
            ];
            
            eventPatterns.forEach(pattern => {
                let match;
                while ((match = pattern.exec(chapter.content)) !== null) {
                    const event = `${match[1]} ${match[2]}`;
                    const index = match.index;
                    const context = chapter.content.substring(Math.max(0, index - 50), index + match[0].length + 50);
                    
                    events.push({
                        event,
                        chapter: chapter.title,
                        context: context.trim()
                    });
                }
            });
        });
        
        return events;
    }
    
    private findPlotConflicts(events: Array<{ event: string; chapter: string; context: string }>): Array<{ event: string; description: string; sources: ContradictionSource[] }> {
        const conflicts: Array<{ event: string; description: string; sources: ContradictionSource[] }> = [];
        
        // Group events by subject
        const eventsBySubject: Record<string, Array<{ event: string; chapter: string; context: string }>> = {};
        
        events.forEach(event => {
            const subject = event.event.split(' ')[0];
            if (!eventsBySubject[subject]) {
                eventsBySubject[subject] = [];
            }
            eventsBySubject[subject].push(event);
        });
        
        // Check for contradictory events
        Object.entries(eventsBySubject).forEach(([subject, subjectEvents]) => {
            if (subjectEvents.length > 1) {
                const deathEvents = subjectEvents.filter(e => /died|killed|murdered/.test(e.event));
                const aliveEvents = subjectEvents.filter(e => !/died|killed|murdered/.test(e.event));
                
                if (deathEvents.length > 0 && aliveEvents.length > 0) {
                    // Character appears to be both dead and alive
                    conflicts.push({
                        event: subject,
                        description: `${subject} appears to both die and continue acting in the story`,
                        sources: [...deathEvents, ...aliveEvents].map(e => ({
                            type: 'chapter' as const,
                            id: `chapter_${e.chapter}`,
                            title: e.chapter,
                            excerpt: e.context,
                            location: e.chapter
                        }))
                    });
                }
            }
        });
        
        return conflicts;
    }
    
    private analyzeSettingConsistency(textContent: any): Contradiction[] {
        // Enhanced setting analysis would go here
        // For now, return empty array to avoid duplication with existing method
        return [];
    }

    private async detectCrossReferenceContradictions(projectData: any): Promise<Contradiction[]> {
        const contradictions: Contradiction[] = [];
        
        // Check plot point consistency across chapters
        if (projectData.plotPoints && projectData.plotPoints.length > 0) {
            const plotContradictions = this.checkPlotPointConsistency(projectData);
            contradictions.push(...plotContradictions);
        }
        
        return contradictions;
    }

    private async detectTimelineContradictions(projectData: any): Promise<Contradiction[]> {
        const contradictions: Contradiction[] = [];
        
        // Extract timeline events from all chapters
        const timelineEvents = this.extractTimelineEvents(projectData.chapters);
        
        // Check for logical timeline inconsistencies
        const timelineIssues = this.validateTimeline(timelineEvents);
        
        timelineIssues.forEach(issue => {
            contradictions.push({
                id: `timeline_${Date.now()}_${Math.random()}`,
                type: 'timeline',
                severity: 'medium',
                title: `Timeline inconsistency: ${issue.description}`,
                description: issue.details,
                sources: issue.sources,
                suggestions: [
                    'Create a timeline document to track events',
                    'Review the chronology of events',
                    'Consider if time jumps are clearly indicated'
                ],
                confidence: 0.7,
                category: 'Timeline Consistency',
                detected: new Date(),
                resolved: false
            });
        });
        
        return contradictions;
    }

    // Helper methods
    private stripHtml(html: string): string {
        return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    }

    private extractProperNouns(text: string): string[] {
        // Simple regex to find capitalized words (potential proper nouns)
        const matches = text.match(/\b[A-Z][a-z]+\b/g) || [];
        return [...new Set(matches)];
    }

    private findSimilarNames(name: string, existingNames: string[]): string[] {
        return existingNames.filter(existing => 
            this.calculateSimilarity(name.toLowerCase(), existing.toLowerCase()) > 0.8
        );
    }

    private calculateSimilarity(str1: string, str2: string): number {
        // Simple Levenshtein distance-based similarity
        const longer = str1.length > str2.length ? str1 : str2;
        const shorter = str1.length > str2.length ? str2 : str1;
        
        if (longer.length === 0) return 1.0;
        
        const distance = this.levenshteinDistance(longer, shorter);
        return (longer.length - distance) / longer.length;
    }

    private levenshteinDistance(str1: string, str2: string): number {
        const matrix = [];
        
        for (let i = 0; i <= str2.length; i++) {
            matrix[i] = [i];
        }
        
        for (let j = 0; j <= str1.length; j++) {
            matrix[0][j] = j;
        }
        
        for (let i = 1; i <= str2.length; i++) {
            for (let j = 1; j <= str1.length; j++) {
                if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j - 1] + 1,
                        matrix[i][j - 1] + 1,
                        matrix[i - 1][j] + 1
                    );
                }
            }
        }
        
        return matrix[str2.length][str1.length];
    }

    private findNameSources(variations: string[], projectData: any): ContradictionSource[] {
        const sources: ContradictionSource[] = [];
        
        projectData.chapters.forEach((chapter: Chapter) => {
            const content = this.stripHtml(chapter.content);
            variations.forEach(variation => {
                if (content.includes(variation)) {
                    const index = content.indexOf(variation);
                    const excerpt = content.substring(Math.max(0, index - 50), index + variation.length + 50);
                    
                    sources.push({
                        type: 'chapter',
                        id: chapter.id,
                        title: chapter.title,
                        excerpt: `...${excerpt}...`,
                        location: `Chapter ${chapter.order}`
                    });
                }
            });
        });
        
        return sources;
    }

    private extractNumbersWithContext(text: string): Array<{ value: string; context: string; fullContext: string }> {
        const numbers: Array<{ value: string; context: string; fullContext: string }> = [];
        
        // Regex patterns for numbers with context
        const patterns = [
            /(\w+\s+(?:is|was|were|are)\s+)(\d+)(\s+\w+)/gi,
            /(\w+\s+)(\d+)(\s+(?:years|months|days|hours|minutes))/gi,
            /(\$)(\d+(?:,\d{3})*(?:\.\d{2})?)/gi,
            /(chapter\s+)(\d+)/gi,
            /(page\s+)(\d+)/gi
        ];
        
        patterns.forEach(pattern => {
            let match;
            while ((match = pattern.exec(text)) !== null) {
                const fullMatch = match[0];
                const beforeContext = text.substring(Math.max(0, match.index - 30), match.index);
                const afterContext = text.substring(match.index + fullMatch.length, match.index + fullMatch.length + 30);
                
                numbers.push({
                    value: match[2],
                    context: (match[1] + match[3]).trim(),
                    fullContext: `${beforeContext}${fullMatch}${afterContext}`
                });
            }
        });
        
        return numbers;
    }

    private extractLocationDescriptions(text: string): Array<{ name: string; description: string; fullContext: string }> {
        const locations: Array<{ name: string; description: string; fullContext: string }> = [];
        
        // Simple pattern matching for location descriptions
        // This would be much more sophisticated in a real implementation
        const locationPattern = /(The\s+)?([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(is|was|were|are)\s+([^.]{10,100}\.)/gi;
        
        let match;
        while ((match = locationPattern.exec(text)) !== null) {
            const locationName = match[2];
            const description = match[4];
            const fullMatch = match[0];
            const index = match.index;
            const beforeContext = text.substring(Math.max(0, index - 50), index);
            const afterContext = text.substring(index + fullMatch.length, index + fullMatch.length + 50);
            
            locations.push({
                name: locationName,
                description: description.trim(),
                fullContext: `${beforeContext}${fullMatch}${afterContext}`
            });
        }
        
        return locations;
    }

    private findConflictingDescriptions(descriptions: Array<{ description: string; source: ContradictionSource }>): any[] {
        // Simplified conflict detection - in reality, this would use NLP to understand semantic conflicts
        const conflicts: any[] = [];
        
        for (let i = 0; i < descriptions.length; i++) {
            for (let j = i + 1; j < descriptions.length; j++) {
                const desc1 = descriptions[i].description.toLowerCase();
                const desc2 = descriptions[j].description.toLowerCase();
                
                // Check for contradictory adjectives
                const contradictoryPairs = [
                    ['large', 'small'], ['big', 'small'], ['huge', 'tiny'],
                    ['old', 'new'], ['ancient', 'modern'], ['dark', 'bright'],
                    ['empty', 'full'], ['crowded', 'empty'], ['quiet', 'noisy']
                ];
                
                for (const [word1, word2] of contradictoryPairs) {
                    if (desc1.includes(word1) && desc2.includes(word2)) {
                        conflicts.push({ desc1, desc2, conflict: `${word1} vs ${word2}` });
                    } else if (desc1.includes(word2) && desc2.includes(word1)) {
                        conflicts.push({ desc1, desc2, conflict: `${word2} vs ${word1}` });
                    }
                }
            }
        }
        
        return conflicts;
    }

    private extractFactsFromResearch(researchItem: ResearchItem): Array<{ fact: string; context: string }> {
        const facts: Array<{ fact: string; context: string }> = [];
        
        // Extract factual statements from research content
        const sentences = researchItem.content.split(/[.!?]+/).filter(s => s.trim().length > 0);
        
        sentences.forEach(sentence => {
            const trimmed = sentence.trim();
            // Look for factual patterns (dates, numbers, definitive statements)
            if (this.isFactualStatement(trimmed)) {
                facts.push({
                    fact: trimmed,
                    context: researchItem.summary
                });
            }
        });
        
        return facts;
    }

    private isFactualStatement(sentence: string): boolean {
        // Simple heuristics to identify factual statements
        const factualPatterns = [
            /\d{4}/, // Years
            /\$\d+/, // Money
            /\d+%/, // Percentages
            /\b(is|was|were|are)\s+\d+/, // Numbers with verbs
            /\b(born|died|founded|established|built|created)\b/i // Historical events
        ];
        
        return factualPatterns.some(pattern => pattern.test(sentence));
    }

    private findConflictingFacts(researchFacts: Array<{ fact: string; context: string }>, chapterContent: string): Array<{ topic: string; researchExcerpt: string; chapterExcerpt: string }> {
        const conflicts: Array<{ topic: string; researchExcerpt: string; chapterExcerpt: string }> = [];
        
        researchFacts.forEach(researchFact => {
            // Look for contradictions in chapter content
            // This is a simplified implementation
            const factSubjects = this.extractSubjects(researchFact.fact);
            
            factSubjects.forEach(subject => {
                const chapterSentences = chapterContent.split(/[.!?]+/).filter(s => s.includes(subject));
                
                chapterSentences.forEach(chapterSentence => {
                    if (this.isPotentialContradiction(researchFact.fact, chapterSentence)) {
                        conflicts.push({
                            topic: subject,
                            researchExcerpt: researchFact.fact,
                            chapterExcerpt: chapterSentence.trim()
                        });
                    }
                });
            });
        });
        
        return conflicts;
    }

    private extractSubjects(sentence: string): string[] {
        // Simple subject extraction - would use proper NLP in production
        const words = sentence.split(/\s+/);
        const subjects = words.filter(word => /^[A-Z][a-z]+$/.test(word));
        return [...new Set(subjects)];
    }

    private isPotentialContradiction(researchFact: string, chapterSentence: string): boolean {
        // Very simplified contradiction detection
        // In reality, this would use semantic analysis
        const researchNumbers = researchFact.match(/\d+/g) || [];
        const chapterNumbers = chapterSentence.match(/\d+/g) || [];
        
        // Check if same subjects have different numbers
        return researchNumbers.length > 0 && chapterNumbers.length > 0 && 
               researchNumbers.some(rn => !chapterNumbers.includes(rn));
    }

    private checkPlotPointConsistency(projectData: any): Contradiction[] {
        // Check if plot points are consistently referenced across chapters
        return []; // Simplified for now
    }

    private extractTimelineEvents(chapters: Chapter[]): Array<{ event: string; timestamp: string; source: ContradictionSource }> {
        const events: Array<{ event: string; timestamp: string; source: ContradictionSource }> = [];
        
        chapters.forEach(chapter => {
            const content = this.stripHtml(chapter.content);
            const timeReferences = this.extractTimeReferences(content);
            
            timeReferences.forEach(ref => {
                events.push({
                    event: ref.event,
                    timestamp: ref.time,
                    source: {
                        type: 'chapter',
                        id: chapter.id,
                        title: chapter.title,
                        excerpt: ref.context,
                        location: `Chapter ${chapter.order}`
                    }
                });
            });
        });
        
        return events;
    }

    private extractTimeReferences(text: string): Array<{ event: string; time: string; context: string }> {
        const timeRefs: Array<{ event: string; time: string; context: string }> = [];
        
        // Patterns for time references
        const patterns = [
            /(\w+\s+)(yesterday|today|tomorrow|last week|next week|last month|next month)(\s+\w+)/gi,
            /(at\s+)(\d{1,2}:\d{2}(?:\s*[ap]m)?)/gi,
            /(in\s+)(\d{4}|the\s+\d{4}s)/gi
        ];
        
        patterns.forEach(pattern => {
            let match;
            while ((match = pattern.exec(text)) !== null) {
                const fullMatch = match[0];
                const index = match.index;
                const beforeContext = text.substring(Math.max(0, index - 30), index);
                const afterContext = text.substring(index + fullMatch.length, index + fullMatch.length + 30);
                
                timeRefs.push({
                    event: (match[1] + match[3] || '').trim(),
                    time: match[2],
                    context: `${beforeContext}${fullMatch}${afterContext}`
                });
            }
        });
        
        return timeRefs;
    }

    private validateTimeline(events: Array<{ event: string; timestamp: string; source: ContradictionSource }>): Array<{ description: string; details: string; sources: ContradictionSource[] }> {
        // Simplified timeline validation
        // In reality, this would parse dates/times and check for logical consistency
        return [];
    }

    private deduplicateContradictions(contradictions: Contradiction[]): Contradiction[] {
        // Remove similar contradictions
        const seen = new Set();
        return contradictions.filter(contradiction => {
            const key = `${contradiction.type}_${contradiction.title}`;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });
    }

    private calculateConsistencyScores(contradictions: Contradiction[], projectData: any) {
        const totalElements = projectData.chapters.length + projectData.research.length;
        const contradictionCount = contradictions.length;
        
        const overall = Math.max(0, 100 - (contradictionCount * 5));
        
        const byType = {
            character: 100 - (contradictions.filter(c => c.type === 'character').length * 10),
            plot: 100 - (contradictions.filter(c => c.type === 'plot').length * 10),
            setting: 100 - (contradictions.filter(c => c.type === 'setting').length * 10),
            timeline: 100 - (contradictions.filter(c => c.type === 'timeline').length * 10)
        };
        
        return {
            overall,
            character: Math.max(0, byType.character),
            plot: Math.max(0, byType.plot),
            setting: Math.max(0, byType.setting),
            timeline: Math.max(0, byType.timeline)
        };
    }

    private generateSummary(contradictions: Contradiction[]) {
        const bySeverity: Record<string, number> = {};
        const byType: Record<string, number> = {};
        
        contradictions.forEach(c => {
            bySeverity[c.severity] = (bySeverity[c.severity] || 0) + 1;
            byType[c.type] = (byType[c.type] || 0) + 1;
        });
        
        return {
            total: contradictions.length,
            bySeverity,
            byType,
            resolved: contradictions.filter(c => c.resolved).length,
            pending: contradictions.filter(c => !c.resolved).length
        };
    }

    private generateRecommendations(contradictions: Contradiction[], consistency: any): string[] {
        const recommendations: string[] = [];
        
        if (consistency.overall < 70) {
            recommendations.push('Consider creating a story bible to track important details');
        }
        
        if (consistency.character < 80) {
            recommendations.push('Review character descriptions and names for consistency');
        }
        
        if (consistency.timeline < 80) {
            recommendations.push('Create a detailed timeline to track story events');
        }
        
        if (contradictions.some(c => c.type === 'research' && c.severity === 'high')) {
            recommendations.push('Verify research facts against story content');
        }
        
        if (recommendations.length === 0) {
            recommendations.push('Great job! Your story consistency is excellent.');
        }
        
        return recommendations;
    }

    async resolveContradiction(contradictionId: string, resolution: string): Promise<void> {
        // In a real implementation, this would update the contradiction status
        log.debug(`Resolving contradiction ${contradictionId}`, { resolution });
    }

    async addUserNote(contradictionId: string, note: string): Promise<void> {
        // In a real implementation, this would add a user note to the contradiction
        log.debug(`Adding note to contradiction ${contradictionId}`, { note });
    }
}

export const contradictionService = new ContradictionDetectionService();