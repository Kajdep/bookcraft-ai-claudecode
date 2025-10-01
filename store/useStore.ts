import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { Project, Chapter, VisualRecommendation, Visual, GeneratedImage, PlotPoint, ResearchItem, ResearchType, FactCheckResult, ResearchQuery, ResearchFolder, Citation, CitationStyle, ThematicTag, ResearchTimeline, ResearchMindMap, ResearchAttachment, ResearchContradiction, Settings, MaterialItem, MaterialFolder, MaterialType, MaterialCategory } from '../types';

// Analytics types
export interface WritingSession {
    id: string;
    projectId: string;
    chapterId?: string;
    startTime: Date;
    endTime: Date;
    wordsWritten: number;
    wordsDeleted: number;
    netWords: number;
    keystrokes: number;
    backspaces: number;
    timeActive: number; // milliseconds actually typing
    timeIdle: number; // milliseconds idle
    notes?: string;
}

export interface WritingGoal {
    id: string;
    projectId: string;
    type: 'words' | 'chapters' | 'hours' | 'pages' | 'sessions';
    target: number;
    current: number;
    deadline: Date;
    title: string;
    description?: string;
    completed: boolean;
    createdAt: Date;
    completedAt?: Date;
}

export interface ProductivityMetrics {
    date: string;
    words: number;
    minutes: number;
    sessions: number;
    wordsDeleted: number;
    efficiency: number; // words per minute when active
    focus: number; // percentage of time actually typing vs idle
}

export interface WritingStreak {
    current: number;
    longest: number;
    lastActive: Date;
    streakDates: string[];
    totalDays: number;
}
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
    
    // Analytics state
    writingSessions: WritingSession[];
    writingGoals: WritingGoal[];
    currentSession: WritingSession | null;
    dailyMetrics: Record<string, ProductivityMetrics>; // date string as key
    weeklyMetrics: Record<string, ProductivityMetrics>; // week string as key
    monthlyMetrics: Record<string, ProductivityMetrics>; // month string as key
    writingStreak: WritingStreak;
    sessionStartTime: Date | null;
    lastWordCount: number;
    keystrokeCount: number;
    backspaceCount: number;
    idleTime: number;
    activeTime: number;
    
    // Autosave state
    lastSaved: Date | null;
    isAutoSaving: boolean;
    pendingChanges: boolean;

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
    
    // Modal-based AI process tracking
    activeAIProcesses: Record<string, {
        name: string;
        type: 'content' | 'visual' | 'research' | 'analysis' | 'planning';
        description: string;
        startTime: Date;
    }>;

    // Centralized modal state management
    activeModal: {
        type: 'none' | 'createProject' | 'settings' | 'aiAssistant' | 'writersBlock' | 'chapterGenerator' | 'plotTool' | 'projectPlanner' | 'mergeContent';
        data?: any;
    };
    modalStack: Array<{ type: string; data?: any }>;
}

interface BookCraftActions {
    // Project Management
    addProject: (newProjectData: Pick<Project, 'title' | 'genre' | 'visualStyle'> & { description?: string }) => void;
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
    updateResearchItem: (itemId: string, updates: Partial<ResearchItem>) => void;
    linkResearchToChapter: (researchId: string, chapterId: string) => void;
    bookmarkResearchItem: (itemId: string) => void;
    addCitation: (citation: Omit<Citation, 'id'>) => void;
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

    // Enhanced modal management
    openModal: (type: string, data?: any) => void;
    closeModal: () => void;
    isModalOpen: (type: string) => boolean;
    pushModalToStack: (type: string, data?: any) => void;
    popModalFromStack: () => void;
    
    // Autosave functionality
    triggerAutosave: () => void;
    manualSave: () => Promise<void>;
    setPendingChanges: (pending: boolean) => void;
    
    // Material Management
    addMaterial: (material: Omit<MaterialItem, 'id' | 'createdAt' | 'lastModified'>) => void;
    updateMaterial: (materialId: string, updates: Partial<MaterialItem>) => void;
    deleteMaterial: (materialId: string) => void;
    createMaterialFolder: (name: string, parentId?: string) => void;
    updateMaterialFolder: (folderId: string, updates: Partial<MaterialFolder>) => void;
    deleteMaterialFolder: (folderId: string) => void;
    moveMaterialToFolder: (materialId: string, folderId: string) => void;
    linkMaterialToChapter: (materialId: string, chapterId: string) => void;
    bookmarkMaterial: (materialId: string) => void;
    favoriteMaterial: (materialId: string) => void;
    searchMaterials: (searchTerm: string) => MaterialItem[];
    filterMaterialsByType: (type: MaterialType) => MaterialItem[];
    filterMaterialsByCategory: (category: MaterialCategory) => MaterialItem[];
    uploadMaterialFile: (file: File, category: MaterialCategory) => Promise<void>;
    addMaterialNote: (title: string, content: string, category: MaterialCategory) => void;
    addMaterialLink: (title: string, url: string, category: MaterialCategory) => void;
    generateThumbnail: (file: File) => Promise<string>;
    extractFileMetadata: (file: File) => Promise<Partial<MaterialItem['metadata']>>;
    storeFileInIndexedDB: (file: File, fileId: string) => Promise<string>;
    retrieveFileFromIndexedDB: (fileId: string) => Promise<File | null>;
    deleteFileFromIndexedDB: (fileId: string) => Promise<boolean>;

    // AI Process tracking
    startAIProcess: (id: string, name: string, type: 'content' | 'visual' | 'research' | 'analysis' | 'planning', description: string) => void;
    endAIProcess: (id: string) => void;
    
    // Analytics Actions
    startWritingSession: (chapterId?: string) => void;
    endWritingSession: () => void;
    pauseWritingSession: () => void;
    resumeWritingSession: () => void;
    trackWordChange: (oldCount: number, newCount: number) => void;
    trackKeystroke: () => void;
    trackBackspace: () => void;
    updateSessionActivity: () => void;
    calculateProductivityMetrics: (date: string) => ProductivityMetrics;
    updateWritingStreak: () => void;
    
    // Goals Management
    createWritingGoal: (goal: Omit<WritingGoal, 'id' | 'current' | 'completed' | 'createdAt'>) => void;
    updateWritingGoal: (goalId: string, updates: Partial<WritingGoal>) => void;
    deleteWritingGoal: (goalId: string) => void;
    completeWritingGoal: (goalId: string) => void;
    updateGoalProgress: (goalId: string) => void;
    
    // Analytics Queries
    getSessionsInRange: (startDate: Date, endDate: Date) => WritingSession[];
    getProductivityTrend: (days: number) => ProductivityMetrics[];
    getWritingVelocity: (days: number) => number; // words per day average
    getBestWritingTime: () => { hour: number; productivity: number };
    getWritingInsights: () => {
        totalWords: number;
        totalSessions: number;
        averageSessionLength: number;
        mostProductiveDay: string;
        currentStreak: number;
        goalsCompleted: number;
        goalsActive: number;
    };
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

            // Centralized modal state
            activeModal: { type: 'none' },
            modalStack: [],
            
            // AI process tracking
            activeAIProcesses: {},
            
            // Analytics state
            writingSessions: [],
            writingGoals: [],
            currentSession: null,
            dailyMetrics: {},
            weeklyMetrics: {},
            monthlyMetrics: {},
            writingStreak: {
                current: 0,
                longest: 0,
                lastActive: new Date(),
                streakDates: [],
                totalDays: 0
            },
            sessionStartTime: null,
            lastWordCount: 0,
            keystrokeCount: 0,
            backspaceCount: 0,
            idleTime: 0,
            activeTime: 0,
            
            // Autosave state
            lastSaved: null,
            isAutoSaving: false,
            pendingChanges: false,

            // ACTIONS
            // Project Management
            addProject: (newProjectData) => {
                const id = `proj_${Date.now()}`;
                const { description, ...projectData } = newProjectData;
                const newProject: Project = {
                    ...projectData,
                    id,
                    status: ProjectStatus.Draft,
                    createdAt: new Date(),
                    metadata: description ? { description } : undefined,
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
                    materials: [],
                    materialFolders: [],
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
                    
                    // Create a default chapter to get users started
                    const defaultChapter: Chapter = {
                        id: `chap_${Date.now()}`,
                        title: 'Chapter 1',
                        content: '',
                        status: ChapterStatus.Idea,
                        order: 0,
                        notes: '',
                        structure: [],
                    };
                    newProject.chapters.push(defaultChapter);
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
                    // Reset ALL modal and UI states to their default values
                    state.activeModal = { type: 'none' };
                    state.modalStack = [];
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
                    state.activeModal = { type: 'none' };
                    state.modalStack = [];
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
                
                // Trigger autosave after chapter update
                get().triggerAutosave();
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
                    if (project && project.plotPoints && project.plotPoints.length > 0) {
                        // Create a stable copy to prevent reference issues
                        const currentPlotPoints = project.plotPoints.slice();

                        // Sort by order to ensure correct indices
                        const ordered = currentPlotPoints.sort((a, b) => a.order - b.order);

                        // Validate indices to prevent array errors
                        if (sourceIndex < 0 || sourceIndex >= ordered.length ||
                            destinationIndex < 0 || destinationIndex >= ordered.length) {
                            return; // Exit early for invalid indices
                        }

                        // Perform the reorder
                        const [removed] = ordered.splice(sourceIndex, 1);
                        ordered.splice(destinationIndex, 0, removed);

                        // Create new objects with updated order to ensure proper state updates
                        const reorderedPlotPoints = ordered.map((point, index) => ({
                            ...point,
                            order: index
                        }));

                        // Replace the entire array
                        project.plotPoints = reorderedPlotPoints;
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
                    
                    // Trigger autosave after adding research
                    get().triggerAutosave();

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
                
                // Trigger autosave after saving research
                get().triggerAutosave();
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

            updateResearchItem: (itemId, updates) => {
                const projectId = get().activeProjectId;
                if (!projectId) return;

                set(state => {
                    const research = state.projects[projectId]?.research.find(r => r.id === itemId);
                    if (research) {
                        Object.assign(research, updates, { lastUpdated: new Date() });
                    }
                });
                
                // Trigger autosave after updating research
                get().triggerAutosave();
            },

            addCitation: (citation) => {
                const projectId = get().activeProjectId;
                if (!projectId) return;

                const newCitation: Citation = {
                    ...citation,
                    id: `citation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                };

                set(state => {
                    const project = state.projects[projectId];
                    if (project) {
                        project.citations.push(newCitation);
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
            },

            // Enhanced modal management actions
            openModal: (type, data) => {
                set(state => {
                    // Close any existing modal first and clear all loading/UI states
                    state.activeModal = { type: type as any, data };
                    state.modalStack = [];
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

                    // Update legacy state for backward compatibility
                    if (type === 'createProject') {
                        state.isCreateModalOpen = true;
                    }
                });
            },

            closeModal: () => {
                set(state => {
                    // If there's a modal in the stack, show it
                    if (state.modalStack.length > 0) {
                        const nextModal = state.modalStack.pop()!;
                        state.activeModal = { type: nextModal.type as any, data: nextModal.data };
                    } else {
                        state.activeModal = { type: 'none' };
                        // Update legacy state for backward compatibility
                        state.isCreateModalOpen = false;
                    }
                });
            },

            isModalOpen: (type) => {
                const state = get();
                return state.activeModal.type === type;
            },

            pushModalToStack: (type, data) => {
                set(state => {
                    state.modalStack.push({ type, data });
                });
            },

            popModalFromStack: () => {
                set(state => {
                    state.modalStack.pop();
                });
            },
            
            // Autosave functionality
            triggerAutosave: () => {
                set(state => {
                    state.pendingChanges = true;
                });
                
                // Debounced autosave - will save after 2 seconds of inactivity
                const currentTime = Date.now();
                setTimeout(() => {
                    const state = get();
                    if (state.pendingChanges && !state.isAutoSaving) {
                        get().manualSave();
                    }
                }, 2000);
            },
            
            manualSave: async () => {
                set(state => {
                    state.isAutoSaving = true;
                    state.pendingChanges = false;
                });
                
                try {
                    // The persist middleware handles the actual saving
                    // We just need to update the last saved timestamp
                    set(state => {
                        state.lastSaved = new Date();
                    });
                    
                    // Optional: Show a subtle save indicator
                    console.log('Data autosaved at', new Date().toLocaleTimeString());
                } catch (error) {
                    log.error('Autosave failed', error as Error, 'useStore');
                } finally {
                    set(state => {
                        state.isAutoSaving = false;
                    });
                }
            },
            
            setPendingChanges: (pending) => {
                set(state => {
                    state.pendingChanges = pending;
                });
            },
            
            // Material Management
            addMaterial: (material) => {
                const projectId = get().activeProjectId;
                if (!projectId) return;

                const newMaterial: MaterialItem = {
                    ...material,
                    id: `material_${Date.now()}`,
                    createdAt: new Date(),
                    lastModified: new Date(),
                    isBookmarked: material.isBookmarked || false,
                    isFavorite: material.isFavorite || false,
                    tags: material.tags || [],
                    linkedChapterIds: material.linkedChapterIds || []
                };

                set(state => {
                    state.projects[projectId]?.materials.push(newMaterial);
                });

                get().triggerAutosave();
            },

            updateMaterial: (materialId, updates) => {
                const projectId = get().activeProjectId;
                if (!projectId) return;

                set(state => {
                    const material = state.projects[projectId]?.materials.find(m => m.id === materialId);
                    if (material) {
                        Object.assign(material, updates, { lastModified: new Date() });
                    }
                });

                get().triggerAutosave();
            },

            deleteMaterial: async (materialId) => {
                const projectId = get().activeProjectId;
                if (!projectId) return;

                // Find the material to get file info before deleting
                const material = get().projects[projectId]?.materials.find(m => m.id === materialId);
                
                set(state => {
                    const project = state.projects[projectId];
                    if (project) {
                        project.materials = project.materials.filter(m => m.id !== materialId);
                        
                        // Remove from folders
                        project.materialFolders.forEach(folder => {
                            folder.materialIds = folder.materialIds.filter(id => id !== materialId);
                        });
                    }
                });

                // Clean up stored file if it exists
                if (material?.metadata?.fileId && material.metadata.storageType === 'indexeddb') {
                    try {
                        await get().deleteFileFromIndexedDB(material.metadata.fileId);
                    } catch (error) {
                        log.warn('Failed to delete file from IndexedDB', error as Error, 'MaterialManagement');
                    }
                }

                get().triggerAutosave();
                toast.success('Material Deleted', `${material?.title || 'Material'} has been removed.`);
            },

            createMaterialFolder: (name, parentId) => {
                const projectId = get().activeProjectId;
                if (!projectId) return;

                const newFolder: MaterialFolder = {
                    id: `materialFolder_${Date.now()}`,
                    name,
                    parentFolderId: parentId,
                    color: '#6B7280', // Default gray color
                    materialIds: [],
                    createdAt: new Date(),
                    lastModified: new Date()
                };

                set(state => {
                    state.projects[projectId]?.materialFolders.push(newFolder);
                });

                get().triggerAutosave();
            },

            updateMaterialFolder: (folderId, updates) => {
                const projectId = get().activeProjectId;
                if (!projectId) return;

                set(state => {
                    const folder = state.projects[projectId]?.materialFolders.find(f => f.id === folderId);
                    if (folder) {
                        Object.assign(folder, updates, { lastModified: new Date() });
                    }
                });

                get().triggerAutosave();
            },

            deleteMaterialFolder: (folderId) => {
                const projectId = get().activeProjectId;
                if (!projectId) return;

                set(state => {
                    const project = state.projects[projectId];
                    if (project) {
                        // Move materials to root (no folder)
                        const folderToDelete = project.materialFolders.find(f => f.id === folderId);
                        if (folderToDelete) {
                            folderToDelete.materialIds.forEach(materialId => {
                                const material = project.materials.find(m => m.id === materialId);
                                // Materials don't have a folderId property in our current schema
                                // If we need folder assignment, we can add it later
                            });
                        }
                        
                        // Remove folder
                        project.materialFolders = project.materialFolders.filter(f => f.id !== folderId);
                    }
                });

                get().triggerAutosave();
            },

            moveMaterialToFolder: (materialId, folderId) => {
                const projectId = get().activeProjectId;
                if (!projectId) return;

                set(state => {
                    const project = state.projects[projectId];
                    if (project) {
                        // Remove from all folders first
                        project.materialFolders.forEach(folder => {
                            folder.materialIds = folder.materialIds.filter(id => id !== materialId);
                        });

                        // Add to target folder
                        const targetFolder = project.materialFolders.find(f => f.id === folderId);
                        if (targetFolder && !targetFolder.materialIds.includes(materialId)) {
                            targetFolder.materialIds.push(materialId);
                            targetFolder.lastModified = new Date();
                        }
                    }
                });

                get().triggerAutosave();
            },

            linkMaterialToChapter: (materialId, chapterId) => {
                const projectId = get().activeProjectId;
                if (!projectId) return;

                set(state => {
                    const material = state.projects[projectId]?.materials.find(m => m.id === materialId);
                    if (material && !material.linkedChapterIds.includes(chapterId)) {
                        material.linkedChapterIds.push(chapterId);
                        material.lastModified = new Date();
                    }
                });

                get().triggerAutosave();
            },

            bookmarkMaterial: (materialId) => {
                const projectId = get().activeProjectId;
                if (!projectId) return;

                set(state => {
                    const material = state.projects[projectId]?.materials.find(m => m.id === materialId);
                    if (material) {
                        material.isBookmarked = !material.isBookmarked;
                        material.lastModified = new Date();
                    }
                });

                get().triggerAutosave();
            },

            favoriteMaterial: (materialId) => {
                const projectId = get().activeProjectId;
                if (!projectId) return;

                set(state => {
                    const material = state.projects[projectId]?.materials.find(m => m.id === materialId);
                    if (material) {
                        material.isFavorite = !material.isFavorite;
                        material.lastModified = new Date();
                    }
                });

                get().triggerAutosave();
            },

            searchMaterials: (searchTerm) => {
                const projectId = get().activeProjectId;
                if (!projectId) return [];

                const project = get().projects[projectId];
                const term = searchTerm.toLowerCase();
                return project?.materials.filter(material =>
                    material.title.toLowerCase().includes(term) ||
                    (material.description && material.description.toLowerCase().includes(term)) ||
                    (material.content && material.content.toLowerCase().includes(term)) ||
                    material.tags.some(tag => tag.toLowerCase().includes(term))
                ) || [];
            },

            filterMaterialsByType: (type) => {
                const projectId = get().activeProjectId;
                if (!projectId) return [];

                const project = get().projects[projectId];
                return project?.materials.filter(material => material.type === type) || [];
            },

            filterMaterialsByCategory: (category) => {
                const projectId = get().activeProjectId;
                if (!projectId) return [];

                const project = get().projects[projectId];
                return project?.materials.filter(material => material.category === category) || [];
            },

            uploadMaterialFile: async (file, category) => {
                const projectId = get().activeProjectId;
                if (!projectId) return;

                try {
                    // Generate thumbnail for supported file types
                    const thumbnail = await get().generateThumbnail(file);
                    
                    // Extract metadata
                    const metadata = await get().extractFileMetadata(file);
                    
                    // Determine material type based on file type
                    let materialType: MaterialType;
                    if (file.type.startsWith('image/')) {
                        materialType = MaterialType.Image;
                    } else if (file.type.startsWith('audio/')) {
                        materialType = MaterialType.Audio;
                    } else if (file.type.startsWith('video/')) {
                        materialType = MaterialType.Video;
                    } else if (file.type === 'application/pdf' || file.type.includes('document') || file.type.includes('text')) {
                        materialType = MaterialType.Document;
                    } else {
                        materialType = MaterialType.Archive;
                    }

                    // Store file with proper handling for different storage strategies
                    let fileUrl: string;
                    let fileId: string;
                    
                    if (typeof window !== 'undefined' && 'indexedDB' in window) {
                        // Use IndexedDB for better file storage
                        fileId = `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                        fileUrl = await get().storeFileInIndexedDB(file, fileId);
                    } else {
                        // Fallback to base64 for smaller files (limit to 50MB to prevent memory issues)
                        if (file.size > 50 * 1024 * 1024) {
                            throw new Error('File too large. Please use files smaller than 50MB.');
                        }
                        
                        const base64 = await new Promise<string>((resolve, reject) => {
                            const reader = new FileReader();
                            reader.onload = () => resolve(reader.result as string);
                            reader.onerror = reject;
                            reader.readAsDataURL(file);
                        });
                        fileUrl = base64;
                        fileId = `base64_${Date.now()}`;
                    }

                    const newMaterial: Omit<MaterialItem, 'id' | 'createdAt' | 'lastModified'> = {
                        title: file.name,
                        type: materialType,
                        category,
                        fileName: file.name,
                        fileSize: file.size,
                        mimeType: file.type,
                        thumbnail,
                        url: fileUrl,
                        tags: [],
                        linkedChapterIds: [],
                        isBookmarked: false,
                        isFavorite: false,
                        metadata: {
                            ...metadata,
                            fileId,
                            uploadDate: new Date().toISOString(),
                            storageType: fileId.startsWith('base64_') ? 'base64' : 'indexeddb'
                        }
                    };

                    get().addMaterial(newMaterial);
                    toast.success('File Uploaded', `${file.name} has been added to your materials.`);
                } catch (error) {
                    log.error('File upload failed', error as Error, 'MaterialManagement');
                    toast.error('Upload Failed', 'Sorry, there was an error uploading the file.');
                }
            },

            addMaterialNote: (title, content, category) => {
                const newNote: Omit<MaterialItem, 'id' | 'createdAt' | 'lastModified'> = {
                    title,
                    type: MaterialType.Note,
                    category,
                    content,
                    tags: [],
                    linkedChapterIds: [],
                    isBookmarked: false,
                    isFavorite: false,
                    metadata: {
                        wordCount: content.split(/\s+/).length
                    }
                };

                get().addMaterial(newNote);
            },

            addMaterialLink: (title, url, category) => {
                const newLink: Omit<MaterialItem, 'id' | 'createdAt' | 'lastModified'> = {
                    title,
                    type: MaterialType.Link,
                    category,
                    url,
                    tags: [],
                    linkedChapterIds: [],
                    isBookmarked: false,
                    isFavorite: false
                };

                get().addMaterial(newLink);
            },

            storeFileInIndexedDB: async (file, fileId) => {
                return new Promise<string>((resolve, reject) => {
                    const request = indexedDB.open('BookCraftMaterials', 1);
                    
                    request.onerror = () => reject(new Error('Failed to open IndexedDB'));
                    
                    request.onupgradeneeded = (event) => {
                        const db = (event.target as IDBOpenDBRequest).result;
                        if (!db.objectStoreNames.contains('files')) {
                            db.createObjectStore('files', { keyPath: 'id' });
                        }
                    };
                    
                    request.onsuccess = (event) => {
                        const db = (event.target as IDBOpenDBRequest).result;
                        const transaction = db.transaction(['files'], 'readwrite');
                        const store = transaction.objectStore('files');
                        
                        const fileRecord = {
                            id: fileId,
                            file: file,
                            filename: file.name,
                            type: file.type,
                            size: file.size,
                            uploadDate: new Date().toISOString()
                        };
                        
                        const addRequest = store.add(fileRecord);
                        
                        addRequest.onsuccess = () => {
                            resolve(`indexeddb://${fileId}`);
                        };
                        
                        addRequest.onerror = () => {
                            reject(new Error('Failed to store file in IndexedDB'));
                        };
                        
                        transaction.oncomplete = () => {
                            db.close();
                        };
                    };
                });
            },

            retrieveFileFromIndexedDB: async (fileId) => {
                return new Promise<File | null>((resolve, reject) => {
                    const request = indexedDB.open('BookCraftMaterials', 1);
                    
                    request.onerror = () => reject(new Error('Failed to open IndexedDB'));
                    
                    request.onsuccess = (event) => {
                        const db = (event.target as IDBOpenDBRequest).result;
                        const transaction = db.transaction(['files'], 'readonly');
                        const store = transaction.objectStore('files');
                        
                        const getRequest = store.get(fileId);
                        
                        getRequest.onsuccess = () => {
                            const result = getRequest.result;
                            resolve(result ? result.file : null);
                        };
                        
                        getRequest.onerror = () => {
                            resolve(null);
                        };
                        
                        transaction.oncomplete = () => {
                            db.close();
                        };
                    };
                });
            },

            deleteFileFromIndexedDB: async (fileId) => {
                return new Promise<boolean>((resolve, reject) => {
                    const request = indexedDB.open('BookCraftMaterials', 1);
                    
                    request.onerror = () => reject(new Error('Failed to open IndexedDB'));
                    
                    request.onsuccess = (event) => {
                        const db = (event.target as IDBOpenDBRequest).result;
                        const transaction = db.transaction(['files'], 'readwrite');
                        const store = transaction.objectStore('files');
                        
                        const deleteRequest = store.delete(fileId);
                        
                        deleteRequest.onsuccess = () => {
                            resolve(true);
                        };
                        
                        deleteRequest.onerror = () => {
                            resolve(false);
                        };
                        
                        transaction.oncomplete = () => {
                            db.close();
                        };
                    };
                });
            },

            generateThumbnail: async (file) => {
                if (file.type.startsWith('image/')) {
                    // For images, create a smaller thumbnail
                    return new Promise<string>((resolve, reject) => {
                        const canvas = document.createElement('canvas');
                        const ctx = canvas.getContext('2d');
                        const img = new Image();
                        
                        img.onload = () => {
                            // Set thumbnail size
                            const maxWidth = 200;
                            const maxHeight = 200;
                            let { width, height } = img;
                            
                            if (width > height) {
                                if (width > maxWidth) {
                                    height *= maxWidth / width;
                                    width = maxWidth;
                                }
                            } else {
                                if (height > maxHeight) {
                                    width *= maxHeight / height;
                                    height = maxHeight;
                                }
                            }
                            
                            canvas.width = width;
                            canvas.height = height;
                            ctx?.drawImage(img, 0, 0, width, height);
                            resolve(canvas.toDataURL('image/jpeg', 0.7));
                        };
                        
                        img.onerror = reject;
                        img.src = URL.createObjectURL(file);
                    });
                }
                return ''; // No thumbnail for non-image files
            },

            extractFileMetadata: async (file) => {
                const metadata: Partial<MaterialItem['metadata']> = {};
                
                if (file.type.startsWith('image/')) {
                    // For images, extract dimensions
                    try {
                        const dimensions = await new Promise<{width: number, height: number}>((resolve, reject) => {
                            const img = new Image();
                            img.onload = () => resolve({ width: img.width, height: img.height });
                            img.onerror = reject;
                            img.src = URL.createObjectURL(file);
                        });
                        metadata.dimensions = dimensions;
                    } catch (error) {
                        // Ignore errors
                    }
                } else if (file.type.startsWith('audio/') || file.type.startsWith('video/')) {
                    // For media files, extract duration using HTML5 media elements
                    try {
                        const duration = await new Promise<number>((resolve, reject) => {
                            const url = URL.createObjectURL(file);
                            const element = file.type.startsWith('audio/') ? new Audio(url) : document.createElement('video');
                            
                            element.addEventListener('loadedmetadata', () => {
                                URL.revokeObjectURL(url);
                                resolve(element.duration || 0);
                            });
                            
                            element.addEventListener('error', () => {
                                URL.revokeObjectURL(url);
                                resolve(0);
                            });
                            
                            if (file.type.startsWith('video/')) {
                                (element as HTMLVideoElement).src = url;
                            }
                            
                            // Timeout after 10 seconds
                            setTimeout(() => {
                                URL.revokeObjectURL(url);
                                resolve(0);
                            }, 10000);
                        });
                        
                        metadata.duration = duration;
                        
                        if (file.type.startsWith('video/')) {
                            // Extract additional video metadata if possible
                            metadata.format = file.type;
                        }
                    } catch (error) {
                        metadata.duration = 0;
                    }
                } else if (file.type === 'application/pdf') {
                    // For PDF files, try to extract basic information
                    try {
                        metadata.format = 'PDF';
                        metadata.fileType = 'document';
                    } catch (error) {
                        // Ignore errors
                    }
                } else if (file.type.includes('text') || file.name.match(/\.(txt|md|rtf)$/i)) {
                    // For text files, calculate word count
                    try {
                        const text = await new Promise<string>((resolve, reject) => {
                            const reader = new FileReader();
                            reader.onload = () => resolve(reader.result as string);
                            reader.onerror = reject;
                            reader.readAsText(file);
                        });
                        
                        metadata.wordCount = text.split(/\s+/).filter(word => word.length > 0).length;
                        metadata.characterCount = text.length;
                        metadata.lineCount = text.split('\n').length;
                    } catch (error) {
                        // Ignore errors
                    }
                }
                
                return metadata;
            },

            // AI Process tracking
            startAIProcess: (id, name, type, description) => {
                set(state => {
                    state.activeAIProcesses[id] = {
                        name,
                        type,
                        description,
                        startTime: new Date()
                    };
                });
            },
            
            endAIProcess: (id) => {
                set(state => {
                    delete state.activeAIProcesses[id];
                });
            },

            // Analytics Actions Implementation
            startWritingSession: (chapterId) => {
                const projectId = get().activeProjectId;
                if (!projectId) return;

                const now = new Date();
                const sessionId = `session_${Date.now()}`;
                
                set(state => {
                    // End any existing session first
                    if (state.currentSession) {
                        get().endWritingSession();
                    }
                    
                    state.currentSession = {
                        id: sessionId,
                        projectId,
                        chapterId,
                        startTime: now,
                        endTime: now,
                        wordsWritten: 0,
                        wordsDeleted: 0,
                        netWords: 0,
                        keystrokes: 0,
                        backspaces: 0,
                        timeActive: 0,
                        timeIdle: 0
                    };
                    
                    state.sessionStartTime = now;
                    state.lastWordCount = 0;
                    state.keystrokeCount = 0;
                    state.backspaceCount = 0;
                    state.activeTime = 0;
                    state.idleTime = 0;
                });
                
                log.info('Writing session started', { sessionId, projectId, chapterId });
            },

            endWritingSession: () => {
                const state = get();
                if (!state.currentSession) return;

                const now = new Date();
                const session = {
                    ...state.currentSession,
                    endTime: now,
                    timeActive: state.activeTime,
                    timeIdle: state.idleTime,
                    keystrokes: state.keystrokeCount,
                    backspaces: state.backspaceCount
                };

                set(draft => {
                    draft.writingSessions.push(session);
                    draft.currentSession = null;
                    draft.sessionStartTime = null;
                    
                    // Update daily metrics
                    const dateStr = now.toDateString();
                    if (!draft.dailyMetrics[dateStr]) {
                        draft.dailyMetrics[dateStr] = {
                            date: dateStr,
                            words: 0,
                            minutes: 0,
                            sessions: 0,
                            wordsDeleted: 0,
                            efficiency: 0,
                            focus: 0
                        };
                    }
                    
                    const dayMetrics = draft.dailyMetrics[dateStr];
                    dayMetrics.words += session.netWords;
                    dayMetrics.wordsDeleted += session.wordsDeleted;
                    dayMetrics.minutes += Math.round((session.endTime.getTime() - session.startTime.getTime()) / 60000);
                    dayMetrics.sessions += 1;
                    dayMetrics.efficiency = session.timeActive > 0 ? Math.round((session.netWords / (session.timeActive / 60000)) * 10) / 10 : 0;
                    dayMetrics.focus = session.timeActive + session.timeIdle > 0 ? Math.round((session.timeActive / (session.timeActive + session.timeIdle)) * 100) : 0;
                });
                
                // Update writing streak
                get().updateWritingStreak();
                
                // Update goal progress
                get().writingGoals.forEach(goal => {
                    if (goal.projectId === session.projectId && !goal.completed) {
                        get().updateGoalProgress(goal.id);
                    }
                });
                
                log.info('Writing session ended', { sessionId: session.id, duration: Math.round((session.endTime.getTime() - session.startTime.getTime()) / 60000), netWords: session.netWords });
            },

            pauseWritingSession: () => {
                set(state => {
                    if (state.currentSession) {
                        state.currentSession.timeIdle += Date.now() - (state.sessionStartTime?.getTime() || Date.now());
                    }
                });
            },

            resumeWritingSession: () => {
                set(state => {
                    state.sessionStartTime = new Date();
                });
            },

            trackWordChange: (oldCount, newCount) => {
                set(state => {
                    if (state.currentSession) {
                        const diff = newCount - oldCount;
                        if (diff > 0) {
                            state.currentSession.wordsWritten += diff;
                        } else {
                            state.currentSession.wordsDeleted += Math.abs(diff);
                        }
                        state.currentSession.netWords = state.currentSession.wordsWritten - state.currentSession.wordsDeleted;
                        state.lastWordCount = newCount;
                    }
                });
            },

            trackKeystroke: () => {
                set(state => {
                    state.keystrokeCount += 1;
                    // Reset idle time and add to active time
                    const now = Date.now();
                    if (state.sessionStartTime) {
                        state.activeTime += now - state.sessionStartTime.getTime();
                        state.sessionStartTime = new Date();
                    }
                });
            },

            trackBackspace: () => {
                set(state => {
                    state.backspaceCount += 1;
                    get().trackKeystroke(); // Backspace counts as activity
                });
            },

            updateSessionActivity: () => {
                // Called periodically to track idle time
                set(state => {
                    if (state.sessionStartTime && state.currentSession) {
                        const now = Date.now();
                        const timeSinceLastActivity = now - state.sessionStartTime.getTime();
                        if (timeSinceLastActivity > 30000) { // 30 seconds of inactivity
                            state.idleTime += timeSinceLastActivity;
                            state.sessionStartTime = new Date();
                        }
                    }
                });
            },

            calculateProductivityMetrics: (date) => {
                const state = get();
                const sessionsOnDate = state.writingSessions.filter(session => 
                    session.startTime.toDateString() === new Date(date).toDateString()
                );
                
                const totalWords = sessionsOnDate.reduce((sum, session) => sum + session.netWords, 0);
                const totalMinutes = sessionsOnDate.reduce((sum, session) => 
                    sum + Math.round((session.endTime.getTime() - session.startTime.getTime()) / 60000), 0
                );
                const totalWordsDeleted = sessionsOnDate.reduce((sum, session) => sum + session.wordsDeleted, 0);
                const totalActiveTime = sessionsOnDate.reduce((sum, session) => sum + session.timeActive, 0);
                const totalTime = sessionsOnDate.reduce((sum, session) => sum + session.timeActive + session.timeIdle, 0);
                
                return {
                    date,
                    words: totalWords,
                    minutes: totalMinutes,
                    sessions: sessionsOnDate.length,
                    wordsDeleted: totalWordsDeleted,
                    efficiency: totalActiveTime > 0 ? Math.round((totalWords / (totalActiveTime / 60000)) * 10) / 10 : 0,
                    focus: totalTime > 0 ? Math.round((totalActiveTime / totalTime) * 100) : 0
                };
            },

            updateWritingStreak: () => {
                const state = get();
                const today = new Date().toDateString();
                const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toDateString();
                
                const todayHasWriting = state.dailyMetrics[today]?.words > 0;
                const yesterdayHasWriting = state.dailyMetrics[yesterday]?.words > 0;
                
                set(draft => {
                    if (todayHasWriting) {
                        if (!draft.writingStreak.streakDates.includes(today)) {
                            draft.writingStreak.streakDates.push(today);
                        }
                        
                        if (yesterdayHasWriting || draft.writingStreak.current === 0) {
                            draft.writingStreak.current = draft.writingStreak.streakDates.length;
                        } else {
                            // Gap in streak, start new streak
                            draft.writingStreak.streakDates = [today];
                            draft.writingStreak.current = 1;
                        }
                        
                        draft.writingStreak.longest = Math.max(draft.writingStreak.longest, draft.writingStreak.current);
                        draft.writingStreak.lastActive = new Date();
                        draft.writingStreak.totalDays = Object.keys(draft.dailyMetrics).filter(date => draft.dailyMetrics[date].words > 0).length;
                    }
                });
            },

            // Goals Management
            createWritingGoal: (goalData) => {
                const projectId = get().activeProjectId;
                if (!projectId) return;

                const goalId = `goal_${Date.now()}`;
                const newGoal: WritingGoal = {
                    ...goalData,
                    id: goalId,
                    projectId,
                    current: 0,
                    completed: false,
                    createdAt: new Date()
                };

                set(state => {
                    state.writingGoals.push(newGoal);
                });

                toast.success('Goal Created', `"${goalData.title}" goal has been created.`);
                log.info('Writing goal created', { goalId, projectId, type: goalData.type, target: goalData.target });
            },

            updateWritingGoal: (goalId, updates) => {
                set(state => {
                    const goal = state.writingGoals.find(g => g.id === goalId);
                    if (goal) {
                        Object.assign(goal, updates);
                    }
                });
            },

            deleteWritingGoal: (goalId) => {
                set(state => {
                    state.writingGoals = state.writingGoals.filter(g => g.id !== goalId);
                });
                toast.success('Goal Deleted', 'Writing goal has been removed.');
            },

            completeWritingGoal: (goalId) => {
                set(state => {
                    const goal = state.writingGoals.find(g => g.id === goalId);
                    if (goal) {
                        goal.completed = true;
                        goal.completedAt = new Date();
                        goal.current = goal.target;
                    }
                });
                toast.success('Goal Completed', '🎉 Congratulations on reaching your goal!');
            },

            updateGoalProgress: (goalId) => {
                const state = get();
                const goal = state.writingGoals.find(g => g.id === goalId);
                if (!goal || goal.completed) return;

                let current = 0;
                
                switch (goal.type) {
                    case 'words':
                        current = Object.values(state.dailyMetrics)
                            .filter(metrics => new Date(metrics.date) >= goal.createdAt)
                            .reduce((sum, metrics) => sum + metrics.words, 0);
                        break;
                    case 'chapters':
                        const project = state.projects[goal.projectId];
                        current = project?.chapters.filter(ch => ch.status === 'completed').length || 0;
                        break;
                    case 'hours':
                        current = Object.values(state.dailyMetrics)
                            .filter(metrics => new Date(metrics.date) >= goal.createdAt)
                            .reduce((sum, metrics) => sum + (metrics.minutes / 60), 0);
                        break;
                    case 'sessions':
                        current = state.writingSessions
                            .filter(session => session.startTime >= goal.createdAt && session.projectId === goal.projectId)
                            .length;
                        break;
                }

                set(draft => {
                    const draftGoal = draft.writingGoals.find(g => g.id === goalId);
                    if (draftGoal) {
                        draftGoal.current = current;
                        if (current >= draftGoal.target && !draftGoal.completed) {
                            draftGoal.completed = true;
                            draftGoal.completedAt = new Date();
                            toast.success('Goal Achieved!', `🎉 You've completed "${draftGoal.title}"!`);
                        }
                    }
                });
            },

            // Analytics Queries
            getSessionsInRange: (startDate, endDate) => {
                return get().writingSessions.filter(session =>
                    session.startTime >= startDate && session.startTime <= endDate
                );
            },

            getProductivityTrend: (days) => {
                const state = get();
                const trends: ProductivityMetrics[] = [];
                
                for (let i = days - 1; i >= 0; i--) {
                    const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
                    const dateStr = date.toDateString();
                    trends.push(state.dailyMetrics[dateStr] || {
                        date: dateStr,
                        words: 0,
                        minutes: 0,
                        sessions: 0,
                        wordsDeleted: 0,
                        efficiency: 0,
                        focus: 0
                    });
                }
                
                return trends;
            },

            getWritingVelocity: (days) => {
                const trend = get().getProductivityTrend(days);
                const totalWords = trend.reduce((sum, day) => sum + day.words, 0);
                return days > 0 ? Math.round(totalWords / days) : 0;
            },

            getBestWritingTime: () => {
                const sessions = get().writingSessions;
                const hourlyProductivity: Record<number, { words: number; count: number }> = {};
                
                sessions.forEach(session => {
                    const hour = session.startTime.getHours();
                    if (!hourlyProductivity[hour]) {
                        hourlyProductivity[hour] = { words: 0, count: 0 };
                    }
                    hourlyProductivity[hour].words += session.netWords;
                    hourlyProductivity[hour].count += 1;
                });
                
                let bestHour = 9; // Default to 9 AM
                let bestProductivity = 0;
                
                Object.entries(hourlyProductivity).forEach(([hour, data]) => {
                    const avgProductivity = data.count > 0 ? data.words / data.count : 0;
                    if (avgProductivity > bestProductivity) {
                        bestHour = parseInt(hour);
                        bestProductivity = avgProductivity;
                    }
                });
                
                return { hour: bestHour, productivity: bestProductivity };
            },

            getWritingInsights: () => {
                const state = get();
                const projectId = state.activeProjectId;
                
                if (!projectId) {
                    return {
                        totalWords: 0,
                        totalSessions: 0,
                        averageSessionLength: 0,
                        mostProductiveDay: '',
                        currentStreak: 0,
                        goalsCompleted: 0,
                        goalsActive: 0
                    };
                }
                
                const projectSessions = state.writingSessions.filter(s => s.projectId === projectId);
                const projectGoals = state.writingGoals.filter(g => g.projectId === projectId);
                
                const totalWords = projectSessions.reduce((sum, s) => sum + s.netWords, 0);
                const totalMinutes = projectSessions.reduce((sum, s) => 
                    sum + Math.round((s.endTime.getTime() - s.startTime.getTime()) / 60000), 0
                );
                
                // Find most productive day
                const dailyTotals: Record<string, number> = {};
                projectSessions.forEach(session => {
                    const date = session.startTime.toDateString();
                    dailyTotals[date] = (dailyTotals[date] || 0) + session.netWords;
                });
                
                const mostProductiveDay = Object.entries(dailyTotals)
                    .sort(([, a], [, b]) => b - a)[0]?.[0] || '';
                
                return {
                    totalWords,
                    totalSessions: projectSessions.length,
                    averageSessionLength: projectSessions.length > 0 ? Math.round(totalMinutes / projectSessions.length) : 0,
                    mostProductiveDay,
                    currentStreak: state.writingStreak.current,
                    goalsCompleted: projectGoals.filter(g => g.completed).length,
                    goalsActive: projectGoals.filter(g => !g.completed).length
                };
            }
            }
        })),
        {
            name: 'bookcraft-storage',
            partialize: (state) => ({
                // ONLY persist data, NEVER persist UI state
                projects: state.projects,
                activeProjectId: state.activeProjectId,
                settings: state.settings,
                // Persist analytics data
                writingSessions: state.writingSessions,
                writingGoals: state.writingGoals,
                dailyMetrics: state.dailyMetrics,
                weeklyMetrics: state.weeklyMetrics,
                monthlyMetrics: state.monthlyMetrics,
                writingStreak: state.writingStreak,
                // Persist some research preferences but not loading states
                researchView: state.researchView,
                researchFilters: state.researchFilters,
                // Persist autosave metadata
                lastSaved: state.lastSaved,
                // EXPLICITLY EXCLUDE all modal and UI states
                // activeModal: undefined, // Don't persist
                // modalStack: undefined, // Don't persist
                // isCreateModalOpen: undefined, // Don't persist
                // isLoading: undefined, // Don't persist
                // generatingVisualFor: undefined, // Don't persist
                // isGeneratingImage: undefined, // Don't persist
                // isSuggestingVisual: undefined, // Don't persist
                // isAnalyzingChapter: undefined, // Don't persist
                // isResearching: undefined, // Don't persist
                // isFactChecking: undefined, // Don't persist
                // isGeneratingCitation: undefined, // Don't persist
                // isAnalyzingThemes: undefined, // Don't persist
                // isDetectingContradictions: undefined, // Don't persist
                // selectedResearchItems: undefined, // Don't persist
            })
        }
    )
);