const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
    createBundle,
    getBundles,
    getBundle,
    updateBundle,
    deleteBundle
} = require('../controllers/bundle.controller');
const { protect } = require('../middleware/auth');
const { checkPermission } = require('../middleware/checkPermission');
const { PERMISSIONS } = require('../config/constants');

// Validation rules
const bundleValidation = [
    body('name').trim().notEmpty().withMessage('Bundle name is required'),
    body('products').isArray({ min: 1 }).withMessage('Bundle must contain at least one product'),
    body('products.*.product').notEmpty().withMessage('Product ID is required'),
    body('products.*.quantity').isInt({ min: 1 }).withMessage('Product quantity must be at least 1')
];

// All routes require authentication
router.use(protect);

router.route('/')
    .post(
        checkPermission(PERMISSIONS.MANAGE_INVENTORY),
        bundleValidation,
        createBundle
    )
    .get(checkPermission(PERMISSIONS.VIEW_INVENTORY), getBundles);

router.route('/:id')
    .get(checkPermission(PERMISSIONS.VIEW_INVENTORY), getBundle)
    .put(
        checkPermission(PERMISSIONS.MANAGE_INVENTORY),
        bundleValidation,
        updateBundle
    )
    .delete(
        checkPermission(PERMISSIONS.MANAGE_INVENTORY),
        deleteBundle
    );

module.exports = router;
