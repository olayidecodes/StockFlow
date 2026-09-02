const express = require('express');
const { getFinancials } = require('../controllers/financials.controller');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');
const validateCountryAccess = require('../middleware/validateCountryAccess');

const router = express.Router();

// Admin only access
router.use(protect);
router.use(authorize('ADMIN'));
router.use(validateCountryAccess);

router.get('/', getFinancials);

module.exports = router;
