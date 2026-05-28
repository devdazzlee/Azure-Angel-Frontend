import React from 'react';
import { Trash2, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { formatMoney } from '@/lib/formatters';
import CurrencyInput from '../ui/CurrencyInput';
import type { RevenueStream } from '@/types/apiTypes';

interface BudgetRevenueMobileCardsProps {
  items: RevenueStream[];
  currency?: string;
  selectedItemIds: Set<string>;
  editingStreamId: string | null;
  editingStreamName: string;
  onToggleItemSelection: (itemId: string, isSelected: boolean) => void;
  onToggleAllSelection: (itemIds: string[], isSelected: boolean) => void;
  onEditNameClick: (stream: RevenueStream) => void;
  onEditingNameChange: (name: string) => void;
  onSaveNameEdit: (id: string) => void;
  onPriceChange: (id: string, value: string) => void;
  onVolumeChange: (id: string, value: string) => void;
  onRemoveStream: (id: string) => void;
  totalMonthlyRevenue: number;
}

const fieldLabel =
  'block text-[11px] font-semibold uppercase tracking-wide text-gray-500 mb-1.5';

const BudgetRevenueMobileCards: React.FC<BudgetRevenueMobileCardsProps> = ({
  items,
  currency = '$',
  selectedItemIds,
  editingStreamId,
  editingStreamName,
  onToggleItemSelection,
  onToggleAllSelection,
  onEditNameClick,
  onEditingNameChange,
  onSaveNameEdit,
  onPriceChange,
  onVolumeChange,
  onRemoveStream,
  totalMonthlyRevenue,
}) => {
  const isAllSelected = items.length > 0 && items.every((item) => selectedItemIds.has(item.id));
  const isSomeSelected = items.some((item) => selectedItemIds.has(item.id)) && !isAllSelected;

  if (items.length === 0) {
    return (
      <p className="md:hidden rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-8 text-center text-sm text-gray-500">
        No revenue streams added yet.
      </p>
    );
  }

  return (
    <div className="md:hidden space-y-3">
      {items.length > 1 && (
        <label className="flex items-center gap-2 rounded-lg border border-gray-200/80 bg-gray-50/80 px-3 py-2.5 text-sm text-gray-700">
          <Checkbox
            checked={isAllSelected ? true : isSomeSelected ? 'indeterminate' : false}
            onCheckedChange={(v) => onToggleAllSelection(items.map((i) => i.id), Boolean(v))}
            aria-label="Select all revenue streams"
          />
          Select all
        </label>
      )}

      {items.map((stream) => (
        <article
          key={stream.id}
          className={`overflow-hidden rounded-xl border border-gray-200/80 bg-white p-4 shadow-sm ${
            stream.isSelected ? '' : 'opacity-60'
          }`}
        >
          <div className="flex items-start gap-3 border-b border-gray-100 pb-4">
            <Checkbox
              checked={selectedItemIds.has(stream.id)}
              onCheckedChange={(v) => onToggleItemSelection(stream.id, Boolean(v))}
              className="mt-2 shrink-0"
            />
            <div className="min-w-0 flex-1">
              <label className={fieldLabel}>Stream name</label>
              {editingStreamId === stream.id ? (
                <Input
                  value={editingStreamName}
                  onChange={(e) => onEditingNameChange(e.target.value)}
                  onBlur={() => onSaveNameEdit(stream.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') onSaveNameEdit(stream.id);
                  }}
                  className="h-10 w-full min-w-0 text-sm"
                  autoFocus
                />
              ) : (
                <div className="flex min-w-0 items-start justify-between gap-2">
                  <p className="min-w-0 flex-1 break-words text-sm font-medium leading-snug text-gray-900">
                    {stream.name}
                  </p>
                  <button
                    type="button"
                    onClick={() => onEditNameClick(stream)}
                    className="shrink-0 rounded-md p-1.5 text-gray-400 hover:bg-teal-50 hover:text-teal-600"
                    aria-label="Edit stream name"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => onRemoveStream(stream.id)}
              className="mt-6 shrink-0 text-gray-400 hover:text-red-600"
              aria-label={`Remove ${stream.name}`}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>

          <div className="space-y-4 py-4">
            <div className="min-w-0">
              <label className={fieldLabel}>Est. price ({currency})</label>
              <CurrencyInput
                value={stream.estimatedPrice}
                onChange={(value) => onPriceChange(stream.id, String(value))}
                min={0}
                step={0.01}
                disabled={!stream.isSelected}
                adjustmentControl="none"
                className="w-full min-w-0"
              />
            </div>
            <div className="min-w-0">
              <label className={fieldLabel}>Est. volume / month</label>
              <Input
                type="number"
                inputMode="numeric"
                value={stream.estimatedVolume}
                onChange={(e) => onVolumeChange(stream.id, e.target.value)}
                className="h-10 w-full min-w-0 tabular-nums"
                min={0}
                step={1}
                disabled={!stream.isSelected}
              />
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-3">
            <span className="text-xs font-semibold uppercase tracking-wide text-emerald-800">
              Monthly revenue
            </span>
            <span className="text-sm font-bold tabular-nums text-emerald-700 shrink-0">
              {formatMoney(stream.revenueProjection, currency)}
            </span>
          </div>
        </article>
      ))}

      <div className="flex items-center justify-between gap-3 rounded-xl border-2 border-teal-200/50 bg-gradient-to-r from-teal-50/80 to-cyan-50/80 p-4">
        <span className="min-w-0 text-sm font-bold text-gray-900 leading-snug">
          Projected monthly revenue
        </span>
        <span className="shrink-0 text-base font-extrabold tabular-nums text-emerald-600">
          {formatMoney(totalMonthlyRevenue, currency)}
        </span>
      </div>
    </div>
  );
};

export default BudgetRevenueMobileCards;
