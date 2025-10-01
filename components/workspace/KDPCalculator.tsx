import React, { useState, useMemo } from 'react';
import { Card, Button, Input, Select } from '../UI';
import { 
    CalculatorIcon, 
    DocumentIcon, 
    PrinterIcon, 
    CurrencyDollarIcon,
    ClipboardDocumentCheckIcon,
    InformationCircleIcon,
    ExclamationTriangleIcon
} from '../Icons';

type PaperSize = '5x8' | '5.25x8' | '5.5x8.5' | '6x9' | '6.14x9.21' | '6.69x9.61' | '7x10' | '7.44x9.69' | '7.5x9.25' | '8x10' | '8.25x6' | '8.25x8.25' | '8.5x8.5' | '8.5x11';
type BookBinding = 'paperback' | 'hardcover';
type PaperType = 'white' | 'cream' | 'color';
type Genre = 'fiction' | 'non-fiction' | 'poetry' | 'children' | 'textbook' | 'other';

interface PaperDimensions {
    width: number;
    height: number;
    name: string;
    minPages: number;
    maxPages: number;
    recommended: boolean;
    genre: Genre[];
    description: string;
}

// Official Amazon KDP trim sizes and specifications
const PAPER_SIZES: Record<PaperSize, PaperDimensions> = {
    '5x8': { 
        width: 5, height: 8, name: '5" × 8"', 
        minPages: 24, maxPages: 828, recommended: true,
        genre: ['fiction', 'non-fiction', 'poetry'],
        description: 'Popular for novels and non-fiction books'
    },
    '5.25x8': { 
        width: 5.25, height: 8, name: '5.25" × 8"', 
        minPages: 24, maxPages: 828, recommended: true,
        genre: ['fiction', 'non-fiction'],
        description: 'Slightly wider than 5×8, good for novels'
    },
    '5.5x8.5': { 
        width: 5.5, height: 8.5, name: '5.5" × 8.5"', 
        minPages: 24, maxPages: 828, recommended: true,
        genre: ['non-fiction', 'textbook'],
        description: 'Standard for trade paperbacks and textbooks'
    },
    '6x9': { 
        width: 6, height: 9, name: '6" × 9"', 
        minPages: 24, maxPages: 828, recommended: true,
        genre: ['fiction', 'non-fiction', 'textbook'],
        description: 'Most popular size for paperback books'
    },
    '6.14x9.21': { 
        width: 6.14, height: 9.21, name: '6.14" × 9.21" (A5)', 
        minPages: 24, maxPages: 828, recommended: false,
        genre: ['non-fiction', 'textbook'],
        description: 'International A5 size'
    },
    '6.69x9.61': { 
        width: 6.69, height: 9.61, name: '6.69" × 9.61"', 
        minPages: 24, maxPages: 828, recommended: false,
        genre: ['textbook', 'other'],
        description: 'Larger format for technical books'
    },
    '7x10': { 
        width: 7, height: 10, name: '7" × 10"', 
        minPages: 24, maxPages: 828, recommended: true,
        genre: ['textbook', 'non-fiction'],
        description: 'Popular for textbooks and workbooks'
    },
    '7.44x9.69': { 
        width: 7.44, height: 9.69, name: '7.44" × 9.69"', 
        minPages: 24, maxPages: 828, recommended: false,
        genre: ['textbook', 'other'],
        description: 'Large format for technical content'
    },
    '7.5x9.25': { 
        width: 7.5, height: 9.25, name: '7.5" × 9.25"', 
        minPages: 24, maxPages: 828, recommended: true,
        genre: ['textbook', 'non-fiction'],
        description: 'Common for academic and professional books'
    },
    '8x10': { 
        width: 8, height: 10, name: '8" × 10"', 
        minPages: 24, maxPages: 828, recommended: true,
        genre: ['textbook', 'children', 'other'],
        description: 'Great for illustrated books and manuals'
    },
    '8.25x6': { 
        width: 8.25, height: 6, name: '8.25" × 6" (Landscape)', 
        minPages: 24, maxPages: 828, recommended: false,
        genre: ['children', 'other'],
        description: 'Landscape orientation for picture books'
    },
    '8.25x8.25': { 
        width: 8.25, height: 8.25, name: '8.25" × 8.25" (Square)', 
        minPages: 24, maxPages: 828, recommended: false,
        genre: ['children', 'poetry', 'other'],
        description: 'Square format for children\'s books'
    },
    '8.5x8.5': { 
        width: 8.5, height: 8.5, name: '8.5" × 8.5" (Square)', 
        minPages: 24, maxPages: 828, recommended: false,
        genre: ['children', 'poetry', 'other'],
        description: 'Larger square format'
    },
    '8.5x11': { 
        width: 8.5, height: 11, name: '8.5" × 11"', 
        minPages: 24, maxPages: 828, recommended: true,
        genre: ['textbook', 'other'],
        description: 'Standard US Letter size for workbooks'
    }
};

// KDP specifications and constants
const BLEED_SIZE = 0.125; // 1/8 inch bleed for covers (KDP requirement)
const SPINE_MARGIN = 0.0625; // 1/16 inch spine margin (KDP safe zone)
const MIN_SPINE_WIDTH = 0.06; // Minimum spine width for text (KDP guideline)
const SPINE_TEXT_MIN_WIDTH = 0.2; // Minimum spine width for readable text

// Official KDP paper thickness values (in inches per sheet)
const PAPER_THICKNESS = {
    white: 0.0025,     // 60# white paper
    cream: 0.0025,     // 60# cream paper  
    color: 0.0057      // 70# color paper (heavier)
};

// KDP printing cost structure (as of 2024)
const PRINTING_COSTS = {
    fixed_cost: 0.85,
    white_per_page: 0.012,
    cream_per_page: 0.012,
    color_per_page: 0.07
};

// KDP royalty rates
const ROYALTY_RATES = {
    standard_70: 0.70,      // 70% for $2.99-$9.99 ebooks
    standard_35: 0.35,      // 35% for other ebook prices
    expanded_distribution: 0.60  // Print books with expanded distribution
};

export const KDPCalculator: React.FC = () => {
    const [paperSize, setPaperSize] = useState<PaperSize>('6x9');
    const [pageCount, setPageCount] = useState<number>(200);
    const [paperType, setPaperType] = useState<PaperType>('white');
    const [bookBinding, setBookBinding] = useState<BookBinding>('paperback');
    const [listPrice, setListPrice] = useState<number>(12.99);
    const [selectedGenre, setSelectedGenre] = useState<Genre>('fiction');
    const [activeTab, setActiveTab] = useState<'margins' | 'cover' | 'royalty' | 'spine' | 'guidelines'>('guidelines');

    const dimensions = PAPER_SIZES[paperSize];

    // Validation checks based on KDP guidelines
    const validationErrors = useMemo(() => {
        const errors: string[] = [];
        
        if (pageCount < dimensions.minPages) {
            errors.push(`Page count must be at least ${dimensions.minPages} pages for this size`);
        }
        if (pageCount > dimensions.maxPages) {
            errors.push(`Page count cannot exceed ${dimensions.maxPages} pages for this size`);
        }
        if (listPrice < 0.01) {
            errors.push('List price must be at least $0.01');
        }
        if (listPrice > 999.99) {
            errors.push('List price cannot exceed $999.99');
        }
        
        return errors;
    }, [pageCount, listPrice, dimensions]);

    // Calculate spine width using official KDP paper thickness
    const spineWidth = useMemo(() => {
        const thickness = PAPER_THICKNESS[paperType];
        const calculatedWidth = pageCount * thickness;
        return Math.max(MIN_SPINE_WIDTH, calculatedWidth);
    }, [pageCount, paperType]);

    // Calculate cover dimensions
    const coverDimensions = useMemo(() => {
        const totalWidth = (dimensions.width * 2) + spineWidth + (BLEED_SIZE * 2);
        const totalHeight = dimensions.height + (BLEED_SIZE * 2);
        return {
            width: totalWidth,
            height: totalHeight,
            spine: spineWidth,
            frontWidth: dimensions.width + BLEED_SIZE + SPINE_MARGIN,
            backWidth: dimensions.width + BLEED_SIZE + SPINE_MARGIN,
            bleed: BLEED_SIZE
        };
    }, [dimensions, spineWidth]);

    // Calculate margins using KDP guidelines
    const margins = useMemo(() => {
        // KDP margin recommendations based on trim size and page count
        let baseMargin = 0.75;
        let insideMarginMultiplier = 1.2;
        
        // Adjust margins based on trim size (KDP recommendations)
        if (dimensions.width >= 8 || dimensions.height >= 10) {
            baseMargin = 1.0; // Larger formats need bigger margins
        } else if (dimensions.width <= 5.5) {
            baseMargin = 0.625; // Smaller formats can have tighter margins
        }
        
        // Adjust inside margin based on page count (binding considerations)
        if (pageCount > 300) {
            insideMarginMultiplier = 1.4;
        } else if (pageCount > 150) {
            insideMarginMultiplier = 1.3;
        }
        
        const insideMargin = baseMargin * insideMarginMultiplier;
        
        return {
            top: baseMargin,
            bottom: baseMargin,
            outside: baseMargin,
            inside: insideMargin,
            bleed: BLEED_SIZE,
            // Additional KDP-specific measurements
            safeZone: 0.25, // Keep important content 0.25" from trim
            headerFooter: 0.5 // Minimum space for headers/footers
        };
    }, [dimensions, pageCount]);

    // Calculate royalty using official KDP pricing structure
    const royalty = useMemo(() => {
        const fixedCost = PRINTING_COSTS.fixed_cost;
        let perPageCost: number;
        
        switch (paperType) {
            case 'color':
                perPageCost = PRINTING_COSTS.color_per_page;
                break;
            case 'cream':
                perPageCost = PRINTING_COSTS.cream_per_page;
                break;
            default: // white
                perPageCost = PRINTING_COSTS.white_per_page;
        }
        
        const printCost = fixedCost + (pageCount * perPageCost);
        
        // Determine royalty rate based on distribution and price
        const distributionRate = ROYALTY_RATES.expanded_distribution;
        const calculatedRoyalty = (listPrice * distributionRate) - printCost;
        
        // KDP minimum royalty is $0.01
        const finalRoyalty = Math.max(0.01, calculatedRoyalty);
        
        return {
            printCost,
            royalty: finalRoyalty,
            royaltyRate: distributionRate * 100,
            profitMargin: listPrice > 0 ? (finalRoyalty / listPrice) * 100 : 0
        };
    }, [pageCount, paperType, listPrice]);

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
    };

    const formatDimensions = (width: number, height: number) => `${width}" × ${height}"`;

    // Get recommended sizes for selected genre
    const getRecommendedSizes = (genre: Genre) => {
        return Object.entries(PAPER_SIZES)
            .filter(([_, size]) => size.genre.includes(genre) && size.recommended)
            .map(([key, size]) => ({ key: key as PaperSize, ...size }));
    };

    const recommendedSizes = getRecommendedSizes(selectedGenre);

    const renderGuidelinesTab = () => (
        <div className="space-y-6">
            {/* Validation Errors */}
            {validationErrors.length > 0 && (
                <div className="p-4 bg-red-900/20 rounded-lg border border-red-700/30">
                    <div className="flex items-start">
                        <ExclamationTriangleIcon className="h-5 w-5 text-red-400 mt-0.5 mr-2 flex-shrink-0" />
                        <div className="text-sm text-red-200">
                            <p className="font-medium mb-2">KDP Compliance Issues:</p>
                            <ul className="list-disc pl-4 space-y-1">
                                {validationErrors.map((error, index) => (
                                    <li key={index}>{error}</li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            )}

            {/* Current Size Analysis */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="bg-slate-900/50 p-4 rounded-lg">
                    <h4 className="font-semibold text-brand-primary mb-3 flex items-center">
                        <InformationCircleIcon className="h-4 w-4 mr-2" />
                        Current Size Analysis
                    </h4>
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-slate-400">Size:</span>
                            <span className="font-mono">{dimensions.name}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-400">Genre Fit:</span>
                            <span className={dimensions.genre.includes(selectedGenre) ? 'text-green-400' : 'text-amber-400'}>
                                {dimensions.genre.includes(selectedGenre) ? 'Perfect' : 'Consider alternatives'}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-400">KDP Recommended:</span>
                            <span className={dimensions.recommended ? 'text-green-400' : 'text-slate-400'}>
                                {dimensions.recommended ? 'Yes' : 'Standard'}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-400">Page Range:</span>
                            <span className="font-mono">{dimensions.minPages}-{dimensions.maxPages}</span>
                        </div>
                    </div>
                    <p className="text-xs text-slate-500 mt-3">{dimensions.description}</p>
                </div>

                <div className="bg-slate-900/50 p-4 rounded-lg">
                    <h4 className="font-semibold text-brand-primary mb-3">Spine Analysis</h4>
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-slate-400">Calculated Width:</span>
                            <span className="font-mono">{spineWidth.toFixed(3)}"</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-400">Text Recommended:</span>
                            <span className={spineWidth >= SPINE_TEXT_MIN_WIDTH ? 'text-green-400' : 'text-amber-400'}>
                                {spineWidth >= SPINE_TEXT_MIN_WIDTH ? 'Yes' : 'Avoid text'}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-400">Min Text Size:</span>
                            <span className="font-mono">
                                {spineWidth >= SPINE_TEXT_MIN_WIDTH ? '9pt' : 'N/A'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Recommended Sizes for Genre */}
            <div className="bg-slate-900/50 p-4 rounded-lg">
                <h4 className="font-semibold text-brand-primary mb-3">Recommended Sizes for {selectedGenre.charAt(0).toUpperCase() + selectedGenre.slice(1)}</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {recommendedSizes.map(size => (
                        <button
                            key={size.key}
                            onClick={() => setPaperSize(size.key)}
                            className={`p-3 rounded border text-left text-sm transition-colors ${
                                paperSize === size.key
                                    ? 'border-brand-primary bg-brand-primary/10 text-brand-primary'
                                    : 'border-slate-600 hover:border-slate-500 text-slate-300'
                            }`}
                        >
                            <div className="font-medium">{size.name}</div>
                            <div className="text-xs text-slate-400 mt-1">{size.description}</div>
                        </button>
                    ))}
                </div>
            </div>

            {/* KDP Guidelines Summary */}
            <div className="p-4 bg-blue-900/20 rounded-lg border border-blue-700/30">
                <div className="flex items-start">
                    <InformationCircleIcon className="h-5 w-5 text-blue-400 mt-0.5 mr-2 flex-shrink-0" />
                    <div className="text-sm text-blue-200">
                        <p className="font-medium mb-2">Amazon KDP Key Guidelines:</p>
                        <ul className="list-disc pl-4 space-y-1 text-xs">
                            <li>Minimum 24 pages, maximum 828 pages for paperbacks</li>
                            <li>All content must be at least 0.125" from trim edges</li>
                            <li>Cover requires 0.125" bleed on all sides</li>
                            <li>Spine text requires minimum 0.2" spine width</li>
                            <li>Interior pages: 300 DPI for images, black text preferred</li>
                            <li>Color books incur higher printing costs</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderMarginsTab = () => (
        <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-900/50 p-4 rounded-lg">
                    <h4 className="font-semibold text-brand-primary mb-3 flex items-center">
                        <DocumentIcon className="h-4 w-4 mr-2" />
                        Page Margins (Inches)
                    </h4>
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-slate-400">Top:</span>
                            <span className="font-mono">{margins.top}"</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-400">Bottom:</span>
                            <span className="font-mono">{margins.bottom}"</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-400">Outside:</span>
                            <span className="font-mono">{margins.outside}"</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-400">Inside (Gutter):</span>
                            <span className="font-mono">{margins.inside}"</span>
                        </div>
                    </div>
                </div>
                <div className="bg-slate-900/50 p-4 rounded-lg">
                    <h4 className="font-semibold text-brand-primary mb-3">Text Area</h4>
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-slate-400">Width:</span>
                            <span className="font-mono">{(dimensions.width - margins.outside - margins.inside).toFixed(2)}"</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-400">Height:</span>
                            <span className="font-mono">{(dimensions.height - margins.top - margins.bottom).toFixed(2)}"</span>
                        </div>
                    </div>
                </div>
            </div>
            <div className="p-4 bg-blue-900/20 rounded-lg border border-blue-700/30">
                <div className="flex items-start">
                    <InformationCircleIcon className="h-5 w-5 text-blue-400 mt-0.5 mr-2 flex-shrink-0" />
                    <div className="text-sm text-blue-200">
                        <p className="font-medium mb-1">Margin Guidelines:</p>
                        <p>Inside margins are larger to account for binding. For books over 150 pages, consider increasing inside margins by 0.125" for every additional 100 pages.</p>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderCoverTab = () => (
        <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-900/50 p-4 rounded-lg">
                    <h4 className="font-semibold text-brand-primary mb-3 flex items-center">
                        <PrinterIcon className="h-4 w-4 mr-2" />
                        Full Cover Dimensions
                    </h4>
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-slate-400">Total Width:</span>
                            <span className="font-mono">{coverDimensions.width.toFixed(3)}"</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-400">Total Height:</span>
                            <span className="font-mono">{coverDimensions.height.toFixed(3)}"</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-400">Spine Width:</span>
                            <span className="font-mono">{spineWidth.toFixed(3)}"</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-400">Bleed:</span>
                            <span className="font-mono">{BLEED_SIZE}"</span>
                        </div>
                    </div>
                </div>
                <div className="bg-slate-900/50 p-4 rounded-lg">
                    <h4 className="font-semibold text-brand-primary mb-3">Print Resolution</h4>
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-slate-400">Required DPI:</span>
                            <span className="font-mono">300</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-400">Pixels Width:</span>
                            <span className="font-mono">{Math.round(coverDimensions.width * 300)}px</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-400">Pixels Height:</span>
                            <span className="font-mono">{Math.round(coverDimensions.height * 300)}px</span>
                        </div>
                    </div>
                </div>
            </div>
            <Button 
                variant="ghost" 
                onClick={() => copyToClipboard(`Cover Dimensions: ${coverDimensions.width.toFixed(3)}" × ${coverDimensions.height.toFixed(3)}" (${Math.round(coverDimensions.width * 300)}px × ${Math.round(coverDimensions.height * 300)}px at 300 DPI)`)}
                className="w-full border border-slate-600/50"
            >
                <ClipboardDocumentCheckIcon className="h-4 w-4 mr-2" />
                Copy Cover Specifications
            </Button>
        </div>
    );

    const renderSpineTab = () => (
        <div className="space-y-6">
            <div className="bg-slate-900/50 p-4 rounded-lg">
                <h4 className="font-semibold text-brand-primary mb-3">Spine Specifications</h4>
                <div className="space-y-3">
                    <div className="flex justify-between items-center">
                        <span className="text-slate-400">Calculated Spine Width:</span>
                        <span className="font-mono text-lg">{spineWidth.toFixed(3)}"</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-slate-400">Pages:</span>
                        <span className="font-mono">{pageCount}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-slate-400">Paper Type:</span>
                        <span className="capitalize">{paperType}</span>
                    </div>
                </div>
            </div>
            <div className="p-4 bg-amber-900/20 rounded-lg border border-amber-700/30">
                <div className="flex items-start">
                    <InformationCircleIcon className="h-5 w-5 text-amber-400 mt-0.5 mr-2 flex-shrink-0" />
                    <div className="text-sm text-amber-200">
                        <p className="font-medium mb-1">Spine Text Guidelines:</p>
                        <p>For spines under 0.2", avoid spine text. For spines 0.2" or wider, use text size no smaller than 9pt. Always account for 0.0625" margins on each side of the spine.</p>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderRoyaltyTab = () => (
        <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-900/50 p-4 rounded-lg">
                    <h4 className="font-semibold text-brand-primary mb-3 flex items-center">
                        <CurrencyDollarIcon className="h-4 w-4 mr-2" />
                        Cost Breakdown
                    </h4>
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-slate-400">List Price:</span>
                            <span className="font-mono">${listPrice.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-400">Print Cost:</span>
                            <span className="font-mono">${royalty.printCost.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between border-t border-slate-600 pt-2">
                            <span className="text-slate-400">Your Royalty:</span>
                            <span className="font-mono text-green-400">${royalty.royalty.toFixed(2)}</span>
                        </div>
                    </div>
                </div>
                <div className="bg-slate-900/50 p-4 rounded-lg">
                    <h4 className="font-semibold text-brand-primary mb-3">Royalty Rate</h4>
                    <div className="text-center">
                        <div className="text-3xl font-bold text-green-400">{royalty.royaltyRate}%</div>
                        <p className="text-xs text-slate-400 mt-1">Expanded Distribution</p>
                    </div>
                </div>
            </div>
            <div className="p-4 bg-green-900/20 rounded-lg border border-green-700/30">
                <div className="flex items-start">
                    <InformationCircleIcon className="h-5 w-5 text-green-400 mt-0.5 mr-2 flex-shrink-0" />
                    <div className="text-sm text-green-200">
                        <p className="font-medium mb-1">Royalty Notes:</p>
                        <p>This calculation uses the 60% royalty rate for expanded distribution. Standard KDP distribution offers 70% royalty for books priced $2.99-$9.99.</p>
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <div className="bg-slate-800/50 rounded-lg border border-slate-700/50 p-6">
            <div className="mb-6">
                <div className="flex items-center mb-4">
                    <CalculatorIcon className="h-6 w-6 text-brand-primary mr-2" />
                    <h2 className="text-2xl font-bold">KDP Calculator</h2>
                </div>
                <p className="text-slate-400">Calculate margins, cover dimensions, spine width, and royalties for Amazon KDP publishing.</p>
            </div>

            {/* Configuration Panel */}
            <div className="bg-slate-900/50 rounded-lg p-4 mb-6">
                <h3 className="font-semibold mb-4">Book Specifications</h3>
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-2">Genre</label>
                        <Select 
                            value={selectedGenre} 
                            onChange={(e) => setSelectedGenre(e.target.value as Genre)}
                            className="w-full"
                        >
                            <option value="fiction">Fiction</option>
                            <option value="non-fiction">Non-Fiction</option>
                            <option value="poetry">Poetry</option>
                            <option value="children">Children's</option>
                            <option value="textbook">Textbook</option>
                            <option value="other">Other</option>
                        </Select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-2">
                            Paper Size
                            {!dimensions.recommended && (
                                <span className="text-amber-400 text-xs ml-1">(Non-standard)</span>
                            )}
                            {!dimensions.genre.includes(selectedGenre) && (
                                <span className="text-orange-400 text-xs ml-1">(Check genre fit)</span>
                            )}
                        </label>
                        <Select 
                            value={paperSize} 
                            onChange={(e) => setPaperSize(e.target.value as PaperSize)}
                            className={`w-full ${
                                !dimensions.genre.includes(selectedGenre) ? 'border-orange-400/50' : ''
                            }`}
                        >
                            {Object.entries(PAPER_SIZES).map(([key, size]) => (
                                <option key={key} value={key}>
                                    {size.name} {size.recommended ? '⭐' : ''}
                                </option>
                            ))}
                        </Select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-2">
                            Page Count
                            {(pageCount < dimensions.minPages || pageCount > dimensions.maxPages) && (
                                <span className="text-red-400 text-xs ml-1">(Invalid range)</span>
                            )}
                        </label>
                        <Input 
                            type="number" 
                            value={pageCount} 
                            onChange={(e) => setPageCount(parseInt(e.target.value) || 0)}
                            min={dimensions.minPages}
                            max={dimensions.maxPages}
                            className={`w-full ${
                                (pageCount < dimensions.minPages || pageCount > dimensions.maxPages) 
                                    ? 'border-red-400/50' : ''
                            }`}
                        />
                        <p className="text-xs text-slate-500 mt-1">
                            Range: {dimensions.minPages}-{dimensions.maxPages}
                        </p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-2">
                            Paper Type
                            {paperType === 'color' && (
                                <span className="text-amber-400 text-xs ml-1">(Higher cost)</span>
                            )}
                        </label>
                        <Select 
                            value={paperType} 
                            onChange={(e) => setPaperType(e.target.value as PaperType)}
                            className="w-full"
                        >
                            <option value="white">White (Standard)</option>
                            <option value="cream">Cream (Classic)</option>
                            <option value="color">Color (Premium)</option>
                        </Select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-2">
                            List Price ($)
                            {(listPrice < 0.01 || listPrice > 999.99) && (
                                <span className="text-red-400 text-xs ml-1">(Invalid price)</span>
                            )}
                        </label>
                        <Input 
                            type="number" 
                            value={listPrice} 
                            onChange={(e) => setListPrice(parseFloat(e.target.value) || 0)}
                            min="0.01"
                            max="999.99"
                            step="0.01"
                            className={`w-full ${
                                (listPrice < 0.01 || listPrice > 999.99) ? 'border-red-400/50' : ''
                            }`}
                        />
                        <p className="text-xs text-slate-500 mt-1">
                            Profit: ${royalty.royalty.toFixed(2)} ({royalty.profitMargin.toFixed(1)}%)
                        </p>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="mb-6">
                <div className="flex flex-wrap border-b border-slate-600">
                    {[
                        { id: 'guidelines', label: 'KDP Guidelines', icon: InformationCircleIcon },
                        { id: 'margins', label: 'Page Margins', icon: DocumentIcon },
                        { id: 'cover', label: 'Cover Specs', icon: PrinterIcon },
                        { id: 'spine', label: 'Spine Width', icon: DocumentIcon },
                        { id: 'royalty', label: 'Royalty', icon: CurrencyDollarIcon }
                    ].map(({ id, label, icon: Icon }) => (
                        <button
                            key={id}
                            onClick={() => setActiveTab(id as any)}
                            className={`px-4 py-2 text-sm font-medium flex items-center ${
                                activeTab === id
                                    ? 'text-brand-primary border-b-2 border-brand-primary'
                                    : 'text-slate-400 hover:text-slate-200'
                            } ${
                                id === 'guidelines' && validationErrors.length > 0 
                                    ? 'relative after:content-[""] after:absolute after:top-1 after:right-1 after:w-2 after:h-2 after:bg-red-400 after:rounded-full'
                                    : ''
                            }`}
                        >
                            <Icon className="h-4 w-4 mr-1" />
                            {label}
                            {id === 'guidelines' && validationErrors.length > 0 && (
                                <span className="ml-2 px-1.5 py-0.5 text-xs bg-red-600 text-white rounded-full">
                                    {validationErrors.length}
                                </span>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Tab Content */}
            <div>
                {activeTab === 'guidelines' && renderGuidelinesTab()}
                {activeTab === 'margins' && renderMarginsTab()}
                {activeTab === 'cover' && renderCoverTab()}
                {activeTab === 'spine' && renderSpineTab()}
                {activeTab === 'royalty' && renderRoyaltyTab()}
            </div>
        </div>
    );
};
