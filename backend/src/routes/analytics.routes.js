const express = require('express');
const { getStats } = require('../controllers/analytics.controller');
const { protect, authorize } = require('../middleware/auth');
const router = express.Router();

router.use(protect);
// Optional: restrict to Managers/Admins only if needed. For now allow all users.
// router.use(authorize('admin', 'manager'));

router.get('/', getStats);

module.exports = router;
