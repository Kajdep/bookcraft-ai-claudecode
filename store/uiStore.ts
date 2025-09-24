import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { STORAGE_KEYS, UI_RESET_STATES, RESEARCH_VIEWS } from './constants';

interface UIState {
    // Modal states
    isCreateModalOpen: boolean;
    researchSidebarOpen: boolean;

    // Loading states
    isLoading: boolean;
    isGeneratingImage: boolean;
    isSuggestingVisual: boolean;
    isAnalyzingChapter: string | null;
    isResearching: boolean;
    isFactChecking: boolean;
    isGeneratingCitation: boolean;
    isAnalyzingThemes: boolean;
    isDetectingContradictions: boolean;

    // Visual generation
    generatingVisualFor: string | null;

    // Research UI
    activeResearchQuery: string | null;
    activeResearchFolder: string | null;
    selectedResearchItems: string[];
    researchView: 'grid' | 'list' | 'timeline' | 'mindmap';
}

interface UIActions {
    // Modal management
    toggleCreateModal: (isOpen: boolean) => void;
    toggleResearchSidebar: (open: boolean) => void;
    closeAllModals: () => void;

    // Loading state management
    setLoading: (loading: boolean) => void;
    setGeneratingImage: (generating: boolean) => void;
    setSuggestingVisual: (suggesting: boolean) => void;
    setAnalyzingChapter: (chapterId: string | null) => void;
    setResearching: (researching: boolean) => void;
    setFactChecking: (checking: boolean) => void;
    setGeneratingCitation: (generating: boolean) => void;
    setAnalyzingThemes: (analyzing: boolean) => void;
    setDetectingContradictions: (detecting: boolean) => void;

    // Visual generation
    setGeneratingVisualFor: (recommendationId: string | null) => void;

    // Research UI
    setActiveResearchQuery: (queryId: string | null) => void;
    setActiveResearchFolder: (folderId: string | null) => void;
    setResearchView: (view: 'grid' | 'list' | 'timeline' | 'mindmap') => void;
    selectResearchItems: (itemIds: string[]) => void;
    toggleResearchItemSelection: (itemId: string) => void;
    clearResearchSelection: () => void;
}

export const useUIStore = create<UIState & UIActions>()(
    persist(
        immer((set, get) => ({
            // Initial state - all UIState properties must be initialized
            isCreateModalOpen: UI_RESET_STATES.IS_CREATE_MODAL_OPEN,
            isLoading: UI_RESET_STATES.IS_LOADING,
            generatingVisualFor: UI_RESET_STATES.GENERATING_VISUAL_FOR,
            isGeneratingImage: UI_RESET_STATES.IS_GENERATING_IMAGE,
            isSuggestingVisual: UI_RESET_STATES.IS_SUGGESTING_VISUAL,
            isAnalyzingChapter: UI_RESET_STATES.IS_ANALYZING_CHAPTER,
            isResearching: UI_RESET_STATES.IS_RESEARCHING,
            isFactChecking: UI_RESET_STATES.IS_FACT_CHECKING,
            isGeneratingCitation: UI_RESET_STATES.IS_GENERATING_CITATION,
            isAnalyzingThemes: UI_RESET_STATES.IS_ANALYZING_THEMES,
            isDetectingContradictions: UI_RESET_STATES.IS_DETECTING_CONTRADICTIONS,
            selectedResearchItems: UI_RESET_STATES.SELECTED_RESEARCH_ITEMS,
            researchSidebarOpen: false,
            activeResearchQuery: null,
            activeResearchFolder: null,
            researchView: RESEARCH_VIEWS.LIST,

            // Modal management
            toggleCreateModal: (isOpen) => {
                set((state) => {
                    state.isCreateModalOpen = isOpen;
                    if (!isOpen) {
                        state.isLoading = false;
                    }
                });
            },

            toggleResearchSidebar: (open) => {
                set({ researchSidebarOpen: open });
            },

            closeAllModals: () => {
                set((state) => {
                    Object.assign(state, UI_RESET_STATES);
                    // Keep some research UI state that users might want to maintain
                    state.researchSidebarOpen = get().researchSidebarOpen;
                    state.activeResearchQuery = get().activeResearchQuery;
                    state.activeResearchFolder = get().activeResearchFolder;
                });
            },

            // Loading state management
            setLoading: (loading) => set({ isLoading: loading }),
            setGeneratingImage: (generating) => set({ isGeneratingImage: generating }),
            setSuggestingVisual: (suggesting) => set({ isSuggestingVisual: suggesting }),
            setAnalyzingChapter: (chapterId) => set({ isAnalyzingChapter: chapterId }),
            setResearching: (researching) => set({ isResearching: researching }),
            setFactChecking: (checking) => set({ isFactChecking: checking }),
            setGeneratingCitation: (generating) => set({ isGeneratingCitation: generating }),
            setAnalyzingThemes: (analyzing) => set({ isAnalyzingThemes: analyzing }),
            setDetectingContradictions: (detecting) => set({ isDetectingContradictions: detecting }),

            // Visual generation
            setGeneratingVisualFor: (recommendationId) => set({ generatingVisualFor: recommendationId }),

            // Research UI
            setActiveResearchQuery: (queryId) => set({ activeResearchQuery: queryId }),
            setActiveResearchFolder: (folderId) => set({ activeResearchFolder: folderId }),
            setResearchView: (view) => set({ researchView: view }),
            selectResearchItems: (itemIds) => set({ selectedResearchItems: itemIds }),
            toggleResearchItemSelection: (itemId) => {
                set((state) => {
                    const selected = state.selectedResearchItems;
                    if (selected.includes(itemId)) {
                        state.selectedResearchItems = selected.filter(id => id !== itemId);
                    } else {
                        state.selectedResearchItems = [...selected, itemId];
                    }
                });
            },
            clearResearchSelection: () => set({ selectedResearchItems: [] })
        })),
        {
            name: STORAGE_KEYS.BOOKCRAFT_STORAGE,
            partialize: (state) => ({
                // Only persist UI preferences, not loading states
                researchView: state.researchView,
                researchSidebarOpen: state.researchSidebarOpen
            })
        }
    )
);