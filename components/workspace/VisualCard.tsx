
import React, { useEffect, useState } from 'react';
// FIX: Corrected import path for types.
import type { Visual } from '../../types';
import { Card, Spinner, Button } from '../UI';
import { VisualIcon } from './VisualIcon';
import { log } from '../../services/logger';
import { PhotoIcon, RefreshCwIcon } from '../Icons';
import { useBookCraftStore } from '../../store/useStore';

import mermaid from 'mermaid';

interface VisualCardProps {
    visual: Visual;
}

export const VisualCard: React.FC<VisualCardProps> = ({ visual }) => {
    const [svgContent, setSvgContent] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isGeneratingImage, setIsGeneratingImage] = useState(false);
    const [showImageFallback, setShowImageFallback] = useState(false);
    
    const generateImage = useBookCraftStore(state => state.generateImage);

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
                    console.error('Mermaid render error:', e);
                    if (isMounted) {
                        setError("Could not render diagram. Please check syntax.");
                        setShowImageFallback(true);
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
    
    const handleRetryRender = () => {
        setError(null);
        setSvgContent(null);
        setShowImageFallback(false);
        // Re-trigger the useEffect by forcing a re-render
        const renderDiagram = async () => {
            if (visual.content.mermaidCode) {
                try {
                    // Clear any previous Mermaid state
                    mermaid.initialize({
                        startOnLoad: false,
                        theme: 'dark',
                        securityLevel: 'loose',
                        themeVariables: {
                            darkMode: true,
                            background: '#1e293b',
                            primaryColor: '#3b82f6',
                            primaryTextColor: '#e2e8f0',
                            primaryBorderColor: '#475569',
                            lineColor: '#64748b',
                            secondaryColor: '#475569',
                            tertiaryColor: '#334155'
                        }
                    });
                    
                    const { svg } = await mermaid.render(`mermaid-svg-retry-${visual.id}-${Date.now()}`, visual.content.mermaidCode);
                    setSvgContent(svg);
                    setError(null);
                } catch (e: any) {
                    console.error('Mermaid retry failed:', e);
                    setError("Diagram syntax appears to be invalid.");
                    setShowImageFallback(true);
                }
            }
        };
        renderDiagram();
    };
    
    const handleGenerateImage = async () => {
        setIsGeneratingImage(true);
        try {
            // Create a descriptive prompt based on the visual type and any available content
            const prompt = `Create a ${visual.type.toLowerCase()} diagram or chart. ${visual.content.mermaidCode ? 'Based on this structure: ' + visual.content.mermaidCode.substring(0, 200) : 'Professional business/technical style.'} Dark theme, clean design.`;
            await generateImage(prompt);
        } catch (error) {
            log.error('Failed to generate image', error as Error, 'VisualCard');
            alert('Failed to generate image. Please try again.');
        } finally {
            setIsGeneratingImage(false);
        }
    };

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
                    {error && (
                        <div className="text-center p-4">
                            <p className="text-sm text-red-400 mb-3">{error}</p>
                            {showImageFallback && (
                                <div className="space-y-2">
                                    <p className="text-xs text-slate-400 mb-2">Try one of these options:</p>
                                    <div className="flex justify-center gap-2">
                                        <Button size="sm" variant="secondary" onClick={handleRetryRender}>
                                            <RefreshCwIcon className="w-4 h-4 mr-1" />
                                            Retry Render
                                        </Button>
                                        <Button 
                                            size="sm" 
                                            variant="secondary" 
                                            onClick={handleGenerateImage} 
                                            isLoading={isGeneratingImage}
                                        >
                                            <PhotoIcon className="w-4 h-4 mr-1" />
                                            Generate Image
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
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
