import { api, unwrapResponse } from '../../../lib/axios';

const postWithFallback = async (paths, payload, config) => {
  let lastError;

  for (const path of paths) {
    try {
      const response = await api.post(path, payload, config);
      return unwrapResponse(response);
    } catch (error) {
      lastError = error;
      if (error?.response?.status !== 404) {
        throw error;
      }
    }
  }

  throw lastError;
};

const postWithPayloadVariants = async (paths, payloadVariants, config) => {
  let lastError;

  for (const payload of payloadVariants) {
    try {
      return await postWithFallback(paths, payload, config);
    } catch (error) {
      lastError = error;
      if (error?.response?.status && error.response.status >= 500) {
        throw error;
      }
    }
  }

  throw lastError;
};

export const authApi = {
  login: (payload) => api.post('/auth/login', payload).then(unwrapResponse),
  logout: () => api.post('/auth/logout').then(unwrapResponse),
  sendOtp: (payload) =>
    postWithFallback(
      [
        '/auth/send-otp',
        '/auth/request-otp',
      ],
      payload
    ),
  verifyOtp: (payload) =>
    postWithFallback(
      [
        '/auth/verify-otp',
      ],
      payload
    ),
  registerCustomer: (payload) => api.post('/auth/register-customer', payload).then(unwrapResponse),
  registerProvider: (payload) =>
    api
      .post('/auth/register-provider', payload, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then(unwrapResponse),
  forgotPassword: (payload) =>
    postWithPayloadVariants(
      [
        '/auth/forgot-password',
        '/auth/request-password-reset',
        '/auth/send-reset-otp',
      ],
      [
        { email: payload?.identifier || payload?.email || '' },
        { identifier: payload?.identifier || payload?.email || '' },
      ]
    ),
  verifyResetOtp: (payload) =>
    postWithPayloadVariants(
      [
        '/auth/verify-reset-otp',
        '/auth/verify-otp',
      ],
      [
        { email: payload?.identifier || payload?.email || '', otp: payload?.otp || '' },
        {
          identifier: payload?.identifier || payload?.email || '',
          otp: payload?.otp || '',
        },
        {
          email: payload?.identifier || payload?.email || '',
          otp: payload?.otp || '',
          purpose: 'PASSWORD_RESET',
        },
      ]
    ),
  resendResetOtp: (payload) =>
    postWithPayloadVariants(
      ['/auth/forgot-password'],
      [{ email: payload?.identifier || payload?.email || '' }]
    ),
  resendOtp: (payload) =>
    postWithPayloadVariants(
      ['/auth/send-otp', '/auth/request-otp'],
      [{ email: payload?.email || payload?.identifier || '' }]
    ),
  resetPassword: async (payload) => {
    const body = {
      email: String(payload?.identifier || payload?.email || '').trim().toLowerCase(),
      otp: String(payload?.otp || '').trim(),
      newPassword: String(payload?.newPassword || payload?.password || ''),
    };
    const response = await api.post('/auth/reset-password', body);
    return unwrapResponse(response);
  },
};
