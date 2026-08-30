import { api, unwrapResponse } from '../../../lib/axios';
import { missingEndpointError, requestFirstAvailable } from '../../../lib/endpointFallback';

const get = (url, config) => api.get(url, config).then(unwrapResponse);
const patch = (url, payload, config) => api.patch(url, payload, config).then(unwrapResponse);

const throwMissing = (code, message) => () => {
  throw missingEndpointError(code, message);
};

export const profileApi = {
  me: () => get('/users/me'),
  updateMe: (payload) => patch('/users/me', payload),
  updateProviderProfile: (payload) => patch('/users/provider/profile', payload),

  uploadAvatar: (file) => {
    const data = new FormData();
    data.append('avatar', file);
    return patch('/users/me/avatar', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  changePassword: (payload) =>
    requestFirstAvailable(
      [
        () => patch('/auth/change-password', payload),
        () => api.post('/auth/change-password', payload).then(unwrapResponse),
      ],
      {
        onAllMissing: throwMissing(
          'CHANGE_PASSWORD_ENDPOINT_MISSING',
          'Password change endpoint is not available yet.'
        ),
      }
    ),

  getPreferences: () =>
    requestFirstAvailable([() => get('/users/me/preferences')], {
      onAllMissing: throwMissing(
        'PREFERENCES_ENDPOINT_MISSING',
        'Preferences endpoint is not available yet.'
      ),
    }),

  updatePreferences: (payload) =>
    requestFirstAvailable([() => patch('/users/me/preferences', payload)], {
      onAllMissing: throwMissing(
        'PREFERENCES_ENDPOINT_MISSING',
        'Preferences endpoint is not available yet.'
      ),
    }),
};

export default profileApi;
