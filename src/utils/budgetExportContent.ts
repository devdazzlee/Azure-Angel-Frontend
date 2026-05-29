import type { Budget, BudgetItem } from '@/types/apiTypes';

export type BudgetRevenueStreamExport = {
  name: string;
  estimatedPrice: number;
  estimatedVolume: number;
  revenueProjection: number;
  isSelected?: boolean;
};

export type BudgetExportSummary = {
  initialInvestment: number;
  startupCostsTotal: number;
  startupActualTotal: number;
  remainingStartupFunds: number;
  monthlyRevenue: number;
  monthlyOperatingCosts: number;
  monthlyNetIncome: number;
  breakEvenLabel: string;
  revenue24: number;
  costs24: number;
  net24: number;
};

export interface BudgetExportData {
  budget: Budget;
  businessName?: string;
  startupItems: BudgetItem[];
  operatingItems: BudgetItem[];
  otherItems?: BudgetItem[];
  revenueStreams: BudgetRevenueStreamExport[];
  summary: BudgetExportSummary;
  currency?: string;
}

function money(n: number, currency = '$'): string {
  const value = Number.isFinite(n) ? n : 0;
  if (currency === '$') {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
  }
  return `${currency}${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function escCell(text: string): string {
  return (text || '—').replace(/\|/g, '/').replace(/\n/g, ' ').trim();
}

function expenseTable(
  title: string,
  items: BudgetItem[],
  currency: string,
): string {
  if (!items.length) {
    return `## ${title}\n\n_No line items recorded._\n\n`;
  }

  const rows = items.map((i) => {
    const est = money(i.estimated_amount ?? 0, currency);
    const act =
      i.actual_amount != null && i.actual_amount !== undefined
        ? money(i.actual_amount, currency)
        : '—';
    const variance = money((i.estimated_amount ?? 0) - (i.actual_amount ?? 0), currency);
    return `| ${escCell(i.name)} | ${est} | ${act} | ${variance} | ${escCell(i.description || '')} |`;
  });

  const totalEst = items.reduce((s, i) => s + (i.estimated_amount ?? 0), 0);
  const totalAct = items.reduce((s, i) => s + (i.actual_amount ?? 0), 0);

  return [
    `## ${title}`,
    '',
    '| Line item | Estimated | Actual | Variance | Notes |',
    '| --- | ---: | ---: | ---: | --- |',
    ...rows,
    `| **Total** | **${money(totalEst, currency)}** | **${money(totalAct, currency)}** | **${money(totalEst - totalAct, currency)}** | |`,
    '',
  ].join('\n');
}

function revenueTable(streams: BudgetRevenueStreamExport[], currency: string): string {
  const active = streams.filter((s) => s.isSelected !== false);
  if (!active.length) {
    return `## Monthly revenue\n\n_No revenue streams recorded._\n\n`;
  }

  const rows = active.map(
    (s) =>
      `| ${escCell(s.name)} | ${money(s.estimatedPrice, currency)} | ${s.estimatedVolume.toLocaleString()} | ${money(s.revenueProjection, currency)} |`,
  );
  const total = active.reduce((sum, s) => sum + (s.revenueProjection ?? 0), 0);

  return [
    '## Monthly revenue',
    '',
    '| Revenue stream | Unit price | Monthly volume | Projected revenue |',
    '| --- | ---: | ---: | ---: |',
    ...rows,
    `| **Total monthly revenue** | | | **${money(total, currency)}** |`,
    '',
  ].join('\n');
}

/** Structured markdown for professional PDF/DOCX budget export. */
export function buildBudgetMarkdownForExport(data: BudgetExportData): string {
  const currency = data.currency ?? '$';
  const { summary } = data;
  const other = data.otherItems ?? [];

  const sections = [
    '## Executive summary',
    '',
    '| Metric | Value |',
    '| --- | ---: |',
    `| Initial investment | ${money(summary.initialInvestment, currency)} |`,
    `| Total startup costs (estimated) | ${money(summary.startupCostsTotal, currency)} |`,
    `| Startup costs (actual to date) | ${money(summary.startupActualTotal, currency)} |`,
    `| Remaining startup funds | ${money(summary.remainingStartupFunds, currency)} |`,
    `| Monthly revenue (projected) | ${money(summary.monthlyRevenue, currency)} |`,
    `| Monthly operating costs | ${money(summary.monthlyOperatingCosts, currency)} |`,
    `| Monthly net income | ${money(summary.monthlyNetIncome, currency)} |`,
    `| Break-even | ${summary.breakEvenLabel} |`,
    '',
    '## 24-month outlook',
    '',
    '| Metric | Value |',
    '| --- | ---: |',
    `| Projected revenue (24 mo) | ${money(summary.revenue24, currency)} |`,
    `| Projected operating costs (24 mo) | ${money(summary.costs24, currency)} |`,
    `| Projected net (24 mo, before startup) | ${money(summary.net24, currency)} |`,
    '',
    expenseTable('Startup costs (one-time)', [...data.startupItems, ...other], currency),
    revenueTable(data.revenueStreams, currency),
    expenseTable('Monthly operating expenses', data.operatingItems, currency),
    '---',
    '',
    '_Prepared with Angel Business Assistant. Figures reflect your saved budget at export time._',
    '',
  ];

  return sections.join('\n');
}

/** @deprecated Use BudgetExportData object — kept for simple call sites */
export function buildBudgetMarkdownFromBudgetOnly(budget: Budget, businessName?: string): string {
  const startup = budget.items.filter(
    (i) => i.subcategory === 'startup_cost' || i.id.startsWith('startup_'),
  );
  const revenue = budget.items.filter((i) => i.category === 'revenue');
  const operating = budget.items.filter(
    (i) =>
      i.category === 'expense' &&
      !i.id.startsWith('payroll_') &&
      !i.id.startsWith('cogs_') &&
      !i.id.startsWith('startup_'),
  );

  return buildBudgetMarkdownForExport({
    budget,
    businessName,
    startupItems: startup,
    operatingItems: operating,
    revenueStreams: revenue.map((r) => ({
      name: r.name,
      estimatedPrice: r.estimated_price ?? r.estimated_amount ?? 0,
      estimatedVolume: r.estimated_volume ?? 1,
      revenueProjection: r.estimated_amount ?? 0,
      isSelected: true,
    })),
    summary: {
      initialInvestment: budget.initial_investment ?? 0,
      startupCostsTotal: budget.total_estimated_expenses ?? 0,
      startupActualTotal: budget.total_actual_expenses ?? 0,
      remainingStartupFunds:
        (budget.initial_investment ?? 0) - (budget.total_estimated_expenses ?? 0),
      monthlyRevenue: budget.total_estimated_revenue ?? 0,
      monthlyOperatingCosts: 0,
      monthlyNetIncome: 0,
      breakEvenLabel: 'See full dashboard for analysis',
      revenue24: (budget.total_estimated_revenue ?? 0) * 24,
      costs24: 0,
      net24: 0,
    },
  });
}
