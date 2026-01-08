const Region = require('../models/Region');
const { validationResult } = require('express-validator');

// @desc    Get all regions
// @route   GET /api/regions
// @access  Private
exports.getRegions = async (req, res, next) => {
    try {
        // Populate virtual warehouses
        const regions = await Region.find()
            .populate('warehouses')
            .sort({ name: 1 });

        res.status(200).json({
            success: true,
            count: regions.length,
            data: regions,
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get single region
// @route   GET /api/regions/:id
// @access  Private
exports.getRegion = async (req, res, next) => {
    try {
        const region = await Region.findById(req.params.id).populate('warehouses');

        if (!region) {
            return res.status(404).json({
                success: false,
                message: `Region not found with id of ${req.params.id}`,
            });
        }

        res.status(200).json({
            success: true,
            data: region,
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Create new region
// @route   POST /api/regions
// @access  Private (Admin - MANAGE_SETTINGS/INVENTORY)
exports.createRegion = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const region = await Region.create(req.body);

        res.status(201).json({
            success: true,
            data: region,
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Update region
// @route   PUT /api/regions/:id
// @access  Private (Admin)
exports.updateRegion = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        let region = await Region.findById(req.params.id);

        if (!region) {
            return res.status(404).json({
                success: false,
                message: `Region not found with id of ${req.params.id}`,
            });
        }

        region = await Region.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true,
        });

        res.status(200).json({
            success: true,
            data: region,
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Delete region
// @route   DELETE /api/regions/:id
// @access  Private (Admin)
exports.deleteRegion = async (req, res, next) => {
    try {
        const region = await Region.findById(req.params.id);

        if (!region) {
            return res.status(404).json({
                success: false,
                message: `Region not found with id of ${req.params.id}`,
            });
        }

        // TODO: proper check for warehouse dependency before delete

        await region.deleteOne();

        res.status(200).json({
            success: true,
            data: {},
        });
    } catch (error) {
        next(error);
    }
};
