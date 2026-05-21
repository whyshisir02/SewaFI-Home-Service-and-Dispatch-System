const express = require('express');
const router = express.Router();
const ctrl = require('./service.controller');
const { authenticate, authorize } = require('../../middlewares/auth.middleware');
const { upload } = require('../../services/file.service');

router.get('/', ctrl.listServices);
router.get('/categories', ctrl.getCategories);
router.get('/categories/:slug', ctrl.getCategoryBySlug);
router.get('/providers', ctrl.getProvidersByCategory);
router.get('/:id', ctrl.getService);

router.post('/categories', authenticate, authorize('ADMIN'), ctrl.createCategory);
router.patch('/categories/:id', authenticate, authorize('ADMIN'), ctrl.updateCategory);
router.delete('/categories/:id', authenticate, authorize('ADMIN'), ctrl.deleteCategory);

router.post('/', authenticate, authorize('ADMIN'), upload.single('image'), ctrl.createService);
router.patch('/:id', authenticate, authorize('ADMIN'), upload.single('image'), ctrl.updateService);
router.delete('/:id', authenticate, authorize('ADMIN'), ctrl.deleteService);

module.exports = router;
