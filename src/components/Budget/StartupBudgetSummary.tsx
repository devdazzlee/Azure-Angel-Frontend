// Azure-Angel-Frontend/src/components/Budget/StartupBudgetSummary.tsx
import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, AlertTriangle, Lightbulb } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/formatters'; // Using existing formatter for consistency

interface StartupBudgetSummaryProps {
  initialInvestment: number;
  totalStartupCosts: number;
  currency?: string;
}

const StartupBudgetSummary: React.FC<StartupBudgetSummaryProps> = ({
  initialInvestment,
  totalStartupCosts,
  currency = '$',
}) => {
  const startupBudget = initialInvestment - totalStartupCosts;
  const isPositive = startupBudget >= 0;

  const percentageFunded = useMemo(() => {
    if (totalStartupCosts === 0) return 100; // If no costs, 100% funded
    return (initialInvestment / totalStartupCosts) * 100;
  }, [initialInvestment, totalStartupCosts]);

  const fundingGap = useMemo(() => {
    return Math.abs(startupBudget);
  }, [startupBudget]);

  const textColorClass = isPositive ? 'text-green-600' : 'text-red-600';
  const icon = isPositive ? (
    <CheckCircle className="w-6 h-6 text-green-500 mr-2" />
  ) : (
    <XCircle className="w-6 h-6 text-red-500 mr-2" />
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-2xl mx-auto" // Center the box and limit its width
    >
      <Card className="shadow-xl border border-teal-200/40 bg-gradient-to-br from-teal-50/60 to-cyan-50/60 rounded-xl">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between text-2xl font-bold text-blue-800">
            Startup Budget Summary
          </CardTitle>
          <hr className="border-blue-300 w-full" />
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between text-gray-800 text-lg">
            <span className="font-medium">Initial Investment:</span>
            <span className="font-semibold">{formatCurrency(initialInvestment, currency)}</span>
          </div>
          <div className="flex justify-between text-gray-800 text-lg">
            <span className="font-medium">Total Startup Costs:</span>
            <span className="font-semibold">{formatCurrency(totalStartupCosts, currency)}</span>
          </div>
          <hr className="border-gray-300" />
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
            className={`flex items-center justify-between text-xl font-bold ${textColorClass}`}
          >
            <span className="flex items-center">
              {icon}
              Startup Budget:
            </span>
            <span>{formatCurrency(startupBudget, currency)}</span>
          </motion.div>

          <div className="pt-2 text-sm text-gray-700 space-y-2">
            {!isPositive && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="flex items-center text-red-700 font-semibold"
              >
                <AlertTriangle className="w-5 h-5 mr-2" />
                You need an additional {formatCurrency(fundingGap, currency)} in funding.
              </motion.div>
            )}
            {isPositive && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="flex items-center text-green-700 font-semibold"
              >
                <CheckCircle className="w-5 h-5 mr-2" />
                You have sufficient funds to cover startup costs.
              </motion.div>
            )}

            {totalStartupCosts > 0 && (
              <p className="text-gray-600">
                <span className="font-medium">Percentage Funded:</span>{' '}
                <span className="font-semibold">{percentageFunded.toFixed(1)}%</span>
              </p>
            )}

            {!isPositive && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="mt-3 p-3 bg-blue-100 border border-blue-200 rounded-md flex items-start text-blue-800"
              >
                <Lightbulb className="w-5 h-5 mr-2 mt-1 flex-shrink-0" />
                <span>
                  Consider exploring funding options such as personal savings, loans, investors, or grants to cover the shortfall.
                </span>
              </motion.div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default StartupBudgetSummary;