import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../api/admin.api';
import { useServiceCategories } from '../../services/hooks/useServiceCategories';

export const useAdminServices = (filters = {}) => {
  const queryClient = useQueryClient();

  const servicesQuery = useQuery({
    queryKey: ['admin-services', filters],
    queryFn: () => adminApi.services(filters),
  });

  const statsQuery = useQuery({
    queryKey: ['admin-service-stats'],
    queryFn: adminApi.serviceStats,
  });

  const subCategoriesQuery = useQuery({
    queryKey: ['admin-subcategories'],
    queryFn: () => adminApi.subcategories(),
  });

  const categoriesQuery = useServiceCategories();

  const createServiceMutation = useMutation({
    mutationFn: adminApi.createService,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-services'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
    },
  });

  const updateServiceMutation = useMutation({
    mutationFn: adminApi.updateService,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-services'] });
    },
  });

  const toggleServiceMutation = useMutation({
    mutationFn: adminApi.updateServiceStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-services'] });
    },
  });

  const archiveServiceMutation = useMutation({
    mutationFn: adminApi.archiveService,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-services'] });
    },
  });

  const deleteServiceMutation = useMutation({
    mutationFn: adminApi.deleteService,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-services'] });
    },
  });

  return {
    servicesQuery,
    statsQuery,
    categoriesQuery,
    subCategoriesQuery,
    createServiceMutation,
    updateServiceMutation,
    toggleServiceMutation,
    archiveServiceMutation,
    deleteServiceMutation,
  };
};

export const useAdminServiceDetails = (id) =>
  useQuery({
    queryKey: ['admin-service-details', id],
    queryFn: () => adminApi.serviceDetails(id),
    enabled: Boolean(id),
  });
