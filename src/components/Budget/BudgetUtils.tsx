import { useState, useEffect } from 'react';
import type { BudgetItem, Budget, APIResponse } from '@/types/apiTypes';
import { toast } from 'react-toastify';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

// Utility Functions
export const debounce = <T extends (...args: any[]) => void>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

export const formatCurrency = (value: number | null | undefined, currency: string = '$') => {
  const safeValue = Number(value) || 0;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(safeValue);
};

// Budget Validation Hook
export const useBudgetValidation = (
  monthlyNetIncome: number,
  remainingStartupFunds: number,
  breakEven: any,
  startupCostItems: BudgetItem[],
  currency: string
) => {
  const [warnings, setWarnings] = useState<Array<{
    id: string;
    type: 'warning' | 'error' | 'info';
    message: string;
    itemId?: string;
  }>>([]);
  
  useEffect(() => {
    const newWarnings = [];
    
    // Check if monthly costs exceed revenue
    if (monthlyNetIncome < 0) {
      newWarnings.push({
        id: 'negative-net',
        type: 'error',
        message: '⚠️ Your monthly costs exceed revenue. Your business will lose money each month.'
      });
    }
    
    // Check startup funding gap
    if (remainingStartupFunds < 0) {
      newWarnings.push({
        id: 'funding-gap',
        type: 'warning',
        message: `💰 You need an additional ${formatCurrency(Math.abs(remainingStartupFunds), currency)} in funding to cover startup costs.` 
      });
    }
    
    // Check break-even timeline
    if (breakEven.status === 'months' && breakEven.months && breakEven.months > 24) {
      newWarnings.push({
        id: 'long-breakeven',
        type: 'info',
        message: `⏱️ Your break-even timeline (${breakEven.months} months) is quite long. Ensure you have adequate funding runway.` 
      });
    }
    
    // Check for unrealistic values
    startupCostItems.forEach(item => {
      if (item.estimated_amount > 100000 && item.name.includes('phone')) {
        newWarnings.push({
          id: `high-${item.id}`,
          type: 'warning',
          message: `❓ ${formatCurrency(item.estimated_amount, currency)} for "${item.name}" seems unusually high. Please verify.`,
          itemId: item.id
        });
      }
    });
    
    setWarnings(newWarnings);
  }, [monthlyNetIncome, remainingStartupFunds, breakEven, startupCostItems, currency]);
  
  return warnings;
};

// Auto Save Indicator Hook
export const useAutoSaveIndicator = (saveStatus: 'idle' | 'saving' | 'saved' | 'error') => {
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  
  useEffect(() => {
    if (saveStatus === 'saved') {
      setLastSaved(new Date());
    }
  }, [saveStatus]);
  
  return { lastSaved };
};

// Smart Step Calculator
export const getSmartStepForInitialInvestment = (currentValue: number): number => {
  if (currentValue < 1000) return 100;
  if (currentValue < 10000) return 1000;
  if (currentValue < 100000) return 5000;
  return 10000;
};

// Expense Group Classifier
export const classifyExpenseGroup = (item: BudgetItem): string => {
  const name = item.name.toLowerCase();
  
  if (name.includes('rent') || name.includes('lease') || name.includes('office') || 
      name.includes('utilities') || name.includes('software') || name.includes('subscription') ||
      name.includes('marketing') || name.includes('advertising') || name.includes('insurance')) {
    return 'operating';
  }
  
  if (name.includes('salary') || name.includes('payroll') || name.includes('wage') || 
      name.includes('contractor') || name.includes('freelance') || name.includes('benefits') ||
      name.includes('tax') || name.includes('employment')) {
    return 'payroll';
  }
  
  if (name.includes('cost') || name.includes('cogs') || name.includes('inventory') || 
      name.includes('material') || name.includes('production') || name.includes('shipping') ||
      name.includes('packaging')) {
    return 'cogs';
  }
  
  return 'startup';
};

// PDF Export Utility
export const handleExportPdf = async (elementId: string, businessName?: string) => {
  try {
    const element = document.getElementById(elementId);
    if (!element) {
      toast.error('Could not find dashboard content to export');
      return;
    }

    toast.loading('Generating PDF...', { toastId: 'pdf-export' });

    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff'
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    
    const imgWidth = 210;
    const pageHeight = 295;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    const filename = businessName 
      ? `${businessName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_budget_${new Date().toISOString().split('T')[0]}.pdf`
      : `budget_${new Date().toISOString().split('T')[0]}.pdf`;

    pdf.save(filename);
    toast.dismiss('pdf-export');
    toast.success('PDF exported successfully!', { toastId: 'pdf-export-success' });
  } catch (error) {
    console.error('Error generating PDF:', error);
    toast.dismiss('pdf-export');
    toast.error('Failed to generate PDF. Please try again.', { toastId: 'pdf-export-error' });
  }
};

// Excel Export Utility
export const handleExportExcel = async (
  budget: Budget,
  startupCostItems: BudgetItem[],
  operatingExpenseItems: BudgetItem[],
  dynamicRevenueStreams: any[],
  businessContext?: any,
  currency: string = '$'
) => {
  try {
    const XLSX = await import('xlsx');
    
    const wb = XLSX.utils.book_new();
    
    // Summary Sheet
    const summaryData = [
      ['Budget Summary'],
      [''],
      ['Initial Investment', formatCurrency(budget.initial_investment, currency)],
      ['Total Startup Costs', formatCurrency(startupCostItems.reduce((sum, item) => sum + item.estimated_amount, 0), currency)],
      ['Monthly Revenue', formatCurrency(dynamicRevenueStreams.reduce((sum, stream) => sum + stream.revenueProjection, 0), currency)],
      ['Monthly Costs', formatCurrency(
        operatingExpenseItems.reduce((sum, item) => sum + item.estimated_amount, 0),
        currency
      )],
    ];
    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, summarySheet, 'Summary');
    
    // Generate filename
    const businessName = businessContext?.business_name || 'Business';
    const filename = `${businessName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_budget_${new Date().toISOString().split('T')[0]}.xlsx`;
    
    // Save file
    XLSX.writeFile(wb, filename);
    toast.success('Excel file exported successfully!');
  } catch (error) {
    console.error('Error exporting to Excel:', error);
    toast.error('Failed to export Excel file');
  }
};
