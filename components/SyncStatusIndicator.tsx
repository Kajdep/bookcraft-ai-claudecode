import React, { useState, useEffect } from 'react';
import { CloudIcon, CloudArrowUpIcon, ExclamationTriangleIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { storageService } from '../services/storage/storageService';
import { gdriveService } from '../services/gdrive';
import { Button } from './UI';

export const SyncStatusIndicator: React.FC = () => {
    const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'error' | 'offline'>('idle');
    const [lastSync, setLastSync] = useState<Date | null>(null);
    const [showMenu, setShowMenu] = useState(false);
    const [gdriveEnabled, setGdriveEnabled] = useState(false);

    useEffect(() => {
        // Subscribe to storage service sync events
        const unsubscribe = storageService.on('sync:status', (status: any) => {
            setSyncStatus(status.syncStatus);
            setLastSync(status.lastSync);
        });

        // Get initial status
        storageService.getStats().then((stats) => {
            setSyncStatus(stats.syncStatus);
            setLastSync(stats.lastSync);
        });

        return () => {
            if (typeof unsubscribe === 'function') {
                unsubscribe();
            }
        };
    }, []);

    const handleManualSync = async () => {
        try {
            await storageService.sync();
        } catch (error) {
            console.error('Manual sync failed:', error);
        }
    };

    const handleGDriveBackup = async () => {
        try {
            const projects = await storageService.getAllProjects();
            for (const project of projects) {
                await gdriveService.uploadProject(project);
            }
            alert('Successfully backed up to Google Drive!');
        } catch (error) {
            console.error('Google Drive backup failed:', error);
            alert('Failed to backup to Google Drive');
        }
    };

    const getStatusIcon = () => {
        switch (syncStatus) {
            case 'syncing':
                return <CloudArrowUpIcon className="w-5 h-5 text-blue-500 animate-pulse" />;
            case 'error':
                return <ExclamationTriangleIcon className="w-5 h-5 text-red-500" />;
            case 'offline':
                return <CloudIcon className="w-5 h-5 text-gray-400" />;
            case 'idle':
            default:
                return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
        }
    };

    const getStatusText = () => {
        switch (syncStatus) {
            case 'syncing':
                return 'Syncing...';
            case 'error':
                return 'Sync error';
            case 'offline':
                return 'Offline';
            case 'idle':
            default:
                if (lastSync) {
                    const minutes = Math.floor((Date.now() - lastSync.getTime()) / 60000);
                    if (minutes < 1) return 'Just synced';
                    if (minutes < 60) return `${minutes}m ago`;
                    const hours = Math.floor(minutes / 60);
                    return `${hours}h ago`;
                }
                return 'Not synced';
        }
    };

    return (
        <div className="relative">
            <button
                onClick={() => setShowMenu(!showMenu)}
                className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-gray-100 transition-colors"
                title="Sync status"
            >
                {getStatusIcon()}
                <span className="text-gray-700">{getStatusText()}</span>
            </button>

            {showMenu && (
                <>
                    <div
                        className="fixed inset-0 z-40"
                        onClick={() => setShowMenu(false)}
                    />
                    <div className="absolute right-0 mt-2 w-72 bg-white rounded-lg shadow-lg border border-gray-200 z-50 p-4">
                        <h3 className="font-semibold text-gray-900 mb-3">Sync & Backup</h3>

                        <div className="space-y-3">
                            {/* Supabase Sync */}
                            <div className="border-b border-gray-200 pb-3">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium text-gray-700">Cloud Sync</span>
                                    {getStatusIcon()}
                                </div>
                                <p className="text-xs text-gray-500 mb-2">
                                    Automatic sync with Supabase cloud storage
                                </p>
                                <Button
                                    size="sm"
                                    variant="primary"
                                    onClick={handleManualSync}
                                    disabled={syncStatus === 'syncing' || syncStatus === 'offline'}
                                    className="w-full"
                                >
                                    {syncStatus === 'syncing' ? 'Syncing...' : 'Sync Now'}
                                </Button>
                            </div>

                            {/* Google Drive Backup */}
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium text-gray-700">Google Drive</span>
                                    <CloudIcon className="w-5 h-5 text-gray-400" />
                                </div>
                                <p className="text-xs text-gray-500 mb-2">
                                    Manual backup to your Google Drive
                                </p>
                                <Button
                                    size="sm"
                                    variant="secondary"
                                    onClick={handleGDriveBackup}
                                    className="w-full"
                                >
                                    Backup to Drive
                                </Button>
                            </div>

                            {/* Status Info */}
                            {lastSync && (
                                <div className="text-xs text-gray-500 pt-2 border-t border-gray-200">
                                    Last synced: {lastSync.toLocaleString()}
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};
