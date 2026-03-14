import React, { useState, useEffect, useRef, useCallback } from 'react';
import { toast } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import TaskCard from '../../components/TaskCard';
import TaskCompletionModal from '../../components/TaskCompletionModal';
import ServiceProviderModal from '../../components/ServiceProviderModal';
import HelpModal from '../../components/HelpModal';
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
  Rocket,
  DollarSign,
  FileText,
  Download,
  Building2,
  MapPin,
  Trophy,
  Home,
  ArrowLeft,
  Shield,
  Settings,
  Megaphone
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

  const budgetLoadedRef = useRef(false);
  const loadBudget = async (forceRefresh = false) => {
    if (budgetLoading) return;
    // Skip if already loaded, unless force refresh
    if (!forceRefresh && budgetLoadedRef.current && budget) return;
    try {
      setBudgetLoading(true);
      console.log('[loadBudget] Fetching budget from DB for session:', sessionId);
      const response = await budgetService.getBudget(sessionId);
      console.log('[loadBudget] Response:', { success: response.success, itemsCount: response.result?.items?.length ?? 0, budgetId: response.result?.id });
      
      if (response.success && response.result) {
        const result = response.result;
        // Backend now always returns a valid budget via _ensure_budget_exists
        setBudget(result);
        budgetLoadedRef.current = true;
      } else {
        console.warn('[loadBudget] No budget returned, creating one...');
        const created = await budgetService.saveBudget(sessionId, {
          session_id: sessionId,
          initial_investment: 0,
          total_estimated_expenses: 0,
          total_estimated_revenue: 0,
          items: [],
        });
        if (created.success && created.result) {
          setBudget(created.result);
          budgetLoadedRef.current = true;
        } else {
          toast.error(created.message || 'Failed to initialize budget');
          setBudget(null);
        }
      }
    } catch (error) {
      console.error('[loadBudget] Error loading budget:', error);
      toast.error('Failed to load budget');
    } finally {
      setBudgetLoading(false);
    }
  };

  // handleUpdateBudget — LOCAL STATE ONLY.
  // Individual CRUD operations (addBudgetItem, updateBudgetItem, deleteBudgetItem,
  // updateBudgetHeader, saveRevenueStreams) each persist directly to DB.
  // The manual "Save" button in BudgetDashboard does a full sync when clicked.
  // NO debounced full-save here — it was causing race conditions that deleted newly-added items.
  const handleUpdateBudget = useCallback((updates: Partial<Budget>) => {
    setBudget((prev) => {
      if (!prev) return prev;
      const updatedBudget = { ...prev, ...updates, updated_at: new Date().toISOString() };
    
      // Recalculate totals from items
      const expenses = updatedBudget.items.filter(item => item.category === 'expense');
      const revenues = updatedBudget.items.filter(item => item.category === 'revenue');
    
      updatedBudget.total_estimated_expenses = expenses.reduce((sum, item) => sum + item.estimated_amount, 0);
      updatedBudget.total_estimated_revenue = revenues.reduce((sum, item) => sum + item.estimated_amount, 0);
      updatedBudget.total_actual_expenses = expenses.reduce((sum, item) => sum + (item.actual_amount || 0), 0);
      updatedBudget.total_actual_revenue = revenues.reduce((sum, item) => sum + (item.actual_amount || 0), 0);

      return updatedBudget;
    });
  }, []);

  const handleAddItem = async (item: Omit<BudgetItem, 'id' | 'created_at' | 'updated_at'>) => {
    if (!budget) return;
    
    try {
      const response = await budgetService.addBudgetItem(sessionId, item);
      if (response.success) {
        setBudget(response.result);
      } else {
        toast.error(response.message || 'Failed to add item');
      }
    } catch (error) {
      console.error('Error adding budget item:', error);
      toast.error('Failed to add item');
    }
  };

  const handleUpdateItem = async (itemId: string, updates: Partial<BudgetItem>) => {
    if (!sessionId) return;
    try {
      const response = await budgetService.updateBudgetItem(sessionId, itemId, updates);
      if (response.success) {
        setBudget(response.result);
      } else {
        toast.error(response.message || 'Failed to update item');
      }
    } catch (error) {
      console.error('Error updating budget item:', error);
      toast.error('Failed to update item');
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!sessionId) return;
    try {
      const response = await budgetService.deleteBudgetItem(sessionId, itemId);
      if (response.success) {
        setBudget(response.result);
      } else {
        toast.error(response.message || 'Failed to delete item');
      }
    } catch (error) {
      console.error('Error deleting budget item:', error);
      toast.error('Failed to delete item');
    }
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-teal-50/40 pb-20 sm:pb-0">
      {/* Header - Premium Design */}
      <div className="relative bg-white/80 backdrop-blur-2xl border-b border-gray-200/60 shadow-lg">
        {/* Subtle pattern overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-teal-500/5 via-transparent to-blue-500/5 pointer-events-none"></div>
        
        <div className="relative max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-6 sm:py-8">
          {/* Navigation Buttons - Premium Style */}
          <div className="flex items-center gap-3 mb-8">
            <motion.button
              onClick={() => navigate('/')}
              className="group flex items-center gap-2.5 px-5 py-2.5 bg-white/90 hover:bg-white border border-gray-200/80 rounded-xl text-gray-700 font-semibold transition-all duration-300 hover:shadow-lg hover:border-teal-300/50 hover:-translate-y-0.5"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Home className="h-4 w-4 group-hover:text-teal-600 transition-colors" />
              <span className="hidden sm:inline text-sm">Home</span>
            </motion.button>
            <motion.button
              onClick={() => navigate(`/ventures/${sessionId}`)}
              className="group flex items-center gap-2.5 px-5 py-2.5 bg-white/90 hover:bg-white border border-gray-200/80 rounded-xl text-gray-700 font-semibold transition-all duration-300 hover:shadow-lg hover:border-teal-300/50 hover:-translate-y-0.5"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <ArrowLeft className="h-4 w-4 group-hover:text-teal-600 transition-colors" />
              <span className="hidden sm:inline text-sm">Back to Roadmap</span>
              <span className="sm:hidden text-sm">Back</span>
            </motion.button>
          </div>
          
          {/* Hero Section - Premium Typography */}
          <div className="mb-10">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="flex items-start justify-between flex-wrap gap-6"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2.5 bg-gradient-to-br from-teal-500 to-blue-600 rounded-xl shadow-lg">
                    <Rocket className="h-6 w-6 text-white" />
                  </div>
                  <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 leading-tight">
                    Implementation Phase
                  </h1>
                </div>
                <p className="text-base text-gray-600 font-medium ml-12 mb-3">
                  Turning your roadmap into actionable results
                </p>
                <div className="flex items-center gap-3 ml-12">
                  <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-teal-50 to-blue-50 rounded-lg border border-teal-200/50">
                {getPhaseIcon(currentTask.phase_name)}
                    <span className="text-sm font-semibold text-gray-700">
                  {getPhaseName(currentTask.phase_name)}
                </span>
              </div>
            </div>
              </div>
            </motion.div>
          </div>

          {/* Premium Cards Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-7xl mx-auto">
            {/* Business Information Card - Premium Design */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="relative group"
            >
              <div className="relative h-full bg-white/90 backdrop-blur-xl border border-gray-200/60 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-500 overflow-hidden">
                {/* Premium gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-teal-500/10 via-blue-500/5 to-indigo-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                
                {/* Decorative corner accent */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-teal-400/20 to-transparent rounded-bl-full"></div>
              
              {/* Content */}
              <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-gradient-to-br from-teal-500 via-teal-600 to-blue-600 rounded-xl shadow-md transform group-hover:scale-105 transition-transform duration-300">
                    <Building2 className="h-5 w-5 text-white" />
                  </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 mb-0.5">
                    Business Information
                </h3>
                      <p className="text-xs text-gray-500 font-medium">Company Details</p>
                    </div>
                  </div>
                
                {businessContextLoading ? (
                    <div className="space-y-4 animate-pulse">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="flex items-center gap-4 p-5 bg-gray-50 rounded-2xl">
                          <div className="h-12 w-12 bg-gray-200 rounded-xl"></div>
                          <div className="flex-1 space-y-2">
                            <div className="h-4 bg-gray-200 rounded w-24"></div>
                            <div className="h-5 bg-gray-300 rounded w-40"></div>
                      </div>
                    </div>
                      ))}
                  </div>
                ) : (
                    <div className="space-y-4">
                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                        className="group/item flex items-center gap-4 p-4 bg-gradient-to-r from-gray-50 to-white rounded-xl border border-gray-100 hover:border-teal-200 hover:shadow-md transition-all duration-300 cursor-pointer"
                      >
                        <div className="p-2.5 bg-gradient-to-br from-teal-500 to-teal-600 rounded-lg shadow-sm group-hover/item:scale-105 transition-transform">
                        <Building2 className="h-5 w-5 text-white" />
                      </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Business Name</p>
                          <p className="text-base font-bold text-gray-900 truncate">{businessContext.business_name || currentTask?.business_context.business_name}</p>
                      </div>
                      </motion.div>
                      
                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 }}
                        className="group/item flex items-center gap-4 p-4 bg-gradient-to-r from-gray-50 to-white rounded-xl border border-gray-100 hover:border-blue-200 hover:shadow-md transition-all duration-300 cursor-pointer"
                      >
                        <div className="p-2.5 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-sm group-hover/item:scale-105 transition-transform">
                        <Target className="h-5 w-5 text-white" />
                      </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Industry</p>
                          <p className="text-base font-bold text-gray-900 truncate">{businessContext.industry || currentTask?.business_context.industry}</p>
                      </div>
                      </motion.div>
                      
                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 }}
                        className="group/item flex items-center gap-4 p-4 bg-gradient-to-r from-gray-50 to-white rounded-xl border border-gray-100 hover:border-indigo-200 hover:shadow-md transition-all duration-300 cursor-pointer"
                      >
                        <div className="p-2.5 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg shadow-sm group-hover/item:scale-105 transition-transform">
                        <MapPin className="h-5 w-5 text-white" />
                      </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Location</p>
                          <p className="text-base font-bold text-gray-900 truncate">{businessContext.location || currentTask?.business_context.location}</p>
                      </div>
                      </motion.div>
                  </div>
                )}
              </div>
            </div>
            </motion.div>

            {/* Implementation Progress Card - Premium Design */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative group"
            >
              <div className="relative h-full bg-white/90 backdrop-blur-xl border border-gray-200/60 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-500 overflow-hidden">
                {/* Premium gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-teal-500/5 to-indigo-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                
                {/* Decorative corner accent */}
                <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-blue-400/20 to-transparent rounded-br-full"></div>
              
              {/* Content */}
              <div className="relative z-10">
                  <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
                  <div className="flex items-center gap-3">
                      <div className="p-3 bg-gradient-to-br from-blue-500 via-teal-500 to-blue-600 rounded-xl shadow-md transform group-hover:scale-105 transition-transform duration-300">
                        <Trophy className="h-5 w-5 text-white" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-gray-900 mb-0.5">Progress Tracker</h3>
                        <p className="text-xs text-gray-500 font-medium">Your implementation journey</p>
                    </div>
                  </div>
                  <div className="text-right">
                      <div className="text-4xl sm:text-5xl font-black bg-gradient-to-r from-blue-600 via-teal-600 to-blue-700 bg-clip-text text-transparent leading-none">
                      {progressPercent}%
                    </div>
                      <p className="text-xs font-semibold text-gray-600 mt-1">Complete</p>
                  </div>
                </div>

                  {/* Premium Progress Bar */}
                  <div className="mb-6">
                    <div className="h-3 bg-gray-100 rounded-full overflow-hidden shadow-inner">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progressPercent}%` }}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                        className="h-full bg-gradient-to-r from-blue-500 via-teal-500 to-blue-600 rounded-full relative overflow-hidden shadow-md"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
                      </motion.div>
                  </div>
                </div>

                  {/* Premium Stats Grid */}
                  <div className="grid grid-cols-2 gap-3 mb-5">
                    <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-4 border border-gray-100 hover:border-teal-200 hover:shadow-md transition-all duration-300 group/stat">
                      <div className="text-3xl font-black text-gray-900 mb-1.5 group-hover/stat:scale-105 transition-transform inline-block">
                      {completedMainTasks}
                    </div>
                      <div className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Tasks Done</div>
                  </div>
                    <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-4 border border-gray-100 hover:border-blue-200 hover:shadow-md transition-all duration-300 group/stat">
                      <div className="text-3xl font-black text-gray-900 mb-1.5 group-hover/stat:scale-105 transition-transform inline-block">
                      {(progress as any).substeps_completed ?? completedTasks.filter(t => t.includes('_substep_')).length}
                    </div>
                      <div className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Steps Done</div>
                  </div>
                    <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-4 border border-gray-100 hover:border-indigo-200 hover:shadow-md transition-all duration-300 group/stat">
                      <div className="text-3xl font-black text-gray-900 mb-1.5 group-hover/stat:scale-105 transition-transform inline-block">
                      {progress.phases_completed ?? 0}
                    </div>
                      <div className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Phases Done</div>
                  </div>
                    <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-4 border border-gray-100 hover:border-rose-200 hover:shadow-md transition-all duration-300 group/stat">
                      <div className="text-3xl font-black text-gray-900 mb-1.5 group-hover/stat:scale-105 transition-transform inline-block">
                      {Math.max(0, totalTasks - completedMainTasks)}
                    </div>
                      <div className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Remaining</div>
                  </div>
                </div>

                  {/* Premium Milestone */}
                {progress.milestone && (
                    <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-teal-50 via-blue-50 to-indigo-50 rounded-xl border border-teal-200/50 shadow-sm">
                      <div className="p-2.5 bg-gradient-to-br from-teal-500 to-blue-600 rounded-lg shadow-md">
                        <Rocket className="h-5 w-5 text-white" />
                      </div>
                    <div className="flex-1">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-0.5">Current Milestone</p>
                        <p className="text-base font-bold text-gray-900">{progress.milestone}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Premium Tab Navigation */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-2xl border-b border-gray-200/60 shadow-lg">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="flex gap-2">
            <motion.button
              onClick={() => handleTabChange('task')}
              className={`relative py-4 px-6 font-semibold text-sm rounded-t-xl transition-all duration-300 ${
                activeTab === 'task'
                  ? 'text-teal-700 bg-gradient-to-b from-teal-50/50 to-white'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50/50'
              }`}
              whileHover={{ scale: 1.02, y: -1 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-center gap-2">
                <div className={`p-1.5 rounded-lg ${activeTab === 'task' ? 'bg-teal-100' : 'bg-gray-100'}`}>
                <Target className={`h-4 w-4 ${activeTab === 'task' ? 'text-teal-600' : 'text-gray-500'}`} />
                </div>
                <span>Current Task</span>
              </div>
              {activeTab === 'task' && (
                <motion.div
                  className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-teal-500 via-blue-500 to-teal-500 rounded-t-full"
                  layoutId="activeTab"
                  initial={false}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
            </motion.button>
            <motion.button
              onClick={() => handleTabChange('roadmap')}
              className={`relative py-4 px-6 font-semibold text-sm rounded-t-xl transition-all duration-300 ${
                activeTab === 'roadmap'
                  ? 'text-teal-700 bg-gradient-to-b from-teal-50/50 to-white'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50/50'
              }`}
              whileHover={{ scale: 1.02, y: -1 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-center gap-2">
                <div className={`p-1.5 rounded-lg ${activeTab === 'roadmap' ? 'bg-teal-100' : 'bg-gray-100'}`}>
                <FileText className={`h-4 w-4 ${activeTab === 'roadmap' ? 'text-teal-600' : 'text-gray-500'}`} />
                </div>
                <span>Full Roadmap</span>
              </div>
              {activeTab === 'roadmap' && (
                <motion.div
                  className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-teal-500 via-blue-500 to-teal-500 rounded-t-full"
                  layoutId="activeTab"
                  initial={false}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
            </motion.button>
            <motion.button
              onClick={() => handleTabChange('budget')}
              className={`relative py-4 px-6 font-semibold text-sm rounded-t-xl transition-all duration-300 ${
                activeTab === 'budget'
                  ? 'text-teal-700 bg-gradient-to-b from-teal-50/50 to-white'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50/50'
              }`}
              whileHover={{ scale: 1.02, y: -1 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-center gap-2">
                <div className={`p-1.5 rounded-lg ${activeTab === 'budget' ? 'bg-teal-100' : 'bg-gray-100'}`}>
                <DollarSign className={`h-4 w-4 ${activeTab === 'budget' ? 'text-teal-600' : 'text-gray-500'}`} />
                </div>
                <span>Budget</span>
              </div>
              {activeTab === 'budget' && (
                <motion.div
                  className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-teal-500 via-blue-500 to-teal-500 rounded-t-full"
                  layoutId="activeTab"
                  initial={false}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
            </motion.button>
          </div>
        </div>
      </div>

      {/* Main Content - Premium Spacing */}
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-6 sm:py-8">
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
              <div className="bg-white/95 backdrop-blur-xl border border-gray-200/60 rounded-2xl p-6 shadow-lg">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-1">Full Launch Roadmap</h2>
                    <p className="text-sm text-gray-600 font-medium">Complete roadmap in table format</p>
                  </div>
              {roadmapContent && (
                    <motion.a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    toast.info('Use the export button in the roadmap view below');
                  }}
                      className="flex items-center justify-center gap-2 bg-gradient-to-r from-teal-500 to-blue-600 hover:from-teal-600 hover:to-blue-700 text-white px-5 py-2.5 rounded-lg font-semibold shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5 whitespace-nowrap text-sm"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                >
                      <Download className="h-5 w-5" />
                  <span className="hidden sm:inline">Export Available Below</span>
                  <span className="sm:hidden">Export Below</span>
                    </motion.a>
              )}
            </div>
            {roadmapLoading ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <div className="relative">
                      <div className="animate-spin rounded-full h-12 w-12 border-4 border-teal-200 border-t-teal-600"></div>
                      <div className="absolute inset-0 animate-ping rounded-full h-12 w-12 border-4 border-teal-400 opacity-20"></div>
                    </div>
                    <span className="mt-4 text-base font-semibold text-gray-700">Loading…</span>
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
                    <div className="inline-flex p-3 bg-gradient-to-br from-teal-100 to-blue-100 rounded-xl mb-4">
                      <FileText className="h-10 w-10 text-teal-600" />
                    </div>
                    <p className="text-lg font-semibold text-gray-700 mb-2">No roadmap content available</p>
                    <p className="text-sm text-gray-500 mb-5">Load your roadmap to view the complete plan</p>
                    <motion.button
                      onClick={loadRoadmapContent}
                      className="bg-gradient-to-r from-teal-500 to-blue-600 hover:from-teal-600 hover:to-blue-700 text-white px-6 py-2.5 rounded-lg font-semibold shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      Load Roadmap
                    </motion.button>
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
              <div className="bg-white/95 backdrop-blur-xl border border-gray-200/60 rounded-2xl p-6 shadow-lg">
                {budgetLoading ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <div className="relative">
                      <div className="animate-spin rounded-full h-12 w-12 border-4 border-teal-200 border-t-teal-600"></div>
                      <div className="absolute inset-0 animate-ping rounded-full h-12 w-12 border-4 border-teal-400 opacity-20"></div>
                    </div>
                    <span className="mt-4 text-base font-semibold text-gray-700">Loading budget data...</span>
                  </div>
                ) : budget ? (
                  <BudgetDashboard
                    budget={budget}
                    onUpdateBudget={handleUpdateBudget}
                    onUpdateItem={handleUpdateItem}
                    onDeleteItem={handleDeleteItem}
                    showActuals={true}
                    sessionId={sessionId}
                    businessType={businessContext?.business_type}
                    businessContext={businessContext}
                  />
                ) : (
                  <div className="text-center py-12">
                    <div className="inline-flex p-3 bg-gradient-to-br from-teal-100 to-blue-100 rounded-xl mb-4">
                      <DollarSign className="h-10 w-10 text-teal-600" />
                    </div>
                    <p className="text-lg font-semibold text-gray-700 mb-2">No budget data available</p>
                    <p className="text-sm text-gray-500 mb-5">Create your first budget to start tracking expenses</p>
                    <motion.button
                      onClick={() => loadBudget()}
                      className="bg-gradient-to-r from-teal-500 to-blue-600 hover:from-teal-600 hover:to-blue-700 text-white px-6 py-2.5 rounded-lg font-semibold shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      Initialize Budget
                    </motion.button>
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

      {/* Floating Comprehensive Support - Only show in business phases, not GKY */}
      {currentTask && currentTask.phase_name && !currentTask.phase_name.toLowerCase().includes('gky') && (
        <FloatingComprehensiveSupport
          taskContext={currentTask?.title || 'general business support'}
          businessContext={businessContext}
          angelCanHelp={currentTask?.angel_actions || []}
          sessionId={sessionId}
          currentTask={currentTask}
        />
      )}
      
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