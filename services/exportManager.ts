/**
 * Export Manager
 * 
 * Handles exporting manuscripts to various formats (DOCX, PDF, EPUB)
 * using client-side libraries for Vercel compatibility.
 */

import { logger } from './logger';
import { toast } from './toast';
import type { Project, Chapter } from '../types';

export interface ExportOptions {
  format: 'docx' | 'pdf' | 'epub';
  includeChapters: string[];  // Chapter IDs
  includeMetadata: boolean;
  includeTOC: boolean;
  includeImages: boolean;
  includeVisuals: boolean;
  
  // Format-specific options
  docx?: {
    pageSize: 'A4' | 'Letter';
    margins: { top: number; bottom: number; left: number; right: number };
    fontSize: number;
    fontFamily: string;
  };
  
  pdf?: {
    pageSize: 'A4' | 'Letter';
    margins: { top: number; bottom: number; left: number; right: number };
    includePageNumbers: boolean;
    headerText?: string;
    footerText?: string;
  };
  
  epub?: {
    author: string;
    publisher?: string;
    isbn?: string;
    language: string;
    coverImage?: string;
  };
}

class ExportManager {
  /**
   * Export to DOCX format
   */
  async exportToDOCX(project: Project, options: ExportOptions): Promise<Blob> {
    try {
      logger.info('Starting DOCX export', { projectId: project.id });
      
      // Dynamic import to reduce bundle size
      const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, convertInchesToTwip } = await import('docx');
      
      const docxOptions = options.docx || {
        pageSize: 'Letter',
        margins: { top: 1, bottom: 1, left: 1, right: 1 },
        fontSize: 12,
        fontFamily: 'Times New Roman'
      };

      // Build document content
      const children: any[] = [];

      // Title page
      if (options.includeMetadata) {
        children.push(
          new Paragraph({
            text: project.title,
            heading: HeadingLevel.TITLE,
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 }
          }),
          new Paragraph({
            text: `Genre: ${project.genre}`,
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 }
          }),
          new Paragraph({
            text: `Created: ${new Date(project.createdAt).toLocaleDateString()}`,
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 }
          }),
          new Paragraph({
            text: '',
            pageBreakBefore: true
          })
        );
      }

      // Table of contents
      if (options.includeTOC) {
        children.push(
          new Paragraph({
            text: 'Table of Contents',
            heading: HeadingLevel.HEADING_1,
            spacing: { after: 200 }
          })
        );

        const selectedChapters = project.chapters
          .filter(ch => options.includeChapters.includes(ch.id))
          .sort((a, b) => a.order - b.order);

        selectedChapters.forEach((chapter, index) => {
          children.push(
            new Paragraph({
              text: `${index + 1}. ${chapter.title}`,
              spacing: { after: 100 }
            })
          );
        });

        children.push(
          new Paragraph({
            text: '',
            pageBreakBefore: true
          })
        );
      }

      // Chapters
      const selectedChapters = project.chapters
        .filter(ch => options.includeChapters.includes(ch.id))
        .sort((a, b) => a.order - b.order);

      for (const chapter of selectedChapters) {
        // Chapter title
        children.push(
          new Paragraph({
            text: chapter.title,
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 400, after: 200 }
          })
        );

        // Parse HTML content and convert to DOCX paragraphs
        const paragraphs = this.parseHTMLToDOCX(chapter.content, docxOptions);
        children.push(...paragraphs);

        // Page break after chapter (except last)
        if (chapter !== selectedChapters[selectedChapters.length - 1]) {
          children.push(
            new Paragraph({
              text: '',
              pageBreakBefore: true
            })
          );
        }
      }

      // Create document
      const doc = new Document({
        sections: [{
          properties: {
            page: {
              margin: {
                top: convertInchesToTwip(docxOptions.margins.top),
                bottom: convertInchesToTwip(docxOptions.margins.bottom),
                left: convertInchesToTwip(docxOptions.margins.left),
                right: convertInchesToTwip(docxOptions.margins.right)
              }
            }
          },
          children
        }]
      });

      // Generate blob
      const blob = await Packer.toBlob(doc);
      
      logger.info('DOCX export completed', { 
        projectId: project.id,
        size: blob.size 
      });
      
      return blob;
    } catch (error) {
      logger.error('DOCX export failed', error);
      throw new Error('Failed to export to DOCX format');
    }
  }

  /**
   * Export to PDF format
   */
  async exportToPDF(project: Project, options: ExportOptions): Promise<Blob> {
    try {
      logger.info('Starting PDF export', { projectId: project.id });
      
      // Dynamic import
      const { jsPDF } = await import('jspdf');
      
      const pdfOptions = options.pdf || {
        pageSize: 'Letter',
        margins: { top: 1, bottom: 1, left: 1, right: 1 },
        includePageNumbers: true
      };

      // Create PDF document
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'in',
        format: pdfOptions.pageSize.toLowerCase() as any
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margins = pdfOptions.margins;
      const contentWidth = pageWidth - margins.left - margins.right;
      const contentHeight = pageHeight - margins.top - margins.bottom;

      let currentY = margins.top;
      let currentPage = 1;

      // Helper function to add new page
      const addNewPage = () => {
        doc.addPage();
        currentPage++;
        currentY = margins.top;
      };

      // Helper function to check if we need a new page
      const checkPageBreak = (requiredSpace: number) => {
        if (currentY + requiredSpace > pageHeight - margins.bottom) {
          addNewPage();
        }
      };

      // Title page
      if (options.includeMetadata) {
        doc.setFontSize(24);
        doc.setFont('helvetica', 'bold');
        const titleLines = doc.splitTextToSize(project.title, contentWidth);
        const titleHeight = titleLines.length * 0.4;
        currentY = (pageHeight - titleHeight) / 2;
        doc.text(titleLines, pageWidth / 2, currentY, { align: 'center' });
        
        currentY += titleHeight + 0.5;
        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        doc.text(`Genre: ${project.genre}`, pageWidth / 2, currentY, { align: 'center' });
        
        currentY += 0.3;
        doc.text(`Created: ${new Date(project.createdAt).toLocaleDateString()}`, pageWidth / 2, currentY, { align: 'center' });
        
        addNewPage();
      }

      // Table of contents
      if (options.includeTOC) {
        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.text('Table of Contents', margins.left, currentY);
        currentY += 0.5;

        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');

        const selectedChapters = project.chapters
          .filter(ch => options.includeChapters.includes(ch.id))
          .sort((a, b) => a.order - b.order);

        selectedChapters.forEach((chapter, index) => {
          checkPageBreak(0.3);
          doc.text(`${index + 1}. ${chapter.title}`, margins.left + 0.2, currentY);
          currentY += 0.3;
        });

        addNewPage();
      }

      // Chapters
      const selectedChapters = project.chapters
        .filter(ch => options.includeChapters.includes(ch.id))
        .sort((a, b) => a.order - b.order);

      for (const chapter of selectedChapters) {
        // Chapter title
        checkPageBreak(0.5);
        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.text(chapter.title, margins.left, currentY);
        currentY += 0.5;

        // Chapter content
        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        
        const plainText = this.stripHTML(chapter.content);
        const lines = doc.splitTextToSize(plainText, contentWidth);
        
        for (const line of lines) {
          checkPageBreak(0.25);
          doc.text(line, margins.left, currentY);
          currentY += 0.25;
        }

        // Add space after chapter
        currentY += 0.5;
      }

      // Add page numbers
      if (pdfOptions.includePageNumbers) {
        const totalPages = doc.getNumberOfPages();
        for (let i = 1; i <= totalPages; i++) {
          doc.setPage(i);
          doc.setFontSize(10);
          doc.text(
            `${i}`,
            pageWidth / 2,
            pageHeight - margins.bottom / 2,
            { align: 'center' }
          );
        }
      }

      // Generate blob
      const blob = doc.output('blob');
      
      logger.info('PDF export completed', { 
        projectId: project.id,
        size: blob.size 
      });
      
      return blob;
    } catch (error) {
      logger.error('PDF export failed', error);
      throw new Error('Failed to export to PDF format');
    }
  }

  /**
   * Export to EPUB format
   */
  async exportToEPUB(project: Project, options: ExportOptions): Promise<Blob> {
    try {
      logger.info('Starting EPUB export', { projectId: project.id });
      
      const epubOptions = options.epub || {
        author: 'Unknown Author',
        language: 'en'
      };

      // Prepare chapters for EPUB
      const selectedChapters = project.chapters
        .filter(ch => options.includeChapters.includes(ch.id))
        .sort((a, b) => a.order - b.order);

      // For now, create a simple HTML-based EPUB structure
      // The existing ExportTab.tsx has a full EPUB implementation
      // This is a simplified version for the exportManager service
      
      const htmlContent = selectedChapters.map(chapter => `
        <div class="chapter">
          <h1>${chapter.title}</h1>
          ${chapter.content || '<p>No content</p>'}
        </div>
      `).join('\n');

      const epubHTML = `
        <!DOCTYPE html>
        <html lang="${epubOptions.language}">
        <head>
          <meta charset="UTF-8">
          <title>${project.title}</title>
          <meta name="author" content="${epubOptions.author}">
        </head>
        <body>
          <h1>${project.title}</h1>
          <p>By ${epubOptions.author}</p>
          ${htmlContent}
        </body>
        </html>
      `;

      const blob = new Blob([epubHTML], { type: 'application/epub+zip' });
      
      logger.info('EPUB export completed', { 
        projectId: project.id,
        size: blob.size 
      });
      
      logger.warn('EPUB export using simplified HTML format. For full EPUB support, use the ExportTab component.');
      
      return blob;
    } catch (error) {
      logger.error('EPUB export failed', error);
      throw new Error('Failed to export to EPUB format');
    }
  }

  /**
   * Parse HTML content to DOCX paragraphs
   */
  private parseHTMLToDOCX(html: string, options: any): any[] {
    // This is a simplified HTML parser for DOCX
    // In production, you might want to use a proper HTML parser
    
    const paragraphs: any[] = [];
    
    // Import DOCX classes dynamically
    import('docx').then(({ Paragraph, TextRun }) => {
      // Remove HTML tags and split into paragraphs
      const text = this.stripHTML(html);
      const lines = text.split('\n').filter(line => line.trim());
      
      lines.forEach(line => {
        paragraphs.push(
          new Paragraph({
            children: [
              new TextRun({
                text: line,
                size: options.fontSize * 2, // DOCX uses half-points
                font: options.fontFamily
              })
            ],
            spacing: { after: 200 }
          })
        );
      });
    });

    // Fallback: return simple paragraphs
    if (paragraphs.length === 0) {
      const text = this.stripHTML(html);
      const lines = text.split('\n').filter(line => line.trim());
      
      return lines.map(line => ({
        text: line,
        spacing: { after: 200 }
      }));
    }

    return paragraphs;
  }

  /**
   * Strip HTML tags from content
   */
  private stripHTML(html: string): string {
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  }

  /**
   * Download a blob as a file
   */
  downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    logger.info('File downloaded', { filename, size: blob.size });
  }

  /**
   * Generate filename for export
   */
  generateFilename(project: Project, format: string): string {
    const sanitizedTitle = project.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const timestamp = new Date().toISOString().split('T')[0];
    return `${sanitizedTitle}_${timestamp}.${format}`;
  }

  /**
   * Validate export options
   */
  validateOptions(options: ExportOptions): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!options.includeChapters || options.includeChapters.length === 0) {
      errors.push('Please select at least one chapter to export');
    }

    if (options.format === 'epub' && options.epub) {
      if (!options.epub.author) {
        errors.push('Author name is required for EPUB export');
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

// Export singleton instance
export const exportManager = new ExportManager();
