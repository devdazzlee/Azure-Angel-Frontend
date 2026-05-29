/** Normalize API specialties (string, array, or other) into a string list. */
export function normalizeSpecialties(value: unknown): string[] {
  if (value == null || value === '') return [];
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }
  if (typeof value === 'string') {
    return value
      .split(/[,;|]/)
      .map((s) => s.trim())
      .filter(Boolean);
  }
  const single = String(value).trim();
  return single ? [single] : [];
}
