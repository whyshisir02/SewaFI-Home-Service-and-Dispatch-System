import { useQuery } from '@tanstack/react-query';
import { paymentApi } from '../api/payment.api';

export const usePayments = () =>
  useQuery({
    queryKey: ['payments'],
    queryFn: paymentApi.list,
    retry: 1,
  });
