import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowUp, Menu, X, Download, FileText, ArrowLeft, RefreshCw, Save } from 'lucide-react';
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
import { exportBudgetToExcel } from '@/utils/excelExport';
import httpClient from '@/api/httpClient';
import BudgetDashboard from '@/components/Budget/BudgetDashboard';

import type { APIResponse, Budget, BudgetItem, BusinessContextPayload, RevenueStream } from '@/types/apiTypes';

const BudgetPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [budget, setBudget] = useState<Budget | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [businessName, setBusinessName] = useState<string | undefined>(undefined);
  const [businessType, setBusinessType] = useState<string>('Startup'); // Default to 'Startup'

  useEffect(() => {
    if (id) {
      fetchBudget();
      fetchBusinessContext(id); // Fetch business context when component mounts
    }
  }, [id]);

  const fetchBusinessContext = async (sessionId: string) => {
    try {
      const response = await httpClient.get<APIResponse<{ business_context: BusinessContextPayload }>>(`/api/sessions/${sessionId}/business-context`);
      if (response.data.success && response.data.result?.business_context?.business_type) {
        setBusinessType(response.data.result.business_context.business_type);
        if (response.data.result.business_context.business_name) {
          setBusinessName(response.data.result.business_context.business_name);
        }
      } else {
        console.warn("Could not fetch business type, defaulting to 'Startup'");
      }
    } catch (error) {
      console.error("Error fetching business context:", error);
      setBusinessType('Startup'); // Fallback in case of error
    }
  };

  const fetchBudget = async () => {
    try {
      setLoading(true);
      const response = await budgetService.getBudget(id!);
      if (response.success) {
        setBudget(response.result);
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
          setBudget(created.result);
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

  const handleExportExcel = () => {
    if (!budget) return;
    exportBudgetToExcel(budget, businessName);
    toast.success('Budget exported to Excel');
  };

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

  const exportBudget = () => {
    if (!budget) return;
    
    const csvContent = [
      ['Item Name', 'Category', 'Estimated Amount', 'Actual Amount', 'Description'],
      ...budget.items.map(item => [
        item.name,
        item.category,
        item.estimated_amount.toString(),
        item.actual_amount?.toString() || '',
        item.description || ''
      ])
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `budget-${budget.session_id}-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    toast.success('Budget exported successfully');
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
      className="min-h-screen bg-gray-50"
    >
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={() => navigate(`/ventures/${id}`)}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Chat
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Budget Tracking</h1>
                <p className="text-gray-600">Manage your business finances</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportExcel}
                className="flex items-center gap-2 text-green-600 hover:text-green-700 border-green-600"
              >
                <Download className="w-4 h-4" />
                Export to Excel
              </Button>
              <Button
                variant="outline"
                onClick={exportBudget}
                className="flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Export
              </Button>
              
              <Button
                onClick={saveBudget}
                disabled={saving}
                className="flex items-center gap-2"
              >
                {saving ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {saving ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <BudgetDashboard
          budget={budget}
          onUpdateBudget={handleUpdateBudget}
          onUpdateItem={handleUpdateItem}
          onDeleteItem={handleDeleteItem}
          businessType={businessType} // Pass businessType to BudgetDashboard
          sessionId={id!} // Pass sessionId to BudgetDashboard
        />
      </div>
    </motion.div>
  );
};

export default BudgetPage;
