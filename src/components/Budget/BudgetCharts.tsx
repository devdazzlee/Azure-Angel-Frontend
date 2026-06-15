import React from 'react';
import { TrendingDown, BarChart3 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import BudgetPieChart from './BudgetPieChart';
import MonthlyOperatingCostsChart from './MonthlyOperatingCostsChart';
import type { BudgetCategory } from '@/types/apiTypes';
import type { BudgetChartPoint } from '@/utils/budgetChartData';

interface ChartData {
  name: string;
  value: number;
  color?: string;
}

interface BudgetChartsProps {
  startupChartData: ChartData[];
  monthlyChartData: ChartData[] | BudgetChartPoint[];
  currency: string;
}

const transformToBudgetCategory = (chartData: ChartData[]): BudgetCategory[] => {
  return chartData.map((item) => ({
    name: item.name,
    estimated_total: item.value,
    actual_total: 0,
    items: [],
    color: item.color || '#3b82f6',
  }));
};

export const BudgetCharts: React.FC<BudgetChartsProps> = ({
  startupChartData,
  monthlyChartData,
  currency,
}) => {
  return (
    <div className="grid grid-cols-1 gap-4 md:gap-6 lg:grid-cols-2">
      <Card className="shadow-lg transition-shadow duration-300 hover:shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingDown className="h-5 w-5 text-red-500" />
            Startup Costs Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          {startupChartData.length > 0 ? (
            <BudgetPieChart
              data={transformToBudgetCategory(startupChartData)}
              currency={currency}
              height={300}
              showLegend={true}
            />
          ) : (
            <p className="py-10 text-center text-gray-500">No startup costs to display.</p>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-lg transition-shadow duration-300 hover:shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-blue-600" />
            Monthly Costs Distribution
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 py-4">
          <MonthlyOperatingCostsChart
            data={monthlyChartData}
            currency={currency}
            emptyMessage="No monthly operating expenses to display."
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default BudgetCharts;
