import { api, unwrapResponse } from '../../../lib/axios';

const isMissingEndpoint = (error) => error?.response?.status === 404;

const endpointMissingError = (code, message) => {
  const error = new Error(message);
  error.code = code;
  return error;
};

const requestWithFallback = async (requesters, missingCode, missingMessage) => {
  let missingCount = 0;

  for (const requester of requesters) {
    try {
      return await requester();
    } catch (error) {
      if (isMissingEndpoint(error)) {
        missingCount += 1;
        continue;
      }

      throw error;
    }
  }

  if (missingCount === requesters.length) {
    throw endpointMissingError(missingCode, missingMessage);
  }

  throw new Error('Notification request failed.');
};

export const notificationApi = {
  getNotifications: ({ role, ...params } = {}) =>
    requestWithFallback(
      [
        () => api.get('/notifications', { params }).then(unwrapResponse),
        () => (role ? api.get(`/${role}/notifications`, { params }).then(unwrapResponse) : Promise.reject(endpointMissingError('ROLE_NOT_PROVIDED', 'Role route not provided.'))),
      ],
      'NOTIFICATIONS_LIST_ENDPOINT_MISSING',
      'Notifications endpoint is not available.'
    ),
  list: ({ role, ...params } = {}) =>
    notificationApi.getNotifications({ role, ...params }),
  getUnreadCount: () =>
    requestWithFallback(
      [() => api.get('/notifications/unread-count').then(unwrapResponse)],
      'NOTIFICATIONS_UNREAD_ENDPOINT_MISSING',
      'Unread count endpoint is not available.'
    ),
  unreadCount: () => notificationApi.getUnreadCount(),
  getBellNotifications: (params = {}) =>
    requestWithFallback(
      [() => api.get('/notifications/bell', { params }).then(unwrapResponse)],
      'NOTIFICATIONS_BELL_ENDPOINT_MISSING',
      'Bell notifications endpoint is not available.'
    ),
  markAsRead: (id) =>
    requestWithFallback(
      [
        () => api.patch(`/notifications/${id}/read`).then(unwrapResponse),
        () => api.patch(`/notifications/${id}/mark-read`).then(unwrapResponse),
      ],
      'NOTIFICATIONS_MARK_READ_ENDPOINT_MISSING',
      'Mark as read endpoint is not available.'
    ),
  markAllAsRead: () =>
    requestWithFallback(
      [
        () => api.patch('/notifications/read-all').then(unwrapResponse),
        () => api.patch('/notifications/mark-all-read').then(unwrapResponse),
      ],
      'NOTIFICATIONS_MARK_ALL_ENDPOINT_MISSING',
      'Mark all as read endpoint is not available.'
    ),
  archiveNotification: (id) =>
    requestWithFallback(
      [() => api.patch(`/notifications/${id}/archive`).then(unwrapResponse)],
      'NOTIFICATIONS_ARCHIVE_ENDPOINT_MISSING',
      'Archive endpoint is not available.'
    ),
  unarchiveNotification: (id) =>
    requestWithFallback(
      [() => api.patch(`/notifications/${id}/unarchive`).then(unwrapResponse)],
      'NOTIFICATIONS_UNARCHIVE_ENDPOINT_MISSING',
      'Unarchive endpoint is not available.'
    ),
  archiveReadNotifications: () =>
    requestWithFallback(
      [() => api.patch('/notifications/archive-read').then(unwrapResponse)],
      'NOTIFICATIONS_ARCHIVE_READ_ENDPOINT_MISSING',
      'Archive-read endpoint is not available.'
    ),
  getPushPublicKey: () =>
    requestWithFallback(
      [() => api.get('/notifications/push/public-key').then(unwrapResponse)],
      'NOTIFICATIONS_PUSH_PUBLIC_KEY_ENDPOINT_MISSING',
      'Push public key endpoint is not available.'
    ),
  subscribeToPush: (subscription) =>
    requestWithFallback(
      [() => api.post('/notifications/push/subscribe', subscription).then(unwrapResponse)],
      'NOTIFICATIONS_PUSH_SUBSCRIBE_ENDPOINT_MISSING',
      'Push subscribe endpoint is not available.'
    ),
  unsubscribeFromPush: (endpoint) =>
    requestWithFallback(
      [() => api.post('/notifications/push/unsubscribe', { endpoint }).then(unwrapResponse)],
      'NOTIFICATIONS_PUSH_UNSUBSCRIBE_ENDPOINT_MISSING',
      'Push unsubscribe endpoint is not available.'
    ),
  sendTestPush: () =>
    requestWithFallback(
      [() => api.post('/notifications/push/test').then(unwrapResponse)],
      'NOTIFICATIONS_PUSH_TEST_ENDPOINT_MISSING',
      'Push test endpoint is not available.'
    ),
  remove: (id) =>
    requestWithFallback(
      [() => api.delete(`/notifications/${id}`).then(unwrapResponse)],
      'NOTIFICATIONS_DELETE_ENDPOINT_MISSING',
      'Delete notification endpoint is not available.'
    ),
};
