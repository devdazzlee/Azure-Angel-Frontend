import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { Trash2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import type { BudgetItem } from '@/types/apiTypes';
import { formatMoney } from '@/lib/formatters'; // Import from new formatters
import CurrencyInput from '../ui/CurrencyInput'; // Import CurrencyInput

export type COGSDefaults = {
  items: BudgetItem[];
  infoMessage?: string;
};

export function createDefaultCOGSItems(businessType?: string): COGSDefaults {
  const normalized = (businessType || '').trim().toLowerCase();

  const isDigitalSoftware =
    normalized.includes('software') ||
    normalized.includes('saas') ||
    normalized.includes('app') ||
    normalized.includes('digital') ||
    normalized.includes('influencer') ||
    normalized.includes('creator') ||
    normalized.includes('online');

  const isService =
    normalized.includes('service') ||
    normalized.includes('consult') ||
    normalized.includes('agency') ||
    normalized.includes('freelance') ||
    normalized.includes('coaching');

  const isProduct =
    normalized.includes('product') ||
    normalized.includes('retail') ||
    normalized.includes('store') ||
    normalized.includes('shop') ||
    normalized.includes('restaurant') ||
    normalized.includes('food') ||
    normalized.includes('manufactur') ||
    normalized.includes('e-commerce') ||
    normalized.includes('ecommerce');

  type Template = { key: string; name: string; notes: string };

  const templates: Record<string, Template> = {
    materials: {
      key: 'materials',
      name: 'Materials / supplies',
      notes: 'Direct materials or supplies needed to deliver your product/service',
    },
    manufacturing: {
      key: 'manufacturing',
      name: 'Manufacturing / production',
      notes: 'Production labor or manufacturing costs',
    },
    packaging: {
      key: 'packaging',
      name: 'Packaging & shipping',
      notes: 'Packaging materials and shipping costs',
    },
    processing: {
      key: 'processing',
      name: 'Payment processing fees',
      notes: 'Stripe/PayPal/card processing fees and platform transaction fees',
    },
  };

  const makeItems = (keys: string[]): BudgetItem[] => {
    return keys.map((key, index) => {
      const t = templates[key];
      return {
        id: `cogs_${key}_${index}`,
        name: t?.name ?? key,
        category: 'expense',
        estimated_amount: 0,
        actual_amount: undefined,
        description: t?.notes ?? '',
        is_custom: false,
        isSelected: false, // Default to not selected
      } satisfies BudgetItem;
    });
  };

  if (isService && !isProduct) {
    return {
      items: makeItems(['processing']),
      infoMessage: "Most service businesses have minimal Cost of Goods Sold (COGS). You can add items if you have direct costs.",
    };
  }

  if (isDigitalSoftware && !isProduct) {
    return {
      items: makeItems(['processing']),
      infoMessage: "Digital/software businesses typically have minimal COGS beyond payment processing fees.",
    };
  }

  if (isProduct) {
    return {
      items: makeItems(['materials', 'manufacturing', 'packaging', 'processing']),
      infoMessage: undefined,
    };
  }

  return {
    items: [],
    infoMessage: "Your business type typically doesn't have Cost of Goods Sold (COGS). Add items if needed.",
  };
}

type COGSTableProps = {
  items: BudgetItem[];
  onChange: (items: BudgetItem[]) => void;
  onRemoveItem?: (id: string, name: string) => void;
  currency?: string;
  infoMessage?: string;
  selectedItemIds: Set<string>;
  onToggleItemSelection: (itemId: string, isSelected: boolean) => void;
  onToggleAllSelection: (isSelected: boolean) => void;
  onAddLineItem: (category: 'cogs') => void; // New prop
};

const COGSTable: React.FC<COGSTableProps> = ({
  items,
  onChange,
  onRemoveItem,
  currency = '$',
  infoMessage,
  selectedItemIds, // New prop
  onToggleItemSelection, // New prop
  onToggleAllSelection, // New prop
  onAddLineItem, // Destructure new prop
}) => {
  const totals = useMemo(() => {
    const budgetTotal = items.reduce((sum, item) => sum + (Number(item.estimated_amount) || 0), 0);
    const actualTotal = items.reduce((sum, item) => sum + (Number(item.actual_amount) || 0), 0);
    const hasAnyActual = items.some((i) => i.actual_amount !== undefined && i.actual_amount !== null);
    const varianceTotal = hasAnyActual ? budgetTotal - actualTotal : NaN;
    return { budgetTotal, actualTotal, varianceTotal, hasAnyActual };
  }, [items]);

  const isAllSelected = items.length > 0 && items.every((item) => selectedItemIds.has(item.id));
  const isSomeSelected = items.some((item) => selectedItemIds.has(item.id)) && !isAllSelected;

  const handleUpdateItem = (id: string, updates: Partial<BudgetItem>) => {
    const next = items.map((item) => (item.id === id ? { ...item, ...updates } : item));
    onChange(next);
  };

  const getVarianceDisplay = (item: BudgetItem): { valueText: string; className: string } => {
    const budget = Number(item.estimated_amount) || 0;
    const actual = item.actual_amount;

    if (actual === undefined || actual === null || actual === ('' as any)) {
      return { valueText: '—', className: 'text-gray-400' };
    }

    const actualNum = Number(actual);
    if (!Number.isFinite(actualNum)) {
      return { valueText: '—', className: 'text-gray-400' };
    }

    const variance = budget - actualNum;

    if (variance > 0) return { valueText: formatMoney(variance, currency), className: 'text-green-600 font-semibold' };
    if (variance < 0) return { valueText: formatMoney(variance, currency), className: 'text-red-600 font-semibold' };
    return { valueText: formatMoney(0, currency), className: 'text-gray-600 font-semibold' };
  };

  const getSmartStep = useCallback((currentValue: number): number => {
    if (currentValue < 100) return 10;
    if (currentValue < 1000) return 100;
    return 1000;
  }, []);

  return (
    <div className="w-full">
      {infoMessage && (
        <div className="mb-3 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700">
          {infoMessage}
        </div>
      )}

      {items.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <div className="text-sm text-gray-700">
            {infoMessage || "Your business type typically doesn't have Cost of Goods Sold (COGS)."}
          </div>
          <div className="mt-3 flex justify-end">
            <Button onClick={() => onAddLineItem('cogs')} className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Add Line Item
            </Button>
          </div>
        </div>
      ) : (
        <>
          <div className="w-full overflow-x-auto">
            <table className="w-full min-w-[980px] border border-gray-200 rounded-lg overflow-hidden">
              <thead className="bg-gray-50">
                <tr className="text-left text-xs font-semibold text-gray-600">
                  <th className="p-3 w-10">
                    <div className="flex items-center justify-center">
                      <Checkbox
                        checked={isAllSelected ? true : isSomeSelected ? 'indeterminate' : false}
                        onCheckedChange={(v) => onToggleAllSelection(Boolean(v))}
                        aria-label="Select all COGS line items"
                      />
                    </div>
                  </th>
                  <th className="p-3">Line Item</th>
                  <th className="p-3 w-40">Budget ({currency})</th>
                  <th className="p-3 w-40">Actual ({currency})</th>
                  <th className="p-3 w-40">Variance ({currency})</th>
                  <th className="p-3">Notes</th>
                  <th className="p-3 w-14"></th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-200 bg-white">
                {items.map((item) => {
                  const varianceDisplay = getVarianceDisplay(item);
                  return (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="p-3 align-top">
                        <div className="flex items-center justify-center pt-2">
                          <Checkbox
                            checked={selectedItemIds.has(item.id)}
                            onCheckedChange={(v) => onToggleItemSelection(item.id, Boolean(v))}
                            aria-label={`Select ${item.name}`}
                          />
                        </div>
                      </td>

                      <td className="p-3 align-top">
                        <Input
                          value={item.name}
                          onChange={(e) => handleUpdateItem(item.id, { name: e.target.value })}
                          className="h-9"
                        />
                      </td>

                      <td className="p-3 align-top">
                        <CurrencyInput
                          value={item.estimated_amount ?? 0}
                          onChange={(value) => handleUpdateItem(item.id, { estimated_amount: value })}
                          min={0}
                          step={10} // Default step, will be overridden by getSmartStep
                          getSmartStep={getSmartStep}
                          className="w-full"
                        />
                      </td>

                      <td className="p-3 align-top">
                        <CurrencyInput
                          value={item.actual_amount ?? 0}
                          onChange={(value) => handleUpdateItem(item.id, { actual_amount: value })}
                          min={0}
                          step={10} // Default step, will be overridden by getSmartStep
                          getSmartStep={getSmartStep}
                          className="w-full"
                        />
                      </td>

                      <td className="p-3 align-top">
                        <div className={`pt-2 text-sm ${varianceDisplay.className}`}>{varianceDisplay.valueText}</div>
                      </td>

                      <td className="p-3 align-top">
                        <Input
                          value={item.description || ''}
                          onChange={(e) => handleUpdateItem(item.id, { description: e.target.value })}
                          className="h-9"
                          placeholder="Optional notes"
                        />
                      </td>

                      <td className="p-3 align-top">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onRemoveItem && onRemoveItem(item.id, item.name)}
                          aria-label={`Remove ${item.name}`}
                          className="text-gray-500 hover:text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  );
                })}

                <tr className="bg-gray-50 font-semibold">
                  <td className="p-3" />
                  <td className="p-3 text-gray-900">Total Direct Costs</td>
                  <td className="p-3 text-gray-900">{formatMoney(totals.budgetTotal, currency)}</td>
                  <td className="p-3 text-gray-900">{formatMoney(totals.actualTotal, currency)}</td>
                  <td className="p-3">
                    {totals.hasAnyActual ? (
                      <span
                        className={
                          totals.varianceTotal > 0
                            ? 'text-green-600'
                            : totals.varianceTotal < 0
                              ? 'text-red-600'
                              : 'text-gray-700'
                        }
                      >
                        {formatMoney(totals.budgetTotal - totals.actualTotal, currency)}
                      </span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="p-3" />
                  <td className="p-3" />
                </tr>
              </tbody>
            </table>
          </div>

          <div className="mt-3 flex justify-end">
            <Button onClick={() => onAddLineItem('cogs')} className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Add Line Item
            </Button>
          </div>
        </>
      )}
    </div>
  );
};

export default COGSTable;