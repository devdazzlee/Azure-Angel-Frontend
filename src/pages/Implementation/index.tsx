import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import TaskCard from '../../components/TaskCard';
import TaskCompletionModal from '../../components/TaskCompletionModal';
import ServiceProviderModal from '../../components/ServiceProviderModal';
import HelpModal from '../../components/HelpModal';
import ComprehensiveSupport from '../../components/ComprehensiveSupport';
import FloatingComprehensiveSupport from '../../components/FloatingComprehensiveSupport';
import RoadmapDisplay from '../../components/RoadmapDisplay';
import ImplementationCompletionModal from '../../components/ImplementationCompletionModal';
import httpClient from '../../api/httpClient';
import { fetchRoadmapPlan } from '../../services/authService';
import { BudgetDashboard } from '../../components/Budget';
import { budgetService } from '../../services/budgetService';
import type { Budget, BudgetItem } from '../../types/apiTypes';
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
  Download,
  Building2,
  MapPin,
  Trophy,
  AlertTriangle,
  Home,
  ArrowLeft
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
  const navigate = useNavigate();
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
  const [activeTab, setActiveTab] = useState<'task' | 'roadmap' | 'budget'>('task');
  const [mountedTabs, setMountedTabs] = useState<Record<string, boolean>>({ task: true });
  const [roadmapContent, setRoadmapContent] = useState<string>('');
  const [roadmapLoading, setRoadmapLoading] = useState(false);
  const [supportLoaded, setSupportLoaded] = useState(false);
  const [roadmapLoaded, setRoadmapLoaded] = useState(false);
  
  // Budget state
  const [budget, setBudget] = useState<Budget | null>(null);
  const [budgetLoading, setBudgetLoading] = useState(false);
  
  // Local business context that can be updated independently
  const [localBusinessContext, setLocalBusinessContext] = useState<any>(null);
  const [extractionAttempted, setExtractionAttempted] = useState(false);
  const [businessContextLoading, setBusinessContextLoading] = useState(false);
  
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
  const [showHelpModal, setShowHelpModal] = useState(false);
  
  // Loading states for Quick Actions
  const [helpLoading, setHelpLoading] = useState(false);
  const [serviceProvidersLoading, setServiceProvidersLoading] = useState(false);
  
  // Modal data
  const [serviceProviders, setServiceProviders] = useState<any[]>([]);
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
    setExtractionAttempted(false);
    setLocalBusinessContext(null);
  }, [sessionId]);
  
  // Separate effect for business context extraction (runs once)
  useEffect(() => {
    if (!extractionAttempted && sessionData) {
      extractBusinessContextIfNeeded();
    }
  }, [sessionData, extractionAttempted]);

  const extractBusinessContextIfNeeded = async () => {
    // Mark as attempted to prevent infinite loop
    setExtractionAttempted(true);
    
    // Check if business name is invalid (Unsure, Your Business, etc.)
    const invalidValues = ["", "unsure", "your business", "none", "n/a", "not specified"];
    const currentBusinessName = (businessContext?.business_name || "").toLowerCase().trim();
    
    if (!invalidValues.includes(currentBusinessName)) {
      console.log('✅ Business name is valid, no extraction needed');
      return;
    }
    
    try {
      console.log('🔍 Business name is invalid:', currentBusinessName);
      console.log('   Extracting/generating from chat history...');
      
      setBusinessContextLoading(true);
      
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/business-context/sessions/${sessionId}/extract-business-context`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('sb_access_token')}`,
          'Content-Type': 'application/json'
        }
      });

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.result.extracted) {
            const extractedContext = data.result.business_context;
            console.log('✅ Business context extracted/generated:', extractedContext);
            console.log('   Previous:', data.result.previous_context?.business_name);
            console.log('   New:', extractedContext.business_name);
            
            // Store in local state to override parent's sessionData
            setLocalBusinessContext(extractedContext);
            
            // CRITICAL: Wait a moment for database and cache to update, then reload
            await new Promise(resolve => setTimeout(resolve, 500));
            await loadImplementationData();
          }
        }
      } catch (error) {
        console.error('Error extracting business context:', error);
      } finally {
        setBusinessContextLoading(false);
      }
  };

  const handleTabChange = (tab: 'task' | 'roadmap' | 'budget') => {
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
        setRoadmapLoaded(true);
      }
    } catch (error) {
      console.error('Error loading roadmap:', error);
      toast.error('Failed to load roadmap');
    } finally {
      setRoadmapLoading(false);
    }
  };

  const loadBudget = async () => {
    if (budgetLoading || budget) return;
    try {
      setBudgetLoading(true);
      const response = await budgetService.getBudget(sessionId);
      if (response.success) {
        setBudget(response.result);
      } else {
        // Create default budget if none exists
        const defaultBudget: Budget = {
          id: '',
          session_id: sessionId,
          initial_investment: 0,
          total_estimated_expenses: 0,
          total_estimated_revenue: 0,
          items: [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        setBudget(defaultBudget);
      }
    } catch (error) {
      console.error('Error loading budget:', error);
      toast.error('Failed to load budget');
    } finally {
      setBudgetLoading(false);
    }
  };

  const handleUpdateBudget = (updates: Partial<Budget>) => {
    if (!budget) return;
    
    const updatedBudget = { ...budget, ...updates, updated_at: new Date().toISOString() };
    
    // Recalculate totals
    const expenses = updatedBudget.items.filter(item => item.category === 'expense');
    const revenues = updatedBudget.items.filter(item => item.category === 'revenue');
    
    updatedBudget.total_estimated_expenses = expenses.reduce((sum, item) => sum + item.estimated_amount, 0);
    updatedBudget.total_estimated_revenue = revenues.reduce((sum, item) => sum + item.estimated_amount, 0);
    updatedBudget.total_actual_expenses = expenses.reduce((sum, item) => sum + (item.actual_amount || 0), 0);
    updatedBudget.total_actual_revenue = revenues.reduce((sum, item) => sum + (item.actual_amount || 0), 0);
    
    setBudget(updatedBudget);
  };

  const handleAddItem = (item: Omit<BudgetItem, 'id' | 'created_at' | 'updated_at'>) => {
    if (!budget) return;
    
    const newItem: BudgetItem = {
      ...item,
      id: Date.now().toString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    handleUpdateBudget({
      items: [...budget.items, newItem]
    });
  };

  const handleUpdateItem = (itemId: string, updates: Partial<BudgetItem>) => {
    if (!budget) return;
    
    const updatedItems = budget.items.map(item =>
      item.id === itemId
        ? { ...item, ...updates, updated_at: new Date().toISOString() }
        : item
    );
    
    handleUpdateBudget({ items: updatedItems });
  };

  const handleDeleteItem = (itemId: string) => {
    if (!budget) return;
    
    const updatedItems = budget.items.filter(item => item.id !== itemId);
    handleUpdateBudget({ items: updatedItems });
  };

  useEffect(() => {
    // Reset provider cache when the active task changes so next visit refetches
    hasFetchedProviders.current = false;
    setProvidersCache(null);
    setSupportLoaded(false);
  }, [currentTask?.id]);

  // Load budget when budget tab is accessed
  useEffect(() => {
    if (activeTab === 'budget' && mountedTabs.budget) {
      loadBudget();
    }
  }, [activeTab, mountedTabs.budget]);

  // Removed support tab - no longer needed

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

  // Use localBusinessContext if available (from extraction), otherwise use sessionData
  const businessContext = localBusinessContext || sessionData || {
    business_name: "Your Business",
    industry: "General Business", 
    location: "United States",
    business_type: "Startup"
  };

  // Computed progress fallback to ensure percent tracks completed tasks
  const totalTasks = (progress as any)?.total ?? 25;
  const completedMainTasks = (progress as any)?.main_tasks_completed ?? completedTasks.filter(t => !t.includes('_substep_')).length;
  const completedCount = completedTasks.length;
  const computedPercent = totalTasks > 0 ? Math.round((completedMainTasks / totalTasks) * 100) : 0;
  const substepPercent = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;
  const progressPercent = Math.min(100, Math.max((progress as any)?.percent ?? 0, computedPercent, substepPercent));

  const loadImplementationData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/implementation/sessions/${sessionId}/tasks`, {
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
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/implementation/sessions/${sessionId}/tasks/${currentTask.id}/complete`, {
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
    if (!currentTask || serviceProvidersLoading) return;

    try {
      setServiceProvidersLoading(true);
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/implementation/sessions/${sessionId}/contact`, {
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
    } finally {
      setServiceProvidersLoading(false);
    }
  };


  const fetchHelpContent = async (options: { showModal?: boolean; force?: boolean } = {}) => {
    if (!currentTask) return;
    if (helpLoading && !options.force) return;

    try {
      setHelpLoading(true);
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/implementation/sessions/${sessionId}/help`, {
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
        if (options.showModal) {
          setShowHelpModal(true);
        }
      } else {
        toast.error(data.message || 'Failed to get help');
      }
    } catch (err) {
      console.error('Error getting help:', err);
      toast.error('Failed to get help');
    } finally {
      setHelpLoading(false);
    }
  };

  const handleGetHelp = async () => {
    if (!currentTask) return;

    // If we already have content ready and are currently loading, just show it
    if (helpLoading && helpContent) {
      setShowHelpModal(true);
      return;
    }

    await fetchHelpContent({ showModal: true, force: true });
  };

  // Preload help content so it's instantly available in the Research-Backed section
  useEffect(() => {
    if (currentTask) {
      fetchHelpContent({ showModal: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTask?.id]);

  const handleUploadDocument = async (file: File) => {
    if (!currentTask) return;

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/implementation/sessions/${sessionId}/tasks/${currentTask.id}/upload-document`, {
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-teal-50 pb-20 sm:pb-0">
      {/* Header - Better Spacing */}
      <div className="bg-gradient-to-b from-white via-white to-gray-50/30 backdrop-blur-xl border-b border-gray-200/50 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 sm:pr-[440px] lg:pr-[500px]">
          {/* Navigation Buttons */}
          <div className="flex items-center gap-3 mb-6">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-50 border border-gray-200 rounded-lg text-gray-700 font-medium transition-all duration-200 hover:shadow-md"
            >
              <Home className="h-4 w-4" />
              <span className="hidden sm:inline">Home</span>
            </button>
            <button
              onClick={() => navigate(`/ventures/${sessionId}`)}
              className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-50 border border-gray-200 rounded-lg text-gray-700 font-medium transition-all duration-200 hover:shadow-md"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Back to Roadmap</span>
              <span className="sm:hidden">Back</span>
            </button>
          </div>
          
          {/* Row 1: Implementation Phase */}
          <div className="flex flex-col gap-6 mb-4">
            {/* Top Row - Title */}
            <div className="flex-1">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Implementation Phase</h1>
              <p className="text-gray-600 mt-1">Turning your roadmap into actionable results</p>
              <div className="flex items-center gap-2 mt-2">
                {getPhaseIcon(currentTask.phase_name)}
                <span className="text-sm font-medium text-gray-700">
                  {getPhaseName(currentTask.phase_name)}
                </span>
              </div>
            </div>

          </div>

          {/* Row 2: Business Information and Progress - Side by Side */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
            {/* Business Information Card */}
            <div className="relative bg-gradient-to-br from-teal-50 via-blue-50 to-indigo-50 border border-teal-200/50 rounded-2xl p-5 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group animate-fadeIn">
              {/* Animated background gradient */}
              <div className="absolute inset-0 bg-gradient-to-r from-teal-400/0 via-blue-400/5 to-indigo-400/0 group-hover:from-teal-400/10 group-hover:via-blue-400/10 group-hover:to-indigo-400/10 transition-all duration-500"></div>
              
              {/* Content */}
              <div className="relative z-10">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2 animate-slideDown">
                  <div className="p-2 bg-gradient-to-br from-teal-500 to-blue-600 rounded-lg shadow-md">
                    <Building2 className="h-5 w-5 text-white" />
                  </div>
                  <span className="bg-gradient-to-r from-teal-600 to-blue-600 bg-clip-text text-transparent">
                    Business Information
                  </span>
                </h3>
                
                {businessContextLoading ? (
                  // Beautiful Skeleton Loader
                  <div className="space-y-3 animate-pulse">
                    <div className="flex items-center gap-3 p-3 bg-white/60 rounded-xl backdrop-blur-sm">
                      <div className="h-8 w-8 bg-gradient-to-br from-teal-200 to-blue-200 rounded-lg"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-gradient-to-r from-teal-200 via-blue-200 to-indigo-200 rounded w-32 mb-2"></div>
                        <div className="h-5 bg-gradient-to-r from-gray-200 to-gray-300 rounded w-48"></div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-white/60 rounded-xl backdrop-blur-sm">
                      <div className="h-8 w-8 bg-gradient-to-br from-teal-200 to-blue-200 rounded-lg"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-gradient-to-r from-teal-200 via-blue-200 to-indigo-200 rounded w-28 mb-2"></div>
                        <div className="h-5 bg-gradient-to-r from-gray-200 to-gray-300 rounded w-40"></div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-white/60 rounded-xl backdrop-blur-sm">
                      <div className="h-8 w-8 bg-gradient-to-br from-teal-200 to-blue-200 rounded-lg"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-gradient-to-r from-teal-200 via-blue-200 to-indigo-200 rounded w-32 mb-2"></div>
                        <div className="h-5 bg-gradient-to-r from-gray-200 to-gray-300 rounded w-52"></div>
                      </div>
                    </div>
                  </div>
                ) : (
                  // Beautiful Actual Content
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 bg-white/70 hover:bg-white/90 rounded-xl backdrop-blur-sm transition-all duration-300 hover:scale-[1.02] hover:shadow-md animate-slideInLeft">
                      <div className="p-2 bg-gradient-to-br from-teal-500 to-teal-600 rounded-lg shadow-sm">
                        <Building2 className="h-5 w-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Business Name</p>
                        <p className="text-base font-bold text-gray-900">{businessContext.business_name || currentTask?.business_context.business_name}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 p-3 bg-white/70 hover:bg-white/90 rounded-xl backdrop-blur-sm transition-all duration-300 hover:scale-[1.02] hover:shadow-md animate-slideInLeft animation-delay-100">
                      <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-sm">
                        <Target className="h-5 w-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Industry</p>
                        <p className="text-base font-semibold text-gray-800">{businessContext.industry || currentTask?.business_context.industry}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 p-3 bg-white/70 hover:bg-white/90 rounded-xl backdrop-blur-sm transition-all duration-300 hover:scale-[1.02] hover:shadow-md animate-slideInLeft animation-delay-200">
                      <div className="p-2 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg shadow-sm">
                        <MapPin className="h-5 w-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Location</p>
                        <p className="text-base font-semibold text-gray-800">{businessContext.location || currentTask?.business_context.location}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Implementation Progress Card - Subtle Colors */}
            <div className="relative bg-gradient-to-br from-teal-50 via-blue-50 to-indigo-50 border border-teal-200/50 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group animate-fadeIn">
              {/* Subtle background pattern */}
              <div className="absolute inset-0 bg-gradient-to-r from-teal-100/30 via-blue-100/30 to-indigo-100/30 opacity-50 group-hover:opacity-70 transition-opacity duration-500"></div>
              
              {/* Content */}
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-gradient-to-br from-teal-500 to-blue-600 rounded-xl shadow-md">
                      <Target className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">Implementation Progress</h3>
                      <p className="text-sm text-gray-600">Track your journey to success</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold bg-gradient-to-r from-teal-600 to-blue-600 bg-clip-text text-transparent">
                      {progressPercent}%
                    </div>
                    <p className="text-xs text-gray-600">Complete</p>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-teal-500 to-blue-500 rounded-full transition-all duration-1000 ease-out shadow-sm relative overflow-hidden"
                      style={{ width: `${progressPercent}%` }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
                    </div>
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-white/80 backdrop-blur-sm rounded-lg p-3 border border-gray-200 shadow-sm">
                    <div className="text-2xl font-bold text-gray-900">
                      {completedMainTasks}
                    </div>
                    <div className="text-xs text-gray-600 mt-1">Tasks Done</div>
                  </div>
                  <div className="bg-white/80 backdrop-blur-sm rounded-lg p-3 border border-gray-200 shadow-sm">
                    <div className="text-2xl font-bold text-gray-900">
                      {(progress as any).substeps_completed ?? completedTasks.filter(t => t.includes('_substep_')).length}
                    </div>
                    <div className="text-xs text-gray-600 mt-1">Steps Done</div>
                  </div>
                  <div className="bg-white/80 backdrop-blur-sm rounded-lg p-3 border border-gray-200 shadow-sm">
                    <div className="text-2xl font-bold text-gray-900">
                      {progress.phases_completed ?? 0}
                    </div>
                    <div className="text-xs text-gray-600 mt-1">Phases Done</div>
                  </div>
                  <div className="bg-white/80 backdrop-blur-sm rounded-lg p-3 border border-gray-200 shadow-sm">
                    <div className="text-2xl font-bold text-gray-900">
                      {Math.max(0, totalTasks - completedMainTasks)}
                    </div>
                    <div className="text-xs text-gray-600 mt-1">Remaining</div>
                  </div>
                </div>

                {/* Milestone */}
                {progress.milestone && (
                  <div className="mt-4 flex items-center gap-2 bg-white/80 backdrop-blur-sm rounded-lg p-3 border border-gray-200 shadow-sm">
                    <Rocket className="h-5 w-5 text-teal-600" />
                    <div className="flex-1">
                      <p className="text-xs text-gray-600">Current Milestone</p>
                      <p className="text-sm font-semibold text-gray-900">{progress.milestone}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation - Redesigned */}
      <div className="bg-gradient-to-b from-white via-white to-gray-50/50 border-b border-gray-200/50 sticky top-0 z-30 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 sm:pr-[440px] lg:pr-[500px]">
          <div className="flex gap-1">
            <motion.button
              onClick={() => handleTabChange('task')}
              className={`relative py-4 px-6 font-medium text-sm rounded-t-lg transition-all ${
                activeTab === 'task'
                  ? 'text-teal-700'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-center gap-2">
                <Target className={`h-4 w-4 ${activeTab === 'task' ? 'text-teal-600' : 'text-gray-500'}`} />
                <span>Current Task</span>
              </div>
              {activeTab === 'task' && (
                <motion.div
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-teal-500 to-blue-500"
                  layoutId="activeTab"
                  initial={false}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
            </motion.button>
            <motion.button
              onClick={() => handleTabChange('roadmap')}
              className={`relative py-4 px-6 font-medium text-sm rounded-t-lg transition-all ${
                activeTab === 'roadmap'
                  ? 'text-teal-700'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-center gap-2">
                <FileText className={`h-4 w-4 ${activeTab === 'roadmap' ? 'text-teal-600' : 'text-gray-500'}`} />
                <span>Full Roadmap</span>
              </div>
              {activeTab === 'roadmap' && (
                <motion.div
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-teal-500 to-blue-500"
                  layoutId="activeTab"
                  initial={false}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
            </motion.button>
            <motion.button
              onClick={() => handleTabChange('budget')}
              className={`relative py-4 px-6 font-medium text-sm rounded-t-lg transition-all ${
                activeTab === 'budget'
                  ? 'text-teal-700'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-center gap-2">
                <DollarSign className={`h-4 w-4 ${activeTab === 'budget' ? 'text-teal-600' : 'text-gray-500'}`} />
                <span>Budget</span>
              </div>
              {activeTab === 'budget' && (
                <motion.div
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-teal-500 to-blue-500"
                  layoutId="activeTab"
                  initial={false}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
            </motion.button>
          </div>
        </div>
      </div>

      {/* Main Content - Better Spacing with Right Padding for Floating Support */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 sm:pr-[440px] lg:pr-[500px]">
        <AnimatePresence mode="wait">
          {activeTab === 'task' && (
            <motion.div
              key="task"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="w-full"
            >
              <TaskCard
                task={currentTask}
                onComplete={handleSubstepCompletion}
                onGetServiceProviders={handleGetServiceProviders}
                onGetHelp={handleGetHelp}
                onUploadDocument={handleUploadDocument}
                sessionId={sessionId}
                helpContent={helpContent}
                helpLoading={helpLoading}
              />
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          {activeTab === 'roadmap' && mountedTabs.roadmap && (
            <motion.div
              key="roadmap"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="w-full"
            >
              <div className="bg-white/90 backdrop-blur-xl border border-gray-200/50 rounded-xl p-4 sm:p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Full Launch Roadmap</h2>
                <p className="text-sm sm:text-base text-gray-600 mt-1">Complete roadmap in table format</p>
              </div>
              {roadmapContent && (
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    // The RoadmapDisplay component has its own export button, so we'll just show a message
                    toast.info('Use the export button in the roadmap view below');
                  }}
                  className="flex items-center justify-center gap-2 bg-teal-500 hover:bg-teal-600 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm sm:text-base whitespace-nowrap"
                >
                  <Download className="h-4 w-4" />
                  <span className="hidden sm:inline">Export Available Below</span>
                  <span className="sm:hidden">Export Below</span>
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
                hideStartButton={true}
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
            </motion.div>
          )}
          
          {activeTab === 'budget' && mountedTabs.budget && (
            <motion.div
              key="budget"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="w-full"
            >
              <div className="bg-white/90 backdrop-blur-xl border border-gray-200/50 rounded-xl p-4 sm:p-6 shadow-sm">
                {budgetLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500"></div>
                    <span className="ml-4 text-gray-600">Loading budget...</span>
                  </div>
                ) : budget ? (
                  <BudgetDashboard
                    budget={budget}
                    onUpdateBudget={handleUpdateBudget}
                    onAddItem={handleAddItem}
                    onUpdateItem={handleUpdateItem}
                    onDeleteItem={handleDeleteItem}
                    showActuals={true}
                  />
                ) : (
                  <div className="text-center py-12">
                    <p className="text-gray-600">No budget data available</p>
                    <button
                      onClick={loadBudget}
                      className="mt-4 bg-teal-500 hover:bg-teal-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                    >
                      Load Budget
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
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

      {/* Floating Comprehensive Support - Always Visible */}
      <FloatingComprehensiveSupport
        taskContext={currentTask?.title || 'general business support'}
        businessContext={businessContext}
        angelCanHelp={currentTask?.angel_actions || []}
        sessionId={sessionId}
        currentTask={currentTask}
      />
      
      {/* Custom Animations */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideInLeft {
          from { opacity: 0; transform: translateX(-20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-fadeIn { animation: fadeIn 0.6s ease-out; }
        .animate-slideDown { animation: slideDown 0.5s ease-out; }
        .animate-slideInLeft { animation: slideInLeft 0.5s ease-out; }
        .animate-shimmer { animation: shimmer 2s infinite; }
        .animation-delay-100 { animation-delay: 0.1s; }
        .animation-delay-200 { animation-delay: 0.2s; }
      `}</style>
          </div>
        );
      };
      
      export default Implementation;