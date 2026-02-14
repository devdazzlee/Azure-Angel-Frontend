import React from 'react';
import MetricCard from './MetricCard';
import BudgetWarnings from './BudgetWarnings';
import { 
  Zap, 
  TrendingUp, 
  TrendingDown, 
  Calculator 
} from 'lucide-react';

interface BudgetOverviewProps {
  warnings: Array<{
    id: string;
    type: 'warning' | 'error' | 'info';
    message: string;
    itemId?: string;
  }>;
  startupCostsTotal: number;
  effectiveMonthlyRevenueForBreakEven: number;
  totalMonthlyCosts: number;
  monthlyNetIncome: number;
  currency: string;
  formatCurrency: (value: number, currency?: string) => string;
  breakEvenCard: React.ReactNode;
  modernCharts: React.ReactNode;
}

const BudgetOverview: React.FC<BudgetOverviewProps> = ({
  warnings,
  startupCostsTotal,
  effectiveMonthlyRevenueForBreakEven,
  totalMonthlyCosts,
  monthlyNetIncome,
  currency,
  formatCurrency,
  breakEvenCard,
  modernCharts
}) => {
  return (
    <div className="space-y-8">
      {/* Budget Validation Warnings */}
      <BudgetWarnings warnings={warnings} />

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Startup Costs"
          value={formatCurrency(startupCostsTotal, currency)}
          icon={Zap}
          color="blue"
          delay={0}
        />
        <MetricCard
          title="Monthly Revenue"
          value={formatCurrency(effectiveMonthlyRevenueForBreakEven, currency)}
          icon={TrendingUp}
          color="green"
          delay={0.1}
        />
        <MetricCard
          title="Monthly Costs"
          value={formatCurrency(totalMonthlyCosts, currency)}
          icon={TrendingDown}
          color="red"
          delay={0.2}
        />
        <MetricCard
          title="Monthly Net"
          value={formatCurrency(monthlyNetIncome, currency)}
          icon={Calculator}
          color={monthlyNetIncome >= 0 ? 'green' : 'red'}
          delay={0.3}
        />
      </div>

      {/* Break-Even Analysis */}
      {breakEvenCard}

      {/* Charts */}
      {modernCharts}
    </div>
  );
};

export default BudgetOverview;
