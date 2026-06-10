import { useEffect, useMemo, useState } from 'react';
import { AUTH_EVENTS } from '../constants/auth-events.constant';
import { AuthContext } from '../context/AuthContext';
import { api, unwrapResponse } from '../lib/axios';
import { appToast } from '../lib/toast';
import { clearAuthSession, getAccessToken, getStoredUser, setAccessToken, setStoredUser } from '../utils/storage';
import { getErrorMessage } from '../utils/errorHandler';

const ADMIN_IDLE_WARNING_MS = 25 * 60 * 1000;
const ADMIN_IDLE_TIMEOUT_MS = 30 * 60 * 1000;

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

    const onSessionRefreshed = (event) => {
      const nextUser = event?.detail?.user || null;
      const nextAccessToken = event?.detail?.accessToken || null;

      if (nextAccessToken) {
        setAccessToken(nextAccessToken);
      }

      setUser(nextUser);
      setStoredUser(nextUser);
    };

    window.addEventListener(AUTH_EVENTS.unauthorized, onUnauthorized);
    window.addEventListener(AUTH_EVENTS.sessionRefreshed, onSessionRefreshed);

    return () => {
      window.removeEventListener(AUTH_EVENTS.unauthorized, onUnauthorized);
      window.removeEventListener(AUTH_EVENTS.sessionRefreshed, onSessionRefreshed);
    };
  }, []);

  useEffect(() => {
    if (isBootstrapping || !user || user.role !== 'ADMIN') {
      return undefined;
    }

    let warningTimeoutId;
    let logoutTimeoutId;

    const clearTimers = () => {
      window.clearTimeout(warningTimeoutId);
      window.clearTimeout(logoutTimeoutId);
    };

    const performIdleLogout = async () => {
      appToast.error('Admin session timed out due to inactivity.');
      try {
        await api.post('/auth/logout');
      } catch {
        // Ignore logout network errors and still clear local state.
      }

      clearAuthSession();
      setUser(null);
    };

    const scheduleIdleTimers = () => {
      clearTimers();

      warningTimeoutId = window.setTimeout(() => {
        appToast.info('You have been inactive. Your admin session will end in 5 minutes.');
      }, ADMIN_IDLE_WARNING_MS);

      logoutTimeoutId = window.setTimeout(() => {
        void performIdleLogout();
      }, ADMIN_IDLE_TIMEOUT_MS);
    };

    const handleActivity = () => {
      scheduleIdleTimers();
    };

    scheduleIdleTimers();

    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'pointerdown'];
    events.forEach((eventName) => window.addEventListener(eventName, handleActivity, { passive: true }));

    return () => {
      clearTimers();
      events.forEach((eventName) => window.removeEventListener(eventName, handleActivity));
    };
  }, [isBootstrapping, user]);

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
