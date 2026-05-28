import { fetchBusinessContext } from './authService';
import {
  normalizeBusinessContext,
  type BusinessContext,
} from '../types/businessContext';

export type BusinessContextFetchResult = {
  context: BusinessContext;
  source: string;
  updated: boolean;
};

/** Load authoritative business context for a session from the backend. */
export async function loadBusinessContextForSession(
  sessionId: string
): Promise<BusinessContextFetchResult> {
  const response = await fetchBusinessContext(sessionId);
  return {
    context: normalizeBusinessContext(response.result?.business_context),
    source: response.result?.source ?? 'unknown',
    updated: response.result?.updated ?? false,
  };
}
