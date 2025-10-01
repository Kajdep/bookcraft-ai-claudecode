import React, { useState } from 'react';
import { Card, Button, Input, Select } from '../UI';
import { BookOpenIcon, AcademicCapIcon, RocketLaunchIcon, SparklesIcon, HeartIcon, MagnifyingGlassIcon, BoltIcon, UserGroupIcon, GlobeAltIcon, ClockIcon, BeakerIcon, BriefcaseIcon, PencilIcon, PlusIcon, XMarkIcon } from '../Icons';
import { useBookCraftStore } from '../../store/useStore';
import { ResearchType, ResearchFolderType } from '../../types';

export interface ResearchTemplate {
    id: string;
    name: string;
    genre: string;
    description: string;
    icon: React.ReactNode;
    color: string;
    fields: ResearchField[];
    folders: TemplateFolderStructure[];
    prompts: ResearchPrompt[];
}

export interface ResearchField {
    id: string;
    name: string;
    type: 'text' | 'textarea' | 'select' | 'multiselect' | 'number' | 'date' | 'boolean';
    required: boolean;
    placeholder?: string;
    options?: string[];
    description?: string;
}

export interface TemplateFolderStructure {
    name: string;
    type: ResearchFolderType;
    color: string;
    description: string;
}

export interface ResearchPrompt {
    id: string;
    title: string;
    prompt: string;
    type: ResearchType;
    category: string;
}

const RESEARCH_TEMPLATES: ResearchTemplate[] = [
    {
        id: 'fiction-novel',
        name: 'Fiction Novel',
        genre: 'Fiction',
        description: 'Comprehensive template for fiction writing with character development, world-building, and plot structure',
        icon: <BookOpenIcon className="w-6 h-6" />,
        color: '#3B82F6',
        fields: [
            { id: 'setting-era', name: 'Historical Era/Time Period', type: 'text', required: false, placeholder: 'e.g., Victorian England, Modern Day, Far Future' },
            { id: 'setting-location', name: 'Primary Setting', type: 'text', required: false, placeholder: 'e.g., New York City, Fictional Kingdom, Space Station' },
            { id: 'target-audience', name: 'Target Audience', type: 'select', required: false, options: ['Young Adult', 'Adult', 'Children', 'New Adult', 'Middle Grade'] },
            { id: 'word-count-goal', name: 'Target Word Count', type: 'number', required: false, placeholder: '80000' },
            { id: 'genre-elements', name: 'Subgenre Elements', type: 'multiselect', required: false, options: ['Romance', 'Mystery', 'Thriller', 'Adventure', 'Coming of Age', 'Dystopian'] },
        ],
        folders: [
            { name: 'Character Profiles', type: ResearchFolderType.Character, color: '#F59E0B', description: 'Detailed character backgrounds, motivations, and development arcs' },
            { name: 'World Building', type: ResearchFolderType.Location, color: '#10B981', description: 'Settings, cultures, rules of the fictional world' },
            { name: 'Plot Structure', type: ResearchFolderType.Theme, color: '#8B5CF6', description: 'Three-act structure, plot points, conflicts, and resolutions' },
            { name: 'Historical Research', type: ResearchFolderType.Historical, color: '#EF4444', description: 'Historical facts, customs, technology for accurate portrayal' },
            { name: 'Themes & Motifs', type: ResearchFolderType.Theme, color: '#EC4899', description: 'Central themes, symbolic elements, and recurring motifs' }
        ],
        prompts: [
            { id: 'character-background', title: 'Character Background Research', prompt: 'Research the background, profession, and historical context for a character who is a [profession] living in [time period] in [location]. Include social customs, daily life, challenges they would face, and relevant historical events. What would be their worldview, values, and typical concerns?', type: ResearchType.Historical, category: 'Characters' },
            { id: 'setting-details', title: 'Setting Details', prompt: 'Research detailed information about [location] during [time period]. Include geography, climate, architecture, social structure, technology level, and daily life of inhabitants. How does this environment shape the people who live there?', type: ResearchType.TopicalResearch, category: 'World Building' },
            { id: 'plot-authenticity', title: 'Plot Element Research', prompt: 'Research the accuracy and feasibility of [plot element]. What are the real-world implications, requirements, and potential consequences? How can this be portrayed authentically while serving your story?', type: ResearchType.FactCheck, category: 'Plot' },
            { id: 'dialogue-accuracy', title: 'Dialogue and Language', prompt: 'Research the speech patterns, slang, and language conventions used by [character type] in [time period/location]. What would be authentic dialogue for this character? What phrases, expressions, and communication styles are period-appropriate?', type: ResearchType.TopicalResearch, category: 'Characters' },
            { id: 'character-psychology', title: 'Character Psychology Research', prompt: 'Research the psychological profile and development of someone who [character situation/background]. What traumas, motivations, and coping mechanisms would shape them? How do people with similar experiences typically behave and grow?', type: ResearchType.TopicalResearch, category: 'Characters' },
            { id: 'conflict-research', title: 'Conflict and Stakes Research', prompt: 'Research real-world examples of [type of conflict]. How do similar conflicts typically escalate and resolve? What are authentic stakes and consequences? What would make this conflict compelling and relatable?', type: ResearchType.TopicalResearch, category: 'Plot' },
            { id: 'cultural-research', title: 'Cultural Context Research', prompt: 'Research the cultural norms, beliefs, and practices of [culture/community] in [setting/time period]. What taboos, traditions, and social expectations would influence your characters\' choices and conflicts?', type: ResearchType.Historical, category: 'World Building' },
            { id: 'theme-research', title: 'Theme and Message Research', prompt: 'Research different perspectives on [central theme]. How have other works explored this theme? What real-world examples illustrate this concept? How can you bring fresh insight to this universal theme?', type: ResearchType.TopicalResearch, category: 'Themes' }
        ]
    },
    {
        id: 'science-fiction',
        name: 'Science Fiction',
        genre: 'SciFi',
        description: 'Advanced template for sci-fi writing with technology research, scientific concepts, and futuristic world-building',
        icon: <RocketLaunchIcon className="w-6 h-6" />,
        color: '#06B6D4',
        fields: [
            { id: 'tech-level', name: 'Technology Level', type: 'select', required: false, options: ['Near Future', 'Far Future', 'Post-Apocalyptic', 'Space Age', 'Cyberpunk', 'Steampunk'] },
            { id: 'scientific-focus', name: 'Scientific Focus', type: 'multiselect', required: false, options: ['Physics', 'Biology', 'Chemistry', 'Computer Science', 'Space Travel', 'Artificial Intelligence', 'Genetic Engineering'] },
            { id: 'world-scope', name: 'World Scope', type: 'select', required: false, options: ['Single Planet', 'Solar System', 'Galaxy', 'Universe', 'Multiverse', 'Alternative Earth'] },
            { id: 'hard-soft-sci', name: 'Science Approach', type: 'select', required: false, options: ['Hard Science Fiction', 'Soft Science Fiction', 'Science Fantasy'] }
        ],
        folders: [
            { name: 'Scientific Concepts', type: ResearchFolderType.Technical, color: '#06B6D4', description: 'Physics, biology, chemistry principles underlying your story' },
            { name: 'Technology Systems', type: ResearchFolderType.Technical, color: '#3B82F6', description: 'Futuristic technology, how it works, its limitations' },
            { name: 'Alien Cultures', type: ResearchFolderType.Character, color: '#10B981', description: 'Non-human species, their biology, society, and psychology' },
            { name: 'Space & Cosmology', type: ResearchFolderType.Location, color: '#8B5CF6', description: 'Space travel, planets, star systems, cosmic phenomena' },
            { name: 'Future History', type: ResearchFolderType.Historical, color: '#F59E0B', description: 'Timeline of events leading to your story\'s present' }
        ],
        prompts: [
            { id: 'scientific-accuracy', title: 'Scientific Concept Research', prompt: 'Research the current scientific understanding of [scientific concept]. What are the established facts, ongoing research, and potential future developments? How can this be extrapolated for a science fiction setting?', type: ResearchType.FactCheck, category: 'Science' },
            { id: 'technology-feasibility', title: 'Technology Feasibility', prompt: 'Research the technological requirements, challenges, and implications of [futuristic technology]. What current technologies could lead to this? What would be the social, economic, and ethical implications?', type: ResearchType.TopicalResearch, category: 'Technology' },
            { id: 'space-environment', title: 'Space Environment Research', prompt: 'Research the conditions, challenges, and characteristics of [space location/phenomenon]. What would it be like for humans to live, work, or travel there? What special considerations are needed?', type: ResearchType.TopicalResearch, category: 'Settings' }
        ]
    },
    {
        id: 'fantasy',
        name: 'Fantasy',
        genre: 'Fantasy',
        description: 'Magical template for fantasy writing with mythology, magic systems, and fantastical world creation',
        icon: <SparklesIcon className="w-6 h-6" />,
        color: '#8B5CF6',
        fields: [
            { id: 'fantasy-subgenre', name: 'Fantasy Subgenre', type: 'select', required: false, options: ['High Fantasy', 'Urban Fantasy', 'Dark Fantasy', 'Epic Fantasy', 'Sword & Sorcery', 'Magical Realism'] },
            { id: 'magic-system', name: 'Magic System Type', type: 'select', required: false, options: ['Hard Magic', 'Soft Magic', 'Divine Magic', 'Elemental Magic', 'Blood Magic', 'No Magic'] },
            { id: 'world-type', name: 'World Type', type: 'select', required: false, options: ['Secondary World', 'Earth-based', 'Portal Fantasy', 'Alternate History', 'Parallel Universe'] },
            { id: 'mythology-base', name: 'Mythological Inspiration', type: 'multiselect', required: false, options: ['Norse', 'Greek', 'Celtic', 'Egyptian', 'Japanese', 'Slavic', 'Native American', 'Original'] }
        ],
        folders: [
            { name: 'Magic Systems', type: ResearchFolderType.Technical, color: '#8B5CF6', description: 'How magic works, its rules, costs, and limitations' },
            { name: 'Mythological Research', type: ResearchFolderType.Historical, color: '#EF4444', description: 'Real-world myths, legends, and folklore for inspiration' },
            { name: 'Fantastical Creatures', type: ResearchFolderType.Character, color: '#10B981', description: 'Dragons, fairies, and other magical beings' },
            { name: 'Kingdoms & Realms', type: ResearchFolderType.Location, color: '#F59E0B', description: 'Fantasy locations, their politics, geography, and cultures' },
            { name: 'Prophecies & Lore', type: ResearchFolderType.Theme, color: '#EC4899', description: 'Ancient prophecies, legends, and world history' }
        ],
        prompts: [
            { id: 'mythology-research', title: 'Mythological Background', prompt: 'Research [mythological tradition/creature/concept] from various cultures. What are the common elements, variations, and symbolic meanings? How can these be adapted for a fantasy setting?', type: ResearchType.TopicalResearch, category: 'Mythology' },
            { id: 'medieval-life', title: 'Historical Fantasy Research', prompt: 'Research daily life, social structures, and customs in [historical period]. What were the living conditions, social hierarchies, and cultural practices that could inform a fantasy world?', type: ResearchType.Historical, category: 'World Building' },
            { id: 'magic-inspiration', title: 'Magic System Research', prompt: 'Research historical beliefs and practices around [type of magic/supernatural concept]. How did different cultures understand and practice this? What rules or limitations were believed to exist?', type: ResearchType.TopicalResearch, category: 'Magic' }
        ]
    },
    {
        id: 'non-fiction',
        name: 'Non-Fiction',
        genre: 'Non-Fiction',
        description: 'Factual template for non-fiction writing with source verification, expert interviews, and comprehensive research',
        icon: <AcademicCapIcon className="w-6 h-6" />,
        color: '#059669',
        fields: [
            { id: 'nonfiction-type', name: 'Non-Fiction Type', type: 'select', required: true, options: ['Biography', 'Memoir', 'Self-Help', 'Business', 'History', 'Science', 'Travel', 'Health', 'Lifestyle'] },
            { id: 'target-expertise', name: 'Reader Expertise Level', type: 'select', required: false, options: ['Beginner', 'Intermediate', 'Advanced', 'Expert', 'General Public'] },
            { id: 'research-depth', name: 'Research Depth Required', type: 'select', required: false, options: ['Light', 'Moderate', 'Extensive', 'Academic-level'] },
            { id: 'fact-checking', name: 'Fact-Checking Priority', type: 'select', required: true, options: ['High', 'Medium', 'Standard'] }
        ],
        folders: [
            { name: 'Primary Sources', type: ResearchFolderType.Default, color: '#059669', description: 'Original documents, interviews, firsthand accounts' },
            { name: 'Expert Interviews', type: ResearchFolderType.Default, color: '#DC2626', description: 'Interviews with subject matter experts and authorities' },
            { name: 'Statistical Data', type: ResearchFolderType.Technical, color: '#7C2D12', description: 'Charts, graphs, statistical evidence, and data analysis' },
            { name: 'Secondary Sources', type: ResearchFolderType.Default, color: '#1E40AF', description: 'Academic papers, books, and credible publications' },
            { name: 'Case Studies', type: ResearchFolderType.Default, color: '#7C3AED', description: 'Real-world examples and detailed case analyses' }
        ],
        prompts: [
            { id: 'expert-identification', title: 'Expert Source Research', prompt: 'Find and research credible experts in [subject area]. Who are the leading authorities, what are their credentials, and what unique insights can they provide? Include contact information and background.', type: ResearchType.Expert, category: 'Sources' },
            { id: 'fact-verification', title: 'Fact Verification', prompt: 'Verify the accuracy of this claim: [statement]. Find multiple reliable sources that confirm or contradict this information. Assess the credibility of each source and note any conflicting information.', type: ResearchType.FactCheck, category: 'Verification' },
            { id: 'statistical-research', title: 'Statistical Data Research', prompt: 'Find current, reliable statistical data about [topic]. Include the source, methodology, sample size, and date of the research. Look for trends and compare with historical data if available.', type: ResearchType.Statistical, category: 'Data' },
            { id: 'primary-sources', title: 'Primary Source Research', prompt: 'Locate primary sources related to [topic/event/person]. This could include documents, recordings, photographs, or firsthand accounts. Assess their authenticity and historical significance.', type: ResearchType.SourceVerification, category: 'Sources' }
        ]
    },
    {
        id: 'mystery-thriller',
        name: 'Mystery & Thriller',
        genre: 'Mystery',
        description: 'Investigative template for mystery and thriller writing with forensic research, plot structure, and suspense elements',
        icon: <MagnifyingGlassIcon className="w-6 h-6" />,
        color: '#DC2626',
        fields: [
            { id: 'mystery-type', name: 'Mystery Type', type: 'select', required: false, options: ['Cozy Mystery', 'Police Procedural', 'Private Detective', 'Amateur Sleuth', 'Psychological Thriller', 'Legal Thriller'] },
            { id: 'crime-type', name: 'Primary Crime', type: 'select', required: false, options: ['Murder', 'Theft', 'Kidnapping', 'Fraud', 'Espionage', 'Cybercrimes', 'Corporate Crime'] },
            { id: 'investigation-era', name: 'Time Period', type: 'text', required: false, placeholder: 'Modern day, 1920s, Victorian, etc.' },
            { id: 'forensic-level', name: 'Forensic Detail Level', type: 'select', required: false, options: ['Basic', 'Detailed', 'Highly Technical', 'Minimal'] }
        ],
        folders: [
            { name: 'Forensic Science', type: ResearchFolderType.Technical, color: '#DC2626', description: 'Crime scene analysis, forensic techniques, and scientific methods' },
            { name: 'Police Procedures', type: ResearchFolderType.Technical, color: '#1D4ED8', description: 'Law enforcement protocols, investigation methods, and legal procedures' },
            { name: 'Criminal Psychology', type: ResearchFolderType.Character, color: '#7C2D12', description: 'Motives, criminal behavior patterns, and psychological profiles' },
            { name: 'Legal System', type: ResearchFolderType.Technical, color: '#059669', description: 'Court procedures, legal rights, and justice system workings' },
            { name: 'Weapons & Methods', type: ResearchFolderType.Technical, color: '#9333EA', description: 'Crime methods, weapons, and their detection (for accuracy only)' }
        ],
        prompts: [
            { id: 'forensic-procedure', title: 'Forensic Procedure Research', prompt: 'Research the forensic procedures and techniques used to investigate [type of crime]. What evidence would be collected, how would it be analyzed, and what conclusions could be drawn? Include timeframes and limitations.', type: ResearchType.Technical, category: 'Forensics' },
            { id: 'police-protocol', title: 'Police Investigation Protocol', prompt: 'Research the standard police procedures for investigating [type of crime] in [location/era]. What steps would be taken, who would be involved, and what legal requirements must be met?', type: ResearchType.TopicalResearch, category: 'Procedures' },
            { id: 'criminal-psychology', title: 'Criminal Psychology Research', prompt: 'Research the psychological profile and typical motivations of someone who commits [type of crime]. What are the common patterns, triggers, and behavioral indicators? How do investigators identify and analyze these patterns?', type: ResearchType.TopicalResearch, category: 'Psychology' }
        ]
    },
    {
        id: 'historical-fiction',
        name: 'Historical Fiction',
        genre: 'Historical',
        description: 'Time-period template for historical fiction with era-specific research, cultural context, and authentic details',
        icon: <ClockIcon className="w-6 h-6" />,
        color: '#92400E',
        fields: [
            { id: 'historical-era', name: 'Historical Era', type: 'text', required: true, placeholder: 'e.g., Victorian Era, World War II, Medieval Period' },
            { id: 'specific-location', name: 'Specific Location', type: 'text', required: true, placeholder: 'e.g., London, Paris, Rural Ireland' },
            { id: 'social-class', name: 'Social Class Focus', type: 'multiselect', required: false, options: ['Upper Class', 'Middle Class', 'Working Class', 'Peasantry', 'Nobility', 'Merchants', 'Clergy'] },
            { id: 'historical-events', name: 'Key Historical Events', type: 'textarea', required: false, placeholder: 'Major events that influence your story...' }
        ],
        folders: [
            { name: 'Daily Life & Customs', type: ResearchFolderType.Historical, color: '#92400E', description: 'Everyday life, customs, traditions, and social norms' },
            { name: 'Historical Events', type: ResearchFolderType.Historical, color: '#DC2626', description: 'Major events, wars, political changes, and their impacts' },
            { name: 'Technology & Innovation', type: ResearchFolderType.Technical, color: '#1E40AF', description: 'Available technology, transportation, communication methods' },
            { name: 'Fashion & Material Culture', type: ResearchFolderType.Historical, color: '#EC4899', description: 'Clothing, architecture, furnishings, and material objects' },
            { name: 'Language & Speech', type: ResearchFolderType.Historical, color: '#059669', description: 'Period-appropriate language, dialects, and speech patterns' }
        ],
        prompts: [
            { id: 'daily-life-research', title: 'Daily Life Research', prompt: 'Research the daily life of a [social class] person living in [location] during [time period]. What would their typical day look like, what challenges would they face, and what would be their concerns and priorities?', type: ResearchType.Historical, category: 'Daily Life' },
            { id: 'historical-context', title: 'Historical Context Research', prompt: 'Research the political, social, and economic context of [location] during [time period]. What major events were happening, and how would they affect ordinary people\'s lives?', type: ResearchType.Historical, category: 'Context' },
            { id: 'period-accuracy', title: 'Period Accuracy Check', prompt: 'Verify whether [object/practice/concept] would have been available, known, or practiced in [location] during [time period]. If not, what would have been the period-appropriate alternative?', type: ResearchType.FactCheck, category: 'Accuracy' }
        ]
    },
    {
        id: 'romance',
        name: 'Romance',
        genre: 'Romance',
        description: 'Relationship-focused template for romance writing with character development, relationship dynamics, and emotional arcs',
        icon: <HeartIcon className="w-6 h-6" />,
        color: '#EC4899',
        fields: [
            { id: 'romance-subgenre', name: 'Romance Subgenre', type: 'select', required: false, options: ['Contemporary', 'Historical', 'Paranormal', 'Fantasy', 'Romantic Suspense', 'Young Adult', 'LGBTQ+'] },
            { id: 'heat-level', name: 'Heat Level', type: 'select', required: false, options: ['Sweet', 'Warm', 'Hot', 'Sizzling'] },
            { id: 'relationship-type', name: 'Relationship Dynamic', type: 'select', required: false, options: ['Friends to Lovers', 'Enemies to Lovers', 'Second Chance', 'Forbidden Love', 'Fake Relationship', 'Marriage of Convenience'] },
            { id: 'pov-style', name: 'Point of View', type: 'select', required: false, options: ['Single POV', 'Dual POV', 'Multiple POV'] }
        ],
        folders: [
            { name: 'Character Development', type: ResearchFolderType.Character, color: '#EC4899', description: 'Deep character backgrounds, motivations, and growth arcs' },
            { name: 'Relationship Dynamics', type: ResearchFolderType.Theme, color: '#F59E0B', description: 'Romantic tension, conflict resolution, and emotional beats' },
            { name: 'Setting & Atmosphere', type: ResearchFolderType.Location, color: '#10B981', description: 'Romantic settings, mood creation, and sensory details' },
            { name: 'Emotional Research', type: ResearchFolderType.Theme, color: '#8B5CF6', description: 'Psychology of relationships, emotional authenticity' },
            { name: 'Genre Conventions', type: ResearchFolderType.Default, color: '#06B6D4', description: 'Romance tropes, reader expectations, market research' }
        ],
        prompts: [
            { id: 'character-chemistry', title: 'Character Chemistry Research', prompt: 'Research the psychology of attraction and romantic chemistry. What creates initial spark between characters? How does attraction develop into deeper feelings? What obstacles create authentic romantic tension?', type: ResearchType.TopicalResearch, category: 'Relationships' },
            { id: 'relationship-conflict', title: 'Relationship Conflict Research', prompt: 'Research realistic relationship conflicts for [relationship type] in [setting/era]. What external pressures and internal fears would challenge this relationship? How do couples overcome these obstacles in real life?', type: ResearchType.TopicalResearch, category: 'Conflict' },
            { id: 'emotional-authenticity', title: 'Emotional Authenticity Research', prompt: 'Research the emotional journey of [relationship situation]. What are the psychological stages people go through? What emotions, fears, and hopes are most authentic to this experience?', type: ResearchType.TopicalResearch, category: 'Psychology' }
        ]
    },
    {
        id: 'business-book',
        name: 'Business Book',
        genre: 'Business',
        description: 'Professional template for business writing with market research, case studies, and actionable insights',
        icon: <BriefcaseIcon className="w-6 h-6" />,
        color: '#059669',
        fields: [
            { id: 'business-category', name: 'Business Category', type: 'select', required: true, options: ['Entrepreneurship', 'Leadership', 'Marketing', 'Finance', 'Management', 'Strategy', 'Innovation', 'Personal Development'] },
            { id: 'target-reader', name: 'Target Reader', type: 'select', required: false, options: ['C-Suite Executives', 'Middle Management', 'Entrepreneurs', 'Small Business Owners', 'Students', 'General Business Audience'] },
            { id: 'book-approach', name: 'Book Approach', type: 'select', required: false, options: ['Academic', 'Practical/How-to', 'Memoir/Personal Experience', 'Case Study Analysis', 'Research-Based'] },
            { id: 'industry-focus', name: 'Industry Focus', type: 'text', required: false, placeholder: 'e.g., Technology, Healthcare, Retail, etc.' }
        ],
        folders: [
            { name: 'Market Research', type: ResearchFolderType.Statistical, color: '#059669', description: 'Industry data, market trends, and competitive analysis' },
            { name: 'Case Studies', type: ResearchFolderType.Default, color: '#DC2626', description: 'Real business examples, success stories, and failures' },
            { name: 'Expert Insights', type: ResearchFolderType.Default, color: '#7C2D12', description: 'Industry leader interviews and expert opinions' },
            { name: 'Frameworks & Models', type: ResearchFolderType.Technical, color: '#1E40AF', description: 'Business frameworks, methodologies, and analytical models' },
            { name: 'Data & Statistics', type: ResearchFolderType.Statistical, color: '#7C3AED', description: 'Supporting data, research studies, and statistical evidence' }
        ],
        prompts: [
            { id: 'industry-trends', title: 'Industry Trend Analysis', prompt: 'Research current trends and future projections in [industry/business area]. What are the major shifts happening? What data supports these trends? What do experts predict for the next 5-10 years?', type: ResearchType.Statistical, category: 'Market Research' },
            { id: 'case-study-research', title: 'Case Study Research', prompt: 'Find detailed case studies of companies that have successfully implemented [business concept/strategy]. What were their challenges, methods, results, and key learnings? Include both successes and failures.', type: ResearchType.TopicalResearch, category: 'Case Studies' },
            { id: 'expert-validation', title: 'Expert Opinion Research', prompt: 'Identify and research leading experts in [business area]. What are their key insights, methodologies, and recommendations? How do different experts\' views compare or contrast?', type: ResearchType.Expert, category: 'Expert Insights' }
        ]
    },
    {
        id: 'memoir',
        name: 'Memoir',
        genre: 'Memoir',
        description: 'Personal narrative template for memoir writing with life event research, fact verification, and emotional authenticity',
        icon: <UserGroupIcon className="w-6 h-6" />,
        color: '#7C2D12',
        fields: [
            { id: 'memoir-theme', name: 'Central Theme', type: 'text', required: true, placeholder: 'e.g., overcoming adversity, family relationships, career journey' },
            { id: 'time-span', name: 'Time Period Covered', type: 'text', required: false, placeholder: 'e.g., childhood years, decade of career, specific period' },
            { id: 'narrative-style', name: 'Narrative Style', type: 'select', required: false, options: ['Chronological', 'Thematic', 'Circular', 'Episodic'] },
            { id: 'privacy-level', name: 'Privacy Considerations', type: 'select', required: false, options: ['Very Personal', 'Moderately Personal', 'Public-focused', 'Anonymous/Changed Names'] }
        ],
        folders: [
            { name: 'Memory Verification', type: ResearchFolderType.SourceVerification, color: '#7C2D12', description: 'Fact-checking personal memories and historical context' },
            { name: 'Historical Context', type: ResearchFolderType.Historical, color: '#DC2626', description: 'Cultural and historical backdrop of life events' },
            { name: 'Family & Relationships', type: ResearchFolderType.Character, color: '#EC4899', description: 'Key people, relationships, and their impact' },
            { name: 'Life Events Documentation', type: ResearchFolderType.Default, color: '#059669', description: 'Documents, photos, records supporting the narrative' },
            { name: 'Emotional Journey', type: ResearchFolderType.Theme, color: '#8B5CF6', description: 'Psychological insights and emotional growth patterns' }
        ],
        prompts: [
            { id: 'memory-verification', title: 'Memory and Fact Verification', prompt: 'Research the historical accuracy of [event/time period] that you experienced. What was happening in [location] during [time]? How do your memories align with historical records?', type: ResearchType.FactCheck, category: 'Verification' },
            { id: 'cultural-context', title: 'Cultural Context Research', prompt: 'Research the cultural, social, and political context of [time period] in [location]. How did broader societal events influence personal experiences? What was the zeitgeist of that era?', type: ResearchType.Historical, category: 'Context' },
            { id: 'psychological-research', title: 'Psychological Pattern Research', prompt: 'Research the psychology of [life experience/trauma/transition]. What are common patterns, coping mechanisms, and growth processes? How do others navigate similar experiences?', type: ResearchType.TopicalResearch, category: 'Psychology' }
        ]
    },
    {
        id: 'young-adult',
        name: 'Young Adult Fiction',
        genre: 'Young Adult',
        description: 'Age-appropriate template for YA fiction with adolescent psychology, contemporary issues, and coming-of-age themes',
        icon: <AcademicCapIcon className="w-6 h-6" />,
        color: '#F59E0B',
        fields: [
            { id: 'ya-subgenre', name: 'YA Subgenre', type: 'select', required: false, options: ['Contemporary', 'Fantasy', 'Science Fiction', 'Romance', 'Dystopian', 'Mystery', 'Historical'] },
            { id: 'protagonist-age', name: 'Protagonist Age', type: 'select', required: true, options: ['13-15', '16-18', '18-21'] },
            { id: 'main-theme', name: 'Central Theme', type: 'select', required: false, options: ['Identity', 'First Love', 'Family Conflict', 'Friendship', 'School/Social Issues', 'Mental Health', 'Social Justice'] },
            { id: 'contemporary-issues', name: 'Contemporary Issues', type: 'multiselect', required: false, options: ['Social Media', 'Climate Change', 'Diversity/Inclusion', 'Mental Health', 'Technology', 'Political Activism', 'Economic Inequality'] }
        ],
        folders: [
            { name: 'Adolescent Psychology', type: ResearchFolderType.Character, color: '#F59E0B', description: 'Teen brain development, emotional patterns, decision-making' },
            { name: 'Contemporary Teen Life', type: ResearchFolderType.TopicalResearch, color: '#10B981', description: 'Current teen culture, technology use, social dynamics' },
            { name: 'Educational System', type: ResearchFolderType.Default, color: '#3B82F6', description: 'School systems, academic pressures, extracurriculars' },
            { name: 'Family Dynamics', type: ResearchFolderType.Character, color: '#EC4899', description: 'Teen-parent relationships, sibling dynamics, family structures' },
            { name: 'Social Issues', type: ResearchFolderType.TopicalResearch, color: '#8B5CF6', description: 'Issues affecting modern teens, social justice, activism' }
        ],
        prompts: [
            { id: 'teen-psychology', title: 'Adolescent Psychology Research', prompt: 'Research adolescent brain development and decision-making for ages [age range]. How do teens process emotions, make decisions, and form identity? What are typical challenges and growth patterns?', type: ResearchType.TopicalResearch, category: 'Psychology' },
            { id: 'contemporary-culture', title: 'Contemporary Teen Culture', prompt: 'Research current teen culture, trends, and communication patterns. How do modern teenagers interact, what platforms do they use, what concerns them most? Include generational differences.', type: ResearchType.TopicalResearch, category: 'Culture' },
            { id: 'social-issues', title: 'Teen Social Issues Research', prompt: 'Research how [contemporary issue] affects teenagers today. What are the unique challenges teens face with this issue? How do they cope, resist, or engage with it?', type: ResearchType.TopicalResearch, category: 'Social Issues' }
        ]
    }
];

interface ResearchTemplatesModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const ResearchTemplatesModal: React.FC<ResearchTemplatesModalProps> = ({ isOpen, onClose }) => {
    const [selectedTemplate, setSelectedTemplate] = useState<ResearchTemplate | null>(null);
    const [customFields, setCustomFields] = useState<Record<string, any>>({});
    const [showPreview, setShowPreview] = useState(false);

    const createResearchFolder = useBookCraftStore(state => state.createResearchFolder);
    const performResearch = useBookCraftStore(state => state.performResearch);

    const handleTemplateSelect = (template: ResearchTemplate) => {
        setSelectedTemplate(template);
        setCustomFields({});
        setShowPreview(true);
    };

    const handleFieldChange = (fieldId: string, value: any) => {
        setCustomFields(prev => ({ ...prev, [fieldId]: value }));
    };

    const handleApplyTemplate = async () => {
        if (!selectedTemplate) return;

        try {
            // Create folder structure
            for (const folder of selectedTemplate.folders) {
                createResearchFolder(folder.name, folder.type);
            }

            // Generate initial research based on prompts and custom fields
            let researchCount = 0;
            const maxResearch = 3; // Limit to avoid overwhelming the user

            for (const prompt of selectedTemplate.prompts.slice(0, maxResearch)) {
                let finalPrompt = prompt.prompt;
                
                // Replace placeholders with custom field values
                Object.entries(customFields).forEach(([fieldId, value]) => {
                    const field = selectedTemplate.fields.find(f => f.id === fieldId);
                    if (field && value) {
                        const placeholderRegex = new RegExp(`\\[${field.name.toLowerCase().replace(/\s+/g, '[ _]')}\\]`, 'gi');
                        finalPrompt = finalPrompt.replace(placeholderRegex, Array.isArray(value) ? value.join(', ') : value);
                    }
                });

                // Replace any remaining generic placeholders
                finalPrompt = finalPrompt.replace(/\[([^\]]+)\]/g, (match, content) => {
                    return content.toLowerCase().includes('location') ? (customFields['specific-location'] || customFields['setting-location'] || 'your setting') :
                           content.toLowerCase().includes('time') || content.toLowerCase().includes('period') ? (customFields['historical-era'] || customFields['setting-era'] || 'your time period') :
                           content.toLowerCase().includes('character') ? 'your character' :
                           content.toLowerCase().includes('concept') ? 'your concept' :
                           content;
                });

                await performResearch(finalPrompt, prompt.type);
                researchCount++;
            }

            onClose();
            setSelectedTemplate(null);
            setCustomFields({});
            setShowPreview(false);
            
        } catch (error) {
            log.error('ResearchTemplatesModal: Error applying research template', error);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-slate-800 border border-slate-700 rounded-lg shadow-xl max-w-6xl w-full mx-4 max-h-[90vh] overflow-hidden">
                <div className="flex">
                    {/* Template Selection */}
                    <div className="w-1/3 border-r border-slate-700 p-6 overflow-y-auto max-h-[90vh]">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-slate-100">Research Templates</h2>
                            <button
                                onClick={onClose}
                                className="text-slate-400 hover:text-slate-200"
                            >
                                <XMarkIcon className="w-6 h-6" />
                            </button>
                        </div>
                        
                        <p className="text-sm text-slate-400 mb-6">
                            Choose from our comprehensive research templates designed for different writing genres. Each template includes customizable research folders, targeted prompts, and genre-specific guidance to help you gather authentic, relevant information for your writing project.
                        </p>

                        <div className="space-y-3">
                            {RESEARCH_TEMPLATES.map(template => (
                                <Card
                                    key={template.id}
                                    className={`p-4 cursor-pointer transition-all hover:bg-slate-700/50 ${
                                        selectedTemplate?.id === template.id ? 'border-2 border-blue-500 bg-blue-900/20' : ''
                                    }`}
                                    onClick={() => handleTemplateSelect(template)}
                                >
                                    <div className="flex items-start gap-3">
                                        <div 
                                            className="p-2 rounded-lg"
                                            style={{ backgroundColor: `${template.color}20`, color: template.color }}
                                        >
                                            {template.icon}
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-semibold text-slate-200">{template.name}</h3>
                                            <p className="text-sm text-slate-400 mt-1">{template.description}</p>
                                            <div className="flex items-center gap-2 mt-2">
                                                <span className="text-xs bg-slate-700 text-slate-300 px-2 py-1 rounded">
                                                    {template.folders.length} folders
                                                </span>
                                                <span className="text-xs bg-slate-700 text-slate-300 px-2 py-1 rounded">
                                                    {template.prompts.length} prompts
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    </div>

                    {/* Template Preview/Configuration */}
                    <div className="flex-1 p-6 overflow-y-auto max-h-[90vh]">
                        {!selectedTemplate ? (
                            <div className="text-center py-20">
                                <BookOpenIcon className="mx-auto h-12 w-12 text-slate-600 mb-4" />
                                <h3 className="text-lg font-semibold text-slate-300 mb-2">Select a Template</h3>
                                <p className="text-slate-400">Choose a research template from the left to see its details and customize it for your project.</p>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                <div className="flex items-start gap-4">
                                    <div 
                                        className="p-3 rounded-lg"
                                        style={{ backgroundColor: `${selectedTemplate.color}20`, color: selectedTemplate.color }}
                                    >
                                        {selectedTemplate.icon}
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-bold text-slate-100">{selectedTemplate.name}</h2>
                                        <p className="text-slate-400 mt-1">{selectedTemplate.description}</p>
                                    </div>
                                </div>

                                {/* Custom Fields */}
                                {selectedTemplate.fields.length > 0 && (
                                    <Card className="p-6">
                                        <h3 className="text-lg font-semibold text-slate-200 mb-4">Customize Your Template</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {selectedTemplate.fields.map(field => (
                                                <div key={field.id}>
                                                    <label className="block text-sm font-medium text-slate-300 mb-2">
                                                        {field.name}
                                                        {field.required && <span className="text-red-400 ml-1">*</span>}
                                                    </label>
                                                    
                                                    {field.type === 'select' && (
                                                        <Select
                                                            value={customFields[field.id] || ''}
                                                            onChange={(e) => handleFieldChange(field.id, e.target.value)}
                                                        >
                                                            <option value="">Select...</option>
                                                            {field.options?.map(option => (
                                                                <option key={option} value={option}>{option}</option>
                                                            ))}
                                                        </Select>
                                                    )}
                                                    
                                                    {field.type === 'multiselect' && (
                                                        <select
                                                            multiple
                                                            value={customFields[field.id] || []}
                                                            onChange={(e) => {
                                                                const values = Array.from(e.target.selectedOptions, option => option.value);
                                                                handleFieldChange(field.id, values);
                                                            }}
                                                            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-primary"
                                                        >
                                                            {field.options?.map(option => (
                                                                <option key={option} value={option}>{option}</option>
                                                            ))}
                                                        </select>
                                                    )}
                                                    
                                                    {field.type === 'textarea' && (
                                                        <textarea
                                                            value={customFields[field.id] || ''}
                                                            onChange={(e) => handleFieldChange(field.id, e.target.value)}
                                                            placeholder={field.placeholder}
                                                            rows={3}
                                                            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-primary resize-none"
                                                        />
                                                    )}
                                                    
                                                    {(field.type === 'text' || field.type === 'number') && (
                                                        <Input
                                                            type={field.type}
                                                            value={customFields[field.id] || ''}
                                                            onChange={(e) => handleFieldChange(field.id, field.type === 'number' ? parseInt(e.target.value) || '' : e.target.value)}
                                                            placeholder={field.placeholder}
                                                        />
                                                    )}
                                                    
                                                    {field.description && (
                                                        <p className="text-xs text-slate-500 mt-1">{field.description}</p>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </Card>
                                )}

                                {/* Folder Structure Preview */}
                                <Card className="p-6">
                                    <h3 className="text-lg font-semibold text-slate-200 mb-4">Folder Structure</h3>
                                    <div className="space-y-3">
                                        {selectedTemplate.folders.map(folder => (
                                            <div key={folder.name} className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg">
                                                <div 
                                                    className="w-4 h-4 rounded"
                                                    style={{ backgroundColor: folder.color }}
                                                />
                                                <div>
                                                    <h4 className="font-medium text-slate-200">{folder.name}</h4>
                                                    <p className="text-xs text-slate-400">{folder.description}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </Card>

                                {/* Research Prompts Preview */}
                                <Card className="p-6">
                                    <h3 className="text-lg font-semibold text-slate-200 mb-4">Initial Research Prompts</h3>
                                    <p className="text-sm text-slate-400 mb-4">
                                        The template will generate these research queries to get you started:
                                    </p>
                                    <div className="space-y-3">
                                        {selectedTemplate.prompts.slice(0, 3).map(prompt => (
                                            <div key={prompt.id} className="p-3 bg-slate-800/50 rounded-lg">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <h4 className="font-medium text-slate-200">{prompt.title}</h4>
                                                    <span className="text-xs bg-slate-700 text-slate-300 px-2 py-1 rounded">
                                                        {prompt.category}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-slate-400">{prompt.prompt.substring(0, 150)}...</p>
                                            </div>
                                        ))}
                                        {selectedTemplate.prompts.length > 3 && (
                                            <p className="text-xs text-slate-500">
                                                +{selectedTemplate.prompts.length - 3} more prompts available
                                            </p>
                                        )}
                                    </div>
                                </Card>

                                {/* Actions */}
                                <div className="flex justify-end gap-3 pt-4 border-t border-slate-700">
                                    <Button variant="outline" onClick={() => setSelectedTemplate(null)}>
                                        Back
                                    </Button>
                                    <Button onClick={handleApplyTemplate}>
                                        Apply Template
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};