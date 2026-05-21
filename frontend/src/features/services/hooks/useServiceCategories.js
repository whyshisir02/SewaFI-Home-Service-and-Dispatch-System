import { useQuery } from '@tanstack/react-query';
import { serviceApi } from '../api/service.api';

export const useServiceCategories = () =>
  useQuery({
    queryKey: ['service-categories'],
    queryFn: serviceApi.categories,
  });
