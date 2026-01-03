import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import type { BudgetItem, BudgetCategory } from '@/types/apiTypes';

interface BudgetPieChartProps {
  data: BudgetCategory[];
  title?: string;
  showLegend?: boolean;
  height?: number;
  currency?: string;
}

const COLORS = [
  '#3b82f6', // blue
  '#10b981', // emerald
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#14b8a6', // teal
  '#f97316', // orange
];

const BudgetPieChart: React.FC<BudgetPieChartProps> = ({
  data,
  title,
  showLegend = true,
  height = 300,
  currency = '$'
}) => {
  const formatCurrency = (value: number) => {
    return `${currency}${value.toLocaleString()}`;
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-900">{payload[0].name}</p>
          <p className="text-sm text-gray-600">
            {formatCurrency(payload[0].value)}
          </p>
          <p className="text-xs text-gray-500">
            {payload[0].payload.percentage}% of total
          </p>
        </div>
      );
    }
    return null;
  };

  const CustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * Math.PI / 180);
    const y = cy + radius * Math.sin(-midAngle * Math.PI / 180);

    if (percent < 0.05) return null; // Don't show label for small slices

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        className="text-xs font-semibold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  const chartData = data.map((category, index) => ({
    name: category.name,
    value: category.estimated_total || category.actual_total,
    percentage: ((category.estimated_total || category.actual_total) / 
      data.reduce((sum, cat) => sum + (cat.estimated_total || cat.actual_total), 0) * 100).toFixed(1),
    color: COLORS[index % COLORS.length]
  }));

  return (
    <div className="w-full">
      {title && (
        <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">
          {title}
        </h3>
      )}
      
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={CustomLabel}
            outerRadius={Math.min(height, 400) / 2 - 40}
            fill="#8884d8"
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          
          <Tooltip content={<CustomTooltip />} />
          
          {showLegend && (
            <Legend 
              verticalAlign="bottom" 
              height={36}
              formatter={(value: string, entry: any) => (
                <span className="text-sm text-gray-700">
                  {value}: {formatCurrency(entry.payload.value)}
                </span>
              )}
            />
          )}
        </PieChart>
      </ResponsiveContainer>
      
      <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
        <div className="bg-gray-50 p-3 rounded-lg">
          <p className="text-gray-600">Total Budget</p>
          <p className="font-semibold text-gray-900">
            {formatCurrency(data.reduce((sum, cat) => sum + (cat.estimated_total || cat.actual_total), 0))}
          </p>
        </div>
        <div className="bg-gray-50 p-3 rounded-lg">
          <p className="text-gray-600">Categories</p>
          <p className="font-semibold text-gray-900">{data.length}</p>
        </div>
      </div>
    </div>
  );
};

export default BudgetPieChart;
