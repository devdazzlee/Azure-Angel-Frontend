import type { BudgetItem } from '@/types/apiTypes';

export type BudgetChartPoint = {
  name: string;
  value: number;
};

/** Color palette for monthly operating expense bars — one distinct color per line item. */
export const MONTHLY_OPERATING_CHART_COLORS = [
  '#0d9488',
  '#06b6d4',
  '#3b82f6',
  '#6366f1',
  '#8b5cf6',
  '#10b981',
  '#14b8a6',
  '#f59e0b',
  '#f97316',
  '#ef4444',
  '#ec4899',
  '#84cc16',
] as const;

/**
 * Build chart series from monthly operating expense line items.
 * Preserves table order (top → bottom) so bars read left → right in the same sequence.
 */
export function buildOperatingExpenseChartData(
  items: BudgetItem[],
  resolveAmount: (item: BudgetItem) => number,
): BudgetChartPoint[] {
  return items
    .map((item) => ({
      name: item.name?.trim() || 'Untitled line item',
      value: resolveAmount(item),
    }))
    .filter((point) => Number.isFinite(point.value) && point.value > 0);
}
