const express = require('express');
const router = express.Router();
const ctrl = require('./notification.controller');
const { authenticate } = require('../../middlewares/auth.middleware');

router.use(authenticate);
router.get('/', ctrl.getMyNotifications);
router.get('/unread-count', ctrl.getUnreadCount);
router.patch('/:id/read', ctrl.markAsRead);
router.patch('/mark-all-read', ctrl.markAllAsRead);
router.patch('/read-all', ctrl.markAllAsRead);
router.delete('/:id', ctrl.deleteNotification);

module.exports = router;
