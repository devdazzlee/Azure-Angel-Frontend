import React, { useState, useMemo } from 'react';
import { TrendingUp, TrendingDown, Minus, Plus, Calendar, Download, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatCurrency } from '@/lib/formatters';

import type { BudgetItem } from '@/types/apiTypes';

interface BudgetComparisonViewProps {
  budget: BudgetItem[];
  actuals?: { [itemId: string]: { amount: number; date: string; notes?: string } };
  onUpdateActual?: (itemId: string, actual: { amount: number; date: string; notes?: string }) => void;
  currency?: string;
  className?: string;
}

type ViewMode = 'budget' | 'tracking';
type TimePeriod = 'current' | 'last-month' | 'quarter' | 'year' | 'custom';

const BudgetComparisonView: React.FC<BudgetComparisonViewProps> = ({
  budget,
  actuals = {},
  onUpdateActual,
  currency = '$',
  className = ''
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('budget');
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('current');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');

  // Calculate variance for each item
  const budgetComparison = useMemo(() => {
    return budget.map(item => {
      const actual = actuals[item.id];
      const budgetAmount = Number(item.estimated_amount) || 0;
      const actualAmount = actual?.amount || 0;
      const variance = actualAmount - budgetAmount;
      const variancePercentage = budgetAmount !== 0 ? (variance / budgetAmount) * 100 : 0;

      return {
        ...item,
        actualAmount,
        budgetAmount,
        variance,
        variancePercentage,
        status: actualAmount === 0 ? 'no-data' : 
                variance > 0 ? 'over-budget' : 
                variance < 0 ? 'under-budget' : 
                Math.abs(variancePercentage) <= 5 ? 'on-track' : 'close'
      };
    });
  }, [budget, actuals]);

  // Calculate summary statistics
  const summaryStats = useMemo(() => {
    const totalBudget = budgetComparison.reduce((sum, item) => sum + item.budgetAmount, 0);
    const totalActual = budgetComparison.reduce((sum, item) => sum + item.actualAmount, 0);
    const totalVariance = totalActual - totalBudget;
    const variancePercentage = totalBudget !== 0 ? (totalVariance / totalBudget) * 100 : 0;

    const itemsOverBudget = budgetComparison.filter(item => item.status === 'over-budget').length;
    const itemsUnderBudget = budgetComparison.filter(item => item.status === 'under-budget').length;
    const itemsOnTrack = budgetComparison.filter(item => item.status === 'on-track').length;

    return {
      totalBudget,
      totalActual,
      totalVariance,
      variancePercentage,
      itemsOverBudget,
      itemsUnderBudget,
      itemsOnTrack,
      itemsWithActuals: budgetComparison.filter(item => item.actualAmount > 0).length,
      itemsWithoutActuals: budgetComparison.filter(item => item.actualAmount === 0).length
    };
  }, [budgetComparison]);

  const getVarianceColor = (status: string) => {
    switch (status) {
      case 'over-budget': return 'text-red-600 bg-red-50';
      case 'under-budget': return 'text-green-600 bg-green-50';
      case 'on-track': return 'text-blue-600 bg-blue-50';
      case 'close': return 'text-yellow-600 bg-yellow-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getVarianceIcon = (status: string) => {
    switch (status) {
      case 'over-budget': return <TrendingUp className="w-4 h-4" />;
      case 'under-budget': return <TrendingDown className="w-4 h-4" />;
      case 'on-track': return <Minus className="w-4 h-4" />;
      case 'close': return <Plus className="w-4 h-4" />;
      default: return <Minus className="w-4 h-4" />;
    }
  };

  const handleActualChange = (itemId: string, field: 'amount' | 'date' | 'notes', value: any) => {
    const currentActual = actuals[itemId] || { amount: 0, date: '', notes: '' };
    const updatedActual = { ...currentActual, [field]: value };
    
    if (onUpdateActual) {
      onUpdateActual(itemId, updatedActual);
    }
  };

  const exportComparison = () => {
    const csvContent = [
      ['Item Name', 'Budget', 'Actual', 'Variance', 'Variance %', 'Status', 'Notes'],
      ...budgetComparison.map(item => [
        item.name,
        item.budgetAmount.toString(),
        item.actualAmount.toString(),
        item.variance.toString(),
        `${item.variancePercentage.toFixed(1)}%`,
        item.status,
        actuals[item.id]?.notes || ''
      ])
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `budget-comparison-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Calendar className="w-5 h-5" />
              Budget vs. Actual Comparison
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === 'tracking' ? 'default' : 'outline'}
                onClick={() => setViewMode('tracking')}
                className="flex items-center gap-2"
              >
                <Filter className="w-4 h-4" />
                Tracking View
              </Button>
              <Button
                variant={viewMode === 'budget' ? 'default' : 'outline'}
                onClick={() => setViewMode('budget')}
                className="flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Budget View
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Label htmlFor="time-period">Time Period:</Label>
              <Select value={timePeriod} onValueChange={(value) => setTimePeriod(value as TimePeriod)}>
                <SelectTrigger className="w-40">
                  {timePeriod === 'current' && 'Current Month'}
                  {timePeriod === 'last-month' && 'Last Month'}
                  {timePeriod === 'quarter' && 'Quarter'}
                  {timePeriod === 'year' && 'Year'}
                  {timePeriod === 'custom' && 'Custom Range'}
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="current">Current Month</SelectItem>
                  <SelectItem value="last-month">Last Month</SelectItem>
                  <SelectItem value="quarter">Quarter</SelectItem>
                  <SelectItem value="year">Year</SelectItem>
                  <SelectItem value="custom">Custom Range</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {timePeriod === 'custom' && (
              <div className="flex items-center gap-2">
                <div>
                  <Label htmlFor="start-date">Start:</Label>
                  <Input
                    id="start-date"
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="w-32"
                  />
                </div>
                <div>
                  <Label htmlFor="end-date">End:</Label>
                  <Input
                    id="end-date"
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="w-32"
                  />
                </div>
              </div>
            )}
            
            <Button
              variant="outline"
              onClick={exportComparison}
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export Comparison
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Summary Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card className="bg-white">
          <CardContent className="p-6 text-center">
            <div className="text-2xl font-bold text-gray-900 mb-2">
              {formatCurrency(summaryStats.totalBudget)}
            </div>
            <div className="text-sm text-gray-600">Total Budget</div>
          </CardContent>
        </Card>
        
        <Card className="bg-white">
          <CardContent className="p-6 text-center">
            <div className="text-2xl font-bold text-gray-900 mb-2">
              {formatCurrency(summaryStats.totalActual)}
            </div>
            <div className="text-sm text-gray-600">Total Actual</div>
          </CardContent>
        </Card>
        
        <Card className="bg-white">
          <CardContent className="p-6 text-center">
            <div className={`text-2xl font-bold mb-2 ${
              summaryStats.totalVariance > 0 ? 'text-red-600' : 
              summaryStats.totalVariance < 0 ? 'text-green-600' : 'text-gray-900'
            }`}>
              {formatCurrency(Math.abs(summaryStats.totalVariance))}
            </div>
            <div className="text-sm text-gray-600">
              {summaryStats.totalVariance > 0 ? 'Over Budget' : 
               summaryStats.totalVariance < 0 ? 'Under Budget' : 'On Track'}
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-white">
          <CardContent className="p-6 text-center">
            <div className={`text-2xl font-bold mb-2 ${
              summaryStats.variancePercentage > 0 ? 'text-red-600' : 
              summaryStats.variancePercentage < 0 ? 'text-green-600' : 'text-gray-900'
            }`}>
              {Math.abs(summaryStats.variancePercentage).toFixed(1)}%
            </div>
            <div className="text-sm text-gray-600">Variance</div>
          </CardContent>
        </Card>
      </div>

      {/* Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4 text-center">
            <div className="text-3xl font-bold text-red-600 mb-2">
              {summaryStats.itemsOverBudget}
            </div>
            <div className="text-sm text-red-700">Over Budget</div>
          </CardContent>
        </Card>
        
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4 text-center">
            <div className="text-3xl font-bold text-green-600 mb-2">
              {summaryStats.itemsUnderBudget}
            </div>
            <div className="text-sm text-green-700">Under Budget</div>
          </CardContent>
        </Card>
        
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4 text-center">
            <div className="text-3xl font-bold text-blue-600 mb-2">
              {summaryStats.itemsOnTrack}
            </div>
            <div className="text-sm text-blue-700">On Track</div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Comparison Table */}
      <Card>
        <CardHeader>
          <CardTitle>Budget vs. Actual Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="border border-gray-200 px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Item Name
                  </th>
                  <th className="border border-gray-200 px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="border border-gray-200 px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Budget
                  </th>
                  <th className="border border-gray-200 px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Actual
                  </th>
                  <th className="border border-gray-200 px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Variance
                  </th>
                  <th className="border border-gray-200 px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Variance %
                  </th>
                  <th className="border border-gray-200 px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="border border-gray-200 px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {budgetComparison.map((item) => (
                  <tr key={item.id} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="border border-gray-200 px-4 py-2 text-sm">
                      <div className="font-medium text-gray-900">{item.name}</div>
                      <div className="text-xs text-gray-500">{item.category}</div>
                    </td>
                    <td className="border border-gray-200 px-4 py-2 text-sm text-right">
                      {formatCurrency(item.budgetAmount)}
                    </td>
                    <td className="border border-gray-200 px-4 py-2 text-sm">
                      <Input
                        type="number"
                        value={actuals[item.id]?.amount || ''}
                        onChange={(e) => handleActualChange(item.id, 'amount', parseFloat(e.target.value) || 0)}
                        className="w-24 text-right border-0 bg-transparent"
                        placeholder="0.00"
                      />
                    </td>
                    <td className="border border-gray-200 px-4 py-2 text-sm">
                      <div className={`font-medium ${getVarianceColor(item.status)}`}>
                        {formatCurrency(item.variance)}
                      </div>
                    </td>
                    <td className="border border-gray-200 px-4 py-2 text-sm">
                      <div className={`font-medium ${getVarianceColor(item.status)}`}>
                        {item.variancePercentage.toFixed(1)}%
                      </div>
                    </td>
                    <td className="border border-gray-200 px-4 py-2 text-sm">
                      <div className={`flex items-center gap-2 ${getVarianceColor(item.status)}`}>
                        {getVarianceIcon(item.status)}
                        <span className="capitalize">{item.status.replace('-', ' ')}</span>
                      </div>
                    </td>
                    <td className="border border-gray-200 px-4 py-2 text-sm">
                      <Input
                        type="date"
                        value={actuals[item.id]?.date || ''}
                        onChange={(e) => handleActualChange(item.id, 'date', e.target.value)}
                        className="w-28 border-0 bg-transparent"
                      />
                    </td>
                    <td className="border border-gray-200 px-4 py-2 text-sm">
                      <Input
                        type="text"
                        value={actuals[item.id]?.notes || ''}
                        onChange={(e) => handleActualChange(item.id, 'notes', e.target.value)}
                        className="w-32 border-0 bg-transparent"
                        placeholder="Add notes..."
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BudgetComparisonView;
