import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  BarChart3,
  Target,
  Sparkles,
  ArrowRight,
  RefreshCw,
  CheckCircle2,
  Loader2,
  Rocket,
  Shield,
  LineChart,
  Layers,
  Lightbulb,
  Calculator,
  X,
} from 'lucide-react';
import type { BudgetItem } from '../types/apiTypes';
import { budgetService } from '../services/budgetService';
import { budgetIntro } from './Budget/budgetIntroContent';
import BudgetDashboard from './Budget/BudgetDashboard';
import type { Budget } from '../types/apiTypes';

interface PlanToBudgetTransitionProps {
  businessPlanSummary: string;
  estimatedExpenses?: string;
  businessContext?: {
    business_name?: string;
    industry?: string;
    location?: string;
    business_type?: string;
  };
  onComplete: (budgetData: {
    initialInvestment: number;
    estimatedExpenses: BudgetItem[];
    estimatedRevenue: BudgetItem[];
  }) => void;
  onRevisit: () => void;
  loading?: boolean;
  sessionId?: string;
}

/* ── tiny floating particle ── */
const FloatingParticle = ({ delay, x, y, size }: { delay: number; x: string; y: string; size: number }) => (
  <motion.div
    className="absolute rounded-full bg-teal-400/20"
    style={{ left: x, top: y, width: size, height: size }}
    animate={{ y: [0, -20, 0], opacity: [0.3, 0.7, 0.3], scale: [1, 1.2, 1] }}
    transition={{ duration: 4, repeat: Infinity, delay, ease: 'easeInOut' }}
  />
);

/* ── feature card for "What's Next" ── */
const FeatureCard = ({
  icon: Icon,
  title,
  desc,
  delay,
}: {
  icon: React.ElementType;
  title: string;
  desc: string;
  delay: number;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay }}
    className="relative group bg-white/80 backdrop-blur-sm border border-teal-100 rounded-2xl p-5 shadow-sm hover:shadow-lg hover:border-teal-300 transition-all duration-300"
  >
    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center mb-3 shadow-md group-hover:scale-110 transition-transform">
      <Icon className="w-5 h-5 text-white" />
    </div>
    <h4 className="font-semibold text-gray-800 mb-1">{title}</h4>
    <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
  </motion.div>
);

/* ── numbered step pill for budget sections ── */
const StepPill = ({ n, text }: { n: number; text: string }) => (
  <div className="flex items-start gap-3">
    <span className="flex-shrink-0 w-7 h-7 rounded-full bg-gradient-to-br from-teal-500 to-emerald-500 text-white text-xs font-bold flex items-center justify-center shadow">
      {n}
    </span>
    <span className="text-gray-700 text-sm leading-relaxed pt-0.5">{text}</span>
  </div>
);

type ParsedExpenseSection = 'startup_cost' | 'operating_expense';

const parseAmountFromLine = (line: string): number | null => {
  const amountMatch = line.match(/\$[\d,]+(?:\.\d+)?/);
  if (!amountMatch) return null;
  const amount = Number(amountMatch[0].replace(/[$,]/g, ''));
  return Number.isFinite(amount) ? amount : null;
};

const cleanLine = (line: string): string =>
  line
    .replace(/\*\*/g, '')
    .replace(/^[-*+\s]+/, '')
    .replace(/^\d+[\.\)]\s*/, '')
    .trim();

const parseEstimatedExpenseItems = (estimatedExpensesMarkdown: string): BudgetItem[] => {
  if (!estimatedExpensesMarkdown?.trim()) return [];

  const lines = estimatedExpensesMarkdown.split('\n').map(cleanLine).filter(Boolean);
  const items: BudgetItem[] = [];
  const seen = new Set<string>();
  let currentSection: ParsedExpenseSection | null = null;

  lines.forEach((line, index) => {
    const normalized = line.toLowerCase();

    if (normalized.includes('startup costs')) {
      currentSection = 'startup_cost';
      return;
    }

    if (normalized.includes('monthly operating expenses')) {
      currentSection = 'operating_expense';
      return;
    }

    if (!currentSection) return;

    const amount = parseAmountFromLine(line);
    if (amount === null) return;

    const namePart = line.includes(':') ? line.split(':')[0] : line;
    const name = cleanLine(namePart);
    if (!name) return;

    const descriptionMatch = line.match(/\(([^)]+)\)/);
    const description = descriptionMatch?.[1]?.trim() || '';
    const dedupeKey = `${currentSection}:${name.toLowerCase()}`;
    if (seen.has(dedupeKey)) return;
    seen.add(dedupeKey);

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    items.push({
      id: `angel_${currentSection}_${slug || index}_${index}`,
      name,
      category: 'expense',
      subcategory: currentSection,
      estimated_amount: amount,
      actual_amount: undefined,
      description,
      is_custom: false,
      isSelected: true,
    });
  });

  return items;
};

const buildEstimatedExpensesMarkdownFromItems = (items: BudgetItem[]): string => {
  const startupItems = items.filter((item) => item.category === 'expense' && item.subcategory === 'startup_cost');
  const operatingItems = items.filter((item) => item.category === 'expense' && item.subcategory === 'operating_expense');
  const lines: string[] = [];

  if (startupItems.length > 0) {
    lines.push('**Startup Costs**');
    startupItems.forEach((item) => {
      lines.push(
        `${item.name}: $${(Number(item.estimated_amount) || 0).toLocaleString()}${
          item.description ? ` (${item.description})` : ''
        }`
      );
    });
  }

  if (operatingItems.length > 0) {
    if (lines.length > 0) lines.push('');
    lines.push('**Monthly Operating Expenses**');
    operatingItems.forEach((item) => {
      lines.push(
        `${item.name}: $${(Number(item.estimated_amount) || 0).toLocaleString()}${
          item.description ? ` (${item.description})` : ''
        }`
      );
    });
  }

  return lines.join('\n');
};

/* ════════════════════════════════════════════════════════════════════════════ */

const PlanToBudgetTransition: React.FC<PlanToBudgetTransitionProps> = ({
  businessPlanSummary: businessPlanSummaryProp,
  estimatedExpenses: estimatedExpensesProp = '',
  businessContext = {},
  onComplete,
  onRevisit,
  loading = false,
  sessionId,
}) => {
  const businessPlanSummary =
    typeof businessPlanSummaryProp === 'string'
      ? businessPlanSummaryProp
      : businessPlanSummaryProp
        ? String(businessPlanSummaryProp)
        : '';
  const estimatedExpenses =
    typeof estimatedExpensesProp === 'string'
      ? estimatedExpensesProp
      : estimatedExpensesProp
        ? String(estimatedExpensesProp)
        : '';
  const estimatedExpensesStorageKey = useMemo(
    () => (sessionId ? `venture_estimated_expenses_${sessionId}` : null),
    [sessionId]
  );
  const [cachedEstimatedExpenses, setCachedEstimatedExpenses] = useState('');
  const effectiveEstimatedExpenses = estimatedExpenses.trim() || cachedEstimatedExpenses;
  const angelEstimatedItems = useMemo(
    () => parseEstimatedExpenseItems(effectiveEstimatedExpenses),
    [effectiveEstimatedExpenses]
  );
  const hasSeededAngelEstimatesRef = useRef(false);

  useEffect(() => {
    if (!estimatedExpensesStorageKey || typeof window === 'undefined') return;
    const cached = window.localStorage.getItem(estimatedExpensesStorageKey);
    if (cached) setCachedEstimatedExpenses(cached);
  }, [estimatedExpensesStorageKey]);

  useEffect(() => {
    if (!estimatedExpensesStorageKey || typeof window === 'undefined') return;
    if (!estimatedExpenses.trim()) return;
    window.localStorage.setItem(estimatedExpensesStorageKey, estimatedExpenses);
    setCachedEstimatedExpenses(estimatedExpenses);
  }, [estimatedExpensesStorageKey, estimatedExpenses]);

  // On refresh, transition_data may not include estimated_expenses.
  // Rebuild the display card from saved budget items so users don't lose context.
  useEffect(() => {
    if (!sessionId || effectiveEstimatedExpenses.trim()) return;
    let cancelled = false;

    const hydrateEstimatedExpensesFromBudget = async () => {
      try {
        const response = await budgetService.getBudget(sessionId);
        if (cancelled || !response?.success || !response.result) return;
        const markdown = buildEstimatedExpensesMarkdownFromItems(response.result.items || []);
        if (!markdown.trim()) return;
        setCachedEstimatedExpenses(markdown);
        if (estimatedExpensesStorageKey && typeof window !== 'undefined') {
          window.localStorage.setItem(estimatedExpensesStorageKey, markdown);
        }
      } catch (err) {
        console.error('[PlanToBudgetTransition] Failed to hydrate estimated expenses from budget:', err);
      }
    };

    hydrateEstimatedExpensesFromBudget();
    return () => { cancelled = true; };
  }, [sessionId, effectiveEstimatedExpenses, estimatedExpensesStorageKey]);

  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [budgetCompleted, setBudgetCompleted] = useState(false);
  const [budgetLoading, setBudgetLoading] = useState(false);
  const [budget, setBudget] = useState<Budget>({
    id: '',
    session_id: sessionId || '',
    initial_investment: 20000,
    total_estimated_expenses: 0,
    total_estimated_revenue: 0,
    items: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  // ── Load budget from DB when modal opens ──
  useEffect(() => {
    if (!showBudgetModal || !sessionId) return;
    let cancelled = false;

    const applyAngelExpenseSeeds = (baseBudget: Budget): { budget: Budget; didSeed: boolean } => {
      if (hasSeededAngelEstimatesRef.current || angelEstimatedItems.length === 0) {
        return { budget: baseBudget, didSeed: false };
      }

      const existingExpenseItems = (baseBudget.items || []).filter((item) => item.category === 'expense');
      if (existingExpenseItems.length > 0) {
        return { budget: baseBudget, didSeed: false };
      }

      hasSeededAngelEstimatesRef.current = true;
      const nextItems = [...(baseBudget.items || []), ...angelEstimatedItems];
      const totalEstimatedExpenses = nextItems
        .filter((item) => item.category === 'expense')
        .reduce((sum, item) => sum + (Number(item.estimated_amount) || 0), 0);

      return {
        didSeed: true,
        budget: {
          ...baseBudget,
          items: nextItems,
          total_estimated_expenses: totalEstimatedExpenses,
          updated_at: new Date().toISOString(),
        },
      };
    };

    const persistSeededBudget = async (seededBudget: Budget) => {
      try {
        const payload = {
          session_id: sessionId,
          initial_investment: seededBudget.initial_investment,
          total_estimated_expenses: seededBudget.total_estimated_expenses,
          total_estimated_revenue: seededBudget.total_estimated_revenue || 0,
          items: (seededBudget.items || []).map((item) => ({
            id: item.id,
            name: item.name,
            category: item.category,
            subcategory: item.subcategory,
            estimated_amount: item.estimated_amount,
            actual_amount: item.actual_amount,
            description: item.description,
            is_custom: item.is_custom,
            isSelected: item.isSelected,
          })),
        };
        const saveResponse = await budgetService.saveBudget(sessionId, payload);
        if (!cancelled && saveResponse?.success && saveResponse.result) {
          setBudget(saveResponse.result);
        }
      } catch (saveErr) {
        console.error('[PlanToBudgetTransition] Failed to persist seeded Angel estimates:', saveErr);
      }
    };

    const cacheEstimatedMarkdown = (items: BudgetItem[]) => {
      if (!estimatedExpensesStorageKey || typeof window === 'undefined') return;
      const markdown = buildEstimatedExpensesMarkdownFromItems(items);
      if (!markdown.trim()) return;
      window.localStorage.setItem(estimatedExpensesStorageKey, markdown);
      if (!cancelled) setCachedEstimatedExpenses(markdown);
    };

    const loadBudgetFromDB = async () => {
      try {
        setBudgetLoading(true);
        console.log('[PlanToBudgetTransition] Loading budget from DB for session:', sessionId);
        const response = await budgetService.getBudget(sessionId);
        if (cancelled) return;
        console.log('[PlanToBudgetTransition] Budget loaded:', {
          success: response.success,
          itemsCount: response.result?.items?.length ?? 0,
          budgetId: response.result?.id,
        });

        const baseBudget =
          response.success && response.result && response.result.id
            ? response.result
            : {
                id: '',
                session_id: sessionId,
                initial_investment: 20000,
                total_estimated_expenses: 0,
                total_estimated_revenue: 0,
                items: [],
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              };

        const { budget: nextBudget, didSeed } = applyAngelExpenseSeeds(baseBudget);
        if (!cancelled) setBudget(nextBudget);

        if (didSeed) {
          await persistSeededBudget(nextBudget);
          cacheEstimatedMarkdown(nextBudget.items || []);
        } else if (!effectiveEstimatedExpenses.trim()) {
          cacheEstimatedMarkdown(baseBudget.items || []);
        }
      } catch (err) {
        console.error('[PlanToBudgetTransition] Failed to load budget:', err);
      } finally {
        if (!cancelled) setBudgetLoading(false);
      }
    };

    loadBudgetFromDB();
    return () => { cancelled = true; };
  }, [showBudgetModal, sessionId, angelEstimatedItems, estimatedExpensesStorageKey, effectiveEstimatedExpenses]);

  const handleStartBudget = () => setShowBudgetModal(true);

  // ── DB-backed callbacks (same pattern as Implementation/index.tsx) ──
  const handleUpdateBudget = useCallback((updates: Partial<Budget>) => {
    setBudget((prev) => {
      if (!prev) return prev;
      return { ...prev, ...updates, updated_at: new Date().toISOString() };
    });
    // Persist header changes (e.g. initial_investment) to DB
    if (sessionId && updates.initial_investment !== undefined) {
      budgetService.updateBudgetHeader(sessionId, {
        initial_investment: updates.initial_investment,
      }).catch((err) => console.error('Failed to update budget header:', err));
    }
  }, [sessionId]);

  const handleUpdateItem = useCallback(async (itemId: string, updates: Partial<BudgetItem>) => {
    if (!sessionId) return;
    try {
      const response = await budgetService.updateBudgetItem(sessionId, itemId, updates);
      if (response.success && response.result) {
        setBudget(response.result);
      } else {
        toast.error(response.message || 'Failed to update item');
      }
    } catch (err) {
      console.error('Failed to update budget item:', err);
      toast.error('Failed to update item');
    }
  }, [sessionId]);

  const handleDeleteItem = useCallback(async (itemId: string) => {
    if (!sessionId) return;
    try {
      const response = await budgetService.deleteBudgetItem(sessionId, itemId);
      if (response.success && response.result) {
        setBudget(response.result);
      } else {
        toast.error(response.message || 'Failed to delete item');
      }
    } catch (err) {
      console.error('Failed to delete budget item:', err);
      toast.error('Failed to delete item');
    }
  }, [sessionId]);

  const handleBudgetComplete = async (budgetData: {
    initialInvestment: number;
    estimatedExpenses: BudgetItem[];
    estimatedRevenue: BudgetItem[];
  }) => {
    try {
      // Budget data is already saved to DB via individual CRUD operations.
      // Just save the final header totals.
      if (sessionId) {
        const totalExpenses = budgetData.estimatedExpenses.reduce((s, i) => s + i.estimated_amount, 0);
        const totalRevenue = budgetData.estimatedRevenue.reduce((s, i) => s + i.estimated_amount, 0);

        await budgetService.saveBudget(sessionId, {
          session_id: sessionId,
          initial_investment: budgetData.initialInvestment,
          total_estimated_expenses: totalExpenses,
          total_estimated_revenue: totalRevenue,
          items: [...budgetData.estimatedExpenses, ...budgetData.estimatedRevenue].map((item) => ({
            id: item.id,
            name: item.name,
            category: item.category,
            estimated_amount: item.estimated_amount,
            actual_amount: item.actual_amount,
            description: item.description,
            is_custom: item.is_custom,
            isSelected: item.isSelected,
          })),
        });
        toast.success('Budget saved successfully!');
      }
      setBudgetCompleted(true);
      setShowBudgetModal(false);
      onComplete(budgetData);
    } catch (error: any) {
      console.error('Failed to save budget:', error);
      toast.error('Failed to save budget. Please try again.');
    }
  };

  /* ──────────────── RENDER ──────────────── */
  return (
    <>
      {/* 
        FIX: replaced `items-center` with `items-start` so content is never
        clipped at the top when it's taller than the viewport.
      */}
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-teal-50/60 to-cyan-50 overflow-y-auto">
        {/* decorative floating particles */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <FloatingParticle delay={0} x="10%" y="15%" size={8} />
          <FloatingParticle delay={1.2} x="85%" y="10%" size={6} />
          <FloatingParticle delay={0.6} x="70%" y="80%" size={10} />
          <FloatingParticle delay={1.8} x="20%" y="75%" size={7} />
          <FloatingParticle delay={2.4} x="50%" y="5%" size={5} />
          <FloatingParticle delay={0.3} x="90%" y="50%" size={9} />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 py-12">
          {/* ─── Hero ─── */}
          <motion.div
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="text-center mb-12"
          >
            {/* animated money-bag icon */}
            <motion.div
              animate={{ rotate: [0, 8, -8, 0], scale: [1, 1.08, 1] }}
              transition={{ duration: 3, repeat: Infinity, repeatDelay: 4, ease: 'easeInOut' }}
              className="relative w-28 h-28 mx-auto mb-6"
            >
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-teal-400 to-emerald-500 shadow-xl shadow-teal-300/40" />
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-teal-400/50 to-emerald-500/50 animate-ping opacity-20" />
              <span className="absolute inset-0 flex items-center justify-center text-5xl select-none">💰</span>
            </motion.div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold mb-4">
              <span className="bg-gradient-to-r from-teal-600 via-emerald-500 to-cyan-500 bg-clip-text text-transparent">
                Budget Planning Time!
              </span>
            </h1>
            <p className="text-lg md:text-xl text-gray-500 max-w-2xl mx-auto leading-relaxed">
              Great work completing your business plan! Now let's build a realistic financial
              picture — your roadmap to sustainability.
            </p>
          </motion.div>

          {/* ─── Business Plan Summary ─── */}
          {businessPlanSummary && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.15 }}
              className="mb-8 bg-white/90 backdrop-blur border border-teal-100 rounded-2xl shadow-sm overflow-hidden"
            >
              <div className="bg-gradient-to-r from-teal-500 to-emerald-500 px-6 py-3 flex items-center gap-2">
                <Layers className="w-5 h-5 text-white" />
                <h2 className="text-lg font-bold text-white tracking-wide">Business Plan Summary</h2>
              </div>
              <div className="px-6 py-5 prose prose-sm max-w-none text-gray-700">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {businessPlanSummary.length > 500
                    ? businessPlanSummary.substring(0, 500) + '...'
                    : businessPlanSummary}
                </ReactMarkdown>
              </div>
            </motion.div>
          )}

          {/* ─── Estimated Expenses ─── */}
          {effectiveEstimatedExpenses && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.25 }}
              className="mb-8 bg-white/90 backdrop-blur border border-rose-100 rounded-2xl shadow-sm overflow-hidden"
            >
              <div className="bg-gradient-to-r from-rose-500 to-orange-400 px-6 py-3 flex items-center gap-2">
                <TrendingDown className="w-5 h-5 text-white" />
                <h2 className="text-lg font-bold text-white tracking-wide">
                  Estimated Expenses (from Your Business Plan)
                </h2>
              </div>
              <div className="px-6 py-5">
                <p className="text-gray-600 mb-4 text-sm">
                  I've analyzed your business plan and prepared estimated expenses tailored to your{' '}
                  <span className="font-semibold text-teal-700">{businessContext.industry || 'industry'}</span>{' '}
                  business in{' '}
                  <span className="font-semibold text-teal-700">{businessContext.location || 'your location'}</span>.
                </p>
                <div className="bg-gradient-to-br from-rose-50/80 to-orange-50/60 rounded-xl p-5 border border-rose-100">
                  <div className="text-gray-700 prose prose-sm max-w-none">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{effectiveEstimatedExpenses}</ReactMarkdown>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* ─── Budget Intro Sections ─── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.35 }}
            className="mb-8 bg-white/90 backdrop-blur border border-teal-100 rounded-2xl shadow-sm overflow-hidden"
          >
            {/* Section 1 — What is budgeting? */}
            <div className="px-6 pt-6 pb-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center shadow">
                  <Lightbulb className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-xl font-bold text-gray-800">{budgetIntro.section1.title}</h2>
              </div>
              <div className="space-y-2 text-gray-600 text-sm leading-relaxed pl-[52px]">
                {budgetIntro.section1.paragraphs.map((p) => (
                  <p key={p}>{p}</p>
                ))}
              </div>
            </div>

            <div className="mx-6 h-px bg-gradient-to-r from-transparent via-teal-200 to-transparent" />

            {/* Section 2 — Three parts */}
            <div className="px-6 py-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-teal-500 flex items-center justify-center shadow">
                  <Calculator className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-lg font-bold text-gray-800">{budgetIntro.section2.title}</h3>
              </div>
              <div className="pl-[52px]">
                <p className="text-gray-600 text-sm mb-3">{budgetIntro.section2.intro}</p>
                <div className="space-y-2.5 mb-4">
                  {budgetIntro.section2.list1.map((item, i) => (
                    <StepPill key={item} n={i + 1} text={item} />
                  ))}
                </div>
                <p className="text-gray-600 text-sm mb-3">{budgetIntro.section2.outro}</p>
                <div className="space-y-2.5">
                  {budgetIntro.section2.list2.map((item, i) => (
                    <StepPill key={item} n={i + 1} text={item} />
                  ))}
                </div>
              </div>
            </div>

            <div className="mx-6 h-px bg-gradient-to-r from-transparent via-teal-200 to-transparent" />

            {/* Section 3 — A Living Budget */}
            <div className="px-6 pt-4 pb-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-green-500 flex items-center justify-center shadow">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-lg font-bold text-gray-800">{budgetIntro.section3.title}</h3>
              </div>
              <div className="space-y-2 text-gray-600 text-sm leading-relaxed pl-[52px]">
                {budgetIntro.section3.paragraphs.map((p) => (
                  <p key={p}>{p}</p>
                ))}
              </div>
            </div>
          </motion.div>

          {/* ─── What's Next — feature grid ─── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.45 }}
            className="mb-10"
          >
            <div className="flex items-center gap-2 mb-5">
              <Target className="w-6 h-6 text-teal-500" />
              <h2 className="text-xl font-bold text-gray-800">What's Next</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <FeatureCard
                icon={BarChart3}
                title="Detailed Breakdown"
                desc="See a full budget breakdown with estimated expenses and revenue projections."
                delay={0.5}
              />
              <FeatureCard
                icon={DollarSign}
                title="Adjust Amounts"
                desc="Type dollar amounts or use sliders to fine-tune every line item."
                delay={0.6}
              />
              <FeatureCard
                icon={TrendingUp}
                title="Add Custom Items"
                desc="Add or remove expense and revenue categories unique to your business."
                delay={0.7}
              />
              <FeatureCard
                icon={LineChart}
                title="Break-Even Analysis"
                desc="Auto-calculated break-even timeline to see when your venture becomes profitable."
                delay={0.8}
              />
              <FeatureCard
                icon={Shield}
                title="Chat with Angel"
                desc="Discuss budget items with Angel — she reads your plan and numbers together."
                delay={0.9}
              />
              <FeatureCard
                icon={Rocket}
                title="Save & Continue"
                desc="Your budget is saved and referenced throughout the rest of your journey."
                delay={1.0}
              />
            </div>

            {/* Ready prompt */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.1, duration: 0.5 }}
              className="mt-6 bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3"
            >
              <Sparkles className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-amber-800">
                <strong>Ready to set up your budget?</strong> Click the button below to begin building a comprehensive
                financial plan for your business.
              </p>
            </motion.div>
          </motion.div>

          {/* ─── Action Buttons ─── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.7 }}
            className="flex flex-col sm:flex-row gap-4 justify-center pb-8"
          >
            {/* Primary CTA */}
            <motion.button
              onClick={handleStartBudget}
              disabled={loading || budgetCompleted}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              className="group relative bg-gradient-to-r from-teal-500 via-emerald-500 to-green-500 hover:from-teal-600 hover:via-emerald-600 hover:to-green-600 text-white px-10 py-5 rounded-2xl text-xl font-bold shadow-xl shadow-teal-300/30 hover:shadow-2xl hover:shadow-teal-400/40 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-3">
                  <Loader2 className="w-6 h-6 animate-spin" />
                  Setting up budget…
                </span>
              ) : budgetCompleted ? (
                <span className="flex items-center justify-center gap-3">
                  <CheckCircle2 className="w-6 h-6" />
                  Budget Completed
                </span>
              ) : (
                <span className="flex items-center justify-center gap-3">
                  <DollarSign className="w-6 h-6" />
                  Start Budget Setup
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </span>
              )}
            </motion.button>

            {/* Secondary */}
            <motion.button
              onClick={onRevisit}
              disabled={loading}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              className="group bg-white border-2 border-gray-200 hover:border-teal-300 text-gray-700 hover:text-teal-700 px-8 py-4 rounded-2xl text-lg font-semibold shadow-sm hover:shadow-md transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="flex items-center justify-center gap-2">
                <RefreshCw className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" />
                Modify Business Plan
              </span>
            </motion.button>
          </motion.div>
        </div>
      </div>

      {/* ─── Budget Setup Modal ─── */}
      {showBudgetModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-2xl shadow-2xl max-w-7xl w-full max-h-[90vh] overflow-hidden"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-teal-500 to-emerald-500">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Budget Setup
              </h2>
              <button
                onClick={() => setShowBudgetModal(false)}
                className="text-white/80 hover:text-white transition-colors rounded-full p-1 hover:bg-white/20"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-130px)]">
              {budgetLoading ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <Loader2 className="w-8 h-8 animate-spin text-teal-500 mb-3" />
                  <p className="text-gray-500">Loading your budget…</p>
                </div>
              ) : (
                <BudgetDashboard
                  budget={budget}
                  onUpdateBudget={handleUpdateBudget}
                  onUpdateItem={handleUpdateItem}
                  onDeleteItem={handleDeleteItem}
                  businessType={businessContext?.business_type}
                  businessContext={businessContext}
                  sessionId={sessionId}
                />
              )}
            </div>
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50/80">
              <button
                onClick={() => setShowBudgetModal(false)}
                className="px-5 py-2.5 text-gray-500 border border-gray-200 rounded-xl hover:bg-gray-100 hover:text-gray-700 transition-all font-medium text-sm"
              >
                Cancel
              </button>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    const expenses = budget.items.filter((item) => item.category === 'expense');
                    const revenue = budget.items.filter((item) => item.category === 'revenue');
                    handleBudgetComplete({
                      initialInvestment: budget.initial_investment,
                      estimatedExpenses: expenses,
                      estimatedRevenue: revenue,
                    });
                  }}
                  className="px-5 py-2.5 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white rounded-xl font-medium shadow-md hover:shadow-lg transition-all text-sm"
                >
                  Complete Budget Setup
                </button>
                <button
                  onClick={() => {
                    const expenses = budget.items.filter((item) => item.category === 'expense');
                    const revenue = budget.items.filter((item) => item.category === 'revenue');
                    handleBudgetComplete({
                      initialInvestment: budget.initial_investment,
                      estimatedExpenses: expenses,
                      estimatedRevenue: revenue,
                    });
                  }}
                  className="group flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500 hover:from-emerald-600 hover:via-green-600 hover:to-teal-600 text-white rounded-xl font-semibold shadow-md shadow-emerald-500/20 hover:shadow-lg hover:shadow-emerald-500/30 transition-all text-sm"
                >
                  Continue to Roadmap
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </>
  );
};

export default PlanToBudgetTransition;
