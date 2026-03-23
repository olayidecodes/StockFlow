const express = require('express');
const {
    createTemplate,
    getTemplates,
    updateTemplate,
    deleteTemplate,
} = require('../controllers/sor.template.controller');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');

const router = express.Router();

// All routes require authentication
router.use(protect);

// Staff roles allowed for SOR template operations
const STAFF_ROLES = ['SALES', 'INVENTORY_MANAGER', 'ADMIN'];

router
    .route('/')
    .get(authorize(...STAFF_ROLES), getTemplates)
    .post(authorize(...STAFF_ROLES), createTemplate);

router
    .route('/:id')
    .put(authorize(...STAFF_ROLES), updateTemplate)
    .delete(authorize(...STAFF_ROLES), deleteTemplate);

module.exports = router;
