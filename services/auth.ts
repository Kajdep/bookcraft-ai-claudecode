// src/services/auth.ts
import { getSupabaseClient } from './storage/supabase';
import { log } from './logger';
import type { User } from '../types';

/**
 * Get current authenticated user from Supabase
 */
async function getCurrentUser() {
    try {
        const supabase = getSupabaseClient();
        if (!supabase) {
            log.warn('Supabase client not available, using local user');
            return getLocalUser();
        }

        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
            log.error('Failed to get Supabase session', error);
            return getLocalUser(); // Fallback to local
        }

        if (session) {
            log.info('Supabase session found', { userId: session.user.id });
            return session.user;
        } else {
            log.info('No active Supabase session, checking local');
            return getLocalUser();
        }
    } catch (error) {
        log.error('Error getting current user', error);
        return getLocalUser(); // Fallback on any error
    }
}

/**
 * Sign in with email and password
 */
async function signInWithEmail(email: string, password: string) {
    const supabase = getSupabaseClient();
    if (!supabase) {
        log.warn('Supabase not available, using fallback sign in');
        return fallbackSignIn(email, password);
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
        log.error('Supabase sign in failed', error);
        return { success: false, error: error.message };
    }

    if (data.user) {
        const user: User = {
            id: data.user.id,
            email: data.user.email || '',
            name: data.user.user_metadata?.name || data.user.email?.split('@')[0] || 'User',
            createdAt: new Date(data.user.created_at || ''),
            lastLogin: new Date(data.user.last_sign_in_at || '')
        };
        return { success: true, user: data.user, session: data.session };
    }

    return { success: false, error: 'Unknown error during sign in' };
}

/**
 * Sign up with email and password
 */
async function signUpWithEmail(email: string, password: string) {
    const supabase = getSupabaseClient();
    if (!supabase) {
        log.warn('Supabase not available, using fallback sign up');
        return fallbackSignUp(email, password);
    }
    const { data, error } = await supabase.auth.signUp({ email, password });

    if (error) {
        log.error('Supabase sign up failed', error);
        return { success: false, error: error.message };
    }

    // Note: Supabase returns a user object on signup, but session might be null until email confirmation
    if (data.user) {
         return { success: true, user: data.user, session: data.session };
    }

    return { success: false, error: 'Unknown error during sign up' };
}

/**
 * Sign out current user
 */
async function signOut() {
    const supabase = getSupabaseClient();
    if (supabase) {
        const { error } = await supabase.auth.signOut();
        if (error) {
            log.warn('Supabase sign out failed', error);
        }
    }

    // Always clear local storage as a fallback/cleanup
    try {
        localStorage.removeItem('writtenupai_current_user');
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
function onAuthStateChange(callback: (event: string, session: any) => void) {
    const client = getSupabaseClient();
    if (!client) return { unsubscribe: () => {} };

    const { data: { subscription } } = client.auth.onAuthStateChange(callback);
    return subscription;
}


/**
 * Fallback to get user from local storage
 */
function getLocalUser() {
    try {
        const localUser = localStorage.getItem('writtenupai_current_user');
        if (localUser) {
            log.info('Found user in local storage');
            return JSON.parse(localUser);
        }
    } catch (error) {
        log.error('Failed to get local user', error);
    }
    return null;
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
        localStorage.setItem('writtenupai_current_user', JSON.stringify(users[userKey]));

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

        localStorage.setItem('writtenupai_current_user', JSON.stringify(users[userKey]));

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

export const authService = {
    getCurrentUser,
    signInWithEmail,
    signUpWithEmail,
    signOut,
    onAuthStateChange,
};
