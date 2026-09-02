const express = require('express');
const { recordPayment, getPayments, deletePayment } = require('../controllers/sor.payment.controller');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');
const validateCountryAccess = require('../middleware/validateCountryAccess');

const router = express.Router();

// All routes require authentication
router.use(protect);
router.use(validateCountryAccess);

const STAFF_ROLES = ['SALES', 'INVENTORY_MANAGER', 'ADMIN'];

// Req 7.1/7.2: Staff can create/read; Admin-only on DELETE
router
    .route('/')
    .get(authorize(...STAFF_ROLES), getPayments)
    .post(authorize(...STAFF_ROLES), recordPayment);

router
    .route('/:id')
    .delete(authorize('ADMIN'), deletePayment);

module.exports = router;
