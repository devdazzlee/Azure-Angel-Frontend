import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'react-toastify';
import ProgressCircle from '../../components/ProgressCircle';
import TaskCard from '../../components/TaskCard';
import TaskCompletionModal from '../../components/TaskCompletionModal';
import ServiceProviderModal from '../../components/ServiceProviderModal';
import KickstartModal from '../../components/KickstartModal';
import HelpModal from '../../components/HelpModal';
import ComprehensiveSupport from '../../components/ComprehensiveSupport';
import RoadmapDisplay from '../../components/RoadmapDisplay';
import ImplementationCompletionModal from '../../components/ImplementationCompletionModal';
import httpClient from '../../api/httpClient';
import { fetchRoadmapPlan } from '../../services/authService';
import { 
  Target, 
  Users, 
  Lightbulb,
  Rocket,
  Phone,
  Settings,
  Megaphone,
  Shield,
  DollarSign,
  FileText,
  Download
} from 'lucide-react';

interface ImplementationSubstep {
  step_number: number;
  title: string;
  description: string;
  angel_can_help: string;
  estimated_time: string;
  required: boolean;
  completed?: boolean;
}

interface ImplementationTask {
  id: string;
  title: string;
  description: string;
  purpose: string;
  options: string[];
  angel_actions: string[];
  estimated_time: string;
  priority: string;
  phase_name: string;
  substeps?: ImplementationSubstep[];
  current_substep?: number;
  business_context: {
    business_name: string;
    industry: string;
    location: string;
    business_type: string;
  };
}

interface PhaseProgress {
  completed: number;
  total: number;
  percent: number;
}

interface ImplementationProgress {
  completed: number;
  total: number;
  percent: number;
  phases_completed?: number;
  milestone?: string;
  current_phase?: string;
  phase_progress?: {
    "Legal Foundation": PhaseProgress;
    "Financial Systems": PhaseProgress;
    "Operations Setup": PhaseProgress;
    "Marketing & Sales": PhaseProgress;
    "Launch & Growth": PhaseProgress;
  };
}

interface ImplementationProps {
  sessionId: string;
  sessionData: any;
  onPhaseChange: (phase: string) => void;
}

const Implementation: React.FC<ImplementationProps> = ({
  sessionId,
  sessionData,
  onPhaseChange
}) => {
  const [currentTask, setCurrentTask] = useState<ImplementationTask | null>(null);
  const [completedTasks, setCompletedTasks] = useState<string[]>([]);
  const [progress, setProgress] = useState<ImplementationProgress>({
    completed: 0,
    total: 25,
    percent: 0,
    phases_completed: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'task' | 'support' | 'roadmap'>('task');
  const [mountedTabs, setMountedTabs] = useState<Record<string, boolean>>({ task: true });
  const [roadmapContent, setRoadmapContent] = useState<string>('');
  const [roadmapLoading, setRoadmapLoading] = useState(false);
  const [supportLoaded, setSupportLoaded] = useState(false);
  const [roadmapLoaded, setRoadmapLoaded] = useState(false);
  
  // Cache for ComprehensiveSupport API responses
  const [agentsCache, setAgentsCache] = useState<any>(null);
  const [providersCache, setProvidersCache] = useState<any>(null);
  const [agentsLoading, setAgentsLoading] = useState(false);
  const [providersLoading, setProvidersLoading] = useState(false);
  const hasFetchedAgents = useRef(false);
  const hasFetchedProviders = useRef(false);
  
  // Modal states
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [showServiceProviderModal, setShowServiceProviderModal] = useState(false);
  const [showKickstartModal, setShowKickstartModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  
  // Modal data
  const [serviceProviders, setServiceProviders] = useState<any[]>([]);
  const [kickstartPlan, setKickstartPlan] = useState<any>(null);
  const [helpContent, setHelpContent] = useState<string>('');

  useEffect(() => {
    loadImplementationData();
    setMountedTabs({ task: true });
    setSupportLoaded(false);
    setRoadmapLoaded(false);
    setRoadmapContent('');
    hasFetchedAgents.current = false;
    hasFetchedProviders.current = false;
    setAgentsCache(null);
    setProvidersCache(null);
  }, [sessionId]);

  const handleTabChange = (tab: 'task' | 'support' | 'roadmap') => {
    setActiveTab(tab);
    setMountedTabs((prev) => (prev[tab] ? prev : { ...prev, [tab]: true }));
  };
  
  const loadRoadmapContent = async () => {
    if (roadmapLoading || roadmapLoaded) return;
    try {
      setRoadmapLoading(true);
      const response = await fetchRoadmapPlan(sessionId);
      if (response?.result?.plan) {
        setRoadmapContent(response.result.plan);
      }
    } catch (err) {
      console.error('Error loading roadmap:', err);
      toast.error('Failed to load roadmap content');
    } finally {
      setRoadmapLoading(false);
      setRoadmapLoaded(true);
    }
  };

  useEffect(() => {
    // Reset provider cache when the active task changes so next visit refetches
    hasFetchedProviders.current = false;
    setProvidersCache(null);
    setSupportLoaded(false);
  }, [currentTask?.id]);

  useEffect(() => {
    if (activeTab === 'support' && !supportLoaded) {
      fetchComprehensiveSupportData();
    }
  }, [activeTab, supportLoaded, currentTask?.id]);

  useEffect(() => {
    if (activeTab === 'roadmap' && !roadmapLoaded) {
      loadRoadmapContent();
    }
  }, [activeTab, roadmapLoaded, sessionId]);

  // Fetch ComprehensiveSupport data
  const fetchComprehensiveSupportData = async () => {
    if (supportLoaded) return;
    // Fetch agents data
    if (!hasFetchedAgents.current && !agentsLoading) {
      setAgentsLoading(true);
      try {
        const token = localStorage.getItem('sb_access_token');
        const response = await httpClient.get('/specialized-agents/agents', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if ((response.data as any).success) {
          setAgentsCache(response.data);
          hasFetchedAgents.current = true;
        }
      } catch (error) {
        console.error('Error fetching agents:', error);
      } finally {
        setAgentsLoading(false);
      }
    }

    // Fetch providers data
    if (!hasFetchedProviders.current && !providersLoading) {
      setProvidersLoading(true);
      try {
        const token = localStorage.getItem('sb_access_token');
        const response = await httpClient.post('/specialized-agents/provider-table', {
          task_id: currentTask?.id || 'general business support',
          task_context: currentTask?.id || 'general business support',
          business_context: businessContext
        }, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if ((response.data as any).success) {
          setProvidersCache(response.data);
          hasFetchedProviders.current = true;
        }
      } catch (error) {
        console.error('Error fetching providers:', error);
      } finally {
        setProvidersLoading(false);
      }
    }

    if (hasFetchedAgents.current && hasFetchedProviders.current) {
      setSupportLoaded(true);
    }
  };

  // Use sessionData for business context if available
  const businessContext = sessionData || {
    business_name: "Your Business",
    industry: "General Business", 
    location: "United States",
    business_type: "Startup"
  };

  const loadImplementationData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/implementation/sessions/${sessionId}/implementation/tasks`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('sb_access_token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to load implementation data');
      }

      const data = await response.json();
      
      if (data.success) {
        // Check if all tasks are completed
        if (!data.current_task) {
          // All tasks completed - show completion modal
          setCurrentTask(null);
          setProgress(data.progress);
          setShowCompletionModal(true);
        } else {
          // Ensure substeps are included in the task
          const task = data.current_task;
          if (task && !task.substeps) {
            // If backend didn't provide substeps, we'll fetch them separately
            console.warn('Task missing substeps, will be generated by backend');
          }
          setCurrentTask(task);
          setCompletedTasks(data.completed_tasks || []);
          setProgress(data.progress);
          setShowCompletionModal(false); // Hide modal if task exists
        }
      } else {
        setError(data.message || 'Failed to load implementation data');
      }
    } catch (err) {
      console.error('Error loading implementation data:', err);
      setError('Failed to load implementation data');
    } finally {
      setLoading(false);
    }
  };

  const handleTaskCompletion = async (completionData: any) => {
    if (!currentTask) return;

    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/implementation/sessions/${sessionId}/implementation/tasks/${currentTask.id}/complete`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('sb_access_token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(completionData)
      });

      if (!response.ok) {
        throw new Error('Failed to complete task');
      }

      const data = await response.json();
      
      if (data.success) {
        toast.success('Task completed successfully!');
        setCompletedTasks(prev => [...prev, currentTask.id]);
        // Update progress with milestone information
        setProgress({
          ...data.progress,
          milestone: data.progress?.milestone || progress.milestone,
          phases_completed: data.progress?.phases_completed || progress.phases_completed
        });
        
        // CRITICAL: Reload implementation data to get next task or completion status
        await loadImplementationData();
        setShowCompletionModal(false);
      } else {
        toast.error(data.message || 'Failed to complete task');
      }
    } catch (err) {
      console.error('Error completing task:', err);
      toast.error('Failed to complete task');
    }
  };

  // Handle substep completion - reloads data to show next step
  const handleSubstepCompletion = async () => {
    // Reload implementation data to get updated task with next substep
    await loadImplementationData();
  };

  const handleGetServiceProviders = async () => {
    if (!currentTask) return;

    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/implementation/sessions/${sessionId}/implementation/contact`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('sb_access_token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ task_id: currentTask.id })
      });

      if (!response.ok) {
        throw new Error('Failed to get service providers');
      }

      const data = await response.json();
      
      if (data.success) {
        setServiceProviders(data.service_providers);
        setShowServiceProviderModal(true);
      } else {
        toast.error(data.message || 'Failed to get service providers');
      }
    } catch (err) {
      console.error('Error getting service providers:', err);
      toast.error('Failed to get service providers');
    }
  };

  const handleGetKickstart = async () => {
    if (!currentTask) return;

    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/implementation/sessions/${sessionId}/implementation/tasks/${currentTask.id}/kickstart`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('sb_access_token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to get kickstart plan');
      }

      const data = await response.json();
      
      if (data.success) {
        setKickstartPlan(data.kickstart_plan);
        setShowKickstartModal(true);
      } else {
        toast.error(data.message || 'Failed to get kickstart plan');
      }
    } catch (err) {
      console.error('Error getting kickstart plan:', err);
      toast.error('Failed to get kickstart plan');
    }
  };

  const handleGetHelp = async () => {
    if (!currentTask) return;

    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/implementation/sessions/${sessionId}/implementation/help`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('sb_access_token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ task_id: currentTask.id, help_type: 'detailed' })
      });

      if (!response.ok) {
        throw new Error('Failed to get help');
      }

      const data = await response.json();
      
      if (data.success) {
        setHelpContent(data.help_content);
        setShowHelpModal(true);
      } else {
        toast.error(data.message || 'Failed to get help');
      }
    } catch (err) {
      console.error('Error getting help:', err);
      toast.error('Failed to get help');
    }
  };

  const handleUploadDocument = async (file: File) => {
    if (!currentTask) return;

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/implementation/sessions/${sessionId}/implementation/tasks/${currentTask.id}/upload-document`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('sb_access_token')}`
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error('Failed to upload document');
      }

      const data = await response.json();
      
      if (data.success) {
        toast.success('Document uploaded successfully!');
      } else {
        toast.error(data.message || 'Failed to upload document');
      }
    } catch (err) {
      console.error('Error uploading document:', err);
      toast.error('Failed to upload document');
    }
  };

  const getPhaseIcon = (phase: string) => {
    switch (phase.toLowerCase()) {
      case 'legal_formation':
        return <Shield className="h-5 w-5 text-blue-600" />;
      case 'financial_setup':
        return <DollarSign className="h-5 w-5 text-green-600" />;
      case 'operations_development':
        return <Settings className="h-5 w-5 text-purple-600" />;
      case 'marketing_sales':
        return <Megaphone className="h-5 w-5 text-orange-600" />;
      case 'launch_scaling':
        return <Rocket className="h-5 w-5 text-red-600" />;
      default:
        return <Target className="h-5 w-5 text-gray-600" />;
    }
  };

  const getPhaseName = (phase: string) => {
    switch (phase.toLowerCase()) {
      case 'legal_formation':
        return 'Legal Formation & Compliance';
      case 'financial_setup':
        return 'Financial Planning & Setup';
      case 'operations_development':
        return 'Product & Operations Development';
      case 'marketing_sales':
        return 'Marketing & Sales Strategy';
      case 'launch_scaling':
        return 'Full Launch & Scaling';
      default:
        return phase.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-teal-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading implementation tasks...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-teal-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">❌</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Implementation</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={loadImplementationData}
            className="bg-teal-500 hover:bg-teal-600 text-white px-6 py-2 rounded-lg font-medium transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Show completion modal when all tasks are done (modal handles the UI)
  // Keep the fallback screen for when modal is closed
  if (!currentTask && !showCompletionModal) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-teal-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-green-500 text-6xl mb-4">🎉</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Implementation Complete!</h2>
          <p className="text-gray-600 mb-4">All implementation tasks completed successfully.</p>
          <button
            onClick={() => setShowCompletionModal(true)}
            className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-lg font-medium transition-colors"
          >
            View Completion Summary
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-teal-50">
      {/* Header */}
      <div className="bg-white/90 backdrop-blur-xl border-b border-white/30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Implementation Phase</h1>
              <p className="text-gray-600 mt-1">Turning your roadmap into actionable results</p>
              <div className="flex items-center gap-2 mt-2">
                {getPhaseIcon(currentTask.phase_name)}
                <span className="text-sm font-medium text-gray-700">
                  {getPhaseName(currentTask.phase_name)}
                </span>
              </div>
            </div>
              <div className="flex items-center gap-4">
              <ProgressCircle
                progress={progress.percent}
                phase="IMPLEMENTATION"
              />
              <div className="text-right">
                <p className="text-sm text-gray-600">Overall Progress</p>
                <p className="text-lg font-semibold text-gray-900">
                  {progress.completed}/{progress.total} steps
                </p>
                <p className="text-xs text-gray-500">
                  ({completedTasks.filter(t => !t.includes('_substep_')).length} main tasks completed)
                </p>
                {progress.milestone && (
                  <p className="text-xs text-teal-600 font-medium mt-1">
                    Current: {progress.milestone}
                  </p>
                )}
                {progress.phases_completed !== undefined && (
                  <p className="text-xs text-gray-500">
                    {progress.phases_completed}/5 phases completed
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white/90 backdrop-blur-xl border-b border-white/30">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex space-x-8">
            <button
              onClick={() => handleTabChange('task')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'task'
                  ? 'border-teal-500 text-teal-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4" />
                Current Task
              </div>
            </button>
            <button
              onClick={() => handleTabChange('support')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'support'
                  ? 'border-teal-500 text-teal-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Comprehensive Support
              </div>
            </button>
            <button
              onClick={() => handleTabChange('roadmap')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'roadmap'
                  ? 'border-teal-500 text-teal-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Full Roadmap
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className={activeTab === 'task' ? 'block' : 'hidden'}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Current Task */}
            <div className="lg:col-span-2">
              <TaskCard
                task={currentTask}
                onComplete={handleSubstepCompletion}
                onGetServiceProviders={handleGetServiceProviders}
                onGetKickstart={handleGetKickstart}
                onGetHelp={handleGetHelp}
                onUploadDocument={handleUploadDocument}
                sessionId={sessionId}
              />
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Progress Overview */}
              <div className="bg-white/90 backdrop-blur-xl border border-white/30 rounded-xl p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Progress Overview</h3>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Steps Completed</span>
                    <span className="font-medium">{progress.completed}/{progress.total}</span>
                    <span className="text-xs text-gray-500">(includes substeps)</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Main Tasks Completed</span>
                    <span className="font-medium">{completedTasks.filter(t => !t.includes('_substep_')).length}/25</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Phases Completed</span>
                    <span className="font-medium">{progress.phases_completed || 0}/5</span>
                  </div>
                  {progress.milestone && (
                    <div className="p-2 bg-teal-50 rounded-lg border border-teal-200">
                      <p className="text-xs text-teal-800 font-medium">Current Milestone:</p>
                      <p className="text-sm text-teal-900 font-semibold">{progress.milestone}</p>
                    </div>
                  )}
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-teal-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${progress.percent}%` }}
                    ></div>
                  </div>
                  {/* Phase Progress Indicators */}
                  <div className="mt-4 space-y-2">
                    <p className="text-xs font-medium text-gray-700 mb-2">Phase Progress:</p>
                    {['Legal Foundation', 'Financial Systems', 'Operations Setup', 'Marketing & Sales', 'Launch & Growth'].map((phase, index) => {
                      // Get phase progress from backend if available, otherwise use phases_completed count
                      const phaseProgress = progress.phase_progress?.[phase as keyof typeof progress.phase_progress];
                      const isCompleted = phaseProgress ? phaseProgress.percent === 100 : (progress.phases_completed || 0) > index;
                      const isInProgress = phaseProgress ? phaseProgress.percent > 0 && phaseProgress.percent < 100 : (progress.phases_completed || 0) === index;
                      const progressPercent = phaseProgress ? phaseProgress.percent : 0;
                      
                      return (
                        <div key={phase} className="space-y-1">
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${
                              isCompleted ? 'bg-green-500' : 
                              isInProgress ? 'bg-teal-500' : 'bg-gray-300'
                            }`} />
                            <span className={`text-xs flex-1 ${
                              isCompleted ? 'text-green-700 font-medium' : 
                              isInProgress ? 'text-teal-700 font-medium' : 'text-gray-500'
                            }`}>
                              {phase}
                            </span>
                            {phaseProgress && (
                              <span className="text-xs text-gray-500">
                                {phaseProgress.completed}/{phaseProgress.total}
                              </span>
                            )}
                          </div>
                          {isInProgress && phaseProgress && (
                            <div className="ml-4 w-full bg-gray-200 rounded-full h-1">
                              <div 
                                className="bg-teal-500 h-1 rounded-full transition-all duration-300"
                                style={{ width: `${progressPercent}%` }}
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-white/90 backdrop-blur-xl border border-white/30 rounded-xl p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  <button
                    onClick={handleGetHelp}
                    className="w-full bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
                  >
                    <Lightbulb className="h-4 w-4" />
                    Get Help
                  </button>
                  <button
                    onClick={handleGetKickstart}
                    className="w-full bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
                  >
                    <Rocket className="h-4 w-4" />
                    Kickstart Plan
                  </button>
                  <button
                    onClick={handleGetServiceProviders}
                    className="w-full bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
                  >
                    <Phone className="h-4 w-4" />
                    Find Providers
                  </button>
                </div>
              </div>

              {/* Business Context */}
              <div className="bg-white/90 backdrop-blur-xl border border-white/30 rounded-xl p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Business Context</h3>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-gray-600">Business:</span>
                    <span className="font-medium ml-2">{businessContext.business_name || currentTask?.business_context.business_name}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Industry:</span>
                    <span className="font-medium ml-2">{businessContext.industry || currentTask?.business_context.industry}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Location:</span>
                    <span className="font-medium ml-2">{businessContext.location || currentTask?.business_context.location}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {mountedTabs.support && (
          <div className={activeTab === 'support' ? 'block' : 'hidden'}>
            <ComprehensiveSupport
              taskContext={currentTask?.id || 'general business support'}
              businessContext={businessContext}
              onProviderSelect={(provider) => {
                console.log('Provider selected:', provider);
                toast.success('Service provider selected!');
              }}
              onResearchComplete={(result) => {
                console.log('Research completed:', result);
                toast.success('Research completed successfully!');
              }}
              onAgentResponse={(agent, response) => {
                console.log('Agent response:', agent, response);
                toast.success('Agent guidance received!');
              }}
              onCommandComplete={(response) => {
                console.log('Command completed:', response);
                toast.success('Command executed successfully!');
              }}
              agentsCache={agentsCache}
              providersCache={providersCache}
              agentsLoading={agentsLoading}
              providersLoading={providersLoading}
            />
          </div>
        )}

        {mountedTabs.roadmap && (
          <div className={activeTab === 'roadmap' ? 'block' : 'hidden'}>
            <div className="bg-white/90 backdrop-blur-xl border border-white/30 rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Full Launch Roadmap</h2>
                <p className="text-gray-600 mt-1">Complete roadmap in table format</p>
              </div>
              {roadmapContent && (
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    // The RoadmapDisplay component has its own export button, so we'll just show a message
                    toast.info('Use the export button in the roadmap view below');
                  }}
                  className="flex items-center gap-2 bg-teal-500 hover:bg-teal-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  <Download className="h-4 w-4" />
                  Export Available Below
                </a>
              )}
            </div>
            {roadmapLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500"></div>
                <span className="ml-4 text-gray-600">Loading roadmap...</span>
              </div>
            ) : roadmapContent ? (
              <RoadmapDisplay
                roadmapContent={roadmapContent}
                onStartImplementation={() => {}}
                loading={false}
                sessionId={sessionId}
              />
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-600">No roadmap content available</p>
                <button
                  onClick={loadRoadmapContent}
                  className="mt-4 bg-teal-500 hover:bg-teal-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  Load Roadmap
                </button>
              </div>
            )}
          </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <TaskCompletionModal
        isOpen={showCompletionModal}
        onClose={() => setShowCompletionModal(false)}
        task={currentTask}
        onComplete={handleTaskCompletion}
      />

      <ServiceProviderModal
        isOpen={showServiceProviderModal}
        onClose={() => setShowServiceProviderModal(false)}
        providers={serviceProviders}
        task={currentTask}
      />

      <KickstartModal
        isOpen={showKickstartModal}
        onClose={() => setShowKickstartModal(false)}
        kickstartPlan={kickstartPlan}
        task={currentTask}
      />

            <HelpModal
              isOpen={showHelpModal}
              onClose={() => setShowHelpModal(false)}
              helpContent={helpContent}
              task={currentTask}
            />

            {/* Implementation Completion Modal */}
            <ImplementationCompletionModal
              isOpen={showCompletionModal}
              onClose={() => setShowCompletionModal(false)}
              onViewSummary={() => {
                setShowCompletionModal(false);
                onPhaseChange('COMPLETED');
              }}
              progress={progress}
            />
          </div>
        );
      };
      
      export default Implementation;