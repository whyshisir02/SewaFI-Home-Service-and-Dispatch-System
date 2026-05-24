import { api, unwrapResponse } from '../../../lib/axios';
import { bookingApi } from '../../booking/api/booking.api';

const AUDIT_LOG_LIST_ENDPOINTS = ['/admin/audit-logs', '/admin/activity-logs', '/admin/logs'];
const AUDIT_LOG_STATS_ENDPOINTS = ['/admin/audit-logs/stats'];
const AUDIT_LOG_DETAIL_ENDPOINTS = ['/admin/audit-logs/%id%', '/admin/activity-logs/%id%', '/admin/logs/%id%'];
const AUDIT_LOG_EXPORT_ENDPOINTS = ['/admin/audit-logs/export'];

const isMissingEndpoint = (error) => [404, 405].includes(error?.response?.status);

const toUnsupportedAuditError = () => {
  const error = new Error('Audit logs endpoint is not available');
  error.code = 'AUDIT_ENDPOINT_UNAVAILABLE';
  return error;
};

const requestFirstAvailable = async (endpoints, config = {}) => {
  for (const endpoint of endpoints) {
    try {
      const response = await api.get(endpoint, config);
      return config?.responseType ? response : unwrapResponse(response);
    } catch (error) {
      if (isMissingEndpoint(error)) continue;
      throw error;
    }
  }
  throw toUnsupportedAuditError();
};

export const adminApi = {
  stats: () => api.get('/admin/stats').then(unwrapResponse),
  pendingProviders: () => api.get('/admin/providers/pending').then(unwrapResponse),
  providers: async (params) => {
    try {
      return await api.get('/admin/providers', { params }).then(unwrapResponse);
    } catch {
      return api.get('/providers', { params }).then(unwrapResponse);
    }
  },
  providerDetails: async (id) => {
    try {
      return await api.get(`/admin/providers/${id}`).then(unwrapResponse);
    } catch {
      return api.get(`/providers/${id}`).then(unwrapResponse);
    }
  },
  approveProvider: (id) => api.patch(`/admin/providers/${id}/approve`).then(unwrapResponse),
  rejectProvider: (id, payload = {}) => api.patch(`/admin/providers/${id}/reject`, payload).then(unwrapResponse),
  suspendProvider: (id, payload = {}) => api.patch(`/admin/providers/${id}/suspend`, payload).then(unwrapResponse),
  activateProvider: (id) => api.patch(`/admin/providers/${id}/activate`).then(unwrapResponse),
  updateProviderStatus: ({ id, status, reason }) =>
    api.patch(`/admin/providers/${id}/status`, { status, reason }).then(unwrapResponse),
  revenueChart: () => api.get('/admin/charts/revenue').then(unwrapResponse),
  topProvidersChart: () => api.get('/admin/charts/top-providers').then(unwrapResponse),
  categoryChart: () => api.get('/admin/charts/categories').then(unwrapResponse),
  bookingStatusChart: () => api.get('/admin/charts/booking-status').then(unwrapResponse),
  recentBookings: () => api.get('/admin/recent-bookings').then(unwrapResponse),
  reviews: () => api.get('/admin/reviews').then(unwrapResponse),
  users: async (params) => {
    try {
      return await api.get('/admin/users', { params }).then(unwrapResponse);
    } catch {
      return api.get('/users', { params }).then(unwrapResponse);
    }
  },
  userDetails: async (id) => {
    try {
      return await api.get(`/admin/users/${id}`).then(unwrapResponse);
    } catch {
      return api.get(`/users/${id}`).then(unwrapResponse);
    }
  },
  suspendUser: (id, reason) =>
    api.patch(`/admin/users/${id}/suspend`, reason ? { reason } : {}).then(unwrapResponse),
  activateUser: (id) => api.patch(`/admin/users/${id}/activate`).then(unwrapResponse),
  updateUserStatus: async ({ id, status, reason }) => {
    if (status === 'SUSPENDED') {
      return adminApi.suspendUser(id, reason);
    }
    if (status === 'ACTIVE') {
      return adminApi.activateUser(id);
    }
    return api.patch(`/admin/users/${id}/status`, { status, reason }).then(unwrapResponse);
  },
  deleteUser: (id) => api.delete(`/admin/users/${id}`).then(unwrapResponse),
  bookings: async (params) => {
    try {
      return await api.get('/admin/bookings', { params }).then(unwrapResponse);
    } catch {
      return bookingApi.list(params);
    }
  },
  bookingDetails: async (id) => {
    try {
      return await api.get(`/admin/bookings/${id}`).then(unwrapResponse);
    } catch {
      return bookingApi.details(id);
    }
  },
  bookingTimeline: async (id) => {
    try {
      return await api.get(`/bookings/${id}/status-history`).then(unwrapResponse);
    } catch {
      return api.get(`/bookings/${id}/timeline`).then(unwrapResponse);
    }
  },
  updateBookingStatus: ({ id, status, reason }) => bookingApi.updateStatus({ id, status, reason }),
  cancelBooking: ({ id, reason }) => bookingApi.cancel({ id, reason }),
  payments: async (params) => {
    try {
      return await api.get('/admin/payments', { params }).then(unwrapResponse);
    } catch {
      try {
        return await api.get('/payments', { params }).then(unwrapResponse);
      } catch {
        return api.get('/admin/bookings/payments', { params }).then(unwrapResponse);
      }
    }
  },
  paymentDetails: async (id) => {
    try {
      return await api.get(`/admin/payments/${id}`).then(unwrapResponse);
    } catch {
      return api.get(`/payments/${id}`).then(unwrapResponse);
    }
  },
  paymentStats: () => api.get('/admin/payments/stats').then(unwrapResponse),
  resolvePaymentDispute: ({ paymentId, finalAmount, adminNote, markPaid = true }) =>
    api
      .patch(`/admin/payments/${paymentId}/resolve-dispute`, { finalAmount, adminNote, markPaid })
      .then(unwrapResponse),
  settleProviderPayment: ({ paymentId, adminNote }) =>
    api.patch(`/admin/payments/${paymentId}/settle-provider`, { adminNote }).then(unwrapResponse),
  updatePayment: ({ paymentId, payload }) =>
    api.patch(`/admin/payments/${paymentId}`, payload).then(unwrapResponse),
    // Admin services
  services: (params) => {
    return api.get('/admin/services', { params }).then(unwrapResponse);
  },

  serviceStats: () => {
    return api.get('/admin/services/stats').then(unwrapResponse);
  },

  subcategories: (params) => {
    return api.get('/subcategories', { params }).then(unwrapResponse);
  },

  serviceDetails: (id) => {
    return api.get(`/admin/services/${id}`).then(unwrapResponse);
  },

  createService: (payload) => {
    return api.post('/admin/services', payload).then(unwrapResponse);
  },

  updateService: ({ id, payload }) => {
    return api.patch(`/admin/services/${id}`, payload).then(unwrapResponse);
  },

  deleteService: (id) => {
    return api.delete(`/admin/services/${id}`).then(unwrapResponse);
  },

  updateServiceStatus: ({ id, isActive }) => {
    return api.patch(`/admin/services/${id}/status`, { isActive }).then(unwrapResponse);
  },

  archiveService: (id) => {
    return api.patch(`/admin/services/${id}/status`, { isActive: false }).then(unwrapResponse);
  },

  uploadServiceImage: (file) => {
    const formData = new FormData();
    formData.append('image', file);

    return api
      .post('/uploads/service-image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
      .then(unwrapResponse);
  },
  


  // Admin categories
  categories: (params) => {
    return api.get('/admin/categories', { params }).then(unwrapResponse);
  },

  categoryStats: () => {
    return api.get('/admin/categories/stats').then(unwrapResponse);
  },

  categoryDetails: (id) => {
    return api.get(`/admin/categories/${id}`).then(unwrapResponse);
  },

  createCategory: (payload) => {
    return api.post('/admin/categories', payload).then(unwrapResponse);
  },

  updateCategory: ({ id, payload }) => {
    return api.patch(`/admin/categories/${id}`, payload).then(unwrapResponse);
  },

  deleteCategory: (id) => {
    return api.delete(`/admin/categories/${id}`).then(unwrapResponse);
  },

  updateCategoryStatus: ({ id, isActive }) => {
    return api.patch(`/admin/categories/${id}/status`, { isActive }).then(unwrapResponse);
  },

  archiveCategory: (id) => {
    return api.patch(`/admin/categories/${id}/status`, { isActive: false }).then(unwrapResponse);
  },

  uploadCategoryImage: (file) => {
    const formData = new FormData();
    formData.append('image', file);

    return api
      .post('/uploads/category-image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
      .then(unwrapResponse);
  },

  // Admin FAQs
  faqs: (params) => api.get('/admin/faqs', { params }).then(unwrapResponse),
  createFaq: (payload) => api.post('/admin/faqs', payload).then(unwrapResponse),
  updateFaq: ({ id, payload }) => api.patch(`/admin/faqs/${id}`, payload).then(unwrapResponse),
  deleteFaq: (id) => api.delete(`/admin/faqs/${id}`).then(unwrapResponse),

  reportsOverview: async (params) => {
    try {
      return await api.get('/admin/reports/overview', { params }).then(unwrapResponse);
    } catch {
      try {
        return await api.get('/admin/reports', { params }).then(unwrapResponse);
      } catch {
        return api.get('/admin/analytics', { params }).then(unwrapResponse);
      }
    }
  },
  reportsBookings: async (params) => {
    try {
      return await api.get('/admin/reports/bookings', { params }).then(unwrapResponse);
    } catch {
      return api.get('/admin/analytics/bookings', { params }).then(unwrapResponse);
    }
  },
  reportsServices: async (params) => {
    try {
      return await api.get('/admin/reports/services', { params }).then(unwrapResponse);
    } catch {
      return api.get('/admin/analytics/services', { params }).then(unwrapResponse);
    }
  },
  reportsProviders: async (params) => {
    try {
      return await api.get('/admin/reports/providers', { params }).then(unwrapResponse);
    } catch {
      return api.get('/admin/analytics/providers', { params }).then(unwrapResponse);
    }
  },
  reportsUsers: async (params) => {
    try {
      return await api.get('/admin/reports/users', { params }).then(unwrapResponse);
    } catch {
      return api.get('/admin/analytics/users', { params }).then(unwrapResponse);
    }
  },
  reportsPayments: async (params) => {
    try {
      return await api.get('/admin/reports/payments', { params }).then(unwrapResponse);
    } catch {
      return api.get('/admin/analytics/payments', { params }).then(unwrapResponse);
    }
  },
  exportReports: (params) => api.get('/admin/reports/export', { params, responseType: 'blob' }),
  auditLogs: async (params) => requestFirstAvailable(AUDIT_LOG_LIST_ENDPOINTS, { params }),
  auditLogStats: async () => requestFirstAvailable(AUDIT_LOG_STATS_ENDPOINTS),
  auditLogDetails: async (id) =>
    requestFirstAvailable(AUDIT_LOG_DETAIL_ENDPOINTS.map((item) => item.replace('%id%', String(id)))),
  exportAuditLogs: async (params) => requestFirstAvailable(AUDIT_LOG_EXPORT_ENDPOINTS, { params, responseType: 'blob' }),
};
