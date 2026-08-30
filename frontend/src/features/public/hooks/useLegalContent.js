import { useQuery } from '@tanstack/react-query';
import { publicApi } from '../api/public.api';

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
      const payload = await publicApi.legal(type);
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
      const payload = await publicApi.siteSettingsOrContactInfo();
      return payload && typeof payload === 'object' ? payload : {};
    },
    retry: 1,
    staleTime: 5 * 60_000,
  });

