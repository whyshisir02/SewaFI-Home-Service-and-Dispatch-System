import { api, unwrapResponse } from '../../../lib/axios';
import { requestFirstAvailable } from '../../../lib/endpointFallback';

const CONTACT_INFO_ENDPOINTS = ['/public/contact-info', '/public/site-settings', '/settings/public'];
const STATS_ENDPOINTS = ['/public/stats', '/admin/public-stats', '/public/about-stats'];
const SITE_SETTINGS_ENDPOINTS = ['/public/site-settings', '/public/contact-info'];
const STATUS_ENDPOINTS = ['/public/status', '/system/status', '/public/maintenance'];

const LEGAL_ENDPOINTS = {
  terms: ['/public/legal/terms'],
  privacy: ['/public/legal/privacy'],
};

const get = (url, config) => api.get(url, config).then(unwrapResponse);

const isPlainObject = (value) => Boolean(value) && typeof value === 'object';

const candidates = (endpoints) => endpoints.map((endpoint) => () => get(endpoint));

export const publicApi = {
  siteSettings: () => get('/public/site-settings'),
  faqs: (params) => get('/public/faqs', { params }),
  coverage: () => get('/public/coverage'),
  submitContact: (payload) => api.post('/public/contact', payload).then(unwrapResponse),

  // Probed endpoints: the first path that returns a usable payload wins.
  contactInfo: () => requestFirstAvailable(candidates(CONTACT_INFO_ENDPOINTS), { accept: isPlainObject }),
  stats: () => requestFirstAvailable(candidates(STATS_ENDPOINTS)),
  siteSettingsOrContactInfo: () => requestFirstAvailable(candidates(SITE_SETTINGS_ENDPOINTS)),
  systemStatus: () => requestFirstAvailable(candidates(STATUS_ENDPOINTS)),
  legal: (type) => requestFirstAvailable(candidates(LEGAL_ENDPOINTS[type] || [])),
};

export default publicApi;
