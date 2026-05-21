import { useMutation } from '@tanstack/react-query';
import { useAuth } from '../../../context/AuthContext';

export const useLogout = () => {
  const { logout } = useAuth();
  return useMutation({
    mutationFn: logout,
  });
};
