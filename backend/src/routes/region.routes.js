const express = require('express');
const { body } = require('express-validator');
const {
    getRegions,
    getRegion,
    createRegion,
    updateRegion,
    deleteRegion,
} = require('../controllers/region.controller');
const { protect } = require('../middleware/auth');
const { checkPermission } = require('../middleware/checkPermission');
const { PERMISSIONS } = require('../config/constants');

const router = express.Router();

router.use(protect);

// Read: View Inventory (All authorized users usually can view locs)
// Write: Admin only (MANAGE_SETTINGS)
router
    .route('/')
    .get(checkPermission(PERMISSIONS.VIEW_INVENTORY), getRegions)
    .post(
        checkPermission(PERMISSIONS.MANAGE_SETTINGS),
        [
            body('name').notEmpty().withMessage('Region name is required'),
        ],
        createRegion
    );

router
    .route('/:id')
    .get(checkPermission(PERMISSIONS.VIEW_INVENTORY), getRegion)
    .put(
        checkPermission(PERMISSIONS.MANAGE_SETTINGS),
        updateRegion
    )
    .delete(
        checkPermission(PERMISSIONS.MANAGE_SETTINGS),
        deleteRegion
    );

module.exports = router;
