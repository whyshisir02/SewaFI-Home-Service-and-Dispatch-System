import { useQuery } from '@tanstack/react-query';
import { locationApi } from '../api/location.api';

export const useProvinces = () =>
  useQuery({
    queryKey: ['locations', 'provinces'],
    queryFn: locationApi.provinces,
  });

export const useDistricts = (province) =>
  useQuery({
    queryKey: ['locations', 'districts', province],
    queryFn: () => locationApi.districts(province),
    enabled: Boolean(province),
  });

export const useMunicipalities = (province, district) =>
  useQuery({
    queryKey: ['locations', 'municipalities', province, district],
    queryFn: () => locationApi.municipalities(province, district),
    enabled: Boolean(province && district),
  });
