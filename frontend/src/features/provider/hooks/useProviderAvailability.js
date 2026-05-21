import { useMutation } from '@tanstack/react-query';
import { providerApi } from '../api/provider.api';

export const useProviderAvailability = () =>
  useMutation({
    mutationFn: providerApi.updateAvailability,
  });
