import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Trash2, Plus, Edit2, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
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
    const actualNum = Number(item.actual_amount) || 0;
    const variance = budget - actualNum;

    if (variance > 0) return { valueText: formatMoney(variance, currency), className: 'text-green-600 font-semibold' };
    if (variance < 0) return { valueText: formatMoney(variance, currency), className: 'text-red-600 font-semibold' };
    return { valueText: formatMoney(0, currency), className: 'text-gray-500' };
  };

  const getSmartStep = useCallback((currentValue: number): number => {
    if (currentValue < 100) return 10;
    if (currentValue < 1000) return 100;
    return 1000;
  }, []);

  return (
    <div className="w-full">
      <div className="w-full overflow-x-auto rounded-xl border border-gray-200/60">
        <table className="w-full min-w-[980px]">
          <thead>
            <tr className="text-left text-[11px] font-bold uppercase tracking-wider text-gray-500 bg-gradient-to-r from-gray-50 to-gray-100/60 border-b border-gray-200/60">
              <th className="px-3 py-3.5 w-10">
                <Tooltip>
                  <TooltipTrigger asChild><div className="flex items-center justify-center"><Checkbox checked={isAllSelected ? true : isSomeSelected ? 'indeterminate' : false} onCheckedChange={(v) => onToggleAllSelection(Boolean(v))} aria-label="Select all operating expense line items" /></div></TooltipTrigger>
                  <TooltipContent side="top" className="max-w-[200px]">Select items to discuss with Angel AI</TooltipContent>
                </Tooltip>
              </th>
              <th className="px-3 py-3.5">Line Item</th>
              <th className="px-3 py-3.5 w-40">
                <Tooltip>
                  <TooltipTrigger asChild><span className="flex items-center gap-1 cursor-help">Budget ({currency}) <HelpCircle className="w-3 h-3 text-gray-400" /></span></TooltipTrigger>
                  <TooltipContent side="top" className="max-w-[220px]">Your estimated/planned monthly amount</TooltipContent>
                </Tooltip>
              </th>
              <th className="px-3 py-3.5 w-40">
                <Tooltip>
                  <TooltipTrigger asChild><span className="flex items-center gap-1 cursor-help">Actual ({currency}) <HelpCircle className="w-3 h-3 text-gray-400" /></span></TooltipTrigger>
                  <TooltipContent side="top" className="max-w-[220px]">What you actually spent — fill in as you go</TooltipContent>
                </Tooltip>
              </th>
              <th className="px-3 py-3.5 w-40">
                <Tooltip>
                  <TooltipTrigger asChild><span className="flex items-center gap-1 cursor-help">Variance ({currency}) <HelpCircle className="w-3 h-3 text-gray-400" /></span></TooltipTrigger>
                  <TooltipContent side="top" className="max-w-[240px]">Budget − Actual. Green = under budget, Red = over budget</TooltipContent>
                </Tooltip>
              </th>
              <th className="px-3 py-3.5">Notes</th>
              <th className="px-3 py-3.5 w-12" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {items.map((item, idx) => {
              const varianceDisplay = getVarianceDisplay(item);
              return (
                <tr key={item.id} className={`group transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/40'} hover:bg-teal-50/40`}>
                  <td className="px-3 py-2.5 align-top">
                    <Tooltip>
                      <TooltipTrigger asChild><div className="flex items-center justify-center pt-2"><Checkbox checked={selectedItemIds.has(item.id)} onCheckedChange={(v) => onToggleItemSelection(item.id, Boolean(v))} aria-label={`Select ${item.name}`} /></div></TooltipTrigger>
                      <TooltipContent side="right" className="max-w-[180px]">Select to discuss with Angel</TooltipContent>
                    </Tooltip>
                  </td>
                  <td className="px-3 py-2.5 align-top"><Input value={item.name} onChange={(e) => handleUpdateItem(item.id, { name: e.target.value })} className="h-9 border-gray-200/80 focus:border-teal-400 focus:ring-teal-400/20" /></td>
                  <td className="px-3 py-2.5 align-top"><CurrencyInput value={item.estimated_amount ?? 0} onChange={(value) => handleUpdateItem(item.id, { estimated_amount: value })} min={0} step={10} getSmartStep={getSmartStep} adjustmentControl="buttons" className="w-full" /></td>
                  <td className="px-3 py-2.5 align-top"><CurrencyInput value={item.actual_amount ?? 0} onChange={(value) => handleUpdateItem(item.id, { actual_amount: value })} min={0} step={10} getSmartStep={getSmartStep} className="w-full" /></td>
                  <td className="px-3 py-2.5 align-top"><div className={`pt-2 text-sm ${varianceDisplay.className}`}>{varianceDisplay.valueText}</div></td>
                  <td className="px-3 py-2.5 align-top"><Input value={item.description || ''} onChange={(e) => handleUpdateItem(item.id, { description: e.target.value })} className="h-9 border-gray-200/80 focus:border-teal-400 focus:ring-teal-400/20" placeholder="Optional notes" /></td>
                  <td className="px-3 py-2.5 align-top">
                    <Button variant="ghost" size="icon" onClick={() => onRemoveItem && onRemoveItem(item.id, item.name)} className="text-gray-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="w-4 h-4" /></Button>
                  </td>
                </tr>
              );
            })}
            <tr className="bg-gradient-to-r from-teal-50/60 to-cyan-50/60 font-semibold border-t-2 border-teal-200/40">
              <td className="px-3 py-3.5" />
              <td className="px-3 py-3.5 text-gray-900 text-sm">Total Monthly Operating Costs</td>
              <td className="px-3 py-3.5 text-gray-900 text-sm">{formatMoney(totals.budgetTotal, currency)}</td>
              <td className="px-3 py-3.5 text-gray-900 text-sm">{formatMoney(totals.actualTotal, currency)}</td>
              <td className="px-3 py-3.5 text-sm">{(() => { const v = totals.budgetTotal - totals.actualTotal; return <span className={v > 0 ? 'text-emerald-600 font-semibold' : v < 0 ? 'text-red-600 font-semibold' : 'text-gray-500'}>{formatMoney(v, currency)}</span>; })()}</td>
              <td className="px-3 py-3.5" />
              <td className="px-3 py-3.5" />
            </tr>
          </tbody>
        </table>
      </div>
      <div className="mt-4 flex justify-end">
        <Button onClick={() => onAddLineItem('operating_expense')} size="sm" className="bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white shadow-sm flex items-center gap-1.5"><Plus className="w-3.5 h-3.5" /> Add Line Item</Button>
      </div>
    </div>
  );
};

export default OperatingExpensesTable;