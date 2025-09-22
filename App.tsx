
import React from 'react';
import { MainLayout } from './components/MainLayout';
// FIX: Corrected import path for Icons.
import { BookOpenIcon } from './components/Icons';
import { Settings } from 'lucide-react';
import { ToastProvider } from './components/Toast';
import { ErrorBoundary } from './components/ErrorBoundary';
import { SettingsModal } from './components/SettingsModal.tsx';
import { useBookCraftStore } from './store/useStore';

const Header: React.FC<{ onSettingsClick: () => void }> = ({ onSettingsClick }) => (
    <header className="bg-slate-900/70 backdrop-blur-lg border-b border-slate-700/50 sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
                <div className="flex items-center space-x-3">
                    <BookOpenIcon className="h-8 w-8 text-brand-primary" />
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-100 to-slate-400 text-transparent bg-clip-text">
                        BookCraft <span className="text-brand-primary">AI</span>
                    </h1>
                </div>
                <button
                    onClick={onSettingsClick}
                    className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
                    title="Settings"
                >
                    <Settings size={20} />
                </button>
            </div>
        </div>
    </header>
);


const App: React.FC = () => {
    const [isSettingsOpen, setIsSettingsOpen] = React.useState(false);
    const initializeApp = useBookCraftStore(state => state.initializeApp);

    // Initialize the app with clean UI state on startup
    React.useEffect(() => {
        initializeApp();
    }, [initializeApp]);

    return (
        <ErrorBoundary>
            <ToastProvider>
                <div className="min-h-screen bg-slate-900 font-sans">
                    <Header onSettingsClick={() => setIsSettingsOpen(true)} />
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
