import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import { TrendingUp, TrendingDown, DollarSign, PieChart as PieChartIcon } from 'lucide-react';
import BudgetSetupModal from './Budget/BudgetSetupModal';
import type { BudgetItem } from '../types/apiTypes';
import { budgetService } from '../services/budgetService';

interface PlanToBudgetTransitionProps {
  businessPlanSummary: string;
  estimatedExpenses?: string;
  businessContext?: {
    business_name?: string;
    industry?: string;
    location?: string;
    business_type?: string;
  };
  onComplete: (budgetData: {
    initialInvestment: number;
    estimatedExpenses: BudgetItem[];
    estimatedRevenue: BudgetItem[];
  }) => void;
  onRevisit: () => void;
  loading?: boolean;
  sessionId?: string;
}

const PlanToBudgetTransition: React.FC<PlanToBudgetTransitionProps> = ({
  businessPlanSummary: businessPlanSummaryProp,
  estimatedExpenses: estimatedExpensesProp = "",
  businessContext = {},
  onComplete,
  onRevisit,
  loading = false,
  sessionId
}) => {
  // Ensure values are strings - react-markdown requires string children
  const businessPlanSummary = typeof businessPlanSummaryProp === 'string' 
    ? businessPlanSummaryProp 
    : (businessPlanSummaryProp ? String(businessPlanSummaryProp) : '');
  const estimatedExpenses = typeof estimatedExpensesProp === 'string' 
    ? estimatedExpensesProp 
    : (estimatedExpensesProp ? String(estimatedExpensesProp) : '');
  
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [budgetCompleted, setBudgetCompleted] = useState(false);

  const handleStartBudget = () => {
    setShowBudgetModal(true);
  };

  const handleBudgetComplete = async (budgetData: {
    initialInvestment: number;
    estimatedExpenses: BudgetItem[];
    estimatedRevenue: BudgetItem[];
  }) => {
    try {
      // Save budget to backend
      if (sessionId) {
        const totalExpenses = budgetData.estimatedExpenses.reduce(
          (sum, item) => sum + item.estimated_amount,
          0
        );
        const totalRevenue = budgetData.estimatedRevenue.reduce(
          (sum, item) => sum + item.estimated_amount,
          0
        );

        await budgetService.saveBudget(sessionId, {
          session_id: sessionId,
          initial_investment: budgetData.initialInvestment,
          total_estimated_expenses: totalExpenses,
          total_estimated_revenue: totalRevenue,
          items: [...budgetData.estimatedExpenses, ...budgetData.estimatedRevenue].map(item => ({
            id: item.id || `temp-${Date.now()}-${Math.random()}`,
            name: item.name,
            category: item.category,
            amount: item.amount || item.estimated_amount,
            estimated_amount: item.estimated_amount,
            actual_amount: item.actual_amount,
            description: item.description,
            is_custom: item.is_custom
          }))
        });

        toast.success('Budget saved successfully!');
      }

      setBudgetCompleted(true);
      setShowBudgetModal(false);
      onComplete(budgetData);
    } catch (error: any) {
      console.error('Failed to save budget:', error);
      toast.error('Failed to save budget. Please try again.');
    }
  };

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-teal-50 to-blue-50 flex items-center justify-center px-4 py-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-5xl bg-white/95 backdrop-blur-xl border border-white/30 shadow-2xl rounded-3xl p-8"
        >
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-8"
          >
            <motion.div
              animate={{ 
                rotate: [0, 10, -10, 0],
                scale: [1, 1.1, 1]
              }}
              transition={{ 
                duration: 2, 
                repeat: Infinity, 
                repeatDelay: 3 
              }}
              className="w-24 h-24 bg-gradient-to-r from-green-400 via-emerald-500 to-teal-500 rounded-full flex items-center justify-center text-white text-5xl mx-auto mb-4 shadow-lg"
            >
              💰
            </motion.div>
            <h1 className="text-3xl md:text-5xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-3">
              Budget Planning Time!
            </h1>
            <p className="text-lg text-gray-600 mb-6">
              Great work completing your business plan! Now let's create a comprehensive budget for your business.
            </p>
          </motion.div>

          {/* Business Plan Summary */}
          {businessPlanSummary && (
            <div className="mb-8 bg-white border border-gray-200 rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Business Plan Summary</h2>
              <div className="prose prose-sm max-w-none">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {businessPlanSummary.length > 500 ? businessPlanSummary.substring(0, 500) + '...' : businessPlanSummary}
                </ReactMarkdown>
              </div>
            </div>
          )}

          {/* Estimated Expenses */}
          {estimatedExpenses && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mb-8 bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-300 rounded-xl p-6 shadow-lg"
            >
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <TrendingDown className="w-6 h-6 text-red-500" />
                Estimated Expenses (Based on Your Business Plan)
              </h2>
              <p className="text-gray-700 mb-4">
                I've analyzed your business plan and prepared estimated expenses for Year 1. These are tailored to your{' '}
                <span className="font-semibold text-blue-700">{businessContext.industry || 'industry'}</span> business in{' '}
                <span className="font-semibold text-blue-700">{businessContext.location || 'your location'}</span>:
              </p>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-white rounded-lg p-5 border border-blue-100 shadow-sm"
              >
                <div className="text-gray-700 prose prose-sm max-w-none">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {estimatedExpenses}
                  </ReactMarkdown>
                </div>
              </motion.div>
            </motion.div>
          )}

          {/* What's Next */}
          <div className="mb-8 bg-gradient-to-r from-teal-50 to-blue-50 border border-teal-200 rounded-xl p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">🎯 What's Next</h2>
            <p className="text-gray-700 mb-4">
              Once you provide your initial investment amount, I'll:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4">
              <li>Show you a detailed budget breakdown with estimated expenses and revenues</li>
              <li>Allow you to adjust amounts using sliders</li>
              <li>Let you add custom expenses or revenue sources</li>
              <li>Display your budget in a pie chart or table format</li>
              <li>Save this budget so I can reference it throughout our conversation</li>
            </ul>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-800">
                <strong>Ready to set up your budget?</strong> Click the button below to start!
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="text-center"
          >
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <motion.button
                onClick={handleStartBudget}
                disabled={loading || budgetCompleted}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="group relative bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 hover:from-green-600 hover:via-emerald-600 hover:to-teal-600 text-white px-10 py-5 rounded-xl text-xl font-bold shadow-2xl hover:shadow-3xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed border-2 border-green-400"
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-3">
                    <svg className="animate-spin h-7 w-7 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Setting up budget...</span>
                  </div>
                ) : budgetCompleted ? (
                  <div className="flex items-center justify-center gap-3">
                    <span className="text-2xl">✅</span>
                    <span>Budget Completed</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-3">
                    <span className="text-2xl">💰</span>
                    <span>Start Budget Setup</span>
                  </div>
                )}
                <motion.div
                  className="absolute inset-0 bg-white/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  animate={{ opacity: loading ? 0.3 : 0 }}
                />
              </motion.button>

              <motion.button
                onClick={onRevisit}
                disabled={loading}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="group relative bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white px-8 py-4 rounded-xl text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="flex items-center justify-center gap-3">
                  <span className="text-xl">🔄</span>
                  <span>Modify Business Plan</span>
                </div>
                <motion.div
                  className="absolute inset-0 bg-white/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                />
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Budget Setup Modal */}
      <BudgetSetupModal
        isOpen={showBudgetModal}
        onClose={() => setShowBudgetModal(false)}
        onComplete={handleBudgetComplete}
        businessContext={businessContext}
      />
    </>
  );
};

export default PlanToBudgetTransition;