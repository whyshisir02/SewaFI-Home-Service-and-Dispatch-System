import { useMutation } from '@tanstack/react-query';
import { authApi } from '../api/auth.api';

export const useVerifyResetOtp = () =>
  useMutation({
    mutationFn: authApi.verifyResetOtp,
  });

