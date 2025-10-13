/**
 * Autosave Manager
 * 
 * Handles automatic saving of project data with debouncing, retry logic,
 * and integration with IndexedDB + Supabase sync.
 */

import { storageService } from './storage/storageService';
import { logger } from './logger';
import { toast } from './toast';
import type { Project } from '../types';

export interface AutosaveConfig {
  debounceMs: number;        // Default: 2000ms
  retryAttempts: number;     // Default: 3
  retryDelayMs: number;      // Default: 5000ms
  syncToCloud: boolean;      // Default: true
}

export interface AutosaveState {
  status: 'idle' | 'saving' | 'saved' | 'error';
  lastSaved: Date | null;
  pendingChanges: boolean;
  error: string | null;
}

export type AutosaveListener = (state: AutosaveState) => void;

class AutosaveManager {
  private config: AutosaveConfig = {
    debounceMs: 30000,
    retryAttempts: 3,
    retryDelayMs: 5000,
    syncToCloud: true,
  };

  private debounceTimers: Map<string, NodeJS.Timeout> = new Map();
  private states: Map<string, AutosaveState> = new Map();
  private listeners: Set<AutosaveListener> = new Set();
  private pendingSaves: Map<string, Partial<Project>> = new Map();

  constructor(config?: Partial<AutosaveConfig>) {
    if (config) {
      this.config = { ...this.config, ...config };
    }

    // Set up beforeunload handler
    this.setupBeforeUnloadHandler();

    logger.info('AutosaveManager initialized', this.config);
  }

  /**
   * Get current autosave state for a project
   */
  getState(projectId: string): AutosaveState {
    if (!this.states.has(projectId)) {
      this.states.set(projectId, {
        status: 'idle',
        lastSaved: null,
        pendingChanges: false,
        error: null,
      });
    }
    return this.states.get(projectId)!;
  }

  /**
   * Subscribe to autosave state changes
   */
  subscribe(listener: AutosaveListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Trigger autosave with debouncing
   */
  triggerSave(projectId: string, data: Partial<Project>): void {
    logger.debug('Autosave triggered', { projectId });

    // Store pending data
    this.pendingSaves.set(projectId, data);

    // Update state to show pending changes
    this.updateState(projectId, {
      pendingChanges: true,
      error: null,
    });

    // Clear existing timer
    const existingTimer = this.debounceTimers.get(projectId);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    // Set new debounce timer
    const timer = setTimeout(() => {
      this.executeSave(projectId);
    }, this.config.debounceMs);

    this.debounceTimers.set(projectId, timer);
  }

  /**
   * Force immediate save (bypasses debounce)
   */
  async forceSave(projectId: string): Promise<void> {
    logger.info('Force save triggered', { projectId });

    // Clear any pending debounce timer
    const existingTimer = this.debounceTimers.get(projectId);
    if (existingTimer) {
      clearTimeout(existingTimer);
      this.debounceTimers.delete(projectId);
    }

    // Execute save immediately
    await this.executeSave(projectId);
  }

  /**
   * Execute the actual save operation
   */
  private async executeSave(projectId: string, attempt: number = 1): Promise<void> {
    const data = this.pendingSaves.get(projectId);
    if (!data) {
      logger.warn('No pending data to save', { projectId });
      return;
    }

    // Update state to saving
    this.updateState(projectId, {
      status: 'saving',
      pendingChanges: false,
      error: null,
    });

    try {
      // Get full project data from store
      const { useBookCraftStore } = await import('../store/useStore');
      const project = useBookCraftStore.getState().projects[projectId];

      if (!project) {
        throw new Error('Project not found');
      }

      // Merge pending changes
      const updatedProject = { ...project, ...data };

      // Save to storage (IndexedDB + Supabase)
      await storageService.saveProject(updatedProject);

      // Clear pending data
      this.pendingSaves.delete(projectId);

      // Update state to saved
      this.updateState(projectId, {
        status: 'saved',
        lastSaved: new Date(),
        pendingChanges: false,
        error: null,
      });

      logger.info('Autosave successful', { projectId, attempt });

      // Reset to idle after 3 seconds
      setTimeout(() => {
        const currentState = this.getState(projectId);
        if (currentState.status === 'saved') {
          this.updateState(projectId, { status: 'idle' });
        }
      }, 3000);

    } catch (error) {
      logger.error('Autosave failed', error, { projectId, attempt });

      // Retry if attempts remaining
      if (attempt < this.config.retryAttempts) {
        logger.info('Retrying autosave', { projectId, attempt: attempt + 1 });

        setTimeout(() => {
          this.executeSave(projectId, attempt + 1);
        }, this.config.retryDelayMs);

        // Update state to show retry
        this.updateState(projectId, {
          status: 'saving',
          error: `Retrying... (${attempt}/${this.config.retryAttempts})`,
        });

      } else {
        // All retries exhausted
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        
        this.updateState(projectId, {
          status: 'error',
          error: errorMessage,
        });

        // Show user-friendly error message
        this.handleSaveError(error as Error, projectId);
      }
    }
  }

  /**
   * Handle save errors with user-friendly messages
   */
  private handleSaveError(error: Error, projectId: string): void {
    if (error.message.includes('quota')) {
      toast.error(
        'Storage Full',
        'Your browser storage is full. Please free up space or delete old projects.'
      );
    } else if (error.message.includes('network') || error.message.includes('fetch')) {
      toast.warning(
        'Offline',
        'Changes saved locally. Will sync when connection is restored.'
      );
    } else {
      toast.error(
        'Save Failed',
        'Unable to save changes. Please try saving manually.'
      );
    }
  }

  /**
   * Update state and notify listeners
   */
  private updateState(projectId: string, updates: Partial<AutosaveState>): void {
    const currentState = this.getState(projectId);
    const newState = { ...currentState, ...updates };
    this.states.set(projectId, newState);

    // Notify all listeners
    this.listeners.forEach(listener => {
      try {
        listener(newState);
      } catch (error) {
        logger.error('Error in autosave listener', error);
      }
    });
  }

  /**
   * Set up beforeunload handler to save pending changes
   */
  private setupBeforeUnloadHandler(): void {
    window.addEventListener('beforeunload', (event) => {
      // Check if there are any pending changes
      const hasPendingChanges = Array.from(this.states.values()).some(
        state => state.pendingChanges
      );

      if (hasPendingChanges) {
        // Try to save synchronously (best effort)
        this.saveAllPending();

        // Show browser warning
        event.preventDefault();
        event.returnValue = '';
      }
    });
  }

  /**
   * Save all pending changes (synchronous, best effort)
   */
  private saveAllPending(): void {
    for (const [projectId, data] of this.pendingSaves.entries()) {
      try {
        // Force immediate save without waiting
        this.forceSave(projectId);
      } catch (error) {
        logger.error('Failed to save pending changes on unload', error, { projectId });
      }
    }
  }

  /**
   * Check if there are pending changes for a project
   */
  hasPendingChanges(projectId: string): boolean {
    return this.getState(projectId).pendingChanges;
  }

  /**
   * Clear error state for a project
   */
  clearError(projectId: string): void {
    this.updateState(projectId, {
      status: 'idle',
      error: null,
    });
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    // Clear all timers
    for (const timer of this.debounceTimers.values()) {
      clearTimeout(timer);
    }
    this.debounceTimers.clear();

    // Clear listeners
    this.listeners.clear();

    // Clear states
    this.states.clear();
    this.pendingSaves.clear();

    logger.info('AutosaveManager destroyed');
  }
}

// Export singleton instance
export const autosaveManager = new AutosaveManager();
