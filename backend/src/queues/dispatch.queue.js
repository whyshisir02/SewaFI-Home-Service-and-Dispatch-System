const { Queue } = require('bullmq');
const env = require('../config/env');
const logger = require('../config/logger');

const DISPATCH_QUEUE_NAME = 'dispatch';
const DISPATCH_JOB_NAMES = {
  bookingCreated: 'dispatch.booking.created',
  bookingEscalate: 'dispatch.booking.escalate',
  bookingExpire: 'dispatch.booking.expire',
};

const DEFAULT_JOB_OPTIONS = {
  attempts: 3,
  backoff: {
    type: 'exponential',
    delay: 1000,
  },
  removeOnComplete: { age: 24 * 60 * 60, count: 2000 },
  removeOnFail: { age: 7 * 24 * 60 * 60, count: 5000 },
};

const DISPATCH_ESCALATION_MS = Number(env.DISPATCH_ESCALATION_MS || 2 * 60 * 1000);

const buildRedisConnection = () => {
  const redisUrl = env.REDIS_URL || process.env.REDIS_URL;

  if (redisUrl) {
    const parsed = new URL(redisUrl);
    return {
      host: parsed.hostname,
      port: Number(parsed.port || 6379),
      username: parsed.username ? decodeURIComponent(parsed.username) : undefined,
      password: parsed.password ? decodeURIComponent(parsed.password) : undefined,
      tls: parsed.protocol === 'rediss:' ? {} : undefined,
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
    };
  }

  return {
    host: process.env.REDIS_HOST || 'localhost',
    port: Number(process.env.REDIS_PORT || 6379),
    password: process.env.REDIS_PASSWORD || undefined,
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
  };
};

let dispatchQueue;

const getDispatchQueue = () => {
  if (dispatchQueue) return dispatchQueue;

  try {
    dispatchQueue = new Queue(DISPATCH_QUEUE_NAME, {
      connection: buildRedisConnection(),
      defaultJobOptions: DEFAULT_JOB_OPTIONS,
    });
  } catch (error) {
    logger.error(`[dispatch-queue] Failed to initialize queue: ${error.message}`);
    dispatchQueue = null;
  }

  return dispatchQueue;
};

const isDispatchQueueReady = () => Boolean(getDispatchQueue());

const addDispatchJob = async (name, data, options = {}) => {
  const queue = getDispatchQueue();
  if (!queue) {
    throw new Error('Dispatch queue is unavailable');
  }

  return queue.add(name, data, {
    ...options,
  });
};

const enqueueDispatchCreatedJob = async ({ bookingId }) =>
  addDispatchJob(
    DISPATCH_JOB_NAMES.bookingCreated,
    { bookingId },
    {
      jobId: `${DISPATCH_JOB_NAMES.bookingCreated}:${bookingId}`,
    }
  );

const enqueueDispatchEscalationJob = async ({ bookingId, delayMs = DISPATCH_ESCALATION_MS }) =>
  addDispatchJob(
    DISPATCH_JOB_NAMES.bookingEscalate,
    { bookingId },
    {
      delay: Math.max(0, Number(delayMs) || DISPATCH_ESCALATION_MS),
      jobId: `${DISPATCH_JOB_NAMES.bookingEscalate}:${bookingId}`,
    }
  );

const enqueueDispatchExpiryJob = async ({ bookingId, runAt }) => {
  const targetTime = runAt ? new Date(runAt).getTime() : Date.now();
  const delay = Math.max(0, targetTime - Date.now());
  return addDispatchJob(
    DISPATCH_JOB_NAMES.bookingExpire,
    { bookingId },
    {
      delay,
      jobId: `${DISPATCH_JOB_NAMES.bookingExpire}:${bookingId}`,
    }
  );
};

module.exports = {
  DISPATCH_QUEUE_NAME,
  DISPATCH_JOB_NAMES,
  DISPATCH_ESCALATION_MS,
  buildRedisConnection,
  isDispatchQueueReady,
  enqueueDispatchCreatedJob,
  enqueueDispatchEscalationJob,
  enqueueDispatchExpiryJob,
};
