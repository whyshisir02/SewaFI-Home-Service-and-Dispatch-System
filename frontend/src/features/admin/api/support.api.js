import { api, unwrapResponse } from '../../../lib/axios';

const LIST_ENDPOINTS = ['/admin/support/messages'];
const STATS_ENDPOINTS = ['/admin/support/stats'];
const DETAIL_ENDPOINTS = ['/admin/support/messages/%id%'];
const STATUS_ENDPOINTS = ['/admin/support/messages/%id%/status'];
const RESOLVE_ENDPOINTS = ['/admin/support/messages/%id%/resolve'];
const REPLY_ENDPOINTS = ['/admin/support/messages/%id%/reply'];
const ARCHIVE_ENDPOINTS = ['/admin/support/messages/%id%/archive'];
const DELETE_ENDPOINTS = ['/admin/support/messages/%id%'];
const EXPORT_ENDPOINTS = ['/admin/support/messages/export'];

const isMissingEndpoint = (error) => [404, 405].includes(error?.response?.status);

const toUnsupportedError = (code, message) => {
  const error = new Error(message);
  error.code = code;
  return error;
};

const replaceId = (endpoint, id) => endpoint.replace('%id%', String(id));

const requestFirstAvailableGet = async (endpoints, config = {}, unsupportedCode, unsupportedMessage) => {
  for (const endpoint of endpoints) {
    try {
      const response = await api.get(endpoint, config);
      return config?.responseType ? response : unwrapResponse(response);
    } catch (error) {
      if (isMissingEndpoint(error)) continue;
      throw error;
    }
  }

  throw toUnsupportedError(unsupportedCode, unsupportedMessage);
};

const requestFirstAvailablePost = async (endpoints, payload = {}, unsupportedCode, unsupportedMessage) => {
  for (const endpoint of endpoints) {
    try {
      const response = await api.post(endpoint, payload);
      return unwrapResponse(response);
    } catch (error) {
      if (isMissingEndpoint(error)) continue;
      throw error;
    }
  }
  throw toUnsupportedError(unsupportedCode, unsupportedMessage);
};

const requestFirstAvailablePatch = async (endpoints, payload = {}, unsupportedCode, unsupportedMessage) => {
  for (const endpoint of endpoints) {
    try {
      const response = await api.patch(endpoint, payload);
      return unwrapResponse(response);
    } catch (error) {
      if (isMissingEndpoint(error)) continue;
      throw error;
    }
  }
  throw toUnsupportedError(unsupportedCode, unsupportedMessage);
};

const requestFirstAvailableDelete = async (endpoints, unsupportedCode, unsupportedMessage) => {
  for (const endpoint of endpoints) {
    try {
      const response = await api.delete(endpoint);
      return unwrapResponse(response);
    } catch (error) {
      if (isMissingEndpoint(error)) continue;
      throw error;
    }
  }
  throw toUnsupportedError(unsupportedCode, unsupportedMessage);
};

export const supportApi = {
  list: async (params) =>
    requestFirstAvailableGet(
      LIST_ENDPOINTS,
      { params },
      'SUPPORT_ENDPOINT_UNAVAILABLE',
      'Support messages endpoint is not available'
    ),
  stats: async () =>
    requestFirstAvailableGet(
      STATS_ENDPOINTS,
      {},
      'SUPPORT_STATS_UNAVAILABLE',
      'Support stats endpoint is not available'
    ),
  details: async (id) =>
    requestFirstAvailableGet(
      DETAIL_ENDPOINTS.map((endpoint) => replaceId(endpoint, id)),
      {},
      'SUPPORT_DETAIL_UNAVAILABLE',
      'Support detail endpoint is not available'
    ),
  updateStatus: async ({ id, status }) =>
    requestFirstAvailablePatch(
      STATUS_ENDPOINTS.map((endpoint) => replaceId(endpoint, id)),
      { status },
      'SUPPORT_STATUS_UNAVAILABLE',
      'Support status update endpoint is not available'
    ),
  resolve: async (id) =>
    requestFirstAvailablePatch(
      RESOLVE_ENDPOINTS.map((endpoint) => replaceId(endpoint, id)),
      {},
      'SUPPORT_STATUS_UNAVAILABLE',
      'Support resolve endpoint is not available'
    ),
  reply: async ({ id, message }) =>
    requestFirstAvailablePost(
      REPLY_ENDPOINTS.map((endpoint) => replaceId(endpoint, id)),
      { message },
      'SUPPORT_REPLY_UNAVAILABLE',
      'Support reply endpoint is not available'
    ),
  archive: async (id) =>
    requestFirstAvailablePatch(
      ARCHIVE_ENDPOINTS.map((endpoint) => replaceId(endpoint, id)),
      {},
      'SUPPORT_ARCHIVE_UNAVAILABLE',
      'Support archive endpoint is not available'
    ),
  remove: async (id) =>
    requestFirstAvailableDelete(
      DELETE_ENDPOINTS.map((endpoint) => replaceId(endpoint, id)),
      'SUPPORT_DELETE_UNAVAILABLE',
      'Support delete endpoint is not available'
    ),
  export: async (params) =>
    requestFirstAvailableGet(
      EXPORT_ENDPOINTS,
      { params, responseType: 'blob' },
      'SUPPORT_EXPORT_UNAVAILABLE',
      'Support export endpoint is not available'
    ),
};

export default supportApi;
