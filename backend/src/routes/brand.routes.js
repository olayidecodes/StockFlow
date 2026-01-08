const express = require('express');
const { body } = require('express-validator');
const {
    getBrands,
    getBrand,
    createBrand,
    updateBrand,
    deleteBrand,
} = require('../controllers/brand.controller');
const { protect } = require('../middleware/auth');
const { checkPermission } = require('../middleware/checkPermission');
const { PERMISSIONS, ROLES } = require('../config/constants');

const router = express.Router();

// Apply auth middleware to all routes
router.use(protect);

// Routes
router
    .route('/')
    .get(checkPermission(PERMISSIONS.VIEW_INVENTORY), getBrands)
    .post(
        checkPermission(PERMISSIONS.MANAGE_INVENTORY),
        [
            body('name').notEmpty().withMessage('Brand name is required'),
        ],
        createBrand
    );

router
    .route('/:id')
    .get(checkPermission(PERMISSIONS.VIEW_INVENTORY), getBrand)
    .put(
        checkPermission(PERMISSIONS.MANAGE_INVENTORY),
        [
            body('name').optional().notEmpty().withMessage('Brand name cannot be empty'),
        ],
        updateBrand
    )
    .delete(
        // Specific role check for deleting (e.g., ADMIN only) if desired, 
        // or reusing Permission but higher level
        // Using simple role check for safety or assume MANAGE_INVENTORY is sufficient
        // Let's use MANAGE_INVENTORY but typically deletes are sensitive.
        // Task requirement: Admin can create/edit.
        checkPermission(PERMISSIONS.MANAGE_INVENTORY),
        deleteBrand
    );

module.exports = router;
