import { useMutation } from '@tanstack/react-query';
import { authApi } from '../api/auth.api';

export const useRegister = (role) => {
  const sendOtpMutation = useMutation({
    mutationFn: (payload) => {
      const normalizedEmail = typeof payload === 'string' ? payload : payload?.email;
      return authApi.sendOtp({ email: normalizedEmail });
    },
  });

  const registerMutation = useMutation({
    mutationFn: (payload) =>
      role === 'provider' ? authApi.registerProvider(payload) : authApi.registerCustomer(payload),
  });

  return { sendOtpMutation, registerMutation };
};
