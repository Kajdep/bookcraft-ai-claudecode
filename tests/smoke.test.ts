/**
 * Smoke Tests - Basic sanity checks
 *
 * These tests verify that critical modules load without errors
 */

import { describe, it, expect } from 'vitest';

describe('Core Modules Load', () => {
    it('should import store without errors', async () => {
        const { useBookCraftStore } = await import('../store/useStore');
        expect(useBookCraftStore).toBeDefined();
    });

    it('should import storage service', async () => {
        const { storageService } = await import('../services/storage/storageService');
        expect(storageService).toBeDefined();
        expect(storageService.getConfig).toBeDefined();
    });

    it('should import auth service', async () => {
        const { authService } = await import('../services/auth');
        expect(authService).toBeDefined();
        expect(authService.isAuthenticated).toBeDefined();
    });

    it('should import AI service', async () => {
        const ai = await import('../services/ai');
        expect(ai).toBeDefined();
    });

    it('should import logger', async () => {
        const { logger } = await import('../services/logger');
        expect(logger).toBeDefined();
    });

    it('should import export manager', async () => {
        const exportManager = await import('../services/exportManager');
        expect(exportManager).toBeDefined();
    });
});

describe('Type Definitions', () => {
    it('should import types without errors', async () => {
        const types = await import('../types');
        expect(types).toBeDefined();
    });
});

describe('Environment Configuration', () => {
    it('should have Supabase configuration', () => {
        const url = import.meta.env.VITE_SUPABASE_URL;
        const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

        expect(url).toBeDefined();
        expect(key).toBeDefined();
    });
});

describe('Build Verification', () => {
    it('should not have undefined imports', async () => {
        const modules = [
            '../services/storage/storageService',
            '../services/auth',
            '../services/ai',
            '../services/logger',
            '../store/useStore',
        ];

        for (const mod of modules) {
            const imported = await import(mod);
            expect(imported).toBeDefined();
            expect(Object.keys(imported).length).toBeGreaterThan(0);
        }
    });
});
