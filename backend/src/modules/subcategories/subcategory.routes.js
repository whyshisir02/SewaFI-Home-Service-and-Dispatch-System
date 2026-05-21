const express = require('express');
const router = express.Router();
const ctrl = require('./subcategory.controller');
const { authenticate, authorize } = require('../../middlewares/auth.middleware');

router.get('/', ctrl.list);
router.post('/', authenticate, authorize('ADMIN'), ctrl.create);
router.patch('/:id', authenticate, authorize('ADMIN'), ctrl.update);
router.delete('/:id', authenticate, authorize('ADMIN'), ctrl.remove);

module.exports = router;