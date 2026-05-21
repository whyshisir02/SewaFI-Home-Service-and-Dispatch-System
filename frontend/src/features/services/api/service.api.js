import { api, unwrapResponse } from '../../../lib/axios';

export const serviceApi = {
  list: (params) => api.get('/services', { params }).then(unwrapResponse),
  categories: () => api.get('/services/categories').then(unwrapResponse),
  categoryDetails: (slug) => api.get(`/services/categories/${slug}`).then(unwrapResponse),
  details: (id, params) => api.get(`/services/${id}`, { params }).then(unwrapResponse),
};
