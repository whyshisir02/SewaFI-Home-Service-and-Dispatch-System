import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { api, unwrapResponse } from './axios.js';
import { AUTH_EVENTS } from '../constants/auth-events.constant';
import { clearAuthSession, getAccessToken, setAccessToken } from '../utils/storage';

// Mock the refresh endpoint at the adapter level so interceptor logic runs for real.
const mockAdapter = vi.fn();

describe('axios interceptors', () => {
  beforeEach(() => {
    localStorage.clear();
    api.defaults.adapter = mockAdapter;
  });

  afterEach(() => {
    delete api.defaults.adapter;
    vi.clearAllMocks();
  });

  it('attaches Bearer token from storage to requests', async () => {
    setAccessToken('token-abc');
    mockAdapter.mockResolvedValueOnce({ data: { data: { ok: true } }, status: 200, config: {} });

    await api.get('/anything');

    expect(mockAdapter).toHaveBeenCalledTimes(1);
    const config = mockAdapter.mock.calls[0][0];
    expect(config.headers.Authorization).toBe('Bearer token-abc');
  });

  it('does not attach Authorization header when no token stored', async () => {
    mockAdapter.mockResolvedValueOnce({ data: { data: { ok: true } }, status: 200, config: {} });

    await api.get('/anything');

    const config = mockAdapter.mock.calls[0][0];
    expect(config.headers.Authorization).toBeUndefined();
  });

  it('retries the original request once after a successful token refresh on 401', async () => {
    setAccessToken('expired-token');

    let protectedCalls = 0;

    mockAdapter.mockImplementation((config) => {
      if (config.url === '/auth/refresh') {
        return Promise.resolve({
          data: { data: { accessToken: 'fresh-token', user: { id: 'u1' } } },
          status: 200,
          config,
        });
      }

      protectedCalls += 1;
      if (protectedCalls === 1) {
        return Promise.reject({ response: { status: 401 }, config, message: 'Unauthorized' });
      }

      return Promise.resolve({ data: { data: { ok: true } }, status: 200, config });
    });

    const response = await api.get('/protected');

    expect(response.data.data).toEqual({ ok: true });
    expect(getAccessToken()).toBe('fresh-token');
    expect(protectedCalls).toBe(2);

    // Retried request must carry the fresh token
    const retryConfig = mockAdapter.mock.calls.at(-1)[0];
    expect(retryConfig.headers.Authorization).toBe('Bearer fresh-token');
  });

  it('does not retry twice for the same request (_retry flag)', async () => {
    setAccessToken('expired-token');

    let refreshCalls = 0;

    mockAdapter.mockImplementation((config) => {
      if (config.url === '/auth/refresh') {
        refreshCalls += 1;
        return Promise.resolve({
          data: { data: { accessToken: 'fresh-token' } },
          status: 200,
          config,
        });
      }

      return Promise.reject({ response: { status: 401 }, config, message: 'Unauthorized' });
    });

    await expect(api.get('/protected')).rejects.toBeTruthy();

    // original + refresh + retry = 3 adapter calls; refresh must happen only once
    expect(mockAdapter).toHaveBeenCalledTimes(3);
    expect(refreshCalls).toBe(1);
  });

  it('clears session and dispatches unauthorized when refresh fails', async () => {
    setAccessToken('expired-token');
    const unauthorizedListener = vi.fn();
    window.addEventListener(AUTH_EVENTS.unauthorized, unauthorizedListener);

    mockAdapter.mockImplementation((config) => {
      if (config.url === '/auth/refresh') {
        return Promise.reject({ response: { status: 403 }, config, message: 'Refresh denied' });
      }
      return Promise.reject({ response: { status: 401 }, config, message: 'Unauthorized' });
    });

    await expect(api.get('/protected')).rejects.toBeTruthy();

    expect(getAccessToken()).toBeNull();
    expect(unauthorizedListener).toHaveBeenCalledTimes(1);
    window.removeEventListener(AUTH_EVENTS.unauthorized, unauthorizedListener);
  });

  it('skips refresh for requests marked skipAuthRefresh', async () => {
    mockAdapter.mockImplementationOnce((config) =>
      Promise.reject({ response: { status: 401 }, config, message: 'Unauthorized' })
    );

    await expect(
      api.post('/auth/refresh', null, { skipAuthRefresh: true })
    ).rejects.toBeTruthy();

    // Only the original call — no refresh retry loop
    expect(mockAdapter).toHaveBeenCalledTimes(1);
  });
});

describe('unwrapResponse', () => {
  it('unwraps the { data: { data } } envelope', () => {
    expect(unwrapResponse({ data: { data: { id: 1 } } })).toEqual({ id: 1 });
  });

  it('falls back to response.data when envelope data is missing', () => {
    expect(unwrapResponse({ data: { message: 'ok' } })).toEqual({ message: 'ok' });
  });

  it('returns the response itself as last resort', () => {
    expect(unwrapResponse('raw')).toBe('raw');
  });
});

describe('storage utils', () => {
  it('setAccessToken(null) removes the token', () => {
    setAccessToken('abc');
    setAccessToken(null);
    expect(getAccessToken()).toBeNull();
  });

  it('clearAuthSession removes both token and user', () => {
    setAccessToken('abc');
    localStorage.setItem('sewafi-user', JSON.stringify({ id: 1 }));
    clearAuthSession();
    expect(getAccessToken()).toBeNull();
    expect(localStorage.getItem('sewafi-user')).toBeNull();
  });
});
