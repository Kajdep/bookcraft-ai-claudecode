/**
 * Supabase Sync for Zustand Store
 *
 * This module handles syncing Zustand state with Supabase database.
 * - Loads data from Supabase on app mount
 * - Saves changes to Supabase on actions
 * - Subscribes to realtime updates
 */

import { useBookCraftStore } from './useStore';
import { getSupabaseClient } from '../services/storage/supabase';
import { authService } from '../services/auth';
import { logger } from '../services/logger';
import type { Project, Chapter } from '../types';

let realtimeSubscription: any = null;

/**
 * Load all user data from IndexedDB into store (for local-only mode)
 */
export async function loadFromIndexedDB(): Promise<void> {
    try {
        logger.info('Loading data from IndexedDB');
        const { db } = await import('../services/storage/indexedDB');
        
        // Load all projects
        const projects = await db.projects.toArray();
        
        if (!projects || projects.length === 0) {
            logger.info('No projects found in IndexedDB');
            return;
        }
        
        // Load chapters for each project
        const projectsWithChapters = await Promise.all(
            projects.map(async (project) => {
                const chapters = await db.chapters.where('projectId').equals(project.id).toArray();
                return {
                    ...project,
                    chapters: chapters || []
                };
            })
        );
        
        // Transform to Record<string, Project>
        const projectsRecord = projectsWithChapters.reduce((acc, project) => {
            acc[project.id] = project as any;
            return acc;
        }, {} as Record<string, Project>);
        
        // Update store
        useBookCraftStore.setState({
            projects: projectsRecord,
            syncStatus: 'idle',
            lastSyncTime: new Date()
        });
        
        logger.info('Data loaded from IndexedDB', { projectCount: projects.length });
    } catch (error) {
        logger.error('Failed to load from IndexedDB', error);
    }
}

/**
 * Load all user data from Supabase into store
 */
export async function loadFromSupabase(): Promise<void> {
    try {
        const user = await authService.getCurrentUser();
        if (!user) {
            logger.info('No authenticated user, trying IndexedDB instead');
            // Try loading from IndexedDB for local-only mode
            await loadFromIndexedDB();
            return;
        }

        logger.info('Loading data from Supabase', { userId: user.id });
        const supabase = getSupabaseClient();
        
        if (!supabase) {
            logger.info('Supabase not configured, loading from IndexedDB instead');
            // Fall back to IndexedDB when Supabase is not configured
            await loadFromIndexedDB();
            return;
        }

        // Load projects with chapters
        const { data: projects, error } = await supabase
            .from('projects')
            .select(`
                *,
                chapters (*)
            `)
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

        // Transform projects array to Record<string, Project>
        const projectsRecord = projects.reduce((acc, project) => {
            acc[project.id] = project as any;
            return acc;
        }, {} as Record<string, Project>);

        // Update store
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

/**
 * Save a project to Supabase
 */
export async function saveProjectToSupabase(project: Project): Promise<void> {
    try {
        const user = await authService.getCurrentUser();
        if (!user) {
            logger.warn('No authenticated user, cannot save project');
            return;
        }

        const supabase = getSupabaseClient();
        
        if (!supabase) {
            logger.debug('Supabase not configured, skipping cloud save');
            return;
        }
        
        logger.debug('Saving project to Supabase', { projectId: project.id });

        // Prepare project data (exclude chapters for separate save)
        const { chapters, ...projectData } = project;

        // Upsert project
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

        // Upsert chapters if any
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

/**
 * Save a chapter to Supabase
 */
export async function saveChapterToSupabase(chapter: Chapter): Promise<void> {
    try {
        const user = await authService.getCurrentUser();
        if (!user) return;

        const supabase = getSupabaseClient();
        if (!supabase) return;

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

/**
 * Delete a project from Supabase
 */
export async function deleteProjectFromSupabase(projectId: string): Promise<void> {
    try {
        const user = await authService.getCurrentUser();
        if (!user) return;

        const supabase = getSupabaseClient();
        if (!supabase) return;

        // Delete chapters first (cascade should handle this, but explicit is safer)
        await supabase
            .from('chapters')
            .delete()
            .eq('project_id', projectId)
            .eq('user_id', user.id);

        // Delete project
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

/**
 * Delete a chapter from Supabase
 */
export async function deleteChapterFromSupabase(chapterId: string): Promise<void> {
    try {
        const user = await authService.getCurrentUser();
        if (!user) return;

        const supabase = getSupabaseClient();
        if (!supabase) return;

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

/**
 * Subscribe to realtime updates from Supabase
 */
export function subscribeToRealtimeUpdates(): void {
    const user = authService.getCurrentUser();
    if (!user) return;

    const supabase = getSupabaseClient();
    if (!supabase) {
        logger.info('Supabase not configured, skipping realtime updates');
        return;
    }

    // Clean up existing subscription
    if (realtimeSubscription) {
        realtimeSubscription.unsubscribe();
    }

    logger.info('Subscribing to Supabase realtime updates');

    // Subscribe to projects and chapters changes
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

/**
 * Handle project changes from realtime
 */
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

/**
 * Handle chapter changes from realtime
 */
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

/**
 * Unsubscribe from realtime updates
 */
export function unsubscribeFromRealtimeUpdates(): void {
    if (realtimeSubscription) {
        logger.info('Unsubscribing from Supabase realtime updates');
        realtimeSubscription.unsubscribe();
        realtimeSubscription = null;
    }
}

/**
 * Initialize Supabase sync
 */
export async function initializeSupabaseSync(): Promise<void> {
    try {
        logger.info('Initializing Supabase sync');

        // Load initial data
        await loadFromSupabase();

        // Subscribe to realtime updates
        subscribeToRealtimeUpdates();

        logger.info('Supabase sync initialized');
    } catch (error) {
        logger.error('Failed to initialize Supabase sync', error);
    }
}
