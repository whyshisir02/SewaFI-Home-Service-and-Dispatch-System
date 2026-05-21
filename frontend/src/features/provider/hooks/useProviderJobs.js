import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { providerApi } from '../api/provider.api';

export const useProviderJobs = () => {
  const queryClient = useQueryClient();

  const availableJobsQuery = useQuery({
    queryKey: ['provider-available-jobs'],
    queryFn: providerApi.availableJobs,
  });

  const myJobsQuery = useQuery({
    queryKey: ['provider-jobs'],
    queryFn: providerApi.myJobs,
  });

  const acceptJobMutation = useMutation({
    mutationFn: providerApi.acceptJob,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['provider-available-jobs'] });
      queryClient.invalidateQueries({ queryKey: ['provider-jobs'] });
      queryClient.invalidateQueries({ queryKey: ['provider-dashboard'] });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: providerApi.updateJobStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['provider-jobs'] });
      queryClient.invalidateQueries({ queryKey: ['provider-dashboard'] });
    },
  });

  return { availableJobsQuery, myJobsQuery, acceptJobMutation, updateStatusMutation };
};
