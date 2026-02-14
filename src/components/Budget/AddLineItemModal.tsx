import React, { useEffect, useMemo, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import type { BudgetItem, RevenueStream } from '@/types/apiTypes';
import { formatCurrency } from '@/lib/utils';
import { toast } from 'react-toastify';

type AddRevenueStreamPayload = {
  name: string;
  estimatedPrice: number;
  estimatedVolume: number;
  description?: string;
};

interface AddLineItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddExpenseItem: (item: Omit<BudgetItem, 'id' | 'created_at' | 'updated_at'>) => Promise<void> | void;
  onAddRevenueStream: (stream: AddRevenueStreamPayload) => Promise<void> | void;
  category: 'startup_cost' | 'operating_expense' | 'payroll' | 'cogs' | 'revenue';
  existingItems: (BudgetItem | RevenueStream)[]; // Used for name uniqueness validation
  currency: string;
}

type FieldErrors = Partial<
  Record<'name' | 'amount' | 'notes' | 'estimatedPrice' | 'estimatedVolume', string>
>;

const AddLineItemModal: React.FC<AddLineItemModalProps> = ({
  isOpen,
  onClose,
  onAddExpenseItem,
  onAddRevenueStream,
  category,
  existingItems,
  currency,
}) => {
  const isRevenue = category === 'revenue';

  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [estimatedPrice, setEstimatedPrice] = useState('');
  const [estimatedVolume, setEstimatedVolume] = useState('');
  const [errors, setErrors] = useState<FieldErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const existingNames = useMemo(() => {
    return new Set(
      existingItems
        .map((i) => ('name' in i ? String(i.name).trim().toLowerCase() : ''))
        .filter(Boolean)
    );
  }, [existingItems]);

  useEffect(() => {
    if (isOpen) {
      setName('');
      setAmount('');
      setNotes('');
      setEstimatedPrice('');
      setEstimatedVolume('');
      setErrors({});
      setIsSubmitting(false);
    }
  }, [isOpen]);

  const validate = (): boolean => {
    const next: FieldErrors = {};

    const trimmedName = name.trim();
    if (!trimmedName) {
      next.name = 'Name cannot be empty';
    } else if (existingNames.has(trimmedName.toLowerCase())) {
      next.name = 'Item with this name already exists in this category';
    }

    if (isRevenue) {
      const p = Number(estimatedPrice);
      const v = Number(estimatedVolume);
      if (!estimatedPrice.trim()) next.estimatedPrice = 'Estimated Price is required';
      else if (!Number.isFinite(p) || p <= 0) next.estimatedPrice = 'Estimated Price must be a positive number';

      if (!estimatedVolume.trim()) next.estimatedVolume = 'Estimated Volume is required';
      else if (!Number.isFinite(v) || v <= 0) next.estimatedVolume = 'Estimated Volume must be a positive integer';
      else if (!Number.isInteger(v)) next.estimatedVolume = 'Estimated Volume must be an integer';
    } else {
      const a = Number(amount);
      if (!amount.trim()) next.amount = 'Budget Amount is required';
      else if (!Number.isFinite(a) || a <= 0) next.amount = 'Amount must be a positive number';
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);

    const description = notes.trim() ? notes.trim() : undefined;
    const trimmedName = name.trim();

    try {
      if (isRevenue) {
        const p = Number(estimatedPrice);
        const v = Number(estimatedVolume);
        const projection = p * v;

        await onAddRevenueStream({
          name: trimmedName,
          estimatedPrice: p,
          estimatedVolume: v,
          description,
        });

        toast.success(
          `Custom revenue stream "${trimmedName}" added with projection ${formatCurrency(projection, currency)}`
        );
        onClose();
        return;
      }

      const a = Number(amount);
      await onAddExpenseItem({
        name: trimmedName,
        category: 'expense',
        estimated_amount: a,
        actual_amount: undefined,
        description,
        is_custom: true,
        isSelected: true,
      });

      toast.success(`Custom line item "${trimmedName}" added for ${formatCurrency(a, currency)}`);
      onClose();
    } catch (error) {
      // Error is already handled by the parent's toast
      console.error('Failed to add item:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getTitle = () => {
    switch (category) {
      case 'startup_cost':
        return 'Add Custom Startup Cost';
      case 'operating_expense':
        return 'Add Custom Operating Expense';
      case 'payroll':
        return 'Add Custom Payroll Item';
      case 'cogs':
        return 'Add Custom COGS Item';
      case 'revenue':
        return 'Add Custom Revenue Stream';
      default:
        return 'Add Custom Budget Item';
    }
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="sm:max-w-[425px] sm:rounded-lg max-sm:h-[100vh] max-sm:max-w-none max-sm:rounded-none max-sm:p-4 bg-white border border-gray-200 shadow-xl">
        <DialogHeader>
          <DialogTitle>{getTitle()}</DialogTitle>
          <DialogDescription>
            Add a new custom line item to your budget.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-medium">
              {isRevenue ? 'Revenue Stream Name' : 'Line Item Name'}
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={isRevenue ? 'Website Sales' : 'Custom Software License'}
            />
            {errors.name ? <p className="text-sm text-red-600">{errors.name}</p> : null}
          </div>

          {isRevenue ? (
            <>
              <div className="space-y-1">
                <label className="text-sm font-medium">Estimated Price ({currency})</label>
                <Input
                  value={estimatedPrice}
                  onChange={(e) => setEstimatedPrice(e.target.value)}
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  min="0"
                />
                {errors.estimatedPrice ? (
                  <p className="text-sm text-red-600">{errors.estimatedPrice}</p>
                ) : null}
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium">Estimated Volume</label>
                <Input
                  value={estimatedVolume}
                  onChange={(e) => setEstimatedVolume(e.target.value)}
                  type="number"
                  step="1"
                  placeholder="0"
                  min="0"
                />
                {errors.estimatedVolume ? (
                  <p className="text-sm text-red-600">{errors.estimatedVolume}</p>
                ) : null}
              </div>
            </>
          ) : (
            <div className="space-y-1">
              <label className="text-sm font-medium">Budget Amount ({currency})</label>
              <Input
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                type="number"
                step="0.01"
                placeholder="0.00"
                min="0"
              />
              {errors.amount ? <p className="text-sm text-red-600">{errors.amount}</p> : null}
            </div>
          )}

          <div className="space-y-1">
            <label className="text-sm font-medium">Notes (Optional)</label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Description or additional details"
            />
            {errors.notes ? <p className="text-sm text-red-600">{errors.notes}</p> : null}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white min-w-[100px]"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Adding...
                </span>
              ) : (
                'Add Item'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddLineItemModal;
