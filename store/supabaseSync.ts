/**
 * Supabase Sync for Zustand Store
 */

import { useBookCraftStore } from './useStore';
import { getSupabaseClient } from '../services/storage/supabase';
import { authService } from '../services/auth';
import { logger } from '../services/logger';
import type { Project, Chapter } from '../types';

let realtimeSubscription: any = null;

export async function loadFromSupabase(): Promise<void> {
    try {
        const user = await authService.getCurrentUser();
        if (!user) {
            logger.info('No authenticated user, skipping data load');
            return;
        }

        logger.info('Loading data from Supabase', { userId: user.id });
        const supabase = getSupabaseClient();

        const { data: projects, error } = await supabase
            .from('projects')
            .select(`*, chapters (*)`)
            .eq('user_id', user.id)
            .order('last_modified', { ascending: false });

        if (error) {
            logger.error('Failed to load projects from Supabase', error);
            return;
        }

        if (!projects || projects.length === 0) {
            logger.info('No projects found in Supabase');
            return;
        }

        // Deep clone to make arrays mutable (Supabase returns frozen objects)
        const projectsRecord = projects.reduce((acc, project) => {
            const clonedProject = JSON.parse(JSON.stringify(project));

            // Ensure all arrays are mutable
            clonedProject.chapters = Array.isArray(clonedProject.chapters) ? [...clonedProject.chapters] : [];
            clonedProject.plotPoints = Array.isArray(clonedProject.plotPoints) ? [...clonedProject.plotPoints] : [];
            clonedProject.visuals = Array.isArray(clonedProject.visuals) ? [...clonedProject.visuals] : [];
            clonedProject.research = Array.isArray(clonedProject.research) ? [...clonedProject.research] : [];
            clonedProject.materials = Array.isArray(clonedProject.materials) ? [...clonedProject.materials] : [];
            clonedProject.factChecks = Array.isArray(clonedProject.factChecks) ? [...clonedProject.factChecks] : [];
            clonedProject.recommendations = Array.isArray(clonedProject.recommendations) ? [...clonedProject.recommendations] : [];
            clonedProject.generatedImages = Array.isArray(clonedProject.generatedImages) ? [...clonedProject.generatedImages] : [];
            clonedProject.researchQueries = Array.isArray(clonedProject.researchQueries) ? [...clonedProject.researchQueries] : [];
            clonedProject.researchTags = Array.isArray(clonedProject.researchTags) ? [...clonedProject.researchTags] : [];
            clonedProject.researchFolders = Array.isArray(clonedProject.researchFolders) ? [...clonedProject.researchFolders] : [];
            clonedProject.citations = Array.isArray(clonedProject.citations) ? [...clonedProject.citations] : [];
            clonedProject.thematicTags = Array.isArray(clonedProject.thematicTags) ? [...clonedProject.thematicTags] : [];
            clonedProject.researchTimelines = Array.isArray(clonedProject.researchTimelines) ? [...clonedProject.researchTimelines] : [];
            clonedProject.researchMindMaps = Array.isArray(clonedProject.researchMindMaps) ? [...clonedProject.researchMindMaps] : [];
            clonedProject.materialFolders = Array.isArray(clonedProject.materialFolders) ? [...clonedProject.materialFolders] : [];

            acc[clonedProject.id] = clonedProject as any;
            return acc;
        }, {} as Record<string, Project>);

        useBookCraftStore.setState({
            projects: projectsRecord,
            syncStatus: 'idle',
            lastSyncTime: new Date()
        });

        logger.info('Data loaded from Supabase', { projectCount: projects.length });
    } catch (error) {
        logger.error('Failed to load from Supabase', error);
        useBookCraftStore.setState({ syncStatus: 'error' });
    }
}

export async function saveProjectToSupabase(project: Project): Promise<void> {
    try {
        const user = await authService.getCurrentUser();
        if (!user) {
            logger.warn('No authenticated user, cannot save project');
            return;
        }

        const supabase = getSupabaseClient();
        logger.debug('Saving project to Supabase', { projectId: project.id });

        const { chapters, ...projectData } = project;

        const { error: projectError } = await supabase
            .from('projects')
            .upsert({
                ...projectData,
                user_id: user.id,
                last_modified: new Date().toISOString()
            });

        if (projectError) {
            logger.error('Failed to save project', projectError);
            throw projectError;
        }

        if (chapters && chapters.length > 0) {
            const chaptersData = chapters.map(chapter => ({
                ...chapter,
                project_id: project.id,
                user_id: user.id,
                last_modified: new Date().toISOString()
            }));

            const { error: chaptersError } = await supabase
                .from('chapters')
                .upsert(chaptersData);

            if (chaptersError) {
                logger.error('Failed to save chapters', chaptersError);
                throw chaptersError;
            }
        }

        logger.info('Project saved to Supabase', { projectId: project.id });

        useBookCraftStore.setState({
            lastSyncTime: new Date(),
            syncStatus: 'idle'
        });
    } catch (error) {
        logger.error('Failed to save project to Supabase', error);
        useBookCraftStore.setState({ syncStatus: 'error' });
    }
}

export async function saveChapterToSupabase(chapter: Chapter): Promise<void> {
    try {
        const user = await authService.getCurrentUser();
        if (!user) return;

        const supabase = getSupabaseClient();

        const { error } = await supabase
            .from('chapters')
            .upsert({
                ...chapter,
                user_id: user.id,
                last_modified: new Date().toISOString()
            });

        if (error) {
            logger.error('Failed to save chapter', error);
            throw error;
        }

        logger.debug('Chapter saved to Supabase', { chapterId: chapter.id });
    } catch (error) {
        logger.error('Failed to save chapter to Supabase', error);
    }
}

export async function deleteProjectFromSupabase(projectId: string): Promise<void> {
    try {
        const user = await authService.getCurrentUser();
        if (!user) return;

        const supabase = getSupabaseClient();

        await supabase
            .from('chapters')
            .delete()
            .eq('project_id', projectId)
            .eq('user_id', user.id);

        const { error } = await supabase
            .from('projects')
            .delete()
            .eq('id', projectId)
            .eq('user_id', user.id);

        if (error) {
            logger.error('Failed to delete project', error);
            throw error;
        }

        logger.info('Project deleted from Supabase', { projectId });
    } catch (error) {
        logger.error('Failed to delete project from Supabase', error);
    }
}

export async function deleteChapterFromSupabase(chapterId: string): Promise<void> {
    try {
        const user = await authService.getCurrentUser();
        if (!user) return;

        const supabase = getSupabaseClient();

        const { error } = await supabase
            .from('chapters')
            .delete()
            .eq('id', chapterId)
            .eq('user_id', user.id);

        if (error) {
            logger.error('Failed to delete chapter', error);
            throw error;
        }

        logger.debug('Chapter deleted from Supabase', { chapterId });
    } catch (error) {
        logger.error('Failed to delete chapter from Supabase', error);
    }
}

export function subscribeToRealtimeUpdates(): void {
    const user = authService.getCurrentUser();
    if (!user) return;

    const supabase = getSupabaseClient();

    if (realtimeSubscription) {
        realtimeSubscription.unsubscribe();
    }

    logger.info('Subscribing to Supabase realtime updates');

    realtimeSubscription = supabase
        .channel('user_data_changes')
        .on(
            'postgres_changes',
            {
                event: '*',
                schema: 'public',
                table: 'projects',
                filter: `user_id=eq.${user.id}`
            },
            (payload) => handleProjectChange(payload)
        )
        .on(
            'postgres_changes',
            {
                event: '*',
                schema: 'public',
                table: 'chapters',
                filter: `user_id=eq.${user.id}`
            },
            (payload) => handleChapterChange(payload)
        )
        .subscribe();
}

function handleProjectChange(payload: any): void {
    const { eventType, new: newRecord, old: oldRecord } = payload;

    logger.debug('Realtime project change', { eventType, projectId: newRecord?.id || oldRecord?.id });

    switch (eventType) {
        case 'INSERT':
        case 'UPDATE':
            if (newRecord) {
                useBookCraftStore.setState((state) => ({
                    projects: {
                        ...state.projects,
                        [newRecord.id]: newRecord as Project
                    }
                }));
            }
            break;
        case 'DELETE':
            if (oldRecord) {
                useBookCraftStore.setState((state) => {
                    const { [oldRecord.id]: removed, ...rest } = state.projects;
                    return { projects: rest };
                });
            }
            break;
    }
}

function handleChapterChange(payload: any): void {
    const { eventType, new: newRecord, old: oldRecord } = payload;

    logger.debug('Realtime chapter change', { eventType, chapterId: newRecord?.id || oldRecord?.id });

    const projectId = newRecord?.project_id || oldRecord?.project_id;
    if (!projectId) return;

    switch (eventType) {
        case 'INSERT':
        case 'UPDATE':
            if (newRecord) {
                useBookCraftStore.setState((state) => {
                    const project = state.projects[projectId];
                    if (!project) return state;

                    const chapters = project.chapters || [];
                    const existingIndex = chapters.findIndex(c => c.id === newRecord.id);

                    if (existingIndex >= 0) {
                        chapters[existingIndex] = newRecord as Chapter;
                    } else {
                        chapters.push(newRecord as Chapter);
                    }

                    return {
                        projects: {
                            ...state.projects,
                            [projectId]: {
                                ...project,
                                chapters
                            }
                        }
                    };
                });
            }
            break;
        case 'DELETE':
            if (oldRecord) {
                useBookCraftStore.setState((state) => {
                    const project = state.projects[projectId];
                    if (!project) return state;

                    return {
                        projects: {
                            ...state.projects,
                            [projectId]: {
                                ...project,
                                chapters: project.chapters?.filter(c => c.id !== oldRecord.id) || []
                            }
                        }
                    };
                });
            }
            break;
    }
}

export function unsubscribeFromRealtimeUpdates(): void {
    if (realtimeSubscription) {
        logger.info('Unsubscribing from Supabase realtime updates');
        realtimeSubscription.unsubscribe();
        realtimeSubscription = null;
    }
}

export async function initializeSupabaseSync(): Promise<void> {
    try {
        logger.info('Initializing Supabase sync');
        await loadFromSupabase();
        subscribeToRealtimeUpdates();
        logger.info('Supabase sync initialized');
    } catch (error) {
        logger.error('Failed to initialize Supabase sync', error);
    }
}
