import React, { useState, useEffect, useMemo } from 'react';
import { Card, Button, Badge, Tooltip, Input, TextArea } from '../UI';
import { ExclamationCircleIcon, ExclamationTriangleIcon, InformationCircleIcon, CheckCircleIcon, ShieldCheckIcon, ClockIcon, DocumentTextIcon, ChartBarIcon, XMarkIcon, PencilIcon, EyeIcon, EyeSlashIcon } from '../Icons';
import { contradictionService, Contradiction, ContradictionAnalysis } from '../../services/contradictionService';
import { useBookCraftStore } from '../../store/useStore';

interface ContradictionDetectionPanelProps {
    className?: string;
}

const SeverityIcon: React.FC<{ severity: Contradiction['severity'] }> = ({ severity }) => {
    const iconClass = "w-4 h-4";
    
    switch (severity) {
        case 'critical':
            return <ExclamationCircleIcon className={`${iconClass} text-red-500`} />;
        case 'high':
            return <ExclamationCircleIcon className={`${iconClass} text-red-400`} />;
        case 'medium':
            return <ExclamationTriangleIcon className={`${iconClass} text-yellow-400`} />;
        case 'low':
            return <InformationCircleIcon className={`${iconClass} text-blue-400`} />;
        default:
            return <InformationCircleIcon className={`${iconClass} text-slate-400`} />;
    }
};

const SeverityBadge: React.FC<{ severity: Contradiction['severity'] }> = ({ severity }) => {
    const colors = {
        critical: 'bg-red-600/20 text-red-200 border-red-600',
        high: 'bg-red-500/20 text-red-200 border-red-500',
        medium: 'bg-yellow-500/20 text-yellow-200 border-yellow-500',
        low: 'bg-blue-500/20 text-blue-200 border-blue-500'
    };

    return (
        <Badge className={`${colors[severity]} text-xs font-medium`}>
            {severity.toUpperCase()}
        </Badge>
    );
};

const TypeBadge: React.FC<{ type: Contradiction['type'] }> = ({ type }) => {
    const colors = {
        character: 'bg-purple-500/20 text-purple-200',
        plot: 'bg-blue-500/20 text-blue-200',
        setting: 'bg-green-500/20 text-green-200',
        timeline: 'bg-orange-500/20 text-orange-200',
        fact: 'bg-red-500/20 text-red-200',
        research: 'bg-indigo-500/20 text-indigo-200'
    };

    return (
        <Badge className={`${colors[type]} text-xs capitalize`}>
            {type}
        </Badge>
    );
};

const ConsistencyMeter: React.FC<{ label: string; score: number; color?: string }> = ({ 
    label, score, color = "bg-blue-500" 
}) => {
    const getColor = (score: number) => {
        if (score >= 85) return 'bg-green-500';
        if (score >= 70) return 'bg-yellow-500';
        if (score >= 50) return 'bg-orange-500';
        return 'bg-red-500';
    };

    const barColor = color === "bg-blue-500" ? getColor(score) : color;

    return (
        <div className="space-y-2">
            <div className="flex justify-between items-center">
                <span className="text-sm text-slate-300">{label}</span>
                <span className="text-sm font-medium text-slate-200">{Math.round(score)}%</span>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-2">
                <div 
                    className={`h-2 rounded-full transition-all duration-300 ${barColor}`}
                    style={{ width: `${Math.max(0, Math.min(100, score))}%` }}
                ></div>
            </div>
        </div>
    );
};

const ContradictionCard: React.FC<{ 
    contradiction: Contradiction;
    onResolve: (id: string) => void;
    onAddNote: (id: string, note: string) => void;
    onExpand: (id: string) => void;
    isExpanded: boolean;
}> = ({ contradiction, onResolve, onAddNote, onExpand, isExpanded }) => {
    const [note, setNote] = useState(contradiction.userNotes || '');
    const [isAddingNote, setIsAddingNote] = useState(false);

    const handleAddNote = () => {
        if (note.trim()) {
            onAddNote(contradiction.id, note);
            setIsAddingNote(false);
        }
    };

    return (
        <div className={`p-4 rounded-lg border transition-all ${
            contradiction.resolved 
                ? 'bg-green-900/20 border-green-500/50' 
                : 'bg-slate-800/30 border-slate-700/50 hover:border-slate-600'
        }`}>
            <div className="flex items-start justify-between mb-3">
                <div className="flex items-start gap-3 flex-1">
                    <SeverityIcon severity={contradiction.severity} />
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                            <TypeBadge type={contradiction.type} />
                            <SeverityBadge severity={contradiction.severity} />
                            {contradiction.resolved && (
                                <Badge className="bg-green-500/20 text-green-200 border-green-500 text-xs">
                                    RESOLVED
                                </Badge>
                            )}
                        </div>
                        <h4 className="font-medium text-slate-200 mb-1">{contradiction.title}</h4>
                        <p className="text-sm text-slate-400 mb-2">{contradiction.description}</p>
                        <div className="flex items-center gap-4 text-xs text-slate-500">
                            <span>Confidence: {Math.round(contradiction.confidence * 100)}%</span>
                            <span>Category: {contradiction.category}</span>
                            <span>{contradiction.sources.length} sources</span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => onExpand(contradiction.id)}
                        className="p-1 text-slate-400 hover:text-slate-200 transition-colors"
                    >
                        {isExpanded ? <EyeSlashIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                    </button>
                </div>
            </div>

            {isExpanded && (
                <div className="space-y-4 pt-3 border-t border-slate-700/50">
                    {/* Sources */}
                    <div>
                        <h5 className="text-sm font-medium text-slate-300 mb-2">Sources:</h5>
                        <div className="space-y-2">
                            {contradiction.sources.map((source, index) => (
                                <div key={index} className="p-2 bg-slate-900/50 rounded text-xs">
                                    <div className="flex items-center gap-2 mb-1">
                                        <Badge className={`${
                                            source.type === 'research' ? 'bg-indigo-500/20 text-indigo-200' :
                                            source.type === 'chapter' ? 'bg-blue-500/20 text-blue-200' :
                                            'bg-slate-500/20 text-slate-200'
                                        } text-xs`}>
                                            {source.type}
                                        </Badge>
                                        <span className="text-slate-300">{source.title}</span>
                                        {source.location && (
                                            <span className="text-slate-500">• {source.location}</span>
                                        )}
                                    </div>
                                    <p className="text-slate-400 italic">"{source.excerpt}"</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Suggestions */}
                    <div>
                        <h5 className="text-sm font-medium text-slate-300 mb-2">Suggestions:</h5>
                        <ul className="space-y-1">
                            {contradiction.suggestions.map((suggestion, index) => (
                                <li key={index} className="text-sm text-slate-400 flex items-start gap-2">
                                    <span className="text-blue-400 mt-1">•</span>
                                    {suggestion}
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* User Notes */}
                    <div>
                        <h5 className="text-sm font-medium text-slate-300 mb-2">Notes:</h5>
                        {contradiction.userNotes ? (
                            <div className="p-2 bg-slate-900/50 rounded text-sm text-slate-300">
                                {contradiction.userNotes}
                            </div>
                        ) : (
                            <p className="text-xs text-slate-500 italic">No notes added yet</p>
                        )}
                        
                        {isAddingNote ? (
                            <div className="mt-2 space-y-2">
                                <TextArea
                                    value={note}
                                    onChange={(e) => setNote(e.target.value)}
                                    placeholder="Add your notes about this contradiction..."
                                    className="text-sm"
                                    rows={3}
                                />
                                <div className="flex gap-2">
                                    <Button size="sm" onClick={handleAddNote}>
                                        Save Note
                                    </Button>
                                    <Button size="sm" variant="outline" onClick={() => setIsAddingNote(false)}>
                                        Cancel
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <Button 
                                size="sm" 
                                variant="outline" 
                                onClick={() => setIsAddingNote(true)}
                                className="mt-2"
                            >
                                <PencilIcon className="w-3 h-3 mr-1" />
                                Add Note
                            </Button>
                        )}
                    </div>

                    {/* Actions */}
                    {!contradiction.resolved && (
                        <div className="flex gap-2 pt-2 border-t border-slate-700/50">
                            <Button
                                size="sm"
                                onClick={() => onResolve(contradiction.id)}
                                className="flex-1"
                            >
                                <CheckCircleIcon className="w-3 h-3 mr-1" />
                                Mark Resolved
                            </Button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export const ContradictionDetectionPanel: React.FC<ContradictionDetectionPanelProps> = ({ 
    className = "" 
}) => {
    const [analysis, setAnalysis] = useState<ContradictionAnalysis | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [activeTab, setActiveTab] = useState<'overview' | 'contradictions' | 'consistency'>('overview');
    const [expandedContradictions, setExpandedContradictions] = useState<Set<string>>(new Set());
    const [filterSeverity, setFilterSeverity] = useState<Contradiction['severity'] | 'all'>('all');
    const [filterType, setFilterType] = useState<Contradiction['type'] | 'all'>('all');
    const [showResolved, setShowResolved] = useState(false);

    const activeProjectId = useBookCraftStore(state => state.activeProjectId);
    const projects = useBookCraftStore(state => state.projects);

    const projectData = useMemo(() => {
        if (!activeProjectId || !projects[activeProjectId]) return null;
        
        const project = projects[activeProjectId];
        return {
            chapters: project.chapters || [],
            research: project.research || [],
            characters: project.characters || [],
            plotPoints: project.plotPoints || []
        };
    }, [activeProjectId, projects]);

    const analyzeProjectConsistency = async () => {
        if (!projectData) return;

        setIsAnalyzing(true);
        try {
            const result = await contradictionService.analyzeProjectConsistency(projectData);
            setAnalysis(result);
        } catch (error) {
            console.error('Contradiction analysis failed:', error);
        } finally {
            setIsAnalyzing(false);
        }
    };

    useEffect(() => {
        if (projectData && (projectData.chapters.length > 0 || projectData.research.length > 0)) {
            // Auto-analyze when project data is available
            analyzeProjectConsistency();
        }
    }, [projectData]);

    const handleResolveContradiction = async (contradictionId: string) => {
        try {
            await contradictionService.resolveContradiction(contradictionId, 'Manually resolved by user');
            if (analysis) {
                const updatedContradictions = analysis.contradictions.map(c =>
                    c.id === contradictionId ? { ...c, resolved: true } : c
                );
                setAnalysis({
                    ...analysis,
                    contradictions: updatedContradictions,
                    summary: contradictionService['generateSummary'](updatedContradictions)
                });
            }
        } catch (error) {
            console.error('Failed to resolve contradiction:', error);
        }
    };

    const handleAddNote = async (contradictionId: string, note: string) => {
        try {
            await contradictionService.addUserNote(contradictionId, note);
            if (analysis) {
                const updatedContradictions = analysis.contradictions.map(c =>
                    c.id === contradictionId ? { ...c, userNotes: note } : c
                );
                setAnalysis({
                    ...analysis,
                    contradictions: updatedContradictions
                });
            }
        } catch (error) {
            console.error('Failed to add note:', error);
        }
    };

    const handleExpandContradiction = (contradictionId: string) => {
        setExpandedContradictions(prev => {
            const newSet = new Set(prev);
            if (newSet.has(contradictionId)) {
                newSet.delete(contradictionId);
            } else {
                newSet.add(contradictionId);
            }
            return newSet;
        });
    };

    const filteredContradictions = useMemo(() => {
        if (!analysis) return [];
        
        return analysis.contradictions.filter(contradiction => {
            if (!showResolved && contradiction.resolved) return false;
            if (filterSeverity !== 'all' && contradiction.severity !== filterSeverity) return false;
            if (filterType !== 'all' && contradiction.type !== filterType) return false;
            return true;
        });
    }, [analysis, filterSeverity, filterType, showResolved]);

    if (isAnalyzing) {
        return (
            <Card className={`p-6 ${className}`}>
                <div className="flex items-center justify-center py-8">
                    <div className="animate-spin">
                        <ShieldCheckIcon className="w-8 h-8 text-blue-400" />
                    </div>
                    <span className="ml-3 text-slate-300">Analyzing project consistency...</span>
                </div>
            </Card>
        );
    }

    if (!projectData || (projectData.chapters.length === 0 && projectData.research.length === 0)) {
        return (
            <Card className={`p-6 ${className}`}>
                <div className="text-center py-8">
                    <DocumentTextIcon className="mx-auto h-12 w-12 text-slate-600 mb-4" />
                    <h3 className="text-lg font-semibold text-slate-300 mb-2">Contradiction Detection</h3>
                    <p className="text-slate-400">Add chapters and research to detect contradictions and analyze consistency.</p>
                </div>
            </Card>
        );
    }

    if (!analysis) {
        return (
            <Card className={`p-6 ${className}`}>
                <div className="text-center py-8">
                    <ShieldCheckIcon className="mx-auto h-12 w-12 text-slate-600 mb-4" />
                    <h3 className="text-lg font-semibold text-slate-300 mb-2">Contradiction Detection</h3>
                    <p className="text-slate-400 mb-4">Analyze your project for consistency issues and contradictions.</p>
                    <Button onClick={analyzeProjectConsistency}>
                        Start Analysis
                    </Button>
                </div>
            </Card>
        );
    }

    return (
        <Card className={className}>
            <div className="border-b border-slate-700/50">
                <div className="flex items-center justify-between p-4 pb-3">
                    <h3 className="text-lg font-semibold text-slate-200 flex items-center gap-2">
                        <ShieldCheckIcon className="w-5 h-5 text-blue-400" />
                        Contradiction Detection
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                        <ClockIcon className="w-4 h-4" />
                        {analysis.processingTime}ms
                        <Button size="sm" variant="outline" onClick={analyzeProjectConsistency}>
                            Re-analyze
                        </Button>
                    </div>
                </div>
                
                <div className="flex border-t border-slate-700/50">
                    <button
                        onClick={() => setActiveTab('overview')}
                        className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
                            activeTab === 'overview' 
                                ? 'bg-blue-500/10 text-blue-300 border-b-2 border-blue-500' 
                                : 'text-slate-400 hover:text-slate-300'
                        }`}
                    >
                        Overview
                    </button>
                    <button
                        onClick={() => setActiveTab('contradictions')}
                        className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
                            activeTab === 'contradictions' 
                                ? 'bg-red-500/10 text-red-300 border-b-2 border-red-500' 
                                : 'text-slate-400 hover:text-slate-300'
                        }`}
                    >
                        Issues ({analysis.summary.pending})
                    </button>
                    <button
                        onClick={() => setActiveTab('consistency')}
                        className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
                            activeTab === 'consistency' 
                                ? 'bg-green-500/10 text-green-300 border-b-2 border-green-500' 
                                : 'text-slate-400 hover:text-slate-300'
                        }`}
                    >
                        Consistency
                    </button>
                </div>
            </div>

            <div className="p-4 max-h-[600px] overflow-y-auto">
                {activeTab === 'overview' && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
                                <div className="flex items-center gap-2 mb-2">
                                    <ShieldCheckIcon className="w-5 h-5 text-blue-400" />
                                    <span className="text-sm text-slate-300">Overall Consistency</span>
                                </div>
                                <div className="text-2xl font-bold text-slate-200">
                                    {Math.round(analysis.consistency.overall)}%
                                </div>
                            </div>
                            <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
                                <div className="flex items-center gap-2 mb-2">
                                    <ExclamationCircleIcon className="w-5 h-5 text-red-400" />
                                    <span className="text-sm text-slate-300">Active Issues</span>
                                </div>
                                <div className="text-2xl font-bold text-slate-200">
                                    {analysis.summary.pending}
                                </div>
                            </div>
                        </div>

                        {analysis.summary.pending > 0 && (
                            <div>
                                <h4 className="text-sm font-medium text-slate-300 mb-3">Issues by Severity</h4>
                                <div className="flex gap-2 flex-wrap">
                                    {Object.entries(analysis.summary.bySeverity).map(([severity, count]) => (
                                        <Badge key={severity} className={`${
                                            severity === 'critical' ? 'bg-red-600/20 text-red-200 border-red-600' :
                                            severity === 'high' ? 'bg-red-500/20 text-red-200 border-red-500' :
                                            severity === 'medium' ? 'bg-yellow-500/20 text-yellow-200 border-yellow-500' :
                                            'bg-blue-500/20 text-blue-200 border-blue-500'
                                        } text-xs`}>
                                            {count} {severity}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div>
                            <h4 className="text-sm font-medium text-slate-300 mb-3">Recommendations</h4>
                            <div className="space-y-2">
                                {analysis.recommendations.map((recommendation, index) => (
                                    <div key={index} className="flex items-start gap-2 p-2 bg-slate-800/30 rounded">
                                        <InformationCircleIcon className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                                        <span className="text-sm text-slate-300">{recommendation}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'contradictions' && (
                    <div className="space-y-4">
                        {/* Filters */}
                        <div className="flex gap-4 items-center pb-4 border-b border-slate-700/50">
                            <div className="flex items-center gap-2">
                                <label className="text-sm text-slate-300">Severity:</label>
                                <select 
                                    value={filterSeverity}
                                    onChange={(e) => setFilterSeverity(e.target.value as any)}
                                    className="bg-slate-700 border border-slate-600 text-slate-200 text-sm rounded px-2 py-1"
                                >
                                    <option value="all">All</option>
                                    <option value="critical">Critical</option>
                                    <option value="high">High</option>
                                    <option value="medium">Medium</option>
                                    <option value="low">Low</option>
                                </select>
                            </div>
                            <div className="flex items-center gap-2">
                                <label className="text-sm text-slate-300">Type:</label>
                                <select 
                                    value={filterType}
                                    onChange={(e) => setFilterType(e.target.value as any)}
                                    className="bg-slate-700 border border-slate-600 text-slate-200 text-sm rounded px-2 py-1"
                                >
                                    <option value="all">All</option>
                                    <option value="character">Character</option>
                                    <option value="plot">Plot</option>
                                    <option value="setting">Setting</option>
                                    <option value="timeline">Timeline</option>
                                    <option value="fact">Fact</option>
                                    <option value="research">Research</option>
                                </select>
                            </div>
                            <label className="flex items-center gap-2 text-sm text-slate-300">
                                <input
                                    type="checkbox"
                                    checked={showResolved}
                                    onChange={(e) => setShowResolved(e.target.checked)}
                                    className="rounded border-slate-600 bg-slate-700 text-blue-500"
                                />
                                Show resolved
                            </label>
                        </div>

                        {filteredContradictions.length === 0 ? (
                            <div className="text-center py-8">
                                <CheckCircleIcon className="mx-auto h-12 w-12 text-green-400 mb-4" />
                                <h4 className="text-lg font-semibold text-green-300 mb-2">Great Job!</h4>
                                <p className="text-slate-400">
                                    {analysis.summary.pending === 0 
                                        ? "No contradictions detected in your project."
                                        : "No contradictions match your current filters."
                                    }
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {filteredContradictions.map((contradiction) => (
                                    <ContradictionCard
                                        key={contradiction.id}
                                        contradiction={contradiction}
                                        onResolve={handleResolveContradiction}
                                        onAddNote={handleAddNote}
                                        onExpand={handleExpandContradiction}
                                        isExpanded={expandedContradictions.has(contradiction.id)}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'consistency' && (
                    <div className="space-y-6">
                        <ConsistencyMeter 
                            label="Overall Consistency" 
                            score={analysis.consistency.overall} 
                        />
                        <ConsistencyMeter 
                            label="Character Consistency" 
                            score={analysis.consistency.character} 
                            color="bg-purple-500"
                        />
                        <ConsistencyMeter 
                            label="Plot Consistency" 
                            score={analysis.consistency.plot} 
                            color="bg-blue-500"
                        />
                        <ConsistencyMeter 
                            label="Setting Consistency" 
                            score={analysis.consistency.setting} 
                            color="bg-green-500"
                        />
                        <ConsistencyMeter 
                            label="Timeline Consistency" 
                            score={analysis.consistency.timeline} 
                            color="bg-orange-500"
                        />

                        <div className="pt-4 border-t border-slate-700/50">
                            <h4 className="text-sm font-medium text-slate-300 mb-3">Analysis Summary</h4>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <span className="text-slate-400">Total Issues:</span>
                                    <span className="text-slate-200 ml-2">{analysis.summary.total}</span>
                                </div>
                                <div>
                                    <span className="text-slate-400">Resolved:</span>
                                    <span className="text-slate-200 ml-2">{analysis.summary.resolved}</span>
                                </div>
                                <div>
                                    <span className="text-slate-400">Processing Time:</span>
                                    <span className="text-slate-200 ml-2">{analysis.processingTime}ms</span>
                                </div>
                                <div>
                                    <span className="text-slate-400">Sources Analyzed:</span>
                                    <span className="text-slate-200 ml-2">
                                        {projectData?.chapters.length || 0} chapters, {projectData?.research.length || 0} research
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </Card>
    );
};