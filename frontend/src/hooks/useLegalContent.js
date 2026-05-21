import { useQuery } from '@tanstack/react-query';
import { api, unwrapResponse } from '../lib/axios';

const LEGAL_ENDPOINTS = {
  terms: ['/public/legal/terms'],
  privacy: ['/public/legal/privacy'],
};

const SITE_SETTINGS_ENDPOINTS = ['/public/site-settings', '/public/contact-info'];

const tryGet = async (endpoints) => {
  for (const endpoint of endpoints) {
    try {
      const response = await api.get(endpoint);
      return unwrapResponse(response);
    } catch (error) {
      if (error?.response?.status === 404) continue;
      throw error;
    }
  }

  return null;
};

const normalizeLegalPayload = (payload) => {
  if (!payload) return null;
  if (typeof payload === 'string') return { content: payload };
  return {
    content: payload.content || payload.body || payload.markdown || payload.text || null,
    title: payload.title || null,
    lastUpdated: payload.lastUpdated || payload.updatedAt || null,
  };
};

export const useLegalContent = (type) =>
  useQuery({
    queryKey: ['legal-content', type],
    queryFn: async () => {
      const payload = await tryGet(LEGAL_ENDPOINTS[type] || []);
      // TODO: Replace fallback draft content with backend/CMS-managed reviewed policy.
      return normalizeLegalPayload(payload);
    },
    retry: 1,
    staleTime: 5 * 60_000,
  });

export const usePublicSiteSettings = () =>
  useQuery({
    queryKey: ['legal-site-settings'],
    queryFn: async () => {
      const payload = await tryGet(SITE_SETTINGS_ENDPOINTS);
      return payload && typeof payload === 'object' ? payload : {};
    },
    retry: 1,
    staleTime: 5 * 60_000,
  });

