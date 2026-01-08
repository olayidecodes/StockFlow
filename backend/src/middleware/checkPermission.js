const { hasPermission, hasAnyPermission, hasAllPermissions } = require('../config/constants');

// Middleware to check if user has required permission(s)
// Can accept a single permission or array of permissions
// By default, checks if user has ANY of the permissions (OR logic)
// Set requireAll: true to check if user has ALL permissions (AND logic)
const checkPermission = (permissions, options = {}) => {
    const { requireAll = false } = options;

    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Not authorized',
            });
        }

        const userRole = req.user.role;
        let hasAccess = false;

        if (requireAll) {
            // User must have ALL specified permissions
            hasAccess = hasAllPermissions(userRole, permissions);
        } else {
            // User must have AT LEAST ONE of the specified permissions
            hasAccess = hasAnyPermission(userRole, permissions);
        }

        if (!hasAccess) {
            const permissionsList = Array.isArray(permissions) ? permissions.join(', ') : permissions;
            return res.status(403).json({
                success: false,
                message: `Access denied. Required permission(s): ${permissionsList}`,
            });
        }

        next();
    };
};

module.exports = { checkPermission };
