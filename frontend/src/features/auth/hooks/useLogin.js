import { useMutation } from '@tanstack/react-query';
import { useAuth } from '../../../context/AuthContext';

export const useLogin = () => {
  const { login } = useAuth();
  return useMutation({
    mutationFn: login,
  });
};
