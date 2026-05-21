import { api, unwrapResponse } from '../../../lib/axios';

const isMissingEndpoint = (error) => [404, 405].includes(error?.response?.status);

const toArray = (payload, keys = []) => {
  if (Array.isArray(payload)) return payload;

  for (const key of keys) {
    if (Array.isArray(payload?.[key])) return payload[key];
  }

  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.items)) return payload.items;
  return [];
};

const createUnsupportedError = () => {
  const error = new Error('Provider profile endpoint is not available');
  error.code = 'PROVIDER_PROFILE_ENDPOINT_UNAVAILABLE';
  return error;
};

const createNotFoundError = () => {
  const error = new Error('Provider not found');
  error.status = 404;
  return error;
};

const matchesProviderId = (provider, id) => {
  const candidateValues = [
    provider?.id,
    provider?.userId,
    provider?.slug,
    provider?.user?.id,
    provider?.user?.slug,
    provider?.provider?.id,
  ]
    .filter(Boolean)
    .map(String);

  return candidateValues.includes(String(id));
};

const normalizeProviderPayload = (payload, id) => {
  if (!payload) return null;

  if (matchesProviderId(payload, id)) return payload;
  if (payload?.provider && matchesProviderId(payload.provider, id)) return payload.provider;
  if (payload?.item && matchesProviderId(payload.item, id)) return payload.item;

  const fromProviders = toArray(payload, ['providers']).find((provider) => matchesProviderId(provider, id));
  if (fromProviders) return fromProviders;

  const fromProfiles = toArray(payload, ['profiles']).find((provider) => matchesProviderId(provider, id));
  if (fromProfiles) return fromProfiles;

  if (payload?.user && payload?.providerProfile) {
    const merged = {
      ...payload.providerProfile,
      user: payload.user,
    };

    if (matchesProviderId(merged, id)) return merged;
  }

  return null;
};

const requestFirstAvailableProfileEndpoint = async (id) => {
  const endpoints = [`/providers/${id}`, `/providers/public/${id}`, `/providers/slug/${id}`];

  for (const endpoint of endpoints) {
    try {
      const payload = await api.get(endpoint).then(unwrapResponse);
      const normalized = normalizeProviderPayload(payload, id);
      if (normalized) return normalized;
    } catch (error) {
      if (isMissingEndpoint(error)) continue;
      throw error;
    }
  }

  return null;
};

const requestProviderFromListFallback = async (id) => {
  try {
    const payload = await api.get('/services/providers').then(unwrapResponse);
    const providers = toArray(payload, ['providers']);
    return {
      provider: providers.find((provider) => matchesProviderId(provider, id)) || null,
      missingEndpoint: false,
    };
  } catch (error) {
    if (isMissingEndpoint(error)) {
      return {
        provider: null,
        missingEndpoint: true,
      };
    }
    throw error;
  }
};

export const providerPublicApi = {
  profile: async (id) => {
    const fromDirectEndpoint = await requestFirstAvailableProfileEndpoint(id);
    if (fromDirectEndpoint) return fromDirectEndpoint;

    const fromListFallback = await requestProviderFromListFallback(id);
    if (fromListFallback.provider) return fromListFallback.provider;
    if (fromListFallback.missingEndpoint) throw createUnsupportedError();
    throw createNotFoundError();
  },
};

export default providerPublicApi;
