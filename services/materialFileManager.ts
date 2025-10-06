/**
 * Material File Manager
 * 
 * Handles file storage for materials with smart routing:
 * - Files < 5MB: Store in IndexedDB
 * - Files >= 5MB: Store in Supabase Storage
 */

import { db } from './storage/indexedDB';
import { getSupabaseClient } from './storage/supabase';
import { logger } from './logger';

export class MaterialFileManager {
  private readonly SMALL_FILE_THRESHOLD = 5 * 1024 * 1024; // 5MB

  /**
   * Store a file (routes to IndexedDB or Supabase based on size)
   */
  async storeFile(file: File, projectId: string): Promise<string> {
    const fileId = `file_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    
    try {
      if (file.size < this.SMALL_FILE_THRESHOLD) {
        // Store in IndexedDB for small files
        await db.fileBlobs.put({
          id: fileId,
          blob: file,
          mimeType: file.type,
          size: file.size,
          createdAt: new Date()
        });
        
        logger.info('File stored in IndexedDB', { 
          fileId, 
          size: file.size,
          name: file.name 
        });
      } else {
        // Store in Supabase Storage for large files
        const supabase = getSupabaseClient();
        if (!supabase) {
          throw new Error('Supabase client not available for large file storage');
        }

        const filePath = `${projectId}/${fileId}`;
        const { data, error } = await supabase.storage
          .from('materials')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
          });

        if (error) {
          throw error;
        }

        logger.info('File stored in Supabase', { 
          fileId, 
          size: file.size,
          name: file.name,
          path: filePath
        });
      }

      return fileId;
    } catch (error) {
      logger.error('Failed to store file', error, { 
        fileId, 
        fileName: file.name,
        fileSize: file.size 
      });
      throw error;
    }
  }

  /**
   * Retrieve a file (checks IndexedDB first, then Supabase)
   */
  async retrieveFile(fileId: string, projectId: string): Promise<Blob> {
    try {
      // Try IndexedDB first
      const localFile = await db.fileBlobs.get(fileId);
      if (localFile) {
        logger.debug('File retrieved from IndexedDB', { fileId });
        return localFile.blob;
      }

      // Fallback to Supabase
      const supabase = getSupabaseClient();
      if (!supabase) {
        throw new Error('File not found in local storage and Supabase not available');
      }

      const filePath = `${projectId}/${fileId}`;
      const { data, error } = await supabase.storage
        .from('materials')
        .download(filePath);

      if (error) {
        throw error;
      }

      logger.debug('File retrieved from Supabase', { fileId });
      return data;
    } catch (error) {
      logger.error('Failed to retrieve file', error, { fileId, projectId });
      throw error;
    }
  }

  /**
   * Delete a file (removes from both IndexedDB and Supabase)
   */
  async deleteFile(fileId: string, projectId: string): Promise<void> {
    try {
      // Delete from IndexedDB
      await db.fileBlobs.delete(fileId);

      // Delete from Supabase (if exists)
      const supabase = getSupabaseClient();
      if (supabase) {
        const filePath = `${projectId}/${fileId}`;
        const { error } = await supabase.storage
          .from('materials')
          .remove([filePath]);

        if (error && error.message !== 'Object not found') {
          logger.warn('Failed to delete file from Supabase', error, { fileId });
        }
      }

      logger.info('File deleted', { fileId });
    } catch (error) {
      logger.error('Failed to delete file', error, { fileId, projectId });
      throw error;
    }
  }

  /**
   * Generate a thumbnail for an image file
   */
  async generateThumbnail(file: File, maxWidth: number = 200, maxHeight: number = 200): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!file.type.startsWith('image/')) {
        reject(new Error('File is not an image'));
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          // Calculate dimensions
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxWidth) {
              height = (height * maxWidth) / width;
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = (width * maxHeight) / height;
              height = maxHeight;
            }
          }

          // Create canvas and draw resized image
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          
          if (!ctx) {
            reject(new Error('Failed to get canvas context'));
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);

          // Convert to base64
          const thumbnail = canvas.toDataURL('image/jpeg', 0.7);
          resolve(thumbnail);
        };
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  }

  /**
   * Extract metadata from a file
   */
  async extractFileMetadata(file: File): Promise<{
    author?: string;
    dateCreated?: Date;
    wordCount?: number;
    dimensions?: { width: number; height: number };
    duration?: number;
  }> {
    const metadata: any = {};

    try {
      // For images, get dimensions
      if (file.type.startsWith('image/')) {
        const dimensions = await this.getImageDimensions(file);
        metadata.dimensions = dimensions;
      }

      // For videos/audio, get duration
      if (file.type.startsWith('video/') || file.type.startsWith('audio/')) {
        const duration = await this.getMediaDuration(file);
        metadata.duration = duration;
      }

      // File creation date (from File object)
      metadata.dateCreated = new Date(file.lastModified);

      logger.debug('Extracted file metadata', { fileName: file.name, metadata });
    } catch (error) {
      logger.warn('Failed to extract some metadata', error, { fileName: file.name });
    }

    return metadata;
  }

  /**
   * Get image dimensions
   */
  private async getImageDimensions(file: File): Promise<{ width: number; height: number }> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          resolve({ width: img.width, height: img.height });
        };
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  }

  /**
   * Get media duration (video/audio)
   */
  private async getMediaDuration(file: File): Promise<number> {
    return new Promise((resolve, reject) => {
      const media = document.createElement(file.type.startsWith('video/') ? 'video' : 'audio');
      media.preload = 'metadata';
      
      media.onloadedmetadata = () => {
        window.URL.revokeObjectURL(media.src);
        resolve(media.duration);
      };
      
      media.onerror = () => {
        window.URL.revokeObjectURL(media.src);
        reject(new Error('Failed to load media'));
      };
      
      media.src = URL.createObjectURL(file);
    });
  }

  /**
   * Get file size information
   */
  getFileSizeInfo(size: number): { formatted: string; category: 'small' | 'medium' | 'large' } {
    const kb = size / 1024;
    const mb = kb / 1024;

    let formatted: string;
    let category: 'small' | 'medium' | 'large';

    if (mb >= 1) {
      formatted = `${mb.toFixed(2)} MB`;
      category = mb >= 5 ? 'large' : 'medium';
    } else {
      formatted = `${kb.toFixed(2)} KB`;
      category = 'small';
    }

    return { formatted, category };
  }

  /**
   * Validate file type
   */
  validateFileType(file: File, allowedTypes: string[]): boolean {
    return allowedTypes.some(type => {
      if (type.endsWith('/*')) {
        const category = type.split('/')[0];
        return file.type.startsWith(category + '/');
      }
      return file.type === type;
    });
  }

  /**
   * Get file icon based on type
   */
  getFileIcon(mimeType: string): string {
    if (mimeType.startsWith('image/')) return '🖼️';
    if (mimeType.startsWith('video/')) return '🎥';
    if (mimeType.startsWith('audio/')) return '🎵';
    if (mimeType.startsWith('text/')) return '📄';
    if (mimeType.includes('pdf')) return '📕';
    if (mimeType.includes('word') || mimeType.includes('document')) return '📘';
    if (mimeType.includes('sheet') || mimeType.includes('excel')) return '📊';
    if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) return '📽️';
    if (mimeType.includes('zip') || mimeType.includes('archive')) return '📦';
    return '📎';
  }
}

// Export singleton instance
export const materialFileManager = new MaterialFileManager();
