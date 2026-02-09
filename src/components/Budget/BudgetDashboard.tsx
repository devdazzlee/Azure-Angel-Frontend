import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  FileText
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line, Area, AreaChart } from 'recharts';
import type { BudgetItem, Budget, APIResponse } from '@/types/apiTypes'; 
import StartupCostsTable from './StartupCostsTable';
import { TableSelectionControls } from './TableSelectionControls';
import OperatingExpensesTable from './OperatingExpensesTable';
import PayrollCostsTable from './PayrollCostsTable';
import COGSTable from './COGSTable';
import RevenueTable from './RevenueTable';
import { CurrencyInput } from './CurrencyInput'; 
import { budgetService } from '@/services/budgetService';
import { toast } from 'react-toastify';
import httpClient from '../../api/httpClient';
import BudgetChatModal from './BudgetChatModal';
import AddLineItemModal from './AddLineItemModal'; 
import RemoveItemModal from './RemoveItemModal'; 
import SaveStatusIndicator, { type SaveStatus } from '../ui/SaveStatusIndicator'; 
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
}

// Utility Functions
const debounce = <T extends (...args: any[]) => void>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

const formatCurrency = (value: number, currency: string = '$') => {
  return `${currency}${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const formatMoney = (value: number, currency: string = '$') => {
  return formatCurrency(value, currency);
};

// Modern Color Palette
const COLORS = {
  primary: '#6366f1', // Indigo
  secondary: '#8b5cf6', // Purple
  success: '#10b981', // Emerald
  danger: '#ef4444', // Red
  warning: '#f59e0b', // Amber
  info: '#3b82f6', // Blue
  chart: {
    startup: ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#fb923c', '#fbbf24', '#a3e635', '#4ade80'],
    monthly: ['#3b82f6', '#06b6d4', '#14b8a6', '#10b981', '#84cc16', '#eab308', '#f97316', '#ef4444'],
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
  const [addLineItemCategory, setAddLineItemCategory] = useState<'startup_cost' | 'operating_expense' | 'payroll' | 'cogs' | 'revenue' | null>(null);
  
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
  const openAddLineItemModal = (category: 'startup_cost' | 'operating_expense' | 'payroll' | 'cogs' | 'revenue') => {
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

  const handleDeleteItem = useCallback(async (id: string) => {
    const item = budget.items.find((i) => i.id === id);
    const name = item?.name || 'this item';
    if (window.confirm(`Are you sure you want to remove "${name}"? This action cannot be undone.`)) {
      try {
        await onDeleteItem(id);
        toast.success(`"${name}" removed successfully`);
      } catch (error) {
        console.error('Error deleting item:', error);
        toast.error('Failed to remove item');
      }
    }
  }, [budget.items, onDeleteItem]);

  const handleAddItem = useCallback(async (item: Omit<BudgetItem, 'id' | 'created_at' | 'updated_at'>): Promise<BudgetItem> => {
    if (!sessionId) {
      toast.error("Session ID is missing, cannot add item.");
      throw new Error("Session ID is missing.");
    }
    try {
      const response: APIResponse<Budget> = await budgetService.addBudgetItem(sessionId, item);
      if (response.success && response.result) {
        const addedItem = response.result.items[response.result.items.length - 1];
        onUpdateBudget(response.result);
        toast.success(`Item "${addedItem.name}" added successfully!`);
        return addedItem;
      } else {
        toast.error(response.message || "Failed to add budget item.");
        throw new Error(response.message || "Failed to add budget item.");
      }
    } catch (error) {
      console.error("Error adding budget item:", error);
      toast.error("An unexpected error occurred while adding the budget item.");
      throw error;
    }
  }, [sessionId, onUpdateBudget]);

  const saveRevenueStreamsDebounced = useCallback(
    debounce(async (streamsToSave: RevenueStream[]) => {
      if (sessionId) {
        try {
          await budgetService.saveRevenueStreams(sessionId, streamsToSave);
          console.log("Revenue streams saved successfully!");
        } catch (error) {
          console.error("Failed to save revenue streams:", error);
        }
      }
    }, 1000),
    [sessionId]
  );

  // Load Revenue Streams
  useEffect(() => {
    const fetchInitialRevenueStreams = async () => {
      if (sessionId && businessType) {
        setLoadingRevenueStreams(true);
        try {
          const response = await budgetService.generateInitialRevenueStreams(sessionId);
          if (response.success) {
            const apiGeneratedStreams: RevenueStream[] = response.result.map((stream: any, index: number) => ({
              ...stream,
              id: `api-${String(stream.name || 'stream').trim().toLowerCase().replace(/\s+/g, '-')}-${index}`,
              estimatedPrice: stream.estimated_price,
              estimatedVolume: stream.estimated_volume,
              revenueProjection: stream.estimated_price * stream.estimated_volume,
              isSelected: true,
              isCustom: false,
            }));

            const savedRevenueItems = budget.items.filter(item => item.category === 'revenue');
            
            const hydratedStreams: RevenueStream[] = apiGeneratedStreams.map(apiStream => {
              const savedMatch = savedRevenueItems.find(savedItem => savedItem.name === apiStream.name);
              if (savedMatch) {
                return {
                  ...apiStream,
                  id: savedMatch.id || apiStream.id,
                  estimatedPrice: savedMatch.estimated_amount,
                  estimatedVolume: savedMatch.estimated_amount / (apiStream.estimatedPrice || 1),
                  revenueProjection: savedMatch.estimated_amount,
                  isSelected: savedMatch.isSelected !== undefined ? savedMatch.isSelected : true,
                  isCustom: savedMatch.is_custom || false,
                };
              }
              return apiStream;
            });

            const uniqueSavedCustomStreams = savedRevenueItems.filter(savedItem => 
              savedItem.is_custom && !apiGeneratedStreams.some((apiStream: any) => apiStream.name === savedItem.name)
            ).map(savedItem => ({
                id: savedItem.id,
                name: savedItem.name,
                estimatedPrice: savedItem.estimated_amount,
                estimatedVolume: 1,
                revenueProjection: savedItem.estimated_amount,
                isSelected: savedItem.isSelected !== undefined ? savedItem.isSelected : true,
                isCustom: true,
                category: 'revenue' as const,
            }));

            setDynamicRevenueStreams([...hydratedStreams, ...uniqueSavedCustomStreams]);
          } else {
            console.error("Failed to fetch initial revenue streams:", response.message);
            setDynamicRevenueStreams([]);
          }
        } catch (error) {
          console.error("Error fetching initial revenue streams:", error);
          setDynamicRevenueStreams([]);
        } finally {
          setLoadingRevenueStreams(false);
        }
      } else {
        // If sessionId or businessType is missing, don't show loading
        setLoadingRevenueStreams(false);
        setDynamicRevenueStreams([]);
      }
    };
    fetchInitialRevenueStreams();
  }, [sessionId, businessType]);

  const handleRevenueStreamsChange = useCallback((updatedStreams: RevenueStream[]) => {
    setDynamicRevenueStreams(updatedStreams);
    saveRevenueStreamsDebounced(updatedStreams);
  }, [saveRevenueStreamsDebounced]);

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
  const classifyExpenseGroup = useCallback((item: BudgetItem): 'startup' | 'operating' | 'payroll' | 'cogs' | 'other' => {
    const id = String(item.id || '');
    if (id.startsWith('startup_')) return 'startup';
    if (id.startsWith('operating_')) return 'operating';
    if (id.startsWith('payroll_')) return 'payroll';
    if (id.startsWith('cogs_')) return 'cogs';

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
    ];

    const payrollHints = [
      'founder compensation',
      'employee wages',
      'payroll taxes',
      'benefits',
      'contractors / freelancers',
    ];

    const cogsHints = [
      'materials / supplies',
      'manufacturing / production',
      'packaging & shipping',
      'payment processing fees',
    ];

    if (startupHints.some((h) => name.includes(h))) return 'startup';
    if (operatingHints.some((h) => name.includes(h))) return 'operating';
    if (payrollHints.some((h) => name.includes(h))) return 'payroll';
    if (cogsHints.some((h) => name.includes(h))) return 'cogs';

    return 'other';
  }, []);

  // Categorized Items
  const expenses = useMemo(() => {
    if (!budget.items || budget.items.length === 0) return [];
    return budget.items.filter(item => item.category === 'expense');
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

  const payrollExpenseItems = useMemo(
    () => expenses.filter((item) => classifyExpenseGroup(item) === 'payroll'),
    [expenses, classifyExpenseGroup]
  );

  const cogsExpenseItems = useMemo(
    () => expenses.filter((item) => classifyExpenseGroup(item) === 'cogs'),
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
    operatingExpenseItems.reduce((sum, item) => sum + (item.estimated_amount || 0), 0) +
    payrollExpenseItems.reduce((sum, item) => sum + (item.estimated_amount || 0), 0) +
    cogsExpenseItems.reduce((sum, item) => sum + (item.estimated_amount || 0), 0),
    [operatingExpenseItems, payrollExpenseItems, cogsExpenseItems]
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
      { name: 'Payroll', value: payrollExpenseItems.reduce((sum, item) => sum + getMonthlyValue(item), 0) },
      { name: 'COGS', value: cogsExpenseItems.reduce((sum, item) => sum + getMonthlyValue(item), 0) },
    ];

    return entries.filter((d) => Number.isFinite(d.value) && d.value > 0);
  }, [operatingExpenseItems, payrollExpenseItems, cogsExpenseItems, getMonthlyValue]);

  const allBudgetItems = useMemo(() => {
    const itemsMap = new Map<string, BudgetItem>();

    const addOrUpdateItem = (item: BudgetItem) => {
      itemsMap.set(item.id, { ...item, isSelected: selectedItemIds.has(item.id) });
    };

    [...startupCostItems, ...operatingExpenseItems, ...payrollExpenseItems, ...cogsExpenseItems, ...otherExpenses].forEach(addOrUpdateItem);
    
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
  }, [startupCostItems, operatingExpenseItems, payrollExpenseItems, cogsExpenseItems, otherExpenses, dynamicRevenueStreams, selectedItemIds]);

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
      toast.loading('Loading Roadmap...', { toastId: 'roadmap-transition' });
      
      const response = await httpClient.post(
        `${import.meta.env.VITE_API_BASE_URL}/angel/sessions/${sessionId}/transition-decision`,
        {
          decision: "approve",
          transition_type: "budget_to_roadmap"
        }
      );
      
      const responseData = response.data as APIResponse<{ roadmap?: any }>;
      
      if (responseData.success) {
        toast.success('Loading Roadmap!', { toastId: 'roadmap-transition-success' });
        
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

  // Save Budget
  const handleSaveBudget = useCallback(async () => {
    if (!sessionId || !budget) return;
    setSaveStatus('saving');

    const updatedBudgetItems: BudgetItem[] = [...startupCostItems, ...operatingExpenseItems, ...payrollExpenseItems, ...cogsExpenseItems, ...otherExpenses];
    const updatedRevenueItems: RevenueStream[] = dynamicRevenueStreams;

    const allItemsForSave: BudgetItem[] = [
      ...updatedBudgetItems.map((item) => ({
        ...item,
        isSelected: selectedItemIds.has(item.id) || item.isSelected,
      })),
      ...updatedRevenueItems.map<BudgetItem>((stream) => ({
        id: stream.id,
        name: stream.name,
        category: 'revenue' as const,
        estimated_amount: stream.revenueProjection,
        actual_amount: undefined,
        description: '',
        is_custom: stream.isCustom,
        isSelected: stream.isSelected,
      })),
    ];

    const totalEstimatedExpensesForSave = allItemsForSave
      .filter(item => item.category === 'expense' && item.estimated_amount !== undefined)
      .reduce((sum, item) => sum + item.estimated_amount, 0);

    const totalEstimatedRevenueForSave = allItemsForSave
      .filter(item => item.category === 'revenue' && item.estimated_amount !== undefined)
      .reduce((sum, item) => sum + item.estimated_amount, 0);

    try {
        await budgetService.saveBudget(sessionId, {
            ...budget,
            items: allItemsForSave,
            total_estimated_expenses: totalEstimatedExpensesForSave,
            total_estimated_revenue: totalEstimatedRevenueForSave,
        });
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (error) {
        console.error("Failed to save budget:", error);
        setSaveStatus('error');
    }
  }, [sessionId, budget, startupCostItems, operatingExpenseItems, payrollExpenseItems, cogsExpenseItems, otherExpenses, dynamicRevenueStreams, selectedItemIds]);

  const debouncedSave = useCallback(debounce(handleSaveBudget, 2500), [handleSaveBudget]);

  // Add auto-save trigger on any change
  useEffect(() => {
    // Auto-save after 2 seconds of inactivity
    const timer = setTimeout(() => {
      if (saveStatus === 'idle') {
        debouncedSave();
      }
    }, 2000);
    
    return () => clearTimeout(timer);
  }, [budget.items, dynamicRevenueStreams, budget.initial_investment, debouncedSave, saveStatus]);

  const handleBudgetUpdate = useCallback((updates: Partial<Budget>) => {
    onUpdateBudget(updates);
    debouncedSave();
  }, [onUpdateBudget, debouncedSave]);

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
      
      // Payroll Sheet
      const payrollData = [
        ['Line Item', 'Budget', 'Actual', 'Variance'],
        ...payrollExpenseItems.map(item => [
          item.name,
          item.estimated_amount,
          item.actual_amount || 0,
          item.estimated_amount - (item.actual_amount || 0)
        ])
      ];
      const payrollSheet = XLSX.utils.aoa_to_sheet(payrollData);
      XLSX.utils.book_append_sheet(wb, payrollSheet, 'Payroll');
      
      // COGS Sheet
      const cogsData = [
        ['Line Item', 'Budget', 'Actual', 'Variance'],
        ...cogsExpenseItems.map(item => [
          item.name,
          item.estimated_amount,
          item.actual_amount || 0,
          item.estimated_amount - (item.actual_amount || 0)
        ])
      ];
      const cogsSheet = XLSX.utils.aoa_to_sheet(cogsData);
      XLSX.utils.book_append_sheet(wb, cogsSheet, 'COGS');
      
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
  }, [budget, startupCostItems, operatingExpenseItems, payrollExpenseItems, cogsExpenseItems, dynamicRevenueStreams, businessContext, currency, startupCostsTotal, startupActualTotal, remainingStartupFunds, effectiveMonthlyRevenueForBreakEven, totalMonthlyCosts, monthlyNetIncome, breakEven, totalMonthlyRevenue]);

  const getSmartStepForInitialInvestment = useCallback((currentValue: number): number => {
    if (currentValue < 1000) return 100;
    if (currentValue < 10000) return 1000;
    if (currentValue < 100000) return 5000;
    return 10000;
  }, []);

  // Component: Modern Metric Card
  const MetricCard = ({ title, value, icon: Icon, trend, subtitle, color = 'blue', delay = 0 }: {
    title: string;
    value: string;
    icon: any;
    trend?: { value: number; label: string };
    subtitle?: string;
    color?: 'blue' | 'green' | 'purple' | 'red' | 'amber';
    delay?: number;
  }) => {
    const colorClasses = {
      blue: 'from-blue-500 to-indigo-600',
      green: 'from-emerald-500 to-teal-600',
      purple: 'from-purple-500 to-pink-600',
      red: 'from-red-500 to-rose-600',
      amber: 'from-amber-500 to-orange-600',
    };

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay }}
        className="group"
      >
        <Card className="relative overflow-hidden border-2 border-transparent hover:border-gray-200 transition-all duration-300 shadow-lg hover:shadow-2xl bg-white">
          <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${colorClasses[color]} opacity-10 rounded-bl-full group-hover:scale-110 transition-transform duration-300`} />
          
          <CardContent className="p-6 relative">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
                <motion.h3
                  initial={{ scale: 0.9 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: delay + 0.2, type: "spring", stiffness: 200 }}
                  className="text-3xl font-bold text-gray-900 tracking-tight"
                >
                  {value}
                </motion.h3>
                {subtitle && (
                  <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
                )}
              </div>
              
              <motion.div
                whileHover={{ rotate: 360, scale: 1.1 }}
                transition={{ duration: 0.6 }}
                className={`p-3 rounded-2xl bg-gradient-to-br ${colorClasses[color]} shadow-lg`}
              >
                <Icon className="w-6 h-6 text-white" />
              </motion.div>
            </div>

            {trend && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: delay + 0.3 }}
                className="flex items-center gap-2"
              >
                <div className={`flex items-center gap-1 px-2 py-1 rounded-full ${
                  trend.value >= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                }`}>
                  {trend.value >= 0 ? (
                    <ArrowUpRight className="w-3 h-3" />
                  ) : (
                    <ArrowDownRight className="w-3 h-3" />
                  )}
                  <span className="text-xs font-semibold">
                    {Math.abs(trend.value)}%
                  </span>
                </div>
                <span className="text-xs text-gray-600">{trend.label}</span>
              </motion.div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  // Component: Budget Introduction
  const BudgetIntroduction = () => (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="mb-8"
    >
      <div className="bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 rounded-3xl p-8 border-2 border-indigo-100 shadow-xl">
        <div className="flex items-start gap-4 mb-6">
          <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-lg">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
              Budgeting: Understand What It Takes to Make This Business Real
            </h2>
            <p className="text-gray-700 text-lg leading-relaxed">
              Starting a business isn't just about having a good idea — it's about understanding what it will actually cost to make it work.
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mt-8">
          <Card className="border-2 border-indigo-200 bg-white/80 backdrop-blur-sm shadow-lg hover:shadow-xl transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-3">
                <Target className="w-6 h-6 text-indigo-600" />
                <h3 className="font-bold text-gray-900">Business Budgeting</h3>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed">
                Your budget is organized into three connected parts: startup costs, monthly revenue, and monthly expenses. Together, these help you understand your capital needs and break-even timeline.
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 border-purple-200 bg-white/80 backdrop-blur-sm shadow-lg hover:shadow-xl transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-3">
                <Zap className="w-6 h-6 text-purple-600" />
                <h3 className="font-bold text-gray-900">Living Budget</h3>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed">
                This isn't a spreadsheet you finish once — it's a living budget. You can add or remove line items, adjust assumptions, and come back anytime during implementation.
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 border-pink-200 bg-white/80 backdrop-blur-sm shadow-lg hover:shadow-xl transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-3">
                <Award className="w-6 h-6 text-pink-600" />
                <h3 className="font-bold text-gray-900">Guided by Angel</h3>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed">
                Angel can see your budget and business plan together, and is here to help you sanity-check numbers, challenge assumptions, and dial things in over time.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </motion.div>
  );

  // Component: Startup Budget Summary
  const StartupBudgetSummaryCard = () => (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white border-0 shadow-2xl overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full -ml-24 -mb-24" />
        
        <CardContent className="p-8 relative">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
              <Calculator className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-2xl font-bold">Startup Budget Summary</h3>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
              <p className="text-sm text-white/80 mb-1">Initial Investment</p>
              <p className="text-3xl font-bold">{formatCurrency(budget.initial_investment, currency)}</p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
              <p className="text-sm text-white/80 mb-1">Total Startup Costs</p>
              <p className="text-3xl font-bold">{formatCurrency(startupCostsTotal, currency)}</p>
            </div>

            <div className={`backdrop-blur-sm rounded-2xl p-4 border-2 ${
              remainingStartupFunds >= 0 
                ? 'bg-emerald-500/20 border-emerald-300' 
                : 'bg-red-500/20 border-red-300'
            }`}>
              <div className="flex items-center gap-2 mb-1">
                {remainingStartupFunds >= 0 ? (
                  <CheckCircle2 className="w-5 h-5" />
                ) : (
                  <AlertCircle className="w-5 h-5" />
                )}
                <p className="text-sm text-white/90">
                  {remainingStartupFunds >= 0 ? 'Available Funds' : 'Funding Gap'}
                </p>
              </div>
              <p className="text-3xl font-bold">
                {formatCurrency(Math.abs(remainingStartupFunds), currency)}
              </p>
            </div>
          </div>

          {remainingStartupFunds < 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 p-4 bg-red-500/30 backdrop-blur-sm rounded-xl border border-red-300"
            >
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold mb-1">Additional Funding Required</p>
                  <p className="text-sm text-white/90">
                    Consider: personal savings, loans, investors, or grants to cover the funding gap.
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );

  // Component: Break-Even Analysis Card
  const BreakEvenCard = () => {
    const isPositive = monthlyNetIncome > 0;
    const breakEvenMonths = breakEven.months || 0;
    const breakEvenYears = breakEven.years;

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Card className="border-2 border-gray-200 shadow-xl bg-gradient-to-br from-gray-50 to-white">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl shadow-lg">
                <Target className="w-6 h-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl">Break-Even Analysis</CardTitle>
                <CardDescription>When will you recoup your investment?</CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <span className="text-sm font-medium text-gray-600">Monthly Revenue</span>
                  <span className="text-lg font-bold text-emerald-600">
                    {formatCurrency(effectiveMonthlyRevenueForBreakEven, currency)}
                  </span>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <span className="text-sm font-medium text-gray-600">Monthly Costs</span>
                  <span className="text-lg font-bold text-red-600">
                    {formatCurrency(totalMonthlyCosts, currency)}
                  </span>
                </div>

                <div className={`flex items-center justify-between p-4 rounded-xl border-2 ${
                  isPositive ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'
                }`}>
                  <span className="text-sm font-medium text-gray-700">Monthly Net Income</span>
                  <span className={`text-xl font-bold ${isPositive ? 'text-emerald-700' : 'text-red-700'}`}>
                    {formatCurrency(monthlyNetIncome, currency)}
                  </span>
                </div>
              </div>

              <div className={`p-6 rounded-2xl border-2 ${
                breakEven.status === 'never' 
                  ? 'bg-red-50 border-red-200' 
                  : breakEvenMonths <= 12
                  ? 'bg-emerald-50 border-emerald-200'
                  : breakEvenMonths <= 24
                  ? 'bg-amber-50 border-amber-200'
                  : 'bg-orange-50 border-orange-200'
              }`}>
                <div className="flex items-center gap-3 mb-4">
                  {breakEven.status === 'never' ? (
                    <XCircle className="w-8 h-8 text-red-600" />
                  ) : breakEvenMonths <= 12 ? (
                    <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                  ) : (
                    <Clock className="w-8 h-8 text-amber-600" />
                  )}
                  <h4 className="text-lg font-bold text-gray-900">Break-Even Timeline</h4>
                </div>

                {breakEven.status === 'never' ? (
                  <div>
                    <p className="text-4xl font-bold text-red-700 mb-2">Never</p>
                    <p className="text-sm text-gray-700">
                      Revenue doesn't cover monthly costs. Adjust your revenue or expenses to achieve profitability.
                    </p>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-baseline gap-2 mb-2">
                      <p className="text-5xl font-bold text-gray-900">{breakEvenMonths}</p>
                      <p className="text-2xl text-gray-600">months</p>
                    </div>
                    {breakEvenYears && (
                      <p className="text-lg text-gray-600 mb-2">
                        ({breakEvenYears.toFixed(1)} years)
                      </p>
                    )}
                    <p className="text-sm text-gray-700">
                      {breakEvenMonths <= 12 
                        ? 'Excellent! Quick path to profitability.' 
                        : breakEvenMonths <= 24
                        ? 'Manageable timeline with sufficient runway.'
                        : 'Consider if you have adequate funding for this timeline.'}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {breakEven.status === 'never' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-4 bg-red-100 border-2 border-red-300 rounded-xl"
              >
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-700 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-red-900 mb-1">Action Required</p>
                    <p className="text-sm text-red-800">
                      Your business will lose money each month. Review your pricing strategy or reduce operating costs to achieve sustainability.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  // Component: Modern Charts
  const ModernCharts = () => (
    <div className="grid md:grid-cols-2 gap-6">
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="shadow-xl border-2 border-gray-200">
          <CardHeader>
            <div className="flex items-center gap-3">
              <PieChartIcon className="w-6 h-6 text-indigo-600" />
              <CardTitle>Startup Costs Breakdown</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {startupChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <RechartsPieChart>
                  <Tooltip 
                    formatter={(value: any) => formatCurrency(Number(value), currency)}
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: '2px solid #e5e7eb', 
                      borderRadius: '12px',
                      boxShadow: '0 10px 40px rgba(0,0,0,0.1)'
                    }}
                  />
                  <Legend 
                    wrapperStyle={{ fontSize: '12px' }}
                    iconType="circle"
                  />
                  <Pie data={startupChartData} cx="50%" cy="50%" labelLine={false} outerRadius={100}>
                    {startupChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS.chart.startup[index % COLORS.chart.startup.length]} />
                    ))}
                  </Pie>
                </RechartsPieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-64 text-gray-400">
                <p>No startup cost data available</p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <Card className="shadow-xl border-2 border-gray-200">
          <CardHeader>
            <div className="flex items-center gap-3">
              <BarChart3 className="w-6 h-6 text-purple-600" />
              <CardTitle>Monthly Costs Distribution</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {monthlyChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={monthlyChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fontSize: 12 }}
                    stroke="#6b7280"
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                    stroke="#6b7280"
                    tickFormatter={(value) => `${currency}${(value / 1000).toFixed(0)}k`}
                  />
                  <Tooltip 
                    formatter={(value: any) => formatCurrency(Number(value), currency)}
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: '2px solid #e5e7eb', 
                      borderRadius: '12px',
                      boxShadow: '0 10px 40px rgba(0,0,0,0.1)'
                    }}
                  />
                  <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                    {monthlyChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS.chart.monthly[index % COLORS.chart.monthly.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-64 text-gray-400">
                <p>No monthly cost data available</p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );

  // Add visual indicator
  const AutoSaveIndicator = () => {
    const [lastSaved, setLastSaved] = useState<Date | null>(null);
    
    useEffect(() => {
      if (saveStatus === 'saved') {
        setLastSaved(new Date());
      }
    }, [saveStatus]);
    
    return (
      <AnimatePresence>
        {saveStatus !== 'idle' && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center gap-2 text-sm"
          >
            {saveStatus === 'saving' && (
              <>
                <Loader className="w-4 h-4 animate-spin text-blue-600" />
                <span className="text-blue-600">Saving...</span>
              </>
            )}
            {saveStatus === 'saved' && (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span className="text-emerald-600">
                  Saved {lastSaved ? `at ${lastSaved.toLocaleTimeString()}` : ''}
                </span>
              </>
            )}
            {saveStatus === 'error' && (
              <>
                <XCircle className="w-4 h-4 text-red-600" />
                <span className="text-red-600">Failed to save</span>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    );
  };

  return (
    <div id="budget-dashboard-content" className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pb-24">
      {/* Budget Introduction */}
      <BudgetIntroduction />

      {/* Header Section */}
      <div className="bg-white/80 backdrop-blur-xl border-b-2 border-gray-200 shadow-lg mb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Budget Dashboard
              </h1>
              <p className="text-gray-600 mt-1">
                {viewMode === 'actual' ? 'Actual' : 'Estimated'} budget for Year 1
              </p>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-xl">
                <Button
                  variant={viewMode === 'estimated' ? 'default' : 'ghost'}
                  onClick={() => setViewMode('estimated')}
                  className={viewMode === 'estimated' ? 'bg-indigo-600 hover:bg-indigo-700 text-white' : 'text-gray-700'}
                >
                  Estimated
                </Button>
                <Button
                  variant={viewMode === 'actual' ? 'default' : 'ghost'}
                  onClick={() => setViewMode('actual')}
                  disabled={!budget.items.some(item => item.actual_amount !== undefined)}
                  className={viewMode === 'actual' ? 'bg-indigo-600 hover:bg-indigo-700 text-white' : 'text-gray-700'}
                >
                  Actual
                </Button>
              </div>

              <Button
                onClick={handleSaveBudget}
                disabled={saveStatus === 'saving'}
                className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-lg"
              >
                {saveStatus === 'saving' ? (
                  <>
                    <Loader className="animate-spin w-4 h-4 mr-2" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Budget
                  </>
                )}
              </Button>

              <SaveStatusIndicator status={saveStatus} onRetry={handleSaveBudget} />

              <AutoSaveIndicator />

              <Button
                onClick={handleExportPdf}
                variant="outline"
                className="border-2 border-gray-300 hover:border-gray-400"
              >
                <Download className="w-4 h-4 mr-2" />
                Export PDF
              </Button>

              <Button
                onClick={handleExportExcel}
                variant="outline"
                className="border-2 border-gray-300 hover:border-gray-400"
              >
                <Download className="w-4 h-4 mr-2" />
                Export Excel
              </Button>
            </div>
          </div>

          {selectedItemIds.size > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl border-2 border-blue-200"
            >
              <div className="flex items-center gap-3">
                <div className="px-3 py-1 bg-blue-600 text-white rounded-full text-sm font-bold">
                  {selectedItemIds.size}
                </div>
                <p className="text-gray-700 font-medium">items selected for Angel chat</p>
              </div>
              
              <Button
                onClick={() => setIsChatModalOpen(true)}
                className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-lg"
              >
                <MessageSquareText className="w-4 h-4 mr-2" />
                Chat with Angel
              </Button>
            </motion.div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Startup Budget Summary */}
        <StartupBudgetSummaryCard />

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="bg-white p-2 shadow-lg rounded-2xl border-2 border-gray-200 inline-flex gap-2">
            <TabsTrigger
              value="overview"
              className="px-6 py-3 rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all font-medium"
            >
              <PieChartIcon className="w-4 h-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger
              value="manage"
              className="px-6 py-3 rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all font-medium"
            >
              <Edit2 className="w-4 h-4 mr-2" />
              Manage Items
            </TabsTrigger>
            <TabsTrigger
              value="analysis"
              className="px-6 py-3 rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all font-medium"
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              Analysis
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="mt-8 space-y-8">
            {/* Budget Validation Warnings */}
            {warnings.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-3"
              >
                {warnings.map(warning => (
                  <div
                    key={warning.id}
                    className={`p-4 rounded-xl border-2 flex items-start gap-3 ${
                      warning.type === 'error' 
                        ? 'bg-red-50 border-red-200' 
                        : warning.type === 'warning'
                        ? 'bg-amber-50 border-amber-200'
                        : 'bg-blue-50 border-blue-200'
                    }`}
                  >
                    {warning.type === 'error' && <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />}
                    {warning.type === 'warning' && <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />}
                    {warning.type === 'info' && <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />}
                    <p className="text-sm text-gray-700">{warning.message}</p>
                  </div>
                ))}
              </motion.div>
            )}

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <MetricCard
                title="Total Startup Costs"
                value={formatCurrency(startupCostsTotal, currency)}
                icon={Zap}
                color="blue"
                delay={0}
              />
              <MetricCard
                title="Monthly Revenue"
                value={formatCurrency(effectiveMonthlyRevenueForBreakEven, currency)}
                icon={TrendingUp}
                color="green"
                delay={0.1}
              />
              <MetricCard
                title="Monthly Costs"
                value={formatCurrency(totalMonthlyCosts, currency)}
                icon={TrendingDown}
                color="red"
                delay={0.2}
              />
              <MetricCard
                title="Monthly Net"
                value={formatCurrency(monthlyNetIncome, currency)}
                icon={Calculator}
                color={monthlyNetIncome >= 0 ? 'green' : 'red'}
                delay={0.3}
              />
            </div>

            {/* Break-Even Analysis */}
            <BreakEvenCard />

            {/* Charts */}
            <ModernCharts />

            {/* Budget Tables */}
            <div className="space-y-8">
              {/* Startup Costs */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <Card className="shadow-xl border-2 border-gray-200">
                  <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b-2 border-gray-200">
                    <CardTitle className="flex items-center gap-3">
                      <div className="p-2 bg-indigo-100 rounded-lg">
                        <DollarSign className="w-5 h-5 text-indigo-600" />
                      </div>
                      Startup Costs (One-Time, Pre-Launch)
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <TableSelectionControls
                      items={startupCostItems}
                      selectedItemIds={selectedItemIds}
                      onToggleAll={(isSelected) => 
                        onToggleSectionSelection(startupCostItems.map(i => i.id), isSelected)
                      }
                      sectionName="Startup Costs"
                    />
                    <StartupCostsTable
                      items={startupCostItems}
                      onChange={(nextStartupItems) => {
                        const nextItems: BudgetItem[] = [
                          ...nextStartupItems,
                          ...cogsExpenseItems,
                          ...operatingExpenseItems,
                          ...payrollExpenseItems,
                          ...revenues,
                        ];
                        handleBudgetUpdate({ items: nextItems });
                      }}
                      currency={currency}
                      selectedItemIds={selectedItemIds}
                      onToggleItemSelection={onToggleItemSelection}
                      onToggleAllSelection={(isSelected) =>
                        onToggleSectionSelection(startupCostItems.map((i) => i.id), isSelected)
                      }
                      onAddLineItem={openAddLineItemModal}
                      onRemoveItem={openRemoveModal}
                    />
                  </CardContent>
                </Card>
              </motion.div>

              {/* Startup Funds */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                <Card className="shadow-xl border-2 border-gray-200">
                  <CardHeader className="bg-gradient-to-r from-emerald-50 to-white border-b-2 border-gray-200">
                    <CardTitle className="flex items-center gap-3">
                      <div className="p-2 bg-emerald-100 rounded-lg">
                        <DollarSign className="w-5 h-5 text-emerald-600" />
                      </div>
                      Startup Funds (Initial Investment)
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <div className="p-4 bg-gradient-to-br from-gray-50 to-white rounded-2xl border-2 border-gray-200">
                        <p className="text-sm font-medium text-gray-600 mb-2">Initial Investment</p>
                        <CurrencyInput
                          value={budget.initial_investment}
                          onChange={(value) => handleBudgetUpdate({ initial_investment: value })}
                          min={0}
                          step={100}
                          getSmartStep={getSmartStepForInitialInvestment}
                          className="w-full text-2xl font-bold"
                        />
                      </div>

                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="p-4 bg-gradient-to-br from-blue-50 to-white rounded-2xl border-2 border-blue-200">
                          <p className="text-sm font-medium text-gray-600 mb-1">Expenses To Date</p>
                          <p className="text-2xl font-bold text-blue-700">
                            {formatMoney(startupActualTotal, currency)}
                          </p>
                        </div>

                        <div className={`p-4 rounded-2xl border-2 ${
                          remainingStartupFunds >= 0
                            ? 'bg-gradient-to-br from-emerald-50 to-white border-emerald-200'
                            : 'bg-gradient-to-br from-red-50 to-white border-red-200'
                        }`}>
                          <p className="text-sm font-medium text-gray-600 mb-1">Remaining Funds</p>
                          <p className={`text-2xl font-bold ${
                            remainingStartupFunds >= 0 ? 'text-emerald-700' : 'text-red-700'
                          }`}>
                            {formatMoney(remainingStartupFunds, currency)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Monthly Revenue */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <Card className="shadow-xl border-2 border-gray-200">
                  <CardHeader className="bg-gradient-to-r from-green-50 to-white border-b-2 border-gray-200">
                    <CardTitle className="flex items-center gap-3">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <TrendingUp className="w-5 h-5 text-green-600" />
                      </div>
                      Monthly Revenue Projection
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    {loadingRevenueStreams ? (
                      <div className="flex items-center justify-center py-12">
                        <Loader className="animate-spin w-8 h-8 text-indigo-600" />
                      </div>
                    ) : (
                      <RevenueTable
                        items={dynamicRevenueStreams}
                        onRevenueStreamsChange={handleRevenueStreamsChange}
                        onTotalMonthlyRevenueChange={setTotalMonthlyRevenue}
                        currency={currency}
                        selectedItemIds={selectedItemIds}
                        onToggleItemSelection={onToggleItemSelection}
                        onToggleAllSelection={(itemIds, isSelected) => onToggleSectionSelection(itemIds, isSelected)}
                        onAddLineItem={openAddLineItemModal}
                      />
                    )}
                  </CardContent>
                </Card>
              </motion.div>

              {/* Monthly Operating Expenses */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <Card className="shadow-xl border-2 border-gray-200">
                  <CardHeader className="bg-gradient-to-r from-amber-50 to-white border-b-2 border-gray-200">
                    <CardTitle className="flex items-center gap-3">
                      <div className="p-2 bg-amber-100 rounded-lg">
                        <Calendar className="w-5 h-5 text-amber-600" />
                      </div>
                      Monthly Operating Expenses (Post-Launch)
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <OperatingExpensesTable
                      items={operatingExpenseItems}
                      onChange={(nextOperatingItems) => {
                        const nextItems: BudgetItem[] = [
                          ...startupCostItems,
                          ...cogsExpenseItems,
                          ...nextOperatingItems,
                          ...payrollExpenseItems,
                          ...revenues,
                        ];
                        handleBudgetUpdate({ items: nextItems });
                      }}
                      currency={currency}
                      selectedItemIds={selectedItemIds}
                      onToggleItemSelection={onToggleItemSelection}
                      onToggleAllSelection={(isSelected) =>
                        onToggleSectionSelection(operatingExpenseItems.map((i) => i.id), isSelected)
                      }
                      onAddLineItem={openAddLineItemModal}
                      onRemoveItem={openRemoveModal}
                    />
                  </CardContent>
                </Card>
              </motion.div>

              {/* Monthly Payroll */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                <Card className="shadow-xl border-2 border-gray-200">
                  <CardHeader className="bg-gradient-to-r from-purple-50 to-white border-b-2 border-gray-200">
                    <CardTitle className="flex items-center gap-3">
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <FileText className="w-5 h-5 text-purple-600" />
                      </div>
                      Monthly Payroll, Contractor & Associated Costs
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <PayrollCostsTable
                      items={payrollExpenseItems}
                      onChange={(nextPayrollItems) => {
                        const nextItems: BudgetItem[] = [
                          ...startupCostItems,
                          ...cogsExpenseItems,
                          ...operatingExpenseItems,
                          ...nextPayrollItems,
                          ...revenues,
                        ];
                        handleBudgetUpdate({ items: nextItems });
                      }}
                      currency={currency}
                      selectedItemIds={selectedItemIds}
                      onToggleItemSelection={onToggleItemSelection}
                      onToggleAllSelection={(isSelected) =>
                        onToggleSectionSelection(payrollExpenseItems.map((i) => i.id), isSelected)
                      }
                      onAddLineItem={openAddLineItemModal}
                      onRemoveItem={openRemoveModal}
                    />
                  </CardContent>
                </Card>
              </motion.div>

              {/* Monthly COGS */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.5 }}
              >
                <Card className="shadow-xl border-2 border-gray-200">
                  <CardHeader className="bg-gradient-to-r from-pink-50 to-white border-b-2 border-gray-200">
                    <CardTitle className="flex items-center gap-3">
                      <div className="p-2 bg-pink-100 rounded-lg">
                        <Calculator className="w-5 h-5 text-pink-600" />
                      </div>
                      Monthly Cost of Goods Sold (COGS)
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <COGSTable
                      items={cogsExpenseItems}
                      onChange={(nextCogsItems) => {
                        const nextItems: BudgetItem[] = [
                          ...startupCostItems,
                          ...nextCogsItems,
                          ...operatingExpenseItems,
                          ...payrollExpenseItems,
                          ...revenues,
                        ];
                        handleBudgetUpdate({ items: nextItems });
                      }}
                      currency={currency}
                      selectedItemIds={selectedItemIds}
                      onToggleItemSelection={onToggleItemSelection}
                      onToggleAllSelection={(isSelected) =>
                        onToggleSectionSelection(cogsExpenseItems.map((i) => i.id), isSelected)
                      }
                      onAddLineItem={openAddLineItemModal}
                      onRemoveItem={openRemoveModal}
                    />
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </TabsContent>

          {/* Manage Tab */}
          <TabsContent value="manage" className="mt-8 space-y-8">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Manage Your Budget Items</h3>
              <p className="text-gray-600">Edit line items across all budget categories</p>
            </div>

            {/* Same tables as Overview but in manage mode */}
            <div className="space-y-8">
              {/* Startup Costs Management */}
              <Card className="shadow-xl border-2 border-gray-200">
                <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b-2 border-gray-200">
                  <CardTitle>Startup Costs</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <StartupCostsTable
                    items={startupCostItems}
                    onChange={(nextStartupItems) => {
                      const nextItems: BudgetItem[] = [
                        ...nextStartupItems,
                        ...cogsExpenseItems,
                        ...operatingExpenseItems,
                        ...payrollExpenseItems,
                        ...revenues,
                      ];
                      handleBudgetUpdate({ items: nextItems });
                    }}
                    currency={currency}
                    selectedItemIds={selectedItemIds}
                    onToggleItemSelection={onToggleItemSelection}
                    onToggleAllSelection={(isSelected) =>
                      onToggleSectionSelection(startupCostItems.map((i) => i.id), isSelected)
                    }
                    onAddLineItem={openAddLineItemModal}
                    onRemoveItem={openRemoveModal}
                  />
                </CardContent>
              </Card>

              {/* Revenue Management */}
              <Card className="shadow-xl border-2 border-gray-200">
                <CardHeader className="bg-gradient-to-r from-green-50 to-white border-b-2 border-gray-200">
                  <CardTitle>Monthly Revenue</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  {loadingRevenueStreams ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader className="animate-spin w-8 h-8 text-indigo-600" />
                    </div>
                  ) : (
                    <RevenueTable
                      items={dynamicRevenueStreams}
                      onRevenueStreamsChange={handleRevenueStreamsChange}
                      onTotalMonthlyRevenueChange={setTotalMonthlyRevenue}
                      currency={currency}
                      selectedItemIds={selectedItemIds}
                      onToggleItemSelection={onToggleItemSelection}
                      onToggleAllSelection={(itemIds, isSelected) => onToggleSectionSelection(itemIds, isSelected)}
                      onAddLineItem={openAddLineItemModal}
                    />
                  )}
                </CardContent>
              </Card>

              {/* Operating Expenses Management */}
              <Card className="shadow-xl border-2 border-gray-200">
                <CardHeader className="bg-gradient-to-r from-amber-50 to-white border-b-2 border-gray-200">
                  <CardTitle>Monthly Operating Expenses</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <OperatingExpensesTable
                    items={operatingExpenseItems}
                    onChange={(nextOperatingItems) => {
                      const nextItems: BudgetItem[] = [
                        ...startupCostItems,
                        ...cogsExpenseItems,
                        ...nextOperatingItems,
                        ...payrollExpenseItems,
                        ...revenues,
                      ];
                      handleBudgetUpdate({ items: nextItems });
                    }}
                    currency={currency}
                    selectedItemIds={selectedItemIds}
                    onToggleItemSelection={onToggleItemSelection}
                    onToggleAllSelection={(isSelected) =>
                      onToggleSectionSelection(operatingExpenseItems.map((i) => i.id), isSelected)
                    }
                    onAddLineItem={openAddLineItemModal}
                    onRemoveItem={openRemoveModal}
                  />
                </CardContent>
              </Card>

              {/* Payroll Management */}
              <Card className="shadow-xl border-2 border-gray-200">
                <CardHeader className="bg-gradient-to-r from-purple-50 to-white border-b-2 border-gray-200">
                  <CardTitle>Monthly Payroll</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <PayrollCostsTable
                    items={payrollExpenseItems}
                    onChange={(nextPayrollItems) => {
                      const nextItems: BudgetItem[] = [
                        ...startupCostItems,
                        ...cogsExpenseItems,
                        ...operatingExpenseItems,
                        ...nextPayrollItems,
                        ...revenues,
                      ];
                      handleBudgetUpdate({ items: nextItems });
                    }}
                    currency={currency}
                    selectedItemIds={selectedItemIds}
                    onToggleItemSelection={onToggleItemSelection}
                    onToggleAllSelection={(isSelected) =>
                      onToggleSectionSelection(payrollExpenseItems.map((i) => i.id), isSelected)
                    }
                    onAddLineItem={openAddLineItemModal}
                    onRemoveItem={openRemoveModal}
                  />
                </CardContent>
              </Card>

              {/* COGS Management */}
              <Card className="shadow-xl border-2 border-gray-200">
                <CardHeader className="bg-gradient-to-r from-pink-50 to-white border-b-2 border-gray-200">
                  <CardTitle>Monthly COGS</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <COGSTable
                    items={cogsExpenseItems}
                    onChange={(nextCogsItems) => {
                      const nextItems: BudgetItem[] = [
                        ...startupCostItems,
                        ...nextCogsItems,
                        ...operatingExpenseItems,
                        ...payrollExpenseItems,
                        ...revenues,
                      ];
                      handleBudgetUpdate({ items: nextItems });
                    }}
                    currency={currency}
                    selectedItemIds={selectedItemIds}
                    onToggleItemSelection={onToggleItemSelection}
                    onToggleAllSelection={(isSelected) =>
                      onToggleSectionSelection(cogsExpenseItems.map((i) => i.id), isSelected)
                    }
                    onAddLineItem={openAddLineItemModal}
                    onRemoveItem={openRemoveModal}
                  />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Analysis Tab */}
          <TabsContent value="analysis" className="mt-8 space-y-8">
            {/* Break-Even Analysis */}
            <BreakEvenCard />

            {/* Charts */}
            <ModernCharts />

            {/* 2-Year Projection */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="shadow-xl border-2 border-gray-200">
                <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50 border-b-2 border-gray-200">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-100 rounded-lg">
                      <Calendar className="w-6 h-6 text-indigo-600" />
                    </div>
                    <div>
                      <CardTitle>2-Year Financial Projection</CardTitle>
                      <CardDescription>Revenue, costs, and net profit forecast</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="p-4 bg-gradient-to-br from-emerald-50 to-white rounded-2xl border-2 border-emerald-200">
                      <p className="text-sm font-medium text-gray-600 mb-1">24-Month Revenue</p>
                      <p className="text-2xl font-bold text-emerald-700">
                        {formatMoney(twoYearProjection.revenue24, currency)}
                      </p>
                    </div>

                    <div className="p-4 bg-gradient-to-br from-red-50 to-white rounded-2xl border-2 border-red-200">
                      <p className="text-sm font-medium text-gray-600 mb-1">24-Month Costs</p>
                      <p className="text-2xl font-bold text-red-700">
                        {formatMoney(twoYearProjection.costs24, currency)}
                      </p>
                    </div>

                    <div className={`p-4 rounded-2xl border-2 ${
                      twoYearProjection.net24 >= 0
                        ? 'bg-gradient-to-br from-blue-50 to-white border-blue-200'
                        : 'bg-gradient-to-br from-orange-50 to-white border-orange-200'
                    }`}>
                      <p className="text-sm font-medium text-gray-600 mb-1">24-Month Net</p>
                      <p className={`text-2xl font-bold ${
                        twoYearProjection.net24 >= 0 ? 'text-blue-700' : 'text-orange-700'
                      }`}>
                        {formatMoney(twoYearProjection.net24, currency)}
                      </p>
                    </div>

                    <div className={`p-4 rounded-2xl border-2 ${
                      twoYearProjection.netAfterStartup24 >= 0
                        ? 'bg-gradient-to-br from-emerald-50 to-white border-emerald-200'
                        : 'bg-gradient-to-br from-red-50 to-white border-red-200'
                    }`}>
                      <p className="text-sm font-medium text-gray-600 mb-1">Net After Startup</p>
                      <p className={`text-2xl font-bold ${
                        twoYearProjection.netAfterStartup24 >= 0 ? 'text-emerald-700' : 'text-red-700'
                      }`}>
                        {formatMoney(twoYearProjection.netAfterStartup24, currency)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
                    <p className="text-xs text-gray-600">
                      <strong>Calculation:</strong> (24-month revenue - 24-month operating costs) - total startup costs
                    </p>
                  </div>
                </CardContent>
              </Card>
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
          onAddExpenseItem={(item) => {
            handleAddItem(item);
          }}
          onAddRevenueStream={(payload) => {
            const id = `custom-${payload.name.trim().toLowerCase().replace(/\s+/g, '-')}-${dynamicRevenueStreams.length}`;
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

            setDynamicRevenueStreams((prev) => {
              const next = [...prev, newStream];
              saveRevenueStreamsDebounced(next);
              setTotalMonthlyRevenue(
                next.filter((s) => s.isSelected).reduce((sum, s) => sum + s.revenueProjection, 0)
              );
              return next;
            });
          }}
          category={addLineItemCategory}
          existingItems={
            addLineItemCategory === 'revenue'
              ? dynamicRevenueStreams
              : budget.items.filter((item) => {
                  const group = classifyExpenseGroup(item);
                  return (
                    (group === 'startup' && addLineItemCategory === 'startup_cost') ||
                    (group === 'operating' && addLineItemCategory === 'operating_expense') ||
                    (group === 'payroll' && addLineItemCategory === 'payroll') ||
                    (group === 'cogs' && addLineItemCategory === 'cogs')
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
      
      {/* Sticky Go to Roadmap Button */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg p-4 z-50">
        <div className="max-w-7xl mx-auto">
          <Button
            onClick={handleGoToRoadmap}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 px-6 font-medium rounded-lg transition-colors duration-200"
          >
            <div className="flex items-center justify-center gap-2">
              <span>Continue to Roadmap</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </div>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default BudgetDashboard;