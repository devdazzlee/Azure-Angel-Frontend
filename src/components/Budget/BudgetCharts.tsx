import React from 'react';
import { TrendingDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import BudgetPieChart from './BudgetPieChart';
import type { BudgetCategory } from '@/types/apiTypes';

interface ChartData {
  name: string;
  value: number;
  color?: string;
}

interface BudgetChartsProps {
  startupChartData: ChartData[];
  monthlyChartData: ChartData[];
  currency: string;
}

// Transform ChartData to BudgetCategory
const transformToBudgetCategory = (chartData: ChartData[]): BudgetCategory[] => {
  return chartData.map(item => ({
    name: item.name,
    estimated_total: item.value,
    actual_total: 0, // ChartData doesn't have actual values
    items: [], // ChartData doesn't have item details
    color: item.color || '#3b82f6' // Default color if not provided
  }));
};

export const BudgetCharts: React.FC<BudgetChartsProps> = ({
  startupChartData,
  monthlyChartData,
  currency,
}) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
      <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingDown className="w-5 h-5 text-red-500" />
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
            <p className="text-center text-gray-500 py-10">No startup costs to display.</p>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingDown className="w-5 h-5 text-red-500" />
            Monthly Costs Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          {monthlyChartData.length > 0 ? (
            <BudgetPieChart
              data={transformToBudgetCategory(monthlyChartData)}
              currency={currency}
              height={300}
              showLegend={true}
            />
          ) : (
            <p className="text-center text-gray-500 py-10">No monthly costs to display.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default BudgetCharts;
