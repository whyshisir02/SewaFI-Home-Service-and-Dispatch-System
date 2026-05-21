import { api, unwrapResponse } from '../../../lib/axios';

export const customerApi = {
  summary: () => api.get('/dashboard/summary').then(unwrapResponse),
  profile: () => api.get('/users/me').then(unwrapResponse),
  updateProfile: (payload) => api.patch('/users/me', payload).then(unwrapResponse),
};
