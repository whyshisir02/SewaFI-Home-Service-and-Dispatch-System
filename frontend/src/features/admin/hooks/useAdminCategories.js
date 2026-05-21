import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../api/admin.api';

export const useAdminCategories = (filters = {}) => {
  const queryClient = useQueryClient();

  const categoriesQuery = useQuery({
    queryKey: ['admin-categories', filters],
    queryFn: () => adminApi.categories(filters),
  });

  const statsQuery = useQuery({
    queryKey: ['admin-stats'],
    queryFn: adminApi.stats,
  });

  const createCategoryMutation = useMutation({
    mutationFn: adminApi.createCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
    },
  });

  const updateCategoryMutation = useMutation({
    mutationFn: adminApi.updateCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
    },
  });

  const toggleCategoryMutation = useMutation({
    mutationFn: adminApi.updateCategoryStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
    },
  });

  const archiveCategoryMutation = useMutation({
    mutationFn: adminApi.archiveCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: adminApi.deleteCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
    },
  });

  return {
    categoriesQuery,
    statsQuery,
    createCategoryMutation,
    updateCategoryMutation,
    toggleCategoryMutation,
    archiveCategoryMutation,
    deleteCategoryMutation,
  };
};

export const useAdminCategoryDetails = (id) =>
  useQuery({
    queryKey: ['admin-category-details', id],
    queryFn: () => adminApi.categoryDetails(id),
    enabled: Boolean(id),
  });
