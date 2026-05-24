const express = require('express');
const router = express.Router();
const ctrl = require('./notification.controller');
const { authenticate } = require('../../middlewares/auth.middleware');

router.use(authenticate);
router.get('/', ctrl.getMyNotifications);
router.get('/unread-count', ctrl.getUnreadCount);
router.get('/bell', ctrl.getBellNotifications);
router.get('/push/public-key', ctrl.getPushPublicKey);
router.post('/push/subscribe', ctrl.subscribePush);
router.post('/push/unsubscribe', ctrl.unsubscribePush);
router.post('/push/test', ctrl.sendPushTest);
router.patch('/archive-read', ctrl.archiveReadNotifications);
router.patch('/:id/archive', ctrl.archiveNotification);
router.patch('/:id/unarchive', ctrl.unarchiveNotification);
router.patch('/:id/read', ctrl.markAsRead);
router.patch('/mark-all-read', ctrl.markAllAsRead);
router.patch('/read-all', ctrl.markAllAsRead);
router.delete('/:id', ctrl.deleteNotification);

module.exports = router;
