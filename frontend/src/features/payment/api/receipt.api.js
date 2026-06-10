import { api, unwrapResponse } from '../../../lib/axios';

const normalizeListResponse = (response) => ({
  items: Array.isArray(response?.data?.data) ? response.data.data : [],
  meta: response?.data?.meta || null,
  message: response?.data?.message || '',
});

export const receiptApi = {
  listCustomer: (params) => api.get('/receipts/customer', { params }).then(normalizeListResponse),
  getCustomer: (receiptId) => api.get(`/receipts/customer/${receiptId}`).then(unwrapResponse),
  getCustomerByBooking: (bookingId) => api.get(`/receipts/customer/bookings/${bookingId}`).then(unwrapResponse),
  downloadCustomer: (receiptId) => api.get(`/receipts/customer/${receiptId}/download`, { responseType: 'blob' }),
  listAdmin: (params) => api.get('/receipts/admin', { params }).then(normalizeListResponse),
  getAdmin: (receiptId) => api.get(`/receipts/admin/${receiptId}`).then(unwrapResponse),
  getAdminByPayment: (paymentId) => api.get(`/receipts/admin/payments/${paymentId}`).then(unwrapResponse),
  downloadAdmin: (receiptId) => api.get(`/receipts/admin/${receiptId}/download`, { responseType: 'blob' }),
};

export default receiptApi;
