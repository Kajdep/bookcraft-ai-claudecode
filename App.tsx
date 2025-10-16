
import React from 'react';
import { MainLayout } from './components/MainLayout';
// FIX: Corrected import path for Icons.
import { BookOpenIcon } from './components/Icons';
import { Settings, Sun, Moon } from 'lucide-react';
import { ToastProvider } from './components/Toast';
import { ErrorBoundary } from './components/ErrorBoundary';
import { SettingsModal } from './components/SettingsModal.tsx';
import { LoginPage } from './components/auth/LoginPage';
import { RegisterPage } from './components/auth/RegisterPage';
import { SyncStatusIndicator } from './components/SyncStatusIndicator';
import { useBookCraftStore } from './store/useStore';
import { initializeSupabaseSync } from './store/supabaseSync';
import { logger } from './services/logger';
import { themeManager } from './services/themeManager';

const Header: React.FC<{ onSettingsClick: () => void }> = ({ onSettingsClick }) => {
    const theme = useBookCraftStore(state => state.settings?.theme || 'light');
    const setTheme = useBookCraftStore(state => state.setTheme);
    const logout = useBookCraftStore(state => state.logout);
    const currentUser = useBookCraftStore(state => state.currentUser);

    const toggleTheme = () => {
        setTheme(theme === 'light' ? 'dark' : 'light');
    };

    return (
        <header className="bg-white/90 backdrop-blur-lg border-b border-gray-200 sticky top-0 z-50 shadow-sm dark:bg-gray-900/90 dark:border-gray-700">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    <div className="flex items-center space-x-3">
                        <BookOpenIcon className="h-8 w-8 text-brand-primary" />
                        <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 dark:from-gray-200 dark:to-gray-400 text-transparent bg-clip-text">
                            WrittenUpAi
                        </h1>
                    </div>
                    <div className="flex items-center space-x-4">
                        {currentUser && (
                            <div className="hidden sm:flex items-center space-x-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-800 rounded-lg">
                                <div className="w-8 h-8 bg-brand-primary rounded-full flex items-center justify-center text-white font-semibold text-sm">
                                    {currentUser.name.charAt(0).toUpperCase()}
                                </div>
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    {currentUser.name}
                                </span>
                            </div>
                        )}
                        <div className="flex items-center space-x-2">
                            <SyncStatusIndicator />
                            <button
                                onClick={toggleTheme}
                                className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                                title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
                            >
                                {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
                            </button>
                            <button
                                onClick={onSettingsClick}
                                className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                                title="Settings"
                            >
                                <Settings size={20} />
                            </button>
                            <button
                                onClick={logout}
                                className="px-3 py-1.5 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                title="Sign Out"
                            >
                                Sign Out
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
};


const App: React.FC = () => {
    const [isSettingsOpen, setIsSettingsOpen] = React.useState(false);
    const [showApiWarning, setShowApiWarning] = React.useState(true);
    const [authView, setAuthView] = React.useState<'login' | 'register'>('login');

    // FIX: Separate selectors to prevent infinite loops
    const initializeApp = useBookCraftStore(state => state.initializeApp);
    const closeAllModals = useBookCraftStore(state => state.closeAllModals);
    const settings = useBookCraftStore(state => state.settings);
    const isAuthenticated = useBookCraftStore(state => state.isAuthenticated);

    // Check if API keys are configured
    const hasApiKeys = settings?.openRouterApiKey || settings?.geminiApiKey;

    // Initialize the app with clean UI state on startup
    React.useEffect(() => {
        // Initialize theme first (synchronous)
        themeManager.initialize();
        
        // Initialize Supabase sync
        initializeSupabaseSync()
            .then(() => {
                logger.info('Supabase sync initialized successfully');
                initializeApp();
                closeAllModals(); // Ensure all modals are closed on app start

                // Sync theme with store settings
                const storedTheme = settings?.theme;
                if (storedTheme && storedTheme !== themeManager.getTheme()) {
                    themeManager.setTheme(storedTheme);
                }
            })
            .catch((error) => {
                logger.error('Failed to initialize Supabase sync', error);
                // Still initialize the app even if sync init fails
                initializeApp();
                closeAllModals();
            });
    }, [initializeApp, closeAllModals, settings?.theme]);

    // Handle app visibility change to cleanup modals
    React.useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.hidden) {
                // Clean up modal states when app loses focus
                closeAllModals();
                setIsSettingsOpen(false);
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, [closeAllModals]);

    // Show auth pages if not authenticated
    if (!isAuthenticated) {
        return (
            <ErrorBoundary>
                <ToastProvider>
                    {authView === 'login' ? (
                        <LoginPage onSwitchToRegister={() => setAuthView('register')} />
                    ) : (
                        <RegisterPage onSwitchToLogin={() => setAuthView('login')} />
                    )}
                </ToastProvider>
            </ErrorBoundary>
        );
    }

    return (
        <ErrorBoundary>
            <ToastProvider>
                <div className="min-h-screen bg-gray-50 dark:bg-gray-900 font-sans">
                    <Header onSettingsClick={() => setIsSettingsOpen(true)} />

                    {/* API Key Warning Banner */}
                    {!hasApiKeys && showApiWarning && (
                        <div className="bg-yellow-50 dark:bg-yellow-900/20 border-b border-yellow-200 dark:border-yellow-800">
                            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-3">
                                        <svg className="w-5 h-5 text-yellow-600 dark:text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                        </svg>
                                        <div>
                                            <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                                                API Keys Required
                                            </p>
                                            <p className="text-xs text-yellow-700 dark:text-yellow-300">
                                                Configure your OpenRouter and Gemini API keys to unlock AI features.
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <button
                                            onClick={() => setIsSettingsOpen(true)}
                                            className="px-4 py-1.5 bg-yellow-600 hover:bg-yellow-700 text-white text-sm font-medium rounded-md transition-colors"
                                        >
                                            Add Keys
                                        </button>
                                        <button
                                            onClick={() => setShowApiWarning(false)}
                                            className="px-3 py-1.5 text-yellow-800 dark:text-yellow-200 hover:bg-yellow-100 dark:hover:bg-yellow-900/40 text-sm rounded-md transition-colors"
                                        >
                                            Dismiss
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    <ErrorBoundary>
                        <MainLayout />
                    </ErrorBoundary>
                    <SettingsModal
                        isOpen={isSettingsOpen}
                        onClose={() => setIsSettingsOpen(false)}
                    />
                </div>
            </ToastProvider>
        </ErrorBoundary>
    );
};

export default App;
