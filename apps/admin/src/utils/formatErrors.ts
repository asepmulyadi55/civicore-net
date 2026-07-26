export function formatApiErrors(err: any): Record<string, string> {
  const errors = err.response?.data?.errors;
  if (!errors) return { general: err.response?.data?.message || 'Request failed.' };
  
  const formatted: Record<string, string> = {};
  for (const key in errors) {
    const camelKey = key.charAt(0).toLowerCase() + key.slice(1);
    formatted[camelKey] = Array.isArray(errors[key]) ? errors[key][0] : errors[key];
  }
  return formatted;
}
