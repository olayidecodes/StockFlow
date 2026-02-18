const express = require('express');
const { body } = require('express-validator');
const {
    getCategories,
    getCategory,
    createCategory,
    updateCategory,
    deleteCategory,
    getCategoryProducts,
} = require('../controllers/category.controller');
const { protect } = require('../middleware/auth');
const { checkPermission } = require('../middleware/checkPermission');
const { PERMISSIONS } = require('../config/constants');

const router = express.Router();

// Apply auth middleware to all routes
router.use(protect);

// Routes
router
    .route('/')
    .get(checkPermission(PERMISSIONS.VIEW_INVENTORY), getCategories)
    .post(
        checkPermission(PERMISSIONS.MANAGE_INVENTORY),
        [
            body('name').notEmpty().withMessage('Category name is required'),
        ],
        createCategory
    );

// Get products by category (must be before /:id route)
router
    .route('/:id/products')
    .get(checkPermission(PERMISSIONS.VIEW_INVENTORY), getCategoryProducts);

router
    .route('/:id')
    .get(checkPermission(PERMISSIONS.VIEW_INVENTORY), getCategory)
    .put(
        checkPermission(PERMISSIONS.MANAGE_INVENTORY),
        [
            body('name').optional().notEmpty().withMessage('Category name cannot be empty'),
        ],
        updateCategory
    )
    .delete(
        checkPermission(PERMISSIONS.MANAGE_INVENTORY),
        deleteCategory
    );

module.exports = router;
