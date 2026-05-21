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

      // TODO: Connect contact cards to a stable public contact endpoint when backend exposes it.
      return null;
    },
    staleTime: 5 * 60_000,
    retry: 1,
  });

const submitContact = async (endpoint, payload) => api.post(endpoint, payload).then(unwrapResponse);

export const useSubmitContactMessage = () =>
  useMutation({
    mutationFn: async (payload) => {
      const endpoints = ['/contact', '/public/contact', '/support/contact'];
      let missingCount = 0;

      for (const endpoint of endpoints) {
        try {
          return await submitContact(endpoint, payload);
        } catch (error) {
          if (isMissingEndpoint(error)) {
            missingCount += 1;
            continue;
          }

          throw error;
        }
      }

      if (missingCount === endpoints.length) {
        const unavailableError = new Error('Contact form submission is not available yet.');
        unavailableError.code = 'CONTACT_ENDPOINT_MISSING';
        throw unavailableError;
      }

      throw new Error('Unable to send your message right now. Please try again.');
    },
  });

