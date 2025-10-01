import Dexie, { Table } from 'dexie';
import type { 
    Project, 
    Chapter, 
    ResearchItem, 
    MaterialItem, 
    Citation,
    WritingSession,
    WritingGoal,
    ProductivityMetrics,
    GeneratedImage
} from '../../types';
import { log } from '../logger';

/**
 * IndexedDB Schema for BookCraft AI
 * 
 * This provides local-first storage with ~250MB capacity (browser dependent).
 * All data is stored locally for instant access and offline capability.
 * Syncs with Supabase cloud storage for backup and multi-device support.
 */

// Database version and schema
export class BookCraftDB extends Dexie {
    // Tables
    projects!: Table<Project, string>;
    chapters!: Table<Chapter, string>;
    research!: Table<ResearchItem, string>;
    materials!: Table<MaterialItem, string>;
    citations!: Table<Citation, string>;
    writingSessions!: Table<WritingSession, string>;
    writingGoals!: Table<WritingGoal, string>;
    dailyMetrics!: Table<ProductivityMetrics & { id: string }, string>;
    generatedImages!: Table<GeneratedImage & { id: string }, string>;
    fileBlobs!: Table<{ id: string; blob: Blob; mimeType: string; size: number; createdAt: Date }, string>;

    constructor() {
        super('BookCraftDB');

        // Define schema version 1
        this.version(1).stores({
            projects: 'id, title, genre, createdAt, lastModified',
            chapters: 'id, projectId, title, order, status, lastModified',
            research: 'id, projectId, type, title, createdAt, folderId',
            materials: 'id, projectId, type, category, title, createdAt, folderId',
            citations: 'id, projectId, sourceId, style, createdAt',
            writingSessions: 'id, projectId, chapterId, startTime, endTime',
            writingGoals: 'id, projectId, type, completed, createdAt, deadline',
            dailyMetrics: 'id, date',
            generatedImages: 'id, projectId, prompt, createdAt',
            fileBlobs: 'id, size, mimeType, createdAt'
        });

        // Hooks for logging
        this.projects.hook('creating', (primKey, obj) => {
            log.debug('Creating project in IndexedDB', { id: obj.id, title: obj.title });
        });

        this.projects.hook('updating', (modifications, primKey, obj) => {
            log.debug('Updating project in IndexedDB', { id: primKey });
        });

        this.projects.hook('deleting', (primKey) => {
            log.debug('Deleting project from IndexedDB', { id: primKey });
        });
    }
}

// Create singleton instance
export const db = new BookCraftDB();

/**
 * Initialize IndexedDB and verify it's working
 */
export async function initIndexedDB(): Promise<boolean> {
    try {
        await db.open();
        log.info('IndexedDB initialized successfully', { 
            dbName: db.name, 
            version: db.verno 
        });
        return true;
    } catch (error) {
        log.error('Failed to initialize IndexedDB', error as Error);
        return false;
    }
}

/**
 * Get storage usage and quota information
 */
export async function getStorageInfo(): Promise<{
    usage: number;
    quota: number;
    percentUsed: number;
    available: number;
}> {
    try {
        if ('storage' in navigator && 'estimate' in navigator.storage) {
            const estimate = await navigator.storage.estimate();
            const usage = estimate.usage || 0;
            const quota = estimate.quota || 0;
            const percentUsed = quota > 0 ? (usage / quota) * 100 : 0;
            const available = quota - usage;

            log.debug('Storage info retrieved', { 
                usageMB: (usage / 1024 / 1024).toFixed(2),
                quotaMB: (quota / 1024 / 1024).toFixed(2),
                percentUsed: percentUsed.toFixed(2)
            });

            return { usage, quota, percentUsed, available };
        }
        
        // Fallback if Storage API not available
        return {
            usage: 0,
            quota: 250 * 1024 * 1024, // Estimate 250MB
            percentUsed: 0,
            available: 250 * 1024 * 1024
        };
    } catch (error) {
        log.error('Failed to get storage info', error as Error);
        return {
            usage: 0,
            quota: 250 * 1024 * 1024,
            percentUsed: 0,
            available: 250 * 1024 * 1024
        };
    }
}

/**
 * Store a file blob in IndexedDB
 */
export async function storeFileBlob(
    fileId: string, 
    blob: Blob, 
    mimeType: string
): Promise<boolean> {
    try {
        await db.fileBlobs.put({
            id: fileId,
            blob,
            mimeType,
            size: blob.size,
            createdAt: new Date()
        });
        
        log.info('File blob stored in IndexedDB', { 
            id: fileId, 
            sizeMB: (blob.size / 1024 / 1024).toFixed(2),
            mimeType 
        });
        
        return true;
    } catch (error) {
        log.error('Failed to store file blob', error as Error, { fileId, mimeType });
        return false;
    }
}

/**
 * Retrieve a file blob from IndexedDB
 */
export async function retrieveFileBlob(fileId: string): Promise<Blob | null> {
    try {
        const record = await db.fileBlobs.get(fileId);
        if (record) {
            log.debug('File blob retrieved from IndexedDB', { 
                id: fileId,
                sizeMB: (record.size / 1024 / 1024).toFixed(2)
            });
            return record.blob;
        }
        log.warn('File blob not found in IndexedDB', { id: fileId });
        return null;
    } catch (error) {
        log.error('Failed to retrieve file blob', error as Error, { fileId });
        return null;
    }
}

/**
 * Delete a file blob from IndexedDB
 */
export async function deleteFileBlob(fileId: string): Promise<boolean> {
    try {
        await db.fileBlobs.delete(fileId);
        log.info('File blob deleted from IndexedDB', { id: fileId });
        return true;
    } catch (error) {
        log.error('Failed to delete file blob', error as Error, { fileId });
        return false;
    }
}

/**
 * Clear all data from IndexedDB (for testing or reset)
 */
export async function clearAllData(): Promise<boolean> {
    try {
        await db.transaction('rw', db.tables, async () => {
            await Promise.all(db.tables.map(table => table.clear()));
        });
        log.info('All IndexedDB data cleared');
        return true;
    } catch (error) {
        log.error('Failed to clear IndexedDB data', error as Error);
        return false;
    }
}

/**
 * Export all data from IndexedDB as JSON
 */
export async function exportAllData(): Promise<string> {
    try {
        const data: Record<string, any[]> = {};
        
        for (const table of db.tables) {
            // Skip fileBlobs as they're binary and huge
            if (table.name === 'fileBlobs') continue;
            data[table.name] = await table.toArray();
        }
        
        log.info('All IndexedDB data exported', { 
            tables: Object.keys(data).length 
        });
        
        return JSON.stringify(data, null, 2);
    } catch (error) {
        log.error('Failed to export IndexedDB data', error as Error);
        return '{}';
    }
}

/**
 * Import data into IndexedDB from JSON
 */
export async function importAllData(jsonData: string): Promise<boolean> {
    try {
        const data = JSON.parse(jsonData);
        
        await db.transaction('rw', db.tables, async () => {
            for (const [tableName, records] of Object.entries(data)) {
                const table = (db as any)[tableName];
                if (table && Array.isArray(records)) {
                    await table.bulkPut(records);
                    log.debug(`Imported ${records.length} records into ${tableName}`);
                }
            }
        });
        
        log.info('All IndexedDB data imported successfully');
        return true;
    } catch (error) {
        log.error('Failed to import IndexedDB data', error as Error);
        return false;
    }
}

/**
 * Get database statistics
 */
export async function getDatabaseStats(): Promise<{
    projects: number;
    chapters: number;
    research: number;
    materials: number;
    fileBlobs: number;
    totalSize: number;
}> {
    try {
        const [
            projectCount,
            chapterCount,
            researchCount,
            materialCount,
            fileBlobCount
        ] = await Promise.all([
            db.projects.count(),
            db.chapters.count(),
            db.research.count(),
            db.materials.count(),
            db.fileBlobs.count()
        ]);

        // Calculate total size of file blobs
        const blobs = await db.fileBlobs.toArray();
        const totalSize = blobs.reduce((sum, blob) => sum + blob.size, 0);

        return {
            projects: projectCount,
            chapters: chapterCount,
            research: researchCount,
            materials: materialCount,
            fileBlobs: fileBlobCount,
            totalSize
        };
    } catch (error) {
        log.error('Failed to get database stats', error as Error);
        return {
            projects: 0,
            chapters: 0,
            research: 0,
            materials: 0,
            fileBlobs: 0,
            totalSize: 0
        };
    }
}
