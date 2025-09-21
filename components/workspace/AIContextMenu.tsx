import React, { useState, useRef, useEffect } from 'react';
import { useBookCraftStore } from '../../store/useStore';
import { Spinner } from '../UI';
import { SparklesIcon, PhotoIcon } from '../Icons';

interface AIContextMenuProps {
    x: number;
    y: number;
    selectedText: string;
    onClose: () => void;
    onApply: (newText: string) => void;
    onSuggestVisual: () => void;
}

const CONTEXT_MENU_WIDTH = 180;

export const AIContextMenu: React.FC<AIContextMenuProps> = ({ x, y, selectedText, onClose, onApply, onSuggestVisual }) => {
    const getAIContextMenuResponse = useBookCraftStore(state => state.getAIContextMenuResponse);
    const isSuggestingVisual = useBookCraftStore(state => state.isSuggestingVisual);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [customPrompt, setCustomPrompt] = useState('');
    const menuRef = useRef<HTMLDivElement>(null);

    const handleAction = async (action: string) => {
        if (!action.trim()) return;
        setIsLoading(true);
        setError(null);
        try {
            const newText = await getAIContextMenuResponse(selectedText, action);
            onApply(newText);
        } catch (e: any) {
            setError(e.message || "An error occurred.");
            setTimeout(() => { 
                onClose();
            }, 3000);
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleSuggestVisual = () => {
        onSuggestVisual();
        // The store action will handle loading state and alerts
        onClose();
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                onClose();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [onClose]);
    
    const top = y + 10;
    const left = Math.min(x, window.innerWidth - CONTEXT_MENU_WIDTH - 20);

    const textActions = ["Rephrase", "Expand", "Summarize", "Fix Grammar"];

    const totalIsLoading = isLoading || isSuggestingVisual;

    return (
        <div
            ref={menuRef}
            className="absolute z-50 bg-slate-900 border border-slate-700 rounded-md shadow-2xl p-2 animate-fade-in-fast"
            style={{ top: `${top}px`, left: `${left}px`, width: `${CONTEXT_MENU_WIDTH}px` }}
            onClick={(e) => e.stopPropagation()}
        >
            {totalIsLoading ? (
                <div className="flex flex-col justify-center items-center p-4">
                    <Spinner size="sm" />
                    <span className="text-xs text-slate-400 mt-2">{isSuggestingVisual ? 'Creating visual...' : 'Thinking...'}</span>
                </div>
            ) : error ? (
                 <div className="p-2 text-center text-red-400 text-sm">
                    {error}
                </div>
            ) : (
                <>
                    <div className="flex flex-col space-y-1">
                        {textActions.map(action => (
                             <button
                                key={action}
                                onClick={() => handleAction(action)}
                                className="w-full text-left px-3 py-1.5 text-sm text-slate-200 hover:bg-slate-700 hover:text-white rounded-md transition-colors"
                            >
                                {action}
                            </button>
                        ))}
                        <button
                            onClick={handleSuggestVisual}
                            className="w-full text-left px-3 py-1.5 text-sm text-slate-200 hover:bg-slate-700 hover:text-white rounded-md transition-colors flex items-center gap-2"
                        >
                            <SparklesIcon className="w-4 h-4 text-yellow-400" /> Suggest Visual
                        </button>
                    </div>
                    <hr className="my-2 border-slate-700/50"/>
                    <div className="space-y-2">
                        <input
                            type="text"
                            placeholder="Custom instruction..."
                            value={customPrompt}
                            onChange={(e) => setCustomPrompt(e.target.value)}
                            onKeyDown={(e) => { if(e.key === 'Enter') handleAction(customPrompt)}}
                            className="w-full bg-slate-800 text-sm text-slate-200 border-slate-700 rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary p-1.5"
                        />
                        <button
                            onClick={() => handleAction(customPrompt)}
                            disabled={!customPrompt.trim()}
                            className="w-full text-center px-3 py-1.5 text-sm text-white bg-brand-primary hover:bg-brand-primary/90 rounded-md transition-colors disabled:opacity-50"
                        >
                            Go
                        </button>
                    </div>
                </>
            )}
        </div>
    );
};