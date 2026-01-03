import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import { ArrowLeft, Save, Download, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BudgetDashboard } from '@/components/Budget';
import type { Budget, BudgetItem } from '@/types/apiTypes';
import { budgetService } from '@/services/budgetService';

const BudgetPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [budget, setBudget] = useState<Budget | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (id) {
      fetchBudget();
    }
  }, [id]);

  const fetchBudget = async () => {
    try {
      setLoading(true);
      const response = await budgetService.getBudget(id!);
      if (response.success) {
        setBudget(response.result);
      } else {
        // If no budget exists, create a default one
        const defaultBudget: Budget = {
          id: '',
          session_id: id!,
          initial_investment: 0,
          total_estimated_expenses: 0,
          total_estimated_revenue: 0,
          items: [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        setBudget(defaultBudget);
      }
    } catch (error) {
      console.error('Error fetching budget:', error);
      toast.error('Failed to load budget');
      
      // Create default budget on error
      const defaultBudget: Budget = {
        id: '',
        session_id: id!,
        initial_investment: 0,
        total_estimated_expenses: 0,
        total_estimated_revenue: 0,
        items: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      setBudget(defaultBudget);
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

  const handleAddItem = (item: Omit<BudgetItem, 'id' | 'created_at' | 'updated_at'>) => {
    if (!budget) return;
    
    const newItem: BudgetItem = {
      ...item,
      id: Date.now().toString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    handleUpdateBudget({
      items: [...budget.items, newItem]
    });
  };

  const handleUpdateItem = (itemId: string, updates: Partial<BudgetItem>) => {
    if (!budget) return;
    
    const updatedItems = budget.items.map(item =>
      item.id === itemId
        ? { ...item, ...updates, updated_at: new Date().toISOString() }
        : item
    );
    
    handleUpdateBudget({ items: updatedItems });
  };

  const handleDeleteItem = (itemId: string) => {
    if (!budget) return;
    
    const updatedItems = budget.items.filter(item => item.id !== itemId);
    handleUpdateBudget({ items: updatedItems });
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
          onAddItem={handleAddItem}
          onUpdateItem={handleUpdateItem}
          onDeleteItem={handleDeleteItem}
        />
      </div>
    </motion.div>
  );
};

export default BudgetPage;
