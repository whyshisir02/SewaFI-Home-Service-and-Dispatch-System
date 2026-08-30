import { formatDate } from '../../../../utils/formatDate';

export const toLocationOptions = (payload) => {
  const list = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.data)
      ? payload.data
      : Array.isArray(payload?.items)
        ? payload.items
        : Array.isArray(payload?.provinces)
          ? payload.provinces
          : Array.isArray(payload?.districts)
            ? payload.districts
            : Array.isArray(payload?.municipalities)
              ? payload.municipalities
              : [];

  return list
    .map((item) => {
      if (typeof item === 'string') return { value: item, label: item };
      const value = item?.id || item?.code || item?.name || '';
      const label = item?.name || item?.label || item?.title || item?.code || '';
      return { value, label };
    })
    .filter((item) => item.value && item.label);
};

export const formatAddressText = (address = {}) => {
  const segments = [
    address?.addressLine || address?.address,
    address?.ward ? `Ward ${address.ward}` : '',
    address?.municipality,
    address?.district,
    address?.province,
  ].filter(Boolean);

  return segments.join(', ');
};

export const hasCoordinates = (address) =>
  address?.latitude != null && address?.longitude != null;

export const formatAddressDate = (value) => (value ? formatDate(value) : '—');

