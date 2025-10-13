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
    if (!client) {
        // Check local storage for user
        try {
            const currentUser = localStorage.getItem('bookcraft_current_user');
            if (currentUser) {
                return JSON.parse(currentUser);
            }
        } catch (error) {
            log.error('Failed to get local user', error as Error);
        }
        return null;
    }

    try {
        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Connection timeout')), 5000)
        );

        const getUserPromise = client.auth.getUser();
        const { data: { user }, error } = await Promise.race([getUserPromise, timeoutPromise]) as any;

        if (error) {
            throw error;
        }
        return user;
    } catch (error) {
        log.warn('Failed to get Supabase user, checking local storage', error);
        // Fallback to local storage
        try {
            const currentUser = localStorage.getItem('bookcraft_current_user');
            if (currentUser) {
                return JSON.parse(currentUser);
            }
        } catch (err) {
            log.error('Failed to get local user', err as Error);
        }
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
        // Try Supabase signin with timeout
        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Connection timeout')), 5000)
        );

        const signinPromise = client.auth.signInWithPassword({
            email,
            password
        });

        const { data, error } = await Promise.race([signinPromise, timeoutPromise]) as any;

        if (error) {
            throw error;
        }

        log.info('User signed in successfully via Supabase', { userId: data.user?.id });
        return { success: true, user: data.user, session: data.session };
    } catch (error) {
        log.warn('Supabase signin failed, using local auth', error);
        // Fallback to local storage auth
        return fallbackSignIn(email, password);
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
        // Try Supabase signup with timeout
        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Connection timeout')), 5000)
        );

        const signupPromise = client.auth.signUp({
            email,
            password,
            options: {
                emailRedirectTo: window.location.origin,
                data: {
                    email_confirm: false
                }
            }
        });

        const { data, error } = await Promise.race([signupPromise, timeoutPromise]) as any;

        if (error) {
            throw error;
        }

        log.info('User signed up successfully via Supabase', { userId: data.user?.id });
        return { success: true, user: data.user, session: data.session };
    } catch (error) {
        log.warn('Supabase signup failed, using local auth', error);
        // Fallback to local storage auth
        return fallbackSignUp(email, password);
    }
}

/**
 * Sign out current user
 */
export async function signOut() {
    const client = getSupabaseClient();

    try {
        if (client) {
            const { error } = await client.auth.signOut();
            if (error) {
                log.warn('Supabase sign out failed', error);
            }
        }
    } catch (error) {
        log.warn('Supabase sign out error', error);
    }

    // Always clear local storage
    try {
        localStorage.removeItem('bookcraft_current_user');
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

/**
 * Fallback authentication using localStorage
 */
function fallbackSignUp(email: string, password: string) {
    try {
        const users = JSON.parse(localStorage.getItem('bookcraft_local_users') || '{}');
        const userKey = email.toLowerCase();

        if (users[userKey]) {
            return { success: false, error: 'User already exists' };
        }

        const userId = `local-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        users[userKey] = {
            id: userId,
            email,
            password,
            created_at: new Date().toISOString(),
            user_metadata: { name: email.split('@')[0] }
        };

        localStorage.setItem('bookcraft_local_users', JSON.stringify(users));
        localStorage.setItem('bookcraft_current_user', JSON.stringify(users[userKey]));

        log.info('User signed up via local auth', { userId });
        return {
            success: true,
            user: {
                id: userId,
                email,
                created_at: users[userKey].created_at,
                user_metadata: users[userKey].user_metadata
            },
            session: { access_token: 'local-session' }
        };
    } catch (error) {
        log.error('Local signup failed', error as Error);
        return { success: false, error: 'Failed to create account' };
    }
}

function fallbackSignIn(email: string, password: string) {
    try {
        const users = JSON.parse(localStorage.getItem('bookcraft_local_users') || '{}');
        const userKey = email.toLowerCase();

        if (!users[userKey]) {
            return { success: false, error: 'User not found' };
        }

        if (users[userKey].password !== password) {
            return { success: false, error: 'Invalid password' };
        }

        localStorage.setItem('bookcraft_current_user', JSON.stringify(users[userKey]));

        log.info('User signed in via local auth', { userId: users[userKey].id });
        return {
            success: true,
            user: {
                id: users[userKey].id,
                email: users[userKey].email,
                created_at: users[userKey].created_at,
                user_metadata: users[userKey].user_metadata
            },
            session: { access_token: 'local-session' }
        };
    } catch (error) {
        log.error('Local signin failed', error as Error);
        return { success: false, error: 'Failed to sign in' };
    }
}

export default getSupabaseClient;
