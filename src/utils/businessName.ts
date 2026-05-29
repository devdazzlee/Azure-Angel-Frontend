/**
 * Display guard only — authoritative extraction runs on the backend
 * (BP.05 tagged answer → structured LLM → validator → DB).
 * Never use this to "guess" a name from free text on the client.
 */

const INVALID = new Set([
  '',
  'your business',
  'general business',
  'unsure',
  'none',
  'n/a',
  'not specified',
]);

const NARRATIVE =
  /\b(represents|focused|falls\s+under|industry|because|which|that)\b/i;

export function isValidBusinessNameForDisplay(value: string | undefined | null): boolean {
  const name = (value ?? '').trim();
  if (!name || INVALID.has(name.toLowerCase())) return false;
  if (name.length > 60 || name.split(/\s+/).length > 6) return false;
  if (NARRATIVE.test(name) || name.includes('?') || name.includes('.')) return false;
  return true;
}

/** Pass through API value when valid; otherwise empty (do not parse paragraphs client-side). */
export function displayBusinessNameFromApi(value: string | undefined | null): string {
  return isValidBusinessNameForDisplay(value) ? (value ?? '').trim() : '';
}
