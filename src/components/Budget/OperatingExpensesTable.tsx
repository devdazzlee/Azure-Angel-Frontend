import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Trash2, Plus, Edit2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import type { BudgetItem } from '@/types/apiTypes';
import { formatMoney } from '@/lib/formatters'; // Import from new formatters
import CurrencyInput from '../ui/CurrencyInput'; // Import CurrencyInput

export function createDefaultOperatingExpenses(businessType?: string): BudgetItem[] {
  const normalized = (businessType || '').trim().toLowerCase();

  const isRemoteOnline =
    normalized.includes('remote') ||
    normalized.includes('online') ||
    normalized.includes('e-commerce') ||
    normalized.includes('ecommerce') ||
    normalized.includes('influencer') ||
    normalized.includes('creator') ||
    normalized.includes('saas') ||
    normalized.includes('digital');

  const isPhysicalLocation =
    normalized.includes('restaurant') ||
    normalized.includes('retail') ||
    normalized.includes('store') ||
    normalized.includes('shop') ||
    normalized.includes('salon') ||
    normalized.includes('gym') ||
    normalized.includes('clinic') ||
    normalized.includes('food truck') ||
    normalized.includes('warehouse') ||
    normalized.includes('manufactur');

  const isVehicleBased =
    normalized.includes('delivery') ||
    normalized.includes('courier') ||
    normalized.includes('logistics') ||
    normalized.includes('rideshare') ||
    normalized.includes('transport') ||
    normalized.includes('food truck') ||
    normalized.includes('mobile');

  const isServiceBusiness =
    normalized.includes('service') ||
    normalized.includes('consult') ||
    normalized.includes('agency') ||
    normalized.includes('freelance') ||
    normalized.includes('coaching');

  type Template = { key: string; name: string; notes: string };

  const templates: Record<string, Template> = {
    rent: {
      key: 'rent',
      name: 'Rent / workspace',
      notes: 'Monthly rent, coworking membership, or lease payments',
    },
    utilities: {
      key: 'utilities',
      name: 'Utilities & internet',
      notes: 'Electricity, water, trash, internet',
    },
    software: {
      key: 'software',
      name: 'Software subscriptions',
      notes: 'SaaS tools, memberships, hosting subscriptions',
    },
    insurance: {
      key: 'insurance',
      name: 'Insurance (monthly)',
      notes: 'Recurring premiums (liability, professional, auto, etc.)',
    },
    marketing: {
      key: 'marketing',
      name: 'Marketing & advertising',
      notes: 'Ads, promotions, content spend, sponsorships',
    },
    bookkeeping: {
      key: 'bookkeeping',
      name: 'Accounting & bookkeeping',
      notes: 'Bookkeeping service, payroll fees, accounting tools',
    },
    professional: {
      key: 'professional',
      name: 'Professional services',
      notes: 'Contractors, freelancers, legal/CPA retainers',
    },
    vehicle: {
      key: 'vehicle',
      name: 'Vehicle expenses',
      notes: 'Fuel, maintenance, parking, tolls, mileage',
    },
    phone: {
      key: 'phone',
      name: 'Phone & communications',
      notes: 'Phone plan, communications tools',
    },
    inventory: {
      key: 'inventory',
      name: 'Inventory replenishment',
      notes: 'Recurring inventory/materials replenishment (if applicable)',
    },
    buffer: {
      key: 'buffer',
      name: 'Miscellaneous / buffer',
      notes: 'Unexpected recurring costs and cushion',
    },
  };

  const baseKeys = [
    'rent',
    'utilities',
    'software',
    'insurance',
    'marketing',
    'bookkeeping',
    'professional',
    'vehicle',
    'phone',
    'inventory',
    'buffer',
  ];

  const filteredKeys = baseKeys.filter((key) => {
    if (isRemoteOnline && (key === 'rent' || key === 'utilities')) return false;
    if (!isVehicleBased && key === 'vehicle') return false;
    if (isServiceBusiness && key === 'inventory') return false;
    return true;
  });

  const keys = filteredKeys.length ? filteredKeys : baseKeys;

  return keys.map((key, index) => {
    const template = templates[key];
    return {
      id: `operating_${key}_${index}`,
      name: template?.name ?? key,
      category: 'expense',
      estimated_amount: 0,
      actual_amount: undefined,
      description: template?.notes ?? '',
      is_custom: false,
      isSelected: false, // Default to not selected
    } satisfies BudgetItem;
  });
}

type OperatingExpensesTableProps = {
  items: BudgetItem[];
  onChange: (items: BudgetItem[]) => void;
  onRemoveItem?: (id: string, name: string) => void;
  currency?: string;
  selectedItemIds: Set<string>;
  onToggleItemSelection: (itemId: string, isSelected: boolean) => void;
  onToggleAllSelection: (isSelected: boolean) => void;
  onAddLineItem: (category: 'operating_expense') => void; // New prop
};

const OperatingExpensesTable: React.FC<OperatingExpensesTableProps> = ({
  items,
  onChange,
  onRemoveItem,
  currency = '$',
  selectedItemIds,
  onToggleItemSelection,
  onToggleAllSelection,
  onAddLineItem
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
      <div className="w-full overflow-x-auto">
        <table className="w-full min-w-[980px] border border-gray-200 rounded-lg overflow-hidden">
          <thead className="bg-gray-50">
            <tr className="text-left text-xs font-semibold text-gray-600">
              <th className="p-3 w-10">
                <div className="flex items-center justify-center">
                  <Checkbox
                    checked={isAllSelected ? true : isSomeSelected ? 'indeterminate' : false}
                    onCheckedChange={(v) => onToggleAllSelection(Boolean(v))}
                    aria-label="Select all operating expense line items"
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
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onToggleItemSelection(item.id, !selectedItemIds.has(item.id))}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onRemoveItem && onRemoveItem(item.id, item.name)}
                        className="text-red-500 hover:text-red-700 opacity-0 hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}

            <tr className="bg-gray-50 font-semibold">
              <td className="p-3" />
              <td className="p-3 text-gray-900">Total Monthly Operating Costs</td>
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
        <Button onClick={() => onAddLineItem('operating_expense')} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Add Line Item
        </Button>
      </div>
    </div>
  );
};

export default OperatingExpensesTable;