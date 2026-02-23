import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  ArrowUp, 
  ArrowLeft,
  Download, 
  FileSpreadsheet, 
  FileText, 
  Printer, 
  Calculator,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle,
  Target,
  DollarSign,
  Users,
  Package,
  Calendar,
  ChevronRight
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import type { BudgetItem, RevenueStream } from '@/types/apiTypes';
import { formatCurrency } from '@/lib/utils';
import { BreakEvenAnalysis } from './BreakEvenAnalysis';
import { toast } from 'react-toastify';
import { budgetService } from '@/services/budgetService';
import BudgetCharts from './BudgetCharts';
import StartupCostsTable from './StartupCostsTable';
import OperatingExpensesTable from './OperatingExpensesTable';
import RevenueTable from './RevenueTable';
import { BudgetSummaryCards } from './BudgetSummaryCards';
import AddLineItemModal from './AddLineItemModal';

interface BudgetFullDashboardProps {
  budget: {
    items: BudgetItem[];
    initial_investment: number;
  };
  onUpdateBudget: (updates: Partial<{ items: BudgetItem[] }>) => void;
  currency?: string;
  sessionId?: string;
}

interface SectionRef {
  id: string;
  label: string;
  ref: React.RefObject<HTMLDivElement>;
}

export const BudgetFullDashboard: React.FC<BudgetFullDashboardProps> = ({
  budget,
  onUpdateBudget,
  currency = 'USD',
  sessionId,
}) => {
  // Section refs for navigation
  const summaryRef = useRef<HTMLDivElement>(null);
  const breakEvenRef = useRef<HTMLDivElement>(null);
  const chartsRef = useRef<HTMLDivElement>(null);
  const startupRef = useRef<HTMLDivElement>(null);
  const revenueRef = useRef<HTMLDivElement>(null);
  const operatingRef = useRef<HTMLDivElement>(null);
  const sections: SectionRef[] = [
    { id: 'summary', label: 'Summary', ref: summaryRef },
    { id: 'break-even', label: 'Break-Even', ref: breakEvenRef },
    { id: 'charts', label: 'Charts', ref: chartsRef },
    { id: 'startup', label: 'Startup Costs', ref: startupRef },
    { id: 'revenue', label: 'Revenue', ref: revenueRef },
    { id: 'operating', label: 'Operating', ref: operatingRef },
  ];

  // Calculate all budget metrics FIRST (before using them in state)
  const classifyExpenseGroup = useCallback((item: BudgetItem): 'startup' | 'operating' | 'other' => {
    const id = String(item.id || '');
    if (id.startsWith('startup_')) return 'startup';
    if (id.startsWith('operating_') || id.startsWith('payroll_') || id.startsWith('cogs_')) return 'operating';

    const name = String(item.name || '').trim().toLowerCase();

    const startupHints = [
      'business registration', 'licenses', 'legal & accounting setup',
      'equipment & tools', 'initial inventory', 'vehicle purchase',
      'vehicle lease', 'branding & design', 'website & initial',
      'insurance (initial', 'office / workspace setup',
    ];

    const operatingHints = [
      'rent / workspace', 'utilities & internet', 'software subscriptions',
      'insurance (monthly)', 'marketing & advertising', 'accounting & bookkeeping',
      'professional services', 'vehicle expenses', 'phone & communications',
      'miscellaneous / buffer', 'inventory replenishment',
      'founder compensation', 'employee wages', 'payroll taxes',
      'benefits', 'contractors / freelancers',
      'materials / supplies', 'manufacturing / production',
      'packaging & shipping', 'payment processing fees',
    ];

    if (startupHints.some((h) => name.includes(h))) return 'startup';
    if (operatingHints.some((h) => name.includes(h))) return 'operating';

    return 'other';
  }, []);

  // Calculate expense and revenue categories
  const expenses = useMemo(() => budget.items.filter(item => item.category === 'expense'), [budget.items]);
  const revenues = useMemo(() => budget.items.filter(item => item.category === 'revenue'), [budget.items]);
  
  const startupCostItems = useMemo(() => expenses.filter(item => classifyExpenseGroup(item) === 'startup'), [expenses, classifyExpenseGroup]);
  const operatingExpenseItems = useMemo(() => expenses.filter(item => classifyExpenseGroup(item) === 'operating'), [expenses, classifyExpenseGroup]);
  const otherExpenses = useMemo(() => expenses.filter(item => classifyExpenseGroup(item) === 'other'), [expenses, classifyExpenseGroup]);

  // State for revenue streams (initialized AFTER revenues is calculated)
  const [revenueStreams, setRevenueStreams] = useState<RevenueStream[]>(() => {
    return revenues.map(item => ({
      id: item.id,
      name: item.name,
      estimatedPrice: item.estimated_amount || 0,
      estimatedVolume: 1,
      revenueProjection: item.estimated_amount || 0,
      isSelected: item.isSelected !== false,
      isCustom: item.is_custom || false,
      category: 'revenue' as const,
    }));
  });

  // Update revenue streams when revenues change
  useEffect(() => {
    setRevenueStreams(prev => {
      const newStreams = revenues.map(item => {
        const existing = prev.find(s => s.id === item.id);
        return {
          id: item.id,
          name: item.name,
          estimatedPrice: existing ? existing.estimatedPrice : (item.estimated_amount || 0),
          estimatedVolume: existing ? existing.estimatedVolume : 1,
          revenueProjection: existing ? existing.revenueProjection : (item.estimated_amount || 0),
          isSelected: item.isSelected !== false,
          isCustom: item.is_custom || false,
          category: 'revenue' as const,
        };
      });
      return newStreams;
    });
  }, [revenues]);

  // Add state hooks that were missing
  const [showActuals, setShowActuals] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(new Set());

  // State for AddLineItemModal
  const [isAddLineItemModalOpen, setIsAddLineItemModalOpen] = useState(false);
  const [addLineItemCategory, setAddLineItemCategory] = useState<
    'startup_cost' | 'operating_expense' | 'revenue' | null
  >(null);

  const openAddLineItemModal = useCallback(
    (category: 'startup_cost' | 'operating_expense' | 'revenue') => {
      setAddLineItemCategory(category);
      setIsAddLineItemModalOpen(true);
    },
    []
  );

  const closeAddLineItemModal = useCallback(() => {
    setIsAddLineItemModalOpen(false);
    setAddLineItemCategory(null);
  }, []);

  const startupCostsTotal = startupCostItems.reduce((sum, item) => 
    sum + (showActuals ? (item.actual_amount || 0) : (item.estimated_amount || 0)), 0
  );

  const totalMonthlyCosts = 
    operatingExpenseItems.reduce((sum, item) => 
      sum + (showActuals ? (item.actual_amount || 0) : (item.estimated_amount || 0)), 0);

  const monthlyRevenue = revenues.reduce((sum, item) => 
    sum + (showActuals ? (item.actual_amount || 0) : (item.estimated_amount || 0)), 0
  );

  const monthlyNetIncome = monthlyRevenue - totalMonthlyCosts;

  // Break-even calculation
  const breakEven = React.useMemo(() => {
    if (monthlyNetIncome <= 0) {
      return { status: 'never' as const, months: null, years: null };
    }
    const months = Math.max(0, Math.ceil(startupCostsTotal / monthlyNetIncome));
    const years = months >= 24 ? months / 12 : null;
    return { status: 'months' as const, months, years };
  }, [monthlyNetIncome, startupCostsTotal]);

  // Chart data
  const startupChartData = React.useMemo(() => {
    const data: { name: string; value: number }[] = [];
    startupCostItems.forEach(item => {
      const amount = showActuals ? (item.actual_amount || 0) : (item.estimated_amount || 0);
      if (amount > 0) {
        data.push({ name: item.name, value: amount });
      }
    });
    return data;
  }, [startupCostItems, showActuals]);

  const monthlyChartData = React.useMemo(() => {
    const data: { name: string; value: number }[] = [];
    
    const categories = [
      { name: 'Operating', items: operatingExpenseItems },
    ];

    categories.forEach(cat => {
      const total = cat.items.reduce((sum, item) => 
        sum + (showActuals ? (item.actual_amount || 0) : (item.estimated_amount || 0)), 0
      );
      if (total > 0) {
        data.push({ name: cat.name, value: total });
      }
    });

    return data;
  }, [operatingExpenseItems, showActuals]);

  // Scroll to section
  const scrollToSection = (ref: React.RefObject<HTMLDivElement>) => {
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // Generate CSV data for export
  const generateCSVData = useCallback(() => {
    const headers = ['Category', 'Item Name', 'Description', 'Estimated Amount', 'Actual Amount', 'Difference'];
    const rows: string[] = [headers.join(',')];

    budget.items.forEach(item => {
      const estimated = item.estimated_amount || 0;
      const actual = item.actual_amount || 0;
      const diff = actual - estimated;
      // Properly escape values that might contain commas
      const escapeCSV = (val: string) => `"${val.replace(/"/g, '""')}"`;
      rows.push([
        item.category,
        escapeCSV(item.name),
        escapeCSV(item.description || ''),
        estimated,
        actual,
        diff
      ].join(','));
    });

    return rows.join('\n');
  }, [budget.items]);

  // Download CSV helper
  const downloadCSV = useCallback((data: string, filename: string) => {
    const blob = new Blob([data], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }, []);

  // Export functions with proper error handling
  const handleExportPDF = useCallback(async () => {
    setIsExporting(true);
    try {
      window.print();
    } catch (error) {
      console.error('PDF export failed:', error);
      if (typeof toast !== 'undefined' && toast.error) {
        toast.error('Failed to export PDF');
      } else {
        alert('Failed to export PDF');
      }
    } finally {
      setIsExporting(false);
    }
  }, []);

  const handleExportExcel = useCallback(async () => {
    setIsExporting(true);
    try {
      const csvData = generateCSVData();
      const filename = `budget-export-${new Date().toISOString().split('T')[0]}.csv`;
      downloadCSV(csvData, filename);
      if (typeof toast !== 'undefined' && toast.success) {
        toast.success('Excel export completed');
      }
    } catch (error) {
      console.error('Excel export failed:', error);
      if (typeof toast !== 'undefined' && toast.error) {
        toast.error('Failed to export Excel');
      } else {
        alert('Failed to export Excel');
      }
    } finally {
      setIsExporting(false);
    }
  }, [generateCSVData, downloadCSV]);

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  // Handle revenue stream changes from RevenueTable
  const handleRevenueStreamsChange = useCallback((updatedStreams: RevenueStream[]) => {
    setRevenueStreams(updatedStreams);
    
    // Convert back to BudgetItem format and update budget
    const updatedRevenueItems: BudgetItem[] = updatedStreams.map(stream => ({
      id: stream.id,
      name: stream.name,
      category: 'revenue' as const,
      estimated_amount: stream.revenueProjection,
      actual_amount: undefined,
      description: '',
      is_custom: stream.isCustom,
      isSelected: stream.isSelected,
    }));
    
    const nextItems: BudgetItem[] = [
      ...startupCostItems,
      ...operatingExpenseItems,
      ...otherExpenses,
      ...updatedRevenueItems,
    ];
    onUpdateBudget({ items: nextItems });
  }, [startupCostItems, operatingExpenseItems, otherExpenses, onUpdateBudget]);

  // Handle total monthly revenue changes
  const handleTotalMonthlyRevenueChange = useCallback((total: number) => {
    console.log('Total monthly revenue updated:', total);
  }, []);

  // Toggle item selection
  const onToggleItemSelection = (id: string) => {
    setSelectedItemIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const onToggleSectionSelection = (ids: string[], isSelected: boolean) => {
    setSelectedItemIds(prev => {
      const newSet = new Set(prev);
      ids.forEach(id => {
        if (isSelected) {
          newSet.add(id);
        } else {
          newSet.delete(id);
        }
      });
      return newSet;
    });
  };

  // Get status badge
  const getStatusBadge = () => {
    if (monthlyNetIncome < 0) {
      return <Badge variant="destructive" className="flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Over Budget</Badge>;
    }
    if (breakEven.status === 'never') {
      return <Badge variant="secondary" className="flex items-center gap-1 bg-yellow-100 text-yellow-800"><AlertCircle className="w-3 h-3" /> No Break-Even</Badge>;
    }
    if (breakEven.months && breakEven.months <= 12) {
      return <Badge variant="default" className="flex items-center gap-1 bg-green-100 text-green-800"><CheckCircle className="w-3 h-3" /> On Track</Badge>;
    }
    return <Badge variant="secondary" className="flex items-center gap-1"><Target className="w-3 h-3" /> Needs Attention</Badge>;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Print styles */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          .print-break { page-break-before: always; }
          body { background: white; }
        }
      `}</style>

      {/* Sticky Navigation */}
      <div className="no-print sticky top-0 z-50 bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            {/* Quick Nav */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 lg:pb-0">
              <span className="text-sm font-medium text-gray-600 whitespace-nowrap">Jump to:</span>
              {sections.map(section => (
                <Button
                  key={section.id}
                  variant="ghost"
                  size="sm"
                  onClick={() => scrollToSection(section.ref)}
                  className="text-xs whitespace-nowrap"
                >
                  {section.label}
                </Button>
              ))}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* View Mode Toggle */}
              <div className="flex items-center gap-2 mr-4">
                <Switch
                  id="view-mode"
                  checked={showActuals}
                  onCheckedChange={setShowActuals}
                />
                <Label htmlFor="view-mode" className="text-sm">
                  {showActuals ? 'Actuals' : 'Estimated'}
                </Label>
              </div>

              {/* Export Buttons */}
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportPDF}
                disabled={isExporting}
                className="flex items-center gap-1"
              >
                <FileText className="w-4 h-4" />
                PDF
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportExcel}
                disabled={isExporting}
                className="flex items-center gap-1"
              >
                <FileSpreadsheet className="w-4 h-4" />
                Excel
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrint}
                className="flex items-center gap-1"
              >
                <Printer className="w-4 h-4" />
                Print
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Header with Key Metrics */}
        <div ref={summaryRef} className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Budget Dashboard</h1>
              <p className="text-gray-600 mt-1">Complete overview of your business budget</p>
            </div>
            <div className="flex items-center gap-3">
              {getStatusBadge()}
              <Badge variant="outline" className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {new Date().toLocaleDateString()}
              </Badge>
            </div>
          </div>

          {/* Key Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="w-5 h-5 text-blue-600" />
                  <span className="text-sm font-medium text-gray-600">Startup Costs</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(startupCostsTotal)}</p>
                <p className="text-xs text-gray-500 mt-1">One-time expenses</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                  <span className="text-sm font-medium text-gray-600">Monthly Revenue</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(monthlyRevenue)}</p>
                <p className="text-xs text-gray-500 mt-1">Projected income</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingDown className="w-5 h-5 text-red-600" />
                  <span className="text-sm font-medium text-gray-600">Monthly Costs</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalMonthlyCosts)}</p>
                <p className="text-xs text-gray-500 mt-1">Operating expenses</p>
              </CardContent>
            </Card>

            <Card className={`bg-gradient-to-br ${monthlyNetIncome >= 0 ? 'from-emerald-50 to-emerald-100 border-emerald-200' : 'from-orange-50 to-orange-100 border-orange-200'}`}>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Calculator className={`w-5 h-5 ${monthlyNetIncome >= 0 ? 'text-emerald-600' : 'text-orange-600'}`} />
                  <span className="text-sm font-medium text-gray-600">Monthly Net</span>
                </div>
                <p className={`text-2xl font-bold ${monthlyNetIncome >= 0 ? 'text-emerald-700' : 'text-orange-700'}`}>
                  {formatCurrency(monthlyNetIncome)}
                </p>
                <p className="text-xs text-gray-500 mt-1">Profit/Loss per month</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Summary Section */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="w-5 h-5" />
              Budget Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <BudgetSummaryCards
              startupCostsTotal={startupCostsTotal}
              initialInvestment={budget.initial_investment}
              effectiveMonthlyRevenueForBreakEven={monthlyRevenue}
              totalMonthlyCosts={totalMonthlyCosts}
              monthlyNetIncome={monthlyNetIncome}
            />
          </CardContent>
        </Card>

        {/* Break-Even Analysis */}
        <div ref={breakEvenRef}>
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5" />
                Break-Even Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <BreakEvenAnalysis
                breakEven={breakEven}
                effectiveMonthlyRevenueForBreakEven={monthlyRevenue}
                totalMonthlyCosts={totalMonthlyCosts}
                monthlyNetIncome={monthlyNetIncome}
              />
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <div ref={chartsRef}>
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingDown className="w-5 h-5" />
                Cost Breakdown Charts
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <BudgetCharts
                startupChartData={startupChartData}
                monthlyChartData={monthlyChartData}
                currency={currency}
              />
            </CardContent>
          </Card>
        </div>

        {/* Budget Tables */}
        <div className="space-y-6">
          {/* Startup Costs */}
          <div ref={startupRef} className="print-break">
            <Card className="shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  Startup Costs
                </CardTitle>
                <Badge variant="secondary">{startupCostItems.length} items</Badge>
              </CardHeader>
              <CardContent>
                {startupCostItems.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <DollarSign className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p className="text-lg font-medium">No startup costs added yet</p>
                    <p className="text-sm">Add startup costs in the Manage tab</p>
                  </div>
                ) : (
                  <StartupCostsTable
                    items={startupCostItems}
                    onChange={(nextStartupItems) => {
                      const nextItems: BudgetItem[] = [
                        ...nextStartupItems,
                        ...operatingExpenseItems,
                        ...otherExpenses,
                        ...revenues,
                      ];
                      onUpdateBudget({ items: nextItems });
                    }}
                    currency={currency}
                    selectedItemIds={selectedItemIds}
                    onToggleItemSelection={onToggleItemSelection}
                    onToggleAllSelection={(isSelected) =>
                      onToggleSectionSelection(startupCostItems.map((i) => i.id), isSelected)
                    }
                    onAddLineItem={openAddLineItemModal}
                  />
                )}
              </CardContent>
            </Card>
          </div>

          {/* Monthly Revenue */}
          <div ref={revenueRef} className="print-break">
            <Card className="shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Monthly Revenue
                </CardTitle>
                <Badge variant="secondary">{revenues.length} items</Badge>
              </CardHeader>
              <CardContent>
                {revenueStreams.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <TrendingUp className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p className="text-lg font-medium">No revenue streams added yet</p>
                    <p className="text-sm">Add revenue streams to see them here</p>
                  </div>
                ) : (
                  <RevenueTable
                    items={revenueStreams}
                    onRevenueStreamsChange={handleRevenueStreamsChange}
                    onTotalMonthlyRevenueChange={handleTotalMonthlyRevenueChange}
                    currency={currency}
                    selectedItemIds={selectedItemIds}
                    onToggleItemSelection={(itemId: string, isSelected: boolean) => {
                      setSelectedItemIds(prev => {
                        const newSet = new Set(prev);
                        if (isSelected) {
                          newSet.add(itemId);
                        } else {
                          newSet.delete(itemId);
                        }
                        return newSet;
                      });
                    }}
                    onToggleAllSelection={(itemIds: string[], isSelected: boolean) => {
                      setSelectedItemIds(prev => {
                        const newSet = new Set(prev);
                        itemIds.forEach(id => {
                          if (isSelected) {
                            newSet.add(id);
                          } else {
                            newSet.delete(id);
                          }
                        });
                        return newSet;
                      });
                    }}
                    onAddLineItem={openAddLineItemModal}
                  />
                )}
              </CardContent>
            </Card>
          </div>

          {/* Operating Expenses */}
          <div ref={operatingRef} className="print-break">
            <Card className="shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <TrendingDown className="w-5 h-5" />
                  Monthly Operating Expenses
                </CardTitle>
                <Badge variant="secondary">{operatingExpenseItems.length} items</Badge>
              </CardHeader>
              <CardContent>
                {operatingExpenseItems.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <TrendingDown className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p className="text-lg font-medium">No operating expenses added yet</p>
                    <p className="text-sm">Add operating expenses in the Manage tab</p>
                  </div>
                ) : (
                  <OperatingExpensesTable
                    items={operatingExpenseItems}
                    onChange={(nextOperatingItems) => {
                      const nextItems: BudgetItem[] = [
                        ...startupCostItems,
                        ...nextOperatingItems,
                        ...otherExpenses,
                        ...revenues,
                      ];
                      onUpdateBudget({ items: nextItems });
                    }}
                    currency={currency}
                    selectedItemIds={selectedItemIds}
                    onToggleItemSelection={onToggleItemSelection}
                    onToggleAllSelection={(isSelected) =>
                      onToggleSectionSelection(operatingExpenseItems.map((i) => i.id), isSelected)
                    }
                    onAddLineItem={openAddLineItemModal}
                  />
                )}
              </CardContent>
            </Card>
          </div>

        </div>

        {addLineItemCategory && (
          <AddLineItemModal
            isOpen={isAddLineItemModalOpen}
            onClose={closeAddLineItemModal}
            onAddExpenseItem={(item) => {
              if (!sessionId) {
                toast.error('Session ID is missing, cannot add item');
                return;
              }

              void (async () => {
                try {
                  const response = await budgetService.addBudgetItem(sessionId, item);
                  if (response.success) {
                    onUpdateBudget({ items: response.result.items });
                  } else {
                    toast.error(response.message || 'Failed to add item');
                  }
                } catch (error) {
                  console.error('Error adding budget item:', error);
                  toast.error('Failed to add item');
                }
              })();
            }}

            onAddRevenueStream={(payload) => {
              const projection = payload.estimatedPrice * payload.estimatedVolume;
              const baseId = payload.name.trim().toLowerCase().replace(/\s+/g, '-');
              const id = `custom-${baseId}-${revenueStreams.length}`;

              if (!sessionId) {
                toast.error('Session ID is missing, cannot add revenue stream');
                return;
              }

              const revenueItem: Omit<BudgetItem, 'id' | 'created_at' | 'updated_at'> = {
                name: payload.name,
                category: 'revenue',
                estimated_amount: projection,
                actual_amount: undefined,
                description: payload.description,
                is_custom: true,
                isSelected: true,
              };

              void (async () => {
                try {
                  const response = await budgetService.addBudgetItem(sessionId, revenueItem);
                  if (response.success) {
                    onUpdateBudget({ items: response.result.items });
                    setRevenueStreams((prev) => {
                      const next: RevenueStream[] = [
                        ...prev,
                        {
                          id,
                          name: payload.name,
                          estimatedPrice: payload.estimatedPrice,
                          estimatedVolume: payload.estimatedVolume,
                          revenueProjection: projection,
                          isSelected: true,
                          isCustom: true,
                          category: 'revenue',
                        },
                      ];
                      return next;
                    });
                  } else {
                    toast.error(response.message || 'Failed to add revenue stream');
                  }
                } catch (error) {
                  console.error('Error adding revenue stream:', error);
                  toast.error('Failed to add revenue stream');
                }
              })();
            }}
            category={addLineItemCategory}
            existingItems={
              addLineItemCategory === 'revenue'
                ? revenueStreams
                : budget.items.filter((item) => {
                    if (item.category !== 'expense') return false;
                    const group = classifyExpenseGroup(item);
                    return (
                      (group === 'startup' && addLineItemCategory === 'startup_cost') ||
                      (group === 'operating' && addLineItemCategory === 'operating_expense')
                    );
                  })
            }
            currency={currency}
          />
        )}

        {/* Back to Top */}
        <div className="no-print flex justify-center pt-8">
          <Button
            variant="outline"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="flex items-center gap-2"
          >
            <ArrowUp className="w-4 h-4" />
            Back to Top
          </Button>
        </div>
      </div>
    </div>
  );
};

export default BudgetFullDashboard;
