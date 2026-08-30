import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSocketContext } from '../../../context/SocketContext';
import { SOCKET_EVENTS } from '../../../constants/socket-events.constant';
import { providerApi } from '../api/provider.api';
import { getProviderProfile } from '../components/dashboard/providerDashboardUtils';

export const useAssignedJobs = (filters = {}) => {
  const queryClient = useQueryClient();
  const { socket } = useSocketContext();

  const profileQuery = useQuery({
    queryKey: ['provider-profile'],
    queryFn: providerApi.profile,
  });

  const providerProfile = getProviderProfile(profileQuery.data);
  const providerStatus = providerProfile?.status;
  const approved = providerStatus === 'APPROVED';

  const assignedJobsQuery = useQuery({
    queryKey: ['provider-assigned-jobs', filters],
    queryFn: () => providerApi.myJobs(filters),
    enabled: approved,
  });

  const updateStatusMutation = useMutation({
    mutationFn: providerApi.updateJobStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['provider-assigned-jobs'] });
      queryClient.invalidateQueries({ queryKey: ['provider-jobs'] });
      queryClient.invalidateQueries({ queryKey: ['provider-stats'] });
      queryClient.invalidateQueries({ queryKey: ['provider-summary'] });
      queryClient.invalidateQueries({ queryKey: ['booking-detail'] });
      queryClient.invalidateQueries({ queryKey: ['booking-detail-timeline'] });
    },
  });

  useEffect(() => {
    if (!approved) return undefined;

    const refreshAssigned = () => {
      queryClient.invalidateQueries({ queryKey: ['provider-assigned-jobs'] });
    };

    if (socket) {
      socket.on(SOCKET_EVENTS.customer.bookingStatusUpdated, refreshAssigned);
      socket.on(SOCKET_EVENTS.customer.bookingCancelled, refreshAssigned);
      socket.on(SOCKET_EVENTS.customer.bookingCompleted, refreshAssigned);
      socket.on(SOCKET_EVENTS.provider.backendJobTaken, refreshAssigned);
      socket.on(SOCKET_EVENTS.notificationNew, refreshAssigned);

      return () => {
        socket.off(SOCKET_EVENTS.customer.bookingStatusUpdated, refreshAssigned);
        socket.off(SOCKET_EVENTS.customer.bookingCancelled, refreshAssigned);
        socket.off(SOCKET_EVENTS.customer.bookingCompleted, refreshAssigned);
        socket.off(SOCKET_EVENTS.provider.backendJobTaken, refreshAssigned);
        socket.off(SOCKET_EVENTS.notificationNew, refreshAssigned);
      };
    }

    // TODO: Replace polling with Socket.IO assigned job events when event contract is finalized.
    const intervalId = window.setInterval(() => {
      if (document.visibilityState === 'visible') refreshAssigned();
    }, 30_000);

    return () => window.clearInterval(intervalId);
  }, [approved, queryClient, socket]);

  return {
    profileQuery,
    providerStatus,
    approved,
    assignedJobsQuery,
    updateStatusMutation,
  };
};
