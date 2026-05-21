const { Prisma } = require('@prisma/client');
const ApiError = require('../utils/ApiError');
const logger = require('../config/logger');

const GENERIC_SERVER_MESSAGE = 'Something went wrong. Please try again.';
const DATABASE_UNAVAILABLE_MESSAGE = 'Database connection issue. Please try again later.';

const TECHNICAL_MESSAGE_PATTERNS = [
  /prisma/i,
  /invalid `prisma/i,
  /prismaclient/i,
  /cannot read properties/i,
  /sql/i,
  /column/i,
  /relation/i,
  /stack/i,
  /at\s+\w+/i,
  /server has closed the connection/i,
  /econnreset/i,
  /etimedout/i,
  /enotfound/i,
];

const isTechnicalMessage = (message) => {
  const text = String(message || '');
  if (!text.trim()) return false;
  return TECHNICAL_MESSAGE_PATTERNS.some((pattern) => pattern.test(text));
};

const sanitizeMessage = ({ message, statusCode, isTrusted }) => {
  if (!message) {
    return statusCode >= 500 ? GENERIC_SERVER_MESSAGE : 'Unable to process this request.';
  }

  if (statusCode >= 500 && (!isTrusted || isTechnicalMessage(message))) {
    return GENERIC_SERVER_MESSAGE;
  }

  if (isTechnicalMessage(message)) {
    return GENERIC_SERVER_MESSAGE;
  }

  return message;
};

const formatValidationErrors = (err) => {
  if (Array.isArray(err?.errors) && err.errors.length) {
    return err.errors;
  }

  if (Array.isArray(err?.details) && err.details.length) {
    return err.details.map((item) => ({
      field: Array.isArray(item?.path) ? item.path.join('.') : item?.path,
      message: item?.message,
    }));
  }

  return undefined;
};

const mapPrismaError = (err) => {
  const prismaCode = err?.code;

  if (prismaCode === 'P2002') {
    return new ApiError(409, 'This record already exists.');
  }
  if (prismaCode === 'P2025') {
    return new ApiError(404, 'Requested record was not found.');
  }
  if (prismaCode === 'P2003') {
    return new ApiError(409, 'This action cannot be completed because related data exists.');
  }
  if (prismaCode === 'P1001' || prismaCode === 'P1017') {
    return new ApiError(503, DATABASE_UNAVAILABLE_MESSAGE);
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError || err instanceof Prisma.PrismaClientValidationError) {
    return new ApiError(500, GENERIC_SERVER_MESSAGE);
  }

  if (err instanceof Prisma.PrismaClientRustPanicError || err instanceof Prisma.PrismaClientInitializationError) {
    return new ApiError(503, DATABASE_UNAVAILABLE_MESSAGE);
  }

  return null;
};

const errorHandler = (err, req, res, next) => {
  const prismaMappedError = mapPrismaError(err);
  let error = prismaMappedError || err;
  const isTrustedError = error instanceof ApiError;

  if (!isTrustedError) {
    const statusCode = Number(error?.statusCode) || Number(error?.status) || 500;
    const rawMessage = error?.message || GENERIC_SERVER_MESSAGE;
    error = new ApiError(statusCode, rawMessage);
  }

  const statusCode = Number(error.statusCode) || 500;
  const responseMessage = sanitizeMessage({
    message: error.message,
    statusCode,
    isTrusted: error instanceof ApiError,
  });
  const validationErrors = formatValidationErrors(error) || formatValidationErrors(err);

  logger.error(`Request error on ${req.method} ${req.originalUrl}: ${err?.message || error?.message}`, {
    statusCode,
    stack: err?.stack,
    code: err?.code,
    name: err?.name,
    requestId: req?.id,
  });

  res.status(statusCode).json({
    success: false,
    message: responseMessage,
    ...(validationErrors ? { errors: validationErrors } : {}),
    ...(error.data !== undefined ? { data: error.data } : {}),
    ...(process.env.NODE_ENV === 'development' && { stack: err?.stack }),
  });
};

module.exports = errorHandler;
