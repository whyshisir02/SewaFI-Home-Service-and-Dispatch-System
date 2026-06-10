import axios from 'axios';
import { API_CONFIG } from '../config/api.config';
import { AUTH_EVENTS } from '../constants/auth-events.constant';
import { clearAuthSession, getAccessToken, setAccessToken, setStoredUser } from '../utils/storage';

export const api = axios.create({
  baseURL: API_CONFIG.baseURL,
  timeout: API_CONFIG.timeout,
  withCredentials: true,
});

let refreshPromise = null;

const dispatchUnauthorized = () => {
  window.dispatchEvent(new CustomEvent(AUTH_EVENTS.unauthorized));
};

const dispatchSessionRefreshed = (payload) => {
  window.dispatchEvent(
    new CustomEvent(AUTH_EVENTS.sessionRefreshed, {
      detail: payload,
    })
  );
};

const refreshSession = async () => {
  if (!refreshPromise) {
    refreshPromise = api
      .post('/auth/refresh', null, {
        skipAuthRefresh: true,
      })
      .then((response) => {
        const payload = unwrapResponse(response);
        const accessToken = payload?.accessToken || null;
        const user = payload?.user || null;

        setAccessToken(accessToken);
        setStoredUser(user);
        dispatchSessionRefreshed({ accessToken, user });

        return payload;
      })
      .catch((error) => {
        clearAuthSession();
        dispatchUnauthorized();
        throw error;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
};

api.interceptors.request.use((config) => {
  const token = getAccessToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config || {};
    const status = error.response?.status;

    if (status !== 401) {
      return Promise.reject(error);
    }

    if (originalRequest.skipAuthRefresh || originalRequest._retry) {
      clearAuthSession();
      dispatchUnauthorized();
      return Promise.reject(error);
    }

    try {
      originalRequest._retry = true;
      const session = await refreshSession();
      const token = session?.accessToken || getAccessToken();

      originalRequest.headers = originalRequest.headers || {};
      if (token) {
        originalRequest.headers.Authorization = `Bearer ${token}`;
      } else {
        delete originalRequest.headers.Authorization;
      }

      return api(originalRequest);
    } catch (refreshError) {
      return Promise.reject(refreshError);
    }
  }
);

export const unwrapResponse = (response) => response?.data?.data ?? response?.data ?? response;
