import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { SOCKET_EVENTS } from '../../../constants/socket-events.constant';
import { useSocketContext } from '../../../context/SocketContext';
import { appToast } from '../../../lib/toast';
import { notificationApi } from '../../notification/api/notification.api';
import { providerApi } from '../api/provider.api';
import { getProviderProfile, isProviderApproved, isProviderAvailable } from '../components/dashboard/providerDashboardUtils';
import { getErrorMessage } from '../../../utils/errorHandler';

export const providerDashboardKeys = {
  profile: ['provider-profile'],
  stats: ['provider-stats'],
  summary: ['provider-summary'],
  nearbyJobs: ['provider-nearby-jobs'],
  assignedJobs: ['provider-assigned-jobs'],
  notifications: ['notifications'],
};

export const useProviderDashboardData = () => {
  const queryClient = useQueryClient();

  const profileQuery = useQuery({
    queryKey: providerDashboardKeys.profile,
    queryFn: providerApi.profile,
    staleTime: 60_000,
  });

  const statsQuery = useQuery({
    queryKey: providerDashboardKeys.stats,
    queryFn: providerApi.stats,
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  });

  const providerProfile = getProviderProfile(profileQuery.data) || statsQuery.data?.profile;
  const approved = isProviderApproved(providerProfile);
  const available = isProviderAvailable(providerProfile);

  const nearbyJobsQuery = useQuery({
    queryKey: providerDashboardKeys.nearbyJobs,
    queryFn: providerApi.availableJobs,
    enabled: Boolean(approved),
    staleTime: 15_000,
    refetchOnWindowFocus: true,
    // TODO: Replace polling with Socket.IO provider job events once every backend job event is finalized.
    refetchInterval: approved && available ? 20_000 : false,
  });

  const assignedJobsQuery = useQuery({
    queryKey: providerDashboardKeys.assignedJobs,
    queryFn: providerApi.myJobs,
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  });

  const notificationsQuery = useQuery({
    queryKey: providerDashboardKeys.notifications,
    queryFn: notificationApi.list,
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  });

  const refetchProviderDashboard = () => {
    queryClient.invalidateQueries({ queryKey: providerDashboardKeys.profile });
    queryClient.invalidateQueries({ queryKey: providerDashboardKeys.stats });
    queryClient.invalidateQueries({ queryKey: providerDashboardKeys.summary });
    queryClient.invalidateQueries({ queryKey: providerDashboardKeys.nearbyJobs });
    queryClient.invalidateQueries({ queryKey: providerDashboardKeys.assignedJobs });
    queryClient.invalidateQueries({ queryKey: providerDashboardKeys.notifications });
  };

  const availabilityMutation = useMutation({
    mutationFn: providerApi.updateAvailability,
    onSuccess: () => {
      refetchProviderDashboard();
      appToast.success('Availability updated');
    },
    onError: (error) => {
      appToast.error(getErrorMessage(error, 'Unable to update availability.'));
    },
  });

  const acceptJobMutation = useMutation({
    mutationFn: providerApi.acceptJob,
    onSuccess: () => {
      refetchProviderDashboard();
      appToast.success('Job accepted');
    },
    onError: (error) => {
      appToast.error(getErrorMessage(error, 'This job is no longer available.'));
    },
  });

  return {
    profileQuery,
    statsQuery,
    nearbyJobsQuery,
    assignedJobsQuery,
    notificationsQuery,
    availabilityMutation,
    acceptJobMutation,
    refetchProviderDashboard,
  };
};

export const useProviderDashboardSocket = () => {
  const { socket } = useSocketContext();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!socket) return undefined;

    const refreshJobs = () => {
      queryClient.invalidateQueries({ queryKey: providerDashboardKeys.stats });
      queryClient.invalidateQueries({ queryKey: providerDashboardKeys.summary });
      queryClient.invalidateQueries({ queryKey: providerDashboardKeys.nearbyJobs });
      queryClient.invalidateQueries({ queryKey: providerDashboardKeys.assignedJobs });
      queryClient.invalidateQueries({ queryKey: providerDashboardKeys.notifications });
    };

    [
      SOCKET_EVENTS.provider.backendNewJob,
      SOCKET_EVENTS.provider.backendJobTaken,
      'booking:update',
      SOCKET_EVENTS.notificationNew,
    ].forEach((eventName) => socket.on(eventName, refreshJobs));

    return () => {
      [
        SOCKET_EVENTS.provider.backendNewJob,
        SOCKET_EVENTS.provider.backendJobTaken,
        'booking:update',
        SOCKET_EVENTS.notificationNew,
      ].forEach((eventName) => socket.off(eventName, refreshJobs));
    };
  }, [queryClient, socket]);
};
