/**
 * Storage Service - Unified API for local and cloud storage
 * 
 * This service provides a single interface for data persistence that abstracts
 * IndexedDB (via Dexie) for local/offline storage and Supabase for cloud sync.
 */

import { db, type DBProject, type DBChapter, type DBResearchItem, type DBMaterial, type DBCitation, type DBAnalytics, type DBFileBlob } from './indexedDB';
import { supabase } from './supabase';
import { syncEngine } from './syncEngine';
import { logger } from '@/services/logger';
import type { Project, Chapter } from '@/types/project';
import type { ResearchItem, Material, Citation } from '@/types/research';

export type StorageMode = 'offline' | 'online' | 'hybrid';
export type SyncStatus = 'idle' | 'syncing' | 'error' | 'offline';

export interface StorageConfig {
    mode: StorageMode;
    autoSync: boolean;
    syncInterval: number; // milliseconds
    maxLocalSize: number; // bytes
}

export interface StorageStats {
    localUsed: number; // bytes
    localAvailable: number; // bytes
    cloudUsed: number; // bytes
    cloudAvailable: number; // bytes
    lastSync: Date | null;
    syncStatus: SyncStatus;
}

/**
 * Main Storage Service Class
 */
class StorageService {
    private config: StorageConfig = {
        mode: 'hybrid',
        autoSync: true,
        syncInterval: 30000, // 30 seconds
        maxLocalSize: 50 * 1024 * 1024, // 50 MB
    };

    private syncStatus: SyncStatus = 'idle';
    private syncInterval: NodeJS.Timeout | null = null;
    private listeners: Map<string, Set<Function>> = new Map();

    constructor() {
        this.initialize();
    }

    /**
     * Initialize storage service
     */
    private async initialize() {
        try {
            logger.info('Initializing storage service');

            // Check if we're online
            const isOnline = navigator.onLine;
            if (!isOnline) {
                this.config.mode = 'offline';
                this.syncStatus = 'offline';
            }

            // Set up online/offline event listeners
            window.addEventListener('online', this.handleOnline.bind(this));
            window.addEventListener('offline', this.handleOffline.bind(this));

            // Start auto-sync if enabled
            if (this.config.autoSync && this.config.mode !== 'offline') {
                this.startAutoSync();
            }

            logger.info('Storage service initialized', { mode: this.config.mode });
        } catch (error) {
            logger.error('Failed to initialize storage service', error);
        }
    }

    /**
     * Configure storage service
     */
    public configure(config: Partial<StorageConfig>) {
        this.config = { ...this.config, ...config };
        logger.info('Storage config updated', this.config);

        // Restart auto-sync if interval changed
        if (config.syncInterval || config.autoSync !== undefined) {
            this.stopAutoSync();
            if (this.config.autoSync) {
                this.startAutoSync();
            }
        }
    }

    /**
     * Get current configuration
     */
    public getConfig(): StorageConfig {
        return { ...this.config };
    }

    /**
     * Get storage statistics
     */
    public async getStats(): Promise<StorageStats> {
        try {
            // Get local storage usage
            const localUsage = await this.getLocalStorageUsage();
            const localAvailable = this.config.maxLocalSize - localUsage;

            // Get cloud storage usage (if online)
            let cloudUsed = 0;
            let cloudAvailable = 0;
            if (this.config.mode !== 'offline') {
                const cloudStats = await this.getCloudStorageUsage();
                cloudUsed = cloudStats.used;
                cloudAvailable = cloudStats.available;
            }

            // Get last sync time
            const lastSync = await this.getLastSyncTime();

            return {
                localUsed: localUsage,
                localAvailable,
                cloudUsed,
                cloudAvailable,
                lastSync,
                syncStatus: this.syncStatus,
            };
        } catch (error) {
            logger.error('Failed to get storage stats', error);
            throw error;
        }
    }

    // ============================================
    // PROJECT OPERATIONS
    // ============================================

    /**
     * Save a project
     */
    public async saveProject(project: Project): Promise<void> {
        try {
            logger.info('Saving project', { projectId: project.id });

            // Save to IndexedDB first (local)
            const dbProject: DBProject = {
                ...project,
                lastModified: new Date(),
                syncStatus: 'pending',
            };
            await db.projects.put(dbProject);

            // Trigger sync if online
            if (this.config.mode !== 'offline') {
                await syncEngine.syncProject(project.id);
            }

            this.emit('project:saved', project);
            logger.info('Project saved successfully', { projectId: project.id });
        } catch (error) {
            logger.error('Failed to save project', error, { projectId: project.id });
            throw error;
        }
    }

    /**
     * Get a project by ID
     */
    public async getProject(id: string): Promise<Project | null> {
        try {
            // Try to get from IndexedDB first
            const project = await db.projects.get(id);
            if (project) {
                return project;
            }

            // If not found locally and online, try to fetch from cloud
            if (this.config.mode !== 'offline') {
                const { data, error } = await supabase
                    .from('projects')
                    .select('*')
                    .eq('id', id)
                    .single();

                if (error) {
                    logger.warn('Failed to fetch project from cloud', error, { projectId: id });
                    return null;
                }

                // Cache in IndexedDB
                if (data) {
                    await db.projects.put({ ...data, syncStatus: 'synced' });
                    return data;
                }
            }

            return null;
        } catch (error) {
            logger.error('Failed to get project', error, { projectId: id });
            throw error;
        }
    }

    /**
     * Get all projects
     */
    public async getAllProjects(): Promise<Project[]> {
        try {
            // Get from IndexedDB
            const projects = await db.projects.toArray();

            // If online, sync with cloud in background
            if (this.config.mode !== 'offline') {
                this.syncAllProjects().catch((error) => {
                    logger.warn('Background project sync failed', error);
                });
            }

            return projects;
        } catch (error) {
            logger.error('Failed to get all projects', error);
            throw error;
        }
    }

    /**
     * Delete a project
     */
    public async deleteProject(id: string): Promise<void> {
        try {
            logger.info('Deleting project', { projectId: id });

            // Delete from IndexedDB
            await db.projects.delete(id);

            // Delete associated chapters
            await db.chapters.where('projectId').equals(id).delete();

            // Delete from cloud if online
            if (this.config.mode !== 'offline') {
                const { error } = await supabase
                    .from('projects')
                    .delete()
                    .eq('id', id);

                if (error) {
                    logger.warn('Failed to delete project from cloud', error, { projectId: id });
                }
            }

            this.emit('project:deleted', id);
            logger.info('Project deleted successfully', { projectId: id });
        } catch (error) {
            logger.error('Failed to delete project', error, { projectId: id });
            throw error;
        }
    }

    // ============================================
    // CHAPTER OPERATIONS
    // ============================================

    /**
     * Save a chapter
     */
    public async saveChapter(chapter: Chapter): Promise<void> {
        try {
            logger.info('Saving chapter', { chapterId: chapter.id });

            const dbChapter: DBChapter = {
                ...chapter,
                lastModified: new Date(),
                syncStatus: 'pending',
            };
            await db.chapters.put(dbChapter);

            if (this.config.mode !== 'offline') {
                await syncEngine.syncChapter(chapter.id);
            }

            this.emit('chapter:saved', chapter);
            logger.info('Chapter saved successfully', { chapterId: chapter.id });
        } catch (error) {
            logger.error('Failed to save chapter', error, { chapterId: chapter.id });
            throw error;
        }
    }

    /**
     * Get chapters for a project
     */
    public async getChapters(projectId: string): Promise<Chapter[]> {
        try {
            const chapters = await db.chapters
                .where('projectId')
                .equals(projectId)
                .toArray();

            return chapters;
        } catch (error) {
            logger.error('Failed to get chapters', error, { projectId });
            throw error;
        }
    }

    /**
     * Delete a chapter
     */
    public async deleteChapter(id: string): Promise<void> {
        try {
            logger.info('Deleting chapter', { chapterId: id });

            await db.chapters.delete(id);

            if (this.config.mode !== 'offline') {
                const { error } = await supabase
                    .from('chapters')
                    .delete()
                    .eq('id', id);

                if (error) {
                    logger.warn('Failed to delete chapter from cloud', error, { chapterId: id });
                }
            }

            this.emit('chapter:deleted', id);
            logger.info('Chapter deleted successfully', { chapterId: id });
        } catch (error) {
            logger.error('Failed to delete chapter', error, { chapterId: id });
            throw error;
        }
    }

    // ============================================
    // RESEARCH OPERATIONS
    // ============================================

    /**
     * Save research item
     */
    public async saveResearchItem(item: ResearchItem): Promise<void> {
        try {
            const dbItem: DBResearchItem = {
                ...item,
                lastModified: new Date(),
                syncStatus: 'pending',
            };
            await db.research.put(dbItem);

            if (this.config.mode !== 'offline') {
                await syncEngine.syncResearchItem(item.id);
            }

            this.emit('research:saved', item);
        } catch (error) {
            logger.error('Failed to save research item', error, { itemId: item.id });
            throw error;
        }
    }

    /**
     * Get research items for a project
     */
    public async getResearchItems(projectId: string): Promise<ResearchItem[]> {
        try {
            const items = await db.research
                .where('projectId')
                .equals(projectId)
                .toArray();

            return items;
        } catch (error) {
            logger.error('Failed to get research items', error, { projectId });
            throw error;
        }
    }

    // ============================================
    // MATERIAL OPERATIONS
    // ============================================

    /**
     * Save material
     */
    public async saveMaterial(material: Material): Promise<void> {
        try {
            const dbMaterial: DBMaterial = {
                ...material,
                lastModified: new Date(),
                syncStatus: 'pending',
            };
            await db.materials.put(dbMaterial);

            if (this.config.mode !== 'offline') {
                await syncEngine.syncMaterial(material.id);
            }

            this.emit('material:saved', material);
        } catch (error) {
            logger.error('Failed to save material', error, { materialId: material.id });
            throw error;
        }
    }

    /**
     * Get materials for a project
     */
    public async getMaterials(projectId: string): Promise<Material[]> {
        try {
            const materials = await db.materials
                .where('projectId')
                .equals(projectId)
                .toArray();

            return materials;
        } catch (error) {
            logger.error('Failed to get materials', error, { projectId });
            throw error;
        }
    }

    // ============================================
    // SYNC OPERATIONS
    // ============================================

    /**
     * Manually trigger sync
     */
    public async sync(): Promise<void> {
        if (this.syncStatus === 'syncing') {
            logger.warn('Sync already in progress');
            return;
        }

        try {
            this.syncStatus = 'syncing';
            this.emit('sync:started');

            logger.info('Starting manual sync');
            await syncEngine.syncAll();

            this.syncStatus = 'idle';
            this.emit('sync:completed');
            logger.info('Manual sync completed');
        } catch (error) {
            this.syncStatus = 'error';
            this.emit('sync:error', error);
            logger.error('Manual sync failed', error);
            throw error;
        }
    }

    /**
     * Start auto-sync
     */
    private startAutoSync() {
        if (this.syncInterval) {
            return;
        }

        logger.info('Starting auto-sync', { interval: this.config.syncInterval });
        this.syncInterval = setInterval(async () => {
            if (this.config.mode !== 'offline' && this.syncStatus !== 'syncing') {
                try {
                    await this.sync();
                } catch (error) {
                    logger.error('Auto-sync failed', error);
                }
            }
        }, this.config.syncInterval);
    }

    /**
     * Stop auto-sync
     */
    private stopAutoSync() {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
            this.syncInterval = null;
            logger.info('Auto-sync stopped');
        }
    }

    /**
     * Sync all projects
     */
    private async syncAllProjects(): Promise<void> {
        try {
            await syncEngine.syncAll();
        } catch (error) {
            logger.error('Failed to sync all projects', error);
        }
    }

    // ============================================
    // UTILITY METHODS
    // ============================================

    /**
     * Get local storage usage in bytes
     */
    private async getLocalStorageUsage(): Promise<number> {
        try {
            if ('storage' in navigator && 'estimate' in navigator.storage) {
                const estimate = await navigator.storage.estimate();
                return estimate.usage || 0;
            }
            // Fallback: estimate based on IndexedDB content
            const projectsSize = await this.estimateTableSize('projects');
            const chaptersSize = await this.estimateTableSize('chapters');
            const researchSize = await this.estimateTableSize('research');
            return projectsSize + chaptersSize + researchSize;
        } catch (error) {
            logger.error('Failed to get local storage usage', error);
            return 0;
        }
    }

    /**
     * Estimate size of an IndexedDB table
     */
    private async estimateTableSize(tableName: keyof typeof db): Promise<number> {
        try {
            const data = await (db[tableName] as any).toArray();
            const jsonString = JSON.stringify(data);
            return new Blob([jsonString]).size;
        } catch (error) {
            logger.error('Failed to estimate table size', error, { tableName });
            return 0;
        }
    }

    /**
     * Get cloud storage usage
     */
    private async getCloudStorageUsage(): Promise<{ used: number; available: number }> {
        // Supabase free tier: 500 MB database, 1 GB file storage
        // For now, return placeholder values
        // In production, you would query Supabase for actual usage
        return {
            used: 0,
            available: 500 * 1024 * 1024, // 500 MB
        };
    }

    /**
     * Get last sync time
     */
    private async getLastSyncTime(): Promise<Date | null> {
        try {
            // Get the most recent lastModified timestamp from any synced item
            const project = await db.projects
                .orderBy('lastModified')
                .reverse()
                .first();

            return project?.lastModified || null;
        } catch (error) {
            logger.error('Failed to get last sync time', error);
            return null;
        }
    }

    /**
     * Handle online event
     */
    private handleOnline() {
        logger.info('Connection restored');
        this.config.mode = 'hybrid';
        this.syncStatus = 'idle';
        this.emit('connection:online');

        // Trigger immediate sync
        this.sync().catch((error) => {
            logger.error('Failed to sync after going online', error);
        });

        // Restart auto-sync
        if (this.config.autoSync) {
            this.startAutoSync();
        }
    }

    /**
     * Handle offline event
     */
    private handleOffline() {
        logger.info('Connection lost');
        this.config.mode = 'offline';
        this.syncStatus = 'offline';
        this.emit('connection:offline');

        // Stop auto-sync
        this.stopAutoSync();
    }

    // ============================================
    // EVENT SYSTEM
    // ============================================

    /**
     * Subscribe to storage events
     */
    public on(event: string, callback: Function) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, new Set());
        }
        this.listeners.get(event)!.add(callback);
    }

    /**
     * Unsubscribe from storage events
     */
    public off(event: string, callback: Function) {
        const callbacks = this.listeners.get(event);
        if (callbacks) {
            callbacks.delete(callback);
        }
    }

    /**
     * Emit storage event
     */
    private emit(event: string, data?: any) {
        const callbacks = this.listeners.get(event);
        if (callbacks) {
            callbacks.forEach((callback) => {
                try {
                    callback(data);
                } catch (error) {
                    logger.error('Error in storage event callback', error, { event });
                }
            });
        }
    }

    /**
     * Clean up
     */
    public destroy() {
        this.stopAutoSync();
        window.removeEventListener('online', this.handleOnline.bind(this));
        window.removeEventListener('offline', this.handleOffline.bind(this));
        this.listeners.clear();
        logger.info('Storage service destroyed');
    }
}

// Export singleton instance
export const storageService = new StorageService();
