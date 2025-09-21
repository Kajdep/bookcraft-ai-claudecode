import React, { useState, useEffect } from 'react';
import { Modal, Button, Input, Select } from './UI';
import { useBookCraftStore } from '../store/useStore';
import { Save, Eye, EyeOff, RotateCcw } from 'lucide-react';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
    const { settings, updateSettings } = useBookCraftStore();

    // Local form state
    const [openRouterApiKey, setOpenRouterApiKey] = useState(settings?.openRouterApiKey || '');
    const [openRouterEndpoint, setOpenRouterEndpoint] = useState(settings?.openRouterEndpoint || 'https://openrouter.ai/api/v1');
    const [defaultModel, setDefaultModel] = useState(settings?.defaultModel || 'nvidia/nemotron-nano-9b-v2:free');
    const [geminiApiKey, setGeminiApiKey] = useState(settings?.geminiApiKey || '');
    const [geminiEndpoint, setGeminiEndpoint] = useState(settings?.geminiEndpoint || 'https://generativelanguage.googleapis.com');

    // Show/hide password states
    const [showOpenRouterKey, setShowOpenRouterKey] = useState(false);
    const [showGeminiKey, setShowGeminiKey] = useState(false);

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
        }
    }, [isOpen, settings]);

    const handleSave = () => {
        updateSettings({
            openRouterApiKey,
            openRouterEndpoint,
            defaultModel,
            geminiApiKey,
            geminiEndpoint,
        });
        onClose();
    };

    const handleReset = () => {
        setOpenRouterApiKey('');
        setOpenRouterEndpoint('https://openrouter.ai/api/v1');
        setDefaultModel('nvidia/nemotron-nano-9b-v2:free');
        setGeminiApiKey('');
        setGeminiEndpoint('https://generativelanguage.googleapis.com');
    };

    const isFormValid = openRouterApiKey.trim() && geminiApiKey.trim();

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Settings">
            <div className="space-y-6">
                <div>
                    <h3 className="text-lg font-semibold text-slate-100 mb-4">API Configuration</h3>
                    <p className="text-sm text-slate-400 mb-6">
                        Configure your own API keys and endpoints for AI services. This gives you full control over costs and usage.
                    </p>
                </div>

                {/* OpenRouter Configuration */}
                <div className="space-y-4">
                    <h4 className="text-md font-medium text-slate-200">OpenRouter (Text Generation)</h4>

                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
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
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                            >
                                {showOpenRouterKey ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                            Get your API key from <a href="https://openrouter.ai/keys" target="_blank" rel="noopener noreferrer" className="text-brand-primary hover:underline">OpenRouter</a>
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Endpoint URL
                        </label>
                        <Input
                            type="text"
                            value={openRouterEndpoint}
                            onChange={(e) => setOpenRouterEndpoint(e.target.value)}
                            placeholder="https://openrouter.ai/api/v1"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            AI Model
                        </label>
                        <Select
                            value={defaultModel}
                            onChange={setDefaultModel}
                            options={openRouterModels}
                            placeholder="Select a model..."
                        />
                        <p className="text-xs text-slate-500 mt-1">
                            Choose the AI model for text generation. Free models are marked accordingly.
                        </p>
                    </div>
                </div>

                {/* Gemini Configuration */}
                <div className="space-y-4">
                    <h4 className="text-md font-medium text-slate-200">Google Gemini (Image Generation)</h4>

                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
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
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                            >
                                {showGeminiKey ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                            Get your API key from <a href="https://makersuite.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-brand-primary hover:underline">Google AI Studio</a>
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
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

                <div className="border-t border-slate-700 pt-6">
                    <div className="flex justify-between">
                        <Button
                            variant="secondary"
                            onClick={handleReset}
                        >
                            <RotateCcw size={16} className="mr-2" />
                            Reset to Defaults
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
                </div>
            </div>
        </Modal>
    );
};