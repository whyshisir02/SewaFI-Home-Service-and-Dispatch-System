const express = require('express');
const controller = require('./provider.controller');
const { authenticate, authorize, requireApprovedProvider } = require('../../middlewares/auth.middleware');

const router = express.Router();

router.use(authenticate, authorize('PROVIDER'));

router.get('/me', controller.getMyProviderProfile);
router.patch('/me', controller.updateMyProviderProfile);
router.patch('/me/availability', requireApprovedProvider, controller.updateMyAvailability);
router.patch('/me/schedule', requireApprovedProvider, controller.updateMySchedule);
router.get('/me/services', controller.listProviderServices);
router.post('/me/services', requireApprovedProvider, controller.addProviderService);
router.delete('/me/services/:serviceId', requireApprovedProvider, controller.removeProviderService);

router.get('/me/areas', controller.listProviderAreas);
router.post('/me/areas', requireApprovedProvider, controller.addProviderArea);
router.delete('/me/areas/:areaId', requireApprovedProvider, controller.removeProviderArea);

router.get('/nearby-jobs', requireApprovedProvider, controller.getNearbyJobs);
router.get('/assigned-jobs', requireApprovedProvider, controller.getAssignedJobs);
router.get('/earnings', requireApprovedProvider, controller.getEarnings);
router.patch('/bookings/:bookingId/submit-final-amount', requireApprovedProvider, controller.submitFinalAmount);

module.exports = router;
