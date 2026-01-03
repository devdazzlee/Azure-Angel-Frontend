import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DollarSign, TrendingUp, TrendingDown, PieChart, ArrowRight, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import BudgetSlider from './BudgetSlider';
import type { Budget, BudgetItem } from '@/types/apiTypes';

interface BudgetSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (budgetData: {
    initialInvestment: number;
    estimatedExpenses: BudgetItem[];
    estimatedRevenue: BudgetItem[];
  }) => void;
  businessContext?: {
    business_name?: string;
    industry?: string;
    location?: string;
    business_type?: string;
  };
}

const BudgetSetupModal: React.FC<BudgetSetupModalProps> = ({
  isOpen,
  onClose,
  onComplete,
  businessContext
}) => {
  const [step, setStep] = useState(1);
  const [initialInvestment, setInitialInvestment] = useState(0);
  const [estimatedExpenses, setEstimatedExpenses] = useState<BudgetItem[]>([]);
  const [estimatedRevenue, setEstimatedRevenue] = useState<BudgetItem[]>([]);
  const [customExpense, setCustomExpense] = useState({ name: '', amount: 0, description: '' });
  const [customRevenue, setCustomRevenue] = useState({ name: '', amount: 0, description: '' });

  // Generate estimated expenses based on business context
  const generateEstimatedExpenses = () => {
    const baseExpenses: BudgetItem[] = [
      {
        id: '1',
        name: 'Office Rent',
        category: 'expense',
        amount: 2000,
        estimated_amount: 2000,
        description: 'Monthly office space rental',
        is_custom: false
      },
      {
        id: '2',
        name: 'Salaries',
        category: 'expense',
        amount: 8000,
        estimated_amount: 8000,
        description: 'Employee salaries and wages',
        is_custom: false
      },
      {
        id: '3',
        name: 'Marketing',
        category: 'expense',
        amount: 1500,
        estimated_amount: 1500,
        description: 'Marketing and advertising expenses',
        is_custom: false
      },
      {
        id: '4',
        name: 'Utilities',
        category: 'expense',
        amount: 500,
        estimated_amount: 500,
        description: 'Electricity, water, internet',
        is_custom: false
      },
      {
        id: '5',
        name: 'Software & Tools',
        category: 'expense',
        amount: 300,
        estimated_amount: 300,
        description: 'Software licenses and tools',
        is_custom: false
      },
      {
        id: '6',
        name: 'Legal & Accounting',
        category: 'expense',
        amount: 800,
        estimated_amount: 800,
        description: 'Legal fees and accounting services',
        is_custom: false
      },
      {
        id: '7',
        name: 'Insurance',
        category: 'expense',
        amount: 400,
        estimated_amount: 400,
        description: 'Business insurance premiums',
        is_custom: false
      },
      {
        id: '8',
        name: 'Inventory',
        category: 'expense',
        amount: 2000,
        estimated_amount: 2000,
        description: 'Initial inventory and supplies',
        is_custom: false
      }
    ];

    // Adjust based on business type
    if (businessContext?.business_type === 'Service') {
      baseExpenses.find(item => item.name === 'Inventory')!.estimated_amount = 500;
    } else if (businessContext?.business_type === 'E-commerce') {
      baseExpenses.find(item => item.name === 'Marketing')!.estimated_amount = 3000;
      baseExpenses.find(item => item.name === 'Inventory')!.estimated_amount = 5000;
    } else if (businessContext?.business_type === 'Restaurant') {
      baseExpenses.find(item => item.name === 'Office Rent')!.estimated_amount = 3500;
      baseExpenses.find(item => item.name === 'Inventory')!.estimated_amount = 4000;
    }

    setEstimatedExpenses(baseExpenses);
  };

  // Generate estimated revenue based on business context
  const generateEstimatedRevenue = () => {
    const baseRevenue: BudgetItem[] = [
      {
        id: 'r1',
        name: 'Product Sales',
        category: 'revenue',
        amount: 10000,
        estimated_amount: 10000,
        description: 'Revenue from product sales',
        is_custom: false
      },
      {
        id: 'r2',
        name: 'Service Fees',
        category: 'revenue',
        amount: 5000,
        estimated_amount: 5000,
        description: 'Revenue from services',
        is_custom: false
      }
    ];

    // Adjust based on business type
    if (businessContext?.business_type === 'Service') {
      baseRevenue[0].estimated_amount = 2000;
      baseRevenue[1].estimated_amount = 12000;
    } else if (businessContext?.business_type === 'E-commerce') {
      baseRevenue[0].estimated_amount = 15000;
      baseRevenue[1].estimated_amount = 1000;
    } else if (businessContext?.business_type === 'Restaurant') {
      baseRevenue[0].estimated_amount = 12000;
      baseRevenue[1].estimated_amount = 3000;
    }

    setEstimatedRevenue(baseRevenue);
  };

  React.useEffect(() => {
    if (isOpen && step === 2) {
      generateEstimatedExpenses();
      generateEstimatedRevenue();
    }
  }, [isOpen, step]);

  const handleAddCustomExpense = () => {
    if (customExpense.name && customExpense.amount > 0) {
      const newExpense: BudgetItem = {
        id: `custom_${Date.now()}`,
        name: customExpense.name,
        category: 'expense',
        amount: customExpense.amount,
        estimated_amount: customExpense.amount,
        description: customExpense.description,
        is_custom: true
      };
      setEstimatedExpenses([...estimatedExpenses, newExpense]);
      setCustomExpense({ name: '', amount: 0, description: '' });
    }
  };

  const handleAddCustomRevenue = () => {
    if (customRevenue.name && customRevenue.amount > 0) {
      const newRevenue: BudgetItem = {
        id: `custom_${Date.now()}`,
        name: customRevenue.name,
        category: 'revenue',
        amount: customRevenue.amount,
        estimated_amount: customRevenue.amount,
        description: customRevenue.description,
        is_custom: true
      };
      setEstimatedRevenue([...estimatedRevenue, newRevenue]);
      setCustomRevenue({ name: '', amount: 0, description: '' });
    }
  };

  const handleComplete = () => {
    onComplete({
      initialInvestment,
      estimatedExpenses,
      estimatedRevenue
    });
    onClose();
  };

  const totalExpenses = estimatedExpenses.reduce((sum, item) => sum + item.estimated_amount, 0);
  const totalRevenue = estimatedRevenue.reduce((sum, item) => sum + item.estimated_amount, 0);
  const netBudget = totalRevenue - totalExpenses;

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <DollarSign className="w-16 h-16 text-blue-600 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Let's Set Up Your Budget</h3>
              <p className="text-gray-600">
                Based on your business plan for {businessContext?.business_name || 'your business'}, 
                we'll help you create a comprehensive budget for Year 1.
              </p>
            </div>

            <div className="space-y-4">
              <BudgetSlider
                label="Initial Investment"
                value={initialInvestment}
                onChange={setInitialInvestment}
                min={0}
                max={100000}
                step={1000}
                currency="$"
              />
              
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-blue-800">
                  💡 This is the amount you're investing to start your business. 
                  It will be used to cover initial expenses until your business becomes profitable.
                </p>
              </div>
            </div>

            <div className="flex justify-end">
              <Button 
                onClick={() => setStep(2)}
                disabled={initialInvestment === 0}
                className="flex items-center gap-2"
              >
                Continue
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <PieChart className="w-16 h-16 text-green-600 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Estimated Budget Breakdown</h3>
              <p className="text-gray-600">
                We've created estimates based on your {businessContext?.industry || 'industry'} business type. 
                You can adjust these amounts and add custom items.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Expenses */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-red-600">
                    <TrendingDown className="w-5 h-5" />
                    Estimated Expenses
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {estimatedExpenses.map((expense) => (
                    <div key={expense.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                      <span className="text-sm font-medium">{expense.name}</span>
                      <BudgetSlider
                        value={expense.estimated_amount}
                        onChange={(value) => {
                          const updated = estimatedExpenses.map(item =>
                            item.id === expense.id
                              ? { ...item, estimated_amount: value, amount: value }
                              : item
                          );
                          setEstimatedExpenses(updated);
                        }}
                        min={0}
                        max={10000}
                        step={100}
                        currency="$"
                        label={expense.name}
                        className="flex-1 ml-4"
                      />
                    </div>
                  ))}
                  
                  {/* Add Custom Expense */}
                  <div className="border-t pt-3">
                    <p className="text-sm font-medium text-gray-700 mb-2">Add Custom Expense</p>
                    <div className="space-y-2">
                      <Input
                        placeholder="Expense name"
                        value={customExpense.name}
                        onChange={(e) => setCustomExpense({ ...customExpense, name: e.target.value })}
                      />
                      <BudgetSlider
                        label="Amount"
                        value={customExpense.amount}
                        onChange={(value) => setCustomExpense({ ...customExpense, amount: value })}
                        min={0}
                        max={10000}
                        step={100}
                        currency="$"
                      />
                      <Textarea
                        placeholder="Description (optional)"
                        value={customExpense.description}
                        onChange={(e) => setCustomExpense({ ...customExpense, description: e.target.value })}
                        rows={2}
                      />
                      <Button onClick={handleAddCustomExpense} size="sm" className="w-full">
                        Add Expense
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Revenue */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-green-600">
                    <TrendingUp className="w-5 h-5" />
                    Estimated Revenue
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {estimatedRevenue.map((revenue) => (
                    <div key={revenue.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                      <span className="text-sm font-medium">{revenue.name}</span>
                      <BudgetSlider
                        value={revenue.estimated_amount}
                        onChange={(value) => {
                          const updated = estimatedRevenue.map(item =>
                            item.id === revenue.id
                              ? { ...item, estimated_amount: value, amount: value }
                              : item
                          );
                          setEstimatedRevenue(updated);
                        }}
                        min={0}
                        max={20000}
                        step={100}
                        currency="$"
                        label={revenue.name}
                        className="flex-1 ml-4"
                      />
                    </div>
                  ))}
                  
                  {/* Add Custom Revenue */}
                  <div className="border-t pt-3">
                    <p className="text-sm font-medium text-gray-700 mb-2">Add Custom Revenue</p>
                    <div className="space-y-2">
                      <Input
                        placeholder="Revenue source name"
                        value={customRevenue.name}
                        onChange={(e) => setCustomRevenue({ ...customRevenue, name: e.target.value })}
                      />
                      <BudgetSlider
                        label="Amount"
                        value={customRevenue.amount}
                        onChange={(value) => setCustomRevenue({ ...customRevenue, amount: value })}
                        min={0}
                        max={20000}
                        step={100}
                        currency="$"
                      />
                      <Textarea
                        placeholder="Description (optional)"
                        value={customRevenue.description}
                        onChange={(e) => setCustomRevenue({ ...customRevenue, description: e.target.value })}
                        rows={2}
                      />
                      <Button onClick={handleAddCustomRevenue} size="sm" className="w-full">
                        Add Revenue
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Budget Summary */}
            <Card>
              <CardContent className="pt-6">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-sm text-gray-600">Total Expenses</p>
                    <p className="text-xl font-bold text-red-600">${totalExpenses.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Revenue</p>
                    <p className="text-xl font-bold text-green-600">${totalRevenue.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Net Budget</p>
                    <p className={`text-xl font-bold ${netBudget >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      ${netBudget.toLocaleString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(1)}>
                Back
              </Button>
              <Button onClick={handleComplete} className="flex items-center gap-2">
                Complete Budget Setup
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Budget Setup</span>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>
        
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {renderStep()}
          </motion.div>
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
};

export default BudgetSetupModal;
