const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

const safeSocketUrl = () => {
  try {
    const url = new URL(apiBaseUrl);
    return `${url.protocol}//${url.host}`;
  } catch {
    return 'http://localhost:5000';
  }
};

export const API_CONFIG = {
  baseURL: apiBaseUrl,
  timeout: 20000,
  socketURL: import.meta.env.VITE_SOCKET_URL || safeSocketUrl(),
};
