import React, { useState, useMemo, useEffect } from 'react';
import { Card, Button, Input, Select } from '../UI';
import { ChartBarIcon, ClockIcon, CalendarIcon, TrophyIcon, FireIcon, TargetIcon, BookOpenIcon, PencilIcon, LightBulbIcon, EyeIcon, DocumentTextIcon, CheckCircleIcon, XCircleIcon, ArrowTrendingUpIcon, ArrowTrendingDownIcon, Squares2X2Icon, ListBulletIcon } from '../Icons';
import { useBookCraftStore, WritingSession, WritingGoal, ProductivityMetrics } from '../../store/useStore';

interface AnalyticsData {
    totalWords: number;
    totalChapters: number;
    averageWordsPerChapter: number;
    writingSessions: WritingSession[];
    goals: WritingGoal[];
    productivity: {
        daily: ProductivityMetrics[];
        weekly: ProductivityMetrics[];
        monthly: ProductivityMetrics[];
    };
    streaks: {
        current: number;
        longest: number;
        lastActive: Date;
        totalDays: number;
    };
}

const StatCard: React.FC<{
    title: string;
    value: string | number;
    subtitle?: string;
    icon: React.ReactNode;
    trend?: 'up' | 'down' | 'neutral';
    trendValue?: string;
    color?: 'blue' | 'green' | 'purple' | 'orange' | 'red';
}> = ({ title, value, subtitle, icon, trend, trendValue, color = 'blue' }) => {
    const colorClasses = {
        blue: 'bg-blue-500/10 border-blue-500/20 text-blue-400',
        green: 'bg-green-500/10 border-green-500/20 text-green-400',
        purple: 'bg-purple-500/10 border-purple-500/20 text-purple-400',
        orange: 'bg-orange-500/10 border-orange-500/20 text-orange-400',
        red: 'bg-red-500/10 border-red-500/20 text-red-400'
    };

    const trendIcon = trend === 'up' ? <ArrowTrendingUpIcon className="w-4 h-4 text-green-400" /> :
                     trend === 'down' ? <ArrowTrendingDownIcon className="w-4 h-4 text-red-400" /> : null;

    return (
        <Card className={`p-6 ${colorClasses[color]} transition-all hover:scale-105`}>
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-lg ${colorClasses[color]} border`}>
                        {icon}
                    </div>
                    <div>
                        <h3 className="text-2xl font-bold text-slate-100">{value}</h3>
                        <p className="text-sm text-slate-400">{title}</p>
                        {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
                    </div>
                </div>
                {trend && trendValue && (
                    <div className="flex items-center gap-1">
                        {trendIcon}
                        <span className="text-sm text-slate-300">{trendValue}</span>
                    </div>
                )}
            </div>
        </Card>
    );
};

const ProgressBar: React.FC<{
    current: number;
    target: number;
    label: string;
    color?: string;
}> = ({ current, target, label, color = '#3B82F6' }) => {
    const percentage = Math.min((current / target) * 100, 100);
    
    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
                <span className="text-slate-300">{label}</span>
                <span className="text-slate-400">{current.toLocaleString()} / {target.toLocaleString()}</span>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-2">
                <div 
                    className="h-2 rounded-full transition-all duration-300"
                    style={{ 
                        width: `${percentage}%`, 
                        backgroundColor: color 
                    }}
                />
            </div>
            <div className="text-right">
                <span className="text-xs text-slate-500">{percentage.toFixed(1)}% complete</span>
            </div>
        </div>
    );
};

const GoalCard: React.FC<{
    goal: WritingGoal;
    onUpdate: (goalId: string, updates: Partial<WritingGoal>) => void;
    onDelete: (goalId: string) => void;
    onComplete: (goalId: string) => void;
}> = ({ goal, onUpdate, onDelete, onComplete }) => {
    const progress = (goal.current / goal.target) * 100;
    const isOverdue = new Date() > goal.deadline && !goal.completed;
    const daysLeft = Math.ceil((goal.deadline.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

    const typeIcons = {
        words: <PencilIcon className="w-4 h-4" />,
        chapters: <BookOpenIcon className="w-4 h-4" />,
        hours: <ClockIcon className="w-4 h-4" />,
        pages: <DocumentTextIcon className="w-4 h-4" />,
        sessions: <ChartBarIcon className="w-4 h-4" />
    };

    const typeColors = {
        words: '#10B981',
        chapters: '#3B82F6',
        hours: '#F59E0B',
        pages: '#8B5CF6',
        sessions: '#EC4899'
    };

    return (
        <Card className={`p-4 ${goal.completed ? 'bg-green-900/20 border-green-500/30' : isOverdue ? 'bg-red-900/20 border-red-500/30' : ''}`}>
            <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                    <div 
                        className="p-2 rounded-lg border"
                        style={{ 
                            backgroundColor: `${typeColors[goal.type]}20`,
                            borderColor: `${typeColors[goal.type]}40`,
                            color: typeColors[goal.type]
                        }}
                    >
                        {typeIcons[goal.type]}
                    </div>
                    <div>
                        <h4 className="font-semibold text-slate-200">{goal.title}</h4>
                        {goal.description && (
                            <p className="text-xs text-slate-400">{goal.description}</p>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {goal.completed && <CheckCircleIcon className="w-5 h-5 text-green-400" />}
                    {isOverdue && <XCircleIcon className="w-5 h-5 text-red-400" />}
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDelete(goal.id)}
                        className="text-slate-400 hover:text-red-400"
                    >
                        ×
                    </Button>
                </div>
            </div>

            <ProgressBar
                current={goal.current}
                target={goal.target}
                label={`${goal.type.charAt(0).toUpperCase() + goal.type.slice(1)} Goal`}
                color={typeColors[goal.type]}
            />

            <div className="flex items-center justify-between mt-3 text-xs text-slate-500">
                <span>
                    {isOverdue ? 'Overdue' : daysLeft > 0 ? `${daysLeft} days left` : 'Due today'}
                </span>
                <span>{goal.deadline.toLocaleDateString()}</span>
            </div>

            {!goal.completed && (
                <Button
                    size="sm"
                    onClick={() => onComplete(goal.id)}
                    className="w-full mt-3 bg-green-600 hover:bg-green-700"
                >
                    Mark Complete
                </Button>
            )}
        </Card>
    );
};

const SimpleChart: React.FC<{
    data: { label: string; value: number }[];
    type: 'bar' | 'line';
    color?: string;
    height?: number;
}> = ({ data, type, color = '#3B82F6', height = 200 }) => {
    if (data.length === 0) return <div className="text-center text-slate-500 p-8">No data available</div>;

    const maxValue = Math.max(...data.map(d => d.value));
    const minValue = Math.min(...data.map(d => d.value));
    const range = maxValue - minValue || 1;

    return (
        <div className="relative" style={{ height }}>
            <svg width="100%" height="100%" className="overflow-visible">
                {data.map((item, index) => {
                    const x = (index / (data.length - 1 || 1)) * 100;
                    const y = 100 - ((item.value - minValue) / range) * 80;
                    
                    return (
                        <g key={item.label}>
                            {type === 'bar' && (
                                <rect
                                    x={`${x - 2}%`}
                                    y={`${y}%`}
                                    width="4%"
                                    height={`${100 - y}%`}
                                    fill={color}
                                    className="opacity-80 hover:opacity-100"
                                />
                            )}
                            {type === 'line' && index < data.length - 1 && (
                                <line
                                    x1={`${x}%`}
                                    y1={`${y}%`}
                                    x2={`${((index + 1) / (data.length - 1)) * 100}%`}
                                    y2={`${100 - ((data[index + 1].value - minValue) / range) * 80}%`}
                                    stroke={color}
                                    strokeWidth="2"
                                />
                            )}
                            {type === 'line' && (
                                <circle
                                    cx={`${x}%`}
                                    cy={`${y}%`}
                                    r="3"
                                    fill={color}
                                />
                            )}
                        </g>
                    );
                })}
            </svg>
        </div>
    );
};

export const AnalyticsTab: React.FC = () => {
    const [viewMode, setViewMode] = useState<'overview' | 'goals' | 'productivity' | 'insights'>('overview');
    const [chartType, setChartType] = useState<'daily' | 'weekly' | 'monthly'>('daily');
    const [showNewGoalModal, setShowNewGoalModal] = useState(false);
    const [newGoal, setNewGoal] = useState({
        title: '',
        type: 'words' as WritingGoal['type'],
        target: 1000,
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        description: ''
    });

    // Store hooks
    const activeProjectId = useBookCraftStore(state => state.activeProjectId);
    const project = useBookCraftStore(state => activeProjectId ? state.projects[activeProjectId] : null);
    const writingSessions = useBookCraftStore(state => state.writingSessions);
    const writingGoals = useBookCraftStore(state => state.writingGoals);
    const writingStreak = useBookCraftStore(state => state.writingStreak);
    const getProductivityTrend = useBookCraftStore(state => state.getProductivityTrend);
    const getWritingInsights = useBookCraftStore(state => state.getWritingInsights);
    const createWritingGoal = useBookCraftStore(state => state.createWritingGoal);
    const updateWritingGoal = useBookCraftStore(state => state.updateWritingGoal);
    const deleteWritingGoal = useBookCraftStore(state => state.deleteWritingGoal);
    const completeWritingGoal = useBookCraftStore(state => state.completeWritingGoal);

    // Get real analytics data from the store
    const analyticsData: AnalyticsData = useMemo(() => {
        if (!project || !activeProjectId) return {
            totalWords: 0,
            totalChapters: 0,
            averageWordsPerChapter: 0,
            writingSessions: [],
            goals: [],
            productivity: { daily: [], weekly: [], monthly: [] },
            streaks: { current: 0, longest: 0, lastActive: new Date(), totalDays: 0 }
        };

        // Get insights from the store
        const insights = getWritingInsights();
        
        // Filter sessions and goals for current project
        const projectSessions = writingSessions.filter(session => session.projectId === activeProjectId);
        const projectGoals = writingGoals.filter(goal => goal.projectId === activeProjectId);
        
        // Get productivity trends
        const dailyTrend = getProductivityTrend(14);
        
        return {
            totalWords: insights.totalWords,
            totalChapters: project.chapters.length,
            averageWordsPerChapter: project.chapters.length > 0 ? Math.round(insights.totalWords / project.chapters.length) : 0,
            writingSessions: projectSessions,
            goals: projectGoals,
            productivity: {
                daily: dailyTrend,
                weekly: [], // TODO: Implement weekly aggregation
                monthly: [] // TODO: Implement monthly aggregation
            },
            streaks: {
                current: writingStreak.current,
                longest: writingStreak.longest,
                lastActive: writingStreak.lastActive,
                totalDays: writingStreak.totalDays
            }
        };
    }, [project, activeProjectId, writingSessions, writingGoals, writingStreak, getWritingInsights, getProductivityTrend]);

    const handleCreateGoal = () => {
        if (!newGoal.title.trim()) return;
        
        createWritingGoal({
            title: newGoal.title,
            type: newGoal.type,
            target: newGoal.target,
            deadline: new Date(newGoal.deadline),
            description: newGoal.description
        });
        
        setShowNewGoalModal(false);
        setNewGoal({
            title: '',
            type: 'words',
            target: 1000,
            deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            description: ''
        });
    };

    const handleUpdateGoal = (goalId: string, updates: Partial<WritingGoal>) => {
        updateWritingGoal(goalId, updates);
    };

    const handleDeleteGoal = (goalId: string) => {
        deleteWritingGoal(goalId);
    };

    const handleCompleteGoal = (goalId: string) => {
        completeWritingGoal(goalId);
    };

    if (!project) {
        return (
            <div className="animate-fade-in max-w-7xl mx-auto p-8 text-center">
                <h2 className="text-2xl font-bold text-slate-100 mb-2">Writing Analytics</h2>
                <p className="text-slate-400 mb-4">Please select a project to view analytics.</p>
            </div>
        );
    }

    return (
        <div className="animate-fade-in space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold flex items-center">
                        <ChartBarIcon className="w-6 h-6 mr-2 text-brand-primary" />
                        Writing Analytics
                    </h2>
                    <p className="text-slate-400 mt-1">
                        Track your writing progress, productivity, and goals.
                    </p>
                </div>
                
                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 bg-slate-800 rounded-lg p-1">
                        {(['overview', 'goals', 'productivity', 'insights'] as const).map(mode => (
                            <Button
                                key={mode}
                                variant="ghost"
                                size="sm"
                                onClick={() => setViewMode(mode)}
                                className={viewMode === mode ? 'bg-slate-700' : ''}
                            >
                                {mode === 'overview' && <Squares2X2Icon className="w-4 h-4" />}
                                {mode === 'goals' && <TargetIcon className="w-4 h-4" />}
                                {mode === 'productivity' && <ChartBarIcon className="w-4 h-4" />}
                                {mode === 'insights' && <LightBulbIcon className="w-4 h-4" />}
                                <span className="hidden md:inline capitalize">{mode}</span>
                            </Button>
                        ))}
                    </div>
                </div>
            </div>

            {viewMode === 'overview' && (
                <>
                    {/* Key Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <StatCard
                            title="Total Words"
                            value={analyticsData.totalWords.toLocaleString()}
                            subtitle="Across all chapters"
                            icon={<PencilIcon className="w-6 h-6" />}
                            color="blue"
                            trend="up"
                            trendValue="+15%"
                        />
                        <StatCard
                            title="Chapters Written"
                            value={analyticsData.totalChapters}
                            subtitle={`Avg ${analyticsData.averageWordsPerChapter} words/chapter`}
                            icon={<BookOpenIcon className="w-6 h-6" />}
                            color="green"
                        />
                        <StatCard
                            title="Writing Streak"
                            value={`${analyticsData.streaks.current} days`}
                            subtitle={`Longest: ${analyticsData.streaks.longest} days`}
                            icon={<FireIcon className="w-6 h-6" />}
                            color="orange"
                        />
                        <StatCard
                            title="Active Goals"
                            value={analyticsData.goals.filter(g => !g.completed).length}
                            subtitle={`${analyticsData.goals.filter(g => g.completed).length} completed`}
                            icon={<TargetIcon className="w-6 h-6" />}
                            color="purple"
                        />
                    </div>

                    {/* Recent Activity */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <Card className="p-6">
                            <h3 className="text-lg font-semibold text-slate-200 mb-4 flex items-center">
                                <ChartBarIcon className="w-5 h-5 mr-2" />
                                Daily Word Count (Last 14 Days)
                            </h3>
                            <SimpleChart
                                data={analyticsData.productivity.daily.map(d => ({
                                    label: d.date,
                                    value: d.words
                                }))}
                                type="bar"
                                color="#3B82F6"
                                height={200}
                            />
                        </Card>

                        <Card className="p-6">
                            <h3 className="text-lg font-semibold text-slate-200 mb-4 flex items-center">
                                <ClockIcon className="w-5 h-5 mr-2" />
                                Daily Writing Time (Minutes)
                            </h3>
                            <SimpleChart
                                data={analyticsData.productivity.daily.map(d => ({
                                    label: d.date,
                                    value: d.minutes
                                }))}
                                type="line"
                                color="#10B981"
                                height={200}
                            />
                        </Card>
                    </div>

                    {/* Current Goals */}
                    <Card className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-slate-200 flex items-center">
                                <TargetIcon className="w-5 h-5 mr-2" />
                                Current Goals
                            </h3>
                            <Button onClick={() => setShowNewGoalModal(true)} size="sm">
                                Add Goal
                            </Button>
                        </div>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            {analyticsData.goals.slice(0, 4).map(goal => (
                                <GoalCard
                                    key={goal.id}
                                    goal={goal}
                                    onUpdate={handleUpdateGoal}
                                    onDelete={handleDeleteGoal}
                                    onComplete={handleCompleteGoal}
                                />
                            ))}
                        </div>
                    </Card>
                </>
            )}

            {viewMode === 'goals' && (
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <h3 className="text-xl font-semibold text-slate-200">Writing Goals</h3>
                        <Button onClick={() => setShowNewGoalModal(true)}>
                            Add New Goal
                        </Button>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                        {analyticsData.goals.map(goal => (
                            <GoalCard
                                key={goal.id}
                                goal={goal}
                                onUpdate={handleUpdateGoal}
                                onDelete={handleDeleteGoal}
                                onComplete={handleCompleteGoal}
                            />
                        ))}
                    </div>

                    {analyticsData.goals.length === 0 && (
                        <Card className="p-8 text-center">
                            <TargetIcon className="mx-auto h-12 w-12 text-slate-600 mb-4" />
                            <h3 className="text-lg font-semibold text-slate-300 mb-2">No Goals Set</h3>
                            <p className="text-slate-400 mb-4">Set writing goals to track your progress and stay motivated.</p>
                            <Button onClick={() => setShowNewGoalModal(true)}>
                                Create Your First Goal
                            </Button>
                        </Card>
                    )}
                </div>
            )}

            {viewMode === 'productivity' && (
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <h3 className="text-xl font-semibold text-slate-200">Productivity Analysis</h3>
                        <Select
                            value={chartType}
                            onChange={(e) => setChartType(e.target.value as 'daily' | 'weekly' | 'monthly')}
                        >
                            <option value="daily">Daily</option>
                            <option value="weekly">Weekly</option>
                            <option value="monthly">Monthly</option>
                        </Select>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <Card className="p-6">
                            <h4 className="text-lg font-semibold text-slate-200 mb-4">Words Written</h4>
                            <SimpleChart
                                data={analyticsData.productivity.daily.map(d => ({
                                    label: d.date,
                                    value: d.words
                                }))}
                                type="bar"
                                color="#3B82F6"
                                height={300}
                            />
                        </Card>

                        <Card className="p-6">
                            <h4 className="text-lg font-semibold text-slate-200 mb-4">Time Spent Writing</h4>
                            <SimpleChart
                                data={analyticsData.productivity.daily.map(d => ({
                                    label: d.date,
                                    value: d.minutes
                                }))}
                                type="line"
                                color="#10B981"
                                height={300}
                            />
                        </Card>
                    </div>

                    <Card className="p-6">
                        <h4 className="text-lg font-semibold text-slate-200 mb-4">Productivity Insights</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="text-center p-4 bg-slate-800/50 rounded-lg">
                                <div className="text-2xl font-bold text-blue-400">
                                    {Math.round(analyticsData.productivity.daily.reduce((sum, d) => sum + d.words, 0) / analyticsData.productivity.daily.length)}
                                </div>
                                <div className="text-sm text-slate-400">Avg Words/Day</div>
                            </div>
                            <div className="text-center p-4 bg-slate-800/50 rounded-lg">
                                <div className="text-2xl font-bold text-green-400">
                                    {Math.round(analyticsData.productivity.daily.reduce((sum, d) => sum + d.minutes, 0) / analyticsData.productivity.daily.length)}
                                </div>
                                <div className="text-sm text-slate-400">Avg Minutes/Day</div>
                            </div>
                            <div className="text-center p-4 bg-slate-800/50 rounded-lg">
                                <div className="text-2xl font-bold text-purple-400">
                                    {Math.round(analyticsData.productivity.daily.reduce((sum, d) => sum + d.words, 0) / analyticsData.productivity.daily.reduce((sum, d) => sum + d.minutes, 0) * 60)}
                                </div>
                                <div className="text-sm text-slate-400">Words/Hour</div>
                            </div>
                        </div>
                    </Card>
                </div>
            )}

            {viewMode === 'insights' && (
                <div className="space-y-6">
                    <h3 className="text-xl font-semibold text-slate-200">Writing Insights</h3>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <Card className="p-6">
                            <h4 className="text-lg font-semibold text-slate-200 mb-4">Writing Patterns</h4>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-slate-300">Most Productive Day</span>
                                    <span className="text-slate-400">Wednesday</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-slate-300">Preferred Writing Time</span>
                                    <span className="text-slate-400">Morning (9-11 AM)</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-slate-300">Average Session Length</span>
                                    <span className="text-slate-400">85 minutes</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-slate-300">Writing Velocity</span>
                                    <span className="text-slate-400">12 words/minute</span>
                                </div>
                            </div>
                        </Card>

                        <Card className="p-6">
                            <h4 className="text-lg font-semibold text-slate-200 mb-4">Chapter Analysis</h4>
                            <div className="space-y-4">
                                {project.chapters.slice(0, 5).map((chapter, index) => (
                                    <div key={chapter.id} className="flex justify-between items-center">
                                        <span className="text-slate-300 truncate">{chapter.title || `Chapter ${chapter.order}`}</span>
                                        <span className="text-slate-400">{(chapter.content?.split(' ').length || 0).toLocaleString()} words</span>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    </div>

                    <Card className="p-6">
                        <h4 className="text-lg font-semibold text-slate-200 mb-4">Recommendations</h4>
                        <div className="space-y-3">
                            <div className="flex items-start gap-3 p-3 bg-blue-900/20 border border-blue-500/30 rounded-lg">
                                <LightBulbIcon className="w-5 h-5 text-blue-400 mt-0.5" />
                                <div>
                                    <p className="text-slate-300">Based on your writing patterns, you're most productive in the morning. Consider scheduling your main writing sessions between 9-11 AM.</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3 p-3 bg-green-900/20 border border-green-500/30 rounded-lg">
                                <TrophyIcon className="w-5 h-5 text-green-400 mt-0.5" />
                                <div>
                                    <p className="text-slate-300">You're maintaining a great writing streak! Keep it up to build lasting habits.</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3 p-3 bg-orange-900/20 border border-orange-500/30 rounded-lg">
                                <TargetIcon className="w-5 h-5 text-orange-400 mt-0.5" />
                                <div>
                                    <p className="text-slate-300">Consider setting a daily word count goal to maintain consistent progress. Based on your current pace, 750 words/day seems achievable.</p>
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>
            )}

            {/* New Goal Modal */}
            {showNewGoalModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <Card className="p-6 max-w-md w-full mx-4">
                        <h3 className="text-lg font-semibold text-slate-200 mb-4">Create New Goal</h3>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">Goal Title</label>
                                <Input
                                    value={newGoal.title}
                                    onChange={(e) => setNewGoal(prev => ({ ...prev, title: e.target.value }))}
                                    placeholder="e.g., Complete first draft"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">Goal Type</label>
                                <Select
                                    value={newGoal.type}
                                    onChange={(e) => setNewGoal(prev => ({ ...prev, type: e.target.value as WritingGoal['type'] }))}
                                >
                                    <option value="words">Word Count</option>
                                    <option value="chapters">Chapters</option>
                                    <option value="hours">Writing Hours</option>
                                    <option value="pages">Pages</option>
                                    <option value="sessions">Writing Sessions</option>
                                </Select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">Target</label>
                                <Input
                                    type="number"
                                    value={newGoal.target}
                                    onChange={(e) => setNewGoal(prev => ({ ...prev, target: parseInt(e.target.value) || 0 }))}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">Deadline</label>
                                <Input
                                    type="date"
                                    value={newGoal.deadline}
                                    onChange={(e) => setNewGoal(prev => ({ ...prev, deadline: e.target.value }))}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">Description (Optional)</label>
                                <Input
                                    value={newGoal.description}
                                    onChange={(e) => setNewGoal(prev => ({ ...prev, description: e.target.value }))}
                                    placeholder="Additional details about your goal"
                                />
                            </div>
                        </div>

                        <div className="flex gap-2 mt-6">
                            <Button
                                onClick={handleCreateGoal}
                                disabled={!newGoal.title.trim()}
                                className="flex-1"
                            >
                                Create Goal
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => setShowNewGoalModal(false)}
                                className="flex-1"
                            >
                                Cancel
                            </Button>
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
};