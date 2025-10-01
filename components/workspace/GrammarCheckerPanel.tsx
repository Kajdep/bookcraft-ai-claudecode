import React, { useState, useEffect, useMemo } from 'react';
import { Card, Button, Badge, Tooltip } from '../UI';
import { CheckCircleIcon, ExclamationCircleIcon, ExclamationTriangleIcon, InformationCircleIcon, SparklesIcon, ClockIcon, DocumentTextIcon, BeakerIcon, ChartBarIcon, XMarkIcon } from '../Icons';
import { grammarService, GrammarIssue, GrammarCheckResult, StyleAnalysis } from '../../services/grammarService';

interface GrammarCheckerPanelProps {
    text: string;
    onTextCorrection?: (originalText: string, correctedText: string, startOffset: number, endOffset: number) => void;
    className?: string;
}

const IssueTypeIcon: React.FC<{ type: GrammarIssue['type']; severity: GrammarIssue['severity'] }> = ({ type, severity }) => {
    const iconClass = "w-4 h-4";
    
    if (severity === 'high') {
        return <ExclamationCircleIcon className={`${iconClass} text-red-400`} />;
    } else if (severity === 'medium') {
        return <ExclamationTriangleIcon className={`${iconClass} text-yellow-400`} />;
    } else {
        return <InformationCircleIcon className={`${iconClass} text-blue-400`} />;
    }
};

const SeverityBadge: React.FC<{ severity: GrammarIssue['severity'] }> = ({ severity }) => {
    const colors = {
        high: 'bg-red-500/20 text-red-200 border-red-500',
        medium: 'bg-yellow-500/20 text-yellow-200 border-yellow-500',
        low: 'bg-blue-500/20 text-blue-200 border-blue-500'
    };

    return (
        <Badge className={`${colors[severity]} text-xs`}>
            {severity.toUpperCase()}
        </Badge>
    );
};

const TypeBadge: React.FC<{ type: GrammarIssue['type'] }> = ({ type }) => {
    const colors = {
        grammar: 'bg-red-500/20 text-red-200',
        spelling: 'bg-orange-500/20 text-orange-200',
        style: 'bg-purple-500/20 text-purple-200',
        readability: 'bg-blue-500/20 text-blue-200',
        tone: 'bg-green-500/20 text-green-200'
    };

    return (
        <Badge className={`${colors[type]} text-xs capitalize`}>
            {type}
        </Badge>
    );
};

const ReadabilityMeter: React.FC<{ score: number; level: string }> = ({ score, level }) => {
    const getColor = (score: number) => {
        if (score >= 70) return 'bg-green-500';
        if (score >= 50) return 'bg-yellow-500';
        return 'bg-red-500';
    };

    return (
        <div className="space-y-2">
            <div className="flex justify-between items-center">
                <span className="text-sm text-slate-300">Readability Score</span>
                <span className="text-sm font-medium text-slate-200">{Math.round(score)}/100</span>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-2">
                <div 
                    className={`h-2 rounded-full transition-all duration-300 ${getColor(score)}`}
                    style={{ width: `${Math.max(0, Math.min(100, score))}%` }}
                ></div>
            </div>
            <div className="text-xs text-slate-400">{level}</div>
        </div>
    );
};

const ToneAnalysis: React.FC<{ toneAnalysis: StyleAnalysis['toneAnalysis'] }> = ({ toneAnalysis }) => {
    const { dominant, confidence, emotions } = toneAnalysis;
    
    return (
        <div className="space-y-3">
            <h4 className="text-sm font-medium text-slate-300">Tone Analysis</h4>
            <div className="space-y-2">
                <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-400 capitalize">{dominant} Tone</span>
                    <span className="text-sm font-medium text-slate-200">{Math.round(confidence * 100)}%</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                    {Object.entries(emotions).map(([emotion, value]) => (
                        <div key={emotion} className="flex justify-between">
                            <span className="text-slate-400 capitalize">{emotion}:</span>
                            <span className="text-slate-300">{Math.round(value * 100)}%</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

const StatCard: React.FC<{ label: string; value: string | number; icon: React.ReactNode; color?: string }> = ({ 
    label, value, icon, color = "text-blue-400" 
}) => (
    <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50">
        <div className="flex items-center gap-2 mb-1">
            <div className={color}>{icon}</div>
            <span className="text-xs text-slate-400">{label}</span>
        </div>
        <div className="text-lg font-semibold text-slate-200">{value}</div>
    </div>
);

export const GrammarCheckerPanel: React.FC<GrammarCheckerPanelProps> = ({ 
    text, 
    onTextCorrection,
    className = "" 
}) => {
    const [result, setResult] = useState<GrammarCheckResult | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [activeTab, setActiveTab] = useState<'issues' | 'style' | 'stats'>('issues');
    const [selectedIssue, setSelectedIssue] = useState<GrammarIssue | null>(null);
    const [fixedIssues, setFixedIssues] = useState<Set<string>>(new Set());

    const analyzeText = async () => {
        if (!text.trim()) {
            setResult(null);
            return;
        }

        setIsAnalyzing(true);
        try {
            const analysisResult = await grammarService.checkGrammarAndStyle(text);
            setResult(analysisResult);
        } catch (error) {
            console.error('Grammar analysis failed:', error);
        } finally {
            setIsAnalyzing(false);
        }
    };

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            analyzeText();
        }, 1000); // Debounce analysis

        return () => clearTimeout(timeoutId);
    }, [text]);

    const groupedIssues = useMemo(() => {
        if (!result) return {};
        
        return result.issues.reduce((groups, issue) => {
            if (!groups[issue.category]) {
                groups[issue.category] = [];
            }
            groups[issue.category].push(issue);
            return groups;
        }, {} as Record<string, GrammarIssue[]>);
    }, [result]);

    const handleApplyFix = (issue: GrammarIssue) => {
        if (!issue.replacementText || !onTextCorrection) return;
        
        onTextCorrection(
            issue.originalText,
            issue.replacementText,
            issue.startOffset,
            issue.endOffset
        );
        
        setFixedIssues(prev => new Set(prev).add(issue.id));
        setSelectedIssue(null);
    };

    const handleDismissIssue = (issue: GrammarIssue) => {
        setFixedIssues(prev => new Set(prev).add(issue.id));
        setSelectedIssue(null);
    };

    const activeIssues = result?.issues.filter(issue => !fixedIssues.has(issue.id)) || [];
    const issueStats = {
        total: activeIssues.length,
        high: activeIssues.filter(i => i.severity === 'high').length,
        medium: activeIssues.filter(i => i.severity === 'medium').length,
        low: activeIssues.filter(i => i.severity === 'low').length
    };

    if (isAnalyzing) {
        return (
            <Card className={`p-4 ${className}`}>
                <div className="flex items-center justify-center py-8">
                    <div className="animate-spin">
                        <SparklesIcon className="w-8 h-8 text-blue-400" />
                    </div>
                    <span className="ml-3 text-slate-300">Analyzing your writing...</span>
                </div>
            </Card>
        );
    }

    if (!result) {
        return (
            <Card className={`p-4 ${className}`}>
                <div className="text-center py-8">
                    <DocumentTextIcon className="mx-auto h-12 w-12 text-slate-600 mb-4" />
                    <h3 className="text-lg font-semibold text-slate-300 mb-2">Grammar & Style Checker</h3>
                    <p className="text-slate-400">Start writing to see grammar and style suggestions.</p>
                </div>
            </Card>
        );
    }

    return (
        <Card className={`${className}`}>
            <div className="border-b border-slate-700/50">
                <div className="flex items-center justify-between p-4 pb-3">
                    <h3 className="text-lg font-semibold text-slate-200 flex items-center gap-2">
                        <BeakerIcon className="w-5 h-5 text-blue-400" />
                        Writing Analysis
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                        <ClockIcon className="w-4 h-4" />
                        {result.processingTime}ms
                    </div>
                </div>
                
                <div className="flex border-t border-slate-700/50">
                    <button
                        onClick={() => setActiveTab('issues')}
                        className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
                            activeTab === 'issues' 
                                ? 'bg-blue-500/10 text-blue-300 border-b-2 border-blue-500' 
                                : 'text-slate-400 hover:text-slate-300'
                        }`}
                    >
                        Issues ({issueStats.total})
                    </button>
                    <button
                        onClick={() => setActiveTab('style')}
                        className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
                            activeTab === 'style' 
                                ? 'bg-purple-500/10 text-purple-300 border-b-2 border-purple-500' 
                                : 'text-slate-400 hover:text-slate-300'
                        }`}
                    >
                        Style Analysis
                    </button>
                    <button
                        onClick={() => setActiveTab('stats')}
                        className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
                            activeTab === 'stats' 
                                ? 'bg-green-500/10 text-green-300 border-b-2 border-green-500' 
                                : 'text-slate-400 hover:text-slate-300'
                        }`}
                    >
                        Statistics
                    </button>
                </div>
            </div>

            <div className="p-4 max-h-[500px] overflow-y-auto">
                {activeTab === 'issues' && (
                    <div className="space-y-4">
                        {issueStats.total === 0 ? (
                            <div className="text-center py-8">
                                <CheckCircleIcon className="mx-auto h-12 w-12 text-green-400 mb-4" />
                                <h4 className="text-lg font-semibold text-green-300 mb-2">Great Job!</h4>
                                <p className="text-slate-400">No grammar or style issues detected.</p>
                            </div>
                        ) : (
                            <>
                                <div className="flex gap-2 mb-4">
                                    {issueStats.high > 0 && (
                                        <Badge className="bg-red-500/20 text-red-200 border-red-500">
                                            {issueStats.high} High Priority
                                        </Badge>
                                    )}
                                    {issueStats.medium > 0 && (
                                        <Badge className="bg-yellow-500/20 text-yellow-200 border-yellow-500">
                                            {issueStats.medium} Medium Priority
                                        </Badge>
                                    )}
                                    {issueStats.low > 0 && (
                                        <Badge className="bg-blue-500/20 text-blue-200 border-blue-500">
                                            {issueStats.low} Low Priority
                                        </Badge>
                                    )}
                                </div>

                                {Object.entries(groupedIssues).map(([category, issues]) => {
                                    const categoryIssues = issues.filter(issue => !fixedIssues.has(issue.id));
                                    if (categoryIssues.length === 0) return null;

                                    return (
                                        <div key={category} className="space-y-2">
                                            <h4 className="text-sm font-medium text-slate-300 border-b border-slate-700/50 pb-1">
                                                {category} ({categoryIssues.length})
                                            </h4>
                                            {categoryIssues.map((issue) => (
                                                <div 
                                                    key={issue.id} 
                                                    className={`p-3 bg-slate-800/30 rounded-lg border cursor-pointer transition-all ${
                                                        selectedIssue?.id === issue.id 
                                                            ? 'border-blue-500 bg-blue-500/10' 
                                                            : 'border-slate-700/50 hover:border-slate-600'
                                                    }`}
                                                    onClick={() => setSelectedIssue(selectedIssue?.id === issue.id ? null : issue)}
                                                >
                                                    <div className="flex items-start gap-3">
                                                        <IssueTypeIcon type={issue.type} severity={issue.severity} />
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <TypeBadge type={issue.type} />
                                                                <SeverityBadge severity={issue.severity} />
                                                            </div>
                                                            <p className="text-sm text-slate-300 mb-1">{issue.message}</p>
                                                            <p className="text-xs text-slate-400">{issue.suggestion}</p>
                                                            
                                                            {selectedIssue?.id === issue.id && (
                                                                <div className="mt-3 pt-3 border-t border-slate-700/50">
                                                                    <div className="bg-slate-900/50 p-2 rounded text-xs mb-3">
                                                                        <div className="text-slate-400 mb-1">Original:</div>
                                                                        <div className="text-red-300 mb-2">"{issue.originalText}"</div>
                                                                        {issue.replacementText && (
                                                                            <>
                                                                                <div className="text-slate-400 mb-1">Suggested:</div>
                                                                                <div className="text-green-300">"{issue.replacementText}"</div>
                                                                            </>
                                                                        )}
                                                                    </div>
                                                                    <div className="flex gap-2">
                                                                        {issue.replacementText && (
                                                                            <Button
                                                                                size="sm"
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    handleApplyFix(issue);
                                                                                }}
                                                                                className="flex-1"
                                                                            >
                                                                                Apply Fix
                                                                            </Button>
                                                                        )}
                                                                        <Button
                                                                            size="sm"
                                                                            variant="outline"
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                handleDismissIssue(issue);
                                                                            }}
                                                                            className="flex-1"
                                                                        >
                                                                            Dismiss
                                                                        </Button>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    );
                                })}
                            </>
                        )}
                    </div>
                )}

                {activeTab === 'style' && (
                    <div className="space-y-6">
                        <ReadabilityMeter 
                            score={result.styleAnalysis.readabilityScore} 
                            level={result.styleAnalysis.readabilityLevel} 
                        />
                        
                        <ToneAnalysis toneAnalysis={result.styleAnalysis.toneAnalysis} />
                        
                        <div>
                            <h4 className="text-sm font-medium text-slate-300 mb-3">Style Suggestions</h4>
                            <div className="space-y-2">
                                {result.styleAnalysis.suggestions.map((suggestion, index) => (
                                    <div key={index} className="flex items-start gap-2 p-2 bg-slate-800/30 rounded">
                                        <InformationCircleIcon className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                                        <span className="text-sm text-slate-300">{suggestion}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'stats' && (
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                            <StatCard 
                                label="Words" 
                                value={result.wordCount.toLocaleString()} 
                                icon={<DocumentTextIcon className="w-4 h-4" />}
                                color="text-blue-400"
                            />
                            <StatCard 
                                label="Characters" 
                                value={result.characterCount.toLocaleString()} 
                                icon={<DocumentTextIcon className="w-4 h-4" />}
                                color="text-green-400"
                            />
                            <StatCard 
                                label="Sentences" 
                                value={result.sentenceCount} 
                                icon={<DocumentTextIcon className="w-4 h-4" />}
                                color="text-purple-400"
                            />
                            <StatCard 
                                label="Paragraphs" 
                                value={result.paragraphCount} 
                                icon={<DocumentTextIcon className="w-4 h-4" />}
                                color="text-yellow-400"
                            />
                        </div>
                        
                        <div className="grid grid-cols-1 gap-3">
                            <StatCard 
                                label="Avg Sentence Length" 
                                value={`${Math.round(result.styleAnalysis.avgSentenceLength)} words`}
                                icon={<ChartBarIcon className="w-4 h-4" />}
                                color="text-orange-400"
                            />
                            <StatCard 
                                label="Complex Words" 
                                value={result.styleAnalysis.complexWords} 
                                icon={<BeakerIcon className="w-4 h-4" />}
                                color="text-red-400"
                            />
                            <StatCard 
                                label="Passive Voice Count" 
                                value={result.styleAnalysis.passiveVoiceCount} 
                                icon={<ExclamationTriangleIcon className="w-4 h-4" />}
                                color="text-yellow-400"
                            />
                        </div>
                    </div>
                )}
            </div>
        </Card>
    );
};