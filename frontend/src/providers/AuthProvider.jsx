import { useEffect, useMemo, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import { api, unwrapResponse } from '../lib/axios';
import { appToast } from '../lib/toast';
import { clearAuthSession, getAccessToken, getStoredUser, setAccessToken, setStoredUser } from '../utils/storage';
import { getErrorMessage } from '../utils/errorHandler';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => getStoredUser());
  const [isBootstrapping, setIsBootstrapping] = useState(true);

  const refreshUser = async () => {
    const response = await api.get('/auth/me');
    const payload = unwrapResponse(response);
    const nextUser = payload?.user || payload;
    setUser(nextUser || null);
    setStoredUser(nextUser || null);
    return nextUser;
  };

  const login = async (credentials) => {
    const response = await api.post('/auth/login', credentials);
    const payload = unwrapResponse(response);
    const nextUser = payload?.user || payload;
    setUser(nextUser || null);
    setStoredUser(nextUser || null);
    setAccessToken(payload?.accessToken || null);
    appToast.success('Welcome back to SewaFi.');
    return payload;
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Ignore logout network errors and still clear local state.
    }

    clearAuthSession();
    setUser(null);
  };

  useEffect(() => {
    const bootstrap = async () => {
      const hasToken = Boolean(getAccessToken());
      const hasStoredUser = Boolean(getStoredUser());

      if (!hasToken && !hasStoredUser) {
        setIsBootstrapping(false);
        return;
      }

      try {
        await refreshUser();
      } catch {
        clearAuthSession();
        setUser(null);
      } finally {
        setIsBootstrapping(false);
      }
    };

    void bootstrap();
  }, []);

  useEffect(() => {
    const onUnauthorized = () => {
      clearAuthSession();
      setUser(null);
    };
    window.addEventListener('sewafi:unauthorized', onUnauthorized);
    return () => window.removeEventListener('sewafi:unauthorized', onUnauthorized);
  }, []);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isBootstrapping,
      setUser,
      refreshUser,
      login,
      logout,
      notifyAuthError: (error) => appToast.error(getErrorMessage(error)),
    }),
    [isBootstrapping, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
