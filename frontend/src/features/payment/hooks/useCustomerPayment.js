import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { paymentApi } from '../api/payment.api';

export const useCustomerPayment = (bookingId) =>
  useQuery({
    queryKey: ['customer-payment', bookingId],
    queryFn: () => paymentApi.detailsByBooking(bookingId),
    enabled: Boolean(bookingId),
    retry: 1,
  });

export const usePaymentMethods = () =>
  useQuery({
    queryKey: ['payment-methods'],
    queryFn: paymentApi.methods,
    retry: 1,
  });

export const useConfirmPayment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: paymentApi.confirmByBooking,
    onSuccess: (_, variables) => {
      if (variables?.bookingId) {
        queryClient.invalidateQueries({ queryKey: ['customer-payment', variables.bookingId] });
        queryClient.invalidateQueries({ queryKey: ['booking-tracking', variables.bookingId] });
        queryClient.invalidateQueries({ queryKey: ['booking-details', variables.bookingId] });
      }
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['booking-detail'] });
      queryClient.invalidateQueries({ queryKey: ['booking-detail-timeline'] });
      queryClient.invalidateQueries({ queryKey: ['customer-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
    },
  });
};

export const useDisputePayment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: paymentApi.disputeByBooking,
    onSuccess: (_, variables) => {
      if (variables?.bookingId) {
        queryClient.invalidateQueries({ queryKey: ['customer-payment', variables.bookingId] });
        queryClient.invalidateQueries({ queryKey: ['booking-tracking', variables.bookingId] });
        queryClient.invalidateQueries({ queryKey: ['booking-details', variables.bookingId] });
      }
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['booking-detail'] });
      queryClient.invalidateQueries({ queryKey: ['booking-detail-timeline'] });
      queryClient.invalidateQueries({ queryKey: ['customer-bookings'] });
    },
  });
};
