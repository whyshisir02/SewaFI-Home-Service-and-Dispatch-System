const notificationService = require('../../services/notification.service');
const webPushService = require('../../services/web-push.service');
const asyncHandler = require('../../utils/asyncHandler');
const ApiResponse = require('../../utils/ApiResponse');
const ApiError = require('../../utils/ApiError');

const getMyNotifications = asyncHandler(async (req, res) => {
  const result = await notificationService.getUserNotifications(req.user.id, req.query);
  res.json(new ApiResponse(200, result.notifications, 'Notifications fetched', result.meta));
});

const markAsRead = asyncHandler(async (req, res) => {
  await notificationService.markAsRead(req.params.id, req.user.id);
  res.json(new ApiResponse(200, {}, 'Marked as read'));
});

const markAllAsRead = asyncHandler(async (req, res) => {
  await notificationService.markAllAsRead(req.user.id);
  res.json(new ApiResponse(200, {}, 'All marked as read'));
});

const getUnreadCount = asyncHandler(async (req, res) => {
  const unreadCount = await notificationService.getUnreadCount(req.user.id);
  res.json(new ApiResponse(200, { unreadCount }, 'Unread notification count fetched'));
});

const getBellNotifications = asyncHandler(async (req, res) => {
  const notifications = await notificationService.getNotificationsForBell(req.user.id, req.query);
  res.json(new ApiResponse(200, notifications, 'Bell notifications fetched'));
});

const deleteNotification = asyncHandler(async (req, res) => {
  const deleted = await notificationService.deleteNotification(req.params.id, req.user.id);

  if (!deleted) {
    throw new ApiError(404, 'Notification not found');
  }

  res.json(new ApiResponse(200, deleted, 'Notification deleted'));
});

const archiveNotification = asyncHandler(async (req, res) => {
  const archived = await notificationService.archiveNotification(req.params.id, req.user.id);
  if (!archived) {
    throw new ApiError(404, 'Notification not found');
  }
  res.json(new ApiResponse(200, archived, 'Notification archived'));
});

const unarchiveNotification = asyncHandler(async (req, res) => {
  const restored = await notificationService.unarchiveNotification(req.params.id, req.user.id);
  if (!restored) {
    throw new ApiError(404, 'Notification not found');
  }
  res.json(new ApiResponse(200, restored, 'Notification restored'));
});

const archiveReadNotifications = asyncHandler(async (req, res) => {
  const result = await notificationService.archiveReadNotifications(req.user.id);
  res.json(new ApiResponse(200, result, 'Read notifications archived'));
});

const getPushPublicKey = asyncHandler(async (req, res) => {
  const config = webPushService.getPublicConfig();
  res.json(new ApiResponse(200, config, 'Push configuration fetched'));
});

const subscribePush = asyncHandler(async (req, res) => {
  if (!req.body?.endpoint || !req.body?.keys?.p256dh || !req.body?.keys?.auth) {
    throw new ApiError(400, 'Invalid push subscription payload');
  }

  const saved = await webPushService.subscribeUser({
    userId: req.user.id,
    subscription: req.body,
    userAgent: req.headers['user-agent'] || null,
  });
  res.json(new ApiResponse(200, saved, 'Push subscription saved'));
});

const unsubscribePush = asyncHandler(async (req, res) => {
  const endpoint = req.body?.endpoint;
  if (!endpoint) {
    throw new ApiError(400, 'endpoint is required');
  }

  const result = await webPushService.unsubscribeUser({
    userId: req.user.id,
    endpoint,
  });
  res.json(new ApiResponse(200, result, 'Push subscription updated'));
});

const sendPushTest = asyncHandler(async (req, res) => {
  const summary = await webPushService.sendTestToUser({
    userId: req.user.id,
    role: req.user.role,
  });

  res.json(new ApiResponse(200, summary, 'Push test executed'));
});

module.exports = {
  getMyNotifications,
  markAsRead,
  markAllAsRead,
  getUnreadCount,
  getBellNotifications,
  deleteNotification,
  archiveNotification,
  unarchiveNotification,
  archiveReadNotifications,
  getPushPublicKey,
  subscribePush,
  unsubscribePush,
  sendPushTest,
};
