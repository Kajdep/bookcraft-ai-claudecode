import React, { useState } from 'react';
import { Card, Button, Input, Select } from '../UI';
import { BookOpenIcon, AcademicCapIcon, RocketLaunchIcon, SparklesIcon, HeartIcon, MagnifyingGlassIcon, ClockIcon, UserGroupIcon, PlusIcon, XMarkIcon, DocumentTextIcon, PencilIcon } from '../Icons';
import { useBookCraftStore } from '../../store/useStore';
import { Genre } from '../../types';

export interface WritingTemplate {
    id: string;
    name: string;
    genre: Genre;
    description: string;
    icon: React.ReactNode;
    color: string;
    structure: ChapterStructure[];
    characterGuides: CharacterGuide[];
    plotFramework: PlotFramework;
    writingPrompts: WritingPrompt[];
    targetWordCount: number;
    estimatedChapters: number;
}

export interface ChapterStructure {
    chapterNumber: number;
    title: string;
    purpose: string;
    keyElements: string[];
    wordCountRange: { min: number; max: number };
    plotPoints?: string[];
    characterFocus?: string[];
}

export interface CharacterGuide {
    id: string;
    role: 'protagonist' | 'antagonist' | 'supporting' | 'minor';
    developmentAreas: string[];
    keyQuestions: string[];
    relationshipMapping: string[];
}

export interface PlotFramework {
    structure: 'three-act' | 'hero-journey' | 'save-the-cat' | 'five-act' | 'custom';
    acts: PlotAct[];
    keyTurningPoints: string[];
    climaxGuidelines: string[];
}

export interface PlotAct {
    actNumber: number;
    name: string;
    percentage: number; // Percentage of total word count
    purpose: string;
    keyEvents: string[];
}

export interface WritingPrompt {
    id: string;
    category: 'opening' | 'character' | 'conflict' | 'dialogue' | 'setting' | 'ending';
    prompt: string;
    context: string;
}

const WRITING_TEMPLATES: WritingTemplate[] = [
    {
        id: 'romance-novel',
        name: 'Romance Novel',
        genre: Genre.Fiction,
        description: 'Classic romance structure with character development, relationship arc, and satisfying resolution',
        icon: <HeartIcon className="w-6 h-6" />,
        color: '#EC4899',
        targetWordCount: 80000,
        estimatedChapters: 20,
        structure: [
            {
                chapterNumber: 1,
                title: 'Meet Cute / Inciting Incident',
                purpose: 'Introduce protagonists and establish initial conflict or attraction',
                keyElements: ['Character introduction', 'Setting establishment', 'Initial spark/conflict'],
                wordCountRange: { min: 3000, max: 5000 },
                plotPoints: ['First encounter', 'Immediate attraction or conflict', 'Hook for reader'],
                characterFocus: ['Protagonist A', 'Protagonist B']
            },
            {
                chapterNumber: 2,
                title: 'Getting to Know You',
                purpose: 'Develop characters and build initial relationship foundation',
                keyElements: ['Character backstory', 'Relationship dynamics', 'Secondary characters'],
                wordCountRange: { min: 3000, max: 4000 },
                plotPoints: ['Deeper character reveal', 'Relationship complications', 'Supporting cast introduction']
            },
            {
                chapterNumber: 10,
                title: 'The Big Misunderstanding',
                purpose: 'Create the central conflict that threatens the relationship',
                keyElements: ['Major conflict', 'Emotional stakes', 'Character flaws revealed'],
                wordCountRange: { min: 4000, max: 5000 },
                plotPoints: ['Misunderstanding/betrayal', 'Characters at odds', 'Relationship in jeopardy']
            },
            {
                chapterNumber: 18,
                title: 'The Grand Gesture',
                purpose: 'Resolution of conflict and character growth demonstration',
                keyElements: ['Character growth', 'Conflict resolution', 'Romantic gesture'],
                wordCountRange: { min: 4000, max: 5000 },
                plotPoints: ['Character realizes truth', 'Makes sacrifice/gesture', 'Shows growth']
            },
            {
                chapterNumber: 20,
                title: 'Happily Ever After',
                purpose: 'Satisfying conclusion with clear relationship resolution',
                keyElements: ['Relationship resolved', 'Future implications', 'Emotional satisfaction'],
                wordCountRange: { min: 3000, max: 4000 },
                plotPoints: ['Confession/reconciliation', 'Commitment made', 'Future together']
            }
        ],
        characterGuides: [
            {
                id: 'protagonist-a',
                role: 'protagonist',
                developmentAreas: ['Emotional vulnerability', 'Past trauma resolution', 'Learning to trust'],
                keyQuestions: [
                    'What prevents them from opening up to love?',
                    'What is their greatest fear in relationships?',
                    'How do they show affection?',
                    'What would they sacrifice for love?'
                ],
                relationshipMapping: ['Family dynamics', 'Past relationships', 'Friend circle', 'Professional relationships']
            },
            {
                id: 'protagonist-b',
                role: 'protagonist',
                developmentAreas: ['Self-worth issues', 'Communication skills', 'Commitment readiness'],
                keyQuestions: [
                    'What makes them worthy of love?',
                    'How do they handle conflict?',
                    'What are their non-negotiables?',
                    'What do they bring to the relationship?'
                ],
                relationshipMapping: ['Support system', 'Romantic history', 'Career obligations', 'Personal goals']
            }
        ],
        plotFramework: {
            structure: 'three-act',
            acts: [
                {
                    actNumber: 1,
                    name: 'Setup & Meet Cute',
                    percentage: 25,
                    purpose: 'Introduce characters, establish world, create initial attraction',
                    keyEvents: ['Character introductions', 'Meet cute moment', 'Initial attraction/conflict', 'World building']
                },
                {
                    actNumber: 2,
                    name: 'Development & Conflict',
                    percentage: 50,
                    purpose: 'Build relationship, create obstacles, develop characters',
                    keyEvents: ['Relationship building', 'Character development', 'Obstacles introduced', 'Midpoint crisis']
                },
                {
                    actNumber: 3,
                    name: 'Resolution & HEA',
                    percentage: 25,
                    purpose: 'Resolve conflicts, character growth, satisfying ending',
                    keyEvents: ['Black moment', 'Character growth', 'Grand gesture', 'Happily Ever After']
                }
            ],
            keyTurningPoints: [
                'Initial meeting/attraction',
                'First kiss/intimate moment',
                'Major misunderstanding',
                'Black moment/separation',
                'Realization/growth',
                'Grand gesture',
                'Commitment/HEA'
            ],
            climaxGuidelines: [
                'Characters must face their greatest fear',
                'Growth must be demonstrated, not told',
                'Resolution must feel earned',
                'Both characters should contribute to solution'
            ]
        },
        writingPrompts: [
            {
                id: 'rom-opening-1',
                category: 'opening',
                prompt: 'Your protagonist spills coffee on someone who turns out to be...',
                context: 'Classic meet-cute scenario that can be adapted to any setting'
            },
            {
                id: 'rom-character-1',
                category: 'character',
                prompt: 'What lie does your character tell themselves about what they want in a partner?',
                context: 'Explores character self-awareness and growth potential'
            },
            {
                id: 'rom-conflict-1',
                category: 'conflict',
                prompt: 'Your character discovers their love interest has been hiding something that challenges everything they believed about them.',
                context: 'Creates opportunity for trust issues and character growth'
            }
        ]
    },
    {
        id: 'mystery-thriller',
        name: 'Mystery Thriller',
        genre: Genre.Fiction,
        description: 'Suspenseful mystery with clues, red herrings, and satisfying resolution',
        icon: <MagnifyingGlassIcon className="w-6 h-6" />,
        color: '#DC2626',
        targetWordCount: 75000,
        estimatedChapters: 25,
        structure: [
            {
                chapterNumber: 1,
                title: 'The Crime',
                purpose: 'Establish the central mystery and introduce key players',
                keyElements: ['Crime/mystery introduction', 'Protagonist introduction', 'Initial clues'],
                wordCountRange: { min: 2500, max: 4000 },
                plotPoints: ['Crime occurs', 'Protagonist involved', 'Initial investigation begins'],
                characterFocus: ['Detective/Protagonist', 'Victim', 'Initial suspects']
            },
            {
                chapterNumber: 5,
                title: 'First Red Herring',
                purpose: 'Introduce false clues and misdirect the reader',
                keyElements: ['False lead', 'Character development', 'Clue analysis'],
                wordCountRange: { min: 3000, max: 3500 },
                plotPoints: ['Suspicious evidence found', 'False accusation', 'Truth complications']
            },
            {
                chapterNumber: 12,
                title: 'Midpoint Revelation',
                purpose: 'Major clue or twist that changes the investigation direction',
                keyElements: ['Key revelation', 'Stakes escalation', 'New direction'],
                wordCountRange: { min: 3000, max: 4000 },
                plotPoints: ['Major clue discovered', 'Case complexity revealed', 'Personal stakes raised']
            },
            {
                chapterNumber: 20,
                title: 'The Trap',
                purpose: 'Protagonist confronts the truth but faces danger',
                keyElements: ['Confrontation setup', 'Danger escalates', 'Truth revealed'],
                wordCountRange: { min: 3500, max: 4500 },
                plotPoints: ['Perpetrator identified', 'Confrontation planned', 'Danger imminent']
            },
            {
                chapterNumber: 25,
                title: 'Resolution',
                purpose: 'All mysteries solved, justice served, loose ends tied',
                keyElements: ['Complete revelation', 'Justice/resolution', 'Character reflection'],
                wordCountRange: { min: 3000, max: 4000 },
                plotPoints: ['Full truth revealed', 'Perpetrator caught', 'Aftermath resolution']
            }
        ],
        characterGuides: [
            {
                id: 'detective-protagonist',
                role: 'protagonist',
                developmentAreas: ['Observational skills', 'Personal demons', 'Moral compass'],
                keyQuestions: [
                    'What drives them to seek justice?',
                    'What personal stakes do they have?',
                    'What are their investigative strengths/weaknesses?',
                    'How does this case change them?'
                ],
                relationshipMapping: ['Law enforcement contacts', 'Personal relationships', 'Victim connections', 'Suspect interactions']
            },
            {
                id: 'perpetrator',
                role: 'antagonist',
                developmentAreas: ['Motivation clarity', 'Method sophistication', 'Vulnerability/weakness'],
                keyQuestions: [
                    'What is their true motive?',
                    'How do they stay hidden?',
                    'What mistake will expose them?',
                    'What makes them sympathetic/terrifying?'
                ],
                relationshipMapping: ['Victim relationship', 'Other character connections', 'Authority relationships', 'Hidden alliances']
            }
        ],
        plotFramework: {
            structure: 'three-act',
            acts: [
                {
                    actNumber: 1,
                    name: 'Crime & Investigation Setup',
                    percentage: 25,
                    purpose: 'Establish mystery, introduce characters, begin investigation',
                    keyEvents: ['Crime occurs', 'Protagonist enters', 'Initial clues gathered', 'Stakes established']
                },
                {
                    actNumber: 2,
                    name: 'Investigation & Complications',
                    percentage: 50,
                    purpose: 'Follow clues, encounter red herrings, develop suspects',
                    keyEvents: ['Clue following', 'Red herrings', 'Suspect development', 'Midpoint twist']
                },
                {
                    actNumber: 3,
                    name: 'Resolution & Justice',
                    percentage: 25,
                    purpose: 'Solve mystery, confront perpetrator, deliver justice',
                    keyEvents: ['Truth discovered', 'Climactic confrontation', 'Resolution', 'Justice served']
                }
            ],
            keyTurningPoints: [
                'Crime discovery',
                'Investigation begins',
                'First major clue',
                'Red herring revealed',
                'Midpoint twist',
                'Truth realization',
                'Final confrontation',
                'Resolution'
            ],
            climaxGuidelines: [
                'All clues must come together logically',
                'Protagonist must solve through deduction, not luck',
                'Resolution must be satisfying and earned',
                'Reader should be able to solve alongside protagonist'
            ]
        },
        writingPrompts: [
            {
                id: 'mys-opening-1',
                category: 'opening',
                prompt: 'A seemingly ordinary object at the crime scene holds the key to everything.',
                context: 'Focuses attention on detail and observation'
            },
            {
                id: 'mys-character-1',
                category: 'character',
                prompt: 'Your detective has a personal connection to this type of crime that they haven\'t revealed.',
                context: 'Adds personal stakes and character depth'
            }
        ]
    },
    {
        id: 'sci-fi-novel',
        name: 'Science Fiction Epic',
        genre: Genre.SciFi,
        description: 'Epic sci-fi with world-building, technological concepts, and grand scope',
        icon: <RocketLaunchIcon className="w-6 h-6" />,
        color: '#06B6D4',
        targetWordCount: 100000,
        estimatedChapters: 30,
        structure: [
            {
                chapterNumber: 1,
                title: 'World Introduction',
                purpose: 'Establish the sci-fi world and introduce protagonist in their normal environment',
                keyElements: ['World-building', 'Technology showcase', 'Character introduction'],
                wordCountRange: { min: 3000, max: 4500 },
                plotPoints: ['World establishment', 'Character in normal life', 'Technology demonstration'],
                characterFocus: ['Protagonist', 'Supporting characters', 'World systems']
            },
            {
                chapterNumber: 5,
                title: 'The Discovery',
                purpose: 'Protagonist encounters the central sci-fi element that drives the plot',
                keyElements: ['Central discovery', 'Stakes escalation', 'World expansion'],
                wordCountRange: { min: 3500, max: 4000 },
                plotPoints: ['Major discovery made', 'Implications realized', 'Conflict introduced']
            },
            {
                chapterNumber: 15,
                title: 'System Breakdown',
                purpose: 'The established order begins to fail, forcing change',
                keyElements: ['System failure', 'Character adaptation', 'New alliances'],
                wordCountRange: { min: 3500, max: 4500 },
                plotPoints: ['Status quo collapses', 'Characters must adapt', 'New challenges emerge']
            },
            {
                chapterNumber: 25,
                title: 'The Solution',
                purpose: 'Protagonist uses accumulated knowledge to address the central problem',
                keyElements: ['Scientific solution', 'Character growth', 'Climactic action'],
                wordCountRange: { min: 4000, max: 5000 },
                plotPoints: ['Solution implemented', 'Final confrontation', 'Stakes at maximum']
            },
            {
                chapterNumber: 30,
                title: 'New Paradigm',
                purpose: 'Show the changed world and character growth',
                keyElements: ['Changed world', 'Character reflection', 'Future implications'],
                wordCountRange: { min: 3000, max: 4000 },
                plotPoints: ['New world order', 'Character evolution', 'Future possibilities']
            }
        ],
        characterGuides: [
            {
                id: 'sci-fi-protagonist',
                role: 'protagonist',
                developmentAreas: ['Scientific understanding', 'Moral evolution', 'Leadership growth'],
                keyQuestions: [
                    'How do they adapt to technological change?',
                    'What ethical dilemmas do they face?',
                    'How does the future challenge their values?',
                    'What makes them uniquely qualified for this journey?'
                ],
                relationshipMapping: ['Scientific community', 'Technology interfaces', 'Future society', 'Alien/AI contacts']
            }
        ],
        plotFramework: {
            structure: 'hero-journey',
            acts: [
                {
                    actNumber: 1,
                    name: 'The Ordinary World',
                    percentage: 20,
                    purpose: 'Establish sci-fi world and character\'s place in it',
                    keyEvents: ['World establishment', 'Character introduction', 'Call to adventure', 'Refusal/acceptance']
                },
                {
                    actNumber: 2,
                    name: 'The Special World',
                    percentage: 60,
                    purpose: 'Character navigates challenges in changed/new environment',
                    keyEvents: ['Threshold crossing', 'Tests and trials', 'Allies and enemies', 'Approach to ordeal']
                },
                {
                    actNumber: 3,
                    name: 'The Return',
                    percentage: 20,
                    purpose: 'Character returns transformed with new knowledge/power',
                    keyEvents: ['Ordeal survived', 'Reward gained', 'Road back', 'Resurrection/transformation']
                }
            ],
            keyTurningPoints: [
                'Call to adventure',
                'Crossing the threshold',
                'Meeting the mentor',
                'Ordeal faced',
                'Death/rebirth moment',
                'Return with elixir'
            ],
            climaxGuidelines: [
                'Science/technology must be integral to resolution',
                'Character growth should be demonstrated through action',
                'World-changing implications should be clear',
                'Future possibilities should be established'
            ]
        },
        writingPrompts: [
            {
                id: 'scifi-opening-1',
                category: 'opening',
                prompt: 'Your character\'s routine use of advanced technology reveals something is fundamentally wrong with their world.',
                context: 'Uses familiar technology to reveal unfamiliar problems'
            },
            {
                id: 'scifi-setting-1',
                category: 'setting',
                prompt: 'Describe a place where the laws of physics work differently than Earth.',
                context: 'Challenges world-building and scientific creativity'
            }
        ]
    },
    {
        id: 'fantasy-epic',
        name: 'Epic Fantasy',
        genre: Genre.Fantasy,
        description: 'Grand fantasy adventure with magic systems, world-building, and hero\'s journey',
        icon: <SparklesIcon className="w-6 h-6" />,
        color: '#8B5CF6',
        targetWordCount: 120000,
        estimatedChapters: 35,
        structure: [
            {
                chapterNumber: 1,
                title: 'The Humble Beginning',
                purpose: 'Introduce hero in ordinary world before the adventure begins',
                keyElements: ['Character introduction', 'Ordinary world', 'Inciting incident'],
                wordCountRange: { min: 3000, max: 4000 },
                plotPoints: ['Hero\'s ordinary life', 'World establishment', 'Call to adventure'],
                characterFocus: ['Hero', 'Mentor figure', 'Home community']
            },
            {
                chapterNumber: 8,
                title: 'The Magic System',
                purpose: 'Introduce and explain the magic system and its rules',
                keyElements: ['Magic revelation', 'System explanation', 'First magical experience'],
                wordCountRange: { min: 3500, max: 4500 },
                plotPoints: ['Magic discovered', 'Rules established', 'Training begins']
            },
            {
                chapterNumber: 18,
                title: 'The Great Challenge',
                purpose: 'Major test of character growth and magical abilities',
                keyElements: ['Major challenge', 'Character growth', 'Stakes escalation'],
                wordCountRange: { min: 4000, max: 5000 },
                plotPoints: ['Significant test faced', 'Skills proven', 'Confidence grows']
            },
            {
                chapterNumber: 30,
                title: 'The Dark Hour',
                purpose: 'All seems lost, hero must find inner strength',
                keyElements: ['Darkest moment', 'Inner strength', 'Sacrifice required'],
                wordCountRange: { min: 4000, max: 5000 },
                plotPoints: ['Greatest challenge', 'Despair moment', 'Inner resolve found']
            },
            {
                chapterNumber: 35,
                title: 'The New Dawn',
                purpose: 'Victory achieved, world changed, hero transformed',
                keyElements: ['Victory achieved', 'World changed', 'Character transformation'],
                wordCountRange: { min: 3500, max: 4500 },
                plotPoints: ['Evil defeated', 'Peace restored', 'Hero\'s growth complete']
            }
        ],
        characterGuides: [
            {
                id: 'fantasy-hero',
                role: 'protagonist',
                developmentAreas: ['Magical abilities', 'Moral courage', 'Leadership qualities'],
                keyQuestions: [
                    'What makes them worthy of the magical calling?',
                    'How do they grow from ordinary to extraordinary?',
                    'What sacrifices must they make?',
                    'How do they change the world?'
                ],
                relationshipMapping: ['Mentor relationship', 'Companion bonds', 'Enemy dynamics', 'World connections']
            },
            {
                id: 'dark-lord',
                role: 'antagonist',
                developmentAreas: ['Motivation clarity', 'Power corruption', 'Tragic elements'],
                keyQuestions: [
                    'What corrupted them originally?',
                    'What do they truly want?',
                    'What makes them formidable?',
                    'How might they be redeemed or defeated?'
                ],
                relationshipMapping: ['Hero opposition', 'Minion control', 'Past relationships', 'Power structures']
            }
        ],
        plotFramework: {
            structure: 'hero-journey',
            acts: [
                {
                    actNumber: 1,
                    name: 'The Ordinary World',
                    percentage: 25,
                    purpose: 'Establish normal life before the adventure',
                    keyEvents: ['Ordinary world', 'Call to adventure', 'Refusal of call', 'Meeting mentor']
                },
                {
                    actNumber: 2,
                    name: 'The Adventure',
                    percentage: 50,
                    purpose: 'Journey through the special world with tests and growth',
                    keyEvents: ['Threshold crossing', 'Tests and allies', 'Approach to ordeal', 'The ordeal']
                },
                {
                    actNumber: 3,
                    name: 'The Return',
                    percentage: 25,
                    purpose: 'Return with wisdom and power to transform the world',
                    keyEvents: ['Reward seized', 'Road back', 'Resurrection', 'Return with elixir']
                }
            ],
            keyTurningPoints: [
                'Call to adventure',
                'Crossing threshold',
                'Meeting mentor',
                'First magical experience',
                'Major test passed',
                'Darkest hour',
                'Final battle',
                'Triumphant return'
            ],
            climaxGuidelines: [
                'Magic must be earned through character growth',
                'Victory should require sacrifice',
                'World must be meaningfully changed',
                'Character arc must be complete'
            ]
        },
        writingPrompts: [
            {
                id: 'fantasy-opening-1',
                category: 'opening',
                prompt: 'Your ordinary protagonist discovers they can see/hear/sense something magical that others cannot.',
                context: 'Establishes special nature while maintaining relatability'
            },
            {
                id: 'fantasy-character-1',
                category: 'character',
                prompt: 'What ordinary skill or personality trait becomes magically significant?',
                context: 'Connects character\'s past to their magical destiny'
            }
        ]
    },
    {
        id: 'literary-fiction',
        name: 'Literary Fiction',
        genre: Genre.Fiction,
        description: 'Character-driven literary work focusing on internal journey and thematic depth',
        icon: <BookOpenIcon className="w-6 h-6" />,
        color: '#059669',
        targetWordCount: 85000,
        estimatedChapters: 22,
        structure: [
            {
                chapterNumber: 1,
                title: 'The Moment of Change',
                purpose: 'Introduce character at a pivotal moment in their life',
                keyElements: ['Character establishment', 'Thematic introduction', 'Inciting incident'],
                wordCountRange: { min: 3500, max: 4500 },
                plotPoints: ['Character in crisis', 'Life disruption', 'Theme establishment'],
                characterFocus: ['Protagonist', 'Key relationships', 'Internal state']
            },
            {
                chapterNumber: 6,
                title: 'The Past Intrudes',
                purpose: 'Reveal formative experiences that shaped the character',
                keyElements: ['Backstory revelation', 'Pattern recognition', 'Depth addition'],
                wordCountRange: { min: 3500, max: 4000 },
                plotPoints: ['Past revealed', 'Patterns emerge', 'Understanding deepens']
            },
            {
                chapterNumber: 11,
                title: 'The Midpoint Reflection',
                purpose: 'Character pauses to examine their life and choices',
                keyElements: ['Self-examination', 'Thematic exploration', 'Decision point'],
                wordCountRange: { min: 4000, max: 4500 },
                plotPoints: ['Life assessment', 'Value questioning', 'Choice looming']
            },
            {
                chapterNumber: 18,
                title: 'The Reckoning',
                purpose: 'Character faces the consequences of their choices',
                keyElements: ['Consequence facing', 'Truth confrontation', 'Change catalyst'],
                wordCountRange: { min: 4000, max: 5000 },
                plotPoints: ['Truth faced', 'Consequences accepted', 'Change initiated']
            },
            {
                chapterNumber: 22,
                title: 'The New Understanding',
                purpose: 'Character reaches new level of self-awareness',
                keyElements: ['Growth demonstrated', 'Wisdom gained', 'Future implied'],
                wordCountRange: { min: 3500, max: 4000 },
                plotPoints: ['Insight achieved', 'Peace found', 'Growth complete']
            }
        ],
        characterGuides: [
            {
                id: 'literary-protagonist',
                role: 'protagonist',
                developmentAreas: ['Self-awareness', 'Emotional maturity', 'Life perspective'],
                keyQuestions: [
                    'What truth about themselves do they resist?',
                    'How do they relate to others?',
                    'What do they value most deeply?',
                    'How do they change throughout the story?'
                ],
                relationshipMapping: ['Family dynamics', 'Intimate relationships', 'Professional connections', 'Community ties']
            }
        ],
        plotFramework: {
            structure: 'three-act',
            acts: [
                {
                    actNumber: 1,
                    name: 'Disruption',
                    percentage: 25,
                    purpose: 'Establish character and disrupt their equilibrium',
                    keyEvents: ['Character introduction', 'Normal life shown', 'Disruption occurs', 'Stakes established']
                },
                {
                    actNumber: 2,
                    name: 'Exploration',
                    percentage: 50,
                    purpose: 'Character explores new reality and themselves',
                    keyEvents: ['New situation navigated', 'Character depths revealed', 'Relationships explored', 'Internal conflict']
                },
                {
                    actNumber: 3,
                    name: 'Resolution',
                    percentage: 25,
                    purpose: 'Character finds new understanding or acceptance',
                    keyEvents: ['Truth confronted', 'Growth achieved', 'New perspective gained', 'Resolution found']
                }
            ],
            keyTurningPoints: [
                'Life disruption',
                'First recognition',
                'Deepening understanding',
                'Midpoint crisis',
                'Truth confrontation',
                'Final acceptance'
            ],
            climaxGuidelines: [
                'Resolution should be internal, not external',
                'Character growth should feel earned',
                'Themes should be illuminated, not preached',
                'Ending should resonate emotionally'
            ]
        },
        writingPrompts: [
            {
                id: 'lit-opening-1',
                category: 'opening',
                prompt: 'Your character receives news that forces them to confront a long-buried truth about themselves.',
                context: 'Immediate internal conflict and character revelation'
            },
            {
                id: 'lit-character-1',
                category: 'character',
                prompt: 'What does your character believe about themselves that others can see is false?',
                context: 'Explores self-awareness and external perspective'
            }
        ]
    }
];

interface WritingTemplatesModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const WritingTemplatesModal: React.FC<WritingTemplatesModalProps> = ({ isOpen, onClose }) => {
    const [selectedTemplate, setSelectedTemplate] = useState<WritingTemplate | null>(null);
    const [customSettings, setCustomSettings] = useState<{
        targetWordCount?: number;
        authorName?: string;
        customTitle?: string;
    }>({});

    const createProject = useBookCraftStore(state => state.createProject);
    const setActiveProject = useBookCraftStore(state => state.setActiveProject);

    const handleTemplateSelect = (template: WritingTemplate) => {
        setSelectedTemplate(template);
        setCustomSettings({ targetWordCount: template.targetWordCount });
    };

    const handleApplyTemplate = async () => {
        if (!selectedTemplate) return;

        try {
            // Create new project with template structure
            const projectTitle = customSettings.customTitle || `New ${selectedTemplate.name}`;
            const projectId = await createProject({
                title: projectTitle,
                genre: selectedTemplate.genre,
                visualStyle: 'Realistic', // Default visual style
            });

            // Set as active project
            setActiveProject(projectId);

            // Add template-based chapters
            const { addChapter } = useBookCraftStore.getState();
            
            selectedTemplate.structure.forEach((chapterStructure, index) => {
                const chapterContent = generateChapterTemplate(chapterStructure, selectedTemplate);
                
                addChapter({
                    title: chapterStructure.title,
                    content: chapterContent,
                    order: chapterStructure.chapterNumber,
                    wordCount: 0,
                    status: 'draft' as any,
                    notes: `Purpose: ${chapterStructure.purpose}\n\nKey Elements:\n${chapterStructure.keyElements.map(el => `• ${el}`).join('\n')}\n\nTarget Word Count: ${chapterStructure.wordCountRange.min}-${chapterStructure.wordCountRange.max} words`
                });
            });

            onClose();
            setSelectedTemplate(null);
            setCustomSettings({});
            
        } catch (error) {
            log.error('WritingTemplatesModal: Error applying writing template', error);
        }
    };

    const generateChapterTemplate = (structure: ChapterStructure, template: WritingTemplate): string => {
        let content = `# ${structure.title}\n\n`;
        content += `**Chapter Purpose:** ${structure.purpose}\n\n`;
        content += `**Key Elements to Include:**\n`;
        structure.keyElements.forEach(element => {
            content += `• ${element}\n`;
        });
        content += `\n**Target Word Count:** ${structure.wordCountRange.min}-${structure.wordCountRange.max} words\n\n`;
        
        if (structure.plotPoints && structure.plotPoints.length > 0) {
            content += `**Plot Points:**\n`;
            structure.plotPoints.forEach(point => {
                content += `• ${point}\n`;
            });
            content += '\n';
        }

        if (structure.characterFocus && structure.characterFocus.length > 0) {
            content += `**Character Focus:**\n`;
            structure.characterFocus.forEach(character => {
                content += `• ${character}\n`;
            });
            content += '\n';
        }

        content += `---\n\n*Begin writing your chapter content below this line...*\n\n`;
        
        return content;
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-slate-800 border border-slate-700 rounded-lg shadow-xl max-w-6xl w-full mx-4 max-h-[90vh] overflow-hidden">
                <div className="flex">
                    {/* Template Selection */}
                    <div className="w-1/3 border-r border-slate-700 p-6 overflow-y-auto max-h-[90vh]">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-slate-100">Writing Templates</h2>
                            <button
                                onClick={onClose}
                                className="text-slate-400 hover:text-slate-200"
                            >
                                <XMarkIcon className="w-6 h-6" />
                            </button>
                        </div>
                        
                        <p className="text-sm text-slate-400 mb-6">
                            Choose a genre-specific writing template to structure your book with proven frameworks and guidance.
                        </p>

                        <div className="space-y-3">
                            {WRITING_TEMPLATES.map(template => (
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
                                                    {template.estimatedChapters} chapters
                                                </span>
                                                <span className="text-xs bg-slate-700 text-slate-300 px-2 py-1 rounded">
                                                    {template.targetWordCount.toLocaleString()} words
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    </div>

                    {/* Template Details */}
                    <div className="flex-1 p-6 overflow-y-auto max-h-[90vh]">
                        {!selectedTemplate ? (
                            <div className="text-center py-20">
                                <DocumentTextIcon className="mx-auto h-12 w-12 text-slate-600 mb-4" />
                                <h3 className="text-lg font-semibold text-slate-300 mb-2">Select a Template</h3>
                                <p className="text-slate-400">Choose a writing template to see its structure and customize it for your project.</p>
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
                                        <div className="flex items-center gap-4 mt-2 text-sm text-slate-500">
                                            <span>{selectedTemplate.estimatedChapters} chapters</span>
                                            <span>{selectedTemplate.targetWordCount.toLocaleString()} words target</span>
                                            <span>{selectedTemplate.plotFramework.structure} structure</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Customization */}
                                <Card className="p-6">
                                    <h3 className="text-lg font-semibold text-slate-200 mb-4">Customize Your Project</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-300 mb-2">Project Title</label>
                                            <Input
                                                value={customSettings.customTitle || ''}
                                                onChange={(e) => setCustomSettings(prev => ({ ...prev, customTitle: e.target.value }))}
                                                placeholder={`My ${selectedTemplate.name}`}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-300 mb-2">Target Word Count</label>
                                            <Input
                                                type="number"
                                                value={customSettings.targetWordCount || selectedTemplate.targetWordCount}
                                                onChange={(e) => setCustomSettings(prev => ({ ...prev, targetWordCount: parseInt(e.target.value) || selectedTemplate.targetWordCount }))}
                                            />
                                        </div>
                                    </div>
                                </Card>

                                {/* Chapter Structure */}
                                <Card className="p-6">
                                    <h3 className="text-lg font-semibold text-slate-200 mb-4">Chapter Structure</h3>
                                    <div className="space-y-3">
                                        {selectedTemplate.structure.map(chapter => (
                                            <div key={chapter.chapterNumber} className="p-3 bg-slate-800/50 rounded-lg">
                                                <div className="flex items-center justify-between mb-2">
                                                    <h4 className="font-medium text-slate-200">
                                                        Chapter {chapter.chapterNumber}: {chapter.title}
                                                    </h4>
                                                    <span className="text-xs bg-slate-700 text-slate-300 px-2 py-1 rounded">
                                                        {chapter.wordCountRange.min}-{chapter.wordCountRange.max} words
                                                    </span>
                                                </div>
                                                <p className="text-sm text-slate-400 mb-2">{chapter.purpose}</p>
                                                <div className="text-xs text-slate-500">
                                                    Key elements: {chapter.keyElements.join(', ')}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </Card>

                                {/* Character Guides */}
                                <Card className="p-6">
                                    <h3 className="text-lg font-semibold text-slate-200 mb-4">Character Development Guide</h3>
                                    <div className="space-y-4">
                                        {selectedTemplate.characterGuides.map(guide => (
                                            <div key={guide.id} className="p-3 bg-slate-800/50 rounded-lg">
                                                <h4 className="font-medium text-slate-200 capitalize mb-2">{guide.role}</h4>
                                                <div className="space-y-2 text-sm">
                                                    <div>
                                                        <span className="text-slate-300 font-medium">Development Areas:</span>
                                                        <p className="text-slate-400">{guide.developmentAreas.join(', ')}</p>
                                                    </div>
                                                    <div>
                                                        <span className="text-slate-300 font-medium">Key Questions:</span>
                                                        <ul className="text-slate-400 list-disc list-inside mt-1">
                                                            {guide.keyQuestions.slice(0, 2).map((question, idx) => (
                                                                <li key={idx}>{question}</li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </Card>

                                {/* Actions */}
                                <div className="flex justify-end gap-3 pt-4 border-t border-slate-700">
                                    <Button variant="outline" onClick={() => setSelectedTemplate(null)}>
                                        Back
                                    </Button>
                                    <Button onClick={handleApplyTemplate}>
                                        Create Project from Template
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