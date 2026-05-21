import { api, unwrapResponse } from '../../../lib/axios';

export const bookingApi = {
  create: (payload) => api.post('/bookings', payload).then(unwrapResponse),
  list: (params) => api.get('/bookings', { params }).then(unwrapResponse),
  details: (id) => api.get(`/bookings/${id}`).then(unwrapResponse),
  timeline: async (id) => {
    try {
      return await api.get(`/bookings/${id}/status-history`).then(unwrapResponse);
    } catch {
      return api.get(`/bookings/${id}/timeline`).then(unwrapResponse);
    }
  },
  accept: (id) => api.patch(`/bookings/${id}/accept`).then(unwrapResponse),
  reject: (id) => api.patch(`/bookings/${id}/reject`).then(unwrapResponse),
  updateStatus: ({ id, status }) => api.patch(`/bookings/${id}/status`, { status }).then(unwrapResponse),
  cancel: ({ id, reason } = {}) => api.patch(`/bookings/${id}/cancel`, { reason }).then(unwrapResponse),
  providerAvailable: (params) => api.get('/bookings/provider/available', { params }).then(unwrapResponse),
};
