import { useMutation, useQueryClient } from '@tanstack/react-query';
import { bookingApi } from '../api/booking.api';
import { appToast } from '../../../lib/toast';
import { getErrorMessage } from '../../../utils/errorHandler';

export const useCreateBooking = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: bookingApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['customer-dashboard'] });
      appToast.success('Booking created successfully.');
    },
    onError: (error) => appToast.error(getErrorMessage(error)),
  });
};
