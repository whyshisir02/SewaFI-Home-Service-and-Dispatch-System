import axios from 'axios';
import { API_CONFIG } from '../config/api.config';
import { clearAuthSession, getAccessToken } from '../utils/storage';

export const api = axios.create({
  baseURL: API_CONFIG.baseURL,
  timeout: API_CONFIG.timeout,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = getAccessToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      clearAuthSession();
      window.dispatchEvent(new CustomEvent('sewafi:unauthorized'));
    }

    return Promise.reject(error);
  }
);

export const unwrapResponse = (response) => response?.data?.data ?? response?.data ?? response;
