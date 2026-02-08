import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Info, TrendingDown, Plus, Save, MessageSquareText, Download, Loader } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { BudgetItem, BudgetCategory, Budget, APIResponse } from '@/types/apiTypes'; // Added Budget to types
import BudgetItemManager from './BudgetItemManager';
import StartupCostsTable from './StartupCostsTable';
import OperatingExpensesTable from './OperatingExpensesTable';
import PayrollCostsTable from './PayrollCostsTable';
import COGSTable from './COGSTable';
import RevenueTable from './RevenueTable';
import { BudgetSummaryCards } from './BudgetSummaryCards';
import { BreakEvenAnalysis } from './BreakEvenAnalysis';
import { BudgetCharts } from './BudgetCharts';
import { BudgetFullDashboard } from './BudgetFullDashboard';
import { formatCurrency, formatMoney } from '@/lib/formatters'; // Import from new formatters
import CurrencyInput from '../ui/CurrencyInput'; // Import CurrencyInput
import StartupBudgetSummary from './StartupBudgetSummary'; // Import StartupBudgetSummary
import { budgetIntro } from './budgetIntroContent';
import { budgetService } from '@/services/budgetService';
import { toast } from 'react-toastify';
import BudgetChatModal from './BudgetChatModal';
import AddLineItemModal from './AddLineItemModal'; // Import the new modal
import RemoveItemModal from './RemoveItemModal'; // Import the new remove modal
import SaveStatusIndicator, { type SaveStatus } from '../ui/SaveStatusIndicator'; // Import SaveStatusIndicator

type RevenueStreamInitial = {
  name: string;
  estimated_price: number;
  estimated_volume: number;
};

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
  // onAddItem: (item: Omit<BudgetItem, 'id' | 'created_at' | 'updated_at'>) => void; // This prop is now handled internally
  onUpdateItem: (id: string, updates: Partial<BudgetItem>) => void;
  onDeleteItem: (id: string) => void;
  currency?: string;
  showActuals?: boolean;
  businessType?: string;
  sessionId?: string;
  businessContext?: any; // Replace with any type for now
  initialBudgetSuggestions?: BudgetItem[]; // New prop
}
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

const BudgetDashboard: React.FC<BudgetDashboardProps> = ({
  budget,
  onUpdateBudget,
  // onAddItem, // No longer destructure directly, use internal handleAddItem
  onUpdateItem,
  onDeleteItem,
  currency = '$',
  showActuals = false,
  businessType,
  sessionId,
  businessContext,
  initialBudgetSuggestions, // Destructure new prop
}) => {
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [viewMode, setViewMode] = useState<'estimated' | 'actual'>('estimated');
  const [dynamicRevenueStreams, setDynamicRevenueStreams] = useState<RevenueStream[]>([]);
  const [loadingRevenueStreams, setLoadingRevenueStreams] = useState<boolean>(true);
  const [totalMonthlyRevenue, setTotalMonthlyRevenue] = useState<number>(0);
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(() => new Set());
  const [isChatModalOpen, setIsChatModalOpen] = useState(false);

  const handleExportPdf = useCallback(() => {
    window.print();
  }, []);
  
  // State for AddLineItemModal
  const [isAddLineItemModalOpen, setIsAddLineItemModalOpen] = useState(false);
  const [addLineItemCategory, setAddLineItemCategory] = useState<
    'startup_cost' | 'operating_expense' | 'payroll' | 'cogs' | 'revenue' | null
  >(null);
  
  // State for RemoveItemModal
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

  const openAddLineItemModal = (category: 'startup_cost' | 'operating_expense' | 'payroll' | 'cogs' | 'revenue') => {
    setAddLineItemCategory(category);
    setIsAddLineItemModalOpen(true);
  };

  const closeAddLineItemModal = () => {
    setIsAddLineItemModalOpen(false);
    setAddLineItemCategory(null);
  };

  // Remove functions
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

  // Centralized function to add a new budget item, with immediate persistence to backend
  const handleAddItem = useCallback(async (item: Omit<BudgetItem, 'id' | 'created_at' | 'updated_at'>): Promise<BudgetItem> => {
    if (!sessionId) {
      toast.error("Session ID is missing, cannot add item.");
      throw new Error("Session ID is missing.");
    }
    try {
      // API call to add the item, returns updated Budget with new item
      const response: APIResponse<Budget> = await budgetService.addBudgetItem(sessionId, item);
      if (response.success && response.result) {
        // Find the newly added item (it should be the last one)
        const addedItem = response.result.items[response.result.items.length - 1];
        // Trigger a full budget reload in the parent to get updated items with server IDs
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


  // Debounce function for saving revenue streams
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
    }, 1000), // Debounce for 1 second
    [sessionId]
  );

  useEffect(() => {
    if (initialBudgetSuggestions && initialBudgetSuggestions.length > 0 && budget.items.length === 0) {
      console.log("Adding initial budget suggestions to empty budget:", initialBudgetSuggestions);
      initialBudgetSuggestions.forEach(item => {
        // Use the new handleAddItem to persist immediately
        handleAddItem(item);
      });
    }
  }, [initialBudgetSuggestions, budget.items, handleAddItem]);

  useEffect(() => {
    const fetchInitialRevenueStreams = async () => {
      if (sessionId && businessType) {
        setLoadingRevenueStreams(true);
        try {
          const response = await budgetService.generateInitialRevenueStreams(sessionId);
          if (response.success) {
            const apiGeneratedStreams: RevenueStream[] = response.result.map(stream => ({
              ...stream,
              id: `api-${crypto.randomUUID()}`,
              estimatedPrice: stream.estimated_price,
              estimatedVolume: stream.estimated_volume,
              revenueProjection: stream.estimated_price * stream.estimated_volume,
              isSelected: true,
              isCustom: false,
            }));

            // Combine API streams with previously saved ones, prioritizing saved state
            const savedRevenueItems = budget.items.filter(item => item.category === 'revenue');
            
            const hydratedStreams: RevenueStream[] = apiGeneratedStreams.map(apiStream => {
              const savedMatch = savedRevenueItems.find(savedItem => savedItem.name === apiStream.name);
              if (savedMatch) {
                return {
                  ...apiStream,
                  id: savedMatch.id || apiStream.id,
                  estimatedPrice: savedMatch.estimated_amount,
                  estimatedVolume: savedMatch.estimated_amount / (apiStream.estimatedPrice || 1), // Assuming estimated_amount holds projection
                  revenueProjection: savedMatch.estimated_amount,
                  isSelected: savedMatch.isSelected !== undefined ? savedMatch.isSelected : true,
                  isCustom: savedMatch.is_custom || false,
                };
              }
              return apiStream;
            });

            const uniqueSavedCustomStreams = savedRevenueItems.filter(savedItem => 
              savedItem.is_custom && !apiGeneratedStreams.some(apiStream => apiStream.name === savedItem.name)
            ).map(savedItem => ({
                id: savedItem.id,
                name: savedItem.name,
                estimatedPrice: savedItem.estimated_amount,
                estimatedVolume: 1, // Placeholder
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
      }
    };
    fetchInitialRevenueStreams();
  }, [sessionId, businessType, budget.items]); // Depend on budget.items to re-hydrate if budget changes from elsewhere

  const handleRevenueStreamsChange = useCallback((updatedStreams: RevenueStream[]) => {
    setDynamicRevenueStreams(updatedStreams);
    saveRevenueStreamsDebounced(updatedStreams);
  }, [saveRevenueStreamsDebounced]);

  // Global selection state management
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

  // Group items by category for pie chart
  const budgetCategories = useMemo(() => {
    const categories: { [key: string]: BudgetCategory } = {};
    
    // Combine all budget items for categorization
    const allBudgetItems: BudgetItem[] = [...budget.items, ...dynamicRevenueStreams.filter(rs => rs.isSelected).map(rs => ({
      id: rs.id,
      name: rs.name,
      category: 'revenue' as const,
      estimated_amount: rs.revenueProjection,
      actual_amount: undefined,
      description: '',
      is_custom: rs.isCustom,
      isSelected: rs.isSelected,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }))];

    allBudgetItems.forEach(item => {
      const categoryKey = item.category === 'expense' ? item.name : `Revenue: ${item.name}`;
      const value = showActuals && item.actual_amount !== undefined 
        ? item.actual_amount 
        : item.estimated_amount;
      
      if (!categories[categoryKey]) {
        categories[categoryKey] = {
          name: categoryKey,
          estimated_total: 0,
          actual_total: 0,
          items: [],
          color: item.category === 'expense' ? '#ef4444' : '#10b981'
        };
      }
      
      categories[categoryKey].items.push(item);
      categories[categoryKey].estimated_total += item.estimated_amount;
      if (item.actual_amount !== undefined) {
        categories[categoryKey].actual_total += item.actual_amount;
      }
    });
    
    return Object.values(categories);
  }, [budget.items, dynamicRevenueStreams, showActuals]);

  const expenses = budget.items.filter(item => item.category === 'expense');
  const revenues = useMemo(() => {
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
  }, [dynamicRevenueStreams]);

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

  const allBudgetItems = useMemo(() => {
    // Collect all unique budget items from different categories and dynamic revenue streams
    const itemsMap = new Map<string, BudgetItem>();

    const addOrUpdateItem = (item: BudgetItem) => {
      itemsMap.set(item.id, { ...item, isSelected: selectedItemIds.has(item.id) });
    };

    [...startupCostItems, ...operatingExpenseItems, ...payrollExpenseItems, ...cogsExpenseItems, ...otherExpenses].forEach(addOrUpdateItem);
    
    // Add dynamic revenue streams separately
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

  const SummaryCard = ({ title, value, icon: Icon, trend, color, index }: {
    title: string;
    value: string;
    icon: any;
    trend?: number;
    color: string;
    index: number;
  }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      whileHover={{ scale: 1.05, y: -5 }}
      className="h-full"
    >
      <Card className="h-full border-2 hover:border-opacity-50 transition-all duration-300 shadow-lg hover:shadow-xl">
        <CardContent className="p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0 pr-2">
              <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1 truncate">{title}</p>
              <motion.p
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ delay: index * 0.1 + 0.3, type: "spring" }}
                className={`text-xl sm:text-2xl md:text-3xl font-bold ${color} break-words`}
              >
                {value}
              </motion.p>
              {trend !== undefined && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.1 + 0.5 }}
                  className={`text-xs sm:text-sm font-semibold mt-1 ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`}
                >
                  {trend >= 0 ? '↑' : '↓'} {trend >= 0 ? '+' : ''}{trend}%
                </motion.p>
              )}
            </div>
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
              className="flex-shrink-0"
            >
              <Icon className={`w-8 h-8 sm:w-10 sm:h-10 ${color}`} />
            </motion.div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );

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
        setTimeout(() => setSaveStatus('idle'), 2000); // Reset to idle after 2 seconds
    } catch (error) {
        console.error("Failed to save budget:", error);
        setSaveStatus('error');
    }
  }, [sessionId, budget, startupCostItems, operatingExpenseItems, payrollExpenseItems, cogsExpenseItems, otherExpenses, dynamicRevenueStreams, selectedItemIds, setSaveStatus]);

  const debouncedSave = useCallback(debounce(handleSaveBudget, 2500), [handleSaveBudget]);

  const handleBudgetUpdate = useCallback((updates: Partial<Budget>) => {
    onUpdateBudget(updates);
    debouncedSave();
  }, [onUpdateBudget, debouncedSave]);

  const getSmartStepForInitialInvestment = useCallback((currentValue: number): number => {
    if (currentValue < 1000) return 100;
    if (currentValue < 10000) return 1000;
    if (currentValue < 100000) return 5000;
    return 10000; // Larger step for very large investments
  }, []);

  return (
    <div className="relative space-y-6">
      <StartupBudgetSummary
        initialInvestment={budget.initial_investment}
        totalStartupCosts={startupCostsTotal}
        currency={currency}
      />
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-0">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Budget Dashboard</h2>
          <p className="text-sm sm:text-base text-gray-600">
            {viewMode === 'actual' ? 'Actual' : 'Estimated'} budget for Year 1
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === 'estimated' ? 'default' : 'outline'}
            onClick={() => setViewMode('estimated')}
          >
            Estimated
          </Button>
          <Button
            variant={viewMode === 'actual' ? 'default' : 'outline'}
            onClick={() => setViewMode('actual')}
            disabled={!budget.items.some(item => item.actual_amount !== undefined)}
          >
            Actual
          </Button>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between mt-4">
        <div className="flex items-center gap-2">
          <Button
            onClick={handleSaveBudget}
            disabled={saveStatus === 'saving'}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white"
          >
            {saveStatus === 'saving' ? <Loader className="animate-spin w-4 h-4" /> : <Save className="w-4 h-4" />}
            Save Budget
          </Button>
          <SaveStatusIndicator status={saveStatus} onRetry={handleSaveBudget} />
          <Button onClick={handleExportPdf} className="flex items-center gap-2">
            <Download className="w-4 h-4" /> Export as PDF
          </Button>
        </div>

        <Button
          onClick={() => setIsChatModalOpen(true)}
          disabled={selectedItemIds.size === 0}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white"
        >
          <MessageSquareText className="w-4 h-4" />
          Chat with Angel ({selectedItemIds.size} selected)
        </Button>
      </div>
      
      {isChatModalOpen && (
        <BudgetChatModal
          isOpen={isChatModalOpen}
          onClose={() => setIsChatModalOpen(false)}
          sessionId={sessionId}
          selectedItems={selectedItems}
          allBudgetItems={allBudgetItems}
          businessContext={businessContext}
          businessPlanSummary={budgetIntro.section1.paragraphs.join('\n\n')} // Placeholder, should come from actual business plan
        />
      )}

      <Tabs defaultValue={(() => {
        if (typeof window !== 'undefined') {
          const saved = window.localStorage.getItem('budgetDashboardTab');
          if (saved && ['overview', 'manage', 'analysis'].includes(saved)) return saved;
        }
        return 'overview';
      })()}
        onValueChange={(value) => {
          if (typeof window !== 'undefined') {
            window.localStorage.setItem('budgetDashboardTab', value);
          }
        }}
        className="w-full"
      >
        <TabsList className="bg-transparent p-0 h-auto flex flex-wrap gap-2">
          <TabsTrigger
            value="overview"
            className="min-h-[44px] px-4 py-2 rounded-lg bg-[#039BE5] text-white border border-transparent shadow-sm hover:bg-[#0288D1] active:bg-[#0277BD] transition-colors focus-visible:ring-2 focus-visible:ring-[#0288D1]/60 focus-visible:outline-none data-[state=active]:bg-[#0277BD] data-[state=active]:text-white"
          >
            Overview
          </TabsTrigger>
          <TabsTrigger
            value="manage"
            className="min-h-[44px] px-4 py-2 rounded-lg bg-[#039BE5] text-white border border-transparent shadow-sm hover:bg-[#0288D1] active:bg-[#0277BD] transition-colors focus-visible:ring-2 focus-visible:ring-[#0288D1]/60 focus-visible:outline-none data-[state=active]:bg-[#0277BD] data-[state=active]:text-white"
          >
            Manage Items
          </TabsTrigger>
          <TabsTrigger
            value="analysis"
            className="min-h-[44px] px-4 py-2 rounded-lg bg-[#039BE5] text-white border border-transparent shadow-sm hover:bg-[#0288D1] active:bg-[#0277BD] transition-colors focus-visible:ring-2 focus-visible:ring-[#0288D1]/60 focus-visible:outline-none data-[state=active]:bg-[#0277BD] data-[state=active]:text-white"
          >
            Analysis
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4 space-y-6">
          <StartupBudgetSummary
            initialInvestment={budget.initial_investment}
            totalStartupCosts={startupCostsTotal}
            currency={currency}
          />
          <div className="pt-2">
            <hr className="border-gray-200" />
            <div className="mt-4 flex items-center justify-between">
              <div>
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900">Detailed Budget</h3>
                <p className="text-sm sm:text-base text-gray-600">
                  {viewMode === 'actual' ? 'Actual' : 'Estimated'} budget for Year 1
                </p>
              </div>
            </div>
          </div>

          <Card className="shadow-lg">
            <CardContent className="p-4 sm:p-6 space-y-6">
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">{budgetIntro.section1.title}</h3>
                <div className="space-y-2 text-gray-700 leading-relaxed">
                  {budgetIntro.section1.paragraphs.map((p) => (
                    <p key={p}>{p}</p>
                  ))}
                </div>
              </div>

              <hr className="border-gray-200" />

              <div>
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">{budgetIntro.section2.title}</h3>
                <p className="text-gray-700 leading-relaxed mb-2">{budgetIntro.section2.intro}</p>
                <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                  {budgetIntro.section2.list1.map((li) => (
                    <li key={li}>{li}</li>
                  ))}
                </ul>
                <p className="text-gray-700 leading-relaxed mt-3 mb-2">{budgetIntro.section2.outro}</p>
                <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                  {budgetIntro.section2.list2.map((li) => (
                    <li key={li}>{li}</li>
                  ))}
                </ul>
              </div>

              <hr className="border-gray-200" />

              <div>
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">{budgetIntro.section3.title}</h3>
                <div className="space-y-2 text-gray-700 leading-relaxed">
                  {budgetIntro.section3.paragraphs.map((p) => (
                    <p key={p}>{p}</p>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-2 border-gray-200">
            <CardContent className="p-4 sm:p-6 space-y-6">
              <BudgetSummaryCards
                startupCostsTotal={startupCostsTotal}
                initialInvestment={budget.initial_investment}
                effectiveMonthlyRevenueForBreakEven={effectiveMonthlyRevenueForBreakEven}
                totalMonthlyCosts={totalMonthlyCosts}
                monthlyNetIncome={monthlyNetIncome}
              />

              <BreakEvenAnalysis
                breakEven={breakEven}
                effectiveMonthlyRevenueForBreakEven={effectiveMonthlyRevenueForBreakEven}
                totalMonthlyCosts={totalMonthlyCosts}
                monthlyNetIncome={monthlyNetIncome}
              />

              <BudgetCharts
                startupChartData={[]}
                monthlyChartData={[]}
                currency={currency}
              />
            </CardContent>
          </Card>

          <div className="flex justify-center">
            <Button
              variant="outline"
              onClick={() => {
                if (typeof window !== 'undefined') {
                  window.localStorage.setItem('budgetDashboardTab', 'manage');
                  window.dispatchEvent(new Event('storage'));
                }
              }}
              className="min-h-[44px] px-6 py-2 rounded-lg border-2 border-blue-500 text-blue-600 hover:bg-blue-50 transition-colors"
            >
              Edit Line Items →
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="analysis" className="mt-4 space-y-6">
          <Card className="shadow-lg border-2 border-gray-200">
            <CardContent className="p-4 sm:p-6 space-y-6">
              <BreakEvenAnalysis
                breakEven={breakEven}
                effectiveMonthlyRevenueForBreakEven={effectiveMonthlyRevenueForBreakEven}
                totalMonthlyCosts={totalMonthlyCosts}
                monthlyNetIncome={monthlyNetIncome}
              />

              <BudgetCharts
                startupChartData={[]}
                monthlyChartData={[]}
                currency={currency}
              />
            </CardContent>
          </Card>

          <div className="flex justify-center">
            <Button
              variant="outline"
              onClick={() => {
                if (typeof window !== 'undefined') {
                  window.localStorage.setItem('budgetDashboardTab', 'manage');
                  window.dispatchEvent(new Event('storage'));
                }
              }}
              className="min-h-[44px] px-6 py-2 rounded-lg border-2 border-blue-500 text-blue-600 hover:bg-blue-50 transition-colors"
            >
              Adjust Budget →
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="manage" className="mt-4 space-y-6">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-gray-900">Budget Item Manager</CardTitle>
            </CardHeader>
            <CardContent>
              <BudgetItemManager
                items={expenses}
                onAddItem={(item) => {
                  void handleAddItem(item);
                }}
                onUpdateItem={onUpdateItem}
                onDeleteItem={handleDeleteItem}
                currency={currency}
              />
            </CardContent>
          </Card>

          {/* Remove Item Modal */}
          <RemoveItemModal
            isOpen={removeModalState.isOpen}
            onClose={closeRemoveModal}
            onConfirm={confirmRemoveItem}
            itemName={removeModalState.itemName}
            isCustom={removeModalState.isCustom}
          />

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm sm:text-base text-gray-600">Edit your budget line items below. All changes update the summary above.</p>
            </div>
            {selectedItemIds.size > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"
              >
                {selectedItemIds.size} items selected
              </motion.div>
            )}
          </div>

          <div className="space-y-6">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="text-gray-900">Startup Costs</CardTitle>
              </CardHeader>
              <CardContent>
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
                  onRemoveItem={openRemoveModal} // Pass the openRemoveModal function
                />
              </CardContent>
            </Card>

            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="text-gray-900">Startup Funds</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg bg-gray-50 border border-gray-200 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Initial Investment</p>
                      <CurrencyInput
                        value={budget.initial_investment}
                        onChange={(value) => handleBudgetUpdate({ initial_investment: value })}
                        min={0}
                        step={100} // Default step, will be overridden by getSmartStepForInitialInvestment
                        getSmartStep={getSmartStepForInitialInvestment}
                        className="w-full max-w-[200px]"
                      />
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Monthly Net</p>
                      <p className={`text-2xl font-bold ${monthlyNetIncome >= 0 ? 'text-green-700' : 'text-red-700'}`}>{formatCurrency(monthlyNetIncome)}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="text-gray-900">Monthly Revenue</CardTitle>
              </CardHeader>
              <CardContent>
                {loadingRevenueStreams ? (
                  <p>Loading revenue streams...</p>
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

            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="text-gray-900">Monthly Operating Expenses</CardTitle>
              </CardHeader>
              <CardContent>
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
                  onRemoveItem={openRemoveModal} // Pass the openRemoveModal function
                />
              </CardContent>
            </Card>

            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="text-gray-900">Monthly Payroll</CardTitle>
              </CardHeader>
              <CardContent>
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
                  onRemoveItem={openRemoveModal} // Pass the openRemoveModal function
                />
              </CardContent>
            </Card>

            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="text-gray-900">Monthly COGS</CardTitle>
              </CardHeader>
              <CardContent>
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
                  onRemoveItem={openRemoveModal} // Pass the openRemoveModal function
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <div className="flex justify-center mt-4">
        <Button onClick={handleExportPdf} className="flex items-center gap-2">
          <Download className="w-4 h-4" /> Export as PDF
        </Button>
      </div>

      {addLineItemCategory && (
        <AddLineItemModal
          isOpen={isAddLineItemModalOpen}
          onClose={closeAddLineItemModal}
          onAddExpenseItem={(item) => {
            // Persist expenses through the same path as other budget items
            handleAddItem(item);
          }}
          onAddRevenueStream={(payload) => {
            const uuid =
              typeof crypto !== 'undefined' && 'randomUUID' in crypto
                ? crypto.randomUUID()
                : Date.now().toString();
            const id = `custom-${uuid}`;
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
              // Persist selected revenue streams
              saveRevenueStreamsDebounced(next);
              // Keep totals in sync immediately
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
      )}
    </div>
  );
};

export default BudgetDashboard;