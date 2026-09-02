const express = require('express');
const { getDashboard } = require('../controllers/sor.dashboard.controller');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');
const validateCountryAccess = require('../middleware/validateCountryAccess');

const router = express.Router();

const STAFF_ROLES = ['SALES', 'INVENTORY_MANAGER', 'ADMIN'];

// All routes require authentication
router.use(protect);
router.use(validateCountryAccess);

// Req 6.1–6.4: Dashboard summary — Staff access
router.get('/', authorize(...STAFF_ROLES), getDashboard);

module.exports = router;
