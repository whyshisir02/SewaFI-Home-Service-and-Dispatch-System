import { useMutation, useQuery } from '@tanstack/react-query';
import { api, unwrapResponse } from '../lib/axios';

const isMissingEndpoint = (error) => error?.response?.status === 404;

const firstDefined = (...values) => values.find((value) => value !== undefined && value !== null && value !== '');

const normalizeSocialLinks = (socialLinks) => {
  if (!socialLinks) return [];

  if (Array.isArray(socialLinks)) {
    return socialLinks
      .map((item) => ({
        label: item?.label || item?.platform || item?.name || '',
        url: item?.url || item?.link || '',
      }))
      .filter((item) => item.label && item.url);
  }

  if (typeof socialLinks === 'object') {
    return Object.entries(socialLinks)
      .map(([label, url]) => ({
        label,
        url: typeof url === 'string' ? url : url?.url || '',
      }))
      .filter((item) => item.label && item.url);
  }

  return [];
};

export const normalizeContactInfo = (payload) => {
  if (!payload || typeof payload !== 'object') return null;

  return {
    phone: firstDefined(payload.phone, payload.supportPhone, payload.contactPhone),
    email: firstDefined(payload.email, payload.supportEmail, payload.contactEmail),
    address: firstDefined(payload.address, payload.officeAddress, payload.contactAddress),
    supportHours: firstDefined(payload.supportHours, payload.businessHours),
    socialLinks: normalizeSocialLinks(payload.socialLinks),
  };
};

export const usePublicContactInfo = () =>
  useQuery({
    queryKey: ['contact', 'public-contact-info'],
    queryFn: async () => {
      const endpoints = ['/public/contact-info', '/public/site-settings', '/settings/public'];

      for (const endpoint of endpoints) {
        try {
          const payload = await api.get(endpoint).then(unwrapResponse);
          const normalized = normalizeContactInfo(payload);
          if (normalized) return normalized;
        } catch (error) {
          if (!isMissingEndpoint(error)) {
            throw error;
          }
        }
      }

      return null;
    },
    staleTime: 5 * 60_000,
    retry: 1,
  });

const submitContact = async (payload) => api.post('/public/contact', payload).then(unwrapResponse);

export const useSubmitContactMessage = () =>
  useMutation({
    mutationFn: submitContact,
  });
