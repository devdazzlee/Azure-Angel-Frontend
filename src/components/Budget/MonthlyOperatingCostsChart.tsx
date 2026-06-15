import React from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { formatCurrency } from '@/lib/formatters';
import {
  MONTHLY_OPERATING_CHART_COLORS,
  type BudgetChartPoint,
} from '@/utils/budgetChartData';

interface MonthlyOperatingCostsChartProps {
  data: BudgetChartPoint[];
  currency?: string;
  emptyMessage?: string;
}

const BAR_SLOT_WIDTH = 48;
const MIN_CHART_WIDTH = 280;
const PLOT_HEIGHT = 188;

export default function MonthlyOperatingCostsChart({
  data,
  currency = '$',
  emptyMessage = 'No monthly cost data available',
}: MonthlyOperatingCostsChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center text-sm text-gray-400">
        {emptyMessage}
      </div>
    );
  }

  const chartWidth = Math.max(data.length * BAR_SLOT_WIDTH, MIN_CHART_WIDTH);

  return (
    <div>
      {/* Bars only — line item names live in the legend below (same order, matching colors). */}
      <div className="overflow-x-auto leading-none">
        <div className="inline-block min-w-full align-top" style={{ width: chartWidth }}>
          <BarChart
            width={chartWidth}
            height={PLOT_HEIGHT}
            data={data}
            margin={{ top: 8, right: 8, left: 0, bottom: 4 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
            <XAxis
              dataKey="name"
              tick={false}
              tickLine={false}
              axisLine={{ stroke: '#e5e7eb' }}
              height={8}
            />
            <YAxis
              tick={{ fontSize: 11 }}
              stroke="#9ca3af"
              width={44}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `${currency}${(Number(value) / 1000).toFixed(0)}k`}
            />
            <Tooltip
              formatter={(value: number | string) => formatCurrency(Number(value), currency)}
              labelFormatter={(label) => String(label)}
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: '10px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
              }}
            />
            <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={36}>
              {data.map((entry, index) => (
                <Cell
                  key={`${entry.name}-${index}`}
                  fill={MONTHLY_OPERATING_CHART_COLORS[index % MONTHLY_OPERATING_CHART_COLORS.length]}
                />
              ))}
            </Bar>
          </BarChart>
        </div>
      </div>

      <ul className="m-0 mt-3 grid list-none grid-cols-1 gap-2 border-t border-gray-100 p-0 pt-3 sm:grid-cols-2">
        {data.map((entry, index) => (
          <li
            key={`${entry.name}-${index}`}
            className="flex items-start gap-2.5 rounded-xl border border-gray-100 bg-gray-50/80 px-3 py-2.5 text-left"
          >
            <span
              className="mt-0.5 h-3 w-3 shrink-0 rounded-sm ring-1 ring-black/5"
              style={{
                backgroundColor:
                  MONTHLY_OPERATING_CHART_COLORS[index % MONTHLY_OPERATING_CHART_COLORS.length],
              }}
              aria-hidden
            />
            <div className="min-w-0 flex-1">
              <p className="break-words text-xs font-semibold leading-snug text-gray-900">
                {entry.name}
              </p>
              <p className="mt-0.5 tabular-nums text-xs text-gray-600">
                {formatCurrency(Number(entry.value), currency)}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
