const Warehouse = require('../models/Warehouse');
const { validationResult } = require('express-validator');

// @desc    Get all warehouses
// @route   GET /api/warehouses
// @access  Private
exports.getWarehouses = async (req, res, next) => {
    try {
        let query;

        // Filter by region if provided
        if (req.query.regionId) {
            query = Warehouse.find({ region: req.query.regionId });
        } else {
            query = Warehouse.find();
        }

        // Populate region details
        query = query.populate({
            path: 'region',
            select: 'name active',
        });

        const warehouses = await query;

        res.status(200).json({
            success: true,
            count: warehouses.length,
            data: warehouses,
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get single warehouse
// @route   GET /api/warehouses/:id
// @access  Private
exports.getWarehouse = async (req, res, next) => {
    try {
        const warehouse = await Warehouse.findById(req.params.id).populate('region');

        if (!warehouse) {
            return res.status(404).json({
                success: false,
                message: `Warehouse not found with id of ${req.params.id}`,
            });
        }

        res.status(200).json({
            success: true,
            data: warehouse,
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Create new warehouse
// @route   POST /api/warehouses
// @access  Private (Admin)
exports.createWarehouse = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const warehouse = await Warehouse.create(req.body);

        res.status(201).json({
            success: true,
            data: warehouse,
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Update warehouse
// @route   PUT /api/warehouses/:id
// @access  Private (Admin)
exports.updateWarehouse = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        let warehouse = await Warehouse.findById(req.params.id);

        if (!warehouse) {
            return res.status(404).json({
                success: false,
                message: `Warehouse not found with id of ${req.params.id}`,
            });
        }

        warehouse = await Warehouse.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true,
        });

        res.status(200).json({
            success: true,
            data: warehouse,
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Delete warehouse
// @route   DELETE /api/warehouses/:id
// @access  Private (Admin)
exports.deleteWarehouse = async (req, res, next) => {
    try {
        const warehouse = await Warehouse.findById(req.params.id);

        if (!warehouse) {
            return res.status(404).json({
                success: false,
                message: `Warehouse not found with id of ${req.params.id}`,
            });
        }

        await warehouse.deleteOne();

        res.status(200).json({
            success: true,
            data: {},
        });
    } catch (error) {
        next(error);
    }
};
