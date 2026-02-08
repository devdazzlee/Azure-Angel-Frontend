import * as XLSX from 'xlsx';
import type { Budget, BudgetItem } from '@/types/apiTypes';

interface ExcelExportData {
  summary: {
    businessName?: string;
    date: string;
    initialInvestment: number;
    totalStartupCosts: number;
    monthlyRevenue: number;
    totalExpenses: number;
    monthlyNetIncome: number;
    breakEvenPoint: number;
  };
  startupCosts: BudgetItem[];
  revenue: BudgetItem[];
  operatingExpenses: BudgetItem[];
  payroll: BudgetItem[];
  cogs: BudgetItem[];
}

interface ExcelSheetConfig {
  name: string;
  data: any[][];
  header?: string[];
  columnWidths?: number[];
  styles?: any;
}

const formatCurrencyForExcel = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
};

const setSheetColumnWidths = (ws: XLSX.WorkSheet, widths: number[]): void => {
  ws['!cols'] = widths.map(wch => ({ wch }));
};

const createSummarySheet = (data: ExcelExportData['summary']): XLSX.WorkSheet => {
  const fundingStatus = data.initialInvestment >= data.totalStartupCosts ? 'Sufficient' : 'Needs Additional Funding';
  const fundingGap = Math.abs(data.initialInvestment - data.totalStartupCosts);

  const summaryData: (string | number)[][] = [
    ['Business Budget Summary', '', '', ''],
    ['Business Name', data.businessName || 'Business Name', 'Date', data.date],
    ['Initial Investment', formatCurrencyForExcel(data.initialInvestment), 'Total Startup Costs', formatCurrencyForExcel(data.totalStartupCosts)],
    ['Monthly Revenue', formatCurrencyForExcel(data.monthlyRevenue), 'Total Monthly Expenses', formatCurrencyForExcel(data.totalExpenses)],
    ['Monthly Net Income', formatCurrencyForExcel(data.monthlyNetIncome), 'Break-Even Point', formatCurrencyForExcel(data.breakEvenPoint)],
    ['Funding Status', fundingStatus, 'Funding Gap', formatCurrencyForExcel(fundingGap)]
  ];

  return XLSX.utils.aoa_to_sheet(summaryData);
};

const createBudgetItemsSheet = (
  title: string,
  items: BudgetItem[],
  itemType: string
): XLSX.WorkSheet => {
  const headers = [
    'Item Name',
    'Description',
    'Estimated Amount',
    'Actual Amount',
    'Variance',
    'Category',
    'Is Custom'
  ];

  const itemsData = items.map(item => [
    item.name || '',
    item.description || '',
    item.estimated_amount || 0,
    item.actual_amount || 0,
    item.actual_amount ? (item.actual_amount - item.estimated_amount) : 0,
    item.category || '',
    item.is_custom ? 'Yes' : 'No'
  ]);

  const sheetData = [headers, ...itemsData];

  return XLSX.utils.aoa_to_sheet(sheetData);
};

const createStyledWorkbook = (data: ExcelExportData): XLSX.WorkBook => {
  const wb = XLSX.utils.book_new();

  // Create summary sheet
  const summarySheet = createSummarySheet(data.summary);
  setSheetColumnWidths(summarySheet, [22, 28, 22, 28]);
  XLSX.utils.book_append_sheet(wb, summarySheet);

  // Create startup costs sheet
  if (data.startupCosts.length > 0) {
    const startupSheet = createBudgetItemsSheet('Startup Costs', data.startupCosts, 'Startup');
    setSheetColumnWidths(startupSheet, [28, 34, 18, 18, 14, 14, 10]);
    XLSX.utils.book_append_sheet(wb, startupSheet);
  }

  // Create revenue sheet
  if (data.revenue.length > 0) {
    const revenueSheet = createBudgetItemsSheet('Revenue', data.revenue, 'Revenue');
    setSheetColumnWidths(revenueSheet, [28, 34, 18, 18, 14, 14, 10]);
    XLSX.utils.book_append_sheet(wb, revenueSheet);
  }

  // Create operating expenses sheet
  if (data.operatingExpenses.length > 0) {
    const operatingSheet = createBudgetItemsSheet('Operating Expenses', data.operatingExpenses, 'Operating');
    setSheetColumnWidths(operatingSheet, [28, 34, 18, 18, 14, 14, 10]);
    XLSX.utils.book_append_sheet(wb, operatingSheet);
  }

  // Create payroll sheet
  if (data.payroll.length > 0) {
    const payrollSheet = createBudgetItemsSheet('Payroll', data.payroll, 'Payroll');
    setSheetColumnWidths(payrollSheet, [28, 34, 18, 18, 14, 14, 10]);
    XLSX.utils.book_append_sheet(wb, payrollSheet);
  }

  // Create COGS sheet
  if (data.cogs.length > 0) {
    const cogsSheet = createBudgetItemsSheet('Cost of Goods Sold', data.cogs, 'COGS');
    setSheetColumnWidths(cogsSheet, [28, 34, 18, 18, 14, 14, 10]);
    XLSX.utils.book_append_sheet(wb, cogsSheet);
  }

  return wb;
};

const generateFileName = (businessName?: string): string => {
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0].replace(/-/g, '');
  const sanitizedName = (businessName || 'Business').replace(/[^a-zA-Z0-9]/g, '_');
  
  return `${sanitizedName}_Budget_${dateStr}.xlsx`;
};

export const exportBudgetToExcel = (budget: Budget, businessName?: string): void => {
  try {
    // Prepare data for export
    const startupCosts = budget.items.filter(item => item.id.startsWith('startup_'));
    const revenue = budget.items.filter(item => item.category === 'revenue');
    const operatingExpenses = budget.items.filter(item => 
      item.category === 'expense' && 
      !item.id.startsWith('startup_') && 
      !item.id.startsWith('payroll_') && 
      !item.id.startsWith('cogs_')
    );
    const payroll = budget.items.filter(item => item.id.startsWith('payroll_'));
    const cogs = budget.items.filter(item => item.id.startsWith('cogs_'));

    const monthlyRevenueTotal = revenue.reduce((sum, item) => sum + (Number(item.estimated_amount) || 0), 0);
    const monthlyExpensesTotal = operatingExpenses.reduce((sum, item) => sum + (Number(item.estimated_amount) || 0), 0);
    const monthlyPayrollTotal = payroll.reduce((sum, item) => sum + (Number(item.estimated_amount) || 0), 0);
    const monthlyCOGSTotal = cogs.reduce((sum, item) => sum + (Number(item.estimated_amount) || 0), 0);
    const totalMonthlyExpenses = monthlyExpensesTotal + monthlyPayrollTotal + monthlyCOGSTotal;
    const monthlyNetIncome = monthlyRevenueTotal - totalMonthlyExpenses;

    // Calculate break-even point
    const breakEvenPoint = totalMonthlyExpenses > 0 ? totalMonthlyExpenses : 0;

    const exportData: ExcelExportData = {
      summary: {
        businessName,
        date: new Date().toLocaleDateString(),
        initialInvestment: budget.initial_investment,
        totalStartupCosts: startupCosts.reduce((sum, item) => sum + (Number(item.estimated_amount) || 0), 0),
        monthlyRevenue: monthlyRevenueTotal,
        totalExpenses: totalMonthlyExpenses,
        monthlyNetIncome,
        breakEvenPoint
      },
      startupCosts,
      revenue,
      operatingExpenses,
      payroll,
      cogs
    };

    // Create workbook
    const wb = createStyledWorkbook(exportData);

    // Generate file and download
    const fileName = generateFileName(businessName);
    XLSX.writeFile(wb, fileName);

    console.log(`Budget exported to ${fileName}`);
  } catch (error) {
    console.error('Error exporting budget to Excel:', error);
    throw error;
  }
};
