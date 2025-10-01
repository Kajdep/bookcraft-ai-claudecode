import { db } from './indexedDB';
import { getSupabaseClient, isSupabaseAvailable, getCurrentUser } from './supabase';
import { log } from '../logger';
import type { Project, Chapter, ResearchItem, MaterialItem } from '../../types';

/**
 * Sync Engine for BookCraft AI
 * 
 * Handles bidirectional synchronization between:
 * - Local storage (IndexedDB)
 * - Cloud storage (Supabase)
 * 
 * Features:
 * - Background sync every 5 minutes
 * - Conflict resolution (last-write-wins with version tracking)
 * - Offline-first architecture
 * - Sync status tracking
 * - Manual sync trigger
 */

export interface SyncStatus {
    isOnline: boolean;
    isSyncing: boolean;
    lastSyncTime: Date | null;
    lastSyncError: string | null;
    pendingChanges: number;
    cloudAvailable: boolean;
}

export interface SyncResult {
    success: boolean;
    itemsSynced: number;
    errors: string[];
    timestamp: Date;
}

// Sync state
let syncStatus: SyncStatus = {
    isOnline: navigator.onLine,
    isSyncing: false,
    lastSyncTime: null,
    lastSyncError: null,
    pendingChanges: 0,
    cloudAvailable: false
};

// Sync interval (5 minutes)
const SYNC_INTERVAL = 5 * 60 * 1000;
let syncIntervalId: NodeJS.Timeout | null = null;

// Listeners for sync status changes
type SyncStatusListener = (status: SyncStatus) => void;
const statusListeners: Set<SyncStatusListener> = new Set();

/**
 * Initialize the sync engine
 */
export async function initSyncEngine(): Promise<void> {
    log.info('Initializing sync engine...');

    // Check cloud availability
    syncStatus.cloudAvailable = isSupabaseAvailable();

    if (!syncStatus.cloudAvailable) {
        log.warn('Cloud sync not available - Supabase not configured');
        notifyStatusListeners();
        return;
    }

    // Set up online/offline listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial sync if online
    if (navigator.onLine) {
        await performSync();
    }

    // Start background sync interval
    startBackgroundSync();

    log.info('Sync engine initialized', {
        cloudAvailable: syncStatus.cloudAvailable,
        isOnline: syncStatus.isOnline
    });
}

/**
 * Start background sync interval
 */
function startBackgroundSync(): void {
    if (syncIntervalId) {
        clearInterval(syncIntervalId);
    }

    syncIntervalId = setInterval(async () => {
        if (syncStatus.isOnline && syncStatus.cloudAvailable && !syncStatus.isSyncing) {
            await performSync();
        }
    }, SYNC_INTERVAL);

    log.debug('Background sync started', { intervalMs: SYNC_INTERVAL });
}

/**
 * Stop background sync
 */
export function stopBackgroundSync(): void {
    if (syncIntervalId) {
        clearInterval(syncIntervalId);
        syncIntervalId = null;
        log.debug('Background sync stopped');
    }
}

/**
 * Handle online event
 */
function handleOnline(): void {
    log.info('Network connection restored');
    syncStatus.isOnline = true;
    notifyStatusListeners();
    
    // Trigger immediate sync when coming back online
    performSync();
}

/**
 * Handle offline event
 */
function handleOffline(): void {
    log.warn('Network connection lost');
    syncStatus.isOnline = false;
    notifyStatusListeners();
}

/**
 * Perform full synchronization
 */
export async function performSync(): Promise<SyncResult> {
    if (!syncStatus.cloudAvailable) {
        return {
            success: false,
            itemsSynced: 0,
            errors: ['Cloud sync not configured'],
            timestamp: new Date()
        };
    }

    if (!syncStatus.isOnline) {
        return {
            success: false,
            itemsSynced: 0,
            errors: ['No network connection'],
            timestamp: new Date()
        };
    }

    if (syncStatus.isSyncing) {
        log.debug('Sync already in progress, skipping');
        return {
            success: false,
            itemsSynced: 0,
            errors: ['Sync already in progress'],
            timestamp: new Date()
        };
    }

    syncStatus.isSyncing = true;
    syncStatus.lastSyncError = null;
    notifyStatusListeners();

    log.info('Starting sync...');

    const errors: string[] = [];
    let itemsSynced = 0;

    try {
        // Check if user is authenticated
        const user = await getCurrentUser();
        if (!user) {
            log.warn('No authenticated user - skipping cloud sync');
            syncStatus.isSyncing = false;
            notifyStatusListeners();
            return {
                success: false,
                itemsSynced: 0,
                errors: ['Not authenticated'],
                timestamp: new Date()
            };
        }

        // Sync projects
        const projectsResult = await syncProjects(user.id);
        itemsSynced += projectsResult.synced;
        errors.push(...projectsResult.errors);

        // Sync chapters
        const chaptersResult = await syncChapters(user.id);
        itemsSynced += chaptersResult.synced;
        errors.push(...chaptersResult.errors);

        // Sync research items
        const researchResult = await syncResearchItems(user.id);
        itemsSynced += researchResult.synced;
        errors.push(...researchResult.errors);

        // Sync materials
        const materialsResult = await syncMaterials(user.id);
        itemsSynced += materialsResult.synced;
        errors.push(...materialsResult.errors);

        // Update sync status
        syncStatus.lastSyncTime = new Date();
        syncStatus.lastSyncError = errors.length > 0 ? errors.join('; ') : null;

        log.info('Sync completed', {
            itemsSynced,
            errors: errors.length,
            duration: Date.now()
        });

        return {
            success: errors.length === 0,
            itemsSynced,
            errors,
            timestamp: new Date()
        };
    } catch (error) {
        const errorMessage = (error as Error).message;
        log.error('Sync failed', error as Error);
        syncStatus.lastSyncError = errorMessage;
        errors.push(errorMessage);

        return {
            success: false,
            itemsSynced,
            errors,
            timestamp: new Date()
        };
    } finally {
        syncStatus.isSyncing = false;
        notifyStatusListeners();
    }
}

/**
 * Sync projects between local and cloud
 */
async function syncProjects(userId: string): Promise<{ synced: number; errors: string[] }> {
    const client = getSupabaseClient();
    if (!client) return { synced: 0, errors: ['Supabase client not available'] };

    const errors: string[] = [];
    let synced = 0;

    try {
        // Get local projects
        const localProjects = await db.projects.toArray();

        // Get cloud projects
        const { data: cloudProjects, error: fetchError } = await client
            .from('projects')
            .select('*')
            .eq('user_id', userId);

        if (fetchError) {
            errors.push(`Failed to fetch projects: ${fetchError.message}`);
            return { synced, errors };
        }

        // Create maps for easier lookup
        const cloudMap = new Map(cloudProjects?.map(p => [p.id, p]) || []);
        const localMap = new Map(localProjects.map(p => [p.id, p]));

        // Sync local to cloud (upload new/modified)
        for (const local of localProjects) {
            const cloud = cloudMap.get(local.id);

            if (!cloud) {
                // New project - upload to cloud
                const { error: insertError } = await client
                    .from('projects')
                    .insert({
                        ...local,
                        user_id: userId,
                        synced_at: new Date().toISOString()
                    });

                if (insertError) {
                    errors.push(`Failed to upload project ${local.id}: ${insertError.message}`);
                } else {
                    synced++;
                    log.debug('Uploaded new project to cloud', { id: local.id, title: local.title });
                }
            } else if (needsSync(local, cloud)) {
                // Modified project - resolve conflict and sync
                const resolved = resolveConflict(local, cloud);

                if (resolved === local) {
                    // Local wins - upload to cloud
                    const { error: updateError } = await client
                        .from('projects')
                        .update({
                            ...local,
                            synced_at: new Date().toISOString(),
                            version: local.version + 1
                        })
                        .eq('id', local.id);

                    if (updateError) {
                        errors.push(`Failed to update project ${local.id}: ${updateError.message}`);
                    } else {
                        synced++;
                        // Update local version
                        await db.projects.update(local.id, { version: local.version + 1 });
                    }
                } else {
                    // Cloud wins - download to local
                    await db.projects.put(resolved as Project);
                    synced++;
                    log.debug('Downloaded updated project from cloud', { id: cloud.id });
                }
            }
        }

        // Sync cloud to local (download new projects)
        for (const cloud of cloudProjects || []) {
            if (!localMap.has(cloud.id)) {
                await db.projects.add(cloud as Project);
                synced++;
                log.debug('Downloaded new project from cloud', { id: cloud.id });
            }
        }

        log.debug('Projects synced', { synced, errors: errors.length });
        return { synced, errors };
    } catch (error) {
        errors.push(`Project sync error: ${(error as Error).message}`);
        return { synced, errors };
    }
}

/**
 * Sync chapters between local and cloud
 */
async function syncChapters(userId: string): Promise<{ synced: number; errors: string[] }> {
    const client = getSupabaseClient();
    if (!client) return { synced: 0, errors: ['Supabase client not available'] };

    const errors: string[] = [];
    let synced = 0;

    try {
        // Get all local chapters
        const localChapters = await db.chapters.toArray();

        // Get user's project IDs
        const { data: userProjects } = await client
            .from('projects')
            .select('id')
            .eq('user_id', userId);

        const projectIds = userProjects?.map(p => p.id) || [];
        if (projectIds.length === 0) {
            return { synced, errors }; // No projects, no chapters to sync
        }

        // Get cloud chapters for user's projects
        const { data: cloudChapters, error: fetchError } = await client
            .from('chapters')
            .select('*')
            .in('project_id', projectIds);

        if (fetchError) {
            errors.push(`Failed to fetch chapters: ${fetchError.message}`);
            return { synced, errors };
        }

        // Create maps
        const cloudMap = new Map(cloudChapters?.map(c => [c.id, c]) || []);
        const localMap = new Map(localChapters.map(c => [c.id, c]));

        // Filter local chapters to only user's projects
        const userChapters = localChapters.filter(c => projectIds.includes(c.projectId));

        // Sync local to cloud
        for (const local of userChapters) {
            const cloud = cloudMap.get(local.id);

            if (!cloud) {
                // Upload new chapter
                const { error: insertError } = await client
                    .from('chapters')
                    .insert({
                        id: local.id,
                        project_id: local.projectId,
                        title: local.title,
                        content: local.content,
                        order: local.order,
                        status: local.status,
                        word_count: local.wordCount,
                        notes: local.notes,
                        created_at: local.createdAt,
                        last_modified: local.lastModified,
                        synced_at: new Date().toISOString(),
                        version: local.version || 1
                    });

                if (insertError) {
                    errors.push(`Failed to upload chapter ${local.id}: ${insertError.message}`);
                } else {
                    synced++;
                }
            } else if (needsSync(local, cloud)) {
                // Update existing chapter
                const resolved = resolveConflict(local, cloud);

                if (resolved === local) {
                    const { error: updateError } = await client
                        .from('chapters')
                        .update({
                            title: local.title,
                            content: local.content,
                            order: local.order,
                            status: local.status,
                            word_count: local.wordCount,
                            notes: local.notes,
                            last_modified: local.lastModified,
                            synced_at: new Date().toISOString(),
                            version: (local.version || 1) + 1
                        })
                        .eq('id', local.id);

                    if (updateError) {
                        errors.push(`Failed to update chapter ${local.id}: ${updateError.message}`);
                    } else {
                        synced++;
                        await db.chapters.update(local.id, { version: (local.version || 1) + 1 });
                    }
                } else {
                    await db.chapters.put(resolved as Chapter);
                    synced++;
                }
            }
        }

        // Download new chapters from cloud
        for (const cloud of cloudChapters || []) {
            if (!localMap.has(cloud.id)) {
                await db.chapters.add({
                    id: cloud.id,
                    projectId: cloud.project_id,
                    title: cloud.title,
                    content: cloud.content || '',
                    order: cloud.order,
                    status: cloud.status,
                    wordCount: cloud.word_count || 0,
                    notes: cloud.notes,
                    createdAt: new Date(cloud.created_at),
                    lastModified: new Date(cloud.last_modified),
                    version: cloud.version
                } as Chapter);
                synced++;
            }
        }

        log.debug('Chapters synced', { synced, errors: errors.length });
        return { synced, errors };
    } catch (error) {
        errors.push(`Chapter sync error: ${(error as Error).message}`);
        return { synced, errors };
    }
}

/**
 * Sync research items between local and cloud
 */
async function syncResearchItems(userId: string): Promise<{ synced: number; errors: string[] }> {
    const client = getSupabaseClient();
    if (!client) return { synced: 0, errors: ['Supabase client not available'] };

    const errors: string[] = [];
    let synced = 0;

    try {
        const localItems = await db.research.toArray();

        const { data: userProjects } = await client
            .from('projects')
            .select('id')
            .eq('user_id', userId);

        const projectIds = userProjects?.map(p => p.id) || [];
        if (projectIds.length === 0) return { synced, errors };

        const { data: cloudItems, error: fetchError } = await client
            .from('research_items')
            .select('*')
            .in('project_id', projectIds);

        if (fetchError) {
            errors.push(`Failed to fetch research items: ${fetchError.message}`);
            return { synced, errors };
        }

        const cloudMap = new Map(cloudItems?.map(r => [r.id, r]) || []);
        const localMap = new Map(localItems.map(r => [r.id, r]));

        const userItems = localItems.filter(r => projectIds.includes(r.projectId));

        // Upload new/modified items
        for (const local of userItems) {
            const cloud = cloudMap.get(local.id);

            if (!cloud) {
                const { error: insertError } = await client
                    .from('research_items')
                    .insert({
                        id: local.id,
                        project_id: local.projectId,
                        type: local.type,
                        title: local.title,
                        content: local.content,
                        source_url: local.sourceUrl,
                        confidence: local.confidence,
                        verified: local.verified,
                        is_bookmarked: local.isBookmarked,
                        folder_id: local.folderId,
                        tags: local.tags,
                        created_at: local.createdAt,
                        synced_at: new Date().toISOString()
                    });

                if (!insertError) synced++;
                else errors.push(`Failed to upload research ${local.id}`);
            }
        }

        // Download new items
        for (const cloud of cloudItems || []) {
            if (!localMap.has(cloud.id)) {
                await db.research.add({
                    id: cloud.id,
                    projectId: cloud.project_id,
                    type: cloud.type,
                    title: cloud.title,
                    content: cloud.content,
                    sourceUrl: cloud.source_url,
                    confidence: cloud.confidence,
                    verified: cloud.verified,
                    isBookmarked: cloud.is_bookmarked,
                    folderId: cloud.folder_id,
                    tags: cloud.tags || [],
                    createdAt: new Date(cloud.created_at)
                } as ResearchItem);
                synced++;
            }
        }

        log.debug('Research items synced', { synced, errors: errors.length });
        return { synced, errors };
    } catch (error) {
        errors.push(`Research sync error: ${(error as Error).message}`);
        return { synced, errors };
    }
}

/**
 * Sync materials between local and cloud
 */
async function syncMaterials(userId: string): Promise<{ synced: number; errors: string[] }> {
    const client = getSupabaseClient();
    if (!client) return { synced: 0, errors: ['Supabase client not available'] };

    const errors: string[] = [];
    let synced = 0;

    try {
        const localMaterials = await db.materials.toArray();

        const { data: userProjects } = await client
            .from('projects')
            .select('id')
            .eq('user_id', userId);

        const projectIds = userProjects?.map(p => p.id) || [];
        if (projectIds.length === 0) return { synced, errors };

        const { data: cloudMaterials, error: fetchError } = await client
            .from('materials')
            .select('*')
            .in('project_id', projectIds);

        if (fetchError) {
            errors.push(`Failed to fetch materials: ${fetchError.message}`);
            return { synced, errors };
        }

        const cloudMap = new Map(cloudMaterials?.map(m => [m.id, m]) || []);
        const localMap = new Map(localMaterials.map(m => [m.id, m]));

        const userMaterials = localMaterials.filter(m => projectIds.includes(m.projectId));

        // Upload new materials
        for (const local of userMaterials) {
            if (!cloudMap.has(local.id)) {
                const { error: insertError } = await client
                    .from('materials')
                    .insert({
                        id: local.id,
                        project_id: local.projectId,
                        type: local.type,
                        category: local.category,
                        title: local.title,
                        description: local.description,
                        file_id: local.fileId,
                        folder_id: local.folderId,
                        is_bookmarked: local.isBookmarked,
                        is_favorite: local.isFavorite,
                        tags: local.tags,
                        created_at: local.createdAt,
                        synced_at: new Date().toISOString()
                    });

                if (!insertError) synced++;
                else errors.push(`Failed to upload material ${local.id}`);
            }
        }

        // Download new materials
        for (const cloud of cloudMaterials || []) {
            if (!localMap.has(cloud.id)) {
                await db.materials.add({
                    id: cloud.id,
                    projectId: cloud.project_id,
                    type: cloud.type,
                    category: cloud.category,
                    title: cloud.title,
                    description: cloud.description,
                    fileId: cloud.file_id,
                    folderId: cloud.folder_id,
                    isBookmarked: cloud.is_bookmarked,
                    isFavorite: cloud.is_favorite,
                    tags: cloud.tags || [],
                    createdAt: new Date(cloud.created_at),
                    lastModified: new Date(cloud.last_modified)
                } as MaterialItem);
                synced++;
            }
        }

        log.debug('Materials synced', { synced, errors: errors.length });
        return { synced, errors };
    } catch (error) {
        errors.push(`Materials sync error: ${(error as Error).message}`);
        return { synced, errors };
    }
}

/**
 * Check if an item needs syncing based on timestamps and versions
 */
function needsSync(local: any, cloud: any): boolean {
    // If no cloud version, needs sync
    if (!cloud) return true;

    // Compare timestamps
    const localTime = new Date(local.lastModified || local.createdAt).getTime();
    const cloudTime = new Date(cloud.last_modified || cloud.created_at).getTime();

    // If timestamps are significantly different (more than 1 second), needs sync
    return Math.abs(localTime - cloudTime) > 1000;
}

/**
 * Resolve conflict between local and cloud versions
 * Strategy: Last-write-wins based on timestamp
 */
function resolveConflict(local: any, cloud: any): any {
    const localTime = new Date(local.lastModified || local.createdAt).getTime();
    const cloudTime = new Date(cloud.last_modified || cloud.created_at).getTime();

    // Last write wins
    if (localTime >= cloudTime) {
        log.debug('Conflict resolved - local wins', { 
            id: local.id, 
            localTime, 
            cloudTime 
        });
        return local;
    } else {
        log.debug('Conflict resolved - cloud wins', { 
            id: cloud.id, 
            localTime, 
            cloudTime 
        });
        return cloud;
    }
}

/**
 * Get current sync status
 */
export function getSyncStatus(): SyncStatus {
    return { ...syncStatus };
}

/**
 * Subscribe to sync status changes
 */
export function onSyncStatusChange(listener: SyncStatusListener): () => void {
    statusListeners.add(listener);
    
    // Return unsubscribe function
    return () => {
        statusListeners.delete(listener);
    };
}

/**
 * Notify all status listeners
 */
function notifyStatusListeners(): void {
    const status = getSyncStatus();
    statusListeners.forEach(listener => {
        try {
            listener(status);
        } catch (error) {
            log.error('Error in sync status listener', error as Error);
        }
    });
}

/**
 * Force immediate sync (manual trigger)
 */
export async function forceSyncNow(): Promise<SyncResult> {
    log.info('Manual sync triggered');
    return await performSync();
}

/**
 * Clean up sync engine
 */
export function cleanupSyncEngine(): void {
    stopBackgroundSync();
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
    statusListeners.clear();
    log.info('Sync engine cleaned up');
}
