import { api, unwrapResponse } from '../../../lib/axios';

const toListWithMeta = (response) => ({
  items: response?.data?.data ?? [],
  meta: response?.data?.meta ?? null,
});

export const paymentApi = {
  list: (params) => api.get('/customer/payments', { params }).then(toListWithMeta),
  detailsByBooking: async (bookingId) => {
    try {
      return await api.get(`/customer/bookings/${bookingId}/payment`).then(unwrapResponse);
    } catch {
      return api.get(`/payments/booking/${bookingId}`).then(unwrapResponse);
    }
  },
  methods: () => api.get('/payments/methods').then(unwrapResponse),
  confirmByBooking: ({ bookingId, paymentMethod = 'CASH', customerNote }) =>
    api
      .patch(`/customer/bookings/${bookingId}/confirm-payment`, { paymentMethod, customerNote })
      .then(unwrapResponse),
  disputeByBooking: ({ bookingId, reason }) =>
    api.patch(`/customer/bookings/${bookingId}/dispute-payment`, { reason }).then(unwrapResponse),
};
