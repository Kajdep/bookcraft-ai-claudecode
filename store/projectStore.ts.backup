
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { Project, Chapter, PlotPoint, Settings } from '../types';
import { ProjectStatus, ChapterStatus } from '../types';
import { STORAGE_KEYS, ID_PREFIXES, DEFAULT_RESEARCH_SETTINGS } from './constants';
import { CitationStyle as CS } from '../types';

interface ProjectState {
    projects: Record<string, Project>;
    activeProjectId: string | null;
    settings: Settings | null;
}

interface ProjectActions {
    // Project Management
    addProject: (newProjectData: Pick<Project, 'title' | 'genre' | 'visualStyle'>) => void;
    updateProject: (id: string, updates: Partial<Pick<Project, 'title' | 'genre' | 'visualStyle' | 'status'>>) => void;
    deleteProject: (id: string) => void;
    setActiveProject: (id: string | null) => void;

    // Settings Management
    updateSettings: (newSettings: Partial<Settings>) => void;

    // Chapter Management
    addChapter: () => void;
    updateChapter: (chapterId: string, updates: Partial<Chapter>) => void;
    deleteChapter: (chapterId: string) => void;
    addChaptersFromPlan: (titles: string[]) => void;
    reorderChapters: (sourceIndex: number, destinationIndex: number) => void;

    // Plot Management
    addPlotPoint: () => void;
    updatePlotPoint: (plotPointId: string, updates: Partial<PlotPoint>) => void;
    deletePlotPoint: (plotPointId: string) => void;
    reorderPlotPoints: (sourceIndex: number, destinationIndex: number) => void;
}

export const useProjectStore = create<ProjectState & ProjectActions>()(
    persist(
        immer((set, get) => ({
            // Initial state
            projects: {} as Record<string, Project>,
            activeProjectId: null,
            settings: null,

            // Project Management
            addProject: (newProjectData) => {
                const id = `${ID_PREFIXES.PROJECT}_${Date.now()}`;
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

