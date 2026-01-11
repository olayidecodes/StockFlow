const User = require('../models/User');

// @desc    Get all users
// @route   GET /api/users
// @access  Private/Admin
exports.getUsers = async (req, res, next) => {
    try {
        const users = await User.find().select('-password').sort({ createdAt: -1 });
        res.status(200).json({ success: true, count: users.length, data: users });
    } catch (error) {
        next(error);
    }
};

// @desc    Get single user
// @route   GET /api/users/:id
// @access  Private/Admin
exports.getUser = async (req, res, next) => {
    try {
        const user = await User.findById(req.params.id).select('-password');
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });
        res.status(200).json({ success: true, data: user });
    } catch (error) {
        next(error);
    }
};

// @desc    Update user (Role, Active Status)
// @route   PUT /api/users/:id
// @access  Private/Admin
exports.updateUser = async (req, res, next) => {
    console.log('DEBUG: updateUser called. req:', !!req, 'res:', !!res, 'next type:', typeof next);
    try {
        const { role, isActive, isVerified } = req.body;

        let user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        // Prevent admin from removing their own admin status if they are the last one? 
        // For simplicity, just update fields provided
        if (role) user.role = role;
        if (typeof isActive === 'boolean') user.isActive = isActive;
        if (typeof isVerified === 'boolean') user.isVerified = isVerified;

        await user.save();

        res.status(200).json({ success: true, data: user });
    } catch (error) {
        console.error('Error in updateUser:', error);
        if (typeof next === 'function') {
            next(error);
        } else {
            res.status(500).json({ success: false, message: error.message || 'Server Error' });
        }
    }
};

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private/Admin
exports.deleteUser = async (req, res, next) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        await user.deleteOne();
        res.status(200).json({ success: true, data: {} });
    } catch (error) {
        next(error);
    }
};
