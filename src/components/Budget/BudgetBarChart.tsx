import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { motion } from 'framer-motion';
import type { BudgetItem } from '@/types/apiTypes';

interface BudgetBarChartProps {
  expenses: BudgetItem[];
  revenues: BudgetItem[];
  currency?: string;
  height?: number;
  showActuals?: boolean;
}

const COLORS = {
  expense: ['#ef4444', '#dc2626', '#b91c1c', '#991b1b', '#7f1d1d'],
  revenue: ['#10b981', '#059669', '#047857', '#065f46', '#064e3b']
};

const BudgetBarChart: React.FC<BudgetBarChartProps> = ({
  expenses,
  revenues,
  currency = '$',
  height = 400,
  showActuals = false
}) => {
  const formatCurrency = (value: number | null | undefined) => {
    const safeValue = Number(value) || 0;
    return `${currency}${safeValue.toLocaleString()}`;
  };

  // Prepare data for comparison chart
  const chartData = React.useMemo(() => {
    const maxLength = Math.max(expenses.length, revenues.length);
    const data: any[] = [];

    for (let i = 0; i < maxLength; i++) {
      const expense = expenses[i];
      const revenue = revenues[i];

      const entry: any = {
        name: `Item ${i + 1}`,
        expense: 0,
        revenue: 0,
        expenseName: '',
        revenueName: ''
      };

      if (expense) {
        entry.expense = showActuals && expense.actual_amount !== undefined 
          ? expense.actual_amount 
          : expense.estimated_amount;
        entry.expenseName = expense.name;
      }

      if (revenue) {
        entry.revenue = showActuals && revenue.actual_amount !== undefined 
          ? revenue.actual_amount 
          : revenue.estimated_amount;
        entry.revenueName = revenue.name;
      }

      data.push(entry);
    }

    return data;
  }, [expenses, revenues, showActuals]);

  // Alternative: Top expenses and revenues separately
  const topExpenses = React.useMemo(() => {
    return expenses
      .map(item => ({
        name: item.name,
        value: showActuals && item.actual_amount !== undefined 
          ? item.actual_amount 
          : item.estimated_amount,
        estimated: item.estimated_amount,
        actual: item.actual_amount
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [expenses, showActuals]);

  const topRevenues = React.useMemo(() => {
    return revenues
      .map(item => ({
        name: item.name,
        value: showActuals && item.actual_amount !== undefined 
          ? item.actual_amount 
          : item.estimated_amount,
        estimated: item.estimated_amount,
        actual: item.actual_amount
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [revenues, showActuals]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-4 border border-gray-200 rounded-lg shadow-xl"
        >
          <p className="font-semibold text-gray-900 mb-2">{payload[0].payload.name || payload[0].name}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              <span className="font-medium">{entry.name}:</span>{' '}
              {formatCurrency(entry.value)}
              {entry.payload.actual !== undefined && (
                <span className="text-gray-500 ml-2">
                  (Est: {formatCurrency(entry.payload.estimated)})
                </span>
              )}
            </p>
          ))}
        </motion.div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Top Expenses Chart */}
      {topExpenses.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white rounded-xl p-6 shadow-lg border border-gray-200"
        >
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span className="text-red-500">📊</span>
            Top Expenses
          </h3>
          <ResponsiveContainer width="100%" height={height}>
            <BarChart data={topExpenses} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis type="number" tickFormatter={formatCurrency} />
              <YAxis 
                type="category" 
                dataKey="name" 
                width={120}
                tick={{ fontSize: 12 }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar 
                dataKey="value" 
                radius={[0, 8, 8, 0]}
                animationBegin={0}
                animationDuration={1000}
              >
                {topExpenses.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={COLORS.expense[index % COLORS.expense.length]}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      )}

      {/* Top Revenues Chart */}
      {topRevenues.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-white rounded-xl p-6 shadow-lg border border-gray-200"
        >
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span className="text-green-500">📈</span>
            Top Revenue Sources
          </h3>
          <ResponsiveContainer width="100%" height={height}>
            <BarChart data={topRevenues} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis type="number" tickFormatter={formatCurrency} />
              <YAxis 
                type="category" 
                dataKey="name" 
                width={120}
                tick={{ fontSize: 12 }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar 
                dataKey="value" 
                radius={[0, 8, 8, 0]}
                animationBegin={200}
                animationDuration={1000}
              >
                {topRevenues.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={COLORS.revenue[index % COLORS.revenue.length]}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      )}

      {/* Comparison Chart */}
      {expenses.length > 0 && revenues.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="bg-white rounded-xl p-6 shadow-lg border border-gray-200"
        >
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span>⚖️</span>
            Expenses vs Revenue Comparison
          </h3>
          <ResponsiveContainer width="100%" height={height}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis 
                dataKey="name" 
                tick={{ fontSize: 12 }}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis tickFormatter={formatCurrency} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar 
                dataKey="expense" 
                fill="#ef4444" 
                name="Expenses"
                radius={[8, 8, 0, 0]}
                animationBegin={0}
                animationDuration={1000}
              />
              <Bar 
                dataKey="revenue" 
                fill="#10b981" 
                name="Revenue"
                radius={[8, 8, 0, 0]}
                animationBegin={200}
                animationDuration={1000}
              />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      )}
    </div>
  );
};

export default BudgetBarChart;






