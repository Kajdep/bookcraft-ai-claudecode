/**
 * Google Drive Integration Service
 * Handles backup and sync with user's Google Drive
 */

import { log } from './logger';
import type { Project } from '../types';

const GDRIVE_CLIENT_ID = import.meta.env.VITE_GDRIVE_CLIENT_ID;
const GDRIVE_API_KEY = import.meta.env.VITE_GDRIVE_API_KEY;
const GDRIVE_FOLDER_NAME = 'WrittenUpAi_Backups';

// Google Drive API scopes
const SCOPES = 'https://www.googleapis.com/auth/drive.file';

interface GDriveFile {
    id: string;
    name: string;
    modifiedTime: string;
    size: string;
}

/**
 * Google Drive service class
 */
class GDriveService {
    private tokenClient: any = null;
    private accessToken: string | null = null;
    private gapiLoaded = false;
    private gisLoaded = false;
    private folderID: string | null = null;

    /**
     * Initialize Google Drive integration
     */
    public async initialize(): Promise<boolean> {
        try {
            // Check if credentials are configured
            if (!GDRIVE_CLIENT_ID || !GDRIVE_API_KEY) {
                log.warn('Google Drive credentials not configured');
                return false;
            }

            // Load Google API libraries
            await this.loadGoogleLibraries();

            log.info('Google Drive service initialized');
            return true;
        } catch (error) {
            log.error('Failed to initialize Google Drive service', error as Error);
            return false;
        }
    }

    /**
     * Load Google API libraries
     */
    private async loadGoogleLibraries(): Promise<void> {
        // Load GAPI
        if (!this.gapiLoaded) {
            await new Promise<void>((resolve) => {
                const script = document.createElement('script');
                script.src = 'https://apis.google.com/js/api.js';
                script.onload = () => {
                    (window as any).gapi.load('client', async () => {
                        await (window as any).gapi.client.init({
                            apiKey: GDRIVE_API_KEY,
                            discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'],
                        });
                        this.gapiLoaded = true;
                        resolve();
                    });
                };
                document.body.appendChild(script);
            });
        }

        // Load GIS (Google Identity Services)
        if (!this.gisLoaded) {
            await new Promise<void>((resolve) => {
                const script = document.createElement('script');
                script.src = 'https://accounts.google.com/gsi/client';
                script.onload = () => {
                    this.tokenClient = (window as any).google.accounts.oauth2.initTokenClient({
                        client_id: GDRIVE_CLIENT_ID,
                        scope: SCOPES,
                        callback: '', // Will be set per request
                    });
                    this.gisLoaded = true;
                    resolve();
                };
                document.body.appendChild(script);
            });
        }
    }

    /**
     * Request authorization from user
     */
    private async authorize(): Promise<boolean> {
        return new Promise((resolve) => {
            this.tokenClient.callback = (response: any) => {
                if (response.error) {
                    log.error('Authorization failed', new Error(response.error));
                    resolve(false);
                    return;
                }
                this.accessToken = response.access_token;
                log.info('Google Drive authorized');
                resolve(true);
            };

            // Check if we already have a token
            if (this.accessToken) {
                resolve(true);
                return;
            }

            // Request new token
            this.tokenClient.requestAccessToken({ prompt: '' });
        });
    }

    /**
     * Get or create backup folder
     */
    private async getOrCreateFolder(): Promise<string> {
        if (this.folderID) {
            return this.folderID;
        }

        const gapi = (window as any).gapi;

        // Search for existing folder
        const response = await gapi.client.drive.files.list({
            q: `name='${GDRIVE_FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
            fields: 'files(id, name)',
            spaces: 'drive',
        });

        if (response.result.files && response.result.files.length > 0) {
            this.folderID = response.result.files[0].id;
            log.info('Found existing backup folder', { folderId: this.folderID });
            return this.folderID;
        }

        // Create new folder
        const fileMetadata = {
            name: GDRIVE_FOLDER_NAME,
            mimeType: 'application/vnd.google-apps.folder',
        };

        const createResponse = await gapi.client.drive.files.create({
            resource: fileMetadata,
            fields: 'id',
        });

        this.folderID = createResponse.result.id;
        log.info('Created new backup folder', { folderId: this.folderID });
        return this.folderID;
    }

    /**
     * Upload project to Google Drive
     */
    public async uploadProject(project: Project): Promise<{ success: boolean; fileId?: string; error?: string }> {
        try {
            // Initialize if needed
            if (!this.gapiLoaded || !this.gisLoaded) {
                const initialized = await this.initialize();
                if (!initialized) {
                    return { success: false, error: 'Google Drive not configured' };
                }
            }

            // Authorize if needed
            if (!this.accessToken) {
                const authorized = await this.authorize();
                if (!authorized) {
                    return { success: false, error: 'Authorization failed' };
                }
            }

            // Get backup folder
            const folderId = await this.getOrCreateFolder();

            // Prepare project data
            const projectData = JSON.stringify(project, null, 2);
            const fileName = `${project.title.replace(/[^a-z0-9]/gi, '_')}_${Date.now()}.json`;

            const gapi = (window as any).gapi;

            // Check if file exists
            const existingFiles = await gapi.client.drive.files.list({
                q: `name contains '${project.title.replace(/[^a-z0-9]/gi, '_')}' and '${folderId}' in parents and trashed=false`,
                fields: 'files(id, name)',
                orderBy: 'modifiedTime desc',
            });

            let fileId: string;

            if (existingFiles.result.files && existingFiles.result.files.length > 0) {
                // Update existing file
                fileId = existingFiles.result.files[0].id;
                const boundary = '-------314159265358979323846';
                const delimiter = `\r\n--${boundary}\r\n`;
                const closeDelim = `\r\n--${boundary}--`;

                const metadata = {
                    name: fileName,
                    mimeType: 'application/json',
                };

                const multipartRequestBody =
                    delimiter +
                    'Content-Type: application/json\r\n\r\n' +
                    JSON.stringify(metadata) +
                    delimiter +
                    'Content-Type: application/json\r\n\r\n' +
                    projectData +
                    closeDelim;

                const request = gapi.client.request({
                    path: `/upload/drive/v3/files/${fileId}`,
                    method: 'PATCH',
                    params: { uploadType: 'multipart' },
                    headers: {
                        'Content-Type': `multipart/related; boundary=${boundary}`,
                    },
                    body: multipartRequestBody,
                });

                await request;
                log.info('Project updated on Google Drive', { projectId: project.id, fileId });
            } else {
                // Create new file
                const boundary = '-------314159265358979323846';
                const delimiter = `\r\n--${boundary}\r\n`;
                const closeDelim = `\r\n--${boundary}--`;

                const metadata = {
                    name: fileName,
                    mimeType: 'application/json',
                    parents: [folderId],
                };

                const multipartRequestBody =
                    delimiter +
                    'Content-Type: application/json\r\n\r\n' +
                    JSON.stringify(metadata) +
                    delimiter +
                    'Content-Type: application/json\r\n\r\n' +
                    projectData +
                    closeDelim;

                const request = gapi.client.request({
                    path: '/upload/drive/v3/files',
                    method: 'POST',
                    params: { uploadType: 'multipart' },
                    headers: {
                        'Content-Type': `multipart/related; boundary=${boundary}`,
                    },
                    body: multipartRequestBody,
                });

                const response = await request;
                fileId = response.result.id;
                log.info('Project uploaded to Google Drive', { projectId: project.id, fileId });
            }

            return { success: true, fileId };
        } catch (error) {
            log.error('Failed to upload project to Google Drive', error as Error);
            return { success: false, error: (error as Error).message };
        }
    }

    /**
     * List backups from Google Drive
     */
    public async listBackups(): Promise<{ success: boolean; files?: GDriveFile[]; error?: string }> {
        try {
            // Initialize and authorize
            if (!this.gapiLoaded || !this.gisLoaded) {
                const initialized = await this.initialize();
                if (!initialized) {
                    return { success: false, error: 'Google Drive not configured' };
                }
            }

            if (!this.accessToken) {
                const authorized = await this.authorize();
                if (!authorized) {
                    return { success: false, error: 'Authorization failed' };
                }
            }

            // Get backup folder
            const folderId = await this.getOrCreateFolder();

            const gapi = (window as any).gapi;

            // List files in backup folder
            const response = await gapi.client.drive.files.list({
                q: `'${folderId}' in parents and trashed=false`,
                fields: 'files(id, name, modifiedTime, size)',
                orderBy: 'modifiedTime desc',
                pageSize: 50,
            });

            const files = response.result.files || [];
            log.info('Listed Google Drive backups', { count: files.length });

            return { success: true, files };
        } catch (error) {
            log.error('Failed to list backups from Google Drive', error as Error);
            return { success: false, error: (error as Error).message };
        }
    }

    /**
     * Download project from Google Drive
     */
    public async downloadProject(fileId: string): Promise<{ success: boolean; project?: Project; error?: string }> {
        try {
            const gapi = (window as any).gapi;

            const response = await gapi.client.drive.files.get({
                fileId,
                alt: 'media',
            });

            const project = JSON.parse(response.body);
            log.info('Project downloaded from Google Drive', { projectId: project.id });

            return { success: true, project };
        } catch (error) {
            log.error('Failed to download project from Google Drive', error as Error);
            return { success: false, error: (error as Error).message };
        }
    }

    /**
     * Delete backup from Google Drive
     */
    public async deleteBackup(fileId: string): Promise<{ success: boolean; error?: string }> {
        try {
            const gapi = (window as any).gapi;

            await gapi.client.drive.files.delete({
                fileId,
            });

            log.info('Backup deleted from Google Drive', { fileId });
            return { success: true };
        } catch (error) {
            log.error('Failed to delete backup from Google Drive', error as Error);
            return { success: false, error: (error as Error).message };
        }
    }

    /**
     * Sign out from Google Drive
     */
    public signOut() {
        this.accessToken = null;
        log.info('Signed out from Google Drive');
    }
}

// Export singleton instance
export const gdriveService = new GDriveService();
