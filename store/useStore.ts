import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { Project, Chapter, VisualRecommendation, Visual, GeneratedImage, PlotPoint, ResearchItem, ResearchType, FactCheckResult, ResearchQuery, ResearchFolder, Citation, CitationStyle, ThematicTag, ResearchTimeline, ResearchMindMap, ResearchAttachment, ResearchContradiction, Settings } from '../types';
import { ProjectStatus, ChapterStatus, ResearchConfidence, SourceCredibility, CitationStyle as CS, ResearchFolderType } from '../types';
import * as ai from '../services/ai';
import { toast } from '../services/toast';
import { log } from '../services/logger';

// FIX: Created full content for store/useStore.ts to provide application state management.

interface BookCraftState {
    projects: Record<string, Project>;
    activeProjectId: string | null;
    isCreateModalOpen: boolean;
    isLoading: boolean; // For global loading like analysis
    generatingVisualFor: string | null; // ID of recommendation being generated
    isGeneratingImage: boolean;
    isSuggestingVisual: boolean; // For the new context menu visual suggestion feature
    isAnalyzingChapter: string | null; // Chapter ID being analyzed for visuals

    // Settings state
    settings: Settings | null;

    // Research state
    activeResearchQuery: string | null;
    isResearching: boolean;
    isFactChecking: boolean;
    researchSidebarOpen: boolean;
    activeResearchFolder: string | null;
    isGeneratingCitation: boolean;
    isAnalyzingThemes: boolean;
    isDetectingContradictions: boolean;
    selectedResearchItems: string[];
    researchView: 'grid' | 'list' | 'timeline' | 'mindmap';
    researchFilters: {
        confidence?: ResearchConfidence;
        type?: ResearchType;
        tags?: string[];
        verified?: boolean;
        dateRange?: { start: Date; end: Date };
        folderId?: string;
    };
}

interface BookCraftActions {
    // Project Management
    addProject: (newProjectData: Pick<Project, 'title' | 'genre' | 'visualStyle'>) => void;
    updateProject: (id: string, updates: Partial<Pick<Project, 'title' | 'genre' | 'visualStyle' | 'status'>>) => void;
    deleteProject: (id: string) => void;
    setActiveProject: (id: string | null) => void;
    toggleCreateModal: (isOpen: boolean) => void;
    closeAllModals: () => void;
    initializeApp: () => void;

    // Settings Management
    updateSettings: (newSettings: Partial<Settings>) => void;

    // Chapter Management
    addChapter: () => void;
    updateChapter: (chapterId: string, updates: Partial<Chapter>) => void;
    deleteChapter: (chapterId: string) => void;
    addChaptersFromPlan: (titles: string[]) => void;
    reorderChapters: (sourceIndex: number, destinationIndex: number) => void;

    // Plot Management
    generatePlotPoints: (prompt: string) => Promise<void>;
    addPlotPoint: () => void;
    updatePlotPoint: (plotPointId: string, updates: Partial<PlotPoint>) => void;
    deletePlotPoint: (plotPointId: string) => void;
    reorderPlotPoints: (sourceIndex: number, destinationIndex: number) => void;
    
    // AI Actions
    planChapters: (prompt: string) => Promise<string[]>;
    regenerateChapterTitle: (originalPrompt: string, titleToReplace: string) => Promise<string>;
    generateChapterContent: (chapterId: string, prompt: string, wordCount?: string, style?: string) => Promise<string>;
    getAIAssistantResponse: (chapterId: string, prompt: string) => Promise<string>;
    getAIContextMenuResponse: (text: string, action: string) => Promise<string>;
    combineChapterContent: (originalContent: string, newContent: string) => Promise<string>;
    generateChapterStructure: (chapterId: string) => Promise<void>;
    refineGeneratedText: (originalText: string, refinementPrompt: string) => Promise<string>;
    cleanupAndFormatText: (text: string) => Promise<string>;
    
    // Visuals Management
    startAnalysis: () => Promise<void>;
    analyzeChapterForVisuals: (chapterId: string) => Promise<void>;
    acceptRecommendation: (rec: VisualRecommendation) => Promise<void>;
    rejectRecommendation: (recId: string) => void;
    generateImage: (prompt: string) => Promise<void>;
    suggestVisualForText: (text: string) => Promise<void>;

    // Research Actions
    performResearch: (query: string, type: ResearchType, chapterId?: string) => Promise<void>;
    saveResearchItem: (item: ResearchItem) => void;
    deleteResearchItem: (itemId: string) => void;
    linkResearchToChapter: (researchId: string, chapterId: string) => void;
    bookmarkResearchItem: (itemId: string) => void;
    summarizeWebContent: (url: string) => Promise<ResearchItem>;
    analyzeDocumentFile: (file: File) => Promise<ResearchItem>;

    // Folder Management
    createResearchFolder: (name: string, type: ResearchFolderType, parentId?: string) => void;
    updateResearchFolder: (folderId: string, updates: Partial<ResearchFolder>) => void;
    deleteResearchFolder: (folderId: string) => void;
    moveResearchToFolder: (researchId: string, folderId: string) => void;

    // Citation Management
    generateCitation: (researchId: string, sourceId: string, style: CitationStyle) => Promise<void>;
    formatBibliography: (style: CitationStyle) => string[];
    insertCitation: (chapterId: string, citationId: string, position: number) => void;

    // Advanced Analysis
    analyzeResearchThemes: () => Promise<void>;
    detectContradictions: () => Promise<void>;
    generateResearchSuggestions: (chapterId: string) => Promise<string[]>;
    createThematicTimeline: (themeTag: string) => Promise<void>;
    createResearchMindMap: (centerTopic: string, researchIds: string[]) => Promise<void>;

    // Fact-checking Actions
    verifyTextAccuracy: (text: string, chapterId: string) => Promise<void>;
    acceptFactCheck: (factCheckId: string) => void;
    dismissFactCheck: (factCheckId: string) => void;
    batchFactCheck: (chapterIds: string[]) => Promise<void>;

    // Organization Actions
    addResearchTag: (tag: string) => void;
    filterResearchByTag: (tag: string) => ResearchItem[];
    searchResearch: (searchTerm: string) => ResearchItem[];
    setResearchFilters: (filters: Partial<BookCraftState['researchFilters']>) => void;
    clearResearchFilters: () => void;
    selectResearchItems: (itemIds: string[]) => void;
    toggleResearchItemSelection: (itemId: string) => void;

    // UI Actions
    toggleResearchSidebar: (open: boolean) => void;
    setActiveResearchQuery: (queryId: string | null) => void;
    setActiveResearchFolder: (folderId: string | null) => void;
    setResearchView: (view: 'grid' | 'list' | 'timeline' | 'mindmap') => void;
}

export const useBookCraftStore = create<BookCraftState & BookCraftActions>()(
    persist(
        immer((set, get) => ({
            // STATE
            projects: {} as Record<string, Project>,
            activeProjectId: null,
            isCreateModalOpen: false,
            isLoading: false,
            generatingVisualFor: null,
            isGeneratingImage: false,
            isSuggestingVisual: false,
            isAnalyzingChapter: null,

            // Settings state
            settings: null,

            // Research state
            activeResearchQuery: null,
            isResearching: false,
            isFactChecking: false,
            researchSidebarOpen: false,
            activeResearchFolder: null,
            isGeneratingCitation: false,
            isAnalyzingThemes: false,
            isDetectingContradictions: false,
            selectedResearchItems: [],
            researchView: 'list' as const,
            researchFilters: {},

            // ACTIONS
            // Project Management
            addProject: (newProjectData) => {
                const id = `proj_${Date.now()}`;
                const newProject: Project = {
                    ...newProjectData,
                    id,
                    status: ProjectStatus.Draft,
                    createdAt: new Date(),
                    chapters: [],
                    plotPoints: [],
                    recommendations: [],
                    visuals: [],
                    generatedImages: [],
                    research: [],
                    factChecks: [],
                    researchQueries: [],
                    researchTags: [],
                    researchFolders: [],
                    citations: [],
                    thematicTags: [],
                    researchTimelines: [],
                    researchMindMaps: [],
                    researchSettings: {
                        defaultCitationStyle: CS.APA,
                        autoFactCheck: false,
                        contradictionDetection: true,
                        researchSuggestions: true
                    }
                };
                set((state) => {
                    state.projects[id] = newProject;
                    // Automatically set the new project as active
                    state.activeProjectId = id;
                });
            },
            updateProject: (id, updates) => {
                set((state) => {
                    const project = state.projects[id];
                    if (project) {
                        Object.assign(project, updates);
                    }
                });
            },
            deleteProject: (id) => {
                set((state) => {
                    delete state.projects[id];
                    if (state.activeProjectId === id) {
                        state.activeProjectId = null;
                    }
                });
            },
            setActiveProject: (id) => {
                set({ activeProjectId: id });
            },
            toggleCreateModal: (isOpen) => {
                set((state) => {
                    state.isCreateModalOpen = isOpen;
                    // If closing the modal, ensure any loading states related to project creation are cleared
                    if (!isOpen) {
                        state.isLoading = false;
                    }
                });
            },
            closeAllModals: () => {
                set((state) => {
                    // Reset all modal and UI states to their default values
                    state.isCreateModalOpen = false;
                    state.isLoading = false;
                    state.generatingVisualFor = null;
                    state.isGeneratingImage = false;
                    state.isSuggestingVisual = false;
                    state.isAnalyzingChapter = null;
                    state.isResearching = false;
                    state.isFactChecking = false;
                    state.isGeneratingCitation = false;
                    state.isAnalyzingThemes = false;
                    state.isDetectingContradictions = false;
                    state.selectedResearchItems = [];
                    // Note: We keep researchSidebarOpen, activeResearchQuery, activeResearchFolder
                    // as these might be part of the workflow state users want to maintain
                });
            },
            initializeApp: () => {
                // Initialize the app with clean UI state
                // This is called on app startup to ensure no persisted UI state causes issues
                set((state) => {
                    // Reset all modal and UI states to defaults
                    state.isCreateModalOpen = false;
                    state.isLoading = false;
                    state.generatingVisualFor = null;
                    state.isGeneratingImage = false;
                    state.isSuggestingVisual = false;
                    state.isAnalyzingChapter = null;
                    state.isResearching = false;
                    state.isFactChecking = false;
                    state.isGeneratingCitation = false;
                    state.isAnalyzingThemes = false;
                    state.isDetectingContradictions = false;
                    state.selectedResearchItems = [];

                    // Initialize settings if they don't exist
                    if (!state.settings) {
                        state.settings = {
                            // Default settings can be added here
                        };
                    }
                });
            },

            // Settings Management
            updateSettings: (newSettings) => {
                set((state) => {
                    state.settings = { ...state.settings, ...newSettings };
                });
            },

            // Chapter Management
            addChapter: () => {
                const projectId = get().activeProjectId;
                if (!projectId) return;

                set(state => {
                    const project = state.projects[projectId];
                    if(project) {
                        const newChapter: Chapter = {
                            id: `chap_${Date.now()}`,
                            title: `New Chapter ${project.chapters.length + 1}`,
                            content: '',
                            status: ChapterStatus.Idea,
                            order: project.chapters.length,
                            notes: '',
                            structure: [],
                        };
                        project.chapters.push(newChapter);
                    }
                });
            },
            updateChapter: (chapterId, updates) => {
                const projectId = get().activeProjectId;
                if (!projectId) return;

                set(state => {
                    const project = state.projects[projectId];
                    if (project) {
                        const chapter = project.chapters.find(c => c.id === chapterId);
                        if (chapter) {
                            Object.assign(chapter, updates);
                        }
                    }
                });
            },
            deleteChapter: (chapterId) => {
                const projectId = get().activeProjectId;
                if (!projectId) return;
                 set(state => {
                    const project = state.projects[projectId];
                    if (project) {
                        project.chapters = project.chapters.filter(c => c.id !== chapterId);
                    }
                });
            },
            addChaptersFromPlan: (titles) => {
                const projectId = get().activeProjectId;
                if (!projectId) return;
                set(state => {
                    const project = state.projects[projectId];
                    if (project) {
                        const existingOrder = project.chapters.length;
                        const newChapters: Chapter[] = titles.map((title, index) => ({
                            id: `chap_${Date.now()}_${index}`,
                            title,
                            content: '',
                            status: ChapterStatus.Idea,
                            order: existingOrder + index,
                            notes: '',
                            structure: [],
                        }));
                        project.chapters.push(...newChapters);
                    }
                });
            },
            reorderChapters: (sourceIndex: number, destinationIndex: number) => {
                const projectId = get().activeProjectId;
                if (!projectId) return;
                set(state => {
                    const project = state.projects[projectId];
                    if (project) {
                        const orderedChapters = [...project.chapters].sort((a, b) => a.order - b.order);
                        
                        const [removed] = orderedChapters.splice(sourceIndex, 1);
                        orderedChapters.splice(destinationIndex, 0, removed);
                        
                        project.chapters = orderedChapters.map((chapter, index) => ({
                            ...chapter,
                            order: index,
                        }));
                    }
                });
            },

             // Plot Management
            generatePlotPoints: async (prompt) => {
                const projectId = get().activeProjectId;
                if (!projectId) return;

                const plotPoints = await ai.generatePlotPoints(prompt);
                const newPlotPoints = plotPoints.map((pp, index) => ({
                    ...pp,
                    id: `plot_${Date.now()}_${index}`,
                    order: index
                }));

                set(state => {
                    if (state.projects[projectId]) {
                        state.projects[projectId]!.plotPoints = newPlotPoints;
                    }
                });
            },
            addPlotPoint: () => {
                const projectId = get().activeProjectId;
                if (!projectId) return;
                set(state => {
                    const project = state.projects[projectId];
                    if (project) {
                        const newPoint: PlotPoint = {
                            id: `plot_${Date.now()}`,
                            title: 'New Plot Point',
                            description: '',
                            order: project.plotPoints.length,
                        };
                        project.plotPoints.push(newPoint);
                    }
                });
            },
            updatePlotPoint: (plotPointId, updates) => {
                const projectId = get().activeProjectId;
                if (!projectId) return;
                set(state => {
                    const project = state.projects[projectId];
                    const point = project?.plotPoints.find(p => p.id === plotPointId);
                    if (point) {
                        Object.assign(point, updates);
                    }
                });
            },
            deletePlotPoint: (plotPointId) => {
                const projectId = get().activeProjectId;
                if (!projectId) return;
                set(state => {
                    const project = state.projects[projectId];
                    if (project) {
                        project.plotPoints = project.plotPoints.filter(p => p.id !== plotPointId);
                    }
                });
            },
            reorderPlotPoints: (sourceIndex, destinationIndex) => {
                const projectId = get().activeProjectId;
                if (!projectId || sourceIndex === destinationIndex) return;

                set(state => {
                    const project = state.projects[projectId];
                    if (project && project.plotPoints) {
                        // Sort by order first to ensure we're working with the correct indices
                        const ordered = [...project.plotPoints].sort((a, b) => a.order - b.order);

                        // Perform the reorder
                        const [removed] = ordered.splice(sourceIndex, 1);
                        ordered.splice(destinationIndex, 0, removed);

                        // Update order values in place to avoid creating new objects
                        ordered.forEach((point, index) => {
                            point.order = index;
                        });

                        // Replace the entire array at once
                        project.plotPoints = ordered;
                    }
                });
            },
            
            // AI Actions
            planChapters: async (prompt) => {
                return ai.planChapters(prompt);
            },
            regenerateChapterTitle: async (originalPrompt, titleToReplace) => {
                return ai.regenerateChapterTitle(originalPrompt, titleToReplace);
            },
            generateChapterContent: async (chapterId, prompt, wordCount, style) => {
                const projectId = get().activeProjectId;
                if (!projectId) throw new Error("No active project");

                const project = get().projects[projectId];
                const chapter = project.chapters.find(c => c.id === chapterId);
                if (!chapter) throw new Error("Chapter not found");
                
                return await ai.generateChapterContent(project, chapter, prompt, wordCount, style);
            },
            getAIAssistantResponse: async (chapterId, prompt) => {
                const projectId = get().activeProjectId;
                if (!projectId) throw new Error("No active project");
                const project = get().projects[projectId];
                const chapter = project.chapters.find(c => c.id === chapterId);
                if (!chapter) throw new Error("Chapter not found");

                return ai.getAIAssistantResponse(chapter, prompt);
            },
             getAIContextMenuResponse: async (text, action) => {
                return ai.getAIContextMenuResponse(text, action);
            },
            combineChapterContent: async (originalContent, newContent) => {
                return ai.combineChapterContent(originalContent, newContent);
            },
            generateChapterStructure: async (chapterId: string) => {
                const projectId = get().activeProjectId;
                if (!projectId) return;
                const project = get().projects[projectId];
                const chapter = project.chapters.find(c => c.id === chapterId);
                if (!chapter || !chapter.content) return;

                const structure = await ai.generateChapterStructure(chapter.content);
                get().updateChapter(chapterId, { structure });
            },
            refineGeneratedText: async (originalText, refinementPrompt) => {
                return ai.refineGeneratedText(originalText, refinementPrompt);
            },
            cleanupAndFormatText: async (text) => {
                return ai.cleanupAndFormatText(text);
            },

            // Visuals Management
            startAnalysis: async () => {
                const projectId = get().activeProjectId;
                if (!projectId) return;

                set({ isLoading: true });
                get().updateProject(projectId, { status: ProjectStatus.Analyzing });

                try {
                    const project = get().projects[projectId];
                    const manuscript = project.chapters
                        .sort((a,b) => a.order - b.order)
                        .map(c => `## ${c.title}\n${c.content}`)
                        .join('\n\n');
                    
                    const recommendations = await ai.analyzeForVisuals(manuscript);
                    
                    set(state => {
                        const currentProject = state.projects[projectId];
                        if (currentProject) {
                            const existingContexts = new Set(currentProject.recommendations.map(r => r.context));
                            const newRecs = recommendations
                                .filter(r => !existingContexts.has(r.context))
                                .map(r => ({ ...r, id: `rec_${Date.now()}_${Math.random()}`}));
                            
                            currentProject.recommendations = [...currentProject.recommendations, ...newRecs];
                            currentProject.status = ProjectStatus.Review;
                        }
                    });
                } catch (error) {
                    log.storeError('Project analysis failed', error as Error);
                    toast.error('Analysis Failed', 'Sorry, there was an error analyzing your manuscript.');
                } finally {
                    set({ isLoading: false });
                    const status = get().projects[projectId]?.status;
                    if (status === ProjectStatus.Analyzing) {
                         get().updateProject(projectId, { status: ProjectStatus.Review });
                    }
                }
            },
            analyzeChapterForVisuals: async (chapterId: string) => {
                const projectId = get().activeProjectId;
                if (!projectId) return;

                set({ isAnalyzingChapter: chapterId });
                try {
                    const project = get().projects[projectId];
                    const chapter = project.chapters.find(c => c.id === chapterId);
                    if (!chapter) throw new Error("Chapter not found");

                    const recommendations = await ai.analyzeChapterForVisuals(chapter.content, chapter.title);
                    
                    set(state => {
                        const currentProject = state.projects[projectId];
                        if (currentProject) {
                            const existingContexts = new Set(currentProject.recommendations.map(r => r.context));
                            const newRecs = recommendations
                                .filter(r => !existingContexts.has(r.context))
                                .map(r => ({ ...r, id: `rec_${Date.now()}_${Math.random()}`}));
                            
                            currentProject.recommendations.push(...newRecs);
                            toast.success('Visual Analysis Complete', `${newRecs.length} new visual suggestion(s) have been added to the 'Visuals' tab!`);
                        }
                    });
                } catch (error) {
                    log.storeError('Chapter analysis failed', error as Error);
                    toast.error('Analysis Failed', 'Sorry, there was an error analyzing this chapter.');
                } finally {
                    set({ isAnalyzingChapter: null });
                }
            },
            acceptRecommendation: async (rec) => {
                const projectId = get().activeProjectId;
                if (!projectId) return;

                set({ generatingVisualFor: rec.id });
                try {
                    const mermaidCode = await ai.generateVisual(rec);
                    const newVisual: Visual = {
                        id: `vis_${Date.now()}`,
                        recommendationId: rec.id,
                        type: rec.type,
                        content: { mermaidCode },
                        pageNumber: rec.pageNumber,
                    };

                    set(state => {
                        const project = state.projects[projectId];
                        if (project) {
                           project.visuals.push(newVisual);
                           project.recommendations = project.recommendations.filter(r => r.id !== rec.id);
                        }
                    });

                } catch (error) {
                    log.storeError('Visual recommendation acceptance failed', error as Error);
                    toast.error('Visual Generation Failed', 'Sorry, there was an error generating this visual.');
                } finally {
                    set({ generatingVisualFor: null });
                }
            },
            rejectRecommendation: (recId) => {
                const projectId = get().activeProjectId;
                if (!projectId) return;
                 set(state => {
                    const project = state.projects[projectId];
                    if (project) {
                        project.recommendations = project.recommendations.filter(r => r.id !== recId);
                    }
                });
            },
            generateImage: async (prompt) => {
                const projectId = get().activeProjectId;
                if (!projectId) return;
                set({ isGeneratingImage: true });
                try {
                    const base64Image = await ai.generateImage(prompt);
                    const newImage: GeneratedImage = {
                        id: `img_${Date.now()}`,
                        prompt,
                        base64Image,
                    };
                    set(state => {
                        const project = state.projects[projectId];
                        if (project) {
                            project.generatedImages.unshift(newImage);
                        }
                    });
                } catch (error) {
                    log.storeError('Image generation failed', error as Error);
                    toast.error('Image Generation Failed', 'Sorry, there was an error generating the image.');
                } finally {
                    set({ isGeneratingImage: false });
                }
            },
            suggestVisualForText: async (text) => {
                const projectId = get().activeProjectId;
                if (!projectId) return;
                set({ isSuggestingVisual: true });
                try {
                    const suggestion = await ai.generateVisualSuggestion(text);
                    if (suggestion.type === 'image') {
                        const base64Image = await ai.generateImage(suggestion.prompt);
                        const newImage: GeneratedImage = { id: `img_${Date.now()}`, prompt: suggestion.prompt, base64Image };
                        set(state => {
                            state.projects[projectId]?.generatedImages.unshift(newImage);
                        });
                        toast.success('Image Generated', 'An image has been generated and added to your Visuals library!');
                    } else if (suggestion.type === 'diagram' && suggestion.diagramType) {
                        const mockRec: VisualRecommendation = {
                            id: 'temp',
                            type: suggestion.diagramType,
                            reasoning: suggestion.reasoning,
                            context: text,
                            pageNumber: 0
                        };
                        const mermaidCode = await ai.generateVisual(mockRec);
                        const newVisual: Visual = {
                            id: `vis_${Date.now()}`,
                            recommendationId: 'from-suggestion',
                            type: suggestion.diagramType,
                            content: { mermaidCode },
                            pageNumber: 0,
                        };
                         set(state => {
                            state.projects[projectId]?.visuals.push(newVisual);
                        });
                        toast.success('Diagram Generated', 'A diagram has been generated and added to your Visuals library!');
                    }
                } catch (error) {
                     log.storeError('Visual suggestion failed', error as Error);
                     toast.error('Visual Creation Failed', 'Sorry, there was an error creating the visual.');
                } finally {
                    set({ isSuggestingVisual: false });
                }
            },

            // Research Actions
            performResearch: async (query, type, chapterId) => {
                const projectId = get().activeProjectId;
                if (!projectId) return;

                set({ isResearching: true });
                try {
                    const project = get().projects[projectId];
                    const context = {
                        genre: project.genre,
                        chapterId,
                        projectPhase: project.status
                    };

                    // This will be implemented when we create the AI service
                    const researchResult = await ai.performResearch(query, type, context);

                    const newResearchItem: ResearchItem = {
                        id: `research_${Date.now()}`,
                        query,
                        type,
                        content: researchResult.content,
                        summary: researchResult.summary,
                        confidence: researchResult.confidence,
                        sources: researchResult.sources,
                        tags: researchResult.tags || [],
                        linkedChapterIds: chapterId ? [chapterId] : [],
                        createdAt: new Date(),
                        lastUpdated: new Date(),
                        verified: false
                    };

                    set(state => {
                        state.projects[projectId]?.research.push(newResearchItem);
                    });

                    toast.success('Research Complete', 'Research has been added to your library!');
                } catch (error) {
                    log.storeError('Research failed', error as Error);
                    toast.error('Research Failed', 'Sorry, there was an error performing research.');
                } finally {
                    set({ isResearching: false });
                }
            },

            saveResearchItem: (item) => {
                const projectId = get().activeProjectId;
                if (!projectId) return;

                set(state => {
                    const existing = state.projects[projectId]?.research.find(r => r.id === item.id);
                    if (existing) {
                        Object.assign(existing, { ...item, lastUpdated: new Date() });
                    } else {
                        // Add default properties if not present
                        const enhancedItem: ResearchItem = {
                            ...item,
                            isBookmarked: item.isBookmarked || false,
                            wordCount: item.wordCount || item.content.split(/\s+/).length,
                            qualityScore: item.qualityScore || (item.confidence === ResearchConfidence.High ? 85 : item.confidence === ResearchConfidence.Medium ? 65 : 45),
                            attachments: item.attachments || [],
                            relatedResearchIds: item.relatedResearchIds || [],
                            contradictions: item.contradictions || []
                        };
                        state.projects[projectId]?.research.push(enhancedItem);
                    }
                });
            },

            deleteResearchItem: (itemId) => {
                const projectId = get().activeProjectId;
                if (!projectId) return;

                set(state => {
                    const project = state.projects[projectId];
                    if (project) {
                        project.research = project.research.filter(item => item.id !== itemId);
                    }
                });
            },

            linkResearchToChapter: (researchId, chapterId) => {
                const projectId = get().activeProjectId;
                if (!projectId) return;

                set(state => {
                    const research = state.projects[projectId]?.research.find(r => r.id === researchId);
                    if (research && !research.linkedChapterIds.includes(chapterId)) {
                        research.linkedChapterIds.push(chapterId);
                        research.lastUpdated = new Date();
                    }
                });
            },

            bookmarkResearchItem: (itemId) => {
                const projectId = get().activeProjectId;
                if (!projectId) return;

                set(state => {
                    const research = state.projects[projectId]?.research.find(r => r.id === itemId);
                    if (research) {
                        research.isBookmarked = !research.isBookmarked;
                        research.lastUpdated = new Date();
                    }
                });
            },

            summarizeWebContent: async (url) => {
                const projectId = get().activeProjectId;
                if (!projectId) throw new Error("No active project");

                set({ isResearching: true });
                try {
                    const result = await ai.summarizeWebContent(url);
                    get().saveResearchItem(result);
                    toast.success('Web Content Summarized', 'Content has been added to your research library!');
                    return result;
                } catch (error) {
                    log.storeError('Web content summarization failed', error as Error);
                    toast.error('Summarization Failed', 'Sorry, there was an error summarizing the web content.');
                    throw error;
                } finally {
                    set({ isResearching: false });
                }
            },

            analyzeDocumentFile: async (file) => {
                const projectId = get().activeProjectId;
                if (!projectId) throw new Error("No active project");

                set({ isResearching: true });
                try {
                    const result = await ai.analyzeDocumentFile(file);
                    get().saveResearchItem(result);
                    toast.success('Document Analyzed', 'Document analysis has been added to your research library!');
                    return result;
                } catch (error) {
                    log.storeError('Document analysis failed', error as Error);
                    toast.error('Analysis Failed', 'Sorry, there was an error analyzing the document.');
                    throw error;
                } finally {
                    set({ isResearching: false });
                }
            },

            // Folder Management
            createResearchFolder: (name, type, parentId) => {
                const projectId = get().activeProjectId;
                if (!projectId) return;

                const newFolder: ResearchFolder = {
                    id: `folder_${Date.now()}`,
                    name,
                    type,
                    parentFolderId: parentId,
                    tags: [],
                    createdAt: new Date(),
                    color: type === ResearchFolderType.Chapter ? '#3B82F6' :
                           type === ResearchFolderType.Theme ? '#10B981' :
                           type === ResearchFolderType.Character ? '#F59E0B' :
                           type === ResearchFolderType.Historical ? '#8B5CF6' : '#6B7280'
                };

                set(state => {
                    state.projects[projectId]?.researchFolders.push(newFolder);
                });
            },

            updateResearchFolder: (folderId, updates) => {
                const projectId = get().activeProjectId;
                if (!projectId) return;

                set(state => {
                    const folder = state.projects[projectId]?.researchFolders.find(f => f.id === folderId);
                    if (folder) {
                        Object.assign(folder, updates);
                    }
                });
            },

            deleteResearchFolder: (folderId) => {
                const projectId = get().activeProjectId;
                if (!projectId) return;

                set(state => {
                    const project = state.projects[projectId];
                    if (project) {
                        // Move research items to root
                        project.research.forEach(item => {
                            if (item.folderId === folderId) {
                                item.folderId = undefined;
                            }
                        });
                        // Remove folder
                        project.researchFolders = project.researchFolders.filter(f => f.id !== folderId);
                    }
                });
            },

            moveResearchToFolder: (researchId, folderId) => {
                const projectId = get().activeProjectId;
                if (!projectId) return;

                set(state => {
                    const research = state.projects[projectId]?.research.find(r => r.id === researchId);
                    if (research) {
                        research.folderId = folderId;
                        research.lastUpdated = new Date();
                    }
                });
            },

            // Citation Management
            generateCitation: async (researchId, sourceId, style) => {
                const projectId = get().activeProjectId;
                if (!projectId) return;

                set({ isGeneratingCitation: true });
                try {
                    const citation = await ai.generateCitation(researchId, sourceId, style);
                    set(state => {
                        state.projects[projectId]?.citations.push(citation);
                    });
                    toast.success('Citation Generated', `${style} citation has been created!`);
                } catch (error) {
                    log.storeError('Citation generation failed', error as Error);
                    toast.error('Citation Failed', 'Sorry, there was an error generating the citation.');
                } finally {
                    set({ isGeneratingCitation: false });
                }
            },

            formatBibliography: (style) => {
                const projectId = get().activeProjectId;
                if (!projectId) return [];

                const project = get().projects[projectId];
                return project?.citations
                    .filter(c => c.style === style)
                    .map(c => c.formatted) || [];
            },

            insertCitation: (chapterId, citationId, position) => {
                const projectId = get().activeProjectId;
                if (!projectId) return;

                set(state => {
                    const project = state.projects[projectId];
                    const chapter = project?.chapters.find(c => c.id === chapterId);
                    const citation = project?.citations.find(c => c.id === citationId);

                    if (chapter && citation) {
                        const content = chapter.content;
                        const newContent = content.slice(0, position) + citation.inText + content.slice(position);
                        chapter.content = newContent;
                    }
                });
            },

            // Advanced Analysis
            analyzeResearchThemes: async () => {
                const projectId = get().activeProjectId;
                if (!projectId) return;

                set({ isAnalyzingThemes: true });
                try {
                    const themes = await ai.analyzeResearchThemes(get().projects[projectId]!.research);
                    set(state => {
                        const project = state.projects[projectId];
                        if (project) {
                            project.thematicTags = themes;
                        }
                    });
                    toast.success('Theme Analysis Complete', `Found ${themes.length} thematic patterns in your research!`);
                } catch (error) {
                    log.storeError('Theme analysis failed', error as Error);
                    toast.error('Analysis Failed', 'Sorry, there was an error analyzing themes.');
                } finally {
                    set({ isAnalyzingThemes: false });
                }
            },

            detectContradictions: async () => {
                const projectId = get().activeProjectId;
                if (!projectId) return;

                set({ isDetectingContradictions: true });
                try {
                    const contradictions = await ai.detectResearchContradictions(get().projects[projectId]!.research);

                    set(state => {
                        const project = state.projects[projectId];
                        if (project) {
                            // Add contradictions to research items
                            contradictions.forEach(contradiction => {
                                const research = project.research.find(r => r.id === contradiction.id);
                                if (research) {
                                    research.contradictions = research.contradictions || [];
                                    research.contradictions.push(contradiction);
                                }
                            });
                        }
                    });

                    if (contradictions.length > 0) {
                        toast.warning('Contradictions Found', `Found ${contradictions.length} potential contradictions in your research.`);
                    } else {
                        toast.success('No Contradictions', 'Your research appears consistent!');
                    }
                } catch (error) {
                    log.storeError('Contradiction detection failed', error as Error);
                    toast.error('Detection Failed', 'Sorry, there was an error detecting contradictions.');
                } finally {
                    set({ isDetectingContradictions: false });
                }
            },

            generateResearchSuggestions: async (chapterId) => {
                const projectId = get().activeProjectId;
                if (!projectId) return [];

                try {
                    const project = get().projects[projectId];
                    const chapter = project?.chapters.find(c => c.id === chapterId);
                    if (!chapter) return [];

                    return await ai.suggestResearchTopics(chapter.content, project.genre);
                } catch (error) {
                    log.storeError('Research suggestion generation failed', error as Error);
                    toast.error('Suggestions Failed', 'Sorry, there was an error generating research suggestions.');
                    return [];
                }
            },

            createThematicTimeline: async (themeTag) => {
                const projectId = get().activeProjectId;
                if (!projectId) return;

                try {
                    const project = get().projects[projectId];
                    const relevantResearch = project?.research.filter(r => r.tags.includes(themeTag)) || [];
                    const timeline = await ai.createThematicTimeline(themeTag, relevantResearch);

                    set(state => {
                        state.projects[projectId]?.researchTimelines.push(timeline);
                    });

                    toast.success('Timeline Created', `Thematic timeline for "${themeTag}" has been created!`);
                } catch (error) {
                    log.storeError('Timeline creation failed', error as Error);
                    toast.error('Timeline Failed', 'Sorry, there was an error creating the timeline.');
                }
            },

            createResearchMindMap: async (centerTopic, researchIds) => {
                const projectId = get().activeProjectId;
                if (!projectId) return;

                try {
                    const project = get().projects[projectId];
                    const relevantResearch = project?.research.filter(r => researchIds.includes(r.id)) || [];
                    const mindMap = await ai.createResearchMindMap(centerTopic, relevantResearch);

                    set(state => {
                        state.projects[projectId]?.researchMindMaps.push(mindMap);
                    });

                    toast.success('Mind Map Created', `Research mind map for "${centerTopic}" has been created!`);
                } catch (error) {
                    log.storeError('Mind map creation failed', error as Error);
                    toast.error('Mind Map Failed', 'Sorry, there was an error creating the mind map.');
                }
            },

            verifyTextAccuracy: async (text, chapterId) => {
                const projectId = get().activeProjectId;
                if (!projectId) return;

                set({ isFactChecking: true });
                try {
                    // This will be implemented when we create the AI service
                    const factCheckResults = await ai.verifyFacts(text, { projectId, chapterId });

                    set(state => {
                        factCheckResults.forEach(result => {
                            state.projects[projectId]?.factChecks.push(result);
                        });
                    });

                    const issues = factCheckResults.filter(r => r.accuracy !== 'Accurate');
                    if (issues.length > 0) {
                        toast.warning('Fact Check Complete', `Found ${issues.length} items that may need verification.`);
                    } else {
                        toast.success('Fact Check Complete', 'All facts appear accurate!');
                    }
                } catch (error) {
                    log.storeError('Fact checking failed', error as Error);
                    toast.error('Fact Check Failed', 'Sorry, there was an error checking facts.');
                } finally {
                    set({ isFactChecking: false });
                }
            },

            acceptFactCheck: (factCheckId) => {
                const projectId = get().activeProjectId;
                if (!projectId) return;

                set(state => {
                    const project = state.projects[projectId];
                    if (project) {
                        project.factChecks = project.factChecks.filter(fc => fc.id !== factCheckId);
                    }
                });
            },

            dismissFactCheck: (factCheckId) => {
                const projectId = get().activeProjectId;
                if (!projectId) return;

                set(state => {
                    const project = state.projects[projectId];
                    if (project) {
                        project.factChecks = project.factChecks.filter(fc => fc.id !== factCheckId);
                    }
                });
            },

            batchFactCheck: async (chapterIds) => {
                const projectId = get().activeProjectId;
                if (!projectId) return;

                set({ isFactChecking: true });
                try {
                    const project = get().projects[projectId];
                    const chapters = project?.chapters.filter(c => chapterIds.includes(c.id)) || [];

                    for (const chapter of chapters) {
                        if (chapter.content.trim()) {
                            await get().verifyTextAccuracy(chapter.content, chapter.id);
                        }
                    }

                    toast.success('Batch Fact Check Complete', `Analyzed ${chapters.length} chapters for factual accuracy.`);
                } catch (error) {
                    log.storeError('Batch fact checking failed', error as Error);
                    toast.error('Batch Check Failed', 'Sorry, there was an error during batch fact checking.');
                } finally {
                    set({ isFactChecking: false });
                }
            },

            addResearchTag: (tag) => {
                const projectId = get().activeProjectId;
                if (!projectId) return;

                set(state => {
                    const project = state.projects[projectId];
                    if (project && !project.researchTags.includes(tag)) {
                        project.researchTags.push(tag);
                    }
                });
            },

            filterResearchByTag: (tag) => {
                const projectId = get().activeProjectId;
                if (!projectId) return [];

                const project = get().projects[projectId];
                return project?.research.filter(item => item.tags.includes(tag)) || [];
            },

            searchResearch: (searchTerm) => {
                const projectId = get().activeProjectId;
                if (!projectId) return [];

                const project = get().projects[projectId];
                const term = searchTerm.toLowerCase();
                return project?.research.filter(item =>
                    item.query.toLowerCase().includes(term) ||
                    item.content.toLowerCase().includes(term) ||
                    item.summary.toLowerCase().includes(term) ||
                    item.tags.some(tag => tag.toLowerCase().includes(term))
                ) || [];
            },

            setResearchFilters: (filters) => {
                set(state => {
                    state.researchFilters = { ...state.researchFilters, ...filters };
                });
            },

            clearResearchFilters: () => {
                set({ researchFilters: {} });
            },

            selectResearchItems: (itemIds) => {
                set({ selectedResearchItems: itemIds });
            },

            toggleResearchItemSelection: (itemId) => {
                set(state => {
                    const selected = state.selectedResearchItems;
                    if (selected.includes(itemId)) {
                        state.selectedResearchItems = selected.filter(id => id !== itemId);
                    } else {
                        state.selectedResearchItems = [...selected, itemId];
                    }
                });
            },

            toggleResearchSidebar: (open) => {
                set({ researchSidebarOpen: open });
            },

            setActiveResearchQuery: (queryId) => {
                set({ activeResearchQuery: queryId });
            },

            setActiveResearchFolder: (folderId) => {
                set({ activeResearchFolder: folderId });
            },

            setResearchView: (view) => {
                set({ researchView: view });
            }
        })),
        {
            name: 'bookcraft-storage',
            partialize: (state) => ({
                // Only persist data, not UI state
                projects: state.projects,
                activeProjectId: state.activeProjectId,
                settings: state.settings,
                // Persist some research preferences but not loading states
                researchView: state.researchView,
                researchFilters: state.researchFilters,
                // Do NOT persist modal states, loading states, or other ephemeral UI state
            })
        }
    )
);