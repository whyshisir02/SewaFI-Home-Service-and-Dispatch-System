const express = require('express');
const { authenticate, authorize } = require('../../middlewares/auth.middleware');
const { upload } = require('../../services/file.service');
const controller = require('./upload.controller');

const router = express.Router();

router.use(authenticate, authorize('ADMIN'));

router.post('/service-image', upload.single('image'), controller.uploadServiceImage);
router.post('/category-image', upload.single('image'), controller.uploadCategoryImage);

module.exports = router;
