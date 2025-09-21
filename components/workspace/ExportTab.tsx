
import React, { useState } from 'react';
import { Button, Card } from '../UI';
// FIX: Corrected import paths for icons and store.
import { ArrowDownOnSquareIcon } from '../Icons';
import { useBookCraftStore } from '../../store/useStore';
import { log } from '../../services/logger';

// Import proper packages instead of CDN globals
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import mermaid from 'mermaid';

export const ExportTab: React.FC = () => {
    const [isExporting, setIsExporting] = useState(false);
    const project = useBookCraftStore(state => state.projects[state.activeProjectId!]);

    const handleExport = async () => {
        if (!project) return;
        setIsExporting(true);

        // 1. Create a hidden, styled container for rendering
        const printableArea = document.createElement('div');
        printableArea.id = 'printable-area';
        printableArea.style.position = 'absolute';
        printableArea.style.left = '-9999px';
        printableArea.style.width = '800px';
        printableArea.style.padding = '40px';
        printableArea.style.backgroundColor = 'white';
        printableArea.style.color = 'black';
        printableArea.style.fontFamily = 'serif';
        printableArea.style.fontSize = '16px';
        printableArea.style.lineHeight = '1.6';
        document.body.appendChild(printableArea);

        try {
            // 2. Populate with content
            let content = `<h1 style="font-size: 2.5em; text-align: center; margin-bottom: 40px;">${project.title}</h1>`;
            // FIX: The 'manuscript' property does not exist on the Project type.
            // This now correctly constructs the manuscript by mapping over and joining the content of each chapter, sorted by order.
            const manuscript = project.chapters
                .sort((a, b) => a.order - b.order)
                .map(c => `<h2>${c.title}</h2>\n${c.content}`)
                .join('\n\n');
            content += `<div style="white-space: pre-wrap;">${manuscript}</div>`;
            
            project.generatedImages.forEach(img => {
                content += `<h3 style="margin-top: 30px; font-size: 1.2em; border-bottom: 1px solid #eee; padding-bottom: 5px;">Image: ${img.prompt}</h3>`;
                content += `<img src="data:image/png;base64,${img.base64Image}" style="max-width: 100%; border: 1px solid #ccc; margin-top: 10px;" />`;
            });
            
            // Initialize Mermaid
            mermaid.initialize({
                startOnLoad: false,
                theme: 'default',
                securityLevel: 'loose'
            });

            const visualPromises = project.visuals.map(async (vis, index) => {
                try {
                    const { svg } = await mermaid.render(`export-vis-${vis.id}`, vis.content.mermaidCode);
                    return `
                        <h3 style="margin-top: 30px; font-size: 1.2em; border-bottom: 1px solid #eee; padding-bottom: 5px;">Visual: ${vis.type}</h3>
                        <div style="background:white; padding:10px; border: 1px solid #ccc; margin-top: 10px;">${svg}</div>
                    `;
                } catch (e) {
                    log.error('Mermaid render error during export', e as Error, 'Export');
                    return `<h3>Visual: ${vis.type}</h3><p>Error rendering diagram.</p>`;
                }
            });

            const renderedVisuals = await Promise.all(visualPromises);
            content += renderedVisuals.join('');
            
            printableArea.innerHTML = content;

            // 3. Generate PDF from the rendered content
            const canvas = await html2canvas(printableArea, { scale: 2 });
            const imgData = canvas.toDataURL('image/png');
            
            const pdf = new (window as any).jspdf.jsPDF({
                orientation: 'portrait',
                unit: 'px',
                format: [canvas.width, canvas.height]
            });

            pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
            pdf.save(`${project.title.replace(/ /g, '_')}.pdf`);

        } catch (error) {
            log.error('PDF generation failed', error as Error, 'Export');
            alert("Sorry, there was an error generating the PDF.");
        } finally {
            // 4. Cleanup
            document.body.removeChild(printableArea);
            setIsExporting(false);
        }
    };


    return (
        <Card className="p-6 animate-fade-in max-w-2xl mx-auto">
            <h3 className="text-2xl font-bold mb-4">Export Your Book</h3>
            <p className="text-slate-400 mb-6">Generate a flattened, print-ready PDF for KDP or a digital file for online distribution. More formatting options are coming soon.</p>
            <div className="space-y-4">
                 <div>
                    <label htmlFor="format" className="block text-sm font-medium text-slate-300 mb-1">Format</label>
                    <select id="format" className="w-full bg-slate-700 border-slate-600 rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary sm:text-sm p-2">
                        <option>PDF (for KDP Print)</option>
                        <option disabled>EPUB (Coming Soon)</option>
                    </select>
                </div>
                 <div>
                    <label htmlFor="trim" className="block text-sm font-medium text-slate-300 mb-1">Trim Size (for PDF)</label>
                    <select id="trim" className="w-full bg-slate-700 border-slate-600 rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary sm:text-sm p-2">
                        <option>Dynamic (Based on Content)</option>
                        <option disabled>6" x 9" (Coming Soon)</option>
                        <option disabled>5.5" x 8.5" (Coming Soon)</option>
                    </select>
                </div>
                <div className="pt-4">
                    <Button className="w-full" onClick={handleExport} isLoading={isExporting} disabled={isExporting}>
                        <ArrowDownOnSquareIcon className="w-5 h-5 mr-2" />
                        {isExporting ? 'Generating PDF...' : 'Generate & Download'}
                    </Button>
                </div>
            </div>
        </Card>
    );
};