import { api, unwrapResponse } from '../../../lib/axios';

export const locationApi = {
  provinces: () => api.get('/locations/provinces').then(unwrapResponse),
  districts: (province) => api.get('/locations/districts', { params: { province } }).then(unwrapResponse),
  municipalities: (province, district) => api.get('/locations/municipalities', { params: { province, district } }).then(unwrapResponse),
};
