const express = require('express');
const { body } = require('express-validator');
const {
    createOrder,
    getOrders,
    getOrder,
    updateOrderStatus,
    downloadReceipt,
} = require('../controllers/order.controller');
const { protect } = require('../middleware/auth');
const router = express.Router();

router.use(protect);

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

router.put('/:id/status', updateOrderStatus);

router.get('/:id/receipt', downloadReceipt);

module.exports = router;
