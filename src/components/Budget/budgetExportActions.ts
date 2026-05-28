export type BudgetExportActions = {
  exportPdf: () => Promise<void>;
  exportExcel: () => Promise<void>;
  exportDocx: () => Promise<void>;
};
