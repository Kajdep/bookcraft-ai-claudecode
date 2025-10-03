/**
 * Storage Adapter for Zustand Persist Middleware
 * 
 * This adapter bridges Zustand's persist middleware with our custom
 * storage service that uses IndexedDB + Supabase sync
 */

import { StateStorage } from 'zustand/middleware';
import { storageService } from '@/services/storage/storageService';
import { logger } from '@/services/logger';
import type { Project } from '@/types/project';

/**
 * Custom storage adapter that uses our storage service
 * instead of localStorage
 */
export const storageAdapter: StateStorage = {
    /**
     * Get item from storage
     */
    getItem: async (name: string): Promise<string | null> => {
        try {
            logger.debug('Storage adapter: getting item', { name });
            
            // For the bookcraft-storage key, we need to retrieve all projects
            // and reconstruct the state object
            if (name === 'bookcraft-storage') {
                const projects = await storageService.getAllProjects();
                
                // Get analytics data from localStorage for now
                // (we'll migrate this to IndexedDB in a future iteration)
                const analyticsData = localStorage.getItem('bookcraft-analytics');
                
                // Reconstruct the state object
                const state = {
                    projects: projects.reduce((acc, project) => {
                        acc[project.id] = project;
                        return acc;
                    }, {} as Record<string, Project>),
                    // Include analytics data if available
                    ...(analyticsData ? JSON.parse(analyticsData) : {}),
                };
                
                return JSON.stringify({ state });
            }
            
            // Fallback to localStorage for other keys
            return localStorage.getItem(name);
        } catch (error) {
            logger.error('Storage adapter: failed to get item', error, { name });
            // Fallback to localStorage on error
            return localStorage.getItem(name);
        }
    },

    /**
     * Set item in storage
     */
    setItem: async (name: string, value: string): Promise<void> => {
        try {
            logger.debug('Storage adapter: setting item', { name });

            // Ensure value is a string
            const stringValue = typeof value === 'string' ? value : JSON.stringify(value);

            // For the bookcraft-storage key, parse and save projects individually
            if (name === 'bookcraft-storage') {
                const data = JSON.parse(stringValue);
                const state = data.state || data;
                
                // Save each project individually
                const projects = state.projects || {};
                for (const projectId in projects) {
                    const project = projects[projectId];
                    await storageService.saveProject(project);
                }
                
                // Save analytics data to localStorage for now
                // (we'll migrate this to IndexedDB in a future iteration)
                const analyticsData = {
                    activeProjectId: state.activeProjectId,
                    settings: state.settings,
                    writingSessions: state.writingSessions,
                    writingGoals: state.writingGoals,
                    dailyMetrics: state.dailyMetrics,
                    weeklyMetrics: state.weeklyMetrics,
                    monthlyMetrics: state.monthlyMetrics,
                    writingStreak: state.writingStreak,
                    researchView: state.researchView,
                    researchFilters: state.researchFilters,
                    lastSaved: state.lastSaved,
                };
                localStorage.setItem('bookcraft-analytics', JSON.stringify(analyticsData));
                
                logger.info('Storage adapter: saved state', { 
                    projectCount: Object.keys(projects).length 
                });
                return;
            }

            // Fallback to localStorage for other keys
            localStorage.setItem(name, stringValue);
        } catch (error) {
            logger.error('Storage adapter: failed to set item', error, { name });
            // Fallback to localStorage on error - ensure value is a string
            const fallbackValue = typeof value === 'string' ? value : JSON.stringify(value);
            localStorage.setItem(name, fallbackValue);
        }
    },

    /**
     * Remove item from storage
     */
    removeItem: async (name: string): Promise<void> => {
        try {
            logger.debug('Storage adapter: removing item', { name });
            
            // For the bookcraft-storage key, clear all projects
            if (name === 'bookcraft-storage') {
                const projects = await storageService.getAllProjects();
                for (const project of projects) {
                    await storageService.deleteProject(project.id);
                }
                localStorage.removeItem('bookcraft-analytics');
                return;
            }
            
            // Fallback to localStorage for other keys
            localStorage.removeItem(name);
        } catch (error) {
            logger.error('Storage adapter: failed to remove item', error, { name });
            // Fallback to localStorage on error
            localStorage.removeItem(name);
        }
    },
};

/**
 * Helper function to migrate existing localStorage data to the new storage system
 */
export async function migrateLocalStorageToIndexedDB(): Promise<void> {
    try {
        logger.info('Starting migration from localStorage to IndexedDB');
        
        // Check if migration has already been done
        const migrationComplete = localStorage.getItem('bookcraft-migration-complete');
        if (migrationComplete === 'true') {
            logger.info('Migration already completed, skipping');
            return;
        }
        
        // Get existing data from localStorage
        const existingData = localStorage.getItem('bookcraft-storage');
        if (!existingData) {
            logger.info('No existing data to migrate');
            localStorage.setItem('bookcraft-migration-complete', 'true');
            return;
        }
        
        // Parse the data
        const data = JSON.parse(existingData);
        const state = data.state || data;
        
        // Migrate projects
        const projects = state.projects || {};
        let migratedCount = 0;
        
        for (const projectId in projects) {
            try {
                const project = projects[projectId];
                await storageService.saveProject(project);
                migratedCount++;
                logger.debug('Migrated project', { projectId, title: project.title });
            } catch (error) {
                logger.error('Failed to migrate project', error, { projectId });
            }
        }
        
        logger.info('Migration complete', { migratedProjects: migratedCount });
        
        // Mark migration as complete
        localStorage.setItem('bookcraft-migration-complete', 'true');
        
        // Keep the old data in localStorage as backup for now
        // We can add a cleanup function later if needed
        
    } catch (error) {
        logger.error('Migration failed', error);
        throw error;
    }
}

/**
 * Initialize storage and perform migration if needed
 */
export async function initializeStorage(): Promise<void> {
    try {
        logger.info('Initializing storage system');
        
        // Perform migration from localStorage if needed
        await migrateLocalStorageToIndexedDB();
        
        // Subscribe to storage events
        storageService.on('sync:completed', () => {
            logger.info('Storage sync completed');
        });
        
        storageService.on('sync:error', (error) => {
            logger.error('Storage sync error', error);
        });
        
        storageService.on('connection:offline', () => {
            logger.warn('Connection lost - working in offline mode');
        });
        
        storageService.on('connection:online', () => {
            logger.info('Connection restored - syncing data');
        });
        
        logger.info('Storage system initialized successfully');
    } catch (error) {
        logger.error('Failed to initialize storage', error);
        throw error;
    }
}
