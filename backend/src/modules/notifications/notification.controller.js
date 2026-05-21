const notificationService = require('../../services/notification.service');
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

const deleteNotification = asyncHandler(async (req, res) => {
  const deleted = await notificationService.deleteNotification(req.params.id, req.user.id);

  if (!deleted) {
    throw new ApiError(404, 'Notification not found');
  }

  res.json(new ApiResponse(200, deleted, 'Notification deleted'));
});

module.exports = {
  getMyNotifications,
  markAsRead,
  markAllAsRead,
  getUnreadCount,
  deleteNotification,
};
