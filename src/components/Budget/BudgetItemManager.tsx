import React, { useState } from 'react';
import { Plus, X, Edit2, Trash2, DollarSign, TrendingUp, TrendingDown } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import type { BudgetItem } from '@/types/apiTypes';
import BudgetSlider from './BudgetSlider';

interface BudgetItemManagerProps {
  items: BudgetItem[];
  onAddItem: (item: Omit<BudgetItem, 'id' | 'created_at' | 'updated_at'>) => void;
  onUpdateItem: (id: string, updates: Partial<BudgetItem>) => void;
  onDeleteItem: (id: string) => void;
  currency?: string;
}

const BudgetItemManager: React.FC<BudgetItemManagerProps> = ({
  items,
  onAddItem,
  onUpdateItem,
  onDeleteItem,
  currency = '$'
}) => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<BudgetItem | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    category: 'expense' as 'expense' | 'revenue',
    amount: 0,
    estimated_amount: 0,
    actual_amount: 0,
    description: ''
  });

  const resetForm = () => {
    setFormData({
      name: '',
      category: 'expense',
      amount: 0,
      estimated_amount: 0,
      actual_amount: 0,
      description: ''
    });
  };

  const handleSubmit = () => {
    if (!formData.name.trim()) {
      alert('Please enter an item name');
      return;
    }

    if (editingItem) {
      onUpdateItem(editingItem.id, {
        name: formData.name,
        category: formData.category,
        estimated_amount: formData.estimated_amount,
        actual_amount: formData.actual_amount,
        description: formData.description
      });
      setEditingItem(null);
    } else {
      onAddItem({
        name: formData.name,
        category: formData.category,
        estimated_amount: formData.estimated_amount,
        actual_amount: formData.actual_amount,
        description: formData.description,
        is_custom: true,
        isSelected: true
      });
      // Don't close dialog here - let parent control it
    }
    resetForm();
  };

  const handleEdit = (item: BudgetItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      category: item.category,
      amount: item.estimated_amount,
      estimated_amount: item.estimated_amount,
      actual_amount: item.actual_amount || 0,
      description: item.description || ''
    });
  };

  const handleDelete = (id: string): void => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      onDeleteItem(id);
    }
  };

  const expenses = items.filter(item => item.category === 'expense');
  const revenues = items.filter(item => item.category === 'revenue');

  const ItemForm = ({ trigger }: { trigger?: React.ReactNode }) => (
    <Dialog open={isAddDialogOpen || !!editingItem} onOpenChange={(open) => {
      if (!open) {
        setIsAddDialogOpen(false);
        setEditingItem(null);
        resetForm();
      }
    }}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Add Item
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {editingItem ? 'Edit Budget Item' : 'Add Budget Item'}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Item Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter item name"
              />
            </div>
            
            <div>
              <Label htmlFor="category">Category</Label>
              <Select
                value={formData.category}
                onValueChange={(value: 'expense' | 'revenue') => 
                  setFormData({ ...formData, category: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="expense">Expense</SelectItem>
                  <SelectItem value="revenue">Revenue</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Add any additional details..."
              rows={3}
            />
          </div>

          <BudgetSlider
            label="Estimated Amount"
            value={formData.estimated_amount}
            onChange={(value) => setFormData({ ...formData, estimated_amount: value })}
            min={0}
            max={100000}
            step={100}
            currency={currency}
          />

          {editingItem && (
            <BudgetSlider
              label="Actual Amount"
              value={formData.actual_amount}
              onChange={(value) => setFormData({ ...formData, actual_amount: value })}
              min={0}
              max={100000}
              step={100}
              currency={currency}
            />
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setIsAddDialogOpen(false);
                setEditingItem(null);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={!formData.name.trim() || formData.estimated_amount <= 0}>
              {editingItem ? 'Update' : 'Add'} Item
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );

  return (
    <div className="space-y-6">
      {/* Add Item Button */}
      <div className="flex justify-end">
        <ItemForm />
      </div>

      {/* Expenses Section */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <TrendingDown className="w-5 h-5 text-red-500" />
          <h3 className="text-lg font-semibold text-gray-900">Expenses</h3>
          <span className="text-sm text-gray-500">
            ({expenses.length} items, {currency}{expenses.reduce((sum, item) => sum + (Number(item.estimated_amount) || 0), 0).toLocaleString()})
          </span>
        </div>
        
        <div className="space-y-2">
          {expenses.map((item) => (
            <div key={item.id} className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{item.name}</h4>
                  {item.description && (
                    <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                  )}
                  <div className="mt-2 flex items-center gap-4 text-sm">
                    <span className="text-gray-500">
                      Est: {currency}{(Number(item.estimated_amount) || 0).toLocaleString()}
                    </span>
                    {item.actual_amount !== undefined && item.actual_amount !== null && (
                      <span className="text-gray-500">
                        Actual: {currency}{(Number(item.actual_amount) || 0).toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(item)}
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(item.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
          
          {expenses.length === 0 && (
            <p className="text-gray-500 text-center py-4">No expenses added yet</p>
          )}
        </div>
      </div>

      {/* Revenues Section */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-green-500" />
          <h3 className="text-lg font-semibold text-gray-900">Revenue</h3>
          <span className="text-sm text-gray-500">
            ({revenues.length} items, {currency}{revenues.reduce((sum, item) => sum + (Number(item.estimated_amount) || 0), 0).toLocaleString()})
          </span>
        </div>
        
        <div className="space-y-2">
          {revenues.map((item) => (
            <div key={item.id} className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{item.name}</h4>
                  {item.description && (
                    <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                  )}
                  <div className="mt-2 flex items-center gap-4 text-sm">
                    <span className="text-gray-500">
                      Est: {currency}{(Number(item.estimated_amount) || 0).toLocaleString()}
                    </span>
                    {item.actual_amount !== undefined && item.actual_amount !== null && (
                      <span className="text-gray-500">
                        Actual: {currency}{(Number(item.actual_amount) || 0).toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(item)}
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(item.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
          
          {revenues.length === 0 && (
            <p className="text-gray-500 text-center py-4">No revenue streams added yet</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default BudgetItemManager;
