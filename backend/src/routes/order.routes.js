const express = require('express');
const { body } = require('express-validator');
const {
    createOrder,
    getOrders,
    getOrder,
    updateOrderStatus,
    updateOrder,
    updatePaymentStatus,
    downloadReceipt,
    downloadInvoice,
} = require('../controllers/order.controller');
const { checkPermission } = require('../middleware/checkPermission');
const { PERMISSIONS } = require('../config/constants');
const { protect } = require('../middleware/auth');
const validateCountryAccess = require('../middleware/validateCountryAccess');
const router = express.Router();

router.use(protect);
router.use(validateCountryAccess);

router
    .route('/')
    .post(
        [
            body('customer.name').notEmpty().withMessage('Customer name is required'),
            body('region').notEmpty().withMessage('Region is required'),
            body('warehouse').notEmpty().withMessage('Warehouse is required'),
            body('items').isArray({ min: 1 }).withMessage('Items must be at least 1 product'),
            body('items.*.product').notEmpty().withMessage('Product ID is required'),
            body('items.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be positive integer'),
        ],
        createOrder
    )
    .get(getOrders);

router.route('/:id').get(getOrder);

router.put('/:id', checkPermission(PERMISSIONS.MANAGE_ORDERS), updateOrder);

router.put('/:id/status', updateOrderStatus);

router.patch('/:id/payment-status', checkPermission(PERMISSIONS.MANAGE_ORDERS), updatePaymentStatus);

router.get('/:id/receipt', downloadReceipt);

router.get('/:id/invoice', downloadInvoice);

module.exports = router;
