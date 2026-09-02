const express = require('express');
const { createSOROrder, getSOROrders } = require('../controllers/sor.order.controller');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');
const validateCountryAccess = require('../middleware/validateCountryAccess');

const router = express.Router();

// All routes require authentication
router.use(protect);
router.use(validateCountryAccess);

// Staff roles allowed for SOR order operations
const STAFF_ROLES = ['SALES', 'INVENTORY_MANAGER', 'ADMIN'];

router
    .route('/')
    .get(authorize(...STAFF_ROLES), getSOROrders)
    .post(authorize(...STAFF_ROLES), createSOROrder);

module.exports = router;
