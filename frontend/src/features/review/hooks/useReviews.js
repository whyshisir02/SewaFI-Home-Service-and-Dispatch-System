import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { reviewApi } from '../api/review.api';

export const useReviews = (scope = 'my', providerId, filters = {}) => {
  const queryKey = ['reviews', scope, providerId, filters];
  const queryFn =
    scope === 'received'
      ? () => reviewApi.received(filters)
      : scope === 'all'
        ? () => reviewApi.all(filters)
        : scope === 'provider'
          ? () => reviewApi.provider(providerId, filters)
          : () => reviewApi.my(filters);

  return useQuery({
    queryKey,
    queryFn,
    enabled: scope !== 'provider' || Boolean(providerId),
    retry: 1,
  });
};

export const useCreateReview = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: reviewApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
      queryClient.invalidateQueries({ queryKey: ['booking-details'] });
      queryClient.invalidateQueries({ queryKey: ['booking-detail'] });
      queryClient.invalidateQueries({ queryKey: ['customer-bookings'] });
    },
  });
};
