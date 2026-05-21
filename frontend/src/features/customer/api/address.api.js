import { api, unwrapResponse } from '../../../lib/axios';

const toArray = (payload, keys = []) => {
  if (Array.isArray(payload)) return payload;

  for (const key of keys) {
    if (Array.isArray(payload?.[key])) return payload[key];
  }

  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.items)) return payload.items;

  return [];
};

const normalizeAddressItem = (item = {}) => ({
  ...item,

  // UI compatibility:
  // Backend stores streetAddress, older frontend components may read addressLine.
  addressLine: item.addressLine || item.streetAddress || item.address || '',

  // Backend compatibility:
  // Keep streetAddress available too.
  streetAddress: item.streetAddress || item.addressLine || item.address || '',
});

const normalizeAddressPayload = (payload = {}) => ({
  label: payload.label || null,
  fullName: payload.fullName || null,
  phone: payload.phone || null,

  province: payload.province,
  district: payload.district,
  municipality: payload.municipality,
  ward: payload.ward || null,

  // Important:
  // Frontend form may use addressLine, backend expects streetAddress.
  streetAddress: payload.streetAddress || payload.addressLine || payload.address || '',

  landmark: payload.landmark || null,

  latitude:
    payload.latitude !== undefined && payload.latitude !== null && payload.latitude !== ''
      ? Number(payload.latitude)
      : null,

  longitude:
    payload.longitude !== undefined && payload.longitude !== null && payload.longitude !== ''
      ? Number(payload.longitude)
      : null,

  isDefault: Boolean(payload.isDefault),
});

export const addressApi = {
  list: async () => {
    const response = await api.get('/customer/addresses');
    const payload = unwrapResponse(response);

    return {
      items: toArray(payload, ['addresses']).map(normalizeAddressItem),
      sourcePath: '/customer/addresses',
    };
  },

  create: async (payload) => {
    const response = await api.post(
      '/customer/addresses',
      normalizeAddressPayload(payload)
    );

    return normalizeAddressItem(unwrapResponse(response));
  },

  update: async ({ id, payload }) => {
    const response = await api.patch(
      `/customer/addresses/${id}`,
      normalizeAddressPayload(payload)
    );

    return normalizeAddressItem(unwrapResponse(response));
  },

  remove: async (id) => {
    const response = await api.delete(`/customer/addresses/${id}`);
    return unwrapResponse(response);
  },

  setDefault: async (id) => {
    const response = await api.patch(`/customer/addresses/${id}/default`);
    return normalizeAddressItem(unwrapResponse(response));
  },
};

export default addressApi;