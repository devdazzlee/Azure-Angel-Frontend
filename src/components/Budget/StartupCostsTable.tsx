import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { Trash2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import type { BudgetItem } from '@/types/apiTypes';
import { formatMoney } from '@/lib/formatters'; // Import from new formatters
import CurrencyInput from '../ui/CurrencyInput'; // Import CurrencyInput

export function createDefaultStartupCosts(businessType?: string): BudgetItem[] {
  const normalized = (businessType || '').trim().toLowerCase();

  const typeKey = (() => {
    if (!normalized) return 'default';
    if (normalized.includes('influencer') || normalized.includes('creator') || normalized.includes('social media')) return 'influencer';
    if (normalized.includes('food truck')) return 'food_truck';
    if (normalized.includes('consult')) return 'consulting';
    if (normalized.includes('e-commerce') || normalized.includes('ecommerce') || normalized.includes('online store')) return 'e_commerce';
    if (normalized.includes('delivery') || normalized.includes('courier') || normalized.includes('logistics')) return 'delivery';
    return 'default';
  })();

  type StartupCostTemplate = { key: string; name: string; notes: string; };

  const base: Record<string, StartupCostTemplate> = {
    registration: {
      key: 'registration',
      name: 'Business registration & licenses',
      notes: 'Formation fees, permits, licenses, and filings',
    },
    legal: {
      key: 'legal',
      name: 'Legal & accounting setup',
      notes: 'Initial attorney/CPA setup and bookkeeping configuration',
    },
    equipment: {
      key: 'equipment',
      name: 'Equipment & tools',
      notes: 'Tools/equipment required to deliver your product or service',
    },
    inventory: {
      key: 'inventory',
      name: 'Initial inventory / materials',
      notes: 'Initial stock, raw materials, packaging, supplies',
    },
    vehicle: {
      key: 'vehicle',
      name: 'Vehicle purchase / lease',
      notes: 'Only if needed for operations (purchase, lease, or down payment)',
    },
    branding: {
      key: 'branding',
      name: 'Branding & design',
      notes: 'Logo, visual identity, photography, initial brand assets',
    },
    website: {
      key: 'website',
      name: 'Website & initial software setup',
      notes: 'Domain, hosting, web build, key software subscriptions',
    },
    insurance: {
      key: 'insurance',
      name: 'Insurance (initial premiums)',
      notes: 'General liability, professional, auto, etc.',
    },
    workspace: {
      key: 'workspace',
      name: 'Office / workspace setup',
      notes: 'Deposits, furniture, basic setup for office/workspace',
    },
  };

  const relevantKeysByType: Record<string, string[]> = {
    influencer: ['equipment', 'branding', 'website', 'registration', 'legal', 'insurance'],
    food_truck: ['vehicle', 'equipment', 'inventory', 'registration', 'legal', 'insurance', 'branding', 'website'],
    consulting: ['equipment', 'branding', 'website', 'workspace', 'registration', 'legal', 'insurance'],
    e_commerce: ['inventory', 'website', 'branding', 'equipment', 'registration', 'legal', 'insurance'],
    delivery: ['vehicle', 'equipment', 'registration', 'legal', 'insurance', 'branding', 'website'],
    default: ['registration', 'legal', 'equipment', 'inventory', 'vehicle', 'branding', 'website', 'insurance', 'workspace'],
  };

  const relevantKeys = relevantKeysByType[typeKey] || relevantKeysByType.default;

  return relevantKeys.map((key, index) => {
    const template = base[key];
    return {
      id: `startup_${key}_${index}`,
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

type StartupCostsTableProps = {
  items: BudgetItem[];
  onChange: (items: BudgetItem[]) => void;
  onRemoveItem?: (id: string, name: string) => void;
  currency?: string;
  selectedItemIds: Set<string>; // New prop for selected item IDs
  onToggleItemSelection: (itemId: string, isSelected: boolean) => void; // New prop for toggling individual item selection
  onToggleAllSelection: (isSelected: boolean) => void; // New prop for toggling all items selection
  onAddLineItem: (category: 'startup_cost') => void; // New prop for adding line item
};

const StartupCostsTable: React.FC<StartupCostsTableProps> = ({
  items,
  onChange,
  onRemoveItem,
  currency = '$',
  selectedItemIds,
  onToggleItemSelection,
  onToggleAllSelection,
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

  const handleRemoveItem = useCallback(
    (item: BudgetItem) => {
      if (onRemoveItem) {
        onRemoveItem(item.id, item.name);
        return;
      }
      onChange(items.filter((i) => i.id !== item.id));
    },
    [items, onChange, onRemoveItem]
  );

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
    if (currentValue < 1000) return 100;
    if (currentValue < 10000) return 1000;
    return 5000; // Larger step for larger startup costs
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
                    aria-label="Select all startup cost line items"
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
                      step={100} // Default step, will be overridden by getSmartStep
                      getSmartStep={getSmartStep}
                      className="w-full"
                    />
                  </td>

                  <td className="p-3 align-top">
                    <CurrencyInput
                      value={item.actual_amount ?? 0}
                      onChange={(value) => handleUpdateItem(item.id, { actual_amount: value })}
                      min={0}
                      step={100} // Default step, will be overridden by getSmartStep
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
                      onClick={() => handleRemoveItem(item)}
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
              <td className="p-3 text-gray-900">Total Startup Costs</td>
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
        <Button onClick={() => onAddLineItem('startup_cost')} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Add Line Item
        </Button>
      </div>
    </div>
  );
};

export default StartupCostsTable;