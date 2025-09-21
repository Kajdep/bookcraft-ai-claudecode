
import React, { useEffect, useState } from 'react';
// FIX: Corrected import path for types.
import type { Visual } from '../../types';
import { Card, Spinner } from '../UI';
import { VisualIcon } from './VisualIcon';
import { log } from '../../services/logger';

import mermaid from 'mermaid';

interface VisualCardProps {
    visual: Visual;
}

export const VisualCard: React.FC<VisualCardProps> = ({ visual }) => {
    const [svgContent, setSvgContent] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let isMounted = true;
        const renderDiagram = async () => {
            if (visual.content.mermaidCode) {
                try {
                    // Initialize Mermaid with dark theme
                    mermaid.initialize({
                        startOnLoad: false,
                        theme: 'dark',
                        securityLevel: 'loose'
                    });

                    const { svg } = await mermaid.render(`mermaid-svg-${visual.id}`, visual.content.mermaidCode);
                    if (isMounted) {
                        setSvgContent(svg);
                        setError(null);
                    }
                } catch (e: any) {
                    log.error('Mermaid diagram render failed', e as Error, 'Visual');
                    if (isMounted) {
                        setError("Could not render diagram. Please check syntax.");
                    }
                }
            } else {
                if (isMounted) {
                    setError("No content to render.");
                }
            }
        };

        renderDiagram();
        
        return () => {
            isMounted = false;
        };
    }, [visual.content.mermaidCode, visual.id]);

    return (
        <Card className="transition-shadow hover:shadow-green-500/10">
            <div className="p-5">
                 <div className="flex items-center space-x-3 mb-3">
                    <div className="flex-shrink-0 bg-slate-700/50 p-2 rounded-full">
                        <VisualIcon type={visual.type} className="h-6 w-6 text-green-400" />
                    </div>
                    <div>
                        <h4 className="font-bold text-lg text-slate-100">{visual.type}</h4>
                        <p className="text-sm text-slate-400">On page {visual.pageNumber}.</p>
                    </div>
                </div>
                <div className="mt-4 p-3 bg-slate-900/70 rounded-lg min-h-[10rem] flex items-center justify-center overflow-auto border border-slate-700">
                    {error && <p className="text-sm text-red-400 p-4 text-center">{error}</p>}
                    {!svgContent && !error && <Spinner />}
                    {svgContent && !error && (
                         <div
                            className="w-full h-full flex items-center justify-center [&>svg]:max-w-full [&>svg]:max-h-full"
                            dangerouslySetInnerHTML={{ __html: svgContent }} 
                         />
                    )}
                </div>
            </div>
        </Card>
    );
};
