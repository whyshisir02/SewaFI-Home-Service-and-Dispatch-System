const logger = require('../../config/logger');
const notificationService = require('../../services/notification.service');

const DAY_MS = 24 * 60 * 60 * 1000;
let cleanupTimer = null;

const runNotificationCleanup = async () => {
  try {
    const summary = await notificationService.cleanupNotifications();
    return summary;
  } catch (error) {
    logger.error(`[notifications] cleanup failed: ${error.message}`);
    return {
      archivedReadCount: 0,
      archivedExpiredCount: 0,
      deletedArchivedCount: 0,
    };
  }
};

const startNotificationCleanupScheduler = () => {
  if (cleanupTimer) return cleanupTimer;

  runNotificationCleanup();

  cleanupTimer = setInterval(() => {
    runNotificationCleanup();
  }, DAY_MS);

  if (typeof cleanupTimer.unref === 'function') {
    cleanupTimer.unref();
  }

  logger.info('[notifications] daily cleanup scheduler started');
  return cleanupTimer;
};

module.exports = {
  runNotificationCleanup,
  startNotificationCleanupScheduler,
};
