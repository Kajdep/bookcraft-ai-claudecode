/**
 * Theme Manager
 * 
 * Handles theme switching between light and dark modes with persistence
 * and system preference detection.
 */

import { logger } from './logger';

export type Theme = 'light' | 'dark';

class ThemeManager {
  private currentTheme: Theme = 'light';
  private readonly STORAGE_KEY = 'bookcraft-theme';

  constructor() {
    this.initialize();
  }

  /**
   * Initialize theme from localStorage or system preference
   */
  initialize(): void {
    try {
      // Check localStorage first
      const saved = localStorage.getItem(this.STORAGE_KEY) as Theme | null;
      
      if (saved && (saved === 'light' || saved === 'dark')) {
        this.currentTheme = saved;
      } else {
        // Fall back to system preference
        const systemPreference = window.matchMedia('(prefers-color-scheme: dark)').matches;
        this.currentTheme = systemPreference ? 'dark' : 'light';
      }

      // Apply the theme
      this.applyTheme(this.currentTheme);

      // Listen for system preference changes
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        // Only auto-switch if user hasn't manually set a preference
        if (!localStorage.getItem(this.STORAGE_KEY)) {
          this.currentTheme = e.matches ? 'dark' : 'light';
          this.applyTheme(this.currentTheme);
        }
      });

      logger.info('ThemeManager initialized', { theme: this.currentTheme });
    } catch (error) {
      logger.error('Failed to initialize theme', error);
      // Default to light theme on error
      this.applyTheme('light');
    }
  }

  /**
   * Get current theme
   */
  getTheme(): Theme {
    return this.currentTheme;
  }

  /**
   * Set theme explicitly
   */
  setTheme(theme: Theme): void {
    if (theme !== 'light' && theme !== 'dark') {
      logger.warn('Invalid theme provided', { theme });
      return;
    }

    this.currentTheme = theme;
    this.applyTheme(theme);
    this.persist();

    logger.info('Theme changed', { theme });
  }

  /**
   * Toggle between light and dark themes
   */
  toggle(): void {
    const newTheme: Theme = this.currentTheme === 'light' ? 'dark' : 'light';
    this.setTheme(newTheme);
  }

  /**
   * Apply theme to DOM
   */
  private applyTheme(theme: Theme): void {
    const html = document.documentElement;
    
    if (theme === 'dark') {
      html.classList.add('dark');
    } else {
      html.classList.remove('dark');
    }

    // Also set a data attribute for CSS that might need it
    html.setAttribute('data-theme', theme);
  }

  /**
   * Persist theme to localStorage
   */
  private persist(): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, this.currentTheme);
    } catch (error) {
      logger.error('Failed to persist theme', error);
    }
  }

  /**
   * Clear saved theme preference (will use system preference)
   */
  clearPreference(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
      
      // Revert to system preference
      const systemPreference = window.matchMedia('(prefers-color-scheme: dark)').matches;
      this.currentTheme = systemPreference ? 'dark' : 'light';
      this.applyTheme(this.currentTheme);

      logger.info('Theme preference cleared, using system preference', { theme: this.currentTheme });
    } catch (error) {
      logger.error('Failed to clear theme preference', error);
    }
  }
}

// Export singleton instance
export const themeManager = new ThemeManager();
