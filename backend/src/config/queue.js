const Queue = require('bull');
const env = require('./env');
const logger = require('./logger');

const redisUrl = env.REDIS_URL || process.env.REDIS_URL;

const buildRedisConfig = () => {
  if (redisUrl) {
    const parsedUrl = new URL(redisUrl);

    return {
      redis: {
        host: parsedUrl.hostname,
        port: Number(parsedUrl.port || 6379),
        username: parsedUrl.username ? decodeURIComponent(parsedUrl.username) : undefined,
        password: parsedUrl.password ? decodeURIComponent(parsedUrl.password) : undefined,
        tls: parsedUrl.protocol === 'rediss:' ? {} : undefined,
        enableReadyCheck: false,
        maxRetriesPerRequest: null,
      },
    };
  }

  return {
    redis: {
      host: env.REDIS_HOST || process.env.REDIS_HOST || 'localhost',
      port: Number(env.REDIS_PORT || process.env.REDIS_PORT || 6379),
      password: env.REDIS_PASSWORD || process.env.REDIS_PASSWORD || undefined,
      enableReadyCheck: false,
      maxRetriesPerRequest: null,
    },
  };
};

const redisConfig = buildRedisConfig();

// Create queues
const emailQueue = new Queue('emails', redisConfig);
const notificationQueue = new Queue('notifications', redisConfig);

// Queue event handlers
[emailQueue, notificationQueue].forEach((queue) => {
  queue.on('ready', () => logger.info(`✅ Queue ${queue.name} ready`));
  queue.on('error', (err) => logger.error(`Queue error in ${queue.name}: ${err.message}`));
  queue.on('failed', (job, err) => logger.warn(`Job ${job.id} in ${queue.name} failed: ${err.message}`));
  queue.on('completed', (job) => logger.info(`Job ${job.id} in ${queue.name} completed`));
});

module.exports = { emailQueue, notificationQueue };