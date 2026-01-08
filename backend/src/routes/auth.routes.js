const express = require('express');
const { body } = require('express-validator');
const {
    register,
    login,
    getMe,
} = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Register
router.post(
    '/register',
    [
        body('email').isEmail().withMessage('Please provide a valid email'),
        body('password')
            .isLength({ min: 6 })
            .withMessage('Password must be at least 6 characters'),
        body('role').notEmpty().withMessage('Role is required'),
    ],
    register
);

// Login
router.post(
    '/login',
    [
        body('email').isEmail().withMessage('Please provide a valid email'),
        body('password').notEmpty().withMessage('Password is required'),
    ],
    login
);

// Get current user
router.get('/me', protect, getMe);

module.exports = router;
