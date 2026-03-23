const SORTemplate = require('../models/SORTemplate');

// @desc    Create SOR template
// @route   POST /api/sor/templates
// @access  Staff
exports.createTemplate = async (req, res, next) => {
    try {
        const { name, customer, region, warehouse, items } = req.body;

        // Validate required fields
        if (!name) {
            return res.status(400).json({ success: false, message: 'Template name is required', field: 'name' });
        }
        if (!customer) {
            return res.status(400).json({ success: false, message: 'Customer is required', field: 'customer' });
        }
        if (!region) {
            return res.status(400).json({ success: false, message: 'Region is required', field: 'region' });
        }
        if (!warehouse) {
            return res.status(400).json({ success: false, message: 'Warehouse is required', field: 'warehouse' });
        }

        // Validate items array is non-empty (Req 2.2)
        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ success: false, message: 'Items array must not be empty' });
        }

        const template = await SORTemplate.create({
            name,
            customer,
            region,
            warehouse,
            items,
            createdBy: req.user.id,
        });

        res.status(201).json({ success: true, data: template });
    } catch (error) {
        // Handle duplicate key error for compound unique index { customer, name } (Req 2.7)
        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: 'Template name already exists for this customer',
            });
        }
        next(error);
    }
};

// @desc    Get all templates for a customer
// @route   GET /api/sor/templates?customer=:id
// @access  Staff
exports.getTemplates = async (req, res, next) => {
    try {
        const { customer } = req.query;

        if (!customer) {
            return res.status(400).json({ success: false, message: 'Customer ID is required', field: 'customer' });
        }

        const templates = await SORTemplate.find({ customer })
            .populate('region', 'name')
            .populate('warehouse', 'name')
            .populate('items.product', 'name sku')
            .sort({ createdAt: -1 });

        res.status(200).json({ success: true, count: templates.length, data: templates });
    } catch (error) {
        next(error);
    }
};

// @desc    Update SOR template
// @route   PUT /api/sor/templates/:id
// @access  Staff
exports.updateTemplate = async (req, res, next) => {
    try {
        const template = await SORTemplate.findById(req.params.id);

        if (!template) {
            return res.status(404).json({ success: false, message: 'SOR template not found' });
        }

        const { name, region, warehouse, items } = req.body;

        // Validate items array is non-empty if provided (Req 2.2, 2.3)
        if (items !== undefined) {
            if (!Array.isArray(items) || items.length === 0) {
                return res.status(400).json({ success: false, message: 'Items array must not be empty' });
            }
        }

        const updated = await SORTemplate.findByIdAndUpdate(
            req.params.id,
            { name, region, warehouse, items },
            { new: true, runValidators: true, omitUndefined: true }
        );

        res.status(200).json({ success: true, data: updated });
    } catch (error) {
        // Handle duplicate key error for compound unique index { customer, name } (Req 2.7)
        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: 'Template name already exists for this customer',
            });
        }
        next(error);
    }
};

// @desc    Delete SOR template
// @route   DELETE /api/sor/templates/:id
// @access  Staff
exports.deleteTemplate = async (req, res, next) => {
    try {
        const template = await SORTemplate.findById(req.params.id);

        if (!template) {
            return res.status(404).json({ success: false, message: 'SOR template not found' });
        }

        await template.deleteOne();

        res.status(200).json({ success: true, data: {} });
    } catch (error) {
        next(error);
    }
};
