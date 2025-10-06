import React, { useState, useEffect } from 'react';
import { Modal, Button, Input, Select } from './UI';
import { useBookCraftStore } from '../store/useStore';
import { 
    Save, Eye, EyeOff, RotateCcw, Key, Brain, HardDrive, 
    FileText, Download, Settings as SettingsIcon, Cloud,
    Wifi, WifiOff, RefreshCw, Database, AlertCircle, CheckCircle,
    Info
} from 'lucide-react';
import { logger } from '../services/logger';
import { toast } from '../services/toast';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

type TabType = 'api' | 'models' | 'storage' | 'editor' | 'export' | 'advanced';

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
    const { settings, updateSettings, syncStatus, lastSyncTime, storageMode, manualSync, getStorageStats, configureStorage } = useBookCraftStore();
    const [activeTab, setActiveTab] = useState<TabType>('api');

    // Local form state - API Keys
    const [openRouterApiKey, setOpenRouterApiKey] = useState(settings?.openRouterApiKey || '');
    const [openRouterEndpoint, setOpenRouterEndpoint] = useState(settings?.openRouterEndpoint || 'https://openrouter.ai/api/v1');
    const [defaultModel, setDefaultModel] = useState(settings?.defaultModel || 'nvidia/nemotron-nano-9b-v2:free');
    const [geminiApiKey, setGeminiApiKey] = useState(settings?.geminiApiKey || '');
    const [geminiEndpoint, setGeminiEndpoint] = useState(settings?.geminiEndpoint || 'https://generativelanguage.googleapis.com');

    // Show/hide password states
    const [showOpenRouterKey, setShowOpenRouterKey] = useState(false);
    const [showGeminiKey, setShowGeminiKey] = useState(false);

    // Storage stats state
    const [storageStats, setStorageStats] = useState<any>(null);
    const [loadingStats, setLoadingStats] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);
    
    // Editor settings
    const [fontSize, setFontSize] = useState(settings?.fontSize || 16);
    const [fontFamily, setFontFamily] = useState(settings?.fontFamily || 'inter');
    const [theme, setTheme] = useState(settings?.theme || 'dark');
    const [autoSave, setAutoSave] = useState(settings?.autoSave !== false);
    const [autoSaveInterval, setAutoSaveInterval] = useState(settings?.autoSaveInterval || 2000);
    const [spellCheck, setSpellCheck] = useState(settings?.spellCheck !== false);
    
    // Export settings
    const [exportFormat, setExportFormat] = useState(settings?.exportFormat || 'docx');
    const [includeMetadata, setIncludeMetadata] = useState(settings?.includeMetadata !== false);
    const [includeImages, setIncludeImages] = useState(settings?.includeImages !== false);
    
    // Advanced settings
    const [debugMode, setDebugMode] = useState(settings?.debugMode || false);
    const [telemetry, setTelemetry] = useState(settings?.telemetry !== false);

    // Available OpenRouter models
    const openRouterModels = [
        { value: 'nvidia/nemotron-nano-9b-v2:free', label: 'Nemotron Nano 9B (Free)', description: 'Fast and efficient free model' },
        { value: 'anthropic/claude-3.5-sonnet', label: 'Claude 3.5 Sonnet', description: 'High-quality reasoning and writing' },
        { value: 'anthropic/claude-3-haiku', label: 'Claude 3 Haiku', description: 'Fast and cost-effective' },
        { value: 'openai/gpt-4o', label: 'GPT-4o', description: 'OpenAI\'s latest multimodal model' },
        { value: 'openai/gpt-4o-mini', label: 'GPT-4o Mini', description: 'Smaller, faster GPT-4o variant' },
        { value: 'openai/gpt-4-turbo', label: 'GPT-4 Turbo', description: 'Advanced reasoning with large context' },
        { value: 'openai/gpt-3.5-turbo', label: 'GPT-3.5 Turbo', description: 'Balanced performance and cost' },
        { value: 'google/gemini-pro-1.5', label: 'Gemini Pro 1.5', description: 'Google\'s advanced model' },
        { value: 'meta-llama/llama-3.1-405b-instruct', label: 'Llama 3.1 405B', description: 'Meta\'s largest open model' },
        { value: 'meta-llama/llama-3.1-70b-instruct', label: 'Llama 3.1 70B', description: 'Balanced open source model' },
        { value: 'mistralai/mistral-large', label: 'Mistral Large', description: 'Mistral\'s flagship model' },
        { value: 'cohere/command-r-plus', label: 'Command R+', description: 'Cohere\'s advanced model' }
    ];

    // Sync with store when modal opens
    useEffect(() => {
        if (isOpen && settings) {
            setOpenRouterApiKey(settings.openRouterApiKey || '');
            setOpenRouterEndpoint(settings.openRouterEndpoint || 'https://openrouter.ai/api/v1');
            setDefaultModel(settings.defaultModel || 'nvidia/nemotron-nano-9b-v2:free');
            setGeminiApiKey(settings.geminiApiKey || '');
            setGeminiEndpoint(settings.geminiEndpoint || 'https://generativelanguage.googleapis.com');
            setFontSize(settings.fontSize || 16);
            setFontFamily(settings.fontFamily || 'inter');
            setTheme(settings.theme || 'dark');
            setAutoSave(settings.autoSave !== false);
            setAutoSaveInterval(settings.autoSaveInterval || 2000);
            setSpellCheck(settings.spellCheck !== false);
            setExportFormat(settings.exportFormat || 'docx');
            setIncludeMetadata(settings.includeMetadata !== false);
            setIncludeImages(settings.includeImages !== false);
            setDebugMode(settings.debugMode || false);
            setTelemetry(settings.telemetry !== false);
        }
    }, [isOpen, settings]);

    // Load storage stats when storage tab is active
    useEffect(() => {
        if (activeTab === 'storage' && isOpen) {
            loadStorageStats();
        }
    }, [activeTab, isOpen]);

    const loadStorageStats = async () => {
        setLoadingStats(true);
        try {
            const stats = await getStorageStats();
            setStorageStats(stats);
        } catch (error) {
            logger.error('Failed to load storage stats', error);
            toast.error('Failed to Load Stats', 'Could not load storage statistics');
        } finally {
            setLoadingStats(false);
        }
    };

    const handleManualSync = async () => {
        setIsSyncing(true);
        try {
            await manualSync();
            toast.success('Sync Complete', 'Your data has been synced with the cloud');
            await loadStorageStats();
        } catch (error) {
            logger.error('Manual sync failed', error);
        } finally {
            setIsSyncing(false);
        }
    };

    const handleSave = () => {
        updateSettings({
            openRouterApiKey,
            openRouterEndpoint,
            defaultModel,
            geminiApiKey,
            geminiEndpoint,
            fontSize,
            fontFamily,
            theme,
            autoSave,
            autoSaveInterval,
            spellCheck,
            exportFormat,
            includeMetadata,
            includeImages,
            debugMode,
            telemetry,
        });
        toast.success('Settings Saved', 'Your settings have been updated successfully');
        onClose();
    };

    const handleReset = () => {
        if (!confirm('Are you sure you want to reset all settings to their default values?')) {
            return;
        }
        setOpenRouterApiKey('');
        setOpenRouterEndpoint('https://openrouter.ai/api/v1');
        setDefaultModel('nvidia/nemotron-nano-9b-v2:free');
        setGeminiApiKey('');
        setGeminiEndpoint('https://generativelanguage.googleapis.com');
        setFontSize(16);
        setFontFamily('inter');
        setTheme('dark');
        setAutoSave(true);
        setAutoSaveInterval(2000);
        setSpellCheck(true);
        setExportFormat('docx');
        setIncludeMetadata(true);
        setIncludeImages(true);
        setDebugMode(false);
        setTelemetry(true);
        toast.success('Settings Reset', 'All settings have been reset to defaults');
    };

    const isFormValid = openRouterApiKey.trim() && geminiApiKey.trim();

    // Tab configuration
    const tabs = [
        { id: 'api' as TabType, label: 'API Keys', icon: Key },
        { id: 'models' as TabType, label: 'AI Models', icon: Brain },
        { id: 'storage' as TabType, label: 'Storage', icon: HardDrive },
        { id: 'editor' as TabType, label: 'Editor', icon: FileText },
        { id: 'export' as TabType, label: 'Export', icon: Download },
        { id: 'advanced' as TabType, label: 'Advanced', icon: SettingsIcon },
    ];

    const formatBytes = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
    };

    const getStoragePercentage = (used: number, total: number) => {
        return total > 0 ? Math.round((used / total) * 100) : 0;
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Settings" size="large">
            <div className="flex h-[600px]">
                {/* Sidebar with tabs */}
                <div className="w-48 border-r border-gray-300 pr-4">
                    <nav className="space-y-1">
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                                        activeTab === tab.id
                                            ? 'bg-brand-primary text-gray-900'
                                            : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                                    }`}
                                >
                                    <Icon size={18} />
                                    <span className="text-sm font-medium">{tab.label}</span>
                                </button>
                            );
                        })}
                    </nav>
                </div>

                {/* Content area */}
                <div className="flex-1 pl-6 overflow-y-auto">
                    <div className="space-y-6 pb-6">
                        {/* API Keys Tab */}
                        {activeTab === 'api' && (
                            <form onSubmit={(e) => e.preventDefault()}>
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 mb-2">API Configuration</h3>
                                    <p className="text-sm text-gray-600 mb-6">
                                        Configure your own API keys and endpoints for AI services. This gives you full control over costs and usage.
                                    </p>
                                </div>

                                {/* OpenRouter Configuration */}
                                <div className="space-y-4">
                                    <h4 className="text-md font-medium text-gray-800">OpenRouter (Text Generation)</h4>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            API Key *
                                        </label>
                                        <div className="relative">
                                            <Input
                                                type={showOpenRouterKey ? "text" : "password"}
                                                value={openRouterApiKey}
                                                onChange={(e) => setOpenRouterApiKey(e.target.value)}
                                                placeholder="sk-or-v1-..."
                                                className="pr-10"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowOpenRouterKey(!showOpenRouterKey)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-800"
                                            >
                                                {showOpenRouterKey ? <EyeOff size={16} /> : <Eye size={16} />}
                                            </button>
                                        </div>
                                        <p className="text-xs text-gray-500 mt-1">
                                            Get your API key from <a href="https://openrouter.ai/keys" target="_blank" rel="noopener noreferrer" className="text-brand-primary hover:underline">OpenRouter</a>
                                        </p>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Endpoint URL
                                        </label>
                                        <Input
                                            type="text"
                                            value={openRouterEndpoint}
                                            onChange={(e) => setOpenRouterEndpoint(e.target.value)}
                                            placeholder="https://openrouter.ai/api/v1"
                                        />
                                    </div>
                                </div>

                                {/* Gemini Configuration */}
                                <div className="space-y-4">
                                    <h4 className="text-md font-medium text-gray-800">Google Gemini (Image Generation)</h4>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            API Key *
                                        </label>
                                        <div className="relative">
                                            <Input
                                                type={showGeminiKey ? "text" : "password"}
                                                value={geminiApiKey}
                                                onChange={(e) => setGeminiApiKey(e.target.value)}
                                                placeholder="AIza..."
                                                className="pr-10"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowGeminiKey(!showGeminiKey)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-800"
                                            >
                                                {showGeminiKey ? <EyeOff size={16} /> : <Eye size={16} />}
                                            </button>
                                        </div>
                                        <p className="text-xs text-gray-500 mt-1">
                                            Get your API key from <a href="https://makersuite.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-brand-primary hover:underline">Google AI Studio</a>
                                        </p>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Endpoint URL
                                        </label>
                                        <Input
                                            type="text"
                                            value={geminiEndpoint}
                                            onChange={(e) => setGeminiEndpoint(e.target.value)}
                                            placeholder="https://generativelanguage.googleapis.com"
                                        />
                                    </div>
                                </div>
                            </>
                        )}

                        {/* AI Models Tab */}
                        {activeTab === 'models' && (
                            <>
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 mb-2">AI Model Selection</h3>
                                    <p className="text-sm text-gray-600 mb-6">
                                        Choose the AI model for text generation and content creation.
                                    </p>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Default AI Model
                                        </label>
                                        <Select
                                            value={defaultModel}
                                            onChange={setDefaultModel}
                                            options={openRouterModels}
                                            placeholder="Select a model..."
                                        />
                                        <p className="text-xs text-gray-500 mt-1">
                                            Choose the AI model for text generation. Free models are marked accordingly.
                                        </p>
                                    </div>

                                    <div className="bg-gray-100/50 rounded-lg p-4 border border-gray-300">
                                        <div className="flex items-start space-x-3">
                                            <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                                            <div className="text-sm text-gray-700">
                                                <p className="font-medium mb-1">Model Selection Tips</p>
                                                <ul className="list-disc list-inside space-y-1 text-gray-600">
                                                    <li>Free models are great for testing and light usage</li>
                                                    <li>Claude models excel at creative writing and complex reasoning</li>
                                                    <li>GPT-4o offers excellent balance of quality and speed</li>
                                                    <li>Llama models provide high-quality open-source alternatives</li>
                                                </ul>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </form>
                        )}

                        {/* Storage Tab */}
                        {activeTab === 'storage' && (
                            <>
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Storage & Sync</h3>
                                    <p className="text-sm text-gray-600 mb-6">
                                        Monitor your storage usage and manage cloud synchronization.
                                    </p>
                                </div>

                                {/* Sync Status */}
                                <div className="bg-gray-100/50 rounded-lg p-4 border border-gray-300">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center space-x-3">
                                            {storageMode === 'offline' ? (
                                                <WifiOff className="w-5 h-5 text-red-400" />
                                            ) : (
                                                <Wifi className="w-5 h-5 text-green-400" />
                                            )}
                                            <div>
                                                <p className="text-sm font-medium text-gray-800">
                                                    {storageMode === 'offline' ? 'Offline Mode' : storageMode === 'online' ? 'Online Mode' : 'Hybrid Mode'}
                                                </p>
                                                <p className="text-xs text-gray-600">
                                                    {lastSyncTime ? `Last synced: ${new Date(lastSyncTime).toLocaleString()}` : 'Never synced'}
                                                </p>
                                            </div>
                                        </div>
                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            onClick={handleManualSync}
                                            disabled={isSyncing || syncStatus === 'syncing'}
                                        >
                                            <RefreshCw size={14} className={`mr-2 ${isSyncing || syncStatus === 'syncing' ? 'animate-spin' : ''}`} />
                                            {isSyncing || syncStatus === 'syncing' ? 'Syncing...' : 'Sync Now'}
                                        </Button>
                                    </div>

                                    {syncStatus === 'error' && (
                                        <div className="flex items-center space-x-2 text-red-400 text-sm">
                                            <AlertCircle size={16} />
                                            <span>Sync error occurred. Please try again.</span>
                                        </div>
                                    )}
                                </div>

                                {/* Storage Stats */}
                                {loadingStats ? (
                                    <div className="text-center py-8">
                                        <RefreshCw className="w-8 h-8 animate-spin text-brand-primary mx-auto mb-2" />
                                        <p className="text-sm text-gray-600">Loading storage statistics...</p>
                                    </div>
                                ) : storageStats ? (
                                    <div className="space-y-4">
                                        {/* Local Storage */}
                                        <div className="bg-gray-100/50 rounded-lg p-4 border border-gray-300">
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center space-x-2">
                                                    <Database className="w-4 h-4 text-blue-400" />
                                                    <h4 className="text-sm font-medium text-gray-800">Local Storage</h4>
                                                </div>
                                                <span className="text-sm text-gray-600">
                                                    {formatBytes(storageStats.localUsed)} / {formatBytes(storageStats.localUsed + storageStats.localAvailable)}
                                                </span>
                                            </div>
                                            <div className="w-full bg-white rounded-full h-2">
                                                <div
                                                    className="bg-blue-500 h-2 rounded-full transition-all"
                                                    style={{ width: `${getStoragePercentage(storageStats.localUsed, storageStats.localUsed + storageStats.localAvailable)}%` }}
                                                />
                                            </div>
                                            <p className="text-xs text-gray-500 mt-2">
                                                {getStoragePercentage(storageStats.localUsed, storageStats.localUsed + storageStats.localAvailable)}% used
                                            </p>
                                        </div>

                                        {/* Cloud Storage */}
                                        <div className="bg-gray-100/50 rounded-lg p-4 border border-gray-300">
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center space-x-2">
                                                    <Cloud className="w-4 h-4 text-green-400" />
                                                    <h4 className="text-sm font-medium text-gray-800">Cloud Storage</h4>
                                                </div>
                                                <span className="text-sm text-gray-600">
                                                    {formatBytes(storageStats.cloudUsed)} / {formatBytes(storageStats.cloudAvailable)}
                                                </span>
                                            </div>
                                            <div className="w-full bg-white rounded-full h-2">
                                                <div
                                                    className="bg-green-500 h-2 rounded-full transition-all"
                                                    style={{ width: `${getStoragePercentage(storageStats.cloudUsed, storageStats.cloudAvailable)}%` }}
                                                />
                                            </div>
                                            <p className="text-xs text-gray-500 mt-2">
                                                {getStoragePercentage(storageStats.cloudUsed, storageStats.cloudAvailable)}% used • Supabase Free Tier
                                            </p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center py-8 text-gray-600">
                                        <p>Unable to load storage statistics</p>
                                    </div>
                                )}
                            </>
                        )}

                        {/* Editor Tab */}
                        {activeTab === 'editor' && (
                            <>
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Editor Preferences</h3>
                                    <p className="text-sm text-gray-600 mb-6">
                                        Customize your writing environment and autosave behavior.
                                    </p>
                                </div>

                                <div className="space-y-6">
                                    {/* Font Settings */}
                                    <div className="space-y-4">
                                        <h4 className="text-md font-medium text-gray-800">Appearance</h4>
                                        
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Font Size: {fontSize}px
                                            </label>
                                            <input
                                                type="range"
                                                min="12"
                                                max="24"
                                                value={fontSize}
                                                onChange={(e) => setFontSize(parseInt(e.target.value))}
                                                className="w-full"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Font Family
                                            </label>
                                            <Select
                                                value={fontFamily}
                                                onChange={setFontFamily}
                                                options={[
                                                    { value: 'inter', label: 'Inter', description: 'Modern sans-serif' },
                                                    { value: 'serif', label: 'Serif', description: 'Traditional serif' },
                                                    { value: 'mono', label: 'Monospace', description: 'Fixed-width font' },
                                                ]}
                                            />
                                        </div>
                                    </div>

                                    {/* Autosave Settings */}
                                    <div className="space-y-4">
                                        <h4 className="text-md font-medium text-gray-800">Autosave</h4>
                                        
                                        <label className="flex items-center space-x-3 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={autoSave}
                                                onChange={(e) => setAutoSave(e.target.checked)}
                                                className="w-4 h-4 text-brand-primary bg-white border-gray-300 rounded focus:ring-brand-primary"
                                            />
                                            <span className="text-sm text-gray-700">Enable autosave</span>
                                        </label>

                                        {autoSave && (
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Autosave Interval: {autoSaveInterval / 1000}s
                                                </label>
                                                <input
                                                    type="range"
                                                    min="1000"
                                                    max="10000"
                                                    step="1000"
                                                    value={autoSaveInterval}
                                                    onChange={(e) => setAutoSaveInterval(parseInt(e.target.value))}
                                                    className="w-full"
                                                />
                                            </div>
                                        )}
                                    </div>

                                    {/* Other Settings */}
                                    <div className="space-y-4">
                                        <h4 className="text-md font-medium text-gray-800">Other</h4>
                                        
                                        <label className="flex items-center space-x-3 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={spellCheck}
                                                onChange={(e) => setSpellCheck(e.target.checked)}
                                                className="w-4 h-4 text-brand-primary bg-white border-gray-300 rounded focus:ring-brand-primary"
                                            />
                                            <span className="text-sm text-gray-700">Enable spell check</span>
                                        </label>
                                    </div>
                                </div>
                            </>
                        )}

                        {/* Export Tab */}
                        {activeTab === 'export' && (
                            <>
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Export Settings</h3>
                                    <p className="text-sm text-gray-600 mb-6">
                                        Configure default export options for your manuscripts.
                                    </p>
                                </div>

                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Default Export Format
                                        </label>
                                        <Select
                                            value={exportFormat}
                                            onChange={setExportFormat}
                                            options={[
                                                { value: 'docx', label: 'Microsoft Word (.docx)', description: 'Most compatible format' },
                                                { value: 'pdf', label: 'PDF (.pdf)', description: 'Print-ready format' },
                                                { value: 'txt', label: 'Plain Text (.txt)', description: 'Simple text file' },
                                                { value: 'md', label: 'Markdown (.md)', description: 'Formatted plain text' },
                                                { value: 'epub', label: 'EPUB (.epub)', description: 'E-book format' },
                                            ]}
                                        />
                                    </div>

                                    <div className="space-y-3">
                                        <label className="flex items-center space-x-3 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={includeMetadata}
                                                onChange={(e) => setIncludeMetadata(e.target.checked)}
                                                className="w-4 h-4 text-brand-primary bg-white border-gray-300 rounded focus:ring-brand-primary"
                                            />
                                            <span className="text-sm text-gray-700">Include metadata (author, title, date)</span>
                                        </label>

                                        <label className="flex items-center space-x-3 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={includeImages}
                                                onChange={(e) => setIncludeImages(e.target.checked)}
                                                className="w-4 h-4 text-brand-primary bg-white border-gray-300 rounded focus:ring-brand-primary"
                                            />
                                            <span className="text-sm text-gray-700">Include images and diagrams</span>
                                        </label>
                                    </div>
                                </div>
                            </>
                        )}

                        {/* Advanced Tab */}
                        {activeTab === 'advanced' && (
                            <>
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Advanced Settings</h3>
                                    <p className="text-sm text-gray-600 mb-6">
                                        Advanced options for debugging and telemetry.
                                    </p>
                                </div>

                                <div className="space-y-6">
                                    <div className="bg-yellow-900/20 border border-yellow-700/50 rounded-lg p-4">
                                        <div className="flex items-start space-x-3">
                                            <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                                            <div className="text-sm text-yellow-200">
                                                <p className="font-medium mb-1">Caution</p>
                                                <p>These settings are for advanced users only. Changing them may affect app stability.</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <label className="flex items-center space-x-3 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={debugMode}
                                                onChange={(e) => setDebugMode(e.target.checked)}
                                                className="w-4 h-4 text-brand-primary bg-white border-gray-300 rounded focus:ring-brand-primary"
                                            />
                                            <div>
                                                <div className="text-sm text-gray-700">Debug Mode</div>
                                                <div className="text-xs text-gray-500">Show detailed logging in the console</div>
                                            </div>
                                        </label>

                                        <label className="flex items-center space-x-3 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={telemetry}
                                                onChange={(e) => setTelemetry(e.target.checked)}
                                                className="w-4 h-4 text-brand-primary bg-white border-gray-300 rounded focus:ring-brand-primary"
                                            />
                                            <div>
                                                <div className="text-sm text-gray-700">Anonymous Telemetry</div>
                                                <div className="text-xs text-gray-500">Help improve BookCraft AI by sharing anonymous usage data</div>
                                            </div>
                                        </label>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Footer with action buttons */}
            <div className="border-t border-gray-300 pt-4 mt-6 flex justify-between">
                <Button
                    variant="secondary"
                    onClick={handleReset}
                >
                    <RotateCcw size={16} className="mr-2" />
                    Reset All
                </Button>

                <div className="flex gap-3">
                    <Button variant="secondary" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button
                        variant="primary"
                        onClick={handleSave}
                        disabled={!isFormValid}
                    >
                        <Save size={16} className="mr-2" />
                        Save Settings
                    </Button>
                </div>
            </div>
        </Modal>
    );
};
