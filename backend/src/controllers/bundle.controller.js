const Bundle = require('../models/Bundle');
const { validationResult } = require('express-validator');

// @desc    Create new bundle
// @route   POST /api/bundles
// @access  Private (Manage Inventory)
exports.createBundle = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const { name, description, products, status } = req.body;

        // Validate that products array is not empty
        if (!products || products.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Bundle must contain at least one product'
            });
        }

        const bundle = await Bundle.create({
            name,
            description,
            products,
            status,
            createdBy: req.user.id
        });

        const populatedBundle = await Bundle.findById(bundle._id)
            .populate('products.product', 'name sku cartonSize price wholesaleCost');

        res.status(201).json({
            success: true,
            data: populatedBundle
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'Bundle name already exists'
            });
        }
        next(error);
    }
};

// @desc    Get all bundles
// @route   GET /api/bundles
// @access  Private
exports.getBundles = async (req, res, next) => {
    try {
        const { status } = req.query;
        const query = {};

        if (status) query.status = status;

        const bundles = await Bundle.find(query)
            .populate('products.product', 'name sku cartonSize price wholesaleCost')
            .populate('createdBy', 'name email')
            .populate('priceHistory.editedBy', 'username email')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: bundles.length,
            data: bundles
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get single bundle
// @route   GET /api/bundles/:id
// @access  Private
exports.getBundle = async (req, res, next) => {
    try {
        const bundle = await Bundle.findById(req.params.id)
            .populate('products.product', 'name sku cartonSize price wholesaleCost')
            .populate('createdBy', 'name email')
            .populate('priceHistory.editedBy', 'username email');

        if (!bundle) {
            return res.status(404).json({
                success: false,
                message: 'Bundle not found'
            });
        }

        res.status(200).json({
            success: true,
            data: bundle
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Update bundle
// @route   PUT /api/bundles/:id
// @access  Private (Manage Inventory)
exports.updateBundle = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        let bundle = await Bundle.findById(req.params.id);

        if (!bundle) {
            return res.status(404).json({
                success: false,
                message: 'Bundle not found'
            });
        }

        const { name, description, products, status } = req.body;

        // Validate that products array is not empty if provided
        if (products && products.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Bundle must contain at least one product'
            });
        }

        bundle = await Bundle.findByIdAndUpdate(
            req.params.id,
            { name, description, products, status },
            { new: true, runValidators: true }
        ).populate('products.product', 'name sku cartonSize price wholesaleCost');

        res.status(200).json({
            success: true,
            data: bundle
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'Bundle name already exists'
            });
        }
        next(error);
    }
};

// @desc    Delete bundle
// @route   DELETE /api/bundles/:id
// @access  Private (Manage Inventory)
exports.deleteBundle = async (req, res, next) => {
    try {
        const bundle = await Bundle.findById(req.params.id);

        if (!bundle) {
            return res.status(404).json({
                success: false,
                message: 'Bundle not found'
            });
        }

        await bundle.deleteOne();

        res.status(200).json({
            success: true,
            data: {}
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Update bundle retail price (discount override)
// @route   PUT /api/bundles/:id/price
// @access  Private (Manage Inventory)
exports.updateBundlePrice = async (req, res, next) => {
    try {
        const bundle = await Bundle.findById(req.params.id);

        if (!bundle) {
            return res.status(404).json({
                success: false,
                message: 'Bundle not found'
            });
        }

        const { retailPrice, reason } = req.body;

        // Record price change in history
        bundle.priceHistory.push({
            previousPrice: bundle.retailPrice,
            newPrice: retailPrice !== undefined && retailPrice !== '' ? Number(retailPrice) : null,
            reason: reason || '',
            editedBy: req.user.id,
            editedAt: new Date()
        });

        // Update the retail price (null = revert to calculated)
        bundle.retailPrice = retailPrice !== undefined && retailPrice !== '' ? Number(retailPrice) : null;

        await bundle.save();

        const populatedBundle = await Bundle.findById(bundle._id)
            .populate('products.product', 'name sku cartonSize price wholesaleCost')
            .populate('priceHistory.editedBy', 'username email')
            .populate('createdBy', 'name email');

        res.status(200).json({
            success: true,
            data: populatedBundle
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get bundle price edit history
// @route   GET /api/bundles/:id/price-history
// @access  Private (View Inventory)
exports.getBundlePriceHistory = async (req, res, next) => {
    try {
        const bundle = await Bundle.findById(req.params.id)
            .select('name retailPrice priceHistory')
            .populate('priceHistory.editedBy', 'username email');

        if (!bundle) {
            return res.status(404).json({
                success: false,
                message: 'Bundle not found'
            });
        }

        // Return history sorted newest-first
        const history = [...bundle.priceHistory].reverse();

        res.status(200).json({
            success: true,
            data: {
                bundleName: bundle.name,
                currentRetailPrice: bundle.retailPrice,
                history
            }
        });
    } catch (error) {
        next(error);
    }
};
