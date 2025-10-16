/**
 * Storage Migration Tests
 * 
 * Tests the migration from localStorage to IndexedDB to ensure:
 * - No data loss during migration
 * - Proper error handling
 * - Large project support
 * - Migration failure recovery
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { migrateLocalStorageToIndexedDB } from '../../store/storageAdapter';
import { db } from '../../services/storage/indexedDB';
import { logger } from '../../services/logger';

// Mock localStorage
const createMockLocalStorage = () => {
    let store: Record<string, string> = {};
    return {
        getItem: (key: string) => store[key] || null,
        setItem: (key: string, value: string) => {
            store[key] = value;
        },
        removeItem: (key: string) => {
            delete store[key];
        },
        clear: () => {
            store = {};
        },
        get length() {
            return Object.keys(store).length;
        },
        key: (index: number) => {
            const keys = Object.keys(store);
            return keys[index] || null;
        }
    };
};

describe('Storage Migration', () => {
    let mockLocalStorage: ReturnType<typeof createMockLocalStorage>;

    beforeEach(() => {
        // Set up mock localStorage
        mockLocalStorage = createMockLocalStorage();
        Object.defineProperty(window, 'localStorage', {
            value: mockLocalStorage,
            writable: true
        });

        // Clear IndexedDB
        return db.delete().then(() => db.open());
    });

    afterEach(async () => {
        // Clean up
        mockLocalStorage.clear();
        await db.delete();
    });

    describe('Basic Migration', () => {
        it('should migrate a single project successfully', async () => {
            // Create test data in localStorage
            const testProject = {
                id: 'proj_1',
                title: 'Test Project',
                genre: 'Fiction',
                visualStyle: 'modern',
                status: 'draft',
                createdAt: new Date().toISOString(),
                chapters: [
                    {
                        id: 'chap_1',
                        title: 'Chapter 1',
                        content: 'Test content',
                        status: 'draft',
                        order: 0,
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
                    defaultCitationStyle: 'APA',
                    autoFactCheck: false,
                    contradictionDetection: true,
                    researchSuggestions: true
                }
            };

            const stateData = {
                state: {
                    projects: {
                        [testProject.id]: testProject
                    },
                    activeProjectId: testProject.id
                }
            };

            mockLocalStorage.setItem('bookcraft-storage', JSON.stringify(stateData));

            // Run migration
            await migrateLocalStorageToIndexedDB();

            // Verify project was migrated
            const migratedProject = await db.projects.get(testProject.id);
            expect(migratedProject).toBeDefined();
            expect(migratedProject?.title).toBe(testProject.title);
            expect(migratedProject?.chapters).toHaveLength(1);
            expect(migratedProject?.chapters[0].title).toBe('Chapter 1');

            // Verify migration flag was set
            expect(mockLocalStorage.getItem('bookcraft-migration-complete')).toBe('true');
        });

        it('should migrate multiple projects', async () => {
            const projects = Array.from({ length: 5 }, (_, i) => ({
                id: `proj_${i}`,
                title: `Test Project ${i}`,
                genre: 'Fiction',
                visualStyle: 'modern',
                status: 'draft',
                createdAt: new Date().toISOString(),
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
                    defaultCitationStyle: 'APA',
                    autoFactCheck: false,
                    contradictionDetection: true,
                    researchSuggestions: true
                }
            }));

            const stateData = {
                state: {
                    projects: projects.reduce((acc, p) => {
                        acc[p.id] = p;
                        return acc;
                    }, {} as any)
                }
            };

            mockLocalStorage.setItem('bookcraft-storage', JSON.stringify(stateData));

            await migrateLocalStorageToIndexedDB();

            // Verify all projects were migrated
            const migratedProjects = await db.projects.toArray();
            expect(migratedProjects).toHaveLength(5);
            
            for (let i = 0; i < 5; i++) {
                const project = migratedProjects.find(p => p.id === `proj_${i}`);
                expect(project).toBeDefined();
                expect(project?.title).toBe(`Test Project ${i}`);
            }
        });

        it('should not migrate if already migrated', async () => {
            mockLocalStorage.setItem('bookcraft-migration-complete', 'true');
            
            const loggerSpy = vi.spyOn(logger, 'info');

            await migrateLocalStorageToIndexedDB();

            expect(loggerSpy).toHaveBeenCalledWith('Migration already completed, skipping');
            
            const projects = await db.projects.toArray();
            expect(projects).toHaveLength(0);
        });

        it('should handle empty localStorage gracefully', async () => {
            await migrateLocalStorageToIndexedDB();

            expect(mockLocalStorage.getItem('bookcraft-migration-complete')).toBe('true');
            
            const projects = await db.projects.toArray();
            expect(projects).toHaveLength(0);
        });
    });

    describe('Large Project Migration', () => {
        it('should migrate a large project with many chapters', async () => {
            const largeProject = {
                id: 'proj_large',
                title: 'Large Project',
                genre: 'Fiction',
                visualStyle: 'modern',
                status: 'draft',
                createdAt: new Date().toISOString(),
                chapters: Array.from({ length: 50 }, (_, i) => ({
                    id: `chap_${i}`,
                    title: `Chapter ${i + 1}`,
                    content: 'Lorem ipsum '.repeat(1000), // ~11KB per chapter
                    status: 'draft',
                    order: i,
                    notes: '',
                    structure: []
                })),
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
                    defaultCitationStyle: 'APA',
                    autoFactCheck: false,
                    contradictionDetection: true,
                    researchSuggestions: true
                }
            };

            const stateData = {
                state: {
                    projects: {
                        [largeProject.id]: largeProject
                    }
                }
            };

            mockLocalStorage.setItem('bookcraft-storage', JSON.stringify(stateData));

            await migrateLocalStorageToIndexedDB();

            const migratedProject = await db.projects.get(largeProject.id);
            expect(migratedProject).toBeDefined();
            expect(migratedProject?.chapters).toHaveLength(50);
            expect(migratedProject?.chapters[0].content).toBe('Lorem ipsum '.repeat(1000));
        });
    });

    describe('Error Handling', () => {
        it('should handle corrupt localStorage data', async () => {
            mockLocalStorage.setItem('bookcraft-storage', 'invalid json {{{');

            const loggerSpy = vi.spyOn(logger, 'error');

            await expect(migrateLocalStorageToIndexedDB()).rejects.toThrow();
            expect(loggerSpy).toHaveBeenCalledWith('Migration failed', expect.any(Error));
        });

        it('should continue migration if one project fails', async () => {
            const goodProject = {
                id: 'proj_good',
                title: 'Good Project',
                genre: 'Fiction',
                visualStyle: 'modern',
                status: 'draft',
                createdAt: new Date().toISOString(),
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
                    defaultCitationStyle: 'APA',
                    autoFactCheck: false,
                    contradictionDetection: true,
                    researchSuggestions: true
                }
            };

            const badProject = {
                id: null, // Invalid ID
                title: 'Bad Project'
            };

            const stateData = {
                state: {
                    projects: {
                        'proj_good': goodProject,
                        'proj_bad': badProject
                    }
                }
            };

            mockLocalStorage.setItem('bookcraft-storage', JSON.stringify(stateData));

            const loggerSpy = vi.spyOn(logger, 'error');

            await migrateLocalStorageToIndexedDB();

            // Good project should be migrated
            const migratedGood = await db.projects.get('proj_good');
            expect(migratedGood).toBeDefined();

            // Bad project should have logged an error
            expect(loggerSpy).toHaveBeenCalled();
        });
    });

    describe('Data Integrity', () => {
        it('should preserve all project properties', async () => {
            const testProject = {
                id: 'proj_complete',
                title: 'Complete Project',
                genre: 'Sci-Fi',
                visualStyle: 'cyberpunk',
                status: 'draft',
                createdAt: new Date().toISOString(),
                metadata: {
                    description: 'A test project',
                    author: 'Test Author',
                    wordCount: 1000
                },
                chapters: [
                    {
                        id: 'chap_1',
                        title: 'Chapter 1',
                        content: 'Content here',
                        status: 'completed',
                        order: 0,
                        notes: 'Test notes',
                        structure: []
                    }
                ],
                plotPoints: [
                    {
                        id: 'plot_1',
                        title: 'Plot Point 1',
                        description: 'First major event',
                        order: 0
                    }
                ],
                recommendations: [],
                visuals: [],
                generatedImages: [],
                research: [
                    {
                        id: 'research_1',
                        query: 'Test query',
                        type: 'general',
                        content: 'Research content',
                        summary: 'Summary',
                        confidence: 'high',
                        sources: [],
                        tags: ['test'],
                        linkedChapterIds: [],
                        createdAt: new Date(),
                        lastUpdated: new Date(),
                        verified: false
                    }
                ],
                factChecks: [],
                researchQueries: [],
                researchTags: ['test', 'sci-fi'],
                researchFolders: [],
                citations: [],
                thematicTags: [],
                researchTimelines: [],
                researchMindMaps: [],
                materials: [],
                materialFolders: [],
                researchSettings: {
                    defaultCitationStyle: 'MLA',
                    autoFactCheck: true,
                    contradictionDetection: false,
                    researchSuggestions: false
                }
            };

            const stateData = {
                state: {
                    projects: {
                        [testProject.id]: testProject
                    }
                }
            };

            mockLocalStorage.setItem('bookcraft-storage', JSON.stringify(stateData));

            await migrateLocalStorageToIndexedDB();

            const migrated = await db.projects.get(testProject.id);
            
            expect(migrated).toBeDefined();
            expect(migrated?.title).toBe(testProject.title);
            expect(migrated?.genre).toBe(testProject.genre);
            expect(migrated?.visualStyle).toBe(testProject.visualStyle);
            expect(migrated?.metadata).toEqual(testProject.metadata);
            expect(migrated?.chapters).toHaveLength(1);
            expect(migrated?.plotPoints).toHaveLength(1);
            expect(migrated?.research).toHaveLength(1);
            expect(migrated?.researchTags).toEqual(['test', 'sci-fi']);
            expect(migrated?.researchSettings.defaultCitationStyle).toBe('MLA');
        });
    });
});
