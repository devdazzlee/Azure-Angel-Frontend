import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Download, ArrowLeft, RefreshCw, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';

// Import all budget components
import StartupBudgetSummary from '@/components/Budget/StartupBudgetSummary';
import StartupCostsTable from '@/components/Budget/StartupCostsTable';
import OperatingExpensesTable from '@/components/Budget/OperatingExpensesTable';
import PayrollCostsTable from '@/components/Budget/PayrollCostsTable';
import COGSTable from '@/components/Budget/COGSTable';
import RevenueTable from '@/components/Budget/RevenueTable';
import { BudgetSummaryCards } from '@/components/Budget/BudgetSummaryCards';
import { BreakEvenAnalysis } from '@/components/Budget/BreakEvenAnalysis';
import { BudgetCharts } from '@/components/Budget/BudgetCharts';
import { formatCurrency } from '@/lib/formatters';
import { toast } from 'react-toastify';
import { budgetService } from '@/services/budgetService';
import BudgetDashboard from '@/components/Budget/BudgetDashboard';
import BudgetContinueToRoadmapCta from '@/components/Budget/BudgetContinueToRoadmapCta';
import DocumentExportModal from '@/components/DocumentExportModal';
import type { BudgetExportActions } from '@/components/Budget/budgetExportActions';
import httpClient from '@/api/httpClient';

import type { Budget, BudgetItem, RevenueStream } from '@/types/apiTypes';
import { useBusinessContext } from '@/hooks/useBusinessContext';

/** Stable IDs so duplicate effect runs (e.g. React Strict Mode) do not stack the same toast. */
const TOAST_BUDGET_ANALYZING = 'budget-prepop-analyzing-from-plan';
const TOAST_BUDGET_GENERATED = 'budget-prepop-generated-from-plan';

async function prepopulateExpenseItemsFromPlan(sessionId: string, currentBudget: Budget): Promise<Budget> {
  const existingExpenses = currentBudget.items
    ? currentBudget.items.filter((i: BudgetItem) => i.category === 'expense')
    : [];
  if (existingExpenses.length > 0) {
    return currentBudget;
  }

  try {
    toast.info('Analyzing business plan to generate your budget...', {
      toastId: TOAST_BUDGET_ANALYZING,
      autoClose: 3000,
    });
    const estimates = await budgetService.generateEstimatedExpenses(sessionId);

    if (estimates.success && estimates.result && estimates.result.length > 0) {
      const updatedBudget = {
        ...currentBudget,
        items: [...(currentBudget.items || []), ...estimates.result],
      };

      const saved = await budgetService.saveBudget(sessionId, updatedBudget);
      if (saved.success) {
        toast.success('Budget items generated from your business plan!', {
          toastId: TOAST_BUDGET_GENERATED,
        });
        return saved.result;
      }
    }
  } catch (err) {
    console.error('Failed to pre-populate budget items:', err);
  }

  return currentBudget;
}

const BudgetPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const fromTransition = (location.state as any)?.fromTransition === true;
  const [budget, setBudget] = useState<Budget | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [transitioning, setTransitioning] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const budgetExportsRef = useRef<BudgetExportActions | null>(null);
  const { context: businessContext } = useBusinessContext(id);
  const businessType = businessContext.business_type;

  useEffect(() => {
    if (id) {
      fetchBudget();
    }
  }, [id]);

  const fetchBudget = async () => {
    try {
      setLoading(true);
      const response = await budgetService.getBudget(id!);
      if (response.success) {
        let currentBudget = response.result;
        currentBudget = await prepopulateExpenseItemsFromPlan(id!, currentBudget);
        setBudget(currentBudget);
      } else {
        // If no budget exists, create an empty one via API so the UI stays API-driven
        const created = await budgetService.saveBudget(id!, {
          session_id: id!,
          initial_investment: 0,
          total_estimated_expenses: 0,
          total_estimated_revenue: 0,
          items: [],
        });
        if (created.success) {
          let currentBudget = created.result;
          currentBudget = await prepopulateExpenseItemsFromPlan(id!, currentBudget);
          setBudget(currentBudget);
        } else {
          toast.error(created.message || 'Failed to initialize budget');
          setBudget(null);
        }
      }
    } catch (error) {
      console.error('Error fetching budget:', error);
      toast.error('Failed to load budget');

      try {
        const created = await budgetService.saveBudget(id!, {
          session_id: id!,
          initial_investment: 0,
          total_estimated_expenses: 0,
          total_estimated_revenue: 0,
          items: [],
        });
        if (created.success) {
          setBudget(created.result);
        } else {
          setBudget(null);
        }
      } catch {
        setBudget(null);
      }
    } finally {
      setLoading(false);
    }
  };

  const saveBudget = async () => {
    if (!budget) return;
    
    try {
      setSaving(true);
      const response = await budgetService.saveBudget(id!, budget);
      if (response.success) {
        setBudget(response.result);
        toast.success('Budget saved successfully');
      } else {
        toast.error('Failed to save budget');
      }
    } catch (error) {
      console.error('Error saving budget:', error);
      toast.error('Failed to save budget');
    } finally {
      setSaving(false);
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

  const handleUpdateItem = async (itemId: string, updates: Partial<BudgetItem>) => {
    if (!id) return;
    try {
      const response = await budgetService.updateBudgetItem(id, itemId, updates);
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

  const handleRegisterBudgetExports = useCallback((actions: BudgetExportActions) => {
    budgetExportsRef.current = actions;
  }, []);

  const handleDeleteItem = async (itemId: string) => {
    if (!id) return;
    try {
      const response = await budgetService.deleteBudgetItem(id, itemId);
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

  const handleContinueToRoadmap = async () => {
    if (!id || transitioning) return;
    setTransitioning(true);
    try {
      if (budget) {
        await budgetService.saveBudget(id, budget);
      }
      const response = await httpClient.post(`/angel/sessions/${id}/transition-decision`, {
        decision: 'approve',
        transition_type: 'budget_to_roadmap',
      });
      const data = response.data as { success?: boolean; message?: string; requires_subscription?: boolean };
      if (data.success) {
        navigate(`/ventures/${id}/roadmap`);
      } else if (data.requires_subscription) {
        toast.error(data.message || 'Subscription required to proceed to Roadmap phase');
      } else {
        toast.error(data.message || 'Failed to proceed to roadmap. Please try again.');
      }
    } catch (error) {
      console.error('Failed to proceed to roadmap:', error);
      toast.error('Failed to proceed to roadmap. Please try again.');
    } finally {
      setTransitioning(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading budget...</p>
        </div>
      </div>
    );
  }

  if (!budget) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card>
          <CardContent className="p-6">
            <p className="text-gray-600">Budget not found</p>
            <Button onClick={() => navigate(`/ventures/${id}`)} className="mt-4">
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen min-w-0 overflow-x-hidden bg-gray-50"
    >
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-gray-200 bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 md:py-4 lg:px-8">
          {/* Mobile: toolbar row + title block */}
          <div className="md:hidden">
            <div className="flex items-center justify-between gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  navigate(`/ventures/${id}`, {
                    state: {
                      restorePlanSummaryOverview: true,
                      preferVentureChat: true,
                    },
                  })
                }
                className="-ml-2 h-9 shrink-0 gap-1.5 px-2 text-gray-600"
              >
                <ArrowLeft className="h-4 w-4 shrink-0" />
                Back
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowExportModal(true)}
                className="h-9 shrink-0 gap-1.5 px-3"
              >
                <Download className="h-4 w-4 shrink-0" />
                Download
              </Button>
            </div>
            <div className="mt-2.5 border-t border-gray-100 pt-2.5">
              <h1 className="text-lg font-bold leading-tight tracking-tight text-gray-900">
                {fromTransition ? 'Budget Setup' : 'Budget Tracking'}
              </h1>
              <p className="mt-1 text-xs leading-relaxed text-gray-500">
                {fromTransition
                  ? 'Set up your startup budget, then continue to your roadmap'
                  : 'Manage your business finances'}
              </p>
            </div>
          </div>

          {/* Desktop */}
          <div className="hidden md:flex md:flex-row md:items-center md:justify-between md:gap-6">
            <div className="flex min-w-0 items-center gap-6">
              <Button
                variant="ghost"
                onClick={() =>
                  navigate(`/ventures/${id}`, {
                    state: {
                      restorePlanSummaryOverview: true,
                      preferVentureChat: true,
                    },
                  })
                }
                className="shrink-0 gap-2 text-gray-500 hover:text-gray-900"
              >
                <ArrowLeft className="h-4 w-4 shrink-0" />
                Back to Summary Overview
              </Button>
              <div className="h-10 w-px shrink-0 bg-gray-200" aria-hidden />
              <div className="min-w-0">
                <h1 className="text-2xl font-bold tracking-tight text-gray-900">
                  {fromTransition ? 'Budget Setup' : 'Budget Tracking'}
                </h1>
                <p className="mt-0.5 text-sm text-gray-500">
                  {fromTransition
                    ? 'Set up your startup budget, then continue to your roadmap'
                    : 'Manage your business finances'}
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowExportModal(true)}
              className="shrink-0 gap-2"
            >
              <Download className="h-4 w-4" />
              Download
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content — extra bottom pad only on desktop where footer is fixed */}
      <div
        className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8 min-w-0 ${
          fromTransition ? 'pb-4 md:pb-28' : 'pb-20 md:pb-24'
        }`}
      >
        <BudgetDashboard
          budget={budget}
          onUpdateBudget={handleUpdateBudget}
          onUpdateItem={handleUpdateItem}
          onDeleteItem={handleDeleteItem}
          businessType={businessType}
          sessionId={id!}
          businessContext={businessContext}
          showRoadmapFab={!fromTransition}
          embeddedInSetup={fromTransition}
          onRegisterExportActions={handleRegisterBudgetExports}
        />
      </div>

      {/* Budget setup actions: in page flow on mobile (no overlap); fixed bar on desktop */}
      {fromTransition && (
        <footer
          className="relative z-30 mt-4 border-t border-gray-200 bg-white mb-[max(0.75rem,env(safe-area-inset-bottom,0px))] md:fixed md:bottom-0 md:left-0 md:right-0 md:mt-0 md:mb-0 md:shadow-[0_-4px_24px_rgba(0,0,0,0.08)] md:backdrop-blur-sm md:bg-white/95 md:pb-0"
          aria-label="Budget setup actions"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 md:py-4">
            {/* Mobile: compact 2-row layout — scrolls with content, does not cover fields */}
            <div className="flex flex-col gap-2 md:hidden">
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(`/ventures/${id}`)}
                  disabled={transitioning}
                  className="h-9 gap-1.5 px-2 text-xs"
                >
                  <ArrowLeft className="h-3.5 w-3.5 shrink-0" />
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={saveBudget}
                  disabled={saving || transitioning}
                  variant="outline"
                  className="h-9 gap-1.5 px-2 text-xs"
                >
                  {saving ? (
                    <RefreshCw className="h-3.5 w-3.5 shrink-0 animate-spin" />
                  ) : (
                    <Save className="h-3.5 w-3.5 shrink-0" />
                  )}
                  <span className="truncate">{saving ? 'Saving…' : 'Save setup'}</span>
                </Button>
              </div>
              <BudgetContinueToRoadmapCta
                variant="header"
                onClick={handleContinueToRoadmap}
                isLoading={transitioning}
                className="h-10 w-full justify-center rounded-lg text-sm"
                mobileLabel="full"
              />
            </div>

            {/* Desktop: original horizontal layout */}
            <div className="hidden md:flex md:flex-row md:items-center md:justify-between md:gap-4">
              <Button
                variant="outline"
                onClick={() => navigate(`/ventures/${id}`)}
                disabled={transitioning}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Cancel
              </Button>
              <div className="flex items-center gap-3">
                <Button
                  onClick={saveBudget}
                  disabled={saving || transitioning}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {saving ? 'Saving...' : 'Complete Budget Setup'}
                </Button>
                <BudgetContinueToRoadmapCta
                  variant="header"
                  onClick={handleContinueToRoadmap}
                  isLoading={transitioning}
                  className="justify-center"
                />
              </div>
            </div>
          </div>
        </footer>
      )}

      {fromTransition && transitioning && (
        <div
          className="fixed inset-0 z-[25] bg-slate-900/15 backdrop-blur-[1px] pointer-events-none"
          aria-hidden
        />
      )}

      <DocumentExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        documentTitle="Budget Setup"
        documentType="budget"
        showSuccessToast={false}
        onExportPdf={async () => {
          if (!budgetExportsRef.current) {
            toast.error('Budget is still loading. Please try again.');
            return;
          }
          await budgetExportsRef.current.exportPdf();
        }}
        onExportExcel={async () => {
          if (!budgetExportsRef.current) {
            toast.error('Budget is still loading. Please try again.');
            return;
          }
          await budgetExportsRef.current.exportExcel();
        }}
        onExportDocx={async () => {
          if (!budgetExportsRef.current) {
            toast.error('Budget is still loading. Please try again.');
            return;
          }
          await budgetExportsRef.current.exportDocx();
        }}
      />
    </motion.div>
  );
};

export default BudgetPage;
