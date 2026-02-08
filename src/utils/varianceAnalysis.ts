import type { BudgetItem } from '@/types/apiTypes';

export interface VarianceAnalysis {
  itemId: string;
  itemName: string;
  category: string;
  budgetAmount: number;
  actualAmount: number;
  variance: number;
  variancePercentage: number;
  status: 'over-budget' | 'under-budget' | 'on-track' | 'no-data';
  trend?: 'improving' | 'worsening' | 'stable';
  monthlyAverage?: number;
  isSignificant: boolean;
}

export interface VarianceReport {
  totalBudget: number;
  totalActual: number;
  totalVariance: number;
  totalVariancePercentage: number;
  itemsOverBudget: number;
  itemsUnderBudget: number;
  itemsOnTrack: number;
  mostOverBudgetItem: VarianceAnalysis | null;
  mostUnderBudgetItem: VarianceAnalysis | null;
  categoriesOverBudget: { [category: string]: { totalVariance: number; itemCount: number } };
  categoriesUnderBudget: { [category: string]: { totalVariance: number; itemCount: number } };
  recommendations: string[];
  confidence: 'high' | 'medium' | 'low';
  analyses: VarianceAnalysis[];
}

export const analyzeVariance = (
  budgetItems: BudgetItem[],
  actuals: { [itemId: string]: { amount: number; date: string; notes?: string } }
): VarianceReport => {
  const analyses: VarianceAnalysis[] = [];
  
  // Calculate variance for each item
  budgetItems.forEach(budgetItem => {
    const actual = actuals[budgetItem.id];
    const budgetAmount = Number(budgetItem.estimated_amount) || 0;
    const actualAmount = actual?.amount || 0;
    const variance = actualAmount - budgetAmount;
    const variancePercentage = budgetAmount !== 0 ? (variance / budgetAmount) * 100 : 0;
    
    // Determine status
    let status: VarianceAnalysis['status'];
    if (actualAmount === 0) {
      status = 'no-data';
    } else if (variance > 0) {
      status = 'over-budget';
    } else if (variance < 0) {
      status = 'under-budget';
    } else {
      status = 'on-track';
    }
    
    // Determine if variance is significant (>10% or >$1000)
    const isSignificant = Math.abs(variancePercentage) > 10 || Math.abs(variance) > 1000;
    
    analyses.push({
      itemId: budgetItem.id,
      itemName: budgetItem.name,
      category: budgetItem.category || 'unknown',
      budgetAmount,
      actualAmount,
      variance,
      variancePercentage,
      status,
      isSignificant
    });
  });
  
  // Calculate summary statistics
  const totalBudget = budgetItems.reduce((sum, item) => sum + (Number(item.estimated_amount) || 0), 0);
  const totalActual = Object.values(actuals).reduce((sum, actual) => sum + (Number(actual.amount) || 0), 0);
  const totalVariance = totalActual - totalBudget;
  const totalVariancePercentage = totalBudget !== 0 ? (totalVariance / totalBudget) * 100 : 0;
  
  const itemsOverBudget = analyses.filter(a => a.status === 'over-budget');
  const itemsUnderBudget = analyses.filter(a => a.status === 'under-budget');
  const itemsOnTrack = analyses.filter(a => a.status === 'on-track');
  const itemsWithNoData = analyses.filter(a => a.status === 'no-data');
  
  // Find most significant variances
  const mostOverBudgetItem = itemsOverBudget.length > 0 
    ? itemsOverBudget.reduce((max, item) => Math.abs(item.variance) > Math.abs(max.variance) ? item : max)
    : null;
    
  const mostUnderBudgetItem = itemsUnderBudget.length > 0
    ? itemsUnderBudget.reduce((max, item) => Math.abs(item.variance) > Math.abs(max.variance) ? item : max)
    : null;
  
  // Analyze by category
  const categoriesOverBudget: { [category: string]: { totalVariance: number; itemCount: number } } = {};
  const categoriesUnderBudget: { [category: string]: { totalVariance: number; itemCount: number } } = {};
  
  analyses.forEach(item => {
    if (item.status === 'over-budget') {
      if (!categoriesOverBudget[item.category]) {
        categoriesOverBudget[item.category] = { totalVariance: 0, itemCount: 0 };
      }
      categoriesOverBudget[item.category].totalVariance += item.variance;
      categoriesOverBudget[item.category].itemCount += 1;
    } else if (item.status === 'under-budget') {
      if (!categoriesUnderBudget[item.category]) {
        categoriesUnderBudget[item.category] = { totalVariance: 0, itemCount: 0 };
      }
      categoriesUnderBudget[item.category].totalVariance += Math.abs(item.variance);
      categoriesUnderBudget[item.category].itemCount += 1;
    }
  });
  
  // Generate recommendations
  const recommendations: string[] = [];
  
  if (totalVariancePercentage > 20) {
    recommendations.push('Significant budget variance detected. Review all expense categories for cost reduction opportunities.');
  }
  
  if (itemsOverBudget.length > budgetItems.length * 0.3) {
    recommendations.push('Multiple items over budget. Consider implementing stricter spending controls.');
  }
  
  if (categoriesOverBudget['marketing']?.totalVariance > 0) {
    recommendations.push('Marketing expenses exceed budget. Analyze ROI on marketing campaigns and adjust spend accordingly.');
  }
  
  if (categoriesOverBudget['payroll']?.totalVariance > 0) {
    recommendations.push('Payroll expenses over budget. Review staffing levels and compensation structure.');
  }
  
  if (itemsWithNoData.length > budgetItems.length * 0.5) {
    recommendations.push('Many items lack actual data. Implement regular tracking process for better variance analysis.');
  }
  
  // Determine confidence level
  let confidence: VarianceReport['confidence'];
  if (itemsWithNoData.length > budgetItems.length * 0.5) {
    confidence = 'low';
  } else if (totalVariancePercentage > 15 || itemsOverBudget.length > 3) {
    confidence = 'medium';
  } else {
    confidence = 'high';
  }
  
  return {
    totalBudget,
    totalActual,
    totalVariance,
    totalVariancePercentage,
    itemsOverBudget: itemsOverBudget.length,
    itemsUnderBudget: itemsUnderBudget.length,
    itemsOnTrack: itemsOnTrack.length,
    mostOverBudgetItem,
    mostUnderBudgetItem,
    categoriesOverBudget,
    categoriesUnderBudget,
    recommendations,
    confidence,
    analyses
  };
};

export const formatVarianceCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
};

export const getVarianceTrend = (
  currentAnalyses: VarianceAnalysis[],
  previousAnalyses?: VarianceAnalysis[]
): 'improving' | 'worsening' | 'stable' => {
  if (!previousAnalyses || previousAnalyses.length === 0) {
    return 'stable';
  }
  
  let improvingCount = 0;
  let worseningCount = 0;
  
  currentAnalyses.forEach((current, index) => {
    const previous = previousAnalyses[index];
    if (previous) {
      const currentVariance = Math.abs(current.variancePercentage);
      const previousVariance = Math.abs(previous.variancePercentage);
      
      if (currentVariance < previousVariance) {
        improvingCount++;
      } else if (currentVariance > previousVariance) {
        worseningCount++;
      }
    }
  });
  
  if (improvingCount > worseningCount) {
    return 'improving';
  } else if (worseningCount > improvingCount) {
    return 'worsening';
  } else {
    return 'stable';
  }
};

export const generateVarianceReport = (report: VarianceReport): string => {
  const lines = [
    'BUDGET VARIANCE ANALYSIS REPORT',
    '='.repeat(50),
    '',
    `Generated: ${new Date().toLocaleString()}`,
    '',
    `Total Budget: ${formatVarianceCurrency(report.totalBudget)}`,
    `Total Actual: ${formatVarianceCurrency(report.totalActual)}`,
    `Total Variance: ${formatVarianceCurrency(report.totalVariance)}`,
    `Variance Percentage: ${report.totalVariancePercentage.toFixed(2)}%`,
    '',
    'SUMMARY:',
    `Items Over Budget: ${report.itemsOverBudget}`,
    `Items Under Budget: ${report.itemsUnderBudget}`,
    `Items On Track: ${report.itemsOnTrack}`,
    `Items Without Data: ${report.analyses.filter(a => a.status === 'no-data').length}`,
    '',
    'CATEGORY ANALYSIS:',
    ...Object.entries(report.categoriesOverBudget).map(([category, data]) => 
      `${category}: ${data.totalVariance.toLocaleString()} (${data.itemCount} items)`
    ),
    '',
    'TOP CONCERNS:',
    ...report.recommendations.slice(0, 5).map(rec => `• ${rec}`),
    '',
    `Confidence Level: ${report.confidence.toUpperCase()}`,
    '',
    'MOST SIGNIFICANT VARIANCES:',
    ...(report.mostOverBudgetItem ? [
      `Over Budget: ${report.mostOverBudgetItem.itemName} (${formatVarianceCurrency(report.mostOverBudgetItem.variance)})`
    ] : []),
    ...(report.mostUnderBudgetItem ? [
      `Under Budget: ${report.mostUnderBudgetItem.itemName} (${formatVarianceCurrency(Math.abs(report.mostUnderBudgetItem.variance))})`
    ] : [])
  ];
  
  return lines.join('\n');
};
