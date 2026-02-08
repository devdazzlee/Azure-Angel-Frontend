import type { BudgetItem } from "@/types/apiTypes";

// Industry benchmarks for different business types
export const INDUSTRY_BENCHMARKS = {
  cafe: {
    startupCosts: { min: 20000, max: 150000, average: 50000 },
    monthlyExpenses: { min: 2000, max: 20000, average: 8000 },
    marketingBudget: { min: 500, max: 5000, average: 1500 },
    payrollPercentage: { min: 15, max: 40, average: 25 }
  },
  restaurant: {
    startupCosts: { min: 30000, max: 300000, average: 75000 },
    monthlyExpenses: { min: 3000, max: 30000, average: 12000 },
    marketingBudget: { min: 1000, max: 8000, average: 3000 },
    payrollPercentage: { min: 20, max: 45, average: 30 }
  },
  retail: {
    startupCosts: { min: 15000, max: 200000, average: 40000 },
    monthlyExpenses: { min: 1500, max: 15000, average: 6000 },
    marketingBudget: { min: 300, max: 3000, average: 1000 },
    payrollPercentage: { min: 12, max: 35, average: 20 }
  },
  service: {
    startupCosts: { min: 10000, max: 100000, average: 25000 },
    monthlyExpenses: { min: 1000, max: 10000, average: 4000 },
    marketingBudget: { min: 200, max: 2000, average: 800 },
    payrollPercentage: { min: 10, max: 30, average: 18 }
  },
  startup: {
    startupCosts: { min: 5000, max: 100000, average: 25000 },
    monthlyExpenses: { min: 1000, max: 20000, average: 5000 },
    marketingBudget: { min: 500, max: 5000, average: 2000 },
    payrollPercentage: { min: 5, max: 25, average: 15 }
  }
};

// Common line items by business type
export const COMMON_LINE_ITEMS = {
  cafe: [
    'Coffee beans and supplies',
    'Rent and utilities',
    'Equipment (coffee machine, furniture)',
    'Point of sale system',
    'Marketing and advertising',
    'Insurance and licenses',
    'Staff wages',
    'Cleaning and maintenance'
  ],
  restaurant: [
    'Kitchen equipment',
    'Dining room furniture',
    'POS system and software',
    'Food inventory',
    'Rent and utilities',
    'Marketing and advertising',
    'Insurance and licenses',
    'Staff wages',
    'Cleaning and maintenance'
  ],
  retail: [
    'Inventory and merchandise',
    'Store fixtures and displays',
    'POS system and software',
    'Marketing and advertising',
    'Rent and utilities',
    'Insurance and licenses',
    'Staff wages',
    'Security systems'
  ],
  service: [
    'Professional equipment',
    'Software and tools',
    'Marketing and advertising',
    'Insurance and licenses',
    'Office rent and utilities',
    'Staff wages',
    'Professional development'
  ],
  startup: [
    'Business registration and legal',
    'Website and domain',
    'Software and tools',
    'Marketing and advertising',
    'Professional services',
    'Office equipment',
    'Initial inventory'
  ]
};

export interface ValidationWarning {
  id: string;
  type: 'error' | 'warning' | 'info';
  field: string;
  message: string;
  suggestion?: string;
  autoFix?: () => void;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface ValidationResult {
  isValid: boolean;
  warnings: ValidationWarning[];
  suggestions: ValidationWarning[];
}

// Validation functions
export const validateBudgetItem = (item: Partial<BudgetItem>, businessType?: string): ValidationResult => {
  const warnings: ValidationWarning[] = [];
  const suggestions: ValidationWarning[] = [];

  // Validate amount
  if (item.estimated_amount !== undefined) {
    const amount = Number(item.estimated_amount);
    
    // Check for negative amounts
    if (amount < 0) {
      warnings.push({
        id: 'negative-amount',
        type: 'error',
        field: 'estimated_amount',
        message: 'Amount cannot be negative',
        severity: 'critical'
      });
    }

    // Check for unreasonably high amounts based on item type
    const itemName = (item.name || '').toLowerCase();
    const benchmarks = businessType ? INDUSTRY_BENCHMARKS[businessType as keyof typeof INDUSTRY_BENCHMARKS] : null;
    
    if (benchmarks) {
      // Phone bill warning
      if (itemName.includes('phone') && amount > 500) {
        warnings.push({
          id: 'high-phone-bill',
          type: 'warning',
          field: 'estimated_amount',
          message: `Phone bill of $${amount.toLocaleString()} seems high. Did you mean $${Math.min(amount, 500).toLocaleString()}?`,
          suggestion: 'Consider reviewing your phone plan or checking for typos',
          autoFix: () => { if (item.estimated_amount !== undefined) item.estimated_amount = Math.min(amount, 500); },
          severity: 'medium'
        });
      }

      // Employee wages warning
      if (itemName.includes('wage') && amount < 1500) {
        warnings.push({
          id: 'low-wage',
          type: 'warning',
          field: 'estimated_amount',
          message: `Monthly wage of $${amount.toLocaleString()} seems low. Did you mean per hour?`,
          suggestion: 'Consider if this is hourly wage. Monthly wages should typically be $1,500+',
          severity: 'medium'
        });
      }

      // Vehicle costs warning
      if (itemName.includes('vehicle') && amount > 2000) {
        warnings.push({
          id: 'high-vehicle-cost',
          type: 'warning',
          field: 'estimated_amount',
          message: `Vehicle cost of $${amount.toLocaleString()} seems high for monthly expense`,
          suggestion: 'Consider if this is a purchase rather than monthly expense',
          severity: 'medium'
        });
      }

      // Marketing budget check
      if (benchmarks.marketingBudget && itemName.includes('marketing')) {
        const marketingRange = benchmarks.marketingBudget;
        if (amount > marketingRange.max) {
          warnings.push({
            id: 'high-marketing-budget',
            type: 'warning',
            field: 'estimated_amount',
            message: `Marketing budget of $${amount.toLocaleString()} exceeds typical range ($${marketingRange.min.toLocaleString()}-$${marketingRange.max.toLocaleString()})`,
            suggestion: `Consider reducing to $${marketingRange.average.toLocaleString()} or justify the higher spend`,
            severity: 'medium'
          });
        }
      }
    }
  }

  // Validate required fields
  if (!item.name || item.name?.trim() === '') {
    warnings.push({
      id: 'missing-name',
      type: 'error',
      field: 'name',
      message: 'Item name is required',
      severity: 'critical'
    });
  }

  // Check for missing common items
  if (businessType && COMMON_LINE_ITEMS[businessType as keyof typeof COMMON_LINE_ITEMS]) {
    const commonItems = COMMON_LINE_ITEMS[businessType as keyof typeof COMMON_LINE_ITEMS];
    // Note: currentItems would need to be passed as a parameter for this check to work
    const currentItems: BudgetItem[] = []; // This should come from the actual budget items
    
    const missingItems = commonItems.filter(commonItem => 
      !currentItems.some(existingItem => 
        existingItem.name?.toLowerCase().includes(commonItem.toLowerCase())
      )
    );

    if (missingItems.length > 0) {
      suggestions.push({
        id: 'missing-common-items',
        type: 'info',
        field: 'budget',
        message: `Consider adding common ${businessType} expenses: ${missingItems.slice(0, 3).join(', ')}`,
        suggestion: 'These items are commonly included in similar businesses',
        severity: 'low'
      });
    }
  }

  return {
    isValid: warnings.filter(w => w.type === 'error').length === 0,
    warnings,
    suggestions
  };
};

export const validateBudgetSummary = (budget: {
  totalStartupCosts: number;
  totalMonthlyExpenses: number;
  totalMonthlyRevenue: number;
  initialInvestment: number;
}, businessType?: string): ValidationResult => {
  const warnings: ValidationWarning[] = [];
  const suggestions: ValidationWarning[] = [];

  // Check if startup costs exceed initial investment
  if (budget.totalStartupCosts > budget.initialInvestment) {
    const fundingGap = budget.totalStartupCosts - budget.initialInvestment;
    warnings.push({
      id: 'insufficient-funding',
      type: 'error',
      field: 'initial_investment',
      message: `Startup costs ($${budget.totalStartupCosts.toLocaleString()}) exceed initial investment ($${budget.initialInvestment.toLocaleString()}) by $${fundingGap.toLocaleString()}`,
      suggestion: 'Increase initial investment or reduce startup costs',
      severity: 'critical'
    });
  }

  // Check if monthly expenses exceed revenue
  if (budget.totalMonthlyExpenses > budget.totalMonthlyRevenue) {
    const monthlyLoss = budget.totalMonthlyExpenses - budget.totalMonthlyRevenue;
    warnings.push({
      id: 'monthly-loss',
      type: 'warning',
      field: 'budget',
      message: `Monthly expenses ($${budget.totalMonthlyExpenses.toLocaleString()}) exceed revenue ($${budget.totalMonthlyRevenue.toLocaleString()}) by $${monthlyLoss.toLocaleString()}`,
      suggestion: 'Increase revenue projections or reduce monthly expenses',
      severity: 'high'
    });
  }

  // Compare to industry benchmarks
  if (businessType) {
    const benchmarks = INDUSTRY_BENCHMARKS[businessType as keyof typeof INDUSTRY_BENCHMARKS];
    
    if (benchmarks) {
      // Startup costs comparison
      if (budget.totalStartupCosts > benchmarks.startupCosts.max) {
        warnings.push({
          id: 'high-startup-costs',
          type: 'warning',
          field: 'budget',
          message: `Startup costs are ${((budget.totalStartupCosts / benchmarks.startupCosts.average) * 100).toFixed(0)}% above industry average`,
          suggestion: `Consider if all startup costs are necessary. Industry average: $${benchmarks.startupCosts.average.toLocaleString()}`,
          severity: 'medium'
        });
      }

      // Monthly expenses comparison
      if (budget.totalMonthlyExpenses > benchmarks.monthlyExpenses.max) {
        warnings.push({
          id: 'high-monthly-expenses',
          type: 'warning',
          field: 'budget',
          message: `Monthly expenses are ${((budget.totalMonthlyExpenses / benchmarks.monthlyExpenses.average) * 100).toFixed(0)}% above industry average`,
          suggestion: `Review expenses for optimization opportunities. Industry average: $${benchmarks.monthlyExpenses.average.toLocaleString()}`,
          severity: 'medium'
        });
      }
    }
  }

  return {
    isValid: warnings.filter(w => w.type === 'error').length === 0,
    warnings,
    suggestions
  };
};

export const getCompletenessScore = (budget: {
  items: BudgetItem[];
}): number => {
  const totalItems = budget.items.length;
  const itemsWithAmounts = budget.items.filter(item => item.estimated_amount && item.estimated_amount > 0);
  
  // Base score on number of items with amounts
  const itemScore = Math.min((itemsWithAmounts.length / 10) * 100, 100);
  
  // Bonus points for having different categories
  const hasStartup = budget.items.some(item => item.id.startsWith('startup_'));
  const hasRevenue = budget.items.some(item => item.category === 'revenue');
  const hasExpenses = budget.items.some(item => item.category === 'expense');
  
  const categoryBonus = (hasStartup ? 10 : 0) + (hasRevenue ? 10 : 0) + (hasExpenses ? 10 : 0);
  
  return Math.min(itemScore + categoryBonus, 100);
};

export const formatCurrencyForValidation = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
};
