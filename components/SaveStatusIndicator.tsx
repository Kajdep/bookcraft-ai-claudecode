import React, { useEffect, useState } from 'react';
import { Check, AlertCircle, Loader2, RefreshCw } from 'lucide-react';
import { autosaveManager, type AutosaveState } from '../services/autosave';
import { useBookCraftStore } from '../store/useStore';

export const SaveStatusIndicator: React.FC = () => {
  const activeProjectId = useBookCraftStore(state => state.activeProjectId);
  const manualSave = useBookCraftStore(state => state.manualSave);
  
  const [autosaveState, setAutosaveState] = useState<AutosaveState>({
    status: 'idle',
    lastSaved: null,
    pendingChanges: false,
    error: null,
  });

  useEffect(() => {
    if (!activeProjectId) return;

    // Subscribe to autosave state changes
    const unsubscribe = autosaveManager.subscribe((state) => {
      setAutosaveState(state);
    });

    // Get initial state
    setAutosaveState(autosaveManager.getState(activeProjectId));

    return unsubscribe;
  }, [activeProjectId]);

  const handleRetry = () => {
    if (activeProjectId) {
      autosaveManager.clearError(activeProjectId);
      manualSave();
    }
  };

  const formatTime = (date: Date | null): string => {
    if (!date) return '';
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    // Less than 1 minute ago
    if (diff < 60000) {
      return 'just now';
    }
    
    // Less than 1 hour ago
    if (diff < 3600000) {
      const minutes = Math.floor(diff / 60000);
      return `${minutes}m ago`;
    }
    
    // Show time
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Don't show anything if idle and no last saved time
  if (autosaveState.status === 'idle' && !autosaveState.lastSaved) {
    return null;
  }

  return (
    <div className="flex items-center space-x-2 text-sm">
      {/* Saving state */}
      {autosaveState.status === 'saving' && (
        <>
          <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
          <span className="text-gray-600 dark:text-gray-400">Saving...</span>
        </>
      )}

      {/* Saved state */}
      {autosaveState.status === 'saved' && (
        <>
          <Check className="w-4 h-4 text-green-500" />
          <span className="text-gray-600 dark:text-gray-400">
            Saved {formatTime(autosaveState.lastSaved)}
          </span>
        </>
      )}

      {/* Error state */}
      {autosaveState.status === 'error' && (
        <>
          <AlertCircle className="w-4 h-4 text-red-500" />
          <span className="text-red-600 dark:text-red-400">Save failed</span>
          <button
            type="button"
            onClick={handleRetry}
            className="flex items-center space-x-1 px-2 py-1 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
            title="Retry save"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Retry</span>
          </button>
        </>
      )}

      {/* Idle state with last saved time */}
      {autosaveState.status === 'idle' && autosaveState.lastSaved && (
        <>
          <Check className="w-4 h-4 text-gray-400 dark:text-gray-600" />
          <span className="text-gray-500 dark:text-gray-500">
            Saved {formatTime(autosaveState.lastSaved)}
          </span>
        </>
      )}
    </div>
  );
};
