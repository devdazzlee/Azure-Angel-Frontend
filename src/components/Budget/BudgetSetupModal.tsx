import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DollarSign, TrendingUp, TrendingDown, PieChart, ArrowRight, X, Sparkles } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import BudgetSlider from './BudgetSlider';
import BudgetPieChart from './BudgetPieChart';
import type { Budget, BudgetItem, BudgetCategory } from '@/types/apiTypes';

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

  // Generate estimates when modal opens - prepare data for step 2
  React.useEffect(() => {
    if (isOpen && estimatedExpenses.length === 0) {
      console.log("📊 Generating estimated expenses and revenue for budget modal");
      generateEstimatedExpenses();
      generateEstimatedRevenue();
    }
  }, [isOpen]);
  
  // Also ensure data is generated when moving to step 2
  React.useEffect(() => {
    if (step === 2 && estimatedExpenses.length === 0) {
      console.log("📊 Step 2 reached - generating estimates if missing");
      generateEstimatedExpenses();
      generateEstimatedRevenue();
    }
  }, [step]);

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
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200 }}
              className="text-center"
            >
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
              >
                <DollarSign className="w-16 h-16 text-blue-600 mx-auto mb-4" />
              </motion.div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Let's Set Up Your Budget</h3>
              <p className="text-gray-600">
                Based on your business plan for <span className="font-semibold text-blue-600">{businessContext?.business_name || 'your business'}</span>, 
                we'll help you create a comprehensive budget for Year 1.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="space-y-6 bg-white rounded-xl p-6 border-2 border-blue-200 shadow-lg"
            >
              <div className="space-y-2">
                <h4 className="text-lg font-semibold text-gray-900">Initial Investment</h4>
                <p className="text-sm text-gray-600">Enter the total amount you're investing to start your business</p>
              </div>
              <BudgetSlider
                label="Initial Investment"
                value={initialInvestment}
                onChange={setInitialInvestment}
                min={0}
                max={100000}
                step={1000}
                currency="$"
              />
              
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
                className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200"
              >
                <p className="text-sm text-blue-800 flex items-start gap-2">
                  <Sparkles className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>
                    This is the amount you're investing to start your business. 
                    It will be used to cover initial expenses until your business becomes profitable.
                  </span>
                </p>
              </motion.div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="flex justify-end"
            >
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button 
                  onClick={() => setStep(2)}
                  disabled={initialInvestment === 0}
                  className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white"
                >
                  Continue
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </motion.div>
            </motion.div>
          </motion.div>
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

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 min-w-0 w-full">
              {/* Expenses */}
              <Card className="min-w-0 w-full overflow-visible">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-red-600">
                    <TrendingDown className="w-5 h-5" />
                    Estimated Expenses
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {estimatedExpenses.map((expense) => (
                    <div key={expense.id} className="flex flex-col gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-900">{expense.name}</span>
                        <span className="text-sm font-bold text-blue-600">${expense.estimated_amount.toLocaleString()}</span>
                      </div>
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
                        label=""
                        className="w-full"
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
                      <Button 
                        onClick={handleAddCustomExpense} 
                        size="sm" 
                        className="w-full bg-gradient-to-r from-red-500 to-orange-600 hover:from-red-600 hover:to-orange-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all"
                      >
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
                      <div key={revenue.id} className="flex flex-col sm:flex-row gap-3 items-start sm:items-center p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm font-medium min-w-[120px]">{revenue.name}</span>
                        <div className="flex-1 w-full sm:w-auto">
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
                            label=""
                            className="w-full"
                          />
                        </div>
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
                      <Button 
                        onClick={handleAddCustomRevenue} 
                        size="sm" 
                        className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all"
                      >
                        Add Revenue
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Budget Summary with Chart Preview */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="bg-gradient-to-br from-gray-50 to-blue-50 border-2 border-blue-200">
                <CardContent className="pt-6">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 text-center mb-4 sm:mb-6">
                    <motion.div
                      initial={{ scale: 0.8 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.4, type: "spring" }}
                      className="bg-white/50 rounded-lg p-3 sm:p-4"
                    >
                      <p className="text-xs sm:text-sm text-gray-600 mb-1">Total Expenses</p>
                      <p className="text-lg sm:text-2xl font-bold text-red-600 break-words">${totalExpenses.toLocaleString()}</p>
                    </motion.div>
                    <motion.div
                      initial={{ scale: 0.8 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.5, type: "spring" }}
                      className="bg-white/50 rounded-lg p-3 sm:p-4"
                    >
                      <p className="text-xs sm:text-sm text-gray-600 mb-1">Total Revenue</p>
                      <p className="text-lg sm:text-2xl font-bold text-green-600 break-words">${totalRevenue.toLocaleString()}</p>
                    </motion.div>
                    <motion.div
                      initial={{ scale: 0.8 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.6, type: "spring" }}
                      className="bg-white/50 rounded-lg p-3 sm:p-4"
                    >
                      <p className="text-xs sm:text-sm text-gray-600 mb-1">Net Budget</p>
                      <p className={`text-lg sm:text-2xl font-bold break-words ${netBudget >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        ${netBudget.toLocaleString()}
                      </p>
                    </motion.div>
                  </div>
                  
                  {/* Mini Chart Preview */}
                  {estimatedExpenses.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.7 }}
                      className="bg-white rounded-lg p-3 sm:p-4 md:p-6 border border-gray-200 overflow-x-auto"
                    >
                      <p className="text-base sm:text-lg font-bold text-gray-800 mb-3 sm:mb-4 text-center">Budget Preview</p>
                      <div className="w-full min-w-[280px]">
                        <div className="hidden sm:block">
                          <BudgetPieChart
                            data={estimatedExpenses.map((exp, idx) => ({
                              name: exp.name,
                              estimated_total: exp.estimated_amount,
                              actual_total: 0,
                              items: [exp],
                              color: idx % 2 === 0 ? '#ef4444' : '#dc2626'
                            }))}
                            currency="$"
                            height={400}
                            showLegend={true}
                          />
                        </div>
                        <div className="block sm:hidden">
                          <BudgetPieChart
                            data={estimatedExpenses.map((exp, idx) => ({
                              name: exp.name,
                              estimated_total: exp.estimated_amount,
                              actual_total: 0,
                              items: [exp],
                              color: idx % 2 === 0 ? '#ef4444' : '#dc2626'
                            }))}
                            currency="$"
                            height={300}
                            showLegend={true}
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            <div className="flex flex-col sm:flex-row justify-between gap-3 sm:gap-4 mt-4 sm:mt-6">
              <Button 
                variant="outline" 
                onClick={() => setStep(1)}
                className="border-2 border-gray-300 hover:border-blue-500 hover:bg-blue-50 text-gray-700 hover:text-blue-700 font-semibold px-4 sm:px-6 py-2 text-sm sm:text-base shadow-md hover:shadow-lg transition-all w-full sm:w-auto"
              >
                Back
              </Button>
              <Button 
                onClick={handleComplete} 
                className="flex items-center justify-center gap-2 bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 hover:from-green-600 hover:via-emerald-600 hover:to-teal-600 text-white font-bold px-6 sm:px-8 py-2 text-sm sm:text-base shadow-xl hover:shadow-2xl transition-all w-full sm:w-auto"
              >
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
      <DialogContent 
        showCloseButton={false}
        className="!max-w-[95vw] sm:!max-w-[90vw] md:!max-w-[80vw] !w-[95vw] sm:!w-[90vw] md:!w-[80vw] !min-w-0 max-h-[95vh] overflow-y-auto bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 border-2 border-blue-200 !p-3 sm:!p-4"
      >
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Budget Setup</span>
            <Button variant="ghost" size="sm" onClick={onClose} className="hover:bg-gray-100">
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
