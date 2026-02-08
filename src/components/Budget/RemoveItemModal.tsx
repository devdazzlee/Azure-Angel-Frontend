import React, { useState } from 'react';
import { Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { BudgetItem } from '@/types/apiTypes';
import { formatMoney } from '@/lib/formatters';

interface RemoveItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  itemName: string;
  isCustom?: boolean;
}

const RemoveItemModal: React.FC<RemoveItemModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  itemName,
  isCustom = false
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Remove Item</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <p className="text-gray-700">
            {isCustom 
              ? `Are you sure you want to remove "${itemName}"? This action cannot be undone.`
              : `Are you sure you want to remove "${itemName}"? You can add it back later if needed.`
            }
          </p>
          
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={onConfirm}
              className="bg-red-600 hover:bg-red-700"
            >
              Remove
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RemoveItemModal;
