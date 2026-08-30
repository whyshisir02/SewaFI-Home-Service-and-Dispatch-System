import { useQuery } from '@tanstack/react-query';
import { serviceApi } from '../../services/api/service.api';
import { toArray } from '../../../utils/collection';

export const useCategoryServices = ({ categoryId, categorySlug, search }) =>
  useQuery({
    queryKey: ['category-services', categoryId, categorySlug, search],
    queryFn: async () => {
      const payload = await serviceApi.list({
        ...(categoryId ? { category: categoryId } : {}),
        ...(!categoryId && categorySlug ? { categorySlug } : {}),
        ...(search ? { search } : {}),
      });

      return toArray(payload, ['services']).filter((service) => service?.isActive !== false);
    },
    enabled: Boolean(categoryId || categorySlug),
    retry: 1,
    staleTime: 5 * 60_000,
  });

export default useCategoryServices;
