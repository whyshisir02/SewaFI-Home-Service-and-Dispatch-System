import { useMutation } from '@tanstack/react-query';
import { authApi } from '../api/auth.api';

export const useVerifyOtp = () =>
  useMutation({
    mutationFn: authApi.verifyOtp,
  });
