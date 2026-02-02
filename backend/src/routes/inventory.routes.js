const express = require('express');
const { body } = require('express-validator');
const {
    adjustStock,
    getBalance,
    getLedger,
    transferStock,
} = require('../controllers/inventory.controller');
const { protect } = require('../middleware/auth');
const { checkPermission } = require('../middleware/checkPermission');
const { PERMISSIONS } = require('../config/constants');

const router = express.Router();

router.use(protect);

router.post(
    '/adjust',
    checkPermission(PERMISSIONS.MANAGE_INVENTORY),
    [
        body('product').notEmpty().withMessage('Product ID is required'),
        body('warehouse').notEmpty().withMessage('Warehouse ID is required'),
        body('change').isNumeric().withMessage('Change amount (pieces) is required'),
        body('type')
            .isIn(['IN', 'OUT', 'ADJUSTMENT', 'TRANSFER_IN', 'TRANSFER_OUT'])
            .withMessage('Invalid adjustment type'),
        body('reason').notEmpty().withMessage('Reason is required'),
    ],
    adjustStock
);

router.post(
    '/transfer',
    checkPermission(PERMISSIONS.MANAGE_INVENTORY),
    [
        body('product').notEmpty().withMessage('Product ID is required'),
        body('sourceWarehouse').notEmpty().withMessage('Source warehouse ID is required'),
        body('destinationWarehouse').notEmpty().withMessage('Destination warehouse ID is required'),
        body('quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
        body('reason').notEmpty().withMessage('Reason is required'),
    ],
    transferStock
);

router.get('/balance', checkPermission(PERMISSIONS.VIEW_INVENTORY), getBalance);
router.get('/ledger', checkPermission(PERMISSIONS.VIEW_INVENTORY), getLedger);

module.exports = router;
