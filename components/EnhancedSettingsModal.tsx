import React, { useState, useEffect } from 'react';
import { Modal, Button, Input, Select, Card } from './UI';
import { useBookCraftStore } from '../store/useStore';
import { CogIcon, PaintBrushIcon, UserIcon, BellIcon, ShieldCheckIcon, PencilIcon, EyeIcon, EyeSlashIcon, MoonIcon, SunIcon, ComputerDesktopIcon, GlobeAltIcon, ClockIcon, BookmarkIcon, ArchiveBoxIcon } from './Icons';

interface EnhancedSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

interface UserSettings {
    // API Settings
    openRouterApiKey?: string;
    openRouterEndpoint?: string;
    defaultModel?: string;
    geminiApiKey?: string;
    geminiEndpoint?: string;
    
    // Theme & Appearance
    theme: 'light' | 'dark' | 'system';
    accentColor: string;
    fontSize: 'small' | 'medium' | 'large' | 'extra-large';
    editorFont: 'default' | 'serif' | 'mono';
    showLineNumbers: boolean;
    showWordCount: boolean;
    compactMode: boolean;
    
    // Writing Preferences
    defaultGenre: string;
    autoSave: boolean;
    autoSaveInterval: number; // in seconds
    spellCheck: boolean;
    grammarCheck: boolean;
    writingMode: 'distraction-free' | 'standard' | 'split-screen';
    dailyWordGoal: number;
    showWritingStats: boolean;
    
    // Notifications
    enableNotifications: boolean;
    dailyReminders: boolean;
    goalReminders: boolean;
    achievementNotifications: boolean;
    
    // Privacy & Security
    dataRetention: '30-days' | '90-days' | '1-year' | 'forever';
    crashReporting: boolean;
    usageAnalytics: boolean;
    
    // Language & Localization
    language: string;
    dateFormat: string;
    timeFormat: '12h' | '24h';
    timezone: string;
    
    // Backup & Sync
    autoBackup: boolean;
    backupFrequency: 'daily' | 'weekly' | 'monthly';
    cloudSync: boolean;
    
    // Accessibility
    highContrast: boolean;
    reducedMotion: boolean;
    largeButtons: boolean;
    screenReader: boolean;
}

const ACCENT_COLORS = [
    { name: 'Blue', value: '#3B82F6' },
    { name: 'Purple', value: '#8B5CF6' },
    { name: 'Green', value: '#10B981' },
    { name: 'Orange', value: '#F59E0B' },
    { name: 'Red', value: '#EF4444' },
    { name: 'Pink', value: '#EC4899' },
    { name: 'Teal', value: '#14B8A6' },
    { name: 'Indigo', value: '#6366F1' }
];

const FONT_SIZES = {
    'small': { name: 'Small', size: '14px' },
    'medium': { name: 'Medium', size: '16px' },
    'large': { name: 'Large', size: '18px' },
    'extra-large': { name: 'Extra Large', size: '20px' }
};

const EDITOR_FONTS = {
    'default': { name: 'Default (Inter)', css: 'Inter, system-ui, sans-serif' },
    'serif': { name: 'Serif (Times)', css: 'Times New Roman, serif' },
    'mono': { name: 'Monospace (Fira Code)', css: 'Fira Code, Monaco, monospace' }
};

const LANGUAGES = [
    { value: 'en', label: 'English' },
    { value: 'es', label: 'Español' },
    { value: 'fr', label: 'Français' },
    { value: 'de', label: 'Deutsch' },
    { value: 'it', label: 'Italiano' },
    { value: 'pt', label: 'Português' },
    { value: 'ru', label: 'Русский' },
    { value: 'ja', label: '日本語' },
    { value: 'ko', label: '한국어' },
    { value: 'zh', label: '中文' }
];

const SettingsSection: React.FC<{
    title: string;
    description?: string;
    icon: React.ReactNode;
    children: React.ReactNode;
}> = ({ title, description, icon, children }) => (
    <Card className="p-6">
        <div className="flex items-start gap-4 mb-6">
            <div className="p-2 bg-slate-700 rounded-lg">
                {icon}
            </div>
            <div>
                <h3 className="text-lg font-semibold text-slate-100">{title}</h3>
                {description && (
                    <p className="text-sm text-slate-400 mt-1">{description}</p>
                )}
            </div>
        </div>
        <div className="space-y-4">
            {children}
        </div>
    </Card>
);

const ToggleSwitch: React.FC<{
    checked: boolean;
    onChange: (checked: boolean) => void;
    label: string;
    description?: string;
}> = ({ checked, onChange, label, description }) => (
    <div className="flex items-center justify-between">
        <div className="flex-1">
            <label className="text-sm font-medium text-slate-300">{label}</label>
            {description && (
                <p className="text-xs text-slate-500 mt-1">{description}</p>
            )}
        </div>
        <button
            onClick={() => onChange(!checked)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                checked ? 'bg-brand-primary' : 'bg-slate-700'
            }`}
        >
            <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    checked ? 'translate-x-6' : 'translate-x-1'
                }`}
            />
        </button>
    </div>
);

export const EnhancedSettingsModal: React.FC<EnhancedSettingsModalProps> = ({ isOpen, onClose }) => {
    const [activeTab, setActiveTab] = useState<'general' | 'appearance' | 'writing' | 'notifications' | 'privacy' | 'api'>('general');
    const { settings, updateSettings } = useBookCraftStore();
    
    // Default settings
    const defaultSettings: UserSettings = {
        openRouterApiKey: '',
        openRouterEndpoint: 'https://openrouter.ai/api/v1',
        defaultModel: 'nvidia/nemotron-nano-9b-v2:free',
        geminiApiKey: '',
        geminiEndpoint: 'https://generativelanguage.googleapis.com',
        
        theme: 'dark',
        accentColor: '#3B82F6',
        fontSize: 'medium',
        editorFont: 'default',
        showLineNumbers: false,
        showWordCount: true,
        compactMode: false,
        
        defaultGenre: 'Fiction',
        autoSave: true,
        autoSaveInterval: 30,
        spellCheck: true,
        grammarCheck: false,
        writingMode: 'standard',
        dailyWordGoal: 1000,
        showWritingStats: true,
        
        enableNotifications: true,
        dailyReminders: false,
        goalReminders: true,
        achievementNotifications: true,
        
        dataRetention: '1-year',
        crashReporting: true,
        usageAnalytics: false,
        
        language: 'en',
        dateFormat: 'MM/dd/yyyy',
        timeFormat: '12h',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        
        autoBackup: true,
        backupFrequency: 'daily',
        cloudSync: false,
        
        highContrast: false,
        reducedMotion: false,
        largeButtons: false,
        screenReader: false
    };

    const [localSettings, setLocalSettings] = useState<UserSettings>(defaultSettings);
    const [showApiKeys, setShowApiKeys] = useState({ openRouter: false, gemini: false });

    useEffect(() => {
        if (isOpen && settings) {
            setLocalSettings({ ...defaultSettings, ...settings });
        }
    }, [isOpen, settings]);

    const handleSave = () => {
        updateSettings(localSettings);
        onClose();
    };

    const handleReset = () => {
        setLocalSettings(defaultSettings);
    };

    const updateLocalSetting = <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => {
        setLocalSettings(prev => ({ ...prev, [key]: value }));
    };

    const tabs = [
        { id: 'general', label: 'General', icon: <CogIcon className="w-4 h-4" /> },
        { id: 'appearance', label: 'Appearance', icon: <PaintBrushIcon className="w-4 h-4" /> },
        { id: 'writing', label: 'Writing', icon: <PencilIcon className="w-4 h-4" /> },
        { id: 'notifications', label: 'Notifications', icon: <BellIcon className="w-4 h-4" /> },
        { id: 'privacy', label: 'Privacy', icon: <ShieldCheckIcon className="w-4 h-4" /> },
        { id: 'api', label: 'API Keys', icon: <UserIcon className="w-4 h-4" /> }
    ] as const;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Settings" maxWidth="4xl">
            <div className="flex h-[600px]">
                {/* Sidebar */}
                <div className="w-1/4 border-r border-slate-700 pr-6">
                    <nav className="space-y-2">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`w-full flex items-center gap-3 px-4 py-2 text-left rounded-lg transition-colors ${
                                    activeTab === tab.id 
                                        ? 'bg-brand-primary text-white' 
                                        : 'text-slate-300 hover:bg-slate-700'
                                }`}
                            >
                                {tab.icon}
                                {tab.label}
                            </button>
                        ))}
                    </nav>
                </div>

                {/* Content */}
                <div className="flex-1 pl-6 overflow-y-auto">
                    {activeTab === 'general' && (
                        <div className="space-y-6">
                            <SettingsSection
                                title="Language & Region"
                                description="Configure your language and regional preferences"
                                icon={<GlobeAltIcon className="w-5 h-5 text-blue-400" />}
                            >
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-2">Language</label>
                                        <Select
                                            value={localSettings.language}
                                            onChange={(e) => updateLocalSetting('language', e.target.value)}
                                        >
                                            {LANGUAGES.map(lang => (
                                                <option key={lang.value} value={lang.value}>{lang.label}</option>
                                            ))}
                                        </Select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-2">Time Format</label>
                                        <Select
                                            value={localSettings.timeFormat}
                                            onChange={(e) => updateLocalSetting('timeFormat', e.target.value as '12h' | '24h')}
                                        >
                                            <option value="12h">12-hour (AM/PM)</option>
                                            <option value="24h">24-hour</option>
                                        </Select>
                                    </div>
                                </div>
                            </SettingsSection>

                            <SettingsSection
                                title="Backup & Sync"
                                description="Configure automatic backups and cloud synchronization"
                                icon={<ArchiveBoxIcon className="w-5 h-5 text-green-400" />}
                            >
                                <ToggleSwitch
                                    checked={localSettings.autoBackup}
                                    onChange={(checked) => updateLocalSetting('autoBackup', checked)}
                                    label="Auto Backup"
                                    description="Automatically backup your work locally"
                                />
                                
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">Backup Frequency</label>
                                    <Select
                                        value={localSettings.backupFrequency}
                                        onChange={(e) => updateLocalSetting('backupFrequency', e.target.value as 'daily' | 'weekly' | 'monthly')}
                                        disabled={!localSettings.autoBackup}
                                    >
                                        <option value="daily">Daily</option>
                                        <option value="weekly">Weekly</option>
                                        <option value="monthly">Monthly</option>
                                    </Select>
                                </div>

                                <ToggleSwitch
                                    checked={localSettings.cloudSync}
                                    onChange={(checked) => updateLocalSetting('cloudSync', checked)}
                                    label="Cloud Sync (Coming Soon)"
                                    description="Sync your work across devices"
                                />
                            </SettingsSection>
                        </div>
                    )}

                    {activeTab === 'appearance' && (
                        <div className="space-y-6">
                            <SettingsSection
                                title="Theme & Colors"
                                description="Customize the visual appearance of BookCraft AI"
                                icon={<PaintBrushIcon className="w-5 h-5 text-purple-400" />}
                            >
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-3">Theme</label>
                                    <div className="grid grid-cols-3 gap-3">
                                        {[
                                            { value: 'light', icon: <SunIcon className="w-4 h-4" />, label: 'Light' },
                                            { value: 'dark', icon: <MoonIcon className="w-4 h-4" />, label: 'Dark' },
                                            { value: 'system', icon: <ComputerDesktopIcon className="w-4 h-4" />, label: 'System' }
                                        ].map(theme => (
                                            <button
                                                key={theme.value}
                                                onClick={() => updateLocalSetting('theme', theme.value as 'light' | 'dark' | 'system')}
                                                className={`p-3 rounded-lg border-2 flex flex-col items-center gap-2 transition-colors ${
                                                    localSettings.theme === theme.value
                                                        ? 'border-brand-primary bg-brand-primary/10'
                                                        : 'border-slate-700 hover:border-slate-600'
                                                }`}
                                            >
                                                {theme.icon}
                                                <span className="text-sm">{theme.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-3">Accent Color</label>
                                    <div className="flex gap-3">
                                        {ACCENT_COLORS.map(color => (
                                            <button
                                                key={color.value}
                                                onClick={() => updateLocalSetting('accentColor', color.value)}
                                                className={`w-8 h-8 rounded-full border-2 transition-all ${
                                                    localSettings.accentColor === color.value
                                                        ? 'border-white scale-110'
                                                        : 'border-slate-600'
                                                }`}
                                                style={{ backgroundColor: color.value }}
                                                title={color.name}
                                            />
                                        ))}
                                    </div>
                                </div>

                                <ToggleSwitch
                                    checked={localSettings.compactMode}
                                    onChange={(checked) => updateLocalSetting('compactMode', checked)}
                                    label="Compact Mode"
                                    description="Reduce spacing and padding for more content"
                                />
                            </SettingsSection>

                            <SettingsSection
                                title="Typography"
                                description="Configure fonts and text appearance"
                                icon={<PencilIcon className="w-5 h-5 text-orange-400" />}
                            >
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-2">Font Size</label>
                                        <Select
                                            value={localSettings.fontSize}
                                            onChange={(e) => updateLocalSetting('fontSize', e.target.value as UserSettings['fontSize'])}
                                        >
                                            {Object.entries(FONT_SIZES).map(([key, font]) => (
                                                <option key={key} value={key}>{font.name}</option>
                                            ))}
                                        </Select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-2">Editor Font</label>
                                        <Select
                                            value={localSettings.editorFont}
                                            onChange={(e) => updateLocalSetting('editorFont', e.target.value as UserSettings['editorFont'])}
                                        >
                                            {Object.entries(EDITOR_FONTS).map(([key, font]) => (
                                                <option key={key} value={key}>{font.name}</option>
                                            ))}
                                        </Select>
                                    </div>
                                </div>

                                <ToggleSwitch
                                    checked={localSettings.showLineNumbers}
                                    onChange={(checked) => updateLocalSetting('showLineNumbers', checked)}
                                    label="Show Line Numbers"
                                    description="Display line numbers in the editor"
                                />
                            </SettingsSection>

                            <SettingsSection
                                title="Accessibility"
                                description="Options to improve accessibility and usability"
                                icon={<EyeIcon className="w-5 h-5 text-green-400" />}
                            >
                                <ToggleSwitch
                                    checked={localSettings.highContrast}
                                    onChange={(checked) => updateLocalSetting('highContrast', checked)}
                                    label="High Contrast"
                                    description="Increase contrast for better visibility"
                                />

                                <ToggleSwitch
                                    checked={localSettings.reducedMotion}
                                    onChange={(checked) => updateLocalSetting('reducedMotion', checked)}
                                    label="Reduced Motion"
                                    description="Minimize animations and transitions"
                                />

                                <ToggleSwitch
                                    checked={localSettings.largeButtons}
                                    onChange={(checked) => updateLocalSetting('largeButtons', checked)}
                                    label="Large Buttons"
                                    description="Use larger, more accessible buttons"
                                />
                            </SettingsSection>
                        </div>
                    )}

                    {activeTab === 'writing' && (
                        <div className="space-y-6">
                            <SettingsSection
                                title="Writing Preferences"
                                description="Configure your writing environment and tools"
                                icon={<PencilIcon className="w-5 h-5 text-blue-400" />}
                            >
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-2">Default Genre</label>
                                        <Select
                                            value={localSettings.defaultGenre}
                                            onChange={(e) => updateLocalSetting('defaultGenre', e.target.value)}
                                        >
                                            <option value="Fiction">Fiction</option>
                                            <option value="Non-Fiction">Non-Fiction</option>
                                            <option value="SciFi">Science Fiction</option>
                                            <option value="Fantasy">Fantasy</option>
                                            <option value="Romance">Romance</option>
                                            <option value="Mystery">Mystery</option>
                                            <option value="Thriller">Thriller</option>
                                            <option value="Biography">Biography</option>
                                            <option value="Academic">Academic</option>
                                        </Select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-2">Writing Mode</label>
                                        <Select
                                            value={localSettings.writingMode}
                                            onChange={(e) => updateLocalSetting('writingMode', e.target.value as UserSettings['writingMode'])}
                                        >
                                            <option value="standard">Standard</option>
                                            <option value="distraction-free">Distraction Free</option>
                                            <option value="split-screen">Split Screen</option>
                                        </Select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">Daily Word Goal</label>
                                    <Input
                                        type="number"
                                        value={localSettings.dailyWordGoal}
                                        onChange={(e) => updateLocalSetting('dailyWordGoal', parseInt(e.target.value) || 0)}
                                        min="0"
                                        step="100"
                                    />
                                    <p className="text-xs text-slate-500 mt-1">Set 0 to disable daily goals</p>
                                </div>

                                <ToggleSwitch
                                    checked={localSettings.showWordCount}
                                    onChange={(checked) => updateLocalSetting('showWordCount', checked)}
                                    label="Show Word Count"
                                    description="Display word count in the editor"
                                />

                                <ToggleSwitch
                                    checked={localSettings.showWritingStats}
                                    onChange={(checked) => updateLocalSetting('showWritingStats', checked)}
                                    label="Show Writing Statistics"
                                    description="Display detailed writing analytics"
                                />
                            </SettingsSection>

                            <SettingsSection
                                title="Auto-Save & Backup"
                                description="Configure automatic saving and document backup"
                                icon={<ClockIcon className="w-5 h-5 text-green-400" />}
                            >
                                <ToggleSwitch
                                    checked={localSettings.autoSave}
                                    onChange={(checked) => updateLocalSetting('autoSave', checked)}
                                    label="Auto-Save"
                                    description="Automatically save your work while writing"
                                />

                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">Auto-Save Interval (seconds)</label>
                                    <Input
                                        type="number"
                                        value={localSettings.autoSaveInterval}
                                        onChange={(e) => updateLocalSetting('autoSaveInterval', parseInt(e.target.value) || 30)}
                                        min="10"
                                        max="300"
                                        step="5"
                                        disabled={!localSettings.autoSave}
                                    />
                                </div>
                            </SettingsSection>

                            <SettingsSection
                                title="Writing Assistance"
                                description="Configure spell check and grammar assistance"
                                icon={<BookmarkIcon className="w-5 h-5 text-purple-400" />}
                            >
                                <ToggleSwitch
                                    checked={localSettings.spellCheck}
                                    onChange={(checked) => updateLocalSetting('spellCheck', checked)}
                                    label="Spell Check"
                                    description="Enable spell checking while writing"
                                />

                                <ToggleSwitch
                                    checked={localSettings.grammarCheck}
                                    onChange={(checked) => updateLocalSetting('grammarCheck', checked)}
                                    label="Grammar Check (Coming Soon)"
                                    description="Enable grammar and style suggestions"
                                />
                            </SettingsSection>
                        </div>
                    )}

                    {activeTab === 'notifications' && (
                        <div className="space-y-6">
                            <SettingsSection
                                title="Notification Settings"
                                description="Control when and how you receive notifications"
                                icon={<BellIcon className="w-5 h-5 text-yellow-400" />}
                            >
                                <ToggleSwitch
                                    checked={localSettings.enableNotifications}
                                    onChange={(checked) => updateLocalSetting('enableNotifications', checked)}
                                    label="Enable Notifications"
                                    description="Allow BookCraft AI to send you notifications"
                                />

                                <ToggleSwitch
                                    checked={localSettings.dailyReminders}
                                    onChange={(checked) => updateLocalSetting('dailyReminders', checked)}
                                    label="Daily Writing Reminders"
                                    description="Get reminded to write every day"
                                />

                                <ToggleSwitch
                                    checked={localSettings.goalReminders}
                                    onChange={(checked) => updateLocalSetting('goalReminders', checked)}
                                    label="Goal Reminders"
                                    description="Get notified about upcoming deadlines"
                                />

                                <ToggleSwitch
                                    checked={localSettings.achievementNotifications}
                                    onChange={(checked) => updateLocalSetting('achievementNotifications', checked)}
                                    label="Achievement Notifications"
                                    description="Celebrate milestones and achievements"
                                />
                            </SettingsSection>
                        </div>
                    )}

                    {activeTab === 'privacy' && (
                        <div className="space-y-6">
                            <SettingsSection
                                title="Data & Privacy"
                                description="Control how your data is handled and stored"
                                icon={<ShieldCheckIcon className="w-5 h-5 text-red-400" />}
                            >
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">Data Retention</label>
                                    <Select
                                        value={localSettings.dataRetention}
                                        onChange={(e) => updateLocalSetting('dataRetention', e.target.value as UserSettings['dataRetention'])}
                                    >
                                        <option value="30-days">30 Days</option>
                                        <option value="90-days">90 Days</option>
                                        <option value="1-year">1 Year</option>
                                        <option value="forever">Forever</option>
                                    </Select>
                                    <p className="text-xs text-slate-500 mt-1">How long to keep your writing history and analytics</p>
                                </div>

                                <ToggleSwitch
                                    checked={localSettings.crashReporting}
                                    onChange={(checked) => updateLocalSetting('crashReporting', checked)}
                                    label="Crash Reporting"
                                    description="Help improve BookCraft AI by reporting crashes"
                                />

                                <ToggleSwitch
                                    checked={localSettings.usageAnalytics}
                                    onChange={(checked) => updateLocalSetting('usageAnalytics', checked)}
                                    label="Usage Analytics"
                                    description="Share anonymous usage data to improve the app"
                                />
                            </SettingsSection>
                        </div>
                    )}

                    {activeTab === 'api' && (
                        <div className="space-y-6">
                            <SettingsSection
                                title="API Configuration"
                                description="Configure your API keys for AI services"
                                icon={<UserIcon className="w-5 h-5 text-cyan-400" />}
                            >
                                <form onSubmit={(e) => e.preventDefault()}>
                                    <div>
                                        <label htmlFor="openrouter-api-key" className="block text-sm font-medium text-slate-300 mb-2">OpenRouter API Key</label>
                                        <div className="relative">
                                            <Input
                                                id="openrouter-api-key"
                                                name="openrouter-api-key"
                                                type={showApiKeys.openRouter ? "text" : "password"}
                                                value={localSettings.openRouterApiKey || ''}
                                                onChange={(e) => updateLocalSetting('openRouterApiKey', e.target.value)}
                                                placeholder="sk-or-v1-..."
                                                autoComplete="off"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowApiKeys(prev => ({ ...prev, openRouter: !prev.openRouter }))}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                                            >
                                                {showApiKeys.openRouter ? <EyeSlashIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                                            </button>
                                        </div>
                                    </div>

                                    <div className="mt-4">
                                        <label htmlFor="gemini-api-key" className="block text-sm font-medium text-slate-300 mb-2">Gemini API Key</label>
                                        <div className="relative">
                                            <Input
                                                id="gemini-api-key"
                                                name="gemini-api-key"
                                                type={showApiKeys.gemini ? "text" : "password"}
                                                value={localSettings.geminiApiKey || ''}
                                                onChange={(e) => updateLocalSetting('geminiApiKey', e.target.value)}
                                                placeholder="AIza..."
                                                autoComplete="off"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowApiKeys(prev => ({ ...prev, gemini: !prev.gemini }))}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                                            >
                                                {showApiKeys.gemini ? <EyeSlashIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                                            </button>
                                        </div>
                                    </div>
                                </form>

                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">Default AI Model</label>
                                    <Select
                                        value={localSettings.defaultModel || 'nvidia/nemotron-nano-9b-v2:free'}
                                        onChange={(e) => updateLocalSetting('defaultModel', e.target.value)}
                                    >
                                        <option value="nvidia/nemotron-nano-9b-v2:free">Nemotron Nano 9B (Free)</option>
                                        <option value="anthropic/claude-3.5-sonnet">Claude 3.5 Sonnet</option>
                                        <option value="anthropic/claude-3-haiku">Claude 3 Haiku</option>
                                        <option value="openai/gpt-4o">GPT-4o</option>
                                        <option value="openai/gpt-4o-mini">GPT-4o Mini</option>
                                        <option value="meta-llama/llama-3.1-70b-instruct">Llama 3.1 70B</option>
                                    </Select>
                                </div>
                            </SettingsSection>
                        </div>
                    )}
                </div>
            </div>

            {/* Footer */}
            <div className="flex justify-between pt-6 border-t border-slate-700 mt-6">
                <Button variant="outline" onClick={handleReset}>
                    Reset to Defaults
                </Button>
                <div className="flex gap-3">
                    <Button variant="outline" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button onClick={handleSave}>
                        Save Settings
                    </Button>
                </div>
            </div>
        </Modal>
    );
};