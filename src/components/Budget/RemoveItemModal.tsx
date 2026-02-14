import React, { useState, useEffect } from 'react';
import { Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface RemoveItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
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
  const [isRemoving, setIsRemoving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsRemoving(false);
    }
  }, [isOpen]);

  const handleConfirm = async () => {
    setIsRemoving(true);
    try {
      await onConfirm();
    } catch (error) {
      console.error('Failed to remove item:', error);
    } finally {
      setIsRemoving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open && !isRemoving) onClose(); }}>
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
            <Button variant="outline" onClick={onClose} disabled={isRemoving}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleConfirm}
              disabled={isRemoving}
              className="bg-red-600 hover:bg-red-700 min-w-[100px]"
            >
              {isRemoving ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Removing...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Trash2 className="w-4 h-4" />
                  Remove
                </span>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RemoveItemModal;
