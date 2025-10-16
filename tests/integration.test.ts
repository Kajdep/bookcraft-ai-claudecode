/**
 * Integration Tests for WrittenUpAi Storage System
 *
 * Tests the complete storage flow without mocking internals
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { storageService } from '../services/storage/storageService';
import type { Project, Chapter } from '../types';

describe('Storage Service Integration', () => {
    const testProject: Project = {
        id: 'test-proj-1',
        title: 'Test Novel',
        genre: 'Fiction',
        description: 'A test novel',
        targetWordCount: 50000,
        currentWordCount: 0,
        status: 'draft',
        createdAt: new Date(),
        lastModified: new Date(),
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

    describe('Project Operations', () => {
        it('should save and retrieve a project', async () => {
            await storageService.saveProject(testProject);
            const retrieved = await storageService.getProject(testProject.id);

            expect(retrieved).toBeDefined();
            expect(retrieved?.id).toBe(testProject.id);
            expect(retrieved?.title).toBe('Test Novel');
        });

        it('should get all projects', async () => {
            await storageService.saveProject(testProject);

            const projects = await storageService.getAllProjects();

            expect(projects.length).toBeGreaterThan(0);
            expect(projects.some(p => p.id === testProject.id)).toBe(true);
        });

        it('should delete a project', async () => {
            await storageService.saveProject(testProject);
            await storageService.deleteProject(testProject.id);

            const retrieved = await storageService.getProject(testProject.id);
            expect(retrieved).toBeNull();
        });
    });

    describe('Chapter Operations', () => {
        const testChapter: Chapter = {
            id: 'test-chap-1',
            projectId: testProject.id,
            title: 'Chapter 1',
            content: '<p>Test content</p>',
            order: 0,
            status: 'draft',
            wordCount: 2,
            notes: '',
            structure: [],
            createdAt: new Date(),
            lastModified: new Date()
        };

        beforeEach(async () => {
            await storageService.saveProject(testProject);
        });

        it('should save and retrieve chapters', async () => {
            await storageService.saveChapter(testChapter);

            const chapters = await storageService.getChapters(testProject.id);

            expect(chapters.length).toBeGreaterThan(0);
            expect(chapters[0].id).toBe(testChapter.id);
            expect(chapters[0].title).toBe('Chapter 1');
        });

        it('should delete a chapter', async () => {
            await storageService.saveChapter(testChapter);
            await storageService.deleteChapter(testChapter.id);

            const chapters = await storageService.getChapters(testProject.id);
            expect(chapters.length).toBe(0);
        });
    });

    describe('Storage Statistics', () => {
        it('should return storage stats', async () => {
            const stats = await storageService.getStats();

            expect(stats).toBeDefined();
            expect(stats.syncStatus).toBeDefined();
            expect(typeof stats.localUsed).toBe('number');
            expect(typeof stats.localAvailable).toBe('number');
        });

        it('should reflect correct sync status', async () => {
            const stats = await storageService.getStats();

            // Should start in idle or offline state
            expect(['idle', 'offline', 'syncing', 'error']).toContain(stats.syncStatus);
        });
    });

    describe('Configuration', () => {
        it('should allow configuration updates', () => {
            storageService.configure({
                autoSync: false,
                syncInterval: 60000,
            });

            const config = storageService.getConfig();

            expect(config.autoSync).toBe(false);
            expect(config.syncInterval).toBe(60000);
        });

        it('should get current configuration', () => {
            const config = storageService.getConfig();

            expect(config).toBeDefined();
            expect(config.mode).toBeDefined();
            expect(typeof config.autoSync).toBe('boolean');
            expect(typeof config.syncInterval).toBe('number');
            expect(typeof config.maxLocalSize).toBe('number');
        });
    });

    describe('Event System', () => {
        it('should support event subscription', async () => {
            let eventFired = false;

            const handler = () => {
                eventFired = true;
            };

            storageService.on('project:saved', handler);

            await storageService.saveProject({
                ...testProject,
                id: 'event-test'
            });

            expect(eventFired).toBe(true);

            storageService.off('project:saved', handler);
        });
    });
});

describe('Authentication Service', () => {
    it('should be importable', async () => {
        const { authService } = await import('../services/auth');
        expect(authService).toBeDefined();
    });

    it('should have required methods', async () => {
        const { authService } = await import('../services/auth');

        expect(typeof authService.signUp).toBe('function');
        expect(typeof authService.signIn).toBe('function');
        expect(typeof authService.signOut).toBe('function');
        expect(typeof authService.isAuthenticated).toBe('function');
        expect(typeof authService.getCurrentUser).toBe('function');
    });
});

describe('Google Drive Service', () => {
    it('should be importable', async () => {
        const { gdriveService } = await import('../services/gdrive');
        expect(gdriveService).toBeDefined();
    });

    it('should have required methods', async () => {
        const { gdriveService } = await import('../services/gdrive');

        expect(typeof gdriveService.initialize).toBe('function');
        expect(typeof gdriveService.uploadProject).toBe('function');
        expect(typeof gdriveService.listBackups).toBe('function');
        expect(typeof gdriveService.downloadProject).toBe('function');
        expect(typeof gdriveService.deleteBackup).toBe('function');
    });
});
