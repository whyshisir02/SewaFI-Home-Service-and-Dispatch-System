import { api, unwrapResponse } from '../../../lib/axios';
import { missingEndpointError, requestFirstAvailable } from '../../../lib/endpointFallback';

const get = (url) => api.get(url).then(unwrapResponse);
const patch = (url, payload) => api.patch(url, payload).then(unwrapResponse);

const throwMissing = (code, message) => () => {
  throw missingEndpointError(code, message);
};

const readSetting = (paths, code, message) =>
  requestFirstAvailable(
    paths.map((path) => () => get(path)),
    { onAllMissing: throwMissing(code, message) }
  );

const writeSetting = (paths, payload, code, message) =>
  requestFirstAvailable(
    paths.map((path) => () => patch(path, payload)),
    { onAllMissing: throwMissing(code, message) }
  );

/**
 * Reads a setting and reports which endpoint served it, so the UI can tell
 * "editable admin settings" apart from the read-only public fallback.
 */
const readSettingWithSource = (paths, code, message) =>
  requestFirstAvailable(
    paths.map((path) => async () => ({ data: await get(path), source: path })),
    { onAllMissing: throwMissing(code, message) }
  );

export const ADMIN_SETTINGS_ERRORS = {
  site: 'SITE_SETTINGS_UNAVAILABLE',
  contact: 'CONTACT_SETTINGS_UNAVAILABLE',
  booking: 'BOOKING_SETTINGS_UNAVAILABLE',
  notifications: 'NOTIFICATION_SETTINGS_UNAVAILABLE',
  security: 'SECURITY_SETTINGS_UNAVAILABLE',
  profile: 'PROFILE_UPDATE_UNAVAILABLE',
};

export const adminSettingsApi = {
  me: () => get('/auth/me'),

  platform: () =>
    readSettingWithSource(
      ['/admin/settings/site', '/public/site-settings'],
      ADMIN_SETTINGS_ERRORS.site,
      'Platform settings are not configurable from the frontend yet.'
    ),

  contact: () =>
    readSetting(
      ['/admin/settings/contact'],
      ADMIN_SETTINGS_ERRORS.contact,
      'Contact settings are not configurable from the frontend yet.'
    ),

  booking: () =>
    readSetting(
      ['/admin/settings/booking', '/admin/settings/dispatch'],
      ADMIN_SETTINGS_ERRORS.booking,
      'Dispatch configuration is managed by backend configuration.'
    ),

  notifications: () =>
    readSetting(
      ['/admin/settings/notifications'],
      ADMIN_SETTINGS_ERRORS.notifications,
      'Email delivery settings are managed from backend environment variables.'
    ),

  security: () =>
    readSetting(
      ['/admin/settings/security'],
      ADMIN_SETTINGS_ERRORS.security,
      'Security settings are not configurable from the frontend yet.'
    ),

  updateProfile: (payload) =>
    writeSetting(
      ['/users/me', '/profile'],
      payload,
      ADMIN_SETTINGS_ERRORS.profile,
      'Profile update endpoint is unavailable.'
    ),

  updatePlatform: (payload) =>
    writeSetting(
      ['/admin/settings/site'],
      payload,
      ADMIN_SETTINGS_ERRORS.site,
      'Platform settings endpoint is unavailable.'
    ),

  updateContact: (payload) =>
    writeSetting(
      ['/admin/settings/contact'],
      payload,
      ADMIN_SETTINGS_ERRORS.contact,
      'Contact settings endpoint is unavailable.'
    ),

  updateBooking: (payload) =>
    writeSetting(
      ['/admin/settings/booking', '/admin/settings/dispatch'],
      payload,
      ADMIN_SETTINGS_ERRORS.booking,
      'Booking settings endpoint is unavailable.'
    ),

  updateNotifications: (payload) =>
    writeSetting(
      ['/admin/settings/notifications'],
      payload,
      ADMIN_SETTINGS_ERRORS.notifications,
      'Notification settings endpoint is unavailable.'
    ),

  changePassword: (payload) =>
    requestFirstAvailable(
      [
        () => patch('/auth/change-password', payload),
        () => api.post('/auth/change-password', payload).then(unwrapResponse),
      ],
      {
        onAllMissing: throwMissing(
          'CHANGE_PASSWORD_ENDPOINT_MISSING',
          'Password change endpoint is unavailable.'
        ),
      }
    ),
};

export default adminSettingsApi;
