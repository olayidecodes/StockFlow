const express = require('express');
const {
    getCountries,
    createCountry,
    updateCountry,
    getUserAssignments,
    setUserAssignments,
} = require('../controllers/country.controller');
const { protect } = require('../middleware/auth');
const { checkPermission } = require('../middleware/checkPermission');
const { PERMISSIONS } = require('../config/constants');

const router = express.Router();

// All routes require authentication
router.use(protect);

// GET  /api/countries          — all authenticated users
// POST /api/countries          — admin only (MANAGE_SETTINGS)
router
    .route('/')
    .get(getCountries)
    .post(checkPermission(PERMISSIONS.MANAGE_SETTINGS), createCountry);

// PATCH /api/countries/:id     — admin only
router
    .route('/:id')
    .patch(checkPermission(PERMISSIONS.MANAGE_SETTINGS), updateCountry);

// GET /api/countries/:userId/assignments   — admin only
// PUT /api/countries/:userId/assignments   — admin only
router
    .route('/:userId/assignments')
    .get(checkPermission(PERMISSIONS.MANAGE_SETTINGS), getUserAssignments)
    .put(checkPermission(PERMISSIONS.MANAGE_SETTINGS), setUserAssignments);

module.exports = router;
