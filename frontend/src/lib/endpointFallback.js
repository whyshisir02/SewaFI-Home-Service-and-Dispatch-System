/**
 * Helpers for endpoints that may not exist yet on the backend.
 *
 * Several SewaFi screens probe a list of candidate paths because the API surface
 * is still stabilising. Treating 404/405 as "not implemented" lets the UI degrade
 * gracefully while any real error (401, 500, network) still propagates.
 */

export const isMissingEndpoint = (error) => [404, 405].includes(Number(error?.response?.status));

export const missingEndpointError = (code, message) => {
  const error = new Error(message);
  error.code = code;
  return error;
};

/**
 * Runs each request thunk in order until one succeeds.
 *
 * @param {Array<() => Promise<any>>} requests Candidate requests, highest priority first.
 * @param {object} [options]
 * @param {(result: any) => boolean} [options.accept] Reject an otherwise-successful
 *   result and continue to the next candidate (e.g. a 200 with an unusable body).
 * @param {() => any} [options.onAllMissing] Called when every candidate was missing.
 *   Return a fallback value or throw. Defaults to returning `null`.
 */
export const requestFirstAvailable = async (requests, { accept, onAllMissing } = {}) => {
  for (const request of requests) {
    try {
      const result = await request();
      if (typeof accept === 'function' && !accept(result)) continue;
      return result;
    } catch (error) {
      if (isMissingEndpoint(error)) continue;
      throw error;
    }
  }

  if (typeof onAllMissing === 'function') return onAllMissing();
  return null;
};
