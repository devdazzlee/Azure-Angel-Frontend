import { formatMoney } from '@/lib/formatters';
import type { BudgetItem } from '@/types/apiTypes';

export function getBudgetVarianceDisplay(
  item: BudgetItem,
  currency: string,
): { valueText: string; className: string } {
  const budget = Number(item.estimated_amount) || 0;
  const actualNum = Number(item.actual_amount) || 0;
  const variance = budget - actualNum;

  if (variance > 0) {
    return { valueText: formatMoney(variance, currency), className: 'text-green-600 font-semibold' };
  }
  if (variance < 0) {
    return { valueText: formatMoney(variance, currency), className: 'text-red-600 font-semibold' };
  }
  return { valueText: formatMoney(0, currency), className: 'text-gray-500' };
}

export function computeExpenseTotals(items: BudgetItem[]) {
  const budgetTotal = items.reduce((sum, item) => sum + (Number(item.estimated_amount) || 0), 0);
  const actualTotal = items.reduce((sum, item) => sum + (Number(item.actual_amount) || 0), 0);
  return { budgetTotal, actualTotal };
}
