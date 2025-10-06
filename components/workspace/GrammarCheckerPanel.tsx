import React from 'react';

interface GrammarCheckerPanelProps {
    text: string;
    onTextCorrection: (originalText: string, correctedText: string, startOffset: number, endOffset: number) => void;
    className?: string;
}

/**
 * Grammar Checker Panel - Placeholder component
 * TODO: Integrate with a grammar checking service (e.g., LanguageTool, Grammarly API)
 */
export const GrammarCheckerPanel: React.FC<GrammarCheckerPanelProps> = ({ text, onTextCorrection, className = '' }) => {
    return (
        <div className={`bg-gray-100/50 border border-gray-300/50 rounded-lg p-4 flex flex-col ${className}`}>
            <h3 className="text-gray-800 font-bold mb-3">Grammar Checker</h3>
            <div className="flex-grow overflow-y-auto text-sm text-gray-600">
                <div className="text-center py-8">
                    <p className="text-gray-500 italic mb-2">Grammar checking feature coming soon!</p>
                    <p className="text-xs text-slate-600">
                        This will integrate with grammar checking services to help improve your writing.
                    </p>
                </div>
            </div>
        </div>
    );
};