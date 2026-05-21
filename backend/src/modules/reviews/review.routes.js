const express = require('express');
const router = express.Router();
const ctrl = require('./review.controller');
const { authenticate, authorize } = require('../../middlewares/auth.middleware');
const { upload } = require('../../services/file.service');
const { reviewCreateLimiter } = require('../../middlewares/rate-limit.middleware');

router.post('/', reviewCreateLimiter, authenticate, authorize('CUSTOMER'), upload.array('photos', 5), ctrl.createReview);
router.get('/my', authenticate, ctrl.getMyReviews);
router.get('/received', authenticate, authorize('PROVIDER'), ctrl.getReceivedReviews);
router.get('/provider/:providerId', ctrl.getProviderReviews);
router.get('/all', authenticate, authorize('ADMIN'), ctrl.getAllReviews);

module.exports = router;
