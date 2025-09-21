import React, { useState, useRef, useEffect } from 'react';
import { Card, Button, Input } from '../UI';
import {
  ClockIcon,
  ShareIcon,
  PlusIcon,
  TrashIcon,
  EyeIcon,
  TagIcon,
  CalendarIcon,
  MapIcon,
  AdjustmentsHorizontalIcon,
  ArrowPathIcon,
  DocumentTextIcon,
  CheckCircleIcon
} from '../Icons';
import { useBookCraftStore } from '../../store/useStore';
import { ResearchTimeline, TimelineEvent, ResearchMindMap, MindMapNode, MindMapConnection, ThematicTag } from '../../types';
import { toast } from '../../services/toast';

interface VisualOrganizationToolsProps {
  className?: string;
}

interface TimelineComponentProps {
  timeline: ResearchTimeline;
  onUpdate?: (timeline: ResearchTimeline) => void;
  readOnly?: boolean;
}

interface MindMapComponentProps {
  mindMap: ResearchMindMap;
  onUpdate?: (mindMap: ResearchMindMap) => void;
  readOnly?: boolean;
}

// Timeline Component
const TimelineComponent: React.FC<TimelineComponentProps> = ({ timeline, onUpdate, readOnly = false }) => {
  const [selectedEvent, setSelectedEvent] = useState<TimelineEvent | null>(null);

  const sortedEvents = [...timeline.events].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const getImportanceColor = (importance: string) => {
    switch (importance) {
      case 'High': return 'bg-red-500';
      case 'Medium': return 'bg-yellow-500';
      case 'Low': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="timeline-component">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-slate-200">{timeline.title}</h3>
        <span className="text-sm text-slate-400">{sortedEvents.length} events</span>
      </div>

      {timeline.description && (
        <p className="text-sm text-slate-400 mb-4">{timeline.description}</p>
      )}

      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-slate-600"></div>

        {/* Events */}
        <div className="space-y-6">
          {sortedEvents.map((event, index) => (
            <div key={event.id} className="relative flex items-start gap-4">
              {/* Timeline dot */}
              <div className={`relative z-10 w-3 h-3 rounded-full ${getImportanceColor(event.importance)} flex-shrink-0 mt-2`}>
                {event.verified && (
                  <CheckCircleIcon className="absolute -top-1 -right-1 w-4 h-4 text-green-400 bg-slate-900 rounded-full" />
                )}
              </div>

              {/* Event card */}
              <Card className="flex-1 p-4 hover:bg-slate-800/50 cursor-pointer transition-colors" onClick={() => setSelectedEvent(event)}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-slate-200 mb-1">{event.title}</h4>
                    <p className="text-xs text-slate-400 mb-2">{event.description}</p>
                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <CalendarIcon className="w-3 h-3" />
                        {new Date(event.date).toLocaleDateString()}
                      </span>
                      <span className={`px-2 py-1 rounded text-xs ${
                        event.importance === 'High' ? 'bg-red-900/20 text-red-300' :
                        event.importance === 'Medium' ? 'bg-yellow-900/20 text-yellow-300' :
                        'bg-blue-900/20 text-blue-300'
                      }`}>
                        {event.importance}
                      </span>
                      {event.verified && (
                        <span className="text-green-400 flex items-center gap-1">
                          <CheckCircleIcon className="w-3 h-3" />
                          Verified
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          ))}
        </div>
      </div>

      {/* Event Detail Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="p-6 max-w-lg w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-200">Event Details</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedEvent(null)}
                className="text-slate-400 hover:text-slate-200"
              >
                ×
              </Button>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-slate-300 mb-1">Title</h4>
                <p className="text-slate-200">{selectedEvent.title}</p>
              </div>

              <div>
                <h4 className="text-sm font-medium text-slate-300 mb-1">Description</h4>
                <p className="text-slate-300">{selectedEvent.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-slate-300 mb-1">Date</h4>
                  <p className="text-slate-300">{new Date(selectedEvent.date).toLocaleDateString()}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-slate-300 mb-1">Importance</h4>
                  <span className={`px-2 py-1 rounded text-xs ${
                    selectedEvent.importance === 'High' ? 'bg-red-900/20 text-red-300' :
                    selectedEvent.importance === 'Medium' ? 'bg-yellow-900/20 text-yellow-300' :
                    'bg-blue-900/20 text-blue-300'
                  }`}>
                    {selectedEvent.importance}
                  </span>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-slate-300 mb-1">Status</h4>
                <div className="flex items-center gap-2">
                  {selectedEvent.verified ? (
                    <span className="text-green-400 flex items-center gap-1">
                      <CheckCircleIcon className="w-4 h-4" />
                      Verified
                    </span>
                  ) : (
                    <span className="text-yellow-400">Unverified</span>
                  )}
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

// Mind Map Component
const MindMapComponent: React.FC<MindMapComponentProps> = ({ mindMap, onUpdate, readOnly = false }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [selectedNode, setSelectedNode] = useState<MindMapNode | null>(null);
  const [viewBox, setViewBox] = useState({ x: 0, y: 0, width: 800, height: 600 });

  const getNodeColor = (type: string) => {
    switch (type) {
      case 'central': return '#3B82F6';
      case 'main': return '#10B981';
      case 'sub': return '#F59E0B';
      case 'detail': return '#8B5CF6';
      default: return '#6B7280';
    }
  };

  const getNodeSize = (type: string) => {
    switch (type) {
      case 'central': return 60;
      case 'main': return 45;
      case 'sub': return 35;
      case 'detail': return 25;
      default: return 30;
    }
  };

  return (
    <div className="mind-map-component">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-200">{mindMap.title}</h3>
          <p className="text-sm text-slate-400">Central Topic: {mindMap.centralTopic}</p>
        </div>
        <span className="text-sm text-slate-400">{mindMap.nodes.length} nodes</span>
      </div>

      <Card className="p-4 bg-slate-800">
        <svg
          ref={svgRef}
          width="100%"
          height="400"
          viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`}
          className="border border-slate-600 rounded"
        >
          {/* Connections */}
          {mindMap.connections.map(connection => {
            const sourceNode = mindMap.nodes.find(n => n.id === connection.sourceId);
            const targetNode = mindMap.nodes.find(n => n.id === connection.targetId);

            if (!sourceNode || !targetNode) return null;

            return (
              <g key={connection.id}>
                <line
                  x1={sourceNode.x}
                  y1={sourceNode.y}
                  x2={targetNode.x}
                  y2={targetNode.y}
                  stroke="#64748B"
                  strokeWidth={connection.strength * 3}
                  strokeOpacity={0.6}
                />
                {connection.label && (
                  <text
                    x={(sourceNode.x + targetNode.x) / 2}
                    y={(sourceNode.y + targetNode.y) / 2}
                    textAnchor="middle"
                    className="text-xs fill-slate-400"
                    fontSize="10"
                  >
                    {connection.label}
                  </text>
                )}
              </g>
            );
          })}

          {/* Nodes */}
          {mindMap.nodes.map(node => {
            const size = getNodeSize(node.type);
            const color = node.color || getNodeColor(node.type);

            return (
              <g
                key={node.id}
                onClick={() => setSelectedNode(node)}
                className="cursor-pointer"
              >
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={size / 2}
                  fill={color}
                  stroke={selectedNode?.id === node.id ? '#F59E0B' : '#374151'}
                  strokeWidth={selectedNode?.id === node.id ? 3 : 1}
                  opacity={0.8}
                />
                <text
                  x={node.x}
                  y={node.y}
                  textAnchor="middle"
                  dominantBaseline="central"
                  className="fill-white font-medium pointer-events-none"
                  fontSize={Math.max(8, size / 4)}
                >
                  {node.label.length > 12 ? `${node.label.substring(0, 12)}...` : node.label}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Legend */}
        <div className="mt-4 flex items-center gap-6 text-xs text-slate-400">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            <span>Central</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span>Main</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <span>Sub</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-purple-500"></div>
            <span>Detail</span>
          </div>
        </div>
      </Card>

      {/* Node Detail Modal */}
      {selectedNode && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-200">Node Details</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedNode(null)}
                className="text-slate-400 hover:text-slate-200"
              >
                ×
              </Button>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-slate-300 mb-1">Label</h4>
                <p className="text-slate-200">{selectedNode.label}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-slate-300 mb-1">Type</h4>
                  <span className={`px-2 py-1 rounded text-xs capitalize ${
                    selectedNode.type === 'central' ? 'bg-blue-900/20 text-blue-300' :
                    selectedNode.type === 'main' ? 'bg-green-900/20 text-green-300' :
                    selectedNode.type === 'sub' ? 'bg-yellow-900/20 text-yellow-300' :
                    'bg-purple-900/20 text-purple-300'
                  }`}>
                    {selectedNode.type}
                  </span>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-slate-300 mb-1">Position</h4>
                  <p className="text-slate-300 text-sm">({selectedNode.x}, {selectedNode.y})</p>
                </div>
              </div>

              {selectedNode.researchItemId && (
                <div>
                  <h4 className="text-sm font-medium text-slate-300 mb-1">Linked Research</h4>
                  <p className="text-blue-400 text-sm">Research Item ID: {selectedNode.researchItemId}</p>
                </div>
              )}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

// Main Visual Organization Tools Component
export const VisualOrganizationTools: React.FC<VisualOrganizationToolsProps> = ({ className = "" }) => {
  const [activeTab, setActiveTab] = useState<'timelines' | 'mindmaps' | 'themes'>('timelines');
  const [newTimelineTheme, setNewTimelineTheme] = useState('');
  const [newMindMapTopic, setNewMindMapTopic] = useState('');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  // Store hooks
  const project = useBookCraftStore(state => state.projects[state.activeProjectId!]);
  const createThematicTimeline = useBookCraftStore(state => state.createThematicTimeline);
  const createResearchMindMap = useBookCraftStore(state => state.createResearchMindMap);
  const analyzeResearchThemes = useBookCraftStore(state => state.analyzeResearchThemes);
  const isAnalyzingThemes = useBookCraftStore(state => state.isAnalyzingThemes);

  const handleCreateTimeline = async () => {
    if (!newTimelineTheme.trim()) {
      toast.error('Missing Theme', 'Please enter a theme for the timeline.');
      return;
    }

    try {
      await createThematicTimeline(newTimelineTheme.trim());
      setNewTimelineTheme('');
      toast.success('Timeline Created', `Timeline for "${newTimelineTheme}" has been created!`);
    } catch (error) {
      console.error('Timeline creation failed:', error);
    }
  };

  const handleCreateMindMap = async () => {
    if (!newMindMapTopic.trim() || selectedItems.length === 0) {
      toast.error('Missing Information', 'Please enter a topic and select research items.');
      return;
    }

    try {
      await createResearchMindMap(newMindMapTopic.trim(), selectedItems);
      setNewMindMapTopic('');
      setSelectedItems([]);
      toast.success('Mind Map Created', `Mind map for "${newMindMapTopic}" has been created!`);
    } catch (error) {
      console.error('Mind map creation failed:', error);
    }
  };

  const toggleItemSelection = (itemId: string) => {
    setSelectedItems(prev =>
      prev.includes(itemId)
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  return (
    <div className={`visual-organization-tools ${className}`}>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-100 mb-2">Visual Organization Tools</h2>
        <p className="text-slate-400">
          Create timelines and mind maps to visualize your research patterns and themes
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center gap-1 bg-slate-800 rounded-lg p-1 mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setActiveTab('timelines')}
          className={`${activeTab === 'timelines' ? 'bg-slate-700 text-slate-200' : 'text-slate-400'}`}
        >
          <ClockIcon className="w-4 h-4 mr-2" />
          Timelines
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setActiveTab('mindmaps')}
          className={`${activeTab === 'mindmaps' ? 'bg-slate-700 text-slate-200' : 'text-slate-400'}`}
        >
          <ShareIcon className="w-4 h-4 mr-2" />
          Mind Maps
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setActiveTab('themes')}
          className={`${activeTab === 'themes' ? 'bg-slate-700 text-slate-200' : 'text-slate-400'}`}
        >
          <TagIcon className="w-4 h-4 mr-2" />
          Themes
        </Button>
      </div>

      {/* Timelines Tab */}
      {activeTab === 'timelines' && (
        <div>
          {/* Create Timeline */}
          <Card className="p-6 mb-6">
            <h3 className="text-lg font-semibold text-slate-200 mb-4">Create Timeline</h3>
            <div className="flex gap-4">
              <Input
                value={newTimelineTheme}
                onChange={(e) => setNewTimelineTheme(e.target.value)}
                placeholder="Enter a theme (e.g., 'World War II', 'Technological Evolution')"
                className="flex-1"
              />
              <Button
                onClick={handleCreateTimeline}
                disabled={!newTimelineTheme.trim()}
              >
                <PlusIcon className="w-4 h-4 mr-2" />
                Create Timeline
              </Button>
            </div>
            <p className="text-sm text-slate-400 mt-2">
              Enter a theme and we'll create a chronological timeline from your research
            </p>
          </Card>

          {/* Existing Timelines */}
          <div>
            <h3 className="text-lg font-semibold text-slate-200 mb-4">
              Existing Timelines ({project?.researchTimelines.length || 0})
            </h3>

            {!project?.researchTimelines.length ? (
              <Card className="p-8 text-center">
                <ClockIcon className="mx-auto h-12 w-12 text-slate-600 mb-4" />
                <h4 className="text-lg font-semibold text-slate-300 mb-2">No timelines yet</h4>
                <p className="text-slate-400">Create your first timeline to visualize research chronologically</p>
              </Card>
            ) : (
              <div className="space-y-6">
                {project.researchTimelines.map(timeline => (
                  <Card key={timeline.id} className="p-6">
                    <TimelineComponent timeline={timeline} readOnly={true} />
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Mind Maps Tab */}
      {activeTab === 'mindmaps' && (
        <div>
          {/* Create Mind Map */}
          <Card className="p-6 mb-6">
            <h3 className="text-lg font-semibold text-slate-200 mb-4">Create Mind Map</h3>
            <div className="space-y-4">
              <Input
                value={newMindMapTopic}
                onChange={(e) => setNewMindMapTopic(e.target.value)}
                placeholder="Enter central topic (e.g., 'Climate Change', 'Medieval History')"
                className="w-full"
              />

              <div>
                <h4 className="text-sm font-medium text-slate-300 mb-2">Select Research Items</h4>
                <div className="max-h-48 overflow-y-auto border border-slate-600 rounded-lg">
                  {project?.research.map(item => (
                    <div
                      key={item.id}
                      className={`p-3 border-b border-slate-600 last:border-b-0 cursor-pointer transition-colors ${
                        selectedItems.includes(item.id) ? 'bg-slate-700' : 'hover:bg-slate-800/50'
                      }`}
                      onClick={() => toggleItemSelection(item.id)}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={selectedItems.includes(item.id)}
                          onChange={() => toggleItemSelection(item.id)}
                          className="rounded border-slate-600 bg-slate-800 text-brand-primary"
                        />
                        <div className="flex-1 min-w-0">
                          <h5 className="text-sm font-medium text-slate-200 truncate">{item.query}</h5>
                          <p className="text-xs text-slate-400 truncate">{item.summary}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-sm text-slate-400 mt-2">
                  Selected: {selectedItems.length} items
                </p>
              </div>

              <Button
                onClick={handleCreateMindMap}
                disabled={!newMindMapTopic.trim() || selectedItems.length === 0}
                className="w-full"
              >
                <ShareIcon className="w-4 h-4 mr-2" />
                Create Mind Map
              </Button>
            </div>
          </Card>

          {/* Existing Mind Maps */}
          <div>
            <h3 className="text-lg font-semibold text-slate-200 mb-4">
              Existing Mind Maps ({project?.researchMindMaps.length || 0})
            </h3>

            {!project?.researchMindMaps.length ? (
              <Card className="p-8 text-center">
                <ShareIcon className="mx-auto h-12 w-12 text-slate-600 mb-4" />
                <h4 className="text-lg font-semibold text-slate-300 mb-2">No mind maps yet</h4>
                <p className="text-slate-400">Create your first mind map to visualize research connections</p>
              </Card>
            ) : (
              <div className="space-y-6">
                {project.researchMindMaps.map(mindMap => (
                  <Card key={mindMap.id} className="p-6">
                    <MindMapComponent mindMap={mindMap} readOnly={true} />
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Themes Tab */}
      {activeTab === 'themes' && (
        <div>
          {/* Analyze Themes */}
          <Card className="p-6 mb-6">
            <h3 className="text-lg font-semibold text-slate-200 mb-4">Theme Analysis</h3>
            <p className="text-sm text-slate-400 mb-4">
              Analyze your research to identify recurring themes and patterns using AI
            </p>
            <Button
              onClick={analyzeResearchThemes}
              disabled={isAnalyzingThemes || !project?.research.length}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {isAnalyzingThemes ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Analyzing Themes...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <ArrowPathIcon className="w-4 h-4" />
                  Analyze Research Themes
                </div>
              )}
            </Button>
          </Card>

          {/* Discovered Themes */}
          <div>
            <h3 className="text-lg font-semibold text-slate-200 mb-4">
              Discovered Themes ({project?.thematicTags.length || 0})
            </h3>

            {!project?.thematicTags.length ? (
              <Card className="p-8 text-center">
                <TagIcon className="mx-auto h-12 w-12 text-slate-600 mb-4" />
                <h4 className="text-lg font-semibold text-slate-300 mb-2">No themes analyzed yet</h4>
                <p className="text-slate-400">Run theme analysis to discover patterns in your research</p>
              </Card>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {project.thematicTags.map(theme => (
                  <Card key={theme.id} className="p-4">
                    <div className="flex items-start gap-3">
                      <div
                        className="w-4 h-4 rounded-full flex-shrink-0 mt-1"
                        style={{ backgroundColor: theme.color }}
                      />
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-slate-200 mb-1">{theme.name}</h4>
                        {theme.description && (
                          <p className="text-xs text-slate-400 mb-2">{theme.description}</p>
                        )}
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs text-slate-500">Frequency: {theme.frequency}</span>
                          {theme.sentiment && (
                            <span className={`text-xs px-2 py-1 rounded ${
                              theme.sentiment === 'Positive' ? 'bg-green-900/20 text-green-300' :
                              theme.sentiment === 'Negative' ? 'bg-red-900/20 text-red-300' :
                              'bg-gray-900/20 text-gray-300'
                            }`}>
                              {theme.sentiment}
                            </span>
                          )}
                        </div>
                        {theme.themes.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {theme.themes.slice(0, 3).map(keyword => (
                              <span key={keyword} className="text-xs bg-slate-700 text-slate-300 px-2 py-1 rounded">
                                {keyword}
                              </span>
                            ))}
                            {theme.themes.length > 3 && (
                              <span className="text-xs text-slate-500">+{theme.themes.length - 3} more</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mt-3 pt-3 border-t border-slate-600">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => createThematicTimeline(theme.name)}
                        className="w-full"
                      >
                        <ClockIcon className="w-3 h-3 mr-1" />
                        Create Timeline
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};