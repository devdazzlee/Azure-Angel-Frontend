import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
  AlertTriangle, 
  Info, 
  TrendingDown, 
  Plus, 
  Save, 
  MessageSquareText, 
  Download, 
  Loader,
  DollarSign,
  TrendingUp,
  Target,
  PieChart as PieChartIcon,
  BarChart3,
  Calculator,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Trash2,
  Edit2,
  MoreHorizontal,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Sparkles,
  Zap,
  Award,
  Clock,
  Calendar,
  FileText,
  HelpCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip as UITooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line, Area, AreaChart } from 'recharts';
import type { BudgetItem, Budget, APIResponse } from '@/types/apiTypes'; 
import StartupCostsTable from './StartupCostsTable';
import { TableSelectionControls } from './TableSelectionControls';
import OperatingExpensesTable from './OperatingExpensesTable';
import RevenueTable from './RevenueTable';
import { CurrencyInput } from './CurrencyInput'; 
import BudgetDashboardHeader from './BudgetDashboardHeader';
import SelectedItemsBanner from './SelectedItemsBanner';
import BudgetWarnings from './BudgetWarnings';
import MetricCard from './MetricCard';
import BudgetOverview from './BudgetOverview';
// StickyRoadmapButton removed — Roadmap CTA is now in the header
import { 
  debounce, 
  formatCurrency, 
  useBudgetValidation,
  getSmartStepForInitialInvestment,
  classifyExpenseGroup,
  handleExportPdf,
  handleExportExcel
} from './BudgetUtils'; 
import { budgetService } from '@/services/budgetService';
import { toast } from 'react-toastify';
import httpClient from '../../api/httpClient';
import BudgetChatModal from './BudgetChatModal';
import AddLineItemModal from './AddLineItemModal'; 
import RemoveItemModal from './RemoveItemModal'; 
import type { SaveStatus } from './BudgetDashboardHeader'; 
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// Types
type RevenueStream = {
  id: string;
  name: string;
  estimatedPrice: number;
  estimatedVolume: number;
  revenueProjection: number;
  isSelected: boolean;
  isCustom: boolean;
  category: 'revenue';
};

interface BudgetDashboardProps {
  budget: Budget;
  onUpdateBudget: (updates: Partial<Budget>) => void;
  onUpdateItem: (id: string, updates: Partial<BudgetItem>) => void | Promise<void>;
  onDeleteItem: (id: string) => void | Promise<void>;
  currency?: string;
  showActuals?: boolean;
  businessType?: string;
  sessionId?: string;
  businessContext?: any;
};

// Modern Color Palette — consistent teal / blue / emerald theme
const COLORS = {
  primary: '#0d9488',   // Teal-600
  secondary: '#3b82f6', // Blue-500
  success: '#10b981',   // Emerald-500
  danger: '#ef4444',    // Red-500
  warning: '#f59e0b',   // Amber-500
  info: '#06b6d4',      // Cyan-500
  chart: {
    startup: ['#0d9488', '#14b8a6', '#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6', '#f59e0b', '#10b981'],
    monthly: ['#0d9488', '#06b6d4', '#3b82f6', '#10b981', '#14b8a6', '#f59e0b', '#f97316', '#ef4444'],
    revenue: '#10b981',
    expense: '#ef4444',
  }
};

const BudgetDashboard: React.FC<BudgetDashboardProps> = ({
  budget,
  onUpdateBudget,
  onUpdateItem,
  onDeleteItem,
  currency = '$',
  showActuals = false,
  businessType,
  sessionId,
  businessContext
}) => {
  // State Management
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [viewMode, setViewMode] = useState<'estimated' | 'actual'>('estimated');
  const [dynamicRevenueStreams, setDynamicRevenueStreams] = useState<RevenueStream[]>([]);
  const [loadingRevenueStreams, setLoadingRevenueStreams] = useState<boolean>(true);
  const [totalMonthlyRevenue, setTotalMonthlyRevenue] = useState<number>(0);
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(() => new Set());
  const [isChatModalOpen, setIsChatModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = window.localStorage.getItem('budgetDashboardTab');
      if (saved && ['overview', 'manage', 'analysis'].includes(saved)) {
        return saved;
      }
    }
    return 'overview';
  });

  const [isAddLineItemModalOpen, setIsAddLineItemModalOpen] = useState(false);
  const [addLineItemCategory, setAddLineItemCategory] = useState<'startup_cost' | 'operating_expense' | 'revenue' | null>(null);
  
  const [removeModalState, setRemoveModalState] = useState<{
    isOpen: boolean;
    itemId: string;
    itemName: string;
    isCustom: boolean;
  }>({
    isOpen: false,
    itemId: '',
    itemName: '',
    isCustom: false
  });

  // Helper Functions
  const openAddLineItemModal = (category: 'startup_cost' | 'operating_expense' | 'revenue') => {
    setAddLineItemCategory(category);
    setIsAddLineItemModalOpen(true);
  };

  const closeAddLineItemModal = () => {
    setIsAddLineItemModalOpen(false);
    setAddLineItemCategory(null);
  };

  const openRemoveModal = (itemId: string, itemName: string, isCustom: boolean = false) => {
    setRemoveModalState({
      isOpen: true,
      itemId,
      itemName,
      isCustom
    });
  };

  const closeRemoveModal = () => {
    setRemoveModalState({
      isOpen: false,
      itemId: '',
      itemName: '',
      isCustom: false
    });
  };

  const confirmRemoveItem = async () => {
    try {
      await onDeleteItem(removeModalState.itemId);
      toast.success(`"${removeModalState.itemName}" removed successfully`);
      closeRemoveModal();
    } catch (error) {
      console.error('Error removing item:', error);
      toast.error('Failed to remove item');
    }
  };

  // Legacy delete handler (unused — replaced by openRemoveModal + confirmRemoveItem)
  // Kept for compatibility if any child component calls it directly
  const handleDeleteItem = useCallback(async (id: string) => {
    const item = budget.items.find((i) => i.id === id);
    openRemoveModal(id, item?.name || 'this item', item?.is_custom ?? false);
  }, [budget.items]);

  const handleAddItem = useCallback(async (
    item: Omit<BudgetItem, 'id' | 'created_at' | 'updated_at'>,
    subcategory?: 'startup_cost' | 'operating_expense' | 'payroll' | 'cogs'
  ): Promise<BudgetItem> => {
    if (!sessionId) {
      toast.error('Session not found. Cannot add item.');
      throw new Error('Session not found');
    }

    const itemWithSubcategory = {
      ...item,
      subcategory,
    };

    try {
      const response: APIResponse<Budget> = await budgetService.addBudgetItem(sessionId, itemWithSubcategory);
      if (response.success && response.result) {
        onUpdateBudget(response.result);
        const addedItem = response.result.items[response.result.items.length - 1];
        toast.success(`Item "${addedItem?.name || item.name}" added successfully!`);
        return addedItem;
      } else {
        toast.error(response.message || "Failed to add budget item.");
        throw new Error(response.message || "Failed to add budget item.");
      }
    } catch (error) {
      console.error("Error adding budget item:", error);
      toast.error('Failed to add item to database.');
      throw error;
    }
  }, [sessionId, onUpdateBudget]);

  const saveRevenueStreamsDebounced = useCallback(
    debounce(async (streamsToSave: RevenueStream[]) => {
      if (sessionId) {
        try {
          const res = await budgetService.saveRevenueStreams(sessionId, streamsToSave);
          // Sync IDs from DB so subsequent saves can match records
          if (res.result && Array.isArray(res.result) && res.result.length > 0) {
            const synced: RevenueStream[] = res.result.map((item: any) => ({
              id: item.id,
              name: item.name,
              estimatedPrice: item.estimated_price ?? item.estimated_amount ?? 0,
              estimatedVolume: item.estimated_volume ?? 1,
              revenueProjection: item.estimated_amount ?? 0,
              isSelected: item.is_selected !== false,
              isCustom: item.is_custom ?? false,
              category: 'revenue' as const,
            }));
            setDynamicRevenueStreams(synced);
          }
        } catch (error) {
          console.error("Failed to save revenue streams:", error);
        }
      }
    }, 1000),
    [sessionId]
  );

  // Load Revenue Streams — DB first, AI generate only if none saved
  const revenueLoadedRef = useRef(false);
  useEffect(() => {
    if (revenueLoadedRef.current) return;
    const loadRevenueStreams = async () => {
      if (!sessionId) { setLoadingRevenueStreams(false); return; }
      setLoadingRevenueStreams(true);
      try {
        // 1. Try loading from DB first
        const dbResponse = await budgetService.getRevenueStreams(sessionId);
        if (dbResponse.success && dbResponse.result && dbResponse.result.length > 0) {
          const fromDb: RevenueStream[] = dbResponse.result.map((item: any) => ({
            id: item.id,
            name: item.name,
            estimatedPrice: item.estimated_price ?? item.estimated_amount ?? 0,
            estimatedVolume: item.estimated_volume ?? 1,
            revenueProjection: item.estimated_amount ?? 0,
            isSelected: item.is_selected !== false,
            isCustom: item.is_custom ?? false,
            category: 'revenue' as const,
          }));
          setDynamicRevenueStreams(fromDb);
          revenueLoadedRef.current = true;
          setLoadingRevenueStreams(false);
          return;
        }

        // 2. Also check budget.items for saved revenue items
        const savedRevenueItems = budget.items.filter(item => item.category === 'revenue');
        if (savedRevenueItems.length > 0) {
          const fromBudget: RevenueStream[] = savedRevenueItems.map(item => ({
            id: item.id,
            name: item.name,
            estimatedPrice: item.estimated_price ?? item.estimated_amount ?? 0,
            estimatedVolume: item.estimated_volume ?? 1,
            revenueProjection: item.estimated_amount ?? 0,
            isSelected: item.is_selected !== false,
            isCustom: item.is_custom ?? false,
            category: 'revenue' as const,
          }));
          setDynamicRevenueStreams(fromBudget);
          revenueLoadedRef.current = true;
          setLoadingRevenueStreams(false);
          return;
        }

        // 3. Nothing in DB — generate from AI, save to DB, and load back
        if (businessType) {
          const genResponse = await budgetService.generateInitialRevenueStreams(sessionId);
          if (genResponse.success && genResponse.result && genResponse.result.length > 0) {
            const aiStreams: RevenueStream[] = genResponse.result.map((stream: any, index: number) => ({
              id: `gen-${Date.now()}-${index}`,
              name: stream.name,
              estimatedPrice: stream.estimated_price ?? 0,
              estimatedVolume: stream.estimated_volume ?? 0,
              revenueProjection: (stream.estimated_price ?? 0) * (stream.estimated_volume ?? 0),
              isSelected: true,
              isCustom: false,
              category: 'revenue' as const,
            }));

            // Save to DB immediately
            try {
              await budgetService.saveRevenueStreams(sessionId, aiStreams);
              // Re-fetch from DB to get proper IDs
              const refreshed = await budgetService.getRevenueStreams(sessionId);
              if (refreshed.success && refreshed.result && refreshed.result.length > 0) {
                const final: RevenueStream[] = refreshed.result.map((item: any) => ({
                  id: item.id,
                  name: item.name,
                  estimatedPrice: item.estimated_price ?? item.estimated_amount ?? 0,
                  estimatedVolume: item.estimated_volume ?? 1,
                  revenueProjection: item.estimated_amount ?? 0,
                  isSelected: item.is_selected !== false,
                  isCustom: item.is_custom ?? false,
                  category: 'revenue' as const,
                }));
                setDynamicRevenueStreams(final);
              } else {
                setDynamicRevenueStreams(aiStreams);
              }
            } catch {
              setDynamicRevenueStreams(aiStreams);
            }
          } else {
            setDynamicRevenueStreams([]);
          }
        } else {
          setDynamicRevenueStreams([]);
        }
        revenueLoadedRef.current = true;
      } catch (error) {
        console.error("Error loading revenue streams:", error);
        setDynamicRevenueStreams([]);
      } finally {
        setLoadingRevenueStreams(false);
      }
    };
    loadRevenueStreams();
  }, [sessionId, businessType, budget.items]);

  const handleRevenueStreamsChange = useCallback((updatedStreams: RevenueStream[]) => {
    setDynamicRevenueStreams(updatedStreams);
    // Save to DB (debounced to avoid hammering on every keystroke)
    saveRevenueStreamsDebounced(updatedStreams);
  }, [saveRevenueStreamsDebounced]);

  // Direct DB save for revenue streams (non-debounced, for add/remove)
  const saveRevenueStreamsDirect = useCallback(async (streams: RevenueStream[]) => {
    if (!sessionId) return;
    try {
      const res = await budgetService.saveRevenueStreams(sessionId, streams);
      // Sync IDs from DB so subsequent saves can match records
      if (res.result && Array.isArray(res.result) && res.result.length > 0) {
        const synced: RevenueStream[] = res.result.map((item: any) => ({
          id: item.id,
          name: item.name,
          estimatedPrice: item.estimated_price ?? item.estimated_amount ?? 0,
          estimatedVolume: item.estimated_volume ?? 1,
          revenueProjection: item.estimated_amount ?? 0,
          isSelected: item.is_selected !== false,
          isCustom: item.is_custom ?? false,
          category: 'revenue' as const,
        }));
        setDynamicRevenueStreams(synced);
      }
    } catch (error) {
      console.error("Failed to save revenue streams:", error);
      toast.error('Failed to save revenue stream to database');
    }
  }, [sessionId]);

  // Selection Management
  const onToggleItemSelection = useCallback((itemId: string, isSelected: boolean) => {
    setSelectedItemIds((prev) => {
      const next = new Set(prev);
      if (isSelected) next.add(itemId);
      else next.delete(itemId);
      return next;
    });
  }, []);

  const onToggleSectionSelection = useCallback((itemIdsInSection: string[], isSelected: boolean) => {
    setSelectedItemIds((prev) => {
      const next = new Set(prev);
      itemIdsInSection.forEach((id) => {
        if (isSelected) next.add(id);
        else next.delete(id);
      });
      return next;
    });
  }, []);

  // Classification
  const classifyExpenseGroup = useCallback((item: BudgetItem): 'startup' | 'operating' | 'other' => {
    if (item.subcategory) {
      const map: Record<string, 'startup' | 'operating'> = {
        startup_cost: 'startup',
        operating_expense: 'operating',
        payroll: 'operating',
        cogs: 'operating',
      };
      if (map[item.subcategory]) return map[item.subcategory];
    }

    const id = String(item.id || '');
    if (id.startsWith('startup_')) return 'startup';
    if (id.startsWith('operating_') || id.startsWith('payroll_') || id.startsWith('cogs_')) return 'operating';

    const desc = String(item.description || '');
    if (desc.startsWith('[startup_cost]')) return 'startup';
    if (desc.startsWith('[operating_expense]') || desc.startsWith('[payroll]') || desc.startsWith('[cogs]')) return 'operating';

    const name = String(item.name || '').trim().toLowerCase();

    const startupHints = [
      'business registration',
      'licenses',
      'legal & accounting setup',
      'equipment & tools',
      'initial inventory',
      'vehicle purchase',
      'vehicle lease',
      'branding & design',
      'website & initial',
      'insurance (initial',
      'office / workspace setup',
    ];

    const operatingHints = [
      'rent / workspace',
      'utilities & internet',
      'software subscriptions',
      'insurance (monthly)',
      'marketing & advertising',
      'accounting & bookkeeping',
      'professional services',
      'vehicle expenses',
      'phone & communications',
      'miscellaneous / buffer',
      'inventory replenishment',
      'founder compensation',
      'employee wages',
      'payroll taxes',
      'benefits',
      'contractors / freelancers',
      'materials / supplies',
      'manufacturing / production',
      'packaging & shipping',
      'payment processing fees',
    ];

    if (startupHints.some((h) => name.includes(h))) return 'startup';
    if (operatingHints.some((h) => name.includes(h))) return 'operating';

    // Check if description indicates this is a revenue item misclassified as expense
    const descLower = desc.toLowerCase();
    if (descLower.includes('revenue from') || descLower.includes('income from') || descLower.includes('sales of')) {
      return 'operating'; // Don't put misclassified revenue items in startup costs
    }

    // Default unclassified items to operating (safer than startup)
    return 'operating';
  }, []);

  // Categorized Items — exclude items with revenue-indicating descriptions
  // that were misclassified as expenses by the AI
  const expenses = useMemo(() => {
    if (!budget.items || budget.items.length === 0) return [];
    return budget.items.filter(item => {
      if (item.category !== 'expense') return false;
      const desc = (item.description || '').toLowerCase();
      if (desc.includes('revenue from') || desc.includes('income from') || desc.includes('sales of')) return false;
      return true;
    });
  }, [budget.items]);

  const revenues = useMemo(() => {
    if (!budget.items || budget.items.length === 0) return [];
    const selectedDynamicStreams = dynamicRevenueStreams.filter(stream => stream.isSelected);
    const dynamicStreamsAsBudgetItems: BudgetItem[] = selectedDynamicStreams.map(stream => ({
      id: stream.id,
      name: stream.name,
      category: 'revenue',
      estimated_amount: stream.revenueProjection,
      actual_amount: undefined,
      description: '',
      is_custom: stream.isCustom,
      isSelected: stream.isSelected,
    }));
    return [...dynamicStreamsAsBudgetItems];
  }, [budget.items, dynamicRevenueStreams]);

  const startupCostItems = useMemo(
    () => expenses.filter((item) => classifyExpenseGroup(item) === 'startup'),
    [expenses, classifyExpenseGroup]
  );

  const operatingExpenseItems = useMemo(
    () => expenses.filter((item) => classifyExpenseGroup(item) === 'operating'),
    [expenses, classifyExpenseGroup]
  );

  const otherExpenses = useMemo(
    () => expenses.filter((item) => classifyExpenseGroup(item) === 'other'),
    [expenses, classifyExpenseGroup]
  );

  // Calculations
  const totalEstimatedExpenses = expenses.reduce((sum, item) => sum + item.estimated_amount, 0);
  const totalActualExpenses = expenses.reduce((sum, item) => sum + (item.actual_amount || 0), 0);
  const totalActualRevenue = revenues.reduce((sum, item) => sum + (item.actual_amount || 0), 0);

  const currentTotalExpenses = viewMode === 'actual' ? totalActualExpenses : totalEstimatedExpenses;
  const currentTotalRevenue = viewMode === 'actual' ? totalActualRevenue : totalMonthlyRevenue;
  const netBudget = currentTotalRevenue - currentTotalExpenses;

  const estimatedRevenueFromItems = useMemo(() => {
    return revenues.reduce((sum, item) => sum + (Number(item.estimated_amount) || 0), 0);
  }, [revenues]);

  const effectiveEstimatedMonthlyRevenue = useMemo(() => {
    return totalMonthlyRevenue > 0 ? totalMonthlyRevenue : estimatedRevenueFromItems;
  }, [totalMonthlyRevenue, estimatedRevenueFromItems]);

  const effectiveMonthlyRevenueForBreakEven = useMemo(() => {
    return viewMode === 'actual' ? totalActualRevenue : effectiveEstimatedMonthlyRevenue;
  }, [viewMode, totalActualRevenue, effectiveEstimatedMonthlyRevenue]);

  const getMonthlyValue = useCallback((item: BudgetItem) => {
    if (viewMode === 'actual' && item.actual_amount !== undefined && item.actual_amount !== null) {
      return Number(item.actual_amount) || 0;
    }
    return Number(item.estimated_amount) || 0;
  }, [viewMode]);

  const startupCostsTotal = useMemo(() => 
    startupCostItems.reduce((sum, item) => sum + (item.estimated_amount || 0), 0), 
    [startupCostItems]
  );

  const totalMonthlyCosts = useMemo(() => 
    operatingExpenseItems.reduce((sum, item) => sum + (item.estimated_amount || 0), 0),
    [operatingExpenseItems]
  );

  const monthlyNetIncome = useMemo(() => 
    effectiveMonthlyRevenueForBreakEven - totalMonthlyCosts,
    [effectiveMonthlyRevenueForBreakEven, totalMonthlyCosts]
  );

  const breakEven = useMemo(() => {
    if (monthlyNetIncome <= 0) {
      return {
        status: 'never' as const,
        months: null as number | null,
        years: null as number | null,
      };
    }

    const months = Math.max(0, Math.ceil(startupCostsTotal / monthlyNetIncome));
    const years = months >= 24 ? months / 12 : null;
    return {
      status: 'months' as const,
      months,
      years,
    };
  }, [monthlyNetIncome, startupCostsTotal]);

  const twoYearProjection = useMemo(() => {
    const months = 24;
    const revenue24 = (Number(effectiveMonthlyRevenueForBreakEven) || 0) * months;
    const costs24 = (Number(totalMonthlyCosts) || 0) * months;
    const net24 = revenue24 - costs24;

    const totalStartup = Number(startupCostsTotal) || 0;
    const netAfterStartup24 = net24 - totalStartup;

    return { months, revenue24, costs24, net24, totalStartup, netAfterStartup24 };
  }, [effectiveMonthlyRevenueForBreakEven, totalMonthlyCosts, startupCostsTotal]);

  const startupActualTotal = useMemo(() => {
    return startupCostItems.reduce((sum, item) => sum + (Number(item.actual_amount) || 0), 0);
  }, [startupCostItems]);

  const remainingStartupFunds = useMemo(() => {
    const investment = Number(budget.initial_investment) || 0;
    const spent = startupActualTotal > 0 ? startupActualTotal : startupCostsTotal;
    return investment - spent;
  }, [budget.initial_investment, startupActualTotal, startupCostsTotal]);

  // Add validation hook
  const useBudgetValidation = () => {
    const [warnings, setWarnings] = useState<Array<{
      id: string;
      type: 'warning' | 'error' | 'info';
      message: string;
      itemId?: string;
    }>>([]);
    
    useEffect(() => {
      const newWarnings = [];
      
      // Check if monthly costs exceed revenue
      if (monthlyNetIncome < 0) {
        newWarnings.push({
          id: 'negative-net',
          type: 'error',
          message: '⚠️ Your monthly costs exceed revenue. Your business will lose money each month.'
        });
      }
      
      // Check startup funding gap
      if (remainingStartupFunds < 0) {
        newWarnings.push({
          id: 'funding-gap',
          type: 'warning',
          message: `💰 You need an additional ${formatCurrency(Math.abs(remainingStartupFunds), currency)} in funding to cover startup costs.` 
        });
      }
      
      // Check break-even timeline
      if (breakEven.status === 'months' && breakEven.months && breakEven.months > 24) {
        newWarnings.push({
          id: 'long-breakeven',
          type: 'info',
          message: `⏱️ Your break-even timeline (${breakEven.months} months) is quite long. Ensure you have adequate funding runway.` 
        });
      }
      
      // Check for unrealistic values
      startupCostItems.forEach(item => {
        if (item.estimated_amount > 100000 && item.name.includes('phone')) {
          newWarnings.push({
            id: `high-${item.id}`,
            type: 'warning',
            message: `❓ ${formatCurrency(item.estimated_amount, currency)} for "${item.name}" seems unusually high. Please verify.`,
            itemId: item.id
          });
        }
      });
      
      setWarnings(newWarnings);
    }, [monthlyNetIncome, remainingStartupFunds, breakEven, startupCostItems]);
    
    return warnings;
  };

  // Use in component
  const warnings = useBudgetValidation();

  // Chart Data
  const startupChartData = useMemo(() => {
    return startupCostItems
      .map((item) => ({
        name: item.name,
        value: getMonthlyValue(item),
      }))
      .filter((d) => Number.isFinite(d.value) && d.value > 0);
  }, [startupCostItems, getMonthlyValue]);

  const monthlyChartData = useMemo(() => {
    const entries = [
      { name: 'Operating', value: operatingExpenseItems.reduce((sum, item) => sum + getMonthlyValue(item), 0) },
    ];

    return entries.filter((d) => Number.isFinite(d.value) && d.value > 0);
  }, [operatingExpenseItems, getMonthlyValue]);

  const allBudgetItems = useMemo(() => {
    const itemsMap = new Map<string, BudgetItem>();

    const addOrUpdateItem = (item: BudgetItem) => {
      itemsMap.set(item.id, { ...item, isSelected: selectedItemIds.has(item.id) });
    };

    [...startupCostItems, ...operatingExpenseItems, ...otherExpenses].forEach(addOrUpdateItem);
    
    dynamicRevenueStreams.forEach(stream => {
      itemsMap.set(stream.id, {
        id: stream.id,
        name: stream.name,
        category: 'revenue',
        estimated_amount: stream.revenueProjection,
        actual_amount: undefined,
        description: '',
        is_custom: stream.isCustom,
        isSelected: selectedItemIds.has(stream.id),
      });
    });

    return Array.from(itemsMap.values());
  }, [startupCostItems, operatingExpenseItems, otherExpenses, dynamicRevenueStreams, selectedItemIds]);

  const selectedItems = useMemo(() => {
    return allBudgetItems.filter(item => selectedItemIds.has(item.id));
  }, [allBudgetItems, selectedItemIds]);

  // Export PDF
  const handleExportPdf = useCallback(async () => {
    try {
      toast.loading('Generating PDF...', { toastId: 'pdf-export' });
      
      const element = document.getElementById('budget-dashboard-content');
      if (!element) {
        toast.error('Could not find budget content to export', { toastId: 'pdf-export' });
        return;
      }

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
      });

      const imgData = canvas.toDataURL('image/png');
      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;

      const pdf = new jsPDF('p', 'mm', 'a4');
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      const businessName = businessContext?.business_name || 'Business';
      const filename = `${businessName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_budget_${new Date().toISOString().split('T')[0]}.pdf`;
      
      pdf.save(filename);
      
      toast.dismiss('pdf-export');
      toast.success('PDF exported successfully!', { toastId: 'pdf-export-success' });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.dismiss('pdf-export');
      toast.error('Failed to generate PDF. Please try again.', { toastId: 'pdf-export-error' });
    }
  }, [businessContext]);

  // Go to Roadmap
  const handleGoToRoadmap = useCallback(async () => {
    try {
      toast.loading('Loading…', { toastId: 'roadmap-transition' });
      
      const response = await httpClient.post(
        `${import.meta.env.VITE_API_BASE_URL}/angel/sessions/${sessionId}/transition-decision`,
        {
          decision: "approve",
          transition_type: "budget_to_roadmap"
        }
      );
      
      const responseData = response.data as APIResponse<{ roadmap?: any }>;
      
      if (responseData.success) {
        toast.success('Ready!', { toastId: 'roadmap-transition-success' });
        
        if (responseData.result?.roadmap) {
          setTimeout(() => {
            window.location.href = `/ventures/${sessionId}`;
          }, 1000);
        } else {
          toast.error('Failed to transition to roadmap', { toastId: 'roadmap-transition-error' });
        }
      } else {
        toast.error(responseData.message || "Failed to transition to roadmap", { toastId: 'roadmap-transition-error' });
      }
    } catch (error) {
      console.error('Error transitioning to roadmap:', error);
      toast.error('Failed to transition to roadmap', { toastId: 'roadmap-transition-error' });
    }
  }, [sessionId]);

  // Save Budget — only expense items; revenue streams saved separately
  const isSavingRef = useRef(false);

  const handleSaveBudget = useCallback(async () => {
    if (!sessionId || !budget) return;
    if (isSavingRef.current) return;
    isSavingRef.current = true;
    setSaveStatus('saving');

    // Only expense items — revenue is handled by saveRevenueStreams
    const expenseItems: BudgetItem[] = [
      ...startupCostItems, ...operatingExpenseItems, ...otherExpenses
    ];

    // Also include any revenue items already in budget.items so they aren't deleted
    const existingRevenueItems = budget.items.filter(item => item.category === 'revenue');

    const allItemsForSave: BudgetItem[] = [...expenseItems, ...existingRevenueItems];

    try {
        const response = await budgetService.saveBudget(sessionId, {
            ...budget,
            items: allItemsForSave,
        });
        if (response.success && response.result) {
          onUpdateBudget(response.result);
        }
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2500);
    } catch (error) {
        console.error("Failed to save budget:", error);
        setSaveStatus('error');
        setTimeout(() => setSaveStatus('idle'), 3000);
    } finally {
        isSavingRef.current = false;
    }
  }, [sessionId, budget, startupCostItems, operatingExpenseItems, otherExpenses, onUpdateBudget]);

  // No auto-save useEffect here — the parent (Implementation) already
  // debounces a full save to DB whenever handleUpdateBudget is called.
  // Revenue streams are saved separately via saveRevenueStreams API.
  // The manual "Save" button below calls handleSaveBudget directly.

  const handleBudgetUpdate = useCallback((updates: Partial<Budget>) => {
    onUpdateBudget(updates);

    // If initial_investment changed, also persist it via a direct PATCH call
    if (updates.initial_investment !== undefined && sessionId) {
      budgetService.updateBudgetHeader(sessionId, { initial_investment: updates.initial_investment }).catch(
        (err) => console.error('Failed to save initial investment:', err)
      );
    }
  }, [onUpdateBudget, sessionId]);

  // Add this function to BudgetDashboard
  const handleExportExcel = useCallback(async () => {
    try {
      // Install: npm install xlsx
      const XLSX = await import('xlsx');
      
      const wb = XLSX.utils.book_new();
      
      // Summary Sheet
      const summaryData = [
        ['Budget Summary'],
        [''],
        ['Initial Investment', formatCurrency(budget.initial_investment, currency)],
        ['Total Startup Costs', formatCurrency(startupCostsTotal, currency)],
        ['Remaining Funds', formatCurrency(remainingStartupFunds, currency)],
        [''],
        ['Monthly Revenue', formatCurrency(effectiveMonthlyRevenueForBreakEven, currency)],
        ['Monthly Costs', formatCurrency(totalMonthlyCosts, currency)],
        ['Monthly Net Income', formatCurrency(monthlyNetIncome, currency)],
        [''],
        ['Break-Even Point', breakEven.status === 'never' ? 'Never' : `${breakEven.months} months`],
      ];
      const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(wb, summarySheet, 'Summary');
      
      // Startup Costs Sheet
      const startupData = [
        ['Line Item', 'Budget', 'Actual', 'Variance', 'Notes'],
        ...startupCostItems.map(item => [
          item.name,
          item.estimated_amount,
          item.actual_amount || 0,
          (item.estimated_amount - (item.actual_amount || 0)),
          item.description || ''
        ]),
        ['Total', startupCostsTotal, startupActualTotal, startupCostsTotal - startupActualTotal, '']
      ];
      const startupSheet = XLSX.utils.aoa_to_sheet(startupData);
      XLSX.utils.book_append_sheet(wb, startupSheet, 'Startup Costs');
      
      // Revenue Sheet
      const revenueData = [
        ['Revenue Stream', 'Price', 'Volume', 'Projection'],
        ...dynamicRevenueStreams.map(stream => [
          stream.name,
          stream.estimatedPrice,
          stream.estimatedVolume,
          stream.revenueProjection
        ]),
        ['Total', '', '', totalMonthlyRevenue]
      ];
      const revenueSheet = XLSX.utils.aoa_to_sheet(revenueData);
      XLSX.utils.book_append_sheet(wb, revenueSheet, 'Revenue');
      
      // Operating Expenses Sheet
      const operatingData = [
        ['Line Item', 'Budget', 'Actual', 'Variance'],
        ...operatingExpenseItems.map(item => [
          item.name,
          item.estimated_amount,
          item.actual_amount || 0,
          item.estimated_amount - (item.actual_amount || 0)
        ])
      ];
      const operatingSheet = XLSX.utils.aoa_to_sheet(operatingData);
      XLSX.utils.book_append_sheet(wb, operatingSheet, 'Operating');
      
      // Generate filename
      const businessName = businessContext?.business_name || 'Business';
      const filename = `${businessName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_budget_${new Date().toISOString().split('T')[0]}.xlsx`;
      
      // Save file
      XLSX.writeFile(wb, filename);
      toast.success('Excel file exported successfully!');
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      toast.error('Failed to export Excel file');
    }
  }, [budget, startupCostItems, operatingExpenseItems, dynamicRevenueStreams, businessContext, currency, startupCostsTotal, startupActualTotal, remainingStartupFunds, effectiveMonthlyRevenueForBreakEven, totalMonthlyCosts, monthlyNetIncome, breakEven, totalMonthlyRevenue]);

  const getSmartStepForInitialInvestment = useCallback((currentValue: number): number => {
    if (currentValue < 1000) return 100;
    if (currentValue < 10000) return 1000;
    if (currentValue < 100000) return 5000;
    return 10000;
  }, []);

  // Component: Modern Metric Card — teal / blue themed
  const MetricCard = ({ title, value, icon: Icon, trend, subtitle, color = 'blue', delay = 0 }: {
    title: string;
    value: string;
    icon: any;
    trend?: { value: number; label: string };
    subtitle?: string;
    color?: 'blue' | 'green' | 'purple' | 'red' | 'amber';
    delay?: number;
  }) => {
    const colorMap: Record<string, { gradient: string; bg: string; ring: string }> = {
      blue:   { gradient: 'from-teal-500 to-cyan-600',    bg: 'bg-teal-50',    ring: 'ring-teal-200' },
      green:  { gradient: 'from-emerald-500 to-green-600', bg: 'bg-emerald-50', ring: 'ring-emerald-200' },
      purple: { gradient: 'from-teal-500 to-cyan-600',  bg: 'bg-teal-50',    ring: 'ring-teal-200' },
      red:    { gradient: 'from-red-500 to-rose-600',     bg: 'bg-red-50',     ring: 'ring-red-200' },
      amber:  { gradient: 'from-amber-500 to-orange-600', bg: 'bg-amber-50',   ring: 'ring-amber-200' },
    };
    const c = colorMap[color] || colorMap.blue;

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay }}
        whileHover={{ y: -4, scale: 1.02 }}
        className="group"
      >
        <div className={`relative overflow-hidden rounded-2xl bg-white/90 backdrop-blur-md border border-gray-200/60 shadow-md hover:shadow-xl transition-all duration-300 ring-1 ${c.ring}`}>
          {/* decorative blob */}
          <div className={`absolute -top-8 -right-8 w-28 h-28 rounded-full bg-gradient-to-br ${c.gradient} opacity-[0.08] group-hover:scale-125 transition-transform duration-500`} />

          <div className="p-5 relative">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">{title}</p>
              <div className={`p-2.5 rounded-xl bg-gradient-to-br ${c.gradient} shadow-lg shadow-teal-500/10`}>
                <Icon className="w-5 h-5 text-white" />
              </div>
            </div>

            <motion.p
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={{ delay: delay + 0.15, type: 'spring', stiffness: 220 }}
              className="text-2xl font-extrabold text-gray-900 tracking-tight"
            >
              {value}
            </motion.p>

            {subtitle && <p className="text-[11px] text-gray-500 mt-1">{subtitle}</p>}

            {trend && (
              <div className={`mt-3 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                trend.value >= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
              }`}>
                {trend.value >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {Math.abs(trend.value)}% <span className="font-normal text-gray-500 ml-1">{trend.label}</span>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    );
  };

  // Budget Introduction — teal / blue themed (memoised JSX to prevent re-mount flicker)
  const budgetIntroductionEl = useMemo(() => (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="mb-10"
    >
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-teal-600 via-teal-700 to-cyan-800 p-10 shadow-2xl">
        {/* Background decorative elements */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-white/[0.06] rounded-full -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-0 w-56 h-56 bg-white/[0.04] rounded-full -ml-16 -mb-16" />
        <div className="absolute top-1/2 right-1/4 w-32 h-32 bg-cyan-400/10 rounded-full blur-2xl" />

        <div className="relative z-10 flex items-start gap-5 mb-8">
          <motion.div
            whileHover={{ rotate: 12, scale: 1.1 }}
            className="flex-shrink-0 p-4 bg-white/15 backdrop-blur-sm rounded-2xl border border-white/20 shadow-lg"
          >
            <Sparkles className="w-9 h-9 text-white" />
          </motion.div>
          <div>
            <h2 className="text-3xl md:text-4xl font-extrabold text-white leading-tight mb-3">
              Budgeting: Understand What It Takes
            </h2>
            <p className="text-teal-100 text-base md:text-lg leading-relaxed max-w-2xl">
              Starting a business isn't just about having a good idea — it's about understanding what it will actually cost to make it work. This is a first-cut budget based on your inputs so far.
            </p>
          </div>
        </div>

        <div className="relative z-10 grid md:grid-cols-3 gap-5">
          {[
            {
              icon: Target,
              title: 'Business Budgeting',
              desc: 'Organized into startup costs, monthly revenue, and monthly expenses — together showing your capital needs and break-even timeline.',
              accent: 'from-teal-400 to-cyan-400',
              border: 'border-teal-400/30',
            },
            {
              icon: Zap,
              title: 'A Living Budget',
              desc: "This isn't a spreadsheet you finish once. Add or remove line items, adjust assumptions, and come back anytime during implementation.",
              accent: 'from-cyan-400 to-blue-400',
              border: 'border-cyan-400/30',
            },
            {
              icon: Award,
              title: 'Guided by Angel',
              desc: 'Angel sees your budget and business plan together — here to sanity-check numbers, challenge assumptions, and dial things in.',
              accent: 'from-teal-400 to-cyan-400',
              border: 'border-blue-400/30',
            },
          ].map((card, i) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 * (i + 1), duration: 0.45 }}
              whileHover={{ y: -3 }}
              className={`bg-white/10 backdrop-blur-md rounded-2xl p-6 border ${card.border} hover:bg-white/[0.15] transition-all duration-300`}
            >
              <div className={`inline-flex p-2.5 rounded-xl bg-gradient-to-r ${card.accent} mb-4 shadow-md`}>
                <card.icon className="w-5 h-5 text-white" />
              </div>
              <h3 className="font-bold text-white text-base mb-2">{card.title}</h3>
              <p className="text-sm text-teal-100/90 leading-relaxed">{card.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  ), []); // static content — no deps needed

  // Startup Budget Summary — teal themed (memoised)
  const startupBudgetSummaryEl = useMemo(() => (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-teal-600 via-teal-700 to-cyan-800 text-white shadow-xl">
        {/* decorative circles */}
        <div className="absolute top-0 right-0 w-56 h-56 bg-white/[0.06] rounded-full -mr-24 -mt-24" />
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-white/[0.04] rounded-full -ml-16 -mb-16" />

        <div className="relative z-10 p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-white/15 backdrop-blur-sm rounded-xl border border-white/20">
              <Calculator className="w-7 h-7 text-white" />
            </div>
            <h3 className="text-2xl font-bold tracking-tight">Startup Budget Summary</h3>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            <UITooltip>
              <TooltipTrigger asChild>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-5 border border-white/15 hover:bg-white/[0.14] transition-colors cursor-help">
                  <p className="text-xs font-semibold uppercase tracking-wider text-teal-200 mb-2">Initial Investment</p>
                  <p className="text-3xl font-extrabold">{formatCurrency(budget.initial_investment, currency)}</p>
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom">Total capital you're putting into the business</TooltipContent>
            </UITooltip>

            <UITooltip>
              <TooltipTrigger asChild>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-5 border border-white/15 hover:bg-white/[0.14] transition-colors cursor-help">
                  <p className="text-xs font-semibold uppercase tracking-wider text-teal-200 mb-2">Total Startup Costs</p>
                  <p className="text-3xl font-extrabold">{formatCurrency(startupCostsTotal, currency)}</p>
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom">Sum of all budgeted startup cost line items</TooltipContent>
            </UITooltip>

            <UITooltip>
              <TooltipTrigger asChild>
                <div className={`backdrop-blur-sm rounded-xl p-5 border-2 transition-colors cursor-help ${
                  remainingStartupFunds >= 0
                    ? 'bg-emerald-500/20 border-emerald-300/50 hover:bg-emerald-500/25'
                    : 'bg-red-500/20 border-red-300/50 hover:bg-red-500/25'
                }`}>
                  <div className="flex items-center gap-2 mb-2">
                    {remainingStartupFunds >= 0 ? <CheckCircle2 className="w-4 h-4 text-emerald-300" /> : <AlertCircle className="w-4 h-4 text-red-300" />}
                    <p className="text-xs font-semibold uppercase tracking-wider text-white/80">
                      {remainingStartupFunds >= 0 ? 'Available Funds' : 'Funding Gap'}
                    </p>
                  </div>
                  <p className="text-3xl font-extrabold">{formatCurrency(Math.abs(remainingStartupFunds), currency)}</p>
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom">{remainingStartupFunds >= 0 ? 'Investment − Startup Costs = funds remaining' : 'Your startup costs exceed your investment — you need more capital'}</TooltipContent>
            </UITooltip>
          </div>

          {remainingStartupFunds < 0 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-5 p-4 bg-red-500/25 backdrop-blur-sm rounded-xl border border-red-300/40 flex items-start gap-3"
            >
              <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-200" />
              <div>
                <p className="font-semibold text-sm mb-0.5">Additional Funding Required</p>
                <p className="text-xs text-white/80">Consider: personal savings, loans, investors, or grants to cover the funding gap.</p>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  ), [budget.initial_investment, startupCostsTotal, remainingStartupFunds, currency]);

  // Break-Even Analysis Card — teal themed (memoised)
  const breakEvenEl = useMemo(() => {
    const isPositive = monthlyNetIncome > 0;
    const breakEvenMonths = breakEven.months || 0;
    const breakEvenYears = breakEven.years;

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.15 }}
      >
        <div className="rounded-2xl bg-white/90 backdrop-blur-md border border-gray-200/60 shadow-lg overflow-hidden">
          {/* Header */}
          <div className="px-7 py-5 bg-gradient-to-r from-teal-50 to-cyan-50 border-b border-gray-200/60">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-xl shadow-md">
                <Target className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">Break-Even Analysis</h3>
                <p className="text-xs text-gray-500 mt-0.5">When will you recoup your investment?</p>
              </div>
            </div>
          </div>

          <div className="p-7 space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Left: Financial summary */}
              <div className="space-y-3">
                {[
                  { label: 'Monthly Revenue', value: effectiveMonthlyRevenueForBreakEven, color: 'text-emerald-600' },
                  { label: 'Monthly Costs', value: totalMonthlyCosts, color: 'text-red-500' },
                ].map((row) => (
                  <div key={row.label} className="flex items-center justify-between p-4 bg-gray-50/80 rounded-xl border border-gray-100">
                    <span className="text-sm font-medium text-gray-600">{row.label}</span>
                    <span className={`text-lg font-bold ${row.color}`}>{formatCurrency(row.value, currency)}</span>
                  </div>
                ))}

                <div className={`flex items-center justify-between p-4 rounded-xl border-2 ${
                  isPositive ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'
                }`}>
                  <span className="text-sm font-semibold text-gray-700">Monthly Net Income</span>
                  <span className={`text-xl font-extrabold ${isPositive ? 'text-emerald-600' : 'text-red-600'}`}>
                    {formatCurrency(monthlyNetIncome, currency)}
                  </span>
                </div>
              </div>

              {/* Right: Timeline badge */}
              <div className={`relative p-6 rounded-2xl border-2 flex flex-col justify-center ${
                breakEven.status === 'never'
                  ? 'bg-red-50 border-red-200'
                  : breakEvenMonths <= 12
                  ? 'bg-emerald-50 border-emerald-200'
                  : breakEvenMonths <= 24
                  ? 'bg-amber-50 border-amber-200'
                  : 'bg-orange-50 border-orange-200'
              }`}>
                <div className="flex items-center gap-2 mb-3">
                  {breakEven.status === 'never' ? (
                    <XCircle className="w-7 h-7 text-red-500" />
                  ) : breakEvenMonths <= 12 ? (
                    <CheckCircle2 className="w-7 h-7 text-emerald-500" />
                  ) : (
                    <Clock className="w-7 h-7 text-amber-500" />
                  )}
                  <h4 className="text-base font-bold text-gray-900">Break-Even Timeline</h4>
                </div>

                {breakEven.status === 'never' ? (
                  <>
                    <p className="text-4xl font-extrabold text-red-600 mb-1">Never</p>
                    <p className="text-xs text-gray-600 leading-relaxed">Revenue doesn't cover monthly costs. Adjust pricing or reduce expenses.</p>
                  </>
                ) : (
                  <>
                    <div className="flex items-baseline gap-1.5 mb-1">
                      <p className="text-5xl font-extrabold text-gray-900">{breakEvenMonths}</p>
                      <p className="text-xl text-gray-500 font-medium">months</p>
                    </div>
                    {breakEvenYears && <p className="text-sm text-gray-500 mb-1">({breakEvenYears.toFixed(1)} years)</p>}
                    <p className="text-xs text-gray-600">
                      {breakEvenMonths <= 12 ? 'Excellent! Quick path to profitability.' : breakEvenMonths <= 24 ? 'Manageable with sufficient runway.' : 'Ensure adequate funding for this timeline.'}
                    </p>
                  </>
                )}
              </div>
            </div>

            {breakEven.status === 'never' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-red-800 text-sm mb-0.5">Action Required</p>
                  <p className="text-xs text-red-700">Review your pricing strategy or reduce operating costs to achieve sustainability.</p>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </motion.div>
    );
  }, [effectiveMonthlyRevenueForBreakEven, totalMonthlyCosts, monthlyNetIncome, breakEven, currency]);

  // Modern Charts — teal themed (memoised)
  const modernChartsEl = useMemo(() => (
    <div className="grid md:grid-cols-2 gap-6">
      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.45 }}>
        <div className="rounded-2xl bg-white/90 backdrop-blur-md border border-gray-200/60 shadow-lg overflow-hidden">
          <div className="px-6 py-4 bg-gradient-to-r from-teal-50 to-cyan-50 border-b border-gray-200/60 flex items-center gap-2">
            <PieChartIcon className="w-5 h-5 text-teal-600" />
            <h3 className="font-bold text-gray-900">Startup Costs Breakdown</h3>
          </div>
          <div className="p-6">
            {startupChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <RechartsPieChart>
                  <Tooltip
                    formatter={(value: any) => formatCurrency(Number(value), currency)}
                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '10px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px' }} iconType="circle" />
                  <Pie data={startupChartData} cx="50%" cy="50%" labelLine={false} outerRadius={95} innerRadius={40} paddingAngle={2}>
                    {startupChartData.map((_entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS.chart.startup[index % COLORS.chart.startup.length]} />
                    ))}
                  </Pie>
                </RechartsPieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-56 text-gray-400 text-sm">No startup cost data available</div>
            )}
          </div>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.45, delay: 0.1 }}>
        <div className="rounded-2xl bg-white/90 backdrop-blur-md border border-gray-200/60 shadow-lg overflow-hidden">
          <div className="px-6 py-4 bg-gradient-to-r from-cyan-50 to-blue-50 border-b border-gray-200/60 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            <h3 className="font-bold text-gray-900">Monthly Costs Distribution</h3>
          </div>
          <div className="p-6">
            {monthlyChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={monthlyChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="#9ca3af" />
                  <YAxis tick={{ fontSize: 11 }} stroke="#9ca3af" tickFormatter={(v) => `${currency}${(v / 1000).toFixed(0)}k`} />
                  <Tooltip
                    formatter={(value: any) => formatCurrency(Number(value), currency)}
                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '10px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}
                  />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                    {monthlyChartData.map((_entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS.chart.monthly[index % COLORS.chart.monthly.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-56 text-gray-400 text-sm">No monthly cost data available</div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  ), [startupChartData, monthlyChartData]);

  return (
    <div id="budget-dashboard-content" className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-teal-50/30 pb-20">
      {/* Budget Introduction */}
      {budgetIntroductionEl}

      {/* Header Section */}
      <BudgetDashboardHeader
        viewMode={viewMode}
        setViewMode={setViewMode}
        saveStatus={saveStatus}
        handleSaveBudget={handleSaveBudget}
        handleExportPdf={handleExportPdf}
        handleExportExcel={handleExportExcel}
        budget={budget}
        onContinueToRoadmap={handleGoToRoadmap}
        onChatWithAngel={() => setIsChatModalOpen(true)}
      />

      {/* Selected Items Banner */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SelectedItemsBanner
          selectedItemIds={selectedItemIds}
          onChatOpen={() => setIsChatModalOpen(true)}
        />
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Startup Budget Summary */}
        {startupBudgetSummaryEl}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="bg-white/80 backdrop-blur-md p-1.5 shadow-md rounded-2xl border border-gray-200/60 inline-flex gap-1">
            <UITooltip>
              <TooltipTrigger asChild>
                <TabsTrigger
                  value="overview"
                  className="px-5 py-2.5 rounded-xl text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-teal-500 data-[state=active]:to-cyan-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all font-semibold"
                >
                  <PieChartIcon className="w-4 h-4 mr-2" />
                  Overview
                </TabsTrigger>
              </TooltipTrigger>
              <TooltipContent side="bottom">Budget summary, charts, and break-even analysis at a glance</TooltipContent>
            </UITooltip>
            <UITooltip>
              <TooltipTrigger asChild>
                <TabsTrigger
                  value="manage"
                  className="px-5 py-2.5 rounded-xl text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-teal-500 data-[state=active]:to-cyan-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all font-semibold"
                >
                  <Edit2 className="w-4 h-4 mr-2" />
                  Manage Items
                </TabsTrigger>
              </TooltipTrigger>
              <TooltipContent side="bottom">Add, edit, and remove budget line items across all categories</TooltipContent>
            </UITooltip>
            <UITooltip>
              <TooltipTrigger asChild>
                <TabsTrigger
                  value="analysis"
                  className="px-5 py-2.5 rounded-xl text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-teal-500 data-[state=active]:to-cyan-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all font-semibold"
                >
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Analysis
                </TabsTrigger>
              </TooltipTrigger>
              <TooltipContent side="bottom">Break-even timeline, charts, and 2-year financial projections</TooltipContent>
            </UITooltip>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="mt-8 space-y-8">
            <BudgetOverview
              warnings={warnings}
              startupCostsTotal={startupCostsTotal}
              effectiveMonthlyRevenueForBreakEven={effectiveMonthlyRevenueForBreakEven}
              totalMonthlyCosts={totalMonthlyCosts}
              monthlyNetIncome={monthlyNetIncome}
              currency={currency}
              formatCurrency={formatCurrency}
              breakEvenCard={breakEvenEl}
              modernCharts={modernChartsEl}
            />

            {/* Budget Tables */}
            <div className="space-y-6">
              {/* Startup Costs */}
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
                <div className="rounded-2xl bg-white/90 backdrop-blur-md border border-gray-200/60 shadow-lg overflow-hidden">
                  <div className="px-6 py-4 bg-gradient-to-r from-teal-50 to-cyan-50 border-b border-gray-200/60 flex items-center gap-3">
                    <div className="p-2 bg-teal-100 rounded-lg"><DollarSign className="w-5 h-5 text-teal-600" /></div>
                    <h3 className="font-bold text-gray-900">Startup Costs <span className="text-gray-500 font-normal text-sm">(One-Time, Pre-Launch)</span></h3>
                    <UITooltip>
                      <TooltipTrigger asChild><HelpCircle className="w-4 h-4 text-gray-400 hover:text-teal-500 cursor-help transition-colors" /></TooltipTrigger>
                      <TooltipContent side="right" className="max-w-[280px]">One-time expenses needed before you can launch — like registration, equipment, and branding</TooltipContent>
                    </UITooltip>
                  </div>
                  <div className="p-6">
                    <TableSelectionControls items={[...startupCostItems, ...otherExpenses]} selectedItemIds={selectedItemIds} onToggleAll={(s) => onToggleSectionSelection([...startupCostItems, ...otherExpenses].map(i => i.id), s)} sectionName="Startup Costs" />
                    <StartupCostsTable
                      items={[...startupCostItems, ...otherExpenses]}
                      onChange={(next) => handleBudgetUpdate({ items: [...next, ...operatingExpenseItems, ...revenues] })}
                      currency={currency} selectedItemIds={selectedItemIds} onToggleItemSelection={onToggleItemSelection}
                      onToggleAllSelection={(s) => onToggleSectionSelection([...startupCostItems, ...otherExpenses].map(i => i.id), s)}
                      onAddLineItem={openAddLineItemModal} onRemoveItem={openRemoveModal}
                    />
                  </div>
                </div>
              </motion.div>

              {/* Startup Funds */}
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.05 }}>
                <div className="rounded-2xl bg-white/90 backdrop-blur-md border border-gray-200/60 shadow-lg overflow-hidden">
                  <div className="px-6 py-4 bg-gradient-to-r from-emerald-50 to-teal-50 border-b border-gray-200/60 flex items-center gap-3">
                    <div className="p-2 bg-emerald-100 rounded-lg"><DollarSign className="w-5 h-5 text-emerald-600" /></div>
                    <h3 className="font-bold text-gray-900">Startup Funds <span className="text-gray-500 font-normal text-sm">(Initial Investment)</span></h3>
                    <UITooltip>
                      <TooltipTrigger asChild><HelpCircle className="w-4 h-4 text-gray-400 hover:text-emerald-500 cursor-help transition-colors" /></TooltipTrigger>
                      <TooltipContent side="right" className="max-w-[280px]">How much money you have to start. Remaining = Investment − Startup Costs spent so far</TooltipContent>
                    </UITooltip>
                  </div>
                  <div className="p-6 space-y-4">
                    <div className="p-4 bg-gray-50/80 rounded-xl border border-gray-100">
                      <div className="flex items-center gap-1.5 mb-2">
                        <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Initial Investment</p>
                        <UITooltip>
                          <TooltipTrigger asChild><HelpCircle className="w-3.5 h-3.5 text-gray-400 hover:text-teal-500 cursor-help" /></TooltipTrigger>
                          <TooltipContent side="right" className="max-w-[240px]">Total capital you're putting into the business to get started</TooltipContent>
                        </UITooltip>
                      </div>
                      <CurrencyInput value={budget.initial_investment} onChange={(v) => handleBudgetUpdate({ initial_investment: v })} min={0} step={100} getSmartStep={getSmartStepForInitialInvestment} className="w-full text-2xl font-bold" />
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="p-4 bg-teal-50/60 rounded-xl border border-teal-200/60">
                        <div className="flex items-center gap-1.5 mb-1">
                          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Expenses To Date</p>
                          <UITooltip>
                            <TooltipTrigger asChild><HelpCircle className="w-3.5 h-3.5 text-gray-400 hover:text-teal-500 cursor-help" /></TooltipTrigger>
                            <TooltipContent side="right" className="max-w-[240px]">Sum of all actual amounts entered in Startup Costs above</TooltipContent>
                          </UITooltip>
                        </div>
                        <p className="text-2xl font-extrabold text-teal-700">{formatCurrency(startupActualTotal, currency)}</p>
                      </div>
                      <div className={`p-4 rounded-xl border ${remainingStartupFunds >= 0 ? 'bg-emerald-50/60 border-emerald-200/60' : 'bg-red-50/60 border-red-200/60'}`}>
                        <div className="flex items-center gap-1.5 mb-1">
                          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Remaining Funds</p>
                          <UITooltip>
                            <TooltipTrigger asChild><HelpCircle className="w-3.5 h-3.5 text-gray-400 hover:text-teal-500 cursor-help" /></TooltipTrigger>
                            <TooltipContent side="right" className="max-w-[240px]">Initial Investment − Expenses To Date. Red if overspent</TooltipContent>
                          </UITooltip>
                        </div>
                        <p className={`text-2xl font-extrabold ${remainingStartupFunds >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{formatCurrency(remainingStartupFunds, currency)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Monthly Revenue */}
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}>
                <div className="rounded-2xl bg-white/90 backdrop-blur-md border border-gray-200/60 shadow-lg overflow-hidden">
                  <div className="px-6 py-4 bg-gradient-to-r from-emerald-50 to-green-50 border-b border-gray-200/60 flex items-center gap-3">
                    <div className="p-2 bg-emerald-100 rounded-lg"><TrendingUp className="w-5 h-5 text-emerald-600" /></div>
                    <h3 className="font-bold text-gray-900">Monthly Revenue Projection</h3>
                    <UITooltip>
                      <TooltipTrigger asChild><HelpCircle className="w-4 h-4 text-gray-400 hover:text-emerald-500 cursor-help transition-colors" /></TooltipTrigger>
                      <TooltipContent side="right" className="max-w-[280px]">Projected monthly income. Price × Volume = Revenue per stream. Total feeds into break-even analysis</TooltipContent>
                    </UITooltip>
                  </div>
                  <div className="p-6">
                    {loadingRevenueStreams ? (
                      <div className="flex items-center justify-center py-12"><Loader className="animate-spin w-7 h-7 text-teal-600" /></div>
                    ) : (
                      <RevenueTable items={dynamicRevenueStreams} onRevenueStreamsChange={handleRevenueStreamsChange} onTotalMonthlyRevenueChange={setTotalMonthlyRevenue} currency={currency} selectedItemIds={selectedItemIds} onToggleItemSelection={onToggleItemSelection} onToggleAllSelection={(ids, s) => onToggleSectionSelection(ids, s)} onAddLineItem={openAddLineItemModal} />
                    )}
                  </div>
                </div>
              </motion.div>

              {/* Monthly Operating Expenses */}
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.15 }}>
                <div className="rounded-2xl bg-white/90 backdrop-blur-md border border-gray-200/60 shadow-lg overflow-hidden">
                  <div className="px-6 py-4 bg-gradient-to-r from-amber-50 to-yellow-50 border-b border-gray-200/60 flex items-center gap-3">
                    <div className="p-2 bg-amber-100 rounded-lg"><Calendar className="w-5 h-5 text-amber-600" /></div>
                    <h3 className="font-bold text-gray-900">Monthly Operating Expenses <span className="text-gray-500 font-normal text-sm">(Post-Launch)</span></h3>
                    <UITooltip>
                      <TooltipTrigger asChild><HelpCircle className="w-4 h-4 text-gray-400 hover:text-amber-500 cursor-help transition-colors" /></TooltipTrigger>
                      <TooltipContent side="right" className="max-w-[280px]">Recurring monthly costs to keep your business running — rent, marketing, software, etc.</TooltipContent>
                    </UITooltip>
                  </div>
                  <div className="p-6">
                    <OperatingExpensesTable items={operatingExpenseItems} onChange={(next) => handleBudgetUpdate({ items: [...startupCostItems, ...otherExpenses, ...next, ...revenues] })} currency={currency} selectedItemIds={selectedItemIds} onToggleItemSelection={onToggleItemSelection} onToggleAllSelection={(s) => onToggleSectionSelection(operatingExpenseItems.map(i => i.id), s)} onAddLineItem={openAddLineItemModal} onRemoveItem={openRemoveModal} />
                  </div>
                </div>
              </motion.div>
            </div>
          </TabsContent>

          {/* Manage Tab */}
          <TabsContent value="manage" className="mt-8 space-y-6">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold text-gray-900 mb-1">Manage Your Budget Items</h3>
              <p className="text-sm text-gray-500">Add, edit and remove line items across all budget categories</p>
            </div>

            <div className="space-y-6">
              {/* Startup Costs Management */}
              <div className="rounded-2xl bg-white/90 backdrop-blur-md border border-gray-200/60 shadow-lg overflow-hidden">
                <div className="px-6 py-4 bg-gradient-to-r from-teal-50 to-cyan-50 border-b border-gray-200/60">
                  <h3 className="font-bold text-gray-900">Startup Costs</h3>
                </div>
                <div className="p-6">
                  <StartupCostsTable items={[...startupCostItems, ...otherExpenses]} onChange={(next) => handleBudgetUpdate({ items: [...next, ...operatingExpenseItems, ...revenues] })} currency={currency} selectedItemIds={selectedItemIds} onToggleItemSelection={onToggleItemSelection} onToggleAllSelection={(s) => onToggleSectionSelection([...startupCostItems, ...otherExpenses].map(i => i.id), s)} onAddLineItem={openAddLineItemModal} onRemoveItem={openRemoveModal} />
                </div>
              </div>

              {/* Revenue Management */}
              <div className="rounded-2xl bg-white/90 backdrop-blur-md border border-gray-200/60 shadow-lg overflow-hidden">
                <div className="px-6 py-4 bg-gradient-to-r from-emerald-50 to-green-50 border-b border-gray-200/60">
                  <h3 className="font-bold text-gray-900">Monthly Revenue</h3>
                </div>
                <div className="p-6">
                  {loadingRevenueStreams ? (
                    <div className="flex items-center justify-center py-12"><Loader className="animate-spin w-7 h-7 text-teal-600" /></div>
                  ) : (
                    <RevenueTable items={dynamicRevenueStreams} onRevenueStreamsChange={handleRevenueStreamsChange} onTotalMonthlyRevenueChange={setTotalMonthlyRevenue} currency={currency} selectedItemIds={selectedItemIds} onToggleItemSelection={onToggleItemSelection} onToggleAllSelection={(ids, s) => onToggleSectionSelection(ids, s)} onAddLineItem={openAddLineItemModal} />
                  )}
                </div>
              </div>

              {/* Operating Expenses Management */}
              <div className="rounded-2xl bg-white/90 backdrop-blur-md border border-gray-200/60 shadow-lg overflow-hidden">
                <div className="px-6 py-4 bg-gradient-to-r from-amber-50 to-yellow-50 border-b border-gray-200/60">
                  <h3 className="font-bold text-gray-900">Monthly Operating Expenses</h3>
                </div>
                <div className="p-6">
                  <OperatingExpensesTable items={operatingExpenseItems} onChange={(next) => handleBudgetUpdate({ items: [...startupCostItems, ...otherExpenses, ...next, ...revenues] })} currency={currency} selectedItemIds={selectedItemIds} onToggleItemSelection={onToggleItemSelection} onToggleAllSelection={(s) => onToggleSectionSelection(operatingExpenseItems.map(i => i.id), s)} onAddLineItem={openAddLineItemModal} onRemoveItem={openRemoveModal} />
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Analysis Tab */}
          <TabsContent value="analysis" className="mt-8 space-y-6">
            {/* Break-Even Analysis */}
            {breakEvenEl}

            {/* Charts */}
            {modernChartsEl}

            {/* 2-Year Projection */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
              <div className="rounded-2xl bg-white/90 backdrop-blur-md border border-gray-200/60 shadow-lg overflow-hidden">
                <div className="px-6 py-4 bg-gradient-to-r from-teal-50 to-cyan-50 border-b border-gray-200/60 flex items-center gap-3">
                  <div className="p-2 bg-teal-100 rounded-lg"><Calendar className="w-5 h-5 text-teal-600" /></div>
                  <div>
                    <h3 className="font-bold text-gray-900">2-Year Financial Projection</h3>
                    <p className="text-xs text-gray-500">Revenue, costs, and net profit forecast</p>
                  </div>
                </div>
                <div className="p-6">
                  <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="p-4 bg-emerald-50/60 rounded-xl border border-emerald-200/60">
                      <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">24-Month Revenue</p>
                      <p className="text-2xl font-extrabold text-emerald-600">{formatCurrency(twoYearProjection.revenue24, currency)}</p>
                    </div>
                    <div className="p-4 bg-red-50/60 rounded-xl border border-red-200/60">
                      <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">24-Month Costs</p>
                      <p className="text-2xl font-extrabold text-red-600">{formatCurrency(twoYearProjection.costs24, currency)}</p>
                    </div>
                    <div className={`p-4 rounded-xl border ${twoYearProjection.net24 >= 0 ? 'bg-teal-50/60 border-teal-200/60' : 'bg-orange-50/60 border-orange-200/60'}`}>
                      <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">24-Month Net</p>
                      <p className={`text-2xl font-extrabold ${twoYearProjection.net24 >= 0 ? 'text-teal-600' : 'text-orange-600'}`}>{formatCurrency(twoYearProjection.net24, currency)}</p>
                    </div>
                    <div className={`p-4 rounded-xl border ${twoYearProjection.netAfterStartup24 >= 0 ? 'bg-emerald-50/60 border-emerald-200/60' : 'bg-red-50/60 border-red-200/60'}`}>
                      <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">Net After Startup</p>
                      <p className={`text-2xl font-extrabold ${twoYearProjection.netAfterStartup24 >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{formatCurrency(twoYearProjection.netAfterStartup24, currency)}</p>
                    </div>
                  </div>
                  <div className="mt-5 p-3 bg-gray-50/80 rounded-lg border border-gray-100 text-xs text-gray-500">
                    <strong className="text-gray-600">Formula:</strong> (24-month revenue − 24-month operating costs) − total startup costs
                  </div>
                </div>
              </div>
            </motion.div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Modals */}
      {isChatModalOpen && (
        <BudgetChatModal
          isOpen={isChatModalOpen}
          onClose={() => setIsChatModalOpen(false)}
          sessionId={sessionId}
          selectedItems={selectedItems}
          allBudgetItems={allBudgetItems}
          businessContext={businessContext}
          businessPlanSummary={String((businessContext as any)?.business_plan_summary || (businessContext as any)?.businessPlanSummary || '')}
        />
      )}

      <AddLineItemModal
          isOpen={isAddLineItemModalOpen}
          onClose={closeAddLineItemModal}
          onAddExpenseItem={async (item) => {
            const sub = addLineItemCategory !== 'revenue' ? addLineItemCategory ?? undefined : undefined;
            await handleAddItem(item, sub);
          }}
          onAddRevenueStream={async (payload) => {
            const id = `custom-${payload.name.trim().toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`;
            const projection = payload.estimatedPrice * payload.estimatedVolume;

            const newStream: RevenueStream = {
              id,
              name: payload.name,
              estimatedPrice: payload.estimatedPrice,
              estimatedVolume: payload.estimatedVolume,
              revenueProjection: projection,
              isSelected: true,
              isCustom: true,
              category: 'revenue',
            };

            const next = [...dynamicRevenueStreams, newStream];
            setDynamicRevenueStreams(next);
            setTotalMonthlyRevenue(
              next.filter((s) => s.isSelected).reduce((sum, s) => sum + s.revenueProjection, 0)
            );
            // Save ALL revenue streams to DB immediately and await it
            await saveRevenueStreamsDirect(next);
          }}
          category={addLineItemCategory || 'startup_cost'}
          existingItems={
            addLineItemCategory === 'revenue'
              ? dynamicRevenueStreams
              : budget.items.filter((item) => {
                  const group = classifyExpenseGroup(item);
                  return (
                    (group === 'startup' && addLineItemCategory === 'startup_cost') ||
                    (group === 'operating' && addLineItemCategory === 'operating_expense')
                  );
                })
          }
          currency={currency}
        />

      <RemoveItemModal
        isOpen={removeModalState.isOpen}
        onClose={closeRemoveModal}
        onConfirm={confirmRemoveItem}
        itemName={removeModalState.itemName}
        isCustom={removeModalState.isCustom}
      />
      
      {/* Roadmap CTA is now in the BudgetDashboardHeader */}
    </div>
  );
};

export default BudgetDashboard;