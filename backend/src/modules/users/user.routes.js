const express = require('express');
const router = express.Router();
const ctrl = require('./user.controller');
const { authenticate, authorize, requireApprovedProvider } = require('../../middlewares/auth.middleware');
const validate = require('../../middlewares/validate.middleware');
const { upload } = require('../../services/file.service');
const { body } = require('express-validator');

const updateProfileValidation = [
  body('name')
    .optional()
    .isLength({ min: 2 })
    .withMessage('Name must be at least 2 characters')
    .trim()
    .escape(),

  body('phone')
    .optional()
    .isLength({ min: 10 })
    .withMessage('Phone must be at least 10 digits')
    .trim()
    .escape(),

  body('province').optional().trim().escape(),
  body('district').optional().trim().escape(),
  body('municipality').optional().trim().escape(),
  body('ward').optional().trim().escape(),
  body('streetAddress').optional().trim().escape(),

  body('tempProvince').optional().trim().escape(),
  body('tempDistrict').optional().trim().escape(),
  body('tempMunicipality').optional().trim().escape(),
  body('tempWard').optional().trim().escape(),
  body('tempStreetAddress').optional().trim().escape(),
];

router.use(authenticate);

router.get('/me', ctrl.getMyProfile);
router.patch('/me', validate(updateProfileValidation), ctrl.updateMyProfile);

router.patch('/me/avatar', upload.single('avatar'), ctrl.uploadAvatar);
router.patch('/profile/avatar', upload.single('avatar'), ctrl.uploadAvatar); // Alias for compatibility

// Pending providers should be able to update their profile/application info.
router.patch('/provider/profile', authorize('PROVIDER'), ctrl.updateProviderProfile);

// Pending providers can view their selected/listed services if the frontend needs it.
// Do not block this unless you specifically want only approved providers to view it.
router.get('/provider/services', authorize('PROVIDER'), ctrl.listProviderServices);

router.patch(
  '/provider/documents',
  authorize('PROVIDER'),
  upload.fields([
    { name: 'citizenshipFront', maxCount: 1 },
    { name: 'citizenshipBack', maxCount: 1 },
  ]),
  ctrl.updateProviderDocuments
);

// For resubmit document after rejection
router.patch('/provider/resubmit', authorize('PROVIDER'), ctrl.resubmitProviderApplication);

// Operational provider actions require approval.
router.patch(
  '/provider/availability',
  authorize('PROVIDER'),
  requireApprovedProvider,
  ctrl.updateProviderAvailability
);

router.post(
  '/provider/services',
  authorize('PROVIDER'),
  requireApprovedProvider,
  ctrl.addProviderService
);

router.delete(
  '/provider/services/:serviceId',
  authorize('PROVIDER'),
  requireApprovedProvider,
  ctrl.removeProviderService
);

// Admin user management
router.get('/', authorize('ADMIN'), ctrl.listUsers);
router.patch('/:id', authorize('ADMIN'), validate(updateProfileValidation), ctrl.updateUserByAdmin);
router.patch('/:id/toggle', authorize('ADMIN'), ctrl.toggleActive);

module.exports = router;