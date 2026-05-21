import { useQuery } from '@tanstack/react-query';
import { locationApi } from '../features/location/api/location.api';

const toOptionList = (payload) =>
  (Array.isArray(payload) ? payload : [])
    .map((item) => (typeof item === 'string' ? item : item?.name || item?.label || item?.value || ''))
    .filter(Boolean);

export const useNepalProvinces = () =>
  useQuery({
    queryKey: ['nepal-provinces'],
    queryFn: async () => toOptionList(await locationApi.provinces()),
    staleTime: 5 * 60_000,
    retry: 1,
  });

export const useNepalDistricts = (province) =>
  useQuery({
    queryKey: ['nepal-districts', province],
    queryFn: async () => toOptionList(await locationApi.districts(province)),
    enabled: Boolean(province),
    staleTime: 5 * 60_000,
    retry: 1,
  });

export const useNepalMunicipalities = (province, district) =>
  useQuery({
    queryKey: ['nepal-municipalities', province, district],
    queryFn: async () => toOptionList(await locationApi.municipalities(province, district)),
    enabled: Boolean(province && district),
    staleTime: 5 * 60_000,
    retry: 1,
  });

