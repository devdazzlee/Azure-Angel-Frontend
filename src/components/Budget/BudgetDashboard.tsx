import React, { useState, useMemo } from 'react';
import { PieChart, BarChart3, TrendingUp, TrendingDown, DollarSign, Eye, EyeOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Budget, BudgetItem, BudgetCategory } from '@/types/apiTypes';
import BudgetPieChart from './BudgetPieChart';
import BudgetBarChart from './BudgetBarChart';
import BudgetItemManager from './BudgetItemManager';

interface BudgetDashboardProps {
  budget: Budget;
  onUpdateBudget: (updates: Partial<Budget>) => void;
  onAddItem: (item: Omit<BudgetItem, 'id' | 'created_at' | 'updated_at'>) => void;
  onUpdateItem: (id: string, updates: Partial<BudgetItem>) => void;
  onDeleteItem: (id: string) => void;
  currency?: string;
  showActuals?: boolean;
}

const BudgetDashboard: React.FC<BudgetDashboardProps> = ({
  budget,
  onUpdateBudget,
  onAddItem,
  onUpdateItem,
  onDeleteItem,
  currency = '$',
  showActuals = false
}) => {
  const [viewMode, setViewMode] = useState<'estimated' | 'actual'>('estimated');

  // Group items by category for pie chart
  const budgetCategories = useMemo(() => {
    const categories: { [key: string]: BudgetCategory } = {};
    
    budget.items.forEach(item => {
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
  }, [budget.items, showActuals]);

  const expenses = budget.items.filter(item => item.category === 'expense');
  const revenues = budget.items.filter(item => item.category === 'revenue');

  const totalEstimatedExpenses = expenses.reduce((sum, item) => sum + item.estimated_amount, 0);
  const totalEstimatedRevenue = revenues.reduce((sum, item) => sum + item.estimated_amount, 0);
  const totalActualExpenses = expenses.reduce((sum, item) => sum + (item.actual_amount || 0), 0);
  const totalActualRevenue = revenues.reduce((sum, item) => sum + (item.actual_amount || 0), 0);

  const currentTotalExpenses = showActuals ? totalActualExpenses : totalEstimatedExpenses;
  const currentTotalRevenue = showActuals ? totalActualRevenue : totalEstimatedRevenue;
  const netBudget = currentTotalRevenue - currentTotalExpenses;

  const formatCurrency = (value: number | null | undefined) => {
    if (value === null || value === undefined || isNaN(value)) {
      return `${currency}0`;
    }
    return `${currency}${value.toLocaleString()}`;
  };

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-0">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Budget Dashboard</h2>
          <p className="text-sm sm:text-base text-gray-600">
            {showActuals ? 'Actual' : 'Estimated'} budget for Year 1
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

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <SummaryCard
          title="Initial Investment"
          value={formatCurrency(budget.initial_investment)}
          icon={DollarSign}
          color="text-blue-600"
          index={0}
        />
        
        <SummaryCard
          title="Total Expenses"
          value={formatCurrency(currentTotalExpenses)}
          icon={TrendingDown}
          color="text-red-600"
          index={1}
        />
        
        <SummaryCard
          title="Total Revenue"
          value={formatCurrency(currentTotalRevenue)}
          icon={TrendingUp}
          color="text-green-600"
          index={2}
        />
        
        <SummaryCard
          title="Net Budget"
          value={formatCurrency(netBudget)}
          icon={PieChart}
          color={netBudget >= 0 ? 'text-green-600' : 'text-red-600'}
          index={3}
        />
      </div>

      {/* Main Content */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 text-xs sm:text-sm">
          <TabsTrigger value="overview" className="text-xs sm:text-sm">Overview</TabsTrigger>
          <TabsTrigger value="items" className="text-xs sm:text-sm">Manage Items</TabsTrigger>
          <TabsTrigger value="analysis" className="text-xs sm:text-sm">Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <AnimatePresence mode="wait">
            <motion.div
              key="charts"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
                {/* Expenses Pie Chart */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <TrendingDown className="w-5 h-5 text-red-500" />
                        Expenses Breakdown
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <BudgetPieChart
                        data={budgetCategories.filter(cat => cat.name.startsWith('Expense') || !cat.name.startsWith('Revenue'))}
                        currency={currency}
                        height={300}
                        showLegend={true}
                      />
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Revenue Pie Chart */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-green-500" />
                        Revenue Breakdown
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <BudgetPieChart
                        data={budgetCategories.filter(cat => cat.name.startsWith('Revenue'))}
                        currency={currency}
                        height={300}
                        showLegend={true}
                      />
                    </CardContent>
                  </Card>
                </motion.div>
              </div>

              {/* Bar Charts */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                <BudgetBarChart
                  expenses={expenses}
                  revenues={revenues}
                  currency={currency}
                  height={350}
                  showActuals={showActuals}
                />
              </motion.div>
            </motion.div>
          </AnimatePresence>
        </TabsContent>

        <TabsContent value="items">
          <BudgetItemManager
            items={budget.items}
            onAddItem={onAddItem}
            onUpdateItem={onUpdateItem}
            onDeleteItem={onDeleteItem}
            currency={currency}
          />
        </TabsContent>

        <TabsContent value="analysis" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
            {/* Budget Variance */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Budget Variance Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {budget.items.map(item => {
                    if (item.actual_amount === undefined || item.actual_amount === null) return null;
                    if (item.estimated_amount === undefined || item.estimated_amount === null) return null;
                    
                    const variance = ((item.actual_amount - item.estimated_amount) / item.estimated_amount) * 100;
                    
                    return (
                      <div key={item.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900">{item.name}</p>
                          <p className="text-sm text-gray-600">
                            Est: {formatCurrency(item.estimated_amount)} | 
                            Actual: {formatCurrency(item.actual_amount)}
                          </p>
                        </div>
                        <div className={`text-sm font-semibold ${variance >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {variance >= 0 ? '+' : ''}{variance.toFixed(1)}%
                        </div>
                      </div>
                    );
                  })}
                  
                  {budget.items.every(item => item.actual_amount === undefined) && (
                    <p className="text-gray-500 text-center py-4">
                      No actual data available yet. Start tracking actual expenses and revenue to see variance analysis.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Key Metrics */}
            <Card>
              <CardHeader>
                <CardTitle>Key Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-600 font-medium">Burn Rate</p>
                    <p className="text-xl font-bold text-blue-900">
                      {formatCurrency(currentTotalExpenses / 12)} / month
                    </p>
                  </div>
                  
                  <div className="p-3 bg-green-50 rounded-lg">
                    <p className="text-sm text-green-600 font-medium">Runway</p>
                    <p className="text-xl font-bold text-green-900">
                      {netBudget > 0 ? Math.floor(budget.initial_investment / (currentTotalExpenses / 12)) : 0} months
                    </p>
                  </div>
                  
                  <div className="p-3 bg-purple-50 rounded-lg">
                    <p className="text-sm text-purple-600 font-medium">Breakeven Point</p>
                    <p className="text-xl font-bold text-purple-900">
                      {currentTotalRevenue > 0 ? 
                        formatCurrency(currentTotalExpenses / (currentTotalRevenue / 12)) : 
                        'N/A'
                      }
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default BudgetDashboard;
