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
  list: ({ role, ...params } = {}) =>
    requestWithFallback(
      [
        () => api.get('/notifications', { params }).then(unwrapResponse),
        () => (role ? api.get(`/${role}/notifications`, { params }).then(unwrapResponse) : Promise.reject(endpointMissingError('ROLE_NOT_PROVIDED', 'Role route not provided.'))),
      ],
      'NOTIFICATIONS_LIST_ENDPOINT_MISSING',
      'Notifications endpoint is not available.'
    ),
  unreadCount: () =>
    requestWithFallback(
      [() => api.get('/notifications/unread-count').then(unwrapResponse)],
      'NOTIFICATIONS_UNREAD_ENDPOINT_MISSING',
      'Unread count endpoint is not available.'
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
  remove: (id) =>
    requestWithFallback(
      [() => api.delete(`/notifications/${id}`).then(unwrapResponse)],
      'NOTIFICATIONS_DELETE_ENDPOINT_MISSING',
      'Delete notification endpoint is not available.'
    ),
};
