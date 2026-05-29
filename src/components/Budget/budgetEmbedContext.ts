import { createContext, useContext } from 'react';

/** True when BudgetDashboard is embedded inside another page (e.g. Implementation tab). */
export const BudgetEmbedContext = createContext(false);

export function useBudgetEmbed(): boolean {
  return useContext(BudgetEmbedContext);
}
