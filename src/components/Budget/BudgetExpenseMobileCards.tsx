import React from 'react';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import type { BudgetItem } from '@/types/apiTypes';
import { formatMoney } from '@/lib/formatters';
import CurrencyInput from '../ui/CurrencyInput';
import { getBudgetVarianceDisplay } from './budgetVariance';

export interface BudgetExpenseMobileCardsProps {
  items: BudgetItem[];
  currency?: string;
  selectedItemIds: Set<string>;
  onToggleItemSelection: (itemId: string, isSelected: boolean) => void;
  onToggleAllSelection: (isSelected: boolean) => void;
  onUpdateItem: (id: string, updates: Partial<BudgetItem>) => void;
  onRemoveItem: (item: BudgetItem) => void;
  getSmartStep: (currentValue: number) => number;
  totalsLabel: string;
  budgetTotal: number;
  actualTotal: number;
}

const fieldLabel =
  'block text-[11px] font-semibold uppercase tracking-wide text-gray-500 mb-1.5';

const BudgetExpenseMobileCards: React.FC<BudgetExpenseMobileCardsProps> = ({
  items,
  currency = '$',
  selectedItemIds,
  onToggleItemSelection,
  onToggleAllSelection,
  onUpdateItem,
  onRemoveItem,
  getSmartStep,
  totalsLabel,
  budgetTotal,
  actualTotal,
}) => {
  const isAllSelected = items.length > 0 && items.every((item) => selectedItemIds.has(item.id));
  const isSomeSelected = items.some((item) => selectedItemIds.has(item.id)) && !isAllSelected;
  const varianceTotal = budgetTotal - actualTotal;

  return (
    <div className="md:hidden space-y-3">
      {items.length > 1 && (
        <label className="flex items-center gap-2 rounded-lg border border-gray-200/80 bg-gray-50/80 px-3 py-2.5 text-sm text-gray-700">
          <Checkbox
            checked={isAllSelected ? true : isSomeSelected ? 'indeterminate' : false}
            onCheckedChange={(v) => onToggleAllSelection(Boolean(v))}
            aria-label="Select all line items"
          />
          Select all
        </label>
      )}

      {items.map((item) => {
        const varianceDisplay = getBudgetVarianceDisplay(item, currency);
        return (
          <article
            key={item.id}
            className="overflow-hidden rounded-xl border border-gray-200/80 bg-white p-4 shadow-sm"
          >
            <div className="flex items-start gap-3 border-b border-gray-100 pb-4">
              <Checkbox
                checked={selectedItemIds.has(item.id)}
                onCheckedChange={(v) => onToggleItemSelection(item.id, Boolean(v))}
                aria-label={`Select ${item.name}`}
                className="mt-2 shrink-0"
              />
              <div className="min-w-0 flex-1">
                <label className={fieldLabel}>Line item</label>
                <Input
                  value={item.name}
                  onChange={(e) => onUpdateItem(item.id, { name: e.target.value })}
                  className="h-10 w-full min-w-0 border-gray-200/80 text-sm focus:border-teal-400 focus:ring-teal-400/20"
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => onRemoveItem(item)}
                aria-label={`Remove ${item.name}`}
                className="mt-6 shrink-0 text-gray-400 hover:text-red-600"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-4 py-4">
              <div className="min-w-0">
                <label className={fieldLabel}>Budget ({currency})</label>
                <CurrencyInput
                  value={item.estimated_amount ?? 0}
                  onChange={(value) => onUpdateItem(item.id, { estimated_amount: value })}
                  min={0}
                  step={100}
                  getSmartStep={getSmartStep}
                  adjustmentControl="none"
                  className="w-full min-w-0"
                />
              </div>
              <div className="min-w-0">
                <label className={fieldLabel}>Actual ({currency})</label>
                <CurrencyInput
                  value={item.actual_amount ?? 0}
                  onChange={(value) => onUpdateItem(item.id, { actual_amount: value })}
                  min={0}
                  step={100}
                  getSmartStep={getSmartStep}
                  adjustmentControl="none"
                  className="w-full min-w-0"
                />
              </div>
            </div>

            <div className="mb-4 flex items-center justify-between gap-3 rounded-lg bg-gray-50 px-3 py-2.5">
              <span className="text-xs font-semibold uppercase tracking-wide text-gray-500 shrink-0">
                Variance
              </span>
              <span className={`text-sm font-semibold tabular-nums ${varianceDisplay.className}`}>
                {varianceDisplay.valueText}
              </span>
            </div>

            <div className="min-w-0">
              <label className={fieldLabel}>Notes</label>
              <textarea
                value={item.description || ''}
                onChange={(e) => onUpdateItem(item.id, { description: e.target.value })}
                rows={2}
                placeholder="Optional notes"
                className="w-full min-w-0 resize-none rounded-lg border border-gray-200/80 bg-white px-3 py-2 text-sm leading-relaxed focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-400/20"
              />
            </div>
          </article>
        );
      })}

      {items.length > 0 && (
        <div className="rounded-xl border-2 border-teal-200/50 bg-gradient-to-r from-teal-50/80 to-cyan-50/80 p-4 space-y-3">
          <p className="text-sm font-bold text-gray-900">{totalsLabel}</p>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="min-w-0">
              <span className="text-gray-500">Budget</span>
              <p className="font-semibold text-gray-900 tabular-nums break-words">
                {formatMoney(budgetTotal, currency)}
              </p>
            </div>
            <div className="min-w-0">
              <span className="text-gray-500">Actual</span>
              <p className="font-semibold text-gray-900 tabular-nums break-words">
                {formatMoney(actualTotal, currency)}
              </p>
            </div>
            <div className="col-span-2 flex justify-between gap-3 border-t border-teal-200/40 pt-3">
              <span className="text-gray-500 shrink-0">Variance</span>
              <span
                className={`tabular-nums font-semibold text-right break-words ${
                  varianceTotal > 0
                    ? 'text-emerald-600'
                    : varianceTotal < 0
                      ? 'text-red-600'
                      : 'text-gray-500'
                }`}
              >
                {formatMoney(varianceTotal, currency)}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BudgetExpenseMobileCards;
