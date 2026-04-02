const express = require('express');
const { getStats, getCustomerAnalytics, getWarehouseMonthly } = require('../controllers/analytics.controller');
const { protect, authorize } = require('../middleware/auth');
const router = express.Router();

router.use(protect);

router.get('/', getStats);
router.get('/customers', getCustomerAnalytics);
router.get('/warehouse-monthly', getWarehouseMonthly);

module.exports = router;
