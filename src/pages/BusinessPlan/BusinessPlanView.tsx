import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { toast } from 'react-toastify';
import DocumentExportModal from '../../components/DocumentExportModal';
import PaymentForm from '../../components/PaymentForm';
import { PRICING, checkPaymentStatus, markAsPaid } from '../../config/pricing';
import { checkIsFreeIntroPeriod } from '../../utils/freeIntroPeriod';
import { useAppDispatch, useAppSelector } from '../../store';
import { upsertTransitionSession } from '../../store/businessPlanTransitionSlice';
import httpClient from '../../api/httpClient';
import { Tooltip, TooltipContent, TooltipTrigger } from '../../components/ui/tooltip';
import { responsiveMarkdownTableComponents } from '../../components/ResponsiveMarkdownTable';
import BusinessPlanModificationModal from '../../components/BusinessPlanModificationModal';
import VentureBrandMark from '../../components/layout/VentureBrandMark';

interface LocationState {
  businessPlan?: string;
  businessPlanSummary?: string;
  sessionId?: string;
  /** When set (e.g. from budget), open the summary tab first. */
  initialView?: 'summary' | 'full';
  /** When `budget`, back navigation returns to budget instead of venture chat. */
  backTarget?: 'budget' | 'chat';
  /** Opened from post-summary flow — show forward nav to budgeting instead of back. */
  postSummaryFlow?: boolean;
}

const BUDGET_FORWARD_PHASES = new Set([
  'PLAN_TO_SUMMARY_TRANSITION',
  'PLAN_TO_BUDGET_TRANSITION',
  'BUDGET',
]);

const BP_SESSION_CACHE_PREFIX = 'angel_bp_transition_';

function readBpSessionCache(sessionId: string | undefined): {
  artifact?: string;
  summary?: string;
} {
  if (!sessionId || typeof window === 'undefined') return {};
  try {
    const raw = sessionStorage.getItem(`${BP_SESSION_CACHE_PREFIX}${sessionId}`);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as { artifact?: string | null; summary?: string | null };
    return {
      artifact: parsed.artifact ?? undefined,
      summary: parsed.summary ?? undefined,
    };
  } catch {
    return {};
  }
}

function writeBpSessionCache(
  sessionId: string | undefined,
  artifact: string,
  summary: string
) {
  if (!sessionId || typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(
      `${BP_SESSION_CACHE_PREFIX}${sessionId}`,
      JSON.stringify({
        artifact: artifact || null,
        summary: summary || null,
      })
    );
  } catch {
    /* quota or private mode */
  }
}

const BusinessPlanView: React.FC = () => {
  const { id: sessionId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const locationState = (location.state as LocationState) || {};
  const backTarget = locationState.backTarget === 'budget' ? 'budget' : 'chat';
  const backLabel =
    backTarget === 'budget' ? 'Back to Budget' : 'Back to Venture';
  const dispatch = useAppDispatch();
  const normalizedSessionId = sessionId ?? 'anonymous';
  const cachedTransition = useAppSelector(
    (state) => state.businessPlanTransition.bySessionId[normalizedSessionId]
  );
  const contentRef = useRef<HTMLDivElement>(null);
  const documentEndRef = useRef<HTMLDivElement>(null);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const sessionCache = useMemo(() => readBpSessionCache(sessionId), [sessionId]);

  // Initialize from navigation state, Redux (in-memory), then sessionStorage (survives refresh)
  const [businessPlan, setBusinessPlan] = useState<string>(
    () =>
      locationState?.businessPlan ||
      cachedTransition?.artifact ||
      sessionCache.artifact ||
      ''
  );
  const [businessPlanSummary, setBusinessPlanSummary] = useState<string>(
    () =>
      locationState?.businessPlanSummary ||
      cachedTransition?.summary ||
      sessionCache.summary ||
      ''
  );
  const [loading, setLoading] = useState(() => {
    const hasPlan = !!(
      locationState?.businessPlan ||
      cachedTransition?.artifact ||
      sessionCache.artifact
    );
    const hasSummary = !!(
      locationState?.businessPlanSummary ||
      cachedTransition?.summary ||
      sessionCache.summary
    );
    return !(hasPlan || hasSummary);
  });
  const [viewMode, setViewMode] = useState<'summary' | 'full'>(() => {
    const iv = locationState.initialView;
    if (iv === 'summary' || iv === 'full') return iv;
    return 'full';
  });
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [hasPaid, setHasPaid] = useState(false); // Track payment status
  const [checkingSubscription, setCheckingSubscription] = useState(true);
  const [roadmapAvailable, setRoadmapAvailable] = useState(false);
  const [sessionPhase, setSessionPhase] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [showModificationModal, setShowModificationModal] = useState(false);

  const showBudgetForwardNav =
    backTarget !== 'budget' &&
    !roadmapAvailable &&
    (locationState.postSummaryFlow === true ||
      (sessionPhase ? BUDGET_FORWARD_PHASES.has(sessionPhase) : false));

  useEffect(() => {
    if (cachedTransition?.artifact && !businessPlan) {
      setBusinessPlan(cachedTransition.artifact);
    }
    if (cachedTransition?.summary && !businessPlanSummary) {
      setBusinessPlanSummary(cachedTransition.summary);
    }
    if (cachedTransition?.artifact || cachedTransition?.summary) {
      setLoading(false);
    }
  }, [businessPlan, businessPlanSummary, cachedTransition]);

  useEffect(() => {
    if (businessPlan || businessPlanSummary) {
      dispatch(upsertTransitionSession({
        sessionId: normalizedSessionId,
        artifact: businessPlan || undefined,
        summary: businessPlanSummary || undefined,
      }));
      writeBpSessionCache(sessionId, businessPlan, businessPlanSummary);
    }
  }, [businessPlan, businessPlanSummary, dispatch, normalizedSessionId, sessionId]);

  const generatedDateLabel = useMemo(
    () =>
      new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      }),
    [],
  );

  useEffect(() => {
    const target = documentEndRef.current;
    if (!target || loading) {
      setShowScrollToBottom(false);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => setShowScrollToBottom(!entry.isIntersecting),
      { threshold: 0, rootMargin: '0px 0px -72px 0px' },
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, [loading, businessPlan, businessPlanSummary, viewMode]);

  const scrollToDocumentEnd = () => {
    documentEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  };

  // Check subscription status from backend on mount
  useEffect(() => {
    const checkSubscriptionStatus = async () => {
      // 🆓 FREE INTRO PERIOD LOGIC
      if (checkIsFreeIntroPeriod()) {
        console.log('🎉 Free intro period active - granting premium access');
        setHasPaid(true);
        setCheckingSubscription(false);
        return;
      }

      try {
        const { data } = await httpClient.get<any>('/stripe/check-subscription-status');
        if (data.success && data.has_active_subscription && !data.payment_failed) {
          setHasPaid(true);
          console.log('✅ User has active subscription - download access granted');
        } else {
          setHasPaid(false);
          if (data.payment_failed) {
            console.log('⚠️ Payment failed - premium features disabled');
            toast.warning('Payment failed. Please update your payment method to restore premium access.');
          } else {
            console.log('ℹ️ No active subscription found');
          }
        }
      } catch (error) {
        console.error('Failed to check subscription status:', error);
        setHasPaid(false);
      } finally {
        setCheckingSubscription(false);
      }
    };

    checkSubscriptionStatus();
  }, []);

  useEffect(() => {
    const hasPassed =
      !!(locationState?.businessPlan || locationState?.businessPlanSummary);
    const hasRedux = !!(cachedTransition?.artifact || cachedTransition?.summary);
    const hasCache = !!(sessionCache.artifact || sessionCache.summary);
    if (hasPassed || hasRedux || hasCache) {
      return;
    }
    fetchBusinessPlan();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  // Poll only while we still have no summary and no artifact (not "full plan only" forever)
  useEffect(() => {
    if (!businessPlan && !businessPlanSummary && loading && sessionId) {
      console.log('📊 Polling for business plan content...');
      
      const pollInterval = setInterval(() => {
        fetchBusinessPlan();
      }, 3000); // Check every 3 seconds
      
      const timeout = setTimeout(() => {
        clearInterval(pollInterval);
        setLoading(false);
        toast.error('Business plan generation timed out. Please try again.');
        console.log('⏱️ Polling timeout reached');
      }, 90000); // 90 second timeout
      
      return () => {
        clearInterval(pollInterval);
        clearTimeout(timeout);
      };
    }
  }, [businessPlan, businessPlanSummary, loading, sessionId]);

  const fetchBusinessPlan = async () => {
    if (!sessionId) {
      console.error('No session ID provided');
      toast.error('Invalid session ID');
      setLoading(false);
      return;
    }

    try {
      console.log('Fetching business plan for session:', sessionId);

      const { data } = await httpClient.get<any>(`/angel/sessions/${sessionId}`);
      
      if (data.success && data.result) {
        const session = data.result;
        console.log('Session data received:', {
          hasArtifact: !!session.business_plan_artifact,
          hasSummary: !!session.business_plan_summary,
          artifactLength: session.business_plan_artifact?.length || 0,
          summaryLength: session.business_plan_summary?.length || 0,
          hasRoadmap: !!session.roadmap_data
        });
        
        // Update state if we have data (summary alone is valid — paid "full" artifact is optional)
        if (session.business_plan_artifact) {
          setBusinessPlan(session.business_plan_artifact);
          dispatch(upsertTransitionSession({
            sessionId: normalizedSessionId,
            artifact: session.business_plan_artifact,
          }));
          console.log('✅ Business plan artifact loaded!');
        }
        if (session.business_plan_summary) {
          setBusinessPlanSummary(session.business_plan_summary);
          dispatch(upsertTransitionSession({
            sessionId: normalizedSessionId,
            summary: session.business_plan_summary,
          }));
          console.log('✅ Business plan summary loaded!');
        }

        if (session.business_plan_artifact || session.business_plan_summary) {
          setLoading(false);
        }
        
        if (session.current_phase) {
          setSessionPhase(String(session.current_phase).toUpperCase());
        }

        // Check if roadmap is available
        if (session.roadmap_data) {
          setRoadmapAvailable(true);
          console.log('✅ Roadmap is available!');
        }
        
        if (!session.business_plan_artifact && !session.business_plan_summary) {
          console.log('⏳ No plan content on session yet, will retry if polling...');
        }
      } else {
        toast.error(data.message || 'Failed to load business plan');
        setLoading(false);
      }
    } catch (error) {
      console.error('Failed to fetch business plan:', error);
      toast.error('Failed to load business plan');
      setLoading(false);
    }
  };

  const handleDownload = () => {
    // Download is now free - no payment required
    // Payment is required only when generating the business plan, not for downloading
    setShowExportModal(true);
  };

  const handlePaymentSuccess = async () => {
    setShowPaymentModal(false);
    
    // Show loading toast while checking subscription
    const loadingToast = toast.loading('Verifying your subscription...');
    
    // Poll for subscription status (webhooks can take a few seconds)
    let attempts = 0;
    const maxAttempts = 10; // Try for up to 20 seconds (10 attempts * 2 seconds)
    
    const checkSubscription = async (): Promise<boolean> => {
      try {
        const { data } = await httpClient.get<any>('/stripe/check-subscription-status');
        console.log('Subscription check response:', data);
        
        if (data.success && data.has_active_subscription && !data.payment_failed) {
          setHasPaid(true);
          toast.dismiss(loadingToast);
          toast.success('Payment successful! You can now download your Business Plan.');
          setShowExportModal(true);
          return true;
        }
        
        if (data.payment_failed) {
          toast.dismiss(loadingToast);
          toast.error('Payment failed. Please update your payment method in your profile.');
          return false;
        }
        
        return false;
      } catch (error) {
        console.error('Failed to verify subscription after payment:', error);
        return false;
      }
    };
    
    // Try immediately first
    const immediateSuccess = await checkSubscription();
    if (immediateSuccess) return;
    
    // Poll every 2 seconds if not immediately successful
    const pollInterval = setInterval(async () => {
      attempts++;
      console.log(`Polling for subscription status (attempt ${attempts}/${maxAttempts})...`);
      
      const success = await checkSubscription();
      
      if (success) {
        clearInterval(pollInterval);
      } else if (attempts >= maxAttempts) {
        clearInterval(pollInterval);
        toast.dismiss(loadingToast);
        toast.warning('Payment is processing. Please refresh the page in a moment to verify your subscription.');
        console.warn('Subscription verification timeout after', maxAttempts, 'attempts');
      }
    }, 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  // Always navigate to a known location instead of relying on browser history,
  // which can be unpredictable (e.g. arriving here via a direct link or after
  // a page reload during plan generation).
  const handleBackToChat = () => {
    if (!sessionId) {
      navigate('/ventures');
      return;
    }
    if (backTarget === 'budget') {
      navigate(`/ventures/${sessionId}/budget`);
      return;
    }
    navigate(`/ventures/${sessionId}`, { state: { preferVentureChat: true } });
  };

  const handleBackNavigation = () => {
    if (!sessionId) {
      navigate('/ventures');
      return;
    }
    if (showBudgetForwardNav) {
      navigate(`/ventures/${sessionId}`, {
        state: { restorePlanSummaryOverview: true, preferVentureChat: true },
      });
      return;
    }
    handleBackToChat();
  };

  const headerBackLabel = showBudgetForwardNav ? 'Back to Summary' : backLabel;

  const handleProceedToBudget = async () => {
    if (!sessionId || actionLoading) return;
    setActionLoading(true);
    try {
      if (
        sessionPhase === 'BUDGET' ||
        sessionPhase === 'PLAN_TO_BUDGET_TRANSITION'
      ) {
        navigate(`/ventures/${sessionId}/budget`, { state: { fromTransition: true } });
        return;
      }

      const { data } = await httpClient.post<any>(
        `/angel/sessions/${sessionId}/transition-decision`,
        {
          decision: 'approve',
          transition_type: 'summary_to_budget',
        },
      );

      if (!data.success) {
        toast.error(data.message || 'Could not proceed to budgeting');
        return;
      }

      toast.success('Proceeding to budget setup');
      navigate(`/ventures/${sessionId}/budget`, { state: { fromTransition: true } });
    } catch (error) {
      console.error('Failed to proceed to budget:', error);
      toast.error('Could not proceed to budgeting. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleModifyPlanConfirm = async (modificationAreas: string[]) => {
    if (!sessionId || actionLoading) return;
    setActionLoading(true);
    setShowModificationModal(false);
    try {
      const { data } = await httpClient.post<any>(
        `/angel/sessions/${sessionId}/revisit-plan-with-areas`,
        { modification_areas: modificationAreas },
      );

      if (!data.success) {
        toast.error(data.message || 'Failed to activate plan modification');
        return;
      }

      toast.success('Plan review mode activated');
      navigate(`/ventures/${sessionId}`, { state: { preferVentureChat: true } });
    } catch (error) {
      console.error('Failed to modify plan:', error);
      toast.error('Could not start plan modification. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-teal-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <svg className="animate-spin h-16 w-16 text-teal-500 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-lg font-semibold text-gray-900 mb-2">Loading your business plan...</p>
          <p className="text-sm text-gray-600">
            Loading your plan from the server. If you just requested a full document, generation can take 30–60 seconds.
          </p>
        </div>
      </div>
    );
  }

  // Summary-only sessions: never show an empty "full" pane
  const content =
    viewMode === 'full' && businessPlan ? businessPlan : businessPlanSummary;

  const headerActionBtn =
    'inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-lg px-3 text-sm font-medium transition-colors';

  const documentActions = (
    <>
      {businessPlan && businessPlanSummary && (
        <div
          className="inline-flex shrink-0 rounded-lg border border-gray-200 bg-gray-50 p-0.5"
          role="tablist"
          aria-label="Document view"
        >
          <button
            type="button"
            role="tab"
            aria-selected={viewMode === 'summary'}
            onClick={() => setViewMode('summary')}
            className={`${headerActionBtn} ${
              viewMode === 'summary'
                ? 'bg-white text-teal-800 shadow-sm'
                : 'text-gray-600 hover:bg-white/70'
            }`}
          >
            <span className="whitespace-nowrap">Summary</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={viewMode === 'full'}
            onClick={() => setViewMode('full')}
            className={`${headerActionBtn} ${
              viewMode === 'full'
                ? 'bg-white text-teal-800 shadow-sm'
                : 'text-gray-600 hover:bg-white/70'
            }`}
          >
            <span className="whitespace-nowrap">Full plan</span>
          </button>
        </div>
      )}

      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={handleDownload}
            className={`${headerActionBtn} shrink-0 border border-teal-200 bg-teal-50 text-teal-800 hover:bg-teal-100`}
          >
            <span className="whitespace-nowrap">Download</span>
          </button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-sm">
          Export this document
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={handlePrint}
            className={`${headerActionBtn} shrink-0 border border-gray-200 bg-white text-gray-700 hover:bg-gray-50`}
          >
            <span className="whitespace-nowrap">Print</span>
          </button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-sm">
          Print this document
        </TooltipContent>
      </Tooltip>
    </>
  );

  return (
    <div className="min-h-screen min-w-0 overflow-x-hidden bg-gradient-to-br from-slate-50 to-teal-50">
      {showScrollToBottom && (
        <div
          className={`fixed z-[100] print:hidden ${
            roadmapAvailable ? 'bottom-20 left-4 sm:bottom-8 sm:left-auto sm:right-8' : 'bottom-4 right-4 sm:bottom-8 sm:right-8'
          }`}
        >
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={scrollToDocumentEnd}
                aria-label="Scroll to end of document"
                className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-800 text-white shadow-[0_4px_14px_rgba(15,23,42,0.35)] transition-colors hover:bg-slate-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-800"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.25} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              </button>
            </TooltipTrigger>
            <TooltipContent side="left" sideOffset={10} className="max-w-[220px] text-sm">
              Scroll to the end of your business plan
            </TooltipContent>
          </Tooltip>
        </div>
      )}

      <header className="sticky top-0 z-40 w-full border-b border-gray-200 bg-white shadow-sm print:hidden">
        <div className="h-0.5 bg-gradient-to-r from-teal-600 to-blue-600" aria-hidden />
        <div className="mx-auto w-full max-w-7xl px-4 py-2.5 sm:px-6 sm:py-3 lg:px-8">
          <div className="md:hidden">
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <VentureBrandMark />
                <button
                  type="button"
                  onClick={handleBackNavigation}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-teal-700"
                  aria-label={headerBackLabel}
                >
                  <svg className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  Back
                </button>
              </div>
              <div className="flex shrink-0 flex-wrap items-center justify-end gap-1.5">{documentActions}</div>
            </div>
            <div className="mt-2 border-t border-gray-100 pt-2">
              <h1 className="text-lg font-bold leading-tight text-gray-900">Business Plan</h1>
              <p className="mt-0.5 text-xs text-gray-500">Generated {generatedDateLabel}</p>
            </div>
          </div>

          <div className="hidden md:flex md:items-center md:justify-between md:gap-8">
            <div className="flex min-w-0 items-center gap-6">
              <VentureBrandMark />
              <button
                type="button"
                onClick={handleBackNavigation}
                className="inline-flex shrink-0 items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-teal-700"
                aria-label={headerBackLabel}
              >
                <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                {headerBackLabel}
              </button>
              <div className="h-8 w-px shrink-0 bg-gray-200" aria-hidden />
              <div className="min-w-0">
                <h1 className="text-xl font-bold tracking-tight text-gray-900">Business Plan</h1>
                <p className="mt-0.5 text-sm text-gray-500">Generated {generatedDateLabel}</p>
              </div>
            </div>
            <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">{documentActions}</div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-3 py-3 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg sm:rounded-2xl">
          <div className="hidden border-b border-gray-200 px-6 py-4 print:block">
            <h1 className="text-2xl font-bold text-gray-900">Business Plan</h1>
            <p className="mt-1 text-sm text-gray-600">Generated {generatedDateLabel}</p>
          </div>

          {showBudgetForwardNav && (
            <div className="border-b border-teal-100 bg-gradient-to-r from-teal-50/90 via-white to-slate-50 px-4 py-4 sm:px-6 print:hidden">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0 sm:max-w-md">
                  <p className="text-sm font-semibold text-slate-900">What&apos;s next?</p>
                  <p className="mt-1 text-xs leading-relaxed text-slate-600">
                    When your plan looks good, continue to budgeting. Need changes? Pick the sections to revise.
                  </p>
                </div>

                <div className="flex w-full flex-col-reverse gap-2 sm:w-auto sm:flex-row sm:items-stretch sm:gap-3">
                  <button
                    type="button"
                    onClick={() => setShowModificationModal(true)}
                    disabled={actionLoading}
                    className="inline-flex h-11 min-w-[9.5rem] flex-1 items-center justify-center rounded-lg border border-slate-300 bg-white px-5 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:border-slate-400 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none"
                    aria-label="Modify Plan"
                  >
                    Modify Plan
                  </button>
                  <button
                    type="button"
                    onClick={handleProceedToBudget}
                    disabled={actionLoading}
                    className="inline-flex h-11 min-w-[9.5rem] flex-1 items-center justify-center gap-2 rounded-lg bg-teal-600 px-5 text-sm font-semibold text-white shadow-md transition-colors hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none"
                    aria-label="Next: Budgeting"
                  >
                    {actionLoading ? (
                      <svg className="h-4 w-4 shrink-0 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden>
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                    ) : (
                      <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    )}
                    Next: Budgeting
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Document Content */}
          <div className="p-4 sm:p-8 md:p-12" ref={contentRef} id="document-content">
            {content ? (
              <div className="prose prose-sm max-w-none break-words sm:prose-base md:prose-lg">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    h1: ({ children }) => (
                      <h1 className="mb-4 mt-6 border-b-2 border-gray-200 pb-3 text-2xl font-bold text-gray-900 sm:mb-6 sm:mt-8 sm:text-3xl">
                        {children}
                      </h1>
                    ),
                    h2: ({ children }) => (
                      <h2 className="mb-3 mt-6 text-xl font-bold text-gray-900 sm:mb-4 sm:mt-8 sm:text-2xl">
                        {children}
                      </h2>
                    ),
                    h3: ({ children }) => (
                      <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">
                        {children}
                      </h3>
                    ),
                    h4: ({ children }) => (
                      <h4 className="text-lg font-semibold text-gray-800 mb-2 mt-4">
                        {children}
                      </h4>
                    ),
                    p: ({ children }) => (
                      <p className="mb-4 text-left text-gray-700 leading-relaxed sm:text-justify">
                        {children}
                      </p>
                    ),
                    ul: ({ children }) => (
                      <ul className="mb-4 ml-4 list-disc space-y-2 pl-1 text-gray-700 sm:ml-8">
                        {children}
                      </ul>
                    ),
                    ol: ({ children }) => (
                      <ol className="mb-4 ml-4 list-decimal space-y-2 pl-1 text-gray-700 sm:ml-8">
                        {children}
                      </ol>
                    ),
                    li: ({ children }) => (
                      <li className="leading-relaxed">{children}</li>
                    ),
                    strong: ({ children }) => (
                      <strong className="text-gray-900 font-bold">{children}</strong>
                    ),
                    ...responsiveMarkdownTableComponents,
                    blockquote: ({ children }) => (
                      <blockquote className="border-l-4 border-teal-500 pl-4 py-2 my-4 bg-teal-50 rounded-r-lg">
                        {children}
                      </blockquote>
                    ),
                  }}
                >
                  {content}
                </ReactMarkdown>
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📋</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  No Business Plan Available
                </h3>
                <p className="text-gray-600 mb-6">
                  Complete the business planning phase to generate your business plan.
                </p>
                <button
                  onClick={showBudgetForwardNav ? handleProceedToBudget : handleBackToChat}
                  className="px-6 py-3 bg-teal-500 hover:bg-teal-600 text-white rounded-lg font-medium transition-colors"
                >
                  {showBudgetForwardNav
                    ? 'Next: Budgeting'
                    : backTarget === 'budget'
                      ? 'Return to Budget'
                      : 'Return to Venture'}
                </button>
              </div>
            )}
            <div ref={documentEndRef} className="h-px w-full scroll-mt-8" aria-hidden />
          </div>
        </div>


        {/* Footer - No Print */}
        <div className="mt-6 text-center text-sm text-gray-500 print:hidden">
          <p>This document was generated by Angel Business Assistant</p>
        </div>
      </div>

      {/* Custom Styles */}
      <style>{`
        /* Table hover - only tbody rows */
        .tbody-hover-rows > tr:hover {
          background-color: #f0fdfa !important;
          transition: background-color 150ms ease-in-out;
        }
        
        /* Print styles */
        @media print {
          body {
            background: white !important;
          }
          .print\\:hidden {
            display: none !important;
          }
          .prose {
            max-width: 100% !important;
          }
        }
      `}</style>

      <BusinessPlanModificationModal
        isOpen={showModificationModal}
        onClose={() => setShowModificationModal(false)}
        onConfirm={handleModifyPlanConfirm}
        loading={actionLoading}
      />

      {/* Payment Modal - $20/month subscription for Roadmap and Implementation */}
      <PaymentForm
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        onPaymentSuccess={handlePaymentSuccess}
        amount={20} // $20/month subscription
        itemName="Founderport Premium Subscription"
      />

      {/* Export Modal */}
      <DocumentExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        documentTitle="Business Plan"
        documentContent={contentRef.current?.innerHTML || content}
        documentType="business-plan"
        showSuccessToast={false}
      />

      {/* Floating Continue to Roadmap Button - Right Side */}
      {roadmapAvailable && (
        <div className="fixed bottom-4 right-4 z-40 sm:bottom-auto sm:right-6 sm:top-1/2 sm:-translate-y-1/2 print:hidden">
          <button
            type="button"
            onClick={async () => {
              if (!sessionId) return;
              
              // 🆓 FREE INTRO PERIOD LOGIC
              if (checkIsFreeIntroPeriod()) {
                navigate(`/ventures/${sessionId}`);
                return;
              }

              try {
                const { data: subscriptionData } = await httpClient.get<any>(
                  '/stripe/check-subscription-status'
                );
                
                if (!subscriptionData.success || !subscriptionData.has_active_subscription || subscriptionData.payment_failed) {
                  toast.error('Subscription required to access Roadmap phase. Please subscribe to continue.');
                  // Show payment modal
                  setShowPaymentModal(true);
                  return;
                }

                // Navigate to chat page which will show roadmap
                navigate(`/ventures/${sessionId}`);
              } catch (error) {
                console.error('Error navigating to roadmap:', error);
                toast.error('Failed to navigate to roadmap');
              }
            }}
            className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-lg transition-colors hover:bg-emerald-700 sm:min-w-[140px] sm:flex-col sm:gap-1 sm:px-5 sm:py-4"
            title="Continue to Roadmap"
          >
            <svg className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
            <span className="whitespace-nowrap sm:whitespace-normal sm:text-center sm:leading-tight">
              <span className="hidden sm:block">Continue to</span>
              <span className="hidden sm:block">Roadmap</span>
              <span className="sm:hidden">Continue to Roadmap</span>
            </span>
          </button>
        </div>
      )}
    </div>
  );
};

export default BusinessPlanView;

