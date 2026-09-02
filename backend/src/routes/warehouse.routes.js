const express = require('express');
const { body } = require('express-validator');
const {
    getWarehouses,
    getWarehouse,
    createWarehouse,
    updateWarehouse,
    deleteWarehouse,
} = require('../controllers/warehouse.controller');
const { protect } = require('../middleware/auth');
const { checkPermission } = require('../middleware/checkPermission');
const { PERMISSIONS } = require('../config/constants');
const validateCountryAccess = require('../middleware/validateCountryAccess');

const router = express.Router();

router.use(protect);
router.use(validateCountryAccess);

router
    .route('/')
    .get(checkPermission(PERMISSIONS.VIEW_INVENTORY), getWarehouses)
    .post(
        checkPermission(PERMISSIONS.MANAGE_SETTINGS),
        [
            body('name').notEmpty().withMessage('Warehouse name is required'),
            body('region').notEmpty().withMessage('Region ID is required'),
        ],
        createWarehouse
    );

router
    .route('/:id')
    .get(checkPermission(PERMISSIONS.VIEW_INVENTORY), getWarehouse)
    .put(
        checkPermission(PERMISSIONS.MANAGE_SETTINGS),
        updateWarehouse
    )
    .delete(
        checkPermission(PERMISSIONS.MANAGE_SETTINGS),
        deleteWarehouse
    );

module.exports = router;
