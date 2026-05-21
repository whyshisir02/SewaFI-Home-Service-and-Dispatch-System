import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSocketContext } from '../../../context/SocketContext';
import { SOCKET_EVENTS } from '../../../constants/socket-events.constant';
import { providerApi } from '../api/provider.api';
import { useServiceCategories } from '../../services/hooks/useServiceCategories';
import {
  useDistricts,
  useMunicipalities,
  useProvinces,
} from '../../location/hooks/useLocations';

export const useProviderAvailabilityPage = ({
  selectedProvince = '',
  selectedDistrict = '',
}) => {
  const queryClient = useQueryClient();
  const { socket } = useSocketContext();

  const profileQuery = useQuery({
    queryKey: ['provider-profile'],
    queryFn: providerApi.profile,
  });

  const categoriesQuery = useServiceCategories();
  const provincesQuery = useProvinces();
  const districtsQuery = useDistricts(selectedProvince);
  const municipalitiesQuery = useMunicipalities(selectedProvince, selectedDistrict);

  const updateAvailabilityMutation = useMutation({
    mutationFn: providerApi.updateAvailability,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['provider-profile'] });
      queryClient.invalidateQueries({ queryKey: ['provider-dashboard'] });
    },
  });

  useEffect(() => {
    if (!socket) return undefined;
    const refresh = () => {
      queryClient.invalidateQueries({ queryKey: ['provider-profile'] });
    };
    socket.on(SOCKET_EVENTS.notificationNew, refresh);
    return () => {
      socket.off(SOCKET_EVENTS.notificationNew, refresh);
    };
  }, [queryClient, socket]);

  return {
    profileQuery,
    categoriesQuery,
    provincesQuery,
    districtsQuery,
    municipalitiesQuery,
    updateAvailabilityMutation,
  };
};
