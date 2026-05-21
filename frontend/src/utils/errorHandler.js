const GENERIC_SERVER_MESSAGE = 'Something went wrong. Please try again.';
const NETWORK_ERROR_MESSAGE = 'Unable to connect to server. Please check your connection.';

const TECHNICAL_ERROR_PATTERNS = [
  /prisma/i,
  /invalid `prisma/i,
  /prismaclient/i,
  /server has closed the connection/i,
  /cannot read properties/i,
  /econnreset/i,
  /etimedout/i,
  /enotfound/i,
  /stack/i,
  /at\s+\w+/i,
  /column/i,
  /relation/i,
  /sql/i,
  /request failed with status code/i,
];

const isTechnicalMessage = (message) => {
  const text = String(message || '').trim();
  if (!text) return false;
  return TECHNICAL_ERROR_PATTERNS.some((pattern) => pattern.test(text));
};

const getMessageFromErrors = (errors) => {
  if (!Array.isArray(errors) || !errors.length) return null;

  const first = errors[0];
  if (typeof first === 'string') return first;
  if (first && typeof first === 'object') {
    return first.message || first.msg || null;
  }

  return null;
};

const statusFallback = (status, fallback) => {
  if (status === 401) return 'Your session has expired. Please login again.';
  if (status === 403) return 'You do not have permission to perform this action.';
  if (status === 404) return 'Requested resource was not found.';
  if (status === 409) return 'This action conflicts with existing data.';
  if (status === 422) return 'Please review the entered information and try again.';
  if (status === 429) return 'Too many requests. Please try again shortly.';
  if (status >= 500) return fallback || GENERIC_SERVER_MESSAGE;
  return fallback || GENERIC_SERVER_MESSAGE;
};

export const getErrorMessage = (error, fallback = GENERIC_SERVER_MESSAGE) => {
  const status = Number(error?.response?.status);
  const code = String(error?.code || '').toUpperCase();
  const backendMessage = error?.response?.data?.message;
  const backendValidationMessage = getMessageFromErrors(error?.response?.data?.errors);
  const rawMessage = String(error?.message || '').trim();
  const isTimeout = rawMessage.toLowerCase().includes('timeout') || code === 'ECONNABORTED';
  const isNetwork = !error?.response && (
    code === 'ERR_NETWORK'
    || code === 'ECONNREFUSED'
    || code === 'ENOTFOUND'
    || code === 'ECONNRESET'
    || code === 'ETIMEDOUT'
  );

  if (isNetwork) return NETWORK_ERROR_MESSAGE;
  if (isTimeout) return 'The request is taking too long. Please try again.';

  if (status >= 500) {
    return fallback || GENERIC_SERVER_MESSAGE;
  }

  if (backendValidationMessage && !isTechnicalMessage(backendValidationMessage)) {
    return backendValidationMessage;
  }

  if (backendMessage && !isTechnicalMessage(backendMessage)) {
    return backendMessage;
  }

  if (rawMessage && !isTechnicalMessage(rawMessage) && status >= 400 && status < 500) {
    return rawMessage;
  }

  if (status) return statusFallback(status, fallback);
  return fallback || GENERIC_SERVER_MESSAGE;
};
