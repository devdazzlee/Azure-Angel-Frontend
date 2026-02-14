import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { motion } from 'framer-motion';
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
  const formatCurrency = (value: number | null | undefined) => {
    const safeValue = Number(value) || 0;
    return `${currency}${safeValue.toLocaleString()}`;
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white p-4 border border-gray-200 rounded-lg shadow-xl backdrop-blur-sm"
        >
          <p className="font-semibold text-gray-900 mb-1">{payload[0].name}</p>
          <p className="text-lg font-bold" style={{ color: payload[0].payload.color }}>
            {formatCurrency(payload[0].value)}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {payload[0].payload.percentage}% of total
          </p>
        </motion.div>
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

  const total = data.reduce((sum, cat) => sum + (cat.estimated_total || cat.actual_total), 0);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="w-full"
    >
      {title && (
        <motion.h3
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-lg font-semibold text-gray-900 mb-4 text-center"
        >
          {title}
        </motion.h3>
      )}
      
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <ResponsiveContainer width="100%" height={height} className="min-h-[250px] sm:min-h-[300px]">
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
              animationBegin={0}
              animationDuration={1500}
              animationEasing="ease-out"
            >
              {chartData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.color}
                  style={{
                    filter: 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1))',
                    transition: 'all 0.3s ease'
                  }}
                />
              ))}
            </Pie>
            
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </motion.div>
      
      {showLegend && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-4"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-8 gap-2 px-1 sm:px-2">
            {chartData.map((entry, index) => (
              <motion.div
                key={`legend-${index}`}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 + index * 0.05 }}
                className="flex items-center gap-1.5 bg-white px-2 py-1.5 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow text-xs sm:text-sm"
              >
                <div
                  className="w-3 h-3 rounded-sm flex-shrink-0"
                  style={{ backgroundColor: entry.color }}
                />
                <span className="font-medium text-gray-700 truncate flex-1 min-w-0">
                  <span className="block truncate">{entry.name}</span>
                  <span className="block text-xs text-gray-500">{formatCurrency(entry.value)}</span>
                </span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
      
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4 text-sm"
      >
        <div className="bg-gradient-to-br from-teal-50 to-cyan-50 p-4 rounded-lg border border-teal-200/60 shadow-sm">
          <p className="text-gray-600 mb-1">Total Budget</p>
          <p className="text-xl font-bold text-gray-900">
            {formatCurrency(total)}
          </p>
        </div>
        <div className="bg-gradient-to-br from-emerald-50 to-green-50 p-4 rounded-lg border border-emerald-200/60 shadow-sm">
          <p className="text-gray-600 mb-1">Categories</p>
          <p className="text-xl font-bold text-gray-900">{data.length}</p>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default BudgetPieChart;
