/**
 * Authentication Service
 * Handles user authentication with Supabase
 */

import { createClient, SupabaseClient, User, Session } from '@supabase/supabase-js';
import { log } from './logger';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

let supabaseClient: SupabaseClient | null = null;

/**
 * Get Supabase client instance
 */
export function getSupabaseClient(): SupabaseClient {
    if (!supabaseClient) {
        if (!supabaseUrl || !supabaseAnonKey) {
            throw new Error('Supabase credentials not configured');
        }
        supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
    }
    return supabaseClient;
}

/**
 * Authentication state
 */
export interface AuthState {
    user: User | null;
    session: Session | null;
    loading: boolean;
    error: string | null;
}

/**
 * Authentication service class
 */
class AuthService {
    private client: SupabaseClient;
    private listeners: Set<(state: AuthState) => void> = new Set();
    private currentState: AuthState = {
        user: null,
        session: null,
        loading: true,
        error: null,
    };

    constructor() {
        this.client = getSupabaseClient();
        this.initialize();
    }

    /**
     * Initialize auth service and restore session
     */
    private async initialize() {
        try {
            // Get current session
            const { data: { session }, error } = await this.client.auth.getSession();

            if (error) {
                log.error('Failed to get session', error);
                this.updateState({ loading: false, error: error.message });
                return;
            }

            this.updateState({
                user: session?.user ?? null,
                session,
                loading: false,
                error: null,
            });

            // Listen for auth changes
            this.client.auth.onAuthStateChange((event, session) => {
                log.info('Auth state changed', { event });
                this.updateState({
                    user: session?.user ?? null,
                    session,
                    loading: false,
                    error: null,
                });
            });

            log.info('Auth service initialized', {
                authenticated: !!session
            });
        } catch (error) {
            log.error('Failed to initialize auth service', error as Error);
            this.updateState({
                loading: false,
                error: (error as Error).message
            });
        }
    }

    /**
     * Update auth state and notify listeners
     */
    private updateState(updates: Partial<AuthState>) {
        this.currentState = { ...this.currentState, ...updates };
        this.notifyListeners();
    }

    /**
     * Notify all listeners of state change
     */
    private notifyListeners() {
        this.listeners.forEach(listener => {
            try {
                listener(this.currentState);
            } catch (error) {
                log.error('Error in auth state listener', error as Error);
            }
        });
    }

    /**
     * Subscribe to auth state changes
     */
    public subscribe(listener: (state: AuthState) => void): () => void {
        this.listeners.add(listener);
        // Immediately call with current state
        listener(this.currentState);
        // Return unsubscribe function
        return () => this.listeners.delete(listener);
    }

    /**
     * Get current auth state
     */
    public getState(): AuthState {
        return { ...this.currentState };
    }

    /**
     * Sign up with email and password
     */
    public async signUp(email: string, password: string): Promise<{ success: boolean; error?: string }> {
        try {
            this.updateState({ loading: true, error: null });

            const { data, error } = await this.client.auth.signUp({
                email,
                password,
            });

            if (error) {
                this.updateState({ loading: false, error: error.message });
                return { success: false, error: error.message };
            }

            log.info('User signed up successfully', { userId: data.user?.id });
            return { success: true };
        } catch (error) {
            const message = (error as Error).message;
            log.error('Sign up failed', error as Error);
            this.updateState({ loading: false, error: message });
            return { success: false, error: message };
        }
    }

    /**
     * Sign in with email and password
     */
    public async signIn(email: string, password: string): Promise<{ success: boolean; error?: string }> {
        try {
            this.updateState({ loading: true, error: null });

            const { data, error } = await this.client.auth.signInWithPassword({
                email,
                password,
            });

            if (error) {
                this.updateState({ loading: false, error: error.message });
                return { success: false, error: error.message };
            }

            log.info('User signed in successfully', { userId: data.user?.id });
            return { success: true };
        } catch (error) {
            const message = (error as Error).message;
            log.error('Sign in failed', error as Error);
            this.updateState({ loading: false, error: message });
            return { success: false, error: message };
        }
    }

    /**
     * Sign out current user
     */
    public async signOut(): Promise<{ success: boolean; error?: string }> {
        try {
            this.updateState({ loading: true, error: null });

            const { error } = await this.client.auth.signOut();

            if (error) {
                this.updateState({ loading: false, error: error.message });
                return { success: false, error: error.message };
            }

            log.info('User signed out successfully');
            return { success: true };
        } catch (error) {
            const message = (error as Error).message;
            log.error('Sign out failed', error as Error);
            this.updateState({ loading: false, error: message });
            return { success: false, error: message };
        }
    }

    /**
     * Get current user
     */
    public getCurrentUser(): User | null {
        return this.currentState.user;
    }

    /**
     * Get current session
     */
    public getCurrentSession(): Session | null {
        return this.currentState.session;
    }

    /**
     * Check if user is authenticated
     */
    public isAuthenticated(): boolean {
        return !!this.currentState.user;
    }

    /**
     * Reset password
     */
    public async resetPassword(email: string): Promise<{ success: boolean; error?: string }> {
        try {
            const { error } = await this.client.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/reset-password`,
            });

            if (error) {
                return { success: false, error: error.message };
            }

            log.info('Password reset email sent', { email });
            return { success: true };
        } catch (error) {
            const message = (error as Error).message;
            log.error('Password reset failed', error as Error);
            return { success: false, error: message };
        }
    }

    /**
     * Update password
     */
    public async updatePassword(newPassword: string): Promise<{ success: boolean; error?: string }> {
        try {
            const { error } = await this.client.auth.updateUser({
                password: newPassword,
            });

            if (error) {
                return { success: false, error: error.message };
            }

            log.info('Password updated successfully');
            return { success: true };
        } catch (error) {
            const message = (error as Error).message;
            log.error('Password update failed', error as Error);
            return { success: false, error: message };
        }
    }
}

// Export singleton instance
export const authService = new AuthService();

// Export types
export type { User, Session };
