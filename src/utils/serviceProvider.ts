export interface ServiceProviderRow {
  name: string;
  type?: string;
  local?: boolean;
  description?: string;
  specialties?: string | string[];
  estimated_cost?: string;
  contact_method?: string;
  website?: string;
  address?: string;
  rating?: number | string;
  rating_source?: string;
  key_considerations?: string;
  category?: string;
  email?: string;
  phone?: string;
  [key: string]: unknown;
}

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
