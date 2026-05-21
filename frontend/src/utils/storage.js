const USER_KEY = 'sewafi-user';
const ACCESS_TOKEN_KEY = 'sewafi-access-token';

export const readJsonStorage = (key, fallback = null) => {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
};

export const writeJsonStorage = (key, value) => {
  localStorage.setItem(key, JSON.stringify(value));
};

export const getStoredUser = () => readJsonStorage(USER_KEY, null);

export const setStoredUser = (user) => {
  if (!user) {
    localStorage.removeItem(USER_KEY);
    return;
  }

  writeJsonStorage(USER_KEY, user);
};

export const getAccessToken = () => localStorage.getItem(ACCESS_TOKEN_KEY);

export const setAccessToken = (token) => {
  if (!token) {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    return;
  }

  localStorage.setItem(ACCESS_TOKEN_KEY, token);
};

export const clearAuthSession = () => {
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(ACCESS_TOKEN_KEY);
};
