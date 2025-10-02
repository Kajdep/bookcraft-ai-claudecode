/**
 * Sync Engine Tests
 * 
 * Tests the synchronization between IndexedDB and Supabase:
 * - Background sync
 * - Conflict resolution
 * - Offline mode
 * - Manual sync trigger
 * - Data consistency
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { syncEngine } from '../../services/storage/syncEngine';
import { db } from '../../services/storage/indexedDB';
import { supabase } from '../../services/storage/supabase';
import { logger } from '../../services/logger';

// Mock Supabase
vi.mock('../../services/storage/supabase', () => ({
    supabase: {
        from: vi.fn()
    }
}));

describe('Sync Engine', () => {
    beforeEach(async () => {
        // Clear IndexedDB
        await db.delete();
        await db.open();
        
        // Reset mocks
        vi.clearAllMocks();
    });

    afterEach(async () => {
        await db.delete();
    });

    describe('Project Sync', () => {
        it('should sync a new project to Supabase', async () => {
            const testProject = {
                id: 'proj_1',
                title: 'Test Project',
                genre: 'Fiction',
                visualStyle: 'modern',
                status: 'draft' as const,
                createdAt: new Date(),
                lastModified: new Date(),
                syncStatus: 'pending' as const,
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
                    defaultCitationStyle: 'APA' as const,
                    autoFactCheck: false,
                    contradictionDetection: true,
                    researchSuggestions: true
                }
            };

            // Add project to IndexedDB
            await db.projects.add(testProject);

            // Mock Supabase response
            const mockUpsert = vi.fn().mockResolvedValue({ data: testProject, error: null });
            const mockFrom = vi.fn().mockReturnValue({
                upsert: mockUpsert
            });
            (supabase.from as any) = mockFrom;

            // Sync project
            await syncEngine.syncProject('proj_1');

            // Verify Supabase was called
            expect(mockFrom).toHaveBeenCalledWith('projects');
            expect(mockUpsert).toHaveBeenCalled();

            // Verify project status was updated
            const updated = await db.projects.get('proj_1');
            expect(updated?.syncStatus).toBe('synced');
        });

        it('should handle sync conflicts with last-write-wins', async () => {
            const localProject = {
                id: 'proj_conflict',
                title: 'Local Version',
                genre: 'Fiction',
                visualStyle: 'modern',
                status: 'draft' as const,
                createdAt: new Date('2024-01-01'),
                lastModified: new Date('2024-01-02T10:00:00Z'),
                syncStatus: 'pending' as const,
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
                    defaultCitationStyle: 'APA' as const,
                    autoFactCheck: false,
                    contradictionDetection: true,
                    researchSuggestions: true
                }
            };

            const cloudProject = {
                ...localProject,
                title: 'Cloud Version',
                lastModified: new Date('2024-01-02T12:00:00Z') // Newer
            };

            // Add local project
            await db.projects.add(localProject);

            // Mock Supabase to return newer cloud version
            const mockSelect = vi.fn().mockResolvedValue({ 
                data: [cloudProject], 
                error: null 
            });
            const mockUpsert = vi.fn().mockResolvedValue({ data: cloudProject, error: null });
            const mockFrom = vi.fn().mockReturnValue({
                select: vi.fn().mockReturnValue({
                    eq: vi.fn().mockReturnValue({
                        single: mockSelect
                    })
                }),
                upsert: mockUpsert
            });
            (supabase.from as any) = mockFrom;

            // Sync (should resolve conflict)
            await syncEngine.syncProject('proj_conflict');

            // Local version should be updated with cloud version (newer)
            const resolved = await db.projects.get('proj_conflict');
            expect(resolved?.title).toBe('Cloud Version');
            expect(resolved?.syncStatus).toBe('synced');
        });

        it('should handle offline mode gracefully', async () => {
            const testProject = {
                id: 'proj_offline',
                title: 'Offline Project',
                genre: 'Fiction',
                visualStyle: 'modern',
                status: 'draft' as const,
                createdAt: new Date(),
                lastModified: new Date(),
                syncStatus: 'pending' as const,
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
                    defaultCitationStyle: 'APA' as const,
                    autoFactCheck: false,
                    contradictionDetection: true,
                    researchSuggestions: true
                }
            };

            await db.projects.add(testProject);

            // Mock network error
            const mockFrom = vi.fn().mockReturnValue({
                upsert: vi.fn().mockRejectedValue(new Error('Network error'))
            });
            (supabase.from as any) = mockFrom;

            const loggerSpy = vi.spyOn(logger, 'error');

            // Attempt sync (should fail gracefully)
            await syncEngine.syncProject('proj_offline');

            // Verify error was logged
            expect(loggerSpy).toHaveBeenCalled();

            // Project should remain in pending status
            const project = await db.projects.get('proj_offline');
            expect(project?.syncStatus).toBe('pending');
        });
    });

    describe('Batch Sync', () => {
        it('should sync all pending projects', async () => {
            const projects = Array.from({ length: 3 }, (_, i) => ({
                id: `proj_${i}`,
                title: `Project ${i}`,
                genre: 'Fiction',
                visualStyle: 'modern',
                status: 'draft' as const,
                createdAt: new Date(),
                lastModified: new Date(),
                syncStatus: 'pending' as const,
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
                researchMindMaps: [],
                researchTimelines: [],
                materials: [],
                materialFolders: [],
                researchSettings: {
                    defaultCitationStyle: 'APA' as const,
                    autoFactCheck: false,
                    contradictionDetection: true,
                    researchSuggestions: true
                }
            }));

            // Add all projects
            await db.projects.bulkAdd(projects);

            // Mock Supabase
            const mockUpsert = vi.fn().mockResolvedValue({ data: null, error: null });
            const mockFrom = vi.fn().mockReturnValue({
                upsert: mockUpsert
            });
            (supabase.from as any) = mockFrom;

            // Sync all
            await syncEngine.syncAll();

            // Verify all were synced
            const allProjects = await db.projects.toArray();
            expect(allProjects.every(p => p.syncStatus === 'synced')).toBe(true);
            expect(mockUpsert).toHaveBeenCalledTimes(3);
        });

        it('should continue syncing if one project fails', async () => {
            const projects = [
                {
                    id: 'proj_good1',
                    title: 'Good Project 1',
                    genre: 'Fiction',
                    visualStyle: 'modern',
                    status: 'draft' as const,
                    createdAt: new Date(),
                    lastModified: new Date(),
                    syncStatus: 'pending' as const,
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
                        defaultCitationStyle: 'APA' as const,
                        autoFactCheck: false,
                        contradictionDetection: true,
                        researchSuggestions: true
                    }
                },
                {
                    id: 'proj_bad',
                    title: 'Bad Project',
                    genre: 'Fiction',
                    visualStyle: 'modern',
                    status: 'draft' as const,
                    createdAt: new Date(),
                    lastModified: new Date(),
                    syncStatus: 'pending' as const,
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
                        defaultCitationStyle: 'APA' as const,
                        autoFactCheck: false,
                        contradictionDetection: true,
                        researchSuggestions: true
                    }
                },
                {
                    id: 'proj_good2',
                    title: 'Good Project 2',
                    genre: 'Fiction',
                    visualStyle: 'modern',
                    status: 'draft' as const,
                    createdAt: new Date(),
                    lastModified: new Date(),
                    syncStatus: 'pending' as const,
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
                        defaultCitationStyle: 'APA' as const,
                        autoFactCheck: false,
                        contradictionDetection: true,
                        researchSuggestions: true
                    }
                }
            ];

            await db.projects.bulkAdd(projects);

            // Mock Supabase to fail for 'proj_bad'
            const mockUpsert = vi.fn().mockImplementation((data: any) => {
                if (data.id === 'proj_bad') {
                    return Promise.reject(new Error('Sync failed'));
                }
                return Promise.resolve({ data, error: null });
            });
            const mockFrom = vi.fn().mockReturnValue({
                upsert: mockUpsert
            });
            (supabase.from as any) = mockFrom;

            await syncEngine.syncAll();

            // Good projects should be synced
            const good1 = await db.projects.get('proj_good1');
            const good2 = await db.projects.get('proj_good2');
            expect(good1?.syncStatus).toBe('synced');
            expect(good2?.syncStatus).toBe('synced');

            // Bad project should remain pending
            const bad = await db.projects.get('proj_bad');
            expect(bad?.syncStatus).toBe('pending');
        });
    });

    describe('Chapter Sync', () => {
        it('should sync chapters when project syncs', async () => {
            const testProject = {
                id: 'proj_with_chapters',
                title: 'Project with Chapters',
                genre: 'Fiction',
                visualStyle: 'modern',
                status: 'draft' as const,
                createdAt: new Date(),
                lastModified: new Date(),
                syncStatus: 'pending' as const,
                chapters: [
                    {
                        id: 'chap_1',
                        title: 'Chapter 1',
                        content: 'Content 1',
                        status: 'draft' as const,
                        order: 0,
                        notes: '',
                        structure: []
                    },
                    {
                        id: 'chap_2',
                        title: 'Chapter 2',
                        content: 'Content 2',
                        status: 'draft' as const,
                        order: 1,
                        notes: '',
                        structure: []
                    }
                ],
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
                    defaultCitationStyle: 'APA' as const,
                    autoFactCheck: false,
                    contradictionDetection: true,
                    researchSuggestions: true
                }
            };

            await db.projects.add(testProject);

            // Mock Supabase
            const mockUpsert = vi.fn().mockResolvedValue({ data: testProject, error: null });
            const mockFrom = vi.fn().mockReturnValue({
                upsert: mockUpsert
            });
            (supabase.from as any) = mockFrom;

            await syncEngine.syncProject('proj_with_chapters');

            // Verify chapters were included in sync
            expect(mockUpsert).toHaveBeenCalled();
            const syncedData = mockUpsert.mock.calls[0][0];
            expect(syncedData.chapters).toHaveLength(2);
        });
    });

    describe('Sync Status Tracking', () => {
        it('should update sync status correctly', async () => {
            const testProject = {
                id: 'proj_status',
                title: 'Status Test',
                genre: 'Fiction',
                visualStyle: 'modern',
                status: 'draft' as const,
                createdAt: new Date(),
                lastModified: new Date(),
                syncStatus: 'pending' as const,
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
                    defaultCitationStyle: 'APA' as const,
                    autoFactCheck: false,
                    contradictionDetection: true,
                    researchSuggestions: true
                }
            };

            await db.projects.add(testProject);

            // Verify initial status
            let project = await db.projects.get('proj_status');
            expect(project?.syncStatus).toBe('pending');

            // Mock successful sync
            const mockUpsert = vi.fn().mockResolvedValue({ data: testProject, error: null });
            const mockFrom = vi.fn().mockReturnValue({
                upsert: mockUpsert
            });
            (supabase.from as any) = mockFrom;

            await syncEngine.syncProject('proj_status');

            // Verify status changed to synced
            project = await db.projects.get('proj_status');
            expect(project?.syncStatus).toBe('synced');
        });
    });

    describe('Performance', () => {
        it('should handle large batch syncs efficiently', async () => {
            const projects = Array.from({ length: 100 }, (_, i) => ({
                id: `proj_batch_${i}`,
                title: `Batch Project ${i}`,
                genre: 'Fiction',
                visualStyle: 'modern',
                status: 'draft' as const,
                createdAt: new Date(),
                lastModified: new Date(),
                syncStatus: 'pending' as const,
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
                    defaultCitationStyle: 'APA' as const,
                    autoFactCheck: false,
                    contradictionDetection: true,
                    researchSuggestions: true
                }
            }));

            await db.projects.bulkAdd(projects);

            // Mock fast Supabase responses
            const mockUpsert = vi.fn().mockResolvedValue({ data: null, error: null });
            const mockFrom = vi.fn().mockReturnValue({
                upsert: mockUpsert
            });
            (supabase.from as any) = mockFrom;

            const startTime = Date.now();
            await syncEngine.syncAll();
            const duration = Date.now() - startTime;

            // Should complete reasonably fast (under 10 seconds for 100 items)
            expect(duration).toBeLessThan(10000);

            // All should be synced
            const allProjects = await db.projects.toArray();
            expect(allProjects.every(p => p.syncStatus === 'synced')).toBe(true);
        }, 15000); // Increase timeout for this test
    });
});
