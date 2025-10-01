import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { log } from '../logger';

/**
 * Supabase Client Configuration
 * 
 * Provides cloud storage and sync capabilities for BookCraft AI.
 * Free tier supports:
 * - 500MB PostgreSQL database
 * - 1GB file storage
 * - 50,000 monthly active users
 * - Unlimited API requests
 */

// Supabase configuration from environment variables
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Singleton Supabase client
let supabaseClient: SupabaseClient | null = null;

/**
 * Get or create Supabase client instance
 */
export function getSupabaseClient(): SupabaseClient | null {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
        log.warn('Supabase credentials not configured. Cloud sync disabled.');
        return null;
    }

    if (!supabaseClient) {
        try {
            supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
                auth: {
                    persistSession: true,
                    autoRefreshToken: true,
                    detectSessionInUrl: true
                },
                global: {
                    headers: {
                        'X-Client-Info': 'bookcraft-ai'
                    }
                }
            });

            log.info('Supabase client initialized successfully', {
                url: SUPABASE_URL
            });
        } catch (error) {
            log.error('Failed to initialize Supabase client', error as Error);
            return null;
        }
    }

    return supabaseClient;
}

/**
 * Check if Supabase is configured and available
 */
export function isSupabaseAvailable(): boolean {
    return !!SUPABASE_URL && !!SUPABASE_ANON_KEY;
}

/**
 * Test Supabase connection
 */
export async function testSupabaseConnection(): Promise<boolean> {
    const client = getSupabaseClient();
    if (!client) return false;

    try {
        // Try to fetch from a table (will fail gracefully if table doesn't exist)
        const { error } = await client.from('projects').select('count').limit(1);
        
        if (error && error.code !== 'PGRST116') { // PGRST116 = table doesn't exist (OK for initial setup)
            log.error('Supabase connection test failed', error as Error);
            return false;
        }

        log.info('Supabase connection test successful');
        return true;
    } catch (error) {
        log.error('Supabase connection test failed', error as Error);
        return false;
    }
}

/**
 * Upload a file to Supabase Storage
 */
export async function uploadFile(
    bucket: string,
    path: string,
    file: File | Blob,
    options?: { upsert?: boolean; contentType?: string }
): Promise<{ success: boolean; url?: string; error?: string }> {
    const client = getSupabaseClient();
    if (!client) {
        return { success: false, error: 'Supabase not configured' };
    }

    try {
        const { data, error } = await client.storage
            .from(bucket)
            .upload(path, file, {
                upsert: options?.upsert ?? false,
                contentType: options?.contentType
            });

        if (error) {
            log.error('File upload to Supabase failed', error as Error, { bucket, path });
            return { success: false, error: error.message };
        }

        // Get public URL
        const { data: urlData } = client.storage
            .from(bucket)
            .getPublicUrl(path);

        log.info('File uploaded to Supabase successfully', {
            bucket,
            path,
            url: urlData.publicUrl
        });

        return { success: true, url: urlData.publicUrl };
    } catch (error) {
        log.error('File upload to Supabase failed', error as Error, { bucket, path });
        return { success: false, error: (error as Error).message };
    }
}

/**
 * Download a file from Supabase Storage
 */
export async function downloadFile(
    bucket: string,
    path: string
): Promise<{ success: boolean; blob?: Blob; error?: string }> {
    const client = getSupabaseClient();
    if (!client) {
        return { success: false, error: 'Supabase not configured' };
    }

    try {
        const { data, error } = await client.storage
            .from(bucket)
            .download(path);

        if (error) {
            log.error('File download from Supabase failed', error as Error, { bucket, path });
            return { success: false, error: error.message };
        }

        log.info('File downloaded from Supabase successfully', { bucket, path });
        return { success: true, blob: data };
    } catch (error) {
        log.error('File download from Supabase failed', error as Error, { bucket, path });
        return { success: false, error: (error as Error).message };
    }
}

/**
 * Delete a file from Supabase Storage
 */
export async function deleteFile(
    bucket: string,
    path: string
): Promise<{ success: boolean; error?: string }> {
    const client = getSupabaseClient();
    if (!client) {
        return { success: false, error: 'Supabase not configured' };
    }

    try {
        const { error } = await client.storage
            .from(bucket)
            .remove([path]);

        if (error) {
            log.error('File deletion from Supabase failed', error as Error, { bucket, path });
            return { success: false, error: error.message };
        }

        log.info('File deleted from Supabase successfully', { bucket, path });
        return { success: true };
    } catch (error) {
        log.error('File deletion from Supabase failed', error as Error, { bucket, path });
        return { success: false, error: (error as Error).message };
    }
}

/**
 * Get current authenticated user
 */
export async function getCurrentUser() {
    const client = getSupabaseClient();
    if (!client) return null;

    try {
        const { data: { user }, error } = await client.auth.getUser();
        if (error) {
            log.error('Failed to get current user', error as Error);
            return null;
        }
        return user;
    } catch (error) {
        log.error('Failed to get current user', error as Error);
        return null;
    }
}

/**
 * Sign in with email and password
 */
export async function signInWithEmail(email: string, password: string) {
    const client = getSupabaseClient();
    if (!client) {
        return { success: false, error: 'Supabase not configured' };
    }

    try {
        const { data, error } = await client.auth.signInWithPassword({
            email,
            password
        });

        if (error) {
            log.error('Sign in failed', error as Error);
            return { success: false, error: error.message };
        }

        log.info('User signed in successfully', { userId: data.user?.id });
        return { success: true, user: data.user, session: data.session };
    } catch (error) {
        log.error('Sign in failed', error as Error);
        return { success: false, error: (error as Error).message };
    }
}

/**
 * Sign up with email and password
 */
export async function signUpWithEmail(email: string, password: string) {
    const client = getSupabaseClient();
    if (!client) {
        return { success: false, error: 'Supabase not configured' };
    }

    try {
        const { data, error } = await client.auth.signUp({
            email,
            password
        });

        if (error) {
            log.error('Sign up failed', error as Error);
            return { success: false, error: error.message };
        }

        log.info('User signed up successfully', { userId: data.user?.id });
        return { success: true, user: data.user, session: data.session };
    } catch (error) {
        log.error('Sign up failed', error as Error);
        return { success: false, error: (error as Error).message };
    }
}

/**
 * Sign out current user
 */
export async function signOut() {
    const client = getSupabaseClient();
    if (!client) {
        return { success: false, error: 'Supabase not configured' };
    }

    try {
        const { error } = await client.auth.signOut();
        if (error) {
            log.error('Sign out failed', error as Error);
            return { success: false, error: error.message };
        }

        log.info('User signed out successfully');
        return { success: true };
    } catch (error) {
        log.error('Sign out failed', error as Error);
        return { success: false, error: (error as Error).message };
    }
}

/**
 * Listen to auth state changes
 */
export function onAuthStateChange(callback: (event: string, session: any) => void) {
    const client = getSupabaseClient();
    if (!client) return { unsubscribe: () => {} };

    const { data: { subscription } } = client.auth.onAuthStateChange(callback);
    return subscription;
}

export default getSupabaseClient;
