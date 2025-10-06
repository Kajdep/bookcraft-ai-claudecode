import React, { useState } from 'react';
import { Button, Card, Select, Input } from '../UI';
import { ArrowDownOnSquareIcon, BookOpenIcon, DocumentIcon, CogIcon } from '../Icons';
import { useBookCraftStore } from '../../store/useStore';
import { log } from '../../services/logger';
import { toast } from '../../services/toast';

// Import proper packages instead of CDN globals
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import mermaid from 'mermaid';
import EPub from 'epub-gen-memory';
import JSZip from 'jszip';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, Table, TableRow, TableCell, WidthType, ImageRun, PageBreak } from 'docx';
import { saveAs } from 'file-saver';

type ExportFormat = 'pdf' | 'epub' | 'html' | 'docx';
type TrimSize = 'dynamic' | '6x9' | '5.5x8.5' | '5x8' | '7x10' | '8.5x11' | '8.5x5.5';
type FontFamily = 'times' | 'georgia' | 'garamond' | 'minion' | 'palatino';
type PaperColor = 'white' | 'cream' | 'natural';

interface TypographyOptions {
    fontFamily: FontFamily;
    fontSize: number;
    lineHeight: number;
    paragraphSpacing: number;
    chapterSpacing: number;
    margins: { top: number; bottom: number; left: number; right: number };
    paperColor: PaperColor;
    dropCaps: boolean;
    pageNumbers: boolean;
    headers: boolean;
}

interface ExportOptions {
    format: ExportFormat;
    trimSize: TrimSize;
    includeImages: boolean;
    includeVisuals: boolean;
    includeTOC: boolean;
    typography: TypographyOptions;
    customCSS?: string;
    author?: string;
    publisher?: string;
    language?: string;
    genre?: string;
    isbn?: string;
    publicationDate?: string;
}

const TRIM_SIZES = {
    'dynamic': { 
        name: 'Dynamic (Based on Content)', 
        width: 800, 
        height: 'auto',
        description: 'Adjusts to content size'
    },
    '6x9': { 
        name: '6" × 9" (Standard Fiction)', 
        width: 432, 
        height: 648, 
        description: 'Most popular fiction size'
    },
    '5.5x8.5': { 
        name: '5.5" × 8.5" (Mass Market)', 
        width: 396, 
        height: 612,
        description: 'Paperback romance/thriller'
    },
    '5x8': { 
        name: '5" × 8" (Digest)', 
        width: 360, 
        height: 576,
        description: 'Small paperback format'
    },
    '7x10': { 
        name: '7" × 10" (Royal)', 
        width: 504, 
        height: 720,
        description: 'Non-fiction, textbooks'
    },
    '8.5x11': { 
        name: '8.5" × 11" (US Letter)', 
        width: 612, 
        height: 792,
        description: 'Workbooks, manuals'
    },
    '8.5x5.5': { 
        name: '8.5" × 5.5" (Landscape)', 
        width: 612, 
        height: 396,
        description: 'Coffee table books'
    }
};

const FONT_FAMILIES = {
    'times': { name: 'Times New Roman', css: 'Times New Roman, Times, serif', description: 'Classic serif, highly readable' },
    'georgia': { name: 'Georgia', css: 'Georgia, serif', description: 'Modern serif, web-optimized' },
    'garamond': { name: 'Garamond', css: 'Garamond, Times New Roman, serif', description: 'Elegant classic serif' },
    'minion': { name: 'Minion Pro', css: 'Minion Pro, Adobe Minion Pro, Times New Roman, serif', description: 'Professional publishing serif' },
    'palatino': { name: 'Palatino', css: 'Palatino, Palatino Linotype, serif', description: 'Renaissance-inspired serif' }
};

const PAPER_COLORS = {
    'white': { name: 'Pure White', color: '#ffffff', description: 'Bright white paper' },
    'cream': { name: 'Cream', color: '#fefdf8', description: 'Warm, easy on eyes' },
    'natural': { name: 'Natural', color: '#faf9f6', description: 'Slightly off-white' }
};

export const ExportTab: React.FC = () => {
    const [isExporting, setIsExporting] = useState(false);
    const [exportOptions, setExportOptions] = useState<ExportOptions>({
        format: 'pdf',
        trimSize: '6x9',
        includeImages: true,
        includeVisuals: true,
        includeTOC: true,
        typography: {
            fontFamily: 'times',
            fontSize: 12,
            lineHeight: 1.6,
            paragraphSpacing: 1.2,
            chapterSpacing: 2.5,
            margins: { top: 72, bottom: 72, left: 72, right: 72 }, // 1 inch margins in points
            paperColor: 'cream',
            dropCaps: false,
            pageNumbers: true,
            headers: false
        },
        author: '',
        publisher: '',
        language: 'en',
        genre: '',
        publicationDate: new Date().toISOString().split('T')[0]
    });
    const [showAdvanced, setShowAdvanced] = useState(false);

    const project = useBookCraftStore(state =>
        state.activeProjectId ? state.projects[state.activeProjectId] : null
    );

    // Initialize author and genre from project
    React.useEffect(() => {
        if (project) {
            setExportOptions(prev => ({
                ...prev,
                genre: project.genre || '',
                author: prev.author || 'Author Name' // Placeholder
            }));
        }
    }, [project]);

    const generateEPUB = async () => {
        if (!project) return;

        try {
            // Prepare chapters content - Defensive check for chapters array
            const chapters = (project.chapters || [])
                .sort((a, b) => a.order - b.order)
                .map((chapter, index) => {
                    let content = `<h1>${chapter.title}</h1>`;

                    // Convert plain text content to HTML with basic formatting
                    const htmlContent = chapter.content
                        .replace(/\n\n/g, '</p><p>')
                        .replace(/\n/g, '<br/>')
                        .replace(/^/, '<p>')
                        .replace(/$/, '</p>');

                    content += htmlContent;

                    return {
                        title: chapter.title,
                        data: content,
                        filename: `chapter-${index + 1}.xhtml`
                    };
                });

            // Add images if included - Defensive check for generatedImages array
            const images: Array<{url: string, alt: string, filename: string}> = [];
            if (exportOptions.includeImages && Array.isArray(project.generatedImages)) {
                (project.generatedImages || []).forEach((img, index) => {
                    images.push({
                        url: img.base64Image,
                        alt: img.prompt,
                        filename: `image-${index + 1}.png`
                    });
                });
            }

            // Render visuals as SVG if included - Defensive check for visuals array
            if (exportOptions.includeVisuals && Array.isArray(project.visuals) && project.visuals.length > 0) {
                mermaid.initialize({
                    startOnLoad: false,
                    theme: 'default',
                    securityLevel: 'loose'
                });

                for (const [index, visual] of (project.visuals || []).entries()) {
                    try {
                        const { svg } = await mermaid.render(`epub-vis-${visual.id}`, visual.content.mermaidCode);
                        
                        // Add visual as a separate chapter
                        chapters.push({
                            title: `Visual: ${visual.type}`,
                            data: `<h1>Visual: ${visual.type}</h1><div>${svg}</div>`,
                            filename: `visual-${index + 1}.xhtml`
                        });
                    } catch (e) {
                        log.error('Mermaid render error during EPUB export', e as Error, 'Export');
                        // Add error placeholder
                        chapters.push({
                            title: `Visual: ${visual.type}`,
                            data: `<h1>Visual: ${visual.type}</h1><p>Error rendering diagram.</p>`,
                            filename: `visual-${index + 1}.xhtml`
                        });
                    }
                }
            }

            // EPUB CSS styling
            const css = exportOptions.customCSS || `
                body {
                    font-family: 'Times New Roman', serif;
                    font-size: 16px;
                    line-height: 1.6;
                    margin: 0;
                    padding: 20px;
                    text-align: justify;
                }
                h1 {
                    font-size: 2em;
                    margin-bottom: 1em;
                    text-align: center;
                    page-break-before: always;
                }
                h2 {
                    font-size: 1.5em;
                    margin-top: 2em;
                    margin-bottom: 1em;
                }
                p {
                    margin-bottom: 1em;
                    text-indent: 1.5em;
                }
                img {
                    max-width: 100%;
                    height: auto;
                    display: block;
                    margin: 1em auto;
                }
                .visual-diagram {
                    text-align: center;
                    margin: 2em 0;
                }
            `;

            // Generate EPUB
            const epubBuffer = await EPub({
                title: project.title,
                author: exportOptions.author || 'Unknown Author',
                publisher: exportOptions.publisher || 'BookCraft AI',
                cover: project.generatedImages?.[0]?.base64Image || undefined,
                css,
                content: chapters,
                images,
                tocTitle: 'Table of Contents',
                appendChapterTitles: exportOptions.includeTOC,
                date: exportOptions.publicationDate,
                lang: exportOptions.language || 'en',
                version: 3 // EPUB 3.0
            });

            // Download the EPUB file
            const blob = new Blob([epubBuffer], { type: 'application/epub+zip' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${project.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.epub`;
            a.click();
            URL.revokeObjectURL(url);

            toast.success('EPUB Generated', 'Your ebook has been generated and downloaded!');

        } catch (error) {
            log.error('EPUB generation failed', error as Error, 'Export');
            toast.error('EPUB Export Failed', 'Sorry, there was an error generating the EPUB file.');
        }
    };

    const generatePDF = async () => {
        if (!project) return;

        const trimSize = TRIM_SIZES[exportOptions.trimSize];
        const typo = exportOptions.typography;
        const font = FONT_FAMILIES[typo.fontFamily];
        const paperColor = PAPER_COLORS[typo.paperColor];
        
        // Create PDF document with proper trim size
        const pdf = new jsPDF({
            orientation: trimSize.height === 'auto' || trimSize.width < (trimSize.height as number) ? 'portrait' : 'landscape',
            unit: 'pt',
            format: trimSize.height === 'auto' ? 'a4' : [trimSize.width, trimSize.height as number]
        });

        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        const margins = typo.margins;
        const contentWidth = pageWidth - margins.left - margins.right;
        const contentHeight = pageHeight - margins.top - margins.bottom;
        
        let currentPage = 1;
        let yPosition = margins.top;

        // Helper functions
        const addNewPage = () => {
            pdf.addPage();
            currentPage++;
            yPosition = margins.top;
            
            // Add page background color if not white
            if (typo.paperColor !== 'white') {
                pdf.setFillColor(paperColor.color);
                pdf.rect(0, 0, pageWidth, pageHeight, 'F');
            }
            
            // Add headers if enabled
            if (typo.headers) {
                pdf.setFontSize(10);
                pdf.setTextColor(100, 100, 100);
                if (currentPage % 2 === 0) {
                    pdf.text(exportOptions.author || project.title, margins.left, 36);
                } else {
                    pdf.text(project.title, pageWidth - margins.right, 36, { align: 'right' });
                }
                pdf.setTextColor(0, 0, 0); // Reset to black
            }
            
            // Add page numbers if enabled
            if (typo.pageNumbers) {
                pdf.setFontSize(10);
                pdf.setTextColor(100, 100, 100);
                pdf.text(currentPage.toString(), pageWidth / 2, pageHeight - 36, { align: 'center' });
                pdf.setTextColor(0, 0, 0); // Reset to black
            }
        };

        const checkPageBreak = (requiredHeight: number) => {
            if (yPosition + requiredHeight > pageHeight - margins.bottom) {
                addNewPage();
            }
        };

        const addDropCap = (text: string, x: number, y: number) => {
            if (!text) return { text, height: 0 };
            const firstChar = text.charAt(0);
            const restText = text.substring(1);
            
            // Draw drop cap
            pdf.setFontSize(typo.fontSize * 3);
            pdf.text(firstChar, x, y + typo.fontSize * 2);
            
            // Calculate drop cap dimensions
            const dropCapWidth = pdf.getTextWidth(firstChar);
            const dropCapHeight = typo.fontSize * 3;
            
            return { text: restText, width: dropCapWidth, height: dropCapHeight };
        };

        try {
            // Set up first page
            if (typo.paperColor !== 'white') {
                pdf.setFillColor(paperColor.color);
                pdf.rect(0, 0, pageWidth, pageHeight, 'F');
            }
            
            pdf.setFont('times', 'normal');
            pdf.setFontSize(typo.fontSize);
            pdf.setTextColor(0, 0, 0);

            // Title Page
            pdf.setFontSize(24);
            const titleLines = pdf.splitTextToSize(project.title, contentWidth);
            const titleHeight = titleLines.length * 28;
            const titleY = pageHeight / 2 - titleHeight / 2;
            pdf.text(titleLines, pageWidth / 2, titleY, { align: 'center' });
            
            if (exportOptions.author) {
                pdf.setFontSize(18);
                pdf.text(`by ${exportOptions.author}`, pageWidth / 2, titleY + titleHeight + 40, { align: 'center' });
            }
            
            // Publisher info if provided
            if (exportOptions.publisher) {
                pdf.setFontSize(12);
                pdf.text(exportOptions.publisher, pageWidth / 2, pageHeight - 100, { align: 'center' });
            }
            
            addNewPage();

            // Table of Contents - Defensive check for chapters array
            if (exportOptions.includeTOC) {
                pdf.setFontSize(18);
                pdf.text('Table of Contents', pageWidth / 2, yPosition, { align: 'center' });
                yPosition += 40;

                pdf.setFontSize(typo.fontSize);
                (project.chapters || [])
                    .sort((a, b) => a.order - b.order)
                    .forEach((chapter, index) => {
                        checkPageBreak(typo.fontSize * typo.lineHeight + 5);
                        pdf.text(`${index + 1}. ${chapter.title}`, margins.left, yPosition);
                        yPosition += typo.fontSize * typo.lineHeight + 5;
                    });

                addNewPage();
            }

            // Chapters - Defensive check for chapters array
            (project.chapters || [])
                .sort((a, b) => a.order - b.order)
                .forEach((chapter, chapterIndex) => {
                    // Chapter title
                    const chapterTitleHeight = typo.fontSize * typo.chapterSpacing * 2;
                    checkPageBreak(chapterTitleHeight);
                    
                    pdf.setFontSize(typo.fontSize * 1.5);
                    pdf.text(chapter.title, margins.left, yPosition + typo.fontSize * 1.5);
                    yPosition += chapterTitleHeight;
                    
                    pdf.setFontSize(typo.fontSize);
                    
                    // Chapter content - split into paragraphs
                    const paragraphs = chapter.content.split('\n\n').filter(p => p.trim());
                    
                    paragraphs.forEach((paragraph, paragraphIndex) => {
                        const lines = pdf.splitTextToSize(paragraph, contentWidth - (typo.dropCaps && paragraphIndex === 0 ? 40 : 0));
                        const paragraphHeight = lines.length * typo.fontSize * typo.lineHeight + typo.fontSize * typo.paragraphSpacing;
                        
                        checkPageBreak(paragraphHeight);
                        
                        let xOffset = margins.left;
                        let lineYOffset = 0;
                        
                        // Add drop cap for first paragraph of chapter
                        if (typo.dropCaps && paragraphIndex === 0 && chapterIndex === 0) {
                            const dropCapInfo = addDropCap(paragraph, margins.left, yPosition);
                            xOffset += 40;
                            
                            // Adjust first few lines for drop cap
                            lines.slice(0, 3).forEach((line, lineIndex) => {
                                pdf.text(line, xOffset, yPosition + (lineIndex * typo.fontSize * typo.lineHeight));
                                lineYOffset = (lineIndex + 1) * typo.fontSize * typo.lineHeight;
                            });
                            
                            // Rest of the lines normal
                            lines.slice(3).forEach((line, lineIndex) => {
                                pdf.text(line, margins.left, yPosition + lineYOffset + (lineIndex * typo.fontSize * typo.lineHeight));
                            });
                        } else {
                            lines.forEach((line, lineIndex) => {
                                pdf.text(line, margins.left, yPosition + (lineIndex * typo.fontSize * typo.lineHeight));
                            });
                        }
                        
                        yPosition += paragraphHeight;
                    });
                    
                    yPosition += typo.fontSize * typo.chapterSpacing;
                });
            
            // Images - Defensive check for generatedImages array
            if (exportOptions.includeImages && Array.isArray(project.generatedImages) && project.generatedImages.length > 0) {
                for (const img of (project.generatedImages || [])) {
                    addNewPage();
                    
                    pdf.setFontSize(14);
                    pdf.text(img.prompt, pageWidth / 2, yPosition, { align: 'center' });
                    yPosition += 30;
                    
                    try {
                        // Create image element to get dimensions
                        const imgElement = new Image();
                        imgElement.src = img.base64Image;
                        await new Promise((resolve) => {
                            imgElement.onload = resolve;
                        });
                        
                        const aspectRatio = imgElement.width / imgElement.height;
                        const maxWidth = contentWidth * 0.8;
                        const maxHeight = contentHeight * 0.6;
                        
                        let imgWidth = maxWidth;
                        let imgHeight = maxWidth / aspectRatio;
                        
                        if (imgHeight > maxHeight) {
                            imgHeight = maxHeight;
                            imgWidth = maxHeight * aspectRatio;
                        }
                        
                        const imgX = (pageWidth - imgWidth) / 2;
                        pdf.addImage(img.base64Image, 'PNG', imgX, yPosition, imgWidth, imgHeight);
                        
                    } catch (e) {
                        log.error('Image processing error during PDF export', e as Error, 'Export');
                        pdf.text('Error loading image', pageWidth / 2, yPosition, { align: 'center' });
                    }
                }
            }
            
            // Visuals - Defensive check for visuals array
            if (exportOptions.includeVisuals && Array.isArray(project.visuals) && project.visuals.length > 0) {
                mermaid.initialize({
                    startOnLoad: false,
                    theme: 'default',
                    securityLevel: 'loose'
                });

                for (const visual of (project.visuals || [])) {
                    addNewPage();
                    
                    pdf.setFontSize(14);
                    pdf.text(`Visual: ${visual.type}`, pageWidth / 2, yPosition, { align: 'center' });
                    yPosition += 30;
                    
                    try {
                        const { svg } = await mermaid.render(`pdf-vis-${visual.id}`, visual.content.mermaidCode);
                        
                        // Convert SVG to image for PDF
                        const canvas = document.createElement('canvas');
                        const ctx = canvas.getContext('2d');
                        const img = new Image();
                        
                        const svgBlob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
                        const url = URL.createObjectURL(svgBlob);
                        
                        await new Promise((resolve, reject) => {
                            img.onload = () => {
                                canvas.width = img.width;
                                canvas.height = img.height;
                                ctx!.fillStyle = 'white';
                                ctx!.fillRect(0, 0, canvas.width, canvas.height);
                                ctx!.drawImage(img, 0, 0);
                                resolve(null);
                            };
                            img.onerror = reject;
                            img.src = url;
                        });
                        
                        const imgData = canvas.toDataURL('image/png');
                        URL.revokeObjectURL(url);
                        
                        const aspectRatio = canvas.width / canvas.height;
                        const maxWidth = contentWidth * 0.9;
                        const maxHeight = contentHeight * 0.7;
                        
                        let imgWidth = maxWidth;
                        let imgHeight = maxWidth / aspectRatio;
                        
                        if (imgHeight > maxHeight) {
                            imgHeight = maxHeight;
                            imgWidth = maxHeight * aspectRatio;
                        }
                        
                        const imgX = (pageWidth - imgWidth) / 2;
                        pdf.addImage(imgData, 'PNG', imgX, yPosition, imgWidth, imgHeight);
                        
                    } catch (e) {
                        log.error('Visual render error during PDF export', e as Error, 'Export');
                        pdf.text('Error rendering diagram', pageWidth / 2, yPosition, { align: 'center' });
                    }
                }
            }
            
            pdf.save(`${project.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`);
            toast.success('PDF Generated', 'Your professionally formatted book has been exported!');

        } catch (error) {
            log.error('PDF generation failed', error as Error, 'Export');
            toast.error('PDF Export Failed', 'Sorry, there was an error generating the PDF.');
        }
    };

    const generateWordDocument = async () => {
        if (!project) return;

        try {
            const typo = exportOptions.typography;
            
            // Create document sections
            const sections = [];
            
            // Title Page
            const titlePageChildren = [
                new Paragraph({
                    children: [new TextRun({
                        text: project.title,
                        bold: true,
                        size: 48,
                        font: "Times New Roman"
                    })],
                    alignment: AlignmentType.CENTER,
                    spacing: { after: 400 }
                })
            ];
            
            if (exportOptions.author) {
                titlePageChildren.push(
                    new Paragraph({
                        children: [new TextRun({
                            text: `by ${exportOptions.author}`,
                            size: 32,
                            font: "Times New Roman"
                        })],
                        alignment: AlignmentType.CENTER,
                        spacing: { after: 400 }
                    })
                );
            }
            
            // Add publisher info if provided
            if (exportOptions.publisher) {
                titlePageChildren.push(
                    new Paragraph({
                        children: [new TextRun({
                            text: exportOptions.publisher,
                            size: 24,
                            font: "Times New Roman"
                        })],
                        alignment: AlignmentType.CENTER,
                        spacing: { before: 1440 } // 1 inch from bottom
                    })
                );
            }
            
            // Add page break after title page
            titlePageChildren.push(new Paragraph({ children: [new PageBreak()] }));
            
            const documentChildren = [...titlePageChildren];
            
            // Table of Contents - Defensive check for chapters array
            if (exportOptions.includeTOC) {
                documentChildren.push(
                    new Paragraph({
                        children: [new TextRun({
                            text: "Table of Contents",
                            bold: true,
                            size: 32,
                            font: "Times New Roman"
                        })],
                        heading: HeadingLevel.HEADING_1,
                        alignment: AlignmentType.CENTER,
                        spacing: { after: 400 }
                    })
                );

                (project.chapters || [])
                    .sort((a, b) => a.order - b.order)
                    .forEach((chapter, index) => {
                        documentChildren.push(
                            new Paragraph({
                                children: [new TextRun({
                                    text: `${index + 1}. ${chapter.title}`,
                                    size: 24,
                                    font: "Times New Roman"
                                })],
                                spacing: { after: 120 }
                            })
                        );
                    });
                    
                documentChildren.push(new Paragraph({ children: [new PageBreak()] }));
            }
            
            // Chapters - Defensive check for chapters array
            (project.chapters || [])
                .sort((a, b) => a.order - b.order)
                .forEach((chapter, chapterIndex) => {
                    // Chapter title
                    documentChildren.push(
                        new Paragraph({
                            children: [new TextRun({
                                text: chapter.title,
                                bold: true,
                                size: 32,
                                font: "Times New Roman"
                            })],
                            heading: HeadingLevel.HEADING_1,
                            alignment: AlignmentType.CENTER,
                            spacing: { before: 480, after: 240 },
                            pageBreakBefore: chapterIndex > 0
                        })
                    );

                    // Chapter content - split into paragraphs
                    const paragraphs = (chapter.content || '').split('\n\n').filter(p => p.trim());

                    (paragraphs || []).forEach((paragraphText, paragraphIndex) => {
                        const isFirstParagraph = paragraphIndex === 0;
                        const children = [];
                        
                        // Handle drop caps if enabled
                        if (typo.dropCaps && isFirstParagraph && chapterIndex === 0) {
                            const firstChar = paragraphText.charAt(0);
                            const restText = paragraphText.substring(1);
                            
                            children.push(
                                new TextRun({
                                    text: firstChar,
                                    bold: true,
                                    size: 48,
                                    font: "Times New Roman"
                                }),
                                new TextRun({
                                    text: restText,
                                    size: 24,
                                    font: "Times New Roman"
                                })
                            );
                        } else {
                            children.push(
                                new TextRun({
                                    text: paragraphText,
                                    size: 24,
                                    font: "Times New Roman"
                                })
                            );
                        }
                        
                        documentChildren.push(
                            new Paragraph({
                                children,
                                alignment: AlignmentType.JUSTIFIED,
                                spacing: {
                                    after: 240,
                                    line: Math.round(typo.lineHeight * 240), // Convert to twips
                                },
                                indent: isFirstParagraph ? undefined : { firstLine: 360 } // 0.25 inch indent
                            })
                        );
                    });
                });
            
            // Images section - Defensive check for generatedImages array
            if (exportOptions.includeImages && Array.isArray(project.generatedImages) && project.generatedImages.length > 0) {
                documentChildren.push(
                    new Paragraph({ children: [new PageBreak()] }),
                    new Paragraph({
                        children: [new TextRun({
                            text: "Generated Images",
                            bold: true,
                            size: 32,
                            font: "Times New Roman"
                        })],
                        heading: HeadingLevel.HEADING_1,
                        alignment: AlignmentType.CENTER,
                        spacing: { after: 400 }
                    })
                );

                for (const img of (project.generatedImages || [])) {
                    try {
                        // Add image title
                        documentChildren.push(
                            new Paragraph({
                                children: [new TextRun({
                                    text: img.prompt,
                                    bold: true,
                                    size: 24,
                                    font: "Times New Roman"
                                })],
                                alignment: AlignmentType.CENTER,
                                spacing: { after: 240 }
                            })
                        );
                        
                        // Convert base64 to buffer for docx
                        const base64Data = img.base64Image.split(',')[1];
                        const imageBuffer = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
                        
                        documentChildren.push(
                            new Paragraph({
                                children: [
                                    new ImageRun({
                                        data: imageBuffer,
                                        transformation: {
                                            width: 400,
                                            height: 300,
                                        },
                                    })
                                ],
                                alignment: AlignmentType.CENTER,
                                spacing: { after: 400 }
                            })
                        );
                    } catch (error) {
                        log.error('Error processing image for Word export', error as Error, 'Export');
                        documentChildren.push(
                            new Paragraph({
                                children: [new TextRun({
                                    text: `[Image: ${img.prompt}]`,
                                    italics: true,
                                    size: 24,
                                    color: "999999"
                                })],
                                alignment: AlignmentType.CENTER,
                                spacing: { after: 240 }
                            })
                        );
                    }
                }
            }
            
            // Visuals section
            if (exportOptions.includeVisuals && project.visuals) {
                documentChildren.push(
                    new Paragraph({ children: [new PageBreak()] }),
                    new Paragraph({
                        children: [new TextRun({
                            text: "Diagrams",
                            bold: true,
                            size: 32,
                            font: "Times New Roman"
                        })],
                        heading: HeadingLevel.HEADING_1,
                        alignment: AlignmentType.CENTER,
                        spacing: { after: 400 }
                    })
                );
                
                mermaid.initialize({
                    startOnLoad: false,
                    theme: 'default',
                    securityLevel: 'loose'
                });
                
                for (const visual of project.visuals) {
                    try {
                        documentChildren.push(
                            new Paragraph({
                                children: [new TextRun({
                                    text: `Visual: ${visual.type}`,
                                    bold: true,
                                    size: 24,
                                    font: "Times New Roman"
                                })],
                                alignment: AlignmentType.CENTER,
                                spacing: { after: 240 }
                            })
                        );
                        
                        const { svg } = await mermaid.render(`docx-vis-${visual.id}`, visual.content.mermaidCode);
                        
                        // Convert SVG to canvas, then to buffer
                        const canvas = document.createElement('canvas');
                        const ctx = canvas.getContext('2d');
                        const img = new Image();
                        
                        const svgBlob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
                        const url = URL.createObjectURL(svgBlob);
                        
                        await new Promise((resolve, reject) => {
                            img.onload = () => {
                                canvas.width = 800;
                                canvas.height = 600;
                                ctx!.fillStyle = 'white';
                                ctx!.fillRect(0, 0, canvas.width, canvas.height);
                                ctx!.drawImage(img, 0, 0, canvas.width, canvas.height);
                                resolve(null);
                            };
                            img.onerror = reject;
                            img.src = url;
                        });
                        
                        URL.revokeObjectURL(url);
                        
                        // Convert canvas to buffer
                        const imageData = canvas.toDataURL('image/png');
                        const base64Data = imageData.split(',')[1];
                        const imageBuffer = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
                        
                        documentChildren.push(
                            new Paragraph({
                                children: [
                                    new ImageRun({
                                        data: imageBuffer,
                                        transformation: {
                                            width: 500,
                                            height: 375,
                                        },
                                    })
                                ],
                                alignment: AlignmentType.CENTER,
                                spacing: { after: 400 }
                            })
                        );
                        
                    } catch (error) {
                        log.error('Error processing visual for Word export', error as Error, 'Export');
                        documentChildren.push(
                            new Paragraph({
                                children: [new TextRun({
                                    text: `[Diagram: ${visual.type}]`,
                                    italics: true,
                                    size: 24,
                                    color: "999999"
                                })],
                                alignment: AlignmentType.CENTER,
                                spacing: { after: 240 }
                            })
                        );
                    }
                }
            }
            
            // Create document
            const doc = new Document({
                creator: exportOptions.author || 'BookCraft AI',
                title: project.title,
                description: `Generated by BookCraft AI`,
                sections: [
                    {
                        properties: {
                            page: {
                                margin: {
                                    top: typo.margins.top * 20, // Convert points to twips
                                    right: typo.margins.right * 20,
                                    bottom: typo.margins.bottom * 20,
                                    left: typo.margins.left * 20,
                                },
                            },
                        },
                        headers: typo.headers ? {
                            default: new Paragraph({
                                children: [
                                    new TextRun({
                                        text: project.title,
                                        size: 20,
                                        font: "Times New Roman"
                                    })
                                ],
                                alignment: AlignmentType.CENTER
                            })
                        } : undefined,
                        footers: typo.pageNumbers ? {
                            default: new Paragraph({
                                children: [
                                    new TextRun({
                                        text: "Page ",
                                        size: 20,
                                        font: "Times New Roman"
                                    })
                                ],
                                alignment: AlignmentType.CENTER
                            })
                        } : undefined,
                        children: documentChildren,
                    },
                ],
            });
            
            // Generate and download
            const buffer = await Packer.toBuffer(doc);
            const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
            saveAs(blob, `${project.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.docx`);
            
            toast.success('Word Document Generated', 'Your book has been exported as a Word document!');
            
        } catch (error) {
            log.error('Word document generation failed', error as Error, 'Export');
            toast.error('Word Export Failed', 'Sorry, there was an error generating the Word document.');
        }
    };

    const generateHTML = async () => {
        if (!project) return;

        try {
            let htmlContent = `
                <!DOCTYPE html>
                <html lang="${exportOptions.language || 'en'}">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>${project.title}</title>
                    <style>
                        body {
                            max-width: 800px;
                            margin: 0 auto;
                            padding: 20px;
                            font-family: 'Times New Roman', serif;
                            font-size: 18px;
                            line-height: 1.8;
                            color: #333;
                        }
                        h1 {
                            text-align: center;
                            color: #2c3e50;
                            border-bottom: 2px solid #3498db;
                            padding-bottom: 10px;
                        }
                        h2 {
                            color: #2c3e50;
                            margin-top: 2em;
                        }
                        p {
                            text-align: justify;
                            margin-bottom: 1em;
                        }
                        img {
                            max-width: 100%;
                            height: auto;
                            display: block;
                            margin: 2em auto;
                            border-radius: 8px;
                            box-shadow: 0 4px 8px rgba(0,0,0,0.1);
                        }
                        .chapter {
                            margin-bottom: 3em;
                        }
                        .toc {
                            background: #f8f9fa;
                            padding: 20px;
                            border-radius: 8px;
                            margin-bottom: 2em;
                        }
                        .toc ul {
                            list-style: none;
                            padding: 0;
                        }
                        .toc li {
                            margin-bottom: 0.5em;
                        }
                        .toc a {
                            text-decoration: none;
                            color: #3498db;
                        }
                        .toc a:hover {
                            text-decoration: underline;
                        }
                        .visual-section {
                            text-align: center;
                            margin: 2em 0;
                        }
                        ${exportOptions.customCSS || ''}
                    </style>
                </head>
                <body>
            `;

            // Title and author
            htmlContent += `<h1>${project.title}</h1>`;
            if (exportOptions.author) {
                htmlContent += `<p style="text-align: center; font-size: 1.2em; margin-bottom: 2em;">by ${exportOptions.author}</p>`;
            }

            // Table of Contents - Defensive check for chapters array
            if (exportOptions.includeTOC) {
                htmlContent += '<div class="toc"><h2>Table of Contents</h2><ul>';
                (project.chapters || [])
                    .sort((a, b) => a.order - b.order)
                    .forEach((chapter, index) => {
                        const anchor = `chapter-${index + 1}`;
                        htmlContent += `<li><a href="#${anchor}">${chapter.title}</a></li>`;
                    });
                htmlContent += '</ul></div>';
            }

            // Chapters - Defensive check for chapters array
            (project.chapters || [])
                .sort((a, b) => a.order - b.order)
                .forEach((chapter, index) => {
                    const anchor = `chapter-${index + 1}`;
                    htmlContent += `<div class="chapter"><h2 id="${anchor}">${chapter.title}</h2>`;

                    // Convert plain text to HTML paragraphs
                    const paragraphs = (chapter.content || '')
                        .split('\n\n')
                        .filter(p => p.trim())
                        .map(p => `<p>${p.trim().replace(/\n/g, '<br>')}</p>`)
                        .join('');

                    htmlContent += paragraphs + '</div>';
                });

            // Images - Defensive check for generatedImages array
            if (exportOptions.includeImages && Array.isArray(project.generatedImages) && project.generatedImages.length > 0) {
                htmlContent += '<div class="images-section"><h2>Generated Images</h2>';
                (project.generatedImages || []).forEach(img => {
                    htmlContent += `
                        <div style="margin-bottom: 2em; text-align: center;">
                            <h3>${img.prompt}</h3>
                            <img src="${img.base64Image}" alt="${img.prompt}" />
                        </div>
                    `;
                });
                htmlContent += '</div>';
            }

            // Visuals - Defensive check for visuals array
            if (exportOptions.includeVisuals && Array.isArray(project.visuals) && project.visuals.length > 0) {
                htmlContent += '<div class="visuals-section"><h2>Diagrams</h2>';

                mermaid.initialize({
                    startOnLoad: false,
                    theme: 'default',
                    securityLevel: 'loose'
                });

                for (const visual of (project.visuals || [])) {
                    try {
                        const { svg } = await mermaid.render(`html-vis-${visual.id}`, visual.content.mermaidCode);
                        htmlContent += `
                            <div class="visual-section">
                                <h3>Visual: ${visual.type}</h3>
                                <div>${svg}</div>
                            </div>
                        `;
                    } catch (e) {
                        log.error('Mermaid render error during HTML export', e as Error, 'Export');
                        htmlContent += `
                            <div class="visual-section">
                                <h3>Visual: ${visual.type}</h3>
                                <p>Error rendering diagram.</p>
                            </div>
                        `;
                    }
                }
                htmlContent += '</div>';
            }

            htmlContent += '</body></html>';

            // Download HTML file
            const blob = new Blob([htmlContent], { type: 'text/html' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${project.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.html`;
            a.click();
            URL.revokeObjectURL(url);

            toast.success('HTML Generated', 'Your book has been exported as HTML!');

        } catch (error) {
            log.error('HTML generation failed', error as Error, 'Export');
            toast.error('HTML Export Failed', 'Sorry, there was an error generating the HTML file.');
        }
    };

    const handleExport = async () => {
        if (!project) return;
        setIsExporting(true);

        try {
            switch (exportOptions.format) {
                case 'epub':
                    await generateEPUB();
                    break;
                case 'html':
                    await generateHTML();
                    break;
                case 'docx':
                    await generateWordDocument();
                    break;
                case 'pdf':
                default:
                    await generatePDF();
                    break;
            }
        } catch (error) {
            log.error('Export failed', error as Error, 'Export');
            toast.error('Export Failed', 'Sorry, there was an error exporting your book.');
        } finally {
            setIsExporting(false);
        }
    };


    // Show message if no project is selected
    if (!project) {
        return (
            <div className="animate-fade-in">
                <Card className="p-12 text-center">
                    <BookOpenIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <h3 className="text-xl font-semibold text-gray-700 mb-2">No Project Selected</h3>
                    <p className="text-gray-600">
                        Please select or create a project to export your manuscript.
                    </p>
                </Card>
            </div>
        );
    }

    return (
        <div className="animate-fade-in space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold flex items-center">
                        <ArrowDownOnSquareIcon className="w-6 h-6 mr-2 text-brand-primary" />
                        Export Your Book
                    </h2>
                    <p className="text-gray-600 mt-1">
                        Generate professional formats for publishing and distribution.
                    </p>
                </div>
            </div>

            {/* Export Options */}
            <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <CogIcon className="w-5 h-5 mr-2" />
                    Export Settings
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Format Selection */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Export Format</label>
                        <Select
                            value={exportOptions.format}
                            onChange={(e) => setExportOptions(prev => ({ ...prev, format: e.target.value as ExportFormat }))}
                        >
                            <option value="pdf">📄 PDF (Print Ready)</option>
                            <option value="epub">📚 EPUB (eBook)</option>
                            <option value="docx">📝 Word Document (DOCX)</option>
                            <option value="html">🌐 HTML (Web)</option>
                        </Select>
                        <p className="text-xs text-gray-500 mt-1">
                            {exportOptions.format === 'pdf' && 'Perfect for print-on-demand and physical books'}
                            {exportOptions.format === 'epub' && 'Standard ebook format for digital distribution'}
                            {exportOptions.format === 'docx' && 'Microsoft Word format for traditional publishing workflows'}
                            {exportOptions.format === 'html' && 'Web-friendly format for online reading'}
                        </p>
                    </div>

                    {/* Trim Size (PDF only) */}
                    {exportOptions.format === 'pdf' && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Trim Size</label>
                            <Select
                                value={exportOptions.trimSize}
                                onChange={(e) => setExportOptions(prev => ({ ...prev, trimSize: e.target.value as TrimSize }))}
                            >
                                {Object.entries(TRIM_SIZES).map(([key, size]) => (
                                    <option key={key} value={key} title={size.description}>{size.name}</option>
                                ))}
                            </Select>
                            <p className="text-xs text-gray-500 mt-1">
                                {TRIM_SIZES[exportOptions.trimSize].description}
                            </p>
                        </div>
                    )}

                    {/* Author */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Author</label>
                        <Input
                            value={exportOptions.author || ''}
                            onChange={(e) => setExportOptions(prev => ({ ...prev, author: e.target.value }))}
                            placeholder="Author Name"
                        />
                    </div>

                    {/* Language (EPUB/HTML only) */}
                    {(exportOptions.format === 'epub' || exportOptions.format === 'html') && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Language</label>
                            <Select
                                value={exportOptions.language || 'en'}
                                onChange={(e) => setExportOptions(prev => ({ ...prev, language: e.target.value }))}
                            >
                                <option value="en">English</option>
                                <option value="es">Spanish</option>
                                <option value="fr">French</option>
                                <option value="de">German</option>
                                <option value="it">Italian</option>
                                <option value="pt">Portuguese</option>
                            </Select>
                        </div>
                    )}
                </div>

                {/* Content Options */}
                <div className="mt-6">
                    <h4 className="text-md font-medium text-gray-700 mb-3">Content Options</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <label className="flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={exportOptions.includeTOC}
                                onChange={(e) => setExportOptions(prev => ({ ...prev, includeTOC: e.target.checked }))}
                                className="mr-2"
                            />
                            <span className="text-sm text-gray-700">Table of Contents</span>
                        </label>
                        <label className="flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={exportOptions.includeImages}
                                onChange={(e) => setExportOptions(prev => ({ ...prev, includeImages: e.target.checked }))}
                                className="mr-2"
                            />
                            <span className="text-sm text-gray-700">Generated Images</span>
                        </label>
                        <label className="flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={exportOptions.includeVisuals}
                                onChange={(e) => setExportOptions(prev => ({ ...prev, includeVisuals: e.target.checked }))}
                                className="mr-2"
                            />
                            <span className="text-sm text-gray-700">Diagrams</span>
                        </label>
                    </div>
                </div>

                {/* Typography Options (PDF only) */}
                {exportOptions.format === 'pdf' && (
                    <div className="mt-6">
                        <h4 className="text-md font-medium text-gray-700 mb-3 flex items-center">
                            📖 Professional Typography
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* Font Family */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Font Family</label>
                                <Select
                                    value={exportOptions.typography.fontFamily}
                                    onChange={(e) => setExportOptions(prev => ({
                                        ...prev,
                                        typography: { ...prev.typography, fontFamily: e.target.value as FontFamily }
                                    }))}
                                >
                                    {Object.entries(FONT_FAMILIES).map(([key, font]) => (
                                        <option key={key} value={key} title={font.description}>{font.name}</option>
                                    ))}
                                </Select>
                                <p className="text-xs text-gray-500 mt-1">
                                    {FONT_FAMILIES[exportOptions.typography.fontFamily].description}
                                </p>
                            </div>

                            {/* Font Size */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Font Size (pt)</label>
                                <Input
                                    type="number"
                                    min="8"
                                    max="18"
                                    step="0.5"
                                    value={exportOptions.typography.fontSize}
                                    onChange={(e) => setExportOptions(prev => ({
                                        ...prev,
                                        typography: { ...prev.typography, fontSize: parseFloat(e.target.value) }
                                    }))}
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    Standard book sizes: 10-12pt
                                </p>
                            </div>

                            {/* Paper Color */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Paper Color</label>
                                <Select
                                    value={exportOptions.typography.paperColor}
                                    onChange={(e) => setExportOptions(prev => ({
                                        ...prev,
                                        typography: { ...prev.typography, paperColor: e.target.value as PaperColor }
                                    }))}
                                >
                                    {Object.entries(PAPER_COLORS).map(([key, color]) => (
                                        <option key={key} value={key} title={color.description}>{color.name}</option>
                                    ))}
                                </Select>
                                <p className="text-xs text-gray-500 mt-1">
                                    {PAPER_COLORS[exportOptions.typography.paperColor].description}
                                </p>
                            </div>

                            {/* Line Height */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Line Height</label>
                                <Input
                                    type="number"
                                    min="1.0"
                                    max="2.5"
                                    step="0.1"
                                    value={exportOptions.typography.lineHeight}
                                    onChange={(e) => setExportOptions(prev => ({
                                        ...prev,
                                        typography: { ...prev.typography, lineHeight: parseFloat(e.target.value) }
                                    }))}
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    1.6 is optimal for readability
                                </p>
                            </div>

                            {/* Paragraph Spacing */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Paragraph Spacing</label>
                                <Input
                                    type="number"
                                    min="0.5"
                                    max="3.0"
                                    step="0.1"
                                    value={exportOptions.typography.paragraphSpacing}
                                    onChange={(e) => setExportOptions(prev => ({
                                        ...prev,
                                        typography: { ...prev.typography, paragraphSpacing: parseFloat(e.target.value) }
                                    }))}
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    Space between paragraphs (em)
                                </p>
                            </div>

                            {/* Chapter Spacing */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Chapter Spacing</label>
                                <Input
                                    type="number"
                                    min="1.0"
                                    max="5.0"
                                    step="0.1"
                                    value={exportOptions.typography.chapterSpacing}
                                    onChange={(e) => setExportOptions(prev => ({
                                        ...prev,
                                        typography: { ...prev.typography, chapterSpacing: parseFloat(e.target.value) }
                                    }))}
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    Space before chapter titles (em)
                                </p>
                            </div>
                        </div>

                        {/* Typography Features */}
                        <div className="mt-4">
                            <h5 className="text-sm font-medium text-gray-700 mb-3">Professional Features</h5>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <label className="flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={exportOptions.typography.dropCaps}
                                        onChange={(e) => setExportOptions(prev => ({
                                            ...prev,
                                            typography: { ...prev.typography, dropCaps: e.target.checked }
                                        }))}
                                        className="mr-2"
                                    />
                                    <span className="text-sm text-gray-700">Drop Caps</span>
                                </label>
                                <label className="flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={exportOptions.typography.pageNumbers}
                                        onChange={(e) => setExportOptions(prev => ({
                                            ...prev,
                                            typography: { ...prev.typography, pageNumbers: e.target.checked }
                                        }))}
                                        className="mr-2"
                                    />
                                    <span className="text-sm text-gray-700">Page Numbers</span>
                                </label>
                                <label className="flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={exportOptions.typography.headers}
                                        onChange={(e) => setExportOptions(prev => ({
                                            ...prev,
                                            typography: { ...prev.typography, headers: e.target.checked }
                                        }))}
                                        className="mr-2"
                                    />
                                    <span className="text-sm text-gray-700">Running Headers</span>
                                </label>
                            </div>
                        </div>

                        {/* Margin Controls */}
                        <div className="mt-4">
                            <h5 className="text-sm font-medium text-gray-700 mb-3">Margins (points)</h5>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div>
                                    <label className="block text-xs text-gray-600 mb-1">Top</label>
                                    <Input
                                        type="number"
                                        min="36"
                                        max="144"
                                        value={exportOptions.typography.margins.top}
                                        onChange={(e) => setExportOptions(prev => ({
                                            ...prev,
                                            typography: {
                                                ...prev.typography,
                                                margins: { ...prev.typography.margins, top: parseInt(e.target.value) }
                                            }
                                        }))}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-600 mb-1">Bottom</label>
                                    <Input
                                        type="number"
                                        min="36"
                                        max="144"
                                        value={exportOptions.typography.margins.bottom}
                                        onChange={(e) => setExportOptions(prev => ({
                                            ...prev,
                                            typography: {
                                                ...prev.typography,
                                                margins: { ...prev.typography.margins, bottom: parseInt(e.target.value) }
                                            }
                                        }))}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-600 mb-1">Left</label>
                                    <Input
                                        type="number"
                                        min="36"
                                        max="144"
                                        value={exportOptions.typography.margins.left}
                                        onChange={(e) => setExportOptions(prev => ({
                                            ...prev,
                                            typography: {
                                                ...prev.typography,
                                                margins: { ...prev.typography.margins, left: parseInt(e.target.value) }
                                            }
                                        }))}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-600 mb-1">Right</label>
                                    <Input
                                        type="number"
                                        min="36"
                                        max="144"
                                        value={exportOptions.typography.margins.right}
                                        onChange={(e) => setExportOptions(prev => ({
                                            ...prev,
                                            typography: {
                                                ...prev.typography,
                                                margins: { ...prev.typography.margins, right: parseInt(e.target.value) }
                                            }
                                        }))}
                                    />
                                </div>
                            </div>
                            <p className="text-xs text-gray-500 mt-2">
                                Standard margins: 72pt (1 inch). Adjust for binding requirements.
                            </p>
                        </div>
                    </div>
                )}

                {/* Advanced Options */}
                <div className="mt-6">
                    <Button
                        variant="ghost"
                        onClick={() => setShowAdvanced(!showAdvanced)}
                        className="mb-4"
                    >
                        <CogIcon className="w-4 h-4 mr-2" />
                        {showAdvanced ? 'Hide' : 'Show'} Advanced Options
                    </Button>

                    {showAdvanced && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-100/50 rounded-lg">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Publisher</label>
                                <Input
                                    value={exportOptions.publisher || ''}
                                    onChange={(e) => setExportOptions(prev => ({ ...prev, publisher: e.target.value }))}
                                    placeholder="Publisher Name"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Publication Date</label>
                                <Input
                                    type="date"
                                    value={exportOptions.publicationDate || ''}
                                    onChange={(e) => setExportOptions(prev => ({ ...prev, publicationDate: e.target.value }))}
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-2">ISBN (Optional)</label>
                                <Input
                                    value={exportOptions.isbn || ''}
                                    onChange={(e) => setExportOptions(prev => ({ ...prev, isbn: e.target.value }))}
                                    placeholder="978-0-123456-78-9"
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Custom CSS (Advanced)</label>
                                <textarea
                                    value={exportOptions.customCSS || ''}
                                    onChange={(e) => setExportOptions(prev => ({ ...prev, customCSS: e.target.value }))}
                                    placeholder="Add custom CSS styles..."
                                    className="w-full p-3 bg-white border border-gray-300 rounded resize-none text-sm font-mono"
                                    rows={4}
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    Add custom styles for advanced formatting control
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </Card>

            {/* Export Button */}
            <Card className="p-6">
                <div className="text-center">
                    <Button
                        onClick={handleExport}
                        disabled={isExporting || !project}
                        className="w-full max-w-md mx-auto"
                        size="lg"
                    >
                        {isExporting ? (
                            <div className="flex items-center">
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                                {exportOptions.format === 'epub' && 'Generating EPUB...'}
                                {exportOptions.format === 'html' && 'Generating HTML...'}
                                {exportOptions.format === 'docx' && 'Generating Word Document...'}
                                {exportOptions.format === 'pdf' && 'Generating PDF...'}
                            </div>
                        ) : (
                            <div className="flex items-center">
                                {exportOptions.format === 'epub' && <BookOpenIcon className="w-5 h-5 mr-2" />}
                                {exportOptions.format === 'html' && <DocumentIcon className="w-5 h-5 mr-2" />}
                                {exportOptions.format === 'docx' && <DocumentIcon className="w-5 h-5 mr-2" />}
                                {exportOptions.format === 'pdf' && <ArrowDownOnSquareIcon className="w-5 h-5 mr-2" />}
                                Export as {exportOptions.format === 'docx' ? 'DOCX' : exportOptions.format.toUpperCase()}
                            </div>
                        )}
                    </Button>
                    <p className="text-sm text-gray-600 mt-3">
                        {exportOptions.format === 'pdf' && 'Generate a print-ready PDF with professional formatting'}
                        {exportOptions.format === 'epub' && 'Create an ebook compatible with all major e-readers'}
                        {exportOptions.format === 'docx' && 'Create a Microsoft Word document for traditional publishing workflows'}
                        {exportOptions.format === 'html' && 'Export as a web page for online reading and sharing'}
                    </p>
                </div>
            </Card>

            {/* Export Info */}
            <Card className="p-4">
                <div className="text-sm text-gray-600 space-y-2">
                    <div className="flex justify-between">
                        <span>Chapters:</span>
                        <span>{project?.chapters.length || 0}</span>
                    </div>
                    {exportOptions.includeImages && (
                        <div className="flex justify-between">
                            <span>Generated Images:</span>
                            <span>{project?.generatedImages?.length || 0}</span>
                        </div>
                    )}
                    {exportOptions.includeVisuals && (
                        <div className="flex justify-between">
                            <span>Diagrams:</span>
                            <span>{project?.visuals?.length || 0}</span>
                        </div>
                    )}
                    <div className="flex justify-between font-medium text-gray-700 border-t border-gray-300 pt-2">
                        <span>Total Word Count:</span>
                        <span>
                            {project?.chapters.reduce((total, chapter) => 
                                total + (chapter.content?.split(' ').length || 0), 0
                            ).toLocaleString() || 0} words
                        </span>
                    </div>
                </div>
            </Card>
        </div>
    );
};