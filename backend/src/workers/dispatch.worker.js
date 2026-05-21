const { Worker } = require('bullmq');
const logger = require('../config/logger');
const {
  DISPATCH_QUEUE_NAME,
  DISPATCH_JOB_NAMES,
  DISPATCH_ESCALATION_MS,
  buildRedisConnection,
  enqueueDispatchEscalationJob,
} = require('../queues/dispatch.queue');
const {
  processDispatchCreated,
  processDispatchEscalation,
  expirePendingBookingById,
} = require('../modules/bookings/dispatch.service');

let dispatchWorker;

const processDispatchJob = async (job) => {
  const bookingId = job?.data?.bookingId;
  if (!bookingId) {
    logger.warn(`[dispatch-worker] Missing bookingId for job ${job?.id}`);
    return;
  }

  logger.info(`[dispatch-worker] Started ${job.name} for booking ${bookingId}`);

  if (job.name === DISPATCH_JOB_NAMES.bookingCreated) {
    const result = await processDispatchCreated(bookingId, {
      escalationMs: DISPATCH_ESCALATION_MS,
    });

    if (result?.secondWaveCount > 0) {
      await enqueueDispatchEscalationJob({
        bookingId,
        delayMs: DISPATCH_ESCALATION_MS,
      });
    }

    logger.info(
      `[dispatch-worker] Completed created dispatch for booking ${bookingId} (firstWave=${result?.firstWaveCount || 0}, secondWave=${result?.secondWaveCount || 0})`
    );
    return;
  }

  if (job.name === DISPATCH_JOB_NAMES.bookingEscalate) {
    const result = await processDispatchEscalation(bookingId, {
      escalationMs: DISPATCH_ESCALATION_MS,
    });

    logger.info(
      `[dispatch-worker] Completed escalation for booking ${bookingId} (notified=${result?.secondWaveCount || 0})`
    );
    return;
  }

  if (job.name === DISPATCH_JOB_NAMES.bookingExpire) {
    const result = await expirePendingBookingById(bookingId);
    logger.info(
      `[dispatch-worker] Completed expiry check for booking ${bookingId} (expired=${Boolean(result?.expired)})`
    );
    return;
  }

  logger.warn(`[dispatch-worker] Unknown job name: ${job.name}`);
};

const startDispatchWorker = () => {
  if (dispatchWorker) return dispatchWorker;

  dispatchWorker = new Worker(DISPATCH_QUEUE_NAME, processDispatchJob, {
    connection: buildRedisConnection(),
    concurrency: 5,
  });

  dispatchWorker.on('ready', () => {
    logger.info('[dispatch-worker] Worker ready');
  });

  dispatchWorker.on('completed', (job) => {
    logger.info(`[dispatch-worker] Job completed: ${job.name} (${job.id})`);
  });

  dispatchWorker.on('failed', (job, error) => {
    logger.error(
      `[dispatch-worker] Job failed: ${job?.name} (${job?.id}) - ${error?.message}`
    );
  });

  dispatchWorker.on('error', (error) => {
    logger.error(`[dispatch-worker] Worker error: ${error.message}`);
  });

  return dispatchWorker;
};

if (require.main === module) {
  startDispatchWorker();
}

module.exports = {
  startDispatchWorker,
};

