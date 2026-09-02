const mongoose = require('mongoose');
const Country = require('../models/Country');

/**
 * Middleware: validateCountryAccess
 *
 * Extracts countryId from request (query → body → params), verifies the
 * country exists and is active, enforces country assignment restrictions for
 * INVENTORY_MANAGER users, and attaches req.countryId for downstream use.
 */
const validateCountryAccess = async (req, res, next) => {
    try {
        // 1. Extract countryId — query takes priority, then body, then route params
        const rawId =
            req.query.countryId ||
            (req.body && req.body.countryId) ||
            req.params.countryId;

        if (!rawId) {
            return res.status(400).json({
                success: false,
                message: 'countryId is required',
            });
        }

        // 2. Validate ObjectId format
        if (!mongoose.Types.ObjectId.isValid(rawId)) {
            return res.status(400).json({
                success: false,
                message: 'Country not found or inactive',
            });
        }

        // 3. Verify country exists and is active
        const country = await Country.findOne({
            _id: rawId,
            isActive: true,
        });

        if (!country) {
            return res.status(400).json({
                success: false,
                message: 'Country not found or inactive',
            });
        }

        // 4. For INVENTORY_MANAGER with non-empty assignments, verify access
        if (
            req.user &&
            req.user.role === 'INVENTORY_MANAGER' &&
            req.user.countryAssignments &&
            req.user.countryAssignments.length > 0
        ) {
            const hasAccess = req.user.countryAssignments.some(
                (assignedId) => assignedId.toString() === country._id.toString()
            );

            if (!hasAccess) {
                return res.status(403).json({
                    success: false,
                    message: 'Access to this country is not permitted',
                });
            }
        }

        // 5. Attach countryId as ObjectId for controllers
        req.countryId = country._id;
        next();
    } catch (err) {
        next(err);
    }
};

module.exports = validateCountryAccess;
