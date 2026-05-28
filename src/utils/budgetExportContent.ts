import type { Budget } from '@/types/apiTypes';

function money(n: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
}

function itemsTable(title: string, items: { name: string; estimated_amount: number; actual_amount?: number; description?: string }[]): string {
  if (!items.length) return `### ${title}\n\n_No items._\n\n`;
  const rows = items.map(
    (i) =>
      `| ${i.name} | ${money(i.estimated_amount)} | ${i.actual_amount != null ? money(i.actual_amount) : '—'} | ${(i.description || '—').replace(/\|/g, '/')} |`,
  );
  return `### ${title}\n\n| Item | Estimated | Actual | Notes |\n| --- | --- | --- | --- |\n${rows.join('\n')}\n\n`;
}

/** Structured markdown for PDF/DOCX export when HTML snapshot is not used. */
export function buildBudgetMarkdownForExport(budget: Budget, businessName?: string): string {
  const name = businessName?.trim() || 'Business Budget';
  const startup = budget.items.filter((i) => i.category === 'startup' || i.id.startsWith('startup_'));
  const revenue = budget.items.filter((i) => i.category === 'revenue');
  const expense = budget.items.filter(
    (i) =>
      i.category === 'expense' &&
      !i.id.startsWith('payroll_') &&
      !i.id.startsWith('cogs_') &&
      !i.id.startsWith('startup_'),
  );

  return [
    `# ${name} — Budget (Year 1)`,
    '',
    `Exported ${new Date().toLocaleDateString()}`,
    '',
    '## Summary',
    '',
    `| Metric | Amount |`,
    `| --- | --- |`,
    `| Initial investment | ${money(budget.initial_investment)} |`,
    `| Total estimated startup costs | ${money(budget.total_estimated_expenses)} |`,
    `| Total estimated revenue | ${money(budget.total_estimated_revenue)} |`,
    `| Total actual expenses | ${money(budget.total_actual_expenses)} |`,
    `| Total actual revenue | ${money(budget.total_actual_revenue)} |`,
    '',
    itemsTable('Startup costs', startup),
    itemsTable('Revenue', revenue),
    itemsTable('Operating expenses', expense),
  ].join('\n');
}
