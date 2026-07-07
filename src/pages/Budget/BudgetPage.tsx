import React, { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Download, ArrowLeft, RefreshCw, Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

// Import all budget components
import StartupBudgetSummary from "@/components/Budget/StartupBudgetSummary";
import StartupCostsTable from "@/components/Budget/StartupCostsTable";
import OperatingExpensesTable from "@/components/Budget/OperatingExpensesTable";
import PayrollCostsTable from "@/components/Budget/PayrollCostsTable";
import COGSTable from "@/components/Budget/COGSTable";
import RevenueTable from "@/components/Budget/RevenueTable";
import { BudgetSummaryCards } from "@/components/Budget/BudgetSummaryCards";
import { BreakEvenAnalysis } from "@/components/Budget/BreakEvenAnalysis";
import { BudgetCharts } from "@/components/Budget/BudgetCharts";
import { formatCurrency } from "@/lib/formatters";
import { toast } from "react-toastify";
import { budgetService } from "@/services/budgetService";
import BudgetDashboard from "@/components/Budget/BudgetDashboard";
import BudgetContinueToRoadmapCta from "@/components/Budget/BudgetContinueToRoadmapCta";
import DocumentExportModal from "@/components/DocumentExportModal";
import VentureBrandMark from "@/components/layout/VentureBrandMark";
import type { BudgetExportActions } from "@/components/Budget/budgetExportActions";
import httpClient from "@/api/httpClient";

import type { Budget, BudgetItem, RevenueStream } from "@/types/apiTypes";
import { useBusinessContext } from "@/hooks/useBusinessContext";
import {
  isBudgetSetupPhase,
  isRoadmapReadyPhase,
  resolveSessionPhase,
} from "@/utils/budgetPageMode";

/** Pre-populate expense line items from the business plan when the budget has none yet. */
async function prepopulateExpenseItemsFromPlan(
  sessionId: string,
  currentBudget: Budget,
): Promise<Budget> {
  const existingExpenses = currentBudget.items
    ? currentBudget.items.filter((i: BudgetItem) => i.category === "expense")
    : [];
  if (existingExpenses.length > 0) {
    return currentBudget;
  }

  try {
    const estimates = await budgetService.generateEstimatedExpenses(sessionId);

    if (estimates.success && estimates.result && estimates.result.length > 0) {
      const updatedBudget = {
        ...currentBudget,
        items: [...(currentBudget.items || []), ...estimates.result],
      };

      const saved = await budgetService.saveBudget(sessionId, updatedBudget);
      if (saved.success) {
        return saved.result;
      }
    }
  } catch (err) {
    console.error("Failed to pre-populate budget items:", err);
  }

  return currentBudget;
}

const BudgetPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const fromTransitionNav =
    (location.state as { fromTransition?: boolean } | null)?.fromTransition ===
    true;
  const [sessionPhase, setSessionPhase] = useState<string | null>(null);
  const [budget, setBudget] = useState<Budget | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [transitioning, setTransitioning] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const budgetExportsRef = useRef<BudgetExportActions | null>(null);
  const { context: businessContext } = useBusinessContext(id);
  const businessType = businessContext.business_type;
  // Guards fetchBudget (and its AI pre-population call) against firing twice
  // for the same session — e.g. React StrictMode's dev-mode double-invoke of
  // effects, or a fast remount before the first call's save lands. Without
  // this, two concurrent calls can each see zero existing items and both
  // generate + save a full AI batch, duplicating every startup cost, revenue
  // stream, and operating expense line. Mirrors the same fix already used
  // for revenue-stream loading (see revenueLoadedRef in BudgetDashboard).
  const budgetLoadedForSessionRef = useRef<string | null>(null);

  useEffect(() => {
    if (id && budgetLoadedForSessionRef.current !== id) {
      budgetLoadedForSessionRef.current = id;
      fetchBudget();
    }
  }, [id]);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    (async () => {
      try {
        const { data } = await httpClient.get<{
          result?: { progress?: { phase?: string }; current_phase?: string };
        }>(`/angel/sessions/${id}`);
        if (cancelled) return;
        setSessionPhase(resolveSessionPhase(data?.result ?? null));
      } catch {
        /* non-fatal: nav state still drives setup mode when present */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const isBudgetSetupFlow =
    fromTransitionNav || isBudgetSetupPhase(sessionPhase);
  const roadmapAlreadyReady = isRoadmapReadyPhase(sessionPhase);

  /** Lock page scroll while roadmap transition runs — loader stays centered in viewport. */
  useEffect(() => {
    if (!isBudgetSetupFlow || !transitioning) return;

    const scrollY = window.scrollY;
    const { overflow, position, top, width, paddingRight } =
      document.body.style;
    const scrollbarWidth =
      window.innerWidth - document.documentElement.clientWidth;

    document.body.style.overflow = "hidden";
    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = "100%";
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    return () => {
      document.body.style.overflow = overflow;
      document.body.style.position = position;
      document.body.style.top = top;
      document.body.style.width = width;
      document.body.style.paddingRight = paddingRight;
      window.scrollTo(0, scrollY);
    };
  }, [isBudgetSetupFlow, transitioning]);

  const fetchBudget = async () => {
    try {
      setLoading(true);
      const response = await budgetService.getBudget(id!);
      if (response.success) {
        let currentBudget = response.result;
        currentBudget = await prepopulateExpenseItemsFromPlan(
          id!,
          currentBudget,
        );
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
          currentBudget = await prepopulateExpenseItemsFromPlan(
            id!,
            currentBudget,
          );
          setBudget(currentBudget);
        } else {
          toast.error(created.message || "Failed to initialize budget");
          setBudget(null);
        }
      }
    } catch (error) {
      console.error("Error fetching budget:", error);
      toast.error("Failed to load budget");

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
    if (!budget || transitioning) return;

    try {
      setSaving(true);
      const response = await budgetService.saveBudget(id!, budget);
      if (response.success) {
        setBudget(response.result);
        toast.success("Budget saved successfully");
      } else {
        toast.error("Failed to save budget");
      }
    } catch (error) {
      console.error("Error saving budget:", error);
      toast.error("Failed to save budget");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateBudget = (updates: Partial<Budget>) => {
    if (!budget || transitioning) return;

    const updatedBudget = {
      ...budget,
      ...updates,
      updated_at: new Date().toISOString(),
    };

    // Recalculate totals
    const expenses = updatedBudget.items.filter(
      (item) => item.category === "expense",
    );
    const revenues = updatedBudget.items.filter(
      (item) => item.category === "revenue",
    );

    updatedBudget.total_estimated_expenses = expenses.reduce(
      (sum, item) => sum + item.estimated_amount,
      0,
    );
    updatedBudget.total_estimated_revenue = revenues.reduce(
      (sum, item) => sum + item.estimated_amount,
      0,
    );
    updatedBudget.total_actual_expenses = expenses.reduce(
      (sum, item) => sum + (item.actual_amount || 0),
      0,
    );
    updatedBudget.total_actual_revenue = revenues.reduce(
      (sum, item) => sum + (item.actual_amount || 0),
      0,
    );

    setBudget(updatedBudget);
  };

  const handleUpdateItem = async (
    itemId: string,
    updates: Partial<BudgetItem>,
  ) => {
    if (!id || transitioning) return;
    try {
      const response = await budgetService.updateBudgetItem(
        id,
        itemId,
        updates,
      );
      if (response.success) {
        setBudget(response.result);
      } else {
        toast.error(response.message || "Failed to update item");
      }
    } catch (error) {
      console.error("Error updating budget item:", error);
      toast.error("Failed to update item");
    }
  };

  const handleRegisterBudgetExports = useCallback(
    (actions: BudgetExportActions) => {
      budgetExportsRef.current = actions;
    },
    [],
  );

  const handleDeleteItem = async (itemId: string) => {
    if (!id || transitioning) return;
    try {
      const response = await budgetService.deleteBudgetItem(id, itemId);
      if (response.success) {
        setBudget(response.result);
      } else {
        toast.error(response.message || "Failed to delete item");
      }
    } catch (error) {
      console.error("Error deleting budget item:", error);
      toast.error("Failed to delete item");
    }
  };

  const handleContinueToRoadmap = async () => {
    if (!id || transitioning) return;
    setTransitioning(true);
    try {
      if (budget) {
        await budgetService.saveBudget(id, budget);
      }
      if (roadmapAlreadyReady) {
        navigate(`/ventures/${id}/roadmap`);
        return;
      }
      const response = await httpClient.post(
        `/angel/sessions/${id}/transition-decision`,
        {
          decision: "approve",
          transition_type: "budget_to_roadmap",
        },
      );
      const data = response.data as {
        success?: boolean;
        message?: string;
        requires_subscription?: boolean;
      };
      if (data.success) {
        navigate(`/ventures/${id}/roadmap`);
      } else if (data.requires_subscription) {
        toast.error(
          data.message || "Subscription required to proceed to Roadmap phase",
        );
      } else {
        toast.error(
          data.message || "Failed to proceed to roadmap. Please try again.",
        );
      }
    } catch (error) {
      console.error("Failed to proceed to roadmap:", error);
      toast.error("Failed to proceed to roadmap. Please try again.");
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
            <Button
              onClick={() => navigate(`/ventures/${id}`)}
              className="mt-4"
            >
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
              <div className="flex min-w-0 items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={transitioning}
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
                <VentureBrandMark />
              </div>
              <Button
                variant="outline"
                size="sm"
                disabled={transitioning}
                onClick={() => setShowExportModal(true)}
                className="h-9 shrink-0 gap-1.5 px-3"
              >
                <Download className="h-4 w-4 shrink-0" />
                Download
              </Button>
            </div>
            <div className="mt-2.5 border-t border-gray-100 pt-2.5">
              <h1 className="text-lg font-bold leading-tight tracking-tight text-gray-900">
                {isBudgetSetupFlow ? "Budget Setup" : "Budget Tracking"}
              </h1>
              <p className="mt-1 text-xs leading-relaxed text-gray-500">
                {isBudgetSetupFlow
                  ? "Set up your startup budget, then continue to your roadmap"
                  : "Manage your business finances"}
              </p>
            </div>
          </div>

          {/* Desktop */}
          <div className="hidden md:flex md:flex-row md:items-center md:justify-between md:gap-6">
            <div className="flex min-w-0 items-center gap-6">
              <Button
                variant="ghost"
                disabled={transitioning}
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
              <VentureBrandMark />
              <div className="h-10 w-px shrink-0 bg-gray-200" aria-hidden />
              <div className="min-w-0">
                <h1 className="text-2xl font-bold tracking-tight text-gray-900">
                  {isBudgetSetupFlow ? "Budget Setup" : "Budget Tracking"}
                </h1>
                <p className="mt-0.5 text-sm text-gray-500">
                  {isBudgetSetupFlow
                    ? "Set up your startup budget, then continue to your roadmap"
                    : "Manage your business finances"}
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              disabled={transitioning}
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
        className={`relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8 min-w-0 ${
          isBudgetSetupFlow ? "pb-4 md:pb-28" : "pb-20 md:pb-24"
        }`}
        {...(transitioning ? { inert: true } : {})}
        aria-busy={transitioning}
      >
        <BudgetDashboard
          budget={budget}
          onUpdateBudget={handleUpdateBudget}
          onUpdateItem={handleUpdateItem}
          onDeleteItem={handleDeleteItem}
          businessType={businessType}
          sessionId={id!}
          businessContext={businessContext}
          embeddedInSetup={isBudgetSetupFlow}
          interactionLocked={transitioning}
          onRegisterExportActions={handleRegisterBudgetExports}
        />
      </div>

      {/* Budget setup actions: in page flow on mobile (no overlap); fixed bar on desktop */}
      {isBudgetSetupFlow && (
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
                  <span className="truncate">
                    {saving ? "Saving…" : "Save Inputs"}
                  </span>
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
                  {saving ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  {saving ? "Saving..." : "Save Inputs"}
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

      {isBudgetSetupFlow &&
        transitioning &&
        createPortal(
          <div
            className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/20 backdrop-blur-[2px] p-4 pointer-events-auto"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="budget-roadmap-loader-title"
            aria-describedby="budget-roadmap-loader-desc"
          >
            <div
              className="flex w-full max-w-md flex-col items-center rounded-2xl border border-violet-100 bg-white px-8 py-10 text-center shadow-2xl"
              role="status"
              aria-live="polite"
            >
              <Loader2
                className="h-11 w-11 animate-spin text-violet-600"
                aria-hidden
              />
              <p
                id="budget-roadmap-loader-title"
                className="mt-5 text-lg font-semibold text-gray-900"
              >
                Building your roadmap…
              </p>
              <p
                id="budget-roadmap-loader-desc"
                className="mt-2 text-sm leading-relaxed text-gray-500"
              >
                Saving your budget and preparing your launch roadmap. Please
                wait this only takes a moment.
              </p>
            </div>
          </div>,
          document.body,
        )}

      <DocumentExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        documentTitle="Budget Setup"
        documentType="budget"
        showSuccessToast={false}
        onExportPdf={async () => {
          if (!budgetExportsRef.current) {
            toast.error("Budget is still loading. Please try again.");
            return;
          }
          await budgetExportsRef.current.exportPdf();
        }}
        onExportExcel={async () => {
          if (!budgetExportsRef.current) {
            toast.error("Budget is still loading. Please try again.");
            return;
          }
          await budgetExportsRef.current.exportExcel();
        }}
        onExportDocx={async () => {
          if (!budgetExportsRef.current) {
            toast.error("Budget is still loading. Please try again.");
            return;
          }
          await budgetExportsRef.current.exportDocx();
        }}
      />
    </motion.div>
  );
};

export default BudgetPage;
