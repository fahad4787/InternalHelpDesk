/**
 * Merge stored JSON preferences onto boolean defaults (dashboard-status path).
 * Mirrors each provider service's resolvePreferences without injecting every service.
 */
export function mergeBooleanPreferences<T extends object>(
  defaults: T,
  value: unknown,
): T {
  if (!value || typeof value !== 'object') {
    return { ...defaults };
  }

  const prefs = value as Record<string, unknown>;
  const result = { ...defaults };

  for (const key of Object.keys(defaults) as Array<keyof T & string>) {
    const raw = prefs[key];
    if (typeof raw === 'boolean') {
      (result as Record<string, unknown>)[key] = raw;
    }
  }

  return result;
}
