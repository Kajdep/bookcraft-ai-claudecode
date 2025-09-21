// FIX: Created full content for types.ts to define all application types.
export enum ProjectStatus {
    Draft = 'Draft',
    InProgress = 'In Progress',
    Analyzing = 'Analyzing',
    Review = 'Review',
    Done = 'Done',
}

export enum Genre {
    Fiction = 'Fiction',
    NonFiction = 'Non-Fiction',
    SciFi = 'Sci-Fi',
    Fantasy = 'Fantasy',
    Business = 'Business',
    SelfHelp = 'Self-Help',
    Technical = 'Technical',
}

export enum VisualStyle {
    Professional = 'Professional',
    Playful = 'Playful',
    Minimalist = 'Minimalist',
    Academic = 'Academic',
}

export enum ChapterStatus {
    Idea = 'Idea',
    Outline = 'Outline',
    Draft = 'Draft',
    Review = 'Review',
    Done = 'Done',
}

export enum VisualType {
    Flowchart = 'Flowchart',
    ComparisonChart = 'Comparison Chart',
    Infographic = 'Infographic',
    Timeline = 'Timeline',
    MindMap = 'Mind Map',
}

export enum ResearchType {
    FactCheck = 'Fact Check',
    TopicalResearch = 'Topical Research',
    SourceVerification = 'Source Verification',
    QuickLookup = 'Quick Lookup',
    Historical = 'Historical Research',
    Statistical = 'Statistical Data',
    Expert = 'Expert Opinion'
}

export enum ResearchConfidence {
    High = 'High',
    Medium = 'Medium',
    Low = 'Low',
    Unknown = 'Unknown'
}

export enum SourceCredibility {
    Verified = 'Verified',
    Credible = 'Credible',
    Questionable = 'Questionable',
    Unverified = 'Unverified'
}

export enum CitationStyle {
    APA = 'APA',
    MLA = 'MLA',
    Chicago = 'Chicago',
    Harvard = 'Harvard'
}

export enum ResearchFolderType {
    Default = 'Default',
    Chapter = 'Chapter',
    Theme = 'Theme',
    Character = 'Character',
    Location = 'Location',
    Technical = 'Technical',
    Historical = 'Historical'
}

export interface PlotPoint {
    id: string;
    title: string;
    description: string;
    order: number;
}

export interface Chapter {
    id:string;
    title: string;
    content: string; // Will now store HTML
    status: ChapterStatus;
    order: number;
    notes?: string;
    structure?: { point: string; details: string }[];
}

export interface VisualRecommendation {
    id: string;
    type: VisualType;
    reasoning: string;
    context: string; // The snippet of text that prompted the recommendation
    pageNumber: number;
}

export interface Visual {
    id: string;
    recommendationId: string;
    type: VisualType;
    content: {
        mermaidCode: string;
    };
    pageNumber: number;
}

export interface GeneratedImage {
    id: string;
    prompt: string;
    base64Image: string;
}

export interface ResearchSource {
    id: string;
    title: string;
    url?: string;
    author?: string;
    publishDate?: string;
    credibility: SourceCredibility;
    accessDate: Date;
    notes?: string;
    doi?: string;
    journal?: string;
    volume?: string;
    issue?: string;
    pages?: string;
    publisher?: string;
    edition?: string;
    sourceType: 'Website' | 'Book' | 'Journal' | 'Newspaper' | 'Report' | 'Interview' | 'Other';
}

export interface ResearchFolder {
    id: string;
    name: string;
    type: ResearchFolderType;
    description?: string;
    parentFolderId?: string;
    tags: string[];
    createdAt: Date;
    color?: string;
    icon?: string;
}

export interface ResearchItem {
    id: string;
    query: string;
    type: ResearchType;
    content: string;
    summary: string;
    confidence: ResearchConfidence;
    sources: ResearchSource[];
    tags: string[];
    linkedChapterIds: string[];
    createdAt: Date;
    lastUpdated: Date;
    verified: boolean;
    folderId?: string;
    qualityScore?: number;
    wordCount?: number;
    isBookmarked: boolean;
    attachments?: ResearchAttachment[];
    relatedResearchIds?: string[];
    contradictions?: ResearchContradiction[];
}

export interface ResearchAttachment {
    id: string;
    name: string;
    type: 'pdf' | 'image' | 'document' | 'link';
    url?: string;
    file?: File;
    size?: number;
    uploadedAt: Date;
}

export interface ResearchContradiction {
    id: string;
    conflictingResearchId: string;
    conflictType: 'Direct' | 'Implicit' | 'Source';
    description: string;
    severity: 'High' | 'Medium' | 'Low';
    resolvedAt?: Date;
    resolution?: string;
}

export interface Citation {
    id: string;
    researchItemId: string;
    sourceId: string;
    style: CitationStyle;
    formatted: string;
    shortForm: string;
    inText: string;
    createdAt: Date;
}

export interface ThematicTag {
    id: string;
    name: string;
    description?: string;
    color: string;
    researchItemIds: string[];
    themes: string[];
    sentiment?: 'Positive' | 'Negative' | 'Neutral';
    frequency: number;
}

export interface ResearchTimeline {
    id: string;
    title: string;
    description?: string;
    events: TimelineEvent[];
    createdAt: Date;
    researchItemIds: string[];
}

export interface TimelineEvent {
    id: string;
    title: string;
    date: Date;
    description: string;
    researchItemId?: string;
    importance: 'High' | 'Medium' | 'Low';
    verified: boolean;
}

export interface ResearchMindMap {
    id: string;
    title: string;
    centralTopic: string;
    nodes: MindMapNode[];
    connections: MindMapConnection[];
    createdAt: Date;
    researchItemIds: string[];
}

export interface MindMapNode {
    id: string;
    label: string;
    x: number;
    y: number;
    researchItemId?: string;
    type: 'central' | 'main' | 'sub' | 'detail';
    color?: string;
}

export interface MindMapConnection {
    id: string;
    sourceId: string;
    targetId: string;
    label?: string;
    strength: number;
}

export interface FactCheckResult {
    id: string;
    originalText: string;
    claim: string;
    accuracy: 'Accurate' | 'Questionable' | 'False' | 'Unknown';
    confidence: ResearchConfidence;
    explanation: string;
    suggestedCorrection?: string;
    sources: ResearchSource[];
    chapterId: string;
    createdAt: Date;
}

export interface ResearchQuery {
    id: string;
    query: string;
    context: {
        genre: string;
        chapterId?: string;
        projectPhase: string;
    };
    results: ResearchItem[];
    createdAt: Date;
}

export interface Project {
    id: string;
    title: string;
    genre: string;
    visualStyle: string;
    status: ProjectStatus;
    createdAt: Date;
    chapters: Chapter[];
    plotPoints: PlotPoint[];
    recommendations: VisualRecommendation[];
    visuals: Visual[];
    generatedImages: GeneratedImage[];
    research: ResearchItem[];
    factChecks: FactCheckResult[];
    researchQueries: ResearchQuery[];
    researchTags: string[];
    researchFolders: ResearchFolder[];
    citations: Citation[];
    thematicTags: ThematicTag[];
    researchTimelines: ResearchTimeline[];
    researchMindMaps: ResearchMindMap[];
    researchSettings: {
        defaultCitationStyle: CitationStyle;
        autoFactCheck: boolean;
        contradictionDetection: boolean;
        researchSuggestions: boolean;
    };
}

// Application Settings
export interface Settings {
    // API Configuration
    openRouterApiKey?: string;
    openRouterEndpoint?: string;
    geminiApiKey?: string;
    geminiEndpoint?: string;

    // UI Preferences
    theme?: 'dark' | 'light';
    editorFontSize?: number;
    autoSave?: boolean;

    // AI Preferences
    defaultModel?: string;
    maxTokens?: number;
    temperature?: number;
}