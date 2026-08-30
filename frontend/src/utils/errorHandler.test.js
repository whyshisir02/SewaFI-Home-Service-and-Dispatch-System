import { describe, expect, it } from 'vitest';
import { getErrorMessage } from './errorHandler.js';

const axiosError = (status, message, extra = {}) => ({
  response: { status, data: { message } },
  message,
  ...extra,
});

describe('getErrorMessage', () => {
  it('returns a friendly message for a clean backend message', () => {
    expect(getErrorMessage(axiosError(400, 'Email already registered'))).toBe(
      'Email already registered'
    );
  });

  it('sanitizes Prisma/SQL leakage into a generic message', () => {
    const msg = getErrorMessage(
      axiosError(500, 'Invalid `prisma.user.findUnique()` invocation in relation column')
    );
    expect(msg).not.toMatch(/prisma/i);
    expect(msg).toBe('Something went wrong. Please try again.');
  });

  it('maps 401 without a backend message to session-expired', () => {
    expect(getErrorMessage({ response: { status: 401, data: {} } })).toMatch(
      /session has expired/i
    );
  });

  it('maps 403 without a backend message to permission denied', () => {
    expect(getErrorMessage({ response: { status: 403, data: {} } })).toMatch(/permission/i);
  });

  it('prefers a clean backend message over the status fallback', () => {
    expect(getErrorMessage(axiosError(403, 'Only admins can approve providers'))).toBe(
      'Only admins can approve providers'
    );
  });

  it('maps 429 to rate-limit message', () => {
    expect(getErrorMessage(axiosError(429, 'Too many requests'))).toMatch(/too many requests/i);
  });

  it('handles network errors without a response', () => {
    const msg = getErrorMessage({ code: 'ERR_NETWORK', message: 'Network Error' });
    expect(msg).toMatch(/unable to connect/i);
  });

  it('handles timeout errors', () => {
    const msg = getErrorMessage({ code: 'ECONNABORTED', message: 'timeout of 20000ms exceeded' });
    expect(msg).toBeTruthy();
  });

  it('returns fallback for null/undefined errors', () => {
    expect(getErrorMessage(null)).toBe('Something went wrong. Please try again.');
    expect(getErrorMessage(undefined, 'Custom fallback')).toBe('Custom fallback');
  });

  it('extracts first message from validation errors array', () => {
    const error = {
      response: {
        status: 422,
        data: { errors: [{ msg: 'Name is required' }, { msg: 'Email is invalid' }] },
      },
      message: 'Validation error',
    };
    expect(getErrorMessage(error)).toBe('Name is required');
  });
});
