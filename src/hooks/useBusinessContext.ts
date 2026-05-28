import { useCallback, useEffect, useState } from 'react';
import { loadBusinessContextForSession } from '../services/businessContextService';
import {
  EMPTY_BUSINESS_CONTEXT,
  hasImportedPlan,
  hasMeaningfulBusinessContext,
  normalizeBusinessContext,
  type BusinessContext,
} from '../types/businessContext';
import type { BusinessContextPayload } from '../types/apiTypes';

export type UseBusinessContextOptions = {
  /** When false, skips the initial fetch (e.g. missing session id). */
  enabled?: boolean;
  /** Hydrate synchronously from session list metadata before the API round-trip. */
  seedFromSession?: BusinessContextPayload | Record<string, unknown> | null;
};

export type UseBusinessContextResult = {
  context: BusinessContext;
  loading: boolean;
  error: Error | null;
  source: string | null;
  /** True when name + industry are present (from DB). */
  isReady: boolean;
  hasImportedPlan: boolean;
  refresh: () => Promise<BusinessContext>;
  /** Merge partial context after local session metadata is available. */
  seed: (partial: BusinessContextPayload | Record<string, unknown> | null) => void;
};

/**
 * Single source of truth for venture business context — always loaded from
 * GET /angel/sessions/:id/business-context (backed by session.business_context in DB).
 */
export function useBusinessContext(
  sessionId: string | undefined,
  options: UseBusinessContextOptions = {}
): UseBusinessContextResult {
  const { enabled = true, seedFromSession } = options;

  const [context, setContext] = useState<BusinessContext>(() =>
    seedFromSession ? normalizeBusinessContext(seedFromSession) : { ...EMPTY_BUSINESS_CONTEXT }
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [source, setSource] = useState<string | null>(null);

  const seed = useCallback((partial: BusinessContextPayload | Record<string, unknown> | null) => {
    setContext(normalizeBusinessContext(partial));
  }, []);

  const refresh = useCallback(async (): Promise<BusinessContext> => {
    if (!sessionId) {
      return { ...EMPTY_BUSINESS_CONTEXT };
    }
    setLoading(true);
    setError(null);
    try {
      const result = await loadBusinessContextForSession(sessionId);
      setContext(result.context);
      setSource(result.source);
      return result.context;
    } catch (err) {
      const normalized = err instanceof Error ? err : new Error('Failed to load business context');
      setError(normalized);
      throw normalized;
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    if (!enabled || !sessionId) return;
    void refresh();
  }, [enabled, sessionId, refresh]);

  useEffect(() => {
    if (seedFromSession) {
      seed(seedFromSession);
    }
  }, [seedFromSession, seed]);

  return {
    context,
    loading,
    error,
    source,
    isReady: hasMeaningfulBusinessContext(context),
    hasImportedPlan: hasImportedPlan(context),
    refresh,
    seed,
  };
}
