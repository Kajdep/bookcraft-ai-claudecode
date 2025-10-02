import React, { useState } from 'react';
import { Button } from '../UI';
import { grammarService } from '../../services/grammarService';
import { log } from '../../services/logger';

interface GrammarCheckerPanelProps {
    text: string;
    onTextCorrection?: (correctedText: string) => void;
    className?: string;
}

export const GrammarCheckerPanel: React.FC<GrammarCheckerPanelProps> = ({ 
    text, 
    onTextCorrection,
    className = '' 
}) => {
    const [isChecking, setIsChecking] = useState(false);
    const [suggestions, setSuggestions] = useState<Array<{ message: string; replacements: string[] }>>([]);

    const handleCheck = async () => {
        setIsChecking(true);
        try {
            const result = await grammarService.checkGrammar(text);
            setSuggestions(result.issues.map(issue => ({
                message: issue.message,
                replacements: issue.replacements || []
            })));
        } catch (error) {
            log.error('Grammar check failed', error as Error, 'GrammarCheckerPanel');
            setSuggestions([]);
        } finally {
            setIsChecking(false);
        }
    };

    return (
        <div className={`bg-slate-800/50 border border-slate-700/50 rounded-lg p-4 flex flex-col ${className}`}>
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-slate-200 font-bold">Grammar Check</h3>
                <Button 
                    size="sm" 
                    variant="primary"
                    onClick={handleCheck}
                    disabled={isChecking || !text}
                >
                    {isChecking ? 'Checking...' : 'Check'}
                </Button>
            </div>
            <div className="overflow-y-auto text-sm text-slate-400 space-y-2 flex-grow">
                {suggestions.length > 0 ? (
                    suggestions.map((suggestion, index) => (
                        <div key={index} className="p-2 bg-slate-700/30 rounded">
                            <p className="text-xs mb-1 text-slate-300">{suggestion.message}</p>
                            {suggestion.replacements && suggestion.replacements.length > 0 && (
                                <div className="flex gap-2 flex-wrap mt-2">
                                    {suggestion.replacements.slice(0, 3).map((replacement, rIdx) => (
                                        <button
                                            key={rIdx}
                                            onClick={() => onTextCorrection?.(replacement)}
                                            className="text-xs px-2 py-1 bg-brand-primary/20 hover:bg-brand-primary/30 text-brand-primary rounded transition-colors"
                                        >
                                            {replacement}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))
                ) : (
                    <p className="text-xs text-slate-500 text-center py-4">
                        {isChecking ? 'Checking grammar...' : 'Click "Check" to analyze grammar'}
                    </p>
                )}
            </div>
        </div>
    );
};
