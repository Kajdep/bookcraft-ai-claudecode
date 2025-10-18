import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '../UI';
import { CheckIcon, XMarkIcon, SparklesIcon } from '../Icons';
import { log } from '../../services/logger';
import { checkGrammar, GrammarError as ApiGrammarError } from '../../services/grammarCheck';

interface GrammarError {
    id: string;
    type: 'grammar' | 'spelling' | 'punctuation' | 'style' | 'clarity';
    originalText: string;
    suggestion: string;
    explanation: string;
    startOffset: number;
    endOffset: number;
    severity: 'error' | 'warning' | 'suggestion';
}

interface GrammarCheckerPanelProps {
    text: string;
    onTextCorrection: (originalText: string, correctedText: string, start: number, end: number) => void;
    className?: string;
}

/**
 * Grammar Checker Panel - AI-powered grammar and style checking
 */
export const GrammarCheckerPanel: React.FC<GrammarCheckerPanelProps> = ({ text, onTextCorrection, className = '' }) => {
    const [errors, setErrors] = useState<GrammarError[]>([]);
    const [isChecking, setIsChecking] = useState(false);
    const [hasChecked, setHasChecked] = useState(false);
    const [appliedCorrections, setAppliedCorrections] = useState<Set<string>>(new Set());
    const [filterType, setFilterType] = useState<'all' | GrammarError['type']>('all');

    // Clean text for analysis (remove HTML tags)
    const cleanText = useMemo(() => {
        return text.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    }, [text]);

    // Auto-check when text changes (debounced)
    useEffect(() => {
        if (!cleanText || cleanText.length < 50) {
            setErrors([]);
            setHasChecked(false);
            return;
        }

        // Don't auto-check, wait for manual trigger
        // This prevents excessive API calls
    }, [cleanText]);

    const handleCheck = async () => {
        if (!cleanText || cleanText.length < 50) {
            log.warn('Text too short for grammar check', { length: cleanText.length });
            return;
        }

        setIsChecking(true);
        setHasChecked(false);
        
        try {
            log.info('Starting grammar check', { textLength: cleanText.length });
            const detectedErrors = await checkGrammar(cleanText);

            const mappedErrors: GrammarError[] = detectedErrors.map((e, index) => ({
                id: `${e.rule.id}-${e.offset}-${index}`,
                type: e.rule.category.id.includes('SPELLING') ? 'spelling' : 'grammar',
                originalText: cleanText.substring(e.offset, e.offset + e.length),
                suggestion: e.replacements[0]?.value || '',
                explanation: e.message,
                startOffset: e.offset,
                endOffset: e.offset + e.length,
                severity: e.rule.issueType === 'typographical' ? 'error' : 'suggestion',
            }));

            setErrors(mappedErrors);
            setHasChecked(true);
            log.info('Grammar check complete', { errorsFound: mappedErrors.length });
        } catch (error) {
            log.error('Grammar check failed', error as Error, 'GrammarChecker');
            setErrors([]);
            setHasChecked(false);
        } finally {
            setIsChecking(false);
        }
    };

    const handleApplyCorrection = (error: GrammarError) => {
        onTextCorrection(error.originalText, error.suggestion, error.startOffset, error.endOffset);
        setAppliedCorrections(prev => new Set(prev).add(error.id));
        log.debug('Applied grammar correction', { 
            type: error.type, 
            original: error.originalText, 
            suggestion: error.suggestion 
        });
    };

    const handleDismiss = (errorId: string) => {
        setErrors(prev => prev.filter(e => e.id !== errorId));
    };

    const handleFixAll = () => {
        // Apply all corrections in sequence
        filteredErrors.forEach(error => {
            if (!appliedCorrections.has(error.id)) {
                handleApplyCorrection(error);
            }
        });
        log.info('Applied all grammar corrections', { count: filteredErrors.length });
    };

    // Filter errors by type
    const filteredErrors = useMemo(() => {
        if (filterType === 'all') return errors;
        return errors.filter(e => e.type === filterType);
    }, [errors, filterType]);

    // Stats
    const stats = useMemo(() => {
        return {
            total: errors.length,
            grammar: errors.filter(e => e.type === 'grammar').length,
            spelling: errors.filter(e => e.type === 'spelling').length,
            punctuation: errors.filter(e => e.type === 'punctuation').length,
            style: errors.filter(e => e.type === 'style').length,
            clarity: errors.filter(e => e.type === 'clarity').length,
        };
    }, [errors]);

    const getSeverityColor = (severity: GrammarError['severity']) => {
        switch (severity) {
            case 'error': return 'text-red-600 bg-red-50';
            case 'warning': return 'text-yellow-600 bg-yellow-50';
            case 'suggestion': return 'text-blue-600 bg-blue-50';
        }
    };

    const getTypeLabel = (type: GrammarError['type']) => {
        switch (type) {
            case 'grammar': return '📝 Grammar';
            case 'spelling': return '✏️ Spelling';
            case 'punctuation': return '❗ Punctuation';
            case 'style': return '🎨 Style';
            case 'clarity': return '💡 Clarity';
        }
    };

    return (
        <div className={`bg-gray-100/50 border border-gray-300/50 rounded-lg p-4 flex flex-col ${className}`}>
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-gray-800 font-bold">Grammar Checker</h3>
                <div className="flex gap-2">
                    {hasChecked && filteredErrors.length > 0 && (
                        <Button
                            size="sm"
                            variant="primary"
                            onClick={handleFixAll}
                        >
                            🔧 Fix All
                        </Button>
                    )}
                    <Button
                        size="sm"
                        onClick={handleCheck}
                        isLoading={isChecking}
                        disabled={!cleanText || cleanText.length < 50}
                    >
                        <SparklesIcon className="w-4 h-4 mr-1" />
                        {isChecking ? 'Checking...' : hasChecked ? 'Re-check' : 'Check Grammar'}
                    </Button>
                </div>
            </div>

            {/* Stats */}
            {hasChecked && errors.length > 0 && (
                <div className="mb-3 p-2 bg-white/50 rounded text-xs space-y-1">
                    <div className="flex items-center justify-between">
                        <span className="font-semibold text-gray-700">Issues Found:</span>
                        <span className="font-bold text-gray-900">{stats.total}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-1 text-gray-600">
                        {stats.grammar > 0 && <div>Grammar: {stats.grammar}</div>}
                        {stats.spelling > 0 && <div>Spelling: {stats.spelling}</div>}
                        {stats.punctuation > 0 && <div>Punctuation: {stats.punctuation}</div>}
                        {stats.style > 0 && <div>Style: {stats.style}</div>}
                        {stats.clarity > 0 && <div>Clarity: {stats.clarity}</div>}
                    </div>
                </div>
            )}

            {/* Filters */}
            {hasChecked && errors.length > 0 && (
                <div className="mb-2 flex gap-1 flex-wrap">
                    <button
                        onClick={() => setFilterType('all')}
                        className={`px-2 py-1 text-xs rounded transition-colors ${
                            filterType === 'all' 
                                ? 'bg-blue-600 text-white' 
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                    >
                        All ({stats.total})
                    </button>
                    {stats.grammar > 0 && (
                        <button
                            onClick={() => setFilterType('grammar')}
                            className={`px-2 py-1 text-xs rounded transition-colors ${
                                filterType === 'grammar' 
                                    ? 'bg-blue-600 text-white' 
                                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            }`}
                        >
                            Grammar ({stats.grammar})
                        </button>
                    )}
                    {stats.spelling > 0 && (
                        <button
                            onClick={() => setFilterType('spelling')}
                            className={`px-2 py-1 text-xs rounded transition-colors ${
                                filterType === 'spelling' 
                                    ? 'bg-blue-600 text-white' 
                                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            }`}
                        >
                            Spelling ({stats.spelling})
                        </button>
                    )}
                </div>
            )}

            {/* Results */}
            <div className="flex-grow overflow-y-auto text-sm space-y-2">
                {!hasChecked && !isChecking && (
                    <div className="text-center py-8">
                        <p className="text-gray-500 italic mb-2">Click "Check Grammar" to analyze your text</p>
                        <p className="text-xs text-gray-600">
                            AI-powered grammar, spelling, and style checking
                        </p>
                    </div>
                )}

                {isChecking && (
                    <div className="text-center py-8">
                        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-2"></div>
                        <p className="text-gray-600">Analyzing your text...</p>
                    </div>
                )}

                {hasChecked && errors.length === 0 && (
                    <div className="text-center py-8">
                        <CheckIcon className="w-12 h-12 text-green-500 mx-auto mb-2" />
                        <p className="text-gray-700 font-semibold">No issues found!</p>
                        <p className="text-xs text-gray-600 mt-1">
                            Your text looks great.
                        </p>
                    </div>
                )}

                {hasChecked && filteredErrors.length > 0 && filteredErrors.map(error => (
                    <div 
                        key={error.id} 
                        className={`p-3 rounded border-l-4 ${
                            appliedCorrections.has(error.id) 
                                ? 'bg-green-50 border-green-500 opacity-60' 
                                : `${getSeverityColor(error.severity)} border-current`
                        }`}
                    >
                        <div className="flex items-start justify-between mb-2">
                            <div className="flex-grow">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-xs font-semibold">
                                        {getTypeLabel(error.type)}
                                    </span>
                                    <span className={`text-xs px-1.5 py-0.5 rounded ${
                                        error.severity === 'error' ? 'bg-red-100 text-red-700' :
                                        error.severity === 'warning' ? 'bg-yellow-100 text-yellow-700' :
                                        'bg-blue-100 text-blue-700'
                                    }`}>
                                        {error.severity}
                                    </span>
                                </div>
                                <p className="text-xs text-gray-700 mb-1">{error.explanation}</p>
                            </div>
                            <button
                                onClick={() => handleDismiss(error.id)}
                                className="text-gray-400 hover:text-gray-600 transition-colors"
                                title="Dismiss"
                            >
                                <XMarkIcon className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="space-y-1 text-xs">
                            <div className="bg-white/50 p-2 rounded">
                                <span className="font-semibold text-gray-600">Original: </span>
                                <span className="text-gray-800 line-through">{error.originalText}</span>
                            </div>
                            <div className="bg-white/70 p-2 rounded">
                                <span className="font-semibold text-gray-600">Suggestion: </span>
                                <span className="text-gray-900 font-medium">{error.suggestion}</span>
                            </div>
                        </div>

                        {!appliedCorrections.has(error.id) && (
                            <Button
                                size="sm"
                                variant="primary"
                                onClick={() => handleApplyCorrection(error)}
                                className="mt-2 w-full"
                            >
                                <CheckIcon className="w-3 h-3 mr-1" />
                                Apply Correction
                            </Button>
                        )}
                        {appliedCorrections.has(error.id) && (
                            <div className="mt-2 text-center text-xs text-green-600 font-semibold">
                                ✓ Applied
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};
