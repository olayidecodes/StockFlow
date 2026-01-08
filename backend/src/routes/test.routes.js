const express = require('express');
const { protect } = require('../middleware/auth');
const { checkPermission } = require('../middleware/checkPermission');
const { PERMISSIONS } = require('../config/constants');

const router = express.Router();

// Public route
router.get('/public', (req, res) => {
    res.json({ message: 'Public endpoint accessible to everyone' });
});

// Authenticated route (any role)
router.get('/authenticated', protect, (req, res) => {
    res.json({ message: `Authenticated as ${req.user.role}`, user: req.user });
});

// Admin only (MANAGE_USERS)
router.get(
    '/admin-only',
    protect,
    checkPermission(PERMISSIONS.MANAGE_USERS),
    (req, res) => {
        res.json({ message: 'Admin access granted', role: req.user.role });
    }
);

// Inventory Manager (MANAGE_INVENTORY)
router.get(
    '/inventory/manage',
    protect,
    checkPermission(PERMISSIONS.MANAGE_INVENTORY),
    (req, res) => {
        res.json({ message: 'Inventory management access granted', role: req.user.role });
    }
);

// Sales (CREATE_ORDERS)
router.get(
    '/orders/create',
    protect,
    checkPermission(PERMISSIONS.CREATE_ORDERS),
    (req, res) => {
        res.json({ message: 'Order creation access granted', role: req.user.role });
    }
);

// Multiple permissions (VIEW_INVENTORY OR VIEW_ORDERS)
router.get(
    '/viewer-access',
    protect,
    checkPermission([PERMISSIONS.VIEW_INVENTORY, PERMISSIONS.VIEW_ORDERS]),
    (req, res) => {
        res.json({ message: 'Viewer access granted', role: req.user.role });
    }
);

module.exports = router;
