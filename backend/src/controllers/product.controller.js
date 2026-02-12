const Product = require('../models/Product');
const { validationResult } = require('express-validator');

// @desc    Get all products
// @route   GET /api/products
// @access  Private (Auth users)
exports.getProducts = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 20;
        const startIndex = (page - 1) * limit;

        let queryParams = {};
        if (req.query.brandId) {
            queryParams.brand = req.query.brandId;
        }

        const total = await Product.countDocuments(queryParams);
        const products = await Product.find(queryParams)
            .populate({
                path: 'brand',
                select: 'name active',
            })
            .skip(startIndex)
            .limit(limit);

        res.status(200).json({
            success: true,
            count: products.length,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            },
            data: products,
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get single product
// @route   GET /api/products/:id
// @access  Private
exports.getProduct = async (req, res, next) => {
    try {
        const product = await Product.findById(req.params.id).populate('brand');

        if (!product) {
            return res.status(404).json({
                success: false,
                message: `Product not found with id of ${req.params.id}`,
            });
        }

        res.status(200).json({
            success: true,
            data: product,
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Create new product
// @route   POST /api/products
// @access  Private (Admin/Manager)
exports.createProduct = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        if (req.body.dimensions) {
            const { length, breadth, height } = req.body.dimensions;
            if (length && breadth && height) {
                req.body.volume = length * breadth * height;
            }
        }

        const product = await Product.create(req.body);

        res.status(201).json({
            success: true,
            data: product,
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Update product
// @route   PUT /api/products/:id
// @access  Private (Admin/Manager)
exports.updateProduct = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: `Product not found with id of ${req.params.id}`,
            });
        }

        // Check if carton size is being changed
        if (req.body.cartonSize && req.body.cartonSize !== product.cartonSize) {
            // TODO: Check if orders exist for this product
            // If orders exist, return 400 error
            // const ordersExist = await Order.countDocuments({ 'items.product': req.params.id });
            // if (ordersExist > 0) { ... }

            // For now, allow change as no orders system yet
        }

        // Recalculate volume if dimensions provided
        if (req.body.dimensions) {
            const { length, breadth, height } = req.body.dimensions;
            // Merge with existing if partial update? For simplicity assume full dimensions object or fetch existing
            // Mongoose update is atomic, but calculation needs values. 
            // Ideally frontend sends full dimensions.
            if (length !== undefined && breadth !== undefined && height !== undefined) {
                req.body.volume = length * breadth * height;
            }
        }

        const updatedProduct = await Product.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true,
        });

        res.status(200).json({
            success: true,
            data: updatedProduct,
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Delete product
// @route   DELETE /api/products/:id
// @access  Private (Admin only)
exports.deleteProduct = async (req, res, next) => {
    try {
        const product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: `Product not found with id of ${req.params.id}`,
            });
        }

        // TODO: Check for dependencies (stock, orders) before deleting

        await product.deleteOne();

        res.status(200).json({
            success: true,
            data: {},
        });
    } catch (error) {
        next(error);
    }
};
