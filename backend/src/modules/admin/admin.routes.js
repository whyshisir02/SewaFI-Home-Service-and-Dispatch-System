const express = require('express');
const router = express.Router();

const ctrl = require('./admin.controller');
const paymentController = require('../payments/payment.controller');
const serviceController = require('../services/service.controller');
const { authenticate, authorize } = require('../../middlewares/auth.middleware');

router.use(authenticate, authorize('ADMIN'));

// Provider approval
router.get('/providers/pending', ctrl.getPendingProviders);
router.patch('/providers/:id/approve', ctrl.approveProvider);
router.patch('/providers/:id/reject', ctrl.rejectProvider);

// Admin users
router.get('/users', ctrl.listAdminUsers);
router.get('/users/stats', ctrl.getUserStats);
router.get('/users/:id', ctrl.getAdminUserById);
router.patch('/users/:id/suspend', ctrl.suspendAdminUser);
router.patch('/users/:id/activate', ctrl.activateAdminUser);
router.delete('/users/:id', ctrl.deleteAdminUser);

// Admin providers
router.get('/providers', ctrl.listAdminProviders);
router.get('/providers/stats', ctrl.getProviderStats);
router.get('/providers/:id', ctrl.getAdminProviderById);

// Admin bookings
router.get('/bookings', ctrl.listAdminBookings);
router.get('/bookings/stats', ctrl.getBookingStats);
router.get('/bookings/:id', ctrl.getAdminBookingById);

// Admin services
router.get('/services', ctrl.listAdminServices);
router.post('/services', serviceController.createService);

// fixed route must come before /services/:id
router.get('/services/stats', ctrl.getServiceStats);
router.patch('/services/:id/status', ctrl.updateServiceStatus);

router.get('/services/:id', serviceController.getService);
router.patch('/services/:id', serviceController.updateService);
router.delete('/services/:id', serviceController.deleteService);

// Admin categories
router.get('/categories', ctrl.listAdminCategories);
router.post('/categories', serviceController.createCategory);

// fixed/status route must come before /categories/:slug
router.patch('/categories/:id/status', ctrl.updateCategoryStatus);

router.get('/categories/:slug', serviceController.getCategoryBySlug);
router.patch('/categories/:id', serviceController.updateCategory);
router.delete('/categories/:id', serviceController.deleteCategory);

// Dashboard
router.get('/dashboard', ctrl.getDashboardStats);

// Payments
router.get('/payments', paymentController.listAdminPayments);
router.get('/payments/stats', paymentController.getAdminPaymentStats);
router.get('/payments/:id', paymentController.getAdminPaymentById);
router.patch('/payments/:paymentId/resolve-dispute', paymentController.resolveAdminPaymentDispute);
router.patch('/payments/:paymentId/settle-provider', paymentController.settleAdminProviderPayment);
router.patch('/payments/:paymentId', paymentController.updateAdminPayment);

// Analytics
router.get('/stats', ctrl.getDashboardStats);
router.get('/charts/revenue', ctrl.getRevenueChart);
router.get('/charts/top-providers', ctrl.getTopProviders);
router.get('/charts/categories', ctrl.getCategoryStats);
router.get('/charts/booking-status', ctrl.getBookingStatusStats);
router.get('/recent-bookings', ctrl.getRecentBookings);
router.get('/reviews', ctrl.getAllReviews);

module.exports = router;
