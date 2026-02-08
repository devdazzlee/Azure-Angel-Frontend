import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';

interface BudgetSummaryCardsProps {
  startupCostsTotal: number;
  initialInvestment: number;
  effectiveMonthlyRevenueForBreakEven: number;
  totalMonthlyCosts: number;
  monthlyNetIncome: number;
}

export const BudgetSummaryCards: React.FC<BudgetSummaryCardsProps> = ({
  startupCostsTotal,
  initialInvestment,
  effectiveMonthlyRevenueForBreakEven,
  totalMonthlyCosts,
  monthlyNetIncome,
}) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
      <Card className="shadow-sm border border-gray-200">
        <CardHeader>
          <CardTitle className="text-gray-900">Startup Budget Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="rounded-lg bg-gray-50 border border-gray-200 p-3">
              <p className="text-xs text-gray-600">Startup Costs (One-time)</p>
              <p className="text-base font-bold text-gray-900">{formatCurrency(startupCostsTotal)}</p>
            </div>
            <div className="rounded-lg bg-gray-50 border border-gray-200 p-3">
              <p className="text-xs text-gray-600">Startup Funds (Initial Investment)</p>
              <p className="text-base font-bold text-gray-900">{formatCurrency(initialInvestment)}</p>
            </div>
            <div className="rounded-lg bg-gray-50 border border-gray-200 p-3">
              <p className="text-xs text-gray-600">Total Monthly Revenue</p>
              <p className="text-base font-bold text-gray-900">{formatCurrency(effectiveMonthlyRevenueForBreakEven)}</p>
            </div>
            <div className="rounded-lg bg-gray-50 border border-gray-200 p-3">
              <p className="text-xs text-gray-600">Total Monthly Costs</p>
              <p className="text-base font-bold text-gray-900">{formatCurrency(totalMonthlyCosts)}</p>
            </div>
          </div>

          <div className="rounded-lg bg-gray-50 border border-gray-200 p-3">
            <p className="text-xs text-gray-600">Monthly Net Income</p>
            <p className={`text-base font-bold ${monthlyNetIncome >= 0 ? 'text-green-700' : 'text-red-700'}`}>
              {formatCurrency(monthlyNetIncome)}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BudgetSummaryCards;
