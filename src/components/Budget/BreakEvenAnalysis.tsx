import React from 'react';
import { AlertTriangle, Info } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';

interface BreakEvenData {
  status: 'never' | 'months';
  months: number | null;
  years: number | null;
}

interface BreakEvenAnalysisProps {
  breakEven: BreakEvenData;
  effectiveMonthlyRevenueForBreakEven: number;
  totalMonthlyCosts: number;
  monthlyNetIncome: number;
  compact?: boolean;
}

export const BreakEvenAnalysis: React.FC<BreakEvenAnalysisProps> = ({
  breakEven,
  effectiveMonthlyRevenueForBreakEven,
  totalMonthlyCosts,
  monthlyNetIncome,
  compact = false,
}) => {
  const breakEvenBg = breakEven.status === 'never' ? 'bg-red-100 border-red-200' : 'bg-green-100 border-green-200';
  const breakEvenColor = breakEven.status === 'never' ? 'text-red-700' : 'text-green-700';

  if (compact) {
    return (
      <Card className={`shadow-sm border-2 ${breakEvenBg}`}>
        <CardHeader>
          <CardTitle className="text-gray-900">Break-Even Analysis</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="rounded-lg bg-white/60 border border-gray-200 p-3">
            <p className="text-xs text-gray-600">Projected Break-Even Point</p>
            {breakEven.status === 'never' ? (
              <div className="mt-1 flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
                <div>
                  <p className={`text-lg font-bold ${breakEvenColor}`}>Never</p>
                  <p className="text-sm text-red-700">Revenue doesn't cover monthly costs.</p>
                  <p className="text-sm text-red-700">You'll need to increase revenue or reduce costs to be profitable.</p>
                </div>
              </div>
            ) : (
              <div className="mt-1">
                <p className={`text-lg font-bold ${breakEvenColor}`}>
                  {breakEven.months} months
                  {breakEven.years ? ` (${Math.round(breakEven.years * 10) / 10} years)` : ''}
                </p>
                <p className="mt-2 text-xs text-gray-600">
                  *Projected break-even point is auto-calculated as the month when cumulative net cashflow becomes non-negative:
                  <br />
                  <span className="font-semibold">(Total startup costs + monthly costs) - monthly revenue projection</span> reaches 0 or below.
                </p>
                {breakEven.months !== null && breakEven.months > 24 && (
                  <div className="mt-2 flex items-start gap-2">
                    <Info className="w-5 h-5 text-red-600 mt-0.5" />
                    <p className="text-sm text-red-700">Note: Break-even timeline is quite long. Consider whether you have sufficient funding for this runway.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
      <Card className={`shadow-sm border-2 ${breakEvenBg}`}>
        <CardHeader>
          <CardTitle className="text-gray-900">Break-Even Analysis</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="rounded-lg bg-white/60 border border-gray-200 p-3">
            <p className="text-xs text-gray-600">Projected Break-Even Point</p>
            {breakEven.status === 'never' ? (
              <div className="mt-1 flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
                <div>
                  <p className={`text-lg font-bold ${breakEvenColor}`}>Never</p>
                  <p className="text-sm text-red-700">Revenue doesn't cover monthly costs.</p>
                  <p className="text-sm text-red-700">You'll need to increase revenue or reduce costs to be profitable.</p>
                </div>
              </div>
            ) : (
              <div className="mt-1">
                <p className={`text-lg font-bold ${breakEvenColor}`}>
                  {breakEven.months} months
                  {breakEven.years ? ` (${Math.round(breakEven.years * 10) / 10} years)` : ''}
                </p>
                <p className="mt-2 text-xs text-gray-600">
                  *Projected break-even point is auto-calculated as the month when cumulative net cashflow becomes non-negative:
                  <br />
                  <span className="font-semibold">(Total startup costs + monthly costs) - monthly revenue projection</span> reaches 0 or below.
                </p>
                {breakEven.months !== null && breakEven.months > 24 && (
                  <div className="mt-2 flex items-start gap-2">
                    <Info className="w-5 h-5 text-red-600 mt-0.5" />
                    <p className="text-sm text-red-700">Note: Break-even timeline is quite long. Consider whether you have sufficient funding for this runway.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm border border-gray-200">
        <CardHeader>
          <CardTitle className="text-gray-900">Key Monthly Totals</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="rounded-lg bg-gray-50 border border-gray-200 p-3">
            <p className="text-xs text-gray-600">Revenue</p>
            <p className="text-base font-bold text-gray-900">{formatCurrency(effectiveMonthlyRevenueForBreakEven)}</p>
          </div>
          <div className="rounded-lg bg-gray-50 border border-gray-200 p-3">
            <p className="text-xs text-gray-600">Costs</p>
            <p className="text-base font-bold text-gray-900">{formatCurrency(totalMonthlyCosts)}</p>
          </div>
          <div className="rounded-lg bg-gray-50 border border-gray-200 p-3">
            <p className="text-xs text-gray-600">Net</p>
            <p className={`text-base font-bold ${monthlyNetIncome >= 0 ? 'text-green-700' : 'text-red-700'}`}>
              {formatCurrency(monthlyNetIncome)}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BreakEvenAnalysis;
