import type { BusinessContextPayload } from './apiTypes';

/** Core venture fields persisted on session.business_context in the database. */
export interface BusinessContext {
  business_name: string;
  industry: string;
  location: string;
  business_type: string;
  uploaded_plan_mode?: boolean;
}

export const EMPTY_BUSINESS_CONTEXT: BusinessContext = {
  business_name: '',
  industry: '',
  location: '',
  business_type: '',
};

const INVALID_VALUES = new Set([
  '',
  'your business',
  'general business',
  'united states',
  'unsure',
  'none',
  'n/a',
  'not specified',
]);

function cleanField(value: unknown): string {
  if (typeof value !== 'string') return '';
  const trimmed = value.trim();
  if (INVALID_VALUES.has(trimmed.toLowerCase())) return '';
  return trimmed;
}

/** Normalize API / session payload — never inject placeholder defaults. */
export function normalizeBusinessContext(
  raw?: BusinessContextPayload | Record<string, unknown> | null
): BusinessContext {
  if (!raw || typeof raw !== 'object') {
    return { ...EMPTY_BUSINESS_CONTEXT };
  }
  return {
    business_name: cleanField(raw.business_name),
    industry: cleanField(raw.industry),
    location: cleanField(raw.location),
    business_type: cleanField(raw.business_type),
    uploaded_plan_mode: raw.uploaded_plan_mode === true,
  };
}

export function hasMeaningfulBusinessContext(ctx: BusinessContext): boolean {
  return Boolean(ctx.business_name && ctx.industry);
}

export function hasImportedPlan(ctx: Pick<BusinessContext, 'uploaded_plan_mode'>): boolean {
  return ctx.uploaded_plan_mode === true;
}
