import React, { useState, useRef, useCallback } from 'react';
import { useBookCraftStore } from '../../store/useStore';
import { Button, Spinner } from '../UI';
import { 
    PhotoIcon, 
    SparklesIcon, 
    ArrowDownTrayIcon,
    SwatchIcon,
    AdjustmentsHorizontalIcon,
    DocumentDuplicateIcon,
    EyeIcon,
    PaintBrushIcon
} from '../Icons';

type BookFormat = 'ebook' | 'paperback' | 'hardback';
type CoverStyle = 'modern' | 'classic' | 'minimalist' | 'bold' | 'artistic' | 'professional';
type TypographyStyle = 'serif' | 'sans-serif' | 'display' | 'script' | 'monospace';
type LayoutType = 'centered' | 'top-heavy' | 'bottom-heavy' | 'asymmetric' | 'split';

interface AdvancedOptions {
    typography: TypographyStyle;
    layout: LayoutType;
    includePattern: boolean;
    includeGradient: boolean;
    borderStyle: 'none' | 'simple' | 'ornate' | 'modern';
    textShadow: boolean;
    logoPlacement: 'none' | 'top' | 'bottom';
}

interface CoverDimensions {
    width: number;
    height: number;
    dpi: number;
    description: string;
}

const COVER_DIMENSIONS: Record<BookFormat, CoverDimensions> = {
    ebook: {
        width: 1600,
        height: 2560,
        dpi: 300,
        description: 'Digital format - 1600×2560px (5.33×8.53 inches at 300 DPI)'
    },
    paperback: {
        width: 1500,
        height: 2250,
        dpi: 300,
        description: 'Print format - 1500×2250px (5×7.5 inches at 300 DPI)'
    },
    hardback: {
        width: 1800,
        height: 2700,
        dpi: 300,
        description: 'Premium print - 1800×2700px (6×9 inches at 300 DPI)'
    }
};

const TYPOGRAPHY_STYLES: Record<TypographyStyle, { name: string; fonts: string[]; description: string }> = {
    serif: {
        name: 'Serif',
        fonts: ['Georgia', 'Times New Roman', 'Baskerville', 'serif'],
        description: 'Traditional, elegant, readable for literature'
    },
    'sans-serif': {
        name: 'Sans-Serif', 
        fonts: ['Helvetica', 'Arial', 'Futura', 'sans-serif'],
        description: 'Clean, modern, versatile for any genre'
    },
    display: {
        name: 'Display',
        fonts: ['Impact', 'Bebas Neue', 'Oswald', 'cursive'],
        description: 'Bold, attention-grabbing for titles'
    },
    script: {
        name: 'Script',
        fonts: ['Dancing Script', 'Great Vibes', 'Pacifico', 'cursive'],
        description: 'Elegant, flowing for romance or poetry'
    },
    monospace: {
        name: 'Monospace',
        fonts: ['Courier New', 'Monaco', 'Consolas', 'monospace'],
        description: 'Technical, retro for sci-fi or thrillers'
    }
};

const LAYOUT_TYPES: Record<LayoutType, { name: string; description: string }> = {
    centered: { name: 'Centered', description: 'Balanced, symmetrical layout' },
    'top-heavy': { name: 'Top Heavy', description: 'Title dominates the upper portion' },
    'bottom-heavy': { name: 'Bottom Heavy', description: 'Focus on lower portion with large author name' },
    asymmetric: { name: 'Asymmetric', description: 'Off-center, dynamic positioning' },
    split: { name: 'Split', description: 'Divided layout with distinct sections' }
};

const COVER_STYLES: Record<CoverStyle, { name: string; description: string; colors: string[] }> = {
    modern: {
        name: 'Modern',
        description: 'Clean lines, contemporary typography, gradient backgrounds',
        colors: ['#667eea', '#764ba2', '#f093fb', '#f5576c', '#4facfe', '#00f2fe']
    },
    classic: {
        name: 'Classic',
        description: 'Traditional serif fonts, ornate borders, elegant colors',
        colors: ['#8B4513', '#DAA520', '#2F4F4F', '#8B0000', '#191970', '#556B2F']
    },
    minimalist: {
        name: 'Minimalist',
        description: 'Simple typography, lots of white space, subtle colors',
        colors: ['#000000', '#FFFFFF', '#F5F5F5', '#E0E0E0', '#2C2C2C', '#4A4A4A']
    },
    bold: {
        name: 'Bold',
        description: 'Strong contrasts, vibrant colors, impactful fonts',
        colors: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD']
    },
    artistic: {
        name: 'Artistic',
        description: 'Creative layouts, mixed media effects, artistic elements',
        colors: ['#FF7675', '#74B9FF', '#00B894', '#FDCB6E', '#E17055', '#A29BFE']
    },
    professional: {
        name: 'Professional',
        description: 'Business-appropriate, clean, trustworthy design',
        colors: ['#2C3E50', '#3498DB', '#34495E', '#7F8C8D', '#2980B9', '#34495E']
    }
};

export const CoverCreator: React.FC = () => {
    const [bookFormat, setBookFormat] = useState<BookFormat>('ebook');
    const [coverStyle, setCoverStyle] = useState<CoverStyle>('modern');
    const [isGenerating, setIsGenerating] = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    const [generatedCover, setGeneratedCover] = useState<string | null>(null);
    const [customPrompt, setCustomPrompt] = useState('');
    
    // Custom design options
    const [backgroundColor, setBackgroundColor] = useState('#667eea');
    const [textColor, setTextColor] = useState('#FFFFFF');
    const [title, setTitle] = useState('');
    const [author, setAuthor] = useState('');
    const [subtitle, setSubtitle] = useState('');
    const [showAdvanced, setShowAdvanced] = useState(false);
    
    // Advanced design options
    const [advancedOptions, setAdvancedOptions] = useState<AdvancedOptions>({
        typography: 'serif',
        layout: 'centered',
        includePattern: false,
        includeGradient: true,
        borderStyle: 'none',
        textShadow: false,
        logoPlacement: 'none'
    });
    
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const generateImage = useBookCraftStore(state => state.generateImage);
    const startAIProcess = useBookCraftStore(state => state.startAIProcess);
    const endAIProcess = useBookCraftStore(state => state.endAIProcess);
    const activeProject = useBookCraftStore(state => 
        state.activeProjectId ? state.projects[state.activeProjectId] : null
    );

    React.useEffect(() => {
        if (activeProject && !title) {
            setTitle(activeProject.title);
        }
    }, [activeProject, title]);

    const dimensions = COVER_DIMENSIONS[bookFormat];
    const styleInfo = COVER_STYLES[coverStyle];

    const handleGenerateAICover = async () => {
        if (!title.trim()) {
            alert('Please enter a book title');
            return;
        }

        setIsGenerating(true);
        const processId = 'cover-generation';
        startAIProcess(
            processId, 
            'Generating Book Cover', 
            'visual', 
            `Creating ${bookFormat} cover in ${styleInfo.name.toLowerCase()} style`
        );

        try {
            // Build AI prompt for cover generation
            const genreContext = activeProject ? `Genre: ${activeProject.genre}` : '';
            const basePrompt = customPrompt.trim() || 
                `Create a professional book cover for "${title}" ${subtitle ? `with subtitle "${subtitle}"` : ''} ${author ? `by ${author}` : ''}. ${genreContext}`;
            
            const stylePrompt = `${basePrompt}. Style: ${styleInfo.description}. Format: ${bookFormat} book cover. High quality, professional design, ${dimensions.description}. Include title text prominently.`;
            
            await generateImage(stylePrompt);
            setShowPreview(true);
            
            // Generate canvas preview
            generateCanvasPreview();
            
        } catch (error) {
            console.error('Cover generation failed:', error);
            alert('Failed to generate cover. Please try again.');
        } finally {
            setIsGenerating(false);
            endAIProcess(processId);
        }
    };

    const generateCanvasPreview = useCallback(() => {
        const canvas = document.createElement('canvas');
        canvas.width = dimensions.width;
        canvas.height = dimensions.height;
        const ctx = canvas.getContext('2d');
        
        if (!ctx) return;
        
        // Set high quality rendering
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        
        // Generate background
        generateBackground(ctx, canvas.width, canvas.height);
        
        // Add decorative elements
        if (advancedOptions.includePattern) {
            addPattern(ctx, canvas.width, canvas.height);
        }
        
        // Add border if selected
        if (advancedOptions.borderStyle !== 'none') {
            addBorder(ctx, canvas.width, canvas.height);
        }
        
        // Position text based on layout
        const textPositions = calculateTextPositions(canvas.width, canvas.height, advancedOptions.layout);
        
        // Typography settings
        const fontFamily = TYPOGRAPHY_STYLES[advancedOptions.typography].fonts[0];
        
        // Draw title
        drawTitle(ctx, title, textPositions.title, fontFamily, canvas.width);
        
        // Draw subtitle if exists
        if (subtitle) {
            drawSubtitle(ctx, subtitle, textPositions.subtitle, fontFamily, canvas.width);
        }
        
        // Draw author
        if (author) {
            drawAuthor(ctx, author, textPositions.author, fontFamily, canvas.width);
        }
        
        // Add finishing touches
        if (advancedOptions.textShadow) {
            // Text shadow is applied during text drawing
        }
        
        setGeneratedCover(canvas.toDataURL('image/png', 0.95));
    }, [dimensions, backgroundColor, textColor, title, subtitle, author, advancedOptions]);
    
    // Helper functions for advanced cover generation
    const generateBackground = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
        if (advancedOptions.includeGradient) {
            const gradient = ctx.createLinearGradient(0, 0, width, height);
            gradient.addColorStop(0, backgroundColor);
            gradient.addColorStop(1, adjustColorBrightness(backgroundColor, -20));
            ctx.fillStyle = gradient;
        } else {
            ctx.fillStyle = backgroundColor;
        }
        ctx.fillRect(0, 0, width, height);
    };
    
    const addPattern = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
        ctx.globalAlpha = 0.1;
        ctx.strokeStyle = textColor;
        ctx.lineWidth = 1;
        
        // Create subtle geometric pattern
        for (let i = 0; i < width; i += 50) {
            for (let j = 0; j < height; j += 50) {
                ctx.beginPath();
                ctx.arc(i, j, 20, 0, Math.PI * 2);
                ctx.stroke();
            }
        }
        ctx.globalAlpha = 1;
    };
    
    const addBorder = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
        const borderWidth = Math.floor(width * 0.02);
        ctx.strokeStyle = textColor;
        
        switch (advancedOptions.borderStyle) {
            case 'simple':
                ctx.lineWidth = borderWidth;
                ctx.strokeRect(borderWidth, borderWidth, width - borderWidth * 2, height - borderWidth * 2);
                break;
            case 'ornate':
                ctx.lineWidth = borderWidth / 2;
                // Outer border
                ctx.strokeRect(borderWidth, borderWidth, width - borderWidth * 2, height - borderWidth * 2);
                // Inner border
                ctx.strokeRect(borderWidth * 2, borderWidth * 2, width - borderWidth * 4, height - borderWidth * 4);
                break;
            case 'modern':
                ctx.lineWidth = borderWidth;
                // Corner accents
                const accentSize = borderWidth * 3;
                ctx.beginPath();
                // Top left
                ctx.moveTo(borderWidth, borderWidth + accentSize);
                ctx.lineTo(borderWidth, borderWidth);
                ctx.lineTo(borderWidth + accentSize, borderWidth);
                // Top right
                ctx.moveTo(width - borderWidth - accentSize, borderWidth);
                ctx.lineTo(width - borderWidth, borderWidth);
                ctx.lineTo(width - borderWidth, borderWidth + accentSize);
                // Bottom right
                ctx.moveTo(width - borderWidth, height - borderWidth - accentSize);
                ctx.lineTo(width - borderWidth, height - borderWidth);
                ctx.lineTo(width - borderWidth - accentSize, height - borderWidth);
                // Bottom left
                ctx.moveTo(borderWidth + accentSize, height - borderWidth);
                ctx.lineTo(borderWidth, height - borderWidth);
                ctx.lineTo(borderWidth, height - borderWidth - accentSize);
                ctx.stroke();
                break;
        }
    };
    
    const calculateTextPositions = (width: number, height: number, layout: LayoutType) => {
        switch (layout) {
            case 'top-heavy':
                return {
                    title: { x: width / 2, y: height * 0.25 },
                    subtitle: { x: width / 2, y: height * 0.35 },
                    author: { x: width / 2, y: height * 0.85 }
                };
            case 'bottom-heavy':
                return {
                    title: { x: width / 2, y: height * 0.6 },
                    subtitle: { x: width / 2, y: height * 0.7 },
                    author: { x: width / 2, y: height * 0.85 }
                };
            case 'asymmetric':
                return {
                    title: { x: width * 0.6, y: height * 0.4 },
                    subtitle: { x: width * 0.6, y: height * 0.5 },
                    author: { x: width * 0.4, y: height * 0.85 }
                };
            case 'split':
                return {
                    title: { x: width / 2, y: height * 0.3 },
                    subtitle: { x: width / 2, y: height * 0.7 },
                    author: { x: width / 2, y: height * 0.85 }
                };
            default: // centered
                return {
                    title: { x: width / 2, y: height * 0.4 },
                    subtitle: { x: width / 2, y: height * 0.5 },
                    author: { x: width / 2, y: height * 0.85 }
                };
        }
    };
    
    const drawTitle = (ctx: CanvasRenderingContext2D, text: string, pos: {x: number, y: number}, fontFamily: string, canvasWidth: number) => {
        const fontSize = Math.floor(canvasWidth * 0.08);
        ctx.font = `bold ${fontSize}px ${fontFamily}`;
        ctx.fillStyle = textColor;
        ctx.textAlign = 'center';
        
        if (advancedOptions.textShadow) {
            ctx.shadowColor = 'rgba(0,0,0,0.5)';
            ctx.shadowOffsetX = 3;
            ctx.shadowOffsetY = 3;
            ctx.shadowBlur = 5;
        }
        
        // Handle text wrapping for long titles
        const maxWidth = canvasWidth * 0.8;
        wrapText(ctx, text.toUpperCase(), pos.x, pos.y, maxWidth, fontSize * 1.2);
        
        ctx.shadowColor = 'transparent';
    };
    
    const drawSubtitle = (ctx: CanvasRenderingContext2D, text: string, pos: {x: number, y: number}, fontFamily: string, canvasWidth: number) => {
        const fontSize = Math.floor(canvasWidth * 0.04);
        ctx.font = `${fontSize}px ${fontFamily}`;
        ctx.fillStyle = adjustColorBrightness(textColor, -10);
        ctx.textAlign = 'center';
        
        const maxWidth = canvasWidth * 0.7;
        wrapText(ctx, text, pos.x, pos.y, maxWidth, fontSize * 1.3);
    };
    
    const drawAuthor = (ctx: CanvasRenderingContext2D, text: string, pos: {x: number, y: number}, fontFamily: string, canvasWidth: number) => {
        const fontSize = Math.floor(canvasWidth * 0.05);
        ctx.font = `${fontSize}px ${fontFamily}`;
        ctx.fillStyle = textColor;
        ctx.textAlign = 'center';
        
        ctx.fillText(text.toUpperCase(), pos.x, pos.y);
    };
    
    const wrapText = (ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number) => {
        const words = text.split(' ');
        let line = '';
        let currentY = y;
        
        for (let n = 0; n < words.length; n++) {
            const testLine = line + words[n] + ' ';
            const metrics = ctx.measureText(testLine);
            const testWidth = metrics.width;
            
            if (testWidth > maxWidth && n > 0) {
                ctx.fillText(line, x, currentY);
                line = words[n] + ' ';
                currentY += lineHeight;
            } else {
                line = testLine;
            }
        }
        ctx.fillText(line, x, currentY);
    };
    
    const adjustColorBrightness = (color: string, amount: number): string => {
        const num = parseInt(color.replace('#', ''), 16);
        const amt = Math.round(2.55 * amount);
        const R = (num >> 16) + amt;
        const G = (num >> 8 & 0x00FF) + amt;
        const B = (num & 0x0000FF) + amt;
        return '#' + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
            (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
            (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
    };

    const handleGenerateManualCover = () => {
        if (!title.trim()) {
            alert('Please enter a book title');
            return;
        }
        generateCanvasPreview();
        setShowPreview(true);
    };
    
    const handleDownload = (format: 'png' | 'jpg' | 'pdf' = 'png') => {
        if (!generatedCover) return;
        
        const filename = `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${bookFormat}_cover`;
        
        if (format === 'pdf') {
            // For PDF, we'll create a simple PDF with the image
            downloadAsPDF(filename);
        } else {
            const link = document.createElement('a');
            link.download = `${filename}.${format}`;
            
            if (format === 'jpg') {
                // Convert PNG to JPG
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                const img = new Image();
                
                img.onload = () => {
                    canvas.width = img.width;
                    canvas.height = img.height;
                    ctx!.fillStyle = '#FFFFFF';
                    ctx!.fillRect(0, 0, canvas.width, canvas.height);
                    ctx!.drawImage(img, 0, 0);
                    link.href = canvas.toDataURL('image/jpeg', 0.95);
                    link.click();
                };
                img.src = generatedCover;
            } else {
                link.href = generatedCover;
                link.click();
            }
        }
    };
    
    const downloadAsPDF = (filename: string) => {
        // Simple PDF generation - in a production app, you'd use a library like jsPDF
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();
        
        img.onload = () => {
            // Create a basic PDF-like download
            const link = document.createElement('a');
            link.download = `${filename}_print_ready.png`;
            link.href = generatedCover;
            link.click();
            
            // Show print instructions
            alert('Cover downloaded! For print-ready PDF, please use professional design software or contact your printer with this high-resolution image.');
        };
        img.src = generatedCover;
    };

    const handleFormatChange = (format: BookFormat) => {
        setBookFormat(format);
        setShowPreview(false);
        setGeneratedCover(null);
    };

    return (
        <div className="bg-slate-800/50 rounded-lg border border-slate-700/50 p-6">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <PaintBrushIcon className="w-6 h-6 text-purple-400" />
                    <div>
                        <h2 className="text-xl font-bold text-slate-200">Cover Creator</h2>
                        <p className="text-sm text-slate-400">Design professional book covers with AI generation or manual creation tools</p>
                    </div>
                </div>
            </div>

            <div className="space-y-6">
                {/* Book Format Selection */}
                <div>
                    <label className="block text-sm font-medium text-slate-300 mb-3">Book Format</label>
                    <div className="grid grid-cols-3 gap-3">
                        {Object.entries(COVER_DIMENSIONS).map(([format, info]) => (
                            <button
                                key={format}
                                onClick={() => handleFormatChange(format as BookFormat)}
                                className={`p-4 rounded-lg border-2 transition-all text-left ${
                                    bookFormat === format
                                        ? 'border-purple-500 bg-purple-500/20 text-purple-200'
                                        : 'border-slate-600 bg-slate-700/50 text-slate-300 hover:border-slate-500'
                                }`}
                            >
                                <div className="font-semibold capitalize mb-1">{format}</div>
                                <div className="text-xs text-slate-400">
                                    {info.width}×{info.height}px
                                </div>
                                <div className="text-xs text-slate-500 mt-1">
                                    {format === 'ebook' ? 'Digital' : format === 'paperback' ? 'Print' : 'Premium'}
                                </div>
                            </button>
                        ))}
                    </div>
                    <p className="text-xs text-slate-400 mt-2">{dimensions.description}</p>
                </div>

                {/* Book Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="cover-title" className="block text-sm font-medium text-slate-300 mb-2">
                            Book Title *
                        </label>
                        <input
                            type="text"
                            id="cover-title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Enter book title"
                            className="w-full bg-slate-700 border-slate-600 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 text-white placeholder-slate-400 p-3"
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="cover-author" className="block text-sm font-medium text-slate-300 mb-2">
                            Author Name
                        </label>
                        <input
                            type="text"
                            id="cover-author"
                            value={author}
                            onChange={(e) => setAuthor(e.target.value)}
                            placeholder="Author name"
                            className="w-full bg-slate-700 border-slate-600 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 text-white placeholder-slate-400 p-3"
                        />
                    </div>
                    <div className="md:col-span-2">
                        <label htmlFor="cover-subtitle" className="block text-sm font-medium text-slate-300 mb-2">
                            Subtitle (Optional)
                        </label>
                        <input
                            type="text"
                            id="cover-subtitle"
                            value={subtitle}
                            onChange={(e) => setSubtitle(e.target.value)}
                            placeholder="Book subtitle"
                            className="w-full bg-slate-700 border-slate-600 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 text-white placeholder-slate-400 p-3"
                        />
                    </div>
                </div>

                {/* Cover Style Selection */}
                <div>
                    <div className="flex items-center justify-between mb-3">
                        <label className="block text-sm font-medium text-slate-300">Cover Style</label>
                        <button
                            onClick={() => {
                                const styleColors = COVER_STYLES[coverStyle].colors;
                                setBackgroundColor(styleColors[0]);
                                setTextColor(styleColors[1] || '#FFFFFF');
                            }}
                            className="text-xs bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded"
                        >
                            Apply Style Colors
                        </button>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {Object.entries(COVER_STYLES).map(([style, info]) => (
                            <button
                                key={style}
                                onClick={() => setCoverStyle(style as CoverStyle)}
                                className={`p-3 rounded-lg border-2 transition-all text-left ${
                                    coverStyle === style
                                        ? 'border-purple-500 bg-purple-500/20 text-purple-200'
                                        : 'border-slate-600 bg-slate-700/50 text-slate-300 hover:border-slate-500'
                                }`}
                            >
                                <div className="font-semibold mb-1">{info.name}</div>
                                <div className="text-xs text-slate-400 mb-2">{info.description}</div>
                                <div className="flex gap-1">
                                    {info.colors.slice(0, 4).map((color, idx) => (
                                        <div
                                            key={idx}
                                            className="w-3 h-3 rounded-full border border-slate-500"
                                            style={{ backgroundColor: color }}
                                        />
                                    ))}
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Color Customization */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="bg-color" className="block text-sm font-medium text-slate-300 mb-2">
                            Background Color
                        </label>
                        <div className="flex gap-2">
                            <input
                                type="color"
                                id="bg-color"
                                value={backgroundColor}
                                onChange={(e) => setBackgroundColor(e.target.value)}
                                className="w-12 h-10 rounded border-slate-600 bg-slate-700"
                            />
                            <input
                                type="text"
                                value={backgroundColor}
                                onChange={(e) => setBackgroundColor(e.target.value)}
                                className="flex-1 bg-slate-700 border-slate-600 rounded-md text-white placeholder-slate-400 px-3 py-2"
                                placeholder="#667eea"
                            />
                        </div>
                    </div>
                    <div>
                        <label htmlFor="text-color" className="block text-sm font-medium text-slate-300 mb-2">
                            Text Color
                        </label>
                        <div className="flex gap-2">
                            <input
                                type="color"
                                id="text-color"
                                value={textColor}
                                onChange={(e) => setTextColor(e.target.value)}
                                className="w-12 h-10 rounded border-slate-600 bg-slate-700"
                            />
                            <input
                                type="text"
                                value={textColor}
                                onChange={(e) => setTextColor(e.target.value)}
                                className="flex-1 bg-slate-700 border-slate-600 rounded-md text-white placeholder-slate-400 px-3 py-2"
                                placeholder="#FFFFFF"
                            />
                        </div>
                    </div>
                </div>
                
                {/* Advanced Options Toggle */}
                <div className="border-t border-slate-700 pt-6">
                    <button
                        onClick={() => setShowAdvanced(!showAdvanced)}
                        className="flex items-center gap-2 text-sm text-slate-300 hover:text-slate-200 mb-4"
                    >
                        <AdjustmentsHorizontalIcon className="w-4 h-4" />
                        Advanced Design Options
                        <span className={`transform transition-transform ${showAdvanced ? 'rotate-90' : ''}`}>▶</span>
                    </button>
                    
                    {showAdvanced && (
                        <div className="space-y-4 bg-slate-800/30 p-4 rounded-lg border border-slate-700">
                            {/* Typography Selection */}
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-3">Typography Style</label>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                    {Object.entries(TYPOGRAPHY_STYLES).map(([style, info]) => (
                                        <button
                                            key={style}
                                            onClick={() => setAdvancedOptions(prev => ({ ...prev, typography: style as TypographyStyle }))}
                                            className={`p-3 rounded-lg border text-left transition-all text-sm ${
                                                advancedOptions.typography === style
                                                    ? 'border-purple-500 bg-purple-500/20 text-purple-200'
                                                    : 'border-slate-600 bg-slate-700/50 text-slate-300 hover:border-slate-500'
                                            }`}
                                        >
                                            <div className="font-semibold mb-1">{info.name}</div>
                                            <div className="text-xs text-slate-400">{info.description}</div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                            
                            {/* Layout Selection */}
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-3">Layout Type</label>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                    {Object.entries(LAYOUT_TYPES).map(([layout, info]) => (
                                        <button
                                            key={layout}
                                            onClick={() => setAdvancedOptions(prev => ({ ...prev, layout: layout as LayoutType }))}
                                            className={`p-3 rounded-lg border text-left transition-all text-sm ${
                                                advancedOptions.layout === layout
                                                    ? 'border-purple-500 bg-purple-500/20 text-purple-200'
                                                    : 'border-slate-600 bg-slate-700/50 text-slate-300 hover:border-slate-500'
                                            }`}
                                        >
                                            <div className="font-semibold mb-1">{info.name}</div>
                                            <div className="text-xs text-slate-400">{info.description}</div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                            
                            {/* Design Elements */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">Design Elements</label>
                                    <div className="space-y-2">
                                        <label className="flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={advancedOptions.includeGradient}
                                                onChange={(e) => setAdvancedOptions(prev => ({ ...prev, includeGradient: e.target.checked }))}
                                                className="mr-2 rounded border-slate-600 bg-slate-700"
                                            />
                                            <span className="text-sm text-slate-300">Gradient Background</span>
                                        </label>
                                        <label className="flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={advancedOptions.includePattern}
                                                onChange={(e) => setAdvancedOptions(prev => ({ ...prev, includePattern: e.target.checked }))}
                                                className="mr-2 rounded border-slate-600 bg-slate-700"
                                            />
                                            <span className="text-sm text-slate-300">Decorative Pattern</span>
                                        </label>
                                        <label className="flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={advancedOptions.textShadow}
                                                onChange={(e) => setAdvancedOptions(prev => ({ ...prev, textShadow: e.target.checked }))}
                                                className="mr-2 rounded border-slate-600 bg-slate-700"
                                            />
                                            <span className="text-sm text-slate-300">Text Shadow</span>
                                        </label>
                                    </div>
                                </div>
                                
                                <div>
                                    <label htmlFor="border-style" className="block text-sm font-medium text-slate-300 mb-2">
                                        Border Style
                                    </label>
                                    <select
                                        id="border-style"
                                        value={advancedOptions.borderStyle}
                                        onChange={(e) => setAdvancedOptions(prev => ({ ...prev, borderStyle: e.target.value as any }))}
                                        className="w-full bg-slate-700 border-slate-600 rounded-md text-white p-2"
                                    >
                                        <option value="none">No Border</option>
                                        <option value="simple">Simple Border</option>
                                        <option value="ornate">Ornate Border</option>
                                        <option value="modern">Modern Accents</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Custom AI Prompt */}
                <div>
                    <label htmlFor="custom-prompt" className="block text-sm font-medium text-slate-300 mb-2">
                        Custom AI Prompt (Optional)
                    </label>
                    <textarea
                        id="custom-prompt"
                        value={customPrompt}
                        onChange={(e) => setCustomPrompt(e.target.value)}
                        placeholder="Describe specific elements you want on your cover (e.g., 'Include a mysterious forest silhouette with golden lighting')"
                        rows={3}
                        className="w-full bg-slate-700 border-slate-600 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 text-white placeholder-slate-400 p-3 resize-none"
                    />
                </div>

                {/* Generation Buttons */}
                <div className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <Button
                            onClick={handleGenerateAICover}
                            isLoading={isGenerating}
                            disabled={isGenerating || !title.trim()}
                        >
                            <SparklesIcon className="w-5 h-5 mr-2" />
                            {isGenerating ? 'Generating AI Cover...' : 'Generate AI Cover'}
                        </Button>
                        
                        <Button
                            onClick={handleGenerateManualCover}
                            disabled={!title.trim()}
                            variant="secondary"
                        >
                            <PaintBrushIcon className="w-5 h-5 mr-2" />
                            Create Manual Cover
                        </Button>
                    </div>
                    
                    {generatedCover && (
                        <div className="flex gap-2">
                            <Button
                                variant="secondary"
                                onClick={() => setShowPreview(!showPreview)}
                                size="sm"
                            >
                                <EyeIcon className="w-4 h-4 mr-2" />
                                {showPreview ? 'Hide Preview' : 'Show Preview'}
                            </Button>
                            
                            <Button
                                onClick={() => handleDownload('png')}
                                variant="secondary"
                                size="sm"
                            >
                                <ArrowDownTrayIcon className="w-4 h-4 mr-2" />
                                PNG
                            </Button>
                            
                            <Button
                                onClick={() => handleDownload('jpg')}
                                variant="secondary"
                                size="sm"
                            >
                                <ArrowDownTrayIcon className="w-4 h-4 mr-2" />
                                JPG
                            </Button>
                            
                            <Button
                                onClick={() => handleDownload('pdf')}
                                variant="secondary"
                                size="sm"
                            >
                                <DocumentDuplicateIcon className="w-4 h-4 mr-2" />
                                Print Ready
                            </Button>
                        </div>
                    )}
                </div>

                {/* Preview Section */}
                {showPreview && generatedCover && (
                    <div className="border-t border-slate-700 pt-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-slate-200">Cover Preview</h3>
                            <div className="text-sm text-slate-400">
                                {dimensions.width}×{dimensions.height}px • {bookFormat} format
                            </div>
                        </div>
                        
                        <div className="flex justify-center">
                            <div className="relative">
                                <img 
                                    src={generatedCover} 
                                    alt="Generated book cover"
                                    className="border border-slate-600 rounded-lg shadow-lg"
                                    style={{
                                        width: Math.min(300, dimensions.width * 0.2),
                                        height: Math.min(450, dimensions.height * 0.2),
                                    }}
                                />
                                
                                {/* Format indicator */}
                                <div className="absolute -top-2 -right-2 bg-purple-600 text-white text-xs px-2 py-1 rounded-full capitalize">
                                    {bookFormat}
                                </div>
                            </div>
                        </div>
                        
                        <div className="text-center mt-4 text-sm text-slate-400">
                            Preview scaled for display • Actual size: {dimensions.width}×{dimensions.height}px
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
