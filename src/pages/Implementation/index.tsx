import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { toast } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import TaskCard, { type TaskCompletionResult } from '../../components/TaskCard';
import TaskCompletionModal from '../../components/TaskCompletionModal';
import ServiceProviderModal from '../../components/ServiceProviderModal';
import HelpModal from '../../components/HelpModal';
import FloatingComprehensiveSupport from '../../components/FloatingComprehensiveSupport';
import RoadmapDisplay from '../../components/RoadmapDisplay';
import ImplementationRoadmapNavigator from '../../components/ImplementationRoadmapNavigator';
import ImplementationCompletionModal from '../../components/ImplementationCompletionModal';
import type { ImplementationCatalogPhase } from '../../types/implementationNavigation';
import httpClient from '../../api/httpClient';
import { useBusinessContext } from '../../hooks/useBusinessContext';
import { useAppDispatch } from '../../store';
import {
  implementationApi,
  implementationCachePolicy,
  useGetBudgetQuery,
  useGetImplementationTasksQuery,
  useGetImplementationTaskDetailQuery,
  useGetRoadmapPlanQuery,
  useGetTaskHelpQuery,
  useLazyGetContactProvidersQuery,
  useUploadTaskDocumentMutation,
} from '../../store/implementationApi';
import { displayBusinessNameFromApi } from '../../utils/businessName';
import VentureBrandMark from '../../components/layout/VentureBrandMark';
import type { ServiceProviderRow } from '../../utils/serviceProvider';
import { IMPLEMENTATION_RETURN_KEY } from '../ErrorBoundaryPage';
import { BudgetDashboard } from '../../components/Budget';
import { budgetService } from '../../services/budgetService';
import type { Budget, BudgetItem } from '../../types/apiTypes';
import { 
  Target, 
  Rocket,
  DollarSign,
  FileText,
  Building2,
  MapPin,
  Trophy,
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
  note?: string;
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
  service_providers?: ServiceProviderRow[];
}

function applySubstepCompletionToTask(
  task: ImplementationTask,
  substepNumber: number,
  note: string,
  completedIds: string[],
): ImplementationTask {
  const substepId = `${task.id}_substep_${substepNumber}`;
  const completedSet = new Set([...completedIds, substepId]);

  const substeps = (task.substeps ?? []).map((s) => ({
    ...s,
    completed: completedSet.has(`${task.id}_substep_${s.step_number}`),
    note: s.step_number === substepNumber ? note : s.note,
  }));

  const nextIncomplete = substeps.find((s) => !s.completed);
  const currentSubstep = nextIncomplete
    ? nextIncomplete.step_number
    : substeps.length > 0
      ? substeps[substeps.length - 1].step_number
      : task.current_substep;

  return { ...task, substeps, current_substep: currentSubstep };
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
  onPhaseChange: (phase: string) => void;
}

const Implementation: React.FC<ImplementationProps> = ({
  sessionId,
  onPhaseChange
}) => {
  const {
    context: dbBusinessContext,
    loading: businessContextLoading,
    refresh: refreshBusinessContext,
    isReady: businessContextReady,
  } = useBusinessContext(sessionId);
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const {
    data: tasksPayload,
    isLoading: tasksLoading,
    isFetching: tasksFetching,
    error: tasksQueryError,
    refetch: refetchTasks,
  } = useGetImplementationTasksQuery(sessionId, {
    skip: !sessionId,
    ...implementationCachePolicy.tasks,
  });

  const [currentTask, setCurrentTask] = useState<ImplementationTask | null>(null);
  const [completedTasks, setCompletedTasks] = useState<string[]>([]);
  const [progress, setProgress] = useState<ImplementationProgress>({
    completed: 0,
    total: 25,
    percent: 0,
    phases_completed: 0
  });
  const loading = tasksLoading;
  const isRefreshingTask = tasksFetching && !tasksLoading;
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'implementation' | 'budget'>('implementation');
  const [mountedTabs, setMountedTabs] = useState<Record<string, boolean>>({ implementation: true });
  const [roadmapContent, setRoadmapContent] = useState<string>('');
  const [taskCatalog, setTaskCatalog] = useState<ImplementationCatalogPhase[]>([]);
  const [nextTaskId, setNextTaskId] = useState<string | null>(null);
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
  const [optimisticPanelTask, setOptimisticPanelTask] = useState<ImplementationTask | null>(null);
  const [showRoadmapDocument, setShowRoadmapDocument] = useState(false);
  const autoExpandQueuedRef = useRef(false);
  const budgetLoadedRef = useRef(false);
  
  // Budget state
  const [budget, setBudget] = useState<Budget | null>(null);
  
  // Local business context that can be updated independently
  const [localBusinessContext, setLocalBusinessContext] = useState<typeof dbBusinessContext | null>(null);
  const [extractionAttempted, setExtractionAttempted] = useState(false);
  
  // Modal states
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [showServiceProviderModal, setShowServiceProviderModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  
  // Modal data
  const [serviceProviders, setServiceProviders] = useState<any[]>([]);

  const [fetchContactProviders, { isLoading: contactProvidersLoading }] =
    useLazyGetContactProvidersQuery();

  const [uploadTaskDocument] = useUploadTaskDocumentMutation();

  const shouldFetchExpandedDetail = Boolean(
    sessionId && expandedTaskId && expandedTaskId !== currentTask?.id,
  );

  const {
    data: expandedTaskPayload,
    isLoading: expandedTaskLoading,
    isFetching: expandedTaskFetching,
  } = useGetImplementationTaskDetailQuery(
    { sessionId: sessionId!, taskId: expandedTaskId! },
    {
      skip: !shouldFetchExpandedDetail,
      ...implementationCachePolicy.tasks,
    },
  );

  const basePanelTask = useMemo((): ImplementationTask | null => {
    if (!expandedTaskId) return null;
    if (currentTask?.id === expandedTaskId) return currentTask;
    if (expandedTaskPayload?.task) {
      return expandedTaskPayload.task as unknown as ImplementationTask;
    }
    return null;
  }, [expandedTaskId, currentTask, expandedTaskPayload]);

  const panelTask = useMemo(() => {
    if (optimisticPanelTask?.id === expandedTaskId) return optimisticPanelTask;
    return basePanelTask;
  }, [optimisticPanelTask, expandedTaskId, basePanelTask]);

  const activeSupportTask = panelTask ?? currentTask;

  const { data: helpPayload, isLoading: helpLoading, isFetching: helpFetching } =
    useGetTaskHelpQuery(
      { sessionId, taskId: activeSupportTask?.id ?? '' },
      {
        skip: !sessionId || !activeSupportTask?.id,
        ...implementationCachePolicy.taskHelp,
      },
    );
  const helpContent = helpPayload?.help_content ?? '';

  const { data: roadmapPayload, isLoading: roadmapLoading, refetch: refetchRoadmap } =
    useGetRoadmapPlanQuery(sessionId, {
      skip: !sessionId,
      ...implementationCachePolicy.roadmap,
    });

  const { data: budgetPayload, isLoading: budgetQueryLoading, refetch: refetchBudget } =
    useGetBudgetQuery(sessionId, {
      skip: activeTab !== 'budget' || !mountedTabs.budget || !sessionId,
      ...implementationCachePolicy.budget,
    });
  const budgetLoading = budgetQueryLoading;

  // Real Implementation completions, in the normalized form used to overlay
  // a "done" checkmark on roadmap rows. Refreshed whenever a task completes.
  const [completedRoadmapStepKeys, setCompletedRoadmapStepKeys] = useState<string[]>([]);

  const refreshCompletedRoadmapStepKeys = useCallback(async () => {
    if (!sessionId) return;
    try {
      const { data } = await httpClient.get<any>(`/angel/sessions/${sessionId}`);
      const keys = data?.result?.business_context?.completed_roadmap_step_keys;
      if (Array.isArray(keys)) {
        setCompletedRoadmapStepKeys(keys);
      }
    } catch {
      // Non-fatal: roadmap simply renders without checkmarks.
    }
  }, [sessionId]);

  useEffect(() => {
    refreshCompletedRoadmapStepKeys();
  }, [refreshCompletedRoadmapStepKeys]);

  const invalidateTaskScopedCache = useCallback(
    (taskId?: string) => {
      const tags: Parameters<typeof implementationApi.util.invalidateTags>[0] = [
        { type: 'ImplementationTasks', id: sessionId },
      ];
      if (taskId) {
        tags.push({ type: 'ImplementationTasks', id: `${sessionId}:${taskId}` });
      }
      dispatch(implementationApi.util.invalidateTags(tags));
    },
    [dispatch, sessionId],
  );

  // Sync RTK Query task payload into local state (supports optimistic substep updates).
  useEffect(() => {
    if (!tasksPayload) return;
    if (tasksPayload.success) {
      if (!tasksPayload.current_task) {
        setCurrentTask(null);
        if (tasksPayload.progress) {
          setProgress((prev) => ({ ...prev, ...tasksPayload.progress } as ImplementationProgress));
        }
        setShowCompletionModal(true);
      } else {
        setCurrentTask((prev) => {
          const next = tasksPayload.current_task as unknown as ImplementationTask;
          if (!prev || prev.id !== next.id) return next;
          const focused = prev.current_substep;
          if (focused != null) {
            const focusedSub = next.substeps?.find((s) => s.step_number === focused);
            if (focusedSub && !focusedSub.completed) {
              return { ...next, current_substep: focused };
            }
          }
          return next;
        });
        setCompletedTasks(tasksPayload.completed_tasks ?? []);
        if (Array.isArray(tasksPayload.task_catalog)) {
          setTaskCatalog(tasksPayload.task_catalog);
        }
        setNextTaskId(tasksPayload.next_task_id ?? null);
        if (tasksPayload.progress) {
          setProgress((prev) => ({ ...prev, ...tasksPayload.progress } as ImplementationProgress));
        }
        setShowCompletionModal(false);
      }
      setError(null);
    } else if (tasksPayload.message) {
      setError(tasksPayload.message);
    }
  }, [tasksPayload]);

  useEffect(() => {
    if (tasksQueryError) {
      setError('Failed to load implementation data');
    }
  }, [tasksQueryError]);

  useEffect(() => {
    if (roadmapPayload?.result?.plan) {
      setRoadmapContent(roadmapPayload.result.plan);
    }
  }, [roadmapPayload]);

  useEffect(() => {
    if (budgetPayload?.success && budgetPayload.result) {
      setBudget(budgetPayload.result);
      budgetLoadedRef.current = true;
    }
  }, [budgetPayload]);

  const handleSelectTask = useCallback(
    (taskId: string) => {
      if (expandedTaskId === taskId) {
        setExpandedTaskId(null);
        setOptimisticPanelTask(null);
        return;
      }
      setExpandedTaskId(taskId);
      setOptimisticPanelTask(null);
    },
    [expandedTaskId],
  );

  useEffect(() => {
    if (autoExpandQueuedRef.current || !nextTaskId || expandedTaskId) return;
    autoExpandQueuedRef.current = true;
    setExpandedTaskId(nextTaskId);
  }, [nextTaskId, expandedTaskId]);

  useEffect(() => {
    if (!tasksFetching) {
      setOptimisticPanelTask(null);
    }
  }, [tasksPayload, tasksFetching]);

  useEffect(() => {
    setMountedTabs({ implementation: true });
    setRoadmapContent('');
    setExpandedTaskId(null);
    setOptimisticPanelTask(null);
    autoExpandQueuedRef.current = false;
    setExtractionAttempted(false);
    setLocalBusinessContext(null);

    // Drop a breadcrumb so the global error boundary can offer a
    // "Return to Implementation" CTA if a downstream component throws while
    // the user is on this page (e.g. a service-provider modal failing). The
    // breadcrumb is cleared when this component unmounts on a clean
    // navigation away.
    if (sessionId && typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(IMPLEMENTATION_RETURN_KEY, sessionId);
      } catch {
        // localStorage can throw in private mode; the CTA simply won't show.
      }
    }
    return () => {
      if (typeof window !== 'undefined') {
        try {
          window.localStorage.removeItem(IMPLEMENTATION_RETURN_KEY);
        } catch {
          // ignore
        }
      }
    };
  }, [sessionId]);
  
  // When DB context is still empty, run server-side extraction once.
  useEffect(() => {
    if (!extractionAttempted && !businessContextReady && !businessContextLoading) {
      extractBusinessContextIfNeeded();
    }
  }, [businessContextReady, businessContextLoading, extractionAttempted]);

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
      
      const { data } = await httpClient.post<any>(
        `/business-context/sessions/${sessionId}/extract-business-context`
      );

      if (data.success && data.result.extracted) {
        const extractedContext = data.result.business_context;
        console.log('✅ Business context extracted/generated:', extractedContext);
        console.log('   Previous:', data.result.previous_context?.business_name);
        console.log('   New:', extractedContext.business_name);

        setLocalBusinessContext(extractedContext);
        await refreshBusinessContext();

        await new Promise((resolve) => setTimeout(resolve, 500));
        await loadImplementationData();
      }
    } catch (error) {
        console.error('Error extracting business context:', error);
      }
  };

  const handleTabChange = (tab: 'implementation' | 'budget') => {
    setActiveTab(tab);
    setMountedTabs((prev) => (prev[tab] ? prev : { ...prev, [tab]: true }));
  };
  
  const loadBudget = async (forceRefresh = false) => {
    if (budgetLoading) return;
    if (!forceRefresh && budgetLoadedRef.current && budget) return;
    try {
      const result = await refetchBudget().unwrap();
      if (result.success && result.result) {
        setBudget(result.result);
        budgetLoadedRef.current = true;
        return;
      }
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
        dispatch(implementationApi.util.invalidateTags([{ type: 'Budget', id: sessionId }]));
      } else {
        toast.error(created.message || 'Failed to initialize budget');
        setBudget(null);
      }
    } catch (error) {
      console.error('[loadBudget] Error loading budget:', error);
      toast.error('Failed to load budget');
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
        dispatch(implementationApi.util.invalidateTags([{ type: 'Budget', id: sessionId }]));
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
        dispatch(implementationApi.util.invalidateTags([{ type: 'Budget', id: sessionId }]));
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
        dispatch(implementationApi.util.invalidateTags([{ type: 'Budget', id: sessionId }]));
      } else {
        toast.error(response.message || 'Failed to delete item');
      }
    } catch (error) {
      console.error('Error deleting budget item:', error);
      toast.error('Failed to delete item');
    }
  };

  // Load budget when budget tab is accessed (RTK Query caches the response).
  useEffect(() => {
    if (activeTab === 'budget' && mountedTabs.budget) {
      void loadBudget();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, mountedTabs.budget]);

  const businessContext = localBusinessContext ?? dbBusinessContext;

  // Computed progress fallback to ensure percent tracks completed tasks
  const totalTasks = (progress as any)?.total ?? 25;
  const completedMainTasks = (progress as any)?.main_tasks_completed ?? completedTasks.filter(t => !t.includes('_substep_')).length;
  const completedCount = completedTasks.length;
  const computedPercent = totalTasks > 0 ? Math.round((completedMainTasks / totalTasks) * 100) : 0;
  const substepPercent = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;
  const progressPercent = Math.min(100, Math.max((progress as any)?.percent ?? 0, computedPercent, substepPercent));

  const showPanelLoader = Boolean(
    expandedTaskId &&
      (
        !panelTask ||
        panelTask.id !== expandedTaskId ||
        (shouldFetchExpandedDetail && expandedTaskLoading) ||
        (expandedTaskId === currentTask?.id && tasksLoading && !currentTask)
      ),
  );

  const panelTaskProgressLoading = Boolean(
    showPanelLoader ||
      (tasksLoading && expandedTaskId != null) ||
      (isRefreshingTask &&
        panelTask &&
        currentTask &&
        panelTask.id === currentTask.id &&
        panelTask.id === expandedTaskId),
  );

  const expandedPanelLoadingTaskId =
    shouldFetchExpandedDetail && expandedTaskFetching ? expandedTaskId : null;

  const loadImplementationData = async (_options?: { silent?: boolean }) => {
    await refetchTasks();
  };

  const applyCompletionFromResponse = (data: TaskCompletionResult) => {
    if (data.progress) {
      setProgress((prev) => ({
        ...prev,
        ...(data.progress as Partial<ImplementationProgress>),
      }));
    }

    const taskId = data.result?.task_id;
    const substepNumber = data.result?.substep_number;
    const note = data.result?.notes?.trim() ?? '';

    const applyToTask = (taskPrev: ImplementationTask | null) => {
      if (!taskPrev || (taskId && taskPrev.id !== taskId)) return taskPrev;

      if (substepNumber != null) {
        const substepId = `${taskPrev.id}_substep_${substepNumber}`;
        const completedIds: string[] = [];
        for (const s of taskPrev.substeps ?? []) {
          const id = `${taskPrev.id}_substep_${s.step_number}`;
          if (s.completed || s.step_number === substepNumber) {
            completedIds.push(id);
          }
        }
        if (!completedIds.includes(substepId)) {
          completedIds.push(substepId);
        }

        const updated = applySubstepCompletionToTask(
          taskPrev,
          substepNumber,
          note,
          completedIds,
        );

        setCompletedTasks((completedPrev) => {
          const merged = new Set([...completedPrev, ...completedIds]);
          return Array.from(merged);
        });

        return updated;
      }

      const completedIds: string[] = [taskPrev.id];
      for (const s of taskPrev.substeps ?? []) {
        completedIds.push(`${taskPrev.id}_substep_${s.step_number}`);
      }

      setCompletedTasks((completedPrev) => {
        const merged = new Set([...completedPrev, ...completedIds]);
        return Array.from(merged);
      });

      const substeps = (taskPrev.substeps ?? []).map((substep) => ({
        ...substep,
        completed: true,
      }));
      const lastSubstep = substeps[substeps.length - 1];

      return {
        ...taskPrev,
        substeps,
        current_substep: lastSubstep?.step_number ?? taskPrev.current_substep,
      };
    };

    if (substepNumber != null || taskId) {
      setCurrentTask(applyToTask);
      setOptimisticPanelTask((prev) => {
        const next = applyToTask(prev ?? basePanelTask);
        return next ?? prev;
      });
    }
  };

  const handleTaskCompletion = async (completionData: any) => {
    if (!currentTask) return;

    try {
      const { data } = await httpClient.post<any>(
        `/implementation/sessions/${sessionId}/tasks/${currentTask.id}/complete`,
        completionData
      );
      
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
        invalidateTaskScopedCache(currentTask.id);
        await refreshCompletedRoadmapStepKeys();
        setShowCompletionModal(false);
      } else {
        toast.error(data.message || 'Failed to complete task');
      }
    } catch (err) {
      console.error('Error completing task:', err);
      toast.error('Failed to complete task');
    }
  };

  const handleSubstepCompletion = async (completionData?: TaskCompletionResult) => {
    if (completionData?.success) {
      applyCompletionFromResponse(completionData);
    }
    const taskId = expandedTaskId ?? currentTask?.id;
    if (taskId) {
      invalidateTaskScopedCache(taskId);
    }
    void refreshCompletedRoadmapStepKeys();
  };

  const handleGetServiceProviders = async () => {
    if (!activeSupportTask || contactProvidersLoading) return;

    try {
      const data = await fetchContactProviders({
        sessionId,
        taskId: activeSupportTask.id,
      }).unwrap();

      if (data.success) {
        setServiceProviders(data.service_providers ?? []);
        setShowServiceProviderModal(true);
      } else {
        toast.error(data.message || 'Failed to get service providers');
      }
    } catch (err) {
      console.error('Error getting service providers:', err);
      toast.error('Failed to get service providers');
    }
  };

  const [pendingHelpModal, setPendingHelpModal] = useState(false);

  const handleGetHelp = () => {
    if (!activeSupportTask) return;
    if (helpContent) {
      setShowHelpModal(true);
      return;
    }
    setPendingHelpModal(true);
  };

  useEffect(() => {
    if (pendingHelpModal && helpContent) {
      setShowHelpModal(true);
      setPendingHelpModal(false);
    }
  }, [pendingHelpModal, helpContent]);

  const handleUploadDocument = async (file: File): Promise<{
    filename: string;
    file_id: string;
    view_url?: string | null;
  }> => {
    if (!activeSupportTask) {
      throw new Error('No active task selected');
    }

    const document = await uploadTaskDocument({
      sessionId: sessionId!,
      taskId: activeSupportTask.id,
      file,
    }).unwrap();

    toast.success('Document uploaded successfully');
    return {
      filename: document.original_filename || file.name,
      file_id: document.file_id,
      view_url: document.view_url,
    };
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

  if (loading && !currentTask) {
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
            onClick={() => void loadImplementationData()}
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

  const displayBusinessName =
    displayBusinessNameFromApi(
      businessContext.business_name || currentTask?.business_context.business_name,
    ) || 'Not specified';
  const displayIndustry =
    businessContext.industry?.trim() || currentTask?.business_context.industry || '';
  const displayLocation =
    businessContext.location?.trim() || currentTask?.business_context.location || '';
  const currentPhaseLabel = currentTask ? getPhaseName(currentTask.phase_name) : '';

  return (
    <div className="min-h-screen min-w-0 overflow-x-hidden bg-gray-50 pb-20 sm:pb-0">
      <header className="sticky top-0 z-40 border-b border-gray-200 bg-white shadow-sm">
        <div className="h-1 bg-gradient-to-r from-indigo-600 via-teal-600 to-violet-600" aria-hidden />
        <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 sm:py-4 lg:px-8">
          {/* Mobile — logo + back, then title and progress badges */}
          <div className="lg:hidden">
            <div className="flex items-center gap-2">
              <VentureBrandMark />
              <button
                type="button"
                onClick={() => navigate(`/ventures/${sessionId}/roadmap`)}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-indigo-700"
              >
                <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden />
                Back
              </button>
            </div>
            <div className="mt-2.5 border-t border-gray-100 pt-2.5">
              <h1 className="text-lg font-bold leading-tight tracking-tight text-gray-900">
                Implementation
              </h1>
              <p className="mt-1 text-xs text-gray-500">
                Execute your roadmap step by step with Angel
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {currentPhaseLabel && (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-900">
                    {getPhaseIcon(currentTask!.phase_name)}
                    <span className="max-w-[12rem] truncate">{currentPhaseLabel}</span>
                  </span>
                )}
                <div className="flex items-center gap-2 rounded-full border border-teal-200 bg-teal-50 px-3 py-1.5">
                  <div className="relative h-9 w-9 shrink-0">
                    <svg className="h-9 w-9 -rotate-90" viewBox="0 0 36 36" aria-hidden>
                      <circle cx="18" cy="18" r="15" fill="none" className="stroke-teal-100" strokeWidth="3" />
                      <circle
                        cx="18"
                        cy="18"
                        r="15"
                        fill="none"
                        className="stroke-teal-600"
                        strokeWidth="3"
                        strokeDasharray={`${progressPercent * 0.94} 100`}
                        strokeLinecap="round"
                      />
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-teal-800">
                      {progressPercent}%
                    </span>
                  </div>
                  <span className="text-xs font-medium text-teal-900">
                    {completedMainTasks} of {totalTasks} tasks
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Desktop — brand + nav + title | phase + progress */}
          <div className="hidden lg:flex lg:items-center lg:justify-between lg:gap-8">
            <div className="flex min-w-0 flex-1 items-center gap-6">
              <VentureBrandMark />
              <button
                type="button"
                onClick={() => navigate(`/ventures/${sessionId}/roadmap`)}
                className="inline-flex shrink-0 items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-indigo-700"
              >
                <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden />
                Back to Roadmap
              </button>
              <div className="h-10 w-px shrink-0 bg-gray-200" aria-hidden />
              <div className="min-w-0">
                <h1 className="text-2xl font-bold tracking-tight text-gray-900">
                  Implementation
                </h1>
                <p className="mt-0.5 text-sm text-gray-500">
                  Execute your roadmap step by step with Angel
                </p>
              </div>
            </div>

            <div className="flex shrink-0 flex-wrap items-center justify-end gap-3">
              {currentPhaseLabel && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-900">
                  {getPhaseIcon(currentTask!.phase_name)}
                  <span className="max-w-none">{currentPhaseLabel}</span>
                </span>
              )}
              <div className="flex items-center gap-2 rounded-full border border-teal-200 bg-teal-50 px-3 py-1.5">
                <div className="relative h-9 w-9 shrink-0">
                  <svg className="h-9 w-9 -rotate-90" viewBox="0 0 36 36" aria-hidden>
                    <circle cx="18" cy="18" r="15" fill="none" className="stroke-teal-100" strokeWidth="3" />
                    <circle
                      cx="18"
                      cy="18"
                      r="15"
                      fill="none"
                      className="stroke-teal-600"
                      strokeWidth="3"
                      strokeDasharray={`${progressPercent * 0.94} 100`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-teal-800">
                    {progressPercent}%
                  </span>
                </div>
                <span className="text-xs font-medium text-teal-900">
                  {completedMainTasks} of {totalTasks} tasks
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Venture summary strip */}
      <div className="border-b border-gray-200/80 bg-gradient-to-r from-slate-50 via-white to-teal-50/40">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-6">
            <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
              <div className="mb-3 flex items-center gap-2">
                <Building2 className="h-4 w-4 text-teal-600" aria-hidden />
                <h2 className="text-sm font-bold text-gray-900">
                  {displayBusinessName !== 'Not specified' ? displayBusinessName : 'Your venture'}
                </h2>
              </div>
              {businessContextLoading ? (
                <div className="grid gap-3 sm:grid-cols-3 animate-pulse">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-14 rounded-lg bg-gray-100" />
                  ))}
                </div>
              ) : (
                <dl className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-lg border border-teal-100 bg-teal-50/50 px-3 py-2.5">
                    <dt className="text-[10px] font-semibold uppercase tracking-wide text-teal-800">Business</dt>
                    <dd className="mt-0.5 truncate text-sm font-bold text-gray-900">{displayBusinessName}</dd>
                  </div>
                  {displayIndustry ? (
                    <div className="rounded-lg border border-blue-100 bg-blue-50/50 px-3 py-2.5">
                      <dt className="text-[10px] font-semibold uppercase tracking-wide text-blue-800">Industry</dt>
                      <dd className="mt-0.5 truncate text-sm font-semibold text-gray-900">{displayIndustry}</dd>
                    </div>
                  ) : null}
                  {displayLocation ? (
                    <div className="rounded-lg border border-indigo-100 bg-indigo-50/50 px-3 py-2.5">
                      <dt className="text-[10px] font-semibold uppercase tracking-wide text-indigo-800">Location</dt>
                      <dd className="mt-0.5 truncate text-sm font-semibold text-gray-900">{displayLocation}</dd>
                    </div>
                  ) : null}
                </dl>
              )}
            </section>

            <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-indigo-600" aria-hidden />
                  <h2 className="text-sm font-bold text-gray-900">Progress</h2>
                </div>
                <span className="text-2xl font-bold text-indigo-700">{progressPercent}%</span>
              </div>
              <div className="mb-4 h-2.5 overflow-hidden rounded-full bg-gray-100">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercent}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                  className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-teal-500 to-teal-600"
                />
              </div>
              <div className="grid grid-cols-2 gap-2 text-center sm:grid-cols-4">
                <div className="rounded-lg bg-gray-50 px-2 py-2">
                  <p className="text-lg font-bold text-gray-900">{completedMainTasks}</p>
                  <p className="text-[10px] font-medium uppercase tracking-wide text-gray-500">Tasks done</p>
                </div>
                <div className="rounded-lg bg-gray-50 px-2 py-2">
                  <p className="text-lg font-bold text-gray-900">
                    {(progress as { substeps_completed?: number }).substeps_completed ??
                      completedTasks.filter((t) => t.includes('_substep_')).length}
                  </p>
                  <p className="text-[10px] font-medium uppercase tracking-wide text-gray-500">Steps done</p>
                </div>
                <div className="rounded-lg bg-gray-50 px-2 py-2">
                  <p className="text-lg font-bold text-gray-900">{progress.phases_completed ?? 0}</p>
                  <p className="text-[10px] font-medium uppercase tracking-wide text-gray-500">Phases done</p>
                </div>
                <div className="rounded-lg bg-gray-50 px-2 py-2">
                  <p className="text-lg font-bold text-gray-900">
                    {Math.max(0, totalTasks - completedMainTasks)}
                  </p>
                  <p className="text-[10px] font-medium uppercase tracking-wide text-gray-500">Remaining</p>
                </div>
              </div>
              {progress.milestone ? (
                <p className="mt-3 text-xs text-gray-600">
                  <span className="font-semibold text-gray-800">Milestone:</span> {progress.milestone}
                </p>
              ) : null}
            </section>
          </div>
        </div>
      </div>

      <div className="border-b border-gray-200 bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="-mb-px flex gap-1 overflow-x-auto overscroll-x-contain">
            <motion.button
              onClick={() => handleTabChange('implementation')}
              className={`relative py-4 px-6 font-semibold text-sm rounded-t-xl transition-all duration-300 ${
                activeTab === 'implementation'
                  ? 'text-teal-700 bg-gradient-to-b from-teal-50/50 to-white'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50/50'
              }`}
              whileHover={{ scale: 1.02, y: -1 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-center gap-2">
                <div className={`p-1.5 rounded-lg ${activeTab === 'implementation' ? 'bg-teal-100' : 'bg-gray-100'}`}>
                <Rocket className={`h-4 w-4 ${activeTab === 'implementation' ? 'text-teal-600' : 'text-gray-500'}`} />
                </div>
                <span>Implementation</span>
              </div>
              {activeTab === 'implementation' && (
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

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <AnimatePresence mode="wait">
          {activeTab === 'implementation' && mountedTabs.implementation && (
            <motion.div
              key="implementation"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="w-full space-y-6"
            >
              {loading && !taskCatalog.length ? (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-gray-200/80 bg-white py-16 shadow-sm">
                  <div className="h-12 w-12 animate-spin rounded-full border-4 border-teal-200 border-t-teal-600" />
                  <span className="mt-4 text-base font-semibold text-gray-700">Loading implementation roadmap…</span>
                </div>
              ) : taskCatalog.length > 0 ? (
                <>
                  <ImplementationRoadmapNavigator
                    phases={taskCatalog}
                    expandedTaskId={expandedTaskId}
                    nextTaskId={nextTaskId}
                    loadingTaskId={expandedPanelLoadingTaskId}
                    onSelectTask={handleSelectTask}
                    expandedPanel={
                      showPanelLoader ? (
                        <div className="flex items-center justify-center gap-2 py-12 text-gray-600">
                          <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-200 border-t-teal-600" />
                          <span className="text-sm font-medium">Loading task details…</span>
                        </div>
                      ) : panelTask ? (
                        <TaskCard
                          task={panelTask}
                          isTaskCompleted={
                            !panelTaskProgressLoading &&
                            completedTasks.includes(panelTask.id)
                          }
                          isProgressLoading={panelTaskProgressLoading}
                          onComplete={handleSubstepCompletion}
                          onSubstepFocus={(stepNumber) => {
                            const patch = (prev: ImplementationTask | null) =>
                              prev ? { ...prev, current_substep: stepNumber } : prev;
                            setOptimisticPanelTask(patch);
                            if (currentTask?.id === panelTask.id) {
                              setCurrentTask(patch);
                            }
                          }}
                          isRefreshing={isRefreshingTask && currentTask?.id === panelTask.id}
                          onGetServiceProviders={handleGetServiceProviders}
                          onGetHelp={handleGetHelp}
                          onUploadDocument={handleUploadDocument}
                          sessionId={sessionId}
                          helpContent={helpContent}
                          helpLoading={helpLoading || helpFetching}
                        />
                      ) : (
                        <p className="py-8 text-center text-sm text-gray-500">
                          Select a task above to view and complete substeps.
                        </p>
                      )
                    }
                  />

                  <div className="rounded-xl border border-gray-200/80 bg-white shadow-sm overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setShowRoadmapDocument((v) => !v)}
                      className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left hover:bg-gray-50/80 sm:px-5"
                    >
                      <div className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-teal-600 shrink-0" />
                        <span className="text-sm font-semibold text-gray-900">
                          Detailed launch roadmap document
                        </span>
                      </div>
                      <span className="text-xs font-medium text-teal-700">
                        {showRoadmapDocument ? 'Hide' : 'Show'}
                      </span>
                    </button>
                    {showRoadmapDocument ? (
                      <div className="border-t border-gray-100 px-2 pb-4 sm:px-4">
                        {roadmapLoading ? (
                          <div className="flex justify-center py-12">
                            <div className="h-10 w-10 animate-spin rounded-full border-4 border-teal-200 border-t-teal-600" />
                          </div>
                        ) : roadmapContent ? (
                          <RoadmapDisplay
                            embedded
                            businessName={displayBusinessName}
                            roadmapContent={roadmapContent}
                            onStartImplementation={() => {}}
                            onEditRoadmap={(modified) => setRoadmapContent(modified)}
                            loading={false}
                            sessionId={sessionId}
                            hideStartButton
                            completedRoadmapStepKeys={completedRoadmapStepKeys}
                          />
                        ) : (
                          <div className="py-8 text-center">
                            <p className="mb-3 text-sm text-gray-600">Roadmap document not loaded yet.</p>
                            <button
                              type="button"
                              onClick={() => void refetchRoadmap()}
                              className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700"
                            >
                              Load document
                            </button>
                          </div>
                        )}
                      </div>
                    ) : null}
                  </div>
                </>
              ) : (
                <div className="rounded-2xl border border-gray-200/80 bg-white py-12 text-center shadow-sm">
                  <p className="text-gray-600">No implementation tasks available yet.</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          {activeTab === 'budget' && mountedTabs.budget && (
            <motion.div
              key="budget"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="w-full"
            >
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
                    embeddedInParent
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
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Modals */}
      <TaskCompletionModal
        isOpen={showCompletionModal}
        onClose={() => setShowCompletionModal(false)}
        task={panelTask ?? currentTask}
        onComplete={handleTaskCompletion}
      />

      <ServiceProviderModal
        isOpen={showServiceProviderModal}
        onClose={() => setShowServiceProviderModal(false)}
        providers={serviceProviders}
        task={activeSupportTask}
      />

            <HelpModal
              isOpen={showHelpModal}
              onClose={() => setShowHelpModal(false)}
              helpContent={helpContent}
              task={activeSupportTask}
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
      {activeSupportTask &&
        activeSupportTask.phase_name &&
        !activeSupportTask.phase_name.toLowerCase().includes('gky') && (
        <FloatingComprehensiveSupport
          taskContext={activeSupportTask.title || 'general business support'}
          businessContext={businessContext}
          angelCanHelp={activeSupportTask.angel_actions || []}
          sessionId={sessionId}
          currentTask={activeSupportTask}
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