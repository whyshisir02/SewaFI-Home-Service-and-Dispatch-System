/**
 * Extracts an array from an API payload that may be shaped in several ways.
 *
 * Resolution order:
 *   1. The payload itself, if it is already an array
 *   2. Each key in `keys`, in the order given (domain-specific, e.g. 'bookings')
 *   3. `payload.data`
 *   4. `payload.items`
 *   5. An empty array
 *
 * @param {unknown} payload - Raw value returned by an API call
 * @param {string[]} [keys] - Domain keys to probe before the generic fallbacks
 * @returns {unknown[]} The resolved array, never null or undefined
 */
export const toArray = (payload, keys = []) => {
  if (Array.isArray(payload)) return payload;

  for (const key of keys) {
    if (Array.isArray(payload?.[key])) return payload[key];
  }

  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.items)) return payload.items;
  return [];
};
