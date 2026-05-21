import { api, unwrapResponse } from '../../../lib/axios';
import { bookingApi } from '../../booking/api/booking.api';

const unwrapListWithMeta = (response) => {
  const payload = response?.data || {};
  return {
    items: payload?.data ?? [],
    ...(payload?.meta ? { meta: payload.meta } : {}),
  };
};

export const providerApi = {
  summary: () => api.get('/dashboard/summary').then(unwrapResponse),
  stats: (params) => api.get('/provider/earnings', { params }).then(unwrapResponse),
  profile: () => api.get('/provider/me').then(unwrapResponse),
  availableJobs: (params) => api.get('/provider/nearby-jobs', { params }).then(unwrapListWithMeta),
  myJobs: (params) => api.get('/provider/assigned-jobs', { params }).then(unwrapListWithMeta),
  acceptJob: (id) => bookingApi.accept(id),
  rejectJob: (id) => bookingApi.reject(id),
  updateJobStatus: ({ id, status }) => bookingApi.updateStatus({ id, status }),
  submitFinalAmount: ({ bookingId, finalAmount, providerNote }) =>
    api
      .patch(`/provider/bookings/${bookingId}/submit-final-amount`, { finalAmount, providerNote })
      .then(unwrapResponse),
  updateAvailability: (payload = {}) => {
    const available =
      typeof payload === 'boolean'
        ? payload
        : payload.available ?? payload.availableToday;
    return api.patch('/provider/me/availability', { available }).then(unwrapResponse);
  },
  updateSchedule: (payload) => api.patch('/provider/me/schedule', payload).then(unwrapResponse),
  updateProfile: (payload) => api.patch('/provider/me', payload).then(unwrapResponse),

  updateDocuments: (formData) =>
    api
      .patch('/users/provider/documents', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
      .then(unwrapResponse),

  resubmitApplication: () =>
    api.patch('/users/provider/resubmit').then(unwrapResponse),

  listServices: () => api.get('/provider/me/services').then(unwrapResponse),
  addService: (payload) => api.post('/provider/me/services', payload).then(unwrapResponse),
  removeService: (serviceId) => api.delete(`/provider/me/services/${serviceId}`).then(unwrapResponse),
  listAreas: () => api.get('/provider/me/areas').then(unwrapResponse),
  addArea: (payload) => api.post('/provider/me/areas', payload).then(unwrapResponse),
  removeArea: (areaId) => api.delete(`/provider/me/areas/${areaId}`).then(unwrapResponse),
};
