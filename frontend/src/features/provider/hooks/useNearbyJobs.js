import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSocketContext } from '../../../context/SocketContext';
import { SOCKET_EVENTS } from '../../../constants/socket-events.constant';
import { providerApi } from '../api/provider.api';
import { getProviderProfile, isProviderAvailable } from '../../../components/provider/providerDashboardUtils';

const PROVIDER_APPROVED = 'APPROVED';

export const useNearbyJobs = (filters = {}) => {
  const queryClient = useQueryClient();
  const { socket } = useSocketContext();

  const profileQuery = useQuery({
    queryKey: ['provider-profile'],
    queryFn: providerApi.profile,
  });

  const providerProfile = getProviderProfile(profileQuery.data);
  const providerStatus = providerProfile?.status || profileQuery.data?.providerProfile?.status;
  const approved = providerStatus === PROVIDER_APPROVED;
  const available = isProviderAvailable(providerProfile);

  const nearbyJobsQuery = useQuery({
    queryKey: ['provider-nearby-jobs', filters],
    queryFn: () => providerApi.availableJobs(filters),
    enabled: approved && available,
  });

  const acceptJobMutation = useMutation({
    mutationFn: providerApi.acceptJob,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['provider-nearby-jobs'] });
      queryClient.invalidateQueries({ queryKey: ['provider-available-jobs'] });
      queryClient.invalidateQueries({ queryKey: ['provider-assigned-jobs'] });
      queryClient.invalidateQueries({ queryKey: ['provider-jobs'] });
      queryClient.invalidateQueries({ queryKey: ['provider-stats'] });
      queryClient.invalidateQueries({ queryKey: ['provider-summary'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
    },
  });

  const rejectJobMutation = useMutation({
    mutationFn: providerApi.rejectJob,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['provider-nearby-jobs'] });
      queryClient.invalidateQueries({ queryKey: ['provider-available-jobs'] });
      queryClient.invalidateQueries({ queryKey: ['provider-assigned-jobs'] });
      queryClient.invalidateQueries({ queryKey: ['provider-jobs'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
    },
  });

  const availabilityMutation = useMutation({
    mutationFn: providerApi.updateAvailability,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['provider-profile'] });
      queryClient.invalidateQueries({ queryKey: ['provider-nearby-jobs'] });
      queryClient.invalidateQueries({ queryKey: ['provider-stats'] });
      queryClient.invalidateQueries({ queryKey: ['provider-summary'] });
    },
  });

  useEffect(() => {
    if (!approved || !available) return undefined;

    const refreshNearby = () => {
      queryClient.invalidateQueries({ queryKey: ['provider-nearby-jobs'] });
    };

    if (socket) {
      socket.on(SOCKET_EVENTS.provider.newNearbyJob, refreshNearby);
      socket.on(SOCKET_EVENTS.provider.backendNewJob, refreshNearby);
      socket.on(SOCKET_EVENTS.provider.jobTakenByOther, refreshNearby);
      socket.on(SOCKET_EVENTS.provider.backendJobTaken, refreshNearby);
      socket.on(SOCKET_EVENTS.customer.bookingCreated, refreshNearby);
      socket.on(SOCKET_EVENTS.customer.bookingAccepted, refreshNearby);

      return () => {
        socket.off(SOCKET_EVENTS.provider.newNearbyJob, refreshNearby);
        socket.off(SOCKET_EVENTS.provider.backendNewJob, refreshNearby);
        socket.off(SOCKET_EVENTS.provider.jobTakenByOther, refreshNearby);
        socket.off(SOCKET_EVENTS.provider.backendJobTaken, refreshNearby);
        socket.off(SOCKET_EVENTS.customer.bookingCreated, refreshNearby);
        socket.off(SOCKET_EVENTS.customer.bookingAccepted, refreshNearby);
      };
    }

    // TODO: Replace polling with Socket.IO provider job events when backend event contract is finalized.
    const intervalId = window.setInterval(() => {
      if (document.visibilityState === 'visible') refreshNearby();
    }, 20_000);

    return () => window.clearInterval(intervalId);
  }, [approved, available, queryClient, socket]);

  return {
    profileQuery,
    nearbyJobsQuery,
    acceptJobMutation,
    rejectJobMutation,
    availabilityMutation,
    providerProfile,
    providerStatus,
    approved,
    available,
  };
};
