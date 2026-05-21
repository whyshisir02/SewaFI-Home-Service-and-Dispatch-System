import { useMutation } from '@tanstack/react-query';
import { authApi } from '../api/auth.api';

export const useResendOtp = ({ purpose = 'password-reset' } = {}) =>
  useMutation({
    mutationFn: (payload) =>
      purpose === 'registration' ? authApi.resendOtp(payload) : authApi.resendResetOtp(payload),
  });
