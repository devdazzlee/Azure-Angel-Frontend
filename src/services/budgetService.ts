import httpClient from '../api/httpClient';
import type { Budget, BudgetItem, APIResponse, RevenueStreamInitial, RevenueStream } from '../types/apiTypes';

export const budgetService = {
  // Get budget for a session
  getBudget: async (sessionId: string): Promise<APIResponse<Budget>> => {
    const response = await httpClient.get<APIResponse<Budget>>(`/api/sessions/${sessionId}/budget`);
    return response.data;
  },

  // Create or update budget
  saveBudget: async (sessionId: string, budget: Partial<Budget>): Promise<APIResponse<Budget>> => {
    const response = await httpClient.post<APIResponse<Budget>>(`/api/sessions/${sessionId}/budget`, budget);
    return response.data;
  },

  // Update budget item
  updateBudgetItem: async (sessionId: string, itemId: string, updates: Partial<BudgetItem>): Promise<APIResponse<Budget>> => {
    const response = await httpClient.put<APIResponse<Budget>>(`/api/sessions/${sessionId}/budget/items/${itemId}`, updates);
    return response.data;
  },

  // Add budget item
  addBudgetItem: async (sessionId: string, item: Omit<BudgetItem, 'id' | 'created_at' | 'updated_at'>): Promise<APIResponse<Budget>> => {
    const response = await httpClient.post<APIResponse<Budget>>(`/api/sessions/${sessionId}/budget/items`, item);
    return response.data;
  },

  // Delete budget item
  deleteBudgetItem: async (sessionId: string, itemId: string): Promise<APIResponse<Budget>> => {
    const response = await httpClient.delete<APIResponse<Budget>>(`/api/sessions/${sessionId}/budget/items/${itemId}`);
    return response.data;
  },

  // Get budget summary
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

  // Generate estimated expenses from business plan
  generateEstimatedExpenses: async (sessionId: string): Promise<APIResponse<BudgetItem[]>> => {
    const response = await httpClient.post<APIResponse<BudgetItem[]>>(`/api/sessions/${sessionId}/budget/generate-estimates`);
    return response.data;
  },

  // Generate initial revenue streams
  generateInitialRevenueStreams: async (sessionId: string): Promise<APIResponse<RevenueStreamInitial[]>> => {
    const response = await httpClient.get<APIResponse<RevenueStreamInitial[]>>(`/api/sessions/${sessionId}/revenue-streams/generate`);
    return response.data;
  },

  // Save selected revenue streams
  saveRevenueStreams: async (sessionId: string, revenueStreams: RevenueStream[]): Promise<APIResponse<any>> => {
    const response = await httpClient.put<APIResponse<any>>(`/api/sessions/${sessionId}/revenue-streams`, revenueStreams);
    return response.data;
  }
};
