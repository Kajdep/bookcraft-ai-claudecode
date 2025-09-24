// Store constants and magic numbers
export const STORAGE_KEYS = {
    BOOKCRAFT_STORAGE: 'bookcraft-storage',
    THEME_STORAGE: 'bookcraft-theme'
} as const;

export const ID_PREFIXES = {
    PROJECT: 'proj',
    CHAPTER: 'chap',
    PLOT: 'plot',
    VISUAL: 'vis',
    IMAGE: 'img',
    RESEARCH: 'research',
    FOLDER: 'folder',
    RECOMMENDATION: 'rec'
} as const;

export const DEFAULT_COLORS = {
    CHAPTER: '#3B82F6',
    THEME: '#10B981',
    CHARACTER: '#F59E0B',
    HISTORICAL: '#8B5CF6',
    DEFAULT: '#6B7280'
} as const;

export const RESEARCH_QUALITY_SCORES = {
    HIGH_CONFIDENCE: 85,
    MEDIUM_CONFIDENCE: 65,
    LOW_CONFIDENCE: 45
} as const;

export const RESEARCH_VIEWS = {
    GRID: 'grid',
    LIST: 'list',
    TIMELINE: 'timeline',
    MINDMAP: 'mindmap'
} as const;

export const DEFAULT_RESEARCH_SETTINGS = {
    DEFAULT_CITATION_STYLE: 'APA' as const,
    AUTO_FACT_CHECK: false,
    CONTRADICTION_DETECTION: true,
    RESEARCH_SUGGESTIONS: true
} as const;

export const UI_RESET_STATES = {
    IS_CREATE_MODAL_OPEN: false,
    IS_LOADING: false,
    GENERATING_VISUAL_FOR: null,
    IS_GENERATING_IMAGE: false,
    IS_SUGGESTING_VISUAL: false,
    IS_ANALYZING_CHAPTER: null,
    IS_RESEARCHING: false,
    IS_FACT_CHECKING: false,
    IS_GENERATING_CITATION: false,
    IS_ANALYZING_THEMES: false,
    IS_DETECTING_CONTRADICTIONS: false,
    SELECTED_RESEARCH_ITEMS: [] as string[]
} as const;