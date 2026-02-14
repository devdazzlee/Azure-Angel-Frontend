import httpClient from '../api/httpClient';
import type { Budget, BudgetItem, APIResponse, RevenueStreamInitial, RevenueStream } from '../types/apiTypes';

export const budgetService = {
  // ── READ ──────────────────────────────────────────────────────────────────

  /** Get full budget (header + items) for a session */
  getBudget: async (sessionId: string): Promise<APIResponse<Budget>> => {
    const response = await httpClient.get<APIResponse<Budget>>(`/api/sessions/${sessionId}/budget`);
    return response.data;
  },

  /** Get budget summary statistics */
  getBudgetSummary: async (sessionId: string): Promise<APIResponse<{
    total_estimated: number;
    total_actual: number;
    estimated_expenses: number;
    estimated_revenue: number;
    actual_expenses: number;
    actual_revenue: number;
    variance: number;
  }>> => {
    const response = await httpClient.get<APIResponse<any>>(`/api/sessions/${sessionId}/budget/summary`);
    return response.data;
  },

  /** Get saved revenue streams from DB */
  getRevenueStreams: async (sessionId: string): Promise<APIResponse<BudgetItem[]>> => {
    const response = await httpClient.get<APIResponse<BudgetItem[]>>(`/api/sessions/${sessionId}/revenue-streams`);
    return response.data;
  },

  // ── CREATE / FULL SAVE ─────────────────────────────────────────────────────

  /** Create or fully replace budget (header + all items) */
  saveBudget: async (sessionId: string, budget: Partial<Budget>): Promise<APIResponse<Budget>> => {
    const response = await httpClient.post<APIResponse<Budget>>(`/api/sessions/${sessionId}/budget`, budget);
    return response.data;
  },

  // ── ITEM CRUD ──────────────────────────────────────────────────────────────

  /** Add a single new budget item */
  addBudgetItem: async (sessionId: string, item: Omit<BudgetItem, 'id' | 'created_at' | 'updated_at'>): Promise<APIResponse<Budget>> => {
    const response = await httpClient.post<APIResponse<Budget>>(`/api/sessions/${sessionId}/budget/items`, item);
    return response.data;
  },

  /** Update a single budget item by id */
  updateBudgetItem: async (sessionId: string, itemId: string, updates: Partial<BudgetItem>): Promise<APIResponse<Budget>> => {
    const response = await httpClient.put<APIResponse<Budget>>(`/api/sessions/${sessionId}/budget/items/${itemId}`, updates);
    return response.data;
  },

  /** Delete a single budget item by id */
  deleteBudgetItem: async (sessionId: string, itemId: string): Promise<APIResponse<Budget>> => {
    const response = await httpClient.delete<APIResponse<Budget>>(`/api/sessions/${sessionId}/budget/items/${itemId}`);
    return response.data;
  },

  // ── BUDGET HEADER ──────────────────────────────────────────────────────────

  /** Update just the budget header (e.g. initial_investment) */
  updateBudgetHeader: async (sessionId: string, updates: { initial_investment?: number }): Promise<APIResponse<Budget>> => {
    const response = await httpClient.patch<APIResponse<Budget>>(`/api/sessions/${sessionId}/budget`, updates);
    return response.data;
  },

  // ── REVENUE STREAMS ────────────────────────────────────────────────────────

  /** Save (upsert) revenue streams */
  saveRevenueStreams: async (sessionId: string, revenueStreams: RevenueStream[]): Promise<APIResponse<any>> => {
    const response = await httpClient.put<APIResponse<any>>(`/api/sessions/${sessionId}/revenue-streams`, revenueStreams);
    return response.data;
  },

  // ── AI GENERATION ──────────────────────────────────────────────────────────

  /** Generate estimated expenses from business plan (AI) */
  generateEstimatedExpenses: async (sessionId: string): Promise<APIResponse<BudgetItem[]>> => {
    const response = await httpClient.post<APIResponse<BudgetItem[]>>(`/api/sessions/${sessionId}/budget/generate-estimates`);
    return response.data;
  },

  /** Generate initial revenue streams (AI) */
  generateInitialRevenueStreams: async (sessionId: string): Promise<APIResponse<RevenueStreamInitial[]>> => {
    const response = await httpClient.get<APIResponse<RevenueStreamInitial[]>>(`/api/sessions/${sessionId}/revenue-streams/generate`);
    return response.data;
  },
};
